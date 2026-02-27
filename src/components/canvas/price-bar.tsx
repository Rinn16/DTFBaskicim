"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  Ruler,
  Save,
  AlertTriangle,
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useCartStore } from "@/stores/cart-store";
import { useDraftStore } from "@/stores/draft-store";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function buildDesignData() {
  const { uploadedImages, placements, totalHeightCm } = useCanvasStore.getState();
  if (placements.length === 0) return null;

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
        originalUrl: img.originalUrl,
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
  if (items.length === 0) return null;

  const layout: GangSheetLayout = {
    items,
    totalHeightCm,
    totalWidthCm: 57,
  };

  return { layout, items, totalMeters: totalHeightCm / 100 };
}

export function PriceBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addGuestItem, addMemberItem, updateGuestItem, updateMemberItem } = useCartStore();
  const totalHeightCm = useCanvasStore((s) => s.totalHeightCm);
  const pricingTiers = useCanvasStore((s) => s.pricingTiers);
  const setPricingTiers = useCanvasStore((s) => s.setPricingTiers);
  const setCustomerPricing = useCanvasStore((s) => s.setCustomerPricing);
  const priceBreakdown = useCanvasStore((s) => s.priceBreakdown);
  const discountCode = useCanvasStore((s) => s.discountCode);
  const setDiscountCode = useCanvasStore((s) => s.setDiscountCode);
  const setDiscountPercent = useCanvasStore((s) => s.setDiscountPercent);
  const placementCount = useCanvasStore((s) => s.placements.length);
  const editingCartItemId = useCanvasStore((s) => s.editingCartItemId);
  const setEditingCartItemId = useCanvasStore((s) => s.setEditingCartItemId);
  const activeDraftId = useCanvasStore((s) => s.activeDraftId);
  const activeDraftName = useCanvasStore((s) => s.activeDraftName);
  const setActiveDraftId = useCanvasStore((s) => s.setActiveDraftId);
  const snapshotCurrentState = useCanvasStore((s) => s.snapshotCurrentState);
  const resetCanvas = useCanvasStore((s) => s.resetCanvas);
  const overlappingIds = useCanvasStore((s) => s.overlappingIds);

  const {
    saveGuestDraft,
    updateGuestDraft,
    saveMemberDraft,
    updateMemberDraft: updateMemberDraftStore,
  } = useDraftStore();

  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const hasOverlap = overlappingIds.size > 0;
  const belowMinimum = totalHeightCm > 0 && totalHeightCm < 100;

  const handleAddToCart = async () => {
    // Collect validation errors and show dialog if any
    const errors: string[] = [];
    if (hasOverlap) {
      errors.push("Üst üste binen tasarımlar var. Lütfen çakışan görselleri düzeltin.");
    }
    if (belowMinimum) {
      errors.push("Minimum sipariş uzunluğu 1 metredir. Lütfen daha fazla tasarım ekleyin.");
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const data = buildDesignData();
    if (!data) {
      toast.error("Tasarım verileri oluşturulamadı. Lütfen görselleri tekrar yükleyin.");
      return;
    }

    const isAuthenticated = !!session?.user?.id;

    try {
      if (editingCartItemId) {
        // Update existing cart item — don't save as draft
        if (isAuthenticated) {
          await updateMemberItem(editingCartItemId, data.layout, data.items, data.totalMeters);
        } else {
          updateGuestItem(editingCartItemId, data.layout, data.items, data.totalMeters);
        }
        setEditingCartItemId(null);
        toast.success("Tasarım güncellendi!");
      } else {
        // Add new cart item
        if (isAuthenticated) {
          await addMemberItem(data.layout, data.items, data.totalMeters);
        } else {
          addGuestItem(data.layout, data.items, data.totalMeters);
        }

        // Save current canvas state as draft before resetting
        // Wrapped in its own try-catch so draft failures don't block the cart flow
        try {
          const snapshot = snapshotCurrentState();
          if (snapshot) {
            const name = activeDraftName || "Adsız Tasarım";
            if (isAuthenticated) {
              if (activeDraftId) {
                await updateMemberDraftStore(activeDraftId, name, snapshot);
              } else {
                await saveMemberDraft(name, snapshot);
              }
            } else {
              if (activeDraftId) {
                updateGuestDraft(activeDraftId, { name, data: snapshot });
              } else {
                const newId = crypto.randomUUID();
                const now = new Date().toISOString();
                saveGuestDraft({ id: newId, name, data: snapshot, createdAt: now, updatedAt: now });
              }
            }
          }
        } catch (draftError) {
          console.warn("[cart] Draft save failed:", draftError);
        }

        toast.success("Tasarım sepete eklendi!");
      }

      resetCanvas();
      router.push("/sepet");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sepete eklerken hata oluştu");
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
    <div className="relative z-30 border-t border-white/5 bg-[#101620]">
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs">Tasarım:</span>
            <span className="font-semibold tabular-nums text-white">
              {placementCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold tabular-nums text-white">
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
            <button className="flex items-center gap-2 text-sm hover:bg-white/5 rounded-md px-2 py-1 transition-colors">
              <div className="text-left">
                <div className="text-[11px] text-slate-400 leading-none mb-0.5">
                  Ara Toplam
                </div>
                <div className="font-semibold tabular-nums leading-none text-white">
                  {priceBreakdown
                    ? `${priceBreakdown.subtotal.toFixed(2)} TL`
                    : "0.00 TL"}
                </div>
              </div>
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-72 p-3 bg-[#101620] border-white/10"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Fiyat Detayı
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
                            ? "bg-cyan-500/10 text-cyan-300 font-medium"
                            : "text-slate-400"
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
                  <span className="text-slate-400">Metre Fiyatı</span>
                  <span className="font-medium text-slate-100">
                    {priceBreakdown
                      ? `${priceBreakdown.pricePerMeter.toFixed(2)} TL`
                      : "- TL"}
                  </span>
                </div>
                {priceBreakdown?.isSpecialPricing && (
                  <Badge variant="secondary" className="text-[10px]">
                    Özel Fiyat
                  </Badge>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Ara Toplam</span>
                  <span className="font-medium text-slate-100">
                    {priceBreakdown
                      ? `${priceBreakdown.subtotal.toFixed(2)} TL`
                      : "0.00 TL"}
                  </span>
                </div>
                {priceBreakdown && priceBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>İndirim</span>
                    <span>
                      -{priceBreakdown.discountAmount.toFixed(2)} TL
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">KDV (%20)</span>
                  <span className="font-medium text-slate-100">
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
                Kaldır
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Input
                placeholder="İndirim kodu"
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
                className="h-7 text-xs px-2 text-slate-200"
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
            <div className="text-[11px] text-slate-400 leading-none mb-0.5">
              Toplam (KDV dahil)
            </div>
            <div className="text-lg font-bold tabular-nums leading-none text-white">
              {priceBreakdown
                ? `${priceBreakdown.totalAmount.toFixed(2)} TL`
                : "0.00 TL"}
            </div>
          </div>
          {hasOverlap && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Çakışma var</span>
            </div>
          )}
          {belowMinimum && (
            <div className="flex items-center gap-1 text-amber-400">
              <Ruler className="h-4 w-4" />
              <span className="text-xs font-medium">Min. 1 metre</span>
            </div>
          )}
          <Button
            size="lg"
            className="h-10 px-6 editor-glow-btn"
            disabled={placementCount === 0}
            onClick={handleAddToCart}
          >
            {editingCartItemId ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Güncelle
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Sepete Ekle
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation error dialog */}
      <AlertDialog open={validationErrors.length > 0} onOpenChange={() => setValidationErrors([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Sepete eklenemiyor
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setValidationErrors([])}>
              Tamam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
