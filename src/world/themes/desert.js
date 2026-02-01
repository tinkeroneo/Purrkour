export const desertTheme = {
  key: "desert",
  label: "Wüste",


  birdVariant: "hawk",
  palette: {
    skyTop: [255, 205, 150],
    skyBot: [255, 245, 220],
    far: [150, 130, 120],
    forest: [170, 145, 110], // dunes
    ground: [190, 165, 115],
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.030,
      ocean: 0.0001,
      night: 0.012 + night * 0.028,
      whoosh: 0.004,
      rumble: 0.004,
    });
  },

  drawBackground(bg, ctx) {
    bg.drawSky(ctx);
    bg.drawParallax(ctx);
    bg.drawHeatHaze?.(ctx);
  },

  zones: {
    ground: { fence: 1.05, dog: 0.90, bird: 0.85, yarn: 1.05, mouse: 1.00, fish: 0.95, catnip: 1.10 },
    mid:    { fence: 0.55, dog: 0.20, bird: 1.25, yarn: 0.55, mouse: 1.05, fish: 1.00, catnip: 1.10 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.40, yarn: 0.00, mouse: 0.90, fish: 0.90, catnip: 0.95 },
  },

  spawns: {
    fence: 0.90,
    dog: 0.85,
    bird: 1.20,
    yarn: 0.95,
    mouse: 0.95,
    fish: 0.90,
    catnip: 1.15,
  },
};
