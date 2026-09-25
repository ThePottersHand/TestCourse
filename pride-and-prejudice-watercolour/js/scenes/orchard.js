// Scene: Blossom (verse 2, line 4: "And he makes me feel a certain way").
// An orchard in April. Elizabeth stands under the old tree looking up into its branches; on
// "feel" the blossom bursts open outward from the branches above her across the whole tree, she
// sways back as a gust lifts the petals and swirls them round her, and warm light floods the
// grass. On "certain way" the petals rise.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const SUN = [1560, 150];
  const LZ = { x: 900, y: 890, s: 60 };
  const TREE = { x: 640, y: 900 };
  const BLOOM = [965, 370];                // the branches above her, where she is looking
  // Blossom trees, grown once: a trunk, limbs spreading up and out, branches, then twigs.
  // Each tree keeps its segments (for the wood) and twig ends (where the blossom clusters).
  const grow = (x, y, h, seed, spread = 1) => {
    const r = WC.rng(seed), segs = [], tips = [];
    const limb = (x0, y0, a, len, w, depth) => {
      const bend = (r() - 0.5) * 0.5, mx = x0 + Math.cos(a + bend) * len * 0.5, my = y0 + Math.sin(a + bend) * len * 0.5;
      const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
      segs.push([x0, y0, mx, my, x1, y1, w, w * 0.62]);
      if (depth <= 0) { tips.push([x1, y1]); return; }
      const k = depth > 1 ? 2 + (r() < 0.6 ? 1 : 0) : 3;
      for (let i = 0; i < k; i++) limb(x1, y1, a + (i - (k - 1) / 2) * 0.55 * spread + (r() - 0.5) * 0.35, len * (0.62 + 0.18 * r()), w * 0.62, depth - 1);
      if (depth <= 2) tips.push([mx, my]);
    };
    segs.push([x, y, x + h * 0.02, y - h * 0.18, x + h * 0.03, y - h * 0.34, h * 0.075, h * 0.05]);
    [-2.55, -2.05, -1.6, -1.15, -0.65].forEach((a) => limb(x + h * 0.03, y - h * 0.33, a + (r() - 0.5) * 0.2, h * (0.22 + 0.08 * r()), h * 0.042, 3));
    return { segs, tips };
  };
  const TREES = [grow(640, 900, 900, 11), grow(1580, 742, 430, 12), grow(150, 748, 410, 13)];
  const drawWood = (g, T) => { g.lineCap = 'round'; T.segs.forEach(([x0, y0, mx, my, x1, y1, w0, w1]) => { for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6, P = (u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1]; const a = P(u0), b = P(u1); g.lineWidth = w0 + (w1 - w0) * (u0 + u1) / 2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }); };
  const drawBloom = (g, T, seed, k = 1) => { const r = WC.rng(seed); T.tips.forEach(([x, y]) => { const m = 3 + Math.floor(r() * 4); for (let j = 0; j < m; j++) WC.fillCircle(g, x + (r() - 0.5) * 50 * k, y + (r() - 0.6) * 40 * k, (8 + r() * 12) * k); }); };

  WC.scenes.orchard = {
    build(B) {
      K.commonMasks(B);
      B.mask('sky', K.rect(-200, -200, 2400, 950), { maskScale: 0.2, margin: 60, flood: { seeds: [SUN] } });
      B.mask('hills', (g) => { g.beginPath(); WC.spline(g, [[-200, 640], [300, 610], [800, 632], [1300, 600], [1800, 628], [2200, 612]], false, 1); g.lineTo(2200, 900); g.lineTo(-200, 900); g.fill(); }, { maskScale: 0.3, flood: { seeds: [[2100, 620]] } });
      B.mask('hedge', (g) => K.hedge(g, [[-200, 690], [500, 668], [1100, 684], [1700, 662], [2200, 676]], 16, WC.rng(8), 0.2), { maskScale: 0.4, margin: 30, flood: { seeds: [[2150, 680]] } });
      B.mask('meadow', (g) => { g.beginPath(); WC.spline(g, [[-200, 720], [600, 700], [1300, 716], [2200, 700]], false, 1); g.lineTo(2200, 1300); g.lineTo(-200, 1300); g.fill(); }, { maskScale: 0.2, margin: 50, flood: { seeds: [[LZ.x, 1000]] } });
      B.mask('trunks', (g) => { g.strokeStyle = '#fff'; TREES.forEach((T) => drawWood(g, T)); }, { maskScale: 0.5, margin: 20, flood: { seeds: [[TREE.x, TREE.y], [1580, 742], [150, 748]] } });
      TREES.forEach((T, i) => B.mask('bloom' + i, (g) => drawBloom(g, T, 30 + i, i ? 0.7 : 1), { maskScale: 0.5, margin: 30 }));
      B.mask('flowers', K.splat(29, 1000, 1000, 1200, 190, 260, 5, 2), { margin: 12 });
      B.mask('grass', (g) => K.grass(g, -200, 2200, 1010, 420, 20, 56, WC.rng(21), 0.4, (x) => Math.abs(x - LZ.x) < 60), { maskScale: 0.6, margin: 16 });
      B.mask('shade', (g) => WC.fillEllipse(g, TREE.x + 60, 930, 520, 70, 0), { maskScale: 0.3, margin: 60 });
      B.mask('glow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 380), { maskScale: 0.25, margin: 160 });
      B.mask('warmth', (g) => WC.fillEllipse(g, LZ.x + 60, 640, 900, 520, 0), { maskScale: 0.2, margin: 120, flood: { seeds: [[LZ.x + 80, 520]] } });
      B.mask('dapple', (g) => { const r = WC.rng(33); for (let i = 0; i < 40; i++) WC.fillEllipse(g, 200 + r() * 1300, 880 + r() * 140, 18 + r() * 30, 6 + r() * 8, 0); }, { maskScale: 0.4, margin: 30 });
      C.lizzy(B, 'lz', { x: LZ.x, y: LZ.y, s: LZ.s, dir: 1, pose: { torso: -0.05, head: -0.3, upper: 0.08, fore: -0.4, skirt: 0.01 }, streamers: 0 });
    },

    render(eng, Mk, t) {
      const feel = A.word(14, 'feel'), certain = A.word(14, 'certain');
      const cam = K.cam(A.keys(t, [[74.2, 1.0], [80.8, 1.12]]), A.keys(t, [[74.2, 930], [80.8, 920]]), A.keys(t, [[74.2, 560], [80.8, 520]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);
      const burst = K.pp(t, feel - 0.25, 1.8, A.inOut);
      const gust = A.env(t, feel, feel + 3.5, 0.3, 1.6);
      const breeze = 0.5 + 0.5 * Math.sin(t * 1.1);

      // ---- the orchard paints itself in
      W(Mk.sky, { pig: '#b9cbe2', pigB: '#f5e4c6', mix: { dir: [0, 1], at: 400, width: 300, noise: 0.8, noiseScale: 300 }, density: 0.55, edge: 0.4, edgeW: 16, soft: 4, warp: 30, warpScale: 260, rough: 4, flow: 0.45, flowScale: 220, gran: 0.15,
        flood: { at: pp(74.25, 1.3), soft: 80, noise: 90, edge: 0.7, edgeW: 30 }, wet: K.wet(t, 74.25, 75.5), seed: 1 });
      W(Mk.hills, { pig: '#aebdb0', pigB: '#b8b4cc', mix: { dir: [1, 0], at: 900, width: 700, noise: 0.8 }, density: 0.5, edge: 1, edgeW: 5, soft: 2, warp: 10, warpScale: 160, rough: 3, flow: 0.4, gran: 0.3, flood: { at: pp(74.4, 1.2), soft: 40, noise: 60 }, seed: 2 });
      W(Mk.hedge, { pig: '#7d9a6a', pigB: '#62806a', mix: { dir: [0, 1], at: 670, width: 40, noise: 0.8 }, density: 0.7, edge: 1, edgeW: 3, soft: 1.5, warp: 3, rough: 2, gran: 0.5, flood: { at: pp(74.6, 1.2), soft: 30, noise: 30 }, seed: 3 });
      W(Mk.meadow, { pig: '#b6c883', pigB: '#86a466', mix: { dir: [0, 1], at: 900, width: 200, noise: 1.2, noiseScale: 200 }, density: 0.65, edge: 0.6, edgeW: 10, soft: 3, warp: 16, warpScale: 200, rough: 4, flow: 0.5, flowScale: 150, gran: 0.3,
        flood: { at: pp(74.3, 1.4), soft: 60, noise: 70 }, wet: K.wet(t, 74.3, 75.7), seed: 4 });
      W(Mk.shade, { pig: '#6f7f7a', density: 0.35 * pp(75.0, 1.0), soft: 40, warp: 20, seed: 5 });
      const bend = 0.006 * breeze + 0.02 * gust;
      const treeXf = (bx, by) => [1, 0, -bend, 1, bend * by, 0];
      W(Mk.trunks, { pig: '#6a5560', pigB: '#4a4458', mix: { dir: [0, 1], at: 600, width: 200, noise: 0.8 }, density: 0.85, edge: 1.2, edgeW: 3, soft: 1, warp: 2.5, warpScale: 40, rough: 1.5, gran: 0.6,
        flood: { at: pp(74.5, 1.4), soft: 20, noise: 20 }, wet: K.wet(t, 74.5, 75.9), seed: 6 }, treeXf(0, TREE.y));
      // blossom: in bud at first, bursting open outward from the branches above her on "feel"
      [[760, 360], [1580, 470], [150, 470]].forEach(([cx0, cy0], i) => {
        const c = { x: cx0, y: cy0, ry: i ? 140 : 250 };
        const x0 = i === 0 ? BLOOM[0] : c.x, y0 = i === 0 ? BLOOM[1] : c.y;
        const open = i === 0 ? burst : K.pp(t, feel + 0.2 + 0.25 * i, 1.4, A.inOut);
        const sway = { amp: 3 + 6 * gust, y0: -1e5, y1: -1e5 + 1, k: 1, omega: 1.4, wave: 1e6, phase: i, axis: [0, -1], lean: -0.5 * gust, waveX: 300 };
        W(Mk['bloom' + i], { pig: '#b98a96', pigB: '#8fa06e', mix: { dir: [0, 1], at: c.y, width: c.ry, noise: 1.5 }, density: 0.5 * pp(74.8 + 0.2 * i, 1.0), soft: 2, edge: 0.9, edgeW: 3, warp: 3, warpScale: 30, rough: 2, gran: 0.4, sway, seed: 10 + i,
          grow: -6 * (1 - open) }, treeXf(0, TREE.y));
        if (open > 0) W(Mk['bloom' + i], { pig: '#f4b9c6', pigB: '#fbeaee', mix: { dir: [-0.4, 1], at: c.y * 0.9, width: 120, noise: 1.8, noiseScale: 80 }, density: 0.85, soft: 1.5, edge: 1.3, edgeW: 3, warp: 3, warpScale: 30, rough: 2, flow: 0.5, flowScale: 40, gran: 0.3,
          radial: { x: x0, y: y0, r: 30 + 1100 * open, soft: 90 }, wet: 1 - 0.7 * A.ramp(t, feel + 2, feel + 4), wetAmp: 4, wetScale: 30, sway, seed: 20 + i }, treeXf(0, TREE.y));
      });
      W(Mk.grass, { pig: '#6e8b58', density: 0.65 * pp(75.0, 0.8), edge: 0.9, edgeW: 2, soft: 1, warp: 1, rough: 0.5, gran: 0.4,
        sway: { amp: 3 + 8 * gust, y0: -1020, y1: -960, k: 1.3, omega: 2.2, wave: 1e6, phase: 0, axis: [0, -1], lean: 0.2 + 0.5 * gust, waveX: 260 }, seed: 30 });
      W(Mk.flowers, { pig: '#f2e4a0', pigB: '#e8a6b8', mix: { dir: [1, 0], at: 900, width: 40, noise: 3 }, density: 0.8 * pp(75.2, 1.0), edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 31, radial: { x: LZ.x, y: 1000, r: 200 + 1400 * burst, soft: 80 } });

      // ---- Elizabeth, looking up into the branches; she sways back a little as the blossom bursts
      W(Mk.dot, { pig: '#55664a', density: 0.35 * pp(75.0, 0.8), soft: 14, warp: 4, seed: 32 }, M.mul(M.tr(LZ.x + 10, LZ.y + 2), M.sc(1.5, 0.14)));
      const lean = -0.022 * A.env(t, feel - 0.4, feel + 3.2, 0.9, 1.8);
      C.paint(eng, Mk, 'lz', { cam, xf: M.about(LZ.x, LZ.y, lean), t, p: pp(74.6, 1.4), wet: K.wet(t, 74.6, 76.0), sway: 3 + 5 * gust, omega: 1.8, wind: -0.3 * gust, seed: 4 });

      // petals: a few drifting down from the start, then the gust swirls them round her and up
      let petals = K.petalFlight(t, 74.6, [700, 300], [900, 950], 8, (i) => i % 3 !== 1, 5, { stagger: 0.7, dur: 4, life: 6, arc: 60, size: 30 });
      for (let k = 0; k < 3; k++) petals = petals.concat(K.petalFlight(t, feel + k * 0.35, [BLOOM[0] + 120 - k * 80, BLOOM[1] - 40], [LZ.x - 600 + k * 300, 300 - k * 60], 9, (i) => (i + k) % 3 !== 1, 60 + k, { stagger: 0.09, dur: 3.0, life: 4.5, arc: -300 + k * 150, size: 34 }));
      K.paintPetals(eng, cam, Mk.petal, petals, { rose: '#f2b3c2', indigo: '#fbe7ec' });

      // ---- light: sun, dappled light through the branches, warmth flooding out on "feel"
      Lt(Mk.glow, { colour: '#ffe6b8', density: 0.22 * pp(74.3, 1.2), soft: 160, warp: 30, seed: 40 });
      Lt(Mk.dapple, { colour: '#fff0c8', density: 0.22 * pp(75.2, 1.0) * (0.7 + 0.3 * Math.sin(t * 3)), soft: 10, warp: 12, seed: 41 }, M.tr(8 * Math.sin(t * 1.3), 0));
      if (burst > 0) Lt(Mk.warmth, { colour: '#ffd6c0', density: 0.2 * A.env(t, feel - 0.2, 81, 0.8, 1.0), soft: 160, warp: 50, flood: { at: burst, soft: 120, noise: 90 }, seed: 42 });
      K.motes(eng, cam, Mk.dot, t, { x: LZ.x, y: 600, w: 1200, h: 700, n: 24, r: 7, vy: -30, colour: '#ffe8c0', intensity: 0.5, alpha: pp(certain - 0.5, 1.2), seed: 13 });

      // two brimstone butterflies
      [[0, 1.0], [1, 1.7]].forEach(([i, sp]) => {
        const u = t - 75 - i * 0.8; if (u < 0) return;
        const x = 1250 - u * 60 * sp + Math.sin(u * 2.3 + i) * 70, y = 760 - u * 18 + Math.sin(u * 3.1 + i * 2) * 40, f = 0.25 + 0.75 * Math.abs(Math.sin(t * 16 + i));
        [-1, 1].forEach((d) => W(Mk.petal, { pig: '#f2d770', density: 0.9, soft: 1, edge: 1.3, edgeW: 2, warp: 0.5, seed: 70 + i }, M.mul(M.tr(x, y), [0, -0.16 * d * f, 0.12, 0, 0, 0])));
      });
    },
  };
})(window.WC = window.WC || {});
