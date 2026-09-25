// Scene: "I know my sisters think it's wrong".
// A striped Regency parlour paints itself in, and Mary, Jane, Kitty and Lydia flood onto the
// page one per beat, each from her eye. On "sisters" they lean slowly in to whisper; on "wrong"
// all four turn their backs, and a cool wash creeps in from the edges.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, F = WC.figures, C = WC.cast;
  WC.scenes = WC.scenes || {};
  const S = 212;
  const SIS = [
    { key: 'mary', x: 250, dir: 1 },
    { key: 'jane', x: 690, dir: 1 },
    { key: 'kitty', x: 1230, dir: -1 },
    { key: 'lydia', x: 1670, dir: -1 },
  ];
  const Y = 330;
  const at = (g, s, fn) => { g.save(); g.translate(s.x, Y); g.scale(s.dir, 1); fn(); g.restore(); };
  const eyeOf = (s) => [s.x + s.dir * F.lizzy.eye.iris.x * S, Y + F.lizzy.eye.iris.y * S];
  const axisOf = (s) => s.x + s.dir * 0.02 * S;

  WC.scenes.sisters = {
    build(B) {
      K.commonMasks(B);
      B.mask('wall', K.rect(-60, -60, 2040, 820), { maskScale: 0.25, margin: 60, flood: { seeds: [[-40, -40]] } });
      B.mask('stripes', (g) => { for (let x = -40; x < 1980; x += 120) g.fillRect(x, -60, 46, 820); }, { maskScale: 0.35, margin: 30, flood: { seeds: Array.from({ length: 17 }, (_, i) => [-17 + i * 120, -50]) } });
      B.mask('stripeLines', (g) => { for (let x = -40; x < 1980; x += 120) { g.fillRect(x + 56, -60, 4, 820); g.fillRect(x + 100, -60, 4, 820); } }, { maskScale: 0.6, margin: 10 });
      B.mask('dado', K.rect(-60, 752, 2040, 26), { maskScale: 0.5, margin: 20 });
      B.mask('wainscot', K.rect(-60, 776, 2040, 380), { maskScale: 0.25, margin: 40, flood: { seeds: [[960, 1100]] } });
      B.mask('panels', (g) => { for (let x = 40; x < 1920; x += 300) { g.fillRect(x, 820, 250, 200); } }, { maskScale: 0.4, margin: 20 });
      B.mask('cool', K.frame(80), { maskScale: 0.2, margin: 40, flood: { seeds: [[-60, 300], [-60, 900], [1980, 300], [1980, 900]] } });
      B.mask('window', (g) => { g.beginPath(); g.moveTo(-100, -100); g.lineTo(700, -100); g.lineTo(1500, 1180); g.lineTo(500, 1180); g.fill(); }, { maskScale: 0.2, margin: 80 });
      SIS.forEach((s) => {
        const d = P.sisters[s.key], B2 = P.sisterBust;
        B.mask(s.key, (g) => at(g, s, () => B2.body(g, S)), { maskScale: 0.8, flood: { seeds: [eyeOf(s)] } });
        B.mask(s.key + 'Hair', (g) => at(g, s, () => B2.hair(d.kind)(g, S)), { flood: { seeds: [[s.x - s.dir * 0.1 * S, Y + 0.02 * S]] } });
        if (d.kind === 'bonnet' || d.kind === 'feathers') B.mask(s.key + 'Bonnet', (g) => at(g, s, () => B2.bonnet(d.kind)(g, S)), { flood: { seeds: [[s.x + s.dir * 0.3 * S, Y - 0.1 * S]] } });
      });
      B.mask('book', (g) => at(g, SIS[0], () => P.sisterBust.book(g, S)), { margin: 20 });
      B.mask('splat', K.splat(51, 960, 380, 300, 200, 50, 6), { margin: 16 });
    },

    render(eng, Mk, t) {
      const sis = A.word(15, 'sisters'), wrong = A.word(15, 'wrong');
      const cam = K.cam(A.keys(t, [[80.7, 1.06], [86.4, 1.0]]), 960, A.keys(t, [[80.7, 520], [86.4, 540]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));

      // ---- the parlour paints itself in
      W(Mk.wall, { pig: '#eef0df', pigB: '#f3e6d2', mix: { dir: [1, 0], at: 960, width: 900, noise: 0.8 }, density: 0.55, edge: 0.3, soft: 4, warp: 20, warpScale: 240, rough: 4, flow: 0.5, flowScale: 220, gran: 0.2,
        flood: { at: K.pp(t, 80.8, 1.3), soft: 70, noise: 90, edge: 0.6 }, wet: K.wet(t, 80.8, 82.1), seed: 1 });
      W(Mk.stripes, { pig: '#c7d6bf', pigB: '#d6d9b8', mix: { dir: [0, 1], at: 300, width: 400, noise: 0.7 }, density: 0.6, edge: 1.0, edgeW: 5, soft: 1.5, warp: 4, warpScale: 200, rough: 2, flow: 0.55, flowScale: 120, gran: 0.35, dry: 0.4,
        flood: { at: K.pp(t, 81.0, 1.3), soft: 30, noise: 40 }, wet: K.wet(t, 81.0, 82.3), seed: 2 });
      W(Mk.stripeLines, { pig: '#b7c7ae', density: 0.6, edge: 0.8, soft: 1, warp: 2, warpScale: 200, rough: 1, seed: 3, reveal: { dir: [0, 1], at: -100 + 1000 * K.pp(t, 81.4, 1.0), soft: 40, noise: 20 } });
      W(Mk.dado, { pig: '#b99a6a', density: 0.8, edge: 1.2, edgeW: 3, soft: 1.2, warp: 3, rough: 1.5, seed: 4, reveal: { dir: [1, 0], at: -100 + 2200 * K.pp(t, 81.1, 0.9), soft: 40, noise: 30 } });
      W(Mk.wainscot, { pig: '#e3cfa4', pigB: '#d6bd90', mix: { dir: [0, 1], at: 900, width: 200 }, density: 0.7, edge: 0.6, soft: 2, warp: 10, rough: 3, flow: 0.5, gran: 0.35,
        flood: { at: K.pp(t, 80.9, 1.2), soft: 40, noise: 50 }, wet: K.wet(t, 80.9, 82.1), seed: 5 });
      W(Mk.panels, { pig: '#d2b98a', density: 0.45 * K.pp(t, 81.6, 0.8), edge: 1.4, edgeW: 3, soft: 1.2, warp: 3, rough: 1.5, seed: 6 });
      // their disapproval creeps in from the edges
      const cold = K.pp(t, wrong - 0.2, 1.4, A.inOut);
      if (cold > 0) W(Mk.cool, { pig: '#aab3d6', pigB: '#c1b3d6', mix: { dir: [0, 1], at: 540, width: 400, noise: 1 }, density: 0.45, soft: 20, edge: 0.8, edgeW: 20, warp: 30, warpScale: 200, flow: 0.6, flowScale: 160, gran: 0.2,
        flood: { at: 0.45 * cold, soft: 60, noise: 90, edge: 1.0, edgeW: 24 }, wet: 1, wetAmp: 14, seed: 7 });

      // ---- the sisters: each floods in from her eye, leans in to whisper, then turns away
      const bi = A.beatIndex(81.0);
      const chat = A.ease(t, sis - 0.5, sis + 0.5) * (1 - A.ease(t, wrong - 0.2, wrong + 0.4));
      const turn = A.ease(t, wrong - 0.1, wrong + 0.55);
      SIS.forEach((s, i) => {
        const d = P.sisters[s.key];
        const tb = WC.TIMING.beats[bi + 1 + i] || 81 + i;
        const p = K.pp(t, tb, 1.3), wt = K.wet(t, tb, tb + 1.3);
        if (p <= 0) return;
        const lean = (i === 1 || i === 2 ? 0.08 : 0.05) * chat * s.dir;
        const xf = M.about(s.x + 0.1 * S * s.dir, Y + 1.6 * S, lean);
        const axis = axisOf(s);
        const base = { wet: wt, time: t, morph: turn > 0 ? { amount: turn, mirror: true, axis } : null };
        const Wm = (m, o) => { let e = Object.assign({}, base, o); if (turn >= 0.5) e = C.mirrorMix(e, axis); W(m, e, xf); };
        const box = [[s.x - 1.3 * S, Y - 0.9 * S], [s.x + 1.3 * S, 1100]].map(([x, y]) => M.apply(M.mul(cam, xf), x, y));
        eng.beginGroup([box[0][0] - 20, box[0][1] - 20, box[1][0] + 20, box[1][1] + 20]);
        Wm(Mk[s.key], { pig: d.colour, pigB: d.colourB, mix: { dir: [0, 1], at: Y + 1.2 * S, width: 200, noise: 0.8 }, density: 0.9, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3, warpScale: 110, rough: 1.3, flow: 0.5, flowScale: 110, gran: 0.4,
          reveal: { dir: [0, 1], at: Y + 2.05 * S, soft: 70, noise: 40 }, flood: C.fl(p, 0, 0.75), seed: 10 + i });
        Wm(Mk[s.key + 'Hair'], { pig: d.hair, pigB: d.hairB, mix: { dir: [s.dir, 0.3], at: s.dir * s.x + 0.3 * Y, width: 80, noise: 0.8 }, density: 1.0, edge: 1.1, edgeW: 4, soft: 1.1, warp: 2.5, rough: 1.6, roughScale: 6, flow: 0.45, gran: 0.55,
          flood: C.fl(p, 0.25, 0.85), seed: 20 + i });
        if (Mk[s.key + 'Bonnet']) {
          Wm(Mk[s.key + 'Bonnet'], { mode: 'lift', lift: 0.9, soft: 1.2, flood: C.fl(p, 0.45, 1), seed: 30 + i });
          Wm(Mk[s.key + 'Bonnet'], { pig: d.bonnet, pigB: '#e5b8a8', mix: { dir: [0, 1], at: Y + 40, width: 80, noise: 0.7 }, density: 0.9, edge: 1.5, edgeW: 3, soft: 1.1, warp: 2, rough: 1, flow: 0.4, gran: 0.35, flood: C.fl(p, 0.45, 1), seed: 30 + i });
        }
        if (s.key === 'mary') Wm(Mk.book, { pig: '#5f7a55', density: 1.0 * A.ramp(p, 0.6, 1), edge: 1.3, edgeW: 3, seed: 40 });
        eng.endGroup(0.92);
      });
      if (chat > 0) W(Mk.splat, { pig: '#c9a0c8', density: 0.8, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 41, radial: { x: 960, y: 380, r: 380 * chat, soft: 30 }, alpha: 1 - cold });

      // ---- light: afternoon light slanting through a window
      Lt(Mk.window, { colour: '#fff0d0', density: 0.16 * K.pp(t, 81.2, 1.2) * (1 - 0.6 * cold), soft: 120, warp: 30, streak: { angle: 1.1, amt: 0.5, len: 200 }, seed: 50 });

      // ---- ink: their eyes, Mary's spectacles, the whispers
      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      SIS.forEach((s, i) => {
        const tb = WC.TIMING.beats[bi + 1 + i] || 81 + i;
        if (t < tb + 0.4 || (turn > 0.05 && turn < 0.95)) return;
        const lean = (i === 1 || i === 2 ? 0.08 : 0.05) * chat * s.dir;
        const flip = turn > 0.5 ? [-1, 0, 0, 1, 2 * axisOf(s), 0] : [1, 0, 0, 1, 0, 0];
        K.withXf(g, M.mul(M.about(s.x + 0.1 * S * s.dir, Y + 1.6 * S, lean), flip), () => at(g, s, () => {
          const blink = (t + i * 0.7) % 3.1 < 0.13;
          if (blink) F.inkEyeClosed(g, F.lizzy.eye, S); else C.eye(g, F.lizzy.eye, S, A.ramp(t, tb + 0.4, tb + 0.9));
          if (s.key === 'mary') { g.lineWidth = 2; g.beginPath(); g.arc(0.40 * S, 0.50 * S, 0.05 * S, 0, 7); g.stroke(); }
        }));
      });
      if (chat > 0.05) {
        g.lineWidth = 2; g.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const p = A.ramp(t, sis + k * 0.35, sis + k * 0.35 + 0.5);
          if (p <= 0) continue;
          g.globalAlpha = chat;
          g.beginPath();
          for (let j = 0; j <= 30 * p; j++) { const u = j / 30, x = 870 + 180 * u, y = 380 + k * 38 + Math.sin(u * 18 + k + t * 3) * 9; j ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.stroke();
          g.globalAlpha = 1;
        }
      }
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 9 });
    },
  };
})(window.WC = window.WC || {});
