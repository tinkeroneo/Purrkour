import { roundRect, tri, clamp } from "../core/util.js";

export function createMonkey(x, y, opts = {}) {
  const m = {
    kind: "obstacle",
    type: "monkey",
    x, y,
    w: opts.w ?? 54,
    h: opts.h ?? 54,
    t: 0,
    mood: "idle",
    solid: !!opts.solid, // if you ever want it solid
  };

  m.update = function update(game, terrain, eff) {
    m.t++;
    // tiny idle bob (no real physics)
    const ground = terrain.surfaceAt(m.x);
    m.y = ground - m.h + Math.sin(m.t * 0.08) * 1.2;
  };

  m.hitbox = function hitbox() {
    // forgiving hitbox
    return { x: m.x + 6, y: m.y + 8, w: m.w - 12, h: m.h - 12 };
  };

  m.draw = function draw(ctx) {
    const w = m.w, h = m.h;
    const bob = Math.sin(m.t * 0.08) * 1.2;

    ctx.save();
    ctx.translate(m.x + w * 0.5, m.y + h * 0.5 + bob);
    ctx.translate(-w * 0.5, -h * 0.5);

    // colors
    const fur = "#6b4a2b";
    const furDark = "#4b311d";
    const face = "#d4b38a";

    // tail
    ctx.strokeStyle = furDark;
    ctx.lineWidth = Math.max(2, w * 0.06);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.75, h * 0.65);
    ctx.quadraticCurveTo(w * 0.95, h * 0.55, w * 0.82, h * 0.35);
    ctx.stroke();

    // body
    ctx.fillStyle = fur;
    roundRect(ctx, w * 0.22, h * 0.28, w * 0.56, h * 0.55, w * 0.22);
    ctx.fill();

    // head
    roundRect(ctx, w * 0.32, h * 0.10, w * 0.46, h * 0.36, w * 0.18);
    ctx.fill();

    // face patch
    ctx.fillStyle = face;
    roundRect(ctx, w * 0.42, h * 0.20, w * 0.28, h * 0.20, w * 0.10);
    ctx.fill();

    // ears
    ctx.fillStyle = furDark;
    roundRect(ctx, w * 0.26, h * 0.18, w * 0.10, h * 0.12, w * 0.06); ctx.fill();
    roundRect(ctx, w * 0.74, h * 0.18, w * 0.10, h * 0.12, w * 0.06); ctx.fill();

    // eyes
    ctx.fillStyle = "#111";
    roundRect(ctx, w * 0.48, h * 0.26, w * 0.04, h * 0.05, w * 0.02); ctx.fill();
    roundRect(ctx, w * 0.62, h * 0.26, w * 0.04, h * 0.05, w * 0.02); ctx.fill();

    // grin
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.56, h * 0.33, w * 0.08, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  };

  return m;
}
