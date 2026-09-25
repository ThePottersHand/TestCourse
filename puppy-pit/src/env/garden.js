// Environment kit: sky, bare trees, house backs, close-board fence, lawn, pit.
import { el, g, shape, rough, ellipseD, circleD, blobD, T, paintFilter, blurFilter, linGrad, radGrad, clipTo, mix, rng, uid } from '../lib/core.js';
import { P } from '../lib/palette.js';

// ---------------------------------------------------------------- sky
export function sky(defs, { W = 1920, H = 1080, top = P.skyHigh, mid = P.sky, low = P.skyLow, seed = 5, clouds = true } = {}) {
  const grad = linGrad(defs, 0, 0, 0, 1, [[0, top], [0.55, mid], [1, low]]);
  const blur = blurFilter(defs, 38);
  const r = rng(seed);
  const cl = [];
  if (clouds) {
    for (let i = 0; i < 14; i++) {
      const cx = r() * W * 1.2 - W * 0.1, cy = r() * H * 0.45, rx = 180 + r() * 380, ry = 40 + r() * 70;
      cl.push(el('path', { d: ellipseD(cx, cy, rx, ry, (r() - 0.5) * 8), fill: r() < 0.5 ? '#e6e2d8' : '#c4c4bd', opacity: 0.35 + r() * 0.3 }));
    }
  }
  return g({}, el('rect', { x: -200, y: -200, width: W + 400, height: H + 400, fill: grad }), g({ filter: blur }, cl));
}

// ---------------------------------------------------------------- bare tree
// Recursive branching; returns a group of tapered branch polygons.
export function bareTree(defs, { x, y, h = 300, seed = 1, color = P.treeMid, width = null, spread = 1, lean = 0, depth = 7, twig = 0.6 } = {}) {
  const r = rng(seed);
  const polys = [];
  const w0 = width ?? h * 0.055;
  function branch(x0, y0, ang, len, w, d) {
    const a = ang * Math.PI / 180;
    // slight curve: mid control point displaced
    const x1 = x0 + Math.sin(a) * len, y1 = y0 - Math.cos(a) * len;
    const bend = (r() - 0.5) * len * 0.18;
    const mx = (x0 + x1) / 2 + Math.cos(a) * bend, my = (y0 + y1) / 2 + Math.sin(a) * bend;
    const w1 = w * 0.68;
    const nx = Math.cos(a), ny = Math.sin(a);
    const pts = `M${(x0 - nx * w / 2).toFixed(1)} ${(y0 - ny * w / 2).toFixed(1)} Q${(mx - nx * (w + w1) / 4).toFixed(1)} ${(my - ny * (w + w1) / 4).toFixed(1)} ${(x1 - nx * w1 / 2).toFixed(1)} ${(y1 - ny * w1 / 2).toFixed(1)} L${(x1 + nx * w1 / 2).toFixed(1)} ${(y1 + ny * w1 / 2).toFixed(1)} Q${(mx + nx * (w + w1) / 4).toFixed(1)} ${(my + ny * (w + w1) / 4).toFixed(1)} ${(x0 + nx * w / 2).toFixed(1)} ${(y0 + ny * w / 2).toFixed(1)}Z`;
    polys.push(pts);
    if (d <= 0 || w1 < 0.5) return;
    const n = d > 4 ? 2 + (r() < 0.35 ? 1 : 0) : 2 + (r() < 0.6 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const spreadA = (18 + r() * 26) * spread;
      const na = ang + (i - (n - 1) / 2) * spreadA + (r() - 0.5) * 16 + (ang > 0 ? -3 : 3);
      const nl = len * (0.62 + r() * 0.2) * (d < 3 ? twig / 0.6 : 1);
      branch(x1, y1, na, nl, w1 * (0.75 + r() * 0.2), d - 1);
    }
  }
  branch(x, y, lean, h * 0.34, w0, depth);
  return el('path', { d: polys.join(''), fill: color });
}

// ---------------------------------------------------------------- house back
// Frontal brick house back (parallel to the picture plane). s = px per metre.
export function houseBack(defs, { x, y, s, w = 6, wallH = 5.4, roofH = 2.4, seed = 1, brick = P.brick, haze = 0, windows = [[1.1, 3.2], [3.6, 3.2]], chimney = 0.8, drainX = 2.6, pots = 2 } = {}) {
  const X = m => x + m * s, Y = m => y - m * s;
  const hz = c => mix(c, P.haze, haze);
  const tex = paintFilter(defs, { freq: [0.02, 0.08], strength: 0.22, tooth: 0.1, seed });
  const parts = [];
  // roof (slate) as a trapezoid (hipped look)
  parts.push(shape(`M${X(-0.25)} ${Y(wallH)} L${X(w + 0.25)} ${Y(wallH)} L${X(w - 0.9)} ${Y(wallH + roofH)} L${X(0.9)} ${Y(wallH + roofH)}Z`, hz(P.slate), { r: { amp: 1, wl: 30, seed: seed + 1 } }));
  parts.push(shape(`M${X(-0.25)} ${Y(wallH)} L${X(w + 0.25)} ${Y(wallH)} L${X(w + 0.1)} ${Y(wallH + 0.25)} L${X(-0.1)} ${Y(wallH + 0.25)}Z`, hz(P.slateDark), { r: { amp: 0.6, wl: 30, seed: seed + 2 }, opacity: 0.8 }));
  // chimney
  if (chimney) {
    const cx0 = chimney * w;
    parts.push(shape(`M${X(cx0)} ${Y(wallH + roofH - 0.3)} L${X(cx0)} ${Y(wallH + roofH + 1.0)} L${X(cx0 + 0.75)} ${Y(wallH + roofH + 1.0)} L${X(cx0 + 0.75)} ${Y(wallH + roofH - 0.6)}Z`, hz(brick), { r: { amp: 0.7, wl: 20, seed: seed + 3 } }));
    parts.push(shape(`M${X(cx0 - 0.05)} ${Y(wallH + roofH + 1.0)} L${X(cx0 + 0.8)} ${Y(wallH + roofH + 1.0)} L${X(cx0 + 0.8)} ${Y(wallH + roofH + 1.12)} L${X(cx0 - 0.05)} ${Y(wallH + roofH + 1.12)}Z`, hz(P.brickDark), { r: { amp: 0.4, wl: 20, seed: seed + 4 } }));
    for (let i = 0; i < pots; i++) {
      const px = cx0 + 0.18 + i * 0.36;
      parts.push(shape(`M${X(px - 0.08)} ${Y(wallH + roofH + 1.12)} L${X(px - 0.06)} ${Y(wallH + roofH + 1.5)} L${X(px + 0.06)} ${Y(wallH + roofH + 1.5)} L${X(px + 0.08)} ${Y(wallH + roofH + 1.12)}Z`, hz('#8c6452'), { r: { amp: 0.3, wl: 10, seed: seed + 5 + i } }));
    }
  }
  // wall
  const wallD = `M${X(0)} ${Y(0)} L${X(0)} ${Y(wallH)} L${X(w)} ${Y(wallH)} L${X(w)} ${Y(0)}Z`;
  parts.push(shape(wallD, hz(brick), { r: { amp: 0.8, wl: 40, seed: seed + 6 } }));
  // brick courses (sparse hints)
  const r = rng(seed + 9);
  const courses = [];
  for (let m = 0.3; m < wallH; m += 0.075 * 3) {
    if (r() < 0.55) continue;
    const x0 = r() * w * 0.8, x1 = x0 + 0.4 + r() * 1.5;
    courses.push(`M${X(x0).toFixed(1)} ${Y(m).toFixed(1)} L${X(Math.min(w, x1)).toFixed(1)} ${Y(m).toFixed(1)}`);
  }
  parts.push(el('path', { d: courses.join(''), stroke: hz(P.mortar), 'stroke-width': Math.max(0.6, s * 0.012), opacity: 0.5, fill: 'none' }));
  // eaves shadow
  parts.push(shape(`M${X(0)} ${Y(wallH)} L${X(w)} ${Y(wallH)} L${X(w)} ${Y(wallH - 0.35)} L${X(0)} ${Y(wallH - 0.35)}Z`, hz(P.brickDark), { r: { amp: 0.5, wl: 20, seed: seed + 7 }, opacity: 0.6 }));
  // windows
  windows.forEach(([wx, wy], i) => {
    const ww = 1.25, wh = 1.3;
    parts.push(shape(`M${X(wx - 0.08)} ${Y(wy - 0.1)} L${X(wx + ww + 0.08)} ${Y(wy - 0.1)} L${X(wx + ww + 0.08)} ${Y(wy - 0.22)} L${X(wx - 0.08)} ${Y(wy - 0.22)}Z`, hz('#b5aca0'), { r: { amp: 0.3, wl: 10, seed: seed + 20 + i } }));
    parts.push(shape(`M${X(wx)} ${Y(wy)} L${X(wx)} ${Y(wy + wh)} L${X(wx + ww)} ${Y(wy + wh)} L${X(wx + ww)} ${Y(wy)}Z`, hz(P.frame), { r: { amp: 0.4, wl: 12, seed: seed + 30 + i } }));
    const gx = 0.07;
    const glass = linGrad(defs, 0, 0, 0.3, 1, [[0, hz('#9aa2a4')], [1, hz(P.glassDark)]]);
    parts.push(el('path', { d: `M${X(wx + gx)} ${Y(wy + gx)} L${X(wx + gx)} ${Y(wy + wh - gx)} L${X(wx + ww / 2 - 0.03)} ${Y(wy + wh - gx)} L${X(wx + ww / 2 - 0.03)} ${Y(wy + gx)}Z M${X(wx + ww / 2 + 0.03)} ${Y(wy + gx)} L${X(wx + ww / 2 + 0.03)} ${Y(wy + wh - gx)} L${X(wx + ww - gx)} ${Y(wy + wh - gx)} L${X(wx + ww - gx)} ${Y(wy + gx)}Z`, fill: glass }));
    // net curtain hint
    parts.push(el('path', { d: `M${X(wx + gx)} ${Y(wy + wh * 0.62)} L${X(wx + ww - gx)} ${Y(wy + wh * 0.62)} L${X(wx + ww - gx)} ${Y(wy + gx)} L${X(wx + gx)} ${Y(wy + gx)}Z`, fill: hz('#d9d6cd'), opacity: 0.35 }));
  });
  // drainpipe
  if (drainX != null) {
    parts.push(el('path', { d: `M${X(drainX)} ${Y(wallH - 0.1)} L${X(drainX)} ${Y(0)}`, stroke: hz('#3f4144'), 'stroke-width': Math.max(1.5, s * 0.07), fill: 'none' }));
    parts.push(el('path', { d: `M${X(-0.25)} ${Y(wallH - 0.02)} L${X(w + 0.25)} ${Y(wallH - 0.02)}`, stroke: hz('#3f4144'), 'stroke-width': Math.max(1.5, s * 0.1), fill: 'none' }));
  }
  return g({ filter: tex }, parts);
}

// ---------------------------------------------------------------- fence
// Close-board fence, frontal at depth Z from world X a..b.
export function fence(defs, cam, { Z, a, b, h = 1.8, seed = 3, postEvery = 1.83 } = {}) {
  const s = cam.s(Z);
  const [x0, yb] = cam.p(a, 0, Z), [x1] = cam.p(b, 0, Z);
  const yt = yb - h * s;
  const r = rng(seed);
  const tex = paintFilter(defs, { freq: [0.12, 0.012], strength: 0.3, tooth: 0.12, seed: seed + 1 });
  const boards = [];
  const bw = 0.1 * s;
  // dark base behind boards so gaps read as shadow
  boards.push(el('rect', { x: x0, y: yt, width: x1 - x0, height: yb - yt, fill: P.woodDeep }));
  for (let x = x0; x < x1; x += bw * 0.92) {
    const tone = r();
    const c = tone < 0.15 ? P.woodDark : tone > 0.85 ? P.woodLight : mix(P.wood, P.woodLight, r() * 0.4);
    const top = yt + (r() - 0.5) * 1.2;
    boards.push(shape(`M${x.toFixed(1)} ${top.toFixed(1)} L${(x + bw).toFixed(1)} ${(top + 0.5).toFixed(1)} L${(x + bw).toFixed(1)} ${yb} L${x.toFixed(1)} ${yb}Z`, c, { r: { amp: 0.35, wl: 30, grit: 0.2, seed: seed + Math.floor(x) } }));
    // overlap shadow on the right edge of each board
    boards.push(el('rect', { x: (x + bw - Math.max(1, bw * 0.12)).toFixed(1), y: top, width: Math.max(1, bw * 0.12).toFixed(1), height: yb - top, fill: P.woodDeep, opacity: 0.45 }));
  }
  // horizontal rails showing through as slight bulges + capping
  const cap = shape(`M${x0} ${yt - 0.05 * s} L${x1} ${yt - 0.05 * s} L${x1} ${yt + 0.03 * s} L${x0} ${yt + 0.03 * s}Z`, P.woodDark, { r: { amp: 0.4, wl: 40, seed: seed + 5 } });
  const capShadow = el('rect', { x: x0, y: yt + 0.03 * s, width: x1 - x0, height: 0.06 * s, fill: P.woodDeep, opacity: 0.35 });
  // posts
  const posts = [];
  for (let X = Math.ceil(a / postEvery) * postEvery; X < b; X += postEvery) {
    const [px] = cam.p(X, 0, Z);
    posts.push(shape(`M${px - 0.05 * s} ${yt - 0.12 * s} L${px + 0.05 * s} ${yt - 0.12 * s} L${px + 0.05 * s} ${yb} L${px - 0.05 * s} ${yb}Z`, P.post, { r: { amp: 0.3, wl: 20, seed: seed + 50 + Math.round(X * 10) } }));
    posts.push(el('rect', { x: px + 0.02 * s, y: yt - 0.12 * s, width: 0.03 * s, height: yb - yt + 0.12 * s, fill: P.woodDeep, opacity: 0.35 }));
  }
  // gravel board
  const gravel = shape(`M${x0} ${yb - 0.15 * s} L${x1} ${yb - 0.15 * s} L${x1} ${yb} L${x0} ${yb}Z`, '#8d8a82', { r: { amp: 0.4, wl: 40, seed: seed + 7 } });
  // weathering: darker lower band, green algae hint
  const weather = el('rect', { x: x0, y: yb - 0.5 * s, width: x1 - x0, height: 0.35 * s, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#4f5a3c', 0], [1, '#4f5a3c', 0.28]]) });
  return g({ filter: tex }, boards, weather, gravel, capShadow, cap, posts);
}

// ---------------------------------------------------------------- lawn
export function lawn(defs, cam, { yTop, W = 1920, H = 1080, seed = 4, leaves = 60, exclude = null } = {}) {
  const grad = linGrad(defs, 0, 0, 0, 1, [[0, mix(P.lawnLight, P.haze, 0.25)], [0.35, P.lawn], [1, P.lawnDark]]);
  const tex = paintFilter(defs, { freq: [0.5, 0.06], strength: 0.16, tooth: 0.12, seed, octaves: 2 });
  const tex2 = paintFilter(defs, { freq: 0.006, strength: 0.16, tooth: 0.0, seed: seed + 3, octaves: 2 });
  const r = rng(seed + 1);
  const bits = [];
  // darker clumps
  for (let i = 0; i < 60; i++) {
    const y = yTop + 10 + Math.pow(r(), 0.8) * (H - yTop), x = r() * W;
    if (exclude && exclude(x, y)) continue;
    const s = cam.s(cam.zAt(y));
    bits.push(tuft(x, y, s, 500 + i, r() < 0.7 ? P.lawnDark : mix(P.lawn, P.lawnPale, 0.5), 7, 0.05 + r() * 0.04));
  }
  // fallen leaves: russet / brown / dull ochre (never puppy gold)
  const leafCols = ['#8a5a3c', '#7a4e36', '#9b7250', '#6e5a3a', '#a0764e'];
  for (let i = 0; i < leaves; i++) {
    const y = yTop + 6 + Math.pow(r(), 0.7) * (H - yTop), x = r() * W;
    if (exclude && exclude(x, y)) continue;
    const s = cam.s(cam.zAt(y));
    const L = s * (0.028 + r() * 0.022);
    bits.push(shape(ellipseD(x, y, L, L * 0.45, r() * 180), leafCols[Math.floor(r() * leafCols.length)], { r: { amp: L * 0.08, wl: L, seed: 900 + i }, opacity: 0.85 }));
  }
  const base = el('rect', { x: -50, y: yTop, width: W + 100, height: H - yTop + 50, fill: grad });
  return g({}, g({ filter: tex2 }, g({ filter: tex }, base)), bits);
}

// grass tuft (blades) at x,y scaled by s (px/m)
export function tuft(x, y, s, seed = 1, col = P.lawnDark, n = 9, h = 0.12) {
  const r = rng(seed);
  const d = [];
  for (let i = 0; i < n; i++) {
    const bx = x + (r() - 0.5) * s * 0.12, bh = s * h * (0.5 + r() * 0.8), lean = (r() - 0.5) * s * 0.08, w = s * 0.008 + 0.6;
    d.push(`M${(bx - w).toFixed(1)} ${y.toFixed(1)} Q${(bx + lean * 0.4).toFixed(1)} ${(y - bh * 0.6).toFixed(1)} ${(bx + lean).toFixed(1)} ${(y - bh).toFixed(1)} Q${(bx + lean * 0.4 + w).toFixed(1)} ${(y - bh * 0.5).toFixed(1)} ${(bx + w).toFixed(1)} ${y.toFixed(1)}Z`);
  }
  return el('path', { d: d.join(''), fill: col });
}

// ---------------------------------------------------------------- pit
function fringe(x0, x1, y, s, seed) {
  const r = rng(seed * 3 + 1), d = [];
  for (let x = x0 - 2; x < x1 + 2; x += 1.6 + r() * 2.2) {
    const h = s * (0.03 + r() * 0.06), lean = (r() - 0.5) * s * 0.03, w = 1 + s * 0.004;
    d.push(`M${(x - w).toFixed(1)} ${(y - s * 0.01).toFixed(1)} Q${(x + lean * 0.5).toFixed(1)} ${(y + h * 0.5).toFixed(1)} ${(x + lean).toFixed(1)} ${(y + h).toFixed(1)} Q${(x + lean * 0.5 + w).toFixed(1)} ${(y + h * 0.4).toFixed(1)} ${(x + w).toFixed(1)} ${(y - s * 0.01).toFixed(1)}Z`);
  }
  return g({}, el('path', { d: d.join(''), fill: '#4e5838' }), el('path', { d: `M${x0 - 3} ${y - 2} L${x1 + 3} ${y - 2} L${x1 + 3} ${y + s * 0.02} L${x0 - 3} ${y + s * 0.02}Z`, fill: '#56603f' }));
}
function fringeSide(P3, X, zn, zf, cam, seed) {
  const r = rng(seed * 5 + 2), d = [];
  for (let Z = zn; Z < zf; Z += 0.03 + r() * 0.03) {
    const [x, y] = P3(X, 0, Z), s = cam.s(Z);
    const h = s * (0.03 + r() * 0.05), lean = s * (0.01 + r() * 0.03), w = 0.8 + s * 0.004;
    d.push(`M${(x - w).toFixed(1)} ${y.toFixed(1)} Q${(x + lean * 0.6).toFixed(1)} ${(y + h * 0.3).toFixed(1)} ${(x + lean).toFixed(1)} ${(y + h).toFixed(1)} Q${(x + lean * 0.4 + w).toFixed(1)} ${(y + h * 0.3).toFixed(1)} ${(x + w).toFixed(1)} ${y.toFixed(1)}Z`);
  }
  return el('path', { d: d.join(''), fill: '#4e5838' });
}
// Rectangular hole: X in [xl,xr], Z in [zn,zf], depth D. Returns layered groups
// so characters can be inserted between floor and rim.
export function pit(defs, cam, { xl, xr, zn, zf, D = 1.3, seed = 8, lip = 0.1 } = {}) {
  const tex = paintFilter(defs, { freq: [0.09, 0.02], strength: 0.35, tooth: 0.14, seed });
  const P3 = (X, Y, Z) => cam.p(X, Y, Z);
  const poly = pts => 'M' + pts.map(p => P3(...p).map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
  const floorD = poly([[xl, -D, zn], [xr, -D, zn], [xr, -D, zf], [xl, -D, zf]]);
  const farD = poly([[xl, 0, zf], [xr, 0, zf], [xr, -D, zf], [xl, -D, zf]]);
  const leftD = poly([[xl, 0, zn], [xl, 0, zf], [xl, -D, zf], [xl, -D, zn]]);
  const rightD = poly([[xr, 0, zn], [xr, 0, zf], [xr, -D, zf], [xr, -D, zn]]);
  const [fx0, fy0] = P3(xl, 0, zf), [fx1] = P3(xr, 0, zf), [, fyb] = P3(xl, -D, zf);
  const sF = cam.s(zf);
  const farGrad = linGrad(defs, 0, 0, 0, 1, [[0, '#7d6652'], [0.35, '#6a5543'], [1, '#3b2f25']]);
  const sideGrad = linGrad(defs, 0, 0, 0, 1, [[0, '#4d3d30'], [1, '#261e18']]);
  const floorGrad = linGrad(defs, 0, 0, 0, 1, [[0, '#231b15'], [0.5, '#2e241c'], [1, '#3a2e24']]);
  const r = rng(seed);
  const R = (a = 1, wl = 30) => ({ amp: a, wl, seed: Math.floor(r() * 1e6) });
  // roots dangling from the turf layer on the far wall
  const roots = [];
  for (let i = 0; i < 26; i++) {
    const x = fx0 + r() * (fx1 - fx0), len = sF * (0.08 + r() * 0.35), y = fy0 + sF * lip * 0.8;
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    let cx = x, cy = y;
    for (let k = 0; k < 4; k++) { cx += (r() - 0.5) * sF * 0.05; cy += len / 4; d += ` L${cx.toFixed(1)} ${cy.toFixed(1)}`; }
    roots.push(d);
  }
  // stones in the walls
  const stones = [];
  for (let i = 0; i < 9; i++) {
    const x = fx0 + r() * (fx1 - fx0), y = fy0 + sF * (0.25 + r() * (D - 0.4)), rr = sF * (0.012 + r() * 0.02);
    stones.push(shape(ellipseD(x, y, rr, rr * 0.7, r() * 180), r() < 0.5 ? '#6a6258' : '#5a5249', { r: R(rr * 0.1, rr) }));
    stones.push(el('path', { d: ellipseD(x, y + rr * 0.6, rr * 0.9, rr * 0.3), fill: '#2a1f18', opacity: 0.35 }));
  }
  // spade marks: vertical streaks on far wall
  const marks = [];
  for (let i = 0; i < 30; i++) {
    const x = fx0 + r() * (fx1 - fx0), y = fy0 + sF * (0.15 + r() * (D - 0.4)), h = sF * (0.2 + r() * 0.3);
    marks.push(`M${x.toFixed(1)} ${y.toFixed(1)} l${((r() - 0.5) * 3).toFixed(1)} ${h.toFixed(1)}`);
  }
  const turfFar = shape(`M${fx0} ${fy0} L${fx1} ${fy0} L${fx1} ${fy0 + sF * lip} L${fx0} ${fy0 + sF * lip}Z`, '#3d3a2a', { r: R(1.2, 18) });
  const farWall = g({},
    shape(farD, farGrad, { r: R(0.8, 30) }),
    el('path', { d: marks.join(''), stroke: P.soilDark, 'stroke-width': Math.max(1, sF * 0.012), opacity: 0.5, fill: 'none' }),
    stones, turfFar,
    el('path', { d: roots.join(''), stroke: '#6b5a44', 'stroke-width': Math.max(0.8, sF * 0.006), fill: 'none', opacity: 0.8 }),
    // occlusion at the base
    el('rect', { x: fx0, y: fyb - sF * 0.35, width: fx1 - fx0, height: sF * 0.35, fill: linGrad(defs, 0, 0, 0, 1, [[0, P.soilDeep, 0], [1, P.soilDeep, 0.8]]) }));
  const floor = g({},
    shape(floorD, floorGrad, { r: R(0.8, 30) }),
    // pale scuffed patch where the light lands
    el('path', { d: ellipseD((fx0 + fx1) / 2, fyb + sF * 0.5, (fx1 - fx0) * 0.35, sF * 0.25), fill: P.soil, opacity: 0.5, filter: blurFilter(defs, sF * 0.12) }));
  const sides = g({},
    shape(leftD, sideGrad, { r: R(0.8, 30) }),
    shape(rightD, sideGrad, { r: R(0.8, 30) }),
    el('path', { d: leftD, fill: P.soilDeep, opacity: 0.35 }),
    el('path', { d: rightD, fill: P.soilDeep, opacity: 0.2 }));
  const openD = poly([[xl, 0, zn], [xr, 0, zn], [xr, 0, zf], [xl, 0, zf]]);
  const openClip = clipTo(defs, openD);
  return {
    openD, openClip,
    back: g({ 'clip-path': openClip }, g({ filter: tex }, farWall, floor, sides)),
    // grass overhanging the far and side rims, drawn over the interior
    rim: g({},
      el('path', { d: `M${fx0} ${fy0 + sF * 0.02} L${fx1} ${fy0 + sF * 0.02} L${fx1} ${fy0 + sF * 0.16} L${fx0} ${fy0 + sF * 0.16}Z`, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#1c1712', 0.55], [1, '#1c1712', 0]]), 'clip-path': openClip }),
      fringe(fx0, fx1, fy0, sF, seed),
      fringeSide(P3, xl, zn, zf, cam, seed + 1)),
    floorY: Z => cam.p(0, -D, Z)[1],
    far: { x0: fx0, x1: fx1, y: fy0, yb: fyb },
  };
}

// ---------------------------------------------------------------- bush
export function bush(defs, { x, y, w, h, seed = 1, color = '#66705a', haze = 0 } = {}) {
  const r = rng(seed);
  const tex = paintFilter(defs, { freq: 0.05, strength: 0.3, tooth: 0.1, seed });
  const c = mix(color, P.haze, haze), cd = mix(mix(color, '#2f3527', 0.35), P.haze, haze), cl = mix(mix(color, '#a3a88a', 0.3), P.haze, haze);
  const blobs = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const bx = x + (i / (n - 1) - 0.5) * w * 0.8 + (r() - 0.5) * w * 0.1;
    const by = y - h * (0.35 + r() * 0.25) * (1 - Math.abs(i / (n - 1) - 0.5));
    const rx = w * (0.16 + r() * 0.08), ry = h * (0.35 + r() * 0.15);
    blobs.push(shape(ellipseD(bx, by, rx, ry), i % 3 === 0 ? cd : c, { r: { amp: rx * 0.04, wl: rx * 0.3, seed: seed * 10 + i, tufts: rx * 0.05, tuftLen: rx * 0.12 } }));
  }
  blobs.push(shape(ellipseD(x - w * 0.1, y - h * 0.62, w * 0.18, h * 0.18), cl, { r: { amp: 1, wl: 10, seed: seed * 10 + 99, tufts: 1.2, tuftLen: 5 }, opacity: 0.6 }));
  blobs.push(el('rect', { x: x - w / 2, y: y - h * 0.18, width: w, height: h * 0.2, fill: cd, opacity: 0.6 }));
  return g({ filter: tex }, blobs);
}

// ---------------------------------------------------------------- pit interior
// Seen from inside/cutaway: far wall with soil strata, receding side walls,
// floor. X in [xl,xr], far wall at zf, walls cut at zn. Returns layers.
export function pitInterior(defs, cam, { xl, xr, zn, zf, D = 1.6, seed = 21 } = {}) {
  const poly = pts => cam.poly(pts);
  const r = rng(seed);
  const tex = paintFilter(defs, { freq: [0.05, 0.012], strength: 0.2, tooth: 0.12, seed });
  const [fx0, fy0] = cam.p(xl, 0, zf), [fx1] = cam.p(xr, 0, zf), [, fyb] = cam.p(xl, -D, zf), sF = cam.s(zf);
  // strata bands on the far wall: turf/roots, topsoil, subsoil, clay
  const bands = [[0, 0.1, '#3a3526'], [0.1, 0.38, '#5b4636'], [0.38, 0.95, '#6f5642'], [0.95, D, '#7a5f45']];
  const wallBands = bands.map(([a, b, c], i) => shape(poly([[xl, -a + 0.02, zf], [xr, -a + 0.02, zf], [xr, -b - 0.02, zf], [xl, -b - 0.02, zf]]), c, { r: { amp: 2.2, wl: 50, seed: seed * 10 + i } }));
  const sideBands = (X, dark) => bands.map(([a, b, c], i) => shape(poly([[X, -a + 0.02, zn], [X, -a + 0.02, zf], [X, -b - 0.02, zf], [X, -b - 0.02, zn]]), mix(c, '#1b1510', dark), { r: { amp: 1.6, wl: 50, seed: seed * 20 + i + (X > 0 ? 7 : 0) } }));
  const roots = [], marks = [], stones = [];
  for (let i = 0; i < 46; i++) {
    const x = fx0 + r() * (fx1 - fx0), len = sF * (0.06 + r() * 0.34);
    let d = `M${x.toFixed(1)} ${(fy0 + sF * 0.08).toFixed(1)}`, cx = x, cy = fy0 + sF * 0.08;
    for (let k = 0; k < 5; k++) { cx += (r() - 0.5) * sF * 0.05; cy += len / 5; d += ` L${cx.toFixed(1)} ${cy.toFixed(1)}`; }
    roots.push(d);
  }
  for (let i = 0; i < 60; i++) {
    const x = fx0 + r() * (fx1 - fx0), y = fy0 + sF * (0.2 + r() * (D - 0.4)), h = sF * (0.1 + r() * 0.22);
    marks.push(`M${x.toFixed(1)} ${y.toFixed(1)} l${((r() - 0.5) * 3).toFixed(1)} ${h.toFixed(1)}`);
  }
  for (let i = 0; i < 26; i++) {
    const x = fx0 + r() * (fx1 - fx0), y = fy0 + sF * (0.4 + r() * (D - 0.5)), rr = sF * (0.01 + r() * 0.018);
    stones.push(shape(ellipseD(x, y, rr, rr * 0.7, r() * 180), r() < 0.5 ? '#8b8174' : '#6c6358', { r: { amp: rr * 0.1, wl: rr, seed: 700 + i } }));
    stones.push(el('path', { d: ellipseD(x, y + rr * 0.6, rr * 0.9, rr * 0.3), fill: '#2a1f18', opacity: 0.35 }));
  }
  const floorD = poly([[xl, -D, zn], [xr, -D, zn], [xr, -D, zf], [xl, -D, zf]]);
  const back = g({},
    el('path', { d: poly([[xl, 0.02, zf], [xr, 0.02, zf], [xr, -D - 0.02, zf], [xl, -D - 0.02, zf]]), fill: '#4b3a2d' }),
    el('path', { d: poly([[xl, 0.02, zn], [xl, 0.02, zf], [xl, -D, zf], [xl, -D, zn]]), fill: '#2f251d' }),
    el('path', { d: poly([[xr, 0.02, zn], [xr, 0.02, zf], [xr, -D, zf], [xr, -D, zn]]), fill: '#342920' }),
    g({ filter: tex },
      wallBands,
      el('path', { d: marks.join(''), stroke: '#3e3026', 'stroke-width': Math.max(1, sF * 0.006), opacity: 0.4, fill: 'none' }),
      stones,
      sideBands(xl, 0.45), sideBands(xr, 0.3),
      shape(floorD, linGrad(defs, 0, 0, 0, 1, [[0, '#2f251d'], [1, '#433428']]), { r: { amp: 1.5, wl: 40, seed: seed + 5 } })),
    el('path', { d: roots.join(''), stroke: '#8a765c', 'stroke-width': Math.max(1, sF * 0.005), fill: 'none', opacity: 0.75 }),
    // skylight: upper wall catches the light, lower wall falls into shadow
    el('path', { d: poly([[xl, 0, zf], [xr, 0, zf], [xr, -D, zf], [xl, -D, zf]]), fill: linGrad(defs, 0, 0, 0, 1, [[0, '#f2e6cf', 0.14], [0.35, '#f2e6cf', 0], [0.7, '#140e0a', 0.2], [1, '#140e0a', 0.55]]) }),
    el('path', { d: poly([[xl, 0, zn], [xl, 0, zf], [xl, -D, zf], [xl, -D, zn]]), fill: linGrad(defs, 0, 0, 0, 1, [[0, '#140e0a', 0.1], [1, '#140e0a', 0.55]]) }),
    el('path', { d: poly([[xr, 0, zn], [xr, 0, zf], [xr, -D, zf], [xr, -D, zn]]), fill: linGrad(defs, 0, 0, 0, 1, [[0, '#140e0a', 0.05], [1, '#140e0a', 0.45]]) }),
    el('path', { d: floorD, fill: radGrad(defs, 0.5, 0.2, 0.7, [[0, '#6b5646', 0.18], [1, '#0d0907', 0.45]]) }));
  // hanging grass on the far rim, seen from below
  const fr = [];
  for (let x = fx0 - 4; x < fx1 + 4; x += 1.8 + r() * 2.6) {
    const h = sF * (0.025 + r() * 0.06), lean = (r() - 0.5) * sF * 0.03, w = 0.8 + sF * 0.003;
    fr.push(`M${(x - w).toFixed(1)} ${fy0.toFixed(1)} Q${(x + lean * 0.5).toFixed(1)} ${(fy0 + h * 0.5).toFixed(1)} ${(x + lean).toFixed(1)} ${(fy0 + h).toFixed(1)} Q${(x + lean * 0.5 + w).toFixed(1)} ${(fy0 + h * 0.4).toFixed(1)} ${(x + w).toFixed(1)} ${fy0.toFixed(1)}Z`);
  }
  const rim = g({}, el('path', { d: fr.join(''), fill: '#58623f' }),
    el('path', { d: `M${fx0 - 2} ${fy0 - 3} L${fx1 + 2} ${fy0 - 3} L${fx1 + 2} ${fy0 + 1} L${fx0 - 2} ${fy0 + 1}Z`, fill: '#5d6843' }));
  return { back, rim, far: { x0: fx0, x1: fx1, y: fy0, yb: fyb, s: sF } };
}
