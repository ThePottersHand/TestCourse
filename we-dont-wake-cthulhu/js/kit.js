/* Drawing kit: math, beat sync, color, shading, sprites, text, particles.
   Everything is a pure function of time so the video can be scrubbed or rendered frame by frame. */
'use strict';

const W = 1920, H = 1080;
const TAU = Math.PI * 2;
const INK = '#2a1b3d';
const DISPLAY = '"Mochiy Pop One", "Fredoka", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
const ROUND = '"Fredoka", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';

const PAL = {
  ink: INK,
  cream: '#fff6e6',
  gold: '#ffd166',
  pink: '#ff8fc7',
  rose: '#ff6f9f',
  mint: '#8fe3b0',
  teal: '#4fc4b5',
  lilac: '#b59cff',
  violet: '#7b4fd6',
  sky: '#6fb7ff',
  night: '#1b1446',
  blush: 'rgba(255,120,150,0.38)',
  skin: '#ffe2cf',
  skinShade: '#f6bfa8',
};

/* ---------- math ---------- */
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (x) => x * x * (3 - 2 * x);
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutBack = (x, k = 1.9) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
const easeOutElastic = (x) =>
  x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin(((x * 10 - 0.75) * TAU) / 3) + 1;
const pop = (t, t0, d = 0.4) => (t < t0 ? 0 : easeOutBack(seg(t, t0, t0 + d)));
const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));

function rnd(i, salt = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(salt | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function noise1(x, salt = 0) {
  const i = Math.floor(x), f = x - i;
  return lerp(rnd(i, salt), rnd(i + 1, salt), smooth(f)) * 2 - 1;
}

/* ---------- color ---------- */
const _rgb = new Map();
function toRgba(s) {
  let v = _rgb.get(s);
  if (v) return v;
  if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1];
  } else {
    const m = s.match(/[\d.]+/g) || [0, 0, 0, 1];
    v = [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]];
  }
  _rgb.set(s, v);
  return v;
}
const _mix = new Map();
function mix(a, b, k) {
  const key = a + '|' + b + '|' + k;
  let v = _mix.get(key);
  if (v) return v;
  const A = toRgba(a), B = toRgba(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * k), g = Math.round(A[1] + (B[1] - A[1]) * k), bl = Math.round(A[2] + (B[2] - A[2]) * k);
  v = '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  _mix.set(key, v);
  return v;
}
const isHex = (s) => typeof s === 'string' && s[0] === '#';
const darken = (h, k = 0.22) => mix(h, '#1c1033', k);
const lighten = (h, k = 0.25) => mix(h, '#ffffff', k);
/* colored line art: a deep, hue-matched version of the fill */
const lineOf = (h) => (isHex(h) ? mix(h, '#1e1235', 0.72) : INK);
function rgba(c, a) { const [r, g, b] = toRgba(c); return `rgba(${r},${g},${b},${a})`; }

/* ---------- beat sync ---------- */
function beatInfo(t) {
  const n = BEATS.length;
  let i, f, p;
  if (t < BEATS[0]) {
    p = BEATS[1] - BEATS[0];
    const k = (t - BEATS[0]) / p;
    i = Math.floor(k); f = k - i;
  } else if (t >= BEATS[n - 1]) {
    p = BEATS[n - 1] - BEATS[n - 2];
    const k = (t - BEATS[n - 1]) / p;
    i = n - 1 + Math.floor(k); f = k - Math.floor(k);
  } else {
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (BEATS[m] <= t) lo = m; else hi = m; }
    i = lo; p = BEATS[lo + 1] - BEATS[lo]; f = (t - BEATS[lo]) / p;
  }
  const inBar = ((i % 4) + 4) % 4;
  return { i, f, p, inBar, bar: Math.floor(i / 4), barF: (inBar + f) / 4, pulse: Math.pow(1 - f, 3) };
}
function beatTime(i) {
  const n = BEATS.length;
  if (i < 0) return BEATS[0] + i * (BEATS[1] - BEATS[0]);
  if (i >= n) return BEATS[n - 1] + (i - n + 1) * (BEATS[n - 1] - BEATS[n - 2]);
  return BEATS[i];
}
function hop(t, amp = 20, every = 1, offset = 0) {
  const b = beatInfo(t);
  const k = (b.i + b.f + offset) / every;
  return -Math.abs(Math.sin(Math.PI * k)) * amp;
}
function squash(t, amt = 0.1, every = 1, offset = 0) {
  const b = beatInfo(t);
  const k = (b.i + b.f + offset) / every;
  const f = k - Math.floor(k);
  return 1 - amt * Math.pow(1 - f, 5) + amt * 0.4 * Math.sin(Math.PI * f);
}
function sway(t, amp = 1, every = 2, offset = 0) {
  const b = beatInfo(t);
  return Math.sin(((b.i + b.f + offset) / every) * Math.PI) * amp;
}

/* ---------- lead-vocal envelope (lip sync from the word timings) ---------- */
function vocal(t) {
  for (let li = 0; li < LINES.length; li++) {
    const [, s, e, words] = LINES[li];
    if (t < s - 0.04 || t > e + 0.06) continue;
    let k = 0;
    while (k + 1 < words.length && words[k + 1][1] <= t) k++;
    const ws = words[k][1];
    if (t < ws) return { open: 0, round: 0 };
    const we = k + 1 < words.length ? words[k + 1][1] : e;
    const d = Math.max(0.12, we - ws), u = t - ws;
    const env = clamp(u / 0.05) * (1 - clamp((u - d + 0.07) / 0.07));
    const wob = d > 0.45 ? 0.82 + 0.18 * Math.sin(u * 28) : 1;
    const w = words[k][0].toLowerCase();
    return { open: env * wob * (0.62 + 0.38 * rnd(k, li + 7)), round: /[ou]/.test(w) && !/[ei]/.test(w) ? 0.8 : 0.25 };
  }
  return { open: 0, round: 0 };
}

/* ---------- paths ---------- */
function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.01, r), 0, TAU); }
function ellipse(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); }
function rrect(c, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function pEllipse(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); return p; }
function pRRect(x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  const p = new Path2D();
  p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r);
  p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
  return p;
}
/* fill + (hue-matched) outline. Pass stroke=null for no outline. */
function fs(c, fill, stroke = INK, lw = 5) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke && lw > 0) {
    c.lineWidth = lw;
    c.strokeStyle = stroke === INK && isHex(fill) ? lineOf(fill) : stroke;
    c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
  }
}
function line(c, x1, y1, x2, y2, color = INK, lw = 5) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.stroke();
}
/* cel shading on a Path2D: base fill, shadow crescent away from the light (top-left), optional highlight, outline */
const _shift = new Map();
function shiftM(dx, dy) { const k = dx + ',' + dy; let m = _shift.get(k); if (!m) { m = new DOMMatrix([1, 0, 0, 1, dx, dy]); _shift.set(k, m); } return m; }
function cel(c, path, base, o = {}) {
  c.fillStyle = base; c.fill(path);
  const d = o.d ?? 10;
  if (o.shadow !== false && d > 0) {
    c.save(); c.clip(path);
    const sp = new Path2D(); sp.addPath(path); sp.addPath(path, shiftM(-d, -d * 1.1));
    c.fillStyle = o.shadow || darken(base, 0.18);
    c.fill(sp, 'evenodd');
    c.restore();
  }
  if (o.hi) {
    c.save(); c.clip(path);
    const hd = o.hd ?? d * 0.55;
    const hp = new Path2D(); hp.addPath(path); hp.addPath(path, shiftM(hd, hd * 1.1));
    c.fillStyle = o.hi; c.fill(hp, 'evenodd');
    c.restore();
  }
  if (o.lw !== 0) {
    c.lineWidth = o.lw ?? 5; c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = o.line || (isHex(base) ? lineOf(base) : INK);
    c.stroke(path);
  }
}
function starPath(c, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
  c.beginPath();
  for (let k = 0; k < n * 2; k++) {
    const r = k % 2 ? r2 : r1, a = rot + (k * Math.PI) / n;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}
function softStar(c, x, y, r, n = 5, rot = -Math.PI / 2, inner = 0.5) {
  c.beginPath();
  const pts = [];
  for (let k = 0; k < n * 2; k++) {
    const rr = k % 2 ? r * inner : r, a = rot + (k * Math.PI) / n;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = m(pts[pts.length - 1], pts[0]);
  c.moveTo(s[0], s[1]);
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k], q = m(p, pts[(k + 1) % pts.length]);
    c.quadraticCurveTo(p[0], p[1], q[0], q[1]);
  }
  c.closePath();
}
function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  c.closePath();
}
function sparkle(c, x, y, s, color = '#fff', rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath();
  c.moveTo(0, -s);
  c.quadraticCurveTo(s * 0.12, -s * 0.12, s, 0);
  c.quadraticCurveTo(s * 0.12, s * 0.12, 0, s);
  c.quadraticCurveTo(-s * 0.12, s * 0.12, -s, 0);
  c.quadraticCurveTo(-s * 0.12, -s * 0.12, 0, -s);
  c.fillStyle = color; c.fill();
  c.restore();
}
function cloudPath(c, x, y, w, h, bumps = 9, seed = 1) {
  c.beginPath();
  for (let k = 0; k <= bumps; k++) {
    const a0 = (k / bumps) * TAU, a1 = ((k + 1) / bumps) * TAU;
    const p0 = [x + Math.cos(a0) * w / 2, y + Math.sin(a0) * h / 2];
    const p1 = [x + Math.cos(a1) * w / 2, y + Math.sin(a1) * h / 2];
    const am = (a0 + a1) / 2, bulge = 1.28 + rnd(k % bumps, seed) * 0.12;
    const cp = [x + Math.cos(am) * w / 2 * bulge, y + Math.sin(am) * h / 2 * bulge];
    if (k === 0) c.moveTo(p0[0], p0[1]);
    c.quadraticCurveTo(cp[0], cp[1], p1[0], p1[1]);
  }
  c.closePath();
}

/* ---------- cached sprites (glows, shadows, bokeh) ---------- */
const _spr = new Map();
function sprite(key, w, h, draw) {
  let cv = _spr.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    _spr.set(key, cv);
  }
  return cv;
}
function glowSprite(color) {
  return sprite('glow:' + color, 128, 128, (g) => {
    const [r, gg, b, a] = toRgba(color);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${r},${gg},${b},${a})`);
    gr.addColorStop(0.22, `rgba(${r},${gg},${b},${a * 0.62})`);
    gr.addColorStop(0.5, `rgba(${r},${gg},${b},${a * 0.2})`);
    gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
}
function glow(c, x, y, r, color, a = 1) {
  if (r <= 0 || a <= 0) return;
  const pa = c.globalAlpha;
  c.globalAlpha = pa * a;
  c.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = pa;
}
/* elliptical glow (light pools on floors, spills) */
function glowE(c, x, y, rx, ry, color, a = 1) {
  if (rx <= 0 || ry <= 0 || a <= 0) return;
  const pa = c.globalAlpha;
  c.globalAlpha = pa * a;
  c.drawImage(glowSprite(color), x - rx, y - ry, rx * 2, ry * 2);
  c.globalAlpha = pa;
}
/* soft contact shadow under characters/props */
function groundShadow(c, x, y, rx, ry = rx * 0.24, a = 0.34) {
  const s = sprite('shadow', 128, 64, (g) => {
    const gr = g.createRadialGradient(64, 32, 0, 64, 32, 64);
    gr.addColorStop(0, 'rgba(22,10,48,0.9)'); gr.addColorStop(0.55, 'rgba(22,10,48,0.45)'); gr.addColorStop(1, 'rgba(22,10,48,0)');
    g.setTransform(1, 0, 0, 0.5, 0, 16); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const pa = c.globalAlpha;
  c.globalAlpha = pa * a;
  c.drawImage(s, x - rx, y - ry, rx * 2, ry * 2);
  c.globalAlpha = pa;
}
function bokehSprite(color) {
  return sprite('bokeh:' + color, 128, 128, (g) => {
    const [r, gg, b] = toRgba(color);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
    gr.addColorStop(0, `rgba(${r},${gg},${b},0.35)`);
    gr.addColorStop(0.78, `rgba(${r},${gg},${b},0.5)`);
    gr.addColorStop(0.92, `rgba(${r},${gg},${b},0.75)`);
    gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 63, 0, TAU); g.fill();
  });
}
/* out-of-focus light circles */
function bokeh(c, t, n, x0, y0, w, h, colors, salt = 3, size = 1, alpha = 0.5) {
  const pa = c.globalAlpha, pc = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < n; k++) {
    const r = (18 + rnd(k, salt) * 46) * size;
    const x = x0 + ((rnd(k, salt + 1) * w + t * (6 + rnd(k, salt + 2) * 10)) % (w + r * 2)) - r;
    const y = y0 + rnd(k, salt + 3) * h + Math.sin(t * 0.6 + k) * 10;
    c.globalAlpha = pa * alpha * (0.45 + 0.55 * Math.sin(t * (0.6 + rnd(k, salt + 4)) + k) ** 2);
    c.drawImage(bokehSprite(colors[k % colors.length]), x - r, y - r, r * 2, r * 2);
  }
  c.globalAlpha = pa; c.globalCompositeOperation = pc;
}

/* speech bubble with a soft drop shadow: rounded box + tail pointing at (tx, ty). spiky = shouting */
function bubble(c, x, y, w, h, tx, ty, o = {}) {
  const fill = o.fill || '#fff', lw = o.lw ?? 6;
  const ang = Math.atan2(ty - y, tx - x);
  const bx = x + Math.cos(ang) * w * 0.28, by = y + Math.sin(ang) * h * 0.36;
  const px = -Math.sin(ang) * 22, py = Math.cos(ang) * 22;
  const body = new Path2D();
  if (o.spiky) {
    const n = 18;
    for (let k = 0; k < n * 2; k++) {
      const a = (k / (n * 2)) * TAU;
      const r = k % 2 ? 0.86 : 1.08 + rnd(k, 7) * 0.08;
      const X = x + Math.cos(a) * w / 2 * r * 1.1, Y = y + Math.sin(a) * h / 2 * r * 1.15;
      k ? body.lineTo(X, Y) : body.moveTo(X, Y);
    }
    body.closePath();
  } else body.addPath(pRRect(x - w / 2, y - h / 2, w, h, Math.min(h / 2, 46)));
  const tail = new Path2D();
  tail.moveTo(bx + px, by + py);
  tail.quadraticCurveTo((bx + tx) / 2 + px * 0.2, (by + ty) / 2 + py * 0.2, tx, ty);
  tail.quadraticCurveTo((bx + tx) / 2 - px * 0.6, (by + ty) / 2 - py * 0.6, bx - px, by - py);
  tail.closePath();
  c.save();
  // drop shadow
  c.save(); c.translate(8, 10); c.fillStyle = 'rgba(20,10,45,0.28)'; c.fill(body); c.fill(tail); c.restore();
  const line = o.line || (isHex(fill) ? mix(fill, '#1e1235', 0.78) : INK);
  c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = line;
  c.stroke(body); c.stroke(tail);
  c.fillStyle = fill; c.fill(body); c.fill(tail);
  // inner gloss
  c.save(); c.clip(body);
  const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,40,0.06)');
  c.fillStyle = g; c.fillRect(x - w, y - h, w * 2, h * 2);
  c.restore();
  c.restore();
}

/* ---------- text ---------- */
function txt(c, s, x, y, o = {}) {
  const size = o.size || 48;
  c.save();
  c.font = `${o.weight || 600} ${size}px ${o.font || ROUND}`;
  c.textAlign = o.align || 'center';
  c.textBaseline = o.baseline || 'middle';
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); x = 0; y = 0; }
  if (o.shadow !== false && o.stroke !== false) {
    c.fillStyle = 'rgba(20,8,45,0.35)';
    c.fillText(s, x + size * 0.04, y + size * 0.08);
  }
  if (o.stroke !== false) {
    c.lineJoin = 'round';
    c.lineWidth = o.lw || size * 0.2;
    c.strokeStyle = o.stroke || INK;
    c.strokeText(s, x, y);
  }
  if (o.grad) {
    const m = c.measureText(s);
    const g = c.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.4);
    g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]);
    c.fillStyle = g;
    void m;
  } else c.fillStyle = o.fill || '#fff';
  c.fillText(s, x, y);
  c.restore();
}
/* glossy lettering: each glyph rendered once into a cached sprite (gradient fill, gloss band, outline, shadow) */
function glyphSprite(ch, size, top, bot, stroke = INK, font = DISPLAY) {
  const key = ['glyph', ch, size, top, bot, stroke, font].join('|');
  const pad = Math.ceil(size * 0.38);
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `400 ${size}px ${font}`;
  const w = Math.ceil(probe.measureText(ch).width) + pad * 2, h = Math.ceil(size * 1.3) + pad * 2;
  return sprite(key, w, h, (g) => {
    g.font = `400 ${size}px ${font}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const cx = w / 2, cy = h / 2;
    g.lineJoin = 'round';
    g.fillStyle = 'rgba(20,8,45,0.45)'; g.lineWidth = size * 0.26; g.strokeStyle = 'rgba(20,8,45,0.45)';
    g.strokeText(ch, cx + size * 0.03, cy + size * 0.09); g.fillText(ch, cx + size * 0.03, cy + size * 0.09);
    g.strokeStyle = stroke; g.lineWidth = size * 0.24; g.strokeText(ch, cx, cy);
    g.lineWidth = size * 0.1; g.strokeStyle = mix(top, '#ffffff', 0.55); g.strokeText(ch, cx, cy);
    const gr = g.createLinearGradient(0, cy - size * 0.5, 0, cy + size * 0.45);
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillText(ch, cx, cy);
    // gloss band on the upper third of the letter
    g.globalCompositeOperation = 'source-atop';
    const gl = g.createLinearGradient(0, cy - size * 0.55, 0, cy);
    gl.addColorStop(0, 'rgba(255,255,255,0.75)'); gl.addColorStop(0.6, 'rgba(255,255,255,0.18)'); gl.addColorStop(0.61, 'rgba(255,255,255,0)');
    g.fillStyle = gl; g.fillRect(0, 0, w, cy);
  });
}
/* bouncy title: letters pop in one by one and bob on the beat */
function bouncyText(c, s, x, y, t, t0, o = {}) {
  const size = o.size || 110, gap = o.gap ?? 0.06;
  const font = o.font || DISPLAY;
  c.save();
  c.font = `400 ${size}px ${font}`;
  const track = o.track || 0;
  const widths = [...s].map((ch) => c.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + (s.length - 1) * track;
  let cx = x - total / 2;
  const cols = o.colors || [['#ffffff', '#e8dcff']];
  for (let k = 0; k < s.length; k++) {
    const ch = s[k], w = widths[k];
    const p = pop(t, t0 + k * gap, 0.5);
    if (p > 0 && ch !== ' ') {
      const bob = o.bob === false ? 0 : Math.sin(t * 4 + k * 0.7) * size * 0.035 + hop(t, size * 0.06, 1, k * 0.12);
      const col = cols[k % cols.length];
      const spr = glyphSprite(ch, size, Array.isArray(col) ? col[0] : col, Array.isArray(col) ? col[1] : mix(col, '#1e1235', 0.25), o.stroke || INK, font);
      c.save();
      c.translate(cx + w / 2, y + bob);
      c.rotate(Math.sin(t * 2.6 + k) * 0.05);
      c.scale(p, p);
      c.drawImage(spr, -spr.width / 2, -spr.height / 2);
      c.restore();
    }
    cx += w + track;
  }
  c.restore();
}

/* ---------- camera / fx ---------- */
function camera(c, x, y, zoom = 1, rot = 0) {
  c.translate(W / 2, H / 2);
  if (rot) c.rotate(rot);
  c.scale(zoom, zoom);
  c.translate(-x, -y);
}
let REDUCED_MOTION = false;
function shake(t, t0, amp = 14, dur = 0.5) {
  if (REDUCED_MOTION || t < t0 || t > t0 + dur) return [0, 0];
  const k = 1 - (t - t0) / dur;
  return [noise1(t * 40, 3) * amp * k, noise1(t * 40, 9) * amp * k];
}
function burst(c, x, y, t, colA, colB, n = 20, r = 2400, spin = 0.25) {
  c.save();
  c.translate(x, y);
  c.fillStyle = colA; c.fillRect(-r, -r, r * 2, r * 2);
  c.rotate(t * spin);
  c.beginPath();
  for (let k = 0; k < n; k += 2) {
    const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU;
    c.moveTo(0, 0); c.arc(0, 0, r, a0, a1); c.closePath();
  }
  c.fillStyle = colB; c.fill();
  c.restore();
  glow(c, x, y, 700, 'rgba(255,255,255,0.45)');
}
function speedLines(c, x, y, t, color = 'rgba(255,255,255,0.8)', n = 60, inner = 380) {
  c.save();
  c.fillStyle = color;
  c.beginPath();
  for (let k = 0; k < n; k++) {
    const a = rnd(k, Math.floor(t * 12)) * TAU;
    const r0 = inner + rnd(k, 5 + Math.floor(t * 12)) * 260;
    const wdt = 0.006 + rnd(k, 11) * 0.012;
    c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    c.lineTo(x + Math.cos(a - wdt) * 2400, y + Math.sin(a - wdt) * 2400);
    c.lineTo(x + Math.cos(a + wdt) * 2400, y + Math.sin(a + wdt) * 2400);
    c.closePath();
  }
  c.fill();
  c.restore();
}
function vignette(c, a = 0.45) {
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(10,5,30,0)');
  g.addColorStop(1, `rgba(10,5,30,${a})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
/* a soft light shaft between two edges, drawn additively */
function lightShaft(c, x0a, y0, x0b, x1a, y1, x1b, color, a = 0.25) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.beginPath(); c.moveTo(x0a, y0); c.lineTo(x0b, y0); c.lineTo(x1b, y1); c.lineTo(x1a, y1); c.closePath(); c.fill();
  c.restore();
}

/* ---------- particles (stateless) ---------- */
function bubblesFx(c, t, n, x0, y0, w, h, o = {}) {
  const speed = o.speed || 90, maxR = o.r || 16;
  c.save();
  for (let k = 0; k < n; k++) {
    const r = 4 + rnd(k, 21) * maxR;
    const life = h + 60;
    const y = y0 + h - ((t * speed * (0.6 + rnd(k, 22)) + rnd(k, 23) * life) % life);
    const x = x0 + rnd(k, 24) * w + Math.sin(t * 2 + k) * 12;
    circle(c, x, y, r);
    c.fillStyle = 'rgba(200,240,255,0.12)'; c.fill();
    c.lineWidth = Math.max(1.5, r * 0.16); c.strokeStyle = 'rgba(225,250,255,0.7)'; c.stroke();
    c.beginPath(); c.arc(x, y, r * 0.66, Math.PI * 1.1, Math.PI * 1.5); c.lineWidth = Math.max(1.5, r * 0.18); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
  }
  c.restore();
}
function twinkles(c, t, n, x0, y0, w, h, salt = 1, size = 1) {
  for (let k = 0; k < n; k++) {
    const x = x0 + rnd(k, salt) * w, y = y0 + rnd(k, salt + 1) * h;
    const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + rnd(k, salt + 2) * 3) + k);
    const s = (1.6 + rnd(k, salt + 3) * 4) * size;
    const big = rnd(k, salt + 4) < 0.16;
    if (big) {
      glow(c, x, y, s * 9, 'rgba(255,245,210,0.5)', 0.4 + tw * 0.6);
      sparkle(c, x, y, s * (1.6 + tw * 1.6), `rgba(255,252,235,${0.55 + tw * 0.45})`);
    } else {
      circle(c, x, y, s * 0.5 * (0.6 + tw * 0.6));
      c.fillStyle = `rgba(255,255,245,${0.3 + tw * 0.6})`; c.fill();
    }
  }
}
function confetti(c, t, t0, x, y, n = 60, spread = 900, colors = ['#ff8fc7', '#ffd166', '#8fe3b0', '#6fb7ff', '#b59cff']) {
  const dt = t - t0;
  if (dt < 0 || dt > 4) return;
  c.save();
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (rnd(k, 31) - 0.5) * 2.4;
    const v = spread * (0.5 + rnd(k, 32) * 0.7);
    const drag = 1 - Math.min(0.6, dt * 0.25);
    const px = x + Math.cos(a) * v * dt * drag + Math.sin(dt * 3 + k) * 20 * dt;
    const py = y + Math.sin(a) * v * dt * drag + 520 * dt * dt;
    c.save();
    c.translate(px, py);
    c.rotate(dt * (4 + rnd(k, 33) * 8));
    c.scale(1, Math.cos(dt * 9 + k));
    c.globalAlpha = 1 - seg(dt, 2.6, 4);
    const col = colors[k % colors.length];
    c.fillStyle = col;
    if (k % 3 === 0) { heartPath(c, 0, 0, 11); c.fill(); } else c.fillRect(-9, -5, 18, 10);
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(-9, -5, 18, 3);
    c.restore();
  }
  c.restore();
}
function heartsFx(c, t, n, x0, y0, w, h, salt = 5, size = 1) {
  for (let k = 0; k < n; k++) {
    const life = 3 + rnd(k, salt) * 2;
    const ph = ((t + rnd(k, salt + 1) * life) % life) / life;
    const x = x0 + rnd(k, salt + 2) * w + Math.sin(t * 2 + k) * 18;
    const y = y0 + h - ph * h;
    const s = (14 + rnd(k, salt + 3) * 14) * size;
    c.save();
    c.globalAlpha = Math.sin(ph * Math.PI);
    glow(c, x, y - s * 0.2, s * 2.4, 'rgba(255,140,190,0.35)');
    heartPath(c, x, y, s);
    const col = k % 2 ? '#ff8fc7' : '#ff6f9f';
    const g = c.createLinearGradient(0, y - s, 0, y + s * 0.4);
    g.addColorStop(0, lighten(col, 0.35)); g.addColorStop(1, col);
    fs(c, g, lineOf(col), 3);
    c.restore();
  }
}
function zzz(c, x, y, t, s = 1, color = '#e9f7ff') {
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.45 + k / 3) % 1;
    c.save();
    c.globalAlpha = Math.sin(ph * Math.PI);
    txt(c, 'Z', x + ph * 70 * s + Math.sin(ph * 6) * 10, y - ph * 150 * s, {
      size: (26 + ph * 34) * s, font: DISPLAY, weight: 400, fill: color, lw: 7 * s, rot: -0.2 + ph * 0.3, stroke: '#3a3a8a',
    });
    c.restore();
  }
}
function noteGlyph(c, x, y, s, color, rot, double) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const ln = mix(color, '#1e1235', 0.7);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const heads = double ? [[-12, 16], [12, 10]] : [[0, 16]];
  c.beginPath();
  heads.forEach(([hx, hy]) => { c.moveTo(hx + 9, hy); c.lineTo(hx + 9, hy - 34); });
  if (double) { c.moveTo(-3, -18); c.lineTo(21, -24); c.lineTo(21, -18); c.lineTo(-3, -12); }
  else { c.moveTo(9, -18); c.quadraticCurveTo(22, -12, 18, 0); }
  c.lineWidth = 9; c.strokeStyle = ln; c.stroke();
  c.lineWidth = 4; c.strokeStyle = color; c.stroke();
  heads.forEach(([hx, hy]) => { ellipse(c, hx, hy, 11, 8, -0.4); c.fillStyle = color; c.fill(); c.lineWidth = 3; c.strokeStyle = ln; c.stroke(); });
  c.restore();
}
function notesFx(c, t, n, x0, y0, w, h, salt = 9, color = '#fff') {
  for (let k = 0; k < n; k++) {
    const life = 2.5 + rnd(k, salt) * 2;
    const ph = ((t + rnd(k, salt + 1) * life) % life) / life;
    const x = x0 + rnd(k, salt + 2) * w + Math.sin(t * 3 + k) * 20;
    const y = y0 + h - ph * h;
    c.save();
    c.globalAlpha = Math.sin(ph * Math.PI);
    noteGlyph(c, x, y, 0.9 + rnd(k, salt + 3) * 0.7, color, Math.sin(t * 2 + k) * 0.25, k % 2 === 1);
    c.restore();
  }
}
/* drifting specks in water / dust in light */
function motes(c, t, n, x0, y0, w, h, salt = 11, color = 'rgba(230,245,255,0.7)', size = 1) {
  c.fillStyle = color;
  c.beginPath();
  for (let k = 0; k < n; k++) {
    const x = x0 + ((rnd(k, salt) * w + t * (4 + rnd(k, salt + 1) * 10)) % w);
    const y = y0 + ((rnd(k, salt + 2) * h + t * (6 + rnd(k, salt + 3) * 12)) % h);
    const r = (0.8 + rnd(k, salt + 4) * 2.4) * size;
    c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
  }
  c.fill();
}

/* ---------- emotes ---------- */
function sweatDrop(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath();
  c.moveTo(0, -26);
  c.quadraticCurveTo(18, 0, 14, 10);
  c.arc(0, 10, 14, 0, Math.PI);
  c.quadraticCurveTo(-18, 0, 0, -26);
  const g = c.createLinearGradient(0, -26, 0, 24);
  g.addColorStop(0, '#d8f4ff'); g.addColorStop(1, '#7fc8f0');
  fs(c, g, '#3a6f9a', 4);
  ellipse(c, -4, 8, 4, 6, -0.3); c.fillStyle = '#fff'; c.fill();
  c.restore();
}
function exclaim(c, x, y, s = 1, color = '#ff6f6f', rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.moveTo(-12, -60); c.lineTo(12, -60); c.lineTo(6, 6); c.lineTo(-6, 6); c.closePath();
  fs(c, color, INK, 5);
  circle(c, 0, 26, 10); fs(c, color, INK, 5);
  c.restore();
}
function question(c, x, y, s = 1, color = '#ffd166', rot = 0) {
  txt(c, '?', x, y, { size: 90 * s, font: DISPLAY, weight: 400, fill: color, lw: 16 * s, rot, stroke: lineOf(color) });
}
function gloomLines(c, x, y, w, s = 1) {
  c.save();
  for (let k = 0; k < 5; k++) {
    line(c, x - w / 2 + (k * w) / 4, y, x - w / 2 + (k * w) / 4, y + (26 + (k % 2) * 14) * s, 'rgba(90,70,200,0.75)', 4 * s);
  }
  c.restore();
}
function lightbulb(c, x, y, s = 1, t = 0) {
  if (s <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s);
  glow(c, 0, -10, 150, 'rgba(255,230,120,0.8)');
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + t;
    line(c, Math.cos(a) * 62, -10 + Math.sin(a) * 62, Math.cos(a) * 84, -10 + Math.sin(a) * 84, '#ffd166', 7);
  }
  circle(c, 0, -14, 40);
  const g = c.createRadialGradient(-12, -28, 4, 0, -14, 44);
  g.addColorStop(0, '#fffde0'); g.addColorStop(1, '#ffe27a');
  fs(c, g, '#b07a1a', 5);
  rrect(c, -20, 20, 40, 26, 6); fs(c, '#c9c3d9', INK, 5);
  line(c, -16, 30, 16, 30, '#8a84a0', 3);
  c.restore();
}
