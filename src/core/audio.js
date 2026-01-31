export function createAudio(soundBtnEl) {
  let audioCtx = null;
  let enabled = (localStorage.getItem("purrkour_sfx") ?? "on") === "on";

  function ensure() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  }

  function setEnabled(on) {
    enabled = !!on;
    localStorage.setItem("purrkour_sfx", enabled ? "on" : "off");
    if (soundBtnEl) soundBtnEl.textContent = enabled ? "🔊" : "🔇";
  }
  setEnabled(enabled);

  function tone({ freq=440, dur=0.08, type="sine", vol=0.05, slideTo=null }) {
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

    o.connect(g).connect(audioCtx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // warmer/“weicher” Bark: zwei kurze Thumps + Lowpass
  function bark(vol = 0.05) {
    if (!enabled || !audioCtx) return;
    const t0 = audioCtx.currentTime;

    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(820, t0);
    lp.Q.setValueAtTime(0.7, t0);

    const out = audioCtx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);

    lp.connect(out).connect(audioCtx.destination);

    function thump(start, f1, f2) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(f1, start);
      o.frequency.exponentialRampToValueAtTime(f2, start + 0.06);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(1.0, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
      o.connect(g).connect(lp);
      o.start(start);
      o.stop(start + 0.11);
    }
    thump(t0, 240, 175);
    thump(t0 + 0.07, 210, 160);
  }

  function chime(vol=0.045) {
    tone({ freq:660, dur:0.08, type:"sine", vol, slideTo:740 });
    setTimeout(() => tone({ freq:880, dur:0.10, type:"sine", vol:vol*0.9, slideTo:990 }), 70);
    setTimeout(() => tone({ freq:740, dur:0.12, type:"triangle", vol:vol*0.65, slideTo:820 }), 150);
  }

  const SFX = {
    jump: () => tone({ freq:320, dur:0.07, type:"triangle", vol:0.055, slideTo:280 }),
    mouse: () => tone({ freq:760, dur:0.06, type:"sine", vol:0.045, slideTo:860 }),
    combo: () => chime(0.045),
    catnip: () => { tone({freq:420,dur:0.10,type:"sine",vol:0.045,slideTo:520}); setTimeout(()=>tone({freq:620,dur:0.10,type:"sine",vol:0.038,slideTo:700}),70); },
    fish: () => { tone({freq:540,dur:0.08,type:"triangle",vol:0.045,slideTo:680}); setTimeout(()=>tone({freq:820,dur:0.06,type:"sine",vol:0.036,slideTo:920}),80); },
    slow: () => tone({ freq:220, dur:0.10, type:"triangle", vol:0.045, slideTo:150 }),
    hit: () => tone({ freq:170, dur:0.14, type:"square", vol:0.035, slideTo:120 }),
    bark: () => bark(0.05),
    magic: () => { tone({freq:520,dur:0.10,type:"sine",vol:0.038,slideTo:760}); setTimeout(()=>tone({freq:860,dur:0.10,type:"sine",vol:0.032,slideTo:980}),90); },
    home: () => { tone({freq:330,dur:0.12,type:"triangle",vol:0.045,slideTo:440}); setTimeout(()=>tone({freq:520,dur:0.14,type:"sine",vol:0.03,slideTo:520}),140); },
    dash: () => tone({ freq:520, dur:0.05, type:"triangle", vol:0.03, slideTo:640 }),
  };

  if (soundBtnEl) {
    soundBtnEl.addEventListener("click", (e) => {
      e.preventDefault();
      ensure();
      setEnabled(!enabled);
    });
  }

  return { ensure, SFX, get enabled(){return enabled;}, setEnabled };
}
