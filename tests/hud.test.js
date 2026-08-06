import assert from "node:assert/strict";
import test from "node:test";

import { createHUD } from "../src/game/hud.js";

function trackedElement() {
  let text = "";
  let html = "";
  let width = "";
  const writes = { text: 0, html: 0, attributes: 0, styles: 0, classes: 0 };
  return {
    writes,
    style: {
      set width(value) {
        width = value;
        writes.styles++;
      },
      get width() { return width; }
    },
    classList: { toggle() { writes.classes++; } },
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
    flowDisplay: trackedElement(),
    flowValue: trackedElement(),
    flowFill: trackedElement(),
    journeyLabel: trackedElement(),
    journeyProgress: trackedElement(),
    journeyFill: trackedElement(),
    missionDisplay: trackedElement(),
    missionLabel: trackedElement(),
    missionProgress: trackedElement(),
    missionFill: trackedElement(),
    riskDisplay: trackedElement(),
    riskKicker: trackedElement(),
    riskLabel: trackedElement(),
    riskProgress: trackedElement(),
    goals: trackedElement(),
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
    pause: { active: false },
    flow: { count: 2, multiplier: 1, timer: 240, best: 2 },
    progression: { beatLabel: "Waldpfade", beatProgress: 0.25 }
    ,mission: { key: "mice", label: "Mäusejagd", hint: "Sammle 4 Mäuse", progress: 1, target: 4 }
    ,riskRoute: { active: false, id: 0, entered: false, collected: 0, total: 0, bonus: 0 }
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

  game.flow = { count: 3, multiplier: 2, timer: 240, best: 3 };
  game.progression.beatProgress = 0.5;
  hud.sync(game, {});
  assert.equal(ui.flowValue.textContent, "Flow x2");
  assert.equal(ui.flowFill.style.width, "100%");
  assert.equal(ui.journeyFill.style.width, "50%");

  game.mission.progress = 2;
  game.riskRoute = { active: true, id: 1, label: "Goldgrat", entered: true, collected: 2, total: 5, bonus: 80 };
  hud.sync(game, {});
  assert.equal(ui.missionFill.style.width, "50%");
  assert.equal(ui.riskKicker.textContent, "Goldpfad");
  assert.equal(ui.riskLabel.textContent, "Goldgrat");
  assert.equal(ui.riskProgress.textContent, "2/5 · +80");
});
