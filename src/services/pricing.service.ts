import type { PricingTierData, PriceBreakdown, CustomerPricingData, ShippingConfigData } from "@/types/pricing";
import { PRICING } from "@/lib/constants";

export function calculatePrice(
  totalHeightCm: number,
  pricingTiers: PricingTierData[],
  customerPricing: CustomerPricingData | null,
  discountPercent: number = 0,
  discountAmount: number = 0,
  shippingConfig?: ShippingConfigData
): PriceBreakdown {
  const totalMeters = totalHeightCm / 100;

  // Special customer pricing overrides tiers
  if (customerPricing) {
    const pricePerMeter = customerPricing.pricePerMeter;
    const subtotal = totalMeters * pricePerMeter;
    const discount = discountAmount || subtotal * (discountPercent / 100);
    const afterDiscount = Math.max(0, subtotal - discount);
    const taxAmount = afterDiscount * PRICING.KDV_RATE;
    const productTotal = afterDiscount + taxAmount;
    const shipping = shippingConfig && productTotal < shippingConfig.freeShippingMin
      ? shippingConfig.shippingCost : 0;
    const totalAmount = productTotal + shipping;

    return {
      totalMeters: Math.round(totalMeters * 10000) / 10000,
      pricePerMeter,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      shippingCost: Math.round(shipping * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      tierName: "Özel Fiyat",
      isSpecialPricing: true,
    };
  }

  // Find matching tier
  const sortedTiers = [...pricingTiers]
    .filter((t) => t.pricePerMeter > 0)
    .sort((a, b) => b.minMeters - a.minMeters);

  const matchedTier = sortedTiers.find((t) => totalMeters >= t.minMeters);
  const pricePerMeter = matchedTier?.pricePerMeter || sortedTiers[sortedTiers.length - 1]?.pricePerMeter || 0;

  const subtotal = totalMeters * pricePerMeter;
  const discount = discountAmount || subtotal * (discountPercent / 100);
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = afterDiscount * PRICING.KDV_RATE;
  const productTotal = afterDiscount + taxAmount;
  const shipping = shippingConfig && productTotal < shippingConfig.freeShippingMin
    ? shippingConfig.shippingCost : 0;
  const totalAmount = productTotal + shipping;

  // Generate tier name
  let tierName = "";
  if (matchedTier) {
    tierName = matchedTier.maxMeters
      ? `${matchedTier.minMeters}-${matchedTier.maxMeters}m`
      : `${matchedTier.minMeters}m+`;
  }

  return {
    totalMeters: Math.round(totalMeters * 10000) / 10000,
    pricePerMeter,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingCost: Math.round(shipping * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    tierName,
    isSpecialPricing: false,
  };
}
