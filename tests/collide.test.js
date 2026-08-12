import assert from "node:assert/strict";
import test from "node:test";

import { createCollider, isPassRewardObject } from "../src/objects/collide.js";
import { createGameState } from "../src/game/state.js";

test("ignoring a gold route does not award passive flow", () => {
  assert.equal(isPassRewardObject({ kind: "obstacle", type: "dog" }), true);
  assert.equal(isPassRewardObject({ kind: "platform", type: "fence" }), true);
  assert.equal(isPassRewardObject({ kind: "platform", type: "fence", skyPath: true }), false);
  assert.equal(isPassRewardObject({ kind: "collectible", type: "route_mouse" }), false);
});

function createBirdCollisionFixture({ catY = 92, bird = {} } = {}) {
  const game = createGameState();
  const cat = {
    baseX: 110,
    x: 110,
    y: catY,
    w: 58,
    h: 58,
    vy: 10,
    baseMaxJumps: 2,
    maxJumps: 2,
    jumpsLeft: 1,
    animT: 0,
    onSurface: false,
  };
  const targetBird = {
    kind: "obstacle",
    type: "bird",
    x: 100,
    y: 150,
    w: 80,
    h: 30,
    ...bird,
  };
  const objects = {
    list: [targetBird],
    pawprints: [],
    bubbles: [],
    addBubble() {},
    addPuff() {},
    toast() {},
    maybeAddPawprint() {},
    updatePawprints() {},
    updateBubbles() {},
  };
  const audioCalls = { stomp: 0 };
  const audio = {
    SFX: new Proxy({}, {
      get: (_target, key) => key === "stomp"
        ? () => { audioCalls.stomp++; }
        : () => {},
    }),
  };
  const catApi = {
    cat,
    gravityStep() {
      cat.vy += 0.34;
      cat.y += cat.vy;
    },
    clampX() {},
    setAnimFrame() {},
    resetAt() {},
  };
  const collider = createCollider(
    game,
    catApi,
    { surfaceAt: () => 1000, init() {} },
    objects,
    audio,
    { W: 390, sync() {} },
    { width: 390, height: 844 },
  );

  return { game, cat, targetBird, objects, collider, audioCalls };
}

test("landing cleanly on a bird makes that bird permanently harmless", () => {
  const { game, cat, targetBird, objects, collider, audioCalls } = createBirdCollisionFixture();

  collider.update();

  assert.equal(targetBird.landedSafely, true);
  assert.equal(game.lives, 7);
  assert.equal(cat.onSurface, true);
  assert.equal(cat.vy, 0);

  for (let frame = 0; frame < 8; frame++) {
    collider.update();
    assert.equal(cat.onSurface, true, `bird must remain solid on frame ${frame + 1}`);
    assert.equal(cat.y + cat.h, targetBird.y + 1);
  }

  cat.y = targetBird.y + 6;
  collider.update();

  assert.equal(game.lives, 7);
  assert.equal(objects.list.includes(targetBird), true);
  assert.equal(audioCalls.stomp, 1);
});

test("a fast top crossing still lands on a bird", () => {
  const { game, cat, targetBird, collider } = createBirdCollisionFixture({ catY: 70 });
  cat.vy = 120;

  collider.update();

  assert.equal(targetBird.landedSafely, true);
  assert.equal(game.lives, 7);
  assert.equal(cat.y + cat.h, targetBird.y + 1);
  assert.equal(cat.onSurface, true);
});

test("a bird stays dangerous until the cat lands cleanly", () => {
  const { game, cat, objects, collider } = createBirdCollisionFixture({ catY: 145 });
  cat.vy = 0;

  collider.update();

  assert.equal(game.lives, 6);
  assert.equal(objects.list.length, 0);
});
