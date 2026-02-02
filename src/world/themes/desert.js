export const desertTheme = {
  key: "desert",
  label: "Wüste",

  birdVariant: "hawk",

  palette: {
    skyTop: [255, 205, 150],
    skyBot: [255, 245, 225],
    far: [165, 135, 120],
    forest: [185, 150, 110], // dunes
    grass: [210, 180, 130],
    ground: [198, 170, 118],
    groundAlpha: 0.44,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.03,
      ocean: 0.0001,
      night: 0.012 + night * 0.028,
      whoosh: 0.004,
      rumble: 0.004,
    });
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
