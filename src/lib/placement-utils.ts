/**
 * Returns effective (visual) dimensions after rotation.
 * widthCm/heightCm always store the original (pre-rotation) size.
 * When rotated 90° or 270°, width and height are swapped.
 */
export function getEffectiveDimensions(p: {
  widthCm: number;
  heightCm: number;
  rotation: number;
}) {
  if (p.rotation === 90 || p.rotation === 270) {
    return { width: p.heightCm, height: p.widthCm };
  }
  return { width: p.widthCm, height: p.heightCm };
}

/**
 * Finds all placements that overlap with another placement.
 * Uses rotation-aware AABB (axis-aligned bounding box) collision.
 * Returns Set of placement IDs that are involved in any overlap.
 */
export function findOverlappingPlacements(
  placements: { id: string; x: number; y: number; widthCm: number; heightCm: number; rotation: number }[]
): Set<string> {
  const overlapping = new Set<string>();

  for (let i = 0; i < placements.length; i++) {
    const a = placements[i];
    const aDim = getEffectiveDimensions(a);
    const aLeft = a.x;
    const aTop = a.y;
    const aRight = a.x + aDim.width;
    const aBottom = a.y + aDim.height;

    for (let j = i + 1; j < placements.length; j++) {
      const b = placements[j];
      const bDim = getEffectiveDimensions(b);
      const bLeft = b.x;
      const bTop = b.y;
      const bRight = b.x + bDim.width;
      const bBottom = b.y + bDim.height;

      // AABB overlap check
      if (!(aRight <= bLeft || aLeft >= bRight || aBottom <= bTop || aTop >= bBottom)) {
        overlapping.add(a.id);
        overlapping.add(b.id);
      }
    }
  }

  return overlapping;
}
