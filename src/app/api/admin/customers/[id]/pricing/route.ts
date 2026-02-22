import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const pricingSchema = z.object({
  pricePerMeter: z.number().positive("Fiyat sıfırdan büyük olmalı"),
  notes: z.string().optional(),
});

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
    const parsed = pricingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });
    }

    const pricing = await db.customerPricing.upsert({
      where: { userId: id },
      create: {
        userId: id,
        pricePerMeter: parsed.data.pricePerMeter,
        notes: parsed.data.notes || null,
      },
      update: {
        pricePerMeter: parsed.data.pricePerMeter,
        notes: parsed.data.notes || null,
      },
    });

    return NextResponse.json({
      pricing: {
        id: pricing.id,
        pricePerMeter: Number(pricing.pricePerMeter),
        notes: pricing.notes,
      },
    });
  } catch (error) {
    console.error("Customer pricing update error:", error);
    return NextResponse.json({ error: "Fiyat güncellenemedi" }, { status: 500 });
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

    const existing = await db.customerPricing.findUnique({
      where: { userId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Özel fiyat bulunamadı" }, { status: 404 });
    }

    await db.customerPricing.delete({ where: { userId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer pricing delete error:", error);
    return NextResponse.json({ error: "Fiyat silinemedi" }, { status: 500 });
  }
}
