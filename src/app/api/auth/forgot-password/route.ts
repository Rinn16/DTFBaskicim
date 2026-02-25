import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/validations/auth";
import { sendPasswordResetEmail } from "@/services/email.service";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    // Rate limit: 5 requests per IP per hour
    const { success } = await rateLimit(`forgot-password:${ip}`, 5, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla deneme. Lütfen 1 saat sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({ where: { email } });

    if (user && user.passwordHash) {
      // Delete any existing reset tokens for this user
      await db.verificationToken.deleteMany({
        where: { identifier: email },
      });

      // Generate a secure token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/sifremi-sifirla/${token}`;

      // Fire-and-forget email
      sendPasswordResetEmail(email, resetUrl).catch((err) =>
        console.error("[email] Password reset email failed:", err)
      );
    }

    return NextResponse.json({
      message:
        "Eğer bu email adresi ile kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi.",
    });
  } catch {
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
