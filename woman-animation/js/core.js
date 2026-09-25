'use strict';
// Woman: shared constants, maths, noise and drawing primitives.

const W = 1600, H = 900, TAU = Math.PI * 2, DUR = 34.96;
const RED = '#d8242c', RED_DEEP = '#6e0b0f', RED_HOT = '#ff5436';
const SILVER = '#efebe2', INK = '#060606';
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

const F = {
  disp: (px, w = 900) => `${w} ${px}px "Big Shoulders Display", Oswald, Impact, "Arial Narrow", sans-serif`,
  sten: px => `800 ${px}px "Big Shoulders Stencil Display", "Big Shoulders Display", Impact, sans-serif`,
  fell: (px, it) => `${it ? 'italic ' : ''}400 ${px}px "IM Fell English", Georgia, "Times New Roman", serif`,
  type: px => `400 ${px}px "Special Elite", "Courier New", monospace`
};

// Beat grid measured from the recording (seconds).
const BEATS = [0.39,0.77,1.14,1.51,1.9,2.3,2.69,3.09,3.48,3.85,4.23,4.6,4.99,5.39,5.78,6.15,6.55,6.94,7.34,7.71,8.08,8.48,8.87,9.24,9.64,10.01,10.4,10.77,11.17,11.54,11.94,12.31,12.7,13.05,13.42,13.79,14.21,14.61,15.02,15.37,15.77,16.16,16.53,16.9,17.32,17.69,18.07,18.44,18.83,19.2,19.6,19.97,20.34,20.74,21.13,21.52,21.92,22.31,22.69,23.08,23.45,23.82,24.24,24.64,25.03,25.4,25.8,26.17,26.56,26.96,27.35,27.72,28.1,28.49,28.89,29.26,29.63,30.02,30.42,30.8,31.18,31.56,31.94,32.32];

// Sung word onsets (seconds), from a word-level transcription of the vocal.
const LY = {
  seen:   [['HAVE',6.10],['YOU',6.48],['EVER',6.70],['SEEN',7.02],['A',7.38]],
  woman:  [['WOMAN?',7.62,'r']],
  know:   [['I',9.82],['KNOW',10.34]],
  have:   [['I',10.52],['HAVE!',10.72,'r']],
  ifA:    [['IF',12.40],['YOU',12.68],["HAVEN'T,",12.84]],
  ifB:    [['YOU',13.46],['WERE',13.54],['PROBABLY',13.70]],
  raised: [['RAISED',14.14],['IN',14.92],['A',15.16]],
  wl:     [['WOMAN',17.98],['LIKE',18.84]],
  they:   [['THEY',23.36],['LIKE',23.54]],
  ducks:  [['DUCKS',25.04],['ARE',25.62]],
  notbad: [['BUT',26.44],['THEY',26.68],['ARE',26.92],['NOT',27.14],['BAD.',27.34,'r']],
  nl1:    [['THEY',28.12],['ARE',28.24],['NOT',28.36,'r'],['LIKE',28.70]],
  nl2:    [['WOMEN',29.08],['WHO',29.42],['EAT',29.78]],
  nl3:    [['HOTDOG',29.98,'r']],
  nl4:    [['WATER.',30.70,'r']]
};

// ---------- maths ----------
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, k) => a + (b - a) * k;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (a, b, x) => { const k = inv(a, b, x); return k * k * (3 - 2 * k); };
const eOut = k => 1 - (1 - k) ** 3;
const eIn = k => k * k * k;
const eIO = k => k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
const eBack = k => { const c = 1.7; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const eExpo = k => k >= 1 ? 1 : 1 - 2 ** (-10 * k);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const hash2 = (x, y) => hash(x * 17.13 + y * 311.7);

// Value noise with a shuffled lattice; period 256 in both axes (used for seamless angular noise).
const PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i); let s = 1337;
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  const out = new Uint8Array(512); for (let i = 0; i < 512; i++) out[i] = p[i & 255]; return out;
})();
const LAT = new Float32Array(512); for (let i = 0; i < 512; i++) LAT[i] = PERM[(i * 7 + 13) & 511] / 255;
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const X = xi & 255, Y = yi & 255;
  const a = LAT[PERM[X] + Y], b = LAT[PERM[X + 1] + Y], c = LAT[PERM[X] + Y + 1], d = LAT[PERM[X + 1] + Y + 1];
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); n += a; a *= 0.5; f *= 2.03; } return s / n; }
function ridged(x, y, o = 5) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { const v = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1); s += a * v * v; n += a; a *= 0.5; f *= 2.1; } return s / n; }
const n1 = x => vnoise(x, 7.31);

// ---------- beat helpers ----------
function lastBeat(t) { let lo = 0, hi = BEATS.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (BEATS[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
function pulse(t, k = 9) { const i = lastBeat(t); return i < 0 ? 0 : Math.exp(-(t - BEATS[i]) * k); }
function beatPhase(t) { const i = lastBeat(t); if (i < 0 || i >= BEATS.length - 1) return (t / 0.3725) % 1; return (t - BEATS[i]) / (BEATS[i + 1] - BEATS[i]); }

// ---------- colour ----------
const grey = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
function withA(c, a) {
  if (Array.isArray(c)) return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// ---------- canvases ----------
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const S = mkCanvas(1600, 900);          // the scene is drawn here, then graded by post.js
const ctx = S.getContext('2d');
let KS = 1;                              // device pixels per logical pixel
function setSceneRes(w) { S.width = w; S.height = Math.round(w * 9 / 16); KS = w / W; }
function resetCtx() {
  ctx.setTransform(KS, 0, 0, KS, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'; ctx.setLineDash([]); if (HAS_FILTER) ctx.filter = 'none';
}
const HAS_FILTER = (() => { try { ctx.filter = 'blur(2px)'; const ok = ctx.filter === 'blur(2px)'; ctx.filter = 'none'; return ok; } catch (e) { return false; } })();

// Per-frame parameters for the film grade in post.js; scenes adjust them.
const FX = {
  reset() {
    this.light = null; this.rays = 0; this.rayR = 0.55; this.bloom = 0.5; this.hal = 0.4; this.thr = 0.6;
    this.exposure = 1; this.grain = 0.09; this.vig = 0.6; this.ca = 0.0025; this.fade = 1; this.warm = 0.55;
  }
};
FX.reset();

// ---------- drawing primitives ----------
function glow(x, y, r, col, a, op) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withA(col, a)); g.addColorStop(0.35, withA(col, a * 0.38)); g.addColorStop(1, withA(col, 0));
  ctx.save(); if (op) ctx.globalCompositeOperation = op; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function vgrad(y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function fillAll(style) { ctx.fillStyle = style; ctx.fillRect(-60, -60, W + 120, H + 120); }
function sprite(img, x, y, w, h, a = 1, rot = 0, op) {
  ctx.save(); ctx.globalAlpha = a; if (op) ctx.globalCompositeOperation = op;
  ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
}
// Tapered ribbon along a polyline (hair strands, scarf tails, grass).
function ribbon(c, pts, w0, w1, widthFn) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    let dx = q[0] - o[0], dy = q[1] - o[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const s = i / (n - 1), w = (widthFn ? widthFn(s, i) : lerp(w0, w1, s)) / 2;
    L.push([p[0] - dy * w, p[1] + dx * w]); R.push([p[0] + dy * w, p[1] - dx * w]);
  }
  c.beginPath(); c.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
  c.closePath(); c.fill();
}
function limb(c, pts, widths) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < pts.length - 1; i++) { c.lineWidth = widths[i]; c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[i + 1][0], pts[i + 1][1]); c.stroke(); }
}

// ---------- type ----------
// One word slammed onto the frame: overshoot scale, motion ghosts and a white-hot first frame.
function slamWord(txt, cx, y, font, col, k, o = {}) {
  if (k <= 0) return;
  const kk = clamp(k), e = eBack(kk), s = lerp(o.from ?? 1.5, 1, e);
  ctx.save(); ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.translate(cx, y); ctx.rotate((o.rot || 0) * (1 - e * 0.8));
  if (kk < 1 && !REDUCE) {
    for (let i = 3; i >= 1; i--) { const gs = s + i * 0.07 * (1 - kk); ctx.save(); ctx.scale(gs, gs); ctx.globalAlpha = 0.1 * (1 - kk) * (o.alpha ?? 1); ctx.fillStyle = col; ctx.fillText(txt, 0, 0); ctx.restore(); }
  }
  ctx.scale(s, s); ctx.globalAlpha = clamp(kk * 3) * (o.alpha ?? 1);
  if (o.shadow !== false) { ctx.shadowColor = o.shadowCol || 'rgba(0,0,0,0.7)'; ctx.shadowBlur = (o.blur ?? 28) * KS; ctx.shadowOffsetY = 5 * KS; }
  ctx.fillStyle = kk < 0.14 && o.flash !== false ? '#ffffff' : col;
  ctx.fillText(txt, 0, 0);
  ctx.restore();
}
// A line of words, each slammed on at its sung onset. Returns the laid-out word boxes.
function lyric(words, t, o) {
  const fnt = sz => (o.font || F.disp)(sz, o.weight ?? 900);
  ctx.font = fnt(o.size);
  const ws = words.map(w => ctx.measureText(w[0]).width), gap = o.size * (o.gap ?? 0.24);
  const tot = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  const sc = o.maxW && tot > o.maxW ? o.maxW / tot : 1;
  const al = o.align || 'center';
  let x = al === 'left' ? o.x : al === 'right' ? o.x - tot * sc : o.x - tot * sc / 2;
  const boxes = [];
  words.forEach((w, i) => {
    const cx = x + ws[i] * sc / 2, k = (t - w[1] + 0.02) / (o.dur || 0.16);
    boxes.push({ x: cx, w: ws[i] * sc, on: w[1] });
    const col = (w[2] || '').includes('r') ? (o.red || RED) : (o.col || SILVER);
    if (k > 0 && (w[2] || '').includes('w')) wobbleWord(w[0], cx, o.y, fnt(o.size * sc), col, k, t);
    else if (k > 0) slamWord(w[0], cx, o.y, fnt(o.size * sc), col, k,
      { rot: (hash(w[1] * 9.1) - 0.5) * (o.tilt ?? 0.07), alpha: o.alpha, shadow: o.shadow, blur: o.blur, from: o.from, flash: o.flash });
    x += (ws[i] + gap) * sc;
  });
  return boxes;
}
function cap(txt, x, y, font, col, align = 'center', a = 1, track = 0) {
  ctx.save(); ctx.globalAlpha = a; ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = col;
  if (track && 'letterSpacing' in ctx) ctx.letterSpacing = `${track}px`;
  ctx.fillText(txt, x, y); ctx.restore();
}
// A word whose letters will not sit still (for "weird").
function wobbleWord(txt, cx, y, font, col, k, t) {
  if (k <= 0) return;
  ctx.save(); ctx.font = font; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  const chars = [...txt], ws = chars.map(ch => ctx.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0);
  const sc = lerp(1.5, 1, eBack(clamp(k)));
  ctx.translate(cx, y); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 28 * KS; ctx.shadowOffsetY = 5 * KS; ctx.globalAlpha = clamp(k * 3);
  let x = -tot / 2;
  chars.forEach((ch, i) => {
    const r = Math.sin(t * 9 + i * 1.7) * 0.24, dy = Math.sin(t * 11 + i * 1.3) * 18, sq = 1 + Math.sin(t * 7 + i * 2.3) * 0.14;
    ctx.save(); ctx.translate(x + ws[i] / 2, dy); ctx.rotate(r); ctx.scale(sq, 1 / sq); ctx.fillStyle = col; ctx.fillText(ch, 0, 0); ctx.restore();
    x += ws[i] * 1.04;
  });
  ctx.restore();
}
