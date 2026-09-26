/* Strokes: GPU line renderer (neon tubes / pencil graphite) and the line-art morph engine. */
(function () {
  'use strict';
  const V = window.V, G = V.G, M = V.M, R = V.R, Mat = V.Mat;
  const St = (V.St = {});
  const STRIDE = 14; // p0(3) p1(3) col(4) w(2) u(2)

  const VS = `#version 300 es
layout(location=0) in vec2 a_corner;
layout(location=1) in vec3 a_p0;
layout(location=2) in vec3 a_p1;
layout(location=3) in vec4 a_col;
layout(location=4) in vec2 a_w;
layout(location=5) in vec2 a_u;
uniform mat4 u_vp; uniform vec2 u_res; uniform float u_pxPerUnit, u_minPx, u_glow;
out vec2 v_px; out vec2 v_a; out vec2 v_b; out vec2 v_r; out vec4 v_col; out vec2 v_u;
void main(){
  vec4 c0 = u_vp*vec4(a_p0,1.0), c1 = u_vp*vec4(a_p1,1.0);
  // clip the segment against the near plane (a segment passing the camera keeps its visible part)
  const float NEAR = 0.05;
  if(c0.w < NEAR && c1.w < NEAR){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }
  if(c0.w < NEAR) c0 = mix(c0, c1, (NEAR - c0.w)/(c1.w - c0.w));
  else if(c1.w < NEAR) c1 = mix(c1, c0, (NEAR - c1.w)/(c0.w - c1.w));
  vec2 s0 = (c0.xy/c0.w*0.5+0.5)*u_res, s1 = (c1.xy/c1.w*0.5+0.5)*u_res;
  // widths grow as 1/depth; cap them so lines brushing past the lens stay tubes, not smears
  float rMax = u_res.y*0.03;
  float r0 = clamp(a_w.x*u_pxPerUnit/c0.w + a_w.y, u_minPx, rMax), r1 = clamp(a_w.x*u_pxPerUnit/c1.w + a_w.y, u_minPx, rMax);
  float R = max(r0,r1)*u_glow + 2.0;
  vec2 d = s1-s0; float L = length(d); vec2 dir = L>1e-3? d/L : vec2(1.0,0.0); vec2 n = vec2(-dir.y,dir.x);
  vec2 p = (a_corner.x<0.0? s0 : s1) + dir*a_corner.x*R + n*a_corner.y*R;
  gl_Position = vec4(p/u_res*2.0-1.0, 0.0, 1.0);
  v_px = p; v_a = s0; v_b = s1; v_r = vec2(r0,r1); v_col = a_col; v_u = a_u;
}`;

  const FS = `#version 300 es
${G.GLSL_COMMON}
in vec2 v_px; in vec2 v_a; in vec2 v_b; in vec2 v_r; in vec4 v_col; in vec2 v_u; out vec4 o;
uniform float u_style, u_intensity, u_halo, u_time, u_core;
void main(){
  vec2 pa = v_px - v_a, ba = v_b - v_a;
  float h = clamp(dot(pa,ba)/max(dot(ba,ba),1e-4), 0.0, 1.0);
  float d = length(pa - ba*h);
  float r = mix(v_r.x, v_r.y, h);
  if(u_style < 0.5){
    // neon tube: saturated body, hot core, soft near-halo (bloom adds the far glow)
    float body = 1.0 - smoothstep(r-0.8, r+0.8, d);
    float core = 1.0 - smoothstep(r*0.25, r*0.25+1.2, d);
    float halo = exp(-max(d-r,0.0)/(r*u_halo+1.5));
    vec3 c = v_col.rgb*(body*1.6 + halo*0.55) + (v_col.rgb*0.5+0.5)*core*u_core;
    o = vec4(c*v_col.a*u_intensity, 1.0);
  } else if(u_style < 1.5){
    // graphite: coverage broken up by paper tooth
    float cov = 1.0 - smoothstep(r-0.6, r+0.6, d);
    float tooth = vnoise(gl_FragCoord.xy*0.45)*0.65 + hash21(floor(gl_FragCoord.xy))*0.45;
    float ink = cov*v_col.a*mix(0.45, 1.0, smoothstep(0.2,0.8,tooth))*u_intensity;
    o = vec4(ink);
  } else {
    // solid marker (flat colour, crisp edge) used for silhouettes/laser cores
    float cov = 1.0 - smoothstep(r-0.8, r+0.8, d);
    o = vec4(v_col.rgb*cov*v_col.a*u_intensity, cov*v_col.a);
  }
}`;

  let prog, vao, ibuf, cornerBuf, cap = 0;

  St.init = function () {
    const gl = G.gl;
    prog = G.program(VS, FS, 'strokes');
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    cornerBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    ibuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf);
    const F = 4, S = STRIDE * F;
    const attr = (loc, size, off) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, S, off * F);
      gl.vertexAttribDivisor(loc, 1);
    };
    attr(1, 3, 0); attr(2, 3, 3); attr(3, 4, 6); attr(4, 2, 10); attr(5, 2, 12);
    gl.bindVertexArray(null);
  };

  // ------------------------------------------------------------ batch builder
  class Batch {
    constructor(n = 4096) { this.d = new Float32Array(n * STRIDE); this.n = 0; }
    reset() { this.n = 0; return this; }
    grow() { const d = new Float32Array(this.d.length * 2); d.set(this.d); this.d = d; }
    seg(x0, y0, z0, x1, y1, z1, r, g, b, a, w, wpx, u0, u1) {
      if ((this.n + 1) * STRIDE > this.d.length) this.grow();
      const d = this.d, o = this.n * STRIDE;
      d[o] = x0; d[o + 1] = y0; d[o + 2] = z0; d[o + 3] = x1; d[o + 4] = y1; d[o + 5] = z1;
      d[o + 6] = r; d[o + 7] = g; d[o + 8] = b; d[o + 9] = a; d[o + 10] = w; d[o + 11] = wpx || 0; d[o + 12] = u0 || 0; d[o + 13] = u1 || 0;
      this.n++;
    }
    // pts: flat [x,y,z,...]; draws the portion [from,to] (0..1 along length)
    poly(pts, col, a, w, opt = {}) {
      const n = pts.length / 3;
      if (n < 2) return;
      const from = opt.from || 0, to = opt.to == null ? 1 : opt.to, wpx = opt.wpx || 0;
      const closed = !!opt.closed;
      const segs = closed ? n : n - 1;
      if (to <= from) return;
      const taper = opt.taper || 0;
      for (let i = 0; i < segs; i++) {
        const u0 = i / segs, u1 = (i + 1) / segs;
        if (u1 < from || u0 > to) continue;
        const j = (i + 1) % n;
        let x0 = pts[i * 3], y0 = pts[i * 3 + 1], z0 = pts[i * 3 + 2], x1 = pts[j * 3], y1 = pts[j * 3 + 1], z1 = pts[j * 3 + 2];
        let a0 = u0, a1 = u1;
        if (u0 < from) { const k = (from - u0) / (u1 - u0); x0 += (x1 - x0) * k; y0 += (y1 - y0) * k; z0 += (z1 - z0) * k; a0 = from; }
        if (u1 > to) { const k = (to - u0) / (u1 - u0); x1 = x0 + (x1 - x0) * k; y1 = y0 + (y1 - y0) * k; z1 = z0 + (z1 - z0) * k; a1 = to; }
        let aa = a;
        if (taper > 0) { const um = (a0 + a1) * 0.5; aa *= M.smooth(0, taper, um) * M.smooth(1, 1 - taper, um); }
        this.seg(x0, y0, z0, x1, y1, z1, col[0], col[1], col[2], aa, w, wpx, a0, a1);
      }
    }
  }
  St.Batch = Batch;

  // ------------------------------------------------------------ camera helper
  // Camera looking at the z=0 design plane; at dist 3 with fov 2*atan(1/3) the plane spans y in [-1,1].
  St.FOV = 2 * Math.atan(1 / 3);
  St.camera = function (o = {}) {
    const aspect = V.Rn.aspect;
    const fov = o.fov || St.FOV;
    const eye = o.eye || [0, 0, 3], at = o.at || [0, 0, 0];
    let up = o.up || [0, 1, 0];
    if (o.roll) up = [Math.sin(o.roll), Math.cos(o.roll), 0];
    const P = Mat.persp(fov, aspect, o.near || 0.05, o.far || 500);
    const Vw = Mat.lookAt(eye, at, up);
    return { vp: Mat.mul(P, Vw), f: 1 / Math.tan(fov / 2), eye, P, V: Vw };
  };
  St.flatCam = () => St.camera();

  St.draw = function (batch, cam, o = {}) {
    if (!batch.n) return;
    const gl = G.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf);
    const bytes = batch.n * STRIDE;
    if (bytes > cap) { gl.bufferData(gl.ARRAY_BUFFER, batch.d.byteLength, gl.DYNAMIC_DRAW); cap = batch.d.length; }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, batch.d, 0, bytes);
    const style = o.style === 'ink' ? 1 : o.style === 'solid' ? 2 : 0;
    G.blend(o.blend || (style === 2 ? 'add' : 'max'));
    const H = V.Rn.H;
    prog.use({
      u_vp: cam.vp, u_res: [V.Rn.W, V.Rn.H], u_pxPerUnit: (H / 2) * cam.f, u_minPx: o.minPx == null ? 0.6 : o.minPx,
      u_glow: o.glow || (style === 0 ? 3.2 : 1.3), u_style: style, u_intensity: o.intensity == null ? 1 : o.intensity,
      u_halo: o.halo || 1.4, u_time: V.Rn.time, u_core: o.core == null ? 0.8 : o.core,
    });
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, batch.n);
    gl.bindVertexArray(null);
  };

  // ------------------------------------------------------------ shapes -> chunked form for morphing
  // A shape: { strokes: [{ p: [[x,y,z?],...], c: [r,g,b], w, a, closed }] }
  const K = (St.K = 110), P = (St.P = 22);

  function polyLen(p, closed) {
    let L = 0;
    const n = p.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = p[i], b = p[(i + 1) % n];
      L += Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] || 0) - (a[2] || 0));
    }
    return L;
  }
  // sample polyline at arc-length fraction
  function sampler(p, closed) {
    const pts = closed ? p.concat([p[0]]) : p;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] || 0) - (a[2] || 0)));
    }
    const L = cum[cum.length - 1] || 1e-6;
    return (u) => {
      const s = M.clamp(u, 0, 1) * L;
      let lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
      const seg = cum[hi] - cum[lo] || 1e-6, k = (s - cum[lo]) / seg, a = pts[lo], b = pts[hi];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * k];
    };
  }

  St.chunk = function (shape) {
    if (shape._chunks) return shape._chunks;
    let strokes = shape.strokes.filter((s) => s.p && s.p.length > 1);
    const lens = strokes.map((s) => polyLen(s.p, s.closed));
    let order = strokes.map((s, i) => i).sort((a, b) => lens[b] - lens[a]);
    if (order.length > K) order = order.slice(0, K);
    const total = order.reduce((s, i) => s + lens[i], 0) || 1;
    const alloc = new Map();
    let used = 0;
    for (const i of order) { const n = Math.max(1, Math.floor((K * lens[i]) / total)); alloc.set(i, n); used += n; }
    // distribute remainder to longest strokes (or remove from them)
    let k = 0;
    while (used < K) { const i = order[k % order.length]; alloc.set(i, alloc.get(i) + 1); used++; k++; }
    k = 0;
    while (used > K) { const i = order[k % order.length]; if (alloc.get(i) > 1) { alloc.set(i, alloc.get(i) - 1); used--; } k++; }
    const pts = new Float32Array(K * P * 3), col = new Float32Array(K * 3), wid = new Float32Array(K), alp = new Float32Array(K);
    const cen = new Float32Array(K * 3), meta = [];
    let c = 0;
    for (const i of order.slice().sort((a, b) => a - b)) {
      const s = strokes[i], n = alloc.get(i), smp = sampler(s.p, s.closed);
      for (let j = 0; j < n; j++) {
        const u0 = j / n, u1 = (j + 1) / n;
        let cx = 0, cy = 0, cz = 0;
        for (let q = 0; q < P; q++) {
          const v = smp(u0 + ((u1 - u0) * q) / (P - 1));
          pts.set(v, (c * P + q) * 3);
          cx += v[0]; cy += v[1]; cz += v[2];
        }
        cen[c * 3] = cx / P; cen[c * 3 + 1] = cy / P; cen[c * 3 + 2] = cz / P;
        const cc = s.c || [1, 1, 1];
        col[c * 3] = cc[0]; col[c * 3 + 1] = cc[1]; col[c * 3 + 2] = cc[2];
        wid[c] = s.w == null ? 0.012 : s.w; alp[c] = s.a == null ? 1 : s.a;
        meta.push({ stroke: i, u0, u1 });
        c++;
      }
    }
    shape._chunks = { pts, col, wid, alp, cen, meta, n: c };
    return shape._chunks;
  };

  // pair chunks of A with chunks of B (greedy nearest centroid, with direction flip)
  St.pair = function (A, B) {
    const a = St.chunk(A), b = St.chunk(B);
    const key = '_pair_' + (B._id || (B._id = Math.random().toString(36).slice(2)));
    if (A[key]) return A[key];
    const n = K, pairs = [];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const dx = a.cen[i * 3] - b.cen[j * 3], dy = a.cen[i * 3 + 1] - b.cen[j * 3 + 1], dz = a.cen[i * 3 + 2] - b.cen[j * 3 + 2];
        pairs.push([dx * dx + dy * dy + dz * dz, i, j]);
      }
    pairs.sort((x, y) => x[0] - y[0]);
    const ua = new Uint8Array(n), ub = new Uint8Array(n), map = new Int16Array(n), flip = new Uint8Array(n);
    let left = n;
    for (const [, i, j] of pairs) {
      if (ua[i] || ub[j]) continue;
      ua[i] = ub[j] = 1; map[i] = j; left--;
      // flip if reversed direction is closer
      const s0 = i * P * 3, e0 = (i * P + P - 1) * 3, s1 = j * P * 3, e1 = (j * P + P - 1) * 3;
      const d = (p, q) => Math.hypot(a.pts[p] - b.pts[q], a.pts[p + 1] - b.pts[q + 1]);
      flip[i] = d(s0, s1) + d(e0, e1) > d(s0, e1) + d(e0, s1) ? 1 : 0;
      if (!left) break;
    }
    return (A[key] = { map, flip });
  };

  // ------------------------------------------------------------ emitting shapes into a batch
  // o: { model(mat4), from/to reveal, jitter (pencil boil), passes, seed, alpha, width scale, colorOverride, time }
  const tmp = new Float32Array(P * 3);
  function xform(m, x, y, z) {
    if (!m) return [x, y, z];
    return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
  }

  // Emit a (possibly morphing) shape. A, B shapes; t in [0,1] morph progress (ignored if !B)
  St.emit = function (batch, A, B, t, o = {}) {
    const a = St.chunk(A);
    const b = B ? St.chunk(B) : null;
    const pr = B ? St.pair(A, B) : null;
    const model = o.model || null;
    const passes = o.passes || 1;
    const jit = o.jitter || 0;
    const boil = o.boil == null ? Math.floor((o.time || 0) * 12) : o.boil;
    const ws = o.wscale == null ? 1 : o.wscale;
    const alpha = o.alpha == null ? 1 : o.alpha;
    const swirl = o.swirl == null ? 0.35 : o.swirl;
    const stagger = o.stagger == null ? 0.45 : o.stagger;
    const time = o.time || 0;
    const from = o.from || 0, to = o.to == null ? 1 : o.to;
    const n = a.n;
    for (let i = 0; i < n; i++) {
      let e = 0, j = 0, fl = 0;
      if (b) {
        j = pr.map[i]; fl = pr.flip[i];
        // stagger by centroid x (sweep) + hash
        const sweep = o.sweepFn ? o.sweepFn(a.cen[i * 3], a.cen[i * 3 + 1], i) : (a.cen[i * 3] * 0.25 + 0.5) * 0.7 + R.hash(i) * 0.3;
        const d = M.clamp(sweep, 0, 1) * stagger;
        e = M.clamp((t - d) / (1 - stagger));
        e = e * e * (3 - 2 * e);
      }
      const sw = Math.sin(Math.PI * e) * swirl;
      // colour/width/alpha
      let cr = a.col[i * 3], cg = a.col[i * 3 + 1], cb = a.col[i * 3 + 2], w = a.wid[i], al = a.alp[i];
      if (b) {
        cr += (b.col[j * 3] - cr) * e; cg += (b.col[j * 3 + 1] - cg) * e; cb += (b.col[j * 3 + 2] - cb) * e;
        w += (b.wid[j] - w) * e; al += (b.alp[j] - al) * e;
      }
      if (o.color) { const c = typeof o.color === 'function' ? o.color(i, a.cen[i * 3], a.cen[i * 3 + 1]) : o.color; cr = c[0]; cg = c[1]; cb = c[2]; }
      if (o.colorMul) { cr *= o.colorMul[0]; cg *= o.colorMul[1]; cb *= o.colorMul[2]; }
      let aa = al * alpha;
      if (o.flicker) aa *= o.flicker(i);
      if (aa <= 0.002) continue;
      for (let pass = 0; pass < passes; pass++) {
        const seed = i * 7.31 + pass * 131.7 + boil * 17.13;
        const jx = jit ? (R.hash(seed) - 0.5) * 2 * jit : 0, jy = jit ? (R.hash(seed + 3.1) - 0.5) * 2 * jit : 0;
        const rot = jit ? (R.hash(seed + 7.7) - 0.5) * jit * 1.2 : 0;
        for (let q = 0; q < P; q++) {
          const ia = (i * P + q) * 3;
          let x = a.pts[ia], y = a.pts[ia + 1], z = a.pts[ia + 2];
          if (b) {
            const qb = fl ? P - 1 - q : q, ib = (j * P + qb) * 3;
            x += (b.pts[ib] - x) * e; y += (b.pts[ib + 1] - y) * e; z += (b.pts[ib + 2] - z) * e;
            if (sw > 0) {
              const nx = R.perlin3(x * 1.7, y * 1.7, time * 0.7 + i * 0.01), ny = R.perlin3(x * 1.7 + 31.3, y * 1.7, time * 0.7);
              x += nx * sw; y += ny * sw; z += R.perlin3(x, y + 9.1, time * 0.5) * sw * 0.8;
            }
          }
          if (o.warp) { const r = o.warp(x, y, z, i, q); x = r[0]; y = r[1]; z = r[2]; }
          if (jit) {
            // smooth hand wobble along the chunk + per-pass offset, rotating slightly about chunk centre
            const u = q / (P - 1);
            x += jx + R.noise1(u * 2.5 + seed) * jit * 0.8 + rot * (y - a.cen[i * 3 + 1]);
            y += jy + R.noise1(u * 2.5 + seed + 50) * jit * 0.8 - rot * (x - a.cen[i * 3]);
          }
          const p = xform(model, x, y, z);
          tmp[q * 3] = p[0]; tmp[q * 3 + 1] = p[1]; tmp[q * 3 + 2] = p[2];
        }
        // reveal: map global [from,to] on stroke param via chunk meta
        let cf = 0, ct = 1;
        if (from > 0 || to < 1) {
          const m = a.meta[i];
          const rv = o.revealByStroke ? [from, to] : [from, to];
          const u0 = m.u0, u1 = m.u1;
          const key = o.revealGlobal ? i / n : null;
          if (key != null) { if (key > to || key + 1 / n < from) continue; cf = M.clamp((from - key) * n); ct = M.clamp((to - key) * n); }
          else { cf = M.clamp((rv[0] - u0) / (u1 - u0)); ct = M.clamp((rv[1] - u0) / (u1 - u0)); }
          if (ct <= cf) continue;
        }
        batch.poly(tmp, [cr, cg, cb], aa * (pass ? 0.8 : 1), w * ws, { from: cf, to: ct, wpx: o.wpx || 0, taper: o.taper || 0 });
      }
    }
  };

  // simple (non-morph) drawing of raw strokes, useful for dynamic geometry (reels, grids, rays)
  St.emitRaw = function (batch, strokes, o = {}) {
    const model = o.model || null, alpha = o.alpha == null ? 1 : o.alpha, ws = o.wscale == null ? 1 : o.wscale;
    const jit = o.jitter || 0, passes = o.passes || 1, boil = o.boil == null ? Math.floor((o.time || 0) * 12) : o.boil;
    for (let si = 0; si < strokes.length; si++) {
      const s = strokes[si];
      if (!s.p || s.p.length < 2) continue;
      const n = s.p.length;
      const c = o.color || s.c || [1, 1, 1];
      const a = (s.a == null ? 1 : s.a) * alpha;
      if (a <= 0.002) continue;
      for (let pass = 0; pass < passes; pass++) {
        const seed = si * 7.31 + pass * 131.7 + boil * 17.13;
        const arr = new Float32Array(n * 3);
        for (let q = 0; q < n; q++) {
          let x = s.p[q][0], y = s.p[q][1], z = s.p[q][2] || 0;
          if (jit) {
            const u = q / Math.max(1, n - 1);
            x += (R.hash(seed) - 0.5) * jit * 1.6 + R.noise1(u * 3 + seed) * jit * 0.7;
            y += (R.hash(seed + 3.3) - 0.5) * jit * 1.6 + R.noise1(u * 3 + seed + 40) * jit * 0.7;
          }
          const p = xform(model, x, y, z);
          arr[q * 3] = p[0]; arr[q * 3 + 1] = p[1]; arr[q * 3 + 2] = p[2];
        }
        batch.poly(arr, c, a * (pass ? 0.8 : 1), (s.w == null ? 0.012 : s.w) * ws, { closed: s.closed, from: o.from || 0, to: o.to == null ? 1 : o.to, wpx: o.wpx || 0, taper: o.taper || 0 });
      }
    }
  };
})();
