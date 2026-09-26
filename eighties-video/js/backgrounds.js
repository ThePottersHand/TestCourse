/* Backgrounds: full-screen fragment-shader worlds. Each is drawn with Bg.draw(name, uniforms). */
(function () {
  'use strict';
  const V = window.V, G = V.G;
  const Bg = (V.Bg = {});

  const HEAD = `#version 300 es
${G.GLSL_COMMON}
in vec2 v_uv; out vec4 o;
uniform vec2 u_res; uniform float u_time, u_aspect, u_kick, u_snare, u_bass, u_beat, u_hat, u_alpha;
vec2 P(){ return (v_uv-0.5)*vec2(u_aspect,1.0)*2.0; } // y in [-1,1]
float lineGlow(float d, float w){ return exp(-max(d,0.0)/w); }
`;

  const SH = {};

  // ---------------------------------------------------------------- OUTRUN: sky, striped sun, mountains, neon grid
  SH.outrun = `
uniform float u_speed, u_hor, u_roll, u_camX, u_camH, u_sunY, u_sunR, u_mount, u_grid, u_pulse, u_stars, u_fog, u_slit, u_wire, u_road;
uniform vec3 u_skyTop, u_skyBot, u_sun1, u_sun2, u_gridCol, u_groundCol, u_mountCol, u_horGlow;
void main(){
  vec2 p = rot(u_roll)*P();
  float hor = u_hor;
  vec3 col = mix(u_skyBot, u_skyTop, smoothstep(-0.1, 1.1, p.y-hor));
  // stars
  if(u_stars>0.0){
    vec2 sp = p*vec2(1.0,1.0)*28.0; vec2 id = floor(sp); vec2 f = fract(sp)-0.5;
    vec2 h = hash22(id); float s = step(0.86, h.x);
    float tw = 0.6+0.4*sin(u_time*3.0 + h.y*40.0);
    col += vec3(0.9,0.85,1.0)*s*tw*smoothstep(0.09,0.0,length(f-(h-0.5)*0.6))*u_stars*smoothstep(0.0,0.4,p.y-hor);
  }
  // sun
  vec2 sp = p - vec2(0.0, hor+u_sunY);
  float sd = length(sp)-u_sunR;
  float yy = sp.y/u_sunR;
  float band = fract(yy*5.0 - u_time*0.35);
  float thick = clamp(0.25 - yy*0.45, 0.0, 0.8)*u_slit;
  float slit = step(yy, 0.3)*step(band, thick);
  float sunMask = smoothstep(0.006, -0.006, sd)*(1.0-slit);
  vec3 sunCol = mix(u_sun2, u_sun1, smoothstep(-1.0, 1.0, yy));
  float above = smoothstep(hor-0.002, hor+0.004, p.y);
  col += sunCol*0.45*exp(-max(sd,0.0)*2.6)*above;
  col = mix(col, sunCol*1.7, sunMask*above);
  // mountains (layered, with wire contour lines)
  if(u_mount>0.0){
    for(int k=0;k<2;k++){
      float fk = float(k);
      float mx = p.x*(1.2+fk*0.6) + u_camX*(0.05+fk*0.05) + fk*7.3;
      float h = (fbm(vec2(mx*1.3, fk*3.0))*0.9 - 0.25 + 0.25*abs(sin(mx*1.7+fk)))*(0.30-fk*0.1)*u_mount;
      h = max(h, 0.0);
      float y = p.y - hor;
      if(y < h && y > -0.001){
        vec3 mc = u_mountCol*(0.6+0.4*fk);
        float wire = 1.0 - smoothstep(0.0, 1.5, abs(fract(y*38.0 - fk*0.5)-0.5)/fwidth(y*38.0));
        float ridge = exp(-abs(y-h)*140.0);
        col = mix(col, mc, 0.96);
        col += u_gridCol*(wire*0.25*u_wire + ridge*0.9);
      }
    }
  }
  // ground grid
  if(p.y < hor){
    float d = max(hor - p.y, 1e-4);
    float z = u_camH/d;
    float x = p.x*z + u_camX;
    float zz = z + u_speed;
    vec2 g = vec2(x, zz)*u_grid;
    vec2 fw = fwidth(g);
    vec2 gd = abs(fract(g-0.5)-0.5)/max(fw, 1e-4);
    float dl = min(gd.x, gd.y);
    float fog = exp(-z*u_fog);
    float line = exp(-dl*0.55)*0.9 + (1.0-smoothstep(0.0,1.0,dl))*0.9;
    vec3 gc = u_gridCol*(1.0+u_pulse*1.5);
    col = u_groundCol*(0.5+0.5*fog);
    // road stripe
    if(u_road>0.0){
      float rd = abs(x - u_camX*0.0);
      float edge = exp(-abs(rd-1.2)*40.0);
      float dash = step(0.5, fract(zz*0.5))*exp(-rd*rd*400.0);
      col += (vec3(1.0,0.85,0.3)*dash + u_gridCol*edge*1.5)*u_road*fog;
      line *= mix(1.0, 0.25, u_road*step(rd,1.2));
    }
    col += gc*line*fog*1.4;
    // reflection of sun on ground
    col += sunCol*0.25*exp(-abs(p.x)*3.0)*exp(-d*6.0);
  }
  // horizon glow
  col += u_horGlow*exp(-abs(p.y-hor)*22.0)*0.9;
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- PAPER (pencil world)
  SH.paper = `
uniform vec3 u_paper; uniform float u_boil, u_vig2, u_halftone, u_lines; uniform vec3 u_tint2;
void main(){
  vec2 p = P();
  vec2 q = v_uv*u_res/900.0;
  float fib = fbm(q*vec2(6.0,40.0) + u_boil*0.0)*0.5 + fbm(q*vec2(40.0,6.0))*0.5;
  float grain = hash21(floor(v_uv*u_res));
  vec3 col = u_paper*(0.92 + 0.08*fib) - grain*0.035;
  // faint ruled/grid lines of a sketch pad
  if(u_lines>0.0){ float ly = abs(fract(p.y*9.0)-0.5); col = mix(col, vec3(0.55,0.7,0.9), (1.0-smoothstep(0.0,0.03,ly))*0.25*u_lines); }
  // halftone dots (comic print)
  if(u_halftone>0.0){
    vec2 hp = rot(0.6)*p*55.0; vec2 f = fract(hp)-0.5; float r = 0.35*(0.5+0.5*sin(p.x*2.0+p.y*3.0+u_time));
    col = mix(col, col*u_tint2, (1.0-smoothstep(r-0.05, r+0.05, length(f)))*u_halftone);
  }
  float v = 1.0 - dot(p*vec2(0.55,0.8), p*vec2(0.55,0.8))*u_vig2;
  col *= v;
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- NIGHT STREET / TOWN
  SH.street = `
uniform vec3 u_moon; uniform float u_neon, u_scroll, u_hor, u_sketch, u_fogAmt, u_winSeed;
uniform vec3 u_skyTop, u_skyBot;
float building(float x, out float wx, out float id){
  float cell = floor(x*3.0); id = cell; wx = fract(x*3.0);
  float h = 0.12 + hash11(cell*1.7)*0.45 + step(0.85, hash11(cell*3.1))*0.25;
  return h;
}
void main(){
  vec2 p = P();
  vec3 col = mix(u_skyBot, u_skyTop, smoothstep(-0.2, 1.0, p.y));
  // stars
  vec2 sp = p*30.0; vec2 id = floor(sp); vec2 h2 = hash22(id);
  col += vec3(0.8,0.85,1.0)*step(0.92,h2.x)*smoothstep(0.08,0.0,length(fract(sp)-0.5-(h2-0.5)*0.5))*(0.5+0.5*sin(u_time*2.0+h2.y*30.0))*smoothstep(-0.1,0.5,p.y);
  // moon
  vec2 mp = p - u_moon.xy; float md = length(mp) - u_moon.z;
  float crater = fbm(mp*9.0/u_moon.z)*0.35;
  vec3 moonCol = vec3(1.0,0.96,0.85)*(1.05 - crater);
  col += vec3(0.6,0.7,1.0)*0.35*exp(-max(md,0.0)*5.0/max(u_moon.z,0.05));
  col = mix(col, moonCol*1.4, smoothstep(0.004,-0.004,md));
  // skyline (two layers, parallax)
  for(int k=1;k>=0;k--){
    float fk = float(k);
    float sc = 1.0+fk*0.7;
    float x = p.x*sc*0.6 + u_scroll*(0.3+fk*0.35) + fk*13.0;
    float wx, bid; float bh = building(x, wx, bid)*(1.0-fk*0.35);
    float base = u_hor;
    float top = base + bh;
    float gap = step(0.06, wx)*step(wx, 0.94);
    if(p.y < top && gap>0.5){
      vec3 bc = mix(vec3(0.03,0.02,0.07), vec3(0.08,0.07,0.13), fk);
      // windows
      vec2 w = vec2(wx*7.0, (p.y-base)*28.0*sc);
      vec2 wi = floor(w); vec2 wf = fract(w);
      float lit = step(0.55, hash21(wi + bid*17.0 + u_winSeed + floor(u_time*0.25+hash11(bid)*10.0)*0.0));
      float win = step(0.25, wf.x)*step(wf.x,0.75)*step(0.3,wf.y)*step(wf.y,0.8)*step(1.0, wi.x)*step(wi.x, 5.0);
      vec3 wc = mix(vec3(0.85,0.8,0.6), hsv2rgb(vec3(hash21(wi+bid)*0.3+0.8, 0.8, 1.0))*1.8, u_neon);
      bc += wc*win*lit*(0.6+0.8*u_neon)*(1.0-fk*0.4);
      // sketch outline mode
      float edge = min(min(wx-0.06, 0.94-wx)*3.0, top-p.y);
      bc = mix(bc, mix(vec3(0.93,0.9,0.84), vec3(0.2), smoothstep(0.004,0.0,edge)), u_sketch*(1.0-fk*0.5));
      col = bc;
    }
  }
  // ground
  if(p.y < u_hor){ col = mix(vec3(0.02,0.015,0.04), vec3(0.06,0.05,0.1), smoothstep(-1.0, u_hor, p.y)); col = mix(col, vec3(0.9,0.88,0.82)*0.95, u_sketch); }
  // fog band
  col += vec3(0.35,0.2,0.55)*exp(-abs(p.y-u_hor)*9.0)*u_fogAmt;
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- BILLIE JEAN light-up tiles
  SH.tiles = `
uniform vec3 u_cam; uniform float u_pitch, u_yaw; uniform vec4 u_feet[4]; uniform float u_pattern, u_gridScroll;
void main(){
  vec2 p = P();
  vec3 ro = u_cam;
  vec3 fw = normalize(vec3(sin(u_yaw), -sin(u_pitch), -cos(u_yaw)));
  vec3 rt = normalize(cross(fw, vec3(0,1,0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw*1.8 + rt*p.x + up*p.y);
  vec3 col = vec3(0.01,0.0,0.02);
  if(rd.y < -0.001){
    float t = -ro.y/rd.y;
    vec3 hp = ro + rd*t;
    vec2 q = hp.xz + vec2(0.0, u_gridScroll);
    vec2 id = floor(q); vec2 f = fract(q);
    float edge = min(min(f.x,1.0-f.x), min(f.y,1.0-f.y));
    float tile = smoothstep(0.02, 0.05, edge);
    // lit by pattern + feet
    float lit = 0.0;
    float hh = hash21(id);
    float b = floor(u_beat);
    lit += u_pattern*0.6*step(0.78, hash21(id + b*0.37))*(1.0-fract(u_beat)*0.7);
    vec3 footCol = vec3(0.0);
    for(int i=0;i<4;i++){
      vec4 ft = u_feet[i];
      float under = step(length(floor(hp.xz)-floor(ft.xy)), 0.1);
      float near = smoothstep(1.3, 0.6, length(hp.xz - ft.xy))*0.25;
      lit += ft.z*(under*1.2 + near);
      footCol += ft.z*under*(i==0 ? vec3(0.2,1.0,1.0) : vec3(1.0,0.3,0.75));
    }
    lit = clamp(lit, 0.0, 1.4);
    vec3 tc = mix(vec3(1.0,0.93,0.8), hsv2rgb(vec3(0.9+hh*0.25, 0.55, 1.0)), 0.5);
    tc = mix(tc, footCol, clamp(length(footCol),0.0,1.0)*0.85);
    vec3 base = vec3(0.07,0.06,0.09) + vec3(0.03)*hh;
    // inner gradient to look like a lightbox
    float inner = smoothstep(0.0, 0.5, edge);
    col = mix(vec3(0.0), base + tc*lit*(0.6+0.8*inner)*1.4, tile);
    float fog = exp(-t*0.06);
    col *= fog;
    col += tc*lit*0.25*fog*(1.0-tile); // light spill in the grout
  }
  // back wall glow
  col += vec3(0.4,0.1,0.5)*exp(-abs(rd.y+0.02)*18.0)*0.5;
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- LACE (kaleidoscopic doily)
  SH.lace = `
uniform float u_grow, u_rot, u_sym, u_zoom; uniform vec3 u_col, u_bgc;
float ring(float r, float R, float w){ return 1.0-smoothstep(w*0.5, w, abs(r-R)); }
void main(){
  vec2 p = P()/u_zoom;
  p = rot(u_rot)*p;
  float r = length(p), a = atan(p.y,p.x);
  float N = u_sym;
  float sa = mod(a, TAU/N) - PI/N; // folded angle
  vec2 q = vec2(cos(sa), sin(sa))*r;
  float v = 0.0; float w = 0.006 + 0.004*r;
  // scallop rings
  for(int k=0;k<5;k++){
    float R = 0.12 + float(k)*0.18;
    if(R > u_grow) break;
    float sR = 0.045 + 0.018*float(k);
    vec2 c = vec2(R, 0.0);
    v += 1.0-smoothstep(w*0.5, w, abs(length(q - c) - sR));
    v += ring(r, R+sR*1.05, w*0.8)*0.6;
    // petals between rings
    float pr = R + sR*2.0;
    float pet = abs(length((q - vec2(pr,0.0))*vec2(1.0, 2.2)) - sR*0.9);
    v += (1.0-smoothstep(w*0.5, w, pet))*0.8;
    // tiny dots
    vec2 dq = q - vec2(R - sR*1.3, 0.0);
    v += (1.0-smoothstep(0.004, 0.009, length(dq)))*0.9;
  }
  // net mesh (fine) in the gaps
  vec2 hp = vec2(a*6.0*N/TAU, r*40.0);
  float net = 1.0 - smoothstep(0.02, 0.08, min(abs(fract(hp.x+hp.y*0.5)-0.5), abs(fract(hp.x-hp.y*0.5)-0.5)));
  v += net*0.25*step(r, u_grow)*step(0.08, r);
  // centre rosette
  float rose = abs(r - 0.07*(0.6+0.4*cos(N*a)));
  v += 1.0-smoothstep(w*0.5, w*1.2, rose);
  v *= smoothstep(u_grow, u_grow-0.08, r);
  vec3 col = u_bgc + u_col*clamp(v,0.0,1.5)*1.3;
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- PURPLE RAIN
  SH.rain = `
uniform float u_amt, u_speed; uniform vec3 u_col, u_bgTop, u_bgBot;
void main(){
  vec2 p = P();
  vec3 col = mix(u_bgBot, u_bgTop, smoothstep(-1.0, 1.0, p.y));
  for(int k=0;k<3;k++){
    float fk = float(k);
    float sc = 30.0 + fk*25.0;
    vec2 q = vec2(p.x*sc + fk*11.0, p.y*2.0 + u_time*u_speed*(1.0+fk*0.4));
    float id = floor(q.x);
    float h = hash11(id + fk*100.0);
    float y = fract(q.y*0.35 + h*7.0);
    float streak = smoothstep(0.0, 0.02, y)*smoothstep(0.25, 0.02, y);
    float xw = 1.0 - smoothstep(0.0, 0.12, abs(fract(q.x)-0.5));
    col += u_col*streak*xw*step(0.35, h)*u_amt*(0.5+0.5*fk);
  }
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- FLUORO STRIPES (leg warmers) + DENIM
  SH.stripes = `
uniform float u_scroll, u_bend, u_scrunch, u_denim, u_mixp;
vec3 fluo(float i){ i = mod(i, 5.0);
  return i<1.0? vec3(0.2,1.0,0.1) : i<2.0? vec3(1.0,0.1,0.6) : i<3.0? vec3(1.0,0.95,0.1) : i<4.0? vec3(0.05,0.9,1.0) : vec3(0.6,0.1,1.0); }
void main(){
  vec2 p = P();
  float y = p.y + sin(p.x*2.0 + u_time*1.5)*0.08*u_bend;
  y += sin(y*6.0 - u_time*4.0)*0.05*u_scrunch;
  float s = y*4.0 + u_scroll;
  float id = floor(s); float f = fract(s);
  vec3 c = fluo(id)*1.2;
  // knit ribs
  float rib = 0.8 + 0.2*sin(p.x*140.0 + sin(y*20.0)*2.0);
  c *= rib*(0.85+0.15*smoothstep(0.0,0.1,f)*smoothstep(1.0,0.9,f));
  // denim
  if(u_denim>0.0){
    vec2 q = p*vec2(1.0,1.0);
    float twill = 0.5+0.5*sin((q.x*0.8+q.y)*420.0);
    float weft = 0.5+0.5*sin((q.x-q.y*0.2)*900.0);
    float slub = vnoise(vec2(q.x*6.0, q.y*220.0));
    float wash = fbm(q*2.2 + 5.0)*0.7 + fbm(q*9.0)*0.3;
    float veins = 1.0 - smoothstep(0.0, 0.05, abs(fbm(q*4.0+2.0)-0.5));
    float bleach = smoothstep(0.52, 0.8, wash)*0.8 + veins*0.25;
    vec3 dn = mix(vec3(0.05,0.09,0.2), vec3(0.16,0.25,0.45), twill*0.6 + slub*0.25);
    dn *= 0.85 + 0.15*weft;
    dn = mix(dn, vec3(0.55,0.65,0.78)*(0.85+0.15*twill), clamp(bleach,0.0,1.0)*0.7);
    // seam stitches
    float seam = abs(p.x - 0.9 - sin(p.y*1.2)*0.05);
    float stitch = step(0.5, fract(p.y*30.0))*(1.0-smoothstep(0.004,0.008,abs(seam-0.03)));
    dn += vec3(0.9,0.6,0.2)*stitch;
    dn *= 1.0 - (1.0-smoothstep(0.0,0.01,seam))*0.4;
    float m = 1.0 - smoothstep(u_mixp-0.08, u_mixp+0.08, v_uv.x + (fbm(p*4.0)-0.5)*0.2);
    c = mix(c, dn, u_denim*m);
  }
  o = vec4(c, 1.0);
}`;

  // ---------------------------------------------------------------- TUNNEL (Tron grid tube)
  SH.tunnel = `
uniform float u_speed, u_twist, u_rad, u_hue, u_pulse, u_sides;
uniform vec2 u_center;
void main(){
  vec2 p = P() - u_center;
  float r = length(p); float a = atan(p.y, p.x);
  float z = u_rad/max(r,1e-3) + u_speed;
  float aa = a/TAU*u_sides + z*u_twist;
  vec2 g = vec2(aa, z*2.0);
  vec2 fw = fwidth(g);
  vec2 gd = abs(fract(g-0.5)-0.5)/max(fw,1e-4);
  float dl = min(gd.x, gd.y);
  float line = exp(-dl*0.5)*0.8 + (1.0-smoothstep(0.0,1.2,dl));
  float fog = smoothstep(0.0, 0.35, r);
  float ringPulse = exp(-abs(fract(z*0.25 - u_time*0.5)-0.5)*20.0)*u_pulse;
  vec3 c1 = hsv2rgb(vec3(u_hue + sin(z*0.05)*0.06, 0.8, 1.0));
  vec3 c2 = hsv2rgb(vec3(u_hue+0.35, 0.85, 1.0));
  vec3 col = mix(c1, c2, 0.5+0.5*sin(z*0.3))*line*fog*1.5;
  col += c2*ringPulse*fog*2.0;
  col += vec3(0.02,0.0,0.05);
  col += c1*exp(-r*6.0)*0.6; // far light
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- CROWD (clapping arms silhouettes, stage backlight)
  SH.crowd = `
uniform float u_clap, u_sway, u_light; uniform vec3 u_c1, u_c2;
float capsule(vec2 p, vec2 a, vec2 b, float r){ return sdSeg(p,a,b)-r; }
void main(){
  vec2 p = P();
  // dark arena, hot backlight band behind the crowd, sweeping stage beams
  vec3 col = mix(vec3(0.015,0.0,0.04), u_c2*0.45, smoothstep(1.1, -0.35, p.y));
  col += u_c1*exp(-abs(p.y + 0.34)*3.4)*0.6*u_light;
  for(int i=0;i<6;i++){
    float fi = float(i);
    float ang = sin(u_time*0.7 + fi*1.7)*0.55 + (fi-2.5)*0.22;
    vec2 d = rot(ang)*vec2(0.0,-1.0);
    vec2 src = vec2((fi-2.5)*0.75, 1.15);
    vec2 q = p - src;
    float along = dot(q, d); float across = abs(dot(q, vec2(-d.y,d.x)));
    float beam = smoothstep(0.03+along*0.16, 0.0, across)*step(0.0,along)*exp(-along*0.5);
    col += mix(u_c1, u_c2, fract(fi*0.37))*beam*0.3*u_light;
  }
  // three rows of fans, arms up; hands meet on every clap
  float sil = 1e3;
  for(int row=0; row<3; row++){
    float fr = float(row);
    float sc = 1.0 - fr*0.22;
    float baseY = -0.66 + fr*0.13;
    vec2 q = (p - vec2(fr*0.11 + 0.05, baseY))/sc;
    float cellW = 0.27;
    float id = floor(q.x/cellW + 0.5);
    float h = hash11(id*3.7 + fr*11.0);
    vec2 c = vec2(id*cellW + (h-0.5)*0.07, (hash11(id+fr*5.0)-0.5)*0.06);
    float sway = sin(u_time*2.4 + id*0.7 + fr)*0.018*u_sway;
    vec2 lp = q - c - vec2(sway, 0.0);
    float head = length(lp - vec2(0.0, 0.1)) - 0.062;
    float body = sdBox(lp - vec2(0.0,-0.5), vec2(0.075, 0.48)) - 0.055;
    float up = step(0.22, h);                       // most fans have their arms up
    float clap = clamp(u_clap + (h-0.5)*0.12, 0.0, 1.0);
    float spread = mix(0.15, 0.018, clap);
    float hy = 0.47 + 0.04*sin(id*1.7);
    vec2 sh1 = vec2(-0.1,-0.04), sh2 = vec2(0.1,-0.04);
    vec2 hand1 = mix(vec2(-0.16,-0.2), vec2(-spread, hy), up), hand2 = mix(vec2(0.16,-0.2), vec2(spread, hy), up);
    vec2 el1 = mix(sh1, hand1, 0.5) + vec2(-0.055*(1.0-clap)*up, 0.0), el2 = mix(sh2, hand2, 0.5) + vec2(0.055*(1.0-clap)*up, 0.0);
    float arms = min(min(capsule(lp, sh1, el1, 0.026), capsule(lp, el1, hand1, 0.022)), min(capsule(lp, sh2, el2, 0.026), capsule(lp, el2, hand2, 0.022)));
    float hands = min(length(lp-hand1)-0.03, length(lp-hand2)-0.03);
    float d = min(min(head, body), min(arms, hands))*sc;
    sil = min(sil, d);
  }
  float s = smoothstep(0.003, -0.003, sil);
  float rim = exp(-abs(sil)*140.0)*(1.0-s);
  col = mix(col, vec3(0.0), s);
  col += u_c1*rim*0.35*u_light;
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- MEMPHIS pattern
  SH.memphis = `
uniform float u_scroll, u_density, u_dark; uniform vec3 u_bgc;
vec3 mcol(float h){ h = floor(h*5.0); return h<1.0? vec3(1.0,0.35,0.65) : h<2.0? vec3(0.1,0.85,0.8) : h<3.0? vec3(1.0,0.85,0.1) : h<4.0? vec3(0.45,0.3,1.0) : vec3(1.0,0.5,0.2); }
void main(){
  vec2 p = P()*2.2 + vec2(u_scroll, u_scroll*0.3);
  vec3 col = u_bgc;
  // dot grid backdrop
  vec2 dg = fract(p*4.0)-0.5; col = mix(col, mix(vec3(0.0), vec3(1.0), u_dark), (1.0-smoothstep(0.05,0.08,length(dg)))*0.25);
  vec2 id = floor(p); vec2 f = fract(p)-0.5;
  float h = hash21(id), h2 = hash21(id+7.7), h3 = hash21(id+3.3);
  if(h < u_density){
    vec2 q = rot(h2*6.28 + u_time*(h3-0.5)*1.5)*(f - (hash22(id)-0.5)*0.3);
    float d; float kind = floor(h3*4.0);
    if(kind<1.0){ // triangle
      vec2 k = q*3.0; k.y += 0.3; d = max(abs(k.x)*0.866+k.y*0.5, -k.y) - 0.35; d/=3.0;
    } else if(kind<2.0){ // squiggle
      float yy = q.y - 0.08*sin(q.x*25.0); d = max(abs(yy)-0.025, abs(q.x)-0.3);
    } else if(kind<3.0){ // ring
      d = abs(length(q)-0.16)-0.035;
    } else { // zigzag bar
      float yy = q.y - 0.05*abs(fract(q.x*6.0)-0.5)*4.0; d = max(abs(yy)-0.03, abs(q.x)-0.3);
    }
    vec3 c = mcol(h2);
    float fill = smoothstep(0.012, 0.0, d);
    float outl = smoothstep(0.03, 0.012, d);
    col = mix(col, vec3(0.02), outl*(1.0-u_dark*0.7));
    col = mix(col, c*(1.0+u_dark*0.8), fill);
  }
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- SUNBURST (pop-art rays)
  SH.burst = `
uniform float u_rays, u_spin; uniform vec3 u_c1, u_c2; uniform vec2 u_center; uniform float u_halftone;
void main(){
  vec2 p = P() - u_center;
  float a = atan(p.y,p.x) + u_spin;
  float r = length(p);
  float k = step(0.5, fract(a/TAU*u_rays));
  vec3 col = mix(u_c1, u_c2, k);
  vec2 hp = rot(0.785)*P()*40.0; vec2 f = fract(hp)-0.5;
  float dotR = 0.12 + 0.3*clamp(r*0.6,0.0,1.0);
  col *= 1.0 - (1.0-smoothstep(dotR-0.04, dotR+0.04, length(f)))*u_halftone*0.35;
  col *= 1.0 - smoothstep(0.4, 2.0, r)*0.35;
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- PLANET ("whole worlds")
  SH.planet = `
uniform vec3 u_pl; uniform float u_ringTilt, u_spin; uniform vec3 u_c1, u_c2;
void main(){
  vec2 p = P();
  vec3 col = vec3(0.01,0.0,0.03);
  vec2 sp = p*20.0; vec2 id = floor(sp); vec2 h = hash22(id);
  col += vec3(1.0)*step(0.9,h.x)*smoothstep(0.08,0.0,length(fract(sp)-0.5-(h-0.5)*0.6))*(0.5+0.5*sin(u_time*3.0+h.y*20.0));
  col += vec3(0.4,0.1,0.6)*fbm(p*1.5+u_time*0.02)*0.3;
  vec2 q = p - u_pl.xy; float R = u_pl.z;
  float r = length(q);
  // back ring
  vec2 rq = vec2(q.x, q.y/u_ringTilt);
  float rr = length(rq);
  float ringBand = smoothstep(R*1.35, R*1.4, rr)*smoothstep(R*2.1, R*2.0, rr)*(0.6+0.4*sin(rr*90.0));
  vec3 ringCol = mix(u_c2, vec3(1.0), 0.3)*ringBand;
  if(q.y > 0.0) col += ringCol*0.9;
  if(r < R){
    float z = sqrt(R*R - r*r);
    vec3 n = normalize(vec3(q, z));
    float lam = clamp(dot(n, normalize(vec3(-0.5,0.4,0.7))), 0.0, 1.0);
    float lat = asin(n.y);
    float lon = atan(n.x, n.z) + u_spin;
    float bands = fbm(vec2(lon*1.5, lat*8.0));
    vec3 pc = mix(u_c1, u_c2, bands)*(0.15 + 0.95*lam);
    pc += vec3(1.0,0.6,0.9)*pow(1.0-n.z, 3.0)*0.6;
    col = pc;
  }
  if(q.y <= 0.0 && rr > R*1.35) col += ringCol*0.9;
  col += u_c2*0.3*exp(-max(r-R,0.0)*8.0/R)*step(R, r);
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- VOID (dark gradient + optional flying stars)
  SH.void = `
uniform vec3 u_c1, u_c2; uniform float u_stars, u_warp, u_grid;
void main(){
  vec2 p = P();
  vec3 col = mix(u_c2, u_c1, smoothstep(-1.2, 1.2, p.y + p.x*0.2));
  col += u_c1*0.15*fbm(p*1.3 + u_time*0.05);
  if(u_stars>0.0){
    for(int k=0;k<3;k++){
      float fk=float(k);
      float z = fract(u_time*u_warp*(0.15+fk*0.07) + fk*0.33);
      vec2 q = p/(1.0 - z*0.9 + 0.05)*(0.4+fk*0.2);
      vec2 sp = q*14.0; vec2 id = floor(sp); vec2 h = hash22(id+fk*9.0);
      float s = step(0.8, h.x)*smoothstep(0.1, 0.0, length(fract(sp)-0.5-(h-0.5)*0.6));
      col += vec3(0.9,0.9,1.0)*s*u_stars*smoothstep(0.0, 0.3, z)*(1.0-z*0.5);
    }
  }
  if(u_grid>0.0){ vec2 g = abs(fract(p*6.0)-0.5); col += u_c1*0.18*u_grid*(1.0-smoothstep(0.0,0.02,min(g.x,g.y))); }
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- TV ROOM: CRT in a dark room, screen shows a texture
  SH.tvroom = `
uniform sampler2D u_screen; uniform vec3 u_tv; uniform float u_on, u_static, u_glowAmt, u_blue, u_roll;
uniform vec3 u_wall;
float sdRound(vec2 p, vec2 b, float r){ vec2 d = abs(p)-b+r; return length(max(d,0.0)) + min(max(d.x,d.y),0.0) - r; }
void main(){
  vec2 p = P();
  vec2 c = u_tv.xy; float s = u_tv.z;
  vec2 q = (p - c)/s;
  // room
  vec3 col = u_wall*(0.35 + 0.65*smoothstep(1.8, 0.0, length(p - c - vec2(0.0,0.2))));
  col *= 0.6 + 0.4*fbm(p*3.0);
  // floor line
  col *= mix(0.55, 1.0, smoothstep(-0.62*s + c.y - 0.2, -0.6*s + c.y, p.y));
  // cabinet
  float cab = sdRound(q, vec2(1.25, 0.95), 0.12);
  float scr = sdRound(q - vec2(-0.18, 0.02), vec2(0.86, 0.68), 0.16);
  vec3 wood = mix(vec3(0.20,0.11,0.05), vec3(0.32,0.18,0.08), fbm(vec2(q.x*2.0, q.y*30.0)));
  // screen content with curvature
  vec2 sq = (q - vec2(-0.18,0.02))/vec2(0.86,0.68);
  vec2 k = sq*sq*vec2(0.08,0.1); vec2 cq = sq*(1.0 + k.yx);
  vec2 suv = cq*0.5+0.5;
  suv.y = fract(suv.y + u_roll);
  vec3 sc = texture(u_screen, suv).rgb;
  float ln = 0.75 + 0.25*sin(suv.y*u_res.y*1.2);
  sc *= ln;
  float st = hash21(floor(suv*vec2(320.0,240.0)) + fract(u_time*20.0)*vec2(97.0, 13.0));
  sc = mix(sc, vec3(st), u_static);
  sc = mix(sc, vec3(0.05,0.1,0.8) + vec3(0.02)*st, u_blue);
  sc *= u_on;
  // room glow from screen
  vec3 avg = texture(u_screen, vec2(0.5)).rgb*0.5 + texture(u_screen, vec2(0.3,0.6)).rgb*0.25 + texture(u_screen, vec2(0.7,0.4)).rgb*0.25;
  avg = mix(avg, vec3(0.3), u_static); avg = mix(avg, vec3(0.1,0.2,0.9), u_blue);
  col += avg*u_on*u_glowAmt*exp(-length(p-c)*1.2/s)*0.8;
  if(cab < 0.0){
    col = wood*(0.5+0.5*smoothstep(0.0,-0.05,cab));
    // knobs
    for(int i=0;i<2;i++){ vec2 kp = q - vec2(0.98, 0.35 - float(i)*0.35); float kd = length(kp)-0.09; col = mix(col, vec3(0.08)+vec3(0.25)*smoothstep(0.09,0.0,length(kp+0.03)), smoothstep(0.01,0.0,kd)); }
    // speaker grille
    vec2 gq = q - vec2(0.98,-0.5); if(abs(gq.x)<0.14 && abs(gq.y)<0.28) col *= 0.6+0.4*step(0.5, fract(gq.y*40.0));
    // bezel
    float bz = sdRound(q - vec2(-0.18, 0.02), vec2(0.94, 0.76), 0.2);
    if(bz < 0.0) col = vec3(0.06,0.055,0.05)*(0.7+0.3*smoothstep(0.0,-0.08,bz));
    if(scr < 0.0){
      col = sc + vec3(0.02,0.03,0.03);
      // glass reflection
      col += vec3(0.08)*smoothstep(0.3, 0.9, 1.0-length(sq - vec2(-0.5,0.5)));
      col *= smoothstep(0.0, -0.04, scr)*0.3+0.7;
    }
  }
  o = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- STAGE BEAMS (drawn additively)
  SH.beams = `
uniform float u_n, u_spread, u_sweep, u_int, u_srcY; uniform vec3 u_c1, u_c2;
void main(){
  vec2 p = P(); vec3 col = vec3(0.0);
  for(int i=0;i<8;i++){
    float fi = float(i); if(fi >= u_n) break;
    vec2 src = vec2(mix(-1.7, 1.7, (fi+0.5)/u_n), u_srcY);
    float ang = sin(u_time*u_sweep*(0.7+0.3*hash11(fi)) + fi*1.9)*0.55 - src.x*0.22;
    vec2 d = vec2(sin(ang), -cos(ang));
    vec2 q = p - src;
    float along = dot(q, d), across = abs(q.x*d.y - q.y*d.x);
    float w = 0.015 + along*u_spread;
    float beam = smoothstep(w, w*0.15, across)*step(0.0, along)*exp(-along*0.45);
    col += mix(u_c1, u_c2, hash11(fi*3.1))*beam*(0.8+0.4*hash11(fi+7.0));
  }
  o = vec4(col*u_int, 1.0);
}`;

  const progs = {};
  Bg.init = function () {
    for (const k in SH) progs[k] = G.fsProgram(HEAD + SH[k], 'bg.' + k);
  };

  Bg.draw = function (name, u = {}) {
    const p = progs[name];
    const a = u.u_alpha == null ? 1 : u.u_alpha;
    if (a <= 0.001) return;
    if (u.add) G.blend('add');
    else if (a < 1) {
      const gl = G.gl;
      gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD);
      gl.blendColor(0, 0, 0, a); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
    } else G.blend(null);
    const t = V.Rn.time, T = V.T, f = T.feat(t);
    p.use({
      u_res: [V.Rn.W, V.Rn.H], u_time: t, u_aspect: V.Rn.aspect, u_kick: f.kick, u_snare: f.snare, u_bass: f.bass, u_hat: f.hat,
      u_beat: T.beatPos(t), u_alpha: 1,
    });
    p.set(u);
    G.drawTri();
  };

  Bg.outrunDefaults = () => ({
    u_speed: 0, u_hor: -0.05, u_roll: 0, u_camX: 0, u_camH: 0.35, u_sunY: 0.32, u_sunR: 0.42, u_mount: 1, u_grid: 1.0, u_pulse: 0,
    u_stars: 1, u_fog: 0.06, u_slit: 1, u_wire: 1, u_road: 0,
    u_skyTop: V.M.hex('#0b0221'), u_skyBot: V.M.hex('#3b0a5e'), u_sun1: V.M.hex('#ffd319'), u_sun2: V.M.hex('#ff2a6d'),
    u_gridCol: V.M.hex('#ff2adf'), u_groundCol: V.M.hex('#0d0221'), u_mountCol: V.M.hex('#12052a'), u_horGlow: V.M.hex('#ff4fa0'),
  });
})();
