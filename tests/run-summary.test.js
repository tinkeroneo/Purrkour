import assert from "node:assert/strict";
import test from "node:test";

import { createReplayUrl, createRunSummary, createShareText } from "../src/game/run-summary.js";

test("run summaries preserve score, best flow, seed and optional theme", () => {
  const summary = createRunSummary({
    score: 321,
    runSeed: 4242,
    userTheme: "desert",
    flow: { best: 11 },
  }, 900);

  assert.deepEqual(summary, {
    score: 321,
    bestScore: 900,
    bestFlow: 4,
    seed: 4242,
    theme: "desert",
  });
  assert.equal(createShareText(summary), "Purrkour: 321 Punkte, Flow x4, Lauf #4242");
});

test("replay links discard debug state and retain deterministic run inputs", () => {
  const url = createReplayUrl(
    "https://example.test/purrkour/?preview=game-over&seed=9#debug",
    { seed: 4242, theme: "city" },
  );
  assert.equal(url, "https://example.test/purrkour/?run=4242&help=0&theme=city");
});
