// Colin's daughter (about ten). Front view. Units 400 = 1 m, origin between feet.
// pose: 'phone' (filming, phone held up in both hands) | 'puppy' (cradling one)
import { el, g, shape, ellipseD, circleD, T, paintFilter } from '../lib/core.js';
import { P } from '../lib/palette.js';

const LINE = { skin: '#9a6a55', coat: '#4a2520', hair: '#2e231c', jeans: '#3a4250', boot: '#232a22' };

export function daughter(defs, { seed = 80, pose = 'phone' } = {}) {
  const texSkin = paintFilter(defs, { freq: 0.06, strength: 0.14, tooth: 0.06, seed });
  const texCloth = paintFilter(defs, { freq: [0.1, 0.03], strength: 0.2, tooth: 0.1, seed: seed + 1 });
  let s = seed * 7;
  const R = (amp = 0.8, wl = 14, more = {}) => ({ amp, wl, seed: ++s, ...more });
  const coatC = P.kidCoat, coatD = P.kidCoatDark;

  const lower = g({ filter: texCloth },
    shape('M-30 -262 L-28 -104 L-4 -104 L-4 -262Z', '#5d6878', { r: R(0.8), line: LINE.jeans }),
    shape('M4 -262 L4 -104 L28 -104 L30 -262Z', '#5d6878', { r: R(0.8), line: LINE.jeans }),
    // wellies
    shape('M-34 -116 L-32 -10 C-40 -8, -42 2, -30 4 L-4 4 C0 2, -2 -8, -4 -10 L-4 -116Z', '#3e4b3b', { r: R(0.7), line: LINE.boot }),
    shape('M34 -116 L32 -10 C40 -8, 42 2, 30 4 L4 4 C0 2, 2 -8, 4 -10 L4 -116Z', '#3e4b3b', { r: R(0.7), line: LINE.boot }),
    shape('M-34 -116 L-4 -116 L-4 -104 L-34 -104Z', '#2f3a2e', { r: R(0.4) }), shape('M4 -116 L34 -116 L34 -104 L4 -104Z', '#2f3a2e', { r: R(0.4) }));
  const coat = g({ filter: texCloth },
    // hood bunched behind the neck
    shape('M-40 -420 C-44 -448, -20 -462, 0 -462 C20 -462, 44 -448, 40 -420Z', coatD, { r: R(0.8, 12), line: LINE.coat }),
    shape('M-50 -424 C-60 -380, -64 -320, -70 -250 C-30 -240, 30 -240, 70 -250 C64 -320, 60 -380, 50 -424 C30 -436, -30 -436, -50 -424Z', coatC, { r: R(1, 20), line: LINE.coat }),
    shape('M-50 -424 C-60 -380, -64 -320, -70 -250 L-52 -246 C-48 -320, -44 -380, -38 -428Z', coatD, { r: R(0.8, 20), opacity: 0.55 }),
    el('path', { d: 'M0 -428 L0 -244', stroke: coatD, 'stroke-width': 3, opacity: 0.9 }),
    ...[-400, -360, -320, -280].map(y => el('rect', { x: -4, y: y - 7, width: 8, height: 14, rx: 3, fill: '#d9ceb4' })),
    shape('M-56 -300 L-24 -300 L-24 -286 L-56 -286Z', coatD, { r: R(0.4, 8), opacity: 0.8 }),
    shape('M24 -300 L56 -300 L56 -286 L24 -286Z', coatD, { r: R(0.4, 8), opacity: 0.8 }));
  // head
  const head = g({},
    g({ filter: texSkin },
      shape('M-8 -432 L-8 -446 L8 -446 L8 -432Z', P.skinDark, { r: R(0.3, 6) }),
      shape(ellipseD(0, -486, 38, 42), '#ebc7ae', { r: R(0.5, 12), line: LINE.skin, lw: 1.3 }),
      shape(ellipseD(-39, -484, 6, 9), '#ebc7ae', { r: R(0.3, 6), line: LINE.skin, lw: 1 }),
      shape(ellipseD(39, -484, 6, 9), '#ebc7ae', { r: R(0.3, 6), line: LINE.skin, lw: 1 }),
      el('path', { d: ellipseD(-20, -470, 8, 5.5), fill: '#e39a8a', opacity: 0.45 }), el('path', { d: ellipseD(20, -470, 8, 5.5), fill: '#e39a8a', opacity: 0.45 }),
      el('path', { d: 'M-2 -484 C-4 -478, -4 -474, 0 -472 C3 -472, 4 -474, 4 -476', stroke: LINE.skin, 'stroke-width': 1.5, fill: 'none' }),
      ...[[-24, -476], [-18, -479], [-27, -471], [22, -477], [17, -480], [26, -472]].map(([x, y]) => el('path', { d: circleD(x, y, 1.1), fill: '#b07a60', opacity: 0.6 }))),
    // bob with a straight fringe
    shape('M-44 -468 C-50 -510, -34 -534, 0 -536 C34 -534, 50 -510, 44 -468 C42 -456, 38 -450, 34 -452 C36 -470, 34 -490, 30 -500 L-30 -500 C-34 -490, -36 -470, -34 -452 C-38 -450, -42 -456, -44 -468Z', P.kidHair, { r: R(0.7, 8, { tufts: 0.8, tuftLen: 5 }), line: LINE.hair, lw: 1.1 }),
    el('path', { d: 'M-24 -528 C-12 -532, 6 -532, 20 -526', stroke: '#7a624f', 'stroke-width': 2, fill: 'none', opacity: 0.6 }));
  const eyesOpen = g({}, el('path', { d: ellipseD(-14, -484, 3, 3.4), fill: P.ink }), el('path', { d: ellipseD(14, -484, 3, 3.4), fill: P.ink }));
  const eyesLaugh = g({ style: 'display:none' }, el('path', { d: 'M-19 -483 C-16 -488, -12 -488, -9 -483 M9 -483 C12 -488, 16 -488, 19 -483', stroke: P.ink, 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
  const grin = g({},
    shape('M-16 -462 C-8 -458, 8 -458, 16 -462 C14 -450, 6 -444, 0 -444 C-6 -444, -14 -450, -16 -462Z', '#6b2f2b', { r: R(0.3, 6) }),
    el('path', { d: 'M-13 -460 C-6 -457, 6 -457, 13 -460 L12 -456 C6 -454, -6 -454, -12 -456Z', fill: '#f2ede2' }),
    el('path', { d: ellipseD(0, -447.5, 6, 2.5), fill: '#d97f78', opacity: 0.9 }));
  const mouthGrinG = g({}, grin);
  const face = g({}, head, eyesOpen, eyesLaugh, mouthGrinG);
  const headPiv = g({}, face);

  // arms + held object
  let arms, held, heldSlot = null;
  if (pose === 'phone') {
    arms = g({ filter: texCloth },
      shape('M-50 -420 C-64 -390, -68 -356, -60 -338 C-50 -326, -32 -336, -20 -350 L-26 -364 C-34 -354, -42 -352, -46 -362 C-44 -380, -40 -400, -36 -420Z', coatC, { r: R(0.8, 14), line: LINE.coat }),
      shape('M50 -420 C64 -390, 68 -356, 60 -338 C50 -326, 32 -336, 20 -350 L26 -364 C34 -354, 42 -352, 46 -362 C44 -380, 40 -400, 36 -420Z', coatC, { r: R(0.8, 14), line: LINE.coat }));
    held = g({},
      shape('M-14 -396 L14 -396 C17 -396, 19 -394, 19 -391 L19 -342 C19 -339, 17 -337, 14 -337 L-14 -337 C-17 -337, -19 -339, -19 -342 L-19 -391 C-19 -394, -17 -396, -14 -396Z', '#26292d', { r: R(0.3, 10) }),
      el('path', { d: circleD(-9, -387, 3.6), fill: '#3c4248', stroke: '#15171a', 'stroke-width': 1.3 }),
      el('path', { d: circleD(-9, -387, 1.3), fill: '#7e8a94' }),
      g({ filter: texSkin },
        shape(ellipseD(-18, -350, 8, 11), '#ebc7ae', { r: R(0.3, 6), line: LINE.skin, lw: 1 }),
        shape(ellipseD(18, -350, 8, 11), '#ebc7ae', { r: R(0.3, 6), line: LINE.skin, lw: 1 })));
  } else {
    arms = g({ filter: texCloth },
      shape('M-50 -420 C-66 -390, -70 -330, -60 -290 C-50 -262, 10 -262, 34 -272 L30 -290 C8 -284, -36 -284, -42 -300 C-46 -340, -42 -390, -36 -420Z', coatC, { r: R(0.8, 14), line: LINE.coat }),
      shape('M50 -420 C64 -396, 70 -350, 62 -312 C56 -294, 40 -290, 24 -292 L26 -308 C36 -306, 42 -312, 44 -324 C46 -356, 42 -396, 36 -420Z', coatC, { r: R(0.8, 14), line: LINE.coat }));
    heldSlot = g({ transform: T(-4, -284) });
    held = g({}, heldSlot,
      g({ filter: texSkin },
        shape(ellipseD(34, -281, 9, 11), '#ebc7ae', { r: R(0.3, 6), line: LINE.skin, lw: 1 }),
        shape(ellipseD(20, -299, 9, 11), '#ebc7ae', { r: R(0.3, 6), line: LINE.skin, lw: 1 })));
  }
  // held object must sit between the coat and the forearms for the puppy
  const root = g({ class: 'daughter' }, lower, coat, headPiv, pose === 'puppy' ? held : null, arms, pose === 'phone' ? held : null);
  return {
    root, head: headPiv, slot: heldSlot,
    set({ x = 0, y = 0, scale = 1, rot = 0, headTilt = 0, laugh = 0, bounce = 0, mood = 'grin' } = {}) {
      root.setAttribute('transform', `translate(${x} ${y + bounce}) rotate(${rot}) scale(${scale})`);
      headPiv.setAttribute('transform', `rotate(${headTilt} 0 -440) translate(0 ${-laugh * 3})`);
      eyesOpen.style.display = laugh > 0.5 ? 'none' : '';
      eyesLaugh.style.display = laugh > 0.5 ? '' : 'none';
      mouthGrinG.setAttribute('transform', mood === 'smile' ? 'translate(0 -452) scale(1 0.45) translate(0 452)' : '');
    },
  };
}
