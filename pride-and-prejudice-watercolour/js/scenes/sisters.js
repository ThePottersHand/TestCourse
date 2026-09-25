// Scene: "I know my sisters think it's wrong".
// The Longbourn parlour: four oval silhouette portraits of Mary, Jane, Kitty and Lydia hang on
// the striped wall, painted in one per beat. On "sisters" they swing toward each other on their
// nails as if to whisper; on "wrong" they all swing hard, and a chill creeps in from the edges.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, C = WC.cast;
  WC.scenes = WC.scenes || {};
  const RX = 150, RY = 190, BAND = 26;
  const SIS = [
    { key: 'mary', x: 330, dir: 1 },
    { key: 'jane', x: 750, dir: 1 },
    { key: 'kitty', x: 1170, dir: -1 },
    { key: 'lydia', x: 1590, dir: -1 },
  ];
  const Y = 440;
  const nail = (s) => [s.x, Y - RY - 70];
  const oval = (g, s, grow = 0) => { g.beginPath(); g.ellipse(s.x, Y, RX + grow, RY + grow, 0, 0, Math.PI * 2); };

  WC.scenes.sisters = {
    build(B) {
      K.commonMasks(B);
      B.mask('wall', K.rect(-60, -60, 2040, 860), { maskScale: 0.25, margin: 60, flood: { seeds: [[-40, -40]] } });
      B.mask('stripes', (g) => { for (let x = -40; x < 1980; x += 120) g.fillRect(x, -60, 46, 860); }, { maskScale: 0.35, margin: 30, flood: { seeds: Array.from({ length: 17 }, (_, i) => [-17 + i * 120, -50]) } });
      B.mask('stripeLines', (g) => { for (let x = -40; x < 1980; x += 120) { g.fillRect(x + 56, -60, 4, 860); g.fillRect(x + 100, -60, 4, 860); } }, { maskScale: 0.6, margin: 10 });
      B.mask('dado', K.rect(-60, 792, 2040, 26), { maskScale: 0.5, margin: 20 });
      B.mask('wainscot', K.rect(-60, 816, 2040, 380), { maskScale: 0.25, margin: 40, flood: { seeds: [[960, 1100]] } });
      B.mask('panels', (g) => { for (let x = 40; x < 1920; x += 300) g.fillRect(x, 860, 250, 180); }, { maskScale: 0.4, margin: 20 });
      B.mask('cool', K.frame(80), { maskScale: 0.2, margin: 40, flood: { seeds: [[-60, 300], [-60, 900], [1980, 300], [1980, 900]] } });
      B.mask('window', (g) => { g.beginPath(); g.moveTo(-100, -100); g.lineTo(700, -100); g.lineTo(1500, 1180); g.lineTo(500, 1180); g.fill(); }, { maskScale: 0.2, margin: 80 });
      SIS.forEach((s) => {
        B.mask(s.key + 'Shadow', (g) => { g.beginPath(); g.ellipse(s.x + 14, Y + 18, RX + 6, RY + 6, 0, 0, 7); g.fill(); }, { maskScale: 0.4, margin: 50 });
        B.mask(s.key + 'Ground', (g) => { oval(g, s, -BAND + 4); g.fill(); }, { maskScale: 0.5, margin: 20, flood: { seeds: [[s.x, Y - RY + BAND]] } });
        B.mask(s.key + 'Frame', (g) => { g.beginPath(); g.ellipse(s.x, Y, RX, RY, 0, 0, 7); g.ellipse(s.x, Y, RX - BAND, RY - BAND, 0, 0, 7); g.fill('evenodd'); }, { maskScale: 0.6, margin: 20, flood: { seeds: [[s.x, Y - RY + BAND / 2]] } });
        C.bust(B, s.key, { kind: s.key, x: s.x - s.dir * 22, y: Y - 172, s: 150, dir: s.dir, clip: (g) => { oval(g, s, -BAND + 2); g.clip(); } });
      });
      B.mask('splat', K.splat(51, 960, 420, 300, 200, 50, 6), { margin: 16 });
    },

    render(eng, Mk, t) {
      const sis = A.word(15, 'sisters'), wrong = A.word(15, 'wrong');
      const cam = K.cam(A.keys(t, [[80.7, 1.06], [86.4, 1.0]]), 960, A.keys(t, [[80.7, 500], [86.4, 520]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => K.pp(t, a, d);

      // ---- the parlour paints itself in
      W(Mk.wall, { pig: '#eef0df', pigB: '#f3e6d2', mix: { dir: [1, 0], at: 960, width: 900, noise: 0.8 }, density: 0.55, edge: 0.3, soft: 4, warp: 20, warpScale: 240, rough: 4, flow: 0.5, flowScale: 220, gran: 0.2,
        flood: { at: pp(80.8, 1.3), soft: 70, noise: 90, edge: 0.6 }, wet: K.wet(t, 80.8, 82.1), seed: 1 });
      W(Mk.stripes, { pig: '#c7d6bf', pigB: '#d6d9b8', mix: { dir: [0, 1], at: 300, width: 400, noise: 0.7 }, density: 0.6, edge: 1.0, edgeW: 5, soft: 1.5, warp: 4, warpScale: 200, rough: 2, flow: 0.55, flowScale: 120, gran: 0.35, dry: 0.4,
        flood: { at: pp(81.0, 1.3), soft: 30, noise: 40 }, wet: K.wet(t, 81.0, 82.3), seed: 2 });
      W(Mk.stripeLines, { pig: '#b7c7ae', density: 0.6, edge: 0.8, soft: 1, warp: 2, warpScale: 200, rough: 1, seed: 3, reveal: { dir: [0, 1], at: -100 + 1000 * pp(81.4, 1.0), soft: 40, noise: 20 } });
      W(Mk.dado, { pig: '#b99a6a', density: 0.8, edge: 1.2, edgeW: 3, soft: 1.2, warp: 3, rough: 1.5, seed: 4, reveal: { dir: [1, 0], at: -100 + 2200 * pp(81.1, 0.9), soft: 40, noise: 30 } });
      W(Mk.wainscot, { pig: '#e3cfa4', pigB: '#d6bd90', mix: { dir: [0, 1], at: 940, width: 200 }, density: 0.7, edge: 0.6, soft: 2, warp: 10, rough: 3, flow: 0.5, gran: 0.35,
        flood: { at: pp(80.9, 1.2), soft: 40, noise: 50 }, wet: K.wet(t, 80.9, 82.1), seed: 5 });
      W(Mk.panels, { pig: '#d2b98a', density: 0.45 * pp(81.6, 0.8), edge: 1.4, edgeW: 3, soft: 1.2, warp: 3, rough: 1.5, seed: 6 });
      const cold = K.pp(t, wrong - 0.2, 1.4, A.inOut);
      if (cold > 0) W(Mk.cool, { pig: '#aab3d6', pigB: '#c1b3d6', mix: { dir: [0, 1], at: 540, width: 400, noise: 1 }, density: 0.45, soft: 20, edge: 0.8, edgeW: 20, warp: 30, warpScale: 200, flow: 0.6, flowScale: 160, gran: 0.2,
        flood: { at: 0.45 * cold, soft: 60, noise: 90, edge: 1.0, edgeW: 24 }, wet: 1, wetAmp: 14, seed: 7 });

      // ---- the portraits: painted in one per beat, swinging on their nails
      const bi = A.beatIndex(81.0);
      const swing = (u, amp, k) => (u < 0 ? 0 : amp * Math.exp(-u * 1.8) * Math.sin(u * 5.2 + k));
      const hang = [];
      SIS.forEach((s, i) => {
        const tb = WC.TIMING.beats[bi + 1 + i] || 81 + i * 0.55;
        const p = K.pp(t, tb, 1.2);
        const toward = s.dir;                       // lean toward the middle of the row
        const th = 0.07 * toward * A.ease(t, sis - 0.3, sis + 0.8) * (1 - A.ease(t, wrong - 0.2, wrong + 0.3))
          + swing(t - (sis - 0.2), 0.05 * toward, 0) + swing(t - (wrong - 0.05), 0.2 * (i % 2 ? 1 : -1), i) + 0.02 * toward * A.ease(t, wrong + 0.4, 86);
        const [nx, ny] = nail(s), xf = M.about(nx, ny, th);
        hang.push({ s, xf, p, tb });
        if (p <= 0) return;
        W(Mk[s.key + 'Shadow'], { pig: '#9aa08e', density: 0.35 * p, soft: 18, edge: 0.2, warp: 8, seed: 20 + i }, xf);
        W(Mk[s.key + 'Ground'], { mode: 'lift', lift: 0.85, soft: 2, warp: 3, rough: 1, flood: C.fl(p, 0, 0.6), seed: 30 + i }, xf);
        W(Mk[s.key + 'Ground'], { pig: '#f4ead6', pigB: '#ead9c0', mix: { dir: [0, 1], at: Y, width: RY, noise: 0.6 }, density: 0.4, soft: 2, edge: 0.6, edgeW: 6, warp: 3, rough: 1, flood: C.fl(p, 0, 0.6), seed: 30 + i }, xf);
        C.paintBust(eng, Mk, s.key, { cam, xf, t, p: A.ramp(p, 0.25, 1), wet: K.wet(t, tb, tb + 1.2), fadeBottom: Y + RY + 40, lift: 0 });
        W(Mk[s.key + 'Frame'], { pig: '#dcae57', pigB: '#b9773a', mix: { dir: [0.6, 0.8], at: s.x + Y, width: 200, noise: 0.9, noiseScale: 70 }, density: 1.0, edge: 1.3, edgeW: 4, warp: 2, warpScale: 70, rough: 1.2, flow: 0.5, flowScale: 60, gran: 0.6,
          flood: C.fl(p, 0, 0.9, { soft: 14, noise: 14 }), seed: 40 + i }, xf);
      });
      const chat = A.ease(t, sis - 0.5, sis + 0.5) * (1 - A.ease(t, wrong - 0.2, wrong + 0.4));
      if (chat > 0) W(Mk.splat, { pig: '#c9a0c8', density: 0.8, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 50, radial: { x: 960, y: 420, r: 380 * chat, soft: 30 }, alpha: 1 - cold });

      // ---- light: afternoon light slanting across the wall; a glint on each frame as it swings
      Lt(Mk.window, { colour: '#fff0d0', density: 0.16 * pp(81.2, 1.2) * (1 - 0.6 * cold), soft: 120, warp: 30, streak: { angle: 1.1, amt: 0.5, len: 200 }, seed: 60 });
      hang.forEach(({ s, xf, p }, i) => {
        if (p < 1) return;
        const q = M.apply(xf, s.x - s.dir * RX * 0.6, Y - RY * 0.72);
        K.glint(eng, cam, Mk.star, q[0], q[1], t, wrong + 0.1 + i * 0.12, 0.8, 26, '#fff4d8');
      });

      // ---- ink: the nails and hanging cords, the whispers
      const g = K.ink(eng, cam);
      g.strokeStyle = g.fillStyle = '#f00'; g.lineWidth = 1.6; g.lineCap = 'round';
      hang.forEach(({ s, xf, p }) => {
        if (p <= 0) return;
        const [nx, ny] = nail(s), a = M.apply(xf, s.x - 60, Y - RY + 26), b = M.apply(xf, s.x + 60, Y - RY + 26);
        g.globalAlpha = A.clamp(p * 2);
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(nx, ny); g.lineTo(b[0], b[1]); g.stroke();
        WC.fillCircle(g, nx, ny, 4);
        g.globalAlpha = 1;
      });
      if (chat > 0.05) {
        g.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          const p = A.ramp(t, sis + k * 0.35, sis + k * 0.35 + 0.5);
          if (p <= 0) continue;
          g.globalAlpha = chat;
          g.beginPath();
          for (let j = 0; j <= 30 * p; j++) { const u = j / 30, x = 870 + 180 * u, y = 400 + k * 38 + Math.sin(u * 18 + k + t * 3) * 9; j ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.stroke();
          g.globalAlpha = 1;
        }
      }
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 9 });
    },
  };
})(window.WC = window.WC || {});
