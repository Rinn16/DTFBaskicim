import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/utils";
import { sendOrderShipped } from "@/services/email.service";

const statusUpdateSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PROCESSING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ]),
  note: z.string().optional(),
  adminNote: z.string().optional(),
  trackingCode: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const parsed = statusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { status, note, adminNote, trackingCode } = parsed.data;

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        userId: true,
        guestEmail: true,
        guestName: true,
        totalMeters: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        items: { select: { id: true, imageName: true, quantity: true } },
        user: { select: { email: true, name: true } },
        address: {
          select: { address: true, district: true, city: true, zipCode: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const fromStatus = order.status;

    const [updatedOrder] = await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(adminNote !== undefined && { adminNote }),
          ...(status === "SHIPPED" && trackingCode && { trackingCode }),
        },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus,
          toStatus: status,
          changedBy: session.user?.id,
          note: note || null,
          eventType: status === "SHIPPED" ? "SHIPPING" : "STATUS_CHANGE",
        },
      }),
    ]);

    // Auto-export when transitioning to PROCESSING (e.g. bank transfer confirmed)
    if (status === "PROCESSING" && fromStatus !== "PROCESSING") {
      try {
        const { exportQueue } = await import("@/lib/queue");
        await exportQueue.add(`export-${order.orderNumber}`, {
          orderId: order.id,
          orderNumber: order.orderNumber,
        });
      } catch (queueErr) {
        console.error("Failed to enqueue export job:", queueErr);
      }
    }

    // Fire-and-forget: kargoya verildi e-postası
    if (status === "SHIPPED") {
      try {
        const email = order.user?.email || order.guestEmail;
        const customerName = order.user?.name || order.guestName || "Müşterimiz";

        if (email) {
          const siteUrl = getBaseUrl();
          const addr = order.address;
          const deliveryAddress = addr
            ? [addr.address, addr.district, addr.city, addr.zipCode].filter(Boolean).join(", ")
            : "";
          sendOrderShipped(email, {
            orderNumber: order.orderNumber,
            customerName,
            totalMeters: Number(order.totalMeters),
            totalAmount: Number(order.totalAmount),
            shippingCost: 0,
            paymentMethod: order.paymentMethod,
            status,
            itemCount: order.items.length,
            items: order.items.map((item) => ({
              imageName: item.imageName,
              quantity: item.quantity,
            })),
            orderDate: order.createdAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
            deliveryAddress,
            orderUrl: `${siteUrl}/hesabim/siparisler`,
            trackingCode: trackingCode || undefined,
          }).catch((err) => console.error("[email] Shipped email failed:", err));
        }
      } catch (err) {
        console.error("[email] Shipped email setup failed:", err);
      }
    }

    // Fire-and-forget: Kargoya verildi SMS
    if (status === "SHIPPED") {
      try {
        const { sendOrderEventSms } = await import("@/services/sms.service");
        const fullOrder = await db.order.findUnique({
          where: { id: orderId },
          include: { user: true, address: true },
        });
        if (fullOrder) {
          sendOrderEventSms(fullOrder, "KARGOYA_VERILDI");
        }
      } catch (err) {
        console.error("[sms] Shipped SMS failed:", err);
      }
    }

    return NextResponse.json({
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
      },
    });
  } catch (error) {
    console.error("Admin status update error:", error);
    return NextResponse.json(
      { error: "Durum güncellenirken hata oluştu" },
      { status: 500 },
    );
  }
}
