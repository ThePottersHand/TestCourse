// Scene: "And he makes me feel a certain way".
// Close on Elizabeth, her face flooding out from her eye. On "feel" the blush blooms, warmth
// floods out across the page from her cheek and glows, and roses open around her one per beat;
// on "certain way" her eyes close and light motes rise.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, C = WC.cast;
  WC.scenes = WC.scenes || {};
  const LZ = { x: 600, y: 230, s: 470 };
  const ROSES = [[1180, 300, 62, 0.3], [1380, 540, 74, 1.1], [1190, 780, 58, 2.0], [1580, 300, 52, 0.8], [1640, 720, 66, 2.6], [1000, 150, 40, 1.7], [1460, 930, 48, 0.2], [240, 200, 44, 1.4], [170, 640, 56, 2.2]];

  WC.scenes.blush = {
    build(B) {
      K.commonMasks(B);
      B.mask('bg', K.rect(34, 30, 1852, 1022), { maskScale: 0.3, margin: 80, flood: { seeds: [[760, 470]] } });
      const cheek = [LZ.x + 0.3 * LZ.s, LZ.y + 0.66 * LZ.s];
      B.mask('warm', (g) => { g.beginPath(); g.ellipse(900, 480, 900, 560, 0, 0, 7); g.fill(); }, { maskScale: 0.2, margin: 120, flood: { seeds: [cheek] } });
      B.mask('glow', (g) => WC.fillCircle(g, cheek[0], cheek[1], 170), { maskScale: 0.4, margin: 140 });
      C.lizzyBust(B, 'lz', LZ);
      ROSES.forEach(([x, y, r, rot], i) => {
        B.mask('rose' + i, (g) => WC.props.rose(g, x, y, r, rot), { margin: 30, flood: { seeds: [[x, y]] } });
        B.mask('roseC' + i, (g) => WC.props.roseCentre(g, x, y, r, rot), { margin: 20 });
        B.mask('leaf' + i, (g) => { WC.fillLock(g, x - r * 0.5, y + r * 0.6, x - r * 1.9, y + r * 1.3, r * 0.55, 0.3, 0.1); WC.fillLock(g, x + r * 0.6, y + r * 0.5, x + r * 1.8, y + r * 1.1, r * 0.5, -0.3, 0.1); }, { margin: 20, flood: { seeds: [[x, y + r * 0.6]] } });
      });
      B.mask('splat', K.splat(41, 1300, 520, 520, 420, 90, 8), { margin: 20 });
    },

    render(eng, Mk, t) {
      const feel = A.word(14, 'feel'), certain = A.word(14, 'certain');
      const cam = K.cam(A.keys(t, [[74.2, 1.0], [81.5, 1.12]]), A.keys(t, [[74.2, 960], [81.5, 820]]), A.keys(t, [[74.2, 540], [81.5, 480]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const LI = Mk.lzInfo;
      const warm = K.pp(t, feel - 0.4, 2.0, A.inOut);

      W(Mk.bg, { pig: '#f3e6d6', pigB: '#ece0e6', mix: { dir: [1, 0.3], at: 900, width: 600, noise: 0.9 }, density: 0.42, edge: 0.4, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5,
        flood: { at: K.pp(t, 74.3, 1.6), soft: 80, noise: 90 }, seed: 1 });
      // warmth floods out from her cheek across the page
      if (warm > 0) W(Mk.warm, { pig: '#f7cf98', pigB: '#f1a7b8', mix: { dir: [1, 0.2], at: 900, width: 300, noise: 1.1, flow: 0.06 }, density: 0.66, soft: 40, edge: 0.7, edgeW: 24, warp: 60, warpScale: 220, flow: 0.8, flowScale: 90, gran: 0.2,
        flood: { at: warm, soft: 80, noise: 110, edge: 1.0, edgeW: 30 }, wet: 1 - 0.5 * A.ramp(t, feel + 2, feel + 4), wetAmp: 20, wetScale: 160, seed: 2 });
      // roses open one per beat after "feel", each flooding out from its heart
      const bi = A.beatIndex(feel - 0.3);
      ROSES.forEach(([x, y, r], i) => {
        const tb = WC.TIMING.beats[bi + i] || feel;
        const k = K.pp(t, tb, 0.9);
        if (k <= 0) return;
        const wt = K.wet(t, tb, tb + 0.9);
        W(Mk['leaf' + i], { pig: '#8fae6a', pigB: '#6f8a4a', mix: { dir: [1, 1], at: x + y, width: 60, noise: 0.6 }, density: 0.85, edge: 1.3, edgeW: 3, soft: 1.1, warp: 2, warpScale: 40, rough: 1, seed: 10 + i,
          flood: { at: K.pp(t, tb + 0.2, 0.8), soft: 12, noise: 14 }, wet: wt });
        W(Mk['rose' + i], { pig: i % 3 === 1 ? '#e58ea0' : '#d9607e', pigB: '#f3b0bf', mix: { dir: [0, -1], at: -y, width: r, noise: 0.8 }, density: 0.95, hollow: 0.35, hollowW: r * 0.3, edge: 1.5, edgeW: 3, soft: 1.2, warp: 3, warpScale: 30, rough: 1.4, roughScale: 6, flow: 0.5, flowScale: 30, gran: 0.4,
          flood: { at: k, soft: 10, noise: 12, edge: 1.4, edgeW: 8 }, wet: wt, wetAmp: 5, wetScale: 30, seed: 20 + i }, M.about(x, y, 0.3 * (1 - k), 0.8 + 0.2 * k, 0.8 + 0.2 * k));
        W(Mk['roseC' + i], { pig: '#a83a5a', density: 0.9, edge: 1.2, edgeW: 2, soft: 1, warp: 1, seed: 30 + i, alpha: A.ramp(k, 0.4, 1) }, M.about(x, y, 0.3 * (1 - k), 0.8 + 0.2 * k, 0.8 + 0.2 * k));
      });

      // Elizabeth
      const bl = K.pp(t, feel - 0.2, 1.4);
      C.paintLizzyBust(eng, Mk, 'lz', { cam, t, p: K.pp(t, 74.4, 1.8), wet: K.wet(t, 74.4, 76.2), blush: 0.2 + 0.9 * bl, sway: 3 });
      K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 74.6, [1900, 200], [900, 900], 9, (i) => i % 3 !== 1, 77, { stagger: 0.55, dur: 5, life: 7, arc: 120 }));
      if (warm > 0) W(Mk.splat, { pig: '#e58ea0', density: 0.85, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 12, radial: { x: 1300, y: 520, r: 700 * warm, soft: 40 } });

      // ---- light: a glow from the blush, warm motes rising when her eyes close
      Lt(Mk.glow, { colour: '#ffc9a8', density: 0.2 * bl * (0.85 + 0.15 * Math.sin(t * 2.2)), soft: 90, warp: 20, seed: 40 });
      Lt(Mk.warm, { colour: '#ffe0b0', density: 0.14 * warm, soft: 120, warp: 60, seed: 41, radial: { x: 800, y: 480, r: 700, soft: 300 } });
      K.motes(eng, cam, Mk.dot, t, { x: 900, y: 620, w: 1300, h: 700, n: 26, r: 7, vy: -34, colour: '#ffe2b0', intensity: 0.5, alpha: K.pp(t, certain - 0.4, 1.2), seed: 12 });

      // ---- ink: her eye (drawn first), then closing on "certain way"
      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      C.inkLizzyBust(g, LI, { p: K.pp(t, 74.25, 0.9, (x) => x), closed: t > certain - 0.05 });
      g.strokeStyle = '#0f0';
      C.sketchLizzy(g, LI, K.pp(t, 74.3, 1.3, A.inOut));
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 8 });
    },
  };
})(window.WC = window.WC || {});
