import { ORDER_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import type { EmailTemplateType } from "@/generated/prisma/client";

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  totalMeters: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  itemCount: number;
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

function orderEmailDataToVars(data: OrderEmailData): Record<string, string> {
  return {
    musteriAdi: data.customerName,
    siparisNo: data.orderNumber,
    toplamTutar: data.totalAmount.toFixed(2),
    toplamMetre: data.totalMeters.toFixed(2),
    urunSayisi: String(data.itemCount),
    odemeTuru: paymentMethodLabel(data.paymentMethod),
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

// ========== Hardcoded fallbacks ==========

function orderConfirmationHtmlFallback(data: OrderEmailData): string {
  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Siparişiniz Alındı!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Merhaba ${data.customerName}, siparişiniz başarıyla oluşturuldu.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:6px;padding:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:8px 16px;">
          <p style="margin:0;font-size:12px;color:#71717a;">Sipariş Numarası</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#18181b;font-family:monospace;">${data.orderNumber}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;">
                <p style="margin:0;font-size:12px;color:#71717a;">Toplam Metre</p>
                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;">${data.totalMeters.toFixed(2)} m</p>
              </td>
              <td style="width:50%;">
                <p style="margin:0;font-size:12px;color:#71717a;">Ürün Sayısı</p>
                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;">${data.itemCount} adet</p>
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
                <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;">${paymentMethodLabel(data.paymentMethod)}</p>
              </td>
              <td style="width:50%;">
                <p style="margin:0;font-size:12px;color:#71717a;">Toplam Tutar</p>
                <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#18181b;">${data.totalAmount.toFixed(2)} TL</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Siparişinizin durumunu hesabınızdan veya sipariş takip sayfasından takip edebilirsiniz.
    </p>`;

  return baseLayout(content);
}

function orderStatusUpdateHtmlFallback(data: OrderEmailData, newStatus: string): string {
  const statusLabel = ORDER_STATUSES[newStatus as keyof typeof ORDER_STATUSES] || newStatus;

  const content = `
    <h2 style="margin:0 0 8px;font-size:18px;color:#18181b;">Sipariş Durumu Güncellendi</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#52525b;">
      Merhaba ${data.customerName}, <strong>${data.orderNumber}</strong> numaralı siparişinizin durumu güncellendi.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#71717a;">Yeni Durum</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#18181b;">${statusLabel}</p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:50%;padding:8px 0;">
          <p style="margin:0;font-size:12px;color:#71717a;">Sipariş Numarası</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;font-family:monospace;">${data.orderNumber}</p>
        </td>
        <td style="width:50%;padding:8px 0;">
          <p style="margin:0;font-size:12px;color:#71717a;">Toplam Tutar</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#18181b;">${data.totalAmount.toFixed(2)} TL</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#71717a;">
      Siparişinizin detaylarını hesabınızdan görüntüleyebilirsiniz.
    </p>`;

  return baseLayout(content);
}

// ========== Public API (DB-first, fallback to hardcoded) ==========

export async function orderConfirmationHtml(data: OrderEmailData): Promise<{ subject: string; html: string }> {
  const tpl = await getDbTemplate("ORDER_CONFIRMATION");
  if (tpl) {
    const vars = orderEmailDataToVars(data);
    return {
      subject: replaceVariables(tpl.subject, vars),
      html: baseLayout(replaceVariables(tpl.content, vars)),
    };
  }
  return {
    subject: `Sipariş Onay - ${data.orderNumber}`,
    html: orderConfirmationHtmlFallback(data),
  };
}

export async function orderStatusUpdateHtml(
  data: OrderEmailData,
  newStatus: string,
): Promise<{ subject: string; html: string }> {
  const statusLabel = ORDER_STATUSES[newStatus as keyof typeof ORDER_STATUSES] || newStatus;
  const tpl = await getDbTemplate("STATUS_UPDATE");
  if (tpl) {
    const vars = { ...orderEmailDataToVars(data), yeniDurum: statusLabel };
    return {
      subject: replaceVariables(tpl.subject, vars),
      html: baseLayout(replaceVariables(tpl.content, vars)),
    };
  }
  return {
    subject: `Sipariş Durumu Güncellendi - ${data.orderNumber}`,
    html: orderStatusUpdateHtmlFallback(data, newStatus),
  };
}
