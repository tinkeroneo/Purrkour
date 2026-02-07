export function setupInput({ onJump, onKey, onMove, onCrouch }) {
  let last = 0;
  const keys = new Set();

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
    if (e.code === "Space"  || e.code === "KeyW" || e.code === "ArrowUp") {
      const active = document.activeElement;
      if (active?.closest?.("#ui")) return;
      triggerJump(e);
      return;
    }
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      keys.add("left");
      onMove?.(-1);
      return;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      keys.add("right");
      onMove?.(1);
      return;
    }
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      keys.add("down");
      onCrouch?.(true);
      return;
    }
    onKey?.(e);
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      keys.delete("left");
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      keys.delete("right");
    }
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      keys.delete("down");
      onCrouch?.(false);
    }
    if (!keys.has("left") && !keys.has("right")) {
      onMove?.(0);
    } else if (keys.has("left") && !keys.has("right")) {
      onMove?.(-1);
    } else if (keys.has("right") && !keys.has("left")) {
      onMove?.(1);
    }
  });
}
