export const jungleTheme = {
  key: "jungle",
  label: "Dschungel",

  birdVariant: "parrot",

  palette: {
    skyTop: [120, 210, 255],
    skyBot: [215, 250, 255],
    far: [22, 92, 110],
    forest: [18, 140, 92],
    grass: [42, 175, 110],
    ground: [44, 130, 86],
    groundAlpha: 0.50,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.02,
      ocean: 0.0001,
      night: 0.02 + night * 0.035,
      whoosh: 0.001,
      rumble: 0.0001,
    });
  },

  zones: {
    ground: { fence: 1.05, dog: 1.00, bird: 0.85, yarn: 1.05, mouse: 1.05, fish: 1.00, catnip: 1.10 },
    mid:    { fence: 0.55, dog: 0.25, bird: 1.45, yarn: 0.55, mouse: 1.10, fish: 1.05, catnip: 1.10 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.45, yarn: 0.00, mouse: 0.95, fish: 0.95, catnip: 0.95 },
  },

  spawns: {
    fence: 0.95,
    dog: 1.05,
    bird: 1.15,
    yarn: 1.05,
    mouse: 1.05,
    fish: 0.95,
    catnip: 1.05,
  },
};
