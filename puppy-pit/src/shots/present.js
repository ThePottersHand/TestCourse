// The present day, golden hour: he visits, very carefully.
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, rng, lerp, clamp } from '../lib/core.js';
import { kf, on2, win, wob, walkLegs, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, camera, charScale, gardenSet, tint, contactShadow, SKY } from './common.js';
import { sky, fence, tuft } from '../env/garden.js';
import { narrator, STAND } from '../chars/narrator.js';
import { puppy } from '../chars/puppy.js';
import { sign } from '../props/sign.js';

const CAM = { f: 1600, H: 2.5, cx: 960, cy: 150 };
const PIT = { pitX: [-2.1, 0.0], pitZ: [4.4, 6.6], D: 0.85 };
// eight puppies on the visible strip of floor, looking up at him (Harold has left)
const EIGHT = [
  [-1.78, 6.5, 'side', 'sit', -26], [-1.36, 6.52, 'side', 'stand', -30], [-0.98, 6.46, 'front', 'sit', -14],
  [-0.62, 6.5, 'side', 'sit', -20], [-0.3, 6.42, 'side', 'sit', -38], [-1.55, 6.2, 'side', 'sit', -34],
  [-1.08, 6.14, 'front', 'sit', -18], [-0.25, 5.98, 'side', 'sit', -46],
];

function presentWide(svg, { zoomFrom = 1, zoomTo = 1.06, focus = [900, 620] } = {}) {
  const { defs, root } = stage(svg);
  const cam = camera(CAM);
  const L = gardenSet(defs, cam, { mode: 'golden', cordonOn: true, ...PIT, signAt: [1.45, 5.35], seed: 2 });
  const world = g({});
  root.appendChild(world);
  world.append(L.sky, L.far, L.houses, L.trees, L.bushes, L.fence, L.lawn, L.cordonBack, L.cordonLeft, L.pit.back);
  const pupsG = g({ 'clip-path': L.pit.openClip });
  const pups = EIGHT.sort((a, b) => b[1] - a[1]).map(([X, Z, view, pose, hr], k) => {
    const p = puppy(defs, { view, pose, seed: 20 + k });
    const [x, y] = cam.p(X, -PIT.D, Z), sc = charScale(cam, Z) * 1.1;
    pupsG.appendChild(el('path', { d: ellipseD(x, y, 34 * sc, 7 * sc), fill: '#160f0b', opacity: 0.6 }));
    pupsG.appendChild(p.root);
    return { p, base: view === 'front' ? { x, y, scale: sc, headRot: hr, look: 2.6, lookY: -2.2, headX: 3 } : { x, y, scale: sc, headRot: hr } };
  });
  world.append(pupsG, L.pit.rim, L.cordonSide, L.sign);
  const actor = g({});
  world.appendChild(actor);
  world.appendChild(L.fg);
  root.appendChild(tint(defs, 'golden', { sun: [-200, 120] }));
  return { defs, root, world, cam, L, pups, actor };
}

// Title over black, then the present day: he stands at the pit like a man at a graveside.
export async function open(svg, ctx) {
  const S = presentWide(svg);
  const { defs, root, world, cam, pups, actor } = S;
  const Zn = 5.3, [nx, ny] = cam.p(2.15, 0, Zn), ns = charScale(cam, Zn);
  actor.appendChild(contactShadow(defs, nx - 4, ny, 70 * ns, 'golden', 3.2));
  const n = narrator(defs, { seed: 17 });
  actor.appendChild(n.root);
  const black = el('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#060403' });
  const title = el('text', { x: 960, y: 552, 'text-anchor': 'middle', 'font-family': 'EB Garamond', 'font-style': 'italic', 'font-size': 64, fill: '#e9dfcb', 'letter-spacing': '1' }, document.createTextNode('The Puppy Pit'));
  root.append(black, title);
  return {
    update(t) {
      title.setAttribute('opacity', kf(t, [[0.35, 0], [1.2, 1, 'sine'], [2.2, 1], [2.8, 0, 'sine']]));
      black.setAttribute('opacity', kf(t, [[2.4, 1], [3.7, 0, 'sine']]));
      const z = kf(t, [[2.4, 1.0], [ctx.dur, 1.065, 'sine']]);
      world.setAttribute('transform', camTransform(lerp(960, 1000, (z - 1) / 0.065), lerp(540, 560, (z - 1) / 0.065), z));
      const tt = on2(t);
      const br = wob(t, 3, 0.35);
      n.set({ x: nx, y: ny, scale: ns, flip: -1, lean: 12 + br * 0.4, head: 16 + wob(t, 5, 0.2) * 1.5, armsBehind: true,
        armN: [14, 26, -30, 0.35], armF: [10, 26, -20, 0.35], eyes: (t % 4.3) > 4.15 ? 'closed' : 'open' });
      pups.forEach(({ p, base }, i) => p.set({ ...base, wag: Math.sin(tt * 4 + i) * 10 }));
    },
  };
}

// "I still visit them sometimes. I stand beside the sign now, very carefully,"
export async function visit(svg, ctx) {
  const S = presentWide(svg);
  const { defs, world, cam, pups, actor } = S;
  const Zn = 5.3, ns = charScale(cam, Zn);
  const X0 = 3.9, X1 = 2.15;
  const shadow = g({}); actor.appendChild(shadow);
  const n = narrator(defs, { seed: 17 });
  actor.appendChild(n.root);
  const tArrive = ctx.W(37, 'sometimes') - ctx.shot.start + 0.2;
  const tCare = ctx.W(38, 'carefully') - ctx.shot.start - 0.25;
  const walkStart = 0.2;
  return {
    update(t) {
      world.setAttribute('transform', camTransform(1000, 560, kf(t, [[0, 1.02], [ctx.dur, 1.07, 'sine']])));
      const tt = on2(t);
      // slow walk in from the right; distance per stride ~0.55 m
      const u = kf(tt, [[walkStart, 0], [tArrive, 1, 'out']]);
      let X = lerp(X0, X1, u);
      const walking = tt > walkStart && tt < tArrive - 0.1;
      const phase = ((X0 - X) / 0.55) % 1;
      const w = walking ? walkLegs(phase, 13) : { thighN: 3, shinN: -2, footN: -1, thighF: -3, shinF: 2, footF: 1, bob: 0 };
      // "very carefully": a small shuffle back from the edge, a glance at his feet
      const back = kf(tt, [[tCare, 0], [tCare + 0.5, 0.08, 'io']]);
      X += back;
      const glance = kf(tt, [[tCare - 0.3, 0], [tCare, 1, 'io'], [tCare + 0.9, 1], [tCare + 1.3, 0, 'io']]);
      const shuffle = tt > tCare && tt < tCare + 0.5 ? Math.sin((tt - tCare) / 0.5 * Math.PI) : 0;
      const [x, y] = cam.p(X, 0, Zn);
      shadow.replaceChildren(contactShadow(defs, x - 4, y, 70 * ns, 'golden', 3.2));
      n.set({ x, y: y + w.bob * ns, scale: ns, flip: -1, lean: 10 + (walking ? 2 : 0), head: 10 + glance * 16, armsBehind: true,
        armN: [14, 26, -30, 0.35], armF: [10, 26, -20, 0.35],
        thighN: w.thighN + shuffle * 10, shinN: w.shinN + shuffle * 16, footN: w.footN, thighF: w.thighF, shinF: w.shinF, footF: w.footF });
      pups.forEach(({ p, base }, i) => p.set({ ...base, wag: Math.sin(tt * 6 + i) * 14 }));
    },
  };
}

// "Not affection." — from the bottom of the pit, looking up at him against the evening sky
export async function notAffection(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  world.appendChild(sky(defs, { seed: 21, top: '#a99f94', mid: '#dcc096', low: '#f1cf98', clouds: true }));
  const rimY = 760;
  const sg = sign(defs, { seed: 4, back: true });
  const signG = g({ transform: `translate(780 ${rimY + 170}) scale(0.4 0.4) skewY(3)` }, sg.root);
  const n = narrator(defs, { seed: 17 });
  // pit walls around the opening: the wall below him rises to the rim; side walls lean in
  const r = rng(5), fr = [];
  for (let x = 180; x < 1760; x += 3 + r() * 4) {
    const h = 16 + r() * 44, lean = (r() - 0.5) * 26;
    fr.push(`M${(x - 3).toFixed(1)} ${rimY} Q${(x + lean * 0.4).toFixed(1)} ${rimY - h * 0.6} ${(x + lean).toFixed(1)} ${rimY - h} Q${(x + lean * 0.4 + 3).toFixed(1)} ${rimY - h * 0.5} ${(x + 3).toFixed(1)} ${rimY}Z`);
  }
  const wallTex = el('filter', { id: 'naTex', x: 0, y: 0, width: 1, height: 1 },
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.02 0.08', numOctaves: 3, seed: 4, result: 'n' }),
    el('feColorMatrix', { in: 'n', type: 'matrix', values: '0.5 0 0 0 0.25 0.5 0 0 0 0.25 0.5 0 0 0 0.25 0 0 0 0 1', result: 'm' }),
    el('feBlend', { in: 'm', in2: 'SourceGraphic', mode: 'soft-light', result: 'b' }),
    el('feComposite', { in: 'b', in2: 'SourceGraphic', operator: 'in' }));
  defs.appendChild(wallTex);
  const walls = g({ filter: 'url(#naTex)' },
    el('path', { d: `M180 ${rimY} L1760 ${rimY} L2100 1200 L-180 1200Z`, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#3f3024'], [0.3, '#2a2019'], [1, '#110c08']]) }),
    el('path', { d: `M-200 -100 L180 ${rimY} L-180 1200 L-400 1200Z`, fill: linGrad(defs, 1, 0, 0, 0, [[0, '#3b2d22'], [1, '#120d09']]) }),
    el('path', { d: `M2120 -100 L1760 ${rimY} L2100 1200 L2320 1200Z`, fill: linGrad(defs, 0, 0, 1, 0, [[0, '#4a3828'], [1, '#1a130d']]) }));
  const rimEdge = g({}, el('path', { d: fr.join(''), fill: '#3f4628' }),
    el('path', { d: `M178 ${rimY - 3} L1762 ${rimY - 3} L1762 ${rimY + 6} L178 ${rimY + 6}Z`, fill: '#2b2a1b' }),
    el('path', { d: `M-200 -100 L180 ${rimY} M2120 -100 L1760 ${rimY}`, stroke: '#3f4628', 'stroke-width': 10, opacity: 0.9 }));
  world.append(signG, g({}, n.root), walls, rimEdge);
  root.appendChild(tint(defs, 'golden', { sun: [300, 150] }));
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 560, kf(t, [[0, 1.0], [ctx.dur, 1.035, 'sine']])));
      n.set({ x: 1150, y: rimY + 270, scale: 0.95, flip: -1, lean: 20, head: 30, armsBehind: true,
        armN: [14, 26, -30, 0.35], armF: [10, 26, -20, 0.35], eyes: 'open', brow: -1 });
    },
  };
}
