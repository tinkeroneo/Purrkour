// src/game/vehicles/raft.js
import { roundRect } from "../../core/util.js";
import { drawPassengerCat } from "./passenger.js";

export function drawRaftVehicle(ctx, env) {
  const { game, setpiece } = env;
  const sp = setpiece;

  const x = sp?.vehicle?.x ?? 200;
  const y = sp?.vehicle?.y ?? 160;

  const bob = game.reducedMotion ? 0 : Math.sin((game.tick + (sp?.t ?? 0)) * 0.09) * 2.2;
  const yy = y + (sp?.phase === "travel" ? bob : 0);

  ctx.save();

  // raft planks
  ctx.fillStyle = "rgba(150,110,70,0.95)";
  roundRect(ctx, x - 46, yy - 8, 92, 16, 8);
  ctx.fill();

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  for (let i = -36; i <= 36; i += 12) ctx.fillRect(x + i, yy - 6, 2, 12);
  ctx.globalAlpha = 1;

  // small sail mast
  ctx.strokeStyle = "rgba(120,90,60,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, yy - 8);
  ctx.lineTo(x, yy - 64);
  ctx.stroke();

  ctx.fillStyle = "rgba(240,240,240,0.85)";
  ctx.beginPath();
  ctx.moveTo(x, yy - 64);
  ctx.lineTo(x + 40, yy - 42);
  ctx.lineTo(x, yy - 42);
  ctx.closePath();
  ctx.fill();

  // cat sits on raft
  if (sp?.catInVehicle) {
    drawPassengerCat(ctx, { x: x - 17, y: yy - 7, scale: 1 });
  }

  ctx.restore();
}
