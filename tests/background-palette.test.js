import assert from "node:assert/strict";
import test from "node:test";

import { createGameState } from "../src/game/state.js";
import { createBackground } from "../src/world/background.js";
import { getTheme } from "../src/world/themes.js";

test("palette sampling never mutates theme-owned colors", () => {
  const game = createGameState({ initialTheme: "forest" });
  game.vertical.band = "air";
  const themePalette = getTheme("forest").palette;
  const before = structuredClone(themePalette);
  const background = createBackground(() => 800, () => 600, {}, game, null);

  for (let i = 0; i < 20; i++) {
    const sampled = background.palette();
    assert.equal(sampled.key, "forest");
    assert.ok(Array.isArray(sampled.skyTop));
  }

  assert.deepEqual(themePalette, before);
});
