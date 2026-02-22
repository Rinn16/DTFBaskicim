import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pricingTierSchema } from "@/validations/admin";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = pricingTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await db.pricingTier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Kademe bulunamadı" },
        { status: 404 },
      );
    }

    const tier = await db.pricingTier.update({
      where: { id },
      data: {
        minMeters: parsed.data.minMeters,
        maxMeters: parsed.data.maxMeters ?? null,
        pricePerMeter: parsed.data.pricePerMeter,
        isActive: parsed.data.isActive ?? existing.isActive,
      },
    });

    return NextResponse.json({
      tier: {
        id: tier.id,
        minMeters: Number(tier.minMeters),
        maxMeters: tier.maxMeters ? Number(tier.maxMeters) : null,
        pricePerMeter: Number(tier.pricePerMeter),
        isActive: tier.isActive,
      },
    });
  } catch (error) {
    console.error("Pricing tier update error:", error);
    return NextResponse.json(
      { error: "Kademe güncellenemedi" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.pricingTier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Kademe bulunamadı" },
        { status: 404 },
      );
    }

    await db.pricingTier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pricing tier delete error:", error);
    return NextResponse.json(
      { error: "Kademe silinemedi" },
      { status: 500 },
    );
  }
}
