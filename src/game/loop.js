// src/game/loop.js
export function createLoop({ game, cat, terrain, lakes, bg, objects, spawner, collider, drawer, hud }) {
    function step() {
        if (!game.finished) {
            // dx: letzter effSpeed (wird in collider.update() neu berechnet)
            const dx = collider.effSpeed();

            // 1) world scroll
            terrain.update(dx);
            // lakes: nimmt palette indirekt über bg, aber wenn dein lakes.update palette braucht: gib sie mit
            // (je nach deiner createLakes-API)
            if (typeof lakes.update === "function") lakes.update(dx, bg.palette?.());

            // 2) physics + collisions + scoring + timers (setzt game._effSpeed neu)
            collider.update(bg.palette?.());
            // --- setpiece trigger ---
            if (!game.setpiece.active && game.score >= game.setpiece.startScore && game.setpiece.cooldown > 99999) {
                game.setpiece.active = true;
                game.setpiece.t = 0;
                game.setpiece.cooldown = 0;
                objects.list.length = 0;
                objects.pawprints.length = 0;
                // optional: kleine Meldung
                // hud.toast?.("Auf zum Ozean… 🎈", 120);
            }
            if (game.setpiece.active) {
                game.setpiece.t++;
                if (game.setpiece.t >= game.setpiece.dur) {
                    game.setpiece.active = false;
                    // danach z.B. erst ab Score+120 wieder erlauben
                    game.setpiece.cooldown = 0; // (oder einfach so lassen)
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
