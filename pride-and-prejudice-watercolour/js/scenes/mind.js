// Scene: On My Mind (verse 1, lines 3-5).
// "When he's the one that's on my mind": Elizabeth's silhouette becomes a window onto a sunset
// landscape, and there, tiny on the hilltop, stands Darcy. "And in my heart": a rose heart
// blooms on her chest. "But I don't know if that's a crime": an indigo drop falls into it.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, F = WC.figures, P = WC.people;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 560, y: 175, s: 500 };
  const HEART = [655, 1010];
  const inLizzy = (g, fn) => { g.save(); g.translate(LZ.x, LZ.y); fn(); g.restore(); };
  const clipLizzy = (g) => { g.beginPath(); WC.spline(g, F.lizzyBody, true, LZ.s, LZ.x, LZ.y); g.clip(); };
  const hill = (pts) => (g) => { g.save(); clipLizzy(g); g.beginPath(); WC.spline(g, pts, false, 1); g.lineTo(1400, 1500); g.lineTo(-200, 1500); g.closePath(); g.fill(); g.restore(); };

  WC.scenes.mind = {
    build(B) {
      const L = F.lizzy;
      B.mask('bg', K.rect(30, 26, 1860, 1400), { maskScale: 0.25, margin: 80 });
      B.mask('glow', (g) => { g.beginPath(); g.ellipse(600, 380, 420, 360, -0.2, 0, 7); g.fill(); }, { maskScale: 0.35, margin: 140 });
      B.mask('strokeR', (g) => { WC.brushStroke(g, [[1200, 180], [1500, 120], [1760, 240], [1820, 520]], 130); WC.brushStroke(g, [[1250, 780], [1550, 700], [1790, 820]], 90); }, { maskScale: 0.4, margin: 80 });
      B.mask('sky', (g) => inLizzy(g, () => L.body(g, LZ.s)), { maskScale: 0.6 });
      B.mask('sun', (g) => WC.fillCircle(g, 690, 552, 44), { maskScale: 0.8, margin: 60 });
      B.mask('hillFar', hill([[-200, 580], [300, 560], [470, 548], [640, 572], [860, 556], [1400, 570]]), { maskScale: 0.6 });
      B.mask('hillMid', hill([[-200, 640], [360, 624], [560, 606], [700, 628], [900, 650], [1400, 660]]), { maskScale: 0.6 });
      B.mask('hillNear', hill([[-200, 760], [300, 700], [520, 690], [760, 740], [1000, 800], [1400, 820]]), { maskScale: 0.5 });
      B.mask('field', hill([[-200, 900], [400, 860], [800, 900], [1400, 960]]), { maskScale: 0.5 });
      B.mask('mist', (g) => { g.save(); clipLizzy(g); g.beginPath(); g.ellipse(560, 600, 260, 22, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(700, 675, 220, 16, 0, 0, 7); g.fill(); g.restore(); }, { maskScale: 0.6, margin: 40 });
      B.mask('house', (g) => { g.save(); clipLizzy(g); WC.props.pemberley(g, 440, 560, 110); g.restore(); }, { margin: 20 });
      B.mask('houseWin', (g) => { g.save(); clipLizzy(g); WC.props.pemberleyWindows(g, 440, 560, 110); g.restore(); }, { margin: 10, maskScale: 2 });
      B.mask('hair', (g) => inLizzy(g, () => L.hair(g, LZ.s, WC.rng(7))));
      B.mask('hairLights', (g) => inLizzy(g, () => L.hairLights(g, LZ.s)), { margin: 30 });
      B.mask('ribbon', (g) => inLizzy(g, () => L.ribbon(g, LZ.s)));
      B.mask('flower', (g) => inLizzy(g, () => L.flowerPetals(g, LZ.s)), { margin: 30 });
      B.mask('flowerHeart', (g) => inLizzy(g, () => L.flowerHeart(g, LZ.s)), { margin: 20 });
      B.mask('lips', (g) => inLizzy(g, () => L.lips(g, LZ.s)), { margin: 30 });
      B.mask('rim', (g) => { g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath(); WC.spline(g, F.lizzyBody, true, LZ.s, LZ.x, LZ.y); g.stroke(); }, { maskScale: 0.8, margin: 30 });
      B.box('heart', (g) => { g.fill(WC.heartPath(new Path2D(), 0, 0, 120)); }, { x: -140, y: -140, w: 280, h: 260 }, { margin: 60 });
      B.box('drop', (g) => { g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(12, -8, 16, 4, 0, 16); g.bezierCurveTo(-16, 4, -12, -8, 0, -30); g.fill(); }, { x: -20, y: -34, w: 40, h: 54 }, { margin: 20, maskScale: 2 });
      B.mask('splash', K.splat(31, HEART[0], HEART[1] - 20, 150, 110, 40, 7), { margin: 16 });
      B.puppet('dc', P.darcy, 60);
      K.petalMask(B);
    },

    render(eng, Mk, t) {
      const heartT = A.word(3, 'heart'), knowT = A.word(4, 'know'), crimeT = A.word(4, 'crime');
      const z = A.keys(t, [[12.95, 1.08], [19.0, 1.16], [20.8, 1.12], [26.6, 1.12], [28.2, 1.22], [30.2, 1.26]]);
      const c = A.keys(t, [[12.95, [720, 470]], [19.0, [720, 460]], [20.8, [700, 850]], [26.6, [700, 860]], [28.2, [690, 900]], [30.2, [690, 900]]]);
      const cam = K.cam(z, c[0], c[1]);
      const W = K.painter(eng, cam);

      W(Mk.bg, { pig: '#efe3e6', pigB: '#e0e2ea', mix: { dir: [1, 0.3], at: 1100, width: 500, noise: 0.9, noiseScale: 260 }, density: 0.45, edge: 0.4, edgeW: 14, soft: 3, warp: 24, warpScale: 260, rough: 6, roughScale: 30, flow: 0.5, flowScale: 220, gran: 0.2, dry: 0.4, seed: 1 });
      W(Mk.glow, { pig: '#f6d3a8', pigB: '#f0b7c2', mix: { dir: [1, 0.4], at: 700, width: 260, noise: 0.8 }, density: 0.55, soft: 60, edge: 0.1, warp: 50, warpScale: 200, flow: 0.7, flowScale: 90, seed: 2 });
      W(Mk.strokeR, { pig: '#e9b8c8', pigB: '#c3c3e0', mix: { dir: [1, 0.5], at: 1500, width: 260, noise: 0.9 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9, seed: 3 });

      // the landscape inside her silhouette paints itself in from the horizon
      const paintIn = A.ease(t, 13.2, 17.3, A.out);
      const rv = (d) => ({ x: 690, y: 560, r: -60 + 1600 * A.clamp(paintIn * 1.15 - d), soft: 70 });
      W(Mk.sky, { pig: '#f6bf7e', pigB: '#cf8db8', mix: { dir: [0, -1], at: -540, width: 260, noise: 0.8, noiseScale: 180 }, density: 1.0, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3, warpScale: 130, rough: 1.3, flow: 0.6, flowScale: 120, gran: 0.35, seed: 4,
        radial: { x: 690, y: 560, r: 300 + 1600 * paintIn, soft: 90 } });
      W(Mk.sun, { pig: '#f7d98c', pigB: '#f2b98a', mix: { dir: [0, 1], at: 552, width: 30 }, density: 0.8, soft: 10, edge: 0.6, warp: 4, seed: 5, alpha: paintIn }, M.tr(0, -18 * A.ramp(t, 13, 30)));
      W(Mk.hillFar, { pig: '#b5b3d6', density: 0.7, edge: 1.2, edgeW: 4, soft: 1.3, warp: 6, warpScale: 120, rough: 2, flow: 0.5, gran: 0.4, seed: 6, radial: rv(0.05) });
      W(Mk.house, { pig: '#9c98b8', density: 0.7, edge: 1.3, edgeW: 2, soft: 0.9, warp: 1, rough: 0.6, seed: 7, radial: rv(0.1) });
      W(Mk.houseWin, { mode: 'lift', lift: 0.6, soft: 0.8, warp: 0.4, rough: 0.2, seed: 8, radial: rv(0.1) });
      W(Mk.mist, { mode: 'lift', lift: 0.45, soft: 14, warp: 16, warpScale: 70, seed: 9, radial: rv(0.12) });
      W(Mk.hillMid, { pig: '#c98fae', pigB: '#b27fa6', mix: { dir: [1, 0], at: 600, width: 300 }, density: 0.8, edge: 1.2, edgeW: 4, soft: 1.3, warp: 6, warpScale: 120, rough: 2, flow: 0.55, gran: 0.45, seed: 10, radial: rv(0.15) });
      W(Mk.hillNear, { pig: '#b87196', pigB: '#a06a92', mix: { dir: [1, 0.2], at: 600, width: 300 }, density: 0.7, edge: 1.2, edgeW: 5, soft: 1.3, warp: 8, warpScale: 140, rough: 2.4, flow: 0.6, gran: 0.5, seed: 11, radial: rv(0.2) });
      W(Mk.field, { pig: '#b58aa8', pigB: '#9a86b4', mix: { dir: [0, 1], at: 1100, width: 300 }, density: 0.6, edge: 1.0, edgeW: 6, soft: 2, warp: 10, warpScale: 160, rough: 3, flow: 0.65, flowScale: 140, gran: 0.55, seed: 12, radial: rv(0.25) });
      W(Mk.rim, { pig: '#d98fa6', density: 0.5, soft: 3, edge: 0.4, warp: 3, warpScale: 130, rough: 1.3, seed: 13, alpha: paintIn });

      // tiny Darcy on the hill, painted in on "on my mind"
      const mindT = A.word(2, 'mind');
      const dIn = A.ease(t, mindT - 0.9, mindT + 0.3, A.out);
      if (dIn > 0) {
        const walk = A.ramp(t, mindT + 0.4, 19.4);
        const ph = walk * Math.PI * 2 * 3.2;
        const x = 598 + 26 * walk, y = 610 + P.darcy.walkY(ph, 7) * (walk > 0 && walk < 1 ? 1 : 0);
        const pose = walk > 0 && walk < 1 ? P.darcy.poses.walk(t, ph) : P.darcy.poses.stand(t);
        P.darcy.paint(eng, Mk.dc, P.root(x, y, 7.5, 1, 60, P.darcy.groundH), pose, { cam, alpha: dIn, simple: true, style: { coat: '#39406a', coatB: '#2f3656', face: '#4d5a86', faceB: '#39406a', legs: '#56648f', far: '#2f3656', hair: '#1f2440', hairB: '#2a2440' } });
      }

      // her hair, ribbon, flower, lips on top of the landscape
      W(Mk.lips, { pig: '#c9506c', density: 0.5, soft: 1.2, edge: 1.1, edgeW: 3, warp: 1.2, warpScale: 40, rough: 0.6, seed: 14 });
      W(Mk.hair, { pig: '#9e4b52', pigB: '#6d3b35', mix: { dir: [-1, 0.2], at: -280, width: 180, noise: 0.9 }, density: 1.05, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, rough: 1.8, roughScale: 7, flow: 0.45, gran: 0.55, seed: 15 });
      W(Mk.hairLights, { mode: 'lift', lift: 0.5, soft: 2.5, warp: 2, rough: 1.4, seed: 16 });
      W(Mk.ribbon, { mode: 'lift', lift: 0.85, soft: 1.2, seed: 17 });
      W(Mk.ribbon, { pig: '#6fb0a8', pigB: '#4f8f96', mix: { dir: [-1, 0.5], at: -100, width: 120, noise: 0.6 }, density: 1.0, edge: 1.3, edgeW: 4, warp: 2, warpScale: 70, rough: 1, flow: 0.4, gran: 0.4, seed: 17 });
      W(Mk.flower, { mode: 'lift', lift: 0.85, soft: 1, seed: 18 });
      W(Mk.flower, { pig: '#f4d3da', density: 0.8, edge: 1.6, edgeW: 3, warp: 1.5, warpScale: 40, rough: 0.8, seed: 18 });
      W(Mk.flowerHeart, { pig: '#e9c46a', pigB: '#b9773a', mix: { dir: [1, 1], at: 0, width: 10, noise: 0.3 }, density: 1.1, edge: 1.2, edgeW: 3, gran: 0.9, seed: 19 });

      // the heart
      const hg = A.ease(t, heartT - 0.25, heartT + 0.9, A.out);
      const hx = M.tr(HEART[0], HEART[1]);
      if (hg > 0) {
        W(Mk.heart, { mode: 'lift', lift: 0.85, soft: 2, warp: 6, warpScale: 60, rough: 2, roughScale: 10, seed: 20, radial: { x: 0, y: 0, r: 200 * hg, soft: 24 }, grow: -20 + 20 * hg }, hx);
        W(Mk.heart, { pig: '#ef6f8e', pigB: '#d94a72', mix: { dir: [0, 1], at: 0, width: 80, noise: 0.8 }, density: 1.0, edge: 1.4, edgeW: 6, soft: 1.3, warp: 6, warpScale: 60, rough: 2, roughScale: 10, flow: 0.6, flowScale: 50, gran: 0.4, seed: 20,
          radial: { x: 0, y: 0, r: 200 * hg, soft: 24 }, grow: -20 + 20 * hg }, hx);
        const pulse = A.pulse(t, 0.2) * A.ramp(t, heartT + 1, heartT + 1.5) * (1 - A.ramp(t, knowT - 0.5, knowT));
        if (pulse > 0.02) W(Mk.heart, { pig: '#f08aa2', density: 0.35 * pulse, soft: 16, edge: 0, warp: 10, seed: 21, grow: 18 * pulse }, hx);
      }
      // the drop falls and spreads indigo through the heart
      const fall = A.ramp(t, knowT - 0.45, knowT);
      if (fall > 0 && fall < 1) W(Mk.drop, { pig: '#4a5a90', density: 1.1, edge: 1.2, edgeW: 2, warp: 1, rough: 0.4, seed: 22 }, M.tr(HEART[0] + 10, A.lerp(700, HEART[1] - 30, fall * fall)));
      const spread = A.ease(t, knowT, crimeT + 0.6, A.out);
      if (spread > 0) {
        W(Mk.splash, { pig: '#5d6b99', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 23, radial: { x: HEART[0], y: HEART[1] - 20, r: 30 + 200 * A.ease(t, knowT, knowT + 0.3, A.out), soft: 20 } });
        W(Mk.heart, { pig: '#6b6fb0', pigB: '#8a6bb0', mix: { dir: [1, 1], at: 0, width: 90, noise: 1 }, density: 0.85, edge: 1.2, edgeW: 5, soft: 2, warp: 10, warpScale: 50, rough: 3, roughScale: 9, flow: 0.8, flowScale: 40, gran: 0.6, seed: 24,
          radial: { x: 10, y: -30, r: 10 + 210 * spread, soft: 30 } }, hx);
      }
      // a few petals drifting across the page
      K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 13.2, [1300, 150], [1500, 900], 5, (i) => i % 2 === 0, 5, { stagger: 2.4, dur: 6, life: 12, arc: 80 }));

      // ink: eye, birds, the question mark
      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      const blink = [16.0, 23.2].some((b) => t > b && t < b + 0.14);
      inLizzy(g, () => (blink ? F.inkEyeClosed(g, F.lizzy.eye, LZ.s) : F.inkEye(g, F.lizzy.eye, LZ.s)));
      g.lineWidth = 1.6; g.lineCap = 'round';
      if (paintIn > 0.6) {
        [[520, 420], [575, 395], [640, 440]].forEach(([bx, by], i) => {
          const f = Math.sin(t * 7 + i * 2) * 5, x = bx + (t - 13) * 6 + i * 3, y = by;
          g.beginPath(); g.moveTo(x - 10, y - 3 - f); g.quadraticCurveTo(x - 4, y - 7, x, y); g.quadraticCurveTo(x + 4, y - 7, x + 10, y - 3 - f); g.stroke();
        });
      }
      K.writeText(g, '?', 845, 1080, `210px ${K.FONT_SCRIPT}`, A.ramp(t, crimeT - 0.1, crimeT + 0.5), 'left', '#f00');
      // pencil: ruled profile line
      g.strokeStyle = '#0f0'; g.lineWidth = 1;
      inLizzy(g, () => { const q = WC.sampleSpline(F.lizzyBody.slice(0, 24), false, LZ.s, 8); g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x + 8, y - 4) : g.moveTo(x + 8, y - 4))); g.stroke(); });
      eng.ink({ strength: [1.7, 0.5, 1.2], seed: 4 });
    },
  };
})(window.WC = window.WC || {});
