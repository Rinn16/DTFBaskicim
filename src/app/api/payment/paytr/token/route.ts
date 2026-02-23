import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createPaytrToken } from "@/services/paytr.service";

export async function POST(request: Request) {
  try {
    const { orderNumber } = await request.json();

    if (!orderNumber) {
      return NextResponse.json({ error: "Sipariş numarası zorunlu" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { user: true, address: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    if (order.paymentMethod !== "CREDIT_CARD") {
      return NextResponse.json({ error: "Bu sipariş kredi kartı ödemesi değil" }, { status: 400 });
    }

    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "Bu sipariş zaten işlendi" }, { status: 400 });
    }

    const headersList = await headers();
    const userIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "127.0.0.1";

    const { success } = await rateLimit(`paytr-token:${userIp}`, 10, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla ödeme denemesi. Lütfen 1 saat sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const email = order.user?.email || order.guestEmail || "";
    const userName = order.user?.name
      ? `${order.user.name} ${order.user.surname || ""}`
      : order.guestName || "";
    const userPhone = order.address?.phone || order.user?.phone || order.guestPhone || "";
    const userAddress = order.address
      ? `${order.address.address}, ${order.address.district}/${order.address.city}`
      : "Belirtilmedi";

    // Use string-based conversion to avoid floating point errors
    // Decimal comes from Prisma as string-like; convert TL to kurus safely
    const totalStr = String(order.totalAmount);
    const [intPart, decPart = ""] = totalStr.split(".");
    const paddedDec = (decPart + "00").slice(0, 2);
    const paymentAmount = parseInt(intPart + paddedDec, 10);

    const userBasket: Array<[string, string, number]> = [
      ["DTF Baskı Hizmeti", `${Number(order.totalAmount).toFixed(2)}`, 1],
    ];

    const result = await createPaytrToken({
      merchantOid: order.orderNumber,
      email,
      paymentAmount,
      userName,
      userAddress,
      userPhone,
      userIp,
      userBasket,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      token: result.token,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
    });
  } catch (error) {
    console.error("PayTR token error:", error);
    return NextResponse.json({ error: "Ödeme başlatılamadı" }, { status: 500 });
  }
}
