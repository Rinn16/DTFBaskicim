import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
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
      layout: data.layout as unknown as Prisma.InputJsonValue,
      totalMeters: data.totalMeters,
      items: data.items as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function updateCartItem(userId: string, itemId: string, data: AddToCartInput) {
  const existing = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!existing || existing.userId !== userId) return null;
  return db.cartItem.update({
    where: { id: itemId },
    data: {
      layout: data.layout as unknown as Prisma.InputJsonValue,
      items: data.items as unknown as Prisma.InputJsonValue,
      totalMeters: data.totalMeters,
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
