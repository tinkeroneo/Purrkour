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
        const W = getW(), H = getH();
        const p = palette();

        const tick = game.tick;

        // small per-theme offset + interpolated offset during fade
        const tf = game.themeFade;
        const seedA = themeSeed(tf?.from ?? game.theme);
        const seedB = themeSeed(tf?.to ?? game.theme);
        const u = (tf?.active && tf.dur > 0) ? smoothstep(clamp(tf.t / tf.dur, 0, 1)) : 1;
        const seed = lerp(seedA, seedB, u);
        const off = seed * 1200;

        // depth scroll with a tiny "delay" so layers feel separated
        const far = (game.score * 6 + tick) * 0.095 + off * 0.22;
        const mid = (game.score * 9 + tick) * 0.170 + off * 0.35;
        const near = (game.score * 13 + tick) * 0.245 + off * 0.55;

        ctx.globalAlpha = 0.55;
        ctx.fillStyle = `rgba(${p.far[0]},${p.far[1]},${p.far[2]},0.55)`;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.58);
        for (let x = 0; x <= W; x += 40) {
            const y = H * 0.58 + Math.sin((x + far) * 0.025) * 18 + Math.sin((x + far) * 0.012) * 26;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();

        // theme-specific mid layer (no more forest trees everywhere)
        const themeKey = (getTheme(game.theme)?.key) || game.theme || "forest";
        if (themeKey === "forest" || themeKey === "jungle" || themeKey === "island") {
            ctx.globalAlpha = 0.60;
            ctx.fillStyle = `rgba(${p.forest[0]},${p.forest[1]},${p.forest[2]},0.42)`;
            for (let x = -30; x < W + 60; x += 28) {
                const hh = 42 + (Math.sin((x + mid) * 0.06) * 10);
                const baseY = H * 0.70 + Math.sin((x + mid) * 0.02) * 8;
                ctx.beginPath();
                ctx.moveTo(x, baseY);
                ctx.lineTo(x + 14, baseY - hh);
                ctx.lineTo(x + 28, baseY);
                ctx.closePath();
                ctx.fill();
            }
        } else if (themeKey === "city") {
            // simple skyline
            ctx.globalAlpha = 0.50;
            ctx.fillStyle = `rgba(${Math.max(0, p.far[0] - 10)},${Math.max(0, p.far[1] - 10)},${Math.max(0, p.far[2] - 10)},0.55)`;
            const baseY = H * 0.72;
            for (let i = 0; i < 18; i++) {
                const x = ((i * 78) - (mid * 0.28)) % (W + 120) - 60;
                const bw = 36 + (i % 3) * 10;
                const bh = 40 + ((i * 17) % 60);
                ctx.fillRect(x, baseY - bh, bw, bh);
            }
        } else if (themeKey === "desert") {
            // dunes
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = `rgba(${p.ground[0]},${p.ground[1]},${p.ground[2]},0.22)`;
            ctx.beginPath();
            ctx.moveTo(0, H * 0.72);
            for (let x = 0; x <= W; x += 34) {
                const y = H * 0.72 + Math.sin((x + mid) * 0.02) * 10 + Math.sin((x + mid) * 0.006) * 18;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, H); ctx.lineTo(0, H);
            ctx.closePath();
            ctx.fill();
        } else {
            // ocean/mountain/space/etc: no mid trees; keep it clean
            ctx.globalAlpha = 1;
        }

        // island palms (simple silhouettes)
        if (game.theme === "island") {
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = `rgba(${Math.max(0, p.forest[0] - 20)},${Math.max(0, p.forest[1] - 30)},${Math.max(0, p.forest[2] - 20)},0.55)`;
            const horizon = H * 0.74;
            for (let i = 0; i < 6; i++) {
                const px = ((i * 180) - (near * 0.35)) % (W + 220) - 60;
                const trunkH = 38 + (i % 3) * 10;
                ctx.beginPath();
                ctx.moveTo(px, horizon);
                ctx.quadraticCurveTo(px + 10, horizon - trunkH * 0.6, px + 18, horizon - trunkH);
                ctx.lineTo(px + 24, horizon - trunkH);
                ctx.quadraticCurveTo(px + 14, horizon - trunkH * 0.5, px + 8, horizon);
                ctx.closePath();
                ctx.fill();

                // leaves
                ctx.globalAlpha = 0.40;
                ctx.beginPath();
                ctx.ellipse(px + 20, horizon - trunkH, 26, 10, -0.25, 0, Math.PI * 2);
                ctx.ellipse(px + 28, horizon - trunkH + 4, 22, 8, 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 0.55;
            }
        }

        // fireflies at night (subtle)
        if (p.n > 0.60 && (game.theme === "forest" || game.theme === "island")) {
            if (fireflies.length < 28 && Math.random() < 0.15) {
                fireflies.push({
                    x: Math.random() * W,
                    y: H * (0.30 + Math.random() * 0.45),
                    phase: Math.random() * 6.28,
                    r: 1.2 + Math.random() * 1.6,
                    life: 200 + Math.floor(Math.random() * 260),
                });
            }
            ctx.globalAlpha = 0.12 + 0.10 * (p.n - 0.60) / 0.32;
            ctx.fillStyle = "rgba(220,255,170,0.9)";
            for (let i = fireflies.length - 1; i >= 0; i--) {
                const f = fireflies[i];
                f.life--;
                f.phase += 0.03;
                f.x += Math.sin(f.phase) * 0.18;
                f.y += Math.cos(f.phase * 0.9) * 0.12;
                if (f.life <= 0 || f.x < -50 || f.x > W + 50) { fireflies.splice(i, 1); continue; }
                const a = 0.55 + 0.45 * Math.sin(f.phase);
                ctx.globalAlpha = (0.08 + 0.16 * a) * clamp((p.n - 0.60) / 0.32, 0, 1);
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Lakes are optional (currently disabled). Keep the hook so they can be
        // re-enabled later without touching the renderer.
        if (lakes && typeof lakes.draw === "function") {
            ctx.globalAlpha = 1;
            lakes.draw(ctx, near, p, H);
            ctx.globalAlpha = 1;
        }
    }

    // Soft ground fog (only at night). Draw this AFTER the ground fill and BEFORE entities.
    

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


    function getNight() {
        return palette().n;
    }

    return { palette, drawSky, drawParallax, drawGroundFog, drawOcean, nightFactor: getNight };
}
