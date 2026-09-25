/* Backgrounds, locations and bigger props. */
'use strict';

function fillGrad(c, x0, y0, x1, y1, stops, rx, ry, rw, rh) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  c.fillStyle = g;
  c.fillRect(rx, ry, rw, rh);
}

/* ---------------- night sky + sea ---------------- */
function milkySprite() {
  return sprite('milky', 640, 180, (g, w, h) => {
    for (let k = 0; k < 18; k++) {
      const x = 40 + rnd(k, 201) * (w - 80), y = h / 2 + (rnd(k, 202) - 0.5) * 60, r = 50 + rnd(k, 203) * 70;
      const col = ['rgba(190,160,255,', 'rgba(255,170,220,', 'rgba(150,200,255,'][k % 3];
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, col + '0.22)'); gr.addColorStop(1, col + '0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (let k = 0; k < 520; k++) {
      const x = rnd(k, 204) * w, y = h / 2 + (rnd(k, 205) + rnd(k, 206) - 1) * h * 0.45, r = 0.4 + rnd(k, 207) * 1.1;
      g.globalAlpha = 0.25 + rnd(k, 208) * 0.6; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(20,12,50,0.35)'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(60, h * 0.55); g.bezierCurveTo(220, h * 0.4, 380, h * 0.68, 600, h * 0.48); g.stroke();
  });
}
function nightClouds(c, t, x, y, w, h, alpha = 0.9) {
  for (let k = 0; k < 5; k++) {
    const cw = w * (0.22 + rnd(k, 211) * 0.16), ch = cw * 0.26;
    const cx = x + ((rnd(k, 212) * w + t * (6 + k * 2)) % (w + cw)) - cw / 2;
    const cy = y + rnd(k, 213) * h;
    c.save();
    c.globalAlpha = alpha * (0.55 + 0.35 * rnd(k, 214));
    cloudPath(c, cx, cy, cw, ch, 9, k + 20);
    const g = c.createLinearGradient(0, cy - ch, 0, cy + ch);
    g.addColorStop(0, '#6a5bb0'); g.addColorStop(1, '#2c2468');
    c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.translate(0, 10); cloudPath(c, cx, cy, cw, ch, 9, k + 20); c.lineWidth = 8; c.strokeStyle = 'rgba(190,175,255,0.55)'; c.stroke(); c.restore();
    c.restore();
  }
}
function nightSky(c, t, x = -200, y = -200, w = W + 400, h = H + 400, o = {}) {
  fillGrad(c, 0, y, 0, y + h, [[0, '#090824'], [0.4, '#191450'], [0.75, '#3a2b80'], [1, '#6e52ad']], x, y, w, h);
  if (o.milky !== false) {
    c.save();
    c.translate(x + w * 0.5, y + h * 0.3); c.rotate(-0.3);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6;
    c.drawImage(milkySprite(), -w * 0.72, -h * 0.17, w * 1.44, h * 0.34);
    c.restore();
  }
  twinkles(c, t, o.stars || 110, x, y, w, h * 0.78, 3, o.starSize || 1);
  if (o.clouds !== false) nightClouds(c, t, x, y + h * 0.6, w, h * 0.22, o.cloudAlpha ?? 0.9);
  const ph = (t % 7) / 7;
  if (ph < 0.12 && !o.noShoot) {
    const k = ph / 0.12, sx = x + w * (0.2 + 0.5 * rnd(Math.floor(t / 7), 41)), sy = y + h * 0.15;
    c.save(); c.globalAlpha = Math.sin(k * Math.PI);
    const g = c.createLinearGradient(sx + k * 400 - 160, sy + k * 160 - 64, sx + k * 400, sy + k * 160);
    g.addColorStop(0, 'rgba(255,255,230,0)'); g.addColorStop(1, 'rgba(255,255,230,0.95)');
    line(c, sx + k * 400, sy + k * 160, sx + k * 400 - 160, sy + k * 160 - 64, g, 5);
    glow(c, sx + k * 400, sy + k * 160, 30, 'rgba(255,255,220,0.9)');
    c.restore();
  }
}
function seaSurface(c, t, y0, x = -200, w = W + 400, h = 700, o = {}) {
  fillGrad(c, 0, y0, 0, y0 + h, [[0, '#3f63b8'], [0.3, '#2a4596'], [1, '#131f58']], x, y0, w, h);
  glowE(c, x + w / 2, y0, w * 0.6, 40, 'rgba(200,190,255,0.35)');
  if (o.moonX !== undefined) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 26; k++) {
      const yy = y0 + 12 + k * k * 1.1 + k * 6, ww = (60 + rnd(k, 221) * 90) * (1 - k / 40);
      const xx = o.moonX + Math.sin(t * 2 + k * 1.7) * (14 + k * 2) - ww / 2;
      c.globalAlpha = (0.55 - k * 0.018) * (0.6 + 0.4 * Math.sin(t * 5 + k * 2.3));
      rrect(c, xx, yy, ww, 4 + k * 0.15, 3); c.fillStyle = '#fff2c0'; c.fill();
    }
    c.restore();
  }
  for (let r = 0; r < 7; r++) {
    const yy = y0 + 18 + r * r * 14, amp = 4 + r * 2, len = 90 + r * 30;
    c.beginPath();
    for (let xx = x; xx <= x + w; xx += 20) c.lineTo(xx, yy + Math.sin(xx / len + t * (1.4 + r * 0.2) + r) * amp);
    c.lineWidth = 2.5 + r * 0.6; c.strokeStyle = `rgba(190,225,255,${0.3 - r * 0.03})`; c.stroke();
  }
}

/* ---------------- the cozy seaside house ---------------- */
function drawHouse(c, x, y, s, t, o = {}) {
  const porch = o.porch ?? 0.7;
  c.save(); c.translate(x, y); c.scale(s, s);
  // warm light spilling from the windows onto the grass
  glowE(c, -150, 30, 170, 40, 'rgba(255,200,110,0.55)');
  glowE(c, 150, 30, 170, 40, 'rgba(255,200,110,0.55)');
  // chimney + smoke
  cel(c, pRRect(90, -420, 50, 110, 6), '#c77d7d', { d: 6 });
  for (let k = 0; k < 3; k++) line(c, 92, -400 + k * 30, 138, -400 + k * 30, 'rgba(120,50,60,0.35)', 3);
  for (let k = 0; k < 4; k++) {
    const ph = (t * 0.25 + k / 4) % 1;
    const r = 16 + ph * 30;
    glow(c, 115 + Math.sin(ph * 5 + k) * 20 + ph * 40, -430 - ph * 200, r * 1.6, `rgba(220,215,255,${0.45 * (1 - ph)})`);
  }
  // walls
  const wall = pRRect(-230, -300, 460, 300, 12);
  const wg = c.createLinearGradient(0, -300, 0, 0); wg.addColorStop(0, '#fff3e2'); wg.addColorStop(1, '#f0d8bd');
  cel(c, wall, wg, { shadow: '#e0c2a2', d: 14, line: '#7a5a50', lw: 6 });
  c.save(); c.clip(wall);
  for (let k = 1; k < 7; k++) line(c, -226, -300 + k * 42, 226, -300 + k * 42, 'rgba(180,140,110,0.35)', 3);
  const eave = c.createLinearGradient(0, -300, 0, -250); eave.addColorStop(0, 'rgba(60,30,70,0.45)'); eave.addColorStop(1, 'rgba(60,30,70,0)');
  c.fillStyle = eave; c.fillRect(-240, -300, 480, 60);
  c.restore();
  // roof
  const roof = new Path2D();
  roof.moveTo(-282, -290); roof.lineTo(0, -472); roof.lineTo(282, -290);
  roof.quadraticCurveTo(292, -272, 270, -270); roof.lineTo(-270, -270); roof.quadraticCurveTo(-292, -272, -282, -290); roof.closePath();
  const rg = c.createLinearGradient(0, -472, 0, -270); rg.addColorStop(0, '#8a7ae6'); rg.addColorStop(1, '#5646b0');
  cel(c, roof, rg, { shadow: '#46379a', d: 16, line: '#231a5a', lw: 6 });
  c.save(); c.clip(roof);
  for (let r = 0; r < 7; r++) {
    const yy = -440 + r * 26, half = 40 + r * 40;
    c.beginPath();
    for (let xx = -half; xx < half; xx += 30) { c.moveTo(xx, yy); c.quadraticCurveTo(xx + 15, yy + 16, xx + 30, yy); }
    c.lineWidth = 3; c.strokeStyle = 'rgba(35,26,90,0.35)'; c.stroke();
  }
  c.restore();
  line(c, -8, -466, -270, -294, 'rgba(255,255,255,0.35)', 5);
  // round attic window
  circle(c, 0, -350, 42); fs(c, '#c48a5a', '#5a3a2a', 5);
  const ag = c.createRadialGradient(-8, -358, 4, 0, -350, 38);
  ag.addColorStop(0, o.attic ? '#fff8d0' : '#5a60b0'); ag.addColorStop(1, o.attic ? '#ffc970' : '#2f3478');
  circle(c, 0, -350, 34); c.fillStyle = ag; c.fill();
  if (o.attic) glow(c, 0, -350, 160, 'rgba(255,215,130,0.55)');
  line(c, -34, -350, 34, -350, '#5a3a2a', 4); line(c, 0, -384, 0, -316, '#5a3a2a', 4);
  // windows
  for (const wx of [-150, 150]) {
    glow(c, wx, -175, 170, 'rgba(255,205,110,0.5)');
    const wpath = pRRect(wx - 55, -225, 110, 100, 12);
    const wgl = c.createRadialGradient(wx - 10, -185, 6, wx, -175, 80);
    wgl.addColorStop(0, '#fff8d8'); wgl.addColorStop(1, '#ffc466');
    c.fillStyle = wgl; c.fill(wpath);
    c.save(); c.clip(wpath);
    for (const sd of [-1, 1]) { const cur = new Path2D(); cur.moveTo(wx + sd * 55, -225); cur.quadraticCurveTo(wx + sd * 20, -190, wx + sd * 40, -125); cur.lineTo(wx + sd * 55, -125); cur.closePath(); c.fillStyle = 'rgba(255,140,190,0.75)'; c.fill(cur); }
    c.restore();
    c.lineWidth = 5; c.strokeStyle = '#5a3a2a'; c.stroke(wpath);
    line(c, wx, -225, wx, -125, '#8a5a3a', 4); line(c, wx - 55, -175, wx + 55, -175, '#8a5a3a', 4);
    cel(c, pRRect(wx - 65, -130, 130, 16, 6), '#ff9ecf', { d: 3, lw: 4 });
    for (let k = 0; k < 3; k++) { circle(c, wx - 40 + k * 40, -136, 10); fs(c, ['#ff6f9f', '#ffd166', '#b59cff'][k], INK, 3); }
  }
  // door
  const door = pRRect(-50, -170, 100, 170, 14);
  const dg = c.createLinearGradient(-50, 0, 50, 0); dg.addColorStop(0, '#9a6ab0'); dg.addColorStop(1, '#7a4a98');
  cel(c, door, dg, { shadow: '#5f3a80', d: 8, line: '#3a2050', lw: 5 });
  rrect(c, -30, -150, 60, 40, 10); fs(c, '#ffe39a', '#3a2050', 4);
  const kg = c.createRadialGradient(28, -84, 1, 30, -80, 8); kg.addColorStop(0, '#fff6c8'); kg.addColorStop(1, '#e0a030');
  circle(c, 30, -80, 7); fs(c, kg, '#7a5010', 3);
  heartPath(c, 0, -104, 12); fs(c, '#ff9ecf', '#a02a5a', 3);
  // porch light + beam
  const pb = porch * (0.92 + 0.08 * Math.sin(t * 7));
  if (pb > 0.05) {
    lightShaft(c, -104, -205, -76, -200, 0, 20, '#ffe6a0', 0.3 * pb);
    glowE(c, -90, 0, 160, 34, 'rgba(255,220,130,0.6)', pb);
    glow(c, -90, -212, 300 * (0.45 + pb * 0.6), `rgba(255,228,140,${0.55 * pb})`);
  }
  rrect(c, -100, -230, 22, 34, 6); fs(c, pb > 0.2 ? '#fff6c0' : '#d0cce0', '#5a3a2a', 4);
  line(c, -89, -240, -89, -230, '#5a3a2a', 4);
  // porch floor + a potted plant
  const pf = pRRect(-270, -12, 540, 24, 8);
  cel(c, pf, '#c48a5a', { d: 4, line: '#6a4020' });
  for (let k = 1; k < 9; k++) line(c, -270 + k * 60, -10, -270 + k * 60, 10, 'rgba(90,50,20,0.35)', 3);
  cel(c, pRRect(180, -62, 44, 50, 10), '#ff8f6f', { d: 5 });
  for (let k = 0; k < 4; k++) { c.save(); c.translate(202, -62); c.rotate(-0.9 + k * 0.6 + Math.sin(t * 2 + k) * 0.05); cel(c, pEllipse(0, -34, 12, 32), '#6fcf97', { d: 4, lw: 3.5 }); c.restore(); }
  c.restore();
}
function drawCliff(c, x, y, w, h, t) {
  c.save();
  const rock = new Path2D();
  rock.moveTo(x + w, y + h);
  rock.lineTo(x + 90, y + h);
  for (let k = 0; k <= 14; k++) {
    const yy = y + h - (k / 14) * (h - 60);
    const bump = (k % 2 ? 46 : 0) + rnd(k, 141) * 34;
    rock.quadraticCurveTo(x - 30 + bump, yy + h / 28, x + 20 + bump * 0.6, yy);
  }
  rock.lineTo(x + 30, y + 60);
  rock.quadraticCurveTo(x + 50, y, x + 160, y);
  rock.lineTo(x + w, y);
  rock.closePath();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#6c5ab4'); g.addColorStop(0.3, '#4a3d90'); g.addColorStop(1, '#241e58');
  cel(c, rock, g, { shadow: 'rgba(20,14,60,0.45)', d: 26, line: '#171040', lw: 6 });
  c.save(); c.clip(rock);
  for (let k = 0; k < 46; k++) {
    const sx = x + 40 + rnd(k, 142) * (w - 60), sy = y + 90 + rnd(k, 143) * (h - 120);
    const r = 34 + rnd(k, 144) * 60;
    ellipse(c, sx, sy, r * 1.5, r, rnd(k, 145) * 0.6 - 0.3);
    c.fillStyle = ['rgba(130,110,210,0.3)', 'rgba(30,20,80,0.35)', 'rgba(160,140,240,0.18)'][k % 3]; c.fill();
    c.beginPath(); c.ellipse(sx, sy, r * 1.5, r, rnd(k, 145) * 0.6 - 0.3, Math.PI * 1.1, Math.PI * 1.7); c.lineWidth = 4; c.strokeStyle = 'rgba(200,190,255,0.25)'; c.stroke();
  }
  for (let k = 0; k < 18; k++) {
    const sx = x + 60 + rnd(k, 146) * 320, sy = DIO.sea + 80 + rnd(k, 147) * (y + h - DIO.sea - 200);
    circle(c, sx, sy, 8 + rnd(k, 148) * 8); fs(c, k % 3 ? '#b8a8ff' : '#ff9ecf', INK, 3);
  }
  // water haze on the submerged part
  const hz = c.createLinearGradient(0, DIO.sea, 0, y + h);
  hz.addColorStop(0, 'rgba(60,110,200,0.25)'); hz.addColorStop(1, 'rgba(20,40,110,0.55)');
  c.fillStyle = hz; c.fillRect(x - 60, DIO.sea, w + 120, y + h - DIO.sea);
  c.restore();
  for (let k = 0; k < 6; k++) seaweed(c, x + 70 + (k % 3) * 60 + rnd(k, 149) * 30, DIO.sea + 360 + k * 230, 120 + rnd(k, 150) * 60, t, k % 2 ? '#3fbf8f' : '#5fd4a4', k);
  // grass cap with a moonlit edge
  const grass = new Path2D();
  grass.moveTo(x + 40, y + 36); grass.quadraticCurveTo(x + 60, y - 8, x + 160, y - 8); grass.lineTo(x + w, y - 8); grass.lineTo(x + w, y + 22);
  for (let k = 0; k < 20; k++) grass.quadraticCurveTo(x + w - (k + 0.5) * (w - 40) / 20, y + 44, x + w - (k + 1) * (w - 40) / 20, y + 22);
  grass.closePath();
  const gg = c.createLinearGradient(0, y - 8, 0, y + 44); gg.addColorStop(0, '#8ee8b0'); gg.addColorStop(1, '#4fb880');
  cel(c, grass, gg, { shadow: '#3f9f70', d: 6, line: '#1f5a40', lw: 5 });
  c.beginPath(); c.moveTo(x + 50, y + 30); c.quadraticCurveTo(x + 64, y - 4, x + 160, y - 5); c.lineWidth = 4; c.strokeStyle = 'rgba(230,255,240,0.6)'; c.stroke();
  for (let k = 0; k < 8; k++) {
    const fx = x + 200 + rnd(k, 61) * (w - 260), fy = y - 6;
    const bob = Math.sin(t * 3 + k) * 3;
    line(c, fx, fy, fx, fy - 20 + bob, '#2f8f5f', 3);
    circle(c, fx, fy - 24 + bob, 7); c.fillStyle = ['#ff9ecf', '#ffd166', '#fff'][k % 3]; c.fill();
  }
  c.restore();
}

/* ---------------- underwater ---------------- */
function underwaterBg(c, t, x = -200, y = -200, w = W + 400, h = H + 400, o = {}) {
  fillGrad(c, 0, y, 0, y + h, [[0, o.top || '#3a78cc'], [0.35, '#23519e'], [0.75, '#16317a'], [1, o.bottom || '#0d1a4c']], x, y, w, h);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 8; k++) {
    const rx = x + (k + 0.5) * w / 8 + Math.sin(t * 0.35 + k) * 70;
    const wd = 50 + rnd(k, 231) * 70;
    const g = c.createLinearGradient(0, y, 0, y + h * 0.85);
    g.addColorStop(0, `rgba(170,230,255,${0.14 + 0.06 * Math.sin(t * 0.8 + k)})`); g.addColorStop(1, 'rgba(170,230,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(rx - wd, y); c.lineTo(rx + wd, y); c.lineTo(rx + wd * 3 + k * 12, y + h); c.lineTo(rx + wd + k * 12, y + h); c.closePath(); c.fill();
  }
  c.restore();
  motes(c, t, 70, x, y, w, h, 13, 'rgba(210,240,255,0.55)', 1.2);
}
/* moving light net on sandy floors */
function caustics(c, t, x, y, w, h, a = 0.16) {
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.globalCompositeOperation = 'lighter';
  c.lineWidth = 5; c.strokeStyle = `rgba(200,245,255,${a})`; c.lineJoin = 'round';
  for (let r = 0; r < 7; r++) {
    c.beginPath();
    for (let xx = x; xx <= x + w; xx += 36) c.lineTo(xx, y + (r + 0.5) * h / 7 + Math.sin(xx / 70 + t * 1.3 + r * 1.7) * 14 + Math.sin(xx / 23 - t * 1.9 + r) * 6);
    c.stroke();
  }
  for (let r = 0; r < 16; r++) {
    c.beginPath();
    const x0 = x + (r + 0.5) * w / 16;
    for (let yy = y; yy <= y + h; yy += 24) c.lineTo(x0 + Math.sin(yy / 40 + t * 1.1 + r * 1.3) * 22, yy);
    c.stroke();
  }
  c.restore();
}
function ruinsFar(c, t, x0, y0, w, s = 1, alpha = 0.35) {
  c.save(); c.globalAlpha = alpha;
  for (let k = 0; k < 9; k++) {
    const px = x0 + (k / 9) * w + rnd(k, 71) * 80;
    const ph = (180 + rnd(k, 72) * 260) * s, pw = (50 + rnd(k, 73) * 50) * s;
    c.save(); c.translate(px, y0); c.rotate((rnd(k, 74) - 0.5) * 0.5);
    rrect(c, -pw / 2, -ph, pw, ph, 10); c.fillStyle = ['#8e7cff', '#6fd4c4', '#ff9ecf'][k % 3]; c.fill();
    rrect(c, -pw * 0.7, -ph - 16 * s, pw * 1.4, 22 * s, 8); c.fill();
    c.restore();
  }
  c.restore();
}
function seaweed(c, x, y, h, t, col = '#3fbf8f', seed = 0) {
  const p = new Path2D();
  p.moveTo(x - 10, y);
  const N = 10;
  for (let k = 0; k <= N; k++) { const u = k / N; p.lineTo(x - 10 * (1 - u) + Math.sin(t * 1.6 + u * 4 + seed) * 22 * u, y - h * u); }
  for (let k = N; k >= 0; k--) { const u = k / N; p.lineTo(x + 10 * (1 - u) + Math.sin(t * 1.6 + u * 4 + seed) * 22 * u + 6, y - h * u); }
  p.closePath();
  const g = c.createLinearGradient(0, y - h, 0, y);
  g.addColorStop(0, lighten(col, 0.25)); g.addColorStop(1, darken(col, 0.2));
  c.fillStyle = g; c.fill(p);
  c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = lineOf(col); c.stroke(p);
}
function seaFloor(c, t, y, x = -200, w = W + 400) {
  const p = new Path2D();
  p.moveTo(x, y + 30);
  for (let xx = x; xx <= x + w; xx += 60) p.quadraticCurveTo(xx + 30, y - 14 + rnd(xx, 81) * 20, xx + 60, y + 10);
  p.lineTo(x + w, y + 800); p.lineTo(x, y + 800); p.closePath();
  const g = c.createLinearGradient(0, y, 0, y + 400);
  g.addColorStop(0, '#f4dcae'); g.addColorStop(1, '#b8906c');
  c.fillStyle = g; c.fill(p);
  c.save(); c.clip(p);
  caustics(c, t, x, y - 10, w, 260, 0.2);
  for (let k = 0; k < 14; k++) { ellipse(c, x + rnd(k, 82) * w, y + 40 + rnd(k, 83) * 120, 10 + rnd(k, 84) * 12, 6); c.fillStyle = 'rgba(140,100,70,0.35)'; c.fill(); }
  c.restore();
  c.lineWidth = 5; c.strokeStyle = '#7a5a3a'; c.stroke(p);
  for (let k = 0; k < 4; k++) {
    c.save(); c.translate(x + 120 + k * w / 4 + rnd(k, 85) * 100, y + 50 + rnd(k, 86) * 60); c.rotate(t * 0.2 + k);
    const st = new Path2D(); { const pts = []; for (let j = 0; j < 10; j++) { const rr = j % 2 ? 10 : 22, a = (j * Math.PI) / 5; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } pts.forEach(([px, py], j) => (j ? st.lineTo(px, py) : st.moveTo(px, py))); st.closePath(); }
    cel(c, st, ['#ff9ecf', '#ffb347'][k % 2], { d: 4, lw: 3.5 });
    c.restore();
  }
}
function coral(c, x, y, s, col = '#ff9ecf') {
  c.save(); c.translate(x, y); c.scale(s, s);
  const br = [[0, -80], [-40, -60], [40, -66], [-24, -110], [26, -104]];
  for (const [bx, by] of br) { line(c, 0, 0, bx, by, lineOf(col), 22); line(c, 0, 0, bx, by, col, 14); line(c, -3, -3, bx - 3, by, lighten(col, 0.3), 4); }
  for (const [bx, by] of br) cel(c, pEllipse(bx, by, 14, 14), col, { d: 4, lw: 4, hi: lighten(col, 0.35) });
  c.restore();
}
/* the sunken temple, cute edition */
function drawTemple(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const cols = ['#9f8cff', '#7fd8c8', '#ff9ecf'];
  cel(c, pRRect(-420, -40, 840, 50, 14), '#b8a8ff', { d: 8, hi: '#d8ccff' });
  cel(c, pRRect(-360, -80, 720, 48, 14), '#a797f5', { d: 8, hi: '#cbbfff' });
  for (let k = 0; k < 4; k++) {
    const px = -300 + k * 200, tilt = [-0.12, 0.06, -0.05, 0.14][k];
    c.save(); c.translate(px, -80); c.rotate(tilt);
    const col = cols[k % 3];
    const pil = pRRect(-34, -360, 68, 360, 16);
    const pg = c.createLinearGradient(-34, 0, 34, 0); pg.addColorStop(0, lighten(col, 0.25)); pg.addColorStop(0.5, col); pg.addColorStop(1, darken(col, 0.15));
    cel(c, pil, pg, { shadow: darken(col, 0.22), d: 10, line: lineOf(col) });
    for (let j = 0; j < 3; j++) line(c, -18 + j * 18, -340, -18 + j * 18, -20, 'rgba(42,27,61,0.16)', 5);
    line(c, -24, -340, -24, -24, 'rgba(255,255,255,0.35)', 4);
    cel(c, pRRect(-50, -390, 100, 36, 10), '#fff0f8', { d: 5 });
    // glowing glyph
    const gp = 0.55 + 0.45 * Math.sin(t * 1.5 + k * 1.3);
    glow(c, 0, -200, 60, `rgba(140,255,230,${0.45 * gp})`);
    c.beginPath(); for (let a = 0; a < 7; a += 0.3) { const r = 2 + a * 2.2; c.lineTo(Math.cos(a) * r, -200 + Math.sin(a) * r); }
    c.lineWidth = 4; c.strokeStyle = `rgba(200,255,240,${0.6 + 0.4 * gp})`; c.stroke();
    c.restore();
  }
  c.save(); c.translate(0, -470); c.rotate(-0.04);
  cel(c, pRRect(-380, -40, 760, 70, 20), '#c3b5ff', { d: 9, hi: '#e0d8ff' });
  for (let k = 0; k < 6; k++) { c.beginPath(); for (let a = 0; a < 8; a += 0.3) { const r = 2 + a * 1.6; c.lineTo(-300 + k * 120 + Math.cos(a) * r, -5 + Math.sin(a) * r); } fs(c, null, '#7b4fd6', 4); }
  c.restore();
  if (o.sign > 0) {
    const sw = Math.sin(t * 2) * 0.08, p = clamp(o.sign);
    c.save(); c.translate(250, -440); c.rotate(sw); c.scale(p, p);
    line(c, -40, 0, 0, -40, '#5a4a7a', 4); line(c, 40, 0, 0, -40, '#5a4a7a', 4);
    cel(c, pRRect(-110, 0, 220, 90, 16), '#fff6e0', { d: 6, line: '#6a4a3a' });
    txt(c, 'DO NOT', 0, 28, { size: 30, font: DISPLAY, weight: 400, fill: '#ff6f9f', stroke: false, shadow: false });
    txt(c, 'DISTURB', 0, 62, { size: 30, font: DISPLAY, weight: 400, fill: '#6b3fc9', stroke: false, shadow: false });
    txt(c, 'z', 90, 20, { size: 24, font: DISPLAY, fill: '#8fe3b0', lw: 5 });
    c.restore();
  }
  c.restore();
}
function drawClamBed(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const back = new Path2D(); back.moveTo(-260, 0); back.bezierCurveTo(-270, -260, 270, -260, 260, 0); back.closePath();
  const bg = c.createRadialGradient(-60, -160, 20, 0, -80, 280);
  bg.addColorStop(0, '#ffe6f0'); bg.addColorStop(0.6, '#ffc2d8'); bg.addColorStop(1, '#e89ac0');
  cel(c, back, bg, { shadow: '#e08ab4', d: 16, line: '#8a3a6a', lw: 6 });
  c.save(); c.clip(back);
  for (let k = -3; k <= 3; k++) { line(c, 0, -10, k * 70, -200 + Math.abs(k) * 30, 'rgba(210,100,150,0.4)', 6); line(c, 4, -10, k * 70 + 6, -200 + Math.abs(k) * 30, 'rgba(255,255,255,0.35)', 3); }
  c.restore();
  cel(c, pRRect(-250, -40, 500, 60, 30), '#fff0f7', { shadow: '#f2d4e6', d: 6, line: '#9a5a80' });
  const lip = new Path2D(); lip.moveTo(-270, 0); lip.quadraticCurveTo(0, 80, 270, 0); lip.quadraticCurveTo(0, 40, -270, 0); lip.closePath();
  cel(c, lip, '#ffb3cf', { d: 5, line: '#8a3a6a' });
  const pg = c.createRadialGradient(-196, -78, 4, -180, -60, 46);
  pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.6, '#f4f0ff'); pg.addColorStop(1, '#d8d0f0');
  circle(c, -180, -60, 44); fs(c, pg, '#8a7aa8', 5);
  glow(c, -190, -74, 40, 'rgba(255,255,255,0.8)');
  c.restore();
}
function blanket(c, x, y, s, amt = 1, col = '#b59cff') {
  if (amt <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s);
  const top = lerp(40, -120, amt);
  const p = new Path2D(); p.moveTo(-230, 30); p.lineTo(-230, top + 20); p.quadraticCurveTo(0, top - 30, 230, top + 20); p.lineTo(230, 30); p.closePath();
  const g = c.createLinearGradient(0, top - 30, 0, 30); g.addColorStop(0, lighten(col, 0.18)); g.addColorStop(1, darken(col, 0.12));
  cel(c, p, g, { shadow: darken(col, 0.2), d: 10, line: lineOf(col) });
  c.save(); c.clip(p);
  for (let k = -6; k < 7; k++) { heartPath(c, k * 60, top + 60 + (k % 2) * 30, 12); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fill(); }
  c.setLineDash([10, 9]); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.beginPath(); c.moveTo(-230, top + 50); c.quadraticCurveTo(0, top + 4, 230, top + 50); c.stroke(); c.setLineDash([]);
  c.restore();
  cel(c, pRRect(-236, top + 6, 472, 30, 15), '#ffffff', { shadow: '#e6e0f4', d: 5, line: '#7a6aa8' });
  c.restore();
}

/* the whole cross-section world: sky, cliff house, sea, sleeper. world height ~2400 */
const DIO = { sea: 620, floor: 2250, houseX: 1450, cliffY: 470, cthX: 700 };
function viewRect(c) {
  const inv = c.getTransform().inverse();
  const a = inv.transformPoint({ x: 0, y: 0 }), b = inv.transformPoint({ x: c.canvas.width, y: c.canvas.height });
  return [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)];
}
function diorama(c, t, o = {}) {
  const [, vy0, vx1, vy1] = viewRect(c);
  const sky = vy0 < DIO.sea + 20, sea = vy1 > DIO.sea - 20, deep = vy1 > DIO.floor - 900, cliff = vx1 > 1060;
  if (sky) {
    nightSky(c, t, -1200, -1400, 4400, 2100, { stars: 170 });
    if (o.moon !== false) drawMoon(c, o.moonX ?? 330, o.moonY ?? 130, 1.0, { t, face: o.moonFace || 'sleepy', shades: o.moonShades });
    seaSurfaceBand(c, t, o.moonX ?? 330);
  }
  if (sea) diorama_sea(c, t, o, deep);
  if (cliff) {
    drawCliff(c, 1080, DIO.cliffY, 1100, DIO.floor + 200 - DIO.cliffY, t);
    if (sky) {
      drawHouse(c, DIO.houseX + 150, DIO.cliffY, 0.95, t, { porch: o.porch ?? 1, attic: o.attic });
      fireflies(c, t, 14, 1150, 150, 900, 300, 31);
    }
  }
  if (vy0 < DIO.sea + 40 && vy1 > DIO.sea - 20) seaLine(c, t);
}
/* the moonlit sheen just under the waterline, seen from above */
function seaSurfaceBand(c, t, moonX) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 10; k++) {
    const yy = DIO.sea - 6 + k * 2.5, ww = 80 + rnd(k, 241) * 120;
    c.globalAlpha = 0.25 * (0.5 + 0.5 * Math.sin(t * 4 + k));
    rrect(c, moonX - ww / 2 + Math.sin(t * 2 + k) * 30, yy, ww, 4, 2); c.fillStyle = '#fff2c0'; c.fill();
  }
  c.restore();
}
function fireflies(c, t, n, x0, y0, w, h, salt = 31) {
  for (let k = 0; k < n; k++) {
    const fx = x0 + rnd(k, salt) * w + Math.sin(t * (0.8 + rnd(k, salt + 1)) + k) * 50;
    const fy = y0 + rnd(k, salt + 2) * h + Math.cos(t * (0.9 + rnd(k, salt + 3)) + k * 2) * 30;
    const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + k * 1.7));
    glow(c, fx, fy, 22, 'rgba(255,240,150,0.9)', a);
    circle(c, fx, fy, 3.2); c.fillStyle = `rgba(255,252,220,${a})`; c.fill();
  }
}
function diorama_sea(c, t, o, deep) {
  underwaterBg(c, t, -1200, DIO.sea, 4400, 2400, { top: '#3a78cc' });
  ruinsFar(c, t, -200, DIO.floor - 60, 2400, 1.3, 0.22);
  bubblesFx(c, t, 26, -100, DIO.sea + 40, 2100, DIO.floor - DIO.sea, { speed: 70 });
  const [vx0, vy0, vx1, vy1] = viewRect(c);
  for (let k = 0; k < 7; k++) {
    const dir = k % 2 ? 1 : -1, sp = 90 + rnd(k, 91) * 60;
    const fx = ((t * sp * dir + rnd(k, 92) * 2600) % 2600 + 2600) % 2600 - 300;
    const fy = DIO.sea + 250 + rnd(k, 93) * 1200;
    if (fx < vx0 - 80 || fx > vx1 + 80 || fy < vy0 - 60 || fy > vy1 + 60) continue;
    drawFish(c, fx, fy, 0.9 + rnd(k, 94) * 0.5, t, { color: ['#ffb347', '#ff9ecf', '#8fe3b0', '#ffe27a'][k % 4], flip: dir < 0, seed: k });
  }
  if (!deep) return;
  seaFloor(c, t, DIO.floor, -1200, 4400);
  for (let k = 0; k < 10; k++) seaweed(c, -100 + k * 230 + rnd(k, 95) * 80, DIO.floor + 20, 160 + rnd(k, 96) * 180, t, k % 2 ? '#3fbf8f' : '#5fd4a4', k);
  coral(c, 180, DIO.floor + 10, 1.1, '#ff9ecf'); coral(c, 1250, DIO.floor + 10, 1.0, '#ffb347');
  // a soft beam falling on the sleeper
  lightShaft(c, DIO.cthX - 160, DIO.floor - 1100, DIO.cthX + 20, DIO.cthX - 300, DIO.floor, DIO.cthX + 260, '#bff0ff', 0.16);
  drawTemple(c, DIO.cthX, DIO.floor, 1.0, t, { sign: o.sign || 0 });
  drawClamBed(c, DIO.cthX, DIO.floor - 90, 0.95, t);
  drawCthulhu(c, DIO.cthX + 20, DIO.floor - 110, 1.05, Object.assign({ t, mood: 'sleep', hug: 'fish', noShadow: true }, o.cth || {}));
  if (o.blanket) blanket(c, DIO.cthX + 20, DIO.floor - 100, 1.0, o.blanket);
  if (o.cthMood !== 'awake') zzz(c, DIO.cthX + 150, DIO.floor - 390, t, 1.4);
  motes(c, t, 40, DIO.cthX - 700, DIO.floor - 900, 1400, 900, 17, 'rgba(230,250,255,0.5)', 1.4);
}
function seaLine(c, t) {
  c.save();
  c.beginPath(); c.moveTo(-1200, DIO.sea);
  for (let xx = -1200; xx <= 3200; xx += 30) c.lineTo(xx, DIO.sea + Math.sin(xx / 90 + t * 2) * 8);
  c.lineTo(3200, DIO.sea + 50); c.lineTo(-1200, DIO.sea + 50); c.closePath();
  const g = c.createLinearGradient(0, DIO.sea - 10, 0, DIO.sea + 50); g.addColorStop(0, 'rgba(200,240,255,0.65)'); g.addColorStop(1, 'rgba(160,220,255,0)');
  c.fillStyle = g; c.fill();
  c.beginPath();
  for (let xx = -1200; xx <= 3200; xx += 30) c.lineTo(xx, DIO.sea + Math.sin(xx / 90 + t * 2) * 8);
  c.lineWidth = 6; c.strokeStyle = '#eefaff'; c.stroke();
  c.restore();
}

/* ---------------- indoor sets ---------------- */
function roomBg(c, t, o = {}) {
  const fy = o.floorY || 820;
  fillGrad(c, 0, -200, 0, fy, [[0, o.wall1 || '#433585'], [1, o.wall2 || '#6a55b8']], -300, -300, W + 600, fy + 300);
  // subtle wallpaper
  c.save(); c.globalAlpha = 0.12; c.fillStyle = '#ffffff';
  for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < 20; xx++) {
    const px = -200 + xx * 130 + (yy % 2) * 65, py = -140 + yy * 110;
    if (py > fy - 200) continue;
    if ((xx + yy) % 2) { softStar(c, px, py, 12, 5, 0.3); c.fill(); } else { circle(c, px, py, 4); c.fill(); }
  }
  c.restore();
  // wainscoting
  const wy = fy - 200;
  fillGrad(c, 0, wy, 0, fy, [[0, o.panel1 || 'rgba(255,255,255,0.10)'], [1, o.panel2 || 'rgba(0,0,30,0.18)']], -300, wy, W + 600, 200);
  line(c, -300, wy, W + 300, wy, 'rgba(255,255,255,0.35)', 6);
  line(c, -300, wy + 8, W + 300, wy + 8, 'rgba(20,10,50,0.35)', 3);
  for (let k = 0; k < 14; k++) { rrect(c, -180 + k * 170, wy + 30, 130, 130, 10); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke(); }
  // perspective floor boards
  const vx = W / 2, fb = H + 260;
  const fg = c.createLinearGradient(0, fy, 0, fb);
  fg.addColorStop(0, o.floor1 || '#8a5a3c'); fg.addColorStop(1, o.floor2 || '#b07a52');
  c.fillStyle = fg; c.fillRect(-300, fy, W + 600, fb - fy);
  c.save();
  c.beginPath();
  for (let k = -16; k <= 16; k++) { const xn = vx + k * 150; c.moveTo(vx + (xn - vx) * 0.45, fy); c.lineTo(xn, fb); }
  c.lineWidth = 3; c.strokeStyle = 'rgba(50,25,10,0.3)'; c.stroke();
  for (let r = 1; r < 6; r++) { const yy = fy + (fb - fy) * Math.pow(r / 6, 1.6); line(c, -300, yy, W + 300, yy, 'rgba(50,25,10,0.12)', 2); }
  c.restore();
  // floor sheen + wall/floor ambient occlusion
  glowE(c, W / 2, fy + 70, 900, 60, 'rgba(255,230,200,0.18)');
  fillGrad(c, 0, fy - 60, 0, fy + 30, [[0, 'rgba(10,5,30,0)'], [0.7, 'rgba(10,5,30,0.35)'], [1, 'rgba(10,5,30,0)']], -300, fy - 60, W + 600, 90);
  line(c, -300, fy, W + 300, fy, 'rgba(20,10,40,0.6)', 5);
  cel(c, pRRect(-300, fy - 26, W + 600, 26, 0), o.base || '#3a2a70', { d: 0, lw: 0 });
}
function roundWindow(c, x, y, r, t, o = {}) {
  // moonbeam into the room
  if (o.beam !== false) lightShaft(c, x - r * 0.7, y, x + r * 0.7, x + r * 0.9 + 260, (o.floorY || 820) + 40, x - r * 0.7 + 460, '#c8c0ff', 0.14);
  const fr = pEllipse(x, y, r + 20, r + 20);
  const fg = c.createLinearGradient(x - r, y - r, x + r, y + r); fg.addColorStop(0, '#dca070'); fg.addColorStop(1, '#8a5a38');
  cel(c, fr, fg, { shadow: '#6a4028', d: 8, line: '#3a2010', lw: 6 });
  c.save(); circle(c, x, y, r); c.clip();
  nightSky(c, t, x - r, y - r, r * 2, r * 2, { stars: 22, noShoot: true, clouds: false, milky: false });
  if (o.moon !== false) drawMoon(c, x + r * 0.2, y - r * 0.1, r / 170, { t, face: o.moonFace || 'sleepy', shades: o.shades });
  c.globalCompositeOperation = 'lighter';
  c.beginPath(); c.moveTo(x - r, y - r * 0.2); c.lineTo(x - r * 0.2, y - r); c.lineTo(x + r * 0.05, y - r); c.lineTo(x - r, y + r * 0.05); c.closePath();
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fill();
  c.restore();
  circle(c, x, y, r); fs(c, null, '#3a2010', 6);
  line(c, x - r, y, x + r, y, '#a8744a', 10); line(c, x, y - r, x, y + r, '#a8744a', 10);
}
function bookshelf(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  groundShadow(c, 0, 0, 190, 26, 0.35);
  cel(c, pRRect(-150, -420, 300, 420, 10), '#8a5a3a', { shadow: '#6a4028', d: 10, line: '#3a2010', lw: 6 });
  for (let r = 0; r < 3; r++) {
    const sy = -400 + r * 136;
    rrect(c, -134, sy, 268, 116, 4); c.fillStyle = '#4a2e20'; c.fill();
    let bx = -128;
    for (let k = 0; bx < 116; k++) {
      const bw = 22 + rnd(k + r * 20, 101) * 22, bh = 80 + rnd(k + r * 20, 102) * 30;
      const col = ['#ff8fc7', '#8fe3b0', '#b59cff', '#ffd166', '#6fb7ff'][(k + r) % 5];
      const bp = pRRect(bx, sy + 116 - bh, bw, bh, 4);
      const bg = c.createLinearGradient(bx, 0, bx + bw, 0); bg.addColorStop(0, lighten(col, 0.2)); bg.addColorStop(1, darken(col, 0.12));
      cel(c, bp, bg, { shadow: false, line: lineOf(col), lw: 3 });
      line(c, bx + 3, sy + 116 - bh + 16, bx + bw - 3, sy + 116 - bh + 16, rgba(lighten(col, 0.5), 0.8), 3);
      bx += bw + 2;
    }
    const sh = c.createLinearGradient(0, sy, 0, sy + 30); sh.addColorStop(0, 'rgba(0,0,0,0.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sh; c.fillRect(-134, sy, 268, 30);
    line(c, -134, sy + 116, 134, sy + 116, '#3a2010', 7);
    line(c, -134, sy + 112, 134, sy + 112, 'rgba(255,220,180,0.35)', 2);
  }
  c.restore();
}
function drawAltar(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  groundShadow(c, 0, 0, 230, 30, 0.4);
  cel(c, pRRect(-160, -160, 22, 160, 6), '#7a4f33', { d: 5 }); cel(c, pRRect(138, -160, 22, 160, 6), '#7a4f33', { d: 5 });
  cel(c, pRRect(-200, -190, 400, 40, 12), '#b07a52', { d: 7, hi: '#d8a070' });
  const cloth = new Path2D(); cloth.moveTo(-170, -192); cloth.lineTo(170, -192); cloth.lineTo(160, -90);
  for (let k = 0; k < 6; k++) cloth.quadraticCurveTo(160 - (k + 0.5) * 53, -70, 160 - (k + 1) * 53, -90);
  cloth.closePath();
  const cg = c.createLinearGradient(0, -192, 0, -80); cg.addColorStop(0, '#8a5ae6'); cg.addColorStop(1, '#5a34b0');
  cel(c, cloth, cg, { shadow: '#4a2a98', d: 10, line: '#241250' });
  c.save(); c.clip(cloth); for (let k = 0; k < 6; k++) line(c, -140 + k * 56, -180, -150 + k * 56, -84, 'rgba(20,8,60,0.25)', 6); c.restore();
  c.beginPath(); c.moveTo(160, -100); for (let k = 0; k < 6; k++) c.quadraticCurveTo(160 - (k + 0.5) * 53, -80, 160 - (k + 1) * 53, -100); fs(c, null, '#ffd166', 5);
  softStar(c, 0, -140, 26); const sg = c.createLinearGradient(0, -166, 0, -114); sg.addColorStop(0, '#fff3b0'); sg.addColorStop(1, '#e0a030'); fs(c, sg, '#7a5010', 4);
  if (o.shine) {
    for (let k = 0; k < 5; k++) { const ph = (t * 1.5 + k / 5) % 1; sparkle(c, -160 + rnd(k, 111) * 320, -200 - ph * 90, 14 * Math.sin(ph * Math.PI) * o.shine + 2, '#fff', 0); }
    c.save(); c.globalAlpha = 0.35 * o.shine; rrect(c, -200, -190, 400, 12, 6); c.fillStyle = '#fff'; c.fill(); c.restore();
    glowE(c, 0, -190, 240, 40, 'rgba(255,255,255,0.5)', o.shine);
  }
  c.restore();
}
function drawDoor(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  cel(c, pRRect(-110, -400, 220, 400, 18), '#5a3a2a', { d: 6, line: '#2a1408' });
  const open = o.open || 0;
  if (open > 0) {
    c.save(); rrect(c, -98, -388, 196, 388, 10); c.clip();
    fillGrad(c, 0, -388, 0, 0, [[0, '#fff0b8'], [1, '#ffbf66']], -98, -388, 196, 388);
    glow(c, 0, -200, 260, 'rgba(255,230,160,0.7)');
    c.restore();
    lightShaft(c, -98, 0, 98 - open * 100, -220, 120, 260, '#ffe6a0', 0.25 * open);
  }
  c.save(); c.translate(-98, 0); c.scale(1 - open * 0.55, 1);
  const dg = c.createLinearGradient(0, 0, 196, 0); dg.addColorStop(0, '#c89060'); dg.addColorStop(1, '#a06a40');
  cel(c, pRRect(0, -388, 196, 388, 10), dg, { shadow: '#8a5a34', d: 8, line: '#3a1e0a' });
  for (const [py, ph] of [[-350, 130], [-190, 150]]) { cel(c, pRRect(26, py, 144, ph, 10), '#b07a4c', { shadow: '#8a5a34', d: -6, lw: 3.5, line: '#5a3418' }); }
  const kg = c.createRadialGradient(166, -194, 2, 170, -190, 13); kg.addColorStop(0, '#fff6c8'); kg.addColorStop(1, '#d09020');
  circle(c, 170, -190, 12); fs(c, kg, '#6a4010', 4);
  c.restore();
  if (o.sign) { c.save(); c.rotate(Math.sin(t * 2) * 0.06); cel(c, pRRect(-60, -470, 120, 50, 12), '#fff6e0', { d: 4, line: '#6a4a3a' }); txt(c, 'HOME', 0, -444, { size: 28, font: DISPLAY, weight: 400, fill: '#ff6f9f', stroke: false, shadow: false }); c.restore(); }
  c.restore();
}
function ritualWheel(c, x, y, rx, ry, t, glowAmt = 0.5) {
  c.save(); c.translate(x, y);
  glowE(c, 0, 0, rx * 1.35, ry * 1.6, `rgba(180,140,255,${0.45 * glowAmt})`);
  c.scale(1, ry / rx);
  c.rotate(t * 0.3);
  const drawLines = () => {
    c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.moveTo(rx * 0.72, 0); c.arc(0, 0, rx * 0.72, 0, TAU);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; c.moveTo(0, 0); c.lineTo(Math.cos(a) * rx, Math.sin(a) * rx); }
  };
  drawLines(); c.lineWidth = 22; c.strokeStyle = `rgba(190,160,255,${0.18 + 0.2 * glowAmt})`; c.stroke();
  drawLines(); c.lineWidth = 6; c.strokeStyle = 'rgba(245,240,255,0.9)'; c.stroke();
  softStar(c, 0, 0, rx * 0.3, 7, 0, 0.6); c.lineWidth = 5; c.stroke();
  for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; c.save(); c.translate(Math.cos(a) * rx * 0.86, Math.sin(a) * rx * 0.86); c.rotate(a); c.beginPath(); c.moveTo(-8, -8); c.lineTo(8, 8); c.moveTo(8, -8); c.lineTo(-8, 8); c.lineWidth = 3; c.stroke(); c.restore(); }
  c.restore();
}

function kitchenBg(c, t, o = {}) {
  fillGrad(c, 0, 0, 0, H, [[0, '#ffe9d0'], [1, '#ffd2b4']], -300, -300, W + 600, H + 600);
  c.save(); c.globalAlpha = 0.55;
  for (let yy = 0; yy < 6; yy++) for (let xx = -2; xx < 24; xx++) {
    const tp = pRRect(-200 + xx * 100, 380 + yy * 60, 96, 56, 8);
    c.fillStyle = (xx + yy) % 2 ? '#ffffff' : '#ffe9f2'; c.fill(tp);
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(-190 + xx * 100, 384 + yy * 60, 30, 5);
  }
  c.restore();
  // window at night with curtains
  cel(c, pRRect(700, 90, 520, 280, 20), '#c48a5a', { shadow: '#8a5a34', d: 8, line: '#3a2010' });
  c.save(); rrect(c, 718, 108, 484, 244, 12); c.clip(); nightSky(c, t, 700, 90, 520, 280, { stars: 30, noShoot: true, clouds: false }); drawMoon(c, 1100, 180, 0.42, { t, face: o.moonFace || 'smile' }); c.restore();
  line(c, 960, 108, 960, 352, '#c48a5a', 12);
  for (const sd of [-1, 1]) {
    const cur = new Path2D(); const cx = sd < 0 ? 690 : 1230;
    cur.moveTo(cx, 70); cur.lineTo(cx - sd * 90, 70); cur.quadraticCurveTo(cx - sd * 40, 220, cx - sd * 70, 380); cur.lineTo(cx, 380); cur.closePath();
    cel(c, cur, '#ff9ecf', { shadow: '#e57aaa', d: 8, line: '#8a2a5a' });
  }
  line(c, 640, 70, 1280, 70, '#8a5a3a', 8);
  for (let k = 0; k < 3; k++) {
    for (const bx of [60 + k * 200, 1300 + k * 200]) {
      const cb = pRRect(bx, 80, 180, 240, 16);
      const g = c.createLinearGradient(bx, 80, bx + 180, 320); g.addColorStop(0, '#a4e6d4'); g.addColorStop(1, '#78c9b2');
      cel(c, cb, g, { shadow: '#62b09a', d: 10, line: '#2a6a5a' });
      rrect(c, bx + 18, 100, 144, 200, 10); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.stroke();
      const kx = bx < 960 ? bx + 150 : bx + 30;
      circle(c, kx, 280, 8); fs(c, '#ffd166', '#8a5a10', 3); circle(c, kx - 2, 278, 2.5); c.fillStyle = '#fff'; c.fill();
    }
  }
  // counter
  const ctr = pRRect(-100, 600, W + 200, 40, 6);
  cel(c, ctr, '#ff9ecf', { d: 5, hi: '#ffc2dc', line: '#8a2a5a' });
  const lower = new Path2D(); lower.rect(-100, 640, W + 200, 200);
  c.fillStyle = '#8fd3c0'; c.fill(lower);
  for (let k = 0; k < 10; k++) { cel(c, pRRect(-60 + k * 210, 660, 190, 160, 14), '#a4e0cf', { shadow: '#82c8b4', d: 8, line: '#2a6a5a', lw: 4 }); circle(c, -60 + k * 210 + 95, 690, 7); fs(c, '#ffd166', '#8a5a10', 3); }
  // perspective checker floor
  c.save();
  c.beginPath(); c.rect(-300, 840, W + 600, 500); c.clip();
  const vx = W / 2, rows = [840, 880, 930, 995, 1075, 1170];
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r], y1 = rows[r + 1];
    const k0 = (y0 - 700) / 380, k1 = (y1 - 700) / 380;
    for (let q = -14; q < 14; q++) {
      c.beginPath();
      c.moveTo(vx + q * 150 * k0, y0); c.lineTo(vx + (q + 1) * 150 * k0, y0); c.lineTo(vx + (q + 1) * 150 * k1, y1); c.lineTo(vx + q * 150 * k1, y1); c.closePath();
      c.fillStyle = (q + r) % 2 ? '#fff6e6' : '#b9a2ff'; c.fill();
    }
  }
  fillGrad(c, 0, 840, 0, 940, [[0, 'rgba(40,20,60,0.3)'], [1, 'rgba(40,20,60,0)']], -300, 840, W + 600, 100);
  c.restore();
  line(c, -300, 840, W + 300, 840, '#5a3a6a', 5);
}
function kitchenLamp(c, x, y, t, o = {}) {
  const sw = o.swing ? Math.sin(t * 2.2) * 0.12 : 0;
  c.save(); c.translate(x, -20); c.rotate(sw);
  const L = y + 20;
  line(c, 0, 0, 0, L, '#3a2a55', 5);
  if (o.cone !== false) {
    lightShaft(c, -60, L + 40, 60, -520, L + 900, 520, '#ffe4a0', 0.36 * (o.bright ?? 1));
    motes(c, t, 26, -260, L + 120, 520, 600, 23, 'rgba(255,245,210,0.6)', 1);
  }
  const shade = new Path2D(); shade.moveTo(-90, L + 50); shade.quadraticCurveTo(-80, L - 20, 0, L - 24); shade.quadraticCurveTo(80, L - 20, 90, L + 50); shade.closePath();
  const sg = c.createLinearGradient(-90, 0, 90, 0); sg.addColorStop(0, '#ff9ab8'); sg.addColorStop(0.5, '#ff6f9f'); sg.addColorStop(1, '#d64a7a');
  cel(c, shade, sg, { shadow: '#b83a6a', d: 8, line: '#6a1a3a', hi: 'rgba(255,255,255,0.3)' });
  ellipse(c, 0, L + 52, 34, 16); fs(c, '#fff8d0', '#8a6a3a', 4);
  glow(c, 0, L + 60, 220, 'rgba(255,240,170,0.6)');
  c.restore();
  glowE(c, x, 880, 520, 70, 'rgba(255,230,160,0.45)', o.bright ?? 1);
}

function cafeBg(c, t) {
  fillGrad(c, 0, 0, 0, H, [[0, '#ffd9ea'], [1, '#ffc2da']], -300, -300, W + 600, H + 600);
  cel(c, pRRect(360, 70, 1200, 520, 30), '#ffffff', { shadow: '#f2dce8', d: 8, line: '#a06a8a' });
  c.save(); rrect(c, 380, 90, 1160, 480, 22); c.clip();
  fillGrad(c, 0, 90, 0, 570, [[0, '#6cc2ff'], [1, '#d4f2ff']], 380, 90, 1160, 480);
  glow(c, 1380, 170, 360, 'rgba(255,248,200,0.95)');
  const sg = c.createRadialGradient(1370, 160, 6, 1380, 170, 70); sg.addColorStop(0, '#fffbe0'); sg.addColorStop(1, '#ffd84a');
  circle(c, 1380, 170, 70); fs(c, sg, '#d09a20', 5);
  for (let k = 0; k < 4; k++) { const cx = ((t * 30 + k * 400) % 1500) + 300; cloudPath(c, cx, 200 + k * 70, 170, 60, 7, k); const cg = c.createLinearGradient(0, 170 + k * 70, 0, 240 + k * 70); cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, '#e2eeff'); fs(c, cg, '#8aa8d0', 4); }
  c.restore();
  line(c, 960, 90, 960, 570, '#fff', 14);
  line(c, 380, 330, 1540, 330, '#fff', 14);
  // sunbeams
  lightShaft(c, 420, 90, 900, 700, 1080, 1500, '#fff2c0', 0.2);
  lightShaft(c, 980, 90, 1500, 1300, 1080, 1980, '#fff2c0', 0.16);
  for (let k = 0; k < 16; k++) {
    const bx = 120 + k * 110, by = 40 + Math.sin(k / 15 * Math.PI) * 30;
    const p = new Path2D(); p.moveTo(bx, by); p.lineTo(bx + 90, by); p.lineTo(bx + 45, by + 60 + Math.sin(t * 3 + k) * 5); p.closePath();
    cel(c, p, ['#ffd166', '#8fe3b0', '#6fb7ff', '#b59cff'][k % 4], { d: 5, lw: 4 });
  }
  line(c, 100, 40, 1860, 40, '#8a5a6a', 3);
  for (const px of [150, 1770]) {
    groundShadow(c, px, 632, 90, 16, 0.35);
    cel(c, pRRect(px - 60, 520, 120, 110, 16), '#ff9ecf', { d: 8, hi: '#ffc2dc' });
    for (let k = 0; k < 5; k++) { c.save(); c.translate(px, 520); c.rotate(-1 + k * 0.5 + Math.sin(t * 2 + k) * 0.05); const lf = pEllipse(0, -80, 26, 70); const lg = c.createLinearGradient(0, -150, 0, -10); lg.addColorStop(0, '#9af0bc'); lg.addColorStop(1, '#4fb880'); cel(c, lf, lg, { shadow: '#3f9f70', d: 6, line: '#1f5a40', lw: 4 }); line(c, 0, -20, 0, -140, 'rgba(30,90,60,0.5)', 3); c.restore(); }
  }
  fillGrad(c, 0, 640, 0, H, [[0, '#ffe7a8'], [1, '#ffd58a']], -300, 640, W + 600, 800);
  glowE(c, 1150, 800, 700, 110, 'rgba(255,250,210,0.45)');
  line(c, -300, 640, W + 300, 640, '#b07a4a', 6);
  bokeh(c, t, 10, 380, 90, 1160, 460, ['#ffffff', '#fff2c0', '#ffd6ec'], 57, 1, 0.35);
}
function brunchTable(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  groundShadow(c, 0, 330, 520, 40, 0.3);
  line(c, -420, 40, -420, 340, '#6a4020', 14); line(c, 420, 40, 420, 340, '#6a4020', 14);
  const top = pRRect(-500, -20, 1000, 60, 20);
  c.save(); c.clip(top); for (let k = 0; k < 20; k++) { c.fillStyle = k % 2 ? '#ff9ecf' : '#fff'; c.fillRect(-500 + k * 50, -20, 50, 60); } c.fillStyle = 'rgba(120,20,70,0.15)'; c.fillRect(-500, 20, 1000, 20); c.restore();
  c.lineWidth = 6; c.strokeStyle = '#8a2a5a'; c.stroke(top);
  const hop2 = o.hop || 0;
  c.save(); c.translate(-40, -20 + hop2);
  groundShadow(c, 0, 4, 190, 26, 0.25);
  cel(c, pEllipse(0, 0, 170, 34), '#ffffff', { shadow: '#e8e2f2', d: 6, line: '#8a7aa8' });
  for (let k = 0; k < 4; k++) {
    const sq = o.sq || 1;
    const pc = pRRect(-130, -30 - k * 38 * sq, 260, 40 * sq, 20);
    const pg = c.createLinearGradient(0, -30 - k * 38 * sq, 0, 10 - k * 38 * sq); pg.addColorStop(0, '#ffd08a'); pg.addColorStop(1, '#e09a48');
    cel(c, pc, pg, { shadow: '#c9822e', d: 6, line: '#7a3f10' });
    line(c, -120, -12 - k * 38 * sq, 120, -12 - k * 38 * sq, '#c9822e', 3);
  }
  const topY = -30 - 3 * 38 * (o.sq || 1);
  const sy = new Path2D(); sy.moveTo(-120, topY + 10); sy.quadraticCurveTo(0, topY - 30, 120, topY + 10); sy.quadraticCurveTo(110, topY + 70, 90, topY + 90); sy.quadraticCurveTo(80, topY + 40, 40, topY + 30); sy.quadraticCurveTo(0, topY + 100, -30, topY + 30); sy.quadraticCurveTo(-80, topY + 60, -120, topY + 10); sy.closePath();
  cel(c, sy, '#b8621b', { d: 5, hi: '#e89a50', line: '#5a2a08' });
  ellipse(c, -40, topY + 4, 26, 6, -0.1); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fill();
  cel(c, pRRect(-30, topY - 22, 60, 30, 8), '#fff3a8', { d: 4, hi: '#ffffff', line: '#9a7a20' });
  for (const [bx, by, r] of [[60, topY - 16, 16], [-64, topY - 12, 14]]) { cel(c, pEllipse(bx, by, r, r), '#ff5a7a', { d: 4, hi: '#ff9aae', line: '#8a1a3a' }); line(c, bx, by - r, bx + 3, by - r - 8, '#3f9f70', 4); }
  c.restore();
  for (const [mx, col] of [[-330, '#8fe3b0'], [300, '#b59cff']]) {
    cel(c, pRRect(mx - 44, -110, 88, 90, 20), col, { d: 8, hi: lighten(col, 0.3) });
    c.beginPath(); c.arc(mx + 48, -66, 20, -1.3, 1.3); fs(c, null, lineOf(col), 7);
    for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(mx - 12 + k * 24, -120); c.quadraticCurveTo(mx - 26 + k * 24, -150 + Math.sin(t * 4 + k) * 6, mx - 8 + k * 24, -180); fs(c, null, 'rgba(255,255,255,0.8)', 5); }
  }
  const jg = c.createLinearGradient(430, 0, 490, 0); jg.addColorStop(0, '#ffd58a'); jg.addColorStop(1, '#ff9f3a');
  rrect(c, 430, -150, 60, 130, 14); fs(c, jg, '#8a4a10', 5); line(c, 440, -140, 440, -40, 'rgba(255,255,255,0.6)', 4); line(c, 470, -190, 452, -120, '#ff6f9f', 8);
  c.restore();
}

function bedroomBg(c, t) {
  roomBg(c, t, { wall1: '#2a2466', wall2: '#433a8c', floorY: 860, floor1: '#6a4a3a', floor2: '#8a6048' });
  roundWindow(c, 1500, 330, 170, t, { moonFace: 'sleepy', floorY: 860 });
  groundShadow(c, 860, 900, 560, 50, 0.4);
  cel(c, pRRect(360, 520, 60, 380, 16), '#c48a5a', { shadow: '#9a6a40', d: 8, line: '#3a2010' });
  cel(c, pRRect(360, 700, 1000, 160, 30), '#ffe9f3', { shadow: '#f0cfe0', d: 10, line: '#8a5a7a' });
  cel(c, pRRect(1310, 640, 50, 260, 16), '#c48a5a', { shadow: '#9a6a40', d: 8, line: '#3a2010' });
  groundShadow(c, 1650, 880, 120, 18, 0.35);
  cel(c, pRRect(1560, 700, 180, 180, 16), '#c48a5a', { shadow: '#9a6a40', d: 10, line: '#3a2010' });
  glow(c, 1650, 600, 320, 'rgba(255,220,140,0.6)');
  line(c, 1650, 700, 1650, 620, '#3a2a55', 6);
  const sh = new Path2D(); sh.moveTo(1590, 630); sh.lineTo(1710, 630); sh.lineTo(1680, 550); sh.lineTo(1620, 550); sh.closePath();
  cel(c, sh, '#ffd166', { d: 6, hi: '#fff0b0', line: '#8a5a10' });
}
function quilt(c, x, y, w, h, t) {
  c.save();
  const p = new Path2D(); p.moveTo(x, y + 20); p.quadraticCurveTo(x + w / 2, y - 40 + Math.sin(t * 1.6) * 6, x + w, y + 10); p.lineTo(x + w + 20, y + h); p.lineTo(x - 20, y + h); p.closePath();
  const g = c.createLinearGradient(0, y - 40, 0, y + h); g.addColorStop(0, '#a8c8ff'); g.addColorStop(1, '#6f96e8');
  cel(c, p, g, { shadow: '#5a80d0', d: 12, line: '#22408a' });
  c.save(); c.clip(p);
  for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 12; xx++) { if ((xx + yy) % 2) { rrect(c, x + xx * 90 - 20, y + yy * 60 - 10, 90, 60, 6); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fill(); } }
  c.setLineDash([8, 8]); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.45)';
  for (let yy = 1; yy < 4; yy++) { c.beginPath(); c.moveTo(x - 20, y + yy * 60 - 10); c.lineTo(x + w + 20, y + yy * 60 - 10); c.stroke(); }
  c.setLineDash([]);
  c.restore();
  c.restore();
}

/* thought bubble: runs fn() clipped inside a cloud */
function thought(c, x, y, w, h, t, p, fn, tail = [0, 0]) {
  if (p <= 0) return;
  c.save();
  c.translate(x, y); c.scale(p, p); c.translate(-x, -y);
  c.save(); c.translate(10, 14); cloudPath(c, x, y, w, h, 11, 3); c.fillStyle = 'rgba(20,10,50,0.25)'; c.fill(); c.restore();
  for (let k = 0; k < 3; k++) { circle(c, lerp(tail[0], x - w * 0.25, (k + 1) / 4), lerp(tail[1], y + h * 0.45, (k + 1) / 4), 14 + k * 10); fs(c, '#fff', '#6a5a9a', 5); }
  cloudPath(c, x, y, w, h, 11, 3); fs(c, '#fff', null);
  c.save(); cloudPath(c, x, y, w * 0.97, h * 0.95, 11, 3); c.clip(); fn(); c.restore();
  cloudPath(c, x, y, w, h, 11, 3); fs(c, null, '#6a5a9a', 7);
  c.restore();
}
function neighborhood(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const cols = ['#ff9ecf', '#8fe3b0', '#ffd166', '#6fb7ff', '#b59cff', '#ffb347'];
  for (let k = 0; k < 6; k++) {
    const hx = -500 + k * 190, gone = o.gone ? clamp((o.gone - k * 0.08) * 1.4) : 0;
    if (gone >= 1) continue;
    c.save(); c.translate(hx, 0);
    c.translate(0, -gone * 60); c.rotate(gone * 2); c.scale(1 - gone, 1 - gone);
    groundShadow(c, 0, 0, 90, 14, 0.3);
    cel(c, pRRect(-70, -140, 140, 140, 10), cols[k], { d: 9, hi: lighten(cols[k], 0.25) });
    const r = new Path2D(); r.moveTo(-86, -130); r.lineTo(0, -210); r.lineTo(86, -130); r.closePath();
    cel(c, r, ['#6a5acd', '#c77d7d', '#3f9f78'][k % 3], { d: 8 });
    const wg = c.createRadialGradient(-28, -92, 2, -28, -92, 26); wg.addColorStop(0, '#fff8d0'); wg.addColorStop(1, '#ffc966');
    rrect(c, -46, -110, 36, 36, 6); fs(c, wg, '#5a3a2a', 4); glow(c, -28, -92, 50, 'rgba(255,220,130,0.5)');
    cel(c, pRRect(12, -80, 36, 80, 6), '#8a5a3a', { d: 4, lw: 4 });
    c.restore();
    if (k < 5 && !gone) { line(c, hx + 95, -26, hx + 95, 0, '#6a4020', 8); cel(c, pEllipse(hx + 95, -60, 34, 34), '#6fcf97', { d: 7, hi: '#a0f0c0' }); }
  }
  c.restore();
}
function bigTentacle(c, x, y, h, t, rise, o = {}) {
  if (rise <= 0) return;
  c.save(); c.translate(x, y);
  const N = 22, L = [], R = [], M = [];
  const top = h * rise;
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const a = Math.sin(t * 2 + u * 3) * 0.3 * u + (o.curl || 0) * u * u * 3.2;
    const px = Math.sin(u * 2.2 + t) * 60 * u + Math.sin(a) * top * u * 0.3;
    const py = -top * u;
    const w = 120 * (1 - u * 0.8);
    L.push([px - w, py]); R.push([px + w, py]); M.push([px - w * 0.35, py]);
  }
  const p = new Path2D(); p.moveTo(L[0][0], L[0][1]);
  L.forEach((q) => p.lineTo(q[0], q[1]));
  const tp = R[N]; p.quadraticCurveTo(tp[0] + 30, tp[1] - 40, tp[0], tp[1]);
  for (let k = N; k >= 0; k--) p.lineTo(R[k][0], R[k][1]);
  p.closePath();
  const g = c.createLinearGradient(-120, 0, 120, 0); g.addColorStop(0, '#8fe3b0'); g.addColorStop(1, '#4fb07e');
  cel(c, p, g, { shadow: '#3f9f70', d: 14, line: CTH.line, lw: 8 });
  c.save(); c.clip(p); c.beginPath(); M.forEach(([mx, my], k) => (k ? c.lineTo(mx, my) : c.moveTo(mx, my))); c.lineWidth = 40; c.strokeStyle = 'rgba(220,255,235,0.35)'; c.lineCap = 'round'; c.stroke(); c.restore();
  for (let k = 2; k < N - 2; k += 2) { const a = L[k], b2 = R[k]; cel(c, pEllipse(lerp(a[0], b2[0], 0.25), a[1], 24 * (1 - k / N) + 6, 18 * (1 - k / N) + 5), '#dcf9e8', { d: 3, lw: 3, line: CTH.line }); }
  c.restore();
}

/* ---------------- misc props ---------------- */
function paperStack(c, x, y, s, t, fly = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  groundShadow(c, 0, 4, 150, 16, 0.3);
  for (let k = 0; k < 7; k++) {
    const f = fly * (0.5 + rnd(k, 121));
    c.save(); c.translate(Math.sin(t * 3 + k) * 40 * f + (rnd(k, 122) - 0.5) * 20, -k * 14 - f * 120 * rnd(k, 123)); c.rotate((rnd(k, 124) - 0.5) * 0.3 + Math.sin(t * 4 + k) * f);
    cel(c, pRRect(-130, -10, 260, 16, 3), k % 3 ? '#ffffff' : '#fff3d6', { d: 3, lw: 3.5, line: '#8a7aa8' });
    c.restore();
  }
  c.restore();
}
function giftBox(c, x, y, s, t, lid = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  groundShadow(c, 0, 0, 160, 24, 0.35);
  const bg = c.createLinearGradient(-130, 0, 130, 0); bg.addColorStop(0, '#8fcaff'); bg.addColorStop(1, '#4f98e8');
  cel(c, pRRect(-130, -180, 260, 180, 14), bg, { shadow: '#3f80d0', d: 12, line: '#1a3f7a' });
  cel(c, pRRect(-20, -180, 40, 180, 0), '#ff6f9f', { d: 0, lw: 4 });
  c.save(); c.translate(0, -180 - lid * 160); c.rotate(-lid * 0.6);
  cel(c, pRRect(-145, -40, 290, 44, 14), '#a8d6ff', { shadow: '#7ab8f0', d: 6, line: '#1a3f7a' });
  cel(c, pRRect(-20, -40, 40, 44, 0), '#ff6f9f', { d: 0, lw: 4 });
  cel(c, pEllipse(-40, -56, 40, 22, -0.4), '#ff6f9f', { d: 6, hi: '#ffa0c0' }); cel(c, pEllipse(40, -56, 40, 22, 0.4), '#ff6f9f', { d: 6, hi: '#ffa0c0' }); cel(c, pEllipse(0, -48, 14, 14), '#ff6f9f', { d: 3 });
  c.restore();
  c.restore();
}
function planBoard(c, x, y, s, t, reveal = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  line(c, -150, 0, -110, -380, '#6a4020', 14); line(c, 150, 0, 110, -380, '#6a4020', 14);
  cel(c, pRRect(-230, -480, 460, 330, 16), '#ffffff', { shadow: '#ece6f6', d: 8, line: '#6a5a8a' });
  txt(c, 'THE PLAN', 0, -440, { size: 44, font: DISPLAY, weight: 400, fill: '#ff6f9f', lw: 8, stroke: '#7a1f4a' });
  const steps = ['1. chant nicely', '2. wake the big guy', '3. ???'];
  steps.forEach((st, k) => { if (reveal > k / 3) txt(c, st, -190, -380 + k * 70, { size: 38, align: 'left', fill: '#2a1b3d', stroke: false, weight: 600 }); });
  if (reveal > 0.66) { c.save(); c.translate(150, -250); c.scale(0.28, 0.28); drawCthulhu(c, 0, 0, 1, { t, mood: 'sleep', noShadow: true }); c.restore(); }
  c.restore();
}
function welcomeMat(c, x, y, s, t, kind = 'tentacle') {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (kind === 'tentacle') {
    const p = new Path2D(); p.moveTo(-260, 0);
    p.bezierCurveTo(-260, -70, 120, -90, 220, -50);
    p.bezierCurveTo(300, -20, 300, 40, 240, 40);
    p.bezierCurveTo(200, 40, 200, 0, 230, 0);
    p.bezierCurveTo(160, 40, -200, 60, -260, 0); p.closePath();
    cel(c, p, '#62c795', { shadow: '#4aa878', d: 8, line: CTH.line, hi: '#9aeac0' });
    for (let k = 0; k < 6; k++) cel(c, pEllipse(-180 + k * 70, 10 - k * 4, 12, 10), '#dcf9e8', { d: 2, lw: 3, line: CTH.line });
    txt(c, 'WELCOME', -20, -26, { size: 40, font: DISPLAY, weight: 400, fill: '#fff6e0', lw: 8, rot: -0.05, stroke: CTH.line });
  } else {
    cel(c, pRRect(-240, -60, 480, 110, 26), '#ffd166', { shadow: '#e8b03a', d: 8, hi: '#fff0b0' });
    for (let k = 0; k < 5; k++) { const fx = -190 + k * 95; circle(c, fx, 26, 10); c.fillStyle = '#ff9ecf'; c.fill(); }
    txt(c, 'hello :)', 0, -8, { size: 46, font: DISPLAY, weight: 400, fill: '#ff6f9f', lw: 8, stroke: '#7a1f4a' });
  }
  c.restore();
}
function phoneCall(c, x, y, s, t, p = 1, declined = 0) {
  c.save(); c.translate(x + Math.sin(t * 50) * 5 * (1 - declined) * p, y); c.rotate(Math.sin(t * 40) * 0.03 * (1 - declined)); c.scale(s * p, s * p);
  c.save(); c.translate(14, 18); rrect(c, -200, -380, 400, 760, 50); c.fillStyle = 'rgba(10,5,30,0.35)'; c.fill(); c.restore();
  const bodyG = c.createLinearGradient(-200, -380, 200, 380); bodyG.addColorStop(0, '#5a5a80'); bodyG.addColorStop(1, '#2a2a44');
  rrect(c, -200, -380, 400, 760, 50); fs(c, bodyG, '#12121e', 7);
  c.save(); rrect(c, -176, -350, 352, 700, 30); c.clip();
  fillGrad(c, 0, -350, 0, 350, [[0, '#3a78cc'], [1, '#101f55']], -176, -350, 352, 700);
  bubblesFx(c, t, 10, -176, -350, 352, 700, { speed: 60, r: 10 });
  c.beginPath(); c.moveTo(-176, -350); c.lineTo(-20, -350); c.lineTo(-176, -40); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.07)'; c.fill();
  c.restore();
  txt(c, 'incoming call', 0, -270, { size: 30, fill: '#cfe8ff', stroke: false, weight: 500 });
  txt(c, 'THE DEEP', 0, -215, { size: 50, font: DISPLAY, weight: 400, fill: '#fff', lw: 8, stroke: '#12204a' });
  glow(c, 0, -50, 150, 'rgba(143,227,176,0.45)');
  circle(c, 0, -50, 92); fs(c, '#8fe3b0', CTH.line, 6);
  c.save(); circle(c, 0, -50, 88); c.clip(); c.translate(0, -50); c.scale(0.36, 0.36); c.translate(0, 190); drawCthulhu(c, 0, 0, 1, { t, mood: 'sleep', cap: true, noShadow: true }); c.restore();
  const pulse = 1 + Math.sin(t * 8) * 0.06;
  c.save(); c.translate(-90, 230); c.scale(declined ? 1.25 : 1, declined ? 1.25 : 1); circle(c, 0, 0, 52); fs(c, '#ff5a6a', '#6a1020', 6); txt(c, '✕', 0, 2, { size: 44, fill: '#fff', stroke: false, font: 'sans-serif', weight: 700 }); c.restore();
  c.save(); c.translate(90, 230); c.scale(pulse, pulse); glow(c, 0, 0, 90, 'rgba(80,220,140,0.5)'); circle(c, 0, 0, 52); fs(c, '#4fd08a', '#0f5a30', 6); txt(c, '✆', 0, 2, { size: 50, fill: '#fff', stroke: false, font: 'sans-serif', weight: 700 }); c.restore();
  txt(c, 'decline', -90, 310, { size: 26, fill: '#fff', stroke: false }); txt(c, 'answer', 90, 310, { size: 26, fill: '#fff', stroke: false });
  if (declined > 0) { c.save(); c.globalAlpha = declined; rrect(c, -176, -350, 352, 700, 30); c.fillStyle = 'rgba(20,10,40,0.72)'; c.fill(); txt(c, 'call declined', 0, 0, { size: 44, font: DISPLAY, weight: 400, fill: '#ff9ecf', lw: 8, stroke: '#4a1030' }); txt(c, '(politely)', 0, 60, { size: 34, fill: '#fff', lw: 6 }); c.restore(); }
  c.restore();
}
function earth(c, x, y, r, t, spin = 1, dizzy = 0) {
  c.save(); c.translate(x, y);
  glow(c, 0, 0, r * 1.5, 'rgba(120,190,255,0.35)');
  const body = pEllipse(0, 0, r, r);
  const eg = c.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r); eg.addColorStop(0, '#7cc8ff'); eg.addColorStop(1, '#2f7ad8');
  c.fillStyle = eg; c.fill(body);
  c.save(); c.clip(body);
  for (let k = 0; k < 5; k++) {
    const px = ((t * spin * 200 + k * r * 0.9) % (r * 4.5)) - r * 2.2;
    c.beginPath(); c.ellipse(px, (rnd(k, 131) - 0.5) * r * 1.2, r * (0.3 + rnd(k, 132) * 0.25), r * (0.2 + rnd(k, 133) * 0.2), rnd(k, 134), 0, TAU);
    c.fillStyle = '#6fcf97'; c.fill();
  }
  const sp = new Path2D(); sp.addPath(body); sp.addPath(body, shiftM(-r * 0.12, -r * 0.13)); c.fillStyle = 'rgba(10,30,90,0.3)'; c.fill(sp, 'evenodd');
  c.restore();
  c.lineWidth = 7; c.strokeStyle = '#123a7a'; c.stroke(body);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * r * 0.3, -r * 0.08);
    if (dizzy) { c.beginPath(); for (let a = 0; a < 12; a += 0.3) { const rr = a * r * 0.012; c.lineTo(Math.cos(a + t * 12) * rr, Math.sin(a + t * 12) * rr); } fs(c, null, '#0a1a3a', 5); }
    else { ellipse(c, 0, 0, r * 0.07, r * 0.09); c.fillStyle = '#0a1a3a'; c.fill(); }
    c.restore();
  }
  c.beginPath(); c.arc(0, r * 0.12, r * 0.14, 0.2, Math.PI - 0.2); fs(c, null, '#0a1a3a', 5);
  glowE(c, -r * 0.52, r * 0.12, r * 0.16, r * 0.09, 'rgba(255,110,140,0.6)'); glowE(c, r * 0.52, r * 0.12, r * 0.16, r * 0.09, 'rgba(255,110,140,0.6)');
  c.restore();
}
function storyBook(c, x, y, s, t, kind = 'happy', open = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (open > 0) {
    groundShadow(c, 0, 10, 360, 40, 0.3);
    for (const sd of [-1, 1]) {
      const pg = new Path2D(); pg.moveTo(0, 0); pg.quadraticCurveTo(sd * 160, -40, sd * 320, 0); pg.lineTo(sd * 320, -220); pg.quadraticCurveTo(sd * 160, -260, 0, -220); pg.closePath();
      cel(c, pg, '#fff8ea', { shadow: '#f0e2c8', d: sd * 8, line: '#8a6a4a' });
    }
    const cols = ['#ff6f9f', '#ffb347', '#ffe27a', '#8fe3b0', '#6fb7ff', '#b59cff'];
    const pr = easeOutBack(clamp(open));
    glow(c, 0, -160, 260 * pr, 'rgba(255,255,255,0.6)');
    for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(0, -160, (230 - k * 26) * pr, Math.PI, 0); c.lineWidth = 26; c.strokeStyle = cols[k]; c.stroke(); }
    c.beginPath(); c.arc(0, -160, 232 * pr, Math.PI, 0); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
    cloudPath(c, -200 * pr, -170, 110 * pr, 60 * pr, 7, 4); fs(c, '#fff', '#8aa8d0', 4);
    cloudPath(c, 200 * pr, -170, 110 * pr, 60 * pr, 7, 5); fs(c, '#fff', '#8aa8d0', 4);
    txt(c, 'happily ever after', 0, -60, { size: 40, font: DISPLAY, weight: 400, fill: '#ff6f9f', lw: 8, stroke: '#7a1f4a' });
  } else {
    const spooky = kind === 'spooky';
    groundShadow(c, 0, 0, 150, 20, 0.3);
    const cg = c.createLinearGradient(-130, -340, 130, 0); cg.addColorStop(0, spooky ? '#3e345e' : '#ffe08a'); cg.addColorStop(1, spooky ? '#1c1630' : '#f0b43c');
    cel(c, pRRect(-130, -340, 260, 340, 16), cg, { shadow: spooky ? '#141024' : '#d8962a', d: 10, line: spooky ? '#07050e' : '#7a4a10' });
    cel(c, pRRect(-130, -340, 30, 340, 8), spooky ? '#1a1430' : '#e0a030', { d: 0, lw: 4 });
    if (spooky) {
      txt(c, 'THE END', 20, -280, { size: 34, font: DISPLAY, weight: 400, fill: '#8fe3b0', lw: 7, stroke: '#0a2a1a' });
      txt(c, 'IS NIGH', 20, -236, { size: 34, font: DISPLAY, weight: 400, fill: '#8fe3b0', lw: 7, stroke: '#0a2a1a' });
      c.save(); c.translate(20, -60); c.scale(0.5, 0.5); bigTentacle(c, 0, 0, 280, t, 1, { curl: 0.3 }); c.restore();
    } else {
      heartPath(c, 20, -170, 60); const hg = c.createLinearGradient(0, -230, 0, -140); hg.addColorStop(0, '#ff9ab8'); hg.addColorStop(1, '#ff5a8a'); fs(c, hg, '#8a1a4a', 5);
      txt(c, 'Cozy Tales', 20, -290, { size: 36, font: DISPLAY, weight: 400, fill: '#fff', lw: 8, stroke: '#7a4a10' });
      sparkle(c, 90, -90, 16, '#fff'); sparkle(c, -40, -110, 10, '#fff');
    }
  }
  c.restore();
}
