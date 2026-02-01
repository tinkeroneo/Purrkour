import { makeCanvas } from "./core/util.js";
import { createAudio } from "./core/audio.js";
import { setupInput } from "./core/input.js";

import { createGameState } from "./game/state.js";
import { createHUD } from "./game/hud.js";
import { createLoop } from "./game/loop.js";

import { createTerrain } from "./world/terrain.js";
import { createBackground } from "./world/background.js";

import { createCat } from "./entities/cat.js";

import { createObjects } from "./objects/objects.js";
import { createDrawer } from "./objects/draw.js";
import { createSpawner } from "./objects/spawn.js";
import { createCollider } from "./objects/collide.js";

const canvasEl = document.getElementById("game");
const ctx = canvasEl.getContext("2d");

const ui = {
  score: document.getElementById("score"),
  lives: document.getElementById("lives"),
  miceDisplay: document.getElementById("miceDisplay"),
  catnip: document.getElementById("catnip"),
  soundBtn: document.getElementById("soundBtn"),
};

const canvas = makeCanvas(canvasEl, ctx);
const game = createGameState();
const hud = createHUD(ui);

const audio = createAudio(ui.soundBtn);
const terrain = createTerrain(() => canvas.W, () => canvas.H);
// Lakes are currently disabled (keeps core gameplay calmer). We keep a tiny no-op
// object so other modules can call lakes.update/draw safely.
const lakes = { reset() {}, update() {}, draw() {} };
const bg = createBackground(() => canvas.W, () => canvas.H, lakes, game, hud);

const cat = createCat(game, hud);
const objects = createObjects();
const drawer = createDrawer(ctx, canvas, game, cat, terrain, lakes, bg);
const spawner = createSpawner(game, terrain, objects, canvas);
const collider = createCollider(game, cat, terrain, objects, audio, hud);

// resize init
function hardResize() {
  canvas.resize();
  terrain.init();
  lakes.reset();
  spawner.reset();
  collider.resetCatPosition();
  hud.sync(game, cat.cat);
}

hardResize();
window.addEventListener("resize", hardResize, { passive: true });

// input
setupInput({
  onJump: () => {
    audio.ensure();
    cat.jump(audio);
  }
});

// game loop
const loop = createLoop({
  game, cat, terrain, lakes, bg,
  objects, spawner, collider,
  drawer, hud, audio
});
loop.start();
// DEBUG helpers
window.__purrkour = {
  game,
  cat,
  objects,
  terrain,
  bg
};
window.__purrkour.setTheme = (k) => game.theme = k;
