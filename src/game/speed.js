import { getOverlay } from "../world/overlays.js";

export const DEFAULT_BASE_SPEED = 2.35;
export const BASE_SPEED_MULT = 2;
export const BASE_SPEED_BOOST = DEFAULT_BASE_SPEED * (BASE_SPEED_MULT - 1);

export function getInitialBaseSpeed() {
  return DEFAULT_BASE_SPEED * BASE_SPEED_MULT;
}

export function getBaseSpeed(game) {
  return (typeof game.speed === "number") ? game.speed : DEFAULT_BASE_SPEED;
}

export function setBaseSpeed(game, value) {
  game.speed = value + BASE_SPEED_BOOST;
}

export function resetBaseSpeed(game) {
  game.speed = getInitialBaseSpeed();
}

export function bumpBaseSpeed(game, delta) {
  game.speed = getBaseSpeed(game) + delta;
}

export function applyAutoAcceleration(game) {
  if (game.progression?.controlsSpeed) return;
  if (game.tick % 60 === 0) game.speed += 0.035;
  if (game.score > 0 && game.score % 20 === 0 && game.tick % 30 === 0) game.speed += 0.01;
}

export function computeEffectiveSpeed(game) {
  const base = getBaseSpeed(game);
  const catnipMult = (game.catnipTimer > 0) ? 0.82 : 1.0;
  const slowMult = (game.slowTimer > 0) ? (game.slowStrength ?? 1.0) : 1.0;
  const speedMul = (game.speedMul ?? 1.0);
  const overlay = getOverlay(game.themeOverlay);
  const overlaySpeed = overlay?.speedMul ?? 1.0;
  const eff = base * speedMul * catnipMult * slowMult * overlaySpeed;

  const sp = game.setpiece;
  const scroll = (sp?.active) ? (sp.scroll ?? 1) : 1;
  game._effSpeed = eff * scroll;
  return game._effSpeed;
}

export function getEffectiveSpeed(game) {
  return game._effSpeed ?? DEFAULT_BASE_SPEED;
}
