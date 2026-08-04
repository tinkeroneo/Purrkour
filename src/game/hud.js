export function createHUD(ui) {
  let biomeLabel = "wald";
  let lastScore;
  let lastLives;
  let lastMice;
  let lastSpeed;
  let lastTheme;
  let lastPaused;

  function setBiome(label) {
    biomeLabel = label;
    if (ui.biome) ui.biome.textContent = label;
  }

  function sync(game, cat) {
    const score = String(game.score);
    if (ui.score && score !== lastScore) {
      ui.score.textContent = score;
      lastScore = score;
    }

    const maxLives = game.maxLives ?? 7;
    const curLives = Math.max(0, Math.min(maxLives, game.lives));
    const livesKey = `${curLives}/${maxLives}`;
    if (ui.lives && livesKey !== lastLives) {
      let html = "";
      for (let i = 0; i < maxLives; i++) {
        const off = (i >= curLives) ? " off" : "";
        html += `<span class="heart${off}">❤️</span>`;
      }
      ui.lives.innerHTML = html;
      ui.lives.setAttribute("aria-label", `${curLives} von ${maxLives} Leben`);
      lastLives = livesKey;
    }

    const mice = `🐭 × ${game.mice}`;
    if (ui.miceDisplay && mice !== lastMice) {
      ui.miceDisplay.textContent = mice;
      lastMice = mice;
    }

    const speed = `Pace ${(game.progressionSpeedMul ?? 1.0).toFixed(1)}x`;
    if (ui.speedBtn && speed !== lastSpeed) {
      ui.speedBtn.textContent = speed;
      lastSpeed = speed;
    }

    // Debug/info slot (was catnip status): show current theme key
    const theme = String(game.theme || "");
    if (ui.catnip && theme !== lastTheme) {
      ui.catnip.textContent = theme;
      lastTheme = theme;
    }

    // Rest/Pause button (optional)
    if (ui.restBtn) {
      const paused = !!game.pause?.active;
      if (paused !== lastPaused) {
        ui.restBtn.textContent = paused ? "▶" : "🏠";
        ui.restBtn.title = paused ? "Weiterspielen" : "Zur Hütte (Pause)";
        ui.restBtn.setAttribute("aria-label", paused ? "Weiterspielen" : "Pause an der Hütte");
        ui.restBtn.setAttribute("aria-pressed", String(paused));
        lastPaused = paused;
      }
    }

    // Optional (can be removed from index.html without breaking)
    if (ui.jumpsMax) ui.jumpsMax.textContent = String(cat.maxJumps);
    if (ui.jumps) ui.jumps.textContent = String(cat.jumpsLeft);
    if (ui.biome) ui.biome.textContent = biomeLabel;
  }

  return { setBiome, sync };
}

