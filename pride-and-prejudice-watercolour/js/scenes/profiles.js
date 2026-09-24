// Scene: Face to Face (pre-chorus 1 + chorus 1, and the final line of chorus 3).
// c1: "And now he's staring at my eyes" - we begin in her eye; his profile slides in to face her.
//     Chorus: each "maybe" floods the page - rose from her side, indigo from his - and the two
//     colours meet in violet on "the art of making up my mind".
// c3: the last line: they are closer now; a violet heart blooms between them.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, F = WC.figures;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 430, y: 230, s: 460 };
  const DC = { x: 1500, y: 208, s: 470 };
  const inLizzy = (g, fn) => { g.save(); g.translate(LZ.x, LZ.y); fn(); g.restore(); };
  const inDarcy = (g, fn) => { g.save(); g.translate(DC.x, DC.y); g.scale(-1, 1); fn(); g.restore(); };
  const sub = (g, fn) => { g.save(); g.globalCompositeOperation = 'destination-out'; fn(); g.restore(); };
  const LEYE = [LZ.x + F.lizzy.eye.iris.x * LZ.s, LZ.y + F.lizzy.eye.iris.y * LZ.s];
  const FLOWER = [LZ.x + F.lizzyFlower.x * LZ.s, LZ.y + F.lizzyFlower.y * LZ.s];

  WC.scenes.profiles = {
    build(B) {
      const L = F.lizzy, D = F.darcy;
      B.mask('bg', K.rect(34, 30, 1852, 1022), { maskScale: 0.3, margin: 80 });
      B.mask('flood', K.frame(80), { maskScale: 0.25, margin: 40 });
      B.mask('strokeWarm', (g) => { WC.brushStroke(g, [[70, 540], [140, 300], [330, 120], [560, 80], [760, 120]], 120); WC.brushStroke(g, [[90, 780], [140, 640], [230, 540]], 70); }, { maskScale: 0.45, margin: 60 });
      B.mask('strokeCool', (g) => { WC.brushStroke(g, [[1850, 540], [1790, 300], [1600, 120], [1360, 80], [1170, 130]], 120); WC.brushStroke(g, [[1830, 800], [1780, 660], [1690, 560]], 70); }, { maskScale: 0.45, margin: 60 });
      B.mask('violet', (g) => { g.beginPath(); g.ellipse(955, 470, 330, 430, 0, 0, 7); g.fill(); }, { maskScale: 0.35, margin: 140 });
      B.box('heart', (g) => { g.fill(WC.heartPath(new Path2D(), 0, 0, 150)); }, { x: -170, y: -170, w: 340, h: 320 }, { margin: 60, maskScale: 0.8 });
      const ribbonAndFlower = (g) => { L.ribbon(g, LZ.s); L.flowerPetals(g, LZ.s); };
      B.mask('lizzy', (g) => { inLizzy(g, () => L.body(g, LZ.s)); sub(g, () => inLizzy(g, () => ribbonAndFlower(g))); }, { maskScale: 0.8 });
      B.mask('lizzyHair', (g) => { inLizzy(g, () => L.hair(g, LZ.s, WC.rng(7))); sub(g, () => inLizzy(g, () => ribbonAndFlower(g))); });
      B.mask('lizzyHairLights', (g) => inLizzy(g, () => L.hairLights(g, LZ.s)), { margin: 30 });
      B.mask('ribbon', (g) => inLizzy(g, () => L.ribbon(g, LZ.s)));
      B.mask('lips', (g) => inLizzy(g, () => L.lips(g, LZ.s)), { margin: 30 });
      B.mask('cheek', (g) => inLizzy(g, () => L.cheek(g, LZ.s)), { margin: 80 });
      B.mask('earring', (g) => inLizzy(g, () => L.earring(g, LZ.s)), { margin: 20 });
      B.mask('flower', (g) => inLizzy(g, () => L.flowerPetals(g, LZ.s)), { margin: 30 });
      B.mask('flowerHeart', (g) => inLizzy(g, () => L.flowerHeart(g, LZ.s)), { margin: 20 });
      B.mask('darcy', (g) => { inDarcy(g, () => D.body(g, DC.s)); sub(g, () => inDarcy(g, () => D.cravat(g, DC.s))); }, { maskScale: 0.8 });
      B.mask('darcyCoat', (g) => { inDarcy(g, () => { g.beginPath(); g.rect(-2 * DC.s, 0.9 * DC.s, 4 * DC.s, 2 * DC.s); g.clip(); D.body(g, DC.s); }); sub(g, () => inDarcy(g, () => D.cravat(g, DC.s))); }, { maskScale: 0.8 });
      B.mask('darcyCollar', (g) => inDarcy(g, () => D.coatCollar(g, DC.s)));
      B.mask('darcyHair', (g) => inDarcy(g, () => D.hair(g, DC.s, WC.rng(11))));
      B.mask('darcyHairLights', (g) => inDarcy(g, () => D.hairLights(g, DC.s)), { margin: 30 });
      B.mask('cravatShade', (g) => inDarcy(g, () => D.cravatShade(g, DC.s)), { margin: 30 });
      B.mask('darcyRim', (g) => inDarcy(g, () => { g.save(); g.beginPath(); WC.spline(g, F.darcyBody, true, DC.s); g.clip(); g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); WC.spline(g, F.darcyBody.slice(0, 18), false, DC.s); g.stroke(); g.restore(); }), { margin: 30 });
      K.petalMask(B);
      B.mask('splatRose', K.splat(3, 260, 150, 240, 150, 55, 9), { margin: 20 });
      B.mask('splatIndigo', K.splat(5, 1680, 170, 220, 160, 55, 9), { margin: 20 });
      B.mask('splatGold', K.splat(18, 955, 460, 420, 330, 90, 7), { margin: 20 });
    },

    render(eng, Mk, t, e) {
      const c3 = e.v === 'c3';
      let cam, dOff, lOff;
      if (!c3) {
        const z = A.keys(t, [[29.25, 3.1], [31.1, 3.1], [33.1, 1.75], [35.9, 1.0], [55.7, 1.05]]);
        const c = A.keys(t, [[29.25, LEYE], [31.1, [LEYE[0] + 20, LEYE[1]]], [33.1, [960, 452]], [35.9, [960, 540]], [55.7, [960, 530]]]);
        cam = K.cam(z, c[0], c[1]);
        dOff = A.keys(t, [[29.25, 760], [31.0, 760], [32.7, 0]], A.out);
        const art = A.ease(t, A.word(10, 'art') - 1, A.word(10, 'mind') + 0.5);
        dOff -= 30 * art; lOff = 30 * art;
      } else {
        cam = K.cam(A.keys(t, [[129.0, 1.22], [134.9, 1.1]]), 960, A.keys(t, [[129.0, 470], [134.9, 500]]));
        const k = A.ease(t, 129.0, 133.2);
        lOff = 70 + 45 * k; dOff = -70 - 45 * k;
      }
      const W = K.painter(eng, cam);
      const LX = M.tr(lOff, 0), DX = M.tr(dOff, 0);

      // floods: rose from her side, indigo from his
      let R = -300, I = 2300, art = 0;
      if (!c3) {
        const l1 = A.word(6, 'like'), h1 = A.word(7, 'hate'), l2 = A.word(8, 'like'), gs = A.word(9, 'guess'), at = A.word(10, 'art');
        R = A.keys(t, [[l1 - 0.3, -300], [l1 + 1.1, 1500], [h1 - 0.1, 1500], [h1 + 1.0, 420], [l2 - 0.1, 420], [l2 + 1.1, 1700], [gs, 1700], [gs + 1.5, 1030]]);
        I = A.keys(t, [[h1 - 0.3, 2300], [h1 + 1.1, 480], [l2 - 0.1, 480], [l2 + 1.0, 1500], [gs, 1500], [gs + 1.5, 890]]);
        art = A.ease(t, at - 1.2, at + 1.4);
      } else { R = 1080; I = 840; art = A.ease(t, A.word(26, 'art') - 1.0, A.word(26, 'art') + 1.2); }

      W(Mk.bg, { pig: '#f4e8d2', pigB: '#e4e6ea', mix: { dir: [1, 0], at: 960, width: 700, noise: 0.9, noiseScale: 260 }, density: 0.4, edge: 0.5, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5, seed: 1 });
      W(Mk.strokeWarm, { pig: '#efc2a4', pigB: '#e9a9b5', mix: { dir: [1, -0.5], at: 300, width: 200, noise: 0.8 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, seed: 2 });
      W(Mk.strokeCool, { pig: '#c3d3d6', pigB: '#b9bfdc', mix: { dir: [0, 1], at: 400, width: 260, noise: 0.9 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, seed: 3 }, DX);
      if (R > -250) W(Mk.flood, { pig: '#f1b3c2', pigB: '#f3c7a8', mix: { dir: [0, 1], at: 540, width: 500, noise: 0.9 }, density: 0.5, soft: 3, edge: 0.9, edgeW: 12, warp: 30, warpScale: 240, rough: 6, flow: 0.7, flowScale: 180, gran: 0.25, seed: 4,
        reveal: { dir: [1, 0], at: R, soft: 46, noise: 100, noiseScale: 150 } });
      if (I < 2250) W(Mk.flood, { pig: '#aab5da', pigB: '#b9c6d9', mix: { dir: [0, 1], at: 540, width: 500, noise: 0.9 }, density: 0.52, soft: 3, edge: 0.9, edgeW: 12, warp: 30, warpScale: 240, rough: 6, flow: 0.7, flowScale: 180, gran: 0.25, seed: 5,
        reveal: { dir: [-1, 0], at: -I, soft: 46, noise: 100, noiseScale: 150 } });
      if (art > 0) W(Mk.violet, { pig: '#c7a6d6', pigB: '#e9b4c4', mix: { dir: [1, 0], at: 900, width: 300, noise: 1 }, density: 0.7 * art, soft: 50, edge: 0.5, edgeW: 16, warp: 50, warpScale: 180, flow: 0.8, flowScale: 80,
        radial: { x: 955, y: 470, r: 40 + 560 * art, soft: 60 }, seed: 6 });
      if (c3 && art > 0) W(Mk.heart, { pig: '#a878c4', pigB: '#e0709a', mix: { dir: [0, 1], at: -40, width: 120, noise: 0.9 }, density: 1.0, edge: 1.5, edgeW: 6, soft: 1.5, warp: 7, warpScale: 60, rough: 2.5, roughScale: 10, flow: 0.6, flowScale: 50, gran: 0.45,
        radial: { x: 0, y: 0, r: 230 * art, soft: 26 }, seed: 7 }, M.tr(955, 470));

      // Darcy (slides in from the right)
      W(Mk.darcy, { pig: '#8494bd', pigB: '#6273a0', mix: { dir: [0.3, 1], at: 600, width: 260, noise: 0.7 }, density: 0.92, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, warpScale: 120, rough: 1.2, flow: 0.45, flowScale: 90, gran: 0.45,
        reveal: { dir: [0, 1], at: 1000, soft: 100, noise: 60 }, seed: 8 }, DX);
      W(Mk.darcyCoat, { pig: '#3f4c78', density: 0.9, edge: 0.9, edgeW: 5, soft: 1.2, warp: 3, rough: 1.2, flow: 0.5, gran: 0.6, reveal: { dir: [0, 1], at: 1010, soft: 100, noise: 60 }, seed: 9 }, DX);
      W(Mk.darcyCollar, { pig: '#3f4c78', density: 0.8, edge: 1.2, edgeW: 4, warp: 2, rough: 1, gran: 0.5, reveal: { dir: [0, 1], at: 1010, soft: 100, noise: 60 }, seed: 10 }, DX);
      W(Mk.cravatShade, { pig: '#c3cadc', density: 0.9, soft: 5, edge: 0.6, edgeW: 5, warp: 3, flow: 0.4, seed: 11 }, DX);
      W(Mk.darcyHair, { pig: '#39406a', pigB: '#4d3a3a', mix: { dir: [1, 0.4], at: 1500, width: 150, noise: 0.8 }, density: 1.05, edge: 1.0, edgeW: 5, soft: 1.1, warp: 3, rough: 2.2, roughScale: 6, flow: 0.55, flowScale: 70, gran: 0.6, seed: 12 }, DX);
      W(Mk.darcyRim, { mode: 'lift', lift: 0.3, soft: 2.5, warp: 1.5, rough: 1, seed: 13 }, DX);
      W(Mk.darcyHairLights, { mode: 'lift', lift: 0.4, soft: 3, warp: 2, rough: 1.5, seed: 14 }, DX);

      // Elizabeth
      W(Mk.lizzy, { pig: '#f3a9a2', pigB: '#d488ae', mix: { dir: [-1, 0.5], at: -420, width: 240, noise: 1.0, noiseScale: 140 }, density: 0.92, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3.5, warpScale: 130, rough: 1.3, flow: 0.5, flowScale: 120, gran: 0.4,
        reveal: { dir: [0, 1], at: 990, soft: 105, noise: 60, noiseScale: 110 }, seed: 15 }, LX);
      const blush = c3 ? 0.3 : 0.15 * A.ease(t, 36, 40);
      W(Mk.cheek, { pig: '#f2a584', density: 0.55 + blush, soft: 24, edge: 0, warp: 10, warpScale: 60, flow: 0.4, seed: 16 }, LX);
      W(Mk.lips, { pig: '#c9506c', density: 0.62, soft: 1.2, edge: 1.1, edgeW: 3, warp: 1.2, warpScale: 40, rough: 0.6, seed: 17 }, LX);
      W(Mk.lizzyHair, { pig: '#9e4b52', pigB: '#6d3b35', mix: { dir: [-1, 0.2], at: -300, width: 180, noise: 0.9 }, density: 1.05, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, rough: 1.8, roughScale: 7, flow: 0.45, gran: 0.55, seed: 18 }, LX);
      W(Mk.lizzyHairLights, { mode: 'lift', lift: 0.5, soft: 2.5, warp: 2, rough: 1.4, seed: 19 }, LX);
      W(Mk.ribbon, { pig: '#6fb0a8', pigB: '#4f8f96', mix: { dir: [-1, 0.5], at: -100, width: 120, noise: 0.6 }, density: 1.0, edge: 1.3, edgeW: 4, warp: 2, warpScale: 70, rough: 1, flow: 0.4, gran: 0.4, seed: 20 }, LX);
      W(Mk.flower, { pig: '#f4d3da', density: 0.8, edge: 1.6, edgeW: 3, warp: 1.5, warpScale: 40, rough: 0.8, seed: 21 }, LX);
      W(Mk.flowerHeart, { pig: '#e9c46a', pigB: '#b9773a', mix: { dir: [1, 1], at: 0, width: 10, noise: 0.3 }, density: 1.1, edge: 1.2, edgeW: 3, gran: 0.9, seed: 22 }, LX);
      W(Mk.earring, { pig: '#e9c46a', density: 1.0, edge: 1.5, edgeW: 2, seed: 23 }, LX);

      // petals
      const from = [FLOWER[0] + lOff, FLOWER[1]], to = [1180 + dOff, 420];
      let petals = [];
      if (!c3) {
        [[6, true], [7, false], [8, true]].forEach(([li, like], k) => { petals = petals.concat(K.petalFlight(t, A.word(li, 'maybe'), from, to, 4, like, 10 + k)); });
        petals = petals.concat(K.petalFlight(t, A.word(9, 'guess'), from, [980, 260], 6, (i) => i % 2 === 0, 20, { arc: -260, stagger: 0.14 }));
        petals = petals.concat(K.petalFlight(t, A.word(10, 'appreciate'), from, [955, 520], 9, (i) => i % 2 === 0, 30, { arc: -320, stagger: 0.2, life: 8 }));
      } else {
        petals = K.petalFlight(t, 128.8, [955, -60], [955, 700], 14, (i) => i % 2 === 0, 50, { arc: 30, stagger: 0.35, dur: 4, life: 7 });
      }
      K.paintPetals(eng, cam, Mk.petal, petals);
      W(Mk.splatRose, { pig: '#e58ea0', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 30 }, LX);
      W(Mk.splatIndigo, { pig: '#7382ad', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 31 }, DX);
      if (art > 0) W(Mk.splatGold, { pig: '#dcae57', density: 0.85, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 32, radial: { x: 955, y: 460, r: 560 * art, soft: 40 } });

      // ink
      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      const blink = [34.2, 44.1, 53.0, 131.1].some((b) => t > b && t < b + 0.14);
      K.withXf(g, LX, () => inLizzy(g, () => (blink ? F.inkEyeClosed(g, F.lizzy.eye, LZ.s) : F.inkEye(g, F.lizzy.eye, LZ.s))));
      K.withXf(g, DX, () => inDarcy(g, () => F.inkEye(g, F.darcy.eye, DC.s)));
      g.strokeStyle = '#0f0'; g.lineWidth = 1;
      K.withXf(g, LX, () => inLizzy(g, () => { const q = WC.sampleSpline(F.lizzyBody.slice(0, 24), false, LZ.s, 8); g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x + 7, y - 3) : g.moveTo(x + 7, y - 3))); g.stroke(); }));
      K.withXf(g, DX, () => inDarcy(g, () => { const q = WC.sampleSpline(F.darcyBody.slice(0, 22), false, DC.s, 8); g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x + 7, y - 3) : g.moveTo(x + 7, y - 3))); g.stroke(); }));
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 6 });
    },
  };
})(window.WC = window.WC || {});
