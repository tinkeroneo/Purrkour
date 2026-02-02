// src/game/vehicles/rocket.js
import { clamp, roundRect, tri } from "../../core/util.js";

export function drawRocketVehicle(ctx, env ) {
  const { game, setpiece, canvas } = env;
  const palette = env.palette;
  const sp = setpiece;

  const x = sp?.vehicle?.x ?? canvas?.W * 0.76 ?? 300;
  const y = sp?.vehicle?.y ?? canvas?.H * 0.38 ?? 220;

  const phase = sp?.phase || "travel";
  const t = (sp?.t ?? 0) + game.tick;

  // subtle bob in space
  const bob = (phase === "travel") ? Math.sin(t * 0.06) * 3.5 : 0;
  const yy = y + bob;

  ctx.save();

  // shadow on ground during approach/board/arrive
  if (phase !== "travel") {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x, yy + 70, 42, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // exhaust flame (launch / early travel)
  const flameOn = (phase === "board" || phase === "travel" || phase === "arrive");
  if (flameOn) {
    const strength =
      (phase === "board") ? 0.35 :
      (phase === "arrive") ? 0.25 : 0.75;

    const jitter = (Math.sin(t * 0.33) + Math.sin(t * 0.17) * 0.6) * 6;
    const fh = 46 + strength * 38 + jitter * strength * 0.6;

    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "rgba(255,170,60,0.9)";
    ctx.beginPath();
    ctx.moveTo(x - 10, yy + 58);
    ctx.quadraticCurveTo(x, yy + 58 + fh, x + 10, yy + 58);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath();
    ctx.moveTo(x - 5, yy + 58);
    ctx.quadraticCurveTo(x, yy + 58 + fh * 0.55, x + 5, yy + 58);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  // body
  ctx.fillStyle = "rgba(235,235,245,0.98)";
  roundRect(ctx, x - 18, yy - 10, 36, 70, 18);
  ctx.fill();

  // window
  ctx.fillStyle = "rgba(90,180,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(x, yy + 14, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // stripes
  ctx.fillStyle = "rgba(255,120,170,0.85)";
  roundRect(ctx, x - 18, yy + 34, 36, 10, 6);
  ctx.fill();

  // fins
  ctx.fillStyle = "rgba(210,210,225,0.98)";
  tri(ctx, x - 18, yy + 38, x - 34, yy + 56, x - 18, yy + 56);
  tri(ctx, x + 18, yy + 38, x + 34, yy + 56, x + 18, yy + 56);

  // nose cone
  ctx.fillStyle = "rgba(255,90,130,0.95)";
  ctx.beginPath();
  ctx.moveTo(x, yy - 36);
  ctx.quadraticCurveTo(x - 18, yy - 12, x - 18, yy - 10);
  ctx.lineTo(x + 18, yy - 10);
  ctx.quadraticCurveTo(x + 18, yy - 12, x, yy - 36);
  ctx.closePath();
  ctx.fill();

  // cat in capsule (only if catInVehicle)
  if (sp?.catInVehicle) {
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#3b3b3b";
    roundRect(ctx, x - 7, yy + 8, 14, 14, 6);
    roundRect(ctx, x - 5, yy + 1, 10, 9, 5);
    ctx.fillStyle = "#2a2a2a";
    tri(ctx, x - 5, yy + 1, x - 1, yy - 4, x + 2, yy + 1);
    tri(ctx, x + 5, yy + 1, x + 1, yy - 4, x - 2, yy + 1);
    ctx.globalAlpha = 1;
  }

  // Mars landing marker (flag + tiny rover) during arrival/landing
  const arriveU = clamp(((sp.phaseT ?? 0) / 160), 0, 1);
  if (palette?.key === "mars" && (sp.phase === "arrive" || sp.phase === "land") && arriveU > 0.55) {
    const mx = x + 120;
    const gy = env.terrain.surfaceAt(mx);
    ctx.save();
    ctx.globalAlpha = clamp((arriveU - 0.55) / 0.45, 0, 1);
    // pole
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, gy - 6);
    ctx.lineTo(mx, gy - 34);
    ctx.stroke();
    // flag
    ctx.fillStyle = "rgba(255,120,120,0.85)";
    ctx.beginPath();
    ctx.moveTo(mx, gy - 34);
    ctx.lineTo(mx + 18, gy - 30);
    ctx.lineTo(mx, gy - 26);
    ctx.closePath();
    ctx.fill();
    // rover
    ctx.fillStyle = "rgba(40,40,40,0.85)";
    roundRect(ctx, mx - 26, gy - 12, 20, 10, 4);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(mx - 23, gy - 18, 5, 5);
    ctx.restore();
  }
  ctx.restore();
}
