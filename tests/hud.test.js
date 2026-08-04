import assert from "node:assert/strict";
import test from "node:test";

import { createHUD } from "../src/game/hud.js";

function trackedElement() {
  let text = "";
  let html = "";
  const writes = { text: 0, html: 0, attributes: 0 };
  return {
    writes,
    set textContent(value) {
      text = value;
      writes.text++;
    },
    get textContent() { return text; },
    set innerHTML(value) {
      html = value;
      writes.html++;
    },
    get innerHTML() { return html; },
    setAttribute() { writes.attributes++; }
  };
}

test("HUD skips DOM writes while visible state is unchanged", () => {
  const ui = {
    score: trackedElement(),
    lives: trackedElement(),
    miceDisplay: trackedElement(),
    speedBtn: trackedElement(),
    catnip: trackedElement(),
    restBtn: trackedElement()
  };
  const hud = createHUD(ui);
  const game = {
    score: 10,
    lives: 6,
    maxLives: 7,
    mice: 2,
    speedMul: 1,
    theme: "forest",
    pause: { active: false }
  };

  hud.sync(game, {});
  const firstWrites = Object.fromEntries(
    Object.entries(ui).map(([key, el]) => [key, { ...el.writes }])
  );
  hud.sync(game, {});

  for (const [key, el] of Object.entries(ui)) {
    assert.deepEqual(el.writes, firstWrites[key], `${key} was rewritten`);
  }

  game.lives = 5;
  hud.sync(game, {});
  assert.equal(ui.lives.writes.html, firstWrites.lives.html + 1);
});
