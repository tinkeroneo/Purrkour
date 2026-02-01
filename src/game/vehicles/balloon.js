// src/game/vehicles/balloon.js
import { clamp, lerp, roundRect, smoothstep, tri } from "../../core/util.js";

export function drawBalloonVehicle(ctx, env) {
  const { canvas, terrain, game, setpiece } = env;
  const W = canvas.W, H = canvas.H;
  const sp = setpiece;

  const p = clamp(sp.t / Math.max(1, sp.dur), 0, 1);

  // --- gentle wind drift (stateful, smooth) ---
  if (!sp.motion) sp.motion = { dx: 0, dy: 0, phase: Math.random() * 1000 };
  const tt = (game.tick + sp.t + sp.motion.phase);
  const windX = Math.sin(tt * 0.012) * 18 + Math.sin(tt * 0.031) * 10;
  const windY = Math.sin(tt * 0.016) * 7 + Math.sin(tt * 0.041) * 3;
  // taper drift when landing
  const landTraw = clamp((p - 0.86) / 0.14, 0, 1);
  const landEase = smoothstep(landTraw);
  const driftT = 1 - landEase;
  sp.motion.dx = lerp(sp.motion.dx, windX * driftT, 0.06);
  sp.motion.dy = lerp(sp.motion.dy, windY * driftT, 0.06);

  // flight path: enter from left, cross, then land on right
  const x = (-90) + (W + 180) * p + sp.motion.dx;

  const flightY = H * 0.30;
  const bob = Math.sin((game.tick + sp.t) * 0.06) * 4 * driftT;
  const landingY = terrain.surfaceAt(x) - 78;
  const y = lerp(flightY + bob, landingY, landEase) + sp.motion.dy;

  const sway = Math.sin((game.tick + sp.t) * 0.02) * 0.06 * driftT;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);

  // balloon
  const g = ctx.createLinearGradient(-28, -46, 28, 30);
  g.addColorStop(0, "rgba(255,170,205,0.95)");
  g.addColorStop(1, "rgba(235,95,150,0.95)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  // highlight
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.ellipse(-10, -10, 10, 18, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // stripe
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(-2.2, -38, 4.4, 76);
  ctx.globalAlpha = 1;

  // ropes
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 28); ctx.lineTo(-10, 62);
  ctx.moveTo(14, 28);  ctx.lineTo(10, 62);
  ctx.stroke();

  // basket
  ctx.fillStyle = "rgba(176,112,48,0.96)";
  roundRect(ctx, -20, 62, 40, 18, 7); ctx.fill();

  // rim
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(-18, 64, 36, 3);
  ctx.globalAlpha = 1;

  // cat inside basket (simple silhouette)
  ctx.save();
  ctx.translate(0, 58);
  ctx.fillStyle = "#3b3b3b";
  roundRect(ctx, -9, 10, 18, 14, 6); ctx.fill();
  roundRect(ctx, -6, 2, 12, 10, 5); ctx.fill();
  ctx.fillStyle = "#2a2a2a";
  tri(ctx, -6, 2, -2, -4, 2, 2);
  tri(ctx, 6, 2, 2, -4, -2, 2);
  ctx.restore();

  ctx.restore();
}
