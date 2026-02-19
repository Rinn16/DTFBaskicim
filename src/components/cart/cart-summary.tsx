"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import { calculatePrice } from "@/services/pricing.service";
import type { CartItemData } from "@/stores/cart-store";
import type { PricingTierData, PriceBreakdown, CustomerPricingData } from "@/types/pricing";
import { DiscountInput } from "./discount-input";

interface CartSummaryProps {
  items: CartItemData[];
  onCheckout: () => void;
  isCheckingOut?: boolean;
}

export function CartSummary({ items, onCheckout, isCheckingOut }: CartSummaryProps) {
  const [pricingTiers, setPricingTiers] = useState<PricingTierData[]>([]);
  const [customerPricing, setCustomerPricing] = useState<CustomerPricingData | null>(null);
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
      totalHeightCm, pricingTiers, customerPricing, discountPercent, discountAmount
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
    <Card className="p-5">
      <h2 className="font-semibold text-base mb-4">Siparis Ozeti</h2>

      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Toplam Metre</span>
          <span className="font-medium tabular-nums">{totalMeters.toFixed(2)} m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Birim Fiyat</span>
          <span className="font-medium tabular-nums">
            {priceBreakdown ? `${priceBreakdown.pricePerMeter.toFixed(2)} TL/m` : "- TL/m"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ara Toplam</span>
          <span className="font-medium tabular-nums">
            {priceBreakdown ? `${priceBreakdown.subtotal.toFixed(2)} TL` : "0.00 TL"}
          </span>
        </div>
        {priceBreakdown && priceBreakdown.discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Indirim {discountCode && `(${discountCode})`}</span>
            <span className="font-medium tabular-nums">
              -{priceBreakdown.discountAmount.toFixed(2)} TL
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">KDV (%20)</span>
          <span className="font-medium tabular-nums">
            {priceBreakdown ? `${priceBreakdown.taxAmount.toFixed(2)} TL` : "0.00 TL"}
          </span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold">Toplam</span>
        <span className="text-xl font-bold tabular-nums">
          {priceBreakdown ? `${priceBreakdown.totalAmount.toFixed(2)} TL` : "0.00 TL"}
        </span>
      </div>

      {/* Discount input */}
      <div className="mb-4">
        <DiscountInput onApply={handleApplyDiscount} onClear={handleClearDiscount} />
      </div>

      <Button
        className="w-full h-11"
        size="lg"
        onClick={onCheckout}
        disabled={items.length === 0 || !priceBreakdown || isCheckingOut}
      >
        {isCheckingOut ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <ShoppingCart className="h-4 w-4 mr-2" />
        )}
        Odemeye Gec
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </Card>
  );
}
