// "I thought, 'Well, that seems oddly specific.' Then I stepped backward."
// The concept frame, animated: he reads, one eyebrow goes up, he steps back,
// and topples out of the picture like a felled tree. The picture holds.
import { el, g, T, mix, blurFilter, linGrad, ellipseD, rng, clamp } from '../lib/core.js';
import { kf, on2, win, wob, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, camera, charScale, gardenSet, contactShadow } from './common.js';
import { narrator } from '../chars/narrator.js';
import { puppy } from '../chars/puppy.js';

const NINE = [
  [-1.78, 6.5, 'side', 'sit', -26, { s: 0.95 }],
  [-1.36, 6.52, 'side', 'stand', -30, { s: 1.0, wag: 14 }],
  [-0.98, 6.46, 'front', 'sit', -14, { s: 0.96, look: 2.6, lookY: -2.2, headX: 3 }],
  [-0.62, 6.5, 'side', 'beg', -16, { s: 1.02 }],
  [-0.3, 6.42, 'side', 'sit', -38, { s: 0.98 }],
  [-1.55, 6.2, 'side', 'sit', -34, { s: 1.04 }],
  [-1.08, 6.14, 'side', 'sit', -30, { s: 1.0 }],
  [-0.62, 6.08, 'front', 'sit', -18, { s: 1.03, look: 2.6, lookY: -2.4, headX: 3 }],
  [-0.2, 5.98, 'side', 'sit', -46, { s: 1.06, harold: true }],
];

export async function reading(svg, ctx) {
  const { defs, root } = stage(svg);
  const cam = camera({ f: 1600, H: 2.5, cx: 960, cy: 150 });
  const PIT = { pitX: [-2.1, 0.0], pitZ: [4.4, 6.6], D: 0.85 };
  const L = gardenSet(defs, cam, { mode: 'overcast', ...PIT, signAt: [1.45, 5.35], seed: 1 });
  const world = g({}); root.appendChild(world);
  world.append(L.sky, L.far, L.houses, L.trees, L.bushes, L.fence, L.lawn, L.pit.back);
  const pupsG = g({ 'clip-path': L.pit.openClip });
  const pups = [...NINE].sort((a, b) => b[1] - a[1]).map(([X, Z, view, pose, hr, ex], k) => {
    const { s = 1, harold = false, ...rest } = ex;
    const p = puppy(defs, { view, pose, seed: k + 1, harold });
    const [x, y] = cam.p(X, -PIT.D, Z), sc = charScale(cam, Z) * 1.1 * s;
    pupsG.appendChild(el('path', { d: ellipseD(x, y, 34 * sc, 7 * sc), fill: '#160f0b', opacity: 0.6 }));
    pupsG.appendChild(p.root);
    return { p, view, base: { x, y, scale: sc, headRot: hr, ...rest } };
  });
  world.append(pupsG, L.pit.rim, L.sign);
  const Zn = 5.4, [nx, ny] = cam.p(0.12, 0, Zn), ns = charScale(cam, Zn);
  const shadow = contactShadow(defs, nx + 10, ny, 95 * ns, 'overcast');
  world.appendChild(shadow);
  const n = narrator(defs, { seed: 17 });
  // the fall happens inside this group: pivot at the back heel, clipped by the near rim
  const [, nearY] = cam.p(0, 0, PIT.pitZ[0]);
  const clip = el('clipPath', { id: 'readClip' }, el('rect', { x: -500, y: -500, width: 3000, height: nearY + 500 }));
  defs.appendChild(clip);
  const fallG = g({}, n.root);
  world.append(g({ 'clip-path': 'url(#readClip)' }, fallG), L.fg);

  const tWell = ctx.W(7, 'well') - ctx.shot.start;
  const tOddly = ctx.W(7, 'oddly') - ctx.shot.start;
  const tStep = ctx.W(8, 'stepped') - ctx.shot.start;
  const tBack = ctx.W(8, 'backward') - ctx.shot.start + 0.12;
  const heel = [nx - 26 * ns, ny];
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 560, kf(t, [[0, 1.0], [ctx.dur, 1.025, 'sine']])));
      const tt = on2(t);
      // reading: slight nods, eyebrow on "oddly specific"
      const brow = kf(tt, [[tOddly - 0.1, 0], [tOddly + 0.15, 6, 'out'], [tOddly + 1.9, 6], [tStep - 0.5, 1, 'io']]);
      const tilt = kf(tt, [[tWell - 0.1, 0], [tWell + 0.3, -3, 'out'], [tOddly, -3], [tOddly + 0.4, 2, 'io'], [tStep - 0.6, 0, 'io']]);
      const lean = kf(tt, [[0, 12], [tStep - 0.8, 12], [tStep - 0.2, 7, 'io']]);
      // the step: near foot goes back over the edge
      const stepU = kf(tt, [[tStep, 0], [tBack, 1, 'io']]);
      const thighN = 3 + stepU * 22, shinN = -2 + stepU * 10;
      // topple backwards about the heel, then drop
      const fall = win(tt, tBack, tBack + 0.42);
      const rot = -Math.pow(fall, 2.2) * 84;
      const drop = Math.pow(win(tt, tBack + 0.18, tBack + 0.7), 2) * 900 * ns;
      fallG.setAttribute('transform', `translate(${heel[0]} ${heel[1] + drop}) rotate(${rot}) translate(${-heel[0]} ${-heel[1]})`);
      const arms = fall > 0 ? { armN: [-40 * fall, -30 * fall, 0, 1], armF: [-30 * fall, -20 * fall, 0, 1], armsBehind: false }
        : { armN: [14, 26, -30, 0.35], armF: [10, 26, -20, 0.35], armsBehind: true };
      n.set({ x: nx, y: ny, scale: ns, lean, head: 9 + tilt, glasses: true, brow, browTilt: -5, thighN, shinN, ...arms,
        eyes: (fall > 0.2 && fall < 0.9) ? 'closed' : 'open' });
      shadow.setAttribute('opacity', 1 - fall);
      // puppies watch; when he goes, they bounce and crane toward the near side
      const alarm = win(tt, tBack + 0.2, tBack + 0.5);
      pups.forEach(({ p, view, base }, i) => {
        const hop = alarm * Math.max(0, Math.sin((tt - tBack) * 14 + i * 1.3)) * 6 * (1 - win(tt, tBack + 1.2, tBack + 1.8));
        const q = { ...base, y: base.y - hop, wag: (base.wag || 0) + Math.sin(tt * 9 + i) * (8 + alarm * 18) };
        if (view === 'side') q.headRot = base.headRot + alarm * 30;
        else { q.look = base.look * (1 - alarm) - alarm * 1.5; q.lookY = base.lookY * (1 - alarm) + alarm * 2.5; }
        p.set(q);
      });
    },
  };
}
