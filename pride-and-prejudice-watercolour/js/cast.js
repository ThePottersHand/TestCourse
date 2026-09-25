// The cast, v3: real silhouettes. Each figure is baked once, in a pose, into one solid shape
// (hair, bonnet and ribbons included) and painted as a single wash with wet-in-wet colour: no
// faces, no features, no joints. Life comes from the paint and the air: figures flood onto the
// page, hems, coat tails and bonnet ribbons move in the wind, busts breathe.
(function (WC) {
  'use strict';
  const M = WC.mat, P = WC.people, F = WC.figures, A = WC.A;
  const C = WC.cast = {};

  const drawPart = (g, Pz, X, k, s, off) => {
    const part = Pz.parts[k]; let m = X[part.bone];
    if (off) m = M.mul(m, off);
    g.save(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]); part.draw(g, s); g.restore();
  };
  const inBone = (g, m, fn) => { g.save(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]); fn(); g.restore(); };
  const fl = (p, a0, a1, o = {}) => ({ at: A.smooth(A.ramp(p, a0, a1)), soft: o.soft || 26, noise: o.noise != null ? o.noise : 36, edge: o.edge != null ? o.edge : 1.1, edgeW: o.edgeW || 16 });
  const boxOf = (m, x0, y0, x1, y1) => {
    const c = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => M.apply(m, x, y));
    const xs = c.map((q) => q[0]), ys = c.map((q) => q[1]);
    return [Math.min(...xs) - 40, Math.min(...ys) - 40, Math.max(...xs) + 40, Math.max(...ys) + 40];
  };
  C.fl = fl;

  // Silhouette pigments: [head, hem] - deep at the top, lighter toward the hem, as the wash pools.
  C.INK = {
    lizzy: ['#7e3558', '#c96a88'],
    darcy: ['#1f2750', '#3e4d85'],
    jane: ['#9a7042', '#d2a674'],
    mary: ['#4f5b54', '#8a988c'],
    kitty: ['#65527e', '#a592bd'],
    lydia: ['#a24c40', '#dd8670'],
  };

  // A Regency poke bonnet (bust units, crown at the origin, facing +x): a round crown over the
  // back of the head and a deep brim that juts out past the face.
  const BONNET = [[-0.46, 0.50], [-0.50, 0.24], [-0.40, 0.00], [-0.18, -0.18], [0.10, -0.30], [0.40, -0.28], [0.64, -0.14],
    [0.74, 0.06], [0.70, 0.26], [0.58, 0.30], [0.42, 0.22], [0.26, 0.20], [0.08, 0.30], [-0.14, 0.52], [-0.30, 0.62]];
  const bonnet = (g, s) => { WC.fillSpline(g, BONNET, true, s); WC.fillLock(g, 0.40 * s, 0.28 * s, 0.30 * s, 1.0 * s, 0.05 * s, 0.1, 0.5); };
  // Bonnet ribbons streaming out behind, tied at the nape.
  const streamers = (g, s, len) => {
    WC.fillLock(g, -0.30 * s, 0.60 * s, -0.30 * s - 0.95 * len * s, 0.66 * s + 0.62 * len * s, 0.13 * s, -0.12, 0.6);
    WC.fillLock(g, -0.26 * s, 0.66 * s, -0.26 * s - 0.70 * len * s, 0.74 * s + 0.95 * len * s, 0.12 * s, 0.14, 0.6);
  };

  // ------------------------------------------------------------------ full figures
  // o: {x, y (ground), s (px per head), dir, pose, fan, bonnet, streamers (length, heads), seed:'face'|'feet'|[x,y]}
  C.lizzy = function (B, name, o) {
    const s = o.s, Pz = P.lizzy, dir = o.dir || 1;
    const root = P.root(o.x, o.y, s, dir, s, Pz.groundH);
    const X = P.solve(Pz.bones, o.pose || {}, s, root);
    const face = M.apply(X.head, 0.28 * s, 0.55 * s), crown = M.apply(X.head, -0.12 * s, 0.0);
    const feet = [o.x, o.y - 0.3 * s];
    const info = { kind: 'lizzy', x: o.x, y: o.y, s, dir, X, face, crown, feet, waistY: o.y - (Pz.groundH - 2.1) * s, topY: o.y - (Pz.groundH + 0.3) * s };
    const area = { x: o.x - 4.5 * s, y: o.y - 9.8 * s, w: 9 * s, h: 11 * s };
    const seed = o.seed === 'feet' ? feet : Array.isArray(o.seed) ? o.seed : face;
    B.mask(name, (g) => {
      ['skirt', 'torso', 'head', 'upper', 'fore', 'hair', 'hem', 'sash', 'ribbon', 'flower'].forEach((k) => drawPart(g, Pz, X, k, s));
      if (o.bonnet) inBone(g, X.head, () => bonnet(g, s));
      if (o.fan != null) inBone(g, X.fore, () => Pz.fanDraw(Pz.fanStates[o.fan])(g, s));
    }, { area, margin: 24, flood: { seeds: [seed] } });
    if (o.streamers) {
      B.mask(name + 'Tails', (g) => inBone(g, X.head, () => streamers(g, s, o.streamers)), { area, margin: 24, flood: { seeds: [M.apply(X.head, -0.3 * s, 0.62 * s)] } });
      const a0 = M.apply(X.head, -0.3 * s, 0.62 * s), a1 = M.apply(X.head, (-0.3 - 0.85 * o.streamers) * s, (0.7 + 0.8 * o.streamers) * s);
      info.tails = { a0, a1 };
    }
    B.M[name + 'Info'] = info;
    return info;
  };

  C.darcy = function (B, name, o) {
    const s = o.s, Pz = P.darcy, dir = o.dir || 1;
    const root = P.root(o.x, o.y, s, dir, s, Pz.groundH);
    const X = P.solve(Pz.bones, o.pose || {}, s, root);
    const face = M.apply(X.head, 0.28 * s, 0.55 * s), crown = M.apply(X.head, -0.1 * s, 0.0);
    const feet = [o.x, o.y - 0.2 * s];
    const info = { kind: 'darcy', x: o.x, y: o.y, s, dir, X, face, crown, feet, waistY: o.y - (Pz.groundH - 2.95) * s, topY: o.y - (Pz.groundH + 0.2) * s };
    const area = { x: o.x - 4.5 * s, y: o.y - 9.8 * s, w: 9 * s, h: 11 * s };
    const seed = o.seed === 'feet' ? feet : Array.isArray(o.seed) ? o.seed : face;
    const farA = M.tr(0.08 * s, 0), farL = M.tr(0.02 * s, 0);
    B.mask(name, (g) => {
      ['torso', 'head', 'upper', 'fore', 'hips', 'thigh', 'shin', 'boot', 'hair', 'lapel', 'cravat'].forEach((k) => drawPart(g, Pz, X, k, s));
      [['upper', X.upperF, farA], ['fore', X.foreF, farA], ['thigh', X.thighF, farL], ['shin', X.shinF, farL], ['boot', X.shinF, farL]].forEach(([k, m0, off]) => inBone(g, M.mul(m0, off), () => Pz.parts[k].draw(g, s)));
    }, { area, margin: 24, flood: { seeds: [seed] } });
    B.mask(name + 'Tails', (g) => drawPart(g, Pz, X, 'tails', s), { area, margin: 24, flood: { seeds: [o.seed === 'feet' ? [o.x, info.waistY + 2 * s] : M.apply(X.torso, -0.3 * s, 2.9 * s)] } });
    B.M[name + 'Info'] = info;
    return info;
  };

  // o: {cam, xf, t, p (paint-on 0..1), wet, alpha, pig, pigB, density, sway (px), omega, phase,
  //     wind (steady lean: -1..1, + blows toward +x), lift, seed}
  C.paint = function (eng, Mk, name, o) {
    const I = Mk[name + 'Info']; if (!I) return;
    const s = I.s, p = o.p != null ? o.p : 1, a = o.alpha != null ? o.alpha : 1;
    if (p <= 0 || a <= 0) return;
    const ink = C.INK[I.kind];
    const xf = o.xf ? M.mul(o.cam, o.xf) : o.cam;
    const amp = o.sway != null ? o.sway : 3, wind = o.wind || 0, om = o.omega || 1.6, ph = o.phase || 0;
    const fld = fl(p, 0, 1, { soft: 26, noise: 36, edge: 1.1 });
    const base = { xf, alpha: a, wet: o.wet || 0, time: o.t, warp: 2.5, warpScale: 110, rough: 1.1, flow: 0.35, flowScale: 110, gran: 0.35, edge: 1.2, edgeW: 4.5, flood: fld };
    const col = { pig: o.pig || ink[0], pigB: o.pigB || ink[1], mix: { dir: [0, 1], at: I.topY + 2.6 * s, width: 2.6 * s, noise: 0.9, noiseScale: 90, flow: 0.02 }, density: o.density || 0.95, seed: 300 + (o.seed || 0) };
    const W = (m, sway) => { if (m) eng.wash(m, Object.assign({}, base, col, { sway })); };
    eng.beginGroup(boxOf(xf, I.x - 4 * s, I.topY - 1 * s, I.x + 4 * s, I.y + 0.8 * s));
    if (I.kind === 'lizzy') {
      const hem = { amp, y0: I.waistY, y1: I.y, k: 1.8, omega: om, wave: 420, phase: ph, lean: wind };
      W(Mk[name], hem);
      // mud (or dew, or pollen) climbing the hem: o.stain = {h (px), pig}
      if (o.stain && o.stain.h > 0) eng.wash(Mk[name], Object.assign({}, base, { pig: o.stain.pig || '#6e5236', density: 0.9, sway: hem, seed: 330,
        reveal: { dir: [0, -1], at: -(I.y - o.stain.h), soft: 5, noise: 6, noiseScale: 12 } }));
      if (I.tails) {
        const T = I.tails, ax = [T.a1[0] - T.a0[0], T.a1[1] - T.a0[1]], L = Math.hypot(ax[0], ax[1]);
        const along = (T.a0[0] * ax[0] + T.a0[1] * ax[1]) / L;
        W(Mk[name + 'Tails'], { amp: 0.07 * s + amp * 0.4, y0: along, y1: along + L, k: 1.4, omega: om * 2.2, wave: 0.7 * s, phase: ph, ampY: 0.03 * s, axis: ax, lean: 0 });
      }
    } else {
      W(Mk[name], null);
      W(Mk[name + 'Tails'], { amp: amp * 1.2, y0: I.waistY, y1: I.waistY + 2.2 * s, k: 1.5, omega: om, wave: 160, phase: ph, lean: wind });
    }
    eng.endGroup((o.lift != null ? o.lift : 0.95) * a);
  };

  // ------------------------------------------------------------------ busts (silhouette portraits)
  // o: {kind: 'lizzy'|'darcy'|'jane'|'mary'|'kitty'|'lydia', x, y (crown), s, dir (1 faces right), clip, maskScale, seed}
  C.bust = function (B, name, o) {
    const s = o.s, dir = o.dir || 1, kind = o.kind;
    const at = (g, fn) => { g.save(); if (o.clip) o.clip(g); g.translate(o.x, o.y); g.scale(dir, 1); fn(); g.restore(); };
    const isD = kind === 'darcy';
    const iris = (isD ? F.darcy : F.lizzy).eye.iris;
    const eye = [o.x + dir * iris.x * s, o.y + iris.y * s];
    const brow = [o.x + dir * 0.38 * s, o.y + 0.36 * s];
    const draw = (g) => at(g, () => {
      if (kind === 'lizzy') { F.lizzy.body(g, s); F.lizzy.hair(g, s, WC.rng(7)); F.lizzy.ribbon(g, s); F.lizzy.flowerPetals(g, s); }
      else if (isD) { F.darcy.body(g, s); F.darcy.hair(g, s, WC.rng(11)); }
      else {
        const d = P.sisters[kind], S = P.sisterBust;
        S.body(g, s); S.hair(d.kind)(g, s); S.bonnet(d.kind)(g, s);
        if (kind === 'mary') S.book(g, s);
      }
    });
    B.mask(name, draw, { maskScale: o.maskScale || 0.8, margin: 40, flood: { seeds: [o.seed || brow] } });
    const info = { kind, x: o.x, y: o.y, s, dir, eye, brow, chin: [o.x + dir * 0.3 * s, o.y + 1.0 * s], nape: [o.x - dir * 0.25 * s, o.y + 1.1 * s] };
    B.M[name + 'Info'] = info;
    return info;
  };

  // o: {cam, xf, t, p, wet, alpha, pig, pigB, density, breathe (default on), fadeBottom (y), tilt (rad), lift}
  C.paintBust = function (eng, Mk, name, o) {
    const I = Mk[name + 'Info']; if (!I) return;
    const s = I.s, p = o.p != null ? o.p : 1, a = o.alpha != null ? o.alpha : 1;
    if (p <= 0 || a <= 0) return;
    const ink = C.INK[I.kind];
    const br = o.breathe === false ? 0 : 0.004 * Math.sin((o.t || 0) * 1.5 + I.x * 0.01);
    const bx = M.about(I.x, I.y + 2.2 * s, o.tilt || 0, 1 + br, 1 + br);
    const xf = M.mul(o.cam, o.xf ? M.mul(o.xf, bx) : bx);
    const fb = o.fadeBottom != null ? o.fadeBottom : I.y + 1.7 * s;
    const fld = fl(p, 0, 1, { soft: 30, noise: 44, edge: 1.2, edgeW: 20 });
    const reveal = { dir: [0, 1], at: fb, soft: 100, noise: 60, noiseScale: 110 };
    const base = { xf, alpha: a, wet: o.wet || 0, time: o.t, warp: 3, warpScale: 130, rough: 1.2, flow: 0.45, flowScale: 120, gran: 0.4, flood: fld, reveal };
    if (o.lift !== 0) eng.wash(Mk[name], Object.assign({}, base, { mode: 'lift', lift: (o.lift != null ? o.lift : 0.95), soft: 1.2 }));
    eng.wash(Mk[name], Object.assign({}, base, { pig: o.pig || ink[0], pigB: o.pigB || ink[1], mix: { dir: [0, 1], at: I.y + 1.05 * s, width: 1.1 * s, noise: 1.0, noiseScale: 120, flow: 0.02 },
      density: o.density || 0.95, edge: 1.3, edgeW: 5, soft: 1.1, seed: 400 + (o.seed || 0) }));
  };

  // ------------------------------------------------------------------ pen work
  // Partial tapered stroke along a spline (pts in world px), drawn up to progress p.
  C.pen = (g, pts, p, w, per = 12) => {
    if (p <= 0) return;
    const q = WC.sampleSpline(pts, false, 1, per);
    const n = Math.max(2, Math.floor(q.length * Math.min(1, p)));
    g.lineCap = 'round';
    for (let i = 1; i < n; i++) {
      const t = i / q.length;
      g.lineWidth = Math.max(0.4, w * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.05))));
      g.beginPath(); g.moveTo(q[i - 1][0], q[i - 1][1]); g.lineTo(q[i][0], q[i][1]); g.stroke();
    }
  };
  // Pencil outline of a bust profile (the sketch before the paint).
  C.sketchBust = (g, I, p) => {
    const body = I.kind === 'darcy' ? F.darcyBody : F.lizzyBody;
    g.save(); g.translate(I.x, I.y); g.scale(I.dir, 1);
    C.pen(g, body.slice(0, 26).map(([x, y]) => [x * I.s + 6, y * I.s - 3]), p, 1.3, 8);
    g.restore();
  };
})(window.WC = window.WC || {});
