const ROUTE_NAMES = Object.freeze(["Goldgrat", "Mondpfad", "Wipfelroute"]);

export function getRiskRouteLift(index, count, baseLift = 72, peakLift = 280) {
  const last = Math.max(1, Math.floor(Number(count) || 1) - 1);
  const i = Math.max(0, Math.min(last, Math.floor(Number(index) || 0)));
  const u = i / last;
  const arc = Math.sin(u * Math.PI);
  const wave = Math.sin(i * 0.82) * 7;
  return baseLift + arc * peakLift + wave;
}

export function createRiskRouteState(completed = 0) {
  return {
    active: false,
    id: 0,
    label: "Goldpfad",
    total: 0,
    collected: 0,
    entered: false,
    bonus: 0,
    completed: Math.max(0, Math.floor(Number(completed) || 0)),
    nextAt: 45,
  };
}

export function shouldStartRiskRoute(route, score, { safeMode = false, blocked = false } = {}) {
  if (!route || route.active || safeMode || blocked) return false;
  return (Number(score) || 0) >= route.nextAt;
}

export function beginRiskRoute(route, score, total = 5) {
  const current = route || createRiskRouteState();
  const sequence = current.id + 1;
  return {
    ...current,
    active: true,
    id: sequence,
    label: ROUTE_NAMES[(sequence - 1) % ROUTE_NAMES.length],
    total: Math.max(1, Math.floor(Number(total) || 5)),
    collected: 0,
    entered: false,
    bonus: 70 + sequence * 10,
    nextAt: Math.max(current.nextAt, Math.floor(Number(score) || 0) + 170),
  };
}

export function collectRiskToken(route, routeId) {
  if (!route?.active || route.id !== routeId) return { state: route, completion: null };
  const collected = Math.min(route.total, route.collected + 1);
  if (collected < route.total) {
    return { state: { ...route, collected, entered: true }, completion: null };
  }

  const completion = {
    id: route.id,
    label: route.label,
    bonus: route.bonus,
    number: route.completed + 1,
  };
  return {
    state: { ...route, active: false, collected, entered: true, completed: route.completed + 1 },
    completion,
  };
}

export function expireRiskRoute(route) {
  if (!route?.active) return route;
  return { ...route, active: false };
}
