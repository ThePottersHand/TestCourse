/* Drawing kit: math, beat sync, shapes, text, particles.
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
  blush: 'rgba(255,110,150,0.42)',
  skin: '#ffe3d1',
  skinShade: '#f7c7b0',
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
/* 0 -> 1 pop with overshoot, starting at t0 */
const pop = (t, t0, d = 0.4) => (t < t0 ? 0 : easeOutBack(seg(t, t0, t0 + d)));
/* fade in then out window */
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
/* time of beat index i (extrapolated outside the tracked range) */
function beatTime(i) {
  const n = BEATS.length;
  if (i < 0) return BEATS[0] + i * (BEATS[1] - BEATS[0]);
  if (i >= n) return BEATS[n - 1] + (i - n + 1) * (BEATS[n - 1] - BEATS[n - 2]);
  return BEATS[i];
}
/* hop: 0 on the beat, -amp mid-beat. every = beats per hop */
function hop(t, amp = 20, every = 1, offset = 0) {
  const b = beatInfo(t);
  const k = (b.i + b.f + offset) / every;
  return -Math.abs(Math.sin(Math.PI * k)) * amp;
}
/* squash factor: squashes right after each landing */
function squash(t, amt = 0.1, every = 1, offset = 0) {
  const b = beatInfo(t);
  const k = (b.i + b.f + offset) / every;
  const f = k - Math.floor(k);
  return 1 - amt * Math.pow(1 - f, 5) + amt * 0.4 * Math.sin(Math.PI * f);
}
/* side-to-side sway locked to bars */
function sway(t, amp = 1, every = 2, offset = 0) {
  const b = beatInfo(t);
  return Math.sin(((b.i + b.f + offset) / every) * Math.PI) * amp;
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
function fs(c, fill, stroke = INK, lw = 5) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke && lw > 0) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
}
function line(c, x1, y1, x2, y2, color = INK, lw = 5) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.stroke();
}
function starPath(c, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
  c.beginPath();
  for (let k = 0; k < n * 2; k++) {
    const r = k % 2 ? r2 : r1, a = rot + (k * Math.PI) / n;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}
/* rounded star (softer, cuter) */
function softStar(c, x, y, r, n = 5, rot = -Math.PI / 2, inner = 0.5) {
  c.beginPath();
  const pts = [];
  for (let k = 0; k < n * 2; k++) {
    const rr = k % 2 ? r * inner : r, a = rot + (k * Math.PI) / n;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let s = m(pts[pts.length - 1], pts[0]);
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
/* 4-point anime sparkle */
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
/* puffy cloud / thought bubble outline */
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
/* speech bubble: rounded box + tail pointing at (tx, ty). spiky = shouting */
function bubble(c, x, y, w, h, tx, ty, o = {}) {
  const fill = o.fill || '#fff', lw = o.lw ?? 6;
  c.save();
  if (o.spiky) {
    const n = 18;
    c.beginPath();
    for (let k = 0; k < n * 2; k++) {
      const a = (k / (n * 2)) * TAU;
      const r = k % 2 ? 0.86 : 1.08 + (rnd(k, 7) * 0.08);
      c.lineTo(x + Math.cos(a) * w / 2 * r * 1.1, y + Math.sin(a) * h / 2 * r * 1.15);
    }
    c.closePath();
    fs(c, fill, INK, lw);
  } else {
    rrect(c, x - w / 2, y - h / 2, w, h, Math.min(h / 2, 46));
    fs(c, fill, INK, lw);
  }
  // tail
  const ang = Math.atan2(ty - y, tx - x);
  const bx = x + Math.cos(ang) * w * 0.28, by = y + Math.sin(ang) * h * 0.36;
  const px = -Math.sin(ang) * 22, py = Math.cos(ang) * 22;
  c.beginPath();
  c.moveTo(bx + px, by + py);
  c.quadraticCurveTo((bx + tx) / 2 + px * 0.2, (by + ty) / 2 + py * 0.2, tx, ty);
  c.quadraticCurveTo((bx + tx) / 2 - px * 0.6, (by + ty) / 2 - py * 0.6, bx - px, by - py);
  fs(c, fill, INK, lw);
  // cover tail seam
  c.beginPath();
  c.moveTo(bx + px * 0.8, by + py * 0.8);
  c.lineTo(bx - px * 0.8, by - py * 0.8);
  c.lineTo(bx - Math.cos(ang) * 30, by - Math.sin(ang) * 30);
  c.closePath();
  c.fillStyle = fill; c.fill();
  c.restore();
}
function glow(c, x, y, r, color, a = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalAlpha *= a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}

/* ---------- text ---------- */
function txt(c, s, x, y, o = {}) {
  const size = o.size || 48;
  c.save();
  c.font = `${o.weight || 600} ${size}px ${o.font || ROUND}`;
  c.textAlign = o.align || 'center';
  c.textBaseline = o.baseline || 'middle';
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); x = 0; y = 0; }
  if (o.stroke !== false) {
    c.lineJoin = 'round';
    c.lineWidth = o.lw || size * 0.2;
    c.strokeStyle = o.stroke || INK;
    c.strokeText(s, x, y);
  }
  c.fillStyle = o.fill || '#fff';
  c.fillText(s, x, y);
  c.restore();
}
/* bouncy title: letters pop in one by one and bob on the beat */
function bouncyText(c, s, x, y, t, t0, o = {}) {
  const size = o.size || 110, gap = o.gap ?? 0.06;
  c.save();
  c.font = `${o.weight || 400} ${size}px ${o.font || DISPLAY}`;
  const total = c.measureText(s).width + (s.length - 1) * (o.track || 0);
  let cx = x - total / 2;
  const colors = o.colors || ['#fff'];
  for (let k = 0; k < s.length; k++) {
    const ch = s[k], w = c.measureText(ch).width;
    const p = pop(t, t0 + k * gap, 0.45);
    if (p > 0 && ch !== ' ') {
      const bob = o.bob === false ? 0 : Math.sin(t * 5 + k * 0.7) * size * 0.05 + hop(t, size * 0.08, 1, k * 0.12);
      c.save();
      c.translate(cx + w / 2, y + bob);
      c.rotate(Math.sin(t * 3 + k) * 0.06);
      c.scale(p, p);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineJoin = 'round';
      c.lineWidth = size * 0.26; c.strokeStyle = o.stroke || INK; c.strokeText(ch, 0, 0);
      c.fillStyle = colors[k % colors.length]; c.fillText(ch, 0, 0);
      c.restore();
    }
    cx += w + (o.track || 0);
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
/* radial anime burst behind a subject */
function burst(c, x, y, t, colA, colB, n = 20, r = 2400, spin = 0.25) {
  c.save();
  c.translate(x, y);
  c.rotate(t * spin);
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU;
    c.beginPath(); c.moveTo(0, 0);
    c.arc(0, 0, r, a0, a1);
    c.closePath();
    c.fillStyle = k % 2 ? colA : colB; c.fill();
  }
  c.restore();
}
/* manga speed lines converging on (x, y) */
function speedLines(c, x, y, t, color = 'rgba(255,255,255,0.8)', n = 60, inner = 380) {
  c.save();
  c.fillStyle = color;
  for (let k = 0; k < n; k++) {
    const a = rnd(k, Math.floor(t * 12)) * TAU;
    const r0 = inner + rnd(k, 5 + Math.floor(t * 12)) * 260;
    const wdt = 0.008 + rnd(k, 11) * 0.014;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    c.lineTo(x + Math.cos(a - wdt) * 2400, y + Math.sin(a - wdt) * 2400);
    c.lineTo(x + Math.cos(a + wdt) * 2400, y + Math.sin(a + wdt) * 2400);
    c.closePath(); c.fill();
  }
  c.restore();
}
function vignette(c, a = 0.45) {
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(10,5,30,0)');
  g.addColorStop(1, `rgba(10,5,30,${a})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
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
    c.fillStyle = o.fill || 'rgba(200,240,255,0.18)'; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = o.stroke || 'rgba(220,250,255,0.75)'; c.stroke();
    circle(c, x - r * 0.35, y - r * 0.35, r * 0.25);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fill();
  }
  c.restore();
}
function twinkles(c, t, n, x0, y0, w, h, salt = 1, size = 1) {
  for (let k = 0; k < n; k++) {
    const x = x0 + rnd(k, salt) * w, y = y0 + rnd(k, salt + 1) * h;
    const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + rnd(k, salt + 2) * 3) + k);
    const s = (2 + rnd(k, salt + 3) * 5) * size;
    if (rnd(k, salt + 4) < 0.22) sparkle(c, x, y, s * (1.2 + tw * 1.4), `rgba(255,250,220,${0.5 + tw * 0.5})`);
    else { circle(c, x, y, s * 0.45 * (0.6 + tw * 0.6)); c.fillStyle = `rgba(255,255,240,${0.35 + tw * 0.6})`; c.fill(); }
  }
}
/* confetti burst from (x,y) starting at t0 */
function confetti(c, t, t0, x, y, n = 60, spread = 900, colors = ['#ff8fc7', '#ffd166', '#8fe3b0', '#6fb7ff', '#b59cff']) {
  const dt = t - t0;
  if (dt < 0 || dt > 4) return;
  c.save();
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (rnd(k, 31) - 0.5) * 2.4;
    const v = spread * (0.5 + rnd(k, 32) * 0.7);
    const px = x + Math.cos(a) * v * dt;
    const py = y + Math.sin(a) * v * dt + 700 * dt * dt;
    c.save();
    c.translate(px, py);
    c.rotate(dt * (4 + rnd(k, 33) * 8));
    c.scale(1, Math.cos(dt * 9 + k));
    c.globalAlpha = 1 - seg(dt, 2.6, 4);
    c.fillStyle = colors[k % colors.length];
    if (k % 3 === 0) { heartPath(c, 0, 0, 12); c.fill(); } else c.fillRect(-9, -5, 18, 10);
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
    c.save();
    c.globalAlpha = Math.sin(ph * Math.PI);
    heartPath(c, x, y, (14 + rnd(k, salt + 3) * 14) * size);
    fs(c, k % 2 ? '#ff8fc7' : '#ff6f9f', INK, 3);
    c.restore();
  }
}
/* rising Zzz letters */
function zzz(c, x, y, t, s = 1, color = '#e9f7ff') {
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.45 + k / 3) % 1;
    c.save();
    c.globalAlpha = Math.sin(ph * Math.PI);
    txt(c, 'Z', x + ph * 70 * s + Math.sin(ph * 6) * 10, y - ph * 150 * s, {
      size: (26 + ph * 34) * s, font: DISPLAY, weight: 400, fill: color, lw: 7 * s, rot: -0.2 + ph * 0.3,
    });
    c.restore();
  }
}
/* musical notes floating */
function notesFx(c, t, n, x0, y0, w, h, salt = 9, color = '#fff') {
  for (let k = 0; k < n; k++) {
    const life = 2.5 + rnd(k, salt) * 2;
    const ph = ((t + rnd(k, salt + 1) * life) % life) / life;
    const x = x0 + rnd(k, salt + 2) * w + Math.sin(t * 3 + k) * 20;
    const y = y0 + h - ph * h;
    c.save();
    c.globalAlpha = Math.sin(ph * Math.PI);
    txt(c, k % 2 ? '♪' : '♫', x, y, { size: 44 + rnd(k, salt + 3) * 30, fill: color, lw: 7, weight: 700, font: 'sans-serif' });
    c.restore();
  }
}

/* ---------- emotes ---------- */
function sweatDrop(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath();
  c.moveTo(0, -26);
  c.quadraticCurveTo(18, 0, 14, 10);
  c.arc(0, 10, 14, 0, Math.PI);
  c.quadraticCurveTo(-18, 0, 0, -26);
  fs(c, '#9fe0ff', INK, 4);
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
  txt(c, '?', x, y, { size: 90 * s, font: DISPLAY, weight: 400, fill: color, lw: 16 * s, rot });
}
function gloomLines(c, x, y, w, s = 1) {
  c.save();
  for (let k = 0; k < 5; k++) {
    line(c, x - w / 2 + (k * w) / 4, y, x - w / 2 + (k * w) / 4, y + (26 + (k % 2) * 14) * s, 'rgba(90,70,200,0.75)', 4 * s);
  }
  c.restore();
}
function lightbulb(c, x, y, s = 1, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  glow(c, 0, -10, 110, 'rgba(255,230,120,0.7)');
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + t;
    line(c, Math.cos(a) * 62, -10 + Math.sin(a) * 62, Math.cos(a) * 84, -10 + Math.sin(a) * 84, '#ffd166', 7);
  }
  circle(c, 0, -14, 40); fs(c, '#fff3a8', INK, 5);
  rrect(c, -20, 20, 40, 26, 6); fs(c, '#c9c3d9', INK, 5);
  line(c, -16, 30, 16, 30, INK, 3);
  c.restore();
}
