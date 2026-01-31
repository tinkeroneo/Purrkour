import { clamp, lerp, smoothstep } from "../core/util.js";

export function createTerrain(getW, getH) {
  const TERRAIN = {
    stepX: 170,
    maxDelta: 44,
    minY: 0,
    maxY: 0,
  };

  const terrainPts = []; // {x,y}
  let BASE_SURFACE_Y = 0;

  function syncBounds() {
    const H = getH();
    TERRAIN.minY = H - 190;
    TERRAIN.maxY = H - 46;
    BASE_SURFACE_Y = H - 80;
  }

  function init() {
    syncBounds();
    terrainPts.length = 0;

    let x = -TERRAIN.stepX;
    let y = BASE_SURFACE_Y;

    for (let i = 0; i < 10; i++) {
      terrainPts.push({ x, y });
      x += TERRAIN.stepX;
      const dy = (Math.random() * 2 - 1) * TERRAIN.maxDelta * 0.30;
      y = clamp(y + dy, TERRAIN.minY, TERRAIN.maxY);
    }
    while (terrainPts[terrainPts.length - 1].x < getW() + TERRAIN.stepX) addPoint();
  }

  function addPoint() {
    const last = terrainPts[terrainPts.length - 1];
    const prev = terrainPts[terrainPts.length - 2] || last;
    const slope = last.y - prev.y;

    const noise = (Math.random() * 2 - 1) * TERRAIN.maxDelta;
    const desired =
      last.y + clamp(-slope * 0.35 + noise * 0.30, -TERRAIN.maxDelta, TERRAIN.maxDelta);

    const y = clamp(desired, TERRAIN.minY, TERRAIN.maxY);
    terrainPts.push({ x: last.x + TERRAIN.stepX, y });
  }

  function update(dx) {
    for (const p of terrainPts) p.x -= dx;
    while (terrainPts.length > 2 && terrainPts[1].x < -TERRAIN.stepX) terrainPts.shift();
    while (terrainPts[terrainPts.length - 1].x < getW() + TERRAIN.stepX) addPoint();
  }

  function surfaceAt(x) {
    for (let i = 0; i < terrainPts.length - 1; i++) {
      const a = terrainPts[i], b = terrainPts[i + 1];
      if (x >= a.x && x <= b.x) {
        const u = (x - a.x) / (b.x - a.x);
        return lerp(a.y, b.y, smoothstep(u));
      }
    }
    return terrainPts[terrainPts.length - 1]?.y ?? BASE_SURFACE_Y;
  }

  function drawGround(ctx, palette) {
    const W = getW(), H = getH();
    ctx.fillStyle = `rgba(${palette.ground[0]},${palette.ground[1]},${palette.ground[2]},0.45)`;
    ctx.beginPath();
    ctx.moveTo(0, surfaceAt(0));
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, surfaceAt(x));
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // --- grass highlights (subtle, static) ---
    // NOTE: intentionally static (no tick dependency) so it can't break rendering
    // if you later refactor game-state boundaries.
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let x = 0; x < W; x += 18) {
      const y = surfaceAt(x) + Math.sin(x * 0.08) * 3;
      ctx.fillRect(x, y + 2, 10, 1);
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, surfaceAt(0));
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, surfaceAt(x));
    ctx.stroke();
  }

  return { init, update, surfaceAt, drawGround };
}
