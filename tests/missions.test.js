import assert from "node:assert/strict";
import test from "node:test";

import { createMissionState, MISSION_DEFINITIONS, recordMissionEvent } from "../src/game/missions.js";

test("missions rotate deterministically after completion", () => {
  let mission = createMissionState();
  assert.equal(mission.key, "mice");

  for (let i = 0; i < 3; i++) mission = recordMissionEvent(mission, "mouse").state;
  const result = recordMissionEvent(mission, "mouse");

  assert.equal(result.completion.label, "Mäusejagd");
  assert.equal(result.completion.reward, 18);
  assert.equal(result.state.key, "flow");
  assert.equal(result.state.completed, 1);
});

test("flow missions keep the highest multiplier and ignore unrelated events", () => {
  const flowMission = createMissionState(1);
  const ignored = recordMissionEvent(flowMission, "mouse", 10);
  assert.equal(ignored.state, flowMission);

  const progress = recordMissionEvent(flowMission, "flow", 2).state;
  assert.equal(progress.progress, 2);
  const lower = recordMissionEvent(progress, "flow", 1).state;
  assert.equal(lower.progress, 2);
  const completed = recordMissionEvent(lower, "flow", 3);
  assert.equal(completed.state.key, "moves");
});

test("the mission cycle remains stable over repeated rotations", () => {
  for (let completed = 0; completed < 15; completed++) {
    assert.equal(
      createMissionState(completed).key,
      MISSION_DEFINITIONS[completed % MISSION_DEFINITIONS.length].key,
    );
  }
});

