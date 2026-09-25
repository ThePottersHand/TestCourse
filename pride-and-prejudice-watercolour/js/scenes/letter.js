// Scene: The Letter (chorus 2). Chapters 35-36: in the grove at Rosings, the morning after the
// proposal, Darcy hands Elizabeth a letter and walks away. She reads it on the path under the
// spring trees, among the bluebells. His handwriting streams off the page on the wind: rose on
// "like" ("Be not alarmed, Madam..."), indigo on "hate" (his words about her family), rose again
// ("I will only add, God bless you"). On "the art of making up my mind" the sun breaks through
// the canopy and her own words are written across the grove: "Till this moment I never knew myself."
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 700, y: 905, s: 56 };
  const VP = [1180, 700];                                    // where the path vanishes
  const TRUNKS = [                                           // x, base y, width, depth (0 near .. 2 far)
    [150, 960, 58, 0], [1720, 980, 66, 0], [420, 860, 34, 1], [1000, 820, 30, 1], [1420, 850, 36, 1], [1900, 840, 32, 1],
    [260, 790, 16, 2], [620, 770, 14, 2], [840, 760, 13, 2], [1320, 760, 14, 2], [1560, 780, 16, 2], [1100, 745, 11, 2], [30, 800, 15, 2],
  ];
  const LINES = [
    { word: [17, 'like'], text: 'Be not alarmed, Madam, on receiving this letter, by the apprehension of its containing any repetition of those sentiments...', col: 'rose', ang: -0.32, amp: 36, wl: 110, speed: 300 },
    { word: [18, 'hate'], text: '...the total want of propriety so frequently, so almost uniformly betrayed by herself, by your three younger sisters, and occasionally even by your father.', col: 'indigo', ang: 0.02, amp: 64, wl: 150, speed: 420 },
    { word: [19, 'like'], text: 'I will only add, God bless you.   Fitzwilliam Darcy', col: 'rose', ang: -0.85, amp: 44, wl: 130, speed: 240 },
  ];
  const trunk = (g, x, y, w, rnd) => {
    const lean = (rnd() - 0.5) * 40;
    WC.fillLock(g, x, y + 6, x + lean, -200, w, (rnd() - 0.5) * 0.08, 0.55);
    WC.fillEllipse(g, x, y + 4, w * 0.9, w * 0.2, 0);
  };

  WC.scenes.letter = {
    build(B) {
      K.commonMasks(B);
      B.mask('air', K.rect(-200, -200, 2400, 1100), { maskScale: 0.2, margin: 60, flood: { seeds: [VP] } });
      [0, 1, 2].forEach((d) => B.mask('trunks' + d, (g) => { const r = WC.rng(10 + d); TRUNKS.filter((T) => T[3] === d).forEach(([x, y, w]) => trunk(g, x, y, w, r)); }, { maskScale: d === 0 ? 0.5 : 0.6, margin: 20, flood: { seeds: TRUNKS.filter((T) => T[3] === d).map(([x, y]) => [x, y]) } }));
      B.mask('canopy', (g) => { const r = WC.rng(21); for (let i = 0; i < 90; i++) { const x = -200 + r() * 2400, y = -160 + r() * r() * 420; WC.fillCircle(g, x, y, 50 + r() * 90); } }, { maskScale: 0.3, margin: 60, flood: { seeds: [[-100, -100], [1000, -150], [2100, -100]] } });
      B.mask('leaves', (g) => { const r = WC.rng(22); for (let i = 0; i < 700; i++) { const x = -200 + r() * 2400, y = -120 + Math.pow(r(), 1.6) * 520; WC.fillEllipse(g, x, y, 6 + r() * 8, 3 + r() * 4, r() * 3); } }, { maskScale: 0.6, margin: 20 });
      B.mask('floor', (g) => { g.beginPath(); WC.spline(g, [[-200, 760], [400, 740], [900, 700], [1300, 704], [1800, 736], [2200, 760]], false, 1); g.lineTo(2200, 1300); g.lineTo(-200, 1300); g.fill(); }, { maskScale: 0.2, margin: 40, flood: { seeds: [[LZ.x, 1100]] } });
      B.mask('path', (g) => { g.beginPath(); g.moveTo(VP[0] - 8, VP[1]); g.bezierCurveTo(VP[0] - 60, 800, 900, 880, 420, 1300); g.lineTo(1300, 1300); g.bezierCurveTo(1150, 900, VP[0] + 40, 790, VP[0] + 8, VP[1]); g.fill(); }, { maskScale: 0.3, margin: 30, flood: { seeds: [[860, 1250]] } });
      B.mask('bluebells', (g) => { const r = WC.rng(24); [[250, 900, 380, 90], [1500, 860, 420, 80], [1750, 1000, 300, 90], [60, 1040, 240, 90], [1250, 780, 240, 30], [560, 780, 260, 30]].forEach(([cx, cy, rx, ry]) => { for (let i = 0; i < 260; i++) { const a = r() * 6.28, d = Math.sqrt(r()); WC.fillCircle(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 2 + r() * 3.5 * (cy / 900)); } }); }, { maskScale: 0.7, margin: 12 });
      B.mask('dapple', (g) => { const r = WC.rng(33); for (let i = 0; i < 60; i++) WC.fillEllipse(g, -100 + r() * 2200, 760 + r() * 360, 20 + r() * 50, 5 + r() * 12, 0); for (let i = 0; i < 30; i++) WC.fillEllipse(g, r() * 2000, 200 + r() * 560, 6 + r() * 10, 10 + r() * 16, 0); }, { maskScale: 0.4, margin: 30 });
      B.mask('rays', (g) => { for (let i = 0; i < 7; i++) { const x = 300 + i * 260 + (i % 2) * 60; g.beginPath(); g.moveTo(x, -200); g.lineTo(x + 70 + 30 * (i % 3), -200); g.lineTo(x - 180 + 30 * (i % 3), 1200); g.lineTo(x - 330, 1200); g.fill(); } }, { maskScale: 0.2, margin: 60 });
      const I = C.lizzy(B, 'lz', { x: LZ.x, y: LZ.y, s: LZ.s, dir: 1, pose: { torso: 0.02, head: 0.16, upper: -0.25, fore: -1.9, skirt: 0.01 } });
      const hand = M.apply(I.X.fore, 0, 4.05 * LZ.s);
      B.M.letterAt = hand;
      B.mask('letter', (g) => { g.save(); g.translate(hand[0] + 12, hand[1] - 16); g.rotate(-0.22); g.fillRect(-4, -34, 44, 56); g.restore(); }, { maskScale: 1.5, margin: 16 });
    },

    render(eng, Mk, t) {
      const artT = A.word(21, 'art'), gs = A.word(20, 'guess'), hate = A.word(18, 'hate');
      const cam = K.cam(A.keys(t, [[91.5, 1.1], [104, 1.2], [109.6, 1.05], [112.6, 1.04]]), A.keys(t, [[91.5, 820], [104, 830], [109.6, 920], [112.6, 925]]), A.keys(t, [[91.5, 580], [104, 560], [109.6, 520], [112.6, 520]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);
      const gust = 0.3 + 0.7 * A.env(t, hate - 0.4, hate + 3.2, 0.3, 1.6) + 0.2 * Math.sin(t * 0.9);
      const sunburst = A.ease(t, artT - 1.2, artT + 1.4);
      const hand = Mk.letterAt;

      // ---- the grove paints itself in
      W(Mk.air, { pig: '#dfe8c0', pigB: '#f4ead0', mix: { dir: [0, 1], at: 420, width: 300, noise: 1, noiseScale: 260 }, density: 0.5, edge: 0.3, soft: 4, warp: 30, warpScale: 260, rough: 4, flow: 0.45, flowScale: 220, gran: 0.15,
        flood: { at: pp(91.55, 1.2), soft: 80, noise: 90 }, wet: K.wet(t, 91.55, 92.7), seed: 1 });
      W(Mk.trunks2, { pig: '#b7b3a4', density: 0.5, edge: 1, edgeW: 3, soft: 2, warp: 3, rough: 1.5, gran: 0.4, flood: { at: pp(91.7, 1.2), soft: 30, noise: 30 }, seed: 2 });
      W(Mk.floor, { pig: '#9aa870', pigB: '#7d8a5c', mix: { dir: [0, 1], at: 950, width: 200, noise: 1.2, noiseScale: 160 }, density: 0.6, edge: 0.6, edgeW: 10, soft: 3, warp: 16, warpScale: 200, rough: 4, flow: 0.5, flowScale: 150, gran: 0.4,
        flood: { at: pp(91.6, 1.3), soft: 60, noise: 70 }, wet: K.wet(t, 91.6, 92.9), seed: 3 });
      W(Mk.path, { mode: 'lift', lift: 0.4 * pp(91.9, 1.0), soft: 8, warp: 10, warpScale: 80, rough: 3, flood: { at: pp(91.9, 1.0), soft: 40, noise: 30 }, seed: 4 });
      W(Mk.path, { pig: '#cdb48a', density: 0.4 * pp(92.0, 1.0), soft: 8, edge: 0.6, warp: 10, warpScale: 80, rough: 3, gran: 0.6, seed: 4 });
      W(Mk.bluebells, { pig: '#8a86cc', pigB: '#6f7cc4', mix: { dir: [1, 0], at: 900, width: 60, noise: 3 }, density: 0.85, edge: 1.3, edgeW: 2, soft: 1, warp: 1.5, rough: 0.5, gran: 0.3, seed: 5,
        radial: { x: LZ.x, y: 950, r: 100 + 1500 * pp(92.3, 1.6), soft: 120 },
        sway: { amp: 1.5 + 3 * gust, y0: -1e5, y1: -1e5 + 1, k: 1, omega: 2.2, wave: 1e6, phase: 0, axis: [0, -1], lean: 0.3 * gust, waveX: 200 } });
      W(Mk.trunks1, { pig: '#8d8578', pigB: '#6f6a70', mix: { dir: [1, 0], at: 900, width: 400, noise: 0.8 }, density: 0.75, edge: 1.1, edgeW: 3, soft: 1.5, warp: 3, rough: 1.8, gran: 0.5, flood: { at: pp(91.8, 1.3), soft: 30, noise: 30 }, seed: 6 });
      // the canopy: fresh spring green, moving in the wind
      const cSway = { amp: 6 + 14 * gust, y0: -1e5, y1: -1e5 + 1, k: 1, omega: 1.3, wave: 1e6, phase: 0, axis: [0, -1], lean: 0.2 * gust, waveX: 420 };
      W(Mk.canopy, { pig: '#a9c47a', pigB: '#6f9160', mix: { dir: [0, -1], at: 100, width: 200, noise: 1.3, noiseScale: 150, flow: 0.04 }, density: 0.6, soft: 20, edge: 0.4, edgeW: 12, warp: 30, warpScale: 120, rough: 8, roughScale: 24, flow: 0.6, flowScale: 90, gran: 0.3,
        flood: { at: pp(91.9, 1.5), soft: 60, noise: 80 }, wet: 0.4 + 0.4 * gust, wetAmp: 8, wetScale: 60, sway: cSway, seed: 7 });
      W(Mk.leaves, { pig: '#7ea05c', pigB: '#5b7d50', mix: { dir: [1, 1], at: 600, width: 200, noise: 2 }, density: 0.7 * pp(92.4, 1.2), soft: 1.5, edge: 1, edgeW: 2, warp: 2, rough: 1, gran: 0.4, sway: cSway, seed: 8 });
      W(Mk.trunks0, { pig: '#6b5f60', pigB: '#4c4a58', mix: { dir: [1, 0], at: 900, width: 300, noise: 0.9 }, density: 0.9, edge: 1.2, edgeW: 4, soft: 1.2, warp: 3, rough: 2, gran: 0.6, flood: { at: pp(91.7, 1.2), soft: 30, noise: 30 }, seed: 9 });

      // ---- Elizabeth, reading
      W(Mk.dot, { pig: '#5d6649', density: 0.35 * pp(92.0, 0.8), soft: 14, warp: 4, seed: 10 }, M.mul(M.tr(LZ.x + 10, LZ.y + 2), M.sc(1.5, 0.14)));
      C.paint(eng, Mk, 'lz', { cam, t, p: pp(91.8, 1.3), wet: K.wet(t, 91.8, 93.1), sway: 2 + 5 * gust, omega: 1.6, wind: -0.4 * gust, seed: 5 });
      const flap = 0.05 * Math.sin(t * 7) * (0.4 + gust);
      const lxf = [1, 0, flap, 1 + 0.5 * flap, -flap * hand[1], -0.5 * flap * hand[1]];
      W(Mk.letter, { mode: 'lift', lift: 0.95 * pp(92.3, 0.4), soft: 1, warp: 1, rough: 0.5, seed: 11 }, lxf);
      W(Mk.letter, { pig: '#efe6d4', density: 0.3 * pp(92.3, 0.4), soft: 1, edge: 1.2, edgeW: 2, warp: 1, rough: 0.5, seed: 11 }, lxf);
      // spring leaves torn off on "hate", petals of hawthorn after
      let flurry = K.petalFlight(t, hate - 0.2, [2100, 200], [-100, 700], 14, false, 31, { arc: -80, stagger: 0.07, dur: 2.4, life: 3.6, size: 28 });
      flurry = flurry.concat(K.petalFlight(t, gs, [1300, -80], [700, 900], 12, true, 32, { arc: 60, stagger: 0.25, dur: 4, life: 6, size: 26 }));
      K.paintPetals(eng, cam, Mk.petal, flurry, { rose: '#f6ece8', indigo: '#86a860' });

      // ---- light: dappled sun shifting with the leaves; rays breaking through on "art"
      Lt(Mk.dapple, { colour: '#fff2c8', density: (0.24 + 0.1 * sunburst) * pp(92.3, 1.0) * (1 - 0.5 * A.env(t, hate - 0.2, hate + 2.6, 0.4, 1.2)), soft: 8, warp: 14, seed: 20 }, M.tr(10 * Math.sin(t * 1.4) + 6 * gust * Math.sin(t * 5), 0));
      Lt(Mk.rays, { colour: '#fff0c8', density: (0.07 + 0.17 * sunburst) * pp(92.0, 1.2), soft: 60, warp: 30, streak: { angle: 1.8, amt: 0.6, len: 260 }, seed: 21 }, M.tr(20 * Math.sin(t * 0.3), 0));
      K.motes(eng, cam, Mk.dot, t, { x: 900, y: 520, w: 1400, h: 800, n: 22, r: 6, vx: 10, vy: -8, colour: '#fff0c8', intensity: 0.45, alpha: pp(92.6, 1.2), seed: 21 });

      // ---- ink: his letter streaming away on the wind, then her words
      const layerPass = (colour, which) => {
        const g = K.ink(eng, cam);
        g.fillStyle = g.strokeStyle = '#00f';
        LINES.forEach((L, k) => {
          if (L.col !== which) return;
          const w0 = A.word(L.word[0], L.word[1]) - 0.6, written = (t - w0) * L.speed, drift = Math.max(0, t - w0 - 1.2) * L.speed * 0.55;
          if (written <= 0) return;
          const dx = Math.cos(L.ang), dy = Math.sin(L.ang), px = -dy, py = dx;
          const path = (d) => { const a = L.amp * Math.min(1, d / 260), ph = d / L.wl - t * 2.2 - k; return [hand[0] + 30 + dx * d + px * a * Math.sin(ph), hand[1] - 20 + dy * d + py * a * Math.sin(ph) - 0.00018 * d * d]; };
          K.textStream(g, L.text, path, `italic 30px ${K.FONT_TITLE}`, written, drift, '#00f', 1150, 350, 1 - A.ramp(t, gs + 1, gs + 3));
        });
        if (which === 'rose') {
          // on the page itself, a few lines of his hand
          g.strokeStyle = '#0f0'; g.lineWidth = 1;
          K.withXf(g, lxf, () => { for (let i = 0; i < 6; i++) { const y = hand[1] - 42 + i * 8; g.beginPath(); g.moveTo(hand[0] + 10 - i, y + 2); g.lineTo(hand[0] + 44 - i, y - 6); g.stroke(); } });
        }
        eng.ink({ colour, strength: [1.7, 0.6, 1.3], seed: 14 + (which === 'rose' ? 0 : 1) });
      };
      layerPass('#b34d6c', 'rose');
      layerPass('#34427a', 'indigo');
      const g = K.ink(eng, cam);
      K.writeText(g, 'Till this moment I never knew myself.', 920, 200, `64px ${K.FONT_SCRIPT}`, A.ramp(t, artT - 0.6, artT + 1.6), 'center', '#f00');
      eng.ink({ strength: [1.6, 0.5, 1.2], seed: 16 });
    },
  };
})(window.WC = window.WC || {});
