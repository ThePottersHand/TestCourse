// The laminated sign: medium, then close enough to read.
import { el, g, T, mix, blurFilter, linGrad, ellipseD, rng } from '../lib/core.js';
import { kf, wob, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, camera, gardenSet } from './common.js';
import { sign } from '../props/sign.js';
import { tuft } from '../env/garden.js';

function backdrop(defs, root, { f = 1500, H = 1.3, blur = 6 } = {}) {
  const cam = camera({ f, H, cx: 960, cy: 540 });
  const L = gardenSet(defs, cam, { mode: 'overcast', fenceZ: 7.5, pitX: [-3.4, -1.3], pitZ: [2.6, 4.8], D: 1.2, signAt: null, fg: false, seed: 3 });
  const bg = g({ filter: blurFilter(defs, blur) }, L.sky, L.far, L.houses, L.trees, L.bushes, L.fence, L.lawn, L.pit.back, L.pit.rim);
  root.appendChild(bg);
  return { cam, L, bg };
}

// "...and I had been warned about the hole by a laminated sign which said:"
export async function signMed(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  const { cam } = backdrop(defs, world, { blur: 3.5 });
  const Zs = 2.1, [sx, sy] = cam.p(0.35, 0, Zs), ss = cam.s(Zs) / 1000;
  const sg = sign(defs, { seed: 4 });
  const flutter = g({}, sg.root);
  world.appendChild(el('path', { d: ellipseD(sx, sy + 4, 80, 14), fill: '#2f3524', opacity: 0.35, filter: blurFilter(defs, 4) }));
  world.appendChild(g({ transform: `translate(${sx} ${sy}) scale(${ss} ${ss})` }, flutter));
  // a few near grass blades, soft
  const fg = g({ filter: blurFilter(defs, 2) });
  const r = rng(8);
  for (let i = 0; i < 16; i++) fg.appendChild(tuft(r() * 1920, 1075 + r() * 20, 700, 40 + i, mix(P.lawnDark, P.lawnDeep, r()), 9, 0.1));
  world.appendChild(fg);
  return {
    update(t) {
      world.setAttribute('transform', camTransform(sx + 30, sy - 1.25 * cam.s(Zs), kf(t, [[0, 1.0], [ctx.dur, 1.18, 'sine']])));
      flutter.setAttribute('transform', `rotate(${(wob(t, 2, 0.6) * 0.6).toFixed(2)} 0 -1300)`);
    },
  };
}

// "PLEASE DO NOT FALL INTO THE PUPPY PIT."
export async function signClose(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  backdrop(defs, world, { f: 1500, H: 1.3, blur: 16 });
  const sg = sign(defs, { seed: 4 });
  const flutter = g({}, sg.root);
  const k = 3.1; // px per mm
  world.appendChild(g({ transform: `translate(960 ${540 + 1372 * k})` }, g({ transform: `scale(${k})` }, flutter)));
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 545, kf(t, [[0, 1.0], [ctx.dur, 1.05, 'sine']])));
      flutter.setAttribute('transform', `rotate(${(wob(t, 3, 0.5) * 0.35).toFixed(2)} 0 -1300)`);
    },
  };
}
