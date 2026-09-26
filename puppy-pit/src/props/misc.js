// Props: ladder, rope cordon, folded blanket.
import { el, g, shape, ellipseD, T, paintFilter, mix, uid } from '../lib/core.js';
import { P } from '../lib/palette.js';

// Aluminium ladder, drawn upright; units 400 = 1 m. Origin = foot centre.
export function ladder(defs, { len = 2.4, seed = 51, w = 0.42 } = {}) {
  const tex = paintFilter(defs, { freq: [0.2, 0.02], strength: 0.18, tooth: 0.08, seed });
  const L = len * 400, W = w * 400;
  const rails = g({},
    shape(`M${-W / 2 - 10} 0 L${-W / 2 - 10} ${-L} L${-W / 2 + 6} ${-L} L${-W / 2 + 6} 0Z`, '#b3b8b6', { r: { amp: 0.5, wl: 60, seed }, line: '#6d7271', lw: 2 }),
    shape(`M${W / 2 - 6} 0 L${W / 2 - 6} ${-L} L${W / 2 + 10} ${-L} L${W / 2 + 10} 0Z`, '#a7acaa', { r: { amp: 0.5, wl: 60, seed: seed + 1 }, line: '#6d7271', lw: 2 }),
    el('rect', { x: -W / 2 - 4, y: -L, width: 4, height: L, fill: '#dfe3e0', opacity: 0.5 }));
  const rungs = [];
  for (let y = -110; y > -L + 20; y -= 112) {
    rungs.push(shape(`M${-W / 2} ${y} L${W / 2} ${y} L${W / 2} ${y + 12} L${-W / 2} ${y + 12}Z`, '#9da2a0', { r: { amp: 0.3, wl: 30, seed: seed + 10 - y }, line: '#6d7271', lw: 1.6 }));
    rungs.push(el('rect', { x: -W / 2, y: y + 9, width: W, height: 3, fill: '#5d6261', opacity: 0.5 }));
  }
  const feet = g({}, el('rect', { x: -W / 2 - 14, y: -10, width: 26, height: 12, rx: 3, fill: '#2b2b2b' }), el('rect', { x: W / 2 - 12, y: -10, width: 26, height: 12, rx: 3, fill: '#2b2b2b' }));
  return g({ filter: tex }, rungs, rails, feet);
}

// Rope cordon: posts at the given screen points, rope sagging between them.
export function cordon(defs, pts, { s = 200, seed = 61 } = {}) {
  const tex = paintFilter(defs, { freq: [0.1, 0.03], strength: 0.25, tooth: 0.1, seed });
  const posts = [], rope = [];
  pts.forEach(([x, y, k = 1], i) => {
    const h = 0.55 * s * k, w = 0.045 * s * k;
    posts.push(el('path', { d: ellipseD(x, y, w * 1.6, w * 0.4), fill: '#2f3524', opacity: 0.4 }));
    posts.push(shape(`M${x - w} ${y} L${x - w} ${y - h} L${x} ${y - h - w} L${x + w} ${y - h} L${x + w} ${y}Z`, '#8c7a60', { r: { amp: 0.4, wl: 20, seed: seed + i }, line: '#4f4435', lw: 1.2 }));
    posts.push(el('rect', { x: x + w * 0.2, y: y - h, width: w * 0.8, height: h, fill: '#4f4435', opacity: 0.3 }));
  });
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0, k0 = 1] = pts[i], [x1, y1, k1 = 1] = pts[i + 1];
    const ya = y0 - 0.48 * s * k0, yb = y1 - 0.48 * s * k1;
    const sag = 0.08 * s * (k0 + k1) / 2;
    rope.push(`M${x0} ${ya} Q${(x0 + x1) / 2} ${(ya + yb) / 2 + sag * 2} ${x1} ${yb}`);
  }
  return g({ filter: tex }, el('path', { d: rope.join(''), stroke: '#c9b48c', 'stroke-width': Math.max(1.5, 0.012 * s), fill: 'none', 'stroke-linecap': 'round' }), posts);
}

// Folded tartan blanket, to hang over an arm or shoulder. Units 400 = 1 m.
export function foldedBlanket(defs, { seed = 71 } = {}) {
  const tex = paintFilter(defs, { freq: [0.08, 0.03], strength: 0.2, tooth: 0.1, seed });
  const id = uid('tartanF');
  defs.appendChild(el('pattern', { id, width: 40, height: 40, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-8)' },
    el('rect', { width: 40, height: 40, fill: '#6f4a3f' }),
    el('rect', { x: 0, y: 12, width: 40, height: 11, fill: '#434a3e', opacity: 0.55 }),
    el('rect', { x: 12, y: 0, width: 11, height: 40, fill: '#434a3e', opacity: 0.4 }),
    el('rect', { x: 0, y: 30, width: 40, height: 2, fill: '#cdbf9f', opacity: 0.3 }),
    el('rect', { x: 30, y: 0, width: 2, height: 40, fill: '#cdbf9f', opacity: 0.25 })));
  return g({ filter: tex },
    shape('M-70 -20 C-40 -34, 40 -34, 70 -20 L74 60 C40 70, -40 70, -74 60Z', `url(#${id})`, { r: { amp: 1, wl: 20, seed }, line: '#3a2420', lw: 1.6 }),
    shape('M-74 40 C-40 50, 40 50, 74 40 L74 60 C40 70, -40 70, -74 60Z', '#2e1c18', { r: { amp: 0.6, wl: 20, seed: seed + 1 }, opacity: 0.35 }),
    el('path', { d: 'M-70 18 C-30 26, 30 26, 70 18', stroke: '#e6d9bd', 'stroke-width': 3, opacity: 0.35, fill: 'none' }));
}
