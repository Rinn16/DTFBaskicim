"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { FabricObject } from "fabric";
import { Trash2, Plus, Wand2, FilePlus, FolderOpen, Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "./image-upload";
import { DpiBadge } from "./dpi-badge";
import { ImageResizeDialog } from "./image-resize-dialog";
import { DraftListSheet } from "./draft-list-sheet";
import { useCanvasStore } from "@/stores/canvas-store";
import { useUploadStore } from "@/stores/upload-store";
import { useDraftStore } from "@/stores/draft-store";
import { addImageToCanvas, addImagesToCanvas, clearCanvasDesigns } from "./roll-canvas";
import { autoPackAsync } from "@/services/packing.service";
import { getEffectiveDimensions } from "@/lib/placement-utils";
import type { DesignInput } from "@/types/canvas";
import { toast } from "sonner";

export function DesignSidebar() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user?.id;

  const {
    canvas,
    uploadedImages,
    removeUploadedImage,
    autoPlaceQuantities,
    setAutoPlaceQuantity,
    addPlacement,
    removePlacement,
    setPlacements,
    clearPlacements,
    gapCm,
    activeDraftId,
    activeDraftName,
    setActiveDraftId,
    setActiveDraftName,
    snapshotCurrentState,
    resetCanvas,
  } = useCanvasStore();

  const {
    saveGuestDraft,
    updateGuestDraft,
    saveMemberDraft,
    updateMemberDraft,
  } = useDraftStore();

  const uploadingFiles = useUploadStore((s) => s.files);

  const [autoPlaceOpen, setAutoPlaceOpen] = useState(false);
  const [autoPlaceProgress, setAutoPlaceProgress] = useState<number | null>(null);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Save current canvas as draft (auto-save)
  const saveCurrentDraft = useCallback(async () => {
    const snapshot = snapshotCurrentState();
    if (!snapshot) return; // nothing to save

    const name = activeDraftName || "Adsız Tasarım";

    if (isAuthenticated) {
      if (activeDraftId) {
        await updateMemberDraft(activeDraftId, name, snapshot);
      } else {
        const newId = await saveMemberDraft(name, snapshot);
        setActiveDraftId(newId);
      }
    } else {
      if (activeDraftId) {
        updateGuestDraft(activeDraftId, { name, data: snapshot });
      } else {
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        saveGuestDraft({ id: newId, name, data: snapshot, createdAt: now, updatedAt: now });
        setActiveDraftId(newId);
      }
    }
  }, [
    snapshotCurrentState, activeDraftId, activeDraftName, isAuthenticated,
    updateMemberDraft, saveMemberDraft, updateGuestDraft, saveGuestDraft, setActiveDraftId,
  ]);

  const handleNewDesign = async () => {
    // Auto-save if there's content
    const snapshot = snapshotCurrentState();
    if (snapshot) {
      await saveCurrentDraft();
      toast.success("Mevcut taslak kaydedildi");
    }
    // Clear canvas (resetCanvas also clears fabric objects)
    resetCanvas();
    toast.success("Yeni tasarım oluşturuldu");
  };

  const handleStartRename = () => {
    setRenameValue(activeDraftName);
    setIsRenaming(true);
  };

  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      setActiveDraftName(trimmed);
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
  };

  // Add a single image to canvas at default position
  const handleAddToCanvas = (imageId: string) => {
    if (!canvas) return;

    const image = uploadedImages.find((img) => img.id === imageId);
    if (!image) return;

    // Clamp to roll width
    let widthCm = image.widthCm;
    let heightCm = image.heightCm;
    if (widthCm > 57) {
      const scale = 57 / widthCm;
      widthCm = 57;
      heightCm = heightCm * scale;
    }

    const placementId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Find lowest point on canvas to place below existing designs
    const currentPlacements = useCanvasStore.getState().placements;
    const maxY =
      currentPlacements.length > 0
        ? Math.max(
            ...currentPlacements.map((p) => {
              const { height } = getEffectiveDimensions(p);
              return p.y + height;
            })
          ) + gapCm
        : 0;

    addPlacement({
      id: placementId,
      imageId: image.id,
      x: 0,
      y: maxY,
      widthCm,
      heightCm,
      rotation: 0,
    });

    addImageToCanvas(
      canvas,
      image.thumbnailUrl,
      placementId,
      0,
      maxY,
      widthCm,
      heightCm,
      0
    );
  };

  // Auto-place all designs (async with progress)
  const handleAutoPlace = async () => {
    if (!canvas) return;

    const designs: DesignInput[] = uploadedImages
      .filter((img) => (autoPlaceQuantities[img.id] || 0) > 0)
      .map((img) => {
        // Clamp to roll width
        let widthCm = img.widthCm;
        let heightCm = img.heightCm;
        if (widthCm > 57) {
          const scale = 57 / widthCm;
          widthCm = 57;
          heightCm = heightCm * scale;
        }
        return {
          id: img.id,
          widthCm,
          heightCm,
          quantity: autoPlaceQuantities[img.id] || 0,
        };
      });

    if (designs.length === 0) return;

    setAutoPlaceProgress(0);

    // 1. Run packing in Web Worker (main thread stays responsive)
    const result = await autoPackAsync(designs, undefined, gapCm);
    setAutoPlaceProgress(10);

    // 2. Clear existing designs from canvas
    clearCanvasDesigns(canvas);
    clearPlacements();

    // 3. Build placements and set them (skip O(n²) overlap check — autoPack is overlap-free)
    const newPlacements = result.placements.map((p) => ({
      id: p.id,
      imageId: p.imageId,
      x: p.x,
      y: p.y,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      rotation: p.rotation,
    }));

    setPlacements(newPlacements, { skipOverlaps: true });

    // 4. Batch image loading with progress
    const batchItems = newPlacements.map((placement) => {
      const image = uploadedImages.find((img) => img.id === placement.imageId);
      return {
        imageUrl: image?.thumbnailUrl ?? "",
        placementId: placement.id,
        xCm: placement.x,
        yCm: placement.y,
        widthCm: placement.widthCm,
        heightCm: placement.heightCm,
        rotation: placement.rotation,
      };
    }).filter((item) => item.imageUrl);

    await addImagesToCanvas(canvas, batchItems, (fraction) => {
      setAutoPlaceProgress(10 + fraction * 90);
    });

    setAutoPlaceProgress(null);
    setAutoPlaceOpen(false);
  };

  const handleRemoveImage = (id: string) => {
    // First, collect placement IDs belonging to this image and remove them from store
    const placementsToRemove = useCanvasStore
      .getState()
      .placements.filter((p) => p.imageId === id);

    placementsToRemove.forEach((p) => removePlacement(p.id));

    removeUploadedImage(id);

    // Also remove fabric objects from canvas
    if (canvas) {
      const placementIds = new Set(placementsToRemove.map((p) => p.id));
      const objectsToRemove = canvas
        .getObjects()
        .filter((obj) => {
          const pId = (obj as FabricObject & { _placementId?: string })._placementId;
          return pId ? placementIds.has(pId) : false;
        });
      objectsToRemove.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  return (
    <aside className="w-80 border-r border-white/5 bg-[#101620] flex flex-col h-full min-h-0 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        {/* Draft name + rename */}
        <div className="flex items-center gap-2 mb-2">
          {isRenaming ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmRename();
                  if (e.key === "Escape") handleCancelRename();
                }}
                className="h-7 text-sm bg-white/5 border-white/10 text-white"
                autoFocus
                maxLength={100}
              />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-400" onClick={handleConfirmRename}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400" onClick={handleCancelRename}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-white truncate flex-1 min-w-0">
                {activeDraftName}
              </h2>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-white shrink-0" onClick={handleStartRename}>
                <Pencil className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>

        {/* New + Drafts buttons */}
        <div className="flex gap-2 mb-3">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-slate-200" onClick={handleNewDesign}>
            <FilePlus className="h-3.5 w-3.5 mr-1.5" />
            Yeni
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-slate-200" onClick={() => setDraftsOpen(true)}>
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            Taslaklar
          </Button>
        </div>

        <ImageUpload />
      </div>

      <DraftListSheet
        open={draftsOpen}
        onOpenChange={setDraftsOpen}
        onSaveCurrentBeforeLoad={saveCurrentDraft}
      />

      <ScrollArea className="flex-1 min-h-0 p-4">
        {uploadedImages.length === 0 && uploadingFiles.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8">
            Henüz tasarım yüklenmedi
          </div>
        ) : (
          <div className="space-y-3">
            {/* Uploading files with progress */}
            {uploadingFiles.map((uf) => (
              <div
                key={uf.id}
                className="flex items-center gap-3 rounded-lg border border-white/5 p-2 bg-[#0a0f16]"
              >
                <div className="w-16 h-16 flex-shrink-0 rounded bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-slate-100">
                    {uf.fileName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Yükleniyor... %{uf.progress}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${uf.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="flex items-start gap-3 rounded-lg border border-white/5 p-2 bg-[#0a0f16] cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-dtf-image", image.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-black/40">
                  <img
                    src={image.persistedThumbnail || image.thumbnailUrl}
                    alt={image.imageName}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-slate-100">
                    {image.imageName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {image.widthCm} x {image.heightCm} cm
                    <span className="mx-1">·</span>
                    {image.widthPx}x{image.heightPx}px
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <DpiBadge
                      widthPx={image.widthPx}
                      widthCm={image.widthCm}
                    />
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 text-slate-200"
                      onClick={() => handleAddToCanvas(image.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ekle
                    </Button>
                    <ImageResizeDialog image={image} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Auto-place button */}
      {uploadedImages.length > 0 && (
        <div className="p-4 border-t border-white/5">
          <Dialog open={autoPlaceOpen} onOpenChange={setAutoPlaceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full text-slate-200">
                <Wand2 className="h-4 w-4 mr-2" />
                Otomatik Yerleştir
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#101620] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Otomatik Yerleştirme</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-slate-400">
                  Her tasarım için kaç adet basmak istediğinizi girin. Sistem en
                  verimli şekilde yerleştirme yapacak.
                </p>
                <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-1">
                  {uploadedImages.map((image) => (
                    <div
                      key={image.id}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0a0f16] p-2"
                    >
                      <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-black/40">
                        <img
                          src={image.persistedThumbnail || image.thumbnailUrl}
                          alt={image.imageName}
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-all line-clamp-2 text-slate-100">
                          {image.imageName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {image.widthCm} x {image.heightCm} cm
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Label className="text-xs text-slate-400">Adet:</Label>
                        <Input
                          type="number"
                          min={0}
                          max={999}
                          className="w-20 h-8 bg-white/5 border-white/10 text-white"
                          value={autoPlaceQuantities[image.id] || 0}
                          onChange={(e) =>
                            setAutoPlaceQuantity(
                              image.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {autoPlaceProgress !== null && (
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Yerleştiriliyor...</span>
                      <span>%{Math.round(autoPlaceProgress)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-all duration-200"
                        style={{ width: `${autoPlaceProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <Button
                  className="w-full editor-glow-btn"
                  onClick={handleAutoPlace}
                  disabled={
                    autoPlaceProgress !== null ||
                    !Object.values(autoPlaceQuantities).some((q) => q > 0)
                  }
                >
                  {autoPlaceProgress !== null ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {autoPlaceProgress !== null ? "Yerleştiriliyor..." : "Yerleştir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </aside>
  );
}
