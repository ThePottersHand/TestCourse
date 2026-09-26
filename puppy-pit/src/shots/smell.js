// "The first thing I noticed was the smell. Warm biscuits, wet towels, and the
// faint electrical scent of a household appliance being licked."
// Close on his face, flat on his back at the bottom of the pit. Eyes closed,
// a man considering a vintage. Puppies arrive to inspect him.
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, rng } from '../lib/core.js';
import { kf, on2, win, wob, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage } from './common.js';
import { narrator } from '../chars/narrator.js';
import { puppy } from '../chars/puppy.js';

export async function smell(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  // the pit floor and the lower wall behind him, very close
  world.appendChild(el('rect', { x: -300, y: -300, width: 2520, height: 1680, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#5a4636'], [0.45, '#43342a'], [0.62, '#2a211a'], [1, '#1e1712']]) }));
  const wall = el('filter', { id: 'smTex', x: 0, y: 0, width: 1, height: 1 },
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.012 0.05', numOctaves: 3, seed: 9, result: 'n' }),
    el('feColorMatrix', { in: 'n', type: 'matrix', values: '0.5 0 0 0 0.25 0.5 0 0 0 0.25 0.5 0 0 0 0.25 0 0 0 0 1', result: 'm' }),
    el('feBlend', { in: 'm', in2: 'SourceGraphic', mode: 'soft-light', result: 'b' }),
    el('feComposite', { in: 'b', in2: 'SourceGraphic', operator: 'in' }));
  defs.appendChild(wall);
  world.firstChild.setAttribute('filter', 'url(#smTex)');
  // the base of the pit wall behind him: strata, a few stones, roots from far above
  const r0 = rng(17), wallBits = g({ opacity: 0.9 });
  for (let i = 0; i < 26; i++) wallBits.appendChild(el('path', { d: ellipseD(r0() * 2200 - 150, 120 + r0() * 380, 6 + r0() * 12, 4 + r0() * 7, r0() * 180), fill: r0() < 0.5 ? '#5e5247' : '#463c34', opacity: 0.8 }));
  const rootD = [];
  for (let i = 0; i < 18; i++) { const x = r0() * 2000; let d = `M${x} -300`, cx = x, cy = -300; for (let k = 0; k < 6; k++) { cx += (r0() - 0.5) * 30; cy += 40 + r0() * 50; d += ` L${cx.toFixed(0)} ${cy.toFixed(0)}`; } rootD.push(d); }
  wallBits.appendChild(el('path', { d: rootD.join(''), stroke: '#8a765c', 'stroke-width': 2.4, fill: 'none', opacity: 0.55 }));
  wallBits.appendChild(el('path', { d: 'M-300 330 C300 318, 900 342, 2300 326', stroke: '#2a2019', 'stroke-width': 3, fill: 'none', opacity: 0.4 }));
  world.appendChild(wallBits);
  const r = rng(3);
  const floorBits = g({ filter: blurFilter(defs, 1.2) });
  for (let i = 0; i < 40; i++) floorBits.appendChild(el('path', { d: ellipseD(r() * 2200 - 150, 700 + r() * 500, 4 + r() * 10, 2 + r() * 4, r() * 180), fill: r() < 0.5 ? '#6d5a46' : '#231a14', opacity: 0.7 }));
  world.appendChild(floorBits);
  world.appendChild(el('rect', { x: -300, y: 300, width: 2520, height: 260, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#120d0a', 0], [0.7, '#120d0a', 0.45], [1, '#120d0a', 0]]) }));
  // his glasses, fallen off, on the floor
  world.appendChild(g({ transform: 'translate(1460 905) rotate(-12) scale(2.4)' },
    el('path', { d: 'M0 0 L20 1 C20 7, 14 10, 9 10 C4 10, 0 6, 0 0Z M26 1 L46 0 C46 6, 42 10, 37 10 C32 10, 26 7, 26 1Z', fill: '#dfe3df', 'fill-opacity': 0.25, stroke: '#3b302a', 'stroke-width': 1.6 }),
    el('path', { d: 'M20 2 L26 2 M0 1 L-14 -8 M46 1 L58 -6', stroke: '#3b302a', 'stroke-width': 1.4 })));
  // him: on his back, head to the left, face up
  const n = narrator(defs, { seed: 17 });
  const S = 2.55, headX = 560, floorY = 880;
  const lying = g({}, n.root);
  // puppies: one sniffing from above his head, one at his cheek, one licking at the end
  const pA = puppy(defs, { view: 'side', pose: 'stand', seed: 3 });     // behind his head, facing right
  const pB = puppy(defs, { view: 'side', pose: 'stand', seed: 7 });     // over his chest, facing left
  const pC = puppy(defs, { view: 'front', pose: 'sit', seed: 5 });      // in the back, watching
  const back = g({}, pC.root), mid = g({}, pA.root), front = g({}, pB.root);
  world.append(back, lying, mid, front);
  // light from above
  world.appendChild(el('rect', { x: -300, y: -300, width: 2520, height: 1680, fill: radGrad(defs, 0.4, 0.3, 0.8, [[0, '#f3e4c8', 0.12], [1, '#0a0705', 0.45]]) }));
  const t0 = ctx.W(9, 'smell') - ctx.shot.start;
  const tBis = ctx.W(10, 'warm') - ctx.shot.start;
  const tLick = ctx.W(11, 'licked') - ctx.shot.start;
  return {
    update(t) {
      world.setAttribute('transform', camTransform(900, 640, kf(t, [[0, 1.0], [ctx.dur, 1.12, 'sine']])));
      const tt = on2(t);
      // lying: rotate the whole rig so he is flat, face up (root = feet, far off to the right)
      const breathe = wob(t, 7, 0.4) * 0.4;
      n.set({ x: headX + 700 * S, y: floorY - 34 * S, scale: S, rot: -90, flip: 1, lean: 0, head: -4 + breathe, tuft: true, eyes: tt < tLick + 0.55 ? 'closed' : 'open',
        brow: tt > tLick + 0.55 ? 3 : 0, armN: [8, 0, 0, 1], armF: [4, 0, 0, 1], thighN: 0, shinN: 0, footN: 0, thighF: 0, shinF: 0, footF: 0 });
      // A: noses in from behind his head, sniffing (head bobs)
      const aIn = kf(tt, [[0.2, -260], [1.2, 0, 'out']]);
      const sniff = Math.sin(tt * 18) * (tt > 1.2 && tt < tBis + 2 ? 3 : 0);
      pA.set({ x: headX - 250 + aIn, y: floorY - 40, scale: 2.3, flip: 1, headRot: 26 + sniff, wag: Math.sin(tt * 12) * 20, trot: tt < 1.2 ? tt * 2 : null });
      // B: arrives over his chest at "warm biscuits", nose to his nose
      const bIn = kf(tt, [[tBis - 1.2, 520], [tBis, 0, 'out']]);
      const lick = tt > tLick - 0.15 && tt < tLick + 0.5;
      pB.set({ x: headX + 440 + bIn, y: floorY - 150 - (lick ? 10 : 0), scale: 2.5, flip: -1, headRot: 30 + (lick ? 8 : Math.sin(tt * 16) * 2), bark: lick,
        wag: Math.sin(tt * 14) * 26, trot: tt < tBis ? tt * 2.4 : null });
      // C: in the background, just watching
      pC.set({ x: 1700, y: 760, scale: 1.7, headRot: -10, look: -2.5, lookY: 1, wag: Math.sin(tt * 6) * 8 });
    },
  };
}
