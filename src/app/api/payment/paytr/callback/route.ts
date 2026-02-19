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

    // HMAC dogrulama
    const isValid = verifyPaytrCallback({ merchantOid, status, totalAmount, hash });
    if (!isValid) {
      console.error("PayTR callback: invalid hash for", merchantOid);
      return new Response("FAIL", { status: 400 });
    }

    // Idempotency: zaten islenmis mi?
    const order = await db.order.findUnique({ where: { orderNumber: merchantOid } });
    if (!order) {
      console.error("PayTR callback: order not found", merchantOid);
      return new Response("OK");
    }

    if (order.paymentStatus !== "PENDING") {
      // Zaten islenmis, tekrar isleme
      return new Response("OK");
    }

    if (status === "success") {
      await db.$transaction([
        db.order.update({
          where: { orderNumber: merchantOid },
          data: {
            paymentStatus: "COMPLETED",
            status: "PAYMENT_RECEIVED",
          },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: "PENDING_PAYMENT",
            toStatus: "PAYMENT_RECEIVED",
            note: "PayTR odeme basarili",
          },
        }),
      ]);
    } else {
      await db.$transaction([
        db.order.update({
          where: { orderNumber: merchantOid },
          data: {
            paymentStatus: "FAILED",
            status: "CANCELLED",
          },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: "PENDING_PAYMENT",
            toStatus: "CANCELLED",
            note: "Odeme basarisiz",
          },
        }),
      ]);
    }

    return new Response("OK");
  } catch (error) {
    console.error("PayTR callback error:", error);
    return new Response("OK"); // PayTR'ye her zaman OK don ki tekrar denemesin
  }
}
