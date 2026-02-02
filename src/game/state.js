export function createGameState() {
    return {
        tick: 0,
        score: 0,
        mice: 0,
        speed: 2.15,

        finished: false,
        lives: 7,
        maxLives: 7,

        heartWave: { active: false, startTick: 0, dur: 90 },
        invulnTimer: 0,
        theme: "forest",
        themeCycle: { order: ["island", "mountain", "forest", "jungle", "cliff", "city", "desert", "ocean", "mars"], idx: 0, nextAt: 999999, step: 140 },
        nextTheme: null,

        vertical: { band: "ground" },

        // theme crossfade helper (handled in loop)
        themeFade: {
            active: false,
            from: "forest",
            to: "forest",
            t: 0,
            dur: 60,
        },

        // setpiece: ocean crossing
        setpiece: {
            active: false,
            mode: "ocean",        // "ocean" | "rocket"
            type: "balloon",      // vehicle type (see game/vehicles)
            phase: "approach",    // "approach" | "board" | "travel" | "arrive"
            phaseT: 0,

            // generic timers
            t: 0,
            dur: 60 * 10,

            // ocean beat scheduling
            startScore: 50,
            cooldown: 999999,

            // rocket beat scheduling (fun intermezzo)
            nextRocketAt: 260,
            rocketCooldown: 999999,

            // runtime fields used by setpieces.js
            vehicle: null,
            catInVehicle: false,
            scroll: 1,
            oceanMaskX: 0,
            oceanFromX: 0,
        },


        // input lock for scripted beats
        controlLocked: false,
        // short safety window after landings / pauses
        safeTimer: 0,
        // Rest at a hut (HUD button). When active, gameplay pauses.
        pause: {
            active: false,
            phase: "none", // walk -> sleep -> resume
            t: 0,
        },

        slowTimer: 0,
        slowStrength: 0.65,

        catnipTimer: 0,
        tripleJumpTimer: 0,

        checkpointActive: false,
        checkpointGlow: 0,

        chaseActive: false,
        chaseTimer: 0,
        barkTimer: 0,

        calmTimer: 0,
        comboGlow: 0,

        lastHitTick: -99999
    };
}