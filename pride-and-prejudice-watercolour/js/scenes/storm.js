// Scene: The Storm (interlude + verse 2, lines 1-2).
// The proposal in the rain (chapter 34). A storm floods down the sheet, the temple and the bent
// tree are laid in, rain streams across everything, the wind tears at her skirts. "rude":
// lightning, and she draws herself up. "mean":
// lightning again. Each flash throws them into black silhouette against the lit sky. "And he
// says stuff he shouldn't say": he leans in, and his words are lifted out of the dark sky in
// light, then the rain runs them down the page.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const TEMPLE = { x: 400, y: 706, w: 290 };
  const TREE = { x: 1660, y: 790, h: 560 };
  const RP = 540, SLANT = 0.22;          // rain pattern period (px) and slant (dx per dy)
  const WORDS = [
    { text: 'your inferiority', x: 1330, y: 300, size: 62, word: [12, 'says'] },
    { text: 'a degradation', x: 1390, y: 372, size: 62, word: [12, 'stuff'] },
  ];

  // rain streaks tiled along the slant so the pattern can scroll seamlessly
  const rainDraw = (seed, n, len, w) => (g) => {
    const r = WC.rng(seed);
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = -300 + r() * 2500, y = r() * RP, l = len * (0.5 + r()), lw = w * (0.5 + r());
      for (let k = -1; k <= 3; k++) {
        const xx = x + k * RP * SLANT, yy = y + k * RP;
        g.lineWidth = lw; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + SLANT * l, yy + l); g.stroke();
      }
    }
  };
  const bolt = (seed, x0, y0, x1, y1, n) => {
    const r = WC.rng(seed), pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([A.lerp(x0, x1, u) + (i && i < n ? (r() - 0.5) * 70 : 0), A.lerp(y0, y1, u)]); }
    return pts;
  };
  const BOLTS = [bolt(3, 1260, -40, 1340, 560, 9), bolt(8, 700, -40, 560, 640, 10)];

  WC.scenes.storm = {
    build(B) {
      K.commonMasks(B);
      B.mask('sky', K.rect(-80, -80, 2080, 900), { maskScale: 0.25, margin: 60, flood: { seeds: [[300, -60], [960, -60], [1600, -60]] } });
      B.mask('flash', K.frame(40), { maskScale: 0.2, margin: 20 });
      B.mask('hills', (g) => { g.beginPath(); WC.spline(g, [[-100, 700], [260, 660], [620, 690], [1000, 655], [1400, 690], [2000, 650]], false, 1); g.lineTo(2020, 900); g.lineTo(-100, 900); g.fill(); }, { maskScale: 0.35, flood: { seeds: [[-60, 700]] } });
      B.mask('temple', (g) => WC.props.temple(g, TEMPLE.x, TEMPLE.y, TEMPLE.w), { margin: 20, flood: { seeds: [[TEMPLE.x, TEMPLE.y - 1.2 * TEMPLE.w]] } });
      B.mask('templeGaps', (g) => WC.props.templeGaps(g, TEMPLE.x, TEMPLE.y, TEMPLE.w), { margin: 12 });
      B.mask('trunk', (g) => WC.props.oakTrunk(g, TREE.x, TREE.y, TREE.h), { maskScale: 0.6, flood: { seeds: [[TREE.x, TREE.y]] } });
      B.mask('canopy', (g) => WC.props.oakCanopy(g, TREE.x, TREE.y, TREE.h, WC.rng(5)), { maskScale: 0.4, flood: { seeds: [[TREE.x, TREE.y - 0.6 * TREE.h]] } });
      B.mask('ground', K.rect(-80, 740, 2080, 420), { maskScale: 0.25, margin: 60, flood: { seeds: [[960, 1150]] } });
      B.mask('puddles', (g) => [[520, 1030, 200], [1420, 1050, 260], [980, 1100, 180]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 0.09, 0, 0, 7); g.fill(); }), { maskScale: 0.5, margin: 30 });
      B.mask('rainFar', rainDraw(11, 520, 26, 1.6), { area: { x: -400, y: -700, w: 2800, h: 2200 }, maskScale: 0.6, margin: 10 });
      B.mask('rainNear', rainDraw(12, 150, 70, 2.6), { area: { x: -400, y: -700, w: 2800, h: 2200 }, maskScale: 0.6, margin: 10 });
      BOLTS.forEach((pts, i) => B.mask('bolt' + i, (g) => { g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }, { margin: 30, maskScale: 0.8 }));
      WORDS.forEach((w, i) => B.mask('word' + i, (g) => { g.font = `${w.size}px ${K.FONT_SCRIPT}`; g.fillText(w.text, w.x, w.y); }, { margin: 90, maskScale: 1 }));
      C.lizzy(B, 'lz', { x: 740, y: 1010, s: 86, dir: 1, pose: P.lizzy.poses.stand(0) });
      C.darcy(B, 'dc', { x: 1190, y: 1016, s: 94, dir: -1, pose: P.darcy.poses.still() });
    },

    render(eng, Mk, t) {
      const rude = A.word(11, 'rude'), mean = A.word(11, 'mean'), saysT = A.word(12, 'says'), shouldnt = A.word(12, "shouldn't"), sayT = A.word(12, 'say');
      const cam = K.cam(A.keys(t, [[55.7, 1.0], [68.5, 1.1]]), A.keys(t, [[55.7, 960], [68.5, 985]]), A.keys(t, [[55.7, 540], [68.5, 585]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      // lightning envelopes (a strike and a flicker)
      const strike = (t0) => (t < t0 ? 0 : Math.exp(-(t - t0) / 0.1) + 0.7 * (t > t0 + 0.16 ? Math.exp(-(t - t0 - 0.16) / 0.14) : 0));
      const f1 = strike(rude - 0.02), f2 = strike(mean - 0.02), flash = Math.max(f1, 1.2 * f2);
      const gust = 0.5 + 0.5 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 1) + 0.6 * A.env(t, mean, mean + 2.5, 0.2, 1.5);

      // ---- the storm floods down the sheet
      W(Mk.sky, { pig: '#c9c9d8', pigB: '#6a6c93', mix: { dir: [0, 1], at: 330, width: 220, noise: 0.9, noiseScale: 300 }, density: 0.75, edge: 0.5, edgeW: 16, soft: 4, warp: 30, warpScale: 260, rough: 5, flow: 0.5, flowScale: 200, gran: 0.25,
        flood: { at: K.pp(t, 55.8, 1.5), soft: 70, noise: 90, edge: 1.0, edgeW: 30 }, wet: 1, wetAmp: 10, wetScale: 220, seed: 1 });
      // churning clouds: marbled light and dark, always moving
      W(Mk.sky, { pig: '#f2eeea', pigB: '#4f5178', mix: { dir: [0.3, 1], at: 380, width: 240, noise: 1.5, noiseScale: 260, flow: 0.07, vein: 0.25 }, density: 0.55, soft: 6, edge: 0.2, warp: 40, warpScale: 300, flow: 0.6, flowScale: 160, gran: 0.2,
        flood: { at: K.pp(t, 56.1, 1.6), soft: 70, noise: 90 }, wet: 1, wetAmp: 16, wetScale: 180, seed: 2 });
      W(Mk.hills, { pig: '#8b8fae', pigB: '#6f7f8f', mix: { dir: [1, 0], at: 960, width: 600, noise: 0.8 }, density: 0.7, edge: 1.1, edgeW: 5, soft: 2, warp: 8, warpScale: 140, rough: 3, flow: 0.5, gran: 0.35,
        flood: { at: K.pp(t, 56.4, 1.3), soft: 40, noise: 60, edge: 1.0 }, wet: K.wet(t, 56.4, 57.7), seed: 3 });
      W(Mk.temple, { pig: '#a4a8c4', pigB: '#8e93b4', mix: { dir: [1, 0], at: TEMPLE.x, width: 80, noise: 0.5 }, density: 0.8, edge: 1.3, edgeW: 3, soft: 1, warp: 2, warpScale: 60, rough: 1, flow: 0.4, gran: 0.4,
        flood: { at: K.pp(t, 56.7, 1.2), soft: 16, noise: 20 }, seed: 4 });
      W(Mk.templeGaps, { pig: '#555a80', density: 0.8 * K.pp(t, 57.4, 0.6), edge: 1, edgeW: 3, soft: 1, warp: 1.5, rough: 0.8, seed: 5 });
      const bend = (0.05 + 0.05 * gust) * K.pp(t, 57.0, 1.0);
      const treeXf = [1, 0, -bend, 1, bend * TREE.y, 0];   // shear about the base: the top leans with the wind
      W(Mk.trunk, { pig: '#4c4a60', density: 0.95, edge: 1.2, edgeW: 3, soft: 1, warp: 2, rough: 1.2, gran: 0.5, flood: { at: K.pp(t, 56.9, 1.0), soft: 20, noise: 20 }, seed: 6 }, treeXf);
      W(Mk.canopy, { pig: '#5b6b6e', pigB: '#44485f', mix: { dir: [0.4, 1], at: 500, width: 160, noise: 1, flow: 0.08 }, density: 0.85, edge: 1.1, edgeW: 5, soft: 2, warp: 10, warpScale: 60, rough: 4, roughScale: 10, flow: 0.6, flowScale: 50, gran: 0.5,
        flood: { at: K.pp(t, 57.1, 1.3), soft: 30, noise: 40 }, wet: 0.6 + 0.4 * gust, wetAmp: 8, wetScale: 50, seed: 7 }, treeXf);
      W(Mk.ground, { pig: '#8a978e', pigB: '#5d6a78', mix: { dir: [0, 1], at: 900, width: 200, noise: 0.9 }, density: 0.75, edge: 0.2, edgeW: 20, soft: 8, warp: 16, warpScale: 200, rough: 4, flow: 0.5, flowScale: 150, gran: 0.35,
        flood: { at: K.pp(t, 56.2, 1.4), soft: 50, noise: 70, edge: 0.9 }, wet: 1, wetAmp: 8, wetScale: 160, seed: 8 });
      W(Mk.puddles, { mode: 'lift', lift: 0.35 * K.pp(t, 57.5, 1.0), soft: 5, warp: 6, warpScale: 40, rough: 2, seed: 9 });
      W(Mk.dot, { pig: '#46495f', density: 0.35 * K.pp(t, 58, 1), soft: 18, warp: 5, seed: 10 }, M.mul(M.tr(740, 1012), M.sc(2.0, 0.2)));
      W(Mk.dot, { pig: '#46495f', density: 0.35 * K.pp(t, 58.5, 1), soft: 18, warp: 5, seed: 11 }, M.mul(M.tr(1190, 1018), M.sc(2.0, 0.2)));

      // ---- the two of them, soaked, turning away from each other
      // no turning: she draws herself up on "rude", he leans in as he says what he shouldn't
      const lzLean = -0.035 * A.ease(t, rude - 0.1, rude + 0.6) * (1 - A.ease(t, 66, 68));
      const dcLean = 0.05 * A.keys(t, [[saysT - 0.6, 0], [saysT + 0.4, 1], [shouldnt + 0.4, 1], [68.4, 0.4]]);
      const wind = 7 + 6 * gust;
      const lxf = M.about(740, 1010, lzLean), dxf = M.about(1190, 1016, -dcLean);
      const dark = Math.min(1, flash * 3);   // lightning throws them into black silhouette
      C.paint(eng, Mk, 'lz', { cam, xf: lxf, t, p: K.pp(t, 57.0, 2.0), wet: K.wet(t, 57.0, 59.0), sway: wind, omega: 2.4, wind: -0.3 - 0.05 * wind, seed: 5,
        pig: K.mixHex('#7e3558', '#241a2c', dark), pigB: K.mixHex('#c96a88', '#2c2032', dark) });
      C.paint(eng, Mk, 'dc', { cam, xf: dxf, t, p: K.pp(t, 57.6, 2.0), wet: K.wet(t, 57.6, 59.6), sway: wind * 0.8, omega: 2.2, wind: 0.3 + 0.04 * wind, seed: 6,
        pig: K.mixHex('#1f2750', '#141424', dark), pigB: K.mixHex('#3e4d85', '#1a1a2c', dark) });

      // ---- his words, lifted out of the sky in light, then run down the page by the rain
      WORDS.forEach((w, i) => {
        const w0 = A.word(w.word[0], w.word[1]);
        const wr = K.pp(t, w0 - 0.15, 0.9, (x) => x);
        if (wr <= 0) return;
        const run = A.ramp(t, shouldnt - 0.1, sayT + 0.8), fade = 1 - A.ramp(t, sayT + 0.2, 68.4);
        const o = { mode: 'lift', lift: 0.8 * fade, soft: 1.2, warp: 2, warpScale: 30, rough: 1, seed: 20 + i,
          reveal: { dir: [1, 0], at: w.x - 40 + 560 * wr, soft: 30, noise: 10 }, drip: run > 0 ? { amp: 110 * A.out(run), scale: 16 } : null, wet: run, wetAmp: 6, wetScale: 30 };
        W(Mk['word' + i], o);
        Lt(Mk['word' + i], { colour: '#e4e8ff', density: 0.35 * fade * (1 - 0.5 * run), soft: 8, warp: 2, seed: 30 + i, reveal: o.reveal, drip: o.drip });
      });

      // ---- rain: two sheets of streaks falling at different speeds, over everything
      const rain = K.pp(t, 55.9, 1.2);
      const fall = (speed) => { const d = (t * speed) % RP; return M.tr(SLANT * d, d); };
      W(Mk.rainFar, { mode: 'lift', lift: 0.28 * rain, soft: 0.9, warp: 0, rough: 0.3, seed: 40 }, fall(760));
      W(Mk.rainNear, { pig: '#5d6288', density: 0.3 * rain, soft: 1.1, edge: 0.4, warp: 0, rough: 0.4, seed: 41 }, fall(1500));
      W(Mk.rainNear, { mode: 'lift', lift: 0.3 * rain, soft: 1.2, warp: 0, rough: 0.4, seed: 42 }, M.mul(fall(1500), M.tr(14, 40)));
      // splashes: small rings lifted on the ground, each lasting a moment
      for (let i = 0; i < 26; i++) {
        const h = (k) => A.hash(i * 13 + k), per = 0.45 + 0.3 * h(1), ph = ((t + h(2) * per) % per) / per;
        const x = h(3) * 1920, y = 790 + Math.pow(h(4), 0.8) * 300;
        W(Mk.dot, { mode: 'lift', lift: 0.45 * rain * (1 - ph), soft: 1, hollow: 1, hollowW: 2, rim: 0, warp: 1, seed: 50 + i }, M.mul(M.tr(x, y), M.sc(0.12 + 0.2 * ph, 0.03 + 0.05 * ph)));
      }

      // ---- lightning
      [[0, f1], [1, f2]].forEach(([i, f]) => {
        if (f <= 0.01) return;
        W(Mk['bolt' + i], { mode: 'lift', lift: Math.min(1, f), soft: 1, warp: 1, rough: 0.5, seed: 60 + i });
        Lt(Mk['bolt' + i], { colour: '#f1f0ff', density: 1.4 * f, soft: 4, warp: 1, seed: 62 + i });
        Lt(Mk['bolt' + i], { colour: '#c7c9ff', density: 0.5 * f, soft: 60, warp: 10, seed: 64 + i });
      });
      if (flash > 0.01) Lt(Mk.flash, { colour: '#dfe2ff', density: 0.42 * Math.min(1, flash), soft: 30, warp: 0, seed: 66 });

      // ---- ink: pencil horizon and temple, their eyes
      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0';
      C.pen(g, [[-40, 702], [700, 690], [1960, 676]], K.pp(t, 55.8, 1.2, A.inOut), 1.1, 4);
      const tp = K.pp(t, 56.0, 1.2, A.inOut), k = TEMPLE.w / 100;
      C.pen(g, [[TEMPLE.x - 52 * k, TEMPLE.y + 2], [TEMPLE.x - 44 * k, TEMPLE.y - 82 * k], [TEMPLE.x, TEMPLE.y - 126 * k], [TEMPLE.x + 44 * k, TEMPLE.y - 82 * k], [TEMPLE.x + 52 * k, TEMPLE.y + 2]], tp, 1.2, 8);
      eng.ink({ strength: [1.7, 0.5, 1.2], seed: 7 });
    },
  };
})(window.WC = window.WC || {});
