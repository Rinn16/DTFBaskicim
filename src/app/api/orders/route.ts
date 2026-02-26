import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createOrder } from "@/services/order.service";
import { checkoutSchema } from "@/validations/checkout";
import { addToCartSchema } from "@/validations/cart";
import { db } from "@/lib/db";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";

const guestCartItemsSchema = z.array(addToCartSchema).min(1, "Sepetiniz boş");

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    const search = searchParams.get("search") || "";

    const where = {
      userId: session.user.id,
      ...(search ? { orderNumber: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      db.order.count({ where }),
    ]);

    const formatted = orders.map((o) => ({
      ...o,
      totalMeters: Number(o.totalMeters),
      totalAmount: Number(o.totalAmount),
    }));

    return NextResponse.json({
      orders: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Siparişler yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    // Rate limit: 10 orders per hour per user/IP
    const rawIp = request.headers.get("x-forwarded-for") ?? "unknown";
    const clientIp = rawIp.split(",")[0].trim();
    const rlKey = session?.user?.id
      ? `orders:${session.user.id}`
      : `orders:ip:${clientIp}`;
    const { success: rlOk } = await rateLimit(rlKey, 10, 3600);
    if (!rlOk) {
      return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
    }

    // Check if orders are paused
    const siteSettings = await db.siteSettings.findUnique({ where: { id: "default" }, select: { ordersPaused: true, ordersPausedMessage: true } });
    if (siteSettings?.ordersPaused) {
      return NextResponse.json({
        error: siteSettings.ordersPausedMessage || "Şu anda sipariş alınmıyor. Lütfen daha sonra tekrar deneyin.",
        ordersPaused: true,
      }, { status: 503 });
    }

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
