import { clamp, lerp, roundRect, tri } from "../core/util.js";
import { drawDog } from "../entities/dog.js";
import { drawBird } from "../entities/bird.js";
import { drawVehicle } from "../game/vehicles/index.js";

export function createDrawer(ctx, canvas, game, catApi, terrain, lakes, bg) {
    const { cat } = catApi;

    function drawSetpieceVehicle() {
        const sp = game.setpiece;
        if (!sp || !sp.active) return;
        drawVehicle(ctx, { canvas, terrain, game, setpiece: sp, palette: bg.palette?.() });
    }



    function drawPawprints(objects) {
        for (const p of objects.pawprints) {
            ctx.globalAlpha = clamp(p.life / 220, 0, 1) * 0.22;
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 6, 3.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // small ambience particles (whoosh puffs etc.)
    function drawPuffs(objects) {
        for (const p of (objects.puffs || [])) {
            const a = clamp(p.life / 24, 0, 1) * 0.35;
            ctx.globalAlpha = a;
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function drawSpeechBubbles(objects) {
        for (const b of objects.bubbles) {
            const a = clamp(b.life / 70, 0, 1);
            ctx.globalAlpha = a;
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.strokeStyle = "rgba(0,0,0,0.10)";
            ctx.lineWidth = 2;
            const ww = 44 + b.text.length * 4, hh = 22;
            roundRect(ctx, b.x - ww / 2, b.y - hh, ww, hh, 10); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "rgba(20,20,20,0.9)";
            ctx.font = "12px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(b.text, b.x, b.y - 7);
            ctx.globalAlpha = 1;
        }
    }

    function drawToast(objects) {
        const t = objects.toastState();
        if (t.toastTimer > 0) {
            const a = clamp(t.toastTimer / 60, 0, 1);
            ctx.globalAlpha = 0.85 * a;
            ctx.fillStyle = "rgba(0,0,0,0.22)";
            roundRect(ctx, canvas.W * 0.10, 18, canvas.W * 0.80, 26, 10); ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "13px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(t.toastText, canvas.W / 2, 37);
            ctx.globalAlpha = 1;
        }
    }

    // ----- object draw helpers -----

    function drawYarn(o) {
        // red yarn ball with visible strands
        const r = Math.min(o.w, o.h) / 2;
        ctx.save();
        ctx.translate(o.x + o.w / 2, o.y + o.h / 2);

        // base
        const g = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.2, 0, 0, r);
        g.addColorStop(0, "rgba(255,120,120,1)");
        g.addColorStop(1, "rgba(190,35,55,1)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // strands (curved lines)
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = "rgba(120,0,20,0.55)";
        ctx.lineWidth = Math.max(1.2, r * 0.10);
        for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 1.9 + 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, r * (0.55 + (i % 3) * 0.10), a, a + 1.6);
            ctx.stroke();
        }

        // highlight ring
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.beginPath();
        ctx.arc(-r * 0.08, -r * 0.10, r * 0.68, 0.2, 2.6);
        ctx.stroke();

        // loose thread tail
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = "rgba(255,220,220,0.8)";
        ctx.lineWidth = Math.max(1, r * 0.06);
        ctx.beginPath();
        ctx.moveTo(r * 0.55, r * 0.35);
        ctx.quadraticCurveTo(r * 0.95, r * 0.55, r * 1.25, r * 0.25);
        ctx.stroke();

        ctx.restore();
    }

    function drawFence(o) {
        const topY = o.y;
        const groundYAtLeft = terrain.surfaceAt(o.x + 6);
        const groundYAtRight = terrain.surfaceAt(o.x + o.w - 6);


const themeKey = game.theme || (game.progression?.current?.theme) || "forest";
if (themeKey === "mars") {
    // Mars: rocks / landing-zone obstacles
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(o.x + o.w * 0.52, Math.max(groundYAtLeft, groundYAtRight) - 2, o.w * 0.34, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#7b5a4a";
    roundRect(ctx, o.x, topY + 6, o.w, o.h - 2, 12); ctx.fill();
    ctx.fillStyle = "rgba(94,68,56,0.8)";
    for (let s = 0; s < 4; s++) ctx.fillRect(o.x + 6 + s * 18, topY + 16 + (s % 2) * 6, 10, 4);
    ctx.restore();
    return;
}
if (themeKey === "island" || themeKey === "ocean") {
    // Beach: huts / palms (use fence slot)
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(o.x + o.w * 0.52, Math.max(groundYAtLeft, groundYAtRight) - 2, o.w * 0.34, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // hut base
    ctx.fillStyle = "#c7a46a";
    roundRect(ctx, o.x, topY + 10, o.w, o.h - 10, 10); ctx.fill();
    // roof
    ctx.fillStyle = "#8a5a2b";
    ctx.beginPath();
    ctx.moveTo(o.x - 6, topY + 16);
    ctx.lineTo(o.x + o.w * 0.5, topY - 2);
    ctx.lineTo(o.x + o.w + 6, topY + 16);
    ctx.closePath(); ctx.fill();
    // palm leaf accent
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#2fa86f";
    ctx.beginPath();
    ctx.arc(o.x + o.w - 10, topY + 10, 10, -0.6, 2.5);
    ctx.fill();
    ctx.restore();
    return;
}
if (themeKey === "mountain" || themeKey === "cliff") {
    // Mountains/Cliffs: boulders
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(o.x + o.w * 0.52, Math.max(groundYAtLeft, groundYAtRight) - 2, o.w * 0.34, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#6b6b6b";
    roundRect(ctx, o.x, topY + 8, o.w, o.h - 6, 14); ctx.fill();
    ctx.fillStyle = "rgba(85,85,85,0.9)";
    ctx.fillRect(o.x + 10, topY + 16, o.w - 20, 6);
    ctx.restore();
    return;
}

        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(o.x + o.w * 0.52, Math.max(groundYAtLeft, groundYAtRight) - 2, o.w * 0.34, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.save(); ctx.translate(o.x, topY);
        ctx.fillStyle = "rgba(176,106,44,1)";
        roundRect(ctx, 0, 10, o.w, o.h - 10, 10); ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.12)";
        roundRect(ctx, 0, o.h * 0.46, o.w, 8, 6); ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.22)";
        for (let i = 6; i < o.w; i += 14) { roundRect(ctx, i, 0, 7, o.h, 4); ctx.fill(); }

        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 3;
        roundRect(ctx, 1, 1, o.w - 2, o.h - 2, 10); ctx.stroke();
        ctx.restore();

        if (o.yMode === "ground") {
            const postW = 10;
            const postTop = topY + o.h - 8;
            const lx = o.x + 10, lGround = terrain.surfaceAt(lx);
            ctx.fillStyle = "rgba(120,70,35,0.95)";
            roundRect(ctx, lx, postTop, postW, (lGround - postTop) + 6, 4); ctx.fill();

            const rx = o.x + o.w - 20, rGround = terrain.surfaceAt(rx);
            roundRect(ctx, rx, postTop, postW, (rGround - postTop) + 6, 4); ctx.fill();
        }

        ctx.restore();
    }

    function drawCar(o) {
        // car platform (safe to land on)
        const x = o.x, y = o.y, w = o.w, h = o.h;
        const t = (game.tick + (o.drivePhase ?? 0));
        const bob = Math.sin(t * 0.08) * 0.8;
        const type = o.carType || "car";
        ctx.save();
        ctx.translate(0, bob);

        // shadow
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(x + w * 0.52, (y + h) + 6, w * 0.38, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (type === "bus") {
            // bus body
            ctx.fillStyle = "rgba(235,185,60,0.95)";
            roundRect(ctx, x, y + h * 0.20, w, h * 0.65, 14); ctx.fill();

            // upper band
            ctx.fillStyle = "rgba(190,120,20,0.95)";
            roundRect(ctx, x + w * 0.06, y + h * 0.12, w * 0.86, h * 0.20, 10); ctx.fill();

            // windows
            ctx.fillStyle = "rgba(210,240,255,0.55)";
            const wy = y + h * 0.26;
            const ww = w * 0.12;
            for (let i = 0; i < 5; i++) {
                roundRect(ctx, x + w * (0.12 + i * 0.14), wy, ww, h * 0.20, 6); ctx.fill();
            }

            // door
            ctx.fillStyle = "rgba(40,55,70,0.7)";
            roundRect(ctx, x + w * 0.72, y + h * 0.28, w * 0.12, h * 0.34, 6); ctx.fill();
        } else if (type === "suv") {
            // SUV body
            ctx.fillStyle = "rgba(90,180,120,0.95)";
            roundRect(ctx, x, y + h * 0.28, w, h * 0.58, 12); ctx.fill();

            // cabin
            ctx.fillStyle = "rgba(55,120,85,0.95)";
            roundRect(ctx, x + w * 0.16, y + h * 0.10, w * 0.58, h * 0.42, 12); ctx.fill();

            // windows
            ctx.fillStyle = "rgba(220,245,255,0.55)";
            roundRect(ctx, x + w * 0.22, y + h * 0.16, w * 0.20, h * 0.18, 8); ctx.fill();
            roundRect(ctx, x + w * 0.46, y + h * 0.16, w * 0.20, h * 0.18, 8); ctx.fill();

            // spare box
            ctx.fillStyle = "rgba(40,70,55,0.9)";
            roundRect(ctx, x + w * 0.04, y + h * 0.34, w * 0.10, h * 0.20, 6); ctx.fill();
        } else {
            // car
            ctx.fillStyle = "rgba(70,150,230,0.95)";
            roundRect(ctx, x, y + h * 0.30, w, h * 0.55, 12); ctx.fill();

            // cabin
            ctx.fillStyle = "rgba(40,110,190,0.95)";
            roundRect(ctx, x + w * 0.18, y + h * 0.08, w * 0.52, h * 0.40, 12); ctx.fill();

            // windows
            ctx.fillStyle = "rgba(220,245,255,0.55)";
            roundRect(ctx, x + w * 0.24, y + h * 0.14, w * 0.18, h * 0.18, 8); ctx.fill();
            roundRect(ctx, x + w * 0.46, y + h * 0.14, w * 0.18, h * 0.18, 8); ctx.fill();
        }

        // wheels
        const wy = y + h * 0.78;
        ctx.fillStyle = "rgba(20,20,25,0.95)";
        const r = h * ((type === "bus") ? 0.18 : 0.16);
        const wx1 = x + w * 0.24;
        const wx2 = x + w * 0.76;
        ctx.beginPath(); ctx.arc(wx1, wy, r, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(wx2, wy, r, 0, Math.PI * 2); ctx.fill();

        // rims
        const spin = t * 0.25;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath(); ctx.arc(wx1, wy, r * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(wx2, wy, r * 0.55, 0, Math.PI * 2); ctx.fill();

        // simple spinning spokes
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2;
        for (const wx of [wx1, wx2]) {
            ctx.save();
            ctx.translate(wx, wy);
            ctx.rotate(spin);
            ctx.beginPath();
            ctx.moveTo(-r * 0.5, 0);
            ctx.lineTo(r * 0.5, 0);
            ctx.stroke();
            ctx.restore();
        }
        ctx.globalAlpha = 1;

        // motion streak
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.12, y + h * 0.22);
        ctx.lineTo(x + w * 0.02, y + h * 0.18);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.restore();
    }





    function drawMouse(o) {
        if (o.taken) return;
        ctx.save(); ctx.translate(o.x, o.y);
        ctx.fillStyle = "#666"; roundRect(ctx, 2, 4, o.w - 4, o.h - 4, 6); ctx.fill();
        ctx.fillStyle = "#888"; ctx.beginPath(); ctx.arc(4, 6, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(o.w * 0.75, o.h * 0.45, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawCatnip(o) {
        if (o.taken) return;
        const pulse = 0.5 + 0.5 * Math.sin(game.tick * 0.12);
        ctx.save(); ctx.translate(o.x, o.y);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = `rgba(60,200,110,${0.55 + pulse * 0.35})`;
        ctx.beginPath(); ctx.ellipse(o.w * 0.5, o.h * 0.55, o.w * 0.48, o.h * 0.40, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawFish(o) {
        if (o.taken) return;
        ctx.save(); ctx.translate(o.x, o.y);
        ctx.fillStyle = "rgba(255,180,60,0.95)";
        roundRect(ctx, 2, 3, o.w - 4, o.h - 6, 6); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(o.w - 2, o.h * 0.5); ctx.lineTo(o.w + 6, o.h * 0.2); ctx.lineTo(o.w + 6, o.h * 0.8);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }


    function drawLife(o) {
        if (o.taken) return;
        ctx.save();
        ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
        const s = Math.min(o.w, o.h) / 2;
        const pulse = 0.75 + 0.25 * Math.sin(game.tick * 0.10);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = `rgba(255,90,120,${0.75 + pulse * 0.20})`;
        ctx.beginPath();
        // simple heart
        ctx.moveTo(0, s * 0.9);
        ctx.bezierCurveTo(s * 1.2, s * 0.2, s * 0.6, -s * 0.8, 0, -s * 0.15);
        ctx.bezierCurveTo(-s * 0.6, -s * 0.8, -s * 1.2, s * 0.2, 0, s * 0.9);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    function drawBlanket(o) {
        const pulse = 0.5 + 0.5 * Math.sin(game.tick * 0.10);
        ctx.save(); ctx.translate(o.x, o.y);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = `rgba(255,120,170,${0.55 + pulse * 0.20})`;
        roundRect(ctx, 0, 0, o.w, o.h, 8); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, o.h - 3); ctx.lineTo(o.w - 10, o.h - 3);
        ctx.stroke();
        ctx.restore();
    }

    // Small hut used for HUD "rest" pause
    function drawRestHut(x, y) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(-10, 48, 140, 6);

        ctx.fillStyle = "#f2dfbf";
        roundRect(ctx, 0, 10, 86, 50, 10); ctx.fill();

        ctx.fillStyle = "#b85c3c";
        ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(43, -20); ctx.lineTo(92, 12); ctx.closePath(); ctx.fill();

        ctx.fillStyle = "#7b4c22";
        roundRect(ctx, 34, 32, 18, 26, 6); ctx.fill();

        ctx.fillStyle = "rgba(255,247,204,0.70)";
        roundRect(ctx, 12, 28, 18, 14, 4); ctx.fill();

        // tiny sleeping mat
        ctx.fillStyle = "rgba(255,120,170,0.85)";
        roundRect(ctx, 8, 50, 52, 10, 6); ctx.fill();

        ctx.restore();
    }

    function drawHeartWave() {
        const hw = game.heartWave;
        if (!hw || !hw.active) return;

        const dt = (game.tick - (hw.startTick || 0));
        const dur = hw.dur || 90;
        const t = clamp(dt / dur, 0, 1);
        if (t >= 1) { hw.active = false; return; }

        const cx = canvas.W * 0.5;
        const cy = canvas.H * 0.42;

        // expand from medium to huge (screen-filling), then fade out
        const maxR = Math.hypot(canvas.W, canvas.H) * 0.65;
        const r = 60 + (maxR - 60) * (t * t);

        ctx.save();
        ctx.globalAlpha = 0.22 * (1 - t);
        ctx.lineWidth = 6;
        ctx.strokeStyle = "rgba(255,150,190,1)";
        ctx.shadowColor = "rgba(255,150,190,0.6)";
        ctx.shadowBlur = 18;

        // heart outline path, scaled by r
        const s = r / 100;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 28 * s);
        ctx.bezierCurveTo(cx - 55 * s, cy - 10 * s, cx - 40 * s, cy - 58 * s, cx, cy - 30 * s);
        ctx.bezierCurveTo(cx + 40 * s, cy - 58 * s, cx + 55 * s, cy - 10 * s, cx, cy + 28 * s);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }


    function draw(objects) {
        const palette = bg.palette();

        bg.drawSky(ctx);
        bg.drawParallax(ctx);

        // camera follow: keep cat visible on high jumps, leave some view below
        const followEnabled = !game.setpiece?.active;
        const desiredY = canvas.H * 0.40;
        const margin = canvas.H * 0.12;
        const maxLift = canvas.H * 0.35;
        let targetCamY = 0;
        if (followEnabled) {
            if (cat.y < (desiredY - margin)) {
                targetCamY = Math.min(maxLift, desiredY - cat.y);
            }
        }
        game.cameraY = lerp(game.cameraY ?? 0, targetCamY, 0.08);

        ctx.save();
        ctx.translate(0, game.cameraY);

        // Setpiece mode: scripted beats (ocean crossing etc.)
        // Phase-aware:
        // - approach/board/arrive: draw normal land + masked ocean behind vehicle
        // - travel: ocean-only
        if (game.setpiece?.active && game.setpiece.phase === "travel") {
            // ocean-only travel shot
            drawSetpieceVehicle();
            drawSpeechBubbles(objects);
            ctx.restore();
            drawHeartWave();
            drawToast(objects);
            return;
        }

        terrain.drawGround(ctx, palette);

        if (typeof bg.drawGroundFog === "function") {
            bg.drawGroundFog(ctx);
        }

        drawPawprints(objects);

        drawPuffs(objects);
        drawSpeechBubbles(objects);

        // objects
        for (const o of objects.list) {
            if (o.kind === "platform") { if (o.type === "car") drawCar(o); else drawFence(o); }
            else if (o.kind === "setpiece") {
                if (o.draw) o.draw(ctx, game);
            }
            else if (o.kind === "obstacle") {
                if (o.type === "bird") {
                    if (o.draw) o.draw(ctx, game);
                    else drawBird(ctx, o);
                } else if (o.type === "monkey") {
                    if (o.draw) o.draw(ctx, game);
                } else if (o.type === "goat") {
                    if (o.draw) o.draw(ctx, game);
                } else if (o.type === "dog") {
                    if (o.draw) o.draw(ctx, game);
                    else drawDog(ctx, o, game);
                }
                else if (o.type === "scorpion") {
                    if (o.draw) o.draw(ctx, game);
                }
                else drawYarn(o);
            } else if (o.kind === "collectible") {
                if (o.type === "mouse") drawMouse(o);
                else if (o.type === "catnip") drawCatnip(o);
                else if (o.type === "fish") drawFish(o);
                else if (o.type === "life") drawLife(o);
            } else if (o.kind === "checkpoint") {
                if (!o.used) drawBlanket(o);
            }
        }

        // setpiece vehicle overlay (approach/board/arrive/travel)
        if (game.setpiece?.active) drawSetpieceVehicle();
        // rest hut (pause)
        if (game.pause?.active) {
            const hx = game.pause.hutX ?? 240;
            const hy = terrain.surfaceAt(hx) - 52;
            drawRestHut(hx, hy);
        }

        // DEBUG: collision boxes
        if (game?._dbg?.lastSolidCheck) {
            const { c, fence } = game._dbg.lastSolidCheck;
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = "yellow";
            ctx.strokeRect(c.x, c.y, c.w, c.h);
            ctx.strokeStyle = "cyan";
            ctx.strokeRect(fence.x, fence.y, fence.w, fence.h);
            ctx.restore();
        }

        if (game?._dbg?.lastSolidHit) {
            const { c, fence, o } = game._dbg.lastSolidHit;
            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";
            ctx.strokeRect(c.x, c.y, c.w, c.h);
            ctx.strokeRect(fence.x, fence.y, fence.w, fence.h);
            ctx.fillStyle = "red";
            ctx.fillText(`HIT ${o.kind}:${o.type}`, 10, 20);
            ctx.restore();
        }

        // cat shadow + sprite
        const blink = (game.invulnTimer > 0) ? ((game.tick % 10) < 6) : true;
        const inVehicle = !!(game.setpiece?.active && game.setpiece.catInVehicle);
        if (game.pause?.active) {
            // no shadow while sleeping
        } else if (!inVehicle && blink) {
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = "#000";
            ctx.beginPath();
            const surfaceY = terrain.surfaceAt(cat.x);
            const shadowW = cat.w * (cat.onSurface ? 0.72 : 0.52);
            const shadowH = cat.h * 0.12;
            ctx.ellipse(cat.x + cat.w * 0.55, surfaceY - 3, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (game.pause?.active) {
            // sleeping bubble
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            const bx = cat.x + cat.w * 0.55;
            const by = cat.y - 10;
            roundRect(ctx, bx - 26, by - 18, 52, 22, 10); ctx.fill();
            ctx.fillStyle = "rgba(20,20,20,0.9)";
            ctx.font = "12px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("purr…", bx, by - 3);
            ctx.globalAlpha = 1;
        } else if (!inVehicle && blink) {
            catApi.draw(ctx);
        }

        ctx.restore();

        // checkpoint glow (screen-space)
        if (game.checkpointGlow > 0) {
            ctx.globalAlpha = clamp(game.checkpointGlow / 120, 0, 1) * 0.16;
            ctx.fillStyle = "rgba(255,120,170,1)";
            ctx.fillRect(0, 0, canvas.W, canvas.H);
            ctx.globalAlpha = 1;
        }

        // overlays
        if (game.catnipTimer > 0) {
            const pulse = 0.18 + 0.12 * Math.sin(game.tick * 0.15);
            ctx.globalAlpha = pulse;
            ctx.fillStyle = "rgba(80,220,140,0.32)";
            ctx.fillRect(0, 0, canvas.W, canvas.H);
            ctx.globalAlpha = 1;
        }
        if (game.chaseActive) {
            const pulse = 0.08 + 0.06 * Math.sin(game.tick * 0.2);
            ctx.globalAlpha = pulse;
            ctx.fillStyle = "rgba(255,80,80,0.30)";
            ctx.fillRect(0, 0, canvas.W, canvas.H);
            ctx.globalAlpha = 1;
        }

        drawHeartWave();
        drawToast(objects);



    }
    return { draw };

}
