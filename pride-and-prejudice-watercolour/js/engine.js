// Watercolour renderer (WebGL2).
//
// The picture is built like a real watercolour: a sheet of paper, then transparent washes
// laid on top of one another. Every wash is a mask (any Canvas2D drawing, converted to a
// signed distance field) plus pigment settings. The shader turns the mask into paint:
// wobbly/rough edges, pigment pooling at the edge (edge darkening), granulation into the
// paper's valleys, uneven flow, wet-in-wet colour mixing, soft or hard edges, and growth.
// Washes multiply together (subtractive mixing, Beer-Lambert), so overlaps glaze and darken.
//
// Painting on the page: a wash can flood through its shape from seed points (a geodesic
// field baked into the mask), stay wet and keep flowing until it dries, sway (hems, ribbons,
// ringlets), run and drip, or morph into another shape (or its own mirror image, which reads
// as a figure turning). Light is painted into its own buffer and screened over the paper.
// Two scene buffers blend with a wet-edged transition while the outgoing painting runs.
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

  // Wash: quad over the mask's rect (grown by uPad for deformations), transformed to the screen.
  const VS_WASH = `#version 300 es
  in vec2 aPos;
  uniform mat3 uXf; uniform vec4 uRect; uniform vec2 uDesign; uniform float uPad;
  out vec2 vLocal;
  void main(){
    vec2 local = uRect.xy - uPad + aPos * (uRect.zw + 2. * uPad);
    vec2 scr = (uXf * vec3(local, 1.)).xy;
    vLocal = local;
    gl_Position = vec4(scr.x / uDesign.x * 2. - 1., 1. - scr.y / uDesign.y * 2., 0., 1.);
  }`;

  const FS_WASH = `#version 300 es
  precision highp float;
  in vec2 vLocal;
  uniform sampler2D uMask; uniform sampler2D uMask2; uniform sampler2D uPaper;
  uniform vec4 uRect, uRect2; uniform vec2 uRes; uniform float uPxScale;
  uniform vec3 uPigA, uPigB;
  uniform vec4 uMix;        // dir.xy (unit), offset, width  (linear mix A->B)
  uniform vec3 uMixNoise;   // amount, scale, marbling speed (0 = still)
  uniform float uVein;      // darkening where the two pigments meet
  uniform float uDensity, uEdge, uEdgeW, uSoft, uGrow, uHollow, uHollowW, uRim;
  uniform vec2 uWarp, uRough;
  uniform float uGran, uFlow, uFlowScale, uDry, uSeed, uAlpha, uMode, uLift, uBoil, uBoilAmp, uTime;
  uniform vec4 uReveal; uniform vec2 uRevealNoise;
  uniform vec4 uRadial;
  uniform vec4 uMorph;      // amount, mirror?, mirror axis x, second texture?
  uniform vec4 uFlood;      // front position px, softness px, noise px, enabled
  uniform vec3 uFloodEdge;  // front darkening, width px, max distance px
  uniform vec3 uWet;        // wetness, flow amplitude px, flow scale px
  uniform vec4 uSway;       // amp px, y0, y1, exponent
  uniform vec4 uSway2;      // omega, wavelength px, phase, vertical amp px
  uniform vec2 uDrip;       // length px, column scale px
  uniform vec3 uLightCol; uniform vec3 uStreak;   // light colour; streak angle, amount, length
  out vec4 o;
  ${NOISE}
  float sdfTex(sampler2D m, vec4 rect, vec2 lp){
    vec2 uv = (lp - rect.xy) / rect.zw;
    vec2 s = texture(m, uv).rg;
    float fine = (s.r - .5) * 48., coarse = (s.g - .5) * 384.;
    float t = smoothstep(17., 22., abs(fine));
    vec2 inside = step(vec2(0.), uv) * step(uv, vec2(1.));
    return mix(-200., mix(fine, coarse, t), inside.x * inside.y);
  }
  float shape(vec2 sp){
    float d = sdfTex(uMask, uRect, sp);
    if (uMorph.x > 0.) {
      vec2 sp2 = sp; if (uMorph.y > .5) sp2.x = 2. * uMorph.z - sp2.x;
      float d2 = uMorph.w > .5 ? sdfTex(uMask2, uRect2, sp2) : sdfTex(uMask, uRect, sp2);
      d = mix(d, d2, uMorph.x);
    }
    return d;
  }
  void main(){
    float seed = uSeed * 13.17;
    vec2 lp = vLocal;
    // sway: fabric and hair move in the air (inverse warp, growing from y0 to y1)
    if (uSway.x != 0. || uSway2.w != 0.) {
      float f = pow(clamp((lp.y - uSway.y) / max(1., uSway.z - uSway.y), 0., 1.), uSway.w);
      float ph = uTime * uSway2.x - lp.y / uSway2.y + uSway2.z;
      lp.x -= uSway.x * f * sin(ph);
      lp.y -= uSway2.w * f * sin(ph * 1.3 + 1.1);
    }
    vec2 w = vec2(fbm3(lp / uWarp.y + seed), fbm3(lp / uWarp.y + seed + 41.3)) * uWarp.x;
    w += vec2(gnoise(lp / 36. + uBoil * 7.13 + seed), gnoise(lp / 36. + uBoil * 3.71 + seed + 19.)) * uBoilAmp;
    // wet paint keeps moving until it dries
    if (uWet.x > 0.) {
      vec2 q = lp / uWet.z + vec2(uTime * .23, -uTime * .17);
      w += vec2(fbm3(q + seed + 2.), fbm3(q + seed + 9.1)) * uWet.y * uWet.x;
    }
    vec2 sp = lp + w;
    float d = shape(sp);
    if (uDrip.x > 0.) {
      float col = max(0., gnoise(vec2(sp.x / uDrip.y, 3.7 + seed)) * .8 + .35);
      for (int i = 1; i <= 3; i++) d = max(d, shape(sp - vec2(0., uDrip.x * col * float(i) / 3.)) - float(i) * 1.5);
    }
    d += uGrow;
    float soft = max(uSoft, .7 / uPxScale);
    if (d < -(soft + uRough.x * 1.9 + 1.)) discard;
    vec4 paper = texture(uPaper, gl_FragCoord.xy / uRes);
    d += fbm3(lp / uRough.y + seed * 1.7) * uRough.x;
    d += (paper.r - .5) * uRough.x * .6;
    float vis = 1.;
    if (dot(uReveal.xy, uReveal.xy) > 0.) {
      float s = dot(lp, uReveal.xy) - uReveal.z + fbm3(lp / uRevealNoise.y + seed + 9.) * uRevealNoise.x;
      vis *= 1. - smoothstep(-uReveal.w, uReveal.w, s);
    }
    if (uRadial.z >= 0.) {
      float r = length(lp - uRadial.xy) - uRadial.z + fbm3(lp / 90. + seed + 3.) * uRadial.w * 1.5;
      vis *= 1. - smoothstep(-uRadial.w, uRadial.w, r);
    }
    float front = 1e5;
    if (uFlood.w > .5) {
      vec2 fuv = (sp - uRect.xy) / uRect.zw;
      float fd = texture(uMask, fuv).b * uFloodEdge.z;
      front = uFlood.x - fd + fbm3(sp / 55. + seed + 3.) * uFlood.z;
      vis *= smoothstep(-uFlood.y, uFlood.y, front);
    }
    float cover = smoothstep(-soft, soft, d) * vis;
    if (cover < .002) discard;
    float din = max(d, 0.);
    float edgeBand = exp(-din / uEdgeW);
    float dens = uDensity * (1. - uHollow * smoothstep(0., uHollowW, din));
    dens = mix(dens, 0., uRim);
    dens += uDensity * uEdge * edgeBand;
    if (uFlood.w > .5) dens += uDensity * uFloodEdge.x * exp(-max(front, 0.) / uFloodEdge.y);
    dens *= max(0., 1. + uFlow * fbm3(lp / uFlowScale + seed + 5.));
    float gr = (.52 - paper.r) * 1.3 + fbm3(lp / 7. + seed) * .45;
    dens *= max(0., 1. + uGran * gr);
    if (uDry > 0.) {
      float dry = smoothstep(.45, .8, paper.r * .6 + (fbm3(lp / 26. + seed) * .5 + .5) * .6);
      cover *= 1. - uDry * dry * (.06 + .94 * edgeBand * edgeBand);
    }
    float mx = 0.;
    if (uMix.w > 0.) {
      vec2 q = lp / uMixNoise.y;
      float n;
      if (uMixNoise.z > 0.) {           // marbling: domain-warped noise that drifts over time
        float tt = uTime * uMixNoise.z;
        vec2 wq = vec2(fbm3(q + vec2(tt, tt * .7) + seed), fbm3(q + vec2(-tt * .8, tt * .5) + seed + 5.2));
        n = fbm3(q + 1.6 * wq + seed + 21.);
      } else n = fbm3(q + seed + 21.);
      mx = (dot(lp, uMix.xy) - uMix.z) / uMix.w + n * uMixNoise.x;
      if (uVein > 0.) dens += uDensity * uVein * exp(-abs(mx) * 5.);
      mx = smoothstep(-1., 1., mx);
    }
    vec3 pig = exp(mix(log(max(uPigA, .004)), log(max(uPigB, .004)), mx));
    float a = cover * uAlpha;
    if (uMode > 1.5) {
      // light: soft, a little streaky, textured by the paper
      float s = 1.;
      if (uStreak.y > 0.) {
        vec2 dir = vec2(cos(uStreak.x), sin(uStreak.x));
        vec2 r = vec2(dot(lp, dir), dot(lp, vec2(-dir.y, dir.x)));
        s = mix(1., .45 + .9 * (fbm3(vec2(r.x / uStreak.z, r.y / 9.) + seed + uTime * .05) * .5 + .5), uStreak.y);
      }
      o = vec4(uLightCol * a * s * uDensity * (1. - .25 * edgeBand * uRim), 1.);
    }
    else if (uMode > .5) o = vec4(1., 1., 1., clamp(a * uLift * (1. - .35 * edgeBand), 0., 1.));
    else o = vec4(pow(pig, vec3(dens * a)), a);
  }`;

  // Ink layer drawn with Canvas2D into three channels: R = iron-gall ink, G = graphite,
  // B = coloured ink (uColB). Channels are independent, so one upload serves all three.
  const FS_INK = `#version 300 es
  precision highp float;
  uniform sampler2D uLayer; uniform sampler2D uPaper; uniform vec2 uRes;
  uniform vec3 uColR, uColG, uColB; uniform vec3 uStr; uniform float uBleed, uSeed, uAlpha;
  out vec4 o;
  ${NOISE}
  void main(){
    vec2 uv = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;
    vec4 paper = texture(uPaper, gl_FragCoord.xy / uRes);
    vec3 a = texture(uLayer, uv).rgb;
    vec3 b = textureLod(uLayer, uv, uBleed).rgb;
    float grain = .88 + .24 * vnoise(gl_FragCoord.xy / 3. + uSeed);
    float inkR = max(a.r, b.r * .3) * (1. + .6 * clamp(a.r - b.r, 0., 1.)) * grain;
    float inkB = max(a.b, b.b * .3) * (1. + .6 * clamp(a.b - b.b, 0., 1.)) * grain;
    float gph = smoothstep(.25, .72, paper.r + (vnoise(gl_FragCoord.xy / 1.4 + uSeed) - .5) * .5);
    float pen = a.g * (.35 + .9 * gph);
    vec3 T = pow(max(uColR, vec3(.004)), vec3(inkR * uStr.x * uAlpha))
           * pow(max(uColG, vec3(.004)), vec3(pen * uStr.y * uAlpha))
           * pow(max(uColB, vec3(.004)), vec3(inkB * uStr.z * uAlpha));
    o = vec4(T, 1.);
  }`;

  // Figure groups: parts are unioned (MIN transmittance, MAX coverage) in their own buffer,
  // then the scene is lifted under the figure (reserved paper) and the figure multiplied on.
  const FS_GROUP = `#version 300 es
  precision highp float;
  uniform sampler2D uGroup; uniform vec2 uRes; uniform float uLift, uPass;
  out vec4 o;
  void main(){
    vec4 g = texture(uGroup, gl_FragCoord.xy / uRes);
    if (uPass < .5) o = vec4(1., 1., 1., clamp(uLift * g.a, 0., 1.));
    else o = vec4(g.rgb, 1.);
  }`;

  const FS_COMPOSITE = `#version 300 es
  precision highp float;
  uniform sampler2D uAccA, uAccB, uLitA, uLitB, uPaper, uOverlay;
  uniform vec2 uRes; uniform float uScale;
  uniform vec3 uPaperCol; uniform float uBump, uVignette, uGrain, uSeed, uFade, uGlow;
  uniform float uTrans, uTType; uniform vec4 uTP; uniform vec3 uTNoise; uniform vec3 uTide; uniform vec2 uTideP; uniform float uRun, uProg;
  uniform float uOverlayOn; uniform vec3 uOvR, uOvG, uOvB; uniform float uOvStr;
  out vec4 o;
  ${NOISE}
  vec3 light(sampler2D t, vec2 uv){
    return texture(t, uv).rgb + uGlow * (.55 * textureLod(t, uv, 3.5).rgb + .45 * textureLod(t, uv, 5.5).rgb);
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
    vec3 T, L;
    if (uTrans > .5) {
      // the outgoing painting runs down the sheet as the new one is laid in
      float col = max(0., gnoise(vec2(p.x / 38., 1.7)) * .7 + .45) + .25 * vnoise(vec2(p.x / 7., 3.));
      float run = uRun * uProg * uProg * col;
      vec2 ua = uv + vec2(0., run * uScale / uRes.y);
      vec3 TA = mix(texture(uAccA, ua).rgb, vec3(1.), .35 * uProg * step(.1, uRun));
      vec3 LA = light(uLitA, ua) * (1. - uProg * .5);
      vec3 TB = texture(uAccB, uv).rgb;
      vec3 LB = light(uLitB, uv);
      vec2 np = vec2(p.x / uTNoise.y, p.y / (uTNoise.y * uTNoise.z));
      float n = fbm(np + 7.7) * uTNoise.x;
      float s;
      if (uTType < .5) s = uTP.z - dot(p, uTP.xy) + n;
      else if (uTType < 1.5) s = uTP.z - length(p - uTP.xy) + n;
      else s = (fbm(np + 3.3) * .5 + .5) * 400. - (1. - uTP.z) * 440. + n * .2;
      float m = smoothstep(-uTP.w, uTP.w, s);
      T = mix(TA, TB, m);
      L = mix(LA, LB, m);
      float tide = exp(-abs(s - uTP.w) / max(uTideP.y, .5)) * smoothstep(-uTP.w, uTP.w * .5, s);
      T *= pow(max(uTide, vec3(.01)), vec3(uTideP.x * tide));
    } else {
      T = texture(uAccA, uv).rgb;
      L = light(uLitA, uv);
    }
    if (uOverlayOn > .5) {
      vec2 ouv = vec2(uv.x, 1. - uv.y);
      vec3 a = texture(uOverlay, ouv).rgb, b = textureLod(uOverlay, ouv, 1.3).rgb;
      float grain = .86 + .28 * vnoise(gl_FragCoord.xy / (3. * uScale) + 5.);
      vec3 d = max(a, b * .28) * (1. + .7 * clamp(a - b, 0., 1.)) * grain * uOvStr;
      T *= pow(max(uOvR, vec3(.004)), vec3(d.r)) * pow(max(uOvG, vec3(.004)), vec3(d.g)) * pow(max(uOvB, vec3(.004)), vec3(d.b));
    }
    T = mix(vec3(1.), T, uFade);
    vec4 P = texture(uPaper, uv);
    vec2 px = 1. / uRes;
    float hl = texture(uPaper, uv - vec2(px.x, 0.)).r, hr = texture(uPaper, uv + vec2(px.x, 0.)).r;
    float hd = texture(uPaper, uv - vec2(0., px.y)).r, hu = texture(uPaper, uv + vec2(0., px.y)).r;
    vec3 n = normalize(vec3((hl - hr) * uBump * uScale, (hd - hu) * uBump * uScale, 1.));
    float lit = dot(n, normalize(vec3(-.55, .55, .65)));
    vec3 paper = uPaperCol * (1. + (P.b - .5) * .07) * (1. - P.a * .22);
    vec3 col = paper * T;
    col *= .90 + .14 * lit;
    // light falls on the sheet: screen it over the paint, textured by the paper's tooth
    L *= .82 + .36 * P.r;
    col = 1. - (1. - col) * (1. - clamp(L, 0., 1.));
    vec2 q = uv - .5; q.x *= uRes.x / uRes.y;
    col *= 1. - uVignette * smoothstep(.35, 1.05, length(q));
    col += (hash12(gl_FragCoord.xy + uSeed * 91.) - .5) * uGrain;
    o = vec4(clamp(col, 0., 1.), 1.);
  }`;

  function compile(gl, vsSrc, fsSrc) {
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
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

  const hexCache = new Map();
  const hex = (h) => {
    if (Array.isArray(h)) return h;
    let v = hexCache.get(h);
    if (!v) {
      const n = parseInt(h.replace('#', ''), 16);
      v = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
      hexCache.set(h, v);
    }
    return v;
  };
  WC.hex = hex;
  WC.mixPig = (a, b, t) => { const A = hex(a), B = hex(b); return A.map((x, i) => Math.exp(Math.log(Math.max(x, .004)) * (1 - t) + Math.log(Math.max(B[i], .004)) * t)); };

  class Engine {
    constructor(canvas, opts = {}) {
      this.W = opts.width || 1920; this.H = opts.height || 1080;
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: false });
      if (!gl) throw new Error('This page needs WebGL2, which your browser has turned off or does not support.');
      this.gl = gl;
      this.floatOK = !!gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('OES_texture_float_linear');
      this.maskScale = opts.maskScale || 1;
      this.boilStep = 0; this.boilAmp = opts.boilAmp != null ? opts.boilAmp : 1.1;
      this.time = 0;
      this.paperColour = hex(opts.paperColour || '#f5eee1');
      this.paperSeed = opts.paperSeed || 3;
      this.stats = { masks: 0, maskBytes: 0, maskMs: 0 };
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
        group: compile(gl, VS_FULL, FS_GROUP),
      };
      this.layerTex = gl.createTexture();
      this.overlayTex = gl.createTexture();
      // 1x1 placeholder for unused samplers
      this.blank = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.blank);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      this.resize(opts.scale || 1);
    }

    resize(scale) {
      const gl = this.gl;
      this.scale = scale;
      this.canvas.width = Math.round(this.W * scale); this.canvas.height = Math.round(this.H * scale);
      this.rw = this.canvas.width; this.rh = this.canvas.height;
      [this.accA, this.accB, this.litA, this.litB, this.paper, this.grp].forEach((t) => { if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); } });
      const f = this.floatOK, IF = f ? gl.RGBA16F : gl.RGBA8, TY = f ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
      this.accA = this._target(IF, TY); this.accB = this._target(IF, TY);
      this.litA = this._target(IF, TY, true); this.litB = this._target(IF, TY, true);
      this.paper = this._target(gl.RGBA8, gl.UNSIGNED_BYTE);
      this.grp = this._target(IF, TY);
      this._makePaper(this.paperSeed);
      this._layerCanvas = null; this._overlayCanvas = null;
      this._overlayKey = null;
    }

    _target(internal, type, mips) {
      const gl = this.gl;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, this.rw, this.rh, 0, gl.RGBA, type, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (mips) gl.generateMipmap(gl.TEXTURE_2D);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fbo };
    }

    _makePaper(seed) {
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
    // opts.flood = {seeds:[[x,y],...], step, margin}: bake a flood field (paint flowing from the seeds).
    mask(draw, bbox, opts = {}) {
      const t0 = performance.now();
      const gl = this.gl;
      const m = opts.margin != null ? opts.margin : 60;
      const ms = opts.maskScale || this.maskScale;
      const x0 = bbox.x - m, y0 = bbox.y - m, w = bbox.w + 2 * m, h = bbox.h + 2 * m;
      const cw = Math.max(4, Math.ceil(w * ms)), ch = Math.max(4, Math.ceil(h * ms));
      if (!this._mcv) this._mcv = document.createElement('canvas');
      const cv = this._mcv;
      if (cv.width < cw || cv.height < ch) { cv.width = Math.max(cv.width, cw); cv.height = Math.max(cv.height, ch); }
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch);
      g.save(); g.beginPath(); g.rect(0, 0, cw, ch); g.clip();
      g.setTransform(ms, 0, 0, ms, -x0 * ms, -y0 * ms);
      g.fillStyle = '#fff'; g.strokeStyle = '#fff';
      draw(g);
      g.restore();
      const img = g.getImageData(0, 0, cw, ch);
      const sdf = WC.sdfFromAlpha(img.data, cw, ch);
      const fl = opts.flood;
      const nc = fl ? 4 : 2;
      const px = new Uint8Array(cw * ch * nc);
      let flood = null, floodMax = 0;
      if (fl) {
        const seeds = fl.seeds.map(([sx, sy]) => [(sx - x0) * ms, (sy - y0) * ms]);
        const r = WC.floodField(sdf, cw, ch, seeds, fl.step || Math.max(1, Math.round(2 * ms)), (fl.margin || 10) * ms);
        flood = r.field; floodMax = r.max / ms;
      }
      for (let i = 0; i < cw * ch; i++) {
        const d = sdf[i] / ms;
        const f = d / 48 + 0.5, c = d / 384 + 0.5;
        px[i * nc] = f <= 0 ? 0 : f >= 1 ? 255 : Math.round(f * 255);
        px[i * nc + 1] = c <= 0 ? 0 : c >= 1 ? 255 : Math.round(c * 255);
        if (fl) {
          const v = flood[i] / ms / Math.max(1, floodMax);
          px[i * 4 + 2] = v >= 1 ? 255 : Math.round(v * 255);
          px[i * 4 + 3] = 255;
        }
      }
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      if (fl) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cw, ch, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, cw, ch, 0, gl.RG, gl.UNSIGNED_BYTE, px);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      this.stats.masks++; this.stats.maskBytes += cw * ch * nc; this.stats.maskMs += performance.now() - t0;
      return { tex, rect: [x0, y0, w, h], floodMax };
    }

    // Like mask(), but finds the bounding box itself by drawing at low resolution first.
    maskAuto(draw, opts = {}) {
      const area = opts.area || { x: -400, y: -400, w: this.W + 800, h: this.H + 800 };
      const ss = 0.25;
      const W = Math.ceil(area.w * ss), H = Math.ceil(area.h * ss);
      if (!this._scan) this._scan = document.createElement('canvas');
      if (this._scan.width < W || this._scan.height < H) { this._scan.width = Math.max(W, this._scan.width); this._scan.height = Math.max(H, this._scan.height); }
      const g = this._scan.getContext('2d', { willReadFrequently: true });
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      g.setTransform(ss, 0, 0, ss, -area.x * ss, -area.y * ss);
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
      if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 1; }
      const bbox = { x: (x0 - 1.5) / ss + area.x, y: (y0 - 1.5) / ss + area.y, w: (x1 - x0 + 3) / ss, h: (y1 - y0 + 3) / ss };
      return this.mask(draw, bbox, opts);
    }

    setBoil(step) { this.boilStep = step; }
    setTime(t) { this.time = t; }

    begin(slot = 0) {
      const gl = this.gl;
      this._slot = slot; this._inGroup = false;
      gl.blendEquation(gl.FUNC_ADD);
      gl.bindFramebuffer(gl.FRAMEBUFFER, (slot ? this.litB : this.litA).fbo);
      gl.viewport(0, 0, this.rw, this.rh);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, (slot ? this.accB : this.accA).fbo);
      gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.bindVertexArray(this.vao);
    }

    _setWash(mask, o, mode) {
      const gl = this.gl, u = this.prog.wash.u;
      const xf = o.xf || [1, 0, 0, 1, 0, 0];
      gl.uniformMatrix3fv(u.uXf, false, [xf[0], xf[1], 0, xf[2], xf[3], 0, xf[4], xf[5], 1]);
      gl.uniform4fv(u.uRect, mask.rect);
      gl.uniform2f(u.uDesign, this.W, this.H);
      gl.uniform2f(u.uRes, this.rw, this.rh);
      gl.uniform1f(u.uPxScale, Math.sqrt(Math.abs(xf[0] * xf[3] - xf[1] * xf[2])) * this.scale);
      const A = o.pig ? hex(o.pig) : [0.5, 0.5, 0.5];
      gl.uniform3fv(u.uPigA, A); gl.uniform3fv(u.uPigB, o.pigB ? hex(o.pigB) : A);
      const mix = o.mix;
      if (mix) {
        const L = Math.hypot(mix.dir[0], mix.dir[1]) || 1;
        gl.uniform4f(u.uMix, mix.dir[0] / L, mix.dir[1] / L, mix.at || 0, mix.width || 100);
        gl.uniform3f(u.uMixNoise, mix.noise != null ? mix.noise : 0.5, mix.noiseScale || 120, mix.flow || 0);
        gl.uniform1f(u.uVein, mix.vein || 0);
      } else { gl.uniform4f(u.uMix, 1, 0, 0, 0); gl.uniform3f(u.uMixNoise, 0, 100, 0); gl.uniform1f(u.uVein, 0); }
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
      gl.uniform1f(u.uMode, mode);
      gl.uniform1f(u.uLift, o.lift != null ? o.lift : 0.8);
      gl.uniform1f(u.uBoil, this.boilStep % 97);
      gl.uniform1f(u.uBoilAmp, o.boil != null ? o.boil : this.boilAmp);
      gl.uniform1f(u.uTime, o.time != null ? o.time : this.time);
      const rv = o.reveal;
      if (rv) {
        const L = Math.hypot(rv.dir[0], rv.dir[1]) || 1;
        gl.uniform4f(u.uReveal, rv.dir[0] / L, rv.dir[1] / L, rv.at, rv.soft || 30);
        gl.uniform2f(u.uRevealNoise, rv.noise != null ? rv.noise : 20, rv.noiseScale || 80);
      } else { gl.uniform4f(u.uReveal, 0, 0, 0, 1); gl.uniform2f(u.uRevealNoise, 0, 80); }
      const rd = o.radial;
      if (rd) gl.uniform4f(u.uRadial, rd.x, rd.y, rd.r, rd.soft || 30); else gl.uniform4f(u.uRadial, 0, 0, -1, 1);
      let pad = o.pad || 0;
      const mo = o.morph;
      gl.activeTexture(gl.TEXTURE2);
      if (mo && mo.amount > 0) {
        const second = !!mo.mask;
        gl.uniform4f(u.uMorph, mo.amount, mo.mirror ? 1 : 0, mo.axis || 0, second ? 1 : 0);
        gl.bindTexture(gl.TEXTURE_2D, second ? mo.mask.tex : this.blank);
        gl.uniform4fv(u.uRect2, second ? mo.mask.rect : mask.rect);
        if (mo.mirror) pad = Math.max(pad, Math.abs(2 * mo.axis - (2 * mask.rect[0] + mask.rect[2])));
        if (second) pad = Math.max(pad, 200);
      } else { gl.uniform4f(u.uMorph, 0, 0, 0, 0); gl.bindTexture(gl.TEXTURE_2D, this.blank); gl.uniform4f(u.uRect2, 0, 0, 1, 1); }
      gl.uniform1i(u.uMask2, 2);
      const fl = o.flood;
      if (fl && mask.floodMax > 0) {
        const at = fl.px != null ? fl.px : fl.at * (mask.floodMax + (fl.soft || 30) + (fl.noise != null ? fl.noise : 40) + 10);
        gl.uniform4f(u.uFlood, at, fl.soft || 30, fl.noise != null ? fl.noise : 40, 1);
        gl.uniform3f(u.uFloodEdge, fl.edge != null ? fl.edge : 0.9, fl.edgeW || 14, mask.floodMax);
      } else { gl.uniform4f(u.uFlood, 0, 1, 0, 0); gl.uniform3f(u.uFloodEdge, 0, 1, 1); }
      const wet = o.wet || 0;
      gl.uniform3f(u.uWet, wet, o.wetAmp != null ? o.wetAmp : 8, o.wetScale || 110);
      const sw = o.sway;
      if (sw) {
        gl.uniform4f(u.uSway, sw.amp || 0, sw.y0 || 0, sw.y1 || 1, sw.k || 1.5);
        gl.uniform4f(u.uSway2, sw.omega || 2, sw.wave || 300, sw.phase || 0, sw.ampY || 0);
        pad = Math.max(pad, Math.abs(sw.amp || 0) + Math.abs(sw.ampY || 0) + 4);
      } else { gl.uniform4f(u.uSway, 0, 0, 1, 1); gl.uniform4f(u.uSway2, 1, 300, 0, 0); }
      const dp = o.drip;
      if (dp && dp.amp > 0) { gl.uniform2f(u.uDrip, dp.amp, dp.scale || 24); pad = Math.max(pad, dp.amp + 8); }
      else gl.uniform2f(u.uDrip, 0, 24);
      pad += (o.wet ? (o.wetAmp != null ? o.wetAmp : 8) : 0);
      gl.uniform1f(u.uPad, pad);
      gl.uniform3fv(u.uLightCol, hex(o.colour || '#ffd9a0'));
      const st = o.streak;
      gl.uniform3f(u.uStreak, st ? st.angle : 0, st ? st.amt : 0, st ? st.len || 220 : 220);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mask.tex); gl.uniform1i(u.uMask, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.paper.tex); gl.uniform1i(u.uPaper, 1);
    }

    // Lay a wash. xf: affine [a,b,c,d,e,f] local -> design px.
    wash(mask, o = {}) {
      if (!mask) return;
      if ((o.alpha != null ? o.alpha : 1) <= 0.001) return;
      if (o.flood && mask.floodMax > 0 && o.flood.at != null && o.flood.at <= 0) return;
      const gl = this.gl;
      gl.useProgram(this.prog.wash.p);
      const lift = o.mode === 'lift';
      if (lift) { gl.blendEquation(gl.FUNC_ADD); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE); }
      else if (this._inGroup) gl.blendEquationSeparate(gl.MIN, gl.MAX);
      else { gl.blendEquation(gl.FUNC_ADD); gl.blendFuncSeparate(gl.DST_COLOR, gl.ZERO, gl.ZERO, gl.ONE); }
      this._setWash(mask, o, lift ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Paint light: added into this scene's light buffer, screened over the page at the end.
    // o.colour, o.density (intensity), plus any wash shaping (soft, radial, flood, streak...).
    light(mask, o = {}) {
      if (!mask) return;
      if ((o.alpha != null ? o.alpha : 1) <= 0.001 || (o.density != null && o.density <= 0)) return;
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, (this._slot ? this.litB : this.litA).fbo);
      gl.useProgram(this.prog.wash.p);
      gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE);
      this._setWash(mask, Object.assign({ edge: 0, gran: 0, flow: 0.25, rough: 0, warp: 4 }, o), 2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._inGroup ? this.grp.fbo : (this._slot ? this.accB : this.accA).fbo);
    }

    _scissor(box) {
      const gl = this.gl;
      if (!box) { gl.disable(gl.SCISSOR_TEST); return true; }
      const x0 = Math.max(0, Math.floor(box[0] * this.scale)), x1 = Math.min(this.rw, Math.ceil(box[2] * this.scale));
      const y0 = Math.max(0, Math.floor(box[1] * this.scale)), y1 = Math.min(this.rh, Math.ceil(box[3] * this.scale));
      if (x1 <= x0 || y1 <= y0) return false;
      gl.enable(gl.SCISSOR_TEST); gl.scissor(x0, this.rh - y1, x1 - x0, y1 - y0);
      return true;
    }

    // Paint a figure as one silhouette: washes between beginGroup/endGroup union together and
    // the painting underneath is reserved back to paper before the figure goes on.
    beginGroup(box) {
      const gl = this.gl;
      this._groupBox = box;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.grp.fbo);
      this._groupVisible = this._scissor(box);
      gl.clearColor(1, 1, 1, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
      this._inGroup = true;
    }
    endGroup(lift = 0.9) {
      const gl = this.gl, P = this.prog.group, u = P.u;
      this._inGroup = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, (this._slot ? this.accB : this.accA).fbo);
      if (!this._groupVisible) return;
      this._scissor(this._groupBox);
      gl.useProgram(P.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.grp.tex); gl.uniform1i(u.uGroup, 0);
      gl.uniform2f(u.uRes, this.rw, this.rh);
      gl.uniform1f(u.uLift, lift);
      gl.blendEquation(gl.FUNC_ADD);
      if (lift > 0) { gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE); gl.uniform1f(u.uPass, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
      gl.blendFuncSeparate(gl.DST_COLOR, gl.ZERO, gl.ZERO, gl.ONE); gl.uniform1f(u.uPass, 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.SCISSOR_TEST);
    }

    // A Canvas2D layer the size of the framebuffer, pre-scaled to design px, cleared to black.
    // Draw ink in '#f00' (red channel), graphite in '#0f0', coloured ink in '#00f', using
    // globalCompositeOperation 'lighter' so channels add up independently.
    layer() {
      if (!this._layerCanvas) {
        this._layerCanvas = document.createElement('canvas');
        this._layerCanvas.width = this.rw; this._layerCanvas.height = this.rh;
      }
      const g = this._layerCanvas.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.fillStyle = '#000'; g.fillRect(0, 0, this.rw, this.rh);
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      g.globalCompositeOperation = 'lighter';
      return g;
    }

    ink(o = {}) {
      const gl = this.gl, P = this.prog.ink, u = P.u;
      gl.useProgram(P.p);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFuncSeparate(gl.DST_COLOR, gl.ZERO, gl.ZERO, gl.ONE);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.layerTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, this._layerCanvas);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(u.uLayer, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.paper.tex); gl.uniform1i(u.uPaper, 1);
      gl.uniform2f(u.uRes, this.rw, this.rh);
      gl.uniform3fv(u.uColR, hex(o.ink || '#2a1c14'));
      gl.uniform3fv(u.uColG, hex(o.pencil || '#6b6b72'));
      gl.uniform3fv(u.uColB, hex(o.colour || '#3c4a7e'));
      const st = o.strength || [1.7, 0.55, 1.3];
      gl.uniform3f(u.uStr, st[0], st[1], st[2]);
      gl.uniform1f(u.uBleed, (o.bleed != null ? o.bleed : 0.9) + Math.log2(Math.max(1, this.scale)));
      gl.uniform1f(u.uSeed, o.seed || 1);
      gl.uniform1f(u.uAlpha, o.alpha != null ? o.alpha : 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    overlay() {
      if (!this._overlayCanvas) {
        this._overlayCanvas = document.createElement('canvas');
        this._overlayCanvas.width = this.rw; this._overlayCanvas.height = this.rh;
      }
      const g = this._overlayCanvas.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.fillStyle = '#000'; g.fillRect(0, 0, this.rw, this.rh);
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      g.globalCompositeOperation = 'lighter';
      return g;
    }

    // Final pass: blend scene A (and B during a transition), ink the overlay, add paper and light.
    present(o = {}) {
      const gl = this.gl, P = this.prog.comp, u = P.u;
      // soften the light buffers into glows
      [this.litA, this.litB].forEach((l, i) => { if (i === 0 || o.transition) { gl.bindTexture(gl.TEXTURE_2D, l.tex); gl.generateMipmap(gl.TEXTURE_2D); } });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.rw, this.rh);
      gl.disable(gl.BLEND);
      gl.useProgram(P.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.accA.tex); gl.uniform1i(u.uAccA, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.accB.tex); gl.uniform1i(u.uAccB, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.paper.tex); gl.uniform1i(u.uPaper, 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.overlayTex); gl.uniform1i(u.uOverlay, 3);
      if (o.overlay && (o.overlayKey == null || o.overlayKey !== this._overlayKey)) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, this._overlayCanvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        this._overlayKey = o.overlayKey;
      }
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.litA.tex); gl.uniform1i(u.uLitA, 4);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, this.litB.tex); gl.uniform1i(u.uLitB, 5);
      gl.uniform1f(u.uOverlayOn, o.overlay ? 1 : 0);
      gl.uniform3fv(u.uOvR, hex(o.ovInk || '#2f2019'));
      gl.uniform3fv(u.uOvG, hex(o.ovRose || '#c8506c'));
      gl.uniform3fv(u.uOvB, hex(o.ovIndigo || '#34427a'));
      gl.uniform1f(u.uOvStr, o.ovStrength || 1.8);
      gl.uniform2f(u.uRes, this.rw, this.rh);
      gl.uniform1f(u.uScale, this.scale);
      gl.uniform3fv(u.uPaperCol, this.paperColour);
      gl.uniform1f(u.uBump, o.bump != null ? o.bump : 1.1);
      gl.uniform1f(u.uVignette, o.vignette != null ? o.vignette : 0.08);
      gl.uniform1f(u.uGrain, o.grain != null ? o.grain : 0.012);
      gl.uniform1f(u.uSeed, o.seed || 1);
      gl.uniform1f(u.uFade, o.fade != null ? o.fade : 1);
      gl.uniform1f(u.uGlow, o.glow != null ? o.glow : 0.9);
      const tr = o.transition;
      gl.uniform1f(u.uTrans, tr ? 1 : 0);
      if (tr) {
        const type = tr.type === 'bloom' ? 1 : tr.type === 'dissolve' ? 2 : 0;
        gl.uniform1f(u.uTType, type);
        if (type === 0) { const L = Math.hypot(tr.dir[0], tr.dir[1]) || 1; gl.uniform4f(u.uTP, tr.dir[0] / L, tr.dir[1] / L, tr.at, tr.soft || 30); }
        else if (type === 1) gl.uniform4f(u.uTP, tr.x, tr.y, tr.r, tr.soft || 30);
        else gl.uniform4f(u.uTP, 0, 0, tr.at, tr.soft || 30);
        gl.uniform3f(u.uTNoise, tr.noise != null ? tr.noise : 60, tr.noiseScale || 160, tr.aniso || 1);
        gl.uniform3fv(u.uTide, hex(tr.tideColour || '#9a8a7a'));
        gl.uniform2f(u.uTideP, tr.tide != null ? tr.tide : 0.5, tr.tideW || 5);
        gl.uniform1f(u.uRun, tr.run || 0);
        gl.uniform1f(u.uProg, tr.p || 0);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  WC.Engine = Engine;
})(window.WC = window.WC || {});
