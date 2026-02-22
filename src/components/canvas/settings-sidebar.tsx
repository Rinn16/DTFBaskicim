"use client";

import { useRef } from "react";
import type { FabricObject } from "fabric";
import { Settings2, Ruler, Info, RefreshCw, TriangleAlert, RotateCw, Trash2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvasStore } from "@/stores/canvas-store";
import { autoPack } from "@/services/packing.service";
import { addImageToCanvas, clearCanvasDesigns, displayPxToCm } from "./roll-canvas";
import type { DesignInput } from "@/types/canvas";

export function SettingsSidebar() {
  const {
    canvas,
    gapCm,
    setGapCm,
    placements,
    uploadedImages,
    setPlacements,
    clearPlacements,
    removePlacement,
    updatePlacement,
  } = useCanvasStore();

  // Track the gap that was last used for placement
  const lastAppliedGapRef = useRef(gapCm);
  const hasDesigns = placements.length > 0;
  const gapChanged = hasDesigns && gapCm !== lastAppliedGapRef.current;

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
      !confirm("Tüm tasarımları silmek istediğinize emin misiniz?")
    ) {
      return;
    }
    clearCanvasDesigns(canvas);
    clearPlacements();
  };

  const handleReplace = () => {
    if (!canvas || placements.length === 0) return;

    // Group current placements by imageId and count them
    const counts: Record<string, number> = {};
    for (const p of placements) {
      counts[p.imageId] = (counts[p.imageId] || 0) + 1;
    }

    // Build design inputs from current placements
    const designs: DesignInput[] = Object.entries(counts)
      .map(([imageId, quantity]) => {
        const img = uploadedImages.find((i) => i.id === imageId);
        if (!img) return null;
        // Use the placement dimensions (already clamped)
        const existing = placements.find((p) => p.imageId === imageId);
        return {
          id: imageId,
          widthCm: existing?.widthCm ?? img.widthCm,
          heightCm: existing?.heightCm ?? img.heightCm,
          quantity,
        };
      })
      .filter((d): d is DesignInput => d !== null);

    if (designs.length === 0) return;

    const result = autoPack(designs, undefined, gapCm);

    // Clear and re-place
    clearCanvasDesigns(canvas);
    clearPlacements();

    const newPlacements = result.placements.map((p) => ({
      id: p.id,
      imageId: p.imageId,
      x: p.x,
      y: p.y,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      rotation: p.rotation,
    }));

    setPlacements(newPlacements);

    newPlacements.forEach((placement) => {
      const image = uploadedImages.find((i) => i.id === placement.imageId);
      if (!image) return;
      addImageToCanvas(
        canvas,
        image.thumbnailUrl,
        placement.id,
        placement.x,
        placement.y,
        placement.widthCm,
        placement.heightCm,
        placement.rotation
      );
    });

    lastAppliedGapRef.current = gapCm;
  };

  return (
    <aside className="w-72 border-l border-white/5 bg-[#101620] flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Settings2 className="h-5 w-5" />
          Ayarlar
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={["layout", "actions"]} className="px-4">
          <AccordionItem value="layout">
            <AccordionTrigger className="text-sm text-slate-100">
              <span className="flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                Yerleşim
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-5">
              {/* Gap setting */}
              <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium text-slate-100">
                  Tasarımlar Arası Boşluk
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-52">
                    <p className="text-xs">
                      Otomatik yerleştirmede ve manuel eklemede tasarımlar
                      arasında bırakılacak boşluk. Kesim toleransı için en az
                      0.2 cm önerilir.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <Slider
                  value={[gapCm]}
                  onValueChange={([v]) => setGapCm(v)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={gapCm}
                    onChange={(e) =>
                      setGapCm(parseFloat(e.target.value) || 0)
                    }
                    className="h-8 w-20 text-sm text-white"
                  />
                  <span className="text-sm text-slate-400">cm</span>
                </div>
              </div>

              {/* Visual preview */}
              <div className="rounded-md border border-white/5 bg-black/30 p-3">
                <p className="text-[11px] text-slate-400 mb-2">
                  Önizleme
                </p>
                <div className="flex items-end gap-0 justify-center">
                  <div className="w-10 h-14 bg-primary/20 border border-primary/40 rounded-sm" />
                  <div
                    className="border-t border-dashed border-primary/60 self-stretch flex items-center"
                    style={{
                      width: `${Math.max(gapCm * 20, 2)}px`,
                    }}
                  >
                    {gapCm > 0 && (
                      <span className="text-[8px] text-primary/70 whitespace-nowrap -mt-3 block text-center w-full">
                        {gapCm} cm
                      </span>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded-sm" />
                </div>
              </div>

              {/* Quick presets */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">
                  Hazır Ayarlar
                </Label>
                <div className="flex gap-1.5">
                  {[
                    { label: "Yok", value: 0 },
                    { label: "0.2 cm", value: 0.2 },
                    { label: "0.3 cm", value: 0.3 },
                    { label: "0.5 cm", value: 0.5 },
                    { label: "1 cm", value: 1 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setGapCm(preset.value)}
                      className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                        gapCm === preset.value
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zero gap warning */}
              {gapCm === 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30 p-2.5 flex gap-2">
                  <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    Tasarımlar arasında boşluk bırakmamak, kesim sırasında
                    hatalara yol açabilir. Düzgün bir kesim için en az{" "}
                    <button
                      className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
                      onClick={() => setGapCm(0.2)}
                    >
                      0.2 cm
                    </button>{" "}
                    boşluk bırakılması önerilir.
                  </p>
                </div>
              )}

              {/* Re-place button — visible when gap changed */}
              {gapChanged && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-slate-200"
                  onClick={handleReplace}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Yeniden Yerleştir
                </Button>
              )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="actions">
            <AccordionTrigger className="text-sm text-slate-100">
              <span className="flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" />
                Aksiyonlar
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-slate-200"
                onClick={handleRotateSelected}
                disabled={!canvas}
              >
                <RotateCw className="h-3.5 w-3.5 mr-2" />
                Seçili Tasarımı Döndür
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-slate-200"
                onClick={handleDeleteSelected}
                disabled={!canvas}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Seçili Tasarımları Sil
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
                onClick={handleClearAll}
                disabled={placements.length === 0}
              >
                <XCircle className="h-3.5 w-3.5 mr-2" />
                Tümünü Temizle
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </aside>
  );
}
