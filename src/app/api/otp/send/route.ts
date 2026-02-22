import crypto from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { phoneLoginSchema } from "@/validations/auth";
import { sendOtpSms } from "@/services/sms.service";

function generateOtp(): string {
  const buffer = crypto.getRandomValues(new Uint32Array(1));
  return (100000 + (buffer[0] % 900000)).toString();
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "127.0.0.1";

    const { success } = await rateLimit(`otp-send:${ip}`, 10, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla deneme. Lütfen 1 saat sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone } = phoneLoginSchema.parse(body);

    // Normalize phone number
    const normalizedPhone = phone.replace(/^(\+90|0)/, "").replace(/\s/g, "");
    const fullPhone = `+90${normalizedPhone}`;

    // Rate limit: max 3 OTPs per phone per hour
    const recentOtps = await db.otpCode.count({
      where: {
        phone: fullPhone,
        createdAt: {
          gt: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: "Çok fazla deneme yaptınız. Lütfen 1 saat sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.otpCode.create({
      data: {
        phone: fullPhone,
        code,
        expiresAt,
      },
    });

    // Send SMS in production, log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${fullPhone}: ${code}`);
    } else {
      const smsResult = await sendOtpSms(fullPhone, code);
      if (!smsResult.success) {
        console.error(`SMS send failed for ${fullPhone}:`, smsResult.error);
        return NextResponse.json(
          { error: "SMS gönderilemedi. Lütfen tekrar deneyin." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Doğrulama kodu gönderildi",
      ...(process.env.NODE_ENV === "development" && { devCode: code }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz telefon numarası" },
        { status: 400 }
      );
    }
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
