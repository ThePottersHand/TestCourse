/* The Starfall Expedition: sound effects.
   Every sound is synthesised live with the Web Audio API, so there are no
   audio files to download and it works offline. Call SFX.unlock() from a tap
   before the first sound (phones block audio until the player touches the screen). */
(function () {
  'use strict';

  let ctx = null, master = null, noiseBuf = null, hum = null, enabled = true;

  function init() {
    if (ctx) {
      if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) { /* ignore */ } }
      return ctx;
    }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    const g = buildGraph(ctx); master = g.master; noiseBuf = g.noiseBuf;
    // iPhone: let sounds play even when the ring/silent switch is on (iOS 17+).
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
    // iOS needs one sound started inside the tap to unlock audio
    try { const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(master); s.start(0); } catch (e) { /* ignore */ }
    return ctx;
  }
  function buildGraph(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4;
    const m = c.createGain(); m.gain.value = 3;
    m.connect(comp); comp.connect(c.destination);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return { master: m, noiseBuf: nb };
  }
  const T = (w) => ctx.currentTime + (w || 0);

  // One oscillator voice with an attack/decay envelope, optional pitch glide, filter and vibrato.
  function osc(o) {
    const t = T(o.at), dur = o.dur || 0.2, type = o.type || 'sine';
    const v = ctx.createOscillator(), g = ctx.createGain();
    v.type = type;
    v.frequency.setValueAtTime(o.f, t);
    if (o.f2) v.frequency.exponentialRampToValueAtTime(o.f2, t + dur * (o.glide || 1));
    if (o.f3) v.frequency.exponentialRampToValueAtTime(o.f3, t + dur);
    if (o.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
      l.connect(lg); lg.connect(v.frequency); l.start(t); l.stop(t + dur + 0.1);
    }
    const a = o.attack || 0.008, vol = o.vol || 0.1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.hold) g.gain.setValueAtTime(vol, t + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = v;
    if (o.lp) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t); f.Q.value = o.q || 1;
      if (o.lp2) f.frequency.exponentialRampToValueAtTime(o.lp2, t + dur);
      v.connect(f); out = f;
    }
    out.connect(g); g.connect(master);
    v.start(t); v.stop(t + dur + 0.05);
  }
  // Filtered white noise: whooshes, static, squelches, rumbles.
  function noise(o) {
    const t = T(o.at), dur = o.dur || 0.2;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.ftype || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const g = ctx.createGain(), vol = o.vol || 0.1, a = o.attack || 0.01;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  // A bell: fundamental plus slightly inharmonic overtones with a long ring.
  function bell(f, at, vol, dur) {
    osc({ f, at, dur: dur || 0.9, vol: vol || 0.08 });
    osc({ f: f * 2.01, at, dur: (dur || 0.9) * 0.6, vol: (vol || 0.08) * 0.35 });
    osc({ f: f * 3.03, at, dur: (dur || 0.9) * 0.35, vol: (vol || 0.08) * 0.15 });
  }
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI note to Hz
  const PENTA = [0, 2, 4, 7, 9, 12, 14];

  const S = {
    tap() { osc({ f: 1100, f2: 700, dur: 0.06, vol: 0.08, type: 'triangle' }); },

    // Zib speaks in quick alien chirps, like a tiny excited radio.
    zib(len, at) {
      const n = Math.max(4, Math.min(12, Math.round((len || 40) / 7)));
      for (let i = 0; i < n; i++) {
        const f = NOTE(79 + PENTA[Math.floor(Math.random() * PENTA.length)]);
        osc({ f, f2: f * (Math.random() < 0.5 ? 1.25 : 0.8), at: (at || 0) + i * 0.07, dur: 0.06, vol: 0.06, vib: [40, 30] });
      }
    },
    // Gloop talks in gloopy bubbles.
    gloop(len, at) {
      const n = Math.max(3, Math.min(7, Math.round((len || 40) / 12)));
      for (let i = 0; i < n; i++) {
        const base = 120 + Math.random() * 90;
        osc({ f: base, f2: base * 2.6, at: (at || 0) + i * 0.12, dur: 0.11, vol: 0.16, glide: 0.8 });
      }
      osc({ f: 90, f2: 60, at: at || 0, dur: n * 0.12, vol: 0.05, type: 'sawtooth', lp: 300 });
    },
    // Incoming transmission: a burst of radio static and two beeps.
    transmission(at) {
      noise({ at, dur: 0.28, f: 2400, q: 0.7, vol: 0.07 });
      osc({ f: 1320, at: (at || 0) + 0.3, dur: 0.07, vol: 0.05, type: 'square', lp: 3000 });
      osc({ f: 1760, at: (at || 0) + 0.4, dur: 0.09, vol: 0.05, type: 'square', lp: 3000 });
    },

    good() { [72, 76, 79, 84].forEach((n, i) => bell(NOTE(n), i * 0.08, 0.07, 0.8)); bell(NOTE(91), 0.36, 0.03, 0.6); },
    // Friendly cartoon "bwomp", never harsh.
    bad() {
      osc({ f: 330, f2: 196, dur: 0.32, vol: 0.09, type: 'sawtooth', lp: 1200, lp2: 400, glide: 0.9 });
      osc({ f: 247, f2: 123, at: 0.22, dur: 0.42, vol: 0.09, type: 'sawtooth', lp: 1000, lp2: 300, vib: [6, 6] });
    },
    hint() { [96, 93, 91, 88, 84].forEach((n, i) => osc({ f: NOTE(n), at: i * 0.05, dur: 0.3, vol: 0.04 })); },
    coin(at) { const a = at || 0; osc({ f: NOTE(83), at: a, dur: 0.09, vol: 0.06, type: 'square', lp: 4000 }); osc({ f: NOTE(88), at: a + 0.08, dur: 0.32, vol: 0.06, type: 'square', lp: 4000 }); },
    // Score counting up on the results screen.
    tally(secs) {
      const n = Math.round((secs || 1.2) / 0.06);
      for (let i = 0; i < n; i++) osc({ f: NOTE(72 + Math.round(i / n * 24)), at: i * 0.06, dur: 0.05, vol: 0.035, type: 'square', lp: 3500 });
      bell(NOTE(96), (secs || 1.2) + 0.02, 0.07, 1.2);
    },

    // Arriving at a checkpoint: a little brass fanfare with sparkles.
    arrive() {
      [[67, 0, 0.16], [72, 0.15, 0.16], [76, 0.3, 0.16], [79, 0.45, 0.6]].forEach(([n, at, d]) => {
        osc({ f: NOTE(n), at, dur: d + 0.15, vol: 0.08, type: 'sawtooth', lp: 2400, attack: 0.02, hold: d * 0.6 });
        osc({ f: NOTE(n - 12), at, dur: d + 0.15, vol: 0.05, type: 'triangle', hold: d * 0.6 });
      });
      [96, 100, 103].forEach((n, i) => osc({ f: NOTE(n), at: 0.7 + i * 0.06, dur: 0.4, vol: 0.03 }));
    },
    safe() { bell(NOTE(79), 0, 0.07, 0.7); bell(NOTE(86), 0.1, 0.06, 0.9); },
    go() {
      noise({ dur: 0.45, f: 400, f2: 3500, q: 1.5, vol: 0.05 });
      osc({ f: NOTE(72), at: 0.1, dur: 0.15, vol: 0.06, type: 'triangle' });
      osc({ f: NOTE(79), at: 0.22, dur: 0.3, vol: 0.06, type: 'triangle' });
    },

    // Scanner
    scanOpen() {
      osc({ f: 110, f2: 880, dur: 0.45, vol: 0.06, type: 'sawtooth', lp: 500, lp2: 4000, q: 4 });
      osc({ f: NOTE(84), at: 0.42, dur: 0.12, vol: 0.04, type: 'square', lp: 3000 });
      osc({ f: NOTE(91), at: 0.52, dur: 0.18, vol: 0.04, type: 'square', lp: 3000 });
    },
    ping(strength) {
      const s = Math.max(0, Math.min(1, strength || 0));
      const f = 620 + s * 900, vol = 0.07 + s * 0.08;
      osc({ f, dur: 0.22, vol });
      osc({ f, at: 0.13, dur: 0.18, vol: vol * 0.3 });
    },
    locked() {
      osc({ f: NOTE(88), dur: 0.06, vol: 0.05, type: 'square', lp: 4000 });
      osc({ f: NOTE(95), at: 0.08, dur: 0.1, vol: 0.05, type: 'square', lp: 4000 });
    },
    miss() { osc({ f: 900, f2: 300, dur: 0.2, vol: 0.12, type: 'triangle' }); },
    shard() {
      osc({ f: 140, f2: 55, dur: 0.2, vol: 0.18 });
      noise({ dur: 0.5, f: 1500, f2: 9000, ftype: 'highpass', vol: 0.04 });
      [91, 96, 100, 103, 108].forEach((n, i) => osc({ f: NOTE(n), at: 0.03 + i * 0.045, dur: 1.3, vol: 0.045 }));
    },
    caughtGloop() {
      osc({ f: 160, f2: 620, f3: 240, dur: 0.45, vol: 0.14, vib: [14, 60] });
      [0.35, 0.47, 0.6].forEach(at => { const b = 140 + Math.random() * 80; osc({ f: b, f2: b * 2.6, at, dur: 0.1, vol: 0.12 }); });
      this.shard();
    },
    ship() {
      osc({ f: 330, f2: 880, dur: 1.4, vol: 0.07, vib: [7, 40], attack: 0.1 });
      osc({ f: 331, f2: 882, dur: 1.4, vol: 0.05, type: 'triangle', vib: [5.5, 30], attack: 0.1 });
      [96, 100, 103, 108].forEach((n, i) => osc({ f: NOTE(n), at: 0.6 + i * 0.08, dur: 0.6, vol: 0.03 }));
    },

    // Travel
    warmer() { osc({ f: NOTE(76), f2: NOTE(79), dur: 0.12, vol: 0.06, type: 'triangle' }); osc({ f: NOTE(83), f2: NOTE(88), at: 0.11, dur: 0.18, vol: 0.06, type: 'triangle' }); },
    colder() { osc({ f: NOTE(81), f2: NOTE(76), dur: 0.14, vol: 0.05, type: 'triangle' }); osc({ f: NOTE(74), f2: NOTE(69), at: 0.13, dur: 0.22, vol: 0.05, type: 'triangle' }); },
    near() { [0, 0.12, 0.24].forEach(at => osc({ f: NOTE(88), at, dur: 0.08, vol: 0.07, type: 'square', lp: 3500 })); },
    // A soft sonar beacon while walking: faster and higher as the signal gets closer.
    beacon(strength) {
      const s = Math.max(0, Math.min(1, strength || 0));
      const f = 500 + s * 700;
      osc({ f, dur: 0.4, vol: 0.09 + s * 0.05 });
      osc({ f: f * 1.5, at: 0.02, dur: 0.25, vol: 0.03 });
    },

    // Path choices each have their own flavour
    pick(key) {
      if (key === 'glow') { [84, 88, 91, 96, 100].forEach((n, i) => osc({ f: NOTE(n), at: i * 0.05, dur: 0.5, vol: 0.045 })); }
      else if (key === 'slime') {
        noise({ dur: 0.35, f: 1400, f2: 180, ftype: 'lowpass', q: 6, vol: 0.2 });
        osc({ f: 160, f2: 60, dur: 0.3, vol: 0.12 });
        osc({ f: 130, f2: 340, at: 0.28, dur: 0.1, vol: 0.12 });
      }
      else if (key === 'comet') { noise({ dur: 0.7, f: 300, f2: 5000, q: 2, vol: 0.09 }); osc({ f: NOTE(84), f2: NOTE(96), at: 0.15, dur: 0.4, vol: 0.04 }); }
      else { bell(NOTE(76), 0, 0.06, 1.4); bell(NOTE(83), 0.2, 0.05, 1.4); }
    },

    // Bonus missions
    tick(urgent) { osc({ f: urgent ? 1500 : 1050, dur: 0.06, vol: 0.12, type: 'triangle' }); noise({ dur: 0.02, f: 4000, ftype: 'highpass', vol: 0.06 }); },
    gong() { [98, 196.5, 293, 392.8].forEach((f, i) => osc({ f, dur: 2.2 - i * 0.3, vol: 0.09 / (i + 1), vib: [3, 1.5] })); },
    plink(i) { bell(NOTE(84 + PENTA[Math.min(PENTA.length - 1, i || 0)]), 0, 0.12, 0.6); },
    shutter() { noise({ dur: 0.04, f: 3000, ftype: 'highpass', vol: 0.18 }); noise({ at: 0.09, dur: 0.06, f: 2000, ftype: 'highpass', vol: 0.12 }); },

    // Launch code and the finale
    tile(i) { osc({ f: NOTE(81 + PENTA[Math.min(PENTA.length - 1, i || 0)]), dur: 0.3, vol: 0.13, type: 'triangle' }); osc({ f: NOTE(93 + PENTA[Math.min(PENTA.length - 1, i || 0)]), dur: 0.2, vol: 0.04 }); },
    launch() {
      noise({ dur: 2.6, f: 120, f2: 1800, ftype: 'lowpass', q: 0.8, vol: 0.22, attack: 0.6 });
      osc({ f: 50, f2: 420, dur: 2.4, vol: 0.06, type: 'sawtooth', lp: 300, lp2: 2000, attack: 0.4 });
      osc({ f: 100, f2: 840, dur: 2.4, vol: 0.03, type: 'square', lp: 600, lp2: 3000, attack: 0.4 });
      this.fanfare(2.2);
    },
    fanfare(at) {
      const a = at || 0;
      [[67, 0, 0.12], [67, 0.14, 0.12], [67, 0.28, 0.12], [72, 0.42, 0.5], [76, 0.95, 0.2], [74, 1.17, 0.2], [76, 1.39, 0.2], [79, 1.6, 0.9]]
        .forEach(([n, t0, d]) => {
          osc({ f: NOTE(n), at: a + t0, dur: d + 0.2, vol: 0.08, type: 'sawtooth', lp: 2600, attack: 0.02, hold: d * 0.7 });
          osc({ f: NOTE(n - 12), at: a + t0, dur: d + 0.2, vol: 0.05, type: 'triangle', hold: d * 0.7 });
        });
      [72, 76, 79, 84].forEach(n => osc({ f: NOTE(n), at: a + 1.6, dur: 1.6, vol: 0.035, type: 'triangle', attack: 0.05 }));
      [96, 100, 103, 108].forEach((n, i) => osc({ f: NOTE(n), at: a + 1.7 + i * 0.07, dur: 0.6, vol: 0.03 }));
    }
  };

  // Low scanner hum that runs while the AR scanner is open.
  function startHum() {
    if (!enabled || !init() || hum) return;
    try {
      const t = T(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 3;
      const a = ctx.createOscillator(), b = ctx.createOscillator();
      a.type = 'sawtooth'; a.frequency.value = 110; b.type = 'sawtooth'; b.frequency.value = 110.7;
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 0.6; lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022, t + 0.6);
      a.connect(f); b.connect(f); f.connect(g); g.connect(master);
      a.start(t); b.start(t); lfo.start(t);
      hum = { g, nodes: [a, b, lfo] };
    } catch (e) { hum = null; }
  }
  function stopHum() {
    if (!hum || !ctx) return;
    const h = hum; hum = null;
    try {
      const t = T();
      h.g.gain.cancelScheduledValues(t); h.g.gain.setValueAtTime(h.g.gain.value, t); h.g.gain.linearRampToValueAtTime(0.0001, t + 0.25);
      h.nodes.forEach(n => n.stop(t + 0.3));
    } catch (e) { /* ignore */ }
  }

  window.SFX = {
    unlock: init,
    setEnabled(v) { enabled = !!v; if (!enabled) stopHum(); },
    get enabled() { return enabled; },
    play(name) {
      if (!enabled || !S[name]) return;
      if (!init()) return;
      try { S[name].apply(S, Array.prototype.slice.call(arguments, 1)); } catch (e) { /* ignore */ }
    },
    startHum, stopHum,
    names: Object.keys(S),
    // For automated checks: render one sound offline (silently) and report peak and loudness.
    _render(name, secs) {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const saved = [ctx, master, noiseBuf];
      const oc = new OAC(1, Math.round(44100 * secs), 44100);
      try {
        ctx = oc; const g = buildGraph(oc); master = g.master; noiseBuf = g.noiseBuf;
        S[name].apply(S, Array.prototype.slice.call(arguments, 2));
      } finally { ctx = saved[0]; master = saved[1]; noiseBuf = saved[2]; }
      return oc.startRendering().then(buf => {
        const d = buf.getChannelData(0); let peak = 0, sum = 0, last = 0;
        for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; if (a > 0.01) last = i; }
        return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), length: +(last / 44100).toFixed(2) };
      });
    }
  };
})();
