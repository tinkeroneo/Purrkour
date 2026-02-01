// src/entities/cat.js
import { clamp, roundRect, tri } from "../core/util.js";

const BASE_GRAVITY = 0.34;
const BASE_JUMP_VY = -9.0;

export function createCat(game, hud) {
  const cat = {
    baseX: 110,
    x: 110,
    y: 0,
    w: 58,
    h: 58,
    vy: 0,

    baseMaxJumps: 2,
    maxJumps: 2,
    jumpsLeft: 2,

    animT: 0,
    frame: 0,
    onSurface: true,
    squashTimer: 0,
    squashAmp: 0.18,
  };

  function jump(audio) {
    if (game.finished) return;
    if (cat.jumpsLeft <= 0) return;

    const jumpBoost = (game.catnipTimer > 0) ? 1.08 : 1.0;
    cat.vy = BASE_JUMP_VY * jumpBoost;
    cat.jumpsLeft--;

    audio?.SFX?.jump?.();
    hud.sync(game, cat);
  }

  function gravityStep() {
    if (cat.squashTimer > 0) cat.squashTimer--;
    cat.vy += BASE_GRAVITY * (game.catnipTimer > 0 ? 0.95 : 1.0);
    cat.y += cat.vy;
  }

  function resetAt(surfaceY) {
    cat.x = cat.baseX;
    cat.y = surfaceY - cat.h;
    cat.vy = 0;
    cat.onSurface = true;
    cat.maxJumps = cat.baseMaxJumps;
    cat.jumpsLeft = cat.maxJumps;
    hud.sync(game, cat);
  }

  function setAnimFrame(f) { cat.frame = f; }

  function clampX(W) {
    const minX = 70;
    const maxX = Math.min(W * 0.45, 210);
    cat.x = clamp(cat.x, minX, maxX);

    const target = clamp(cat.baseX, minX, maxX);
    if (cat.x > target + 8) cat.x = cat.x + (target - cat.x) * 0.08;
  }

  function catMood() {
    if (game.tick - game.lastHitTick < 240) return "annoyed";
    if (game.mice >= 12) return "proud";
    if (game.mice >= 4) return "happy";
    return "calm";
  }

  
  function stomp() {
    cat.squashTimer = 10;
  }

function draw(ctx) {
    const w = cat.w, h = cat.h;
    const mood = catMood();

    const fur = "#3b3b3b", furDark = "#2a2a2a", eye = "#f5f7ff", nose = "#ff9aa2";
    const running = (cat.frame <= 3);
    const bob = running ? (Math.sin(cat.frame * Math.PI / 2) * 1.6) : 0;

    ctx.save();
    const sq = (cat.squashTimer > 0) ? (cat.squashTimer / 10) : 0;
    const sx = 1 + sq * cat.squashAmp;
    const sy = 1 - sq * cat.squashAmp;
    const cx = cat.x + cat.w * 0.5;
    const cy = cat.y + bob + (cat.vy < -1 ? -2 : 0) + cat.h * 0.5;
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);
    ctx.translate(-cat.w * 0.5, -cat.h * 0.5);


    // tail
    const tailPhase = running ? cat.frame : 2;
    ctx.save();
    ctx.strokeStyle = furDark;
    ctx.lineWidth = Math.max(2, w * 0.08);
    ctx.lineCap = "round";
    const tailBaseX = w * 0.18;
    const tailBaseY = h * 0.62;
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(
      tailBaseX - w * (0.45 + tailPhase * 0.03),
      tailBaseY - h * (0.10 + tailPhase * 0.05),
      tailBaseX - w * (0.20 + tailPhase * 0.02),
      tailBaseY - h * (0.48 + tailPhase * 0.03)
    );
    ctx.stroke();
    ctx.restore();

    // body+head
    ctx.fillStyle = fur;
    roundRect(ctx, w * 0.18, h * 0.20, w * 0.70, h * 0.62, w * 0.18); ctx.fill();
    roundRect(ctx, w * 0.45, h * 0.08, w * 0.48, h * 0.45, w * 0.18); ctx.fill();

    // ears
    ctx.fillStyle = furDark;
    tri(ctx, w * 0.60, h * 0.10, w * 0.68, h * 0.02 - (cat.frame === 1 ? 1 : 0), w * 0.73, h * 0.14);
    tri(ctx, w * 0.77, h * 0.10, w * 0.85, h * 0.02 + (cat.frame === 2 ? 1 : 0), w * 0.90, h * 0.14);

    // legs
    const legY = h * 0.74;
    const legW = w * 0.12, legH = h * 0.18;
    const f = cat.frame % 4;
    const legA = (f === 0) ? -2 : (f === 2) ? 2 : 0;
    const legB = (f === 0) ? 2 : (f === 2) ? -2 : 0;

    ctx.fillStyle = furDark;
    roundRect(ctx, w * 0.34, legY + legB, legW, legH, legW * 0.4); ctx.fill();
    roundRect(ctx, w * 0.58, legY + legA, legW, legH, legW * 0.4); ctx.fill();
    roundRect(ctx, w * 0.44, legY + legA, legW, legH, legW * 0.4); ctx.fill();
    roundRect(ctx, w * 0.68, legY + legB, legW, legH, legW * 0.4); ctx.fill();

    // eye
    const eyeX = w * 0.78, eyeY = h * 0.24;
    ctx.fillStyle = eye;
    roundRect(ctx, eyeX, eyeY, w * 0.08, h * 0.07, w * 0.02); ctx.fill();
    ctx.fillStyle = "#111";
    const pupilW = (mood === "annoyed") ? w * 0.022 : w * 0.03;
    roundRect(ctx, eyeX + w * 0.035, eyeY + h * 0.025, pupilW, h * 0.03, w * 0.01); ctx.fill();

    // nose + whiskers
    ctx.fillStyle = nose;
    roundRect(ctx, w * 0.74, h * 0.33, w * 0.05, h * 0.04, w * 0.02); ctx.fill();

    ctx.strokeStyle = "rgba(230,230,230,0.9)";
    ctx.lineWidth = Math.max(1, w * 0.02);
    ctx.beginPath();
    ctx.moveTo(w * 0.74, h * 0.35); ctx.lineTo(w * 0.97, h * 0.30);
    ctx.moveTo(w * 0.74, h * 0.36); ctx.lineTo(w * 0.97, h * 0.36);
    ctx.moveTo(w * 0.74, h * 0.37); ctx.lineTo(w * 0.97, h * 0.42);
    ctx.stroke();

    ctx.restore();
  }

  // ✅ exported API shape: wrapper with methods + cat state
  return { cat, jump, gravityStep, resetAt, setAnimFrame, clampX, draw };
}
