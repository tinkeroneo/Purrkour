import { makeCanvas } from "./core/util.js";
import { createAudio } from "./core/audio.js";
import { setupInput } from "./core/input.js";

import { createGameState } from "./game/state.js";
import { createHUD } from "./game/hud.js";
import { createLoop } from "./game/loop.js";

import { createTerrain } from "./world/terrain.js";
import { createBackground } from "./world/background.js";
import { THEMES } from "./world/themes.js";

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
};


function setupMobileThemeToggle() {
  // Lightweight on-screen toggles for touch devices (Handy).
  const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
  if (!isTouch) return;
  if (!uiRoot) return;

  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.right = "10px";
  wrap.style.bottom = "10px";
  wrap.style.display = "flex";
  wrap.style.gap = "8px";
  wrap.style.zIndex = "9999";

  const mkBtn = (label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.padding = "10px 12px";
    b.style.borderRadius = "12px";
    b.style.border = "1px solid rgba(255,255,255,0.25)";
    b.style.background = "rgba(0,0,0,0.35)";
    b.style.color = "#fff";
    b.style.font = "600 14px system-ui, sans-serif";
    b.style.backdropFilter = "blur(6px)";
    b.style.webkitBackdropFilter = "blur(6px)";
    b.style.touchAction = "manipulation";
    b.style.userSelect = "none";
    return b;
  };

  const themeBtn = mkBtn("Theme");
  const bandBtn = mkBtn("Band");

  const themeKeys = Object.keys(THEMES);
  themeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const prev = game.theme;
    const i = Math.max(0, themeKeys.indexOf(prev));
    const next = themeKeys[(i + 1) % themeKeys.length];
    game.theme = next;
    // small fade helper (optional)
    if (game.themeFade) {
      game.themeFade.active = true;
      game.themeFade.from = prev;
      game.themeFade.to = next;
      game.themeFade.t = 0;
      game.themeFade.dur = 40;
    }
  }, { passive: false });

  const bands = ["ground", "mid", "air"];
  bandBtn.addEventListener("click", (e) => {
    e.preventDefault();
    game.vertical = game.vertical || {};
    const cur = game.vertical.band || "ground";
    const i = Math.max(0, bands.indexOf(cur));
    game.vertical.band = bands[(i + 1) % bands.length];
  }, { passive: false });

  wrap.appendChild(themeBtn);
  wrap.appendChild(bandBtn);
  document.body.appendChild(wrap);
}

const canvas = makeCanvas(canvasEl, ctx);
const game = createGameState();
const hud = createHUD(ui);
setupMobileThemeToggle();

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
setupInput({
  onJump: () => {
    if (game.pause?.active) return;
    audio.ensure();
    cat.jump(audio);
  },
  onKey: (e) => {
    // Dev shortcuts (non-destructive)
    if (e.code === "KeyH") {
      if (!uiRoot) return;
      uiRoot.style.display = (uiRoot.style.display === "none") ? "" : "none";
    } else if (e.code === "Digit1") {
      // jump close to ocean/setpiece
      window.__purrkour?.gotoOcean?.();
    } else if (e.code === "Digit2") {
      // trigger current setpiece immediately
      window.__purrkour?.triggerSetpiece?.();
    } else if (e.code === "KeyO") {
      // force ocean beat (progression)
      window.__purrkour?.enterBeat?.("OCEAN_JOURNEY");
    } else if (e.code === "KeyM") {
      // force rocket -> mars
      window.__purrkour?.enterBeat?.("ROCKET_FLIGHT");
    } else if (e.code === "Digit3") {
      // cycle theme
      const order = game.themeCycle?.order || [];
      if (!order.length) return;
      const i = Math.max(0, order.indexOf(game.theme));
      game.theme = order[(i + 1) % order.length];
    } else if (e.code === "KeyR") {
      // soft reset via reload (fastest reliable)
      location.reload();
    }
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
// DEBUG helpers
window.__purrkour = {
  game,
  cat,
  objects,
  terrain,
  bg
};
window.__purrkour.setTheme = (k) => game.theme = k;

// quick testing shortcuts (Console)
window.__purrkour.setScore = (s) => { game.score = Math.max(0, s | 0); };
window.__purrkour.gotoOcean = () => {
  // Prefer progression if present
  if (game.progressionApi?.enterBeatById) {
    game.progressionApi.enterBeatById("OCEAN_JOURNEY", "dev");
    return;
  }
  game.score = game.setpiece?.startScore ?? 120;
  if (game.setpiece) game.setpiece.cooldown = 1000000;
};

window.__purrkour.triggerSetpiece = () => {
  if (!game.setpiece) return;
  // Explicit request works with Progression + legacy
  game.setpiece.requestedMode = game.setpiece.mode || "ocean";
  game.setpiece.cooldown = 1000000;
  game.score = Math.max(game.score, game.setpiece.startScore);
};

window.__purrkour.enterBeat = (id) => {
  const api = game.progressionApi;
  if (api?.enterBeatById) api.enterBeatById(id, "dev");
};
