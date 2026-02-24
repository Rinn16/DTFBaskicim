import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailTemplateSchema } from "@/validations/admin";
import type { EmailTemplateType } from "@/generated/prisma/client";

const DEFAULT_TEMPLATES: {
  name: string;
  type: EmailTemplateType;
  subject: string;
  content: string;
}[] = [
  {
    name: "Sipariş Onayı",
    type: "ORDER_CONFIRMATION",
    subject: "Sipariş Onay - {siparisNo}",
    content: `<h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Siparişiniz Alındı!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Merhaba {musteriAdi}, siparişiniz başarıyla oluşturuldu.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:6px;padding:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:8px 16px;">
          <p style="margin:0;font-size:12px;color:#71717a;">Sipariş Numarası</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#18181b;font-family:monospace;">{siparisNo}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;">
                <p style="margin:0;font-size:12px;color:#71717a;">Toplam Metre</p>
                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;">{toplamMetre} m</p>
              </td>
              <td style="width:50%;">
                <p style="margin:0;font-size:12px;color:#71717a;">Ürün Sayısı</p>
                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;">{urunSayisi} adet</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;">
                <p style="margin:0;font-size:12px;color:#71717a;">Ödeme Yöntemi</p>
                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;">{odemeTuru}</p>
              </td>
              <td style="width:50%;">
                <p style="margin:0;font-size:12px;color:#71717a;">Toplam Tutar</p>
                <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#18181b;">{toplamTutar} TL</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Siparişinizin durumunu hesabınızdan veya sipariş takip sayfasından takip edebilirsiniz.
    </p>`,
  },
  {
    name: "Durum Güncelleme",
    type: "STATUS_UPDATE",
    subject: "Sipariş Durumu Güncellendi - {siparisNo}",
    content: `<h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Sipariş Durumu Güncellendi</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Merhaba {musteriAdi}, <strong>{siparisNo}</strong> numaralı siparişinizin durumu güncellendi.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#71717a;">Yeni Durum</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#18181b;">{yeniDurum}</p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:50%;padding:8px 0;">
          <p style="margin:0;font-size:12px;color:#71717a;">Sipariş Numarası</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;font-family:monospace;">{siparisNo}</p>
        </td>
        <td style="width:50%;padding:8px 0;">
          <p style="margin:0;font-size:12px;color:#71717a;">Toplam Tutar</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;">{toplamTutar} TL</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Siparişinizin detaylarını hesabınızdan görüntüleyebilirsiniz.
    </p>`,
  },
];

async function seedDefaults() {
  const count = await db.emailTemplate.count();
  if (count > 0) return;

  for (const tpl of DEFAULT_TEMPLATES) {
    await db.emailTemplate.create({ data: tpl });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    await seedDefaults();

    const templates = await db.emailTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Email templates list error:", error);
    return NextResponse.json(
      { error: "E-posta şablonları yüklenemedi" },
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
    const parsed = emailTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const template = await db.emailTemplate.create({
      data: {
        name: parsed.data.name,
        type: body.type,
        subject: parsed.data.subject,
        content: parsed.data.content,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Email template create error:", error);
    return NextResponse.json(
      { error: "E-posta şablonu oluşturulamadı" },
      { status: 500 },
    );
  }
}
