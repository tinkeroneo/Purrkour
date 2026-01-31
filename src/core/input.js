export function setupInput({ onJump }) {
  let last = 0;
  function trigger(e) {
    e?.preventDefault?.();
    const now = performance.now();
    if (now - last < 120) return;
    last = now;
    onJump();
  }
  window.addEventListener("pointerdown", trigger, { passive: false });
  window.addEventListener("keydown", (e) => { if (e.code === "Space") trigger(e); });
}
