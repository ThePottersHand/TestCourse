/* Scenes, part B: bridge, roll call, final chorus, the polite note, outro. */
'use strict';

/* ================= BRIDGE ================= */
function sBrunch(c, t) {
  c.save();
  beatZoom(c, t, 0.018);
  cafeBg(c, t);
  const fr = easeOutBack(seg(t, WT(26, 3) - 0.1, WT(26, 5)));
  const hug = t > WT(26, 5) + 0.1;
  if (fr > 0) {
    drawKid(c, lerp(-250, 560, fr), 760, 1.3, { t, air: hop(t, 12, 1, 0.3), colors: FRIEND_A, seed: 2, eyes: 'happy', sing: true, armR: hug ? 1.7 : 2.4, handR: 'open', armL: 0.5 });
    drawKid(c, lerp(2170, 1360, fr), 760, 1.3, { t, air: hop(t, 12, 1, 0.6), colors: FRIEND_B, seed: 5, eyes: hug ? 'happy' : 'wink', sing: true, armL: hug ? 1.7 : 2.4, handL: 'open', armR: 0.5 });
  }
  drawKid(c, 960, 760, 1.35, { t, air: hop(t, 12), eyes: 'star', sing: true, armL: hug ? 1.7 : 2.5, armR: hug ? 1.7 : 2.5, handL: 'open', handR: 'open', sq: squash(t, 0.06) });
  const bb = beatInfo(t);
  brunchTable(c, 960, 960, 1.05, t, { hop: t > WT(26, 1) ? -Math.abs(Math.sin(Math.PI * bb.f)) * 30 : 0, sq: t > WT(26, 1) ? squash(t, 0.1) : 1 });
  sfx(c, 'brunch!', 480, 230, t, WT(26, 2), { size: 110, fill: '#ffb347', rot: -0.15, dur: 1.3 });
  if (hug) { heartsFx(c, t, 10, 500, 250, 920, 500, 51, 1.3); sfx(c, 'friends!', 1450, 230, t, WT(26, 5), { size: 110, fill: '#ff6f9f', rot: 0.12, dur: 1.4 }); }
  c.restore();
}

function sStories(c, t) {
  c.save();
  beatZoom(c, t, 0.015);
  roomBg(c, t, { wall1: '#ffd9ec', wall2: '#ffc2dc', floorY: 880, floor1: '#c48a64', floor2: '#e0a882', base: '#b06a8a', panel2: 'rgba(120,20,70,0.12)' });
  for (let k = 0; k < 4; k++) bookshelf(c, 200 + k * 510, 880, 1.25, t);
  c.fillStyle = 'rgba(255,240,250,0.35)'; c.fillRect(-300, -300, W + 600, H + 600);
  lightShaft(c, 1500, -40, 1700, 900, 1100, 1500, '#fff4d0', 0.22);
  const toss = WT(27, 2);
  const tk = seg(t, toss - 0.05, toss + 0.9);
  if (tk < 1) {
    const bx = lerp(720, 2100, easeInCubic(tk)), by = lerp(560, -200, tk) + Math.sin(tk * Math.PI) * -200;
    c.save(); c.translate(bx, by); c.rotate(tk * 8); storyBook(c, 0, 170, 0.8, t, 'spooky'); c.restore();
  }
  const open = seg(t, WT(27, 5) - 0.2, WT(27, 6) + 0.1);
  const bookIn = easeOutBack(seg(t, toss + 0.1, toss + 0.5));
  drawKid(c, 560, 980, 1.45, { t, air: hop(t, 8), eyes: t < toss ? 'dot' : 'happy', sing: t >= toss, mouth: t < toss ? 'flat' : undefined, armR: t < toss ? 1.6 : 2.2 - tk * 0.4, armL: bookIn > 0 ? 1.4 : 0.3, sweat: t < toss });
  if (bookIn > 0) {
    if (open > 0) storyBook(c, 1250, 820, 1.6, t, 'happy', open);
    else { c.save(); c.translate(1150, 800); c.scale(bookIn, bookIn); storyBook(c, 0, 0, 1.2, t, 'happy'); c.restore(); }
  }
  if (open > 0.5) confetti(c, t, WT(27, 6) - 0.1, 1250, 520, 50);
  sfx(c, 'nope!', 1300, 260, t, toss, { size: 100, fill: '#8fe3b0', rot: 0.15, dur: 0.9 });
  c.restore();
}

function spaceBg(c, t) {
  fillGrad(c, 0, 0, 0, H, [[0, '#0a0826'], [1, '#221656']], -300, -300, W + 600, H + 600);
  c.save(); c.translate(W / 2, H * 0.45); c.rotate(-0.4); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.drawImage(milkySprite(), -W * 0.8, -H * 0.2, W * 1.6, H * 0.4); c.restore();
  twinkles(c, t, 130, 0, 0, W, H, 61, 1.2);
  bokeh(c, t, 8, 0, 0, W, H, ['#b59cff', '#ff9ecf', '#8fd3ff'], 97, 1.8, 0.25);
}
function sWorld(c, t) {
  c.save();
  beatZoom(c, t, 0.02);
  spaceBg(c, t);
  const call = WT(28, 5) - 0.25;
  const spin = t < call + 0.2;
  if (spin) {
    const sp = 1 + seg(t, WT(28, 1), WT(28, 3)) * 6;
    earth(c, 960, 540, 300, t * sp, 1, t > WT(28, 2));
    for (let k = 0; k < 6; k++) { const a = t * sp * 2 + k; c.beginPath(); c.arc(960, 540, 360 + k * 12, a, a + 0.8); c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke(); }
    sfx(c, 'wheee', 1450, 250, t, WT(28, 2), { size: 90, fill: '#8fd3ff', rot: 0.2 });
  }
  const pp = easeOutBack(seg(t, call, call + 0.35));
  if (pp > 0) {
    c.save(); c.globalAlpha = clamp(pp * 2);
    if (!spin) earth(c, 400, 780, 160, t, 0.3, false);
    c.restore();
    phoneCall(c, 1180, 540, 1.1, t, pp, 0);
    if (t > WT(28, 6)) { sfx(c, 'brrring', 780, 250, t, WT(28, 6), { size: 80, fill: '#8fe3b0', rot: -0.2, dur: 0.8 }); sfx(c, 'brrring', 1600, 330, t, WT(28, 7), { size: 80, fill: '#8fe3b0', rot: 0.2, dur: 0.8 }); }
  }
  c.restore();
}

function sMat(c, t) {
  const cut = WT(29, 3) - 0.15;
  c.save();
  if (t < cut) {
    beatZoom(c, t, 0.02);
    spaceBg(c, t);
    const dec = seg(t, WT(29, 1) - 0.1, WT(29, 1) + 0.25);
    phoneCall(c, 1180, 540, 1.1, t, 1, dec);
    drawKid(c, 470, 1120, 1.7, { t, noShadow: true, eyes: dec > 0 ? 'happy' : 'dot', sing: dec > 0, mouth: dec > 0 ? undefined : 'flat', armR: 1.6 + dec * 0.3, handR: 'point' });
  } else {
    daySky(c, t);
    const wall = pRRect(-50, 120, W + 100, 700, 0);
    const wg = c.createLinearGradient(0, 120, 0, 790); wg.addColorStop(0, '#fff3e2'); wg.addColorStop(1, '#f0d8bd');
    c.fillStyle = wg; c.fill(wall);
    for (let k = 1; k < 10; k++) line(c, -50, 120 + k * 70, W + 50, 120 + k * 70, 'rgba(180,140,110,0.35)', 3);
    fillGrad(c, 0, 120, 0, 190, [[0, 'rgba(60,30,70,0.35)'], [1, 'rgba(60,30,70,0)']], -50, 120, W + 100, 70);
    drawDoor(c, 1200, 790, 1.5, t, { open: 0.1 });
    fillGrad(c, 0, 790, 0, H, [[0, '#c48a5a'], [1, '#a8744a']], -50, 790, W + 100, 400);
    for (let k = 0; k < 8; k++) line(c, -50, 800 + k * 40, W + 50, 800 + k * 40, 'rgba(90,50,20,0.25)', 3);
    line(c, -50, 790, W + 50, 790, '#6a4020', 6);
    const roll = seg(t, WT(29, 8) - 0.1, WT(29, 9));
    const fly = seg(t, WT(29, 9), WT(29, 9) + 0.8);
    if (fly < 1) {
      c.save();
      c.translate(lerp(1200, 2300, easeInCubic(fly)), 850 - Math.sin(fly * Math.PI) * 400); c.rotate(fly * 10);
      if (roll > 0) c.scale(1 - roll * 0.6, 1);
      welcomeMat(c, 0, 0, roll > 0.6 ? 0.8 : 1.2, t, 'tentacle');
      c.restore();
    }
    const nm = pop(t, WT(29, 9) + 0.3, 0.4);
    if (nm > 0) { c.save(); c.translate(1200, 850); c.scale(nm, nm); welcomeMat(c, 0, 0, 1.1, t, 'hello'); c.restore(); }
    const look = t < WT(29, 8);
    drawKid(c, 640, 880, 1.6, { t, air: hop(t, 8, 2), eyes: look ? 'dot' : 'happy', sing: !look, mouth: look ? 'flat' : undefined, armR: look ? 0.4 : 1.5, armL: look ? 0.4 : 1.5, look: 1, sweat: look && t > WT(29, 6) });
    sfx(c, 'no thank you!', 1250, 300, t, WT(29, 8), { size: 90, fill: '#ff9ecf', rot: -0.08, dur: 1.4 });
    if (nm > 0) confetti(c, t, WT(29, 9) + 0.3, 1200, 800, 40);
  }
  c.restore();
}

/* character roll call on the build into the final chorus */
function sRollCall(c, t) {
  const b = beatInfo(t);
  const start = beatInfo(SCENES[sceneIndexAt(t)].t0 + 0.05).i;
  const k = clamp(b.i - start, 0, 6);
  const cols = [['#ff9ecf', '#ffc0dc'], ['#8fe3b0', '#b6f2d2'], ['#ffd166', '#ffe6a0'], ['#6fb7ff', '#a8d4ff'], ['#b59cff', '#d4c4ff'], ['#ffb347', '#ffd28c'], ['#1c1150', '#2d1a72']];
  c.save();
  beatZoom(c, t, 0.05);
  burst(c, W / 2, H / 2, t, cols[k][0], cols[k][1], 20, 2400, 0.6);
  const p = easeOutBack(clamp(b.f * 3));
  const names = ['our hero', 'Aunt Mabel', 'the mail carrier', 'Tikk the clock', 'the spellbook', 'the tailor', 'the ancient one (asleep)'];
  c.save(); c.translate(W / 2, 1000); c.scale(p, p);
  if (k === 0) drawKid(c, 0, 0, 2.3, { t, outfit: 'robe', hood: 1, eyes: 'wink', mouth: 'tongue', armR: 2.6, handR: 'thumb' });
  if (k === 1) drawMabel(c, 0, 0, 2.3, { t, face: 'happy' });
  if (k === 2) drawMailman(c, 0, 0, 2.3, { t, face: 'happy', hold: 'letters', armL: 1.2 });
  if (k === 3) drawClock(c, 0, -40, 2.4, { t, face: 'happy', armL: 2.4, armR: 2.4, ring: 1 });
  if (k === 4) drawBook(c, 0, -40, 2.4, { t, open: 0.6 });
  if (k === 5) drawTailorCat(c, 0, 0, 2.3, { t });
  if (k === 6) { twinkles(c, t, 40, -900, -1000, 1800, 900, 5); drawCthulhu(c, 0, 0, 2.0, { t, mood: 'sleep', hug: 'fish' }); }
  c.restore();
  const np = easeOutBack(clamp(b.f * 4 - 0.3));
  c.save(); c.translate(W / 2 - 20, 150); c.rotate(-0.04); c.scale(np, np);
  c.save(); c.translate(8, 12); rrect(c, -380, -62, 760, 124, 30); c.fillStyle = 'rgba(20,10,46,0.3)'; c.fill(); c.restore();
  cel(c, pRRect(-380, -62, 760, 124, 30), '#ffffff', { shadow: '#ece6f6', d: 8, line: '#2a1b3d', lw: 7 });
  txt(c, names[k], 0, 2, { size: 64, font: DISPLAY, weight: 400, fill: '#2a1b3d', stroke: false, shadow: false });
  c.restore();
  speedLines(c, W / 2, H / 2, t, 'rgba(255,255,255,0.45)', 40, 520);
  c.restore();
}

/* ================= FINAL CHORUS ================= */
function kitchenCrew(c, t, o = {}) {
  const dance = o.dance || 0;
  const b = beatInfo(t);
  const side = b.i % 2 ? 1 : -1;
  const arms = (i) => (dance ? { armL: (b.i + i) % 2 ? 2.6 : 0.8, armR: (b.i + i) % 2 ? 0.8 : 2.6, handL: 'open', handR: 'open', tilt: side * 0.1 * (i % 2 ? -1 : 1) } : {});
  const Y = 880;
  const sing = !o.shh;
  drawMabel(c, 250, Y, 1.05, Object.assign({ t, air: hop(t, 12, 1, 0.2), face: 'happy', sing, cup: !dance }, dance ? { armL: 2.3, tilt: side * 0.08 } : {}));
  drawKid(c, 520, Y, 1.1, Object.assign({ t, air: hop(t, 14, 1, 0.4), colors: FRIEND_A, seed: 2, eyes: 'happy', sing }, o.shh ? SHH : arms(1)));
  drawKid(c, 960, Y + 20, 1.25, Object.assign({ t, air: hop(t, 16), outfit: o.robe === false ? 'hoodie' : 'robe', hood: 0, eyes: 'happy', sing }, o.shh ? SHH : arms(2)));
  drawKid(c, 1400, Y, 1.1, Object.assign({ t, air: hop(t, 14, 1, 0.6), colors: FRIEND_B, seed: 5, eyes: 'happy', sing }, o.shh ? SHH : arms(3)));
  drawMailman(c, 1670, Y, 1.05, Object.assign({ t, air: hop(t, 12, 1, 0.8), face: 'happy', sing }, dance ? { armL: 2.3, armR: 2.3, tilt: -side * 0.08 } : {}));
}
function sF1(c, t) {
  c.save();
  beatZoom(c, t, 0.02);
  kitchenBg(c, t, { moonFace: 'smile' });
  kitchenLamp(c, 960, 240, t, { swing: false });
  const shh = t < WT(30, 4) + 0.6;
  kitchenCrew(c, t, { shh, dance: shh ? 0 : 1 });
  drawClock(c, 1250, 600, 0.75, { t, face: 'wise', wag: shh, armR: shh ? 2.6 : 0.5 });
  sfx(c, 'shhh…', 400, 300, t, WT(30, 1), { size: 140, fill: '#b8f0d4', rot: -0.1, dur: 2 });
  c.restore();
}
function sF2(c, t) {
  c.save();
  const k = easeInOut(seg(t, LS(31) - 0.4, LE(31)));
  dioCam(c, DIO.cthX + 30, DIO.floor - 300 + k * 30, 1.3 + k * 0.25);
  diorama(c, t, { sign: 1, blanket: 1, cth: { mood: 'smile', hug: 'fish' } });
  drawJelly(c, DIO.cthX - 330, DIO.floor - 470 + Math.sin(t * 1.5) * 20, 1.3, t);
  drawJelly(c, DIO.cthX + 380, DIO.floor - 520 + Math.cos(t * 1.4) * 20, 1.0, t, '#b59cff');
  for (let i = 0; i < 3; i++) drawFish(c, DIO.cthX - 200 + i * 200, DIO.floor - 620 + Math.sin(t * 2 + i) * 14, 1.0, t, { color: ['#ffb347', '#8fd3ff', '#ff9ecf'][i], flip: i % 2 === 1, seed: i });
  notesFx(c, t, 8, DIO.cthX - 400, DIO.floor - 800, 800, 400, 71, '#ffffff');
  c.restore();
}
/* a robe laid flat, folding up: f 0..1 (sleeves fold in, then the hem folds up) */
function robeFlat(c, x, y, s, t, f) {
  const P = KID, a = clamp(f * 2), b = clamp(f * 2 - 1);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.save(); c.translate(0, 180); c.scale(1, 1 - b); c.translate(0, -180);
  if (b < 0.6) cel(c, (() => { const p = new Path2D(); p.arc(0, -150, 95, Math.PI, 0); p.closePath(); return p; })(), P.robeDark, { d: 8 });
  cel(c, pRRect(-150, -150, 300, 190, 22), P.robe, { shadow: P.robeDark, d: 12 });
  line(c, 0, -150, 0, 40, P.trim, 6);
  c.restore();
  c.save(); c.translate(0, 180); c.scale(1, 1 - 2 * b); c.translate(0, -180);
  cel(c, pRRect(-150, 30, 300, 180, 22), b > 0.5 ? P.robeDark : P.robe, { shadow: P.robeDark, d: 12 });
  line(c, -140, 190, 140, 190, P.trim, 8);
  c.restore();
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 150, -120); c.scale(1 - 2 * a, 1);
    cel(c, pRRect(sd > 0 ? -10 : -160, -20, 170, 100, 26), a > 0.5 ? P.robeDark : P.robe, { shadow: P.robeDark, d: 8 });
    line(c, sd > 0 ? 150 : -150, -12, sd > 0 ? 150 : -150, 72, P.trim, 7);
    c.restore();
  }
  c.restore();
}
function sF3(c, t) {
  const c1 = beatTime(beatInfo(WT(32, 5) - 0.12).i), c2 = beatTime(beatInfo(WT(32, 9) - 0.15).i);
  c.save();
  beatZoom(c, t, 0.02);
  if (t < c1) {
    kitchenBg(c, t);
    groundShadow(c, 960, 780, 700, 40, 0.35);
    cel(c, pRRect(360, 720, 1200, 60, 18), '#ffb3cf', { d: 8, hi: '#ffd6e6', line: '#8a2a5a' });
    const f = seg(t, WT(32, 1) - 0.25, WT(32, 3) + 0.05);
    if (f < 1) robeFlat(c, 960, 560, 1.1, t, f);
    else {
      const p = easeOutBack(seg(t, WT(32, 3) + 0.05, WT(32, 3) + 0.35));
      c.save(); c.translate(960, 700);
      for (let k = 0; k < 3; k++) { c.save(); c.translate(0, -k * 44 * p); c.scale(p * 2.6, p * 2.6); drawProp(c, 'fold', t); c.restore(); }
      c.restore();
      glow(c, 960, 620, 260, 'rgba(255,255,255,0.5)');
      for (let k = 0; k < 6; k++) sparkle(c, 960 + Math.cos(k * 1.1 + t * 2) * 220, 560 + Math.sin(k * 1.7 + t * 2) * 120, 16, '#fff');
    }
    sfx(c, 'fold fold', 960, 250, t, WT(32, 1), { size: 100, fill: '#b59cff', rot: -0.1, dur: 1 });
  } else if (t < c2) {
    burst(c, W / 2, 560, t, '#6a3a9a', '#7c4cae', 20);
    const lk = easeOutBack(seg(t, WT(32, 5) - 0.1, WT(32, 7)));
    drawBook(c, W / 2, 900, 2.6, { t, face: lk > 0.5 ? 'pout' : 'grin', locked: lk });
    sfx(c, 'click!', 1400, 280, t, WT(32, 7), { size: 110, fill: '#ffd166', rot: 0.12, dur: 1 });
  } else {
    kitchenBg(c, t);
    kitchenLamp(c, 960, 240, t, { swing: true });
    kitchenCrew(c, t, { dance: 1 });
    confetti(c, t, c2, 960, 400, 70);
    sfx(c, 'dance!', 960, 150, t, WT(32, 9), { size: 110, fill: '#ff6f9f', dur: 1.2 });
  }
  c.restore();
}
function discoRays(c, t) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 6; k++) {
    const a = t * 0.8 + k * 1.05;
    const g = c.createLinearGradient(960, 280, 960 + Math.cos(a) * 1600, 280 + Math.abs(Math.sin(a)) * 1300);
    const col = ['255,140,200', '140,230,190', '255,220,120'][k % 3];
    g.addColorStop(0, `rgba(${col},0.22)`); g.addColorStop(1, `rgba(${col},0)`);
    c.beginPath(); c.moveTo(960, 280); c.lineTo(960 + Math.cos(a) * 2000, 280 + Math.abs(Math.sin(a)) * 1600); c.lineTo(960 + Math.cos(a + 0.12) * 2000, 280 + Math.abs(Math.sin(a + 0.12)) * 1600); c.closePath();
    c.fillStyle = g; c.fill();
  }
  c.restore();
}
function sF4(c, t) {
  c.save();
  beatZoom(c, t, 0.03);
  kitchenBg(c, t);
  discoRays(c, t);
  kitchenLamp(c, 960, 240, t, { swing: true });
  kitchenCrew(c, t, { dance: 1 });
  drawClock(c, 760, 600, 0.7, { t, air: hop(t, 20), face: 'happy', ring: 1, armL: 2.4, armR: 2.4 });
  drawBook(c, 1180, 600, 0.55, { t, air: hop(t, 20, 1, 0.5), face: 'pout', locked: 1, tilt: Math.sin(t * 6) * 0.1 });
  confetti(c, t, LS(33) - 0.3, 500, 300, 50); confetti(c, t, LS(33) + 1.2, 1400, 300, 50);
  notesFx(c, t, 8, 100, 100, 1700, 500, 81, '#ffe9a0');
  c.restore();
}
function sF5(c, t) {
  c.save();
  c.save(); c.beginPath(); c.rect(0, 0, W, 540); c.clip();
  c.translate(0, -470);
  kitchenBg(c, t); discoRays(c, t); kitchenLamp(c, 960, 240, t, { swing: true }); kitchenCrew(c, t, { dance: 1 });
  c.restore();
  c.save(); c.beginPath(); c.rect(0, 540, W, 540); c.clip();
  c.translate(0, 540);
  c.save(); dioCam(c, DIO.cthX + 30, DIO.floor - 320, 1.2); c.translate(0, -300);
  diorama(c, t, { sign: 1, blanket: 1, cth: { mood: 'smile', hug: 'fish', headTilt: Math.sin(beatInfo(t).barF * TAU * 2) * 0.08 } });
  const b = beatInfo(t);
  tentacle(c, DIO.cthX + 250, DIO.floor - 110, 90, 16, -1.4 - Math.sin(Math.PI * b.f) * 0.5, t, 0, 0.6, CTH.shade);
  c.restore();
  c.restore();
  line(c, 0, 540, W, 540, 'rgba(20,10,46,0.55)', 30); line(c, 0, 540, W, 540, '#fff', 14);
  sfx(c, 'tap tap', 1450, 760, t, LS(34) + 0.5, { size: 80, fill: '#8fe3b0', rot: 0.1, dur: 2 });
  c.restore();
}
function heartFirework(c, x, y, t, t0, col) {
  const d = t - t0; if (d < 0 || d > 2.2) return;
  const p = easeOutCubic(clamp(d / 0.9)), a = 1 - seg(d, 1.3, 2.2);
  c.save(); c.globalAlpha = a;
  glow(c, x, y, 240 * p, rgba(col, 0.35));
  for (let i = 0; i < 24; i++) {
    const u = (i / 24) * TAU;
    const hx = 16 * Math.pow(Math.sin(u), 3), hy = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
    sparkle(c, x + hx * 14 * p, y + hy * 14 * p + d * d * 30, 12, col);
  }
  c.restore();
}
function sF6(c, t) {
  c.save();
  const k = easeInOut(seg(t, LS(35) - 0.3, LE(35) + 1.5));
  const [cx, cy, z] = lerpCam(k, [1200, 420, 1.0], [960, 1150, 0.47]);
  dioCam(c, cx, cy, z);
  diorama(c, t, { sign: 1, blanket: 1, porch: 1, moonX: 700, moonY: 100, cth: { mood: 'smile', hug: 'fish' } });
  porchCast(c, t, [['mabel', 1150, { s: 0.6, face: 'happy', sing: true, armL: 2.4 }], ['friendA', 1250, { s: 0.6, eyes: 'happy', sing: true, armR: 2.5, handR: 'open' }], ['kid', 1350, { s: 0.62, eyes: 'happy', sing: true, armL: 2.5, armR: 2.5, handL: 'open', handR: 'open' }], ['friendB', 1450, { s: 0.6, eyes: 'happy', sing: true, armL: 2.5, handL: 'open' }], ['mail', 1550, { s: 0.6, face: 'happy', sing: true, armR: 2.4 }]]);
  const bt = LS(35) - 0.2;
  heartFirework(c, 620, 180, t, bt, '#ff9ecf'); heartFirework(c, 980, 60, t, bt + 0.9, '#ffe27a'); heartFirework(c, 300, 120, t, bt + 1.8, '#8fe3b0'); heartFirework(c, 820, 300, t, bt + 2.7, '#b59cff'); heartFirework(c, 450, 20, t, bt + 3.6, '#8fd3ff');
  c.restore();
}

/* ================= THE POLITE NOTE ================= */
function sNoteWrite(c, t) {
  c.save();
  kitchenBg(c, t);
  kitchenLamp(c, 960, 200, t, { swing: false, bright: 0.6 });
  groundShadow(c, 960, 830, 820, 40, 0.35);
  cel(c, pRRect(200, 760, 1520, 60, 18), '#ffb3cf', { d: 8, hi: '#ffd6e6', line: '#8a2a5a' });
  const t0 = LE(35) + 0.2;
  c.save(); c.translate(1150, 680); c.rotate(-0.05);
  c.save(); c.translate(8, 10); rrect(c, -260, -170, 520, 300, 16); c.fillStyle = 'rgba(40,20,60,0.25)'; c.fill(); c.restore();
  cel(c, pRRect(-260, -170, 520, 300, 16), '#fff8ec', { shadow: '#f0e2cc', d: 8, line: '#8a6a4a' });
  const w = seg(t, t0, t0 + 2.4);
  const msg = 'Dear Ancient One,';
  txt(c, msg.slice(0, Math.floor(w * 1.6 * msg.length)), -220, -100, { size: 44, fill: '#6b3fc9', stroke: false, align: 'left', font: DISPLAY, weight: 400, shadow: false });
  if (w > 0.7) { heartPath(c, 150, 30, 40 * easeOutBack(seg(w, 0.7, 1))); fs(c, '#ff6f9f', '#8a1a4a', 4); }
  for (let k = 0; k < 3; k++) if (w > 0.6 + k * 0.1) line(c, -220, -30 + k * 40, -20 + k * 30, -30 + k * 40, '#b9a8e0', 5);
  c.restore();
  drawKid(c, 760, 900, 1.4, { t, eyes: 'open', look: 1, mouth: 'tongue', armR: 1.4 + Math.sin(t * 18) * 0.1, holdR: 'pen' });
  c.restore();
}
function sNoteSend(c, t) {
  c.save();
  dioCam(c, 1200, 380, 1.25);
  diorama(c, t, { porch: 1, moonX: 700, moonY: 60 });
  const throwT = LS(36) + 0.5;
  const k = seg(t, throwT, throwT + 1.2);
  drawKid(c, 1280, PORCH, 0.66, { t, air: hop(t, 6, 2), eyes: k > 0 ? 'happy' : 'open', sing: true, armR: k > 0 ? 2.8 : 1.2, armL: 0.4, holdR: k > 0 ? undefined : 'bottle', flip: true });
  if (k > 0 && k < 1) {
    const bx = lerp(1250, 800, k), by = lerp(330, DIO.sea, k) - Math.sin(k * Math.PI) * 260;
    c.save(); c.translate(bx, by); c.rotate(k * 9); glow(c, 0, 0, 60, 'rgba(200,255,240,0.5)'); drawBottle(c, 0, 0, 0.5, t); c.restore();
  }
  const sp = t - (throwT + 1.2);
  if (sp > 0 && sp < 1) { for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.3; circle(c, 800 + Math.cos(a) * sp * 160, DIO.sea + Math.sin(a) * sp * 160 + sp * sp * 200, 10 * (1 - sp)); c.fillStyle = '#e8f7ff'; c.fill(); } }
  c.restore();
  sfx(c, 'yoink ♡', 1450, 330, t, throwT, { size: 80, fill: '#ff9ecf', rot: -0.1 });
  sfx(c, 'plip!', 620, 600, t, throwT + 1.2, { size: 80, fill: '#bfe8ff', rot: 0.1 });
}
function sNoteArrive(c, t) {
  c.save();
  const t0 = LS(37) - 0.1, catchT = WT(37, 2);
  const k = seg(t, t0, catchT);
  dioCam(c, DIO.cthX + 60, lerp(DIO.floor - 900, DIO.floor - 330, easeInOut(k)), 1.2);
  const hugged = t > catchT;
  diorama(c, t, { sign: 1, blanket: 1, cth: { mood: 'smile', hug: hugged ? 'bottle' : 'fish' } });
  if (!hugged) { c.save(); c.translate(DIO.cthX + 120 + Math.sin(t * 3) * 40, lerp(DIO.floor - 1150, DIO.floor - 230, k)); c.rotate(Math.sin(t * 2) * 0.4); glow(c, 0, 0, 70, 'rgba(200,255,240,0.5)'); drawBottle(c, 0, 0, 0.7, t); c.restore(); }
  c.restore();
  const np = easeOutBack(seg(t, WT(37, 0) - 0.1, WT(37, 1)));
  if (np > 0) {
    c.save(); c.translate(1450, 400); c.rotate(0.06 + Math.sin(t) * 0.02); c.scale(np, np);
    c.save(); c.translate(12, 16); rrect(c, -300, -170, 600, 340, 20); c.fillStyle = 'rgba(10,20,50,0.35)'; c.fill(); c.restore();
    cel(c, pRRect(-300, -170, 600, 340, 20), '#fff8ec', { shadow: '#f0e2cc', d: 10, line: '#8a6a4a', lw: 7 });
    for (let i = 0; i < 4; i++) line(c, -260, -90 + i * 64, 260, -90 + i * 64, 'rgba(180,160,220,0.4)', 3);
    txt(c, 'Please enjoy', 0, -70, { size: 60, font: DISPLAY, weight: 400, fill: '#6b3fc9', stroke: false, shadow: false });
    txt(c, 'your sleep tonight!', 0, 10, { size: 52, font: DISPLAY, weight: 400, fill: '#6b3fc9', stroke: false, shadow: false });
    heartPath(c, 190, 110, 26); fs(c, '#ff6f9f', '#8a1a4a', 4);
    txt(c, '— your neighbors', -40, 108, { size: 34, fill: '#8a6fe0', stroke: false, shadow: false });
    c.restore();
  }
  if (hugged) heartsFx(c, t, 8, 450, 250, 500, 500, 91, 1.2);
}

/* ================= OUTRO ================= */
function sOutro1(c, t) {
  c.save();
  const k = easeInOut(seg(t, LE(37), LS(39)));
  dioCam(c, DIO.cthX + 30, DIO.floor - 330, 1.6 + k * 0.6);
  diorama(c, t, { sign: 1, blanket: 1, cth: { mood: 'smile', hug: 'bottle' } });
  c.restore();
  glow(c, W / 2, H / 2, 900, 'rgba(255,190,230,0.2)');
  notesFx(c, t, 6, 200, 100, 1500, 700, 101, '#ffffff');
  const hb = 0.5 + 0.5 * Math.sin(t * 1.6);
  c.save(); c.globalAlpha = 0.85;
  glow(c, 1340, 360 - hb * 20, 120, 'rgba(255,180,220,0.45)');
  heartPath(c, 1340, 360 - hb * 20, 40 + hb * 30); c.fillStyle = 'rgba(255,190,230,0.4)'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke();
  c.restore();
}
function sOutro2(c, t) {
  const up = LS(40) - 0.4;
  if (t < up) {
    c.save();
    const k = easeInOut(seg(t, LS(39) - 0.2, up));
    dioCam(c, lerp(DIO.cthX, 1300, k), lerp(DIO.floor - 350, 350, k), lerp(1.3, 1.45, k) - Math.sin(k * Math.PI) * 0.6);
    diorama(c, t, { sign: 1, blanket: 1, porch: 1, moonX: 900, moonY: 80, cth: { mood: 'smile', hug: 'bottle' } });
    porchCast(c, t, [['kid', 1290, { s: 0.62, eyes: 'happy', sing: true, armL: 2.5, armR: 2.5, handL: 'open', handR: 'open' }]]);
    c.restore();
    c.save(); c.globalAlpha = Math.sin(k * Math.PI); bubblesFx(c, t * 3, 30, 0, 0, W, H, { speed: 300, r: 22 }); c.restore();
    return;
  }
  c.save();
  beatZoom(c, t, 0.02);
  dioCam(c, 1300, 320, 1.45);
  diorama(c, t, { porch: 1, moonX: 900, moonY: 60, moonShades: true });
  const b = beatInfo(t);
  const al = (i) => ((b.i + i) % 2 ? 2.6 : 0.8), ar = (i) => ((b.i + i) % 2 ? 0.8 : 2.6);
  porchCast(c, t, [
    ['cat', 1000, { s: 0.52 }],
    ['mabel', 1100, { s: 0.56, face: 'happy', sing: true, cup: false, armL: 2.3 }],
    ['friendA', 1200, { s: 0.56, eyes: 'happy', sing: true, armL: al(1), armR: ar(1), handL: 'open', handR: 'open' }],
    ['kid', 1305, { s: 0.62, eyes: 'happy', sing: true, armL: al(2), armR: ar(2), handL: 'open', handR: 'open' }],
    ['friendB', 1410, { s: 0.56, eyes: 'happy', sing: true, armL: al(3), armR: ar(3), handL: 'open', handR: 'open' }],
    ['mail', 1510, { s: 0.56, face: 'happy', sing: true, armL: 2.3, armR: 2.3 }],
    ['clock', 1610, { s: 0.5, face: 'happy', armL: 2.3, armR: 2.3 }],
  ]);
  fireflies(c, t, 20, 900, 150, 900, 260, 9);
  c.restore();
  dreamBubble(c, 420, 330, 600, 420, t, pop(t, up + 0.3, 0.5), () => {
    fillGrad(c, 0, 120, 0, 540, [[0, '#3a78cc'], [1, '#1b3a82']], 100, 100, 700, 500);
    bubblesFx(c, t, 10, 120, 120, 600, 420, { r: 10 });
    c.save(); c.translate(360, 470 + hop(t, 30)); c.scale(0.48, 0.48); drawCthulhu(c, 0, 0, 1, { t, mood: 'happy', armsUp: 1, cap: true, tilt: Math.sin(t * 6) * 0.15, noShadow: true }); c.restore();
    drawKid(c, 560, 470, 0.5, { t, air: hop(t, 24, 1, 0.5), eyes: 'happy', sing: true, armL: 2.5, armR: 2.5, handL: 'open', handR: 'open', noShadow: true });
  });
  sfx(c, '♪ everyone! ♪', 1360, 900, t, WT(40, 1), { size: 90, fill: '#ffe27a', dur: 3 });
}
function sEnd(c, t) {
  c.save();
  dioCam(c, DIO.cthX + 30, DIO.floor - 330, 2.0);
  diorama(c, t, { sign: 1, blanket: 1, cth: { mood: 'smile', hug: 'bottle' } });
  c.restore();
  const t0 = LE(40) - 0.4;
  const k = easeInCubic(seg(t, t0 + 0.6, SONG_LENGTH - 0.25));
  const r = lerp(1400, 0, k);
  c.save();
  c.beginPath(); c.rect(0, 0, W, H);
  const hx = W / 2 + 10, hy = H / 2 + 60;
  c.moveTo(hx, hy + r * 0.35);
  c.bezierCurveTo(hx + r * 1.1, hy - r * 0.35, hx + r * 0.45, hy - r * 1.05, hx, hy - r * 0.45);
  c.bezierCurveTo(hx - r * 0.45, hy - r * 1.05, hx - r * 1.1, hy - r * 0.35, hx, hy + r * 0.35);
  c.fillStyle = '#120a2e'; c.fill('evenodd');
  c.restore();
  const tp = seg(t, t0, t0 + 0.6) * (1 - seg(t, SONG_LENGTH - 0.8, SONG_LENGTH - 0.1));
  c.save(); c.globalAlpha = tp;
  glow(c, W / 2, 150, 700, 'rgba(14,8,48,0.6)');
  bouncyText(c, 'Goodnight, Cthulhu', W / 2, 150, t, t0, { size: 96, colors: TITLE_COLS });
  c.globalAlpha = seg(t, t0 + 1.5, t0 + 2.0) * (1 - seg(t, SONG_LENGTH - 0.8, SONG_LENGTH - 0.1));
  txt(c, 'sleep tight ♡', W / 2, 950, { size: 56, font: DISPLAY, weight: 400, fill: '#fff6e6', lw: 12, stroke: '#2a1a5a' });
  c.restore();
}
