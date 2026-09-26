// "I was missing one shoe, three buttons, and every shred of authority I had
// built over seventy-two years." — standing on the lawn at dusk, facing us.
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, rng, lerp } from '../lib/core.js';
import { kf, on2, win, wob, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, camera, charScale, gardenSet, tint, contactShadow } from './common.js';
import { narratorFront } from '../chars/narrator.js';
import { ladder } from '../props/misc.js';

function duskGarden(defs, root, cam, { blur = 0 } = {}) {
  const pitX = [-3.3, -1.2], pitZ = [5.0, 7.0];
  const L = gardenSet(defs, cam, { mode: 'dusk', fenceZ: 10.5, pitX, pitZ, D: 1.6, signAt: [1.8, 5.3], signYaw: 80, fg: false, leaves: 40, seed: 6 });
  const bg = g(blur ? { filter: blurFilter(defs, blur) } : {}, L.sky, L.far, L.houses, L.trees, L.bushes, L.fence, L.lawn, L.pit.back, L.pit.rim);
  // the ladder left standing in the hole, top poking out
  const [lx, ly] = cam.p(-1.65, -1.6, 6.5), ls = charScale(cam, 6.5);
  bg.appendChild(g({ transform: `translate(${lx} ${ly}) rotate(-18) scale(${ls})` }, ladder(defs, { len: 2.6 })));
  bg.appendChild(L.sign);
  root.appendChild(bg);
  return L;
}

export async function portrait(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  const cam = camera({ f: 1500, H: 1.35, cx: 960, cy: 540 });
  duskGarden(defs, world, cam);
  const Zn = 4.2, [nx, ny] = cam.p(0, 0, Zn), ns = charScale(cam, Zn);
  world.appendChild(contactShadow(defs, nx, ny, 60 * ns, 'dusk'));
  const n = narratorFront(defs, { seed: 75 });
  world.appendChild(n.root);
  root.appendChild(tint(defs, 'dusk'));
  const tBlink = ctx.W(32, 'authority') - ctx.shot.start;
  return {
    update(t) {
      const u = win(t, 0, ctx.dur);
      world.setAttribute('transform', camTransform(960, lerp(560, 470, u), kf(t, [[0, 1.0], [ctx.dur, 1.14, 'sine']])));
      const tt = on2(t);
      const breath = wob(t, 4, 0.3) * 0.5;
      n.set({ x: nx, y: ny, scale: ns, blanket: true, shoeless: true, nButtons: 2, tuft: true, sway: breath * 0.3,
        blink: tt > tBlink && tt < tBlink + 0.15, brow: 0 });
    },
  };
}

// "I objected,"
export async function object(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  const cam = camera({ f: 1500, H: 1.35, cx: 960, cy: 540 });
  duskGarden(defs, world, cam, { blur: 9 });
  const n = narratorFront(defs, { seed: 75 });
  world.appendChild(n.root);
  root.appendChild(tint(defs, 'dusk'));
  const tObj = ctx.W(36, 'objected') - ctx.shot.start;
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 540, 1.0));
      const tt = on2(t);
      const fr = kf(tt, [[tObj - 0.1, 0], [tObj + 0.2, 1, 'out']]);
      n.set({ x: 960, y: 2480, scale: 3.1, blanket: true, shoeless: true, nButtons: 2, tuft: true, frown: fr, brow: -2 * fr, point: tt > tObj + 0.1,
        talk: tt > tObj - 0.25 && tt < tObj + 0.45 && Math.sin(tt * 24) > 0 ? 1 : 0 });
    },
  };
}
