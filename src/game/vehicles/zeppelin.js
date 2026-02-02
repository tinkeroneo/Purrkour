// src/game/vehicles/zeppelin.js
import { roundRect } from "../../core/util.js";

export function drawZeppelinVehicle(ctx, env) {
  const { game, setpiece } = env;
  const sp = setpiece;

  const x = sp?.vehicle?.x ?? 220;
  const y = sp?.vehicle?.y ?? 140;

  const bob = Math.sin((game.tick + (sp?.t ?? 0)) * 0.06) * 2.8;
  const yy = y + (sp?.phase === "travel" ? bob : 0);

  ctx.save();

  // hull
  ctx.fillStyle = "rgba(210,210,220,0.96)";
  ctx.beginPath();
  ctx.ellipse(x, yy - 78, 78, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // stripe
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "rgba(120,140,170,1)";
  ctx.beginPath();
  ctx.ellipse(x, yy - 78, 76, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // gondola
  ctx.fillStyle = "rgba(110,90,70,0.95)";
  roundRect(ctx, x - 18, yy - 24, 36, 14, 6);
  ctx.fill();

  // lines
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 26, yy - 56); ctx.lineTo(x - 12, yy - 24);
  ctx.moveTo(x + 26, yy - 56); ctx.lineTo(x + 12, yy - 24);
  ctx.stroke();

  // cat in gondola
  if (sp?.catInVehicle) {
    ctx.fillStyle = "#3b3b3b";
    roundRect(ctx, x - 9, yy - 30, 18, 12, 6);
    ctx.fillStyle = "#2a2a2a";
    ctx.beginPath();
    ctx.arc(x - 4, yy - 26, 1.8, 0, Math.PI * 2);
    ctx.arc(x + 4, yy - 26, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // tiny tail fin
  ctx.fillStyle = "rgba(190,190,200,0.9)";
  ctx.beginPath();
  ctx.moveTo(x + 76, yy - 78);
  ctx.lineTo(x + 92, yy - 90);
  ctx.lineTo(x + 92, yy - 66);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
