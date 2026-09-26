// Colin, the neighbour. Front view, head and shoulders over a fence, forearms
// resting on the top rail. Units: 400 = 1 m. Origin = centre of the fence top.
import { el, g, shape, ellipseD, circleD, T, paintFilter } from '../lib/core.js';
import { P } from '../lib/palette.js';

const LINE = { skin: '#9a6a55', jumper: '#3b2830', hair: '#4a3d33' };

export function colinOverFence(defs, { seed = 60 } = {}) {
  const texSkin = paintFilter(defs, { freq: 0.06, strength: 0.14, tooth: 0.06, seed });
  const texCloth = paintFilter(defs, { freq: [0.1, 0.03], strength: 0.2, tooth: 0.1, seed: seed + 1 });
  let s = seed * 10;
  const R = (amp = 0.7, wl = 12, more = {}) => ({ amp, wl, seed: ++s, ...more });
  // shoulders / jumper (only above the fence top is ever visible)
  const body = g({ filter: texCloth },
    shape('M-120 20 C-118 -20, -100 -48, -60 -58 C-30 -66, 30 -66, 60 -58 C100 -48, 118 -20, 120 20Z', P.colinJumper, { r: R(1, 20), line: LINE.jumper }),
    shape('M-26 -62 C-18 -48, 18 -48, 26 -62 C14 -58, -14 -58, -26 -62Z', P.colinJumperDark, { r: R(0.5, 8) }),
    // forearms folded on the rail
    shape('M-128 18 C-110 -2, -40 -6, 20 2 C30 4, 32 16, 22 20Z', P.colinJumper, { r: R(0.8, 16), line: LINE.jumper }),
    shape('M128 18 C110 -2, 40 -6, -20 2 C-30 4, -32 16, -22 20Z', P.colinJumperDark, { r: R(0.8, 16), line: LINE.jumper }));
  const hands = g({ filter: texSkin },
    shape(ellipseD(26, 10, 16, 11), P.colinSkin, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }),
    shape(ellipseD(-30, 12, 15, 10), P.colinSkinDark, { r: R(0.4, 8), line: LINE.skin, lw: 1.3 }));
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
  const root = g({ class: 'colin' }, body, headPivot, hands, mug);
  return {
    root, head: headPivot, mug,
    set({ x = 0, y = 0, scale = 1, tilt = 0, dip = 0, look = [0, 0], talk = false, tea = false, sip = 0 } = {}) {
      mug.style.display = tea ? '' : 'none';
      mug.setAttribute('transform', sip ? `translate(${-20 * sip} ${-60 * sip}) rotate(${-25 * sip} 30 0)` : '');
      root.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
      headPivot.setAttribute('transform', `translate(0 ${dip}) rotate(${tilt} 0 -70)`);
      eyesG.setAttribute('transform', T(look[0], look[1]));
      mouth.style.display = talk ? 'none' : '';
      mouthO.style.display = talk ? '' : 'none';
    },
  };
}
