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
            eventType: "PAYMENT",
          },
        }),
        // PaymentTransaction kaydı
        db.paymentTransaction.create({
          data: {
            orderId: order.id,
            type: "PAYMENT",
            status: "COMPLETED",
            amount: order.totalAmount,
            gatewayRef: merchantOid,
            gatewayData: { source: "paytr", totalAmount, status },
            note: "PayTR kredi kartı ödemesi",
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

      // Fire-and-forget: Sipariş onay SMS'i
      try {
        const { sendOrderEventSms } = await import("@/services/sms.service");
        const fullOrder = await db.order.findUnique({
          where: { orderNumber: merchantOid },
          include: { user: true, address: true },
        });
        if (fullOrder) {
          sendOrderEventSms(fullOrder, "SIPARIS_ONAYLANDI");
        }
      } catch (err) {
        console.error("[sms] Order confirmed SMS failed:", err);
      }

      // Fire-and-forget: Otomatik fatura oluştur
      try {
        const { issueInvoice } = await import("@/services/invoice.service");
        await issueInvoice(order.id);
      } catch (invoiceErr) {
        console.error("[invoice] Auto invoice failed:", invoiceErr);
      }
    } else {
      // Ödeme başarısız — siparişi silmek yerine FAILED durumuna çek
      await db.$transaction([
        db.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: "PENDING_PAYMENT",
            toStatus: "PENDING_PAYMENT",
            note: "PayTR ödeme başarısız",
            eventType: "PAYMENT",
          },
        }),
        db.paymentTransaction.create({
          data: {
            orderId: order.id,
            type: "PAYMENT",
            status: "FAILED",
            amount: order.totalAmount,
            gatewayRef: merchantOid,
            gatewayData: { source: "paytr", totalAmount, status },
            note: "PayTR kredi kartı ödemesi başarısız",
          },
        }),
      ]);
      console.log(`PayTR callback: payment failed for order ${merchantOid}, marked as FAILED`);
    }

    return new Response("OK");
  } catch (error) {
    console.error("PayTR callback error:", error);
    // Geçici hatalarda (DB bağlantı, timeout) FAIL dönüyoruz ki PayTR tekrar denesin.
    // PayTR en fazla birkaç kez retry yapar.
    return new Response("FAIL", { status: 500 });
  }
}
