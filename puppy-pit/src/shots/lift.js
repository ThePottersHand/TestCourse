// "They lifted me out." Dusk, from inside the pit. Colin kneels at the far edge
// and his daughter stands beside him, each with one of his wrists; he goes up the
// ladder in two heaves and is hauled over the top, to end up on his knees on the
// lawn between them. One sock and one shoe are the last to leave the pit.
//
// Layering (far to near): sky, fence, the helpers (clipped at the rim: the lip of
// the lawn hides their knees and feet), the pit walls and the grass fringe of
// the far rim, the ladder, him, their arms and hands round his wrists. While he
// is in the pit nothing of him is clipped (he is in front of the wall); as he
// goes over, his legs are clipped below the rim line, so they disappear over the
// edge instead of passing through it.
import { el, g, lerp } from '../lib/core.js';
import { kf, on2, win, camTransform, EASE } from '../lib/anim.js';
import { stage, camera, charScale, inPitSet, tint } from './common.js';
import { narratorBack } from '../chars/narrator.js';
import { colinOverFence } from '../chars/colin.js';
import { daughter } from '../chars/daughter.js';
import { puppy } from '../chars/puppy.js';
import { ladder } from '../props/misc.js';

export async function lifted(svg, ctx) {
  const { defs, root } = stage(svg);
  const D = 1.6, ZF = 3.8;
  const cam = camera({ f: 1300, H: -0.1, cx: 760, cy: 600 });
  const L = inPitSet(defs, cam, { mode: 'dusk', twigs: true });
  const world = g({}); root.appendChild(world);
  const rimY = cam.p(0, 0, ZF)[1];
  const clip = (id, y0, y1) => { defs.appendChild(el('clipPath', { id }, el('rect', { x: -3000, y: y0, width: 8000, height: y1 - y0 }))); return `url(#${id})`; };
  const above = clip('liftAbove', -3000, rimY + 1), below = clip('liftBelow', rimY - 1, 4000);
  world.append(L.sky, L.twigs, L.fence);

  // --- the helpers, either side of the ladder just beyond the far edge: Colin kneeling,
  // his daughter standing. The lip of the lawn hides his knees and her feet.
  const Zh = 4.0;
  const colin = colinOverFence(defs, { seed: 64 });
  const kid = daughter(defs, { pose: 'reach', seed: 81 });
  world.appendChild(g({ 'clip-path': above }, colin.root, kid.root));
  world.append(el('rect', { x: -3000, y: cam.p(0, -D, 2.4)[1] - 2, width: 8000, height: 4000, fill: '#30261e' }), L.back, L.shade, L.rim);

  // --- the ladder against the far wall; its top rests on the edge (and doesn't stick up,
  // so it never has to pass in front of him once he's out)
  const [lfx, lfy] = cam.p(0.34, -D, 3.55), [, lty] = cam.p(0.34, 0.06, ZF), ls = charScale(cam, 3.68);
  world.appendChild(g({ transform: `translate(${lfx} ${lfy}) scale(${ls})` }, ladder(defs, { len: (lfy - lty) / ls / 400, w: 0.44 })));

  // --- him, from behind. His legs sit in their own wrapper so they can be clipped
  // at the rim as they go over the edge.
  const Zn = 3.42;
  const n = narratorBack(defs, { seed: 93 });
  // Harold is still asleep on his head, and comes out with him
  const hp = puppy(defs, { view: 'side', pose: 'lie', seed: 6, harold: true });
  n.slots.head.appendChild(hp.root);
  const legT = g({}, n.legs), upT = g({}, n.skirt, n.arms, n.upper);
  const legWrap = g({}, legT);
  world.append(legWrap, upT);
  // their arms go on top: their hands are round his wrists
  const kidArms = kid.root.lastChild;
  const colinArmsT = g({}, colin.reachG), kidArmsT = g({}, kidArms);
  const armsWrap = g({}, colinArmsT, kidArmsT);        // untransformed, so a clip here is in world space
  world.appendChild(armsWrap);
  root.appendChild(tint(defs, 'dusk'));

  // timing: they settle their grip; heave on "They", heave again on "lifted", over the top on "out"
  const tH1 = ctx.W(30, 'they') - ctx.shot.start - 0.12;
  const tH2 = ctx.W(30, 'lifted') - ctx.shot.start - 0.02;
  const tOver = ctx.W(30, 'out') - ctx.shot.start - 0.12;
  const tGone = tOver + 0.66;
  const FEET0 = -D + 0.28;                              // on the first rung
  // his hips reach the rim line (on screen) at the top of the second heave
  const hipsAtRim = (cam.cy - rimY) / cam.s(Zn) + cam.H - 0.825;
  return {
    update(t) {
      const tt = on2(t);
      world.setAttribute('transform', camTransform(880, lerp(560, 520, EASE.sine(win(t, 0, ctx.dur))), 1.12));
      const h1 = kf(tt, [[tH1, 0], [tH1 + 0.3, 1, 'out']]), h2 = kf(tt, [[tH2, 0], [tH2 + 0.4, 1, 'out']]);
      const over = kf(tt, [[tOver, 0], [tGone, 1, 'io']]), eo = over;
      const feetY = lerp(FEET0, hipsAtRim, h1 * 0.45 + h2 * 0.55);
      // they settle their grip, lean back with each heave, then shuffle back as they
      // pull him onto the lawn
      const brace = tt < tH1 ? kf(tt, [[0, 0], [0.4, 1, 'io'], [tH1, 0.7]]) : 0;
      const lean = Math.max(win(tt, tH1 - 0.05, tH1 + 0.25) * (1 - 0.4 * win(tt, tH1 + 0.3, tH2)), win(tt, tH2 - 0.05, tH2 + 0.3), over);
      const Zb = Zh + 0.4 * eo, hb = charScale(cam, Zb), cb = hb * 0.86;
      const [cxb, cyb] = cam.p(-0.32 - 0.06 * eo, 0.82, Zb), [kxb, kyb] = cam.p(1.0 + 0.06 * eo, 0, Zb);
      const cxp = cxb - lean * 6 * hb, cyp = cyb - lean * 40 * hb + brace * 10 * hb;
      const kyp = kyb;                                  // her feet stay planted; she leans away as she pulls
      // his wrists, held in front of them below their shoulders
      const gL = cam.p(lerp(0.04, -0.04, lean), lerp(0.5, 0.66, lean) - eo * 0.08, lerp(3.78, 4.2, eo));
      const gR = cam.p(lerp(0.66, 0.74, lean), lerp(0.46, 0.6, lean) - eo * 0.08, lerp(3.78, 4.2, eo));
      const locC = p => [(p[0] - cxp) / cb, (p[1] - cyp) / cb];
      const kRot = (lean * 5 - brace * 2) * Math.PI / 180;
      const locK = p => { const dx = p[0] - kxb, dy = p[1] - kyp; return [(dx * Math.cos(kRot) + dy * Math.sin(kRot)) / hb, (-dx * Math.sin(kRot) + dy * Math.cos(kRot)) / hb]; };
      colin.set({ x: cxp, y: cyp, scale: cb, tilt: -lean * 4, dip: 8 - lean * 8, look: [0, 5 - lean * 3],
        reach: [locC([gL[0] - 13, gL[1] + 5]), locC([gL[0] + 11, gL[1] - 5])] });
      kid.set({ x: kxb, y: kyp, scale: hb, rot: lean * 5 - brace * 2, headTilt: 6 - lean * 8, mood: 'smile',
        reach: [locK([gR[0] - 10, gR[1] - 5]), locK([gR[0] + 11, gR[1] + 5])] });
      colinArmsT.setAttribute('transform', colin.root.getAttribute('transform'));
      kidArmsT.setAttribute('transform', kid.root.getAttribute('transform'));
      // him: a foot goes up a rung with each heave; then over the top onto the lawn, where
      // he ends up on his knees, slumped, between them
      const Zo = lerp(Zn, 4.08, eo), so = charScale(cam, Zo);
      const [fx, fy] = cam.p(0.34, lerp(feetY, -0.375, eo), Zo);
      const stepL = Math.sin(Math.min(1, h1) * Math.PI) * 70 + Math.sin(Math.min(1, h2) * Math.PI) * 50;
      const stepR = Math.sin(win(tt, tH2 - 0.1, tH2 + 0.35) * Math.PI) * 60;
      const kick = over > 0 && over < 1 ? Math.sin((tt - tOver) * 22) * 24 * (1 - over) : 0;
      n.set({ x: fx, y: fy, scale: so, hands: [[(gL[0] - fx) / so, (gL[1] - fy) / so], [(gR[0] - fx) / so, (gR[1] - fy) / so]],
        liftL: stepL + Math.max(0, kick), liftR: stepR + Math.max(0, -kick), tip: eo * 0.4, sink: 0, tuft: true, headTilt: (brace - lean) * 3 + eo * 5 });
      hp.set({ x: 6, y: 2, scale: 0.85, flip: -1, headRot: 10, blink: true, wag: 0, rot: (brace - lean) * 2 });
      const rt = n.root.getAttribute('transform');
      upT.setAttribute('transform', rt);
      // his legs: in the pit they're in front of the wall; as they're dragged over the edge
      // they go behind the lip of the lawn (the coat-tails stay in view, draped over his knees)
      const drag = Math.max(0, fy - rimY + 30) * EASE.in(win(tt, tOver + 0.05, tGone));
      legT.setAttribute('transform', `translate(0 ${-drag}) ${rt}`);
      if (over > 0) legWrap.setAttribute('clip-path', below); else legWrap.removeAttribute('clip-path');
    },
  };
}
