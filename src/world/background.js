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

function drawSpaceSky(ctx, W, H, sp, tick, themeKey) {
    // Deep space gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgb(5,10,20)");
    g.addColorStop(1, "rgb(20,10,30)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Mars theme: add warm sun + dusty haze
    if (themeKey === "mars") {
        ctx.save();
        // small sun
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "rgba(255,220,180,0.95)";
        ctx.beginPath();
        ctx.arc(W * 0.78, H * 0.22, 26, 0, Math.PI * 2);
        ctx.fill();

        // haze
        ctx.globalAlpha = 0.18;
        const hz = ctx.createLinearGradient(0, H * 0.25, 0, H * 0.70);
        hz.addColorStop(0, "rgba(255,170,120,0.0)");
        hz.addColorStop(1, "rgba(255,170,120,0.55)");
        ctx.fillStyle = hz;
        ctx.fillRect(0, 0, W, H);

        // landing pad markings (subtle, near the horizon)
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = "rgba(20,10,12,0.9)";
        const padY = H * 0.78;
        ctx.fillRect(W * 0.12, padY, W * 0.76, H * 0.18);

        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "rgba(255,220,210,0.45)";
        ctx.lineWidth = 2;
        // center line
        ctx.beginPath();
        ctx.moveTo(W * 0.50, padY + 8);
        ctx.lineTo(W * 0.50, H - 10);
        ctx.stroke();
        // H marker
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 3;
        const hx = W * 0.50, hy = padY + 36;
        ctx.beginPath();
        ctx.moveTo(hx - 22, hy);
        ctx.lineTo(hx + 22, hy);
        ctx.moveTo(hx - 18, hy - 18);
        ctx.lineTo(hx - 18, hy + 18);
        ctx.moveTo(hx + 18, hy - 18);
        ctx.lineTo(hx + 18, hy + 18);
        ctx.stroke();

        // sparse dust motes
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        for (let i = 0; i < 26; i++) {
            const x = (i * 91 + (tick * 0.35)) % W;
            const y = (i * 57) % Math.floor(H * 0.60);
            ctx.fillRect(x, y, 2, 1);
        }
        ctx.restore();
    }

    // stars (deterministic-ish)
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const seed = (sp?.t ?? 0) + (sp?.phaseT ?? 0) * 0.5 + tick * 0.01;
    for (let i = 0; i < 90; i++) {
        const x = (Math.sin((i + 1) * 999 + seed) * 0.5 + 0.5) * W;
        const y = (Math.sin((i + 1) * 777 + seed * 1.3) * 0.5 + 0.5) * H;
        const r = 0.6 + ((i % 7) * 0.12);
        ctx.globalAlpha = 0.25 + ((i % 11) / 20);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // planet during travel/arrive
    if (sp?.phase === "travel" || sp?.phase === "arrive") {
        const p = Math.min(1, (sp?.phaseT ?? 0) / 260);
        const px = W * (0.82 - p * 0.12);
        const py = H * (0.30 - p * 0.03);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = (themeKey === "mars") ? "rgba(210,110,70,0.95)" : "rgba(160,120,255,0.95)";
        ctx.beginPath();
        ctx.arc(px, py, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath();
        ctx.arc(px - 14, py - 10, 10, 0, Math.PI * 2);
        ctx.arc(px + 10, py + 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
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

        // ground opacity: make ground more opaque during ocean/setpiece so water doesn't bleed through
        const isOcean = (game.theme === "ocean") || (game.themeFade?.active && game.themeFade?.to === "ocean");
        pal.groundAlpha = (game.setpiece?.active || isOcean) ? 0.92 : 0.45;

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

        // Rocket beat overrides sky with space / stars
        if (game.setpiece?.active && game.setpiece?.mode === "rocket") {
            drawSpaceSky(ctx, W, H, game.setpiece, game.tick, p.key);
            return;
        }

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
  if (themeKey === "mars") {
    // Mars: flatter dune ridge instead of mountains
    ctx.globalAlpha = 0.50;
    ctx.fillStyle = `rgba(${p.far[0]},${p.far[1]},${p.far[2]},0.42)`;
    ctx.beginPath();
    ctx.moveTo(0, Hv * 0.62);
    for (let x = 0; x <= Wv; x += 44) {
      const y = Hv * 0.62
        + Math.sin((x + far) * 0.018) * 10
        + Math.sin((x + far) * 0.006) * 14;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(Wv, Hv); ctx.lineTo(0, Hv);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (themeKey !== "city") {
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
function drawSeaBirds(ctx, horizonY) {
    // subtle distant birds during ocean beat
    if (!game?.setpiece?.active) return;
    const sp = game.setpiece;
    if (sp.phase !== "travel" && sp.phase !== "arrive") return;

    const Wv = getW();
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;

    const t = game.tick * 0.03;
    const count = 6;
    for (let i = 0; i < count; i++) {
        const x = ((i * 220) - (t * 38)) % (Wv + 260) - 130;
        const y = horizonY - 28 - (i % 3) * 10 + Math.sin((t + i) * 0.8) * 4;
        const s = 10 + (i % 3) * 3;
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.quadraticCurveTo(x, y - s * 0.55, x + s, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawHorizonIslands(ctx, horizonY) {
    if (!game?.setpiece?.active) return;
    const sp = game.setpiece;
    if (sp.phase !== "travel" && sp.phase !== "arrive") return;

    const Wv = getW();
    const p = palette();
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = `rgba(${Math.max(0, p.far[0] - 20)},${Math.max(0, p.far[1] - 25)},${Math.max(0, p.far[2] - 25)},0.55)`;

    // a few soft blobs on the horizon (far islands)
    for (let i = 0; i < 4; i++) {
        const x = ((i * 340) - (game.tick * 0.22)) % (Wv + 420) - 210;
        const y = horizonY - 6;
        const w = 140 + (i % 2) * 60;
        const h = 26 + (i % 3) * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + w * 0.25, y - h, x + w * 0.5, y - h * 0.65);
        ctx.quadraticCurveTo(x + w * 0.75, y - h * 0.85, x + w, y);
        ctx.lineTo(x + w, y + 10);
        ctx.lineTo(x, y + 10);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

    function drawOcean(ctx) {
        const Wv = getW();
        const Hv = getH();
        const p = palette();

        // horizon line a bit above the ground plane
        const horizonY = Hv * 0.62;

        drawHorizonIslands(ctx, horizonY);
        drawSeaBirds(ctx, horizonY);

        ctx.save();

        // water gradient (use theme ocean color as base)
        const top = p.ocean || [40, 120, 170];
        const g = ctx.createLinearGradient(0, horizonY, 0, Hv);
        g.addColorStop(0, `rgba(${top[0]},${top[1]},${top[2]},0.34)`);
        g.addColorStop(1, `rgba(${Math.max(0, top[0] - 25)},${Math.max(0, top[1] - 55)},${Math.max(0, top[2] - 55)},0.62)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, horizonY, Wv, Hv - horizonY);

        // thin horizon highlight
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(0, horizonY + 1, Wv, 2);

        // waves (few wide lines, calmer)
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2;

        for (let k = 0; k < 8; k++) {
            const y0 = horizonY + 22 + k * 28;
            const phase = (game.tick * 0.038) + k * 55;
            ctx.beginPath();
            ctx.moveTo(0, y0);
            for (let x = 0; x <= Wv; x += 30) {
                const y = y0 + Math.sin((x + phase) * 0.05) * (2.6 + k * 0.08);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // subtle shimmer streaks
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        for (let i = 0; i < 7; i++) {
            const rx = (i * 140 + (game.tick * 2.2)) % (Wv + 220) - 110;
            const ry = horizonY + 36 + (i % 3) * 44;
            ctx.fillRect(rx, ry, 40, 2);
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

  // cinematic overlays during ocean beat
  if (game?.setpiece?.active) {
    // subtle blue grade
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "rgba(80,140,210,1)";
    ctx.fillRect(mx, 0, W - mx, H);
    ctx.restore();

    // wind streaks / cloud trails (top half)
    const tt = game.tick * 0.55;
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const y0 = H * (0.10 + i * 0.04) + Math.sin((i * 40 + tt) * 0.03) * 6;
      const x0 = mx + ((i * 160 + tt * 4) % 520) - 220;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + 220, y0 - 18);
      ctx.stroke();
    }
    ctx.restore();

    // occasional gust “whoosh” lines (mid)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const px = mx + ((i * 210 + tt * 6) % (W - mx + 260)) - 120;
      const py = H * (0.30 + i * 0.07) + Math.sin((px + tt) * 0.01) * 10;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + 90, py - 10, px + 180, py - 26);
      ctx.stroke();
    }
    ctx.restore();
  }

  // soft foam / coast edge at the mask boundary
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.28;
  const edgeW = 26;
  const g = ctx.createLinearGradient(mx, 0, mx + edgeW, 0);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.10)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(mx, 0, edgeW, H);

// animated foam dots
const t = game.tick * 0.25;
ctx.save();
ctx.globalAlpha = 0.18;
ctx.fillStyle = "rgba(255,255,255,0.9)";
const step = 36;
for (let y = getH() * 0.55; y < H; y += step) {
  const yy = y + Math.sin((y * 0.06) + (t * 0.12)) * 6;
  const r = 3 + (Math.sin((y + t) * 0.08) + 1) * 1.2;
  const xx = mx + 4 + Math.sin((yy + t) * 0.05) * 6;
  ctx.beginPath();
  ctx.arc(xx, yy, r, 0, Math.PI * 2);
  ctx.fill();
}
ctx.restore();
  ctx.globalAlpha = 1;
  ctx.restore();
}



    function getNight() {
        return palette().n;
    }

    return { palette, drawSky, drawParallax, drawGroundFog, drawOcean, nightFactor: getNight };
}