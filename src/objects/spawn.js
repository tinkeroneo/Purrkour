import { clamp } from "../core/util.js";
import { createDog } from "../entities/dog.js";
import { createMonkey } from "../entities/monkey.js";
import { createBird } from "../entities/bird.js";
import { createGoat } from "../entities/goat.js";
import { createScorpion } from "../entities/scorpion.js";
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
  function minGapForScore(s) {
    return clamp(CALM.gapBase - s * CALM.gapSlope, CALM.gapMin, CALM.gapBase);
  }
  function closeGapChance(s) {
    if (s < CALM.closeGapStartScore) return 0;
    return CALM.closeGapChanceMax;
  }

  function reset() { nextSpawnIn = 260; }

  function spawnLife(spawnX) {
    const surf = terrain.surfaceAt(spawnX);
    objects.add({ kind: "collectible", type: "life", x: spawnX, y: surf - 90, w: 20, h: 20, taken: false, yMode: "fixed" });
  }

  function spawnPack(spawnX, safeMode = false) {
    const theme = getTheme(game.theme);
    const sm = theme.spawns || {};
    const m = (k) => (Number.isFinite(sm[k]) ? sm[k] : 1);

    const band = game.vertical?.band || "ground";
    const zones = theme.zones || {};
    const zm = zones[band] || zones.ground || {};
    const z = (k) => (Number.isFinite(zm[k]) ? zm[k] : 1);

    const gapMin = minGapForScore(game.score);
    // During setpieces (ocean/air vehicles) we don't spawn normal hazards/collectibles.
    if (game.setpiece?.active) { nextSpawnIn = gapMin + 140; return; }
    const allowClose = (Math.random() < closeGapChance(game.score));
    const closeGap = allowClose ? Math.floor(gapMin * (0.62 + Math.random() * 0.12)) : 0;

    const pFence = z("fence") * clamp(0.24 + game.score * 0.0022, 0.22, 0.32);
    const pBird = z("bird") * clamp((0.09 + game.score * 0.0018) * CALM.animalsScale, 0.07, 0.14);
    const pDog = clamp((0.10 + game.score * 0.0017) * CALM.animalsScale, 0.08, 0.16);
    const pYarn = z("yarn") * 0.18;

    // grace window: no stressful obstacles right after big transitions
    if (safeMode) {
      // only fences + goodies (no dog/bird/yarn)
    }


    const pMouse = 0.18 * CALM.collectiblesScale;
    const pFish = clamp((0.05 + game.score * 0.0008) * CALM.collectiblesScale, 0.04, 0.07);
    const pCatnip = (game.catnipTimer > 0)
      ? 0.0
      : (z("catnip") * clamp((0.05 + game.score * 0.0008) * CALM.collectiblesScale, 0.04, 0.08));

    // --- collision-safe placement helpers ---
    function aabb(A, B) {
      return A.x < (B.x + B.w) && (A.x + A.w) > B.x && A.y < (B.y + B.h) && (A.y + A.h) > B.y;
    }
    function overlapsSolid(box) {
      for (const o of objects.list) {
        if (o.kind === "platform") {
          const ob = { x: o.x + 8, y: o.y + 4, w: Math.max(1, o.w - 16), h: Math.max(1, o.h - 4) };
          if (aabb(box, ob)) return true;
        }
        // treat yarn/dog as solid for "don't spawn inside"
        if (o.kind === "obstacle" && (o.type === "yarn" || o.type === "dog")) {
          const ob = { x: o.x + 2, y: o.y + 2, w: Math.max(1, o.w - 4), h: Math.max(1, o.h - 4) };
          if (aabb(box, ob)) return true;
        }
      }
      return false;
    }
    function placeCollectible(x, y, w, h) {
      // Try a few offsets so collectibles never appear *inside* fences etc.
      const tries = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -18 },
        { dx: 0, dy: -36 },
        { dx: 18, dy: -18 },
        { dx: -18, dy: -18 },
        { dx: 24, dy: -36 },
        { dx: -24, dy: -36 },
      ];
      for (const t of tries) {
        const xx = x + t.dx;
        const yy = y + t.dy;
        const box = { x: xx, y: yy, w, h };
        if (!overlapsSolid(box)) return { x: xx, y: yy };
      }
      // fallback: lift well above ground
      return { x, y: Math.min(y, terrain.surfaceAt(x) - 110 - h) };
    }

    function placeGroundObstacle(x, w, h, pad = 18) {
      // Try a few x nudges so ground obstacles don't spawn inside platforms/fences.
      for (let k = 0; k < 7; k++) {
        const dx = (k === 0) ? 0 : (k % 2 ? 1 : -1) * (20 * Math.ceil(k / 2));
        const xx = x + dx;
        const yy = terrain.surfaceAt(xx) - h;
        const box = { x: xx - pad, y: yy - pad, w: w + pad * 2, h: h + pad * 2 };
        if (!overlapsSolid(box)) return { x: xx, y: yy };
      }
      return { x, y: terrain.surfaceAt(x) - h };
    }

    // theme-weighted spawn probabilities
    const pFenceT = pFence * m("fence");
    const pBirdT = pBird * m("bird");
    const pDogT = pDog * m("dog");
    const pYarnT = pYarn * m("yarn");

    const pMouseT = pMouse * m("mouse");
    const pFishT = pFish * m("fish");
    const pCatnipT = pCatnip * m("catnip");


    // vertical band multipliers (encourage "jump on birds" gameplay higher up)
    const vBand = band;
    let vbFence = 1, vbDog = 1, vbBird = 1, vbYarn = 1, vbMouse = 1, vbFish = 1, vbCatnip = 1;
    if (vBand === "mid") {
      vbBird = 1.60; vbFence = 0.85; vbDog = 0.75; vbYarn = 0.85;
      vbMouse = 1.10; vbFish = 1.05; vbCatnip = 1.05;
    } else if (vBand === "air") {
      vbBird = 1.35; vbFence = 0.55; vbDog = 0.45; vbYarn = 0.60;
      vbMouse = 1.15; vbFish = 1.10; vbCatnip = 1.10;
    }

    const pFenceV = pFenceT * vbFence;
    const pBirdV = pBirdT * vbBird;
    const pDogV = pDogT * vbDog;
    const pYarnV = pYarnT * vbYarn;


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
        // avoid overlapping existing solids/platforms
        {
          const marginX = 8;
          const marginY = 2;

          const box = {
            x: x + marginX,
            y: topY + marginY,
            w: ww - marginX * 2,
            h: hh - marginY
          };

          let tries = 0;
          while (overlapsSolid(box) && tries < 10) {
            x += ww + 34;
            box.x = x + marginX;

            if (yMode === "ground") {
              topY = terrain.surfaceAt(x) - hh;
            }
            box.y = topY + marginY;

            tries++;
          }
        }



        // collectibles on fences
        if (Math.random() < 0.30 * CALM.collectiblesScale) {
          const my = (yMode === "ground") ? (terrain.surfaceAt(x + w * 0.35) - h - 28) : (topY - 30);
          {
            const pos = placeCollectible(x + w * 0.36, my, 22, 16);
            objects.add({ kind: "collectible", type: "mouse", x: pos.x, y: pos.y, w: 22, h: 16, taken: false, yMode: "fixed" });
          }
        }
        if (Math.random() < (pCatnipT * vbCatnip) * 0.55) {
          const cy = (yMode === "ground") ? (terrain.surfaceAt(x + w * 0.62) - h - 36) : (topY - 36);
          {
            const pos = placeCollectible(x + w * 0.64, cy, 18, 18);
            objects.add({ kind: "collectible", type: "catnip", x: pos.x, y: pos.y, w: 18, h: 18, taken: false, yMode: "fixed" });
          }
        }
        if (Math.random() < pFishT * 0.45) {
          const fy = (yMode === "ground") ? (terrain.surfaceAt(x + w * 0.16) - h - 28) : (topY - 28);
          {
            const pos = placeCollectible(x + w * 0.16, fy, 18, 14);
            objects.add({ kind: "collectible", type: "fish", x: pos.x, y: pos.y, w: 18, h: 14, taken: false, yMode: "fixed" });
          }
        }

        x += w + 40;
      }

    } else if (type === "bird") {
      const w = 36, h = 20;
      const extra = (game.catnipTimer > 0) ? 18 : 0;
      const ground = terrain.surfaceAt(spawnX);
      const drop = Math.random() < 0.22; // bird "von oben"
      const flyY = drop ? (-80 - Math.random() * 140) : (ground - (150 + Math.random() * 75 + extra));
      const night = nightFactor(game.tick, game.score);
      const themeVariant = theme.birdVariant || "crow";
      const variant = (night > 0.78 && Math.random() < 0.45) ? "bat" : themeVariant;
      const restY = ground - (150 + Math.random() * 60 + extra);
      objects.add(createBird({
        variant,
        x: spawnX,
        y: flyY,
        w,
        h,
        flapT: Math.random() * 1000,
        yMode: "fixed",
        drop,
        vy: drop ? (0.2 + Math.random() * 0.6) : 0,
        restY
      }));

    }
    else if (type === "dog") {
      const themeKey = (game.theme && game.theme.key) ? game.theme.key : (game.theme || "forest");

      if (themeKey === "city") {
        // city: cars as harmless setpieces/platforms (no chase)
        const w = 110, h = 44;
        const posCar = placeGroundObstacle(spawnX, w, h, 26);
        objects.add({
          kind: "platform", type: "car",
          x: posCar.x,
          y: posCar.y,
          w, h,
          yMode: "ground", yOffset: -h
        });
      } else if (themeKey === "jungle") {
        const w = 54, h = 54;
        const posMonkey = placeGroundObstacle(spawnX, w, h, 26);
        objects.add(createMonkey(posMonkey.x, posMonkey.y, { w, h }));
      } else if (themeKey === "mountain" || themeKey === "cliff") {
        const w = 58, h = 48;
        const posGoat = placeGroundObstacle(spawnX, w, h, 26);
        objects.add(createGoat(posGoat.x, posGoat.y, { w, h }));
      } else if (themeKey === "desert") {
        const w = 58, h = 48;
        const posGoat = placeGroundObstacle(spawnX, w, h, 26);
        objects.add(createScorpion(posGoat.x, posGoat.y, { w, h }));
  
      } else {
        const w = 58, h = 36;
        const posDog = placeGroundObstacle(spawnX, w, h, 26);
        objects.add(createDog(game, {
          x: posDog.x,
          y: posDog.y,
          w,
          h,
          asleep: (Math.random() < 0.55),
          chasing: false,
          chaseSpeedBoost: 1.45 + Math.random() * 0.22,
          anim: Math.random() * 100,
          yMode: "ground",
          yOffset: -h
        }));
      }
    } else { // yarn slow
      const size = 28;
      const posYarn = placeGroundObstacle(spawnX, size, size, 18);
      objects.add({
        kind: "obstacle", type: "yarn",
        x: posYarn.x, y: posYarn.y,
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
      {
        const pos = placeCollectible(mx, my, 22, 16);
        objects.add({ kind: "collectible", type: "mouse", x: pos.x, y: pos.y, w: 22, h: 16, taken: false, yMode: "fixed" });
      }
    }
    if (Math.random() < (pFishT * vbFish) * 0.55) {
      const fx = spawnX + 40;
      {
        const fy = terrain.surfaceAt(fx) - 88 - Math.random() * 30;
        const pos = placeCollectible(fx, fy, 18, 14);
        objects.add({ kind: "collectible", type: "fish", x: pos.x, y: pos.y, w: 18, h: 14, taken: false, yMode: "fixed" });
      }
    }
    if (Math.random() < (pCatnipT * vbCatnip) * 0.55) {
      const cx = spawnX + 20;
      {
        const cy = terrain.surfaceAt(cx) - 100 - Math.random() * 40;
        const pos = placeCollectible(cx, cy, 18, 18);
        objects.add({ kind: "collectible", type: "catnip", x: pos.x, y: pos.y, w: 18, h: 18, taken: false, yMode: "fixed" });
      }
    }

    // close combo (fair)
    if (closeGap > 0) {
      const x2 = spawnX + closeGap;
      if (Math.random() < 0.55) {
        const size = 26;
        const pos2 = placeGroundObstacle(x2, size, size, 18);
        objects.add({ kind: "obstacle", type: "yarn", x: pos2.x, y: pos2.y, w: size, h: size, yMode: "ground", yOffset: -size });
      } else {
        const w = 34, h = 18;
        objects.add(createBird({
          x: x2,
          y: terrain.surfaceAt(x2) - (160 + Math.random() * 40),
          w,
          h,
          flapT: Math.random() * 1000,
          yMode: "fixed"
        }));
      }
    }

    nextSpawnIn = gapMin + Math.floor(Math.random() * 105);
    if (safeMode) nextSpawnIn += 120;
  }

  function update(palette) {
    nextSpawnIn -= game._effSpeed;
    if (nextSpawnIn <= 0) spawnPack(canvas.W + 140, game.safeTimer > 0);

    // bonus life every 60 score (only if not full)
    if (game.lives < (game.maxLives ?? 7) && game.score > 0 && game.score % 60 === 0) {
      const already = objects.list.some(o => o.kind === "collectible" && o.type === "life" && !o.taken);
      if (!already) spawnLife(canvas.W + 260);
    }
  }

  return { reset, update };
}
