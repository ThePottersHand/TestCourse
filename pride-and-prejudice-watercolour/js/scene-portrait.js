// Scene: "The Portrait" — Chorus key frame.
// Elizabeth (rose madder) gazes at Darcy's portrait silhouette (indigo) in an oval gilt frame,
// in the Pemberley picture gallery. The flower in her hair sheds petals toward him — rose for
// "maybe I like him", indigo for "maybe I hate him" — and the chorus is written across the page.
(function (WC) {
  'use strict';
  WC.scenes = WC.scenes || {};

  const PAL = {
    paperWash: '#efdcb8', rose: '#e58ea0', roseDeep: '#b7384f', blush: '#f2a584',
    hairL: '#9e4b52', teal: '#6fb0a8', tealSky: '#a9d3cc', cloud: '#f7efe0',
    indigo: '#7382ad', indigoDeep: '#3f4c78', hairD: '#39406a', cravat: '#c3cadc',
    ochre: '#dcae57', sienna: '#b9773a', umber: '#8a5634', gold: '#e9c46a',
    petalRose: '#ec9aab', petalIndigo: '#8e9cc4', ink: '#2f2019',
  };

  // Layout (design px)
  const LZ = { x: 440, y: 228, s: 470 };               // Elizabeth: crown position + scale
  const OV = { x: 1398, y: 470, rx: 252, ry: 330, band: 44 };  // oval frame
  const DC = { x: 1452, y: 248, s: 330 };              // Darcy inside the frame (mirrored)

  const inLizzy = (g, fn) => { g.save(); g.translate(LZ.x, LZ.y); fn(); g.restore(); };
  const inDarcy = (g, fn) => { g.save(); g.translate(DC.x, DC.y); g.scale(-1, 1); fn(); g.restore(); };
  const ovalInner = (g, shrink = 0) => { g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - OV.band + shrink, OV.ry - OV.band + shrink, 0, 0, Math.PI * 2); };
  const sub = (g, fn) => { g.save(); g.globalCompositeOperation = 'destination-out'; fn(); g.restore(); };

  // Petal flight path from the flower in her hair, across the gap, toward the portrait.
  const petalPath = [[418, 176], [560, 104], [750, 96], [915, 180], [1010, 320], [1040, 480], [990, 640], [915, 770]];
  const petals = (() => {
    const rnd = WC.rng(42), out = [];
    const pts = WC.sampleSpline(petalPath, false, 1, 20);
    const N = 11;
    for (let i = 0; i < N; i++) {
      const t = Math.pow((i + 0.6) / N, 0.9);
      const q = pts[Math.min(pts.length - 1, Math.floor(t * (pts.length - 1)))];
      out.push({
        x: q[0] + rnd.range(-28, 28), y: q[1] + rnd.range(-24, 24),
        rot: rnd.range(0, Math.PI * 2), len: rnd.range(56, 80), wid: 1,
        squash: rnd.range(0.72, 1), like: i % 2 === 0, seed: i + 3,
      });
    }
    return out;
  })();

  WC.scenes.portrait = {
    PAL, LZ, OV, DC,

    build(eng) {
      const L = WC.figures.lizzy, D = WC.figures.darcy;
      const M = {};
      const m = (name, draw, o) => (M[name] = eng.maskAuto(draw, o));

      // ---- background: a loose sheet-wide wash with ragged margins
      m('bg', (g) => { g.beginPath(); g.rect(34, 30, 1852, 1022); g.fill(); }, { margin: 80 });
      m('gapBloom', (g) => { g.beginPath(); g.ellipse(930, 470, 310, 420, 0.1, 0, Math.PI * 2); g.fill(); }, { margin: 140 });
      m('strokeWarm', (g) => {
        g.lineCap = 'round';
        const st = (pts, w) => { const q = WC.sampleSpline(pts, false, 1, 16);
          for (let i = 1; i < q.length; i++) { const t = i / q.length; g.lineWidth = w * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.2)));
            g.beginPath(); g.moveTo(q[i - 1][0], q[i - 1][1]); g.lineTo(q[i][0], q[i][1]); g.stroke(); } };
        st([[70, 520], [150, 300], [330, 120], [560, 70], [760, 110]], 120);
        st([[90, 760], [140, 620], [230, 520]], 70);
      }, { margin: 60 });
      m('strokeCool', (g) => {
        g.lineCap = 'round';
        const st = (pts, w) => { const q = WC.sampleSpline(pts, false, 1, 16);
          for (let i = 1; i < q.length; i++) { const t = i / q.length; g.lineWidth = w * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.2)));
            g.beginPath(); g.moveTo(q[i - 1][0], q[i - 1][1]); g.lineTo(q[i][0], q[i][1]); g.stroke(); } };
        g.beginPath(); WC.spline(g, [[1560, 150], [1720, 96], [1850, 190], [1872, 470], [1838, 760], [1750, 930], [1640, 900], [1690, 640], [1668, 380]], true, 1); g.fill();
      }, { margin: 60 });
      m('glow', (g) => { g.beginPath(); g.ellipse(470, 330, 330, 290, -0.3, 0, Math.PI * 2); g.fill(); }, { margin: 140 });
      m('darcyRim', (g) => {
        g.save(); ovalInner(g); g.clip();
        inDarcy(g, () => {
          g.save(); g.beginPath(); WC.spline(g, WC.figures.darcyBody, true, DC.s); g.clip();
          g.lineWidth = 7; g.lineJoin = 'round';
          g.beginPath(); WC.spline(g, WC.figures.darcyBody.slice(0, 18), false, DC.s); g.strokeStyle = '#fff'; g.stroke();
          g.restore();
        });
        g.restore();
      }, { margin: 30 });
      m('frameShadow', (g) => {
        g.beginPath(); g.ellipse(OV.x + 16, OV.y + 20, OV.rx + 4, OV.ry + 4, 0, 0, Math.PI * 2); g.fill();
      }, { margin: 90 });

      // ---- portrait interior: teal sky painted around Darcy
      m('sky', (g) => {
        ovalInner(g, 6); g.fill();
        sub(g, () => inDarcy(g, () => { D.body(g, DC.s); D.hair(g, DC.s, WC.rng(11)); }));
      });
      m('cloud', (g) => {
        g.save(); ovalInner(g); g.clip();
        [[1200, 700, 90], [1290, 660, 110], [1420, 690, 95], [1540, 650, 120], [1640, 700, 80], [1340, 740, 120], [1520, 760, 110]]
          .forEach(([x, y, r]) => WC.fillCircle(g, x, y, r));
        [[1180, 320, 40], [1230, 300, 55], [1290, 320, 42]].forEach(([x, y, r]) => WC.fillCircle(g, x, y, r));
        g.restore();
      });
      m('darcy', (g) => {
        g.save(); ovalInner(g); g.clip();
        inDarcy(g, () => D.body(g, DC.s));
        sub(g, () => inDarcy(g, () => D.cravat(g, DC.s)));
        g.restore();
      });
      m('darcyCoat', (g) => {
        g.save(); ovalInner(g); g.clip();
        inDarcy(g, () => {
          g.beginPath(); g.rect(-2 * DC.s, 0.9 * DC.s, 4 * DC.s, 2 * DC.s); g.clip();
          D.body(g, DC.s);
        });
        sub(g, () => inDarcy(g, () => D.cravat(g, DC.s)));
        g.restore();
      });
      m('darcyCollar', (g) => { g.save(); ovalInner(g); g.clip(); inDarcy(g, () => D.coatCollar(g, DC.s)); g.restore(); });
      m('darcyHair', (g) => { g.save(); ovalInner(g); g.clip(); inDarcy(g, () => D.hair(g, DC.s, WC.rng(11))); g.restore(); });
      m('darcyHairLights', (g) => inDarcy(g, () => D.hairLights(g, DC.s)), { margin: 30 });
      m('cravatShade', (g) => inDarcy(g, () => D.cravatShade(g, DC.s)), { margin: 30 });

      // ---- gilt oval frame with a ribbon-bow crest
      m('frame', (g) => {
        g.beginPath();
        g.ellipse(OV.x, OV.y, OV.rx, OV.ry, 0, 0, Math.PI * 2);
        g.ellipse(OV.x, OV.y, OV.rx - OV.band, OV.ry - OV.band, 0, 0, Math.PI * 2);
        g.fill('evenodd');
      });
      m('frameInner', (g) => {   // shadowed inner moulding (lower right)
        g.beginPath();
        g.ellipse(OV.x, OV.y, OV.rx - OV.band + 16, OV.ry - OV.band + 16, 0, 0, Math.PI * 2);
        g.ellipse(OV.x - 5, OV.y - 7, OV.rx - OV.band + 2, OV.ry - OV.band + 2, 0, 0, Math.PI * 2);
        g.fill('evenodd');
      }, { margin: 30 });
      m('frameBead', (g) => {    // beaded ornament around the outer edge
        for (let i = 0; i < 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          WC.fillCircle(g, OV.x + Math.cos(a) * (OV.rx - 11), OV.y + Math.sin(a) * (OV.ry - 11), 6.2);
        }
      }, { margin: 30 });
      m('frameShine', (g) => {   // highlights lifted on the upper left
        g.lineCap = 'round';
        [[-2.55, -1.75, 0.5], [-2.3, -2.05, 0.4], [-1.5, -1.25, 0.3]].forEach(([a0, a1, w]) => {
          g.lineWidth = 9; g.beginPath(); g.ellipse(OV.x, OV.y, OV.rx - 26, OV.ry - 26, 0, a0, a1); g.stroke();
        });
      }, { margin: 30 });
      m('bow', (g) => {
        const bx = OV.x, by = OV.y - OV.ry - 6;
        const loop = (d) => WC.fillSpline(g, [[bx + 6 * d, by - 2], [bx + 34 * d, by - 34], [bx + 70 * d, by - 34], [bx + 78 * d, by - 8],
          [bx + 58 * d, by + 10], [bx + 26 * d, by + 8]], true, 1);
        loop(-1); loop(1);
        WC.fillLock(g, bx - 8, by + 6, bx - 34, by + 62, 22, 0.2, 0.5);
        WC.fillLock(g, bx + 8, by + 6, bx + 38, by + 60, 22, -0.2, 0.5);
        WC.fillCircle(g, bx, by, 16);
      }, { margin: 40 });

      // ---- Elizabeth
      const ribbonAndFlower = (g) => { L.ribbon(g, LZ.s); L.flowerPetals(g, LZ.s); };
      m('lizzy', (g) => {
        inLizzy(g, () => L.body(g, LZ.s));
        sub(g, () => inLizzy(g, () => ribbonAndFlower(g)));
      });
      m('lizzyShade', (g) => {  // second glaze: shadow side of neck and bust
        inLizzy(g, () => {
          g.save(); g.beginPath(); WC.spline(g, F_shadeClip, true, LZ.s); g.clip();
          L.body(g, LZ.s); g.restore();
        });
      }, { margin: 60 });
      m('lizzyHair', (g) => {
        inLizzy(g, () => L.hair(g, LZ.s, WC.rng(7)));
        sub(g, () => inLizzy(g, () => ribbonAndFlower(g)));
      });
      m('lizzyHairLights', (g) => inLizzy(g, () => L.hairLights(g, LZ.s)), { margin: 30 });
      m('ribbon', (g) => inLizzy(g, () => L.ribbon(g, LZ.s)));
      m('lips', (g) => inLizzy(g, () => L.lips(g, LZ.s)), { margin: 30 });
      m('cheek', (g) => inLizzy(g, () => L.cheek(g, LZ.s)), { margin: 80 });
      m('earring', (g) => inLizzy(g, () => L.earring(g, LZ.s)), { margin: 20 });
      m('flower', (g) => inLizzy(g, () => L.flowerPetals(g, LZ.s)), { margin: 30 });
      m('flowerHeart', (g) => inLizzy(g, () => L.flowerHeart(g, LZ.s)), { margin: 20 });

      // ---- petals in flight (one shared mask, placed per petal)
      M.petal = eng.mask((g) => { const p = WC.figures.petal(new Path2D(), 100, 42); g.fill(p); }, { x: 0, y: -24, w: 100, h: 48 }, { margin: 24, maskScale: 2 });

      // ---- splatters
      const splat = (seed, cx, cy, rx, ry, n, rmax) => (g) => {
        const r = WC.rng(seed);
        for (let i = 0; i < n; i++) {
          const a = r() * Math.PI * 2, d = Math.pow(r(), 1.6);
          const rr = Math.max(1.2, rmax * Math.pow(r(), 2.4));
          WC.fillCircle(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rr);
        }
      };
      m('splatRose', splat(3, 250, 150, 240, 150, 60, 9), { margin: 20 });
      m('splatIndigo', splat(5, 1740, 180, 150, 180, 46, 8), { margin: 20 });
      m('splatGold', splat(8, 1400, 110, 220, 70, 36, 6), { margin: 20 });
      m('splatViolet', splat(9, 960, 560, 160, 260, 26, 6), { margin: 20 });

      // ---- a drip running out of the portrait


      // ---- painted lyric words
      m('wordLike', (g) => { g.font = '84px Pinyon'; g.fillText('like', LY.likeX, LY.y1); }, { margin: 20 });
      m('wordHate', (g) => { g.font = '84px Pinyon'; g.fillText('hate', LY.hateX, LY.y2); }, { margin: 20 });
      return M;
    },

    render(eng, M, t = 0, o = {}) {
      const P = PAL;
      const cam = o.cam || [1, 0, 0, 1, 0, 0];
      const W = (mask, p) => eng.wash(mask, Object.assign({ xf: cam }, p));
      eng.begin();

      // background glaze, warm left -> cool right
      W(M.bg, { pig: '#f4e5c8', pigB: '#e2e6e3', mix: { dir: [1, 0], at: 1100, width: 700, noise: 0.9, noiseScale: 260 },
        density: 0.42, edge: 0.5, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5, seed: 1 });
      W(M.glow, { pig: '#f6dca6', pigB: '#f3c7b8', mix: { dir: [1, 0.3], at: 520, width: 240, noise: 0.8 },
        density: 0.55, soft: 60, edge: 0.15, edgeW: 20, warp: 50, warpScale: 200, rough: 8, roughScale: 40, flow: 0.7, flowScale: 90, gran: 0.15, seed: 44 });
      W(M.strokeWarm, { pig: '#efc2a4', pigB: '#e9a9b5', mix: { dir: [1, -0.5], at: 300, width: 200, noise: 0.8 },
        density: 0.55, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, seed: 45 });
      W(M.strokeCool, { pig: '#c3d3d6', pigB: '#b9bfdc', mix: { dir: [0, 1], at: 520, width: 260, noise: 0.9 },
        density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, seed: 46 });
      W(M.gapBloom, { pig: '#f0bccb', pigB: '#c3c9e4', mix: { dir: [1, -0.25], at: 930, width: 220, noise: 1.1, noiseScale: 140 },
        density: 0.62, soft: 42, edge: 0.25, edgeW: 20, warp: 60, warpScale: 200, rough: 10, roughScale: 40, flow: 0.85, flowScale: 70, gran: 0.25, seed: 3 });
      W(M.frameShadow, { pig: '#b9b8c8', density: 0.55, soft: 16, edge: 0.3, edgeW: 10, warp: 10, warpScale: 120, flow: 0.5, seed: 43 });

      // portrait: sky, clouds lifted, Darcy
      W(M.sky, { pig: P.tealSky, pigB: '#e3c9a0', mix: { dir: [0, 1], at: 700, width: 170, noise: 0.6 },
        density: 0.95, edge: 0.9, edgeW: 7, soft: 1.6, warp: 5, rough: 1.5, flow: 0.5, flowScale: 110, gran: 0.35, seed: 4 });
      W(M.cloud, { mode: 'lift', lift: 0.75, soft: 16, warp: 18, warpScale: 70, rough: 6, roughScale: 16, seed: 5 });
      W(M.darcy, { pig: '#8494bd', pigB: '#6273a0', mix: { dir: [0.3, 1], at: 520, width: 240, noise: 0.7 },
        density: 0.92, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, warpScale: 120, rough: 1.2, flow: 0.45, flowScale: 90, gran: 0.45, seed: 6 });
      W(M.darcyCoat, { pig: P.indigoDeep, density: 0.95, edge: 0.9, edgeW: 5, soft: 1.2, warp: 3, rough: 1.2, flow: 0.5, gran: 0.6, seed: 7 });
      W(M.darcyCollar, { pig: P.indigoDeep, density: 0.8, edge: 1.2, edgeW: 4, warp: 2, rough: 1, gran: 0.5, seed: 8 });
      W(M.cravatShade, { pig: P.cravat, density: 0.9, soft: 5, edge: 0.6, edgeW: 5, warp: 3, flow: 0.4, seed: 9 });
      W(M.darcyHair, { pig: P.hairD, pigB: '#4d3a3a', mix: { dir: [1, 0.4], at: 1500, width: 150, noise: 0.8 },
        density: 1.05, edge: 1.0, edgeW: 5, soft: 1.1, warp: 3, rough: 2.2, roughScale: 6, flow: 0.55, flowScale: 70, gran: 0.6, seed: 11 });
      W(M.darcyRim, { mode: 'lift', lift: 0.32, soft: 2.5, warp: 1.5, rough: 1, seed: 47 });
      W(M.darcyHairLights, { mode: 'lift', lift: 0.4, soft: 3, warp: 2, rough: 1.5, seed: 12 });

      // frame
      W(M.frame, { pig: P.ochre, pigB: P.sienna, mix: { dir: [0.6, 0.8], at: 900, width: 260, noise: 0.9, noiseScale: 90 },
        density: 1.0, edge: 1.3, edgeW: 5, warp: 3, warpScale: 90, rough: 1.4, flow: 0.55, flowScale: 70, gran: 0.6, seed: 13 });
      W(M.frameInner, { pig: P.umber, density: 0.75, soft: 2.5, edge: 0.9, edgeW: 4, warp: 3, rough: 1.2, gran: 0.5, seed: 14 });
      W(M.frameBead, { pig: P.sienna, density: 0.7, edge: 1.6, edgeW: 2.5, warp: 1.5, warpScale: 40, rough: 0.8, seed: 15 });
      W(M.frameShine, { mode: 'lift', lift: 0.7, soft: 3, warp: 3, rough: 2, seed: 16 });
      W(M.bow, { pig: P.ochre, pigB: P.sienna, mix: { dir: [0, 1], at: 100, width: 60, noise: 0.8 },
        density: 1.0, edge: 1.4, edgeW: 4, warp: 3, warpScale: 60, rough: 1.4, flow: 0.5, gran: 0.5, seed: 17 });

      // Elizabeth
      W(M.lizzy, { pig: '#f3a9a2', pigB: '#d488ae', mix: { dir: [-1, 0.5], at: -420, width: 240, noise: 1.0, noiseScale: 140 },
        density: 0.92, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3.5, warpScale: 130, rough: 1.3, flow: 0.5, flowScale: 120, gran: 0.4,
        reveal: { dir: [0, 1], at: 985, soft: 105, noise: 60, noiseScale: 110 }, seed: 18 });
      W(M.lizzyShade, { pig: '#d98fa6', density: 0.35, soft: 26, edge: 0.2, warp: 16, warpScale: 90, flow: 0.6, seed: 19,
        reveal: { dir: [0, 1], at: 1000, soft: 70, noise: 50 } });

      W(M.cheek, { pig: P.blush, density: 0.55, soft: 24, edge: 0, warp: 10, warpScale: 60, flow: 0.4, seed: 20 });
      W(M.lips, { pig: '#c9506c', density: 0.62, soft: 1.2, edge: 1.1, edgeW: 3, warp: 1.2, warpScale: 40, rough: 0.6, seed: 21 });
      W(M.lizzyHair, { pig: P.hairL, pigB: '#6d3b35', mix: { dir: [-1, 0.2], at: -300, width: 180, noise: 0.9 },
        density: 1.05, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, rough: 1.8, roughScale: 7, flow: 0.45, gran: 0.55, seed: 22 });
      W(M.lizzyHairLights, { mode: 'lift', lift: 0.5, soft: 2.5, warp: 2, rough: 1.4, seed: 23 });
      W(M.ribbon, { pig: P.teal, pigB: '#4f8f96', mix: { dir: [-1, 0.5], at: -100, width: 120, noise: 0.6 },
        density: 1.0, edge: 1.3, edgeW: 4, warp: 2, warpScale: 70, rough: 1, flow: 0.4, gran: 0.4, seed: 24 });
      W(M.flower, { pig: '#f4d3da', density: 0.8, edge: 1.6, edgeW: 3, warp: 1.5, warpScale: 40, rough: 0.8, seed: 25 });
      W(M.flowerHeart, { pig: P.gold, pigB: P.sienna, mix: { dir: [1, 1], at: 0, width: 10, noise: 0.3 }, density: 1.1, edge: 1.2, edgeW: 3, gran: 0.9, seed: 26 });
      W(M.earring, { pig: P.gold, density: 1.0, edge: 1.5, edgeW: 2, seed: 27 });

      // petals: like = rose, hate = indigo
      petals.forEach((p) => {
        const s = p.len / 100;
        const c = Math.cos(p.rot), sn = Math.sin(p.rot);
        const xf = WC.mat.mul(cam, [c * s, sn * s, -sn * s * p.squash, c * s * p.squash, p.x, p.y]);
        eng.wash(M.petal, { xf, pig: p.like ? P.petalRose : P.petalIndigo, density: 0.85, hollow: 0.45, hollowW: 12,
          edge: 1.6, edgeW: 3, soft: 1, warp: 2.5, warpScale: 30, rough: 1.0, roughScale: 5, flow: 0.4, flowScale: 30, gran: 0.4, seed: p.seed });
      });

      // splatters + drip
      W(M.splatRose, { pig: P.rose, density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 30 });
      W(M.splatIndigo, { pig: P.indigo, density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 31 });
      W(M.splatGold, { pig: P.ochre, density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 32 });
      W(M.splatViolet, { pig: '#b99ac0', density: 0.8, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 33 });


      // painted words
      W(M.wordLike, { pig: '#cd5470', density: 1.15, edge: 1.3, edgeW: 2.2, soft: 0.8, warp: 1.2, warpScale: 50, rough: 0.5, roughScale: 4, flow: 0.4, flowScale: 40, gran: 0.3, seed: 35 });
      W(M.wordHate, { pig: '#3c4a7e', density: 1.1, edge: 1.3, edgeW: 2.2, soft: 0.8, warp: 1.2, warpScale: 50, rough: 0.5, roughScale: 4, flow: 0.4, flowScale: 40, gran: 0.3, seed: 36 });

      // ink: eyes, brows, lettering, hanging cord
      let g = eng.layer();
      g.fillStyle = g.strokeStyle = '#000';
      inLizzy(g, () => WC.figures.inkEye(g, WC.figures.lizzy.eye, LZ.s));
      inDarcy(g, () => WC.figures.inkEye(g, WC.figures.darcy.eye, DC.s));
      g.lineCap = 'round'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(OV.x, OV.y - OV.ry - 24); g.bezierCurveTo(OV.x - 3, OV.y - OV.ry - 120, OV.x + 2, OV.y - OV.ry - 200, OV.x - 2, -10); g.stroke();
      g.font = '84px Pinyon';
      g.fillText('Well maybe I', LY.x1, LY.y1);
      g.fillText('him,', LY.likeX + g.measureText('like ').width, LY.y1);
      g.fillText('or maybe I', LY.x2, LY.y2);
      g.fillText('him…', LY.hateX + g.measureText('hate ').width, LY.y2);
      // flourish under the lyric
      const fl = WC.sampleSpline([[LY.x2 + 60, LY.y2 + 34], [LY.x2 + 300, LY.y2 + 46], [LY.x2 + 560, LY.y2 + 24], [LY.x2 + 690, LY.y2 + 30], [LY.x2 + 720, LY.y2 + 18]], false, 1, 14);
      for (let i = 1; i < fl.length; i++) {
        const t = i / fl.length;
        g.lineWidth = 0.6 + 2.6 * Math.sin(Math.PI * t) * (1 - 0.5 * t);
        g.beginPath(); g.moveTo(fl[i - 1][0], fl[i - 1][1]); g.lineTo(fl[i][0], fl[i][1]); g.stroke();
      }
      eng.ink(eng._layerCanvas, { mode: 'ink', color: P.ink, strength: 1.7, bleed: 0.9, seed: 3 });

      // pencil: construction lines of a quick underdrawing
      g = eng.layer();
      g.strokeStyle = '#000'; g.lineCap = 'round';
      const jitter = WC.rng(99);
      for (let k = 0; k < 2; k++) {
        g.lineWidth = 1.1;
        g.beginPath(); g.ellipse(OV.x + jitter.range(-6, 6), OV.y + jitter.range(-6, 6), OV.rx + 8 + k * 5, OV.ry + 10 - k * 4, jitter.range(-0.02, 0.02), 0, Math.PI * 2); g.stroke();
      }
      inLizzy(g, () => {
        g.lineWidth = 1.0 / 1;
        const pts = WC.sampleSpline(WC.figures.lizzyBody.slice(0, 24), false, LZ.s, 8);
        g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + 7, y - 3) : g.moveTo(x + 7, y - 3))); g.stroke();
      });
      g.lineWidth = 1.0;
      // loose construction circles for her knot and the frame's crest
      g.beginPath(); g.arc(LZ.x - 0.262 * LZ.s + 4, LZ.y - 0.05 * LZ.s - 3, 0.19 * LZ.s, 0, 7); g.stroke();
      eng.ink(eng._layerCanvas, { mode: 'pencil', color: '#6b6b72', strength: 0.55, seed: 7 });

      eng.end({ vignette: 0.08, grain: 0.012, seed: 1 });
    },
  };

  // lyric layout
  const LY = { x1: 700, y1: 930, x2: 900, y2: 1012 };
  (function measure() {
    const c = document.createElement('canvas').getContext('2d');
    c.font = '84px Pinyon';
    LY.likeX = LY.x1 + c.measureText('Well maybe I ').width;
    LY.hateX = LY.x2 + c.measureText('or maybe I ').width;
    LY.remeasure = measure;
  })();
  WC.scenes.portrait.LY = LY;

  // clip region for the shadow glaze on Elizabeth's neck/bust (H units)
  const F_shadeClip = [[-0.7, 0.72], [0.12, 0.98], [0.24, 1.3], [0.34, 1.62], [0.30, 2.5], [-0.7, 2.5]];
})(window.WC = window.WC || {});
