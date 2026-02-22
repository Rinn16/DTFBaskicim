import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteCartItem, updateCartItem } from "@/services/cart.service";
import { addToCartSchema } from "@/validations/cart";

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
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const updated = await updateCartItem(session.user.id, id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Sepet ögesi bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
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
    const deleted = await deleteCartItem(session.user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Sepet ögesi bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
