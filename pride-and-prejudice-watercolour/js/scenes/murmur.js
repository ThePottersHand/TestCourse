// Scene: Oakham Mount (chorus 3). The last chapters: "they were to walk to Oakham Mount".
// Dusk on the hilltop beside a wind-bent hawthorn. Elizabeth watches a murmuration of
// starlings pour across the sunset: on "like" the flock gathers and swirls, on "hate" it
// tears in two, on "like" it flows back together. On "I guess" Darcy is painted onto the hill
// beside her; on "the art of making up my mind" the flock draws a heart over them.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const SUN = [1480, 700];
  const LZ = { x: 700, y: 770, s: 50 }, DC = { x: 842, y: 772, s: 53 };
  const HILL = [[-300, 1000], [0, 900], [300, 812], [520, 776], [700, 768], [860, 772], [1040, 800], [1300, 870], [1600, 980], [1900, 1100]];
  const N = 560;
  // each starling has a fixed place in the flock (a point in the unit disc) and its own rhythm
  const BIRDS = Array.from({ length: N }, (_, i) => { const a = A.hash(i * 3 + 1) * Math.PI * 2, r = Math.sqrt(A.hash(i * 3 + 2)); return [Math.cos(a) * r, Math.sin(a) * r, A.hash(i * 3 + 3)]; });
  // a place for each bird inside a heart, spread evenly: (x^2 + y^2 - 1)^3 - x^2 y^3 <= 0
  const HEART = (() => {
    const r = WC.rng(71), out = [];
    while (out.length < N) {
      const x = (r() - 0.5) * 2.5, y = -1.2 + r() * 2.6;
      if (Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y <= 0) out.push([x, -y]);
    }
    return out;
  })();

  WC.scenes.murmur = {
    build(B) {
      K.commonMasks(B);
      B.mask('sky', K.rect(-300, -300, 2600, 1300), { maskScale: 0.2, margin: 60, flood: { seeds: [SUN] } });
      B.mask('clouds', (g) => [[[-200, 330], [300, 300], [800, 320], [1200, 300]], [[700, 470], [1100, 450], [1500, 470], [2000, 440]], [[-100, 560], [400, 546], [900, 560]], [[1200, 220], [1600, 200], [2100, 214]]].forEach((pts, i) => WC.brushStroke(g, pts, [30, 26, 18, 22][i], 14, 1.4)), { maskScale: 0.4, margin: 40, flood: { seeds: [[-190, 330], [690, 470], [-90, 560], [1190, 220]] } });
      const band = (pts, y1) => (g) => { g.beginPath(); WC.spline(g, pts, false, 1); g.lineTo(2300, y1); g.lineTo(-300, y1); g.fill(); };
      B.mask('hillsFar', band([[-300, 690], [300, 660], [900, 684], [1500, 654], [2300, 680]], 1100), { maskScale: 0.25, flood: { seeds: [SUN] } });
      B.mask('hillsMid', band([[-300, 760], [400, 740], [1100, 770], [1700, 736], [2300, 760]], 1100), { maskScale: 0.25, flood: { seeds: [[2200, 750]] } });
      B.mask('mist', (g) => [[1100, 760, 700, 26], [1700, 780, 600, 22], [600, 790, 500, 20]].forEach(([x, y, rx, ry]) => WC.fillEllipse(g, x, y, rx, ry, 0)), { maskScale: 0.3, margin: 60 });
      B.mask('lights', (g) => { const r = WC.rng(6); for (let i = 0; i < 14; i++) WC.fillCircle(g, 1180 + r() * 420, 764 + r() * 26, 2 + r() * 2); }, { maskScale: 1, margin: 12 });
      B.mask('hill', (g) => { g.beginPath(); WC.spline(g, HILL, false, 1); g.lineTo(2000, 1300); g.lineTo(-300, 1300); g.fill(); }, { maskScale: 0.3, margin: 40, flood: { seeds: [[LZ.x, 1200]] } });
      B.mask('tree', (g) => {
        const x = 360, y = 796, r = WC.rng(9);
        WC.fillLock(g, x, y + 4, x + 70, y - 170, 22, -0.15, 0.4);
        [[x + 70, y - 170, x + 240, y - 250], [x + 60, y - 150, x + 200, y - 180], [x + 66, y - 166, x + 110, y - 290], [x + 50, y - 130, x - 30, y - 210]].forEach(([a, b, c, d]) => WC.fillLock(g, a, b, c, d, 9, 0.2, 0.3));
        for (let i = 0; i < 70; i++) { const u = r(), cx = x + 20 + u * 260 + (r() - 0.5) * 40, cy = y - 190 - Math.sin(u * 3) * 50 - r() * 70 + u * 30; WC.fillCircle(g, cx, cy, 10 + r() * 16); }
      }, { maskScale: 0.5, margin: 30, flood: { seeds: [[360, 796]] } });
      B.mask('grass', (g) => K.grass(g, -300, 1700, 790, 360, 16, 40, WC.rng(12), 0.4, (x) => Math.abs(x - 770) < 110), { maskScale: 0.6, margin: 16 });
      B.mask('glow', (g) => WC.fillCircle(g, SUN[0], SUN[1], 420), { maskScale: 0.25, margin: 160 });
      B.mask('sunDisc', (g) => WC.fillCircle(g, SUN[0], SUN[1], 54), { maskScale: 0.6, margin: 60 });
      B.mask('stars', (g) => { const r = WC.rng(44); for (let i = 0; i < 26; i++) WC.fillCircle(g, -200 + r() * 2300, -200 + r() * 460, 1.5 + r() * 1.5); }, { maskScale: 1, margin: 10 });
      C.lizzy(B, 'lz', { x: LZ.x, y: LZ.y, s: LZ.s, dir: 1, pose: { torso: -0.03, head: -0.3, upper: 0.12, fore: -0.3, skirt: 0.01 }, bonnet: false });
      C.darcy(B, 'dc', { x: DC.x, y: DC.y, s: DC.s, dir: -1, pose: Object.assign(P.darcy.poses.still(), { head: -0.22 }), seed: 'feet' });
    },

    render(eng, Mk, t) {
      const l1 = A.word(22, 'like'), h1 = A.word(23, 'hate'), l2 = A.word(24, 'like'), gs = A.word(25, 'guess'), artT = A.word(26, 'art');
      const cam = K.cam(A.keys(t, [[112.5, 1.0], [134.4, 1.12]]), A.keys(t, [[112.5, 930], [134.4, 900]]), A.keys(t, [[112.5, 540], [134.4, 520]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);
      const dusk = A.ramp(t, 112.5, 134.4);
      const wind = 0.4 + 0.3 * Math.sin(t * 0.8) * Math.sin(t * 0.33 + 1);

      // ---- the sunset sky
      W(Mk.sky, { pig: '#f5c98e', pigB: '#8f7fb8', mix: { dir: [0, -1], at: -560 + 120 * dusk, width: 330, noise: 1.0, noiseScale: 300, flow: 0.02 }, density: 0.72, edge: 0.4, edgeW: 16, soft: 4, warp: 30, warpScale: 260, rough: 4, flow: 0.45, flowScale: 220, gran: 0.15,
        flood: { at: pp(112.6, 1.6), soft: 90, noise: 100, edge: 0.8, edgeW: 30 }, wet: 0.4, wetAmp: 12, seed: 1 });
      W(Mk.sky, { pig: '#e993a8', pigB: '#f7d7a0', mix: { dir: [1, 0.4], at: 1600, width: 500, noise: 1.2, flow: 0.03 }, density: 0.35, soft: 6, warp: 40, warpScale: 260, flow: 0.5, seed: 2, radial: { x: SUN[0], y: SUN[1], r: 300 + 900 * pp(112.8, 2), soft: 400 } });
      W(Mk.sunDisc, { pig: '#f8d890', pigB: '#f3a37a', mix: { dir: [0, 1], at: SUN[1], width: 50 }, density: 0.8 * pp(112.8, 1), soft: 6, edge: 0.8, warp: 3, seed: 3 }, M.tr(0, 40 * dusk));
      const cdrift = M.tr(-12 * (t - 112), 0);
      W(Mk.clouds, { mode: 'lift', lift: 0.35 * pp(113, 1.4), soft: 8, warp: 20, warpScale: 70, rough: 5, roughScale: 18, seed: 4 }, cdrift);
      W(Mk.clouds, { pig: '#c77a9a', pigB: '#8a6f9e', mix: { dir: [0, 1], at: 400, width: 200, noise: 1 }, density: 0.5, soft: 8, edge: 0.8, edgeW: 6, warp: 20, warpScale: 70, rough: 5, roughScale: 18,
        flood: { at: pp(113, 1.6), soft: 40, noise: 40 }, wet: 0.5, wetAmp: 6, seed: 4 }, cdrift);
      W(Mk.hillsFar, { pig: '#9d88b0', pigB: '#b58aa6', mix: { dir: [1, 0], at: 1300, width: 700, noise: 0.8 }, density: 0.6, edge: 1, edgeW: 5, soft: 2, warp: 10, warpScale: 160, rough: 3, flow: 0.4, gran: 0.3, flood: { at: pp(112.9, 1.5), soft: 40, noise: 60 }, seed: 5 });
      W(Mk.hillsMid, { pig: '#7c6f96', pigB: '#8a7090', mix: { dir: [1, 0], at: 1000, width: 700, noise: 0.8 }, density: 0.66, edge: 1, edgeW: 5, soft: 2, warp: 10, warpScale: 160, rough: 3, flow: 0.4, gran: 0.35, flood: { at: pp(113.1, 1.5), soft: 40, noise: 60 }, seed: 6 });
      W(Mk.mist, { mode: 'lift', lift: 0.45 * pp(113.4, 1.4), soft: 26, warp: 30, warpScale: 90, seed: 7 }, M.tr(26 * Math.sin(t * 0.3), 0));
      W(Mk.mist, { pig: '#e3b8c8', density: 0.3 * pp(113.4, 1.4), soft: 26, warp: 30, warpScale: 90, seed: 7 }, M.tr(26 * Math.sin(t * 0.3), 0));
      // ---- the mount, its hawthorn bent by the wind, grass moving
      W(Mk.hill, { pig: '#5d5a72', pigB: '#3f3d57', mix: { dir: [0, 1], at: 900, width: 200, noise: 1 }, density: 0.85, edge: 1.1, edgeW: 5, soft: 2, warp: 10, warpScale: 140, rough: 3, flow: 0.5, gran: 0.4, flood: { at: pp(112.6, 1.3), soft: 40, noise: 50 }, seed: 8 });
      const bend = 0.02 + 0.03 * wind;
      W(Mk.tree, { pig: '#3f3a52', pigB: '#4a3f58', mix: { dir: [1, 0], at: 600, width: 200, noise: 1 }, density: 0.9, edge: 1.1, edgeW: 3, soft: 1.5, warp: 4, warpScale: 30, rough: 3, roughScale: 9, gran: 0.5,
        flood: { at: pp(113.0, 1.4), soft: 30, noise: 30 }, wet: 0.3 + 0.4 * wind, wetAmp: 4, wetScale: 30, seed: 9 }, [1, 0, -bend, 1, bend * 796, 0]);
      W(Mk.grass, { pig: '#3f3d52', density: 0.8 * pp(113.4, 0.8), edge: 0.9, edgeW: 2, soft: 1, warp: 1, rough: 0.5, gran: 0.4,
        sway: { amp: 4 + 7 * wind, y0: -800, y1: -750, k: 1.3, omega: 2.2, wave: 1e6, phase: 0, axis: [0, -1], lean: 0.3 + 0.4 * wind, waveX: 240 }, seed: 10 });

      // ---- the two of them: she watches the sky; he is painted in beside her on "I guess"
      C.paint(eng, Mk, 'lz', { cam, t, p: pp(113.2, 1.4), wet: K.wet(t, 113.2, 114.6), sway: 3 + 4 * wind, omega: 1.5, wind: -0.3 - 0.4 * wind, seed: 7 });
      C.paint(eng, Mk, 'dc', { cam, t, p: K.pp(t, gs - 0.5, 2.4, (x) => x), wet: K.wet(t, gs - 0.5, gs + 1.9), sway: 2 + 3 * wind, omega: 1.5, wind: -0.2 - 0.3 * wind, seed: 8 });

      // ---- light: the low sun, village lights, the first stars
      Lt(Mk.glow, { colour: '#ffcf96', density: 0.34 * pp(112.7, 1.6) * (1 - 0.3 * dusk), soft: 170, warp: 30, seed: 20 }, M.tr(0, 40 * dusk));
      Lt(Mk.lights, { colour: '#ffd98a', density: 0.9 * A.ramp(t, 118, 124), soft: 2, warp: 0, seed: 21 });
      Lt(Mk.stars, { colour: '#fff4dc', density: 0.8 * A.ramp(t, 124, 132) * (0.7 + 0.3 * Math.sin(t * 3)), soft: 1.5, warp: 0, seed: 22 });

      // ---- the murmuration
      // shape weights: gathered ball, torn in two, rejoined, a long ribbon, then a heart
      const wSplit = A.keys(t, [[h1 - 0.6, 0], [h1 + 1.0, 1], [l2 - 0.5, 1], [l2 + 1.0, 0]]);
      const wRibbon = A.keys(t, [[gs - 0.4, 0], [gs + 1.2, 1], [artT - 1.6, 1], [artT - 0.4, 0]]);
      const wHeart = A.ease(t, artT - 1.4, artT + 0.8);
      const gather = A.keys(t, [[112.5, 0.2], [l1 - 0.3, 0.2], [l1 + 1.0, 1]]);
      const R = 150 + 60 * gather;
      const cx = A.keys(t, [[112.5, 1900], [l1, 1250], [h1, 1120], [l2, 1000], [gs, 1000], [artT, 790], [135, 780]]) + 60 * Math.sin(t * 0.35) * (1 - wHeart);
      const cy = A.keys(t, [[112.5, 300], [l1, 330], [h1, 300], [artT, 330], [135, 326]]) + 30 * Math.cos(t * 0.5) * (1 - wHeart);
      const rot = 0.25 * Math.sin(t * 0.3) * (1 - wHeart);
      const g = K.ink(eng, cam);
      g.fillStyle = '#f00';
      const fade = pp(113.4, 1.5);
      if (fade > 0) {
        for (let i = 0; i < N; i++) {
          const [u, v, h] = BIRDS[i];
          // ball: a slowly turning, breathing ellipse with waves of density passing through it
          const wave = 0.18 * (1 - wHeart) * Math.sin(u * 5 - t * 2.4 + h * 0.6);
          let x = (u + wave) * R * 1.6 * (1 - 0.5 * (1 - gather) * h), y = v * R * 0.75 * (1 + 0.15 * Math.sin(t * 1.3 + u * 3));
          // torn in two: each half pulls away from the other
          const side = u < 0 ? -1 : 1;
          x += wSplit * side * R * 1.6; y += wSplit * side * 40 * Math.sin(t * 1.1);
          // ribbon: an S curve across the sky
          if (wRibbon > 0) { const sx = u * R * 3.4, sy = Math.sin(u * 3.2 + t * 0.9) * R * 0.7 + v * R * 0.18; x = A.lerp(x, sx, wRibbon); y = A.lerp(y, sy, wRibbon); }
          if (wHeart > 0) { const [hx, hy] = HEART[i]; x = A.lerp(x, hx * R * 0.95, wHeart); y = A.lerp(y, hy * R * 0.95 - 10, wHeart); }
          const c = Math.cos(rot), s = Math.sin(rot);
          const calm = 1 - 0.75 * wHeart, jx = 5 * calm * Math.sin(t * (3 + h * 3) + i), jy = 4 * calm * Math.cos(t * (2.6 + h * 2) + i * 1.3);
          const X = cx + x * c - y * s + jx, Y = cy + x * s + y * c + jy;
          const beat = Math.sin(t * 22 + i * 0.7) > 0;
          g.globalAlpha = fade * (0.55 + 0.45 * h);
          g.beginPath(); g.ellipse(X, Y, beat ? 3.4 : 2.2, beat ? 1.1 : 1.7, (h - 0.5) * 0.8, 0, Math.PI * 2); g.fill();
        }
        g.globalAlpha = 1;
      }
      eng.ink({ strength: [1.5, 0.5, 1.2], seed: 17 });
    },
  };
})(window.WC = window.WC || {});
