/* Shapes: procedural line-art library. Every drawing is a set of polylines that the morph engine can flow between. */
(function () {
  'use strict';
  const V = window.V, M = V.M;
  const Sh = (V.Sh = {});
  const hex = M.hex;
  Sh.C = {
    pink: hex('#ff2a6d'), hot: hex('#ff3cac'), cyan: hex('#05d9e8'), blue: hex('#2b6bff'), purple: hex('#a23cff'),
    yellow: hex('#ffd319'), orange: hex('#ff8a00'), lime: hex('#7dff3a'), white: [1, 1, 1], red: hex('#ff2020'), mag: hex('#ff00e6'),
  };
  const C = Sh.C;

  // ------------------------------------------------------------ primitive point generators
  const seg = (n, f) => { const o = []; for (let i = 0; i <= n; i++) o.push(f(i / n)); return o; };
  Sh.line = (x0, y0, x1, y1, z0 = 0, z1 = z0) => [[x0, y0, z0], [x1, y1, z1]];
  Sh.pl = (pts, z = 0) => pts.map((p) => [p[0], p[1], p[2] == null ? z : p[2]]);
  Sh.arc = (cx, cy, r, a0, a1, n, z = 0) => seg(n || Math.max(8, Math.ceil(Math.abs(a1 - a0) * r * 40 + 6)), (t) => {
    const a = a0 + (a1 - a0) * t; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
  });
  Sh.ell = (cx, cy, rx, ry, a0 = 0, a1 = M.TAU, rotA = 0, n, z = 0) => seg(n || 48, (t) => {
    const a = a0 + (a1 - a0) * t, x = Math.cos(a) * rx, y = Math.sin(a) * ry, c = Math.cos(rotA), s = Math.sin(rotA);
    return [cx + x * c - y * s, cy + x * s + y * c, z];
  });
  Sh.circ = (cx, cy, r, n, z = 0) => Sh.arc(cx, cy, r, 0, M.TAU, n || Math.max(16, Math.ceil(r * 90 + 10)), z).slice(0, -1);
  Sh.rrect = (cx, cy, w, h, r = 0, z = 0) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    r = Math.min(r, w / 2, h / 2);
    if (r <= 0) return [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
    const o = [];
    const q = (ax, ay, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); o.push([ax + Math.cos(a) * r, ay + Math.sin(a) * r, z]); } };
    q(x1 - r, y0 + r, -Math.PI / 2); q(x1 - r, y1 - r, 0); q(x0 + r, y1 - r, Math.PI / 2); q(x0 + r, y0 + r, Math.PI);
    return o;
  };
  Sh.bez = (p0, p1, p2, p3, n = 24) => seg(n, (t) => {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1], (p0[2] || 0)];
  });
  Sh.spline = (pts, n = 10, closed = false) => {
    const o = [], N = pts.length;
    const P = (i) => closed ? pts[(i + N) % N] : pts[M.clamp(i, 0, N - 1)];
    const L = closed ? N : N - 1;
    for (let i = 0; i < L; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        o.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), f(p0[2] || 0, p1[2] || 0, p2[2] || 0, p3[2] || 0)]);
      }
    }
    if (!closed) o.push([...pts[N - 1].slice(0, 2), pts[N - 1][2] || 0]);
    return o;
  };
  Sh.star = (cx, cy, r1, r2, n = 5, rot = Math.PI / 2, z = 0) => {
    const o = [];
    for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, r = i % 2 ? r2 : r1; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]); }
    return o;
  };
  Sh.helix = (a, b, r, turns, n = 300) => {
    // coil from a to b (3D), radius r
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d);
    const t = d.map((x) => x / L);
    let u = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let nx = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]];
    const ln = Math.hypot(...nx); nx = nx.map((x) => x / ln);
    const ny = [t[1] * nx[2] - t[2] * nx[1], t[2] * nx[0] - t[0] * nx[2], t[0] * nx[1] - t[1] * nx[0]];
    return seg(n, (s) => {
      const ang = s * turns * M.TAU, c = Math.cos(ang) * r, si = Math.sin(ang) * r;
      return [a[0] + d[0] * s + nx[0] * c + ny[0] * si, a[1] + d[1] * s + nx[1] * c + ny[1] * si, a[2] + d[2] * s + nx[2] * c + ny[2] * si];
    });
  };
  Sh.tf = (pts, o = {}) => {
    const s = o.s == null ? 1 : o.s, sx = (o.sx == null ? 1 : o.sx) * s, sy = (o.sy == null ? 1 : o.sy) * s, r = o.r || 0;
    const c = Math.cos(r), sn = Math.sin(r), x = o.x || 0, y = o.y || 0, z = o.z || 0;
    return pts.map((p) => { const px = p[0] * sx, py = p[1] * sy; return [x + px * c - py * sn, y + px * sn + py * c, (p[2] || 0) * s + z]; });
  };

  // shape builder
  Sh.make = () => {
    const strokes = [];
    const S = {
      strokes,
      add(p, c, o = {}) { strokes.push({ p, c: c || C.white, w: o.w == null ? 0.011 : o.w, closed: !!o.closed, a: o.a == null ? 1 : o.a }); return S; },
      closed(p, c, o = {}) { o.closed = true; return S.add(p, c, o); },
      merge(other, tf) { for (const s of other.strokes) strokes.push(Object.assign({}, s, { p: tf ? Sh.tf(s.p, tf) : s.p })); return S; },
    };
    return S;
  };
  Sh.xform = (shape, tf) => { const S = Sh.make(); S.merge(shape, tf); return S; };

  // ================================================================ OBJECTS
  // BMX bike (side view). o.col for frame, wheels colour
  Sh.bike = (o = {}) => {
    const S = Sh.make(), f = o.col || C.cyan, wc = o.wcol || C.pink;
    const R = 0.36, wb = 0.62, wy = -0.25;
    const rear = [-wb, wy], front = [wb, wy];
    S.closed(Sh.circ(rear[0], rear[1], R, 40), wc);
    S.closed(Sh.circ(front[0], front[1], R, 40), wc);
    S.closed(Sh.circ(rear[0], rear[1], R * 0.86, 36), wc, { w: 0.006 });
    S.closed(Sh.circ(front[0], front[1], R * 0.86, 36), wc, { w: 0.006 });
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3 + 0.3;
      for (const w of [rear, front]) S.add(Sh.line(w[0] - Math.cos(a) * R * 0.84, w[1] - Math.sin(a) * R * 0.84, w[0] + Math.cos(a) * R * 0.84, w[1] + Math.sin(a) * R * 0.84), wc, { w: 0.004 });
    }
    const bb = [-0.12, -0.3], seat = [-0.25, 0.22], head = [0.4, 0.2];
    S.add(Sh.pl([rear, bb, head, seat, rear]), f, { w: 0.014 });
    S.add(Sh.pl([seat, bb]), f, { w: 0.014 });
    S.add(Sh.pl([head, [0.47, 0.32], front]), f, { w: 0.013 });
    // handlebars (risers)
    S.add(Sh.pl([[0.47, 0.32], [0.43, 0.5], [0.3, 0.52], [0.26, 0.47]]), f, { w: 0.012 });
    S.add(Sh.pl([[0.47, 0.32], [0.53, 0.52], [0.62, 0.53]]), f, { w: 0.012 });
    // seat
    S.add(Sh.pl([seat, [-0.27, 0.3]]), f);
    S.add(Sh.spline([[-0.42, 0.3], [-0.3, 0.33], [-0.14, 0.31]], 6), f, { w: 0.016 });
    // chainring + crank + pedal
    S.closed(Sh.circ(bb[0], bb[1], 0.08, 20), f, { w: 0.008 });
    S.add(Sh.pl([[bb[0] - 0.12, bb[1] + 0.1], [bb[0] + 0.12, bb[1] - 0.1]]), f, { w: 0.01 });
    S.add(Sh.pl([[bb[0] + 0.07, bb[1] - 0.1], [bb[0] + 0.19, bb[1] - 0.1]]), f, { w: 0.012 });
    // chain
    S.add(Sh.pl([[bb[0], bb[1] + 0.08], [rear[0], rear[1] + 0.05]]), f, { w: 0.004 });
    S.add(Sh.pl([[bb[0], bb[1] - 0.08], [rear[0], rear[1] - 0.05]]), f, { w: 0.004 });
    return S;
  };
  Sh.bmxPile = () => {
    const S = Sh.make();
    S.merge(Sh.bike({ col: C.cyan, wcol: C.pink }), { x: -0.25, y: 0.05, s: 1.05, r: -0.08 });
    S.merge(Sh.bike({ col: C.yellow, wcol: C.purple }), { x: 0.55, y: -0.18, s: 0.85, r: 0.35, sx: -1 });
    // grass + fence
    for (let i = 0; i < 9; i++) {
      const x = -1.5 + i * 0.37;
      S.add(Sh.pl([[x - 0.05, -0.72], [x, -0.6], [x + 0.03, -0.72], [x + 0.09, -0.63], [x + 0.11, -0.72]]), C.lime, { w: 0.006 });
    }
    for (let i = 0; i < 8; i++) {
      const x = -1.55 + i * 0.44;
      S.add(Sh.pl([[x, -0.72], [x, 0.62], [x + 0.08, 0.72], [x + 0.16, 0.62], [x + 0.16, -0.72]]), C.white, { w: 0.005, a: 0.5 });
    }
    S.add(Sh.line(-1.7, 0.4, 1.7, 0.4), C.white, { w: 0.005, a: 0.5 });
    S.add(Sh.line(-1.7, -0.45, 1.7, -0.45), C.white, { w: 0.005, a: 0.5 });
    return S;
  };

  // kid with sun-bleached hair + gap-toothed grin
  Sh.kidFace = () => {
    const S = Sh.make(), sk = C.orange, hair = C.yellow, c = C.pink;
    S.add(Sh.spline([[-0.48, 0.12], [-0.5, -0.25], [-0.3, -0.62], [0, -0.74], [0.3, -0.62], [0.5, -0.25], [0.48, 0.12]], 8), sk, { w: 0.014 });
    // ears
    S.add(Sh.spline([[-0.48, 0.02], [-0.6, 0.04], [-0.6, -0.16], [-0.47, -0.2]], 6), sk);
    S.add(Sh.spline([[0.48, 0.02], [0.6, 0.04], [0.6, -0.16], [0.47, -0.2]], 6), sk);
    // messy bleached hair: bowl + spiky strands
    S.add(Sh.spline([[-0.52, 0.08], [-0.55, 0.42], [-0.3, 0.66], [0.05, 0.72], [0.38, 0.62], [0.56, 0.36], [0.5, 0.06]], 8), hair, { w: 0.014 });
    const tips = [[-0.62, 0.55], [-0.4, 0.86], [-0.12, 0.95], [0.18, 0.93], [0.45, 0.82], [0.66, 0.5]];
    const roots = [[-0.45, 0.45], [-0.25, 0.64], [-0.02, 0.7], [0.2, 0.68], [0.38, 0.55], [0.5, 0.35]];
    tips.forEach((t, i) => S.add(Sh.spline([roots[i], [(roots[i][0] + t[0]) / 2 + 0.05, (roots[i][1] + t[1]) / 2], t], 6), hair, { w: 0.01 }));
    // fringe
    S.add(Sh.pl([[-0.45, 0.2], [-0.32, 0.36], [-0.25, 0.18], [-0.1, 0.38], [0.0, 0.16], [0.14, 0.38], [0.22, 0.17], [0.36, 0.36], [0.45, 0.16]]), hair, { w: 0.01 });
    // eyes (squinting smile) + brows
    S.add(Sh.arc(-0.2, -0.02, 0.09, 0.2, Math.PI - 0.2, 10), c, { w: 0.012 });
    S.add(Sh.arc(0.2, -0.02, 0.09, 0.2, Math.PI - 0.2, 10), c, { w: 0.012 });
    S.add(Sh.spline([[-0.32, 0.12], [-0.2, 0.17], [-0.08, 0.13]], 5), hair, { w: 0.01 });
    S.add(Sh.spline([[0.08, 0.13], [0.2, 0.17], [0.32, 0.12]], 5), hair, { w: 0.01 });
    // nose + freckles
    S.add(Sh.spline([[0.0, -0.08], [0.05, -0.2], [-0.03, -0.22]], 5), sk, { w: 0.008 });
    for (const [x, y] of [[-0.28, -0.16], [-0.22, -0.2], [-0.33, -0.21], [0.28, -0.16], [0.22, -0.2], [0.33, -0.21]]) S.closed(Sh.circ(x, y, 0.012, 8), sk, { w: 0.006 });
    // big grin
    S.add(Sh.spline([[-0.3, -0.33], [-0.15, -0.5], [0.0, -0.54], [0.15, -0.5], [0.3, -0.33]], 8), c, { w: 0.013 });
    S.add(Sh.line(-0.3, -0.33, 0.3, -0.33), c, { w: 0.011 });
    // teeth with the famous gap
    const tx = [-0.22, -0.13, -0.045, 0.045, 0.13, 0.22];
    for (let i = 0; i < tx.length - 1; i++) {
      if (i === 2) continue; // the gap
      S.add(Sh.pl([[tx[i] + 0.008, -0.33], [tx[i] + 0.008, -0.41], [tx[i + 1] - 0.008, -0.41], [tx[i + 1] - 0.008, -0.33]]), C.white, { w: 0.007 });
    }
    // sun behind: rays
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * M.TAU + 0.13;
      S.add(Sh.line(Math.cos(a) * 1.0, Math.sin(a) * 0.95, Math.cos(a) * 1.25, Math.sin(a) * 1.15), C.yellow, { w: 0.01, a: 0.8 });
    }
    return S;
  };

  // arcade cabinet (front 3/4-ish flat view)
  Sh.arcade = () => {
    const S = Sh.make(), b = C.purple, t = C.cyan;
    S.add(Sh.pl([[-0.55, -0.95], [-0.55, 0.15], [-0.62, 0.3], [-0.5, 0.62], [-0.55, 0.95], [0.55, 0.95], [0.5, 0.62], [0.62, 0.3], [0.55, 0.15], [0.55, -0.95]]), b, { closed: true, w: 0.014 });
    S.closed(Sh.rrect(0, 0.79, 0.98, 0.24, 0.03), C.yellow, { w: 0.01 }); // marquee
    S.closed(Sh.rrect(0, 0.36, 0.86, 0.5, 0.06), t, { w: 0.012 }); // screen bezel
    S.add(Sh.pl([[-0.62, 0.3], [0.62, 0.3]]), b);
    S.add(Sh.pl([[-0.62, 0.3], [-0.55, 0.15], [0.55, 0.15], [0.62, 0.3]]), b, { w: 0.01 });
    // control panel
    S.closed(Sh.rrect(0, 0.05, 1.1, 0.16, 0.03), t, { w: 0.01 });
    S.closed(Sh.circ(-0.3, 0.06, 0.035, 12), C.red, { w: 0.008 });
    S.add(Sh.line(-0.3, 0.06, -0.33, 0.2), C.red, { w: 0.01 });
    S.closed(Sh.circ(-0.33, 0.21, 0.035, 12), C.red, { w: 0.01 });
    for (let i = 0; i < 3; i++) S.closed(Sh.circ(0.05 + i * 0.13, 0.06, 0.03, 12), [C.yellow, C.pink, C.lime][i], { w: 0.008 });
    // coin door
    S.closed(Sh.rrect(0, -0.45, 0.42, 0.42, 0.02), C.white, { w: 0.008, a: 0.8 });
    S.closed(Sh.rrect(-0.09, -0.37, 0.07, 0.14, 0.01), C.orange, { w: 0.007 });
    S.closed(Sh.rrect(0.09, -0.37, 0.07, 0.14, 0.01), C.orange, { w: 0.007 });
    S.add(Sh.line(-0.12, -0.56, 0.12, -0.56), C.white, { w: 0.006 });
    return S;
  };

  // chomper (screen content) + dots — neon yellow
  Sh.chomper = (cx, cy, r, mouth, dir = 0) => {
    const a = mouth * 0.7 + 0.02;
    return [...Sh.arc(cx, cy, r, dir + a, dir + M.TAU - a, 30), [cx, cy, 0]];
  };

  Sh.coins = () => {
    const S = Sh.make();
    S.closed(Sh.rrect(0, 0, 1.3, 1.5, 0.05), C.purple, { w: 0.013 });
    S.closed(Sh.rrect(-0.28, 0.3, 0.18, 0.44, 0.03), C.orange, { w: 0.012 });
    S.closed(Sh.rrect(0.28, 0.3, 0.18, 0.44, 0.03), C.orange, { w: 0.012 });
    S.add(Sh.line(-0.28, 0.16, -0.28, 0.44), C.white, { w: 0.006 });
    S.add(Sh.line(0.28, 0.16, 0.28, 0.44), C.white, { w: 0.006 });
    S.closed(Sh.rrect(0, -0.35, 0.8, 0.3, 0.03), C.cyan, { w: 0.01 });
    return S;
  };
  Sh.coin = (cx, cy, r, spin) => Sh.ell(cx, cy, r * Math.max(0.08, Math.abs(Math.cos(spin))), r, 0, M.TAU, 0, 32).slice(0, -1);

  // cassette (front), reels drawn separately (Sh.reels) so they can spin
  Sh.cassette = (o = {}) => {
    const S = Sh.make(), sh = o.col || C.pink, acc = o.acc || C.cyan;
    S.closed(Sh.rrect(0, 0, 1.9, 1.2, 0.07), sh, { w: 0.015 });
    S.closed(Sh.rrect(0, 0.17, 1.66, 0.7, 0.05), acc, { w: 0.01 });
    S.closed(Sh.rrect(0, 0.08, 0.95, 0.3, 0.12), sh, { w: 0.011 });
    S.add(Sh.line(-0.78, 0.45, 0.78, 0.45), acc, { w: 0.005, a: 0.7 });
    S.add(Sh.line(-0.78, 0.37, -0.52, 0.37), acc, { w: 0.005, a: 0.7 });
    S.add(Sh.line(0.52, 0.37, 0.78, 0.37), acc, { w: 0.005, a: 0.7 });
    S.add(Sh.pl([[-0.62, -0.6], [-0.5, -0.33], [0.5, -0.33], [0.62, -0.6]]), sh, { w: 0.012 });
    S.closed(Sh.circ(-0.3, -0.47, 0.04, 12), acc, { w: 0.007 });
    S.closed(Sh.circ(0.3, -0.47, 0.04, 12), acc, { w: 0.007 });
    S.closed(Sh.rrect(-0.12, -0.47, 0.06, 0.06, 0), acc, { w: 0.006 });
    S.closed(Sh.rrect(0.12, -0.47, 0.06, 0.06, 0), acc, { w: 0.006 });
    for (const [x, y] of [[-0.87, 0.53], [0.87, 0.53], [-0.87, -0.53], [0.87, -0.53], [0, -0.52]]) S.closed(Sh.circ(x, y, 0.025, 10), sh, { w: 0.006 });
    S.closed(Sh.circ(-0.33, 0.08, 0.11, 24), acc, { w: 0.009 });
    S.closed(Sh.circ(0.33, 0.08, 0.11, 24), acc, { w: 0.009 });
    return S;
  };
  // reel hubs with teeth (dynamic rotation) + tape pack
  Sh.reels = (ang, o = {}) => {
    const out = [], c = o.col || C.white, pack1 = o.pack1 == null ? 0.2 : o.pack1, pack2 = o.pack2 == null ? 0.13 : o.pack2;
    for (const [x, sgn, pk] of [[-0.33, 1, pack1], [0.33, 1, pack2]]) {
      const a0 = ang * sgn;
      const hub = [];
      for (let i = 0; i <= 12; i++) {
        const a = a0 + (i / 12) * M.TAU, r = i % 2 ? 0.05 : 0.066;
        hub.push([x + Math.cos(a) * r, 0.08 + Math.sin(a) * r, 0]);
      }
      out.push({ p: hub, c, w: 0.007 });
      out.push({ p: Sh.circ(x, 0.08, pk, 28).concat([Sh.circ(x, 0.08, pk, 28)[0]]), c: o.tape || [0.5, 0.25, 0.1], w: 0.004, a: 0.8 });
    }
    return out;
  };

  // tape deck with transport keys and VU meters (needles dynamic via Sh.vuNeedles)
  Sh.tapeDeck = () => {
    const S = Sh.make(), b = C.cyan;
    S.closed(Sh.rrect(0, 0.05, 2.9, 1.3, 0.05), b, { w: 0.014 });
    S.closed(Sh.rrect(-0.6, 0.25, 1.4, 0.75, 0.04), C.purple, { w: 0.011 }); // cassette door
    S.closed(Sh.rrect(-0.6, 0.28, 0.9, 0.22, 0.08), C.purple, { w: 0.008 });
    // VU meters
    for (const x of [0.62, 1.12]) {
      S.closed(Sh.rrect(x, 0.36, 0.42, 0.36, 0.03), C.yellow, { w: 0.009 });
      S.add(Sh.arc(x, 0.22, 0.2, 0.55, Math.PI - 0.55, 14), C.white, { w: 0.005 });
      S.add(Sh.arc(x, 0.22, 0.2, 0.55, 0.9, 6), C.red, { w: 0.01 });
    }
    // transport keys
    const keys = ['rec', 'rew', 'play', 'ff', 'stop', 'pause'];
    keys.forEach((k, i) => {
      const x = -1.25 + i * 0.3, y = -0.42;
      S.closed(Sh.rrect(x, y, 0.26, 0.22, 0.03), k === 'rec' ? C.red : C.white, { w: 0.009 });
      if (k === 'rec') S.closed(Sh.circ(x, y, 0.045, 14), C.red, { w: 0.01 });
      if (k === 'play') S.closed(Sh.pl([[x - 0.04, y - 0.05], [x + 0.05, y], [x - 0.04, y + 0.05]]), C.white, { w: 0.008 });
      if (k === 'rew' || k === 'ff') {
        const s = k === 'ff' ? 1 : -1;
        for (const dx of [-0.04, 0.02]) S.closed(Sh.pl([[x + dx * s - 0.02 * s, y - 0.045], [x + dx * s + 0.04 * s, y], [x + dx * s - 0.02 * s, y + 0.045]]), C.white, { w: 0.007 });
      }
      if (k === 'stop') S.closed(Sh.rrect(x, y, 0.08, 0.08, 0), C.white, { w: 0.008 });
      if (k === 'pause') { S.add(Sh.line(x - 0.025, y - 0.045, x - 0.025, y + 0.045), C.white, { w: 0.009 }); S.add(Sh.line(x + 0.025, y - 0.045, x + 0.025, y + 0.045), C.white, { w: 0.009 }); }
    });
    // speaker grille-ish lines
    for (let i = 0; i < 5; i++) S.add(Sh.line(0.55, -0.25 - i * 0.07, 1.3, -0.25 - i * 0.07), b, { w: 0.004, a: 0.6 });
    return S;
  };
  Sh.vuNeedle = (x, lvl) => {
    const a = Math.PI - 0.55 - lvl * (Math.PI - 1.1);
    return [[x, 0.22, 0], [x + Math.cos(a) * 0.19, 0.22 + Math.sin(a) * 0.19, 0]];
  };
  // finger pressing a key (line art)
  Sh.finger = (x, y) => [
    { p: Sh.spline([[x - 0.095, y + 1.0], [x - 0.09, y + 0.3], [x - 0.08, y + 0.1], [x - 0.045, y + 0.025], [x, y + 0.01], [x + 0.045, y + 0.025], [x + 0.08, y + 0.1], [x + 0.09, y + 0.3], [x + 0.095, y + 1.0]], 6), w: 0.012 },
    { p: Sh.rrect(x, y + 0.11, 0.1, 0.13, 0.045), w: 0.008, closed: true },
    { p: Sh.arc(x, y + 0.43, 0.06, Math.PI * 0.2, Math.PI * 0.8, 8), w: 0.006 },
    { p: Sh.arc(x, y + 0.48, 0.05, Math.PI * 0.25, Math.PI * 0.75, 8), w: 0.006 },
    { p: Sh.arc(x, y + 0.72, 0.06, Math.PI * 0.2, Math.PI * 0.8, 8), w: 0.006 },
  ];

  // bedroom wall with three posters
  Sh.posters = () => {
    const S = Sh.make();
    const post = (cx, cy, w, h, c, tilt) => {
      S.closed(Sh.tf(Sh.rrect(0, 0, w, h, 0.01), { x: cx, y: cy, r: tilt }), c, { w: 0.011 });
      for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) S.closed(Sh.tf(Sh.rrect(sx * (w / 2 - 0.02), sy * (h / 2 - 0.02), 0.1, 0.04, 0), { x: cx, y: cy, r: tilt + 0.6 * sx * sy }), C.white, { w: 0.005, a: 0.7 });
    };
    post(-1.05, 0.12, 0.8, 1.1, C.pink, -0.05);
    post(0.05, 0.2, 0.9, 1.25, C.cyan, 0.02);
    post(1.08, 0.08, 0.75, 1.0, C.yellow, 0.06);
    // poster 1: lightning bolt + stars
    S.closed(Sh.tf(Sh.pl([[0.05, 0.4], [-0.15, 0.0], [0.0, 0.0], [-0.08, -0.4], [0.18, 0.08], [0.02, 0.08], [0.15, 0.4]]), { x: -1.05, y: 0.15, r: -0.05 }), C.yellow, { w: 0.01 });
    S.closed(Sh.star(-1.3, 0.48, 0.07, 0.03), C.white, { w: 0.006 });
    S.closed(Sh.star(-0.8, -0.3, 0.06, 0.025), C.white, { w: 0.006 });
    // poster 2: guitar hero silhouette (simplified guitar)
    S.merge(Sh.guitar({ col: C.pink, simple: true }), { x: 0.05, y: 0.2, s: 0.5, r: 0.5 });
    // poster 3: wedge car + sun
    S.closed(Sh.tf(Sh.pl([[-0.3, -0.05], [-0.25, 0.05], [0.0, 0.1], [0.2, 0.05], [0.3, -0.05]]), { x: 1.08, y: -0.2, r: 0.06 }), C.cyan, { w: 0.009 });
    S.closed(Sh.circ(1.08, 0.25, 0.18, 24), C.orange, { w: 0.009 });
    for (let i = 0; i < 3; i++) S.add(Sh.line(0.92, 0.2 - i * 0.06, 1.24, 0.2 - i * 0.06), C.purple, { w: 0.006 });
    // wall + bed headboard hint
    S.add(Sh.line(-1.78, -0.72, 1.78, -0.72), C.white, { w: 0.006, a: 0.6 });
    return S;
  };

  // phone + coiled cord down a hallway (3D)
  Sh.phoneHall = () => {
    const S = Sh.make(), w = C.white;
    // corridor edges receding in z
    const hw = 1.2, hh = 1.0, z0 = 0.5, z1 = -14;
    for (const [x, y] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) S.add([[x, y, z0], [x, y, z1]], C.purple, { w: 0.012 });
    // door frames along the walls
    for (let i = 0; i < 5; i++) {
      const z = -1.5 - i * 2.6;
      for (const s of [-1, 1]) S.add([[s * hw, -hh, z], [s * hw, 0.45, z], [s * hw, 0.45, z - 1.0], [s * hw, -hh, z - 1.0]], C.cyan, { w: 0.01 });
    }
    // end of hall: open door with light
    S.closed([[-0.4, -hh, z1], [0.4, -hh, z1], [0.4, 0.6, z1], [-0.4, 0.6, z1]], C.yellow, { w: 0.02 });
    // wall phone at left front
    const px = -1.0, py = 0.05, pz = -0.2;
    S.closed(Sh.tf(Sh.rrect(0, 0, 0.34, 0.5, 0.05), { x: px, y: py, z: pz }), C.pink, { w: 0.012 });
    S.add(Sh.tf(Sh.spline([[-0.12, 0.3], [-0.14, 0.12], [-0.08, -0.05], [-0.08, -0.25], [-0.13, -0.38]], 6), { x: px + 0.25, y: py, z: pz }), C.pink, { w: 0.02 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) S.closed(Sh.tf(Sh.circ(-0.08 + c * 0.08, 0.1 - r * 0.09, 0.022, 8), { x: px, y: py, z: pz }), w, { w: 0.005 });
    // coiled cord stretching down the hall
    S.add(Sh.helix([px + 0.1, py - 0.4, pz], [0.15, -0.92, -13.6], 0.04, 95, 1200), C.pink, { w: 0.007 });
    return S;
  };

  // streetlights both sides of a road, receding
  Sh.streetlights = (n = 7) => {
    const S = Sh.make();
    for (let i = 0; i < n; i++) {
      const z = -1 - i * 3.2;
      for (const s of [-1, 1]) {
        const x = s * 2.0;
        S.add([[x, -1.0, z], [x, 1.1, z], [x - s * 0.15, 1.35, z], [x - s * 0.55, 1.35, z]], C.white, { w: 0.02 });
        S.closed([[x - s * 0.45, 1.33, z], [x - s * 0.7, 1.33, z], [x - s * 0.65, 1.26, z], [x - s * 0.5, 1.26, z]], C.orange, { w: 0.03 });
      }
    }
    S.add([[-1.4, -1.0, 2], [-1.4, -1.0, -30]], C.white, { w: 0.02 });
    S.add([[1.4, -1.0, 2], [1.4, -1.0, -30]], C.white, { w: 0.02 });
    return S;
  };

  // kid riding a BMX (for the moon crossing)
  Sh.rider = () => {
    const S = Sh.make();
    S.merge(Sh.bike({ col: C.white, wcol: C.white }));
    const c = C.white;
    S.closed(Sh.circ(0.18, 0.86, 0.12, 20), c, { w: 0.013 });
    S.add(Sh.spline([[0.08, 0.95], [0.2, 1.0], [0.32, 0.93], [0.4, 0.92]], 5), c, { w: 0.012 }); // cap
    S.add(Sh.spline([[0.12, 0.74], [-0.05, 0.55], [-0.2, 0.34]], 6), c, { w: 0.03 }); // torso
    S.add(Sh.spline([[0.08, 0.7], [0.25, 0.6], [0.36, 0.5]], 5), c, { w: 0.018 }); // arm
    S.add(Sh.spline([[-0.2, 0.34], [0.0, 0.1], [-0.02, -0.22]], 5), c, { w: 0.022 }); // leg
    S.add(Sh.spline([[-0.2, 0.34], [-0.15, 0.05], [-0.22, -0.38]], 5), c, { w: 0.022 });
    // cape-like towel/blanket flapping (E.T. basket nod)
    S.closed(Sh.rrect(0.62, 0.52, 0.22, 0.14, 0.03), c, { w: 0.01 });
    return S;
  };

  // volume knob with ticks 0..11
  Sh.knob = (o = {}) => {
    const S = Sh.make();
    S.closed(Sh.circ(0, 0, 0.62, 64), o.col || C.cyan, { w: 0.016 });
    S.closed(Sh.circ(0, 0, 0.5, 56), o.col2 || C.purple, { w: 0.008 });
    for (let i = 0; i <= 11; i++) {
      const a = M.mix(Math.PI * 1.25, -Math.PI * 0.35, i / 11);
      S.add(Sh.line(Math.cos(a) * 0.72, Math.sin(a) * 0.72, Math.cos(a) * 0.84, Math.sin(a) * 0.84), i === 11 ? C.red : C.white, { w: i === 11 ? 0.02 : 0.01 });
    }
    return S;
  };
  Sh.knobAngle = (v) => M.mix(Math.PI * 1.25, -Math.PI * 0.35, v / 11);

  // wedge car (rear view) — "DeLorean-ish" but generic
  Sh.car = () => {
    const S = Sh.make(), b = C.cyan;
    S.closed(Sh.pl([[-0.95, -0.25], [-0.95, 0.05], [-0.7, 0.18], [-0.45, 0.5], [0.45, 0.5], [0.7, 0.18], [0.95, 0.05], [0.95, -0.25]]), b, { w: 0.015 });
    S.closed(Sh.pl([[-0.4, 0.44], [-0.6, 0.2], [0.6, 0.2], [0.4, 0.44]]), C.purple, { w: 0.01 }); // rear window louvres
    for (let i = 1; i < 5; i++) { const y = 0.2 + i * 0.048; S.add(Sh.line(-0.6 + i * 0.04, y, 0.6 - i * 0.04, y), C.purple, { w: 0.005 }); }
    S.closed(Sh.rrect(-0.62, -0.02, 0.5, 0.1, 0.02), C.red, { w: 0.014 }); // tail lights
    S.closed(Sh.rrect(0.62, -0.02, 0.5, 0.1, 0.02), C.red, { w: 0.014 });
    S.closed(Sh.rrect(0, -0.1, 0.36, 0.1, 0.01), C.white, { w: 0.007 }); // plate
    S.closed(Sh.rrect(-0.72, -0.4, 0.3, 0.3, 0.05), b, { w: 0.013 }); // tyres
    S.closed(Sh.rrect(0.72, -0.4, 0.3, 0.3, 0.05), b, { w: 0.013 });
    S.add(Sh.line(-0.57, -0.25, 0.57, -0.25), b, { w: 0.01 });
    // gull-wing hint
    S.add(Sh.spline([[-0.45, 0.5], [-0.2, 0.62], [0.2, 0.62], [0.45, 0.5]], 6), b, { w: 0.008, a: 0.7 });
    return S;
  };

  // pair of sneakers (side view)
  Sh.sneaker = (x = 0, y = 0, s = 1, flip = 1) => {
    const S = Sh.make(), c = C.white;
    const p = (pts) => Sh.tf(pts, { x, y, s, sx: flip });
    S.closed(p(Sh.spline([[-0.45, -0.1], [-0.46, 0.12], [-0.3, 0.25], [-0.1, 0.24], [0.05, 0.12], [0.3, 0.05], [0.45, 0.0], [0.47, -0.1]], 6, false)), c, { w: 0.012 });
    S.add(p(Sh.line(-0.46, -0.1, 0.47, -0.1)), c, { w: 0.02 }); // sole
    S.add(p(Sh.spline([[-0.25, 0.1], [-0.05, -0.02], [0.2, 0.0]], 5)), C.red, { w: 0.01 }); // swoosh-like stripe (generic)
    for (let i = 0; i < 3; i++) S.add(p(Sh.line(-0.08 + i * 0.07, 0.17 - i * 0.03, 0.0 + i * 0.07, 0.19 - i * 0.03)), c, { w: 0.006 });
    S.add(p(Sh.line(-0.36, 0.25, -0.36, 0.55)), c, { w: 0.01 }); // sock/leg
    S.add(p(Sh.line(-0.12, 0.24, -0.12, 0.55)), c, { w: 0.01 });
    return S;
  };

  // electric guitar
  Sh.guitar = (o = {}) => {
    const S = Sh.make(), c = o.col || C.purple, n = o.col2 || C.white;
    const body = Sh.spline([[-0.35, -0.55], [-0.52, -0.3], [-0.42, 0.0], [-0.5, 0.25], [-0.38, 0.4], [-0.2, 0.28], [-0.08, 0.32], [0.05, 0.45], [0.22, 0.38], [0.2, 0.15], [0.35, -0.05], [0.4, -0.35], [0.2, -0.6], [-0.1, -0.66]], 6, true);
    S.closed(body, c, { w: 0.016 });
    S.closed(Sh.rrect(-0.05, 0.95, 0.12, 1.2, 0.02), n, { w: 0.01 }); // neck
    S.closed(Sh.pl([[-0.1, 1.55], [-0.14, 1.85], [0.08, 1.9], [0.06, 1.55]]), c, { w: 0.012 }); // headstock
    if (!o.simple) {
      for (let i = 0; i < 4; i++) S.add(Sh.line(-0.09 + i * 0.027, -0.35, -0.09 + i * 0.027, 1.55), n, { w: 0.003, a: 0.8 });
      S.closed(Sh.rrect(-0.05, 0.05, 0.22, 0.08, 0.02), n, { w: 0.007 });
      S.closed(Sh.rrect(-0.05, -0.18, 0.22, 0.08, 0.02), n, { w: 0.007 });
      S.closed(Sh.circ(0.18, -0.35, 0.04, 12), n, { w: 0.006 });
      S.closed(Sh.circ(0.08, -0.47, 0.04, 12), n, { w: 0.006 });
      for (let i = 0; i < 6; i++) S.add(Sh.line(-0.11, 0.4 + i * 0.16, 0.01, 0.4 + i * 0.16), n, { w: 0.003, a: 0.6 });
    }
    return S;
  };

  // vanity mirror with bulbs + hairbrush mic
  Sh.mirror = () => {
    const S = Sh.make();
    S.closed(Sh.rrect(0, 0.05, 1.5, 1.35, 0.1), C.pink, { w: 0.015 });
    S.closed(Sh.ell(0, 0.05, 0.55, 0.52, 0, M.TAU, 0, 64).slice(0, -1), C.cyan, { w: 0.01 });
    return S;
  };
  Sh.bulbs = () => {
    const out = [];
    for (let i = 0; i < 14; i++) {
      let x, y;
      if (i < 4) { x = -0.6 + i * 0.4; y = 0.62; } else if (i < 8) { x = -0.6 + (i - 4) * 0.4; y = -0.52; } else if (i < 11) { x = -0.66; y = 0.34 - (i - 8) * 0.29; } else { x = 0.66; y = 0.34 - (i - 11) * 0.29; }
      out.push([x, y]);
    }
    return out;
  };
  Sh.hairbrush = () => {
    const S = Sh.make(), c = C.yellow;
    S.closed(Sh.ell(0, 0.35, 0.2, 0.3, 0, M.TAU, 0, 36).slice(0, -1), c, { w: 0.013 });
    S.closed(Sh.rrect(0, -0.35, 0.09, 0.8, 0.04), c, { w: 0.012 });
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) S.closed(Sh.circ(-0.08 + k * 0.08, 0.15 + r * 0.09, 0.012, 6), C.white, { w: 0.005 });
    return S;
  };

  Sh.bigStar = (o = {}) => { const S = Sh.make(); S.closed(Sh.star(0, 0, 0.9, 0.38, 5), o.col || C.yellow, { w: 0.02 }); S.closed(Sh.star(0, 0, 0.72, 0.3, 5), o.col2 || C.pink, { w: 0.008 }); return S; };

  Sh.polaroid = (o = {}) => {
    const S = Sh.make();
    S.closed(Sh.rrect(0, 0, 1.0, 1.2, 0.01), o.col || C.white, { w: 0.012 });
    S.closed(Sh.rrect(0, 0.08, 0.84, 0.84, 0), o.col2 || C.cyan, { w: 0.008 });
    return S;
  };

  Sh.tv = () => {
    const S = Sh.make(), b = C.cyan;
    S.closed(Sh.rrect(0, 0, 1.9, 1.45, 0.12), b, { w: 0.016 });
    S.closed(Sh.rrect(-0.2, 0.02, 1.3, 1.05, 0.16), C.pink, { w: 0.012 });
    S.closed(Sh.circ(0.73, 0.35, 0.08, 16), b, { w: 0.01 });
    S.closed(Sh.circ(0.73, 0.05, 0.08, 16), b, { w: 0.01 });
    for (let i = 0; i < 5; i++) S.add(Sh.line(0.62, -0.25 - i * 0.07, 0.84, -0.25 - i * 0.07), b, { w: 0.005 });
    S.add(Sh.pl([[-0.2, 0.72], [-0.55, 1.25]]), C.white, { w: 0.008 }); // rabbit ears
    S.add(Sh.pl([[0.0, 0.72], [0.35, 1.3]]), C.white, { w: 0.008 });
    S.add(Sh.pl([[-0.8, -0.72], [-0.7, -0.85]]), b); S.add(Sh.pl([[0.8, -0.72], [0.7, -0.85]]), b);
    return S;
  };

  Sh.vhs = (o = {}) => {
    const S = Sh.make(), b = o.col || C.white;
    S.closed(Sh.rrect(0, 0, 1.9, 1.05, 0.03), b, { w: 0.014 });
    S.closed(Sh.rrect(0, 0.12, 1.5, 0.5, 0.02), o.col2 || C.yellow, { w: 0.01 });
    S.closed(Sh.rrect(-0.42, 0.12, 0.34, 0.22, 0.06), b, { w: 0.008 });
    S.closed(Sh.rrect(0.42, 0.12, 0.34, 0.22, 0.06), b, { w: 0.008 });
    S.add(Sh.line(-0.85, -0.3, 0.85, -0.3), b, { w: 0.008 });
    return S;
  };

  Sh.pencil = (o = {}) => {
    const S = Sh.make(), c = o.col || C.yellow;
    S.closed(Sh.pl([[-1.0, -0.07], [0.6, -0.07], [0.6, 0.07], [-1.0, 0.07]]), c, { w: 0.012 });
    S.add(Sh.line(-1.0, 0.0, 0.6, 0.0), c, { w: 0.005, a: 0.6 });
    S.closed(Sh.pl([[0.6, -0.07], [0.85, 0.0], [0.6, 0.07]]), C.orange, { w: 0.01 });
    S.closed(Sh.pl([[0.77, -0.025], [0.85, 0.0], [0.77, 0.025]]), C.white, { w: 0.008 });
    S.closed(Sh.rrect(-1.08, 0, 0.14, 0.15, 0.01), C.cyan, { w: 0.01 });
    S.closed(Sh.rrect(-1.22, 0, 0.14, 0.14, 0.05), C.pink, { w: 0.01 });
    return S;
  };

  Sh.lightning = (o = {}) => { const S = Sh.make(); S.closed(Sh.pl([[0.1, 0.9], [-0.35, 0.05], [-0.02, 0.05], [-0.2, -0.9], [0.4, 0.15], [0.05, 0.15], [0.3, 0.9]]), o.col || C.yellow, { w: 0.02 }); return S; };
  Sh.heart = (o = {}) => {
    const S = Sh.make();
    S.closed(Sh.spline([[0, -0.7], [-0.55, -0.1], [-0.6, 0.35], [-0.3, 0.6], [0, 0.35], [0.3, 0.6], [0.6, 0.35], [0.55, -0.1]], 8, true), o.col || C.pink, { w: 0.02 });
    return S;
  };
  Sh.shades = (o = {}) => {
    const S = Sh.make(), c = o.col || C.pink;
    const lens = [[-0.72, 0.18], [-0.1, 0.2], [-0.16, -0.18], [-0.66, -0.2]];
    S.closed(Sh.spline(lens, 5, true), c, { w: 0.018 });
    S.closed(Sh.spline(lens.map(([x, y]) => [-x, y]), 5, true), c, { w: 0.018 });
    S.add(Sh.spline([[-0.1, 0.12], [0, 0.16], [0.1, 0.12]], 4), c, { w: 0.014 });
    S.add(Sh.line(-0.72, 0.18, -0.95, 0.24), c, { w: 0.014 });
    S.add(Sh.line(0.72, 0.18, 0.95, 0.24), c, { w: 0.014 });
    return S;
  };

  // rubik cube wireframe (3D) — used as a morph target for the stroke world
  Sh.cubeWire = (s = 0.6) => {
    const S = Sh.make(), h = s;
    const cols = [C.red, C.cyan, C.yellow];
    for (let a = 0; a < 3; a++)
      for (let i = 0; i <= 3; i++) {
        const u = -h + (2 * h * i) / 3;
        for (let j = 0; j <= 3; j++) {
          const v = -h + (2 * h * j) / 3;
          const p0 = [0, 0, 0], p1 = [0, 0, 0];
          p0[a] = -h; p1[a] = h; p0[(a + 1) % 3] = u; p1[(a + 1) % 3] = u; p0[(a + 2) % 3] = v; p1[(a + 2) % 3] = v;
          if ((i === 0 || i === 3) || (j === 0 || j === 3)) S.add([p0, p1], cols[a], { w: 0.01 });
        }
      }
    return S;
  };

  // a burst of lines (for impacts) as raw strokes
  Sh.rays = (n, r0, r1, rot = 0) => {
    const out = [];
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * M.TAU; out.push({ p: [[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], w: 0.01 }); }
    return out;
  };

  // chalk-line town skyline in three depth layers (raw strokes; too many parts to morph)
  Sh.town = (seed = 85) => {
    const out = [], rng = V.R.rng(seed);
    for (let layer = 0; layer < 3; layer++) {
      const z = -layer * 2.2, base = -1.0;
      let x = -5.2 + rng() * 0.3;
      while (x < 5.2) {
        const w = 0.35 + rng() * 0.55, h = (0.5 + rng() * 1.5) * (1 - layer * 0.15) + layer * 0.5;
        out.push({ p: [[x, base, z], [x, base + h, z], [x + w, base + h, z], [x + w, base, z]], w: 0.012 });
        if (rng() < 0.4) { const ax = x + w * (0.2 + rng() * 0.6); out.push({ p: [[ax, base + h, z], [ax, base + h + 0.25, z]], w: 0.006 }); }
        if (rng() < 0.25) { const cx = x + w * 0.5; out.push({ p: Sh.rrect(cx, base + h + 0.12, 0.16, 0.14, 0.03, z), w: 0.007, closed: true }); }
        const cols = Math.max(1, Math.floor(w / 0.14)), rows = Math.max(1, Math.floor(h / 0.2));
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          if (rng() < 0.45) continue;
          const wx = x + (c + 0.5) * (w / cols), wy = base + h - 0.15 - r * 0.2;
          if (wy < base + 0.1) continue;
          out.push({ p: Sh.rrect(wx, wy, 0.06, 0.08, 0, z), w: 0.005, closed: true, lit: rng() < 0.5 });
        }
        x += w + 0.04 + rng() * 0.1;
      }
    }
    out.push({ p: [[-6, -1.0, 0.5], [6, -1.0, 0.5]], w: 0.012 });
    return out;
  };

  // group builder helpers for scenes that want a scattered "memory collage" of every object
  Sh.all = () => ({
    bmx: Sh.bmxPile(), face: Sh.kidFace(), arcade: Sh.arcade(), cassette: Sh.cassette(), deck: Sh.tapeDeck(), posters: Sh.posters(),
    car: Sh.car(), guitar: Sh.guitar(), mirror: Sh.mirror(), star: Sh.bigStar(), tv: Sh.tv(), vhs: Sh.vhs(), pencil: Sh.pencil(),
    knob: Sh.knob(), shades: Sh.shades(), heart: Sh.heart(), lightning: Sh.lightning(), polaroid: Sh.polaroid(), coins: Sh.coins(),
  });
})();
