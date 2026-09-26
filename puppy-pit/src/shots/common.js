// Shared set-builders for the shots: garden (exterior), top-down pit, in-pit.
// Lighting modes: 'overcast' (the day it happened), 'late', 'dusk' (the rescue),
// 'golden' (the present day, when he visits).
import { el, g, shape, ellipseD, circleD, T, mix, rng, blurFilter, linGrad, radGrad, paintFilter, clipTo } from '../lib/core.js';
import { P } from '../lib/palette.js';
import { camera, charScale } from '../lib/cam.js';
import { sky, bareTree, houseBack, fence, lawn, tuft, pit, bush, pitInterior } from '../env/garden.js';
import { sign } from '../props/sign.js';
import { cordon } from '../props/misc.js';

export { camera, charScale };

export function stage(svg) {
  const defs = el('defs'); svg.appendChild(defs);
  const root = g({}); svg.appendChild(root);
  return { defs, root };
}

export const SKY = {
  overcast: { top: '#cfd0ca', mid: '#dcd8cd', low: '#e3dccd' },
  late: { top: '#c7c2b8', mid: '#dccfbb', low: '#e8d2b2' },
  dusk: { top: '#59607a', mid: '#8e8b98', low: '#cfa98f' },
  golden: { top: '#bfb8ae', mid: '#e3cda7', low: '#f1d29c' },
};

// colour treatment laid over a finished set (and its characters)
export function tint(defs, mode, { W = 1920, H = 1080, sun = [-200, 200] } = {}) {
  const t = g({ 'pointer-events': 'none' });
  const R = (fill, blend, opacity) => el('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill, opacity, style: `mix-blend-mode:${blend}` });
  if (mode === 'golden') {
    t.appendChild(R('#e8913a', 'soft-light', 0.32));
    t.appendChild(R('#5b3a28', 'soft-light', 0.18));
    t.appendChild(el('ellipse', { cx: sun[0], cy: sun[1], rx: 1300, ry: 900, fill: radGrad(defs, 0.5, 0.5, 0.5, [[0, '#ffcf86', 0.4], [0.45, '#ffc27a', 0.1], [1, '#ffc27a', 0]]), style: 'mix-blend-mode:screen' }));
  } else if (mode === 'dusk') {
    t.appendChild(R('#5f7488', 'multiply', 0.3));
    t.appendChild(R('#2c3d55', 'soft-light', 0.24));
  } else if (mode === 'late') {
    t.appendChild(R('#d98a3a', 'soft-light', 0.34));
    t.appendChild(R('#b08a62', 'multiply', 0.14));
  }
  return t;
}

// Affine placement of the sign prop (units: mm, origin = stake foot) standing at
// (X, Z) with its face turned `yaw` degrees from the camera toward -X. Fitted on
// the sheet so it keeps the right foreshortening and slant for any camera; if we
// are looking at it from behind, `back` says to draw the blank side.
export function signMatrix(cam, X, Z, yaw) {
  const a = yaw * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
  const P3 = (u, v) => cam.p(X + u / 1000 * cs, -v / 1000, Z - u / 1000 * sn);
  const o = P3(0, -1370), r = P3(210, -1370), l = P3(-210, -1370), up = P3(0, -1520), dn = P3(0, -1223);
  const ax = (r[0] - l[0]) / 420, ay = (r[1] - l[1]) / 420, bx = (dn[0] - up[0]) / 297, by = (dn[1] - up[1]) / 297;
  const e = o[0] + 1370 * bx, f = o[1] + 1370 * by;
  const back = ax * by - ay * bx < 0;
  // seen from behind: mirror the prop so the blank back and stake read correctly
  const m = back ? [-ax, -ay, bx, by, e, f] : [ax, ay, bx, by, e, f];
  return { transform: `matrix(${m.map(v => +v.toFixed(5)).join(' ')})`, back };
}

// ------------------------------------------------------------------ garden
// The green behind the houses: rooftops, Colin's fence, the lawn, the pit and
// its sign. Returns layers so a shot can slot characters in between.
export function gardenSet(defs, cam, o = {}) {
  const {
    mode = 'overcast', fenceZ = 10, housesZ = 68, pitX = [-2.1, 0.0], pitZ = [4.4, 6.6], D = 0.85,
    signAt = [1.45, 5.35], signYaw = 68, cordonOn = false, leaves = 55, seed = 1,
    houses = true, windowsLit = mode === 'dusk', fg = true,
  } = o;
  const L = {};
  L.sky = sky(defs, { seed: 3 + seed, ...SKY[mode] });
  const r = rng(12 + seed);
  const hazeC = mode === 'dusk' ? '#8c8aa0' : mode === 'golden' ? '#e4cfae' : P.haze;
  const far = g({});
  for (let i = 0; i < 9; i++) far.appendChild(bareTree(defs, { x: -120 + i * 150 + r() * 60, y: cam.p(0, 0, 90)[1] + 20, h: 150 + r() * 90, seed: 40 + i, color: mix(P.treeFar, hazeC, 0.5), spread: 1.25, depth: 7 }));
  // the ground beyond Colin's fence out to the horizon (everybody else's gardens). It
  // goes in first, so the far trees and the houses stand on it: from a high camera you
  // see over the fence, and without it the houses float on a strip of sky.
  const yF = cam.p(0, 0, fenceZ)[1];
  const farGround = el('rect', { x: -1200, y: cam.cy - 1, width: 4320, height: Math.max(0, yF - cam.cy + 6),
    fill: linGrad(defs, 0, 0, 0, 1, [[0, mix(P.lawn, hazeC, 0.75)], [1, mix(P.lawn, hazeC, 0.45)]]) });
  L.far = g({}, farGround, g({ filter: blurFilter(defs, 1.4) }, far));
  L.houses = g({});
  if (houses) {
    const sH = cam.s(housesZ), [, hy] = cam.p(0, 0, housesZ);
    [[-21, 21, '#96725f', 0.12, [[0.8, 3.0], [3.6, 3.0]], 6.0, 5.4], [-14.6, 22, P.brick, 0.8, [[1.6, 3.0], [4.1, 3.0]], 6.0, 5.4],
      [-6.5, 23, '#a08272', 0.15, [[0.7, 3.2], [2.3, 3.2], [3.9, 3.2]], 5.6, 5.8], [-0.4, 24, P.brick, 0.75, [[1.5, 3.0], [4.1, 3.0]], 6.0, 5.4],
      [7.5, 25, '#93705e', 0.2, [[0.9, 3.0], [3.6, 3.0]], 6.0, 5.4], [13.9, 26, '#9a7a69', 0.7, [[1.2, 3.1], [3.8, 3.1]], 6.2, 5.6],
      [20.3, 27, '#95725f', 0.2, [[1.0, 3.0], [3.7, 3.0]], 6.0, 5.4]]
      .forEach(([X, sd, brick, chim, win, w, wallH]) => {
        L.houses.appendChild(houseBack(defs, { x: cam.p(X, 0, housesZ)[0], y: hy, s: sH, w, wallH, seed: sd, haze: 0.4, brick, windows: win, chimney: chim, drainX: w - 0.5 }));
        if (windowsLit) win.forEach(([wx, wy], k) => {
          if ((sd + k) % 3 === 0) return;
          const [x0, y0] = [cam.p(X + wx + 0.07, 0, housesZ)[0], hy - (wy + 1.23) * sH];
          L.houses.appendChild(el('rect', { x: x0, y: y0, width: 1.11 * sH, height: 1.16 * sH, fill: '#f4c878', opacity: 0.85 }));
          L.houses.appendChild(el('ellipse', { cx: x0 + 0.55 * sH, cy: y0 + 0.6 * sH, rx: 1.5 * sH, ry: 1.3 * sH, fill: radGrad(defs, 0.5, 0.5, 0.5, [[0, '#ffcf80', 0.35], [1, '#ffcf80', 0]]) }));
        });
      });
  }
  if (houses) {
    // their back-garden fences, a little way in front of the houses, and a line of hedges nearer in
    const rg = rng(30 + seed), Zg = housesZ - 8, sg = cam.s(Zg), ygb = cam.p(0, 0, Zg)[1], ygt = ygb - 1.6 * sg;
    const gardens = g({ filter: paintFilter(defs, { freq: [0.1, 0.02], strength: 0.18, tooth: 0.08, seed: 40 + seed }) });
    for (let X = -34; X < 34; X += 1.83) {
      const [xa] = cam.p(X, 0, Zg), [xb] = cam.p(X + 1.83, 0, Zg), dy = (rg() - 0.5) * 0.04 * sg;
      gardens.appendChild(el('rect', { x: xa, y: ygt + dy, width: xb - xa + 0.6, height: ygb - ygt - dy, fill: mix(mix(P.wood, P.woodLight, rg()), hazeC, 0.6) }));
      gardens.appendChild(el('rect', { x: xa - 0.04 * sg, y: ygt - 0.1 * sg, width: 0.08 * sg, height: ygb - ygt + 0.1 * sg, fill: mix(P.post, hazeC, 0.55) }));
    }
    L.houses.appendChild(gardens);
    const Zh2 = Math.min(32, housesZ * 0.5), sh2 = cam.s(Zh2), yh2 = cam.p(0, 0, Zh2)[1];
    for (let X = -26; X < 26; X += 3.2 + rg() * 4) {
      if (rg() < 0.3) continue;
      const w = 1.6 + rg() * 2.6, hgt = 1.1 + rg() * 0.8;
      L.houses.appendChild(bush(defs, { x: cam.p(X + w / 2, 0, Zh2)[0], y: yh2, w: w * sh2, h: hgt * sh2, seed: 90 + Math.round(X * 7), haze: 0.5 }));
    }
  }
  const [tx, ty] = cam.p(-4.2, 0, 17), [tx2, ty2] = cam.p(5.4, 0, 20);
  L.trees = g({},
    g({ filter: blurFilter(defs, 0.7) }, bareTree(defs, { x: tx, y: ty, h: cam.s(17) * 8.2, seed: 9, color: mix(P.treeDark, hazeC, 0.22), spread: 1.0, lean: -2, depth: 8 })),
    g({ filter: blurFilter(defs, 0.8) }, bareTree(defs, { x: tx2, y: ty2, h: cam.s(20) * 7.8, seed: 31, color: mix(P.treeDark, hazeC, 0.3), spread: 1.1, lean: 3, depth: 8 })));
  const bushY = cam.p(0, 1.72, fenceZ + 0.6)[1], bs = cam.s(fenceZ + 0.6) / 180;
  L.bushes = g({});
  [[-7.2, 360, 120, 3], [-2.6, 220, 70, 8], [3.2, 300, 96, 5], [7.4, 260, 84, 6], [-11.5, 300, 100, 11]].forEach(([X, w, h, sd]) =>
    L.bushes.appendChild(bush(defs, { x: cam.p(X, 0, fenceZ + 0.6)[0], y: bushY, w: w * bs, h: h * bs, seed: sd, haze: 0.12 })));
  L.fence = fence(defs, cam, { Z: fenceZ, a: -16, b: 16, h: 1.8, seed: 5 });
  const yLawn = cam.p(0, 0, fenceZ)[1];
  const insidePit = (x, y) => {
    const Z = cam.zAt(y); if (Z < pitZ[0] - 0.15 || Z > pitZ[1] + 0.15) return false;
    const X = (x - cam.cx) * Z / cam.f + cam.x0; return X > pitX[0] - 0.15 && X < pitX[1] + 0.15;
  };
  L.lawn = g({}, lawn(defs, cam, { yTop: yLawn, seed: 9 + seed, leaves, exclude: insidePit }),
    el('rect', { x: -1200, y: yLawn, width: 4320, height: 26, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#3e4431', 0.45], [1, '#3e4431', 0]]) }));
  const [wx, wy] = cam.p(pitX[1] + 0.7, 0, (pitZ[0] + pitZ[1]) / 2), ws = cam.s((pitZ[0] + pitZ[1]) / 2);
  L.lawn.appendChild(el('path', { d: ellipseD(wx, wy, 1.3 * ws, 0.34 * ws, -2), fill: '#8e8a62', opacity: 0.4, filter: blurFilter(defs, 14) }));
  L.pit = pit(defs, cam, { xl: pitX[0], xr: pitX[1], zn: pitZ[0], zf: pitZ[1], D, seed: 13, lip: 0.12 });
  // sign: it faces the pit (west, -X), turned partly toward camera
  L.sign = g({});
  if (signAt) {
    const [sgx, sgy] = cam.p(signAt[0], 0, signAt[1]), ss = cam.s(signAt[1]) / 1000;
    L.sign.appendChild(el('path', { d: ellipseD(sgx, sgy + 2, 30 * ss * 4, 7 * ss * 4), fill: '#2f3524', opacity: 0.35, filter: blurFilter(defs, 2) }));
    if (mode === 'golden') L.sign.appendChild(el('path', { d: `M${sgx} ${sgy} L${sgx + 900 * ss} ${sgy + 14 * ss} L${sgx + 900 * ss} ${sgy + 44 * ss} L${sgx} ${sgy + 20 * ss}Z`, fill: '#3b2e1f', opacity: 0.3, filter: blurFilter(defs, 3) }));
    const M = signMatrix(cam, signAt[0], signAt[1], signYaw);
    L.sign.appendChild(g({ transform: M.transform }, sign(defs, { seed: 4, back: M.back }).root));
    L.signPos = [sgx, sgy, ss];
  }
  L.cordon = g({});
  if (cordonOn) {
    const m = 0.45, pz = [pitZ[0] - m, pitZ[1] + m], px = [pitX[0] - m, pitX[1] + m];
    const P3 = (X, Z) => { const [x, y] = cam.p(X, 0, Z); return [x, y, cam.s(Z) / cam.s(5.4)]; };
    L.cordonBack = cordon(defs, [P3(px[0], pz[1]), P3((px[0] + px[1]) / 2, pz[1]), P3(px[1], pz[1])], { s: cam.s(5.4) });
    L.cordonSide = cordon(defs, [P3(px[1], pz[1]), P3(px[1], (pz[0] + pz[1]) / 2), P3(px[1], pz[0])], { s: cam.s(5.4) });
    L.cordonLeft = cordon(defs, [P3(px[0], pz[1]), P3(px[0], (pz[0] + pz[1]) / 2), P3(px[0], pz[0])], { s: cam.s(5.4) });
  }
  L.fg = g({});
  if (fg) {
    const rr = rng(77 + seed);
    for (let i = 0; i < 22; i++) {
      const x = rr() * 1920, y = 1072 + rr() * 20;
      L.fg.appendChild(tuft(x, y, 420, 200 + i, mix(P.lawnDark, P.lawnDeep, rr()), 11, 0.14));
    }
    L.fg = g({ filter: blurFilter(defs, 2.2) }, L.fg);
  }
  L.mode = mode;
  return L;
}

// soft contact shadow; in golden light a long one stretching right
export function contactShadow(defs, x, y, w, mode, len = 3) {
  const sh = g({});
  sh.appendChild(el('path', { d: ellipseD(x, y + 2, w, w * 0.14), fill: '#232617', opacity: 0.42, filter: blurFilter(defs, Math.max(1.5, w * 0.04)) }));
  if (mode === 'golden') sh.appendChild(el('path', { d: `M${x - w * 0.35} ${y} L${x + w * len} ${y + w * 0.08} L${x + w * len} ${y + w * 0.34} L${x - w * 0.35} ${y + w * 0.2}Z`, fill: '#3b2e1f', opacity: 0.32, filter: blurFilter(defs, w * 0.05) }));
  return sh;
}

// ------------------------------------------------------------------ top-down
// Looking straight down into the pit. The set is built once at a reference
// camera height and re-projected per frame (lawn plane and floor plane scale
// independently; the walls are re-quadded), so the camera can descend into it.
export function topPitSet(defs, o = {}) {
  const { mode = 'overcast', w = 2.1, l = 2.3, D = 1.6, seed = 3, leaves = 70, cordonOn = false, f = 1000, Href = 2.5, cx = 960, cy = 540, gloom = 0 } = o;
  const X0 = -w / 2, X1 = w / 2, G0 = -l / 2, G1 = l / 2;
  const pr = (X, G, Y, Hc = Href) => { const d = Hc - Y; return [cx + X * f / d, cy - G * f / d]; };
  const r = rng(seed);
  const L = {};
  const s0 = f / Href;
  // --- ground plane (lawn, leaves, rim grass, sign, cordon): one group, scaled as a plane
  const lawnTex = paintFilter(defs, { freq: [0.45, 0.4], strength: 0.22, tooth: 0.16, seed: seed + 1, octaves: 2 });
  const lawnTex2 = paintFilter(defs, { freq: 0.003, strength: 0.12, tooth: 0, seed: seed + 2, octaves: 2 });
  const lawnC = mode === 'dusk' ? '#617050' : mode === 'golden' ? '#7f8a58' : P.lawn;
  const ground = g({});
  ground.appendChild(g({ filter: lawnTex2 }, g({ filter: lawnTex }, el('rect', { x: -2400, y: -1800, width: 6720, height: 4680, fill: lawnC }))));
  const leafCols = ['#8a5a3c', '#7a4e36', '#9b7250', '#6e5a3a', '#a0764e'];
  for (let i = 0; i < leaves; i++) {
    const X = (r() - 0.5) * 12, G = (r() - 0.5) * 8;
    if (X > X0 - 0.2 && X < X1 + 0.2 && G > G0 - 0.2 && G < G1 + 0.2) continue;
    const [x, y] = pr(X, G, 0), Ls = s0 * (0.03 + r() * 0.02);
    ground.appendChild(shape(ellipseD(x, y, Ls, Ls * 0.5, r() * 180), leafCols[i % 5], { r: { amp: Ls * 0.08, wl: Ls, seed: 300 + i }, opacity: 0.9 }));
  }
  for (let i = 0; i < 120; i++) {
    const X = (r() - 0.5) * 12, G = (r() - 0.5) * 8;
    if (X > X0 - 0.1 && X < X1 + 0.1 && G > G0 - 0.1 && G < G1 + 0.1) continue;
    const [x, y] = pr(X, G, 0);
    ground.appendChild(el('path', { d: ellipseD(x, y, s0 * (0.05 + r() * 0.08), s0 * (0.04 + r() * 0.06), r() * 180), fill: r() < 0.6 ? P.lawnDark : P.lawnLight, opacity: 0.35 }));
  }
  // hole in the lawn: dark base under the walls
  const rimQuad = [[X0, G1], [X1, G1], [X1, G0], [X0, G0]].map(([X, G]) => pr(X, G, 0));
  // rim grass
  const rim = [];
  const edge = (P0, P1, n, inward) => {
    for (let i = 0; i < n; i++) {
      const u = i / n + r() * 0.5 / n;
      const X = P0[0] + (P1[0] - P0[0]) * u, G = P0[1] + (P1[1] - P0[1]) * u;
      const [x, y] = pr(X, G, 0), hl = s0 * (0.03 + r() * 0.05), wd = 1 + s0 * 0.003;
      const [ix, iy] = inward, lx = (r() - 0.5) * hl * 0.6;
      rim.push(`M${(x - wd * Math.abs(iy)).toFixed(1)} ${(y - wd * Math.abs(ix)).toFixed(1)} Q${(x + ix * hl * 0.5 + lx * 0.5).toFixed(1)} ${(y + iy * hl * 0.5).toFixed(1)} ${(x + ix * hl + lx).toFixed(1)} ${(y + iy * hl).toFixed(1)} Q${(x + ix * hl * 0.4 + wd).toFixed(1)} ${(y + iy * hl * 0.4 + wd).toFixed(1)} ${(x + wd * Math.abs(iy)).toFixed(1)} ${(y + wd * Math.abs(ix)).toFixed(1)}Z`);
    }
  };
  edge([X0, G1], [X1, G1], 150, [0, 1]); edge([X0, G0], [X1, G0], 150, [0, -1]);
  edge([X0, G0], [X0, G1], 150, [1, 0]); edge([X1, G0], [X1, G1], 150, [-1, 0]);
  const rimG = g({}, el('path', { d: rim.join(''), fill: mode === 'dusk' ? '#4b5638' : '#56613f' }),
    el('path', { d: 'M' + rimQuad.map(p => p.join(' ')).join('L') + 'Z', fill: 'none', stroke: '#394128', 'stroke-width': 3, opacity: 0.7 }));
  // the sign on the east rim, from above
  const [sx, sy] = pr(X1 + 0.55, 0.15, 0);
  const signG = g({},
    el('path', { d: `M${sx} ${sy} l${s0 * 0.55} ${s0 * 0.1} l0 ${s0 * 0.06} l${-s0 * 0.55} ${-s0 * 0.1}Z`, fill: '#1f2418', opacity: mode === 'golden' ? 0.35 : 0.18, filter: blurFilter(defs, 3) }),
    el('rect', { x: sx - s0 * 0.022, y: sy - s0 * 0.022, width: s0 * 0.044, height: s0 * 0.044, fill: P.stake, stroke: P.stakeDark, 'stroke-width': 1 }));
  if (cordonOn) {
    const m = 0.45, pts = [[X0 - m, G0 - m], [X1 + m, G0 - m], [X1 + m, G1 + m], [X0 - m, G1 + m]].map(([X, G]) => pr(X, G, 0));
    signG.appendChild(el('path', { d: 'M' + pts.map(p => p.join(' ')).join('L') + 'Z', fill: 'none', stroke: '#2a2a1c', 'stroke-width': 5, opacity: 0.18, transform: `translate(${s0 * 0.04} ${s0 * 0.03})`, filter: blurFilter(defs, 2) }));
    signG.appendChild(el('path', { d: 'M' + pts.map(p => p.join(' ')).join('L') + 'Z', fill: 'none', stroke: '#c9b48c', 'stroke-width': 3.2, opacity: 0.95 }));
    pts.forEach(([x, y]) => signG.appendChild(el('path', { d: circleD(x, y, s0 * 0.035), fill: '#8c7a60', stroke: '#4f4435', 'stroke-width': 1.2 })));
  }
  // --- walls (re-quadded each frame) and floor plane
  const tex = paintFilter(defs, { freq: 0.1, strength: 0.15, tooth: 0.14, seed: seed + 5 });
  const lit = mode === 'golden';
  const BANDS = [[0, 0.1, '#3a3526'], [0.1, 0.4, '#5b4636'], [0.4, 0.95, '#6f5642'], [0.95, 1.0, '#7a5f45']];
  const shadeOf = side => ({ N: 0.18, S: 0.28, W: lit ? 0.62 : 0.34, E: lit ? -0.1 : 0.22 })[side];
  const wallEls = {};
  const hole = el('path', { fill: '#2a2019' });
  const walls = g({ filter: tex }, hole);
  for (const side of ['N', 'S', 'W', 'E']) {
    wallEls[side] = BANDS.map(([a, b, c]) => { const e = el('path', { fill: shadeOf(side) >= 0 ? mix(c, '#140e0a', shadeOf(side)) : mix(c, '#d6a66c', -shadeOf(side) * 3) }); walls.appendChild(e); return { a, b, e }; });
  }
  // walls darken toward the floor; with `gloom` they sink into near-black (a deep hole from high up)
  const wsA = 0.5 + gloom * 0.47, wsC = gloom ? '#060403' : '#140e0a';
  const wsStops = [[0, wsC, 0], [0.35, wsC, gloom * 0.5], [1, wsC, wsA]];
  const wallShade = { N: el('path', { fill: linGrad(defs, 0, 0, 0, 1, wsStops) }), S: el('path', { fill: linGrad(defs, 0, 1, 0, 0, wsStops) }),
    W: el('path', { fill: linGrad(defs, 0, 0, 1, 0, wsStops) }), E: el('path', { fill: linGrad(defs, 1, 0, 0, 0, wsStops) }) };
  Object.values(wallShade).forEach(e => walls.appendChild(e));
  // floor plane content (drawn at the reference height, scaled per frame)
  const sF = f / (Href + D);
  const fq = [[X0, G1], [X1, G1], [X1, G0], [X0, G0]].map(([X, G]) => pr(X, G, -D));
  const floorD = 'M' + fq.map(p => p.join(' ')).join('L') + 'Z';
  const floor = g({},
    g({ filter: tex }, shape(floorD, radGrad(defs, 0.5, 0.5, 0.75, [[0, '#4a3a2d'], [1, '#2a2019']]), { r: { amp: 1.2, wl: 40, seed: seed + 10 } })));
  for (let i = 0; i < 30; i++) {
    const [x, y] = pr(X0 + 0.1 + r() * (w - 0.2), G0 + 0.1 + r() * (l - 0.2), -D);
    floor.appendChild(el('path', { d: `M${x} ${y} l${((r() - 0.5) * sF * 0.12).toFixed(1)} ${((r() - 0.5) * sF * 0.12).toFixed(1)}`, stroke: r() < 0.5 ? '#8f7a55' : '#5b4a38', 'stroke-width': 1.4, opacity: 0.6 }));
  }
  const floorLight = g({});
  if (lit) {
    const sh = [[X0 - 0.1, G1 + 0.1], [X0 + 1.05, G1 + 0.1], [X0 + 0.75, G0 - 0.1], [X0 - 0.1, G0 - 0.1]].map(([X, G]) => pr(X, G, -D));
    floorLight.appendChild(el('path', { d: 'M' + sh.map(p => p.join(' ')).join('L') + 'Z', fill: '#1a120c', opacity: 0.42, filter: blurFilter(defs, 22) }));
  }
  floorLight.appendChild(el('path', { d: floorD, fill: 'none', stroke: '#120c08', 'stroke-width': sF * 0.2, opacity: 0.35, filter: blurFilter(defs, sF * 0.06) }));
  const cast = g({});           // puppies go here (floor plane)
  const castTop = g({});        // things above the floor that scale with it too
  // darkness pooled on the floor (a deep hole seen from high up); off by default
  const floorShade = el('path', { d: floorD, fill: '#060403', opacity: gloom * 0.97 });
  const floorPlane = g({}, floor, floorLight, cast, castTop, floorShade);
  const groundPlane = g({}, ground, signG);
  const rimPlane = g({}, rimG);
  const golden = lit ? el('path', { fill: '#f6b76a', opacity: 0.1, style: 'mix-blend-mode:screen', filter: blurFilter(defs, 20) }) : null;
  L.root = g({}, groundPlane, walls, floorPlane, golden, rimPlane);
  L.cast = cast; L.castTop = castTop; L.floorShade = floorShade;
  L.floorAt = (X, G, lift = 0.2) => { const [x, y] = pr(X, G, -D + lift); return [x, y, (f / (Href + D - lift)) / 400]; };
  L.update = (Hc = Href, pan = [0, 0], cam = [0, 0]) => {
    const k0 = Href / Hc, kF = (Href + D) / (Hc + D);
    // camera offset (metres) -> each plane shifts by its own parallax
    const off = (k, d) => [pan[0] - cam[0] * f / d, pan[1] + cam[1] * f / d];
    const sc = (k, o) => `translate(${cx + o[0]} ${cy + o[1]}) scale(${k}) translate(${-cx} ${-cy})`;
    const o0 = off(k0, Hc), oF = off(kF, Hc + D);
    groundPlane.setAttribute('transform', sc(k0, o0)); rimPlane.setAttribute('transform', sc(k0, o0));
    floorPlane.setAttribute('transform', sc(kF, oF));
    const Pd = (X, G, depth) => { const d = Hc + depth; return [cx + (X - cam[0]) * f / d + pan[0], cy - (G - cam[1]) * f / d + pan[1]]; };
    const q = pts => 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
    const wallQ = { N: [[X0, G1], [X1, G1]], S: [[X1, G0], [X0, G0]], W: [[X0, G0], [X0, G1]], E: [[X1, G1], [X1, G0]] };
    for (const side of ['N', 'S', 'W', 'E']) {
      const [[xa, ga], [xb, gb]] = wallQ[side];
      wallEls[side].forEach(({ a, b, e }) => e.setAttribute('d', q([Pd(xa, ga, a * D), Pd(xb, gb, a * D), Pd(xb, gb, b * D), Pd(xa, ga, b * D)])));
      wallShade[side].setAttribute('d', q([Pd(xa, ga, 0), Pd(xb, gb, 0), Pd(xb, gb, D), Pd(xa, ga, D)]));
    }
    hole.setAttribute('d', q([Pd(X0, G1, 0), Pd(X1, G1, 0), Pd(X1, G0, 0), Pd(X0, G0, 0)]));
    if (golden) golden.setAttribute('d', q([Pd(X0 + 0.9, G1, D), Pd(X1, G1, D), Pd(X1, G0, D), Pd(X0 + 0.9, G0, D)]));
  };
  L.update(Href);
  return L;
}

// ------------------------------------------------------------------ in-pit
// Cut-away view inside the pit (from the concept frame), with the world above.
export function inPitSet(defs, cam, o = {}) {
  const { mode = 'overcast', XL = -1.7, XR = 2.3, ZN = 2.4, ZF = 3.8, D = 1.6, fenceGap = 6.0, seed = 21, twigs = true } = o;
  const L = {};
  L.sky = sky(defs, { seed: 8, ...SKY[mode] });
  L.twigs = twigs ? g({ filter: blurFilter(defs, 0.9) }, bareTree(defs, { x: 2010, y: -60, h: 420, seed: 14, color: mix(P.treeDark, P.haze, 0.35), spread: 1.3, lean: -118, depth: 7, width: 9 })) : g({});
  L.fenceZ = ZF + fenceGap;
  L.fence = fence(defs, cam, { Z: L.fenceZ, a: -8, b: 8, h: 1.8, seed: 5 });
  L.pi = pitInterior(defs, cam, { xl: XL, xr: XR, zn: ZN, zf: ZF, D, seed });
  L.back = L.pi.back;
  L.far = L.pi.far;
  L.shade = g({},
    el('rect', { x: -400, y: L.far.y, width: 2720, height: 90, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#0f0a08', 0.35], [1, '#0f0a08', 0]]) }),
    el('rect', { x: -400, y: L.far.y, width: 2720, height: L.far.yb - L.far.y, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#dfe0d6', 0.1], [0.45, '#dfe0d6', 0], [0.75, '#0f0a08', 0.12], [1, '#0f0a08', 0.3]]) }),
    el('rect', { x: -400, y: L.far.yb - 40, width: 2720, height: 48, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#0f0a08', 0], [1, '#0f0a08', 0.6]]) }));
  L.rim = L.pi.rim;
  L.floor = (X, Z) => { const [x, y] = cam.p(X, -D, Z); return [x, y, charScale(cam, Z)]; };
  return L;
}

export function pupShadow(x, y, sc, w = 36) {
  return el('path', { d: ellipseD(x, y + 1, w * sc, 8 * sc), fill: '#0f0a08', opacity: 0.5 });
}
