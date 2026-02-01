import { getTheme } from "../world/themes.js";
import { createSetpieceManager } from "./setpieces.js";


// src/game/loop.js
export function createLoop({ game, cat, terrain, lakes, bg, objects, spawner, collider, drawer, hud, audio }) {
    function startThemeFade(toKey, dur = 70) {
        const fromKey = game.theme;
        if (fromKey === toKey) return;

        if (game.themeFade) {
            game.themeFade.active = true;
            game.themeFade.from = fromKey;
            game.themeFade.to = toKey;
            game.themeFade.t = 0;
            game.themeFade.dur = Math.max(1, dur | 0);
        }
        game.theme = toKey;
    }

    // needs startThemeFade
    const setpieces = createSetpieceManager({ game, objects, startThemeFade, audio });

    function step() {
        if (!game.finished) {
            // dx: letzter effSpeed (wird in collider.update() neu berechnet)
            const dx = collider.effSpeed();
            // advance theme crossfade
            if (game.themeFade?.active) {
                game.themeFade.t++;
                if (game.themeFade.t >= game.themeFade.dur) {
                    game.themeFade.active = false;
                }
            }

            const theme = getTheme(game.theme);

            // 1) world scroll
            terrain.update(dx);
            // lakes: nimmt palette indirekt über bg, aber wenn dein lakes.update palette braucht: gib sie mit
            // (je nach deiner createLakes-API)
            if (typeof lakes.update === "function") lakes.update(dx, bg.palette?.());

            // 2) physics + collisions + scoring + timers (setzt game._effSpeed neu)
            collider.update(bg.palette?.());
            // ambience mix: theme-driven + smoother during transitions
            if (audio?.enabled) {
                const isFlight = !!game.setpiece?.active;
                const n = bg?.nightFactor?.() ?? 0;
                const tau = (game.themeFade?.active ? 0.22 : 0.12);

                // base ambience from theme
                theme.ambience?.({ audio, night: n, tau });

                // extra layers during flight / ocean-crossing
                if (isFlight) {
                    const type = game.setpiece?.type || "balloon";
                    const mix = (type === "zeppelin")
                        ? { whoosh: 0.12, ocean: 0.22, rumble: 0.08, engine: 0.05 }
                        : (type === "raft")
                            ? { whoosh: 0.04, ocean: 0.30, rumble: 0.02, engine: 0.0001 }
                            : { whoosh: 0.18, ocean: 0.24, rumble: 0.03, engine: 0.0001 };

                    audio.setAmbience?.({
                        ...mix,
                        night: n * 0.18,
                        tau: 0.18,
                    });
                }
            }
            // --- setpieces (ocean crossing etc.) ---
            setpieces.update();

            // theme cycle after landing (island -> mountain -> forest ...)
            if (!game.setpiece.active && game.themeCycle && !game.themeFade?.active) {
                if (game.score >= (game.themeCycle.nextAt ?? 999999)) {
                    const nextKey = game.themeCycle.order[game.themeCycle.idx % game.themeCycle.order.length];
                    game.themeFade = { active: true, from: game.theme, to: nextKey, t: 0, dur: 80 };
                    game.theme = nextKey;
                    game.themeCycle.idx = (game.themeCycle.idx + 1) % game.themeCycle.order.length;
                    game.themeCycle.nextAt = game.score + game.themeCycle.step;
                }
            }

            // 3) spawns (nutzt game._effSpeed)
            if (!game.setpiece.active) spawner.update(bg.palette?.());


            // 4) HUD
            hud.sync(game, cat.cat ?? cat); // je nachdem ob createCat {cat,...} zurückgibt
        }

        // 5) render
        drawer.draw(objects);

        requestAnimationFrame(step);
    }

    return { start: () => requestAnimationFrame(step) };
}