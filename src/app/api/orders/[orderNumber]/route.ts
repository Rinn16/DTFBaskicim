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
        invoices: { where: { type: "SATIS", status: { not: "CANCELLED" } }, select: { id: true }, take: 1 },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    // Yetki kontrolü
    if (order.userId) {
      // Üye siparişi: sadece sipariş sahibi veya admin erişebilir
      if (!session?.user?.id || session.user.id !== order.userId) {
        if (session?.user?.role !== "ADMIN") {
          return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }
      }
    } else {
      // Misafir siparişi: sadece admin erişebilir (misafirler track endpoint kullanmalı)
      if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
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
        shippingCost: Number(order.shippingCost),
        hasInvoice: order.invoices.length > 0,
        invoices: undefined,
      },
    });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Sipariş detayı yüklenemedi" }, { status: 500 });
  }
}
