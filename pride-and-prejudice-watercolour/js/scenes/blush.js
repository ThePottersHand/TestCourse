// Scene: "And he makes me feel a certain way".
// Close on Elizabeth. On "feel" the blush spreads, the page floods warm, and roses open around
// her one by one on the beat; on "certain way" her eyes close.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, F = WC.figures;
  WC.scenes = WC.scenes || {};
  const LZ = { x: 600, y: 230, s: 470 };
  const inLizzy = (g, fn) => { g.save(); g.translate(LZ.x, LZ.y); fn(); g.restore(); };
  const sub = (g, fn) => { g.save(); g.globalCompositeOperation = 'destination-out'; fn(); g.restore(); };
  const ROSES = [[1180, 300, 62, 0.3], [1380, 540, 74, 1.1], [1190, 780, 58, 2.0], [1580, 300, 52, 0.8], [1640, 720, 66, 2.6], [1000, 150, 40, 1.7], [1460, 930, 48, 0.2], [240, 200, 44, 1.4], [170, 640, 56, 2.2]];

  WC.scenes.blush = {
    build(B) {
      const L = F.lizzy;
      B.mask('bg', K.rect(34, 30, 1852, 1022), { maskScale: 0.3, margin: 80 });
      B.mask('warm', (g) => { g.beginPath(); g.ellipse(820, 470, 520, 470, 0, 0, 7); g.fill(); }, { maskScale: 0.3, margin: 160 });
      const ribbonAndFlower = (g) => { L.ribbon(g, LZ.s); L.flowerPetals(g, LZ.s); };
      B.mask('lizzy', (g) => { inLizzy(g, () => L.body(g, LZ.s)); sub(g, () => inLizzy(g, () => ribbonAndFlower(g))); }, { maskScale: 0.8 });
      B.mask('lizzyHair', (g) => { inLizzy(g, () => L.hair(g, LZ.s, WC.rng(7))); sub(g, () => inLizzy(g, () => ribbonAndFlower(g))); });
      B.mask('lizzyHairLights', (g) => inLizzy(g, () => L.hairLights(g, LZ.s)), { margin: 30 });
      B.mask('ribbon', (g) => inLizzy(g, () => L.ribbon(g, LZ.s)));
      B.mask('lips', (g) => inLizzy(g, () => L.lips(g, LZ.s)), { margin: 30 });
      B.mask('cheek', (g) => inLizzy(g, () => WC.fillEllipse(g, 0.29 * LZ.s, 0.66 * LZ.s, 0.12 * LZ.s, 0.09 * LZ.s, 0.2)), { margin: 90 });
      B.mask('flower', (g) => inLizzy(g, () => L.flowerPetals(g, LZ.s)), { margin: 30 });
      B.mask('flowerHeart', (g) => inLizzy(g, () => L.flowerHeart(g, LZ.s)), { margin: 20 });
      B.mask('earring', (g) => inLizzy(g, () => L.earring(g, LZ.s)), { margin: 20 });
      ROSES.forEach(([x, y, r, rot], i) => {
        B.mask('rose' + i, (g) => WC.props.rose(g, x, y, r, rot), { margin: 30 });
        B.mask('roseC' + i, (g) => WC.props.roseCentre(g, x, y, r, rot), { margin: 20 });
        B.mask('leaf' + i, (g) => { WC.fillLock(g, x - r * 0.5, y + r * 0.6, x - r * 1.9, y + r * 1.3, r * 0.55, 0.3, 0.1); WC.fillLock(g, x + r * 0.6, y + r * 0.5, x + r * 1.8, y + r * 1.1, r * 0.5, -0.3, 0.1); }, { margin: 20 });
      });
      K.petalMask(B);
      B.mask('splat', K.splat(41, 1300, 520, 520, 420, 90, 8), { margin: 20 });
    },

    render(eng, Mk, t) {
      const feel = A.word(14, 'feel'), certain = A.word(14, 'certain');
      const cam = K.cam(A.keys(t, [[74.2, 1.0], [81.5, 1.12]]), A.keys(t, [[74.2, 960], [81.5, 820]]), A.keys(t, [[74.2, 540], [81.5, 480]]));
      const W = K.painter(eng, cam);
      const warm = A.ease(t, feel - 0.4, feel + 1.6, A.out);
      W(Mk.bg, { pig: '#f3e6d6', pigB: '#ece0e6', mix: { dir: [1, 0.3], at: 900, width: 600, noise: 0.9 }, density: 0.42, edge: 0.4, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5, seed: 1 });
      if (warm > 0) W(Mk.warm, { pig: '#f7cf98', pigB: '#f1a7b8', mix: { dir: [1, 0.2], at: 900, width: 300, noise: 1 }, density: 0.85 * warm, soft: 70, edge: 0.2, edgeW: 20, warp: 60, warpScale: 220, flow: 0.8, flowScale: 90, gran: 0.2,
        radial: { x: 760, y: 470, r: 120 + 900 * warm, soft: 90 }, seed: 2 });
      // roses open one per beat after "feel"
      const bi = A.beatIndex(feel - 0.3);
      ROSES.forEach(([x, y, r], i) => {
        const tb = WC.TIMING.beats[bi + i] || feel;
        const k = A.ease(t, tb, tb + 0.7, A.out);
        if (k <= 0) return;
        W(Mk['leaf' + i], { pig: '#8fae6a', pigB: '#6f8a4a', mix: { dir: [1, 1], at: x + y, width: 60, noise: 0.6 }, density: 0.85, edge: 1.3, edgeW: 3, soft: 1.1, warp: 2, warpScale: 40, rough: 1, seed: 10 + i, radial: { x, y, r: r * 2.4 * k, soft: 12 } });
        W(Mk['rose' + i], { pig: i % 3 === 1 ? '#e58ea0' : '#d9607e', pigB: '#f3b0bf', mix: { dir: [0, -1], at: -y, width: r, noise: 0.8 }, density: 0.95, hollow: 0.35, hollowW: r * 0.3, edge: 1.5, edgeW: 3, soft: 1.2, warp: 3, warpScale: 30, rough: 1.4, roughScale: 6, flow: 0.5, flowScale: 30, gran: 0.4,
          seed: 20 + i, radial: { x, y, r: r * 1.3 * k, soft: 10 }, grow: -6 + 6 * k });
        W(Mk['roseC' + i], { pig: '#a83a5a', density: 0.9, edge: 1.2, edgeW: 2, soft: 1, warp: 1, seed: 30 + i, alpha: A.ramp(k, 0.4, 1) });
      });
      W(Mk.lizzy, { pig: '#f3a9a2', pigB: '#d488ae', mix: { dir: [-1, 0.5], at: -420 - 170, width: 240, noise: 1.0, noiseScale: 140 }, density: 0.92, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3.5, warpScale: 130, rough: 1.3, flow: 0.5, flowScale: 120, gran: 0.4,
        reveal: { dir: [0, 1], at: 990, soft: 105, noise: 60, noiseScale: 110 }, seed: 3 });
      const bl = A.ease(t, feel - 0.2, feel + 1.2, A.out);
      W(Mk.cheek, { pig: '#ee8a86', pigB: '#f2a584', mix: { dir: [1, 0], at: LZ.x + 140, width: 60, noise: 0.8 }, density: 0.45 + 0.6 * bl, soft: 26 + 20 * bl, edge: 0.1, warp: 12, warpScale: 60, flow: 0.4, seed: 4,
        radial: { x: LZ.x + 0.29 * LZ.s, y: LZ.y + 0.66 * LZ.s, r: 40 + 90 * Math.max(0.35, bl), soft: 30 } });
      W(Mk.lips, { pig: '#c9506c', density: 0.62, soft: 1.2, edge: 1.1, edgeW: 3, warp: 1.2, warpScale: 40, rough: 0.6, seed: 5 });
      W(Mk.lizzyHair, { pig: '#9e4b52', pigB: '#6d3b35', mix: { dir: [-1, 0.2], at: -300 - 160, width: 180, noise: 0.9 }, density: 1.05, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, rough: 1.8, roughScale: 7, flow: 0.45, gran: 0.55, seed: 6 });
      W(Mk.lizzyHairLights, { mode: 'lift', lift: 0.5, soft: 2.5, warp: 2, rough: 1.4, seed: 7 });
      W(Mk.ribbon, { pig: '#6fb0a8', pigB: '#4f8f96', mix: { dir: [-1, 0.5], at: -100 - 160, width: 120, noise: 0.6 }, density: 1.0, edge: 1.3, edgeW: 4, warp: 2, warpScale: 70, rough: 1, flow: 0.4, gran: 0.4, seed: 8 });
      W(Mk.flower, { pig: '#f4d3da', density: 0.8, edge: 1.6, edgeW: 3, warp: 1.5, warpScale: 40, rough: 0.8, seed: 9 });
      W(Mk.flowerHeart, { pig: '#e9c46a', pigB: '#b9773a', mix: { dir: [1, 1], at: 0, width: 10, noise: 0.3 }, density: 1.1, edge: 1.2, edgeW: 3, gran: 0.9, seed: 10 });
      W(Mk.earring, { pig: '#e9c46a', density: 1.0, edge: 1.5, edgeW: 2, seed: 11 });
      K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 74.6, [1900, 200], [900, 900], 9, (i) => i % 3 !== 1, 77, { stagger: 0.55, dur: 5, life: 7, arc: 120 }));
      if (warm > 0) W(Mk.splat, { pig: '#e58ea0', density: 0.85, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 12, radial: { x: 1300, y: 520, r: 700 * warm, soft: 40 } });

      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      const closed = t > certain - 0.05;
      inLizzy(g, () => (closed ? F.inkEyeClosed(g, F.lizzy.eye, LZ.s) : F.inkEye(g, F.lizzy.eye, LZ.s)));
      g.strokeStyle = '#0f0'; g.lineWidth = 1;
      inLizzy(g, () => { const q = WC.sampleSpline(F.lizzyBody.slice(0, 24), false, LZ.s, 8); g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x + 7, y - 3) : g.moveTo(x + 7, y - 3))); g.stroke(); });
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 8 });
    },
  };
})(window.WC = window.WC || {});
