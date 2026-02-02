// src/game/setpieces.js
// Scripted setpieces (story beats) like the Ocean Crossing.
// Goal: flow over stress — visible prep, slow-down, boarding, then travel + landing.

import { clamp, smoothstep } from "../core/util.js";

export function createSetpieceManager({ game, objects, startThemeFade, canvas, terrain, audio }) {
  const APPROACH_DUR = 240; // ~4s
  const BOARD_DUR    = 90;  // ~1.5s
  const TRAVEL_DUR   = 420; // ~7s
  const ARRIVE_DUR   = 180; // ~3s

  function clearWorldForBeat() {
    objects.list.length = 0;
    objects.pawprints.length = 0;
    // keep bubbles/toast alive
  }

  function pickVehicle() {
    const r = Math.random();
    return (r < 0.18) ? "zeppelin" : (r < 0.32) ? "raft" : "balloon";
  }

  function triggerOceanCrossing() {
    if (!game.setpiece) return;

    const sp = game.setpiece;

    sp.type = pickVehicle();
    sp.active = true;

    // script state
    sp.phase = "approach";       // approach -> board -> travel -> arrive
    sp.phaseT = 0;
    sp.t = 0;

    sp.scroll = 1;               // 1..0..1 (used as multiplier for world dx)
    sp.catInVehicle = false;

    // vehicle anchoring (screen space)
    sp.vehicle = {
      x: canvas.W * 0.76,
      y: 0,
    };

    // ocean reveal: maskX is where ocean starts (pixels).
    // 0 = full ocean, W = no ocean.
    sp.oceanMaskX = canvas.W;    // start with no ocean

    // ambience helper
    sp._whooshed = false;

    // keep deterministic drift for the whole setpiece
    sp.motion = sp.motion || { phase: Math.random() * 1000, dx: 0, dy: 0, vx: 0, vy: 0 };

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

    game.controlLocked = false;

    // short grace window (landing calm)
    game.safeTimer = 180;
  }

  function update() {
    if (!game.setpiece) return;
    const sp = game.setpiece;

    // trigger once when score threshold reached
    if (!sp.active && game.score >= sp.startScore && sp.cooldown > 99999) {
      triggerOceanCrossing();
    }

    if (!sp.active) {
      if (sp.cooldown < 999999) sp.cooldown++;
      return;
    }

    // active scripted beat
    sp.t++;
    sp.phaseT++;

    // Keep vehicle y anchored to terrain (unless travel)
    const vx = sp.vehicle?.x ?? (canvas.W * 0.76);
    const surf = terrain.surfaceAt(vx);

    if (sp.phase === "approach") {
      // vehicle stands on land, cat walks in, world eases to a stop
      sp.vehicle.x = canvas.W * 0.76;
      sp.vehicle.y = surf - 110;

      const u = clamp(sp.phaseT / APPROACH_DUR, 0, 1);
      sp.scroll = 1 - smoothstep(u);              // 1 -> 0
      sp.oceanMaskX = canvas.W;                   // still land, no ocean

      if (sp.phaseT >= APPROACH_DUR) {
        sp.phase = "board";
        sp.phaseT = 0;
        sp.scroll = 0;
        // little UI bubble (optional)
        objects.addBubble?.("…einsteigen");
      }
    }

    else if (sp.phase === "board") {
      // frozen world, cat climbs in; ocean starts behind vehicle near end
      sp.vehicle.x = canvas.W * 0.76;
      sp.vehicle.y = surf - 110;

      const u = clamp(sp.phaseT / BOARD_DUR, 0, 1);
      // ocean creeps in from behind the vehicle (right side)
      const reveal = smoothstep(clamp((u - 0.35) / 0.65, 0, 1));
      sp.oceanMaskX = clamp(sp.vehicle.x - 40 - reveal * 220, 0, canvas.W);

      sp.scroll = 0;

      if (sp.phaseT >= BOARD_DUR) {
        sp.phase = "travel";
        sp.phaseT = 0;
        sp.catInVehicle = true;

        // switch to ocean theme now (beat starts)
        startThemeFade("ocean", 90);
      }
    }

    else if (sp.phase === "travel") {
      // full ocean, vehicle drifts; world scroll resumes smoothly
      const u = clamp(sp.phaseT / TRAVEL_DUR, 0, 1);

      sp.oceanMaskX = 0; // full ocean

      // ramp world movement back up to normal (gentle takeoff)
      sp.scroll = smoothstep(clamp(u / 0.18, 0, 1)); // 0 -> 1

      // whoosh once at takeoff
      if (!sp._whooshed && sp.phaseT > 20) {
        sp._whooshed = true;
        audio?.SFX?.whoosh?.();
      }

      // drift vehicle slightly (draw module uses sp.t too)
      sp.vehicle.x = canvas.W * (0.28 + 0.16 * Math.sin((sp.t + sp.motion.phase) * 0.006));
      sp.vehicle.y = canvas.H * 0.28 + Math.sin((sp.t + sp.motion.phase) * 0.02) * 6;

      if (sp.phaseT >= TRAVEL_DUR) {
        sp.phase = "arrive";
        sp.phaseT = 0;

        // fade to island on approach
        startThemeFade("island", 120);
      }
    }

    else if (sp.phase === "arrive") {
      // land creeps in (reverse), world slows to a stop, then cat steps out
      const u = clamp(sp.phaseT / ARRIVE_DUR, 0, 1);

      // vehicle comes back to landing spot
      const landX = canvas.W * 0.72;
      const landSurf = terrain.surfaceAt(landX);
      sp.vehicle.x = landX;
      sp.vehicle.y = (landSurf - 110) * smoothstep(clamp(u / 0.5, 0, 1)) + (canvas.H * 0.28) * (1 - smoothstep(clamp(u / 0.5, 0, 1)));

      // ocean retreats to the right, revealing land behind the vehicle
      const retreat = smoothstep(u);
      sp.oceanMaskX = clamp((sp.vehicle.x - 40) + retreat * (canvas.W + 60), 0, canvas.W);

      // slow down to 0 near the end
      sp.scroll = 1 - smoothstep(clamp((u - 0.55) / 0.45, 0, 1)); // 1 -> 0

      if (sp.phaseT >= ARRIVE_DUR) {
        // done: cat leaves vehicle, resume gameplay
        sp.catInVehicle = false;
        finishOceanCrossing();
      }
    }

    // safety: hard cap
    const hardCap = APPROACH_DUR + BOARD_DUR + TRAVEL_DUR + ARRIVE_DUR + 60;
    if (sp.t > hardCap) {
      sp.catInVehicle = false;
      finishOceanCrossing();
    }
  }

  return { update, triggerOceanCrossing, finishOceanCrossing };
}
