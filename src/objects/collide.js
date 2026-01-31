import { aabb, clamp } from "../core/util.js";

const HOME_SCORE = 280;

export function createCollider(game, catApi, terrain, objects, audio, hud) {
    const { cat } = catApi;

    function applyGroundY(o) {
        if (o.yMode !== "ground") return;
        o.y = terrain.surfaceAt(o.x) + (o.yOffset ?? 0);
    }

    function loseLife() {
        if (game.invulnTimer > 0) return;

        game.lives = Math.max(0, game.lives - 1);
        game.invulnTimer = 90;
        game.lastHitTick = game.tick;

        audio.SFX.hit();
        objects.addBubble("ouch", cat.x + cat.w * 0.55, cat.y - 8);

        if (game.checkpointActive) {
            game.checkpointActive = false;
            game.checkpointGlow = 90;
            objects.toast("Checkpoint hat dich gerettet 🧺", 140);
        } else {
            game.score = Math.max(0, game.score - 2);
            game.mice = Math.max(0, game.mice - 1);
        }

        // stop chase
        game.chaseActive = false;
        game.chaseTimer = 0;
        game.barkTimer = 0;
        for (let i = objects.list.length - 1; i >= 0; i--) {
            const o = objects.list[i];
            if (o.kind === "obstacle" && o.type === "dog" && o.chasing) objects.list.splice(i, 1);
        }

        if (game.lives <= 0) {
            objects.toast("Alle Leben weg… Neustart 🐾", 160);
            setTimeout(resetAll, 450);
        }
    }

    function startChase(dog) {
        if (game.chaseActive) return;
        game.chaseActive = true;
        game.chaseTimer = 360;
        game.barkTimer = 0;

        dog.chasing = true;
        dog.asleep = false;
        dog.x = Math.min(dog.x, cat.x - 180);

        objects.toast("Hund jagt dich! 🐶", 120);
        audio.SFX.bark();
    }

    function updateChase(effSpeed) {
        if (!game.chaseActive) return;

        game.chaseTimer--;
        game.barkTimer++;
        if (game.barkTimer > 55) {
            game.barkTimer = 0;
            audio.SFX.bark();
        }

        let dog = null;
        for (const o of objects.list) {
            if (o.kind === "obstacle" && o.type === "dog" && o.chasing) { dog = o; break; }
        }
        if (!dog) { game.chaseActive = false; return; }

        const base = effSpeed * (dog.chaseSpeedBoost || 1.55);
        const dist = (cat.x - dog.x);
        const rubber = clamp(dist / 220, 0, 1);
        const chase = base * (0.85 + 0.65 * rubber);

        dog.x += chase;
        dog.x = clamp(dog.x, -100, cat.x + 90);
        applyGroundY(dog);

        const dogBox = { x: dog.x + 6, y: dog.y + 6, w: dog.w - 12, h: dog.h - 10 };
        const catBox = { x: cat.x + 12, y: cat.y + 12, w: cat.w - 24, h: cat.h - 18 };
        if (aabb(dogBox, catBox)) {
            objects.addBubble("nope!", cat.x + cat.w * 0.55, cat.y - 8);
            loseLife();
            const idx = objects.list.indexOf(dog);
            if (idx >= 0) objects.list.splice(idx, 1);
            return;
        }

        if (game.chaseTimer <= 0) {
            game.chaseActive = false;
            dog.chasing = false;
            objects.toast("Puh… entkommen 😮‍💨", 120);
        }
    }

    function resetCatPosition() {
        const surf = terrain.surfaceAt(cat.x);
        catApi.resetAt(surf);
    }

    function resetAll() {
        objects.list.length = 0;
        objects.pawprints.length = 0;
        objects.bubbles.length = 0;

        game.tick = 0;
        game.score = 0;
        game.mice = 0;
        game.speed = 2.15;

        game.lives = 7;
        game.invulnTimer = 0;

        game.slowTimer = 0;
        game.catnipTimer = 0;
        game.tripleJumpTimer = 0;

        game.chaseActive = false;
        game.chaseTimer = 0;
        game.barkTimer = 0;

        game.homePhase = 0;
        game.homeX = 0;
        game.finishFade = 0;
        game.finished = false;

        game.checkpointActive = false;
        game.checkpointGlow = 0;

        resetCatPosition();
        objects.toast("Purrkour 🐾", 160);
    }

    function effSpeed() { return game._effSpeed || 2.15; }

    function update(palette) {
        if (game.finished) return;

        game.tick++;

        // timers
        if (game.invulnTimer > 0) game.invulnTimer--;
        if (game.catnipTimer > 0) game.catnipTimer--;
        if (game.tripleJumpTimer > 0) game.tripleJumpTimer--;
        if (game.checkpointGlow > 0) game.checkpointGlow--;
        if (game.slowTimer > 0) game.slowTimer--;

        // jump capacity
        cat.maxJumps = (game.tripleJumpTimer > 0) ? 3 : cat.baseMaxJumps;

        // acceleration
        if (game.tick % 60 === 0) game.speed += 0.035;
        if (game.score > 0 && game.score % 20 === 0 && game.tick % 30 === 0) game.speed += 0.01;

        const catnipMult = (game.catnipTimer > 0) ? 0.82 : 1.0;
        const slowMult = (game.slowTimer > 0) ? game.slowStrength : 1.0;
        const eff = game.speed * catnipMult * slowMult;
        // --- setpiece: disable ground physics, keep cat on balloon ---
        if (game.setpiece?.active) {
            // Positioniere Katze stabil im linken Bereich (leicht nach links gedrängt)
            cat.cat.x = Math.min(cat.cat.x, 120);
            cat.cat.vy = 0;
            cat.cat.onSurface = true;

            // Score läuft weiter (optional, wenn du willst)
            // game.score += 0; // nix extra, nur durch normale Passes

            // während setpiece keine Kollisionen/Collectibles (optional)
            // return early, aber lass timers laufen:
            // -> Wenn du early-return willst, dann vorher Timer/Speed-Updates gemacht haben.
        }

        game._effSpeed = eff;

        // home movement / finish
        if (game.homePhase === 1) {
            game.homeX -= eff;
            if (game.homeX < cat.x - 40) game.homePhase = 2;
        }
        if (game.homePhase === 2) {
            game.finishFade = clamp(game.finishFade + 0.010, 0, 1);
            if (game.finishFade >= 1) game.finished = true;
        }

        // cat physics
        const prevY = cat.y;
        catApi.gravityStep();
        cat.onSurface = false;

        const groundSurface = terrain.surfaceAt(cat.x);
        if (cat.y + cat.h > groundSurface) {
            cat.y = groundSurface - cat.h;
            cat.vy = 0;
            cat.onSurface = true;
        }

        // move objects + align ground objects
        for (const o of objects.list) {
            o.x -= eff;
            applyGroundY(o);
        }

        // platform land (top)
        for (const o of objects.list) {
            if (o.kind !== "platform") continue;

            const catPrevBottom = prevY + cat.h;
            const catBottom = cat.y + cat.h;
            const onTopBand = catPrevBottom <= o.y + 10 && catBottom >= o.y + 2;
            const xOverlap = (cat.x + cat.w * 0.70) > o.x && (cat.x + cat.w * 0.30) < (o.x + o.w);

            if (cat.vy >= 0 && onTopBand && xOverlap) {
                cat.y = o.y - cat.h + 2;
                cat.vy = 0;
                cat.onSurface = true;
            }
        }

        // platform side collision (solid fence)
        for (const o of objects.list) {
            if (o.kind === "setpiece") continue;
            if (o.kind !== "platform") continue;

            const inset = 10;
            const fence = { x: o.x + inset, y: o.y + 6, w: o.w - inset * 2, h: o.h - 6 };
            const c = { x: cat.x + 10, y: cat.y + 10, w: cat.w - 20, h: cat.h - 14 };
            if (!aabb(c, fence)) continue;

            const overlapL = (c.x + c.w) - fence.x;
            const overlapR = (fence.x + fence.w) - c.x;
            const overlapT = (c.y + c.h) - fence.y;
            const overlapB = (fence.y + fence.h) - c.y;

            const minX = Math.min(overlapL, overlapR);
            const minY = Math.min(overlapT, overlapB);

            if (minX < minY) {
                // IMPORTANT: prefer pushing LEFT (prevents “out of screen to the right”)
                if (overlapL < overlapR) cat.x -= (overlapL + 0.5);
                else cat.x -= (overlapR + 0.5) * 0.35; // softer right-side correction
            } else {
                if (overlapT < overlapB) { cat.y -= (overlapT + 0.5); cat.vy = Math.min(cat.vy, 0); cat.onSurface = true; }
                else { cat.y += (overlapB + 0.5); cat.vy = Math.max(cat.vy, 0); }
            }
        }

        // clamp + gentle return (fix “cat pushed out of frame”)
        catApi.clampX(hud?.W ?? 99999); // may be undefined; harmless
        // better: use viewport width (fallback via window)
        catApi.clampX(window.innerWidth || 360);

        // reset jumps on ground
        if (cat.onSurface && cat.jumpsLeft !== cat.maxJumps) {
            cat.jumpsLeft = cat.maxJumps;
        }

        // chase movement
        updateChase(eff);

        // pawprints
        objects.maybeAddPawprint(game, cat, terrain, eff);
        objects.updatePawprints(eff);

        // collisions
        const catBox = { x: cat.x + 12, y: cat.y + 12, w: cat.w - 24, h: cat.h - 18 };

        // obstacles (if not invulnerable)
        if (game.invulnTimer === 0) {
            for (let i = 0; i < objects.list.length; i++) {
                const o = objects.list[i];
                if (o.kind !== "obstacle") continue;

                const obsBox = { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 };
                if (!aabb(catBox, obsBox)) continue;

                if (o.type === "yarn") {
                    game.slowTimer = 180;
                    objects.addBubble("slow…", cat.x + cat.w * 0.55, cat.y - 8);
                    audio.SFX.slow();
                    objects.list.splice(i, 1); i--;
                } else if (o.type === "dog") {
                    startChase(o);
                } else {
                    loseLife();
                    objects.list.splice(i, 1); i--;
                }
            }
        }

        // collectibles
        for (const o of objects.list) {
            if (o.kind !== "collectible" || o.taken) continue;
            if (!aabb(catBox, o)) continue;

            o.taken = true;

            if (o.type === "mouse") {
                game.mice++;
                game.score += 1;
                game.speed += 0.010; // ✅ mice = slight acceleration (soft)
                if (Math.random() < 0.40) objects.addBubble("miau!", cat.x + cat.w * 0.55, cat.y - 8);
                audio.SFX.mouse();
            } else if (o.type === "catnip") {
                game.catnipTimer = 320;
                objects.addBubble("🌿", cat.x + cat.w * 0.55, cat.y - 8);
                audio.SFX.catnip();
            } else if (o.type === "fish") {
                game.tripleJumpTimer = 320;
                objects.toast("Snack! 3 Sprünge 🐟", 110);
                audio.SFX.fish();
            }
        }

        // checkpoint blanket
        for (const o of objects.list) {
            if (o.kind === "checkpoint" && !o.used && aabb(catBox, o)) {
                o.used = true;
                game.checkpointActive = true;
                game.checkpointGlow = 120;
                objects.toast("Checkpoint-Decke 🧺", 140);
                objects.addBubble("purr", cat.x + cat.w * 0.55, cat.y - 8);
                audio.SFX.magic();
            }
        }

        // scoring when passing
        for (const o of objects.list) {
            if (o._scored) continue;
            if (o.x + o.w < cat.x - 10) {
                if (o.kind === "obstacle" || o.kind === "platform") {
                    o._scored = true;
                    game.score++;
                }
            }
        }

        // cleanup offscreen
        for (let i = objects.list.length - 1; i >= 0; i--) {
            if (objects.list[i].x + objects.list[i].w < -260) objects.list.splice(i, 1);
        }

        // animation frame selection
        cat.animT++;
        const inAir = !cat.onSurface;
        if (inAir) catApi.setAnimFrame(4);
        else {
            const runRate = clamp(10 - (eff * 1.6), 4, 10);
            catApi.setAnimFrame(Math.floor(cat.animT / runRate) % 4);
        }

        objects.updateBubbles();
    }

    return {
        update,
        resetAll,
        resetCatPosition,
        effSpeed
    };
}
