"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Canvas as FabricCanvas } from "fabric";
import type { UploadedImage, Placement, GangSheetItem, DesignDraftData } from "@/types/canvas";
import type { PricingTierData, PriceBreakdown, CustomerPricingData } from "@/types/pricing";
import type { CartItemData } from "@/stores/cart-store";
import { ROLL_CONFIG } from "@/lib/constants";
import { calculatePrice } from "@/services/pricing.service";
import { getEffectiveDimensions, findOverlappingPlacements } from "@/lib/placement-utils";
import { useHistoryStore } from "@/stores/history-store";


interface CanvasState {
  // Fabric.js canvas reference
  canvas: FabricCanvas | null;
  setCanvas: (canvas: FabricCanvas | null) => void;

  // Uploaded images (before placement)
  uploadedImages: UploadedImage[];
  addUploadedImage: (image: UploadedImage) => void;
  removeUploadedImage: (id: string) => void;
  updateUploadedImage: (id: string, updates: Partial<UploadedImage>) => void;

  // Placements on canvas
  placements: Placement[];
  setPlacements: (placements: Placement[], opts?: { skipOverlaps?: boolean; skipHistory?: boolean }) => void;
  addPlacement: (placement: Placement) => void;
  removePlacement: (id: string) => void;
  updatePlacement: (id: string, updates: Partial<Placement>) => void;
  clearPlacements: () => void;

  // Auto-placement quantities
  autoPlaceQuantities: Record<string, number>;
  setAutoPlaceQuantity: (imageId: string, qty: number) => void;

  // Canvas state
  mode: "manual" | "auto";
  setMode: (mode: "manual" | "auto") => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  scrollY: number;
  setScrollY: (y: number) => void;

  // Canvas view settings
  canvasBgColor: string;
  showGrid: boolean;
  showRuler: boolean;
  snapToGrid: boolean;
  setCanvasBgColor: (color: string) => void;
  setShowGrid: (show: boolean) => void;
  setShowRuler: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;

  // Design settings
  gapCm: number;
  setGapCm: (gap: number) => void;

  // Calculated values
  totalHeightCm: number;
  setTotalHeightCm: (height: number) => void;

  // Pricing
  pricingTiers: PricingTierData[];
  setPricingTiers: (tiers: PricingTierData[]) => void;
  customerPricing: CustomerPricingData | null;
  setCustomerPricing: (pricing: CustomerPricingData | null) => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  priceBreakdown: PriceBreakdown | null;

  // Editing
  editingCartItemId: string | null;
  setEditingCartItemId: (id: string | null) => void;
  loadCartItemForEditing: (cartItem: CartItemData) => void;

  // Draft support
  activeDraftId: string | null;
  activeDraftName: string;
  setActiveDraftId: (id: string | null) => void;
  setActiveDraftName: (name: string) => void;
  snapshotCurrentState: () => DesignDraftData | null;
  loadDraft: (data: DesignDraftData) => void;
  resetCanvas: () => void;

  // Overlap detection
  overlappingIds: Set<string>;
  recalculateOverlaps: () => void;

  // Actions
  recalculatePrice: () => void;
  recalculateHeight: (skipOverlaps?: boolean) => void;
}

// Helper: pick the best available URL for an image (for persistence & restore)
function resolveThumbnailUrl(img: UploadedImage): string {
  // 1. S3 URL (non-blob originalUrl)
  if (img.originalUrl && !img.originalUrl.startsWith("blob:")) return img.originalUrl;
  // 2. base64 data-URL thumbnail (always survives reload)
  if (img.persistedThumbnail) return img.persistedThumbnail;
  // 3. Current thumbnailUrl (blob – only works in same session)
  return img.thumbnailUrl;
}

// Debounced localStorage: batches writes to reduce I/O during rapid updates
function createDebouncedLocalStorage(delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { key: string; value: string } | null = null;

  return {
    getItem: (name: string) => localStorage.getItem(name),
    setItem: (name: string, value: string) => {
      pending = { key: name, value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (pending) {
          localStorage.setItem(pending.key, pending.value);
        }
        pending = null;
        timer = null;
      }, delay);
    },
    removeItem: (name: string) => {
      if (timer) clearTimeout(timer);
      pending = null;
      localStorage.removeItem(name);
    },
  };
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      canvas: null,
      setCanvas: (canvas) => set({ canvas }),

      uploadedImages: [],
      addUploadedImage: (image) =>
        set((state) => ({
          uploadedImages: [...state.uploadedImages, image],
          autoPlaceQuantities: {
            ...state.autoPlaceQuantities,
            [image.id]: 1,
          },
        })),
      updateUploadedImage: (id, updates) =>
        set((state) => ({
          uploadedImages: state.uploadedImages.map((img) =>
            img.id === id ? { ...img, ...updates } : img
          ),
        })),
      removeUploadedImage: (id) =>
        set((state) => {
          const { [id]: _unused, ...rest } = state.autoPlaceQuantities;
          // Revoke blob URL to prevent memory leak
          const image = state.uploadedImages.find((img) => img.id === id);
          if (image?.thumbnailUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(image.thumbnailUrl);
          }
          return {
            uploadedImages: state.uploadedImages.filter((img) => img.id !== id),
            autoPlaceQuantities: rest,
          };
        }),

      placements: [],
      setPlacements: (placements, opts) => {
        if (!opts?.skipHistory) {
          useHistoryStore.getState().pushState(get().placements);
        }

        // For large sets, batch all state into a single set() call
        // to avoid triggering persist serialize (JSON.stringify) multiple times.
        if (opts?.skipHistory && placements.length > 200) {
          let totalHeightCm = 0;
          for (const p of placements) {
            const { height } = getEffectiveDimensions(p);
            const bottom = p.y + height;
            if (bottom > totalHeightCm) totalHeightCm = bottom;
          }
          totalHeightCm = Math.round(totalHeightCm * 100) / 100;

          const { pricingTiers, customerPricing, discountPercent } = get();
          const priceBreakdown =
            totalHeightCm > 0 && pricingTiers.length > 0
              ? calculatePrice(totalHeightCm, pricingTiers, customerPricing, discountPercent, 0)
              : null;

          // Single set() → single persist trigger
          set({ placements, totalHeightCm, priceBreakdown, overlappingIds: new Set<string>() });
          return;
        }

        set({ placements });
        get().recalculateHeight(opts?.skipOverlaps);
      },
      addPlacement: (placement) => {
        useHistoryStore.getState().pushState(get().placements);
        set((state) => ({
          placements: [...state.placements, placement],
        }));
        get().recalculateHeight();
      },
      removePlacement: (id) => {
        useHistoryStore.getState().pushState(get().placements);
        set((state) => ({
          placements: state.placements.filter((p) => p.id !== id),
        }));
        get().recalculateHeight();
      },
      updatePlacement: (id, updates) => {
        useHistoryStore.getState().pushState(get().placements);
        set((state) => ({
          placements: state.placements.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
        get().recalculateHeight();
      },
      clearPlacements: () => {
        useHistoryStore.getState().pushState(get().placements);
        set({ placements: [], totalHeightCm: 0, priceBreakdown: null, overlappingIds: new Set<string>() });
      },

      autoPlaceQuantities: {},
      setAutoPlaceQuantity: (imageId, qty) =>
        set((state) => ({
          autoPlaceQuantities: {
            ...state.autoPlaceQuantities,
            [imageId]: Math.max(0, qty),
          },
        })),

      mode: "manual",
      setMode: (mode) => set({ mode }),
      zoom: 1,
      setZoom: (zoom) => set({ zoom }),
      scrollY: 0,
      setScrollY: (y) => set({ scrollY: y }),

      // Canvas view settings
      canvasBgColor: "#ffffff",
      showGrid: true,
      showRuler: true,
      snapToGrid: false,
      setCanvasBgColor: (color) => set({ canvasBgColor: color }),
      setShowGrid: (show) => set({ showGrid: show }),
      setShowRuler: (show) => set({ showRuler: show }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),

      gapCm: 0.3,
      setGapCm: (gap) => set({ gapCm: Math.max(0, Math.min(5, gap)) }),

      totalHeightCm: 0,
      setTotalHeightCm: (height) => {
        set({ totalHeightCm: height });
        get().recalculatePrice();
      },

      pricingTiers: [],
      setPricingTiers: (tiers) => {
        set({ pricingTiers: tiers });
        get().recalculatePrice();
      },
      customerPricing: null,
      setCustomerPricing: (pricing) => {
        set({ customerPricing: pricing });
        get().recalculatePrice();
      },
      discountCode: "",
      setDiscountCode: (code) => set({ discountCode: code }),
      discountPercent: 0,
      setDiscountPercent: (percent) => {
        set({ discountPercent: percent });
        get().recalculatePrice();
      },
      priceBreakdown: null,

      editingCartItemId: null,
      setEditingCartItemId: (id) => set({ editingCartItemId: id }),

      loadCartItemForEditing: (cartItem) => {
        const s3Base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "";

        // Convert GangSheetItem[] → UploadedImage[]
        const uploadedImages: UploadedImage[] = cartItem.items.map((gi: GangSheetItem) => {
          const url = gi.originalUrl || (s3Base ? `${s3Base}/${gi.imageKey}` : "");
          const id = crypto.randomUUID();
          return {
            id,
            imageKey: gi.imageKey,
            imageName: gi.imageName,
            thumbnailUrl: url,
            originalUrl: url,
            widthPx: gi.originalWidthPx,
            heightPx: gi.originalHeightPx,
            widthCm: gi.originalWidthPx / ROLL_CONFIG.PX_PER_CM,
            heightCm: gi.originalHeightPx / ROLL_CONFIG.PX_PER_CM,
          };
        });

        // Build imageKey → new imageId map
        const keyToId = new Map(uploadedImages.map((img) => [img.imageKey, img.id]));

        // Convert placements
        const placements: Placement[] = [];
        for (const gi of cartItem.items) {
          const imageId = keyToId.get(gi.imageKey);
          if (!imageId) continue;
          for (const p of gi.placements) {
            placements.push({
              id: crypto.randomUUID(),
              imageId,
              x: p.x,
              y: p.y,
              widthCm: p.widthCm,
              heightCm: p.heightCm,
              rotation: p.rotation,
            });
          }
        }

        // Build auto-place quantities
        const autoPlaceQuantities: Record<string, number> = {};
        for (const gi of cartItem.items) {
          const imageId = keyToId.get(gi.imageKey);
          if (imageId) autoPlaceQuantities[imageId] = gi.placements.length;
        }

        set({
          uploadedImages,
          placements,
          autoPlaceQuantities,
          editingCartItemId: cartItem.id,
        });

        // Recalculate height & price
        get().recalculateHeight();
      },

      // Draft support
      activeDraftId: null,
      activeDraftName: "Adsız Tasarım",
      setActiveDraftId: (id) => set({ activeDraftId: id }),
      setActiveDraftName: (name) => set({ activeDraftName: name }),

      snapshotCurrentState: () => {
        const { uploadedImages, placements, autoPlaceQuantities, gapCm } = get();
        // Only include images that have a restorable URL
        const persistable = uploadedImages
          .filter(
            (img) =>
              img.persistedThumbnail ||
              (img.originalUrl && !img.originalUrl.startsWith("blob:"))
          )
          .map(({ file: _file, ...rest }) => ({
            ...rest,
            thumbnailUrl: resolveThumbnailUrl(rest as UploadedImage),
            originalUrl: rest.originalUrl?.startsWith("blob:") ? "" : rest.originalUrl,
          }));

        if (persistable.length === 0 && placements.length === 0) return null;

        const imageIds = new Set(persistable.map((img) => img.id));
        return {
          uploadedImages: persistable,
          placements: placements.filter((p) => imageIds.has(p.imageId)),
          autoPlaceQuantities: Object.fromEntries(
            Object.entries(autoPlaceQuantities).filter(([id]) => imageIds.has(id))
          ),
          gapCm,
        };
      },

      loadDraft: (data) => {
        const { canvas } = get();
        const isLargeSet = data.placements.length > 200;

        // Clear existing fabric objects (skip if summary mode will be active)
        if (canvas && !isLargeSet) {
          const designObjects = canvas
            .getObjects()
            .filter(
              (obj) =>
                !(obj as unknown as { _isBackground?: boolean })._isBackground
            );
          designObjects.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
        }

        const images = data.uploadedImages as UploadedImage[];

        set({
          uploadedImages: images,
          placements: data.placements,
          autoPlaceQuantities: data.autoPlaceQuantities,
          gapCm: data.gapCm,
          editingCartItemId: null,
        });

        // Render placements onto the fabric canvas — skip for large sets (summary mode)
        if (canvas && !isLargeSet) {
          for (const placement of data.placements) {
            const image = images.find((img) => img.id === placement.imageId);
            if (!image) continue;
            const canvasUrl =
              image.originalUrl && !image.originalUrl.startsWith("blob:")
                ? image.originalUrl
                : image.thumbnailUrl;

            // Inline the addImageToCanvas logic (import not possible in store)
            const DISPLAY_WIDTH = 800;
            const DISPLAY_PX_PER_CM = DISPLAY_WIDTH / 57; // ~14.04 px/cm
            const displayWidth = placement.widthCm * DISPLAY_PX_PER_CM;
            const displayHeight = placement.heightCm * DISPLAY_PX_PER_CM;
            const displayLeft = placement.x * DISPLAY_PX_PER_CM;
            const displayTop = placement.y * DISPLAY_PX_PER_CM;

            import("fabric").then((fabricModule) => {
              fabricModule.FabricImage.fromURL(canvasUrl, { crossOrigin: "anonymous" }).then((img) => {
                const scaleX = displayWidth / (img.width || 1);
                const scaleY = displayHeight / (img.height || 1);

                img.set({
                  originX: "left",
                  originY: "top",
                  left: displayLeft,
                  top: displayTop,
                  scaleX,
                  scaleY,
                  angle: placement.rotation,
                  cornerColor: "#3b82f6",
                  cornerStyle: "circle",
                  cornerSize: 8,
                  transparentCorners: false,
                  borderColor: "#3b82f6",
                  borderScaleFactor: 2,
                  lockRotation: true,
                });

                delete img.controls.mtr;

                (img as unknown as { _placementId?: string })._placementId = placement.id;

                if (placement.rotation === 90) {
                  img.set({ left: displayLeft + displayHeight, top: displayTop });
                } else if (placement.rotation === 270) {
                  img.set({ left: displayLeft, top: displayTop + displayWidth });
                }

                img.setCoords();
                canvas.add(img);
                canvas.renderAll();
              });
            });
          }
        }

        get().recalculateHeight();
      },

      resetCanvas: () => {
        const { canvas } = get();

        // Clear fabric canvas objects
        if (canvas) {
          const designObjects = canvas
            .getObjects()
            .filter(
              (obj) =>
                !(obj as unknown as { _isBackground?: boolean })._isBackground
            );
          designObjects.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
        }

        set({
          uploadedImages: [],
          placements: [],
          autoPlaceQuantities: {},
          activeDraftId: null,
          activeDraftName: "Adsız Tasarım",
          editingCartItemId: null,
          totalHeightCm: 0,
          priceBreakdown: null,
        });
      },

      recalculatePrice: () => {
        const { totalHeightCm, pricingTiers, customerPricing, discountPercent } =
          get();
        if (totalHeightCm <= 0 || pricingTiers.length === 0) {
          set({ priceBreakdown: null });
          return;
        }
        const breakdown = calculatePrice(
          totalHeightCm,
          pricingTiers,
          customerPricing,
          discountPercent,
          0
        );
        set({ priceBreakdown: breakdown });
      },

      overlappingIds: new Set<string>(),
      recalculateOverlaps: () => {
        const { placements } = get();
        // O(n²) — skip for large sets to avoid blocking the main thread
        if (placements.length > 200) {
          set({ overlappingIds: new Set<string>() });
          return;
        }
        const overlappingIds = findOverlappingPlacements(placements);
        set({ overlappingIds });
      },

      recalculateHeight: (skipOverlaps = false) => {
        const { placements } = get();
        if (placements.length === 0) {
          set({ totalHeightCm: 0, overlappingIds: new Set<string>() });
          get().recalculatePrice();
          return;
        }
        // Find the bottom-most point of all placements (rotation-aware)
        const maxY = Math.max(
          ...placements.map((p) => {
            const { height } = getEffectiveDimensions(p);
            return p.y + height;
          })
        );
        const totalHeightCm = Math.round(maxY * 100) / 100;
        set({ totalHeightCm });
        get().recalculatePrice();
        if (!skipOverlaps) {
          get().recalculateOverlaps();
        } else {
          set({ overlappingIds: new Set<string>() });
        }
      },
    }),
    {
      name: "dtf-canvas-state",
      version: 1,
      storage: createJSONStorage(() => createDebouncedLocalStorage(2000)),

      // v0→v1: old thumbnails were JPEG (lost transparency → black bg) at 200px (blurry).
      // Drop images that only have JPEG base64; keep those with S3 URLs or PNG thumbs.
      migrate: (persisted, version) => {
        if (version === 0) {
          const state = persisted as Record<string, unknown>;
          const images = (state?.uploadedImages ?? []) as Array<Record<string, unknown>>;

          const cleaned = images.filter((img) => {
            const hasS3 =
              typeof img.originalUrl === "string" &&
              !img.originalUrl.startsWith("blob:") &&
              !img.originalUrl.startsWith("data:");
            const hasPngThumb =
              typeof img.persistedThumbnail === "string" &&
              img.persistedThumbnail.startsWith("data:image/png");
            return hasS3 || hasPngThumb;
          });

          const validIds = new Set(cleaned.map((img) => img.id));
          const placements = ((state?.placements ?? []) as Array<Record<string, unknown>>).filter(
            (p) => validIds.has(p.imageId as string)
          );

          return { ...state, uploadedImages: cleaned, placements };
        }
        return persisted as Record<string, unknown>;
      },

      // Only persist fields needed to restore a session.
      // canvas ref, pricing tiers, priceBreakdown are transient.
      partialize: (state) => ({
        editingCartItemId: state.editingCartItemId,
        activeDraftId: state.activeDraftId,
        activeDraftName: state.activeDraftName,
        canvasBgColor: state.canvasBgColor,
        showGrid: state.showGrid,
        showRuler: state.showRuler,
        snapToGrid: state.snapToGrid,
        uploadedImages: state.uploadedImages
          // Keep every image that has at least one restorable URL
          .filter(
            (img) =>
              img.persistedThumbnail ||
              (img.originalUrl && !img.originalUrl.startsWith("blob:"))
          )
          .map(({ file: _file, ...rest }) => ({
            ...rest,
            // Swap blob thumbnailUrl to a restorable URL
            thumbnailUrl: resolveThumbnailUrl(rest as UploadedImage),
            // Clear dead blob originalUrl so it doesn't accumulate
            originalUrl: rest.originalUrl?.startsWith("blob:") ? "" : rest.originalUrl,
          })),
        // Skip persisting large placement sets — serializing 5000+ items
        // on every set() call blocks the main thread. Users re-run auto-place
        // after refresh anyway, so no data loss.
        placements: state.placements.length <= 200 ? state.placements : [],
        autoPlaceQuantities: state.autoPlaceQuantities,
        gapCm: state.gapCm,
      }),

      // Merge persisted → default.  Also clean up orphan placements
      // whose image was not persisted (no circular-reference risk here).
      merge: (persisted, current) => {
        const p = persisted as Partial<CanvasState>;
        const images = p.uploadedImages ?? [];
        const imageIds = new Set(images.map((img) => img.id));

        // Drop placements whose image is missing
        const placements = (p.placements ?? []).filter((pl) =>
          imageIds.has(pl.imageId)
        );

        // Drop orphan quantity entries
        const autoPlaceQuantities: Record<string, number> = {};
        for (const [id, qty] of Object.entries(p.autoPlaceQuantities ?? {})) {
          if (imageIds.has(id)) autoPlaceQuantities[id] = qty;
        }

        return {
          ...current,
          uploadedImages: images,
          placements,
          autoPlaceQuantities,
          gapCm: p.gapCm ?? current.gapCm,
          canvasBgColor: (p as Record<string, unknown>).canvasBgColor as string ?? "#ffffff",
          showGrid: (p as Record<string, unknown>).showGrid as boolean ?? true,
          showRuler: (p as Record<string, unknown>).showRuler as boolean ?? true,
          snapToGrid: (p as Record<string, unknown>).snapToGrid as boolean ?? false,
          editingCartItemId: (p as Record<string, unknown>).editingCartItemId as string | null ?? null,
          activeDraftId: (p as Record<string, unknown>).activeDraftId as string | null ?? null,
          activeDraftName: ((p as Record<string, unknown>).activeDraftName as string) || "Adsız Tasarım",
        };
      },
    }
  )
);
