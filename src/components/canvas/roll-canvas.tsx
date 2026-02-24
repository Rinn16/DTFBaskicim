"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import * as fabric from "fabric";
import { useCanvasStore } from "@/stores/canvas-store";
import { useHistoryStore } from "@/stores/history-store";
import { ROLL_CONFIG } from "@/lib/constants";
import { getEffectiveDimensions } from "@/lib/placement-utils";
import type { Placement } from "@/types/canvas";

// Display dimensions
const DISPLAY_WIDTH = 800;
const DISPLAY_PX_PER_CM = DISPLAY_WIDTH / ROLL_CONFIG.PRINT_WIDTH_CM; // ~14.04 px/cm
const FALLBACK_MIN_HEIGHT = 600;

/** Above this many placements, hide the canvas and show a summary instead */
export const CANVAS_PLACEMENT_LIMIT = 200;

/** Convert cm to display pixels */
export function cmToDisplayPx(cm: number): number {
  return cm * DISPLAY_PX_PER_CM;
}

/** Convert display pixels to cm */
export function displayPxToCm(px: number): number {
  return px / DISPLAY_PX_PER_CM;
}

interface PlacementClipboard {
  imageId: string;
  widthCm: number;
  heightCm: number;
  rotation: number;
}

export function RollCanvas() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const clipboardRef = useRef<PlacementClipboard[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);

  const setCanvas = useCanvasStore((s) => s.setCanvas);
  const placementCount = useCanvasStore((s) => s.placements.length);
  const updatePlacement = useCanvasStore((s) => s.updatePlacement);
  const removePlacement = useCanvasStore((s) => s.removePlacement);
  const addPlacement = useCanvasStore((s) => s.addPlacement);
  const showRuler = useCanvasStore((s) => s.showRuler);
  const zoom = useCanvasStore((s) => s.zoom);
  const totalHeightCm = useCanvasStore((s) => s.totalHeightCm);

  // Observe container height changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw the roll background with grid lines
  const drawRollBackground = useCallback(
    (canvas: fabric.Canvas, canvasHeight: number, showGrid: boolean) => {
      // Remove existing background objects
      const bgObjects = canvas
        .getObjects()
        .filter(
          (obj) =>
            (obj as fabric.FabricObject & { _isBackground?: boolean })
              ._isBackground
        );
      bgObjects.forEach((obj) => canvas.remove(obj));

      if (showGrid) {
        // Grid lines (every 1cm)
        const gridSpacing = cmToDisplayPx(ROLL_CONFIG.GRID_SPACING_CM);

        // Vertical grid lines
        for (let x = gridSpacing; x < DISPLAY_WIDTH; x += gridSpacing) {
          const line = new fabric.Line([x, 0, x, canvasHeight], {
            stroke: "#f0f0f0",
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            excludeFromExport: true,
            originX: "left",
            originY: "top",
          });
          (
            line as fabric.FabricObject & { _isBackground?: boolean }
          )._isBackground = true;
          canvas.insertAt(0, line);
        }

        // Horizontal grid lines
        for (let y = gridSpacing; y < canvasHeight; y += gridSpacing) {
          const line = new fabric.Line([0, y, DISPLAY_WIDTH, y], {
            stroke: "#f0f0f0",
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            excludeFromExport: true,
            originX: "left",
            originY: "top",
          });
          (
            line as fabric.FabricObject & { _isBackground?: boolean }
          )._isBackground = true;
          canvas.insertAt(0, line);
        }

        // Every 5cm - slightly darker line
        const majorSpacing = gridSpacing * 5;
        for (let y = majorSpacing; y < canvasHeight; y += majorSpacing) {
          const line = new fabric.Line([0, y, DISPLAY_WIDTH, y], {
            stroke: "#e0e0e0",
            strokeWidth: 1,
            selectable: false,
            evented: false,
            excludeFromExport: true,
            originX: "left",
            originY: "top",
          });
          (
            line as fabric.FabricObject & { _isBackground?: boolean }
          )._isBackground = true;
          canvas.insertAt(0, line);
        }
      }

      // Roll boundary lines (left and right blue edges) — always visible
      const leftBorder = new fabric.Line([0, 0, 0, canvasHeight], {
        stroke: "#3b82f6",
        strokeWidth: 2,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        originX: "left",
        originY: "top",
      });
      (
        leftBorder as fabric.FabricObject & { _isBackground?: boolean }
      )._isBackground = true;
      canvas.add(leftBorder);

      const rightBorder = new fabric.Line(
        [DISPLAY_WIDTH, 0, DISPLAY_WIDTH, canvasHeight],
        {
          stroke: "#3b82f6",
          strokeWidth: 2,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          originX: "left",
          originY: "top",
        }
      );
      (
        rightBorder as fabric.FabricObject & { _isBackground?: boolean }
      )._isBackground = true;
      canvas.add(rightBorder);

      canvas.renderAll();
    },
    []
  );

  // Apply history state (undo/redo) — diff-based to avoid flicker
  const applyHistoryState = useCallback(
    (restoredPlacements: Placement[]) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      canvas.discardActiveObject();

      // Build map of existing fabric objects by placement ID
      const existingObjects = new Map<string, fabric.FabricObject>();
      for (const obj of canvas.getObjects()) {
        if ((obj as fabric.FabricObject & { _isBackground?: boolean })._isBackground) continue;
        const pid = (obj as fabric.FabricObject & { _placementId?: string })._placementId;
        if (pid) existingObjects.set(pid, obj);
      }

      const restoredIds = new Set(restoredPlacements.map((p) => p.id));

      // Remove objects no longer in restored placements
      for (const [pid, obj] of existingObjects) {
        if (!restoredIds.has(pid)) {
          canvas.remove(obj);
          existingObjects.delete(pid);
        }
      }

      // Update existing or add new
      const { uploadedImages } = useCanvasStore.getState();
      for (const placement of restoredPlacements) {
        const existing = existingObjects.get(placement.id);

        if (existing) {
          const displayLeft = cmToDisplayPx(placement.x);
          const displayTop = cmToDisplayPx(placement.y);
          const displayWidth = cmToDisplayPx(placement.widthCm);
          const displayHeight = cmToDisplayPx(placement.heightCm);
          const scaleX = displayWidth / (existing.width || 1);
          const scaleY = displayHeight / (existing.height || 1);

          let left = displayLeft;
          let top = displayTop;
          if (placement.rotation === 90) {
            left = displayLeft + displayHeight;
          } else if (placement.rotation === 270) {
            top = displayTop + displayWidth;
          }

          existing.set({ left, top, scaleX, scaleY, angle: placement.rotation });
          existing.setCoords();
        } else {
          const image = uploadedImages.find((img) => img.id === placement.imageId);
          if (!image) continue;
          const canvasUrl =
            image.originalUrl && !image.originalUrl.startsWith("blob:")
              ? image.originalUrl
              : image.thumbnailUrl;
          addImageToCanvas(
            canvas,
            canvasUrl,
            placement.id,
            placement.x,
            placement.y,
            placement.widthCm,
            placement.heightCm,
            placement.rotation
          );
        }
      }

      canvas.renderAll();

      // Update store without triggering history push (_isRestoring is true)
      useCanvasStore.setState({ placements: restoredPlacements });
      useCanvasStore.getState().recalculateHeight();

      // Reset _isRestoring flag
      useHistoryStore.setState({ _isRestoring: false });
    },
    []
  );

  // Undo handler
  const handleUndo = useCallback(() => {
    const historyStore = useHistoryStore.getState();
    const currentPlacements = useCanvasStore.getState().placements;

    const entry = historyStore.undo();
    if (!entry) return;

    // Push current state to future
    useHistoryStore.setState((state) => ({
      future: [...state.future, currentPlacements.map((p) => ({ ...p }))],
    }));

    applyHistoryState(entry);
  }, [applyHistoryState]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const historyStore = useHistoryStore.getState();
    const currentPlacements = useCanvasStore.getState().placements;

    const entry = historyStore.redo();
    if (!entry) return;

    // Push current state to past
    useHistoryStore.setState((state) => ({
      past: [...state.past, currentPlacements.map((p) => ({ ...p }))],
    }));

    applyHistoryState(entry);
  }, [applyHistoryState]);

  // Refs for undo/redo to avoid stale closures in the keydown handler
  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  handleUndoRef.current = handleUndo;
  handleRedoRef.current = handleRedo;

  // Initialize canvas
  useEffect(() => {
    if (!canvasElRef.current || fabricRef.current) return;

    const { canvasBgColor, showGrid } = useCanvasStore.getState();

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: DISPLAY_WIDTH,
      height: FALLBACK_MIN_HEIGHT,
      backgroundColor: canvasBgColor,
      selection: true,
    });

    fabricRef.current = canvas;
    setCanvas(canvas);

    // Draw initial background
    drawRollBackground(canvas, FALLBACK_MIN_HEIGHT, showGrid);

    // Restore persisted placements onto the canvas (runs once after init)
    const { placements: savedPlacements, uploadedImages: savedImages } =
      useCanvasStore.getState();
    if (savedPlacements.length > 0) {
      for (const placement of savedPlacements) {
        const image = savedImages.find((img) => img.id === placement.imageId);
        if (!image) continue;
        const canvasUrl =
          image.originalUrl && !image.originalUrl.startsWith("blob:")
            ? image.originalUrl
            : image.thumbnailUrl;
        addImageToCanvas(
          canvas,
          canvasUrl,
          placement.id,
          placement.x,
          placement.y,
          placement.widthCm,
          placement.heightCm,
          placement.rotation
        );
      }
      useCanvasStore.getState().recalculateHeight();
    }

    // Object constraint: keep within roll bounds
    canvas.on("object:moving", (e) => {
      const obj = e.target;
      if (!obj) return;

      // Snap to grid if enabled (before boundary clamp)
      const { snapToGrid } = useCanvasStore.getState();
      if (snapToGrid) {
        const gridPx = cmToDisplayPx(ROLL_CONFIG.GRID_SPACING_CM);
        const snappedLeft = Math.round((obj.left ?? 0) / gridPx) * gridPx;
        const snappedTop = Math.round((obj.top ?? 0) / gridPx) * gridPx;
        obj.set({ left: snappedLeft, top: snappedTop });
      }

      const bound = obj.getBoundingRect();
      const left = obj.left ?? 0;
      const top = obj.top ?? 0;

      // Clamp using bounding rect
      if (bound.left < 0) {
        obj.set("left", left - bound.left);
      } else if (bound.left + bound.width > DISPLAY_WIDTH) {
        obj.set("left", left - (bound.left + bound.width - DISPLAY_WIDTH));
      }

      if (bound.top < 0) {
        obj.set("top", top - bound.top);
      }
    });

    // Prevent scaling beyond roll boundaries
    canvas.on("object:scaling", (e) => {
      const obj = e.target;
      if (!obj) return;

      const left = obj.left ?? 0;
      const top = obj.top ?? 0;
      const objWidth = (obj.width ?? 0) * (obj.scaleX ?? 1);

      if (left + objWidth > DISPLAY_WIDTH) {
        const maxWidth = DISPLAY_WIDTH - left;
        const maxScaleX = maxWidth / (obj.width ?? 1);
        obj.set("scaleX", maxScaleX);
      }

      if (top < 0) obj.set("top", 0);
    });

    // Update placement when object is modified
    canvas.on("object:modified", (e) => {
      const obj = e.target;
      if (!obj) return;
      const placementId = (
        obj as fabric.FabricObject & { _placementId?: string }
      )._placementId;
      if (!placementId) return;

      const rawAngle = (obj.angle ?? 0) % 360;
      const snappedAngle = Math.round(rawAngle / 90) * 90;
      if (obj.angle !== snappedAngle) {
        obj.set("angle", snappedAngle);
        obj.setCoords();
        canvas.renderAll();
      }

      const bound = obj.getBoundingRect();
      const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
      const height = (obj.height ?? 0) * (obj.scaleY ?? 1);

      updatePlacement(placementId, {
        x: displayPxToCm(bound.left),
        y: displayPxToCm(bound.top),
        widthCm: displayPxToCm(width),
        heightCm: displayPxToCm(height),
        rotation: snappedAngle,
      });
    });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Z — Undo
      if (ctrl && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndoRef.current();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z — Redo
      if ((ctrl && e.key === "y") || (ctrl && e.shiftKey && e.key === "Z")) {
        e.preventDefault();
        handleRedoRef.current();
        return;
      }

      // Ctrl+C — Copy
      if (ctrl && e.key === "c") {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length === 0) return;
        e.preventDefault();

        const currentPlacements = useCanvasStore.getState().placements;
        const copied: PlacementClipboard[] = [];
        for (const obj of activeObjects) {
          const placementId = (
            obj as fabric.FabricObject & { _placementId?: string }
          )._placementId;
          if (!placementId) continue;
          const placement = currentPlacements.find((p) => p.id === placementId);
          if (!placement) continue;
          copied.push({
            imageId: placement.imageId,
            widthCm: placement.widthCm,
            heightCm: placement.heightCm,
            rotation: placement.rotation,
          });
        }
        clipboardRef.current = copied;
        return;
      }

      // Ctrl+V — Paste
      if (ctrl && e.key === "v") {
        if (clipboardRef.current.length === 0) return;
        e.preventDefault();

        const { uploadedImages, placements: currentPlacements, gapCm } = useCanvasStore.getState();
        const OFFSET_CM = 1;

        // Find bottom of existing placements for positioning
        let maxY = 0;
        if (currentPlacements.length > 0) {
          maxY = Math.max(
            ...currentPlacements.map((p) => {
              const { height } = getEffectiveDimensions(p);
              return p.y + height;
            })
          ) + gapCm;
        }

        for (const item of clipboardRef.current) {
          const image = uploadedImages.find((img) => img.id === item.imageId);
          if (!image) continue;

          const placementId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          useCanvasStore.getState().addPlacement({
            id: placementId,
            imageId: item.imageId,
            x: OFFSET_CM,
            y: maxY,
            widthCm: item.widthCm,
            heightCm: item.heightCm,
            rotation: item.rotation,
          });

          const canvasUrl =
            image.originalUrl && !image.originalUrl.startsWith("blob:")
              ? image.originalUrl
              : image.thumbnailUrl;
          addImageToCanvas(
            canvas,
            canvasUrl,
            placementId,
            OFFSET_CM,
            maxY,
            item.widthCm,
            item.heightCm,
            item.rotation
          );

          const { height } = getEffectiveDimensions(item);
          maxY += height + gapCm;
        }
        return;
      }

      // Ctrl+D — Duplicate
      if (ctrl && e.key === "d") {
        e.preventDefault();
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length === 0) return;

        const { placements: currentPlacements, uploadedImages, gapCm } = useCanvasStore.getState();

        for (const obj of activeObjects) {
          const placementId = (
            obj as fabric.FabricObject & { _placementId?: string }
          )._placementId;
          if (!placementId) continue;
          const placement = currentPlacements.find((p) => p.id === placementId);
          if (!placement) continue;

          const image = uploadedImages.find((img) => img.id === placement.imageId);
          if (!image) continue;

          const newId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const offsetCm = 1;

          useCanvasStore.getState().addPlacement({
            id: newId,
            imageId: placement.imageId,
            x: placement.x + offsetCm,
            y: placement.y + offsetCm,
            widthCm: placement.widthCm,
            heightCm: placement.heightCm,
            rotation: placement.rotation,
          });

          const canvasUrl =
            image.originalUrl && !image.originalUrl.startsWith("blob:")
              ? image.originalUrl
              : image.thumbnailUrl;
          addImageToCanvas(
            canvas,
            canvasUrl,
            newId,
            placement.x + offsetCm,
            placement.y + offsetCm,
            placement.widthCm,
            placement.heightCm,
            placement.rotation
          );
        }
        return;
      }

      // Ctrl+A — Select all
      if (ctrl && e.key === "a") {
        e.preventDefault();
        const designObjects = canvas
          .getObjects()
          .filter(
            (obj) =>
              !(obj as fabric.FabricObject & { _isBackground?: boolean })
                ._isBackground
          );
        if (designObjects.length > 0) {
          const sel = new fabric.ActiveSelection(designObjects, { canvas });
          canvas.setActiveObject(sel);
          canvas.renderAll();
        }
        return;
      }

      // Escape — Deselect
      if (e.key === "Escape") {
        canvas.discardActiveObject();
        canvas.renderAll();
        return;
      }

      // Delete / Backspace — Remove selected
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = canvas.getActiveObjects();
        activeObjects.forEach((obj) => {
          const pid = (
            obj as fabric.FabricObject & { _placementId?: string }
          )._placementId;
          if (pid) {
            removePlacement(pid);
          }
          canvas.remove(obj);
        });
        canvas.discardActiveObject();
        canvas.renderAll();
        return;
      }

      // Arrow keys — Nudge selected objects
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length === 0) return;
        e.preventDefault();

        const nudgePx = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === "ArrowLeft") dx = -nudgePx;
        if (e.key === "ArrowRight") dx = nudgePx;
        if (e.key === "ArrowUp") dy = -nudgePx;
        if (e.key === "ArrowDown") dy = nudgePx;

        // If there's an ActiveSelection, move the group
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          activeObj.set({
            left: (activeObj.left ?? 0) + dx,
            top: (activeObj.top ?? 0) + dy,
          });
          activeObj.setCoords();

          // Update all placements in the selection
          for (const obj of activeObjects) {
            const pid = (
              obj as fabric.FabricObject & { _placementId?: string }
            )._placementId;
            if (!pid) continue;
            const bound = obj.getBoundingRect();
            const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
            const height = (obj.height ?? 0) * (obj.scaleY ?? 1);
            updatePlacement(pid, {
              x: displayPxToCm(bound.left + dx),
              y: displayPxToCm(bound.top + dy),
              widthCm: displayPxToCm(width),
              heightCm: displayPxToCm(height),
            });
          }
          canvas.renderAll();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
      fabricRef.current = null;
      setCanvas(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCanvas, drawRollBackground, updatePlacement, removePlacement]);

  // Calculate minimum canvas height to fill the visible container
  const getMinCanvasHeight = useCallback(() => {
    if (containerHeight <= 0) return FALLBACK_MIN_HEIGHT;
    // py-4 = 32px padding around canvas; subtract it from available space
    return Math.max(containerHeight - 32, FALLBACK_MIN_HEIGHT);
  }, [containerHeight]);

  // Subscribe to overlappingIds — highlight only changed placements
  useEffect(() => {
    let prevIds = new Set<string>();
    const unsub = useCanvasStore.subscribe((state) => {
      const { overlappingIds } = state;
      if (overlappingIds === prevIds) return;

      const canvas = fabricRef.current;
      if (!canvas) return;

      // Find IDs that changed status (added or removed from overlap set)
      const added = new Set<string>();
      const removed = new Set<string>();
      for (const id of overlappingIds) {
        if (!prevIds.has(id)) added.add(id);
      }
      for (const id of prevIds) {
        if (!overlappingIds.has(id)) removed.add(id);
      }

      prevIds = overlappingIds;

      // Nothing changed visually
      if (added.size === 0 && removed.size === 0) return;

      // Only update objects whose status changed
      const changedIds = new Set([...added, ...removed]);
      for (const obj of canvas.getObjects()) {
        const pid = (obj as fabric.FabricObject & { _placementId?: string })._placementId;
        if (!pid || !changedIds.has(pid)) continue;

        if (added.has(pid)) {
          obj.set({ stroke: "#ef4444", strokeWidth: 2, borderColor: "#ef4444", cornerColor: "#ef4444" });
        } else {
          obj.set({ stroke: undefined, strokeWidth: 0, borderColor: "#3b82f6", cornerColor: "#3b82f6" });
        }
      }
      canvas.renderAll();
    });
    return unsub;
  }, []);

  // Subscribe to canvasBgColor and showGrid changes from store
  useEffect(() => {
    const unsub = useCanvasStore.subscribe((state, prev) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Background color changed
      if (state.canvasBgColor !== prev.canvasBgColor) {
        canvas.backgroundColor = state.canvasBgColor;
        canvas.renderAll();
      }

      // Grid visibility changed
      if (state.showGrid !== prev.showGrid) {
        const totalHeightCm = state.totalHeightCm;
        const minHeightCm = ROLL_CONFIG.MIN_HEIGHT_CM;
        const heightCm = Math.max(totalHeightCm + 10, minHeightCm);
        const heightPx = cmToDisplayPx(heightCm);
        const canvasHeight = Math.max(heightPx, getMinCanvasHeight());
        drawRollBackground(canvas, canvasHeight, state.showGrid);
      }
    });

    return unsub;
  }, [drawRollBackground, getMinCanvasHeight]);

  // Resize canvas and redraw background when height or container size change
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const { showGrid } = useCanvasStore.getState();
    const minHeightCm = ROLL_CONFIG.MIN_HEIGHT_CM;
    const heightCm = Math.max(totalHeightCm + 10, minHeightCm);
    const heightPx = cmToDisplayPx(heightCm);
    const canvasHeight = Math.max(heightPx, getMinCanvasHeight());

    canvas.setDimensions({
      width: DISPLAY_WIDTH,
      height: canvasHeight,
    });

    drawRollBackground(canvas, canvasHeight, showGrid);
  }, [totalHeightCm, containerHeight, drawRollBackground, getMinCanvasHeight]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-dtf-image")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      const imageId = e.dataTransfer.getData("application/x-dtf-image");
      if (!imageId) return;
      e.preventDefault();

      const canvas = fabricRef.current;
      if (!canvas) return;

      const { uploadedImages, gapCm } = useCanvasStore.getState();
      const image = uploadedImages.find((img) => img.id === imageId);
      if (!image) return;

      // Clamp to roll width
      let widthCm = image.widthCm;
      let heightCm = image.heightCm;
      if (widthCm > ROLL_CONFIG.PRINT_WIDTH_CM) {
        const scale = ROLL_CONFIG.PRINT_WIDTH_CM / widthCm;
        widthCm = ROLL_CONFIG.PRINT_WIDTH_CM;
        heightCm = heightCm * scale;
      }

      // Calculate drop position in canvas coordinates
      const canvasEl = canvas.getSelectionElement();
      const rect = canvasEl.getBoundingClientRect();
      const currentZoom = useCanvasStore.getState().zoom;

      // Mouse position relative to canvas element, accounting for zoom
      const mouseX = (e.clientX - rect.left) / currentZoom;
      const mouseY = (e.clientY - rect.top) / currentZoom;

      // Convert to cm and center the image on drop point
      let xCm = displayPxToCm(mouseX) - widthCm / 2;
      let yCm = displayPxToCm(mouseY) - heightCm / 2;

      // Clamp within bounds
      xCm = Math.max(0, Math.min(xCm, ROLL_CONFIG.PRINT_WIDTH_CM - widthCm));
      yCm = Math.max(0, yCm);

      const placementId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      addPlacement({
        id: placementId,
        imageId: image.id,
        x: Math.round(xCm * 100) / 100,
        y: Math.round(yCm * 100) / 100,
        widthCm,
        heightCm,
        rotation: 0,
      });

      const canvasUrl =
        image.originalUrl && !image.originalUrl.startsWith("blob:")
          ? image.originalUrl
          : image.thumbnailUrl;

      addImageToCanvas(
        canvas,
        canvasUrl,
        placementId,
        Math.round(xCm * 100) / 100,
        Math.round(yCm * 100) / 100,
        widthCm,
        heightCm,
        0
      );
    },
    [addPlacement]
  );

  const showSummary = placementCount > CANVAS_PLACEMENT_LIMIT;

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative">
      {showSummary ? (
        <PlacementSummary />
      ) : (
        <>
          {/* CM Ruler on left side */}
          {showRuler && (
            <div className="absolute left-0 top-0 w-8 h-full bg-muted/80 border-r z-10 overflow-hidden">
              <RulerMarks />
            </div>
          )}

          {/* Canvas container - scrollable */}
          <div className={`h-full overflow-auto ${showRuler ? "pl-8" : ""}`}>
            <div
              className="flex justify-center py-4"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <canvas ref={canvasElRef} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RulerMarks() {
  const totalHeightCm = useCanvasStore((s) => s.totalHeightCm);
  const canvas = useCanvasStore((s) => s.canvas);
  // Match ruler height to actual canvas height
  const canvasHeightCm = canvas
    ? displayPxToCm(canvas.getHeight())
    : Math.max(totalHeightCm + 10, ROLL_CONFIG.MIN_HEIGHT_CM);
  const markCount = Math.ceil(canvasHeightCm);

  const marks = [];
  for (let i = 0; i <= markCount; i++) {
    const yPos = cmToDisplayPx(i) + 16; // 16px = py-4 offset
    const isMajor = i % 5 === 0;
    marks.push(
      <div
        key={i}
        className="absolute left-0 w-full flex items-center"
        style={{ top: `${yPos}px` }}
      >
        <div
          className={`h-px ${isMajor ? "w-full bg-muted-foreground/50" : "w-1/2 bg-muted-foreground/30 ml-auto"}`}
        />
        {isMajor && (
          <span className="absolute left-1 text-[9px] text-muted-foreground -translate-y-1/2">
            {i}
          </span>
        )}
      </div>
    );
  }

  return <div className="relative">{marks}</div>;
}

/** Summary view shown when placement count exceeds CANVAS_PLACEMENT_LIMIT */
function PlacementSummary() {
  const placements = useCanvasStore((s) => s.placements);
  const uploadedImages = useCanvasStore((s) => s.uploadedImages);
  const totalHeightCm = useCanvasStore((s) => s.totalHeightCm);
  const priceBreakdown = useCanvasStore((s) => s.priceBreakdown);

  // Group placements by imageId and count (memoized for large sets)
  const groups = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of placements) {
      map.set(p.imageId, (map.get(p.imageId) || 0) + 1);
    }
    return map;
  }, [placements]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-lg mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 mb-3">
            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Yerlesim Ozeti</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {placements.length} adet tasarim yerlesti. Performans icin
            canvas onizlemesi devre disi — yerlestirme sonucu asagida.
          </p>
        </div>

        {/* Image list */}
        <div className="space-y-2 mb-6">
          {[...groups.entries()].map(([imageId, count]) => {
            const image = uploadedImages.find((img) => img.id === imageId);
            if (!image) return null;
            return (
              <div
                key={imageId}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0a0f16] p-3"
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
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {image.imageName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {image.widthCm} x {image.heightCm} cm
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-cyan-500/10 rounded-full px-3 py-1">
                  <span className="text-sm font-semibold text-cyan-400">{count}</span>
                  <span className="text-xs text-cyan-400/70">adet</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="rounded-lg border border-white/5 bg-[#0a0f16] p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Toplam Adet</p>
              <p className="text-lg font-semibold text-white">{placements.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Rulo Uzunlugu</p>
              <p className="text-lg font-semibold text-white">{totalHeightCm.toFixed(1)} cm</p>
            </div>
            {priceBreakdown && (
              <>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Birim Fiyat</p>
                  <p className="text-lg font-semibold text-white">
                    {priceBreakdown.pricePerMeter.toFixed(2)} TL/m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Toplam Fiyat</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {priceBreakdown.totalAmount.toFixed(2)} TL
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add an image to the canvas at a specific position (all params in cm)
export function addImageToCanvas(
  canvas: fabric.Canvas,
  imageUrl: string,
  placementId: string,
  xCm: number,
  yCm: number,
  widthCm: number,
  heightCm: number,
  rotation: number = 0
) {
  const displayWidth = cmToDisplayPx(widthCm);
  const displayHeight = cmToDisplayPx(heightCm);
  const displayLeft = cmToDisplayPx(xCm);
  const displayTop = cmToDisplayPx(yCm);

  fabric.FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" }).then((img) => {
    const scaleX = displayWidth / (img.width || 1);
    const scaleY = displayHeight / (img.height || 1);

    img.set({
      originX: "left",
      originY: "top",
      left: displayLeft,
      top: displayTop,
      scaleX,
      scaleY,
      angle: rotation,
      cornerColor: "#3b82f6",
      cornerStyle: "circle",
      cornerSize: 8,
      transparentCorners: false,
      borderColor: "#3b82f6",
      borderScaleFactor: 2,
      lockRotation: true,
    });

    delete img.controls.mtr;

    (
      img as fabric.FabricObject & { _placementId?: string }
    )._placementId = placementId;

    if (rotation === 90) {
      img.set({
        left: displayLeft + displayHeight,
        top: displayTop,
      });
    } else if (rotation === 270) {
      img.set({
        left: displayLeft,
        top: displayTop + displayWidth,
      });
    }

    img.setCoords();
    canvas.add(img);
    canvas.renderAll();
  });
}

/** Yield to the main thread so the browser can paint / handle events */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

interface BatchImageItem {
  imageUrl: string;
  placementId: string;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  rotation: number;
}

const BATCH_CHUNK_SIZE = 20;

/**
 * Add many images to canvas in chunks to avoid blocking the main thread.
 * - Disables renderOnAddRemove for the batch
 * - Loads each chunk in parallel (FabricImage.fromURL)
 * - Calls a single requestRenderAll per chunk
 * - Yields to main thread between chunks for UI responsiveness
 */
export async function addImagesToCanvas(
  canvas: fabric.Canvas,
  items: BatchImageItem[],
  onProgress?: (fraction: number) => void
): Promise<void> {
  if (items.length === 0) return;

  const prevRenderOnAddRemove = canvas.renderOnAddRemove;
  canvas.renderOnAddRemove = false;

  let loaded = 0;

  for (let i = 0; i < items.length; i += BATCH_CHUNK_SIZE) {
    const chunk = items.slice(i, i + BATCH_CHUNK_SIZE);

    // Load all images in this chunk in parallel
    const images = await Promise.all(
      chunk.map(async (item) => {
        try {
          const img = await fabric.FabricImage.fromURL(item.imageUrl, {
            crossOrigin: "anonymous",
          });
          return { img, item };
        } catch {
          return null;
        }
      })
    );

    // Add loaded images to canvas
    for (const result of images) {
      if (!result) continue;
      const { img, item } = result;

      const displayWidth = cmToDisplayPx(item.widthCm);
      const displayHeight = cmToDisplayPx(item.heightCm);
      const displayLeft = cmToDisplayPx(item.xCm);
      const displayTop = cmToDisplayPx(item.yCm);
      const scaleX = displayWidth / (img.width || 1);
      const scaleY = displayHeight / (img.height || 1);

      img.set({
        originX: "left",
        originY: "top",
        left: displayLeft,
        top: displayTop,
        scaleX,
        scaleY,
        angle: item.rotation,
        cornerColor: "#3b82f6",
        cornerStyle: "circle",
        cornerSize: 8,
        transparentCorners: false,
        borderColor: "#3b82f6",
        borderScaleFactor: 2,
        lockRotation: true,
      });

      delete img.controls.mtr;

      (img as fabric.FabricObject & { _placementId?: string })._placementId =
        item.placementId;

      if (item.rotation === 90) {
        img.set({
          left: displayLeft + displayHeight,
          top: displayTop,
        });
      } else if (item.rotation === 270) {
        img.set({
          left: displayLeft,
          top: displayTop + displayWidth,
        });
      }

      img.setCoords();
      canvas.add(img);
    }

    // Single render for the entire chunk
    canvas.requestRenderAll();

    loaded += chunk.length;
    onProgress?.(loaded / items.length);

    // Yield to main thread between chunks so UI stays responsive
    if (i + BATCH_CHUNK_SIZE < items.length) {
      await yieldToMain();
    }
  }

  canvas.renderOnAddRemove = prevRenderOnAddRemove;
}

// Clear all design objects from canvas (keep background)
export function clearCanvasDesigns(canvas: fabric.Canvas) {
  const designObjects = canvas
    .getObjects()
    .filter(
      (obj) =>
        !(obj as fabric.FabricObject & { _isBackground?: boolean })
          ._isBackground
    );
  designObjects.forEach((obj) => canvas.remove(obj));
  canvas.discardActiveObject();
  canvas.renderAll();
}
