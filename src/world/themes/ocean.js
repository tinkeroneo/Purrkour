export const oceanTheme = {
  key: "ocean",
  label: "Ozean",

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
