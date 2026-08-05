import assert from "node:assert/strict";
import test from "node:test";

import {
  beginRiskRoute,
  collectRiskToken,
  createRiskRouteState,
  expireRiskRoute,
  shouldStartRiskRoute,
} from "../src/game/risk-routes.js";

test("risk routes start at deliberate score milestones but not in safe sections", () => {
  const route = createRiskRouteState();
  assert.equal(shouldStartRiskRoute(route, 44), false);
  assert.equal(shouldStartRiskRoute(route, 45), true);
  assert.equal(shouldStartRiskRoute(route, 80, { safeMode: true }), false);
  assert.equal(shouldStartRiskRoute(route, 80, { blocked: true }), false);
});

test("five matching tokens finish a route and schedule the next one", () => {
  let route = beginRiskRoute(createRiskRouteState(), 50, 5);
  assert.equal(route.label, "Goldgrat");
  assert.equal(route.nextAt, 220);

  for (let i = 0; i < 4; i++) route = collectRiskToken(route, route.id).state;
  const result = collectRiskToken(route, route.id);
  assert.equal(result.completion.bonus, 80);
  assert.equal(result.state.active, false);
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

