import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/validations/address";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Adres bulunamadi" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz adres bilgisi", details: parsed.error.flatten() }, { status: 400 });
    }

    const address = await db.address.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ address });
  } catch (error) {
    console.error("Address update error:", error);
    return NextResponse.json({ error: "Adres guncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Adres bulunamadi" }, { status: 404 });
    }

    await db.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Address delete error:", error);
    return NextResponse.json({ error: "Adres silinemedi" }, { status: 500 });
  }
}
