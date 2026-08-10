import assert from "node:assert/strict";
import test from "node:test";

import { measureViewport } from "../src/core/util.js";
import { createObjects } from "../src/objects/objects.js";
import { createTerrain } from "../src/world/terrain.js";

test("viewport measurement follows settled portrait dimensions after rotation", () => {
  const staleLandscapeWindow = {
    innerWidth: 844,
    innerHeight: 390,
    visualViewport: { width: 390.8, height: 843.7, scale: 1 },
  };
  const portraitRoot = { clientWidth: 390, clientHeight: 844 };

  assert.deepEqual(measureViewport(staleLandscapeWindow, portraitRoot), {
    width: 390,
    height: 843,
  });
});

test("viewport measurement keeps the layout viewport while the page is zoomed", () => {
  const zoomedWindow = {
    innerWidth: 390,
    innerHeight: 844,
    visualViewport: { width: 195, height: 422, scale: 2 },
  };
  const portraitRoot = { clientWidth: 390, clientHeight: 844 };

  assert.deepEqual(measureViewport(zoomedWindow, portraitRoot), {
    width: 390,
    height: 844,
  });
});

test("terrain resize preserves its shape while adapting to the viewport", () => {
  let width = 390;
  let height = 640;
  const terrain = createTerrain(() => width, () => height);
  terrain.init();

  const surfaceBefore = terrain.surfaceAt(110);
  height = 800;
  const deltaY = terrain.resize();

  assert.equal(deltaY, 160);
  assert.equal(terrain.surfaceAt(110), surfaceBefore + 160);

  width = 1400;
  assert.equal(terrain.resize(), 0);
  assert.ok(Number.isFinite(terrain.surfaceAt(1300)));
});

test("active objects migrate vertically without being reset", () => {
  const objects = createObjects();
  const terrain = { surfaceAt: (x) => 500 + x / 100 };
  const ground = { x: 100, y: 0, yMode: "ground", yOffset: -30 };
  const fixed = { x: 200, y: 120, yMode: "fixed" };
  objects.add(ground);
  objects.add(fixed);
  objects.pawprints.push({ x: 50, y: 1, life: 10 });
  objects.bubbles.push({ x: 10, y: 40, life: 10 });

  objects.reflowVertical(90, terrain);

  assert.equal(objects.list.length, 2);
  assert.equal(ground.y, 471);
  assert.equal(fixed.y, 210);
  assert.equal(objects.pawprints[0].y, 494.5);
  assert.equal(objects.bubbles[0].y, 130);
});
