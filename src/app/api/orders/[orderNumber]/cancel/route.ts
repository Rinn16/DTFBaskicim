import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { orderNumber } = await params;

    const order = await db.order.findUnique({
      where: { orderNumber },
      select: { id: true, status: true, userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Sadece ödeme bekleyen siparişler iptal edilebilir" },
        { status: 400 },
      );
    }

    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "PENDING_PAYMENT",
          toStatus: "CANCELLED",
          changedBy: session.user.id,
          note: "Müşteri tarafından iptal edildi",
          eventType: "STATUS_CHANGE",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order cancel error:", error);
    return NextResponse.json(
      { error: "Sipariş iptal edilirken hata oluştu" },
      { status: 500 },
    );
  }
}
