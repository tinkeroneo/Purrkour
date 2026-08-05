import assert from "node:assert/strict";
import test from "node:test";

import { getWorldRule, WORLD_RULES } from "../src/game/world-rules.js";
import { getThemeOrder } from "../src/world/themes.js";

test("every world has a complete and visibly distinct movement rule", () => {
  const order = getThemeOrder();
  assert.deepEqual(Object.keys(WORLD_RULES), order);
  assert.equal(new Set(order.map((key) => getWorldRule(key).label)).size, order.length);
  for (const key of order) {
    const rule = getWorldRule(key);
    for (const field of ["gravityMul", "jumpMul", "controlMul", "paceMul"]) {
      assert.ok(rule[field] >= 0.7 && rule[field] <= 1.2, `${key}.${field} is outside safe tuning bounds`);
    }
  }
});

test("unknown themes fall back to the balanced forest rule", () => {
  assert.equal(getWorldRule("unknown"), WORLD_RULES.forest);
});
