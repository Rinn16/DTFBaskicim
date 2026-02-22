import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculatePrice } from "@/services/pricing.service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { totalHeightCm, discountCode } = await request.json();

    if (typeof totalHeightCm !== "number" || totalHeightCm <= 0) {
      return NextResponse.json(
        { error: "Geçersiz uzunluk" },
        { status: 400 }
      );
    }

    // Get pricing tiers
    const tiers = await db.pricingTier.findMany({
      where: { isActive: true },
      orderBy: { minMeters: "asc" },
    });

    const pricingTiers = tiers.map((t) => ({
      id: t.id,
      minMeters: Number(t.minMeters),
      maxMeters: t.maxMeters ? Number(t.maxMeters) : null,
      pricePerMeter: Number(t.pricePerMeter),
    }));

    // Check for special customer pricing
    const customerPricing = await db.customerPricing.findUnique({
      where: { userId: session.user.id },
    });

    const customerPricingData = customerPricing
      ? { pricePerMeter: Number(customerPricing.pricePerMeter) }
      : null;

    // Check discount code
    let discountPercent = 0;
    let discountAmount = 0;

    if (discountCode) {
      const code = await db.discountCode.findUnique({
        where: { code: discountCode },
      });

      if (
        code &&
        code.isActive &&
        new Date() >= code.validFrom &&
        new Date() <= code.validUntil &&
        (code.maxUses === null || code.usedCount < code.maxUses)
      ) {
        const totalMeters = totalHeightCm / 100;
        if (!code.minOrderMeters || totalMeters >= Number(code.minOrderMeters)) {
          discountPercent = code.discountPercent ? Number(code.discountPercent) : 0;
          discountAmount = code.discountAmount ? Number(code.discountAmount) : 0;
        }
      }
    }

    const priceBreakdown = calculatePrice(
      totalHeightCm,
      pricingTiers,
      customerPricingData,
      discountPercent,
      discountAmount
    );

    return NextResponse.json(priceBreakdown);
  } catch (error) {
    console.error("Price calculation error:", error);
    return NextResponse.json(
      { error: "Fiyat hesaplama hatası" },
      { status: 500 }
    );
  }
}
