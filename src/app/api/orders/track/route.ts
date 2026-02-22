import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { orderNumber, email } = await request.json();

    if (!orderNumber || !email) {
      return NextResponse.json({ error: "Sipariş numarası ve email zorunlu" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    // Email eşleşmesi kontrolü (üye veya misafir)
    const orderEmail = order.guestEmail;
    if (orderEmail?.toLowerCase() !== email.toLowerCase()) {
      // Üye siparişi olabilir — user tablosundan kontrol et
      if (order.userId) {
        const user = await db.user.findUnique({ where: { id: order.userId } });
        if (!user || user.email?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
      }
    }

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        totalMeters: Number(order.totalMeters),
        createdAt: order.createdAt,
        statusHistory: order.statusHistory,
      },
    });
  } catch (error) {
    console.error("Order track error:", error);
    return NextResponse.json({ error: "Sipariş takip edilemedi" }, { status: 500 });
  }
}
