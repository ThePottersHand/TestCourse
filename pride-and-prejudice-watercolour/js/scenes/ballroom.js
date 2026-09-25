// Scene: The Assembly Rooms, by candlelight (verse 1, and the chorus 3 dance).
//  v1    The room is painted in by candlelight flooding out from the chandeliers. Elizabeth
//        glances at aloof Darcy; on "worst" she turns away and her fan rises; a rose thought
//        drifts across to him.
//  dance They waltz: a slow sway, colour trailing from them; on "hate" they turn away from
//        each other, on "like" they turn back. Rose and indigo wash through the room.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const WIN = [[180, 200], [620, 200], [1140, 200], [1580, 200]];
  const WW = 160, WH = 330, FLOOR = 720;
  const PIL = [480, 960, 1440];
  const CH = [[480, 150], [1440, 150]];
  const COUPLES = [120, 790, 1150, 1800], COUPLES_D = [150, 470, 1450, 1770];
  const PALE = [
    { gown: '#d9b8d6', gownB: '#dcc0d4', hair: '#9c8190', hairB: '#8a7280' },
    { gown: '#bfd3c7', gownB: '#d6c9c0', hair: '#8f8074', hairB: '#7d7068' },
    { gown: '#e6cfa6', gownB: '#e3c9b8', hair: '#a08466', hairB: '#8a7058' },
    { gown: '#c2c9e3', gownB: '#d0cbe0', hair: '#80809c', hairB: '#707090' },
  ];
  const PALE_M = { coat: '#9ba6c4', coatB: '#8e98b8', face: '#adb6d0', legs: '#c3c8d8', hair: '#7a809c', hairB: '#6e6a78' };
  // candle positions on the two chandeliers
  const CANDLES = [];
  CH.forEach(([x, y]) => { const k = 1.5; for (let i = -3; i <= 3; i++) CANDLES.push([x + i * 13 * k, y - 16 * k - 13]); for (let i = -2; i <= 2; i++) CANDLES.push([x + i * 12 * k, y - 32 * k - 13]); });
  const THOUGHT = [[640, 330], [760, 262], [930, 232], [1110, 250], [1250, 300], [1330, 336]];

  WC.scenes.ballroom = {
    build(B) {
      K.commonMasks(B);
      B.mask('wall', K.rect(-60, -60, 2040, FLOOR + 80), { maskScale: 0.25, margin: 60, flood: { seeds: CH, step: 2 } });
      B.mask('cornice', K.rect(-60, -60, 2040, 176), { maskScale: 0.35, margin: 40 });
      B.mask('dentils', (g) => { for (let x = -20; x < 1960; x += 36) g.fillRect(x, 96, 18, 15); }, { maskScale: 0.6, margin: 16 });
      B.mask('pilasters', (g) => PIL.forEach((x) => g.fillRect(x - 34, 116, 68, FLOOR - 116)), { maskScale: 0.4, flood: { seeds: PIL.map((x) => [x, 120]) } });
      B.mask('windows', (g) => WIN.forEach(([x, y]) => WC.props.window(g, x, y, WW, WH)), { maskScale: 0.5, flood: { seeds: WIN.map(([x, y]) => [x + WW / 2, y - WW / 2 + 6]) } });
      B.mask('windowBars', (g) => WIN.forEach(([x, y]) => WC.props.windowBars(g, x, y, WW, WH)), { maskScale: 0.8, margin: 16 });
      B.mask('floor', K.rect(-60, FLOOR - 12, 2040, 1080 - FLOOR + 80), { maskScale: 0.25, margin: 60 });
      B.mask('pools', (g) => CH.forEach(([x]) => { g.beginPath(); g.ellipse(x, 800, 300, 60, 0, 0, 7); g.fill(); }), { maskScale: 0.3, margin: 90 });
      B.mask('chandelier', (g) => CH.forEach(([x, y]) => WC.props.chandelier(g, x, y, 150)), { margin: 16, flood: { seeds: CH.map(([x, y]) => [x, y - 60]) } });
      B.mask('chGlow', (g) => CH.forEach(([x, y]) => WC.fillCircle(g, x, y - 20, 230)), { maskScale: 0.35, margin: 140 });
      B.mask('flood', K.frame(80), { maskScale: 0.25, margin: 40 });
      // the room falls into shadow away from the candles
      B.mask('shade', (g) => { g.fillRect(-100, -100, 2120, 1280); g.globalCompositeOperation = 'destination-out'; CH.forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y + 330, 470, 560, 0, 0, 7); g.fill(); }); g.beginPath(); g.ellipse(960, 820, 700, 300, 0, 0, 7); g.fill(); }, { maskScale: 0.2, margin: 40 });
      B.mask('moon', (g) => WIN.forEach(([x, y]) => { g.beginPath(); g.ellipse(x + WW / 2, y + 40, 60, 90, 0, 0, 7); g.fill(); }), { maskScale: 0.4, margin: 90 });
      B.mask('thought', (g) => { WC.brushStroke(g, THOUGHT, 30, 18, 1.6); }, { margin: 40, flood: { seeds: [THOUGHT[0]] } });
      B.mask('shadow', (g) => { g.beginPath(); g.ellipse(1400, 1046, 150, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(566, 1036, 150, 16, 0, 0, 7); g.fill(); }, { maskScale: 0.5, margin: 40 });
      // verse 1 figures
      C.lizzy(B, 'lzA', { x: 560, y: 1030, s: 104, dir: 1, pose: P.lizzy.poses.stand(0) });
      C.lizzy(B, 'lzAL', { x: 560, y: 1030, s: 104, dir: -1, pose: P.lizzy.poses.stand(0) });
      C.lizzy(B, 'lzFL', { x: 560, y: 1030, s: 104, dir: -1, pose: P.lizzy.poses.fan(0, 3, 0), fan: 3 });
      C.darcy(B, 'dc', { x: 1400, y: 1040, s: 114, dir: -1, pose: P.darcy.poses.still() });
      // the waltz (chorus 3)
      C.lizzy(B, 'lzD', { x: 834, y: 1012, s: 100, dir: 1, pose: P.lizzy.poses.palm() });
      C.darcy(B, 'dcD', { x: 1100, y: 1016, s: 110, dir: -1, pose: P.darcy.poses.palm() });
      // background couples, standing (verse) and dancing (chorus)
      COUPLES.forEach((cx, i) => {
        C.lizzy(B, 'bL' + i, { x: cx - 38, y: 742, s: 42, dir: 1, pose: P.lizzy.poses.reach(0, 0.3), lite: true });
        C.darcy(B, 'bD' + i, { x: cx + 38, y: 742, s: 44, dir: -1, pose: P.darcy.poses.still(), lite: true });
      });
      COUPLES_D.forEach((cx, i) => {
        C.lizzy(B, 'dL' + i, { x: cx - 54, y: 742, s: 42, dir: 1, pose: P.lizzy.poses.palm(), lite: true });
        C.darcy(B, 'dD' + i, { x: cx + 54, y: 742, s: 44, dir: -1, pose: P.darcy.poses.palm(), lite: true });
      });
    },

    render(eng, Mk, t, e) {
      const dance = e.v === 'dance';
      const cam = dance
        ? K.cam(A.keys(t, [[112.5, 1.03], [126.4, 1.0], [129.8, 1.1]]), A.keys(t, [[112.5, 960], [129.8, 965]]), A.keys(t, [[112.5, 540], [126.4, 550], [129.8, 610]]))
        : K.cam(A.keys(t, [[2.9, 1.06], [6.5, 1.02], [13.9, 1.06]]), A.keys(t, [[2.9, 860], [7.4, 900], [13.9, 1040]]), A.keys(t, [[2.9, 560], [13.9, 530]]));
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const pp = (a, d) => (dance ? 1 : K.pp(t, a, d));
      const wt = (a, b) => (dance ? 0 : K.wet(t, a, b));

      // ---- the room, painted in by candlelight
      W(Mk.wall, { pig: '#efd29e', pigB: '#e9bfa8', mix: { dir: [0, 1], at: 420, width: 380, noise: 0.9, noiseScale: 220 }, density: 0.78, edge: 0.3, edgeW: 14, soft: 4, warp: 20, warpScale: 240, rough: 4, roughScale: 28, flow: 0.55, flowScale: 180, gran: 0.25,
        flood: { at: pp(3.0, 1.9), soft: 70, noise: 90, edge: 0.9, edgeW: 34 }, wet: wt(3.0, 4.9), wetAmp: 14, seed: 1 });
      W(Mk.cornice, { pig: '#d7ad6c', density: 0.55, edge: 0.9, edgeW: 6, soft: 2, warp: 8, warpScale: 200, rough: 3, flow: 0.5, seed: 2, reveal: { dir: [1, 0], at: -300 + 2600 * pp(3.3, 1.3), soft: 60, noise: 50 } });
      W(Mk.dentils, { mode: 'lift', lift: 0.45 * pp(4.0, 0.8), soft: 1.2, warp: 1.5, warpScale: 30, rough: 1, seed: 3 });
      W(Mk.pilasters, { pig: '#dcb77e', pigB: '#e0c49a', mix: { dir: [0, 1], at: 400, width: 200, noise: 0.8 }, density: 0.55, edge: 1.1, edgeW: 6, soft: 1.6, warp: 5, warpScale: 160, rough: 2, flow: 0.5, gran: 0.35,
        flood: { at: pp(3.5, 1.3), soft: 30, noise: 40 }, wet: wt(3.5, 4.8), seed: 4 });
      W(Mk.windows, { pig: '#5a6a9e', pigB: '#95a2c8', mix: { dir: [0, 1], at: 330, width: 220, noise: 0.9 }, density: 0.72, edge: 1.2, edgeW: 5, soft: 1.4, warp: 4, warpScale: 120, rough: 1.8, flow: 0.45, flowScale: 90, gran: 0.3,
        flood: { at: pp(3.7, 1.3), soft: 26, noise: 40 }, wet: wt(3.7, 5.0), seed: 5 });
      W(Mk.windowBars, { mode: 'lift', lift: 0.45 * pp(4.6, 0.8), soft: 1.1, warp: 1.2, warpScale: 40, rough: 0.8, seed: 7 });
      W(Mk.floor, { pig: '#d9b58c', pigB: '#b08668', mix: { dir: [0, 1], at: 900, width: 260, noise: 0.8 }, density: 0.6, edge: 0.6, edgeW: 10, soft: 3, warp: 14, warpScale: 200, rough: 4, flow: 0.35, flowScale: 160, gran: 0.15,
        reveal: { dir: [0, 1], at: 690 + 460 * pp(3.9, 1.5), soft: 50, noise: 60 }, wet: wt(3.9, 5.4), seed: 8 });
      W(Mk.chandelier, { pig: '#c8923e', pigB: '#8a5634', mix: { dir: [0, 1], at: 160, width: 30, noise: 0.5 }, density: 0.95, edge: 1.4, edgeW: 3, soft: 1, warp: 1.5, warpScale: 40, rough: 1, gran: 0.6,
        flood: { at: pp(3.6, 1.0), soft: 10, noise: 12 }, seed: 11 });
      if (!dance) W(Mk.shadow, { pig: '#8a6a6a', density: 0.3 * pp(5.2, 1.0), soft: 16, edge: 0.2, warp: 8, seed: 12 });
      W(Mk.shade, { pig: '#8d7394', pigB: '#6f6a93', mix: { dir: [0, 1], at: 600, width: 500, noise: 0.8 }, density: 0.42 * pp(4.4, 1.6), soft: 110, edge: 0, warp: 40, warpScale: 260, flow: 0.4, flowScale: 200, gran: 0.1, seed: 15 });

      // ---- mood (dance): rose and indigo wash through the room on "like" / "hate"
      if (dance) {
        const l1 = A.word(22, 'like'), h1 = A.word(23, 'hate'), l2 = A.word(24, 'like'), gs = A.word(25, 'guess');
        const at = A.keys(t, [[112.5, 960], [l1 - 0.2, 900], [l1 + 1.4, 1500], [h1 - 0.2, 1500], [h1 + 1.2, 420], [l2 - 0.2, 420], [l2 + 1.3, 1500], [gs, 1500], [gs + 2.0, 960]]);
        W(Mk.flood, { pig: '#f0b0c2', pigB: '#a9b3da', mix: { dir: [1, 0], at, width: 300, noise: 1.3, noiseScale: 300, flow: 0.09, vein: 0.35 }, density: 0.42, soft: 3, edge: 0.3, warp: 30, warpScale: 240, flow: 0.6, flowScale: 200, gran: 0.25, seed: 14 });
      }

      // ---- background couples
      (dance ? COUPLES_D : COUPLES).forEach((cx, i) => {
        const ph = i * 1.7 + (dance ? t * 1.1 : t * 0.35);
        const R = dance ? 34 : 10;
        const xf = M.tr(Math.sin(ph) * R, Math.cos(ph) * R * 0.25);
        const p = pp(4.3 + i * 0.25, 1.4);
        const nm = dance ? ['dL' + i, 'dD' + i] : ['bL' + i, 'bD' + i];
        C.paintLizzy(eng, Mk, nm[0], { cam, xf, t, p, wet: wt(4.3, 5.9), alpha: 0.85, sway: dance ? 5 : 2, omega: dance ? 3 : 1.4, style: PALE[i], lift: 1, seed: i * 20 });
        C.paintDarcy(eng, Mk, nm[1], { cam, xf, t, p, wet: wt(4.3, 5.9), alpha: 0.85, sway: dance ? 3 : 1, style: PALE_M, lift: 1, seed: i * 20 + 7 });
      });

      // ---- Elizabeth and Darcy
      if (!dance) {
        const worst = A.word(0, 'worst'), worst2 = A.word(1, 'worst');
        const turn = A.ease(t, worst - 0.1, worst + 0.55);
        const lp = K.pp(t, 3.3, 2.1), lw = K.wet(t, 3.3, 5.4);
        if (turn < 1) C.paintLizzy(eng, Mk, 'lzA', { cam, t, p: lp, wet: lw, turn, sway: 5, seed: 1 });
        else C.paintLizzy(eng, Mk, 'lzAL', { cam, t, p: 1, wet: 0, sway: 5, to: 'lzFL', toAmt: A.ease(t, worst2 - 0.25, worst2 + 0.7), seed: 1 });
        C.paintDarcy(eng, Mk, 'dc', { cam, t, p: K.pp(t, 4.6, 2.1), wet: K.wet(t, 4.6, 6.7), sway: 3, seed: 2 });
        // the thought: a ribbon of rose drifting from her to him
        const th = K.pp(t, 8.9, 2.4, A.inOut);
        if (th > 0) W(Mk.thought, { pig: '#ef9fb2', pigB: '#c9a3cf', mix: { dir: [1, 0], at: 1100, width: 260, noise: 0.8, flow: 0.2 }, density: 0.6, edge: 1.1, edgeW: 5, soft: 3, warp: 12, warpScale: 70, rough: 2, flow: 0.6,
          flood: { at: th, soft: 34, noise: 30, edge: 1.4, edgeW: 20 }, wet: 1 - 0.6 * A.ramp(t, 11.5, 13), wetAmp: 16, wetScale: 70, alpha: 1 - A.ramp(t, 12.2, 13.4), seed: 13 });
        K.paintPetals(eng, cam, Mk.petal, K.petalFlight(t, 9.1, [650, 330], [1320, 360], 5, true, 12, { arc: -150, stagger: 0.3, dur: 2.4, life: 4.4, size: 40 }));
      } else {
        const h1 = A.word(23, 'hate'), l2 = A.word(24, 'like'), gs = A.word(25, 'guess');
        const dd = WC.scenes.ballroom._dance = {};
        const away = A.keys(t, [[h1 - 0.25, 0], [h1 + 0.55, 1], [l2 - 0.25, 1], [l2 + 0.55, 0]]);
        const still = A.ease(t, gs, gs + 1.2);
        // their motion at time u: a slow sway and a loop around the floor every two bars
        const motion = (u) => {
          const bp = A.beatPhase(u), st = A.ease(u, gs, gs + 1.2), aw = A.keys(u, [[h1 - 0.25, 0], [h1 + 0.55, 1], [l2 - 0.25, 1], [l2 + 0.55, 0]]);
          const rot = 0.035 * Math.sin((Math.PI * 2 * bp) / 8) * (1 - st);
          const ph = (Math.PI * 2 * bp) / 8, orb = (1 - st) * 46;
          const dx = Math.sin(ph) * orb, dy = -Math.cos(ph) * orb * 0.22, apart = 80 * aw;
          const sw = M.about(966, 1014, rot);
          return { xl: M.mul(sw, M.tr(dx - apart, dy)), xd: M.mul(sw, M.tr(dx + apart, dy)), dy };
        };
        const mo = motion(t), xl = mo.xl, xd = mo.xd, dy = mo.dy;
        dd.xl = xl; dd.xd = xd; dd.away = away;
        // colour trails behind them as they move (rose from her gown, indigo from his coat)
        for (let k = 5; k >= 1; k--) {
          const m = motion(t - 0.13 * k), f = (1 - k / 6) * (1 - still);
          if (f <= 0.01) continue;
          const tl = { density: 0.16 * f, soft: 10 + 5 * k, edge: 0.15, warp: 14, warpScale: 70, rough: 3, flow: 0.6, flowScale: 60, gran: 0.1, morph: away > 0 && away < 1 ? null : undefined };
          W(Mk.lzDBody, Object.assign({ pig: '#ef9fb2', seed: 90 + k }, tl), m.xl);
          W(Mk.dcDBody, Object.assign({ pig: '#8e9cd0', seed: 95 + k }, tl), m.xd);
          W(Mk.dcDLegs, Object.assign({ pig: '#8e9cd0', seed: 99 + k }, tl), m.xd);
        }
        W(Mk.dot, { pig: '#7d6470', density: 0.4, soft: 20, edge: 0, warp: 6, seed: 81 }, M.mul(xl, M.mul(M.tr(834, 1016), M.sc(1.7, 0.2))));
        W(Mk.dot, { pig: '#6a6480', density: 0.4, soft: 20, edge: 0, warp: 6, seed: 82 }, M.mul(xd, M.mul(M.tr(1100, 1022), M.sc(1.6, 0.2))));
        C.paintLizzy(eng, Mk, 'lzD', { cam, xf: xl, t, turn: away, sway: 12, omega: 2.6, seed: 3 });
        C.paintDarcy(eng, Mk, 'dcD', { cam, xf: xd, t, turn: away, sway: 6, omega: 2.4, seed: 4 });
        let list = [];
        for (let k = 0; k < 6; k++) list = list.concat(K.petalFlight(t, 113 + k * 2.6, [200 + k * 300, -80], [260 + k * 280, 700], 3, (i) => (i + k) % 2 === 0, 300 + k, { arc: 60, dur: 4, life: 7, stagger: 0.6, size: 46 }));
        K.paintPetals(eng, cam, Mk.petal, list);
        Lt(Mk.dot, { colour: '#ffd9b0', density: 0.22, soft: 40, warp: 20, seed: 9 }, M.mul(M.tr(966, 900 + dy), M.sc(4.2, 3.6)));
      }

      // ---- candlelight
      const lit = pp(3.5, 1.0);
      const flick = (i) => 0.82 + 0.18 * Math.sin(t * (9 + (i % 5)) + i * 1.7) * Math.sin(t * (5.3 + (i % 3)) + i);
      Lt(Mk.chGlow, { colour: '#ffc98a', density: (dance ? 0.42 : 0.36) * lit * (0.9 + 0.1 * Math.sin(t * 7)), soft: 140, warp: 30, seed: 20 });
      Lt(Mk.pools, { colour: '#ffcf96', density: 0.3 * lit, soft: 80, warp: 30, streak: { angle: 1.57, amt: 0.7, len: 60 }, seed: 21 });
      Lt(Mk.moon, { colour: '#c9d6ff', density: 0.16 * pp(4.2, 1.2), soft: 70, warp: 20, seed: 22 });
      CANDLES.forEach(([x, y], i) => {
        const on = dance ? 1 : A.ramp(t, 3.5 + i * 0.05, 3.7 + i * 0.05);
        if (on <= 0) return;
        Lt(Mk.dot, { colour: '#ffe2a8', density: 0.9 * on * flick(i), soft: 6, warp: 0, seed: 30 + i }, M.mul(M.tr(x, y), M.sc(0.07, 0.11)));
      });
      K.motes(eng, cam, Mk.dot, t, { x: 960, y: 470, w: 1850, h: 560, n: dance ? 34 : 24, r: 9, vy: -14, colour: '#ffcf8a', intensity: 0.34, alpha: pp(4.0, 1.5), seed: dance ? 3 : 1 });

      // ---- ink: the sketch before the paint, chains, eyes
      const g = K.ink(eng, cam);
      g.strokeStyle = '#0f0';
      const sk = dance ? 1 : K.pp(t, 2.95, 1.1, A.inOut);
      WIN.forEach(([x, y], i) => { const q = A.clamp(sk * 1.6 - i * 0.15); C.pen(g, [[x - 4, y + WH + 4], [x - 4, y], [x + WW / 2, y - WW / 2 - 4], [x + WW + 4, y], [x + WW + 4, y + WH + 4]], q, 1.3, 10); });
      C.pen(g, [[-40, FLOOR + 2], [1960, FLOOR - 3]], sk, 1.2, 4);
      g.strokeStyle = '#f00'; g.lineWidth = 1.4; g.lineCap = 'round';
      CH.forEach(([x, y]) => { g.beginPath(); g.moveTo(x, -60); g.lineTo(x, -60 + (y - 40 + 60) * pp(3.4, 0.6)); g.stroke(); });
      g.fillStyle = '#f00';
      if (!dance) {
        const worst = A.word(0, 'worst');
        const I = Mk.lzAInfo, D = Mk.dcInfo;
        if (K.pp(t, 4.6, 1) > 0.9 && (t < worst - 0.1 || t > worst + 0.6)) {
          const X = t < worst ? I.X : Mk.lzALInfo.X;
          P.lizzy.ink(g, { s: I.s }, X, {});
        }
        if (K.pp(t, 5.8, 1) > 0.9) P.darcy.ink(g, { s: D.s }, D.X, {});
      } else {
        const dd = WC.scenes.ballroom._dance;
        if (dd.away < 0.02) {
          K.withXf(g, dd.xl, () => P.lizzy.ink(g, { s: Mk.lzDInfo.s }, Mk.lzDInfo.X, {}));
          K.withXf(g, dd.xd, () => P.darcy.ink(g, { s: Mk.dcDInfo.s }, Mk.dcDInfo.X, {}));
        }
      }
      eng.ink({ strength: [1.7, 0.55, 1.1], seed: 5 });
    },
  };
})(window.WC = window.WC || {});
