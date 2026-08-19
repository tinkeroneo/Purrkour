import assert from "node:assert/strict";
import test from "node:test";

import {
  getGameplayMotif,
  getSectionPhase,
  getSignatureMoment,
  WORLD_GAMEPLAY_MOTIFS,
  WORLD_SIGNATURE_MOMENTS,
} from "../src/game/gameplay-motifs.js";
import { createSpawner } from "../src/objects/spawn.js";

test("every gameplay world has a complete motif recipe", () => {
  const worlds = ["forest", "island", "mars", "mountain", "jungle", "cliff", "city", "desert"];
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
];

test("late worlds own one deliberate signature window", () => {
  assert.equal(Object.keys(WORLD_SIGNATURE_MOMENTS).length, 5);
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
