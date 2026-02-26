import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
    }

    const record = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş link" }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Bu linkin süresi dolmuş. Yeni bir doğrulama emaili isteyin." }, { status: 400 });
    }

    // Email'i doğrula
    await db.user.updateMany({
      where: { email: record.identifier },
      data: { emailVerified: true },
    });

    // Token'ı sil (tek kullanımlık)
    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: "Email adresiniz doğrulandı" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
