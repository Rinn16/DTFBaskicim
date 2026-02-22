import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { discountCodeSchema } from "@/validations/admin";

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
    const parsed = discountCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await db.discountCode.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "İndirim kodu bulunamadı" },
        { status: 404 },
      );
    }

    // Check uniqueness if code changed
    if (parsed.data.code !== existing.code) {
      const duplicate = await db.discountCode.findUnique({
        where: { code: parsed.data.code },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Bu kod zaten mevcut" },
          { status: 409 },
        );
      }
    }

    const discount = await db.discountCode.update({
      where: { id },
      data: {
        code: parsed.data.code,
        discountPercent: parsed.data.discountPercent ?? null,
        discountAmount: parsed.data.discountAmount ?? null,
        minOrderMeters: parsed.data.minOrderMeters ?? null,
        maxUses: parsed.data.maxUses ?? null,
        validFrom: new Date(parsed.data.validFrom),
        validUntil: new Date(parsed.data.validUntil),
        isActive: parsed.data.isActive ?? existing.isActive,
      },
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Discount code update error:", error);
    return NextResponse.json(
      { error: "İndirim kodu güncellenemedi" },
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

    const existing = await db.discountCode.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "İndirim kodu bulunamadı" },
        { status: 404 },
      );
    }

    await db.discountCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discount code delete error:", error);
    return NextResponse.json(
      { error: "İndirim kodu silinemedi" },
      { status: 500 },
    );
  }
}
