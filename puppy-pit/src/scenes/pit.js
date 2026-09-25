// Concept 2 — In the pit. He sits with what dignity remains: one puppy inside
// his coat, one leaving with his left shoe, one on his head barking directly
// into the future. Colin looks over the fence.
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, rng } from '../lib/core.js';
import { P } from '../lib/palette.js';
import { camera, charScale } from '../lib/cam.js';
import { sky, bareTree, fence, pitInterior } from '../env/garden.js';
import { narrator, SIT } from '../chars/narrator.js';
import { puppy } from '../chars/puppy.js';
import { colinOverFence } from '../chars/colin.js';
import { shoe } from '../props/shoe.js';

export async function build(svg) {
  const defs = el('defs'); svg.appendChild(defs);
  const D = 1.6;
  // cut-away view: camera sits beyond the (removed) near wall, low in the pit
  const cam = camera({ f: 1700, H: -0.8, cx: 820, cy: 566 });
  const root = g({}); svg.appendChild(root);
  const XL = -1.7, XR = 2.3, ZN = 2.4, ZF = 3.8;

  // --- the world above: sky, a tree, the fence, Colin
  root.appendChild(sky(defs, { seed: 8, top: '#c9cbc6', mid: '#d8d5cb', low: '#e1dace' }));
  root.appendChild(g({ filter: blurFilter(defs, 0.9) }, bareTree(defs, { x: 2010, y: -60, h: 420, seed: 14, color: mix(P.treeDark, P.haze, 0.35), spread: 1.3, lean: -118, depth: 7, width: 9 })));
  const zF = ZF + 6.0;
  root.appendChild(fence(defs, cam, { Z: zF, a: -7, b: 7, h: 1.8, seed: 5 }));
  const colin = colinOverFence(defs);
  const zC = zF - 0.2, [ccx, ccy] = cam.p(-0.9, 1.8, zC);
  root.appendChild(colin.root);

  // --- the pit
  const pi = pitInterior(defs, cam, { xl: XL, xr: XR, zn: ZN, zf: ZF, D, seed: 21 });
  root.appendChild(pi.back);
  root.appendChild(el('ellipse', { cx: 1250, cy: 640, rx: 700, ry: 420, fill: radGrad(defs, 0.5, 0.5, 0.5, [[0, '#f3e4c8', 0.16], [1, '#f3e4c8', 0]]) }));
  root.appendChild(el('rect', { x: 0, y: pi.far.y, width: 1920, height: 90, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#0f0a08', 0.35], [1, '#0f0a08', 0]]) }));
  root.appendChild(el('rect', { x: 0, y: pi.far.y, width: 1920, height: pi.far.yb - pi.far.y, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#dfe0d6', 0.1], [0.45, '#dfe0d6', 0], [0.75, '#0f0a08', 0.12], [1, '#0f0a08', 0.3]]) }));
  root.appendChild(el('rect', { x: 0, y: pi.far.yb - 40, width: 1920, height: 48, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#0f0a08', 0], [1, '#0f0a08', 0.6]]) }));

  // --- characters
  const n = narrator(defs, { seed: 17 });
  const Zn = 3.05, [nx, ny] = cam.p(0.92, -D, Zn), ns = charScale(cam, Zn);
  const headPup = puppy(defs, { view: 'side', pose: 'sit', seed: 6, harold: true });
  n.slots.head.appendChild(headPup.root);
  const coatPup = puppy(defs, { view: 'front', pose: 'sit', seed: 2 });
  n.slots.chest.appendChild(coatPup.root);

  const back = g({}), front = g({});
  const mk = (layer, X, Z, view, pose, seed, q = {}) => {
    const p = puppy(defs, { view, pose, seed });
    const [x, y] = cam.p(X, -D, Z), sc = charScale(cam, Z);
    layer.appendChild(el('path', { d: ellipseD(x, y + 1, 36 * sc, 8 * sc), fill: '#0f0a08', opacity: 0.5 }));
    layer.appendChild(p.root);
    return { p, base: { x, y, scale: sc, ...q } };
  };
  const pups = [
    mk(back, -1.5, 3.66, 'side', 'sit', 3, { headRot: -10 }),                     // regards him from a distance
    mk(back, -0.72, 3.62, 'side', 'beg', 7, { headRot: -30, rot: -6, flip: -1 }), // attempting the wall
    mk(back, -0.25, 3.64, 'front', 'sit', 4, { headRot: -8, look: 2.5, lookY: 0.5 }),
    mk(front, -0.5, 2.85, 'side', 'stand', 9, { headRot: 30 }),                  // examining the sock
    mk(back, -1.0, 3.3, 'side', 'sit', 11, { headRot: -18 }),
  ];
  const [bx, by] = cam.p(-1.25, -D, 3.5), bs = cam.s(3.5);
  back.appendChild(g({},
    el('path', { d: ellipseD(bx, by + 2, 0.16 * bs, 0.035 * bs), fill: '#0f0a08', opacity: 0.5 }),
    el('path', { d: `M${bx - 0.14 * bs} ${by - 0.05 * bs} L${bx - 0.11 * bs} ${by} L${bx + 0.11 * bs} ${by} L${bx + 0.14 * bs} ${by - 0.05 * bs}Z`, fill: '#9aa0a2' }),
    el('path', { d: ellipseD(bx, by - 0.05 * bs, 0.14 * bs, 0.03 * bs), fill: '#c3c8c8' }),
    el('path', { d: ellipseD(bx, by - 0.048 * bs, 0.11 * bs, 0.02 * bs), fill: '#6f7a7e' })));
  const [tbx, tby] = cam.p(0.28, -D, 3.35), tbs = cam.s(3.35);
  back.appendChild(g({},
    el('path', { d: ellipseD(tbx, tby, 0.035 * tbs, 0.012 * tbs), fill: '#0f0a08', opacity: 0.5 }),
    el('path', { d: ellipseD(tbx, tby - 0.032 * tbs, 0.034 * tbs, 0.033 * tbs), fill: '#a9a867' }),
    el('path', { d: `M${tbx - 0.03 * tbs} ${tby - 0.045 * tbs} C${tbx - 0.01 * tbs} ${tby - 0.02 * tbs}, ${tbx + 0.01 * tbs} ${tby - 0.02 * tbs}, ${tbx + 0.03 * tbs} ${tby - 0.045 * tbs}`, stroke: '#e6e2cf', 'stroke-width': 1.6, fill: 'none', opacity: 0.8 })));
  root.appendChild(back);
  root.appendChild(n.root);
  const thief = puppy(defs, { view: 'side', pose: 'stand', seed: 5 });
  const [thx, thy] = cam.p(1.62, -D, 2.95), ths = charScale(cam, 2.95);
  const shoeG = g({}, shoe(defs));
  front.appendChild(el('path', { d: ellipseD(thx, thy + 1, 44 * ths, 8 * ths), fill: '#0f0a08', opacity: 0.5 }));
  front.appendChild(thief.root);
  front.appendChild(shoeG);
  root.appendChild(front);
  root.appendChild(pi.rim);

  return {
    update(t) {
      // facing left, so the near foot is his left: shoe gone, sock showing
      n.set({ ...SIT, x: nx, y: ny, scale: ns, lean: -1, head: -1, shoeless: true, flip: -1, tuft: true, brow: 0, browTilt: -2,
        chestPup: true, armN: [-8, -62, -10, 1], armF: [-4, -64, 0, 1] });
      const barking = Math.floor(t * 4) % 3 !== 2;
      headPup.set({ x: 6, y: 12, scale: 0.9, headRot: -40, bark: barking, earRot: 20 });
      coatPup.set({ x: 10, y: 52, scale: 0.9, headRot: -10, look: 2.4, lookY: -1 });
      pups.forEach(({ p, base }, i) => p.set({ ...base, wag: (base.wag || 0) + Math.sin(t * 10 + i * 2) * 12 }));
      thief.set({ x: thx, y: thy, scale: ths, flip: 1, headRot: 4, wag: 30 + Math.sin(t * 12) * 20 });
      shoeG.setAttribute('transform', `translate(${thx + 70 * ths} ${thy - 72 * ths}) rotate(22) scale(${ths * 0.95})`);
      colin.set({ x: ccx, y: ccy, scale: charScale(cam, zC), tilt: 5, look: [4, 4] });
    },
  };
}
