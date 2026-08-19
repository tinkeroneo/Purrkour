import assert from "node:assert/strict";
import test from "node:test";

import {
  beginRiskRoute,
  collectRiskToken,
  createRiskRouteState,
  expireRiskRoute,
  getRiskRouteLift,
  shouldStartRiskRoute,
} from "../src/game/risk-routes.js";

test("gold routes start low and climb in reachable steps", () => {
  for (const count of [15, 18]) {
    const lifts = Array.from({ length: count }, (_, index) => getRiskRouteLift(index, count, 78, 296));
    assert.ok(lifts[0] <= 80, "entry platform must be reachable with one jump");
    for (let index = 1; index < lifts.length; index++) {
      assert.ok(
        Math.abs(lifts[index] - lifts[index - 1]) <= 80,
        `height step ${index - 1} -> ${index} must stay reachable`,
      );
    }
  }
});

test("risk routes start at deliberate score milestones but not in safe sections", () => {
  const route = createRiskRouteState();
  assert.equal(shouldStartRiskRoute(route, 44), false);
  assert.equal(shouldStartRiskRoute(route, 45), true);
  assert.equal(shouldStartRiskRoute(route, 80, { safeMode: true }), false);
  assert.equal(shouldStartRiskRoute(route, 80, { blocked: true }), false);
});

test("a visible route stays optional until its first token is collected", () => {
  const route = createRiskRouteState();
  const visible = beginRiskRoute(route, 45, 5);
  assert.equal(visible.label, "Goldgrat");
  assert.equal(visible.active, true);
  assert.equal(visible.entered, false);

  const entered = collectRiskToken(visible, visible.id).state;
  assert.equal(entered.entered, true);
  assert.equal(entered.collected, 1);
});

test("five matching tokens finish a route and schedule the next one", () => {
  let route = beginRiskRoute(createRiskRouteState(), 50, 5);
  assert.equal(route.label, "Goldgrat");
  assert.equal(route.entered, false);
  assert.equal(route.nextAt, 220);

  for (let i = 0; i < 4; i++) route = collectRiskToken(route, route.id).state;
  const result = collectRiskToken(route, route.id);
  assert.equal(result.completion.bonus, 80);
  assert.equal(result.state.active, false);
  assert.equal(result.state.entered, true);
  assert.equal(result.state.completed, 1);

  const next = beginRiskRoute(result.state, 230);
  assert.equal(next.label, "Mondpfad");
});

test("foreign tokens are ignored and missed routes expire without completion", () => {
  const route = beginRiskRoute(createRiskRouteState(), 45);
  assert.equal(collectRiskToken(route, route.id + 1).state, route);
  const expired = expireRiskRoute(route);
  assert.equal(expired.active, false);
  assert.equal(expired.completed, 0);
});
