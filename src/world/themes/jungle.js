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
    audio.setAmbience({
      wind: 0.012,
      ocean: 0.0001,
      night: 0.03 + night * 0.06,
      whoosh: 0.0001,
      rumble: 0.006,
    });
  },

  drawBackground(bg, ctx) {
    bg.drawSky(ctx);
    bg.drawParallax(ctx);
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
