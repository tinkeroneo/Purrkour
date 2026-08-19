import { frequencyForSemitone, getSoundScoreProfile, motifGap } from "./sound-score.js";

const AUDIO_STORAGE_KEY = "purrkour_sfx.v2";

export function createAudio(soundBtnEl, storage = null) {
    let preferenceStorage = storage;
    if (!preferenceStorage) {
        try { preferenceStorage = localStorage; } catch { preferenceStorage = null; }
    }
    let audioCtx = null;
    let unlocked = false;
    let pendingAmbience = null;
    let pendingScore = null;
    let enabled = readPreference();

    function readPreference() {
        try {
            return preferenceStorage?.getItem(AUDIO_STORAGE_KEY) === "on";
        } catch {
            return false;
        }
    }

    function writePreference(value) {
        try {
            preferenceStorage?.setItem(AUDIO_STORAGE_KEY, value);
        } catch {
            // Audio remains usable when storage is blocked or full.
        }
    }
    // --- simple mixer buses ---
    let master = null, sfxBus = null, ambBus = null, musicBus = null;

    function initMixer() {
        if (!audioCtx || master) return;

        master = audioCtx.createGain();
        master.gain.value = 0.78;

        sfxBus = audioCtx.createGain();
        sfxBus.gain.value = 0.92;

        ambBus = audioCtx.createGain();
        ambBus.gain.value = 0.10;

        musicBus = audioCtx.createGain();
        musicBus.gain.value = 0.52;

        sfxBus.connect(master);
        ambBus.connect(master);
        musicBus.connect(master);
        master.connect(audioCtx.destination);
    }

    function isReady() {
        return Boolean(enabled && unlocked && audioCtx && audioCtx.state === "running" && master);
    }

    function activateUnlockedContext() {
        initMixer();
        unlocked = audioCtx?.state === "running";
        if (unlocked && pendingAmbience) applyAmbience(pendingAmbience);
        if (unlocked && pendingScore) applyScore(pendingScore, true);
    }

    function unlock() {
        if (!enabled) return;
        if (!audioCtx) {
            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) return;
            audioCtx = new AudioContextCtor();
        }
        if (audioCtx.state === "suspended") {
            audioCtx.resume().then(activateUnlockedContext).catch(() => { unlocked = false; });
            return;
        }
        activateUnlockedContext();
    }


    function syncButton() {
        if (soundBtnEl) {
            soundBtnEl.textContent = enabled ? "🔊" : "🔇";
            soundBtnEl.setAttribute("aria-pressed", String(enabled));
            soundBtnEl.setAttribute("aria-label", enabled ? "Sound ausschalten" : "Sound einschalten");
        }
    }

    function setEnabled(on) {
        enabled = !!on;
        writePreference(enabled ? "on" : "off");
        syncButton();
        if (master) master.gain.value = enabled ? 0.78 : 0;
        if (!enabled) {
            pendingAmbience = null;
            pendingScore = null;
            stopAmbience();
            stopScore();
        }
    }



    function tone({ freq = 440, dur = 0.08, type = "sine", vol = 0.05, slideTo = null }) {
        if (!isReady()) return;
        const t0 = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (slideTo != null) o.frequency.linearRampToValueAtTime(slideTo, t0 + dur);

        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        o.connect(g).connect(sfxBus);

        o.start(t0);
        o.stop(t0 + dur + 0.02);
    }
    let noiseBuffer = null;
    function makeNoiseSource() {
        const bufferSize = 2 * audioCtx.sampleRate;
        if (!noiseBuffer) {
            noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        }

        const src = audioCtx.createBufferSource();
        src.buffer = noiseBuffer;
        src.loop = true;
        return src;
    }


    function bark(vol = 0.07) {
        if (!isReady()) return;

        const t0 = audioCtx.currentTime;

        // noise + bandpass = "breathy" bark texture
        const src = makeNoiseSource();
        const bp = audioCtx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(520, t0);
        bp.Q.setValueAtTime(1.2, t0);

        const shaper = audioCtx.createWaveShaper();
        // soft saturation curve
        const n = 256;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i / (n - 1)) * 2 - 1;
            curve[i] = Math.tanh(2.2 * x);
        }
        shaper.curve = curve;
        shaper.oversample = "2x";

        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, t0);

        // envelope: two pulses
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.085);
        g.gain.exponentialRampToValueAtTime(vol * 0.8, t0 + 0.11);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

        // small pitch-ish movement via filter
        bp.frequency.linearRampToValueAtTime(420, t0 + 0.10);

        src.connect(bp).connect(shaper).connect(g).connect(sfxBus);
        src.start(t0);
        src.stop(t0 + 0.22);
    }



  // soft "thup" for stomps/landings
  function stomp(vol = 0.05) {
    if (!isReady()) return;
    const t0 = audioCtx.currentTime;

    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(520, t0);
    lp.Q.setValueAtTime(0.8, t0);

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(160, t0);
    o.frequency.exponentialRampToValueAtTime(90, t0 + 0.08);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

    o.connect(g).connect(lp);
    lp.connect(sfxBus);

    o.start(t0);
    o.stop(t0 + 0.13);
  }
function chime(vol = 0.045) {
        tone({ freq: 660, dur: 0.08, type: "sine", vol, slideTo: 740 });
        setTimeout(() => tone({ freq: 880, dur: 0.10, type: "sine", vol: vol * 0.9, slideTo: 990 }), 70);
        setTimeout(() => tone({ freq: 740, dur: 0.12, type: "triangle", vol: vol * 0.65, slideTo: 820 }), 150);
    }
    function travelPhase(mode, phase) {
        const rocket = mode === "rocket";
        if (phase === "approach") {
            tone({ freq: rocket ? 110 : 294, dur: 0.12, type: "triangle", vol: 0.035, slideTo: rocket ? 145 : 330 });
            return;
        }
        if (phase === "board") {
            tone({ freq: rocket ? 147 : 349, dur: 0.1, type: rocket ? "sawtooth" : "sine", vol: 0.032, slideTo: rocket ? 196 : 392 });
            return;
        }
        if (phase === "travel") {
            tone({ freq: rocket ? 196 : 392, dur: 0.16, type: "triangle", vol: 0.04, slideTo: rocket ? 330 : 523 });
            tone({ freq: rocket ? 294 : 494, dur: 0.18, type: "sine", vol: 0.025, slideTo: rocket ? 440 : 587 });
            return;
        }
        if (phase === "arrive") {
            tone({ freq: rocket ? 392 : 523, dur: 0.16, type: "sine", vol: 0.036, slideTo: rocket ? 247 : 392 });
            tone({ freq: rocket ? 247 : 330, dur: 0.2, type: "triangle", vol: 0.024, slideTo: rocket ? 196 : 294 });
        }
    }
    const amb = {
        wind: null,
        ocean: null,
        night: null,
        whoosh: null,
        rumble: null,
        engine: null,

        windGain: null,
        oceanGain: null,
        nightGain: null,
        whooshGain: null,
        rumbleGain: null,
        engineGain: null,

        whooshLfo: null,
        whooshLfoGain: null,
        engineLfo: null,
        engineLfoGain: null
    };
    syncButton();
    function stopNode(n) {
        try { n?.stop?.(); } catch {
            // A stopped WebAudio node cannot be stopped twice.
        }
    }

    function stopAmbience() {
        stopNode(amb.wind); stopNode(amb.ocean); stopNode(amb.night);
        stopNode(amb.whoosh); stopNode(amb.rumble); stopNode(amb.engine);
        stopNode(amb.whooshLfo); stopNode(amb.engineLfo);

        amb.wind = amb.ocean = amb.night = amb.whoosh = amb.rumble = amb.engine = null;
        amb.windGain = amb.oceanGain = amb.nightGain = amb.whooshGain = amb.rumbleGain = amb.engineGain = null;
        amb.whooshLfo = amb.whooshLfoGain = amb.engineLfo = amb.engineLfoGain = null;
    }


    function applyAmbience({ wind = 0, ocean = 0, night = 0, whoosh = 0, rumble = 0, engine = 0, tau = 0.12 } = {}) {
        if (!isReady()) return;

        // lazy-create each layer
        function ensureLayer(key, freq, type) {
            if (amb[key]) return;

            const g = audioCtx.createGain();
            g.gain.value = 0.0001;

            if (type === "noise") {
                const src = makeNoiseSource();

                const bp = audioCtx.createBiquadFilter();
                bp.type = "bandpass";
                bp.frequency.value = freq;
                bp.Q.value = 0.7;

                src.connect(bp).connect(g).connect(ambBus);
                src.start();

                amb[key] = src;
                amb[key + "Gain"] = g;
                return;
            }

            // whoosh: noise + bandpass + slow LFO on gain (gusts)
            if (type === "whoosh") {
                const src = makeNoiseSource();

                const bp = audioCtx.createBiquadFilter();
                bp.type = "bandpass";
                bp.frequency.value = freq; // ~900
                bp.Q.value = 0.55;

                // LFO -> modulates gain for gentle gusts
                const lfo = audioCtx.createOscillator();
                lfo.type = "sine";
                lfo.frequency.value = 0.18; // slow gust cycle

                const lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 0.55; // gust depth (relative)

                // base gain will be controlled by setAmbience via g.gain
                lfo.connect(lfoGain).connect(g.gain);
                lfo.start();

                src.connect(bp).connect(g).connect(ambBus);
                src.start();

                amb[key] = src;
                amb[key + "Gain"] = g;
                amb.whooshLfo = lfo;
                amb.whooshLfoGain = lfoGain;
                return;
            }

            // rumble: low bandpass “engine/air” feel
            if (type === "rumble") {
                const src = makeNoiseSource();

                const bp = audioCtx.createBiquadFilter();
                bp.type = "bandpass";
                bp.frequency.value = freq; // ~90–120
                bp.Q.value = 0.9;

                src.connect(bp).connect(g).connect(ambBus);
                src.start();

                amb[key] = src;
                amb[key + "Gain"] = g;
                return;
            }

            // engine: warm saw + lowpass (zeppelin)
            if (type === "engine") {
                const o = audioCtx.createOscillator();
                o.type = "sawtooth";
                o.frequency.value = freq; // ~55–75

                // subtle vibrato
                const lfo = audioCtx.createOscillator();
                lfo.type = "sine";
                lfo.frequency.value = 0.9;
                const lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 1.6;
                lfo.connect(lfoGain).connect(o.frequency);
                lfo.start();

                const lp = audioCtx.createBiquadFilter();
                lp.type = "lowpass";
                lp.frequency.value = 520;
                lp.Q.value = 0.6;

                o.connect(lp).connect(g).connect(ambBus);
                o.start();

                amb[key] = o;
                amb[key + "Gain"] = g;
                amb[key + "Lfo"] = lfo;
                amb[key + "LfoGain"] = lfoGain;
                return;
            }
        }


        const t0 = audioCtx.currentTime;
        const layers = [
            ["wind", wind, 380, "noise"],
            ["ocean", ocean, 160, "noise"],
            ["night", night, 2600, "noise"],
            ["whoosh", whoosh, 120, "whoosh"],
            ["rumble", rumble, 100, "rumble"],
            ["engine", engine, 62, "engine"],
        ];
        for (const [key, amount, frequency, type] of layers) {
            if (amount > 0.0002 || amb[key]) ensureLayer(key, frequency, type);
            amb[`${key}Gain`]?.gain.setTargetAtTime(Math.max(0.0001, amount), t0, tau);
        }

    }

    function setAmbience(mix = {}) {
        if (!enabled) return;
        pendingAmbience = { ...mix };
        if (isReady()) applyAmbience(pendingAmbience);
    }

    const scoreNodes = new Set();
    let scoreKey = "";
    let nextMotifAt = 0;

    function trackScoreNode(node) {
        scoreNodes.add(node);
        node.onended = () => scoreNodes.delete(node);
    }

    function stopScore() {
        for (const node of scoreNodes) stopNode(node);
        scoreNodes.clear();
        scoreKey = "";
        nextMotifAt = 0;
    }

    function pluck(freq, start, duration, profile, volume) {
        const body = audioCtx.createOscillator();
        const shimmer = audioCtx.createOscillator();
        const bodyGain = audioCtx.createGain();
        const shimmerGain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        const envelope = audioCtx.createGain();

        body.type = profile.wave;
        body.frequency.setValueAtTime(freq, start);
        shimmer.type = "sine";
        shimmer.frequency.setValueAtTime(freq * 2.005, start);
        bodyGain.gain.value = 0.78;
        shimmerGain.gain.value = 0.22;
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(profile.brightness, start);
        filter.frequency.exponentialRampToValueAtTime(Math.max(280, profile.brightness * 0.42), start + duration);
        filter.Q.value = 0.7;
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(volume, start + 0.018);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        body.connect(bodyGain).connect(filter);
        shimmer.connect(shimmerGain).connect(filter);
        filter.connect(envelope).connect(musicBus);
        trackScoreNode(body);
        trackScoreNode(shimmer);
        body.start(start);
        shimmer.start(start);
        body.stop(start + duration + 0.03);
        shimmer.stop(start + duration + 0.03);
    }

    function applyScore(scene = {}, immediate = false) {
        if (!isReady()) return;
        const profile = getSoundScoreProfile(scene.theme, scene.mode);
        const night = Math.max(0, Math.min(1, Number(scene.night) || 0));
        const intensity = Math.max(0, Math.min(1, Number(scene.intensity) || 0));
        const nextKey = `${profile.key}:${night > 0.7 ? "night" : "day"}:${scene.mode || "run"}`;
        const now = audioCtx.currentTime;
        if (scoreKey !== nextKey) {
            scoreKey = nextKey;
            nextMotifAt = now + (immediate ? 0.04 : 0.12);
        }
        if (now + 0.025 < nextMotifAt) return;

        const start = Math.max(now + 0.025, nextMotifAt);
        const duration = 0.72 + intensity * 0.16;
        const volume = 0.024 + intensity * 0.010;
        profile.notes.forEach((semitone, index) => {
            const offset = index * profile.step;
            pluck(frequencyForSemitone(profile.root, semitone, night), start + offset, duration, profile, volume);
        });
        nextMotifAt = start + motifGap(profile, intensity);
    }

    function setScore(scene = {}) {
        if (!enabled) return;
        pendingScore = { ...scene };
        if (isReady()) applyScore(pendingScore);
    }

    const SFX = {
        jump: () => tone({ freq: 320, dur: 0.07, type: "triangle", vol: 0.055, slideTo: 280 }),
        mouse: () => tone({ freq: 760, dur: 0.06, type: "sine", vol: 0.045, slideTo: 860 }),
        combo: () => chime(0.045),
    stomp: () => stomp(0.05),
        catnip: () => { tone({ freq: 420, dur: 0.10, type: "sine", vol: 0.045, slideTo: 520 }); setTimeout(() => tone({ freq: 620, dur: 0.10, type: "sine", vol: 0.038, slideTo: 700 }), 70); },
        fish: () => { tone({ freq: 540, dur: 0.08, type: "triangle", vol: 0.045, slideTo: 680 }); setTimeout(() => tone({ freq: 820, dur: 0.06, type: "sine", vol: 0.036, slideTo: 920 }), 80); },
        slow: () => tone({ freq: 220, dur: 0.10, type: "triangle", vol: 0.045, slideTo: 150 }),
        hit: () => tone({ freq: 170, dur: 0.14, type: "square", vol: 0.035, slideTo: 120 }),
        bark: () => bark(0.05),
        magic: () => { tone({ freq: 520, dur: 0.10, type: "sine", vol: 0.038, slideTo: 760 }); setTimeout(() => tone({ freq: 860, dur: 0.10, type: "sine", vol: 0.032, slideTo: 980 }), 90); },
        home: () => { tone({ freq: 330, dur: 0.12, type: "triangle", vol: 0.045, slideTo: 440 }); setTimeout(() => tone({ freq: 520, dur: 0.14, type: "sine", vol: 0.03, slideTo: 520 }), 140); },
        dash: () => tone({ freq: 520, dur: 0.05, type: "triangle", vol: 0.03, slideTo: 640 }),
        travelPhase,
        chapter: (theme = "forest") => {
            const roots = { forest: 392, ocean: 330, island: 440, mars: 247, mountain: 349, jungle: 415, cliff: 294, city: 466, desert: 370 };
            const root = roots[theme] || roots.forest;
            tone({ freq: root, dur: 0.09, type: "sine", vol: 0.034, slideTo: root * 1.08 });
            setTimeout(() => tone({ freq: root * 1.5, dur: 0.12, type: "triangle", vol: 0.027, slideTo: root * 1.62 }), 85);
        },
    };

    if (soundBtnEl) {
        soundBtnEl.addEventListener("click", (e) => {
            e.preventDefault();
            const next = !enabled;
            setEnabled(next);
            if (next) unlock();
        });
    }

    return {
        ensure: unlock,
        SFX,
        setAmbience,
        setScore,
        stopAmbience,
        stopScore,
        get enabled() { return enabled; },
        get unlocked() { return unlocked; },
        setEnabled
    };
}
