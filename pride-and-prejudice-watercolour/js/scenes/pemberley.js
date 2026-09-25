// Scene: Pemberley at golden hour (verse 2, line 3: "But he is tall and he is strong").
// We start low, at the water's edge, as Darcy is painted from his boots upward; the camera
// tilts up with the paint until, on "tall", he stands against the sunset sky. On "strong" a
// gust sweeps through: his coat and the tree move, leaves fly, the sun breaks through in rays
// and the lake glitters.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const SUN = [430, 300];
  const HOUSE = { x: 690, y: 578, w: 520 };
  const LAKE = 578;
  const TREE = { x: 1910, y: 960, h: 760 };
  const DC = { x: 1330, y: 1002, s: 100 };
  const RAYS = [-0.5, -0.3, -0.12, 0.05, 0.2, 0.36, 0.55, 0.75];

  WC.scenes.pemberley = {
    build(B) {
      K.commonMasks(B);
      B.mask('sky', K.rect(-80, -700, 2080, 1300), { maskScale: 0.2, margin: 60, flood: { seeds: [SUN] } });
      B.mask('sun', (g) => WC.fillCircle(g, SUN[0], SUN[1], 46), { maskScale: 0.8, margin: 50 });
      B.mask('glow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 300), { maskScale: 0.3, margin: 160 });
      B.mask('clouds', (g) => { [[[-60, 150], [300, 120], [700, 150], [1000, 130]], [[800, 40], [1200, 10], [1600, 40], [2000, 20]], [[1000, 250], [1300, 230], [1650, 255]], [[-60, -150], [500, -190], [1100, -160]]].forEach((pts, i) => WC.brushStroke(g, pts, [46, 60, 34, 70][i], 14, 1.4)); }, { maskScale: 0.4, margin: 60, flood: { seeds: [[-60, 150], [800, 40], [1000, 250], [-60, -150]] } });
      B.mask('rays', (g) => RAYS.forEach((a) => { const L = 2400, w = 0.035 + 0.02 * Math.abs(Math.sin(a * 9)); g.beginPath(); g.moveTo(SUN[0], SUN[1]); g.lineTo(SUN[0] + Math.cos(a - w) * L, SUN[1] + Math.sin(a - w) * L); g.lineTo(SUN[0] + Math.cos(a + w) * L, SUN[1] + Math.sin(a + w) * L); g.fill(); }), { maskScale: 0.25, margin: 40 });
      B.mask('hills', (g) => { g.beginPath(); WC.spline(g, [[-100, 540], [200, 505], [520, 530], [900, 500], [1300, 520], [2000, 490]], false, 1); g.lineTo(2020, LAKE + 4); g.lineTo(-100, LAKE + 4); g.fill(); }, { maskScale: 0.35, flood: { seeds: [[-60, 540]] } });
      B.mask('woods', (g) => { const r = WC.rng(4); for (let x = -80; x < 2000; x += 24) { const d = Math.abs(x - HOUSE.x); if (d < 300) continue; const k = Math.min(1, (d - 300) / 200); WC.fillCircle(g, x + r() * 10, LAKE - 6 - r() * 10 * k, (10 + r() * 14) * (0.5 + 0.5 * k)); } }, { maskScale: 0.4, margin: 30, flood: { seeds: [[-60, LAKE - 10], [1980, LAKE - 10]] } });
      B.mask('house', (g) => WC.props.pemberley(g, HOUSE.x, HOUSE.y, HOUSE.w), { margin: 20, flood: { seeds: [[HOUSE.x, HOUSE.y - 0.36 * HOUSE.w]] } });
      B.mask('houseWin', (g) => WC.props.pemberleyWindows(g, HOUSE.x, HOUSE.y, HOUSE.w), { margin: 10, maskScale: 1.2 });
      B.mask('reflect', (g) => { g.save(); g.translate(0, 2 * LAKE + 4); g.scale(1, -1); WC.props.pemberley(g, HOUSE.x, HOUSE.y, HOUSE.w); g.restore(); }, { margin: 24, maskScale: 0.5 });
      B.mask('lake', K.rect(-80, LAKE, 2080, 340), { maskScale: 0.25, margin: 40, flood: { seeds: [[SUN[0], LAKE + 10]] } });
      B.mask('sunPath', (g) => { g.beginPath(); g.moveTo(SUN[0] - 20, LAKE + 4); g.lineTo(SUN[0] + 20, LAKE + 4); g.lineTo(SUN[0] + 150, LAKE + 330); g.lineTo(SUN[0] - 150, LAKE + 330); g.fill(); }, { maskScale: 0.35, margin: 60 });
      B.mask('ripples', (g) => { const r = WC.rng(9); for (let i = 0; i < 160; i++) { const y = LAKE + 8 + Math.pow(r(), 1.4) * 320, w = 20 + (y - LAKE) * 0.5 * r(); g.fillRect(-80 + r() * 2100, y, w, 1.2 + (y - LAKE) / 160); } }, { maskScale: 0.8, margin: 12 });
      B.mask('bank', (g) => { g.beginPath(); WC.spline(g, [[-100, 930], [400, 905], [900, 930], [1250, 960], [1600, 930], [2000, 880]], false, 1); g.lineTo(2020, 1420); g.lineTo(-100, 1420); g.fill(); }, { maskScale: 0.3, margin: 40, flood: { seeds: [[DC.x, 1100]] } });
      B.mask('grass', (g) => { const r = WC.rng(6); g.lineCap = 'round'; for (let i = 0; i < 260; i++) { const x = -80 + r() * 2100, y = 925 + r() * 200, h = 16 + r() * 34; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - h * 0.6, x + 10 * (r() - 0.3), y - h); g.stroke(); } }, { maskScale: 0.6, margin: 20 });
      B.mask('trunk', (g) => { WC.props.oakTrunk(g, TREE.x, TREE.y, TREE.h); g.save(); g.globalCompositeOperation = 'destination-out'; g.translate(0, -TREE.h * 0.03); WC.props.oakCanopy(g, TREE.x, TREE.y, TREE.h, WC.rng(21)); g.restore(); }, { maskScale: 0.5, flood: { seeds: [[TREE.x, TREE.y]] } });
      B.mask('canopy', (g) => WC.props.oakCanopy(g, TREE.x, TREE.y, TREE.h, WC.rng(21)), { maskScale: 0.35, flood: { seeds: [[TREE.x, TREE.y - 0.55 * TREE.h]] } });
      C.darcy(B, 'dc', { x: DC.x, y: DC.y, s: DC.s, dir: -1, pose: P.darcy.poses.still(), seed: 'feet' });
    },

    render(eng, Mk, t) {
      const tallT = A.word(13, 'tall'), strongT = A.word(13, 'strong');
      // low at the water's edge, tilting up with the paint to find him against the sky
      const cy = A.keys(t, [[68.45, 900], [69.3, 895], [tallT + 0.3, 640], [strongT - 0.35, 630], [strongT + 0.8, 575], [74.4, 565]]);
      const z = A.keys(t, [[68.45, 1.45], [69.3, 1.42], [tallT + 0.3, 1.28], [strongT - 0.35, 1.3], [strongT + 0.8, 1.12], [74.4, 1.1]]);
      const cx = A.keys(t, [[68.45, 1180], [tallT + 0.3, 1150], [strongT - 0.35, 1140], [strongT + 0.8, 1060], [74.4, 1050]]);
      const cam = K.cam(z, cx, cy);
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const gust = A.env(t, strongT - 0.15, 75, 0.35, 1.0);
      const breeze = 0.5 + 0.5 * Math.sin(t * 1.3);

      // ---- sky and light: gold floods out from the sun
      W(Mk.sky, { pig: '#f7d492', pigB: '#e7a0a8', mix: { dir: [0.2, -1], at: -360, width: 380, noise: 0.9, noiseScale: 300, flow: 0.03 }, density: 0.75, edge: 0.4, edgeW: 16, soft: 4, warp: 30, warpScale: 260, rough: 5, flow: 0.45, flowScale: 220, gran: 0.2,
        flood: { at: K.pp(t, 68.5, 1.6), soft: 80, noise: 90, edge: 0.8, edgeW: 30 }, wet: K.wet(t, 68.5, 70.1), wetAmp: 12, seed: 1 });
      W(Mk.clouds, { pig: '#d99aae', pigB: '#a99ac4', mix: { dir: [0, -1], at: -150, width: 200, noise: 0.8 }, density: 0.6, edge: 1.1, edgeW: 6, soft: 3, warp: 20, warpScale: 90, rough: 6, roughScale: 20, flow: 0.7, flowScale: 70, gran: 0.4,
        flood: { at: K.pp(t, 69.0, 1.8), soft: 40, noise: 40 }, wet: K.wet(t, 69.0, 70.8), seed: 2 }, M.tr((t - 68) * 6, 0));
      W(Mk.sun, { pig: '#fbe2a0', pigB: '#f6c27a', mix: { dir: [0, 1], at: SUN[1], width: 40 }, density: 0.6 * K.pp(t, 68.6, 1.0), soft: 6, edge: 0.6, warp: 3, seed: 3 });
      W(Mk.hills, { pig: '#b8a3b8', pigB: '#9fa6bd', mix: { dir: [1, 0], at: 960, width: 700, noise: 0.8 }, density: 0.55, edge: 1.0, edgeW: 5, soft: 2, warp: 8, warpScale: 140, rough: 3, flow: 0.5, gran: 0.35,
        flood: { at: K.pp(t, 68.8, 1.4), soft: 40, noise: 60 }, wet: K.wet(t, 68.8, 70.2), seed: 4 });
      W(Mk.woods, { pig: '#a4a58a', pigB: '#9095ad', mix: { dir: [1, 0], at: 960, width: 600, noise: 0.9 }, density: 0.5, edge: 1.1, edgeW: 4, soft: 2, warp: 6, warpScale: 50, rough: 4, roughScale: 12, flow: 0.5, gran: 0.5,
        flood: { at: K.pp(t, 69.0, 1.4), soft: 30, noise: 40 }, wet: K.wet(t, 69.0, 70.4), seed: 5 });
      W(Mk.house, { pig: '#e8cfa6', pigB: '#cfa98a', mix: { dir: [1, 0], at: HOUSE.x, width: 200, noise: 0.5 }, density: 0.8, edge: 1.3, edgeW: 3, soft: 1, warp: 2, warpScale: 60, rough: 1, flow: 0.4, gran: 0.4,
        flood: { at: K.pp(t, 69.4, 1.2), soft: 20, noise: 24 }, seed: 6 });
      W(Mk.houseWin, { mode: 'lift', lift: 0.7 * K.pp(t, 70.2, 0.7), soft: 0.8, warp: 0.6, rough: 0.3, seed: 7 });

      // ---- the lake, holding the sky
      W(Mk.lake, { pig: '#f2c98e', pigB: '#9a9cc4', mix: { dir: [0, 1], at: LAKE + 170, width: 170, noise: 0.8, noiseScale: 200 }, density: 0.7, edge: 0.5, edgeW: 10, soft: 3, warp: 20, warpScale: 200, rough: 3, flow: 0.4, flowScale: 180, gran: 0.25,
        flood: { at: K.pp(t, 68.5, 1.4), soft: 60, noise: 60 }, wet: 0.6, wetAmp: 6, wetScale: 90, seed: 8 });
      W(Mk.reflect, { pig: '#c9a894', density: 0.45 * K.pp(t, 69.8, 1.0), soft: 3, edge: 0.4, warp: 10, warpScale: 26, rough: 2, flow: 0.4, seed: 9, reveal: { dir: [0, -1], at: -(LAKE + 150), soft: 60, noise: 20 } });
      const rip = K.pp(t, 68.9, 1.0);
      W(Mk.ripples, { mode: 'lift', lift: 0.45 * rip, soft: 1.2, warp: 3, warpScale: 30, rough: 0.6, seed: 10 }, M.tr(Math.sin(t * 0.8) * 12, 0));
      W(Mk.ripples, { pig: '#7c7aa6', density: 0.3 * rip, soft: 1.4, warp: 3, warpScale: 30, rough: 0.6, seed: 11 }, M.tr(40 + Math.sin(t * 0.7 + 1) * 14, 7));

      // ---- the near bank, the tree moving in the wind
      W(Mk.bank, { pig: '#9aa47a', pigB: '#6f7c6a', mix: { dir: [0, 1], at: 1010, width: 120, noise: 0.9 }, density: 0.75, edge: 0.9, edgeW: 8, soft: 2, warp: 12, warpScale: 160, rough: 4, flow: 0.5, flowScale: 120, gran: 0.4,
        flood: { at: K.pp(t, 68.5, 1.2), soft: 40, noise: 50 }, wet: K.wet(t, 68.5, 69.7), seed: 12 });
      const gx = 0.012 * breeze + 0.05 * gust;
      W(Mk.grass, { pig: '#6f7f5e', density: 0.6 * K.pp(t, 69.0, 1.0), soft: 1.2, edge: 0.8, edgeW: 3, warp: 2, rough: 1, gran: 0.4,
        sway: { amp: 4 + 10 * gust, y0: 900, y1: 1100, k: 1, omega: 3, wave: 90, phase: 0 }, seed: 13 }, [1, 0, -gx, 1, gx * 1080, 0]);
      const bend = 0.02 * breeze + 0.07 * gust + 0.01 * Math.sin(t * 7) * gust;
      const treeXf = [1, 0, -bend, 1, bend * TREE.y, 0];
      W(Mk.trunk, { pig: '#6b5a58', pigB: '#4f4a5e', mix: { dir: [1, 0], at: TREE.x, width: 40 }, density: 0.9, edge: 1.2, edgeW: 3, soft: 1, warp: 2, rough: 1.2, gran: 0.5, flood: { at: K.pp(t, 68.6, 1.2), soft: 20, noise: 20 }, seed: 14 }, treeXf);
      W(Mk.canopy, { pig: '#8fa46a', pigB: '#3f5a5a', mix: { dir: [1, 0.3], at: TREE.x - 60, width: 220, noise: 1, flow: 0.1 }, density: 0.9, edge: 1.1, edgeW: 5, soft: 2, warp: 10, warpScale: 60, rough: 4, roughScale: 10, flow: 0.6, flowScale: 50, gran: 0.5,
        flood: { at: K.pp(t, 68.8, 1.4), soft: 30, noise: 40 }, wet: 0.35 + 0.65 * gust, wetAmp: 10, wetScale: 50, seed: 15 }, treeXf);

      // ---- Darcy, painted from the boots up
      W(Mk.dot, { pig: '#5a5a66', density: 0.4 * K.pp(t, 69.0, 0.8), soft: 16, warp: 5, seed: 16 }, M.mul(M.tr(DC.x + 40, DC.y + 2), M.sc(2.4, 0.22)));
      C.paint(eng, Mk, 'dc', { cam, t, p: K.pp(t, 68.9, 2.7, (x) => x), wet: K.wet(t, 68.9, 71.6), sway: 3 + 14 * gust, omega: 2.6, wind: -0.5 * gust, seed: 3 });

      // leaves carried on the gust
      if (gust > 0) {
        const list = K.petalFlight(t, strongT - 0.1, [1900, 360], [300, 520], 16, false, 77, { arc: -120, stagger: 0.07, dur: 2.2, life: 3.2, size: 34 });
        K.paintPetals(eng, cam, Mk.petal, list, { indigo: '#9aa86a' });
      }

      // ---- light
      Lt(Mk.houseWin, { colour: '#ffd27a', density: 0.55 * K.pp(t, 70.4, 0.8) * (0.85 + 0.15 * Math.sin(t * 3)), soft: 3, warp: 1, seed: 23 });
      Lt(Mk.canopy, { colour: '#ffcf7a', density: 0.22 * K.pp(t, 69.6, 1.0) * (1 + 0.6 * gust), soft: 30, warp: 10, reveal: { dir: [1, 0], at: TREE.x - 260, soft: 140, noise: 60 }, seed: 24 }, treeXf);
      Lt(Mk.glow, { colour: '#ffcf8a', density: 0.38 * K.pp(t, 68.6, 1.6) * (1 + 0.5 * gust), soft: 160, warp: 30, seed: 20 });
      Lt(Mk.sunPath, { colour: '#ffd9a0', density: (0.12 + 0.2 * gust) * K.pp(t, 69.0, 1.2), soft: 40, warp: 10, streak: { angle: 0, amt: 0.9, len: 40 }, seed: 21 }, M.tr(Math.sin(t * 0.6) * 8, 0));
      if (gust > 0) Lt(Mk.rays, { colour: '#ffe3a8', density: 0.22 * gust, soft: 40, warp: 20, streak: { angle: 0.2, amt: 0.6, len: 300 }, seed: 22 }, M.about(SUN[0], SUN[1], 0.04 * Math.sin(t * 0.5)));
      // rim light down his sunward edge
      K.motes(eng, cam, Mk.dot, t, { x: 1000, y: 700, w: 1600, h: 500, n: 16, r: 6, vx: -20 - 90 * gust, vy: -8, colour: '#ffe2a0', intensity: 0.45, alpha: K.pp(t, 69.5, 1.0), seed: 11 });
      // the lake glitters, most of all on "strong"
      for (let i = 0; i < 26; i++) {
        const h = (k) => A.hash(i * 7 + k + 300), per = 1.1 + h(1) * 1.4, ph = ((t + h(2) * per) % per);
        const x = SUN[0] + (h(3) - 0.5) * 300 * (0.4 + h(4)), y = LAKE + 10 + h(4) * 300;
        K.glint(eng, cam, Mk.star, x + (y - LAKE) * (h(5) - 0.5) * 0.8, y, t, t - ph, 0.5, (8 + 14 * h(6)) * (0.6 + 0.9 * gust), '#fff1c8');
      }

      // ---- ink: the pencil horizon
      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0';
      C.pen(g, [[-40, LAKE + 2], [900, LAKE - 1], [1960, LAKE + 1]], K.pp(t, 68.5, 1.0, A.inOut), 1.1, 4);
      eng.ink({ strength: [1.7, 0.5, 1.2], seed: 8 });
    },
  };
})(window.WC = window.WC || {});
