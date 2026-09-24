// Scene: The Assembly Rooms (used three times).
//  v1    verse 1: "I swear that boy is just the worst" - she glances at aloof Darcy, turns away, fans herself.
//  v2    verse 2: "rude and mean" - he turns his back; ink blots; his "tolerable" remark is written and struck out.
//  dance chorus 3: they dance; the room floods rose / indigo with each "like" / "hate".
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, P = WC.people;
  WC.scenes = WC.scenes || {};

  const WIN = [[180, 200], [620, 200], [1140, 200], [1580, 200]];
  const WW = 160, WH = 330, FLOOR = 720;
  const PIL = [480, 960, 1440];
  const CH = [[480, 150], [1440, 150]];
  const COUPLES = [[330, 0], [760, 1], [1180, 2], [1610, 3]];
  const PALE = [
    { gown: '#d9b8d6', gownB: '#c9b0d6', skin: '#dcc0d4', skinB: '#cdb3d2', hair: '#9c8190', hairB: '#8a7280' },
    { gown: '#bfd3c7', gownB: '#b5c6cc', skin: '#d6c9c0', skinB: '#c9bfc4', hair: '#8f8074', hairB: '#7d7068' },
    { gown: '#e6cfa6', gownB: '#dcbfa6', skin: '#e3c9b8', skinB: '#d7bcb6', hair: '#a08466', hairB: '#8a7058' },
    { gown: '#c2c9e3', gownB: '#b8bedc', skin: '#d0cbe0', skinB: '#c2bdd8', hair: '#80809c', hairB: '#707090' },
  ];
  const PALE_M = { coat: '#9ba6c4', coatB: '#8e98b8', face: '#adb6d0', faceB: '#9ea8c6', legs: '#c3c8d8', boots: '#7b829e', hair: '#7a809c', hairB: '#6e6a78', lapel: '#8a93b2', cravat: '#dfe2ea', far: '#a2abc6' };

  // cut-out turn: scale x through zero when a figure changes direction
  const turn = (t, t0, from, dur = 0.22) => from * Math.cos(Math.PI * A.smooth((t - t0) / dur));

  // Four-count dance: "set" toward each other, then "turn" (swap places) - by beat phase.
  function couple(t, cx, R, ground) {
    const bp = A.beatPhase(t);
    const cyc = bp / 8, k = Math.floor(cyc), f = cyc - k;
    const side = k % 2 === 0 ? 1 : -1;
    let xE, xD, yE = ground, yD = ground, reach = 0;
    if (f < 0.5) {
      const r = R - 42 * Math.sin(Math.PI * (f / 0.5));
      xE = cx - side * r; xD = cx + side * r;
      reach = Math.sin(Math.PI * (f / 0.5));
      const hop = 7 * A.pulse(t, 0.12);
      yE -= hop; yD -= hop;
    } else {
      const th = Math.PI * A.smooth((f - 0.5) / 0.5);
      xE = cx - side * R * Math.cos(th); xD = cx + side * R * Math.cos(th);
      yE -= 18 * Math.sin(th); yD += 10 * Math.sin(th);
      reach = 1;
    }
    const dE = Math.sign(xD - xE) || 1;
    return { xE, xD, yE, yD, dirE: dE, dirD: -dE, reach, bp };
  }

  WC.scenes.ballroom = {
    build(B) {
      B.mask('wall', K.rect(-60, -60, 2040, FLOOR + 80), { maskScale: 0.25, margin: 60 });
      B.mask('cornice', K.rect(-60, -60, 2040, 176), { maskScale: 0.35, margin: 40 });
      B.mask('dentils', (g) => { for (let x = -20; x < 1960; x += 36) g.fillRect(x, 96, 18, 15); }, { maskScale: 0.6, margin: 16 });
      B.mask('pilasters', (g) => PIL.forEach((x) => g.fillRect(x - 34, 116, 68, FLOOR - 116)), { maskScale: 0.4 });
      B.mask('windows', (g) => WIN.forEach(([x, y]) => WC.props.window(g, x, y, WW, WH)), { maskScale: 0.5 });
      B.mask('windowBars', (g) => WIN.forEach(([x, y]) => WC.props.windowBars(g, x, y, WW, WH)), { maskScale: 0.8, margin: 16 });
      B.mask('windowLight', (g) => WIN.forEach(([x, y]) => { g.beginPath(); g.ellipse(x + WW / 2, y + WH * 0.4, WW * 0.26, WH * 0.4, 0, 0, 7); g.fill(); }), { maskScale: 0.4, margin: 60 });
      B.mask('floor', K.rect(-60, FLOOR - 12, 2040, 1080 - FLOOR + 80), { maskScale: 0.25, margin: 60 });
      B.mask('reflect', (g) => WIN.forEach(([x]) => g.fillRect(x + 22, FLOOR + 14, WW - 44, 250)), { maskScale: 0.35, margin: 80 });
      B.mask('chandelier', (g) => CH.forEach(([x, y]) => WC.props.chandelier(g, x, y, 150)), { margin: 16 });
      B.mask('chGlow', (g) => CH.forEach(([x, y]) => WC.fillCircle(g, x, y, 200)), { maskScale: 0.35, margin: 140 });
      B.mask('sparkA', (g) => CH.forEach(([x, y], i) => K.splat(50 + i, x, y, 190, 130, 34, 4.5)(g)), { margin: 12 });
      B.mask('sparkB', (g) => CH.forEach(([x, y], i) => K.splat(60 + i, x, y, 190, 130, 34, 4.5)(g)), { margin: 12 });
      B.mask('flood', K.frame(80), { maskScale: 0.25, margin: 40 });
      B.box('blot1', K.blot(71, 70), { x: -240, y: -240, w: 480, h: 480 }, { margin: 20 });
      B.box('blot2', K.blot(72, 56), { x: -200, y: -200, w: 400, h: 400 }, { margin: 20 });
      K.petalMask(B);
      B.puppet('lz', P.lizzy, 108);
      B.puppet('dc', P.darcy, 118);
      B.puppet('lzS', P.lizzy, 44);
      B.puppet('dcS', P.darcy, 46);
    },

    render(eng, Mk, t, e) {
      const v = e.v;
      const T = WC.TIMING;
      let cam;
      if (v === 'v1') cam = K.cam(A.lerp(1.0, 1.05, A.ramp(t, 3, 13.8)), A.lerp(960, 900, A.ramp(t, 3, 13.8)), 540);
      else if (v === 'v2') cam = K.cam(A.keys(t, [[55.7, 1.08], [60, 1.0], [65, 1.0], [69, 1.06]]), A.keys(t, [[55.7, 960], [69, 1010]]), 540);
      else cam = K.cam(A.keys(t, [[112.5, 1.0], [126.4, 1.0], [129.6, 1.06]]), 960, A.keys(t, [[112.5, 540], [126.4, 540], [129.6, 580]]));
      const W = K.painter(eng, cam);
      const beat = A.pulse(t, 0.25);

      // ---- the room
      W(Mk.wall, { pig: '#efd29e', pigB: '#e9bfa8', mix: { dir: [0, 1], at: 420, width: 380, noise: 0.9, noiseScale: 220 }, density: 0.75, edge: 0.3, edgeW: 14, soft: 4, warp: 20, warpScale: 240, rough: 4, roughScale: 28, flow: 0.55, flowScale: 180, gran: 0.25, seed: 1 });
      W(Mk.cornice, { pig: '#d7ad6c', density: 0.55, edge: 0.9, edgeW: 6, soft: 2, warp: 8, warpScale: 200, rough: 3, flow: 0.5, seed: 2 });
      W(Mk.dentils, { mode: 'lift', lift: 0.45, soft: 1.2, warp: 1.5, warpScale: 30, rough: 1, seed: 3 });
      W(Mk.pilasters, { pig: '#dcb77e', pigB: '#e0c49a', mix: { dir: [0, 1], at: 400, width: 200, noise: 0.8 }, density: 0.55, edge: 1.1, edgeW: 6, soft: 1.6, warp: 5, warpScale: 160, rough: 2, flow: 0.5, gran: 0.35, seed: 4 });
      W(Mk.windows, { pig: '#b8c9d2', pigB: '#cfd6d8', mix: { dir: [0, 1], at: 300, width: 200, noise: 0.9 }, density: 0.8, edge: 1.2, edgeW: 5, soft: 1.4, warp: 4, warpScale: 120, rough: 1.8, flow: 0.6, flowScale: 70, gran: 0.4, seed: 5 });
      W(Mk.windowLight, { mode: 'lift', lift: 0.55, soft: 36, warp: 20, warpScale: 90, seed: 6 });
      W(Mk.windowBars, { mode: 'lift', lift: 0.5, soft: 1.1, warp: 1.2, warpScale: 40, rough: 0.8, seed: 7 });
      W(Mk.floor, { pig: '#caa27a', pigB: '#a8795a', mix: { dir: [0, 1], at: 900, width: 200, noise: 0.8 }, density: 0.8, edge: 0.6, edgeW: 10, soft: 3, warp: 14, warpScale: 200, rough: 4, flow: 0.6, flowScale: 120, gran: 0.4, seed: 8 });
      W(Mk.reflect, { mode: 'lift', lift: 0.28, soft: 40, warp: 30, warpScale: 60, seed: 9 });
      const glow = v === 'v2' ? 0.35 : 0.75 + 0.2 * beat;
      W(Mk.chGlow, { pig: '#f6d58c', pigB: '#f3c3a0', mix: { dir: [0, 1], at: 150, width: 150, noise: 0.8 }, density: 0.7 * glow, soft: 70, edge: 0.1, warp: 30, warpScale: 120, flow: 0.6, seed: 10 });
      W(Mk.chandelier, { pig: '#c8923e', pigB: '#8a5634', mix: { dir: [0, 1], at: 160, width: 30, noise: 0.5 }, density: 0.95, edge: 1.4, edgeW: 3, soft: 1, warp: 1.5, warpScale: 40, rough: 1, gran: 0.6, seed: 11 });
      const tw = Math.floor(A.beatPhase(t)) % 2;
      W(tw ? Mk.sparkA : Mk.sparkB, { pig: '#e8b94c', density: 0.9, edge: 1.4, edgeW: 1.5, warp: 0.8, rough: 0.4, seed: 12, alpha: v === 'v2' ? 0.4 : 1 });

      // ---- mood glazes
      if (v === 'v2') {
        W(Mk.flood, { pig: '#9aa6c8', pigB: '#b3a8c6', mix: { dir: [1, 0], at: 900, width: 600, noise: 0.9, noiseScale: 300 }, density: A.keys(t, [[55.7, 0.2], [58, 0.55], [69, 0.62]]), soft: 30, edge: 0.2, warp: 30, warpScale: 260, flow: 0.7, flowScale: 200, gran: 0.3, seed: 13 });
      }
      if (v === 'dance') {
        const l1 = A.word(22, 'like'), h1 = A.word(23, 'hate'), l2 = A.word(24, 'like'), gs = A.word(25, 'guess');
        const R = A.keys(t, [[l1 - 0.2, -300], [l1 + 1.2, 2300], [h1 - 0.1, 2300], [h1 + 1.0, 620], [l2 - 0.1, 620], [l2 + 1.2, 2300], [gs, 2300], [gs + 1.6, 1040]]);
        const I = A.keys(t, [[h1 - 0.2, 2300], [h1 + 1.2, 420], [l2 - 0.1, 420], [l2 + 1.2, 1560], [gs, 1560], [gs + 1.6, 880]]);
        W(Mk.flood, { pig: '#f1b3c2', density: 0.42, soft: 3, edge: 0.6, edgeW: 12, warp: 30, warpScale: 240, rough: 6, flow: 0.7, flowScale: 180, gran: 0.25, seed: 14,
          reveal: { dir: [1, 0], at: R, soft: 50, noise: 90, noiseScale: 160 } });
        W(Mk.flood, { pig: '#aab5da', density: 0.45, soft: 3, edge: 0.6, edgeW: 12, warp: 30, warpScale: 240, rough: 6, flow: 0.7, flowScale: 180, gran: 0.25, seed: 15,
          reveal: { dir: [-1, 0], at: -I, soft: 50, noise: 90, noiseScale: 160 } });
      }

      // ---- background couples
      COUPLES.forEach(([cx, i]) => {
        let st;
        if (v === 'dance') st = couple(t + i * 0.37, cx, 44, 742);
        else st = { xE: cx - 40, xD: cx + 40, yE: 742 - 5 * A.pulse(t + i * 0.13, 0.15), yD: 742 - 5 * A.pulse(t + i * 0.13, 0.15), dirE: 1, dirD: -1, reach: 0.4 + 0.3 * Math.sin(t * 2 + i) };
        const a = v === 'v2' ? 0.6 : 0.8;
        const lp = v === 'dance' ? P.lizzy.poses.dance(t, 0.4 + 0.6 * st.reach) : P.lizzy.poses.reach(t, st.reach * 0.5);
        const dp = v === 'dance' ? P.darcy.poses.dance(t, 0.4 + 0.6 * st.reach) : P.darcy.poses.stand(t + i);
        P.lizzy.paint(eng, Mk.lzS, P.root(st.xE, st.yE, 44, st.dirE, 44, P.lizzy.groundH), lp, { cam, style: PALE[i], alpha: a, simple: true, seed: i * 20 });
        P.darcy.paint(eng, Mk.dcS, P.root(st.xD, st.yD, 46, st.dirD, 46, P.darcy.groundH), dp, { cam, style: PALE_M, alpha: a, simple: true, seed: i * 20 + 7 });
      });

      // ---- Elizabeth & Darcy
      let lz, dc;
      if (v === 'v1') {
        const worst = A.word(0, 'worst');
        const dirE = t < worst ? 1 : turn(t, worst, 1) ;
        const fanOpen = A.keys(t, [[worst + 0.1, 0], [worst + 0.5, 3]], A.out);
        const fl = t > A.line(1).s ? 1 : 0;
        const pose = t < worst ? Object.assign(P.lizzy.poses.stand(t), { head: -0.06 }) : P.lizzy.poses.fan(t, fanOpen, fl);
        if (t < worst + 0.1) pose.fan = null;
        const lookDown = A.keys(t, [[A.word(1, 'think') - 0.3, 0], [A.word(1, 'think') + 0.2, 0.12], [12.9, 0.12], [13.6, 0]]);
        lz = { x: 560, dir: dirE, pose };
        dc = { x: 1400, dir: -1, pose: Object.assign(P.darcy.poses.stand(t), { head: -0.08 + lookDown }) };
      } else if (v === 'v2') {
        const rude = A.word(11, 'rude');
        lz = { x: 600, dir: 1, pose: Object.assign(P.lizzy.poses.stand(t), { head: -0.03 }) };
        dc = { x: 1360, dir: t < rude ? -1 : -turn(t, rude, 1), pose: P.darcy.poses.arms(t) };
      } else {
        const gs = A.word(25, 'guess');
        let st = couple(t, 960, 175, 1010);
        let arm = 0.35 + 0.65 * st.reach;
        if (t > gs) { const k = A.ease(t, gs, gs + 1.2); st = { xE: A.lerp(st.xE, 805, k), xD: A.lerp(st.xD, 1115, k), yE: A.lerp(st.yE, 1010, k), yD: A.lerp(st.yD, 1010, k), dirE: 1, dirD: -1, reach: 1 }; arm = 1; }
        lz = { x: st.xE, y: st.yE, dir: st.dirE, pose: P.lizzy.poses.dance(t, arm) };
        dc = { x: st.xD, y: st.yD, dir: st.dirD, pose: P.darcy.poses.dance(t, arm) };
      }
      const LS = v === 'dance' ? 100 : 108, DS = v === 'dance' ? 110 : 118;
      const XL = P.lizzy.paint(eng, Mk.lz, P.root(lz.x, lz.y || 1035, LS, lz.dir, 108, P.lizzy.groundH), lz.pose, { cam });
      const XD = P.darcy.paint(eng, Mk.dc, P.root(dc.x, dc.y || 1040, DS, dc.dir, 118, P.darcy.groundH), dc.pose, { cam });

      // ---- ink blots (v2)
      if (v === 'v2') {
        const b1 = A.ease(t, A.word(11, 'rude') - 0.05, A.word(11, 'rude') + 0.25, A.out);
        const b2 = A.ease(t, A.word(11, 'mean') - 0.05, A.word(11, 'mean') + 0.25, A.out);
        if (b1 > 0) W(Mk.blot1, { pig: '#3c4a7e', density: 1.1, edge: 1.3, edgeW: 3, warp: 3, warpScale: 40, rough: 1.2, gran: 0.6, seed: 16, radial: { x: 0, y: 0, r: 330 * b1, soft: 16 } }, M.tr(1130, 380));
        if (b2 > 0) W(Mk.blot2, { pig: '#46366e', density: 1.1, edge: 1.3, edgeW: 3, warp: 3, warpScale: 40, rough: 1.2, gran: 0.6, seed: 17, radial: { x: 0, y: 0, r: 280 * b2, soft: 16 } }, M.tr(1640, 560));
      }
      // ---- confetti petals (dance)
      if (v === 'dance') {
        let list = [];
        for (let k = 0; k < 6; k++) list = list.concat(K.petalFlight(t, 113 + k * 2.6, [200 + k * 300, -80], [260 + k * 280, 700], 3, (i) => (i + k) % 2 === 0, 300 + k, { arc: 60, dur: 4, life: 7, stagger: 0.6, size: 46 }));
        K.paintPetals(eng, cam, Mk.petal, list);
      }

      // ---- ink
      const g = K.ink(eng, cam);
      g.strokeStyle = '#f00'; g.lineWidth = 1.4; g.lineCap = 'round';
      CH.forEach(([x, y]) => { g.beginPath(); g.moveTo(x, -60); g.lineTo(x, y - 40); g.stroke(); });
      g.fillStyle = g.strokeStyle = '#f00';
      P.lizzy.ink(g, Mk.lz, XL, lz.pose);
      P.darcy.ink(g, Mk.dc, XD, dc.pose);
      if (v === 'v2') {
        // "She is tolerable, but not handsome enough to tempt me." ... then struck out
        const qs = A.word(12, 'says') - 0.1, qe = A.word(12, "shouldn't") - 0.2;
        const font = `44px ${K.FONT_SCRIPT}`;
        K.writeText(g, 'She is tolerable, but not handsome', 985, 470, font, A.ramp(t, qs, qs + (qe - qs) * 0.62), 'center', '#f00');
        K.writeText(g, 'enough to tempt me.', 985, 528, font, A.ramp(t, qs + (qe - qs) * 0.62, qe), 'center', '#f00');
        g.lineWidth = 1.3; g.strokeStyle = '#f00';
        const lead = A.ease(t, qs - 0.3, qs + 0.2);
        if (lead > 0) { g.beginPath(); g.moveTo(1290, 300); g.quadraticCurveTo(1240, 380, 1290 - 60 * lead, 380 + 50 * lead); g.stroke(); }
        const sc = A.ramp(t, A.word(12, "shouldn't"), A.word(12, 'say') + 0.35);
        if (sc > 0) {
          g.strokeStyle = '#00f'; g.lineWidth = 12; g.lineJoin = 'round';
          const n = Math.floor(sc * 14);
          g.beginPath();
          for (let k = 0; k <= n; k++) { const x = 740 + k * 36 + (k % 2) * 10, y = (k % 2 ? 440 : 545) + Math.sin(k * 1.7) * 8; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
          g.stroke();
        }
      }
      eng.ink({ strength: [1.7, 0.55, 1.1], colour: '#c8506c', seed: 5 });
    },
  };
})(window.WC = window.WC || {});
