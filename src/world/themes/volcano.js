export const volcanoTheme = {
  key: "volcano",
  label: "Vulkan",

  birdVariant: "hawk",

  palette: {
    skyTop: [32, 24, 34],
    skyBot: [132, 55, 42],
    far: [57, 46, 52],
    forest: [78, 55, 55],
    grass: [255, 119, 48],
    ocean: [238, 67, 24],
    ground: [50, 45, 49],
    groundAlpha: 0.88,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.018,
      ocean: 0.0001,
      night: 0.01 + night * 0.018,
      whoosh: 0.0001,
      rumble: 0.055,
      engine: 0.0001,
    });
  },

  zones: {
    ground: { fence: 1.20, dog: 0.70, bird: 0.70, yarn: 1.35, mouse: 0.90, fish: 0.75, catnip: 0.85 },
    mid:    { fence: 0.72, dog: 0.18, bird: 1.25, yarn: 0.72, mouse: 1.00, fish: 0.80, catnip: 0.90 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.45, yarn: 0.00, mouse: 0.85, fish: 0.70, catnip: 0.80 },
  },

  spawns: {
    fence: 1.20,
    dog: 0.65,
    bird: 0.90,
    yarn: 1.30,
    mouse: 0.90,
    fish: 0.75,
    catnip: 0.85,
  },
};
