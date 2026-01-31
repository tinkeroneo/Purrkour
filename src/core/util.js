export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);

export function aabb(A, B) {
  return A.x < (B.x + B.w) && (A.x + A.w) > B.x && A.y < (B.y + B.h) && (A.y + A.h) > B.y;
}

export function makeCanvas(canvasEl, ctx) {
  const api = {
    W: 360,
    H: 640,
    DPR: 1,
    resize() {
      api.DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      api.W = Math.floor(window.innerWidth);
      api.H = Math.floor(window.innerHeight);
      canvasEl.style.width = api.W + "px";
      canvasEl.style.height = api.H + "px";
      canvasEl.width = Math.floor(api.W * api.DPR);
      canvasEl.height = Math.floor(api.H * api.DPR);
      ctx.setTransform(api.DPR, 0, 0, api.DPR, 0, 0);
    }
  };
  return api;
}

export function roundRect(ctx, x, y, w, h, r) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return;
  if (w <= 0 || h <= 0) return;
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (rr === 0) { ctx.rect(x, y, w, h); return; }
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function tri(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}
