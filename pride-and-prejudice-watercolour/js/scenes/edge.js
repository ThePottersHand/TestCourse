// Scene: The Edge (chorus 1). "What are young men to rocks and mountains?" (chapter 27) -
// Elizabeth on a gritstone edge above a wide valley, the wind in her skirts and bonnet ribbons.
// The weather follows her heart: on "like" the sun breaks through and light sweeps the valley;
// on "hate" an indigo storm rolls in trailing curtains of rain; on the second "like" it passes
// and a rainbow paints itself across the sky; on "the art of making up my mind" the sky melts
// into violet and gold and the wind drops.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const SUN = [1640, 170];
  const LZ = { x: 640, y: 706, s: 52 };
  const RB = { x: 1330, y: 1010, r: 560 };       // rainbow centre and inner radius
  const RB_COL = ['#a77fb8', '#7f94cf', '#7dbba2', '#e6cf72', '#eea865', '#e57c86'];
  const RP = 320;                                  // rain pattern period
  const CLOUDS = [[300, 150, 360, 110], [900, 90, 420, 130], [1500, 200, 320, 100], [2100, 120, 440, 130], [2700, 180, 340, 104]];
  const STORM = [[1250, 330, 980, 320], [1950, 300, 900, 300], [1600, 200, 760, 260], [2400, 260, 700, 240]];
  // the gritstone outcrop: a flat-topped prow jutting into the air, weathered round below
  const ROCK = [[-340, 736], [-150, 716], [60, 722], [260, 708], [430, 714], [560, 706], [700, 708], [790, 716], [812, 734], [760, 760],
    [700, 774], [690, 820], [724, 868], [708, 930], [760, 990], [800, 1060], [880, 1140], [960, 1300], [-340, 1300]];
  const BOULDERS = [[620, 830, 110, 70], [500, 900, 140, 90], [680, 960, 120, 80], [300, 980, 180, 100], [740, 1060, 130, 90]];
  const CRACKS = [[[710, 720], [696, 760], [700, 790]], [[540, 712], [548, 770], [536, 830], [552, 880]], [[330, 716], [320, 790], [340, 860]], [[120, 724], [110, 800]], [[600, 790], [660, 800], [690, 812]], [[380, 880], [470, 870], [560, 886]], [[640, 930], [700, 940]]];

  WC.scenes.edge = {
    build(B) {
      K.commonMasks(B);
      B.mask('sky', K.rect(-300, -300, 3100, 1000), { maskScale: 0.2, margin: 60, flood: { seeds: [SUN] } });
      CLOUDS.forEach(([x, y, w, h], i) => B.mask('cloud' + i, (g) => K.cloud(g, x, y, w, h, WC.rng(20 + i)), { maskScale: 0.35, margin: 40, flood: { seeds: [[x, y - h * 0.3]] } }));
      B.mask('storm', (g) => STORM.forEach(([x, y, w, h], i) => K.cloud(g, x, y, w, h, WC.rng(50 + i))), { maskScale: 0.25, margin: 60, flood: { seeds: [[2600, 200]] } });
      B.mask('rain', (g) => {
        const r = WC.rng(9); g.lineCap = 'round';
        for (let i = 0; i < 260; i++) {
          const x = 800 + r() * 1900, y = r() * RP, l = 40 + r() * 70; g.lineWidth = 1.4 + r() * 1.6;
          for (let k = -2; k <= 3; k++) { const yy = y + k * RP, xx = x - 0.3 * k * RP; if (yy < -100 || yy > 820) continue; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx - 0.3 * l, yy + l); g.stroke(); }
        }
      }, { maskScale: 0.5, margin: 20 });
      B.mask('rays', (g) => { for (let i = 0; i < 9; i++) { const a = 1.9 + i * 0.13 + (i % 2) * 0.03, w = 0.022 + 0.018 * (i % 3) / 2, L = 2200; g.beginPath(); g.moveTo(SUN[0], SUN[1]); g.lineTo(SUN[0] + Math.cos(a - w) * L, SUN[1] + Math.sin(a - w) * L); g.lineTo(SUN[0] + Math.cos(a + w) * L, SUN[1] + Math.sin(a + w) * L); g.fill(); } }, { maskScale: 0.25, margin: 40 });
      B.mask('glow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 340), { maskScale: 0.25, margin: 160 });
      const band = (pts, y1) => (g) => { g.beginPath(); WC.spline(g, pts, false, 1); g.lineTo(2800, y1); g.lineTo(-300, y1); g.fill(); };
      B.mask('hillsFar', band([[-300, 560], [300, 520], [800, 548], [1300, 506], [1800, 540], [2300, 500], [2800, 530]], 900), { maskScale: 0.25, flood: { seeds: [[2700, 520]] } });
      B.mask('hillsMid', band([[-300, 640], [400, 600], [900, 632], [1400, 590], [1900, 628], [2400, 596], [2800, 620]], 1000), { maskScale: 0.25, flood: { seeds: [[2700, 610]] } });
      B.mask('valley', band([[-300, 700], [500, 668], [1100, 690], [1700, 660], [2300, 684], [2800, 668]], 1300), { maskScale: 0.2, flood: { seeds: [[2700, 700]] } });
      B.mask('hedgesV', (g) => { const r = WC.rng(31); [[1000, 700], [1180, 760], [1420, 690], [1560, 790], [1790, 716], [2000, 770], [2230, 700], [2480, 740], [1320, 860], [2150, 860], [900, 800]].forEach(([x, y]) => { const n = 4 + Math.floor(r() * 6); for (let k = 0; k < n; k++) WC.fillCircle(g, x + (r() - 0.5) * 60, y - r() * 16, 8 + r() * 10); }); K.hedge(g, [[860, 736], [1400, 744], [2000, 726], [2800, 740]], 6, r, 0); }, { maskScale: 0.6, margin: 20, flood: { seeds: [[2780, 740], [1000, 700]] } });
      B.mask('river', (g) => { g.lineCap = 'round'; const q = WC.sampleSpline([[2800, 690], [2450, 700], [2200, 690], [1950, 712], [1700, 700], [1450, 726], [1250, 716], [1080, 744], [960, 780]], false, 1, 20); for (let i = 1; i < q.length; i++) { g.lineWidth = 4 + 14 * (i / q.length); g.beginPath(); g.moveTo(q[i - 1][0], q[i - 1][1]); g.lineTo(q[i][0], q[i][1]); g.stroke(); } }, { maskScale: 0.5, margin: 20, flood: { seeds: [[2780, 700]] } });
      B.mask('village', (g) => { const r = WC.rng(4); for (let i = 0; i < 9; i++) g.fillRect(1560 + i * 16 + r() * 6, 700 - r() * 8, 11, 8 + r() * 5); g.fillRect(1640, 672, 6, 26); g.beginPath(); g.moveTo(1636, 674); g.lineTo(1643, 650); g.lineTo(1650, 674); g.fill(); }, { maskScale: 1, margin: 10 });
      B.mask('shade', K.rect(-300, 460, 3100, 900), { maskScale: 0.2, margin: 40, flood: { seeds: [[2800, 600]] } });
      B.mask('mist', (g) => [[1300, 720, 700, 30], [2000, 700, 600, 24], [900, 790, 500, 26], [1700, 800, 700, 30]].forEach(([x, y, rx, ry]) => WC.fillEllipse(g, x, y, rx, ry, 0)), { maskScale: 0.3, margin: 60 });
      RB_COL.forEach((c, i) => B.mask('rb' + i, (g) => { g.lineWidth = 15; g.beginPath(); g.arc(RB.x, RB.y, RB.r + i * 13, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); }, { maskScale: 0.35, margin: 30, flood: { seeds: [[RB.x - RB.r - i * 13, RB.y - 30]] } }));
      B.mask('rainbowGlow', (g) => { g.lineWidth = 110; g.beginPath(); g.arc(RB.x, RB.y, RB.r + 36, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); }, { maskScale: 0.2, margin: 80 });
      B.mask('rock', (g) => { WC.fillSpline(g, ROCK, true, 1); BOULDERS.forEach(([x, y, rx, ry]) => WC.fillEllipse(g, x, y, rx, ry, 0.1)); }, { maskScale: 0.4, margin: 30, flood: { seeds: [[LZ.x, LZ.y + 10]] } });
      B.mask('joints', (g) => { g.strokeStyle = '#fff'; CRACKS.forEach((pts, i) => { const q = WC.sampleSpline(pts, false, 1, 10); g.lineCap = 'round'; for (let k = 1; k < q.length; k++) { g.lineWidth = (2 + (i % 3)) * (1 - 0.6 * k / q.length); g.beginPath(); g.moveTo(q[k - 1][0], q[k - 1][1]); g.lineTo(q[k][0], q[k][1]); g.stroke(); } });
        BOULDERS.forEach(([x, y, rx, ry]) => { g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, rx, ry, 0.1, 0.15, 1.9); g.stroke(); }); }, { maskScale: 0.6, margin: 16 });
      B.mask('tops', (g) => { g.beginPath(); WC.spline(g, ROCK.slice(0, 9).map(([x, y]) => [x, y + 2]), false, 1); WC.spline(g, ROCK.slice(0, 9).reverse().map(([x, y]) => [x, y + 16]), false, 1, 0, 0, 1, false); g.fill(); BOULDERS.forEach(([x, y, rx, ry]) => WC.fillEllipse(g, x - rx * 0.2, y - ry * 0.55, rx * 0.5, ry * 0.18, 0.1)); }, { maskScale: 0.6, margin: 16 });
      B.mask('heather', (g) => { const r = WC.rng(14); for (let i = 0; i < 260; i++) { const x = -300 + r() * 1080, y = 690 + (1 - Math.pow(r(), 0.5)) * 30 + (x > 500 ? (x - 500) * 0.03 : 0); if (Math.abs(x - LZ.x) < 50 && r() < 0.8) continue; WC.fillCircle(g, x, y - r() * 14, 3 + r() * 5); } }, { maskScale: 0.8, margin: 12 });
      B.mask('tufts', (g) => K.grass(g, -300, 780, 700, 300, 18, 46, WC.rng(15), 0.5, (x) => Math.abs(x - LZ.x) < 40), { maskScale: 0.7, margin: 16 });
      C.lizzy(B, 'lz', { x: LZ.x, y: LZ.y, s: LZ.s, dir: 1, pose: P.lizzy.poses.stand(0), bonnet: true, streamers: 1.6 });
    },

    render(eng, Mk, t) {
      const l1 = A.word(6, 'like'), h1 = A.word(7, 'hate'), l2 = A.word(8, 'like'), gs = A.word(9, 'guess'), artT = A.word(10, 'art');
      const z = A.keys(t, [[35.6, 1.6], [36.3, 1.55], [39.6, 1.08], [55.8, 1.0]]);
      const cx = A.keys(t, [[35.6, 690], [36.3, 700], [39.6, 900], [55.8, 1060]]), cy = A.keys(t, [[35.6, 500], [36.3, 505], [39.6, 530], [55.8, 540]]);
      const cam = K.cam(z, cx, cy);
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);

      // the weather: storm rolls in on "hate", passes on "like"; sun on "like"; dusk on "art"
      const stormX = A.keys(t, [[h1 - 1.4, 1500], [h1 + 0.9, 0], [l2 - 0.4, -120], [l2 + 3.0, -1900]]);
      const storm = A.keys(t, [[h1 - 1.2, 0], [h1 + 0.6, 1], [l2 - 0.2, 1], [l2 + 1.8, 0]]);
      const sun = Math.max(A.env(t, l1 - 0.4, h1, 0.8, 0.8), A.env(t, l2, 60, 1.0, 1)) * (1 - storm);
      const bow = K.pp(t, l2 + 0.2, 2.2, A.inOut), bowFade = 1 - A.ramp(t, artT - 1, artT + 1.5);
      const dusk = A.ease(t, artT - 1.4, artT + 1.8);
      const gust = 0.45 + 0.4 * storm + 0.25 * Math.sin(t * 1.3) * Math.sin(t * 0.7) - 0.35 * dusk;
      const drift = -18 * (t - 35);

      // ---- sky
      W(Mk.sky, { pig: '#b4c3dc', pigB: '#f3e2c4', mix: { dir: [0, 1], at: 420, width: 280, noise: 0.8, noiseScale: 300 }, density: 0.62, edge: 0.4, edgeW: 16, soft: 4, warp: 30, warpScale: 260, rough: 4, flow: 0.45, flowScale: 220, gran: 0.15,
        flood: { at: pp(35.7, 1.3), soft: 80, noise: 90, edge: 0.7, edgeW: 30 }, wet: K.wet(t, 35.7, 37.0), wetAmp: 12, seed: 1 });
      if (sun > 0.01) W(Mk.sky, { pig: '#f6c9a0', pigB: '#f2a7b6', mix: { dir: [-1, 0.6], at: -900, width: 500, noise: 1, flow: 0.04 }, density: 0.5 * sun, soft: 6, warp: 40, warpScale: 260, flow: 0.5, seed: 2,
        radial: { x: SUN[0], y: SUN[1], r: 200 + 1500 * sun, soft: 300 } });
      if (dusk > 0) W(Mk.sky, { pig: '#b99ad0', pigB: '#f4c890', mix: { dir: [0, 1], at: 380, width: 240, noise: 1.4, noiseScale: 200, flow: 0.08, vein: 0.2 }, density: 0.6, soft: 6, warp: 40, warpScale: 260, flow: 0.5,
        flood: { at: dusk, soft: 90, noise: 110, edge: 0.8, edgeW: 30 }, wet: 1, wetAmp: 16, seed: 3 });
      CLOUDS.forEach(([x, y, w, h], i) => {
        const cxf = M.tr(drift * (0.7 + 0.12 * i), 0), cp = pp(36.0 + i * 0.12, 1.2);
        W(Mk['cloud' + i], { mode: 'lift', lift: 0.75 * cp * (1 - 0.6 * storm), soft: 6, warp: 16, warpScale: 60, rough: 5, roughScale: 16, wet: 0.5, wetAmp: 5, wetScale: 50, seed: 10 + i }, cxf);
        W(Mk['cloud' + i], { pig: dusk > 0.5 ? '#c79ab8' : '#c3bdd6', pigB: '#fbf6ee', mix: { dir: [0, -1], at: -(y - h * 0.15), width: h * 0.35, noise: 0.7 }, density: 0.5, soft: 6, edge: 0.3, warp: 16, warpScale: 60, rough: 5, roughScale: 16,
          flood: { at: cp, soft: 30, noise: 30 }, wet: 0.5, wetAmp: 5, wetScale: 50, seed: 10 + i }, cxf);
      });
      // the storm: a churning indigo mass trailing rain
      if (storm > 0.01 || (t > h1 - 1.4 && t < l2 + 3)) {
        const sx = M.tr(stormX, 0);
        W(Mk.storm, { pig: '#4c5380', pigB: '#8f8cae', mix: { dir: [0, -1], at: -300, width: 140, noise: 1.3, noiseScale: 160, flow: 0.1, vein: 0.2 }, density: 0.85, soft: 14, edge: 0.6, edgeW: 12, warp: 30, warpScale: 120, rough: 8, roughScale: 30, flow: 0.7, flowScale: 90, gran: 0.3,
          flood: { at: K.pp(t, h1 - 1.4, 1.8), soft: 60, noise: 80, edge: 1.0, edgeW: 24 }, wet: 1, wetAmp: 14, wetScale: 90, seed: 20 }, sx);
        // two sheets half a cycle apart, each fading out as it wraps, so the fall never jumps
        [0, 0.5].forEach((off, k) => {
          const u = (t * 1.6 + off) % 1, fall = u * RP;
          W(Mk.rain, { pig: '#5d6490', density: 0.34 * storm * Math.sin(Math.PI * u), soft: 2.5, warp: 3, warpScale: 40, rough: 1, seed: 21 + k, reveal: { dir: [0, 1], at: 600 - fall, soft: 120, noise: 40 } }, M.mul(sx, M.tr(-0.3 * fall, fall)));
        });
      }

      // ---- the valley
      W(Mk.hillsFar, { pig: '#a3a9c8', pigB: '#b8b0cc', mix: { dir: [1, 0], at: 1200, width: 900, noise: 0.8 }, density: 0.6, edge: 1.0, edgeW: 5, soft: 2, warp: 10, warpScale: 160, rough: 3, flow: 0.4, gran: 0.3,
        flood: { at: pp(35.9, 1.4), soft: 40, noise: 60 }, wet: K.wet(t, 35.9, 37.3), seed: 30 });
      // a rainbow paints itself across the sky once the storm has passed
      if (bow > 0 && bowFade > 0) RB_COL.forEach((c, i) => W(Mk['rb' + i], { pig: c, density: 0.32 * bowFade, soft: 5, edge: 0.2, warp: 6, warpScale: 80, rough: 1, seed: 40 + i, flood: { at: bow, soft: 40, noise: 30 }, wet: 0.5, wetAmp: 4 }));
      W(Mk.hillsMid, { pig: '#8ea3a8', pigB: '#a59fbc', mix: { dir: [1, 0], at: 1300, width: 800, noise: 0.9 }, density: 0.62, edge: 1.0, edgeW: 5, soft: 2, warp: 12, warpScale: 160, rough: 3, flow: 0.45, gran: 0.35,
        flood: { at: pp(36.1, 1.4), soft: 40, noise: 60 }, wet: K.wet(t, 36.1, 37.5), seed: 31 });
      W(Mk.valley, { pig: '#b8c07e', pigB: '#8fa56e', mix: { dir: [1, 0.3], at: 1500, width: 150, noise: 2.0, noiseScale: 170 }, density: 0.6, edge: 0.8, edgeW: 6, soft: 2, warp: 14, warpScale: 180, rough: 4, flow: 0.5, flowScale: 140, gran: 0.35,
        flood: { at: pp(36.3, 1.5), soft: 50, noise: 60 }, wet: K.wet(t, 36.3, 37.8), seed: 32 });
      W(Mk.hedgesV, { pig: '#6f8762', pigB: '#5a6d60', mix: { dir: [0, 1], at: 740, width: 60, noise: 0.8 }, density: 0.5, edge: 1, edgeW: 3, soft: 1.3, warp: 3, warpScale: 30, rough: 2, gran: 0.5, flood: { at: pp(36.8, 1.5), soft: 30, noise: 30 }, seed: 33 });
      W(Mk.river, { mode: 'lift', lift: 0.45 * pp(36.8, 1.2), soft: 3, warp: 6, warpScale: 60, rough: 2, flood: { at: pp(36.8, 1.2), soft: 30, noise: 20 }, seed: 34 });
      W(Mk.river, { pig: '#8499bb', density: 0.4 * pp(37.2, 1.0), soft: 3, edge: 1, edgeW: 3, warp: 6, warpScale: 60, rough: 2, seed: 34 });
      W(Mk.village, { pig: '#8a7f8e', density: 0.7 * pp(37.4, 0.8), edge: 1.2, edgeW: 2, soft: 0.8, warp: 0.8, rough: 0.4, seed: 35 });
      // the storm's shadow floods the valley from the right, and lifts again
      if (storm > 0.01) W(Mk.shade, { pig: '#5c6390', pigB: '#7b7aa0', mix: { dir: [1, 0], at: 1500, width: 600, noise: 1 }, density: 0.5, soft: 40, edge: 0.5, edgeW: 20, warp: 40, warpScale: 200, flow: 0.5, seed: 36,
        flood: { at: A.ease(t, h1 - 0.8, h1 + 1.3), soft: 90, noise: 110, edge: 0.8, edgeW: 30 }, alpha: storm });
      if (dusk > 0) {
        W(Mk.mist, { mode: 'lift', lift: 0.45 * dusk, soft: 26, warp: 30, warpScale: 90, seed: 37 }, M.tr(20 * Math.sin(t * 0.3), 0));
        W(Mk.mist, { pig: '#c7aed6', density: 0.35 * dusk, soft: 26, warp: 30, warpScale: 90, seed: 37 }, M.tr(20 * Math.sin(t * 0.3), 0));
      }

      // ---- the edge: gritstone, heather, grass in the wind
      W(Mk.rock, { pig: '#a89682', pigB: '#665d6e', mix: { dir: [0.3, 1], at: 880, width: 150, noise: 1.6, noiseScale: 110 }, density: 0.8, edge: 1.2, edgeW: 7, soft: 1.5, warp: 8, warpScale: 70, rough: 6, roughScale: 14, flow: 0.7, flowScale: 60, gran: 0.9, dry: 0.5,
        flood: { at: pp(35.7, 1.2), soft: 40, noise: 50, edge: 1.2 }, wet: K.wet(t, 35.7, 36.9), seed: 50 });
      W(Mk.joints, { pig: '#463f4d', density: 0.55 * pp(36.3, 1.0), soft: 2.5, warp: 3, warpScale: 30, rough: 2, gran: 0.4, seed: 51 });
      W(Mk.tops, { mode: 'lift', lift: 0.35 * pp(36.6, 1.0), soft: 5, warp: 5, warpScale: 30, rough: 2, seed: 52 });
      W(Mk.heather, { pig: '#a0659a', pigB: '#6f5f8a', mix: { dir: [1, 0], at: 300, width: 200, noise: 2 }, density: 0.8 * pp(36.5, 1.0), edge: 1.2, edgeW: 2, soft: 1.2, warp: 2, rough: 1, gran: 0.5, seed: 53 });
      W(Mk.tufts, { pig: '#7d8a55', density: 0.7 * pp(36.6, 0.8), edge: 0.9, edgeW: 2, soft: 1, warp: 1, rough: 0.5, gran: 0.4,
        sway: { amp: 5 + 10 * gust, y0: -712, y1: -656, k: 1.3, omega: 2.6, wave: 1e6, phase: 0, axis: [0, -1], lean: -(0.5 + 0.6 * gust), waveX: 200 }, seed: 54 });

      // ---- ink: the pencil horizon, and swallows swooping round her on "I guess" (inked before she
      // is painted, so they pass behind her)
      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0';
      C.pen(g, [[-300, 548], [800, 530], [1800, 526], [2800, 520]], K.pp(t, 35.7, 1.0, A.inOut), 1.1, 4);
      g.strokeStyle = '#f00';
      const birds = [];
      for (let i = 0; i < 6; i++) {
        const u = t - gs + 0.3 - i * 0.18; if (u < 0 || u > 4.5) continue;
        const a = u * 1.8 + i;
        birds.push([LZ.x + 200 + u * 260 + Math.cos(a) * 90, 470 + Math.sin(a * 1.3) * 60 - u * 20, 11, i * 2]);
      }
      for (let i = 0; i < 4; i++) { const u = t - 36 - i * 0.5; birds.push([2400 - u * 70 + i * 60, 260 + i * 24 + Math.sin(u + i) * 12, 7, i]); }
      K.birds(g, birds, t);
      eng.ink({ strength: [1.6, 0.5, 1.2], seed: 12 });

      // ---- Elizabeth, facing the valley, the wind in her skirts and ribbons
      C.paint(eng, Mk, 'lz', { cam, t, p: pp(35.65, 1.2), wet: K.wet(t, 35.65, 36.9), sway: 5 + 9 * gust, omega: 2.2 + 1.2 * gust, wind: -(0.4 + 0.9 * gust), seed: 2 });

      // ---- light: sunlight sweeping the valley on "like", rays, the rainbow's glow, dusk
      Lt(Mk.glow, { colour: '#ffdca8', density: (0.14 + 0.2 * sun + 0.06 * dusk) * pp(35.8, 1.2), soft: 160, warp: 30, seed: 60 });
      if (sun > 0.01) Lt(Mk.rays, { colour: '#ffe6b8', density: 0.2 * sun, soft: 40, warp: 20, streak: { angle: 2.3, amt: 0.6, len: 300 }, seed: 61 }, M.about(SUN[0], SUN[1], 0.03 * Math.sin(t * 0.5)));
      [l1, l2].forEach((w, k) => {
        const u = A.ramp(t, w - 0.2, w + 3.2); if (u <= 0 || u >= 1) return;
        Lt(Mk.shade, { colour: '#ffe0b0', density: 0.22 * Math.sin(Math.PI * u), soft: 120, warp: 60, streak: { angle: 1.4, amt: 0.4, len: 300 }, seed: 62 + k,
          radial: { x: A.lerp(2600, -200, u), y: 720, r: 380, soft: 220 } });
      });
      if (bow > 0) Lt(Mk.rainbowGlow, { colour: '#fff4dc', density: 0.14 * bow * bowFade, soft: 60, warp: 20, seed: 63 });
    },
  };
})(window.WC = window.WC || {});
