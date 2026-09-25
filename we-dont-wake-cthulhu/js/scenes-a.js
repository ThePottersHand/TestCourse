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
function flash(c, t, t0, dur = 0.3, a = 0.85, col = '255,255,255') {
  if (REDUCED_MOTION || t < t0 || t > t0 + dur) return;
  c.fillStyle = `rgba(${col},${a * (1 - (t - t0) / dur)})`; c.fillRect(0, 0, W, H);
}
/* anime sound-effect lettering that pops at t0 */
function sfx(c, s, x, y, t, t0, o = {}) {
  const dur = o.dur ?? 1.2;
  if (t < t0 || t > t0 + dur) return;
  const p = pop(t, t0, 0.32), fade = 1 - seg(t, t0 + dur - 0.25, t0 + dur);
  c.save(); c.globalAlpha *= fade;
  c.translate(x, y); c.rotate((o.rot || 0) + Math.sin((t - t0) * 18) * 0.035);
  c.scale(p, p);
  const size = o.size || 96;
  txt(c, s, 0, 0, { size, font: o.font || DISPLAY, weight: 400, fill: o.fill || '#fff', stroke: o.stroke || INK, lw: size * 0.22 });
  c.restore();
}
function clipPoly(c, pts) { c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
/* diagonal manga split: a() fills the left panel, b() the right */
function split(c, a, b, x0 = 1130, x1 = 790) {
  c.save(); clipPoly(c, [[-20, -20], [x0, -20], [x1, H + 20], [-20, H + 20]]); c.clip(); a(); c.restore();
  c.save(); clipPoly(c, [[x0, -20], [W + 20, -20], [W + 20, H + 20], [x1, H + 20]]); c.clip(); b(); c.restore();
  line(c, x0, -20, x1, H + 20, INK, 30); line(c, x0, -20, x1, H + 20, '#fff', 18);
}
function daySky(c, t, x = -200, y = -200, w = W + 400, h = H + 400) {
  fillGrad(c, 0, y, 0, y + h, [[0, '#62b8ff'], [1, '#d6f2ff']], x, y, w, h);
  glow(c, x + w * 0.2, y + 330, 300, 'rgba(255,245,180,0.9)');
  circle(c, x + w * 0.2, y + 330, 80); fs(c, '#ffe27a', INK, 5);
  for (let k = 0; k < 5; k++) {
    const cx = x + ((t * 25 * (1 + k * 0.2) + k * 520) % (w + 400)) - 200;
    cloudPath(c, cx, y + 300 + (k % 3) * 120, 190, 64, 7, k); fs(c, '#fff', INK, 4);
  }
}
function dioCam(c, cx, cy, z) { camera(c, cx, cy, z); }
/* slow push-in over a scene (keeps static sets moving) */
function drift(c, t, t0, t1, z0, z1, fx = W / 2, fy = H / 2) {
  const z = lerp(z0, z1, easeInOut(seg(t, t0, t1)));
  c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy);
}
function lerpCam(t, a, b, e = easeInOut) { const k = e(clamp(t)); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }

/* ================= INTRO ================= */
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
  // rising bubbles in screen space during the ascent
  if (kRise > 0 && kRise < 1) { c.save(); c.globalAlpha = Math.sin(kRise * Math.PI); bubblesFx(c, t * 3, 30, 0, 0, W, H, { speed: 260, r: 22 }); c.restore(); }
  // title card
  if (t < 5.3) {
    const out = easeInCubic(seg(t, 4.55, 5.2));
    c.save();
    c.globalAlpha = 1 - out;
    c.translate(0, -out * 500);
    glow(c, W / 2, 260, 760, 'rgba(20,10,60,0.6)');
    bouncyText(c, "We Don't Wake", W / 2, 170, t, 0.55, { size: 118, colors: ['#ffe27a', '#ff9ecf', '#8fe3b0', '#b59cff', '#8fd3ff'] });
    bouncyText(c, 'CTHULHU', W / 2, 340, t, 1.45, { size: 188, colors: ['#8fe3b0', '#a8f0c6'], gap: 0.09, track: 6 });
    const sp = seg(t, 2.3, 2.9);
    c.globalAlpha *= sp;
    rrect(c, W / 2 - 330, 440, 660, 128, 40); c.fillStyle = 'rgba(18,10,46,0.72)'; c.fill();
    txt(c, '♪  a cozy cosmic lullaby  ♪', W / 2, 482, { size: 50, fill: '#fff6e6', lw: 10 });
    txt(c, 'song by thepottershand', W / 2, 536, { size: 34, fill: '#cdb8ff', lw: 8, weight: 500 });
    for (let k = 0; k < 6; k++) sparkle(c, W / 2 + Math.cos(t * 1.5 + k) * 620, 330 + Math.sin(t * 2 + k * 1.7) * 200, 14 + 8 * Math.sin(t * 5 + k), '#fff');
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
  const b = hop(t, 10);
  drawKid(c, 930, 740 + b, 1.35, { t, eyes: t > WT(0, 7) ? 'star' : 'happy', mouth: 'open', armL: 0.55 + sw, armR: 0.55 - sw, holdR: 'cloth', sq: squash(t, 0.06) });
  drawAltar(c, 960, 1010, 1.45, t, { shine: seg(t, WT(0, 1), WT(0, 4)) });
  if (scrub > 0.5) { for (let k = 0; k < 3; k++) { line(c, 1150 + k * 10, 700 + k * 26, 1230 + k * 14, 690 + k * 26, 'rgba(255,255,255,0.8)', 6); } }
  sfx(c, 'shine!', 1260, 600, t, WT(0, 3), { size: 70, fill: '#ffe27a', rot: 0.2, dur: 1.0 });
  // checklist of seals
  const cp = pop(t, WT(0, 5) - 0.15, 0.4);
  if (cp > 0) {
    c.save(); c.translate(1430, 450); c.rotate(0.06); c.scale(cp * 0.9, cp * 0.9);
    rrect(c, -170, -200, 340, 400, 22); fs(c, '#fff6e6', INK, 6);
    rrect(c, -60, -222, 120, 40, 12); fs(c, '#c48a5a', INK, 5);
    txt(c, 'seals:', 0, -140, { size: 44, font: DISPLAY, weight: 400, fill: '#6b3fc9', stroke: false });
    const names = ['wax', 'wax', 'baby'];
    for (let k = 0; k < 3; k++) {
      const yy = -60 + k * 100;
      if (k < 2) { circle(c, -90, yy, 30); fs(c, '#e84a5f', INK, 5); softStar(c, -90, yy, 13); c.fillStyle = '#ffb3c0'; c.fill(); }
      else { c.save(); c.translate(-90, yy + 26); c.scale(0.45, 0.45); drawSeal(c, 0, 0, 1, t); c.restore(); }
      txt(c, names[k], 10, yy, { size: 38, fill: '#2a1b3d', stroke: false, align: 'left' });
      const ck = pop(t, [WT(0, 5), WT(0, 6), WT(0, 7)][k], 0.3);
      if (ck > 0) { c.save(); c.translate(120, yy); c.scale(ck, ck); c.beginPath(); c.moveTo(-26, 0); c.lineTo(-6, 22); c.lineTo(30, -26); fs(c, null, INK, 16); c.beginPath(); c.moveTo(-26, 0); c.lineTo(-6, 22); c.lineTo(30, -26); fs(c, null, '#4fd08a', 9); c.restore(); }
    }
    c.restore();
  }
  // the baby seal pops up from behind the altar
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
  roomBg(c, t, { wall1: '#2b2163', wall2: '#40338a', floorY: 520 });
  c.fillStyle = 'rgba(20,10,50,0.35)'; c.fillRect(0, 0, W, H);
  const wheelGlow = 0.4 + seg(t, WT(1, 7) - 0.1, WT(1, 7) + 0.3) * 0.8;
  ritualWheel(c, 960, 800, 560, 200, t * (1 + wheelGlow), wheelGlow);
  // seven candles, one per beat
  const b0 = beatInfo(WT(1, 1) - 0.12).i + 1;
  const cands = [];
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k / 7) * TAU + 0.25;
    cands.push({ k, x: 960 + Math.cos(a) * 560, y: 800 + Math.sin(a) * 200, tp: beatTime(b0 + k) });
  }
  const kidB = hop(t, 18);
  const drawKidHere = () => drawKid(c, 960, 800 + kidB, 1.05, { t, eyes: 'open', mouth: beatInfo(t).f < 0.4 ? 'open' : 'smile', armR: 2.5, handR: 'point', armL: 0.3, sq: squash(t, 0.08) });
  cands.sort((p, q) => p.y - q.y);
  let kidDrawn = false;
  for (const cd of cands) {
    if (!kidDrawn && cd.y > 800) { drawKidHere(); kidDrawn = true; }
    const p = pop(t, cd.tp, 0.35);
    if (p <= 0) continue;
    const sc = (0.75 + (cd.y - 600) / 800) * p;
    drawCandle(c, cd.x, cd.y, sc * 1.25, t, seg(t, cd.tp + 0.12, cd.tp + 0.3));
    const np = t - cd.tp;
    if (np > 0 && np < 0.9) { c.save(); c.globalAlpha = 1 - seg(np, 0.6, 0.9); txt(c, String(cd.k + 1), cd.x, cd.y - 190 * sc - np * 60, { size: 70, font: DISPLAY, weight: 400, fill: '#ffe27a', lw: 12 }); c.restore(); }
  }
  if (!kidDrawn) drawKidHere();
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
  roomBg(c, t, { wall1: '#3f2f86', wall2: '#5e4aae' });
  bookshelf(c, 250, 830, 1.1, t);
  roundWindow(c, 1650, 300, 150, t);
  const lt = t - LS(2);
  // unrolled parchment ribbon running to the right and off-screen
  const len = clamp((t - (LS(2) - 0.2)) / 3.2) * 1500;
  if (len > 5) {
    c.save();
    c.beginPath();
    c.moveTo(900, 640);
    c.bezierCurveTo(960, 820, 980, 900, 1060, 910);
    c.lineTo(1060 + len, 910 + Math.sin(t * 2) * 6);
    c.lineWidth = 130; c.strokeStyle = INK; c.lineCap = 'butt'; c.stroke();
    c.lineWidth = 118; c.strokeStyle = '#fff0cc'; c.stroke();
    c.restore();
    c.save(); c.strokeStyle = '#a07a4a';
    for (let k = 0; k < 18; k++) { const rx = 1100 + k * 80; if (rx < 1060 + len - 30) rune(c, rx, 910, 0.9, k); }
    c.restore();
    circle(c, 1060 + len, 910, 62); fs(c, '#e8c98f', INK, 6);
    circle(c, 1060 + len, 910, 24); fs(c, '#c9a36a', INK, 4);
  }
  const chant = beatInfo(t).f < 0.5;
  drawKid(c, 820, 760 + hop(t, 6, 2), 1.4, { t, glasses: true, eyes: t > WT(2, 6) && t < WT(2, 7) + 0.3 ? 'happy' : 'open', brows: 'worry', mouth: chant ? 'o' : 'smile', armL: 0.9, armR: 0.9, holdR: 'scroll', sweat: t > WT(2, 5) });
  // floating runes from the chant
  c.save(); c.strokeStyle = '#ffe27a';
  for (let k = 0; k < 10; k++) {
    const life = 2.2, ph = ((lt + k * 0.33) % life) / life;
    c.globalAlpha = Math.sin(ph * Math.PI) * clamp(lt * 2);
    rune(c, 820 + Math.sin(ph * 6 + k) * 180 + (k - 5) * 30, 470 - ph * 380, 1.3, k);
  }
  c.restore();
  // "very old" dust puffs
  const dp = seg(t, WT(2, 5), WT(2, 5) + 1.2);
  if (dp > 0 && dp < 1) {
    for (let k = 0; k < 6; k++) { c.save(); c.globalAlpha = 1 - dp; cloudPath(c, 980 + k * 70 + dp * 80 * Math.cos(k), 760 - dp * 160 * (0.5 + rnd(k, 3)), 90 * (0.5 + dp), 50 * (0.5 + dp), 7, k); fs(c, '#e8dcc8', null); c.restore(); }
    sfx(c, 'cough!', 560, 420, t, WT(2, 6), { size: 64, fill: '#e8dcc8', rot: -0.15, dur: 1 });
  }
  sfx(c, '♪ memorized ♪', 820, 190, t, WT(2, 7) + 0.1, { size: 64, fill: '#ffe27a', dur: 0.9 });
  c.restore();
}

function sTentacle(c, t) {
  c.save();
  applyShake(c, t, WT(3, 8), 26, 0.7);
  roomBg(c, t, { wall1: '#3a2c7d', wall2: '#584aa8' });
  const gulp = t > WT(3, 8);
  const tp = pop(t, LS(3) - 0.2, 0.5);
  thought(c, 1130, 440, 1380, 720, t, tp, () => {
    // dusk sky inside the thought
    fillGrad(c, 0, 80, 0, 820, [[0, '#ff9ecf'], [1, '#ffd6a0']], 400, 60, 1500, 800);
    for (let k = 0; k < 3; k++) { cloudPath(c, 600 + k * 420 + Math.sin(t + k) * 20, 200 + k * 30, 180, 60, 7, k); fs(c, '#fff', null); }
    const rise = easeOutBack(seg(t, WT(3, 3) - 0.2, WT(3, 4)));
    const gone = seg(t, WT(3, 5), WT(3, 8) + 0.1);
    neighborhood(c, 1130, 760, 1.05, t, { gone: gone * 1.8 });
    bigTentacle(c, 1150 + Math.sin(t * 2) * 30, 860, 620, t, rise, { curl: gone * 0.9 });
    if (gulp) sfx(c, 'GULP!', 1130, 380, t, WT(3, 8), { size: 150, fill: '#8fe3b0', rot: -0.1, dur: 1.5 });
  }, [420, 720]);
  const shocked = t > WT(3, 3);
  drawKid(c, 330, 1000, 1.35, { t, eyes: gulp ? 'shock' : shocked ? 'open' : 'open', mouth: gulp ? 'O' : shocked ? 'o' : 'smile', gloom: gulp, sweat: shocked, armL: gulp ? 2.9 : 0.3, armR: gulp ? 2.9 : 0.3, handL: 'open', handR: 'open', look: 0.8 });
  c.restore();
}

/* ================= PRE-CHORUS 1 ================= */
function sMoonBook(c, t) {
  const tb = WT(4, 5) - 0.25; // the book panel slides in
  const moonPanel = () => {
    burst(c, 700, 540, t, '#3b2a7a', '#4d38a0', 22);
    twinkles(c, t, 40, 0, 0, W, H, 7);
    const b = hop(t, 20);
    drawMoon(c, 700, 540 + b, 1.9, { t, shades: true, tilt: Math.sin(t * 6) * 0.06 });
    const bp = pop(t, WT(4, 3) - 0.05, 0.3);
    if (bp > 0) {
      c.save(); c.translate(700, 170); c.scale(bp, bp);
      bubble(c, 0, 0, 480, 200, -60, 190, { spiky: true, fill: '#ffe27a' });
      txt(c, 'DO IT!', 0, 0, { size: 110, font: DISPLAY, weight: 400, fill: '#ff4f7a', lw: 18 });
      c.restore();
    }
  };
  const bookPanel = () => {
    burst(c, 1400, 560, t, '#ff8fc7', '#ffb3d6', 22, 2400, -0.3);
    const op = t > WT(4, 8) - 0.1 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 12)) : 0.2 * Math.abs(Math.sin(t * 8));
    drawBook(c, 1420, 900 + hop(t, 16), 1.9, { t, open: op, tilt: Math.sin(t * 5) * 0.08 });
    const bp = pop(t, WT(4, 8) - 0.05, 0.3);
    if (bp > 0) {
      c.save(); c.translate(1450, 210); c.scale(bp, bp);
      bubble(c, 0, 0, 520, 200, -40, 200, { spiky: true, fill: '#fff' });
      txt(c, 'BEGIN!', 0, 0, { size: 110, font: DISPLAY, weight: 400, fill: '#7b4fd6', lw: 18 });
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
  roomBg(c, t, { wall1: '#40308a', wall2: '#6552b5' });
  roundWindow(c, 330, 300, 150, t, { shades: true });
  // desk
  rrect(c, 380, 700, 1160, 50, 14); fs(c, '#a8744a', INK, 6);
  rrect(c, 420, 750, 40, 300, 8); fs(c, '#7a4f33', INK, 5); rrect(c, 1460, 750, 40, 300, 8); fs(c, '#7a4f33', INK, 5);
  const wise = t > WT(5, 5) - 0.1;
  drawBook(c, 1350, 702, 0.9, { t, face: wise ? 'grin' : 'grin', open: wise ? 0 : 0.3, tilt: -0.1 });
  if (wise) sweatDrop(c, 1440, 470, 0.9);
  // the clock jumps in
  const land = LS(5) + 0.45;
  const jk = seg(t, LS(5) - 0.15, land);
  const jy = t < land ? -Math.sin(jk * Math.PI) * 380 + (1 - jk) * 500 : hop(t, 14);
  const jx = t < land ? lerp(1100, 900, jk) : 900;
  const ring = t > WT(5, 3) - 0.05 && t < WT(5, 5) + 0.1 ? 1 : 0;
  const sqk = t >= land && t < land + 0.25 ? 1 - 0.25 * Math.sin(seg(t, land, land + 0.25) * Math.PI) : squash(t, 0.06);
  if (jk > 0) drawClock(c, jx, 702 + jy, 1.7, { t, ring, face: wise ? (t > WT(5, 6) ? 'talk' : 'wise') : ring ? 'alarm' : 'smile', wag: wise, armR: wise ? 2.7 + Math.sin(t * 12) * 0.25 : 0.5, armL: 0.5, sq: sqk });
  if (ring) { sfx(c, 'RING!', 560, 330, t, WT(5, 3), { size: 100, fill: '#ff6b6b', rot: -0.25, dur: 0.9 }); sfx(c, 'RING!', 1260, 280, t, WT(5, 4) - 0.1, { size: 100, fill: '#ffd166', rot: 0.2, dur: 0.9 }); }
  const bp = pop(t, WT(5, 6) - 0.1, 0.35);
  if (bp > 0) {
    c.save(); c.translate(900, 250); c.scale(bp * 0.9, bp * 0.9);
    bubble(c, 0, 0, 900, 150, 40, 200, { fill: '#fff6e6' });
    txt(c, 'Think this through, friend.', 0, 0, { size: 62, font: DISPLAY, weight: 400, fill: '#2a1b3d', stroke: false });
    c.restore();
  }
  c.restore();
}

function sHands(c, t) {
  c.save();
  beatZoom(c, t, 0.015);
  drift(c, t, 31.5, 35.3, 1.1, 1.2, 960, 640);
  roomBg(c, t, { wall1: '#3c2d82', wall2: '#5a47a8' });
  const raised = seg(t, WT(6, 3), WT(6, 4) + 0.1);
  const onDoor = seg(t, WT(6, 6), WT(6, 8));
  // summoning sigil (left)
  c.save(); c.translate(430, 380); c.rotate(t * 0.8);
  glow(c, 0, 0, 330, `rgba(180,140,255,${0.25 + raised * 0.4})`);
  for (let k = 0; k < 3; k++) { circle(c, 0, 0, 170 - k * 45); c.lineWidth = 7 - k; c.strokeStyle = `rgba(230,210,255,${0.5 + raised * 0.5})`; c.stroke(); }
  softStar(c, 0, 0, 120, 7, t, 0.55); c.lineWidth = 5; c.stroke();
  c.restore();
  txt(c, 'summon?', 430, 640, { size: 48, font: DISPLAY, weight: 400, fill: '#d9c8ff', lw: 9 });
  drawDoor(c, 1520, 930, 1.35, t, { open: 0.25 + onDoor * 0.35, sign: true });
  const tug = Math.sin(t * 4.4) * 0.12;
  drawKid(c, 960, 930, 1.45, { t, tilt: tug, eyes: 'open', brows: 'worry', mouth: 'wavy', armL: 0.3 + raised * 2.5, handL: 'open', armR: 0.3 + onDoor * 1.25, look: Math.sin(t * 2.2), sweat: onDoor > 0.5 });
  if (raised > 0) for (let k = 0; k < 6; k++) sparkle(c, 680 + Math.cos(t * 3 + k) * 80, 520 + Math.sin(t * 4 + k) * 80, 10 + 6 * Math.sin(t * 8 + k), '#e6d9ff');
  c.restore();
}

function sUnsure(c, t) {
  c.save();
  beatZoom(c, t, 0.02);
  fillGrad(c, 0, 0, 0, H, [[0, '#cdb8ff'], [1, '#ffc2dc']], 0, 0, W, H);
  c.save(); c.translate(W / 2, H / 2); c.rotate(t * 0.4);
  for (let k = 0; k < 12; k++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(200, -60, 500, 100, 1400, -80); c.lineWidth = 40; c.strokeStyle = 'rgba(255,255,255,0.25)'; c.stroke(); }
  c.restore();
  const qs = [WT(7, 2), WT(7, 3), WT(7, 5)];
  const spin = t > WT(7, 1) - 0.1 && t < WT(7, 2);
  drawKid(c, 960, 1240, 2.6, { t, eyes: spin ? 'spiral' : 'open', brows: 'worry', mouth: 'wavy', sweat: t > WT(7, 3), look: Math.sin(t * 3) * 0.8, armL: 0.9 + Math.sin(t * 5) * 0.2, armR: 0.9 - Math.sin(t * 5) * 0.2, handL: 'open', handR: 'open' });
  qs.forEach((q, k) => { const p = pop(t, q, 0.35); if (p > 0) { c.save(); c.translate([520, 1400, 1180][k], [330, 300, 150][k] + Math.sin(t * 4 + k) * 12); c.scale(p, p); question(c, 0, 0, 1.6, ['#ffd166', '#ff8fc7', '#8fd3ff'][k], (k - 1) * 0.3); c.restore(); } });
  // the fizzled spell
  const pf = seg(t, WT(7, 6), WT(7, 6) + 1);
  if (pf > 0 && pf < 1) {
    c.save(); c.globalAlpha = 1 - pf;
    cloudPath(c, 380, 700 - pf * 120, 120 + pf * 100, 80 + pf * 60, 8, 2); fs(c, '#e6e0f5', INK, 4);
    c.restore();
    sfx(c, 'pfft…', 380, 560, t, WT(7, 6), { size: 70, fill: '#b9b0d0', rot: -0.1 });
  }
  c.restore();
}

function sStir(c, t) {
  const cut = snapBeat(LE(7) + 1.2);
  if (t < cut) {
    c.save();
    const z = 1.6 + seg(t, LE(7), cut) * 0.5;
    applyShake(c, t, LE(7) + 0.4, 8, 0.6);
    dioCam(c, DIO.cthX + 20, DIO.floor - 300, z);
    diorama(c, t, { cth: { mood: 'peek', eyeOpen: easeOutCubic(seg(t, LE(7) + 0.35, LE(7) + 0.7)) } });
    c.restore();
    vignette(c, 0.7);
    sfx(c, '!?', 1260, 300, t, LE(7) + 0.45, { size: 150, fill: '#ffe27a', rot: 0.15 });
  } else {
    c.save();
    beatZoom(c, t, 0.03);
    burst(c, W / 2, 620, t, '#ffe9a8', '#fff6d6', 24);
    drawKid(c, 960, 1180, 2.2, { t, eyes: 'star', mouth: 'open', armL: 2.6, armR: 0.3, handL: 'point' });
    lightbulb(c, 960, 170, 1.4 * pop(t, cut, 0.3), t);
    c.restore();
  }
}

/* ================= CHORUS (shared pieces) ================= */
function porchCast(c, t, list, o = {}) {
  // list of [kind, x, opts] drawn on the cliff top of the diorama
  for (const [kind, x, op] of list) {
    const e = Object.assign({ t }, op || {});
    const b = e.noHop ? 0 : hop(t, e.hopAmp ?? 14, e.every ?? 1, e.off ?? 0);
    const sq = e.noHop ? 1 : squash(t, 0.08, e.every ?? 1, e.off ?? 0);
    e.sq = sq;
    const y = PORCH + b + (e.dy || 0);
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
  const shh = t > WT(8, 1) - 0.2;
  porchCast(c, t, [
    ['book', 1160, { face: 'grin', noHop: !shh, s: 0.6 }],
    ['kid', 1290, Object.assign({ s: 0.66 }, shh ? SHH : { eyes: 'open', mouth: 'smile' })],
    ['clock', 1440, { face: shh ? 'wise' : 'smile', wag: shh, armR: shh ? 2.6 : 0.4, s: 0.6 }],
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
    fillGrad(c, 0, y - h / 2, 0, y + h / 2, [[0, '#ffd6ec'], [1, '#d6c8ff']], x - w, y - h, w * 2, h * 2);
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
      rrect(c, 470, 340, 100, 30, 14); fs(c, '#ff9ecf', INK, 4); // tiny coral hurdle
      txt(c, 'counting fish…', 520, 170, { size: 34, fill: '#6b3fc9', stroke: false, weight: 600 });
    });
  }, () => {
    c.save();
    dioCam(c, 1500, 330, 1.7);
    diorama(c, t, { porch: 0.25 + bright * 0.95, moonX: 1100, moonY: 80 });
    porchCast(c, t, [['kid', 1560, { s: 0.7, eyes: 'happy', mouth: 'open', armR: 2.4 + Math.sin(t * 9) * 0.3, handR: 'open' }]]);
    // fireflies
    for (let k = 0; k < 14; k++) { const fx = 1250 + rnd(k, 5) * 500 + Math.sin(t * 1.5 + k) * 40, fy = 150 + rnd(k, 6) * 250 + Math.cos(t * 1.2 + k) * 30; glow(c, fx, fy, 26, `rgba(255,240,150,${0.5 + 0.5 * Math.sin(t * 4 + k)})`); circle(c, fx, fy, 4); c.fillStyle = '#fffbd0'; c.fill(); }
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
    ['kid', 1260, { s: 0.66, eyes: 'happy', mouth: 'open', tilt: side * 0.1, armL: b.i % 2 ? 2.7 : 0.6, armR: b.i % 2 ? 0.6 : 2.7, handL: 'open', handR: 'open' }],
    ['clock', 1410, { s: 0.6, face: 'happy', tilt: -side * 0.12, armL: 2.4, armR: 2.4 }],
  ]);
  notesFx(c, t, 8, 1000, 0, 700, 450, 17);
  c.restore();
}
function sC1e(c, t) {
  c.save();
  const k = easeInOut(seg(t, LS(12) - 0.4, LE(12) + 0.3));
  const [cx, cy, z] = lerpCam(k, [960, 1150, 0.47], [DIO.cthX + 60, DIO.floor - 380, 0.9]);
  dioCam(c, cx, cy, z);
  diorama(c, t, { sign: 1, porch: 1, moonX: 700, moonY: 140, cth: { mood: 'smile', hug: 'fish' } });
  porchCast(c, t, [['kid', 1290, { s: 0.62, eyes: 'happy', mouth: 'open', armL: 2.5, armR: 2.5, handL: 'open', handR: 'open' }], ['clock', 1420, { s: 0.6, face: 'happy', armL: 2.3, armR: 2.3 }], ['book', 1170, { s: 0.6 }]]);
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
  drawMailman(c, mx, PORCH + (wk < 1 ? -Math.abs(Math.sin(t * 9)) * 8 : hop(t, 6)), 0.62, { t, hold: null, armL: 0.3, armR: wk >= 1 ? 2.4 : 0.3, face: 'happy', walk: t * 9 });
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
  roomBg(c, t, { wall1: '#6a55b8', wall2: '#8a74d6' });
  if (dram > 0) {
    c.save(); c.globalAlpha = dram;
    burst(c, W / 2, 560, t, '#1b1040', '#2d1a66', 18, 2400, 0.1);
    for (let k = 0; k < 3; k++) { const lx = 300 + k * 650 + rnd(Math.floor(t * 3), k) * 100; c.beginPath(); c.moveTo(lx, 0); c.lineTo(lx + 40, 200); c.lineTo(lx - 10, 220); c.lineTo(lx + 50, 420); c.lineWidth = 8; c.strokeStyle = 'rgba(255,240,150,0.8)'; c.stroke(); }
    c.restore();
  }
  const lid = easeOutBack(seg(t, WT(13, 1) - 0.1, WT(13, 1) + 0.3));
  if (t < WT(13, 3) + 0.5) giftBox(c, 1400, 960, 0.9, t, lid);
  if (lid > 0.3 && t < WT(13, 3)) for (let k = 0; k < 8; k++) sparkle(c, 1400 + Math.cos(k) * 220 * lid, 700 - Math.sin(k * 1.3) * 180 * lid, 20, '#fff');
  // spin into the robe
  const s0 = WT(13, 3) - 0.35, s1 = WT(13, 3) + 0.15;
  const spinK = seg(t, s0, s1);
  const sx = spinK > 0 && spinK < 1 ? Math.cos(spinK * Math.PI * 4) : 1;
  const robed = t > (s0 + s1) / 2;
  c.save(); c.translate(820, 0); c.scale(Math.abs(sx) < 0.08 ? 0.08 : sx, 1); c.translate(-820, 0);
  drawKid(c, 820, 990 + hop(t, 8, 2), 1.9, {
    t, outfit: robed ? 'robe' : 'hoodie', hood: dram > 0.3 ? 1 : 0, dramatic: dram,
    eyes: dram > 0.5 ? 'glow' : robed ? 'star' : 'open', mouth: dram > 0.5 ? 'flat' : 'open',
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
  fillGrad(c, 0, 0, 0, H, [[0, '#ffd6ec'], [1, '#ffb8d8']], 0, 0, W, H);
  // fabric swatches on the wall
  for (let k = 0; k < 8; k++) { c.save(); c.translate(150 + k * 230, 140 + (k % 2) * 40); c.rotate(Math.sin(t * 2 + k) * 0.08); rrect(c, -70, 0, 140, 170, 12); fs(c, ['#7b4fd6', '#8fe3b0', '#ffd166', '#6fb7ff'][k % 4], INK, 5); line(c, 0, -30, 0, 0, INK, 4); c.restore(); }
  fillGrad(c, 0, 850, 0, H, [[0, '#f0a8c8'], [1, '#e690b8']], 0, 850, W, 300);
  line(c, 0, 850, W, 850, INK, 6);
  const catIn = easeOutBack(seg(t, WT(14, 1) - 0.4, WT(14, 1) + 0.1));
  drawTailorCat(c, lerp(2300, 1380, catIn), 900 + hop(t, 10), 1.55, { t, sq: squash(t, 0.06) });
  const cozy = t > WT(14, 5) - 0.1;
  drawKid(c, 620, 900 + hop(t, 8, 2), 1.55, { t, outfit: 'robe', hood: 0, eyes: cozy ? 'closed' : 'star', mouth: cozy ? 'cat' : 'open', blush: cozy ? 2 : 1, armL: cozy ? 2.2 : 0.5, armR: 0.5, tilt: cozy ? -0.12 : 0 });
  // five-star review
  const b0 = beatInfo(WT(14, 3) - 0.1).i + 1;
  for (let k = 0; k < 5; k++) { const p = pop(t, beatTime(b0 + k * 0.5 | 0) + (k % 2) * 0.22, 0.3); if (p > 0) { c.save(); c.translate(1010 + (k - 2) * 120, 330 + Math.sin(t * 5 + k) * 8); c.scale(p, p); softStar(c, 0, 0, 52); fs(c, '#ffd166', INK, 6); c.restore(); } }
  if (cozy) { for (let k = 0; k < 6; k++) sparkle(c, 620 + Math.cos(t * 2 + k) * 220, 560 + Math.sin(t * 3 + k) * 160, 12 + 6 * Math.sin(t * 6 + k), '#fff'); sfx(c, 'so soft~', 560, 250, t, WT(14, 5), { size: 80, fill: '#fff', rot: -0.1, dur: 1.4 }); }
  c.restore();
}

function sPlan(c, t) {
  c.save();
  beatZoom(c, t, 0.012);
  drift(c, t, 68.5, 72, 1.0, 1.08, 1100, 520);
  roomBg(c, t, { wall1: '#3f2f86', wall2: '#5e4aae' });
  const tp = pop(t, LS(15) - 0.1, 0.5);
  thought(c, 1150, 440, 1300, 760, t, tp, () => {
    fillGrad(c, 0, 60, 0, 820, [[0, '#fff6e6'], [1, '#ffe7f1']], 400, 40, 1500, 900);
    const rev = seg(t, WT(15, 3) - 0.1, WT(15, 6) + 0.2);
    planBoard(c, 1300, 800, 1.1, t, rev * 1.01);
    const pointAt = [WT(15, 3), WT(15, 4), WT(15, 6)].filter((x) => t > x).length;
    drawKid(c, 820, 790 + hop(t, 6), 0.95, { t, outfit: 'robe', hood: 0, eyes: 'happy', mouth: 'open', armR: 1.9 + pointAt * 0.12, holdR: 'pointer' });
  }, [360, 780]);
  drawKid(c, 330, 1060, 1.3, { t, outfit: 'robe', hood: 0, eyes: 'open', mouth: 'cat', armR: 2.4, look: 0.8 });
  c.restore();
}

function sMabel(c, t) {
  c.save();
  drift(c, t, 72, 75.7, 1.04, 1.16, 1000, 720);
  roomBg(c, t, { wall1: '#ff9ecf', wall2: '#ffb8d8', floorY: 860 });
  // couch
  rrect(c, 760, 560, 900, 200, 60); fs(c, '#6fb7ff', INK, 6);
  rrect(c, 700, 700, 1020, 150, 50); fs(c, '#8fcaff', INK, 6);
  const blankM = t > WT(16, 3) - 0.05, blankP = t > WT(16, 7) - 0.05;
  drawMabel(c, 1000, 800, 1.2, { t, face: blankM ? 'blank' : 'smile', spill: blankM ? seg(t, WT(16, 4), WT(16, 4) + 0.4) * 1.1 : 0 });
  drawMailman(c, 1400, 800, 1.2, { t, face: blankP ? 'blank' : 'smile', hold: blankP ? null : 'letters', armL: blankP ? 0.1 : 0.9 });
  if (blankP) for (let k = 0; k < 3; k++) { const d = seg(t, WT(16, 7), WT(16, 7) + 0.6); c.save(); c.translate(1300 + k * 40, 700 + d * 180); c.rotate(d * 3 + k); drawEnvelope(c, 0, 0, 0.5); c.restore(); }
  planBoard(c, 1780, 1180, 0.9, t, 1);
  drawKid(c, 360, 1010, 1.5, { t, outfit: 'robe', hood: 0, eyes: blankP ? 'dot' : 'happy', mouth: blankP ? 'flat' : 'open', sweat: blankM, armR: 1.9, holdR: 'pointer' });
  const dots = seg(t, WT(16, 7) + 0.2, WT(16, 7) + 0.9);
  if (dots > 0) { c.save(); c.translate(1200, 300); bubble(c, 0, 0, 280, 120, -80, 140, { fill: '#fff' }); for (let k = 0; k < 3; k++) if (dots > k / 3) { circle(c, -60 + k * 60, 0, 13); c.fillStyle = INK; c.fill(); } c.restore(); }
  sfx(c, 'chirp…', 1600, 460, t, WT(16, 7) + 0.4, { size: 56, fill: '#8fe3b0', rot: 0.1, dur: 1.2 });
  c.restore();
}

/* ================= PRE-CHORUS 2 ================= */
function sStarsTide(c, t) {
  c.save();
  beatZoom(c, t, 0.025);
  nightSky(c, t, 0, 0, W, H, { stars: 120 });
  const summon = t > WT(17, 3) - 0.1;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + t * 0.3;
    drawStarBuddy(c, 760 + Math.cos(a) * 470, 430 + Math.sin(a) * 250, 0.95 + 0.1 * Math.sin(t * 6 + k), { t, shout: summon, seed: k });
  }
  const sp = pop(t, WT(17, 3) - 0.08, 0.3);
  if (sp > 0) { c.save(); c.translate(760, 430); c.scale(sp, sp); bubble(c, 0, 0, 560, 190, 120, 200, { spiky: true, fill: '#ffe27a' }); txt(c, 'SUMMON!', 0, 0, { size: 100, font: DISPLAY, weight: 400, fill: '#7b4fd6', lw: 16 }); c.restore(); }
  const wr = easeOutBack(seg(t, WT(17, 5) - 0.3, WT(17, 7)));
  if (wr > 0) {
    seaSurface(c, t, 1000 - wr * 60, -100, W + 200, 200);
    drawWaveBuddy(c, 1540, 1120 + (1 - wr) * 500, 1.6, { t, shout: t > WT(17, 7) - 0.05 });
    const gp = pop(t, WT(17, 7) - 0.05, 0.3);
    if (gp > 0) { c.save(); c.translate(1500, 330); c.scale(gp, gp); bubble(c, 0, 0, 520, 180, 60, 200, { spiky: true, fill: '#bfe8ff' }); txt(c, 'GO DEEP!', 0, 0, { size: 96, font: DISPLAY, weight: 400, fill: '#1b3f7a', lw: 14 }); c.restore(); }
  }
  c.restore();
}

function sSleep(c, t) {
  c.save();
  drift(c, t, 78.3, 82.1, 1.12, 1.28, 820, 680);
  if (!REDUCED_MOTION) { c.translate(W / 2, H / 2); c.rotate(Math.sin(t * 1.2) * 0.012); c.translate(-W / 2, -H / 2); }
  bedroomBg(c, t);
  rrect(c, 420, 560, 420, 170, 70); fs(c, '#fff', INK, 6);
  const cuddle = t > WT(18, 3) - 0.1;
  drawKid(c, 700, 900 + Math.sin(t * 2.5) * 4, 1.45, { t, eyes: cuddle ? 'closed' : 'sleepy', mouth: cuddle ? 'cat' : 'o', mask: true, blush: cuddle ? 2 : 1, armL: 1.3, armR: 1.1, tilt: -0.15, noBlink: true });
  quilt(c, 380, 700, 960, 200, t);
  // pillow plush hug
  c.save(); c.translate(900, 760); c.rotate(-0.2); rrect(c, -100, -50, 200, 100, 40); fs(c, '#ffc2dc', INK, 5); heartPath(c, 0, 8, 22); c.fillStyle = '#ff8fc7'; c.fill(); c.restore();
  zzz(c, 820, 470, t, 1.4, '#fff');
  if (t > WT(18, 6) - 0.2) heartsFx(c, t, 6, 600, 300, 500, 400, 31, 1);
  sfx(c, 'so cozy…', 1150, 300, t, WT(18, 6), { size: 80, fill: '#ffd6ec', rot: 0.06, dur: 1.4 });
  c.restore();
}

function sKeyRhyme(c, t) {
  c.save();
  beatZoom(c, t, 0.02);
  burst(c, W / 2, 470, t, '#2d1a66', '#3d2585', 24, 2400, 0.15);
  const kp = easeOutBack(seg(t, WT(19, 3) - 0.35, WT(19, 4)));
  const rp = easeOutBack(seg(t, WT(19, 8) - 0.35, WT(19, 9) + 0.05));
  if (kp > 0) {
    const kx = rp > 0 ? lerp(960, 640, easeInOut(seg(t, WT(19, 5), WT(19, 8)))) : 960;
    glow(c, kx, 430, 360 * kp, 'rgba(255,230,140,0.75)');
    c.save(); c.translate(kx, 470 + Math.sin(t * 2) * 16); c.rotate(Math.sin(t * 1.5) * 0.15); drawKey(c, 0, -60, 2.3 * kp, t); c.restore();
    for (let k = 0; k < 8; k++) sparkle(c, kx + Math.cos(t + k) * 260, 430 + Math.sin(t * 1.3 + k) * 220, 14 + 8 * Math.sin(t * 5 + k), '#fff6c8');
  }
  if (rp > 0) {
    glow(c, 1280, 430, 360 * rp, 'rgba(200,170,255,0.7)');
    c.save(); c.translate(1280, 430 + Math.cos(t * 2) * 14); c.scale(rp, rp);
    rrect(c, -170, -220, 340, 440, 16); fs(c, '#fff0cc', INK, 6);
    circle(c, 0, -226, 0.01);
    rrect(c, -190, -250, 380, 50, 25); fs(c, '#e8c98f', INK, 5); rrect(c, -190, 200, 380, 50, 25); fs(c, '#e8c98f', INK, 5);
    for (let k = 0; k < 4; k++) txt(c, '♪ ~ ♫ ~ ♪', 0, -130 + k * 80, { size: 44, fill: '#7b4fd6', stroke: false, font: 'sans-serif', weight: 700 });
    c.restore();
    notesFx(c, t, 6, 1100, 150, 360, 400, 41, '#e6d9ff');
  }
  drawKid(c, 960, 1300, 2.0, { t, outfit: 'robe', hood: 0, eyes: 'star', mouth: 'open', armL: 1.3, armR: 1.3, handL: 'open', handR: 'open' });
  txt(c, 'sacred key', 640 + (1 - kp) * 1000, 860, { size: 52, font: DISPLAY, weight: 400, fill: '#ffe27a', lw: 10 });
  if (rp > 0.5) txt(c, 'ancient rhyme', 1280, 860, { size: 52, font: DISPLAY, weight: 400, fill: '#d9c8ff', lw: 10 });
  c.restore();
}

function sPaperweight(c, t) {
  c.save();
  beatZoom(c, t, 0.012);
  drift(c, t, 85.8, 91.3, 1.06, 1.18, 1100, 620);
  roomBg(c, t, { wall1: '#4a3a8f', wall2: '#6a55b8', floorY: 900 });
  roundWindow(c, 1650, 280, 140, t);
  // desk
  rrect(c, 300, 640, 1300, 50, 14); fs(c, '#a8744a', INK, 6);
  rrect(c, 340, 690, 40, 260, 8); fs(c, '#7a4f33', INK, 5); rrect(c, 1520, 690, 40, 260, 8); fs(c, '#7a4f33', INK, 5);
  // desk fan
  c.save(); c.translate(460, 520);
  rrect(c, -14, 20, 28, 100, 8); fs(c, '#9fd8ff', INK, 5); ellipse(c, 0, 120, 60, 16); fs(c, '#9fd8ff', INK, 5);
  circle(c, 0, 0, 90); fs(c, 'rgba(200,235,255,0.5)', INK, 6);
  c.rotate(t * 30); for (let k = 0; k < 3; k++) { c.rotate(TAU / 3); ellipse(c, 0, -45, 22, 42); fs(c, '#6fb7ff', INK, 3); }
  c.restore();
  const plop = WT(20, 9);
  const fly = t < plop ? 1 : 0;
  paperStack(c, 1000, 634, 1.2, t, fly);
  if (fly) for (let k = 0; k < 6; k++) { const ph = (t * 0.9 + k / 6) % 1; c.save(); c.translate(560 + ph * 1400, 520 - Math.sin(ph * 5 + k) * 120 - ph * 200); c.rotate(t * 5 + k); rrect(c, -50, -34, 100, 68, 4); fs(c, '#fff', INK, 3.5); c.restore(); }
  // the key and scroll drop on the stack
  const dk = seg(t, plop - 0.35, plop);
  if (t > WT(20, 3) - 0.2) {
    const yk = lerp(260, 530, easeInCubic(dk));
    c.save(); c.translate(940, yk); c.rotate(-1.35); drawKey(c, 0, 0, 0.8, t); c.restore();
    c.save(); c.translate(1090, yk + 20); drawProp(c, 'scroll', t); c.scale(1.4, 1.4); c.restore();
  }
  sfx(c, 'plonk!', 1010, 420, t, plop, { size: 90, fill: '#ffe27a', rot: -0.12, dur: 1 });
  const tag = pop(t, WT(20, 8) - 0.1, 0.35);
  if (tag > 0) { c.save(); c.translate(1300, 470); c.rotate(0.12 + Math.sin(t * 3) * 0.04); c.scale(tag, tag); line(c, -120, 20, -60, 10, INK, 4); rrect(c, -60, -40, 300, 90, 20); fs(c, '#ffd166', INK, 5); txt(c, 'very fancy ✦', 90, 5, { size: 44, font: DISPLAY, weight: 400, fill: '#6b3fc9', stroke: false }); c.restore(); }
  const wink = t > WT(20, 10) - 0.1;
  drawKid(c, 1450, 950 + hop(t, 6, 2), 1.3, { t, outfit: 'robe', hood: 0, eyes: wink ? 'wink' : 'open', mouth: wink ? 'tongue' : 'smile', armL: wink ? 0.5 : 0.9, armR: wink ? 2.6 : 0.6, handR: wink ? 'thumb' : undefined, holdL: t > plop + 0.8 ? 'cup' : undefined });
  c.restore();
}

/* ================= CHORUS 2 ================= */
function sC2a(c, t) {
  c.save();
  beatZoom(c, t);
  dioCam(c, 1330, 290, 1.5);
  diorama(c, t, { porch: 1, moonX: 1000, moonY: 70, moonFace: 'shh' });
  const shh = t > WT(21, 1) - 0.25;
  const S2 = shh ? SHH : { eyes: 'open' };
  porchCast(c, t, [
    ['mabel', 1060, Object.assign({ s: 0.6, face: shh ? 'smile' : 'smile', cup: true }, {})],
    ['kid', 1190, Object.assign({ s: 0.64, outfit: 'robe', hood: 0 }, S2)],
    ['mail', 1320, { s: 0.6, face: 'happy' }],
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
  // helpers pulling the blanket
  const hx = lerp(DIO.cthX - 330, DIO.cthX - 220, bl);
  drawCrab(c, hx, DIO.floor - 30 + hop(t, 10), 1.3, t, { wave: true });
  drawFish(c, DIO.cthX + 330 - bl * 80, DIO.floor - 330 + Math.sin(t * 3) * 20, 1.4, t, { color: '#ffb347', flip: true });
  drawFish(c, DIO.cthX + 400 - bl * 60, DIO.floor - 200 + Math.cos(t * 3) * 20, 1.2, t, { color: '#8fd3ff', flip: true, seed: 4 });
  c.restore();
  sfx(c, 'tuck tuck', 1400, 250, t, WT(22, 4), { size: 80, fill: '#ffd6ec', rot: 0.1 });
}
function sC2c(c, t) {
  const lights = seg(t, WT(23, 10) - 0.2, WT(23, 12) + 0.1);
  split(c, () => {
    c.save();
    dioCam(c, DIO.cthX + 180, DIO.floor - 330, 1.25);
    diorama(c, t, { sign: 1, blanket: 1, cth: { mood: 'smile', hug: 'fish' } });
    c.restore();
    dreamBubble(c, 520, 280, 580, 340, t, pop(t, WT(23, 2) - 0.1, 0.5), () => {
      cloudPath(c, 520, 380, 360, 90, 8, 9); fs(c, '#fff', INK, 4);
      c.save(); c.translate(520, 330 + hop(t, 50)); c.scale(0.42, 0.42); drawCthulhu(c, 0, 0, 1, { t, mood: 'happy', armsUp: 1, cap: true }); c.restore();
      for (let k = 0; k < 5; k++) sparkle(c, 330 + k * 95, 180 + Math.sin(t * 3 + k) * 20, 12, '#fff');
    });
  }, () => {
    c.save();
    dioCam(c, 1480, 300, 1.6);
    diorama(c, t, { porch: 1, moonX: 1100, moonY: 60 });
    // string lights along the eaves
    const hx = DIO.houseX + 150;
    for (let k = 0; k < 12; k++) {
      const u = k / 11, lx = hx - 270 + u * 540, ly = DIO.cliffY - 262 + Math.sin(u * Math.PI) * 30;
      const on = lights > u * 0.9;
      if (on) glow(c, lx, ly, 40, 'rgba(255,230,140,0.8)');
      circle(c, lx, ly, 9); fs(c, on ? ['#ffe27a', '#ff9ecf', '#8fe3b0'][k % 3] : '#6a6a8a', INK, 3);
    }
    porchCast(c, t, [['mabel', 1260, { s: 0.6, face: 'happy' }], ['kid', 1380, { s: 0.62, outfit: 'robe', hood: 0, eyes: 'happy', mouth: 'open', armR: 2.4, handR: 'open' }]]);
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
  const order = [['cat', {}], ['clock', { face: 'happy', armL: 2.2, armR: 0.5 }], ['book', { open: 0.4 }], ['mail', { face: 'happy', armL: 1.2, armR: 1.2 }], ['mabel', { face: 'happy', cup: false, armL: 1.3 }], ['kid', { outfit: 'robe', hood: 0, eyes: 'happy', mouth: 'open', armL: 1.3, armR: 1.3 }]];
  porchCast(c, t, order.map(([k, o], i) => [k, base + i * 115, Object.assign({ s: 0.56, off: i * 0.25, tilt: Math.sin(t * 6 + i) * 0.1, walk: t * 8 + i }, o)]));
  sfx(c, 'conga!', 960, 180, t, LS(24) + 0.2, { size: 100, fill: '#ffd166', rot: -0.08, dur: 1.6 });
  c.restore();
}
function sC2e(c, t) {
  c.save();
  const k = easeInOut(seg(t, LS(25) - 0.3, LE(25)));
  const [cx, cy, z] = lerpCam(k, [DIO.cthX + 60, DIO.floor - 380, 0.95], [960, 1150, 0.47]);
  dioCam(c, cx, cy, z);
  diorama(c, t, { sign: 1, blanket: 1, porch: 1, moonX: 700, moonY: 140, cth: { mood: 'smile', hug: 'fish' } });
  // fish swimming in a heart around the temple
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + t * 0.8;
    const hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    drawFish(c, DIO.cthX + hx * 26, DIO.floor - 520 + hy * 24, 1.1, t, { color: ['#ff9ecf', '#ffb347', '#ffe27a'][i % 3], flip: Math.cos(a) < 0, seed: i });
  }
  porchCast(c, t, [['mabel', 1180, { s: 0.6, face: 'happy', armL: 2.4 }], ['kid', 1300, { s: 0.62, outfit: 'robe', hood: 0, eyes: 'happy', mouth: 'open', armL: 2.5, armR: 2.5, handL: 'open', handR: 'open' }], ['mail', 1420, { s: 0.6, face: 'happy', armR: 2.4, armL: 2.4 }]]);
  c.restore();
}
