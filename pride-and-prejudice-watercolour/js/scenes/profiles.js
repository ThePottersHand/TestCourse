// Scene: Face to Face (pre-chorus 1 + chorus 1, and the last line of chorus 3).
// c1: "And now he's staring at my eyes" - we begin on bare paper as her eye is drawn; her face
//     floods out from it. On "staring" his eye is drawn and his face floods out from his.
//     A line of light joins their gaze. Chorus: rose floods in from her side on each "like",
//     indigo from his on "hate" (and she turns her head away), and on "the art of making up
//     my mind" the colours marble into violet and light blooms between them.
// c3: the last line, closer now: a violet heart floods open between them.
(function (WC) {
  'use strict';
  const A = WC.A, K = WC.K, M = WC.mat, C = WC.cast;
  WC.scenes = WC.scenes || {};

  const LZ = { x: 430, y: 230, s: 460 };
  const DC = { x: 1500, y: 208, s: 470 };
  const LAX = LZ.x + 5;   // her head turns about this line

  WC.scenes.profiles = {
    build(B) {
      K.commonMasks(B);
      B.mask('bg', K.rect(34, 30, 1852, 1022), { maskScale: 0.3, margin: 80, flood: { seeds: [[960, 460]] } });
      B.mask('floodL', K.frame(80), { maskScale: 0.2, margin: 40, flood: { seeds: [[-60, 200], [-60, 540], [-60, 900]], step: 1 } });
      B.mask('floodR', K.frame(80), { maskScale: 0.2, margin: 40, flood: { seeds: [[1980, 200], [1980, 540], [1980, 900]], step: 1 } });
      B.mask('strokeWarm', (g) => { WC.brushStroke(g, [[70, 540], [140, 300], [330, 120], [560, 80], [760, 120]], 120); WC.brushStroke(g, [[90, 780], [140, 640], [230, 540]], 70); }, { maskScale: 0.45, margin: 60, flood: { seeds: [[70, 540], [90, 780]] } });
      B.mask('strokeCool', (g) => { WC.brushStroke(g, [[1850, 540], [1790, 300], [1600, 120], [1360, 80], [1170, 130]], 120); WC.brushStroke(g, [[1830, 800], [1780, 660], [1690, 560]], 70); }, { maskScale: 0.45, margin: 60, flood: { seeds: [[1850, 540], [1830, 800]] } });
      B.mask('violet', (g) => { g.beginPath(); g.ellipse(955, 470, 330, 430, 0, 0, 7); g.fill(); }, { maskScale: 0.35, margin: 140, flood: { seeds: [[955, 470]] } });
      B.box('heart', (g) => { g.fill(WC.heartPath(new Path2D(), 0, 0, 150)); }, { x: -170, y: -170, w: 340, h: 320 }, { margin: 60, maskScale: 0.8, flood: { seeds: [[0, 90]] } });
      C.lizzyBust(B, 'lz', LZ);
      C.darcyBust(B, 'dc', DC);
      const le = B.M.lzInfo.eye, de = B.M.dcInfo.eye;
      B.mask('gaze', (g) => { g.beginPath(); g.moveTo(le[0] + 8, le[1]); g.quadraticCurveTo(960, (le[1] + de[1]) / 2 - 16, de[0] - 8, de[1]); g.quadraticCurveTo(960, (le[1] + de[1]) / 2 + 16, le[0] + 8, le[1]); g.fill(); }, { maskScale: 0.6, margin: 60 });
      B.mask('splatRose', K.splat(3, 260, 150, 240, 150, 55, 9), { margin: 20 });
      B.mask('splatIndigo', K.splat(5, 1680, 170, 220, 160, 55, 9), { margin: 20 });
      B.mask('splatGold', K.splat(18, 955, 460, 420, 330, 90, 7), { margin: 20 });
    },

    render(eng, Mk, t, e) {
      const c3 = e.v === 'c3';
      const LI = Mk.lzInfo, DI = Mk.dcInfo, LEYE = LI.eye;
      let cam, lOff, dOff;
      if (!c3) {
        const z = A.keys(t, [[29.25, 3.1], [31.0, 3.0], [33.1, 1.75], [35.9, 1.0], [55.7, 1.05]]);
        const c = A.keys(t, [[29.25, LEYE], [31.0, [LEYE[0] + 20, LEYE[1]]], [33.1, [960, 452]], [35.9, [960, 540]], [55.7, [960, 530]]]);
        cam = K.cam(z, c[0], c[1]);
        const art = A.ease(t, A.word(10, 'art') - 1, A.word(10, 'mind') + 0.5);
        lOff = 30 * art; dOff = -30 * art;
      } else {
        cam = K.cam(A.keys(t, [[129.0, 1.22], [134.9, 1.1]]), 960, A.keys(t, [[129.0, 470], [134.9, 500]]));
        const k = A.ease(t, 129.0, 133.2);
        lOff = 70 + 45 * k; dOff = -70 - 45 * k;
      }
      const W = K.painter(eng, cam);
      const Lt = (m, p, xf) => eng.light(m, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));
      const LX = M.tr(lOff, 0), DX = M.tr(dOff, 0);

      // the story beats
      const l1 = A.word(6, 'like'), h1 = A.word(7, 'hate'), l2 = A.word(8, 'like'), gs = A.word(9, 'guess');
      const artT = c3 ? A.word(26, 'art') : A.word(10, 'art');
      const art = c3 ? A.ease(t, artT - 1.0, artT + 1.2) : A.ease(t, artT - 1.2, artT + 1.4);
      const lp = c3 ? 1 : K.pp(t, 29.5, 3.0), lw = c3 ? 0 : K.wet(t, 29.5, 32.5);
      const dp = c3 ? 1 : K.pp(t, 31.6, 2.6), dw = c3 ? 0 : K.wet(t, 31.6, 34.2);
      const turn = c3 ? 0 : A.keys(t, [[h1 - 0.2, 0], [h1 + 0.7, 1], [l2 - 0.35, 1], [l2 + 0.45, 0]]);
      const blush = c3 ? 0.35 : Math.max(A.env(t, l1 - 0.1, h1 - 0.2, 0.5, 0.6), A.env(t, l2 - 0.1, 56, 0.5, 0.6)) * 0.6;

      // ---- the page: a warm ground floods out from the middle, then her warm and his cool strokes
      W(Mk.bg, { pig: '#f4e8d2', pigB: '#e4e6ea', mix: { dir: [1, 0], at: 960, width: 700, noise: 0.9, noiseScale: 260 }, density: 0.4, edge: 0.5, edgeW: 12, soft: 3, warp: 26, warpScale: 260, rough: 6, roughScale: 30, flow: 0.45, flowScale: 230, gran: 0.2, dry: 0.5,
        flood: { at: c3 ? 1 : K.pp(t, 29.6, 2.2), soft: 90, noise: 90, edge: 0.4 }, seed: 1 });
      W(Mk.strokeWarm, { pig: '#efc2a4', pigB: '#e9a9b5', mix: { dir: [1, -0.5], at: 300, width: 200, noise: 0.8 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9,
        flood: { at: c3 ? 1 : K.pp(t, 30.4, 1.4), soft: 30, noise: 30 }, wet: c3 ? 0 : K.wet(t, 30.4, 31.8), seed: 2 });
      W(Mk.strokeCool, { pig: '#c3d3d6', pigB: '#b9bfdc', mix: { dir: [0, 1], at: 400, width: 260, noise: 0.9 }, density: 0.5, edge: 1.1, edgeW: 8, soft: 2, warp: 10, warpScale: 90, rough: 5, roughScale: 18, flow: 0.7, flowScale: 60, gran: 0.5, dry: 0.9,
        flood: { at: c3 ? 1 : K.pp(t, 31.8, 1.4), soft: 30, noise: 30 }, wet: c3 ? 0 : K.wet(t, 31.8, 33.2), seed: 3 }, DX);

      // ---- the tug of colours: rose floods in from her side, indigo from his
      let R, I;
      if (!c3) {
        R = A.keys(t, [[l1 - 0.4, -120], [l1 + 1.2, 1500], [h1 - 0.1, 1500], [h1 + 1.0, 420], [l2 - 0.1, 420], [l2 + 1.1, 1700], [gs, 1700], [gs + 1.5, 1030]]);
        I = A.keys(t, [[h1 - 0.3, 2100], [h1 + 1.1, 480], [l2 - 0.1, 480], [l2 + 1.0, 1500], [gs, 1500], [gs + 1.5, 890]]);
      } else { R = 1080; I = 840; }
      const moving = c3 ? 0.3 : Math.max(A.env(t, l1 - 0.4, l1 + 2.4, 0.3, 1.2), A.env(t, h1 - 0.3, h1 + 2.3, 0.3, 1.2), A.env(t, l2 - 0.1, l2 + 2.3, 0.3, 1.2), A.env(t, gs, gs + 2.8, 0.3, 1.2));
      const fl = { soft: 40, noise: 110, edge: 1.0, edgeW: 22 };
      if (R > -100) W(Mk.floodL, { pig: '#f1b3c2', pigB: '#f3c7a8', mix: { dir: [0, 1], at: 540, width: 500, noise: 0.9 }, density: 0.48, soft: 3, edge: 0.3, warp: 30, warpScale: 240, rough: 6, flow: 0.7, flowScale: 180, gran: 0.25,
        flood: Object.assign({ px: R + 60 }, fl), wet: moving, wetAmp: 18, wetScale: 120, seed: 4 });
      if (I < 2060) W(Mk.floodR, { pig: '#aab5da', pigB: '#b9c6d9', mix: { dir: [0, 1], at: 540, width: 500, noise: 0.9 }, density: 0.5, soft: 3, edge: 0.3, warp: 30, warpScale: 240, rough: 6, flow: 0.7, flowScale: 180, gran: 0.25,
        flood: Object.assign({ px: 1980 - I }, fl), wet: moving, wetAmp: 18, wetScale: 120, seed: 5 });
      if (art > 0) W(Mk.violet, { pig: '#c7a6d6', pigB: '#e9b4c4', mix: { dir: [1, 0], at: 900, width: 300, noise: 1.2, noiseScale: 120, flow: 0.12, vein: 0.3 }, density: 0.7, soft: 40, edge: 0.6, edgeW: 16, warp: 50, warpScale: 180, flow: 0.8, flowScale: 80,
        flood: { at: art, soft: 60, noise: 80, edge: 1.0, edgeW: 24 }, wet: 1 - 0.5 * A.ramp(t, artT + 2, artT + 5), wetAmp: 16, seed: 6 });
      if (c3 && art > 0) W(Mk.heart, { pig: '#a878c4', pigB: '#e0709a', mix: { dir: [0, 1], at: -40, width: 120, noise: 0.9, flow: 0.15 }, density: 1.0, edge: 1.5, edgeW: 6, soft: 1.5, warp: 7, warpScale: 60, rough: 2.5, roughScale: 10, flow: 0.6, flowScale: 50, gran: 0.45,
        flood: { at: art, soft: 26, noise: 30, edge: 1.3, edgeW: 16 }, wet: 1 - 0.6 * A.ramp(t, artT + 1.5, artT + 3.5), wetAmp: 6, seed: 7 }, M.tr(955, 470));

      // ---- the two of them, flooding out from their eyes
      C.paintDarcyBust(eng, Mk, 'dc', { cam, xf: DX, t, p: dp, wet: dw });
      C.paintLizzyBust(eng, Mk, 'lz', { cam, xf: LX, t, p: lp, wet: lw, blush, turn, axis: LAX });

      // petals from her flower
      const FL = LI.flower, from = [FL[0] + lOff, FL[1]], to = [1180 + dOff, 420];
      let petals = [];
      if (!c3) {
        [[6, true], [7, false], [8, true]].forEach(([li, like], k) => { petals = petals.concat(K.petalFlight(t, A.word(li, 'maybe'), from, to, 4, like, 10 + k)); });
        petals = petals.concat(K.petalFlight(t, gs, from, [980, 260], 6, (i) => i % 2 === 0, 20, { arc: -260, stagger: 0.14 }));
        petals = petals.concat(K.petalFlight(t, A.word(10, 'appreciate'), from, [955, 520], 9, (i) => i % 2 === 0, 30, { arc: -320, stagger: 0.2, life: 8 }));
      } else {
        petals = K.petalFlight(t, 128.8, [955, -60], [955, 700], 14, (i) => i % 2 === 0, 50, { arc: 30, stagger: 0.35, dur: 4, life: 7 });
      }
      K.paintPetals(eng, cam, Mk.petal, petals);
      const sp = (a, d) => (c3 ? 1 : K.pp(t, a, d));
      W(Mk.splatRose, { pig: '#e58ea0', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 30, radial: { x: 260, y: 150, r: 20 + 300 * sp(l1 - 0.1, 0.35), soft: 20 } }, LX);
      W(Mk.splatIndigo, { pig: '#7382ad', density: 0.9, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 31, radial: { x: 1680, y: 170, r: 20 + 300 * sp(h1 - 0.1, 0.35), soft: 20 } }, DX);
      if (art > 0) W(Mk.splatGold, { pig: '#dcae57', density: 0.85, edge: 1.4, edgeW: 2, warp: 1, rough: 0.5, seed: 32, radial: { x: 955, y: 460, r: 560 * art, soft: 40 } });

      // ---- light: their gaze, glints, and a bloom on "the art of making up my mind"
      if (!c3) Lt(Mk.gaze, { colour: '#fff0d8', density: 0.26 * A.env(t, 32.2, 36.4, 0.9, 1.2), soft: 26, warp: 6, streak: { angle: 0, amt: 0.6, len: 120 }, seed: 40 });
      const eyesT = A.word(5, 'eyes');
      if (!c3) {
        K.glint(eng, cam, Mk.star, LEYE[0] + lOff + 4, LEYE[1] - 4, t, eyesT - 0.1, 0.9, 30, '#fff6e0');
        K.glint(eng, cam, Mk.star, DI.eye[0] + dOff - 4, DI.eye[1] - 4, t, eyesT + 0.15, 0.9, 30, '#e8eeff');
        [l1, l2].forEach((w) => K.glint(eng, cam, Mk.star, LEYE[0] + lOff + 4, LEYE[1] - 4, t, w, 0.8, 24, '#fff0f0'));
      }
      Lt(Mk.violet, { colour: '#ffe2c4', density: 0.3 * art * (c3 ? 1 : 1 - A.ramp(t, 55.2, 56.5)), soft: 120, warp: 40, seed: 41 }, M.about(955, 470, 0, 0.7, 0.7));
      if (art > 0) K.motes(eng, cam, Mk.dot, t, { x: 955, y: 470, w: 700, h: 600, n: 22, r: 7, vy: -18, colour: '#ffe0a8', intensity: 0.5, alpha: art, seed: c3 ? 7 : 6 });

      // ---- ink: the eyes drawn first, the pencil profiles, blinks
      const g = K.ink(eng, cam);
      g.fillStyle = g.strokeStyle = '#f00';
      const blink = [34.2, 44.1, 53.0, 131.1].some((b) => t > b && t < b + 0.14);
      const lxf = turn > 0.9 ? M.mul(LX, [-1, 0, 0, 1, 2 * LAX, 0]) : LX;
      if (turn < 0.1 || turn > 0.9) C.inkLizzyBust(g, LI, { xf: lxf, p: c3 ? 1 : K.pp(t, 29.3, 1.1, (x) => x), closed: blink });
      C.inkDarcyBust(g, DI, { xf: DX, p: c3 ? 1 : K.pp(t, 31.25, 0.9, (x) => x) });
      g.strokeStyle = '#0f0';
      if (turn < 0.1) K.withXf(g, LX, () => C.sketchLizzy(g, LI, c3 ? 1 : K.pp(t, 29.6, 1.6, A.inOut)));
      K.withXf(g, DX, () => C.sketchDarcy(g, DI, c3 ? 1 : K.pp(t, 30.9, 1.3, A.inOut)));
      eng.ink({ strength: [1.7, 0.55, 1.2], seed: 6 });
    },
  };
})(window.WC = window.WC || {});
