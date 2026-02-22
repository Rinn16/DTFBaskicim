import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 });
    }

    await db.$transaction([
      db.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      }),
      db.address.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set default address error:", error);
    return NextResponse.json({ error: "Varsayılan adres ayarlanamadı" }, { status: 500 });
  }
}
