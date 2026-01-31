export function createLakes(getW, getH) {
  const lakeSegments = []; // {x,w,y,amp}

  function reset() { lakeSegments.length = 0; }

  function update(dx, biomePalette) {
    const W = getW(), H = getH();
    const chance = biomePalette.lakeChance;

    if (Math.random() < chance) {
      const w = 260 + Math.random() * 280;
      const last = lakeSegments[lakeSegments.length - 1];
      if (last) {
        const gap = 140;
        if ((W + 40) < (last.x + last.w + gap)) {
          // no spawn if too close
        } else {
          lakeSegments.push({
            x: W + 40,
            w,
            y: H * 0.86 + Math.random() * 10, // safely below ground
            amp: 3 + Math.random() * 2
          });
        }
      } else {
        lakeSegments.push({
          x: W + 40,
          w,
          y: H * 0.86 + Math.random() * 10,
          amp: 3 + Math.random() * 2
        });
      }
    }

    for (const s of lakeSegments) s.x -= dx * 0.55;
    for (let i = lakeSegments.length - 1; i >= 0; i--) {
      if (lakeSegments[i].x + lakeSegments[i].w < -60) lakeSegments.splice(i, 1);
    }
  }

  function drawLakeSegment(ctx, s, near, p, H) {
    const baseY = s.y;
    const amp1 = s.amp;
    const amp2 = s.amp * 0.55;
    const bandH = 120;

    ctx.save();
    const cap = 70;
    ctx.beginPath();
    ctx.moveTo(s.x + cap, baseY);
    ctx.lineTo(s.x + s.w - cap, baseY);
    ctx.quadraticCurveTo(s.x + s.w, baseY + bandH * 0.5, s.x + s.w - cap, baseY + bandH);
    ctx.lineTo(s.x + cap, baseY + bandH);
    ctx.quadraticCurveTo(s.x, baseY + bandH * 0.5, s.x + cap, baseY);
    ctx.closePath();
    ctx.clip();

    const g = ctx.createLinearGradient(0, baseY - 8, 0, baseY + 120);
    g.addColorStop(0, `rgba(${p.lake[0]},${p.lake[1]},${p.lake[2]},0.22)`);
    g.addColorStop(1, `rgba(${Math.max(0,p.lake[0]-30)},${Math.max(0,p.lake[1]-40)},${Math.max(0,p.lake[2]-25)},0.28)`);

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(s.x, baseY);
    for (let x = s.x; x <= s.x + s.w; x += 14) {
      const y = baseY + Math.sin((x + near) * 0.075) * amp1 + Math.sin((x + near) * 0.028) * amp2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(s.x + s.w, baseY + bandH);
    ctx.lineTo(s.x, baseY + bandH);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function draw(ctx, near, palette, H) {
    for (const s of lakeSegments) drawLakeSegment(ctx, s, near, palette, H);
  }

  return { reset, update, draw };
}
