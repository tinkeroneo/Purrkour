import assert from "node:assert/strict";
import test from "node:test";

import { ALBUM_STORAGE_KEY, createEmptyAlbum, createJourneyAlbum, readJourneyAlbum } from "../src/game/album.js";

function memoryStorage(initial = null) {
  const values = new Map(initial ? [[ALBUM_STORAGE_KEY, initial]] : []);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

function gameState(overrides = {}) {
  return {
    tick: 1,
    score: 10,
    theme: "forest",
    progression: { beatId: "FOREST_INTRO" },
    setpiece: { active: false, mode: "ocean" },
    mission: { completed: 0 },
    riskRoute: { completed: 0 },
    flow: { best: 0 },
    ...overrides,
  };
}

test("journey album falls back safely when stored data is malformed", () => {
  const broken = readJourneyAlbum(memoryStorage("{nope"));
  assert.deepEqual(broken, createEmptyAlbum());

  const sanitized = readJourneyAlbum(memoryStorage(JSON.stringify({
    themes: ["forest", "forest", 7], missions: -2, bestFlow: 99,
  })));
  assert.deepEqual(sanitized.themes, ["forest"]);
  assert.equal(sanitized.missions, 0);
  assert.equal(sanitized.bestFlow, 4);
});

test("album records discoveries and run achievements without duplicates", () => {
  const album = createJourneyAlbum(memoryStorage());
  album.observe(gameState());
  album.observe(gameState({ tick: 2, mission: { completed: 2 }, riskRoute: { completed: 1 }, flow: { best: 7 } }));
  const snapshot = album.observe(gameState({ tick: 3, theme: "island", progression: { beatId: "ISLAND_REST" } }));

  assert.deepEqual(snapshot.themes, ["forest", "island"]);
  assert.deepEqual(snapshot.beats, ["FOREST_INTRO", "ISLAND_REST"]);
  assert.equal(snapshot.missions, 2);
  assert.equal(snapshot.routes, 1);
  assert.equal(snapshot.bestFlow, 3);
});

test("album counts achievements across resets and each finished run once", () => {
  const album = createJourneyAlbum(memoryStorage());
  album.observe(gameState({ tick: 30, mission: { completed: 2 } }));
  album.finishRun(gameState({ tick: 40, score: 120, mission: { completed: 2 } }));
  album.finishRun(gameState({ tick: 40, score: 120, mission: { completed: 2 } }));

  album.observe(gameState({ tick: 0, score: 0 }));
  album.observe(gameState({ tick: 12, mission: { completed: 1 } }));
  const snapshot = album.finishRun(gameState({ tick: 20, score: 45, mission: { completed: 1 } }));

  assert.equal(snapshot.missions, 3);
  assert.equal(snapshot.runs, 2);
  assert.equal(snapshot.bestScore, 120);
});

