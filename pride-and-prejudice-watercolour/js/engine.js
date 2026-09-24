// Watercolour renderer (WebGL2).
//
// The picture is built like a real watercolour: a sheet of paper, then transparent washes
// laid on top of one another. Every wash is a mask (any Canvas2D drawing, converted to a
// signed distance field) plus pigment settings. The shader turns the mask into paint:
// wobbly/rough edges, pigment pooling at the edge (edge darkening), granulation into the
// paper's valleys, uneven flow, wet-in-wet colour mixing, soft or hard edges, and growth.
// Washes multiply together (subtractive mixing, Beer-Lambert), so overlaps glaze and darken.
(function (WC) {
  'use strict';

  const NOISE = `
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
    return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
  float gnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.-15.)+10.);
    vec2 ga = hash22(i)*2.-1., gb = hash22(i+vec2(1,0))*2.-1., gc = hash22(i+vec2(0,1))*2.-1., gd = hash22(i+vec2(1,1))*2.-1.;
    float va = dot(ga, f), vb = dot(gb, f-vec2(1,0)), vc = dot(gc, f-vec2(0,1)), vd = dot(gd, f-vec2(1,1));
    return mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y) * 1.6; }
  float fbm(vec2 p){ float s = 0., a = .5; mat2 r = mat2(.8,.6,-.6,.8);
    for (int i = 0; i < 5; i++){ s += a * gnoise(p); p = r * p * 2.03 + 17.1; a *= .5; } return s; }
  float fbm3(vec2 p){ float s = 0., a = .5; mat2 r = mat2(.8,.6,-.6,.8);
    for (int i = 0; i < 3; i++){ s += a * gnoise(p); p = r * p * 2.03 + 17.1; a *= .5; } return s; }
  float worley(vec2 p){ vec2 i = floor(p), f = fract(p); float d = 8.;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){ vec2 g = vec2(x, y); vec2 o = hash22(i + g); d = min(d, length(g + o - f)); }
    return d; }
  `;

  const VS_FULL = `#version 300 es
  in vec2 aPos; void main(){ gl_Position = vec4(aPos * 2. - 1., 0., 1.); }`;

  const FS_PAPER = `#version 300 es
  precision highp float;
  uniform float uScale; uniform float uSeed; uniform vec2 uRes;
  out vec4 o;
  ${NOISE}
  void main(){
    vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale + uSeed * 97.;
    float w1 = worley(p / 7.5);
    float w2 = worley(p / 19. + 7.3);
    float w3 = worley(p / 3.2 + 3.1);
    float bumps = 1. - smoothstep(.05, 1.05, w1);
    float bumps2 = 1. - smoothstep(.0, 1.1, w2);
    float fine = 1. - smoothstep(.0, 1.0, w3);
    float fib = gnoise(vec2(p.x / 60., p.y / 2.2) + 3.) * .5 + .5;
    float h = .46 * bumps + .30 * bumps2 + .14 * fine + .10 * fib;
    h = clamp(h + .05 * vnoise(p / 1.3), 0., 1.);
    float mottle = fbm(p / 340.) * .5 + .5;
    float speck = step(.99935, hash12(floor(p * .9) + 11.)) * (hash12(floor(p * .9)) * .6 + .4);
    o = vec4(h, fine, mottle, speck);
  }`;

  // Wash: quad over the mask's rect, transformed to the screen.
  const VS_WASH = `#version 300 es
  in vec2 aPos;
  uniform mat3 uXf; uniform vec4 uRect; uniform vec2 uDesign;
  out vec2 vLocal;
  void main(){
    vec2 local = uRect.xy + aPos * uRect.zw;
    vec2 scr = (uXf * vec3(local, 1.)).xy;
    vLocal = local;
    gl_Position = vec4(scr.x / uDesign.x * 2. - 1., 1. - scr.y / uDesign.y * 2., 0., 1.);
  }`;

  const FS_WASH = `#version 300 es
  precision highp float;
  in vec2 vLocal;
  uniform sampler2D uMask; uniform sampler2D uPaper;
  uniform vec4 uRect; uniform vec2 uRes; uniform float uPxScale;  // screen px per local px
  uniform vec3 uPigA, uPigB;
  uniform vec4 uMix;       // dir.xy (unit), offset, width  (linear mix A->B)
  uniform vec2 uMixNoise;  // amount, scale
  uniform float uDensity, uEdge, uEdgeW, uSoft, uGrow, uHollow, uHollowW, uRim;
  uniform vec2 uWarp;      // amplitude px, scale px
  uniform vec2 uRough;     // amplitude px, scale px
  uniform float uGran, uFlow, uFlowScale, uDry, uSeed, uAlpha, uMode, uLift;
  uniform vec4 uReveal;    // dir.xy, position, softness (px) ; dir==0 disables
  uniform vec2 uRevealNoise;
  uniform vec4 uRadial;    // centre.xy, radius, softness ; radius<0 disables
  out vec4 o;
  ${NOISE}
  float sdfAt(vec2 lp){
    vec2 uv = (lp - uRect.xy) / uRect.zw;
    vec4 m = texture(uMask, uv);
    float fine = (m.r - .5) * 48.;        // +-24 px
    float coarse = (m.g - .5) * 384.;     // +-192 px
    float t = smoothstep(17., 22., abs(fine));
    // outside the texture rect everything is 'far outside'
    vec2 inside = step(vec2(0.), uv) * step(uv, vec2(1.));
    float d = mix(fine, coarse, t);
    return mix(-200., d, inside.x * inside.y);
  }
  void main(){
    vec2 sp = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    vec2 puv = gl_FragCoord.xy / uRes;
    vec4 paper = texture(uPaper, puv);
    float seed = uSeed * 13.17;
    vec2 lp = vLocal;
    // organic wobble of the whole edge
    vec2 w = vec2(fbm(lp / uWarp.y + seed), fbm(lp / uWarp.y + seed + 41.3)) * uWarp.x;
    float d = sdfAt(lp + w) + uGrow;
    // rough, fractal edge (paper and brush)
    d += fbm3(lp / uRough.y + seed * 1.7) * uRough.x;
    d += (paper.r - .5) * uRough.x * .6;
    // reveal (wipe) and radial bloom-in
    float vis = 1.;
    if (dot(uReveal.xy, uReveal.xy) > 0.) {
      float s = dot(lp, uReveal.xy) - uReveal.z + fbm(lp / uRevealNoise.y + seed + 9.) * uRevealNoise.x;
      vis *= 1. - smoothstep(-uReveal.w, uReveal.w, s);
    }
    if (uRadial.z >= 0.) {
      float r = length(lp - uRadial.xy) - uRadial.z + fbm(lp / 90. + seed + 3.) * uRadial.w * 1.5;
      vis *= 1. - smoothstep(-uRadial.w, uRadial.w, r);
    }
    float soft = max(uSoft, .7 / uPxScale);
    float cover = smoothstep(-soft, soft, d) * vis;
    if (cover < .002) discard;
    float din = max(d, 0.);
    float edgeBand = exp(-din / uEdgeW);
    float dens = uDensity * (1. - uHollow * smoothstep(0., uHollowW, din));
    dens = mix(dens, 0., uRim);
    dens += uDensity * uEdge * edgeBand;
    // flow: uneven pigment settling
    float flow = fbm(lp / uFlowScale + seed + 5.);
    dens *= max(0., 1. + uFlow * flow);
    // granulation: pigment sinks into the paper's valleys; flocculation speckle
    float gr = (.52 - paper.r) * 1.3 + fbm3(lp / 7. + seed) * .45;
    dens *= max(0., 1. + uGran * gr);
    // dry brush: paper peaks skip paint near the edges
    float dry = smoothstep(.45, .8, paper.r * .6 + (fbm3(lp / 26. + seed) * .5 + .5) * .6);
    cover *= 1. - uDry * dry * (.06 + .94 * edgeBand * edgeBand);
    // wet-in-wet pigment mixing
    float mx = 0.;
    if (uMix.w > 0.) {
      mx = (dot(lp, uMix.xy) - uMix.z) / uMix.w + fbm(lp / uMixNoise.y + seed + 21.) * uMixNoise.x;
      mx = smoothstep(-1., 1., mx);
    }
    vec3 pig = exp(mix(log(max(uPigA, .004)), log(max(uPigB, .004)), mx));
    float a = cover * uAlpha;
    if (uMode > .5) {
      // lift: pull the paint back toward clean paper
      o = vec4(1., 1., 1., clamp(a * uLift * (1. - .35 * edgeBand), 0., 1.));
    } else {
      o = vec4(pow(pig, vec3(dens * a)), 1.);
    }
  }`;

  // Ink / pencil / textured layer drawn with Canvas2D (alpha = coverage).
  const FS_INK = `#version 300 es
  precision highp float;
  uniform sampler2D uLayer; uniform sampler2D uPaper; uniform vec2 uRes;
  uniform vec3 uColor; uniform float uStrength, uBleed, uMode, uSeed, uAlpha;
  out vec4 o;
  ${NOISE}
  void main(){
    vec2 uv = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;
    vec2 puv = gl_FragCoord.xy / uRes;
    vec4 paper = texture(uPaper, puv);
    float a = texture(uLayer, uv).a;
    float dens;
    if (uMode < .5) {
      // iron-gall ink: slight feathering into damp paper, darker where it pools
      float b = textureLod(uLayer, uv, uBleed).a;
      float bb = textureLod(uLayer, uv, uBleed + 1.5).a;
      float feather = max(a, b * .3 + bb * .08);
      float pool = clamp(a - b, 0., 1.);
      dens = feather * (1. + .6 * pool) * (.88 + .24 * vnoise(gl_FragCoord.xy / 3. + uSeed));
    } else {
      // graphite: catches on the paper's peaks
      float g = smoothstep(.25, .72, paper.r + (vnoise(gl_FragCoord.xy / 1.4 + uSeed) - .5) * .5);
      dens = a * (.35 + .9 * g);
    }
    o = vec4(pow(max(uColor, vec3(.004)), vec3(dens * uStrength * uAlpha)), 1.);
  }`;

  const FS_COMPOSITE = `#version 300 es
  precision highp float;
  uniform sampler2D uAccum; uniform sampler2D uPaper; uniform vec2 uRes; uniform float uScale;
  uniform vec3 uPaperCol; uniform float uBump, uVignette, uGrain, uSeed;
  out vec4 o;
  ${NOISE}
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 T = texture(uAccum, uv).rgb;
    vec4 P = texture(uPaper, uv);
    vec2 px = 1. / uRes;
    float hl = texture(uPaper, uv - vec2(px.x, 0.)).r, hr = texture(uPaper, uv + vec2(px.x, 0.)).r;
    float hd = texture(uPaper, uv - vec2(0., px.y)).r, hu = texture(uPaper, uv + vec2(0., px.y)).r;
    vec3 n = normalize(vec3((hl - hr) * uBump * uScale, (hd - hu) * uBump * uScale, 1.));
    float light = dot(n, normalize(vec3(-.55, .55, .65)));
    vec3 paper = uPaperCol * (1. + (P.b - .5) * .07) * (1. - P.a * .22);
    vec3 col = paper * T;
    col *= .90 + .14 * light;
    // soft vignette like a sheet under a lamp
    vec2 q = uv - .5; q.x *= uRes.x / uRes.y;
    col *= 1. - uVignette * smoothstep(.35, 1.05, length(q));
    col += (hash12(gl_FragCoord.xy + uSeed * 91.) - .5) * uGrain;
    o = vec4(clamp(col, 0., 1.), 1.);
  }`;

  function compile(gl, vsSrc, fsSrc) {
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n'));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vsSrc)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fsSrc));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }

  const hex = (h) => {
    if (Array.isArray(h)) return h;
    const v = parseInt(h.replace('#', ''), 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  };
  WC.hex = hex;

  class Engine {
    constructor(canvas, opts = {}) {
      this.W = opts.width || 1920; this.H = opts.height || 1080;
      this.scale = opts.scale || 1;
      this.maskScale = opts.maskScale || Math.min(1.5, this.scale);
      canvas.width = Math.round(this.W * this.scale); canvas.height = Math.round(this.H * this.scale);
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: false });
      if (!gl) throw new Error('WebGL2 is required');
      this.gl = gl;
      this.floatOK = !!gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('OES_texture_float_linear');
      this.rw = canvas.width; this.rh = canvas.height;

      this.vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      this.prog = {
        paper: compile(gl, VS_FULL, FS_PAPER),
        wash: compile(gl, VS_WASH, FS_WASH),
        ink: compile(gl, VS_FULL, FS_INK),
        comp: compile(gl, VS_FULL, FS_COMPOSITE),
      };
      this.accum = this._target(this.floatOK ? gl.RGBA16F : gl.RGBA8, this.floatOK ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE);
      this.paper = this._target(gl.RGBA8, gl.UNSIGNED_BYTE);
      this.paperColour = hex(opts.paperColour || '#f5eee1');
      this.makePaper(opts.paperSeed || 1);
      this.layerTex = gl.createTexture();
    }

    _target(internal, type) {
      const gl = this.gl;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, this.rw, this.rh, 0, gl.RGBA, type, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fbo };
    }

    makePaper(seed) {
      const gl = this.gl, P = this.prog.paper;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.paper.fbo);
      gl.viewport(0, 0, this.rw, this.rh);
      gl.disable(gl.BLEND);
      gl.useProgram(P.p);
      gl.uniform1f(P.u.uScale, this.scale); gl.uniform1f(P.u.uSeed, seed);
      gl.uniform2f(P.u.uRes, this.rw, this.rh);
      gl.bindVertexArray(this.vao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // Build a mask from a Canvas2D drawing function. bbox is in local px {x,y,w,h}.
    mask(draw, bbox, opts = {}) {
      const gl = this.gl;
      const m = opts.margin != null ? opts.margin : 60;
      const ms = opts.maskScale || this.maskScale;
      const x0 = bbox.x - m, y0 = bbox.y - m, w = bbox.w + 2 * m, h = bbox.h + 2 * m;
      const cw = Math.max(4, Math.ceil(w * ms)), ch = Math.max(4, Math.ceil(h * ms));
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.setTransform(ms, 0, 0, ms, -x0 * ms, -y0 * ms);
      g.fillStyle = '#fff'; g.strokeStyle = '#fff';
      draw(g);
      const img = g.getImageData(0, 0, cw, ch);
      const sdf = WC.sdfFromAlpha(img.data, cw, ch);
      const px = new Uint8Array(cw * ch * 4);
      for (let i = 0; i < cw * ch; i++) {
        const d = sdf[i] / ms;
        px[i * 4] = Math.max(0, Math.min(255, Math.round((d / 48 + 0.5) * 255)));
        px[i * 4 + 1] = Math.max(0, Math.min(255, Math.round((d / 384 + 0.5) * 255)));
        px[i * 4 + 2] = img.data[i * 4 + 3];
        px[i * 4 + 3] = 255;
      }
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cw, ch, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return { tex, rect: [x0, y0, w, h] };
    }

    // Like mask(), but draws in world px and finds the bounding box automatically.
    // `pad` is how far outside the design frame drawings may extend.
    maskAuto(draw, opts = {}) {
      const ms = opts.maskScale || this.maskScale;
      const pad = opts.pad != null ? opts.pad : 240;
      const W = Math.ceil((this.W + 2 * pad) * ms), H = Math.ceil((this.H + 2 * pad) * ms);
      if (!this._scan || this._scan.width !== W || this._scan.height !== H) {
        this._scan = document.createElement('canvas'); this._scan.width = W; this._scan.height = H;
      }
      const g = this._scan.getContext('2d', { willReadFrequently: true });
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      g.setTransform(ms, 0, 0, ms, pad * ms, pad * ms);
      g.fillStyle = '#fff'; g.strokeStyle = '#fff';
      draw(g);
      const d = g.getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) {
        const row = y * W * 4;
        for (let x = 0; x < W; x++) {
          if (d[row + x * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
        }
      }
      if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 4; }
      const bbox = { x: x0 / ms - pad, y: y0 / ms - pad, w: (x1 - x0 + 1) / ms, h: (y1 - y0 + 1) / ms };
      return this.mask(draw, bbox, opts);
    }

    begin() {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.accum.fbo);
      gl.viewport(0, 0, this.rw, this.rh);
      gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.bindVertexArray(this.vao);
    }

    // Lay a wash. xf: affine [a,b,c,d,e,f] local -> design px.
    wash(mask, o = {}) {
      const gl = this.gl, P = this.prog.wash, u = P.u;
      gl.useProgram(P.p);
      const lift = o.mode === 'lift';
      if (lift) gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      else gl.blendFuncSeparate(gl.DST_COLOR, gl.ZERO, gl.ZERO, gl.ONE);
      const xf = o.xf || [1, 0, 0, 1, 0, 0];
      gl.uniformMatrix3fv(u.uXf, false, [xf[0], xf[1], 0, xf[2], xf[3], 0, xf[4], xf[5], 1]);
      gl.uniform4fv(u.uRect, mask.rect);
      gl.uniform2f(u.uDesign, this.W, this.H);
      gl.uniform2f(u.uRes, this.rw, this.rh);
      gl.uniform1f(u.uPxScale, Math.sqrt(Math.abs(xf[0] * xf[3] - xf[1] * xf[2])) * this.scale);
      const A = hex(o.pig || '#888888'), B = hex(o.pigB || o.pig || '#888888');
      gl.uniform3fv(u.uPigA, A); gl.uniform3fv(u.uPigB, B);
      const mix = o.mix || null; // {dir:[x,y], at, width, noise, noiseScale}
      if (mix) {
        const L = Math.hypot(mix.dir[0], mix.dir[1]) || 1;
        gl.uniform4f(u.uMix, mix.dir[0] / L, mix.dir[1] / L, mix.at || 0, mix.width || 100);
        gl.uniform2f(u.uMixNoise, mix.noise != null ? mix.noise : 0.5, mix.noiseScale || 120);
      } else { gl.uniform4f(u.uMix, 1, 0, 0, 0); gl.uniform2f(u.uMixNoise, 0, 100); }
      gl.uniform1f(u.uDensity, o.density != null ? o.density : 1);
      gl.uniform1f(u.uEdge, o.edge != null ? o.edge : 0.8);
      gl.uniform1f(u.uEdgeW, o.edgeW || 6);
      gl.uniform1f(u.uSoft, o.soft != null ? o.soft : 1.2);
      gl.uniform1f(u.uGrow, o.grow || 0);
      gl.uniform1f(u.uHollow, o.hollow || 0);
      gl.uniform1f(u.uHollowW, o.hollowW || 60);
      gl.uniform1f(u.uRim, o.rim || 0);
      gl.uniform2f(u.uWarp, o.warp != null ? o.warp : 6, o.warpScale || 140);
      gl.uniform2f(u.uRough, o.rough != null ? o.rough : 1.6, o.roughScale || 9);
      gl.uniform1f(u.uGran, o.gran != null ? o.gran : 0.3);
      gl.uniform1f(u.uFlow, o.flow != null ? o.flow : 0.35);
      gl.uniform1f(u.uFlowScale, o.flowScale || 160);
      gl.uniform1f(u.uDry, o.dry || 0);
      gl.uniform1f(u.uSeed, o.seed != null ? o.seed : 1);
      gl.uniform1f(u.uAlpha, o.alpha != null ? o.alpha : 1);
      gl.uniform1f(u.uMode, lift ? 1 : 0);
      gl.uniform1f(u.uLift, o.lift != null ? o.lift : 0.8);
      const rv = o.reveal; // {dir:[x,y], at, soft, noise, noiseScale}
      if (rv) {
        const L = Math.hypot(rv.dir[0], rv.dir[1]) || 1;
        gl.uniform4f(u.uReveal, rv.dir[0] / L, rv.dir[1] / L, rv.at, rv.soft || 30);
        gl.uniform2f(u.uRevealNoise, rv.noise != null ? rv.noise : 20, rv.noiseScale || 80);
      } else { gl.uniform4f(u.uReveal, 0, 0, 0, 1); gl.uniform2f(u.uRevealNoise, 0, 80); }
      const rd = o.radial; // {x,y,r,soft}
      if (rd) gl.uniform4f(u.uRadial, rd.x, rd.y, rd.r, rd.soft || 30);
      else gl.uniform4f(u.uRadial, 0, 0, -1, 1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mask.tex); gl.uniform1i(u.uMask, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.paper.tex); gl.uniform1i(u.uPaper, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Composite a Canvas2D layer (drawn at framebuffer resolution) as ink or pencil.
    ink(layerCanvas, o = {}) {
      const gl = this.gl, P = this.prog.ink, u = P.u;
      gl.useProgram(P.p);
      gl.blendFuncSeparate(gl.DST_COLOR, gl.ZERO, gl.ZERO, gl.ONE);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.layerTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, layerCanvas);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(u.uLayer, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.paper.tex); gl.uniform1i(u.uPaper, 1);
      gl.uniform2f(u.uRes, this.rw, this.rh);
      gl.uniform3fv(u.uColor, hex(o.color || '#2a1c14'));
      gl.uniform1f(u.uStrength, o.strength != null ? o.strength : 1);
      gl.uniform1f(u.uBleed, o.bleed != null ? o.bleed : 1.2);
      gl.uniform1f(u.uMode, o.mode === 'pencil' ? 1 : 0);
      gl.uniform1f(u.uSeed, o.seed || 1);
      gl.uniform1f(u.uAlpha, o.alpha != null ? o.alpha : 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // A Canvas2D layer sized to the framebuffer, pre-scaled to design px.
    layer() {
      if (!this._layerCanvas) {
        this._layerCanvas = document.createElement('canvas');
        this._layerCanvas.width = this.rw; this._layerCanvas.height = this.rh;
      }
      const g = this._layerCanvas.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.rw, this.rh);
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      return g;
    }

    end(o = {}) {
      const gl = this.gl, P = this.prog.comp, u = P.u;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.rw, this.rh);
      gl.disable(gl.BLEND);
      gl.useProgram(P.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.accum.tex); gl.uniform1i(u.uAccum, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.paper.tex); gl.uniform1i(u.uPaper, 1);
      gl.uniform2f(u.uRes, this.rw, this.rh);
      gl.uniform1f(u.uScale, this.scale);
      gl.uniform3fv(u.uPaperCol, this.paperColour);
      gl.uniform1f(u.uBump, o.bump != null ? o.bump : 1.1);
      gl.uniform1f(u.uVignette, o.vignette != null ? o.vignette : 0.10);
      gl.uniform1f(u.uGrain, o.grain != null ? o.grain : 0.012);
      gl.uniform1f(u.uSeed, o.seed || 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  WC.Engine = Engine;
})(window.WC = window.WC || {});
