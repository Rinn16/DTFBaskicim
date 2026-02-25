import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const refundSchema = z.object({
  amount: z.number().positive("İade tutarı pozitif olmalıdır"),
  reason: z.string().min(1, "İade nedeni gereklidir"),
  createReturnInvoice: z.boolean().optional().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const parsed = refundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, reason, createReturnInvoice } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });

      // Calculate prior refunds
      const priorRefunds = await tx.paymentTransaction.aggregate({
        where: {
          orderId,
          type: { in: ["REFUND", "PARTIAL_REFUND"] },
          status: "COMPLETED",
        },
        _sum: { amount: true },
      });

      const refundable = Number(order.totalAmount) - Number(priorRefunds._sum.amount ?? 0);
      if (amount > refundable) {
        throw new Error(`İade tutarı kalan bakiyeyi aşıyor. Kalan: ${refundable.toFixed(2)} TL`);
      }

      const isFullRefund = Math.abs(amount - refundable) < 0.01;
      const transactionType = isFullRefund ? "REFUND" as const : "PARTIAL_REFUND" as const;

      // Create payment transaction
      const transaction = await tx.paymentTransaction.create({
        data: {
          orderId,
          type: transactionType,
          status: "COMPLETED",
          amount,
          refundReason: reason,
          refundedBy: session.user?.id || session.user?.name || "admin",
          note: isFullRefund ? "Tam iade" : `Kısmi iade: ${amount.toFixed(2)} TL`,
        },
      });

      // Create audit trail
      const historyData: {
        orderId: string;
        fromStatus: typeof order.status;
        toStatus: typeof order.status;
        changedBy: string | undefined;
        note: string;
        eventType: string;
      } = {
        orderId,
        fromStatus: order.status,
        toStatus: isFullRefund ? "REFUNDED" : order.status,
        changedBy: session.user?.id || undefined,
        note: `İade: ${amount.toFixed(2)} TL — ${reason}`,
        eventType: "REFUND",
      };

      await tx.orderStatusHistory.create({ data: historyData });

      // Update order status for full refund
      if (isFullRefund) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "REFUNDED" },
        });
      }

      // Create return invoice if requested
      if (createReturnInvoice) {
        try {
          const { createInvoiceForOrder } = await import("@/services/invoice.service");
          await createInvoiceForOrder(orderId, "IADE", tx);
        } catch (invoiceErr) {
          console.error("Return invoice creation failed:", invoiceErr);
          // Don't block the refund if invoice creation fails
        }
      }

      return { transaction, isFullRefund };
    });

    return NextResponse.json({
      transaction: result.transaction,
      isFullRefund: result.isFullRefund,
    });
  } catch (error) {
    console.error("Refund error:", error);
    const message = error instanceof Error ? error.message : "İade işlemi başarısız";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
