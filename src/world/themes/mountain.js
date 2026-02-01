// src/world/themes/mountain.js
// Crisp mountain vibe

export const mountainTheme = {
  key: "mountain",
  label: "berge",

  // eher später Nachmittag / Dusk
  time: { mode: "fixed", night: 0.55 },

  palette: {
    skyTop: [150, 210, 255],
    skyBot: [235, 245, 255],
    far: [75, 90, 115],
    forest: [70, 120, 110], // pines
    ground: [140, 170, 140],
  },

  ambience({ audio, night, tau }) {
    const n = Math.max(0, Math.min(1, night ?? 0));
    audio.setAmbience?.({
      wind: 0.06 + 0.05 * n,
      ocean: 0.0001,
      night: 0.02 + 0.03 * n,
      whoosh: 0.0001,
      rumble: 0.0001,
      tau: tau ?? 0.12,
    });
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
