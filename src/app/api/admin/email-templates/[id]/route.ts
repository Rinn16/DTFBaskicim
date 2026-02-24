import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailTemplateSchema } from "@/validations/admin";

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
    const parsed = emailTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await db.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "E-posta şablonu bulunamadı" },
        { status: 404 },
      );
    }

    const template = await db.emailTemplate.update({
      where: { id },
      data: {
        name: parsed.data.name,
        subject: parsed.data.subject,
        content: parsed.data.content,
        isActive: parsed.data.isActive ?? existing.isActive,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Email template update error:", error);
    return NextResponse.json(
      { error: "E-posta şablonu güncellenemedi" },
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

    const existing = await db.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "E-posta şablonu bulunamadı" },
        { status: 404 },
      );
    }

    await db.emailTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email template delete error:", error);
    return NextResponse.json(
      { error: "E-posta şablonu silinemedi" },
      { status: 500 },
    );
  }
}
