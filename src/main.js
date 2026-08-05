import { makeCanvas } from "./core/util.js";
import { createAudio } from "./core/audio.js";
import { setupInput } from "./core/input.js";
import { createSafeStorage } from "./core/storage.js";

import { createGameState } from "./game/state.js";
import { createJourneyAlbum } from "./game/album.js";
import { getFlowMultiplier } from "./game/flow.js";
import { createHUD } from "./game/hud.js";
import { createLoop } from "./game/loop.js";
import { setupDebugControls } from "./game/debug.js";
import { recordScore } from "./game/records.js";

import { createTerrain } from "./world/terrain.js";
import { createBackground } from "./world/background.js";
import { getThemeOrder } from "./world/themes.js";

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
  flowDisplay: document.getElementById("flowDisplay"),
  flowValue: document.getElementById("flowValue"),
  flowFill: document.getElementById("flowFill"),
  journeyLabel: document.getElementById("journeyLabel"),
  journeyProgress: document.getElementById("journeyProgress"),
  journeyFill: document.getElementById("journeyFill"),
  albumBtn: document.getElementById("albumBtn"),
  albumDialog: document.getElementById("albumDialog"),
  albumWorlds: document.getElementById("albumWorlds"),
  albumStops: document.getElementById("albumStops"),
  albumRuns: document.getElementById("albumRuns"),
  albumMissions: document.getElementById("albumMissions"),
  albumRoutes: document.getElementById("albumRoutes"),
  albumFlow: document.getElementById("albumFlow"),
  albumBest: document.getElementById("albumBest"),
  albumDiscoveries: document.getElementById("albumDiscoveries"),
  closeAlbumBtn: document.getElementById("closeAlbumBtn"),
  goals: document.getElementById("goals"),
  missionDisplay: document.getElementById("missionDisplay"),
  missionLabel: document.getElementById("missionLabel"),
  missionProgress: document.getElementById("missionProgress"),
  missionFill: document.getElementById("missionFill"),
  riskDisplay: document.getElementById("riskDisplay"),
  riskLabel: document.getElementById("riskLabel"),
  riskProgress: document.getElementById("riskProgress"),
  catnip: document.getElementById("catnip"),
  restBtn: document.getElementById("restBtn"),
  crouchBtn: document.getElementById("crouchBtn"),
  soundBtn: document.getElementById("soundBtn"),
  speedBtn: document.getElementById("speedBtn"),
  themeBtn: document.getElementById("themeBtn"),
  autoThemeBtn: document.getElementById("autoThemeBtn"),
  minimalBtn: document.getElementById("minimalBtn"),
  helpBtn: document.getElementById("helpBtn"),
  helpDialog: document.getElementById("helpDialog"),
  closeHelpBtn: document.getElementById("closeHelpBtn"),
  gameOverDialog: document.getElementById("gameOverDialog"),
  gameOverScore: document.getElementById("gameOverScore"),
  gameOverBest: document.getElementById("gameOverBest"),
  gameOverFlow: document.getElementById("gameOverFlow"),
  gameOverBestLabel: document.getElementById("gameOverBestLabel"),
  restartBtn: document.getElementById("restartBtn"),
};


const canvas = makeCanvas(canvasEl, ctx);
const config = window.__purrkourConfig || {};
const THEME_STORAGE_KEY = "purrkour.initialTheme";
const ONBOARDING_STORAGE_KEY = "purrkour.onboardingSeen.v1";
const runStorage = createSafeStorage(getLocalStorage());
const queryTheme = new URLSearchParams(window.location.search).get("theme");
const storedTheme = runStorage.getItem(THEME_STORAGE_KEY);
const initialTheme = queryTheme || config.initialTheme || storedTheme || undefined;
const game = createGameState({ initialTheme });
const album = createJourneyAlbum(runStorage);
album.observe(game);
const hud = createHUD(ui);
if (initialTheme) game.userTheme = initialTheme;

setupThemeControls(game, ui.themeBtn, ui.autoThemeBtn);
setupHudMinimode(uiRoot, ui.minimalBtn);
setupSpeedIndicator(ui.speedBtn);
setupCrouchButton(game, ui.crouchBtn);
setupHelp(game, ui.helpDialog, ui.helpBtn, ui.closeHelpBtn, runStorage);
setupAlbum(game, album, ui);

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  if (theme) runStorage.setItem(THEME_STORAGE_KEY, theme);
  else runStorage.removeItem(THEME_STORAGE_KEY);
}

function setupThemeControls(game, themeButton, autoButton) {
  if (!themeButton) return;
  const order = getThemeOrder();
  if (!order.length) return;

  function syncAutoButton() {
    if (!autoButton) return;
    const automatic = !game.userTheme;
    autoButton.setAttribute("aria-pressed", String(automatic));
    autoButton.classList.toggle("is-active", automatic);
  }

  function nextTheme() {
    const cur = game.userTheme || game.theme || order[0];
    const idx = Math.max(0, order.indexOf(cur));
    const next = order[(idx + 1) % order.length];
    const from = game.theme || cur;

    game.userTheme = next;
    game.theme = next;
    storeTheme(next);

    // smooth fade if supported by background
    game.themeFade = { active: true, from, to: next, t: 0, dur: 80 };
    syncAutoButton();
  }

  function clearOverride() {
    game.userTheme = null;
    storeTheme(null);
    // let progression reclaim theme next tick
    syncAutoButton();
  }

  themeButton.addEventListener("click", nextTheme);
  autoButton?.addEventListener("click", clearOverride);
  syncAutoButton();
}

function setupCrouchButton(game, el) {
  if (!el) return;
  function setCrouch(active) {
    if (!game.input) game.input = { moveDir: 0, crouch: false };
    game.input.crouch = !!active;
    el.classList.toggle("is-active", !!active);
    el.setAttribute("aria-pressed", String(!!active));
  }
  el.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    try { el.setPointerCapture(event.pointerId); } catch {
      // Pointer capture is optional; release handlers still clear the state.
    }
    setCrouch(true);
  }, { passive: false });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    el.addEventListener(eventName, () => setCrouch(false), { passive: true });
  }
}


function setupHudMinimode(uiRoot, button) {
  if (!uiRoot || !button) return;
  function toggleMinimode() {
    const minimal = uiRoot.classList.toggle("minimal");
    button.textContent = minimal ? "+" : "HUD";
    button.setAttribute("aria-pressed", String(minimal));
    button.setAttribute("aria-label", minimal ? "Vollständige Ansicht einschalten" : "Kompaktansicht einschalten");
  }
  button.addEventListener("click", toggleMinimode);
}

function setupHelp(game, dialog, openButton, closeButton, storage) {
  if (!dialog || !openButton || !closeButton) return;

  function openHelp() {
    if (dialog.open) return;
    game.helpOpen = true;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeHelp() {
    try { storage?.setItem(ONBOARDING_STORAGE_KEY, "1"); } catch {
      // Help remains usable when preference storage is unavailable.
    }
    game.helpOpen = false;
    game.safeTimer = Math.max(game.safeTimer ?? 0, 30);
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  openButton.addEventListener("click", openHelp);
  closeButton.addEventListener("click", closeHelp);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeHelp();
  });

  let onboardingSeen = false;
  try { onboardingSeen = storage?.getItem(ONBOARDING_STORAGE_KEY) === "1"; } catch {
    onboardingSeen = false;
  }
  const helpQuery = new URLSearchParams(window.location.search).get("help");
  if (helpQuery === "1" || (helpQuery !== "0" && !onboardingSeen)) openHelp();
}

function setupSpeedIndicator(el) {
  if (!el) return;
  el.type = "button";
  el.disabled = true;
  el.title = "Pace steigt automatisch mit der Progression";
}

function setupAlbum(game, album, ui) {
  if (!ui.albumDialog || !ui.albumBtn || !ui.closeAlbumBtn) return;
  const worldLabels = {
    forest: "Wald", ocean: "Ozean", island: "Insel", mars: "Mars", mountain: "Berge",
    jungle: "Dschungel", cliff: "Klippen", city: "Stadt", desert: "Wüste",
  };
  const setpieceLabels = { ocean: "Meerfahrt", rocket: "Raketenflug" };

  function renderAlbum() {
    const data = album.snapshot();
    if (ui.albumWorlds) ui.albumWorlds.textContent = `${data.themes.length}/${getThemeOrder().length}`;
    if (ui.albumStops) ui.albumStops.textContent = String(data.beats.length);
    if (ui.albumRuns) ui.albumRuns.textContent = String(data.runs);
    if (ui.albumMissions) ui.albumMissions.textContent = String(data.missions);
    if (ui.albumRoutes) ui.albumRoutes.textContent = String(data.routes);
    if (ui.albumFlow) ui.albumFlow.textContent = `x${data.bestFlow}`;
    if (ui.albumBest) ui.albumBest.textContent = String(data.bestScore);
    if (ui.albumDiscoveries) {
      const worlds = data.themes.map((key) => worldLabels[key] || key);
      const journeys = data.setpieces.map((key) => setpieceLabels[key] || key);
      ui.albumDiscoveries.textContent = [...worlds, ...journeys].join(" · ") || "Der erste Pfotenabdruck wartet.";
    }
  }

  function openAlbum() {
    if (ui.albumDialog.open) return;
    album.observe(game);
    renderAlbum();
    game.helpOpen = true;
    if (typeof ui.albumDialog.showModal === "function") ui.albumDialog.showModal();
    else ui.albumDialog.setAttribute("open", "");
  }

  function closeAlbum() {
    game.helpOpen = false;
    game.safeTimer = Math.max(game.safeTimer ?? 0, 30);
    if (typeof ui.albumDialog.close === "function") ui.albumDialog.close();
    else ui.albumDialog.removeAttribute("open");
  }

  ui.albumBtn.addEventListener("click", openAlbum);
  ui.closeAlbumBtn.addEventListener("click", closeAlbum);
  ui.albumDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAlbum();
  });
  if (new URLSearchParams(window.location.search).get("album") === "1") openAlbum();
}



const audio = createAudio(ui.soundBtn, runStorage);
const terrain = createTerrain(() => canvas.W, () => canvas.H);
// Lakes are currently disabled (keeps core gameplay calmer). We keep a tiny no-op
// object so other modules can call lakes.update/draw safely.
const lakes = { reset() {}, update() {}, draw() {} };
const bg = createBackground(() => canvas.W, () => canvas.H, lakes, game, hud);

const cat = createCat(game, hud);
const objects = createObjects();
const drawer = createDrawer(ctx, canvas, game, cat, terrain, lakes, bg);
const spawner = createSpawner(game, terrain, objects, canvas);
const collider = createCollider(game, cat, terrain, objects, audio, hud, canvas, {
  onGameOver: showGameOver,
});

function showGameOver({ score }) {
  album.finishRun(game);
  const result = recordScore(runStorage, score);
  if (ui.gameOverScore) ui.gameOverScore.textContent = String(score);
  if (ui.gameOverBest) ui.gameOverBest.textContent = String(result.best);
  if (ui.gameOverFlow) ui.gameOverFlow.textContent = `x${getFlowMultiplier(game.flow?.best)}`;
  if (ui.gameOverBestLabel) ui.gameOverBestLabel.hidden = !result.isNewBest;
  if (!ui.gameOverDialog) return;

  if (typeof ui.gameOverDialog.showModal === "function") ui.gameOverDialog.showModal();
  else ui.gameOverDialog.setAttribute("open", "");
}

function closeGameOver() {
  if (!ui.gameOverDialog) return;
  if (typeof ui.gameOverDialog.close === "function") ui.gameOverDialog.close();
  else ui.gameOverDialog.removeAttribute("open");
}

if (ui.gameOverDialog) {
  ui.gameOverDialog.addEventListener("cancel", (event) => event.preventDefault());
}

if (ui.restartBtn) {
  ui.restartBtn.addEventListener("click", () => {
    collider.resetAll();
    closeGameOver();
  });
}

let layoutInitialized = false;
function resizeLayout() {
  canvas.resize();

  if (!layoutInitialized) {
    terrain.init();
    lakes.reset();
    spawner.reset();
    collider.resetCatPosition();
    layoutInitialized = true;
  } else {
    const deltaY = terrain.resize();
    objects.reflowVertical(deltaY, terrain);
    cat.cat.y += deltaY;
    cat.clampX(canvas.W);
    if (cat.cat.onSurface) cat.cat.y = terrain.surfaceAt(cat.cat.x) - cat.cat.h;
  }

  hud.sync(game, cat.cat);
}

resizeLayout();
window.addEventListener("resize", resizeLayout, { passive: true });

// input
const debug = setupDebugControls({ game, cat, objects, terrain, bg, uiRoot });

setupInput({
  onJump: () => {
    if (game.pause?.active || game.helpOpen) return;
    audio.ensure();
    cat.jump(audio);
  },
  onMove: (dir) => {
    if (game.helpOpen) return;
    if (!game.input) game.input = { moveDir: 0, crouch: false };
    game.input.moveDir = dir;
  },
  onCrouch: (active) => {
    if (game.helpOpen) return;
    if (!game.input) game.input = { moveDir: 0, crouch: false };
    game.input.crouch = !!active;
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
  ,album
});
loop.start();

