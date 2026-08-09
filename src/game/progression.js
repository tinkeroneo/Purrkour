// src/game/progression.js
// Zentrale Dramaturgie: ein Ort, der entscheidet wann was passiert.
// Beats statt Zufall. Spawner/Background/Audio lesen nur game.progression.*

import { clamp } from "../core/util.js";
import { beginPresentation } from "./presentation.js";
import { getBeatPresentationCue } from "./presentation-cues.js";
import { getSectionPhase } from "./gameplay-motifs.js";
import { setBaseSpeed } from "./speed.js";
import { getWorldRule } from "./world-rules.js";

// --- Tuning (hier feinjustieren, ohne suchen) ---
export const SAFE_AFTER_CHECKPOINT = 180; // 2–3s @60fps
const seconds = (value) => value * 60;

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

function progressionSpeedMulForScore(score) {
  const u = smoothstep(clamp(score / 1400, 0, 1));
  return lerp(1.0, 1.8, u);
}

// Speed curves per beat (base speed; modifiers are still applied in collider)
function speedForBeat(beatId, u) {
  switch (beatId) {
    case "FOREST_INTRO":
      return lerp(2.05, 2.35, easeInOut(u));
    case "CHECKPOINT_BREATH":
    case "RIDGE_BREATH":
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
    case "RIDGE_BREATH":
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
  { id: "FOREST_INTRO", label: "Waldpfade", theme: "forest", lenScore: 220, minTicks: seconds(30), maxTicks: seconds(90), motif: "rhythm", night: false, safeOnEnter: 0 },
  // Breath is usually triggered by checkpoint pickup; we keep a fallback scheduled beat too.
  { id: "CHECKPOINT_BREATH", label: "Waldlichtung", theme: "forest", lenScore: 6, minTicks: seconds(5), maxTicks: seconds(8), motif: "release", breath: true, night: false, safeOnEnter: seconds(8) },

  // Story setpiece: ocean crossing (zeppelin/balloon/raft)
  { id: "OCEAN_JOURNEY", label: "Über das Meer", theme: "ocean", lenScore: 1, night: false, safeOnEnter: 0, setpiece: "ocean", targetTheme: "island" },

  // Land & breathe
  { id: "ISLAND_REST", label: "Inselrast", theme: "island", lenScore: 230, minTicks: seconds(35), maxTicks: seconds(90), motif: "long-arcs", night: false, safeOnEnter: SAFE_AFTER_CHECKPOINT },

  // Rocket cutscene to Mars
  { id: "ROCKET_FLIGHT", label: "Start zu den Sternen", theme: "mars", lenScore: 1, night: false, safeOnEnter: 0, setpiece: "rocket", targetTheme: "mars" },

  // Actual Mars gameplay segment
  { id: "MARS_RUN", label: "Marslauf", theme: "mars", lenScore: 230, minTicks: seconds(35), maxTicks: seconds(90), motif: "low-gravity", night: false, safeOnEnter: 0 },

  // Rocket cutscene back from Mars
  { id: "ROCKET_RETURN", label: "Rückflug", theme: "mars", lenScore: 1, night: false, safeOnEnter: 0, setpiece: "rocket", targetTheme: "mountain" },

  { id: "MOUNTAIN_FOCUS", label: "Bergpfade", theme: "mountain", lenScore: 200, minTicks: seconds(30), maxTicks: seconds(75), motif: "vertical", night: false, safeOnEnter: 0 },
  { id: "NIGHT_PASSAGE", label: "Nachtpassage", theme: "mountain", lenScore: 200, minTicks: seconds(25), maxTicks: seconds(70), motif: "sightlines", night: true, safeOnEnter: 0 },
  { id: "RIDGE_BREATH", label: "Aussichtspunkt", theme: "mountain", lenScore: 4, minTicks: seconds(5), maxTicks: seconds(8), motif: "release", breath: true, night: false, safeOnEnter: seconds(8) },

  { id: "JUNGLE_RUN", label: "Dschungellauf", theme: "jungle", lenScore: 230, minTicks: seconds(35), maxTicks: seconds(90), motif: "reactions", night: false, safeOnEnter: 0 },
  { id: "CLIFF_RUN", label: "Klippenpfad", theme: "cliff", lenScore: 230, minTicks: seconds(35), maxTicks: seconds(90), motif: "edges", night: false, safeOnEnter: 0 },
  { id: "CITY_RUN", label: "Dächer der Stadt", theme: "city", lenScore: 230, minTicks: seconds(35), maxTicks: seconds(90), motif: "duck-rhythm", night: false, safeOnEnter: 0 },
  { id: "DESERT_RUN", label: "Wüstenwind", theme: "desert", lenScore: 230, minTicks: seconds(35), maxTicks: seconds(90), motif: "wide-jumps", night: false, safeOnEnter: 0 },

  // Return journey back to forest loop
  { id: "RETURN_JOURNEY", label: "Heimreise", theme: "ocean", lenScore: 1, night: false, safeOnEnter: 0, setpiece: "ocean", targetTheme: "forest" },
];

export function getProgressionBeatIds() {
  return BEATS.map((beat) => beat.id);
}

export function getProgressionBeatSummaries() {
  return BEATS.map(({ id, label, theme, lenScore, minTicks = 0, maxTicks = 0, motif = null, setpiece = null, breath = false }) => ({
    id, label, theme, lenScore, minTicks, maxTicks, motif, setpiece, breath,
  }));
}

function clearWorld(objects) {
  objects.list.length = 0;
  objects.pawprints.length = 0;
  // keep bubbles/toast
}

export function createProgression({ game, objects, startThemeFade, audio }) {
  function initialProgressionState() {
    return {
      controlsSpeed: true,
      beatIdx: 0,
      beatId: BEATS[0].id,
      beatLabel: BEATS[0].label,
      beatProgress: 0,
      beatStartScore: 0,
      beatTick: 0,
      night: 0,
      nightTarget: 0,
      ambiencePreset: null,
      sectionPhase: "establish",
      gameplayMotif: BEATS[0].motif,
      suppressHazards: false,
      _lastCheckpointActive: false,
      _forcedBreath: false,
      _resumeIdx: null,
    };
  }

  // persistent progression state lives on game.progression
  if (!game.progression) {
    game.progression = initialProgressionState();
  }

  function currentBeat() {
    return BEATS[game.progression.beatIdx] ?? BEATS[0];
  }

  function enterBeat(idx, reason = "") {
    const beat = BEATS[idx] ?? BEATS[0];
    const previousBeat = BEATS[game.progression.beatIdx] ?? null;
    const journeyComplete = reason === "journey-complete";
    const controlReturned = reason === "setpiece-finished";
    const cinematic = journeyComplete || reason === "boot" || reason === "reset" || !!beat.setpiece
      || (!controlReturned && previousBeat?.theme !== beat.theme);
    game.progression.beatIdx = idx;
    game.progression.beatId = beat.id;
    game.progression.beatLabel = beat.label;
    game.progression.beatProgress = 0;
    game.progression.beatStartScore = game.score;
    game.progression.beatTick = 0;
    game.progression._forcedBreath = (reason === "checkpoint");
    game.progression.suppressHazards = !!beat.breath;
    if (beat.breath) clearWorld(objects);
    const cue = getBeatPresentationCue(beat.id) || {};
    const worldRule = getWorldRule(beat.theme);
    beginPresentation(game.presentation, {
      kind: cinematic ? "chapter" : "milestone",
      kicker: journeyComplete ? "REISE VOLLENDET" : (cue.kicker || `ETAPPE ${idx + 1}`),
      title: journeyComplete ? "Wieder daheim" : beat.label,
      subtitle: journeyComplete ? "Neun Welten. Eine Spur zurück zum Anfang." : `${cue.subtitle || "Die Reise geht weiter"} · ${worldRule.label}`,
      accent: cue.accent,
      reducedMotion: game.reducedMotion,
      pinned: game.presentationPreview === "chapter" && idx === 0,
      blocking: cinematic,
      lockFrames: 28,
      enter: cinematic ? undefined : 10,
      hold: cinematic ? undefined : 34,
      exit: cinematic ? undefined : 16,
    });
    audio?.SFX?.chapter?.(beat.theme);

    // Theme switch (soft fade)
    if (!beat.setpiece && !game.userTheme) startThemeFade?.(beat.theme, 80);

    // Safe mode is ONLY set here.
    if (beat.safeOnEnter > 0) {
      game.safeTimer = beat.safeOnEnter | 0;
    }

    // Beat-owned night
    game.progression.nightTarget = beat.night ? 1 : 0;

    // Optional setpiece (requested; setpieces.js owns timeline + finish flag)
    if (beat.setpiece) {
      if (game.setpiece) {
        game.setpiece.finished = false;
        game.setpiece.requestedMode = beat.setpiece; // "ocean" | "rocket"
        game.setpiece.targetTheme = beat.targetTheme ?? null;
        game.setpiece.t = 0;
        game.setpiece.phaseT = 0;
        game.setpiece.phase = "approach";
        game.setpiece.cooldown = 0;
        // clear the world for scripted beats
        clearWorld(objects);
        // during flight: no safe mode (landing/next beat sets it)
        game.safeTimer = 0;
      }
    } else if (game.setpiece) {
      game.setpiece.targetTheme = null;
    }
  }

  function enterBeatById(id, reason = "") {
    const idx = BEATS.findIndex((b) => b.id === id);
    if (idx < 0) return false;
    enterBeat(idx, reason || "by-id");
    return true;
  }


  function maybeCheckpointBreath() {
    // checkpointActive is set in collider when blanket is collected.
    const was = game.progression._lastCheckpointActive;
    const now = !!game.checkpointActive;
    game.progression._lastCheckpointActive = now;

    if (!was && now) {
      // force breath beat immediately (unless we are in a setpiece)
      if (!game.setpiece?.active) {
        // remember where to resume in the main script
        game.progression._resumeIdx = (game.progression.beatIdx + 1) % BEATS.length;
        // jump to CHECKPOINT_BREATH (index 1)
        enterBeat(1, "checkpoint");
      }
    }
  }

  function advanceIfNeeded() {
    const beat = currentBeat();

    // Setpiece beats end when setpieces.js marks them finished.
    if (beat.setpiece) {
      const sp = game.setpiece;
      if (!sp || !sp.finished) return;
      // clear the flag so it won't re-trigger
      sp.finished = false;
      const nextIdx = (game.progression.beatIdx + 1) % BEATS.length;
      enterBeat(nextIdx, beat.id === "RETURN_JOURNEY" ? "journey-complete" : "setpiece-finished");
      return;
    }
    const u = scoreU(game, game.progression.beatStartScore, beat.lenScore);
    const reachedMinimum = game.progression.beatTick >= (beat.minTicks ?? 0);
    const reachedMaximum = Number.isFinite(beat.maxTicks) && game.progression.beatTick >= beat.maxTicks;
    if (beat.breath && reachedMinimum) {
      if (beat.id === "CHECKPOINT_BREATH" && game.progression._forcedBreath) {
        const resumeIdx = game.progression._resumeIdx ?? ((game.progression.beatIdx + 1) % BEATS.length);
        game.progression._resumeIdx = null;
        enterBeat(resumeIdx, "resume");
        return;
      }
      const nextIdx = (game.progression.beatIdx + 1) % BEATS.length;
      enterBeat(nextIdx, "breath-complete");
      return;
    }
    if (!reachedMaximum && !(reachedMinimum && u >= 1)) return;

    // otherwise progress linearly (loop after RETURN_JOURNEY back to FOREST_INTRO)
    const nextIdx = (game.progression.beatIdx + 1) % BEATS.length;
    enterBeat(nextIdx, "auto");
  }

  function updateSetpiece() {
    // No-op: setpieces.js owns the scripted timelines.
    // Progression only reacts to sp.finished in advanceIfNeeded().
  }

  function applyOutputs() {
    const beat = currentBeat();
    if (beat.theme && !beat.setpiece && !game.userTheme) game.theme = beat.theme;
    const worldRule = getWorldRule(game.theme);
    game.worldRule = worldRule;

    // speed curve (score-based for non-setpiece, time-based for setpiece)
    const u = beat.setpiece
      ? clamp((game.setpiece?.t ?? 0) / Math.max(1, game.setpiece?.dur ?? 1), 0, 1)
      : scoreU(game, game.progression.beatStartScore, beat.lenScore);

    game.progression.beatLabel = beat.label;
    const timelineU = beat.setpiece
      ? u
      : clamp(game.progression.beatTick / Math.max(1, beat.minTicks ?? 1), 0, 1);
    const maxTimeU = beat.setpiece
      ? u
      : clamp(game.progression.beatTick / Math.max(1, beat.maxTicks ?? beat.minTicks ?? 1), 0, 1);
    game.progression.beatProgress = beat.setpiece
      ? u
      : beat.breath ? timelineU : Math.max(Math.min(u, timelineU), maxTimeU);
    game.progression.sectionPhase = beat.breath ? "release" : getSectionPhase(timelineU);
    game.progression.gameplayMotif = beat.motif || beat.theme;
    game.progression.suppressHazards = !!beat.breath;

    setBaseSpeed(game, speedForBeat(beat.id, u) * worldRule.paceMul);
    game.progressionSpeedMul = progressionSpeedMulForScore(game.score);

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

    if (!game.pause?.active) {
      game.progression.beatTick++;

      // checkpoint breather can override in-run
      maybeCheckpointBreath();

      // beat-specific logic
      updateSetpiece();
      advanceIfNeeded();
    }

    // always write outputs for loop/spawner/bg
    applyOutputs();
  }

  function reset() {
    game.progression = initialProgressionState();
    enterBeat(0, "reset");
  }

  // Ensure we start in a known beat on boot
  if (game.progression.beatIdx === 0 && game.score === 0) {
    enterBeat(0, "boot");
  }

  return { update, reset, enterBeat, enterBeatById, currentBeat };
}
