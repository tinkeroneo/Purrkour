export const forestTheme = {
  key: "forest",
  label: "Wald",

  time: { mode: "cycle", speed: 0.00014 },

  palette: {
    skyTop: [160, 220, 255],
    skyBot: [240, 252, 255],
    far: [55, 85, 125],
    forest: [35, 120, 80],
    ground: [78, 155, 88],
  },

  ambience({ audio, night, tau }) {
    audio.setAmbience({
      wind: 0.03,
      ocean: 0.0001,
      night: 0.02 + night * 0.03,
      whoosh: 0.0001,
      rumble: 0.0001,
    });
  },

  // draw hooks (optional)
  drawBackground(bg, ctx) {
    bg.drawSky(ctx);
    bg.drawParallax(ctx);
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
