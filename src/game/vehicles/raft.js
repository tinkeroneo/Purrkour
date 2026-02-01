// src/game/vehicles/raft.js
import { clamp, lerp, roundRect, smoothstep, tri } from "../../core/util.js";

export function drawRaftVehicle(ctx, env) {
  const { canvas, terrain, game, setpiece } = env;
  const W = canvas.W, H = canvas.H;
  const sp = setpiece;

  const p = clamp(sp.t / Math.max(1, sp.dur), 0, 1);

  // drift: raft is pushed around more
  if (!sp.motion) sp.motion = { dx: 0, dy: 0, phase: Math.random() * 1000 };
  const tt = (game.tick + sp.t + sp.motion.phase);
  const windX = Math.sin(tt * 0.010) * 16 + Math.sin(tt * 0.029) * 10;
  const windY = Math.sin(tt * 0.017) * 4 + Math.sin(tt * 0.041) * 2;

  const landTraw = clamp((p - 0.88) / 0.12, 0, 1);
  const landEase = smoothstep(landTraw);
  const driftT = 1 - landEase;
  sp.motion.dx = lerp(sp.motion.dx, windX * driftT, 0.06);
  sp.motion.dy = lerp(sp.motion.dy, windY * driftT, 0.06);

  const x = (-120) + (W + 240) * p + sp.motion.dx;

  // raft rides lower (waves), then ramps to land
  const flightY = H * 0.64;
  const wave = (Math.sin((game.tick + sp.t) * 0.08) * 4 + Math.sin((game.tick + sp.t) * 0.021) * 2) * driftT;
  const landingY = terrain.surfaceAt(x) - 72;
  const y = lerp(flightY + wave, landingY, landEase) + sp.motion.dy;

  ctx.save();
  ctx.translate(x, y);

  // logs
  ctx.fillStyle = "rgba(160,110,60,0.95)";
  for (let i = -2; i <= 2; i++) {
    roundRect(ctx, -48, 20 + i * 6, 96, 6, 3); ctx.fill();
  }
  // rope
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(-40, 24, 80, 2);
  ctx.globalAlpha = 1;

  // tiny mast + sail (optional)
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, -18); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(0, -18); ctx.lineTo(24, -6); ctx.lineTo(0, 2);
  ctx.closePath(); ctx.fill();

  // cat sits on raft
  ctx.save();
  ctx.translate(0, 6);
  ctx.fillStyle = "#3b3b3b";
  roundRect(ctx, -10, 10, 20, 14, 6); ctx.fill();
  roundRect(ctx, -7, 2, 14, 10, 5); ctx.fill();
  ctx.fillStyle = "#2a2a2a";
  tri(ctx, -7, 2, -3, -4, 2, 2);
  tri(ctx, 7, 2, 3, -4, -2, 2);
  ctx.restore();

  ctx.restore();
}
