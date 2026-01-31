import { clamp } from "../core/util.js";

export function createObjects() {
  const list = [];
  const pawprints = [];
  const bubbles = [];
  let toastTimer = 0;
  let toastText = "";

  function add(o) { list.push(o); }

  function addBubble(text, x, y) {
    bubbles.push({ text, x, y, life: 70 });
  }

  function toast(text, frames = 120) {
    toastText = text;
    toastTimer = frames;
  }

  function updateBubbles() {
    for (const b of bubbles) { b.y -= 0.08; b.life--; }
    for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].life <= 0) bubbles.splice(i, 1);
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
