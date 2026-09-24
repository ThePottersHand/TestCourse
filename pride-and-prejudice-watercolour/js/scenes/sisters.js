// Scene: "I know my sisters think it's wrong".
// Jane, Mary, Kitty and Lydia as four silhouette busts against striped Regency wallpaper,
// leaning in to gossip on the beat, then all shaking their heads on "wrong".
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, F = WC.figures;
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

  WC.scenes.sisters = {
    build(B) {
      B.mask('wall', K.rect(-60, -60, 2040, 820), { maskScale: 0.25, margin: 60 });
      B.mask('stripes', (g) => { for (let x = -40; x < 1980; x += 120) g.fillRect(x, -60, 46, 820); }, { maskScale: 0.35, margin: 30 });
      B.mask('stripeLines', (g) => { for (let x = -40; x < 1980; x += 120) { g.fillRect(x + 56, -60, 4, 820); g.fillRect(x + 100, -60, 4, 820); } }, { maskScale: 0.6, margin: 10 });
      B.mask('dado', K.rect(-60, 752, 2040, 26), { maskScale: 0.5, margin: 20 });
      B.mask('wainscot', K.rect(-60, 776, 2040, 380), { maskScale: 0.25, margin: 40 });
      B.mask('panels', (g) => { for (let x = 40; x < 1920; x += 300) { g.fillRect(x, 820, 250, 200); } }, { maskScale: 0.4, margin: 20 });
      SIS.forEach((s) => {
        const d = P.sisters[s.key], B2 = P.sisterBust;
        B.mask(s.key, (g) => at(g, s, () => B2.body(g, S)), { maskScale: 0.8 });
        B.mask(s.key + 'Hair', (g) => at(g, s, () => B2.hair(d.kind)(g, S)));
        if (d.kind === 'bonnet' || d.kind === 'feathers') B.mask(s.key + 'Bonnet', (g) => at(g, s, () => B2.bonnet(d.kind)(g, S)));
      });
      B.mask('book', (g) => at(g, SIS[0], () => P.sisterBust.book(g, S)), { margin: 20 });
      B.mask('splat', K.splat(51, 960, 380, 300, 200, 50, 6), { margin: 16 });
    },

    render(eng, Mk, t) {
      const sis = A.word(15, 'sisters'), wrong = A.word(15, 'wrong');
      const cam = K.cam(A.keys(t, [[80.7, 1.06], [86.4, 1.0]]), 960, A.keys(t, [[80.7, 520], [86.4, 540]]));
      const W = K.painter(eng, cam);
      W(Mk.wall, { pig: '#eef0df', pigB: '#f3e6d2', mix: { dir: [1, 0], at: 960, width: 900, noise: 0.8 }, density: 0.55, edge: 0.3, soft: 4, warp: 20, warpScale: 240, rough: 4, flow: 0.5, flowScale: 220, gran: 0.2, seed: 1 });
      W(Mk.stripes, { pig: '#c7d6bf', pigB: '#d6d9b8', mix: { dir: [0, 1], at: 300, width: 400, noise: 0.7 }, density: 0.6, edge: 1.0, edgeW: 5, soft: 1.5, warp: 4, warpScale: 200, rough: 2, flow: 0.55, flowScale: 120, gran: 0.35, dry: 0.4, seed: 2 });
      W(Mk.stripeLines, { pig: '#b7c7ae', density: 0.6, edge: 0.8, soft: 1, warp: 2, warpScale: 200, rough: 1, seed: 3 });
      W(Mk.dado, { pig: '#b99a6a', density: 0.8, edge: 1.2, edgeW: 3, soft: 1.2, warp: 3, rough: 1.5, seed: 4 });
      W(Mk.wainscot, { pig: '#e3cfa4', pigB: '#d6bd90', mix: { dir: [0, 1], at: 900, width: 200 }, density: 0.7, edge: 0.6, soft: 2, warp: 10, rough: 3, flow: 0.5, gran: 0.35, seed: 5 });
      W(Mk.panels, { pig: '#d2b98a', density: 0.45, edge: 1.4, edgeW: 3, soft: 1.2, warp: 3, rough: 1.5, seed: 6 });
      const chat = A.ease(t, sis - 0.4, sis + 0.3);
      const shakeK = t > wrong - 0.05 ? Math.exp(-(t - wrong) * 2.2) : 0;
      SIS.forEach((s, i) => {
        const d = P.sisters[s.key];
        const bob = 0.035 * A.pulse(t + i * 0.11, 0.2) * (i % 2 ? 1 : -1);
        const lean = (i === 1 || i === 2 ? 0.09 : 0.05) * chat;
        const shake = 0.07 * Math.sin((t - wrong) * 26 + i) * shakeK;
        const rot = (bob + lean + shake) * s.dir;
        const piv = [s.x + 0.1 * S * s.dir, Y + 1.6 * S];
        const xf = M.about(piv[0], piv[1], rot);
        eng.beginGroup([s.x - 1.2 * S, Y - 0.9 * S, s.x + 1.2 * S, 1100]);
        W(Mk[s.key], { pig: d.colour, pigB: d.colourB, mix: { dir: [0, 1], at: Y + 1.2 * S, width: 200, noise: 0.8 }, density: 0.9, edge: 1.3, edgeW: 5, soft: 1.1, warp: 3, warpScale: 110, rough: 1.3, flow: 0.5, flowScale: 110, gran: 0.4,
          reveal: { dir: [0, 1], at: Y + 2.05 * S, soft: 70, noise: 40 }, seed: 10 + i }, xf);
        W(Mk[s.key + 'Hair'], { pig: d.hair, pigB: d.hairB, mix: { dir: [1, 0.3], at: s.x, width: 80, noise: 0.8 }, density: 1.0, edge: 1.1, edgeW: 4, soft: 1.1, warp: 2.5, rough: 1.6, roughScale: 6, flow: 0.45, gran: 0.55, seed: 20 + i }, xf);
        if (Mk[s.key + 'Bonnet']) {
          W(Mk[s.key + 'Bonnet'], { mode: 'lift', lift: 0.9, soft: 1.2, seed: 30 + i }, xf);
          W(Mk[s.key + 'Bonnet'], { pig: d.bonnet, pigB: '#e5b8a8', mix: { dir: [0, 1], at: Y + 40, width: 80, noise: 0.7 }, density: 0.9, edge: 1.5, edgeW: 3, soft: 1.1, warp: 2, rough: 1, flow: 0.4, gran: 0.35, seed: 30 + i }, xf);
        }
        if (s.key === 'mary') W(Mk.book, { pig: '#5f7a55', density: 1.0, edge: 1.3, edgeW: 3, seed: 40 }, xf);
        eng.endGroup(0.92);
      });
      if (chat > 0) W(Mk.splat, { pig: '#c9a0c8', density: 0.8, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 41, radial: { x: 960, y: 380, r: 380 * chat, soft: 30 } });

      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      SIS.forEach((s, i) => {
        const bob = 0.035 * A.pulse(t + i * 0.11, 0.2) * (i % 2 ? 1 : -1);
        const lean = (i === 1 || i === 2 ? 0.09 : 0.05) * chat;
        const shake = 0.07 * Math.sin((t - wrong) * 26 + i) * shakeK;
        const rot = (bob + lean + shake) * s.dir;
        K.withXf(g, M.about(s.x + 0.1 * S * s.dir, Y + 1.6 * S, rot), () => at(g, s, () => {
          const blink = (t + i * 0.7) % 3.1 < 0.13;
          if (blink) F.inkEyeClosed(g, F.lizzy.eye, S); else F.inkEye(g, F.lizzy.eye, S);
          if (s.key === 'mary') { g.lineWidth = 2; g.beginPath(); g.arc(0.40 * S, 0.50 * S, 0.05 * S, 0, 7); g.stroke(); }
        }));
      });
      // whispers between Jane and Kitty
      if (chat > 0) {
        g.lineWidth = 2; g.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const p = A.ramp(t, sis + k * 0.35, sis + k * 0.35 + 0.5);
          if (p <= 0) continue;
          g.beginPath();
          for (let j = 0; j <= 30 * p; j++) { const u = j / 30, x = 870 + 180 * u, y = 380 + k * 38 + Math.sin(u * 18 + k) * 9; j ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.stroke();
        }
      }
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 9 });
    },
  };
})(window.WC = window.WC || {});
