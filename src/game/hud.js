export function createHUD(ui) {
  let biomeLabel = "wald";

  function setBiome(label) {
    biomeLabel = label;
    if (ui.biome) ui.biome.textContent = label;
  }

  function sync(game, cat) {
    if (ui.score) ui.score.textContent = String(game.score);
    if (ui.lives) ui.lives.textContent = "❤️".repeat(Math.max(0, game.lives));
    if (ui.miceDisplay) ui.miceDisplay.textContent = `🐭 × ${game.mice}`;

    if (ui.speedBtn) ui.speedBtn.textContent = `${(game.speedMul ?? 1.0).toFixed(1)}x`;

    // Debug/info slot (was catnip status): show current theme key
    if (ui.catnip) ui.catnip.textContent = String(game.theme || "");

    // Rest/Pause button (optional)
    if (ui.restBtn) {
      const paused = !!game.pause?.active;
      ui.restBtn.textContent = paused ? "▶" : "🏠";
      ui.restBtn.title = paused ? "Weiterspielen" : "Zur Hütte (Pause)";
    }

    // Optional (can be removed from index.html without breaking)
    if (ui.jumpsMax) ui.jumpsMax.textContent = String(cat.maxJumps);
    if (ui.jumps) ui.jumps.textContent = String(cat.jumpsLeft);
    if (ui.biome) ui.biome.textContent = biomeLabel;
  }

  return { setBiome, sync };
}
