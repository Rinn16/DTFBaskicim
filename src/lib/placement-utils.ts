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
