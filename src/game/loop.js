import { getTheme } from "../world/themes.js";
import { createSetpieceManager } from "./setpieces.js";
import { createProgression } from "./progression.js";


// src/game/loop.js
export function createLoop({ game, cat, terrain, lakes, bg, objects, spawner, collider, drawer, hud, audio, canvas }) {
    const setpieces = createSetpieceManager({ game, objects, startThemeFade, canvas, terrain, audio });

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

    
    const progression = createProgression({ game, objects, startThemeFade, audio });
    // Expose for dev shortcuts
    game.progressionApi = progression;
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

            // central dramaturgy (beats -> speed/theme/night/setpieces)
            progression.update();

            const theme = getTheme(game.theme);

            // -----------------------------------------------------
            // Rest / Pause at hut (HUD button)
            // -----------------------------------------------------
            if (game.pause?.active) {
                const c = (cat.cat ?? cat);
                game.pause.t = (game.pause.t || 0) + 1;

                // Target hut stays on-screen (within cat clamp window)
                // (cat.clampX keeps max ~45% of screen width)
                const baseX = (c.baseX ?? 110);
                const hutX = Math.min(baseX + 140, 260);
                game.pause.hutX = hutX;
                game.pause.hutY = terrain.surfaceAt(hutX) - 52;

                // simple phase machine
                if (game.pause.phase === "walk") {
                    // walk towards hut
                    const dir = Math.sign(hutX - c.x);
                    c.x += dir * 2.2;
                    // keep cat grounded
                    c.vy = 0;
                    c.y = terrain.surfaceAt(c.x) - c.h;
                    c.onSurface = true;
                    // arrived?
                    if (Math.abs(hutX - c.x) < 10) {
                        game.pause.phase = "sleep";
                        game.pause.t = 0;
                        hud.toast?.("Schnurr… 😺💤", 140);
                        audio?.SFX?.combo?.();
                    }
                } else if (game.pause.phase === "sleep") {
                    // keep still, purr bubbles via objects helper
                    if (game.pause.t % 90 === 0) objects.addBubble?.("purr", c.x + 10, c.y - 6);
                    if (game.pause.t > 60 * 6) {
                        // stay sleeping until user toggles; nothing to do
                    }
                } else if (game.pause.phase === "resume") {
                    // tiny settle period, then fully unpause
                    if (game.pause.t > 18) {
                        game.pause.active = false;
                        game.pause.phase = "none";
                        game.pause.t = 0;
                    }
                }

                // still tick a bit for overlays
                objects.updateBubbles?.();
                hud.sync(game, c);
                drawer.draw(objects);
                requestAnimationFrame(step);
                return;
            }

            // 1) world scroll
            terrain.update(dx);
            // lakes: nimmt palette indirekt über bg, aber wenn dein lakes.update palette braucht: gib sie mit
            // (je nach deiner createLakes-API)
            if (typeof lakes.update === "function") lakes.update(dx, bg.palette?.());

            // 2) physics + collisions + scoring + timers (setzt game._effSpeed neu)
            collider.update(bg.palette?.());

// vertical band (ground/mid/high) based on height above terrain
if (!game.vertical) game.vertical = { band: "ground" };
if (game.setpiece?.active) {
    game.vertical.band = "air";
} else {
    const c = (cat.cat ?? cat);
    const surfY = terrain.surfaceAt(c.x);
    const above = surfY - (c.y + c.h);
    if (above < 70) game.vertical.band = "ground";
    else if (above < 170) game.vertical.band = "mid";
    else game.vertical.band = "air";
}

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

            // theme cycle after landing (disabled when progression owns themes)
            if (!game.progression?.controlsSpeed && !game.setpiece.active && game.themeCycle && !game.themeFade?.active) {
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