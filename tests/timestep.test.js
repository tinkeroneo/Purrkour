import assert from "node:assert/strict";
import test from "node:test";
import { createFixedStepClock } from "../src/game/timestep.js";

function simulatedSteps(refreshRate, durationMs = 10_000) {
  const clock = createFixedStepClock();
  let steps = 0;
  clock.advance(0, () => { steps += 1; });
  const frameMs = 1000 / refreshRate;
  for (let time = frameMs; time < durationMs; time += frameMs) {
    clock.advance(time, () => { steps += 1; });
  }
  clock.advance(durationMs, () => { steps += 1; });
  return steps;
}

test("simulation advances equally at common display refresh rates", () => {
  const results = [30, 60, 120, 144].map((rate) => simulatedSteps(rate));
  assert.deepEqual(results, [600, 600, 600, 600]);
});

test("large tab-return deltas are capped to avoid a simulation spiral", () => {
  const clock = createFixedStepClock();
  let steps = 0;
  clock.advance(0, () => { steps += 1; });
  const advanced = clock.advance(30_000, () => { steps += 1; });
  assert.equal(advanced, 5);
  assert.equal(steps, 5);
});
