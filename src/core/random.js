export function normalizeRunSeed(value, fallback = 1) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed >>> 0 || 1;
  const fallbackSeed = Number.parseInt(String(fallback ?? ""), 10);
  return Number.isFinite(fallbackSeed) && fallbackSeed > 0 ? fallbackSeed >>> 0 || 1 : 1;
}

export function createSeededRandom(value) {
  let seed = normalizeRunSeed(value);
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRunSeed(cryptoApi = globalThis.crypto, now = Date.now()) {
  try {
    const values = new Uint32Array(1);
    cryptoApi?.getRandomValues?.(values);
    if (values[0]) return values[0];
  } catch {
    // A time-based seed still supports replay when secure randomness is unavailable.
  }
  return normalizeRunSeed(now);
}
