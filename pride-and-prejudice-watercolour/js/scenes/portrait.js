// Scene: The Portrait (pre-chorus 2 + chorus 2).
// Pemberley's picture gallery. "But now I'm staring at his eyes": we start on the painted eye
// of Darcy's portrait and pull back to find Elizabeth studying it. Through the chorus her hair
// flower sheds petals toward him; his painted sky warms for "like" and storms for "hate".
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, F = WC.figures;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 440, y: 228, s: 470 };
  const OV = { x: 1398, y: 470, rx: 252, ry: 330, band: 44 };
  const DC = { x: 1452, y: 248, s: 330 };
  const inLizzy = (g, fn) => { g.save(); g.translate(LZ.x, LZ.y); fn(); g.restore(); };
  const inDarcy = (g, fn) => { g.save(); g.translate(DC.x, DC.y); g.scale(-1, 1); fn(); g.restore(); };
  const ovalInner = (g, grow = 0) => { g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - OV.band + grow, OV.ry - OV.band + grow, 0, 0, Math.PI * 2); };
  const sub = (g, fn) => { g.save(); g.globalCompositeOperation = 'destination-out'; fn(); g.restore(); };
  const shadeClip = [[-0.7, 0.72], [0.12, 0.98], [0.24, 1.3], [0.34, 1.62], [0.30, 2.5], [-0.7, 2.5]];
  const FLOWER = [LZ.x + F.lizzyFlower.x * LZ.s, LZ.y + F.lizzyFlower.y * LZ.s];
  const DARCY_EYE = [DC.x - F.darcy.eye.iris.x * DC.s, DC.y + F.darcy.eye.iris.y * DC.s];

  const stroke = (g, pts, w) => WC.brushStroke(g, pts, w, 16);

  WC.scenes.portrait = {
    build(B) {
      const L = F.lizzy, D = F.darcy;
      const lo = { maskScale: 0.35, margin: 120 };
      B.mask('bg', K.rect(34, 30, 1852, 1022), { maskScale: 0.35, margin: 80 });
      B.mask('gapBloom', (g) => { g.beginPath(); g.ellipse(930, 470, 310, 420, 0.1, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.4, margin: 140 });
      B.mask('violet', (g) => { g.beginPath(); g.ellipse(960, 520, 420, 380, 0, 0, Math.PI * 2); g.fill(); }, lo);
      B.mask('strokeWarm', (g) => { stroke(g, [[70, 520], [150, 300], [330, 120], [560, 70], [760, 110]], 120); stroke(g, [[90, 760], [140, 620], [230, 520]], 70); }, { maskScale: 0.5, margin: 60 });
      B.mask('strokeCool', (g) => { g.beginPath(); WC.spline(g, [[1560, 150], [1720, 96], [1850, 190], [1872, 470], [1838, 760], [1750, 930], [1640, 900], [1690, 640], [1668, 380]], true, 1); g.fill(); }, { maskScale: 0.5, margin: 60 });
      B.mask('glow', (g) => { g.beginPath(); g.ellipse(470, 330, 330, 290, -0.3, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.4, margin: 140 });
      B.mask('frameShadow', (g) => { g.beginPath(); g.ellipse(OV.x + 16, OV.y + 20, OV.rx + 4, OV.ry + 4, 0, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.5, margin: 90 });

      B.mask('sky', (g) => { ovalInner(g, 6); g.fill(); sub(g, () => inDarcy(g, () => { D.body(g, DC.s); D.hair(g, DC.s, WC.rng(11)); })); }, { maskScale: 0.8 });
      B.mask('cloud', (g) => {
        g.save(); ovalInner(g); g.clip();
        [[1200, 700, 90], [1290, 660, 110], [1420, 690, 95], [1540, 650, 120], [1640, 700, 80], [1340, 740, 120], [1520, 760, 110]].forEach(([x, y, r]) => WC.fillCircle(g, x, y, r));
        [[1180, 320, 40], [1230, 300, 55], [1290, 320, 42]].forEach(([x, y, r]) => WC.fillCircle(g, x, y, r));
        g.restore();
      }, { maskScale: 0.6 });
      B.mask('darcy', (g) => { g.save(); ovalInner(g); g.clip(); inDarcy(g, () => D.body(g, DC.s)); sub(g, () => inDarcy(g, () => D.cravat(g, DC.s))); g.restore(); });
      B.mask('darcyCoat', (g) => {
        g.save(); ovalInner(g); g.clip();
        inDarcy(g, () => { g.beginPath(); g.rect(-2 * DC.s, 0.9 * DC.s, 4 * DC.s, 2 * DC.s); g.clip(); D.body(g, DC.s); });
        sub(g, () => inDarcy(g, () => D.cravat(g, DC.s)));
        g.restore();
      });
      B.mask('darcyCollar', (g) => { g.save(); ovalInner(g); g.clip(); inDarcy(g, () => D.coatCollar(g, DC.s)); g.restore(); });
      B.mask('darcyHair', (g) => { g.save(); ovalInner(g); g.clip(); inDarcy(g, () => D.hair(g, DC.s, WC.rng(11))); g.restore(); });
      B.mask('darcyHairLights', (g) => inDarcy(g, () => D.hairLights(g, DC.s)), { margin: 30 });
      B.mask('darcyRim', (g) => {
        g.save(); ovalInner(g); g.clip();
        inDarcy(g, () => { g.beginPath(); WC.spline(g, F.darcyBody, true, DC.s); g.clip(); g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); WC.spline(g, F.darcyBody.slice(0, 18), false, DC.s); g.stroke(); });
        g.restore();
      }, { margin: 30 });
      B.mask('cravatShade', (g) => inDarcy(g, () => D.cravatShade(g, DC.s)), { margin: 30 });

      B.mask('frame', (g) => { g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx, OV.ry, 0, 0, Math.PI * 2); g.ellipse(OV.x, OV.y, OV.rx - OV.band, OV.ry - OV.band, 0, 0, Math.PI * 2); g.fill('evenodd'); });
      B.mask('frameInner', (g) => { g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - OV.band + 16, OV.ry - OV.band + 16, 0, 0, Math.PI * 2); g.ellipse(OV.x - 5, OV.y - 7, OV.rx - OV.band + 2, OV.ry - OV.band + 2, 0, 0, Math.PI * 2); g.fill('evenodd'); }, { margin: 30 });
      B.mask('frameBead', (g) => { for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; WC.fillCircle(g, OV.x + Math.cos(a) * (OV.rx - 11), OV.y + Math.sin(a) * (OV.ry - 11), 6.2); } }, { margin: 30 });
      B.mask('frameShine', (g) => { g.lineCap = 'round'; [[-2.55, -1.75], [-2.3, -2.05], [-1.5, -1.25]].forEach(([a0, a1]) => { g.lineWidth = 9; g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - 26, OV.ry - 26, 0, a0, a1); g.stroke(); }); }, { margin: 30 });
      B.mask('bow', (g) => {
        const bx = OV.x, by = OV.y - OV.ry - 6;
        const loop = (d) => WC.fillSpline(g, [[bx + 6 * d, by - 2], [bx + 34 * d, by - 34], [bx + 70 * d, by - 34], [bx + 78 * d, by - 8], [bx + 58 * d, by + 10], [bx + 26 * d, by + 8]], true, 1);
        loop(-1); loop(1);
        WC.fillLock(g, bx - 8, by + 6, bx - 34, by + 62, 22, 0.2, 0.5); WC.fillLock(g, bx + 8, by + 6, bx + 38, by + 60, 22, -0.2, 0.5);
        WC.fillCircle(g, bx, by, 16);
      }, { margin: 40 });

      const ribbonAndFlower = (g) => { L.ribbon(g, LZ.s); L.flowerPetals(g, LZ.s); };
      B.mask('lizzy', (g) => { inLizzy(g, () => L.body(g, LZ.s)); sub(g, () => inLizzy(g, () => ribbonAndFlower(g))); }, { maskScale: 0.8 });
      B.mask('lizzyShade', (g) => inLizzy(g, () => { g.save(); g.beginPath(); WC.spline(g, shadeClip, true, LZ.s); g.clip(); L.body(g, LZ.s); g.restore(); }), { maskScale: 0.6 });
      B.mask('lizzyHair', (g) => { inLizzy(g, () => L.hair(g, LZ.s, WC.rng(7))); sub(g, () => inLizzy(g, () => ribbonAndFlower(g))); });
      B.mask('lizzyHairLights', (g) => inLizzy(g, () => L.hairLights(g, LZ.s)), { margin: 30 });
      B.mask('ribbon', (g) => inLizzy(g, () => L.ribbon(g, LZ.s)));
      B.mask('lips', (g) => inLizzy(g, () => L.lips(g, LZ.s)), { margin: 30 });
      B.mask('cheek', (g) => inLizzy(g, () => L.cheek(g, LZ.s)), { margin: 80 });
      B.mask('earring', (g) => inLizzy(g, () => L.earring(g, LZ.s)), { margin: 20 });
      B.mask('flower', (g) => inLizzy(g, () => L.flowerPetals(g, LZ.s)), { margin: 30 });
      B.mask('flowerHeart', (g) => inLizzy(g, () => L.flowerHeart(g, LZ.s)), { margin: 20 });
      K.petalMask(B);
      B.mask('splatRose', K.splat(3, 250, 150, 240, 150, 60, 9), { margin: 20 });
      B.mask('splatIndigo', K.splat(5, 1740, 180, 150, 180, 46, 8), { margin: 20 });
      B.mask('splatGold', K.splat(8, 1400, 110, 220, 70, 36, 6), { margin: 20 });
      B.mask('splatViolet', K.splat(9, 960, 560, 160, 260, 26, 6), { margin: 20 });
      B.mask('splatHate', K.splat(12, 1250, 330, 330, 260, 70, 12), { margin: 20 });
      B.mask('splatArt', K.splat(14, 960, 480, 520, 360, 90, 8), { margin: 20 });
    },

    render(eng, M_, t) {
      const Mk = M_;
      // camera: start on the portrait's eye, pull back to the gallery
      const z = A.keys(t, [[85.5, 3.4], [86.6, 3.4], [89.4, 1.9], [92.0, 1.0], [106.8, 1.0], [112.6, 1.08]]);
      const c = A.keys(t, [[85.5, DARCY_EYE], [86.6, DARCY_EYE], [89.4, [1240, 440]], [92.0, [960, 540]], [106.8, [960, 540]], [112.6, [960, 500]]]);
      const cam = K.cam(z, c[0], c[1]);
      const W = K.painter(eng, cam);

      const like1 = A.word(17, 'like'), hate = A.word(18, 'hate'), like2 = A.word(19, 'like');
      const warm = A.keys(t, [[like1 - 0.3, 0], [like1 + 0.5, 1], [hate - 0.2, 1], [hate + 0.4, 0], [like2 - 0.2, 0], [like2 + 0.6, 1], [112, 0.8]]);
      const storm = A.keys(t, [[hate - 0.3, 0], [hate + 0.3, 1], [like2 - 0.3, 1], [like2 + 0.5, 0]]);
      const artT = A.word(21, 'art');
      const art = A.ease(t, artT - 1.5, artT + 1.2);

      W(Mk.bg, { pig: '#f4e5c8', pigB: '#e2e6e3', mix: { dir: [1, 0], at: 1100, width: 700, noise: 0.9, noiseScale: 260 },
        density: 0.42, edge: 0.5, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5, seed: 1 });
      W(Mk.glow, { pig: '#f6dca6', pigB: '#f3c7b8', mix: { dir: [1, 0.3], at: 520, width: 240, noise: 0.8 },
        density: 0.55 + 0.25 * warm, soft: 60, edge: 0.15, edgeW: 20, warp: 50, warpScale: 200, rough: 8, roughScale: 40, flow: 0.7, flowScale: 90, gran: 0.15, seed: 44 });
      W(Mk.strokeWarm, { pig: '#efc2a4', pigB: '#e9a9b5', mix: { dir: [1, -0.5], at: 300, width: 200, noise: 0.8 },
        density: 0.55, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, seed: 45 });
      W(Mk.strokeCool, { pig: '#c3d3d6', pigB: '#b9bfdc', mix: { dir: [0, 1], at: 520, width: 260, noise: 0.9 },
        density: 0.5 + 0.35 * storm, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, seed: 46 });
      W(Mk.gapBloom, { pig: '#f0bccb', pigB: '#c3c9e4', mix: { dir: [1, -0.25], at: 930 - 120 * warm + 160 * storm, width: 220, noise: 1.1, noiseScale: 140 },
        density: 0.62, soft: 42, edge: 0.25, edgeW: 20, warp: 60, warpScale: 200, rough: 10, roughScale: 40, flow: 0.85, flowScale: 70, gran: 0.25, seed: 3 });
      if (art > 0) W(Mk.violet, { pig: '#c7a6d6', pigB: '#e9b4c4', mix: { dir: [1, 0], at: 900, width: 300, noise: 1 }, density: 0.6 * art, soft: 60, edge: 0.3, edgeW: 20, warp: 50, warpScale: 180, flow: 0.8, flowScale: 80,
        radial: { x: 960, y: 520, r: 60 + 520 * art, soft: 60 }, seed: 47 });
      W(Mk.frameShadow, { pig: '#b9b8c8', density: 0.55, soft: 16, edge: 0.3, edgeW: 10, warp: 10, warpScale: 120, flow: 0.5, seed: 43 });

      // portrait interior: the sky warms and storms with her mood
      W(Mk.sky, { pig: '#a9d3cc', pigB: '#e3c9a0', mix: { dir: [0, 1], at: 700, width: 170, noise: 0.6 }, density: 0.95, edge: 0.9, edgeW: 7, soft: 1.6, warp: 5, rough: 1.5, flow: 0.5, flowScale: 110, gran: 0.35, seed: 4 });
      if (warm > 0.01) W(Mk.sky, { pig: '#f2c38e', pigB: '#ee9fb0', mix: { dir: [0, 1], at: 520, width: 200, noise: 0.8 }, density: 0.8 * warm, edge: 0.4, soft: 3, warp: 8, flow: 0.7, flowScale: 90, seed: 48 });
      if (storm > 0.01) W(Mk.sky, { pig: '#5d6b99', pigB: '#8b8fb0', mix: { dir: [0, 1], at: 420, width: 260, noise: 0.9 }, density: 0.95 * storm, edge: 0.6, soft: 3, warp: 12, flow: 0.9, flowScale: 70, gran: 0.6, seed: 49 });
      W(Mk.cloud, { mode: 'lift', lift: 0.75 - 0.35 * storm, soft: 16, warp: 18, warpScale: 70, rough: 6, roughScale: 16, seed: 5 });
      W(Mk.darcy, { pig: '#8494bd', pigB: '#6273a0', mix: { dir: [0.3, 1], at: 520, width: 240, noise: 0.7 }, density: 0.92, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, warpScale: 120, rough: 1.2, flow: 0.45, flowScale: 90, gran: 0.45, seed: 6 });
      W(Mk.darcyCoat, { pig: '#3f4c78', density: 0.95, edge: 0.9, edgeW: 5, soft: 1.2, warp: 3, rough: 1.2, flow: 0.5, gran: 0.6, seed: 7 });
      W(Mk.darcyCollar, { pig: '#3f4c78', density: 0.8, edge: 1.2, edgeW: 4, warp: 2, rough: 1, gran: 0.5, seed: 8 });
      W(Mk.cravatShade, { pig: '#c3cadc', density: 0.9, soft: 5, edge: 0.6, edgeW: 5, warp: 3, flow: 0.4, seed: 9 });
      W(Mk.darcyHair, { pig: '#39406a', pigB: '#4d3a3a', mix: { dir: [1, 0.4], at: 1500, width: 150, noise: 0.8 }, density: 1.05, edge: 1.0, edgeW: 5, soft: 1.1, warp: 3, rough: 2.2, roughScale: 6, flow: 0.55, flowScale: 70, gran: 0.6, seed: 11 });
      W(Mk.darcyRim, { mode: 'lift', lift: 0.32, soft: 2.5, warp: 1.5, rough: 1, seed: 47 });
      W(Mk.darcyHairLights, { mode: 'lift', lift: 0.4, soft: 3, warp: 2, rough: 1.5, seed: 12 });

      // gilt frame
      const shine = 0.7 + 0.25 * art * (0.5 + 0.5 * Math.sin(t * 5));
      W(Mk.frame, { pig: '#dcae57', pigB: '#b9773a', mix: { dir: [0.6, 0.8], at: 900, width: 260, noise: 0.9, noiseScale: 90 }, density: 1.0, edge: 1.3, edgeW: 5, warp: 3, warpScale: 90, rough: 1.4, flow: 0.55, flowScale: 70, gran: 0.6, seed: 13 });
      W(Mk.frameInner, { pig: '#8a5634', density: 0.75, soft: 2.5, edge: 0.9, edgeW: 4, warp: 3, rough: 1.2, gran: 0.5, seed: 14 });
      W(Mk.frameBead, { pig: '#b9773a', density: 0.7, edge: 1.6, edgeW: 2.5, warp: 1.5, warpScale: 40, rough: 0.8, seed: 15 });
      W(Mk.frameShine, { mode: 'lift', lift: shine, soft: 3, warp: 3, rough: 2, seed: 16 });
      W(Mk.bow, { pig: '#dcae57', pigB: '#b9773a', mix: { dir: [0, 1], at: 100, width: 60, noise: 0.8 }, density: 1.0, edge: 1.4, edgeW: 4, warp: 3, warpScale: 60, rough: 1.4, flow: 0.5, gran: 0.5, seed: 17 });

      // Elizabeth
      W(Mk.lizzy, { pig: '#f3a9a2', pigB: '#d488ae', mix: { dir: [-1, 0.5], at: -420, width: 240, noise: 1.0, noiseScale: 140 }, density: 0.92, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3.5, warpScale: 130, rough: 1.3, flow: 0.5, flowScale: 120, gran: 0.4,
        reveal: { dir: [0, 1], at: 985, soft: 105, noise: 60, noiseScale: 110 }, seed: 18 });
      W(Mk.lizzyShade, { pig: '#d98fa6', density: 0.35, soft: 26, edge: 0.2, warp: 16, warpScale: 90, flow: 0.6, seed: 19, reveal: { dir: [0, 1], at: 1000, soft: 70, noise: 50 } });
      W(Mk.cheek, { pig: '#f2a584', density: 0.55 + 0.25 * warm, soft: 24, edge: 0, warp: 10, warpScale: 60, flow: 0.4, seed: 20 });
      W(Mk.lips, { pig: '#c9506c', density: 0.62, soft: 1.2, edge: 1.1, edgeW: 3, warp: 1.2, warpScale: 40, rough: 0.6, seed: 21 });
      W(Mk.lizzyHair, { pig: '#9e4b52', pigB: '#6d3b35', mix: { dir: [-1, 0.2], at: -300, width: 180, noise: 0.9 }, density: 1.05, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, rough: 1.8, roughScale: 7, flow: 0.45, gran: 0.55, seed: 22 });
      W(Mk.lizzyHairLights, { mode: 'lift', lift: 0.5, soft: 2.5, warp: 2, rough: 1.4, seed: 23 });
      W(Mk.ribbon, { pig: '#6fb0a8', pigB: '#4f8f96', mix: { dir: [-1, 0.5], at: -100, width: 120, noise: 0.6 }, density: 1.0, edge: 1.3, edgeW: 4, warp: 2, warpScale: 70, rough: 1, flow: 0.4, gran: 0.4, seed: 24 });
      W(Mk.flower, { pig: '#f4d3da', density: 0.8, edge: 1.6, edgeW: 3, warp: 1.5, warpScale: 40, rough: 0.8, seed: 25 });
      W(Mk.flowerHeart, { pig: '#e9c46a', pigB: '#b9773a', mix: { dir: [1, 1], at: 0, width: 10, noise: 0.3 }, density: 1.1, edge: 1.2, edgeW: 3, gran: 0.9, seed: 26 });
      W(Mk.earring, { pig: '#e9c46a', density: 1.0, edge: 1.5, edgeW: 2, seed: 27 });

      // petals: launched on every "maybe"
      const TO = [1210, 430];
      let petals = [];
      [[17, true], [18, false], [19, true]].forEach(([li, like], k) => {
        petals = petals.concat(K.petalFlight(t, A.word(li, 'maybe'), FLOWER, TO, 4, like, 40 + k));
      });
      petals = petals.concat(K.petalFlight(t, A.word(20, 'guess'), FLOWER, [1000, 300], 6, (i) => i % 2 === 0, 60, { arc: -260, stagger: 0.14 }));
      petals = petals.concat(K.petalFlight(t, A.word(21, 'appreciate'), FLOWER, [960, 520], 9, (i) => i % 2 === 0, 70, { arc: -320, stagger: 0.2, life: 8 }));
      // a few petals already drifting as we arrive
      petals = petals.concat(K.petalFlight(t, 86.0, FLOWER, [1060, 520], 5, (i) => i % 2 === 0, 90, { stagger: 0.7, life: 9 }));
      K.paintPetals(eng, cam, Mk.petal, petals);

      W(Mk.splatRose, { pig: '#e58ea0', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 30 });
      W(Mk.splatIndigo, { pig: '#7382ad', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 31 });
      W(Mk.splatGold, { pig: '#dcae57', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 32 });
      W(Mk.splatViolet, { pig: '#b99ac0', density: 0.8, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 33 });
      const hp = A.ease(t, hate - 0.05, hate + 0.35, A.out);
      if (hp > 0) W(Mk.splatHate, { pig: '#5f6f9c', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 34, radial: { x: 1250, y: 330, r: 30 + 420 * hp, soft: 30 } });
      if (art > 0) W(Mk.splatArt, { pig: '#dcae57', density: 0.85, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 35, radial: { x: 960, y: 480, r: 520 * art, soft: 40 } });

      // ink: eyes, hanging cord; pencil underdrawing
      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      const blink = [88.1, 95.6, 103.8, 110.3].some((b) => t > b && t < b + 0.14);
      inLizzy(g, () => (blink ? F.inkEyeClosed(g, F.lizzy.eye, LZ.s) : F.inkEye(g, F.lizzy.eye, LZ.s)));
      inDarcy(g, () => F.inkEye(g, F.darcy.eye, DC.s));
      g.lineCap = 'round'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(OV.x, OV.y - OV.ry - 24); g.bezierCurveTo(OV.x - 3, OV.y - OV.ry - 120, OV.x + 2, OV.y - OV.ry - 200, OV.x - 2, -40); g.stroke();
      g.strokeStyle = '#0f0';
      const jit = WC.rng(99);
      for (let k = 0; k < 2; k++) { g.lineWidth = 1.1; g.beginPath(); g.ellipse(OV.x + jit.range(-6, 6), OV.y + jit.range(-6, 6), OV.rx + 8 + k * 5, OV.ry + 10 - k * 4, jit.range(-0.02, 0.02), 0, Math.PI * 2); g.stroke(); }
      inLizzy(g, () => { g.lineWidth = 1; const q = WC.sampleSpline(F.lizzyBody.slice(0, 24), false, LZ.s, 8); g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x + 7, y - 3) : g.moveTo(x + 7, y - 3))); g.stroke(); });
      g.beginPath(); g.arc(LZ.x - 0.262 * LZ.s + 4, LZ.y - 0.05 * LZ.s - 3, 0.19 * LZ.s, 0, 7); g.stroke();
      eng.ink({ strength: [1.7, 0.55, 1.3], seed: 3 });
    },
  };
})(window.WC = window.WC || {});
