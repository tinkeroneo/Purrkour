export const cityTheme = {
  key: "city",
  label: "City",


  birdVariant: "pigeon",
  palette: {
    skyTop: [175, 200, 255],
    skyBot: [245, 245, 255],
    far: [90, 95, 110],
    forest: [75, 85, 105], // skyline tint
    ground: [95, 105, 120],
  },

  ambience({ audio, night }) {
    const air = (band === "air") ? 1 : 0;
    audio.setAmbience({
      wind: (0.008 + air*0.03),
      ocean: 0.0001,
      night: 0.015 + night * 0.04,
      whoosh: (0.010 + air*0.08),
      rumble: 0.012,
    });
  },

  drawBackground(bg, ctx) {
    bg.drawSky(ctx);
    bg.drawParallax(ctx);
    bg.drawCityHints?.(ctx);
  },

  zones: {
    ground: { fence: 1.05, dog: 1.10, bird: 0.70, yarn: 0.95, mouse: 1.00, fish: 1.00, catnip: 1.00 },
    mid:    { fence: 0.50, dog: 0.25, bird: 1.30, yarn: 0.45, mouse: 1.05, fish: 1.05, catnip: 1.05 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.35, yarn: 0.00, mouse: 0.90, fish: 0.90, catnip: 0.90 },
  },

  spawns: {
    fence: 1.05,
    dog: 1.00,
    bird: 1.10,
    yarn: 0.95,
    mouse: 1.00,
    fish: 1.05,
    catnip: 0.95,
  },
};
