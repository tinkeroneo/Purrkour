import assert from "node:assert/strict";
import test from "node:test";

import { isPassRewardObject } from "../src/objects/collide.js";

test("ignoring a gold route does not award passive flow", () => {
  assert.equal(isPassRewardObject({ kind: "obstacle", type: "dog" }), true);
  assert.equal(isPassRewardObject({ kind: "platform", type: "fence" }), true);
  assert.equal(isPassRewardObject({ kind: "platform", type: "fence", skyPath: true }), false);
  assert.equal(isPassRewardObject({ kind: "collectible", type: "route_mouse" }), false);
});
