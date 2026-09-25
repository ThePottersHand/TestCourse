'use strict';
// Woman: procedural textures, generated once at load (clouds, smoke, granite, wood, paper, iris, skin).

const TEX = {};

function imgData(w, h, fn) {
  const c = mkCanvas(w, h), x = c.getContext('2d'), id = x.createImageData(w, h), d = id.data;
  let i = 0;
  for (let y = 0; y < h; y++) for (let X = 0; X < w; X++, i += 4) fn(X, y, d, i);
  x.putImageData(id, 0, 0); return c;
}
const setG = (d, i, v, a = 255) => { d[i] = d[i + 1] = d[i + 2] = v < 0 ? 0 : v > 255 ? 255 : v; d[i + 3] = a < 0 ? 0 : a > 255 ? 255 : a; };

function softSprite() {
  const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c;
}

function smokePuff(v) {
  return imgData(192, 192, (x, y, d, i) => {
    const u = (x - 96) / 96, w = (y - 96) / 96, r = Math.hypot(u, w);
    const fall = clamp(1 - r); const n = fbm(x * 0.028 + v * 17.3, y * 0.028 + v * 9.1, 5);
    const a = clamp((n - 0.36) * 2.6) * fall * fall * (0.6 + 0.4 * fall);
    setG(d, i, 255, a * 255);
  });
}

// Backlit cloud band: dense interiors stay dark, thin edges catch the light.
function cloudBand(w, h, seed, o) {
  return imgData(w, h, (x, y, d, i) => {
    const v = y / h, env = smooth(0, 0.4, v) * (1 - smooth(0.62, 1, v));
    const nx = x * o.f / (o.sx || 1) + seed, ny = y * o.f;
    const den = fbm(nx, ny, 6), m = den * (0.55 + 0.45 * env) - (1 - env) * 0.25;
    const a = clamp((m - o.cover) * o.sharp);
    if (a <= 0.003) { setG(d, i, 0, 0); return; }
    const toward = fbm(nx + o.lx, ny + o.ly, 4);
    const edge = clamp(0.5 + (den - toward) * o.edge), thin = 1 - clamp((m - o.cover) * o.sharp * 0.45);
    setG(d, i, o.dark + (o.light - o.dark) * clamp(thin * 0.75 + edge * 0.55 - 0.2), a * 255 * o.alpha);
  });
}

function moonTex() {
  const R = 124, craters = Array.from({ length: 26 }, (_, k) => [hash(k * 3.1) * 2 - 1, hash(k * 5.7) * 2 - 1, 0.03 + hash(k * 9.3) ** 2 * 0.16]);
  return imgData(256, 256, (x, y, d, i) => {
    const u = (x - 128) / R, v = (y - 128) / R, r2 = u * u + v * v;
    if (r2 > 1) { setG(d, i, 0, 0); return; }
    const z = Math.sqrt(1 - r2), limb = 0.55 + 0.45 * z ** 0.5;
    let val = 205 - clamp((fbm(u * 2.2 + 3, v * 2.2 + 1, 5) - 0.45) * 3) * 70 + (vnoise(x * 0.5, y * 0.5) - 0.5) * 18;
    for (const [cx, cy, cr] of craters) { const dd = Math.hypot(u - cx, v - cy) / cr; if (dd < 1.15) val += dd < 0.85 ? -22 : 26 * (1 - Math.abs(dd - 1) * 6); }
    setG(d, i, val * limb, 255 * clamp((1 - Math.sqrt(r2)) * 60));
  });
}

// Folsom-style dressed granite blocks, lit from above by the moon.
function graniteTex() {
  const w = 1024, h = 576, rowH = 72, rows = [];
  for (let r = 0; r < h / rowH; r++) { const cuts = [0]; let x = -hash(r * 7) * 120; while (x < w) { x += 130 + hash(r * 13 + x) * 120; cuts.push(Math.min(w, x)); } rows.push(cuts); }
  return imgData(w, h, (x, y, d, i) => {
    const r = Math.floor(y / rowH), yy = y - r * rowH, cuts = rows[r];
    let k = 0; while (k < cuts.length - 1 && cuts[k + 1] <= x) k++;
    const x0 = cuts[k], x1 = cuts[k + 1] ?? w, dx = Math.min(x - x0, x1 - x), dy = Math.min(yy, rowH - yy);
    const edge = Math.min(dx, dy), blockSeed = hash(r * 31 + k * 7);
    let v = 92 + blockSeed * 26 + (fbm(x * 0.02 + blockSeed * 40, y * 0.02, 4) - 0.5) * 50 + (vnoise(x * 0.9, y * 0.9) - 0.5) * 38 + (hash2(x, y) - 0.5) * 22;
    if (hash2(x * 0.5 | 0, y * 0.5 | 0) > 0.985) v += 50;               // mica sparkle
    if (edge < 4) v = 38 + edge * 6;                                   // mortar joint
    else if (yy < 9) v += (9 - yy) * 5;                                // top bevel catches the light
    else if (rowH - yy < 8) v -= (8 - (rowH - yy)) * 6;                 // underside in shadow
    v *= 1 - clamp((fbm(x * 0.05, y * 0.004, 3) - 0.52) * 3) * 0.45;    // water streaks
    setG(d, i, v);
  });
}

// Weathered barn boards: silver-grey, open grain, knots and nail holes.
function woodTex() {
  const w = 800, h = 900, cuts = [0]; let x = 0; while (x < w) { x += 104 + hash(x) * 44; cuts.push(Math.min(w, x)); }
  const knots = Array.from({ length: 7 }, (_, k) => [hash(k * 3.3) * w, hash(k * 7.7) * h, 10 + hash(k) * 16]);
  return imgData(w, h, (X, y, d, i) => {
    let k = 0; while (k < cuts.length - 1 && cuts[k + 1] <= X) k++;
    const x0 = cuts[k], x1 = cuts[k + 1] ?? w, ps = hash(k * 19.1), local = X - x0;
    let gx = local + (fbm(X * 0.01, y * 0.0025 + ps * 30, 3) - 0.5) * 40;
    for (const [kx, ky, kr] of knots) { const dd = Math.hypot((X - kx) * 1.6, y - ky); if (dd < kr * 5) gx += (kr * 5 - dd) * 0.35 * Math.sign(X - kx || 1); }
    const grain = Math.sin(gx * 0.55 + ps * 20) * 0.5 + 0.5, fine = vnoise(X * 0.6, y * 0.02);
    let v = 118 + ps * 40 - grain ** 6 * 45 - (fine - 0.5) * 30 + (fbm(X * 0.01, y * 0.01, 3) - 0.5) * 40 + (hash2(X, y) - 0.5) * 14;
    for (const [kx, ky, kr] of knots) { const dd = Math.hypot((X - kx) * 1.6, y - ky); if (dd < kr) v -= (1 - dd / kr) * 70 + Math.sin(dd * 1.4) * 10; }
    const edge = Math.min(local, x1 - X);
    if (edge < 3) v = 18 + edge * 10; else if (edge < 8) v -= (8 - edge) * 5;
    if ((y % 300 > 140 && y % 300 < 146) && (local > 14 && local < 20)) v = 20;       // nail holes
    v -= clamp((fbm(X * 0.03 + 50, y * 0.003, 3) - 0.55) * 4) * 45;                       // rust run-off
    setG(d, i, v);
  });
}

function paperTex() {
  return imgData(560, 760, (x, y, d, i) => {
    const u = x / 560, v = y / 760, e = Math.min(u, 1 - u, v, 1 - v);
    let val = 226 - (fbm(x * 0.008, y * 0.008, 4) - 0.5) * 40 - (vnoise(x * 0.35, y * 0.06) - 0.5) * 16 + (hash2(x, y) - 0.5) * 12;
    const stain = fbm(x * 0.006 + 9, y * 0.006 + 3, 5); if (stain > 0.58) val -= (stain - 0.58) * 180 + (Math.abs(stain - 0.6) < 0.006 ? 30 : 0);
    val -= clamp(1 - e * 9) * 60;
    setG(d, i, val);
  });
}

// Iris stroma: angular noise uses a period of 256 lattice cells over one turn so it wraps seamlessly.
function irisTex() {
  const A = 256 / TAU;
  return imgData(512, 512, (x, y, d, i) => {
    const u = (x - 256) / 250, v = (y - 256) / 250, r = Math.hypot(u, v);
    if (r > 1.02) { setG(d, i, 0, 0); return; }
    const a = Math.atan2(v, u) + Math.PI;
    const fib = vnoise(a * A * 0.5, r * 3) * 0.5 + vnoise(a * A, r * 5 + 9) * 0.3 + vnoise(a * A * 2, r * 9 + 3) * 0.2;
    const coll = 0.43 + 0.035 * (vnoise(a * A * 0.25, 4.2) - 0.5) * 2;
    let val = 70 + fib * 120;
    val += Math.exp(-(((r - coll) / 0.025) ** 2)) * 55;                                            // collarette ridge
    const crypt = vnoise(a * A * 0.5 + 7, r * 7); if (r > 0.3 && r < 0.8 && crypt > 0.72) val -= (crypt - 0.72) * 380;
    val -= (Math.exp(-(((r - 0.66) / 0.012) ** 2)) + Math.exp(-(((r - 0.78) / 0.01) ** 2))) * 45;      // contraction furrows
    val *= 1 - smooth(0.8, 1, r) * 0.78;                                                           // limbal ring
    val *= 0.55 + 0.45 * smooth(0.22, 0.34, r);
    setG(d, i, val, 255 * clamp((1.02 - r) * 40));
  });
}

function skinTex() {
  return imgData(800, 450, (x, y, d, i) => {
    let v = 150 + (fbm(x * 0.01, y * 0.01, 4) - 0.5) * 36 + (fbm(x * 0.06 + 5, y * 0.06, 3) - 0.5) * 16;
    const pore = vnoise(x * 0.55, y * 0.55); if (pore > 0.78) v -= (pore - 0.78) * 120;
    v += (hash2(x, y) - 0.5) * 8;
    setG(d, i, v);
  });
}

TEX.init = async function (onStep) {
  const steps = [
    () => { TEX.soft = softSprite(); TEX.smoke = [0, 1, 2, 3].map(smokePuff); },
    () => { TEX.cloud = cloudBand(1280, 360, 11.3, { f: 0.0065, sx: 1.6, cover: 0.46, sharp: 5, lx: 0, ly: 0.06, edge: 7, dark: 26, light: 215, alpha: 1 }); },
    () => { TEX.streak = cloudBand(1280, 180, 71.9, { f: 0.009, sx: 5, cover: 0.5, sharp: 4, lx: 0, ly: 0.05, edge: 5, dark: 40, light: 200, alpha: 0.9 }); },
    () => { TEX.moon = moonTex(); TEX.iris = irisTex(); },
    () => { TEX.granite = graniteTex(); },
    () => { TEX.wood = woodTex(); },
    () => { TEX.paper = paperTex(); TEX.skin = skinTex(); }
  ];
  for (let k = 0; k < steps.length; k++) { steps[k](); onStep && onStep((k + 1) / steps.length); await new Promise(r => setTimeout(r, 0)); }
};
