import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getCartItems, addCartItem } from "@/services/cart.service";
import { addToCartSchema } from "@/validations/cart";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    const items = await getCartItems(session.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json({ error: "Sepet yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { success: rlOk } = await rateLimit(`cart:${session.user.id}`, 30, 3600);
    if (!rlOk) {
      return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const item = await addCartItem(session.user.id, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: "Sepete eklenemedi" }, { status: 500 });
  }
}
