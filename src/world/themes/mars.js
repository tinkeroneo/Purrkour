export const marsTheme = {
  key: "mars",
  label: "Mars",

  // Use existing bird sprite as a "drone" vibe for now
  birdVariant: "drone",

  palette: {
    // warm dusty sky
    skyTop: [235, 140, 110],
    skyBot: [92, 34, 48],

    // silhouettes / mid layer tint
    far: [135, 70, 78],
    forest: [170, 92, 72],

    // ground tint (used by terrain draw)
    ground: [196, 98, 62],
  },

  ambience({ audio, night }) {
    // dry wind + subtle night shimmer
    audio.setAmbience({
      wind: 0.05,
      ocean: 0.0001,
      night: 0.02 + night * 0.04,
      whoosh: 0.0001,
    });
  },

  // Spawn weights: fewer animals, more "terrain" + yarn + collectibles
  // (Values are multipliers; spawn.js combines them with baseline probabilities.)
  spawns: {
    fence: 0.95,
    dog: 0.00,
    bird: 0.55,
    yarn: 1.05,
    mouse: 0.65,
    fish: 0.55,
    catnip: 0.60,
    heart: 0.70,
    car: 0.00,
  },

  // Vertical band modifiers (optional – keep gentle)
  band: {
    ground: { fence: 1.00, dog: 0.00, bird: 0.55, yarn: 1.10, mouse: 0.70, fish: 0.60, catnip: 0.65, heart: 0.70, car: 0.00 },
    mid:    { fence: 0.55, dog: 0.00, bird: 0.95, yarn: 0.45, mouse: 0.70, fish: 0.65, catnip: 0.70, heart: 0.70, car: 0.00 },
    air:    { fence: 0.00, dog: 0.00, bird: 0.40, yarn: 0.00, mouse: 0.55, fish: 0.50, catnip: 0.55, heart: 0.60, car: 0.00 },
  },
};
