// Fruit Punch - all sound effects and music are synthesized with the Web Audio API.
// No audio files are needed.
(function () {
  let ctx = null, master, sfxBus, musicBus, noiseBuf;
  let muted = false, musicOn = true;
  let chargeOsc = null, chargeGain = null;
  let lastTaunt = 0;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = musicOn ? 0.16 : 0;
    musicBus.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  const ok = () => ctx && ctx.state === 'running';
  const now = () => ctx.currentTime;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function envelope(g, t, attack, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function tone(o) {
    const t = o.t != null ? o.t : now();
    const dur = o.dur || 0.2, attack = o.attack || 0.005;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    if (o.vib) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = o.vib;
      lg.gain.value = o.vibDepth || o.f0 * 0.05;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + attack + dur + 0.05);
    }
    envelope(g, t, attack, o.vol || 0.3, dur);
    let node = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = o.filter;
      f.frequency.value = o.ff || 1000;
      f.Q.value = o.q || 1;
      node.connect(f);
      node = f;
    }
    node.connect(g).connect(o.dest || sfxBus);
    osc.start(t);
    osc.stop(t + attack + dur + 0.05);
  }

  function noise(o) {
    const t = o.t != null ? o.t : now();
    const dur = o.dur || 0.2, attack = o.attack || 0.003;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.f0 || 1000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    envelope(g, t, attack, o.vol || 0.3, dur);
    src.connect(f).connect(g).connect(o.dest || sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + attack + dur + 0.05);
  }

  const S = {
    init,
    get muted() { return muted; },
    get musicOn() { return musicOn; },
    setMuted(m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, now(), 0.02);
    },
    setMusic(on) {
      musicOn = on;
      if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.16 : 0, now(), 0.05);
    },

    punch() {
      if (!ok()) return;
      noise({ f0: 2600, f1: 300, dur: 0.12, vol: 0.55 });
      tone({ type: 'sine', f0: 190, f1: 50, dur: 0.16, vol: 0.85 });
    },
    power() {
      if (!ok()) return;
      noise({ f0: 3500, f1: 90, dur: 0.5, vol: 0.85 });
      tone({ type: 'sine', f0: 130, f1: 28, dur: 0.55, vol: 1 });
      tone({ type: 'square', f0: 90, f1: 35, dur: 0.3, vol: 0.12 });
    },
    whoosh() {
      if (!ok()) return;
      noise({ filter: 'bandpass', f0: 350, f1: 2600, dur: 0.18, vol: 0.35, q: 2, attack: 0.04 });
    },
    bonk() {
      if (!ok()) return;
      tone({ type: 'sine', f0: 720, f1: 480, dur: 0.09, vol: 0.5 });
      tone({ type: 'triangle', f0: 1450, dur: 0.05, vol: 0.18 });
    },
    oof(pitch) {
      if (!ok()) return;
      const p = pitch || 1;
      tone({ type: 'triangle', f0: 330 * p, f1: 120 * p, dur: 0.22, vol: 0.4 });
    },
    splat() {
      if (!ok()) return;
      const t = now();
      noise({ f0: 1400, f1: 180, dur: 0.28, vol: 0.6 });
      for (let i = 0; i < 4; i++) {
        const f = 300 + Math.random() * 500;
        tone({ type: 'sine', f0: f, f1: f * 0.5, dur: 0.06, vol: 0.2, t: t + 0.04 + i * 0.045 });
      }
    },
    pop() {
      if (!ok()) return;
      tone({ type: 'sine', f0: 900, f1: 180, dur: 0.12, vol: 0.4 });
      noise({ filter: 'highpass', f0: 1500, dur: 0.08, vol: 0.3 });
    },
    boing() {
      if (!ok()) return;
      tone({ type: 'sine', f0: 170, f1: 560, dur: 0.16, vol: 0.12, vib: 18, vibDepth: 30 });
    },
    // Classic playground "nyah nyah" chant on a nasal synth voice
    nyah(pitch) {
      if (!ok()) return;
      const p = pitch || 1;
      const notes = [79, 76, 81, 79, 76];
      const t = now();
      notes.forEach((n, i) => {
        tone({
          type: 'sawtooth', f0: midi(n - 12) * p, dur: 0.15, vol: 0.12, t: t + i * 0.17,
          filter: 'bandpass', ff: 1300, q: 3, attack: 0.02, vib: 7, vibDepth: 6,
        });
      });
    },
    raspberry() {
      if (!ok()) return;
      const t = now();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      const f = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.linearRampToValueAtTime(70, t + 0.6);
      f.type = 'lowpass';
      f.frequency.value = 1100;
      lfo.frequency.value = 32;
      lg.gain.value = 0.18;
      lfo.connect(lg).connect(g.gain);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.04);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(f).connect(g).connect(sfxBus);
      osc.start(t); lfo.start(t);
      osc.stop(t + 0.65); lfo.stop(t + 0.65);
    },
    laugh(pitch) {
      if (!ok()) return;
      const p = pitch || 1;
      const t = now();
      for (let i = 0; i < 4; i++) {
        tone({
          type: 'triangle', f0: (620 - i * 50) * p, f1: (440 - i * 40) * p, dur: 0.1, vol: 0.2,
          t: t + i * 0.13, vib: 25, vibDepth: 30,
        });
      }
    },
    taunt(kind, pitch) {
      if (!ok()) return;
      if (now() - lastTaunt < 0.7) return;
      lastTaunt = now();
      if (kind === 'butt') S.raspberry();
      else if (kind === 'laugh' || kind === 'dance') S.laugh(pitch);
      else if (kind === 'yawn') tone({ type: 'sine', f0: 300 * pitch, f1: 160 * pitch, dur: 0.6, vol: 0.18, attack: 0.15 });
      else S.nyah(pitch);
    },
    chargeStart() {
      if (!ok()) return;
      S.chargeStop();
      const t = now();
      chargeOsc = ctx.createOscillator();
      chargeGain = ctx.createGain();
      chargeOsc.type = 'square';
      chargeOsc.frequency.setValueAtTime(140, t);
      chargeOsc.frequency.exponentialRampToValueAtTime(880, t + 1.0);
      chargeGain.gain.setValueAtTime(0.0001, t);
      chargeGain.gain.exponentialRampToValueAtTime(0.05, t + 0.25);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1800;
      chargeOsc.connect(f).connect(chargeGain).connect(sfxBus);
      chargeOsc.start(t);
    },
    chargeStop() {
      if (chargeOsc) {
        try {
          chargeGain.gain.setTargetAtTime(0.0001, now(), 0.02);
          chargeOsc.stop(now() + 0.1);
        } catch (e) { /* already stopped */ }
        chargeOsc = null;
      }
    },
    ding(level) {
      if (!ok()) return;
      const base = 880 * Math.pow(2, Math.min(level || 0, 8) / 12);
      tone({ type: 'sine', f0: base, dur: 0.25, vol: 0.25 });
      tone({ type: 'sine', f0: base * 1.5, dur: 0.3, vol: 0.15, t: now() + 0.06 });
    },
    tick() {
      if (!ok()) return;
      tone({ type: 'square', f0: 1200, dur: 0.03, vol: 0.08 });
    },
    click() {
      if (!ok()) return;
      tone({ type: 'sine', f0: 620, f1: 900, dur: 0.06, vol: 0.25 });
    },
    fight() {
      if (!ok()) return;
      const t = now();
      [60, 64, 67].forEach((n, i) => tone({ type: 'square', f0: midi(n), dur: 0.08, vol: 0.1, t: t + i * 0.07 }));
      tone({ type: 'square', f0: midi(72), dur: 0.35, vol: 0.12, t: t + 0.21 });
      noise({ f0: 4000, f1: 500, dur: 0.3, vol: 0.2, t: t + 0.21 });
    },
    win() {
      if (!ok()) return;
      const t = now();
      [72, 76, 79, 84, 79, 84].forEach((n, i) => {
        tone({ type: 'square', f0: midi(n), dur: 0.12, vol: 0.12, t: t + i * 0.11, filter: 'lowpass', ff: 3000 });
      });
      [72, 76, 79].forEach((n) => tone({ type: 'triangle', f0: midi(n), dur: 0.8, vol: 0.15, t: t + 0.7 }));
    },
    // Sad trombone: wah wah wah waaah
    fail() {
      if (!ok()) return;
      const t = now();
      [55, 54, 53].forEach((n, i) => {
        tone({ type: 'sawtooth', f0: midi(n), dur: 0.35, vol: 0.18, t: t + i * 0.42, filter: 'lowpass', ff: 900, attack: 0.04 });
      });
      tone({ type: 'sawtooth', f0: midi(52), dur: 1.1, vol: 0.18, t: t + 1.26, filter: 'lowpass', ff: 900, attack: 0.04, vib: 5, vibDepth: 4 });
    },
    star(i) {
      if (!ok()) return;
      tone({ type: 'triangle', f0: midi(76 + i * 4), dur: 0.3, vol: 0.2 });
      tone({ type: 'sine', f0: midi(88 + i * 4), dur: 0.2, vol: 0.08 });
    },
  };

  // ---------------- Music: tiny chiptune sequencer ----------------
  const MAJOR = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
  const MINOR = [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]];
  const MELODY = [
    [0, -1, 1, 2, 1, -1, 0, -1],
    [2, 1, 0, 1, 2, -1, 2, -1],
    [1, -1, 2, 3, 2, 1, 0, -1],
    [0, 1, 2, -1, 1, 0, -1, -1],
  ];
  let music = null;

  S.startMusic = function (opts) {
    S.stopMusic();
    if (!ctx) return;
    const o = Object.assign({ root: 60, tempo: 128, minor: false }, opts || {});
    const step = 60 / o.tempo / 2; // eighth notes
    const chords = o.minor ? MINOR : MAJOR;
    let nextTime = now() + 0.1;
    let stepIdx = 0;
    const timer = setInterval(() => {
      if (!ok()) return;
      while (nextTime < now() + 0.15) {
        const bar = Math.floor(stepIdx / 8) % 4;
        const s = stepIdx % 8;
        const chord = chords[bar];
        // bass on beats
        if (s % 2 === 0) {
          const bn = o.root - 24 + (s % 4 === 0 ? chord[0] : chord[2]);
          tone({ type: 'triangle', f0: midi(bn), dur: step * 1.6, vol: 0.5, t: nextTime, dest: musicBus });
        }
        // melody
        const m = MELODY[(bar + Math.floor(stepIdx / 32)) % 4][s];
        if (m >= 0) {
          const n = o.root + chord[m % 3] + (m >= 3 ? 12 : 0);
          tone({ type: 'square', f0: midi(n), dur: step * 0.8, vol: 0.13, t: nextTime, dest: musicBus, filter: 'lowpass', ff: 2400 });
        }
        // hat
        if (s % 2 === 1) noise({ filter: 'highpass', f0: 7000, dur: 0.03, vol: 0.12, t: nextTime, dest: musicBus });
        nextTime += step;
        stepIdx++;
      }
    }, 30);
    music = { timer };
  };
  S.stopMusic = function () {
    if (music) {
      clearInterval(music.timer);
      music = null;
    }
  };

  window.Sfx = S;
})();
