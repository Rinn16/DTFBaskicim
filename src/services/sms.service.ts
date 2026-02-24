const VATANSMS_API_URL = "https://api.vatansms.net/api/v1/1toN";

interface SendSmsResult {
  success: boolean;
  error?: string;
}

export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  const api_id = process.env.SMS_API_KEY;
  const api_key = process.env.SMS_API_SECRET;
  const sender = process.env.SMS_SENDER;

  if (!api_id || !api_key || !sender) {
    console.error("SMS credentials not configured");
    return { success: false, error: "SMS yapılandırması eksik" };
  }

  // VatanSMS expects 10-digit number without +90 or leading 0
  const cleanPhone = phone.replace(/^\+90/, "").replace(/^0/, "");

  try {
    const response = await fetch(VATANSMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_id,
        api_key,
        sender,
        message_type: "turkce",
        message,
        message_content_type: "bilgi",
        phones: [cleanPhone],
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

export async function sendOtpSms(phone: string, code: string): Promise<SendSmsResult> {
  const message = `DTF Baskıcım doğrulama kodunuz: ${code}\nBu kodu kimseyle paylaşmayınız.`;
  return sendSms(phone, message);
}
