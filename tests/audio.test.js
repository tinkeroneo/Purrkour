import assert from "node:assert/strict";
import test from "node:test";
import { createAudio } from "../src/core/audio.js";

class AudioParamStub {
  constructor() { this.value = 0; }
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
}

class AudioNodeStub {
  constructor(counters) {
    this.counters = counters;
    this.gain = new AudioParamStub();
    this.frequency = new AudioParamStub();
    this.Q = new AudioParamStub();
  }
  connect() { return this; }
  start() { this.counters.started += 1; }
  stop() { this.counters.stopped += 1; }
}

test("audio context is created only after an explicit unlock gesture", async (t) => {
  const originalWindow = globalThis.window;
  const originalStorage = globalThis.localStorage;
  const counters = { contexts: 0, started: 0, stopped: 0 };
  class AudioContextStub {
    constructor() {
      counters.contexts += 1;
      this.state = "suspended";
      this.currentTime = 0;
      this.sampleRate = 8;
      this.destination = {};
    }
    resume() { this.state = "running"; return Promise.resolve(); }
    createGain() { return new AudioNodeStub(counters); }
    createOscillator() { return new AudioNodeStub(counters); }
    createBiquadFilter() { return new AudioNodeStub(counters); }
    createWaveShaper() { return new AudioNodeStub(counters); }
    createBufferSource() { return new AudioNodeStub(counters); }
    createBuffer() { return { getChannelData: () => new Float32Array(16) }; }
  }
  const preferences = new Map([["purrkour_sfx", "on"]]);
  globalThis.window = { AudioContext: AudioContextStub };
  globalThis.localStorage = {
    getItem: (key) => preferences.get(key) ?? null,
    setItem: (key, value) => preferences.set(key, value)
  };
  t.after(() => {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalStorage;
  });

  const audio = createAudio(null);
  audio.setAmbience({ wind: 0.2 });
  audio.SFX.jump();
  assert.equal(counters.contexts, 0);
  assert.equal(audio.unlocked, false);

  audio.ensure();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(counters.contexts, 1);
  assert.equal(audio.unlocked, true);
  assert.ok(counters.started > 0, "pending ambience should start after unlock");

  const startedBeforeTravel = counters.started;
  audio.SFX.travelPhase("ocean", "travel");
  audio.SFX.travelPhase("rocket", "arrive");
  assert.equal(counters.started, startedBeforeTravel + 4);
});

test("blocked preference storage does not break audio setup", () => {
  const originalWindow = globalThis.window;
  const originalStorage = globalThis.localStorage;
  globalThis.window = {};
  globalThis.localStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); }
  };
  try {
    const audio = createAudio(null);
    assert.equal(audio.enabled, true);
    assert.doesNotThrow(() => audio.setEnabled(false));
  } finally {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalStorage;
  }
});
