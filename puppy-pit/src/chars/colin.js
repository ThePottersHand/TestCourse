// Colin, the neighbour. Front view, head and shoulders over a fence, forearms
// resting on the top rail. Units: 400 = 1 m. Origin = centre of the fence top.
import { el, g, shape, ellipseD, circleD, T, paintFilter } from '../lib/core.js';
import { P } from '../lib/palette.js';
import { limb } from './limbs.js';

const LINE = { skin: '#9a6a55', jumper: '#3b2830', hair: '#4a3d33' };

export function colinOverFence(defs, { seed = 60 } = {}) {
  const texSkin = paintFilter(defs, { freq: 0.06, strength: 0.14, tooth: 0.06, seed });
  const texCloth = paintFilter(defs, { freq: [0.1, 0.03], strength: 0.2, tooth: 0.1, seed: seed + 1 });
  let s = seed * 10;
  const R = (amp = 0.7, wl = 12, more = {}) => ({ amp, wl, seed: ++s, ...more });
  // shoulders / jumper (only above the fence top is ever visible)
  const body = g({ filter: texCloth },
    // the rest of him below the rail (only seen when he kneels at the edge of the pit)
    shape('M-96 282 L-92 460 L92 460 L96 282Z', '#4b4a50', { r: R(1, 20), line: '#2e2d33' }),
    shape('M-118 0 C-121 90, -112 200, -102 290 L102 290 C112 200, 121 90, 118 0Z', P.colinJumper, { r: R(1, 20), line: LINE.jumper }),
    shape('M-118 0 C-121 90, -112 200, -102 290 L-66 290 C-74 200, -80 90, -80 0Z', P.colinJumperDark, { r: R(0.8, 20), opacity: 0.45 }),
    shape('M-104 262 L104 262 L102 292 L-102 292Z', P.colinJumperDark, { r: R(0.6, 14), opacity: 0.8 }),
    el('path', { d: 'M-96 272 L96 272 M-90 150 C-40 160, 40 160, 90 150', stroke: P.colinJumperDark, 'stroke-width': 2, fill: 'none', opacity: 0.5 }),
    shape('M-120 20 C-118 -20, -100 -48, -60 -58 C-30 -66, 30 -66, 60 -58 C100 -48, 118 -20, 120 20Z', P.colinJumper, { r: R(1, 20), line: LINE.jumper }),
    shape('M-26 -62 C-18 -48, 18 -48, 26 -62 C14 -58, -14 -58, -26 -62Z', P.colinJumperDark, { r: R(0.5, 8) }));
  // forearms folded on the rail. The one whose hand ends by the mug (A) is its own
  // group: when he drinks it lifts from the elbow, mug in hand.
  const forearmA = g({ filter: texCloth },
    shape('M-128 18 C-110 -2, -40 -6, 20 2 C30 4, 32 16, 22 20Z', P.colinJumper, { r: R(0.8, 16), line: LINE.jumper }));
  const forearmB = g({ filter: texCloth },
    shape('M128 18 C110 -2, 40 -6, -20 2 C-30 4, -32 16, -22 20Z', P.colinJumperDark, { r: R(0.8, 16), line: LINE.jumper }));
  const handA = g({ filter: texSkin },
    shape('M14 2 C10 8, 12 18, 22 20 C32 21, 42 16, 43 8 C43 2, 38 -2, 30 -2 L20 -1 C17 -1, 15 0, 14 2Z', P.colinSkin, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }),
    el('path', { d: 'M24 1 C26 4, 26 9, 24 12 M32 0 C34 3, 34 8, 32 11', stroke: LINE.skin, 'stroke-width': 1.1, fill: 'none', opacity: 0.6 }));
  const handB = g({ filter: texSkin },
    shape(ellipseD(-30, 12, 15, 10), P.colinSkinDark, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }));
  // his phone, held up in both hands to take a picture (we see the back of it)
  const phoneArms = g({ filter: texCloth },
    shape('M-126 18 C-122 -8, -100 -44, -76 -80 L-50 -70 C-66 -40, -84 -8, -92 18Z', P.colinJumper, { r: R(0.8, 14), line: LINE.jumper }),
    shape('M126 18 C122 -8, 100 -44, 76 -80 L50 -70 C66 -40, 84 -8, 92 18Z', P.colinJumperDark, { r: R(0.8, 14), line: LINE.jumper }));
  const phoneBody = g({},
    shape('M-56 -122 L56 -122 C62 -122, 66 -118, 66 -112 L66 -64 C66 -58, 62 -54, 56 -54 L-56 -54 C-62 -54, -66 -58, -66 -64 L-66 -112 C-66 -118, -62 -122, -56 -122Z', '#2b2e33', { r: R(0.3, 12), line: '#131417', lw: 1.6 }),
    el('path', { d: 'M-60 -118 L58 -118', stroke: '#4a4f57', 'stroke-width': 2, opacity: 0.7 }),
    shape('M-52 -114 L-24 -114 C-20 -114, -18 -112, -18 -108 L-18 -86 C-18 -82, -20 -80, -24 -80 L-52 -80 C-56 -80, -58 -82, -58 -86 L-58 -108 C-58 -112, -56 -114, -52 -114Z', '#1d1f23', { r: R(0.2, 8) }),
    el('path', { d: circleD(-46, -104, 6), fill: '#3c4248', stroke: '#0e0f11', 'stroke-width': 1.4 }),
    el('path', { d: circleD(-46, -104, 2.2), fill: '#7e8a94' }),
    el('path', { d: circleD(-46, -89, 6), fill: '#3c4248', stroke: '#0e0f11', 'stroke-width': 1.4 }),
    el('path', { d: circleD(-46, -89, 2.2), fill: '#7e8a94' }),
    el('path', { d: circleD(-28, -106, 3.2), fill: '#e8e2cf' }));
  const phoneHands = g({ filter: texSkin },
    shape('M-78 -104 C-82 -88, -80 -70, -70 -62 C-62 -56, -54 -62, -54 -74 L-56 -102 C-60 -110, -72 -112, -78 -104Z', P.colinSkin, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }),
    shape('M78 -104 C82 -88, 80 -70, 70 -62 C62 -56, 54 -62, 54 -74 L56 -102 C60 -110, 72 -112, 78 -104Z', P.colinSkinDark, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }));
  const flashGlow = el('circle', { cx: -28, cy: -106, r: 120, fill: 'url(#colinFlash)', style: 'display:none' });
  if (!defs.querySelector('#colinFlash')) defs.appendChild(el('radialGradient', { id: 'colinFlash' },
    el('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 1 }), el('stop', { offset: 0.12, 'stop-color': '#fffdf4', 'stop-opacity': 0.9 }),
    el('stop', { offset: 0.4, 'stop-color': '#fff6de', 'stop-opacity': 0.25 }), el('stop', { offset: 1, 'stop-color': '#fff6de', 'stop-opacity': 0 })));
  const phoneG = g({ style: 'display:none' }, phoneArms, g({}, phoneBody, phoneHands, flashGlow));
  const phoneHeld = phoneG.lastChild;
  // head
  const neck = shape('M-20 -60 L-18 -80 L18 -80 L20 -60Z', P.colinSkinDark, { r: R(0.4, 8) });
  const face = shape('M-40 -130 C-42 -170, -24 -196, 0 -196 C24 -196, 42 -170, 40 -130 C39 -104, 22 -76, 0 -74 C-22 -76, -39 -104, -40 -130Z', P.colinSkin, { r: R(0.6, 12), line: LINE.skin, lw: 1.4 });
  const ears = g({},
    shape(ellipseD(-42, -134, 8, 13), P.colinSkin, { r: R(0.3, 6), line: LINE.skin, lw: 1.2 }),
    shape(ellipseD(42, -134, 8, 13), P.colinSkin, { r: R(0.3, 6), line: LINE.skin, lw: 1.2 }));
  const hair = g({},
    shape('M-42 -128 C-46 -150, -42 -166, -34 -172 C-30 -160, -32 -146, -36 -126Z', P.colinHair, { r: R(0.5, 6, { tufts: 1, tuftLen: 4 }) }),
    shape('M42 -128 C46 -150, 42 -166, 34 -172 C30 -160, 32 -146, 36 -126Z', P.colinHair, { r: R(0.5, 6, { tufts: 1, tuftLen: 4 }) }),
    // a few survivors on top
    el('path', { d: 'M-10 -194 C-6 -200, 2 -201, 8 -196 M-2 -196 C2 -202, 10 -202, 14 -197', stroke: P.colinHair, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }));
  const shade = el('path', { d: 'M-40 -128 C-38 -104, -22 -78, 0 -76 C-14 -84, -30 -104, -34 -130Z', fill: P.colinSkinDark, opacity: 0.5 });
  const shine = el('path', { d: ellipseD(-10, -182, 14, 6, -10), fill: '#f3d7c3', opacity: 0.6 });
  const glasses = g({},
    el('rect', { x: -32, y: -142, width: 26, height: 17, rx: 4, fill: '#dfe6e8', 'fill-opacity': 0.25, stroke: P.glassesRim, 'stroke-width': 2.6 }),
    el('rect', { x: 6, y: -142, width: 26, height: 17, rx: 4, fill: '#dfe6e8', 'fill-opacity': 0.25, stroke: P.glassesRim, 'stroke-width': 2.6 }),
    el('path', { d: 'M-6 -136 L6 -136 M-32 -136 L-40 -134 M32 -136 L40 -134', stroke: P.glassesRim, 'stroke-width': 2.4 }));
  const eyes = g({}, el('path', { d: ellipseD(-19, -132, 3, 3.2), fill: P.ink }), el('path', { d: ellipseD(19, -132, 3, 3.2), fill: P.ink }));
  const brows = el('path', { d: 'M-30 -150 L-10 -149 M10 -149 L30 -150', stroke: P.colinHair, 'stroke-width': 3, 'stroke-linecap': 'round' });
  const nose = el('path', { d: 'M-2 -130 C-4 -120, -6 -112, -2 -109 C2 -108, 6 -110, 6 -112', stroke: LINE.skin, 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' });
  const mouth = el('path', { d: 'M-12 -96 L12 -96', stroke: '#7a4a42', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  const mouthO = el('path', { d: ellipseD(0, -96, 6, 5), fill: '#6b3b35', style: 'display:none' });
  const stubble = el('path', { d: 'M-28 -100 C-18 -80, 18 -80, 28 -100 C16 -88, -16 -88, -28 -100Z', fill: '#8a7466', opacity: 0.18 });
  const eyesG = g({}, eyes);
  const head = g({}, g({ filter: texSkin }, neck, ears, face, shade, shine, stubble), hair, brows, eyesG, nose, mouth, mouthO, glasses);
  const headPivot = g({}, head);
  const mug = g({ style: 'display:none' },
    shape('M14 -30 L44 -30 L42 8 C42 12, 16 12, 16 8Z', '#e9e6dc', { r: R(0.4, 8), line: '#8a857a', lw: 1.4 }),
    el('path', { d: 'M15 -18 L43 -18 L43 -12 L15 -12Z', fill: '#6b4b55', opacity: 0.8 }),
    el('path', { d: 'M44 -22 C56 -22, 56 0, 43 -2', stroke: '#d9d5ca', 'stroke-width': 5, fill: 'none' }),
    el('path', { d: ellipseD(29, -30, 15, 3.5), fill: '#6a4b35' }));
  // the mug sits in hand A (drawn over the mug so the fingers wrap round it)
  const sipArm = g({}, forearmA, mug, handA);
  const restArms = g({}, forearmB, handB, sipArm);
  // reaching down (to haul someone up): two-point arms from the shoulders
  const reachL = limb(defs, { w0: 46, w1: 34, fill: P.colinJumper, dark: P.colinJumperDark, line: LINE.jumper, handFill: P.colinSkin, handLine: LINE.skin, seed: seed + 30, filter: texCloth, handFilter: texSkin, mitt: 1.15 });
  const reachR = limb(defs, { w0: 46, w1: 34, fill: P.colinJumperDark, dark: P.colinJumperDark, line: LINE.jumper, handFill: P.colinSkinDark, handLine: LINE.skin, seed: seed + 40, filter: texCloth, handFilter: texSkin, mitt: 1.15 });
  const reachG = g({ style: 'display:none' }, reachL.root, reachR.root);
  const root = g({ class: 'colin' }, body, headPivot, restArms, phoneG, reachG);
  return {
    root, head: headPivot, mug, reachG, SHOULDERS: [[-86, -40], [86, -40]],
    set({ x = 0, y = 0, scale = 1, tilt = 0, dip = 0, look = [0, 0], talk = false, tea = false, sip = 0, phone = false, phoneY = 0, phoneTilt = 0, flash = 0, reach = null } = {}) {
      restArms.style.display = phone || reach ? 'none' : '';
      reachG.style.display = reach ? '' : 'none';
      if (reach) { reachL.set([-86, -40], reach[0]); reachR.set([86, -40], reach[1]); }
      phoneG.style.display = phone ? '' : 'none';
      phoneHeld.setAttribute('transform', `translate(0 ${phoneY}) rotate(${phoneTilt} 0 -88)`);
      flashGlow.style.display = flash > 0 ? '' : 'none';
      flashGlow.setAttribute('opacity', flash);
      mug.style.display = tea && !phone ? '' : 'none';
      // drinking: the forearm swings up from the elbow bringing the mug to his mouth,
      // and the wrist tips it a little further
      sipArm.setAttribute('transform', sip ? `rotate(${(-29 * sip).toFixed(2)} -128 18)` : '');
      mug.setAttribute('transform', sip ? `rotate(${(-14 * sip).toFixed(2)} 29 8)` : '');
      root.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
      headPivot.setAttribute('transform', `translate(0 ${dip}) rotate(${tilt} 0 -70)`);
      eyesG.setAttribute('transform', T(look[0], look[1]));
      mouth.style.display = talk ? 'none' : '';
      mouthO.style.display = talk ? '' : 'none';
    },
  };
}
