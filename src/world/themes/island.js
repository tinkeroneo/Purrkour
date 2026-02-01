// src/world/themes/island.js
// Warm island / lagoon vibe (works with day-night overlay)

export const islandTheme = {
  key: "island",
  label: "insel",

  birdVariant: "seagull",
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

  ambience({ audio, night, tau }) {
    const n = Math.max(0, Math.min(1, night ?? 0));
    audio.setAmbience?.({
      wind: 0.05 + 0.04 * n,
      ocean: 0.18 + 0.16 * n,
      night: 0.02 + 0.04 * n,
      whoosh: 0.0001,
      rumble: 0.0001,
      tau: tau ?? 0.12,
    });
  },

  spawns: {
    fence: 0.95,
    dog: 0.85,
    bird: 1.05,
    yarn: 1.00,
    mouse: 1.05,
    fish: 1.10,
    catnip: 1.05,
  },
};
