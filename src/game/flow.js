export const FLOW_WINDOW_TICKS = 240;
export const FLOW_MAX_COUNT = 12;

export function getFlowMultiplier(count) {
  const value = Math.max(0, Math.floor(Number(count) || 0));
  if (value >= 10) return 4;
  if (value >= 6) return 3;
  if (value >= 3) return 2;
  return 1;
}

export function createFlowState() {
  return {
    count: 0,
    multiplier: 1,
    timer: 0,
    best: 0,
  };
}

export function rewardFlow(flow, { steps = 1, basePoints = 1 } = {}) {
  if (!flow) return { points: Math.max(0, Math.floor(basePoints)), tierChanged: false, multiplier: 1 };
  const previousMultiplier = getFlowMultiplier(flow.count);
  const increment = Math.max(1, Math.floor(Number(steps) || 1));
  flow.count = Math.min(FLOW_MAX_COUNT, Math.max(0, flow.count || 0) + increment);
  flow.multiplier = getFlowMultiplier(flow.count);
  flow.timer = FLOW_WINDOW_TICKS;
  flow.best = Math.max(Math.max(0, flow.best || 0), flow.count);

  return {
    points: Math.max(0, Math.floor(Number(basePoints) || 0)) * flow.multiplier,
    tierChanged: flow.multiplier > previousMultiplier,
    multiplier: flow.multiplier,
    count: flow.count,
  };
}

export function tickFlow(flow) {
  if (!flow || flow.count <= 0) return { expired: false, previousMultiplier: 1 };
  flow.timer = Math.max(0, Math.floor(flow.timer || 0) - 1);
  if (flow.timer > 0) return { expired: false, previousMultiplier: flow.multiplier || 1 };
  const previousMultiplier = flow.multiplier || getFlowMultiplier(flow.count);
  flow.count = 0;
  flow.multiplier = 1;
  return { expired: true, previousMultiplier };
}

export function breakFlow(flow) {
  if (!flow) return { broken: false, previousMultiplier: 1 };
  const previousMultiplier = flow.multiplier || getFlowMultiplier(flow.count);
  const broken = flow.count > 0;
  flow.count = 0;
  flow.multiplier = 1;
  flow.timer = 0;
  return { broken, previousMultiplier };
}

export function getFlowProgress(flow) {
  if (!flow || flow.count <= 0) return 0;
  return Math.max(0, Math.min(1, (Number(flow.timer) || 0) / FLOW_WINDOW_TICKS));
}
