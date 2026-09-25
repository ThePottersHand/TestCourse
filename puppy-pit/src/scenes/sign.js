// Concept 1 — "PLEASE DO NOT FALL INTO THE PUPPY PIT"
// Still, slightly elevated tableau. He reads the sign with his heels at the rim;
// nine golden puppies watch his back.
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, rng } from '../lib/core.js';
import { P } from '../lib/palette.js';
import { camera, charScale } from '../lib/cam.js';
import { sky, bareTree, houseBack, fence, lawn, tuft, pit, bush } from '../env/garden.js';
import { narrator } from '../chars/narrator.js';
import { puppy } from '../chars/puppy.js';
import { sign } from '../props/sign.js';

export async function build(svg) {
  const defs = el('defs'); svg.appendChild(defs);
  const cam = camera({ f: 1600, H: 2.5, cx: 960, cy: 150 });
  const root = g({}); svg.appendChild(root);

  // --- sky & far distance
  root.appendChild(sky(defs, { seed: 3, top: '#cfd0ca', mid: '#dcd8cd', low: '#e3dccd' }));
  const r = rng(12);
  const far = g({});
  for (let i = 0; i < 8; i++) far.appendChild(bareTree(defs, { x: -60 + i * 150 + r() * 60, y: 250, h: 150 + r() * 90, seed: 40 + i, color: mix(P.treeFar, P.haze, 0.5), spread: 1.25, depth: 7 }));
  root.appendChild(g({ filter: blurFilter(defs, 1.4) }, far));

  // --- row of house backs, far off, rooftops against the sky
  const zH = 68, sH = cam.s(zH), [, hy] = cam.p(0, 0, zH);
  [[-21, 21, '#96725f', 0.12, [[0.8, 3.0], [3.6, 3.0]], 6.0, 5.4], [-14.6, 22, P.brick, 0.8, [[1.6, 3.0], [4.1, 3.0]], 6.0, 5.4],
   [-6.5, 23, '#a08272', 0.15, [[0.7, 3.2], [2.3, 3.2], [3.9, 3.2]], 5.6, 5.8], [-0.4, 24, P.brick, 0.75, [[1.5, 3.0], [4.1, 3.0]], 6.0, 5.4],
   [7.5, 25, '#93705e', 0.2, [[0.9, 3.0], [3.6, 3.0]], 6.0, 5.4], [13.9, 26, '#9a7a69', 0.7, [[1.2, 3.1], [3.8, 3.1]], 6.2, 5.6]]
    .forEach(([X, seed, brick, chim, win, w, wallH]) => root.appendChild(houseBack(defs, { x: cam.p(X, 0, zH)[0], y: hy, s: sH, w, wallH, seed, haze: 0.4, brick, windows: win, chimney: chim, drainX: w - 0.5 })));
  // Colin's garden: a bare tree and shrubs just over the fence
  const [tx, ty] = cam.p(-4.2, 0, 17);
  root.appendChild(g({ filter: blurFilter(defs, 0.7) }, bareTree(defs, { x: tx, y: ty, h: 640, seed: 9, color: mix(P.treeDark, P.haze, 0.22), spread: 1.0, lean: -2, depth: 8 })));
  const [tx2, ty2] = cam.p(5.4, 0, 20);
  root.appendChild(g({ filter: blurFilter(defs, 0.8) }, bareTree(defs, { x: tx2, y: ty2, h: 520, seed: 31, color: mix(P.treeDark, P.haze, 0.3), spread: 1.1, lean: 3, depth: 8 })));
  const bushY = cam.p(0, 1.72, 10.6)[1];
  [[-7.2, 360, 120, 3], [-2.6, 220, 70, 8], [3.2, 300, 96, 5], [7.4, 260, 84, 6]].forEach(([X, w, h, seed]) =>
    root.appendChild(bush(defs, { x: cam.p(X, 0, 10.6)[0], y: bushY, w, h, seed, haze: 0.12 })));

  // --- fence
  const zF = 10;
  root.appendChild(fence(defs, cam, { Z: zF, a: -8, b: 8, h: 1.8, seed: 5 }));

  // --- lawn
  const yLawn = cam.p(0, 0, zF)[1];
  const pitX = [-2.1, 0.0], pitZ = [4.4, 6.6], D = 0.85;
  const insidePit = (x, y) => {
    const Z = cam.zAt(y); if (Z < pitZ[0] - 0.15 || Z > pitZ[1] + 0.15) return false;
    const X = (x - cam.cx) * Z / cam.f; return X > pitX[0] - 0.15 && X < pitX[1] + 0.15;
  };
  root.appendChild(lawn(defs, cam, { yTop: yLawn, seed: 9, leaves: 55, exclude: insidePit }));
  root.appendChild(el('rect', { x: 0, y: yLawn, width: 1920, height: 26, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#3e4431', 0.45], [1, '#3e4431', 0]]) }));

  // trampled patch where people stand to read the sign
  const [wx, wy] = cam.p(0.7, 0, 5.3), ws = cam.s(5.3);
  root.appendChild(el('path', { d: ellipseD(wx, wy, 1.3 * ws, 0.34 * ws, -2), fill: '#8e8a62', opacity: 0.45, filter: blurFilter(defs, 14) }));
  root.appendChild(el('path', { d: ellipseD(wx - 20, wy + 6, 0.8 * ws, 0.18 * ws, -2), fill: '#7a6e4e', opacity: 0.35, filter: blurFilter(defs, 10) }));
  // --- pit
  const pt = pit(defs, cam, { xl: pitX[0], xr: pitX[1], zn: pitZ[0], zf: pitZ[1], D, seed: 13, lip: 0.12 });
  root.appendChild(pt.back);
  // puppies crowd toward his side, all looking up at his back
  const pups = g({ 'clip-path': pt.openClip });
  const layout = [
    // [X, Z, view, pose, headRot, extra]   (all eyes on his back)
    [-1.78, 6.5, 'side', 'sit', -26, { s: 0.95 }],
    [-1.36, 6.52, 'side', 'stand', -30, { s: 1.0, wag: 14 }],
    [-0.98, 6.46, 'front', 'sit', -14, { s: 0.96, look: 2.6, lookY: -2.2, headX: 3 }],
    [-0.62, 6.5, 'side', 'beg', -16, { s: 1.02 }],
    [-0.3, 6.42, 'side', 'sit', -38, { s: 0.98 }],
    [-1.55, 6.2, 'side', 'sit', -34, { s: 1.04 }],
    [-1.08, 6.14, 'side', 'sit', -30, { s: 1.0 }],
    [-0.62, 6.08, 'front', 'sit', -18, { s: 1.03, look: 2.6, lookY: -2.4, headX: 3 }],
    [-0.2, 5.98, 'side', 'sit', -46, { s: 1.06 }],
  ].sort((a, b) => a[1] - b[1]).reverse();
  const pupObjs = layout.map(([X, Z, view, pose, hr, extra], i) => {
    const p = puppy(defs, { view, pose, seed: i + 1, harold: i === 7 });
    const [x, y] = cam.p(X, -D, Z);
    const { s: k = 1, ...rest } = extra;
    const sc = charScale(cam, Z) * 1.1 * k;
    pups.appendChild(el('path', { d: ellipseD(x, y, 34 * sc, 7 * sc), fill: '#160f0b', opacity: 0.6 }));
    pups.appendChild(p.root);
    return { p, base: { x, y, scale: sc, headRot: hr, ...rest } };
  });
  root.appendChild(pups);
  // shadow falling into the pit from the near rim
  const [nlx, nly] = cam.p(pitX[0], 0, pitZ[0]), [nrx] = cam.p(pitX[1], 0, pitZ[0]);
  root.appendChild(el('path', { d: `M${nlx} ${nly} L${nrx} ${nly} L${nrx} ${nly - 50} L${nlx} ${nly - 50}Z`, fill: linGrad(defs, 0, 0, 0, 1, [[0, P.soilDeep, 0], [1, P.soilDeep, 0.65]]) }));
  root.appendChild(pt.rim);
  // near rim: cut turf edge
  root.appendChild(el('path', { d: `M${nlx - 6} ${nly - 2} L${nrx + 6} ${nly - 2} L${nrx + 6} ${nly + 12} L${nlx - 6} ${nly + 12}Z`, fill: '#4a4a30', filter: blurFilter(defs, 0.8) }));

  // --- the sign (facing him, turned a little toward us)
  const Zs = 5.35, [sgx, sgy] = cam.p(1.45, 0, Zs), ss = cam.s(Zs) / 1000;
  const sg = sign(defs, { seed: 4 });
  root.appendChild(el('path', { d: ellipseD(sgx, sgy + 2, 30, 7), fill: '#2f3524', opacity: 0.35, filter: blurFilter(defs, 2) }));
  root.appendChild(g({ transform: `translate(${sgx} ${sgy}) scale(${ss * 0.78} ${ss}) skewY(-5)` }, sg.root));

  // --- the narrator, heels at the rim, reading glasses on
  const Zn = 5.4, [nx, ny] = cam.p(0.12, 0, Zn), ns = charScale(cam, Zn);
  root.appendChild(el('path', { d: ellipseD(nx + 10, ny + 2, 95 * ns, 12 * ns), fill: '#2f3524', opacity: 0.45, filter: blurFilter(defs, 3) }));
  const n = narrator(defs, { seed: 17 });
  root.appendChild(n.root);

  // foreground grass, slightly soft
  const fg = g({});
  const rr = rng(77);
  for (let i = 0; i < 22; i++) {
    const x = rr() * 1920, y = 1072 + rr() * 20;
    if (x > 250 && x < 1000) continue;
    fg.appendChild(tuft(x, y, 420, 200 + i, mix(P.lawnDark, P.lawnDeep, rr()), 11, 0.14));
  }
  root.appendChild(g({ filter: blurFilter(defs, 2.2) }, fg));

  return {
    update(t) {
      const b = Math.sin(t * 1.4);
      n.set({ x: nx, y: ny, scale: ns, lean: 12 + b * 0.25, head: 9, glasses: true, brow: 3, browTilt: -5,
        armN: [14, 26, -30, 0.35], armF: [10, 26, -20, 0.35], armsBehind: true });
      pupObjs.forEach(({ p, base }, i) => p.set({ ...base, wag: (base.wag || 0) + Math.sin(t * 9 + i) * 10 }));
    },
  };
}
