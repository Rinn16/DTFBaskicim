import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const users = await db.user.findMany({
      where: { phone: { not: null } },
      select: { phone: true, name: true, surname: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        phone: u.phone,
        name: `${u.name} ${u.surname}`,
      })),
    });
  } catch (error) {
    console.error("Phone list error:", error);
    return NextResponse.json(
      { error: "Telefon listesi yüklenemedi" },
      { status: 500 },
    );
  }
}
