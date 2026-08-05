import assert from "node:assert/strict";
import test from "node:test";

import { createProgression, getProgressionBeatIds } from "../src/game/progression.js";
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

  for (let transition = 0; transition < expected.length * 3; transition += 1) {
    const beat = progression.currentBeat();
    if (beat.setpiece) game.setpiece.finished = true;
    else game.score = game.progression.beatStartScore + beat.lenScore;
    progression.update();
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
  assert.ok(themes.length >= expected.length * 3);
});
