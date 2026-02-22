import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { autoPack } from "@/services/packing.service";
import type { DesignInput } from "@/types/canvas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { designs } = (await request.json()) as { designs: DesignInput[] };

    if (!designs || !Array.isArray(designs) || designs.length === 0) {
      return NextResponse.json(
        { error: "En az bir tasarım gerekli" },
        { status: 400 }
      );
    }

    const result = autoPack(designs);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Auto-place error:", error);
    return NextResponse.json(
      { error: "Otomatik yerleştirme hatası" },
      { status: 500 }
    );
  }
}
