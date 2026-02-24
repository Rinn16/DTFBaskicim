import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { smsTemplateSchema } from "@/validations/admin";

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
    const parsed = smsTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await db.smsTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "SMS şablonu bulunamadı" },
        { status: 404 },
      );
    }

    const template = await db.smsTemplate.update({
      where: { id },
      data: {
        name: parsed.data.name,
        content: parsed.data.content,
        type: parsed.data.type,
        isActive: parsed.data.isActive ?? existing.isActive,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("SMS template update error:", error);
    return NextResponse.json(
      { error: "SMS şablonu güncellenemedi" },
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

    const existing = await db.smsTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "SMS şablonu bulunamadı" },
        { status: 404 },
      );
    }

    await db.smsTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SMS template delete error:", error);
    return NextResponse.json(
      { error: "SMS şablonu silinemedi" },
      { status: 500 },
    );
  }
}
