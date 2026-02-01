import { getTheme } from "../world/themes.js";


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
            // ambience mix: subtle by default
            if (audio?.enabled) {
                const isOcean = !!game.setpiece?.active;
                const night = bg?.nightFactor ? bg.nightFactor() : 0; // falls du’s schon exposed hast

                theme.ambience?.({
                    audio,
                    night: bg?.nightFactor?.() ?? 0,
                });

            }

            // --- setpiece trigger ---
            if (game.setpiece && !game.setpiece.active && game.score >= game.setpiece.startScore && game.setpiece.cooldown > 99999) {
                game.setpiece.active = true;
                game.setpiece.t = 0;
                game.setpiece.cooldown = 0;

                // switch to ocean theme for the crossing
                startThemeFade("ocean", 80);

                // clear world objects so nothing collides while we fly
                objects.list.length = 0;
                objects.pawprints.length = 0;
                // keep bubbles/toast
                // hud.toast?.("Auf zum Ozean… 🎈", 120);
            }
            if (game.setpiece.active) {
                game.setpiece.t++;
                if (game.setpiece.t >= game.setpiece.dur) {
                    game.setpiece.active = false;
                    // danach z.B. erst ab Score+120 wieder erlauben
                    game.setpiece.cooldown = 0; // (oder einfach so lassen)

                    // arrive at island
                    startThemeFade("island", 110);
                }
            } else {
                // cooldown zählt hoch, damit wir nicht sofort wieder triggern
                if (game.setpiece.cooldown < 999999) game.setpiece.cooldown++;
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
