/* Scenes, part A: intro through the second chorus.
   Every scene is draw(c, t) with the global song time t, keyed to the word timings in LINES. */
'use strict';

const LS = (i) => LINES[i][1];
const LE = (i) => LINES[i][2];
const WT = (i, j) => LINES[i][3][j][1];
const PORCH = 462; // world y of the cliff-top grass in the diorama

function beatZoom(c, t, amt = 0.018) {
  if (REDUCED_MOTION) return;
  const z = 1 + amt * beatInfo(t).pulse;
  c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
}
function applyShake(c, t, t0, amp = 16, dur = 0.5) { const [x, y] = shake(t, t0, amp, dur); c.translate(x, y); }
/* anime sound-effect lettering that pops at t0 */
function sfx(c, s, x, y, t, t0, o = {}) {
  const dur = o.dur ?? 1.2;
  if (t < t0 || t > t0 + dur) return;
  const p = pop(t, t0, 0.32), fade = 1 - seg(t, t0 + dur - 0.25, t0 + dur);
  c.save(); c.globalAlpha *= fade;
  c.translate(x, y); c.rotate((o.rot || 0) + Math.sin((t - t0) * 18) * 0.035);
  c.scale(p, p);
  const size = o.size || 96, fill = o.fill || '#fff';
  glow(c, 0, 0, size * 1.6, rgba(isHex(fill) ? fill : '#ffffff', 0.35));
  txt(c, s, 0, 0, { size, font: o.font || DISPLAY, weight: 400, fill, stroke: o.stroke || (isHex(fill) ? mix(fill, '#1e1235', 0.78) : INK), lw: size * 0.2 });
  c.restore();
}
function clipPoly(c, pts) { c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
/* diagonal manga split: a() fills the left panel, b() the right */
function split(c, a, b, x0 = 1130, x1 = 790) {
  c.save(); clipPoly(c, [[-20, -20], [x0, -20], [x1, H + 20], [-20, H + 20]]); c.clip(); a(); c.restore();
  c.save(); clipPoly(c, [[x0, -20], [W + 20, -20], [W + 20, H + 20], [x1, H + 20]]); c.clip(); b(); c.restore();
  line(c, x0, -20, x1, H + 20, 'rgba(20,10,46,0.55)', 30); line(c, x0, -20, x1, H + 20, '#fff', 14);
}
function daySky(c, t, x = -200, y = -200, w = W + 400, h = H + 400) {
  fillGrad(c, 0, y, 0, y + h, [[0, '#4aa8ff'], [0.6, '#9ad6ff'], [1, '#e2f6ff']], x, y, w, h);
  glow(c, x + w * 0.2, y + 330, 420, 'rgba(255,248,200,0.95)');
  const sg = c.createRadialGradient(x + w * 0.2 - 20, y + 310, 6, x + w * 0.2, y + 330, 80); sg.addColorStop(0, '#fffbe0'); sg.addColorStop(1, '#ffd84a');
  circle(c, x + w * 0.2, y + 330, 80); fs(c, sg, '#d09a20', 5);
  for (let k = 0; k < 5; k++) {
    const cx = x + ((t * 25 * (1 + k * 0.2) + k * 520) % (w + 400)) - 200, cy = y + 300 + (k % 3) * 120;
    cloudPath(c, cx, cy, 190, 64, 7, k);
    const cg = c.createLinearGradient(0, cy - 50, 0, cy + 40); cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, '#dceaff');
    fs(c, cg, '#8aa8d0', 4);
  }
}
function dioCam(c, cx, cy, z) { camera(c, cx, cy, z); }
function drift(c, t, t0, t1, z0, z1, fx = W / 2, fy = H / 2) {
  const z = lerp(z0, z1, easeInOut(seg(t, t0, t1)));
  c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy);
}
function lerpCam(t, a, b, e = easeInOut) { const k = e(clamp(t)); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }

/* ================= INTRO ================= */
const TITLE_COLS = [['#fff7cc', '#ffbf3f'], ['#ffe0f0', '#ff6fa8'], ['#dcfff0', '#4fd08f'], ['#ece4ff', '#9a74ff'], ['#dff2ff', '#5aa8ff']];
function sIntro(c, t) {
  const kDive = easeInOut(seg(t, 0, 4.6));
  const kRise = easeInOut(seg(t, 4.7, 8.8));
  const kZoom = easeInCubic(seg(t, 8.8, 9.95));
  let cx = lerp(680, 1560, kRise), cy = lerp(lerp(1600, 1790, kDive), 250, kRise);
  let z = lerp(1.2, 1.05, kRise) - 0.5 * Math.sin(kRise * Math.PI);
  cx = lerp(cx, 1600, kZoom); cy = lerp(cy, 137, kZoom); z = lerp(z, 5.2, kZoom);
  c.save();
  dioCam(c, cx, cy, z);
  diorama(c, t, { attic: true, porch: 0.9, moonX: 1000, moonY: 120 });
  c.restore();
  if (kRise > 0 && kRise < 1) { c.save(); c.globalAlpha = Math.sin(kRise * Math.PI); bubblesFx(c, t * 3, 30, 0, 0, W, H, { speed: 260, r: 22 }); c.restore(); }
  if (t < 5.3) {
    const out = easeInCubic(seg(t, 4.55, 5.2));
    c.save();
    c.globalAlpha = 1 - out;
    c.translate(0, -out * 500);
    glow(c, W / 2, 260, 820, 'rgba(14,8,48,0.75)');
    bouncyText(c, "We Don't Wake", W / 2, 170, t, 0.55, { size: 118, colors: TITLE_COLS });
    bouncyText(c, 'CTHULHU', W / 2, 340, t, 1.45, { size: 190, colors: [['#eafff4', '#4fcf8e'], ['#dcfff0', '#3fbf80']], gap: 0.09, track: 6 });
    const sp = seg(t, 2.3, 2.9);
    c.globalAlpha *= sp;
    const pill = pRRect(W / 2 - 330, 446, 660, 124, 40);
    c.fillStyle = 'rgba(16,8,46,0.7)'; c.fill(pill); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.18)'; c.stroke(pill);
    txt(c, '♪  a cozy cosmic lullaby  ♪', W / 2, 486, { size: 48, fill: '#fff6e6', lw: 8, stroke: '#1c1040' });
    txt(c, 'song by thepottershand', W / 2, 538, { size: 32, fill: '#d6c6ff', lw: 6, weight: 500, stroke: '#1c1040' });
    for (let k = 0; k < 7; k++) sparkle(c, W / 2 + Math.cos(t * 1.5 + k) * 640, 300 + Math.sin(t * 2 + k * 1.7) * 210, 14 + 8 * Math.sin(t * 5 + k), '#fff');
    c.restore();
  }
}

/* ================= VERSE 1 ================= */
function sPolish(c, t) {
  c.save();
  beatZoom(c, t, 0.012);
  drift(c, t, 9.9, 14.5, 1.12, 1.26, 960, 700);
  roomBg(c, t);
  roundWindow(c, 330, 330, 170, t);
  bookshelf(c, 1640, 830, 1.1, t);
  const scrub = t > WT(0, 1) - 0.1 ? 1 : 0.4;
  const sw = Math.sin(t * 15) * 0.42 * scrub;
  drawKid(c, 930, 740, 1.35, { t, air: hop(t, 10), eyes: t > WT(0, 7) ? 'star' : 'happy', sing: true, armL: 0.55 + sw, armR: 0.55 - sw, holdR: 'cloth', sq: squash(t, 0.06), noShadow: true });
  drawAltar(c, 960, 1010, 1.45, t, { shine: seg(t, WT(0, 1), WT(0, 4)) });
  for (const [cx, cy] of [[790, 735], [1130, 735]]) drawCandle(c, cx, cy, 0.9, t, 1);
  motes(c, t, 30, 250, 300, 700, 600, 41, 'rgba(230,225,255,0.6)', 1.2);
  if (scrub > 0.5) { for (let k = 0; k < 3; k++) line(c, 1150 + k * 10, 700 + k * 26, 1230 + k * 14, 690 + k * 26, 'rgba(255,255,255,0.8)', 6); }
  sfx(c, 'shine!', 1260, 600, t, WT(0, 3), { size: 70, fill: '#ffe27a', rot: 0.2, dur: 1.0 });
  const cp = pop(t, WT(0, 5) - 0.15, 0.4);
  if (cp > 0) {
    c.save(); c.translate(1430, 450); c.rotate(0.06); c.scale(cp * 0.9, cp * 0.9);
    c.save(); c.translate(10, 14); rrect(c, -170, -200, 340, 400, 22); c.fillStyle = 'rgba(15,8,40,0.3)'; c.fill(); c.restore();
    cel(c, pRRect(-170, -200, 340, 400, 22), '#fff6e6', { shadow: '#efe0c8', d: 8, line: '#6a4a3a', lw: 6 });
    cel(c, pRRect(-60, -222, 120, 40, 12), '#c48a5a', { d: 4, line: '#4a2a10' });
    txt(c, 'seals:', 0, -140, { size: 44, font: DISPLAY, weight: 400, fill: '#6b3fc9', stroke: false, shadow: false });
    const names = ['wax', 'wax', 'baby'];
    for (let k = 0; k < 3; k++) {
      const yy = -60 + k * 100;
      if (k < 2) { const wg = c.createRadialGradient(-98, yy - 8, 3, -90, yy, 32); wg.addColorStop(0, '#ff8a9a'); wg.addColorStop(1, '#c8283f'); circle(c, -90, yy, 30); fs(c, wg, '#6a1020', 5); softStar(c, -90, yy, 13); c.fillStyle = 'rgba(255,200,210,0.8)'; c.fill(); }
      else { c.save(); c.translate(-90, yy + 26); c.scale(0.45, 0.45); drawSeal(c, 0, 0, 1, t); c.restore(); }
      txt(c, names[k], 10, yy, { size: 38, fill: '#2a1b3d', stroke: false, align: 'left', shadow: false });
      const ck = pop(t, [WT(0, 5), WT(0, 6), WT(0, 7)][k], 0.3);
      if (ck > 0) { c.save(); c.translate(120, yy); c.scale(ck, ck); c.beginPath(); c.moveTo(-26, 0); c.lineTo(-6, 22); c.lineTo(30, -26); fs(c, null, '#0f5a30', 16); c.beginPath(); c.moveTo(-26, 0); c.lineTo(-6, 22); c.lineTo(30, -26); fs(c, null, '#4fd08a', 9); c.restore(); }
    }
    c.restore();
  }
  const sp = pop(t, WT(0, 7), 0.45);
  if (sp > 0) {
    c.save(); c.translate(560, 900); c.scale(sp, sp);
    drawSeal(c, 0, hop(t, 16), 1.5, t);
    c.restore();
    sfx(c, 'arf!', 470, 700, t, WT(0, 7) + 0.1, { size: 80, fill: '#8fd3ff', rot: -0.2 });
    heartsFx(c, t, 5, 450, 620, 240, 260, 7, 0.8);
  }
  c.restore();
}

function sCandles(c, t) {
  c.save();
  beatZoom(c, t, 0.02);
  drift(c, t, 14.4, 17.8, 1.12, 1.24, 960, 720);
  roomBg(c, t, { wall1: '#231a58', wall2: '#3a2e82', floorY: 520, floor1: '#5a3a2c', floor2: '#8a5a40' });
  c.fillStyle = 'rgba(12,6,36,0.35)'; c.fillRect(-300, -300, W + 600, H + 600);
  const wheelGlow = 0.45 + seg(t, WT(1, 7) - 0.1, WT(1, 7) + 0.3) * 0.8;
  const b0 = beatInfo(WT(1, 1) - 0.12).i + 1;
  const cands = [];
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k / 7) * TAU + 0.25;
    cands.push({ k, x: 960 + Math.cos(a) * 560, y: 800 + Math.sin(a) * 200, tp: beatTime(b0 + k) });
  }
  // warm light pools grow as candles light
  for (const cd of cands) { const lit = seg(t, cd.tp + 0.12, cd.tp + 0.5); if (lit > 0) glowE(c, cd.x, cd.y, 170 * lit, 60 * lit, 'rgba(255,190,100,0.55)'); }
  ritualWheel(c, 960, 800, 560, 200, t * (1 + wheelGlow), wheelGlow);
  const drawHero = () => drawKid(c, 960, 800, 1.05, { t, air: hop(t, 18), sing: true, eyes: 'open', armR: 2.5, handR: 'point', armL: 0.3, sq: squash(t, 0.08) });
  cands.sort((p, q) => p.y - q.y);
  let heroDrawn = false;
  for (const cd of cands) {
    if (!heroDrawn && cd.y > 800) { drawHero(); heroDrawn = true; }
    const p = pop(t, cd.tp, 0.35);
    if (p <= 0) continue;
    const sc = (0.75 + (cd.y - 600) / 800) * p;
    drawCandle(c, cd.x, cd.y, sc * 1.25, t, seg(t, cd.tp + 0.12, cd.tp + 0.3));
    const np = t - cd.tp;
    if (np > 0 && np < 0.9) { c.save(); c.globalAlpha = 1 - seg(np, 0.6, 0.9); txt(c, String(cd.k + 1), cd.x, cd.y - 190 * sc - np * 60, { size: 70, font: DISPLAY, weight: 400, fill: '#ffe27a', lw: 12, stroke: '#6a3a08' }); c.restore(); }
  }
  if (!heroDrawn) drawHero();
  sfx(c, '7 / 7 ✦', 960, 170, t, WT(1, 7), { size: 84, fill: '#ffe27a' });
  c.restore();
}

function rune(c, x, y, s, k) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath();
  switch (k % 5) {
    case 0: c.arc(0, 0, 16, 0.4, TAU - 0.4); c.moveTo(0, -24); c.lineTo(0, 24); break;
    case 1: c.moveTo(-18, 18); c.lineTo(0, -20); c.lineTo(18, 18); c.moveTo(-10, 4); c.lineTo(10, 4); break;
    case 2: for (let a = 0; a < 9; a += 0.4) c.lineTo(Math.cos(a) * a * 2.4, Math.sin(a) * a * 2.4); break;
    case 3: c.moveTo(-16, -16); c.lineTo(16, 16); c.moveTo(16, -16); c.lineTo(-16, 16); c.arc(0, 0, 8, 0, TAU); break;
    default: c.moveTo(-18, 0); c.quadraticCurveTo(0, -30, 18, 0); c.quadraticCurveTo(0, 30, -18, 0);
  }
  fs(c, null, c.strokeStyle, 5);
  c.restore();
}
function sScroll(c, t) {
  c.save();
  beatZoom(c, t, 0.012);
  drift(c, t, 17.8, 21.2, 1.08, 1.18, 900, 660);
  roomBg(c, t, { wall1: '#3a2c80', wall2: '#5a47aa' });
  bookshelf(c, 250, 830, 1.1, t);
  roundWindow(c, 1650, 300, 150, t);
  const lt = t - LS(2);
  const len = clamp((t - (LS(2) - 0.2)) / 3.2) * 1500;
  if (len > 5) {
    c.save();
    c.beginPath();
    c.moveTo(900, 640);
    c.bezierCurveTo(960, 820, 980, 900, 1060, 910);
    c.lineTo(1060 + len, 910 + Math.sin(t * 2) * 6);
    c.lineWidth = 130; c.strokeStyle = '#6a4a2a'; c.lineCap = 'butt'; c.stroke();
    c.lineWidth = 118; c.strokeStyle = '#fff0cc'; c.stroke();
    c.lineWidth = 40; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.translate(0, -30); c.stroke();
    c.restore();
    c.save(); c.strokeStyle = '#a07a4a';
    for (let k = 0; k < 18; k++) { const rx = 1100 + k * 80; if (rx < 1060 + len - 30) rune(c, rx, 910, 0.9, k); }
    c.restore();
    const eg = c.createRadialGradient(1050 + len, 898, 6, 1060 + len, 910, 64); eg.addColorStop(0, '#f6dca8'); eg.addColorStop(1, '#c49a5a');
    circle(c, 1060 + len, 910, 62); fs(c, eg, '#5a3a18', 6);
    circle(c, 1060 + len, 910, 24); fs(c, '#b0884a', '#5a3a18', 4);
  }
  drawKid(c, 820, 760, 1.4, { t, air: hop(t, 6, 2), glasses: true, eyes: t > WT(2, 6) && t < WT(2, 7) + 0.3 ? 'happy' : 'open', brows: 'worry', sing: true, armL: 0.9, armR: 0.9, holdR: 'scroll', sweat: t > WT(2, 5) });
  c.save(); c.strokeStyle = '#ffe9a0';
  for (let k = 0; k < 10; k++) {
    const life = 2.2, ph = ((lt + k * 0.33) % life) / life;
    const rx = 820 + Math.sin(ph * 6 + k) * 180 + (k - 5) * 30, ry = 470 - ph * 380;
    c.globalAlpha = Math.sin(ph * Math.PI) * clamp(lt * 2);
    glow(c, rx, ry, 50, 'rgba(255,220,120,0.55)');
    rune(c, rx, ry, 1.3, k);
  }
  c.restore();
  const dp = seg(t, WT(2, 5), WT(2, 5) + 1.2);
  if (dp > 0 && dp < 1) {
    for (let k = 0; k < 6; k++) { c.save(); c.globalAlpha = (1 - dp) * 0.9; glow(c, 980 + k * 70 + dp * 80 * Math.cos(k), 760 - dp * 160 * (0.5 + rnd(k, 3)), 90 * (0.6 + dp), 'rgba(240,230,210,0.8)'); c.restore(); }
    sfx(c, 'cough!', 560, 420, t, WT(2, 6), { size: 64, fill: '#efe2cc', rot: -0.15, dur: 1 });
  }
  sfx(c, '♪ memorized ♪', 820, 190, t, WT(2, 7) + 0.1, { size: 64, fill: '#ffe27a', dur: 0.9 });
  c.restore();
}

function sTentacle(c, t) {
  c.save();
  applyShake(c, t, WT(3, 8), 26, 0.7);
  roomBg(c, t, { wall1: '#35287a', wall2: '#5646a6' });
  const gulp = t > WT(3, 8);
  const tp = pop(t, LS(3) - 0.2, 0.5);
  thought(c, 1130, 450, 1380, 720, t, tp, () => {
    fillGrad(c, 0, 80, 0, 820, [[0, '#ff8fc0'], [0.6, '#ffc49a'], [1, '#ffe2a8']], 400, 60, 1500, 800);
    glow(c, 1400, 300, 300, 'rgba(255,240,200,0.7)');
    for (let k = 0; k < 3; k++) { cloudPath(c, 600 + k * 420 + Math.sin(t + k) * 20, 200 + k * 30, 180, 60, 7, k); fs(c, 'rgba(255,255,255,0.9)', null); }
    const rise = easeOutBack(seg(t, WT(3, 3) - 0.2, WT(3, 4)));
    const gone = seg(t, WT(3, 5), WT(3, 8) + 0.1);
    neighborhood(c, 1130, 760, 1.05, t, { gone: gone * 1.8 });
    bigTentacle(c, 1150 + Math.sin(t * 2) * 30, 860, 620, t, rise, { curl: gone * 0.9 });
    if (gulp) sfx(c, 'GULP!', 1130, 380, t, WT(3, 8), { size: 150, fill: '#8fe3b0', rot: -0.1, dur: 1.5 });
  }, [420, 720]);
  const shocked = t > WT(3, 3);
  drawKid(c, 330, 1000, 1.35, { t, eyes: gulp ? 'shock' : 'open', sing: !shocked, mouth: gulp ? 'O' : shocked ? 'o' : undefined, gloom: gulp, sweat: shocked, armL: gulp ? 2.9 : 0.3, armR: gulp ? 2.9 : 0.3, handL: 'open', handR: 'open', look: 0.8 });
  c.restore();
}

/* ================= PRE-CHORUS 1 ================= */
function sMoonBook(c, t) {
  const tb = WT(4, 5) - 0.25;
  const moonPanel = () => {
    burst(c, 700, 540, t, '#2f2272', '#43349a', 22);
    twinkles(c, t, 40, 0, 0, W, H, 7);
    drawMoon(c, 700, 540 + hop(t, 20), 1.9, { t, shades: true, tilt: Math.sin(t * 6) * 0.06 });
    const bp = pop(t, WT(4, 3) - 0.05, 0.3);
    if (bp > 0) {
      c.save(); c.translate(700, 170); c.scale(bp, bp);
      bubble(c, 0, 0, 480, 200, -60, 190, { spiky: true, fill: '#ffe27a' });
      txt(c, 'DO IT!', 0, 0, { size: 110, font: DISPLAY, weight: 400, fill: '#ff4f7a', lw: 18, stroke: '#6a1030' });
      c.restore();
    }
  };
  const bookPanel = () => {
    burst(c, 1400, 560, t, '#ff8fc7', '#ffb3d6', 22, 2400, -0.3);
    const op = t > WT(4, 8) - 0.1 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 12)) : 0.2 * Math.abs(Math.sin(t * 8));
    drawBook(c, 1420, 900, 1.9, { t, air: hop(t, 16), open: op, tilt: Math.sin(t * 5) * 0.08 });
    const bp = pop(t, WT(4, 8) - 0.05, 0.3);
    if (bp > 0) {
      c.save(); c.translate(1450, 210); c.scale(bp, bp);
      bubble(c, 0, 0, 520, 200, -40, 200, { spiky: true, fill: '#ffffff' });
      txt(c, 'BEGIN!', 0, 0, { size: 110, font: DISPLAY, weight: 400, fill: '#7b4fd6', lw: 18, stroke: '#2a1060' });
      c.restore();
    }
  };
  if (t < tb) { c.save(); beatZoom(c, t, 0.03); moonPanel(); c.restore(); return; }
  const k = easeOutCubic(seg(t, tb, tb + 0.35));
  c.save(); beatZoom(c, t, 0.03);
  split(c, () => { c.save(); c.translate(-180 * k, 0); moonPanel(); c.restore(); }, () => { c.save(); c.translate((1 - k) * 900, 0); bookPanel(); c.restore(); }, lerp(W + 400, 1150, k), lerp(W + 60, 800, k));
  c.restore();
}

function sClock(c, t) {
  c.save();
  beatZoom(c, t, 0.015);
  drift(c, t, 27.5, 31.5, 1.18, 1.32, 900, 560);
  roomBg(c, t, { wall1: '#3a2c82', wall2: '#5e4ab0' });
  roundWindow(c, 330, 300, 150, t, { shades: true });
  groundShadow(c, 960, 1040, 640, 40, 0.4);
  cel(c, pRRect(380, 700, 1160, 50, 14), '#b07a52', { shadow: '#8a5a38', d: 7, hi: '#d8a070', line: '#4a2a10' });
  cel(c, pRRect(420, 750, 40, 300, 8), '#7a4f33', { d: 6 }); cel(c, pRRect(1460, 750, 40, 300, 8), '#7a4f33', { d: 6 });
  const wise = t > WT(5, 5) - 0.1;
  drawBook(c, 1350, 702, 0.9, { t, face: 'grin', open: wise ? 0 : 0.3, tilt: -0.1 });
  if (wise) sweatDrop(c, 1440, 470, 0.9);
  const land = LS(5) + 0.45;
  const jk = seg(t, LS(5) - 0.15, land);
  const jy = t < land ? -Math.sin(jk * Math.PI) * 380 + (1 - jk) * 500 : hop(t, 14);
  const jx = t < land ? lerp(1100, 900, jk) : 900;
  const ring = t > WT(5, 3) - 0.05 && t < WT(5, 5) + 0.1 ? 1 : 0;
  const sqk = t >= land && t < land + 0.25 ? 1 - 0.25 * Math.sin(seg(t, land, land + 0.25) * Math.PI) : squash(t, 0.06);
  if (jk > 0) drawClock(c, jx, 702, 1.7, { t, air: jy, ring, face: wise ? (t > WT(5, 6) ? 'talk' : 'wise') : ring ? 'alarm' : 'smile', wag: wise, armR: wise ? 2.7 + Math.sin(t * 12) * 0.25 : 0.5, armL: 0.5, sq: sqk });
  if (ring) { sfx(c, 'RING!', 560, 330, t, WT(5, 3), { size: 100, fill: '#ff6b6b', rot: -0.25, dur: 0.9 }); sfx(c, 'RING!', 1260, 280, t, WT(5, 4) - 0.1, { size: 100, fill: '#ffd166', rot: 0.2, dur: 0.9 }); }
  const bp = pop(t, WT(5, 6) - 0.1, 0.35);
  if (bp > 0) {
    c.save(); c.translate(900, 250); c.scale(bp * 0.9, bp * 0.9);
    bubble(c, 0, 0, 900, 150, 40, 200, { fill: '#fff6e6' });
    txt(c, 'Think this through, friend.', 0, 0, { size: 62, font: DISPLAY, weight: 400, fill: '#2a1b3d', stroke: false, shadow: false });
    c.restore();
  }
  c.restore();
}

function sHands(c, t) {
  c.save();
  beatZoom(c, t, 0.015);
  drift(c, t, 31.5, 35.3, 1.1, 1.2, 960, 640);
  roomBg(c, t, { wall1: '#35287e', wall2: '#5442a4' });
  const raised = seg(t, WT(6, 3), WT(6, 4) + 0.1);
  const onDoor = seg(t, WT(6, 6), WT(6, 8));
  c.save(); c.translate(430, 380);
  glow(c, 0, 0, 380, `rgba(180,140,255,${0.3 + raised * 0.45})`);
  c.rotate(t * 0.8);
  for (let k = 0; k < 3; k++) { circle(c, 0, 0, 170 - k * 45); c.lineWidth = 16 - k * 3; c.strokeStyle = `rgba(190,160,255,${0.2 + raised * 0.2})`; c.stroke(); c.lineWidth = 6 - k; c.strokeStyle = `rgba(240,230,255,${0.55 + raised * 0.45})`; c.stroke(); }
  softStar(c, 0, 0, 120, 7, t, 0.55); c.lineWidth = 5; c.stroke();
  c.restore();
  txt(c, 'summon?', 430, 640, { size: 48, font: DISPLAY, weight: 400, fill: '#e2d6ff', lw: 8, stroke: '#2a1a6a' });
  drawDoor(c, 1520, 930, 1.35, t, { open: 0.25 + onDoor * 0.35, sign: true });
  const tug = Math.sin(t * 4.4) * 0.12;
  drawKid(c, 960, 930, 1.45, { t, tilt: tug, eyes: 'open', brows: 'worry', sing: true, armL: 0.3 + raised * 2.5, handL: 'open', armR: 0.3 + onDoor * 1.25, look: Math.sin(t * 2.2), sweat: onDoor > 0.5 });
  if (raised > 0) for (let k = 0; k < 6; k++) sparkle(c, 680 + Math.cos(t * 3 + k) * 80, 520 + Math.sin(t * 4 + k) * 80, 10 + 6 * Math.sin(t * 8 + k), '#efe6ff');
  c.restore();
}

function sUnsure(c, t) {
  c.save();
  beatZoom(c, t, 0.02);
  fillGrad(c, 0, 0, 0, H, [[0, '#c8b2ff'], [1, '#ffbcd8']], 0, 0, W, H);
  c.save(); c.translate(W / 2, H / 2); c.rotate(t * 0.4);
  for (let k = 0; k < 12; k++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(200, -60, 500, 100, 1400, -80); c.lineWidth = 40; c.strokeStyle = 'rgba(255,255,255,0.22)'; c.stroke(); }
  c.restore();
  bokeh(c, t, 14, 0, 0, W, H, ['#ffffff', '#ffe0f0', '#e6dcff'], 71, 1.6, 0.4);
  const qs = [WT(7, 2), WT(7, 3), WT(7, 5)];
  const spin = t > WT(7, 1) - 0.1 && t < WT(7, 2);
  drawKid(c, 960, 1240, 2.6, { t, eyes: spin ? 'spiral' : 'open', brows: 'worry', sing: true, sweat: t > WT(7, 3), look: Math.sin(t * 3) * 0.8, armL: 0.9 + Math.sin(t * 5) * 0.2, armR: 0.9 - Math.sin(t * 5) * 0.2, handL: 'open', handR: 'open', noShadow: true });
  qs.forEach((q, k) => { const p = pop(t, q, 0.35); if (p > 0) { c.save(); c.translate([520, 1400, 1180][k], [330, 300, 150][k] + Math.sin(t * 4 + k) * 12); c.scale(p, p); glow(c, 0, 0, 110, 'rgba(255,255,255,0.5)'); question(c, 0, 0, 1.6, ['#ffd166', '#ff8fc7', '#8fd3ff'][k], (k - 1) * 0.3); c.restore(); } });
  const pf = seg(t, WT(7, 6), WT(7, 6) + 1);
  if (pf > 0 && pf < 1) {
    c.save(); c.globalAlpha = 1 - pf;
    cloudPath(c, 380, 700 - pf * 120, 120 + pf * 100, 80 + pf * 60, 8, 2); fs(c, '#efeaff', '#8a80b0', 4);
    c.restore();
    sfx(c, 'pfft…', 380, 560, t, WT(7, 6), { size: 70, fill: '#c9c0e6', rot: -0.1 });
  }
  c.restore();
}

function sStir(c, t) {
  const cut = snapBeat(LE(7) + 1.2);
  {
    c.save();
    const z = 1.6 + seg(t, LE(7), cut) * 0.5;
    applyShake(c, t, LE(7) + 0.4, 8, 0.6);
    dioCam(c, DIO.cthX + 20, DIO.floor - 300, z);
    diorama(c, t, { cth: { mood: 'peek', eyeOpen: easeOutCubic(seg(t, LE(7) + 0.35, LE(7) + 0.7)) } });
    c.restore();
    c.fillStyle = 'rgba(10,6,40,0.25)'; c.fillRect(0, 0, W, H);
    sfx(c, '!?', 1260, 300, t, LE(7) + 0.45, { size: 150, fill: '#ffe27a', rot: 0.15 });
  }
}
function sIdea(c, t) {
  const t0 = SCENES[sceneIndexAt(t)].t0;
  c.save();
  beatZoom(c, t, 0.03);
  burst(c, W / 2, 620, t, '#f4b85a', '#ffd88a', 24);
  drawKid(c, 960, 1180, 2.2, { t, eyes: 'star', mouth: 'open', armL: 2.6, armR: 0.3, handL: 'point', noShadow: true });
  lightbulb(c, 960, 170, 1.4 * pop(t, t0, 0.3), t);
  c.restore();
}

/* ================= CHORUS (shared pieces) ================= */
function porchCast(c, t, list) {
  for (const [kind, x, op] of list) {
    const e = Object.assign({ t }, op || {});
    e.air = e.noHop ? 0 : hop(t, e.hopAmp ?? 14, e.every ?? 1, e.off ?? 0);
    e.sq = e.noHop ? 1 : squash(t, 0.08, e.every ?? 1, e.off ?? 0);
    const y = PORCH + (e.dy || 0);
    const s = e.s || 0.62;
    if (kind === 'kid') drawKid(c, x, y, s, e);
    else if (kind === 'mabel') drawMabel(c, x, y, s, e);
    else if (kind === 'mail') drawMailman(c, x, y, s, e);
    else if (kind === 'clock') drawClock(c, x, y, s * 0.9, e);
    else if (kind === 'book') drawBook(c, x, y, s * 0.75, e);
    else if (kind === 'cat') drawTailorCat(c, x, y, s, e);
    else if (kind === 'friendA') drawKid(c, x, y, s, Object.assign(e, { colors: FRIEND_A }));
    else if (kind === 'friendB') drawKid(c, x, y, s, Object.assign(e, { colors: FRIEND_B }));
  }
}
const SHH = { armR: 3.8, handR: 'shh', mouth: 'shh', eyes: 'happy' };

function sC1a(c, t) {
  c.save();
  beatZoom(c, t);
  const z = lerp(1.45, 1.62, easeOutCubic(seg(t, LS(8) - 0.5, LS(8) + 1)));
  dioCam(c, 1360, 300, z);
  diorama(c, t, { porch: 1, moonX: 1020, moonY: 60, moonFace: t > WT(8, 2) ? 'shh' : 'smile' });
  const shh = t > WT(8, 1) - 0.2 && t < WT(8, 4);
  porchCast(c, t, [
    ['book', 1160, { face: 'grin', noHop: !shh, s: 0.6 }],
    ['kid', 1290, Object.assign({ s: 0.68 }, shh ? SHH : { eyes: 'happy', sing: true })],
    ['clock', 1440, { face: shh ? 'wise' : 'happy', wag: shh, armR: shh ? 2.6 : 0.4, s: 0.6, sing: !shh }],
  ]);
  c.restore();
  sfx(c, 'shhh…', 660, 300, t, WT(8, 2), { size: 150, fill: '#b8f0d4', rot: -0.12, dur: 2.2 });
  heartsFx(c, t, 6, 1100, 200, 600, 600, 11, 0.9);
}
function kelpCurtain(c, x, y, h, t, side) {
  for (let k = 0; k < 4; k++) seaweed(c, x + side * k * 34, y, h - k * 40, t, k % 2 ? '#3fbf8f' : '#5fd4a4', k * 2 + (side > 0 ? 7 : 0));
}
function sC1b(c, t) {
  c.save();
  const pan = seg(t, LS(9) - 0.3, LS(9) + 0.9);
  const [cx, cy, z] = lerpCam(pan, [1360, 300, 1.6], [DIO.cthX + 20, DIO.floor - 250, 1.25]);
  if (pan > 0 && pan < 1 && !REDUCED_MOTION) c.translate(0, Math.sin(pan * Math.PI) * 10);
  dioCam(c, cx, cy, z);
  const sign = easeOutBack(seg(t, WT(9, 5) - 0.1, WT(9, 5) + 0.3));
  diorama(c, t, { sign, cth: { mood: 'sleep', hug: 'fish' } });
  const close = easeInOut(seg(t, WT(9, 6), WT(9, 8) + 0.3));
  kelpCurtain(c, DIO.cthX - 520 + close * 230, DIO.floor + 30, 560, t, 1);
  kelpCurtain(c, DIO.cthX + 560 - close * 230, DIO.floor + 30, 560, t, -1);
  c.restore();
  if (pan > 0 && pan < 1) { c.save(); c.globalAlpha = Math.sin(pan * Math.PI); bubblesFx(c, t * 4, 26, 0, 0, W, H, { speed: 300, r: 20 }); c.restore(); }
}
function dreamBubble(c, x, y, w, h, t, p, fn) {
  thought(c, x, y, w, h, t, p, () => {
    fillGrad(c, 0, y - h / 2, 0, y + h / 2, [[0, '#ffd9ee'], [1, '#d8caff']], x - w, y - h, w * 2, h * 2);
    twinkles(c, t, 20, x - w / 2, y - h / 2, w, h, 13);
    fn();
  }, [x - w * 0.55, y + h * 0.75]);
}
function sC1c(c, t) {
  const bright = easeOutCubic(seg(t, WT(10, 10) - 0.1, WT(10, 12)));
  split(c, () => {
    c.save();
    dioCam(c, DIO.cthX + 180, DIO.floor - 330, 1.25);
    diorama(c, t, { sign: 1, cth: { mood: 'smile', hug: 'fish' } });
    c.restore();
    dreamBubble(c, 520, 280, 560, 330, t, pop(t, WT(10, 2) - 0.1, 0.5), () => {
      for (let k = 0; k < 4; k++) {
        const ph = (t * 0.6 + k / 4) % 1;
        drawFish(c, 300 + ph * 460, 330 - Math.sin(ph * Math.PI) * 140, 0.9, t, { color: ['#ffb347', '#8fe3b0', '#ff9ecf', '#8fd3ff'][k], seed: k });
      }
      cel(c, pRRect(470, 340, 100, 30, 14), '#ff9ecf', { d: 3, lw: 4 });
      txt(c, 'counting fish…', 520, 170, { size: 34, fill: '#6b3fc9', stroke: false, weight: 600, shadow: false });
    });
  }, () => {
    c.save();
    dioCam(c, 1500, 330, 1.7);
    diorama(c, t, { porch: 0.25 + bright * 0.95, moonX: 1100, moonY: 80 });
    porchCast(c, t, [['kid', 1560, { s: 0.7, eyes: 'happy', sing: true, armR: 2.4 + Math.sin(t * 9) * 0.3, handR: 'open' }]]);
    fireflies(c, t, 16, 1250, 150, 500, 260, 5);
    c.restore();
    sfx(c, 'click!', 1500, 820, t, WT(10, 10), { size: 70, fill: '#ffe27a', rot: 0.15 });
  });
}
function sC1d(c, t) {
  c.save();
  beatZoom(c, t, 0.025);
  dioCam(c, 1330, 290, 1.55);
  diorama(c, t, { porch: 0.8 + 0.2 * beatInfo(t).pulse, moonX: 1030, moonY: 70, moonShades: true });
  const b = beatInfo(t);
  const side = b.i % 2 ? 1 : -1;
  porchCast(c, t, [
    ['book', 1110, { s: 0.6, face: 'grin', open: 0.3, tilt: side * 0.12 }],
    ['kid', 1260, { s: 0.68, eyes: 'happy', sing: true, tilt: side * 0.1, armL: b.i % 2 ? 2.7 : 0.6, armR: b.i % 2 ? 0.6 : 2.7, handL: 'open', handR: 'open' }],
    ['clock', 1410, { s: 0.6, face: 'happy', sing: true, tilt: -side * 0.12, armL: 2.4, armR: 2.4 }],
  ]);
  notesFx(c, t, 8, 1000, 0, 700, 450, 17, '#ffe9a0');
  c.restore();
}
function sC1e(c, t) {
  c.save();
  const k = easeInOut(seg(t, LS(12) - 0.4, LE(12) + 0.3));
  const [cx, cy, z] = lerpCam(k, [960, 1150, 0.47], [DIO.cthX + 60, DIO.floor - 380, 0.9]);
  dioCam(c, cx, cy, z);
  diorama(c, t, { sign: 1, porch: 1, moonX: 700, moonY: 140, cth: { mood: 'smile', hug: 'fish' } });
  porchCast(c, t, [['kid', 1290, { s: 0.62, eyes: 'happy', sing: true, armL: 2.5, armR: 2.5, handL: 'open', handR: 'open' }], ['clock', 1420, { s: 0.6, face: 'happy', armL: 2.3, armR: 2.3 }], ['book', 1170, { s: 0.6 }]]);
  heartsFx(c, t, 10, DIO.cthX - 300, DIO.floor - 900, 600, 600, 21, 2);
  c.restore();
}

/* ================= VERSE 2 ================= */
function sDelivery(c, t) {
  c.save();
  daySky(c, t);
  c.save(); dioCam(c, 1520, 250, 1.5);
  drawCliff(c, 1080, DIO.cliffY, 1100, 1400, t);
  drawHouse(c, DIO.houseX + 150, DIO.cliffY, 0.95, t, { porch: 0.2 });
  const t0 = 58.7;
  const wk = seg(t, t0, t0 + 1.4);
  const mx = lerp(1060, 1380, wk);
  drawMailman(c, mx, PORCH, 0.62, { t, air: wk < 1 ? -Math.abs(Math.sin(t * 9)) * 8 : hop(t, 6), hold: null, armL: 0.3, armR: wk >= 1 ? 2.4 : 0.3, face: 'happy', walk: wk < 1 ? t * 9 : undefined });
  const box = t < t0 + 2.3;
  if (box) giftBox(c, mx - 60, PORCH - 50, 0.32, t);
  const door = pop(t, t0 + 1.9, 0.3);
  if (door > 0) drawKid(c, 1600, PORCH, 0.62 * door, { t, eyes: 'star', mouth: 'open', armL: 2.5, armR: 2.5, handL: 'open', handR: 'open' });
  if (!box) giftBox(c, 1600, PORCH - 120, 0.3, t);
  c.restore();
  sfx(c, 'ding dong!', 1250, 250, t, t0 + 1.4, { size: 90, fill: '#ffe27a', rot: -0.1 });
  c.restore();
}

function sRobe(c, t) {
  c.save();
  const dram = seg(t, WT(13, 6) - 0.05, WT(13, 6) + 0.25);
  applyShake(c, t, WT(13, 6), 14, 0.5);
  roomBg(c, t, { wall1: '#5e4aae', wall2: '#8068d0' });
  if (dram > 0) {
    c.save(); c.globalAlpha = dram;
    burst(c, W / 2, 560, t, '#140a36', '#26145c', 18, 2400, 0.1);
    for (let k = 0; k < 3; k++) {
      const lx = 300 + k * 650 + rnd(Math.floor(t * 3), k) * 100;
      c.beginPath(); c.moveTo(lx, 0); c.lineTo(lx + 40, 200); c.lineTo(lx - 10, 220); c.lineTo(lx + 50, 420);
      c.lineWidth = 22; c.strokeStyle = 'rgba(255,240,150,0.25)'; c.stroke(); c.lineWidth = 7; c.strokeStyle = 'rgba(255,248,200,0.95)'; c.stroke();
    }
    c.restore();
  }
  const lid = easeOutBack(seg(t, WT(13, 1) - 0.1, WT(13, 1) + 0.3));
  if (t < WT(13, 3) + 0.5) giftBox(c, 1400, 960, 0.9, t, lid);
  if (lid > 0.3 && t < WT(13, 3)) { glow(c, 1400, 760, 260 * lid, 'rgba(255,240,180,0.7)'); for (let k = 0; k < 8; k++) sparkle(c, 1400 + Math.cos(k) * 220 * lid, 700 - Math.sin(k * 1.3) * 180 * lid, 20, '#fff'); }
  const s0 = WT(13, 3) - 0.35, s1 = WT(13, 3) + 0.15;
  const spinK = seg(t, s0, s1);
  const sx = spinK > 0 && spinK < 1 ? Math.cos(spinK * Math.PI * 4) : 1;
  const robed = t > (s0 + s1) / 2;
  groundShadow(c, 820, 990, 150, 32, 0.4);
  c.save(); c.translate(820, 0); c.scale(Math.abs(sx) < 0.08 ? 0.08 : sx, 1); c.translate(-820, 0);
  drawKid(c, 820, 990, 1.9, {
    t, air: hop(t, 8, 2), noShadow: true, outfit: robed ? 'robe' : 'hoodie', hood: dram > 0.3 ? 1 : 0, dramatic: dram,
    eyes: dram > 0.5 ? 'glow' : robed ? 'star' : 'open', mouth: dram > 0.5 ? 'flat' : undefined, sing: dram <= 0.5,
    armL: dram > 0.5 ? 1.2 : 0.4, armR: dram > 0.5 ? 1.2 : 0.4,
  });
  c.restore();
  if (spinK > 0 && spinK < 1) for (let k = 0; k < 5; k++) line(c, 600, 500 + k * 110, 1040, 520 + k * 110, 'rgba(255,255,255,0.7)', 8);
  sfx(c, 'DRAMATIC', 1320, 300, t, WT(13, 6), { size: 120, fill: '#ffe27a', rot: -0.08, dur: 1.4 });
  if (dram > 0.5) for (let k = 0; k < 6; k++) line(c, 0, 200 + k * 140 + Math.sin(t * 20 + k) * 20, 360 + rnd(k, 7) * 300, 210 + k * 140, 'rgba(255,255,255,0.5)', 6);
  c.restore();
}

function sTailor(c, t) {
  c.save();
  beatZoom(c, t, 0.012);
  drift(c, t, 64.7, 68.5, 1.0, 1.1, 960, 620);
  fillGrad(c, 0, 0, 0, H, [[0, '#ffe0ef'], [1, '#ffbcd9']], -300, -300, W + 600, H + 600);
  for (let k = 0; k < 8; k++) {
    c.save(); c.translate(150 + k * 230, 140 + (k % 2) * 40); c.rotate(Math.sin(t * 2 + k) * 0.08);
    line(c, 0, -30, 0, 0, '#8a5a6a', 4);
    const col = ['#7b4fd6', '#8fe3b0', '#ffd166', '#6fb7ff'][k % 4];
    cel(c, pRRect(-70, 0, 140, 170, 12), col, { d: 9, hi: lighten(col, 0.3) });
    c.restore();
  }
  fillGrad(c, 0, 850, 0, H, [[0, '#f0a8c8'], [1, '#e08ab4']], -300, 850, W + 600, 400);
  line(c, -300, 850, W + 300, 850, '#a05a80', 6);
  glowE(c, 960, 880, 800, 60, 'rgba(255,255,255,0.35)');
  bokeh(c, t, 8, 0, 0, W, 500, ['#ffffff', '#ffe0f0'], 81, 1.3, 0.35);
  const catIn = easeOutBack(seg(t, WT(14, 1) - 0.4, WT(14, 1) + 0.1));
  drawTailorCat(c, lerp(2300, 1380, catIn), 900, 1.55, { t, air: hop(t, 10), sq: squash(t, 0.06) });
  const cozy = t > WT(14, 5) - 0.1;
  drawKid(c, 620, 900, 1.55, { t, air: hop(t, 8, 2), outfit: 'robe', hood: 0, eyes: cozy ? 'closed' : 'star', sing: true, blush: cozy ? 2 : 1, armL: cozy ? 2.2 : 0.5, armR: 0.5, tilt: cozy ? -0.12 : 0 });
  const b0 = beatInfo(WT(14, 3) - 0.1).i + 1;
  for (let k = 0; k < 5; k++) {
    const p = pop(t, beatTime(b0 + ((k * 0.5) | 0)) + (k % 2) * 0.22, 0.3);
    if (p > 0) {
      c.save(); c.translate(1010 + (k - 2) * 120, 330 + Math.sin(t * 5 + k) * 8); c.scale(p, p);
      glow(c, 0, 0, 90, 'rgba(255,220,120,0.55)');
      softStar(c, 0, 0, 52); const sg = c.createLinearGradient(0, -52, 0, 52); sg.addColorStop(0, '#fff6c0'); sg.addColorStop(1, '#ffbf3a'); fs(c, sg, '#8a5a10', 6);
      c.restore();
    }
  }
  if (cozy) { for (let k = 0; k < 6; k++) sparkle(c, 620 + Math.cos(t * 2 + k) * 220, 560 + Math.sin(t * 3 + k) * 160, 12 + 6 * Math.sin(t * 6 + k), '#fff'); sfx(c, 'so soft~', 560, 250, t, WT(14, 5), { size: 80, fill: '#ffffff', stroke: '#a0507a', rot: -0.1, dur: 1.4 }); }
  c.restore();
}

function sPlan(c, t) {
  c.save();
  beatZoom(c, t, 0.012);
  drift(c, t, 68.5, 72, 1.0, 1.08, 1100, 520);
  roomBg(c, t, { wall1: '#3a2c80', wall2: '#5a47aa' });
  const tp = pop(t, LS(15) - 0.1, 0.5);
  thought(c, 1150, 440, 1300, 760, t, tp, () => {
    fillGrad(c, 0, 60, 0, 820, [[0, '#fff8ec'], [1, '#ffe4f0']], 400, 40, 1500, 900);
    const rev = seg(t, WT(15, 3) - 0.1, WT(15, 6) + 0.2);
    planBoard(c, 1300, 800, 1.1, t, rev * 1.01);
    const pointAt = [WT(15, 3), WT(15, 4), WT(15, 6)].filter((x) => t > x).length;
    drawKid(c, 820, 790, 0.95, { t, air: hop(t, 6), outfit: 'robe', hood: 0, eyes: 'happy', sing: true, armR: 1.9 + pointAt * 0.12, holdR: 'pointer' });
  }, [360, 780]);
  drawKid(c, 330, 1060, 1.3, { t, outfit: 'robe', hood: 0, eyes: 'open', sing: true, armR: 2.4, look: 0.8 });
  c.restore();
}

function sMabel(c, t) {
  c.save();
  drift(c, t, 72, 75.7, 1.04, 1.16, 1000, 720);
  roomBg(c, t, { wall1: '#ff9ecb', wall2: '#ffbcd9', floorY: 860, floor1: '#b07a5a', floor2: '#d09a78', base: '#a05a80', panel2: 'rgba(120,20,70,0.14)' });
  glow(c, 1650, 250, 360, 'rgba(255,245,210,0.55)');
  groundShadow(c, 1210, 850, 540, 40, 0.4);
  cel(c, pRRect(760, 560, 900, 200, 60), '#6fb7ff', { shadow: '#4f98e8', d: 14, hi: '#a8d4ff', line: '#1a4a8a' });
  cel(c, pRRect(700, 700, 1020, 150, 50), '#8fcaff', { shadow: '#6aaef0', d: 12, hi: '#c0e2ff', line: '#1a4a8a' });
  const blankM = t > WT(16, 3) - 0.05, blankP = t > WT(16, 7) - 0.05;
  drawMabel(c, 1000, 800, 1.2, { t, noShadow: true, face: blankM ? 'blank' : 'smile', spill: blankM ? seg(t, WT(16, 4), WT(16, 4) + 0.4) * 1.1 : 0 });
  drawMailman(c, 1400, 800, 1.2, { t, noShadow: true, face: blankP ? 'blank' : 'smile', hold: blankP ? null : 'letters', armL: blankP ? 0.1 : 0.9 });
  if (blankP) for (let k = 0; k < 3; k++) { const d = seg(t, WT(16, 7), WT(16, 7) + 0.6); c.save(); c.translate(1300 + k * 40, 700 + d * 180); c.rotate(d * 3 + k); drawEnvelope(c, 0, 0, 0.5); c.restore(); }
  planBoard(c, 1780, 1180, 0.9, t, 1);
  drawKid(c, 360, 1010, 1.5, { t, outfit: 'robe', hood: 0, eyes: blankP ? 'dot' : 'happy', sing: !blankP, mouth: blankP ? 'flat' : undefined, sweat: blankM, armR: 1.9, holdR: 'pointer' });
  const dots = seg(t, WT(16, 7) + 0.2, WT(16, 7) + 0.9);
  if (dots > 0) { c.save(); c.translate(1200, 300); bubble(c, 0, 0, 280, 120, -80, 140, { fill: '#fff' }); for (let k = 0; k < 3; k++) if (dots > k / 3) { circle(c, -60 + k * 60, 0, 13); c.fillStyle = '#3a2a55'; c.fill(); } c.restore(); }
  sfx(c, 'chirp…', 1600, 460, t, WT(16, 7) + 0.4, { size: 56, fill: '#8fe3b0', rot: 0.1, dur: 1.2 });
  c.restore();
}

/* ================= PRE-CHORUS 2 ================= */
function sStarsTide(c, t) {
  c.save();
  beatZoom(c, t, 0.025);
  nightSky(c, t, 0, 0, W, H, { stars: 130 });
  const summon = t > WT(17, 3) - 0.1;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + t * 0.3;
    drawStarBuddy(c, 760 + Math.cos(a) * 470, 430 + Math.sin(a) * 250, 0.95 + 0.1 * Math.sin(t * 6 + k), { t, shout: summon, seed: k });
  }
  const sp = pop(t, WT(17, 3) - 0.08, 0.3);
  if (sp > 0) { c.save(); c.translate(760, 430); c.scale(sp, sp); bubble(c, 0, 0, 560, 190, 120, 200, { spiky: true, fill: '#ffe27a' }); txt(c, 'SUMMON!', 0, 0, { size: 100, font: DISPLAY, weight: 400, fill: '#7b4fd6', lw: 16, stroke: '#2a1060' }); c.restore(); }
  const wr = easeOutBack(seg(t, WT(17, 5) - 0.3, WT(17, 7)));
  if (wr > 0) {
    seaSurface(c, t, 1000 - wr * 60, -100, W + 200, 200);
    drawWaveBuddy(c, 1540, 1120 + (1 - wr) * 500, 1.6, { t, shout: t > WT(17, 7) - 0.05 });
    const gp = pop(t, WT(17, 7) - 0.05, 0.3);
    if (gp > 0) { c.save(); c.translate(1500, 330); c.scale(gp, gp); bubble(c, 0, 0, 520, 180, 60, 200, { spiky: true, fill: '#c4ecff' }); txt(c, 'GO DEEP!', 0, 0, { size: 96, font: DISPLAY, weight: 400, fill: '#1b3f7a', lw: 14, stroke: '#081a3a' }); c.restore(); }
  }
  c.restore();
}

function sSleep(c, t) {
  c.save();
  drift(c, t, 78.3, 82.1, 1.12, 1.28, 820, 680);
  if (!REDUCED_MOTION) { c.translate(W / 2, H / 2); c.rotate(Math.sin(t * 1.2) * 0.012); c.translate(-W / 2, -H / 2); }
  bedroomBg(c, t);
  cel(c, pRRect(420, 560, 420, 170, 70), '#ffffff', { shadow: '#e8e2f4', d: 10, line: '#7a6aa8' });
  const cuddle = t > WT(18, 3) - 0.1;
  drawKid(c, 700, 900 + Math.sin(t * 2.5) * 4, 1.45, { t, noShadow: true, eyes: cuddle ? 'closed' : 'sleepy', sing: 0.55, mask: true, blush: cuddle ? 2 : 1, armL: 1.3, armR: 1.1, tilt: -0.15, noBlink: true });
  quilt(c, 380, 700, 960, 200, t);
  c.save(); c.translate(900, 760); c.rotate(-0.2); cel(c, pRRect(-100, -50, 200, 100, 40), '#ffc2dc', { shadow: '#f09ac0', d: 8, hi: '#ffe0ee' }); heartPath(c, 0, 8, 22); c.fillStyle = '#ff8fc7'; c.fill(); c.restore();
  zzz(c, 820, 470, t, 1.4, '#ffffff');
  if (t > WT(18, 6) - 0.2) heartsFx(c, t, 6, 600, 300, 500, 400, 31, 1);
  sfx(c, 'so cozy…', 1150, 300, t, WT(18, 6), { size: 80, fill: '#ffe0f0', stroke: '#6a2a5a', rot: 0.06, dur: 1.4 });
  c.restore();
}

function sKeyRhyme(c, t) {
  c.save();
  beatZoom(c, t, 0.02);
  burst(c, W / 2, 470, t, '#231356', '#34207a', 24, 2400, 0.15);
  twinkles(c, t, 50, 0, 0, W, H, 91);
  const kp = easeOutBack(seg(t, WT(19, 3) - 0.35, WT(19, 4)));
  const rp = easeOutBack(seg(t, WT(19, 8) - 0.35, WT(19, 9) + 0.05));
  if (kp > 0) {
    const kx = rp > 0 ? lerp(960, 640, easeInOut(seg(t, WT(19, 5), WT(19, 8)))) : 960;
    lightShaft(c, kx - 60, -40, kx + 60, kx - 260, 900, kx + 260, '#fff0b0', 0.3 * kp);
    glow(c, kx, 430, 380 * kp, 'rgba(255,230,140,0.8)');
    c.save(); c.translate(kx, 470 + Math.sin(t * 2) * 16); c.rotate(Math.sin(t * 1.5) * 0.15); drawKey(c, 0, -60, 2.3 * kp, t); c.restore();
    for (let k = 0; k < 8; k++) sparkle(c, kx + Math.cos(t + k) * 260, 430 + Math.sin(t * 1.3 + k) * 220, 14 + 8 * Math.sin(t * 5 + k), '#fff6c8');
  }
  if (rp > 0) {
    glow(c, 1280, 430, 380 * rp, 'rgba(200,170,255,0.75)');
    c.save(); c.translate(1280, 430 + Math.cos(t * 2) * 14); c.scale(rp, rp);
    cel(c, pRRect(-170, -220, 340, 440, 16), '#fff3d6', { shadow: '#f0dcb0', d: 10, line: '#8a6a3a' });
    for (const yy of [-250, 200]) { const rg = c.createLinearGradient(0, yy, 0, yy + 50); rg.addColorStop(0, '#f6dca8'); rg.addColorStop(1, '#c49a5a'); rrect(c, -190, yy, 380, 50, 25); fs(c, rg, '#5a3a18', 5); }
    for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) noteGlyph(c, -110 + j * 72, -130 + k * 80, 0.8, ['#7b4fd6', '#ff6f9f', '#3fbf8f', '#4f98e8'][(j + k) % 4], 0, (j + k) % 2 === 0);
    c.restore();
    notesFx(c, t, 6, 1100, 150, 360, 400, 41, '#efe6ff');
  }
  drawKid(c, 960, 1300, 2.0, { t, outfit: 'robe', hood: 0, eyes: 'star', sing: true, armL: 1.3, armR: 1.3, handL: 'open', handR: 'open', noShadow: true });
  txt(c, 'sacred key', 640 + (1 - kp) * 1000, 860, { size: 52, font: DISPLAY, weight: 400, fill: '#ffe27a', lw: 10, stroke: '#5a3a08' });
  if (rp > 0.5) txt(c, 'ancient rhyme', 1280, 860, { size: 52, font: DISPLAY, weight: 400, fill: '#e2d6ff', lw: 10, stroke: '#2a1a6a' });
  c.restore();
}

function sPaperweight(c, t) {
  c.save();
  beatZoom(c, t, 0.012);
  drift(c, t, 85.8, 91.3, 1.06, 1.18, 1100, 620);
  roomBg(c, t, { wall1: '#43358a', wall2: '#6552b5', floorY: 900 });
  roundWindow(c, 1650, 280, 140, t, { floorY: 900 });
  groundShadow(c, 950, 950, 700, 40, 0.4);
  cel(c, pRRect(300, 640, 1300, 50, 14), '#b07a52', { shadow: '#8a5a38', d: 7, hi: '#d8a070', line: '#4a2a10' });
  cel(c, pRRect(340, 690, 40, 260, 8), '#7a4f33', { d: 6 }); cel(c, pRRect(1520, 690, 40, 260, 8), '#7a4f33', { d: 6 });
  c.save(); c.translate(460, 520);
  cel(c, pRRect(-14, 20, 28, 100, 8), '#9fd8ff', { d: 5, line: '#2a5a8a' }); cel(c, pEllipse(0, 120, 60, 16), '#9fd8ff', { d: 4, line: '#2a5a8a' });
  circle(c, 0, 0, 90); fs(c, 'rgba(200,235,255,0.45)', '#2a5a8a', 6);
  c.rotate(t * 30); for (let k = 0; k < 3; k++) { c.rotate(TAU / 3); cel(c, pEllipse(0, -45, 22, 42), '#6fb7ff', { d: 3, lw: 3, line: '#1a4a8a' }); }
  c.restore();
  const plop = WT(20, 9);
  const fly = t < plop ? 1 : 0;
  paperStack(c, 1000, 634, 1.2, t, fly);
  if (fly) for (let k = 0; k < 6; k++) { const ph = (t * 0.9 + k / 6) % 1; c.save(); c.translate(560 + ph * 1400, 520 - Math.sin(ph * 5 + k) * 120 - ph * 200); c.rotate(t * 5 + k); cel(c, pRRect(-50, -34, 100, 68, 4), '#ffffff', { d: 4, lw: 3.5, line: '#8a7aa8' }); c.restore(); }
  const dk = seg(t, plop - 0.35, plop);
  if (t > WT(20, 3) - 0.2) {
    const yk = lerp(260, 530, easeInCubic(dk));
    c.save(); c.translate(940, yk); c.rotate(-1.35); drawKey(c, 0, 0, 0.8, t); c.restore();
    c.save(); c.translate(1090, yk + 20); drawProp(c, 'scroll', t); c.restore();
  }
  sfx(c, 'plonk!', 1010, 420, t, plop, { size: 90, fill: '#ffe27a', rot: -0.12, dur: 1 });
  const tag = pop(t, WT(20, 8) - 0.1, 0.35);
  if (tag > 0) { c.save(); c.translate(1300, 470); c.rotate(0.12 + Math.sin(t * 3) * 0.04); c.scale(tag, tag); line(c, -120, 20, -60, 10, '#8a5a10', 4); cel(c, pRRect(-60, -40, 300, 90, 20), '#ffd166', { d: 6, hi: '#fff0b0', line: '#8a5a10' }); txt(c, 'very fancy ✦', 90, 5, { size: 44, font: DISPLAY, weight: 400, fill: '#6b3fc9', stroke: false, shadow: false }); c.restore(); }
  const wink = t > WT(20, 10) - 0.1;
  drawKid(c, 1450, 950, 1.3, { t, air: hop(t, 6, 2), outfit: 'robe', hood: 0, eyes: wink ? 'wink' : 'open', sing: !wink, mouth: wink ? 'tongue' : undefined, armL: wink ? 0.5 : 0.9, armR: wink ? 2.6 : 0.6, handR: wink ? 'thumb' : undefined, holdL: t > plop + 0.8 ? 'cup' : undefined });
  c.restore();
}

/* ================= CHORUS 2 ================= */
function sC2a(c, t) {
  c.save();
  beatZoom(c, t);
  dioCam(c, 1330, 290, 1.5);
  diorama(c, t, { porch: 1, moonX: 1000, moonY: 70, moonFace: 'shh' });
  const shh = t > WT(21, 1) - 0.25 && t < WT(21, 4);
  const S2 = shh ? SHH : { eyes: 'happy', sing: true };
  porchCast(c, t, [
    ['mabel', 1060, { s: 0.6, face: 'smile', cup: true, sing: !shh }],
    ['kid', 1190, Object.assign({ s: 0.66, outfit: 'robe', hood: 0 }, S2)],
    ['mail', 1320, { s: 0.6, face: 'happy', sing: !shh }],
    ['clock', 1450, { s: 0.58, face: 'wise', wag: shh, armR: shh ? 2.6 : 0.4 }],
  ]);
  c.restore();
  sfx(c, 'shhh…', 620, 280, t, WT(21, 2), { size: 150, fill: '#b8f0d4', rot: -0.12, dur: 2.2 });
}
function sC2b(c, t) {
  c.save();
  dioCam(c, DIO.cthX + 20, DIO.floor - 260, 1.35);
  const bl = easeInOut(seg(t, WT(22, 4) - 0.4, WT(22, 6)));
  const sign = easeOutBack(seg(t, WT(22, 6) - 0.1, WT(22, 6) + 0.3));
  diorama(c, t, { sign, blanket: bl, cth: { mood: 'sleep', hug: 'fish' } });
  const hx = lerp(DIO.cthX - 330, DIO.cthX - 220, bl);
  drawCrab(c, hx, DIO.floor - 30 + hop(t, 10), 1.3, t, { wave: true });
  drawFish(c, DIO.cthX + 330 - bl * 80, DIO.floor - 330 + Math.sin(t * 3) * 20, 1.4, t, { color: '#ffb347', flip: true });
  drawFish(c, DIO.cthX + 400 - bl * 60, DIO.floor - 200 + Math.cos(t * 3) * 20, 1.2, t, { color: '#8fd3ff', flip: true, seed: 4 });
  c.restore();
  sfx(c, 'tuck tuck', 1400, 250, t, WT(22, 4), { size: 80, fill: '#ffe0f0', stroke: '#6a2a5a', rot: 0.1 });
}
function sC2c(c, t) {
  const lights = seg(t, WT(23, 10) - 0.2, WT(23, 12) + 0.1);
  split(c, () => {
    c.save();
    dioCam(c, DIO.cthX + 180, DIO.floor - 330, 1.25);
    diorama(c, t, { sign: 1, blanket: 1, cth: { mood: 'smile', hug: 'fish' } });
    c.restore();
    dreamBubble(c, 520, 280, 580, 340, t, pop(t, WT(23, 2) - 0.1, 0.5), () => {
      cloudPath(c, 520, 380, 360, 90, 8, 9); fs(c, '#fff', '#8aa8d0', 4);
      c.save(); c.translate(520, 330 + hop(t, 50)); c.scale(0.42, 0.42); drawCthulhu(c, 0, 0, 1, { t, mood: 'happy', armsUp: 1, cap: true, noShadow: true }); c.restore();
      for (let k = 0; k < 5; k++) sparkle(c, 330 + k * 95, 180 + Math.sin(t * 3 + k) * 20, 12, '#fff');
    });
  }, () => {
    c.save();
    dioCam(c, 1480, 300, 1.6);
    diorama(c, t, { porch: 1, moonX: 1100, moonY: 60 });
    const hx = DIO.houseX + 150;
    c.beginPath(); for (let k = 0; k < 12; k++) { const u = k / 11; c.lineTo(hx - 270 + u * 540, DIO.cliffY - 262 + Math.sin(u * Math.PI) * 30); } c.lineWidth = 3; c.strokeStyle = '#3a2a55'; c.stroke();
    for (let k = 0; k < 12; k++) {
      const u = k / 11, lx = hx - 270 + u * 540, ly = DIO.cliffY - 262 + Math.sin(u * Math.PI) * 30;
      const on = lights > u * 0.9;
      const col = ['#ffe27a', '#ff9ecf', '#8fe3b0'][k % 3];
      if (on) glow(c, lx, ly, 46, rgba(col, 0.85));
      circle(c, lx, ly + 6, 9); fs(c, on ? col : '#6a6a8a', '#3a2a55', 3);
    }
    porchCast(c, t, [['mabel', 1260, { s: 0.6, face: 'happy', sing: true }], ['kid', 1380, { s: 0.64, outfit: 'robe', hood: 0, eyes: 'happy', sing: true, armR: 2.4, handR: 'open' }]]);
    c.restore();
  });
}
function sC2d(c, t) {
  c.save();
  beatZoom(c, t, 0.025);
  const pan = (t - LS(24) + 0.3) * 60;
  dioCam(c, 1280 + pan, 290, 1.45);
  diorama(c, t, { porch: 1, moonX: 1100, moonY: 60, moonShades: true });
  const base = 980 + (t - LS(24)) * 120;
  const order = [['cat', {}], ['clock', { face: 'happy', sing: true, armL: 2.2, armR: 0.5 }], ['book', { open: 0.4 }], ['mail', { face: 'happy', sing: true, armL: 1.2, armR: 1.2 }], ['mabel', { face: 'happy', sing: true, cup: false, armL: 1.3 }], ['kid', { outfit: 'robe', hood: 0, eyes: 'happy', sing: true, armL: 1.3, armR: 1.3 }]];
  porchCast(c, t, order.map(([k, o], i) => [k, base + i * 115, Object.assign({ s: 0.58, off: i * 0.25, tilt: Math.sin(t * 6 + i) * 0.1, walk: t * 8 + i }, o)]));
  sfx(c, 'conga!', 960, 180, t, LS(24) + 0.2, { size: 100, fill: '#ffd166', rot: -0.08, dur: 1.6 });
  c.restore();
}
function sC2e(c, t) {
  c.save();
  const k = easeInOut(seg(t, LS(25) - 0.3, LE(25)));
  const [cx, cy, z] = lerpCam(k, [DIO.cthX + 60, DIO.floor - 380, 0.95], [960, 1150, 0.47]);
  dioCam(c, cx, cy, z);
  diorama(c, t, { sign: 1, blanket: 1, porch: 1, moonX: 700, moonY: 140, cth: { mood: 'smile', hug: 'fish' } });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + t * 0.8;
    const hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    drawFish(c, DIO.cthX + hx * 26, DIO.floor - 520 + hy * 24, 1.1, t, { color: ['#ff9ecf', '#ffb347', '#ffe27a'][i % 3], flip: Math.cos(a) < 0, seed: i });
  }
  porchCast(c, t, [['mabel', 1180, { s: 0.6, face: 'happy', sing: true, armL: 2.4 }], ['kid', 1300, { s: 0.62, outfit: 'robe', hood: 0, eyes: 'happy', sing: true, armL: 2.5, armR: 2.5, handL: 'open', handR: 'open' }], ['mail', 1420, { s: 0.6, face: 'happy', sing: true, armR: 2.4, armL: 2.4 }]]);
  c.restore();
}
