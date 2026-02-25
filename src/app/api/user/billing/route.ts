import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { billingInfoSchema } from "@/validations/checkout";

const billingSelect = {
  billingType: true,
  billingFirstName: true,
  billingLastName: true,
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
    const isIndividual = data.billingType === "INDIVIDUAL";
    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        billingType: data.billingType,
        billingFirstName: isIndividual ? data.billingFirstName : null,
        billingLastName: isIndividual ? data.billingLastName : null,
        billingFullName: isIndividual && data.billingFirstName && data.billingLastName
          ? `${data.billingFirstName} ${data.billingLastName}`
          : null,
        billingCompanyName: !isIndividual ? data.billingCompanyName : null,
        billingTaxOffice: !isIndividual ? data.billingTaxOffice : null,
        billingTaxNumber: isIndividual
          ? (data.billingTaxNumber || null)
          : data.billingTaxNumber,
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
