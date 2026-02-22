"use client";

import { useState } from "react";
import type { FabricObject } from "fabric";
import {
  Trash2,
  RotateCcw,
  Grid3x3,
  Ruler,
  Magnet,
  Minus,
  Plus,
  Info,
  ChevronDown,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCanvasStore } from "@/stores/canvas-store";
import { clearCanvasDesigns } from "./roll-canvas";

const BG_COLORS = [
  { value: "#ffffff", label: "Beyaz" },
  { value: "#f3f4f6", label: "Açık Gri" },
  { value: "#6b7280", label: "Koyu Gri" },
  { value: "#1f2937", label: "Antrasit" },
  { value: "#000000", label: "Siyah" },
];

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

export function CanvasToolbar() {
  const [dpiOpen, setDpiOpen] = useState(true);

  const canvas = useCanvasStore((s) => s.canvas);
  const placements = useCanvasStore((s) => s.placements);
  const clearPlacements = useCanvasStore((s) => s.clearPlacements);
  const removePlacement = useCanvasStore((s) => s.removePlacement);
  const canvasBgColor = useCanvasStore((s) => s.canvasBgColor);
  const setCanvasBgColor = useCanvasStore((s) => s.setCanvasBgColor);
  const showGrid = useCanvasStore((s) => s.showGrid);
  const setShowGrid = useCanvasStore((s) => s.setShowGrid);
  const showRuler = useCanvasStore((s) => s.showRuler);
  const setShowRuler = useCanvasStore((s) => s.setShowRuler);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const setSnapToGrid = useCanvasStore((s) => s.setSnapToGrid);
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);

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

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + ZOOM_STEP, ZOOM_MAX));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - ZOOM_STEP, ZOOM_MIN));
  };

  return (
    <div className="flex flex-col">
      {/* Main toolbar */}
      <div className="flex items-center gap-1 bg-[#101620] border-b border-white/5 px-3 py-1.5 min-h-[40px]">
        {/* Left group — Canvas settings */}
        <div className="flex items-center gap-1">
          {/* Background color picker */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-slate-400"
                  >
                    <Palette className="h-3.5 w-3.5 text-white" />
                    Arkaplan
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Arkaplan Rengi</TooltipContent>
            </Tooltip>
            <PopoverContent
              className="w-auto p-2 bg-[#101620] border-white/10"
              align="start"
            >
              <p className="text-[11px] text-slate-400 mb-2 px-1">
                Arkaplan Rengi
              </p>
              <div className="flex gap-1.5">
                {BG_COLORS.map((c) => (
                  <Tooltip key={c.value}>
                    <TooltipTrigger asChild>
                      <button
                        className={`w-7 h-7 rounded-md border-2 transition-all ${
                          canvasBgColor === c.value
                            ? "border-blue-500 scale-110"
                            : "border-white/10 hover:border-white/30"
                        }`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setCanvasBgColor(c.value)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{c.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Grid toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 px-2 text-xs ${
                  showGrid
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-slate-400"
                }`}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                Izgara
              </Button>
            </TooltipTrigger>
            <TooltipContent>Izgarayı Göster/Gizle</TooltipContent>
          </Tooltip>

          {/* Ruler toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 px-2 text-xs ${
                  showRuler
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-slate-400"
                }`}
                onClick={() => setShowRuler(!showRuler)}
              >
                <Ruler className="h-3.5 w-3.5" />
                Cetvel
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cetveli Göster/Gizle</TooltipContent>
          </Tooltip>

          {/* Snap to grid toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 px-2 text-xs ${
                  snapToGrid
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-slate-400"
                }`}
                onClick={() => setSnapToGrid(!snapToGrid)}
              >
                <Magnet className="h-3.5 w-3.5" />
                Snap
              </Button>
            </TooltipTrigger>
            <TooltipContent>Izgaraya Yapıştır</TooltipContent>
          </Tooltip>
        </div>

        <Separator
          orientation="vertical"
          className="h-5 mx-1.5 bg-white/10"
        />

        {/* Center group — Zoom */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400"
                onClick={handleZoomOut}
                disabled={zoom <= ZOOM_MIN}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Uzaklaştır</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-xs text-slate-300 min-w-[42px] text-center hover:text-white transition-colors"
                onClick={() => setZoom(1)}
              >
                %{Math.round(zoom * 100)}
              </button>
            </TooltipTrigger>
            <TooltipContent>Sıfırla (%100)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400"
                onClick={handleZoomIn}
                disabled={zoom >= ZOOM_MAX}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Yakınlaştır</TooltipContent>
          </Tooltip>
        </div>

        <Separator
          orientation="vertical"
          className="h-5 mx-1.5 bg-white/10"
        />

        {/* Right-center group — DPI info */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 gap-1 px-2 text-xs ${
                dpiOpen
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-slate-400"
              }`}
              onClick={() => setDpiOpen(!dpiOpen)}
            >
              <Info className="h-3.5 w-3.5" />
              DPI
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  dpiOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>DPI Bilgi Paneli</TooltipContent>
        </Tooltip>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right group — Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400"
                onClick={handleDeleteSelected}
                disabled={!canvas}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Seçili Sil (Delete)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400 hover:text-red-300"
                onClick={handleClearAll}
                disabled={placements.length === 0}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tümü Temizle</TooltipContent>
          </Tooltip>

          {placements.length > 0 && (
            <span className="text-[11px] text-slate-500 pl-1">
              {placements.length} tasarım
            </span>
          )}
        </div>
      </div>

      {/* Collapsible DPI info panel */}
      {dpiOpen && (
        <div className="bg-[#101620] border-b border-white/5 px-4 py-2.5">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-white">
                Baskı Kalitesi (DPI)
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px]">
                  <span className="font-medium text-slate-200">300+</span>
                  <span className="text-slate-400"> — Mükemmel</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px]">
                  <span className="font-medium text-slate-200">200-299</span>
                  <span className="text-slate-400"> — İyi</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[11px]">
                  <span className="font-medium text-slate-200">150-199</span>
                  <span className="text-slate-400"> — Orta</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[11px]">
                  <span className="font-medium text-slate-200">&lt;150</span>
                  <span className="text-slate-400"> — Düşük</span>
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight ml-auto">
              DTF baskı için en az 300 DPI önerilir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
