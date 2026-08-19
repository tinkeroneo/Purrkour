import assert from "node:assert/strict";
import test from "node:test";

import { createRunSeed, createSeededRandom, normalizeRunSeed } from "../src/core/random.js";
import { createTerrain } from "../src/world/terrain.js";

test("seeded random streams and terrain are replayable", () => {
  const sequence = (seed) => {
    const random = createSeededRandom(seed);
    return Array.from({ length: 8 }, () => random());
  };
  assert.deepEqual(sequence(12345), sequence(12345));
  assert.notDeepEqual(sequence(12345), sequence(54321));

  const terrainProfile = (seed) => {
    const random = createSeededRandom(seed);
    const terrain = createTerrain(() => 1280, () => 720, random);
    terrain.init();
    return [0, 170, 340, 680, 1020].map((x) => terrain.surfaceAt(x));
  };
  assert.deepEqual(terrainProfile(77), terrainProfile(77));
  assert.notDeepEqual(terrainProfile(77), terrainProfile(78));
});

test("run seeds accept shared values and use secure randomness when available", () => {
  assert.equal(normalizeRunSeed("4242", 1), 4242);
  assert.equal(normalizeRunSeed("invalid", 99), 99);
  const cryptoStub = { getRandomValues(values) { values[0] = 987654321; } };
  assert.equal(createRunSeed(cryptoStub, 10), 987654321);
});
