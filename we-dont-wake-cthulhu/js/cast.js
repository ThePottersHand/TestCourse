/* The cast. All characters are original chibi designs drawn with canvas paths.
   draw functions take (c, x, y, s, o): x,y is the ground point under the character, s is scale.
   o.air lifts the body off the ground (negative = up) while the contact shadow stays put.
   o.sing (true or 0..1) animates the mouth from the lead-vocal word timings. */
'use strict';

/* ======================= palettes ======================= */
const HERO = {
  style: 'hero',
  hair: '#363c8c', hairDark: '#23286a', hairHi: '#7480e0', hairLine: '#141638',
  iris1: '#6e3510', iris2: '#ffc14d',
  skin: '#ffe2cf', skinShade: '#f6bea6', skinLine: '#a8604f',
  top: '#f7c948', topDark: '#dfa12a', pants: '#4a5aa8', shoes: '#f6f3ff', shoeCap: '#ff6f7f',
  robe: '#6b3fc9', robeDark: '#48279a', trim: '#ffd166', lining: '#ff9ecf', hoodIn: '#221352',
};
const KID = HERO; // older name kept for props that borrow the robe colours
const FRIEND_A = { style: 'bob', hair: '#6fb7ff', hairDark: '#4a8fe0', hairHi: '#d2e9ff', hairLine: '#1f3f78', iris1: '#1f5fa8', iris2: '#8fd8ff', top: '#ff9ecf', topDark: '#e87aab', pants: '#8a7ff0', shoes: '#3b3a7a', shoeCap: '#3b3a7a' };
const FRIEND_B = { style: 'buns', hair: '#ff9d4a', hairDark: '#e0772a', hairHi: '#ffd9b3', hairLine: '#7a3510', iris1: '#2f7a4a', iris2: '#9ff0c0', top: '#8fe3b0', topDark: '#5fc494', pants: '#b59cff', shoes: '#7a3a5a', shoeCap: '#7a3a5a' };

function singOpen(o, t) {
  if (!o.sing) return -1;
  const v = vocal(t);
  return { open: v.open * (o.sing === true ? 1 : o.sing), round: v.round };
}
/* shared singing mouth, drawn at the current origin */
function singMouth(c, open, round, lineCol) {
  if (open < 0.1) {
    c.beginPath(); c.moveTo(-10, -2); c.quadraticCurveTo(0, 7, 10, -2); fs(c, null, lineCol, 4.5);
    return;
  }
  const w = lerp(15, 9, round) + open * 3, h = 3 + open * 17;
  const p = new Path2D();
  p.moveTo(-w, -3); p.quadraticCurveTo(0, -5 - open * 2, w, -3);
  p.quadraticCurveTo(w * 0.95, h, 0, h + 1); p.quadraticCurveTo(-w * 0.95, h, -w, -3); p.closePath();
  c.fillStyle = '#7a1f3d'; c.fill(p);
  c.save(); c.clip(p);
  ellipse(c, 0, h * 0.85, w * 0.62, h * 0.38); c.fillStyle = '#ff8aa3'; c.fill();
  if (open > 0.45) { c.fillStyle = '#fff'; c.fillRect(-w, -5, w * 2, 4.5); }
  c.restore();
  c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = lineCol; c.stroke(p);
}

/* ======================= eyes & mouths for the kids ======================= */
function kidEye(c, x, y, P, o, side, t) {
  const kind = o.eyes || 'open';
  const lk = (o.look || 0) * 4;
  const hero = P.style === 'hero';
  const ln = P.hairLine || INK;
  c.save();
  c.translate(x, y);
  if (kind === 'happy') {
    c.beginPath(); c.moveTo(-15, 5); c.quadraticCurveTo(0, -16, 15, 5); fs(c, null, ln, 6);
  } else if (kind === 'closed') {
    c.beginPath(); c.moveTo(-15, -2); c.quadraticCurveTo(0, 12, 15, -2); fs(c, null, ln, 6);
    if (!hero) line(c, side * 15, -2, side * 22, -8, ln, 4);
  } else if (kind === 'dot') {
    ellipse(c, lk * 0.5, 0, 5.5, 7.5); c.fillStyle = ln; c.fill();
  } else if (kind === 'shock') {
    const j = Math.sin(t * 60) * 1.5;
    ellipse(c, j, 0, 17, 20); fs(c, '#fff', ln, 5);
    circle(c, j, 1, 4.5); c.fillStyle = ln; c.fill();
  } else if (kind === 'star') {
    softStar(c, 0, 1, 20, 5, -Math.PI / 2 + Math.sin(t * 8) * 0.2, 0.55);
    const g = c.createLinearGradient(0, -20, 0, 20); g.addColorStop(0, '#fff3a8'); g.addColorStop(1, '#ffb33a');
    fs(c, g, '#9a5a10', 4);
    circle(c, -5, -5, 4); c.fillStyle = '#fff'; c.fill();
  } else if (kind === 'spiral') {
    c.beginPath();
    for (let a = 0; a < 14; a += 0.3) { const r = a * 1.35; c.lineTo(Math.cos(a + t * 10) * r, Math.sin(a + t * 10) * r); }
    fs(c, null, ln, 3.5);
  } else if (kind === 'glow') {
    glow(c, 0, 0, 46, 'rgba(255,255,255,0.95)');
    ellipse(c, 0, 0, 13, 7); c.fillStyle = '#fff'; c.fill();
  } else if (kind === 'wink' && side > 0) {
    c.beginPath(); c.moveTo(-14, 2); c.quadraticCurveTo(0, -12, 14, 2); fs(c, null, ln, 6);
  } else if (hero) {
    // sclera, amber iris, bold upper lid
    const white = pEllipse(0, 1, 15.5, 18.5);
    c.fillStyle = '#fffdfb'; c.fill(white);
    c.save(); c.clip(white);
    const g = c.createLinearGradient(0, -14, 0, 18);
    g.addColorStop(0, P.iris1); g.addColorStop(1, P.iris2);
    ellipse(c, lk, 3, 11.5, 15.5); c.fillStyle = g; c.fill();
    ellipse(c, lk, 3, 5.5, 8); c.fillStyle = '#26101c'; c.fill();
    c.fillStyle = 'rgba(40,12,30,0.32)'; c.fillRect(-20, -20, 40, 11);
    ellipse(c, -4 + lk, -5, 4.6, 5.8); c.fillStyle = '#fff'; c.fill();
    circle(c, 5 + lk, 10, 2.4); c.fill();
    c.restore();
    c.beginPath(); c.moveTo(-17, -6); c.quadraticCurveTo(-4, -22, side * 3 + 17, -10 - side * 1.5);
    c.lineWidth = 6.5; c.strokeStyle = ln; c.lineCap = 'round'; c.stroke();
    line(c, side * 10, 18, side * 15, 13, P.skinLine || ln, 2.5);
    if (kind === 'sleepy' || kind === 'half') {
      c.save(); c.clip(white); c.fillStyle = P.skin || PAL.skin; c.fillRect(-20, -22, 40, kind === 'sleepy' ? 22 : 13); c.restore();
      line(c, -16, kind === 'sleepy' ? 0 : -9, 16, kind === 'sleepy' ? 0 : -9, ln, 5.5);
    }
  } else {
    const g = c.createLinearGradient(0, -21, 0, 21);
    g.addColorStop(0, P.iris1); g.addColorStop(1, P.iris2);
    ellipse(c, 0, 0, 15, 21); c.fillStyle = g; c.fill();
    ellipse(c, lk, 2, 8, 11); c.fillStyle = '#1c1240'; c.fill();
    c.save(); ellipse(c, 0, 0, 15, 21); c.clip(); c.fillStyle = 'rgba(20,10,60,0.28)'; c.fillRect(-16, -22, 32, 12); c.restore();
    ellipse(c, -5 + lk, -8, 6, 7.5); c.fillStyle = '#fff'; c.fill();
    circle(c, 6 + lk, 9, 3); c.fill();
    c.beginPath(); c.ellipse(0, 0, 17, 22, 0, Math.PI * 1.1, Math.PI * 1.9); fs(c, null, ln, 6);
    line(c, side * 15, -13, side * 22, -19, ln, 4.5);
    if (kind === 'sleepy' || kind === 'half') {
      c.beginPath(); c.rect(-20, -26, 40, kind === 'sleepy' ? 26 : 16); c.fillStyle = PAL.skin; c.fill();
      line(c, -16, kind === 'sleepy' ? 0 : -10, 16, kind === 'sleepy' ? 0 : -10, ln, 5.5);
    }
  }
  c.restore();
}

function kidMouth(c, kind, t, lc) {
  c.save();
  c.translate(0, -118);
  switch (kind) {
    case 'open':
      c.beginPath(); c.moveTo(-15, -4); c.quadraticCurveTo(0, -2, 15, -4); c.quadraticCurveTo(12, 18, 0, 18); c.quadraticCurveTo(-12, 18, -15, -4);
      fs(c, '#7a1f3d', lc, 4);
      c.save(); c.clip(); ellipse(c, 0, 14, 9, 6); c.fillStyle = '#ff8aa3'; c.fill(); c.restore();
      break;
    case 'grin':
      c.beginPath(); c.moveTo(-20, -6); c.quadraticCurveTo(0, -2, 20, -6); c.quadraticCurveTo(14, 16, 0, 16); c.quadraticCurveTo(-14, 16, -20, -6);
      fs(c, '#fff', lc, 4);
      break;
    case 'o': ellipse(c, 0, 2, 7, 9); fs(c, '#7a1f3d', lc, 4); break;
    case 'O': ellipse(c, 0, 4, 14, 19 + Math.sin(t * 30) * 1.5); fs(c, '#7a1f3d', lc, 4); break;
    case 'flat': line(c, -9, 0, 9, 0, lc, 4.5); break;
    case 'wavy':
      c.beginPath(); c.moveTo(-16, 2);
      for (let k = 1; k <= 4; k++) c.quadraticCurveTo(-16 + (k - 0.5) * 8, k % 2 ? -6 : 8, -16 + k * 8, 2);
      fs(c, null, lc, 4); break;
    case 'cat':
      c.beginPath(); c.moveTo(-14, -3); c.quadraticCurveTo(-7, 8, 0, -1); c.quadraticCurveTo(7, 8, 14, -3); fs(c, null, lc, 4.5); break;
    case 'pout':
      c.beginPath(); c.moveTo(-9, 4); c.quadraticCurveTo(0, -5, 9, 4); fs(c, null, lc, 4.5); break;
    case 'tongue':
      c.beginPath(); c.moveTo(-12, -2); c.quadraticCurveTo(0, 8, 12, -2); fs(c, null, lc, 4.5);
      c.beginPath(); c.moveTo(2, 2); c.quadraticCurveTo(4, 14, 10, 12); c.quadraticCurveTo(14, 6, 10, 0); fs(c, '#ff8aa3', lc, 3);
      break;
    case 'shh': ellipse(c, 0, 0, 5, 6); c.fillStyle = '#7a1f3d'; c.fill(); break;
    default:
      c.beginPath(); c.moveTo(-11, -3); c.quadraticCurveTo(0, 9, 11, -3); fs(c, null, lc, 4.5);
  }
  c.restore();
}

/* props held in hands; drawn upright around the hand */
function drawProp(c, name, t, o = {}) {
  switch (name) {
    case 'cloth': {
      const w = Math.sin(t * 20) * 4;
      c.beginPath(); c.moveTo(-22, -10 + w); c.quadraticCurveTo(0, -20, 24, -8 - w); c.lineTo(20, 20); c.quadraticCurveTo(0, 26 + w, -24, 16); c.closePath();
      fs(c, '#ffe27a', INK, 4); line(c, -14, 2, 12, 4, '#f0b43c', 3); break;
    }
    case 'scroll': {
      rrect(c, -34, -12, 68, 24, 10); fs(c, '#fff0cc', INK, 4);
      circle(c, -34, 0, 13); fs(c, '#e8c98f', INK, 4); circle(c, 34, 0, 13); fs(c, '#e8c98f', INK, 4); break;
    }
    case 'key': drawKey(c, 0, 0, 0.55, t); break;
    case 'candle':
      rrect(c, -10, -30, 20, 44, 5); fs(c, '#2b2340', INK, 4); flame(c, 0, -34, 0.8, t); break;
    case 'phone':
      rrect(c, -22, -40, 44, 76, 10); fs(c, '#3a3a5a', INK, 4); rrect(c, -16, -32, 32, 56, 5); fs(c, '#9fe0ff', null); break;
    case 'pen':
      c.save(); c.rotate(-0.6); rrect(c, -7, -50, 14, 70, 4); fs(c, '#ffd166', INK, 4);
      c.beginPath(); c.moveTo(-7, 20); c.lineTo(7, 20); c.lineTo(0, 36); c.closePath(); fs(c, '#ffe3c4', INK, 4);
      rrect(c, -7, -58, 14, 12, 4); fs(c, '#ff8fc7', INK, 4); c.restore(); break;
    case 'note': drawEnvelope(c, 0, 0, 0.7); break;
    case 'cup':
      rrect(c, -20, -24, 40, 40, 10); fs(c, '#ff8fc7', INK, 4);
      c.beginPath(); c.arc(22, -4, 11, -1.4, 1.4); fs(c, null, lineOf('#ff8fc7'), 5);
      for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(-6 + k * 12, -30); c.quadraticCurveTo(-14 + k * 12, -44 + Math.sin(t * 4 + k) * 4, -4 + k * 12, -58); fs(c, null, 'rgba(255,255,255,0.8)', 4); }
      break;
    case 'teacup':
      ellipse(c, 0, 14, 30, 8); fs(c, '#fff', INK, 4);
      c.beginPath(); c.moveTo(-22, -8); c.lineTo(22, -8); c.quadraticCurveTo(20, 14, 0, 14); c.quadraticCurveTo(-20, 14, -22, -8); fs(c, '#fff', INK, 4);
      line(c, -16, 0, 16, 0, '#ff8fc7', 4);
      c.beginPath(); c.arc(24, 0, 8, -1.3, 1.3); fs(c, null, '#8a7fa8', 4); break;
    case 'pointer': c.save(); c.rotate(0.45); line(c, 0, 0, 0, -120, '#a8744a', 7); circle(c, 0, -122, 7); fs(c, '#ff6f6f', INK, 3); c.restore(); break;
    case 'letters':
      for (let k = 0; k < 3; k++) { c.save(); c.rotate(-0.25 + k * 0.2); drawEnvelope(c, 0, -10 - k * 4, 0.55, k === 1 ? '#ffe7f1' : '#fff'); c.restore(); }
      break;
    case 'bottle': drawBottle(c, 0, 0, 0.6, t); break;
    case 'fold': rrect(c, -34, -18, 68, 36, 8); fs(c, '#6b3fc9', INK, 4); line(c, -34, 0, 34, 0, '#ffd166', 4); break;
  }
}

function kidArm(c, side, ang, P, o, t) {
  const robe = (o.outfit || 'hoodie') === 'robe';
  const sx = side * 30, sy = -92;
  c.save();
  c.translate(sx, sy);
  c.rotate(-side * ang);
  const col = robe ? P.robe : P.top, dark = robe ? P.robeDark : P.topDark;
  const sl = new Path2D();
  if (robe) { sl.moveTo(-12, -6); sl.lineTo(12, -6); sl.lineTo(21, 38); sl.quadraticCurveTo(0, 47, -21, 38); }
  else { sl.moveTo(-12, -6); sl.lineTo(12, -6); sl.lineTo(11, 36); sl.quadraticCurveTo(0, 42, -11, 36); }
  sl.closePath();
  cel(c, sl, col, { shadow: dark, d: 7, lw: 4.5 });
  if (robe) { c.beginPath(); c.moveTo(-20, 36); c.quadraticCurveTo(0, 45, 20, 36); fs(c, null, P.trim, 5); }
  else { const cf = pRRect(-11, 29, 22, 10, 4); c.fillStyle = dark; c.fill(cf); }
  const hand = side < 0 ? o.handL : o.handR;
  const SK = P.skin || PAL.skin, SKL = P.skinLine || INK;
  c.translate(0, 46);
  if (hand === 'point') {
    rrect(c, -5, 4, 10, 26, 5); fs(c, SK, SKL, 4);
  } else if (hand === 'shh') {
    c.save(); c.rotate(side * ang); rrect(c, -5.5, -34, 11, 30, 5.5); fs(c, SK, SKL, 4); c.restore();
  } else if (hand === 'open') {
    for (let k = -1; k <= 1; k++) { c.save(); c.rotate(k * 0.45); ellipse(c, 0, 14, 5.5, 9); fs(c, SK, SKL, 3.5); c.restore(); }
  } else if (hand === 'thumb') {
    c.save(); c.rotate(side * ang - side * 0.2); rrect(c, -5, -28, 10, 22, 5); fs(c, SK, SKL, 4); c.restore();
  }
  cel(c, pEllipse(0, 0, 12, 12), SK, { shadow: P.skinShade || PAL.skinShade, d: 4, lw: 4, line: SKL });
  const item = side < 0 ? o.holdL : o.holdR;
  if (item) { c.rotate(side * ang); drawProp(c, item, t, o); }
  c.restore();
}

/* hair shapes -------------------------------------------------------------- */
function heroFrontHair() {
  const p = new Path2D();
  p.moveTo(-78, -176);
  p.quadraticCurveTo(-82, -158, -86, -132);
  p.quadraticCurveTo(-94, -152, -95, -178);
  p.quadraticCurveTo(-100, -200, -112, -214);
  p.quadraticCurveTo(-98, -220, -93, -232);
  p.quadraticCurveTo(-98, -258, -88, -282);
  p.quadraticCurveTo(-68, -262, -50, -266);
  p.quadraticCurveTo(-42, -292, -18, -304);
  p.quadraticCurveTo(-8, -280, 8, -275);
  p.quadraticCurveTo(26, -296, 54, -298);
  p.quadraticCurveTo(48, -274, 63, -263);
  p.quadraticCurveTo(86, -268, 108, -256);
  p.quadraticCurveTo(93, -240, 97, -226);
  p.quadraticCurveTo(108, -212, 113, -196);
  p.quadraticCurveTo(99, -196, 95, -180);
  p.quadraticCurveTo(93, -156, 86, -132);
  p.quadraticCurveTo(81, -158, 77, -180);
  p.quadraticCurveTo(72, -178, 64, -170);
  p.quadraticCurveTo(60, -188, 44, -198);
  p.quadraticCurveTo(38, -184, 24, -173);
  p.quadraticCurveTo(18, -192, 4, -202);
  p.quadraticCurveTo(0, -180, -8, -158);
  p.quadraticCurveTo(-14, -186, -24, -200);
  p.quadraticCurveTo(-30, -186, -42, -174);
  p.quadraticCurveTo(-48, -190, -58, -198);
  p.quadraticCurveTo(-62, -184, -72, -170);
  p.quadraticCurveTo(-72, -178, -78, -176);
  p.closePath();
  return p;
}
function girlFrontHair(style) {
  const p = new Path2D();
  p.moveTo(-84, -150);
  p.bezierCurveTo(-96, -226, -52, -258, 0, -258);
  p.bezierCurveTo(52, -258, 96, -226, 84, -150);
  if (style === 'bob') {
    p.quadraticCurveTo(80, -176, 66, -182);
    p.quadraticCurveTo(40, -178, 30, -186); p.quadraticCurveTo(10, -176, -6, -184); p.quadraticCurveTo(-30, -176, -66, -182);
    p.quadraticCurveTo(-80, -176, -84, -150);
  } else {
    p.quadraticCurveTo(74, -178, 62, -188);
    p.quadraticCurveTo(54, -172, 42, -174);
    p.quadraticCurveTo(32, -198, 16, -198);
    p.quadraticCurveTo(8, -176, -4, -177);
    p.quadraticCurveTo(-14, -200, -28, -196);
    p.quadraticCurveTo(-38, -174, -50, -176);
    p.quadraticCurveTo(-62, -194, -70, -184);
    p.quadraticCurveTo(-78, -170, -84, -150);
  }
  p.closePath();
  return p;
}

function drawKid(c, x, y, s, o = {}) {
  const P = Object.assign({}, HERO, o.colors || {});
  const t = o.t || 0;
  const hero = P.style === 'hero';
  const outfit = o.outfit || 'hoodie';
  const robe = outfit === 'robe';
  const hoodUp = robe && (o.hood ?? 1) > 0.5;
  const dram = o.dramatic || 0;
  const sq = o.sq || 1;
  const air = o.air || 0;
  const blink = !o.noBlink && ((t + (o.seed || 0) * 1.7) % 3.3) < 0.11;
  const eyes = blink && (!o.eyes || o.eyes === 'open' || o.eyes === 'half') ? 'closed' : o.eyes || 'open';
  const armL = o.armL ?? 0.25, armR = o.armR ?? 0.25;
  const skin = P.skin || PAL.skin, skinShade = P.skinShade || PAL.skinShade, skinLine = P.skinLine || '#a8604f';
  const hl = P.hairLine || lineOf(P.hair);
  const sw = Math.sin(t * 3.1 + (o.seed || 0)) * 3;

  c.save();
  c.translate(x, y);
  if (!o.noShadow) groundShadow(c, 0, 0, 66 * s * (1 + air / 260), 15 * s * (1 + air / 260), 0.34);
  c.translate(0, air);
  if (o.tilt) c.rotate(o.tilt);
  c.scale((s * (o.flip ? -1 : 1)) / Math.sqrt(sq), s * sq);

  // ---- hood (back) ----
  if (hoodUp) {
    const hs = 1 + dram * 0.12;
    c.save(); c.translate(0, -166); c.scale(hs, hs); c.translate(0, 166);
    const tipX = 46 + dram * 60 + Math.sin(t * 7) * dram * 16, tipY = -306 - dram * 40 + Math.cos(t * 7) * dram * 8;
    const hood = new Path2D();
    hood.moveTo(-100, -104);
    hood.bezierCurveTo(-124, -200, -84, -270, -10, -276);
    hood.quadraticCurveTo(tipX * 0.55, -292, tipX, tipY);
    hood.quadraticCurveTo(tipX * 0.45 + 30, -252, 82, -234);
    hood.bezierCurveTo(118, -196, 122, -150, 100, -104);
    hood.closePath();
    cel(c, hood, P.robe, { shadow: P.robeDark, d: 14, hi: lighten(P.robe, 0.12) });
    circle(c, tipX, tipY, 12); fs(c, P.trim, INK, 4);
    ellipse(c, 0, -166, 86, 82); c.fillStyle = P.hoodIn; c.fill();
    c.restore();
  } else if (P.style === 'buns') {
    for (const sd of [-1, 1]) cel(c, pEllipse(sd * 66, -236, 32, 32), P.hair, { shadow: P.hairDark, d: 7, line: hl });
  }
  // ---- back hair ----
  if (!hoodUp) {
    const bh = new Path2D();
    if (hero) {
      bh.moveTo(-84, -150);
      bh.bezierCurveTo(-92, -172, -100, -186, -108, -204);
      bh.bezierCurveTo(-94, -202, -92, -212, -92, -220);
      bh.bezierCurveTo(-88, -252, -50, -274, 0, -274);
      bh.bezierCurveTo(50, -274, 88, -252, 92, -220);
      bh.bezierCurveTo(92, -212, 94, -202, 108, -204);
      bh.bezierCurveTo(100, -186, 92, -172, 84, -150);
      bh.closePath();
    } else {
      const len = P.style === 'bob' ? -96 : -104;
      bh.moveTo(-86, -150);
      bh.bezierCurveTo(-104, -232, -60, -262, 0, -262);
      bh.bezierCurveTo(60, -262, 104, -232, 86, -150);
      bh.bezierCurveTo(92, -128, 92, len - 4, 80, len);
      bh.quadraticCurveTo(66, len + 4, 60, -112);
      bh.lineTo(-60, -112);
      bh.quadraticCurveTo(-66, len + 4, -80, len);
      bh.bezierCurveTo(-92, len - 4, -92, -128, -86, -150);
      bh.closePath();
    }
    c.fillStyle = P.hairDark; c.fill(bh); c.lineWidth = 5; c.strokeStyle = hl; c.lineJoin = 'round'; c.stroke(bh);
  }
  // ---- dramatic cape flutter ----
  if (robe && dram > 0) {
    c.beginPath();
    c.moveTo(-40, -100);
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      c.lineTo(-40 - u * 110 * dram, -100 + u * 80 + Math.sin(t * 9 + u * 5) * 22 * u * dram);
    }
    c.lineTo(-40 - 95 * dram, 0);
    c.lineTo(-30, -10);
    c.closePath();
    fs(c, P.robeDark, INK, 5);
  }
  // ---- legs & shoes ----
  const walk = o.walk;
  const liftL = walk !== undefined ? Math.max(0, Math.sin(walk)) * 12 : 0;
  const liftR = walk !== undefined ? Math.max(0, -Math.sin(walk)) * 12 : 0;
  if (!robe) {
    cel(c, pRRect(-28, -46 - liftL, 22, 40, 10), P.pants, { d: 5, lw: 4.5 });
    cel(c, pRRect(6, -46 - liftR, 22, 40, 10), P.pants, { d: 5, lw: 4.5 });
  }
  for (const [sd, lift] of [[-1, liftL], [1, liftR]]) {
    const sh = pEllipse(sd * 19, -7 - lift, 20.5, 11);
    cel(c, sh, P.shoes, { d: 4, lw: 4.5, shadow: darken(P.shoes, 0.12) });
    if (hero && !robe) {
      c.save(); c.clip(sh); ellipse(c, sd * 19 + sd * 12, -9 - lift, 12, 10); c.fillStyle = P.shoeCap; c.fill(); c.restore();
      c.beginPath(); c.moveTo(sd * 19 - 19, -3 - lift); c.lineTo(sd * 19 + 19, -3 - lift); c.lineWidth = 3; c.strokeStyle = darken(P.shoes, 0.3); c.stroke();
    }
  }
  // ---- body ----
  if (robe) {
    const bw = Math.sin(t * 6) * (2 + dram * 8);
    const body = new Path2D();
    body.moveTo(-34, -106);
    body.bezierCurveTo(-50, -70, -62, -40, -70 - bw, -12);
    body.quadraticCurveTo(-52, 0, -35, -6 + bw * 0.4);
    body.quadraticCurveTo(-18, 2, 0, -6);
    body.quadraticCurveTo(18, 2, 35, -6 - bw * 0.4);
    body.quadraticCurveTo(52, 0, 70 + bw, -12);
    body.bezierCurveTo(62, -40, 50, -70, 34, -106);
    body.closePath();
    const rg = c.createLinearGradient(0, -106, 0, 0);
    rg.addColorStop(0, lighten(P.robe, 0.08)); rg.addColorStop(1, darken(P.robe, 0.08));
    cel(c, body, rg, { shadow: P.robeDark, d: 12, line: lineOf(P.robe) });
    c.save(); c.clip(body);
    for (let k = 0; k < 7; k++) { softStar(c, -46 + rnd(k, 5) * 92, -90 + rnd(k, 6) * 76, 4 + rnd(k, 7) * 3, 5, 0.3, 0.45); c.fillStyle = rgba(P.trim, 0.55); c.fill(); }
    c.restore();
    c.beginPath();
    c.moveTo(-64 - bw, -20); c.quadraticCurveTo(-50, -9, -35, -14); c.quadraticCurveTo(-18, -6, 0, -14);
    c.quadraticCurveTo(18, -6, 35, -14); c.quadraticCurveTo(50, -9, 64 + bw, -20);
    fs(c, null, P.trim, 6);
    line(c, 0, -100, 0, -10, P.trim, 5);
    cel(c, pRRect(-46, -64, 92, 11, 5), P.lining, { d: 3, lw: 3.5 });
    if (!hoodUp) { cel(c, pEllipse(0, -104, 50, 14), P.robeDark, { d: 3, lw: 4 }); line(c, -40, -104, 40, -104, P.trim, 3); }
    c.save(); c.translate(-24, -84);
    circle(c, 0, 0, 10); c.fillStyle = P.trim; c.fill();
    circle(c, 5, -3, 8.5); c.fillStyle = P.robe; c.fill();
    c.restore();
  } else {
    const body = new Path2D();
    body.moveTo(-32, -104);
    body.quadraticCurveTo(-46, -80, -54, -46);
    body.quadraticCurveTo(-56, -32, -44, -32);
    body.lineTo(44, -32);
    body.quadraticCurveTo(56, -32, 54, -46);
    body.quadraticCurveTo(46, -80, 32, -104);
    body.closePath();
    cel(c, body, P.top, { shadow: P.topDark, d: 11, hi: lighten(P.top, 0.18) });
    c.save(); c.clip(body); c.fillStyle = P.topDark; c.fillRect(-60, -44, 120, 14); c.restore();
    cel(c, pRRect(-24, -72, 48, 20, 8), P.topDark, { d: 0, lw: 3 });
    line(c, -10, -100, -12, -80, '#fff', 3.5); line(c, 10, -100, 12, -80, '#fff', 3.5);
    circle(c, -12, -78, 3.5); c.fillStyle = '#fff'; c.fill(); circle(c, 12, -78, 3.5); c.fill();
    if (hero) { c.save(); c.translate(26, -86); circle(c, 0, 0, 8.5); c.fillStyle = '#3a3f8f'; c.fill(); circle(c, 4, -3, 7); c.fillStyle = P.top; c.fill(); c.restore(); }
    cel(c, pEllipse(0, -103, 44, 11), P.topDark, { d: 3, lw: 4 });
  }
  // ---- arms behind head level ----
  const lFront = armL > 1.7, rFront = armR > 1.7;
  if (!lFront) kidArm(c, -1, armL, P, o, t);
  if (!rFront) kidArm(c, 1, armR, P, o, t);
  // ---- ears (hero) ----
  if (hero && !hoodUp) for (const sd of [-1, 1]) {
    cel(c, pEllipse(sd * 79, -156, 12, 16), skin, { shadow: skinShade, d: 4, lw: 4, line: skinLine });
    c.beginPath(); c.arc(sd * 79, -156, 6, -1.2, 1.2, false); if (sd < 0) { c.beginPath(); c.arc(sd * 79, -156, 6, Math.PI - 1.2, Math.PI + 1.2, false); }
    c.lineWidth = 2.5; c.strokeStyle = skinLine; c.stroke();
  }
  // ---- head ----
  const head = pEllipse(0, -170, 80, 73);
  cel(c, head, skin, { shadow: skinShade, d: 8, line: skinLine, lw: 5 });
  const front = hero ? heroFrontHair() : girlFrontHair(P.style);
  // hair shadow cast on the forehead
  c.save(); c.clip(head); c.translate(4, 11); c.fillStyle = rgba(skinShade, 0.9); c.fill(front); c.restore();
  // ---- face ----
  kidEye(c, -31, -150, P, Object.assign({}, o, { eyes }), -1, t);
  kidEye(c, 31, -150, P, Object.assign({}, o, { eyes }), 1, t);
  if ((o.blush ?? 1) > 0) {
    const bk = Math.min(1, o.blush ?? 1) * (hero ? 0.7 : 1);
    glowE(c, -52, -125, 24, 13, 'rgba(255,110,140,0.6)', bk);
    glowE(c, 52, -125, 24, 13, 'rgba(255,110,140,0.6)', bk);
    if ((o.blush ?? 1) > 1) for (let k = 0; k < 3; k++) { line(c, -60 + k * 8, -121, -54 + k * 8, -130, 'rgba(230,80,120,0.7)', 2.5); line(c, 44 + k * 8, -121, 50 + k * 8, -130, 'rgba(230,80,120,0.7)', 2.5); }
  }
  if (hero) { c.beginPath(); c.moveTo(1, -136); c.quadraticCurveTo(4, -132, 1, -129); c.lineWidth = 2.5; c.strokeStyle = rgba(skinLine, 0.7); c.stroke(); }
  const so = singOpen(o, t);
  if (so !== -1 && (!o.mouth || o.mouth === 'smile' || o.mouth === 'open')) { c.save(); c.translate(0, -118); singMouth(c, so.open, so.round, skinLine); c.restore(); }
  else kidMouth(c, o.mouth || 'smile', t, skinLine);
  if (o.glasses) {
    circle(c, -31, -150, 25); fs(c, 'rgba(200,230,255,0.22)', '#3a2a55', 4.5);
    circle(c, 31, -150, 25); fs(c, 'rgba(200,230,255,0.22)', '#3a2a55', 4.5);
    line(c, -7, -154, 7, -154, '#3a2a55', 4);
    line(c, -42, -160, -34, -168, 'rgba(255,255,255,0.9)', 3.5); line(c, 20, -160, 28, -168, 'rgba(255,255,255,0.9)', 3.5);
  }
  // ---- front hair ----
  if (hoodUp) { const hs = 1 + dram * 0.12; c.save(); c.beginPath(); c.ellipse(0, -166, 84 * hs, 80 * hs, 0, 0, TAU); c.clip(); }
  cel(c, front, P.hair, { shadow: P.hairDark, d: 12, line: hl, lw: 5 });
  c.save(); c.clip(front);
  if (hero) {
    c.beginPath();
    c.moveTo(-74, -236); c.quadraticCurveTo(-10, -276, 70, -246);
    for (let k = 0; k <= 8; k++) { const xx = 70 - k * 18; c.lineTo(xx, k % 2 ? -236 : -226 - (k % 3) * 3); }
    c.closePath(); c.fillStyle = rgba(P.hairHi, 0.8); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = rgba(P.hairDark, 0.9);
    for (const [x0, y0, x1, y1] of [[-40, -262, -30, -206], [-8, -272, -4, -210], [30, -266, 30, -206], [62, -254, 56, -204]]) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1); c.stroke(); }
  } else {
    ellipse(c, -34, -230, 20, 7, -0.45); c.fillStyle = rgba(P.hairHi, 0.9); c.fill();
    ellipse(c, 12, -238, 12, 5, -0.1); c.fill();
  }
  c.restore();
  if (hoodUp) c.restore();
  if (!hero) for (const sd of [-1, 1]) {
    const lk = new Path2D();
    lk.moveTo(sd * 86, -170); lk.quadraticCurveTo(sd * 98, -128, sd * 80, -98); lk.quadraticCurveTo(sd * 74, -120, sd * 68, -156); lk.closePath();
    cel(c, lk, P.hair, { shadow: P.hairDark, d: 5, line: hl, lw: 4.5 });
  }
  if (P.style === 'bob') { softStar(c, 58, -206, 13); fs(c, PAL.gold, INK, 3.5); }
  if (hero && !hoodUp) {
    const ah = new Path2D();
    ah.moveTo(-10, -290); ah.bezierCurveTo(-14 + sw, -338, 26 + sw, -348, 34 + sw, -318); ah.bezierCurveTo(20 + sw, -330, 2, -326, 4, -292); ah.closePath();
    cel(c, ah, P.hair, { shadow: P.hairDark, d: 4, line: hl, lw: 4.5 });
  }
  // eyebrows over the bangs
  if (o.brows || hero) {
    const k = o.brows === 'worry' ? 1 : o.brows === 'angry' ? -1 : 0;
    c.save(); c.globalAlpha = o.brows ? 1 : 0.55;
    line(c, -46, -186 + k * 5, -18, -190 - k * 6, hl, hero ? 6.5 : 6);
    line(c, 46, -186 + k * 5, 18, -190 - k * 6, hl, hero ? 6.5 : 6);
    c.restore();
  }
  if (o.mask) {
    cel(c, pRRect(-80, -236, 160, 44, 20), '#b59cff', { d: 5, lw: 4.5 });
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 34 - 16, -216); c.quadraticCurveTo(sd * 34, -204, sd * 34 + 16, -216); fs(c, null, '#4a2f8a', 4); }
  }
  // ---- hood rim ----
  if (hoodUp) {
    const hs = 1 + dram * 0.12;
    c.save(); c.translate(0, -166); c.scale(hs, hs); c.translate(0, 166);
    c.beginPath(); c.ellipse(0, -166, 90, 86, 0, Math.PI * 0.78, Math.PI * 2.22); fs(c, null, lineOf(P.robe), 32);
    c.beginPath(); c.ellipse(0, -166, 90, 86, 0, Math.PI * 0.78, Math.PI * 2.22); fs(c, null, P.robe, 23);
    c.beginPath(); c.ellipse(0, -166, 94, 90, 0, Math.PI * 1.1, Math.PI * 1.6); fs(c, null, rgba('#ffffff', 0.18), 6);
    c.beginPath(); c.ellipse(0, -166, 84, 80, 0, Math.PI * 0.8, Math.PI * 2.2); fs(c, null, P.trim, 4.5);
    c.restore();
    if (dram > 0.3) {
      c.save();
      c.clip(head);
      const g = c.createLinearGradient(0, -245, 0, -130);
      g.addColorStop(0, `rgba(20,8,48,${0.95 * dram})`); g.addColorStop(1, 'rgba(20,8,48,0)');
      c.fillStyle = g; c.fillRect(-90, -250, 180, 130);
      c.restore();
      if (o.eyes === 'glow') { kidEye(c, -31, -150, P, o, -1, t); kidEye(c, 31, -150, P, o, 1, t); }
    }
  }
  // ---- arms in front ----
  if (lFront) kidArm(c, -1, armL, P, o, t);
  if (rFront) kidArm(c, 1, armR, P, o, t);
  if (o.sweat) sweatDrop(c, 86, -214, 1 + Math.sin(t * 10) * 0.05);
  if (o.gloom) gloomLines(c, 0, -236, 90, 1);
  c.restore();
}

/* ======================= Cthulhu-chan (original sleepy sea creature) ======================= */
const CTH = { body: '#8fe3b0', shade: '#5fc59a', dark: '#3f9f78', line: '#246a52', belly: '#dcf9e8', wing: '#b59cff', wingDark: '#7f63d8', cheek: 'rgba(255,120,170,0.65)' };

function tentacle(c, x, y, len, w, ang, t, ph, curl = 1, col = CTH.shade) {
  const N = 14, left = [], right = [], mid = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const a = ang + Math.sin(t * 2.2 + ph + u * 3) * 0.35 * u + curl * u * u * 1.6;
    const px = x + Math.sin(a) * len * u * 0.9;
    const py = y + Math.cos(a) * len * u;
    const ww = w * (1 - u * 0.78);
    left.push([px - Math.cos(a) * ww, py + Math.sin(a) * ww]);
    right.push([px + Math.cos(a) * ww, py - Math.sin(a) * ww]);
    mid.push([px - Math.cos(a) * ww * 0.25, py + Math.sin(a) * ww * 0.25]);
  }
  const p = new Path2D();
  p.moveTo(left[0][0], left[0][1]);
  for (let k = 1; k < left.length; k++) p.lineTo(left[k][0], left[k][1]);
  const tip = right[right.length - 1];
  p.quadraticCurveTo(tip[0] + 4, tip[1] + 4, tip[0], tip[1]);
  for (let k = right.length - 1; k >= 0; k--) p.lineTo(right[k][0], right[k][1]);
  p.closePath();
  c.fillStyle = col; c.fill(p);
  c.save(); c.clip(p);
  c.beginPath(); mid.forEach(([mx, my], k) => (k ? c.lineTo(mx, my) : c.moveTo(mx, my)));
  c.lineWidth = w * 0.55; c.strokeStyle = rgba(lighten(col, 0.35), 0.55); c.lineCap = 'round'; c.stroke();
  c.restore();
  c.lineWidth = 4.5; c.lineJoin = 'round'; c.strokeStyle = CTH.line; c.stroke(p);
  for (let k = 4; k < N - 3; k += 4) {
    const a = left[k], b2 = right[k];
    ellipse(c, lerp(a[0], b2[0], 0.3), lerp(a[1], b2[1], 0.3), w * (1 - k / N) * 0.3 + 1.5, w * (1 - k / N) * 0.24 + 1.2);
    c.fillStyle = CTH.belly; c.fill();
  }
}

function cthWing(c, side, flap) {
  c.save();
  c.translate(side * 48, -120);
  c.rotate(side * (-0.2 - flap * 0.5));
  c.scale(side, 1);
  const p = new Path2D();
  p.moveTo(0, 0);
  p.quadraticCurveTo(50, -70, 120, -60);
  p.quadraticCurveTo(110, -30, 118, -8);
  p.quadraticCurveTo(96, -18, 84, 4);
  p.quadraticCurveTo(66, -10, 50, 12);
  p.quadraticCurveTo(30, 0, 0, 20);
  p.closePath();
  const g = c.createLinearGradient(0, -60, 110, 10);
  g.addColorStop(0, '#d2c2ff'); g.addColorStop(1, CTH.wing);
  cel(c, p, g, { shadow: CTH.wingDark, d: 8, line: '#4b3595', lw: 5 });
  line(c, 8, 6, 112, -56, '#6b4fc8', 4);
  line(c, 30, 4, 84, 2, '#6b4fc8', 3.5);
  c.restore();
}

function drawCthulhu(c, x, y, s, o = {}) {
  const t = o.t || 0;
  const mood = o.mood || 'sleep'; // sleep | smile | peek | awake | happy | wow
  const breathe = Math.sin(t * 1.6) * 0.5 + 0.5;
  c.save();
  c.translate(x, y);
  if (!o.noShadow) groundShadow(c, 0, 0, 120 * s, 26 * s, 0.35);
  c.translate(0, o.air || 0);
  if (o.tilt) c.rotate(o.tilt);
  const sq = (o.sq || 1) * (1 + breathe * 0.02);
  c.scale((s * (o.flip ? -1 : 1)) / Math.sqrt(sq), s * sq);
  const flap = o.flap !== undefined ? o.flap : (mood === 'sleep' || mood === 'smile' ? breathe * 0.15 : 0.5 + Math.sin(t * 12) * 0.5);
  cthWing(c, -1, flap); cthWing(c, 1, flap);
  const legs = [[-58, -0.9], [-24, -0.35], [24, 0.35], [58, 0.9]];
  legs.forEach(([lx, a], k) => tentacle(c, lx * 0.85, -34, 58, 21, a * 0.8, t * 0.8, k * 1.3, Math.sign(a) * 0.75, CTH.shade));
  const body = new Path2D();
  body.moveTo(-50, -122);
  body.bezierCurveTo(-78, -90, -76, -30, -56, -18);
  body.quadraticCurveTo(0, 4, 56, -18);
  body.bezierCurveTo(76, -30, 78, -90, 50, -122);
  body.closePath();
  cel(c, body, CTH.body, { shadow: CTH.shade, d: 12, line: CTH.line, hi: '#b8f2d0' });
  c.save(); c.clip(body);
  const bg = c.createRadialGradient(-6, -70, 4, 0, -60, 46);
  bg.addColorStop(0, '#f2fff7'); bg.addColorStop(1, CTH.belly);
  ellipse(c, 0, -60, 38, 36); c.fillStyle = bg; c.fill();
  c.restore();
  const up = o.armsUp || 0;
  const cthArms = () => {
    for (const sd of [-1, 1]) {
      c.save();
      c.translate(sd * 56, -88);
      c.rotate(sd * (-0.5 - up * 1.85 + Math.sin(t * 8 + sd) * up * 0.25));
      c.scale(sd, 1);
      cel(c, pRRect(-10, -6, 20, 44 + up * 22, 10), CTH.body, { shadow: CTH.shade, d: 5, line: CTH.line, lw: 4.5 });
      const hl2 = 40 + up * 22;
      for (const [hx, hy] of [[-6, hl2], [6, hl2], [0, hl2 + 4]]) cel(c, pEllipse(hx, hy, 6.5, 6.5), CTH.body, { d: 0, line: CTH.line, lw: 3.5 });
      c.restore();
    }
  };
  if (up < 0.5) cthArms();
  if (o.hug === 'fish') drawFish(c, 0, -60, 1.25, t, { color: '#ffb3d1', plush: true, flip: false });
  if (o.hug === 'note') { c.save(); c.rotate(-0.15); drawEnvelope(c, 0, -62, 0.9); c.restore(); }
  if (o.hug === 'bottle') { c.save(); c.rotate(-0.5); drawBottle(c, 0, -60, 0.8, t); c.restore(); }
  c.save();
  c.translate(0, -190); c.rotate(o.headTilt || 0); c.translate(0, 190);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 98, -178); c.rotate(sd * (0.35 + Math.sin(t * 2 + sd) * 0.1));
    const fin = new Path2D(); fin.moveTo(0, -30); fin.quadraticCurveTo(sd * 52, -14, sd * 40, 22); fin.quadraticCurveTo(sd * 16, 12, 0, 24); fin.closePath();
    cel(c, fin, CTH.shade, { d: 5, line: CTH.line, lw: 4.5, shadow: CTH.dark }); c.restore();
  }
  const head = new Path2D();
  head.moveTo(-102, -160);
  head.bezierCurveTo(-112, -250, -62, -300, 0, -300);
  head.bezierCurveTo(62, -300, 112, -250, 102, -160);
  head.bezierCurveTo(96, -108, 52, -96, 0, -96);
  head.bezierCurveTo(-52, -96, -96, -108, -102, -160);
  head.closePath();
  const g = c.createRadialGradient(-40, -250, 10, 0, -190, 140);
  g.addColorStop(0, '#cdf8df'); g.addColorStop(0.55, CTH.body); g.addColorStop(1, '#78d6a6');
  cel(c, head, g, { shadow: CTH.shade, d: 16, line: CTH.line, lw: 5 });
  c.save(); c.clip(head);
  c.fillStyle = 'rgba(63,159,120,0.3)';
  circle(c, 40, -262, 12); c.fill(); circle(c, 64, -236, 8); c.fill(); circle(c, -58, -248, 9); c.fill();
  ellipse(c, -44, -258, 28, 14, -0.55); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fill();
  circle(c, -12, -276, 5); c.fill();
  c.restore();
  const eo = o.eyeOpen ?? (mood === 'awake' || mood === 'wow' ? 1 : 0);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 40, -168);
    const open = mood === 'peek' ? (sd > 0 ? eo : 0) : eo;
    if (mood === 'happy') {
      c.beginPath(); c.moveTo(-18, 6); c.quadraticCurveTo(0, -18, 18, 6); fs(c, null, CTH.line, 6.5);
    } else if (open > 0.05) {
      const ry = 25 * open;
      const gg = c.createLinearGradient(0, -25, 0, 25);
      gg.addColorStop(0, '#ffa63a'); gg.addColorStop(1, '#fff27a');
      ellipse(c, 0, 0, 21, ry); fs(c, gg, CTH.line, 5);
      if (open > 0.3) {
        ellipse(c, 0, 3 * open, 9, 13 * open); c.fillStyle = '#1c1240'; c.fill();
        circle(c, -7, -8 * open, 6 * open); c.fillStyle = '#fff'; c.fill();
        circle(c, 6, 9 * open, 3); c.fill();
      }
      if (open < 1) { c.beginPath(); c.moveTo(-23, -ry + 2); c.quadraticCurveTo(0, -ry - 6, 23, -ry + 2); fs(c, null, CTH.line, 6); }
    } else {
      c.beginPath(); c.moveTo(-18, -4); c.quadraticCurveTo(0, 14, 18, -4); fs(c, null, CTH.line, 6.5);
      line(c, sd * 18, -4, sd * 26, -12, CTH.line, 4.5); line(c, sd * 12, 4, sd * 20, 6, CTH.line, 4);
    }
    c.restore();
  }
  glowE(c, -70, -140, 26, 14, CTH.cheek); glowE(c, 70, -140, 26, 14, CTH.cheek);
  const happyCurl = mood === 'happy' || mood === 'awake' || mood === 'smile' ? 1 : 0;
  const ft = [[-42, 48, -0.4], [-20, 60, -0.14], [0, 66, 0], [20, 60, 0.14], [42, 48, 0.4]];
  ft.forEach(([fx, len, a], k) => tentacle(c, fx, -128, len, 13, a * (1 + happyCurl * 0.6), t * (mood === 'sleep' ? 0.6 : 1.3), k * 1.1, (fx < 0 ? -1 : fx > 0 ? 1 : 0.4) * (0.45 + happyCurl * 0.35), CTH.shade));
  if (up >= 0.5) cthArms();
  if (o.cap !== false) {
    const swy = Math.sin(t * 1.3) * 0.08;
    c.save();
    c.translate(-10, -268); c.rotate(-0.28 + swy);
    const cap = new Path2D();
    cap.moveTo(-78, 18);
    cap.quadraticCurveTo(-30, -120, 60, -110);
    cap.quadraticCurveTo(140, -96, 150, -10);
    cap.quadraticCurveTo(110, -70, 70, -60);
    cap.quadraticCurveTo(76, -10, 80, 18);
    cap.closePath();
    c.fillStyle = '#a78bfa'; c.fill(cap);
    c.save(); c.clip(cap);
    c.beginPath();
    for (let k = -4; k < 8; k++) { c.moveTo(-100 + k * 36, 40); c.lineTo(-60 + k * 36, -140); }
    c.lineWidth = 13; c.strokeStyle = 'rgba(255,255,255,0.78)'; c.stroke();
    const sp = new Path2D(); sp.addPath(cap); sp.addPath(cap, shiftM(-12, -13)); c.fillStyle = 'rgba(70,40,150,0.28)'; c.fill(sp, 'evenodd');
    c.restore();
    c.lineWidth = 5; c.strokeStyle = '#4b3595'; c.lineJoin = 'round'; c.stroke(cap);
    const brim = new Path2D();
    brim.moveTo(-86, 18);
    for (let k = 0; k <= 8; k++) brim.quadraticCurveTo(-86 + (k + 0.5) * 22, k % 2 ? 8 : 0, -86 + (k + 1) * 22, 4);
    brim.lineTo(112, 30);
    for (let k = 8; k >= 0; k--) brim.quadraticCurveTo(-86 + (k + 0.5) * 22, 40, -86 + k * 22, 34);
    brim.closePath();
    cel(c, brim, '#ffffff', { shadow: '#dcd4f2', d: 5, line: '#6a5aa0', lw: 4.5 });
    const pom = new Path2D();
    for (let k = 0; k <= 12; k++) { const a = (k / 12) * TAU, r = k % 2 ? 17 : 22; k ? pom.lineTo(150 + Math.cos(a) * r, -6 + Math.sin(a) * r) : pom.moveTo(150 + Math.cos(a) * r, -6 + Math.sin(a) * r); }
    pom.closePath();
    cel(c, pom, '#ffffff', { shadow: '#dcd4f2', d: 5, line: '#6a5aa0', lw: 4 });
    c.restore();
  }
  if (mood === 'sleep' || mood === 'smile') {
    const b = o.bubble ?? breathe;
    if (b > 0.05) {
      const r = 8 + 26 * b, bx = 58, by = -150 + b * 6;
      const bgr = c.createRadialGradient(bx - r * 0.4, by - r * 0.4, 1, bx, by, r);
      bgr.addColorStop(0, 'rgba(255,255,255,0.55)'); bgr.addColorStop(0.5, 'rgba(190,240,255,0.18)'); bgr.addColorStop(1, 'rgba(160,230,255,0.4)');
      if (o.heartBubble) {
        const hs = r * 1.35;
        glow(c, bx, by, hs * 2.2, 'rgba(255,170,215,0.4)');
        heartPath(c, bx, by + hs * 0.35, hs); c.fillStyle = 'rgba(255,190,225,0.45)'; c.fill();
        c.lineWidth = 3.5; c.strokeStyle = '#fff'; c.stroke();
        c.beginPath(); c.arc(bx - hs * 0.32, by - hs * 0.25, hs * 0.22, Math.PI * 1.05, Math.PI * 1.6); c.lineWidth = 3.5; c.stroke();
      } else {
        circle(c, bx, by, r); c.fillStyle = bgr; c.fill();
        c.lineWidth = 3; c.strokeStyle = 'rgba(235,252,255,0.9)'; c.stroke();
        c.beginPath(); c.arc(bx, by, r * 0.7, Math.PI * 1.1, Math.PI * 1.45); c.lineWidth = 3.5; c.strokeStyle = '#fff'; c.stroke();
      }
    }
  }
  c.restore();
  c.restore();
}

/* ======================= Tikk the alarm clock ======================= */
function drawClock(c, x, y, s, o = {}) {
  const t = o.t || 0, ring = o.ring || 0;
  c.save();
  c.translate(x + (ring ? Math.sin(t * 70) * 4 * ring : 0), y);
  if (!o.noShadow) groundShadow(c, 0, 0, 80 * s, 17 * s, 0.32);
  c.translate(0, o.air || 0);
  c.rotate(o.tilt || 0);
  const sq = o.sq || 1;
  c.scale(s / Math.sqrt(sq), s * sq);
  line(c, -30, -40, -36, -10, '#3a2a55', 6); line(c, 30, -40, 36, -10, '#3a2a55', 6);
  cel(c, pEllipse(-40, -8, 16, 9), '#ffd166', { d: 3, lw: 4 }); cel(c, pEllipse(40, -8, 16, 9), '#ffd166', { d: 3, lw: 4 });
  const gold = (y0, r) => { const g = c.createLinearGradient(0, y0 - r, 0, y0 + r); g.addColorStop(0, '#fff1b0'); g.addColorStop(0.5, '#ffd166'); g.addColorStop(1, '#d9962a'); return g; };
  const hm = ring ? Math.sin(t * 60) * 0.5 : 0;
  c.save(); c.translate(0, -168); c.rotate(hm); line(c, 0, 0, 0, -34, '#3a2a55', 6); circle(c, 0, -36, 9); fs(c, gold(-36, 9), '#8a5a10', 4); c.restore();
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 46, -160); c.rotate(sd * 0.5 + (ring ? Math.sin(t * 60 + sd) * 0.15 : 0));
    c.beginPath(); c.arc(0, 0, 30, Math.PI, 0); c.closePath(); fs(c, gold(-15, 15), '#8a5a10', 5);
    ellipse(c, -10, -16, 7, 4, -0.5); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill();
    circle(c, 0, -32, 6); fs(c, '#ffd166', '#8a5a10', 4);
    c.restore();
  }
  if (ring) {
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + sd * (0.7 + k * 0.3);
      line(c, sd * 60 + Math.cos(a) * 60, -170 + Math.sin(a) * 60, sd * 60 + Math.cos(a) * 84, -170 + Math.sin(a) * 84, '#fff', 6);
    }
  }
  const armL = o.armL ?? 0.4, armR = o.armR ?? 0.4;
  for (const [sd, a] of [[-1, armL], [1, armR]]) {
    c.save(); c.translate(sd * 68, -92); c.rotate(-sd * a);
    line(c, 0, 0, 0, 44, '#3a2a55', 6);
    cel(c, pEllipse(0, 48, 10, 10), '#ffffff', { d: 3, lw: 4, line: '#6a5a8a' });
    if ((sd > 0 && o.wag) || (sd < 0 && o.wagL)) { c.save(); c.translate(0, 48); c.rotate(sd * a + Math.PI); rrect(c, -4, 4, 8, 22, 4); fs(c, '#fff', '#6a5a8a', 3.5); c.restore(); }
    c.restore();
  }
  const bodyG = c.createRadialGradient(-26, -126, 8, 0, -96, 80);
  bodyG.addColorStop(0, '#ff9a9a'); bodyG.addColorStop(0.6, '#ff6b6b'); bodyG.addColorStop(1, '#d9474f');
  cel(c, pEllipse(0, -96, 74, 74), bodyG, { shadow: '#c93b45', d: 10, line: '#6e1a2a', lw: 6 });
  c.beginPath(); c.arc(0, -96, 64, Math.PI * 1.05, Math.PI * 1.45); c.lineWidth = 7; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
  const faceG = c.createRadialGradient(-14, -112, 6, 0, -96, 60);
  faceG.addColorStop(0, '#fffdf5'); faceG.addColorStop(1, '#f7ead0');
  circle(c, 0, -96, 58); fs(c, faceG, '#b58a6a', 4);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    line(c, Math.cos(a) * 48, -96 + Math.sin(a) * 48, Math.cos(a) * 54, -96 + Math.sin(a) * 54, '#c9b8a0', 3);
  }
  const spd = ring ? 12 : 0.5;
  c.save(); c.translate(0, -96);
  c.rotate(t * spd); line(c, 0, 0, 0, -38, 'rgba(42,27,61,0.3)', 4); c.rotate(-t * spd * 1.08); line(c, 0, 0, 26, 0, 'rgba(42,27,61,0.3)', 5);
  c.restore();
  const face = o.face || 'smile';
  const blink = ((t + 1.1) % 2.9) < 0.1;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 20, -108);
    if (face === 'wise' || blink) { c.beginPath(); c.moveTo(-9, 0); c.quadraticCurveTo(0, 7, 9, 0); fs(c, null, '#3a2a55', 5); }
    else if (face === 'happy') { c.beginPath(); c.moveTo(-9, 3); c.quadraticCurveTo(0, -9, 9, 3); fs(c, null, '#3a2a55', 5); }
    else { ellipse(c, 0, 0, 7, 10); c.fillStyle = '#2a1b3d'; c.fill(); circle(c, -2, -4, 3); c.fillStyle = '#fff'; c.fill(); }
    c.restore();
  }
  glowE(c, -34, -88, 14, 8, 'rgba(255,110,140,0.6)'); glowE(c, 34, -88, 14, 8, 'rgba(255,110,140,0.6)');
  const so = singOpen(o, t);
  if (so !== -1) { c.save(); c.translate(0, -78); c.scale(0.7, 0.7); singMouth(c, so.open, so.round, '#6e1a2a'); c.restore(); }
  else if (face === 'alarm' || face === 'talk') {
    const m = face === 'talk' ? 0.5 + 0.5 * Math.abs(Math.sin(t * 14)) : 1;
    ellipse(c, 0, -76, 11, 12 * m); fs(c, '#7a1f3d', '#6e1a2a', 4);
  } else { c.beginPath(); c.moveTo(-9, -80); c.quadraticCurveTo(0, -70, 9, -80); fs(c, null, '#6e1a2a', 4.5); }
  if (o.sweat) sweatDrop(c, 72, -150, 0.8);
  c.restore();
}

/* ======================= the moon ======================= */
function drawMoon(c, x, y, s, o = {}) {
  const t = o.t || 0;
  c.save();
  c.translate(x, y); c.rotate(o.tilt || 0); c.scale(s, s);
  glow(c, 0, 0, 420, 'rgba(255,235,170,0.22)');
  glow(c, 0, 0, 220, 'rgba(255,245,200,0.45)');
  const body = pEllipse(0, 0, 110, 110);
  const g = c.createRadialGradient(-34, -38, 10, 0, 0, 115);
  g.addColorStop(0, '#fffdf0'); g.addColorStop(0.6, '#fff1b8'); g.addColorStop(1, '#f1d98c');
  cel(c, body, g, { shadow: 'rgba(222,190,110,0.55)', d: 18, line: '#9a7a3a', lw: 5 });
  for (const [cx, cy, r] of [[-52, -50, 16], [58, -30, 11], [40, 62, 14], [-62, 40, 9]]) {
    circle(c, cx, cy, r); c.fillStyle = 'rgba(214,178,98,0.45)'; c.fill();
    c.beginPath(); c.arc(cx, cy, r, 0.2, Math.PI - 0.2); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,240,0.7)'; c.stroke();
  }
  const face = o.face || 'sleepy';
  const ln = '#5a3f2a';
  if (o.shades) {
    c.save(); c.rotate(-0.05);
    for (const sd of [-1, 1]) {
      softStar(c, sd * 36, -10, 32, 5, -Math.PI / 2, 0.55);
      const sg = c.createLinearGradient(0, -40, 0, 20); sg.addColorStop(0, '#4a3a7a'); sg.addColorStop(1, '#1a1030');
      fs(c, sg, '#140a28', 4);
    }
    line(c, -8, -12, 8, -12, '#140a28', 6);
    sparkle(c, -46, -20, 9, '#fff'); sparkle(c, 26, -22, 6, '#fff');
    c.restore();
  } else if (face === 'sleepy' || face === 'smile' || face === 'shh') {
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 36 - 14, -8); c.quadraticCurveTo(sd * 36, 6, sd * 36 + 14, -8); fs(c, null, ln, 6); }
  } else if (face === 'pout') {
    for (const sd of [-1, 1]) { ellipse(c, sd * 34, -10, 8, 11); c.fillStyle = ln; c.fill(); line(c, sd * 20, -34, sd * 48, -26, ln, 5); }
  } else {
    for (const sd of [-1, 1]) { ellipse(c, sd * 34, -10, 9, 13); c.fillStyle = ln; c.fill(); circle(c, sd * 34 - 3, -15, 4); c.fillStyle = '#fff'; c.fill(); }
    line(c, -48, -40, -22, -34, ln, 5); line(c, 48, -40, 22, -34, ln, 5);
  }
  glowE(c, -64, 22, 22, 12, 'rgba(255,120,140,0.55)'); glowE(c, 64, 22, 22, 12, 'rgba(255,120,140,0.55)');
  if (face === 'shout' || o.shades) {
    const m = 0.6 + 0.4 * Math.abs(Math.sin(t * 12));
    c.beginPath(); c.moveTo(-26, 28); c.quadraticCurveTo(0, 30, 26, 28); c.quadraticCurveTo(18, 28 + 40 * m, 0, 28 + 40 * m); c.quadraticCurveTo(-18, 28 + 40 * m, -26, 28);
    fs(c, '#7a1f3d', ln, 5);
  } else if (face === 'pout') {
    c.beginPath(); c.moveTo(-12, 40); c.quadraticCurveTo(0, 30, 12, 40); fs(c, null, ln, 5);
  } else { c.beginPath(); c.moveTo(-14, 30); c.quadraticCurveTo(0, 42, 14, 30); fs(c, null, ln, 5); }
  if (face === 'shh') {
    c.save(); c.translate(0, 34); rrect(c, -7, -40, 14, 50, 7); fs(c, '#fff4c8', ln, 4); c.restore();
  }
  c.restore();
}

/* ======================= the spellbook ======================= */
function drawBook(c, x, y, s, o = {}) {
  const t = o.t || 0;
  const open = o.open || 0;
  c.save();
  c.translate(x, y);
  if (!o.noShadow) groundShadow(c, 0, 0, 110 * s, 20 * s, 0.3);
  c.translate(0, o.air || 0);
  c.rotate(o.tilt || 0);
  const sq = o.sq || 1; c.scale(s / Math.sqrt(sq), s * sq);
  rrect(c, -86, -222, 176, 214, 16); fs(c, '#fff3d6', '#9a7a4a', 5);
  for (let k = 0; k < 5; k++) line(c, 80, -200 + k * 40, 88, -200 + k * 40, '#e2cfa6', 3);
  const cover = pRRect(-96, -230, 176, 222, 18);
  const g = c.createLinearGradient(-96, -230, 80, -8);
  g.addColorStop(0, '#9563c4'); g.addColorStop(1, '#5a3290');
  cel(c, cover, g, { shadow: '#4a2878', d: 12, line: '#2a1450', lw: 6, hi: 'rgba(255,255,255,0.14)' });
  rrect(c, -82, -216, 148, 194, 12); fs(c, null, '#ffd166', 4);
  for (const [cx, cy] of [[-96, -230], [80, -230], [-96, -8], [80, -8]]) {
    const cg = c.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, 15); cg.addColorStop(0, '#fff3b8'); cg.addColorStop(1, '#e0a030');
    circle(c, cx, cy, 14); fs(c, cg, '#7a5010', 4);
  }
  c.save(); c.translate(-8, -80);
  c.beginPath();
  for (let a = 0; a < 11; a += 0.25) { const r = 3 + a * 2.6; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9); }
  c.lineWidth = 11; c.strokeStyle = '#4a2878'; c.lineCap = 'round'; c.stroke();
  c.lineWidth = 7; c.strokeStyle = '#ffd166'; c.stroke();
  c.restore();
  const face = o.face || 'grin';
  for (const sd of [-1, 1]) {
    c.save(); c.translate(-8 + sd * 32, -160);
    if (face === 'pout' || face === 'sleep') { c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(0, face === 'sleep' ? 9 : -2, 12, 0); fs(c, null, '#1e0f38', 5); if (face === 'pout') line(c, -14, -18, 12, -12 * sd - 4, '#1e0f38', 4); }
    else {
      ellipse(c, 0, 0, 17, 20); fs(c, '#fff', '#1e0f38', 4.5);
      circle(c, sd * 3, 3, 8); c.fillStyle = '#1e0f38'; c.fill(); circle(c, sd * 3 - 3, -1, 3); c.fillStyle = '#fff'; c.fill();
    }
    c.restore();
  }
  if (face === 'grin') { line(c, -60, -192, -34, -184, '#1e0f38', 5); line(c, 44, -192, 18, -184, '#1e0f38', 5); }
  const my = -118;
  if (open > 0.05) {
    const h = 34 * open;
    c.beginPath(); c.moveTo(-50, my); c.quadraticCurveTo(-8, my - 6, 34, my); c.quadraticCurveTo(24, my + h, -8, my + h); c.quadraticCurveTo(-40, my + h, -50, my);
    fs(c, '#4a1f3a', '#1e0f38', 4.5);
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-40 + k * 20, my - 1); c.lineTo(-33 + k * 20, my + 12); c.lineTo(-26 + k * 20, my - 1); c.fillStyle = '#fff'; c.fill(); }
  } else if (face === 'pout') {
    c.beginPath(); c.moveTo(-24, my + 8); c.quadraticCurveTo(-8, my - 4, 8, my + 8); fs(c, null, '#1e0f38', 5);
  } else {
    c.beginPath(); c.moveTo(-40, my); c.quadraticCurveTo(-8, my + 22, 24, my); fs(c, null, '#1e0f38', 5);
    c.beginPath(); c.moveTo(-26, my + 6); c.lineTo(-20, my + 16); c.lineTo(-14, my + 9); c.fillStyle = '#fff'; c.fill();
  }
  glowE(c, -64, -126, 18, 9, 'rgba(255,110,160,0.5)'); glowE(c, 48, -126, 18, 9, 'rgba(255,110,160,0.5)');
  if (o.locked) {
    const lk = o.locked;
    c.save();
    c.globalAlpha = clamp(lk * 2);
    for (const a of [-0.5, 0.5]) {
      c.save(); c.translate(-8, -118); c.rotate(a);
      const cg = c.createLinearGradient(0, -9, 0, 9); cg.addColorStop(0, '#f2eefa'); cg.addColorStop(1, '#9a94b0');
      rrect(c, -120, -9, 240, 18, 9); fs(c, cg, '#4a4460', 4);
      for (let k = -5; k <= 5; k++) line(c, k * 22, -9, k * 22, 9, '#7a7490', 3);
      c.restore();
    }
    c.translate(-8, -100 + (1 - lk) * -40);
    c.beginPath(); c.arc(0, -26, 20, Math.PI, 0); fs(c, null, '#4a4460', 14); c.beginPath(); c.arc(0, -26, 20, Math.PI, 0); fs(c, null, '#d8d2ea', 7);
    const pg = c.createLinearGradient(0, -28, 0, 24); pg.addColorStop(0, '#fff1b0'); pg.addColorStop(1, '#e0a030');
    rrect(c, -32, -28, 64, 52, 12); fs(c, pg, '#7a5010', 5);
    circle(c, 0, -6, 7); c.fillStyle = '#3a2410'; c.fill(); rrect(c, -3, -4, 6, 16, 3); c.fill();
    c.restore();
  }
  c.restore();
}

/* ======================= little star & wave characters ======================= */
function drawStarBuddy(c, x, y, s, o = {}) {
  const t = o.t || 0;
  c.save(); c.translate(x, y); c.rotate(o.tilt || Math.sin(t * 3 + (o.seed || 0)) * 0.15); c.scale(s, s);
  glow(c, 0, 0, 150, 'rgba(255,230,120,0.45)');
  const p = new Path2D();
  {
    const pts = [];
    for (let k = 0; k < 10; k++) { const rr = k % 2 ? 35 : 70, a = -Math.PI / 2 + (k * Math.PI) / 5; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s0 = m(pts[9], pts[0]); p.moveTo(s0[0], s0[1]);
    for (let k = 0; k < 10; k++) { const q = m(pts[k], pts[(k + 1) % 10]); p.quadraticCurveTo(pts[k][0], pts[k][1], q[0], q[1]); }
    p.closePath();
  }
  const g = c.createLinearGradient(0, -70, 0, 60); g.addColorStop(0, '#fff6c0'); g.addColorStop(1, '#ffc93a');
  cel(c, p, g, { shadow: '#f0a820', d: 8, line: '#8a5a10', lw: 5 });
  for (const sd of [-1, 1]) { ellipse(c, sd * 16, -6, 5, 7); c.fillStyle = '#3a2410'; c.fill(); }
  const m = o.shout ? 0.5 + 0.5 * Math.abs(Math.sin(t * 12 + (o.seed || 0))) : 0;
  if (m > 0) { ellipse(c, 0, 12, 8, 4 + 8 * m); fs(c, '#7a1f3d', '#5a2a10', 3.5); }
  else { c.beginPath(); c.moveTo(-8, 10); c.quadraticCurveTo(0, 18, 8, 10); fs(c, null, '#5a2a10', 4); }
  glowE(c, -28, 8, 12, 7, 'rgba(255,110,140,0.6)'); glowE(c, 28, 8, 12, 7, 'rgba(255,110,140,0.6)');
  c.restore();
}
function drawWaveBuddy(c, x, y, s, o = {}) {
  const t = o.t || 0;
  c.save(); c.translate(x, y); c.scale(s, s);
  const wob = Math.sin(t * 4) * 8;
  const p = new Path2D();
  p.moveTo(-190, 0);
  p.bezierCurveTo(-180, -140, -60, -250 + wob, 60, -240);
  p.bezierCurveTo(150, -232, 190, -170, 170, -110);
  p.bezierCurveTo(150, -150, 100, -160, 80, -120);
  p.bezierCurveTo(60, -80, 120, -40, 180, -50);
  p.lineTo(200, 0);
  p.closePath();
  const g = c.createLinearGradient(0, -240, 0, 0);
  g.addColorStop(0, '#8fdcff'); g.addColorStop(1, '#2f6fd0');
  cel(c, p, g, { shadow: '#2458b0', d: 14, line: '#123a78', lw: 6 });
  c.beginPath();
  c.moveTo(-120, -196 + wob * 0.3);
  for (let k = 0; k <= 7; k++) { const a = -2.5 + k * 0.42; const px = 40 + Math.cos(a) * 170, py = -110 + Math.sin(a) * 140; c.quadraticCurveTo(px - 10, py - 26, px, py); }
  c.quadraticCurveTo(170, -80, 150, -120);
  c.bezierCurveTo(120, -190, -40, -230, -120, -196 + wob * 0.3);
  c.closePath(); fs(c, '#f2fbff', '#5a8ac0', 5);
  c.save(); c.translate(-40, -120);
  for (const sd of [-1, 1]) { rrect(c, sd * 34 - 26, -16, 52, 30, 12); fs(c, '#1a1030', '#0a0618', 4); }
  line(c, -8, -6, 8, -6, '#0a0618', 5);
  sparkle(c, -48, -8, 7, '#fff');
  const m = o.shout ? 0.5 + 0.5 * Math.abs(Math.sin(t * 12)) : 0.2;
  c.beginPath(); c.moveTo(-26, 30); c.quadraticCurveTo(0, 32, 26, 30); c.quadraticCurveTo(16, 30 + 36 * m, 0, 30 + 36 * m); c.quadraticCurveTo(-16, 30 + 36 * m, -26, 30);
  fs(c, '#1b3f7a', '#0a1a3a', 4.5);
  c.restore();
  c.restore();
}

/* ======================= Aunt Mabel ======================= */
function drawMabel(c, x, y, s, o = {}) {
  const t = o.t || 0;
  const face = o.face || 'smile';
  const SK = PAL.skin, SKS = PAL.skinShade, SKL = '#a8604f';
  c.save();
  c.translate(x, y);
  if (!o.noShadow) groundShadow(c, 0, 0, 66 * s, 15 * s, 0.34);
  c.translate(0, o.air || 0);
  c.rotate(o.tilt || 0);
  const sq = o.sq || 1; c.scale((s * (o.flip ? -1 : 1)) / Math.sqrt(sq), s * sq);
  cel(c, pEllipse(0, -262, 34, 34), '#dcd4ee', { shadow: '#b9b0d6', d: 7 });
  circle(c, 10, -272, 8); c.fillStyle = '#fff'; c.fill();
  cel(c, pEllipse(-20, -7, 19, 10), '#7a3a5a', { d: 3, lw: 4.5 }); cel(c, pEllipse(20, -7, 19, 10), '#7a3a5a', { d: 3, lw: 4.5 });
  const skirt = new Path2D(); skirt.moveTo(-48, -60); skirt.quadraticCurveTo(-64, -20, -60, -16); skirt.lineTo(60, -16); skirt.quadraticCurveTo(64, -20, 48, -60); skirt.closePath();
  cel(c, skirt, '#9b5fc0', { d: 9 });
  const card = new Path2D(); card.moveTo(-34, -104); card.quadraticCurveTo(-54, -70, -54, -48); card.lineTo(54, -48); card.quadraticCurveTo(54, -70, 34, -104); card.closePath();
  cel(c, card, '#5cc2b9', { d: 10, hi: '#8fe0d8' });
  line(c, 0, -100, 0, -50, lineOf('#5cc2b9'), 3.5);
  for (let k = 0; k < 3; k++) { circle(c, 7, -90 + k * 14, 3.5); c.fillStyle = '#ffd166'; c.fill(); }
  const cup = o.cup !== false;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 32, -92); c.rotate(-sd * (sd > 0 && cup ? 0.9 : sd > 0 ? o.armR ?? 0.3 : o.armL ?? 0.3));
    cel(c, pRRect(-11, -6, 22, 42, 10), '#5cc2b9', { d: 5, lw: 4.5 });
    cel(c, pEllipse(0, 44, 11, 11), SK, { shadow: SKS, d: 4, lw: 4, line: SKL });
    if (sd > 0 && cup) {
      c.translate(0, 50); c.rotate(0.9 + (o.spill || 0));
      drawProp(c, 'teacup', t);
      if ((o.spill || 0) > 0.3) { for (let k = 0; k < 3; k++) { const d = ((t * 3 + k / 3) % 1); circle(c, 30 + d * 20, 6 + d * 60, 5); c.fillStyle = '#c98a4a'; c.fill(); } }
    }
    c.restore();
  }
  const head = pEllipse(0, -170, 78, 70);
  cel(c, head, SK, { shadow: SKS, d: 8, line: SKL });
  const hair = new Path2D();
  hair.moveTo(-82, -150);
  hair.bezierCurveTo(-94, -226, -50, -252, 0, -252);
  hair.bezierCurveTo(50, -252, 94, -226, 82, -150);
  for (let k = 0; k < 6; k++) { const xx = 82 - (k + 1) * 164 / 6; hair.quadraticCurveTo(xx + 164 / 12, -184 - (k % 2) * 8, xx, -168 - (k === 5 ? -18 : 0)); }
  hair.closePath();
  c.save(); c.clip(head); c.translate(3, 9); c.fillStyle = rgba(SKS, 0.9); c.fill(hair); c.restore();
  cel(c, hair, '#dcd4ee', { shadow: '#b9b0d6', d: 10, line: '#6a5f8a' });
  c.save(); c.clip(hair); for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-48 + k * 32, -222, 10, Math.PI, 0); c.lineWidth = 3; c.strokeStyle = '#a79dc8'; c.stroke(); } c.restore();
  const blink = ((t + 0.4) % 3.7) < 0.1;
  const ln = '#4a3a5a';
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 30, -150);
    if (face === 'smile' || face === 'happy' || blink) { c.beginPath(); c.moveTo(-11, 3); c.quadraticCurveTo(0, -9, 11, 3); fs(c, null, ln, 5); }
    else if (face === 'blank') { circle(c, 0, 0, 5); c.fillStyle = ln; c.fill(); }
    else if (face === 'shock') { ellipse(c, 0, 0, 12, 14); fs(c, '#fff', ln, 4); circle(c, 0, 0, 4); c.fillStyle = ln; c.fill(); }
    else { ellipse(c, 0, 0, 8, 10); c.fillStyle = ln; c.fill(); circle(c, -3, -4, 3); c.fillStyle = '#fff'; c.fill(); }
    c.restore();
  }
  circle(c, -30, -150, 22); fs(c, 'rgba(220,240,255,0.2)', '#c07a3a', 4); circle(c, 30, -150, 22); fs(c, 'rgba(220,240,255,0.2)', '#c07a3a', 4);
  line(c, -8, -152, 8, -152, '#c07a3a', 4);
  line(c, -42, -160, -35, -167, 'rgba(255,255,255,0.85)', 3);
  glowE(c, -52, -124, 22, 12, 'rgba(255,110,140,0.55)'); glowE(c, 52, -124, 22, 12, 'rgba(255,110,140,0.55)');
  const so = singOpen(o, t);
  if (so !== -1 && face !== 'blank' && face !== 'shock') { c.save(); c.translate(0, -114); c.scale(0.8, 0.8); singMouth(c, so.open, so.round, SKL); c.restore(); }
  else if (face === 'shock') { ellipse(c, 0, -112, 10, 13); fs(c, '#7a1f3d', SKL, 4); }
  else if (face === 'blank') line(c, -8, -114, 8, -114, SKL, 4);
  else if (face === 'happy') { c.beginPath(); c.moveTo(-14, -118); c.quadraticCurveTo(0, -116, 14, -118); c.quadraticCurveTo(10, -100, 0, -100); c.quadraticCurveTo(-10, -100, -14, -118); fs(c, '#7a1f3d', SKL, 4); }
  else { c.beginPath(); c.moveTo(-10, -116); c.quadraticCurveTo(0, -106, 10, -116); fs(c, null, SKL, 4.5); }
  for (let k = -3; k <= 3; k++) { circle(c, k * 9, -100 + Math.abs(k) * -2, 5); fs(c, '#fff', '#9a8fb0', 2); }
  c.restore();
}

/* ======================= the mail carrier ======================= */
function drawMailman(c, x, y, s, o = {}) {
  const t = o.t || 0, face = o.face || 'smile';
  const SK = PAL.skin, SKS = PAL.skinShade, SKL = '#a8604f';
  c.save();
  c.translate(x, y);
  if (!o.noShadow) groundShadow(c, 0, 0, 66 * s, 15 * s, 0.34);
  c.translate(0, o.air || 0);
  c.rotate(o.tilt || 0);
  const sq = o.sq || 1; c.scale((s * (o.flip ? -1 : 1)) / Math.sqrt(sq), s * sq);
  const walk = o.walk;
  const lL = walk !== undefined ? Math.max(0, Math.sin(walk)) * 12 : 0, lR = walk !== undefined ? Math.max(0, -Math.sin(walk)) * 12 : 0;
  cel(c, pEllipse(-20, -7 - lL, 19, 10), '#2a2a4a', { d: 3, lw: 4.5 }); cel(c, pEllipse(20, -7 - lR, 19, 10), '#2a2a4a', { d: 3, lw: 4.5 });
  cel(c, pRRect(-28, -48 - lL, 22, 42, 9), '#3f5fb5', { d: 5, lw: 4.5 }); cel(c, pRRect(6, -48 - lR, 22, 42, 9), '#3f5fb5', { d: 5, lw: 4.5 });
  const shirt = new Path2D(); shirt.moveTo(-36, -104); shirt.quadraticCurveTo(-54, -70, -54, -42); shirt.lineTo(54, -42); shirt.quadraticCurveTo(54, -70, 36, -104); shirt.closePath();
  cel(c, shirt, '#6f9cf5', { d: 10, hi: '#a8c6ff' });
  line(c, -34, -100, 40, -50, '#8a5a2a', 11); line(c, -34, -100, 40, -50, '#b98050', 7);
  cel(c, pRRect(22, -70, 58, 46, 10), '#b98050', { d: 7 });
  c.beginPath(); c.moveTo(22, -60); c.lineTo(80, -60); fs(c, null, '#6a4020', 3.5);
  drawEnvelope(c, 44, -78, 0.35); drawEnvelope(c, 60, -80, 0.35, '#ffe7f1');
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 32, -92); c.rotate(-sd * (sd < 0 ? o.armL ?? 0.3 : o.armR ?? 0.3));
    cel(c, pRRect(-11, -6, 22, 40, 10), '#6f9cf5', { d: 5, lw: 4.5 });
    cel(c, pEllipse(0, 44, 11, 11), SK, { shadow: SKS, d: 4, lw: 4, line: SKL });
    if (sd < 0 && o.hold) { c.translate(0, 50); c.rotate(-sd * -(o.armL ?? 0.3)); drawProp(c, o.hold, t); }
    c.restore();
  }
  for (const sd of [-1, 1]) cel(c, pEllipse(sd * 78, -158, 11, 15), SK, { shadow: SKS, d: 3, lw: 4, line: SKL });
  const head = pEllipse(0, -170, 78, 70);
  cel(c, head, SK, { shadow: SKS, d: 8, line: SKL });
  const hair = new Path2D(); hair.moveTo(-80, -160); hair.quadraticCurveTo(-86, -196, -60, -206); hair.lineTo(60, -206); hair.quadraticCurveTo(86, -196, 80, -160); hair.quadraticCurveTo(70, -176, 60, -170); hair.lineTo(-60, -170); hair.quadraticCurveTo(-70, -176, -80, -160); hair.closePath();
  cel(c, hair, '#8a5a3a', { d: 5 });
  const cap = new Path2D(); cap.moveTo(-78, -196); cap.bezierCurveTo(-80, -268, 80, -268, 78, -196); cap.closePath();
  cel(c, cap, '#3f5fb5', { shadow: '#2c4690', d: 10, hi: '#6f8fe0' });
  const bill = new Path2D(); bill.moveTo(-86, -196); bill.quadraticCurveTo(0, -176, 96, -190); bill.quadraticCurveTo(0, -206, -86, -196); bill.closePath();
  cel(c, bill, '#2c4690', { d: 3 });
  drawEnvelope(c, 0, -228, 0.32);
  const blink = ((t + 2.2) % 3.1) < 0.1;
  const ln = '#3a2a2a';
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 30, -152);
    if (face === 'happy' || blink) { c.beginPath(); c.moveTo(-11, 3); c.quadraticCurveTo(0, -9, 11, 3); fs(c, null, ln, 5); }
    else if (face === 'blank') { circle(c, 0, 0, 5); c.fillStyle = ln; c.fill(); }
    else if (face === 'shock') { ellipse(c, 0, 0, 12, 14); fs(c, '#fff', ln, 4); circle(c, 0, 0, 4); c.fillStyle = ln; c.fill(); }
    else { ellipse(c, 0, 0, 8, 11); c.fillStyle = ln; c.fill(); circle(c, -3, -4, 3); c.fillStyle = '#fff'; c.fill(); }
    c.restore();
  }
  glowE(c, -54, -128, 20, 11, 'rgba(255,110,140,0.5)'); glowE(c, 54, -128, 20, 11, 'rgba(255,110,140,0.5)');
  const so = singOpen(o, t);
  if (so !== -1 && face !== 'blank' && face !== 'shock') { c.save(); c.translate(0, -108); c.scale(0.75, 0.75); singMouth(c, so.open, so.round, SKL); c.restore(); }
  else if (face === 'shock') { ellipse(c, 0, -104, 9, 11); fs(c, '#7a1f3d', SKL, 4); }
  else if (face === 'happy') { c.beginPath(); c.moveTo(-12, -110); c.quadraticCurveTo(0, -94, 12, -110); fs(c, '#7a1f3d', SKL, 4); }
  const mu = new Path2D(); mu.moveTo(0, -126); mu.bezierCurveTo(-14, -140, -40, -132, -38, -116); mu.quadraticCurveTo(-18, -124, 0, -118); mu.quadraticCurveTo(18, -124, 38, -116); mu.bezierCurveTo(40, -132, 14, -140, 0, -126); mu.closePath();
  cel(c, mu, '#8a5a3a', { d: 3, lw: 4 });
  c.restore();
}

/* ======================= the tailor (a very fashionable cat) ======================= */
function drawTailorCat(c, x, y, s, o = {}) {
  const t = o.t || 0;
  c.save(); c.translate(x, y);
  if (!o.noShadow) groundShadow(c, 0, 0, 70 * s, 15 * s, 0.34);
  c.translate(0, o.air || 0);
  c.rotate(o.tilt || 0); const sq = o.sq || 1; c.scale(s / Math.sqrt(sq), s * sq);
  const tl = Math.sin(t * 3) * 20;
  c.beginPath(); c.moveTo(40, -30); c.bezierCurveTo(120, -40, 110, -140 + tl, 150, -150 + tl); fs(c, null, '#a0612a', 22);
  c.beginPath(); c.moveTo(40, -30); c.bezierCurveTo(120, -40, 110, -140 + tl, 150, -150 + tl); fs(c, null, '#ffcf99', 13);
  cel(c, pEllipse(-22, -8, 20, 11), '#ffffff', { shadow: '#e6e0f2', d: 3, lw: 4.5, line: '#7a6a8a' }); cel(c, pEllipse(22, -8, 20, 11), '#ffffff', { shadow: '#e6e0f2', d: 3, lw: 4.5, line: '#7a6a8a' });
  const body = new Path2D(); body.moveTo(-40, -110); body.quadraticCurveTo(-60, -40, -46, -14); body.lineTo(46, -14); body.quadraticCurveTo(60, -40, 40, -110); body.closePath();
  cel(c, body, '#ffffff', { shadow: '#e6e0f2', d: 10, line: '#7a6a8a' });
  for (const sd of [-1, 1]) { const v = new Path2D(); v.moveTo(sd * 40, -106); v.quadraticCurveTo(sd * 52, -60, sd * 44, -40); v.lineTo(sd * 4, -40); v.lineTo(sd * 4, -100); v.closePath(); cel(c, v, '#ff6f9f', { d: 6, lw: 4 }); }
  c.save(); c.translate(-38, -92); c.rotate(0.4); cel(c, pRRect(-11, -4, 22, 40, 10), '#ffffff', { shadow: '#e6e0f2', d: 4, lw: 4.5, line: '#7a6a8a' }); cel(c, pEllipse(0, 42, 11, 11), '#ffffff', { d: 0, lw: 4, line: '#7a6a8a' }); c.restore();
  c.save(); c.translate(38, -92); c.rotate(-2.6 + Math.sin(t * 8) * 0.1); cel(c, pRRect(-11, -4, 22, 40, 10), '#ffffff', { shadow: '#e6e0f2', d: 4, lw: 4.5, line: '#7a6a8a' }); cel(c, pEllipse(0, 42, 13, 13), '#ffffff', { d: 0, lw: 4, line: '#7a6a8a' });
  c.translate(0, 42); c.rotate(2.6); rrect(c, -5, -30, 10, 20, 5); fs(c, '#fff', '#7a6a8a', 3.5); c.restore();
  for (const sd of [-1, 1]) {
    const e = new Path2D(); e.moveTo(sd * 70, -200); e.lineTo(sd * 76, -270); e.lineTo(sd * 22, -236); e.closePath();
    cel(c, e, sd < 0 ? '#ffb366' : '#ffffff', { d: 5, line: '#7a6a8a' });
    c.beginPath(); c.moveTo(sd * 62, -214); c.lineTo(sd * 68, -252); c.lineTo(sd * 38, -232); c.closePath(); c.fillStyle = '#ffc2d8'; c.fill();
  }
  const head = pEllipse(0, -172, 84, 70);
  c.fillStyle = '#fff'; c.fill(head);
  c.save(); c.clip(head); ellipse(c, -60, -210, 60, 50); c.fillStyle = '#ffb366'; c.fill();
  const sp = new Path2D(); sp.addPath(head); sp.addPath(head, shiftM(-9, -10)); c.fillStyle = 'rgba(200,180,230,0.35)'; c.fill(sp, 'evenodd'); c.restore();
  c.lineWidth = 5; c.strokeStyle = '#7a6a8a'; c.stroke(head);
  for (const sd of [-1, 1]) { c.save(); c.translate(sd * 32, -170); c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(0, -10, 12, 3); fs(c, null, '#3a2a4a', 5.5); c.restore(); }
  circle(c, 32, -170, 22); fs(c, 'rgba(220,240,255,0.25)', '#e0a030', 5); line(c, 52, -160, 60, -110, '#e0a030', 2.5);
  line(c, 18, -180, 26, -188, 'rgba(255,255,255,0.9)', 3);
  c.beginPath(); c.moveTo(-6, -146); c.lineTo(6, -146); c.lineTo(0, -140); c.closePath(); fs(c, '#ff8fb1', '#a04a6a', 2.5);
  c.beginPath(); c.moveTo(-12, -134); c.quadraticCurveTo(-6, -128, 0, -134); c.quadraticCurveTo(6, -128, 12, -134); fs(c, null, '#3a2a4a', 4);
  for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) line(c, sd * 50, -142 + k * 10, sd * 86, -148 + k * 16, '#7a6a8a', 3);
  glowE(c, -56, -134, 18, 9, 'rgba(255,110,140,0.55)'); glowE(c, 56, -134, 18, 9, 'rgba(255,110,140,0.55)');
  c.beginPath(); c.moveTo(-50, -112); c.quadraticCurveTo(0, -94, 50, -112); fs(c, null, '#8a6a10', 14); c.beginPath(); c.moveTo(-50, -112); c.quadraticCurveTo(0, -94, 50, -112); fs(c, null, '#ffe27a', 9);
  c.beginPath(); c.moveTo(-36, -106); c.quadraticCurveTo(-46, -70, -30, -40); fs(c, null, '#8a6a10', 14); c.beginPath(); c.moveTo(-36, -106); c.quadraticCurveTo(-46, -70, -30, -40); fs(c, null, '#ffe27a', 9);
  for (let k = 0; k < 5; k++) { const u = k / 4; line(c, lerp(-44, -30, u) - 4, lerp(-100, -46, u), lerp(-44, -30, u) + 3, lerp(-100, -46, u), '#8a6a10', 2); }
  c.restore();
}

/* ======================= sea critters & small props ======================= */
function drawFish(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
  const col = o.color || '#ffb347';
  const wag = Math.sin(t * 10 + (o.seed || 0)) * 0.3;
  c.save(); c.translate(-30, 0); c.rotate(wag);
  const tail = new Path2D(); tail.moveTo(4, 0); tail.lineTo(-24, -18); tail.quadraticCurveTo(-16, 0, -24, 18); tail.closePath();
  cel(c, tail, darken(col, 0.06), { d: 4, lw: 4 }); c.restore();
  const body = pEllipse(0, 0, 36, 24);
  const g = c.createLinearGradient(0, -24, 0, 24); g.addColorStop(0, lighten(col, 0.25)); g.addColorStop(1, col);
  cel(c, body, g, { shadow: darken(col, 0.15), d: 7, line: lineOf(col), lw: 4.5 });
  c.beginPath(); c.moveTo(-4, -22); c.quadraticCurveTo(6, -36, 16, -20); fs(c, col, lineOf(col), 4);
  ellipse(c, -8, -10, 12, 5, -0.2); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fill();
  if (o.plush) { line(c, -10, -8, -10, 8, 'rgba(42,27,61,0.35)', 3); }
  circle(c, 16, -4, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 3; c.strokeStyle = lineOf(col); c.stroke();
  circle(c, 18, -4, 3.5); c.fillStyle = '#1c1030'; c.fill();
  glowE(c, 12, 8, 9, 5, 'rgba(255,110,140,0.6)');
  c.restore();
}
function drawCrab(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  groundShadow(c, 0, 0, 60, 12, 0.3);
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) line(c, sd * 24, -18 + k * 6, sd * (44 + k * 4), -2 + k * 4, '#8a2a2a', 5);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 36, -40); c.rotate(sd * (0.3 + Math.sin(t * 8 + sd) * 0.25 * (o.wave ? 1 : 0.3)));
    line(c, 0, 0, sd * 10, -24, '#8a2a2a', 6); cel(c, pEllipse(sd * 12, -36, 16, 16), '#ff6b6b', { d: 4, lw: 4 });
    c.beginPath(); c.moveTo(sd * 12, -36); c.lineTo(sd * 30, -44); fs(c, null, '#8a2a2a', 4);
    c.restore();
  }
  cel(c, pEllipse(0, -22, 38, 26), '#ff6b6b', { d: 7, hi: '#ff9a9a', lw: 4.5 });
  for (const sd of [-1, 1]) { line(c, sd * 12, -44, sd * 14, -60, '#8a2a2a', 4); circle(c, sd * 14, -64, 8); fs(c, '#fff', '#8a2a2a', 3); circle(c, sd * 14, -64, 3.5); c.fillStyle = '#1c1030'; c.fill(); }
  c.beginPath(); c.moveTo(-8, -18); c.quadraticCurveTo(0, -10, 8, -18); fs(c, null, '#8a2a2a', 3.5);
  c.restore();
}
function drawJelly(c, x, y, s, t, color = '#ff9ecf') {
  c.save(); c.translate(x, y); c.scale(s, s);
  glow(c, 0, -10, 170, rgba(color, 0.5));
  for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 14, 0); for (let u = 0; u <= 1; u += 0.1) c.lineTo(k * 14 + Math.sin(t * 3 + u * 6 + k) * 8, u * 90); fs(c, null, rgba(color, 0.85), 5); }
  const p = new Path2D(); p.moveTo(-50, 4); p.bezierCurveTo(-54, -70, 54, -70, 50, 4); p.quadraticCurveTo(25, -6, 0, 4); p.quadraticCurveTo(-25, -6, -50, 4); p.closePath();
  const g = c.createRadialGradient(-14, -34, 4, 0, -20, 60); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, lighten(color, 0.3)); g.addColorStop(1, color);
  cel(c, p, g, { shadow: rgba(darken(color, 0.1), 0.6), d: 6, line: lineOf(color), lw: 4.5 });
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 18 - 7, -24); c.quadraticCurveTo(sd * 18, -18, sd * 18 + 7, -24); fs(c, null, lineOf(color), 4); }
  c.restore();
}
function drawSeal(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  groundShadow(c, 0, 0, 80, 16, 0.3);
  cel(c, pEllipse(0, -46, 70, 48), '#f6f8ff', { shadow: '#dde3f5', d: 10, line: '#6a7aa8' });
  c.save(); c.translate(64, -18); c.rotate(-0.4 + Math.sin(t * 10) * 0.2); cel(c, pEllipse(12, 0, 22, 10), '#e2e8f8', { d: 3, lw: 4, line: '#6a7aa8' }); c.restore();
  c.save(); c.translate(-50, -16); c.rotate(0.5 + Math.sin(t * 9) * 0.3); cel(c, pEllipse(-8, 0, 18, 9), '#e2e8f8', { d: 3, lw: 4, line: '#6a7aa8' }); c.restore();
  for (const sd of [-1, 1]) { ellipse(c, sd * 24, -58, 12, 14); c.fillStyle = '#1c1030'; c.fill(); circle(c, sd * 24 - 4, -63, 4.5); c.fillStyle = '#fff'; c.fill(); }
  ellipse(c, 0, -42, 8, 5); c.fillStyle = '#ff8fa8'; c.fill();
  c.beginPath(); c.moveTo(-8, -34); c.quadraticCurveTo(-4, -28, 0, -34); c.quadraticCurveTo(4, -28, 8, -34); fs(c, null, '#3a3a5a', 3);
  glowE(c, -44, -40, 16, 9, 'rgba(255,110,140,0.55)'); glowE(c, 44, -40, 16, 9, 'rgba(255,110,140,0.55)');
  c.restore();
}
function flame(c, x, y, s, t) {
  const fl = 1 + Math.sin(t * 18 + x) * 0.08 + noise1(t * 6 + x, 2) * 0.08;
  c.save(); c.translate(x, y); c.scale(s, s * fl);
  glow(c, 0, -10, 90, 'rgba(255,190,90,0.6)');
  c.beginPath(); c.moveTo(0, -34); c.bezierCurveTo(16, -12, 14, 6, 0, 6); c.bezierCurveTo(-14, 6, -16, -12, 0, -34);
  const g = c.createLinearGradient(0, -34, 0, 6); g.addColorStop(0, '#ff8a3a'); g.addColorStop(1, '#ffd166');
  c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#b8541a'; c.stroke();
  c.beginPath(); c.moveTo(0, -20); c.bezierCurveTo(7, -8, 7, 2, 0, 2); c.bezierCurveTo(-7, 2, -7, -8, 0, -20); c.fillStyle = '#fff6c8'; c.fill();
  c.restore();
}
function drawCandle(c, x, y, s, t, lit = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  groundShadow(c, 0, 2, 34, 9, 0.3);
  cel(c, pEllipse(0, 0, 30, 10), '#ffd166', { d: 3, lw: 4 });
  const body = pRRect(-16, -80, 32, 80, 8);
  const g = c.createLinearGradient(-16, 0, 16, 0); g.addColorStop(0, '#4a3d6e'); g.addColorStop(0.35, '#2e2445'); g.addColorStop(1, '#1c1630');
  cel(c, body, g, { shadow: false, line: '#0e0a1c', lw: 4.5 });
  c.beginPath(); c.moveTo(-16, -72); c.quadraticCurveTo(-10, -56, -6, -72); c.quadraticCurveTo(0, -50, 6, -72); c.fillStyle = '#5a4d80'; c.fill();
  line(c, 0, -80, 0, -90, '#0e0a1c', 3);
  if (lit > 0) { c.save(); c.globalAlpha = clamp(lit); glowE(c, 0, -70, 40, 50, 'rgba(255,190,90,0.35)'); flame(c, 0, -90, lit, t); c.restore(); }
  c.restore();
}
function drawKey(c, x, y, s, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const gold = c.createLinearGradient(-10, 0, 10, 0); gold.addColorStop(0, '#fff1b0'); gold.addColorStop(0.5, '#ffd166'); gold.addColorStop(1, '#c98a20');
  rrect(c, -8, -10, 16, 120, 7); fs(c, gold, '#7a5010', 5);
  rrect(c, 8, 70, 26, 14, 4); fs(c, '#ffd166', '#7a5010', 4); rrect(c, 8, 94, 20, 12, 4); fs(c, '#ffd166', '#7a5010', 4);
  const bg = c.createRadialGradient(-12, -54, 4, 0, -42, 40); bg.addColorStop(0, '#fff6c8'); bg.addColorStop(1, '#e0a030');
  circle(c, 0, -42, 38); fs(c, bg, '#7a5010', 5);
  c.beginPath(); for (let a = 0; a < 9; a += 0.25) { const r = 2 + a * 2.6; c.lineTo(Math.cos(a + 1) * r, -42 + Math.sin(a + 1) * r); } fs(c, null, '#c98a20', 5);
  glow(c, 0, -42, 30, 'rgba(160,255,210,0.7)');
  circle(c, 0, -42, 9); fs(c, '#8fe3b0', '#2a6a4a', 3.5); circle(c, -3, -45, 3); c.fillStyle = '#fff'; c.fill();
  c.restore();
}
function drawEnvelope(c, x, y, s, col = '#fff') {
  c.save(); c.translate(x, y); c.scale(s, s);
  cel(c, pRRect(-50, -32, 100, 64, 8), col, { shadow: darken(col, 0.08), d: 5, line: '#6a5a8a', lw: 5 });
  c.beginPath(); c.moveTo(-48, -28); c.lineTo(0, 6); c.lineTo(48, -28); fs(c, null, '#6a5a8a', 4);
  heartPath(c, 0, 8, 12); fs(c, '#ff6f9f', '#a02a5a', 3);
  c.restore();
}
function drawBottle(c, x, y, s, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const g = c.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, 'rgba(190,250,230,0.7)'); g.addColorStop(0.5, 'rgba(150,230,210,0.45)'); g.addColorStop(1, 'rgba(110,200,190,0.7)');
  rrect(c, -30, -50, 60, 100, 22); fs(c, g, '#2a6a6a', 5);
  rrect(c, -12, -80, 24, 34, 8); fs(c, g, '#2a6a6a', 5);
  rrect(c, -14, -92, 28, 16, 5); fs(c, '#c98a4a', '#6a4020', 4);
  c.save(); c.rotate(0.2); rrect(c, -18, -30, 36, 58, 6); fs(c, '#fff3d6', '#9a7a4a', 3); heartPath(c, 0, 4, 9); c.fillStyle = '#ff6f9f'; c.fill(); c.restore();
  line(c, -18, -34, -18, 26, 'rgba(255,255,255,0.85)', 5);
  line(c, -16, -58, 16, -50, '#ff6f9f', 5);
  c.restore();
}
