export function createFixedStepClock({ stepMs = 1000 / 60, maxDeltaMs = 100, maxSteps = 5 } = {}) {
  let lastTime = null;
  let accumulator = 0;

  function advance(time, update) {
    const now = Number(time);
    if (!Number.isFinite(now)) return 0;
    if (lastTime === null) {
      lastTime = now;
      return 0;
    }
    const delta = Math.min(maxDeltaMs, Math.max(0, now - lastTime));
    lastTime = now;
    accumulator += delta;
    let steps = 0;
    while (accumulator + 1e-9 >= stepMs && steps < maxSteps) {
      update(stepMs);
      accumulator -= stepMs;
      steps += 1;
    }
    if (steps === maxSteps && accumulator >= stepMs) {
      accumulator %= stepMs;
    }
    return steps;
  }

  function reset(time = null) {
    lastTime = Number.isFinite(Number(time)) ? Number(time) : null;
    accumulator = 0;
  }

  return { advance, reset, get stepMs() { return stepMs; } };
}
