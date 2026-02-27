import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailTemplateSchema } from "@/validations/admin";
import type { EmailTemplateType } from "@/generated/prisma/client";

const ORDER_CONFIRMATION_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Sipariş Onayı - DTF Baskıcım</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background-color:#0a0f16;font-family:'Manrope',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f16;padding:24px 16px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

<!-- LOGO -->
<tr><td align="center" style="padding-bottom:32px;">
<table cellpadding="0" cellspacing="0"><tr>
<td valign="middle" style="padding-right:8px;">
<div style="width:40px;height:40px;color:#00f0ff;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor" width="40" height="40"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"/></svg>
</div>
</td>
<td valign="middle">
<span style="font-size:24px;font-weight:700;letter-spacing:-0.025em;color:#ffffff;font-family:'Manrope',Arial,sans-serif;">DTF<span style="color:#137fec;">Baskıcım</span></span>
</td>
</tr></table>
</td></tr>

<!-- MAIN CARD -->
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">

<!-- Gradient bar -->
<tr><td style="height:8px;background:linear-gradient(to right,#137fec,#00f0ff,#137fec);font-size:0;line-height:0;">&nbsp;</td></tr>

<!-- Content -->
<tr><td style="padding:32px 32px 40px;">

<!-- Check icon -->
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
<div style="width:64px;height:64px;background-color:#f0fdf4;border-radius:50%;text-align:center;line-height:64px;">
<span style="font-size:32px;color:#16a34a;">&#10003;</span>
</div>
</td></tr></table>

<!-- Heading -->
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:40px;">
<h2 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#1e293b;letter-spacing:-0.025em;font-family:'Manrope',Arial,sans-serif;">Siparişiniz Hazırlanıyor</h2>
<p style="margin:0 0 8px;font-size:14px;color:#64748b;font-family:'Manrope',Arial,sans-serif;">Sipariş No: <span style="font-family:'Courier New',monospace;color:#137fec;font-weight:700;">#{siparisNo}</span></p>
<p style="margin:0;font-size:13px;color:#64748b;max-width:420px;font-family:'Manrope',Arial,sans-serif;">Dosyalarınız kontrol edildi ve üretim sırasına alındı. Baskı işlemi başlamak üzere.</p>
</td></tr></table>

<!-- Product summary -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #f1f5f9;overflow:hidden;margin-bottom:32px;">
<!-- Header -->
<tr><td style="padding:12px 16px;background-color:rgba(241,245,249,0.5);border-bottom:1px solid #e2e8f0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-family:'Manrope',Arial,sans-serif;">Ürün Özeti</td>
<td align="right" style="font-size:11px;font-family:'Courier New',monospace;color:#94a3b8;">{siparisTarihi}</td>
</tr></table>
</td></tr>
<!-- Items -->
{urunListesi}
<!-- Total row -->
<tr><td style="padding:14px 16px;background-color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:14px;font-weight:500;color:#ffffff;font-family:'Manrope',Arial,sans-serif;">Toplam Tutar</td>
<td align="right" style="font-size:20px;font-weight:700;color:#00f0ff;font-family:'Manrope',Arial,sans-serif;">\u20BA{toplamTutar}</td>
</tr></table>
</td></tr>
</table>

<!-- Info grid -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;">
<tr>
<td width="50%" valign="top" style="padding-right:12px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;border:1px solid #f1f5f9;">
<tr><td style="padding:16px;">
<p style="margin:0 0 8px;font-weight:700;color:#1e293b;font-size:14px;font-family:'Manrope',Arial,sans-serif;">&#128230; Teslimat Adresi</p>
<p style="margin:0;font-size:13px;color:#475569;line-height:1.6;font-family:'Manrope',Arial,sans-serif;">{teslimatAdresi}</p>
</td></tr>
</table>
</td>
<td width="50%" valign="top" style="padding-left:12px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;border:1px solid #f1f5f9;">
<tr><td style="padding:16px;">
<p style="margin:0 0 8px;font-weight:700;color:#1e293b;font-size:14px;font-family:'Manrope',Arial,sans-serif;">&#128179; Ödeme Bilgileri</p>
<p style="margin:0;font-size:13px;color:#475569;line-height:1.6;font-family:'Manrope',Arial,sans-serif;">
{odemeTuru}<br/>
<span style="color:#16a34a;font-weight:500;">Ödeme Başarılı</span>
</p>
</td></tr>
</table>
</td>
</tr>
</table>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="{siparisDetayUrl}" style="display:inline-block;background-color:#137fec;color:#ffffff;font-weight:700;font-size:15px;padding:16px 32px;border-radius:50px;text-decoration:none;box-shadow:0 0 15px rgba(19,127,236,0.4);font-family:'Manrope',Arial,sans-serif;" target="_blank">Siparişi Görüntüle &#8594;</a>
<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;font-family:'Manrope',Arial,sans-serif;">Siparişinizin durumunu panel üzerinden canlı takip edebilirsiniz.</p>
</td></tr></table>

</td></tr>

<!-- Card footer -->
<tr><td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
<p style="margin:0 0 12px;font-size:13px;color:#64748b;font-family:'Manrope',Arial,sans-serif;">Bir sorunuz mu var? Destek ekibimiz 7/24 hazır.</p>
<p style="margin:0;font-size:13px;font-family:'Manrope',Arial,sans-serif;">
<a href="{siteUrl}" style="color:#137fec;text-decoration:none;font-weight:500;">Yardım Merkezi</a>
<span style="color:#cbd5e1;margin:0 8px;">|</span>
<a href="{siteUrl}" style="color:#137fec;text-decoration:none;font-weight:500;">Whatsapp Destek</a>
</p>
</td></tr>

</table>
</td></tr>

<!-- OUTER FOOTER -->
<tr><td style="padding:32px 0;text-align:center;">
<p style="margin:0 0 4px;font-size:11px;color:#64748b;font-family:'Manrope',Arial,sans-serif;">
<span style="display:inline-block;width:6px;height:6px;background-color:#22c55e;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>
Production Started
<span style="color:#334155;margin:0 8px;">&bull;</span>
<span style="font-family:'Courier New',monospace;">SYS_MSG_ID: {siparisNo}_CONF</span>
</p>
<p style="margin:8px 0;font-size:11px;color:#64748b;font-family:'Manrope',Arial,sans-serif;">&copy; ${new Date().getFullYear()} DTF Baskıcım. Tüm hakları saklıdır.</p>
<p style="margin:0;font-size:11px;color:#475569;max-width:480px;display:inline-block;font-family:'Manrope',Arial,sans-serif;">Bu e-posta otomasyon sistemimiz tarafından oluşturulmuştur. Lütfen bu e-postayı yanıtlamayınız.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

const SHIPPED_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Sipariş Kargoya Verildi - DTF Baskıcım</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background-color:#0a0f16;font-family:'Manrope',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f16;padding:24px 16px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

<!-- LOGO -->
<tr><td align="center" style="padding-bottom:32px;">
<table cellpadding="0" cellspacing="0"><tr>
<td valign="middle" style="padding-right:8px;">
<div style="width:40px;height:40px;color:#00f0ff;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor" width="40" height="40"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"/></svg>
</div>
</td>
<td valign="middle">
<span style="font-size:24px;font-weight:700;letter-spacing:-0.025em;color:#ffffff;font-family:'Manrope',Arial,sans-serif;">DTF<span style="color:#137fec;">Baskıcım</span></span>
</td>
</tr></table>
</td></tr>

<!-- MAIN CARD -->
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">

<!-- Gradient bar -->
<tr><td style="height:8px;background:linear-gradient(to right,#137fec,#00f0ff,#137fec);font-size:0;line-height:0;">&nbsp;</td></tr>

<!-- Content -->
<tr><td style="padding:32px 32px 40px;">

<!-- Shipping icon -->
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
<div style="width:80px;height:80px;background-color:#eff6ff;border-radius:50%;text-align:center;line-height:80px;box-shadow:0 0 15px rgba(19,127,236,0.4);">
<span style="font-size:40px;">&#128666;</span>
</div>
</td></tr></table>

<!-- Heading -->
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:40px;">
<h2 style="margin:0 0 8px;font-size:30px;font-weight:800;color:#1e293b;letter-spacing:-0.025em;font-family:'Manrope',Arial,sans-serif;">Kargonuz Yola &#199;&#305;kt&#305;!</h2>
<p style="margin:0 0 8px;font-size:14px;color:#64748b;font-family:'Manrope',Arial,sans-serif;">Takip No: <span style="font-family:'Courier New',monospace;color:#137fec;font-weight:700;font-size:18px;">#{takipKodu}</span></p>
<p style="margin:0;font-size:13px;color:#64748b;max-width:420px;font-family:'Manrope',Arial,sans-serif;">Sipari&#351;iniz paketlendi ve kargo firmas&#305;na teslim edildi. A&#351;a&#287;&#305;daki butona t&#305;klayarak kargonuzun nerede oldu&#287;unu anl&#305;k olarak takip edebilirsiniz.</p>
</td></tr></table>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;"><tr><td align="center">
<a href="{siparisDetayUrl}" style="display:inline-block;background-color:#137fec;color:#ffffff;font-weight:700;font-size:17px;padding:16px 40px;border-radius:50px;text-decoration:none;box-shadow:0 0 15px rgba(19,127,236,0.4);font-family:'Manrope',Arial,sans-serif;" target="_blank">&#128225; Kargomu Takip Et &#8594;</a>
</td></tr></table>

<!-- Package contents -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #f1f5f9;overflow:hidden;margin-bottom:32px;">
<!-- Header -->
<tr><td style="padding:12px 16px;background-color:rgba(241,245,249,0.5);border-bottom:1px solid #e2e8f0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-family:'Manrope',Arial,sans-serif;">Paket &#304;&#231;eri&#287;i</td>
<td align="right" style="font-size:11px;font-family:'Courier New',monospace;color:#94a3b8;">{siparisTarihi}</td>
</tr></table>
</td></tr>
<!-- Items -->
{urunListesi}
</table>

<!-- Delivery address -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(239,246,255,0.5);border-radius:12px;border:1px solid #dbeafe;overflow:hidden;margin-bottom:32px;">
<tr><td style="padding:24px;">
<p style="margin:0 0 12px;font-weight:700;color:#1e293b;font-size:14px;font-family:'Manrope',Arial,sans-serif;">&#128205; Teslimat Adresi</p>
<p style="margin:0;font-size:13px;color:#475569;line-height:1.6;font-family:'Manrope',Arial,sans-serif;">{teslimatAdresi}</p>
</td></tr>
</table>

<!-- Estimated delivery note -->
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<p style="margin:0;font-size:12px;color:#94a3b8;font-family:'Manrope',Arial,sans-serif;">Tahmini teslimat s&#252;resi: 1-3 i&#351; g&#252;n&#252;.</p>
</td></tr></table>

</td></tr>

<!-- Card footer -->
<tr><td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
<p style="margin:0 0 12px;font-size:13px;color:#64748b;font-family:'Manrope',Arial,sans-serif;">Bir sorunuz mu var? Destek ekibimiz 7/24 haz&#305;r.</p>
<p style="margin:0;font-size:13px;font-family:'Manrope',Arial,sans-serif;">
<a href="{siteUrl}" style="color:#137fec;text-decoration:none;font-weight:500;">Yard&#305;m Merkezi</a>
<span style="color:#cbd5e1;margin:0 8px;">|</span>
<a href="{siteUrl}" style="color:#137fec;text-decoration:none;font-weight:500;">Whatsapp Destek</a>
</p>
</td></tr>

</table>
</td></tr>

<!-- OUTER FOOTER -->
<tr><td style="padding:32px 0;text-align:center;">
<p style="margin:0 0 4px;font-size:11px;color:#64748b;font-family:'Manrope',Arial,sans-serif;">
<span style="display:inline-block;width:6px;height:6px;background-color:#137fec;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>
In Transit
<span style="color:#334155;margin:0 8px;">&bull;</span>
<span style="font-family:'Courier New',monospace;">SYS_MSG_ID: {siparisNo}_SHIP</span>
</p>
<p style="margin:8px 0;font-size:11px;color:#64748b;font-family:'Manrope',Arial,sans-serif;">&copy; ${new Date().getFullYear()} DTF Bask&#305;c&#305;m. T&#252;m haklar&#305; sakl&#305;d&#305;r.</p>
<p style="margin:0;font-size:11px;color:#475569;max-width:480px;display:inline-block;font-family:'Manrope',Arial,sans-serif;">Bu e-posta otomasyon sistemimiz taraf&#305;ndan olu&#351;turulmu&#351;tur. L&#252;tfen bu e-postay&#305; yan&#305;tlamay&#305;n&#305;z.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

const DEFAULT_TEMPLATES: {
  name: string;
  type: EmailTemplateType;
  subject: string;
  content: string;
}[] = [
  {
    name: "Hoş Geldiniz",
    type: "WELCOME",
    subject: "DTF Baskıcım'a Hoş Geldiniz!",
    content: `<h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Hoş Geldiniz!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Merhaba {musteriAdi}, DTF Baskıcım ailesine hoş geldiniz!
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#52525b;">
      Hesabınız başarıyla oluşturuldu. Artık kolayca sipariş verebilir, tasarımlarınızı yükleyebilir ve siparişlerinizi takip edebilirsiniz.
    </p>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.
    </p>`,
  },
  {
    name: "Sipariş Onayı",
    type: "ORDER_CONFIRMATION",
    subject: "Sipariş Onay - #{siparisNo}",
    content: ORDER_CONFIRMATION_HTML,
  },
  {
    name: "Kargoya Verildi",
    type: "SHIPPED",
    subject: "Siparişiniz Kargoya Verildi - #{siparisNo}",
    content: SHIPPED_HTML,
  },
];

let seeded = false;

async function seedDefaults() {
  if (seeded) return;

  const existing = await db.emailTemplate.findMany({ select: { type: true } });
  const existingTypes = new Set(existing.map((t) => t.type));

  for (const tpl of DEFAULT_TEMPLATES) {
    if (!existingTypes.has(tpl.type)) {
      await db.emailTemplate.create({ data: tpl });
    }
  }

  seeded = true;
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
