import assert from "node:assert/strict";
import test from "node:test";

import {
  getGameplayMotif,
  getSectionPhase,
  WORLD_GAMEPLAY_MOTIFS,
} from "../src/game/gameplay-motifs.js";

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
