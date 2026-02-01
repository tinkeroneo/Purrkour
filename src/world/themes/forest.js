export const forestTheme = {
  key: "forest",
  label: "Wald",


  birdVariant: "crow",
  palette: {
    skyTop: [160, 220, 255],
    skyBot: [240, 252, 255],
    far: [55, 85, 125],
    forest: [35, 120, 80],
    ground: [78, 155, 88],
  },

  ambience({ audio, night, tau, band }) {
    const air = (band === "air") ? 1 : 0;
    audio.setAmbience({
      wind: (0.03 + air*0.03),
      ocean: 0.0001,
      night: 0.02 + night * 0.03,
      whoosh: (0.0001 + air*0.08),
      rumble: 0.0001,
    });
  },

  // draw hooks (optional)
  drawBackground(bg, ctx) {
    bg.drawSky(ctx);
    bg.drawParallax(ctx);
  },

  zones: {
    ground: { fence: 1.15, dog: 1.00, bird: 0.75, yarn: 1.00, mouse: 1.00, fish: 1.00, catnip: 1.00 },
    mid:    { fence: 0.55, dog: 0.25, bird: 1.35, yarn: 0.45, mouse: 1.05, fish: 1.05, catnip: 1.05 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.35, yarn: 0.00, mouse: 0.90, fish: 0.90, catnip: 0.90 },
  },

  spawns: {
    fence: 1.00,
    dog: 1.00,
    bird: 1.00,
    yarn: 1.00,
    mouse: 1.00,
    fish: 1.00,
    catnip: 1.00,
  },

};
