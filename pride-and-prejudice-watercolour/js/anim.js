// Animation helpers: easing, ramps, beat pulses and lyric-word lookups.
(function (WC) {
  'use strict';
  const A = WC.A = {};
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  A.clamp = clamp;
  A.lerp = (a, b, t) => a + (b - a) * t;
  A.ramp = (t, a, b) => clamp((t - a) / (b - a));
  A.smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  A.inOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  A.out = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
  A.in = (x) => { x = clamp(x); return x * x * x; };
  A.back = (x, k = 1.7) => { x = clamp(x); const c = k + 1; return 1 + c * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
  // eased ramp between two times
  A.ease = (t, a, b, fn = A.inOut) => fn(A.ramp(t, a, b));
  // 0 -> 1 -> 0 envelope: fade in over [a, a+fi], hold, fade out over [b-fo, b]
  A.env = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(A.smooth((t - a) / fi), A.smooth((b - t) / fo));
  // keyframes: [[t, v], ...] with easing between
  A.keys = (t, ks, fn = A.inOut) => {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) {
      if (t <= ks[i][0]) {
        const [t0, v0] = ks[i - 1], [t1, v1] = ks[i];
        const e = fn((t - t0) / (t1 - t0));
        if (Array.isArray(v0)) return v0.map((x, j) => x + (v1[j] - x) * e);
        return v0 + (v1 - v0) * e;
      }
    }
    return ks[ks.length - 1][1];
  };

  // ---- beats
  const beats = () => WC.TIMING.beats;
  A.beatIndex = (t) => { const b = beats(); let lo = 0, hi = b.length - 1; if (t < b[0]) return -1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (b[m] <= t) lo = m; else hi = m - 1; } return lo; };
  A.lastBeat = (t) => { const i = A.beatIndex(t); return i < 0 ? -1e9 : beats()[i]; };
  // exponential pulse after each beat (1 on the beat, decays with `decay` seconds)
  A.pulse = (t, decay = 0.18) => Math.exp(-(t - A.lastBeat(t)) / decay);
  // continuous beat phase (beat index + fraction)
  A.beatPhase = (t) => {
    const b = beats(), i = A.beatIndex(t);
    if (i < 0) return (t - b[0]) / 0.557;
    if (i >= b.length - 1) return i + (t - b[i]) / 0.557;
    return i + (t - b[i]) / (b[i + 1] - b[i]);
  };
  // most recent time in list `ts` at or before t (or -inf)
  A.since = (t, ts) => { let best = -1e9; for (const x of ts) if (x <= t && x > best) best = x; return t - best; };

  // ---- lyrics
  const norm = (s) => s.toLowerCase().replace(/[^a-z']/g, '');
  // start time of the n-th occurrence of `word` in line `li`
  A.word = (li, word, n = 0) => {
    const L = WC.TIMING.lines[li]; let k = 0;
    for (const w of L.w) if (norm(w[0]) === norm(word)) { if (k === n) return w[1]; k++; }
    return L.s;
  };
  A.line = (li) => WC.TIMING.lines[li];

  // deterministic per-index random
  A.hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
})(window.WC = window.WC || {});
