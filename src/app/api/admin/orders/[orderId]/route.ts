import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
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
      include: {
        items: true,
        address: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        user: { select: { id: true, name: true, surname: true, email: true, phone: true } },
        gangSheets: {
          select: {
            id: true,
            gangSheetWidth: true,
            gangSheetHeight: true,
            totalMeters: true,
            exportPng: true,
            exportTiff: true,
            exportPdf: true,
            gangSheetLayout: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
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
        gangSheets: order.gangSheets.map((gs) => ({
          ...gs,
          totalMeters: Number(gs.totalMeters),
        })),
      },
    });
  } catch (error) {
    console.error("Admin order detail error:", error);
    return NextResponse.json({ error: "Sipariş yüklenemedi" }, { status: 500 });
  }
}
