// src/game/vehicles/index.js
import { drawBalloonVehicle } from "./balloon.js";
import { drawZeppelinVehicle } from "./zeppelin.js";
import { drawRaftVehicle } from "./raft.js";

export function drawVehicle(ctx, env) {
  const type = env?.setpiece?.type || "balloon";
  if (type === "zeppelin") return drawZeppelinVehicle(ctx, env);
  if (type === "raft") return drawRaftVehicle(ctx, env);
  return drawBalloonVehicle(ctx, env);
}
