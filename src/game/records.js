export const BEST_SCORE_STORAGE_KEY = "purrkour.bestScore";

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0) return 0;
  return Math.floor(score);
}

export function readBestScore(storage) {
  if (!storage) return 0;
  try {
    return normalizeScore(storage.getItem(BEST_SCORE_STORAGE_KEY));
  } catch {
    return 0;
  }
}

export function recordScore(storage, score) {
  const previousBest = readBestScore(storage);
  const normalizedScore = normalizeScore(score);
  const best = Math.max(previousBest, normalizedScore);

  if (storage && best !== previousBest) {
    try {
      storage.setItem(BEST_SCORE_STORAGE_KEY, String(best));
    } catch {
      // The result remains available for this dialog when storage is blocked.
    }
  }

  return { best, isNewBest: normalizedScore > previousBest };
}
