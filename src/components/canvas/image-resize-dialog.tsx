"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvasStore } from "@/stores/canvas-store";
import type { UploadedImage } from "@/types/canvas";

function calculateDpi(widthPx: number, widthCm: number): number {
  if (widthCm <= 0) return 0;
  return Math.round(widthPx / (widthCm / 2.54));
}

function getDpiColor(dpi: number): string {
  if (dpi >= 300) return "text-emerald-400";
  if (dpi >= 200) return "text-blue-400";
  if (dpi >= 150) return "text-amber-400";
  return "text-red-400";
}

interface ImageResizeDialogProps {
  image: UploadedImage;
}

export function ImageResizeDialog({ image }: ImageResizeDialogProps) {
  const { updateUploadedImage, addUploadedImage } = useCanvasStore();
  const [open, setOpen] = useState(false);
  const [widthCm, setWidthCm] = useState(image.widthCm);
  const [heightCm, setHeightCm] = useState(image.heightCm);
  const [lockAspect, setLockAspect] = useState(true);

  const aspectRatio = image.widthCm / image.heightCm;

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setWidthCm(image.widthCm);
      setHeightCm(image.heightCm);
      setLockAspect(true);
    }
  }, [open, image.widthCm, image.heightCm]);

  const handleWidthChange = (newWidth: number) => {
    const clamped = Math.max(0.5, Math.min(57, newWidth));
    setWidthCm(clamped);
    if (lockAspect) {
      setHeightCm(Math.round((clamped / aspectRatio) * 10) / 10);
    }
  };

  const handleHeightChange = (newHeight: number) => {
    const clamped = Math.max(0.5, Math.min(200, newHeight));
    setHeightCm(clamped);
    if (lockAspect) {
      setWidthCm(Math.round(clamped * aspectRatio * 10) / 10);
    }
  };

  const newDpi = calculateDpi(image.widthPx, widthCm);
  const dpiColor = getDpiColor(newDpi);

  const handleResize = () => {
    updateUploadedImage(image.id, {
      widthCm: Math.round(widthCm * 10) / 10,
      heightCm: Math.round(heightCm * 10) / 10,
    });
    setOpen(false);
  };

  const handleCreateCopy = () => {
    const newW = Math.round(widthCm * 10) / 10;
    const newH = Math.round(heightCm * 10) / 10;
    const newId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const sizeSuffix = `(${newW}cm)`;
    const baseName = image.imageName.replace(/\s*\(\d+(\.\d+)?cm\)\s*$/, "");

    addUploadedImage({
      ...image,
      id: newId,
      imageName: `${baseName} ${sizeSuffix}`,
      widthCm: newW,
      heightCm: newH,
      sourceImageId: image.sourceImageId ?? image.id,
    });
    setOpen(false);
  };

  const isChanged =
    Math.round(widthCm * 10) !== Math.round(image.widthCm * 10) ||
    Math.round(heightCm * 10) !== Math.round(image.heightCm * 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 text-slate-200"
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Boyut
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Görseli yeniden boyutlandır veya farklı boyutta kopya oluştur</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md bg-[#101620] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Görsel Boyutlandırma</DialogTitle>
          <DialogDescription className="text-slate-400">
            Görselin baskı boyutunu değiştirin veya farklı boyutta bir kopya oluşturun.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current size info */}
          <div className="text-sm text-slate-400">
            Mevcut boyut:{" "}
            <span className="font-medium text-slate-100">
              {image.widthCm} x {image.heightCm} cm
            </span>
            <span className="mx-1.5">·</span>
            {image.widthPx}x{image.heightPx}px
          </div>

          {/* Width/Height inputs */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-300">Genişlik (cm)</Label>
              <Input
                type="number"
                min={0.5}
                max={57}
                step={0.1}
                value={widthCm}
                onChange={(e) =>
                  handleWidthChange(parseFloat(e.target.value) || 0.5)
                }
                className="h-9 bg-white/5 border-white/10 text-white"
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0 text-slate-300 hover:text-white hover:bg-white/10"
                  onClick={() => setLockAspect(!lockAspect)}
                >
                  {lockAspect ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {lockAspect ? "En-boy oranını serbest bırak" : "En-boy oranını kilitle"}
                </p>
              </TooltipContent>
            </Tooltip>

            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-300">Yükseklik (cm)</Label>
              <Input
                type="number"
                min={0.5}
                max={200}
                step={0.1}
                value={heightCm}
                onChange={(e) =>
                  handleHeightChange(parseFloat(e.target.value) || 0.5)
                }
                className="h-9 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* DPI Preview */}
          <div className="rounded-md border border-white/5 bg-black/30 p-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Yeni boyuttaki DPI:
            </span>
            <span className={`text-sm font-semibold ${dpiColor}`}>
              {newDpi} DPI
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-slate-200 border-white/10 hover:bg-white/10"
                onClick={handleResize}
                disabled={!isChanged}
              >
                Boyutlandır
              </Button>
              <Button
                className="flex-1 editor-glow-btn"
                onClick={handleCreateCopy}
                disabled={!isChanged}
              >
                Kopya Oluştur
              </Button>
            </div>
            <div className="flex gap-2 text-[10px] text-slate-500">
              <p className="flex-1 text-center">
                Mevcut görselin boyutunu değiştirir
              </p>
              <p className="flex-1 text-center">
                Yeni boyutta ayrı bir görsel ekler
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
