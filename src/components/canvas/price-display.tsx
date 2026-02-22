"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Tag } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useCartStore } from "@/stores/cart-store";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";
import { toast } from "sonner";

export function PriceDisplay() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addGuestItem, addMemberItem } = useCartStore();
  const {
    uploadedImages,
    totalHeightCm,
    pricingTiers,
    setPricingTiers,
    setCustomerPricing,
    priceBreakdown,
    discountCode,
    setDiscountCode,
    setDiscountPercent,
    placements,
  } = useCanvasStore();

  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

  // Fetch pricing tiers on mount (public endpoint — works for guests too)
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
    fetchPricing();
  }, [setPricingTiers, setCustomerPricing]);

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
        setDiscountError(data.error || "Geçersiz indirim kodu");
      }
    } catch {
      setDiscountError("İndirim kodu kontrol edilemedi");
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountPercent(0);
    setDiscountInput("");
    setDiscountApplied(false);
    setDiscountError("");
  };

  const handleAddToCart = async () => {
    if (placements.length === 0) return;

    const imageMap = new Map(uploadedImages.map((img) => [img.id, img]));
    const itemsMap = new Map<string, GangSheetItem>();

    for (const p of placements) {
      const img = imageMap.get(p.imageId);
      if (!img || !img.imageKey) continue;
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
        x: p.x, y: p.y,
        widthCm: p.widthCm, heightCm: p.heightCm,
        rotation: p.rotation,
      });
    }

    const items = Array.from(itemsMap.values());
    if (items.length === 0) {
      toast.error("Tasarım verileri oluşturulamadı.");
      return;
    }

    const layout: GangSheetLayout = { items, totalHeightCm, totalWidthCm: 57 };
    const totalM = totalHeightCm / 100;

    try {
      if (session?.user?.id) {
        await addMemberItem(layout, items, totalM);
      } else {
        addGuestItem(layout, items, totalM);
      }
      toast.success("Tasarım sepete eklendi!");
      router.push("/sepet");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sepete eklerken hata oluştu");
    }
  };

  const totalMeters = totalHeightCm / 100;

  return (
    <aside className="w-72 border-l bg-muted/20 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Fiyat Hesabı</h2>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Roll info */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tasarım Sayısı</span>
            <span className="font-medium">{placements.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Toplam Uzunluk</span>
            <span className="font-medium">
              {totalHeightCm > 0
                ? `${totalHeightCm.toFixed(1)} cm (${totalMeters.toFixed(2)} m)`
                : "0 cm"}
            </span>
          </div>
        </div>

        <Separator />

        {/* Pricing tiers indicator */}
        {pricingTiers.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Fiyat Kademeleri
            </Label>
            <div className="space-y-1">
              {pricingTiers.map((tier) => {
                const isActive =
                  totalMeters >= tier.minMeters &&
                  (tier.maxMeters === null || totalMeters < tier.maxMeters);
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
          </div>
        )}

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Metre Fiyatı</span>
            <span className="font-medium">
              {priceBreakdown
                ? `${priceBreakdown.pricePerMeter.toFixed(2)} TL`
                : "- TL"}
            </span>
          </div>
          {priceBreakdown?.isSpecialPricing && (
            <Badge variant="secondary" className="text-xs">
              Özel Fiyat
            </Badge>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ara Toplam</span>
            <span className="font-medium">
              {priceBreakdown
                ? `${priceBreakdown.subtotal.toFixed(2)} TL`
                : "0.00 TL"}
            </span>
          </div>
          {priceBreakdown && priceBreakdown.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>İndirim</span>
              <span>-{priceBreakdown.discountAmount.toFixed(2)} TL</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">KDV (%20)</span>
            <span className="font-medium">
              {priceBreakdown
                ? `${priceBreakdown.taxAmount.toFixed(2)} TL`
                : "0.00 TL"}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Toplam</span>
            <span>
              {priceBreakdown
                ? `${priceBreakdown.totalAmount.toFixed(2)} TL`
                : "0.00 TL"}
            </span>
          </div>
        </div>

        <Separator />

        {/* Discount code */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">İndirim Kodu</Label>
          {discountApplied ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {discountCode}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-destructive"
                onClick={handleRemoveDiscount}
              >
                Kaldır
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Kod girin"
                className="h-8 text-xs"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleApplyDiscount}
              >
                Uygula
              </Button>
            </div>
          )}
          {discountError && (
            <p className="text-xs text-destructive">{discountError}</p>
          )}
        </div>
      </div>

      {/* Add to cart button */}
      <div className="p-4 border-t">
        <Button
          className="w-full"
          size="lg"
          disabled={placements.length === 0}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Sepete Ekle
        </Button>
      </div>
    </aside>
  );
}
