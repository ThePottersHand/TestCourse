// Geometry helpers: smooth closed/open paths through points (Catmull-Rom -> cubic Bezier),
// seeded random numbers, and small shape builders shared by the scenes.
(function (WC) {
  'use strict';

  // Deterministic PRNG (mulberry32) so every frame/still is reproducible.
  WC.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const r = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.gauss = () => { let u = 0, v = 0; while (!u) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    return r;
  };

  // Points: [x, y] or [x, y, 'c'] for a sharp corner. Coordinates are multiplied by `s`
  // and offset by (ox, oy). Returns commands appended to `path` (a Path2D or ctx).
  WC.spline = function (path, pts, closed, s = 1, ox = 0, oy = 0, tension = 1, moveFirst = true) {
    const n = pts.length;
    const P = (i) => {
      if (closed) i = (i + n) % n; else i = Math.max(0, Math.min(n - 1, i));
      return pts[i];
    };
    const X = (p) => p[0] * s + ox, Y = (p) => p[1] * s + oy;
    if (moveFirst) path.moveTo(X(pts[0]), Y(pts[0])); else path.lineTo(X(pts[0]), Y(pts[0]));
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const k1 = p1[2] === 'c' ? 0 : tension / 6, k2 = p2[2] === 'c' ? 0 : tension / 6;
      const c1x = p1[0] + (p2[0] - p0[0]) * k1, c1y = p1[1] + (p2[1] - p0[1]) * k1;
      const c2x = p2[0] - (p3[0] - p1[0]) * k2, c2y = p2[1] - (p3[1] - p1[1]) * k2;
      path.bezierCurveTo(c1x * s + ox, c1y * s + oy, c2x * s + ox, c2y * s + oy, X(p2), Y(p2));
    }
    if (closed) path.closePath();
    return path;
  };

  WC.pathFrom = function (pts, closed = true, s = 1, ox = 0, oy = 0, tension = 1) {
    return WC.spline(new Path2D(), pts, closed, s, ox, oy, tension);
  };

  WC.circlePath = function (path, x, y, r) { path.moveTo(x + r, y); path.arc(x, y, r, 0, Math.PI * 2); return path; };

  WC.ellipsePath = function (path, x, y, rx, ry, rot = 0) {
    path.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx);
    path.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return path;
  };

  // A tapered, curved stroke ("comma" / brush lock) from a->b bulging by `bend`, max width w.
  WC.lockPath = function (path, ax, ay, bx, by, w, bend = 0.25, wTail = 0.15) {
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const pts = [];
    const N = 14;
    const left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const off = Math.sin(Math.PI * t) * bend * L;
      const cx = ax + dx * t + nx * off, cy = ay + dy * t + ny * off;
      const hw = w * 0.5 * (Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) * (1 - t) + wTail * (1 - t));
      left.push([cx + nx * hw, cy + ny * hw]);
      right.push([cx - nx * hw, cy - ny * hw]);
    }
    const poly = left.concat(right.reverse());
    path.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) path.lineTo(poly[i][0], poly[i][1]);
    path.closePath();
    return path;
  };

  // Spiral ringlet: a thick spiral built from overlapping circles along a helix-like curve.
  WC.ringletPath = function (path, x, y, len, r0, r1, turns, dir = 1, rnd = Math.random) {
    const N = Math.max(8, Math.floor(len / 3));
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = t * turns * Math.PI * 2;
      const r = r0 + (r1 - r0) * t;
      const cx = x + Math.sin(a) * r * 0.9 * dir;
      const cy = y + t * len;
      const rr = r * (0.55 + 0.25 * Math.cos(a)) + (rnd() - 0.5) * 0.6;
      WC.circlePath(path, cx, cy, Math.max(1.2, rr));
    }
    return path;
  };


  // ---- fill-per-primitive helpers (overlapping primitives always union, never cancel)
  WC.fillSpline = function (g, pts, closed = true, s = 1, ox = 0, oy = 0) {
    const p = WC.spline(new Path2D(), pts, closed, s, ox, oy); g.fill(p); return p;
  };
  WC.fillCircle = function (g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); g.fill(); };
  WC.fillEllipse = function (g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
  WC.fillLock = function (g, ax, ay, bx, by, w, bend, wTail) { const p = WC.lockPath(new Path2D(), ax, ay, bx, by, w, bend, wTail); g.fill(p); };

  // Dense samples along a Catmull-Rom spline (same curve as WC.spline), in scaled units.
  WC.sampleSpline = function (pts, closed, s = 1, per = 12) {
    const n = pts.length, out = [];
    const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const k1 = p1[2] === 'c' ? 0 : 1 / 6, k2 = p2[2] === 'c' ? 0 : 1 / 6;
      const c1 = [p1[0] + (p2[0] - p0[0]) * k1, p1[1] + (p2[1] - p0[1]) * k1];
      const c2 = [p2[0] - (p3[0] - p1[0]) * k2, p2[1] - (p3[1] - p1[1]) * k2];
      for (let j = 0; j < per; j++) {
        const t = j / per, mt = 1 - t;
        const x = mt * mt * mt * p1[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * p2[0];
        const y = mt * mt * mt * p1[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * p2[1];
        out.push([x * s, y * s]);
      }
    }
    if (!closed) { const l = pts[n - 1]; out.push([l[0] * s, l[1] * s]); }
    return out;
  };

  // Resample a polyline at a fixed spacing; returns [{x,y,nx,ny}] with left-hand normals.
  WC.resample = function (poly, spacing) {
    const out = [];
    let acc = 0;
    for (let i = 1; i < poly.length; i++) {
      const [ax, ay] = poly[i - 1], [bx, by] = poly[i];
      const L = Math.hypot(bx - ax, by - ay); if (!L) continue;
      const tx = (bx - ax) / L, ty = (by - ay) / L;
      let d = acc === 0 && i === 1 ? 0 : spacing - acc;
      while (d <= L) { out.push({ x: ax + tx * d, y: ay + ty * d, nx: ty, ny: -tx }); d += spacing; }
      acc = L - (d - spacing);
    }
    return out;
  };

  // Curly edge: overlapping circles centred just inside a path (pts in H units, scaled by s).
  WC.scallops = function (g, pts, closed, s, spacing, rMin, rMax, inset, rnd) {
    WC.resample(WC.sampleSpline(pts, closed, s, 10), spacing).forEach((q) => {
      const r = rMin + (rMax - rMin) * rnd();
      WC.fillCircle(g, q.x - q.nx * inset * r, q.y - q.ny * inset * r, r);
    });
  };

  // Corkscrew ringlet hanging from (x,y): a stroked zig-zag spiral with tapering width.
  WC.ringlet = function (g, x, y, len, w0, w1, turns, amp, sway = 0) {
    const N = 40;
    let px = x, py = y;
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const a = t * turns * Math.PI * 2;
      const nx = x + Math.sin(a) * amp * (1 - 0.4 * t) + sway * t * t;
      const ny = y + t * len;
      g.lineWidth = w0 + (w1 - w0) * t;
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
      px = nx; py = ny;
    }
  };


  // Tapered capsule from (x0,y0) to (x1,y1) with end widths w0, w1 (filled).
  WC.capsule = function (g, x0, y0, x1, y1, w0, w1) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L, r0 = w0 / 2, r1 = w1 / 2;
    g.beginPath();
    g.moveTo(x0 + nx * r0, y0 + ny * r0); g.lineTo(x1 + nx * r1, y1 + ny * r1);
    g.lineTo(x1 - nx * r1, y1 - ny * r1); g.lineTo(x0 - nx * r0, y0 - ny * r0); g.closePath(); g.fill();
    WC.fillCircle(g, x0, y0, r0); WC.fillCircle(g, x1, y1, r1);
  };

  // Tapered brush stroke along a spline (pts in px), max width w; `taper` shapes the ends.
  WC.brushStroke = function (g, pts, w, per = 14, taper = 1.2) {
    const q = WC.sampleSpline(pts, false, 1, per);
    g.lineCap = 'round';
    for (let i = 1; i < q.length; i++) {
      const t = i / q.length;
      g.lineWidth = Math.max(0.5, w * (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 1 / taper)));
      g.beginPath(); g.moveTo(q[i - 1][0], q[i - 1][1]); g.lineTo(q[i][0], q[i][1]); g.stroke();
    }
  };

  // Transform helpers for 2D affine matrices [a,b,c,d,e,f] (canvas convention).
  WC.mat = {
    ident: () => [1, 0, 0, 1, 0, 0],
    mul: (m, n) => [
      m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
      m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]],
    trs: (tx, ty, rot = 0, sx = 1, sy = sx) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      return [c * sx, s * sx, -s * sy, c * sy, tx, ty];
    },
    inv: (m) => {
      const det = m[0] * m[3] - m[1] * m[2];
      const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
      return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
    },
    apply: (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]],
    // rotation by `a` (radians) about point (px,py), with optional scale about the same point
    about: (px, py, a, sx = 1, sy = sx) => {
      const c = Math.cos(a), s = Math.sin(a);
      const m = [c * sx, s * sx, -s * sy, c * sy, 0, 0];
      m[4] = px - (m[0] * px + m[2] * py); m[5] = py - (m[1] * px + m[3] * py);
      return m;
    },
    tr: (x, y) => [1, 0, 0, 1, x, y],
    sc: (sx, sy = sx) => [sx, 0, 0, sy, 0, 0],
  };
})(window.WC = window.WC || {});
