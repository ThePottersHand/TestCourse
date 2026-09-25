// Minimal pinhole camera with a shifted principal point (verticals stay vertical,
// like a tilt-shift lens). World: X right, Y up, Z depth (metres). Camera at (x0, H, 0).
export function camera({ f = 1000, H = 2.6, cx = 960, cy = 211, x0 = 0 } = {}) {
  const c = {
    f, H, cx, cy, x0,
    p(X, Y, Z) { return [cx + (X - x0) * f / Z, cy + (H - Y) * f / Z]; },
    s(Z) { return f / Z; },
    // depth of a ground point that appears at screen row y
    zAt(y, Y = 0) { return (H - Y) * f / (y - cy); },
    poly(pts) { return 'M' + pts.map(([X, Y, Z]) => c.p(X, Y, Z).map(v => v.toFixed(1)).join(' ')).join('L') + 'Z'; },
  };
  return c;
}
// character units: 400 units per metre
export const UNITS_PER_M = 400;
export const charScale = (cam, Z) => cam.s(Z) / UNITS_PER_M;
