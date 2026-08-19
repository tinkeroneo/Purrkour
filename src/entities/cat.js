// src/entities/cat.js
import { clamp, roundRect, tri } from "../core/util.js";
import { getOverlay } from "../world/overlays.js";

const BASE_GRAVITY = 0.34;
const BASE_JUMP_VY = -9.0;

export function getCatPose(crouching) {
  return crouching
    ? { scaleX: 1.14, scaleY: 0.6 }
    : { scaleX: 1, scaleY: 1 };
}

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
    runPhase: 0,
    frame: 0,
    onSurface: true,
    squashTimer: 0,
    squashAmp: 0.18,
  };

  function jump(audio) {
    if (game.finished) return;
    if (cat.jumpsLeft <= 0) return;

    const jumpBoost = (game.catnipTimer > 0) ? 1.08 : 1.0;
    const overlay = getOverlay(game.themeOverlay);
    const overlayJump = overlay?.jumpMul ?? 1.0;
    const worldJump = game.worldRule?.jumpMul ?? 1.0;
    cat.vy = BASE_JUMP_VY * jumpBoost * overlayJump * worldJump;
    cat.jumpsLeft--;
    cat.squashTimer = game.reducedMotion ? 0 : 7;
    cat.squashAmp = -0.12;

    audio?.SFX?.jump?.();
    hud.sync(game, cat);
  }

  function gravityStep() {
    if (cat.squashTimer > 0) cat.squashTimer--;
    const overlay = getOverlay(game.themeOverlay);
    const overlayGrav = overlay?.gravityMul ?? 1.0;
    const worldGravity = game.worldRule?.gravityMul ?? 1.0;
    cat.vy += BASE_GRAVITY * (game.catnipTimer > 0 ? 0.95 : 1.0) * overlayGrav * worldGravity;
    cat.y += cat.vy;
  }

  function resetAt(surfaceY) {
    cat.x = cat.baseX;
    cat.y = surfaceY - cat.h;
    cat.vy = 0;
    cat.onSurface = true;
    cat.squashTimer = 0;
    cat.squashAmp = 0.18;
    cat.runPhase = 0;
    cat.maxJumps = cat.baseMaxJumps;
    cat.jumpsLeft = cat.maxJumps;
    hud.sync(game, cat);
  }

  function setAnimFrame(f) { cat.frame = f; }

function clampX(W, blockedX = false) {
  const minX = 70;
  const maxX = Math.min(W * 0.45, 210);
  cat.x = clamp(cat.x, minX, maxX);

  // Don't pull the cat back into solids when it was side-blocked this frame
  if (blockedX) return;
  if (game.input?.moveDir) return;

  const target = clamp(cat.baseX, minX, maxX);
  if (cat.x > target + 8) cat.x = cat.x + (target - cat.x) * 0.08;
}


  function catMood() {
    if (game.tick - game.lastHitTick < 240) return "annoyed";
    if (game.mice >= 12) return "proud";
    if (game.mice >= 4) return "happy";
    return "calm";
  }


function draw(ctx) {
    const w = cat.w, h = cat.h;
    const mood = catMood();

    const fur = "#3b3b3b", furDark = "#2a2a2a", eye = "#f5f7ff", nose = "#ff9aa2";
    const running = (cat.frame <= 3);
    const pose = getCatPose(!!game.input?.crouch);
    const runPhase = cat.runPhase ?? 0;
    const bob = running ? Math.abs(Math.sin(runPhase * 2)) * 1.2 : 0;

    ctx.save();
    const sq = (cat.squashTimer > 0) ? (cat.squashTimer / 10) : 0;
    const sx = 1 + sq * cat.squashAmp;
    const sy = 1 - sq * cat.squashAmp;
    const cx = cat.x + cat.w * 0.5;
    const footY = cat.y + bob + (cat.vy < -1 ? -2 : 0) + cat.h;
    ctx.translate(cx, footY);
    ctx.scale(sx * pose.scaleX, sy * pose.scaleY);
    ctx.translate(-cat.w * 0.5, -cat.h);

// Visual alignment: the tail extends far to the left, beyond the collision box.
    // Shift the sprite slightly right so it doesn't look like it clips into solids.
    ctx.translate(10, 0);
    // tail
    const tailWave = running ? Math.sin(runPhase * 0.65) : 0;
    ctx.save();
    ctx.strokeStyle = furDark;
    ctx.lineWidth = Math.max(2, w * 0.08);
    ctx.lineCap = "round";
    const tailBaseX = w * 0.18;
    const tailBaseY = h * 0.62;
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(
      tailBaseX - w * (0.48 + tailWave * 0.04),
      tailBaseY - h * (0.18 + tailWave * 0.05),
      tailBaseX - w * (0.22 + tailWave * 0.03),
      tailBaseY - h * (0.52 + tailWave * 0.04)
    );
    ctx.stroke();
    ctx.restore();

    // body+head
    ctx.fillStyle = fur;
    roundRect(ctx, w * 0.18, h * 0.20, w * 0.70, h * 0.62, w * 0.18); ctx.fill();
    roundRect(ctx, w * 0.45, h * 0.08, w * 0.48, h * 0.45, w * 0.18); ctx.fill();

    // ears
    ctx.fillStyle = furDark;
    const earTwitch = running ? Math.sin(runPhase * 0.5) : 0;
    tri(ctx, w * 0.60, h * 0.10, w * 0.68, h * 0.02 - earTwitch, w * 0.73, h * 0.14);
    tri(ctx, w * 0.77, h * 0.10, w * 0.85, h * 0.02 + earTwitch, w * 0.90, h * 0.14);

    // legs
    const legY = h * 0.74;
    const legW = w * 0.12, legH = h * 0.18;
    const legA = running ? Math.sin(runPhase) * 2.4 : 0;
    const legB = -legA;

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
