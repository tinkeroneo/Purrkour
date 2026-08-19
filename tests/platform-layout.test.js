import assert from "node:assert/strict";
import test from "node:test";

import { createSeededRandom } from "../src/core/random.js";
import {
  createPlatformRun,
  nextPlatformPackDistance,
  PLATFORM_LAYOUT,
} from "../src/game/platform-layout.js";

test("platform runs stay compact, readable and reachable", () => {
  for (let seed = 1; seed <= 120; seed++) {
    const run = createPlatformRun({
      spawnX: 500,
      count: 3,
      surfaceAt: () => 620,
      random: createSeededRandom(seed),
    });
    assert.equal(run.platforms.length, 3);
    assert.equal(run.span, run.platforms.at(-1).x + run.platforms.at(-1).w - 500);
    assert.ok(run.platforms.some((platform) => platform.yMode === "ground"));

    for (let index = 0; index < run.platforms.length; index++) {
      const platform = run.platforms[index];
      assert.ok(platform.w >= PLATFORM_LAYOUT.minWidth);
      assert.ok(platform.w < PLATFORM_LAYOUT.minWidth + PLATFORM_LAYOUT.widthRange);
      if (index === 0) continue;
      const previous = run.platforms[index - 1];
      const edgeGap = platform.x - (previous.x + previous.w);
      const heightStep = Math.abs(platform.y - previous.y);
      assert.ok(edgeGap >= PLATFORM_LAYOUT.minEdgeGap && edgeGap < PLATFORM_LAYOUT.minEdgeGap + PLATFORM_LAYOUT.edgeGapRange);
      assert.ok(heightStep <= PLATFORM_LAYOUT.minHeightStep + PLATFORM_LAYOUT.heightStepRange);
    }
  }
});

test("safe platform runs stay grounded and pack spacing clears the complete run", () => {
  const run = createPlatformRun({
    spawnX: 500,
    count: 3,
    surfaceAt: () => 620,
    random: createSeededRandom(42),
    forceGround: true,
  });
  assert.ok(run.platforms.every((platform) => platform.yMode === "ground"));

  const distance = nextPlatformPackDistance(240, run.span, 0);
  assert.ok(distance - run.span >= 110);
  assert.equal(nextPlatformPackDistance(360, 90, 0), 360);
});
