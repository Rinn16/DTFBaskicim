import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await auth();
    const { orderNumber } = await params;

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        address: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        discountCode: { select: { code: true, discountPercent: true, discountAmount: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Yetki kontrolu: uye kendi siparisini, misafir erisemez (track endpoint kullanmali)
    if (order.userId && (!session?.user?.id || session.user.id !== order.userId)) {
      if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 403 });
      }
    }

    return NextResponse.json({
      order: {
        ...order,
        totalMeters: Number(order.totalMeters),
        pricePerMeter: Number(order.pricePerMeter),
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        taxAmount: Number(order.taxAmount),
        totalAmount: Number(order.totalAmount),
      },
    });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Siparis detayi yuklenemedi" }, { status: 500 });
  }
}
