import { makeCanvas } from "./core/util.js";
import { createAudio } from "./core/audio.js";
import { setupInput } from "./core/input.js";
import { createSafeStorage } from "./core/storage.js";

import { createGameState } from "./game/state.js";
import { createJourneyAlbum } from "./game/album.js";
import { getFlowMultiplier } from "./game/flow.js";
import { createHUD } from "./game/hud.js";
import { createLoop } from "./game/loop.js";
import { beginPresentation, dismissPresentation } from "./game/presentation.js";
import { PRESENTATION_PREVIEWS } from "./game/presentation-cues.js";
import { getSetpieceCatTargetX } from "./game/setpieces.js";
import { setupDebugControls } from "./game/debug.js";
import { recordScore } from "./game/records.js";

import { createTerrain } from "./world/terrain.js";
import { createBackground } from "./world/background.js";
import { getThemeOrder } from "./world/themes.js";
import { getWorldRule } from "./game/world-rules.js";

import { createCat } from "./entities/cat.js";

import { createObjects } from "./objects/objects.js";
import { createDrawer } from "./objects/draw.js";
import { createSpawner } from "./objects/spawn.js";
import { createCollider } from "./objects/collide.js";

const canvasEl = document.getElementById("game");
const ctx = canvasEl.getContext("2d");

const uiRoot = document.getElementById("ui");

const ui = {
  root: uiRoot,
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
  albumManeuvers: document.getElementById("albumManeuvers"),
  albumJourneyMap: document.getElementById("albumJourneyMap"),
  closeAlbumBtn: document.getElementById("closeAlbumBtn"),
  goals: document.getElementById("goals"),
  missionDisplay: document.getElementById("missionDisplay"),
  missionLabel: document.getElementById("missionLabel"),
  missionProgress: document.getElementById("missionProgress"),
  missionFill: document.getElementById("missionFill"),
  riskDisplay: document.getElementById("riskDisplay"),
  riskKicker: document.getElementById("riskKicker"),
  riskLabel: document.getElementById("riskLabel"),
  riskProgress: document.getElementById("riskProgress"),
  catnip: document.getElementById("catnip"),
  restBtn: document.getElementById("restBtn"),
  crouchBtn: document.getElementById("crouchBtn"),
  touchCrouchBtn: document.getElementById("touchCrouchBtn"),
  soundBtn: document.getElementById("soundBtn"),
  speedBtn: document.getElementById("speedBtn"),
  themeBtn: document.getElementById("themeBtn"),
  autoThemeBtn: document.getElementById("autoThemeBtn"),
  minimalBtn: document.getElementById("minimalBtn"),
  helpBtn: document.getElementById("helpBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsPanel: document.getElementById("settingsPanel"),
  helpDialog: document.getElementById("helpDialog"),
  closeHelpBtn: document.getElementById("closeHelpBtn"),
  gameOverDialog: document.getElementById("gameOverDialog"),
  gameOverScore: document.getElementById("gameOverScore"),
  gameOverBest: document.getElementById("gameOverBest"),
  gameOverFlow: document.getElementById("gameOverFlow"),
  gameOverCause: document.getElementById("gameOverCause"),
  gameOverBestLabel: document.getElementById("gameOverBestLabel"),
  restartBtn: document.getElementById("restartBtn"),
  presentationSkip: document.getElementById("presentationSkip"),
  setpieceActionBtn: document.getElementById("setpieceActionBtn"),
  pauseStatus: document.getElementById("pauseStatus"),
  sceneStatus: document.getElementById("sceneStatus"),
};


const canvas = makeCanvas(canvasEl, ctx);
const config = window.__purrkourConfig || {};
const THEME_STORAGE_KEY = "purrkour.initialTheme";
const ONBOARDING_STORAGE_KEY = "purrkour.onboardingSeen.v1";
const runStorage = createSafeStorage(getLocalStorage());
const query = new URLSearchParams(window.location.search);
const previewKind = query.get("preview") || "";
const previewRandom = ["setpiece", "ocean-travel", "rocket-travel"].includes(previewKind)
  ? createSeededRandom(query.get("seed"))
  : null;
if (query.get("touch") === "1") document.body.classList.add("touch-preview");
const queryTheme = query.get("theme");
const storedTheme = runStorage.getItem(THEME_STORAGE_KEY);
const initialTheme = queryTheme || config.initialTheme || storedTheme || undefined;
const game = createGameState({ initialTheme });
if (previewRandom) game.previewRandom = previewRandom;
game.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
window.matchMedia?.("(prefers-reduced-motion: reduce)").addEventListener?.("change", (event) => {
  game.reducedMotion = !!event.matches;
});
game.presentationPreview = previewKind;
if (query.get("reduced") === "1") game.reducedMotion = true;
if (game.presentationPreview === "route") {
  game.riskRoute.nextAt = 0;
  game.reducedMotion = true;
}
const album = createJourneyAlbum(runStorage);
album.observe(game);
const hud = createHUD(ui);
const audio = createAudio(ui.soundBtn, runStorage);
if (initialTheme) game.userTheme = initialTheme;

setupThemeControls(game, ui.themeBtn, ui.autoThemeBtn);
setupHudMinimode(uiRoot, ui.minimalBtn);
setupSpeedIndicator(ui.speedBtn);
setupCrouchButton(game, ui.crouchBtn);
setupCrouchButton(game, ui.touchCrouchBtn);
setupSettingsMenu(ui.settingsBtn, ui.settingsPanel);
setupHelp(game, ui.helpDialog, ui.helpBtn, ui.closeHelpBtn, runStorage, audio);
setupAlbum(game, album, ui);
setupSetpieceAction(game, ui.setpieceActionBtn);

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createSeededRandom(value) {
  let seed = (Number.parseInt(value || "1337", 10) >>> 0) || 1337;
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  for (const eventName of ["contextmenu", "selectstart"]) {
    el.addEventListener(eventName, (event) => event.preventDefault());
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

function setupSetpieceAction(game, button) {
  button?.addEventListener("click", () => {
    if (game.setpiece?.active && game.setpiece.phase === "travel") {
      game.setpiece.actionRequested = true;
    }
  });
}

function setupSettingsMenu(button, panel) {
  if (!button || !panel) return;
  function setOpen(open) {
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  }
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(panel.hidden);
  });
  panel.addEventListener("click", (event) => event.stopPropagation());
  window.addEventListener("pointerdown", () => setOpen(false), { passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

function setupHelp(game, dialog, openButton, closeButton, storage, audio) {
  if (!dialog || !openButton || !closeButton) return;

  function openHelp() {
    if (dialog.open) return;
    game.helpOpen = true;
    if (game.input) { game.input.moveDir = 0; game.input.crouch = false; }
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeHelp() {
    try { storage?.setItem(ONBOARDING_STORAGE_KEY, "1"); } catch {
      // Help remains usable when preference storage is unavailable.
    }
    game.helpOpen = false;
    audio?.ensure?.();
    dismissPresentation(game.presentation);
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
    if (ui.albumManeuvers) ui.albumManeuvers.textContent = String(data.maneuvers);
    if (ui.albumJourneyMap) {
      ui.albumJourneyMap.replaceChildren();
      getThemeOrder().forEach((key, index) => {
        const visited = data.themes.includes(key);
        const world = document.createElement("div");
        world.className = `album-world${visited ? " is-visited" : ""}`;
        const title = document.createElement("strong");
        title.textContent = `${visited ? "✓" : "○"} ${index + 1}. ${worldLabels[key] || key}`;
        const detail = document.createElement("small");
        detail.textContent = visited ? getWorldRule(key).label : "Noch unentdeckt";
        world.append(title, detail);
        ui.albumJourneyMap.append(world);
      });
    }
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
    if (game.input) { game.input.moveDir = 0; game.input.crouch = false; }
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



const terrain = createTerrain(() => canvas.W, () => canvas.H, previewRandom || Math.random);
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

function showGameOver({ score, cause }) {
  album.finishRun(game);
  const result = recordScore(runStorage, score);
  if (ui.gameOverScore) ui.gameOverScore.textContent = String(score);
  if (ui.gameOverBest) ui.gameOverBest.textContent = String(result.best);
  if (ui.gameOverFlow) ui.gameOverFlow.textContent = `x${getFlowMultiplier(game.flow?.best)}`;
  if (ui.gameOverCause) ui.gameOverCause.textContent = cause || game.lastFailureCause || "Hindernis berührt";
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
  const changed = canvas.resize();
  if (layoutInitialized && !changed) return;

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
let resizeFrame = 0;
let resizeFollowup = 0;
function scheduleResizeLayout() {
  if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0;
    resizeLayout();
  });

  clearTimeout(resizeFollowup);
  resizeFollowup = window.setTimeout(() => {
    resizeFollowup = 0;
    resizeLayout();
  }, 180);
}

window.addEventListener("resize", scheduleResizeLayout, { passive: true });
window.addEventListener("orientationchange", scheduleResizeLayout, { passive: true });
window.visualViewport?.addEventListener("resize", scheduleResizeLayout, { passive: true });

// input
const debug = setupDebugControls({ game, cat, objects, terrain, bg, uiRoot });

function togglePause() {
  if (game.pause?.active) {
    game.pause.active = false;
    game.pause.phase = "none";
    game.pause.t = 0;
    game.invulnTimer = Math.max(game.invulnTimer, 40);
    return;
  }
  if (game.finished || game.helpOpen) return;
  game.pause = game.pause || {};
  game.pause.active = true;
  game.pause.phase = game.setpiece?.active ? "setpiece" : "walk";
  game.pause.t = 0;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && !game.pause?.active && !game.finished && !game.helpOpen) togglePause();
});

setupInput({
  onJump: () => {
    if (game.pause?.active) {
      togglePause();
      return;
    }
    if (game.helpOpen) return;
    audio.ensure();
    if (dismissPresentation(game.presentation)) return;
    if (game.setpiece?.active) {
      if (game.setpiece.phase === "travel") game.setpiece.actionRequested = true;
      return;
    }
    cat.jump(audio);
  },
  onMove: (dir) => {
    if (game.helpOpen && dir !== 0) return;
    if (!game.input) game.input = { moveDir: 0, crouch: false };
    game.input.moveDir = dir;
  },
  onCrouch: (active) => {
    if (game.helpOpen && active) return;
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
    togglePause();
  }, { passive: false });
}

// game loop
const loop = createLoop({
  game, cat, terrain, lakes, bg,
  objects, spawner, collider,
  drawer, hud, audio, canvas
  ,album
});

function applyScenePreview() {
  if (game.presentationPreview === "world") {
    game.presentation.active = false;
    game.presentation.blocking = false;
    if (query.get("night") === "1" && game.progression) {
      game.progression.night = 1;
      game.progression.nightTarget = 1;
      game.nightOverride = 1;
    }
    return;
  }
  if (game.presentationPreview === "game-over") {
    game.presentation.active = false;
    game.presentation.blocking = false;
    game.score = 128;
    game.flow.best = 11;
    game.finished = true;
    showGameOver({ score: game.score, cause: "Klippenkante verpasst" });
    return;
  }
  if (game.presentationPreview === "success") {
    beginPresentation(game.presentation, {
      kind: "chapter",
      kicker: "REISE VOLLENDET",
      title: "Wieder daheim",
      subtitle: "Neun Welten. Eine Spur zurück zum Anfang.",
      accent: "#ffd166",
      pinned: true,
      reducedMotion: game.reducedMotion,
    });
    return;
  }
  const mode = game.presentationPreview === "ocean-travel"
    ? "ocean"
    : game.presentationPreview === "rocket-travel"
      ? "rocket"
      : game.presentationPreview === "setpiece" ? (query.get("mode") || "ocean") : null;
  if (!mode) return;

  const checkpoints = {
    start: { phase: "approach", progress: 0.2 },
    boarding: { phase: "board", progress: 0.5 },
    "boarding-mid": { phase: "board", progress: 0.5 },
    "travel-start": { phase: "travel", progress: 0 },
    "travel-25": { phase: "travel", progress: 0.25 },
    "travel-50": { phase: "travel", progress: 0.5 },
    "travel-75": { phase: "travel", progress: 0.75 },
    "arrival-start": { phase: "arrive", progress: 0 },
    arrival: { phase: "arrive", progress: 0.55 },
    "arrival-mid": { phase: "arrive", progress: 0.55 },
    "control-return": { phase: "control", progress: 1 },
  };
  const checkpointKey = query.get("checkpoint") || "";
  const checkpoint = checkpoints[checkpointKey] || null;
  const phase = checkpoint?.phase || query.get("phase") || "travel";
  const parsedProgress = Number.parseFloat(query.get("progress"));
  const progress = checkpoint?.progress ?? (Number.isFinite(parsedProgress) ? parsedProgress : 0.5);
  const type = mode === "rocket" ? "rocket" : (query.get("vehicle") || "balloon");
  const originTheme = query.get("origin") || (mode === "rocket" ? "island" : "forest");
  const targetTheme = query.get("target") || (mode === "rocket" ? "mars" : "island");
  const sp = game.setpieceApi?.previewSetpiece({
    mode, type, phase, progress, originTheme, targetTheme,
  });
  if (!sp) return;

  if (sp.catExitPending) {
    sp.catExitPending = false;
    sp.catInVehicle = false;
  }
  const previewCat = cat.cat ?? cat;
  if (sp.active && !sp.catInVehicle) {
    previewCat.x = getSetpieceCatTargetX(sp, previewCat.baseX);
    previewCat.y = terrain.surfaceAt(previewCat.x) - previewCat.h;
    previewCat.vy = 0;
    previewCat.onSurface = true;
  }
  game.helpOpen = false;
  if (ui.helpDialog?.open) ui.helpDialog.close?.();
  if (checkpoint?.phase === "control") {
    game.presentation.active = false;
    game.presentation.blocking = false;
  }
  game.travelPreviewFrozen = true;
  game.progression.beatLabel = mode === "rocket" ? "Start zu den Sternen" : "Über das Meer";
  game.progression.beatProgress = phase === "control" ? 1 : progress;
  hud.sync(game, previewCat);

  document.body.dataset.previewMode = mode;
  document.body.dataset.previewVehicle = type;
  document.body.dataset.previewPhase = sp.active ? sp.phase : "control";
  document.body.dataset.previewProgress = String(sp.phaseProgress ?? 1);
  document.body.dataset.previewStage = sp.travelStage || "none";
  document.body.dataset.previewCatInVehicle = String(!!sp.catInVehicle);
  document.body.dataset.previewTheme = game.theme;
  document.body.dataset.previewControlReturned = String(!sp.active && !game.controlLocked);
}

applyScenePreview();

ui.presentationSkip?.addEventListener("click", () => {
  audio.ensure();
  dismissPresentation(game.presentation);
});
if (PRESENTATION_PREVIEWS[game.presentationPreview]) {
  beginPresentation(game.presentation, { ...PRESENTATION_PREVIEWS[game.presentationPreview], pinned: true });
}
loop.start();
if (game.travelPreviewFrozen) {
  requestAnimationFrame(() => {
    const colors = new Set();
    let opaque = 0;
    for (let row = 1; row <= 6; row++) {
      for (let column = 1; column <= 10; column++) {
        const x = Math.min(canvas.W - 1, Math.floor((canvas.W * column) / 11));
        const y = Math.min(canvas.H - 1, Math.floor((canvas.H * row) / 7));
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] > 0) opaque++;
        colors.add(`${pixel[0] >> 4}/${pixel[1] >> 4}/${pixel[2] >> 4}/${pixel[3] >> 4}`);
      }
    }
    document.body.dataset.previewCanvasSamples = `${opaque}/${colors.size}`;
    document.body.dataset.previewCanvas = opaque === 60 && colors.size >= 2 ? "painted" : "invalid";
    document.body.dataset.previewReady = "true";
    window.__purrkourPreviewReady = true;
  });
}

