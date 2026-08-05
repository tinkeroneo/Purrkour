export const MISSION_DEFINITIONS = Object.freeze([
  Object.freeze({ key: "mice", event: "mouse", label: "Mäusejagd", hint: "Sammle 4 Mäuse", target: 4, reward: 18, mode: "count" }),
  Object.freeze({ key: "flow", event: "flow", label: "Samtpfoten-Flow", hint: "Erreiche Flow x3", target: 3, reward: 24, mode: "max" }),
  Object.freeze({ key: "moves", event: "maneuver", label: "Mutpfoten", hint: "Schaffe 5 Manöver", target: 5, reward: 30, mode: "count" }),
]);

function definitionFor(completed) {
  return MISSION_DEFINITIONS[Math.max(0, completed) % MISSION_DEFINITIONS.length];
}

export function createMissionState(completed = 0) {
  const safeCompleted = Math.max(0, Math.floor(Number(completed) || 0));
  const definition = definitionFor(safeCompleted);
  return {
    ...definition,
    progress: 0,
    completed: safeCompleted,
  };
}

export function recordMissionEvent(state, event, value = 1) {
  const current = state?.key ? state : createMissionState();
  if (event !== current.event) return { state: current, completion: null };

  const amount = Math.max(0, Number(value) || 0);
  const progress = current.mode === "max"
    ? Math.max(current.progress, amount)
    : current.progress + amount;

  if (progress < current.target) {
    return { state: { ...current, progress }, completion: null };
  }

  const completion = {
    key: current.key,
    label: current.label,
    reward: current.reward,
    number: current.completed + 1,
  };
  return {
    state: createMissionState(current.completed + 1),
    completion,
  };
}

