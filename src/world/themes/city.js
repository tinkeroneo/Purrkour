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
    audio.setAmbience({
      wind: 0.008,
      ocean: 0.0001,
      night: 0.015 + night * 0.04,
      whoosh: 0.010,
      rumble: 0.012,
    });
  },

  drawBackground(bg, ctx) {
    bg.drawSky(ctx);
    bg.drawParallax(ctx);
    bg.drawCityHints?.(ctx);
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
