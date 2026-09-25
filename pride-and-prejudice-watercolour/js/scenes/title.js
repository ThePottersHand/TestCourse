// Scene: Title. A drop lands on the blank sheet and blooms rose; light passes over as the
// title is inked in.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat;
  WC.scenes = WC.scenes || {};

  WC.scenes.title = {
    build(B) {
      K.commonMasks(B);
      B.mask('bloom', (g) => { g.beginPath(); g.ellipse(960, 530, 470, 250, -0.04, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.5, margin: 120, flood: { seeds: [[960, 530]] } });
      B.mask('ring', (g) => { g.beginPath(); g.ellipse(960, 530, 150, 90, 0.1, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.6, margin: 60 });
      B.mask('drop', K.splat(21, 960, 530, 170, 110, 70, 11), { margin: 20 });
      B.mask('dropIndigo', K.splat(22, 1180, 610, 200, 90, 30, 7), { margin: 20 });
      B.mask('band', (g) => { g.beginPath(); g.moveTo(-90, 180); g.lineTo(90, 180); g.lineTo(150, 900); g.lineTo(-30, 900); g.fill(); }, { maskScale: 0.4, margin: 80 });
      B.mask('glow', (g) => WC.fillCircle(g, 960, 530, 260), { maskScale: 0.4, margin: 140 });
    },
    render(eng, Mk, t) {
      const cam = K.cam(A.lerp(1.0, 1.04, A.ramp(t, 0, 3.8)), 960, 540);
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const land = K.pp(t, 0.2, 0.25);
      const grow = K.pp(t, 0.3, 1.8);
      if (land > 0) W(Mk.drop, { pig: '#e58ea0', density: 0.95, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 1, radial: { x: 960, y: 530, r: 40 + 260 * land, soft: 20 } });
      if (grow > 0) {
        W(Mk.bloom, { pig: '#f2b6c1', pigB: '#e6c2a2', mix: { dir: [1, 0.2], at: 960, width: 320, noise: 1, flow: 0.15 }, density: 0.7, hollow: 0.5, hollowW: 120, edge: 1.3, edgeW: 7,
          soft: 2, warp: 22, warpScale: 140, rough: 5, roughScale: 22, flow: 0.7, flowScale: 90, gran: 0.35, seed: 2, wet: K.wet(t, 0.3, 2.1), wetAmp: 14,
          flood: { at: grow, soft: 40, noise: 70, edge: 1.4, edgeW: 22 } });
        W(Mk.ring, { mode: 'lift', lift: 0.35 * grow, soft: 3, warp: 14, warpScale: 40, rough: 5, roughScale: 9, seed: 3 });
        W(Mk.ring, { pig: '#d97b93', rim: 1, edge: 1.2, edgeW: 2.2, density: 1, soft: 1.2, warp: 14, warpScale: 40, rough: 5, roughScale: 9, seed: 3, alpha: grow });
      }
      const ind = K.pp(t, 1.9, 0.3);
      if (ind > 0) W(Mk.dropIndigo, { pig: '#7382ad', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 4, radial: { x: 1180, y: 610, r: 260 * ind, soft: 20 } });
      // light: a warm glow where the drop landed, then a band of light passing over the title
      Lt(Mk.glow, { colour: '#ffd6a8', density: 0.32 * A.env(t, 0.25, 3.6, 0.4, 1.2), soft: 120, warp: 30, seed: 5 });
      const sx = A.lerp(260, 1700, A.ease(t, 0.9, 3.3));
      Lt(Mk.band, { colour: '#fff0d0', density: 0.3 * A.env(t, 0.9, 3.3, 0.5, 0.6), soft: 60, warp: 20, streak: { angle: 1.4, amt: 0.6, len: 200 }, seed: 6 }, M.tr(sx, 0));

      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0'; g.lineWidth = 1.1;
      const rule = K.pp(t, 0.05, 0.7, A.inOut);
      [[560, 0], [458, 1]].forEach(([y, k]) => { if (rule > 0) { g.beginPath(); g.moveTo(330, y + k); g.lineTo(330 + 1260 * rule, y - k); g.stroke(); } });
      K.writeText(g, 'The Art of Making Up My Mind', 960, 545, `92px ${K.FONT_TITLE}`, A.ramp(t, 0.6, 2.3), 'center', '#f00');
      K.writeText(g, "Elizabeth Bennet's thoughts on Mr Darcy", 960, 628, `44px ${K.FONT_SCRIPT}`, A.ramp(t, 1.8, 3.0), 'center', '#f00');
      eng.ink({ strength: [1.7, 0.5, 1.2], seed: 2 });
    },
  };
})(window.WC = window.WC || {});
