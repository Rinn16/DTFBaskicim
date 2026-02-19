"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Ruler, Image as ImageIcon } from "lucide-react";
import type { CartItemData } from "@/stores/cart-store";
import type { PriceBreakdown } from "@/types/pricing";

interface OrderSummaryProps {
  items: CartItemData[];
  priceBreakdown: PriceBreakdown | null;
  discountCode?: string | null;
}

export function OrderSummary({ items, priceBreakdown, discountCode }: OrderSummaryProps) {
  const totalMeters = items.reduce((sum, item) => sum + item.totalMeters, 0);

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-base mb-4">Siparis Ozeti</h2>

      {/* Items */}
      <div className="space-y-3 mb-4">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="w-12 h-14 bg-muted rounded flex items-center justify-center flex-shrink-0">
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Gang Sheet #{idx + 1}</p>
              <p className="text-xs text-muted-foreground">
                {item.totalMeters.toFixed(2)}m - {item.items.length} gorsel
              </p>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Price breakdown */}
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

      <div className="flex justify-between items-center">
        <span className="font-semibold">Toplam</span>
        <span className="text-xl font-bold tabular-nums">
          {priceBreakdown ? `${priceBreakdown.totalAmount.toFixed(2)} TL` : "0.00 TL"}
        </span>
      </div>
    </Card>
  );
}
