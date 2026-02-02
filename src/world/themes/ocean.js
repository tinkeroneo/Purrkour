export const oceanTheme = {
  key: "ocean",
  label: "Ozean",

  birdVariant: "seagull",

  palette: {
    skyTop: [110, 205, 255],
    skyBot: [235, 252, 255],
    far: [55, 120, 170],
    forest: [40, 150, 170],
    ocean: [25, 140, 200],
    ground: [70, 135, 160],
    groundAlpha: 0.40,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.03,
      ocean: 0.10,
      night: 0.01 + night * 0.02,
      whoosh: 0.003,
      rumble: 0.0001,
    });
  },

  zones: {
    ground: { fence: 0.35, dog: 0.00, bird: 0.85, yarn: 0.65, mouse: 0.95, fish: 1.25, catnip: 0.85 },
    mid:    { fence: 0.15, dog: 0.00, bird: 1.25, yarn: 0.35, mouse: 1.00, fish: 1.35, catnip: 0.90 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.45, yarn: 0.00, mouse: 0.85, fish: 1.15, catnip: 0.80 },
  },

  spawns: {
    fence: 0.30,
    dog: 0.00,
    bird: 1.15,
    yarn: 0.70,
    mouse: 0.90,
    fish: 1.30,
    catnip: 0.85,
  },
};
