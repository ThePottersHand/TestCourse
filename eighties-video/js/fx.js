/* FX: analytic GPU particles, a small flat-shaded box/mesh renderer ("Money for Nothing" CGI), textured cards. */
(function () {
  'use strict';
  const V = window.V, G = V.G, Mat = V.Mat;

  // ================================================================ PARTICLES
  const Pt = (V.Pt = {});
  const PVS = `#version 300 es
precision highp float;
uniform mat4 u_vp; uniform float u_time, u_t0, u_mode, u_count, u_size, u_seed, u_pxPerUnit, u_life, u_spread, u_speed, u_grav;
uniform vec3 u_origin, u_origin2; uniform vec4 u_bursts[8];
out vec4 v_col; out float v_rot; out float v_kind; out float v_flip;
float h(float n){ return fract(sin(n*127.1+u_seed*31.7)*43758.5453); }
vec3 pal(float x){ x = floor(x*5.0);
  return x<1.0? vec3(1.0,0.2,0.6) : x<2.0? vec3(0.1,0.9,0.9) : x<3.0? vec3(1.0,0.85,0.1) : x<4.0? vec3(0.55,0.3,1.0) : vec3(0.3,1.0,0.3); }
void main(){
  float i = float(gl_VertexID);
  float r1=h(i), r2=h(i+0.37), r3=h(i+0.71), r4=h(i+0.13), r5=h(i+0.91);
  vec3 pos = vec3(0.0); vec4 col = vec4(1.0); float size = u_size; v_rot = 0.0; v_kind = 0.0; v_flip = 1.0;
  float t = u_time - u_t0;
  if(u_mode < 0.5){ // STARFIELD flying toward camera
    float z = fract(r3 - t*u_speed*0.05);
    pos = vec3((r1-0.5)*12.0, (r2-0.5)*7.0, -z*40.0 + 2.5);
    float near = 1.0 - z;
    col = vec4(mix(vec3(0.6,0.7,1.0), vec3(1.0,0.8,1.0), r4), smoothstep(0.0,0.15,near)*smoothstep(1.0,0.9,near));
    size = u_size*(0.4+r5);
  } else if(u_mode < 1.5){ // CONFETTI burst
    float ang = r1*6.2832, el = (r2-0.5)*2.0;
    vec3 dir = normalize(vec3(cos(ang), sin(ang)*0.8 + 0.4, el*0.6));
    float sp = u_spread*(0.4+0.6*r3);
    float tt = max(t, 0.0);
    pos = u_origin + dir*sp*(1.0-exp(-tt*2.5))/1.0 + vec3(sin(tt*3.0+r4*6.0)*0.08, -u_grav*tt*tt*0.5, 0.0);
    col = vec4(pal(r5)*1.3, smoothstep(0.0,0.05,tt)*smoothstep(u_life, u_life*0.7, tt));
    v_rot = tt*(r4-0.5)*14.0 + r1*6.0; v_flip = cos(tt*(3.0+r2*6.0)); v_kind = 1.0;
    size = u_size*(0.6+0.8*r4);
  } else if(u_mode < 2.5){ // SPARKS continuously emitted along segment origin->origin2
    float life = u_life*(0.5+0.5*r4);
    float ph = fract((t + r1*life)/life);
    float age = ph*life;
    float birth = t - age;
    vec3 e = mix(u_origin, u_origin2, r2);
    vec3 v = vec3((r3-0.5)*0.8, 0.4+0.9*r5, (r1-0.5)*0.6)*u_spread;
    pos = e + v*age + vec3(0.0, -u_grav*age*age*0.5, 0.0);
    vec3 c = mix(vec3(1.0,0.9,0.4), vec3(1.0,0.25,0.05), ph);
    col = vec4(c*2.0, (1.0-ph)*step(0.0, birth - u_t0 + 0.0));
    size = u_size*(1.0-ph*0.7);
  } else if(u_mode < 3.5){ // FIREWORKS: bursts[k] = (x,y,z,t)
    float k = floor(r1*8.0);
    vec4 b = u_bursts[int(k)];
    float tt = u_time - b.w;
    float ang = r2*6.2832, z = r3*2.0-1.0; float rr = sqrt(1.0-z*z);
    vec3 dir = vec3(rr*cos(ang), rr*sin(ang), z);
    float sp = u_spread*(0.85+0.15*r4);
    pos = b.xyz + dir*sp*(1.0-exp(-max(tt,0.0)*3.0)) + vec3(0.0, -u_grav*tt*tt*0.3, 0.0);
    vec3 c = pal(fract(k*0.37 + u_seed));
    col = vec4(mix(vec3(1.0), c, smoothstep(0.0,0.4,tt))*2.0, step(0.0,tt)*smoothstep(u_life, 0.3, tt)*(0.6+0.4*sin(tt*30.0+r5*9.0)));
    size = u_size*(0.7+0.5*r5);
  } else if(u_mode < 4.5){ // DUST motes / embers drifting
    pos = vec3((r1-0.5)*6.0 + sin(u_time*0.3+r4*6.0)*0.2, fract(r2 + u_time*u_speed*0.02*(0.5+r3))*4.0-2.0, (r3-0.5)*2.0);
    col = vec4(mix(vec3(1.0,0.6,0.9), vec3(0.6,0.8,1.0), r5)*1.2, 0.25+0.35*sin(u_time*2.0+r1*20.0));
    size = u_size*(0.5+r4);
  } else { // SPARKLE stars twinkling in a region around origin (spread = radius)
    float ang = r1*6.2832; float rad = sqrt(r2)*u_spread;
    pos = u_origin + vec3(cos(ang)*rad*1.6, sin(ang)*rad, (r3-0.5)*0.2);
    float tw = pow(max(0.0, sin(u_time*(2.0+r4*4.0) + r5*20.0)), 6.0);
    col = vec4(mix(vec3(1.0), pal(r3), 0.4)*2.5, tw*smoothstep(0.0, 0.2, t));
    size = u_size*(0.5+r4); v_kind = 2.0; v_rot = r5;
  }
  if(i >= u_count) col.a = 0.0;
  vec4 cp = u_vp*vec4(pos,1.0);
  gl_Position = cp;
  gl_PointSize = clamp(size*u_pxPerUnit/max(cp.w,0.05), 0.0, 96.0);
  v_col = col;
}`;
  const PFS = `#version 300 es
precision highp float;
in vec4 v_col; in float v_rot; in float v_kind; in float v_flip; out vec4 o;
void main(){
  vec2 q = gl_PointCoord*2.0-1.0;
  float a;
  if(v_kind < 0.5){ a = exp(-dot(q,q)*3.0); }
  else if(v_kind < 1.5){
    float c = cos(v_rot), s = sin(v_rot); q = mat2(c,-s,s,c)*q; q.y /= max(abs(v_flip),0.15);
    a = step(abs(q.x),0.8)*step(abs(q.y),0.4);
  } else {
    float d = min(abs(q.x)*abs(q.y)*18.0 + length(q)*0.6, 1.0);
    a = pow(1.0-d, 2.0) + exp(-dot(q,q)*8.0);
  }
  o = vec4(v_col.rgb*v_col.a*a, 1.0);
}`;
  let pprog, pvao;
  Pt.init = function () {
    pprog = G.program(PVS, PFS, 'particles');
    pvao = G.gl.createVertexArray();
  };
  const MODES = { stars: 0, confetti: 1, sparks: 2, fireworks: 3, dust: 4, sparkle: 5 };
  Pt.draw = function (cam, o = {}) {
    const gl = G.gl;
    G.blend(o.blend || 'add');
    const n = o.count || 1000;
    pprog.use({
      u_vp: cam.vp, u_time: V.Rn.time, u_t0: o.t0 || 0, u_mode: MODES[o.mode] || 0, u_count: n, u_size: o.size || 0.02,
      u_seed: o.seed || 0, u_pxPerUnit: (V.Rn.H / 2) * cam.f, u_life: o.life || 2, u_spread: o.spread || 1, u_speed: o.speed || 1,
      u_grav: o.grav || 0, u_origin: o.origin || [0, 0, 0], u_origin2: o.origin2 || o.origin || [0, 0, 0],
      u_bursts: o.bursts || new Float32Array(32),
    });
    gl.bindVertexArray(pvao);
    gl.drawArrays(gl.POINTS, 0, n);
    gl.bindVertexArray(null);
  };

  // ================================================================ MESH (boxes)
  const Ms = (V.Ms = {});
  const MVS = `#version 300 es
layout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_nrm; layout(location=2) in vec2 a_uv; layout(location=3) in float a_face;
uniform mat4 u_vp, u_model;
out vec3 v_n; out vec2 v_uv; out float v_face; out vec3 v_wp;
void main(){
  vec4 wp = u_model*vec4(a_pos,1.0);
  v_wp = wp.xyz; v_n = mat3(u_model)*a_nrm; v_uv = a_uv; v_face = a_face;
  gl_Position = u_vp*wp;
}`;
  const MFS = `#version 300 es
${G.GLSL_COMMON}
in vec3 v_n; in vec2 v_uv; in float v_face; in vec3 v_wp; out vec4 o;
uniform vec3 u_faceCol[6]; uniform float u_sticker, u_edge, u_texMask[6], u_emis, u_flat, u_alpha;
uniform vec3 u_edgeCol, u_eye, u_light, u_amb; uniform sampler2D u_tex; uniform float u_hasTex;
void main(){
  int f = int(v_face+0.5);
  vec3 base = u_faceCol[f];
  vec3 n = normalize(v_n);
  if(u_flat>0.5) n = normalize(cross(dFdx(v_wp), dFdy(v_wp)));
  vec2 q = abs(v_uv-0.5);
  float border = max(q.x,q.y);
  if(u_sticker>0.0){
    // black plastic with an inset rounded sticker
    float sd = length(max(q-0.36,0.0)) - 0.06;
    float st = smoothstep(0.01, -0.01, sd);
    base = mix(vec3(0.02), base, st*step(0.001, dot(base, vec3(1.0))));
  }
  if(u_hasTex>0.5 && u_texMask[f]>0.5){ vec4 tc = texture(u_tex, vec2(v_uv.x, 1.0-v_uv.y)); base = mix(base, tc.rgb, tc.a); }
  vec3 L = normalize(u_light), Vd = normalize(u_eye - v_wp), Hh = normalize(L+Vd);
  float diff = max(dot(n,L),0.0);
  float spec = pow(max(dot(n,Hh),0.0), 48.0);
  float rim = pow(1.0-max(dot(n,Vd),0.0), 3.0);
  vec3 col = base*(u_amb + diff*0.9) + spec*0.6 + rim*u_edgeCol*0.35 + base*u_emis;
  float edge = smoothstep(0.47, 0.5, border);
  col += u_edgeCol*edge*u_edge*2.0;
  o = vec4(col*u_alpha, u_alpha);
}`;
  let mprog, cube;
  Ms.init = function () {
    const gl = G.gl;
    mprog = G.program(MVS, MFS, 'mesh');
    // unit cube centred at origin, faces: +x,-x,+y,-y,+z,-z
    const F = [
      [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
      [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
    ];
    const data = [];
    F.forEach(([n, u, v], fi) => {
      const c = (a, b) => [n[0] * 0.5 + u[0] * a + v[0] * b, n[1] * 0.5 + u[1] * a + v[1] * b, n[2] * 0.5 + u[2] * a + v[2] * b];
      const quad = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
      for (const [a, b] of quad) data.push(...c(a, b), ...n, a + 0.5, b + 0.5, fi);
    });
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const S = 9 * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, S, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, S, 32);
    gl.bindVertexArray(null);
    cube = { vao, n: 36 };
  };
  // draw a box: o.model (mat4), o.cols (array of 6 [r,g,b]) or o.col, sticker, edge, edgeCol, tex (+texMask)
  Ms.box = function (cam, o = {}) {
    const gl = G.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    G.blend(o.alpha != null && o.alpha < 1 ? 'premul' : null);
    const cols = new Float32Array(18);
    for (let i = 0; i < 6; i++) { const c = (o.cols && o.cols[i]) || o.col || [0.5, 0.5, 0.5]; cols[i * 3] = c[0]; cols[i * 3 + 1] = c[1]; cols[i * 3 + 2] = c[2]; }
    const mask = new Float32Array(6);
    if (o.texMask) o.texMask.forEach((m, i) => (mask[i] = m));
    mprog.use({
      u_vp: cam.vp, u_model: o.model || Mat.ident(), u_faceCol: cols, u_sticker: o.sticker || 0, u_edge: o.edge || 0,
      u_edgeCol: o.edgeCol || [1, 0.2, 0.7], u_eye: cam.eye, u_light: o.light || [0.5, 0.8, 0.6], u_amb: o.amb || [0.25, 0.22, 0.3],
      u_emis: o.emis || 0, u_flat: o.flat ? 1 : 0, u_alpha: o.alpha == null ? 1 : o.alpha, u_hasTex: o.tex ? 1 : 0, u_texMask: mask,
      u_tex: o.tex || V.Fx.white,
    });
    gl.bindVertexArray(cube.vao);
    gl.drawArrays(gl.TRIANGLES, 0, cube.n);
    gl.bindVertexArray(null);
    gl.disable(gl.DEPTH_TEST);
  };

  // ================================================================ CARDS (textured quads in 3D) with effects
  const Fx = (V.Fx = {});
  const CVS = `#version 300 es
layout(location=0) in vec2 a_pos;
uniform mat4 u_vp, u_model; uniform vec2 u_size;
out vec2 v_uv;
void main(){ v_uv = a_pos*0.5+0.5; gl_Position = u_vp*u_model*vec4(a_pos*u_size*0.5, 0.0, 1.0); }`;
  const CFS = `#version 300 es
${G.GLSL_COMMON}
in vec2 v_uv; out vec4 o;
uniform sampler2D u_tex; uniform float u_mode, u_develop, u_alpha, u_time, u_fadeW, u_curl; uniform vec3 u_tint; uniform vec4 u_crop;
void main(){
  vec2 uv = v_uv;
  vec3 col; float a = 1.0;
  if(u_mode < 0.5){ // plain
    col = texture(u_tex, mix(u_crop.xy, u_crop.zw, uv)).rgb*u_tint;
  } else if(u_mode < 1.5){ // POLAROID: white frame, developing photo
    vec2 inner0 = vec2(0.06, 0.2), inner1 = vec2(0.94, 0.94);
    bool inPhoto = all(greaterThan(uv, inner0)) && all(lessThan(uv, inner1));
    col = vec3(0.95,0.94,0.9) - vec3(0.04)*vnoise(uv*80.0);
    if(inPhoto){
      vec2 pu = (uv-inner0)/(inner1-inner0);
      vec3 img = texture(u_tex, mix(u_crop.xy, u_crop.zw, pu)).rgb;
      float dv = clamp(u_develop, 0.0, 1.0);
      vec3 murk = vec3(0.12,0.16,0.14) + vec3(0.03)*vnoise(pu*6.0+u_time*0.2);
      float l = luma(img);
      vec3 mid = mix(murk, vec3(l)*vec3(0.55,0.62,0.7), smoothstep(0.0,0.5,dv));
      col = mix(mid, img, smoothstep(0.35, 1.0, dv));
      col = mix(col, vec3(0.95,0.94,0.9), u_fadeW);
    }
    // soft shadow edge
    col *= 1.0 - 0.15*smoothstep(0.45, 0.5, max(abs(uv.x-0.5), abs(uv.y-0.5)));
  } else if(u_mode < 2.5){ // CRT screen
    vec2 c = uv*2.0-1.0; vec2 k = c*c*vec2(0.06,0.08); c *= 1.0 + k.yx; vec2 su = c*0.5+0.5;
    col = texture(u_tex, su).rgb * (0.8+0.2*sin(su.y*600.0));
    col *= smoothstep(1.0, 0.95, max(abs(c.x), abs(c.y)));
  } else { // flat colour card
    col = u_tint;
  }
  o = vec4(col*u_alpha, u_alpha*a);
}`;
  let cprog, cvao;
  Fx.init = function () {
    const gl = G.gl;
    cprog = G.program(CVS, CFS, 'card');
    cvao = gl.createVertexArray();
    gl.bindVertexArray(cvao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    Fx.white = G.texture(1, 1, { data: new Uint8Array([255, 255, 255, 255]), float: false });
  };
  const CM = { plain: 0, polaroid: 1, crt: 2, flat: 3 };
  Fx.card = function (cam, o = {}) {
    const gl = G.gl;
    G.blend('premul');
    if (o.depth) { gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); }
    cprog.use({
      u_vp: cam.vp, u_model: o.model || Mat.ident(), u_size: o.size || [1, 1], u_tex: o.tex || Fx.white, u_mode: CM[o.mode || 'plain'],
      u_develop: o.develop == null ? 1 : o.develop, u_alpha: o.alpha == null ? 1 : o.alpha, u_time: V.Rn.time, u_fadeW: o.fadeW || 0,
      u_tint: o.tint || [1, 1, 1], u_crop: o.crop || [0, 0, 1, 1], u_curl: 0,
    });
    gl.bindVertexArray(cvao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    gl.disable(gl.DEPTH_TEST);
  };
})();
