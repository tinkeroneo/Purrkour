import assert from "node:assert/strict";
import test from "node:test";

import {
  createSetpieceManager,
  getSetpieceCatTargetX,
  getTravelStage,
  SETPIECE_TIMINGS,
} from "../src/game/setpieces.js";
import { createGameState } from "../src/game/state.js";

function fixture() {
  const game = createGameState();
  const objects = {
    list: [], pawprints: [],
    addBubble() {}, toast() {},
  };
  const themes = [];
  const audio = { SFX: { dash() {}, combo() {} } };
  const canvas = { W: 1200, H: 800 };
  const terrain = { surfaceAt: () => 680 };
  const manager = createSetpieceManager({
    game, objects, canvas, terrain, audio,
    startThemeFade: (theme) => themes.push(theme),
    random: () => 0.5,
  });
  return { game, manager, themes };
}

function advance(manager, frames) {
  for (let i = 0; i < frames; i++) manager.update();
}

test("ocean direction keeps phase boundaries continuous", () => {
  const { game, manager, themes } = fixture();
  manager.triggerOceanCrossing();
  const timing = SETPIECE_TIMINGS.ocean;
  assert.equal(game.setpiece.dur, 1000);

  advance(manager, timing.APPROACH);
  assert.equal(game.setpiece.phase, "board");
  assert.equal(game.setpiece.oceanMaskX, 1200);
  advance(manager, Math.ceil(timing.BOARD * 0.64));
  assert.equal(game.setpiece.catInVehicle, true);
  assert.equal(game.setpiece.oceanMaskX, 1200);
  advance(manager, timing.BOARD - Math.ceil(timing.BOARD * 0.64));
  assert.equal(game.setpiece.phase, "travel");
  assert.deepEqual(themes, ["ocean"]);

  const fromX = game.setpiece.vehicle.x;
  const fromMask = game.setpiece.oceanMaskX;
  manager.update();
  assert.ok(Math.abs(game.setpiece.vehicle.x - fromX) < 4);
  assert.ok(Math.abs(game.setpiece.oceanMaskX - fromMask) < 4);

  advance(manager, timing.TRAVEL - 1);
  assert.equal(game.setpiece.phase, "arrive");
  assert.equal(themes.at(-1), "island");
  const arrival = { ...game.setpiece.vehicle, mask: game.setpiece.oceanMaskX };
  manager.update();
  assert.ok(Math.abs(game.setpiece.vehicle.x - arrival.x) < 4);
  assert.ok(Math.abs(game.setpiece.vehicle.y - arrival.y) < 4);
  assert.ok(Math.abs(game.setpiece.oceanMaskX - arrival.mask) < 4);
  advance(manager, timing.ARRIVE - 1);
  assert.equal(game.setpiece.active, false);
  assert.equal(game.setpiece.finished, true);
});

test("rocket stays in the departure world until arrival", () => {
  const { game, manager, themes } = fixture();
  manager.triggerRocketFlight();
  const timing = SETPIECE_TIMINGS.rocket;
  assert.equal(game.setpiece.dur, 980);
  assert.equal(game.setpiece.oceanMaskX, 1200);

  advance(manager, timing.APPROACH);
  assert.equal(game.setpiece.phase, "board");
  assert.deepEqual(themes, []);
  advance(manager, timing.BOARD);
  assert.equal(game.setpiece.phase, "travel");
  assert.deepEqual(themes, []);

  advance(manager, timing.TRAVEL);
  assert.equal(game.setpiece.phase, "arrive");
  assert.deepEqual(themes, ["mars"]);
  const arrival = { ...game.setpiece.vehicle };
  manager.update();
  assert.ok(Math.abs(game.setpiece.vehicle.x - arrival.x) < 4);
  assert.ok(Math.abs(game.setpiece.vehicle.y - arrival.y) < 4);
  advance(manager, timing.ARRIVE - 1);
  assert.equal(game.setpiece.active, false);
  assert.equal(game.setpiece.finished, true);
});

test("all ocean vehicles use staged boarding and deterministic preview frames", () => {
  for (const type of ["balloon", "raft", "zeppelin"]) {
    const { game, manager, themes } = fixture();
    const first = manager.previewSetpiece({
      mode: "ocean", type, phase: "travel", progress: 0.5,
      originTheme: "forest", targetTheme: "island",
    });
    assert.equal(first.type, type);
    assert.equal(first.phase, "travel");
    assert.ok(Math.abs(first.phaseProgress - 0.5) < 0.01);
    assert.equal(first.catInVehicle, true);
    assert.equal(first.travelStage, "transit");
    assert.ok(Number.isFinite(first.vehicle.x));
    assert.ok(Number.isFinite(first.vehicle.y));
    assert.ok(Number.isFinite(getSetpieceCatTargetX(first, 110)));
    assert.equal(themes.at(-1), "ocean");
  }
});

test("travel stages and maneuver windows are distributed through the journey", () => {
  assert.equal(getTravelStage(0), "origin");
  assert.equal(getTravelStage(0.25), "departure");
  assert.equal(getTravelStage(0.5), "transit");
  assert.equal(getTravelStage(0.75), "destination");
  assert.equal(getTravelStage(0.95), "arrival");

  const { game, manager } = fixture();
  manager.previewSetpiece({ mode: "rocket", phase: "travel", progress: 0.17 });
  assert.equal(game.setpiece.maneuverReady, false);
  manager.previewSetpiece({ mode: "rocket", phase: "travel", progress: 0.2 });
  assert.equal(game.setpiece.maneuverReady, true);
});

test("arrival keeps exactly one cat representation until collider handoff", () => {
  const { game, manager } = fixture();
  manager.previewSetpiece({ mode: "ocean", type: "balloon", phase: "arrive", progress: 0.75 });
  assert.equal(game.setpiece.catExitPending, true);
  assert.equal(game.setpiece.catInVehicle, true);
});
