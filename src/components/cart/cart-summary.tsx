"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import { calculatePrice } from "@/services/pricing.service";
import type { CartItemData } from "@/stores/cart-store";
import type { PricingTierData, PriceBreakdown, CustomerPricingData, ShippingConfigData } from "@/types/pricing";
import { DiscountInput } from "./discount-input";

interface CartSummaryProps {
  items: CartItemData[];
  onCheckout: () => void;
  isCheckingOut?: boolean;
}

export function CartSummary({ items, onCheckout, isCheckingOut }: CartSummaryProps) {
  const [pricingTiers, setPricingTiers] = useState<PricingTierData[]>([]);
  const [customerPricing, setCustomerPricing] = useState<CustomerPricingData | null>(null);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfigData | undefined>();
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch("/api/pricing/tiers");
        if (res.ok) {
          const data = await res.json();
          setPricingTiers(data.tiers);
          if (data.customerPricing) setCustomerPricing(data.customerPricing);
          if (data.shippingConfig) setShippingConfig(data.shippingConfig);
        }
      } catch {
        // will retry on next render
      }
    }
    fetchPricing();
  }, []);

  const totalHeightCm = items.reduce((sum, item) => sum + item.layout.totalHeightCm, 0);
  const totalMeters = totalHeightCm / 100;

  let priceBreakdown: PriceBreakdown | null = null;
  if (pricingTiers.length > 0 && totalHeightCm > 0) {
    priceBreakdown = calculatePrice(
      totalHeightCm, pricingTiers, customerPricing, discountPercent, discountAmount, shippingConfig
    );
  }

  const handleApplyDiscount = (code: string, percent: number, amount: number) => {
    setDiscountCode(code);
    setDiscountPercent(percent);
    setDiscountAmount(amount);
  };

  const handleClearDiscount = () => {
    setDiscountCode(null);
    setDiscountPercent(0);
    setDiscountAmount(0);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h2 className="font-semibold text-base text-foreground mb-4">Sipariş Özeti</h2>

      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Toplam Metre</span>
          <span className="font-medium tabular-nums text-foreground">{totalMeters.toFixed(2)} m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Birim Fiyat</span>
          <span className="font-medium tabular-nums text-foreground">
            {priceBreakdown ? `${priceBreakdown.pricePerMeter.toFixed(2)} TL/m` : "- TL/m"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ara Toplam</span>
          <span className="font-medium tabular-nums text-foreground">
            {priceBreakdown ? `${priceBreakdown.subtotal.toFixed(2)} TL` : "0.00 TL"}
          </span>
        </div>
        {priceBreakdown && priceBreakdown.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>İndirim {discountCode && `(${discountCode})`}</span>
            <span className="font-medium tabular-nums">
              -{priceBreakdown.discountAmount.toFixed(2)} TL
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">KDV (%20)</span>
          <span className="font-medium tabular-nums text-foreground">
            {priceBreakdown ? `${priceBreakdown.taxAmount.toFixed(2)} TL` : "0.00 TL"}
          </span>
        </div>
        {priceBreakdown && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kargo</span>
            <span className={`font-medium tabular-nums ${priceBreakdown.shippingCost === 0 ? "text-emerald-400" : "text-foreground"}`}>
              {priceBreakdown.shippingCost === 0 ? "Ücretsiz" : `${priceBreakdown.shippingCost.toFixed(2)} TL`}
            </span>
          </div>
        )}
        {priceBreakdown && shippingConfig && priceBreakdown.shippingCost > 0 && (() => {
          const productTotal = priceBreakdown.totalAmount - priceBreakdown.shippingCost;
          const remaining = shippingConfig.freeShippingMin - productTotal;
          return remaining > 0 && remaining < 200 ? (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {remaining.toFixed(2)} TL daha harcayın, ücretsiz kargo!
            </p>
          ) : null;
        })()}
      </div>

      <div className="border-t border-dashed border-border my-4" />

      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold text-foreground">Toplam</span>
        <span className="text-xl font-bold tabular-nums text-foreground">
          {priceBreakdown ? `${priceBreakdown.totalAmount.toFixed(2)} TL` : "0.00 TL"}
        </span>
      </div>

      {/* Discount input */}
      <div className="mb-4">
        <DiscountInput onApply={handleApplyDiscount} onClear={handleClearDiscount} />
      </div>

      <button
        className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-primary/20 dark:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onCheckout}
        disabled={items.length === 0 || !priceBreakdown || isCheckingOut}
      >
        {isCheckingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        Ödemeye Geç
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
