/**
 * Self-contained skyline bin-packing algorithm for Web Worker.
 * Mirror of src/services/packing.service.ts — keep in sync.
 */

const EPS = 0.001;

function findBestPosition(skyline, rectW, rollWidth) {
  let bestY = Infinity;
  let bestX = Infinity;

  for (let i = 0; i < skyline.length; i++) {
    const startX = skyline[i].x;
    if (startX + rectW > rollWidth + EPS) continue;

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

function updateSkyline(skyline, x, newY, width) {
  const right = x + width;
  const result = [];

  for (const seg of skyline) {
    const segRight = seg.x + seg.width;

    if (segRight <= x + EPS || seg.x >= right - EPS) {
      result.push({ x: seg.x, y: seg.y, width: seg.width });
      continue;
    }

    if (seg.x < x - EPS) {
      result.push({ x: seg.x, y: seg.y, width: x - seg.x });
    }

    const oLeft = Math.max(seg.x, x);
    const oRight = Math.min(segRight, right);
    if (oRight - oLeft > EPS) {
      result.push({
        x: oLeft,
        y: Math.max(seg.y, newY),
        width: oRight - oLeft,
      });
    }

    if (segRight > right + EPS) {
      result.push({ x: right, y: seg.y, width: segRight - right });
    }
  }

  result.sort((a, b) => a.x - b.x);
  return result;
}

function mergeSkyline(skyline) {
  if (skyline.length === 0) return skyline;
  const merged = [{ x: skyline[0].x, y: skyline[0].y, width: skyline[0].width }];
  for (let i = 1; i < skyline.length; i++) {
    const last = merged[merged.length - 1];
    if (
      Math.abs(last.y - skyline[i].y) < EPS &&
      Math.abs(last.x + last.width - skyline[i].x) < EPS
    ) {
      last.width += skyline[i].width;
    } else {
      merged.push({ x: skyline[i].x, y: skyline[i].y, width: skyline[i].width });
    }
  }
  return merged;
}

function skylinePack(rects, rollWidthCm, gapCm) {
  let skyline = [{ x: 0, y: 0, width: rollWidthCm }];
  const placements = [];
  let totalUsedArea = 0;

  for (const rect of rects) {
    const orientations = [];
    if (rect.widthCm <= rollWidthCm) {
      orientations.push({ effW: rect.widthCm, effH: rect.heightCm, rotation: 0 });
    }
    if (
      rect.heightCm <= rollWidthCm &&
      Math.abs(rect.widthCm - rect.heightCm) > EPS
    ) {
      orientations.push({ effW: rect.heightCm, effH: rect.widthCm, rotation: 90 });
    }

    let bestPos = null;
    let bestScore = Infinity;

    for (const ori of orientations) {
      const pos = findBestPosition(skyline, ori.effW, rollWidthCm);
      if (!pos) continue;

      const score = pos.y + ori.effH;
      if (
        score < bestScore - EPS ||
        (Math.abs(score - bestScore) < EPS &&
          pos.y < (bestPos ? bestPos.y : Infinity) - EPS)
      ) {
        bestScore = score;
        bestPos = { x: pos.x, y: pos.y, effW: ori.effW, effH: ori.effH, rotation: ori.rotation };
      }
    }

    if (!bestPos) continue;

    placements.push({
      id: rect.id + "-" + rect.instanceIndex,
      imageId: rect.id,
      x: Math.round(bestPos.x * 100) / 100,
      y: Math.round(bestPos.y * 100) / 100,
      widthCm: rect.widthCm,
      heightCm: rect.heightCm,
      rotation: bestPos.rotation,
    });

    totalUsedArea += rect.widthCm * rect.heightCm;

    const newY = bestPos.y + bestPos.effH + gapCm;
    const newW = Math.min(bestPos.effW + gapCm, rollWidthCm - bestPos.x);
    skyline = updateSkyline(skyline, bestPos.x, newY, newW);
    skyline = mergeSkyline(skyline);
  }

  let totalHeightCm = 0;
  for (const p of placements) {
    const effH = p.rotation === 90 || p.rotation === 270 ? p.widthCm : p.heightCm;
    totalHeightCm = Math.max(totalHeightCm, p.y + effH);
  }

  const totalArea = rollWidthCm * totalHeightCm;
  const wastePercent =
    totalArea > 0 ? ((totalArea - totalUsedArea) / totalArea) * 100 : 0;

  return {
    placements: placements,
    totalHeightCm: Math.round(totalHeightCm * 100) / 100,
    totalMeters: Math.round((totalHeightCm / 100) * 10000) / 10000,
    wastePercent: Math.round(wastePercent * 10) / 10,
  };
}

function autoPack(designs, rollWidthCm, gapCm) {
  const rects = [];
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

  var sorts = [
    function (a, b) {
      return (
        (Math.max(b.widthCm, b.heightCm) - Math.max(a.widthCm, a.heightCm)) ||
        (b.widthCm * b.heightCm - a.widthCm * a.heightCm)
      );
    },
    function (a, b) {
      return b.widthCm * b.heightCm - a.widthCm * a.heightCm;
    },
    function (a, b) {
      return (b.heightCm - a.heightCm) || (b.widthCm - a.widthCm);
    },
    function (a, b) {
      return (b.widthCm - a.widthCm) || (b.heightCm - a.heightCm);
    },
  ];

  let best = null;
  for (const sortFn of sorts) {
    const sorted = rects.slice().sort(sortFn);
    const result = skylinePack(sorted, rollWidthCm, gapCm);
    if (!best || result.totalHeightCm < best.totalHeightCm) {
      best = result;
    }
  }

  return best;
}

// ─── Worker message handler ─────────────────────────────────────

self.onmessage = function (e) {
  var data = e.data;
  var result = autoPack(data.designs, data.rollWidthCm, data.gapCm);
  self.postMessage(result);
};
