/* Backgrounds, locations and bigger props. */
'use strict';

function fillGrad(c, x0, y0, x1, y1, stops, rx, ry, rw, rh) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  c.fillStyle = g;
  c.fillRect(rx, ry, rw, rh);
}

/* ---------------- night sky + sea ---------------- */
function nightSky(c, t, x = -200, y = -200, w = W + 400, h = H + 400, o = {}) {
  fillGrad(c, 0, y, 0, y + h, [[0, '#140f3a'], [0.55, '#35287a'], [1, '#7a5bbf']], x, y, w, h);
  twinkles(c, t, o.stars || 90, x, y, w, h * 0.75, 3, o.starSize || 1);
  // shooting star every ~7s
  const ph = (t % 7) / 7;
  if (ph < 0.12 && !o.noShoot) {
    const k = ph / 0.12, sx = x + w * (0.2 + 0.5 * rnd(Math.floor(t / 7), 41)), sy = y + h * 0.15;
    c.save(); c.globalAlpha = Math.sin(k * Math.PI);
    line(c, sx + k * 400, sy + k * 160, sx + k * 400 - 140, sy + k * 160 - 56, 'rgba(255,255,230,0.85)', 5);
    sparkle(c, sx + k * 400, sy + k * 160, 12, '#fff');
    c.restore();
  }
}
function seaSurface(c, t, y0, x = -200, w = W + 400, h = 700, o = {}) {
  fillGrad(c, 0, y0, 0, y0 + h, [[0, '#3a5fb0'], [1, '#162a66']], x, y0, w, h);
  // moon reflection
  if (o.moonX !== undefined) {
    for (let k = 0; k < 9; k++) {
      const yy = y0 + 20 + k * 28, ww = 120 - k * 8 + Math.sin(t * 3 + k) * 20;
      rrect(c, o.moonX - ww / 2 + Math.sin(t * 2 + k * 1.3) * 16, yy, ww, 8, 4);
      c.fillStyle = `rgba(255,240,180,${0.55 - k * 0.05})`; c.fill();
    }
  }
  // wave bands
  for (let r = 0; r < 6; r++) {
    const yy = y0 + 18 + r * r * 14, amp = 5 + r * 2, len = 90 + r * 30;
    c.beginPath();
    for (let xx = x; xx <= x + w; xx += 20) c.lineTo(xx, yy + Math.sin(xx / len + t * (1.4 + r * 0.2) + r) * amp);
    c.lineWidth = 3 + r * 0.6; c.strokeStyle = `rgba(190,225,255,${0.35 - r * 0.03})`; c.stroke();
  }
}

/* ---------------- the cozy seaside house ---------------- */
function drawHouse(c, x, y, s, t, o = {}) {
  const porch = o.porch ?? 0.7;
  c.save(); c.translate(x, y); c.scale(s, s);
  // chimney + smoke
  rrect(c, 90, -420, 50, 110, 6); fs(c, '#c77d7d', INK, 5);
  for (let k = 0; k < 4; k++) {
    const ph = (t * 0.25 + k / 4) % 1;
    circle(c, 115 + Math.sin(ph * 5 + k) * 20 + ph * 40, -430 - ph * 200, 16 + ph * 30);
    c.fillStyle = `rgba(230,225,255,${0.5 * (1 - ph)})`; c.fill();
  }
  // walls
  rrect(c, -230, -300, 460, 300, 12); fs(c, '#fff0dc', INK, 6);
  for (let k = 1; k < 7; k++) line(c, -226, -300 + k * 42, 226, -300 + k * 42, 'rgba(200,170,140,0.35)', 3);
  // roof
  c.beginPath(); c.moveTo(-280, -290); c.lineTo(0, -470); c.lineTo(280, -290); c.quadraticCurveTo(290, -272, 270, -270); c.lineTo(-270, -270); c.quadraticCurveTo(-290, -272, -280, -290); c.closePath();
  fs(c, '#6a5acd', INK, 6);
  for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-250 + k * 18, -300 + k * -30); c.lineTo(250 - k * 18, -300 + k * -30); c.lineWidth = 3; c.strokeStyle = 'rgba(40,20,90,0.25)'; c.stroke(); }
  // round attic window
  circle(c, 0, -350, 38); fs(c, o.attic ? '#ffe9a8' : '#3b3f8f', INK, 5);
  if (o.attic) glow(c, 0, -350, 140, 'rgba(255,220,130,0.5)');
  line(c, -38, -350, 38, -350, INK, 4); line(c, 0, -388, 0, -312, INK, 4);
  // windows
  for (const wx of [-150, 150]) {
    glow(c, wx, -170, 150, 'rgba(255,215,120,0.45)');
    rrect(c, wx - 55, -225, 110, 100, 12); fs(c, '#ffe39a', INK, 5);
    line(c, wx, -225, wx, -125, INK, 4); line(c, wx - 55, -175, wx + 55, -175, INK, 4);
    rrect(c, wx - 65, -130, 130, 16, 6); fs(c, '#ff9ecf', INK, 4);
    for (let k = 0; k < 3; k++) { circle(c, wx - 40 + k * 40, -136, 10); fs(c, ['#ff6f9f', '#ffd166', '#b59cff'][k], INK, 3); }
  }
  // door
  rrect(c, -50, -170, 100, 170, 14); fs(c, '#8a5a9e', INK, 5);
  circle(c, 30, -80, 7); fs(c, '#ffd166', INK, 3);
  heartPath(c, 0, -130, 14); fs(c, '#ff9ecf', INK, 3);
  // porch light
  const pb = porch * (0.9 + 0.1 * Math.sin(t * 7));
  glow(c, -90, -200, 360 * (0.4 + pb), `rgba(255,230,140,${0.6 * pb})`);
  rrect(c, -100, -230, 22, 34, 6); fs(c, pb > 0.2 ? '#fff4b0' : '#d0cce0', INK, 4);
  line(c, -89, -240, -89, -230, INK, 4);
  // porch floor
  rrect(c, -270, -12, 540, 24, 8); fs(c, '#c48a5a', INK, 5);
  c.restore();
}
function drawCliff(c, x, y, w, h, t) {
  c.save();
  // bumpy rock face down the left edge
  c.beginPath();
  c.moveTo(x + w, y + h);
  c.lineTo(x + 90, y + h);
  for (let k = 0; k <= 14; k++) {
    const yy = y + h - (k / 14) * (h - 60);
    const bump = (k % 2 ? 46 : 0) + rnd(k, 141) * 34;
    c.quadraticCurveTo(x - 30 + bump, yy + h / 28, x + 20 + bump * 0.6, yy);
  }
  c.lineTo(x + 30, y + 60);
  c.quadraticCurveTo(x + 50, y, x + 160, y);
  c.lineTo(x + w, y);
  c.closePath();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#6a58b0'); g.addColorStop(0.35, '#4a3d8f'); g.addColorStop(1, '#2b2463');
  fs(c, g, INK, 6);
  c.save(); c.clip();
  // layered stones
  for (let k = 0; k < 46; k++) {
    const sx = x + 40 + rnd(k, 142) * (w - 60), sy = y + 90 + rnd(k, 143) * (h - 120);
    const r = 34 + rnd(k, 144) * 60;
    ellipse(c, sx, sy, r * 1.5, r, rnd(k, 145) * 0.6 - 0.3);
    c.fillStyle = ['rgba(120,100,200,0.35)', 'rgba(40,30,90,0.35)', 'rgba(150,130,230,0.22)'][k % 3]; c.fill();
    c.lineWidth = 4; c.strokeStyle = 'rgba(30,20,70,0.35)'; c.stroke();
  }
  // barnacles + little glowing shells below the waterline
  for (let k = 0; k < 18; k++) {
    const sx = x + 60 + rnd(k, 146) * 320, sy = DIO.sea + 80 + rnd(k, 147) * (y + h - DIO.sea - 200);
    circle(c, sx, sy, 8 + rnd(k, 148) * 8); fs(c, k % 3 ? '#b8a8ff' : '#ff9ecf', INK, 3);
  }
  c.restore();
  // seaweed tufts hanging on the rock
  for (let k = 0; k < 6; k++) seaweed(c, x + 70 + (k % 3) * 60 + rnd(k, 149) * 30, DIO.sea + 360 + k * 230, 120 + rnd(k, 150) * 60, t, k % 2 ? '#3fbf8f' : '#5fd4a4', k);
  c.restore();
  c.save();
  // grass cap
  c.beginPath(); c.moveTo(x + 40, y + 36); c.quadraticCurveTo(x + 60, y - 8, x + 160, y - 8); c.lineTo(x + w, y - 8); c.lineTo(x + w, y + 22);
  for (let k = 0; k < 20; k++) c.quadraticCurveTo(x + w - (k + 0.5) * (w - 40) / 20, y + 44, x + w - (k + 1) * (w - 40) / 20, y + 22);
  c.closePath(); fs(c, '#6fcf97', INK, 5);
  // flowers
  for (let k = 0; k < 8; k++) {
    const fx = x + 200 + rnd(k, 61) * (w - 260), fy = y - 6;
    const bob = Math.sin(t * 3 + k) * 3;
    line(c, fx, fy, fx, fy - 20 + bob, '#3f9f78', 3);
    circle(c, fx, fy - 24 + bob, 7); c.fillStyle = ['#ff9ecf', '#ffd166', '#fff'][k % 3]; c.fill();
  }
  c.restore();
}

/* ---------------- underwater ---------------- */
function underwaterBg(c, t, x = -200, y = -200, w = W + 400, h = H + 400, o = {}) {
  fillGrad(c, 0, y, 0, y + h, [[0, o.top || '#2d5fb0'], [0.6, '#1b3a82'], [1, o.bottom || '#101f55']], x, y, w, h);
  // god rays
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 7; k++) {
    const rx = x + (k + 0.5) * w / 7 + Math.sin(t * 0.4 + k) * 60;
    const g = c.createLinearGradient(0, y, 0, y + h * 0.9);
    g.addColorStop(0, 'rgba(150,220,255,0.16)'); g.addColorStop(1, 'rgba(150,220,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(rx - 40, y); c.lineTo(rx + 40, y); c.lineTo(rx + 200 + k * 10, y + h); c.lineTo(rx + 40 + k * 10, y + h); c.closePath(); c.fill();
  }
  c.restore();
}
/* far "non-euclidean" ruins in pastel, softly tilted */
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
  c.beginPath();
  c.moveTo(x - 10, y);
  const N = 10;
  for (let k = 0; k <= N; k++) { const u = k / N; c.lineTo(x - 10 * (1 - u) + Math.sin(t * 1.6 + u * 4 + seed) * 22 * u, y - h * u); }
  for (let k = N; k >= 0; k--) { const u = k / N; c.lineTo(x + 10 * (1 - u) + Math.sin(t * 1.6 + u * 4 + seed) * 22 * u + 6, y - h * u); }
  c.closePath();
  fs(c, col, INK, 4);
}
function seaFloor(c, t, y, x = -200, w = W + 400) {
  c.beginPath(); c.moveTo(x, y + 30);
  for (let xx = x; xx <= x + w; xx += 60) c.quadraticCurveTo(xx + 30, y - 14 + rnd(xx, 81) * 20, xx + 60, y + 10);
  c.lineTo(x + w, y + 800); c.lineTo(x, y + 800); c.closePath();
  const g = c.createLinearGradient(0, y, 0, y + 400);
  g.addColorStop(0, '#f2d6a8'); g.addColorStop(1, '#c79f78');
  fs(c, g, INK, 5);
  for (let k = 0; k < 14; k++) { ellipse(c, x + rnd(k, 82) * w, y + 40 + rnd(k, 83) * 120, 10 + rnd(k, 84) * 12, 6); c.fillStyle = 'rgba(150,110,80,0.35)'; c.fill(); }
  for (let k = 0; k < 4; k++) { softStar(c, x + 120 + k * w / 4 + rnd(k, 85) * 100, y + 50 + rnd(k, 86) * 60, 22, 5, t * 0.2 + k, 0.45); fs(c, ['#ff9ecf', '#ffb347'][k % 2], INK, 3.5); }
}
function coral(c, x, y, s, col = '#ff9ecf') {
  c.save(); c.translate(x, y); c.scale(s, s);
  const br = [[0, -80], [-40, -60], [40, -66], [-24, -110], [26, -104]];
  for (const [bx, by] of br) { line(c, 0, 0, bx, by, INK, 22); line(c, 0, 0, bx, by, col, 14); circle(c, bx, by, 14); fs(c, col, INK, 4); }
  c.restore();
}
/* the sunken temple, cute edition */
function drawTemple(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const cols = ['#9f8cff', '#7fd8c8', '#ff9ecf'];
  // steps
  rrect(c, -420, -40, 840, 50, 14); fs(c, '#b8a8ff', INK, 5);
  rrect(c, -360, -80, 720, 48, 14); fs(c, '#a797f5', INK, 5);
  // tilted pillars
  for (let k = 0; k < 4; k++) {
    const px = -300 + k * 200, tilt = [-0.12, 0.06, -0.05, 0.14][k];
    c.save(); c.translate(px, -80); c.rotate(tilt);
    rrect(c, -34, -360, 68, 360, 16); fs(c, cols[k % 3], INK, 5);
    for (let j = 0; j < 3; j++) line(c, -18 + j * 18, -340, -18 + j * 18, -20, 'rgba(42,27,61,0.18)', 5);
    rrect(c, -50, -390, 100, 36, 10); fs(c, '#fff0f8', INK, 5);
    c.restore();
  }
  // wonky lintel
  c.save(); c.translate(0, -470); c.rotate(-0.04);
  rrect(c, -380, -40, 760, 70, 20); fs(c, '#c3b5ff', INK, 5);
  for (let k = 0; k < 6; k++) { c.beginPath(); for (let a = 0; a < 8; a += 0.3) { const r = 2 + a * 1.6; c.lineTo(-300 + k * 120 + Math.cos(a) * r, -5 + Math.sin(a) * r); } fs(c, null, '#7b4fd6', 4); }
  c.restore();
  // DO NOT DISTURB sign
  if (o.sign > 0) {
    const sw = Math.sin(t * 2) * 0.08, p = clamp(o.sign);
    c.save(); c.translate(250, -440); c.rotate(sw); c.scale(p, p);
    line(c, -40, 0, 0, -40, INK, 4); line(c, 40, 0, 0, -40, INK, 4);
    rrect(c, -110, 0, 220, 90, 16); fs(c, '#fff6e0', INK, 5);
    txt(c, 'DO NOT', 0, 28, { size: 30, font: DISPLAY, weight: 400, fill: '#ff6f9f', lw: 0, stroke: false });
    txt(c, 'DISTURB', 0, 62, { size: 30, font: DISPLAY, weight: 400, fill: '#6b3fc9', stroke: false });
    txt(c, 'z', 90, 20, { size: 24, font: DISPLAY, fill: '#8fe3b0', lw: 5 });
    c.restore();
  }
  c.restore();
}
function drawClamBed(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // back shell
  c.beginPath(); c.moveTo(-260, 0); c.bezierCurveTo(-270, -260, 270, -260, 260, 0); c.closePath();
  fs(c, '#ffc2d8', INK, 6);
  for (let k = -3; k <= 3; k++) line(c, 0, -10, k * 70, -200 + Math.abs(k) * 30, 'rgba(230,120,160,0.45)', 6);
  // mattress
  rrect(c, -250, -40, 500, 60, 30); fs(c, '#ffe7f1', INK, 5);
  // front shell lip
  c.beginPath(); c.moveTo(-270, 0); c.quadraticCurveTo(0, 80, 270, 0); c.quadraticCurveTo(0, 40, -270, 0); fs(c, '#ffb3cf', INK, 5);
  // pearl pillow
  circle(c, -180, -60, 44); fs(c, '#fdfbff', INK, 5); circle(c, -194, -76, 12); c.fillStyle = '#fff'; c.fill();
  c.restore();
}
/* the blanket tucked over a sleeper, drawn on top */
function blanket(c, x, y, s, amt = 1, col = '#b59cff') {
  if (amt <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s);
  const top = lerp(40, -120, amt);
  c.beginPath(); c.moveTo(-230, 30); c.lineTo(-230, top + 20); c.quadraticCurveTo(0, top - 30, 230, top + 20); c.lineTo(230, 30); c.closePath();
  fs(c, col, INK, 5);
  c.save(); c.clip();
  for (let k = -6; k < 7; k++) { heartPath(c, k * 60, top + 60 + (k % 2) * 30, 12); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill(); }
  c.restore();
  rrect(c, -236, top + 6, 472, 30, 15); fs(c, '#fff', INK, 5);
  c.restore();
}

/* the whole cross-section world: sky, cliff house, sea, sleeper. world height ~2400 */
const DIO = { sea: 620, floor: 2250, houseX: 1450, cliffY: 470, cthX: 700 };
/* world-space rectangle currently visible on the canvas */
function viewRect(c) {
  const inv = c.getTransform().inverse();
  const a = inv.transformPoint({ x: 0, y: 0 }), b = inv.transformPoint({ x: c.canvas.width, y: c.canvas.height });
  return [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)];
}
function diorama(c, t, o = {}) {
  const [vx0, vy0, vx1, vy1] = viewRect(c);
  const sky = vy0 < DIO.sea + 20, sea = vy1 > DIO.sea - 20, deep = vy1 > DIO.floor - 900, cliff = vx1 > 1060;
  if (sky) {
    nightSky(c, t, -1200, -1400, 4400, 2100, { stars: 160 });
    if (o.moon !== false) drawMoon(c, o.moonX ?? 330, o.moonY ?? 130, 1.0, { t, face: o.moonFace || 'sleepy', shades: o.moonShades });
  }
  if (sea) diorama_sea(c, t, o, deep);
  if (cliff) {
    drawCliff(c, 1080, DIO.cliffY, 1100, DIO.floor + 200 - DIO.cliffY, t);
    if (sky) drawHouse(c, DIO.houseX + 150, DIO.cliffY, 0.95, t, { porch: o.porch ?? 1, attic: o.attic });
  }
  if (vy0 < DIO.sea + 40 && vy1 > DIO.sea - 20) seaLine(c, t);
}
function diorama_sea(c, t, o, deep) {
  // underwater body
  underwaterBg(c, t, -1200, DIO.sea, 4400, 2400, { top: '#2f64b8' });
  ruinsFar(c, t, -200, DIO.floor - 60, 2400, 1.3, 0.25);
  bubblesFx(c, t, 26, -100, DIO.sea + 40, 2100, DIO.floor - DIO.sea, { speed: 70 });
  const [vx0, vy0, vx1, vy1] = viewRect(c);
  // fish schools
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
  drawTemple(c, DIO.cthX, DIO.floor, 1.0, t, { sign: o.sign || 0 });
  drawClamBed(c, DIO.cthX, DIO.floor - 90, 0.95, t);
  drawCthulhu(c, DIO.cthX + 20, DIO.floor - 110, 1.05, Object.assign({ t, mood: 'sleep', hug: 'fish' }, o.cth || {}));
  if (o.blanket) blanket(c, DIO.cthX + 20, DIO.floor - 100, 1.0, o.blanket);
  if (o.cthMood !== 'awake') zzz(c, DIO.cthX + 150, DIO.floor - 390, t, 1.4);
}
/* sea surface drawn last (a translucent band at the waterline) */
function seaLine(c, t) {
  c.save();
  c.beginPath(); c.moveTo(-1200, DIO.sea);
  for (let xx = -1200; xx <= 3200; xx += 30) c.lineTo(xx, DIO.sea + Math.sin(xx / 90 + t * 2) * 8);
  c.lineTo(3200, DIO.sea + 40); c.lineTo(-1200, DIO.sea + 40); c.closePath();
  c.fillStyle = 'rgba(160,220,255,0.55)'; c.fill();
  c.beginPath();
  for (let xx = -1200; xx <= 3200; xx += 30) c.lineTo(xx, DIO.sea + Math.sin(xx / 90 + t * 2) * 8);
  c.lineWidth = 6; c.strokeStyle = '#e8f7ff'; c.stroke();
  c.restore();
}

/* ---------------- indoor sets ---------------- */
function roomBg(c, t, o = {}) {
  // wallpaper
  fillGrad(c, 0, 0, 0, H, [[0, o.wall1 || '#4a3a8f'], [1, o.wall2 || '#6a55b8']], -200, -200, W + 400, H + 400);
  c.save(); c.globalAlpha = 0.18;
  for (let yy = 0; yy < 12; yy++) for (let xx = 0; xx < 18; xx++) {
    const px = -100 + xx * 130 + (yy % 2) * 65, py = -100 + yy * 110;
    if ((xx + yy) % 2) softStar(c, px, py, 16, 5, 0.3); else { circle(c, px, py, 14); c.fill(); circle(c, px + 7, py - 5, 12); c.fillStyle = o.wall1 || '#4a3a8f'; }
    c.fillStyle = '#fff'; c.fill();
  }
  c.restore();
  // floor
  const fy = o.floorY || 820;
  fillGrad(c, 0, fy, 0, H + 200, [[0, '#a8744a'], [1, '#7a4f33']], -200, fy, W + 400, H + 400);
  for (let k = 0; k < 20; k++) line(c, -200 + k * 120, fy, -200 + k * 120 - 60, H + 200, 'rgba(60,30,10,0.25)', 4);
  line(c, -200, fy, W + 200, fy, INK, 6);
  rrect(c, -200, fy - 26, W + 400, 26, 0); fs(c, '#3a2a70', null);
}
function roundWindow(c, x, y, r, t, o = {}) {
  circle(c, x, y, r + 18); fs(c, '#c48a5a', INK, 6);
  c.save(); circle(c, x, y, r); c.clip();
  nightSky(c, t, x - r, y - r, r * 2, r * 2, { stars: 20, noShoot: true });
  if (o.moon !== false) drawMoon(c, x + r * 0.2, y - r * 0.1, r / 170, { t, face: o.moonFace || 'sleepy', shades: o.shades });
  c.restore();
  circle(c, x, y, r); fs(c, null, INK, 6);
  line(c, x - r, y, x + r, y, '#c48a5a', 10); line(c, x, y - r, x, y + r, '#c48a5a', 10);
}
function bookshelf(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -150, -420, 300, 420, 10); fs(c, '#8a5a3a', INK, 6);
  for (let r = 0; r < 3; r++) {
    const sy = -400 + r * 136;
    rrect(c, -134, sy, 268, 116, 4); fs(c, '#5a3a2a', null);
    let bx = -128;
    for (let k = 0; bx < 116; k++) {
      const bw = 22 + rnd(k + r * 20, 101) * 22, bh = 80 + rnd(k + r * 20, 102) * 30;
      rrect(c, bx, sy + 116 - bh, bw, bh, 4); fs(c, ['#ff8fc7', '#8fe3b0', '#b59cff', '#ffd166', '#6fb7ff'][(k + r) % 5], INK, 3.5);
      bx += bw + 2;
    }
    line(c, -134, sy + 116, 134, sy + 116, INK, 6);
  }
  c.restore();
}
function drawAltar(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -160, -160, 22, 160, 6); fs(c, '#7a4f33', INK, 5); rrect(c, 138, -160, 22, 160, 6); fs(c, '#7a4f33', INK, 5);
  rrect(c, -200, -190, 400, 40, 12); fs(c, '#a8744a', INK, 5);
  // cloth
  c.beginPath(); c.moveTo(-170, -192); c.lineTo(170, -192); c.lineTo(160, -90);
  for (let k = 0; k < 6; k++) c.quadraticCurveTo(160 - (k + 0.5) * 53, -70, 160 - (k + 1) * 53, -90);
  c.closePath(); fs(c, '#7b4fd6', INK, 5);
  c.beginPath(); c.moveTo(160, -100); for (let k = 0; k < 6; k++) c.quadraticCurveTo(160 - (k + 0.5) * 53, -80, 160 - (k + 1) * 53, -100); fs(c, null, '#ffd166', 5);
  softStar(c, 0, -140, 26); fs(c, '#ffd166', INK, 4);
  if (o.shine) {
    for (let k = 0; k < 5; k++) { const ph = (t * 1.5 + k / 5) % 1; sparkle(c, -160 + rnd(k, 111) * 320, -200 - ph * 90, 14 * Math.sin(ph * Math.PI) * o.shine + 2, '#fff', 0); }
    c.save(); c.globalAlpha = 0.35 * o.shine; rrect(c, -200, -190, 400, 12, 6); c.fillStyle = '#fff'; c.fill(); c.restore();
  }
  c.restore();
}
function drawDoor(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -110, -400, 220, 400, 18); fs(c, '#5a3a2a', INK, 6);
  const open = o.open || 0;
  if (open > 0) {
    c.save(); rrect(c, -98, -388, 196, 388, 10); c.clip();
    fillGrad(c, 0, -388, 0, 0, [[0, '#ffe9a8'], [1, '#ffc46b']], -98, -388, 196, 388);
    c.restore();
  }
  c.save(); c.translate(-98, 0); c.scale(1 - open * 0.55, 1);
  rrect(c, 0, -388, 196, 388, 10); fs(c, '#b07a4f', INK, 5);
  rrect(c, 26, -350, 144, 130, 10); fs(c, '#c48a5a', INK, 4); rrect(c, 26, -190, 144, 150, 10); fs(c, '#c48a5a', INK, 4);
  circle(c, 170, -190, 12); fs(c, '#ffd166', INK, 4);
  c.restore();
  if (o.sign) { c.save(); c.rotate(Math.sin(t * 2) * 0.06); rrect(c, -60, -470, 120, 50, 12); fs(c, '#fff6e0', INK, 4); txt(c, 'HOME', 0, -444, { size: 28, font: DISPLAY, weight: 400, fill: '#ff6f9f', stroke: false }); c.restore(); }
  c.restore();
}
/* ritual wheel on the floor (perspective ellipse) */
function ritualWheel(c, x, y, rx, ry, t, glowAmt = 0.5) {
  c.save(); c.translate(x, y);
  glow(c, 0, 0, rx * 1.3, `rgba(180,140,255,${0.35 * glowAmt})`);
  c.scale(1, ry / rx);
  c.rotate(t * 0.3);
  c.lineWidth = 8; c.strokeStyle = 'rgba(255,255,255,0.85)';
  circle(c, 0, 0, rx); c.stroke();
  circle(c, 0, 0, rx * 0.72); c.lineWidth = 5; c.stroke();
  for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * rx, Math.sin(a) * rx); c.lineWidth = 5; c.stroke(); }
  softStar(c, 0, 0, rx * 0.3, 7, 0, 0.6); c.lineWidth = 5; c.stroke();
  c.restore();
}

function kitchenBg(c, t, o = {}) {
  fillGrad(c, 0, 0, 0, H, [[0, '#ffe6c9'], [1, '#ffd0b0']], -200, -200, W + 400, H + 400);
  // tiles backsplash
  c.save(); c.globalAlpha = 0.5;
  for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 24; xx++) { rrect(c, -200 + xx * 100, 380 + yy * 60, 96, 56, 8); c.fillStyle = (xx + yy) % 2 ? '#ffffff' : '#ffe9f2'; c.fill(); }
  c.restore();
  // window at night
  rrect(c, 700, 90, 520, 280, 20); fs(c, '#c48a5a', INK, 6);
  c.save(); rrect(c, 718, 108, 484, 244, 12); c.clip(); nightSky(c, t, 700, 90, 520, 280, { stars: 30, noShoot: true }); drawMoon(c, 1100, 180, 0.42, { t, face: o.moonFace || 'smile' }); c.restore();
  line(c, 960, 108, 960, 352, '#c48a5a', 12);
  // upper cabinets
  for (let k = 0; k < 3; k++) { rrect(c, 60 + k * 200, 80, 180, 240, 16); fs(c, '#8fd3c0', INK, 5); circle(c, 60 + k * 200 + 150, 280, 8); fs(c, '#ffd166', INK, 3); }
  for (let k = 0; k < 3; k++) { rrect(c, 1300 + k * 200, 80, 180, 240, 16); fs(c, '#8fd3c0', INK, 5); circle(c, 1300 + k * 200 + 30, 280, 8); fs(c, '#ffd166', INK, 3); }
  // counter
  rrect(c, -100, 600, W + 200, 40, 6); fs(c, '#ff9ecf', INK, 6);
  rrect(c, -100, 640, W + 200, 200, 0); fs(c, '#8fd3c0', INK, 6);
  for (let k = 0; k < 10; k++) { rrect(c, -60 + k * 210, 660, 190, 160, 14); fs(c, '#a4e0cf', INK, 4); }
  // floor checkerboard
  c.save();
  rrect(c, -200, 840, W + 400, 400, 0); c.clip();
  for (let yy = 0; yy < 5; yy++) for (let xx = -2; xx < 22; xx++) {
    c.beginPath();
    const y0 = 840 + yy * 60, x0 = xx * 110 + (yy - 2) * 30;
    c.rect(x0, y0, 110, 60);
    c.fillStyle = (xx + yy) % 2 ? '#fff6e6' : '#b59cff'; c.fill();
  }
  c.restore();
  line(c, -200, 840, W + 200, 840, INK, 6);
}
/* pendant kitchen lamp with light cone */
function kitchenLamp(c, x, y, t, o = {}) {
  const sw = o.swing ? Math.sin(t * 2.2) * 0.12 : 0;
  c.save(); c.translate(x, -20); c.rotate(sw);
  const L = y + 20;
  line(c, 0, 0, 0, L, INK, 5);
  if (o.cone !== false) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, L, 0, L + 900);
    g.addColorStop(0, `rgba(255,230,150,${0.45 * (o.bright ?? 1)})`); g.addColorStop(1, 'rgba(255,230,150,0)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(-60, L + 40); c.lineTo(60, L + 40); c.lineTo(520, L + 900); c.lineTo(-520, L + 900); c.closePath(); c.fill();
    c.restore();
  }
  c.beginPath(); c.moveTo(-90, L + 50); c.quadraticCurveTo(-80, L - 20, 0, L - 24); c.quadraticCurveTo(80, L - 20, 90, L + 50); c.closePath();
  fs(c, '#ff6f9f', INK, 5);
  ellipse(c, 0, L + 52, 34, 16); fs(c, '#fff4b0', INK, 4);
  glow(c, 0, L + 60, 180, 'rgba(255,240,170,0.55)');
  c.restore();
}

function cafeBg(c, t) {
  fillGrad(c, 0, 0, 0, H, [[0, '#ffd6e8'], [1, '#ffc0d8']], -200, -200, W + 400, H + 400);
  // big sunny window
  rrect(c, 360, 70, 1200, 520, 30); fs(c, '#fff', INK, 6);
  c.save(); rrect(c, 380, 90, 1160, 480, 22); c.clip();
  fillGrad(c, 0, 90, 0, 570, [[0, '#7fd0ff'], [1, '#c9efff']], 380, 90, 1160, 480);
  glow(c, 1380, 170, 260, 'rgba(255,245,180,0.9)');
  circle(c, 1380, 170, 70); fs(c, '#ffe27a', INK, 5);
  for (let k = 0; k < 4; k++) { const cx = ((t * 30 + k * 400) % 1500) + 300; cloudPath(c, cx, 200 + k * 70, 170, 60, 7, k); fs(c, '#fff', INK, 4); }
  c.restore();
  line(c, 960, 90, 960, 570, '#fff', 14);
  line(c, 380, 330, 1540, 330, '#fff', 14);
  // bunting
  for (let k = 0; k < 16; k++) {
    const bx = 120 + k * 110, by = 40 + Math.sin(k / 15 * Math.PI) * 30;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 90, by); c.lineTo(bx + 45, by + 60 + Math.sin(t * 3 + k) * 5); c.closePath();
    fs(c, ['#ffd166', '#8fe3b0', '#6fb7ff', '#b59cff'][k % 4], INK, 4);
  }
  // plants
  for (const px of [150, 1770]) { rrect(c, px - 60, 520, 120, 110, 16); fs(c, '#ff9ecf', INK, 5); for (let k = 0; k < 5; k++) { c.save(); c.translate(px, 520); c.rotate(-1 + k * 0.5 + Math.sin(t * 2 + k) * 0.05); ellipse(c, 0, -80, 26, 70); fs(c, '#6fcf97', INK, 4); c.restore(); } }
  // floor
  fillGrad(c, 0, 640, 0, H, [[0, '#ffe9a8'], [1, '#ffd98a']], -200, 640, W + 400, 800);
  line(c, -200, 640, W + 200, 640, INK, 6);
}
function brunchTable(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -500, -20, 1000, 60, 20); fs(c, '#fff', INK, 6);
  c.save(); rrect(c, -500, -20, 1000, 60, 20); c.clip(); for (let k = 0; k < 20; k++) { c.fillStyle = k % 2 ? '#ff9ecf' : '#fff'; c.fillRect(-500 + k * 50, -20, 50, 60); } c.restore();
  rrect(c, -500, -20, 1000, 60, 20); fs(c, null, INK, 6);
  line(c, -420, 40, -420, 340, INK, 14); line(c, 420, 40, 420, 340, INK, 14);
  // pancake stack (bounces)
  const hop2 = o.hop || 0;
  c.save(); c.translate(-40, -20 + hop2);
  ellipse(c, 0, 0, 170, 34); fs(c, '#fff', INK, 5);
  for (let k = 0; k < 5; k++) { const sq = o.sq || 1; rrect(c, -130, -30 - k * 38 * sq, 260, 40 * sq, 20); fs(c, '#f4b860', INK, 5); line(c, -120, -12 - k * 38 * sq, 120, -12 - k * 38 * sq, '#d98f3a', 3); }
  const topY = -30 - 4 * 38 * (o.sq || 1);
  c.beginPath(); c.moveTo(-120, topY + 10); c.quadraticCurveTo(0, topY - 30, 120, topY + 10); c.quadraticCurveTo(110, topY + 70, 90, topY + 90); c.quadraticCurveTo(80, topY + 40, 40, topY + 30); c.quadraticCurveTo(0, topY + 100, -30, topY + 30); c.quadraticCurveTo(-80, topY + 60, -120, topY + 10);
  fs(c, '#b8621b', INK, 4);
  rrect(c, -30, topY - 22, 60, 30, 8); fs(c, '#fff3a8', INK, 4);
  circle(c, 60, topY - 16, 16); fs(c, '#ff5a7a', INK, 4); circle(c, -64, topY - 12, 14); fs(c, '#ff5a7a', INK, 4);
  c.restore();
  // mugs + juice
  for (const [mx, col] of [[-330, '#8fe3b0'], [300, '#b59cff']]) {
    rrect(c, mx - 44, -110, 88, 90, 20); fs(c, col, INK, 5);
    c.beginPath(); c.arc(mx + 48, -66, 20, -1.3, 1.3); fs(c, null, INK, 7);
    for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(mx - 12 + k * 24, -120); c.quadraticCurveTo(mx - 26 + k * 24, -150 + Math.sin(t * 4 + k) * 6, mx - 8 + k * 24, -180); fs(c, null, 'rgba(255,255,255,0.9)', 5); }
  }
  rrect(c, 430, -150, 60, 130, 14); fs(c, '#ffb347', INK, 5); line(c, 470, -190, 452, -120, '#ff6f9f', 8);
  c.restore();
}

function bedroomBg(c, t) {
  roomBg(c, t, { wall1: '#2f2a6e', wall2: '#4a3f95', floorY: 860 });
  roundWindow(c, 1500, 330, 170, t, { moonFace: 'sleepy' });
  // bed
  rrect(c, 360, 520, 60, 380, 16); fs(c, '#c48a5a', INK, 6);
  rrect(c, 360, 700, 1000, 160, 30); fs(c, '#ffe7f1', INK, 6);
  rrect(c, 1310, 640, 50, 260, 16); fs(c, '#c48a5a', INK, 6);
  // nightstand + lamp
  rrect(c, 1560, 700, 180, 180, 16); fs(c, '#c48a5a', INK, 5);
  glow(c, 1650, 600, 260, 'rgba(255,220,140,0.55)');
  line(c, 1650, 700, 1650, 620, INK, 6);
  c.beginPath(); c.moveTo(1590, 630); c.lineTo(1710, 630); c.lineTo(1680, 550); c.lineTo(1620, 550); c.closePath(); fs(c, '#ffd166', INK, 5);
}
function quilt(c, x, y, w, h, t) {
  c.save();
  c.beginPath(); c.moveTo(x, y + 20); c.quadraticCurveTo(x + w / 2, y - 40 + Math.sin(t * 1.6) * 6, x + w, y + 10); c.lineTo(x + w + 20, y + h); c.lineTo(x - 20, y + h); c.closePath();
  fs(c, '#8fb8ff', INK, 6);
  c.clip();
  for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 12; xx++) { if ((xx + yy) % 2) { rrect(c, x + xx * 90 - 20, y + yy * 60 - 10, 90, 60, 6); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill(); } }
  c.restore();
}

/* thought bubble: runs fn() clipped inside a cloud */
function thought(c, x, y, w, h, t, p, fn, tail = [0, 0]) {
  if (p <= 0) return;
  c.save();
  c.translate(x, y); c.scale(p, p); c.translate(-x, -y);
  for (let k = 0; k < 3; k++) { circle(c, lerp(tail[0], x - w * 0.25, (k + 1) / 4), lerp(tail[1], y + h * 0.45, (k + 1) / 4), 14 + k * 10); fs(c, '#fff', INK, 5); }
  cloudPath(c, x, y, w, h, 11, 3); fs(c, '#fff', INK, 7);
  c.save(); cloudPath(c, x, y, w * 0.97, h * 0.95, 11, 3); c.clip(); fn(); c.restore();
  cloudPath(c, x, y, w, h, 11, 3); fs(c, null, INK, 7);
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
    rrect(c, -70, -140, 140, 140, 10); fs(c, cols[k], INK, 5);
    c.beginPath(); c.moveTo(-86, -130); c.lineTo(0, -210); c.lineTo(86, -130); c.closePath(); fs(c, ['#6a5acd', '#c77d7d', '#3f9f78'][k % 3], INK, 5);
    rrect(c, -46, -110, 36, 36, 6); fs(c, '#ffe39a', INK, 4); rrect(c, 12, -80, 36, 80, 6); fs(c, '#8a5a3a', INK, 4);
    c.restore();
    if (k < 5 && !gone) { circle(c, hx + 95, -60, 34); fs(c, '#6fcf97', INK, 4); line(c, hx + 95, -26, hx + 95, 0, '#8a5a3a', 8); }
  }
  c.restore();
}
/* a giant (but cute) tentacle rising from below */
function bigTentacle(c, x, y, h, t, rise, o = {}) {
  if (rise <= 0) return;
  c.save(); c.translate(x, y);
  const N = 22, L = [], R = [];
  const top = h * rise;
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const a = Math.sin(t * 2 + u * 3) * 0.3 * u + (o.curl || 0) * u * u * 3.2;
    const px = Math.sin(u * 2.2 + t) * 60 * u + Math.sin(a) * top * u * 0.3;
    const py = -top * u;
    const w = 120 * (1 - u * 0.8);
    L.push([px - w, py]); R.push([px + w, py]);
  }
  c.beginPath(); c.moveTo(L[0][0], L[0][1]);
  L.forEach((p) => c.lineTo(p[0], p[1]));
  const tp = R[N]; c.quadraticCurveTo(tp[0] + 30, tp[1] - 40, tp[0], tp[1]);
  for (let k = N; k >= 0; k--) c.lineTo(R[k][0], R[k][1]);
  c.closePath();
  fs(c, '#62c795', INK, 8);
  for (let k = 2; k < N - 2; k += 2) { const p = L[k], q = R[k]; circle(c, lerp(p[0], q[0], 0.25), p[1], 24 * (1 - k / N) + 6); fs(c, '#d9f8e6', INK, 3); }
  c.restore();
}

/* ---------------- misc props ---------------- */
function paperStack(c, x, y, s, t, fly = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let k = 0; k < 7; k++) {
    const f = fly * (0.5 + rnd(k, 121));
    c.save(); c.translate(Math.sin(t * 3 + k) * 40 * f + (rnd(k, 122) - 0.5) * 20, -k * 14 - f * 120 * rnd(k, 123)); c.rotate((rnd(k, 124) - 0.5) * 0.3 + Math.sin(t * 4 + k) * f);
    rrect(c, -130, -10, 260, 16, 3); fs(c, k % 3 ? '#fff' : '#fff3d6', INK, 3.5);
    c.restore();
  }
  c.restore();
}
function giftBox(c, x, y, s, t, lid = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -130, -180, 260, 180, 14); fs(c, '#6fb7ff', INK, 6);
  rrect(c, -20, -180, 40, 180, 0); fs(c, '#ff6f9f', INK, 4);
  c.save(); c.translate(0, -180 - lid * 160); c.rotate(-lid * 0.6);
  rrect(c, -145, -40, 290, 44, 14); fs(c, '#8fcaff', INK, 6); rrect(c, -20, -40, 40, 44, 0); fs(c, '#ff6f9f', INK, 4);
  ellipse(c, -40, -56, 40, 22, -0.4); fs(c, '#ff6f9f', INK, 4); ellipse(c, 40, -56, 40, 22, 0.4); fs(c, '#ff6f9f', INK, 4); circle(c, 0, -48, 14); fs(c, '#ff6f9f', INK, 4);
  c.restore();
  c.restore();
}
function planBoard(c, x, y, s, t, reveal = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  line(c, -150, 0, -110, -380, '#8a5a3a', 14); line(c, 150, 0, 110, -380, '#8a5a3a', 14);
  rrect(c, -230, -480, 460, 330, 16); fs(c, '#fff', INK, 6);
  txt(c, 'THE PLAN', 0, -440, { size: 44, font: DISPLAY, weight: 400, fill: '#ff6f9f', lw: 8 });
  const steps = ['1. chant nicely', '2. wake the big guy', '3. ???'];
  steps.forEach((st, k) => { if (reveal > k / 3) txt(c, st, -190, -380 + k * 70, { size: 38, align: 'left', fill: '#2a1b3d', stroke: false, weight: 600 }); });
  if (reveal > 0.66) { c.save(); c.translate(150, -250); c.scale(0.28, 0.28); drawCthulhu(c, 0, 0, 1, { t, mood: 'sleep' }); c.restore(); }
  c.restore();
}
function welcomeMat(c, x, y, s, t, kind = 'tentacle') {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (kind === 'tentacle') {
    c.beginPath(); c.moveTo(-260, 0);
    c.bezierCurveTo(-260, -70, 120, -90, 220, -50);
    c.bezierCurveTo(300, -20, 300, 40, 240, 40);
    c.bezierCurveTo(200, 40, 200, 0, 230, 0);
    c.bezierCurveTo(160, 40, -200, 60, -260, 0); c.closePath();
    fs(c, '#62c795', INK, 6);
    for (let k = 0; k < 6; k++) { circle(c, -180 + k * 70, 10 - k * 4, 12); fs(c, '#d9f8e6', INK, 3); }
    txt(c, 'WELCOME', -20, -26, { size: 40, font: DISPLAY, weight: 400, fill: '#fff6e0', lw: 8, rot: -0.05 });
  } else {
    rrect(c, -240, -60, 480, 110, 26); fs(c, '#ffd166', INK, 6);
    for (let k = 0; k < 5; k++) { const fx = -190 + k * 95; circle(c, fx, 26, 10); c.fillStyle = '#ff9ecf'; c.fill(); }
    txt(c, 'hello :)', 0, -8, { size: 46, font: DISPLAY, weight: 400, fill: '#ff6f9f', lw: 8 });
  }
  c.restore();
}
function phoneCall(c, x, y, s, t, p = 1, declined = 0) {
  c.save(); c.translate(x + Math.sin(t * 50) * 5 * (1 - declined) * p, y); c.rotate(Math.sin(t * 40) * 0.03 * (1 - declined)); c.scale(s * p, s * p);
  rrect(c, -200, -380, 400, 760, 50); fs(c, '#3a3a5a', INK, 7);
  c.save(); rrect(c, -176, -350, 352, 700, 30); c.clip();
  fillGrad(c, 0, -350, 0, 350, [[0, '#2d5fb0'], [1, '#101f55']], -176, -350, 352, 700);
  bubblesFx(c, t, 10, -176, -350, 352, 700, { speed: 60, r: 10 });
  c.restore();
  txt(c, 'incoming call', 0, -270, { size: 30, fill: '#cfe8ff', stroke: false, weight: 500 });
  txt(c, 'THE DEEP', 0, -215, { size: 50, font: DISPLAY, weight: 400, fill: '#fff', lw: 8 });
  circle(c, 0, -50, 92); fs(c, '#8fe3b0', INK, 6);
  c.save(); c.translate(0, -50); c.scale(0.36, 0.36); c.translate(0, 190); drawCthulhu(c, 0, 0, 1, { t, mood: 'sleep', cap: true }); c.restore();
  // buttons
  const pulse = 1 + Math.sin(t * 8) * 0.06;
  c.save(); c.translate(-90, 230); c.scale(declined ? 1.25 : 1, declined ? 1.25 : 1); circle(c, 0, 0, 52); fs(c, '#ff5a6a', INK, 6); txt(c, '✕', 0, 2, { size: 44, fill: '#fff', stroke: false, font: 'sans-serif', weight: 700 }); c.restore();
  c.save(); c.translate(90, 230); c.scale(pulse, pulse); circle(c, 0, 0, 52); fs(c, '#4fd08a', INK, 6); txt(c, '✆', 0, 2, { size: 50, fill: '#fff', stroke: false, font: 'sans-serif', weight: 700 }); c.restore();
  txt(c, 'decline', -90, 310, { size: 26, fill: '#fff', stroke: false }); txt(c, 'answer', 90, 310, { size: 26, fill: '#fff', stroke: false });
  if (declined > 0) { c.save(); c.globalAlpha = declined; rrect(c, -176, -350, 352, 700, 30); c.fillStyle = 'rgba(20,10,40,0.7)'; c.fill(); txt(c, 'call declined', 0, 0, { size: 44, font: DISPLAY, weight: 400, fill: '#ff9ecf', lw: 8 }); txt(c, '(politely)', 0, 60, { size: 34, fill: '#fff', lw: 6 }); c.restore(); }
  c.restore();
}
function earth(c, x, y, r, t, spin = 1, dizzy = 0) {
  c.save(); c.translate(x, y);
  circle(c, 0, 0, r); fs(c, '#4aa8ff', INK, 7);
  c.save(); circle(c, 0, 0, r - 3); c.clip();
  for (let k = 0; k < 5; k++) {
    const px = ((t * spin * 200 + k * r * 0.9) % (r * 4.5)) - r * 2.2;
    c.beginPath(); c.ellipse(px, (rnd(k, 131) - 0.5) * r * 1.2, r * (0.3 + rnd(k, 132) * 0.25), r * (0.2 + rnd(k, 133) * 0.2), rnd(k, 134), 0, TAU);
    c.fillStyle = '#6fcf97'; c.fill();
  }
  c.restore();
  circle(c, 0, 0, r); fs(c, null, INK, 7);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * r * 0.3, -r * 0.08);
    if (dizzy) { c.beginPath(); for (let a = 0; a < 12; a += 0.3) { const rr = a * r * 0.012; c.lineTo(Math.cos(a + t * 12) * rr, Math.sin(a + t * 12) * rr); } fs(c, null, INK, 5); }
    else { ellipse(c, 0, 0, r * 0.07, r * 0.09); c.fillStyle = INK; c.fill(); }
    c.restore();
  }
  c.beginPath(); c.arc(0, r * 0.12, r * 0.14, 0.2, Math.PI - 0.2); fs(c, null, INK, 5);
  ellipse(c, -r * 0.52, r * 0.12, r * 0.12, r * 0.06); c.fillStyle = PAL.blush; c.fill(); ellipse(c, r * 0.52, r * 0.12, r * 0.12, r * 0.06); c.fill();
  c.restore();
}
function storyBook(c, x, y, s, t, kind = 'happy', open = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (open > 0) {
    // open book with a pop-up rainbow
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-160, -40, -320, 0); c.lineTo(-320, -220); c.quadraticCurveTo(-160, -260, 0, -220); c.closePath(); fs(c, '#fff6e6', INK, 6);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(160, -40, 320, 0); c.lineTo(320, -220); c.quadraticCurveTo(160, -260, 0, -220); c.closePath(); fs(c, '#fff6e6', INK, 6);
    const cols = ['#ff6f9f', '#ffb347', '#ffe27a', '#8fe3b0', '#6fb7ff', '#b59cff'];
    const pr = easeOutBack(clamp(open));
    for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(0, -160, (230 - k * 26) * pr, Math.PI, 0); c.lineWidth = 26; c.strokeStyle = cols[k]; c.stroke(); }
    cloudPath(c, -200 * pr, -170, 110 * pr, 60 * pr, 7, 4); fs(c, '#fff', INK, 4);
    cloudPath(c, 200 * pr, -170, 110 * pr, 60 * pr, 7, 5); fs(c, '#fff', INK, 4);
    txt(c, 'happily ever after', 0, -60, { size: 40, font: DISPLAY, weight: 400, fill: '#ff6f9f', lw: 8 });
  } else {
    const spooky = kind === 'spooky';
    rrect(c, -130, -340, 260, 340, 16); fs(c, spooky ? '#2e2445' : '#ffd166', INK, 6);
    rrect(c, -130, -340, 30, 340, 8); fs(c, spooky ? '#1a1430' : '#f0b43c', INK, 4);
    if (spooky) {
      txt(c, 'THE END', 20, -280, { size: 34, font: DISPLAY, weight: 400, fill: '#8fe3b0', lw: 7 });
      txt(c, 'IS NIGH', 20, -236, { size: 34, font: DISPLAY, weight: 400, fill: '#8fe3b0', lw: 7 });
      c.save(); c.translate(20, -60); c.scale(0.5, 0.5); bigTentacle(c, 0, 0, 280, t, 1, { curl: 0.3 }); c.restore();
    } else {
      heartPath(c, 20, -170, 60); fs(c, '#ff6f9f', INK, 5);
      txt(c, 'Cozy Tales', 20, -290, { size: 36, font: DISPLAY, weight: 400, fill: '#fff', lw: 8 });
      sparkle(c, 90, -90, 16, '#fff'); sparkle(c, -40, -110, 10, '#fff');
    }
  }
  c.restore();
}
