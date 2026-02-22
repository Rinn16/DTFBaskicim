import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const shippingSchema = z.object({
  shippingCost: z.number().min(0),
  freeShippingMin: z.number().min(0),
  isActive: z.boolean(),
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const config = await db.shippingConfig.findFirst({
      where: { id: "default" },
    });

    return NextResponse.json({
      config: config
        ? {
            shippingCost: Number(config.shippingCost),
            freeShippingMin: Number(config.freeShippingMin),
            isActive: config.isActive,
          }
        : { shippingCost: 49.9, freeShippingMin: 500, isActive: true },
    });
  } catch (error) {
    console.error("Shipping config GET error:", error);
    return NextResponse.json(
      { error: "Kargo ayarları alınamadı" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = shippingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await db.shippingConfig.findFirst({ where: { id: "default" } });

    const config = existing
      ? await db.shippingConfig.update({
          where: { id: "default" },
          data: {
            shippingCost: parsed.data.shippingCost,
            freeShippingMin: parsed.data.freeShippingMin,
            isActive: parsed.data.isActive,
          },
        })
      : await db.shippingConfig.create({
          data: {
            id: "default",
            shippingCost: parsed.data.shippingCost,
            freeShippingMin: parsed.data.freeShippingMin,
            isActive: parsed.data.isActive,
          },
        });

    return NextResponse.json({
      config: {
        shippingCost: Number(config.shippingCost),
        freeShippingMin: Number(config.freeShippingMin),
        isActive: config.isActive,
      },
    });
  } catch (error) {
    console.error("Shipping config PUT error:", error);
    return NextResponse.json(
      { error: "Kargo ayarları güncellenemedi" },
      { status: 500 },
    );
  }
}
