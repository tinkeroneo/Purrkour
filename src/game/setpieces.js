// src/game/setpieces.js
// Scripted setpieces (story beats) like the Ocean Crossing.
// Goal: flow over stress — visible prep, slow-down, boarding, then travel + landing.

import { clamp, smoothstep, lerp } from "../core/util.js";

export function createSetpieceManager({ game, objects, startThemeFade, canvas, terrain, audio }) {
  const APPROACH_DUR = 240; // ~4s
  const BOARD_DUR    = 90;  // ~1.5s
  const TRAVEL_DUR   = 420; // ~7s
  const ARRIVE_DUR   = 180; // ~3s

  // Rocket intermezzo (Mars hop)
  const R_APPROACH_DUR = 180; // ~3s
  const R_BOARD_DUR    = 80;  // ~1.3s
  const R_TRAVEL_DUR   = 420; // ~7s
  const R_ARRIVE_DUR   = 160; // ~2.7s

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

    // prevent immediate re-triggering (cooldown is checked in update())
    sp.cooldown = 0;
    sp.finished = false;

    sp.type = pickVehicle();
    sp.mode = "ocean";
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

    // avoid looping the same beat at the same score
    sp.cooldown = 0;
    sp.startScore = Math.max(sp.startScore + 200, game.score + 200);
    sp.finished = true;

    game.controlLocked = false;

    // short grace window (landing calm)
    game.safeTimer = 180;
  }


  function updateRocket(sp) {
    const vx = sp.vehicle?.x ?? (canvas.W * 0.76);
    const surf = terrain.surfaceAt(vx);

    if (sp.phase === "approach") {
      // rocket rolls in on a tiny pad, cat walks up, world slows
      sp.vehicle.x = canvas.W * 0.76;
      sp.vehicle.y = surf - 80;

      const u = clamp(sp.phaseT / R_APPROACH_DUR, 0, 1);
      sp.scroll = 1 - smoothstep(u); // 1 -> 0

      if (sp.phaseT >= R_APPROACH_DUR) {
        sp.phase = "board";
        sp.phaseT = 0;
      }
      return;
    }

    if (sp.phase === "board") {
      sp.scroll = 0;

      // small pre-launch shake + flame cue
      const shake = Math.sin(sp.phaseT * 0.4) * 2;
      sp.vehicle.y = (surf - 80) + shake;

      // lock cat into capsule near the end of boarding
      const u = clamp(sp.phaseT / R_BOARD_DUR, 0, 1);
      sp.catInVehicle = u > 0.45;

      if (sp.phaseT >= R_BOARD_DUR) {
        sp.phase = "travel";
        sp.phaseT = 0;
        sp.oceanMaskX = canvas.W; // ensure no ocean mask used
      }
      return;
    }

    if (sp.phase === "travel") {
      // fly through space: gentle forward drift + bob
      sp.scroll = 0.18;
      sp.vehicle.x = canvas.W * 0.58 + Math.sin(game.tick * 0.02) * 6;
      sp.vehicle.y = canvas.H * 0.32 + Math.sin(game.tick * 0.06) * 4;

      if (sp.phaseT >= R_TRAVEL_DUR) {
        sp.phase = "arrive";
        sp.phaseT = 0;

      // fade into Mars on approach
      startThemeFade("mars", 140);
      }
      return;
    }

    if (sp.phase === "arrive") {
      // descend back to land; world gradually resumes
      const u = clamp(sp.phaseT / R_ARRIVE_DUR, 0, 1);
      sp.scroll = smoothstep(u); // 0 -> 1
      sp.vehicle.x = canvas.W * 0.70;
      sp.vehicle.y = lerp(canvas.H * 0.32, surf - 80, smoothstep(u));

      // once we're mostly down, release cat
      if (u > 0.55) sp.catInVehicle = false;

      if (sp.phaseT >= R_ARRIVE_DUR) {
        finishRocketFlight();
      }
      return;
    }
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
      // If Progression owns the story beats, do not auto-trigger via score.
      if (game.progression?.controlsSpeed) return;

      }

      // Rocket has priority once scheduled (fun intermezzo)
      if (game.score >= (sp.nextRocketAt ?? 999999) && (sp.rocketCooldown ?? 0) > 240) {
        triggerRocketFlight();
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

    if (sp.mode === "rocket") {
      updateRocket(sp);
      return;
    }

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



  function triggerRocketFlight() {
    if (!game.setpiece) return;
    const sp = game.setpiece;

    sp.finished = false;
    sp.mode = "rocket";


    sp.rocketCooldown = 0;

    sp.mode = "rocket";
    sp.type = "rocket";
    sp.active = true;

    sp.phase = "approach";  // approach -> board -> travel -> arrive
    sp.phaseT = 0;
    sp.t = 0;

    sp.scroll = 1;
    sp.catInVehicle = false;

    // place rocket to the right, then move to cat
    sp.vehicle = {
      x: canvas.W + 160,
      y: terrain.surfaceAt(canvas.W * 0.75) - 80,
      w: 44,
      h: 92
    };

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
    sp.nextRocketAt = Math.max(game.score + 220 + Math.floor(Math.random() * 160), (sp.nextRocketAt || 0) + 220);

    game.controlLocked = false;
    game.safeTimer = 200;

    // tiny celebratory chime
    audio?.SFX?.combo?.();
  }

return { update, triggerOceanCrossing, finishOceanCrossing, triggerRocketFlight, finishRocketFlight };
}
