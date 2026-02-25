import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getOrCreateSettings() {
  let settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await db.siteSettings.create({
      data: { id: "default", smsEnabled: false },
    });
  }
  return settings;
}

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const settings = await getOrCreateSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Ayarlar yüklenemedi" },
      { status: 500 },
    );
  }
}

const updateSchema = z.object({
  smsEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  emailWelcome: z.boolean().optional(),
  emailOrderConfirm: z.boolean().optional(),
  emailShipped: z.boolean().optional(),

  // Fatura firma bilgileri
  invoiceCompanyName: z.string().optional(),
  invoiceCompanyTaxNumber: z.string().optional(),
  invoiceCompanyTaxOffice: z.string().optional(),
  invoiceCompanyAddress: z.string().optional(),
  invoiceCompanyCity: z.string().optional(),
  invoiceCompanyDistrict: z.string().optional(),
  invoiceCompanyZipCode: z.string().optional(),
  invoiceCompanyPhone: z.string().optional(),
  invoiceCompanyEmail: z.string().optional(),
  invoiceCompanyIban: z.string().optional(),
  invoicePrefix: z.string().optional(),

  // E-fatura ayarları (Trendyol E-Faturam)
  efaturaEnabled: z.boolean().optional(),
  efaturaEnvironment: z.enum(["test", "production"]).optional(),
  efaturaEmail: z.string().optional(),
  efaturaPassword: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await getOrCreateSettings();

    const settings = await db.siteSettings.update({
      where: { id: "default" },
      data: parsed.data,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Ayarlar güncellenemedi" },
      { status: 500 },
    );
  }
}
