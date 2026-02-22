import { db } from "@/lib/db";
import { calculatePrice } from "@/services/pricing.service";
import { sendOrderConfirmation } from "@/services/email.service";
import type { PricingTierData, CustomerPricingData, ShippingConfigData } from "@/types/pricing";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";
import type { PaymentMethod, BillingType, Prisma } from "@/generated/prisma/client";

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
  billingSameAddress?: boolean;
  billingInfo?: {
    billingType: BillingType;
    billingFullName?: string;
    billingCompanyName?: string;
    billingTaxOffice?: string;
    billingTaxNumber?: string;
    billingCity?: string;
    billingDistrict?: string;
    billingAddress?: string;
    billingZipCode?: string;
  };
}

export async function createOrder(params: CreateOrderParams) {
  const {
    userId, guestEmail, guestName, guestPhone,
    addressId, paymentMethod,
    cartItems, discountCode, customerNote,
    billingSameAddress, billingInfo,
  } = params;

  // Toplam metre hesapla
  const totalHeightCm = cartItems.reduce(
    (sum, item) => sum + item.layout.totalHeightCm, 0
  );

  // Fiyatlandırma verilerini al
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

  // İndirim kodu doğrulama
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

  // Kargo ayarlarını al
  let shippingConfig: ShippingConfigData | undefined;
  const sc = await db.shippingConfig.findFirst({ where: { id: "default" } });
  if (sc?.isActive) {
    shippingConfig = {
      shippingCost: Number(sc.shippingCost),
      freeShippingMin: Number(sc.freeShippingMin),
    };
  }

  // Server-side fiyat hesabı
  const priceBreakdown = calculatePrice(
    totalHeightCm, pricingTiers, customerPricing, discountPercent, discountAmount, shippingConfig
  );

  // Tüm items'i birleştir
  const allItems = cartItems.flatMap((ci) => ci.items);
  const gangSheetLayout: GangSheetLayout = {
    items: allItems,
    totalHeightCm,
    totalWidthCm: 57,
  };

  // Transaction içerisinde sipariş oluştur
  const order = await db.$transaction(async (tx) => {
    // İndirim kodu usedCount artır
    if (discountCodeId) {
      await tx.discountCode.update({
        where: { id: discountCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Sipariş oluştur
    const orderNumber = generateOrderNumber();
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        ...(addressId ? { address: { connect: { id: addressId } } } : {}),
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        totalMeters: priceBreakdown.totalMeters,
        pricePerMeter: priceBreakdown.pricePerMeter,
        subtotal: priceBreakdown.subtotal,
        discountAmount: priceBreakdown.discountAmount,
        taxAmount: priceBreakdown.taxAmount,
        totalAmount: priceBreakdown.totalAmount,
        shippingCost: priceBreakdown.shippingCost,
        ...(discountCodeId ? { discountCode: { connect: { id: discountCodeId } } } : {}),
        status: "PENDING_PAYMENT",
        paymentMethod,
        paymentStatus: "PENDING",
        gangSheetLayout: gangSheetLayout as unknown as Prisma.InputJsonValue,
        gangSheetWidth: 6732,
        gangSheetHeight: Math.round(totalHeightCm * 118.11),
        customerNote: customerNote || null,
        billingType: billingInfo?.billingType ?? "INDIVIDUAL",
        billingSameAddress: billingSameAddress ?? true,
        billingFullName: billingInfo?.billingFullName || null,
        billingCompanyName: billingInfo?.billingCompanyName || null,
        billingTaxOffice: billingInfo?.billingTaxOffice || null,
        billingTaxNumber: billingInfo?.billingTaxNumber || null,
        billingAddress: billingInfo?.billingAddress || null,
        billingCity: billingInfo?.billingCity || null,
        billingDistrict: billingInfo?.billingDistrict || null,
        billingZipCode: billingInfo?.billingZipCode || null,
      },
    });

    // OrderItem'lar oluştur
    for (const item of allItems) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          imageKey: item.imageKey,
          imageName: item.imageName,
          imageWidth: item.originalWidthPx,
          imageHeight: item.originalHeightPx,
          quantity: item.placements.length,
          placements: item.placements as unknown as Prisma.InputJsonValue,
        },
      });
    }

    // Durum geçmişi oluştur
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        toStatus: "PENDING_PAYMENT",
        note: "Sipariş oluşturuldu",
      },
    });

    return newOrder;
  });

  // Fire-and-forget order confirmation email
  try {
    let email: string | null = null;
    let customerName = "Müşterimiz";

    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      email = user?.email ?? null;
      if (user?.name) customerName = user.name;
    } else if (guestEmail) {
      email = guestEmail;
      if (guestName) customerName = guestName;
    }

    if (email) {
      sendOrderConfirmation(email, {
        orderNumber: order.orderNumber,
        customerName,
        totalMeters: Number(order.totalMeters),
        totalAmount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod,
        status: order.status,
        itemCount: allItems.length,
      }).catch((err) => console.error("[email] Order confirmation failed:", err));
    }
  } catch (err) {
    console.error("[email] Order confirmation setup failed:", err);
  }

  return { order, priceBreakdown };
}
