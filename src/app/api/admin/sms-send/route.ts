import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { smsSendSchema } from "@/validations/admin";
import { sendBulkSms } from "@/services/sms.service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = smsSendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { message, phones, templateId } = parsed.data;

    // Check if SMS is enabled
    const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
    if (!settings?.smsEnabled) {
      return NextResponse.json(
        { error: "SMS sistemi devre dışı. Ayarlar'dan etkinleştirin." },
        { status: 400 },
      );
    }

    const result = await sendBulkSms(phones, message);

    await db.smsLog.create({
      data: {
        templateId: templateId || null,
        message,
        recipientCount: phones.length,
        successCount: result.success ? phones.length : 0,
        failCount: result.success ? 0 : phones.length,
        sentBy: session.user.name || session.user.email || "Admin",
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "SMS gönderilemedi" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${phones.length} alıcıya SMS gönderildi`,
    });
  } catch (error) {
    console.error("SMS send error:", error);
    return NextResponse.json(
      { error: "SMS gönderilemedi" },
      { status: 500 },
    );
  }
}
