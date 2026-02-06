import { makeCanvas } from "./core/util.js";
import { createAudio } from "./core/audio.js";
import { setupInput } from "./core/input.js";

import { createGameState } from "./game/state.js";
import { createHUD } from "./game/hud.js";
import { createLoop } from "./game/loop.js";
import { setupDebugControls } from "./game/debug.js";

import { createTerrain } from "./world/terrain.js";
import { createBackground } from "./world/background.js";
import { THEMES, getThemeOrder } from "./world/themes.js";

import { createCat } from "./entities/cat.js";

import { createObjects } from "./objects/objects.js";
import { createDrawer } from "./objects/draw.js";
import { createSpawner } from "./objects/spawn.js";
import { createCollider } from "./objects/collide.js";

const canvasEl = document.getElementById("game");
const ctx = canvasEl.getContext("2d");

const uiRoot = document.getElementById("ui");

const ui = {
  score: document.getElementById("score"),
  lives: document.getElementById("lives"),
  miceDisplay: document.getElementById("miceDisplay"),
  catnip: document.getElementById("catnip"),
  restBtn: document.getElementById("restBtn"),
  soundBtn: document.getElementById("soundBtn"),
  speedBtn: document.getElementById("speedBtn"),
};


const canvas = makeCanvas(canvasEl, ctx);
const config = window.__purrkourConfig || {};
const THEME_STORAGE_KEY = "purrkour.initialTheme";
const queryTheme = new URLSearchParams(window.location.search).get("theme");
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
const initialTheme = queryTheme || config.initialTheme || storedTheme || undefined;
const game = createGameState({ initialTheme });
const hud = createHUD(ui);

setupThemeHudToggle(game, ui.catnip);
setupHudMinimode(uiRoot, uiRoot);
setupSpeedToggle(game, ui.speedBtn);

function setupThemeHudToggle(game, el) {
  if (!el) return;
  const order = getThemeOrder();
  if (!order.length) return;

  el.style.cursor = "pointer";
  el.title = "Tap: next theme • Long-press: auto";

  let downAt = 0;
  let longPressTimer = null;

  function nextTheme() {
    const cur = game.userTheme || game.theme || order[0];
    const idx = Math.max(0, order.indexOf(cur));
    const next = order[(idx + 1) % order.length];
    const from = game.theme || cur;

    game.userTheme = next;
    game.theme = next;

    // smooth fade if supported by background
    game.themeFade = { from, to: next, t: 0, dur: 350 };
  }

  function clearOverride() {
    game.userTheme = null;
    // let progression reclaim theme next tick
  }

  el.addEventListener("pointerdown", (e) => {
    downAt = performance.now();
    try { el.setPointerCapture(e.pointerId); } catch {}
    longPressTimer = setTimeout(() => {
      clearOverride();
      longPressTimer = null;
    }, 450);
  }, { passive: true });

  el.addEventListener("pointerup", () => {
    const held = performance.now() - downAt;
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      // short tap
      if (held < 450) nextTheme();
    }
  }, { passive: true });

  el.addEventListener("pointercancel", () => {
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = null;
  }, { passive: true });
}


function setupHudMinimode(uiRoot, el) {
  if (!uiRoot || !el) return;
  let longPressTimer = null;
  function toggleMinimode() {
    uiRoot.classList.toggle("minimal");
  }
  el.addEventListener("pointerdown", (e) => {
    if (e.target !== el) return;
    if (e.target.closest && e.target.closest("button,.btn")) return;
    longPressTimer = setTimeout(() => {
      toggleMinimode();
      longPressTimer = null;
    }, 500);
  }, { passive: true });
  el.addEventListener("pointerup", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });
  el.addEventListener("pointercancel", () => {
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = null;
  }, { passive: true });
}

function setupSpeedToggle(game, el) {
  if (!el) return;
  const speeds = [0.8, 1.0, 1.2, 1.4, 1.6, 3, 5]
  const fmt = (v) => `${v.toFixed(1)}x`;
  function syncLabel() {
    el.textContent = fmt(game.speedMul ?? 1.0);
  }
  syncLabel();
  function pulse() {
    el.animate(
      [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.08)", filter: "brightness(1.2)" },
        { transform: "scale(1)", filter: "brightness(1)" }
      ],
      { duration: 180, easing: "ease-out" }
    );
  }
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const cur = game.speedMul ?? 1.0;
    let i = speeds.indexOf(cur);
    if (i < 0) i = 1;
    const next = speeds[(i + 1) % speeds.length];
    game.speedMul = next;
    syncLabel();
    pulse();
  }, { passive: false });
}


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
const collider = createCollider(game, cat, terrain, objects, audio, hud, canvas);

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
const debug = setupDebugControls({ game, cat, objects, terrain, bg, uiRoot });

setupInput({
  onJump: () => {
    if (game.pause?.active) return;
    audio.ensure();
    cat.jump(audio);
  },
  onKey: (e) => {
    if (debug?.onKey?.(e)) return;
  }
});

// HUD: rest / pause at the hut
if (ui.restBtn) {
  ui.restBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // Toggle pause via hut.
    if (game.pause?.active) {
      game.pause.active = false;
      game.pause.phase = "resume";
      game.pause.t = 0;
      // short invuln so resume feels fair
      game.invulnTimer = Math.max(game.invulnTimer, 40);
    } else {
      if (game.setpiece?.active) return; // don't interrupt setpiece
      game.pause = game.pause || {};
      game.pause.active = true;
      game.pause.phase = "walk";
      game.pause.t = 0;
    }
  }, { passive: false });
}

// game loop
const loop = createLoop({
  game, cat, terrain, lakes, bg,
  objects, spawner, collider,
  drawer, hud, audio, canvas
});
loop.start();

