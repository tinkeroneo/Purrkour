import assert from "node:assert/strict";
import test from "node:test";

import { getProgressionBeatIds } from "../src/game/progression.js";
import { getWorldRule } from "../src/game/world-rules.js";
import { getTheme, getThemeOrder } from "../src/world/themes.js";

test("the volcano is a complete world immediately before the return journey", () => {
  const theme = getTheme("volcano");
  assert.equal(theme.label, "Vulkan");
  assert.ok(theme.palette.groundAlpha >= 0.8);
  assert.ok(theme.palette.ocean[0] > theme.palette.ocean[1]);
  assert.equal(getThemeOrder().at(-1), "volcano");
  assert.equal(getWorldRule("volcano").label, "Heiße Basaltsprünge");

  const beats = getProgressionBeatIds();
  assert.equal(beats[beats.indexOf("RETURN_JOURNEY") - 1], "VOLCANO_RUN");
});
