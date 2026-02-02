export const islandTheme = {
  key: "island",
  label: "Insel",

  birdVariant: "seagull",

  palette: {
    skyTop: [135, 220, 255],
    skyBot: [245, 252, 255],
    far: [70, 130, 165],
    forest: [35, 150, 110], // palms
    grass: [70, 185, 140],
    ocean: [25, 145, 190],
    ground: [190, 175, 130], // sand
    groundAlpha: 0.44,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.02,
      ocean: 0.06,
      night: 0.01 + night * 0.02,
      whoosh: 0.002,
      rumble: 0.0001,
    });
  },

  zones: {
    ground: { fence: 0.95, dog: 0.85, bird: 0.85, yarn: 1.05, mouse: 1.00, fish: 1.10, catnip: 1.05 },
    mid:    { fence: 0.50, dog: 0.15, bird: 1.30, yarn: 0.55, mouse: 1.05, fish: 1.15, catnip: 1.10 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.40, yarn: 0.00, mouse: 0.90, fish: 1.05, catnip: 0.95 },
  },

  spawns: {
    fence: 0.90,
    dog: 0.75,
    bird: 1.10,
    yarn: 1.00,
    mouse: 1.00,
    fish: 1.20,
    catnip: 1.05,
  },
};
