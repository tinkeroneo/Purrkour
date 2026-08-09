import assert from "node:assert/strict";
import test from "node:test";

import {
  createProgression,
  getProgressionBeatIds,
  getProgressionBeatSummaries,
} from "../src/game/progression.js";
import { createGameState } from "../src/game/state.js";

test("three complete journeys keep their beat order, speed and world rules stable", () => {
  const game = createGameState();
  const objects = { list: [], pawprints: [] };
  const themes = [];
  const progression = createProgression({
    game,
    objects,
    startThemeFade: (theme) => themes.push(theme),
    audio: null,
  });
  const expected = getProgressionBeatIds();
  const visited = [progression.currentBeat().id];
  let nonSetpieceEntries = 0;

  for (let transition = 0; transition < expected.length * 3; transition += 1) {
    const beat = progression.currentBeat();
    if (beat.setpiece) game.setpiece.finished = true;
    else {
      game.score = game.progression.beatStartScore + beat.lenScore;
      game.progression.beatTick = Math.max(0, (beat.minTicks ?? 0) - 1);
    }
    progression.update();
    if (!progression.currentBeat().setpiece) nonSetpieceEntries++;
    visited.push(progression.currentBeat().id);
    assert.ok(Number.isFinite(game.speed));
    assert.ok(game.worldRule?.label);
  }

  for (let cycle = 0; cycle < 3; cycle += 1) {
    assert.deepEqual(
      visited.slice(cycle * expected.length, (cycle + 1) * expected.length),
      expected,
    );
  }
  assert.equal(visited.at(-1), expected[0]);
  assert.equal(themes.length, 1 + nonSetpieceEntries);
});

function progressionFixture() {
  const game = createGameState();
  const objects = { list: [], pawprints: [] };
  const progression = createProgression({ game, objects, startThemeFade() {}, audio: null });
  return { game, objects, progression };
}

test("regular beats require time and score but always leave at their maximum", () => {
  const { game, progression } = progressionFixture();
  const forest = getProgressionBeatSummaries().find((beat) => beat.id === "FOREST_INTRO");
  game.score = forest.lenScore;
  progression.update();
  assert.equal(progression.currentBeat().id, "FOREST_INTRO");

  game.progression.beatTick = forest.minTicks - 1;
  progression.update();
  assert.equal(progression.currentBeat().id, "CHECKPOINT_BREATH");

  progression.enterBeatById("MARS_RUN");
  const mars = getProgressionBeatSummaries().find((beat) => beat.id === "MARS_RUN");
  game.score = game.progression.beatStartScore;
  game.progression.beatTick = mars.maxTicks - 1;
  progression.update();
  assert.equal(progression.currentBeat().id, "ROCKET_RETURN");
});

test("breath beats are hazard-free, time driven and pause aware", () => {
  const { game, objects, progression } = progressionFixture();
  objects.list.push({ kind: "obstacle", type: "dog" }, { kind: "platform", type: "fence" });
  progression.enterBeatById("RIDGE_BREATH");
  const ridge = getProgressionBeatSummaries().find((beat) => beat.id === "RIDGE_BREATH");
  assert.equal(objects.list.length, 0);
  assert.equal(game.progression.suppressHazards, true);

  const beforePause = game.progression.beatTick;
  game.pause.active = true;
  progression.update();
  assert.equal(game.progression.beatTick, beforePause);

  game.pause.active = false;
  game.progression.beatTick = ridge.minTicks - 1;
  progression.update();
  assert.equal(progression.currentBeat().id, "JUNGLE_RUN");
});

test("a forced checkpoint breath resumes the remembered journey beat", () => {
  const { game, progression } = progressionFixture();
  progression.enterBeatById("MARS_RUN");
  game.checkpointActive = true;
  progression.update();
  assert.equal(progression.currentBeat().id, "CHECKPOINT_BREATH");

  const breath = getProgressionBeatSummaries().find((beat) => beat.id === "CHECKPOINT_BREATH");
  game.progression.beatTick = breath.minTicks - 1;
  progression.update();
  assert.equal(progression.currentBeat().id, "ROCKET_RETURN");
});
