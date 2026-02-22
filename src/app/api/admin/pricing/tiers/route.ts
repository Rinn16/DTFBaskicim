import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pricingTierSchema } from "@/validations/admin";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const tiers = await db.pricingTier.findMany({
      orderBy: { minMeters: "asc" },
    });

    return NextResponse.json({
      tiers: tiers.map((t) => ({
        id: t.id,
        minMeters: Number(t.minMeters),
        maxMeters: t.maxMeters ? Number(t.maxMeters) : null,
        pricePerMeter: Number(t.pricePerMeter),
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Pricing tiers list error:", error);
    return NextResponse.json(
      { error: "Fiyat kademeleri yüklenemedi" },
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
    const parsed = pricingTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const tier = await db.pricingTier.create({
      data: {
        minMeters: parsed.data.minMeters,
        maxMeters: parsed.data.maxMeters ?? null,
        pricePerMeter: parsed.data.pricePerMeter,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        tier: {
          id: tier.id,
          minMeters: Number(tier.minMeters),
          maxMeters: tier.maxMeters ? Number(tier.maxMeters) : null,
          pricePerMeter: Number(tier.pricePerMeter),
          isActive: tier.isActive,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Pricing tier create error:", error);
    return NextResponse.json(
      { error: "Kademe oluşturulamadı" },
      { status: 500 },
    );
  }
}
