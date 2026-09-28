/* The Wheel of Invention — core: math, colour, geometry, blueprint sheets, particles. */
'use strict';

/* ---------- math ---------- */
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (a, b, x) => clamp((x - a) / (b - a));
const wrap = (x, w) => ((x % w) + w) % w;
const smooth = t => t * t * (3 - 2 * t);
const bump = t => (t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t));

const E = {
  lin: t => t,
  inSine: t => 1 - Math.cos((t * Math.PI) / 2),
  outSine: t => Math.sin((t * Math.PI) / 2),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  inOutQuart: t => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: t =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inOutBack: (t, c1 = 1.1) => {
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  outElastic: t =>
    t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
};

/* deterministic randomness: the whole film is a pure function of time */
function hash(n, s = 0) {
  const x = Math.sin(n * 127.1 + s * 311.7 + 0.5) * 43758.5453;
  return x - Math.floor(x);
}
function noise1(x, s = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i, s), hash(i + 1, s), u) * 2 - 1;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- colour ---------- */
const _hexCache = new Map();
function hex(h) {
  if (Array.isArray(h)) return h;
  let c = _hexCache.get(h);
  if (c) return c;
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
  const n = parseInt(s, 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  _hexCache.set(h, c);
  return c;
}
function mix(a, b, t) {
  a = hex(a); b = hex(b);
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
function rgba(c, a = 1) {
  c = hex(c);
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(3)})`;
}
function linG(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const s of stops) g.addColorStop(s[0], rgba(s[1], s[2] == null ? 1 : s[2]));
  return g;
}
function radG(ctx, x, y, r0, r1, stops, fx, fy) {
  const g = ctx.createRadialGradient(fx == null ? x : fx, fy == null ? y : fy, r0, x, y, r1);
  for (const s of stops) g.addColorStop(s[0], rgba(s[1], s[2] == null ? 1 : s[2]));
  return g;
}
/* soft light and smoke are drawn from cached gradient sprites: far cheaper than a new gradient per particle */
const _sprites = new Map();
function _sprite(kind, c) {
  const key = kind + (((c[0] >> 3) << 10) | ((c[1] >> 3) << 5) | (c[2] >> 3));
  let s = _sprites.get(key);
  if (s) return s;
  if (_sprites.size > 500) _sprites.clear();
  const N = 128, h = N / 2;
  s = document.createElement('canvas');
  s.width = s.height = N;
  const g = s.getContext('2d'), gr = g.createRadialGradient(h, h, 0, h, h, h);
  const stops = kind === 'g' ? [[0, 1], [0.25, 0.45], [0.6, 0.12], [1, 0]] : [[0, 1], [0.55, 0.55], [1, 0]];
  for (const [o, a] of stops) gr.addColorStop(o, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
  g.fillStyle = gr;
  g.fillRect(0, 0, N, N);
  _sprites.set(key, s);
  return s;
}
function _stamp(ctx, kind, x, y, r, c, a) {
  if (a <= 0.003 || r <= 0) return;
  const ga = ctx.globalAlpha;
  ctx.globalAlpha = ga * (a > 1 ? 1 : a);
  ctx.drawImage(_sprite(kind, hex(c)), x - r, y - r, 2 * r, 2 * r);
  ctx.globalAlpha = ga;
}
/* soft additive light: caller sets globalCompositeOperation */
function glow(ctx, x, y, r, c, a) { _stamp(ctx, 'g', x, y, r, c, a); }

/* ---------- geometry ---------- */
class P {
  constructor(x, y) { this.pts = [x, y]; this.x = x; this.y = y; }
  L(x, y) { this.pts.push(x, y); this.x = x; this.y = y; return this; }
  l(dx, dy) { return this.L(this.x + dx, this.y + dy); }
  C(x1, y1, x2, y2, x, y, n = 20) {
    const x0 = this.x, y0 = this.y;
    for (let i = 1; i <= n; i++) {
      const t = i / n, m = 1 - t;
      this.pts.push(m * m * m * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x,
        m * m * m * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y);
    }
    this.x = x; this.y = y; return this;
  }
  Q(x1, y1, x, y, n = 16) {
    const x0 = this.x, y0 = this.y;
    for (let i = 1; i <= n; i++) {
      const t = i / n, m = 1 - t;
      this.pts.push(m * m * x0 + 2 * m * t * x1 + t * t * x, m * m * y0 + 2 * m * t * y1 + t * t * y);
    }
    this.x = x; this.y = y; return this;
  }
  A(cx, cy, r, a0, a1, n) {
    n = n || Math.max(6, Math.ceil((Math.abs(a1 - a0) * r) / 5));
    const sx = cx + Math.cos(a0) * r, sy = cy + Math.sin(a0) * r;
    if (Math.hypot(sx - this.x, sy - this.y) > 0.5) this.pts.push(sx, sy);
    for (let i = 1; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      this.pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    this.x = cx + Math.cos(a1) * r; this.y = cy + Math.sin(a1) * r; return this;
  }
  Z() { this.pts.push(this.pts[0], this.pts[1]); this.x = this.pts[0]; this.y = this.pts[1]; return this; }
}
const rectPts = (x, y, w, h) => [x, y, x + w, y, x + w, y + h, x, y + h, x, y];
function rrectPts(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return new P(x + r, y).L(x + w - r, y).A(x + w - r, y + r, r, -Math.PI / 2, 0)
    .L(x + w, y + h - r).A(x + w - r, y + h - r, r, 0, Math.PI / 2)
    .L(x + r, y + h).A(x + r, y + h - r, r, Math.PI / 2, Math.PI)
    .L(x, y + r).A(x + r, y + r, r, Math.PI, Math.PI * 1.5).pts;
}
function ellPts(cx, cy, rx, ry, rot = 0, a0 = 0, a1 = TAU, n = 64) {
  const out = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push(cx + x * c - y * s, cy + x * s + y * c);
  }
  return out;
}
function polyReg(cx, cy, R, n, a0 = -Math.PI / 2) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (TAU * i) / n;
    out.push(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
  }
  return out;
}
/* gear outline; slant skews the tooth tips (escape wheels) */
function gearPts(cx, cy, rO, rR, n, rot = 0, slant = 0, tipW = 0.32, rootW = 0.5) {
  const out = [], step = TAU / n;
  for (let i = 0; i < n; i++) {
    const a = rot + i * step;
    const pts = [
      [a - step * rootW * 0.5, rR], [a - step * tipW * 0.5 + slant, rO],
      [a + step * tipW * 0.5 + slant, rO], [a + step * rootW * 0.5, rR],
    ];
    for (const [ang, r] of pts) out.push(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
  }
  out.push(out[0], out[1]);
  return out;
}
function xform(pts, fn) {
  const out = new Array(pts.length);
  for (let i = 0; i < pts.length; i += 2) {
    const q = fn(pts[i], pts[i + 1]);
    out[i] = q[0]; out[i + 1] = q[1];
  }
  return out;
}
const rot2 = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

function tracePts(ctx, pts, close) {
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  if (close) ctx.closePath();
}
function fillPts(ctx, pts, style) {
  ctx.beginPath(); tracePts(ctx, pts, true);
  if (style) ctx.fillStyle = style;
  ctx.fill();
}
function strokePts(ctx, pts, style, w, close) {
  ctx.beginPath(); tracePts(ctx, pts, close);
  if (style) ctx.strokeStyle = style;
  if (w) ctx.lineWidth = w;
  ctx.stroke();
}
function circ(ctx, x, y, r, fill, stroke, w) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; if (w) ctx.lineWidth = w; ctx.stroke(); }
}
function seg(ctx, x0, y0, x1, y1) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }

/* ---------- fonts ---------- */
const FT = '"Barlow Condensed", "Arial Narrow", sans-serif';
const FS = '"Spectral", Georgia, "Times New Roman", serif';
const FD = '"Big Shoulders Display", "Barlow Condensed", Impact, sans-serif';
const FM = '"VT323", ui-monospace, Menlo, Consolas, monospace';
const HAS_LS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;

/* ---------- blueprint sheets ----------
   A Sheet is a list of strokes drawn in a cell's local frame (porthole centre at 0,0, y down).
   Each stroke draws itself on during the drafting window; kinds follow ISO 128 line types. */
const INK = [230, 241, 255];
const KINDS = {
  frame: { w: 1.8, a: 0.95, layer: 1, ph: 0, min: 1 },
  obj: { w: 2.2, a: 0.96, layer: 0, ph: 2, min: 0.9 },
  thin: { w: 1.25, a: 0.8, layer: 0, ph: 3, min: 0.6 },
  con: { w: 0.85, a: 0.3, layer: 0, ph: 1, min: 0.5 },
  hid: { w: 1.1, a: 0.62, layer: 0, ph: 3, min: 0.6, dash: [9, 6] },
  ctr: { w: 0.95, a: 0.55, layer: 0, ph: 1, min: 0.5, dash: [28, 6, 4, 6] },
  ph: { w: 1.05, a: 0.55, layer: 0, ph: 3, min: 0.5, dash: [20, 6, 4, 6, 4, 6] },
  hatch: { w: 0.75, a: 0.4, layer: 0, ph: 3, min: 0.4 },
  dim: { w: 1, a: 0.82, layer: 1, ph: 4, min: 0.6 },
  lead: { w: 1.05, a: 0.88, layer: 1, ph: 4, min: 0.6 },
  txt: { a: 0.93, layer: 1, ph: 4 },
  tb: { w: 1.15, a: 0.82, layer: 1, ph: 5, min: 0.6 },
  tbt: { a: 0.92, layer: 1, ph: 5 },
};
/* phase windows as fractions of the drafting time */
const PHASES = [[0, 0.2], [0.03, 0.34], [0.12, 0.74], [0.36, 0.86], [0.52, 0.95], [0.66, 1]];

function polySeg(pts, closed) {
  if (closed && (pts[0] !== pts[pts.length - 2] || pts[1] !== pts[pts.length - 1])) pts = pts.concat([pts[0], pts[1]]);
  const n = pts.length / 2, L = new Float32Array(n);
  for (let i = 1; i < n; i++) L[i] = L[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
  return { p: pts, L, len: L[n - 1] || 0.001 };
}
function arcSeg(cx, cy, r, a0, a1) { return { arc: [cx, cy, r, a0, a1], len: Math.abs(a1 - a0) * r || 0.001 }; }

class Sheet {
  constructor() { this.strokes = []; this.sparks = null; this.D = 3; }
  _add(kind, segs, o = {}) {
    const K = KINDS[kind];
    const st = {
      kind, segs, len: segs.reduce((a, g) => a + g.len, 0),
      w: o.w || K.w, a: (o.a == null ? K.a : o.a), min: K.min || 0.5,
      dash: o.dash === undefined ? K.dash || null : o.dash,
      layer: o.layer == null ? K.layer : o.layer, ph: o.ph == null ? K.ph : o.ph,
      at: o.at, dur: o.dur, col: o.col || INK, heads: o.heads || null,
      fade: o.fade == null ? null : o.fade, spark: o.spark !== false,
    };
    this.strokes.push(st);
    return st;
  }
  poly(pts, o = {}) { return this._add(o.k || 'obj', [polySeg(pts, !!o.close)], o); }
  multi(list, o = {}) { return this._add(o.k || 'obj', list.map(p => polySeg(p, !!o.close)), o); }
  line(x0, y0, x1, y1, o = {}) { return this.poly([x0, y0, x1, y1], o); }
  rect(x, y, w, h, o = {}) { return this.poly(rectPts(x, y, w, h), o); }
  circle(cx, cy, r, o = {}) {
    const a0 = o.a0 == null ? -Math.PI / 2 : o.a0;
    return this._add(o.k || 'obj', [arcSeg(cx, cy, r, a0, a0 + (o.ccw ? -TAU : TAU))], o);
  }
  arc(cx, cy, r, a0, a1, o = {}) { return this._add(o.k || 'obj', [arcSeg(cx, cy, r, a0, a1)], o); }
  text(txt, x, y, o = {}) {
    const kind = o.k || 'txt', K = KINDS[kind];
    const size = o.size || 15;
    const st = {
      kind, txt: String(txt), x, y, size, rot: o.rot || 0,
      font: `${o.weight || 600} ${size}px ${o.font || FT}`, ls: o.ls == null ? size * 0.09 : o.ls,
      align: o.align || 'l', a: o.a == null ? K.a : o.a, col: o.col || INK,
      layer: o.layer == null ? K.layer : o.layer, ph: o.ph == null ? K.ph : o.ph,
      at: o.at, dur: o.dur, len: txt.length, W: null, box: !!o.box, fade: o.fade == null ? null : o.fade,
      mirror: !!o.mirror,
    };
    this.strokes.push(st);
    return st;
  }
  /* linear dimension between two points, offset along the left normal */
  dim(x1, y1, x2, y2, off, label, o = {}) {
    let dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    const nx = dy, ny = -dx, sg = Math.sign(off) || 1;
    const ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off;
    const ph = o.ph == null ? 4 : o.ph;
    this.line(x1 + nx * 6 * sg, y1 + ny * 6 * sg, ax + nx * 9 * sg, ay + ny * 9 * sg, { k: 'dim', ph, a: 0.55 });
    this.line(x2 + nx * 6 * sg, y2 + ny * 6 * sg, bx + nx * 9 * sg, by + ny * 9 * sg, { k: 'dim', ph, a: 0.55 });
    const ang = Math.atan2(dy, dx);
    this.line(ax, ay, bx, by, { k: 'dim', ph, heads: [[ax, ay, ang + Math.PI, 0], [bx, by, ang, 1]] });
    let ta = ang;
    if (ta >= Math.PI / 2 - 0.001) ta -= Math.PI;
    else if (ta < -Math.PI / 2 - 0.001) ta += Math.PI;
    const tx = (ax + bx) / 2 + nx * 13 * sg, ty = (ay + by) / 2 + ny * 13 * sg;
    this.text(label, tx, ty, { align: 'c', rot: ta, size: o.size || 15, ph, box: true });
  }
  /* angular dimension */
  adim(cx, cy, r, a0, a1, label, o = {}) {
    const ph = o.ph == null ? 4 : o.ph, d = Math.sign(a1 - a0) || 1;
    this._add('dim', [arcSeg(cx, cy, r, a0, a1)], {
      ph, heads: [
        [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, a0 - (d * Math.PI) / 2, 0],
        [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, a1 + (d * Math.PI) / 2, 1]],
    });
    const am = (a0 + a1) / 2, rr = r + (o.out == null ? 16 : o.out);
    this.text(label, cx + Math.cos(am) * rr, cy + Math.sin(am) * rr, { align: 'c', size: o.size || 15, ph, box: true });
  }
  /* balloon callout: dot on the part, leader, lettered balloon, label */
  balloon(px, py, bx, by, tag, label, o = {}) {
    const ph = o.ph == null ? 4 : o.ph, left = o.left || bx < px, R = 11;
    const cx = left ? bx - R : bx + R;
    const dx = cx - px, dy = by - py, d = Math.hypot(dx, dy) || 1;
    this.circle(px, py, 2.6, { k: 'lead', ph, w: 2.2 });
    this.line(px, py, cx - (dx / d) * R, by - (dy / d) * R, { k: 'lead', ph });
    this.circle(cx, by, R, { k: 'lead', ph, a0: Math.PI });
    this.text(tag, cx, by + 0.5, { align: 'c', size: 13, ph, weight: 700 });
    this.text(label, left ? cx - R - 8 : cx + R + 8, by, { align: left ? 'r' : 'l', size: o.size || 15.5, ph });
  }
  /* section hatching of a polygon set (even-odd), sweeping in draw order */
  hatch(rings, gap = 11, ang = Math.PI / 4, o = {}) {
    const ca = Math.cos(-ang), sa = Math.sin(-ang);
    const rot = (x, y) => [x * ca - y * sa, x * sa + y * ca];
    const unrot = (x, y) => [x * ca + y * sa, -x * sa + y * ca];
    const R = rings.map(r => xform(r, rot));
    let y0 = Infinity, y1 = -Infinity;
    for (const r of R) for (let i = 1; i < r.length; i += 2) { y0 = Math.min(y0, r[i]); y1 = Math.max(y1, r[i]); }
    const lines = [];
    for (let y = Math.ceil(y0 / gap) * gap + gap * 0.5; y < y1; y += gap) {
      const xs = [];
      for (const r of R) {
        for (let i = 0; i < r.length - 2; i += 2) {
          const ax = r[i], ay = r[i + 1], bx = r[i + 2], by = r[i + 3];
          if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const p = unrot(xs[i], y), q = unrot(xs[i + 1], y);
        lines.push([p[0], p[1], q[0], q[1]]);
      }
    }
    if (lines.length) this.multi(lines, Object.assign({ k: 'hatch' }, o));
  }
  centre(cx, cy, r, o = {}) {
    this.line(cx - r, cy, cx + r, cy, Object.assign({ k: 'ctr' }, o));
    this.line(cx, cy - r, cx, cy + r, Object.assign({ k: 'ctr' }, o));
  }
  /* standard frame for a drawing: the detail circle, its tick bezel and the figure caption */
  frame(meta, r = 280) {
    this.circle(0, 0, r, { k: 'frame', at: 0, dur: 0.2, spark: false });
    const ticks = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU, l = i % 6 === 0 ? 10 : 5;
      ticks.push([Math.cos(a) * (r + 4), Math.sin(a) * (r + 4), Math.cos(a) * (r + 4 + l), Math.sin(a) * (r + 4 + l)]);
    }
    this.multi(ticks, { k: 'dim', ph: 0, at: 0.05, dur: 0.22, a: 0.5, spark: false });
    this.text(`FIG. ${meta.n} — ${meta.fig}`, -590, -330, { size: 15, ph: 0, at: 0.02, dur: 0.2, a: 0.8 });
    this.line(-590, -318, -380, -318, { k: 'dim', ph: 0, at: 0.06, dur: 0.14, a: 0.5 });
  }
  /* drafting title block in the right column */
  tblock(meta, x = 330, y = 64, w = 270) {
    const rows = [30, 42, 30, 30], h = rows.reduce((a, b) => a + b, 0), c1 = x + 72;
    this.rect(x, y, w, h, { k: 'tb' });
    let yy = y;
    for (let i = 0; i < rows.length - 1; i++) { yy += rows[i]; this.line(x, yy, x + w, yy, { k: 'tb', a: 0.5 }); }
    this.line(c1, y, c1, y + rows[0], { k: 'tb', a: 0.5 });
    this.line(c1, y + rows[0] + rows[1], c1, y + h, { k: 'tb', a: 0.5 });
    this.line(x + w - 86, y, x + w - 86, y + rows[0], { k: 'tb', a: 0.5 });
    this.line(x + w - 86, y + h - rows[3], x + w - 86, y + h, { k: 'tb', a: 0.5 });
    const L = (t, xx, yc) => this.text(t, xx, yc, { k: 'tbt', size: 10.5, a: 0.6, weight: 500 });
    const V = (t, xx, yc, sz = 14, wt = 600, al = 'l') => this.text(t, xx, yc, { k: 'tbt', size: sz, weight: wt, align: al });
    let yc = y + rows[0] / 2;
    L('DWG. NO.', x + 8, yc); V(meta.n, c1 + 8, yc, 16, 700); L('SHEET', x + w - 78, yc); V(`${meta.n}/16`, x + w - 8, yc, 13, 600, 'r');
    yc = y + rows[0] + rows[1] / 2;
    V(meta.tbTitle || meta.title.toUpperCase(), x + 8, yc, 21, 700);
    yc = y + rows[0] + rows[1] + rows[2] / 2;
    L('ORIGIN', x + 8, yc); V(meta.origin, c1 + 8, yc, 13.5);
    yc = y + h - rows[3] / 2;
    L('DATE', x + 8, yc); V(meta.date, c1 + 8, yc, 13.5); L('SCALE', x + w - 78, yc); V(meta.scale || 'NTS', x + w - 8, yc, 13, 600, 'r');
  }
  /* note block: first line is a heading */
  notes(lines, x, y, o = {}) {
    lines.forEach((t, i) => this.text(t, x, y + i * (o.lh || 21), {
      size: i === 0 ? 13 : o.size || 14.5, a: i === 0 ? 0.62 : 0.9, weight: i === 0 ? 700 : 500,
      font: o.font, ls: o.ls, ph: o.ph == null ? 4 : o.ph,
    }));
  }
  /* assign draw-on windows within the drafting time D (seconds) */
  schedule(D) {
    this.D = D;
    const f = D / 2.8, groups = PHASES.map(() => []);
    for (const st of this.strokes) groups[st.ph].push(st);
    groups.forEach((g, ph) => {
      const [a, b] = PHASES[ph], n = g.length;
      g.forEach((st, i) => {
        let d;
        if (st.txt != null) d = clamp(0.12 + st.len * 0.02, 0.14, 0.62) * f;
        else d = clamp(0.16 + Math.sqrt(st.len) * 0.021, 0.16, 0.85) * f;
        if (st.at != null) {
          st.t0 = st.at * D; st.t1 = st.t0 + (st.dur != null ? st.dur * D : d);
        } else {
          const span = Math.max(0, (b - a) * D - d);
          st.t0 = a * D + (n > 1 ? span * Math.pow(i / (n - 1), 0.92) : span * 0.3);
          st.t1 = st.t0 + d;
        }
      });
    });
    return this;
  }
  /* burst sparks come from points along the object lines inside the porthole */
  sparkPoints(r = 280, maxN = 240) {
    if (this.sparks) return this.sparks;
    const raw = [];
    for (const st of this.strokes) {
      if (st.txt != null || !st.spark || (st.kind !== 'obj' && st.kind !== 'thin')) continue;
      for (const g of st.segs) {
        const n = Math.max(1, Math.floor(g.len / 13));
        for (let i = 0; i <= n; i++) {
          const q = tipAtSeg(g, (g.len * i) / n);
          if (q[0] * q[0] + q[1] * q[1] < r * r) raw.push(q[0], q[1]);
        }
      }
    }
    const out = [], cnt = raw.length / 2, step = Math.max(1, cnt / maxN);
    for (let i = 0; i < cnt; i += step) { const j = Math.floor(i) * 2; out.push(raw[j], raw[j + 1]); }
    return (this.sparks = out);
  }
}

function tipAtSeg(g, l) {
  if (g.arc) {
    const [cx, cy, r, a0, a1] = g.arc, a = a0 + (a1 - a0) * clamp(l / g.len);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }
  const p = g.p, L = g.L, n = L.length;
  if (l <= 0) return [p[0], p[1]];
  let i = 1;
  while (i < n - 1 && L[i] < l) i++;
  const t = (l - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return [lerp(p[2 * i - 2], p[2 * i], t), lerp(p[2 * i - 1], p[2 * i + 1], t)];
}
function tipAt(st, l) {
  let acc = 0;
  for (const g of st.segs) {
    if (l <= acc + g.len) return tipAtSeg(g, l - acc);
    acc += g.len;
  }
  const g = st.segs[st.segs.length - 1];
  return tipAtSeg(g, g.len);
}
function pathRange(ctx, st, l0, l1) {
  let acc = 0;
  for (const g of st.segs) {
    const s0 = acc; acc += g.len;
    if (acc <= l0) continue;
    if (s0 >= l1) break;
    const a = Math.max(0, l0 - s0), b = Math.min(g.len, l1 - s0);
    if (g.arc) {
      const [cx, cy, r, a0, a1] = g.arc, d = a1 - a0;
      const u0 = a0 + (d * a) / g.len, u1 = a0 + (d * b) / g.len;
      ctx.moveTo(cx + Math.cos(u0) * r, cy + Math.sin(u0) * r);
      ctx.arc(cx, cy, r, u0, u1, d < 0);
    } else {
      const p = g.p, L = g.L, n = L.length;
      let i = 1;
      while (i < n - 1 && L[i] < a) i++;
      let t = (a - L[i - 1]) / (L[i] - L[i - 1] || 1);
      ctx.moveTo(lerp(p[2 * i - 2], p[2 * i], t), lerp(p[2 * i - 1], p[2 * i + 1], t));
      while (i < n && L[i] < b) { ctx.lineTo(p[2 * i], p[2 * i + 1]); i++; }
      if (i < n) {
        t = (b - L[i - 1]) / (L[i] - L[i - 1] || 1);
        ctx.lineTo(lerp(p[2 * i - 2], p[2 * i], t), lerp(p[2 * i - 1], p[2 * i + 1], t));
      }
    }
  }
}
function fullPath(st) {
  const path = new Path2D();
  for (const g of st.segs) {
    if (g.arc) {
      const [cx, cy, r, a0, a1] = g.arc;
      path.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
      path.arc(cx, cy, r, a0, a1, a1 < a0);
    } else {
      const p = g.p;
      path.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length; i += 2) path.lineTo(p[i], p[i + 1]);
    }
  }
  return path;
}
function arrowHead(ctx, x, y, ang, size, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(ang - 0.28) * size, y - Math.sin(ang - 0.28) * size);
  ctx.lineTo(x - Math.cos(ang + 0.28) * size, y - Math.sin(ang + 0.28) * size);
  ctx.closePath();
  ctx.fill();
}

/* Render one layer of a sheet at drafting time t.
   R: { s: px per unit, alpha, heads: [] (collects pen tips), knock: background colour for text boxes, tb: time since burst } */
function renderSheet(ctx, S, t, layer, R) {
  const s = R.s, A = R.alpha == null ? 1 : R.alpha;
  if (A <= 0.004) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const st of S.strokes) {
    if (st.layer !== layer) continue;
    let p = (t - st.t0) / (st.t1 - st.t0);
    if (p <= 0) continue;
    if (p > 1) p = 1;
    let a = A;
    if (st.fade != null && R.tb != null && R.tb > st.fade) {
      a *= 1 - clamp((R.tb - st.fade) / 0.7);
      if (a <= 0.004) continue;
    }
    if (st.txt != null) { drawSheetText(ctx, st, p, s, a, R); continue; }
    const e = E.inOutSine(p);
    ctx.lineWidth = Math.max(st.w * s, st.min) / s;
    ctx.strokeStyle = rgba(st.col, st.a * a);
    ctx.setLineDash(st.dash || []);
    if (e >= 1) {
      ctx.stroke(st.path || (st.path = fullPath(st)));
    } else {
      ctx.beginPath();
      pathRange(ctx, st, 0, e * st.len);
      ctx.stroke();
      if (R.heads) {
        const q = tipAt(st, e * st.len);
        R.heads.push(q[0], q[1], st.kind === 'obj' || st.kind === 'frame' ? 1 : 0.6);
      }
    }
    if (st.heads) {
      ctx.setLineDash([]);
      const hs = Math.max(10, 9 / s);
      for (const h of st.heads) {
        const k = h[3] === 0 ? clamp(e / 0.06) : clamp((e - 0.96) / 0.04);
        if (k > 0) arrowHead(ctx, h[0], h[1], h[2], hs * E.outBack(k), rgba(st.col, st.a * a));
      }
    }
  }
  ctx.setLineDash([]);
}
function drawSheetText(ctx, st, p, s, a, R) {
  const px = st.size * s;
  if (px < 4.2) return;
  a *= clamp((px - 4.2) / 3.5);
  ctx.font = st.font;
  if (HAS_LS) ctx.letterSpacing = `${st.ls}px`;
  if (st.W == null) st.W = ctx.measureText(st.txt).width;
  const n = Math.ceil(p * st.len), sub = n >= st.len ? st.txt : st.txt.slice(0, n);
  ctx.save();
  ctx.translate(st.x, st.y);
  if (st.rot) ctx.rotate(st.rot);
  if (st.mirror) ctx.scale(-1, 1);
  const x0 = st.align === 'c' ? -st.W / 2 : st.align === 'r' ? -st.W : 0;
  if (st.box && R.knock) {
    ctx.fillStyle = R.knock;
    ctx.fillRect(x0 - 4, -st.size * 0.62, st.W + 8, st.size * 1.24);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba(st.col, st.a * a);
  ctx.fillText(sub, x0, 0);
  if (p < 1) {
    const w = ctx.measureText(sub).width;
    ctx.fillStyle = rgba([255, 236, 200], 0.9 * a);
    ctx.fillRect(x0 + w + 1.5, -st.size * 0.42, Math.max(st.size * 0.42, 2 / s), st.size * 0.84);
  }
  ctx.restore();
  if (HAS_LS) ctx.letterSpacing = '0px';
}
/* anticipation: the finished object lines heat up just before the burst */
function heatSheet(ctx, S, g, s) {
  if (g <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  for (const st of S.strokes) {
    if (st.txt != null || (st.kind !== 'obj' && st.kind !== 'thin')) continue;
    const path = st.path || (st.path = fullPath(st));
    ctx.strokeStyle = rgba([255, 214, 150], 0.22 * g);
    ctx.lineWidth = Math.max(9 * s, 5) / s;
    ctx.stroke(path);
    ctx.strokeStyle = rgba([255, 244, 222], 0.55 * g);
    ctx.lineWidth = Math.max(2.6 * s, 1.4) / s;
    ctx.stroke(path);
  }
  ctx.restore();
}
/* plotter pen tips while drafting */
function drawHeads(ctx, heads, s) {
  if (!heads.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < heads.length; i += 3) {
    const x = heads[i], y = heads[i + 1], k = heads[i + 2];
    glow(ctx, x, y, 16 / s, [140, 200, 255], 0.55 * k);
    circ(ctx, x, y, 2.1 / s, rgba([255, 255, 255], 0.95 * k));
  }
  ctx.restore();
}

/* ---------- particles (stateless: position is a function of age) ---------- */
function emit(t, rate, life, fn, t0 = 0, t1 = Infinity) {
  if (t < t0) return;
  const iv = 1 / rate, tt = Math.min(t, t1) - t0;
  const i1 = Math.floor(tt / iv), i0 = Math.max(0, Math.ceil((t - t0 - life) / iv));
  for (let i = i0; i <= i1; i++) {
    const age = t - t0 - i * iv;
    if (age >= 0 && age <= life) fn(age, age / life, i);
  }
}
/* burst sparks flying outward from a set of points */
function drawSparks(ctx, pts, t, o) {
  if (t < 0 || t > 1.7 || !pts || !pts.length) return;
  const cx = o.cx || 0, cy = o.cy || 0, seed = o.seed || 1, s = o.s || 1, n = pts.length / 2;
  const hot = hex(o.hot || '#fff1c8'), mid = hex(o.mid || '#ffb347'), cool = hex(o.cool || '#ff5a1f');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const k = 3.4;
  for (let i = 0; i < n; i++) {
    const life = 0.45 + 0.95 * hash(i, seed);
    if (t > life) continue;
    const u = t / life, x0 = pts[2 * i], y0 = pts[2 * i + 1];
    let ang = Math.atan2(y0 - cy, x0 - cx) + (hash(i, seed + 1) - 0.5) * 1.1;
    if (x0 === cx && y0 === cy) ang = hash(i, seed + 5) * TAU;
    const sp = (170 + 640 * Math.pow(hash(i, seed + 2), 1.6)) * (o.speed || 1);
    const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
    const f = (1 - Math.exp(-k * t)) / k, v = Math.exp(-k * t);
    const x = x0 + vx * f, y = y0 + vy * f + 70 * t * t;
    const tail = 0.05;
    const c = u < 0.35 ? mix(hot, mid, u / 0.35) : mix(mid, cool, (u - 0.35) / 0.65);
    ctx.strokeStyle = rgba(c, Math.pow(1 - u, 1.4) * (o.alpha || 1));
    ctx.lineWidth = Math.max(2.2 * s, 1.3) / s * (1 - u * 0.5);
    ctx.beginPath();
    ctx.moveTo(x - vx * v * tail, y - (vy * v + 140 * t) * tail);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.restore();
}
/* anticipation: motes drawn inward to the ignition point */
function drawImplode(ctx, cx, cy, g, s, seed = 3) {
  if (g <= 0 || g >= 1) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const a0 = hash(i, seed) * TAU, r0 = 150 + 260 * hash(i, seed + 1);
    const d = clamp(g * (1.1 + hash(i, seed + 2) * 0.5));
    const r = r0 * (1 - E.inCubic(d)), a = a0 + d * 1.4;
    circ(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(1.5, 2.2 * s) / s, rgba([255, 226, 170], 0.85 * Math.sin(d * Math.PI)));
  }
  ctx.restore();
}
/* soft puff (smoke, steam, dust) */
function puff(ctx, x, y, r, c, a) { _stamp(ctx, 'p', x, y, r, c, a); }
