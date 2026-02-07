export function setupDebugControls({ game, cat, objects, terrain, bg, uiRoot }) {
  function onKey(e) {
    // Dev shortcuts (non-destructive)
    if (e.code === "KeyH") {
      if (!uiRoot) return true;
      uiRoot.style.display = (uiRoot.style.display === "none") ? "" : "none";
      return true;
    }
    if (e.code === "Digit1") {
      // jump close to ocean/setpiece
      window.__purrkour?.gotoOcean?.();
      return true;
    }
    if (e.code === "Digit2") {
      // trigger current setpiece immediately
      window.__purrkour?.triggerSetpiece?.();
      return true;
    }
    if (e.code === "KeyO") {
      // force ocean beat (progression)
      window.__purrkour?.enterBeat?.("OCEAN_JOURNEY");
      return true;
    }
    if (e.code === "KeyM") {
      // force rocket -> mars
      window.__purrkour?.enterBeat?.("ROCKET_FLIGHT");
      return true;
    }
    if (e.code === "Digit3") {
      // cycle theme
      const order = game.themeCycle?.order || [];
      if (!order.length) return true;
      const i = Math.max(0, order.indexOf(game.theme));
      game.theme = order[(i + 1) % order.length];
      return true;
    }
    if (e.code === "KeyR") {
      // soft reset via reload (fastest reliable)
      location.reload();
      return true;
    }
    return false;
  }

  // DEBUG helpers
  window.__purrkour = {
    game,
    cat,
    objects,
    terrain,
    bg
  };
  window.__purrkour.setTheme = (k) => game.theme = k;
  window.__purrkour.setOverlay = (id) => { game.themeOverlay = id; };
  window.__purrkour.clearOverlay = () => { game.themeOverlay = null; };

  // quick testing shortcuts (Console)
  window.__purrkour.setScore = (s) => { game.score = Math.max(0, s | 0); };
  window.__purrkour.gotoOcean = () => {
    // Prefer progression if present
    if (game.progressionApi?.enterBeatById) {
      game.progressionApi.enterBeatById("OCEAN_JOURNEY", "dev");
      return;
    }
    game.score = game.setpiece?.startScore ?? 120;
    if (game.setpiece) game.setpiece.cooldown = 1000000;
  };

  window.__purrkour.triggerSetpiece = () => {
    if (!game.setpiece) return;
    // Explicit request works with Progression + legacy
    game.setpiece.requestedMode = game.setpiece.mode || "ocean";
    game.setpiece.cooldown = 1000000;
    game.score = Math.max(game.score, game.setpiece.startScore);
  };

  window.__purrkour.enterBeat = (id) => {
    const api = game.progressionApi;
    if (api?.enterBeatById) api.enterBeatById(id, "dev");
  };

  window.speedUp = () => game.baseSpeed += 0.05;
  window.speedDown = () => game.baseSpeed -= 0.05;

  return { onKey };
}
