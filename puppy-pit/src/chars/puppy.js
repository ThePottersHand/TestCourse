// Golden puppies. Two views: 'side' (facing right) and 'front' (facing camera).
// Units: sitting height ~115. Origin = ground under the chest.
import { el, g, shape, ellipseD, circleD, T, paintFilter, mix, rng } from '../lib/core.js';
import { P } from '../lib/palette.js';

const LINE = '#8a5a26';

// slight per-puppy colour variation so the nine read as individuals
function coat(seed, harold) {
  const r = rng(seed * 7 + 1);
  const shift = (r() - 0.5) * 0.3;
  const toward = shift > 0 ? '#cf8436' : '#f2cf8e';
  const k = Math.abs(shift);
  const C = {
    body: mix(P.gold, toward, k), light: mix(P.goldLight, toward, k * 0.6), cream: mix(P.goldCream, toward, k * 0.3),
    dark: mix(P.goldDark, toward, k * 0.4), deep: P.goldDeep, ear: mix(P.ear, toward, k * 0.5),
  };
  if (harold) Object.assign(C, { body: '#d8984a', light: '#e9b46e', ear: '#b9772f', dark: '#b57432' });
  return C;
}

export function puppy(defs, { view = 'side', seed = 1, pose = 'sit', harold = false } = {}) {
  const C = coat(seed, harold);
  const tex = paintFilter(defs, { freq: 0.06, strength: 0.2, tooth: 0.07, seed: seed + 40 });
  let s = seed * 100;
  const R = (amp = 0.8, wl = 12, fur = 0) => ({ amp, wl, seed: ++s, tufts: fur, tuftLen: 6 });
  return view === 'front' ? frontPup(C, tex, R, pose, harold) : sidePup(C, tex, R, pose, harold);
}

// ------------------------------------------------------------------ side view
function sidePup(C, tex, R, pose, harold) {
  const o = { line: LINE, lw: 1.3, lo: 0.45 };
  const tailG = g({},
    shape('M0 0 C-4 -10, -10 -22, -8 -34 C-7 -40, -1 -40, 0 -34 C1 -24, 5 -12, 8 -2Z', C.body, { r: R(0.6, 8, 1.8), ...o }));
  const tail = g({}, tailG);
  let body, legsBack, legsFront, neck;
  if (pose === 'sit') {
    legsBack = g({},
      shape('M4 -46 C6 -30, 8 -14, 8 -4 L20 -4 C20 -14, 18 -30, 16 -48Z', C.dark, { r: R(0.5, 10), ...o }),
      shape(ellipseD(15, -4, 9, 5), C.dark, { r: R(0.4, 6), ...o }));
    body = g({},
      shape('M-38 -4 C-47 -18, -44 -42, -30 -54 C-20 -63, -4 -72, 8 -76 C20 -78, 28 -68, 29 -56 C30 -42, 28 -30, 26 -18 C24 -10, 22 -2, 18 0 L-30 0 C-34 0, -37 -1, -38 -4Z', C.body, { r: R(0.8, 14, 1.2), ...o }),
      shape('M-38 -4 C-36 -1, -30 0, 18 0 C22 -2, 24 -8, 24 -12 C4 -8, -20 -8, -38 -10Z', C.dark, { r: R(0.5, 12), opacity: 0.55 }),
      // haunch + big back paw
      shape(ellipseD(-17, -22, 22, 19, -12), C.body, { r: R(0.6, 12), ...o }),
      shape('M-36 -14 C-30 -3, -10 -1, 0 -8 C-8 -6, -26 -8, -36 -18Z', C.dark, { r: R(0.4, 8), opacity: 0.6 }),
      shape(ellipseD(0, -5, 14, 6.5), C.light, { r: R(0.4, 6), ...o }),
      // chest fluff
      shape('M16 -70 C28 -64, 31 -46, 27 -26 C22 -34, 18 -48, 12 -62Z', C.cream, { r: R(0.5, 8, 1.6), opacity: 0.9 }));
    legsFront = g({},
      shape('M12 -46 C15 -30, 17 -14, 17 -4 L30 -4 C30 -14, 28 -30, 25 -48Z', C.body, { r: R(0.5, 10), ...o }),
      shape(ellipseD(26, -5, 10, 6), C.light, { r: R(0.4, 6), ...o }));
    neck = [16, -74];
    tail.setAttribute('transform', T(-38, -4, -104));
  } else if (pose === 'stand') {
    legsBack = g({},
      g({ class: 'lbf' }, shape('M-30 -34 C-30 -20, -28 -8, -28 -3 L-18 -3 C-18 -10, -18 -22, -16 -34Z', C.dark, { r: R(0.4, 8), ...o }), shape(ellipseD(-22, -3, 8, 4.5), C.dark, { r: R(0.3, 6), ...o })),
      g({ class: 'lff' }, shape('M18 -34 C18 -20, 18 -8, 18 -3 L28 -3 C28 -10, 28 -22, 28 -34Z', C.dark, { r: R(0.4, 8), ...o }), shape(ellipseD(24, -3, 8, 4.5), C.dark, { r: R(0.3, 6), ...o })));
    body = g({},
      shape('M-46 -40 C-50 -58, -32 -68, -8 -66 C14 -66, 30 -66, 38 -56 C44 -44, 38 -28, 24 -24 C4 -20, -20 -20, -34 -24 C-44 -26, -46 -32, -46 -40Z', C.body, { r: R(0.8, 16, 1.2), ...o }),
      shape('M-42 -28 C-24 -21, 8 -21, 28 -26 C14 -30, -20 -32, -42 -34Z', C.dark, { r: R(0.5, 12), opacity: 0.55 }),
      shape('M28 -64 C40 -56, 40 -40, 30 -28 C30 -38, 28 -50, 22 -58Z', C.cream, { r: R(0.5, 8, 1.4), opacity: 0.9 }));
    legsFront = g({},
      g({ class: 'lbn' }, shape('M-40 -38 C-38 -22, -38 -10, -38 -3 L-26 -3 C-26 -10, -26 -22, -24 -36Z', C.body, { r: R(0.4, 8), ...o }), shape(ellipseD(-31, -3, 9, 5), C.light, { r: R(0.3, 6), ...o })),
      g({ class: 'lfn' }, shape('M8 -36 C8 -22, 8 -10, 8 -3 L20 -3 C20 -10, 20 -22, 20 -36Z', C.body, { r: R(0.4, 8), ...o }), shape(ellipseD(15, -3, 9, 5), C.light, { r: R(0.3, 6), ...o })));
    neck = [30, -62];
    tail.setAttribute('transform', T(-44, -52, -30));
  } else { // 'beg': up on hind legs, front paws raised (for climbing)
    legsBack = g({}, shape(ellipseD(-4, -4, 14, 6), C.dark, { r: R(0.4, 6), ...o }));
    body = g({},
      shape('M-28 -8 C-36 -26, -28 -64, -12 -82 C-2 -92, 16 -90, 20 -78 C24 -62, 16 -32, 8 -12 C4 -4, -2 0, -12 0 C-20 0, -26 -4, -28 -8Z', C.body, { r: R(0.8, 16, 1.2), ...o }),
      shape(ellipseD(-12, -20, 17, 16), C.body, { r: R(0.6, 12), ...o }),
      shape('M8 -82 C18 -72, 18 -50, 10 -32 C10 -46, 8 -62, 4 -76Z', C.cream, { r: R(0.5, 8, 1.4), opacity: 0.9 }),
      shape(ellipseD(4, -4, 14, 6), C.light, { r: R(0.4, 6), ...o }));
    legsFront = g({ class: 'paws' },
      shape('M8 -74 C18 -78, 30 -84, 38 -92 L44 -84 C36 -76, 24 -68, 12 -66Z', C.body, { r: R(0.4, 8), ...o }),
      shape(ellipseD(42, -89, 8, 6, -40), C.light, { r: R(0.3, 6), ...o }));
    neck = [6, -88];
    tail.setAttribute('transform', T(-24, -8, -120));
  }

  // head (origin at neck), facing right: round skull, short deep muzzle
  const skullD = 'M-18 -2 C-26 -12, -28 -34, -18 -46 C-8 -56, 10 -56, 18 -46 C22 -42, 24 -38, 28 -35 C34 -34, 40 -32, 44 -28 C47 -24, 46 -18, 42 -15 C38 -12, 32 -10, 26 -9 C20 -6, 12 -2, 4 2 C-4 4, -12 2, -18 -2Z';
  const ear = g({},
    shape('M0 0 C-9 4, -14 18, -12 32 C-10 42, 0 42, 4 34 C7 22, 7 8, 5 0Z', C.ear, { r: R(0.5, 8, 1.2), ...o }),
    shape('M-5 8 C-9 16, -9 28, -7 36 C-5 28, -5 18, -2 10Z', C.deep, { r: R(0.3, 6), opacity: 0.4 }));
  const jaw = shape('M20 -10 C28 -10, 36 -12, 41 -15 C39 -9, 32 -5, 24 -5 C18 -5, 14 -7, 20 -10Z', C.cream, { r: R(0.3, 6) });
  const mouthOpen = g({ style: 'display:none' },
    shape('M18 -14 C28 -14, 38 -16, 44 -20 C44 -8, 36 2, 26 2 C18 2, 14 -4, 18 -14Z', '#5b2b27', { r: R(0.3, 6) }),
    shape('M24 -3 C28 -7, 34 -7, 38 -4 C36 1, 28 2, 24 -3Z', P.tongue, { r: R(0.3, 5) }),
    shape('M16 -4 C26 0, 36 0, 42 -4 C42 3, 36 9, 27 9 C20 9, 14 5, 16 -4Z', C.cream, { r: R(0.4, 6), ...o }));
  const headG = g({},
    shape(skullD, C.body, { r: R(0.7, 12, 0.8), ...o }),
    shape('M-12 -46 C-2 -54, 12 -52, 18 -44 C8 -46, -2 -46, -12 -40Z', C.light, { r: R(0.4, 8), opacity: 0.7 }),
    // muzzle cream + flew shadow
    shape('M22 -34 C30 -34, 40 -31, 44 -27 C46 -22, 44 -17, 40 -15 C34 -13, 26 -13, 20 -16 C16 -22, 16 -30, 22 -34Z', C.cream, { r: R(0.4, 8) }),
    el('path', { d: 'M40 -18 C36 -15, 30 -14, 24 -15', stroke: LINE, 'stroke-width': 1.3, fill: 'none', opacity: 0.6, 'stroke-linecap': 'round' }),
    jaw, mouthOpen);
  const nose = shape('M40 -32 C44 -34, 48 -32, 48 -28 C48 -24, 44 -23, 41 -24 C38 -26, 38 -30, 40 -32Z', P.pupNose, { r: R(0.25, 4) });
  const eye = el('path', { d: ellipseD(17, -34, 3.1, 3.3), fill: P.ink });
  const eyeShut = el('path', { d: 'M13 -34 C15 -32, 19 -32, 21 -34', stroke: P.ink, 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round', style: 'display:none' });
  const earPivot = g({ transform: T(-6, -40, 0) }, ear);
  const headRot = g({}, g({ filter: tex }, headG, earPivot), nose, eye, eyeShut);
  if (harold) headRot.appendChild(shape('M2 -52 C8 -54, 14 -50, 17 -44 C12 -46, 7 -47, 3 -46Z', '#f3dcae', { r: R(0.3, 5), opacity: 0.9 }));
  const headPivot = g({ transform: T(neck[0], neck[1]) }, headRot);
  const bodyG = g({ filter: tex }, legsBack, tail, body, legsFront);
  const root = g({ class: 'pup' }, bodyG, headPivot);
  const parts = { root, headRot, tail: tailG, ear: earPivot, bodyG };
  parts.set = (q = {}) => {
    const { x = 0, y = 0, scale = 1, flip = 1, rot = 0, headRot: hr = 0, earRot = 0, wag = 0, bark = false, blink = false } = q;
    root.setAttribute('transform', `translate(${x} ${y}) rotate(${rot}) scale(${scale * flip} ${scale})`);
    headRot.setAttribute('transform', `rotate(${hr})`);
    earPivot.setAttribute('transform', T(-6, -40, earRot));
    tailG.setAttribute('transform', `rotate(${wag})`);
    mouthOpen.style.display = bark ? '' : 'none';
    jaw.style.display = bark ? 'none' : '';
    eye.style.display = blink ? 'none' : '';
    eyeShut.style.display = blink ? '' : 'none';
  };
  parts.set({});
  return parts;
}

// ------------------------------------------------------------------ front view
function frontPup(C, tex, R, pose, harold) {
  const o = { line: LINE, lw: 1.3, lo: 0.45 };
  const tail = g({}, shape('M0 0 C8 -8, 16 -20, 14 -32 C13 -38, 7 -38, 6 -32 C6 -22, 2 -12, -4 -4Z', C.body, { r: R(0.5, 8, 1.6), ...o }));
  const tailPivot = g({ transform: T(20, -14) }, tail);
  const body = g({},
    shape(ellipseD(-22, -14, 17, 14), C.dark, { r: R(0.5, 10), ...o }),
    shape(ellipseD(22, -14, 17, 14), C.dark, { r: R(0.5, 10), ...o }),
    shape('M-25 -8 C-31 -30, -25 -58, 0 -64 C25 -58, 31 -30, 25 -8 C18 0, -18 0, -25 -8Z', C.body, { r: R(0.8, 14, 1.2), ...o }),
    shape('M-13 -58 C-6 -62, 6 -62, 13 -58 C15 -42, 9 -24, 0 -18 C-9 -24, -15 -42, -13 -58Z', C.cream, { r: R(0.5, 8, 1.6), opacity: 0.9 }),
    shape('M-16 -34 C-17 -20, -17 -8, -17 -1 L-5 -1 C-5 -8, -5 -22, -6 -34Z', C.body, { r: R(0.4, 8), ...o }),
    shape('M16 -34 C17 -20, 17 -8, 17 -1 L5 -1 C5 -8, 5 -22, 6 -34Z', C.body, { r: R(0.4, 8), ...o }),
    shape(ellipseD(-11, -2, 9, 5), C.light, { r: R(0.3, 6), ...o }),
    shape(ellipseD(11, -2, 9, 5), C.light, { r: R(0.3, 6), ...o }));
  const earL = g({}, shape('M0 0 C-9 2, -16 16, -15 30 C-14 40, -5 41, -1 34 C3 24, 5 10, 4 0Z', C.ear, { r: R(0.5, 8, 1.2), ...o }));
  const earR = g({}, shape('M0 0 C9 2, 16 16, 15 30 C14 40, 5 41, 1 34 C-3 24, -5 10, -4 0Z', C.ear, { r: R(0.5, 8, 1.2), ...o }));
  const earLP = g({ transform: T(-19, -38) }, earL), earRP = g({ transform: T(19, -38) }, earR);
  const face = g({},
    shape('M-24 -30 C-26 -46, -14 -54, 0 -54 C14 -54, 26 -46, 24 -30 C23 -18, 16 -6, 0 -4 C-16 -6, -23 -18, -24 -30Z', C.body, { r: R(0.7, 12, 0.8), ...o }),
    shape('M-16 -44 C-6 -52, 6 -52, 16 -44 C6 -46, -6 -46, -16 -40Z', C.light, { r: R(0.4, 8), opacity: 0.7 }),
    shape('M-12 -22 C-12 -30, -6 -32, 0 -32 C6 -32, 12 -30, 12 -22 C12 -12, 6 -6, 0 -6 C-6 -6, -12 -12, -12 -22Z', C.cream, { r: R(0.4, 8) }));
  const mouth = el('path', { d: 'M0 -19 L0 -14 M-4 -12 C-2 -12.5, -1 -13, 0 -14 C1 -13, 2 -12.5, 4 -12', stroke: LINE, 'stroke-width': 1.3, fill: 'none', 'stroke-linecap': 'round', opacity: 0.7 });
  const mouthOpen = g({ style: 'display:none' },
    shape(ellipseD(0, -11, 6.5, 5.5), '#5b2b27', { r: R(0.3, 5) }),
    shape(ellipseD(0, -8.5, 4.2, 2.8), P.tongue, { r: R(0.3, 5) }));
  const nose = shape('M-6 -24 C-6 -28, 6 -28, 6 -24 C6 -20, 2 -18, 0 -18 C-2 -18, -6 -20, -6 -24Z', P.pupNose, { r: R(0.25, 4) });
  const eyes = g({}, el('path', { d: ellipseD(-10, -34, 3, 3.3), fill: P.ink }), el('path', { d: ellipseD(10, -34, 3, 3.3), fill: P.ink }));
  const shine = g({ style: 'display:none' }, el('path', { d: circleD(-9, -35.2, 0.9), fill: '#fff', opacity: 0.85 }), el('path', { d: circleD(11, -35.2, 0.9), fill: '#fff', opacity: 0.85 }));
  const headRot = g({}, g({ filter: tex }, earLP, earRP, face), nose, mouth, mouthOpen, eyes, shine);
  if (harold) headRot.appendChild(shape('M-6 -52 C-3 -55, 3 -55, 6 -52 C3 -48, -3 -48, -6 -52Z', '#f3dcae', { r: R(0.3, 5), opacity: 0.9 }));
  const headPivot = g({ transform: T(0, -58) }, headRot);
  const root = g({ class: 'pup' }, g({ filter: tex }, tailPivot, body), headPivot);
  const parts = { root, headRot, tail, earL: earLP, earR: earRP };
  parts.set = (q = {}) => {
    const { x = 0, y = 0, scale = 1, rot = 0, headRot: hr = 0, headX = 0, headY = 0, earRot = 0, wag = 0, bark = false, shine: sh = false, look = 0, lookY = 0 } = q;
    root.setAttribute('transform', `translate(${x} ${y}) rotate(${rot}) scale(${scale})`);
    headPivot.setAttribute('transform', T(headX, -58 + headY, hr));
    earLP.setAttribute('transform', T(-19, -38, earRot));
    earRP.setAttribute('transform', T(19, -38, -earRot));
    tail.setAttribute('transform', `rotate(${wag})`);
    eyes.setAttribute('transform', T(look, lookY));
    mouthOpen.style.display = bark ? '' : 'none';
    mouth.style.display = bark ? 'none' : '';
    shine.style.display = sh ? '' : 'none';
  };
  parts.set({});
  return parts;
}
