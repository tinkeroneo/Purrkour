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
