/* Renderer: render targets, layer queue, composite, feedback, bloom and the final "look" pass. */
(function () {
  'use strict';
  const V = window.V, G = V.G, M = V.M;

  const Rn = (V.Rn = {});
  let gl;

  const COMPOSITE_FS = `#version 300 es
${G.GLSL_COMMON}
in vec2 v_uv; out vec4 o;
uniform sampler2D u_scene, u_ink, u_neon;
uniform vec3 u_inkCol; uniform float u_inkAmt, u_neonGain;
void main(){
  vec3 c = texture(u_scene, v_uv).rgb;
  vec4 ink = texture(u_ink, v_uv);
  c = mix(c, u_inkCol, clamp(ink.r*u_inkAmt,0.0,1.0));
  c += texture(u_neon, v_uv).rgb * u_neonGain;
  o = vec4(c, 1.0);
}`;

  const COPY_FS = `#version 300 es
precision highp float; in vec2 v_uv; out vec4 o; uniform sampler2D u_tex; uniform float u_gain;
void main(){ o = texture(u_tex, v_uv) * u_gain; }`;

  const FEEDBACK_FS = `#version 300 es
${G.GLSL_COMMON}
in vec2 v_uv; out vec4 o;
uniform sampler2D u_cur, u_prev;
uniform float u_amt, u_zoom, u_rot, u_decay, u_hue, u_aspect, u_mode;
uniform vec2 u_off;
vec3 hueShift(vec3 c, float h){ const vec3 k = vec3(0.57735); float ca = cos(h); return c*ca + cross(k,c)*sin(h) + k*dot(k,c)*(1.0-ca); }
void main(){
  vec3 cur = texture(u_cur, v_uv).rgb;
  vec2 p = v_uv - 0.5; p.x *= u_aspect;
  p = rot(u_rot) * p / u_zoom; p.x /= u_aspect;
  vec2 q = p + 0.5 + u_off;
  vec3 prev = texture(u_prev, q).rgb;
  if(q.x<0.0||q.y<0.0||q.x>1.0||q.y>1.0) prev = vec3(0.0);
  prev = hueShift(prev, u_hue) * u_decay;
  vec3 r = u_mode < 0.5 ? max(cur, prev*u_amt) : (u_mode < 1.5 ? cur + prev*u_amt : mix(cur, prev, u_amt));
  o = vec4(r, 1.0);
}`;

  const DOWN_FS = `#version 300 es
precision highp float; in vec2 v_uv; out vec4 o;
uniform sampler2D u_tex; uniform vec2 u_texel; uniform float u_thresh; uniform float u_first;
vec3 s(vec2 d){ return texture(u_tex, v_uv + d*u_texel).rgb; }
void main(){
  vec3 a=s(vec2(-2,2)), b=s(vec2(0,2)), c=s(vec2(2,2)), d=s(vec2(-2,0)), e=s(vec2(0,0)), f=s(vec2(2,0)), g=s(vec2(-2,-2)), h=s(vec2(0,-2)), i=s(vec2(2,-2));
  vec3 j=s(vec2(-1,1)), k=s(vec2(1,1)), l=s(vec2(-1,-1)), m=s(vec2(1,-1));
  vec3 r = e*0.125 + (a+c+g+i)*0.03125 + (b+d+f+h)*0.0625 + (j+k+l+m)*0.125;
  if(u_first>0.5){
    float br = max(r.r, max(r.g, r.b));
    float knee = u_thresh*0.6;
    float soft = clamp(br - u_thresh + knee, 0.0, 2.0*knee); soft = soft*soft/(4.0*knee+1e-4);
    float contrib = max(soft, br - u_thresh) / max(br, 1e-4);
    r *= contrib;
    r = min(r, vec3(40.0));
  }
  o = vec4(r, 1.0);
}`;

  const UP_FS = `#version 300 es
precision highp float; in vec2 v_uv; out vec4 o;
uniform sampler2D u_tex; uniform vec2 u_texel; uniform float u_w;
vec3 s(vec2 d){ return texture(u_tex, v_uv + d*u_texel).rgb; }
void main(){
  vec3 r = s(vec2(0))*4.0 + (s(vec2(-1,0))+s(vec2(1,0))+s(vec2(0,-1))+s(vec2(0,1)))*2.0 + s(vec2(-1,-1))+s(vec2(1,-1))+s(vec2(-1,1))+s(vec2(1,1));
  o = vec4(r/16.0*u_w, 1.0);
}`;

  const FINAL_FS = `#version 300 es
${G.GLSL_COMMON}
in vec2 v_uv; out vec4 o;
uniform sampler2D u_hdr, u_bloom;
uniform vec2 u_res; uniform float u_time, u_aspect;
uniform float u_exposure, u_contrast, u_sat, u_bw, u_bloomAmt, u_vig, u_grain, u_ca;
uniform float u_vhs, u_vhsRoll, u_rewind, u_crt, u_scan, u_fade, u_letterbox, u_zoom, u_glitch, u_posterize, u_open;
uniform vec3 u_tint, u_bwTint, u_lift; uniform vec4 u_flash; uniform vec2 u_shake;
vec3 aces(vec3 x){ const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }
vec3 samp(vec2 uv){ return texture(u_hdr, uv).rgb + texture(u_bloom, uv).rgb*u_bloomAmt; }
void main(){
  vec2 uv = v_uv;
  // zoom punch + shake
  uv = (uv-0.5)/u_zoom + 0.5 + u_shake;
  // CRT curvature
  vec2 cc = uv*2.0-1.0;
  if(u_crt>0.0){ vec2 k = cc*cc*vec2(0.045,0.065)*u_crt; cc *= 1.0 + k.yx; uv = cc*0.5+0.5; }
  float row = floor(uv.y*u_res.y*0.5);
  // VHS: per-line horizontal jitter, tracking band, rewind smear
  if(u_vhs>0.0 || u_rewind>0.0 || u_glitch>0.0){
    float n = hash21(vec2(row, floor(u_time*30.0)));
    uv.x += (n-0.5)*0.004*u_vhs;
    float band = fract(uv.y*0.7 - u_vhsRoll);
    float bandMask = smoothstep(0.0,0.02,band)*smoothstep(0.09,0.03,band);
    uv.x += bandMask*(hash21(vec2(row,u_time))-0.5)*0.05*u_vhs;
    // rewind (visual search): noise bars crawl down the picture and skew it
    float bars = fract(uv.y*1.6 + u_time*1.3);
    float barMask = smoothstep(0.0,0.05,bars)*smoothstep(0.16,0.07,bars);
    uv.x += u_rewind*(barMask*0.035*(hash21(vec2(row, floor(u_time*60.0)))-0.3) + (hash21(vec2(row*0.5, floor(u_time*30.0)))-0.5)*0.003);
    // digital glitch blocks
    vec2 blk = floor(uv*vec2(12.0,24.0));
    float g = step(1.0-0.35*u_glitch, hash21(blk + floor(u_time*16.0)));
    uv.x += g*(hash21(blk*1.7+floor(u_time*16.0))-0.5)*0.12*u_glitch;
  }
  // chromatic aberration (radial) + VHS chroma shift
  vec2 dir = (uv-0.5);
  float ca = u_ca + u_vhs*0.003 + u_rewind*0.01;
  vec3 col;
  col.r = samp(uv + dir*ca + vec2(u_vhs*0.0025,0.0)).r;
  col.g = samp(uv).g;
  col.b = samp(uv - dir*ca - vec2(u_vhs*0.0015,0.0)).b;
  // VHS chroma bleed: soften color horizontally by mixing a blurred sample's chroma
  if(u_vhs>0.0){
    vec3 bl = (samp(uv+vec2(0.006,0.0)) + samp(uv-vec2(0.006,0.0)) + samp(uv+vec2(0.012,0.0)))/3.0;
    float l = luma(col);
    vec3 chroma = bl - vec3(luma(bl));
    col = mix(col, vec3(l)+chroma, 0.6*u_vhs);
  }
  col *= u_exposure;
  col = aces(col);
  if(u_posterize>0.0){ col = mix(col, floor(col*5.0+0.5)/5.0, u_posterize); }
  // grading
  col = (col-0.5)*u_contrast+0.5;
  float L = luma(col);
  col = mix(vec3(L), col, u_sat);
  col = mix(col, vec3(L)*u_bwTint, u_bw);
  col = col*u_tint + u_lift;
  // vignette
  float v = 1.0 - dot(cc*vec2(0.85,1.0), cc*vec2(0.85,1.0))*0.5;
  col *= mix(1.0, clamp(v,0.0,1.0), u_vig);
  // scanlines + shadow mask
  float sl = 0.5+0.5*cos(uv.y*u_res.y*PI);
  col *= 1.0 - u_scan*(1.0-sl)*(0.6+0.4*u_crt);
  if(u_crt>0.0){
    float m = mod(gl_FragCoord.x, 3.0);
    vec3 mask = m<1.0? vec3(1.0,0.75,0.75) : m<2.0? vec3(0.75,1.0,0.75) : vec3(0.75,0.75,1.0);
    col *= mix(vec3(1.0), mask*1.15, u_crt*0.55);
    float edge = smoothstep(1.0, 0.96, max(abs(cc.x),abs(cc.y)));
    col *= edge;
  }
  // VHS noise + tracking snow
  if(u_vhs>0.0 || u_rewind>0.0){
    float sn = hash21(gl_FragCoord.xy*0.5 + fract(u_time*7.0)*100.0);
    float band = fract(uv.y*0.7 - u_vhsRoll);
    float bm = smoothstep(0.0,0.02,band)*smoothstep(0.09,0.03,band);
    float bars = fract(uv.y*1.6 + u_time*1.3);
    float barMask = smoothstep(0.0,0.05,bars)*smoothstep(0.16,0.07,bars);
    col += (sn-0.5)*0.08*u_vhs + bm*sn*0.35*u_vhs + (sn-0.5)*0.08*u_rewind + barMask*u_rewind*(sn*0.8-0.2);
    // head switching noise at the bottom
    col = mix(col, vec3(sn*0.6), smoothstep(0.03,0.0,v_uv.y)*u_vhs*0.8);
  }
  // grain
  float gr = hash21(gl_FragCoord.xy + fract(u_time*13.7)*vec2(391.0,173.0)) - 0.5;
  col += gr*u_grain;
  // flash + fade
  col = mix(col, u_flash.rgb, clamp(u_flash.a,0.0,1.0));
  col *= 1.0 - u_fade;
  // letterbox
  float lb = u_letterbox*0.12;
  if(v_uv.y < lb || v_uv.y > 1.0-lb) col = vec3(0.0);
  if(u_crt > 0.0 && (uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)) col = vec3(0.0);
  // CRT power on/off: picture squeezes to a bright line, then a dot
  if(u_open < 1.0){
    float oy = max(u_open*2.0-1.0, 0.0);            // vertical opening (second half)
    float ox = clamp(u_open*2.0, 0.0, 1.0);          // horizontal line length (first half)
    float hy = mix(0.004, 0.5, oy*oy);
    float inY = step(abs(v_uv.y-0.5), hy);
    float inX = step(abs(v_uv.x-0.5), mix(0.01, 0.5, ox*ox));
    float line = exp(-abs(v_uv.y-0.5)/max(hy*0.5,0.002));
    col = mix(vec3(0.0), col + vec3(0.9,0.95,1.0)*line*(1.0-oy)*1.5, inY*inX);
    col += vec3(0.8,0.9,1.0)*exp(-length((v_uv-0.5)*vec2(u_aspect,1.0))*60.0)*(1.0-ox)*step(0.001,u_open);
    col = clamp(col, 0.0, 1.0);
  }
  o = vec4(clamp(col,0.0,1.0), 1.0);
}`;

  Rn.defaultsPost = function () {
    return {
      exposure: 1, contrast: 1.05, sat: 1.1, bw: 0, bwTint: [1, 0.97, 0.9], tint: [1, 1, 1], lift: [0, 0, 0],
      bloom: 0.9, bloomThresh: 0.55, vig: 0.45, grain: 0.05, ca: 0.0015,
      vhs: 0, vhsRoll: 0, rewind: 0, crt: 0, scan: 0.08, fade: 0, letterbox: 0, zoom: 1, glitch: 0, posterize: 0, open: 1,
      flash: [1, 1, 1, 0], shake: [0, 0],
      fb: { amt: 0, zoom: 1.01, rot: 0, decay: 0.9, hue: 0, dx: 0, dy: 0, mode: 0 },
      inkCol: [0.13, 0.12, 0.14], inkAmt: 0.92, neonGain: 1,
    };
  };

  Rn.init = function (W, H) {
    gl = G.gl;
    Rn.W = W; Rn.H = H; Rn.aspect = W / H;
    Rn.progs = {
      composite: G.fsProgram(COMPOSITE_FS, 'composite'),
      copy: G.fsProgram(COPY_FS, 'copy'),
      feedback: G.fsProgram(FEEDBACK_FS, 'feedback'),
      down: G.fsProgram(DOWN_FS, 'bloomDown'),
      up: G.fsProgram(UP_FS, 'bloomUp'),
      final: G.fsProgram(FINAL_FS, 'final'),
    };
    Rn.resize(W, H);
  };

  Rn.resize = function (W, H) {
    const del = (t) => { if (!t) return; gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); if (t.depth) gl.deleteRenderbuffer(t.depth); };
    if (Rn.T) for (const k in Rn.T) Array.isArray(Rn.T[k]) ? Rn.T[k].forEach(del) : del(Rn.T[k]);
    Rn.W = W; Rn.H = H; Rn.aspect = W / H;
    const T = (Rn.T = {});
    T.scene = G.target(W, H, { depth: true });
    T.ink = G.target(W, H, { float: false });
    T.neon = G.target(W, H);
    T.comp = G.target(W, H);
    T.capA = G.target(W, H, {});
    T.capB = G.target(W >> 1, H >> 1, {});
    T.fbA = G.target(W, H);
    T.fbB = G.target(W, H);
    T.bloom = [];
    let w = W >> 1, h = H >> 1;
    for (let i = 0; i < 6 && w > 8 && h > 8; i++) { T.bloom.push(G.target(w, h)); w >>= 1; h >>= 1; }
    Rn.fbValid = false;
  };

  // ------------------------------------------------------------ frame state + layer queue
  Rn.beginFrame = function (t) {
    Rn.post = Rn.defaultsPost();
    Rn.time = t;
  };

  // Executes a shot's draw function into `out` (a target). The draw function receives the scene API `S`
  // and queues work into layers; layers are then flushed in a fixed order.
  Rn.pass = function (drawFn, t, out, S) {
    const L = { scene: [], ink: [], neon: [], over: [], top: [] };
    const prevL = S._L, prevOut = S._out;
    S._L = L; S._out = out;
    drawFn(S, t);
    // scene (backgrounds + meshes)
    G.bind(Rn.T.scene, [0, 0, 0, 1]);
    for (const f of L.scene) f();
    // ink + neon stroke buffers
    G.bind(Rn.T.ink, [0, 0, 0, 0]);
    for (const f of L.ink) f();
    G.bind(Rn.T.neon, [0, 0, 0, 0]);
    for (const f of L.neon) f();
    // composite into out
    G.bind(out);
    G.blend(null);
    const P = Rn.post;
    Rn.progs.composite.use({ u_scene: Rn.T.scene, u_ink: Rn.T.ink, u_neon: Rn.T.neon, u_inkCol: P.inkCol, u_inkAmt: P.inkAmt, u_neonGain: P.neonGain });
    G.drawTri();
    // overlays drawn straight into out
    for (const f of L.over) { G.bind(out); f(); }
    for (const f of L.top) { G.bind(out); f(); }
    G.blend(null);
    S._L = prevL; S._out = prevOut;
  };

  Rn.copy = function (src, dst, gain = 1) {
    G.bind(dst);
    G.blend(null);
    Rn.progs.copy.use({ u_tex: src, u_gain: gain });
    G.drawTri();
  };

  // ------------------------------------------------------------ post chain
  Rn.post_ = function (t, outFbo) {
    const T = Rn.T, P = Rn.post;
    let hdr = T.comp;
    // feedback
    const fb = P.fb;
    // Feedback parameters are authored per 1/60 s and rescaled by the real frame time, so trails look
    // the same at 60 fps live, on a slower machine, and in a 30 fps encode. A seek (time jump) clears them.
    const dt = Rn.lastPostT == null ? 1 / 60 : t - Rn.lastPostT;
    Rn.lastPostT = t;
    if (dt < -0.05 || dt > 0.25) Rn.fbValid = false;       // a seek, not clock jitter
    const f = M.clamp(Math.abs(dt) * 60, 0.25, 4);
    if (fb.amt > 0) {
      const prev = Rn.fbValid ? T.fbA : T.comp;
      G.bind(T.fbB);
      G.blend(null);
      Rn.progs.feedback.use({
        u_cur: T.comp, u_prev: prev, u_amt: Math.pow(fb.amt, f), u_zoom: Math.pow(fb.zoom, f), u_rot: fb.rot * f,
        u_decay: Math.pow(fb.decay, f), u_hue: fb.hue * f, u_aspect: Rn.aspect, u_off: [fb.dx * f, fb.dy * f], u_mode: fb.mode,
      });
      G.drawTri();
      const tmp = T.fbA; T.fbA = T.fbB; T.fbB = tmp;
      Rn.fbValid = true;
      hdr = T.fbA;
    } else Rn.fbValid = false;

    // bloom
    const B = T.bloom;
    G.blend(null);
    let src = hdr;
    for (let i = 0; i < B.length; i++) {
      G.bind(B[i]);
      Rn.progs.down.use({ u_tex: src, u_texel: [1 / src.w, 1 / src.h], u_thresh: P.bloomThresh, u_first: i === 0 ? 1 : 0 });
      G.drawTri();
      src = B[i];
    }
    G.blend('add');
    for (let i = B.length - 1; i > 0; i--) {
      G.bind(B[i - 1]);
      Rn.progs.up.use({ u_tex: B[i], u_texel: [1 / B[i].w, 1 / B[i].h], u_w: 1.0 });
      G.drawTri();
    }
    G.blend(null);

    // final
    if (outFbo) G.bind(outFbo); else G.bind(null);
    Rn.progs.final.use({
      u_hdr: hdr, u_bloom: B[0], u_res: [Rn.W, Rn.H], u_time: t, u_aspect: Rn.aspect,
      u_exposure: P.exposure, u_contrast: P.contrast, u_sat: P.sat, u_bw: P.bw, u_bloomAmt: P.bloom * 0.35,
      u_vig: P.vig, u_grain: P.grain, u_ca: P.ca, u_vhs: P.vhs, u_vhsRoll: P.vhsRoll, u_rewind: P.rewind,
      u_crt: P.crt, u_scan: P.scan, u_fade: P.fade, u_letterbox: P.letterbox, u_glitch: P.glitch,
      u_zoom: Math.max(P.zoom, 0.5 / (0.5 - Math.min(0.2, Math.max(Math.abs(P.shake[0]), Math.abs(P.shake[1]))))),
      u_posterize: P.posterize, u_open: P.open, u_tint: P.tint, u_bwTint: P.bwTint, u_lift: P.lift, u_flash: P.flash, u_shake: P.shake,
    });
    G.drawTri();
  };
})();
