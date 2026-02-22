const NETGSM_API_URL = "https://api.netgsm.com.tr/sms/send/get";

interface SendSmsResult {
  success: boolean;
  error?: string;
}

export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  const usercode = process.env.SMS_API_KEY;
  const password = process.env.SMS_API_SECRET;
  const msgheader = process.env.SMS_SENDER;

  if (!usercode || !password || !msgheader) {
    console.error("SMS credentials not configured");
    return { success: false, error: "SMS yapılandırması eksik" };
  }

  // Netgsm expects 10-digit number without country code
  const gsmno = phone.replace(/^\+90/, "");

  const params = new URLSearchParams({
    usercode,
    password,
    gsmno,
    message,
    msgheader,
    dil: "TR",
  });

  try {
    const response = await fetch(`${NETGSM_API_URL}?${params.toString()}`);
    const body = await response.text();

    // Netgsm returns codes like "00" for success, "30" for invalid credentials, etc.
    const code = body.split(" ")[0];
    if (code === "00" || code === "01" || code === "02") {
      return { success: true };
    }

    console.error(`Netgsm error code: ${code}, response: ${body}`);
    return { success: false, error: `SMS gönderilemedi (kod: ${code})` };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: "SMS servisi ile bağlantı kurulamadı" };
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<SendSmsResult> {
  const message = `DTF Baskıcım doğrulama kodunuz: ${code}\nBu kodu kimseyle paylaşmayınız.`;
  return sendSms(phone, message);
}
