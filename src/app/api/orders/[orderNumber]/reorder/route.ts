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
      select: {
        userId: true,
        gangSheetLayout: true,
        totalMeters: true,
        items: {
          select: {
            imageKey: true,
            imageName: true,
            imageWidth: true,
            imageHeight: true,
            placements: true,
          },
        },
      },
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    // Rebuild items array from order items
    const items = order.items.map((item) => ({
      imageKey: item.imageKey,
      imageName: item.imageName,
      originalWidthPx: item.imageWidth,
      originalHeightPx: item.imageHeight,
      placements: item.placements as any,
    }));

    const cartItem = await db.cartItem.create({
      data: {
        userId: session.user.id,
        layout: order.gangSheetLayout as any,
        items: items as any,
        totalMeters: order.totalMeters,
      },
    });

    return NextResponse.json({
      cartItem: {
        id: cartItem.id,
        totalMeters: Number(cartItem.totalMeters),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "Tekrar sipariş oluşturulamadı" }, { status: 500 });
  }
}
