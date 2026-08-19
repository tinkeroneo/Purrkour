import assert from "node:assert/strict";
import test from "node:test";

import { createSeededRandom } from "../src/core/random.js";
import {
  getGameplayMotif,
  getSectionPhase,
  getSignatureMoment,
  WORLD_GAMEPLAY_MOTIFS,
  WORLD_SIGNATURE_MOMENTS,
} from "../src/game/gameplay-motifs.js";
import { createSpawner } from "../src/objects/spawn.js";

test("every gameplay world has a complete motif recipe", () => {
  const worlds = ["forest", "island", "mars", "mountain", "jungle", "cliff", "city", "desert", "volcano"];
  for (const world of worlds) {
    const recipe = WORLD_GAMEPLAY_MOTIFS[world];
    assert.ok(recipe?.label, `${world} needs a motif label`);
    for (const key of ["fence", "dog", "bird", "yarn", "tunnel"]) {
      assert.ok(Number.isFinite(recipe.weights[key]), `${world}.${key} must be tuned`);
    }
  }
});

test("section phases form an establish-to-exit arc", () => {
  assert.equal(getSectionPhase(0), "establish");
  assert.equal(getSectionPhase(0.2), "flow");
  assert.equal(getSectionPhase(0.5), "variation");
  assert.equal(getSectionPhase(0.7), "challenge");
  assert.equal(getSectionPhase(0.88), "release");
  assert.equal(getSectionPhase(0.97), "exit");
});

test("night sightlines differ from mountain vertical play and city owns ducking", () => {
  const mountain = getGameplayMotif("mountain", "challenge", "vertical");
  const night = getGameplayMotif("mountain", "challenge", "sightlines");
  const city = getGameplayMotif("city", "challenge", "duck-rhythm");
  assert.notDeepEqual(night, mountain);
  assert.ok(night.gapMul > mountain.gapMul);
  assert.ok(night.weights.bird > mountain.weights.bird);
  assert.ok(city.weights.tunnel > 0);
  assert.equal(getGameplayMotif("city", "release", "duck-rhythm").weights.tunnel, 0);
});

const scenarios = [
  ["forest", "FOREST_INTRO", "variation", "fallen-branch"],
  ["jungle", "JUNGLE_RUN", "variation", "canopy-crossing"],
  ["cliff", "CLIFF_RUN", "challenge", "summit-stair"],
  ["city", "CITY_RUN", "challenge", "under-over"],
  ["desert", "DESERT_RUN", "variation", "scorpion-slalom"],
  ["volcano", "VOLCANO_RUN", "variation", "caldera-run"],
];

test("late worlds own one deliberate signature window", () => {
  assert.equal(Object.keys(WORLD_SIGNATURE_MOMENTS).length, 6);
  for (const [theme, , phase, id] of scenarios) {
    assert.equal(getSignatureMoment(theme, phase)?.id, id);
    assert.equal(getSignatureMoment(theme, "establish"), null);
    assert.equal(getSignatureMoment(theme, "release"), null);
  }
});

test("each late world spawns its signature composition once per beat", () => {
  for (const [theme, beatId, phase, id] of scenarios) {
    const game = {
      theme,
      tick: 1,
      score: 500,
      _effSpeed: 300,
      safeTimer: 0,
      catnipTimer: 0,
      nextBonusLifeScore: Number.POSITIVE_INFINITY,
      presentationPreview: "",
      progression: { beatId, sectionPhase: phase, gameplayMotif: theme },
      setpiece: { active: false },
      riskRoute: { id: 0, nextAt: Number.POSITIVE_INFINITY },
      vertical: { band: "ground" },
    };
    const objects = {
      list: [],
      add(object) { this.list.push(object); },
      toast() {},
    };
    const terrain = { surfaceAt: () => 620 };
    const spawner = createSpawner(game, terrain, objects, { W: 390, H: 844 });

    spawner.update();
    const firstCount = objects.list.filter((object) => object.signatureMoment === id).length;
    assert.ok(firstCount >= 2, `${theme} should create a readable signature pack`);
    if (theme === "volcano") {
      assert.ok(objects.list.some((object) => object.type === "lava_vent"), "volcano needs its own lava hazard");
    }

    game._effSpeed = 800;
    game.tick++;
    spawner.update();
    assert.equal(
      objects.list.filter((object) => object.signatureMoment === id).length,
      firstCount,
      `${theme} signature should not repeat in the same beat`,
    );
  }
});

function seededSpawnSnapshot(seed) {
  const game = {
    theme: "island",
    tick: 1,
    score: 500,
    _effSpeed: 800,
    safeTimer: 0,
    catnipTimer: 0,
    nextBonusLifeScore: Number.POSITIVE_INFINITY,
    presentationPreview: "",
    progression: { beatId: "ISLAND_RUN", sectionPhase: "flow", gameplayMotif: "island" },
    setpiece: { active: false },
    riskRoute: { id: 0, nextAt: Number.POSITIVE_INFINITY },
    vertical: { band: "ground" },
    lives: 7,
    maxLives: 7,
  };
  const objects = {
    list: [],
    add(object) { this.list.push(object); },
    toast() {},
  };
  const spawner = createSpawner(
    game,
    { surfaceAt: () => 620 },
    objects,
    { W: 390, H: 844 },
    createSeededRandom(seed),
  );

  for (let tick = 1; tick <= 6; tick++) {
    game.tick = tick;
    spawner.update();
  }

  return objects.list.map((object) => ({
    kind: object.kind,
    type: object.type,
    variant: object.variant,
    x: Math.round(object.x * 1000) / 1000,
    y: Math.round(object.y * 1000) / 1000,
    w: object.w,
    h: object.h,
  }));
}

test("a run seed reproduces the gameplay spawn sequence", () => {
  const first = seededSpawnSnapshot(424242);
  assert.ok(first.length >= 6);
  assert.deepEqual(seededSpawnSnapshot(424242), first);
  assert.notDeepEqual(seededSpawnSnapshot(424243), first);
});

test("the spawner keeps a staircase together instead of colliding with itself", () => {
  const game = {
    theme: "forest",
    tick: 1,
    score: 500,
    _effSpeed: 800,
    safeTimer: 0,
    catnipTimer: 0,
    nextBonusLifeScore: Number.POSITIVE_INFINITY,
    presentationPreview: "",
    progression: { beatId: "FOREST_INTRO", sectionPhase: "flow", gameplayMotif: "rhythm" },
    setpiece: { active: false },
    riskRoute: { id: 0, nextAt: Number.POSITIVE_INFINITY },
    vertical: { band: "ground" },
    lives: 7,
    maxLives: 7,
  };
  const objects = {
    list: [],
    add(object) { this.list.push(object); },
    toast() {},
  };
  const spawner = createSpawner(game, { surfaceAt: () => 620 }, objects, { W: 390, H: 844 }, () => 0);

  spawner.update();
  const platforms = objects.list.filter((object) => object.kind === "platform");
  assert.equal(platforms.length, 2);
  assert.equal(platforms[0].platformRunIndex, 0);
  assert.equal(platforms[1].platformRunIndex, 1);
  assert.ok(platforms[1].x - (platforms[0].x + platforms[0].w) >= 48);
  assert.ok(platforms[1].x < 800, "the second step must remain part of the visible run");
});
