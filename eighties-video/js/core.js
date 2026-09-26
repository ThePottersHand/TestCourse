/* Core: WebGL2 helpers, math, easing, noise. Everything hangs off window.V (the video namespace). */
(function () {
  'use strict';
  const V = (window.V = window.V || {});

  // ---------------------------------------------------------------- math
  const M = (V.M = {});
  M.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  M.mix = (a, b, t) => a + (b - a) * t;
  M.sat = (x) => M.clamp(x, 0, 1);
  M.smooth = (a, b, x) => {
    const t = M.clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  M.lin = (a, b, x) => M.clamp((x - a) / (b - a));
  M.fract = (x) => x - Math.floor(x);
  M.TAU = Math.PI * 2;
  M.mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  M.hex = (h, k = 1) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255 * k, ((n >> 8) & 255) / 255 * k, (n & 255) / 255 * k];
  };
  M.hsv = (h, s, v) => {
    h = M.fract(h) * 6;
    const i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
    return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
  };

  // easing
  const E = (V.E = {});
  E.inQuad = (t) => t * t;
  E.outQuad = (t) => 1 - (1 - t) * (1 - t);
  E.inOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  E.inCubic = (t) => t * t * t;
  E.outCubic = (t) => 1 - Math.pow(1 - t, 3);
  E.inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  E.outQuart = (t) => 1 - Math.pow(1 - t, 4);
  E.inQuart = (t) => t * t * t * t;
  E.outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  E.inExpo = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
  E.inOutExpo = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);
  E.outBack = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  E.inBack = (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t;
  E.outElastic = (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (M.TAU / 3)) + 1;
  };
  E.outBounce = (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  };
  // progress of t through [a,b] with easing
  E.span = (t, a, b, fn = E.inOutCubic) => fn(M.clamp((t - a) / (b - a)));

  // ---------------------------------------------------------------- random / noise
  const R = (V.R = {});
  R.hash = (n) => {
    // deterministic hash -> [0,1)
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };
  R.hash2 = (a, b) => R.hash(a * 57.31 + b * 113.97);
  R.rng = (seed) => {
    let s = seed >>> 0 || 1;
    return () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // 1D value noise (smooth)
  R.noise1 = (x) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return M.mix(R.hash(i), R.hash(i + 1), u) * 2 - 1;
  };
  // 3D simplex-ish gradient noise (compact Perlin improved) for CPU-side displacement
  const P = new Uint8Array(512);
  (function () {
    const r = R.rng(1985), p = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  })();
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y, z) => {
    const g = h & 15, u = g < 8 ? x : y, v = g < 4 ? y : g === 12 || g === 14 ? x : z;
    return ((g & 1) === 0 ? u : -u) + ((g & 2) === 0 ? v : -v);
  };
  R.perlin3 = (x, y, z) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
    return M.mix(
      M.mix(M.mix(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u), M.mix(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u), v),
      M.mix(M.mix(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u), M.mix(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u), v),
      w
    );
  };

  // ---------------------------------------------------------------- mat4 (column-major, like GL)
  const Mat = (V.Mat = {});
  Mat.ident = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  Mat.mul = (a, b) => {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
    return o;
  };
  Mat.persp = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  };
  Mat.ortho = (l, r, b, t, n, f) =>
    new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]);
  Mat.lookAt = (eye, at, up) => {
    let zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
    let l = Math.hypot(zx, zy, zz) || 1;
    zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.hypot(xx, xy, xz) || 1;
    xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1,
    ]);
  };
  Mat.translate = (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
  Mat.scale = (x, y, z) => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
  Mat.rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
  Mat.rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };
  Mat.rotZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); };
  Mat.chain = (...ms) => ms.reduce((a, b) => Mat.mul(a, b));
  Mat.apply = (m, p) => {
    const x = p[0], y = p[1], z = p[2] || 0;
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
  };

  // ---------------------------------------------------------------- GL
  const G = (V.G = {});
  G.init = function (canvas, opts) {
    const gl = canvas.getContext('webgl2', {
      antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false,
      preserveDrawingBuffer: !!opts.preserve, powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is not available in this browser.');
    G.gl = gl;
    G.floatRT = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');
    gl.getExtension('OES_texture_float_linear');
    // fullscreen triangle
    G.triVAO = gl.createVertexArray();
    gl.bindVertexArray(G.triVAO);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return gl;
  };

  G.compile = function (type, src, name) {
    const gl = G.gl, sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      const lines = src.split('\n').map((l, i) => (i + 1 + '').padStart(4) + ': ' + l).join('\n');
      console.error('Shader compile error in ' + name + ':\n' + log + '\n' + lines);
      throw new Error('Shader compile error in ' + name + ': ' + log);
    }
    return sh;
  };

  G.FULL_VS = `#version 300 es
layout(location=0) in vec2 a_pos;
out vec2 v_uv;
void main(){ v_uv = a_pos*0.5+0.5; gl_Position = vec4(a_pos,0.0,1.0); }`;

  // program with auto uniform setter
  G.program = function (vs, fs, name) {
    const gl = G.gl;
    const p = gl.createProgram();
    gl.attachShader(p, G.compile(gl.VERTEX_SHADER, vs, name + '.vs'));
    gl.attachShader(p, G.compile(gl.FRAGMENT_SHADER, fs, name + '.fs'));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Link error in ' + name + ': ' + gl.getProgramInfoLog(p));
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    const U = {};
    let unit = 0;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const nm = info.name.replace(/\[0\]$/, '');
      const loc = gl.getUniformLocation(p, info.name);
      const u = { loc, type: info.type, size: info.size };
      if (info.type === gl.SAMPLER_2D || info.type === gl.SAMPLER_3D) u.unit = unit++;
      U[nm] = u;
    }
    const prog = { p, U, name };
    prog.use = function (uniforms) {
      gl.useProgram(p);
      if (uniforms) prog.set(uniforms);
      return prog;
    };
    prog.set = function (uniforms) {
      for (const k in uniforms) {
        const u = U[k];
        if (!u) continue;
        const v = uniforms[k];
        switch (u.type) {
          case gl.FLOAT: u.size > 1 ? gl.uniform1fv(u.loc, v) : gl.uniform1f(u.loc, v); break;
          case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, v); break;
          case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, v); break;
          case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, v); break;
          case gl.INT: case gl.BOOL: gl.uniform1i(u.loc, v); break;
          case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.loc, false, v); break;
          case gl.FLOAT_MAT3: gl.uniformMatrix3fv(u.loc, false, v); break;
          case gl.SAMPLER_2D:
            gl.activeTexture(gl.TEXTURE0 + u.unit);
            gl.bindTexture(gl.TEXTURE_2D, v && v.tex ? v.tex : v);
            gl.uniform1i(u.loc, u.unit);
            break;
        }
      }
      return prog;
    };
    return prog;
  };

  // fullscreen shader from a fragment body
  G.fsProgram = (fs, name) => G.program(G.FULL_VS, fs, name);

  G.drawTri = function () {
    const gl = G.gl;
    gl.bindVertexArray(G.triVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  G.texture = function (w, h, opt = {}) {
    const gl = G.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    const float = opt.float && G.floatRT;
    const ifmt = opt.ifmt || (float ? gl.RGBA16F : gl.RGBA8);
    const fmt = opt.fmt || gl.RGBA;
    const type = opt.type || (float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, opt.data || null);
    const f = opt.nearest ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opt.mip ? gl.LINEAR_MIPMAP_LINEAR : f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    const wrap = opt.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  };

  // upload a 2D canvas as an RGBA8 texture (premultiplied off; mipmapped)
  G.canvasTex = function (cv) {
    const gl = G.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  G.target = function (w, h, opt = {}) {
    const gl = G.gl;
    const tex = G.texture(w, h, Object.assign({ float: true }, opt));
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let depth = null;
    if (opt.depth) {
      depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h, depth };
  };

  G.bind = function (t, clear) {
    const gl = G.gl;
    if (t) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.viewport(0, 0, t.w, t.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    if (clear) {
      gl.clearColor(clear[0], clear[1], clear[2], clear[3] == null ? 1 : clear[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | (t && t.depth ? gl.DEPTH_BUFFER_BIT : 0));
    }
  };

  G.blend = function (mode) {
    const gl = G.gl;
    if (!mode) { gl.disable(gl.BLEND); return; }
    gl.enable(gl.BLEND);
    if (mode === 'add') { gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE); }
    else if (mode === 'max') { gl.blendEquation(gl.MAX); gl.blendFunc(gl.ONE, gl.ONE); }
    else if (mode === 'premul') { gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
    else if (mode === 'alpha') { gl.blendEquation(gl.FUNC_ADD); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
    else if (mode === 'multiply') { gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.DST_COLOR, gl.ZERO); }
  };

  // Shared GLSL helpers (prepended to most fragment shaders)
  G.GLSL_COMMON = `
precision highp float;
#define PI 3.14159265359
#define TAU 6.28318530718
float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
vec3 hash33(vec3 p3){ p3 = fract(p3*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yxz+33.33); return fract((p3.xxy+p3.yxx)*p3.zyx); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+vec2(17.1,9.2); a*=0.5; } return s; }
float vnoise3(vec3 p){ vec3 i=floor(p), f=fract(p); vec3 u=f*f*(3.0-2.0*f);
  float n000=hash21(i.xy+i.z*37.1), n100=hash21(i.xy+vec2(1,0)+i.z*37.1), n010=hash21(i.xy+vec2(0,1)+i.z*37.1), n110=hash21(i.xy+vec2(1,1)+i.z*37.1);
  float n001=hash21(i.xy+(i.z+1.0)*37.1), n101=hash21(i.xy+vec2(1,0)+(i.z+1.0)*37.1), n011=hash21(i.xy+vec2(0,1)+(i.z+1.0)*37.1), n111=hash21(i.xy+vec2(1,1)+(i.z+1.0)*37.1);
  return mix(mix(mix(n000,n100,u.x),mix(n010,n110,u.x),u.y), mix(mix(n001,n101,u.x),mix(n011,n111,u.x),u.y), u.z); }
vec3 hsv2rgb(vec3 c){ vec3 p = abs(fract(c.xxx+vec3(0.,2./3.,1./3.))*6.0-3.0); return c.z*mix(vec3(1.0), clamp(p-1.0,0.0,1.0), c.y); }
float luma(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,d.y),0.0); }
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }
`;
})();
