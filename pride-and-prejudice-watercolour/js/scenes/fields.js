// Scene: Across the fields (verse 1, lines 1-2: "I swear that boy is just the worst...").
// Chapter 7: Elizabeth walks the three miles to Netherfield alone, "crossing field after field
// at a quick pace, jumping over stiles and springing over puddles". She strides into the wind,
// muttering about him. Clouds race and drag their shadows across the fields, gusts run through
// the grass in waves, crows tumble past, and on the second "worst" she goes straight through a
// puddle: the mud climbs her hem, "six inches deep".
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const PATH = [[-200, 1075], [200, 1012], [600, 978], [1000, 956], [1400, 932], [1800, 908], [2300, 884], [2900, 872]];
  const PQ = WC.sampleSpline(PATH, false, 1, 30);
  const pathY = (x) => { for (let i = 1; i < PQ.length; i++) if (PQ[i][0] >= x) { const [x0, y0] = PQ[i - 1], [x1, y1] = PQ[i]; return y0 + (y1 - y0) * (x - x0) / Math.max(1, x1 - x0); } return PQ[PQ.length - 1][1]; };
  const S = 44, LZ0 = [600, pathY(600)];
  const walkX = (t) => 430 + Math.max(0, t - 3.3) * 106;
  const PUDDLE = [1192, pathY(1192) + 5];
  const tPuddle = 3.3 + (PUDDLE[0] - 430) / 106;
  const CLOUDS = [[260, 200, 300, 100], [820, 120, 380, 120], [1400, 230, 300, 96], [1980, 150, 400, 128], [2560, 220, 280, 92], [3100, 170, 360, 110]];
  const FAR = [[120, 430, 200, 50], [640, 400, 240, 60], [1180, 452, 180, 44], [1700, 410, 260, 62], [2250, 446, 200, 50], [2800, 420, 240, 56]];
  const SUN = [2240, 110];
  const HOUSE = { x: 2330, y: 604, w: 170 };
  const STILE = [1668, pathY(1668)];
  const GRASS = [[880, 34, 70], [950, 40, 80], [1035, 50, 96], [1125, 60, 110]];   // root line, min, max blade height

  WC.scenes.fields = {
    build(B) {
      K.commonMasks(B);
      const r = WC.rng(17);
      B.mask('sky', K.rect(-200, -200, 3300, 860), { maskScale: 0.2, margin: 60, flood: { seeds: [SUN] } });
      CLOUDS.forEach(([x, y, w, h], i) => B.mask('cloud' + i, (g) => K.cloud(g, x, y, w, h, WC.rng(40 + i)), { maskScale: 0.4, margin: 40, flood: { seeds: [[x, y - h * 0.3]] } }));
      B.mask('farClouds', (g) => FAR.forEach(([x, y, w, h], i) => K.cloud(g, x, y, w, h, WC.rng(80 + i))), { maskScale: 0.3, margin: 40, flood: { seeds: FAR.map(([x, y, , h]) => [x, y - h * 0.3]) } });
      B.mask('hillsFar', (g) => { g.beginPath(); WC.spline(g, [[-200, 600], [300, 572], [800, 590], [1400, 566], [2000, 590], [2600, 560], [3200, 585]], false, 1); g.lineTo(3200, 760); g.lineTo(-200, 760); g.fill(); }, { maskScale: 0.3, flood: { seeds: [[SUN[0], 580]] } });
      B.mask('house', (g) => WC.props.pemberley(g, HOUSE.x, HOUSE.y, HOUSE.w), { margin: 16, flood: { seeds: [[HOUSE.x, HOUSE.y - 40]] } });
      B.mask('houseTrees', (g) => { const q = WC.rng(3); [-150, -120, 118, 150, 190].forEach((dx) => { for (let k = 0; k < 5; k++) WC.fillCircle(g, HOUSE.x + dx + (q() - 0.5) * 24, HOUSE.y - 20 - q() * 34, 12 + q() * 10); }); }, { maskScale: 0.6, margin: 20 });
      B.mask('fieldsFar', (g) => { g.beginPath(); WC.spline(g, [[-200, 640], [400, 612], [1000, 630], [1600, 606], [2200, 628], [3200, 610]], false, 1); g.lineTo(3200, 1100); g.lineTo(-200, 1100); g.fill(); }, { maskScale: 0.25, flood: { seeds: [[-100, 640], [3100, 620]] } });
      B.mask('fieldsNear', (g) => { g.beginPath(); WC.spline(g, [[-200, 790], [300, 740], [800, 700], [1300, 742], [1800, 712], [2400, 752], [3200, 726]], false, 1); g.lineTo(3200, 1100); g.lineTo(-200, 1100); g.fill(); }, { maskScale: 0.25, flood: { seeds: [[-100, 790], [3100, 730]] } });
      B.mask('hedges', (g) => {
        K.hedge(g, [[-200, 648], [500, 622], [1200, 640], [1900, 616], [2600, 636], [3200, 620]], 9, r, 0.05);
        K.hedge(g, [[-200, 796], [300, 746], [800, 706], [1300, 748], [1800, 718], [2400, 758], [3200, 732]], 13, r, 0.08);
        K.hedge(g, [[330, 628], [420, 690], [470, 742]], 10, r, 0.25);
        K.hedge(g, [[1540, 612], [1600, 668], [1660, 716]], 10, r, 0.3);
        K.hedge(g, [[2440, 630], [2380, 690], [2350, 750]], 10, r, 0.25);
      }, { maskScale: 0.5, margin: 30, flood: { seeds: [[-190, 650], [-190, 772]] } });
      B.mask('shadows', (g) => [[200, 720, 380, 80], [1000, 830, 460, 100], [1800, 700, 380, 70], [2600, 840, 480, 110], [3400, 740, 380, 80]].forEach(([x, y, rx, ry]) => WC.fillEllipse(g, x, y, rx, ry, 0)), { maskScale: 0.2, margin: 90 });
      B.mask('meadow', (g) => { g.beginPath(); WC.spline(g, [[-200, 880], [600, 840], [1300, 866], [2000, 836], [3200, 858]], false, 1); g.lineTo(3200, 1300); g.lineTo(-200, 1300); g.fill(); }, { maskScale: 0.2, margin: 50, flood: { seeds: [[LZ0[0], 1200]] } });
      B.mask('path', (g) => { g.strokeStyle = '#fff'; g.lineCap = 'round'; const q = WC.sampleSpline(PATH, false, 1, 30); for (let i = 1; i < q.length; i++) { const t = i / q.length; g.lineWidth = 64 - 40 * t; g.beginPath(); g.moveTo(q[i - 1][0], q[i - 1][1] + 8); g.lineTo(q[i][0], q[i][1] + 8); g.stroke(); } }, { maskScale: 0.4, margin: 30, flood: { seeds: [[-190, 1080]] } });
      B.mask('puddle', (g) => WC.fillEllipse(g, PUDDLE[0], PUDDLE[1], 74, 13, -0.03), { maskScale: 1, margin: 30 });
      B.mask('ripple', (g) => { g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 40, 7, 0, 0, 7); g.stroke(); }, { maskScale: 1.5, margin: 12 });
      B.mask('stile', (g) => { const [x, y] = STILE; g.fillRect(x - 36, y - 92, 9, 96); g.fillRect(x + 30, y - 88, 9, 92); g.fillRect(x - 42, y - 70, 86, 7); g.fillRect(x - 42, y - 40, 86, 7); g.fillRect(x - 20, y - 22, 46, 8); }, { margin: 16, flood: { seeds: [[STILE[0], STILE[1] - 90]] } });
      B.mask('nearHedge', (g) => { K.hedge(g, [[STILE[0] + 70, STILE[1] + 4], [1900, STILE[1] - 30], [2200, STILE[1] - 60], [2500, STILE[1] - 74]], 24, WC.rng(5), 0.25); K.hedge(g, [[1250, STILE[1] + 20], [1450, STILE[1] + 10], [STILE[0] - 70, STILE[1] + 4]], 22, WC.rng(6), 0.15); }, { maskScale: 0.5, margin: 30, flood: { seeds: [[STILE[0] - 60, STILE[1]], [STILE[0] + 80, STILE[1]]] } });
      const onPath = (x, y) => Math.abs(y - (pathY(x) + 8)) < 30 - 10 * A.clamp((x + 200) / 3100);
      GRASS.forEach(([y, h0, h1], i) => B.mask('grass' + i, (g) => K.grass(g, -200, 3200, y, [260, 360, 460, 560][i], h0, h1, WC.rng(60 + i), 0.35, onPath), { maskScale: 0.6, margin: 16 }));
      B.mask('flowers', K.splat(19, 1400, 1080, 1700, 90, 220, 4.5, 1.8), { margin: 12 });
      B.mask('sheen', (g) => { for (let k = 0; k < 4; k++) WC.fillEllipse(g, k * 900, 1000, 260, 140, -0.2); }, { maskScale: 0.2, margin: 100 });
      B.mask('glow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 360), { maskScale: 0.25, margin: 160 });
      C.lizzy(B, 'lz', { x: LZ0[0], y: LZ0[1], s: S, dir: 1, pose: P.lizzy.poses.walk(0, Math.PI / 2), bonnet: true, streamers: 1.35, seed: 'face' });
    },

    render(eng, Mk, t) {
      const worst1 = A.word(0, 'worst'), worst2 = A.word(1, 'worst');
      const lx = walkX(t);
      const cam = K.cam(A.keys(t, [[2.9, 1.02], [12.95, 1.1]]), A.clamp(lx + 250, 900, 1900), A.keys(t, [[2.9, 560], [12.95, 585]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);
      // gusts: a steady wind toward -x, shoving harder on each "worst"
      const gust = 0.35 + 0.65 * Math.max(A.env(t, worst1 - 0.3, worst1 + 2.2, 0.3, 1.4), A.env(t, worst2 - 0.3, worst2 + 2.2, 0.3, 1.4));
      const drift = -34 * (t - 3) - 90 * A.ease(t, worst1 - 0.3, worst1 + 1.8) - 90 * A.ease(t, worst2 - 0.3, worst2 + 1.8);

      // ---- sky and clouds
      W(Mk.sky, { pig: '#aebfd9', pigB: '#f0dfbf', mix: { dir: [0, 1], at: 420, width: 260, noise: 0.8, noiseScale: 300 }, density: 0.6, edge: 0.4, edgeW: 16, soft: 4, warp: 30, warpScale: 260, rough: 4, flow: 0.45, flowScale: 220, gran: 0.15,
        flood: { at: pp(2.95, 1.4), soft: 80, noise: 90, edge: 0.7, edgeW: 30 }, wet: K.wet(t, 2.95, 4.3), wetAmp: 12, seed: 1 });
      CLOUDS.forEach(([x, y, w, h], i) => {
        const cx = M.tr(drift * (0.8 + 0.1 * i), 0), cp = pp(3.3 + i * 0.15, 1.2);
        W(Mk['cloud' + i], { mode: 'lift', lift: 0.8 * cp, soft: 6, warp: 16, warpScale: 60, rough: 5, roughScale: 16, wet: 0.6, wetAmp: 5, wetScale: 50, seed: 10 + i }, cx);
        W(Mk['cloud' + i], { pig: '#c3bdd6', pigB: '#fbf6ee', mix: { dir: [0, -1], at: -(y - h * 0.15), width: h * 0.35, noise: 0.7 }, density: 0.5, soft: 6, edge: 0.3, warp: 16, warpScale: 60, rough: 5, roughScale: 16,
          flood: { at: cp, soft: 30, noise: 30 }, wet: 0.6, wetAmp: 5, wetScale: 50, seed: 10 + i }, cx);
      });
      const fcx = M.tr(((drift * 0.35) % 560) + 280, 0), fcp = pp(3.6, 1.4);
      W(Mk.farClouds, { mode: 'lift', lift: 0.55 * fcp, soft: 5, warp: 10, warpScale: 40, rough: 3, roughScale: 12, seed: 18 }, fcx);
      W(Mk.farClouds, { pig: '#c8c0d8', pigB: '#f6f0e8', mix: { dir: [0, -1], at: -440, width: 30, noise: 0.7 }, density: 0.4, soft: 5, edge: 0.3, warp: 10, warpScale: 40, rough: 3, roughScale: 12, flood: { at: fcp, soft: 30, noise: 30 }, seed: 18 }, fcx);
      W(Mk.hillsFar, { pig: '#aab4cf', pigB: '#b9b2c9', mix: { dir: [1, 0], at: 1400, width: 900, noise: 0.8 }, density: 0.6, edge: 1.0, edgeW: 5, soft: 2, warp: 10, warpScale: 160, rough: 3, flow: 0.4, gran: 0.3,
        flood: { at: pp(3.2, 1.4), soft: 40, noise: 60 }, wet: K.wet(t, 3.2, 4.6), seed: 20 });
      W(Mk.house, { pig: '#c9c4d6', density: 0.75, edge: 1.2, edgeW: 2, soft: 0.9, warp: 1, rough: 0.6, flood: { at: pp(4.0, 0.9), soft: 8, noise: 8 }, seed: 21 });
      W(Mk.houseTrees, { pig: '#9aa7a4', density: 0.7, edge: 1, soft: 1.5, warp: 3, rough: 2, seed: 22, alpha: pp(4.2, 0.8) });

      // ---- the fields: a patchwork of greens and stubble, hedges between
      const fieldP = { edge: 0.9, edgeW: 6, soft: 2, warp: 14, warpScale: 180, rough: 4, flow: 0.5, flowScale: 140, gran: 0.35 };
      W(Mk.fieldsFar, Object.assign({ pig: '#c6c98f', pigB: '#93ad76', mix: { dir: [1, 0.2], at: 1200, width: 140, noise: 2.2, noiseScale: 150 }, density: 0.6,
        flood: { at: pp(3.3, 1.5), soft: 50, noise: 60 }, wet: K.wet(t, 3.3, 4.8), seed: 23 }, fieldP));
      W(Mk.fieldsNear, Object.assign({ pig: '#b7c47f', pigB: '#86a268', mix: { dir: [1, -0.3], at: 1500, width: 160, noise: 2.0, noiseScale: 190 }, density: 0.65,
        flood: { at: pp(3.5, 1.5), soft: 50, noise: 60 }, wet: K.wet(t, 3.5, 5.0), seed: 24 }, fieldP));
      W(Mk.hedges, { pig: '#5e7a55', pigB: '#44604f', mix: { dir: [0, 1], at: 700, width: 60, noise: 0.8 }, density: 0.85, edge: 1.1, edgeW: 3, soft: 1.3, warp: 3, warpScale: 30, rough: 2.4, roughScale: 8, gran: 0.5,
        flood: { at: pp(3.8, 1.6), soft: 30, noise: 30 }, wet: 0.3 + 0.4 * gust, wetAmp: 3, wetScale: 30, seed: 25 });
      // cloud shadows sweeping across the fields with the wind
      W(Mk.shadows, { pig: '#6f7aa0', density: 0.42 * pp(4.2, 1.2), soft: 70, edge: 0.1, warp: 50, warpScale: 150, flow: 0.4, seed: 26 }, M.tr(((drift * 1.6) % 800) + 400, 0));

      // ---- the meadow, the path, the puddle
      W(Mk.meadow, { pig: '#a9b978', pigB: '#768f58', mix: { dir: [0, 1], at: 1000, width: 160, noise: 1.2, noiseScale: 200 }, density: 0.7, edge: 0.6, edgeW: 10, soft: 3, warp: 16, warpScale: 200, rough: 4, flow: 0.5, flowScale: 150, gran: 0.35,
        flood: { at: pp(3.2, 1.6), soft: 60, noise: 70, edge: 0.8 }, wet: K.wet(t, 3.2, 4.8), seed: 27 });
      W(Mk.path, { mode: 'lift', lift: 0.45 * pp(3.7, 1.2), soft: 5, warp: 8, warpScale: 60, rough: 3, flood: { at: pp(3.7, 1.2), soft: 40, noise: 30 }, seed: 28 });
      W(Mk.path, { pig: '#c8a878', pigB: '#a8875e', mix: { dir: [1, 0], at: 1200, width: 500, noise: 1.0 }, density: 0.45, soft: 5, edge: 0.7, edgeW: 5, warp: 8, warpScale: 60, rough: 3, gran: 0.6,
        flood: { at: pp(3.8, 1.2), soft: 40, noise: 30 }, seed: 28 });
      W(Mk.puddle, { mode: 'lift', lift: 0.7 * pp(4.4, 0.6), soft: 2, warp: 3, rough: 1, seed: 29 });
      W(Mk.puddle, { pig: '#9fb3d0', pigB: '#e8e0d0', mix: { dir: [1, 0], at: PUDDLE[0], width: 50, noise: 1 }, density: 0.45 * pp(4.5, 0.6), soft: 2, edge: 1.2, edgeW: 3, warp: 3, rough: 1, seed: 29 });
      [0, 0.2, 0.45].forEach((d, k) => {    // the splash spreads rings over the puddle
        const u = A.ramp(t, tPuddle + d, tPuddle + d + 1.1); if (u <= 0 || u >= 1) return;
        W(Mk.ripple, { mode: 'lift', lift: 0.6 * (1 - u), soft: 1, warp: 1, seed: 30 + k }, M.mul(M.tr(PUDDLE[0] + 10 * k, PUDDLE[1]), M.sc(0.4 + 1.3 * u)));
      });
      W(Mk.stile, { pig: '#6f5a48', density: 0.85, edge: 1.3, edgeW: 2, soft: 1, warp: 1.5, rough: 1, gran: 0.6, flood: { at: pp(4.4, 0.8), soft: 10, noise: 10 }, seed: 31 });
      W(Mk.nearHedge, { pig: '#5f7d52', pigB: '#3f5a4a', mix: { dir: [0, 1], at: STILE[1] - 40, width: 50, noise: 0.9 }, density: 0.9, edge: 1.1, edgeW: 4, soft: 1.5, warp: 4, warpScale: 30, rough: 3, roughScale: 9, gran: 0.5,
        flood: { at: pp(4.0, 1.4), soft: 30, noise: 30 }, wet: 0.3 + 0.5 * gust, wetAmp: 4, wetScale: 30, seed: 32 });

      // grass, gusts running through it in waves (rows behind her first, rows in front after)
      const grass = (i) => { const [y, , h1] = GRASS[i]; W(Mk['grass' + i], { pig: ['#8aa06a', '#789660', '#62804f', '#526f45'][i], density: [0.5, 0.6, 0.72, 0.8][i] * pp(4.0 + i * 0.12, 0.8), edge: 0.9, edgeW: 2, soft: 1, warp: 1.5, warpScale: 30, rough: 0.6, gran: 0.4,
        sway: { amp: 5 + 12 * gust, y0: -(y + 10), y1: -(y - h1), k: 1.3, omega: 2.4, wave: 1e6, phase: i, axis: [0, -1], lean: 0.4 + 0.6 * gust, waveX: 260 }, seed: 50 + i }); };
      grass(0); grass(1);
      // ---- ink: crows tumbling on the wind; the pencil horizon (inked before she is painted, so
      // both pass behind her)
      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0';
      C.pen(g, [[-200, 604], [900, 588], [2000, 590], [3200, 584]], K.pp(t, 2.95, 1.0, A.inOut), 1.1, 4);
      g.strokeStyle = '#f00';
      const crows = [];
      for (let i = 0; i < 7; i++) {
        const h = (k) => A.hash(i * 5 + k + 90), u = t - 4.0 - i * 0.35;
        if (u < 0) continue;
        crows.push([lx + 1150 - u * (150 + 60 * h(1)) - 130 * gust * u * 0.3, 240 + h(2) * 180 + Math.sin(u * 1.6 + i) * 30 - u * 6, 9 + 6 * h(3), i * 1.3]);
      }
      K.birds(g, crows, t);
      eng.ink({ strength: [1.6, 0.5, 1.2], seed: 11 });
      // ---- Elizabeth, walking into the wind
      const bp = A.beatPhase(t);
      const bob = -S * 0.06 * Math.abs(Math.sin(Math.PI * bp));
      const ly = pathY(lx) + 4;
      const lean = 0.035 + 0.03 * gust;
      const lzXf = M.mul(M.tr(lx - LZ0[0], ly - LZ0[1] + bob), M.about(LZ0[0], LZ0[1], lean));
      W(Mk.dot, { pig: '#5d6a4f', density: 0.35 * pp(3.6, 0.8), soft: 12, warp: 4, seed: 33 }, M.mul(M.tr(lx + 6, ly + 2), M.sc(1.1, 0.12)));
      const mud = S * 0.55 * A.ease(t, tPuddle - 0.05, tPuddle + 1.2, A.out);
      C.paint(eng, Mk, 'lz', { cam, xf: lzXf, t, p: pp(3.4, 1.4), wet: K.wet(t, 3.4, 4.8), sway: 6 + 6 * gust, omega: Math.PI / 0.557, phase: 0, wind: -0.9 * gust - 0.3, stain: { h: mud, pig: '#6e5236' }, seed: 1 });
      // mud and water thrown up by the splash
      for (let i = 0; i < 14; i++) {
        const h = (k) => A.hash(i * 11 + k + 50), u = A.ramp(t, tPuddle, tPuddle + 0.8 + 0.3 * h(1));
        if (u <= 0 || u >= 1) continue;
        const vx = (h(2) - 0.3) * 160, vy = -(120 + 160 * h(3));
        const x = PUDDLE[0] + (h(4) - 0.5) * 60 + vx * u, y = PUDDLE[1] + vy * u + 380 * u * u;
        W(Mk.dot, { pig: h(5) < 0.5 ? '#6e5236' : '#8ea2c0', density: 0.8 * (1 - u), soft: 1, edge: 1.2, warp: 1, seed: 40 + i }, M.mul(M.tr(x, y), M.sc(0.05 + 0.05 * h(6))));
      }

      grass(2); grass(3);
      W(Mk.flowers, { pig: '#e6a0b0', pigB: '#f3e0a0', mix: { dir: [1, 0], at: 1200, width: 40, noise: 3 }, density: 0.8 * pp(4.6, 0.8), edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 57,
        sway: { amp: 3 + 5 * gust, y0: -1e5, y1: -1e5 + 1, k: 1, omega: 2.4, wave: 1e6, phase: 0, axis: [0, -1], lean: 0.5, waveX: 260 } });
      // leaves snatched off the hedges by the gusts
      let leaves = [];
      [worst1, worst2].forEach((w, k) => { leaves = leaves.concat(K.petalFlight(t, w - 0.2, [lx + 1100, 640], [lx - 700, 760], 9, false, 70 + k, { arc: -120, stagger: 0.08, dur: 2.2, life: 3.4, size: 30 })); });
      K.paintPetals(eng, cam, Mk.petal, leaves, { indigo: '#7f9a5a' });

      // ---- light: sun behind the clouds, patches of sunlight chasing over the grass
      Lt(Mk.glow, { colour: '#ffe2b0', density: 0.24 * pp(3.2, 1.4), soft: 160, warp: 30, seed: 60 });
      Lt(Mk.sheen, { colour: '#fff1c8', density: 0.16 * pp(4.2, 1.0) * (0.6 + 0.4 * gust), soft: 90, warp: 60, streak: { angle: 0, amt: 0.7, len: 200 }, seed: 61 }, M.tr(((t * -160) % 900) + 900, 0));
    },
  };
})(window.WC = window.WC || {});
