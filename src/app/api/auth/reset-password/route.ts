import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/validations/auth";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    const { success } = await rateLimit(`reset-password:${ip}`, 10, 3600);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla deneme. Lütfen 1 saat sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş link. Lütfen tekrar deneyin." },
        { status: 400 }
      );
    }

    // Check expiration
    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: "Bu linkin süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebi oluşturun." },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 400 }
      );
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({
      message: "Şifreniz başarıyla değiştirildi.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
