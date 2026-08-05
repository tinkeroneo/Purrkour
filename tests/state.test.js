import assert from "node:assert/strict";
import test from "node:test";
import { createGameState, resetGameState } from "../src/game/state.js";

test("run reset restores the canonical initial state", () => {
  const game = createGameState({ initialTheme: "city" });
  const progressionApi = { reset() {} };
  game.progressionApi = progressionApi;
  game.score = 480;
  game.lives = 1;
  game.theme = "mars";
  game.themeOverlay = "winter";
  game.finished = true;
  game.input.crouch = true;
  game.pause = { active: true, phase: "sleep", t: 999 };
  game.setpiece.active = true;
  game.progression = { beatIdx: 7, beatStartScore: 450 };
  game.nextBonusLifeScore = 540;
  game.flow = { count: 12, multiplier: 4, timer: 1, best: 12 };
  game.mission = { key: "moves", progress: 4, completed: 5 };
  game.riskRoute = { active: true, id: 4, completed: 2 };
  game.presentation.active = true;
  game.unknownRunField = true;

  const reset = resetGameState(game);

  assert.equal(reset, game);
  assert.equal(game.initialTheme, "city");
  assert.equal(game.theme, "city");
  assert.equal(game.score, 0);
  assert.equal(game.lives, 7);
  assert.equal(game.finished, false);
  assert.equal(game.input.crouch, false);
  assert.equal(game.pause.active, false);
  assert.equal(game.setpiece.active, false);
  assert.equal(game.themeOverlay, null);
  assert.equal(game.nextBonusLifeScore, 60);
  assert.deepEqual(game.flow, { count: 0, multiplier: 1, timer: 0, best: 0 });
  assert.equal(game.mission.key, "mice");
  assert.equal(game.mission.progress, 0);
  assert.equal(game.riskRoute.active, false);
  assert.equal(game.riskRoute.nextAt, 45);
  assert.equal(game.presentation.active, false);
  assert.equal(game.progressionApi, progressionApi);
  assert.equal("progression" in game, false);
  assert.equal("unknownRunField" in game, false);
});
