import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { sendContactNotification } from "@/services/email.service";

const schema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı").max(100),
  email: z.string().email("Geçerli bir email adresi girin"),
  subject: z.string().min(3, "Konu en az 3 karakter olmalı").max(200),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalı").max(5000),
});

export async function POST(request: Request) {
  try {
    const rawIp = request.headers.get("x-forwarded-for") ?? "unknown";
    const clientIp = rawIp.split(",")[0].trim();

    const { success: rlOk } = await rateLimit(`contact:${clientIp}`, 5, 3600);
    if (!rlOk) {
      return NextResponse.json({ error: "Çok fazla mesaj gönderdiniz. Lütfen bir saat sonra tekrar deneyin." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    // Get admin email from settings
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: { invoiceCompanyEmail: true },
    });
    const adminEmail = settings?.invoiceCompanyEmail || process.env.SMTP_FROM;

    if (adminEmail) {
      await sendContactNotification(adminEmail, { name, email, subject, message });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Mesajınız gönderilemedi" }, { status: 500 });
  }
}
