// src/world/themes/island.js
// Warm island / lagoon vibe (works with day-night overlay)

export const islandTheme = {
  key: "island",
  label: "insel",
  palette: {
    // sky
    skyTop: [140, 220, 255],
    skyBot: [245, 252, 255],

    // parallax silhouettes
    far: [70, 120, 150],
    forest: [40, 150, 120],

    // water (used by ocean setpiece)
    ocean: [40, 160, 210],

    // ground
    ground: [220, 205, 155],
    grass: [120, 190, 120],
  },

  ambience({ audio, night }) {
    // a bit of surf + mild wind (warmer at night)
    const n = Math.max(0, Math.min(1, night ?? 0));
    audio.setAmbience?.({
      surf: 0.22 + 0.18 * n,
      wind: 0.10 + 0.10 * n,
      forest: 0.03,
    });
  },
};
