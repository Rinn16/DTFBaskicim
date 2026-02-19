import { db } from "@/lib/db";
import type { AddToCartInput } from "@/validations/cart";

export async function getCartItems(userId: string) {
  return db.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addCartItem(userId: string, data: AddToCartInput) {
  return db.cartItem.create({
    data: {
      userId,
      layout: data.layout as any,
      totalMeters: data.totalMeters,
      items: data.items as any,
    },
  });
}

export async function deleteCartItem(userId: string, itemId: string) {
  const item = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) return null;
  return db.cartItem.delete({ where: { id: itemId } });
}

export async function clearCart(userId: string) {
  return db.cartItem.deleteMany({ where: { userId } });
}
