// "Colin's daughter kept one. She named it Harold. ... but the puppy had already
// accepted the position."
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, rng, lerp } from '../lib/core.js';
import { kf, on2, win, wob, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, camera, charScale, gardenSet, tint, contactShadow } from './common.js';
import { daughter } from '../chars/daughter.js';
import { puppy } from '../chars/puppy.js';
import { foldedBlanket } from '../props/misc.js';

function duskBack(defs, root, { blur = 5, H = 1.1, f = 1400 } = {}) {
  const cam = camera({ f, H, cx: 960, cy: 560 });
  const L = gardenSet(defs, cam, { mode: 'dusk', fenceZ: 7.5, pitX: [-4.5, -2.4], pitZ: [3.4, 5.4], D: 1.6, signAt: null, fg: false, leaves: 30, seed: 8 });
  const bg = g({ filter: blurFilter(defs, blur) }, L.sky, L.far, L.houses, L.trees, L.bushes, L.fence, L.lawn);
  // warm bokeh from lit windows beyond the fence
  const r = rng(31);
  for (let i = 0; i < 9; i++) bg.appendChild(el('circle', { cx: 120 + r() * 1700, cy: 180 + r() * 220, r: 18 + r() * 26, fill: '#f6c37e', opacity: 0.25 + r() * 0.25 }));
  root.appendChild(bg);
  return cam;
}

export async function kept(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  const cam = duskBack(defs, world, { blur: 3 });
  const Zk = 2.6, [kx, ky] = cam.p(0.1, 0, Zk), ks = charScale(cam, Zk);
  world.appendChild(contactShadow(defs, kx, ky, 50 * ks, 'dusk'));
  const kid = daughter(defs, { pose: 'puppy', seed: 82 });
  const hp = puppy(defs, { view: 'front', pose: 'sit', seed: 6, harold: true });
  kid.slot.appendChild(hp.root);
  world.appendChild(kid.root);
  root.appendChild(tint(defs, 'dusk'));
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 520, kf(t, [[0, 1.0], [ctx.dur, 1.04, 'sine']])));
      const tt = on2(t);
      const sway = Math.sin(tt * 3.2) * 2;
      kid.set({ x: kx, y: ky, scale: ks, rot: sway * 0.6, headTilt: -4 + sway, mood: 'grin' });
      hp.set({ x: 0, y: 30, scale: 1.0, headRot: sway * 0.5, look: 0, wag: Math.sin(tt * 8) * 14 });
    },
  };
}

export async function haroldClose(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  duskBack(defs, world, { blur: 12 });
  const kid = daughter(defs, { pose: 'puppy', seed: 82 });
  const hp = puppy(defs, { view: 'front', pose: 'sit', seed: 6, harold: true });
  kid.slot.appendChild(hp.root);
  world.appendChild(kid.root);
  root.appendChild(tint(defs, 'dusk'));
  const tName = ctx.W(35, 'harold') - ctx.shot.start;
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 540, kf(t, [[0, 1.0], [ctx.dur, 1.03, 'sine']])));
      const tt = on2(t);
      kid.set({ x: 950, y: 2230, scale: 4.2, headTilt: -3, mood: 'grin' });
      // on his name: a slow, considered blink
      const blink = tt > tName + 0.1 && tt < tName + 0.55;
      hp.set({ x: 0, y: 30, scale: 1.0, headRot: 0, look: 0, lookY: 0, wag: 0, shine: false, blink });
    },
  };
}

// Harold, in profile, as the narrator sat: upright, unbothered, installed.
export async function accepted(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  duskBack(defs, world, { blur: 14, H: 0.5 });
  world.appendChild(g({ transform: 'translate(960 1120) scale(3.6 2.2)' }, foldedBlanket(defs)));
  const hp = puppy(defs, { view: 'side', pose: 'sit', seed: 6, harold: true });
  world.appendChild(hp.root);
  root.appendChild(tint(defs, 'dusk'));
  const tAcc = ctx.W(36, 'accepted') - ctx.shot.start;
  const tPos = ctx.W(36, 'position') - ctx.shot.start;
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 540, kf(t, [[0, 1.0], [ctx.dur, 1.06, 'sine']])));
      const tt = on2(t);
      const chin = kf(tt, [[tAcc - 0.2, 0], [tAcc + 0.4, 1, 'io']]);
      hp.set({ x: 1010, y: 1050, scale: 5.2, flip: -1, headRot: -4 - chin * 8, blink: tt > tAcc + 0.1 && tt < tPos + 0.2, wag: 0, earRot: 0 });
    },
  };
}
