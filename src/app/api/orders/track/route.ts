import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { orderNumber, email } = await request.json();

    if (!orderNumber || !email) {
      return NextResponse.json({ error: "Siparis numarasi ve email zorunlu" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Email eslesmesi kontrolu (uye veya misafir)
    const orderEmail = order.guestEmail;
    if (orderEmail?.toLowerCase() !== email.toLowerCase()) {
      // Uye siparisi olabilir — user tablosundan kontrol et
      if (order.userId) {
        const user = await db.user.findUnique({ where: { id: order.userId } });
        if (!user || user.email?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
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
    return NextResponse.json({ error: "Siparis takip edilemedi" }, { status: 500 });
  }
}
