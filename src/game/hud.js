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
    if (ui.catnip) ui.catnip.textContent = (game.catnipTimer > 0) ? "an" : "aus";

    // Optional (can be removed from index.html without breaking)
    if (ui.jumpsMax) ui.jumpsMax.textContent = String(cat.maxJumps);
    if (ui.jumps) ui.jumps.textContent = String(cat.jumpsLeft);
    if (ui.biome) ui.biome.textContent = biomeLabel;
  }

  return { setBiome, sync };
}
