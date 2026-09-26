// Colin, over the fence, seen from the bottom of the pit. With tea.
import { el, g, T, mix, blurFilter, linGrad, ellipseD, rng, lerp } from '../lib/core.js';
import { kf, on2, win, wob, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, SKY } from './common.js';
import { sky, bareTree } from '../env/garden.js';
import { colinOverFence } from '../chars/colin.js';

function set(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  world.appendChild(sky(defs, { seed: 41, ...SKY.overcast }));
  world.appendChild(g({ filter: blurFilter(defs, 1.5) }, bareTree(defs, { x: 1650, y: 900, h: 1500, seed: 22, color: mix(P.treeDark, P.haze, 0.45), spread: 1.1, lean: -8, depth: 8 })));
  // the top of the fence, looking up at it: boards, capping rail, posts
  const fTop = 520, fBot = 1200;
  const r = rng(9);
  const boards = g({});
  boards.appendChild(el('rect', { x: -200, y: fTop, width: 2400, height: fBot - fTop, fill: P.woodDeep }));
  for (let x = -200; x < 2200; x += 58) {
    const tone = r();
    const c = tone < 0.15 ? P.woodDark : tone > 0.85 ? P.woodLight : mix(P.wood, P.woodLight, r() * 0.4);
    boards.appendChild(el('rect', { x, y: fTop + (r() - 0.5) * 3, width: 60, height: fBot - fTop, fill: c }));
    boards.appendChild(el('rect', { x: x + 52, y: fTop, width: 7, height: fBot - fTop, fill: P.woodDeep, opacity: 0.45 }));
  }
  const tex = el('filter', { id: 'cfTex' + ctx.shot.id, x: 0, y: 0, width: 1, height: 1 },
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.14 0.008', numOctaves: 3, seed: 3, result: 'n' }),
    el('feColorMatrix', { in: 'n', type: 'matrix', values: '0.6 0 0 0 0.2 0.6 0 0 0 0.2 0.6 0 0 0 0.2 0 0 0 0 1', result: 'm' }),
    el('feBlend', { in: 'm', in2: 'SourceGraphic', mode: 'soft-light', result: 'b' }),
    el('feComposite', { in: 'b', in2: 'SourceGraphic', operator: 'in' }));
  defs.appendChild(tex);
  const fence = g({ filter: `url(#cfTex${ctx.shot.id})` }, boards,
    el('rect', { x: -200, y: fTop - 22, width: 2400, height: 30, fill: P.woodDark }),
    el('rect', { x: -200, y: fTop + 8, width: 2400, height: 26, fill: P.woodDeep, opacity: 0.35 }),
    ...[180, 900, 1620].map(x => el('rect', { x: x - 30, y: fTop - 60, width: 60, height: fBot, fill: P.post })));
  // Colin: behind the fence, clipped at the top rail so he rises from behind it
  const colin = colinOverFence(defs);
  const clipId = 'cfClip' + ctx.shot.id;
  defs.appendChild(el('clipPath', { id: clipId }, el('rect', { x: -500, y: -500, width: 3000, height: fTop + 514 })));
  const colG = g({ 'clip-path': `url(#${clipId})` }, colin.root);
  world.append(fence, colG);
  // the rim of the pit along the bottom edge, from below
  const rimY = 930;
  const fr = [];
  for (let x = -300; x < 2200; x += 3 + r() * 4) {
    const h = 20 + r() * 50, lean = (r() - 0.5) * 28;
    fr.push(`M${(x - 3).toFixed(1)} ${rimY} Q${(x + lean * 0.4).toFixed(1)} ${rimY - h * 0.6} ${(x + lean).toFixed(1)} ${rimY - h} Q${(x + lean * 0.4 + 3).toFixed(1)} ${rimY - h * 0.5} ${(x + 3).toFixed(1)} ${rimY}Z`);
  }
  world.append(el('rect', { x: -300, y: rimY - 4, width: 2600, height: 600, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#3b3526'], [0.2, '#2a2019'], [1, '#140f0b']]) }),
    el('path', { d: fr.join(''), fill: '#3f4628' }));
  return { defs, root, world, colin, fTop };
}

function mouthOn(tt, words) { return words.some(([a, b]) => tt >= a && tt < b) && Math.sin(tt * 24) > -0.2; }
function wordsOf(ctx, line, list) { return list.map(w => [ctx.W(line, w) - ctx.shot.start, ctx.W(line, w, 'e') - ctx.shot.start + 0.05]); }

// "My neighbor, Colin, looked over the fence and said, 'Are you all right?'"
export async function colinOver(svg, ctx) {
  const S = set(svg, ctx);
  const { world, colin, fTop } = S;
  const tUp = ctx.W(18, 'looked') - ctx.shot.start - 0.1;
  const talk = wordsOf(ctx, 18, ['are', 'you', 'all', 'right']);
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 540, kf(t, [[0, 1.0], [ctx.dur, 1.04, 'sine']])));
      const tt = on2(t);
      const rise = kf(tt, [[tUp, 0], [tUp + 0.9, 1, 'out']]);
      colin.set({ x: 960, y: fTop - 10 + (1 - rise) * 420, scale: 1.9, tilt: rise > 0.9 ? -3 : 0, look: [0, 3], talk: mouthOn(tt, talk), tea: true });
    },
  };
}

// "He said, 'Yes, I can see that.' Then he went inside to get his phone."
export async function colinSee(svg, ctx) {
  const S = set(svg, ctx);
  const { world, colin, fTop } = S;
  const talk = wordsOf(ctx, 20, ['yes', 'i', 'can', 'see', 'that']);
  const tSip = ctx.W(20, 'that', 'e') - ctx.shot.start + 0.4;
  const tGo = ctx.W(21, 'went') - ctx.shot.start;
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 540, kf(t, [[0, 1.04], [ctx.dur, 1.07, 'sine']])));
      const tt = on2(t);
      const sink = kf(tt, [[tGo, 0], [tGo + 0.8, 1, 'in']]);
      const sip = kf(tt, [[tSip, 0], [tSip + 0.35, 1, 'io'], [tSip + 1.0, 1], [tSip + 1.35, 0, 'io']]);
      colin.set({ x: 960, y: fTop - 10 + sink * 440, scale: 1.9, tilt: -3 + sip * 4, look: [0, 3 - sip * 3], talk: mouthOn(tt, talk), tea: true, sip });
    },
  };
}

// "His phone." He comes back, phone first. Three pictures (the flash goes off
// in our eyes: this is the view from the bottom of the pit), a look at the
// screen, a small nod of satisfaction, and he goes back inside.
export async function colinPhone(svg, ctx) {
  const S = set(svg, ctx);
  const { root, world, colin, fTop } = S;
  const white = el('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#fffaf0', opacity: 0, style: 'mix-blend-mode:screen' });
  root.appendChild(white);
  const tUp = ctx.W(24, 'his') - ctx.shot.start - 0.12;
  const shots = [ctx.W(24, 'phone', 'e') - ctx.shot.start - 0.1, 1.12, 1.46];
  const tCheck = 1.75, tNod = 2.25, tGo = 2.7;
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 540, kf(t, [[0, 1.04], [ctx.dur, 1.07, 'sine']])));
      const tt = on2(t);
      const rise = kf(tt, [[tUp, 0], [tUp + 0.35, 1, 'out']]);
      const sink = kf(tt, [[tGo, 0], [tGo + 0.6, 1, 'in']]);
      // flash: one drawing at full, one fading
      const fl = Math.max(...shots.map(a => (tt >= a && tt < a + 0.09 ? 1 : tt >= a + 0.09 && tt < a + 0.17 ? 0.35 : 0)));
      white.setAttribute('opacity', (fl * 0.55).toFixed(3));
      // after the burst he lowers it to look at the screen, then a little nod
      const check = kf(tt, [[tCheck - 0.2, 0], [tCheck, 1, 'io']]);
      const nod = tt > tNod && tt < tNod + 0.4 ? Math.sin((tt - tNod) / 0.4 * Math.PI) * 4 : 0;
      const jolt = shots.some(a => tt >= a && tt < a + 0.09) ? 1.5 : 0;
      colin.set({ x: 960, y: fTop - 10 + (1 - rise) * 440 + sink * 460, scale: 1.9, phone: true, flash: fl,
        phoneY: check * 22 + jolt, phoneTilt: check * -6, tilt: -2 + check * 2, dip: check * 6 + nod, look: [0, 2 + check * 4] });
    },
  };
}
