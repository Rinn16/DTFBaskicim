import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { discountCodeSchema } from "@/validations/admin";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const codes = await db.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      discounts: codes.map((c) => ({
        id: c.id,
        code: c.code,
        discountPercent: c.discountPercent ? Number(c.discountPercent) : null,
        discountAmount: c.discountAmount ? Number(c.discountAmount) : null,
        minOrderMeters: c.minOrderMeters ? Number(c.minOrderMeters) : null,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        validFrom: c.validFrom.toISOString(),
        validUntil: c.validUntil.toISOString(),
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Discount codes list error:", error);
    return NextResponse.json(
      { error: "İndirim kodları yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = discountCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await db.discountCode.findUnique({
      where: { code: parsed.data.code },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu kod zaten mevcut" },
        { status: 409 },
      );
    }

    const discount = await db.discountCode.create({
      data: {
        code: parsed.data.code,
        discountPercent: parsed.data.discountPercent ?? null,
        discountAmount: parsed.data.discountAmount ?? null,
        minOrderMeters: parsed.data.minOrderMeters ?? null,
        maxUses: parsed.data.maxUses ?? null,
        validFrom: new Date(parsed.data.validFrom),
        validUntil: new Date(parsed.data.validUntil),
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        discount: {
          id: discount.id,
          code: discount.code,
          discountPercent: discount.discountPercent
            ? Number(discount.discountPercent)
            : null,
          discountAmount: discount.discountAmount
            ? Number(discount.discountAmount)
            : null,
          minOrderMeters: discount.minOrderMeters
            ? Number(discount.minOrderMeters)
            : null,
          maxUses: discount.maxUses,
          usedCount: discount.usedCount,
          validFrom: discount.validFrom.toISOString(),
          validUntil: discount.validUntil.toISOString(),
          isActive: discount.isActive,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Discount code create error:", error);
    return NextResponse.json(
      { error: "İndirim kodu oluşturulamadı" },
      { status: 500 },
    );
  }
}
