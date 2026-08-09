import { roundRect, tri } from "../../core/util.js";

export function drawPassengerCat(ctx, { x, y, scale = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#3b3b3b";
  roundRect(ctx, -10, -15, 20, 15, 7);
  ctx.fill();
  roundRect(ctx, -7, -26, 14, 13, 6);
  ctx.fill();

  ctx.fillStyle = "#2a2a2a";
  tri(ctx, -7, -24, -3, -33, 1, -24);
  tri(ctx, 7, -24, 3, -33, -1, -24);

  ctx.fillStyle = "#f4f7f8";
  ctx.beginPath();
  ctx.arc(-3, -21, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -21, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f29ab2";
  ctx.fillRect(-1, -18, 2, 1.5);

  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, -9);
  ctx.quadraticCurveTo(-17, -14, -14, -22);
  ctx.stroke();
  ctx.restore();
}
