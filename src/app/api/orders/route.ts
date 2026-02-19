import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/services/order.service";
import { checkoutSchema } from "@/validations/checkout";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const orders = await db.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        totalMeters: true,
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    const formatted = orders.map((o) => ({
      ...o,
      totalMeters: Number(o.totalMeters),
      totalAmount: Number(o.totalAmount),
    }));

    return NextResponse.json({ orders: formatted });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Siparisler yuklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const { paymentMethod, addressId, guestAddress, guestInfo, discountCode, customerNote } = parsed.data;

    // Sepet ogeleri — uye ise DB'den, misafir ise body'den
    let cartItems;
    if (session?.user?.id) {
      const dbItems = await db.cartItem.findMany({ where: { userId: session.user.id } });
      if (dbItems.length === 0) {
        return NextResponse.json({ error: "Sepetiniz bos" }, { status: 400 });
      }
      cartItems = dbItems.map((item) => ({
        id: item.id,
        layout: item.layout as any,
        items: item.items as any,
        totalMeters: Number(item.totalMeters),
      }));
    } else {
      // Misafir: cartItems body'de gelmeli
      if (!body.cartItems || body.cartItems.length === 0) {
        return NextResponse.json({ error: "Sepetiniz bos" }, { status: 400 });
      }
      if (!guestInfo) {
        return NextResponse.json({ error: "Misafir bilgileri zorunlu" }, { status: 400 });
      }
      cartItems = body.cartItems;
    }

    const { order, priceBreakdown } = await createOrder({
      userId: session?.user?.id,
      guestEmail: guestInfo?.guestEmail,
      guestName: guestInfo?.guestName,
      guestPhone: guestInfo?.guestPhone,
      addressId,
      guestAddress,
      paymentMethod: paymentMethod as any,
      cartItems,
      discountCode,
      customerNote,
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        paymentMethod: order.paymentMethod,
      },
      priceBreakdown,
    }, { status: 201 });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Siparis olusturulamadi" }, { status: 500 });
  }
}
