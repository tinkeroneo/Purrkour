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

        // setpiece: ocean crossing
        setpiece: {
            active: false,
            type: "balloon",     // "balloon" | "zeppelin" (später switchbar)
            t: 0,                // frames elapsed in setpiece
            dur: 60 * 10,        // 10s crossing
            startScore: 120,     // wann starten (Score-Schwelle)
            cooldown: 999999,    // wird nach Start gesetzt (damit es nicht dauernd kommt)
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
