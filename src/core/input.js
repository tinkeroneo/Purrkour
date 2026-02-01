export function setupInput({ onJump, onKey }) {
  let last = 0;

  function triggerJump(e) {
    e?.preventDefault?.();
    const now = performance.now();
    if (now - last < 120) return;
    last = now;
    onJump?.();
  }

  window.addEventListener("pointerdown", triggerJump, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      triggerJump(e);
      return;
    }
    onKey?.(e);
  });
}
