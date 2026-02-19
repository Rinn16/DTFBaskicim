import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressSchema } from "@/validations/address";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }
    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    });
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Address fetch error:", error);
    return NextResponse.json({ error: "Adresler yuklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz adres bilgisi", details: parsed.error.flatten() }, { status: 400 });
    }

    // Ilk adresse default yap
    const existingCount = await db.address.count({ where: { userId: session.user.id } });

    const address = await db.address.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
        isDefault: existingCount === 0,
      },
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Address create error:", error);
    return NextResponse.json({ error: "Adres eklenemedi" }, { status: 500 });
  }
}
