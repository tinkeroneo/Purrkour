const PROFILES = {
  forest: { root: 293.66, notes: [0, 4, 7, 2], step: 0.34, gap: 7.4, brightness: 1250, wave: "triangle" },
  ocean: { root: 220.00, notes: [0, 7, 4, 9], step: 0.48, gap: 8.6, brightness: 1050, wave: "sine" },
  island: { root: 261.63, notes: [0, 9, 7, 4], step: 0.32, gap: 7.0, brightness: 1450, wave: "triangle" },
  mars: { root: 146.83, notes: [0, 3, 10, 7], step: 0.44, gap: 8.0, brightness: 850, wave: "sine" },
  mountain: { root: 196.00, notes: [0, 7, 12, 4], step: 0.42, gap: 8.2, brightness: 1100, wave: "triangle" },
  jungle: { root: 164.81, notes: [0, 7, 3, 10], step: 0.28, gap: 6.6, brightness: 1350, wave: "triangle" },
  cliff: { root: 174.61, notes: [0, 7, 14, 10], step: 0.46, gap: 8.4, brightness: 1200, wave: "triangle" },
  city: { root: 207.65, notes: [0, 3, 7, 5], step: 0.26, gap: 6.4, brightness: 950, wave: "triangle" },
  desert: { root: 185.00, notes: [0, 1, 7, 5], step: 0.40, gap: 8.1, brightness: 1000, wave: "triangle" },
};

export const SOUND_SCORE_THEMES = Object.freeze(Object.keys(PROFILES));

export function getSoundScoreProfile(theme, mode = null) {
  const key = mode === "rocket" ? "mars" : mode === "ocean" ? "ocean" : theme;
  return { key: PROFILES[key] ? key : "forest", ...(PROFILES[key] || PROFILES.forest) };
}

export function frequencyForSemitone(root, semitone, night = 0) {
  const octaveShift = Number(night) > 0.7 ? -12 : 0;
  return root * (2 ** ((semitone + octaveShift) / 12));
}

export function motifGap(profile, intensity = 0) {
  const active = Math.max(0, Math.min(1, Number(intensity) || 0));
  return Math.max(4.8, profile.gap - active * 1.4);
}
