export const oceanTheme = {
  key: "ocean",
  label: "Ozean",


  birdVariant: "seagull",
  palette: {
    skyTop: [140, 200, 240],
    skyBot: [210, 235, 255],
    far: [70, 110, 160],
    forest: [90, 130, 140], // cliffs / coast
    ground: [160, 190, 200], // Küste
  },

  ambience({ audio }) {
    audio.setAmbience({
      wind: 0.05,
      ocean: 0.12,
      night: 0.0001,
      whoosh: 0.018,
      rumble: 0.010,
    });
  },

  drawBackground(bg, ctx) {
    bg.drawSky(ctx);
    bg.drawParallax(ctx);
    bg.drawOcean?.(ctx); // optional hook
  },

  zones: {
    ground: { fence: 0.95, dog: 0.70, bird: 0.95, yarn: 0.95, mouse: 1.05, fish: 1.10, catnip: 1.00 },
    mid:    { fence: 0.35, dog: 0.15, bird: 1.55, yarn: 0.35, mouse: 1.10, fish: 1.10, catnip: 1.05 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.40, yarn: 0.00, mouse: 0.95, fish: 0.95, catnip: 0.95 },
  },

  spawns: {
    fence: 0.95,
    dog: 0.80,
    bird: 1.05,
    yarn: 0.95,
    mouse: 0.95,
    fish: 1.20,
    catnip: 0.95,
  },

};
