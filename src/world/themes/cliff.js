export const cliffTheme = {
  key: "cliff",
  label: "Klippen",

  birdVariant: "eagle",

  // “Vertical” feeling via palette + spawn weighting: more mid/air action.
  palette: {
    skyTop: [135, 195, 245],
    skyBot: [235, 248, 255],
    far: [62, 78, 98],       // canyon walls
    forest: [92, 108, 120],  // mid cliffs
    grass: [130, 150, 155],  // highlights
    ground: [88, 96, 104],   // stone
    groundAlpha: 0.50,
  },

  ambience({ audio, night }) {
    audio.setAmbience({
      wind: 0.055,
      ocean: 0.0001,
      night: 0.018 + night * 0.03,
      whoosh: 0.006,
      rumble: 0.006,
    });
  },

  zones: {
    ground: { fence: 0.85, dog: 0.80, bird: 0.95, yarn: 0.95, mouse: 0.95, fish: 0.85, catnip: 0.90 },
    mid:    { fence: 0.55, dog: 0.20, bird: 1.70, yarn: 0.55, mouse: 1.10, fish: 0.95, catnip: 1.00 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.75, yarn: 0.00, mouse: 1.05, fish: 0.90, catnip: 0.95 },
  },

  spawns: {
    fence: 0.90,
    dog: 0.85,
    bird: 1.25,
    yarn: 0.95,
    mouse: 1.05,
    fish: 0.85,
    catnip: 0.95,
  },
};
