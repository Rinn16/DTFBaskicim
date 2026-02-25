import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    const { success } = await rateLimit(`pricing-tiers:${ip}`, 60, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." },
        { status: 429 }
      );
    }

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
