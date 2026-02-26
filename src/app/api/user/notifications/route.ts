import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { emailOptIn: true, smsOptIn: true },
    });

    return NextResponse.json({ emailOptIn: user?.emailOptIn ?? true, smsOptIn: user?.smsOptIn ?? true });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Tercihler yüklenemedi" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: parsed.data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Notifications update error:", error);
    return NextResponse.json({ error: "Tercihler güncellenemedi" }, { status: 500 });
  }
}
