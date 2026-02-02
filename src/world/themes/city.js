export const cityTheme = {
  key: "city",
  label: "City",

  birdVariant: "pigeon",

  palette: {
    skyTop: [165, 205, 235],
    skyBot: [235, 245, 252],
    far: [55, 70, 90],      // skyline
    forest: [85, 100, 120], // mid buildings
    ground: [80, 85, 95],
    groundAlpha: 0.52,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.02,
      ocean: 0.0001,
      night: 0.02 + night * 0.04,
      whoosh: 0.004,
      rumble: 0.012,
    });
  },

  zones: {
    ground: { fence: 1.10, dog: 0.85, bird: 0.80, yarn: 0.90, mouse: 1.10, fish: 0.80, catnip: 0.90 },
    mid:    { fence: 0.65, dog: 0.15, bird: 1.20, yarn: 0.45, mouse: 1.15, fish: 0.85, catnip: 0.95 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.35, yarn: 0.00, mouse: 0.95, fish: 0.75, catnip: 0.80 },
  },

  spawns: {
    fence: 1.10,
    dog: 0.80,
    bird: 0.95,
    yarn: 0.90,
    mouse: 1.10,
    fish: 0.80,
    catnip: 0.90,
  },
};
