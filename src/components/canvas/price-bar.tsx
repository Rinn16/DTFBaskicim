"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ShoppingCart,
  Tag,
  ChevronUp,
  Trash2,
  XCircle,
  RotateCw,
  Ruler,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvasStore } from "@/stores/canvas-store";
import { useCartStore } from "@/stores/cart-store";
import { clearCanvasDesigns, displayPxToCm } from "./roll-canvas";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";
import { toast } from "sonner";

export function PriceBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addGuestItem, addMemberItem } = useCartStore();
  const {
    canvas,
    totalHeightCm,
    pricingTiers,
    setPricingTiers,
    setCustomerPricing,
    priceBreakdown,
    discountCode,
    setDiscountCode,
    setDiscountPercent,
    placements,
    clearPlacements,
    removePlacement,
    updatePlacement,
  } = useCanvasStore();

  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

  // Fetch pricing tiers on mount
  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch("/api/pricing/tiers");
        if (res.ok) {
          const data = await res.json();
          setPricingTiers(data.tiers);
          if (data.customerPricing) {
            setCustomerPricing(data.customerPricing);
          }
        }
      } catch {
        // Pricing will be fetched when available
      }
    }
    if (session?.user?.id) {
      fetchPricing();
    }
  }, [session?.user?.id, setPricingTiers, setCustomerPricing]);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setDiscountError("");

    try {
      const res = await fetch("/api/pricing/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountInput.trim().toUpperCase() }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiscountCode(discountInput.trim().toUpperCase());
        setDiscountPercent(data.discountPercent || 0);
        setDiscountApplied(true);
      } else {
        const data = await res.json();
        setDiscountError(data.error || "Gecersiz indirim kodu");
      }
    } catch {
      setDiscountError("Indirim kodu kontrol edilemedi");
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountPercent(0);
    setDiscountInput("");
    setDiscountApplied(false);
    setDiscountError("");
  };

  const handleDeleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      const placementId = (
        obj as FabricObject & { _placementId?: string }
      )._placementId;
      if (placementId) {
        removePlacement(placementId);
      }
      canvas.remove(obj);
    });
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handleClearAll = () => {
    if (!canvas) return;
    if (
      placements.length > 0 &&
      !confirm("Tum tasarimlari silmek istediginize emin misiniz?")
    ) {
      return;
    }
    clearCanvasDesigns(canvas);
    clearPlacements();
  };

  const handleRotateSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => {
      const placementId = (
        obj as FabricObject & { _placementId?: string }
      )._placementId;
      if (!placementId) return;

      const currentAngle = obj.angle ?? 0;
      const newAngle = (currentAngle + 90) % 360;
      obj.rotate(newAngle);
      obj.setCoords();

      const bound = obj.getBoundingRect();
      const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
      const height = (obj.height ?? 0) * (obj.scaleY ?? 1);

      updatePlacement(placementId, {
        x: displayPxToCm(bound.left),
        y: displayPxToCm(bound.top),
        widthCm: displayPxToCm(width),
        heightCm: displayPxToCm(height),
        rotation: newAngle,
      });
    });
    canvas.renderAll();
  };

  const handleAddToCart = async () => {
    const { uploadedImages, placements: allPlacements, totalHeightCm: height } = useCanvasStore.getState();

    if (allPlacements.length === 0) return;

    // GangSheetItem'lara donustur
    const imageMap = new Map(uploadedImages.map((img) => [img.id, img]));
    const itemsMap = new Map<string, GangSheetItem>();

    for (const p of allPlacements) {
      const img = imageMap.get(p.imageId);
      if (!img) continue;

      if (!itemsMap.has(img.imageKey)) {
        itemsMap.set(img.imageKey, {
          imageKey: img.imageKey,
          imageName: img.imageName,
          originalWidthPx: img.widthPx,
          originalHeightPx: img.heightPx,
          placements: [],
        });
      }
      itemsMap.get(img.imageKey)!.placements.push({
        x: p.x,
        y: p.y,
        widthCm: p.widthCm,
        heightCm: p.heightCm,
        rotation: p.rotation,
      });
    }

    const items = Array.from(itemsMap.values());
    const layout: GangSheetLayout = {
      items,
      totalHeightCm: height,
      totalWidthCm: 57,
    };
    const meters = height / 100;

    try {
      if (session?.user?.id) {
        await addMemberItem(layout, items, meters);
      } else {
        addGuestItem(layout, items, meters);
      }
      toast.success("Tasarim sepete eklendi!");
      router.push("/sepet");
    } catch {
      toast.error("Sepete eklerken hata olustu");
    }
  };

  const totalMeters = totalHeightCm / 100;

  // Find active tier
  const activeTier = pricingTiers.find(
    (t) =>
      totalMeters >= t.minMeters &&
      (t.maxMeters === null || totalMeters < t.maxMeters)
  );

  return (
    <div className="relative z-30 border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Canvas actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={handleRotateSelected}
                disabled={!canvas}
              >
                <RotateCw className="h-4 w-4" />
                <span className="text-xs">Dondur</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Secili tasarimi 90° dondur</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDeleteSelected}
                disabled={!canvas}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Secili tasarimlari sil</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={handleClearAll}
                disabled={placements.length === 0}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Tum tasarimlari temizle</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Tasarim:</span>
            <span className="font-semibold tabular-nums">
              {placements.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold tabular-nums">
              {totalHeightCm > 0
                ? `${totalMeters.toFixed(2)} m`
                : "0 m"}
            </span>
          </div>
          {activeTier && (
            <Badge variant="secondary" className="text-[11px] h-6">
              {activeTier.pricePerMeter} TL/m
            </Badge>
          )}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Price breakdown popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 text-sm hover:bg-muted/50 rounded-md px-2 py-1 transition-colors">
              <div className="text-left">
                <div className="text-[11px] text-muted-foreground leading-none mb-0.5">
                  Ara Toplam
                </div>
                <div className="font-semibold tabular-nums leading-none">
                  {priceBreakdown
                    ? `${priceBreakdown.subtotal.toFixed(2)} TL`
                    : "0.00 TL"}
                </div>
              </div>
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-72 p-3"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fiyat Detayi
              </p>

              {/* Tiers */}
              {pricingTiers.length > 0 && (
                <div className="space-y-0.5 mb-2">
                  {pricingTiers.map((tier) => {
                    const isActive =
                      totalMeters >= tier.minMeters &&
                      (tier.maxMeters === null ||
                        totalMeters < tier.maxMeters);
                    return (
                      <div
                        key={tier.id}
                        className={`flex justify-between text-xs px-2 py-1 rounded ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span>
                          {tier.maxMeters
                            ? `${tier.minMeters}-${tier.maxMeters}m`
                            : `${tier.minMeters}m+`}
                        </span>
                        <span>{tier.pricePerMeter} TL/m</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Metre Fiyati</span>
                  <span className="font-medium">
                    {priceBreakdown
                      ? `${priceBreakdown.pricePerMeter.toFixed(2)} TL`
                      : "- TL"}
                  </span>
                </div>
                {priceBreakdown?.isSpecialPricing && (
                  <Badge variant="secondary" className="text-[10px]">
                    Ozel Fiyat
                  </Badge>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span className="font-medium">
                    {priceBreakdown
                      ? `${priceBreakdown.subtotal.toFixed(2)} TL`
                      : "0.00 TL"}
                  </span>
                </div>
                {priceBreakdown && priceBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Indirim</span>
                    <span>
                      -{priceBreakdown.discountAmount.toFixed(2)} TL
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">KDV (%20)</span>
                  <span className="font-medium">
                    {priceBreakdown
                      ? `${priceBreakdown.taxAmount.toFixed(2)} TL`
                      : "0.00 TL"}
                  </span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Discount code */}
        <div className="flex items-center gap-2">
          {discountApplied ? (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs h-7"
              >
                <Tag className="h-3 w-3" />
                {discountCode}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive px-2"
                onClick={handleRemoveDiscount}
              >
                Kaldir
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Input
                placeholder="Indirim kodu"
                className="h-7 w-28 text-xs"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleApplyDiscount()
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleApplyDiscount}
              >
                Uygula
              </Button>
              {discountError && (
                <span className="text-[11px] text-destructive">
                  {discountError}
                </span>
              )}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Total + CTA */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground leading-none mb-0.5">
              Toplam (KDV dahil)
            </div>
            <div className="text-lg font-bold tabular-nums leading-none">
              {priceBreakdown
                ? `${priceBreakdown.totalAmount.toFixed(2)} TL`
                : "0.00 TL"}
            </div>
          </div>
          <Button
            size="lg"
            className="h-10 px-6"
            disabled={placements.length === 0}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sepete Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}
