import { clamp } from "../core/util.js";

export const PLATFORM_LAYOUT = Object.freeze({
  height: 56,
  minWidth: 84,
  widthRange: 25,
  minEdgeGap: 48,
  edgeGapRange: 25,
  minHeightStep: 36,
  heightStepRange: 17,
});

function buildLifts(count, random, forceGround) {
  if (forceGround) return Array(count).fill(0);
  if (count === 1) {
    return [random() < 0.72 ? 0 : 68 + Math.floor(random() * 50)];
  }

  const step = PLATFORM_LAYOUT.minHeightStep + Math.floor(random() * PLATFORM_LAYOUT.heightStepRange);
  const shape = random();
  if (shape < 0.46) return Array.from({ length: count }, (_, index) => index * step);
  if (shape < 0.76) {
    return Array.from({ length: count }, (_, index) => {
      if (index === 0) return 0;
      if (index === count - 1 && count > 2) return Math.max(14, Math.round(step * 0.38));
      return step;
    });
  }
  return Array.from({ length: count }, (_, index) => (count - index - 1) * step);
}

export function createPlatformRun({ spawnX, count, surfaceAt, random = Math.random, forceGround = false }) {
  const platformCount = clamp(Math.floor(Number(count) || 1), 1, 3);
  const lifts = buildLifts(platformCount, random, forceGround);
  const platforms = [];
  let x = spawnX;

  for (let index = 0; index < platformCount; index++) {
    const w = PLATFORM_LAYOUT.minWidth + Math.floor(random() * PLATFORM_LAYOUT.widthRange);
    const h = PLATFORM_LAYOUT.height;
    const lift = lifts[index];
    const yMode = lift === 0 ? "ground" : "fixed";
    platforms.push({
      kind: "platform",
      type: "fence",
      x,
      y: surfaceAt(x) - h - lift,
      w,
      h,
      yMode,
      yOffset: -h,
      platformRunIndex: index,
      platformRunCount: platformCount,
    });
    if (index < platformCount - 1) {
      x += w + PLATFORM_LAYOUT.minEdgeGap + Math.floor(random() * PLATFORM_LAYOUT.edgeGapRange);
    }
  }

  const last = platforms.at(-1);
  return {
    platforms,
    span: last.x + last.w - spawnX,
  };
}

export function nextPlatformPackDistance(baseGap, runSpan = 0, jitter = 0) {
  const tailClearance = clamp(baseGap * 0.55, 110, 190);
  return Math.round(Math.max(baseGap, runSpan + tailClearance) + Math.max(0, jitter));
}
