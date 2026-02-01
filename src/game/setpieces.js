// src/game/setpieces.js
// Story beats that temporarily change rules (ocean crossing, zeppelin ride, ...)

import { clamp } from "../core/util.js";

export function createSetpieceManager({ game, objects, startThemeFade, audio }) {
  const used = game.setpiece.used || (game.setpiece.used = {});

  function schedule() {
    // list of { score, type, toTheme, afterTheme, dur }
    return game.setpiece.schedule || [];
  }

  function findNext() {
    for (const b of schedule()) {
      if (!used[b.type] && game.score >= b.score) return b;
    }
    return null;
  }

  function trigger(beat) {
    used[beat.type] = true;
    game.setpiece.active = true;
    game.setpiece.type = beat.type;
    game.setpiece.t = 0;
    game.setpiece.dur = beat.dur ?? game.setpiece.dur;
    game.setpiece.afterTheme = beat.afterTheme || beat.toTheme;

    // clear immediate clutter for a clean cinematic
    objects.list.length = 0;
    objects.pawprints.length = 0;

    if (beat.toTheme) startThemeFade(beat.toTheme, 90);
    audio?.SFX?.whoosh?.();
    objects.toast?.(beat.type === "balloon" ? "Auf zum Ozean…" : "Hoch hinaus…", 120);
  }

  function end() {
    game.setpiece.active = false;
    // short calm landing
    game.safeTimer = Math.max(game.safeTimer || 0, 220);
    game.slowTimer = Math.max(game.slowTimer || 0, 140);
    // after theme (e.g. balloon -> island)
    if (game.setpiece.afterTheme) startThemeFade(game.setpiece.afterTheme, 90);
    audio?.SFX?.chime?.();
  }

  function update() {
    if (!game.setpiece.active) {
      const nxt = findNext();
      if (nxt) trigger(nxt);
      return;
    }

    game.setpiece.t++;
    if (game.setpiece.t >= game.setpiece.dur) end();
  }

  function progress01() {
    return clamp((game.setpiece.t || 0) / (game.setpiece.dur || 1), 0, 1);
  }

  return { update, progress01 };
}
