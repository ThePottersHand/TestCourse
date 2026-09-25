// Scene: The Portrait (pre-chorus 2 + chorus 2).
// "But now I'm staring at his eyes": on bare paper, the eye of Darcy's portrait is drawn; his
// face floods out from it, the painted sky fills in around him, and the gilt frame runs round
// from its bow. We pull back to find Elizabeth, flooding onto the page as she studies it.
// Chorus: petals fly from her flower to him; his painted sky warms on "like" and storms on
// "hate"; a sunbeam crosses the gallery and the gilt glints; on "the art of making up my mind"
// violet and gold bloom between them.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, F = WC.figures, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 440, y: 228, s: 470 };
  const OV = { x: 1398, y: 470, rx: 252, ry: 330, band: 44 };
  const DC = { x: 1452, y: 248, s: 330 };
  const ovalInner = (g, grow = 0) => { g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - OV.band + grow, OV.ry - OV.band + grow, 0, 0, Math.PI * 2); };
  const inDarcy = (g, fn) => { g.save(); g.translate(DC.x, DC.y); g.scale(-1, 1); fn(); g.restore(); };
  const sub = (g, fn) => { g.save(); g.globalCompositeOperation = 'destination-out'; fn(); g.restore(); };
  const DARCY_EYE = [DC.x - F.darcy.eye.iris.x * DC.s, DC.y + F.darcy.eye.iris.y * DC.s];
  const BOW = [OV.x, OV.y - OV.ry - 6];
  const stroke = (g, pts, w) => WC.brushStroke(g, pts, w, 16);

  WC.scenes.portrait = {
    build(B) {
      K.commonMasks(B);
      const lo = { maskScale: 0.35, margin: 120 };
      B.mask('bg', K.rect(34, 30, 1852, 1022), { maskScale: 0.35, margin: 80, flood: { seeds: [DARCY_EYE] } });
      B.mask('gapBloom', (g) => { g.beginPath(); g.ellipse(930, 470, 310, 420, 0.1, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.4, margin: 140 });
      B.mask('violet', (g) => { g.beginPath(); g.ellipse(960, 520, 420, 380, 0, 0, Math.PI * 2); g.fill(); }, Object.assign({ flood: { seeds: [[960, 520]] } }, lo));
      B.mask('strokeWarm', (g) => { stroke(g, [[70, 520], [150, 300], [330, 120], [560, 70], [760, 110]], 120); stroke(g, [[90, 760], [140, 620], [230, 520]], 70); }, { maskScale: 0.5, margin: 60, flood: { seeds: [[70, 520], [90, 760]] } });
      B.mask('strokeCool', (g) => { g.beginPath(); WC.spline(g, [[1560, 150], [1720, 96], [1850, 190], [1872, 470], [1838, 760], [1750, 930], [1640, 900], [1690, 640], [1668, 380]], true, 1); g.fill(); }, { maskScale: 0.5, margin: 60, flood: { seeds: [[1720, 110]] } });
      B.mask('glow', (g) => { g.beginPath(); g.ellipse(470, 330, 330, 290, -0.3, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.4, margin: 140 });
      B.mask('frameShadow', (g) => { g.beginPath(); g.ellipse(OV.x + 16, OV.y + 20, OV.rx + 4, OV.ry + 4, 0, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.5, margin: 90 });
      B.mask('beam', (g) => { g.beginPath(); g.moveTo(-140, -80); g.lineTo(60, -80); g.lineTo(420, 1160); g.lineTo(160, 1160); g.fill(); }, { maskScale: 0.3, margin: 80 });

      // the portrait: sky and clouds inside the oval, Darcy's bust clipped to it
      B.mask('sky', (g) => { ovalInner(g, 6); g.fill(); sub(g, () => inDarcy(g, () => { F.darcy.body(g, DC.s); F.darcy.hair(g, DC.s, WC.rng(11)); })); }, { maskScale: 0.8, flood: { seeds: [[DARCY_EYE[0] - 70, DARCY_EYE[1] - 40], [DARCY_EYE[0] - 70, DARCY_EYE[1] + 60]] } });
      B.mask('cloud', (g) => {
        g.save(); ovalInner(g); g.clip();
        [[1200, 700, 90], [1290, 660, 110], [1420, 690, 95], [1540, 650, 120], [1640, 700, 80], [1340, 740, 120], [1520, 760, 110]].forEach(([x, y, r]) => WC.fillCircle(g, x, y, r));
        [[1180, 320, 40], [1230, 300, 55], [1290, 320, 42]].forEach(([x, y, r]) => WC.fillCircle(g, x, y, r));
        g.restore();
      }, { maskScale: 0.6 });
      C.darcyBust(B, 'dc', { x: DC.x, y: DC.y, s: DC.s, clip: (g) => { ovalInner(g); g.clip(); } });

      // gilt frame, flooding round both ways from the bow
      const ring = { flood: { seeds: [[OV.x, OV.y - OV.ry + OV.band / 2]] } };
      B.mask('frame', (g) => { g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx, OV.ry, 0, 0, Math.PI * 2); g.ellipse(OV.x, OV.y, OV.rx - OV.band, OV.ry - OV.band, 0, 0, Math.PI * 2); g.fill('evenodd'); }, ring);
      B.mask('frameInner', (g) => { g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - OV.band + 16, OV.ry - OV.band + 16, 0, 0, Math.PI * 2); g.ellipse(OV.x - 5, OV.y - 7, OV.rx - OV.band + 2, OV.ry - OV.band + 2, 0, 0, Math.PI * 2); g.fill('evenodd'); }, Object.assign({ margin: 30 }, ring));
      B.mask('frameBead', (g) => { for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; WC.fillCircle(g, OV.x + Math.cos(a) * (OV.rx - 11), OV.y + Math.sin(a) * (OV.ry - 11), 6.2); } }, { margin: 30 });
      B.mask('frameShine', (g) => { g.lineCap = 'round'; [[-2.55, -1.75], [-2.3, -2.05], [-1.5, -1.25]].forEach(([a0, a1]) => { g.lineWidth = 9; g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - 26, OV.ry - 26, 0, a0, a1); g.stroke(); }); }, { margin: 30 });
      B.mask('bow', (g) => {
        const [bx, by] = BOW;
        const loop = (d) => WC.fillSpline(g, [[bx + 6 * d, by - 2], [bx + 34 * d, by - 34], [bx + 70 * d, by - 34], [bx + 78 * d, by - 8], [bx + 58 * d, by + 10], [bx + 26 * d, by + 8]], true, 1);
        loop(-1); loop(1);
        WC.fillLock(g, bx - 8, by + 6, bx - 34, by + 62, 22, 0.2, 0.5); WC.fillLock(g, bx + 8, by + 6, bx + 38, by + 60, 22, -0.2, 0.5);
        WC.fillCircle(g, bx, by, 16);
      }, { margin: 40, flood: { seeds: [BOW] } });

      C.lizzyBust(B, 'lz', LZ);
      B.mask('splatRose', K.splat(3, 250, 150, 240, 150, 60, 9), { margin: 20 });
      B.mask('splatIndigo', K.splat(5, 1740, 180, 150, 180, 46, 8), { margin: 20 });
      B.mask('splatGold', K.splat(8, 1400, 110, 220, 70, 36, 6), { margin: 20 });
      B.mask('splatHate', K.splat(12, 1250, 330, 330, 260, 70, 12), { margin: 20 });
      B.mask('splatArt', K.splat(14, 960, 480, 520, 360, 90, 8), { margin: 20 });
    },

    render(eng, Mk, t) {
      // camera: start on the portrait's eye, pull back to the gallery
      const z = A.keys(t, [[85.5, 3.4], [86.9, 3.3], [89.6, 1.9], [92.0, 1.0], [106.8, 1.0], [112.6, 1.08]]);
      const c = A.keys(t, [[85.5, DARCY_EYE], [86.9, DARCY_EYE], [89.6, [1240, 440]], [92.0, [960, 540]], [106.8, [960, 540]], [112.6, [960, 500]]]);
      const cam = K.cam(z, c[0], c[1]);
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));

      const like1 = A.word(17, 'like'), hate = A.word(18, 'hate'), like2 = A.word(19, 'like');
      const warm = A.keys(t, [[like1 - 0.3, 0], [like1 + 0.5, 1], [hate - 0.2, 1], [hate + 0.4, 0], [like2 - 0.2, 0], [like2 + 0.6, 1], [112, 0.8]]);
      const storm = A.keys(t, [[hate - 0.3, 0], [hate + 0.3, 1], [like2 - 0.3, 1], [like2 + 0.5, 0]]);
      const artT = A.word(21, 'art');
      const art = A.ease(t, artT - 1.5, artT + 1.2);
      const pp = (a, d) => K.pp(t, a, d);

      // ---- the gallery wall, flooding out from the portrait
      W(Mk.bg, { pig: '#f4e5c8', pigB: '#e2e6e3', mix: { dir: [1, 0], at: 1100, width: 700, noise: 0.9, noiseScale: 260 },
        density: 0.42, edge: 0.5, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5,
        flood: { at: pp(87.4, 3.0), soft: 90, noise: 100, edge: 0.5 }, wet: K.wet(t, 87.4, 90.4), seed: 1 });
      W(Mk.glow, { pig: '#f6dca6', pigB: '#f3c7b8', mix: { dir: [1, 0.3], at: 520, width: 240, noise: 0.8 },
        density: (0.55 + 0.25 * warm) * pp(89.0, 1.6), soft: 60, edge: 0.15, edgeW: 20, warp: 50, warpScale: 200, rough: 8, roughScale: 40, flow: 0.7, flowScale: 90, gran: 0.15, seed: 44 });
      W(Mk.strokeWarm, { pig: '#efc2a4', pigB: '#e9a9b5', mix: { dir: [1, -0.5], at: 300, width: 200, noise: 0.8 },
        density: 0.55, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, flood: { at: pp(89.6, 1.4), soft: 30, noise: 30 }, wet: K.wet(t, 89.6, 91), seed: 45 });
      W(Mk.strokeCool, { pig: '#c3d3d6', pigB: '#b9bfdc', mix: { dir: [0, 1], at: 520, width: 260, noise: 0.9 },
        density: 0.5 + 0.35 * storm, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, flood: { at: pp(88.4, 1.4), soft: 30, noise: 30 }, wet: K.wet(t, 88.4, 89.8), seed: 46 });
      W(Mk.gapBloom, { pig: '#f0bccb', pigB: '#c3c9e4', mix: { dir: [1, -0.25], at: 930 - 120 * warm + 160 * storm, width: 220, noise: 1.2, noiseScale: 140, flow: 0.08, vein: 0.25 },
        density: 0.62 * pp(91.6, 1.2), soft: 42, edge: 0.25, edgeW: 20, warp: 60, warpScale: 200, rough: 10, roughScale: 40, flow: 0.85, flowScale: 70, gran: 0.25, wet: 0.6, wetAmp: 14, seed: 3 });
      if (art > 0) W(Mk.violet, { pig: '#c7a6d6', pigB: '#e9b4c4', mix: { dir: [1, 0], at: 900, width: 300, noise: 1.2, flow: 0.1 }, density: 0.6, soft: 50, edge: 0.6, edgeW: 20, warp: 50, warpScale: 180, flow: 0.8, flowScale: 80,
        flood: { at: art, soft: 60, noise: 80, edge: 1.0, edgeW: 24 }, wet: 1, wetAmp: 14, seed: 47 });
      W(Mk.frameShadow, { pig: '#b9b8c8', density: 0.55 * pp(88.2, 1.0), soft: 16, edge: 0.3, edgeW: 10, warp: 10, warpScale: 120, flow: 0.5, seed: 43 });

      // ---- the portrait: his face floods out from the eye, then the sky around him
      const skyP = pp(86.4, 1.8);
      const mood = { pig: '#a9d3cc', pigB: '#e3c9a0', mix: { dir: [0, 1], at: 700, width: 170, noise: 0.7, flow: 0.04 }, density: 0.95, edge: 0.9, edgeW: 7, soft: 1.6, warp: 5, rough: 1.5, flow: 0.5, flowScale: 110, gran: 0.35,
        flood: { at: skyP, soft: 30, noise: 40, edge: 1.1, edgeW: 16 }, wet: K.wet(t, 86.4, 88.2), seed: 4 };
      W(Mk.sky, mood);
      if (warm > 0.01) W(Mk.sky, { pig: '#f2c38e', pigB: '#ee9fb0', mix: { dir: [0, 1], at: 520, width: 200, noise: 1.2, noiseScale: 90, flow: 0.1 }, density: 0.8 * warm, edge: 0.4, soft: 3, warp: 8, flow: 0.7, flowScale: 90, wet: 0.6, wetAmp: 6, seed: 48 });
      if (storm > 0.01) W(Mk.sky, { pig: '#5d6b99', pigB: '#8b8fb0', mix: { dir: [0, 1], at: 420, width: 260, noise: 1.3, noiseScale: 90, flow: 0.14, vein: 0.3 }, density: 0.95 * storm, edge: 0.6, soft: 3, warp: 12, flow: 0.9, flowScale: 70, gran: 0.6, wet: 1, wetAmp: 8, seed: 49 });
      W(Mk.cloud, { mode: 'lift', lift: (0.75 - 0.35 * storm) * pp(87.4, 1.0), soft: 16, warp: 18, warpScale: 70, rough: 6, roughScale: 16, seed: 5 }, M.tr(Math.sin(t * 0.3) * 14, 0));
      C.paintDarcyBust(eng, Mk, 'dc', { cam, t, p: pp(85.7, 2.2), wet: K.wet(t, 85.7, 87.9), breathe: false, sway: 1 });

      // ---- gilt frame, running round from the bow
      const fp = pp(87.2, 1.6), shine = (0.7 + 0.25 * art * (0.5 + 0.5 * Math.sin(t * 5))) * A.ramp(fp, 0.8, 1);
      W(Mk.bow, { pig: '#dcae57', pigB: '#b9773a', mix: { dir: [0, 1], at: 100, width: 60, noise: 0.8 }, density: 1.0, edge: 1.4, edgeW: 4, warp: 3, warpScale: 60, rough: 1.4, flow: 0.5, gran: 0.5, flood: { at: pp(87.0, 0.6), soft: 10, noise: 10 }, seed: 17 });
      W(Mk.frame, { pig: '#dcae57', pigB: '#b9773a', mix: { dir: [0.6, 0.8], at: 900, width: 260, noise: 0.9, noiseScale: 90 }, density: 1.0, edge: 1.3, edgeW: 5, warp: 3, warpScale: 90, rough: 1.4, flow: 0.55, flowScale: 70, gran: 0.6,
        flood: { at: fp, soft: 20, noise: 20, edge: 1.2, edgeW: 12 }, wet: K.wet(t, 87.2, 88.8), wetAmp: 3, seed: 13 });
      W(Mk.frameInner, { pig: '#8a5634', density: 0.75, soft: 2.5, edge: 0.9, edgeW: 4, warp: 3, rough: 1.2, gran: 0.5, flood: { at: pp(87.5, 1.6), soft: 20, noise: 20 }, seed: 14 });
      W(Mk.frameBead, { pig: '#b9773a', density: 0.7 * A.ramp(fp, 0.7, 1), edge: 1.6, edgeW: 2.5, warp: 1.5, warpScale: 40, rough: 0.8, seed: 15 });
      W(Mk.frameShine, { mode: 'lift', lift: shine, soft: 3, warp: 3, rough: 2, seed: 16 });

      // ---- Elizabeth, flooding onto the page as we pull back
      C.paintLizzyBust(eng, Mk, 'lz', { cam, t, p: pp(90.0, 2.4), wet: K.wet(t, 90.0, 92.4), blush: 0.3 * warm, sway: 3 });

      // petals: launched on every "maybe"
      const FLOWER = Mk.lzInfo.flower, TO = [1210, 430];
      let petals = [];
      [[17, true], [18, false], [19, true]].forEach(([li, like], k) => { petals = petals.concat(K.petalFlight(t, A.word(li, 'maybe'), FLOWER, TO, 4, like, 40 + k)); });
      petals = petals.concat(K.petalFlight(t, A.word(20, 'guess'), FLOWER, [1000, 300], 6, (i) => i % 2 === 0, 60, { arc: -260, stagger: 0.14 }));
      petals = petals.concat(K.petalFlight(t, A.word(21, 'appreciate'), FLOWER, [960, 520], 9, (i) => i % 2 === 0, 70, { arc: -320, stagger: 0.2, life: 8 }));
      K.paintPetals(eng, cam, Mk.petal, petals);

      const sp = (a, r0, r1, x, y) => ({ x, y, r: r0 + r1 * pp(a, 0.35), soft: 20 });
      W(Mk.splatRose, { pig: '#e58ea0', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 30, radial: sp(like1 - 0.1, 20, 300, 250, 150) });
      W(Mk.splatIndigo, { pig: '#7382ad', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 31, radial: sp(88.0, 20, 260, 1740, 180) });
      W(Mk.splatGold, { pig: '#dcae57', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 32, radial: sp(87.6, 20, 260, 1400, 110) });
      const hp = A.ease(t, hate - 0.05, hate + 0.35, A.out);
      if (hp > 0) W(Mk.splatHate, { pig: '#5f6f9c', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 34, radial: { x: 1250, y: 330, r: 30 + 420 * hp, soft: 30 } });
      if (art > 0) W(Mk.splatArt, { pig: '#dcae57', density: 0.85, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 35, radial: { x: 960, y: 480, r: 520 * art, soft: 40 } });

      // ---- light: a sunbeam crosses the gallery; the gilt glints; a glow on "art"
      const bx = A.lerp(-300, 2100, A.ease(t, 91.4, 99.0));
      Lt(Mk.beam, { colour: '#ffdc98', density: 0.38 * A.env(t, 91.4, 99.0, 1.0, 1.5), soft: 60, warp: 30, streak: { angle: 1.25, amt: 0.6, len: 260 }, seed: 50 }, M.tr(bx, 0));
      [like1, like2, artT].forEach((w, k) => {
        K.glint(eng, cam, Mk.star, OV.x - OV.rx * 0.72, OV.y - OV.ry * 0.62, t, w + 0.1, 0.9, 34, '#fff3d0');
        K.glint(eng, cam, Mk.star, OV.x + OV.rx * 0.8, OV.y + OV.ry * 0.45, t, w + 0.35, 0.8, 26, '#fff3d0');
        if (k === 2) K.glint(eng, cam, Mk.star, BOW[0], BOW[1], t, w + 0.6, 1.0, 40, '#fff3d0');
      });
      Lt(Mk.violet, { colour: '#ffe2c4', density: 0.3 * art * (1 - A.ramp(t, 111.8, 112.6)), soft: 120, warp: 40, seed: 51 }, M.about(960, 520, 0, 0.7, 0.7));
      if (art > 0) K.motes(eng, cam, Mk.dot, t, { x: 960, y: 500, w: 800, h: 600, n: 22, r: 7, vy: -18, colour: '#ffe0a8', intensity: 0.5, alpha: art, seed: 8 });

      // ---- ink: his painted eye drawn first, her eye, the hanging cord, pencil underdrawing
      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      const blink = [95.6, 103.8, 110.3].some((b) => t > b && t < b + 0.14);
      C.inkDarcyBust(g, Mk.dcInfo, { p: pp(85.5, 1.0) });
      C.inkLizzyBust(g, Mk.lzInfo, { p: K.pp(t, 89.9, 0.9, (x) => x), closed: blink });
      g.lineCap = 'round'; g.lineWidth = 1.6;
      const cord = pp(88.0, 0.8);
      if (cord > 0) { g.beginPath(); g.moveTo(OV.x, OV.y - OV.ry - 24); g.bezierCurveTo(OV.x - 3, OV.y - OV.ry - 120, OV.x + 2, OV.y - OV.ry - 200, OV.x - 2, A.lerp(OV.y - OV.ry - 24, -40, cord)); g.stroke(); }
      g.strokeStyle = '#0f0';
      const jit = WC.rng(99), ring = pp(86.9, 1.2, A.inOut);
      for (let k = 0; k < 2; k++) { g.lineWidth = 1.1; g.beginPath(); g.ellipse(OV.x + jit.range(-6, 6), OV.y + jit.range(-6, 6), OV.rx + 8 + k * 5, OV.ry + 10 - k * 4, jit.range(-0.02, 0.02), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ring); g.stroke(); }
      C.sketchLizzy(g, Mk.lzInfo, K.pp(t, 89.6, 1.4, A.inOut));
      eng.ink({ strength: [1.7, 0.55, 1.3], seed: 3 });
    },
  };
})(window.WC = window.WC || {});
