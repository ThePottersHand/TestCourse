'use strict';
// Woman: the film grade. WebGL2 passes for halation, bloom, god rays, grain, lens and gate weave,
// plus 2D film dirt and red light leaks drawn into the scene before grading.

const POST = (() => {
  let canvas = null, gl = null, c2 = null, P = {}, src = null, srcW = 0, srcH = 0, A, B, R, vao;
  const VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
  const HEAD = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
`;
  const FS = {
    bright: HEAD + `uniform sampler2D s; uniform vec2 px; uniform float thr;
void main(){
  vec3 c = texture(s, uv + px * vec2(-1.0,-1.0)).rgb + texture(s, uv + px * vec2(1.0,-1.0)).rgb
         + texture(s, uv + px * vec2(-1.0, 1.0)).rgb + texture(s, uv + px * vec2(1.0, 1.0)).rgb;
  c *= 0.25;
  float l = max(dot(c, vec3(0.299, 0.587, 0.114)), c.r * 0.95);
  o = vec4(c * smoothstep(thr, thr + 0.3, l), 1.0);
}`,
    blur: HEAD + `uniform sampler2D s; uniform vec2 dir;
void main(){
  vec3 c = texture(s, uv).rgb * 0.227027;
  c += (texture(s, uv + dir * 1.3846153846).rgb + texture(s, uv - dir * 1.3846153846).rgb) * 0.3162162162;
  c += (texture(s, uv + dir * 3.2307692308).rgb + texture(s, uv - dir * 3.2307692308).rgb) * 0.0702702703;
  o = vec4(c, 1.0);
}`,
    rays: HEAD + `uniform sampler2D s; uniform vec2 light; uniform float rad;
void main(){
  vec2 d = (uv - light) / 64.0, tc = uv; float dec = 1.0; vec3 acc = vec3(0.0);
  for (int i = 0; i < 64; i++) {
    tc -= d; vec2 q = (tc - light) * vec2(1.0, 0.5625);
    acc += texture(s, tc).rgb * dec * exp(-dot(q, q) / (rad * rad));
    dec *= 0.968;
  }
  o = vec4(acc * (3.2 / 64.0), 1.0);
}`,
    final: HEAD + `uniform sampler2D s, b, r;
uniform float time, bloom, hal, rays, exposure, grain, vig, ca, fade, warm; uniform vec2 weave;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec2 q = uv - 0.5, qa = q * vec2(1.0, 0.5625);
  float r2 = dot(qa, qa);
  vec2 d = uv + weave + q * r2 * 0.07;
  vec2 co = q * ca;
  vec3 c = vec3(texture(s, d + co).r, texture(s, d).g, texture(s, d - co).b);
  vec3 bl = texture(b, d).rgb;
  c += bl * bloom + bl * vec3(1.0, 0.2, 0.08) * hal;
  c += texture(r, d).rgb * rays;
  c *= exposure;
  vec3 hi = 0.8 + 0.2 * (1.0 - exp(-(c - 0.8) * 5.0));
  c = mix(c, hi, step(vec3(0.8), c));
  c *= mix(vec3(1.0), vec3(1.05, 1.0, 0.9), warm);
  c = c * 0.965 + vec3(0.022, 0.019, 0.016);
  float g = h12(floor(gl_FragCoord.xy / 1.6) + fract(time * 13.7) * 1000.0) + h12(gl_FragCoord.xy + fract(time * 7.1) * 517.0) - 1.0;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c += g * grain * (0.35 + 0.65 * (1.0 - abs(l * 2.0 - 1.0)));
  c *= (1.0 - vig * smoothstep(0.15, 0.85, r2 * 2.2)) * fade;
  o = vec4(c, 1.0);
}`
  };

  function compile(fs) {
    const mk = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  }
  function tex(w, h) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    return t;
  }
  function target(w, h) { const t = tex(w, h), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; }

  function init(cv) {
    canvas = cv;
    try {
      gl = cv.getContext('webgl2', { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: true });
      if (!gl) throw new Error('no webgl2');
      for (const k in FS) P[k] = compile(FS[k]);
      vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      src = tex(4, 4);
      return canvas;
    } catch (e) {
      console.warn('Film grade unavailable, showing the ungraded picture.', e);
      gl = null;
      const fresh = mkCanvas(cv.width, cv.height); fresh.className = cv.className; fresh.id = cv.id;
      fresh.setAttribute('aria-label', cv.getAttribute('aria-label') || ''); cv.replaceWith(fresh);
      canvas = fresh; c2 = fresh.getContext('2d'); return fresh;
    }
  }
  function resize(w, h) {
    canvas.width = w; canvas.height = h;
    if (!gl) return;
    const lw = Math.max(8, w >> 2), lh = Math.max(8, h >> 2);
    [A, B, R].forEach(x => { if (x) { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); } });
    A = target(lw, lh); B = target(lw, lh); R = target(lw, lh); srcW = 0;
  }
  function pass(prog, out, bind, set) {
    gl.useProgram(prog.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.f : null);
    gl.viewport(0, 0, out ? out.w : canvas.width, out ? out.h : canvas.height);
    bind.forEach(([name, t], i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(prog.u[name], i); });
    set && set(prog.u);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(t) {
    if (!gl) {
      c2.drawImage(S, 0, 0, canvas.width, canvas.height);
      const g = c2.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.height);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${FX.vig})`); c2.fillStyle = g; c2.fillRect(0, 0, canvas.width, canvas.height);
      if (FX.fade < 1) { c2.fillStyle = `rgba(0,0,0,${1 - FX.fade})`; c2.fillRect(0, 0, canvas.width, canvas.height); }
      return;
    }
    gl.bindTexture(gl.TEXTURE_2D, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (srcW !== S.width || srcH !== S.height) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, S); srcW = S.width; srcH = S.height; [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR)); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE)); }
    else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, S);
    pass(P.bright, A, [['s', src]], u => { gl.uniform2f(u.px, 1 / S.width, 1 / S.height); gl.uniform1f(u.thr, FX.thr); });
    const L = FX.light, rays = L && FX.rays > 0;
    if (rays) pass(P.rays, R, [['s', A.t]], u => { gl.uniform2f(u.light, L[0] / W, 1 - L[1] / H); gl.uniform1f(u.rad, FX.rayR); });
    for (const r of [1, 2.2, 4]) {
      pass(P.blur, B, [['s', A.t]], u => gl.uniform2f(u.dir, r / A.w, 0));
      pass(P.blur, A, [['s', B.t]], u => gl.uniform2f(u.dir, 0, r / A.h));
    }
    const wx = REDUCE ? 0 : (vnoise(t * 6, 1.3) - 0.5) * 0.0016, wy = REDUCE ? 0 : (vnoise(t * 5, 8.1) - 0.5) * 0.0022;
    pass(P.final, null, [['s', src], ['b', A.t], ['r', rays ? R.t : B.t]], u => {
      gl.uniform1f(u.time, t); gl.uniform1f(u.bloom, FX.bloom); gl.uniform1f(u.hal, FX.hal); gl.uniform1f(u.rays, rays ? FX.rays : 0);
      gl.uniform1f(u.exposure, FX.exposure); gl.uniform1f(u.grain, FX.grain); gl.uniform1f(u.vig, FX.vig); gl.uniform1f(u.ca, FX.ca);
      gl.uniform1f(u.fade, FX.fade); gl.uniform1f(u.warm, FX.warm); gl.uniform2f(u.weave, wx, wy);
    });
  }
  return { init, resize, frame, get canvas() { return canvas; }, get graded() { return !!gl; } };
})();

// Dust, hairs and scratches on the print; deterministic per frame so scrubbing is stable.
function filmDirt(t) {
  const f = Math.floor(t * 24);
  ctx.save();
  for (let i = 0; i < 5; i++) {
    if (hash(f * 5.3 + i) < 0.55) continue;
    const x = hash(f + i * 9.1) * W, y = hash(f * 1.7 + i * 13.3) * H, s = 1 + hash(f + i) ** 3 * 6;
    ctx.fillStyle = hash(i + f * 0.3) > 0.4 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(x, y, s, s * (0.5 + hash(f * 2 + i) * 0.5), hash(f + i * 3) * 3, 0, TAU); ctx.fill();
  }
  if (hash(f * 0.77) > 0.93) {
    const x = hash(f * 3.3) * W, y = hash(f * 4.4) * H, L = 40 + hash(f) * 90, a = hash(f * 6.6) * TAU;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + Math.cos(a) * L * 0.4 + 20, y + Math.sin(a) * L * 0.4, x + Math.cos(a + 1) * L * 0.7, y + Math.sin(a + 1) * L * 0.7 - 15, x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
  }
  const sc = Math.floor(t * 3);
  if (hash(sc * 1.9) > 0.55) {
    const x = hash(sc * 7.7) * W + Math.sin(t * 9) * 3;
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + hash(f) * 0.12})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, -10); ctx.bezierCurveTo(x + 4, H * 0.3, x - 5, H * 0.7, x + 2, H + 10); ctx.stroke();
  }
  ctx.restore();
}
// A red-orange light leak that blooms in from a frame edge just after each cut.
function lightLeak(t, cuts) {
  for (const c of cuts) {
    const k = t - c; if (k < 0 || k > 0.5) continue;
    const a = Math.sin(inv(0, 0.5, k) * Math.PI) * 0.55, side = hash(c * 3.7) > 0.5 ? 1 : 0;
    const x = side ? W + 40 : -40, y = hash(c * 5.1) * H;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, 900);
    g.addColorStop(0, `rgba(255,120,60,${a})`); g.addColorStop(0.35, `rgba(220,40,30,${a * 0.45})`); g.addColorStop(1, 'rgba(160,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}
