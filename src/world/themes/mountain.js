export const mountainTheme = {
  key: "mountain",
  label: "Berge",

  birdVariant: "eagle",

  palette: {
    skyTop: [150, 205, 255],
    skyBot: [240, 250, 255],
    far: [90, 105, 125],     // rock silhouettes
    forest: [90, 140, 120],  // alpine trees
    grass: [105, 165, 140],
    ground: [110, 120, 130], // gravel
    groundAlpha: 0.48,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.05,
      ocean: 0.0001,
      night: 0.02 + night * 0.03,
      whoosh: 0.004,
      rumble: 0.006,
    });
  },

  zones: {
    ground: { fence: 1.10, dog: 1.05, bird: 0.80, yarn: 1.00, mouse: 0.95, fish: 0.95, catnip: 1.00 },
    mid:    { fence: 0.55, dog: 0.25, bird: 1.35, yarn: 0.55, mouse: 1.00, fish: 1.00, catnip: 1.00 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.45, yarn: 0.00, mouse: 0.90, fish: 0.90, catnip: 0.90 },
  },

  spawns: {
    fence: 1.05,
    dog: 1.05,
    bird: 1.10,
    yarn: 0.95,
    mouse: 0.95,
    fish: 0.90,
    catnip: 0.95,
  },
};
