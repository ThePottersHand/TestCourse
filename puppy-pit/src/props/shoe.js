// His left shoe, on its own (for the puppy that removes it).
import { g, shape, paintFilter } from '../lib/core.js';
import { P } from '../lib/palette.js';
export function shoe(defs, seed = 90) {
  const tex = paintFilter(defs, { freq: 0.08, strength: 0.18, tooth: 0.08, seed });
  return g({ filter: tex },
    shape('M-22 -6 C-27 8, -25 21, -14 25 L52 25 C64 25, 66 12, 57 5 C46 -2, 28 -6, 17 -14 L-18 -14Z', P.shoe, { r: { amp: 0.8, wl: 14, seed }, line: '#2c1c14' }),
    shape('M-17 19 L56 19 C62 19, 62 25, 53 26 L-15 26Z', P.shoeDark, { r: { amp: 0.5, wl: 10, seed: seed + 1 }, opacity: 0.85 }),
    shape('M-18 -14 L17 -14 C14 -8, 6 -4, -2 -4 C-10 -4, -16 -8, -18 -14Z', '#2a1b13', { r: { amp: 0.4, wl: 8, seed: seed + 2 } }),
    shape('M20 -10 C30 -6, 42 -2, 52 4 C46 1, 32 -2, 24 -6Z', P.shoeLight, { r: { amp: 0.4, wl: 8, seed: seed + 3 }, opacity: 0.7 }));
}

// the same shoe seen from above (for the top-down shots); units 400 = 1 m
export function shoeTop(defs, seed = 93) {
  const tex = paintFilter(defs, { freq: 0.08, strength: 0.18, tooth: 0.08, seed });
  return g({ filter: tex },
    shape('M-14 -52 C-4 -60, 10 -58, 16 -46 C22 -26, 22 10, 18 34 C14 52, -10 54, -16 36 C-22 14, -24 -30, -14 -52Z', P.shoe, { r: { amp: 0.7, wl: 12, seed }, line: '#2c1c14' }),
    shape('M-10 14 C-6 4, 8 4, 12 14 C14 26, 10 38, 0 40 C-10 38, -14 26, -10 14Z', '#2a1b13', { r: { amp: 0.4, wl: 8, seed: seed + 1 } }),
    shape('M-8 -46 C-2 -52, 8 -50, 11 -42 C4 -46, -2 -46, -8 -42Z', P.shoeLight, { r: { amp: 0.3, wl: 8, seed: seed + 2 }, opacity: 0.8 }),
    ...[-30, -20, -10].map((yy, i) => shape(`M-8 ${yy} L8 ${yy + 1} L8 ${yy + 3} L-8 ${yy + 2}Z`, '#3b2519', { r: { amp: 0.2, wl: 6, seed: seed + 5 + i } })));
}
