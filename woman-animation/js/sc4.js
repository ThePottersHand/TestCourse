'use strict';
// Woman: scenes 11-13. The duck on the pond, the hotdog-water poster, the walk into the sunset.

function reeds(x0, n, dir, t, seed) {
  ctx.save(); if (HAS_FILTER) ctx.filter = `blur(${2.5 * KS}px)`;
  ctx.strokeStyle = '#030303'; ctx.fillStyle = '#030303'; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + dir * (i * 26 + hash(i + seed) * 20), h = 260 + hash(i * 3 + seed) * 330, sw = Math.sin(t * 1.6 + i * 0.7) * 16 * (h / 500);
    ctx.lineWidth = 5 + hash(i) * 4; ctx.beginPath(); ctx.moveTo(x, H + 30); ctx.quadraticCurveTo(x + sw * 0.4, H - h * 0.5, x + sw, H - h); ctx.stroke();
    if (i % 3 === 0) { ctx.beginPath(); ctx.ellipse(x + sw * 0.96, H - h + 46, 11, 44, sw * 0.012, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + sw, H - h); ctx.lineTo(x + sw * 1.02, H - h - 30); ctx.stroke(); }
    else { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + sw * 0.3, H - h * 0.3); ctx.quadraticCurveTo(x + dir * 60 + sw, H - h * 0.6, x + dir * 110 + sw * 1.3, H - h * 0.55); ctx.stroke(); }
  }
  ctx.restore();
}

function scenePond(t, lt) {
  const hz = 470;
  fillAll(vgrad(0, hz, [[0, '#060606'], [0.5, '#2a2a2a'], [0.9, '#9a9a9a'], [1, '#bcbcbc']]));
  stars(t, 60, 200, 0.35);
  ctx.save(); ctx.globalAlpha = 0.7; ctx.drawImage(TEX.streak, -200 - lt * 18, 250, 2000, 170); ctx.restore();
  redSun(930, hz - 40, 150, { bands: 0.55, rays: 0.7, rayR: 0.45 });
  ridge(hz + 2, 46, 0.014, 5.5, '#161616', { soft: true, rim: { x: 930, w: 300, a: 0.4 } });
  reflect(hz, H + 30, t, { amp: 1, d0: 0.2, d1: 0.75 });
  smoke(t, { x: -200, y: hz + 14, rate: 4, life: 9, vx: 180, vy: 0, spread: 40, turb: 40, s0: 300, s1: 500, alpha: 0.22, seed: 31 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) { const y = hz + 8 + i * i * 0.09, w = (30 + hash(i) * 90) * (1 + i / 50), x = 930 + (hash(i * 3.3) - 0.5) * (60 + i * 5) + Math.sin(t * 2 + i) * 6; ctx.fillStyle = `rgba(255,${120 + hash(i) * 100 | 0},90,${0.25 + 0.25 * Math.sin(t * 5 + i * 2)})`; ctx.fillRect(x - w / 2, y, w, 1.5 + i * 0.03); }
  ctx.restore();
  // the duck glides in; it does a double take, gets a hat, then a badge
  const s = 3.4, dx = lerp(-180, 800, eOut(inv(0, 1.5, lt))), wy = 640 + Math.sin(t * 3.4) * 3 - pulse(t, 7) * 4;
  let flip = 1; if (t > 25.92 && t < 26.44) flip = Math.cos(inv(25.92, 26.44, t) * TAU * 1.5 + Math.PI) * -1;
  const hatK = inv(26.44, 26.74, t), hat = t >= 26.44 ? { y: -120 * (1 - eBack(hatK)), r: (1 - hatK) * 0.5 } : null;
  const dp = { flip, hat };
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const back = 60 + i * 90, spread = 10 + i * 16, a = 0.3 * (1 - i / 6); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.moveTo(dx + 30 * s - back, wy + 8 - spread * 0.2); ctx.quadraticCurveTo(dx + 30 * s - back - 40, wy + 8, dx + 30 * s - back - 80, wy + 8 + spread); ctx.stroke(); }
  ctx.save(); ctx.translate(dx, wy + 10); ctx.scale(s, -s * 0.85); ctx.globalAlpha = 0.35; duckShape(dp)(ctx, '#000'); ctx.restore();
  ctx.fillStyle = 'rgba(60,60,60,0.5)'; for (let i = 0; i < 9; i++) ctx.fillRect(dx - 60 * s, wy + 16 + i * 9 + Math.sin(t * 4 + i) * 2, 120 * s, 2);
  ctx.save(); ctx.translate(dx, wy); ctx.scale(s, s);
  lit(duckShape(dp), { base: '#050505', rim: '#ffe9e0', dir: [0.45, -0.9], w: 3.2, a: 0.95 });
  duckDetail(ctx, dp, 0.3);
  tinStar(ctx, 2, -8, 7.5, inv(27.3, 27.52, t), t);
  ctx.restore();
  if (t > 27.3) { const g = Math.exp(-(t - 27.3) * 3); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,255,255,${0.9 * g})`; ctx.lineWidth = 2; const bx = dx + 2 * s, by = wy - 8 * s; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + t; ctx.beginPath(); ctx.moveTo(bx - Math.cos(a) * 90, by - Math.sin(a) * 90); ctx.lineTo(bx + Math.cos(a) * 90, by + Math.sin(a) * 90); ctx.stroke(); } glow(bx, by, 60, '#ffffff', 0.8 * g); ctx.restore(); }
  if (t > 25.92 && t < 26.9) {
    const k = inv(25.92, 26.07, t); ctx.save(); ctx.translate(dx - 150, wy - 250); ctx.rotate(-0.15 + Math.sin(t * 20) * 0.05); const sc = lerp(1.8, 1, eBack(k)); ctx.scale(sc, sc);
    ctx.font = F.fell(150, true); ctx.textAlign = 'center'; ctx.fillStyle = RED; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20 * KS; ctx.fillText('?!', 0, 0); ctx.restore();
  }
  reeds(-30, 9, 1, t, 1); reeds(W + 30, 8, -1, t, 7);
  lyric([['DUCKS', 25.04], ['ARE', 25.62], ['WEIRD,', 25.92, 'rw']], t, { x: W / 2, y: 175, size: 150 });
  lyric(LY.notbad, t, { x: W / 2, y: 862, size: 112 });
  FX.hal = 0.3;
}

// ---------- the poster ----------
const ILL = mkCanvas(170, 118), illx = ILL.getContext('2d', { willReadFrequently: true });
function drawIllustration(t) {
  const c = illx, w = 170, h = 118;
  c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#d8d8d8'; c.fillRect(0, h * 0.78, w, h);
  c.strokeStyle = '#777'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const ph = (t * 0.5 + i / 4) % 1; c.globalAlpha = Math.sin(ph * Math.PI); c.beginPath(); for (let k = 0; k <= 10; k++) c[k ? 'lineTo' : 'moveTo'](45 + i * 26 + Math.sin(k * 0.8 + t * 3 + i) * 5, 42 - ph * 18 - k * 3.2); c.stroke(); }
  c.globalAlpha = 1;
  const pg = c.createLinearGradient(30, 0, 140, 0); pg.addColorStop(0, '#222'); pg.addColorStop(0.3, '#9a9a9a'); pg.addColorStop(0.45, '#eee'); pg.addColorStop(1, '#1a1a1a');
  c.fillStyle = pg; c.fillRect(32, 52, 106, 50); c.fillRect(136, 58, 32, 7);
  c.fillStyle = '#6a6a6a'; c.beginPath(); c.ellipse(85, 52, 53, 11, 0, 0, TAU); c.fill();
  c.fillStyle = '#4a4a4a'; c.beginPath(); c.ellipse(85, 54, 47, 8, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(85, 30, 60, 6, 0, 0, TAU); c.fill();
  for (let i = 0; i < 4; i++) { c.save(); c.translate(52 + i * 22, 40 + Math.sin(t * 4 + i * 1.7) * 2); c.rotate(-0.9 + i * 0.55 + Math.sin(t * 2 + i) * 0.15); c.fillStyle = '#b0b0b0'; c.strokeStyle = '#000'; c.lineWidth = 2.2; c.beginPath(); c.ellipse(0, 0, 19, 5.5, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-12, -3, 18, 1.6); c.restore(); }
  c.fillStyle = '#111'; const fx = 85 + Math.cos(t * 4) * 50, fy = 26 + Math.sin(t * 8) * 8; c.beginPath(); c.arc(fx, fy, 2.4, 0, TAU); c.fill();
}
function halftone(x, y, w, h, step) {
  const d = illx.getImageData(0, 0, ILL.width, ILL.height).data;
  ctx.fillStyle = '#141210'; ctx.beginPath();
  for (let yy = 0; yy < h; yy += step) for (let xx = (yy / step) % 2 ? step / 2 : 0; xx < w; xx += step) {
    const sx = Math.min(ILL.width - 1, xx / w * ILL.width | 0), sy = Math.min(ILL.height - 1, yy / h * ILL.height | 0);
    const r = (1 - d[(sy * ILL.width + sx) * 4] / 255) * step * 0.62;
    if (r > 0.35) { ctx.moveTo(x + xx + r, y + yy); ctx.arc(x + xx, y + yy, r, 0, TAU); }
  }
  ctx.fill();
}
function scenePoster(t, lt) {
  ctx.drawImage(TEX.wood, -20, -30, 820, 960); ctx.drawImage(TEX.wood, 800, -30, 820, 960);
  fillAll('rgba(0,0,0,0.6)');
  const sw = Math.sin(t * 1.9) * 0.2, lx = 250 + Math.sin(sw) * 150, ly = 30 + Math.cos(sw) * 150;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const pool = ctx.createRadialGradient(lx, ly + 60, 0, lx, ly + 60, 1000); pool.addColorStop(0, 'rgba(255,238,220,0.5)'); pool.addColorStop(0.4, 'rgba(255,230,210,0.16)'); pool.addColorStop(1, 'rgba(255,220,200,0)');
  ctx.fillStyle = pool; ctx.fillRect(-60, -60, W + 120, H + 120); ctx.restore();
  // poster
  const px = 560, py = 470, pw = 600, ph = 800, rot = -0.02 + Math.sin(t * 1.1) * 0.006;
  const shx = (px - lx) * 0.05, shy = 22;
  ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
  const edge = () => { ctx.beginPath(); ctx.moveTo(-pw / 2, -ph / 2); for (let x = -pw / 2; x <= pw / 2; x += 16) ctx.lineTo(x, -ph / 2 + hash(x) * 7); for (let y = -ph / 2; y <= ph / 2 - 70; y += 16) ctx.lineTo(pw / 2 - hash(y) * 7, y); const cl = 70 + Math.sin(t * 5) * 8; ctx.lineTo(pw / 2 - cl, ph / 2); for (let x = pw / 2 - cl; x >= -pw / 2; x -= 16) ctx.lineTo(x, ph / 2 - hash(x + 3) * 9); ctx.closePath(); };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 30 * KS; ctx.shadowOffsetX = shx * KS; ctx.shadowOffsetY = shy * KS; edge(); ctx.fillStyle = '#cfcac0'; ctx.fill(); ctx.restore();
  ctx.save(); edge(); ctx.clip(); ctx.drawImage(TEX.paper, -pw / 2, -ph / 2, pw, ph);
  const lg = ctx.createRadialGradient(lx - px, ly - py + 60, 0, lx - px, ly - py + 60, 900); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = lg; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  ctx.fillStyle = '#16130f'; ctx.font = F.disp(190); ctx.textAlign = 'center'; ctx.fillText('WANTED', 0, -ph / 2 + 205);
  ctx.fillRect(-pw / 2 + 40, -ph / 2 + 228, pw - 80, 5); ctx.fillRect(-pw / 2 + 40, -ph / 2 + 240, pw - 80, 2);
  drawIllustration(t);
  ctx.fillStyle = '#efece6'; ctx.fillRect(-235, -130, 470, 325);
  halftone(-232, -127, 464, 319, 6.5);
  ctx.strokeStyle = '#16130f'; ctx.lineWidth = 4; ctx.strokeRect(-235, -130, 470, 325);
  cap('FOR THE DRINKING OF', 0, 245, F.type(28), '#16130f', 'center', 1, 4);
  cap('HOTDOG WATER', 0, 330, F.disp(92), '#16130f');
  cap('REWARD: ONE DUCK (NOT BAD)', 0, 372, F.type(22), '#2a2621', 'center', 1, 2);
  // the curling corner
  const cl = 70 + Math.sin(t * 5) * 8;
  ctx.restore();
  ctx.fillStyle = vgrad(ph / 2 - cl, ph / 2, [[0, '#8f8a80'], [1, '#e6e1d6']]); ctx.beginPath(); ctx.moveTo(pw / 2 - cl, ph / 2); ctx.lineTo(pw / 2, ph / 2 - 70); ctx.lineTo(pw / 2 - cl * 0.8, ph / 2 - 70 * 0.75); ctx.closePath(); ctx.fill();
  [[-pw / 2 + 22, -ph / 2 + 22], [pw / 2 - 22, -ph / 2 + 22], [-pw / 2 + 22, ph / 2 - 22]].forEach(([x, y]) => { ctx.fillStyle = '#0c0c0c'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a9a9a'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, TAU); ctx.fill(); });
  // rubber stamps
  const stampNoise = (x0, y0, w0, h0, seed) => { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; for (let i = 0; i < 260; i++) { ctx.globalAlpha = 0.5 + hash(i * 3 + seed) * 0.5; ctx.fillRect(x0 + hash(i + seed) * w0, y0 + hash(i * 7.7 + seed) * h0, 2 + hash(i * 2) * 5, 1.5 + hash(i * 5) * 3); } ctx.restore(); };
  const nk = inv(28.36, 28.5, t);
  if (nk > 0) {
    const b = buf('stamp1', 420, 200), bx = b.getContext('2d'); bx.clearRect(0, 0, 420, 200);
    bx.strokeStyle = RED; bx.fillStyle = RED; bx.lineWidth = 12; bx.strokeRect(20, 20, 380, 160); bx.font = F.disp(150); bx.textAlign = 'center'; bx.fillText('NOT', 210, 160);
    bx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 500; i++) { bx.globalAlpha = hash(i * 1.9); bx.fillRect(hash(i) * 420, hash(i * 3.3) * 200, 2 + hash(i * 7) * 7, 1 + hash(i * 5) * 3); }
    const s = lerp(2.2, 1, eBack(nk)); ctx.save(); ctx.translate(-150, -ph / 2 + 70); ctx.rotate(-0.2); ctx.scale(s * 0.6, s * 0.6); ctx.globalAlpha = clamp(nk * 3) * 0.92; ctx.drawImage(b, -210, -100); ctx.restore();
  }
  const sk = inv(30.70, 30.84, t);
  if (sk > 0) {
    const b = buf('stamp2', 480, 480), bx = b.getContext('2d'); bx.clearRect(0, 0, 480, 480);
    bx.strokeStyle = RED; bx.lineWidth = 44; bx.beginPath(); bx.arc(240, 240, 200, 0, TAU); bx.stroke(); bx.beginPath(); bx.moveTo(100, 100); bx.lineTo(380, 380); bx.stroke();
    bx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { bx.globalAlpha = hash(i * 2.9); bx.fillRect(hash(i * 1.1) * 480, hash(i * 4.3) * 480, 2 + hash(i * 7) * 9, 1 + hash(i * 5) * 4); }
    const s = lerp(2.6, 1, eBack(sk)); ctx.save(); ctx.translate(0, 30); ctx.rotate(0.12); ctx.scale(s * 0.82, s * 0.82); ctx.globalAlpha = clamp(sk * 3) * 0.9; ctx.drawImage(b, -240, -240); ctx.restore();
  }
  ctx.restore();
  if (t > 30.7) smoke(t, { x: 560, y: 520, rate: 60, life: 1.1, vx: 0, vy: -10, spread: 700, turb: 40, s0: 60, s1: 260, alpha: 0.3, seed: 44, t0: 30.7 });
  // the lantern
  ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(250, -20); ctx.lineTo(lx, ly - 30); ctx.stroke();
  ctx.save(); ctx.translate(lx, ly); ctx.rotate(-sw);
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(-22, -34, 44, 10); ctx.fillRect(-26, 30, 52, 10);
  const lg2 = ctx.createRadialGradient(0, 0, 2, 0, 0, 30); lg2.addColorStop(0, '#fff1e8'); lg2.addColorStop(0.35, RED_HOT); lg2.addColorStop(1, RED_DEEP);
  ctx.fillStyle = lg2; ctx.beginPath(); ctx.ellipse(0, 3, 22, 28, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#0b0b0b'; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 16, -26); ctx.lineTo(i * 16, 32); ctx.stroke(); }
  ctx.restore();
  glow(lx, ly, 160, RED_HOT, 0.35, 'lighter');
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(930, 170, 640, 700);
  lyric(LY.nl1, t, { x: 1250, y: 300, size: 96, maxW: 580 });
  lyric(LY.nl2, t, { x: 1250, y: 430, size: 96, maxW: 580 });
  lyric(LY.nl3, t, { x: 1250, y: 620, size: 190, maxW: 590, blur: 36 });
  lyric(LY.nl4, t, { x: 1250, y: 820, size: 190, maxW: 590, blur: 36 });
  FX.light = [lx, ly]; FX.rays = 0.35; FX.rayR = 0.25; FX.hal = 0.35;
}

// ---------- the end ----------
function sceneOutro(t, lt) {
  Object.assign(P3, { hz: 540, vx: 800, F: 720, camH: 1.6 });
  const hz = P3.hz;
  fillAll(vgrad(0, hz, [[0, '#040404'], [0.5, '#262626'], [0.88, '#8a8a8a'], [1, '#b2b2b2']]));
  stars(t, 150, 320, 0.7);
  ctx.save(); ctx.globalAlpha = 0.75; ctx.drawImage(TEX.streak, -300 + lt * 10, 300, 2200, 190); ctx.restore();
  redSun(800, hz - 30, 210, { bands: 0.6, rays: 0.95, rayR: 0.55 });
  ctx.save(); ctx.globalAlpha = 0.55; ctx.drawImage(TEX.streak, -100 - lt * 20, 410, 1900, 120); ctx.restore();
  ridge(hz + 2, 80, 0.003, 44.4, '#262626', { mesa: true, rim: { x: 800, w: 520, a: 0.5 } });
  fog(hz + 6, 22, 0.3, 170);
  for (let y = hz + 6; y < H + 40; y += 2) { const k = clamp(1 - (y - hz) / 160); ctx.fillStyle = grey(12 + k * 70 + vnoise(y * 0.3, 3) * 6); ctx.fillRect(-60, y, W + 120, 2); }
  // ties and rails
  for (let k = 0; k < 400; k++) {
    const z = 2 + k * 0.62; if (z > 260) break;
    const y0 = pY(z), y1 = pY(z + 0.2), hw = 1.3 * pS(z);
    ctx.fillStyle = grey(30 + clamp(1 - z / 120) * 10 + clamp(z / 200) * 50); ctx.fillRect(800 - hw, y1, hw * 2, Math.max(1, y0 - y1));
  }
  [-0.72, 0.72].forEach(X => {
    const g = ctx.createLinearGradient(0, H, 0, hz); g.addColorStop(0, 'rgba(160,160,160,0.9)'); g.addColorStop(0.8, 'rgba(255,220,200,1)'); g.addColorStop(1, 'rgba(255,190,170,1)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(pX(X - 0.04, 2), pY(2)); ctx.lineTo(pX(X + 0.04, 2), pY(2)); ctx.lineTo(pX(X + 0.04, 400), pY(400)); ctx.lineTo(pX(X - 0.04, 400), pY(400)); ctx.fill();
  });
  poles(0, -5.5, 40, 900, '#050505');
  // the three of them walk away, long shadows reaching back toward us
  const zW = 5.5 + eIO(clamp(lt / 3)) * 17 + lt * 1.2, zD = zW - 2.2 + Math.sin(lt * 3) * 0.1, walk = lt * 7;
  const shadow = (X, z, hm, wm) => { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.moveTo(pX(X - wm, z), pY(z)); ctx.lineTo(pX(X + wm, z), pY(z)); ctx.lineTo(pX(X + wm * 1.4, Math.max(1.2, z - hm * 6)), pY(Math.max(1.2, z - hm * 6))); ctx.lineTo(pX(X - wm * 1.4, Math.max(1.2, z - hm * 6)), pY(Math.max(1.2, z - hm * 6))); ctx.fill(); };
  shadow(-0.55, zW, 1.85, 0.25); shadow(0.55, zW, 1.75, 0.22); shadow(0.05, zD, 0.35, 0.12);
  const RIM = { base: '#050505', rim: '#ffe6dc', w: 2.2, a: 0.95 };
  ctx.save(); ctx.translate(pX(-0.55, zW), pY(zW)); const ms = 1.85 * pS(zW) / 100; ctx.scale(ms, ms); lit(manBackShape({ walk }), RIM); ctx.restore();
  const wp = { t, walk: walk + Math.PI, wind: 0.5 };
  ctx.save(); ctx.translate(pX(0.55, zW), pY(zW)); const ws = 1.72 * pS(zW) / 100; ctx.scale(ws, ws); lit(womanBackShape(wp), RIM); scarf(ctx, wp, [3.4, -84.8], 1); ctx.restore();
  const dsc = 0.42 * pS(zD) / 100; ctx.save(); ctx.translate(pX(0.05, zD), pY(zD) - 22 * dsc); ctx.scale(dsc, dsc); lit(duckShape({ land: true, walk: walk * 1.6, hat: { y: 0 } }), { ...RIM, w: 1.6 }); ctx.restore();
  // iris out, then the end card
  const ir = t < 32.3 ? 2400 : lerp(1300, 0, eIO(inv(32.3, 33.2, t)));
  if (ir < 2400) { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(-100, -100, W + 200, H + 200); ctx.arc(pX(0, zW), pY(zW) - 1.2 * pS(zW), Math.max(0, ir), 0, TAU, true); ctx.fill('evenodd'); }
  if (t > 33.15) {
    const a = smooth(33.15, 33.7, t), b = smooth(33.6, 34.2, t);
    fillAll('#000');
    FX.light = null; FX.rays = 0;
    cap('The End', W / 2, 470, F.fell(190, true), withA(SILVER, a));
    ctx.fillStyle = withA(RED, a); ctx.fillRect(W / 2 - 70, 520, 140, 4);
    cap('WORDS BY A VERY DISCERNING YOUNG SONGWRITER', W / 2, 600, F.type(28), withA(SILVER, 0.9 * b), 'center', 1, 3);
    cap('No ducks were harmed. Several hot dogs were.', W / 2, 650, F.fell(28, true), grey(150, b));
  }
  FX.hal = 0.3;
}
