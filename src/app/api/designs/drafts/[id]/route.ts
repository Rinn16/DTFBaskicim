import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDraft, updateDraft, deleteDraft } from "@/services/draft.service";
import { saveDraftSchema } from "@/validations/draft";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const draft = await getDraft(session.user.id, id);
    if (!draft) {
      return NextResponse.json({ error: "Taslak bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Draft get error:", error);
    return NextResponse.json({ error: "Taslak yüklenemedi" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = saveDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const updated = await updateDraft(session.user.id, id, parsed.data.name, parsed.data.data);
    if (!updated) {
      return NextResponse.json({ error: "Taslak bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ draft: updated });
  } catch (error) {
    console.error("Draft update error:", error);
    const message = error instanceof Error ? error.message : "Taslak güncellenemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteDraft(session.user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Taslak bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Draft delete error:", error);
    return NextResponse.json({ error: "Taslak silinemedi" }, { status: 500 });
  }
}
