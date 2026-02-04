// src/entities/scorpion.js
import { roundRect } from "../core/util.js";

export function createScorpion(x, y, opts = {}) {
  const s = {
    kind: "obstacle",
    type: "scorpion",
    x, y,
    w: opts.w ?? 46,
    h: opts.h ?? 28,
    t: 0,
    speed: opts.speed ?? 0, // world scroll handles most movement
  };

  s.update = function(game, terrain, eff) {
    s.t++;

    // ground align
    const ground = terrain.surfaceAt(s.x);
    s.y = ground - s.h;

    // crawl motion (subtle but visible)
    const scuttle = Math.sin(s.t * 0.35) * 0.35;
    s.x -= (eff * 0.18) + scuttle;
  };

  s.hitbox = function() {
    return {
      x: s.x + 4,
      y: s.y + 6,
      w: s.w - 8,
      h: s.h - 8
    };
  };

  s.draw = function(ctx) {
    const w = s.w, h = s.h;
    const legPhase = Math.sin(s.t * 0.35);
    const bob = Math.sin(s.t * 0.22) * (h * 0.03);
    const bodyShift = Math.sin(s.t * 0.35 + Math.PI * 0.5) * (w * 0.03);

    ctx.save();
    ctx.translate(s.x + bodyShift, s.y + bob);

    const body = "#2a1c14";
    const body2 = "#3b261b";
    const highlight = "#4a2f22";
    const sting = "#d19a2f";

    // tail
    ctx.strokeStyle = body2;
    ctx.lineWidth = Math.max(2, w * 0.06);
    ctx.beginPath();
    ctx.moveTo(w * 0.62, h * 0.28);
    ctx.quadraticCurveTo(
      w * 0.92,
      h * (-0.18 + legPhase * 0.12),
      w * 0.58,
      h * (-0.62 + legPhase * 0.18)
    );
    ctx.stroke();

    // stinger
    ctx.fillStyle = sting;
    roundRect(ctx, w * 0.52, -h * 0.64, w * 0.14, h * 0.20, 3);
    ctx.fill();

    // body
    ctx.fillStyle = body;
    roundRect(ctx, w * 0.16, h * 0.26, w * 0.64, h * 0.44, 10);
    ctx.fill();

    // body highlight ridge
    ctx.fillStyle = highlight;
    roundRect(ctx, w * 0.28, h * 0.34, w * 0.36, h * 0.10, 6);
    ctx.fill();

    // head
    ctx.fillStyle = body2;
    roundRect(ctx, w * 0.02, h * 0.30, w * 0.22, h * 0.35, 8);
    ctx.fill();

    // claws
    ctx.strokeStyle = body2;
    ctx.lineWidth = Math.max(2, w * 0.06);
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.42);
    ctx.lineTo(-w * 0.16, h * (0.24 + legPhase * 0.22));
    ctx.moveTo(w * 0.06, h * 0.58);
    ctx.lineTo(-w * 0.16, h * (0.74 - legPhase * 0.22));
    ctx.stroke();

    // legs
    ctx.strokeStyle = body2;
    ctx.lineWidth = Math.max(1.5, w * 0.04);
    for (let i = 0; i < 4; i++) {
      const lx = w * (0.25 + i * 0.12);
      const swing = Math.sin(s.t * 0.5 + i) * 0.12;
      ctx.beginPath();
      ctx.moveTo(lx, h * 0.70);
      ctx.lineTo(lx - (6 + i), h * (0.92 + swing));
      ctx.stroke();
    }

    ctx.restore();
  };

  return s;
}
