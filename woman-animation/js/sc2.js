'use strict';
// Woman: scenes 4-7. The man in black at the microphone, the prison wall, the cell, the freight train.

function micShure(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#0c0c0c'; ctx.fillRect(-7, 60, 14, 520);
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, 60); ctx.lineTo(-4, 580); ctx.stroke();
  const chrome = ctx.createLinearGradient(-46, 0, 46, 0);
  [[0, '#161616'], [0.14, '#8e8e8e'], [0.24, '#ffffff'], [0.33, '#5a5a5a'], [0.55, '#1e1e1e'], [0.72, '#b0b0b0'], [0.86, '#3a3a3a'], [1, '#0e0e0e']].forEach(([o, c]) => chrome.addColorStop(o, c));
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.moveTo(-50, -10); ctx.quadraticCurveTo(-58, 30, -30, 58); ctx.lineTo(30, 58); ctx.quadraticCurveTo(58, 30, 50, -10); ctx.lineWidth = 7; ctx.strokeStyle = chrome; ctx.stroke();
  ctx.fillStyle = chrome;
  ctx.beginPath(); ctx.moveTo(-26, -78); ctx.bezierCurveTo(-46, -60, -48, 20, -30, 48); ctx.lineTo(30, 48); ctx.bezierCurveTo(48, 20, 46, -60, 26, -78); ctx.quadraticCurveTo(0, -92, -26, -78); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 2.2;
  for (let i = 0; i < 17; i++) { const yy = -58 + i * 6.2, hw = 42 - Math.abs(i - 8) * 0.9; ctx.beginPath(); ctx.moveTo(-hw + 6, yy); ctx.lineTo(hw - 6, yy); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(-20, -58, 4, 16, 0.25, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d4d4d4'; ctx.fillRect(-30, 48, 60, 7);
  ctx.restore();
  glow(x - 20 * s, y - 60 * s, 60, '#ffffff', 0.35, 'lighter');
}

function sceneStage(t, lt) {
  fillAll('#030303');
  ctx.save();
  for (let x = -40; x < W + 40; x += 58) {
    const g = ctx.createLinearGradient(x, 0, x + 58, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.035 + hash(x) * 0.03})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x, 0, 58, 820);
  }
  ctx.restore();
  ctx.fillStyle = vgrad(800, H, [[0, '#050505'], [1, '#101010']]); ctx.fillRect(-60, 800, W + 120, H);
  const flare = 1 + 0.7 * Math.exp(-Math.max(0, t - 10.72) * 5) * (t > 10.72 ? 1 : 0);
  glow(800, 860, 520, '#ffffff', 0.12 * flare);
  beam(640, -170, Math.atan2(560, 170), 0.22, 1350, 0.3 * flare, t, { haze: 16 });
  motes(t, 80, 560, 80, 480, 740, 0.55, 11);
  micShure(560, 410, 1, 0.1);
  const p = { nod: -0.04 + pulse(t, 7) * 0.06, mouth: (t > 9.8 && t < 11.3) ? 0.5 + 0.5 * Math.sin(t * 22) : 0.2 };
  const RIM = { rim: '#fff3e8', dir: [-0.42, -0.9], w: 4.5, a: 0.95 };
  ctx.save(); ctx.translate(835, 372); ctx.scale(1.05, 1.05); lit(manStageShape(p), RIM); ctx.restore();
  // guitar: silhouette, then strings and binding catching the spot
  const gx = 760, gy = 770, ga = -0.42, gs = 0.95, ca = Math.cos(ga), sa = Math.sin(ga);
  const W2 = (lx, ly) => [gx + gs * (lx * ca - ly * sa), gy + gs * (lx * sa + ly * ca)];
  const strum = pulse(t, 6), ph = beatPhase(t);
  ctx.save(); ctx.translate(gx, gy); ctx.rotate(ga); ctx.scale(gs, gs);
  lit(guitarShape, { rim: '#fff3e8', dir: [-0.1, -1], w: 3.5, a: 0.9 });
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(40, 0, 62, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(40, 0, 70, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(40, 0, 52, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-215, -48, 26, 96);
  for (let i = 0; i < 6; i++) {
    const yy = -15 + i * 6, amp = strum * 3.5 * Math.sin(t * 110 + i * 1.3);
    ctx.strokeStyle = `rgba(255,248,236,${0.35 + i * 0.05 + strum * 0.3})`; ctx.lineWidth = 0.8 + i * 0.25;
    ctx.beginPath(); ctx.moveTo(-202, yy); ctx.quadraticCurveTo(220, yy + amp, 648, yy * 0.8); ctx.lineTo(806, yy * 1.5); ctx.stroke();
  }
  ctx.restore();
  const hand = W2(30, -70 + Math.abs(Math.sin(ph * Math.PI)) * 120), fret = W2(470, 4);
  const arms = (c, col) => {
    c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = 78; c.beginPath(); c.moveTo(700, 600); c.quadraticCurveTo(600, 700, hand[0] - 20, hand[1] - 30); c.stroke();
    c.lineWidth = 70; c.beginPath(); c.moveTo(1020, 610); c.quadraticCurveTo(1110, 740, fret[0] + 10, fret[1] + 44); c.stroke();
    c.beginPath(); c.ellipse(hand[0], hand[1], 36, 46, ga + 0.3, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(fret[0], fret[1] + 6, 30, 50, ga, 0, TAU); c.fill();
    for (let i = 0; i < 4; i++) { c.lineWidth = 11; c.beginPath(); c.moveTo(fret[0] - 18 + i * 12, fret[1] - 30); c.lineTo(fret[0] - 14 + i * 13, fret[1] - 50 + Math.abs(i - 1.5) * 4); c.stroke(); }
  };
  lit(arms, RIM);
  lyric(LY.know, t, { x: 1520, y: 200, size: 150, align: 'right' });
  lyric(LY.have, t, { x: 1520, y: 410, size: 215, align: 'right', blur: 40 });
  FX.light = [640, 20]; FX.rays = 0.55 * flare; FX.rayR = 0.45; FX.hal = 0.35; FX.exposure = 0.95 + 0.12 * (flare - 1);
}

function scenePrison(t, lt) {
  fillAll(vgrad(0, 340, [[0, '#020202'], [1, '#1b1b1b']]));
  stars(t, 90, 300, 0.35);
  glow(250, 140, 240, '#ffffff', 0.18);
  ctx.drawImage(TEX.moon, 180, 70, 140, 140);
  ctx.save(); ctx.globalAlpha = 0.7; ctx.drawImage(TEX.streak, -300 + lt * 40, 110, 1800, 120); ctx.restore();
  // guard tower behind the wall
  ctx.fillStyle = '#070707';
  ctx.beginPath(); ctx.moveTo(1190, 340); ctx.lineTo(1225, 190); ctx.lineTo(1345, 190); ctx.lineTo(1380, 340); ctx.fill();
  ctx.fillRect(1180, 120, 210, 76); ctx.beginPath(); ctx.moveTo(1160, 124); ctx.lineTo(1285, 60); ctx.lineTo(1410, 124); ctx.fill();
  ctx.fillStyle = 'rgba(220,220,220,0.18)'; for (let i = 0; i < 3; i++) ctx.fillRect(1196 + i * 66, 134, 48, 30);
  ctx.strokeStyle = '#070707'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1160, 200); ctx.lineTo(1410, 200); for (let x = 1160; x <= 1410; x += 25) { ctx.moveTo(x, 200); ctx.lineTo(x, 180); } ctx.stroke();
  // the granite wall, darker toward the ground
  ctx.drawImage(TEX.granite, -40, 330, 1680, 945);
  ctx.fillStyle = vgrad(330, H, [[0, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0.78)']]); ctx.fillRect(-60, 330, W + 120, H);
  ctx.fillStyle = '#121212'; ctx.fillRect(-60, 318, W + 120, 18);
  // razor wire
  ctx.strokeStyle = '#050505'; ctx.lineWidth = 2;
  for (let x = -40; x < W + 40; x += 200) { ctx.beginPath(); ctx.moveTo(x, 320); ctx.lineTo(x, 250); ctx.lineTo(x + 22, 238); ctx.moveTo(x, 262); ctx.lineTo(x - 22, 250); ctx.stroke(); }
  ctx.beginPath(); for (let x = -40; x < W + 40; x += 30) { ctx.moveTo(x + 24, 290); ctx.ellipse(x, 290, 24, 28, 0.35, 0, TAU); } ctx.stroke();
  ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = -40; x < W + 40; x += 15) { const y = 266 + hash(x) * 50; ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); } ctx.stroke();
  // stencilled words; the searchlight follows whichever word is being sung
  const rows = [[LY.ifA, 520], [LY.ifB, 650], [LY.raised, 790]], boxes = [];
  rows.forEach(([ws, y]) => lyric(ws, t, { x: W / 2, y, size: 112, font: s => F.sten(s), col: grey(205), alpha: 0.88, flash: false, blur: 6, tilt: 0.02 }).forEach(b => boxes.push({ ...b, y: y - 40 })));
  let cur = boxes[0], prev = boxes[0];
  for (const b of boxes) if (t >= b.on - 0.05) { prev = cur; cur = b; }
  const kk = eIO(inv(cur.on - 0.05, cur.on + 0.18, t)), tx = lerp(prev.x, cur.x, kk), ty = lerp(prev.y, cur.y, kk);
  const lx = 1262, ly = 150, ang = Math.atan2(ty - ly, tx - lx), len = Math.hypot(tx - lx, ty - ly) + 200;
  beam(lx, ly, ang, 0.075, len, 0.5, t, { haze: 8 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const pool = ctx.createRadialGradient(tx, ty, 0, tx, ty, 190); pool.addColorStop(0, 'rgba(255,255,255,0.42)'); pool.addColorStop(0.6, 'rgba(255,255,255,0.12)'); pool.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(tx, ty, 260, 150, 0, 0, TAU); ctx.fill(); ctx.restore();
  glow(lx, ly, 70, '#ffffff', 0.95, 'lighter');
  smoke(t, { x: -100, y: 860, rate: 5, life: 7, vx: 60, vy: -8, spread: 30, turb: 120, s0: 260, s1: 520, alpha: 0.2, seed: 3 });
  FX.light = [lx, ly]; FX.rays = 0.6; FX.rayR = 0.3; FX.hal = 0.3;
}

function sceneCell(t, lt) {
  ctx.drawImage(TEX.granite, -40, -60, 1680, 945);
  fillAll('rgba(0,0,0,0.72)');
  // moonlight through the high window: light shafts striped by its bars
  const wx0 = 170, wx1 = 430, wy0 = 80, wy1 = 250, dx = 520, dy = 650;
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const a0 = wx0 + i * 52 + 10, a1 = a0 + 34;
    const g = ctx.createLinearGradient(0, wy0, 0, wy1 + dy); g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a0, wy0); ctx.lineTo(a1, wy0); ctx.lineTo(a1 + dx, wy1 + dy); ctx.lineTo(a0 + dx, wy1 + dy); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#050505'; for (let i = 0; i < 6; i++) ctx.fillRect(wx0 + i * 52 - 4, wy0, 16, wy1 - wy0);
  ctx.fillRect(wx0 - 8, wy0 + 78, wx1 - wx0 + 16, 12);
  // PRISON. on the back wall, crossed by the window's bar shadows
  const pk = (t - 15.30) / 0.16;
  if (pk > 0) {
    slamWord('PRISON.', 820, 690, F.sten(330), RED, clamp(pk), { rot: -0.03, blur: 30, from: 1.35 });
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(40,40,40,0.9)';
    for (let i = 0; i < 6; i++) { const a0 = wx0 + i * 52 - 4 + 330, s = 14 + i * 1.5; ctx.beginPath(); ctx.moveTo(a0, 360); ctx.lineTo(a0 + s, 360); ctx.lineTo(a0 + s + 330, 900); ctx.lineTo(a0 + 330, 900); ctx.fill(); }
    ctx.restore();
  }
  // the cell door slams down in front of the camera
  const bk = eOut(inv(15.18, 15.32, t)), drop = (1 - bk) * -H * 1.1;
  ctx.save(); ctx.translate(0, drop);
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 185, g = ctx.createLinearGradient(x - 22, 0, x + 22, 0);
    g.addColorStop(0, '#020202'); g.addColorStop(0.3, '#4a4a4a'); g.addColorStop(0.42, '#9a9a9a'); g.addColorStop(0.6, '#1a1a1a'); g.addColorStop(1, '#020202');
    ctx.fillStyle = g; ctx.fillRect(x - 22, -120, 44, H + 240);
  }
  [150, 760].forEach(y => { const g = vgrad(y - 20, y + 20, [[0, '#050505'], [0.35, '#6a6a6a'], [0.55, '#1c1c1c'], [1, '#050505']]); ctx.fillStyle = g; ctx.fillRect(-60, y - 20, W + 120, 40); ctx.fillStyle = '#8a8a8a'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(60 + i * 185, y, 6, 0, TAU); ctx.fill(); } });
  ctx.restore();
  if (t > 15.3) smoke(t, { x: W / 2, y: 880, rate: 40, life: 1.4, vx: 0, vy: -40, spread: 900, turb: 60, s0: 120, s1: 360, alpha: 0.35, seed: 8, t0: 15.3 });
  FX.light = [300, 165]; FX.rays = 0.85; FX.rayR = 0.5; FX.hal = 0.3;
}

function sceneTrain(t, lt) {
  fillAll(vgrad(0, 640, [[0, '#070707'], [0.5, '#2e2e2e'], [0.85, '#8c8c8c'], [1, '#b5b5b5']]));
  ctx.save(); ctx.globalAlpha = 0.6; ctx.drawImage(TEX.streak, -200 - lt * 30, 380, 2000, 170); ctx.restore();
  redSun(520, 540, 170, { bands: 0.5, rays: 0.95, rayR: 0.55 });
  ridge(640, 70, 0.004, 33, '#2c2c2c', { soft: true });
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(-60, 632, W + 120, H);
  ctx.fillStyle = '#161616'; ctx.fillRect(-60, 776, W + 120, 30);
  ctx.fillStyle = '#2a2a2a'; for (let i = 0; i < 400; i++) { ctx.fillRect(hash(i) * W, 790 + hash(i * 3) * 110, 3, 2); }
  ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-60, 770, W + 120, 5);
  const x0 = W + 80 - lt * 2600, wheel = (x, y, r, spin) => {
    ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3c3c3c'; ctx.lineWidth = Math.max(2, r * 0.07); ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, TAU);
    for (let i = 0; i < 12; i++) { const a = spin + i * TAU / 12; ctx.moveTo(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2); ctx.lineTo(x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,230,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r - 1, -2.4, -0.8); ctx.stroke();
  };
  const spin = -lt * 34;
  // exhaust: coal smoke from the stack, steam from the cylinders
  smoke(t, { x: b => W + 80 - (b - 16.2) * 2600 + 130, y: 330, rate: 22, life: 1.8, vx: 360, vy: -170, spread: 120, turb: 160, s0: 110, s1: 520, alpha: 0.75, seed: 5, col: '#262626', t0: 16.2 });
  smoke(t, { x: b => W + 80 - (b - 16.2) * 2600 + 80, y: 720, rate: 16, life: 0.9, vx: 380, vy: -30, spread: 160, turb: 60, s0: 70, s1: 260, alpha: 0.55, seed: 9, t0: 16.2 });
  // locomotive (faces left)
  ctx.fillStyle = '#060606';
  ctx.beginPath(); ctx.moveTo(x0 - 70, 770); ctx.lineTo(x0 + 10, 650); ctx.lineTo(x0 + 40, 650); ctx.lineTo(x0 + 40, 770); ctx.fill();
  ctx.fillRect(x0 + 30, 440, 590, 190); ctx.beginPath(); ctx.ellipse(x0 + 34, 535, 40, 95, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x0 + 110, 440); ctx.lineTo(x0 + 100, 330); ctx.lineTo(x0 + 180, 330); ctx.lineTo(x0 + 170, 440); ctx.fill(); ctx.fillRect(x0 + 90, 318, 100, 20);
  ctx.beginPath(); ctx.ellipse(x0 + 330, 440, 55, 36, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x0 + 460, 440, 45, 28, 0, Math.PI, TAU); ctx.fill();
  ctx.fillRect(x0 + 600, 360, 260, 330); ctx.fillRect(x0 + 585, 346, 290, 22); ctx.fillRect(x0 + 20, 628, 860, 20);
  ctx.fillStyle = RED; ctx.fillRect(x0 + 660, 400, 130, 110);
  glow(x0 + 725, 455, 180, RED_HOT, 0.45, 'lighter');
  ctx.fillStyle = '#060606'; ctx.fillRect(x0 + 718, 400, 12, 110);
  cap('161', x0 + 725, 600, F.sten(64), grey(200));
  ctx.strokeStyle = 'rgba(255,236,224,0.45)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x0 + 30, 441); ctx.lineTo(x0 + 620, 441); ctx.moveTo(x0 + 600, 361); ctx.lineTo(x0 + 860, 361); ctx.stroke();
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x0 + 140 + i * 100, 441); ctx.lineTo(x0 + 140 + i * 100, 628); ctx.strokeStyle = 'rgba(255,236,224,0.12)'; ctx.stroke(); }
  wheel(x0 + 120, 728, 44, spin * 1.8);
  [260, 430, 600].forEach(dx => wheel(x0 + dx, 692, 80, spin));
  const crank = [Math.cos(spin) * 34, Math.sin(spin) * 34];
  ctx.strokeStyle = '#a8a8a8'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x0 + 260 + crank[0], 692 + crank[1]); ctx.lineTo(x0 + 600 + crank[0], 692 + crank[1]); ctx.stroke();
  ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x0 + 70, 660); ctx.lineTo(x0 + 430 + crank[0], 692 + crank[1]); ctx.stroke();
  // headlight
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x0 + 10, 380, 70, 60);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x0 + 12, 410, 24, 0, TAU); ctx.fill();
  glow(x0 + 12, 410, 420, '#ffffff', 0.55, 'lighter');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const hb = ctx.createLinearGradient(x0 + 12, 0, x0 - 1100, 0); hb.addColorStop(0, 'rgba(255,255,255,0.35)'); hb.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hb; ctx.beginPath(); ctx.moveTo(x0 + 12, 400); ctx.lineTo(x0 - 1100, 250); ctx.lineTo(x0 - 1100, 620); ctx.lineTo(x0 + 12, 420); ctx.fill(); ctx.restore();
  // tender and boxcars
  const tx0 = x0 + 900;
  ctx.fillStyle = '#080808'; ctx.fillRect(tx0, 470, 460, 230); ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.moveTo(tx0 + 10, 470); ctx.quadraticCurveTo(tx0 + 230, 410, tx0 + 450, 470); ctx.fill();
  [tx0 + 90, tx0 + 190, tx0 + 280, tx0 + 380].forEach(x => wheel(x, 730, 42, spin * 1.9));
  const words = ['BOOM', 'CHICKA', 'BOOM', 'CHICKA', 'BOOM', 'CHICKA'];
  words.forEach((wd, k) => {
    const x = tx0 + 500 + k * 580; if (x > W + 60 || x + 540 < -60) return;
    ctx.fillStyle = k % 2 ? '#101010' : '#1b1b1b'; ctx.fillRect(x, 400, 540, 310);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 1; i < 14; i++) { ctx.moveTo(x + i * 38, 400); ctx.lineTo(x + i * 38, 710); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 14; i++) { ctx.fillRect(x + 8 + i * 38, 408, 3, 3); ctx.fillRect(x + 8 + i * 38, 700, 3, 3); }
    ctx.fillStyle = '#070707'; ctx.fillRect(x - 12, 388, 564, 18); ctx.fillRect(x + 200, 440, 140, 250);
    ctx.strokeStyle = 'rgba(255,236,224,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 12, 389); ctx.lineTo(x + 552, 389); ctx.stroke();
    cap(wd, x + 270, 600, F.sten(118), grey(215));
    [x + 70, x + 160, x + 380, x + 470].forEach(wx => wheel(wx, 736, 38, spin * 2));
    ctx.fillStyle = '#050505'; ctx.fillRect(x + 530, 650, 60, 16);
  });
  // sparks under the wheels
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) { const px = (hash(i + Math.floor(t * 30)) * W), py = 760 + hash(i * 3.1 + Math.floor(t * 30)) * 30; ctx.fillStyle = hash(i) > 0.5 ? 'rgba(255,200,170,0.8)' : 'rgba(255,90,60,0.8)'; ctx.fillRect(px, py, 2 + hash(i * 7) * 14, 1.5); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const y = 330 + hash(i + Math.floor(lt * 24)) * 440, x = hash(i * 3) * W; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 300, y); ctx.stroke(); }
  if (!REDUCE) { FX.exposure = 1 + (hash(Math.floor(t * 24)) - 0.5) * 0.08; }
  FX.hal = 0.35;
}
