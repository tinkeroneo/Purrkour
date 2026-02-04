import { roundRect } from "../core/util.js";

export function createDog(game, opts) {
    const o = {
        kind: "obstacle",
        type: "dog",
        x: opts.x,
        y: opts.y,
        w: opts.w,
        h: opts.h,
        asleep: !!opts.asleep,
        chasing: !!opts.chasing,
        chaseSpeedBoost: opts.chaseSpeedBoost,
        anim: opts.anim ?? 0,
        yMode: opts.yMode ?? "ground",
        yOffset: opts.yOffset ?? -opts.h,
        draw(ctx) {
            drawDog(ctx, o, game);
        }
    };

    return o;
}

export function drawDog(ctx, o, game) {
    o.anim += o.chasing ? 0.22 : 0.10;
    const themeKey = game.theme || (game.progression?.current?.theme) || "forest";
    const asGoat = (themeKey === "mountain" || themeKey === "cliff");
    const asMonkey = (themeKey === "island" || themeKey === "jungle");
    const bounce = o.chasing ? Math.sin(o.anim) * 2.2 : Math.sin(o.anim) * 0.8;

    ctx.save(); ctx.translate(o.x, o.y + bounce);

    ctx.fillStyle = asGoat ? (o.chasing ? "#8a8a8a" : "#7a7a7a") : asMonkey ? (o.chasing ? "#6b4a2a" : "#5a3e24") : (o.chasing ? "#8b4b2a" : "#7a4a2b");
    roundRect(ctx, 0, 8, o.w, o.h - 8, 12); ctx.fill();

    // theme accents
    if (asGoat) {
        ctx.fillStyle = "#d7d7d7";
        ctx.beginPath();
        ctx.arc(o.w * 0.18, 6, 5, Math.PI, Math.PI * 2);
        ctx.arc(o.w * 0.30, 6, 5, Math.PI, Math.PI * 2);
        ctx.fill();
    } else if (asMonkey) {
        ctx.fillStyle = "#d9b58a";
        ctx.beginPath();
        ctx.arc(o.w * 0.22, 14, 6, 0, Math.PI * 2);
        ctx.fill();
    }

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
