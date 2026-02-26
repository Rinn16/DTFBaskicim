import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { sendOtpSms } from "@/services/sms.service";

const schema = z.object({
  newPhone: z.string().min(10, "Geçerli bir telefon numarası girin"),
});

function generateOtp(): string {
  const buffer = crypto.getRandomValues(new Uint32Array(1));
  return (100000 + (buffer[0] % 900000)).toString();
}

// POST — request phone change (send OTP to new phone)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { success: rlOk } = await rateLimit(`change-phone:${session.user.id}`, 3, 3600);
    if (!rlOk) {
      return NextResponse.json({ error: "Çok fazla deneme. Lütfen bekleyin." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const normalized = parsed.data.newPhone.replace(/^(\+90|0)/, "").replace(/\s/g, "");
    const newPhone = `+90${normalized}`;

    // Check if phone already in use
    const existing = await db.user.findUnique({ where: { phone: newPhone } });
    if (existing) {
      return NextResponse.json({ error: "Bu telefon numarası zaten kullanılıyor" }, { status: 400 });
    }

    // Store pending phone
    await db.user.update({
      where: { id: session.user.id },
      data: { pendingPhone: newPhone },
    });

    // Rate limit OTPs per phone
    const recentOtps = await db.otpCode.count({
      where: {
        phone: newPhone,
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: "Bu numaraya çok fazla kod gönderildi. Lütfen 1 saat sonra deneyin." },
        { status: 429 }
      );
    }

    const code = generateOtp();
    await db.otpCode.create({
      data: { phone: newPhone, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Phone change OTP for ${newPhone}: ${code}`);
    } else {
      const smsResult = await sendOtpSms(newPhone, code);
      if (!smsResult.success) {
        return NextResponse.json({ error: "SMS gönderilemedi. Lütfen tekrar deneyin." }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV === "development" && { devCode: code }),
    });
  } catch (error) {
    console.error("Change phone error:", error);
    return NextResponse.json({ error: "Telefon değiştirilemedi" }, { status: 500 });
  }
}
