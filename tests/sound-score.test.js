import assert from "node:assert/strict";
import test from "node:test";

import {
  frequencyForSemitone,
  getSoundScoreProfile,
  motifGap,
  SOUND_SCORE_THEMES,
} from "../src/core/sound-score.js";

test("every world has a restrained adaptive score profile", () => {
  const worlds = ["forest", "ocean", "island", "mars", "mountain", "jungle", "cliff", "city", "desert", "volcano"];
  assert.deepEqual(SOUND_SCORE_THEMES, worlds);
  for (const world of worlds) {
    const profile = getSoundScoreProfile(world);
    assert.equal(profile.key, world);
    assert.equal(profile.notes.length, 4);
    assert.ok(profile.gap >= 6);
    assert.ok(profile.brightness >= 800);
  }
});

test("travel and night states reshape motifs without random scheduling", () => {
  assert.equal(getSoundScoreProfile("forest", "rocket").key, "mars");
  assert.equal(getSoundScoreProfile("forest", "ocean").key, "ocean");
  assert.equal(frequencyForSemitone(220, 0, 0), 220);
  assert.equal(frequencyForSemitone(220, 0, 1), 110);
  assert.ok(motifGap(getSoundScoreProfile("forest"), 1) < motifGap(getSoundScoreProfile("forest"), 0));
});
