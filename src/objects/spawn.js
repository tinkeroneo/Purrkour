import { clamp } from "../core/util.js";
import { getTheme } from "../world/themes.js";
import { nightFactor } from "../world/daynight.js";


export function createSpawner(game, terrain, objects, canvas) {
  // calmer start tuning
  const CALM = {
    gapBase: 300,
    gapMin: 200,
    gapSlope: 1.1,
    closeGapStartScore: 70,
    closeGapChanceMax: 0.05,
    staircaseChance: 0.36,
    staircaseMin: 2,
    staircaseMax: 3,
    collectiblesScale: 0.80,
    animalsScale: 0.82,
  };

  let nextSpawnIn = 260;

  const HOME_SCORE = 280;

  function minGapForScore(s) {
    return clamp(CALM.gapBase - s * CALM.gapSlope, CALM.gapMin, CALM.gapBase);
  }
  function closeGapChance(s) {
    if (s < CALM.closeGapStartScore) return 0;
    return CALM.closeGapChanceMax;
  }

  function reset() { nextSpawnIn = 260; }

  function spawnBlanket(spawnX) {
    const surf = terrain.surfaceAt(spawnX);
    objects.add({ kind: "checkpoint", type: "blanket", x: spawnX, y: surf - 16, w: 62, h: 16, used: false, yMode: "ground", yOffset: -16 });
  }

  function spawnPack(spawnX, safeMode = false) {
    const theme = getTheme(game.theme);
    const sm = theme.spawns || {};
    const m = (k) => (Number.isFinite(sm[k]) ? sm[k] : 1);
    const gapMin = minGapForScore(game.score);
    const allowClose = (Math.random() < closeGapChance(game.score));
    const closeGap = allowClose ? Math.floor(gapMin * (0.62 + Math.random() * 0.12)) : 0;

    const pFence = clamp(0.24 + game.score * 0.0022, 0.22, 0.32);
    const pBird = clamp((0.09 + game.score * 0.0018) * CALM.animalsScale, 0.07, 0.14);
    const pDog  = clamp((0.10 + game.score * 0.0017) * CALM.animalsScale, 0.08, 0.16);
    const pYarn = 0.18;

    // grace window: no stressful obstacles right after big transitions
    if (safeMode) {
      // only fences + goodies (no dog/bird/yarn)
    }


    const pMouse  = 0.18 * CALM.collectiblesScale;
    const pFish   = clamp((0.05 + game.score * 0.0008) * CALM.collectiblesScale, 0.04, 0.07);
    const pCatnip = (game.catnipTimer > 0) ? 0.0 : clamp((0.05 + game.score * 0.0008) * CALM.collectiblesScale, 0.04, 0.08);

    // theme-weighted spawn probabilities
    const pFenceT = pFence * m("fence");
    const pBirdT  = pBird  * m("bird");
    const pDogT   = pDog   * m("dog");
    const pYarnT  = pYarn  * m("yarn");

    const pMouseT  = pMouse  * m("mouse");
    const pFishT   = pFish   * m("fish");
    const pCatnipT = pCatnip * m("catnip");


// vertical band multipliers (encourage "jump on birds" gameplay higher up)
const band = game.vertical?.band ?? "ground";
let vbFence = 1, vbDog = 1, vbBird = 1, vbYarn = 1, vbMouse = 1, vbFish = 1, vbCatnip = 1;
if (band === "mid") {
  vbBird = 1.6; vbFence = 0.85; vbDog = 0.75; vbYarn = 0.85;
  vbMouse = 1.10; vbFish = 1.05; vbCatnip = 1.05;
} else if (band === "high") {
  vbBird = 1.35; vbFence = 0.55; vbDog = 0.45; vbYarn = 0.60;
  vbMouse = 1.15; vbFish = 1.10; vbCatnip = 1.10;
}

const pFenceV = pFenceT * vbFence;
const pBirdV  = pBirdT  * vbBird;
const pDogV   = pDogT   * vbDog;
const pYarnV  = pYarnT  * vbYarn;


    function rndType() {
      if (safeMode) return "fence";
      const r = Math.random();
      if (r < pFenceV) return "fence";
      if (r < pFenceV + pDogV) return "dog";
      if (r < pFenceV + pDogV + pBirdV) return "bird";
      if (r < pFenceV + pDogV + pBirdV + pYarnV) return "yarn";
      return "fence";
    }

    const type = rndType();

    if (type === "fence") {
      const doStair = (Math.random() < CALM.staircaseChance);
      const count = doStair
        ? (CALM.staircaseMin + Math.floor(Math.random() * (CALM.staircaseMax - CALM.staircaseMin + 1)))
        : 1;

      let x = spawnX;
      const fenceH = 56;

      for (let i = 0; i < count; i++) {
        const w = 72 + Math.floor(Math.random() * 28);
        const h = fenceH;

        const ww = Math.max(48, w);
        const hh = Math.max(28, h);

        const groundFence = (Math.random() < 0.68);
        let topY;
        let yMode = "ground";
        let yOffset = -h;

        if (!groundFence) {
          const lift = 80 + Math.random() * 110;
          topY = terrain.surfaceAt(x) - h - lift;
          yMode = "fixed";
        } else {
          topY = terrain.surfaceAt(x) - h;
        }

        objects.add({ kind: "platform", type: "fence", x, y: topY, w: ww, h: hh, yMode, yOffset });

        // collectibles on fences
        if (Math.random() < 0.30 * CALM.collectiblesScale) {
          const my = (yMode === "ground") ? (terrain.surfaceAt(x + w * 0.35) - h - 28) : (topY - 30);
          objects.add({ kind: "collectible", type: "mouse", x: x + w * 0.36, y: my, w: 22, h: 16, taken: false, yMode: "fixed" });
        }
        if (Math.random() < (pCatnipT * vbCatnip) * 0.55) {
          const cy = (yMode === "ground") ? (terrain.surfaceAt(x + w * 0.62) - h - 36) : (topY - 36);
          objects.add({ kind: "collectible", type: "catnip", x: x + w * 0.64, y: cy, w: 18, h: 18, taken: false, yMode: "fixed" });
        }
        if (Math.random() < pFishT * 0.45) {
          const fy = (yMode === "ground") ? (terrain.surfaceAt(x + w * 0.16) - h - 28) : (topY - 28);
          objects.add({ kind: "collectible", type: "fish", x: x + w * 0.16, y: fy, w: 18, h: 14, taken: false, yMode: "fixed" });
        }

        x += w + 40;
      }

    } else if (type === "bird") {
      const w = 36, h = 20;
      const extra = (game.catnipTimer > 0) ? 18 : 0;
      const flyY = (terrain.surfaceAt(spawnX) - (150 + Math.random() * 75 + extra));
      const night = nightFactor(game.tick, game.score);
      const themeVariant = theme.birdVariant || "crow";
      const variant = (night > 0.78 && Math.random() < 0.45) ? "bat" : themeVariant;
      objects.add({ kind: "obstacle", type: "bird", variant, x: spawnX, y: flyY, w, h, flapT: Math.random() * 1000, yMode: "fixed" });

    } else if (type === "dog") {
      const w = 58, h = 36;
      objects.add({
        kind: "obstacle", type: "dog",
        x: spawnX,
        y: terrain.surfaceAt(spawnX) - h,
        w, h,
        asleep: (Math.random() < 0.55),
        chasing: false,
        chaseSpeedBoost: 1.45 + Math.random() * 0.22,
        anim: Math.random() * 100,
        yMode: "ground", yOffset: -h
      });

    } else { // yarn slow
      const size = 28;
      objects.add({
        kind: "obstacle", type: "yarn",
        x: spawnX, y: terrain.surfaceAt(spawnX) - size,
        w: size, h: size,
        yMode: "ground", yOffset: -size
      });
    }

    // extra collectibles
    if (Math.random() < (pMouseT * vbMouse)) {
      const mx = spawnX + 30 + Math.random() * 40;
      const my = (Math.random() < 0.70)
        ? (terrain.surfaceAt(mx) - 16)
        : (terrain.surfaceAt(mx) - 70 - Math.random() * 25);
      objects.add({ kind: "collectible", type: "mouse", x: mx, y: my, w: 22, h: 16, taken: false, yMode: "fixed" });
    }
    if (Math.random() < (pFishT * vbFish) * 0.55) {
      const fx = spawnX + 40;
      objects.add({ kind: "collectible", type: "fish", x: fx, y: terrain.surfaceAt(fx) - 88 - Math.random() * 30, w: 18, h: 14, taken: false, yMode: "fixed" });
    }
    if (Math.random() < (pCatnipT * vbCatnip) * 0.55) {
      const cx = spawnX + 20;
      objects.add({ kind: "collectible", type: "catnip", x: cx, y: terrain.surfaceAt(cx) - 100 - Math.random() * 40, w: 18, h: 18, taken: false, yMode: "fixed" });
    }

    // close combo (fair)
    if (closeGap > 0) {
      const x2 = spawnX + closeGap;
      if (Math.random() < 0.55) {
        const size = 26;
        objects.add({ kind: "obstacle", type: "yarn", x: x2, y: terrain.surfaceAt(x2) - size, w: size, h: size, yMode: "ground", yOffset: -size });
      } else {
        const w = 34, h = 18;
        objects.add({ kind: "obstacle", type: "bird", x: x2, y: terrain.surfaceAt(x2) - (160 + Math.random() * 40), w, h, flapT: Math.random() * 1000, yMode: "fixed" });
      }
    }

    nextSpawnIn = gapMin + Math.floor(Math.random() * 105);
    if (safeMode) nextSpawnIn += 120;
  }

  function update(palette) {
    // stop when finishing fade
    if (game.homePhase === 2) return;

    nextSpawnIn -= game._effSpeed;
    if (nextSpawnIn <= 0) spawnPack(canvas.W + 140, game.safeTimer > 0);

    // checkpoint every 50
    if (!game.checkpointActive && game.score > 0 && game.score % 50 === 0) {
      const already = objects.list.some(o => o.kind === "checkpoint" && !o.used);
      if (!already) spawnBlanket(canvas.W + 260);
    }

    // home trigger
    if (game.score >= HOME_SCORE && game.homePhase === 0) {
      game.homePhase = 1;
      game.homeX = canvas.W + 220;
      objects.toast("Heimweg… 🏡", 140);
    }
  }

  return { reset, update };
}