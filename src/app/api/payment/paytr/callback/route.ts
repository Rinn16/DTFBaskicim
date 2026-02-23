import { db } from "@/lib/db";
import { verifyPaytrCallback } from "@/services/paytr.service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const merchantOid = formData.get("merchant_oid") as string;
    const status = formData.get("status") as string;
    const totalAmount = formData.get("total_amount") as string;
    const hash = formData.get("hash") as string;

    if (!merchantOid || !status || !totalAmount || !hash) {
      return new Response("FAIL", { status: 400 });
    }

    // HMAC doğrulama
    const isValid = verifyPaytrCallback({ merchantOid, status, totalAmount, hash });
    if (!isValid) {
      console.error("PayTR callback: invalid hash for", merchantOid);
      return new Response("FAIL", { status: 400 });
    }

    // Idempotency: sipariş zaten işlenmiş veya silinmiş olabilir
    const order = await db.order.findUnique({ where: { orderNumber: merchantOid } });
    if (!order) {
      // Sipariş bulunamadı — daha önce silinmiş (başarısız ödeme) veya hiç oluşmamış
      return new Response("OK");
    }

    if (order.paymentStatus !== "PENDING") {
      // Zaten işlenmiş, tekrar işleme
      return new Response("OK");
    }

    // Verify payment amount matches order total (totalAmount from PayTR is in kurus)
    const totalStr = String(order.totalAmount);
    const [intPart, decPart = ""] = totalStr.split(".");
    const expectedKurus = parseInt(intPart + (decPart + "00").slice(0, 2), 10);
    if (parseInt(totalAmount, 10) !== expectedKurus) {
      console.error(`PayTR callback: amount mismatch for ${merchantOid}. Expected ${expectedKurus}, got ${totalAmount}`);
      return new Response("FAIL", { status: 400 });
    }

    if (status === "success") {
      await db.$transaction([
        db.order.update({
          where: { orderNumber: merchantOid },
          data: {
            paymentStatus: "COMPLETED",
            status: "PROCESSING",
          },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: "PENDING_PAYMENT",
            toStatus: "PROCESSING",
            note: "PayTR ödeme başarılı",
          },
        }),
        // Ödeme başarılı — sepeti temizle
        ...(order.userId
          ? [db.cartItem.deleteMany({ where: { userId: order.userId } })]
          : []),
      ]);

      // Enqueue gang sheet export job
      try {
        const { exportQueue } = await import("@/lib/queue");
        await exportQueue.add(`export-${merchantOid}`, {
          orderId: order.id,
          orderNumber: merchantOid,
        });
      } catch (queueErr) {
        console.error("Failed to enqueue export job:", queueErr);
      }
    } else {
      // Ödeme başarısız — siparişi tamamen sil
      await db.order.delete({ where: { id: order.id } });
      console.log(`PayTR callback: payment failed, order ${merchantOid} deleted`);
    }

    return new Response("OK");
  } catch (error) {
    console.error("PayTR callback error:", error);
    return new Response("OK"); // PayTR'ye her zaman OK dön ki tekrar denemesin
  }
}
