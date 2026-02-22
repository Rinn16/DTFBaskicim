import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDrafts, createDraft } from "@/services/draft.service";
import { saveDraftSchema } from "@/validations/draft";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    const drafts = await getDrafts(session.user.id);
    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("Draft fetch error:", error);
    return NextResponse.json({ error: "Taslaklar yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = saveDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const draft = await createDraft(session.user.id, parsed.data.name, parsed.data.data);
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error("Draft create error:", error);
    const message = error instanceof Error ? error.message : "Taslak oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
