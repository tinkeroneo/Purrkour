import { clamp, roundRect, tri } from "../core/util.js";

export function createDrawer(ctx, canvas, game, catApi, terrain, lakes, bg) {
    const { cat } = catApi;
    function drawBalloonSetpiece() {
        // anchor point: slightly above cat

        const x = cat.x + 40;
        const y = cat.y - 80;

        ctx.save();

        // balloon
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "rgba(240,120,160,0.9)";
        ctx.beginPath();
        ctx.ellipse(x, y, 26, 34, 0, 0, Math.PI * 2);
        ctx.fill();

        // stripes
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(x - 2, y - 34, 4, 68);
        ctx.globalAlpha = 1;

        // ropes + basket
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 12, y + 28); ctx.lineTo(x - 10, y + 54);
        ctx.moveTo(x + 12, y + 28); ctx.lineTo(x + 10, y + 54);
        ctx.stroke();

        ctx.fillStyle = "rgba(170,110,60,0.95)";
        ctx.beginPath();
        ctx.roundRect(x - 14, y + 54, 28, 14, 6);
        ctx.fill();

        ctx.restore();
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

    function drawBubbles(objects) {
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
    function drawBird(o) {
        o.flapT += 0.12;
        const flap = Math.sin(o.flapT) * 2;
        ctx.save();
        ctx.translate(o.x, o.y + flap);
        ctx.fillStyle = "#2b2b2b";
        roundRect(ctx, 6, 6, o.w - 12, o.h - 12, 6); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(o.w * 0.15, o.h * 0.55);
        ctx.quadraticCurveTo(o.w * 0.45, o.h * 0.25, o.w * 0.75, o.h * 0.55);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(o.w * 0.70, o.h * 0.40, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawYarn(o) {
        ctx.save();
        ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
        ctx.fillStyle = "#b07a4a";
        ctx.beginPath(); ctx.arc(0, 0, Math.min(o.w, o.h) / 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, Math.min(o.w, o.h) / 2 - 3, 0.3, 2.8); ctx.stroke();
        ctx.restore();
    }

    function drawFence(o) {
        const topY = o.y;
        const groundYAtLeft = terrain.surfaceAt(o.x + 6);
        const groundYAtRight = terrain.surfaceAt(o.x + o.w - 6);

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

    function drawDog(o) {
        o.anim += o.chasing ? 0.22 : 0.10;
        const bounce = o.chasing ? Math.sin(o.anim) * 2.2 : Math.sin(o.anim) * 0.8;

        ctx.save(); ctx.translate(o.x, o.y + bounce);

        ctx.fillStyle = o.chasing ? "#8b4b2a" : "#7a4a2b";
        roundRect(ctx, 0, 8, o.w, o.h - 8, 12); ctx.fill();

        ctx.fillStyle = "#5a341f";
        roundRect(ctx, o.w * 0.62, 0, o.w * 0.38, o.h * 0.78, 12); ctx.fill();

        ctx.fillStyle = "#432415";
        roundRect(ctx, o.w * 0.72, o.h * 0.08, o.w * 0.16, o.h * 0.22, 8); ctx.fill();

        if (o.chasing) {
            ctx.fillStyle = "rgba(220,70,70,0.95)";
            roundRect(ctx, o.w * 0.18, o.h * 0.32, o.w * 0.20, 6, 6); ctx.fill();
        }

        ctx.fillStyle = "#432415";
        const legPhase = Math.sin(o.anim * 2);
        const ly = o.h * 0.70;
        roundRect(ctx, o.w * 0.18, ly + (legPhase > 0 ? 2 : -1), 8, 14, 4); ctx.fill();
        roundRect(ctx, o.w * 0.40, ly + (legPhase < 0 ? 2 : -1), 8, 14, 4); ctx.fill();
        roundRect(ctx, o.w * 0.58, ly + (legPhase > 0 ? 2 : -1), 8, 14, 4); ctx.fill();

        if (o.asleep && !o.chasing) {
            ctx.strokeStyle = "rgba(255,255,255,0.75)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(o.w * 0.75, o.h * 0.28); ctx.lineTo(o.w * 0.86, o.h * 0.28);
            ctx.stroke();
        } else {
            ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(o.w * 0.80, o.h * 0.26, 2.6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(o.w * 0.80, o.h * 0.26, 1.2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = "rgba(255,255,255,0.60)";
        roundRect(ctx, o.w * 0.86, o.h * 0.44, 8, 5, 3); ctx.fill();

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

    function drawHome() {
        ctx.save();
        ctx.translate(game.homeX, terrain.surfaceAt(game.homeX) - 52);

        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(-10, 48, 150, 6);

        ctx.fillStyle = "#f5e6c8";
        roundRect(ctx, 0, 10, 92, 52, 10); ctx.fill();

        ctx.fillStyle = "#b55a3c";
        ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(46, -22); ctx.lineTo(98, 12); ctx.closePath(); ctx.fill();

        ctx.fillStyle = "#8b5a2b";
        roundRect(ctx, 38, 34, 18, 28, 6); ctx.fill();

        ctx.fillStyle = "rgba(255,247,204,0.65)";
        roundRect(ctx, 12, 28, 18, 14, 4); ctx.fill();

        ctx.restore();
    }

    function draw(objects) {
        const palette = bg.palette();

        bg.drawSky(ctx);
        bg.drawParallax(ctx);

        // Ocean is just a background layer (ground stays playable)
        if (game.setpiece?.active && typeof bg.drawOcean === "function") {
            bg.drawOcean(ctx);
        }

        terrain.drawGround(ctx, palette);

        if (typeof bg.drawGroundFog === "function") {
            bg.drawGroundFog(ctx);
        }

        drawPawprints(objects);

        // objects
        for (const o of objects.list) {
            if (o.kind === "platform") drawFence(o);
            else if (o.kind === "obstacle") {
                if (o.type === "bird") drawBird(o);
                else if (o.type === "dog") drawDog(o);
                else drawYarn(o);
            } else if (o.kind === "collectible") {
                if (o.type === "mouse") drawMouse(o);
                else if (o.type === "catnip") drawCatnip(o);
                else if (o.type === "fish") drawFish(o);
            } else if (o.kind === "checkpoint") {
                if (!o.used) drawBlanket(o);
            }
        }

        // home
        if (game.homePhase >= 1) drawHome();

        // checkpoint glow
        if (game.checkpointGlow > 0) {
            ctx.globalAlpha = clamp(game.checkpointGlow / 120, 0, 1) * 0.16;
            ctx.fillStyle = "rgba(255,120,170,1)";
            ctx.fillRect(0, 0, canvas.W, canvas.H);
            ctx.globalAlpha = 1;
        }

        // cat shadow + sprite
        const blink = (game.invulnTimer > 0) ? ((game.tick % 10) < 6) : true;
        if (blink) {
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

        if (blink) catApi.draw(ctx);
        if (game.setpiece?.active) drawBalloonSetpiece();

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

        // finish fade
        if (game.homePhase === 2) {
            ctx.globalAlpha = game.finishFade;
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.fillRect(0, 0, canvas.W, canvas.H);
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.font = "22px system-ui, sans-serif";
            ctx.fillText("Zuhause 🏡😺", canvas.W / 2, canvas.H / 2 - 6);
            ctx.font = "14px system-ui, sans-serif";
            ctx.fillText("gracias fürs Spielen", canvas.W / 2, canvas.H / 2 + 18);
            ctx.globalAlpha = 1;
        }

        drawBubbles(objects);
    }

    return { draw };
}
