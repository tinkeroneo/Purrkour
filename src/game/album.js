import { getFlowMultiplier } from "./flow.js";

export const ALBUM_STORAGE_KEY = "purrkour.journeyAlbum.v1";

function naturalNumber(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string" && item.length <= 64))].slice(0, 32);
}

export function createEmptyAlbum() {
  return {
    version: 1,
    themes: [],
    beats: [],
    setpieces: [],
    missions: 0,
    routes: 0,
    runs: 0,
    bestScore: 0,
    bestFlow: 1,
  };
}

export function readJourneyAlbum(storage) {
  let parsed;
  try {
    parsed = JSON.parse(storage?.getItem?.(ALBUM_STORAGE_KEY) || "null");
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed !== "object") return createEmptyAlbum();

  return {
    version: 1,
    themes: uniqueStrings(parsed.themes),
    beats: uniqueStrings(parsed.beats),
    setpieces: uniqueStrings(parsed.setpieces),
    missions: naturalNumber(parsed.missions),
    routes: naturalNumber(parsed.routes),
    runs: naturalNumber(parsed.runs),
    bestScore: naturalNumber(parsed.bestScore),
    bestFlow: Math.max(1, Math.min(4, naturalNumber(parsed.bestFlow))),
  };
}

function addDiscovery(list, value) {
  if (!value || list.includes(value)) return false;
  list.push(value);
  return true;
}

export function createJourneyAlbum(storage) {
  const album = readJourneyAlbum(storage);
  let lastTick = -1;
  let lastMissions = 0;
  let lastRoutes = 0;
  let finishedTick = null;

  function persist() {
    storage?.setItem?.(ALBUM_STORAGE_KEY, JSON.stringify(album));
  }

  function observe(game) {
    if (!game) return snapshot();
    const tick = naturalNumber(game.tick);
    if (tick < lastTick) {
      lastMissions = 0;
      lastRoutes = 0;
      finishedTick = null;
    }

    let changed = false;
    changed = addDiscovery(album.themes, game.theme) || changed;
    changed = addDiscovery(album.beats, game.progression?.beatId) || changed;
    if (game.setpiece?.active) changed = addDiscovery(album.setpieces, game.setpiece.mode) || changed;

    const currentMissions = naturalNumber(game.mission?.completed);
    const currentRoutes = naturalNumber(game.riskRoute?.completed);
    if (currentMissions > lastMissions) {
      album.missions += currentMissions - lastMissions;
      changed = true;
    }
    if (currentRoutes > lastRoutes) {
      album.routes += currentRoutes - lastRoutes;
      changed = true;
    }

    const bestScore = naturalNumber(game.score);
    const bestFlow = getFlowMultiplier(game.flow?.best);
    if (bestScore > album.bestScore) { album.bestScore = bestScore; changed = true; }
    if (bestFlow > album.bestFlow) { album.bestFlow = bestFlow; changed = true; }

    lastTick = tick;
    lastMissions = currentMissions;
    lastRoutes = currentRoutes;
    if (changed) persist();
    return snapshot();
  }

  function finishRun(game) {
    observe(game);
    const tick = naturalNumber(game?.tick);
    if (finishedTick !== tick) {
      album.runs++;
      finishedTick = tick;
      persist();
    }
    return snapshot();
  }

  function snapshot() {
    return {
      ...album,
      themes: [...album.themes],
      beats: [...album.beats],
      setpieces: [...album.setpieces],
    };
  }

  return { observe, finishRun, snapshot };
}

