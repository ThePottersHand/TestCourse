// "I shouted for help." — outside, at ground level. The garden is quiet; the top
// of an old man's head and a barking puppy are all that show above the lawn.
import { el, g, T, mix, blurFilter, linGrad, ellipseD, rng, lerp } from '../lib/core.js';
import { kf, on2, win, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, camera, charScale, gardenSet } from './common.js';
import { narrator, STAND } from '../chars/narrator.js';
import { puppy } from '../chars/puppy.js';
import { tuft } from '../env/garden.js';

export async function help(svg, ctx) {
  const { defs, root } = stage(svg);
  const cam = camera({ f: 2200, H: 0.42, cx: 960, cy: 500 });
  const pitX = [-1.0, 1.1], pitZ = [4.2, 6.4];
  const L = gardenSet(defs, cam, { mode: 'overcast', fenceZ: 9.5, housesZ: 70, pitX, pitZ, D: 1.6, signAt: [1.75, 5.2], signScaleX: 0.7, signSkew: -3, fg: false, leaves: 30, seed: 4 });
  const world = g({}); root.appendChild(world);
  world.append(L.sky, L.far, L.houses, L.trees, L.bushes, L.fence, L.lawn, L.pit.back, L.pit.rim);
  const Zn = 5.2, ns = charScale(cam, Zn);
  const [nx, ny] = cam.p(0.25, -1.6, Zn);
  const n = narrator(defs, { seed: 17 });
  const hp = puppy(defs, { view: 'side', pose: 'sit', seed: 6, harold: true });
  n.slots.head.appendChild(hp.root);
  world.appendChild(n.root);
  // the near lip of the hole hides everything of him below the lawn
  const [, nearY] = cam.p(0, 0, pitZ[0]);
  const near = g({},
    el('rect', { x: -1200, y: nearY - 1, width: 4400, height: 1400, fill: linGrad(defs, 0, 0, 0, 1, [[0, P.lawn], [1, P.lawnDark]]) }),
    el('rect', { x: -1200, y: nearY - 1, width: 4400, height: 6, fill: '#4f5a3b' }));
  const r = rng(4);
  for (let i = 0; i < 40; i++) near.appendChild(tuft(-100 + r() * 2200, nearY + 2 + r() * 360, cam.s(cam.zAt(nearY + 30)) * (0.5 + r() * 0.4), 60 + i, mix(P.lawnDark, P.lawn, r() * 0.6), 9, 0.07));
  world.appendChild(near);
  world.appendChild(L.sign);
  const words = ['shouted', 'for', 'help'].map(w => [ctx.W(17, w) - ctx.shot.start, ctx.W(17, w, 'e') - ctx.shot.start]);
  return {
    update(t) {
      world.setAttribute('transform', camTransform(1000, 520, kf(t, [[0, 1.0], [ctx.dur, 1.03, 'sine']])));
      const tt = on2(t);
      const shouting = words.some(([a, b]) => tt >= a - 0.05 && tt < b + 0.1);
      const phase = Math.sin(tt * 22) > 0 ? 1 : 0.5;
      n.set({ ...STAND, x: nx, y: ny, scale: ns, flip: -1, lean: 2, head: shouting ? -14 : -6, talk: shouting ? phase : 0, tuft: true, brow: 3 });
      const bark = Math.floor(tt * 5) % 2 === 0;
      hp.set({ x: 4, y: 12, scale: 0.95, flip: 1, headRot: -40, bark, earRot: bark ? 16 : 6, wag: Math.sin(tt * 10) * 12 });
    },
  };
}
