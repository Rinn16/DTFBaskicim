import { ORDER_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/env";
import type { EmailTemplateType } from "@/generated/prisma/client";

export interface OrderEmailItem {
  imageName: string;
  quantity: number;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  totalMeters: number;
  totalAmount: number;
  shippingCost: number;
  paymentMethod: string;
  status: string;
  itemCount: number;
  items: OrderEmailItem[];
  orderDate: string;
  deliveryAddress: string;
  orderUrl: string;
  trackingCode?: string;
}

export function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DTF Baskıcım</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">DTF Baskıcım</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#71717a;text-align:center;">
                Bu email DTF Baskıcım tarafından otomatik olarak gönderilmiştir.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function replaceVariables(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

const paymentMethodLabel = (method: string) =>
  method === "CREDIT_CARD" ? "Kredi Kartı" : "Banka Havalesi";

function buildItemsHtml(items: OrderEmailItem[]): string {
  return items.map((item) => `<tr>
  <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="48" valign="top">
        <div style="width:44px;height:44px;background-color:#e2e8f0;border-radius:8px;text-align:center;line-height:44px;font-size:18px;color:#94a3b8;">&#9113;</div>
      </td>
      <td style="padding-left:12px;" valign="middle">
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;font-family:'Manrope',Arial,sans-serif;">DTF Metraj Baskı (56cm)</p>
        <p style="margin:2px 0 0;font-size:11px;color:#64748b;font-family:'Courier New',monospace;">Dosya: ${item.imageName}</p>
      </td>
      <td width="80" align="right" valign="middle">
        <span style="font-size:13px;font-weight:500;color:#475569;background-color:#f1f5f9;padding:4px 8px;border-radius:4px;font-family:'Manrope',Arial,sans-serif;">${item.quantity} Adet</span>
      </td>
    </tr></table>
  </td>
</tr>`).join("\n");
}

function orderEmailDataToVars(data: OrderEmailData): Record<string, string> {
  return {
    musteriAdi: data.customerName,
    siparisNo: data.orderNumber,
    toplamTutar: data.totalAmount.toFixed(2),
    toplamMetre: data.totalMeters.toFixed(2),
    urunSayisi: String(data.itemCount),
    odemeTuru: paymentMethodLabel(data.paymentMethod),
    siparisTarihi: data.orderDate,
    urunListesi: buildItemsHtml(data.items),
    teslimatAdresi: data.deliveryAddress,
    siparisDetayUrl: data.orderUrl,
    kargoUcreti: data.shippingCost.toFixed(2),
    takipKodu: data.trackingCode || "",
    siteUrl: getBaseUrl(),
  };
}

async function getDbTemplate(type: EmailTemplateType) {
  try {
    const tpl = await db.emailTemplate.findUnique({ where: { type } });
    if (tpl && tpl.isActive) return tpl;
  } catch {
    // DB not ready or table doesn't exist yet — fall through to hardcoded
  }
  return null;
}

function renderTemplate(content: string, vars: Record<string, string>): string {
  const processed = replaceVariables(content, vars);
  // If template contains full HTML document, use as-is; otherwise wrap in baseLayout
  if (processed.includes("</html>")) return processed;
  return baseLayout(processed);
}

// ========== Hardcoded fallbacks ==========

function welcomeHtmlFallback(customerName: string): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Hoş Geldiniz!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Merhaba ${customerName}, DTF Baskıcım ailesine hoş geldiniz!
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#52525b;">
      Hesabınız başarıyla oluşturuldu. Artık kolayca sipariş verebilir, tasarımlarınızı yükleyebilir ve siparişlerinizi takip edebilirsiniz.
    </p>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.
    </p>`;
  return baseLayout(content);
}

function orderConfirmationHtmlFallback(data: OrderEmailData): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Siparişiniz Alındı!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Merhaba ${data.customerName}, siparişiniz başarıyla oluşturuldu.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:6px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:8px 16px;">
        <p style="margin:0;font-size:12px;color:#71717a;">Sipariş No</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#18181b;font-family:monospace;">${data.orderNumber}</p>
      </td></tr>
      <tr><td style="padding:8px 16px;">
        <p style="margin:0;font-size:12px;color:#71717a;">Toplam</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#18181b;">${data.totalAmount.toFixed(2)} TL</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Siparişinizin durumunu hesabınızdan takip edebilirsiniz.
    </p>`;
  return baseLayout(content);
}

function orderShippedHtmlFallback(data: OrderEmailData): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Siparişiniz Kargoya Verildi!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Merhaba ${data.customerName}, <strong>${data.orderNumber}</strong> numaralı siparişiniz kargoya verildi.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#71717a;">Durum</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#18181b;">Kargoya Verildi</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Siparişinizin detaylarını hesabınızdan görüntüleyebilirsiniz.
    </p>`;
  return baseLayout(content);
}

function passwordResetHtmlFallback(resetUrl: string): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Şifre Sıfırlama</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">
            Şifremi Sıfırla
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;">
      Bu link 1 saat süreyle geçerlidir.
    </p>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
    </p>`;
  return baseLayout(content);
}

// ========== Public API (DB-first, fallback to hardcoded) ==========

export async function welcomeHtml(customerName: string): Promise<{ subject: string; html: string }> {
  const tpl = await getDbTemplate("WELCOME");
  if (tpl) {
    const vars = { musteriAdi: customerName, siteUrl: getBaseUrl() };
    return {
      subject: replaceVariables(tpl.subject, vars),
      html: renderTemplate(tpl.content, vars),
    };
  }
  return {
    subject: "DTF Baskıcım'a Hoş Geldiniz!",
    html: welcomeHtmlFallback(customerName),
  };
}

export async function orderConfirmationHtml(data: OrderEmailData): Promise<{ subject: string; html: string }> {
  const tpl = await getDbTemplate("ORDER_CONFIRMATION");
  if (tpl) {
    const vars = orderEmailDataToVars(data);
    return {
      subject: replaceVariables(tpl.subject, vars),
      html: renderTemplate(tpl.content, vars),
    };
  }
  return {
    subject: `Sipariş Onay - ${data.orderNumber}`,
    html: orderConfirmationHtmlFallback(data),
  };
}

export async function passwordResetHtml(resetUrl: string): Promise<{ subject: string; html: string }> {
  return {
    subject: "Şifre Sıfırlama - DTF Baskıcım",
    html: passwordResetHtmlFallback(resetUrl),
  };
}

export async function orderShippedHtml(data: OrderEmailData): Promise<{ subject: string; html: string }> {
  const tpl = await getDbTemplate("SHIPPED");
  if (tpl) {
    const vars = orderEmailDataToVars(data);
    return {
      subject: replaceVariables(tpl.subject, vars),
      html: renderTemplate(tpl.content, vars),
    };
  }
  return {
    subject: `Siparişiniz Kargoya Verildi - ${data.orderNumber}`,
    html: orderShippedHtmlFallback(data),
  };
}
