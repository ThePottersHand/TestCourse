// Flood fields: for every pixel of a mask, how far pigment dropped at the seed points has to
// travel *inside the shape* to get there (geodesic distance). Revealing a wash where this
// distance is below a growing threshold makes paint flow through a shape the way a charged
// brush touched to wet paper floods along it - round corners, down the arms of a letter,
// around both sides of a ring.
(function (WC) {
  'use strict';
  const INF = 0x3fffffff;

  // sdf: Float32Array (mask px, + inside), w,h: mask size, seeds: [[x,y],...] in mask px.
  // step: grid decimation. margin: how far outside the shape (px) the flood may travel so the
  // front stays defined across the soft edge. Returns {field: Float32Array (mask px distance,
  // Infinity where unreached), max}.
  WC.floodField = function (sdf, w, h, seeds, step = 2, margin = 8) {
    const gw = Math.ceil(w / step), gh = Math.ceil(h / step), n = gw * gh;
    const pass = new Uint8Array(n);
    for (let gy = 0; gy < gh; gy++) {
      const y = Math.min(h - 1, gy * step);
      for (let gx = 0; gx < gw; gx++) {
        const x = Math.min(w - 1, gx * step);
        pass[gy * gw + gx] = sdf[y * w + x] > -margin ? 1 : 0;
      }
    }
    const dist = new Int32Array(n).fill(INF);
    const buckets = [];
    const push = (d, i) => { (buckets[d] || (buckets[d] = [])).push(i); };
    // snap each seed to the nearest passable cell (spiral search)
    seeds.forEach(([sx, sy]) => {
      const cx = Math.max(0, Math.min(gw - 1, Math.round(sx / step))), cy = Math.max(0, Math.min(gh - 1, Math.round(sy / step)));
      for (let r = 0; r < Math.max(gw, gh); r++) {
        let found = -1;
        for (let dy = -r; dy <= r && found < 0; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = cx + dx, y = cy + dy;
          if (x < 0 || y < 0 || x >= gw || y >= gh) continue;
          if (pass[y * gw + x]) { found = y * gw + x; break; }
        }
        if (found >= 0) { if (dist[found] > 0) { dist[found] = 0; push(0, found); } break; }
      }
    });
    // Dijkstra with a bucket queue; weights 10 (straight) and 14 (diagonal)
    const nb = [[1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10], [1, 1, 14], [-1, 1, 14], [1, -1, 14], [-1, -1, 14]];
    let maxD = 0;
    for (let d = 0; d < buckets.length; d++) {
      const b = buckets[d];
      if (!b) continue;
      for (let k = 0; k < b.length; k++) {
        const i = b[k];
        if (dist[i] !== d) continue;
        if (d > maxD) maxD = d;
        const x = i % gw, y = (i - x) / gw;
        for (let j = 0; j < 8; j++) {
          const nx = x + nb[j][0], ny = y + nb[j][1];
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          const ni = ny * gw + nx;
          if (!pass[ni]) continue;
          const nd = d + nb[j][2];
          if (nd < dist[ni]) { dist[ni] = nd; push(nd, ni); }
        }
      }
      buckets[d] = null;
    }
    // upsample to mask resolution (bilinear), in mask px
    const field = new Float32Array(w * h);
    const k = step / 10, far = (maxD + 40) * k;
    const at = (x, y) => { const v = dist[y * gw + x]; return v >= INF ? far : v * k; };
    for (let y = 0; y < h; y++) {
      const fy = y / step, y0 = Math.min(gh - 1, Math.floor(fy)), y1 = Math.min(gh - 1, y0 + 1), ty = fy - y0;
      for (let x = 0; x < w; x++) {
        const fx = x / step, x0 = Math.min(gw - 1, Math.floor(fx)), x1 = Math.min(gw - 1, x0 + 1), tx = fx - x0;
        const a = at(x0, y0), b = at(x1, y0), c = at(x0, y1), e = at(x1, y1);
        field[y * w + x] = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
      }
    }
    return { field, max: maxD * k };
  };
})(window.WC = window.WC || {});
