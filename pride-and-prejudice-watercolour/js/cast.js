// The cast, v2: no jointed puppets. Each figure is baked once, in a pose, into a few whole
// silhouettes (one mask per colour: gown, hair, ribbon...), so there are no joints to see.
// Life comes from the paint: figures flood in from the face, hems and ribbons move in the air,
// busts breathe, and a figure turns by flowing into its own mirror image.
(function (WC) {
  'use strict';
  const M = WC.mat, P = WC.people, F = WC.figures, A = WC.A;
  const C = WC.cast = {};

  const drawPart = (g, Pz, X, k, s, off) => {
    const part = Pz.parts[k]; let m = X[part.bone];
    if (off) m = M.mul(m, off);
    g.save(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]); part.draw(g, s); g.restore();
  };
  const fl = (p, a0, a1, o = {}) => ({ at: A.smooth(A.ramp(p, a0, a1)), soft: o.soft || 26, noise: o.noise != null ? o.noise : 36, edge: o.edge != null ? o.edge : 1.1, edgeW: o.edgeW || 16 });
  const boxOf = (m, x0, y0, x1, y1) => {
    const c = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => M.apply(m, x, y));
    const xs = c.map((q) => q[0]), ys = c.map((q) => q[1]);
    return [Math.min(...xs) - 30, Math.min(...ys) - 30, Math.max(...xs) + 30, Math.max(...ys) + 30];
  };
  C.fl = fl;
  // Once a figure has turned (mirror morph past halfway), its colour gradients turn with it.
  const mirrorMix = (e, axis) => {
    if (!e.mix) return e;
    const L = Math.hypot(e.mix.dir[0], e.mix.dir[1]) || 1, dx = e.mix.dir[0] / L, dy = e.mix.dir[1] / L;
    return Object.assign({}, e, { mix: Object.assign({}, e.mix, { dir: [-dx, dy], at: e.mix.at - 2 * axis * dx }) });
  };
  C.mirrorMix = mirrorMix;

  // ------------------------------------------------------------------ Elizabeth, full figure
  C.lizzyStyle = { gown: '#eba2b1', gownB: '#f0aca6', hem: '#c7607f', sash: '#6fb0a8', hair: '#9e4b52', hairB: '#6d3b35', ribbon: '#6fb0a8', flower: '#f4d3da', fan: '#a9d3cc', fanB: '#e58ea0' };
  // o: {x, y (ground), s (px per head), dir, pose, fan (0-3 or null), seed:[x,y]}
  C.lizzy = function (B, name, o) {
    const s = o.s, Pz = P.lizzy, dir = o.dir || 1;
    const root = P.root(o.x, o.y, s, dir, s, Pz.groundH);
    const X = P.solve(Pz.bones, o.pose || {}, s, root);
    const face = M.apply(X.head, 0.28 * s, 0.55 * s), crown = M.apply(X.head, -0.12 * s, 0.0);
    const info = { kind: 'lizzy', x: o.x, y: o.y, s, dir, X, face, crown, waistY: o.y - (Pz.groundH - 2.1) * s, topY: o.y - (Pz.groundH + 0.3) * s };
    const area = { x: o.x - 4 * s, y: o.y - 9.5 * s, w: 8 * s, h: 10.5 * s };
    const mk = (suffix, fn, seeds) => B.mask(name + suffix, fn, { area, margin: 24, flood: { seeds: seeds || [o.seed || face] } });
    mk('Body', (g) => ['skirt', 'torso', 'head', 'upper', 'fore'].forEach((k) => drawPart(g, Pz, X, k, s)));
    mk('Hair', (g) => drawPart(g, Pz, X, 'hair', s), [crown]);
    if (!o.lite) {
      mk('Hem', (g) => drawPart(g, Pz, X, 'hem', s));
      mk('Sash', (g) => drawPart(g, Pz, X, 'sash', s), [M.apply(X.torso, 0.3 * s, 2.06 * s)]);
      mk('Ribbon', (g) => drawPart(g, Pz, X, 'ribbon', s), [M.apply(X.head, 0.3 * s, 0.04 * s)]);
      mk('Flower', (g) => drawPart(g, Pz, X, 'flower', s), [M.apply(X.head, -0.07 * s, -0.1 * s)]);
    }
    if (o.fan != null) mk('Fan', (g) => { const m = X.fore; g.save(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]); Pz.fanDraw(Pz.fanStates[o.fan])(g, s); g.restore(); }, [M.apply(X.fore, 0, 4.1 * s)]);
    B.M[name + 'Info'] = info;
    return info;
  };

  // o: {cam, xf, t, p (paint-on 0..1), wet, alpha, turn (0..1), sway (px), style, lift, seed}
  C.paintLizzy = function (eng, Mk, name, o) {
    const I = Mk[name + 'Info']; if (!I) return;
    const s = I.s, p = o.p != null ? o.p : 1, a = o.alpha != null ? o.alpha : 1;
    if (p <= 0 || a <= 0) return;
    const S = Object.assign({}, C.lizzyStyle, o.style || {});
    const xf = o.xf ? M.mul(o.cam, o.xf) : o.cam;
    const amp = o.sway != null ? o.sway : 5;
    const sway = { amp, y0: I.waistY, y1: I.y, k: 1.8, omega: o.omega || 1.6, wave: 420, phase: o.phase || 0 };
    const base = { xf, alpha: a, wet: o.wet || 0, time: o.t, warp: 3, warpScale: 110, rough: 1.3, flow: 0.45, flowScale: 110, gran: 0.4, edge: 1.2, edgeW: 4.5,
      morph: o.turn ? { amount: o.turn, mirror: true, axis: I.x } : null };
    const sd = o.seed || 0;
    const W = (k, extra) => {
      let e = Object.assign({}, base, extra);
      if (o.to && o.toAmt > 0 && Mk[o.to + k]) e.morph = { amount: o.toAmt, mask: Mk[o.to + k] };
      if (o.turn >= 0.5) e = mirrorMix(e, I.x);
      eng.wash(Mk[name + k], e);
    };
    eng.beginGroup(boxOf(xf, I.x - 3.2 * s, I.topY - 0.5 * s, I.x + 3.2 * s, I.y + 0.6 * s));
    W('Body', { pig: S.gown, pigB: S.gownB, mix: { dir: [0, -1], at: -(I.waistY - 0.4 * s), width: 1.1 * s, noise: 0.8 }, density: 0.9, flood: fl(p, 0, 0.72), sway, seed: 101 + sd });
    W('Hem', { pig: S.hem, density: 0.5, soft: 3, edge: 1.4, flood: fl(p, 0.35, 0.85), sway, seed: 102 + sd });
    const sashSway = Object.assign({}, sway, { amp: amp * 1.5, y0: I.waistY - 0.1 * s, y1: I.waistY + 1.2 * s, k: 1.2, wave: 90 });
    W('Sash', { mode: 'lift', lift: 0.8, soft: 1.5, flood: fl(p, 0.5, 0.9), sway: sashSway, seed: 103 + sd });
    W('Sash', { pig: S.sash, density: 0.95, edge: 1.3, flood: fl(p, 0.5, 0.9), sway: sashSway, seed: 103 + sd });
    const hairSway = { amp: amp * 0.3, y0: I.crown[1] + 0.2 * s, y1: I.crown[1] + 1.0 * s, k: 1.3, omega: 2.0, wave: 140, phase: 1 };
    W('Hair', { pig: S.hair, pigB: S.hairB, mix: { dir: [-I.dir, 0.2], at: -I.dir * I.x, width: 0.4 * s, noise: 0.9 }, density: 1.05, rough: 1.6, roughScale: 6, gran: 0.55, flood: fl(p, 0.2, 0.75), sway: hairSway, seed: 104 + sd });
    const ribSway = { amp: amp * 0.5, y0: I.crown[1], y1: I.crown[1] + 0.8 * s, k: 1.2, omega: 2.3, wave: 70, phase: 2 };
    W('Ribbon', { mode: 'lift', lift: 0.85, soft: 1.2, flood: fl(p, 0.55, 0.95), sway: ribSway, seed: 105 + sd });
    W('Ribbon', { pig: S.ribbon, density: 0.95, edge: 1.3, flood: fl(p, 0.55, 0.95), sway: ribSway, seed: 105 + sd });
    W('Flower', { mode: 'lift', lift: 0.85, soft: 1, flood: fl(p, 0.7, 1), seed: 106 + sd });
    W('Flower', { pig: S.flower, density: 0.75, edge: 1.6, edgeW: 2.5, flood: fl(p, 0.7, 1), seed: 106 + sd });
    if (o.to && o.toAmt > 0 && Mk[o.to + 'Fan'] && !Mk[name + 'Fan']) {
      const fw = (e) => eng.wash(Mk[o.to + 'Fan'], Object.assign({}, base, e, { alpha: a * A.smooth(A.ramp(o.toAmt, 0.4, 1)) }));
      fw({ mode: 'lift', lift: 0.85, soft: 1.2, seed: 107 + sd });
      fw({ pig: S.fan, pigB: S.fanB, mix: { dir: [0, 1], at: I.y - 3.4 * s, width: 0.12 * s, noise: 0.4 }, density: 1.0, edge: 1.8, edgeW: 2.5, seed: 107 + sd });
    }
    if (Mk[name + 'Fan']) {
      W('Fan', { mode: 'lift', lift: 0.85, soft: 1.2, flood: fl(p, 0.6, 1), seed: 107 + sd });
      W('Fan', { pig: S.fan, pigB: S.fanB, mix: { dir: [0, 1], at: I.y - 3.4 * s, width: 0.12 * s, noise: 0.4 }, density: 1.0, edge: 1.8, edgeW: 2.5, flood: fl(p, 0.6, 1), seed: 107 + sd });
    }
    eng.endGroup((o.lift != null ? o.lift : 0.92) * a);
  };

  // ------------------------------------------------------------------ Darcy, full figure
  C.darcyStyle = { coat: '#6b7aa6', coatB: '#566795', face: '#8494bd', legs: '#99a3c2', boots: '#2f3656', hair: '#39406a', hairB: '#4d3a3a', lapel: '#3f4c78', cravat: '#c3cadc' };
  C.darcy = function (B, name, o) {
    const s = o.s, Pz = P.darcy, dir = o.dir || 1;
    const root = P.root(o.x, o.y, s, dir, s, Pz.groundH);
    const X = P.solve(Pz.bones, o.pose || {}, s, root);
    const face = M.apply(X.head, 0.28 * s, 0.55 * s), crown = M.apply(X.head, -0.1 * s, 0.0);
    const feet = [o.x, o.y - 0.2 * s];
    const info = { kind: 'darcy', x: o.x, y: o.y, s, dir, X, face, crown, feet, fromFeet: !!o.fromFeet, waistY: o.y - (Pz.groundH - 2.95) * s, topY: o.y - (Pz.groundH + 0.2) * s };
    const area = { x: o.x - 4 * s, y: o.y - 9.5 * s, w: 8 * s, h: 10.5 * s };
    const seed = o.fromFeet ? feet : (o.seed || face);
    const mk = (suffix, fn, seeds) => B.mask(name + suffix, fn, { area, margin: 24, flood: { seeds: seeds || [seed] } });
    const farA = M.tr(0.08 * s, 0), farL = M.tr(0.02 * s, 0);
    mk('Body', (g) => {
      drawPart(g, Pz, X, 'torso', s); drawPart(g, Pz, X, 'head', s);
      drawPart(g, Pz, X, 'upper', s); drawPart(g, Pz, X, 'fore', s);
      const u = Pz.parts.upper, f = Pz.parts.fore;
      [[u, X.upperF], [f, X.foreF]].forEach(([part, m0]) => { const m = M.mul(m0, farA); g.save(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]); part.draw(g, s); g.restore(); });
    });
    if (!o.lite) mk('Tails', (g) => drawPart(g, Pz, X, 'tails', s));
    mk('Legs', (g) => {
      drawPart(g, Pz, X, 'hips', s); drawPart(g, Pz, X, 'thigh', s); drawPart(g, Pz, X, 'shin', s);
      [[Pz.parts.thigh, X.thighF], [Pz.parts.shin, X.shinF]].forEach(([part, m0]) => { const m = M.mul(m0, farL); g.save(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]); part.draw(g, s); g.restore(); });
    });
    mk('Hair', (g) => drawPart(g, Pz, X, 'hair', s), [crown]);
    if (!o.lite) {
      mk('Boots', (g) => { drawPart(g, Pz, X, 'boot', s); const m = M.mul(X.shinF, farL); g.save(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]); Pz.parts.boot.draw(g, s); g.restore(); });
      mk('Lapel', (g) => drawPart(g, Pz, X, 'lapel', s));
      mk('Cravat', (g) => drawPart(g, Pz, X, 'cravat', s), [M.apply(X.torso, 0.35 * s, 1.05 * s)]);
    }
    B.M[name + 'Info'] = info;
    return info;
  };

  C.paintDarcy = function (eng, Mk, name, o) {
    const I = Mk[name + 'Info']; if (!I) return;
    const s = I.s, p = o.p != null ? o.p : 1, a = o.alpha != null ? o.alpha : 1;
    if (p <= 0 || a <= 0) return;
    const S = Object.assign({}, C.darcyStyle, o.style || {});
    const xf = o.xf ? M.mul(o.cam, o.xf) : o.cam;
    const amp = o.sway != null ? o.sway : 4;
    const base = { xf, alpha: a, wet: o.wet || 0, time: o.t, warp: 3, warpScale: 110, rough: 1.3, flow: 0.45, flowScale: 110, gran: 0.45, edge: 1.2, edgeW: 4.5,
      morph: o.turn ? { amount: o.turn, mirror: true, axis: I.x } : null };
    const sd = o.seed || 0;
    const W = (k, extra) => {
      let e = Object.assign({}, base, extra);
      if (o.to && o.toAmt > 0 && Mk[o.to + k]) e.morph = { amount: o.toAmt, mask: Mk[o.to + k] };
      if (o.turn >= 0.5) e = mirrorMix(e, I.x);
      eng.wash(Mk[name + k], e);
    };
    const up = o.fromFeet != null ? o.fromFeet : I.fromFeet;   // painted from the boots upward
    const order = up ? { legs: [0, 0.4], boots: [0, 0.3], tails: [0.3, 0.7], body: [0.3, 0.85], hair: [0.6, 1], lapel: [0.5, 0.9], cravat: [0.6, 1] }
      : { body: [0, 0.6], tails: [0.3, 0.75], legs: [0.35, 0.85], boots: [0.55, 1], hair: [0.15, 0.7], lapel: [0.4, 0.8], cravat: [0.5, 0.95] };
    const tailSway = { amp: amp * 1.3, y0: I.waistY, y1: I.waistY + 2.1 * s, k: 1.5, omega: o.omega || 1.8, wave: 160, phase: o.phase || 0 };
    eng.beginGroup(boxOf(xf, I.x - 3.2 * s, I.topY - 0.5 * s, I.x + 3.2 * s, I.y + 0.6 * s));
    W('Legs', { pig: S.legs, density: 0.85, flood: fl(p, ...order.legs), seed: 201 + sd });
    W('Boots', { pig: S.boots, density: 1.0, edge: 1.3, flood: fl(p, ...order.boots), seed: 202 + sd });
    W('Tails', { pig: S.coat, pigB: S.coatB, mix: { dir: [0, 1], at: I.waistY + s, width: s, noise: 0.8 }, density: 0.95, flood: fl(p, ...order.tails), sway: tailSway, seed: 203 + sd });
    W('Body', { pig: S.face, pigB: S.coat, mix: { dir: [0, 1], at: I.topY + 1.25 * s, width: 0.35 * s, noise: 0.6 }, density: 0.94, flood: fl(p, ...order.body), seed: 204 + sd });
    W('Lapel', { pig: S.lapel, density: 0.85, edge: 1.3, flood: fl(p, ...order.lapel), seed: 205 + sd });
    W('Cravat', { mode: 'lift', lift: 0.92, soft: 1.2, rough: 1, flood: fl(p, ...order.cravat), seed: 206 + sd });
    W('Cravat', { pig: S.cravat, density: 0.25, soft: 3, edge: 0.6, flood: fl(p, ...order.cravat), seed: 206 + sd });
    const hairSway = { amp: amp * 0.25, y0: I.crown[1], y1: I.crown[1] + 0.8 * s, k: 1.2, omega: 2.2, wave: 120, phase: 1.5 };
    W('Hair', { pig: S.hair, pigB: '#443f5c', mix: { dir: [I.dir, 0.4], at: I.dir * I.x + 0.4 * I.crown[1], width: 0.4 * s, noise: 0.8 }, density: 1.05, rough: 1.4, roughScale: 6, gran: 0.6, grow: -0.022 * s, flood: fl(p, ...order.hair), sway: hairSway, seed: 207 + sd });
    eng.endGroup((o.lift != null ? o.lift : 0.92) * a);
  };

  // ------------------------------------------------------------------ busts (portraits)
  const sub = (g, fn) => { g.save(); g.globalCompositeOperation = 'destination-out'; fn(); g.restore(); };
  // o: {x, y (crown), s, clip (fn g -> sets a clip path), seedEye: bool}
  C.lizzyBust = function (B, name, o) {
    const L = F.lizzy, s = o.s;
    const at = (g, fn) => { g.save(); if (o.clip) o.clip(g); g.translate(o.x, o.y); fn(); g.restore(); };
    const eye = [o.x + L.eye.iris.x * s, o.y + L.eye.iris.y * s];
    const crown = [o.x - 0.1 * s, o.y + 0.05 * s];
    const info = { kind: 'lizzyBust', x: o.x, y: o.y, s, eye, crown, flower: [o.x + F.lizzyFlower.x * s, o.y + F.lizzyFlower.y * s], cheek: [o.x + 0.3 * s, o.y + 0.66 * s] };
    const rf = (g) => { L.ribbon(g, s); L.flowerPetals(g, s); };
    const f = (seeds) => ({ flood: { seeds } });
    B.mask(name + 'Body', (g) => at(g, () => { L.body(g, s); sub(g, () => rf(g)); }), Object.assign({ maskScale: 0.8 }, f([o.seed || eye])));
    B.mask(name + 'Shade', (g) => at(g, () => { g.save(); g.beginPath(); WC.spline(g, [[-0.7, 0.72], [0.12, 0.98], [0.24, 1.3], [0.34, 1.62], [0.30, 2.5], [-0.7, 2.5]], true, s); g.clip(); L.body(g, s); g.restore(); }), Object.assign({ maskScale: 0.6 }, f([eye])));
    B.mask(name + 'Hair', (g) => at(g, () => { L.hair(g, s, WC.rng(7)); sub(g, () => rf(g)); }), f([crown]));
    B.mask(name + 'HairLights', (g) => at(g, () => L.hairLights(g, s)), { margin: 30 });
    B.mask(name + 'Ribbon', (g) => at(g, () => L.ribbon(g, s)), f([[o.x + 0.3 * s, o.y + 0.04 * s]]));
    B.mask(name + 'Lips', (g) => at(g, () => L.lips(g, s)), { margin: 30 });
    B.mask(name + 'Cheek', (g) => at(g, () => L.cheek(g, s)), { margin: 80 });
    B.mask(name + 'Earring', (g) => at(g, () => L.earring(g, s)), { margin: 20 });
    B.mask(name + 'Flower', (g) => at(g, () => L.flowerPetals(g, s)), Object.assign({ margin: 30 }, f([info.flower])));
    B.mask(name + 'FlowerHeart', (g) => at(g, () => L.flowerHeart(g, s)), { margin: 20 });
    B.M[name + 'Info'] = info;
    return info;
  };

  // o: {cam, xf, t, p, wet, alpha, blush (0..1 extra), breathe (default on), sway, fadeBottom (y), mixAt}
  C.paintLizzyBust = function (eng, Mk, name, o) {
    const I = Mk[name + 'Info']; if (!I) return;
    const s = I.s, p = o.p != null ? o.p : 1, a = o.alpha != null ? o.alpha : 1;
    if (p <= 0 || a <= 0) return;
    const br = o.breathe === false ? 0 : 0.004 * Math.sin((o.t || 0) * 1.6);
    const bx = M.about(I.x, I.y + 2.2 * s, 0, 1 + br, 1 + br);
    const xf = M.mul(o.cam, o.xf ? M.mul(o.xf, bx) : bx);
    const axis = o.axis != null ? o.axis : I.x + 0.01 * s;
    const base = { xf, alpha: a, wet: o.wet || 0, time: o.t, warp: 3.5, warpScale: 130, rough: 1.3, flow: 0.5, flowScale: 120, gran: 0.4,
      morph: o.turn ? { amount: o.turn, mirror: true, axis } : null };
    const W = (k, extra) => { let e = Object.assign({}, base, extra); if (o.turn >= 0.5) e = mirrorMix(e, axis); eng.wash(Mk[name + k], e); };
    const fb = o.fadeBottom != null ? o.fadeBottom : I.y + 1.64 * s;
    const amp = o.sway != null ? o.sway : 2.5;
    // colour mix runs from the warm face to the cooler back of the neck (relative to this bust)
    const dirv = [-1, 0.5], L = Math.hypot(dirv[0], dirv[1]);
    const mixAt = (dirv[0] * (I.x + 0.555 * s) + dirv[1] * (I.y + 0.5 * s)) / L;
    W('Body', { pig: '#f3a9a2', pigB: '#d488ae', mix: { dir: dirv, at: mixAt, width: 0.51 * s, noise: 1.0, noiseScale: 140 }, density: 0.92, edge: 1.3, edgeW: 5, soft: 1.1,
      reveal: { dir: [0, 1], at: fb, soft: 105, noise: 60, noiseScale: 110 }, flood: fl(p, 0, 0.7, { soft: 30, noise: 44, edge: 1.2 }), seed: 18 });
    W('Shade', { pig: '#d98fa6', density: 0.35, soft: 26, edge: 0.2, warp: 16, warpScale: 90, flow: 0.6, flood: fl(p, 0.2, 0.8), reveal: { dir: [0, 1], at: fb + 15, soft: 70, noise: 50 }, seed: 19 });
    const bl = o.blush || 0;
    W('Cheek', { pig: '#f2a584', pigB: '#ee8a86', mix: { dir: [1, 0], at: I.cheek[0], width: 60, noise: 0.8 }, density: (0.55 + 0.6 * bl) * A.ramp(p, 0.3, 0.8), soft: 24 + 18 * bl, edge: 0, warp: 10, warpScale: 60, flow: 0.4, seed: 20,
      grow: 30 * bl });
    W('Lips', { pig: '#c9506c', density: 0.62 * A.ramp(p, 0.5, 0.9), soft: 1.2, edge: 1.1, edgeW: 3, warp: 1.2, warpScale: 40, rough: 0.6, seed: 21 });
    const hairSway = { amp, y0: I.y + 0.25 * s, y1: I.y + 0.95 * s, k: 1.4, omega: 1.9, wave: 90, phase: 0.7 };
    W('Hair', { pig: '#9e4b52', pigB: '#6d3b35', mix: { dir: [-1, 0.2], at: (-(I.x - 0.149 * s) + 0.2 * (I.y + 0.2 * s)) / 1.0198, width: 0.38 * s, noise: 0.9 }, density: 1.05, edge: 1.1, edgeW: 5, soft: 1.1, warp: 3, rough: 1.8, roughScale: 7, flow: 0.45, gran: 0.55,
      flood: fl(p, 0.25, 0.85, { soft: 22, noise: 30 }), sway: hairSway, seed: 22 });
    W('HairLights', { mode: 'lift', lift: 0.5 * A.ramp(p, 0.8, 1), soft: 2.5, warp: 2, rough: 1.4, sway: hairSway, seed: 23 });
    const ribSway = { amp: amp * 1.6, y0: I.y + 0.05 * s, y1: I.y + 0.7 * s, k: 1.1, omega: 2.2, wave: 70, phase: 2 };
    W('Ribbon', { pig: '#6fb0a8', pigB: '#4f8f96', mix: { dir: [-1, 0.5], at: (-(I.x - 0.455 * s) + 0.5 * I.y) / 1.118, width: 0.255 * s, noise: 0.6 }, density: 1.0, edge: 1.3, edgeW: 4, warp: 2, warpScale: 70, rough: 1, flow: 0.4, gran: 0.4,
      flood: fl(p, 0.55, 0.95, { soft: 16, noise: 20 }), sway: ribSway, seed: 24 });
    W('Flower', { pig: '#f4d3da', density: 0.8, edge: 1.6, edgeW: 3, warp: 1.5, warpScale: 40, rough: 0.8, flood: fl(p, 0.7, 1, { soft: 10, noise: 10 }), seed: 25 });
    W('FlowerHeart', { pig: '#e9c46a', pigB: '#b9773a', mix: { dir: [1, 1], at: 0, width: 10, noise: 0.3 }, density: 1.1 * A.ramp(p, 0.85, 1), edge: 1.2, edgeW: 3, gran: 0.9, seed: 26 });
    W('Earring', { pig: '#e9c46a', density: 1.0 * A.ramp(p, 0.8, 1), edge: 1.5, edgeW: 2, seed: 27 });
  };

  C.darcyBust = function (B, name, o) {
    const D = F.darcy, s = o.s;
    const at = (g, fn) => { g.save(); if (o.clip) o.clip(g); g.translate(o.x, o.y); g.scale(-1, 1); fn(); g.restore(); };
    const eye = [o.x - D.eye.iris.x * s, o.y + D.eye.iris.y * s];
    const crown = [o.x + 0.1 * s, o.y + 0.05 * s];
    const info = { kind: 'darcyBust', x: o.x, y: o.y, s, eye, crown };
    const f = (seeds) => ({ flood: { seeds } });
    B.mask(name + 'Body', (g) => at(g, () => { D.body(g, s); sub(g, () => D.cravat(g, s)); }), Object.assign({ maskScale: 0.8 }, f([o.seed || eye])));
    B.mask(name + 'Coat', (g) => at(g, () => { g.save(); g.beginPath(); g.rect(-2 * s, 0.9 * s, 4 * s, 2 * s); g.clip(); D.body(g, s); g.restore(); sub(g, () => D.cravat(g, s)); }), Object.assign({ maskScale: 0.8 }, f([[o.x, o.y + 1.2 * s]])));
    B.mask(name + 'Collar', (g) => at(g, () => D.coatCollar(g, s)), f([[o.x + 0.3 * s, o.y + 0.9 * s]]));
    B.mask(name + 'Hair', (g) => at(g, () => D.hair(g, s, WC.rng(11))), f([crown]));
    B.mask(name + 'HairLights', (g) => at(g, () => D.hairLights(g, s)), { margin: 30 });
    B.mask(name + 'CravatShade', (g) => at(g, () => D.cravatShade(g, s)), { margin: 30 });
    B.mask(name + 'Rim', (g) => at(g, () => { g.save(); g.beginPath(); WC.spline(g, F.darcyBody, true, s); g.clip(); g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); WC.spline(g, F.darcyBody.slice(0, 18), false, s); g.stroke(); g.restore(); }), { margin: 30 });
    B.M[name + 'Info'] = info;
    return info;
  };

  C.paintDarcyBust = function (eng, Mk, name, o) {
    const I = Mk[name + 'Info']; if (!I) return;
    const s = I.s, p = o.p != null ? o.p : 1, a = o.alpha != null ? o.alpha : 1;
    if (p <= 0 || a <= 0) return;
    const br = o.breathe === false ? 0 : 0.0035 * Math.sin((o.t || 0) * 1.4 + 1);
    const bx = M.about(I.x, I.y + 2.2 * s, 0, 1 + br, 1 + br);
    const xf = M.mul(o.cam, o.xf ? M.mul(o.xf, bx) : bx);
    const axis = o.axis != null ? o.axis : I.x;
    const base = { xf, alpha: a, wet: o.wet || 0, time: o.t, warp: 3, warpScale: 120, rough: 1.2, flow: 0.45, flowScale: 90, gran: 0.45,
      morph: o.turn ? { amount: o.turn, mirror: true, axis } : null };
    const W = (k, extra) => { let e = Object.assign({}, base, extra); if (o.turn >= 0.5) e = mirrorMix(e, axis); eng.wash(Mk[name + k], e); };
    const fb = o.fadeBottom != null ? o.fadeBottom : null;
    const rv = fb != null ? { reveal: { dir: [0, 1], at: fb, soft: 100, noise: 60 } } : {};
    W('Body', Object.assign({ pig: '#8494bd', pigB: '#6273a0', mix: { dir: [0.3, 1], at: 0.287 * I.x + 0.958 * (I.y - 0.3 * s), width: 0.72 * s, noise: 0.7 }, density: 0.92, edge: 1.1, edgeW: 5, soft: 1.1,
      flood: fl(p, 0, 0.65, { soft: 30, noise: 44, edge: 1.2 }), seed: 6 }, rv));
    W('Coat', Object.assign({ pig: '#3f4c78', density: 0.95, edge: 0.9, edgeW: 5, soft: 1.2, flow: 0.5, gran: 0.6, flood: fl(p, 0.3, 0.9), seed: 7 }, rv));
    W('Collar', Object.assign({ pig: '#3f4c78', density: 0.8, edge: 1.2, edgeW: 4, warp: 2, rough: 1, gran: 0.5, flood: fl(p, 0.4, 0.95), seed: 8 }, rv));
    W('CravatShade', { pig: '#c3cadc', density: 0.9 * A.ramp(p, 0.5, 0.9), soft: 5, edge: 0.6, edgeW: 5, warp: 3, flow: 0.4, seed: 9 });
    const hairSway = { amp: o.sway != null ? o.sway : 1.5, y0: I.y + 0.1 * s, y1: I.y + 0.8 * s, k: 1.2, omega: 1.7, wave: 110, phase: 0.3 };
    W('Hair', { pig: '#39406a', pigB: '#4d3a3a', mix: { dir: [1, 0.4], at: 0.928 * I.x + 0.371 * (I.y + 0.3 * s) + 24, width: 0.45 * s, noise: 0.8 }, density: 1.05, edge: 1.0, edgeW: 5, soft: 1.1, warp: 3, rough: 2.2, roughScale: 6, flow: 0.55, flowScale: 70, gran: 0.6,
      flood: fl(p, 0.2, 0.8, { soft: 22, noise: 30 }), sway: hairSway, seed: 11 });
    W('Rim', { mode: 'lift', lift: 0.3 * A.ramp(p, 0.7, 1), soft: 2.5, warp: 1.5, rough: 1, seed: 13 });
    W('HairLights', { mode: 'lift', lift: 0.4 * A.ramp(p, 0.8, 1), soft: 3, warp: 2, rough: 1.5, sway: hairSway, seed: 14 });
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
  // Eye drawn stroke by stroke (lid, lower lid, lashes, brow), then the iris.
  C.eye = (g, eye, s, p = 1, closed = false) => {
    if (closed) { F.inkEyeClosed(g, eye, s); return; }
    const n = eye.strokes.length;
    eye.strokes.forEach((st, i) => {
      const lp = A.clamp(p * (n + 1) - i);
      if (lp > 0) C.pen(g, st.pts.map(([x, y]) => [x * s, y * s]), lp, st.w * s, 10);
    });
    const ip = A.clamp(p * (n + 1) - n);
    if (ip > 0) WC.fillCircle(g, eye.iris.x * s, eye.iris.y * s, eye.iris.r * s * ip);
  };
  C.inkLizzyBust = (g, I, o = {}) => { g.save(); if (o.xf) g.transform(...o.xf); g.translate(I.x, I.y); C.eye(g, F.lizzy.eye, I.s, o.p != null ? o.p : 1, o.closed); g.restore(); };
  C.inkDarcyBust = (g, I, o = {}) => { g.save(); if (o.xf) g.transform(...o.xf); g.translate(I.x, I.y); g.scale(-1, 1); C.eye(g, F.darcy.eye, I.s, o.p != null ? o.p : 1, o.closed); g.restore(); };
  // Pencil outline of a bust profile, drawn along the face (sketch before the paint).
  C.sketchLizzy = (g, I, p, flip = 1) => { g.save(); g.translate(I.x, I.y); g.scale(flip, 1); C.pen(g, F.lizzyBody.slice(0, 26).map(([x, y]) => [x * I.s + 6, y * I.s - 3]), p, 1.3, 8); g.restore(); };
  C.sketchDarcy = (g, I, p) => { g.save(); g.translate(I.x, I.y); g.scale(-1, 1); C.pen(g, F.darcyBody.slice(0, 24).map(([x, y]) => [x * I.s + 6, y * I.s - 3]), p, 1.3, 8); g.restore(); };
})(window.WC = window.WC || {});
