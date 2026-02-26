import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public endpoint — only exposes non-sensitive settings needed by the frontend
export async function GET() {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: { ordersPaused: true, ordersPausedMessage: true },
    });

    return NextResponse.json({
      ordersPaused: settings?.ordersPaused ?? false,
      ordersPausedMessage: settings?.ordersPausedMessage ?? null,
    });
  } catch {
    return NextResponse.json({ ordersPaused: false, ordersPausedMessage: null });
  }
}
