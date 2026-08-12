import assert from "node:assert/strict";
import test from "node:test";

import { setupInput } from "../src/core/input.js";

test("game input restores focus and jumps after HUD focus is released", (t) => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalPerformance = globalThis.performance;
  const listeners = new Map();
  const gameSurface = { closest: () => null };
  const hudButton = { closest: (selector) => selector.includes("#ui") ? {} : null };
  let jumps = 0;
  let focusReturns = 0;
  let now = 1000;

  globalThis.window = {
    addEventListener(type, listener) { listeners.set(type, listener); },
  };
  globalThis.document = { activeElement: hudButton };
  globalThis.performance = { now: () => now };
  t.after(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.performance = originalPerformance;
  });

  setupInput({
    onJump: () => { jumps++; },
    onGameFocus: () => { focusReturns++; },
  });

  listeners.get("keydown")({ code: "Space", target: hudButton });
  assert.equal(jumps, 0, "space on a HUD control must not activate the game");

  document.activeElement = gameSurface;
  listeners.get("keydown")({ code: "Space", target: gameSurface, preventDefault() {} });
  assert.equal(jumps, 1, "space must jump after focus returns to the game");
  assert.equal(focusReturns, 1, "keyboard play must keep focus on the game");

  now += 121;
  listeners.get("pointerdown")({ target: gameSurface, preventDefault() {} });
  assert.equal(focusReturns, 2, "a game tap must reclaim focus");
  assert.equal(jumps, 2, "a game tap must still jump while reclaiming focus");

  listeners.get("pointerdown")({ target: hudButton, preventDefault() {} });
  assert.equal(jumps, 2, "the HUD tap itself must never become a jump");
});

test("held movement keys emit once and release cleanly when focus is lost", (t) => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const listeners = new Map();
  const moves = [];
  let crouches = 0;

  globalThis.window = {
    addEventListener(type, listener) { listeners.set(type, listener); },
  };
  globalThis.document = { activeElement: null };
  t.after(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  setupInput({
    onMove: (direction) => moves.push(direction),
    onCrouch: () => { crouches++; },
  });

  let prevented = 0;
  const right = { code: "ArrowRight", preventDefault: () => { prevented++; } };
  listeners.get("keydown")(right);
  listeners.get("keydown")({ ...right, repeat: true });

  assert.deepEqual(moves, [1]);
  assert.equal(prevented, 2);

  listeners.get("blur")();
  assert.deepEqual(moves, [1, 0]);
  assert.equal(crouches, 1);
});
