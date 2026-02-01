// src/world/themes/mountain.js
// Crisp mountain vibe

export const mountainTheme = {
  key: "mountain",
  label: "berge",


  birdVariant: "eagle",
  palette: {
    skyTop: [150, 210, 255],
    skyBot: [235, 245, 255],
    far: [75, 90, 115],
    forest: [70, 120, 110], // pines
    ground: [140, 170, 140],
  },

  ambience({ audio, night, tau, band }) {
    const n = Math.max(0, Math.min(1, night ?? 0));
    audio.setAmbience?.({
      wind: (0.06 + air*0.03) + 0.05 * n,
      ocean: 0.0001,
      night: 0.02 + 0.03 * n,
      whoosh: (0.0001 + air*0.08),
      rumble: 0.0001,
      tau: tau ?? 0.12,
    });
  },

  zones: {
    ground: { fence: 1.10, dog: 0.95, bird: 0.85, yarn: 1.00, mouse: 1.00, fish: 1.00, catnip: 1.00 },
    mid:    { fence: 0.65, dog: 0.25, bird: 1.25, yarn: 0.55, mouse: 1.05, fish: 1.05, catnip: 1.05 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.45, yarn: 0.00, mouse: 0.90, fish: 0.90, catnip: 0.90 },
  },

  spawns: {
    fence: 1.10,
    dog: 0.75,
    bird: 0.95,
    yarn: 1.05,
    mouse: 0.95,
    fish: 1.00,
    catnip: 1.05,
  },
};
