// Figure shapes and poses: Elizabeth and Darcy as full figures drawn in parts (facing +x, H units
// where crown -> chin = 1, origin at the crown), a pose being rotations about the joints, plus the
// four Bennet sisters as busts and the scenery props. The cast bakes a posed figure into a single
// silhouette, so the joints never show.
(function (WC) {
  'use strict';
  const F = WC.figures, M = WC.mat;
  const P = WC.people = {};

  // ---------------------------------------------------------------- rig helper
  // bones: {name: {parent, joint:[x,y]}} (listed parents first). pose: {name: angle | [angle, sx, sy]}
  P.solve = function (bones, pose, s, root) {
    const out = {};
    for (const name in bones) {
      const b = bones[name];
      const parent = b.parent ? out[b.parent] : root;
      const v = pose[name] || 0;
      const a = Array.isArray(v) ? v[0] : v, sx = Array.isArray(v) ? v[1] : 1, sy = Array.isArray(v) ? v[2] : sx;
      out[name] = (a || sx !== 1 || sy !== 1) ? M.mul(parent, M.about(b.joint[0] * s, b.joint[1] * s, a, sx, sy)) : parent;
    }
    return out;
  };

  // Root matrix: crown at world (x,y) is not convenient for placing people, so place by the
  // point on the ground under the figure: (gx, gy) = ground contact, size = px per H,
  // dir = +1 facing right / -1 facing left. `build` is the scale the masks were made at.
  P.root = function (gx, gy, size, dir, build, groundH, lean = 0) {
    const k = size / build;
    return M.mul(M.tr(gx, gy), M.mul(M.trs(0, 0, lean, k * dir, k), M.tr(0, -groundH * build)));
  };


  const pts = (arr, s) => arr.map(([x, y, c]) => (c ? [x * s, y * s, c] : [x * s, y * s]));
  const fill = (g, arr, s) => WC.fillSpline(g, arr, true, s);

  // ================================================================ Elizabeth
  const LZ = P.lizzy = { groundH: 7.56 };
  LZ.bones = {
    torso: { parent: null, joint: [0.0, 2.10] },
    skirt: { parent: null, joint: [0.0, 2.10] },
    head: { parent: 'torso', joint: [0.02, 1.02] },
    upper: { parent: 'torso', joint: [-0.02, 1.48] },
    fore: { parent: 'upper', joint: [-0.02, 2.83] },
    hand: { parent: 'fore', joint: [-0.01, 4.02] },
  };
  LZ.headPts = F.lizzyBody.slice(0, 18).concat([
    [0.300, 0.960], [0.150, 0.865], [0.020, 0.805], [-0.120, 0.840], [-0.250, 0.860],
    [-0.338, 0.715], [-0.418, 0.545], [-0.430, 0.375], [-0.378, 0.200], [-0.270, 0.075],
    [-0.120, 0.008], [0.050, -0.002], [0.200, 0.030]]);
  LZ.torsoPts = [
    [0.300, 0.935], [0.218, 1.030], [0.192, 1.120], [0.198, 1.225], [0.232, 1.330], [0.305, 1.455],
    [0.392, 1.600], [0.452, 1.760], [0.438, 1.920], [0.402, 2.040], [0.410, 2.160], [-0.470, 2.160],
    [-0.500, 1.950], [-0.470, 1.660], [-0.400, 1.440], [-0.310, 1.295], [-0.238, 1.150], [-0.212, 1.000],
    [-0.220, 0.860], [0.000, 0.780], [0.150, 0.830]];
  LZ.skirtPts = [
    [0.410, 2.080], [0.470, 2.600], [0.550, 3.500], [0.640, 4.600], [0.730, 5.800], [0.820, 7.000],
    [0.880, 7.520, 'c'], [0.200, 7.560], [-0.600, 7.580], [-1.050, 7.600], [-1.200, 7.620, 'c'],
    [-1.030, 7.350], [-0.880, 6.200], [-0.740, 5.000], [-0.620, 3.800], [-0.520, 2.800], [-0.470, 2.080]];

  LZ.parts = {
    skirt: { bone: 'skirt', draw: (g, s) => fill(g, LZ.skirtPts, s) },
    hem: { bone: 'skirt', draw: (g, s) => { g.save(); g.beginPath(); g.rect(-3 * s, 6.98 * s, 6 * s, 0.34 * s); g.clip(); fill(g, LZ.skirtPts, s); g.restore(); } },
    torso: { bone: 'torso', draw: (g, s) => fill(g, LZ.torsoPts, s) },
    sash: { bone: 'torso', draw: (g, s) => { g.save(); g.beginPath(); g.rect(-3 * s, 1.99 * s, 6 * s, 0.14 * s); g.clip(); fill(g, LZ.torsoPts, s); g.restore();
      WC.fillLock(g, -0.46 * s, 2.08 * s, -0.78 * s, 2.95 * s, 0.10 * s, -0.15, 0.3); WC.fillLock(g, -0.44 * s, 2.09 * s, -0.62 * s, 3.1 * s, 0.09 * s, 0.12, 0.3); } },
    head: { bone: 'head', draw: (g, s) => fill(g, LZ.headPts, s) },
    hair: { bone: 'head', draw: (g, s) => F.lizzy.hair(g, s, WC.rng(7)) },
    hairLights: { bone: 'head', draw: (g, s) => F.lizzy.hairLights(g, s) },
    ribbon: { bone: 'head', draw: (g, s) => F.lizzy.ribbon(g, s) },
    flower: { bone: 'head', draw: (g, s) => F.lizzy.flowerPetals(g, s) },
    flowerHeart: { bone: 'head', draw: (g, s) => F.lizzy.flowerHeart(g, s) },
    upper: { bone: 'upper', draw: (g, s) => { WC.capsule(g, -0.02 * s, 1.50 * s, -0.02 * s, 2.83 * s, 0.20 * s, 0.155 * s); WC.fillEllipse(g, -0.03 * s, 1.60 * s, 0.19 * s, 0.21 * s, 0); } },
    fore: { bone: 'fore', draw: (g, s) => { WC.capsule(g, -0.02 * s, 2.83 * s, -0.015 * s, 3.97 * s, 0.15 * s, 0.11 * s);
      WC.fillEllipse(g, -0.01 * s, 4.10 * s, 0.072 * s, 0.135 * s, 0.05); WC.capsule(g, 0.0, 4.00 * s, 0.07 * s, 4.13 * s, 0.05 * s, 0.035 * s); } },
  };
  // Folding fan in four states (closed -> open), pivoting at the hand, pointing along the forearm.
  LZ.fanStates = [0.12, 0.8, 1.5, 2.2];
  LZ.fanDraw = (open) => (g, s) => {
    const cx = -0.01 * s, cy = 4.08 * s, R = 0.62 * s, r = 0.12 * s;
    const a0 = Math.PI / 2 - open / 2, a1 = Math.PI / 2 + open / 2;
    g.beginPath(); g.arc(cx, cy, R, a0, a1); g.arc(cx, cy, r, a1, a0, true); g.closePath(); g.fill();
  };





  // Poses ----------------------------------------------------------
  LZ.poses = {
    stand: (t) => ({ torso: 0.01 * Math.sin(t * 1.3), head: 0.03 * Math.sin(t * 0.9), upper: 0.10, fore: -0.35, skirt: 0.008 * Math.sin(t * 1.1) }),
    fan: (t, open = 3, flutter = 0) => ({
      torso: 0.015 * Math.sin(t * 1.2), head: -0.04 + 0.03 * Math.sin(t), skirt: 0.008 * Math.sin(t * 1.1),
      upper: -0.55, fore: -2.05 + flutter * 0.16 * Math.sin(t * 14), fan: open,
    }),
    walk: (t, phase) => {
      const c = Math.sin(phase);
      return { torso: 0.015 * Math.sin(phase * 2), skirt: 0.035 * c, head: 0.02 * Math.sin(phase * 2 + 1), upper: 0.22 * c, fore: -0.35 - 0.1 * Math.max(0, c) };
    },
    reach: (t, amt = 1) => ({ torso: -0.03 * amt, head: -0.06 * amt, upper: -1.30 * amt + 0.1, fore: -0.35 * amt - 0.2, skirt: 0.01 * Math.sin(t) }),
    dance: (t, amt = 1) => ({ torso: 0.01 * Math.sin(t * 3), head: -0.05, upper: -2.55 * amt, fore: -0.25 * amt, skirt: 0.02 * Math.sin(t * 3) }),
    // palm raised toward her partner's, at shoulder height, not quite touching
    palm: () => ({ torso: -0.02, head: -0.06, upper: -0.55, fore: -2.15, skirt: 0.01 }),
    curtsey: (t, amt) => ({ torso: 0.08 * amt, head: 0.18 * amt, upper: 0.25, fore: -0.6, skirt: 0 }),
  };

  // ================================================================ Darcy
  const DC = P.darcy = { groundH: 7.42 };
  DC.bones = {
    hips: { parent: null, joint: [0.0, 3.30] },
    torso: { parent: 'hips', joint: [0.0, 3.30] },
    head: { parent: 'torso', joint: [0.02, 0.98] },
    tails: { parent: 'torso', joint: [-0.44, 2.92] },
    upperN: { parent: 'torso', joint: [-0.06, 1.52] },
    foreN: { parent: 'upperN', joint: [-0.06, 2.95] },
    upperF: { parent: 'torso', joint: [-0.06, 1.52] },
    foreF: { parent: 'upperF', joint: [-0.06, 2.95] },
    thighN: { parent: 'hips', joint: [0.02, 3.35] },
    shinN: { parent: 'thighN', joint: [0.02, 5.30] },
    thighF: { parent: 'hips', joint: [0.02, 3.35] },
    shinF: { parent: 'thighF', joint: [0.02, 5.30] },
  };
  DC.headPts = F.darcyBody.slice(0, 18).concat([
    [0.300, 0.950], [0.120, 0.860], [0.000, 0.780], [-0.200, 0.790], [-0.360, 0.760],
    [-0.440, 0.600], [-0.458, 0.400], [-0.400, 0.200], [-0.275, 0.060], [-0.100, -0.002], [0.100, -0.004], [0.250, 0.040]]);
  DC.torsoPts = [
    [0.400, 0.990], [0.420, 1.050], [0.487, 1.120], [0.503, 1.215], [0.466, 1.300], [0.455, 1.380],
    [0.520, 1.480], [0.585, 1.660], [0.600, 1.950], [0.560, 2.350], [0.500, 2.700], [0.470, 2.960, 'c'],
    [0.000, 3.020], [-0.420, 3.050, 'c'], [-0.440, 2.800], [-0.520, 2.300], [-0.620, 1.800],
    [-0.650, 1.450], [-0.550, 1.300], [-0.420, 1.180], [-0.360, 0.960], [-0.305, 0.860, 'c'],
    [-0.100, 0.740], [0.150, 0.820]];
  DC.hipsPts = [[0.470, 2.880], [0.440, 3.200], [0.400, 3.560], [-0.340, 3.580], [-0.400, 3.200], [-0.420, 2.880]];
  DC.tailsPts = [[-0.400, 2.850], [-0.520, 3.000], [-0.600, 3.600], [-0.640, 4.300], [-0.600, 4.950, 'c'],
    [-0.420, 4.880], [-0.320, 4.300], [-0.280, 3.600], [-0.300, 3.000]];
  DC.waistcoatPts = [[0.505, 2.660], [0.488, 2.950], [0.462, 3.120], [0.300, 3.080], [0.330, 2.700]];

  const bootFoot = (g, s, x) => fill(g, [[x - 0.12, 7.05], [x - 0.14, 7.42, 'c'], [x + 0.46, 7.42, 'c'], [x + 0.45, 7.30], [x + 0.20, 7.16], [x + 0.12, 7.02]], s);
  DC.parts = {
    torso: { bone: 'torso', draw: (g, s) => fill(g, DC.torsoPts, s) },
    hips: { bone: 'hips', draw: (g, s) => fill(g, DC.hipsPts, s) },
    tails: { bone: 'tails', draw: (g, s) => fill(g, DC.tailsPts, s) },
    lapel: { bone: 'torso', draw: (g, s) => F.darcy.coatCollar(g, s) },
    cravat: { bone: 'torso', draw: (g, s) => F.darcy.cravat(g, s) },
    cravatShade: { bone: 'torso', draw: (g, s) => F.darcy.cravatShade(g, s) },
    head: { bone: 'head', draw: (g, s) => fill(g, DC.headPts, s) },
    hair: { bone: 'head', draw: (g, s) => F.darcy.hair(g, s, WC.rng(11)) },
    hairLights: { bone: 'head', draw: (g, s) => F.darcy.hairLights(g, s) },
    upper: { bone: 'upperN', draw: (g, s) => WC.capsule(g, -0.06 * s, 1.55 * s, -0.06 * s, 2.95 * s, 0.30 * s, 0.24 * s) },
    fore: { bone: 'foreN', draw: (g, s) => { WC.capsule(g, -0.06 * s, 2.95 * s, -0.06 * s, 4.16 * s, 0.25 * s, 0.21 * s);
      WC.fillEllipse(g, -0.05 * s, 4.32 * s, 0.09 * s, 0.15 * s, 0.08); WC.capsule(g, -0.02 * s, 4.20 * s, 0.07 * s, 4.34 * s, 0.06 * s, 0.045 * s); } },
    thigh: { bone: 'thighN', draw: (g, s) => WC.capsule(g, 0.02 * s, 3.35 * s, 0.02 * s, 5.30 * s, 0.46 * s, 0.30 * s) },
    shin: { bone: 'shinN', draw: (g, s) => { WC.capsule(g, 0.02 * s, 5.30 * s, 0.02 * s, 7.18 * s, 0.30 * s, 0.20 * s); bootFoot(g, s, 0.02); } },
    boot: { bone: 'shinN', draw: (g, s) => {
      fill(g, [[0.20, 5.52], [0.08, 5.62, 'c'], [-0.13, 5.50], [-0.12, 6.4], [-0.09, 7.18], [0.13, 7.18], [0.15, 6.4]], s);
      bootFoot(g, s, 0.02); WC.fillEllipse(g, 0.11 * s, 5.70 * s, 0.03 * s, 0.06 * s, 0); } },
  };





  DC.poses = {
    // hands clasped behind his back, chin up
    stand: (t) => ({ torso: -0.01 + 0.006 * Math.sin(t * 1.2), head: -0.07 + 0.02 * Math.sin(t * 0.7), upperN: 0.22, foreN: [1.05, 1, 0.42], upperF: 0.2, foreF: [1.0, 1, 0.42], thighN: -0.05, thighF: 0.07, tails: 0.01 * Math.sin(t) }),
    // relaxed, arms at his sides (reads cleanly as one silhouette)
    still: () => ({ torso: -0.01, head: -0.06, upperN: 0.06, foreN: -0.12, upperF: 0.04, foreF: -0.1, thighN: -0.04, thighF: 0.06 }),
    walk: (t, phase) => {
      const c = Math.sin(phase), k = Math.max(0, Math.sin(phase - 0.9)), k2 = Math.max(0, Math.sin(phase + Math.PI - 0.9));
      return {
        hips: [0, 1, 1], torso: -0.02, head: -0.03 + 0.015 * Math.sin(phase * 2),
        thighN: -0.38 * c, shinN: 0.55 * k, thighF: 0.38 * c, shinF: 0.55 * k2,
        upperN: 0.30 * c, foreN: -0.25, upperF: -0.30 * c, foreF: -0.25, tails: 0.06 * Math.sin(phase * 2),
      };
    },
    reach: (t, amt = 1) => ({ torso: 0.02 * amt, head: 0.05 * amt, upperN: -1.25 * amt, foreN: -0.35 * amt, upperF: 0.3, foreF: 0.6, thighN: -0.04, thighF: 0.06 }),
    bow: (t, amt) => ({ torso: 0.45 * amt, head: 0.15 * amt, upperN: -0.5 * amt, foreN: -0.6 * amt, upperF: 0.3, foreF: 0.6, thighN: -0.05, thighF: 0.08, tails: -0.3 * amt }),
    arms: (t) => ({ torso: -0.01, head: -0.12, upperN: -0.18, foreN: [-1.55, 1, 0.45], upperF: -0.12, foreF: [-1.5, 1, 0.45], thighN: -0.05, thighF: 0.07 }),
    // dancing: near arm raised to join hands high between the partners
    dance: (t, amt = 1) => ({ torso: 0.01 * Math.sin(t * 3), head: -0.03, upperN: -2.55 * amt, foreN: -0.2 * amt, upperF: 0.25, foreF: 0.5, thighN: -0.05, thighF: 0.08 }),  // arms folded, chin up
    // palm raised toward hers at shoulder height; far arm at his side
    palm: () => ({ torso: -0.02, head: 0.02, upperN: -0.5, foreN: -2.2, upperF: 0.05, foreF: -0.1, thighN: -0.04, thighF: 0.06 }),
  };

  // ================================================================ The sisters (busts)
  // Variation on Elizabeth's profile + distinctive hair / bonnet for each.
  const bonnetPts = [[0.02, -0.22], [0.30, -0.26], [0.56, -0.16], [0.68, 0.04], [0.66, 0.30], [0.57, 0.56],
    [0.48, 0.58], [0.41, 0.40], [0.37, 0.20], [0.30, 0.10], [0.00, 0.06], [-0.25, 0.16], [-0.46, 0.32],
    [-0.53, 0.10], [-0.42, -0.12], [-0.20, -0.21]];
  P.sisters = {
    jane: { name: 'Jane', colour: '#ecc98d', colourB: '#e2a98f', hair: '#b07a3e', hairB: '#8a5634', kind: 'updo' },
    mary: { name: 'Mary', colour: '#b9c6b8', colourB: '#a3aeb4', hair: '#5a4a3c', hairB: '#4a4a48', kind: 'bun' },
    kitty: { name: 'Kitty', colour: '#cdb4db', colourB: '#b9a3d0', hair: '#7d5a4a', hairB: '#6d4a44', kind: 'bonnet', bonnet: '#f0e2c0' },
    lydia: { name: 'Lydia', colour: '#f2a88f', colourB: '#e8909c', hair: '#8a4a3a', hairB: '#6d3b35', kind: 'feathers', bonnet: '#f3d3a0' },
  };
  P.sisterBust = {
    body: (g, s) => fill(g, F.lizzyBody, s),
    hair: (kind) => (g, s) => {
      const rnd = WC.rng(kind.length * 13);
      if (kind === 'updo') {
        fill(g, F.lizzyCap, s);
        WC.fillCircle(g, -0.20 * s, -0.02 * s, 0.17 * s);
        WC.scallops(g, F.lizzyCap.slice(0, 10), false, s, 0.05 * s, 0.03 * s, 0.045 * s, 0.5, rnd);
        g.strokeStyle = g.fillStyle; WC.ringlet(g, 0.24 * s, 0.34 * s, 0.28 * s, 0.045 * s, 0.02 * s, 2.4, 0.018 * s, 0);
      } else if (kind === 'bun') {
        fill(g, [[0.352, 0.170], [0.330, 0.050], [0.200, -0.030], [0.000, -0.045], [-0.200, -0.010], [-0.360, 0.100], [-0.440, 0.300],
          [-0.440, 0.520], [-0.360, 0.700], [-0.250, 0.760], [-0.150, 0.660], [0.000, 0.580], [0.150, 0.480], [0.250, 0.330]], s);
        WC.fillCircle(g, -0.40 * s, 0.34 * s, 0.14 * s);
      } else {
        fill(g, F.lizzyCap, s);
        WC.scallops(g, F.lizzyCap.slice(0, 6), false, s, 0.045 * s, 0.03 * s, 0.05 * s, 0.4, rnd);
        g.strokeStyle = g.fillStyle;
        WC.ringlet(g, 0.26 * s, 0.30 * s, 0.34 * s, 0.05 * s, 0.022 * s, 2.8, 0.02 * s, 0.02 * s);
        WC.ringlet(g, -0.36 * s, 0.40 * s, 0.50 * s, 0.06 * s, 0.024 * s, 3.2, 0.028 * s, 0.06 * s);
      }
    },
    bonnet: (kind) => (g, s) => {
      if (kind !== 'bonnet' && kind !== 'feathers') return;
      fill(g, bonnetPts, s);
      WC.fillLock(g, 0.46 * s, 0.52 * s, 0.30 * s, 1.02 * s, 0.07 * s, 0.1, 0.4);
      if (kind === 'feathers') {
        WC.fillLock(g, -0.10 * s, -0.18 * s, -0.55 * s, -0.62 * s, 0.14 * s, 0.35, 0.2);
        WC.fillLock(g, 0.05 * s, -0.22 * s, -0.25 * s, -0.78 * s, 0.12 * s, 0.30, 0.2);
      }
    },
    book: (g, s) => { g.save(); g.translate(0.36 * s, 1.62 * s); g.rotate(-0.55); g.fillRect(-0.1 * s, -0.3 * s, 0.2 * s, 0.6 * s); g.restore(); },
  };

  // ================================================================ Props
  const Props = WC.props = {};
  // Palladian country house (Pemberley), width ~ 1 unit = w px, base at y=0.
  Props.pemberley = (g, x, y, w) => {
    const h = w * 0.3, k = w / 100;
    g.fillRect(x - 50 * k, y - 20 * k, 100 * k, 20 * k);                  // wings
    g.fillRect(x - 22 * k, y - 30 * k, 44 * k, 30 * k);                   // central block
    g.beginPath(); g.moveTo(x - 12 * k, y - 30 * k); g.lineTo(x, y - 38 * k); g.lineTo(x + 12 * k, y - 30 * k); g.fill();   // pediment
    g.beginPath(); g.arc(x, y - 33 * k, 6 * k, Math.PI, 0); g.fill();     // dome
    g.fillRect(x - 55 * k, y - 14 * k, 6 * k, 14 * k); g.fillRect(x + 49 * k, y - 14 * k, 6 * k, 14 * k);  // pavilions
    return h;
  };
  Props.pemberleyWindows = (g, x, y, w) => {
    const k = w / 100;
    for (let i = -4; i <= 4; i++) { if (Math.abs(i) < 1) continue; g.fillRect(x + i * 10 * k - 1.2 * k, y - 16 * k, 2.4 * k, 5 * k); g.fillRect(x + i * 10 * k - 1.2 * k, y - 8 * k, 2.4 * k, 5 * k); }
    for (let i = -1; i <= 1; i++) { g.fillRect(x + i * 7 * k - 1.2 * k, y - 26 * k, 2.4 * k, 5 * k); g.fillRect(x + i * 7 * k - 1.2 * k, y - 17 * k, 2.4 * k, 6 * k); }
    for (let i = -2; i <= 2; i++) g.fillRect(x + i * 4.2 * k - 0.7 * k, y - 30 * k, 1.4 * k, 12 * k);  // portico columns (lifted)
  };
  // Oak: trunk + branches + scalloped canopy. (x,y) = base of trunk, h = height.
  Props.oakTrunk = (g, x, y, h) => {
    const k = h / 100;
    fill(g, [[x - 5 * k, y], [x - 4 * k, y - 30 * k], [x - 3 * k, y - 55 * k], [x + 3 * k, y - 55 * k], [x + 4 * k, y - 30 * k], [x + 6 * k, y]], 1);
    WC.fillLock(g, x, y - 45 * k, x - 26 * k, y - 70 * k, 5 * k, 0.2, 0.3);
    WC.fillLock(g, x, y - 50 * k, x + 24 * k, y - 76 * k, 5 * k, -0.2, 0.3);
    WC.fillLock(g, x, y - 52 * k, x + 2 * k, y - 85 * k, 4 * k, 0.1, 0.3);
    WC.fillEllipse(g, x, y + 0.5 * k, 11 * k, 2 * k, 0);
  };
  Props.oakCanopy = (g, x, y, h, rnd) => {
    const k = h / 100;
    const blobs = [[-4, -80, 22], [-28, -72, 17], [22, -74, 19], [-14, -95, 15], [12, -97, 16], [-44, -60, 12], [40, -62, 13], [2, -64, 16], [30, -88, 12], [-36, -86, 11], [52, -72, 9], [-54, -72, 9]];
    blobs.forEach(([bx, by, r]) => {
      WC.fillCircle(g, x + bx * k, y + by * k, r * k);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + rnd(); WC.fillCircle(g, x + (bx + Math.cos(a) * r * 0.9) * k, y + (by + Math.sin(a) * r * 0.9) * k, (4 + rnd() * 4) * k); }
    });
  };
  // Classical rotunda (the temple in the rain): base centre (x, y), width w.
  Props.temple = (g, x, y, w) => {
    const k = w / 100;
    g.fillRect(x - 50 * k, y - 6 * k, 100 * k, 6 * k);                   // steps
    g.fillRect(x - 46 * k, y - 11 * k, 92 * k, 5 * k);
    g.fillRect(x - 42 * k, y - 16 * k, 84 * k, 5 * k);                    // podium
    [-36, -21, -7, 7, 21, 36].forEach((cx) => g.fillRect(x + (cx - 3) * k, y - 70 * k, 6 * k, 54 * k));   // columns
    g.fillRect(x - 44 * k, y - 80 * k, 88 * k, 10 * k);                   // entablature
    g.fillRect(x - 40 * k, y - 84 * k, 80 * k, 4 * k);
    g.beginPath(); g.ellipse(x, y - 84 * k, 38 * k, 30 * k, 0, Math.PI, 0); g.fill();   // dome
    g.fillRect(x - 4 * k, y - 122 * k, 8 * k, 10 * k);                    // lantern
    g.beginPath(); g.arc(x, y - 122 * k, 4 * k, Math.PI, 0); g.fill();
  };
  Props.templeGaps = (g, x, y, w) => {                                    // dark interior between columns
    const k = w / 100;
    [-28.5, -14, 0, 14, 28.5].forEach((cx, i) => g.fillRect(x + (cx - (i === 2 ? 3.5 : 4.5)) * k, y - 68 * k, (i === 2 ? 7 : 9) * k, 52 * k));
  };
})(window.WC = window.WC || {});
