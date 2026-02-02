import { clamp, lerp, smoothstep } from "../core/util.js";
import { getTheme } from "./themes.js";
import { nightFactor } from "./daynight.js";

const fireflies = []; // {x,y,phase,r,life}

function mixRGB(a, b, t) {
    // Defensive: themes may omit some palette keys.
    if (!a && !b) return [0, 0, 0];
    if (!a) return [b[0] | 0, b[1] | 0, b[2] | 0];
    if (!b) return [a[0] | 0, a[1] | 0, a[2] | 0];
    return [
        Math.round(lerp(a[0], b[0], t)),
        Math.round(lerp(a[1], b[1], t)),
        Math.round(lerp(a[2], b[2], t)),
    ];
}

export function createBackground(getW, getH, lakes, game, hud) {
    const W = () => getW();
    const H = () => getH();

    function themeSeed(key) {
        // stable small offset per theme key to avoid "popping" when switching themes
        let h = 0;
        const s = String(key || "");
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return (h % 997) / 997; // 0..1
    }

    function palette() {
        // Theme-based palette + optional crossfade
        const t = game.themeFade;
        const cur = getTheme(game.theme);
        let pal = cur.palette || {};

        if (t?.active && t.from && t.to && t.dur > 0) {
            const a = getTheme(t.from).palette || {};
            const b = getTheme(t.to).palette || {};
            const u = clamp(t.t / t.dur, 0, 1);
            const uu = smoothstep(u);
            pal = {
                key: b.key ?? t.to,
                label: b.label ?? t.to,
                skyTop: mixRGB(a.skyTop, b.skyTop, uu),
                skyBot: mixRGB(a.skyBot, b.skyBot, uu),
                far: mixRGB(a.far, b.far, uu),
                forest: mixRGB(a.forest, b.forest, uu),
                ground: mixRGB(a.ground, b.ground, uu),
                // optional keys with sane fallbacks
                grass: mixRGB(a.grass ?? a.ground, b.grass ?? b.ground, uu),
                ocean: mixRGB(a.ocean ?? a.lake ?? [60, 150, 200], b.ocean ?? b.lake ?? [60, 150, 200], uu),
            };
        }

        // Normalize optional keys (avoid undefined accesses in draws)
        if (!pal.skyTop) pal.skyTop = [150, 210, 255];
        if (!pal.skyBot) pal.skyBot = [235, 245, 255];
        if (!pal.far) pal.far = [70, 95, 135];
        if (!pal.forest) pal.forest = [50, 135, 95];
        if (!pal.ground) pal.ground = [95, 170, 92];
        if (!pal.grass) pal.grass = pal.ground;
        if (!pal.ocean) pal.ocean = [60, 150, 200];

        // vertical band tint (ground/mid/high)
        const band = game.vertical?.band ?? "ground";
        if (band === "mid") {
            pal.skyTop = mixRGB(pal.skyTop, [235, 250, 255], 0.18);
            pal.skyBot = mixRGB(pal.skyBot, [250, 255, 255], 0.10);
        } else if (band === "air") {
            pal.skyTop = mixRGB(pal.skyTop, [245, 252, 255], 0.32);
            pal.skyBot = mixRGB(pal.skyBot, [255, 255, 255], 0.18);
        }

        // Attach day/night (0..1) for draws to use
        pal.n = nightFactor(game.tick, game.score);
        return pal;
    }


    function drawSky(ctx) {
        const W = getW(), H = getH();
        const p = palette();
        if (hud && typeof hud.setBiome === "function") hud.setBiome(p.label);

        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgb(${p.skyTop[0]},${p.skyTop[1]},${p.skyTop[2]})`);
        g.addColorStop(1, `rgb(${p.skyBot[0]},${p.skyBot[1]},${p.skyBot[2]})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // theme crossfade sweep (soft fog band)
        if (game.themeFade?.active && game.themeFade.dur > 0) {
            const u = clamp(game.themeFade.t / game.themeFade.dur, 0, 1);
            const uu = smoothstep(u);
            const sweepX = (-W * 0.35) + uu * (W * 1.70);

            ctx.save();
            ctx.globalAlpha = 0.18;
            const g2 = ctx.createLinearGradient(sweepX - 140, 0, sweepX + 140, 0);
            g2.addColorStop(0, "rgba(255,255,255,0.0)");
            g2.addColorStop(0.5, "rgba(255,255,255,0.55)");
            g2.addColorStop(1, "rgba(255,255,255,0.0)");
            ctx.fillStyle = g2;
            ctx.fillRect(0, 0, W, H);

            // a second, broader pass
            ctx.globalAlpha = 0.10;
            const g3 = ctx.createLinearGradient(sweepX - 260, 0, sweepX + 260, 0);
            g3.addColorStop(0, "rgba(220,230,240,0.0)");
            g3.addColorStop(0.5, "rgba(220,230,240,0.45)");
            g3.addColorStop(1, "rgba(220,230,240,0.0)");
            ctx.fillStyle = g3;
            ctx.fillRect(0, 0, W, H);

            ctx.restore();
        }

        // night veil
        if (p.n > 0) {
            ctx.globalAlpha = 0.45 * p.n;
            ctx.fillStyle = "rgba(10,18,32,1)";
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }

        // subtle stars at night
        if (p.n > 0.55) {
            const a = (p.n - 0.55) / 0.37;
            ctx.globalAlpha = 0.18 * a;
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            for (let i = 0; i < 36; i++) {
                const x = (i * 97 + (game.tick * 0.7)) % W;
                const y = (i * 53) % Math.floor(H * 0.55);
                ctx.fillRect(x, y, 2, 2);
            }
            ctx.globalAlpha = 1;
        }
    }

    function drawParallax(ctx) {
  const Wv = getW(), Hv = getH();
  const p = palette();
  const themeKey = getTheme(game.theme)?.key || game.theme || "forest";

  const tick = game.tick || 0;
  const far = (game.score * 6 + tick) * 0.10;
  const mid = (game.score * 9 + tick) * 0.18;
  const near = (game.score * 13 + tick) * 0.26;

  // ---- FAR LAYER ----
  if (themeKey !== "city") {
    // soft mountains / silhouettes
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = `rgba(${p.far[0]},${p.far[1]},${p.far[2]},0.55)`;
    ctx.beginPath();
    ctx.moveTo(0, Hv * 0.58);
    for (let x = 0; x <= Wv; x += 40) {
      const y = Hv * 0.58
        + Math.sin((x + far) * 0.025) * 18
        + Math.sin((x + far) * 0.012) * 26;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(Wv, Hv); ctx.lineTo(0, Hv);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    // city: flatter haze, no mountains
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = `rgba(${p.far[0]},${p.far[1]},${p.far[2]},0.28)`;
    ctx.fillRect(0, Hv * 0.52, Wv, Hv * 0.14);
    ctx.globalAlpha = 1;
  }

  // ---- MID LAYER ----
  if (themeKey === "forest" || themeKey === "jungle") {
    // forest triangles
    ctx.globalAlpha = 0.60;
    ctx.fillStyle = `rgba(${p.forest[0]},${p.forest[1]},${p.forest[2]},0.42)`;
    for (let x = -30; x < Wv + 60; x += 28) {
      const hh = 42 + (Math.sin((x + mid) * 0.06) * 10);
      const baseY = Hv * 0.70 + Math.sin((x + mid) * 0.02) * 8;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x + 14, baseY - hh);
      ctx.lineTo(x + 28, baseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (themeKey === "island") {
    // palms only (no forest trees)
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = `rgba(${p.forest[0]},${p.forest[1]},${p.forest[2]},0.35)`;
    const baseY = Hv * 0.71;
    for (let i = 0; i < 12; i++) {
      const x = ((i * 86) - (mid * 0.22)) % (Wv + 140) - 70;
      const h = 44 + ((i * 19) % 26);
      // trunk
      ctx.fillRect(x + 10, baseY - h, 6, h);
      // leaves
      ctx.beginPath();
      ctx.moveTo(x + 13, baseY - h);
      ctx.quadraticCurveTo(x - 4, baseY - h - 6, x - 14, baseY - h + 6);
      ctx.quadraticCurveTo(x + 2, baseY - h + 2, x + 13, baseY - h);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 13, baseY - h);
      ctx.quadraticCurveTo(x + 30, baseY - h - 8, x + 44, baseY - h + 8);
      ctx.quadraticCurveTo(x + 26, baseY - h + 4, x + 13, baseY - h);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (themeKey === "city") {
    // skyline with subtle windows
    if (typeof drawCitySkyline === "function") {
      drawCitySkyline(ctx, mid, p);
    } else {
      const baseY = Hv * 0.72;
      ctx.globalAlpha = 0.50;
      ctx.fillStyle = `rgba(${Math.max(0, p.far[0] - 10)},${Math.max(0, p.far[1] - 10)},${Math.max(0, p.far[2] - 10)},0.55)`;
      for (let i = 0; i < 18; i++) {
        const x = ((i * 78) - (mid * 0.28)) % (Wv + 120) - 60;
        const bw = 36 + (i % 3) * 10;
        const bh = 40 + ((i * 17) % 60);
        const y0 = baseY - bh;
        ctx.fillRect(x, y0, bw, bh);

        // windows
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "rgba(255,247,204,0.9)";
        for (let wy = y0 + 10; wy < baseY - 10; wy += 12) {
          for (let wx = x + 8; wx < x + bw - 8; wx += 10) {
            if (((wx + wy + (mid|0)) % 23) < 10) ctx.fillRect(wx, wy, 4, 6);
          }
        }
        ctx.globalAlpha = 0.50;
        ctx.fillStyle = `rgba(${Math.max(0, p.far[0] - 10)},${Math.max(0, p.far[1] - 10)},${Math.max(0, p.far[2] - 10)},0.55)`;
      }
      ctx.globalAlpha = 1;
    }
  } else if (themeKey === "desert") {
    // dunes
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = `rgba(${p.ground[0]},${p.ground[1]},${p.ground[2]},0.22)`;
    ctx.beginPath();
    ctx.moveTo(0, Hv * 0.72);
    for (let x = 0; x <= Wv; x += 34) {
      const y = Hv * 0.72 + Math.sin((x + mid) * 0.02) * 10 + Math.sin((x + mid) * 0.006) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(Wv, Hv); ctx.lineTo(0, Hv);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---- OCEAN SPECIAL ----
  if (themeKey === "ocean" || game?.setpiece?.active) {
    const maskX = game?.setpiece?.oceanMaskX ?? 0;
    if (typeof drawOceanMasked === "function") drawOceanMasked(ctx, maskX);
  }
}

function drawHighClouds(ctx, near, night) {
    const W = getW(), H = getH();
    const band = game.vertical?.band ?? "ground";
    if (band === "ground") return;

    const strength = (band === "air") ? 0.22 : 0.14;
    ctx.save();
    ctx.globalAlpha = strength * (1 - night * 0.25);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    const baseY = (band === "air") ? H * 0.22 : H * 0.30;
    for (let i = 0; i < 7; i++) {
        const x = ((i * 180) - (near * 1.2)) % (W + 240) - 120;
        const y = baseY + Math.sin((x + near) * 0.01) * 12 + i * 6;
        ctx.beginPath();
        ctx.ellipse(x + 40, y, 55, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 85, y + 6, 70, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 140, y, 55, 18, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
function drawGroundFog(ctx) {
        const W = getW(), H = getH();
        const p = palette();
        const n = p.n ?? 0;
        if (n < 0.35) return;

        ctx.save();
        ctx.globalAlpha = n * 0.12;

        const fogY = H * 0.78;
        const fogH = H * 0.18;
        const g = ctx.createLinearGradient(0, fogY, 0, fogY + fogH);
        g.addColorStop(0, "rgba(200,220,230,0.0)");
        g.addColorStop(0.4, "rgba(200,220,230,0.15)");
        g.addColorStop(1, "rgba(200,220,230,0.25)");
        ctx.fillStyle = g;
        ctx.fillRect(0, fogY, W, fogH);

        ctx.restore();
    }
    function drawOcean(ctx) {
  const Wv = getW();
  const Hv = getH();

  // horizon
  const horizonY = Hv * 0.62;

  ctx.save();

  // water gradient
  const g = ctx.createLinearGradient(0, horizonY, 0, Hv);
  g.addColorStop(0, "rgba(30,80,120,0.30)");
  g.addColorStop(1, "rgba(10,30,60,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, horizonY, Wv, Hv - horizonY);

  // waves
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;

  for (let k = 0; k < 10; k++) {
    const y0 = horizonY + 20 + k * 24;
    const phase = (game.tick * 0.04) + k * 40;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let x = 0; x <= Wv; x += 26) {
      const y = y0 + Math.sin((x + phase) * 0.05) * 3.2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawOceanMasked(ctx, maskX) {
  const W = getW(), H = getH();
  const mx = clamp(maskX ?? 0, 0, W);
  if (mx >= W) return; // fully masked (no ocean)
  ctx.save();
  ctx.beginPath();
  ctx.rect(mx, 0, W - mx, H);
  ctx.clip();
  drawOcean(ctx);
  ctx.restore();
}



    function getNight() {
        return palette().n;
    }

    return { palette, drawSky, drawParallax, drawGroundFog, drawOcean, nightFactor: getNight };
}
