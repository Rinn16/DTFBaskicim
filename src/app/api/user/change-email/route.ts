import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/services/email.service";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  newEmail: z.string().email("Geçerli bir email adresi girin"),
});

// POST — request email change (send verification link to new email)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { success: rlOk } = await rateLimit(`change-email:${session.user.id}`, 3, 3600);
    if (!rlOk) {
      return NextResponse.json({ error: "Çok fazla deneme. Lütfen bekleyin." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { newEmail } = parsed.data;

    // Check if email already in use
    const existing = await db.user.findUnique({ where: { email: newEmail } });
    if (existing) {
      return NextResponse.json({ error: "Bu email adresi zaten kullanılıyor" }, { status: 400 });
    }

    // Store pending email on user
    await db.user.update({
      where: { id: session.user.id },
      data: { pendingEmail: newEmail },
    });

    // Create verification token (identifier = userId:email-change)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const identifier = `email-change:${session.user.id}`;

    await db.verificationToken.deleteMany({ where: { identifier } });
    await db.verificationToken.create({ data: { identifier, token, expires } });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/hesabim/email-dogrula?token=${token}`;

    await sendVerificationEmail(newEmail, verifyUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Change email error:", error);
    return NextResponse.json({ error: "Email değiştirilemedi" }, { status: 500 });
  }
}

// GET — verify email change token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
    }

    const record = await db.verificationToken.findFirst({
      where: { token, expires: { gt: new Date() } },
    });
    if (!record) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş token" }, { status: 400 });
    }

    // identifier = "email-change:{userId}"
    if (!record.identifier.startsWith("email-change:")) {
      return NextResponse.json({ error: "Geçersiz token" }, { status: 400 });
    }

    const userId = record.identifier.replace("email-change:", "");
    const user = await db.user.findUnique({ where: { id: userId }, select: { pendingEmail: true } });
    if (!user?.pendingEmail) {
      return NextResponse.json({ error: "Email değişiklik talebi bulunamadı" }, { status: 400 });
    }

    // Check if still available
    const conflict = await db.user.findUnique({ where: { email: user.pendingEmail } });
    if (conflict) {
      await db.verificationToken.delete({ where: { identifier_token: { identifier: record.identifier, token } } });
      return NextResponse.json({ error: "Bu email adresi artık kullanılamaz" }, { status: 400 });
    }

    // Apply change
    await db.user.update({
      where: { id: userId },
      data: { email: user.pendingEmail, pendingEmail: null, emailVerified: true },
    });
    await db.verificationToken.delete({ where: { identifier_token: { identifier: record.identifier, token } } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Verify email change error:", error);
    return NextResponse.json({ error: "Doğrulama başarısız" }, { status: 500 });
  }
}
