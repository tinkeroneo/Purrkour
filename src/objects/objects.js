import { clamp } from "../core/util.js";

export function createObjects() {
  const list = [];
  const pawprints = [];
  const bubbles = [];
  const puffs = []; // {x,y,vx,vy,r,life}
  let toastTimer = 0;
  let toastText = "";

  function add(o) { list.push(o); }

  function addBubble(text, x, y) {
    bubbles.push({ text, x, y, life: 70 });
  }

  function addPuff(x, y) {
    // 3 soft circles drifting up/right
    for (let i = 0; i < 3; i++) {
      puffs.push({
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 6 - 3),
        vx: 0.15 + Math.random() * 0.25,
        vy: -0.35 - Math.random() * 0.25,
        r: 5 + Math.random() * 5,
        life: 18 + Math.floor(Math.random() * 8),
      });
    }
  }

  function toast(text, frames = 120) {
    toastText = text;
    toastTimer = frames;
  }

  function updateBubbles() {
    for (const b of bubbles) { b.y -= 0.08; b.life--; }
    for (const p of puffs) { p.x += p.vx; p.y += p.vy; p.vx *= 0.98; p.vy *= 0.98; p.life--; p.r *= 0.985; }
    for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].life <= 0) bubbles.splice(i, 1);
    for (let i = puffs.length - 1; i >= 0; i--) if (puffs[i].life <= 0 || puffs[i].r < 0.5) puffs.splice(i, 1);
    if (toastTimer > 0) toastTimer--;
  }

  function maybeAddPawprint(game, cat, terrain, effSpeed) {
    if (!cat.onSurface) return;
    if (effSpeed < 1.4) return;
    if (game.tick % 12 !== 0) return;
    if (Math.random() < 0.40) pawprints.push({ x: cat.x + cat.w * 0.35, y: terrain.surfaceAt(cat.x) - 6, life: 220 });
  }

  function updatePawprints(dx) {
    for (const p of pawprints) { p.x -= dx; p.life--; }
    for (let i = pawprints.length - 1; i >= 0; i--) {
      if (pawprints[i].life <= 0 || pawprints[i].x < -50) pawprints.splice(i, 1);
    }
  }

  function toastState() {
    return { toastTimer, toastText };
  }

  return {
    list,
    pawprints,
    bubbles,
    add,
    addBubble,
    toast,
    updateBubbles,
    maybeAddPawprint,
    updatePawprints,
    toastState
  };
}
