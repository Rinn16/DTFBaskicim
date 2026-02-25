import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { createPaytrToken } from "@/services/paytr.service";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/payment/paytr/retry
 * Creates a new PayTR token for an order with FAILED payment status.
 * Resets paymentStatus back to PENDING.
 */
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    const { success } = await rateLimit(`payment-retry:${ip}`, 10, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { orderNumber } = body;

    if (!orderNumber || typeof orderNumber !== "string") {
      return NextResponse.json({ error: "Sipariş numarası gerekli" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        user: { select: { email: true, name: true, phone: true } },
        address: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    if (order.paymentMethod !== "CREDIT_CARD") {
      return NextResponse.json(
        { error: "Bu sipariş kredi kartı ödemesi değil" },
        { status: 400 },
      );
    }

    if (order.paymentStatus !== "FAILED") {
      return NextResponse.json(
        { error: "Bu sipariş tekrar ödeme için uygun değil" },
        { status: 400 },
      );
    }

    // Build PayTR token params
    const email = order.user?.email || order.guestEmail || "";
    const userName = order.user?.name || order.guestName || "Müşteri";
    const userPhone = order.user?.phone || order.guestPhone || order.address?.phone || "";
    const userAddress = order.address
      ? `${order.address.address}, ${order.address.district}/${order.address.city}`
      : "";

    const totalAmountStr = String(order.totalAmount);
    const [intPart, decPart = ""] = totalAmountStr.split(".");
    const paymentAmount = parseInt(intPart + (decPart + "00").slice(0, 2), 10);

    const userBasket: Array<[string, string, number]> = order.items.map((item) => [
      item.imageName,
      String(order.totalAmount),
      item.quantity,
    ]);

    if (userBasket.length === 0) {
      userBasket.push(["Sipariş", String(order.totalAmount), 1]);
    }

    const result = await createPaytrToken({
      merchantOid: order.orderNumber,
      email,
      paymentAmount,
      userName,
      userAddress,
      userPhone,
      userIp: ip,
      userBasket,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Reset payment status back to PENDING for the new attempt
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PENDING" },
    });

    return NextResponse.json({ token: result.token });
  } catch (error) {
    console.error("Payment retry error:", error);
    return NextResponse.json(
      { error: "Ödeme tekrar denemesi başarısız" },
      { status: 500 },
    );
  }
}
