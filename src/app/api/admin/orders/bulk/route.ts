import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const bulkSchema = z.object({
  action: z.enum(["set_processing", "export", "create_invoice"]),
  orderIds: z.array(z.string()).min(1, "En az bir sipariş seçilmelidir"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, orderIds } = parsed.data;
    const results: { orderId: string; success: boolean; error?: string }[] = [];

    for (const orderId of orderIds) {
      try {
        if (action === "set_processing") {
          const order = await db.order.findUnique({ where: { id: orderId } });
          if (!order) {
            results.push({ orderId, success: false, error: "Sipariş bulunamadı" });
            continue;
          }
          if (order.status !== "PENDING_PAYMENT") {
            results.push({ orderId, success: false, error: "Sadece ödeme bekleyen siparişler güncellenebilir" });
            continue;
          }
          await db.$transaction([
            db.order.update({
              where: { id: orderId },
              data: { status: "PROCESSING" },
            }),
            db.orderStatusHistory.create({
              data: {
                orderId,
                fromStatus: order.status,
                toStatus: "PROCESSING",
                changedBy: session.user?.id || undefined,
                note: "Toplu işlem ile güncellendi",
                eventType: "STATUS_CHANGE",
              },
            }),
          ]);
          results.push({ orderId, success: true });

        } else if (action === "export") {
          const order = await db.order.findUnique({ where: { id: orderId } });
          if (!order) {
            results.push({ orderId, success: false, error: "Sipariş bulunamadı" });
            continue;
          }
          try {
            const { exportQueue } = await import("@/lib/queue");
            await exportQueue.add(`export-${order.orderNumber}`, {
              orderId: order.id,
              orderNumber: order.orderNumber,
            });
            results.push({ orderId, success: true });
          } catch {
            results.push({ orderId, success: false, error: "Export kuyruğuna eklenemedi" });
          }

        } else if (action === "create_invoice") {
          try {
            const { issueInvoice } = await import("@/services/invoice.service");
            await issueInvoice(orderId);
            results.push({ orderId, success: true });
          } catch (err) {
            results.push({
              orderId,
              success: false,
              error: err instanceof Error ? err.message : "Fatura oluşturulamadı",
            });
          }
        }
      } catch (err) {
        results.push({
          orderId,
          success: false,
          error: err instanceof Error ? err.message : "İşlem başarısız",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({ results, successCount, failCount });
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json({ error: "Toplu işlem başarısız" }, { status: 500 });
  }
}
