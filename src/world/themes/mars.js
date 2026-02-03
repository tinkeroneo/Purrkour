export const marsTheme = {
  key: "mars",
  label: "Mars",

  birdVariant: "drone",

  // Mars as a landing zone: muted sky, dark pad silhouettes, dusty ground.
  palette: {
    skyTop: [10, 14, 28],
    skyBot: [38, 20, 55],

    // far silhouettes / horizon
    far: [95, 52, 64],
    forest: [120, 70, 66],

    // little accent for markings / rocks
    grass: [165, 120, 110],

    // landing pad / regolith mix
    ground: [122, 96, 92],
    groundAlpha: 0.52,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.05,
      ocean: 0.0001,
      night: 0.02 + night * 0.04,
      whoosh: 0.0001,
      rumble: 0.002,
    });
  },

  zones: {
    // fewer dogs, more controlled “platform” birds
    ground: { fence: 1.05, dog: 0.0, bird: 0.70, yarn: 1.10, mouse: 0.75, fish: 0.60, catnip: 0.70 },
    mid:    { fence: 0.55, dog: 0.0, bird: 1.10, yarn: 0.55, mouse: 0.80, fish: 0.70, catnip: 0.75 },
    air:    { fence: 0.00, dog: 0.0, bird: 0.50, yarn: 0.00, mouse: 0.65, fish: 0.55, catnip: 0.60 },
  },

  spawns: {
    fence: 0.95,
    dog: 0.0,
    bird: 0.85,
    yarn: 1.10,
    mouse: 0.75,
    fish: 0.60,
    catnip: 0.70,
  },
};
