import { db } from "@/lib/db";
import type { SmsTemplateType } from "@/generated/prisma/client";

const VATANSMS_1TON_URL = "https://api.vatansms.net/api/v1/1toN";
const VATANSMS_NTON_URL = "https://api.vatansms.net/api/v1/NtoN";

interface SendSmsResult {
  success: boolean;
  error?: string;
}

function getCredentials() {
  const api_id = process.env.SMS_API_KEY;
  const api_key = process.env.SMS_API_SECRET;
  const sender = process.env.SMS_SENDER;

  if (!api_id || !api_key || !sender) {
    return null;
  }
  return { api_id, api_key, sender };
}

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "").replace(/^\+90/, "").replace(/^0/, "");
}

export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  const creds = getCredentials();
  if (!creds) {
    console.error("SMS credentials not configured");
    return { success: false, error: "SMS yapılandırması eksik" };
  }

  try {
    const response = await fetch(VATANSMS_1TON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        message_type: "turkce",
        message,
        message_content_type: "bilgi",
        phones: [cleanPhone(phone)],
      }),
    });

    const body = await response.json();

    if (body.status === "success") {
      return { success: true };
    }

    console.error(`VatanSMS error: ${body.message}`);
    return { success: false, error: `SMS gönderilemedi: ${body.message}` };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: "SMS servisi ile bağlantı kurulamadı" };
  }
}

export async function sendBulkSms(
  phones: string[],
  message: string,
): Promise<SendSmsResult> {
  const creds = getCredentials();
  if (!creds) {
    console.error("SMS credentials not configured");
    return { success: false, error: "SMS yapılandırması eksik" };
  }

  const cleanedPhones = phones.map(cleanPhone).filter((p) => p.length >= 10);
  if (cleanedPhones.length === 0) {
    return { success: false, error: "Geçerli telefon numarası bulunamadı" };
  }

  try {
    const response = await fetch(VATANSMS_1TON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        message_type: "turkce",
        message,
        message_content_type: "bilgi",
        phones: cleanedPhones,
      }),
    });

    const body = await response.json();

    if (body.status === "success") {
      return { success: true };
    }

    console.error(`VatanSMS bulk error: ${body.message}`);
    return { success: false, error: `Toplu SMS gönderilemedi: ${body.message}` };
  } catch (error) {
    console.error("Bulk SMS send error:", error);
    return { success: false, error: "SMS servisi ile bağlantı kurulamadı" };
  }
}

export async function sendNtoNSms(
  phoneMessages: { phone: string; message: string }[],
): Promise<SendSmsResult> {
  const creds = getCredentials();
  if (!creds) {
    console.error("SMS credentials not configured");
    return { success: false, error: "SMS yapılandırması eksik" };
  }

  const messages = phoneMessages.map((pm) => ({
    phone: cleanPhone(pm.phone),
    message: pm.message,
  })).filter((pm) => pm.phone.length >= 10);

  if (messages.length === 0) {
    return { success: false, error: "Geçerli telefon numarası bulunamadı" };
  }

  try {
    const response = await fetch(VATANSMS_NTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        message_type: "turkce",
        message_content_type: "bilgi",
        messages,
      }),
    });

    const body = await response.json();

    if (body.status === "success") {
      return { success: true };
    }

    console.error(`VatanSMS NtoN error: ${body.message}`);
    return { success: false, error: `NtoN SMS gönderilemedi: ${body.message}` };
  } catch (error) {
    console.error("NtoN SMS send error:", error);
    return { success: false, error: "SMS servisi ile bağlantı kurulamadı" };
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<SendSmsResult> {
  const message = `DTF Baskıcım doğrulama kodunuz: ${code}\nBu kodu kimseyle paylaşmayınız.`;
  return sendSms(phone, message);
}

/**
 * Sipariş olaylarında otomatik SMS gönderir (fire-and-forget).
 * Şablon bulunamazsa veya telefon yoksa sessizce döner.
 */
export async function sendOrderEventSms(
  order: {
    id: string;
    orderNumber: string;
    totalAmount: unknown;
    trackingCode?: string | null;
    user?: { name: string; phone?: string | null } | null;
    guestName?: string | null;
    guestPhone?: string | null;
    address?: { phone: string } | null;
  },
  trigger: SmsTemplateType,
): Promise<void> {
  try {
    // Check if SMS is enabled in site settings
    const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
    if (!settings?.smsEnabled) {
      console.log(`[sms] SMS disabled, skipping ${trigger} for order ${order.orderNumber}`);
      return;
    }

    const template = await db.smsTemplate.findFirst({
      where: { type: trigger, isActive: true },
    });
    if (!template) {
      console.log(`[sms] No active template for ${trigger}, skipping`);
      return;
    }

    const phone = order.user?.phone || order.guestPhone || order.address?.phone;
    if (!phone) {
      console.log(`[sms] No phone for order ${order.orderNumber}, skipping`);
      return;
    }

    const customerName = order.user?.name || order.guestName || "Müşterimiz";
    const totalAmount = Number(order.totalAmount).toFixed(2);

    let message = template.content
      .replace(/\{musteriAdi\}/g, customerName)
      .replace(/\{siparisNo\}/g, order.orderNumber)
      .replace(/\{toplamTutar\}/g, totalAmount);

    if (order.trackingCode) {
      message = message.replace(/\{takipKodu\}/g, order.trackingCode);
    }

    const result = await sendSms(phone, message);

    await db.smsLog.create({
      data: {
        templateId: template.id,
        message,
        recipientCount: 1,
        successCount: result.success ? 1 : 0,
        failCount: result.success ? 0 : 1,
        sentBy: "system",
      },
    });

    console.log(`[sms] ${trigger} SMS for order ${order.orderNumber}: ${result.success ? "OK" : result.error}`);
  } catch (err) {
    console.error(`[sms] sendOrderEventSms failed for ${trigger}:`, err);
  }
}
