import assert from "node:assert/strict";
import test from "node:test";

import {
  breakFlow,
  createFlowState,
  FLOW_WINDOW_TICKS,
  getFlowMultiplier,
  getFlowProgress,
  rewardFlow,
  tickFlow,
} from "../src/game/flow.js";

test("flow tiers reward clean action chains with deterministic multipliers", () => {
  const flow = createFlowState();
  assert.equal(rewardFlow(flow, { basePoints: 2 }).points, 2);
  rewardFlow(flow, { basePoints: 2 });
  const tierTwo = rewardFlow(flow, { basePoints: 2 });
  assert.deepEqual(tierTwo, { points: 4, tierChanged: true, multiplier: 2, count: 3 });
  assert.equal(getFlowMultiplier(6), 3);
  assert.equal(getFlowMultiplier(10), 4);
});

test("flow actions refresh the window and remember the best chain", () => {
  const flow = createFlowState();
  rewardFlow(flow, { steps: 6 });
  tickFlow(flow);
  assert.equal(flow.timer, FLOW_WINDOW_TICKS - 1);
  rewardFlow(flow);
  assert.equal(flow.timer, FLOW_WINDOW_TICKS);
  assert.equal(flow.best, 7);
  assert.equal(getFlowProgress(flow), 1);
});

test("flow expires without erasing the run best", () => {
  const flow = createFlowState();
  rewardFlow(flow, { steps: 4 });
  flow.timer = 1;
  const result = tickFlow(flow);
  assert.deepEqual(result, { expired: true, previousMultiplier: 2 });
  assert.equal(flow.count, 0);
  assert.equal(flow.multiplier, 1);
  assert.equal(flow.best, 4);
});

test("damage breaks active flow immediately", () => {
  const flow = createFlowState();
  rewardFlow(flow, { steps: 10 });
  assert.deepEqual(breakFlow(flow), { broken: true, previousMultiplier: 4 });
  assert.equal(flow.timer, 0);
  assert.equal(flow.best, 10);
});
