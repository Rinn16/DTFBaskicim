import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCartItems, addCartItem } from "@/services/cart.service";
import { addToCartSchema } from "@/validations/cart";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }
    const items = await getCartItems(session.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json({ error: "Sepet yuklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const item = await addCartItem(session.user.id, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: "Sepete eklenemedi" }, { status: 500 });
  }
}
