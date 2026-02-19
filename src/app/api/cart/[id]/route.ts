import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteCartItem } from "@/services/cart.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteCartItem(session.user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Sepet ogesi bulunamadi" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
