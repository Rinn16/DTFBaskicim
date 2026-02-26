import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createEmailVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/services/email.service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { success } = await rateLimit(`resend-verify:${session.user.id}`, 3, 3600);
    if (!success) {
      return NextResponse.json({ error: "Çok fazla deneme. 1 saat sonra tekrar deneyin." }, { status: 429 });
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user?.email) {
      return NextResponse.json({ error: "Email bulunamadı" }, { status: 400 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email zaten doğrulanmış" }, { status: 400 });
    }

    const token = await createEmailVerificationToken(user.email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/email-dogrula/${token}`;
    await sendVerificationEmail(user.email, verifyUrl);

    return NextResponse.json({ message: "Doğrulama emaili gönderildi" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
