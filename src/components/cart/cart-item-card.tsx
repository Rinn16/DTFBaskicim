"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Image as ImageIcon, Ruler } from "lucide-react";
import type { CartItemData } from "@/stores/cart-store";

interface CartItemCardProps {
  item: CartItemData;
  onRemove: (id: string) => void;
  pricePerMeter?: number;
  isRemoving?: boolean;
}

export function CartItemCard({ item, onRemove, pricePerMeter, isRemoving }: CartItemCardProps) {
  const itemPrice = pricePerMeter ? item.totalMeters * pricePerMeter : null;
  const totalPlacements = item.items.reduce((sum, i) => sum + i.placements.length, 0);

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Gang sheet preview */}
        <div className="flex-shrink-0 w-20 h-24 bg-muted rounded-md flex items-center justify-center border border-dashed">
          <div className="text-center">
            <Ruler className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <span className="text-[10px] text-muted-foreground font-medium">
              57x{item.layout.totalHeightCm.toFixed(0)}cm
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-sm">
                Gang Sheet #{item.id.slice(-6).toUpperCase()}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.totalMeters.toFixed(2)} metre
              </p>
            </div>
            {itemPrice !== null && pricePerMeter && (
              <div className="text-right">
                <p className="font-semibold tabular-nums text-sm">
                  {itemPrice.toFixed(2)} TL
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {pricePerMeter.toFixed(2)} TL/m
                </p>
              </div>
            )}
          </div>

          {/* Items list */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.items.map((gi, idx) => (
              <Badge key={idx} variant="secondary" className="text-[11px] h-5 gap-1 font-normal">
                <ImageIcon className="h-3 w-3" />
                {gi.imageName.length > 16 ? gi.imageName.slice(0, 16) + "..." : gi.imageName}
                <span className="text-muted-foreground">x{gi.placements.length}</span>
              </Badge>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {item.items.length} gorsel, {totalPlacements} yerlesim
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(item.id)}
              disabled={isRemoving}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Kaldir
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
