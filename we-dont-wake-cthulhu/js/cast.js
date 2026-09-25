/* The cast. All characters are original chibi designs drawn with canvas paths.
   Each draw function takes (c, x, y, s, o): x,y is the ground point under the character, s is scale. */
'use strict';

/* ======================= the kid (our hero) ======================= */
const KID = {
  hair: '#ff86b0', hairDark: '#e0608f', hairHi: '#ffd0e2',
  iris1: '#4b2fb0', iris2: '#b69cff',
  top: '#c7b3ff', topDark: '#a08ae8', pants: '#8fd3ff', shoes: '#5b3a8a',
  robe: '#6b3fc9', robeDark: '#4b2a99', trim: '#ffd166', lining: '#ff9ecf', hoodIn: '#2e1a5e',
  style: 'kid',
};
const FRIEND_A = { hair: '#6fb7ff', hairDark: '#4a8fe0', hairHi: '#cde6ff', iris1: '#1f5fa8', iris2: '#8fd0ff', top: '#ffd166', topDark: '#f0b43c', pants: '#8a7ff0', shoes: '#3b3a7a', style: 'bob' };
const FRIEND_B = { hair: '#ff9d4a', hairDark: '#e57a2a', hairHi: '#ffd5ae', iris1: '#2f7a4a', iris2: '#8fe3b0', top: '#8fe3b0', topDark: '#5fc494', pants: '#ff8fc7', shoes: '#7a3a5a', style: 'buns' };

function kidEye(c, x, y, P, o, side, t) {
  const kind = o.eyes || 'open';
  const lk = (o.look || 0) * 4;
  c.save();
  c.translate(x, y);
  if (kind === 'happy') {
    c.beginPath(); c.moveTo(-15, 5); c.quadraticCurveTo(0, -16, 15, 5); fs(c, null, INK, 6);
  } else if (kind === 'closed') {
    c.beginPath(); c.moveTo(-15, -2); c.quadraticCurveTo(0, 12, 15, -2); fs(c, null, INK, 6);
    line(c, side * 15, -2, side * 22, -8, INK, 4);
  } else if (kind === 'dot') {
    ellipse(c, lk * 0.5, 0, 5.5, 7.5); c.fillStyle = INK; c.fill();
  } else if (kind === 'shock') {
    const j = Math.sin(t * 60) * 1.5;
    ellipse(c, j, 0, 17, 20); fs(c, '#fff', INK, 5);
    circle(c, j, 1, 4.5); c.fillStyle = INK; c.fill();
  } else if (kind === 'star') {
    softStar(c, 0, 0, 20, 5, -Math.PI / 2 + Math.sin(t * 8) * 0.2, 0.55); fs(c, '#ffd166', INK, 4);
    circle(c, -5, -5, 4); c.fillStyle = '#fff'; c.fill();
  } else if (kind === 'spiral') {
    c.beginPath();
    for (let a = 0; a < 14; a += 0.3) { const r = a * 1.35; c.lineTo(Math.cos(a + t * 10) * r, Math.sin(a + t * 10) * r); }
    fs(c, null, INK, 3.5);
  } else if (kind === 'glow') {
    glow(c, 0, 0, 40, 'rgba(255,255,255,0.9)');
    ellipse(c, 0, 0, 13, 7); c.fillStyle = '#fff'; c.fill();
  } else if (kind === 'wink' && side > 0) {
    c.beginPath(); c.moveTo(-14, 2); c.quadraticCurveTo(0, -12, 14, 2); fs(c, null, INK, 6);
  } else {
    // open anime eye
    const g = c.createLinearGradient(0, -21, 0, 21);
    g.addColorStop(0, P.iris1); g.addColorStop(1, P.iris2);
    ellipse(c, 0, 0, 15, 21); c.fillStyle = g; c.fill();
    ellipse(c, lk, 2, 8, 11); c.fillStyle = '#1c1240'; c.fill();
    ellipse(c, -5 + lk, -8, 6, 7.5); c.fillStyle = '#fff'; c.fill();
    circle(c, 6 + lk, 9, 3); c.fillStyle = '#fff'; c.fill();
    // lash line
    c.beginPath(); c.ellipse(0, 0, 17, 22, 0, Math.PI * 1.1, Math.PI * 1.9); fs(c, null, INK, 6);
    line(c, side * 15, -13, side * 22, -19, INK, 4.5);
    if (kind === 'sleepy' || kind === 'half') {
      c.beginPath(); c.rect(-20, -26, 40, kind === 'sleepy' ? 26 : 16); c.fillStyle = PAL.skin; c.fill();
      line(c, -16, kind === 'sleepy' ? 0 : -10, 16, kind === 'sleepy' ? 0 : -10, INK, 5.5);
    }
  }
  c.restore();
}

function kidMouth(c, kind, t) {
  c.save();
  c.translate(0, -118);
  switch (kind) {
    case 'open':
      c.beginPath(); c.moveTo(-15, -4); c.quadraticCurveTo(0, -2, 15, -4); c.quadraticCurveTo(12, 18, 0, 18); c.quadraticCurveTo(-12, 18, -15, -4);
      fs(c, '#8a2346', INK, 4);
      c.beginPath(); c.ellipse(0, 12, 8, 5, 0, 0, TAU); c.fillStyle = '#ff8fa8'; c.fill();
      break;
    case 'grin':
      c.beginPath(); c.moveTo(-20, -6); c.quadraticCurveTo(0, -2, 20, -6); c.quadraticCurveTo(14, 16, 0, 16); c.quadraticCurveTo(-14, 16, -20, -6);
      fs(c, '#fff', INK, 4);
      break;
    case 'o': ellipse(c, 0, 2, 7, 9); fs(c, '#8a2346', INK, 4); break;
    case 'O': ellipse(c, 0, 4, 14, 19 + Math.sin(t * 30) * 1.5); fs(c, '#8a2346', INK, 4); break;
    case 'flat': line(c, -9, 0, 9, 0, INK, 4.5); break;
    case 'wavy':
      c.beginPath(); c.moveTo(-16, 2);
      for (let k = 1; k <= 4; k++) c.quadraticCurveTo(-16 + (k - 0.5) * 8, k % 2 ? -6 : 8, -16 + k * 8, 2);
      fs(c, null, INK, 4); break;
    case 'cat':
      c.beginPath(); c.moveTo(-14, -3); c.quadraticCurveTo(-7, 8, 0, -1); c.quadraticCurveTo(7, 8, 14, -3); fs(c, null, INK, 4.5); break;
    case 'pout':
      c.beginPath(); c.moveTo(-9, 4); c.quadraticCurveTo(0, -5, 9, 4); fs(c, null, INK, 4.5); break;
    case 'tongue':
      c.beginPath(); c.moveTo(-12, -2); c.quadraticCurveTo(0, 8, 12, -2); fs(c, null, INK, 4.5);
      c.beginPath(); c.moveTo(2, 2); c.quadraticCurveTo(4, 14, 10, 12); c.quadraticCurveTo(14, 6, 10, 0); fs(c, '#ff8fa8', INK, 3);
      break;
    case 'shh': ellipse(c, 0, 0, 5, 6); c.fillStyle = '#8a2346'; c.fill(); break;
    default: // smile
      c.beginPath(); c.moveTo(-11, -3); c.quadraticCurveTo(0, 9, 11, -3); fs(c, null, INK, 4.5);
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
      c.beginPath(); c.arc(22, -4, 11, -1.4, 1.4); fs(c, null, INK, 5);
      for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(-6 + k * 12, -30); c.quadraticCurveTo(-14 + k * 12, -44 + Math.sin(t * 4 + k) * 4, -4 + k * 12, -58); fs(c, null, 'rgba(255,255,255,0.8)', 4); }
      break;
    case 'teacup':
      ellipse(c, 0, 14, 30, 8); fs(c, '#fff', INK, 4);
      c.beginPath(); c.moveTo(-22, -8); c.lineTo(22, -8); c.quadraticCurveTo(20, 14, 0, 14); c.quadraticCurveTo(-20, 14, -22, -8); fs(c, '#fff', INK, 4);
      line(c, -16, 0, 16, 0, '#ff8fc7', 4);
      c.beginPath(); c.arc(24, 0, 8, -1.3, 1.3); fs(c, null, INK, 4); break;
    case 'pointer': line(c, 0, 0, 0, -120, '#a8744a', 7); circle(c, 0, -122, 7); fs(c, '#ff6f6f', INK, 3); break;
    case 'letters':
      for (let k = 0; k < 3; k++) { c.save(); c.rotate(-0.25 + k * 0.2); drawEnvelope(c, 0, -10 - k * 4, 0.55, k === 1 ? '#ffe7f1' : '#fff'); c.restore(); }
      break;
    case 'bottle': drawBottle(c, 0, 0, 0.6, t); break;
    case 'fold': rrect(c, -34, -18, 68, 36, 8); fs(c, '#6b3fc9', INK, 4); line(c, -34, 0, 34, 0, '#ffd166', 4); break;
  }
}

function kidArm(c, side, ang, P, o, t, front) {
  const robe = (o.outfit || 'hoodie') === 'robe';
  const sx = side * 30, sy = -92;
  c.save();
  c.translate(sx, sy);
  c.rotate(-side * ang);
  const col = robe ? P.robe : P.top, dark = robe ? P.robeDark : P.topDark;
  // sleeve
  c.beginPath();
  if (robe) { c.moveTo(-12, -6); c.lineTo(12, -6); c.lineTo(20, 38); c.quadraticCurveTo(0, 46, -20, 38); }
  else { c.moveTo(-12, -6); c.lineTo(12, -6); c.lineTo(11, 36); c.quadraticCurveTo(0, 42, -11, 36); }
  c.closePath();
  fs(c, col, INK, 5);
  if (robe) { c.beginPath(); c.moveTo(-19, 36); c.quadraticCurveTo(0, 44, 19, 36); fs(c, null, P.trim, 5); }
  else { rrect(c, -11, 30, 22, 9, 4); fs(c, dark, null); }
  // hand
  const hand = side < 0 ? o.handL : o.handR;
  c.translate(0, 46);
  circle(c, 0, 0, 12); fs(c, PAL.skin, INK, 4.5);
  if (hand === 'point') {
    rrect(c, -5, 4, 10, 26, 5); fs(c, PAL.skin, INK, 4); circle(c, 0, 0, 11); c.fillStyle = PAL.skin; c.fill();
  } else if (hand === 'shh') {
    c.save(); c.rotate(side * ang); rrect(c, -5.5, -34, 11, 30, 5.5); fs(c, PAL.skin, INK, 4); c.restore();
    circle(c, 0, 0, 11); c.fillStyle = PAL.skin; c.fill();
  } else if (hand === 'open') {
    for (let k = -1; k <= 1; k++) { c.save(); c.rotate(k * 0.45); ellipse(c, 0, 14, 5.5, 9); fs(c, PAL.skin, INK, 3.5); c.restore(); }
    circle(c, 0, 0, 12); fs(c, PAL.skin, null); c.beginPath(); c.arc(0, 0, 12, -0.3, Math.PI + 0.3, true); fs(c, null, INK, 4);
  } else if (hand === 'thumb') {
    c.save(); c.rotate(side * ang - side * 0.2); rrect(c, -5, -28, 10, 22, 5); fs(c, PAL.skin, INK, 4); c.restore();
  }
  const item = side < 0 ? o.holdL : o.holdR;
  if (item) {
    c.rotate(side * ang); // back to upright
    drawProp(c, item, t, o);
  }
  c.restore();
}

function drawKid(c, x, y, s, o = {}) {
  const P = Object.assign({}, KID, o.colors || {});
  const t = o.t || 0;
  const outfit = o.outfit || 'hoodie';
  const robe = outfit === 'robe';
  const hoodUp = robe && (o.hood ?? 1) > 0.5;
  const dram = o.dramatic || 0;
  const sq = o.sq || 1;
  const blink = !o.noBlink && ((t + (o.seed || 0) * 1.7) % 3.3) < 0.11;
  const eyes = blink && (!o.eyes || o.eyes === 'open' || o.eyes === 'half') ? 'closed' : o.eyes || 'open';
  const armL = o.armL ?? 0.25, armR = o.armR ?? 0.25;

  c.save();
  c.translate(x, y);
  if (o.tilt) c.rotate(o.tilt);
  c.scale((s * (o.flip ? -1 : 1)) / Math.sqrt(sq), s * sq);

  // ---- hood (back) ----
  if (hoodUp) {
    const hs = 1 + dram * 0.12;
    c.save(); c.translate(0, -166); c.scale(hs, hs); c.translate(0, 166);
    const tipX = 46 + dram * 60 + Math.sin(t * 7) * dram * 16, tipY = -306 - dram * 40 + Math.cos(t * 7) * dram * 8;
    c.beginPath();
    c.moveTo(-100, -104);
    c.bezierCurveTo(-124, -200, -84, -270, -10, -276);
    c.quadraticCurveTo(tipX * 0.55, -292, tipX, tipY);
    c.quadraticCurveTo(tipX * 0.45 + 30, -252, 82, -234);
    c.bezierCurveTo(118, -196, 122, -150, 100, -104);
    c.closePath();
    fs(c, P.robe, INK, 5);
    circle(c, tipX, tipY, 12); fs(c, P.trim, INK, 4);
    ellipse(c, 0, -166, 86, 82); c.fillStyle = P.hoodIn; c.fill();
    c.restore();
  } else if (P.style === 'buns') {
    circle(c, -66, -236, 32); fs(c, P.hair, INK, 5);
    circle(c, 66, -236, 32); fs(c, P.hair, INK, 5);
  }
  // ---- back hair ----
  if (!hoodUp) {
    c.beginPath();
    c.moveTo(-86, -150);
    c.bezierCurveTo(-104, -232, -60, -262, 0, -262);
    c.bezierCurveTo(60, -262, 104, -232, 86, -150);
    const len = P.style === 'bob' ? -96 : -104;
    c.bezierCurveTo(92, -128, 92, len - 4, 80, len);
    c.quadraticCurveTo(66, len + 4, 60, -112);
    c.lineTo(-60, -112);
    c.quadraticCurveTo(-66, len + 4, -80, len);
    c.bezierCurveTo(-92, len - 4, -92, -128, -86, -150);
    c.closePath();
    fs(c, P.hairDark, INK, 5);
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
    rrect(c, -28, -46 - liftL, 22, 40, 10); fs(c, P.pants, INK, 4.5);
    rrect(c, 6, -46 - liftR, 22, 40, 10); fs(c, P.pants, INK, 4.5);
  }
  ellipse(c, -19, -7 - liftL, 20, 11); fs(c, P.shoes, INK, 4.5);
  ellipse(c, 19, -7 - liftR, 20, 11); fs(c, P.shoes, INK, 4.5);
  // ---- body ----
  if (robe) {
    const bw = Math.sin(t * 6) * (2 + dram * 8);
    c.beginPath();
    c.moveTo(-34, -106);
    c.bezierCurveTo(-50, -70, -62, -40, -70 - bw, -12);
    c.quadraticCurveTo(-52, 0, -35, -6 + bw * 0.4);
    c.quadraticCurveTo(-18, 2, 0, -6);
    c.quadraticCurveTo(18, 2, 35, -6 - bw * 0.4);
    c.quadraticCurveTo(52, 0, 70 + bw, -12);
    c.bezierCurveTo(62, -40, 50, -70, 34, -106);
    c.closePath();
    fs(c, P.robe, INK, 5);
    c.beginPath();
    c.moveTo(-64 - bw, -20); c.quadraticCurveTo(-50, -9, -35, -14); c.quadraticCurveTo(-18, -6, 0, -14);
    c.quadraticCurveTo(18, -6, 35, -14); c.quadraticCurveTo(50, -9, 64 + bw, -20);
    fs(c, null, P.trim, 6);
    line(c, 0, -100, 0, -10, P.trim, 5);
    rrect(c, -46, -64, 92, 11, 5); fs(c, P.lining, INK, 3.5);
    if (!hoodUp) { ellipse(c, 0, -104, 50, 14); fs(c, P.robeDark, INK, 4); line(c, -40, -104, 40, -104, P.trim, 3); }
    // crescent emblem
    c.save(); c.translate(-24, -84);
    circle(c, 0, 0, 10); c.fillStyle = P.trim; c.fill();
    circle(c, 5, -3, 8.5); c.fillStyle = P.robe; c.fill();
    c.restore();
  } else {
    c.beginPath();
    c.moveTo(-34, -104);
    c.quadraticCurveTo(-46, -80, -56, -44);
    c.quadraticCurveTo(-58, -30, -44, -30);
    c.lineTo(44, -30);
    c.quadraticCurveTo(58, -30, 56, -44);
    c.quadraticCurveTo(46, -80, 34, -104);
    c.closePath();
    fs(c, P.top, INK, 5);
    rrect(c, -24, -66, 48, 20, 8); fs(c, P.topDark, INK, 3);
    line(c, -10, -100, -12, -80, '#fff', 3.5); line(c, 10, -100, 12, -80, '#fff', 3.5);
    circle(c, -12, -78, 3.5); c.fillStyle = '#fff'; c.fill(); circle(c, 12, -78, 3.5); c.fill();
    if (P.style === 'kid') { softStar(c, 26, -80, 9); c.fillStyle = PAL.gold; c.fill(); }
    // hood lying on the shoulders
    ellipse(c, 0, -103, 44, 11); fs(c, P.topDark, INK, 4);
  }
  // ---- arms behind head level ----
  const lFront = armL > 1.7, rFront = armR > 1.7;
  if (!lFront) kidArm(c, -1, armL, P, o, t);
  if (!rFront) kidArm(c, 1, armR, P, o, t);
  // ---- head ----
  ellipse(c, 0, -170, 80, 73); fs(c, PAL.skin, INK, 5);
  // ---- face ----
  kidEye(c, -31, -150, P, Object.assign({}, o, { eyes }), -1, t);
  kidEye(c, 31, -150, P, Object.assign({}, o, { eyes }), 1, t);
  if ((o.blush ?? 1) > 0) {
    c.save(); c.globalAlpha = Math.min(1, o.blush ?? 1);
    ellipse(c, -52, -126, 15, 8); c.fillStyle = PAL.blush; c.fill();
    ellipse(c, 52, -126, 15, 8); c.fill();
    if ((o.blush ?? 1) > 1) for (let k = 0; k < 3; k++) { line(c, -60 + k * 8, -122, -54 + k * 8, -131, 'rgba(230,80,120,0.7)', 2.5); line(c, 44 + k * 8, -122, 50 + k * 8, -131, 'rgba(230,80,120,0.7)', 2.5); }
    c.restore();
  }
  kidMouth(c, o.mouth || 'smile', t);
  if (o.glasses) {
    circle(c, -31, -150, 25); fs(c, 'rgba(200,230,255,0.22)', INK, 4.5);
    circle(c, 31, -150, 25); fs(c, 'rgba(200,230,255,0.22)', INK, 4.5);
    line(c, -7, -154, 7, -154, INK, 4);
    line(c, -42, -160, -34, -168, 'rgba(255,255,255,0.9)', 3.5); line(c, 20, -160, 28, -168, 'rgba(255,255,255,0.9)', 3.5);
  }
  // ---- front hair ----
  c.beginPath();
  c.moveTo(-84, -150);
  c.bezierCurveTo(-96, -226, -52, -258, 0, -258);
  c.bezierCurveTo(52, -258, 96, -226, 84, -150);
  if (P.style === 'bob') {
    c.quadraticCurveTo(80, -176, 66, -182);
    c.lineTo(-66, -182);
    c.quadraticCurveTo(-80, -176, -84, -150);
  } else {
    c.quadraticCurveTo(74, -178, 62, -188);
    c.quadraticCurveTo(54, -172, 42, -174);
    c.quadraticCurveTo(32, -198, 16, -198);
    c.quadraticCurveTo(8, -176, -4, -177);
    c.quadraticCurveTo(-14, -200, -28, -196);
    c.quadraticCurveTo(-38, -174, -50, -176);
    c.quadraticCurveTo(-62, -194, -70, -184);
    c.quadraticCurveTo(-78, -170, -84, -150);
  }
  c.closePath();
  fs(c, P.hair, INK, 5);
  ellipse(c, -34, -230, 20, 7, -0.45); c.fillStyle = P.hairHi; c.fill();
  ellipse(c, 12, -238, 12, 5, -0.1); c.fill();
  // side locks
  for (const sd of [-1, 1]) {
    c.beginPath();
    c.moveTo(sd * 86, -170);
    c.quadraticCurveTo(sd * 98, -128, sd * 80, -98);
    c.quadraticCurveTo(sd * 74, -120, sd * 68, -156);
    c.closePath();
    fs(c, P.hair, INK, 4.5);
  }
  if (P.style === 'bob') { softStar(c, 58, -206, 13); fs(c, PAL.gold, INK, 3.5); }
  // ahoge
  if (P.style === 'kid' && !hoodUp) {
    const sw = Math.sin(t * 3.2) * 7;
    c.beginPath();
    c.moveTo(-6, -254);
    c.bezierCurveTo(-12 + sw, -302, 30 + sw, -314, 36 + sw, -284);
    c.bezierCurveTo(22 + sw, -298, 4, -290, 6, -255);
    c.closePath();
    fs(c, P.hair, INK, 4.5);
  }
  if (o.brows) { // 'worry' | 'angry'
    const k = o.brows === 'worry' ? 1 : -1;
    line(c, -46, -186 + k * 5, -18, -190 - k * 6, INK, 6);
    line(c, 46, -186 + k * 5, 18, -190 - k * 6, INK, 6);
  }
  if (o.mask) { // sleep mask pushed up on the forehead
    rrect(c, -80, -236, 160, 44, 20); fs(c, '#b59cff', INK, 4.5);
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 34 - 16, -216); c.quadraticCurveTo(sd * 34, -204, sd * 34 + 16, -216); fs(c, null, INK, 4); }
  }
  // ---- hood rim ----
  if (hoodUp) {
    const hs = 1 + dram * 0.12;
    c.save(); c.translate(0, -166); c.scale(hs, hs); c.translate(0, 166);
    c.beginPath(); c.ellipse(0, -166, 90, 86, 0, Math.PI * 0.78, Math.PI * 2.22); fs(c, null, INK, 32);
    c.beginPath(); c.ellipse(0, -166, 90, 86, 0, Math.PI * 0.78, Math.PI * 2.22); fs(c, null, P.robe, 23);
    c.beginPath(); c.ellipse(0, -166, 84, 80, 0, Math.PI * 0.8, Math.PI * 2.2); fs(c, null, P.trim, 4.5);
    c.restore();
    // dramatic shadow over the face
    if (dram > 0.3) {
      c.save();
      ellipse(c, 0, -170, 78, 71); c.clip();
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
  if (o.sweat) sweatDrop(c, 84, -214, 1 + Math.sin(t * 10) * 0.05);
  if (o.gloom) gloomLines(c, 0, -236, 90, 1);
  c.restore();
}

/* ======================= Cthulhu-chan (original sleepy sea creature) ======================= */
const CTH = { body: '#8fe3b0', shade: '#62c795', dark: '#3f9f78', belly: '#d9f8e6', wing: '#b59cff', wingDark: '#8a6fe0', cheek: 'rgba(255,120,170,0.5)' };

function tentacle(c, x, y, len, w, ang, t, ph, curl = 1, col = CTH.shade) {
  const N = 14, left = [], right = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const a = ang + Math.sin(t * 2.2 + ph + u * 3) * 0.35 * u + curl * u * u * 1.6;
    const px = x + Math.sin(a) * len * u * 0.9;
    const py = y + Math.cos(a) * len * u;
    const ww = w * (1 - u * 0.78);
    left.push([px - Math.cos(a) * ww, py + Math.sin(a) * ww]);
    right.push([px + Math.cos(a) * ww, py - Math.sin(a) * ww]);
  }
  c.beginPath();
  c.moveTo(left[0][0], left[0][1]);
  for (let k = 1; k < left.length; k++) c.lineTo(left[k][0], left[k][1]);
  const tip = right[right.length - 1];
  c.quadraticCurveTo(tip[0] + 4, tip[1] + 4, tip[0], tip[1]);
  for (let k = right.length - 1; k >= 0; k--) c.lineTo(right[k][0], right[k][1]);
  c.closePath();
  fs(c, col, INK, 4.5);
  // suckers
  for (let k = 4; k < N - 3; k += 4) {
    const p = left[k], q = right[k];
    circle(c, lerp(p[0], q[0], 0.3), lerp(p[1], q[1], 0.3), w * (1 - k / N) * 0.28 + 1.5);
    c.fillStyle = CTH.belly; c.fill();
  }
}

function cthWing(c, side, flap) {
  c.save();
  c.translate(side * 48, -120);
  c.rotate(side * (-0.2 - flap * 0.5));
  c.scale(side, 1);
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(50, -70, 120, -60);
  c.quadraticCurveTo(110, -30, 118, -8);
  c.quadraticCurveTo(96, -18, 84, 4);
  c.quadraticCurveTo(66, -10, 50, 12);
  c.quadraticCurveTo(30, 0, 0, 20);
  c.closePath();
  fs(c, CTH.wing, INK, 5);
  line(c, 8, 6, 112, -56, CTH.wingDark, 4);
  line(c, 30, 4, 84, 2, CTH.wingDark, 3.5);
  c.restore();
}

function drawCthulhu(c, x, y, s, o = {}) {
  const t = o.t || 0;
  const mood = o.mood || 'sleep'; // sleep | smile | peek | awake | happy | wow
  const breathe = Math.sin(t * 1.6) * 0.5 + 0.5;
  c.save();
  c.translate(x, y);
  if (o.tilt) c.rotate(o.tilt);
  const sq = (o.sq || 1) * (1 + breathe * 0.02);
  c.scale((s * (o.flip ? -1 : 1)) / Math.sqrt(sq), s * sq);
  const flap = o.flap !== undefined ? o.flap : (mood === 'sleep' || mood === 'smile' ? breathe * 0.15 : 0.5 + Math.sin(t * 12) * 0.5);
  // wings
  cthWing(c, -1, flap); cthWing(c, 1, flap);
  // base tentacles (legs)
  const legs = [[-58, -0.9], [-24, -0.35], [24, 0.35], [58, 0.9]];
  legs.forEach(([lx, a], k) => tentacle(c, lx * 0.85, -34, 58, 21, a * 0.8, t * 0.8, k * 1.3, Math.sign(a) * 0.75, CTH.shade));
  // body
  c.beginPath();
  c.moveTo(-50, -122);
  c.bezierCurveTo(-78, -90, -76, -30, -56, -18);
  c.quadraticCurveTo(0, 4, 56, -18);
  c.bezierCurveTo(76, -30, 78, -90, 50, -122);
  c.closePath();
  fs(c, CTH.body, INK, 5);
  ellipse(c, 0, -60, 38, 36); c.fillStyle = CTH.belly; c.fill();
  // arms
  const up = o.armsUp || 0;
  const cthArms = () => {
    for (const sd of [-1, 1]) {
      c.save();
      c.translate(sd * 56, -88);
      c.rotate(sd * (-0.5 - up * 1.85 + Math.sin(t * 8 + sd) * up * 0.25));
      c.scale(sd, 1);
      rrect(c, -10, -6, 20, 44 + up * 22, 10); fs(c, CTH.body, INK, 4.5);
      const hl = 40 + up * 22;
      circle(c, -6, hl, 6.5); fs(c, CTH.body, INK, 3.5); circle(c, 6, hl, 6.5); fs(c, CTH.body, INK, 3.5); circle(c, 0, hl + 4, 6.5); fs(c, CTH.body, INK, 3.5);
      c.restore();
    }
  };
  if (up < 0.5) cthArms();
  // hugged plush / item
  if (o.hug === 'fish') drawFish(c, 0, -60, 1.25, t, { color: '#ffb3d1', plush: true, flip: false });
  if (o.hug === 'note') { c.save(); c.rotate(-0.15); drawEnvelope(c, 0, -62, 0.9); c.restore(); }
  if (o.hug === 'bottle') { c.save(); c.rotate(-0.5); drawBottle(c, 0, -60, 0.8, t); c.restore(); }
  // head
  c.save();
  c.translate(0, -190);
  c.rotate(o.headTilt || 0);
  c.translate(0, 190);
  for (const sd of [-1, 1]) { // ear fins
    c.save(); c.translate(sd * 98, -178); c.rotate(sd * (0.35 + Math.sin(t * 2 + sd) * 0.1));
    c.beginPath(); c.moveTo(0, -30); c.quadraticCurveTo(sd * 52, -14, sd * 40, 22); c.quadraticCurveTo(sd * 16, 12, 0, 24); c.closePath();
    fs(c, CTH.shade, INK, 4.5); c.restore();
  }
  c.beginPath();
  c.moveTo(-102, -160);
  c.bezierCurveTo(-112, -250, -62, -300, 0, -300);
  c.bezierCurveTo(62, -300, 112, -250, 102, -160);
  c.bezierCurveTo(96, -108, 52, -96, 0, -96);
  c.bezierCurveTo(-52, -96, -96, -108, -102, -160);
  c.closePath();
  const g = c.createRadialGradient(-40, -250, 10, 0, -190, 140);
  g.addColorStop(0, '#c8f6da'); g.addColorStop(0.5, CTH.body); g.addColorStop(1, CTH.shade);
  fs(c, g, INK, 5);
  // spots
  c.fillStyle = 'rgba(63,159,120,0.35)';
  circle(c, 40, -262, 12); c.fill(); circle(c, 64, -236, 8); c.fill(); circle(c, -58, -248, 9); c.fill();
  // eyes
  const eo = o.eyeOpen ?? (mood === 'awake' || mood === 'wow' ? 1 : 0);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 40, -168);
    const open = mood === 'peek' ? (sd > 0 ? eo : 0) : eo;
    if (mood === 'happy') {
      c.beginPath(); c.moveTo(-18, 6); c.quadraticCurveTo(0, -18, 18, 6); fs(c, null, INK, 6.5);
    } else if (open > 0.05) {
      const ry = 25 * open;
      const gg = c.createLinearGradient(0, -25, 0, 25);
      gg.addColorStop(0, '#ffb347'); gg.addColorStop(1, '#fff07a');
      ellipse(c, 0, 0, 21, ry); fs(c, gg, INK, 5);
      if (open > 0.3) {
        ellipse(c, 0, 3 * open, 9, 13 * open); c.fillStyle = '#1c1240'; c.fill();
        circle(c, -7, -8 * open, 6 * open); c.fillStyle = '#fff'; c.fill();
        circle(c, 6, 9 * open, 3); c.fill();
      }
      if (open < 1) { c.beginPath(); c.moveTo(-23, -ry + 2); c.quadraticCurveTo(0, -ry - 6, 23, -ry + 2); fs(c, null, INK, 6); }
    } else {
      c.beginPath(); c.moveTo(-18, -4); c.quadraticCurveTo(0, 14, 18, -4); fs(c, null, INK, 6.5);
      line(c, sd * 18, -4, sd * 26, -12, INK, 4.5); line(c, sd * 12, 4, sd * 20, 6, INK, 4);
    }
    c.restore();
  }
  ellipse(c, -70, -140, 17, 9); c.fillStyle = CTH.cheek; c.fill();
  ellipse(c, 70, -140, 17, 9); c.fill();
  // face tentacles
  const happyCurl = mood === 'happy' || mood === 'awake' || mood === 'smile' ? 1 : 0;
  const ft = [[-42, 48, -0.4], [-20, 60, -0.14], [0, 66, 0], [20, 60, 0.14], [42, 48, 0.4]];
  ft.forEach(([fx, len, a], k) => tentacle(c, fx, -128, len, 13, a * (1 + happyCurl * 0.6), t * (mood === 'sleep' ? 0.6 : 1.3), k * 1.1, (fx < 0 ? -1 : fx > 0 ? 1 : 0.4) * (0.45 + happyCurl * 0.35), CTH.shade));
  if (up >= 0.5) cthArms();
  // nightcap
  if (o.cap !== false) {
    const sw = Math.sin(t * 1.3) * 0.08;
    c.save();
    c.translate(-10, -268); c.rotate(-0.28 + sw);
    c.beginPath();
    c.moveTo(-78, 18);
    c.quadraticCurveTo(-30, -120, 60, -110);
    c.quadraticCurveTo(140, -96, 150, -10);
    c.quadraticCurveTo(110, -70, 70, -60);
    c.quadraticCurveTo(76, -10, 80, 18);
    c.closePath();
    fs(c, '#a78bfa', INK, 5);
    c.save(); c.clip();
    for (let k = -4; k < 8; k++) { c.beginPath(); c.moveTo(-100 + k * 36, 40); c.lineTo(-60 + k * 36, -140); c.lineWidth = 13; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke(); }
    c.restore();
    rrect(c, -86, 4, 176, 30, 15); fs(c, '#fff', INK, 5);
    circle(c, 150, -6, 20); fs(c, '#fff', INK, 5);
    c.restore();
  }
  // snot bubble while sleeping
  if (mood === 'sleep' || mood === 'smile') {
    const b = o.bubble ?? breathe;
    if (b > 0.05) {
      circle(c, 58, -150 + b * 6, 8 + 26 * b);
      c.fillStyle = 'rgba(190,240,255,0.35)'; c.fill();
      c.lineWidth = 3.5; c.strokeStyle = 'rgba(230,250,255,0.9)'; c.stroke();
      circle(c, 50 - b * 6, -158, 4 + b * 4); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
    }
  }
  c.restore(); // head tilt
  c.restore();
}

/* ======================= Tikk the alarm clock ======================= */
function drawClock(c, x, y, s, o = {}) {
  const t = o.t || 0, ring = o.ring || 0;
  c.save();
  c.translate(x + (ring ? Math.sin(t * 70) * 4 * ring : 0), y);
  c.rotate(o.tilt || 0);
  const sq = o.sq || 1;
  c.scale(s / Math.sqrt(sq), s * sq);
  // legs
  line(c, -30, -40, -36, -10, INK, 6); line(c, 30, -40, 36, -10, INK, 6);
  ellipse(c, -40, -8, 16, 9); fs(c, '#ffd166', INK, 4); ellipse(c, 40, -8, 16, 9); fs(c, '#ffd166', INK, 4);
  // bells + hammer
  const hm = ring ? Math.sin(t * 60) * 0.5 : 0;
  c.save(); c.translate(0, -168); c.rotate(hm); line(c, 0, 0, 0, -34, INK, 6); circle(c, 0, -36, 9); fs(c, '#ffd166', INK, 4); c.restore();
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 46, -160); c.rotate(sd * 0.5 + (ring ? Math.sin(t * 60 + sd) * 0.15 : 0));
    c.beginPath(); c.arc(0, 0, 30, Math.PI, 0); c.closePath(); fs(c, '#ffd166', INK, 5);
    circle(c, 0, -32, 6); fs(c, '#ffd166', INK, 4);
    c.restore();
  }
  if (ring) {
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + sd * (0.7 + k * 0.3);
      line(c, sd * 60 + Math.cos(a) * 60, -170 + Math.sin(a) * 60, sd * 60 + Math.cos(a) * 84, -170 + Math.sin(a) * 84, '#fff', 6);
    }
  }
  // arms
  const armL = o.armL ?? 0.4, armR = o.armR ?? 0.4;
  for (const [sd, a] of [[-1, armL], [1, armR]]) {
    c.save(); c.translate(sd * 68, -92); c.rotate(-sd * a);
    line(c, 0, 0, 0, 44, INK, 6);
    circle(c, 0, 48, 10); fs(c, '#fff', INK, 4);
    if ((sd > 0 && o.wag) || (sd < 0 && o.wagL)) { c.save(); c.rotate(Math.PI + sd * a); rrect(c, -4, -2, 8, 22, 4); c.restore(); c.save(); c.translate(0, 48); c.rotate(sd * a + Math.PI); rrect(c, -4, 4, 8, 22, 4); fs(c, '#fff', INK, 3.5); c.restore(); }
    c.restore();
  }
  // body
  circle(c, 0, -96, 74); fs(c, '#ff6b6b', INK, 6);
  circle(c, 0, -96, 58); fs(c, '#fff6e0', INK, 4);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    line(c, Math.cos(a) * 48, -96 + Math.sin(a) * 48, Math.cos(a) * 54, -96 + Math.sin(a) * 54, '#c9b8a0', 3);
  }
  const spd = ring ? 12 : 0.5;
  c.save(); c.translate(0, -96);
  c.rotate(t * spd); line(c, 0, 0, 0, -38, 'rgba(42,27,61,0.35)', 4); c.rotate(-t * spd * 1.08); line(c, 0, 0, 26, 0, 'rgba(42,27,61,0.35)', 5);
  c.restore();
  // face
  const face = o.face || 'smile';
  const blink = ((t + 1.1) % 2.9) < 0.1;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 20, -108);
    if (face === 'wise' || blink) { c.beginPath(); c.moveTo(-9, 0); c.quadraticCurveTo(0, 7, 9, 0); fs(c, null, INK, 5); }
    else if (face === 'happy') { c.beginPath(); c.moveTo(-9, 3); c.quadraticCurveTo(0, -9, 9, 3); fs(c, null, INK, 5); }
    else { ellipse(c, 0, 0, 7, 10); c.fillStyle = INK; c.fill(); circle(c, -2, -4, 3); c.fillStyle = '#fff'; c.fill(); }
    c.restore();
  }
  ellipse(c, -34, -88, 9, 5); c.fillStyle = PAL.blush; c.fill(); ellipse(c, 34, -88, 9, 5); c.fill();
  if (face === 'alarm' || face === 'talk') {
    const m = face === 'talk' ? 0.5 + 0.5 * Math.abs(Math.sin(t * 14)) : 1;
    ellipse(c, 0, -76, 11, 12 * m); fs(c, '#8a2346', INK, 4);
  } else { c.beginPath(); c.moveTo(-9, -80); c.quadraticCurveTo(0, -70, 9, -80); fs(c, null, INK, 4.5); }
  if (o.sweat) sweatDrop(c, 72, -150, 0.8);
  c.restore();
}

/* ======================= the moon ======================= */
function drawMoon(c, x, y, s, o = {}) {
  const t = o.t || 0;
  c.save();
  c.translate(x, y); c.rotate(o.tilt || 0); c.scale(s, s);
  glow(c, 0, 0, 260, 'rgba(255,240,180,0.35)');
  circle(c, 0, 0, 110); fs(c, '#fff1b8', INK, 6);
  c.fillStyle = 'rgba(230,200,120,0.45)';
  circle(c, -52, -50, 16); c.fill(); circle(c, 58, -30, 11); c.fill(); circle(c, 40, 62, 14); c.fill(); circle(c, -62, 40, 9); c.fill();
  const face = o.face || 'sleepy';
  if (o.shades) {
    c.save(); c.rotate(-0.05);
    for (const sd of [-1, 1]) { softStar(c, sd * 36, -10, 32, 5, -Math.PI / 2, 0.55); fs(c, '#2a1b3d', INK, 4); }
    line(c, -8, -12, 8, -12, INK, 6);
    sparkle(c, -46, -20, 9, '#fff');
    c.restore();
  } else if (face === 'sleepy' || face === 'smile') {
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 36 - 14, -8); c.quadraticCurveTo(sd * 36, 6, sd * 36 + 14, -8); fs(c, null, INK, 6); }
  } else if (face === 'pout') {
    for (const sd of [-1, 1]) { ellipse(c, sd * 34, -10, 8, 11); c.fillStyle = INK; c.fill(); line(c, sd * 20, -34, sd * 48, -26, INK, 5); }
  } else {
    for (const sd of [-1, 1]) { ellipse(c, sd * 34, -10, 9, 13); c.fillStyle = INK; c.fill(); circle(c, sd * 34 - 3, -15, 4); c.fillStyle = '#fff'; c.fill(); }
    line(c, -48, -40, -22, -34, INK, 5); line(c, 48, -40, 22, -34, INK, 5);
  }
  ellipse(c, -64, 22, 16, 8); c.fillStyle = PAL.blush; c.fill(); ellipse(c, 64, 22, 16, 8); c.fill();
  if (face === 'shout' || o.shades) {
    const m = 0.6 + 0.4 * Math.abs(Math.sin(t * 12));
    c.beginPath(); c.moveTo(-26, 28); c.quadraticCurveTo(0, 30, 26, 28); c.quadraticCurveTo(18, 28 + 40 * m, 0, 28 + 40 * m); c.quadraticCurveTo(-18, 28 + 40 * m, -26, 28);
    fs(c, '#8a2346', INK, 5);
  } else if (face === 'pout') {
    c.beginPath(); c.moveTo(-12, 40); c.quadraticCurveTo(0, 30, 12, 40); fs(c, null, INK, 5);
  } else { c.beginPath(); c.moveTo(-14, 30); c.quadraticCurveTo(0, 42, 14, 30); fs(c, null, INK, 5); }
  if (face === 'shh') {
    c.save(); c.translate(0, 34); rrect(c, -7, -40, 14, 50, 7); fs(c, '#fff1b8', INK, 4); c.restore();
  }
  c.restore();
}

/* ======================= the spellbook ======================= */
function drawBook(c, x, y, s, o = {}) {
  const t = o.t || 0;
  const open = o.open || 0; // mouth open 0..1
  c.save();
  c.translate(x, y); c.rotate(o.tilt || 0);
  const sq = o.sq || 1; c.scale(s / Math.sqrt(sq), s * sq);
  // pages block
  rrect(c, -86, -222, 176, 214, 16); fs(c, '#fff3d6', INK, 5);
  for (let k = 0; k < 5; k++) line(c, 80, -200 + k * 40, 88, -200 + k * 40, '#e2cfa6', 3);
  // cover
  rrect(c, -96, -230, 176, 222, 18); fs(c, '#7a4aa8', INK, 6);
  rrect(c, -82, -216, 148, 194, 12); fs(c, null, '#ffd166', 4);
  for (const [cx, cy] of [[-96, -230], [80, -230], [-96, -8], [80, -8]]) { circle(c, cx, cy, 14); fs(c, '#ffd166', INK, 4); }
  // cute tentacle swirl emblem
  c.save(); c.translate(-8, -80);
  c.beginPath();
  for (let a = 0; a < 11; a += 0.25) { const r = 3 + a * 2.6; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9); }
  fs(c, null, '#ffd166', 7); c.restore();
  // face
  const face = o.face || 'grin';
  for (const sd of [-1, 1]) {
    c.save(); c.translate(-8 + sd * 32, -160);
    if (face === 'pout' || face === 'sleep') { c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(0, face === 'sleep' ? 9 : -2, 12, 0); fs(c, null, INK, 5); if (face === 'pout') line(c, -14, -18, 12, -12 * sd - 4, INK, 4); }
    else {
      ellipse(c, 0, 0, 17, 20); fs(c, '#fff', INK, 4.5);
      circle(c, sd * 3, 3, 8); c.fillStyle = INK; c.fill(); circle(c, sd * 3 - 3, -1, 3); c.fillStyle = '#fff'; c.fill();
    }
    c.restore();
  }
  if (face === 'grin') { line(c, -60, -192, -34, -184, INK, 5); line(c, 44, -192, 18, -184, INK, 5); }
  const my = -118;
  if (open > 0.05) {
    const h = 34 * open;
    c.beginPath(); c.moveTo(-50, my); c.quadraticCurveTo(-8, my - 6, 34, my); c.quadraticCurveTo(24, my + h, -8, my + h); c.quadraticCurveTo(-40, my + h, -50, my);
    fs(c, '#4a1f3a', INK, 4.5);
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-40 + k * 20, my - 1); c.lineTo(-33 + k * 20, my + 12); c.lineTo(-26 + k * 20, my - 1); c.fillStyle = '#fff'; c.fill(); }
  } else if (face === 'pout') {
    c.beginPath(); c.moveTo(-24, my + 8); c.quadraticCurveTo(-8, my - 4, 8, my + 8); fs(c, null, INK, 5);
  } else {
    c.beginPath(); c.moveTo(-40, my); c.quadraticCurveTo(-8, my + 22, 24, my); fs(c, null, INK, 5);
    c.beginPath(); c.moveTo(-26, my + 6); c.lineTo(-20, my + 16); c.lineTo(-14, my + 9); c.fillStyle = '#fff'; c.fill();
  }
  ellipse(c, -64, -126, 12, 6); c.fillStyle = PAL.blush; c.fill(); ellipse(c, 48, -126, 12, 6); c.fill();
  if (o.locked) {
    const lk = o.locked;
    c.save();
    c.globalAlpha = clamp(lk * 2);
    for (const a of [-0.5, 0.5]) { c.save(); c.translate(-8, -118); c.rotate(a); rrect(c, -120, -9, 240, 18, 9); fs(c, '#c9c3d9', INK, 4); for (let k = -5; k <= 5; k++) line(c, k * 22, -9, k * 22, 9, '#9a94b0', 3); c.restore(); }
    c.translate(-8, -100 + (1 - lk) * -40);
    c.beginPath(); c.arc(0, -26, 20, Math.PI, 0); fs(c, null, INK, 14); c.beginPath(); c.arc(0, -26, 20, Math.PI, 0); fs(c, null, '#c9c3d9', 7);
    rrect(c, -32, -28, 64, 52, 12); fs(c, '#ffd166', INK, 5);
    circle(c, 0, -6, 7); c.fillStyle = INK; c.fill(); rrect(c, -3, -4, 6, 16, 3); c.fill();
    c.restore();
  }
  c.restore();
}

/* ======================= little star & wave characters ======================= */
function drawStarBuddy(c, x, y, s, o = {}) {
  const t = o.t || 0;
  c.save(); c.translate(x, y); c.rotate(o.tilt || Math.sin(t * 3 + (o.seed || 0)) * 0.15); c.scale(s, s);
  glow(c, 0, 0, 120, 'rgba(255,230,120,0.4)');
  softStar(c, 0, 0, 70, 5, -Math.PI / 2, 0.52); fs(c, '#ffe27a', INK, 5);
  for (const sd of [-1, 1]) { ellipse(c, sd * 16, -6, 5, 7); c.fillStyle = INK; c.fill(); }
  const m = o.shout ? 0.5 + 0.5 * Math.abs(Math.sin(t * 12 + (o.seed || 0))) : 0;
  if (m > 0) { ellipse(c, 0, 12, 8, 4 + 8 * m); fs(c, '#8a2346', INK, 3.5); }
  else { c.beginPath(); c.moveTo(-8, 10); c.quadraticCurveTo(0, 18, 8, 10); fs(c, null, INK, 4); }
  ellipse(c, -28, 8, 8, 5); c.fillStyle = PAL.blush; c.fill(); ellipse(c, 28, 8, 8, 5); c.fill();
  c.restore();
}
function drawWaveBuddy(c, x, y, s, o = {}) {
  const t = o.t || 0;
  c.save(); c.translate(x, y); c.scale(s, s);
  const wob = Math.sin(t * 4) * 8;
  c.beginPath();
  c.moveTo(-190, 0);
  c.bezierCurveTo(-180, -140, -60, -250 + wob, 60, -240);
  c.bezierCurveTo(150, -232, 190, -170, 170, -110);
  c.bezierCurveTo(150, -150, 100, -160, 80, -120);
  c.bezierCurveTo(60, -80, 120, -40, 180, -50);
  c.lineTo(200, 0);
  c.closePath();
  const g = c.createLinearGradient(0, -240, 0, 0);
  g.addColorStop(0, '#7fd0ff'); g.addColorStop(1, '#2f6fd0');
  fs(c, g, INK, 6);
  // foam crest
  c.beginPath();
  c.moveTo(-120, -196 + wob * 0.3);
  for (let k = 0; k <= 7; k++) { const a = -2.5 + k * 0.42; const px = 40 + Math.cos(a) * 170, py = -110 + Math.sin(a) * 140; c.quadraticCurveTo(px - 10, py - 26, px, py); }
  c.quadraticCurveTo(170, -80, 150, -120);
  c.bezierCurveTo(120, -190, -40, -230, -120, -196 + wob * 0.3);
  c.closePath(); fs(c, '#f2fbff', INK, 5);
  // face with shades
  c.save(); c.translate(-40, -120);
  for (const sd of [-1, 1]) { rrect(c, sd * 34 - 26, -16, 52, 30, 12); fs(c, '#2a1b3d', INK, 4); }
  line(c, -8, -6, 8, -6, INK, 5);
  sparkle(c, -48, -8, 7, '#fff');
  const m = o.shout ? 0.5 + 0.5 * Math.abs(Math.sin(t * 12)) : 0.2;
  c.beginPath(); c.moveTo(-26, 30); c.quadraticCurveTo(0, 32, 26, 30); c.quadraticCurveTo(16, 30 + 36 * m, 0, 30 + 36 * m); c.quadraticCurveTo(-16, 30 + 36 * m, -26, 30);
  fs(c, '#1b3f7a', INK, 4.5);
  c.restore();
  c.restore();
}

/* ======================= Aunt Mabel ======================= */
function drawMabel(c, x, y, s, o = {}) {
  const t = o.t || 0;
  const face = o.face || 'smile';
  c.save();
  c.translate(x, y); c.rotate(o.tilt || 0);
  const sq = o.sq || 1; c.scale((s * (o.flip ? -1 : 1)) / Math.sqrt(sq), s * sq);
  // bun
  circle(c, 0, -262, 34); fs(c, '#d9d2ea', INK, 5);
  circle(c, 10, -272, 8); c.fillStyle = '#fff'; c.fill();
  // shoes & skirt
  ellipse(c, -20, -7, 19, 10); fs(c, '#7a3a5a', INK, 4.5); ellipse(c, 20, -7, 19, 10); fs(c, '#7a3a5a', INK, 4.5);
  c.beginPath(); c.moveTo(-48, -60); c.quadraticCurveTo(-64, -20, -60, -16); c.lineTo(60, -16); c.quadraticCurveTo(64, -20, 48, -60); c.closePath(); fs(c, '#9b5fc0', INK, 5);
  // cardigan
  c.beginPath(); c.moveTo(-34, -104); c.quadraticCurveTo(-54, -70, -54, -48); c.lineTo(54, -48); c.quadraticCurveTo(54, -70, 34, -104); c.closePath(); fs(c, '#5cc2b9', INK, 5);
  line(c, 0, -100, 0, -50, INK, 3.5);
  for (let k = 0; k < 3; k++) { circle(c, 7, -90 + k * 14, 3.5); c.fillStyle = '#ffd166'; c.fill(); }
  // arms
  const cup = o.cup !== false;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 32, -92); c.rotate(-sd * (sd > 0 && cup ? 0.9 : o.armL ?? 0.3));
    rrect(c, -11, -6, 22, 42, 10); fs(c, '#5cc2b9', INK, 4.5);
    circle(c, 0, 44, 11); fs(c, PAL.skin, INK, 4);
    if (sd > 0 && cup) {
      c.translate(0, 50); c.rotate(0.9 + (o.spill || 0));
      drawProp(c, 'teacup', t);
      if ((o.spill || 0) > 0.3) { for (let k = 0; k < 3; k++) { const d = ((t * 3 + k / 3) % 1); circle(c, 30 + d * 20, 6 + d * 60, 5); c.fillStyle = '#c98a4a'; c.fill(); } }
    }
    c.restore();
  }
  // head
  ellipse(c, 0, -170, 78, 70); fs(c, PAL.skin, INK, 5);
  // hair cap (gray curls)
  c.beginPath();
  c.moveTo(-82, -150);
  c.bezierCurveTo(-94, -226, -50, -252, 0, -252);
  c.bezierCurveTo(50, -252, 94, -226, 82, -150);
  for (let k = 0; k < 6; k++) { const xx = 82 - (k + 1) * 164 / 6; c.quadraticCurveTo(xx + 164 / 12, -184 - (k % 2) * 8, xx, -168 - (k === 5 ? -18 : 0)); }
  c.closePath();
  fs(c, '#d9d2ea', INK, 5);
  for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-48 + k * 32, -222, 10, Math.PI, 0); fs(c, null, '#b9b0d0', 3); }
  // face
  const blink = ((t + 0.4) % 3.7) < 0.1;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 30, -150);
    if (face === 'smile' || face === 'happy' || blink) { c.beginPath(); c.moveTo(-11, 3); c.quadraticCurveTo(0, -9, 11, 3); fs(c, null, INK, 5); }
    else if (face === 'blank') { circle(c, 0, 0, 5); c.fillStyle = INK; c.fill(); }
    else if (face === 'shock') { ellipse(c, 0, 0, 12, 14); fs(c, '#fff', INK, 4); circle(c, 0, 0, 4); c.fillStyle = INK; c.fill(); }
    else { ellipse(c, 0, 0, 8, 10); c.fillStyle = INK; c.fill(); circle(c, -3, -4, 3); c.fillStyle = '#fff'; c.fill(); }
    c.restore();
  }
  // glasses
  circle(c, -30, -150, 22); fs(c, 'rgba(220,240,255,0.2)', '#c07a3a', 4); circle(c, 30, -150, 22); fs(c, 'rgba(220,240,255,0.2)', '#c07a3a', 4);
  line(c, -8, -152, 8, -152, '#c07a3a', 4);
  ellipse(c, -52, -124, 14, 8); c.fillStyle = PAL.blush; c.fill(); ellipse(c, 52, -124, 14, 8); c.fill();
  if (face === 'shock') { ellipse(c, 0, -112, 10, 13); fs(c, '#8a2346', INK, 4); }
  else if (face === 'blank') line(c, -8, -114, 8, -114, INK, 4);
  else if (face === 'happy') { c.beginPath(); c.moveTo(-14, -118); c.quadraticCurveTo(0, -116, 14, -118); c.quadraticCurveTo(10, -100, 0, -100); c.quadraticCurveTo(-10, -100, -14, -118); fs(c, '#8a2346', INK, 4); }
  else { c.beginPath(); c.moveTo(-10, -116); c.quadraticCurveTo(0, -106, 10, -116); fs(c, null, INK, 4.5); }
  // pearls
  for (let k = -3; k <= 3; k++) { circle(c, k * 9, -100 + Math.abs(k) * -2, 5); fs(c, '#fff', INK, 2); }
  c.restore();
}

/* ======================= the mail carrier ======================= */
function drawMailman(c, x, y, s, o = {}) {
  const t = o.t || 0, face = o.face || 'smile';
  c.save();
  c.translate(x, y); c.rotate(o.tilt || 0);
  const sq = o.sq || 1; c.scale((s * (o.flip ? -1 : 1)) / Math.sqrt(sq), s * sq);
  ellipse(c, -20, -7, 19, 10); fs(c, '#2a2a4a', INK, 4.5); ellipse(c, 20, -7, 19, 10); fs(c, '#2a2a4a', INK, 4.5);
  rrect(c, -28, -48, 22, 42, 9); fs(c, '#3f5fb5', INK, 4.5); rrect(c, 6, -48, 22, 42, 9); fs(c, '#3f5fb5', INK, 4.5);
  c.beginPath(); c.moveTo(-36, -104); c.quadraticCurveTo(-54, -70, -54, -42); c.lineTo(54, -42); c.quadraticCurveTo(54, -70, 36, -104); c.closePath(); fs(c, '#6f9cf5', INK, 5);
  // satchel strap + bag
  line(c, -34, -100, 40, -50, '#a8744a', 9);
  rrect(c, 22, -70, 58, 46, 10); fs(c, '#b98050', INK, 5);
  c.beginPath(); c.moveTo(22, -60); c.lineTo(80, -60); fs(c, null, INK, 3.5);
  drawEnvelope(c, 44, -78, 0.35); drawEnvelope(c, 60, -80, 0.35, '#ffe7f1');
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 32, -92); c.rotate(-sd * (sd < 0 ? o.armL ?? 0.3 : o.armR ?? 0.3));
    rrect(c, -11, -6, 22, 40, 10); fs(c, '#6f9cf5', INK, 4.5);
    circle(c, 0, 44, 11); fs(c, PAL.skin, INK, 4);
    if (sd < 0 && o.hold) { c.translate(0, 50); c.rotate(-sd * -(o.armL ?? 0.3)); drawProp(c, o.hold, t); }
    c.restore();
  }
  ellipse(c, 0, -170, 78, 70); fs(c, PAL.skin, INK, 5);
  // hair tufts
  c.beginPath(); c.moveTo(-80, -160); c.quadraticCurveTo(-86, -196, -60, -206); c.lineTo(60, -206); c.quadraticCurveTo(86, -196, 80, -160); c.quadraticCurveTo(70, -176, 60, -170); c.lineTo(-60, -170); c.quadraticCurveTo(-70, -176, -80, -160); c.closePath();
  fs(c, '#8a5a3a', INK, 5);
  // cap
  c.beginPath(); c.moveTo(-78, -196); c.bezierCurveTo(-80, -268, 80, -268, 78, -196); c.closePath(); fs(c, '#3f5fb5', INK, 5);
  c.beginPath(); c.moveTo(-86, -196); c.quadraticCurveTo(0, -176, 96, -190); c.quadraticCurveTo(0, -206, -86, -196); fs(c, '#2c4690', INK, 5);
  drawEnvelope(c, 0, -228, 0.32);
  const blink = ((t + 2.2) % 3.1) < 0.1;
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 30, -152);
    if (face === 'happy' || blink) { c.beginPath(); c.moveTo(-11, 3); c.quadraticCurveTo(0, -9, 11, 3); fs(c, null, INK, 5); }
    else if (face === 'blank') { circle(c, 0, 0, 5); c.fillStyle = INK; c.fill(); }
    else if (face === 'shock') { ellipse(c, 0, 0, 12, 14); fs(c, '#fff', INK, 4); circle(c, 0, 0, 4); c.fillStyle = INK; c.fill(); }
    else { ellipse(c, 0, 0, 8, 11); c.fillStyle = INK; c.fill(); circle(c, -3, -4, 3); c.fillStyle = '#fff'; c.fill(); }
    c.restore();
  }
  // mustache
  c.beginPath(); c.moveTo(0, -126); c.bezierCurveTo(-14, -140, -40, -132, -38, -116); c.quadraticCurveTo(-18, -124, 0, -118); c.quadraticCurveTo(18, -124, 38, -116); c.bezierCurveTo(40, -132, 14, -140, 0, -126); fs(c, '#8a5a3a', INK, 4);
  ellipse(c, -54, -128, 13, 7); c.fillStyle = PAL.blush; c.fill(); ellipse(c, 54, -128, 13, 7); c.fill();
  if (face === 'shock') { ellipse(c, 0, -104, 9, 11); fs(c, '#8a2346', INK, 4); }
  else if (face === 'happy') { c.beginPath(); c.moveTo(-12, -110); c.quadraticCurveTo(0, -94, 12, -110); fs(c, '#8a2346', INK, 4); }
  c.restore();
}

/* ======================= the tailor (a very fashionable cat) ======================= */
function drawTailorCat(c, x, y, s, o = {}) {
  const t = o.t || 0;
  c.save(); c.translate(x, y); c.rotate(o.tilt || 0); const sq = o.sq || 1; c.scale(s / Math.sqrt(sq), s * sq);
  // tail
  c.beginPath(); c.moveTo(40, -30); c.bezierCurveTo(120, -40, 110, -140 + Math.sin(t * 3) * 20, 150, -150 + Math.sin(t * 3) * 20); fs(c, null, INK, 22);
  c.beginPath(); c.moveTo(40, -30); c.bezierCurveTo(120, -40, 110, -140 + Math.sin(t * 3) * 20, 150, -150 + Math.sin(t * 3) * 20); fs(c, null, '#ffcf99', 13);
  ellipse(c, -22, -8, 20, 11); fs(c, '#fff', INK, 4.5); ellipse(c, 22, -8, 20, 11); fs(c, '#fff', INK, 4.5);
  c.beginPath(); c.moveTo(-40, -110); c.quadraticCurveTo(-60, -40, -46, -14); c.lineTo(46, -14); c.quadraticCurveTo(60, -40, 40, -110); c.closePath(); fs(c, '#fff', INK, 5);
  // vest
  c.beginPath(); c.moveTo(-40, -106); c.quadraticCurveTo(-52, -60, -44, -40); c.lineTo(-4, -40); c.lineTo(-4, -100); c.closePath(); fs(c, '#ff6f9f', INK, 4);
  c.beginPath(); c.moveTo(40, -106); c.quadraticCurveTo(52, -60, 44, -40); c.lineTo(4, -40); c.lineTo(4, -100); c.closePath(); fs(c, '#ff6f9f', INK, 4);
  // arms: paw up
  c.save(); c.translate(-38, -92); c.rotate(0.4); rrect(c, -11, -4, 22, 40, 10); fs(c, '#fff', INK, 4.5); circle(c, 0, 42, 11); fs(c, '#fff', INK, 4); c.restore();
  c.save(); c.translate(38, -92); c.rotate(-2.6 + Math.sin(t * 8) * 0.1); rrect(c, -11, -4, 22, 40, 10); fs(c, '#fff', INK, 4.5); circle(c, 0, 42, 13); fs(c, '#fff', INK, 4);
  c.translate(0, 42); c.rotate(2.6); rrect(c, -5, -30, 10, 20, 5); fs(c, '#fff', INK, 3.5); c.restore();
  // head
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 70, -200); c.lineTo(sd * 76, -270); c.lineTo(sd * 22, -236); c.closePath(); fs(c, sd < 0 ? '#ffb366' : '#fff', INK, 5); c.beginPath(); c.moveTo(sd * 62, -214); c.lineTo(sd * 68, -252); c.lineTo(sd * 38, -232); c.closePath(); c.fillStyle = '#ffc2d8'; c.fill(); }
  ellipse(c, 0, -172, 84, 70); fs(c, '#fff', INK, 5);
  c.save(); ellipse(c, 0, -172, 84, 70); c.clip(); ellipse(c, -60, -210, 60, 50); c.fillStyle = '#ffb366'; c.fill(); c.restore();
  ellipse(c, 0, -172, 84, 70); fs(c, null, INK, 5);
  for (const sd of [-1, 1]) { c.save(); c.translate(sd * 32, -170); c.beginPath(); c.moveTo(-12, 3); c.quadraticCurveTo(0, -10, 12, 3); fs(c, null, INK, 5.5); c.restore(); }
  // monocle
  circle(c, 32, -170, 22); fs(c, 'rgba(220,240,255,0.25)', '#ffd166', 5); line(c, 52, -160, 60, -110, '#ffd166', 2.5);
  c.beginPath(); c.moveTo(-6, -146); c.lineTo(6, -146); c.lineTo(0, -140); c.closePath(); fs(c, '#ff8fb1', INK, 2.5);
  c.beginPath(); c.moveTo(-12, -134); c.quadraticCurveTo(-6, -128, 0, -134); c.quadraticCurveTo(6, -128, 12, -134); fs(c, null, INK, 4);
  for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) line(c, sd * 50, -142 + k * 10, sd * 86, -148 + k * 16, INK, 3);
  ellipse(c, -56, -134, 12, 6); c.fillStyle = PAL.blush; c.fill(); ellipse(c, 56, -134, 12, 6); c.fill();
  // measuring tape around neck
  c.beginPath(); c.moveTo(-50, -112); c.quadraticCurveTo(0, -94, 50, -112); fs(c, null, INK, 14); c.beginPath(); c.moveTo(-50, -112); c.quadraticCurveTo(0, -94, 50, -112); fs(c, null, '#ffe27a', 9);
  c.beginPath(); c.moveTo(-36, -106); c.quadraticCurveTo(-46, -70, -30, -40); fs(c, null, INK, 14); c.beginPath(); c.moveTo(-36, -106); c.quadraticCurveTo(-46, -70, -30, -40); fs(c, null, '#ffe27a', 9);
  c.restore();
}

/* ======================= sea critters & small props ======================= */
function drawFish(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
  const wag = Math.sin(t * 10 + (o.seed || 0)) * 0.3;
  c.save(); c.translate(-30, 0); c.rotate(wag);
  c.beginPath(); c.moveTo(4, 0); c.lineTo(-24, -18); c.quadraticCurveTo(-16, 0, -24, 18); c.closePath(); fs(c, o.color || '#ffb347', INK, 4); c.restore();
  ellipse(c, 0, 0, 36, 24); fs(c, o.color || '#ffb347', INK, 4.5);
  c.beginPath(); c.moveTo(-4, -22); c.quadraticCurveTo(6, -36, 16, -20); fs(c, o.color || '#ffb347', INK, 4);
  if (o.plush) { line(c, -10, -8, -10, 8, 'rgba(42,27,61,0.4)', 3); }
  circle(c, 16, -4, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  circle(c, 18, -4, 3.5); c.fillStyle = INK; c.fill();
  ellipse(c, 12, 8, 6, 3.5); c.fillStyle = PAL.blush; c.fill();
  c.restore();
}
function drawCrab(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) line(c, sd * 24, -18 + k * 6, sd * (44 + k * 4), -2 + k * 4, INK, 5);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 36, -40); c.rotate(sd * (0.3 + Math.sin(t * 8 + sd) * 0.25 * (o.wave ? 1 : 0.3)));
    line(c, 0, 0, sd * 10, -24, INK, 6); circle(c, sd * 12, -36, 16); fs(c, '#ff6b6b', INK, 4);
    c.beginPath(); c.moveTo(sd * 12, -36); c.lineTo(sd * 30, -44); fs(c, null, INK, 4);
    c.restore();
  }
  ellipse(c, 0, -22, 38, 26); fs(c, '#ff6b6b', INK, 4.5);
  for (const sd of [-1, 1]) { line(c, sd * 12, -44, sd * 14, -60, INK, 4); circle(c, sd * 14, -64, 8); fs(c, '#fff', INK, 3); circle(c, sd * 14, -64, 3.5); c.fillStyle = INK; c.fill(); }
  c.beginPath(); c.moveTo(-8, -18); c.quadraticCurveTo(0, -10, 8, -18); fs(c, null, INK, 3.5);
  c.restore();
}
function drawJelly(c, x, y, s, t, color = '#ff9ecf') {
  c.save(); c.translate(x, y); c.scale(s, s);
  glow(c, 0, -10, 130, 'rgba(255,170,220,0.45)');
  for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 14, 0); for (let u = 0; u <= 1; u += 0.1) c.lineTo(k * 14 + Math.sin(t * 3 + u * 6 + k) * 8, u * 90); fs(c, null, color, 5); }
  c.beginPath(); c.moveTo(-50, 4); c.bezierCurveTo(-54, -70, 54, -70, 50, 4); c.quadraticCurveTo(25, -6, 0, 4); c.quadraticCurveTo(-25, -6, -50, 4); fs(c, color, INK, 4.5);
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 18 - 7, -24); c.quadraticCurveTo(sd * 18, -18, sd * 18 + 7, -24); fs(c, null, INK, 4); }
  c.restore();
}
function drawSeal(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  ellipse(c, 0, -46, 70, 48); fs(c, '#f4f7ff', INK, 5);
  c.save(); c.translate(64, -18); c.rotate(-0.4 + Math.sin(t * 10) * 0.2); ellipse(c, 12, 0, 22, 10); fs(c, '#e2e8f8', INK, 4); c.restore();
  c.save(); c.translate(-50, -16); c.rotate(0.5 + Math.sin(t * 9) * 0.3); ellipse(c, -8, 0, 18, 9); fs(c, '#e2e8f8', INK, 4); c.restore();
  for (const sd of [-1, 1]) { ellipse(c, sd * 24, -58, 12, 14); c.fillStyle = INK; c.fill(); circle(c, sd * 24 - 4, -63, 4.5); c.fillStyle = '#fff'; c.fill(); }
  ellipse(c, 0, -42, 8, 5); c.fillStyle = '#ff8fa8'; c.fill();
  c.beginPath(); c.moveTo(-8, -34); c.quadraticCurveTo(-4, -28, 0, -34); c.quadraticCurveTo(4, -28, 8, -34); fs(c, null, INK, 3);
  ellipse(c, -44, -40, 11, 6); c.fillStyle = PAL.blush; c.fill(); ellipse(c, 44, -40, 11, 6); c.fill();
  c.restore();
}
function flame(c, x, y, s, t) {
  const fl = 1 + Math.sin(t * 18 + x) * 0.08 + noise1(t * 6 + x, 2) * 0.08;
  c.save(); c.translate(x, y); c.scale(s, s * fl);
  glow(c, 0, -10, 60, 'rgba(255,200,90,0.55)');
  c.beginPath(); c.moveTo(0, -34); c.bezierCurveTo(16, -12, 14, 6, 0, 6); c.bezierCurveTo(-14, 6, -16, -12, 0, -34); fs(c, '#ffb347', INK, 3.5);
  c.beginPath(); c.moveTo(0, -20); c.bezierCurveTo(7, -8, 7, 2, 0, 2); c.bezierCurveTo(-7, 2, -7, -8, 0, -20); c.fillStyle = '#fff3b0'; c.fill();
  c.restore();
}
function drawCandle(c, x, y, s, t, lit = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  ellipse(c, 0, 0, 30, 10); fs(c, '#ffd166', INK, 4);
  rrect(c, -16, -80, 32, 80, 8); fs(c, '#2e2445', INK, 4.5);
  c.beginPath(); c.moveTo(-16, -72); c.quadraticCurveTo(-10, -56, -6, -72); c.quadraticCurveTo(0, -50, 6, -72); fs(c, '#433863', null);
  line(c, 0, -80, 0, -90, INK, 3);
  if (lit > 0) { c.save(); c.globalAlpha = clamp(lit); flame(c, 0, -90, lit, t); c.restore(); }
  c.restore();
}
function drawKey(c, x, y, s, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -8, -10, 16, 120, 7); fs(c, '#ffd166', INK, 5);
  rrect(c, 8, 70, 26, 14, 4); fs(c, '#ffd166', INK, 4); rrect(c, 8, 94, 20, 12, 4); fs(c, '#ffd166', INK, 4);
  // tentacle-curl bow
  circle(c, 0, -42, 38); fs(c, '#ffd166', INK, 5);
  c.beginPath(); for (let a = 0; a < 9; a += 0.25) { const r = 2 + a * 2.6; c.lineTo(Math.cos(a + 1) * r, -42 + Math.sin(a + 1) * r); } fs(c, null, '#e0a030', 5);
  circle(c, 0, -42, 9); fs(c, '#8fe3b0', INK, 3.5);
  c.restore();
}
function drawEnvelope(c, x, y, s, col = '#fff') {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -50, -32, 100, 64, 8); fs(c, col, INK, 5);
  c.beginPath(); c.moveTo(-48, -28); c.lineTo(0, 6); c.lineTo(48, -28); fs(c, null, INK, 4);
  heartPath(c, 0, 8, 12); fs(c, '#ff6f9f', INK, 3);
  c.restore();
}
function drawBottle(c, x, y, s, t = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rrect(c, -30, -50, 60, 100, 22); fs(c, 'rgba(170,240,220,0.55)', INK, 5);
  rrect(c, -12, -80, 24, 34, 8); fs(c, 'rgba(170,240,220,0.55)', INK, 5);
  rrect(c, -14, -92, 28, 16, 5); fs(c, '#c98a4a', INK, 4);
  c.save(); c.rotate(0.2); rrect(c, -18, -30, 36, 58, 6); fs(c, '#fff3d6', INK, 3); heartPath(c, 0, 4, 9); c.fillStyle = '#ff6f9f'; c.fill(); c.restore();
  line(c, -18, -34, -18, 26, 'rgba(255,255,255,0.8)', 5);
  line(c, -16, -58, 16, -50, '#ff6f9f', 5);
  c.restore();
}
