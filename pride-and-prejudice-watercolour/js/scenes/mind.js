// Scene: On My Mind (verse 1, lines 3-5), painted on.
// Her silhouette is sketched, then a sunset floods into it from the sun: her whole outline,
// hair and all, becomes a window onto Pemberley's hills. On "on my mind" a tiny Darcy is
// painted on the hilltop. "And in my heart": the camera drifts down to a pool in the fields inside
// her, the low sun's reflection glowing in it. "But I don't know if that's a crime": a drop of his
// indigo falls into the pool; ripples spread, the reflection breaks up and the indigo marbles
// through the rose.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, F = WC.figures, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 560, y: 175, s: 500 };
  const POOL = { x: 560, y: 1012, rx: 175, ry: 50 };
  const IMPACT = [585, 1014], REFL_X = 650;       // where the drop lands; the sun's reflection
  const SUN = [690, 552];
  // her silhouette: profile, hair, ribbon and flower as one outline
  const sil = (g) => { g.save(); g.translate(LZ.x, LZ.y); const L = F.lizzy; L.body(g, LZ.s); L.hair(g, LZ.s, WC.rng(7)); L.ribbon(g, LZ.s); L.flowerPetals(g, LZ.s); g.restore(); };
  const inSil = (shape) => (g) => K.clipTo(g, shape, sil);
  const hill = (pts) => inSil((g) => { g.beginPath(); WC.spline(g, pts, false, 1); g.lineTo(1400, 1500); g.lineTo(-200, 1500); g.closePath(); g.fill(); });
  const INFO = { kind: 'lizzy', x: LZ.x, y: LZ.y, s: LZ.s, dir: 1 };
  // the pool: a flat, slightly irregular oval, well inside her outline
  const poolShape = (g) => {
    const pts = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, k = 1 + 0.05 * Math.sin(3 * a + 1) + 0.03 * Math.sin(5 * a + 2); pts.push([POOL.x + POOL.rx * k * Math.cos(a), POOL.y + POOL.ry * k * Math.sin(a)]); }
    WC.fillSpline(g, pts, true, 1);
  };

  WC.scenes.mind = {
    build(B) {
      K.commonMasks(B);
      B.mask('bg', K.rect(30, 26, 1860, 1400), { maskScale: 0.25, margin: 80, flood: { seeds: [[700, 450]] } });
      B.mask('glow', (g) => { g.beginPath(); g.ellipse(600, 380, 420, 360, -0.2, 0, 7); g.fill(); }, { maskScale: 0.35, margin: 140 });
      B.mask('strokeR', (g) => { WC.brushStroke(g, [[1200, 180], [1500, 120], [1760, 240], [1820, 520]], 130); WC.brushStroke(g, [[1250, 780], [1550, 700], [1790, 820]], 90); }, { maskScale: 0.4, margin: 80, flood: { seeds: [[1200, 180], [1250, 780]] } });
      B.mask('sky', sil, { maskScale: 0.6, flood: { seeds: [SUN] } });
      B.mask('sun', (g) => WC.fillCircle(g, SUN[0], SUN[1], 44), { maskScale: 0.8, margin: 60 });
      B.mask('sunGlow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 120), { maskScale: 0.4, margin: 120 });
      B.mask('hillFar', hill([[-200, 580], [300, 560], [470, 548], [640, 572], [860, 556], [1400, 570]]), { maskScale: 0.6, flood: { seeds: [[320, 575]] } });
      B.mask('hillMid', hill([[-200, 640], [360, 624], [560, 606], [700, 628], [900, 650], [1400, 660]]), { maskScale: 0.6, flood: { seeds: [[330, 640]] } });
      B.mask('hillNear', hill([[-200, 760], [300, 700], [520, 690], [760, 740], [1000, 800], [1400, 820]]), { maskScale: 0.5, flood: { seeds: [[330, 720]] } });
      B.mask('field', hill([[-200, 900], [400, 860], [800, 900], [1400, 960]]), { maskScale: 0.5, flood: { seeds: [[500, 900]] } });
      B.mask('mist', inSil((g) => { g.beginPath(); g.ellipse(560, 600, 260, 22, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(700, 675, 220, 16, 0, 0, 7); g.fill(); }), { maskScale: 0.6, margin: 40 });
      B.mask('house', inSil((g) => WC.props.pemberley(g, 440, 560, 110)), { margin: 20, flood: { seeds: [[440, 530]] } });
      B.mask('houseWin', inSil((g) => WC.props.pemberleyWindows(g, 440, 560, 110)), { margin: 10, maskScale: 2 });
      B.mask('crown', inSil((g) => { g.beginPath(); g.rect(-400, -400, 2800, 862); g.fill(); }), { maskScale: 0.6, margin: 20, flood: { seeds: [SUN] } });
      B.mask('pool', inSil(poolShape), { maskScale: 0.8, margin: 30, flood: { seeds: [[POOL.x, POOL.y]] } });
      B.mask('glints', (g) => K.clipTo(g, (c) => {
        const r = WC.rng(52);
        for (let i = 0; i < 15; i++) { const u = i / 14, y = POOL.y - POOL.ry * 0.8 + u * POOL.ry * 1.6, w = (4 + 14 * r()) * (0.5 + Math.sin(Math.PI * u)); WC.fillEllipse(c, REFL_X + (r() - 0.5) * 14, y, w, 1.1 + 1.1 * r(), 0); }
      }, poolShape), { maskScale: 1, margin: 12 });
      B.mask('reeds', inSil((g) => {
        const r = WC.rng(51); g.lineCap = 'round';
        [[398, 1022, 8], [424, 1040, 6], [716, 1032, 7]].forEach(([x, y, n]) => { for (let i = 0; i < n; i++) { const h = 24 + r() * 44, x0 = x + (r() - 0.5) * 26, tip = x0 + (r() - 0.4) * 22; g.lineWidth = 1.4 + r() * 1.6; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + (tip - x0) * 0.2, y - h * 0.6, tip, y - h); g.stroke(); } });
      }), { maskScale: 1, margin: 12 });
      B.box('ring', (g) => { g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 100, 25, 0, 0, Math.PI * 2); g.stroke(); }, { x: -108, y: -32, w: 216, h: 64 }, { margin: 14, maskScale: 1.2 });
      B.box('drop', (g) => { g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(12, -8, 16, 4, 0, 16); g.bezierCurveTo(-16, 4, -12, -8, 0, -30); g.fill(); }, { x: -20, y: -34, w: 40, h: 54 }, { margin: 20, maskScale: 2 });
      C.darcy(B, 'tiny', { x: 548, y: 611, s: 10, dir: 1, pose: P.darcy.poses.still() });
    },

    render(eng, Mk, t) {
      const heartT = A.word(3, 'heart'), knowT = A.word(4, 'know'), crimeT = A.word(4, 'crime'), mindT = A.word(2, 'mind');
      const z = A.keys(t, [[12.95, 1.08], [19.0, 1.16], [21.0, 1.12], [26.6, 1.12], [28.2, 1.22], [30.2, 1.26]]);
      const c = A.keys(t, [[12.95, [720, 470]], [19.0, [720, 460]], [21.0, [700, 850]], [26.6, [700, 860]], [28.2, [690, 900]], [30.2, [690, 900]]]);
      const cam = K.cam(z, c[0], c[1]);
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));

      W(Mk.bg, { pig: '#efe3e6', pigB: '#e0e2ea', mix: { dir: [1, 0.3], at: 1100, width: 500, noise: 0.9, noiseScale: 260 }, density: 0.45, edge: 0.4, edgeW: 14, soft: 3, warp: 24, warpScale: 260, rough: 6, roughScale: 30, flow: 0.5, flowScale: 220, gran: 0.2, dry: 0.4,
        flood: { at: K.pp(t, 13.0, 1.6), soft: 80, noise: 90, edge: 0.4 }, wet: K.wet(t, 13.0, 14.6), seed: 1 });
      W(Mk.glow, { pig: '#f6d3a8', pigB: '#f0b7c2', mix: { dir: [1, 0.4], at: 700, width: 260, noise: 0.8, flow: 0.1 }, density: 0.55 * K.pp(t, 13.4, 1.5), soft: 60, edge: 0.1, warp: 50, warpScale: 200, flow: 0.7, flowScale: 90, seed: 2 });
      W(Mk.strokeR, { pig: '#e9b8c8', pigB: '#c3c3e0', mix: { dir: [1, 0.5], at: 1500, width: 260, noise: 0.9 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9,
        flood: { at: K.pp(t, 14.0, 1.4), soft: 30, noise: 30 }, wet: K.wet(t, 14.0, 15.4), seed: 3 });

      // the sunset floods into her silhouette from the sun
      const skyP = K.pp(t, 13.3, 2.9, A.inOut), skyW = K.wet(t, 13.3, 16.2, 2.2);
      W(Mk.sky, { pig: '#f6bf7e', pigB: '#cf8db8', mix: { dir: [0, -1], at: -540, width: 260, noise: 0.8, noiseScale: 180, flow: 0.06 * skyW }, density: 1.0, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3, warpScale: 130, rough: 1.3, flow: 0.6, flowScale: 120, gran: 0.35,
        flood: { at: skyP, soft: 50, noise: 70, edge: 0.9, edgeW: 26 }, wet: skyW, wetAmp: 10, seed: 4 });
      const rise = A.ramp(t, 13, 30);
      W(Mk.sun, { pig: '#f7d98c', pigB: '#f2b98a', mix: { dir: [0, 1], at: 552, width: 30 }, density: 0.8, soft: 10, edge: 0.6, warp: 4, seed: 5, alpha: K.pp(t, 13.8, 1.0) }, M.tr(0, -18 * rise));
      const hl = (m, a, d, pig, pigB, dens, sd) => W(m, { pig, pigB, mix: { dir: [1, 0], at: 600, width: 300 }, density: dens, edge: 1.2, edgeW: 4, soft: 1.3, warp: 6, warpScale: 120, rough: 2, flow: 0.55, gran: 0.45,
        flood: { at: K.pp(t, a, d, A.inOut), soft: 30, noise: 50, edge: 1.0, edgeW: 18 }, wet: K.wet(t, a, a + d), wetAmp: 8, seed: sd });
      hl(Mk.hillFar, 14.2, 1.6, '#b5b3d6', '#b5b3d6', 0.7, 6);
      W(Mk.house, { pig: '#9c98b8', density: 0.7, edge: 1.3, edgeW: 2, soft: 0.9, warp: 1, rough: 0.6, flood: { at: K.pp(t, 15.1, 0.9), soft: 8, noise: 8 }, seed: 7 });
      W(Mk.houseWin, { mode: 'lift', lift: 0.6 * K.pp(t, 15.8, 0.6), soft: 0.8, warp: 0.4, rough: 0.2, seed: 8 });
      hl(Mk.hillMid, 14.6, 1.6, '#c98fae', '#b27fa6', 0.8, 10);
      hl(Mk.hillNear, 15.0, 1.8, '#c47f9f', '#aa7aa0', 0.6, 11);
      hl(Mk.field, 15.4, 2.0, '#d9a6b8', '#b7a3d0', 0.42, 12);
      const drift = (t - 15) * 7;
      W(Mk.mist, { mode: 'lift', lift: 0.45 * K.pp(t, 15.4, 1.2), soft: 14, warp: 16, warpScale: 70, seed: 9 }, M.tr(drift, 0));
      // her outline: the same wash pooled along the edge of the silhouette
      W(Mk.sky, { pig: '#b5607f', density: 0.7, hollow: 1, hollowW: 7, soft: 1.5, edge: 0.8, edgeW: 3, warp: 3, warpScale: 130, rough: 1.3, flood: { at: K.pp(t, 13.2, 1.6), soft: 20, noise: 20 }, seed: 13 });
      // the top of her head (her hair) deepens into dusk
      W(Mk.crown, { pig: '#8a4f7c', pigB: '#c98fb4', mix: { dir: [0, 1], at: 330, width: 120, noise: 1 }, density: 0.55 * K.pp(t, 15.0, 1.6), soft: 8, edge: 0.3, warp: 20, warpScale: 120, flow: 0.5, seed: 14,
        reveal: { dir: [0, 1], at: 470, soft: 60, noise: 40 } });

      // tiny Darcy, painted on the hilltop on "on my mind", lit from behind by the sun
      const dp = K.pp(t, mindT - 0.8, 1.2);
      if (dp > 0) {
        C.paint(eng, Mk, 'tiny', { cam, t, p: dp, wet: K.wet(t, mindT - 0.8, mindT + 0.4), sway: 1.2, pig: '#2a2f55', pigB: '#3a4270', lift: 0.7 });
      }

      // "And in my heart": a pool opens in the fields inside her, the sun's reflection glowing in it,
      // brightening faintly with the beat
      const poolP = K.pp(t, heartT - 0.7, 1.5, A.inOut);
      const drop = A.ramp(t, knowT - 0.5, knowT);                         // the indigo drop falling
      const hit = A.ramp(t, knowT, knowT + 2.6);
      const stir = hit > 0 && hit < 1 ? Math.sin(Math.PI * Math.min(1, hit * 1.4)) : 0;   // how disturbed the water is
      if (poolP > 0) {
        W(Mk.pool, { mode: 'lift', lift: 0.85, soft: 1.5, warp: 4, warpScale: 60, rough: 1.5, roughScale: 12, flood: { at: poolP, soft: 20, noise: 24 }, seed: 20 });
        W(Mk.pool, { pig: '#f4d2a6', pigB: '#d9a6c6', mix: { dir: [0, 1], at: POOL.y, width: 30, noise: 0.8, noiseScale: 60 }, density: 0.6, edge: 1.4, edgeW: 5, soft: 1.3, warp: 4, warpScale: 60, rough: 1.5, roughScale: 12, flow: 0.4, flowScale: 50, gran: 0.3,
          flood: { at: poolP, soft: 20, noise: 24, edge: 1.2, edgeW: 12 }, wet: K.wet(t, heartT - 0.7, heartT + 0.8), wetAmp: 4, seed: 21 });
        W(Mk.reeds, { pig: '#5e2a48', density: 0.85 * K.pp(t, heartT - 0.2, 0.8), edge: 1, edgeW: 2, soft: 1, warp: 1, rough: 0.5, gran: 0.4,
          sway: { amp: 2 + 3 * stir, y0: -1040, y1: -980, k: 1.3, omega: 1.8, wave: 1e6, phase: 0, axis: [0, -1], lean: 0.2, waveX: 200 }, seed: 22 });
      }
      // "But I don't know if that's a crime": a drop of his indigo falls into the pool...
      if (drop > 0 && drop < 1) W(Mk.drop, { pig: '#4a5a90', density: 1.1, edge: 1.2, edgeW: 2, warp: 1, rough: 0.4, seed: 23 }, M.mul(M.tr(IMPACT[0], A.lerp(330, IMPACT[1] - 12, drop * drop)), M.sc(0.9)));
      // ...and marbles through the rose
      const spread = K.pp(t, knowT, crimeT + 0.8 - knowT);
      if (spread > 0) {
        W(Mk.pool, { pig: '#4e5a9c', pigB: '#c0709c', mix: { dir: [1, 0.3], at: IMPACT[0], width: 60, noise: 1.6, noiseScale: 40, flow: 0.25, vein: 0.7 }, density: 0.9, edge: 1.2, edgeW: 4, soft: 2, warp: 8, warpScale: 40, rough: 2, roughScale: 9, flow: 0.8, flowScale: 40, gran: 0.6,
          radial: { x: IMPACT[0], y: IMPACT[1], r: 6 + 200 * spread, soft: 24 }, wet: 1 - 0.7 * A.ramp(t, crimeT + 0.6, 30), wetAmp: 5, wetScale: 40, seed: 25 });
      }
      // ripples run out across the water, catching the light
      [0, 0.28, 0.6].forEach((d, k) => {
        const u = A.ramp(t, knowT + d, knowT + d + 1.9); if (u <= 0 || u >= 1) return;
        const a = (1 - u) * (1 - 0.3 * k), xf = M.mul(M.tr(IMPACT[0], IMPACT[1]), M.sc(0.12 + 1.25 * A.out(u)));
        W(Mk.ring, { pig: '#5f5a8e', density: 0.55 * a, soft: 1.5, edge: 0.6, warp: 1.5, warpScale: 30, rough: 0.6, seed: 24 + k }, xf);
        Lt(Mk.ring, { colour: '#fff0d6', density: 0.45 * a, soft: 2, warp: 1.5, seed: 27 + k }, M.mul(xf, M.sc(0.95)));
      });
      // a few drops thrown up by the splash
      for (let i = 0; i < 9; i++) {
        const h = (k) => A.hash(i * 13 + k + 400), u = A.ramp(t, knowT, knowT + 0.45 + 0.25 * h(1));
        if (u <= 0 || u >= 1) continue;
        const x = IMPACT[0] + (h(2) - 0.5) * 110 * u, y = IMPACT[1] - (120 + 100 * h(3)) * u * (1 - u);
        W(Mk.dot, { pig: h(4) < 0.6 ? '#4a5a90' : '#e0a0b8', density: 0.8, soft: 1, edge: 1.2, warp: 1, seed: 40 + i }, M.mul(M.tr(x, y), M.sc(0.04 + 0.04 * h(5))));
      }
      if (poolP > 0) {
        const beat = A.pulse(t, 0.3);
        const warm = poolP * (1 - 0.4 * A.ramp(t, knowT, crimeT));
        Lt(Mk.pool, { colour: '#ffd9b4', density: (0.12 + 0.08 * beat) * warm, soft: 16, warp: 6, seed: 28 });
        Lt(Mk.pool, { colour: '#ffc79a', density: (0.09 + 0.05 * beat) * warm, soft: 110, warp: 30, seed: 30 });   // its warmth spilling into the dark
        Lt(Mk.glints, { colour: '#fff3d6', density: (0.6 + 0.2 * beat) * poolP * (1 - 0.7 * stir), soft: 2, warp: 1.5 + 4 * stir, seed: 29 }, M.tr((1.5 + 12 * stir) * Math.sin(t * 7), 0));
      }
      // light: the sun inside her head
      Lt(Mk.sunGlow, { colour: '#ffc98a', density: 0.2 * K.pp(t, 13.8, 1.4), soft: 90, warp: 20, seed: 26 }, M.tr(0, -18 * rise));
      K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 13.2, [1300, 150], [1500, 900], 5, (i) => i % 2 === 0, 5, { stagger: 2.4, dur: 6, life: 12, arc: 80 }));

      // ink: the sketch, the horizon, birds
      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0';
      C.sketchBust(g, INFO, K.pp(t, 12.95, 1.3, A.inOut));
      C.pen(g, [[250, 562], [900, 556]], K.pp(t, 13.2, 0.8), 1.1, 4);
      g.fillStyle = g.strokeStyle = '#f00';
      g.lineWidth = 1.6; g.lineCap = 'round';
      const bp = K.pp(t, 16.0, 1.0);
      if (bp > 0) {
        [[520, 420], [575, 395], [640, 440]].forEach(([bx, by], i) => {
          const f = Math.sin(t * 5 + i * 2) * 6, x = bx + (t - 13) * 6 + i * 3;
          g.globalAlpha = bp;
          g.beginPath(); g.moveTo(x - 10, by - 3 - f); g.quadraticCurveTo(x - 4, by - 7, x, by); g.quadraticCurveTo(x + 4, by - 7, x + 10, by - 3 - f); g.stroke();
          g.globalAlpha = 1;
        });
      }
      eng.ink({ strength: [1.7, 0.5, 1.2], seed: 4 });
    },
  };
})(window.WC = window.WC || {});
