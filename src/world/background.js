import { clamp, lerp, smoothstep } from "../core/util.js";
import { getTheme } from "./themes.js";
import { nightFactor } from "./daynight.js";

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

function drawSpaceSky(ctx, W, H, sp, tick, themeKey, reducedMotion = false) {
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

        if (!(sp?.active && sp.mode === "rocket" && sp.phase === "travel")) {
            // Landing markings belong to the Mars run/arrival, not the flight itself.
            ctx.globalAlpha = 0.14;
            ctx.fillStyle = "rgba(20,10,12,0.9)";
            const padY = H * 0.78;
            ctx.fillRect(W * 0.12, padY, W * 0.76, H * 0.18);
            ctx.globalAlpha = 0.22;
            ctx.strokeStyle = "rgba(255,220,210,0.45)";
            ctx.lineWidth = 3;
            const hx = W * 0.50, hy = padY + 36;
            ctx.beginPath();
            ctx.moveTo(hx - 22, hy); ctx.lineTo(hx + 22, hy);
            ctx.moveTo(hx - 18, hy - 18); ctx.lineTo(hx - 18, hy + 18);
            ctx.moveTo(hx + 18, hy - 18); ctx.lineTo(hx + 18, hy + 18);
            ctx.stroke();
        }

        // sparse dust motes
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        for (let i = 0; i < 26; i++) {
            const x = (i * 91 + (reducedMotion ? 0 : tick * 0.35)) % W;
            const y = (i * 57) % Math.floor(H * 0.60);
            ctx.fillRect(x, y, 2, 1);
        }
        ctx.restore();

        // Phobos-like moon and a thin orbital arc give the Mars run a stable landmark.
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = "rgba(255,198,166,.72)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(W * 0.22, H * 0.23, 76, 20, -0.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(225,170,145,.88)";
        ctx.beginPath();
        ctx.arc(W * 0.18, H * 0.19, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // stars (deterministic-ish)
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const seed = reducedMotion ? 0 : (sp?.t ?? 0) + (sp?.phaseT ?? 0) * 0.5 + tick * 0.01;
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
        const px = W * (0.78 - p * 0.08);
        const py = H * (0.29 - p * 0.02);
        const radius = Math.min(42, W * 0.055);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = (themeKey === "mars") ? "rgba(210,110,70,0.95)" : "rgba(160,120,255,0.95)";
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath();
        ctx.arc(px - radius * 0.33, py - radius * 0.24, radius * 0.24, 0, Math.PI * 2);
        ctx.arc(px + radius * 0.24, py + radius * 0.19, radius * 0.17, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
export function createBackground(getW, getH, lakes, game, hud) {
    const paletteScratch = {};

    function palette() {
        // Theme-based palette + optional crossfade
        const forceOcean = (game.setpiece?.active && game.setpiece?.mode === "ocean" && game.setpiece?.phase === "travel");
        const t = game.themeFade;
        const cur = getTheme(forceOcean ? "ocean" : game.theme);
        let source = cur.palette || {};

        if (!forceOcean && t?.active && t.from && t.to && t.dur > 0) {
            const a = getTheme(t.from).palette || {};
            const b = getTheme(t.to).palette || {};
            const u = clamp(t.t / t.dur, 0, 1);
            const uu = smoothstep(u);
            source = {
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

        // Reuse one result object without mutating the theme-owned palette.
        const pal = paletteScratch;
        pal.key = source.key ?? cur.key;
        pal.label = source.label ?? cur.label;
        pal.skyTop = source.skyTop || [150, 210, 255];
        pal.skyBot = source.skyBot || [235, 245, 255];
        pal.far = source.far || [70, 95, 135];
        pal.forest = source.forest || [50, 135, 95];
        pal.ground = source.ground || [95, 170, 92];
        pal.grass = source.grass || pal.ground;
        pal.ocean = source.ocean || [60, 150, 200];

        // ground opacity: make ground more opaque during ocean/setpiece so water doesn't bleed through
        const isOcean = (game.theme === "ocean") || (game.themeFade?.active && game.themeFade?.to === "ocean");
        pal.groundAlpha = (game.setpiece?.active || isOcean) ? 0.92 : (source.groundAlpha ?? 0.45);

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
        pal.n = Number.isFinite(game.nightOverride)
            ? clamp(game.nightOverride, 0, 1)
            : nightFactor(game.tick, game.score);
        return pal;
    }

    function drawSkyIdentity(ctx, themeKey) {
        const W = getW(), H = getH();
        ctx.save();
        if (themeKey === "forest") {
            const glow = ctx.createRadialGradient(W * 0.72, H * 0.18, 4, W * 0.72, H * 0.18, H * 0.34);
            glow.addColorStop(0, "rgba(255,248,204,.28)");
            glow.addColorStop(1, "rgba(255,248,204,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, W, H * 0.65);
        } else if (themeKey === "jungle") {
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = "rgba(230,255,222,.9)";
            for (let i = 0; i < 4; i++) {
                const x = W * (0.14 + i * 0.25);
                ctx.beginPath();
                ctx.moveTo(x, 0); ctx.lineTo(x + 90, 0); ctx.lineTo(x + 210, H * 0.62); ctx.lineTo(x + 130, H * 0.62);
                ctx.closePath(); ctx.fill();
            }
        } else if (themeKey === "island" || themeKey === "ocean") {
            ctx.globalAlpha = 0.34;
            ctx.fillStyle = "rgba(255,238,174,.94)";
            ctx.beginPath();
            ctx.arc(W * 0.76, H * 0.22, themeKey === "island" ? 32 : 24, 0, Math.PI * 2);
            ctx.fill();
        } else if (themeKey === "mountain") {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = "rgba(255,255,255,.9)";
            ctx.beginPath();
            ctx.ellipse(W * 0.68, H * 0.2, W * 0.22, 18, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (themeKey === "cliff") {
            const glow = ctx.createLinearGradient(0, 0, W, H * 0.55);
            glow.addColorStop(0, "rgba(255,255,255,.16)");
            glow.addColorStop(0.45, "rgba(255,255,255,0)");
            glow.addColorStop(1, "rgba(80,120,160,.14)");
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, W, H * 0.6);
        } else if (themeKey === "city") {
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = "rgba(255,214,154,.9)";
            ctx.fillRect(0, H * 0.47, W, 2);
        } else if (themeKey === "desert") {
            ctx.globalAlpha = 0.48;
            ctx.fillStyle = "rgba(255,236,173,.98)";
            ctx.beginPath();
            ctx.arc(W * 0.78, H * 0.21, Math.min(44, W * 0.045), 0, Math.PI * 2);
            ctx.fill();
        } else if (themeKey === "volcano") {
            const glow = ctx.createRadialGradient(W * 0.7, H * 0.62, 8, W * 0.7, H * 0.62, H * 0.46);
            glow.addColorStop(0, "rgba(255,105,42,.34)");
            glow.addColorStop(1, "rgba(255,105,42,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, W, H * 0.82);
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = "rgba(48,40,48,.9)";
            ctx.beginPath();
            ctx.ellipse(W * 0.64, H * 0.17, W * 0.19, 22, -0.12, 0, Math.PI * 2);
            ctx.ellipse(W * 0.76, H * 0.22, W * 0.16, 18, 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawLandmark(ctx, themeKey, p, motion, alpha = 1) {
        const W = getW(), H = getH();
        const x = W * 0.7 - (motion % (W * 1.6));
        const base = H * 0.66;
        ctx.save();
        ctx.globalAlpha = 0.34 * alpha;
        ctx.fillStyle = `rgb(${p.far[0]},${p.far[1]},${p.far[2]})`;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 3;

        if (themeKey === "forest") {
            const lx = ((x % (W + 520)) + W + 520) % (W + 520) - 130;
            ctx.fillRect(lx, base - 56, 58, 56);
            ctx.beginPath();
            ctx.moveTo(lx - 12, base - 54); ctx.lineTo(lx + 29, base - 88); ctx.lineTo(lx + 70, base - 54); ctx.fill();
            ctx.fillStyle = "rgba(255,230,155,.72)";
            ctx.fillRect(lx + 12, base - 38, 10, 12);
        } else if (themeKey === "jungle") {
            const lx = W * 0.66 - (motion * 0.12 % (W + 280));
            ctx.fillRect(lx, base - 114, 16, 114);
            ctx.beginPath();
            ctx.arc(lx + 8, base - 120, 64, 0, Math.PI * 2);
            ctx.arc(lx - 42, base - 105, 45, 0, Math.PI * 2);
            ctx.arc(lx + 55, base - 98, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(lx + 56, base - 118); ctx.quadraticCurveTo(lx + 76, base - 70, lx + 62, base - 28); ctx.stroke();
        } else if (themeKey === "mountain") {
            const lx = W * 0.57 - (motion * 0.08 % (W + 420));
            ctx.beginPath();
            ctx.moveTo(lx - 150, base); ctx.lineTo(lx, base - H * 0.34); ctx.lineTo(lx + 170, base); ctx.fill();
            ctx.globalAlpha *= 0.66;
            ctx.fillStyle = "rgba(245,250,255,.94)";
            ctx.beginPath();
            ctx.moveTo(lx - 49, base - H * 0.23); ctx.lineTo(lx, base - H * 0.34); ctx.lineTo(lx + 48, base - H * 0.24);
            ctx.lineTo(lx + 15, base - H * 0.26); ctx.lineTo(lx - 8, base - H * 0.24); ctx.closePath(); ctx.fill();
        } else if (themeKey === "cliff") {
            const lx = W * 0.74 - (motion * 0.1 % (W + 520));
            const stacks = [
                { x: lx - 78, w: 42, h: 132 },
                { x: lx - 22, w: 34, h: 92 },
                { x: lx + 28, w: 48, h: 154 },
            ];
            for (const stack of stacks) {
                ctx.beginPath();
                ctx.moveTo(stack.x, base); ctx.lineTo(stack.x + 7, base - stack.h + 24);
                ctx.lineTo(stack.x + stack.w * 0.55, base - stack.h);
                ctx.lineTo(stack.x + stack.w, base); ctx.closePath(); ctx.fill();
            }
        } else if (themeKey === "city") {
            const lx = W * 0.68 - (motion * 0.13 % (W + 420));
            ctx.fillRect(lx, base - 150, 54, 150);
            ctx.fillRect(lx + 17, base - 188, 20, 38);
            ctx.beginPath(); ctx.moveTo(lx + 27, base - 188); ctx.lineTo(lx + 27, base - 226); ctx.stroke();
            ctx.globalAlpha *= 0.65;
            ctx.fillStyle = "rgba(255,224,145,.9)";
            for (let wy = base - 132; wy < base - 18; wy += 22) ctx.fillRect(lx + 12, wy, 30, 5);
        } else if (themeKey === "desert") {
            const lx = W * 0.62 - (motion * 0.07 % (W + 520));
            ctx.beginPath();
            ctx.moveTo(lx - 130, base); ctx.lineTo(lx - 90, base - 74); ctx.lineTo(lx + 22, base - 74);
            ctx.lineTo(lx + 72, base - 32); ctx.lineTo(lx + 130, base); ctx.closePath(); ctx.fill();
        } else if (themeKey === "volcano") {
            const lx = W * 0.68 - (motion * 0.06 % (W + 620));
            ctx.beginPath();
            ctx.moveTo(lx - 190, base); ctx.lineTo(lx - 42, base - 178);
            ctx.quadraticCurveTo(lx, base - 202, lx + 45, base - 176);
            ctx.lineTo(lx + 205, base); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 0.72 * alpha;
            ctx.strokeStyle = "rgba(255,93,35,.9)";
            ctx.lineWidth = 7;
            ctx.beginPath(); ctx.moveTo(lx + 4, base - 181); ctx.quadraticCurveTo(lx - 16, base - 118, lx + 34, base - 42); ctx.stroke();
            ctx.globalAlpha = 0.48 * alpha;
            ctx.strokeStyle = "rgba(255,196,72,.95)";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(lx + 4, base - 181); ctx.quadraticCurveTo(lx - 14, base - 116, lx + 34, base - 42); ctx.stroke();
        } else if (themeKey === "island") {
            const lx = W * 0.72 - (motion * 0.08 % (W + 620));
            ctx.fillRect(lx, base - 76, 24, 76);
            ctx.fillStyle = "rgba(245,238,220,.88)";
            ctx.fillRect(lx + 3, base - 66, 18, 50);
            ctx.fillStyle = "rgba(212,82,68,.88)";
            ctx.beginPath(); ctx.moveTo(lx - 4, base - 76); ctx.lineTo(lx + 12, base - 94); ctx.lineTo(lx + 28, base - 76); ctx.fill();
        } else if (themeKey === "ocean") {
            const lx = W * 0.72 - (motion * 0.18 % (W + 420));
            ctx.beginPath(); ctx.moveTo(lx, base - 18); ctx.lineTo(lx + 60, base - 18); ctx.lineTo(lx + 48, base); ctx.lineTo(lx + 8, base); ctx.fill();
            ctx.beginPath(); ctx.moveTo(lx + 30, base - 20); ctx.lineTo(lx + 30, base - 84); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(lx + 32, base - 78); ctx.lineTo(lx + 68, base - 36); ctx.lineTo(lx + 32, base - 36); ctx.fill();
        }
        ctx.restore();
    }

    function drawWorldLandmarks(ctx, themeKey, p, motion) {
        const fade = game.themeFade;
        if (fade?.active && fade.dur > 0) {
            const u = smoothstep(clamp(fade.t / fade.dur, 0, 1));
            drawLandmark(ctx, fade.from || themeKey, p, motion, 1 - u);
            drawLandmark(ctx, fade.to || themeKey, p, motion, u);
            return;
        }
        drawLandmark(ctx, themeKey, p, motion, 1);
    }

    function drawForeground(ctx) {
        if (game.setpiece?.active || game.presentation?.blocking) return;
        const W = getW(), H = getH();
        const themeKey = getTheme(game.theme)?.key || game.theme || "forest";
        const t = game.tick * 0.025;
        ctx.save();
        if (themeKey === "forest" || themeKey === "jungle") {
            ctx.globalAlpha = themeKey === "jungle" ? 0.18 : 0.1;
            ctx.fillStyle = themeKey === "jungle" ? "rgba(5,58,42,.95)" : "rgba(18,62,47,.9)";
            for (const side of [-1, 1]) {
                ctx.save();
                ctx.translate(side < 0 ? 0 : W, 0);
                ctx.scale(side, 1);
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.ellipse(18 + i * 24, 12 + i * 15 + Math.sin(t + i) * 3, 46, 16, 0.45, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        } else if (themeKey === "city") {
            ctx.globalAlpha = 0.16;
            ctx.strokeStyle = "rgba(22,31,44,.9)";
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, H * 0.17); ctx.quadraticCurveTo(W * 0.5, H * 0.23, W, H * 0.14); ctx.stroke();
        } else if (themeKey === "volcano") {
            ctx.globalAlpha = 0.42;
            for (let i = 0; i < 16; i++) {
                const drift = game.reducedMotion ? 0 : game.tick * (0.4 + (i % 3) * 0.12);
                const x = ((i * 83 - drift) % (W + 100) + W + 100) % (W + 100) - 50;
                const y = H * (0.2 + ((i * 47) % 55) / 100);
                ctx.fillStyle = i % 3 === 0 ? "rgba(255,204,92,.9)" : "rgba(255,91,40,.76)";
                ctx.fillRect(x, y, 2 + (i % 2), 2 + (i % 2));
            }
        } else if (themeKey === "desert" || themeKey === "mars") {
            ctx.globalAlpha = themeKey === "mars" ? 0.12 : 0.1;
            ctx.strokeStyle = themeKey === "mars" ? "rgba(255,180,150,.8)" : "rgba(255,248,218,.9)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const y = H * (0.72 + i * 0.045);
                const x = ((i * 250 - game.tick * 1.2) % (W + 260)) - 130;
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 120, y - 5); ctx.stroke();
            }
        } else if (themeKey === "mountain" || themeKey === "cliff") {
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = "rgba(245,250,255,.9)";
            ctx.beginPath();
            ctx.ellipse(W * 0.88, H * 0.16 + Math.sin(t) * 4, W * 0.2, 14, -0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }


  function drawSky(ctx) {

        const W = getW(), H = getH();
        const p = palette();
        const themeKey = getTheme(game.theme)?.key || game.theme || "forest";
        if (hud && typeof hud.setBiome === "function") hud.setBiome(p.label);

        // Space sky: rocket beat OR mars theme
        const rocketTravel = game.setpiece?.active
            && game.setpiece?.mode === "rocket"
            && game.setpiece?.phase === "travel";
        if (themeKey === "mars" && !rocketTravel) {
            drawSpaceSky(ctx, W, H, game.setpiece, game.tick, p.key, game.reducedMotion);
            return;
        }

        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgb(${p.skyTop[0]},${p.skyTop[1]},${p.skyTop[2]})`);
        g.addColorStop(1, `rgb(${p.skyBot[0]},${p.skyBot[1]},${p.skyBot[2]})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        drawSkyIdentity(ctx, themeKey);

        const rocketArrival = game.setpiece?.active
            && game.setpiece?.mode === "rocket"
            && game.setpiece?.phase === "arrive";
        if (rocketArrival) {
            const target = travelPalette(game.setpiece.targetTheme || themeKey);
            const alpha = 1 - smoothstep(clamp((game.setpiece.phaseProgress ?? 0) / 0.45, 0, 1));
            const radius = Math.min(42, W * 0.055);
            ctx.save();
            ctx.globalAlpha = alpha * 0.94;
            ctx.fillStyle = `rgb(${target.ground[0]},${target.ground[1]},${target.ground[2]})`;
            ctx.beginPath(); ctx.arc(W * 0.78, H * 0.29, radius, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

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
    ctx.lineTo(Wv, Hv * 0.62 + Math.sin((Wv + far) * 0.018) * 10 + Math.sin((Wv + far) * 0.006) * 14);
    ctx.lineTo(Wv, Hv); ctx.lineTo(0, Hv);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (themeKey === "volcano") {
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = `rgba(${p.far[0]},${p.far[1]},${p.far[2]},0.62)`;
    ctx.beginPath();
    ctx.moveTo(0, Hv * 0.63);
    for (let x = 0; x <= Wv; x += 44) {
      const ridge = ((Math.floor((x + far) / 44) * 37) % 5) * 8;
      ctx.lineTo(x, Hv * 0.63 - ridge + Math.sin((x + far) * 0.014) * 9);
    }
    ctx.lineTo(Wv, Hv); ctx.lineTo(0, Hv); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (themeKey === "ocean" || themeKey === "island") {
    // Ocean/Island: flat horizon band (no mountains)
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = `rgba(${p.far[0]},${p.far[1]},${p.far[2]},0.22)`;
    ctx.fillRect(0, Hv * 0.52, Wv, Hv * 0.12);
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
    ctx.lineTo(Wv, Hv * 0.58 + Math.sin((Wv + far) * 0.025) * 18 + Math.sin((Wv + far) * 0.012) * 26);
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
  drawWorldLandmarks(ctx, themeKey, p, mid);
  if (themeKey === "forest") {
    // forest triangles
    ctx.globalAlpha = 0.60;
    ctx.fillStyle = `rgba(${p.forest[0]},${p.forest[1]},${p.forest[2]},0.42)`;
    for (let x = -30; x < Wv + 60; x += 28) {
      const baseY = Hv * 0.70 + Math.sin((x + mid) * 0.02) * 8;
      const hh = Math.min(42 + (Math.sin((x + mid) * 0.06) * 10), baseY - 8);
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x + 14, baseY - hh);
      ctx.lineTo(x + 28, baseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (themeKey === "jungle") {
    const baseY = Hv * 0.72;
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = `rgba(${p.forest[0]},${p.forest[1]},${p.forest[2]},0.46)`;
    for (let i = 0; i < 13; i++) {
      const x = ((i * 92) - (mid * 0.24)) % (Wv + 170) - 85;
      const h = 42 + (i % 4) * 13;
      ctx.fillRect(x + 24, baseY - h, 7, h);
      ctx.beginPath();
      ctx.ellipse(x + 27, baseY - h, 38 + (i % 2) * 8, 16, (i % 2 ? -0.12 : 0.14), 0, Math.PI * 2);
      ctx.ellipse(x + 5, baseY - h + 10, 25, 13, -0.3, 0, Math.PI * 2);
      ctx.ellipse(x + 50, baseY - h + 8, 27, 14, 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (themeKey === "island") {
    // palms only (no forest trees)
    // add sea line for beach feel
    const seaY = Hv * 0.78;
    ctx.globalAlpha = 0.60;
    ctx.fillStyle = `rgba(${p.ocean[0]},${p.ocean[1]},${p.ocean[2]},0.42)`;
    ctx.fillRect(0, seaY, Wv, Hv - seaY);
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = `rgba(${p.forest[0]},${p.forest[1]},${p.forest[2]},0.35)`;
    const baseY = Hv * 0.71;
    for (let i = 0; i < 12; i++) {
      const x = ((i * 86) - (mid * 0.22)) % (Wv + 140) - 70;
      const h = Math.min(44 + ((i * 19) % 26), baseY - 8);
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
  } else if (themeKey === "ocean") {
    // ocean: visible sea with gentle waves
    const seaY = Hv * 0.72;
    ctx.globalAlpha = 0.70;
    ctx.fillStyle = `rgba(${p.ocean[0]},${p.ocean[1]},${p.ocean[2]},0.55)`;
    ctx.fillRect(0, seaY, Wv, Hv - seaY);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const y = seaY + 18 + k * 22;
      ctx.beginPath();
      for (let x = 0; x <= Wv; x += 24) {
        const yy = y + Math.sin((x + mid) * 0.04 + k) * 3;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (themeKey === "city") {
    // skyline with subtle windows
    const baseY = Hv * 0.72;
    ctx.globalAlpha = 0.50;
    ctx.fillStyle = `rgba(${Math.max(0, p.far[0] - 10)},${Math.max(0, p.far[1] - 10)},${Math.max(0, p.far[2] - 10)},0.55)`;
    for (let i = 0; i < 18; i++) {
      const x = ((i * 78) - (mid * 0.28)) % (Wv + 120) - 60;
      const bw = 36 + (i % 3) * 10;
      const bh = Math.min(40 + ((i * 17) % 60), baseY - 8);
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
  } else if (themeKey === "volcano") {
    const lavaY = Hv * 0.73;
    const lava = ctx.createLinearGradient(0, lavaY, 0, Hv);
    lava.addColorStop(0, "rgba(255,126,37,.72)");
    lava.addColorStop(0.34, "rgba(226,55,22,.78)");
    lava.addColorStop(1, "rgba(95,24,26,.86)");
    ctx.fillStyle = lava;
    ctx.fillRect(0, lavaY, Wv, Hv - lavaY);
    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = "rgba(255,220,106,.9)";
    ctx.lineWidth = 2;
    for (let line = 0; line < 4; line++) {
      const y = lavaY + 13 + line * 19;
      ctx.beginPath();
      for (let x = 0; x <= Wv; x += 22) {
        const yy = y + Math.sin((x + mid) * 0.045 + line * 1.7) * 3;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
    ctx.lineTo(Wv, Hv * 0.72 + Math.sin((Wv + mid) * 0.02) * 10 + Math.sin((Wv + mid) * 0.006) * 18);
    ctx.lineTo(Wv, Hv); ctx.lineTo(0, Hv);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawHighClouds(ctx, near, p.n ?? 0, themeKey);
}

function drawHighClouds(ctx, near, night, themeKey) {
    const W = getW(), H = getH();
    const band = game.vertical?.band ?? "ground";
    if (band === "ground") return;

    const strength = (band === "air") ? 0.22 : 0.14;
    ctx.save();
    ctx.globalAlpha = strength * (1 - night * 0.25);
    ctx.fillStyle = themeKey === "volcano" ? "rgba(58,49,57,.82)" : "rgba(255,255,255,0.8)";
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

    const t = game.reducedMotion ? 0 : game.tick * 0.03;
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
        const x = ((i * 340) - (game.reducedMotion ? 0 : game.tick * 0.22)) % (Wv + 420) - 210;
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
            const phase = (game.reducedMotion ? 0 : game.tick * 0.038) + k * 55;
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
            const rx = (i * 140 + (game.reducedMotion ? 0 : game.tick * 2.2)) % (Wv + 220) - 110;
            const ry = horizonY + 36 + (i % 3) * 44;
            ctx.fillRect(rx, ry, 40, 2);
        }

        ctx.restore();
    }

    function travelPalette(themeKey) {
        const source = getTheme(themeKey)?.palette || {};
        return {
            skyTop: source.skyTop || [150, 210, 255],
            skyBot: source.skyBot || [235, 245, 255],
            far: source.far || [70, 95, 135],
            ground: source.ground || [95, 170, 92],
            ocean: source.ocean || [45, 145, 190],
        };
    }

    function fillTravelSky(ctx, top, bottom) {
        const H = getH();
        const gradient = ctx.createLinearGradient(0, 0, 0, H);
        gradient.addColorStop(0, `rgb(${top[0]},${top[1]},${top[2]})`);
        gradient.addColorStop(1, `rgb(${bottom[0]},${bottom[1]},${bottom[2]})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, getW(), H);
    }

    function drawOceanTravel(ctx, setpiece = game.setpiece) {
        const W = getW(), H = getH();
        const u = clamp(setpiece?.phaseProgress ?? 0, 0, 1);
        const origin = travelPalette(setpiece?.originTheme || "forest");
        const target = travelPalette(setpiece?.targetTheme || "island");
        const ocean = travelPalette("ocean");
        const seaMix = smoothstep(clamp(u / 0.28, 0, 1));

        fillTravelSky(ctx, mixRGB(origin.skyTop, ocean.skyTop, seaMix), mixRGB(origin.skyBot, ocean.skyBot, seaMix));
        drawOcean(ctx);

        // The departure coast remains visible long enough to establish direction.
        const originAlpha = 1 - smoothstep(clamp(u / 0.34, 0, 1));
        if (originAlpha > 0) {
            const sink = smoothstep(clamp(u / 0.34, 0, 1));
            const horizon = lerp(H * 0.67, H * 0.9, sink);
            const edge = lerp(W * 0.62, W * 0.24, sink);
            ctx.save();
            ctx.globalAlpha = originAlpha;
            ctx.fillStyle = `rgb(${origin.ground[0]},${origin.ground[1]},${origin.ground[2]})`;
            ctx.beginPath();
            ctx.moveTo(0, horizon - 22);
            ctx.quadraticCurveTo(edge * 0.35, horizon - 74 * (1 - sink), edge, horizon);
            ctx.lineTo(edge, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
            ctx.globalAlpha *= 0.55;
            ctx.fillStyle = `rgb(${origin.far[0]},${origin.far[1]},${origin.far[2]})`;
            ctx.beginPath();
            ctx.moveTo(0, horizon - 18); ctx.quadraticCurveTo(edge * 0.5, horizon - 64, edge * 0.9, horizon); ctx.lineTo(0, horizon); ctx.fill();
            ctx.restore();
        }

        // The destination enters before Arrival so origin and target share the scene briefly.
        const destinationAlpha = smoothstep(clamp((u - 0.62) / 0.38, 0, 1));
        if (destinationAlpha > 0) {
            const width = lerp(W * 0.12, W * 0.42, destinationAlpha);
            const horizon = H * 0.62;
            ctx.save();
            ctx.globalAlpha = destinationAlpha * 0.82;
            ctx.fillStyle = `rgb(${target.far[0]},${target.far[1]},${target.far[2]})`;
            ctx.beginPath();
            ctx.moveTo(0, horizon - 12);
            ctx.quadraticCurveTo(width * 0.38, horizon - 42 * destinationAlpha, width, horizon + 8);
            ctx.lineTo(width, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
            ctx.globalAlpha *= 0.7;
            ctx.fillStyle = `rgb(${target.ground[0]},${target.ground[1]},${target.ground[2]})`;
            ctx.beginPath();
            ctx.moveTo(0, horizon + 2);
            ctx.quadraticCurveTo(width * 0.36, horizon - 18 * destinationAlpha, width * 0.72, horizon + 4);
            ctx.lineTo(width * 0.72, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }

    function drawRocketTravel(ctx, setpiece = game.setpiece) {
        const W = getW(), H = getH();
        const u = clamp(setpiece?.phaseProgress ?? 0, 0, 1);
        const originKey = setpiece?.originTheme || "island";
        const targetKey = setpiece?.targetTheme || "mars";
        const origin = travelPalette(originKey);
        const target = travelPalette(targetKey);
        const spaceU = smoothstep(clamp((u - 0.2) / 0.5, 0, 1));

        fillTravelSky(
            ctx,
            mixRGB(origin.skyTop, [5, 10, 20], spaceU),
            mixRGB(origin.skyBot, [20, 10, 30], spaceU),
        );

        const originAlpha = 1 - smoothstep(clamp((u - 0.02) / 0.58, 0, 1));
        const ascent = smoothstep(clamp((u - 0.08) / 0.7, 0, 1));
        const originHorizon = clamp(setpiece?.originSurfaceY ?? H * 0.78, H * 0.64, H * 0.78);
        const horizon = lerp(originHorizon, H * 1.14, ascent);
        if (originAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = originAlpha;
            if (originKey === "island" || originKey === "ocean") {
                const sea = origin.ocean;
                const water = ctx.createLinearGradient(0, horizon, 0, H);
                water.addColorStop(0, `rgba(${sea[0]},${sea[1]},${sea[2]},.58)`);
                water.addColorStop(1, `rgba(${Math.max(0, sea[0] - 24)},${Math.max(0, sea[1] - 48)},${Math.max(0, sea[2] - 44)},.88)`);
                ctx.fillStyle = water;
                ctx.fillRect(0, horizon, W, Math.max(0, H - horizon));
                ctx.fillStyle = `rgb(${origin.ground[0]},${origin.ground[1]},${origin.ground[2]})`;
                ctx.beginPath();
                ctx.moveTo(0, horizon + 6); ctx.quadraticCurveTo(W * 0.22, horizon - 42 * (1 - ascent), W * 0.48, horizon + 4);
                ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
            } else {
                ctx.fillStyle = `rgb(${origin.ground[0]},${origin.ground[1]},${origin.ground[2]})`;
                ctx.beginPath();
                ctx.arc(W * 0.5, horizon + H * 0.82, H * 0.92, Math.PI, Math.PI * 2);
                ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
            }
            ctx.globalAlpha *= 0.5;
            ctx.strokeStyle = "rgba(255,255,255,.75)";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(W, horizon); ctx.stroke();
            ctx.restore();
        }

        // Atmosphere thins gradually; stars never replace spatial information abruptly.
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,.92)";
        const starDrift = game.reducedMotion ? 0 : (setpiece?.t ?? 0) * 0.012;
        for (let i = 0; i < 76; i++) {
            const x = (Math.sin((i + 1) * 741 + starDrift) * 0.5 + 0.5) * W;
            const y = (Math.sin((i + 1) * 991 + starDrift * 0.7) * 0.5 + 0.5) * H;
            ctx.globalAlpha = spaceU * (0.24 + (i % 7) * 0.07);
            ctx.fillRect(x, y, 1 + (i % 3 === 0 ? 1 : 0), 1 + (i % 5 === 0 ? 1 : 0));
        }
        ctx.restore();

        const destinationAlpha = smoothstep(clamp((u - 0.56) / 0.44, 0, 1));
        if (destinationAlpha > 0) {
            const radius = lerp(10, Math.min(42, W * 0.055), destinationAlpha);
            const px = lerp(W * 0.9, W * 0.78, destinationAlpha);
            const py = lerp(H * 0.2, H * 0.29, destinationAlpha);
            ctx.save();
            ctx.globalAlpha = destinationAlpha * 0.94;
            ctx.fillStyle = `rgb(${target.ground[0]},${target.ground[1]},${target.ground[2]})`;
            ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha *= 0.3;
            ctx.fillStyle = "rgba(0,0,0,.8)";
            ctx.beginPath(); ctx.arc(px - radius * 0.3, py - radius * 0.2, radius * 0.22, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

function boundaryX(maskX, y) {
  const H = getH();
  const wave = Math.sin((y / Math.max(1, H)) * Math.PI * 4.5) * 7
    + Math.sin((y / Math.max(1, H)) * Math.PI * 9.5) * 2;
  return clamp((maskX ?? 0) + wave, 0, getW());
}

function clipLand(ctx, maskX) {
  const H = getH();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(boundaryX(maskX, 0), 0);
  for (let y = 20; y <= H; y += 20) ctx.lineTo(boundaryX(maskX, y), y);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();
}

function drawOceanEdge(ctx, maskX) {
  const W = getW(), H = getH();
  const mx = clamp(maskX ?? W, 0, W);
  if (mx < 10 || mx > W - 10) return;
  const mist = ctx.createLinearGradient(mx - 42, 0, mx + 42, 0);
  mist.addColorStop(0, "rgba(225,245,255,0)");
  mist.addColorStop(0.5, "rgba(225,245,255,.14)");
  mist.addColorStop(1, "rgba(225,245,255,0)");
  ctx.save();
  ctx.fillStyle = mist;
  ctx.fillRect(mx - 42, 0, 84, H);
  ctx.restore();
}

function drawOceanMasked(ctx, maskX) {
  const W = getW(), H = getH();
  const mx = clamp(maskX ?? 0, 0, W);
  if (mx >= W) return; // fully masked (no ocean)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(boundaryX(mx, 0), 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, H);
  for (let y = H; y >= 0; y -= 20) ctx.lineTo(boundaryX(mx, y), y);
  ctx.closePath();
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
    const tt = game.reducedMotion ? 0 : game.tick * 0.55;
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
  // animated foam dots follow the same organic boundary as both scene clips
  const t = game.reducedMotion ? 0 : game.tick * 0.25;
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const step = 36;
  for (let y = getH() * 0.55; y < H; y += step) {
    const yy = y + Math.sin((y * 0.06) + (t * 0.12)) * 6;
    const r = 3 + (Math.sin((y + t) * 0.08) + 1) * 1.2;
    const xx = boundaryX(mx, yy) + 3 + Math.sin((yy + t) * 0.05) * 4;
    ctx.beginPath();
    ctx.arc(xx, yy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}



    function getNight() {
        return palette().n;
    }

    return {
        palette, drawSky, drawParallax, drawForeground, drawGroundFog,
    drawOcean, drawOceanMasked, drawOceanTravel, drawRocketTravel, clipLand, drawOceanEdge,
        nightFactor: getNight,
    };
}
