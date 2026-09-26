/* Text: SDF glyph atlases (built at load from embedded fonts), styled text drawing, glyph outline strokes. */
(function () {
  'use strict';
  const V = window.V, G = V.G, M = V.M, Mat = V.Mat;
  const Tx = (V.Tx = {});
  const CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~’—¢";
  const FONT_PX = 96, PAD = 18, RADIUS = 18, CUTOFF = 0.5;
  Tx.fonts = {};

  // ---- Felzenszwalb/Huttenlocher squared EDT (as in Mapbox TinySDF)
  const INF = 1e20;
  function edt1d(grid, offset, stride, length, f, v, z) {
    v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 0; q < length; q++) f[q] = grid[offset + q * stride];
    for (let q = 1, k = 0, s = 0; q < length; q++) {
      do {
        const r = v[k];
        s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
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

  // Build an SDF atlas for one family. Returns {tex, glyphs:{ch:{...}}, ascent, descent}
  Tx.buildFont = function (name, family, opt = {}) {
    const px = opt.px || FONT_PX;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const font = `${opt.weight || 400} ${px}px "${family}", sans-serif`;
    ctx.font = font;
    const fm = ctx.measureText('Hg');
    const ascent = Math.ceil(fm.fontBoundingBoxAscent || px * 0.9), descent = Math.ceil(fm.fontBoundingBoxDescent || px * 0.25);
    // measure glyphs
    const gl = [];
    for (const ch of CHARS) {
      const m = ctx.measureText(ch);
      const l = Math.ceil(m.actualBoundingBoxLeft || 0), r = Math.ceil(m.actualBoundingBoxRight || m.width);
      const a = Math.ceil(m.actualBoundingBoxAscent || 0), d = Math.ceil(m.actualBoundingBoxDescent || 0);
      const w = Math.max(1, l + r), h = Math.max(1, a + d);
      gl.push({ ch, adv: m.width, l, r, a, d, w: w + PAD * 2, h: h + PAD * 2, empty: ch === ' ' });
    }
    // shelf pack
    const AW = 2048;
    let x = 0, y = 0, rowH = 0;
    for (const g of gl) {
      if (x + g.w > AW) { x = 0; y += rowH; rowH = 0; }
      g.x = x; g.y = y; x += g.w; rowH = Math.max(rowH, g.h);
    }
    const AH = Math.pow(2, Math.ceil(Math.log2(y + rowH)));
    const atlas = new Uint8Array(AW * AH);
    // render each glyph to a scratch canvas and compute SDF
    const maxW = Math.max(...gl.map((g) => g.w)), maxH = Math.max(...gl.map((g) => g.h));
    c.width = maxW; c.height = maxH;
    ctx.font = font; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff';
    const n = Math.max(maxW, maxH);
    const f = new Float64Array(n), v = new Uint16Array(n), z = new Float64Array(n + 1);
    const outer = new Float64Array(maxW * maxH), inner = new Float64Array(maxW * maxH);
    for (const g of gl) {
      g.sdf = null;
      if (g.empty) continue;
      ctx.clearRect(0, 0, maxW, maxH);
      ctx.fillText(g.ch, PAD + g.l, PAD + g.a);
      const img = ctx.getImageData(0, 0, g.w, g.h).data;
      const N = g.w * g.h;
      for (let i = 0; i < N; i++) {
        const a = img[i * 4 + 3] / 255;
        if (a >= 0.999) { outer[i] = 0; inner[i] = INF; }
        else if (a <= 0.001) { outer[i] = INF; inner[i] = 0; }
        else { const d = 0.5 - a; outer[i] = d > 0 ? d * d : 0; inner[i] = d < 0 ? d * d : 0; }
      }
      edt(outer, g.w, g.h, f, v, z);
      edt(inner, g.w, g.h, f, v, z);
      const sd = new Float32Array(N);
      for (let yy = 0; yy < g.h; yy++)
        for (let xx = 0; xx < g.w; xx++) {
          const i = yy * g.w + xx;
          const d = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
          sd[i] = d;
          atlas[(g.y + yy) * AW + g.x + xx] = Math.round(255 - 255 * M.clamp(d / RADIUS + CUTOFF, 0, 1));
        }
      g.sdf = sd;
    }
    const tex = G.texture(AW, AH, { ifmt: G.gl.R8, fmt: G.gl.RED, type: G.gl.UNSIGNED_BYTE, data: atlas, float: false });
    const glyphs = {};
    for (const g of gl) glyphs[g.ch] = g;
    const F = { name, family, px, tex, glyphs, ascent, descent, AW, AH };
    Tx.fonts[name] = F;
    return F;
  };

  // ------------------------------------------------------------ layout
  // size = design units per font px*px (i.e. em height ~ size). Returns glyph list centred per align.
  Tx.layout = function (fontName, str, o = {}) {
    const F = Tx.fonts[fontName];
    const size = o.size || 0.2, k = size / F.px, track = (o.tracking || 0) * F.px;
    const lines = String(str).split('\n');
    const lh = (F.ascent + F.descent) * (o.lineHeight || 1.0);
    const out = [];
    let maxW = 0;
    const widths = [];
    for (const line of lines) {
      let w = 0;
      for (const ch of line) { const g = F.glyphs[ch] || F.glyphs['?']; w += g.adv + track; }
      w -= track; widths.push(w); maxW = Math.max(maxW, w);
    }
    let idx = 0;
    lines.forEach((line, li) => {
      let x = o.align === 'left' ? 0 : o.align === 'right' ? -widths[li] : -widths[li] / 2;
      const by = -li * lh;
      let ci = 0;
      for (const ch of line) {
        const g = F.glyphs[ch] || F.glyphs['?'];
        if (!g.empty) {
          const gx = x - g.l - PAD, gy = by + g.a + PAD; // top-left of cell in font px (y up)
          out.push({
            ch, i: idx, li, ci, cx: (gx + g.w / 2) * k, cy: (gy - g.h / 2) * k, w: g.w * k, h: g.h * k,
            u0: g.x / F.AW, v0: g.y / F.AH, u1: (g.x + g.w) / F.AW, v1: (g.y + g.h) / F.AH,
            penX: x * k, adv: g.adv * k, g,
          });
        }
        x += g.adv + track; idx++; ci++;
      }
    });
    // vertical centring: centre of cap height of the whole block
    const capH = F.ascent * 0.72;
    const totalH = (lines.length - 1) * lh + capH;
    const oy = o.valign === 'baseline' ? 0 : (totalH / 2 - capH) * k;
    for (const q of out) q.cy += oy;
    return { F, glyphs: out, width: maxW * k, height: totalH * k, size, k, nchars: idx, lineH: lh * k };
  };

  // ------------------------------------------------------------ drawing
  const VS = `#version 300 es
layout(location=0) in vec2 a_corner;
layout(location=1) in vec4 a_pos;   // x,y,z, rot
layout(location=2) in vec4 a_size;  // w,h, scale, alpha
layout(location=3) in vec4 a_uv;    // u0 v0 u1 v1
layout(location=4) in vec4 a_extra; // shear, rand, glyph index, colour mix
uniform mat4 u_vp, u_model;
out vec2 v_uv; out vec2 v_local; out float v_alpha; out vec4 v_extra; out vec2 v_q;
void main(){
  vec2 c = a_corner*0.5;
  vec2 q = c*a_size.xy*a_size.z;
  q.x += q.y*a_extra.x;
  float cr = cos(a_pos.w), sr = sin(a_pos.w);
  q = vec2(cr*q.x - sr*q.y, sr*q.x + cr*q.y);
  vec4 wp = u_model*vec4(a_pos.xy + q, a_pos.z, 1.0);
  gl_Position = u_vp*wp;
  v_uv = mix(a_uv.xy, a_uv.zw, vec2(c.x+0.5, 0.5-c.y));
  v_local = a_pos.xy + c*a_size.xy; // unrotated text-space position
  v_q = c + 0.5;
  v_alpha = a_size.w; v_extra = a_extra;
}`;

  const FS = `#version 300 es
${G.GLSL_COMMON}
in vec2 v_uv; in vec2 v_local; in float v_alpha; in vec4 v_extra; in vec2 v_q; out vec4 o;
uniform sampler2D u_atlas; uniform float u_radius, u_style, u_time, u_outline, u_glow, u_thick, u_top, u_bot, u_edgeSoft;
uniform vec3 u_col, u_col2, u_glowCol; uniform float u_intensity, u_rainbow;
float sdAt(vec2 uv){ return (0.5 - texture(u_atlas, uv).r) * u_radius; } // atlas px, + outside
void main(){
  float d = sdAt(v_uv);
  float aa = max(fwidth(d), 0.02) * (0.7 + u_edgeSoft);
  float fill = 1.0 - smoothstep(-aa, aa, d);
  vec3 c = vec3(0.0); float a = 0.0;
  // normalised vertical position within cap box for gradients
  float gy = clamp((v_local.y - u_bot)/(u_top - u_bot), 0.0, 1.0);
  if(u_style < 0.5){                                  // flat fill (u_col) + outline (u_col2) + glow
    float ol = 1.0 - smoothstep(u_outline-aa, u_outline+aa, d);
    vec3 fc = mix(u_col, u_glowCol, v_extra.w) * u_intensity;
    if(u_rainbow > 0.0) fc = hsv2rgb(vec3(fract(v_extra.z*0.083 + u_time*0.35), 0.85, 1.0))*u_intensity*mix(0.85,1.15,gy);
    c = mix(u_col2, fc, fill) * ol;
    a = ol;
    float g = exp(-max(d-u_outline,0.0)/(u_glow+0.001)) * (1.0-ol) * step(0.001, u_glow) * smoothstep(8.8, 4.5, d);
    c += u_glowCol * g;
  } else if(u_style < 1.5){                           // CHROME
    vec3 sky0 = vec3(0.05,0.10,0.35), sky1 = vec3(0.55,0.85,1.0), hor = vec3(1.0), gnd0 = vec3(0.22,0.08,0.02), gnd1 = vec3(1.0,0.78,0.45);
    vec3 grad;
    float h = 0.48 + 0.03*sin(v_local.x*3.0);
    if(gy > h){ float t = (gy-h)/(1.0-h); grad = mix(sky1, sky0, pow(t,0.8)); grad = mix(grad, vec3(1.0), smoothstep(0.06,0.0,gy-h)*0.9); }
    else { float t = gy/h; grad = mix(gnd1, gnd0, pow(1.0-t, 1.0)*0.9 + 0.1); grad = mix(grad, gnd0*0.5, smoothstep(0.08,0.0,h-gy)); }
    // bevel from sdf gradient
    vec2 gdir = normalize(vec2(dFdx(d), dFdy(d)) + 1e-5);
    float bevel = smoothstep(-u_thick, 0.0, d);
    float spec = pow(clamp(dot(-gdir, normalize(vec2(-0.6,0.8))),0.0,1.0), 3.0) * bevel;
    grad += spec*1.2 - bevel*0.25;
    float ol = 1.0 - smoothstep(u_outline-aa, u_outline+aa, d);
    c = mix(u_col2, grad, fill);
    a = ol;
    c *= a;
    float g = exp(-max(d-u_outline,0.0)/(u_glow+0.001)) * (1.0-a) * step(0.001,u_glow) * smoothstep(8.8, 4.5, d);
    c += u_glowCol*g;
    // sweeping glint
    float sweep = fract(u_time*0.35 + v_extra.y*0.0) ;
    float gl = exp(-pow((v_local.x*0.6 - v_local.y*0.3) - (sweep*6.0-3.0), 2.0)*30.0) * fill;
    c += vec3(1.0)*gl*1.5;
  } else if(u_style < 2.5){                           // NEON TUBE along the outline
    float t = abs(d - u_outline);
    float w = u_thick;
    float body = 1.0 - smoothstep(w-aa, w+aa, t);
    float core = 1.0 - smoothstep(w*0.3-aa, w*0.3+aa, t);
    float halo = exp(-max(t-w,0.0)/(u_glow+0.001)) * smoothstep(8.8, 4.5, d);
    vec3 col = mix(u_col, u_col2, v_extra.w);
    c = col*(body*1.8 + halo*0.7) + (col*0.4+0.6)*core*1.2;
    a = body*0.0; // emissive (additive-ish)
    // faint dark inner fill for legibility
    c += vec3(0.0);
  } else if(u_style < 3.5){                           // HOT fill (emissive gradient) + dark outline + glow
    vec3 top = u_col, bot = u_col2;
    if(u_rainbow > 0.0){ float hh = fract(v_extra.z*0.083 + u_time*0.35); top = hsv2rgb(vec3(hh, 0.55, 1.0)); bot = hsv2rgb(vec3(hh+0.08, 0.95, 1.0)); }
    vec3 fc = mix(bot, top, gy);
    float stripe = step(0.5, fract(gy*6.0 - 0.1)) * step(gy, 0.45) * 0.25;
    fc *= 1.0 - stripe;
    float ol = 1.0 - smoothstep(u_outline-aa, u_outline+aa, d);
    c = mix(vec3(0.02,0.0,0.06), fc*u_intensity, fill) * ol;
    a = ol;
    float g = exp(-max(d-u_outline,0.0)/(u_glow+0.001)) * (1.0-a) * step(0.001,u_glow) * smoothstep(8.8, 4.5, d);
    c += u_glowCol*g;
  } else {                                            // PENCIL: hatched graphite fill with wobbly edge
    float wob = (vnoise(v_local*40.0 + floor(u_time*12.0)*7.0)-0.5)*2.5;
    float dd = d + wob;
    float edge = 1.0 - smoothstep(0.0, 1.5, abs(dd+0.8));
    float inside = 1.0 - smoothstep(-0.5, 0.5, dd);
    vec2 hp = gl_FragCoord.xy;
    float hatch = smoothstep(0.55, 0.9, sin((hp.x + hp.y)*0.9)*0.5+0.5);
    float ink = max(edge*0.95, inside*hatch*0.55);
    ink *= mix(0.6, 1.0, hash21(floor(gl_FragCoord.xy)));
    c = u_col * ink; a = ink;
  }
  o = vec4(c, a) * v_alpha;
}`;

  let prog, vao, ibuf, cap = 0;
  const IS = 16; // floats per instance
  Tx.init = function () {
    const gl = G.gl;
    prog = G.program(VS, FS, 'text');
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const cb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    ibuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf);
    for (let i = 0; i < 4; i++) {
      gl.enableVertexAttribArray(1 + i);
      gl.vertexAttribPointer(1 + i, 4, gl.FLOAT, false, IS * 4, i * 16);
      gl.vertexAttribDivisor(1 + i, 1);
    }
    gl.bindVertexArray(null);
  };

  const STYLE = { fill: 0, chrome: 1, neon: 2, hot: 3, pencil: 4 };
  let inst = new Float32Array(IS * 512);

  // Draw a layout. o: { cam, model, style, col, col2, glowCol, glow, outline, thick, alpha,
  //   anim: (glyph, idx) => {x,y,z,rot,s,a,shear,mix} | null to skip, blend }
  Tx.draw = function (L, o = {}) {
    const gl = G.gl, F = L.F;
    const n = L.glyphs.length;
    if (!n) return;
    if (inst.length < n * IS) inst = new Float32Array(n * IS * 2);
    let c = 0;
    for (const g of L.glyphs) {
      let x = g.cx, y = g.cy, z = 0, r = 0, s = 1, a = o.alpha == null ? 1 : o.alpha, sh = o.shear || 0, mx = 0;
      if (o.anim) {
        const A = o.anim(g, g.i, L);
        if (!A) continue;
        if (A.x != null) x += A.x; if (A.y != null) y += A.y; if (A.z != null) z += A.z;
        if (A.rot != null) r = A.rot; if (A.s != null) s = A.s; if (A.a != null) a *= A.a; if (A.shear != null) sh = A.shear; if (A.mix != null) mx = A.mix;
      }
      if (a <= 0.003 || s <= 0.001) continue;
      const k = c * IS;
      inst[k] = x; inst[k + 1] = y; inst[k + 2] = z; inst[k + 3] = r;
      inst[k + 4] = g.w; inst[k + 5] = g.h; inst[k + 6] = s; inst[k + 7] = a;
      inst[k + 8] = g.u0; inst[k + 9] = g.v0; inst[k + 10] = g.u1; inst[k + 11] = g.v1;
      inst[k + 12] = sh; inst[k + 13] = V.R.hash(g.i * 3.7 + 1); inst[k + 14] = g.i; inst[k + 15] = mx;
      c++;
    }
    if (!c) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf);
    if (c * IS > cap) { gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW); cap = inst.length; }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst, 0, c * IS);
    const style = STYLE[o.style || 'fill'];
    G.blend(o.blend || (style === 2 ? 'add' : 'premul'));
    const cam = o.cam || V.St.flatCam();
    const top = L.height / 2, bot = -L.height / 2;
    const px = F.px;
    // outline/thick/glow are specified in atlas pixels (font px units)
    prog.use({
      u_vp: cam.vp, u_model: o.model || Mat.ident(), u_atlas: F.tex, u_radius: RADIUS, u_style: style, u_time: V.Rn.time,
      u_outline: o.outline == null ? (style === 2 ? 3 : 0) : o.outline, u_glow: o.glow == null ? 0 : o.glow, u_thick: o.thick == null ? (style === 2 ? 2.2 : 6) : o.thick,
      u_top: o.top == null ? top : o.top, u_bot: o.bot == null ? bot : o.bot, u_edgeSoft: o.soft || 0,
      u_col: o.col || [1, 1, 1], u_col2: o.col2 || [0.05, 0.0, 0.1], u_glowCol: o.glowCol || [1, 0.2, 0.6], u_intensity: o.intensity == null ? 1 : o.intensity, u_rainbow: o.rainbow ? 1 : 0,
    });
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, c);
    gl.bindVertexArray(null);
    void px;
  };

  // ------------------------------------------------------------ glyph outlines -> strokes (marching squares on SDF)
  function contours(g) {
    if (g._loops) return g._loops;
    const W = g.w, H = g.h, sd = g.sdf;
    const loops = [];
    if (!sd) return (g._loops = loops);
    const segs = [];
    const val = (x, y) => sd[y * W + x];
    const lerp = (x0, y0, v0, x1, y1, v1) => { const t = v0 / (v0 - v1); return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]; };
    for (let y = 0; y < H - 1; y++)
      for (let x = 0; x < W - 1; x++) {
        const a = val(x, y), b = val(x + 1, y), c = val(x + 1, y + 1), d = val(x, y + 1);
        const idx = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const e = [
          () => lerp(x, y, a, x + 1, y, b), () => lerp(x + 1, y, b, x + 1, y + 1, c),
          () => lerp(x, y + 1, d, x + 1, y + 1, c), () => lerp(x, y, a, x, y + 1, d),
        ];
        const T = {
          1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]],
          8: [[2, 3]], 9: [[2, 0]], 10: [[0, 1], [2, 3]], 11: [[2, 1]], 12: [[1, 3]], 13: [[1, 0]], 14: [[0, 3]],
        }[idx];
        for (const [p, q] of T) segs.push([e[p](), e[q]()]);
      }
    // link segments into loops
    const key = (p) => Math.round(p[0] * 64) + ',' + Math.round(p[1] * 64);
    const map = new Map();
    segs.forEach((s, i) => { const k = key(s[0]); if (!map.has(k)) map.set(k, []); map.get(k).push(i); });
    const used = new Uint8Array(segs.length);
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = 1;
      const loop = [segs[i][0], segs[i][1]];
      let cur = segs[i][1];
      for (let guard = 0; guard < 100000; guard++) {
        const cand = map.get(key(cur));
        let nxt = -1;
        if (cand) for (const j of cand) if (!used[j]) { nxt = j; break; }
        if (nxt < 0) break;
        used[nxt] = 1;
        cur = segs[nxt][1];
        loop.push(cur);
      }
      if (loop.length > 6) loops.push(loop);
    }
    // simplify: resample each loop at ~2.5 atlas px and light smoothing
    const out = [];
    for (const lp of loops) {
      const res = [];
      let acc = 0;
      res.push(lp[0]);
      for (let i = 1; i < lp.length; i++) {
        acc += Math.hypot(lp[i][0] - lp[i - 1][0], lp[i][1] - lp[i - 1][1]);
        if (acc >= 2.5) { res.push(lp[i]); acc = 0; }
      }
      if (res.length < 4) continue;
      const sm = res.map((p, i) => {
        const a = res[(i - 1 + res.length) % res.length], b = res[(i + 1) % res.length];
        return [(a[0] + p[0] * 2 + b[0]) / 4, (a[1] + p[1] * 2 + b[1]) / 4];
      });
      out.push(sm);
    }
    return (g._loops = out);
  }

  // Outline strokes for a string, in design units, centred like Tx.layout. Returns a shape.
  Tx.outlineShape = function (fontName, str, o = {}) {
    const L = Tx.layout(fontName, str, o);
    const k = L.k, strokes = [];
    for (const q of L.glyphs) {
      const loops = contours(q.g);
      for (const lp of loops) {
        const p = lp.map(([x, y]) => [q.cx - q.w / 2 + x * k, q.cy + q.h / 2 - y * k, 0]);
        strokes.push({ p, c: o.col || [1, 0.2, 0.6], w: o.w || 0.008, closed: true, a: 1, glyph: q.i });
      }
    }
    return { strokes, layout: L };
  };
})();
