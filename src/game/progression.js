// src/game/progression.js
// Zentrale Dramaturgie: ein Ort, der entscheidet wann was passiert.
// Beats statt Zufall. Spawner/Background/Audio lesen nur game.progression.*

import { clamp } from "../core/util.js";

// --- Tuning (hier feinjustieren, ohne suchen) ---
export const SAFE_AFTER_CHECKPOINT = 180; // 2–3s @60fps

function smoothstep(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOut(t) {
  t = clamp(t, 0, 1);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function scoreU(game, startScore, lenScore) {
  return clamp((game.score - startScore) / Math.max(1, lenScore), 0, 1);
}

// Speed curves per beat (base speed; modifiers are still applied in collider)
function speedForBeat(beatId, u) {
  switch (beatId) {
    case "FOREST_INTRO":
      return lerp(2.05, 2.35, easeInOut(u));
    case "CHECKPOINT_BREATH":
      return lerp(2.10, 2.05, smoothstep(u));
    case "OCEAN_JOURNEY":
      return lerp(1.80, 1.65, smoothstep(u));
    case "ISLAND_REST":
      return lerp(1.95, 2.15, easeInOut(u));
    case "MOUNTAIN_FOCUS":
      return lerp(2.25, 2.85, easeInOut(u));
    case "NIGHT_PASSAGE":
      return lerp(2.35, 2.60, easeInOut(u));
    default:
      return 2.25;
  }
}

// Ambience presets are *additive* layers; theme.ambience() still runs.
function ambienceForBeat(beatId, night) {
  const n = clamp(night ?? 0, 0, 1);
  switch (beatId) {
    case "CHECKPOINT_BREATH":
      return { whoosh: 0.03, ocean: 0.04, rumble: 0.02, engine: 0.0001, night: 0.02 + n * 0.05, tau: 0.22 };
    case "OCEAN_JOURNEY":
      return { whoosh: 0.10, ocean: 0.28, rumble: 0.05, engine: 0.02, night: 0.02 + n * 0.08, tau: 0.18 };
    case "ISLAND_REST":
      return { whoosh: 0.02, ocean: 0.10, rumble: 0.02, engine: 0.0001, night: 0.02 + n * 0.05, tau: 0.20 };
    case "MOUNTAIN_FOCUS":
      return { whoosh: 0.06, ocean: 0.0001, rumble: 0.10, engine: 0.0001, night: 0.02 + n * 0.06, tau: 0.14 };
    case "NIGHT_PASSAGE":
      return { whoosh: 0.05, ocean: 0.02, rumble: 0.06, engine: 0.0001, night: 0.06 + n * 0.18, tau: 0.14 };
    default:
      return null;
  }
}

// Beat table (score lengths are intentionally simple; tweak freely)
const BEATS = [
  { id: "FOREST_INTRO", theme: "forest", lenScore: 55, night: false, safeOnEnter: 0 },
  // Breath is usually triggered by checkpoint pickup; we keep a fallback scheduled beat too.
  { id: "CHECKPOINT_BREATH", theme: "forest", lenScore: 25, night: false, safeOnEnter: SAFE_AFTER_CHECKPOINT },
  { id: "OCEAN_JOURNEY", theme: "ocean", lenScore: 1, night: false, safeOnEnter: 0, setpiece: true },
  { id: "ISLAND_REST", theme: "island", lenScore: 45, night: false, safeOnEnter: SAFE_AFTER_CHECKPOINT },
  { id: "MOUNTAIN_FOCUS", theme: "mountain", lenScore: 90, night: false, safeOnEnter: 0 },
  { id: "NIGHT_PASSAGE", theme: "mountain", lenScore: 70, night: true, safeOnEnter: 0 },
];

function clearWorld(objects) {
  objects.list.length = 0;
  objects.pawprints.length = 0;
  // keep bubbles/toast
}

export function createProgression({ game, objects, startThemeFade, audio }) {
  // persistent progression state lives on game.progression
  if (!game.progression) {
    game.progression = {
      controlsSpeed: true,
      beatIdx: 0,
      beatId: BEATS[0].id,
      beatStartScore: 0,
      beatTick: 0,
      // night as continuous value (0..1), progression-owned
      night: 0,
      nightTarget: 0,
      ambiencePreset: null,
      // checkpoint-triggered breath
      _lastCheckpointActive: false,
      _forcedBreath: false,
    };
  }

  function currentBeat() {
    return BEATS[game.progression.beatIdx] ?? BEATS[0];
  }

  function enterBeat(idx, reason = "") {
    const beat = BEATS[idx] ?? BEATS[0];
    game.progression.beatIdx = idx;
    game.progression.beatId = beat.id;
    game.progression.beatStartScore = game.score;
    game.progression.beatTick = 0;
    game.progression._forcedBreath = (reason === "checkpoint");

    // Theme switch (soft fade)
    startThemeFade?.(beat.theme, beat.setpiece ? 110 : 80);

    // Safe mode is ONLY set here.
    if (beat.safeOnEnter > 0) {
      game.safeTimer = beat.safeOnEnter | 0;
    }

    // Beat-owned night
    game.progression.nightTarget = beat.night ? 1 : 0;

    // Optional setpiece
    if (beat.setpiece) {
      // deterministic-ish vehicle roll (but per-journey)
      const r = Math.random();
      game.setpiece.type = (r < 0.18) ? "zeppelin" : (r < 0.35) ? "raft" : "balloon";
      game.setpiece.active = true;
      game.setpiece.t = 0;
      game.setpiece.cooldown = 0;
      game.setpiece.motion = {
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
        phase: Math.random() * 1000,
      };
      clearWorld(objects);
      // during flight: no safe mode (landing sets it via next beat)
      game.safeTimer = 0;
    }
  }

  function maybeCheckpointBreath() {
    // checkpointActive is set in collider when blanket is collected.
    const was = game.progression._lastCheckpointActive;
    const now = !!game.checkpointActive;
    game.progression._lastCheckpointActive = now;

    if (!was && now) {
      // force breath beat immediately (unless we are in a setpiece)
      if (!game.setpiece?.active) {
        // jump to CHECKPOINT_BREATH (index 1)
        enterBeat(1, "checkpoint");
      }
    }
  }

  function advanceIfNeeded() {
    const beat = currentBeat();
    if (beat.setpiece) return; // setpiece controls its own end

    const u = scoreU(game, game.progression.beatStartScore, beat.lenScore);
    if (u < 1) return;

    // If this breath beat was forced by checkpoint, we do NOT want it to "eat" the scripted beat order.
    // We simply return to the next beat in the main script based on where we came from.
    if (beat.id === "CHECKPOINT_BREATH" && game.progression._forcedBreath) {
      // continue with OCEAN_JOURNEY once player has had the breather
      enterBeat(2, "resume");
      return;
    }

    // otherwise progress linearly (loop after NIGHT_PASSAGE back to CHECKPOINT_BREATH for wave rhythm)
    const nextIdx = (game.progression.beatIdx + 1) % BEATS.length;
    enterBeat(nextIdx, "auto");
  }

  function updateSetpiece() {
    const beat = currentBeat();
    if (!beat.setpiece) return;

    // Run the flight timeline; landing transitions to ISLAND_REST.
    if (game.setpiece?.active) {
      game.setpiece.t++;
      if (game.setpiece.t >= game.setpiece.dur) {
        game.setpiece.active = false;
        game.setpiece.cooldown = 0;
        // Land into island rest
        enterBeat(3, "landing");
      }
    } else {
      // If something turned it off unexpectedly, still land cleanly.
      enterBeat(3, "landing");
    }
  }

  function applyOutputs() {
    const beat = currentBeat();

    // speed curve (score-based for non-setpiece, time-based for setpiece)
    const u = beat.setpiece
      ? clamp((game.setpiece?.t ?? 0) / Math.max(1, game.setpiece?.dur ?? 1), 0, 1)
      : scoreU(game, game.progression.beatStartScore, beat.lenScore);

    game.speed = speedForBeat(beat.id, u);

    // night smoothing (owned by progression)
    const tau = 0.08; // lower = smoother
    game.progression.night = lerp(game.progression.night, game.progression.nightTarget, tau);
    game.nightOverride = clamp(game.progression.night, 0, 1);

    // ambience preset for loop
    const preset = ambienceForBeat(beat.id, game.nightOverride);
    game.progression.ambiencePreset = preset;
    if (audio?.enabled && preset) {
      audio.setAmbience?.(preset);
    }
  }

  function update() {
    // init if needed
    if (!game.progression.beatId) enterBeat(0, "init");

    game.progression.beatTick++;

    // checkpoint breather can override in-run
    maybeCheckpointBreath();

    // beat-specific logic
    updateSetpiece();
    advanceIfNeeded();

    // always write outputs for loop/spawner/bg
    applyOutputs();
  }

  // Ensure we start in a known beat on boot
  if (game.progression.beatIdx === 0 && game.score === 0) {
    enterBeat(0, "boot");
  }

  return { update, enterBeat, currentBeat };
}
