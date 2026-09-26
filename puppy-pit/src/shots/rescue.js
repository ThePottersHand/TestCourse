// "Eventually, Colin returned with a ladder, a blanket, and his daughter, who
// said I was 'the funniest thing she'd ever seen.'" — dusk, from the pit.
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, rng, lerp } from '../lib/core.js';
import { kf, on2, win, wob, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, SKY, tint } from './common.js';
import { sky, bareTree } from '../env/garden.js';
import { colinOverFence } from '../chars/colin.js';
import { daughter } from '../chars/daughter.js';
import { ladder, foldedBlanket } from '../props/misc.js';

export async function rescue(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  world.appendChild(sky(defs, { seed: 44, ...SKY.dusk }));
  world.appendChild(g({ filter: blurFilter(defs, 1.6) }, bareTree(defs, { x: 1780, y: 1000, h: 1600, seed: 23, color: '#4a4c57', spread: 1.1, lean: -10, depth: 8 })));
  // a streetlamp's glow somewhere beyond
  world.appendChild(el('ellipse', { cx: 300, cy: 420, rx: 420, ry: 300, fill: radGrad(defs, 0.5, 0.5, 0.5, [[0, '#f6c37e', 0.35], [1, '#f6c37e', 0]]) }));
  const rimY = 700;
  const clipId = 'rsClip';
  defs.appendChild(el('clipPath', { id: clipId }, el('rect', { x: -500, y: -600, width: 3000, height: rimY + 600 })));
  // Colin kneels at the edge; the blanket over his shoulder
  const colin = colinOverFence(defs, { seed: 64 });
  const blanket = g({ transform: 'translate(-80 -40) rotate(-12) scale(1.05)' }, foldedBlanket(defs));
  colin.root.appendChild(blanket);
  const kid = daughter(defs, { pose: 'phone' });
  const people = g({ 'clip-path': `url(#${clipId})` }, colin.root, kid.root);
  // the ladder slides down past the rim, leaning
  const lad = ladder(defs, { len: 3.0 });
  const ladG = g({}, lad);
  world.append(people, ladG);
  // the pit wall below the rim (we are at the bottom looking up)
  const r = rng(12), fr = [];
  for (let x = -300; x < 2200; x += 3 + r() * 4) {
    const h = 20 + r() * 52, lean = (r() - 0.5) * 28;
    fr.push(`M${(x - 3).toFixed(1)} ${rimY} Q${(x + lean * 0.4).toFixed(1)} ${rimY - h * 0.6} ${(x + lean).toFixed(1)} ${rimY - h} Q${(x + lean * 0.4 + 3).toFixed(1)} ${rimY - h * 0.5} ${(x + 3).toFixed(1)} ${rimY}Z`);
  }
  const roots = [];
  for (let i = 0; i < 30; i++) { const x = r() * 1920; let d = `M${x} ${rimY + 30}`, cx = x, cy = rimY + 30; for (let k = 0; k < 4; k++) { cx += (r() - 0.5) * 20; cy += 20 + r() * 30; d += ` L${cx.toFixed(0)} ${cy.toFixed(0)}`; } roots.push(d); }
  world.append(
    el('rect', { x: -300, y: rimY - 3, width: 2600, height: 700, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#353123'], [0.12, '#3f3125'], [1, '#150f0b']]) }),
    el('path', { d: roots.join(''), stroke: '#6b5b47', 'stroke-width': 2, fill: 'none', opacity: 0.6 }),
    el('path', { d: fr.join(''), fill: '#394026' }));
  // the ladder is in front of the wall once it's down
  const ladFront = g({});
  world.appendChild(ladFront);
  root.appendChild(tint(defs, 'dusk'));
  const tLadder = ctx.W(27, 'ladder') - ctx.shot.start - 0.1;
  const tColin = ctx.W(27, 'blanket') - ctx.shot.start - 0.35;
  const tKid = ctx.W(27, 'daughter') - ctx.shot.start - 0.15;
  const tLaugh = ctx.W(28, 'funniest') - ctx.shot.start;
  return {
    update(t) {
      world.setAttribute('transform', camTransform(960, 540, kf(t, [[0, 1.0], [ctx.dur, 1.05, 'sine']])));
      const tt = on2(t);
      // ladder: slides in diagonally from top left and settles against the wall
      const lu = kf(tt, [[tLadder, 0], [tLadder + 0.5, 1, 'out']]);
      const bounce = lu >= 1 ? Math.max(0, Math.sin((tt - tLadder - 0.5) * 18)) * 10 * Math.exp(-(tt - tLadder - 0.5) * 6) : 0;
      if (lu > 0) {
        if (ladG.parentNode !== ladFront) ladFront.appendChild(ladG);
        ladG.setAttribute('transform', `translate(${lerp(-200, 470, lu)} ${lerp(-300, 1460, lu) - bounce}) rotate(${lerp(-40, -14, lu)}) scale(0.9)`);
        ladG.style.display = '';
      } else ladG.style.display = 'none';
      // Colin rises into view at the edge
      const cu = kf(tt, [[tColin, 0], [tColin + 0.6, 1, 'out']]);
      colin.set({ x: 780, y: rimY + 40 + (1 - cu) * 560, scale: 1.75, tilt: 6, look: [0, 5], dip: 0 });
      // his daughter pops up beside him, already filming, delighted
      const ku = kf(tt, [[tKid, 0], [tKid + 0.35, 1, 'back']]);
      const laugh = tt >= tLaugh ? 1 : 0;
      const shake = laugh ? Math.abs(Math.sin(tt * 18)) * 6 : 0;
      kid.set({ x: 1240, y: rimY + 520 + (1 - ku) * 700 - shake, scale: 1.6, headTilt: laugh ? -6 + Math.sin(tt * 9) * 3 : -8, laugh, mood: 'grin' });
    },
  };
}
