import assert from "node:assert/strict";
import test from "node:test";

import {
  beginPresentation,
  createPresentationState,
  getPresentationFrame,
  tickPresentation,
} from "../src/game/presentation.js";

test("presentation cues have deterministic enter, hold and exit phases", () => {
  const state = beginPresentation(createPresentationState(), {
    title: "Über das Meer",
    enter: 4,
    hold: 3,
    exit: 3,
  });

  assert.equal(getPresentationFrame(state).alpha, 0);
  for (let i = 0; i < 4; i++) tickPresentation(state);
  assert.equal(getPresentationFrame(state).alpha, 1);
  for (let i = 0; i < 4; i++) tickPresentation(state);
  assert.ok(getPresentationFrame(state).alpha < 1);
  for (let i = 0; i < 2; i++) tickPresentation(state);
  assert.equal(state.active, false);
});

test("reduced motion removes long entrance and exit animation", () => {
  const state = beginPresentation(createPresentationState(), { reducedMotion: true });
  assert.equal(state.enter, 1);
  assert.equal(state.exit, 1);
  tickPresentation(state);
  assert.equal(getPresentationFrame(state).alpha, 1);
});

test("pinned previews remain visible for visual regression checks", () => {
  const state = beginPresentation(createPresentationState(), { kind: "chapter", pinned: true });
  for (let i = 0; i < 500; i++) tickPresentation(state);
  assert.equal(state.active, true);
  assert.deepEqual(getPresentationFrame(state), { alpha: 1, reveal: 1, veil: 1 });
});
