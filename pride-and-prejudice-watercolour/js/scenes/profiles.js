// Scene: Staring (pre-chorus 1: "And now he's staring at my eyes").
// Two silhouettes, as a Regency profile pair. Hers floods onto the page from the brow; on
// "staring" his floods in facing her; on "eyes" a line of light draws itself between their gazes
// and warm and cool washes bloom behind each of them.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 470, y: 230, s: 440 };
  const DC = { x: 1460, y: 212, s: 450 };

  WC.scenes.profiles = {
    build(B) {
      K.commonMasks(B);
      B.mask('bg', K.rect(34, 30, 1852, 1022), { maskScale: 0.3, margin: 80, flood: { seeds: [[960, 460]] } });
      B.mask('strokeWarm', (g) => { WC.brushStroke(g, [[90, 560], [160, 320], [340, 140], [560, 90], [760, 130]], 120); WC.brushStroke(g, [[110, 800], [160, 660], [250, 560]], 70); }, { maskScale: 0.45, margin: 60, flood: { seeds: [[90, 560], [110, 800]] } });
      B.mask('strokeCool', (g) => { WC.brushStroke(g, [[1830, 560], [1770, 320], [1580, 140], [1360, 90], [1170, 140]], 120); WC.brushStroke(g, [[1810, 800], [1760, 660], [1670, 560]], 70); }, { maskScale: 0.45, margin: 60, flood: { seeds: [[1830, 560], [1810, 800]] } });
      B.mask('bloomL', (g) => WC.fillEllipse(g, 520, 470, 430, 380, 0), { maskScale: 0.3, margin: 120, flood: { seeds: [[700, 450]] } });
      B.mask('bloomR', (g) => WC.fillEllipse(g, 1400, 470, 430, 380, 0), { maskScale: 0.3, margin: 120, flood: { seeds: [[1220, 450]] } });
      const L = C.bust(B, 'lz', { kind: 'lizzy', x: LZ.x, y: LZ.y, s: LZ.s, dir: 1 });
      const D = C.bust(B, 'dc', { kind: 'darcy', x: DC.x, y: DC.y, s: DC.s, dir: -1 });
      const a = [L.eye[0] + 40, L.eye[1]], b = [D.eye[0] - 40, D.eye[1]];
      B.mask('gaze', (g) => { g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 10, b[0], b[1]); g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 10, a[0], a[1]); g.fill(); }, { maskScale: 0.6, margin: 60, flood: { seeds: [a] } });
      B.mask('splatRose', K.splat(3, 300, 170, 240, 150, 55, 9), { margin: 20 });
      B.mask('splatIndigo', K.splat(5, 1640, 190, 220, 160, 55, 9), { margin: 20 });
    },

    render(eng, Mk, t) {
      const staring = A.word(5, 'staring'), eyes = A.word(5, 'eyes');
      const LI = Mk.lzInfo;
      const z = A.keys(t, [[29.25, 2.3], [30.4, 2.2], [32.8, 1.08], [36, 1.02]]);
      const c = A.keys(t, [[29.25, [LI.brow[0] + 60, LI.brow[1] + 40]], [30.4, [LI.brow[0] + 80, LI.brow[1] + 40]], [32.8, [960, 520]], [36, [960, 530]]]);
      const cam = K.cam(z, c[0], c[1]);
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);

      W(Mk.bg, { pig: '#f4e8d2', pigB: '#e4e6ea', mix: { dir: [1, 0], at: 960, width: 700, noise: 0.9, noiseScale: 260 }, density: 0.4, edge: 0.5, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5,
        flood: { at: pp(29.4, 2.2), soft: 90, noise: 90, edge: 0.4 }, seed: 1 });
      W(Mk.strokeWarm, { pig: '#efc2a4', pigB: '#e9a9b5', mix: { dir: [1, -0.5], at: 300, width: 200, noise: 0.8 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9,
        flood: { at: pp(30.2, 1.4), soft: 30, noise: 30 }, wet: K.wet(t, 30.2, 31.6), seed: 2 });
      W(Mk.strokeCool, { pig: '#c3d3d6', pigB: '#b9bfdc', mix: { dir: [0, 1], at: 400, width: 260, noise: 0.9 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9,
        flood: { at: pp(staring - 0.2, 1.4), soft: 30, noise: 30 }, wet: K.wet(t, staring - 0.2, staring + 1.2), seed: 3 });
      // on "eyes", warm and cool bloom behind them
      const bl = K.pp(t, eyes - 0.3, 2.0, A.inOut);
      if (bl > 0) {
        W(Mk.bloomL, { pig: '#f5c3b0', pigB: '#f0a9bb', mix: { dir: [1, 0], at: 520, width: 300, noise: 1.2, flow: 0.08 }, density: 0.45, soft: 40, edge: 0.7, edgeW: 20, warp: 50, warpScale: 180, flow: 0.7, flowScale: 90,
          flood: { at: bl, soft: 70, noise: 80, edge: 1.0, edgeW: 24 }, wet: 1, wetAmp: 16, seed: 4 });
        W(Mk.bloomR, { pig: '#b8c4e2', pigB: '#c8b8dc', mix: { dir: [1, 0], at: 1400, width: 300, noise: 1.2, flow: 0.08 }, density: 0.45, soft: 40, edge: 0.7, edgeW: 20, warp: 50, warpScale: 180, flow: 0.7, flowScale: 90,
          flood: { at: bl, soft: 70, noise: 80, edge: 1.0, edgeW: 24 }, wet: 1, wetAmp: 16, seed: 5 });
      }
      // the two silhouettes, flooding out from the brow
      C.paintBust(eng, Mk, 'lz', { cam, t, p: pp(29.35, 2.2), wet: K.wet(t, 29.35, 31.6) });
      C.paintBust(eng, Mk, 'dc', { cam, t, p: pp(staring - 0.7, 2.2), wet: K.wet(t, staring - 0.7, staring + 1.5) });
      W(Mk.splatRose, { pig: '#e58ea0', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 30, radial: { x: 300, y: 170, r: 20 + 280 * pp(30.8, 0.35), soft: 20 } });
      W(Mk.splatIndigo, { pig: '#7382ad', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 31, radial: { x: 1640, y: 190, r: 20 + 280 * pp(staring + 0.3, 0.35), soft: 20 } });

      // ---- light: their gaze, drawn out between them
      const gz = K.pp(t, eyes - 0.5, 1.2, A.inOut);
      if (gz > 0) {
        Lt(Mk.gaze, { colour: '#fff1d8', density: 0.5 * A.env(t, eyes - 0.5, 36.2, 0.5, 0.8), soft: 16, warp: 4, flood: { at: gz, soft: 40, noise: 20 }, seed: 40 });
        Lt(Mk.gaze, { colour: '#ffd9c0', density: 0.2 * A.env(t, eyes - 0.3, 36.2, 0.8, 0.8), soft: 70, warp: 10, seed: 41 });
      }
      K.motes(eng, cam, Mk.dot, t, { x: 960, y: 460, w: 700, h: 400, n: 16, r: 6, vy: -10, colour: '#ffe8c8', intensity: 0.4, alpha: pp(eyes - 0.2, 1.0), seed: 5 });

      // ---- ink: the pencil profiles before the paint
      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0';
      C.sketchBust(g, LI, K.pp(t, 29.3, 1.4, A.inOut));
      C.sketchBust(g, Mk.dcInfo, K.pp(t, staring - 0.9, 1.2, A.inOut));
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 6 });
    },
  };
})(window.WC = window.WC || {});
