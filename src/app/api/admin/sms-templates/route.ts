import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { smsTemplateSchema } from "@/validations/admin";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const templates = await db.smsTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("SMS templates list error:", error);
    return NextResponse.json(
      { error: "SMS şablonları yüklenemedi" },
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
    const parsed = smsTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const template = await db.smsTemplate.create({
      data: {
        name: parsed.data.name,
        content: parsed.data.content,
        type: parsed.data.type,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("SMS template create error:", error);
    return NextResponse.json(
      { error: "SMS şablonu oluşturulamadı" },
      { status: 500 },
    );
  }
}
