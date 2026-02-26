import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  code: z.string().length(6, "Kod 6 haneli olmalı"),
});

// POST — verify OTP and apply phone change
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { pendingPhone: true },
    });
    if (!user?.pendingPhone) {
      return NextResponse.json({ error: "Telefon değişiklik talebi bulunamadı" }, { status: 400 });
    }

    const otpRecord = await db.otpCode.findFirst({
      where: {
        phone: user.pendingPhone,
        code: parsed.data.code,
        expiresAt: { gt: new Date() },
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş kod" }, { status: 400 });
    }

    // Check still available
    const conflict = await db.user.findUnique({ where: { phone: user.pendingPhone } });
    if (conflict) {
      await db.otpCode.update({ where: { id: otpRecord.id }, data: { verified: true } });
      return NextResponse.json({ error: "Bu telefon numarası artık kullanılamaz" }, { status: 400 });
    }

    await db.otpCode.update({ where: { id: otpRecord.id }, data: { verified: true } });
    await db.user.update({
      where: { id: session.user.id },
      data: { phone: user.pendingPhone, pendingPhone: null, phoneVerified: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Verify phone change error:", error);
    return NextResponse.json({ error: "Doğrulama başarısız" }, { status: 500 });
  }
}
