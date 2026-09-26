// The narrator (Harold, 72). Cut-out rig, profile facing right.
// Units: ~720 = standing height. Root origin = ground under the hip.
import { el, g, shape, ellipseD, circleD, T, paintFilter, clipTo, mix, uid } from '../lib/core.js';
import { P } from '../lib/palette.js';
import { limb } from './limbs.js';

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
      head.mous.setAttribute('transform', q.talk ? `translate(0 ${(-1.5 - q.talk * 2.5).toFixed(2)}) rotate(${(-q.talk * 3).toFixed(2)} 36 -24)` : '');
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
  brow: 0, browTilt: 0, eyes: 'open', tuft: false, shoeless: false, buttons: 5, glasses: false, armsBehind: false, chestPup: false, talk: 0,
};
// sitting on the ground, legs out in front
export const SIT = {
  sit: true, hipY: -34, lean: -4, head: 2,
  thighF: -88, shinF: 4, footF: -4, thighN: -84, shinN: 2, footN: -8,
  armF: [-30, -50, 0, 1], armN: [-34, -46, -10, 1],
};
export const LEGLEN = LEN;

// ============================================================== FRONT VIEW
// Standing, facing camera. Units 400 = 1 m, origin = between the feet.
// Options: blanket (tartan cape clutched at the chest), shoeless (his left =
// screen right), buttons (how many survive), tuft, glasses.
export function narratorFront(defs, opts = {}) {
  const seed = opts.seed || 71;
  const texCoat = paintFilter(defs, { freq: [0.07, 0.012], strength: 0.2, tooth: 0.1, seed });
  const texCloth = paintFilter(defs, { freq: [0.09, 0.02], strength: 0.18, tooth: 0.1, seed: seed + 1 });
  const texSkin = paintFilter(defs, { freq: 0.06, strength: 0.14, tooth: 0.06, seed: seed + 3 });
  let s = seed * 3;
  const R = (amp = 1.1, wl = 24, more = {}) => ({ amp, wl, seed: ++s, ...more });
  // tartan for the blanket
  const tid = uid('tartan');
  defs.appendChild(el('pattern', { id: tid, width: 72, height: 72, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(4)' },
    el('rect', { width: 72, height: 72, fill: '#6f4a3f' }),
    el('rect', { x: 0, y: 22, width: 72, height: 18, fill: '#434a3e', opacity: 0.55 }),
    el('rect', { x: 22, y: 0, width: 18, height: 72, fill: '#434a3e', opacity: 0.4 }),
    el('rect', { x: 0, y: 54, width: 72, height: 2.5, fill: '#cdbf9f', opacity: 0.32 }),
    el('rect', { x: 54, y: 0, width: 2.5, height: 72, fill: '#cdbf9f', opacity: 0.25 }),
    el('rect', { x: 0, y: 10, width: 72, height: 2, fill: '#2c2a26', opacity: 0.3 })));

  // legs & feet
  const shoeD = x => `M${x - 24} -4 C${x - 26} -18, ${x - 14} -26, ${x} -26 C${x + 14} -26, ${x + 26} -18, ${x + 24} -4 C${x + 20} 4, ${x - 20} 4, ${x - 24} -4Z`;
  const legs = g({ filter: texCloth },
    shape('M-46 -150 L-44 -22 L-6 -22 L-4 -150Z', P.trousers, { r: R(1), line: LINE.trousers }),
    shape('M4 -150 L6 -22 L44 -22 L46 -150Z', P.trousers, { r: R(1), line: LINE.trousers }),
    shape('M-46 -150 L-44 -22 L-32 -22 L-34 -150Z', P.trousersDark, { r: R(0.6), opacity: 0.5 }),
    shape('M34 -150 L32 -22 L44 -22 L46 -150Z', P.trousersDark, { r: R(0.6), opacity: 0.5 }));
  const shoeR = shape(shoeD(-27), P.shoe, { r: R(0.6, 10), line: LINE.shoe });
  const shoeL = shape(shoeD(27), P.shoe, { r: R(0.6, 10), line: LINE.shoe });
  const sockL = g({ style: 'display:none' },
    shape(`M4 -6 C2 -20, 12 -26, 27 -26 C42 -26, 50 -18, 49 -6 C46 2, 8 2, 4 -6Z`, P.sock, { r: R(0.7, 10), line: '#555' }),
    shape(ellipseD(27, -3, 6, 4), P.skin, { r: R(0.3, 6) }));
  // coat
  const coatD = 'M-66 -560 C-74 -520, -72 -420, -68 -330 C-66 -260, -70 -200, -76 -140 C-40 -132, 40 -132, 76 -140 C70 -200, 66 -260, 68 -330 C72 -420, 74 -520, 66 -560 C40 -574, -40 -574, -66 -560Z';
  const coat = g({ filter: texCoat },
    shape(coatD, P.coat, { r: R(1.2, 30), line: LINE.coat }),
    shape('M-66 -560 C-74 -520, -72 -420, -68 -330 C-66 -260, -70 -200, -76 -140 L-52 -138 C-50 -220, -50 -330, -50 -460Z', P.coatDark, { r: R(1, 30), opacity: 0.5 }),
    shape('M-76 -168 C-40 -160, 40 -160, 76 -168 L76 -140 C40 -132, -40 -132, -76 -140Z', P.coatDark, { r: R(1, 30), opacity: 0.5 }),
    el('path', { d: 'M4 -470 L2 -140', stroke: P.coatDark, 'stroke-width': 3.5, opacity: 0.85 }),
    // lapels
    shape('M-40 -566 L-8 -470 L-2 -470 L-26 -560Z', P.coatDark, { r: R(0.6, 12), opacity: 0.8 }),
    shape('M40 -566 L8 -470 L2 -470 L26 -560Z', P.coatDark, { r: R(0.6, 12), opacity: 0.8 }),
    shape('M-56 -300 L-24 -302 L-24 -290 L-56 -288Z', P.coatDark, { r: R(0.5, 10), opacity: 0.7 }),
    shape('M24 -302 L56 -300 L56 -288 L24 -290Z', P.coatDark, { r: R(0.5, 10), opacity: 0.7 }));
  const btnY = [-450, -400, -350, -300, -250];
  const buttons = btnY.map(y => g({}, el('path', { d: circleD(10, y, 5), fill: P.button }), el('path', { d: circleD(9, y - 1.5, 1.6), fill: '#6a615b', opacity: 0.8 })));
  // loose threads where buttons were
  const threads = btnY.map(y => el('path', { d: `M8 ${y} l4 5 M11 ${y - 2} l-3 6`, stroke: '#2a2522', 'stroke-width': 1.2, opacity: 0.8, style: 'display:none' }));
  // shirt, tie, scarf
  const chest = g({ filter: texCloth },
    shape('M-24 -566 L0 -480 L24 -566Z', '#d9d4c7', { r: R(0.5, 10) }),
    shape('M-5 -548 L5 -548 L7 -490 L0 -480 L-7 -490Z', '#4a4f5e', { r: R(0.4, 8) }),
    shape('M-48 -588 C-30 -600, 30 -600, 48 -588 C50 -574, 44 -562, 36 -558 C12 -566, -12 -566, -36 -558 C-44 -562, -50 -574, -48 -588Z', P.scarf, { r: R(0.8, 12), line: LINE.scarf }),
    shape('M16 -566 C22 -540, 24 -510, 22 -476 L40 -478 C40 -512, 36 -544, 30 -566Z', P.scarf, { r: R(0.7, 10), line: LINE.scarf }),
    shape('M22 -484 L40 -486 L41 -470 L22 -468Z', P.scarfDark, { r: R(0.5, 6, { tufts: 1, tuftLen: 3 }) }));
  // arms (sleeves hanging) + hands
  const armD = sx => `M${sx * 60} -556 C${sx * 80} -540, ${sx * 90} -470, ${sx * 90} -400 C${sx * 90} -370, ${sx * 88} -345, ${sx * 86} -330 L${sx * 62} -330 C${sx * 64} -380, ${sx * 64} -440, ${sx * 58} -500Z`;
  const arms = g({ filter: texCoat },
    shape(armD(-1), P.coat, { r: R(1, 20), line: LINE.coat }), shape(armD(1), P.coat, { r: R(1, 20), line: LINE.coat }),
    shape('M-90 -400 C-90 -370, -88 -345, -86 -330 L-62 -330 C-64 -350, -64 -380, -66 -400Z', P.coatDark, { r: R(0.6, 12), opacity: 0.45 }),
    shape('M90 -400 C90 -370, 88 -345, 86 -330 L62 -330 C64 -350, 64 -380, 66 -400Z', P.coatDark, { r: R(0.6, 12), opacity: 0.45 }));
  const handD = sx => `M${sx * 64} -334 C${sx * 62} -316, ${sx * 64} -296, ${sx * 72} -286 C${sx * 80} -280, ${sx * 90} -284, ${sx * 90} -298 C${sx * 92} -312, ${sx * 90} -326, ${sx * 86} -334Z`;
  const hands = g({ filter: texSkin }, shape(handD(-1), P.skin, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }), shape(handD(1), P.skin, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }));
  // head (front)
  const face = g({ filter: texSkin },
    shape(ellipseD(-43, -650, 9, 16, -10), P.skin, { r: R(0.4, 8), line: LINE.skin, lw: 1.2 }),
    shape(ellipseD(43, -650, 9, 16, 10), P.skin, { r: R(0.4, 8), line: LINE.skin, lw: 1.2 }),
    el('path', { d: 'M-45 -660 C-48 -652, -47 -644, -43 -638 M45 -660 C48 -652, 47 -644, 43 -638', stroke: P.skinDeep, 'stroke-width': 1.6, fill: 'none', opacity: 0.6 }),
    shape('M-38 -640 C-42 -686, -26 -718, 0 -718 C26 -718, 42 -686, 38 -640 C36 -610, 22 -588, 0 -586 C-22 -588, -36 -610, -38 -640Z', P.skin, { r: R(0.6, 14), line: LINE.skin, lw: 1.4 }),
    shape('M-38 -640 C-36 -612, -24 -592, -8 -588 C-20 -598, -30 -616, -32 -644Z', P.skinDark, { r: R(0.4, 10), opacity: 0.45 }),
    el('path', { d: ellipseD(-22, -634, 10, 7), fill: P.blush, opacity: 0.28 }), el('path', { d: ellipseD(22, -634, 10, 7), fill: P.blush, opacity: 0.28 }),
    el('path', { d: 'M-20 -700 C-8 -703, 8 -703, 20 -700 M-16 -692 C-6 -694, 6 -694, 16 -692', stroke: LINE.skin, 'stroke-width': 1.1, fill: 'none', opacity: 0.4 }),
    // nose: narrow bridge, soft bulb
    shape('M-5 -672 C-6 -660, -9 -648, -12 -636 C-15 -626, -10 -618, -3 -619 C-1 -616, 1 -616, 3 -619 C10 -618, 15 -626, 12 -636 C9 -648, 6 -660, 5 -672Z', P.skin, { r: R(0.35, 8), line: LINE.skin, lw: 1.2 }),
    shape('M-5 -672 C-6 -660, -9 -648, -12 -636 C-14 -630, -12 -624, -8 -621 C-8 -632, -5 -652, -2 -670Z', P.skinDark, { r: R(0.3, 8), opacity: 0.5 }),
    el('path', { d: ellipseD(0, -628, 8, 6.5), fill: P.nose, opacity: 0.5 }),
    el('path', { d: 'M-7 -621 C-5 -619, -3 -619, -2 -620 M2 -620 C3 -619, 5 -619, 7 -621', stroke: LINE.skin, 'stroke-width': 1.4, fill: 'none', opacity: 0.8 }),
    el('path', { d: 'M-27 -662 C-23 -659, -17 -659, -13 -662 M13 -662 C17 -659, 23 -659, 27 -662', stroke: LINE.skin, 'stroke-width': 1.2, fill: 'none', opacity: 0.55 }));
  const hairF = g({ filter: texSkin },
    shape('M-36 -628 C-44 -648, -44 -680, -34 -700 C-32 -690, -33 -664, -30 -640Z', P.hair, { r: R(0.6, 7, { tufts: 1.3, tuftLen: 5 }), line: LINE.hair, lw: 1 }),
    shape('M36 -628 C44 -648, 44 -680, 34 -700 C32 -690, 33 -664, 30 -640Z', P.hair, { r: R(0.6, 7, { tufts: 1.3, tuftLen: 5 }), line: LINE.hair, lw: 1 }),
    el('path', { d: 'M-18 -714 C-8 -722, 8 -722, 20 -712 M-10 -718 C0 -726, 12 -724, 18 -718', stroke: P.hair, 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }));
  const tuftF = shape('M-4 -716 C-10 -732, -2 -746, 8 -748 C2 -738, 2 -728, 6 -718Z', P.hair, { r: R(0.4, 6), line: LINE.hair, lw: 1.1, style: 'display:none' });
  const eyesF = g({}, el('path', { d: ellipseD(-18, -668, 3.4, 3.7), fill: P.ink }), el('path', { d: ellipseD(18, -668, 3.4, 3.7), fill: P.ink }),
    el('path', { d: 'M-24 -674 C-20 -676, -15 -676, -12 -673 M12 -673 C15 -676, 20 -676, 24 -674', stroke: LINE.skin, 'stroke-width': 1.4, fill: 'none' }));
  const eyesShutF = g({ style: 'display:none' }, el('path', { d: 'M-23 -667 C-20 -664, -16 -664, -13 -667 M13 -667 C16 -664, 20 -664, 23 -667', stroke: P.ink, 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
  const browsF = g({},
    shape('M-34 -682 C-28 -690, -14 -692, -6 -686 C-8 -682, -14 -680, -20 -680 C-26 -680, -30 -679, -34 -682Z', P.hair, { r: R(0.6, 5, { tufts: 1.5, tuftLen: 5 }), line: LINE.hair, lw: 1 }),
    shape('M34 -682 C28 -690, 14 -692, 6 -686 C8 -682, 14 -680, 20 -680 C26 -680, 30 -679, 34 -682Z', P.hair, { r: R(0.6, 5, { tufts: 1.5, tuftLen: 5 }), line: LINE.hair, lw: 1 }));
  const mousF = g({},
    shape('M-4 -618 C-14 -622, -30 -618, -34 -604 C-34 -594, -28 -588, -22 -590 C-18 -598, -10 -602, 0 -602 C10 -602, 18 -598, 22 -590 C28 -588, 34 -594, 34 -604 C30 -618, 14 -622, 4 -618 C2 -616, -2 -616, -4 -618Z', P.hair, { r: R(0.7, 6, { tufts: 1.3, tuftLen: 4.5 }), line: LINE.hair, lw: 1.1 }),
    shape('M-20 -600 C-10 -604, 10 -604, 20 -600 C10 -598, -10 -598, -20 -600Z', P.hairDark, { r: R(0.3, 5), opacity: 0.8 }));
  const glassesF = g({ style: 'display:none' },
    el('path', { d: 'M-30 -660 L-8 -660 C-8 -652, -12 -648, -19 -648 C-26 -648, -30 -652, -30 -660Z M8 -660 L30 -660 C30 -652, 26 -648, 19 -648 C12 -648, 8 -652, 8 -660Z', fill: '#dfe3df', 'fill-opacity': 0.2, stroke: '#3b302a', 'stroke-width': 2.2 }),
    el('path', { d: 'M-8 -658 L8 -658', stroke: '#3b302a', 'stroke-width': 2 }));
  const headG = g({}, face, hairF, tuftF, eyesF, eyesShutF, browsF, mousF, glassesF);
  const headPiv = g({}, headG);
  // blanket: cape over shoulders, clutched at the chest by his right hand
  const blanket = g({ style: 'display:none' },
    g({ filter: texCloth },
      shape('M-92 -556 C-64 -596, 64 -596, 92 -556 C106 -480, 112 -360, 110 -236 C84 -228, 60 -232, 36 -240 C22 -330, 12 -420, 6 -500 L-6 -500 C-12 -420, -22 -330, -36 -240 C-60 -232, -84 -228, -110 -236 C-112 -360, -106 -480, -92 -556Z', `url(#${tid})`, { r: R(1.4, 26, { tufts: 1.6, tuftLen: 5 }), line: '#3a2420', lw: 1.8 }),
      shape('M-92 -556 C-106 -480, -112 -360, -110 -236 C-100 -232, -94 -234, -86 -236 C-90 -360, -92 -470, -80 -548Z', '#2e1c18', { r: R(0.8, 20), opacity: 0.3 }),
      shape('M92 -556 C106 -480, 112 -360, 110 -236 C104 -232, 98 -234, 92 -236 C96 -360, 98 -470, 86 -548Z', '#2e1c18', { r: R(0.8, 20), opacity: 0.2 }),
      el('path', { d: 'M-48 -566 C-40 -500, -44 -410, -56 -300 M48 -566 C40 -500, 44 -410, 56 -300 M-6 -500 C-12 -420, -22 -330, -36 -240 M6 -500 C12 -420, 22 -330, 36 -240', stroke: '#2e1c18', 'stroke-width': 3, opacity: 0.3, fill: 'none' })),
    g({ filter: texSkin }, shape('M-14 -520 C-22 -508, -20 -488, -10 -482 C0 -478, 12 -482, 15 -492 C17 -504, 11 -518, 0 -522Z', P.skin, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }),
      el('path', { d: 'M-8 -506 C-2 -504, 6 -504, 12 -507 M-9 -496 C-3 -494, 5 -494, 12 -497', stroke: LINE.skin, 'stroke-width': 1.1, fill: 'none', opacity: 0.6 })));
  const finger = g({ filter: texSkin, style: 'display:none' }, shape('M3 -516 C2 -532, 3 -552, 6 -562 C8 -566, 13 -566, 14 -561 C15 -550, 14 -532, 13 -516Z', P.skin, { r: R(0.25, 6), line: LINE.skin, lw: 1.2 }), el('path', { d: 'M7 -560 C8 -557, 11 -557, 12 -560', stroke: LINE.skin, 'stroke-width': 1, fill: 'none', opacity: 0.7 }));
  blanket.appendChild(finger);
  const root = g({ class: 'narrator-front' }, legs, shoeR, shoeL, sockL, coat, g({}, buttons), g({}, threads), chest, arms, hands, headPiv, blanket);
  return {
    root, head: headPiv,
    set(q = {}) {
      const { x = 0, y = 0, scale = 1, rot = 0, headTilt = 0, headY = 0, shoeless = false, nButtons = 5, tuft = false, glasses = false, blanket: bl = false, brow = 0, look = [0, 0], talk = 0, sway = 0, point = false, blink = false, frown = 0 } = q;
      root.setAttribute('transform', `translate(${x} ${y}) rotate(${rot + sway}) scale(${scale})`);
      headPiv.setAttribute('transform', `translate(0 ${headY}) rotate(${headTilt} 0 -590)`);
      shoeL.style.display = shoeless ? 'none' : ''; sockL.style.display = shoeless ? '' : 'none';
      // buttons lost from the middle outwards: keep top and bottom first
      const keep = [0, 4, 2, 1, 3].slice(0, nButtons);
      buttons.forEach((b, i) => b.style.display = keep.includes(i) ? '' : 'none');
      threads.forEach((t, i) => t.style.display = keep.includes(i) ? 'none' : '');
      tuftF.style.display = tuft ? '' : 'none';
      glassesF.style.display = glasses ? '' : 'none';
      blanket.style.display = bl ? '' : 'none';
      hands.style.display = bl ? 'none' : '';
      arms.style.display = bl ? 'none' : '';
      browsF.setAttribute('transform', T(0, -brow));
      browsF.children[0].setAttribute('transform', frown ? `rotate(${-frown * 6} -20 -684)` : '');
      browsF.children[1].setAttribute('transform', frown ? `rotate(${frown * 6} 20 -684)` : '');
      finger.style.display = point ? '' : 'none';
      eyesF.style.display = blink ? 'none' : '';
      eyesShutF.style.display = blink ? '' : 'none';
      eyesF.setAttribute('transform', T(look[0], look[1]));
      mousF.setAttribute('transform', talk ? `translate(0 ${(-1 - talk * 2).toFixed(2)})` : '');
    },
  };
}

// ============================================================== BACK VIEW
// Seen from behind (climbing out, facing the wall). Units 400 = 1 m, origin =
// between the feet. The arms are two-point limbs so the hands can be put
// exactly where the helpers are holding them. Groups: `upper` (coat, arms,
// head) pivots at the hips so he can tip over the edge; `legs` hang below it.
export function narratorBack(defs, opts = {}) {
  const seed = opts.seed || 91;
  const texCoat = paintFilter(defs, { freq: [0.07, 0.012], strength: 0.2, tooth: 0.1, seed });
  const texCloth = paintFilter(defs, { freq: [0.09, 0.02], strength: 0.18, tooth: 0.1, seed: seed + 1 });
  const texSkin = paintFilter(defs, { freq: 0.06, strength: 0.14, tooth: 0.06, seed: seed + 3 });
  let s = seed * 5;
  const R = (amp = 1.1, wl = 24, more = {}) => ({ amp, wl, seed: ++s, ...more });
  const HIP = -330;
  // legs: trousers from under the coat to the heel; his left (screen left) is in a sock
  function legBack(side, sock) {
    const x = side * 25;
    const trouser = shape(`M${x - 21} ${HIP + 40} L${x - 19} -18 L${x + 19} -18 L${x + 21} ${HIP + 40}Z`, P.trousers, { r: R(1), line: LINE.trousers });
    const crease = shape(`M${x - 21} ${HIP + 40} L${x - 19} -18 L${x - 8} -18 L${x - 9} ${HIP + 40}Z`, P.trousersDark, { r: R(0.6), opacity: 0.5 });
    const heel = sock
      ? g({}, shape(`M${x - 17} -26 C${x - 20} -8, ${x - 14} 3, ${x} 3 C${x + 14} 3, ${x + 20} -8, ${x + 17} -26Z`, P.sock, { r: R(0.6, 8), line: '#555' }),
        el('path', { d: `M${x - 12} -8 C${x - 6} -3, ${x + 6} -3, ${x + 12} -8`, stroke: P.sockDark, 'stroke-width': 3, fill: 'none', opacity: 0.8 }))
      : g({}, shape(`M${x - 21} -28 C${x - 24} -8, ${x - 16} 5, ${x} 5 C${x + 16} 5, ${x + 24} -8, ${x + 21} -28Z`, P.shoe, { r: R(0.6, 8), line: LINE.shoe }),
        shape(`M${x - 19} -4 C${x - 12} 4, ${x + 12} 4, ${x + 19} -4 L${x + 18} 4 C${x + 10} 8, ${x - 10} 8, ${x - 18} 4Z`, P.shoeDark, { r: R(0.4, 6) }));
    return g({ filter: texCloth }, trouser, crease, heel);
  }
  const legL = legBack(-1, true), legR = legBack(1, false);
  const legs = g({}, legL, legR);
  // coat, from behind: centre seam, vent, half-belt
  const coatD = 'M-66 -560 C-74 -520, -72 -420, -68 -330 C-66 -260, -70 -200, -76 -140 C-40 -132, 40 -132, 76 -140 C70 -200, 66 -260, 68 -330 C72 -420, 74 -520, 66 -560 C40 -574, -40 -574, -66 -560Z';
  const coat = g({ filter: texCoat },
    shape(coatD, P.coat, { r: R(1.2, 30), line: LINE.coat }),
    shape('M-66 -560 C-74 -520, -72 -420, -68 -330 C-66 -260, -70 -200, -76 -140 L-50 -138 C-48 -220, -48 -330, -48 -470Z', P.coatDark, { r: R(1, 30), opacity: 0.55 }),
    shape('M66 -560 C74 -520, 72 -420, 68 -330 C66 -260, 70 -200, 76 -140 L56 -138 C54 -220, 54 -330, 56 -470Z', P.coatDark, { r: R(1, 30), opacity: 0.35 }),
    el('path', { d: 'M0 -556 L1 -250', stroke: P.coatDark, 'stroke-width': 3.5, opacity: 0.85 }),
    // vent: the right panel overlaps the left
    shape('M1 -250 L-2 -140 L20 -138 L14 -250Z', P.coatDark, { r: R(0.5, 12), opacity: 0.45 }),
    el('path', { d: 'M1 -250 L-2 -140', stroke: '#1c2222', 'stroke-width': 2.5, opacity: 0.9 }),
    shape('M-62 -356 L62 -356 L62 -330 L-62 -330Z', P.coatDark, { r: R(0.6, 16), opacity: 0.8 }),
    el('path', { d: circleD(-50, -343, 5), fill: P.button }), el('path', { d: circleD(50, -343, 5), fill: P.button }),
    shape('M-76 -168 C-40 -160, 40 -160, 76 -168 L76 -140 C40 -132, -40 -132, -76 -140Z', P.coatDark, { r: R(1, 30), opacity: 0.45 }));
  // collar and the back of the scarf
  const collar = g({ filter: texCloth },
    shape('M-50 -592 C-30 -604, 30 -604, 50 -592 C54 -578, 50 -562, 44 -556 C20 -562, -20 -562, -44 -556 C-50 -562, -54 -578, -50 -592Z', P.scarf, { r: R(0.8, 12), line: LINE.scarf }),
    shape('M-60 -566 C-40 -576, 40 -576, 60 -566 L64 -548 C40 -556, -40 -556, -64 -548Z', P.coatDark, { r: R(0.7, 14), line: LINE.coat }));
  // the back of his head: mostly bald crown; a horseshoe of grey-white hair
  // hugging the back from ear to ear; the neck going down into his collar
  const head = g({},
    g({ filter: texSkin },
      shape('M-17 -616 L-15 -588 L15 -588 L17 -616Z', P.skinDark, { r: R(0.3, 6), line: LINE.skin, lw: 1 }),
      shape('M-38 -656 C-42 -696, -26 -724, 0 -724 C26 -724, 42 -696, 38 -656 C36 -634, 22 -618, 0 -616 C-22 -618, -36 -634, -38 -656Z', P.skin, { r: R(0.6, 14), line: LINE.skin, lw: 1.4 }),
      shape('M-30 -700 C-20 -712, 20 -712, 30 -700 C24 -690, -24 -690, -30 -700Z', '#f3dcc8', { r: R(0.3, 10), opacity: 0.45 })),
    shape('M-40 -670 C-42 -652, -36 -634, -24 -624 C-14 -617, 14 -617, 24 -624 C36 -634, 42 -652, 40 -670 C33 -664, 30 -652, 22 -644 C14 -638, -14 -638, -22 -644 C-30 -652, -33 -664, -40 -670Z', P.hairDark, { r: R(0.8, 6, { tufts: 1.5, tuftLen: 5 }), line: LINE.hair, lw: 1 }),
    el('path', { d: 'M-32 -650 C-28 -640, -22 -632, -14 -627 M-4 -632 C0 -630, 4 -630, 8 -631 M16 -628 C24 -634, 30 -642, 33 -652', stroke: '#b3ad9f', 'stroke-width': 1.3, fill: 'none', opacity: 0.8 }),
    el('path', { d: 'M-14 -616 C-6 -612, 6 -612, 14 -616', stroke: P.skinDeep, 'stroke-width': 1.3, fill: 'none', opacity: 0.5 }),
    g({ filter: texSkin },
      shape(ellipseD(-43, -658, 8, 15, -14), P.skin, { r: R(0.4, 8), line: LINE.skin, lw: 1.2 }),
      shape(ellipseD(43, -658, 8, 15, 14), P.skin, { r: R(0.4, 8), line: LINE.skin, lw: 1.2 })));
  const tuft = shape('M-4 -716 C-10 -732, -2 -746, 8 -748 C2 -738, 2 -728, 6 -718Z', P.hair, { r: R(0.4, 6), line: LINE.hair, lw: 1.1, style: 'display:none' });
  const headTop = g({ transform: 'translate(0 -714)' });   // something asleep on his head
  head.append(tuft, headTop);
  const mkArm = (dark, sd) => limb(defs, { w0: 44, w1: 34, fill: dark ? P.coatDark : P.coat, dark: dark ? mix(P.coatDark, P.ink, 0.3) : P.coatDark, line: LINE.coat, handFill: dark ? P.skinDark : P.skin, handLine: LINE.skin, seed: seed + sd, filter: texCoat, handFilter: texSkin });
  const armL = mkArm(false, 40), armR = mkArm(true, 50);
  const SH = [[-58, -546], [58, -546]];
  // the coat is cut at the hips: the skirt hangs with the legs, the rest tips with him
  const cutUp = uid('nbUp'), cutDn = uid('nbDn');
  defs.appendChild(el('clipPath', { id: cutUp }, el('rect', { x: -300, y: -1200, width: 600, height: 1200 + HIP + 1.5 })));
  defs.appendChild(el('clipPath', { id: cutDn }, el('rect', { x: -300, y: HIP, width: 600, height: 600 })));
  const skirt = g({}, g({ 'clip-path': `url(#${cutDn})` }, coat.cloneNode(true)));
  const upper = g({}, g({ 'clip-path': `url(#${cutUp})` }, coat), collar, head);
  const upperPiv = g({}, upper);
  // arms live outside the tipping group (so they never squash) and behind the coat
  const arms = g({}, armL.root, armR.root);
  const root = g({ class: 'narrator-back' }, legs, skirt, arms, upperPiv);
  return {
    root, upper: upperPiv, arms, legs, skirt, legL, legR, SH, HIP, slots: { head: headTop },
    // hands: [[x,y],[x,y]] wrist targets in rig units (left, right); lift: feet raised
    set({ x = 0, y = 0, scale = 1, rot = 0, hands = [[-70, -800], [70, -800]], liftL = 0, liftR = 0, tip = 0, sink = 0, tuft: tf = true, headTilt = 0 } = {}) {
      root.setAttribute('transform', `translate(${x} ${y}) rotate(${rot}) scale(${scale})`);
      legL.setAttribute('transform', `translate(0 ${-liftL})`);
      legR.setAttribute('transform', `translate(0 ${-liftR})`);
      // tipping forward over the edge: from below, the torso shortens toward the hips and drops
      upperPiv.setAttribute('transform', `translate(0 ${sink}) translate(0 ${HIP}) scale(1 ${(1 - tip).toFixed(4)}) translate(0 ${-HIP})`);
      // the head keeps its shape when the torso tips (undo the squash about the neck)
      const k = Math.max(0.2, 1 - tip);
      head.setAttribute('transform', `translate(0 -596) scale(1 ${(1 / k).toFixed(4)}) translate(0 596)` + (headTilt ? ` rotate(${headTilt} 0 -596)` : ''));
      tuft.style.display = tf ? '' : 'none';
      // the arms reach from the (tipped) shoulders to the hands
      const sq = ([sx, sy]) => [sx, HIP + (sy - HIP) * (1 - tip) + sink];
      armL.set(sq(SH[0]), hands[0]);
      armR.set(sq(SH[1]), hands[1]);
    },
  };
}
