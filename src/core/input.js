export function setupInput({ onJump, onKey }) {
  let last = 0;

  function isUiEvent(e) {
    const target = e?.target;
    if (!target || !target.closest) return false;
    return !!target.closest("#ui");
  }

  function triggerJump(e) {
    if (isUiEvent(e)) return;
    e?.preventDefault?.();
    const now = performance.now();
    if (now - last < 120) return;
    last = now;
    onJump?.();
  }

  window.addEventListener("pointerdown", triggerJump, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      const active = document.activeElement;
      if (active?.closest?.("#ui")) return;
      triggerJump(e);
      return;
    }
    onKey?.(e);
  });
}
