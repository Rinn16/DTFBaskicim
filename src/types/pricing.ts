export interface PricingTierData {
  id: string;
  minMeters: number;
  maxMeters: number | null;
  pricePerMeter: number;
}

export interface PriceBreakdown {
  totalMeters: number;
  pricePerMeter: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  tierName?: string;
  isSpecialPricing: boolean;
}

export interface ShippingConfigData {
  shippingCost: number;
  freeShippingMin: number;
}

export interface CustomerPricingData {
  pricePerMeter: number;
}
