// Scene: Dawn (outro). Mind made up: the two of them walk together across misty fields as the
// sun comes up, their colours merged into violet. The title is inked in; the paint settles.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people;
  WC.scenes = WC.scenes || {};
  const SUN = [1240, 600];

  WC.scenes.dawn = {
    build(B) {
      B.mask('sky', K.rect(-60, -60, 2040, 820), { maskScale: 0.25, margin: 60 });
      B.mask('sun', (g) => WC.fillCircle(g, SUN[0], SUN[1], 70), { maskScale: 0.6, margin: 80 });
      B.mask('glow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 360), { maskScale: 0.3, margin: 160 });
      const hill = (pts) => (g) => { g.beginPath(); WC.spline(g, pts, false, 1); g.lineTo(2000, 1160); g.lineTo(-80, 1160); g.closePath(); g.fill(); };
      B.mask('hillFar', hill([[-80, 610], [300, 580], [700, 600], [1100, 585], [1500, 606], [2000, 590]]), { maskScale: 0.3 });
      B.mask('hillMid', hill([[-80, 690], [260, 660], [640, 680], [1000, 700], [1400, 672], [2000, 700]]), { maskScale: 0.3 });
      B.mask('hillNear', hill([[-80, 800], [400, 810], [800, 818], [1200, 812], [1600, 800], [2000, 810]]), { maskScale: 0.3 });
      B.mask('mist', (g) => { [[500, 640, 520, 20], [1300, 650, 560, 18], [900, 730, 700, 22], [300, 760, 400, 16], [1600, 745, 420, 18]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }); }, { maskScale: 0.4, margin: 60 });
      B.mask('grass', (g) => { const r = WC.rng(33); g.lineCap = 'round'; for (let i = 0; i < 220; i++) { const x = r() * 1960 - 20, y = 860 + r() * 240, h = 16 + r() * 42; g.lineWidth = 2 + r() * 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5, y - h * 0.6, x + 10 * (r() - 0.3), y - h); g.stroke(); } }, { maskScale: 0.7, margin: 12 });
      B.mask('flowers', K.splat(61, 960, 960, 980, 110, 120, 5, 2), { margin: 12 });
      B.mask('trees', (g) => { const r = WC.rng(8); [[240, 668], [320, 662], [1560, 676], [1640, 668], [1700, 674]].forEach(([x, y]) => { WC.fillCircle(g, x, y - 30, 30 + r() * 12); g.fillRect(x - 3, y - 20, 6, 24); }); }, { maskScale: 0.6, margin: 20 });
      B.puppet('lz', P.lizzy, 44);
      B.puppet('dc', P.darcy, 48);
      K.petalMask(B);
    },

    render(eng, Mk, t) {
      const fin = A.ease(t, 149.0, 151.3);
      const cam = K.cam(A.keys(t, [[134.3, 1.12], [151.3, 1.0]]), A.keys(t, [[134.3, 900], [151.3, 960]]), A.keys(t, [[134.3, 600], [151.3, 560]]));
      const W0 = K.painter(eng, cam);
      const W = (m, p, xf) => W0(m, Object.assign({}, p, { alpha: (p.alpha != null ? p.alpha : 1) * (1 - 0.72 * fin) }), xf);
      const rise = A.ease(t, 134.3, 151.3, (x) => x);
      W(Mk.sky, { pig: '#b7c3e0', pigB: '#f6d7a0', mix: { dir: [0, 1], at: 360, width: 300, noise: 0.8, noiseScale: 260 }, density: 0.75, edge: 0.3, soft: 4, warp: 20, warpScale: 240, rough: 4, flow: 0.55, flowScale: 200, gran: 0.2, seed: 1 });
      W(Mk.glow, { pig: '#f7d08a', pigB: '#f2aeb8', mix: { dir: [0, -1], at: -500, width: 200, noise: 0.8 }, density: 0.7, soft: 90, edge: 0.1, warp: 40, warpScale: 200, flow: 0.7, seed: 2 }, M.tr(0, -60 * rise));
      W(Mk.sun, { pig: '#f6c86e', pigB: '#f39a6c', mix: { dir: [0, 1], at: SUN[1], width: 60 }, density: 0.85, soft: 6, edge: 1.0, edgeW: 5, warp: 4, rough: 1.5, seed: 3 }, M.tr(0, -60 * rise));
      W(Mk.hillFar, { pig: '#c9b6d6', pigB: '#b8b8d8', mix: { dir: [1, 0], at: 900, width: 600 }, density: 0.6, edge: 1.1, edgeW: 5, soft: 1.5, warp: 8, warpScale: 200, rough: 2.5, flow: 0.5, gran: 0.35, seed: 4 });
      W(Mk.mist, { mode: 'lift', lift: 0.55, soft: 24, warp: 30, warpScale: 90, seed: 6 }, M.tr(40 * Math.sin(t * 0.2), 0));
      W(Mk.hillMid, { mode: 'lift', lift: 0.45, soft: 2, warp: 10, warpScale: 200, rough: 3, seed: 7 });
      W(Mk.hillMid, { pig: '#a79acb', pigB: '#c7a3c3', mix: { dir: [1, 0], at: 900, width: 700 }, density: 0.7, edge: 1.1, edgeW: 5, soft: 1.5, warp: 10, warpScale: 200, rough: 3, flow: 0.55, gran: 0.4, seed: 7 });
      W(Mk.hillNear, { mode: 'lift', lift: 0.75, soft: 2, warp: 12, warpScale: 200, rough: 4, seed: 8 });
      W(Mk.hillNear, { pig: '#b7c089', pigB: '#d9b77a', mix: { dir: [1, -0.2], at: 1100, width: 700, noise: 0.9 }, density: 0.8, edge: 0.9, edgeW: 7, soft: 2, warp: 12, warpScale: 200, rough: 4, flow: 0.65, flowScale: 160, gran: 0.45, seed: 8 });
      W(Mk.grass, { pig: '#7f9458', density: 0.8, edge: 1.2, edgeW: 2, soft: 1, warp: 1.5, warpScale: 40, rough: 0.8, seed: 9 });
      W(Mk.flowers, { pig: '#e58ea0', pigB: '#8e9cc4', mix: { dir: [1, 0], at: 960, width: 60, noise: 3 }, density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 10 });

      // the two of them walking together, colours merged
      const u = A.ramp(t, 134.3, 151.3);
      const x = A.lerp(430, 1010, u);
      const ph = (t - 134.3) * Math.PI * 2 * 0.92;
      const lzPose = P.lizzy.poses.walk(t, ph); lzPose.upper = 0.18; lzPose.fore = -0.3;
      const dcPose = P.darcy.poses.walk(t, ph + Math.PI); dcPose.upperN = -0.2; dcPose.foreN = -0.3;
      const fade = 1 - 0.72 * fin;
      const XD = P.darcy.paint(eng, Mk.dc, P.root(x + 36, 810 + P.darcy.walkY(ph, 1.5), 34, 1, 48, P.darcy.groundH), dcPose, { cam, alpha: fade, style: { coat: '#6b5f9c', coatB: '#5a5290', face: '#8a7cb3', faceB: '#6f64a3', legs: '#a79acb', far: '#5a5290', hair: '#3f3766', hairB: '#4d3a52', lapel: '#4f4680', boots: '#3a3260' } });
      const XL = P.lizzy.paint(eng, Mk.lz, P.root(x, 814 + P.darcy.walkY(ph, 1), 31, 1, 44, P.lizzy.groundH), lzPose, { cam, alpha: fade, style: { gown: '#d6a2c8', gownB: '#c3a0d0', skin: '#dba6bf', skinB: '#c79dc4', hem: '#b07aaa', sash: '#8f86c0' } });
      K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 135.0, [1800, 140], [700, 700], 8, (i) => i % 2 === 0, 88, { stagger: 1.4, dur: 7, life: 9, arc: 160, size: 40 }));

      const g = K.ink(eng, cam);
      g.strokeStyle = g.fillStyle = '#f00'; g.lineCap = 'round'; g.lineWidth = 1.8;
      [[1500, 360], [1560, 330], [1610, 380], [1680, 350]].forEach(([bx, by], i) => { const X = bx - (t - 134) * 26, f = Math.sin(t * 7 + i * 1.7) * 5; g.beginPath(); g.moveTo(X - 11, by - 3 - f); g.quadraticCurveTo(X - 4, by - 8, X, by); g.quadraticCurveTo(X + 4, by - 8, X + 11, by - 3 - f); g.stroke(); });
      // title
      K.writeText(g, 'The Art of Making Up My Mind', 960, 262, `80px ${K.FONT_TITLE}`, A.ramp(t, 139.4, 142.6), 'center', '#f00');
      const fl = A.ramp(t, 142.4, 143.6);
      if (fl > 0) { g.lineWidth = 2; const q = WC.sampleSpline([[640, 296], [860, 312], [1080, 290], [1280, 304]], false, 1, 20); g.beginPath(); q.slice(0, Math.max(2, Math.floor(q.length * fl))).forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); }
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 10 });
    },
  };
})(window.WC = window.WC || {});
