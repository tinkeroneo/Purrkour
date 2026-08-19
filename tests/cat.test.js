import assert from "node:assert/strict";
import test from "node:test";

import { getCatPose } from "../src/entities/cat.js";

test("crouching gives the cat a clearly lower, wider silhouette", () => {
  const running = getCatPose(false);
  const crouching = getCatPose(true);

  assert.deepEqual(running, { scaleX: 1, scaleY: 1 });
  assert.ok(crouching.scaleY <= 0.62);
  assert.ok(crouching.scaleX > 1);
});
