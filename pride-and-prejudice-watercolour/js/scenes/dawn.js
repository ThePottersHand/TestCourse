// Scene: Dawn (outro). Mind made up. The dawn sky floods out from the sun, the misty fields are
// laid in, and the two of them are painted into the mist, drifting together until their hands
// meet. The sun rises between them, their rose and indigo merge into violet, the title is
// inked in, and the whole painting dries and fades back into the paper.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};
  const SUN = [912, 600];
  const LZ = { x: 860, y: 868, s: 40 }, DC = { x: 968, y: 870, s: 43 };
  // their silhouettes start in their own colours and meet in violet
  const VIOLET = ['#4f3a66', '#8e6fae'];

  WC.scenes.dawn = {
    build(B) {
      K.commonMasks(B);
      B.mask('sky', K.rect(-60, -60, 2040, 860), { maskScale: 0.25, margin: 60, flood: { seeds: [SUN] } });
      B.mask('sun', (g) => WC.fillCircle(g, SUN[0], SUN[1], 64), { maskScale: 0.6, margin: 80 });
      B.mask('glow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 380), { maskScale: 0.3, margin: 160 });
      B.mask('rays', (g) => { for (let i = 0; i < 14; i++) { const a = -Math.PI + (i + 0.5) * (Math.PI / 14), w = 0.03 + 0.02 * ((i * 7) % 3) / 2, L = 1600; g.beginPath(); g.moveTo(SUN[0], SUN[1]); g.lineTo(SUN[0] + Math.cos(a - w) * L, SUN[1] + Math.sin(a - w) * L); g.lineTo(SUN[0] + Math.cos(a + w) * L, SUN[1] + Math.sin(a + w) * L); g.fill(); } }, { maskScale: 0.25, margin: 40 });
      const hill = (pts, seed) => [(g) => { g.beginPath(); WC.spline(g, pts, false, 1); g.lineTo(2000, 1160); g.lineTo(-80, 1160); g.closePath(); g.fill(); }, { maskScale: 0.3, flood: { seeds: [seed] } }];
      B.mask('hillFar', ...hill([[-80, 640], [300, 610], [700, 630], [1100, 615], [1500, 636], [2000, 620]], [SUN[0], 650]));
      B.mask('hillMid', ...hill([[-80, 720], [260, 690], [640, 710], [1000, 730], [1400, 702], [2000, 730]], [SUN[0], 740]));
      B.mask('hillNear', ...hill([[-80, 830], [400, 840], [800, 848], [1200, 842], [1600, 830], [2000, 840]], [SUN[0], 900]));
      B.mask('mist', (g) => { [[500, 670, 520, 20], [1300, 680, 560, 18], [900, 760, 700, 22], [300, 790, 400, 16], [1600, 775, 420, 18]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }); }, { maskScale: 0.4, margin: 60 });
      B.mask('mistNear', (g) => { [[700, 872, 380, 26], [1150, 876, 420, 24], [920, 890, 600, 20]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }); }, { maskScale: 0.4, margin: 60 });
      B.mask('grass', (g) => { const r = WC.rng(33); g.lineCap = 'round'; for (let i = 0; i < 220; i++) { const x = r() * 1960 - 20, y = 900 + r() * 220, h = 16 + r() * 42; g.lineWidth = 2 + r() * 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5, y - h * 0.6, x + 10 * (r() - 0.3), y - h); g.stroke(); } }, { maskScale: 0.7, margin: 12 });
      B.mask('flowers', K.splat(61, 960, 990, 980, 100, 120, 5, 2), { margin: 12 });
      B.mask('trees', (g) => { const r = WC.rng(8); [[240, 698], [320, 692], [1560, 706], [1640, 698], [1700, 704]].forEach(([x, y]) => { for (let k = 0; k < 6; k++) WC.fillCircle(g, x + (r() - 0.5) * 34, y - 24 - r() * 26, 12 + r() * 12); g.fillRect(x - 2.5, y - 20, 5, 22); }); }, { maskScale: 0.6, margin: 20, flood: { seeds: [[280, 700], [1640, 700]] } });
      C.lizzy(B, 'lz', { x: LZ.x, y: LZ.y, s: LZ.s, dir: 1, pose: P.lizzy.poses.reach(0, 0.62) });
      C.darcy(B, 'dc', { x: DC.x, y: DC.y, s: DC.s, dir: -1, pose: P.darcy.poses.reach(0, 0.62) });
    },

    render(eng, Mk, t) {
      const fin = A.ease(t, 148.6, 151.3);
      const cam = K.cam(A.keys(t, [[134.3, 1.0], [146.5, 1.32], [151.3, 1.36]]), A.keys(t, [[134.3, 960], [146.5, 915], [151.3, 915]]), A.keys(t, [[134.3, 560], [146.5, 640], [151.3, 640]]));
      const W0 = K.painter(eng, cam);
      const W = (m, p, xf) => W0(m, Object.assign({}, p, { alpha: (p.alpha != null ? p.alpha : 1) * (1 - 0.75 * fin) }), xf);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);
      const dry = 1 - A.ramp(t, 140, 148);                  // the paint settles as the song ends
      const rise = A.ease(t, 134.3, 151.3, (x) => x), sunY = M.tr(0, -150 * rise);

      // ---- the dawn sky floods out from the sun
      W(Mk.sky, { pig: '#b7c3e0', pigB: '#f6d7a0', mix: { dir: [0, 1], at: 420 - 60 * rise, width: 300, noise: 0.9, noiseScale: 260, flow: 0.03 }, density: 0.75, edge: 0.4, edgeW: 16, soft: 4, warp: 20, warpScale: 240, rough: 4, flow: 0.55, flowScale: 200, gran: 0.2,
        flood: { at: pp(134.5, 2.2), soft: 80, noise: 100, edge: 0.9, edgeW: 30 }, wet: 0.6 * dry, wetAmp: 14, seed: 1 });
      W(Mk.glow, { pig: '#f7d08a', pigB: '#f2aeb8', mix: { dir: [0, -1], at: -520, width: 200, noise: 0.8 }, density: 0.7 * pp(134.8, 2.0), soft: 90, edge: 0.1, warp: 40, warpScale: 200, flow: 0.7, seed: 2 }, sunY);
      W(Mk.sun, { pig: '#f6c86e', pigB: '#f39a6c', mix: { dir: [0, 1], at: SUN[1], width: 60 }, density: 0.85 * pp(134.6, 1.2), soft: 6, edge: 1.0, edgeW: 5, warp: 4, rough: 1.5, seed: 3 }, sunY);
      const hl = (m, a, lift, o) => { W(m, { mode: 'lift', lift, soft: 2, warp: 10, warpScale: 200, rough: 3, flood: { at: pp(a, 1.8), soft: 40, noise: 60 }, seed: o.seed }); W(m, Object.assign({ edge: 1.1, edgeW: 5, soft: 1.5, warp: 10, warpScale: 200, rough: 3, flow: 0.55, gran: 0.4, flood: { at: pp(a, 1.8), soft: 40, noise: 60, edge: 1.0 }, wet: K.wet(t, a, a + 1.8) }, o)); };
      W(Mk.hillFar, { pig: '#c9b6d6', pigB: '#b8b8d8', mix: { dir: [1, 0], at: 900, width: 600 }, density: 0.6, edge: 1.1, edgeW: 5, soft: 1.5, warp: 8, warpScale: 200, rough: 2.5, flow: 0.5, gran: 0.35,
        flood: { at: pp(135.0, 1.8), soft: 40, noise: 60 }, seed: 4 });
      W(Mk.trees, { pig: '#aaa2c4', density: 0.45, edge: 0.4, edgeW: 3, soft: 2.5, warp: 5, warpScale: 30, rough: 3, flood: { at: pp(135.8, 1.2), soft: 16, noise: 16 }, seed: 5 });
      W(Mk.mist, { mode: 'lift', lift: 0.55 * pp(135.4, 1.5), soft: 24, warp: 30, warpScale: 90, seed: 6 }, M.tr(40 * Math.sin(t * 0.2), 0));
      hl(Mk.hillMid, 135.3, 0.45, { pig: '#a79acb', pigB: '#c7a3c3', mix: { dir: [1, 0], at: 900, width: 700 }, density: 0.7, seed: 7 });
      hl(Mk.hillNear, 135.6, 0.75, { pig: '#b7c089', pigB: '#d9b77a', mix: { dir: [1, -0.2], at: 1100, width: 700, noise: 0.9 }, density: 0.8, flowScale: 160, gran: 0.45, seed: 8 });
      W(Mk.grass, { pig: '#7f9458', density: 0.8 * pp(136.2, 1.0), edge: 1.2, edgeW: 2, soft: 1, warp: 1.5, warpScale: 40, rough: 0.8, sway: { amp: 3, y0: 860, y1: 1120, k: 1, omega: 1.6, wave: 120, phase: 0 }, seed: 9 });
      W(Mk.flowers, { pig: '#e58ea0', pigB: '#8e9cc4', mix: { dir: [1, 0], at: 960, width: 60, noise: 3 }, density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 10, radial: { x: 960, y: 990, r: 1100 * pp(136.6, 2.0), soft: 60 } });

      // ---- the two of them, painted into the mist, drifting together; colours merging
      const come = A.ease(t, 136.6, 142.4);
      const gap = 120 * (1 - come);
      const merge = A.ease(t, 141.0, 146.0);
      const col = (who) => [K.mixHex(C.INK[who][0], VIOLET[0], merge), K.mixHex(C.INK[who][1], VIOLET[1], merge)];
      const lc = col('lizzy'), dcc = col('darcy');
      const fade = 1 - 0.75 * fin;
      const lp = pp(135.6, 2.2), dp = pp(136.0, 2.2);
      C.paint(eng, Mk, 'dc', { cam, xf: M.tr(gap, 0), t, p: dp, wet: K.wet(t, 136.0, 138.2), alpha: fade, sway: 2.5, omega: 1.2, pig: dcc[0], pigB: dcc[1], seed: 9 });
      C.paint(eng, Mk, 'lz', { cam, xf: M.tr(-gap, 0), t, p: lp, wet: K.wet(t, 135.6, 137.8), alpha: fade, sway: 4, omega: 1.3, pig: lc[0], pigB: lc[1], seed: 8 });
      // morning mist drifts across their feet
      W(Mk.mistNear, { mode: 'lift', lift: 0.6 * pp(136.2, 1.4), soft: 20, warp: 30, warpScale: 80, seed: 11 }, M.tr(50 * Math.sin(t * 0.25 + 1), 0));
      W(Mk.mistNear, { pig: '#efe6f0', density: 0.3 * pp(136.2, 1.4), soft: 22, warp: 30, warpScale: 80, seed: 12 }, M.tr(50 * Math.sin(t * 0.25 + 1), 0));
      K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 135.0, [1800, 140], [700, 700], 8, (i) => i % 2 === 0, 88, { stagger: 1.4, dur: 7, life: 9, arc: 160, size: 40 }));

      // ---- light: the sun rising between them, rays, motes; it all softens at the end
      const L = pp(134.8, 2.0) * (1 - 0.6 * fin);
      Lt(Mk.glow, { colour: '#ffd79a', density: 0.24 * L, soft: 160, warp: 30, seed: 20 }, sunY);
      Lt(Mk.rays, { colour: '#ffe6b0', density: 0.16 * L * A.ramp(t, 139, 142), soft: 40, warp: 20, streak: { angle: -1.2, amt: 0.6, len: 300 }, seed: 21 }, M.mul(sunY, M.about(SUN[0], SUN[1], 0.03 * Math.sin(t * 0.4))));
      K.motes(eng, cam, Mk.dot, t, { x: 912, y: 700, w: 1400, h: 500, n: 24, r: 6, vy: -14, colour: '#ffe2b0', intensity: 0.45, alpha: L, seed: 14 });

      // ---- ink: birds, the title and its flourish
      const g = K.ink(eng, cam);
      g.globalAlpha = 1 - 0.6 * fin;
      g.strokeStyle = g.fillStyle = '#f00'; g.lineCap = 'round'; g.lineWidth = 1.8;
      [[1500, 300], [1560, 270], [1610, 320], [1680, 290]].forEach(([bx, by], i) => { const X = bx + (t - 134) * 30, f = Math.sin(t * 7 + i * 1.7) * 5; g.beginPath(); g.moveTo(X - 11, by - 3 - f); g.quadraticCurveTo(X - 4, by - 8, X, by); g.quadraticCurveTo(X + 4, by - 8, X + 11, by - 3 - f); g.stroke(); });
      const tw = A.ramp(t, 142.8, 145.8);
      K.writeText(g, 'The Art of Making Up My Mind', 912, 420, `56px ${K.FONT_TITLE}`, tw, 'center', '#f00');
      const fl = A.ramp(t, 145.6, 146.8);
      if (fl > 0) { g.lineWidth = 1.6; C.pen(g, [[690, 446], [830, 458], [990, 440], [1134, 450]], fl, 2.2, 20); }
      g.globalAlpha = 1;
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 10 });
    },
  };
})(window.WC = window.WC || {});
