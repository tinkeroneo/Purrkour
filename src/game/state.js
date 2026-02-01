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
        // story-driven theme order (ocean/island/mountain)
        themeCycle: { order: ["ocean","island","mountain","forest"], idx: 0, nextAt: 120, step: 140 },
        nextTheme: null,

        // theme crossfade helper (handled in loop)
        themeFade: {
            active: false,
            from: "forest",
            to: "forest",
            t: 0,
            dur: 60,
        },

        // setpieces: story beats (ocean/air)
        setpiece: {
            active: false,
            type: "balloon", // current
            t: 0,
            dur: 60 * 10,
            cooldown: 999999,
            used: {},
            schedule: [
                // score, vehicle, theme to fade into while crossing, theme after landing
                { score: 5, type: "balloon", toTheme: "ocean", afterTheme: "island", dur: 60 * 10 },
                { score: 10, type: "zeppelin", toTheme: "mountain", afterTheme: "mountain", dur: 60 * 9 },
            ],
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
