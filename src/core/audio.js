export function createAudio(soundBtnEl) {
    let audioCtx = null;
    let enabled = (localStorage.getItem("purrkour_sfx") ?? "on") === "on";

    function ensure() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume().catch(() => { });
    }
    // --- simple mixer buses ---
    let master = null, sfxBus = null, ambBus = null;

    function initMixer() {
        if (!audioCtx || master) return;

        master = audioCtx.createGain();
        master.gain.value = 0.85; // global volume

        sfxBus = audioCtx.createGain();
        sfxBus.gain.value = 1.0;

        ambBus = audioCtx.createGain();
        ambBus.gain.value = 0.28; // ambience always subtle

        sfxBus.connect(master);
        ambBus.connect(master);
        master.connect(audioCtx.destination);
    }

    function ensureAll() {
        ensure();
        initMixer();
    }


    function setEnabled(on) {
        enabled = !!on;
        localStorage.setItem("purrkour_sfx", enabled ? "on" : "off");
        if (soundBtnEl) soundBtnEl.textContent = enabled ? "🔊" : "🔇";
        if (!enabled) stopAmbience();
    }



    function tone({ freq = 440, dur = 0.08, type = "sine", vol = 0.05, slideTo = null }) {
        if (!enabled || !audioCtx) return;
        const t0 = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (slideTo != null) o.frequency.linearRampToValueAtTime(slideTo, t0 + dur);

        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        ensureAll();
        o.connect(g).connect(sfxBus);

        o.start(t0);
        o.stop(t0 + dur + 0.02);
    }
    function makeNoiseSource() {
        const bufferSize = 2 * audioCtx.sampleRate;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

        const src = audioCtx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        return src;
    }


    function bark(vol = 0.07) {
        if (!enabled) return;
        ensureAll();

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


    function chime(vol = 0.045) {
        tone({ freq: 660, dur: 0.08, type: "sine", vol, slideTo: 740 });
        setTimeout(() => tone({ freq: 880, dur: 0.10, type: "sine", vol: vol * 0.9, slideTo: 990 }), 70);
        setTimeout(() => tone({ freq: 740, dur: 0.12, type: "triangle", vol: vol * 0.65, slideTo: 820 }), 150);
    }
    const amb = {
        wind: null,
        ocean: null,
        night: null,
        whoosh: null,
        rumble: null,

        windGain: null,
        oceanGain: null,
        nightGain: null,
        whooshGain: null,
        rumbleGain: null,

        whooshLfo: null,
        whooshLfogain: null
    };
    setEnabled(enabled);
    function stopNode(n) { try { n?.stop?.(); } catch { } }

    function stopAmbience() {
        stopNode(amb.wind); stopNode(amb.ocean); stopNode(amb.night);
        stopNode(amb.whoosh); stopNode(amb.rumble);
        stopNode(amb.whooshLfo);

        amb.wind = amb.ocean = amb.night = amb.whoosh = amb.rumble = null;
        amb.windGain = amb.oceanGain = amb.nightGain = amb.whooshGain = amb.rumbleGain = null;
        amb.whooshLfo = amb.whooshLfoGain = null;
    }


    function setAmbience({ wind = 0, ocean = 0, night = 0, whoosh = 0, rumble = 0, tau = 0.12 } = {}) {

        if (!enabled) { stopAmbience(); return; }
        ensureAll();

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
        }


        ensureLayer("wind", 380, "noise");
        ensureLayer("ocean", 160, "noise");
        ensureLayer("night", 2600, "noise");
        ensureLayer("whoosh", 120, "whoosh");
        ensureLayer("rumble", 100, "rumble");

        const t0 = audioCtx.currentTime;
        amb.windGain.gain.setTargetAtTime(Math.max(0.0001, wind), t0, tau);
        amb.oceanGain.gain.setTargetAtTime(Math.max(0.0001, ocean), t0, tau);
        amb.nightGain.gain.setTargetAtTime(Math.max(0.0001, night), t0, tau);
        amb.whooshGain.gain.setTargetAtTime(Math.max(0.0001, whoosh), t0, tau);
        amb.rumbleGain.gain.setTargetAtTime(Math.max(0.0001, rumble), t0, tau);

    }

    const SFX = {
        jump: () => tone({ freq: 320, dur: 0.07, type: "triangle", vol: 0.055, slideTo: 280 }),
        mouse: () => tone({ freq: 760, dur: 0.06, type: "sine", vol: 0.045, slideTo: 860 }),
        combo: () => chime(0.045),
        catnip: () => { tone({ freq: 420, dur: 0.10, type: "sine", vol: 0.045, slideTo: 520 }); setTimeout(() => tone({ freq: 620, dur: 0.10, type: "sine", vol: 0.038, slideTo: 700 }), 70); },
        fish: () => { tone({ freq: 540, dur: 0.08, type: "triangle", vol: 0.045, slideTo: 680 }); setTimeout(() => tone({ freq: 820, dur: 0.06, type: "sine", vol: 0.036, slideTo: 920 }), 80); },
        slow: () => tone({ freq: 220, dur: 0.10, type: "triangle", vol: 0.045, slideTo: 150 }),
        hit: () => tone({ freq: 170, dur: 0.14, type: "square", vol: 0.035, slideTo: 120 }),
        bark: () => bark(0.05),
        magic: () => { tone({ freq: 520, dur: 0.10, type: "sine", vol: 0.038, slideTo: 760 }); setTimeout(() => tone({ freq: 860, dur: 0.10, type: "sine", vol: 0.032, slideTo: 980 }), 90); },
        home: () => { tone({ freq: 330, dur: 0.12, type: "triangle", vol: 0.045, slideTo: 440 }); setTimeout(() => tone({ freq: 520, dur: 0.14, type: "sine", vol: 0.03, slideTo: 520 }), 140); },
        dash: () => tone({ freq: 520, dur: 0.05, type: "triangle", vol: 0.03, slideTo: 640 }),
    };

    if (soundBtnEl) {
        soundBtnEl.addEventListener("click", (e) => {
            e.preventDefault();
            ensureAll();
            setEnabled(!enabled);
        });
    }

    return { ensure: ensureAll, SFX, setAmbience, stopAmbience, get enabled() { return enabled; }, setEnabled };
}
