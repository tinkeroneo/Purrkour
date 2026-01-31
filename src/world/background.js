import { BIOMES, biomeIndexForScore } from "./biomes.js";
import { nightFactor } from "./daynight.js";
import { lerp } from "../core/util.js";
const fireflies = []; // {x,y,phase,r,life}

function mixRGB(a, b, t) {
    return [
        Math.round(lerp(a[0], b[0], t)),
        Math.round(lerp(a[1], b[1], t)),
        Math.round(lerp(a[2], b[2], t)),
    ];
}

export function createBackground(getW, getH, lakes, game, hud) {
    const W = () => getW();
    const H = () => getH();

    function currentBiome() {
        return BIOMES[biomeIndexForScore(game.score)];
    }

    function palette() {
        const biome = currentBiome();
        const n = nightFactor(game.tick, game.score);
        const day = biome.day, night = biome.night;
        const p = {
            key: biome.key,
            label: biome.label,
            n,
            skyTop: mixRGB(day.skyTop, night.skyTop, n),
            skyBot: mixRGB(day.skyBot, night.skyBot, n),
            far: mixRGB(day.far, night.far, n),
            forest: mixRGB(day.forest, night.forest, n),
            lake: mixRGB(day.lake, night.lake, n),
            ground: mixRGB(day.ground, night.ground, n),
            lakeChance: biome.lakeChance
        };
        return p;
    }

    function drawSky(ctx) {
        const W = getW(), H = getH();
        const p = palette();
        hud.setBiome(p.label);

        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgb(${p.skyTop[0]},${p.skyTop[1]},${p.skyTop[2]})`);
        g.addColorStop(1, `rgb(${p.skyBot[0]},${p.skyBot[1]},${p.skyBot[2]})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

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
        const far = (game.score * 6 + tick) * 0.10;
        const mid = (game.score * 9 + tick) * 0.18;
        const near = (game.score * 13 + tick) * 0.26;

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

        // Lakes are optional (currently disabled). Keep the hook so they can be
        // re-enabled later without touching the renderer.
        if (lakes && typeof lakes.draw === "function") {
            ctx.globalAlpha = 1;
            lakes.draw(ctx, near, p, H);
            ctx.globalAlpha = 1;
        }
    }

    // Soft ground fog (only at night). Draw this AFTER the ground fill and BEFORE entities.
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


    return { palette, drawSky, drawParallax, drawGroundFog, drawOcean, currentBiome };
}

