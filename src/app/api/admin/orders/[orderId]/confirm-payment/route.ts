import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/admin/orders/[orderId]/confirm-payment
 * Confirms a bank transfer payment: sets paymentStatus=COMPLETED, status=PROCESSING.
 * Triggers export queue, sends SMS and email notifications.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId } = await params;

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        totalAmount: true,
        userId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    if (order.paymentMethod !== "BANK_TRANSFER") {
      return NextResponse.json(
        { error: "Bu sipariş banka havalesi ile ödenmedi" },
        { status: 400 },
      );
    }

    if (order.paymentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Ödeme zaten onaylanmış" },
        { status: 400 },
      );
    }

    // Update order: payment confirmed, move to processing
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "COMPLETED",
          status: "PROCESSING",
        },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: "PROCESSING",
          changedBy: session.user?.id,
          note: "Banka havalesi onaylandı",
          eventType: "PAYMENT",
        },
      }),
      db.paymentTransaction.create({
        data: {
          orderId,
          type: "PAYMENT",
          status: "COMPLETED",
          amount: order.totalAmount,
          gatewayRef: order.orderNumber,
          gatewayData: { source: "bank_transfer", confirmedBy: session.user?.id },
          note: "Banka havalesi onayı (admin)",
        },
      }),
      // Clear cart if user exists
      ...(order.userId
        ? [db.cartItem.deleteMany({ where: { userId: order.userId } })]
        : []),
    ]);

    // Enqueue gang sheet export
    try {
      const { exportQueue } = await import("@/lib/queue");
      await exportQueue.add(`export-${order.orderNumber}`, {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    } catch (queueErr) {
      console.error("Failed to enqueue export job:", queueErr);
    }

    // Fire-and-forget: SMS notification
    try {
      const { sendOrderEventSms } = await import("@/services/sms.service");
      const fullOrder = await db.order.findUnique({
        where: { id: orderId },
        include: { user: true, address: true },
      });
      if (fullOrder) {
        sendOrderEventSms(fullOrder, "SIPARIS_ONAYLANDI");
      }
    } catch (err) {
      console.error("[sms] Bank transfer confirmed SMS failed:", err);
    }

    // Fire-and-forget: Auto invoice
    try {
      const { issueInvoice } = await import("@/services/invoice.service");
      await issueInvoice(order.id);
    } catch (invoiceErr) {
      console.error("[invoice] Auto invoice failed:", invoiceErr);
    }

    return NextResponse.json({
      message: "Havale onaylandı, sipariş hazırlanıyor",
      order: { id: orderId, status: "PROCESSING", paymentStatus: "COMPLETED" },
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json(
      { error: "Ödeme onaylanırken hata oluştu" },
      { status: 500 },
    );
  }
}
