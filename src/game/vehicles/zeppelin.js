// src/game/vehicles/zeppelin.js
import { clamp, lerp, roundRect, smoothstep, tri } from "../../core/util.js";

export function drawZeppelinVehicle(ctx, env) {
  const { canvas, terrain, game, setpiece } = env;
  const W = canvas.W, H = canvas.H;
  const sp = setpiece;

  const p = clamp(sp.t / Math.max(1, sp.dur), 0, 1);
  if (!sp.motion) sp.motion = { dx: 0, dy: 0, phase: Math.random() * 1000 };
  const tt = (game.tick + sp.t + sp.motion.phase);
  const windX = Math.sin(tt * 0.010) * 12 + Math.sin(tt * 0.027) * 7;
  const windY = Math.sin(tt * 0.014) * 5 + Math.sin(tt * 0.039) * 2;
  const landTraw = clamp((p - 0.86) / 0.14, 0, 1);
  const landEase = smoothstep(landTraw);
  const driftT = 1 - landEase;
  sp.motion.dx = lerp(sp.motion.dx, windX * driftT, 0.05);
  sp.motion.dy = lerp(sp.motion.dy, windY * driftT, 0.05);

  const x = (-120) + (W + 240) * p + sp.motion.dx;

  const flightY = H * 0.24;
  const bob = Math.sin((game.tick + sp.t) * 0.045) * 2.6 * driftT;
  const landingY = terrain.surfaceAt(x) - 86;
  const y = lerp(flightY + bob, landingY, landEase) + sp.motion.dy;

  // zeppelin is heavier: less sway
  const sway = Math.sin((game.tick + sp.t) * 0.014) * 0.03 * driftT;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);

  // hull (cigar)
  const hullG = ctx.createLinearGradient(-70, -18, 70, 18);
  hullG.addColorStop(0, "rgba(230,235,245,0.95)");
  hullG.addColorStop(1, "rgba(170,180,200,0.95)");
  ctx.fillStyle = hullG;
  ctx.beginPath();
  ctx.ellipse(0, 0, 78, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // stripes
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(-10, -22, 6, 44);
  ctx.fillRect(12, -22, 4, 44);
  ctx.globalAlpha = 1;

  // gondola ropes
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-28, 14); ctx.lineTo(-18, 40);
  ctx.moveTo(28, 14);  ctx.lineTo(18, 40);
  ctx.stroke();

  // gondola
  ctx.fillStyle = "rgba(90,70,60,0.95)";
  roundRect(ctx, -26, 40, 52, 16, 7); ctx.fill();

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(-22, 42, 44, 3);
  ctx.globalAlpha = 1;

  // cat silhouette peeking
  ctx.save();
  ctx.translate(0, 34);
  ctx.fillStyle = "#3b3b3b";
  roundRect(ctx, -8, 10, 16, 12, 6); ctx.fill();
  roundRect(ctx, -6, 2, 12, 9, 5); ctx.fill();
  ctx.fillStyle = "#2a2a2a";
  tri(ctx, -6, 2, -2, -3, 2, 2);
  tri(ctx, 6, 2, 2, -3, -2, 2);
  ctx.restore();

  ctx.restore();
}
