// Animation helpers: keyframes, easing, secondary motion, camera moves.
import { clamp, lerp, smooth, noise1 } from './core.js';

export const EASE = {
  lin: t => t,
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  sine: t => 0.5 - Math.cos(Math.PI * t) / 2,
  back: t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  hold: t => (t < 1 ? 0 : 1),
};

// kf(t, [[t0, v0], [t1, v1, 'io'], ...]) — values may be numbers or arrays.
// The easing named on a key applies to the segment that ends at that key.
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = 'io'] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const u = EASE[e]((t - t0) / Math.max(1e-6, t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], u)) : (typeof v0 === 'number' ? lerp(v0, v1, u) : (u < 1 ? v0 : v1));
    }
  }
  return keys[keys.length - 1][1];
}
// discrete state switch: step(t, [[t0, 'a'], [t1, 'b']])
export function step(t, keys) {
  let v = keys[0][1];
  for (const [k, s] of keys) if (t >= k) v = s;
  return v;
}

// smooth wobble for idle life (breathing, fidgets); deterministic per seed
const noises = new Map();
export function wob(t, seed = 1, speed = 1) {
  if (!noises.has(seed)) noises.set(seed, noise1(seed * 97 + 13));
  return noises.get(seed)(t * speed);
}

// quantise to 12 drawings per second ("on twos")
export const on2 = t => Math.floor(t * 12 + 1e-6) / 12;
export const on3 = t => Math.floor(t * 8 + 1e-6) / 8;

// progress through a window
export const win = (t, a, b) => clamp((t - a) / (b - a));

// 2D camera: centre (cx, cy) in scene pixels shown at frame centre with zoom z
export function camTransform(cx, cy, z, W = 1920, H = 1080) {
  return `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`;
}

// narrator walk cycle (profile). phase in [0,1). amp in degrees.
export function walkLegs(phase, amp = 16) {
  const a = Math.sin(phase * 2 * Math.PI), b = Math.sin(phase * 2 * Math.PI + Math.PI);
  const knee = p => Math.max(0, Math.sin(p * 2 * Math.PI - 0.6)) * amp * 1.4;
  return {
    thighN: -a * amp, shinN: knee(phase), footN: a * amp * 0.25,
    thighF: -b * amp, shinF: knee(phase + 0.5), footF: b * amp * 0.25,
    bob: -Math.abs(Math.cos(phase * 2 * Math.PI)) * 5,
  };
}
