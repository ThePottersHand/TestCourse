// Two-point limbs: a tapered sleeve cut once (hand-rough edges) in a canonical
// frame pointing down +y, then placed each frame from p0 (shoulder) to p1
// (wrist), with a hand at the end. Used for reaching and pulling poses where
// the hands have to land exactly on something.
import { el, g, shape } from '../lib/core.js';

const L0 = 200;

export function limb(defs, { w0 = 40, w1 = 32, fill, dark = null, line = null, hand = null, handLine = null, handFill = null, seed = 1, filter = null, handFilter = null, mitt = 1 } = {}) {
  const a = w0 / 2, b = w1 / 2;
  const sleeveD = `M${-a} 0 C${-a} ${-a * 0.9}, ${a} ${-a * 0.9}, ${a} 0 L${b} ${L0} L${-b} ${L0}Z`;
  const sleeve = g({ filter },
    shape(sleeveD, fill, { r: { amp: 0.8, wl: 18, seed }, line, lw: 1.6 }),
    dark ? shape(`M${-a} 0 L${-a * 0.35} 0 L${-b * 0.35} ${L0} L${-b} ${L0}Z`, dark, { r: { amp: 0.6, wl: 18, seed: seed + 1 }, opacity: 0.45 }) : null,
    // cuff
    dark ? shape(`M${-b - 1} ${L0 - 16} L${b + 1} ${L0 - 16} L${b + 1} ${L0 + 2} L${-b - 1} ${L0 + 2}Z`, dark, { r: { amp: 0.4, wl: 10, seed: seed + 2 }, opacity: 0.5 }) : null);
  const h = b * 0.95 * mitt;
  const handG = g({ filter: handFilter },
    shape(`M${-h} -4 C${-h - 2} ${h * 1.2}, ${-h * 0.5} ${h * 2.3}, 0 ${h * 2.4} C${h * 0.5} ${h * 2.3}, ${h + 2} ${h * 1.2}, ${h} -4Z`, handFill || '#e9c2a6', { r: { amp: 0.4, wl: 8, seed: seed + 3 }, line: handLine, lw: 1.2 }));
  const sleeveG = g({}, sleeve);
  const handPos = g({}, handG);
  const root = g({}, sleeveG, hand === false ? null : handPos);
  return {
    root, sleeve: sleeveG, hand: handPos,
    // p0, p1 in the parent's coordinates; handRot tweaks the hand about the wrist
    set(p0, p1, { handRot = 0, handScale = 1 } = {}) {
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      const len = Math.max(1, Math.hypot(dx, dy));
      const ang = Math.atan2(dx, dy) * 180 / Math.PI;   // 0 = pointing down +y
      sleeveG.setAttribute('transform', `translate(${p0[0].toFixed(2)} ${p0[1].toFixed(2)}) rotate(${(-ang).toFixed(2)}) scale(1 ${(len / L0).toFixed(4)})`);
      handPos.setAttribute('transform', `translate(${p1[0].toFixed(2)} ${p1[1].toFixed(2)}) rotate(${(-ang + handRot).toFixed(2)}) scale(${handScale})`);
    },
  };
}
