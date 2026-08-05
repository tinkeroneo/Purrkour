const DEFAULT_TIMING = Object.freeze({ enter: 18, hold: 66, exit: 26 });
const REDUCED_TIMING = Object.freeze({ enter: 1, hold: 42, exit: 1 });

function positiveFrames(value, fallback) {
  const frames = Math.floor(Number(value));
  return Number.isFinite(frames) && frames >= 0 ? frames : fallback;
}

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

export function createPresentationState() {
  return {
    active: false,
    kind: "chapter",
    kicker: "NEUE ETAPPE",
    title: "Waldpfade",
    subtitle: "Die Reise beginnt",
    accent: "#8fe3bc",
    tick: 0,
    enter: DEFAULT_TIMING.enter,
    hold: DEFAULT_TIMING.hold,
    exit: DEFAULT_TIMING.exit,
    pinned: false,
  };
}

export function beginPresentation(state, cue = {}) {
  const target = state || createPresentationState();
  const timing = cue.reducedMotion ? REDUCED_TIMING : DEFAULT_TIMING;
  Object.assign(target, {
    active: true,
    kind: cue.kind || "chapter",
    kicker: cue.kicker || "NEUE ETAPPE",
    title: cue.title || "Waldpfade",
    subtitle: cue.subtitle || "Die Reise geht weiter",
    accent: cue.accent || "#8fe3bc",
    tick: 0,
    enter: positiveFrames(cue.enter, timing.enter),
    hold: positiveFrames(cue.hold, timing.hold),
    exit: positiveFrames(cue.exit, timing.exit),
    pinned: !!cue.pinned,
  });
  return target;
}

export function tickPresentation(state) {
  if (!state?.active || state.pinned) return state;
  state.tick += 1;
  if (state.tick >= state.enter + state.hold + state.exit) state.active = false;
  return state;
}

export function getPresentationFrame(state) {
  if (!state?.active) return { alpha: 0, reveal: 0, veil: 0 };
  if (state.pinned) return { alpha: 1, reveal: 1, veil: state.kind === "chapter" ? 1 : 0.72 };

  const tick = Math.max(0, state.tick);
  const enterEnd = Math.max(1, state.enter);
  const holdEnd = state.enter + state.hold;
  let alpha = 1;
  if (tick < state.enter) alpha = smoothstep(tick / enterEnd);
  else if (tick > holdEnd) alpha = 1 - smoothstep((tick - holdEnd) / Math.max(1, state.exit));

  return {
    alpha: Math.max(0, Math.min(1, alpha)),
    reveal: smoothstep(tick / enterEnd),
    veil: state.kind === "chapter" ? alpha : alpha * 0.72,
  };
}
