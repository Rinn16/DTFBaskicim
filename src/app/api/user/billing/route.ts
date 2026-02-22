import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { billingInfoSchema } from "@/validations/checkout";

const billingSelect = {
  billingType: true,
  billingFullName: true,
  billingCompanyName: true,
  billingTaxOffice: true,
  billingTaxNumber: true,
  billingAddress: true,
  billingCity: true,
  billingDistrict: true,
  billingZipCode: true,
} as const;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: billingSelect,
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ billing: user });
  } catch (error) {
    console.error("Billing fetch error:", error);
    return NextResponse.json({ error: "Fatura bilgileri yüklenemedi" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = billingInfoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        billingType: data.billingType,
        billingFullName: data.billingType === "INDIVIDUAL" ? data.billingFullName : null,
        billingCompanyName: data.billingType === "CORPORATE" ? data.billingCompanyName : null,
        billingTaxOffice: data.billingType === "CORPORATE" ? data.billingTaxOffice : null,
        billingTaxNumber: data.billingType === "CORPORATE" ? data.billingTaxNumber : null,
        billingAddress: data.billingAddress,
        billingCity: data.billingCity,
        billingDistrict: data.billingDistrict,
        billingZipCode: data.billingZipCode || null,
      },
      select: billingSelect,
    });

    return NextResponse.json({ billing: user });
  } catch (error) {
    console.error("Billing update error:", error);
    return NextResponse.json({ error: "Fatura bilgileri güncellenemedi" }, { status: 500 });
  }
}
