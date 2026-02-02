// src/game/vehicles/index.js
import { drawBalloonVehicle } from "./balloon.js";
import { drawZeppelinVehicle } from "./zeppelin.js";
import { drawRaftVehicle } from "./raft.js";
import { drawRocketVehicle } from "./rocket.js";

export function drawVehicle(ctx, env) {
  const type = env?.setpiece?.type || "balloon";
  if (type === "zeppelin") return drawZeppelinVehicle(ctx, env);
  if (type === "raft") return drawRaftVehicle(ctx, env);
  if (type === "rocket") return drawRocketVehicle(ctx, env );
  return drawBalloonVehicle(ctx, env);
}
