import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { createPaytrToken } from "@/services/paytr.service";

export async function POST(request: Request) {
  try {
    const { orderNumber } = await request.json();

    if (!orderNumber) {
      return NextResponse.json({ error: "Siparis numarasi zorunlu" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { user: true, address: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    if (order.paymentMethod !== "CREDIT_CARD") {
      return NextResponse.json({ error: "Bu siparis kredi karti odemesi degil" }, { status: 400 });
    }

    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "Bu siparis zaten islendi" }, { status: 400 });
    }

    const headersList = await headers();
    const userIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "127.0.0.1";

    const email = order.user?.email || order.guestEmail || "";
    const userName = order.user?.name
      ? `${order.user.name} ${order.user.surname || ""}`
      : order.guestName || "";
    const userPhone = order.user?.phone || order.guestPhone || "";
    const userAddress = order.address
      ? `${order.address.address}, ${order.address.district}/${order.address.city}`
      : "Belirtilmedi";

    const paymentAmount = Math.round(Number(order.totalAmount) * 100);

    const userBasket: Array<[string, string, number]> = [
      ["DTF Baski Hizmeti", `${Number(order.totalAmount).toFixed(2)}`, 1],
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
    return NextResponse.json({ error: "Odeme baslatilamadi" }, { status: 500 });
  }
}
