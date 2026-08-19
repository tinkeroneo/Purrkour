const PHASE_TUNING = Object.freeze({
  establish: Object.freeze({ gap: 1.18, stair: 0.75, close: 0.25, pressure: 0.62, tunnel: 0 }),
  flow: Object.freeze({ gap: 1, stair: 1, close: 0.75, pressure: 0.9, tunnel: 0.65 }),
  variation: Object.freeze({ gap: 0.96, stair: 1.35, close: 1.1, pressure: 1, tunnel: 1 }),
  challenge: Object.freeze({ gap: 0.84, stair: 1.45, close: 2, pressure: 1.22, tunnel: 1.35 }),
  release: Object.freeze({ gap: 1.28, stair: 0.7, close: 0, pressure: 0.52, tunnel: 0 }),
  exit: Object.freeze({ gap: 1.08, stair: 0.9, close: 0.55, pressure: 0.78, tunnel: 0.45 }),
});

export const WORLD_GAMEPLAY_MOTIFS = Object.freeze({
  forest: Object.freeze({ label: "Rhythmuspfad", gap: 1, stair: 1, close: 0.8, weights: Object.freeze({ fence: 1.35, dog: 1, bird: 0.65, yarn: 0.8, tunnel: 0 }) }),
  island: Object.freeze({ label: "Weite Strandbögen", gap: 1.1, stair: 0.9, close: 0.65, weights: Object.freeze({ fence: 0.9, dog: 0.7, bird: 1.25, yarn: 0.85, tunnel: 0 }) }),
  mars: Object.freeze({ label: "Lange Niedriggravitätslinien", gap: 1.08, stair: 1.45, close: 0.55, weights: Object.freeze({ fence: 1.2, dog: 0, bird: 1.35, yarn: 1.2, tunnel: 0 }) }),
  mountain: Object.freeze({ label: "Vertikale Gipfelfolge", gap: 1.02, stair: 1.55, close: 0.8, weights: Object.freeze({ fence: 1.2, dog: 1.15, bird: 1.2, yarn: 0.7, tunnel: 0 }) }),
  jungle: Object.freeze({ label: "Dichte Wechselreaktionen", gap: 0.92, stair: 1.2, close: 1.45, weights: Object.freeze({ fence: 0.85, dog: 1.45, bird: 1.3, yarn: 0.8, tunnel: 0 }) }),
  cliff: Object.freeze({ label: "Kanten und Höhenwechsel", gap: 0.95, stair: 1.7, close: 1.1, weights: Object.freeze({ fence: 1.25, dog: 1.3, bird: 1.35, yarn: 0.65, tunnel: 0 }) }),
  city: Object.freeze({ label: "Ducken zwischen Dachlinien", gap: 0.84, stair: 0.8, close: 1.8, weights: Object.freeze({ fence: 0.7, dog: 1.7, bird: 0.85, yarn: 0.65, tunnel: 1.2 }) }),
  desert: Object.freeze({ label: "Weite Sprünge im schweren Sand", gap: 1.05, stair: 0.85, close: 1.25, weights: Object.freeze({ fence: 0.9, dog: 1.35, bird: 0.8, yarn: 1.45, tunnel: 0.25 }) }),
});

const BEAT_MOTIF_OVERRIDES = Object.freeze({
  sightlines: Object.freeze({
    label: "Nacht-Sichtlinien",
    gap: 1.18,
    stair: 0.62,
    close: 0.5,
    weights: Object.freeze({ fence: 0.72, dog: 0.55, bird: 1.55, yarn: 0.62, tunnel: 0 }),
  }),
});

export const WORLD_SIGNATURE_MOMENTS = Object.freeze({
  forest: Object.freeze({ id: "fallen-branch", phase: "variation", spacing: 500 }),
  jungle: Object.freeze({ id: "canopy-crossing", phase: "variation", spacing: 540 }),
  cliff: Object.freeze({ id: "summit-stair", phase: "challenge", spacing: 620 }),
  city: Object.freeze({ id: "under-over", phase: "challenge", spacing: 560 }),
  desert: Object.freeze({ id: "scorpion-slalom", phase: "variation", spacing: 600 }),
});

export function getSignatureMoment(themeKey, phase) {
  const moment = WORLD_SIGNATURE_MOMENTS[themeKey];
  return moment?.phase === phase ? moment : null;
}

export function getSectionPhase(progress) {
  const u = Math.max(0, Math.min(1, progress ?? 0));
  if (u < 0.13) return "establish";
  if (u < 0.38) return "flow";
  if (u < 0.62) return "variation";
  if (u < 0.82) return "challenge";
  if (u < 0.93) return "release";
  return "exit";
}

export function getGameplayMotif(themeKey, phase = "flow", beatMotif = null) {
  const world = BEAT_MOTIF_OVERRIDES[beatMotif]
    || WORLD_GAMEPLAY_MOTIFS[themeKey]
    || WORLD_GAMEPLAY_MOTIFS.forest;
  const section = PHASE_TUNING[phase] || PHASE_TUNING.flow;
  return {
    label: world.label,
    gapMul: world.gap * section.gap,
    stairMul: world.stair * section.stair,
    closeMul: world.close * section.close,
    weights: {
      fence: world.weights.fence * section.pressure,
      dog: world.weights.dog * section.pressure,
      bird: world.weights.bird * section.pressure,
      yarn: world.weights.yarn * section.pressure,
      tunnel: world.weights.tunnel * section.tunnel,
    },
  };
}
