import assert from "node:assert/strict";
import test from "node:test";

import { createSafeStorage } from "../src/core/storage.js";

test("safe storage forwards values and reports successful mutations", () => {
  const values = new Map();
  const storage = createSafeStorage({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  });

  assert.equal(storage.setItem("theme", "forest"), true);
  assert.equal(storage.getItem("theme"), "forest");
  assert.equal(storage.removeItem("theme"), true);
  assert.equal(storage.getItem("theme"), null);
});

test("safe storage absorbs blocked and unavailable backends", () => {
  const blocked = createSafeStorage({
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("full"); },
    removeItem() { throw new Error("blocked"); },
  });
  const missing = createSafeStorage(null);

  assert.equal(blocked.getItem("key"), null);
  assert.equal(blocked.setItem("key", "value"), false);
  assert.equal(blocked.removeItem("key"), false);
  assert.equal(missing.getItem("key"), null);
  assert.equal(missing.setItem("key", "value"), false);
});
