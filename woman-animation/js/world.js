'use strict';
// Woman: shared scenery. Skies, the red sun, ridges, fog, smoke, motes, beams, perspective, reflections.

const TINTS = new Map();
function tint(img, col) {
  const key = img.__id || (img.__id = Math.random().toString(36).slice(2)); const k = key + col;
  if (TINTS.has(k)) return TINTS.get(k);
  const c = mkCanvas(img.width, img.height), x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  TINTS.set(k, c); return c;
}
const BUF = { a: mkCanvas(4, 4) };
function buf(name, w, h) { const c = BUF[name] || (BUF[name] = mkCanvas(4, 4)); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c; }

function stars(t, n, yMax, a) {
  ctx.save(); ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    const x = hash(i * 1.31) * W, y = hash(i * 7.77) ** 1.6 * yMax, s = 0.5 + hash(i * 3.3) ** 4 * 1.8;
    ctx.globalAlpha = a * (0.35 + 0.65 * hash(i * 9.1)) * (0.7 + 0.3 * Math.sin(t * (2 + hash(i) * 4) + i));
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}
// The red sun. Registers itself as the light source for god rays.
function redSun(x, y, r, o = {}) {
  glow(x, y, r * 3.2, '#9c1a14', 0.55 * (o.glow ?? 1));
  glow(x, y, r * 1.6, RED_HOT, 0.4 * (o.glow ?? 1));
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  const g = ctx.createRadialGradient(x - r * 0.15, y - r * 0.2, 0, x, y, r);
  g.addColorStop(0, '#ffd2a8'); g.addColorStop(0.35, '#ff6a3a'); g.addColorStop(0.8, '#e0261f'); g.addColorStop(1, '#a8120f');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (o.bands) {
    ctx.globalAlpha = o.bands;
    for (let i = 0; i < 6; i++) { const yy = y - r * 0.1 + i * r * 0.19 + Math.sin(i * 3.1) * r * 0.03; ctx.fillStyle = `rgba(40,4,2,${0.35 + i * 0.07})`; ctx.fillRect(x - r, yy, r * 2, r * (0.018 + i * 0.012)); }
  }
  ctx.restore();
  FX.light = [x, y]; FX.rays = o.rays ?? 0.9; FX.rayR = o.rayR ?? 0.5;
}
// Ridged mountain layer. o.rim lights the crest near the sun.
function ridge(y0, amp, freq, seed, col, o = {}) {
  const pts = [];
  for (let x = -80; x <= W + 80; x += 5) {
    let n = o.soft ? fbm(x * freq + seed, seed, 5) : ridged(x * freq + seed, seed * 0.7, 5);
    if (o.mesa) n = smooth(0.4, 0.55, fbm(x * freq + seed, 3.3, 4)) * 0.8 + fbm(x * freq * 6, seed, 3) * 0.2;
    pts.push([x, y0 - n * amp]);
  }
  ctx.beginPath(); ctx.moveTo(-80, H + 80); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(W + 80, H + 80); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  if (o.rim) {
    const g = ctx.createLinearGradient(o.rim.x - o.rim.w, 0, o.rim.x + o.rim.w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,236,220,${o.rim.a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = o.rim.lw || 1.6; ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1] + 0.8)); ctx.stroke(); ctx.restore();
  }
  return pts;
}
function fog(y, h, a, v = 200) {
  ctx.fillStyle = vgrad(y - h, y + h, [[0, grey(v, 0)], [0.5, grey(v, a)], [1, grey(v, 0)]]);
  ctx.fillRect(-60, y - h, W + 120, h * 2);
}
// Stateless particle smoke: every puff is a function of time, so scrubbing is exact.
function smoke(t, o) {
  const img = o.col ? TEX.smoke.map(s => tint(s, o.col)) : TEX.smoke;
  const j0 = Math.floor((t - o.life) * o.rate), j1 = Math.floor(t * o.rate);
  ctx.save(); if (o.op) ctx.globalCompositeOperation = o.op;
  for (let j = j0; j <= j1; j++) {
    const b = j / o.rate; if (o.t0 !== undefined && b < o.t0) continue;
    const age = t - b; if (age < 0 || age > o.life) continue;
    const k = age / o.life, h1 = hash(j * 1.37 + o.seed), h2 = hash(j * 2.71 + o.seed);
    const x = (typeof o.x === 'function' ? o.x(b) : o.x) + (o.vx + (h1 - 0.5) * o.spread) * age + (vnoise(j * 0.37, t * 0.7) - 0.5) * o.turb * k;
    const y = (typeof o.y === 'function' ? o.y(b) : o.y) + (o.vy + (h2 - 0.5) * o.spread * 0.4) * age + (o.grav || 0) * age * age;
    const s = lerp(o.s0, o.s1, Math.sqrt(k)), a = o.alpha * smooth(0, 0.12, k) * (1 - smooth(0.45, 1, k));
    ctx.globalAlpha = a; ctx.save(); ctx.translate(x, y); ctx.rotate(h1 * TAU + age * (h2 - 0.5) * 0.8);
    ctx.drawImage(img[j & 3], -s / 2, -s / 2, s, s); ctx.restore();
  }
  ctx.restore();
}
// Floating dust caught in the light.
function motes(t, n, x0, y0, w, h, a, seed = 1) {
  ctx.save(); ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    const hx = hash(i * 3.1 + seed), hy = hash(i * 5.3 + seed), sp = 0.2 + hash(i * 7.9 + seed) * 0.6;
    const x = x0 + ((hx * w + t * 18 * sp + Math.sin(t * sp + i) * 20) % w + w) % w, y = y0 + ((hy * h - t * 9 * sp + Math.cos(t * 0.7 * sp + i) * 14) % h + h) % h;
    const s = 0.8 + hash(i * 1.7 + seed) ** 3 * 3;
    ctx.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(t * 2 * sp + i)));
    ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
// A volumetric light cone with soft edges and drifting haze inside it.
function beam(x0, y0, ang, spread, len, a, t, o = {}) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  [[1, 0.3], [0.72, 0.3], [0.45, 0.45]].forEach(([k, al]) => {
    ctx.save(); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.arc(x0, y0, len, ang - spread * k, ang + spread * k); ctx.closePath(); ctx.clip();
    const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, len);
    g.addColorStop(0, grey(255, a * al)); g.addColorStop(0.25, grey(235, a * al * 0.7)); g.addColorStop(1, grey(200, 0));
    ctx.fillStyle = g; ctx.fillRect(x0 - len, y0 - len, len * 2, len * 2); ctx.restore();
  });
  if (o.haze) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.arc(x0, y0, len, ang - spread, ang + spread); ctx.closePath(); ctx.clip();
    for (let i = 0; i < o.haze; i++) {
      const d = (0.15 + hash(i * 3.7) * 0.85) * len, off = (hash(i * 5.9) - 0.5) * 2 * spread * 0.8, aa = ang + off;
      const x = x0 + Math.cos(aa) * d + Math.sin(t * 0.3 + i) * 30, y = y0 + Math.sin(aa) * d + Math.cos(t * 0.25 + i) * 20, s = 160 + hash(i) * 260 * (d / len);
      sprite(TEX.smoke[i & 3], x, y, s, s, a * 0.22 * (1 - d / len * 0.6), t * 0.05 * (hash(i * 2) - 0.5) + i);
    }
  }
  ctx.restore();
}

// ---------- ground-plane perspective (metres) ----------
const P3 = { hz: 560, vx: 800, F: 700, camH: 1.3 };
const pY = (z, yw = 0) => P3.hz + (P3.camH - yw) * P3.F / z;
const pX = (x, z) => P3.vx + x * P3.F / z;
const pS = z => P3.F / z;
// Telephone poles along one side of the road/track, with sagging wires between them.
function poles(camZ, X, spacing, zMax, col) {
  const list = [];
  for (let k = Math.ceil((camZ + 2) / spacing); k * spacing - camZ < zMax; k++) list.push(k * spacing - camZ);
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
  for (let i = list.length - 1; i >= 0; i--) {
    const z = list[i], s = pS(z), x = pX(X, z), y0 = pY(z), y1 = pY(z, 9), ya = pY(z, 8.3);
    ctx.lineWidth = Math.max(0.8, 0.28 * s); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.lineWidth = Math.max(0.6, 0.16 * s); ctx.beginPath(); ctx.moveTo(x - 1.2 * s, ya); ctx.lineTo(x + 1.2 * s, ya); ctx.stroke();
    [-1.05, -0.4, 0.4, 1.05].forEach(o => ctx.fillRect(x + o * s - 0.06 * s, ya - 0.3 * s, 0.12 * s, 0.3 * s));
    if (i > 0) {
      const z2 = list[i - 1], s2 = pS(z2), x2 = pX(X, z2), ya2 = pY(z2, 8.3);
      ctx.lineWidth = Math.max(0.5, 0.025 * s2);
      [-1.05, -0.4, 0.4, 1.05].forEach(o => { ctx.beginPath(); ctx.moveTo(x + o * s, ya - 0.3 * s); ctx.quadraticCurveTo((x + o * s + x2 + o * s2) / 2, (ya + ya2) / 2 + 0.9 * (s + s2) / 2, x2 + o * s2, ya2 - 0.3 * s2); ctx.stroke(); });
    }
  }
  ctx.restore();
  return list;
}
function saguaro(x, yb, h, seed, col) {
  const w = h * 0.13;
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x, yb - h + w / 2); ctx.stroke();
  const arms = 1 + Math.floor(hash(seed) * 3);
  for (let i = 0; i < arms; i++) {
    const side = i % 2 ? 1 : -1, hy = h * (0.35 + hash(seed + i * 3) * 0.25), dx = h * (0.16 + hash(seed + i) * 0.1), ah = h * (0.18 + hash(seed + i * 7) * 0.25);
    ctx.lineWidth = w * 0.72; ctx.beginPath(); ctx.moveTo(x, yb - hy); ctx.quadraticCurveTo(x + side * dx, yb - hy, x + side * dx, yb - hy - dx * 0.6); ctx.lineTo(x + side * dx, yb - hy - ah); ctx.stroke();
  }
  ctx.restore();
}
// Heat shimmer: horizontal rows of the frame nudged sideways.
function shimmer(y0, y1, amp, t) {
  const a = Math.round(y0 * KS), h = Math.round((y1 - y0) * KS); if (h < 2) return;
  const b = buf('shim', S.width, h), bx = b.getContext('2d'); bx.clearRect(0, 0, b.width, h); bx.drawImage(S, 0, a, S.width, h, 0, 0, S.width, h);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let y = 0; y < h; y += 2) { const k = 1 - Math.abs(y / h - 0.5) * 2; ctx.drawImage(b, 0, y, S.width, 2, Math.sin(y * 0.4 / KS + t * 16) * amp * KS * k, a + y, S.width, 2); }
  ctx.restore();
}
// Mirror everything above the horizon into the water below, with ripples and depth darkening.
function reflect(hz, y1, t, o = {}) {
  const hp = Math.round(hz * KS), n = Math.min(hp, Math.round((y1 - hz) * KS));
  const b = buf('refl', S.width, n), bx = b.getContext('2d'); bx.clearRect(0, 0, S.width, n); bx.drawImage(S, 0, hp - n, S.width, n, 0, 0, S.width, n);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let y = 0; y < n; y += 2) {
    const d = y / n, off = (Math.sin(y / KS * 0.21 + t * 2.6 + Math.sin(y / KS * 0.05 + t) * 2) * (0.5 + d * 9)) * KS * (o.amp ?? 1);
    ctx.drawImage(b, 0, n - 1 - y - 1, S.width, 2, off, hp + y, S.width, 2);
  }
  ctx.restore();
  ctx.fillStyle = vgrad(hz, y1, [[0, `rgba(0,0,0,${o.d0 ?? 0.15})`], [1, `rgba(0,0,0,${o.d1 ?? 0.7})`]]); ctx.fillRect(-60, hz, W + 120, y1 - hz);
}
function tumbleweed(x, y, r, rot, rimA) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  const pts = [];
  for (let i = 0; i < 70; i++) { const u = hash(i * 3.1) * 2 - 1, th = hash(i * 7.3) * TAU, q = Math.sqrt(1 - u * u); const px = q * Math.cos(th), py = u, pz = q * Math.sin(th); const c = Math.cos(rot), s = Math.sin(rot); pts.push([(px * c - py * s) * r * (0.75 + hash(i) * 0.25), (px * s + py * c) * r * (0.75 + hash(i) * 0.25), pz]); }
  for (const [col, off, lw] of [['#0a0a0a', 0, 2.2], [grey(230, rimA), -1.2, 1]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i * 7 + 3) % pts.length]; ctx.moveTo(p[0] + off, p[1] + off); ctx.quadraticCurveTo((p[0] + q[0]) / 2 + p[2] * 8, (p[1] + q[1]) / 2 - p[2] * 8, q[0] + off, q[1] + off); }
    ctx.stroke();
  }
  ctx.restore();
}
