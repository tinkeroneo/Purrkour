import { getFlowMultiplier } from "./flow.js";

export function createRunSummary(game, bestScore = 0) {
  return {
    score: Math.max(0, Math.floor(Number(game?.score) || 0)),
    bestScore: Math.max(0, Math.floor(Number(bestScore) || 0)),
    bestFlow: getFlowMultiplier(game?.flow?.best),
    seed: Math.max(1, Math.floor(Number(game?.runSeed) || 1)),
    theme: typeof game?.userTheme === "string" ? game.userTheme : null,
  };
}

export function createReplayUrl(locationHref, summary) {
  const url = new globalThis.URL(locationHref);
  url.search = "";
  url.hash = "";
  url.searchParams.set("run", String(summary.seed));
  url.searchParams.set("help", "0");
  if (summary.theme) url.searchParams.set("theme", summary.theme);
  return url.toString();
}

export function createShareText(summary) {
  return `Purrkour: ${summary.score} Punkte, Flow x${summary.bestFlow}, Lauf #${summary.seed}`;
}
