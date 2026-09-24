/* Rusty the Dog's Spacetime Adventure — animation core.
 * Everything is a pure function of time, so any frame can be rendered in any
 * order (the browser player seeks freely; the offline renderer runs in parallel).
 * Classic script (no modules) so it runs from file://, in the browser and in Node.
 */
(function (RV) {
  'use strict';

  const TAU = Math.PI * 2;
  RV.TAU = TAU;
  RV.W = 1920;
  RV.H = 1080;
  RV.OUT = '#2b1a14'; // cartoon outline colour

  // ---------------------------------------------------------------- math
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const fract = (x) => x - Math.floor(x);
  const remap = (x, a, b, c = 0, d = 1) => c + (d - c) * clamp((x - a) / (b - a));
  const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
  const pingpong = (x) => 1 - Math.abs(1 - 2 * fract(x));
  // 0 -> 1 -> 0 window: rises over [a, a+fi], falls over [b-fo, b]
  const win = (t, a, b, fi = 0.3, fo = 0.3) =>
    Math.min(fi > 0 ? smooth((t - a) / fi) : (t >= a ? 1 : 0), fo > 0 ? smooth((b - t) / fo) : (t <= b ? 1 : 0));
  Object.assign(RV, { clamp, lerp, fract, remap, smooth, smoother, pingpong, win });

  const ease = {
    linear: (t) => clamp(t),
    inQuad: (t) => { t = clamp(t); return t * t; },
    outQuad: (t) => { t = clamp(t); return 1 - (1 - t) * (1 - t); },
    inOutQuad: (t) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    inCubic: (t) => { t = clamp(t); return t * t * t; },
    outCubic: (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 3); },
    inOutCubic: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    outQuart: (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 4); },
    inOutSine: (t) => { t = clamp(t); return -(Math.cos(Math.PI * t) - 1) / 2; },
    outBack: (t, s = 1.70158) => { t = clamp(t); const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
    inBack: (t, s = 1.70158) => { t = clamp(t); return (s + 1) * t * t * t - s * t * t; },
    outElastic: (t) => {
      t = clamp(t);
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
    },
    outBounce: (t) => {
      t = clamp(t);
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };
  RV.ease = ease;

  // pop-in scale: overshoots then settles (0 before start)
  RV.pop = (t, dur = 0.35) => (t <= 0 ? 0 : ease.outBack(t / dur, 2.2));
  // springy wobble that dies away
  RV.wobble = (t, freq = 3, decay = 4) => (t < 0 ? 0 : Math.sin(t * freq * TAU) * Math.exp(-t * decay));

  // ---------------------------------------------------------------- random / noise
  function hash(n) {
    n = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }
  RV.hash = hash;
  RV.hash2 = (a, b) => hash(a * 57.31 + b * 113.97);
  RV.rng = function (seed) {
    let s = (Math.floor(seed * 9973) ^ 0x9e3779b9) >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // smooth 1D value noise in [-1, 1]
  RV.noise = function (x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    const u = f * f * (3 - 2 * f);
    return lerp(hash(i + seed * 101.3), hash(i + 1 + seed * 101.3), u) * 2 - 1;
  };

  // ---------------------------------------------------------------- colour
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  RV.hexToRgb = hexToRgb;
  RV.mix = function (a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  RV.rgba = (hex, a) => { const c = hexToRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  RV.hsl = (h, s, l, a = 1) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;

  // ---------------------------------------------------------------- musical time
  // Grid measured from the track: 176.0 BPM quarter notes, perfectly steady.
  RV.BEAT = 0.34090;
  RV.BEAT0 = 0.2443; // time of beat 0
  RV.beat = (t) => (t - RV.BEAT0) / RV.BEAT;        // quarter notes
  RV.half = (t) => RV.beat(t) / 2;                   // kick every half note
  RV.bar = (t) => (RV.beat(t) - 2) / 4;              // downbeats on integer values
  RV.beatTime = (b) => RV.BEAT0 + b * RV.BEAT;
  RV.barTime = (n) => RV.BEAT0 + (n * 4 + 2) * RV.BEAT;
  RV.snapBeat = (t, div = 1) => RV.beatTime(Math.round(RV.beat(t) * div) / div);
  RV.pulse = (t, k = 7, div = 1) => Math.exp(-fract(RV.beat(t) * div) * k);   // 1 on the beat, decays
  RV.kick = (t, k = 6) => Math.exp(-fract(RV.half(t)) * k);                     // half-note kick
  RV.barPulse = (t, k = 4) => Math.exp(-fract(RV.bar(t)) * k);
  RV.bounce = (t, div = 0.5, phase = 0) => Math.abs(Math.sin(Math.PI * (RV.beat(t) * div + phase)));
  RV.swing = (t, div = 0.5, phase = 0) => Math.sin(Math.PI * (RV.beat(t) * div + phase));

  // ---------------------------------------------------------------- drawing primitives
  RV.circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, TAU); };
  RV.ellipse = (ctx, x, y, rx, ry, rot = 0) => {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, Math.abs(rx)), Math.max(0.01, Math.abs(ry)), rot, 0, TAU);
  };
  RV.rrect = (ctx, x, y, w, h, r) => {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  // fill + outline in one call
  RV.fs = (ctx, fill, lw = 0, stroke = RV.OUT) => {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  };
  // smooth closed/open curve through points (Catmull-Rom converted to Beziers)
  RV.curve = function (ctx, pts, closed = true, tension = 0.5, begin = true) {
    const n = pts.length;
    if (begin) ctx.beginPath();
    if (n < 2) return;
    const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    ctx.moveTo(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const k = tension / 3;
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k,
        p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k,
        p2[0], p2[1]);
    }
    if (closed) ctx.closePath();
  };
  // thick rubber-hose limb through points with an outline
  RV.limb = function (ctx, pts, width, color, ow = 5, outline = RV.OUT) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      // control point chosen so the curve passes through the middle joint
      if (pts.length === 3) {
        const cx = 2 * pts[1][0] - (pts[0][0] + pts[2][0]) / 2, cy = 2 * pts[1][1] - (pts[0][1] + pts[2][1]) / 2;
        ctx.quadraticCurveTo(cx, cy, pts[2][0], pts[2][1]);
      }
      else for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    };
    if (ow > 0) { path(); ctx.lineWidth = width + ow * 2; ctx.strokeStyle = outline; ctx.stroke(); }
    path(); ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
  };
  // two-segment joint helper: start point, lengths, angles (0 = straight down, +ve rotates toward +x)
  RV.joint = function (x, y, l1, a1, l2, a2) {
    const ex = x + Math.sin(a1) * l1, ey = y + Math.cos(a1) * l1;
    const hx = ex + Math.sin(a1 + a2) * l2, hy = ey + Math.cos(a1 + a2) * l2;
    return [[x, y], [ex, ey], [hx, hy]];
  };

  // star / sparkle shapes
  RV.star = function (ctx, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  RV.sparkle = function (ctx, x, y, r, color = '#fff', alpha = 1) {
    if (r <= 0.2 || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
    ctx.restore();
  };
  RV.heart = function (ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
    ctx.closePath();
  };
  RV.glow = function (ctx, x, y, r, color, alpha = 1) {
    if (r <= 0 || alpha <= 0) return;
    const c = hexToRgb(color);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${alpha})`);
    g.addColorStop(0.35, `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // ---------------------------------------------------------------- text
  RV.FONT = {
    title: '"Luckiest Guy", "Arial Black", sans-serif',
    body: '"Fredoka", "Trebuchet MS", sans-serif',
    groovy: '"Shrikhand", "Georgia", serif',
    pixel: '"VT323", "Courier New", monospace',
    disco: '"Monoton", "Arial Black", sans-serif',
  };
  // big cartoon text with outline + drop shadow
  RV.bigText = function (ctx, text, x, y, size, o = {}) {
    ctx.save();
    ctx.font = `${size}px ${o.font || RV.FONT.title}`;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const lw = o.lw != null ? o.lw : size * 0.14;
    if (o.shadow !== false) {
      ctx.fillStyle = o.shadowColor || 'rgba(0,0,0,0.35)';
      ctx.strokeStyle = o.shadowColor || 'rgba(0,0,0,0.35)';
      ctx.lineWidth = lw;
      const sd = o.shadowDist != null ? o.shadowDist : size * 0.08;
      ctx.strokeText(text, x + sd * 0.4, y + sd);
      ctx.fillText(text, x + sd * 0.4, y + sd);
    }
    if (lw > 0) { ctx.strokeStyle = o.stroke || RV.OUT; ctx.lineWidth = lw; ctx.strokeText(text, x, y); }
    if (o.gradient) {
      const g = ctx.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5);
      o.gradient.forEach((c, i) => g.addColorStop(i / (o.gradient.length - 1), c));
      ctx.fillStyle = g;
    } else ctx.fillStyle = o.fill || '#ffd23f';
    ctx.fillText(text, x, y);
    if (o.shine) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#fff';
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 4000, y - size * 0.62, 8000, size * 0.42);
      ctx.clip();
      ctx.fillText(text, x, y);
      ctx.restore();
    }
    ctx.restore();
  };
  // per-letter animated title. fn(i, n) -> {dx, dy, s, r, a}
  RV.letters = function (ctx, text, x, y, size, o, fn) {
    ctx.save();
    ctx.font = `${size}px ${o.font || RV.FONT.title}`;
    const spacing = o.spacing || 0;
    const widths = [...text].map((ch) => ctx.measureText(ch).width + spacing);
    const total = widths.reduce((a, b) => a + b, 0) - spacing;
    let cx = x - (o.align === 'left' ? 0 : total / 2);
    const chars = [...text];
    chars.forEach((ch, i) => {
      const w = widths[i];
      const m = fn ? fn(i, chars.length) : {};
      if ((m.s == null || m.s > 0.01) && ch !== ' ') {
        ctx.save();
        ctx.translate(cx + w / 2 - spacing / 2 + (m.dx || 0), y + (m.dy || 0));
        ctx.rotate(m.r || 0);
        const s = m.s == null ? 1 : m.s;
        ctx.scale(s, s);
        ctx.globalAlpha *= m.a == null ? 1 : m.a;
        RV.bigText(ctx, ch, 0, 0, size, Object.assign({}, o, { align: 'center', fill: m.fill || o.fill }));
        ctx.restore();
      }
      cx += w;
    });
    ctx.restore();
    return total;
  };

  // ---------------------------------------------------------------- camera
  // zoom/pan/rotate about the frame centre; shake adds smooth noise
  RV.camera = function (ctx, c = {}) {
    const W = RV.W, H = RV.H;
    const z = c.zoom || 1;
    let x = c.x || 0, y = c.y || 0, r = c.rot || 0;
    if (c.shake) {
      const t = c.t || 0;
      x += RV.noise(t * 23, 1) * c.shake;
      y += RV.noise(t * 23, 2) * c.shake;
      r += RV.noise(t * 17, 3) * c.shake * 0.0015;
    }
    ctx.translate(W / 2, H / 2);
    ctx.rotate(r);
    ctx.scale(z, z);
    ctx.translate(-W / 2 - x, -H / 2 - y);
  };

  // offscreen canvases (set per environment)
  RV.makeCanvas = RV.makeCanvas || function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };
  const pool = {};
  RV.buffer = function (name, w = RV.W, h = RV.H) {
    const key = name + ':' + w + 'x' + h;
    if (!pool[key]) pool[key] = RV.makeCanvas(w, h);
    const c = pool[key];
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    return c;
  };
})(typeof globalThis !== 'undefined' ? (globalThis.RV = globalThis.RV || {}) : (window.RV = window.RV || {}));
