// src/game/vehicles/balloon.js
import { roundRect } from "../../core/util.js";
import { drawPassengerCat } from "./passenger.js";

export function drawBalloonVehicle(ctx, env) {
  const { game, setpiece } = env;
  const sp = setpiece;

  const x = sp?.vehicle?.x ?? 200;
  const y = sp?.vehicle?.y ?? 120; // basket baseline

  const bob = game.reducedMotion ? 0 : Math.sin((game.tick + (sp?.t ?? 0)) * 0.08) * 3.5;
  const yy = y + (sp?.phase === "travel" ? bob : 0);

  ctx.save();

  // balloon
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "rgba(240,120,160,0.92)";
  ctx.beginPath();
  ctx.ellipse(x, yy - 78, 34, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  // stripes
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(x - 3, yy - 122, 6, 88);
  ctx.globalAlpha = 1;

  // ropes
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 16, yy - 44); ctx.lineTo(x - 12, yy - 10);
  ctx.moveTo(x + 16, yy - 44); ctx.lineTo(x + 12, yy - 10);
  ctx.stroke();

  // basket
  ctx.fillStyle = "rgba(170,110,60,0.96)";
  roundRect(ctx, x - 20, yy - 12, 40, 20, 7);
  ctx.fill();

  // cat in basket (only if catInVehicle)
  if (sp?.catInVehicle) {
    drawPassengerCat(ctx, { x, y: yy - 2, scale: 1 });
    ctx.fillStyle = "rgba(125,78,42,.96)";
    roundRect(ctx, x - 20, yy - 3, 40, 11, 6);
    ctx.fill();
  }

  ctx.restore();
}
