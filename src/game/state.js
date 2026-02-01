export function createGameState() {
    return {
        tick: 0,
        score: 0,
        mice: 0,
        speed: 2.15,

        finished: false,
        homePhase: 0,
        homeX: 0,
        finishFade: 0,

        lives: 7,
        invulnTimer: 0,
        theme: "forest",
  themeCycle: { order: ["island","mountain","forest"], idx: 0, nextAt: 999999, step: 140 },
        nextTheme: null,

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
            type: "balloon",     // "balloon" | "zeppelin" (later)
            t: 0,                // frames elapsed
            dur: 60 * 10,        // ~10s crossing
            startScore: 120,     // trigger once when score reaches this
            cooldown: 999999,    // counts up while inactive; prevents spam
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

        // grace window after big transitions (no stress spawns)
        safeTimer: 0,

        lastHitTick: -99999
    };
}
