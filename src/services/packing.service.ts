import type { DesignInput, Placement } from "@/types/canvas";
import { ROLL_CONFIG } from "@/lib/constants";

export interface PackResult {
  placements: Placement[];
  totalHeightCm: number;
  totalMeters: number;
  wastePercent: number;
}

interface Rect {
  id: string;
  widthCm: number;
  heightCm: number;
  instanceIndex: number;
}

interface SkylineNode {
  x: number;
  y: number;
  width: number;
}

const EPS = 0.001;

/**
 * Skyline Bottom-Left packing with rotation optimization.
 * Tries multiple sort strategies and returns the best result.
 *
 * Key advantages over shelf (NFDH) packing:
 * - Tracks the "skyline" profile instead of fixed-height shelves
 * - Fills gaps above shorter items with subsequent items
 * - Rotation-aware: tries 0° and 90° per item, picks best fit
 * - Multi-strategy: runs 4 sort orders, returns lowest total height
 */
export function autoPack(
  designs: DesignInput[],
  rollWidthCm: number = ROLL_CONFIG.PRINT_WIDTH_CM,
  gapCm: number = ROLL_CONFIG.GAP_CM
): PackResult {
  const rects: Rect[] = [];
  for (const design of designs) {
    const minDim = Math.min(design.widthCm, design.heightCm);
    if (minDim > rollWidthCm) continue;
    for (let i = 0; i < design.quantity; i++) {
      rects.push({
        id: design.id,
        widthCm: design.widthCm,
        heightCm: design.heightCm,
        instanceIndex: i,
      });
    }
  }

  if (rects.length === 0) {
    return { placements: [], totalHeightCm: 0, totalMeters: 0, wastePercent: 0 };
  }

  // Try multiple sort orders; keep the result with least total height
  const sorts: ((a: Rect, b: Rect) => number)[] = [
    (a, b) =>
      Math.max(b.widthCm, b.heightCm) - Math.max(a.widthCm, a.heightCm) ||
      b.widthCm * b.heightCm - a.widthCm * a.heightCm,
    (a, b) => b.widthCm * b.heightCm - a.widthCm * a.heightCm,
    (a, b) => b.heightCm - a.heightCm || b.widthCm - a.widthCm,
    (a, b) => b.widthCm - a.widthCm || b.heightCm - a.heightCm,
  ];

  let best: PackResult | null = null;
  for (const sortFn of sorts) {
    const sorted = [...rects].sort(sortFn);
    const result = skylinePack(sorted, rollWidthCm, gapCm);
    if (!best || result.totalHeightCm < best.totalHeightCm) {
      best = result;
    }
  }

  return best!;
}

// ─── Skyline core ────────────────────────────────────────────────

function skylinePack(
  rects: Rect[],
  rollWidthCm: number,
  gapCm: number
): PackResult {
  let skyline: SkylineNode[] = [{ x: 0, y: 0, width: rollWidthCm }];
  const placements: Placement[] = [];
  let totalUsedArea = 0;

  for (const rect of rects) {
    // Build valid orientations
    const orientations: { effW: number; effH: number; rotation: number }[] = [];
    if (rect.widthCm <= rollWidthCm) {
      orientations.push({ effW: rect.widthCm, effH: rect.heightCm, rotation: 0 });
    }
    if (
      rect.heightCm <= rollWidthCm &&
      Math.abs(rect.widthCm - rect.heightCm) > EPS
    ) {
      orientations.push({ effW: rect.heightCm, effH: rect.widthCm, rotation: 90 });
    }

    // For each orientation find the best skyline position; keep the overall best
    let bestPos: {
      x: number;
      y: number;
      effW: number;
      effH: number;
      rotation: number;
    } | null = null;
    let bestScore = Infinity;

    for (const { effW, effH, rotation } of orientations) {
      const pos = findBestPosition(skyline, effW, rollWidthCm);
      if (!pos) continue;

      // Primary: minimise resulting top edge (y + effH)
      // Secondary: prefer lower y (deeper gap fill)
      const score = pos.y + effH;
      if (
        score < bestScore - EPS ||
        (Math.abs(score - bestScore) < EPS &&
          pos.y < (bestPos?.y ?? Infinity) - EPS)
      ) {
        bestScore = score;
        bestPos = { x: pos.x, y: pos.y, effW, effH, rotation };
      }
    }

    if (!bestPos) continue;

    placements.push({
      id: `${rect.id}-${rect.instanceIndex}`,
      imageId: rect.id,
      x: Math.round(bestPos.x * 100) / 100,
      y: Math.round(bestPos.y * 100) / 100,
      widthCm: rect.widthCm,
      heightCm: rect.heightCm,
      rotation: bestPos.rotation,
    });

    totalUsedArea += rect.widthCm * rect.heightCm;

    // Raise skyline: item area + gap reserves space for next items
    const newY = bestPos.y + bestPos.effH + gapCm;
    const newW = Math.min(bestPos.effW + gapCm, rollWidthCm - bestPos.x);
    skyline = updateSkyline(skyline, bestPos.x, newY, newW);
    skyline = mergeSkyline(skyline);
  }

  // Total height from actual item extents (no trailing gap)
  let totalHeightCm = 0;
  for (const p of placements) {
    const effH = p.rotation === 90 || p.rotation === 270 ? p.widthCm : p.heightCm;
    totalHeightCm = Math.max(totalHeightCm, p.y + effH);
  }

  const totalArea = rollWidthCm * totalHeightCm;
  const wastePercent =
    totalArea > 0 ? ((totalArea - totalUsedArea) / totalArea) * 100 : 0;

  return {
    placements,
    totalHeightCm: Math.round(totalHeightCm * 100) / 100,
    totalMeters: Math.round((totalHeightCm / 100) * 10000) / 10000,
    wastePercent: Math.round(wastePercent * 10) / 10,
  };
}

// ─── Skyline helpers ─────────────────────────────────────────────

/**
 * Find the lowest available position on the skyline where a rect of
 * width `rectW` fits within `rollWidth`. (Bottom-Left heuristic)
 */
function findBestPosition(
  skyline: SkylineNode[],
  rectW: number,
  rollWidth: number
): { x: number; y: number } | null {
  let bestY = Infinity;
  let bestX = Infinity;

  for (let i = 0; i < skyline.length; i++) {
    const startX = skyline[i].x;
    if (startX + rectW > rollWidth + EPS) continue;

    // Max Y across all segments the rect overlaps
    let maxY = 0;
    let covered = 0;

    for (let j = i; j < skyline.length && covered < rectW - EPS; j++) {
      maxY = Math.max(maxY, skyline[j].y);
      const segEnd = skyline[j].x + skyline[j].width;
      const overlap =
        Math.min(startX + rectW, segEnd) - Math.max(startX, skyline[j].x);
      covered += Math.max(0, overlap);
    }

    if (covered < rectW - EPS) continue;

    if (
      maxY < bestY - EPS ||
      (Math.abs(maxY - bestY) < EPS && startX < bestX)
    ) {
      bestY = maxY;
      bestX = startX;
    }
  }

  if (bestY === Infinity) return null;
  return { x: bestX, y: bestY };
}

/**
 * Raise the skyline in region [x, x+width] to height newY.
 * Never lowers the skyline — uses max(existing, newY).
 */
function updateSkyline(
  skyline: SkylineNode[],
  x: number,
  newY: number,
  width: number
): SkylineNode[] {
  const right = x + width;
  const result: SkylineNode[] = [];

  for (const seg of skyline) {
    const segRight = seg.x + seg.width;

    // No overlap — keep as-is
    if (segRight <= x + EPS || seg.x >= right - EPS) {
      result.push({ ...seg });
      continue;
    }

    // Left remainder (before new region)
    if (seg.x < x - EPS) {
      result.push({ x: seg.x, y: seg.y, width: x - seg.x });
    }

    // Overlapping part — raise to max
    const oLeft = Math.max(seg.x, x);
    const oRight = Math.min(segRight, right);
    if (oRight - oLeft > EPS) {
      result.push({ x: oLeft, y: Math.max(seg.y, newY), width: oRight - oLeft });
    }

    // Right remainder (after new region)
    if (segRight > right + EPS) {
      result.push({ x: right, y: seg.y, width: segRight - right });
    }
  }

  result.sort((a, b) => a.x - b.x);
  return result;
}

/** Merge adjacent skyline segments that share the same y. */
function mergeSkyline(skyline: SkylineNode[]): SkylineNode[] {
  if (skyline.length === 0) return skyline;
  const merged: SkylineNode[] = [{ ...skyline[0] }];
  for (let i = 1; i < skyline.length; i++) {
    const last = merged[merged.length - 1];
    if (
      Math.abs(last.y - skyline[i].y) < EPS &&
      Math.abs(last.x + last.width - skyline[i].x) < EPS
    ) {
      last.width += skyline[i].width;
    } else {
      merged.push({ ...skyline[i] });
    }
  }
  return merged;
}

// ─── Async Web Worker wrapper ────────────────────────────────────

/**
 * Run autoPack in a Web Worker so the main thread stays responsive.
 * Falls back to sync autoPack if the Worker fails to start.
 */
export async function autoPackAsync(
  designs: DesignInput[],
  rollWidthCm?: number,
  gapCm?: number
): Promise<PackResult> {
  try {
    return await new Promise<PackResult>((resolve, reject) => {
      const worker = new Worker(
        new URL("../workers/packing.worker.ts", import.meta.url)
      );
      worker.onmessage = (e: MessageEvent<PackResult>) => {
        resolve(e.data);
        worker.terminate();
      };
      worker.onerror = (err) => {
        reject(err);
        worker.terminate();
      };
      worker.postMessage({ designs, rollWidthCm, gapCm });
    });
  } catch {
    // Fallback to sync if Worker is unavailable (SSR, old browser, etc.)
    return autoPack(designs, rollWidthCm, gapCm);
  }
}
