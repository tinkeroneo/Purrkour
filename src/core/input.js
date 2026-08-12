export function setupInput({ onJump, onKey, onMove, onCrouch, onGameFocus }) {
  let last = 0;
  const keys = new Set();

  function isUiEvent(e) {
    const target = e?.target;
    if (!target || !target.closest) return false;
    return !!target.closest("#ui, dialog, .touch-controls, #presentationSkip, .setpiece-action");
  }

  function triggerJump(e) {
    if (isUiEvent(e)) return;
    e?.preventDefault?.();
    onGameFocus?.();
    const now = performance.now();
    if (now - last < 120) return;
    last = now;
    onJump?.();
  }

  window.addEventListener("pointerdown", triggerJump, { passive: false });

  function releaseMovement() {
    if (!keys.size) return;
    keys.clear();
    onMove?.(0);
    onCrouch?.(false);
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space"  || e.code === "KeyW" || e.code === "ArrowUp") {
      const active = document.activeElement;
      if (active?.closest?.("#ui")) return;
      triggerJump(e);
      return;
    }
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      e.preventDefault?.();
      if (keys.has("left")) return;
      keys.add("left");
      onMove?.(-1);
      return;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      e.preventDefault?.();
      if (keys.has("right")) return;
      keys.add("right");
      onMove?.(1);
      return;
    }
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      e.preventDefault?.();
      if (keys.has("down")) return;
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

  window.addEventListener("blur", releaseMovement);
}
