import { clamp } from "../core/util.js";

// 0..1 where 0=day, 1=night
export function nightFactor(tick, score, speed = 0.00014) {
  // bewusst ruhig: score nudges nur leicht, sonst wird's zu "flippy"
  const base = (tick * speed) + (score * 0.0004);
  const phase = base % 1; // 0..1
  // S-curve + längere Dämmerung:
  // day -> dusk -> night -> dawn -> day
  const wave = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2); // 0..1..0
  const eased = Math.pow(wave, 1.25);
  // clamp to avoid too-dark: still cozy
  return clamp(eased * 0.92, 0, 0.92);
}
