import { db } from "@/lib/db";
import { calculatePrice } from "@/services/pricing.service";
import type { PricingTierData, CustomerPricingData } from "@/types/pricing";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";
import type { PaymentMethod } from "@/generated/prisma/client";

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DTF-${y}${m}${d}-${rand}`;
}

interface CreateOrderParams {
  userId?: string;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  addressId?: string;
  guestAddress?: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    zipCode?: string;
  };
  paymentMethod: PaymentMethod;
  cartItems: Array<{
    id?: string;
    layout: GangSheetLayout;
    items: GangSheetItem[];
    totalMeters: number;
  }>;
  discountCode?: string;
  customerNote?: string;
}

export async function createOrder(params: CreateOrderParams) {
  const {
    userId, guestEmail, guestName, guestPhone,
    addressId, paymentMethod,
    cartItems, discountCode, customerNote,
  } = params;

  // Toplam metre hesapla
  const totalHeightCm = cartItems.reduce(
    (sum, item) => sum + item.layout.totalHeightCm, 0
  );

  // Fiyatlandirma verilerini al
  const tiers = await db.pricingTier.findMany({
    where: { isActive: true },
    orderBy: { minMeters: "asc" },
  });

  const pricingTiers: PricingTierData[] = tiers.map((t) => ({
    id: t.id,
    minMeters: Number(t.minMeters),
    maxMeters: t.maxMeters ? Number(t.maxMeters) : null,
    pricePerMeter: Number(t.pricePerMeter),
  }));

  let customerPricing: CustomerPricingData | null = null;
  if (userId) {
    const cp = await db.customerPricing.findUnique({ where: { userId } });
    if (cp) customerPricing = { pricePerMeter: Number(cp.pricePerMeter) };
  }

  // Indirim kodu dogrulama
  let discountPercent = 0;
  let discountAmount = 0;
  let discountCodeId: string | undefined;

  if (discountCode) {
    const code = await db.discountCode.findUnique({ where: { code: discountCode.toUpperCase() } });
    if (code && code.isActive &&
        new Date() >= code.validFrom && new Date() <= code.validUntil &&
        (code.maxUses === null || code.usedCount < code.maxUses)) {
      const totalMeters = totalHeightCm / 100;
      if (!code.minOrderMeters || totalMeters >= Number(code.minOrderMeters)) {
        discountPercent = code.discountPercent ? Number(code.discountPercent) : 0;
        discountAmount = code.discountAmount ? Number(code.discountAmount) : 0;
        discountCodeId = code.id;
      }
    }
  }

  // Server-side fiyat hesabi
  const priceBreakdown = calculatePrice(
    totalHeightCm, pricingTiers, customerPricing, discountPercent, discountAmount
  );

  // Tum items'i birlestir
  const allItems = cartItems.flatMap((ci) => ci.items);
  const gangSheetLayout: GangSheetLayout = {
    items: allItems,
    totalHeightCm,
    totalWidthCm: 57,
  };

  // Transaction icerisinde siparis olustur
  const order = await db.$transaction(async (tx) => {
    // Indirim kodu usedCount artir
    if (discountCodeId) {
      await tx.discountCode.update({
        where: { id: discountCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Siparis olustur
    const orderNumber = generateOrderNumber();
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        addressId: addressId || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        totalMeters: priceBreakdown.totalMeters,
        pricePerMeter: priceBreakdown.pricePerMeter,
        subtotal: priceBreakdown.subtotal,
        discountAmount: priceBreakdown.discountAmount,
        taxAmount: priceBreakdown.taxAmount,
        totalAmount: priceBreakdown.totalAmount,
        discountCodeId: discountCodeId || null,
        status: "PENDING_PAYMENT",
        paymentMethod,
        paymentStatus: "PENDING",
        gangSheetLayout: gangSheetLayout as any,
        gangSheetWidth: 6732,
        gangSheetHeight: Math.round(totalHeightCm * 118.11),
        customerNote: customerNote || null,
      },
    });

    // OrderItem'lar olustur
    for (const item of allItems) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          imageKey: item.imageKey,
          imageName: item.imageName,
          imageWidth: item.originalWidthPx,
          imageHeight: item.originalHeightPx,
          quantity: item.placements.length,
          placements: item.placements as any,
        },
      });
    }

    // Durum gecmisi olustur
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        toStatus: "PENDING_PAYMENT",
        note: "Siparis olusturuldu",
      },
    });

    // Uye ise cart temizle
    if (userId) {
      await tx.cartItem.deleteMany({ where: { userId } });
    }

    return newOrder;
  });

  return { order, priceBreakdown };
}
