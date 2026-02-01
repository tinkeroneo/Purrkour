export const forestTheme = {
  key: "forest",
  label: "Wald",

  palette: {
    skyTop: [160, 220, 255],
    skyBot: [240, 252, 255],
    far: [55, 85, 125],
    forest: [35, 120, 80],
    ground: [78, 155, 88],
  },

  ambience({ audio, night }) {
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
};
