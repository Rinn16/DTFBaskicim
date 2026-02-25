"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Image as ImageIcon, Ruler, Loader2 } from "lucide-react";
import type { CartItemData } from "@/stores/cart-store";

interface CartItemCardProps {
  item: CartItemData;
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void;
  pricePerMeter?: number;
  isRemoving?: boolean;
}

export function CartItemCard({ item, onRemove, onEdit, pricePerMeter, isRemoving }: CartItemCardProps) {
  const itemPrice = pricePerMeter ? item.totalMeters * pricePerMeter : null;
  const totalPlacements = item.items.reduce((sum, i) => sum + i.placements.length, 0);

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex gap-4">
        {/* Gang sheet preview */}
        <div className="flex-shrink-0 w-20 h-24 bg-muted rounded-lg flex items-center justify-center border border-dashed border-border">
          <div className="text-center">
            <Ruler className="h-5 w-5 mx-auto text-primary/50 mb-1" />
            <span className="text-[10px] text-muted-foreground font-medium">
              57x{item.layout.totalHeightCm.toFixed(0)}cm
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Gang Sheet #{item.id.slice(-6).toUpperCase()}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.totalMeters.toFixed(2)} metre
              </p>
            </div>
            {itemPrice !== null && pricePerMeter && (
              <div className="text-right">
                <p className="font-semibold tabular-nums text-sm text-foreground">
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
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] h-5 px-2 rounded bg-muted border border-border text-foreground/80"
              >
                <ImageIcon className="h-3 w-3 text-muted-foreground" />
                {gi.imageName.length > 16 ? gi.imageName.slice(0, 16) + "..." : gi.imageName}
                <span className="text-muted-foreground/70">x{gi.placements.length}</span>
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground/70">
              {item.items.length} görsel, {totalPlacements} yerleşim
            </span>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={() => onEdit(item.id)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Düzenle
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => onRemove(item.id)}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                )}
                Kaldır
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
