// The laminated sign: A3 sheet in a glossy pouch, cable-tied to a garden stake.
import { el, g, shape, ellipseD, T, paintFilter, linGrad } from '../lib/core.js';
import { P } from '../lib/palette.js';

// Draws in sign units: sheet is 420 x 297 (mm), stake below. Origin = stake foot.
export function sign(defs, { seed = 2, back = false, text = ['PLEASE DO NOT', 'FALL INTO THE', 'PUPPY PIT'] } = {}) {
  const tex = paintFilter(defs, { freq: 0.02, strength: 0.14, tooth: 0.08, seed });
  const texWood = paintFilter(defs, { freq: [0.02, 0.2], strength: 0.3, tooth: 0.12, seed: seed + 1 });
  const W = 420, H = 297, top = -1500; // stake is 1.5 m tall in mm
  const stake = g({ filter: texWood },
    shape(`M-22 0 L-22 ${top + 40} L22 ${top + 40} L22 0Z`, P.stake, { r: { amp: 1.5, wl: 60, seed: seed + 3 }, line: P.stakeDark, lw: 3 }),
    shape(`M8 0 L8 ${top + 40} L22 ${top + 40} L22 0Z`, P.stakeDark, { r: { amp: 1, wl: 60, seed: seed + 4 }, opacity: 0.6 }),
    // pointed end driven into the ground (a little soil darkening)
    el('path', { d: ellipseD(0, 0, 60, 14), fill: P.soilDark, opacity: 0.35 }));
  // laminate pouch slightly larger than the sheet, corners curling
  const sx = -W / 2, sy = top - 20;
  const pouch = `M${sx - 12} ${sy - 10} C${sx + 100} ${sy - 16}, ${sx + W - 100} ${sy - 4}, ${sx + W + 14} ${sy - 12} L${sx + W + 10} ${sy + H + 14} C${sx + W - 120} ${sy + H + 8}, ${sx + 120} ${sy + H + 20}, ${sx - 14} ${sy + H + 10}Z`;
  const sheet = `M${sx} ${sy} C${sx + 100} ${sy - 5}, ${sx + W - 100} ${sy + 6}, ${sx + W} ${sy} L${sx + W - 2} ${sy + H} C${sx + W - 120} ${sy + H - 4}, ${sx + 120} ${sy + H + 8}, ${sx} ${sy + H}Z`;
  const gloss = linGrad(defs, 0, 0, 1, 1, [[0, '#ffffff', 0], [0.42, '#ffffff', 0], [0.5, '#ffffff', 0.55], [0.6, '#ffffff', 0], [1, '#ffffff', 0]]);
  const parts = [
    shape(pouch, '#e9e8e0', { r: { amp: 1, wl: 50, seed: seed + 5 }, line: '#9a978d', lw: 2 }),
    shape(sheet, back ? '#e6e3d9' : P.signWhite, { r: { amp: 0.8, wl: 60, seed: seed + 6 } }),
  ];
  if (!back) {
    const lines = text;
    lines.forEach((ln, i) => {
      parts.push(el('text', {
        x: sx + W / 2, y: sy + 102 + i * 70, 'text-anchor': 'middle', 'font-family': 'Liberation Sans, Arial, sans-serif',
        'font-weight': 700, 'font-size': 54, fill: P.signInk, 'letter-spacing': '-0.5', textLength: i < 2 ? 360 : 300, lengthAdjust: 'spacingAndGlyphs',
      }, document.createTextNode(ln)));
    });
    // tiny clip-art paw, because someone made this sign on a computer
    const paw = g({ transform: T(sx + W - 44, sy + H - 38, -12, 0.9) },
      el('path', { d: ellipseD(0, 6, 11, 9), fill: '#555' }),
      el('path', { d: ellipseD(-12, -8, 4.5, 6), fill: '#555' }), el('path', { d: ellipseD(-4, -13, 4.5, 6), fill: '#555' }),
      el('path', { d: ellipseD(5, -13, 4.5, 6), fill: '#555' }), el('path', { d: ellipseD(13, -7, 4.5, 6), fill: '#555' }));
    parts.push(paw);
  }
  parts.push(el('path', { d: pouch, fill: gloss }));
  // cable ties at the stake
  const ties = g({},
    el('rect', { x: -26, y: sy + 12, width: 52, height: 9, rx: 3, fill: P.tie }),
    el('rect', { x: -26, y: sy + H - 20, width: 52, height: 9, rx: 3, fill: P.tie }),
    el('path', { d: `M26 ${sy + 16} l20 -7 M26 ${sy + H - 16} l18 6`, stroke: P.tie, 'stroke-width': 5, 'stroke-linecap': 'round' }));
  const board = g({ filter: tex }, parts);
  // from behind, the stake is in front of the sheet
  return { root: back ? g({}, board, ties, stake) : g({}, stake, board, ties), stake, board, W, H, top };
}
