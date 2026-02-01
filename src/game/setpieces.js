// src/game/setpieces.js
// Small setpiece manager so we can add more (zeppelin, raft, city flyover) without touching the loop.

export function createSetpieceManager({ game, objects, startThemeFade }) {
  function clearWorldForFlight() {
    objects.list.length = 0;
    objects.pawprints.length = 0;
    // keep bubbles/toast alive
  }

  function triggerOceanCrossing() {
    if (!game.setpiece) return;
    game.setpiece.active = true;
    game.setpiece.t = 0;
    game.setpiece.cooldown = 0;

    // switch to ocean theme for crossing
    startThemeFade("ocean", 90);

    clearWorldForFlight();

    // during flight: no grace (handled on landing)
    game.safeTimer = 0;
  }

  function finishOceanCrossing() {
    if (!game.setpiece) return;
    game.setpiece.active = false;
    game.setpiece.cooldown = 0;

    // arrive at island
    startThemeFade("island", 120);

    // short grace: calm landing window (~3s at 60fps)
    game.safeTimer = 180;
  }

  function update() {
    if (!game.setpiece) return;

    // trigger once when score threshold reached
    if (!game.setpiece.active && game.score >= game.setpiece.startScore && game.setpiece.cooldown > 99999) {
      triggerOceanCrossing();
    }

    if (game.setpiece.active) {
      game.setpiece.t++;
      if (game.setpiece.t >= game.setpiece.dur) {
        finishOceanCrossing();
      }
    } else {
      // cooldown counts up while inactive
      if (game.setpiece.cooldown < 999999) game.setpiece.cooldown++;
    }
  }

  return { update, triggerOceanCrossing, finishOceanCrossing };
}
