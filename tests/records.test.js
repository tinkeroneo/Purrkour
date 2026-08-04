import assert from "node:assert/strict";
import test from "node:test";

import { BEST_SCORE_STORAGE_KEY, readBestScore, recordScore } from "../src/game/records.js";

function memoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, BEST_SCORE_STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, BEST_SCORE_STORAGE_KEY);
      value = nextValue;
    },
  };
}

test("best score only increases and identifies a new record", () => {
  const storage = memoryStorage("12");

  assert.deepEqual(recordScore(storage, 8), { best: 12, isNewBest: false });
  assert.deepEqual(recordScore(storage, 21.9), { best: 21, isNewBest: true });
  assert.equal(readBestScore(storage), 21);
});

test("best score storage is validated and optional", () => {
  assert.equal(readBestScore(memoryStorage("not-a-number")), 0);
  assert.deepEqual(recordScore(null, 7), { best: 7, isNewBest: true });
  assert.doesNotThrow(() => recordScore({ getItem() { throw new Error("blocked"); } }, 4));
});
