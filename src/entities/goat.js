import { roundRect, tri } from "../core/util.js";

export function createGoat(x, y, opts = {}) {
  const g = {
    kind: "setpiece", // or "obstacle" if it can hurt
    type: "goat",
    x, y,
    w: opts.w ?? 58,
    h: opts.h ?? 48,
    t: 0,
  };

  g.update = function update(game, terrain, eff) {
    g.t++;
    const ground = terrain.surfaceAt(g.x);
    g.y = ground - g.h;
  };

  g.hitbox = function hitbox() {
    // usually not needed if setpiece; if obstacle, use this
    return { x: g.x + 6, y: g.y + 6, w: g.w - 12, h: g.h - 10 };
  };

  g.draw = function draw(ctx) {
    const w = g.w, h = g.h;
    ctx.save();
    ctx.translate(g.x, g.y);

    const fur = "#cfcfcf";
    const furDark = "#9b9b9b";
    const horn = "#6a5a3a";

    // body
    ctx.fillStyle = fur;
    roundRect(ctx, w * 0.10, h * 0.35, w * 0.75, h * 0.50, w * 0.18);
    ctx.fill();

    // head
    roundRect(ctx, w * 0.60, h * 0.20, w * 0.32, h * 0.30, w * 0.12);
    ctx.fill();

    // horns
    ctx.fillStyle = horn;
    tri(ctx, w * 0.66, h * 0.18, w * 0.62, h * 0.02, w * 0.72, h * 0.14);
    tri(ctx, w * 0.84, h * 0.18, w * 0.88, h * 0.02, w * 0.78, h * 0.14);

    // legs
    ctx.fillStyle = furDark;
    roundRect(ctx, w * 0.18, h * 0.76, w * 0.10, h * 0.18, w * 0.04); ctx.fill();
    roundRect(ctx, w * 0.38, h * 0.76, w * 0.10, h * 0.18, w * 0.04); ctx.fill();
    roundRect(ctx, w * 0.58, h * 0.76, w * 0.10, h * 0.18, w * 0.04); ctx.fill();

    // eye
    ctx.fillStyle = "#111";
    roundRect(ctx, w * 0.78, h * 0.30, w * 0.05, h * 0.05, w * 0.02);
    ctx.fill();

    ctx.restore();
  };

  return g;
}
