export const jungleTheme = {
  key: "jungle",
  label: "Urwald",


  birdVariant: "parrot",
  palette: {
    skyTop: [120, 210, 255],
    skyBot: [230, 250, 240],
    far: [50, 80, 105],
    forest: [25, 110, 70],
    ground: [70, 140, 75],
  },

  ambience({ audio, night }) {
    const air = (band === "air") ? 1 : 0;
    audio.setAmbience({
      wind: (0.012 + air*0.03),
      ocean: 0.0001,
      night: 0.03 + night * 0.06,
      whoosh: (0.0001 + air*0.08),
      rumble: 0.006,
    });
  },

  drawBackground(bg, ctx) {
    bg.drawSky(ctx);
    bg.drawParallax(ctx);
  },

  zones: {
    ground: { fence: 1.10, dog: 0.95, bird: 0.80, yarn: 1.00, mouse: 1.05, fish: 1.00, catnip: 1.05 },
    mid:    { fence: 0.55, dog: 0.20, bird: 1.35, yarn: 0.50, mouse: 1.10, fish: 1.05, catnip: 1.10 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.35, yarn: 0.00, mouse: 0.95, fish: 0.95, catnip: 0.95 },
  },

  spawns: {
    fence: 0.95,
    dog: 0.90,
    bird: 1.15,
    yarn: 1.05,
    mouse: 1.05,
    fish: 0.95,
    catnip: 1.10,
  },
};
