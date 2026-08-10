// src/game/setpieces.js
// Scripted setpieces (story beats) like the Ocean Crossing.
// Goal: flow over stress — visible prep, slow-down, boarding, then travel + landing.

import { clamp, smoothstep, lerp } from "../core/util.js";
import { beginPresentation } from "./presentation.js";
import { getSetpiecePresentationCue } from "./presentation-cues.js";

export const SETPIECE_TIMINGS = {
  ocean: { APPROACH: 240, BOARD: 100, TRAVEL: 480, ARRIVE: 180 },
  rocket: { APPROACH: 180, BOARD: 90, TRAVEL: 540, ARRIVE: 170 },
};

const MANEUVER_THRESHOLDS = Object.freeze([0.18, 0.42, 0.66, 0.84]);
const BOARDING_OFFSETS = Object.freeze({ balloon: 38, raft: 42, zeppelin: 40, rocket: 38 });
const BOARDING_MARGINS = Object.freeze({ balloon: 86, raft: 86, zeppelin: 112, rocket: 86 });

export function getTravelStage(progress) {
  const u = clamp(progress ?? 0, 0, 1);
  if (u < 0.18) return "origin";
  if (u < 0.42) return "departure";
  if (u < 0.72) return "transit";
  if (u < 0.88) return "destination";
  return "arrival";
}

export function getSetpieceCatTargetX(sp, baseX = 110) {
  const vx = sp?.vehicle?.x ?? 0;
  const boardingOffset = BOARDING_OFFSETS[sp?.type] ?? 42;
  if (sp?.phase === "approach") {
    const approach = smoothstep(clamp(((sp.phaseProgress ?? 0) - 0.42) / 0.58, 0, 1));
    return lerp(baseX, vx - 92, approach);
  }
  if (sp?.phase === "board") {
    return vx - lerp(92, boardingOffset, smoothstep(sp.boardingProgress ?? 0));
  }
  if (sp?.phase === "arrive") {
    const exitStart = sp.mode === "rocket" ? 0.68 : 0.72;
    const exit = smoothstep(clamp(((sp.phaseProgress ?? 0) - exitStart) / (1 - exitStart), 0, 1));
    return lerp(vx - boardingOffset, baseX, exit);
  }
  return vx - boardingOffset;
}

function vehicleGroundY(type, surfaceY) {
  if (type === "zeppelin") return surfaceY + 8;
  if (type === "rocket") return surfaceY - 60;
  return surfaceY - 8;
}

export function createSetpieceManager({ game, objects, startThemeFade, canvas, terrain, audio, random = Math.random }) {
  const THEME_PLANS = {
    ocean: [
      { at: "travel", theme: "ocean", fade: 90 },
      { at: "arrive", theme: "target", fallback: "island", fade: 120 },
    ],
    rocket: [
      { at: "arrive", theme: "target", fallback: "mars", fade: 240 },
    ],
  };

  const APPROACH_DUR = SETPIECE_TIMINGS.ocean.APPROACH;
  const BOARD_DUR = SETPIECE_TIMINGS.ocean.BOARD;
  const TRAVEL_DUR = SETPIECE_TIMINGS.ocean.TRAVEL;
  const ARRIVE_DUR = SETPIECE_TIMINGS.ocean.ARRIVE;
  const PRELUDE_DUR = 210; // ~3.5s prelude into ocean

  const R_APPROACH_DUR = SETPIECE_TIMINGS.rocket.APPROACH;
  const R_BOARD_DUR = SETPIECE_TIMINGS.rocket.BOARD;
  const R_TRAVEL_DUR = SETPIECE_TIMINGS.rocket.TRAVEL;
  const R_ARRIVE_DUR = SETPIECE_TIMINGS.rocket.ARRIVE;

  function boardAnchorX(type, requestedX) {
    const margin = BOARDING_MARGINS[type] ?? 86;
    return clamp(requestedX, 0, Math.max(0, canvas.W - margin));
  }

  function refreshManeuverWindow(sp) {
    const threshold = sp.maneuverThresholds?.[sp.maneuvers] ?? 1.1;
    sp.maneuverReady = sp.phase === "travel"
      && sp.maneuvers < sp.maneuverLimit
      && sp.maneuverCooldown <= 0
      && (sp.phaseProgress ?? 0) >= threshold;
  }

  function updateTravelManeuver(sp) {
    if (sp.maneuverCooldown > 0) sp.maneuverCooldown--;
    sp.maneuverLift = (sp.maneuverLift || 0) * 0.88;
    refreshManeuverWindow(sp);
    if (!sp.actionRequested) return;
    sp.actionRequested = false;
    if (!sp.maneuverReady) return;
    sp.maneuvers++;
    sp.totalManeuvers = (sp.totalManeuvers || 0) + 1;
    sp.maneuverCooldown = 54;
    sp.maneuverLift = -18;
    const reward = 4 + sp.maneuvers * 2;
    game.score += reward;
    objects.addBubble?.("whoosh!", sp.vehicle?.x || canvas.W * 0.5, (sp.vehicle?.y || canvas.H * 0.4) - 24);
    objects.toast?.(`Reisemanöver ${sp.maneuvers}/${sp.maneuverLimit} · +${reward} ✨`, 80);
    audio?.SFX?.dash?.();
  }

  function beginCatExit(sp) {
    if (!sp.catInVehicle || sp.catExitPending) return;
    sp.catExitPending = true;
  }

  const OCEAN_PHASES = {
    approach({ sp }) {
      // vehicle stands on land, cat walks in, world eases to a stop
      const u = clamp(sp.phaseT / APPROACH_DUR, 0, 1);
      const targetX = boardAnchorX(sp.type, canvas.W * 0.76);
      const entry = smoothstep(clamp(u / 0.42, 0, 1));
      sp.vehicle.x = lerp(sp.phaseFromX ?? canvas.W + 70, targetX, entry);
      sp.vehicle.y = vehicleGroundY(sp.type, terrain.surfaceAt(sp.vehicle.x));
      sp.phaseProgress = u;
      sp.boardingProgress = 0;
      sp.directionIntensity = 0.12 + smoothstep(u) * 0.2;
      sp.scroll = 1 - smoothstep(u);              // 1 -> 0
      sp.oceanMaskX = canvas.W;
// still land, no ocean

      if (sp.phaseT >= APPROACH_DUR) {
        transitionPhase(sp, "board");
        sp.scroll = 0;
        // little UI bubble (optional)
        objects.addBubble?.("einsteigen", sp.vehicle.x, sp.vehicle.y - 34);
      }
    },
    board({ sp, surf }) {
      // frozen world, cat climbs in; ocean starts behind vehicle near end
      sp.vehicle.x = boardAnchorX(sp.type, canvas.W * 0.76);
      sp.vehicle.y = vehicleGroundY(sp.type, surf);

      const u = clamp(sp.phaseT / BOARD_DUR, 0, 1);
      sp.phaseProgress = u;
      sp.boardingProgress = u;
      sp.directionIntensity = 0.32 + smoothstep(u) * 0.18;
      // ocean creeps in from behind the vehicle (right side)
      const reveal = smoothstep(clamp((u - 0.64) / 0.36, 0, 1));
      sp.oceanMaskX = lerp(sp.phaseFromMask ?? canvas.W, canvas.W * 0.62, reveal);

      sp.scroll = 0;
      if (u >= 0.64) sp.catInVehicle = true;

      if (sp.phaseT >= BOARD_DUR) {
        transitionPhase(sp, "travel");
        sp.catInVehicle = true;
      }
    },
    travel({ sp }) {
      // full ocean, vehicle drifts; world scroll resumes smoothly
      const u = clamp(sp.phaseT / TRAVEL_DUR, 0, 1);
      sp.phaseProgress = u;
      sp.travelStage = getTravelStage(u);
      sp.directionIntensity = 0.5 + Math.sin(u * Math.PI) * 0.5;
      sp.vehicleScale = game.reducedMotion ? 0.96 : lerp(1, 0.9, Math.sin(u * Math.PI));

      sp.oceanMaskX = lerp(sp.phaseFromMask ?? 0, 0, smoothstep(clamp(u / 0.14, 0, 1)));

      // ramp world movement back up to normal (gentle takeoff)
      sp.scroll = smoothstep(clamp(u / 0.18, 0, 1)); // 0 -> 1

      // whoosh once at takeoff
      if (!sp._whooshed && sp.phaseT > 20) {
        sp._whooshed = true;
        audio?.SFX?.dash?.();
      }

      // drift vehicle slightly (draw module uses sp.t too)
      const targetX = canvas.W * (game.reducedMotion ? 0.4 : 0.36 + 0.08 * Math.sin((sp.t + sp.motion.phase) * 0.006));
      const safeY = canvas.H < 520
        ? canvas.H * 0.62
        : Math.max(canvas.H * 0.3, canvas.W <= 700 ? Math.min(250, canvas.H * 0.5) : canvas.H * 0.24);
      const driftY = game.reducedMotion ? 0 : Math.sin((sp.t + sp.motion.phase) * 0.02) * 6;
      const targetY = (sp.type === "raft" ? canvas.H * 0.64 : safeY) + driftY + (sp.maneuverLift || 0);
      const reveal = smoothstep(clamp(u / 0.18, 0, 1));
      sp.vehicle.x = lerp(sp.phaseFromX ?? targetX, targetX, reveal);
      sp.vehicle.y = lerp(sp.phaseFromY ?? targetY, targetY, reveal);

      if (sp.phaseT >= TRAVEL_DUR) {
        // Match the left-hand destination coast drawn at the end of travel.
        sp.oceanMaskX = canvas.W * 0.42;
        transitionPhase(sp, "arrive");
      }
    },
    arrive({ sp }) {
      // land creeps in (reverse), world slows to a stop, then cat steps out
      const u = clamp(sp.phaseT / ARRIVE_DUR, 0, 1);
      sp.phaseProgress = u;
      sp.directionIntensity = 0.46 * (1 - smoothstep(u));

      // vehicle comes back to landing spot
      const landX = canvas.W * 0.72;
      const landSurf = terrain.surfaceAt(landX);
      const landingProgress = smoothstep(clamp(u / 0.5, 0, 1));
      const groundY = vehicleGroundY(sp.type, landSurf);
      sp.vehicle.x = lerp(sp.phaseFromX ?? landX, landX, smoothstep(u));
      sp.vehicle.y = lerp(sp.phaseFromY ?? canvas.H * 0.28, groundY, landingProgress);
      sp.vehicleScale = lerp(sp.phaseFromScale ?? 0.9, 1, smoothstep(u));

      // ocean retreats to the right, revealing land behind the vehicle
      const retreat = smoothstep(u);
      sp.oceanMaskX = lerp(sp.phaseFromMask ?? 0, canvas.W, retreat);

      // slow down to 0 near the end
      sp.scroll = 1 - smoothstep(clamp((u - 0.55) / 0.45, 0, 1)); // 1 -> 0
      if (u > 0.72) beginCatExit(sp);

      if (sp.phaseT >= ARRIVE_DUR) {
        // done: cat leaves vehicle, resume gameplay
        sp.catInVehicle = false;
        finishOceanCrossing();
      }
    },
  };

  const ROCKET_PHASES = {
    approach({ sp }) {
      // rocket rolls in on a tiny pad, cat walks up, world slows
      const u = clamp(sp.phaseT / R_APPROACH_DUR, 0, 1);
      const targetX = boardAnchorX(sp.type, canvas.W * 0.76);
      const entry = smoothstep(clamp(u / 0.42, 0, 1));
      sp.vehicle.x = lerp(sp.phaseFromX ?? canvas.W + 70, targetX, entry);
      sp.vehicle.y = vehicleGroundY("rocket", terrain.surfaceAt(sp.vehicle.x));
      sp.phaseProgress = u;
      sp.boardingProgress = 0;
      sp.directionIntensity = 0.14 + smoothstep(u) * 0.24;
      sp.scroll = 1 - smoothstep(u); // 1 -> 0

      if (sp.phaseT >= R_APPROACH_DUR) {
        transitionPhase(sp, "board");
      }
    },
    board({ sp, surf }) {
      sp.scroll = 0;

      // small pre-launch shake + flame cue
      const shake = game.reducedMotion ? 0 : Math.sin(sp.phaseT * 0.4) * 2;
      sp.vehicle.y = vehicleGroundY("rocket", surf) + shake;

      // lock cat into capsule near the end of boarding
      const u = clamp(sp.phaseT / R_BOARD_DUR, 0, 1);
      sp.phaseProgress = u;
      sp.boardingProgress = u;
      sp.directionIntensity = 0.38 + smoothstep(u) * 0.24;
      sp.catInVehicle = u > 0.58;

      if (sp.phaseT >= R_BOARD_DUR) {
        transitionPhase(sp, "travel");
        sp.oceanMaskX = canvas.W;
// ensure no ocean mask used
      }
    },
    travel({ sp }) {
      // fly through space: gentle forward drift + bob
      const u = clamp(sp.phaseT / R_TRAVEL_DUR, 0, 1);
      sp.phaseProgress = u;
      sp.travelStage = getTravelStage(u);
      sp.directionIntensity = 0.58 + Math.sin(u * Math.PI) * 0.42;
      sp.vehicleScale = game.reducedMotion ? 0.96 : lerp(1, 0.86, Math.sin(u * Math.PI));
      sp.scroll = 0.18;
      const targetX = canvas.W * 0.58 + (game.reducedMotion ? 0 : Math.sin(game.tick * 0.02) * 6);
      const targetY = (canvas.H < 520 ? canvas.H * 0.5 : Math.max(canvas.H * 0.32, canvas.W <= 700 ? 250 : 0))
        + (game.reducedMotion ? 0 : Math.sin(game.tick * 0.06) * 4) + (sp.maneuverLift || 0);
      const reveal = smoothstep(clamp(u / 0.16, 0, 1));
      sp.vehicle.x = lerp(sp.phaseFromX ?? targetX, targetX, reveal);
      sp.vehicle.y = lerp(sp.phaseFromY ?? targetY, targetY, reveal);

      if (sp.phaseT >= R_TRAVEL_DUR) {
        transitionPhase(sp, "arrive");
      }
    },
    arrive({ sp, surf }) {
      // descend back to land; world gradually resumes
      const u = clamp(sp.phaseT / R_ARRIVE_DUR, 0, 1);
      sp.phaseProgress = u;
      sp.directionIntensity = 0.5 * (1 - smoothstep(u));
      sp.scroll = smoothstep(u); // 0 -> 1
      sp.vehicle.x = lerp(sp.phaseFromX ?? canvas.W * 0.70, canvas.W * 0.70, smoothstep(u));
      sp.vehicle.y = lerp(sp.phaseFromY ?? canvas.H * 0.32, vehicleGroundY("rocket", surf), smoothstep(u));
      sp.vehicleScale = lerp(sp.phaseFromScale ?? 0.86, 1, smoothstep(u));

      // once we're mostly down, release cat
      if (u > 0.68) beginCatExit(sp);

      if (sp.phaseT >= R_ARRIVE_DUR) {
        finishRocketFlight();
      }
    },
  };

  function runPhase(phases, ctx) {
    const fn = phases[ctx.sp.phase];
    if (fn) fn(ctx);
  }

  function applyThemePlan(sp, phase) {
    const plan = THEME_PLANS[sp.mode];
    if (!plan) return;
    for (const step of plan) {
      if (step.at !== phase) continue;
      const key = (step.theme === "target") ? (sp.targetTheme ?? step.fallback) : step.theme;
      startThemeFade?.(key, step.fade);
    }
  }

  function transitionPhase(sp, nextPhase) {
    sp.phaseFromX = sp.vehicle?.x;
    sp.phaseFromY = sp.vehicle?.y;
    sp.phaseFromMask = sp.oceanMaskX;
    sp.phaseFromScale = sp.vehicleScale ?? 1;
    if (sp.mode === "rocket" && nextPhase === "travel") {
      sp.originSurfaceY = terrain.surfaceAt(sp.vehicle?.x ?? canvas.W * 0.76);
    }
    sp.phase = nextPhase;
    sp.phaseT = 0;
    sp.phaseProgress = 0;
    applyThemePlan(sp, nextPhase);
    const cue = getSetpiecePresentationCue(sp.mode, nextPhase);
    if (cue) {
      beginPresentation(game.presentation, {
        ...cue,
        kind: "travel",
        enter: game.reducedMotion ? 1 : 14,
        hold: game.reducedMotion ? 34 : 46,
        exit: game.reducedMotion ? 1 : 20,
        reducedMotion: game.reducedMotion,
      });
    }
  }

  function clearWorldForBeat() {
    objects.list.length = 0;
    objects.pawprints.length = 0;
    // keep bubbles/toast alive
  }

  function pickVehicle() {
    const r = random();
    return (r < 0.18) ? "zeppelin" : (r < 0.32) ? "raft" : "balloon";
  }

  function triggerOceanCrossing(typeOverride = null) {
    if (!game.setpiece) return;

    const sp = game.setpiece;

    // prevent immediate re-triggering (cooldown is checked in update())
    sp.cooldown = 0;
    sp.finished = false;

    sp.type = typeOverride || pickVehicle();
    sp.mode = "ocean";
    sp.originTheme = game.theme;
    sp.active = true;

    // script state
    sp.phase = "approach";       // approach -> board -> travel -> arrive
    sp.phaseT = 0;
    sp.t = 0;
    sp.dur = APPROACH_DUR + BOARD_DUR + TRAVEL_DUR + ARRIVE_DUR;

    sp.scroll = 1;               // 1..0..1 (used as multiplier for world dx)
    sp.catInVehicle = false;

    // vehicle anchoring (screen space)
    sp.vehicle = {
      x: canvas.W + 70,
      y: vehicleGroundY(sp.type, terrain.surfaceAt(canvas.W + 70)),
    };
    sp.phaseFromX = sp.vehicle.x;
    sp.phaseFromY = sp.vehicle.y;

    // ocean reveal: maskX is where ocean starts (pixels).
    // 0 = full ocean, W = no ocean.
    sp.oceanMaskX = canvas.W;
    sp.preludeActive = false;
    sp.preludeT = 0;
// start with no ocean

    // ambience helper
    sp._whooshed = false;
    sp.actionRequested = false;
    sp.maneuverCooldown = 0;
    sp.maneuvers = 0;
    sp.maneuverLimit = MANEUVER_THRESHOLDS.length;
    sp.maneuverThresholds = MANEUVER_THRESHOLDS.slice();
    sp.maneuverReady = false;
    sp.maneuverLift = 0;
    sp.boardingProgress = 0;
    sp.catExitPending = false;
    sp.vehicleScale = 1;
    sp.travelStage = "origin";

    // keep deterministic drift for the whole setpiece
    sp.motion = sp.motion || { phase: random() * 1000, dx: 0, dy: 0, vx: 0, vy: 0 };
    sp.directionIntensity = 0.12;
    sp.phaseProgress = 0;

    clearWorldForBeat();

    // lock player input during the scripted beat (collider will enforce)
    game.controlLocked = true;
  }

  function finishOceanCrossing() {
    if (!game.setpiece) return;
    const sp = game.setpiece;

    sp.active = false;
    sp.phase = "none";
    sp.phaseT = 0;
    sp.t = 0;

    sp.scroll = 1;
    sp.oceanMaskX = canvas.W;
    sp.preludeActive = false;
    sp.preludeT = 0;
// avoid looping the same beat at the same score
    sp.cooldown = 0;
    sp.startScore = Math.max(sp.startScore + 200, game.score + 200);
    sp.finished = true;

    game.controlLocked = false;

    // short grace window (landing calm)
    game.safeTimer = 180;
    audio?.SFX?.combo?.();
  }


  function update() {
    if (!game.setpiece) return;
    const sp = game.setpiece;

    // triggers (scripted beats)
    if (!sp.active) {
      sp.cooldown = (sp.cooldown ?? 0) + 1;
      sp.rocketCooldown = (sp.rocketCooldown ?? 0) + 1;

      // Explicit request from Progression/Debug (bypasses score scheduling)
      if (sp.requestedMode) {
        const mode = sp.requestedMode;
        sp.requestedMode = null;
        if (mode === "rocket") { triggerRocketFlight(); return; }
        if (mode === "ocean")  { triggerOceanCrossing(); return; }
      }

      // If Progression owns the story beats, do not auto-trigger via score.
      if (game.progression?.controlsSpeed) return;

      // Rocket has priority once scheduled (fun intermezzo)
      if (game.score >= (sp.nextRocketAt ?? 999999) && (sp.rocketCooldown ?? 0) > 240) {
        triggerRocketFlight();
        return;
      }

      // Ocean prelude: soft shoreline + theme fade before setpiece
      if (!sp.preludeActive && game.score >= sp.startScore && (sp.cooldown ?? 0) > 180) {
        sp.preludeActive = true;
        sp.preludeT = 0;
        sp.oceanMaskX = canvas.W;
        startThemeFade?.("ocean", 120);
      }

      if (sp.preludeActive) {
        sp.preludeT++;
        const u = clamp(sp.preludeT / PRELUDE_DUR, 0, 1);
        sp.oceanMaskX = lerp(canvas.W, canvas.W * 0.55, smoothstep(u));
        if (u >= 1) {
          sp.preludeActive = false;
          triggerOceanCrossing();
        }
        return;
      }
      // Ocean crossing at baseline milestone
      if (game.score >= sp.startScore && (sp.cooldown ?? 0) > 180) {
        triggerOceanCrossing();
      }
      return;
    }

    // active scripted beat
    sp.t++;
    sp.phaseT++;
    updateTravelManeuver(sp);

    const vx = sp.vehicle?.x ?? (canvas.W * 0.76);
    const surf = terrain.surfaceAt(vx);

    if (sp.mode === "rocket") {
      runPhase(ROCKET_PHASES, { sp, surf });
    } else {
      runPhase(OCEAN_PHASES, { sp, surf });
    }
    refreshManeuverWindow(sp);

    // safety: hard cap
    const phaseTiming = SETPIECE_TIMINGS[sp.mode] || SETPIECE_TIMINGS.ocean;
    const hardCap = phaseTiming.APPROACH + phaseTiming.BOARD + phaseTiming.TRAVEL + phaseTiming.ARRIVE + 60;
    if (sp.t > hardCap) {
      sp.catInVehicle = false;
      if (sp.mode === "rocket") finishRocketFlight();
      else finishOceanCrossing();
    }
  }



  function triggerRocketFlight() {
    if (!game.setpiece) return;
    const sp = game.setpiece;

    sp.finished = false;
    sp.mode = "rocket";


    sp.rocketCooldown = 0;

    sp.mode = "rocket";
    sp.type = "rocket";
    sp.originTheme = game.theme;
    sp.active = true;

    sp.phase = "approach";  // approach -> board -> travel -> arrive
    sp.phaseT = 0;
    sp.directionIntensity = 0.14;
    sp.phaseProgress = 0;
    sp.t = 0;
    sp.dur = R_APPROACH_DUR + R_BOARD_DUR + R_TRAVEL_DUR + R_ARRIVE_DUR;

    sp.scroll = 1;
    sp.catInVehicle = false;
    sp.oceanMaskX = canvas.W;
    sp.phaseFromMask = canvas.W;
    sp.actionRequested = false;
    sp.maneuverCooldown = 0;
    sp.maneuvers = 0;
    sp.maneuverLimit = MANEUVER_THRESHOLDS.length;
    sp.maneuverThresholds = MANEUVER_THRESHOLDS.slice();
    sp.maneuverReady = false;
    sp.maneuverLift = 0;
    sp.boardingProgress = 0;
    sp.catExitPending = false;
    sp.vehicleScale = 1;
    sp.travelStage = "origin";

    // place rocket to the right, then move to cat
    sp.vehicle = {
      x: canvas.W + 70,
      y: vehicleGroundY("rocket", terrain.surfaceAt(canvas.W * 0.75)),
      w: 44,
      h: 92
    };
    sp.phaseFromX = sp.vehicle.x;
    sp.phaseFromY = sp.vehicle.y;

    game.controlLocked = false;
    game.safeTimer = 120;

    // little cue (soft whoosh / dash)
    audio?.SFX?.dash?.();
  }

  function finishRocketFlight() {
    if (!game.setpiece) return;
    const sp = game.setpiece;

    sp.active = false;

    sp.finished = true;

    sp.active = false;
    sp.phase = "none";
    sp.phaseT = 0;
    sp.t = 0;

    sp.scroll = 1;
    sp.catInVehicle = false;

    sp.rocketCooldown = 0;
    sp.nextRocketAt = Math.max(game.score + 220 + Math.floor(random() * 160), (sp.nextRocketAt || 0) + 220);

    game.controlLocked = false;
    game.safeTimer = 200;

    // tiny celebratory chime
    audio?.SFX?.combo?.();
  }

  function previewSetpiece({ mode = "ocean", type, phase = "travel", progress = 0.5, originTheme, targetTheme } = {}) {
    const origin = originTheme || game.theme || (mode === "rocket" ? "island" : "forest");
    game.theme = origin;
    game.themeFade = { active: false, from: origin, to: origin, t: 0, dur: 1 };
    if (game.setpiece) game.setpiece.targetTheme = targetTheme || (mode === "rocket" ? "mars" : "island");
    if (mode === "rocket") triggerRocketFlight();
    else triggerOceanCrossing(type);

    const sp = game.setpiece;
    sp.type = mode === "rocket" ? "rocket" : (type || "balloon");
    sp.originTheme = origin;
    sp.targetTheme = targetTheme || (mode === "rocket" ? "mars" : "island");
    sp.motion = { phase: 0, dx: 0, dy: 0, vx: 0, vy: 0 };

    const timing = SETPIECE_TIMINGS[mode];
    const order = ["approach", "board", "travel", "arrive"];
    const requestedPhase = phase === "control" ? "complete" : phase;
    let frames = 0;
    if (requestedPhase === "complete") {
      frames = timing.APPROACH + timing.BOARD + timing.TRAVEL + timing.ARRIVE;
    } else {
      for (const key of order) {
        if (key === requestedPhase) {
          const duration = timing[key.toUpperCase()];
          frames += Math.min(duration - 1, Math.round(clamp(progress, 0, 1) * duration));
          break;
        }
        frames += timing[key.toUpperCase()];
      }
    }
    for (let i = 0; i < frames; i++) {
      game.tick++;
      if (game.themeFade?.active) {
        game.themeFade.t++;
        if (game.themeFade.t >= game.themeFade.dur) game.themeFade.active = false;
      }
      objects.updateBubbles?.();
      update();
    }
    sp.preview = true;
    return sp;
  }

return { update, triggerOceanCrossing, finishOceanCrossing, triggerRocketFlight, finishRocketFlight, previewSetpiece };
}
