// Scene: On My Mind (verse 1, lines 3-5), painted on.
// Her profile is sketched, then a sunset floods into the silhouette from the sun, hills sweep
// in stroke by stroke, and on "on my mind" a tiny Darcy is painted on the hilltop.
// "And in my heart": the camera drifts down as a heart floods open on her breast, lit from
// within. "But I don't know if that's a crime": an indigo drop falls and marbles through it.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, F = WC.figures, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 560, y: 175, s: 500 };
  const HEART = [655, 1010];
  const SUN = [690, 552];
  const clipLizzy = (g) => { g.beginPath(); WC.spline(g, F.lizzyBody, true, LZ.s, LZ.x, LZ.y); g.clip(); };
  const hill = (pts) => (g) => { g.save(); clipLizzy(g); g.beginPath(); WC.spline(g, pts, false, 1); g.lineTo(1400, 1500); g.lineTo(-200, 1500); g.closePath(); g.fill(); g.restore(); };
  const inLizzy = (g, fn) => { g.save(); g.translate(LZ.x, LZ.y); fn(); g.restore(); };

  WC.scenes.mind = {
    build(B) {
      K.commonMasks(B);
      const L = F.lizzy;
      B.mask('bg', K.rect(30, 26, 1860, 1400), { maskScale: 0.25, margin: 80, flood: { seeds: [[700, 450]] } });
      B.mask('glow', (g) => { g.beginPath(); g.ellipse(600, 380, 420, 360, -0.2, 0, 7); g.fill(); }, { maskScale: 0.35, margin: 140 });
      B.mask('strokeR', (g) => { WC.brushStroke(g, [[1200, 180], [1500, 120], [1760, 240], [1820, 520]], 130); WC.brushStroke(g, [[1250, 780], [1550, 700], [1790, 820]], 90); }, { maskScale: 0.4, margin: 80, flood: { seeds: [[1200, 180], [1250, 780]] } });
      B.mask('sky', (g) => inLizzy(g, () => L.body(g, LZ.s)), { maskScale: 0.6, flood: { seeds: [SUN] } });
      B.mask('sun', (g) => WC.fillCircle(g, SUN[0], SUN[1], 44), { maskScale: 0.8, margin: 60 });
      B.mask('sunGlow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 120), { maskScale: 0.4, margin: 120 });
      B.mask('hillFar', hill([[-200, 580], [300, 560], [470, 548], [640, 572], [860, 556], [1400, 570]]), { maskScale: 0.6, flood: { seeds: [[320, 575]] } });
      B.mask('hillMid', hill([[-200, 640], [360, 624], [560, 606], [700, 628], [900, 650], [1400, 660]]), { maskScale: 0.6, flood: { seeds: [[330, 640]] } });
      B.mask('hillNear', hill([[-200, 760], [300, 700], [520, 690], [760, 740], [1000, 800], [1400, 820]]), { maskScale: 0.5, flood: { seeds: [[330, 720]] } });
      B.mask('field', hill([[-200, 900], [400, 860], [800, 900], [1400, 960]]), { maskScale: 0.5, flood: { seeds: [[500, 900]] } });
      B.mask('mist', (g) => { g.save(); clipLizzy(g); g.beginPath(); g.ellipse(560, 600, 260, 22, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(700, 675, 220, 16, 0, 0, 7); g.fill(); g.restore(); }, { maskScale: 0.6, margin: 40 });
      B.mask('house', (g) => { g.save(); clipLizzy(g); WC.props.pemberley(g, 440, 560, 110); g.restore(); }, { margin: 20, flood: { seeds: [[440, 530]] } });
      B.mask('houseWin', (g) => { g.save(); clipLizzy(g); WC.props.pemberleyWindows(g, 440, 560, 110); g.restore(); }, { margin: 10, maskScale: 2 });
      B.mask('rim', (g) => { g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath(); WC.spline(g, F.lizzyBody, true, LZ.s, LZ.x, LZ.y); g.stroke(); }, { maskScale: 0.8, margin: 30, flood: { seeds: [[LZ.x + 0.45 * LZ.s, LZ.y + 0.4 * LZ.s]] } });
      C.lizzyBust(B, 'lz', LZ);
      B.box('heart', (g) => { g.fill(WC.heartPath(new Path2D(), 0, 0, 120)); }, { x: -140, y: -140, w: 280, h: 260 }, { margin: 60, flood: { seeds: [[0, -20]] } });
      B.box('drop', (g) => { g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(12, -8, 16, 4, 0, 16); g.bezierCurveTo(-16, 4, -12, -8, 0, -30); g.fill(); }, { x: -20, y: -34, w: 40, h: 54 }, { margin: 20, maskScale: 2 });
      B.mask('splash', K.splat(31, HEART[0], HEART[1] - 20, 150, 110, 40, 7), { margin: 16 });
      C.darcy(B, 'tiny', { x: 548, y: 611, s: 10, dir: 1, pose: P.darcy.poses.still(), lite: true });
    },

    render(eng, Mk, t) {
      const heartT = A.word(3, 'heart'), knowT = A.word(4, 'know'), crimeT = A.word(4, 'crime'), mindT = A.word(2, 'mind');
      const z = A.keys(t, [[12.95, 1.08], [19.0, 1.16], [21.0, 1.12], [26.6, 1.12], [28.2, 1.22], [30.2, 1.26]]);
      const c = A.keys(t, [[12.95, [720, 470]], [19.0, [720, 460]], [21.0, [700, 850]], [26.6, [700, 860]], [28.2, [690, 900]], [30.2, [690, 900]]]);
      const cam = K.cam(z, c[0], c[1]);
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));

      W(Mk.bg, { pig: '#efe3e6', pigB: '#e0e2ea', mix: { dir: [1, 0.3], at: 1100, width: 500, noise: 0.9, noiseScale: 260 }, density: 0.45, edge: 0.4, edgeW: 14, soft: 3, warp: 24, warpScale: 260, rough: 6, roughScale: 30, flow: 0.5, flowScale: 220, gran: 0.2, dry: 0.4,
        flood: { at: K.pp(t, 13.0, 1.6), soft: 80, noise: 90, edge: 0.4 }, wet: K.wet(t, 13.0, 14.6), seed: 1 });
      W(Mk.glow, { pig: '#f6d3a8', pigB: '#f0b7c2', mix: { dir: [1, 0.4], at: 700, width: 260, noise: 0.8, flow: 0.1 }, density: 0.55 * K.pp(t, 13.4, 1.5), soft: 60, edge: 0.1, warp: 50, warpScale: 200, flow: 0.7, flowScale: 90, seed: 2 });
      W(Mk.strokeR, { pig: '#e9b8c8', pigB: '#c3c3e0', mix: { dir: [1, 0.5], at: 1500, width: 260, noise: 0.9 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9,
        flood: { at: K.pp(t, 14.0, 1.4), soft: 30, noise: 30 }, wet: K.wet(t, 14.0, 15.4), seed: 3 });

      // the sunset floods into her silhouette from the sun
      const skyP = K.pp(t, 13.3, 2.9, A.inOut), skyW = K.wet(t, 13.3, 16.2, 2.2);
      W(Mk.sky, { pig: '#f6bf7e', pigB: '#cf8db8', mix: { dir: [0, -1], at: -540, width: 260, noise: 0.8, noiseScale: 180, flow: 0.06 * skyW }, density: 1.0, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3, warpScale: 130, rough: 1.3, flow: 0.6, flowScale: 120, gran: 0.35,
        flood: { at: skyP, soft: 50, noise: 70, edge: 0.9, edgeW: 26 }, wet: skyW, wetAmp: 10, seed: 4 });
      const rise = A.ramp(t, 13, 30);
      W(Mk.sun, { pig: '#f7d98c', pigB: '#f2b98a', mix: { dir: [0, 1], at: 552, width: 30 }, density: 0.8, soft: 10, edge: 0.6, warp: 4, seed: 5, alpha: K.pp(t, 13.8, 1.0) }, M.tr(0, -18 * rise));
      const hl = (m, a, d, pig, pigB, dens, sd) => W(m, { pig, pigB, mix: { dir: [1, 0], at: 600, width: 300 }, density: dens, edge: 1.2, edgeW: 4, soft: 1.3, warp: 6, warpScale: 120, rough: 2, flow: 0.55, gran: 0.45,
        flood: { at: K.pp(t, a, d, A.inOut), soft: 30, noise: 50, edge: 1.0, edgeW: 18 }, wet: K.wet(t, a, a + d), wetAmp: 8, seed: sd });
      hl(Mk.hillFar, 14.2, 1.6, '#b5b3d6', '#b5b3d6', 0.7, 6);
      W(Mk.house, { pig: '#9c98b8', density: 0.7, edge: 1.3, edgeW: 2, soft: 0.9, warp: 1, rough: 0.6, flood: { at: K.pp(t, 15.1, 0.9), soft: 8, noise: 8 }, seed: 7 });
      W(Mk.houseWin, { mode: 'lift', lift: 0.6 * K.pp(t, 15.8, 0.6), soft: 0.8, warp: 0.4, rough: 0.2, seed: 8 });
      hl(Mk.hillMid, 14.6, 1.6, '#c98fae', '#b27fa6', 0.8, 10);
      hl(Mk.hillNear, 15.0, 1.8, '#c47f9f', '#aa7aa0', 0.6, 11);
      hl(Mk.field, 15.4, 2.0, '#d9a6b8', '#b7a3d0', 0.42, 12);
      const drift = (t - 15) * 7;
      W(Mk.mist, { mode: 'lift', lift: 0.45 * K.pp(t, 15.4, 1.2), soft: 14, warp: 16, warpScale: 70, seed: 9 }, M.tr(drift, 0));
      W(Mk.rim, { pig: '#d98fa6', density: 0.5, soft: 3, edge: 0.4, warp: 3, warpScale: 130, rough: 1.3, flood: { at: K.pp(t, 13.2, 1.6), soft: 20, noise: 20 }, seed: 13 });

      // tiny Darcy, painted on the hilltop on "on my mind", lit from behind by the sun
      const dp = K.pp(t, mindT - 0.8, 1.2);
      if (dp > 0) {
        C.paintDarcy(eng, Mk, 'tiny', { cam, t, p: dp, wet: K.wet(t, mindT - 0.8, mindT + 0.4), sway: 1.2, style: { coat: '#39406a', coatB: '#2f3656', face: '#4d5a86', legs: '#56648f', hair: '#1f2440', hairB: '#2a2440' }, lift: 0.7 });
      }

      // her hair, ribbon, flower, lips on top of the landscape
      const hairP = K.pp(t, 15.3, 1.8), hw = K.wet(t, 15.3, 17.1);
      const hairSway = { amp: 2.5, y0: LZ.y + 0.25 * LZ.s, y1: LZ.y + 0.95 * LZ.s, k: 1.4, omega: 1.9, wave: 90, phase: 0.7 };
      W(Mk.lzLips, { pig: '#c9506c', density: 0.5 * K.pp(t, 16.6, 0.6), soft: 1.2, edge: 1.1, edgeW: 3, warp: 1.2, warpScale: 40, rough: 0.6, seed: 14 });
      W(Mk.lzHair, { pig: '#9e4b52', pigB: '#6d3b35', mix: { dir: [-1, 0.2], at: (-(LZ.x - 0.149 * LZ.s) + 0.2 * (LZ.y + 0.2 * LZ.s)) / 1.0198, width: 0.38 * LZ.s, noise: 0.9 }, density: 1.05, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, rough: 1.8, roughScale: 7, flow: 0.45, gran: 0.55,
        flood: { at: hairP, soft: 22, noise: 30 }, wet: hw, sway: hairSway, seed: 15 });
      W(Mk.lzHairLights, { mode: 'lift', lift: 0.5 * K.pp(t, 17.0, 0.6), soft: 2.5, warp: 2, rough: 1.4, sway: hairSway, seed: 16 });
      const rp = K.pp(t, 16.2, 0.9), ribSway = { amp: 4, y0: LZ.y + 0.05 * LZ.s, y1: LZ.y + 0.7 * LZ.s, k: 1.1, omega: 2.2, wave: 70, phase: 2 };
      W(Mk.lzRibbon, { mode: 'lift', lift: 0.85, soft: 1.2, flood: { at: rp, soft: 16, noise: 20 }, sway: ribSway, seed: 17 });
      W(Mk.lzRibbon, { pig: '#6fb0a8', pigB: '#4f8f96', mix: { dir: [-1, 0.5], at: (-(LZ.x - 0.455 * LZ.s) + 0.5 * LZ.y) / 1.118, width: 0.255 * LZ.s, noise: 0.6 }, density: 1.0, edge: 1.3, edgeW: 4, warp: 2, warpScale: 70, rough: 1, flow: 0.4, gran: 0.4, flood: { at: rp, soft: 16, noise: 20 }, sway: ribSway, seed: 17 });
      const fp = K.pp(t, 16.5, 0.7);
      W(Mk.lzFlower, { mode: 'lift', lift: 0.85, soft: 1, flood: { at: fp, soft: 10, noise: 10 }, seed: 18 });
      W(Mk.lzFlower, { pig: '#f4d3da', density: 0.8, edge: 1.6, edgeW: 3, warp: 1.5, warpScale: 40, rough: 0.8, flood: { at: fp, soft: 10, noise: 10 }, seed: 18 });
      W(Mk.lzFlowerHeart, { pig: '#e9c46a', pigB: '#b9773a', mix: { dir: [1, 1], at: 0, width: 10, noise: 0.3 }, density: 1.1 * K.pp(t, 17.0, 0.4), edge: 1.2, edgeW: 3, gran: 0.9, seed: 19 });

      // the heart floods open, lit from within
      const hx = M.tr(HEART[0], HEART[1]);
      const hp = K.pp(t, heartT - 0.3, 1.3);
      if (hp > 0) {
        W(Mk.heart, { mode: 'lift', lift: 0.85, soft: 2, warp: 6, warpScale: 60, rough: 2, roughScale: 10, flood: { at: hp, soft: 24, noise: 30 }, seed: 20 }, hx);
        W(Mk.heart, { pig: '#ef6f8e', pigB: '#d94a72', mix: { dir: [0, 1], at: 0, width: 80, noise: 0.8, flow: 0.12 }, density: 1.0, edge: 1.4, edgeW: 6, soft: 1.3, warp: 6, warpScale: 60, rough: 2, roughScale: 10, flow: 0.6, flowScale: 50, gran: 0.4,
          flood: { at: hp, soft: 24, noise: 30, edge: 1.3, edgeW: 16 }, wet: K.wet(t, heartT - 0.3, heartT + 1.0), wetAmp: 6, seed: 21 }, hx);
        const beat = A.pulse(t, 0.3);
        Lt(Mk.heart, { colour: '#ffb3a8', density: (0.18 + 0.22 * beat) * hp * (1 - 0.6 * A.ramp(t, knowT, crimeT)), soft: 40, warp: 10, seed: 22 }, M.mul(hx, M.sc(1.25)));
      }
      // the indigo drop falls and marbles through it
      const fall = A.ramp(t, knowT - 0.45, knowT);
      if (fall > 0 && fall < 1) W(Mk.drop, { pig: '#4a5a90', density: 1.1, edge: 1.2, edgeW: 2, warp: 1, rough: 0.4, seed: 23 }, M.tr(HEART[0] + 10, A.lerp(700, HEART[1] - 30, fall * fall)));
      const spread = K.pp(t, knowT, crimeT + 0.8 - knowT);
      if (spread > 0) {
        W(Mk.splash, { pig: '#5d6b99', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 24, radial: { x: HEART[0], y: HEART[1] - 20, r: 30 + 200 * K.pp(t, knowT, 0.3), soft: 20 } });
        W(Mk.heart, { pig: '#6b6fb0', pigB: '#b06a9a', mix: { dir: [1, 1], at: 0, width: 70, noise: 1.3, noiseScale: 60, flow: 0.25, vein: 0.5 }, density: 0.85, edge: 1.2, edgeW: 5, soft: 2, warp: 10, warpScale: 50, rough: 3, roughScale: 9, flow: 0.8, flowScale: 40, gran: 0.6,
          radial: { x: 10, y: -30, r: 10 + 210 * spread, soft: 30 }, wet: 1 - 0.7 * A.ramp(t, crimeT + 0.6, 30), wetAmp: 8, wetScale: 50, seed: 25 }, hx);
      }
      // light: the sun inside her head
      Lt(Mk.sunGlow, { colour: '#ffc98a', density: 0.2 * K.pp(t, 13.8, 1.4), soft: 90, warp: 20, seed: 26 }, M.tr(0, -18 * rise));
      K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 13.2, [1300, 150], [1500, 900], 5, (i) => i % 2 === 0, 5, { stagger: 2.4, dur: 6, life: 12, arc: 80 }));

      // ink: the sketch, the eye, birds, the question mark
      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0';
      C.sketchLizzy(g, Mk.lzInfo, K.pp(t, 12.95, 1.3, A.inOut));
      C.pen(g, [[250, 562], [900, 556]], K.pp(t, 13.2, 0.8), 1.1, 4);
      g.fillStyle = g.strokeStyle = '#f00';
      const blink = [23.2].some((b) => t > b && t < b + 0.14);
      C.inkLizzyBust(g, Mk.lzInfo, { p: K.pp(t, 16.0, 1.0, (x) => x), closed: blink });
      g.lineWidth = 1.6; g.lineCap = 'round';
      const bp = K.pp(t, 16.0, 1.0);
      if (bp > 0) {
        [[520, 420], [575, 395], [640, 440]].forEach(([bx, by], i) => {
          const f = Math.sin(t * 5 + i * 2) * 6, x = bx + (t - 13) * 6 + i * 3;
          g.globalAlpha = bp;
          g.beginPath(); g.moveTo(x - 10, by - 3 - f); g.quadraticCurveTo(x - 4, by - 7, x, by); g.quadraticCurveTo(x + 4, by - 7, x + 10, by - 3 - f); g.stroke();
          g.globalAlpha = 1;
        });
      }
      K.writeText(g, '?', 845, 1080, `210px ${K.FONT_SCRIPT}`, A.ramp(t, crimeT - 0.1, crimeT + 0.5), 'left', '#f00');
      eng.ink({ strength: [1.7, 0.5, 1.2], seed: 4 });
    },
  };
})(window.WC = window.WC || {});
