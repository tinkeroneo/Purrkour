import { getFlowProgress } from "./flow.js";

export function createHUD(ui) {
  let biomeLabel = "wald";
  let lastScore;
  let lastLives;
  let lastMice;
  let lastSpeed;
  let lastTheme;
  let lastPaused;
  let lastFlow;
  let lastJourney;

  const themeLabels = {
    forest: "Wald",
    ocean: "Ozean",
    island: "Insel",
    mars: "Mars",
    mountain: "Berge",
    jungle: "Dschungel",
    cliff: "Klippen",
    city: "Stadt",
    desert: "Wüste",
  };

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

    const flow = game.flow || {};
    const flowPercent = Math.round(getFlowProgress(flow) * 40) * 2.5;
    const flowKey = `${flow.count || 0}/${flow.multiplier || 1}/${flow.best || 0}/${flowPercent}`;
    if (flowKey !== lastFlow) {
      const multiplier = flow.multiplier || 1;
      if (ui.flowValue) ui.flowValue.textContent = `Flow x${multiplier}`;
      if (ui.flowFill?.style) ui.flowFill.style.width = `${flowPercent}%`;
      ui.flowDisplay?.classList?.toggle("is-active", multiplier > 1);
      ui.flowDisplay?.setAttribute?.(
        "aria-label",
        `Flow x${multiplier}, Kette ${flow.count || 0}, beste Kette ${flow.best || 0}`,
      );
      lastFlow = flowKey;
    }

    const beatLabel = game.progression?.beatLabel || themeLabels[game.theme] || "Reise";
    const beatPercent = Math.round(Math.max(0, Math.min(1, game.progression?.beatProgress || 0)) * 100);
    const journeyKey = `${beatLabel}/${beatPercent}`;
    if (journeyKey !== lastJourney) {
      if (ui.journeyLabel) ui.journeyLabel.textContent = beatLabel;
      if (ui.journeyFill?.style) ui.journeyFill.style.width = `${beatPercent}%`;
      ui.journeyProgress?.setAttribute?.("aria-valuenow", String(beatPercent));
      ui.journeyProgress?.setAttribute?.("aria-label", `${beatLabel}: ${beatPercent} Prozent`);
      lastJourney = journeyKey;
    }

    const speed = `Pace ${(game.progressionSpeedMul ?? 1.0).toFixed(1)}x`;
    if (ui.speedBtn && speed !== lastSpeed) {
      ui.speedBtn.textContent = speed;
      lastSpeed = speed;
    }

    // Debug/info slot (was catnip status): show current theme key
    const theme = themeLabels[game.theme] || String(game.theme || "");
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

