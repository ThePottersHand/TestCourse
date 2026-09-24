// Signed distance fields from canvas coverage (Felzenszwalb/Huttenlocher EDT, as in mapbox tiny-sdf).
// Used to turn any Canvas2D drawing into a mask the watercolour shader can grow, soften and edge-darken.
(function (WC) {
  'use strict';
  const INF = 1e20;

  function edt1d(grid, offset, stride, length, f, v, z) {
    v[0] = 0; z[0] = -INF; z[1] = INF;
    f[0] = grid[offset];
    for (let q = 1, k = 0, s = 0; q < length; q++) {
      f[q] = grid[offset + q * stride];
      const q2 = q * q;
      do {
        const r = v[k];
        s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
      } while (s <= z[k] && --k > -1);
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    for (let q = 0, k = 0; q < length; q++) {
      while (z[k + 1] < q) k++;
      const r = v[k], qr = q - r;
      grid[offset + q * stride] = f[r] + qr * qr;
    }
  }

  function edt(data, w, h, f, v, z) {
    for (let x = 0; x < w; x++) edt1d(data, x, w, h, f, v, z);
    for (let y = 0; y < h; y++) edt1d(data, y * w, 1, w, f, v, z);
  }

  // alpha: Uint8ClampedArray RGBA data (uses the alpha channel). Returns Float32Array of signed
  // distances in pixels, positive INSIDE the shape.
  WC.sdfFromAlpha = function (rgba, w, h) {
    const n = w * h;
    const outer = new Float64Array(n), inner = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const a = rgba[i * 4 + 3] / 255;
      if (a >= 0.999) { outer[i] = 0; inner[i] = INF; }
      else if (a <= 0.001) { outer[i] = INF; inner[i] = 0; }
      else {
        const d = 0.5 - a;
        outer[i] = d > 0 ? d * d : 0;
        inner[i] = d < 0 ? d * d : 0;
      }
    }
    const m = Math.max(w, h);
    const f = new Float64Array(m), v = new Uint16Array(m), z = new Float64Array(m + 1);
    edt(outer, w, h, f, v, z);
    edt(inner, w, h, f, v, z);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = Math.sqrt(inner[i]) - Math.sqrt(outer[i]);
    return out;
  };
})(window.WC = window.WC || {});
