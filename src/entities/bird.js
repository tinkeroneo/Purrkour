import { roundRect } from "../core/util.js";

export function createBird(opts) {
    const o = {
        kind: "obstacle",
        type: "bird",
        variant: opts.variant,
        x: opts.x,
        y: opts.y,
        w: opts.w,
        h: opts.h,
        flapT: opts.flapT ?? 0,
        yMode: opts.yMode ?? "fixed",
        drop: !!opts.drop,
        vy: opts.vy ?? 0,
        restY: opts.restY,
        landedTimer: opts.landedTimer ?? 0,
        draw(ctx) {
            drawBird(ctx, o);
        }
    };

    return o;
}

export function drawBird(ctx, o) {
    o.flapT += 0.12;
    if (o.landedTimer && o.landedTimer > 0) o.landedTimer--;
    const landBoost = (o.landedTimer && o.landedTimer > 0) ? (o.landedTimer / 14) : 0;
    const flap = Math.sin(o.flapT) * (2 + landBoost * 5);
    const v = o.variant || "crow";

    ctx.save();
    ctx.translate(o.x, o.y + flap);

    // base styles per variant
    let body = "#2b2b2b";
    let wing = "rgba(255,255,255,0.65)";
    let eye = "#fff";
    let beak = "rgba(255,200,80,0.95)";

    if (v === "seagull") { body = "rgba(245,245,245,0.95)"; wing = "rgba(0,0,0,0.35)"; eye = "#111"; beak = "rgba(255,190,70,0.95)"; }
    else if (v === "pigeon") { body = "rgba(120,130,145,0.95)"; wing = "rgba(255,255,255,0.45)"; eye = "#fff"; beak = "rgba(230,180,120,0.9)"; }
    else if (v === "parrot") { body = "rgba(80,200,120,0.95)"; wing = "rgba(255,255,255,0.55)"; eye = "#fff"; beak = "rgba(255,120,60,0.95)"; }
    else if (v === "drone") { body = "rgba(110,120,135,0.95)"; wing = "rgba(255,255,255,0.25)"; eye = "rgba(140,220,255,0.95)"; beak = "rgba(200,200,220,0.90)"; }
    else if (v === "eagle") { body = "rgba(150,95,55,0.95)"; wing = "rgba(255,255,255,0.40)"; eye = "#fff"; beak = "rgba(255,210,90,0.95)"; }
    else if (v === "hawk") { body = "rgba(170,120,70,0.95)"; wing = "rgba(255,255,255,0.40)"; eye = "#fff"; beak = "rgba(255,210,90,0.95)"; }
    else if (v === "bat") { body = "rgba(35,35,45,0.95)"; wing = "rgba(255,255,255,0.25)"; eye = "rgba(255,255,255,0.85)"; beak = "rgba(0,0,0,0)"; }

    // body
    ctx.fillStyle = body;
    roundRect(ctx, 6, 6, o.w - 12, o.h - 12, 6); ctx.fill();

    // wings / arc
    ctx.strokeStyle = wing;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (v === "bat") {
        // bat wings: two arcs
        ctx.moveTo(o.w * 0.10, o.h * 0.60);
        ctx.quadraticCurveTo(o.w * 0.28, o.h * 0.20, o.w * 0.46, o.h * 0.60);
        ctx.quadraticCurveTo(o.w * 0.64, o.h * 0.20, o.w * 0.82, o.h * 0.60);
    } else {
        ctx.moveTo(o.w * 0.15, o.h * 0.55);
        ctx.quadraticCurveTo(o.w * 0.45, o.h * 0.25, o.w * 0.75, o.h * 0.55);
    }
    ctx.stroke();

    // beak (not for bat)
    if (v !== "bat") {
        ctx.fillStyle = beak;
        ctx.beginPath();
        ctx.moveTo(o.w * 0.86, o.h * 0.55);
        ctx.lineTo(o.w * 1.02, o.h * 0.50);
        ctx.lineTo(o.w * 0.86, o.h * 0.45);
        ctx.closePath();
        ctx.fill();
    }

    // eye
    ctx.fillStyle = eye;
    ctx.beginPath(); ctx.arc(o.w * 0.70, o.h * 0.40, 2.4, 0, Math.PI * 2); ctx.fill();
    if (v !== "seagull" && v !== "bat") {
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(o.w * 0.70, o.h * 0.40, 1.0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
}
