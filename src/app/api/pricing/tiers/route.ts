import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    // Get active pricing tiers (public — guests need this too)
    const [tiers, shippingConfig] = await Promise.all([
      db.pricingTier.findMany({
        where: { isActive: true },
        orderBy: { minMeters: "asc" },
      }),
      db.shippingConfig.findFirst({ where: { id: "default" } }),
    ]);

    const formattedTiers = tiers.map((t) => ({
      id: t.id,
      minMeters: Number(t.minMeters),
      maxMeters: t.maxMeters ? Number(t.maxMeters) : null,
      pricePerMeter: Number(t.pricePerMeter),
    }));

    // Check for special customer pricing (only if logged in)
    let customerPricing = null;
    if (session?.user?.id) {
      const cp = await db.customerPricing.findUnique({
        where: { userId: session.user.id },
      });
      if (cp) {
        customerPricing = { pricePerMeter: Number(cp.pricePerMeter) };
      }
    }

    return NextResponse.json(
      {
        tiers: formattedTiers,
        customerPricing,
        shippingConfig: shippingConfig?.isActive
          ? {
              shippingCost: Number(shippingConfig.shippingCost),
              freeShippingMin: Number(shippingConfig.freeShippingMin),
            }
          : null,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Pricing tiers error:", error);
    return NextResponse.json(
      { error: "Fiyat bilgisi alınamadı" },
      { status: 500 }
    );
  }
}
