const VEHICLE_EXTENTS = Object.freeze({
  balloon: Object.freeze({ left: 34, right: 34, top: 122, bottom: 8 }),
  raft: Object.freeze({ left: 46, right: 46, top: 64, bottom: 8 }),
  zeppelin: Object.freeze({ left: 78, right: 92, top: 104, bottom: 0 }),
  rocket: Object.freeze({ left: 34, right: 34, top: 36, bottom: 60 }),
});

export function getPresentationCardLayout(width, height, kind, vehicleX = width * 0.5) {
  const compact = kind !== "chapter";
  const travel = kind === "travel";
  const narrow = width <= 560;
  const w = travel
    ? Math.min(narrow ? 210 : 300, width - 32)
    : Math.min(compact ? 540 : 620, width - (narrow ? 28 : 64));
  const h = travel ? 68 : (compact ? (narrow ? 104 : 112) : (narrow ? 126 : 142));
  const x = travel
    ? (vehicleX < width * 0.52 ? width - w - 16 : 16)
    : (width - w) / 2;
  const y = travel
    ? (height <= 520
      ? height - h - 24
      : Math.min(height - h - 120, Math.max(330, height * 0.46)))
    : compact
      ? Math.max(narrow ? 252 : 154, height * 0.27)
      : Math.max(narrow ? 252 : 176, height * 0.34);

  return { x, y, w, h, compact, travel, narrow };
}

export function getVehicleBounds(setpiece) {
  const type = setpiece?.type || "balloon";
  const extents = VEHICLE_EXTENTS[type] || VEHICLE_EXTENTS.balloon;
  const scale = setpiece?.vehicleScale ?? 1;
  const x = setpiece?.vehicle?.x ?? 0;
  const y = setpiece?.vehicle?.y ?? 0;
  return {
    x: x - extents.left * scale,
    y: y - extents.top * scale,
    w: (extents.left + extents.right) * scale,
    h: (extents.top + extents.bottom) * scale,
  };
}

export function rectanglesOverlap(a, b, padding = 0) {
  if (!a || !b) return false;
  return a.x < b.x + b.w + padding
    && a.x + a.w + padding > b.x
    && a.y < b.y + b.h + padding
    && a.y + a.h + padding > b.y;
}

export function rectangleInsideViewport(rect, width, height, tolerance = 2) {
  if (!rect) return false;
  return rect.x >= -tolerance
    && rect.y >= -tolerance
    && rect.x + rect.w <= width + tolerance
    && rect.y + rect.h <= height + tolerance;
}
