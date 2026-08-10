import assert from "node:assert/strict";
import test from "node:test";

import {
  getPresentationCardLayout,
  getVehicleBounds,
  rectanglesOverlap,
  rectangleInsideViewport,
} from "../src/game/presentation-layout.js";

const viewports = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
];

test("travel cards stay inside all supported viewports", () => {
  for (const viewport of viewports) {
    for (const vehicleX of [viewport.width * 0.36, viewport.width * 0.72]) {
      const card = getPresentationCardLayout(viewport.width, viewport.height, "travel", vehicleX);
      assert.equal(rectangleInsideViewport(card, viewport.width, viewport.height, 0), true);
    }
  }
});

test("vehicle bounds reflect the complete visible silhouette", () => {
  const zeppelin = getVehicleBounds({
    type: "zeppelin",
    vehicle: { x: 278, y: 250 },
    vehicleScale: 1,
  });
  assert.deepEqual(zeppelin, { x: 200, y: 146, w: 170, h: 104 });
  assert.equal(rectangleInsideViewport(zeppelin, 390, 844), true);
});

test("travel card placement can be checked against a vehicle silhouette", () => {
  const card = getPresentationCardLayout(390, 844, "travel", 140);
  const vehicle = getVehicleBounds({
    type: "balloon",
    vehicle: { x: 140, y: 250 },
    vehicleScale: 1,
  });
  assert.equal(rectanglesOverlap(card, vehicle, 6), false);
});
