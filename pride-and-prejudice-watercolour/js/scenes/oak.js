// Scene: Pemberley grounds - "But he is tall and he is strong".
// Darcy stands by the lake with Pemberley behind; on "tall" he stretches up like a sapling,
// on "strong" he broadens and the old oak shakes out its leaves. Elizabeth looks up.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people;
  WC.scenes = WC.scenes || {};
  const HOUSE = { x: 1290, y: 574, w: 460 };
  const OAK = { x: 330, y: 930, h: 760 };

  WC.scenes.oak = {
    build(B) {
      B.mask('sky', K.rect(-60, -60, 2040, 700), { maskScale: 0.25, margin: 60 });
      B.mask('clouds', (g) => { [[1500, 180, 90], [1600, 160, 70], [1690, 200, 60], [1420, 210, 60], [820, 120, 60], [900, 100, 80], [980, 130, 55]].forEach(([x, y, r]) => WC.fillCircle(g, x, y, r)); }, { maskScale: 0.4, margin: 60 });
      B.mask('farBank', (g) => { g.beginPath(); WC.spline(g, [[-60, 590], [400, 560], [900, 575], [1400, 560], [1980, 580]], false, 1); g.lineTo(1980, 620); g.lineTo(-60, 620); g.fill(); }, { maskScale: 0.35 });
      B.mask('trees', (g) => { const r = WC.rng(4); for (let x = 620; x < 1960; x += 38) { if (x > 1030 && x < 1560) continue; WC.fillCircle(g, x, 562 - r() * 26, 26 + r() * 22); } }, { maskScale: 0.5, margin: 40 });
      B.mask('house', (g) => WC.props.pemberley(g, HOUSE.x, HOUSE.y, HOUSE.w), { margin: 24 });
      B.mask('houseWin', (g) => WC.props.pemberleyWindows(g, HOUSE.x, HOUSE.y, HOUSE.w), { margin: 12, maskScale: 1.2 });
      B.mask('reflect', (g) => { g.save(); g.translate(0, 2 * HOUSE.y + 6); g.scale(1, -1); WC.props.pemberley(g, HOUSE.x, HOUSE.y, HOUSE.w); g.restore(); }, { margin: 24, maskScale: 0.6 });
      B.mask('lake', K.rect(-60, 578, 2040, 130), { maskScale: 0.3, margin: 40 });
      B.mask('ripples', (g) => { const r = WC.rng(9); for (let i = 0; i < 26; i++) { const y = 600 + r() * 100, x = r() * 1900; g.fillRect(x, y, 60 + r() * 160, 2.5); } }, { maskScale: 0.8, margin: 10 });
      B.mask('lawn', (g) => { g.beginPath(); WC.spline(g, [[-60, 700], [500, 690], [1100, 712], [1980, 700]], false, 1); g.lineTo(1980, 1140); g.lineTo(-60, 1140); g.fill(); }, { maskScale: 0.25 });
      B.mask('grass', (g) => { const r = WC.rng(12); g.lineCap = 'round'; for (let i = 0; i < 160; i++) { const x = r() * 1920, y = 820 + r() * 260, h = 14 + r() * 30; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - h * 0.6, x + 8 * (r() - 0.3), y - h); g.stroke(); } }, { maskScale: 0.7, margin: 12 });
      B.mask('trunk', (g) => { WC.props.oakTrunk(g, OAK.x, OAK.y, OAK.h); g.save(); g.globalCompositeOperation = 'destination-out'; g.translate(0, -OAK.h * 0.03); WC.props.oakCanopy(g, OAK.x, OAK.y, OAK.h, WC.rng(21)); g.restore(); }, { maskScale: 0.6 });
      B.mask('canopy', (g) => WC.props.oakCanopy(g, OAK.x, OAK.y, OAK.h, WC.rng(21)), { maskScale: 0.45 });
      B.mask('holes', (g) => { [[-20, -84, 5], [16, -70, 4], [-34, -66, 3.5], [28, -90, 3.5], [0, -100, 3]].forEach(([dx, dy, r]) => WC.fillCircle(g, OAK.x + dx * OAK.h / 100, OAK.y + dy * OAK.h / 100, r * OAK.h / 100)); }, { maskScale: 0.6, margin: 30 });
      B.mask('leaves', K.splat(23, OAK.x + 180, OAK.y - OAK.h * 0.72, 380, 260, 80, 9, 2), { margin: 16 });
      B.mask('shadow', (g) => { g.beginPath(); g.ellipse(OAK.x + 140, OAK.y + 8, 260, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(1050, 958, 110, 14, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(716, 966, 80, 11, 0, 0, 7); g.fill(); }, { maskScale: 0.5, margin: 40 });
      B.puppet('lz', P.lizzy, 64);
      B.puppet('dc', P.darcy, 86);
    },

    render(eng, Mk, t) {
      const tall = A.word(13, 'tall'), strong = A.word(13, 'strong');
      const up = A.back(A.ramp(t, tall - 0.1, tall + 0.55));
      const wide = A.back(A.ramp(t, strong - 0.1, strong + 0.5));
      const cam = K.cam(A.keys(t, [[68.4, 1.04], [tall - 0.1, 1.0], [tall + 0.8, 0.94], [75.1, 0.92]]), A.keys(t, [[68.4, 900], [75.1, 880]]), A.keys(t, [[68.4, 560], [tall - 0.1, 560], [tall + 0.8, 470], [75.1, 470]]));
      const W = K.painter(eng, cam);
      W(Mk.sky, { pig: '#b9d3df', pigB: '#f3dcae', mix: { dir: [0, 1], at: 420, width: 260, noise: 0.8, noiseScale: 260 }, density: 0.7, edge: 0.3, soft: 4, warp: 20, warpScale: 240, rough: 4, flow: 0.55, flowScale: 200, gran: 0.2, seed: 1 });
      W(Mk.clouds, { mode: 'lift', lift: 0.7, soft: 22, warp: 24, warpScale: 80, rough: 6, seed: 2 });
      W(Mk.trees, { pig: '#8aa39a', pigB: '#9f9fb8', mix: { dir: [1, 0], at: 1200, width: 500, noise: 0.8 }, density: 0.6, edge: 1.1, edgeW: 5, soft: 1.5, warp: 5, warpScale: 60, rough: 3, flow: 0.5, gran: 0.4, seed: 3 });
      W(Mk.farBank, { pig: '#a9b89a', density: 0.55, edge: 0.8, soft: 2, warp: 8, rough: 2, flow: 0.5, seed: 4 });
      W(Mk.house, { pig: '#d9c39a', pigB: '#c8b08c', mix: { dir: [0, 1], at: 540, width: 40 }, density: 0.8, edge: 1.4, edgeW: 3, soft: 1, warp: 1.5, warpScale: 60, rough: 0.8, gran: 0.4, seed: 5 });
      W(Mk.houseWin, { pig: '#7d7a8c', density: 0.6, edge: 0.8, soft: 0.8, warp: 0.5, rough: 0.3, seed: 6 });
      W(Mk.lake, { pig: '#a8c2cf', pigB: '#8ea9bc', mix: { dir: [0, 1], at: 650, width: 60, noise: 0.6 }, density: 0.75, edge: 0.9, edgeW: 5, soft: 1.5, warp: 6, warpScale: 200, rough: 2, flow: 0.5, gran: 0.35, seed: 7 });
      W(Mk.reflect, { pig: '#c5b69a', density: 0.45, soft: 6, edge: 0.3, warp: 10, warpScale: 18, rough: 2, flow: 0.6, seed: 8 });
      W(Mk.ripples, { mode: 'lift', lift: 0.5, soft: 1.2, warp: 3, warpScale: 40, seed: 9 });
      W(Mk.lawn, { pig: '#a8b878', pigB: '#8a9a5a', mix: { dir: [0, 1], at: 900, width: 220, noise: 0.9, noiseScale: 200 }, density: 0.8, edge: 0.7, edgeW: 8, soft: 2, warp: 12, warpScale: 200, rough: 4, flow: 0.65, flowScale: 150, gran: 0.45, seed: 10 });
      W(Mk.shadow, { pig: '#7d8a6a', density: 0.55, soft: 14, edge: 0.2, warp: 8, seed: 11 });
      W(Mk.grass, { pig: '#6f8a4a', density: 0.8, edge: 1.2, edgeW: 2, soft: 1, warp: 1.5, warpScale: 40, rough: 0.8, seed: 12 });
      // the oak shakes on "strong"
      const shake = Math.sin((t - strong) * 34) * Math.exp(-(t - strong) * 3) * (t > strong ? 1 : 0);
      const sway = M.about(OAK.x, OAK.y, 0.012 * shake + 0.004 * Math.sin(t * 1.3));
      W(Mk.canopy, { pig: '#9bb36a', pigB: '#c9b25a', mix: { dir: [1, -1], at: 0, width: 300, noise: 1 }, density: 0.85, edge: 1.2, edgeW: 5, soft: 1.5, warp: 6, warpScale: 70, rough: 3, roughScale: 8, flow: 0.7, flowScale: 60, gran: 0.5, seed: 14 }, sway);
      W(Mk.canopy, { pig: '#5f7a45', pigB: '#4f6a3e', density: 0.7, edge: 0.4, soft: 2, warp: 6, warpScale: 70, rough: 3, flow: 0.6, gran: 0.5, seed: 15, reveal: { dir: [0, -1], at: -(OAK.y - OAK.h * 0.66), soft: 70, noise: 60, noiseScale: 50 } }, sway);
      W(Mk.holes, { mode: 'lift', lift: 0.28, soft: 5, warp: 8, warpScale: 20, rough: 3, seed: 17 }, sway);
      W(Mk.trunk, { pig: '#8a6a4a', pigB: '#5a4638', mix: { dir: [1, 0], at: OAK.x, width: 30, noise: 0.6 }, density: 0.95, edge: 1.3, edgeW: 4, soft: 1.2, warp: 3, warpScale: 60, rough: 1.8, flow: 0.5, gran: 0.6, seed: 13 }, sway);
      const burst = A.ease(t, strong - 0.02, strong + 0.6, A.out);
      if (burst > 0) W(Mk.leaves, { pig: '#7f9a4a', pigB: '#c9a84a', mix: { dir: [1, 0], at: 500, width: 200, noise: 1 }, density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 16, radial: { x: OAK.x + 180, y: OAK.y - OAK.h * 0.72, r: 460 * burst, soft: 30 } },
        M.tr(90 * A.ramp(t, strong, strong + 3), 60 * A.ramp(t, strong, strong + 3)));

      // Elizabeth looks up at him
      const lzPose = Object.assign(P.lizzy.poses.stand(t), { head: -0.10 - 0.08 * up, upper: 0.05, fore: -0.5 });
      const XL = P.lizzy.paint(eng, Mk.lz, P.root(716, 962, 64, 1, 64, P.lizzy.groundH), lzPose, { cam });
      // Darcy: stretch about his feet
      const sy = 1 + 0.45 * up, sx = (1 - 0.1 * up) * (1 + 0.38 * wide);
      const root = M.mul(M.mul(M.tr(1050, 954), M.mul(M.sc(sx, sy), M.tr(-1050, -954))), P.root(1050, 954, 86, -1, 86, P.darcy.groundH));
      const dcPose = wide > 0.02 ? Object.assign(P.darcy.poses.stand(t), { upperN: -0.25 * wide, foreN: -1.9 * wide, upperF: -0.15 * wide, foreF: -1.8 * wide, head: -0.12 }) : P.darcy.poses.stand(t);
      const XD = P.darcy.paint(eng, Mk.dc, root, dcPose, { cam });
      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      P.darcy.ink(g, Mk.dc, XD, dcPose);
      P.lizzy.ink(g, Mk.lz, XL, lzPose);
      // birds
      g.lineWidth = 1.8; g.lineCap = 'round';
      [[1500, 300], [1560, 270], [1630, 320]].forEach(([bx, by], i) => { const x = bx - (t - 68) * 22, f = Math.sin(t * 8 + i) * 5; g.beginPath(); g.moveTo(x - 11, by - 3 - f); g.quadraticCurveTo(x - 4, by - 8, x, by); g.quadraticCurveTo(x + 4, by - 8, x + 11, by - 3 - f); g.stroke(); });
      // motion strokes when he stretches
      if (up > 0.05 && t < tall + 1.2) {
        g.strokeStyle = '#0f0'; g.lineWidth = 1.2;
        [-60, 60].forEach((dx) => { g.beginPath(); g.moveTo(1050 + dx, 560); g.lineTo(1050 + dx, 560 - 180 * up); g.stroke(); });
      }
      eng.ink({ strength: [1.7, 0.6, 1.2], seed: 7 });
    },
  };
})(window.WC = window.WC || {});
