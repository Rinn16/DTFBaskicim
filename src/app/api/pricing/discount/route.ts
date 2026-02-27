import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Rate limit by IP to prevent brute-force code guessing
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const { success } = await rateLimit(`discount:${ip}`, 10, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "İndirim kodu gerekli" },
        { status: 400 }
      );
    }

    const discount = await db.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      return NextResponse.json(
        { error: "Geçersiz indirim kodu" },
        { status: 404 }
      );
    }

    if (!discount.isActive) {
      return NextResponse.json(
        { error: "Bu indirim kodu artık geçerli değil" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < discount.validFrom || now > discount.validUntil) {
      return NextResponse.json(
        { error: "Bu indirim kodunun süresi dolmuş" },
        { status: 400 }
      );
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return NextResponse.json(
        { error: "Bu indirim kodu kullanım limitine ulaşmış" },
        { status: 400 }
      );
    }

    // Per-user usage check (only for authenticated users)
    const session = await auth();
    if (session?.user?.id) {
      const existingUsage = await db.discountUsage.findUnique({
        where: {
          userId_discountCodeId: {
            userId: session.user.id,
            discountCodeId: discount.id,
          },
        },
      });
      if (existingUsage) {
        return NextResponse.json(
          { error: "Bu indirim kodunu daha önce kullandınız" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      code: discount.code,
      discountPercent: discount.discountPercent
        ? Number(discount.discountPercent)
        : 0,
      discountAmount: discount.discountAmount
        ? Number(discount.discountAmount)
        : 0,
      minOrderMeters: discount.minOrderMeters
        ? Number(discount.minOrderMeters)
        : null,
    });
  } catch (error) {
    console.error("Discount check error:", error);
    return NextResponse.json(
      { error: "İndirim kodu kontrol edilemedi" },
      { status: 500 }
    );
  }
}
