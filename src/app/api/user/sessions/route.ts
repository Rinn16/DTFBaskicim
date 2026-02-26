import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const sessions = await db.userSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ sessions, currentSessionId: session.user.sessionId });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json({ error: "Oturumlar yüklenemedi" }, { status: 500 });
  }
}

// Sign out all sessions
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    await db.$transaction([
      db.userSession.deleteMany({ where: { userId: session.user.id } }),
      db.user.update({
        where: { id: session.user.id },
        data: { sessionsInvalidatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sessions delete error:", error);
    return NextResponse.json({ error: "Oturumlar sonlandırılamadı" }, { status: 500 });
  }
}
