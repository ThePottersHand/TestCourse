// The film: which scene plays when, how scenes hand over (wet-edged transitions), and the
// hand-lettered lyric overlay written on word by word in time with the vocal.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K;
  const Film = WC.Film = {};

  // ---- transitions ---------------------------------------------------------------------
  const corners = [[0, 0], [1920, 0], [0, 1080], [1920, 1080]];
  const TR = {
    bloom: (x, y, o = {}) => (p) => ({ type: 'bloom', x, y, r: -120 + A.inOut(p) * (o.reach || 2300), soft: o.soft || 40, noise: o.noise || 110, noiseScale: o.noiseScale || 170, tide: 0.45, tideW: 5, tideColour: o.tide || '#a3968a' }),
    wipe: (dx, dy, o = {}) => {
      const L = Math.hypot(dx, dy); dx /= L; dy /= L;
      const ds = corners.map(([x, y]) => x * dx + y * dy);
      const lo = Math.min(...ds) - 260, hi = Math.max(...ds) + 260;
      return (p) => ({ type: 'wipe', dir: [dx, dy], at: lo + (hi - lo) * A.inOut(p), soft: o.soft || 34, noise: o.noise || 120, noiseScale: o.noiseScale || 160, aniso: o.aniso || 1, tide: o.tideAmt != null ? o.tideAmt : 0.45, tideW: 5, tideColour: o.tide || '#a3968a' });
    },
  };

  // ---- schedule (seconds). Each entry fades in over `in` seconds from `from`.
  Film.schedule = [
    { scene: 'title', from: 0, in: 0 },
    { scene: 'ballroom', v: 'v1', from: 2.9, in: 0.9, tr: TR.bloom(960, 560, { reach: 2300 }) },
    { scene: 'mind', from: 12.95, in: 0.95, tr: TR.wipe(-1, -0.15) },
    { scene: 'profiles', v: 'c1', from: 29.25, in: 1.0, tr: TR.bloom(770, 420, { reach: 2400 }) },
    { scene: 'ballroom', v: 'v2', from: 55.7, in: 1.8, tr: TR.wipe(0.05, 1, { aniso: 4, noise: 150, noiseScale: 150, tide: '#8190b4' }) },
    { scene: 'oak', from: 68.45, in: 0.9, tr: TR.wipe(1, 0.1) },
    { scene: 'blush', from: 74.2, in: 0.9, tr: TR.bloom(760, 470, { reach: 2400 }) },
    { scene: 'sisters', from: 80.75, in: 0.8, tr: TR.wipe(-1, 0.1) },
    { scene: 'portrait', from: 85.45, in: 0.9, tr: TR.wipe(1, -0.1) },
    { scene: 'ballroom', v: 'dance', from: 112.55, in: 1.0, tr: TR.bloom(960, 520, { reach: 2300 }) },
    { scene: 'profiles', v: 'c3', from: 129.0, in: 0.9, tr: TR.bloom(960, 470, { reach: 2300 }) },
    { scene: 'dawn', from: 134.3, in: 1.6, tr: TR.wipe(0, -1, { noise: 160, noiseScale: 200, tide: '#c9a46a' }) },
  ];
  Film.duration = 151.32;

  Film.at = function (t) {
    const S = Film.schedule;
    let i = 0;
    for (let k = 0; k < S.length; k++) if (S[k].from <= t) i = k;
    const cur = S[i];
    if (i > 0 && t < cur.from + cur.in) return { a: S[i - 1], b: cur, p: (t - cur.from) / cur.in };
    return { a: cur };
  };

  // ---- building --------------------------------------------------------------------------
  Film.build = async function (eng, onProgress, only) {
    const used = [...new Set(Film.schedule.map((e) => e.scene))].filter((k) => !only || only.includes(k));
    const builders = {};
    let jobs = [];
    used.forEach((k) => { const B = new K.Builder(eng); WC.scenes[k].build(B); builders[k] = B; jobs = jobs.concat(B.jobs); });
    const total = jobs.length;
    let done = 0, last = performance.now();
    for (const job of jobs) {
      job(); done++;
      if (performance.now() - last > 30) { if (onProgress) onProgress(done / total); await new Promise((r) => setTimeout(r, 0)); last = performance.now(); }
    }
    if (onProgress) onProgress(1);
    Film.masks = {};
    used.forEach((k) => { Film.masks[k] = builders[k].M; });
    return Film.masks;
  };

  // ---- rendering ---------------------------------------------------------------------------
  Film.render = function (eng, t, opts = {}) {
    t = Math.max(0, Math.min(Film.duration, t));
    const s = Film.at(t);
    eng.setBoil(Math.floor(t * 12));
    const paint = (e) => { const sc = WC.scenes[e.scene]; if (sc && Film.masks[e.scene]) sc.render(eng, Film.masks[e.scene], t, e); };
    eng.begin(0); paint(s.a);
    let tr = null;
    if (s.b) { eng.begin(1); paint(s.b); tr = s.b.tr(A.clamp(s.p)); }
    let overlay = false, key = null;
    if (opts.lyrics !== false) { key = Film.lyrics(eng, t); overlay = key !== 'none'; }
    eng.present({ transition: tr, overlay, overlayKey: key, seed: 1 });
  };

  // ---- lyrics ----------------------------------------------------------------------------------
  // Channel colours in the overlay: R = iron-gall ink, G = rose paint, B = indigo paint.
  const COL = { like: '#0f0', heart: '#0f0', feel: '#0f0', hate: '#00f', worst: '#00f', rude: '#00f', mean: '#00f', tall: '#00f', strong: '#00f', wrong: '#00f', crime: '#00f', mind: '#0ff', eyes: '#0ff' };
  const GROUPS = [
    { lines: [0, 1], x: 960, y: [112, 190], size: 60 },
    { lines: [2], x: 1430, y: [960], size: 60 },
    { lines: [3, 4], x: 1430, y: [900, 978], size: 60 },
    { lines: [5], x: 960, y: [1010], size: 62 },
    { lines: [6, 7], x: 930, y: [944, 1016], size: 58 },
    { lines: [8, 9], x: 930, y: [944, 1016], size: 58 },
    { lines: [10], x: 930, y: [944, 1016], size: 58, split: 4 },
    { lines: [11, 12], x: 960, y: [112, 190], size: 60 },
    { lines: [13], x: 560, y: [150], size: 64 },
    { lines: [14], x: 1400, y: [990], size: 62 },
    { lines: [15], x: 960, y: [104], size: 62 },
    { lines: [16], x: 1160, y: [1010], size: 64 },
    { lines: [17, 18], x: [700, 900], y: [930, 1012], size: 84, align: 'left' },
    { lines: [19, 20], x: [640, 820], y: [930, 1012], size: 76, align: 'left' },
    { lines: [21], x: [640, 820], y: [930, 1012], size: 76, align: 'left', split: 4 },
    { lines: [22, 23], x: 960, y: [92, 160], size: 54 },
    { lines: [24, 25], x: 960, y: [92, 160], size: 54 },
    { lines: [26], x: 880, y: [950, 1020], size: 54, split: 4 },
  ];
  // Each group's visible window.
  (function () {
    const L = () => WC.TIMING.lines;
    GROUPS.forEach((G, i) => {
      G.start = () => L()[G.lines[0]].s - 0.15;
      G.end = () => {
        const lastEnd = L()[G.lines[G.lines.length - 1]].e;
        const next = GROUPS[i + 1] ? L()[GROUPS[i + 1].lines[0]].s - 0.3 : 1e9;
        return Math.min(next, lastEnd + 2.6);
      };
    });
  })();
  Film.lyricGroups = GROUPS;

  // Build the rows to draw: [{words:[[text, s, e]], x, y}]
  function rows(G) {
    const out = [];
    const xs = Array.isArray(G.x) ? G.x : null;
    G.lines.forEach((li, k) => {
      const W = WC.TIMING.lines[li].w;
      if (G.split) {
        out.push({ words: W.slice(0, G.split), x: xs ? xs[0] : G.x, y: G.y[0] });
        out.push({ words: W.slice(G.split), x: xs ? xs[1] : G.x, y: G.y[1] });
      } else out.push({ words: W, x: xs ? xs[k] : G.x, y: G.y[k] });
    });
    return out;
  }

  Film.lyrics = function (eng, t) {
    const G = GROUPS.find((g) => t >= g.start() && t < g.end());
    if (!G) return 'none';
    const fade = A.smooth((G.end() - t) / 0.45) * A.smooth((t - G.start()) / 0.15);
    const R = rows(G);
    const font = `${G.size}px ${K.FONT_SCRIPT}`;
    // state key: word progress quantised
    let key = GROUPS.indexOf(G) + ':' + Math.round(fade * 20);
    const prog = R.map((r) => r.words.map(([, s, e]) => { const p = A.ramp(t, s - 0.06, Math.max(e, s + 0.3)); key += ',' + Math.round(p * 24); return p; }));
    if (key === Film._lastKey && eng._overlayCanvas) return key;
    Film._lastKey = key;
    const g = eng.overlay();
    g.globalAlpha = fade;
    g.font = font;
    const space = g.measureText(' ').width;
    R.forEach((r, ri) => {
      const widths = r.words.map(([w]) => g.measureText(w).width);
      const total = widths.reduce((a, b) => a + b, 0) + space * (r.words.length - 1);
      let x = (G.align === 'left') ? r.x : r.x - total / 2;
      r.words.forEach(([w], wi) => {
        const col = COL[w.toLowerCase().replace(/[^a-z]/g, '')] || '#f00';
        K.writeText(g, w, x, r.y, font, prog[ri][wi], 'left', col);
        x += widths[wi] + space;
      });
    });
    g.globalAlpha = 1;
    return key;
  };
})(window.WC = window.WC || {});
