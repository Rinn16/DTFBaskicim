import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createOrder } from "@/services/order.service";
import { checkoutSchema } from "@/validations/checkout";
import { addToCartSchema } from "@/validations/cart";
import { db } from "@/lib/db";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";

const guestCartItemsSchema = z.array(addToCartSchema).min(1, "Sepetiniz boş");

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
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
    return NextResponse.json({ error: "Siparişler yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const { paymentMethod, addressId, guestAddress, guestInfo, discountCode, customerNote, billingSameAddress, billingInfo, termsAcceptedAt } = parsed.data;

    // Sepet ögeleri — üye ise DB'den, misafir ise body'den
    let cartItems;
    if (session?.user?.id) {
      const dbItems = await db.cartItem.findMany({ where: { userId: session.user.id } });
      if (dbItems.length === 0) {
        return NextResponse.json({ error: "Sepetiniz boş" }, { status: 400 });
      }
      cartItems = dbItems.map((item) => ({
        id: item.id,
        layout: item.layout as unknown as GangSheetLayout,
        items: item.items as unknown as GangSheetItem[],
        totalMeters: Number(item.totalMeters),
      }));
    } else {
      // Misafir: cartItems body'de gelmeli
      if (!guestInfo) {
        return NextResponse.json({ error: "Misafir bilgileri zorunlu" }, { status: 400 });
      }
      const cartParsed = guestCartItemsSchema.safeParse(body.cartItems);
      if (!cartParsed.success) {
        return NextResponse.json({ error: "Geçersiz sepet verisi", details: cartParsed.error.flatten() }, { status: 400 });
      }
      cartItems = cartParsed.data;
    }

    const { order, priceBreakdown } = await createOrder({
      userId: session?.user?.id,
      guestEmail: guestInfo?.guestEmail,
      guestName: guestInfo?.guestName,
      guestPhone: guestInfo?.guestPhone,
      addressId,
      guestAddress,
      paymentMethod: paymentMethod as "CREDIT_CARD" | "BANK_TRANSFER",
      cartItems,
      discountCode,
      customerNote,
      termsAcceptedAt,
      billingSameAddress,
      billingInfo,
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
    const message = error instanceof Error ? error.message : "Sipariş oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
