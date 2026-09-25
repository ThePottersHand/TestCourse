// Scene: The Gallery (pre-chorus 2: "But now I'm staring at his eyes").
// Chapter 43, Pemberley's picture gallery: "she beheld a striking resemblance to Mr. Darcy".
// On bare paper his portrait appears as a silhouette flooding out from the brow, the painted sky
// fills in around him and the gilt frame runs round both ways from its bow. We pull back to
// find Elizabeth's silhouette flooding onto the page as she looks up at it, and a sunbeam
// crosses the gallery.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, F = WC.figures, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 440, y: 228, s: 470 };
  const OV = { x: 1398, y: 470, rx: 252, ry: 330, band: 44 };
  const DC = { x: 1452, y: 248, s: 330 };
  const ovalInner = (g, grow = 0) => { g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - OV.band + grow, OV.ry - OV.band + grow, 0, 0, Math.PI * 2); };
  const BOW = [OV.x, OV.y - OV.ry - 6];
  const stroke = (g, pts, w) => WC.brushStroke(g, pts, w, 16);

  WC.scenes.portrait = {
    build(B) {
      K.commonMasks(B);
      const D = C.bust(B, 'dc', { kind: 'darcy', x: DC.x, y: DC.y, s: DC.s, dir: -1, clip: (g) => { ovalInner(g); g.clip(); } });
      B.mask('bg', K.rect(34, 30, 1852, 1022), { maskScale: 0.35, margin: 80, flood: { seeds: [D.brow] } });
      B.mask('strokeWarm', (g) => { stroke(g, [[70, 520], [150, 300], [330, 120], [560, 70], [760, 110]], 120); stroke(g, [[90, 760], [140, 620], [230, 520]], 70); }, { maskScale: 0.5, margin: 60, flood: { seeds: [[70, 520], [90, 760]] } });
      B.mask('strokeCool', (g) => { g.beginPath(); WC.spline(g, [[1560, 150], [1720, 96], [1850, 190], [1872, 470], [1838, 760], [1750, 930], [1640, 900], [1690, 640], [1668, 380]], true, 1); g.fill(); }, { maskScale: 0.5, margin: 60, flood: { seeds: [[1720, 110]] } });
      B.mask('glow', (g) => { g.beginPath(); g.ellipse(470, 330, 330, 290, -0.3, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.4, margin: 140 });
      B.mask('frameShadow', (g) => { g.beginPath(); g.ellipse(OV.x + 16, OV.y + 20, OV.rx + 4, OV.ry + 4, 0, 0, Math.PI * 2); g.fill(); }, { maskScale: 0.5, margin: 90 });
      B.mask('beam', (g) => { g.beginPath(); g.moveTo(-140, -80); g.lineTo(60, -80); g.lineTo(420, 1160); g.lineTo(160, 1160); g.fill(); }, { maskScale: 0.3, margin: 80 });
      B.mask('sky', (g) => { ovalInner(g, 6); g.fill(); }, { maskScale: 0.6, flood: { seeds: [D.brow] } });
      B.mask('cloud', (g) => {
        g.save(); ovalInner(g); g.clip();
        [[1200, 700, 90], [1290, 660, 110], [1420, 690, 95], [1540, 650, 120], [1640, 700, 80], [1340, 740, 120], [1520, 760, 110]].forEach(([x, y, r]) => WC.fillCircle(g, x, y, r));
        [[1180, 320, 40], [1230, 300, 55], [1290, 320, 42]].forEach(([x, y, r]) => WC.fillCircle(g, x, y, r));
        g.restore();
      }, { maskScale: 0.6 });
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
      C.bust(B, 'lz', { kind: 'lizzy', x: LZ.x, y: LZ.y, s: LZ.s, dir: 1 });
      B.mask('splatIndigo', K.splat(5, 1740, 180, 150, 180, 46, 8), { margin: 20 });
      B.mask('splatGold', K.splat(8, 1400, 110, 220, 70, 36, 6), { margin: 20 });
    },

    render(eng, Mk, t) {
      const DB = Mk.dcInfo.brow;
      const z = A.keys(t, [[85.5, 2.6], [86.6, 2.5], [89.2, 1.6], [91.2, 1.0], [92.6, 1.0]]);
      const c = A.keys(t, [[85.5, [DB[0] - 40, DB[1] + 60]], [86.6, [DB[0] - 40, DB[1] + 60]], [89.2, [1240, 440]], [91.2, [960, 540]], [92.6, [960, 540]]]);
      const cam = K.cam(z, c[0], c[1]);
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);

      // ---- the gallery wall, flooding out from the portrait
      W(Mk.bg, { pig: '#f4e5c8', pigB: '#e2e6e3', mix: { dir: [1, 0], at: 1100, width: 700, noise: 0.9, noiseScale: 260 },
        density: 0.42, edge: 0.5, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5,
        flood: { at: pp(86.6, 3.0), soft: 90, noise: 100, edge: 0.5 }, wet: K.wet(t, 86.6, 89.6), seed: 1 });
      W(Mk.glow, { pig: '#f6dca6', pigB: '#f3c7b8', mix: { dir: [1, 0.3], at: 520, width: 240, noise: 0.8 },
        density: 0.55 * pp(88.6, 1.6), soft: 60, edge: 0.15, edgeW: 20, warp: 50, warpScale: 200, rough: 8, roughScale: 40, flow: 0.7, flowScale: 90, gran: 0.15, seed: 44 });
      W(Mk.strokeWarm, { pig: '#efc2a4', pigB: '#e9a9b5', mix: { dir: [1, -0.5], at: 300, width: 200, noise: 0.8 },
        density: 0.55, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, flood: { at: pp(89.2, 1.4), soft: 30, noise: 30 }, wet: K.wet(t, 89.2, 90.6), seed: 45 });
      W(Mk.strokeCool, { pig: '#c3d3d6', pigB: '#b9bfdc', mix: { dir: [0, 1], at: 520, width: 260, noise: 0.9 },
        density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, flood: { at: pp(88.0, 1.4), soft: 30, noise: 30 }, wet: K.wet(t, 88.0, 89.4), seed: 46 });
      W(Mk.frameShadow, { pig: '#b9b8c8', density: 0.55 * pp(87.8, 1.0), soft: 16, edge: 0.3, edgeW: 10, warp: 10, warpScale: 120, flow: 0.5, seed: 43 });

      // ---- the portrait: a pale sky, and his silhouette flooding out from the brow
      W(Mk.sky, { pig: '#bcd8d0', pigB: '#ecdcc0', mix: { dir: [0, 1], at: 700, width: 180, noise: 0.8, flow: 0.03 }, density: 0.7, edge: 0.9, edgeW: 7, soft: 1.6, warp: 5, rough: 1.5, flow: 0.5, flowScale: 110, gran: 0.35,
        flood: { at: pp(86.1, 1.8), soft: 30, noise: 40, edge: 1.1, edgeW: 16 }, wet: K.wet(t, 86.1, 87.9), seed: 4 });
      W(Mk.cloud, { mode: 'lift', lift: 0.6 * pp(87.0, 1.0), soft: 16, warp: 18, warpScale: 70, rough: 6, roughScale: 16, seed: 5 }, M.tr(Math.sin(t * 0.3) * 14, 0));
      C.paintBust(eng, Mk, 'dc', { cam, t, p: pp(85.55, 2.2), wet: K.wet(t, 85.55, 87.8), breathe: false, fadeBottom: 2000 });

      // ---- gilt frame, running round from the bow
      const fp = pp(86.8, 1.6), shine = 0.7 * A.ramp(fp, 0.8, 1);
      W(Mk.bow, { pig: '#dcae57', pigB: '#b9773a', mix: { dir: [0, 1], at: 100, width: 60, noise: 0.8 }, density: 1.0, edge: 1.4, edgeW: 4, warp: 3, warpScale: 60, rough: 1.4, flow: 0.5, gran: 0.5, flood: { at: pp(86.6, 0.6), soft: 10, noise: 10 }, seed: 17 });
      W(Mk.frame, { pig: '#dcae57', pigB: '#b9773a', mix: { dir: [0.6, 0.8], at: 900, width: 260, noise: 0.9, noiseScale: 90 }, density: 1.0, edge: 1.3, edgeW: 5, warp: 3, warpScale: 90, rough: 1.4, flow: 0.55, flowScale: 70, gran: 0.6,
        flood: { at: fp, soft: 20, noise: 20, edge: 1.2, edgeW: 12 }, wet: K.wet(t, 86.8, 88.4), wetAmp: 3, seed: 13 });
      W(Mk.frameInner, { pig: '#8a5634', density: 0.75, soft: 2.5, edge: 0.9, edgeW: 4, warp: 3, rough: 1.2, gran: 0.5, flood: { at: pp(87.1, 1.6), soft: 20, noise: 20 }, seed: 14 });
      W(Mk.frameBead, { pig: '#b9773a', density: 0.7 * A.ramp(fp, 0.7, 1), edge: 1.6, edgeW: 2.5, warp: 1.5, warpScale: 40, rough: 0.8, seed: 15 });
      W(Mk.frameShine, { mode: 'lift', lift: shine, soft: 3, warp: 3, rough: 2, seed: 16 });

      // ---- Elizabeth, flooding onto the page as we pull back
      C.paintBust(eng, Mk, 'lz', { cam, t, p: pp(89.2, 2.2), wet: K.wet(t, 89.2, 91.4) });
      W(Mk.splatIndigo, { pig: '#7382ad', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 31, radial: { x: 1740, y: 180, r: 20 + 260 * pp(87.6, 0.35), soft: 20 } });
      W(Mk.splatGold, { pig: '#dcae57', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 32, radial: { x: 1400, y: 110, r: 20 + 260 * pp(87.2, 0.35), soft: 20 } });
      K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 89.6, Mk.lzInfo.brow, [1210, 430], 5, (i) => i % 2 === 0, 90, { stagger: 0.35, life: 6 }));

      // ---- light: a sunbeam crossing the gallery, the gilt catching it
      const bx = A.lerp(-300, 2100, A.ease(t, 88.4, 93.0));
      Lt(Mk.beam, { colour: '#ffdc98', density: 0.38 * A.env(t, 88.4, 93.0, 1.0, 1.0), soft: 60, warp: 30, streak: { angle: 1.25, amt: 0.6, len: 260 }, seed: 50 }, M.tr(bx, 0));
      K.glint(eng, cam, Mk.star, OV.x - OV.rx * 0.72, OV.y - OV.ry * 0.62, t, 90.6, 0.9, 34, '#fff3d0');
      K.glint(eng, cam, Mk.star, BOW[0], BOW[1], t, 91.0, 1.0, 40, '#fff3d0');

      // ---- ink: the hanging cord, the pencil ring and profile under the paint
      const g = K.ink(eng, cam);
      g.strokeStyle = '#f00'; g.lineCap = 'round'; g.lineWidth = 1.6;
      const cord = pp(87.4, 0.8);
      if (cord > 0) { g.beginPath(); g.moveTo(OV.x, OV.y - OV.ry - 24); g.bezierCurveTo(OV.x - 3, OV.y - OV.ry - 120, OV.x + 2, OV.y - OV.ry - 200, OV.x - 2, A.lerp(OV.y - OV.ry - 24, -40, cord)); g.stroke(); }
      g.strokeStyle = '#0f0';
      const jit = WC.rng(99), ring = pp(86.3, 1.2);
      for (let k = 0; k < 2; k++) { g.lineWidth = 1.1; g.beginPath(); g.ellipse(OV.x + jit.range(-6, 6), OV.y + jit.range(-6, 6), OV.rx + 8 + k * 5, OV.ry + 10 - k * 4, jit.range(-0.02, 0.02), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ring); g.stroke(); }
      C.sketchBust(g, Mk.lzInfo, K.pp(t, 88.8, 1.4, A.inOut));
      eng.ink({ strength: [1.7, 0.55, 1.3], seed: 3 });
    },
  };
})(window.WC = window.WC || {});
