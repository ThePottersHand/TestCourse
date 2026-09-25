// Core drawing helpers: SVG element builder, seeded noise, hand-cut edges,
// gouache texture filters. Everything is deterministic (seeded) so a frame
// renders identically every time.

export const NS = 'http://www.w3.org/2000/svg';
export const XLINK = 'http://www.w3.org/1999/xlink';

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'href') e.setAttribute('href', v);
    else e.setAttribute(k, v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.appendChild(k);
  return e;
}
export const g = (attrs, ...kids) => el('g', attrs, ...kids);

// ---------------------------------------------------------------- randomness
export function rng(seed) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// smooth 1D value noise in [-1,1]
export function noise1(seed) {
  const r = rng(seed), tab = Array.from({ length: 256 }, () => r() * 2 - 1);
  return x => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    const a = tab[((i % 256) + 256) % 256], b = tab[(((i + 1) % 256) + 256) % 256];
    return a + (b - a) * u;
  };
}

// ---------------------------------------------------------------- math/ease
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = t => Math.pow(clamp(t), 3);
export const easeInOut = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
// progress of t through [a,b]
export const prog = (t, a, b) => clamp((t - a) / (b - a));
// quantise time to "twos" (12 fps drawings at 24 fps)
export const twos = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;

// ---------------------------------------------------------------- rough edges
let _measure = null;
function measurePath() {
  if (!_measure) {
    const s = el('svg', { width: 0, height: 0, style: 'position:absolute;left:-9999px' });
    _measure = el('path');
    s.appendChild(_measure);
    document.body.appendChild(s);
  }
  return _measure;
}

// Hand-cut edge: resample each subpath and push points along the normal with
// two octaves of smooth noise. Author paths with absolute commands only.
export function rough(d, { amp = 1.4, wl = 26, grit = 0.45, step = 2.2, seed = 1, tufts = 0, tuftLen = 7 } = {}) {
  const subs = d.match(/M[^M]*/g) || [];
  const mp = measurePath();
  let out = '';
  subs.forEach((sd, si) => {
    mp.setAttribute('d', sd);
    const L = mp.getTotalLength();
    if (!L) return;
    const closed = /[zZ]\s*$/.test(sd.trim());
    const n = Math.max(10, Math.round(L / step));
    const pts = [];
    const last = closed ? n : n + 1;
    for (let i = 0; i < last; i++) { const p = mp.getPointAtLength(Math.min(L, i * L / n)); pts.push([p.x, p.y]); }
    const nA = noise1(seed * 131 + si * 17), nB = noise1(seed * 977 + si * 29 + 5);
    const m = pts.length;
    let area = 0;
    for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % m]; area += a[0] * b[1] - b[0] * a[1]; }
    const out_ = area > 0 ? -1 : 1; // sign that pushes along the outward normal
    const res = pts.map((p, i) => {
      const a = pts[closed ? (i - 1 + m) % m : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % m : Math.min(m - 1, i + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      const s = i * L / n;
      // taper the displacement at open ends so strokes stay attached
      const taper = closed ? 1 : Math.min(1, s / 6, (L - s) / 6);
      let o = taper * (amp * nA(s / wl) + grit * nB(s / 3.1));
      if (tufts) { const ph = (s / tuftLen) % 1; o += out_ * taper * tufts * (0.55 + 0.45 * nB(s / 9 + 3)) * Math.pow(Math.sin(Math.PI * ph), 3); }
      return [p[0] - ty / tl * o, p[1] + tx / tl * o];
    });
    out += 'M' + res.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + (closed ? 'Z' : '');
  });
  return out;
}

// a painted shape: rough-edged path
export function shape(d, fill, opts = {}) {
  const { r = {}, line, lw = 1.6, lo = 0.55, smoothEdge, ...attrs } = opts;
  const extra = line ? { stroke: line, 'stroke-width': lw, 'stroke-opacity': lo, 'stroke-linejoin': 'round' } : {};
  return el('path', { d: smoothEdge ? d : rough(d, r), fill, ...extra, ...attrs });
}

// ellipse as path (so it can be roughened)
export function ellipseD(cx, cy, rx, ry, rot = 0) {
  const k = 0.5523;
  const c = Math.cos(rot * Math.PI / 180), s = Math.sin(rot * Math.PI / 180);
  const P = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
  const p = [P(rx, 0), P(rx, ry * k), P(rx * k, ry), P(0, ry), P(-rx * k, ry), P(-rx, ry * k), P(-rx, 0),
    P(-rx, -ry * k), P(-rx * k, -ry), P(0, -ry), P(rx * k, -ry), P(rx, -ry * k), P(rx, 0)];
  const f = q => q[0].toFixed(2) + ' ' + q[1].toFixed(2);
  return `M${f(p[0])}C${f(p[1])} ${f(p[2])} ${f(p[3])}C${f(p[4])} ${f(p[5])} ${f(p[6])}C${f(p[7])} ${f(p[8])} ${f(p[9])}C${f(p[10])} ${f(p[11])} ${f(p[12])}Z`;
}
export const circleD = (cx, cy, r) => ellipseD(cx, cy, r, r);

// smooth closed curve through points (Catmull-Rom -> cubic Bezier)
export function blobD(pts, closed = true, tension = 1) {
  const n = pts.length, f = q => q[0].toFixed(2) + ' ' + q[1].toFixed(2);
  const P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = 'M' + f(P(0));
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
    d += 'C' + f(c1) + ' ' + f(c2) + ' ' + f(p2);
  }
  return d + (closed ? 'Z' : '');
}

// ---------------------------------------------------------------- defs
let _uid = 0;
export const uid = p => `${p}${++_uid}`;

// clip helper: returns [clipPathElement, url]
export function clipTo(defs, d) {
  const id = uid('clip');
  defs.appendChild(el('clipPath', { id }, el('path', { d })));
  return `url(#${id})`;
}

// Gouache paint filter: pigment mottling + paper tooth, clipped to the shape.
// strength ~ 0.25..0.6. Noise lives in the element's user space so the texture
// travels with the object when it moves.
export function paintFilter(defs, { id = uid('paint'), freq = 0.018, strength = 0.22, tooth = 0.08, seed = 3, blend = 'soft-light', octaves = 3 } = {}) {
  const k = strength, t = tooth;
  defs.appendChild(el('filter', { id, x: '-5%', y: '-5%', width: '110%', height: '110%', 'color-interpolation-filters': 'sRGB' },
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: Array.isArray(freq) ? freq.join(' ') : freq, numOctaves: octaves, seed, result: 'n1' }),
    el('feColorMatrix', { in: 'n1', type: 'matrix', values: `${k * 2} 0 0 0 ${0.5 - k} ${k * 2} 0 0 0 ${0.5 - k} ${k * 2} 0 0 0 ${0.5 - k} 0 0 0 0 1`, result: 'm1' }),
    el('feBlend', { in: 'm1', in2: 'SourceGraphic', mode: blend, result: 'b1' }),
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.55, numOctaves: 2, seed: seed + 11, result: 'n2' }),
    el('feColorMatrix', { in: 'n2', type: 'matrix', values: `${t * 2} 0 0 0 ${1 - t * 1.2} ${t * 2} 0 0 0 ${1 - t * 1.2} ${t * 2} 0 0 0 ${1 - t * 1.2} 0 0 0 0 1`, result: 'm2' }),
    el('feBlend', { in: 'm2', in2: 'b1', mode: 'multiply', result: 'b2' }),
    el('feComposite', { in: 'b2', in2: 'SourceGraphic', operator: 'in' })));
  return `url(#${id})`;
}

// soft blur filter (depth of field / soft shadows)
export function blurFilter(defs, sd, id = uid('blur')) {
  defs.appendChild(el('filter', { id, x: '-30%', y: '-30%', width: '160%', height: '160%' },
    el('feGaussianBlur', { stdDeviation: sd })));
  return `url(#${id})`;
}

export function linGrad(defs, x1, y1, x2, y2, stops, units = 'objectBoundingBox') {
  const id = uid('lg');
  defs.appendChild(el('linearGradient', { id, x1, y1, x2, y2, gradientUnits: units },
    stops.map(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }))));
  return `url(#${id})`;
}
export function radGrad(defs, cx, cy, r, stops, units = 'objectBoundingBox', extra = {}) {
  const id = uid('rg');
  defs.appendChild(el('radialGradient', { id, cx, cy, r, gradientUnits: units, ...extra },
    stops.map(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }))));
  return `url(#${id})`;
}

// transform string helper
export const T = (x = 0, y = 0, r = 0, sx = 1, sy = sx) =>
  `translate(${x.toFixed(2)} ${y.toFixed(2)})` + (r ? ` rotate(${r.toFixed(3)})` : '') + (sx !== 1 || sy !== 1 ? ` scale(${sx.toFixed(4)} ${sy.toFixed(4)})` : '');

// colour utils
export function mix(c1, c2, t) {
  const a = hex(c1), b = hex(c2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}
function hex(c) { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); }
