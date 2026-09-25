// The narrator (Harold, 72). Cut-out rig, profile facing right.
// Units: ~720 = standing height. Root origin = ground under the hip.
import { el, g, shape, ellipseD, circleD, T, paintFilter, clipTo, mix } from '../lib/core.js';
import { P } from '../lib/palette.js';

const LEN = { thigh: 188, shin: 188, upper: 140, fore: 120 };
const LINE = { coat: '#1f2626', trousers: '#3f3d39', skin: '#9a6f5c', hair: '#a8a295', shoe: '#2c1c14', scarf: '#4a2522' };

export function narrator(defs, opts = {}) {
  const seed = opts.seed || 11;
  const texCoat = paintFilter(defs, { freq: [0.07, 0.012], strength: 0.2, tooth: 0.1, seed });
  const texCloth = paintFilter(defs, { freq: [0.09, 0.02], strength: 0.18, tooth: 0.1, seed: seed + 1 });
  const texSkin = paintFilter(defs, { freq: 0.06, strength: 0.14, tooth: 0.06, seed: seed + 3 });
  let s = seed;
  const R = (amp = 1.1, wl = 24, more = {}) => ({ amp, wl, seed: ++s, ...more });

  // ------------------------------------------------------------- legs
  function leg(near) {
    const tr = near ? P.trousers : P.trousersDark;
    const trD = near ? P.trousersDark : mix(P.trousersDark, P.ink, 0.25);
    const thigh = g({},
      shape('M-25 -6 C-27 60, -23 130, -20 196 L20 196 C23 130, 26 60, 25 -6 C14 -18, -14 -18, -25 -6Z', tr, { r: R(1.1), line: LINE.trousers }));
    const shin = g({},
      shape('M-20 -8 C-21 60, -18 130, -19 184 L21 186 C19 130, 20 60, 20 -8Z', tr, { r: R(1.1), line: LINE.trousers }),
      shape('M-20 -8 C-21 60, -18 130, -19 184 L-7 184 C-7 130, -9 60, -9 -8Z', trD, { r: R(0.8), opacity: 0.45 }),
      shape('M-21 172 C-8 168, 8 168, 23 175 L23 190 L-21 190Z', trD, { r: R(0.8), opacity: 0.45 }));
    const shoe = g({},
      shape('M-22 -6 C-27 8, -25 21, -14 25 L52 25 C64 25, 66 12, 57 5 C46 -2, 28 -6, 17 -14 L-18 -14Z', near ? P.shoe : P.shoeDark, { r: R(0.8, 14), line: LINE.shoe }),
      shape('M-17 19 L56 19 C62 19, 62 25, 53 26 L-15 26Z', P.shoeDark, { r: R(0.5, 10), opacity: 0.85 }),
      shape('M20 -10 C30 -6, 42 -2, 52 4 C46 1, 32 -2, 24 -6Z', P.shoeLight, { r: R(0.4, 8), opacity: 0.7 }));
    const sock = g({ style: 'display:none' },
      shape('M-18 -8 C-22 8, -20 20, -10 23 L42 23 C53 23, 55 12, 46 6 C36 0, 22 -4, 14 -12 L-14 -12Z', near ? P.sock : P.sockDark, { r: R(0.9, 12), line: '#555' }),
      shape(ellipseD(46, 14, 5.5, 4.5, -10), P.skin, { r: R(0.4, 6) }));
    const ankle = g({ transform: T(0, LEN.shin) }, shoe, sock);
    const knee = g({ transform: T(0, LEN.thigh) }, shin, ankle);
    const hip = g({ filter: texCloth }, thigh, knee);
    return { hip, knee, ankle, shoe, sock };
  }

  // ------------------------------------------------------------- arms
  function arm(near) {
    const c = near ? P.coat : P.coatDark, cd = near ? P.coatDark : mix(P.coatDark, P.ink, 0.3);
    const upper = g({},
      shape('M-21 -12 C-23 40, -20 100, -17 148 L17 148 C20 100, 23 40, 21 -12 C12 -26, -12 -26, -21 -12Z', c, { r: R(1.1), line: LINE.coat }),
      shape('M-21 -12 C-23 40, -20 100, -17 148 L-6 148 C-7 100, -9 40, -7 -18Z', cd, { r: R(0.8), opacity: 0.45 }));
    const hand = g({},
      // mitten with thumb
      shape('M-12 -4 C-15 10, -14 26, -8 36 C-3 44, 6 46, 11 38 C14 30, 14 16, 12 -4Z', near ? P.skin : P.skinDark, { r: R(0.5, 10), line: LINE.skin, lw: 1.3 }),
      shape('M10 2 C18 4, 22 12, 18 20 C16 22, 12 20, 10 16Z', near ? P.skin : P.skinDark, { r: R(0.4, 8), line: LINE.skin, lw: 1.2 }),
      shape('M-10 26 C-6 36, 2 40, 8 38 C2 36, -4 32, -8 24Z', P.skinDark, { r: R(0.3, 8), opacity: 0.6 }));
    const fore = g({},
      shape('M-18 -8 C-18 40, -16 80, -15 116 L16 116 C16 80, 18 40, 18 -8Z', c, { r: R(1.1), line: LINE.coat }),
      shape('M-18 -8 C-18 40, -16 80, -15 116 L-5 116 C-5 80, -7 40, -7 -8Z', cd, { r: R(0.8), opacity: 0.45 }),
      shape('M-16 100 L17 100 L17 120 L-15 120Z', cd, { r: R(0.6), opacity: 0.5 }));
    const handG = g({ filter: texSkin }, hand);
    const wrist = g({ transform: T(0, LEN.fore) }, handG);
    const foreG = g({}, fore, wrist);
    const elbow = g({ transform: T(0, LEN.upper) }, foreG);
    const shoulder = g({ filter: texCoat }, upper, elbow);
    return { shoulder, elbow, foreG, wrist, hand: handG };
  }

  // ------------------------------------------------------------- head
  const head = (() => {
    const skinD = 'M-18 14 C-22 -2, -28 -20, -34 -38 C-44 -66, -36 -100, -8 -112 C12 -120, 32 -106, 36 -88 C38 -80, 37 -75, 39 -71 C42 -66, 44 -62, 48 -56 C54 -50, 60 -44, 62 -38 C64 -32, 58 -29, 53 -31 C49 -32, 46 -30, 45 -27 C46 -22, 45 -16, 43 -12 C44 -4, 38 2, 30 2 C22 3, 14 4, 10 14Z';
    const skin = shape(skinD, P.skin, { r: R(0.6, 16), line: LINE.skin, lw: 1.5 });
    const shade = shape('M-18 14 C-22 0, -26 -16, -30 -30 C-12 -24, 4 -12, 12 4 C11 8, 10 11, 10 14Z', P.skinDark, { r: R(0.5, 12), opacity: 0.5 });
    const blush = el('path', { d: ellipseD(22, -44, 12, 7, -15), fill: P.blush, opacity: 0.28 });
    const noseTip = el('path', { d: ellipseD(56, -38, 7, 5.5, 35), fill: P.nose, opacity: 0.55 });
    const ear = g({},
      shape(ellipseD(-9, -52, 11, 17, 10), P.skin, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }),
      shape('M-9 -63 C-15 -58, -15 -44, -8 -37 C-10 -46, -10 -56, -5 -61Z', P.skinDeep, { r: R(0.3, 6), opacity: 0.6 }));
    const hair = g({},
      shape('M-20 -16 C-40 -30, -50 -64, -42 -92 C-34 -112, -8 -122, 14 -116 C26 -112, 32 -106, 32 -100 C20 -104, 6 -102, -2 -96 C-2 -88, 0 -80, 0 -72 C-8 -74, -16 -72, -20 -64 C-20 -54, -18 -42, -14 -30 C-16 -24, -18 -20, -20 -16Z', P.hair, { r: R(0.9, 10, { tufts: 1.4, tuftLen: 9 }), line: LINE.hair, lw: 1.2 }),
      shape('M-40 -58 C-42 -44, -36 -30, -22 -18 C-30 -30, -34 -44, -36 -60Z', P.hairDark, { r: R(0.5, 8), opacity: 0.8 }),
      el('path', { d: 'M-30 -100 C-14 -110, 4 -112, 22 -106 M-36 -84 C-24 -96, -6 -100, 10 -100', stroke: P.hairDark, 'stroke-width': 1.2, fill: 'none', opacity: 0.8 }));
    const tuft = shape('M-8 -114 C-12 -128, -4 -140, 6 -142 C0 -132, 0 -124, 4 -116Z', P.hair, { r: R(0.4, 6), line: LINE.hair, lw: 1.1, style: 'display:none' });
    const eye = g({},
      el('path', { d: ellipseD(30, -69, 3.3, 3.6), fill: P.ink }),
      el('path', { d: 'M24 -74 C28 -76.5, 33 -76, 36 -73', stroke: LINE.skin, 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round' }));
    const eyeClosed = g({ style: 'display:none' },
      el('path', { d: 'M24 -70 C27 -67, 32 -67, 35 -70', stroke: P.ink, 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
    const lines = el('path', { d: 'M24 -61 C28 -58.5, 33 -58.5, 36 -61 M40 -64 C42 -62, 43 -60, 43 -58 M43 -40 C40 -34, 39 -28, 38 -22', stroke: LINE.skin, 'stroke-width': 1.2, fill: 'none', opacity: 0.6, 'stroke-linecap': 'round' });
    const brow = g({},
      shape('M16 -80 C22 -87, 34 -89, 44 -86 C48 -85, 52 -82, 51 -78 C46 -80, 40 -80, 34 -79 C27 -78, 20 -77, 16 -80Z', P.hair, { r: R(0.7, 6, { tufts: 1.6, tuftLen: 5 }), line: LINE.hair, lw: 1.1 }));
    const mous = g({},
      shape('M34 -30 C42 -38, 54 -37, 60 -31 C64 -25, 62 -16, 56 -11 C53 -17, 49 -20, 44 -20 C39 -19, 35 -19, 31 -21 C30 -25, 31 -28, 34 -30Z', P.hair, { r: R(0.7, 7, { tufts: 1.3, tuftLen: 4.5 }), line: LINE.hair, lw: 1.1 }),
      shape('M40 -21 C46 -23, 52 -20, 56 -12 C50 -16, 46 -18, 40 -21Z', P.hairDark, { r: R(0.4, 5), opacity: 0.9 }));
    const glasses = g({ style: 'display:none' },
      el('path', { d: 'M28 -68 L48 -67 C48 -61, 42 -58, 37 -58 C32 -58, 28 -62, 28 -68Z', fill: '#dfe3df', 'fill-opacity': 0.25, stroke: '#3b302a', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }),
      el('path', { d: 'M28 -67 L-2 -62', stroke: '#3b302a', 'stroke-width': 2, fill: 'none' }));
    const faceG = g({ filter: texSkin }, skin, shade, blush, noseTip, ear, lines);
    const slot = g({ transform: T(-6, -112) });
    const root = g({}, faceG, g({ filter: texSkin }, hair, tuft), eye, eyeClosed, brow, mous, glasses, slot);
    return { root, eye, eyeClosed, brow, tuft, mous, glasses, slot };
  })();

  // ------------------------------------------------------------- torso / coat
  const upperD = 'M-30 -200 C-48 -186, -60 -150, -56 -112 C-52 -76, -44 -40, -44 0 L-46 30 L58 30 L56 0 C58 -50, 54 -110, 42 -160 C36 -182, 26 -198, 18 -206 C2 -212, -18 -208, -30 -200Z';
  const skirtStandD = 'M-44 -10 C-46 80, -54 170, -62 262 C-30 268, 14 268, 50 262 C52 180, 54 80, 56 -10Z';
  const skirtSitD = 'M-44 -30 C-58 0, -80 14, -96 26 C-60 34, 60 36, 150 30 C178 26, 196 12, 198 -10 C200 -22, 186 -30, 170 -30 C120 -34, 80 -40, 56 -40Z';
  const upperClip = clipTo(defs, upperD);
  const buttonsPos = [-150, -104, -58, -12, 34];
  const buttons = buttonsPos.map(y => g({},
    el('path', { d: circleD(49 + Math.max(0, (y + 150)) * 0.02, y, 4.6), fill: P.button }),
    el('path', { d: circleD(48 + Math.max(0, (y + 150)) * 0.02, y - 1.4, 1.5), fill: '#6a615b', opacity: 0.8 })));
  const skirtStand = g({},
    shape(skirtStandD, P.coat, { r: R(1.2, 30), line: LINE.coat }),
    shape('M-44 -10 C-46 80, -54 170, -62 262 L-36 264 C-32 180, -28 80, -26 -10Z', P.coatDark, { r: R(1.5, 30), opacity: 0.7 }),
    shape('M-60 226 C-20 232, 20 232, 52 226 L50 262 C14 268, -30 268, -62 262Z', P.coatDark, { r: R(1.5, 30), opacity: 0.55 }),
    el('path', { d: 'M46 -8 C48 70, 48 170, 45 262', stroke: P.coatDark, 'stroke-width': 3, fill: 'none', opacity: 0.8 }),
    el('path', { d: 'M-46 150 C-49 190, -53 230, -57 262', stroke: P.coatDark, 'stroke-width': 2.5, fill: 'none', opacity: 0.8 }),
    shape('M4 50 L42 48 L43 60 L5 62Z', P.coatDark, { r: R(0.6, 10), opacity: 0.8 }));
  const skirtSit = g({ style: 'display:none' },
    shape(skirtSitD, P.coat, { r: R(1.2, 30), line: LINE.coat }),
    shape('M-96 26 C-60 34, 60 36, 150 30 C178 26, 196 12, 198 -10 C170 8, 60 14, -60 14Z', P.coatDark, { r: R(1.5, 30), opacity: 0.6 }),
    el('path', { d: 'M40 -34 C80 -30, 140 -26, 190 -18 M20 -8 C60 -4, 110 0, 160 4', stroke: P.coatDark, 'stroke-width': 3, fill: 'none', opacity: 0.7 }));
  const chestSlot = g({ transform: T(36, -132) });
  const chestFlap = g({ filter: texCoat, style: 'display:none' },
    shape('M-4 -114 C16 -120, 40 -118, 58 -108 L60 -40 C40 -46, 12 -46, -4 -40Z', P.coat, { r: R(1, 16), line: LINE.coat }),
    el('path', { d: 'M-2 -110 C16 -116, 40 -114, 58 -106', stroke: P.coatDark, 'stroke-width': 4, fill: 'none', opacity: 0.8 }));
  const torso = g({},
    g({ filter: texCoat },
      shape(upperD, P.coat, { r: R(1.2, 30), line: LINE.coat }),
      g({ 'clip-path': upperClip },
        shape('M-70 -220 C-50 -150, -40 -60, -38 40 L-90 40 L-90 -220Z', P.coatDark, { r: R(2, 30), opacity: 0.75 }),
        shape('M20 -202 C40 -170, 52 -120, 54 -60 C50 -110, 42 -160, 28 -192Z', P.coatLight, { r: R(1, 20), opacity: 0.8 }),
        el('path', { d: 'M40 -172 C48 -110, 50 -40, 48 30', stroke: P.coatDark, 'stroke-width': 3, fill: 'none', opacity: 0.8 }),
        el('path', { d: 'M-50 -6 C-10 -2, 30 -2, 60 -8', stroke: P.coatDark, 'stroke-width': 2, fill: 'none', opacity: 0.5 }))),
    chestSlot,
    chestFlap,
    g({ class: 'buttons' }, buttons),
    g({ filter: texCloth },
      shape('M-36 -196 C-42 -214, -32 -232, -12 -234 L20 -226 C28 -216, 30 -206, 26 -200 C8 -208, -14 -208, -36 -196Z', P.coatDark, { r: R(0.8, 12), line: LINE.coat }),
      shape('M-28 -214 C-10 -224, 14 -224, 34 -212 C36 -204, 34 -198, 30 -194 C10 -204, -12 -206, -30 -200Z', P.scarf, { r: R(0.8, 10), line: LINE.scarf }),
      shape('M26 -208 C38 -198, 42 -178, 40 -150 C38 -140, 32 -138, 28 -146 C30 -166, 28 -186, 20 -202Z', P.scarf, { r: R(0.8, 10), line: LINE.scarf }),
      shape('M28 -150 C32 -146, 38 -146, 40 -150 L41 -136 C36 -132, 30 -132, 27 -136Z', P.scarfDark, { r: R(0.5, 6, { tufts: 1, tuftLen: 3 }) })));

  // ------------------------------------------------------------- assembly
  const legF = leg(false), legN = leg(true);
  const armF = arm(false), armN = arm(true);
  const headG = g({}, head.root);
  const shoulderPos = [6, -168], neckPos = [8, -204];
  const shoulderF = g({ transform: T(...shoulderPos) }, armF.shoulder);
  const shoulderN = g({ transform: T(...shoulderPos) }, armN.shoulder);
  const neck = g({ transform: T(...neckPos) }, headG);
  const torsoG = g({}, shoulderF, neck, torso, shoulderN);
  const skirtG = g({ filter: texCoat }, skirtStand, skirtSit);
  const hip = g({}, legF.hip, legN.hip, skirtG, torsoG);
  const root = g({ class: 'narrator' }, hip);

  const rig = {
    root, hip, torsoG, headG, neck, head, legF, legN, armF, armN, buttons, skirtStand, skirtSit,
    slots: { head: head.slot, chest: chestSlot }, chestFlap,
    set(p) {
      const q = { ...STAND, ...p };
      root.setAttribute('transform', `translate(${q.x} ${q.y}) rotate(${q.rot}) scale(${q.scale * q.flip} ${q.scale})`);
      hip.setAttribute('transform', T(q.hipX, q.hipY));
      torsoG.setAttribute('transform', T(0, 0, q.lean));
      headG.setAttribute('transform', T(0, 0, q.head));
      skirtStand.style.display = q.sit ? 'none' : '';
      skirtSit.style.display = q.sit ? '' : 'none';
      legF.hip.setAttribute('transform', T(-4, 0, q.thighF)); legF.knee.setAttribute('transform', T(0, LEN.thigh, q.shinF)); legF.ankle.setAttribute('transform', T(0, LEN.shin, q.footF));
      legN.hip.setAttribute('transform', T(4, 0, q.thighN)); legN.knee.setAttribute('transform', T(0, LEN.thigh, q.shinN)); legN.ankle.setAttribute('transform', T(0, LEN.shin, q.footN));
      const [fa0, fa1, fa2, faS = 1] = q.armF, [na0, na1, na2, naS = 1] = q.armN;
      armF.shoulder.setAttribute('transform', T(-8, 0, fa0)); armF.elbow.setAttribute('transform', T(0, LEN.upper, fa1)); armF.foreG.setAttribute('transform', `scale(1 ${faS})`); armF.wrist.setAttribute('transform', `translate(0 ${LEN.fore}) scale(1 ${1 / faS}) rotate(${fa2})`);
      armN.shoulder.setAttribute('transform', T(0, 0, na0)); armN.elbow.setAttribute('transform', T(0, LEN.upper, na1)); armN.foreG.setAttribute('transform', `scale(1 ${naS})`); armN.wrist.setAttribute('transform', `translate(0 ${LEN.fore}) scale(1 ${1 / naS}) rotate(${na2})`);
      if (q.armsBehind) { if (shoulderN.parentNode !== torsoG || shoulderN.nextSibling !== neck) torsoG.insertBefore(shoulderN, neck); }
      else if (torsoG.lastChild !== shoulderN) torsoG.appendChild(shoulderN);
      head.brow.setAttribute('transform', T(0, -q.brow, q.browTilt));
      head.eye.style.display = q.eyes === 'closed' ? 'none' : '';
      head.eyeClosed.style.display = q.eyes === 'closed' ? '' : 'none';
      head.tuft.style.display = q.tuft ? '' : 'none';
      head.glasses.style.display = q.glasses ? '' : 'none';
      const leftLeg = q.flip < 0 ? legN : legF; // facing left shows his left side
      leftLeg.shoe.style.display = q.shoeless ? 'none' : '';
      leftLeg.sock.style.display = q.shoeless ? '' : 'none';
      buttons.forEach((b, i) => b.style.display = i < q.buttons ? '' : 'none');
      chestFlap.style.display = q.chestPup ? '' : 'none';
    },
  };
  return rig;
}

export const STAND = {
  x: 0, y: 0, scale: 1, flip: 1, rot: 0, sit: false,
  hipX: 0, hipY: -(LEN.thigh + LEN.shin + 26), lean: 7, head: 6,
  thighF: -3, shinF: 2, footF: 1, thighN: 3, shinN: -2, footN: -1,
  // [shoulder, elbow, wrist, forearm-foreshortening]
  armF: [14, 70, 10, 0.5], armN: [16, 74, 16, 0.5],
  brow: 0, browTilt: 0, eyes: 'open', tuft: false, shoeless: false, buttons: 5, glasses: false, armsBehind: false, chestPup: false,
};
// sitting on the ground, legs out in front
export const SIT = {
  sit: true, hipY: -34, lean: -4, head: 2,
  thighF: -88, shinF: 4, footF: -4, thighN: -84, shinN: 2, footN: -8,
  armF: [-30, -50, 0, 1], armN: [-34, -46, -10, 1],
};
export const LEGLEN = LEN;
