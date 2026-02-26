import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/env";
import { calculatePrice } from "@/services/pricing.service";
import { sendOrderConfirmation } from "@/services/email.service";
import { ROLL_CONFIG } from "@/lib/constants";
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
  termsAcceptedAt: string;
  billingSameAddress?: boolean;
  billingInfo?: {
    billingType: BillingType;
    billingFirstName?: string;
    billingLastName?: string;
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
    termsAcceptedAt, billingSameAddress, billingInfo,
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

  // Tüm items'i birleştir (backward compat için Order.gangSheetLayout alanı)
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
        gangSheetWidth: ROLL_CONFIG.CANVAS_WIDTH_PX,
        gangSheetHeight: Math.round(totalHeightCm * ROLL_CONFIG.PX_PER_CM),
        customerNote: customerNote || null,
        termsAcceptedAt: new Date(termsAcceptedAt),
        billingType: billingInfo?.billingType ?? "INDIVIDUAL",
        billingSameAddress: billingSameAddress ?? true,
        billingFirstName: billingInfo?.billingFirstName || null,
        billingLastName: billingInfo?.billingLastName || null,
        billingFullName: billingInfo?.billingFirstName && billingInfo?.billingLastName
          ? `${billingInfo.billingFirstName} ${billingInfo.billingLastName}`
          : null,
        billingCompanyName: billingInfo?.billingCompanyName || null,
        billingTaxOffice: billingInfo?.billingTaxOffice || null,
        billingTaxNumber: billingInfo?.billingTaxNumber || null,
        billingAddress: billingInfo?.billingAddress || null,
        billingCity: billingInfo?.billingCity || null,
        billingDistrict: billingInfo?.billingDistrict || null,
        billingZipCode: billingInfo?.billingZipCode || null,
      },
    });

    // Her cart item için ayrı OrderGangSheet oluştur
    for (const cartItem of cartItems) {
      const itemLayout: GangSheetLayout = {
        items: cartItem.items,
        totalHeightCm: cartItem.layout.totalHeightCm,
        totalWidthCm: cartItem.layout.totalWidthCm ?? 57,
      };
      await tx.orderGangSheet.create({
        data: {
          orderId: newOrder.id,
          gangSheetLayout: itemLayout as unknown as Prisma.InputJsonValue,
          gangSheetWidth: ROLL_CONFIG.CANVAS_WIDTH_PX,
          gangSheetHeight: Math.round(cartItem.layout.totalHeightCm * ROLL_CONFIG.PX_PER_CM),
          totalMeters: cartItem.totalMeters,
        },
      });
    }

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
      // Fetch address for email
      let deliveryAddress = "";
      if (addressId) {
        const addr = await db.address.findUnique({ where: { id: addressId } });
        if (addr) {
          deliveryAddress = [addr.address, addr.district, addr.city, addr.zipCode].filter(Boolean).join(", ");
        }
      } else if (params.guestAddress) {
        const ga = params.guestAddress;
        deliveryAddress = [ga.address, ga.district, ga.city, ga.zipCode].filter(Boolean).join(", ");
      }

      const siteUrl = getBaseUrl();

      sendOrderConfirmation(email, {
        orderNumber: order.orderNumber,
        customerName,
        totalMeters: Number(order.totalMeters),
        totalAmount: Number(order.totalAmount),
        shippingCost: Number(order.shippingCost),
        paymentMethod: order.paymentMethod,
        status: order.status,
        itemCount: allItems.length,
        items: allItems.map((item) => ({
          imageName: item.imageName,
          quantity: item.placements.length,
        })),
        orderDate: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
        deliveryAddress,
        orderUrl: `${siteUrl}/hesabim/siparisler`,
      }).catch((err) => console.error("[email] Order confirmation failed:", err));
    }
  } catch (err) {
    console.error("[email] Order confirmation setup failed:", err);
  }

  return { order, priceBreakdown };
}
