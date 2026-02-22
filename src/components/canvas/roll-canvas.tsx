"use client";

import { useEffect, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { useCanvasStore } from "@/stores/canvas-store";
import { ROLL_CONFIG } from "@/lib/constants";

// Display dimensions
const DISPLAY_WIDTH = 800;
const DISPLAY_PX_PER_CM = DISPLAY_WIDTH / ROLL_CONFIG.PRINT_WIDTH_CM; // ~14.04 px/cm
const MIN_CANVAS_HEIGHT = 600;

/** Convert cm to display pixels */
export function cmToDisplayPx(cm: number): number {
  return cm * DISPLAY_PX_PER_CM;
}

/** Convert display pixels to cm */
export function displayPxToCm(px: number): number {
  return px / DISPLAY_PX_PER_CM;
}

export function RollCanvas() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const { setCanvas, placements, updatePlacement, removePlacement } =
    useCanvasStore();

  const showRuler = useCanvasStore((s) => s.showRuler);
  const zoom = useCanvasStore((s) => s.zoom);

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

  // Initialize canvas
  useEffect(() => {
    if (!canvasElRef.current || fabricRef.current) return;

    const { canvasBgColor, showGrid } = useCanvasStore.getState();

    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: DISPLAY_WIDTH,
      height: MIN_CANVAS_HEIGHT,
      backgroundColor: canvasBgColor,
      selection: true,
    });

    fabricRef.current = canvas;
    setCanvas(canvas);

    // Draw initial background
    drawRollBackground(canvas, MIN_CANVAS_HEIGHT, showGrid);

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

    // Handle delete key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = canvas.getActiveObjects();
        activeObjects.forEach((obj) => {
          const placementId = (
            obj as fabric.FabricObject & { _placementId?: string }
          )._placementId;
          if (placementId) {
            removePlacement(placementId);
          }
          canvas.remove(obj);
        });
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
      fabricRef.current = null;
      setCanvas(null);
    };
  }, [setCanvas, drawRollBackground, updatePlacement, removePlacement]);

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
        const canvasHeight = Math.max(heightPx, MIN_CANVAS_HEIGHT);
        drawRollBackground(canvas, canvasHeight, state.showGrid);
      }
    });

    return unsub;
  }, [drawRollBackground]);

  // Resize canvas and redraw background when placements change
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const { totalHeightCm, showGrid } = useCanvasStore.getState();
    const minHeightCm = ROLL_CONFIG.MIN_HEIGHT_CM;
    const heightCm = Math.max(totalHeightCm + 10, minHeightCm);
    const heightPx = cmToDisplayPx(heightCm);
    const canvasHeight = Math.max(heightPx, MIN_CANVAS_HEIGHT);

    canvas.setDimensions({
      width: DISPLAY_WIDTH,
      height: canvasHeight,
    });

    drawRollBackground(canvas, canvasHeight, showGrid);
  }, [placements, drawRollBackground]);

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative">
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
        >
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
}

function RulerMarks() {
  const totalHeightCm = useCanvasStore((s) => s.totalHeightCm);
  const markCount = Math.max(
    Math.ceil(totalHeightCm) + 10,
    ROLL_CONFIG.MIN_HEIGHT_CM
  );

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
