/* Characters: Rusty (front, side, sleeping, head close-up) and the three kids.
 * Rigs are drawn procedurally; poses are plain objects so shots can animate any field.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ellipse, circle, fs, limb, curve } = RV;
  const OUT = RV.OUT;

  // ================================================================ shared face bits
  // Eyes shining in the dark have to sit exactly on the characters' real eyes, so every open eye
  // reports where it was drawn while RV.collectEyes is running: the transform at its centre, its
  // size, blink, and the pupil's offset (local units).
  let eyeProbe = null;
  function probeEye(ctx, rx, ry, blink, px, py, pr) {
    if (!eyeProbe) return;
    const m = ctx.getTransform();
    eyeProbe.push({ m: [m.a, m.b, m.c, m.d, m.e, m.f], rx, ry, blink, px, py, pr });
  }
  RV.collectEyes = function (draw) {
    const prev = eyeProbe;
    eyeProbe = [];
    try { draw(); return eyeProbe; } finally { eyeProbe = prev; }
  };
  // draw collected eyes as white eyes with dark pupils (on top of a darkness overlay)
  RV.drawDarkEyes = function (ctx, eyes, alpha = 1) {
    if (alpha <= 0) return;
    for (const e of eyes) {
      ctx.save();
      ctx.setTransform(e.m[0], e.m[1], e.m[2], e.m[3], e.m[4], e.m[5]);
      ctx.globalAlpha *= alpha;
      ctx.scale(1, Math.max(0.08, 1 - e.blink));
      ellipse(ctx, 0, 0, e.rx, e.ry);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.clip();
      circle(ctx, e.px, e.py, e.pr);
      ctx.fillStyle = '#1b0f0a';
      ctx.fill();
      ctx.restore();
    }
  };

  function eye(ctx, x, y, rx, ry, o) {
    const kind = o.eyes || 'open';
    const lw = o.lw || 4;
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'happy' || kind === 'closed' || kind === 'sleep' || kind === 'squeeze') {
      ctx.beginPath();
      if (kind === 'happy') { ctx.moveTo(-rx, ry * 0.25); ctx.quadraticCurveTo(0, -ry * 0.9, rx, ry * 0.25); }
      else if (kind === 'squeeze') {
        // screwed-up effort eyes: > <
        const s = o.side || 1;
        ctx.moveTo(-rx * s, -ry * 0.55); ctx.lineTo(rx * 0.55 * s, 0); ctx.lineTo(-rx * s, ry * 0.55);
      } else { ctx.moveTo(-rx, -ry * 0.1); ctx.quadraticCurveTo(0, ry * 0.7, rx, -ry * 0.1); }
      ctx.lineWidth = lw * 1.2; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
      return;
    }
    if (kind === 'dots') {
      // deadpan: tiny dot eyes, no whites
      circle(ctx, (o.look ? o.look[0] : 0) * rx * 0.3, 0, rx * 0.3);
      fs(ctx, '#1b0f0a');
      ctx.restore();
      return;
    }
    if (kind === 'spiral') {
      // dizzy
      ctx.beginPath();
      const turns = 2.4, spin = (o.t || 0) * 9 * (o.side || 1);
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * turns * TAU + spin, rr = (i / 40) * rx * 1.05;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr * (ry / rx);
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ellipse(ctx, 0, 0, rx * 1.1, ry * 1.1); fs(ctx, '#ffffff', lw);
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * turns * TAU + spin, rr = (i / 40) * rx * 0.95;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr * (ry / rx);
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.lineWidth = lw * 0.8; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.restore();
      return;
    }
    const blink = clamp(o.blink || 0);
    const wide = kind === 'wide' ? 1.18 : 1;
    const sy = Math.max(0.08, 1 - blink);
    const lx = (o.look ? o.look[0] : 0) * rx * 0.45, ly = (o.look ? o.look[1] : 0) * ry * 0.4;
    const ir = rx * (kind === 'wide' ? 0.62 : 0.78);
    probeEye(ctx, rx * wide, ry * wide, blink, lx, ly + ry * 0.08, ir * 0.62);
    ctx.scale(1, sy);
    ellipse(ctx, 0, 0, rx * wide, ry * wide);
    fs(ctx, '#ffffff', lw);
    ctx.save();
    ellipse(ctx, 0, 0, rx * wide, ry * wide);
    ctx.clip();
    circle(ctx, lx, ly + ry * 0.08, ir);
    fs(ctx, o.irisC || '#5a3620');
    circle(ctx, lx, ly + ry * 0.08, ir * 0.55);
    fs(ctx, '#1b0f0a');
    circle(ctx, lx - ir * 0.35, ly - ir * 0.3, ir * 0.36);
    fs(ctx, '#ffffff');
    circle(ctx, lx + ir * 0.35, ly + ir * 0.45, ir * 0.16);
    fs(ctx, '#ffffff');
    // upper lid shade
    ctx.fillStyle = 'rgba(120,70,60,0.18)';
    ctx.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 0.55);
    // droopy upper lid (unimpressed / side-eye)
    const E = ry * wide, X = rx * 1.4;
    const lid = clamp(o.lid || 0);
    if (lid > 0) {
      const y0 = -E + 2 * E * lid;
      ctx.beginPath(); ctx.moveTo(-X, -E * 1.5); ctx.lineTo(X, -E * 1.5); ctx.lineTo(X, y0); ctx.quadraticCurveTo(0, y0 + E * 0.22, -X, y0); ctx.closePath();
      ctx.fillStyle = o.skin || '#f9d6c1'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-X, y0); ctx.quadraticCurveTo(0, y0 + E * 0.22, X, y0);
      ctx.lineWidth = lw * 1.3; ctx.strokeStyle = OUT; ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  function mouth(ctx, x, y, w, o, lw) {
    const kind = o.mouth || 'smile';
    const open = clamp(o.open || 0);
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if ((kind === 'smile' || kind === 'talk' || kind === 'sing') && open < 0.08) {
      ctx.beginPath(); ctx.moveTo(-w * 0.5, -w * 0.08); ctx.quadraticCurveTo(0, w * 0.42, w * 0.5, -w * 0.08);
      ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    } else if (kind === 'flat') {
      ctx.beginPath(); ctx.moveTo(-w * 0.35, 0); ctx.lineTo(w * 0.35, 0);
      ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    } else if (kind === 'frown') {
      ctx.beginPath(); ctx.moveTo(-w * 0.38, w * 0.12); ctx.quadraticCurveTo(0, -w * 0.25, w * 0.38, w * 0.12);
      ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    } else if (kind === 'smirk') {
      ctx.beginPath(); ctx.moveTo(-w * 0.35, w * 0.02); ctx.quadraticCurveTo(w * 0.1, w * 0.18, w * 0.45, -w * 0.15);
      ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    } else if (kind === 'o') {
      const s = 0.55 + open * 0.45;
      ellipse(ctx, 0, w * 0.1, w * 0.2 * s, w * 0.26 * s);
      fs(ctx, '#6e2230', lw);
    } else if (kind === 'wavy') {
      // uneasy squiggle
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const u = i / 24, px = (u - 0.5) * w * 0.8, py = Math.sin(u * TAU * 1.5 + (o.t || 0) * 6) * w * 0.07;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    } else if (kind === 'grimace') {
      // clenched teeth: "yikes"
      const ww = w * 0.48, hh = w * 0.3;
      RV.rrect(ctx, -ww, -hh / 2, ww * 2, hh, hh * 0.45);
      fs(ctx, '#ffffff', lw);
      ctx.beginPath(); ctx.moveTo(-ww + 4, 0); ctx.lineTo(ww - 4, 0);
      for (let i = 1; i < 5; i++) { const px = -ww + (ww * 2 * i) / 5; ctx.moveTo(px, -hh / 2 + 2); ctx.lineTo(px, hh / 2 - 2); }
      ctx.lineWidth = lw * 0.6; ctx.strokeStyle = OUT; ctx.stroke();
    } else {
      // open shapes: grin / open / talk / sing / scream
      const h = kind === 'grin' ? w * 0.42 : w * (0.12 + open * 0.5);
      const ww = kind === 'grin' ? w * 0.56 : w * (0.36 + open * 0.08);
      ctx.beginPath();
      ctx.moveTo(-ww, -h * 0.15);
      ctx.quadraticCurveTo(0, -h * 0.35 + (kind === 'grin' ? 0 : h * 0.1), ww, -h * 0.15);
      ctx.quadraticCurveTo(ww * 0.95, h * 1.1, 0, h * 1.15);
      ctx.quadraticCurveTo(-ww * 0.95, h * 1.1, -ww, -h * 0.15);
      ctx.closePath();
      fs(ctx, '#6e2230');
      ctx.save();
      ctx.clip();
      // teeth + tongue
      ctx.fillStyle = '#fff';
      ctx.fillRect(-ww, -h * 0.4, ww * 2, h * 0.32);
      ellipse(ctx, 0, h * 1.05, ww * 0.62, h * 0.45);
      fs(ctx, '#ef7d8c');
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(-ww, -h * 0.15);
      ctx.quadraticCurveTo(0, -h * 0.35 + (kind === 'grin' ? 0 : h * 0.1), ww, -h * 0.15);
      ctx.quadraticCurveTo(ww * 0.95, h * 1.1, 0, h * 1.15);
      ctx.quadraticCurveTo(-ww * 0.95, h * 1.1, -ww, -h * 0.15);
      ctx.closePath();
      ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    }
    ctx.restore();
  }

  // ================================================================ kids
  const SKIN0 = '#f9d6c1', SKIN_SH0 = '#ecb59c';
  const KIDS = {
    // older sister: big dark curls, mint cockatoo tee, fluffy pink cardigan, cream culottes, white sneakers
    big: {
      headR: 66, neck: 12, torso: 112, sh: 44, hip: 33, ua: 60, fa: 54, thigh: 74, shin: 72, limbW: 30, legW: 34,
      hair: 'curly', hairC: '#3b2116', hairHi: '#6d412a', irisC: '#5b3721', outfit: 'cardigan',
      shirt: '#c5ead4', coat: '#eea596', coatHi: '#f7c5b8', coatSh: '#d9887a', sleeves: 'coat',
      pants: '#f0e3cd', pantsSh: '#dac8ac', crop: 0.62, sock: '#f8c9d2', shoe: '#ffffff', shoeTrim: '#f3a3b4',
    },
    // brother: tousled light-brown hair, black varsity jacket with grey sleeves, light jeans
    boy: {
      headR: 62, neck: 11, torso: 96, sh: 40, hip: 30, ua: 52, fa: 47, thigh: 62, shin: 60, limbW: 28, legW: 31,
      hair: 'tousled', hairC: '#7c5133', hairHi: '#a8774e', irisC: '#4d3b2b', outfit: 'varsity', ribs: true,
      shirt: '#1c1c22', coat: '#24242c', coatHi: '#3a3a45', coatSh: '#18181e', sleeves: 'varsity', sleeveC: '#a2a3ab', trim: '#f4f4f4',
      pants: '#a7c4e0', pantsSh: '#86a8ca', crop: 1, shoe: '#27324b', shoeTrim: '#e9edf3',
    },
    // little sister: brown bob, cream tee, lilac track pants, yellow crocs
    little: {
      headR: 60, neck: 10, torso: 84, sh: 35, hip: 28, ua: 44, fa: 40, thigh: 52, shin: 50, limbW: 25, legW: 28,
      hair: 'bob', hairC: '#6c3f26', hairHi: '#96603c', irisC: '#5d3b24', outfit: 'tee',
      shirt: '#f7f1e7', shirtSh: '#e6dccb', sleeves: 'short',
      pants: '#d2bbea', pantsSh: '#b69dd3', stripe: '#ffffff', crop: 1, shoe: '#f6e46a', shoeTrim: '#46c2cb', crocs: true,
    },
    // cousin Ben (from the photo): tousled light-brown hair with a fringe swept across, very rosy
    // cheeks, blue-grey eyes, big toothy grin, sturdy build. His usual t-shirt and shorts.
    ben: {
      headR: 70, neck: 10, torso: 104, sh: 50, hip: 42, ua: 56, fa: 52, thigh: 70, shin: 68, limbW: 33, legW: 37,
      hair: 'ben', hairC: '#9a6b40', hairHi: '#d4a66a', hairSh: '#7a5230', irisC: '#62839b', outfit: 'bentee', ears: true,
      blush: 0.8, blushR: 1.55, cheek: 0.07, belly: 10,
      shirt: '#2f7fe0', shirtSh: '#2367bd', shirtHi: '#5c9df0', sleeves: 'short', bolt: '#ffd23f',
      pants: '#c9a26b', pantsSh: '#a9834f', shorts: true, crop: 1, sock: '#ffffff', shoe: '#2b3a55', shoeTrim: '#f1f3f5',
    },
  };
  // 1972 disco dancers (grown-ups in flares)
  const adult = { headR: 50, neck: 14, torso: 124, sh: 46, hip: 32, ua: 66, fa: 62, thigh: 96, shin: 94, limbW: 24, legW: 30,
    outfit: 'disco', sleeves: 'shirt', flare: true, crop: 1, shoe: '#3a2a22', shoeTrim: '#caa04a' };
  KIDS.disco1 = Object.assign({}, adult, { hair: 'afro', hairC: '#24150e', hairHi: '#4a3326', irisC: '#2d1c12', skin: '#9a6444', skinSh: '#7a4b31',
    shirt: '#ff5fa2', collarC: '#ffe3f0', pants: '#f2a93b', pantsSh: '#d98e22', pattern: 'rgba(255,255,255,0.35)' });
  KIDS.disco2 = Object.assign({}, adult, { hair: 'long', hairC: '#e2b25a', hairHi: '#f5d58d', irisC: '#3b6d8a', skin: '#fbd9c4', skinSh: '#eab89f', band: '#ff4f4f',
    shirt: '#6fd3c9', collarC: '#ffffff', pants: '#6a4bc9', pantsSh: '#553aa8' });
  KIDS.disco3 = Object.assign({}, adult, { hair: 'afro', hairC: '#6b2d14', hairHi: '#93462a', irisC: '#3a2618', skin: '#e2a57c', skinSh: '#c9885e',
    shirt: '#ffd23f', collarC: '#fff9d9', pants: '#ffffff', pantsSh: '#dcdcdc', pattern: 'rgba(255,120,40,0.45)' });
  KIDS.disco4 = Object.assign({}, adult, { hair: 'long', hairC: '#2b1a12', hairHi: '#4e3326', irisC: '#2d1c12', skin: '#c68a62', skinSh: '#a86f4b', band: '#ffd23f',
    shirt: '#9b5de5', collarC: '#f3e8ff', pants: '#e94f37', pantsSh: '#c43a24' });
  RV.KIDS = KIDS;
  RV.KID_IDS = ['big', 'boy', 'little'];
  // y of the head centre above the feet (negative), for placing helmets, hats, bubbles
  RV.kidHead = (id, s = 1) => { const K = KIDS[id]; return -((K.thigh + K.shin) * 0.96 + K.torso + K.neck + K.headR * 0.92) * s; };
  RV.kidHeight = (id) => { const K = KIDS[id]; return K.thigh + K.shin + K.torso + K.neck + K.headR * 2; };

  // two-bone IK: returns knee/elbow point bending toward `bend` side (+1/-1)
  function ik(ax, ay, bx, by, l1, l2, bend) {
    const dx = bx - ax, dy = by - ay;
    let d = Math.hypot(dx, dy);
    const maxd = l1 + l2 - 0.01;
    if (d > maxd) { bx = ax + (dx / d) * maxd; by = ay + (dy / d) * maxd; d = maxd; }
    const a = Math.atan2(dy, dx);
    const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    const ang = a - bend * Math.acos(cosA);
    return [[ax, ay], [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1], [bx, by]];
  }
  RV.ik = ik;

  function curlyHairBack(ctx, r, K, t, sway) {
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const wob = Math.sin(t * 3 + i * 1.7) * 2 + sway * Math.sin(a) * 4;
      const rx = r * 1.22, ry = r * 1.18;
      let x = Math.cos(a) * rx + wob, y = Math.sin(a) * ry * 0.95 + r * 0.22;
      if (y > r * 0.9) y = r * 0.9 + (y - r * 0.9) * 0.4;
      const cr = r * (0.38 + 0.08 * RV.hash(i * 3.1));
      circle(ctx, x, y, cr);
      fs(ctx, K.hairC, 4.5);
    }
    // fill the middle so outlines don't show through
    ellipse(ctx, 0, r * 0.2, r * 1.2, r * 1.12);
    fs(ctx, K.hairC);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + 0.3;
      const x = Math.cos(a) * r * 1.2, y = Math.sin(a) * r * 1.1 + r * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.14, a + 0.4, a + 3.4);
      ctx.lineWidth = 3.5; ctx.strokeStyle = K.hairHi; ctx.lineCap = 'round'; ctx.stroke();
    }
  }
  function curlyHairFront(ctx, r, K, t) {
    const pts = [];
    for (let i = 0; i <= 9; i++) {
      const a = Math.PI + 0.12 + (i / 9) * (Math.PI - 0.24);
      pts.push([Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.9 - r * 0.02]);
    }
    pts.forEach(([x, y], i) => {
      const cr = r * (0.27 + 0.05 * RV.hash(i + 9));
      const yy = y + (i > 0 && i < 9 ? r * 0.12 : r * 0.25);
      circle(ctx, x, yy + Math.sin(t * 4 + i) * 1.2, cr);
      fs(ctx, K.hairC, 4.5);
    });
    pts.forEach(([x, y], i) => {
      if (i % 2) return;
      ctx.beginPath();
      ctx.arc(x, y + r * 0.14, r * 0.12, 0.2, 2.8);
      ctx.lineWidth = 3; ctx.strokeStyle = K.hairHi; ctx.stroke();
    });
  }
  function bobHairBack(ctx, r, K, t, sway) {
    const s = sway * 6;
    ctx.beginPath();
    ctx.moveTo(-r * 1.02, -r * 0.2);
    ctx.bezierCurveTo(-r * 1.2, -r * 1.25, r * 1.2, -r * 1.25, r * 1.02, -r * 0.2);
    ctx.bezierCurveTo(r * 1.12 + s, r * 0.45, r * 1.15 + s, r * 0.85, r * 1.2 + s, r * 1.05);
    ctx.quadraticCurveTo(r * 0.9 + s, r * 1.12, r * 0.62, r * 0.95);
    ctx.lineTo(-r * 0.62, r * 0.95);
    ctx.quadraticCurveTo(-r * 0.9 + s, r * 1.12, -r * 1.2 + s, r * 1.05);
    ctx.bezierCurveTo(-r * 1.15 + s, r * 0.85, -r * 1.12 + s, r * 0.45, -r * 1.02, -r * 0.2);
    ctx.closePath();
    fs(ctx, K.hairC, 4.5);
    ctx.beginPath();
    ctx.moveTo(r * 0.8 + s, r * 0.2); ctx.quadraticCurveTo(r * 0.95 + s, r * 0.6, r * 1.02 + s, r * 0.9);
    ctx.moveTo(-r * 0.8 + s, r * 0.2); ctx.quadraticCurveTo(-r * 0.95 + s, r * 0.6, -r * 1.02 + s, r * 0.9);
    ctx.lineWidth = 3.5; ctx.strokeStyle = K.hairHi; ctx.stroke();
  }
  function bobHairFront(ctx, r, K, t) {
    ctx.beginPath();
    ctx.moveTo(-r * 1.0, r * 0.1);
    ctx.bezierCurveTo(-r * 1.08, -r * 0.9, -r * 0.4, -r * 1.12, r * 0.2, -r * 1.06);
    ctx.bezierCurveTo(r * 0.8, -r * 1.0, r * 1.1, -r * 0.6, r * 1.0, r * 0.1);
    ctx.bezierCurveTo(r * 0.92, -r * 0.3, r * 0.75, -r * 0.45, r * 0.55, -r * 0.5);
    // side-swept fringe
    ctx.bezierCurveTo(r * 0.3, -r * 0.3, -r * 0.1, -r * 0.28, -r * 0.35, -r * 0.42);
    ctx.bezierCurveTo(-r * 0.55, -r * 0.3, -r * 0.8, -r * 0.2, -r * 1.0, r * 0.1);
    ctx.closePath();
    fs(ctx, K.hairC, 4.5);
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 0.95); ctx.quadraticCurveTo(r * 0.3, -r * 0.8, r * 0.5, -r * 0.55);
    ctx.moveTo(-r * 0.6, -r * 0.8); ctx.quadraticCurveTo(-r * 0.75, -r * 0.5, -r * 0.8, -r * 0.2);
    ctx.lineWidth = 3.5; ctx.strokeStyle = K.hairHi; ctx.lineCap = 'round'; ctx.stroke();
  }
  function tousledHair(ctx, r, K, t) {
    const tuft = Math.sin(t * 5) * 0.08;
    ctx.beginPath();
    ctx.moveTo(-r * 1.02, r * 0.02);
    ctx.bezierCurveTo(-r * 1.2, -r * 0.8, -r * 0.6, -r * 1.2, 0, -r * 1.12);
    ctx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.2, -r * 0.8, r * 1.03, r * 0.0);
    // jagged fringe right->left
    ctx.lineTo(r * 0.9, -r * 0.3);
    ctx.lineTo(r * 0.72, -r * 0.2);
    ctx.lineTo(r * 0.6, -r * 0.48);
    ctx.lineTo(r * 0.38, -r * 0.3);
    ctx.lineTo(r * 0.2, -r * 0.55);
    ctx.lineTo(-r * 0.05, -r * 0.34);
    ctx.lineTo(-r * 0.25, -r * 0.58);
    ctx.lineTo(-r * 0.45, -r * 0.36);
    ctx.lineTo(-r * 0.68, -r * 0.52);
    ctx.lineTo(-r * 0.82, -r * 0.2);
    ctx.closePath();
    fs(ctx, K.hairC, 4.5);
    // cowlick + side tufts
    ctx.save();
    ctx.translate(r * 0.15, -r * 1.08);
    ctx.rotate(tuft);
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.05);
    ctx.quadraticCurveTo(-r * 0.05, -r * 0.45, r * 0.25, -r * 0.42);
    ctx.quadraticCurveTo(r * 0.02, -r * 0.2, r * 0.18, r * 0.05);
    ctx.closePath();
    fs(ctx, K.hairC, 4.5);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.95); ctx.quadraticCurveTo(-r * 0.2, -r * 0.8, -r * 0.1, -r * 0.55);
    ctx.moveTo(r * 0.3, -r * 1.0); ctx.quadraticCurveTo(r * 0.6, -r * 0.85, r * 0.65, -r * 0.6);
    ctx.lineWidth = 3.5; ctx.strokeStyle = K.hairHi; ctx.lineCap = 'round'; ctx.stroke();
  }

  // Ben: a full, tousled light-brown mop, short at the sides (ears showing), a chunky fringe swept
  // across the forehead and dipping toward screen-left, and a few spikes sticking up on top.
  function benHair(ctx, r, K, t, p) {
    const flop = Math.sin(t * 7.3) * 0.04 + (p.hairWind || 0);
    // messy tufts on the crown, flicked the same way as the fringe (drawn first: the mop covers the roots)
    const tufts = [
      // base left x, base right x, base y, tip x, tip y, bulge
      [-0.42, 0.02, -1.08, -0.5, -1.42, 0.16],
      [-0.02, 0.36, -1.1, 0.02, -1.5, 0.14],
      [0.42, 0.74, -0.88, 0.7, -1.18, -0.1],
    ];
    tufts.forEach(([a, b, y, tx, ty, bu], i) => {
      const sw = (flop + Math.sin(t * 9 + i * 1.7) * 0.025) * (1 + i * 0.4);
      const X = (tx + sw) * r, Y = ty * r;
      ctx.beginPath();
      ctx.moveTo(a * r, y * r);
      ctx.quadraticCurveTo((a + tx) * 0.5 * r - bu * r * 0.4, (y + ty) * 0.5 * r, X, Y);
      ctx.quadraticCurveTo((b + tx) * 0.5 * r + bu * r, (y + ty) * 0.5 * r + r * 0.06, b * r, y * r);
      ctx.closePath();
      fs(ctx, K.hairC, 4.5);
      ctx.beginPath();
      ctx.moveTo((a + b) * 0.5 * r, y * r + r * 0.02);
      ctx.quadraticCurveTo((a + b + tx) / 3 * r, (y + ty) * 0.5 * r, lerp((a + b) * 0.5 * r, X, 0.75), lerp(y * r, Y, 0.75));
      ctx.lineWidth = 4; ctx.strokeStyle = K.hairHi; ctx.lineCap = 'round'; ctx.stroke();
    });
    // main mop
    ctx.beginPath();
    ctx.moveTo(-r * 1.0, r * 0.02);
    ctx.bezierCurveTo(-r * 1.16, -r * 0.72, -r * 0.74, -r * 1.22, -r * 0.05, -r * 1.2);
    ctx.bezierCurveTo(r * 0.72, -r * 1.22, r * 1.18, -r * 0.8, r * 1.03, -r * 0.08);
    // fringe edge, right -> left, sweeping lower toward screen-left
    const w = flop * r * 0.6;
    ctx.lineTo(r * 0.9, -r * 0.36);
    ctx.quadraticCurveTo(r * 0.82, -r * 0.46 + w * 0.2, r * 0.66, -r * 0.42);
    ctx.quadraticCurveTo(r * 0.56, -r * 0.55, r * 0.4, -r * 0.48 + w * 0.3);
    ctx.quadraticCurveTo(r * 0.3, -r * 0.4, r * 0.18, -r * 0.45);
    ctx.quadraticCurveTo(r * 0.04, -r * 0.34 + w * 0.3, -r * 0.14, -r * 0.33);
    ctx.quadraticCurveTo(-r * 0.3, -r * 0.3, -r * 0.44, -r * 0.2 + w * 0.4);
    ctx.quadraticCurveTo(-r * 0.58, -r * 0.12, -r * 0.72, -r * 0.17);
    ctx.quadraticCurveTo(-r * 0.88, -r * 0.06, -r * 0.95, r * 0.08);
    ctx.closePath();
    fs(ctx, K.hairC, 4.5);
    // strands: light highlights following the sweep, a couple of darker ones near the fringe
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 1.04); ctx.quadraticCurveTo(r * 0.12, -r * 0.84, -r * 0.3, -r * 0.42);
    ctx.moveTo(r * 0.88, -r * 0.74); ctx.quadraticCurveTo(r * 0.62, -r * 0.66, r * 0.42, -r * 0.6);
    ctx.moveTo(-r * 0.28, -r * 1.08); ctx.quadraticCurveTo(-r * 0.62, -r * 0.84, -r * 0.8, -r * 0.34);
    ctx.lineWidth = 4.5; ctx.strokeStyle = K.hairHi; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -r * 0.8); ctx.quadraticCurveTo(-r * 0.02, -r * 0.62, -r * 0.1, -r * 0.4);
    ctx.moveTo(-r * 0.4, -r * 0.7); ctx.quadraticCurveTo(-r * 0.52, -r * 0.5, -r * 0.56, -r * 0.24);
    ctx.lineWidth = 3.5; ctx.strokeStyle = K.hairSh || K.hairC; ctx.stroke();
  }

  function afroHair(ctx, r, K, t) {
    const bounce = Math.sin(t * 6) * 2;
    circle(ctx, 0, -r * 0.35 + bounce, r * 1.55);
    fs(ctx, K.hairC, 4.5);
    ctx.fillStyle = K.hairHi;
    for (let i = 0; i < 26; i++) {
      const a = RV.hash(i * 3.3) * TAU, d = Math.sqrt(RV.hash(i * 7.7)) * r * 1.35;
      circle(ctx, Math.cos(a) * d, -r * 0.35 + bounce + Math.sin(a) * d, 3.5); ctx.fill();
    }
  }
  function afroFront(ctx, r, K) {
    ctx.beginPath();
    ctx.moveTo(-r * 1.0, -r * 0.1);
    ctx.quadraticCurveTo(-r * 0.9, -r * 0.95, 0, -r * 0.98);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.95, r * 1.0, -r * 0.1);
    ctx.quadraticCurveTo(r * 0.6, -r * 0.62, 0, -r * 0.6);
    ctx.quadraticCurveTo(-r * 0.6, -r * 0.62, -r * 1.0, -r * 0.1);
    ctx.closePath();
    fs(ctx, K.hairC, 4.5);
  }
  function longHairBack(ctx, r, K, t, sway) {
    const s = sway * 8 + Math.sin(t * 5) * 3;
    ctx.beginPath();
    ctx.moveTo(-r * 1.0, -r * 0.3);
    ctx.bezierCurveTo(-r * 1.1, -r * 1.25, r * 1.1, -r * 1.25, r * 1.0, -r * 0.3);
    ctx.bezierCurveTo(r * 1.1 + s, r * 0.8, r * 1.15 + s, r * 1.6, r * 1.05 + s, r * 2.1);
    ctx.lineTo(-r * 1.05 + s, r * 2.1);
    ctx.bezierCurveTo(-r * 1.15 + s, r * 1.6, -r * 1.1 + s, r * 0.8, -r * 1.0, -r * 0.3);
    ctx.closePath();
    fs(ctx, K.hairC, 4.5);
  }
  function longHairFront(ctx, r, K) {
    ctx.beginPath();
    ctx.moveTo(-r * 1.02, r * 0.3);
    ctx.bezierCurveTo(-r * 1.1, -r * 1.0, -r * 0.3, -r * 1.08, 0, -r * 0.7);
    ctx.bezierCurveTo(r * 0.3, -r * 1.08, r * 1.1, -r * 1.0, r * 1.02, r * 0.3);
    ctx.bezierCurveTo(r * 0.9, -r * 0.3, r * 0.4, -r * 0.62, 0, -r * 0.62);
    ctx.bezierCurveTo(-r * 0.4, -r * 0.62, -r * 0.9, -r * 0.3, -r * 1.02, r * 0.3);
    ctx.closePath();
    fs(ctx, K.hairC, 4.5);
    if (K.band) {
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 1.0, Math.PI * 1.12, Math.PI * 1.88);
      ctx.lineWidth = 9; ctx.strokeStyle = K.band; ctx.stroke();
    }
  }

  function kidFace(ctx, r, K, p) {
    const SKIN = K.skin || SKIN0;
    const tu = clamp(p.turn || 0, -1, 1);
    const fx = tu * r * 0.22;
    const lw = 4;
    // ears (the boys show them; the girls' hair hides them)
    if (K.hair === 'tousled' || K.ears) {
      [-1, 1].forEach((s) => {
        ellipse(ctx, s * r * 0.98 + fx * 0.3, r * 0.08, r * 0.18, r * 0.24);
        fs(ctx, SKIN, lw);
        if (K.ears) {
          ctx.beginPath(); ctx.arc(s * r * 0.99 + fx * 0.3, r * 0.08, r * 0.09, s > 0 ? -1.2 : Math.PI - 1.9, s > 0 ? 1.9 : Math.PI + 1.2);
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(200,120,100,0.7)'; ctx.stroke();
        }
      });
    }
    // head (K.cheek fills out the lower face)
    const ck = K.cheek || 0;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.62, -r, r * 1.02, -r * 0.62, r * 1.0, -r * 0.02);
    ctx.bezierCurveTo(r * (0.98 + ck), r * (0.6 + ck), r * (0.6 + ck), r * 0.96, 0, r * 0.98);
    ctx.bezierCurveTo(-r * (0.6 + ck), r * 0.96, -r * (0.98 + ck), r * (0.6 + ck), -r * 1.0, -r * 0.02);
    ctx.bezierCurveTo(-r * 1.02, -r * 0.62, -r * 0.62, -r, 0, -r);
    ctx.closePath();
    fs(ctx, SKIN, lw);
    // soft shade on one side
    ctx.save();
    ctx.clip();
    ellipse(ctx, r * 0.95, r * 0.35, r * 0.5, r * 0.9);
    ctx.fillStyle = 'rgba(214,140,110,0.22)';
    ctx.fill();
    // gloom lines (the colour drains out of a horrified face)
    const gloom = clamp(p.gloom || 0);
    if (gloom > 0) {
      const g = ctx.createLinearGradient(0, -r, 0, r * 0.1);
      g.addColorStop(0, `rgba(96,86,190,${0.55 * gloom})`); g.addColorStop(1, 'rgba(96,86,190,0)');
      ctx.fillStyle = g; ctx.fillRect(-r * 1.1, -r * 1.1, r * 2.2, r * 1.2);
      ctx.strokeStyle = `rgba(60,50,150,${0.7 * gloom})`; ctx.lineWidth = 3.5;
      for (let i = 0; i < 7; i++) {
        const gx = (i - 3) * r * 0.18;
        ctx.beginPath(); ctx.moveTo(gx, -r * 0.95); ctx.lineTo(gx, -r * (0.95 - 0.5 * gloom * (0.6 + 0.4 * RV.hash(i)))); ctx.stroke();
      }
    }
    // soot smudges (after Ben's crash landing)
    const soot = clamp(p.soot || 0);
    if (soot > 0) {
      ctx.fillStyle = `rgba(70,58,58,${0.42 * soot})`;
      for (let i = 0; i < 6; i++) {
        ellipse(ctx, (RV.hash(i * 3.7) - 0.5) * r * 1.5, (RV.hash(i * 5.3) - 0.35) * r * 1.3, r * (0.14 + 0.12 * RV.hash(i)), r * (0.09 + 0.08 * RV.hash(i * 2)), i);
        ctx.fill();
      }
    }
    ctx.restore();
    // blush
    const blush = p.blush == null ? (K.blush == null ? 0.35 : K.blush) : p.blush;
    const bR = K.blushR || 1;
    [-1, 1].forEach((s) => {
      ellipse(ctx, s * r * 0.56 + fx, r * 0.38, r * 0.17 * bR, r * 0.1 * bR);
      if (bR > 1) {
        const g = ctx.createRadialGradient(s * r * 0.56 + fx, r * 0.38, 0, s * r * 0.56 + fx, r * 0.38, r * 0.17 * bR);
        g.addColorStop(0, `rgba(236,84,92,${blush})`); g.addColorStop(0.6, `rgba(240,100,105,${blush * 0.75})`); g.addColorStop(1, 'rgba(242,120,120,0)');
        ctx.fillStyle = g;
      } else ctx.fillStyle = `rgba(242,120,120,${blush})`;
      ctx.fill();
    });
    // eyes
    const ey = r * 0.06, ex = r * 0.37;
    [-1, 1].forEach((s) => eye(ctx, s * ex + fx, ey, r * 0.17, r * 0.21, {
      eyes: p.eyes, blink: p.blink, look: p.look, irisC: K.irisC, lw: 3.8, lid: p.lid, skin: SKIN, side: s, t: p.t,
    }));
    // brows (browL / browR raise one brow for the sceptical look)
    const br = p.brow || 0; // +up / -down
    const ang = p.browAng || 0; // + worried, - angry
    [-1, 1].forEach((s) => {
      const one = s < 0 ? (p.browL || 0) : (p.browR || 0);
      ctx.save();
      ctx.translate(s * ex + fx, ey - r * 0.36 - (br + one) * r * 0.12);
      ctx.rotate(s * ang * 0.5 - s * one * 0.18);
      ctx.beginPath();
      ctx.moveTo(-r * 0.13, r * 0.02); ctx.quadraticCurveTo(0, -r * 0.06, r * 0.13, r * 0.02);
      ctx.lineWidth = 5.5; ctx.strokeStyle = K.hairC; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    });
    // nose
    ctx.beginPath();
    ctx.moveTo(fx * 1.2 - r * 0.05, r * 0.3); ctx.quadraticCurveTo(fx * 1.2, r * 0.36, fx * 1.2 + r * 0.06, r * 0.3);
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#c8876e'; ctx.lineCap = 'round'; ctx.stroke();
    // mouth
    mouth(ctx, fx * 1.1, r * 0.55, r * 0.46, p, 4);
    // nervous sweat drop by the temple
    const sw = clamp(p.sweat || 0);
    if (sw > 0) {
      const side = p.sweatSide || 1;
      const sx = side * r * 0.86, sy = -r * 0.3 + Math.sin((p.t || 0) * 5) * r * 0.03;
      const s = r * 0.16 * sw;
      ctx.beginPath();
      ctx.moveTo(sx, sy - s * 1.6);
      ctx.quadraticCurveTo(sx + s * 1.05, sy + s * 0.1, sx, sy + s);
      ctx.quadraticCurveTo(sx - s * 1.05, sy + s * 0.1, sx, sy - s * 1.6);
      fs(ctx, '#a9ddff', 3.2);
      ellipse(ctx, sx - s * 0.3, sy + s * 0.1, s * 0.18, s * 0.32); ctx.fillStyle = '#ffffff'; ctx.fill();
    }
  }
  RV.kidFace = kidFace;

  // Wide-leg cropped trousers (the big sister's cream culottes): one shape per leg running
  // hip -> knee -> mid-calf so it bends with the leg, tucked up under the top and flaring at the hem.
  function culottes(ctx, h, k, f, K, pw, lw) {
    const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    const d1 = unit(k[0] - h[0], k[1] - h[1]);           // thigh direction
    const d2 = unit(f[0] - k[0], f[1] - k[1]);           // shin direction
    const n1 = [-d1[1], d1[0]], n2 = [-d2[1], d2[0]];
    const nk = unit(n1[0] + n2[0], n1[1] + n2[1]);        // knee normal (mitred)
    const miter = 1 / Math.max(0.65, nk[0] * n1[0] + nk[1] * n1[1]);
    const hemT = Math.min(0.6, 1.07 - K.crop);          // how far down the shin the hem sits
    const c = [lerp(k[0], f[0], hemT), lerp(k[1], f[1], hemT)];
    const top = [h[0] - d1[0] * 16, h[1] - d1[1] * 16]; // reaches up under the cardigan
    const wT = pw * 0.7, wK = pw * 0.74 * miter, wC = pw * 0.98;
    const off = (p, n, w) => [p[0] + n[0] * w, p[1] + n[1] * w];
    const a1 = off(top, n1, wT), a2 = off(k, nk, wK), a3 = off(c, n2, wC);
    const b1 = off(top, n1, -wT), b2 = off(k, nk, -wK), b3 = off(c, n2, -wC);
    // straight fabric panels with a rounded bend at the knee; the rounding is capped so it
    // never runs past either panel (an oversized corner doubles the outline back on itself)
    const corner = (p0, p1, p2, r) => {
      const u = unit(p0[0] - p1[0], p0[1] - p1[1]), v = unit(p2[0] - p1[0], p2[1] - p1[1]);
      const theta = Math.acos(clamp(u[0] * v[0] + u[1] * v[1], -1, 1));
      if (theta > Math.PI - 0.02) { ctx.lineTo(p1[0], p1[1]); return; }
      const half = Math.tan(theta / 2);
      const room = 0.45 * Math.min(Math.hypot(p0[0] - p1[0], p0[1] - p1[1]), Math.hypot(p2[0] - p1[0], p2[1] - p1[1]));
      ctx.arcTo(p1[0], p1[1], p2[0], p2[1], Math.min(r, room * half));
    };
    const hem = [c[0] + d2[0] * 7, c[1] + d2[1] * 7];
    const r = pw * 0.9;
    // the knee pushes the fabric out on one side (convex, rounded); the inner seam hangs straight
    const lx = f[0] - h[0], ly = f[1] - h[1];
    const aOuter = (k[0] - h[0]) * -ly + (k[1] - h[1]) * lx >= 0;
    ctx.beginPath();
    ctx.moveTo(a1[0], a1[1]);
    if (aOuter) corner(a1, a2, a3, r);
    ctx.lineTo(a3[0], a3[1]);
    ctx.quadraticCurveTo(hem[0], hem[1], b3[0], b3[1]);
    if (!aOuter) corner(b3, b2, b1, r);
    ctx.lineTo(b1[0], b1[1]);
    ctx.closePath();
    fs(ctx, K.pants, lw);
    // soft fold from the knee to the hem
    const fk = off(k, nk, wK * 0.18), fc = off(c, n2, wC * 0.3);
    ctx.beginPath();
    ctx.moveTo(fk[0], fk[1]);
    ctx.quadraticCurveTo((fk[0] + fc[0]) / 2 + n2[0] * 4, (fk[1] + fc[1]) / 2 + n2[1] * 4, fc[0], fc[1]);
    ctx.lineWidth = 2.6; ctx.strokeStyle = K.pantsSh; ctx.lineCap = 'round'; ctx.stroke();
  }

  // One leg of a pair of shorts: a straight panel from under the t-shirt to just above the knee,
  // slightly flared at the hem.
  function shortsLeg(ctx, h, k, K, pw, lw) {
    const dx = k[0] - h[0], dy = k[1] - h[1], l = Math.hypot(dx, dy) || 1;
    const d = [dx / l, dy / l], n = [-d[1], d[0]];
    const top = [h[0] - d[0] * 20, h[1] - d[1] * 20];
    const hem = [lerp(h[0], k[0], 0.76), lerp(h[1], k[1], 0.76)];
    const wT = pw * 0.68, wH = pw * 0.78;
    ctx.beginPath();
    ctx.moveTo(top[0] + n[0] * wT, top[1] + n[1] * wT);
    ctx.lineTo(hem[0] + n[0] * wH, hem[1] + n[1] * wH);
    ctx.quadraticCurveTo(hem[0] + d[0] * 7, hem[1] + d[1] * 7, hem[0] - n[0] * wH, hem[1] - n[1] * wH);
    ctx.lineTo(top[0] - n[0] * wT, top[1] - n[1] * wT);
    ctx.closePath();
    fs(ctx, K.pants, lw);
    // turned-up hem
    const hy = [hem[0] - d[0] * 12, hem[1] - d[1] * 12];
    ctx.beginPath();
    ctx.moveTo(hy[0] + n[0] * wH * 0.96, hy[1] + n[1] * wH * 0.96);
    ctx.quadraticCurveTo(hy[0] + d[0] * 6, hy[1] + d[1] * 6, hy[0] - n[0] * wH * 0.96, hy[1] - n[1] * wH * 0.96);
    ctx.lineWidth = 3; ctx.strokeStyle = K.pantsSh; ctx.stroke();
  }

  function shoe(ctx, x, y, K, side, lw) {
    ctx.save();
    ctx.translate(x, y);
    if (K.crocs) {
      ellipse(ctx, side * 8, -9, 26, 15);
      fs(ctx, K.shoe, lw);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 3; i++) { circle(ctx, side * (2 + i * 9), -14, 2.6); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-side * 14, -16); ctx.quadraticCurveTo(-side * 18, -2, -side * 6, 2);
      ctx.lineWidth = 6; ctx.strokeStyle = K.shoeTrim; ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-side * 16, -2);
      ctx.quadraticCurveTo(-side * 18, -24, side * 2, -22);
      ctx.quadraticCurveTo(side * 30, -18, side * 32, -4);
      ctx.lineTo(side * 30, 2);
      ctx.lineTo(-side * 16, 2);
      ctx.closePath();
      fs(ctx, K.shoe, lw);
      ctx.beginPath(); ctx.moveTo(-side * 16, -2); ctx.lineTo(side * 31, -2);
      ctx.lineWidth = 5; ctx.strokeStyle = K.shoeTrim; ctx.stroke();
    }
    ctx.restore();
  }

  /* drawKid(ctx, id, pose)
   * pose: x, y (feet), s (scale), face (1/-1), lean, bob (hip drop px), jump (px up),
   *   armL/armR: [shoulderAngle, elbowAngle] (0 = down, +ve = outward/up), handL/handR: [x,y] IK targets (local),
   *   footL/footR: [dx, lift], headTilt, turn (-1..1), eyes, mouth, open, brow, browAng, look, blink, t, sway
   *   back(ctx, frame) / waist(ctx, frame): costume layers behind the body / over the body under the arms
   * Left/right are screen sides.
   */
  RV.drawKid = function (ctx, id, p) {
    const K = typeof id === 'string' ? KIDS[id] : id;
    const SKIN = K.skin || SKIN0, SKIN_SH = K.skinSh || SKIN_SH0;
    const t = p.t || 0;
    const lw = 4.5;
    ctx.save();
    ctx.translate(p.x || 0, (p.y || 0) - (p.jump || 0));
    const s = p.s || 1;
    ctx.scale(s * (p.face || 1), s * (p.squash || 1));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    const legLen = K.thigh + K.shin;
    const hipY = -legLen * 0.96 + (p.bob || 0);
    const lean = p.lean || 0;
    const hipX = p.hipX || 0;
    const r = K.headR;

    // skeleton (upper body rotates by lean around the hip centre)
    const rot = (x, y) => {
      const c = Math.cos(lean), sn = Math.sin(lean);
      return [hipX + x * c - y * sn, hipY + x * sn + y * c];
    };
    const shoulderY = -K.torso;
    const neckP = rot(0, shoulderY - K.neck * 0.3);
    const headC = rot(0, shoulderY - K.neck - r * 0.92);

    // ---- back hair (attached to head transform)
    const headTilt = p.headTilt || 0;
    const sway = p.sway || 0;
    function headSpace(fn) {
      ctx.save();
      ctx.translate(neckP[0], neckP[1]);
      ctx.rotate(lean + headTilt);
      ctx.translate(headC[0] - neckP[0], headC[1] - neckP[1]);
      fn();
      ctx.restore();
    }
    // note: headC already includes lean rotation; compensate so tilt pivots at the neck
    function headSpace2(fn) {
      ctx.save();
      ctx.translate(neckP[0], neckP[1]);
      ctx.rotate(headTilt + lean);
      ctx.translate(0, -K.neck * 0.7 - r * 0.92);
      fn();
      ctx.restore();
    }
    void headSpace;
    // p.back(ctx, frame): drawn behind everything in the hip frame (y = 0 at the hips; fairy wings)
    if (p.back) { ctx.save(); ctx.translate(hipX, hipY); ctx.rotate(lean); p.back(ctx, { top: -K.torso, sw: K.sh, hw: K.hip, t }); ctx.restore(); }
    if (K.hair === 'curly') headSpace2(() => curlyHairBack(ctx, r, K, t, sway));
    if (K.hair === 'bob') headSpace2(() => bobHairBack(ctx, r, K, t, sway));
    if (K.hair === 'afro') headSpace2(() => afroHair(ctx, r, K, t));
    if (K.hair === 'long') headSpace2(() => longHairBack(ctx, r, K, t, sway));

    // ---- legs (IK, knees bend outward)
    const fl = p.footL || [0, 0], fr = p.footR || [0, 0];
    const footSpread = K.hip * 0.95;
    const legs = [
      { side: -1, hip: [hipX - K.hip * 0.55, hipY], foot: [-footSpread + fl[0], -fl[1]] },
      { side: 1, hip: [hipX + K.hip * 0.55, hipY], foot: [footSpread + fr[0], -fr[1]] },
    ];
    legs.forEach((L) => {
      const ch = ik(L.hip[0], L.hip[1], L.foot[0], L.foot[1] - 6, K.thigh, K.shin, L.side > 0 ? 1 : -1);
      L.chain = ch;
    });
    legs.forEach((L) => {
      const [h, k, f] = L.chain;
      const pw = K.legW;
      if (K.shorts) {
        // bare legs + knee, white socks, then shorts that stop just above the knee
        limb(ctx, [h, k, f], pw * 0.64, SKIN, lw);
        ctx.beginPath(); ctx.arc(k[0], k[1] + 4, pw * 0.16, 0.2, Math.PI - 0.2);
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(200,120,100,0.55)'; ctx.stroke();
        limb(ctx, [[lerp(k[0], f[0], 0.72), lerp(k[1], f[1], 0.72)], f], pw * 0.7, K.sock, lw);
        shortsLeg(ctx, h, k, K, pw, lw);
      } else if (K.crop < 1) {
        // bare calf + sock, then wide cropped trousers that follow the bent leg
        limb(ctx, [k, f], pw * 0.56, SKIN, lw);
        limb(ctx, [[lerp(k[0], f[0], 0.72), lerp(k[1], f[1], 0.72)], f], pw * 0.6, K.sock, lw);
        culottes(ctx, h, k, f, K, pw, lw);
      } else if (K.flare) {
        limb(ctx, [h, k, f], pw, K.pants, lw);
        const ang = Math.atan2(f[1] - k[1], f[0] - k[0]) - Math.PI / 2;
        ctx.save();
        ctx.translate(f[0], f[1]);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(-pw * 0.5, -46); ctx.lineTo(pw * 0.5, -46); ctx.lineTo(pw * 1.05, 2); ctx.lineTo(-pw * 1.05, 2);
        ctx.closePath();
        fs(ctx, K.pants, lw);
        ctx.restore();
      } else {
        limb(ctx, [h, k, f], pw, K.pants, lw);
        if (K.stripe) {
          ctx.beginPath();
          ctx.moveTo(h[0] + L.side * pw * 0.32, h[1]);
          ctx.quadraticCurveTo(k[0] + L.side * pw * 0.36, k[1], f[0] + L.side * pw * 0.32, f[1] - 4);
          ctx.lineWidth = 4; ctx.strokeStyle = K.stripe; ctx.stroke();
        }
        if (K.ribs) {
          // moto-jean ribbing at the knee
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(k[0] - pw * 0.35, k[1] + i * 7);
            ctx.lineTo(k[0] + pw * 0.35, k[1] + i * 7);
            ctx.lineWidth = 2.2; ctx.strokeStyle = K.pantsSh; ctx.stroke();
          }
        }
      }
      shoe(ctx, f[0], f[1] + 6, K, L.side, lw);
    });

    // ---- torso
    const sw = K.sh, hw = K.hip;
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(lean);
    const top = shoulderY;
    const torsoPath = () => {
      ctx.beginPath();
      ctx.moveTo(-sw, top + 10);
      ctx.quadraticCurveTo(-sw, top, -sw + 12, top);
      ctx.lineTo(sw - 12, top);
      ctx.quadraticCurveTo(sw, top, sw, top + 10);
      if (K.belly) {
        // rounder tummy under the t-shirt
        ctx.quadraticCurveTo(sw + K.belly, top + K.torso * 0.66, hw + 6, 8);
        ctx.quadraticCurveTo(0, 16, -hw - 6, 8);
        ctx.quadraticCurveTo(-sw - K.belly, top + K.torso * 0.66, -sw, top + 10);
      } else {
        ctx.lineTo(hw + 6, 6);
        ctx.quadraticCurveTo(0, 12, -hw - 6, 6);
      }
      ctx.closePath();
    };
    torsoPath();
    fs(ctx, K.shirt, lw);
    if (K.outfit === 'bentee') {
      // Ben's t-shirt: shading, crew neck and a lightning bolt
      ctx.save(); torsoPath(); ctx.clip();
      ctx.fillStyle = K.shirtSh; ctx.globalAlpha = 0.55;
      ellipse(ctx, sw * 0.95, top + K.torso * 0.55, sw * 0.42, K.torso * 0.75); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.fillStyle = K.shirtHi;
      ellipse(ctx, -sw * 0.55, top + K.torso * 0.25, sw * 0.25, K.torso * 0.22); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(-20, top + 1); ctx.quadraticCurveTo(0, top + 18, 20, top + 1);
      ctx.lineWidth = 7; ctx.strokeStyle = K.shirtSh; ctx.stroke();
      const by = top + K.torso * 0.47, bs = K.torso * 0.0115;
      ctx.beginPath();
      [[4, -27], [-15, 3], [-1, 3], [-7, 27], [15, -5], [1, -5], [9, -27]].forEach(([x, y], i) => {
        if (i) ctx.lineTo(x * bs * 1.1, by + y * bs); else ctx.moveTo(x * bs * 1.1, by + y * bs);
      });
      ctx.closePath();
      fs(ctx, K.bolt, 3.5);
      ctx.beginPath(); ctx.moveTo(-hw - 2, 0); ctx.quadraticCurveTo(0, 8, hw + 2, 0);
      ctx.lineWidth = 3; ctx.strokeStyle = K.shirtSh; ctx.stroke();
    } else if (K.outfit === 'cardigan') {
      // cockatoo tee graphic
      const gy = top + K.torso * 0.42;
      ellipse(ctx, 0, gy, 13, 17, 0.2); fs(ctx, '#fffaf0', 2.5);
      circle(ctx, 3, gy - 18, 8); fs(ctx, '#fffaf0', 2.5);
      ctx.beginPath(); ctx.moveTo(0, gy - 25); ctx.lineTo(-6, gy - 38); ctx.lineTo(3, gy - 27); ctx.lineTo(4, gy - 40); ctx.lineTo(8, gy - 26);
      ctx.fillStyle = '#f7cf45'; ctx.fill();
      circle(ctx, 6, gy - 19, 1.8); fs(ctx, '#222');
      [[-16, gy - 6, '#ef6f7c'], [15, gy + 8, '#f59ab0'], [-12, gy + 16, '#ef6f7c']].forEach(([x, y, c]) => {
        for (let k = 0; k < 5; k++) { circle(ctx, x + Math.cos(k * 1.26) * 4, y + Math.sin(k * 1.26) * 4, 3.3); fs(ctx, c); }
      });
      // fluffy cardigan panels
      [-1, 1].forEach((sd) => {
        ctx.beginPath();
        ctx.moveTo(sd * (sw + 1), top + 8);
        ctx.quadraticCurveTo(sd * sw, top - 2, sd * (sw - 14), top - 1);
        ctx.lineTo(sd * 22, top + 2);
        ctx.quadraticCurveTo(sd * 19, top + K.torso * 0.5, sd * 27, 8);
        ctx.lineTo(sd * (hw + 8), 7);
        ctx.closePath();
        fs(ctx, K.coat, lw);
        // fuzzy loops texture
        ctx.save();
        ctx.clip();
        ctx.fillStyle = K.coatHi;
        for (let i = 0; i < 26; i++) {
          const rx = sd * (16 + RV.hash(i * 7.3) * (sw - 10));
          const ry = top + 4 + RV.hash(i * 3.9 + 1) * (K.torso - 4);
          circle(ctx, rx, ry, 3.2); ctx.fill();
        }
        ctx.restore();
      });
    } else if (K.outfit === 'varsity') {
      // tee graphic
      circle(ctx, 0, top + K.torso * 0.38, 9); fs(ctx, '#e8e8ee');
      // varsity jacket panels
      [-1, 1].forEach((sd) => {
        ctx.beginPath();
        ctx.moveTo(sd * (sw + 1), top + 8);
        ctx.quadraticCurveTo(sd * sw, top - 2, sd * (sw - 12), top - 1);
        ctx.lineTo(sd * 13, top + 2);
        ctx.lineTo(sd * 13, 6);
        ctx.lineTo(sd * (hw + 8), 7);
        ctx.closePath();
        fs(ctx, K.coat, lw);
        for (let b = 0; b < 3; b++) { circle(ctx, sd * 19, top + 24 + b * 24, 3.4); fs(ctx, '#e9e9ef'); }
      });
      // striped hem + collar
      RV.rrect(ctx, -hw - 9, -6, (hw + 9) * 2, 14, 6); fs(ctx, K.coatSh, lw);
      ctx.beginPath(); ctx.moveTo(-hw - 6, 0); ctx.lineTo(hw + 6, 0); ctx.lineWidth = 3; ctx.strokeStyle = K.trim; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-sw + 10, top + 2); ctx.quadraticCurveTo(0, top + 22, sw - 10, top + 2);
      ctx.lineWidth = 7; ctx.strokeStyle = K.coatSh; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = K.trim; ctx.stroke();
    } else if (K.outfit === 'disco') {
      // big pointy 70s collar + open neck + medallion
      [-1, 1].forEach((sd) => {
        ctx.beginPath();
        ctx.moveTo(sd * 4, top + 2); ctx.lineTo(sd * (sw - 4), top + 2); ctx.lineTo(sd * 12, top + 44);
        ctx.closePath();
        fs(ctx, K.collarC || '#fff4d6', 3.5);
      });
      ctx.beginPath(); ctx.moveTo(-8, top + 2); ctx.lineTo(0, top + 30); ctx.lineTo(8, top + 2); ctx.closePath();
      fs(ctx, SKIN, 3);
      circle(ctx, 0, top + 40, 7); fs(ctx, '#ffd23f', 3);
      if (K.pattern) {
        ctx.save(); torsoPath(); ctx.clip();
        ctx.fillStyle = K.pattern;
        for (let i = 0; i < 14; i++) { circle(ctx, -sw + RV.hash(i * 5.1) * sw * 2, top + RV.hash(i * 2.7) * K.torso, 5); ctx.fill(); }
        ctx.restore();
      }
    } else {
      // little sister: simple tee with a gold star
      RV.star(ctx, 0, top + K.torso * 0.42, 11, 5, 5);
      fs(ctx, '#e8b64c', 2.5, '#b8862e');
      ctx.beginPath(); ctx.moveTo(-hw - 5, 2); ctx.quadraticCurveTo(0, 8, hw + 5, 2);
      ctx.lineWidth = 3; ctx.strokeStyle = K.shirtSh; ctx.stroke();
    }
    // neck
    RV.rrect(ctx, -9, top - K.neck - 4, 18, K.neck + 10, 6); fs(ctx, SKIN_SH);
    // p.waist(ctx, frame): over the body, under the arms and head, in the hip frame (a tutu)
    if (p.waist) p.waist(ctx, { top, sw, hw, t });
    ctx.restore();

    // ---- arms
    // Chains first, then each arm is drawn behind or in front of the head: an arm whose raised part
    // crosses the face or front hair goes in front (otherwise it would vanish behind the head).
    // p.armsFront ('L', 'R', 'LR' or '') overrides the automatic choice.
    const arms = [
      { side: -1, a: p.armL || [0.3, 0.15], target: p.handL },
      { side: 1, a: p.armR || [0.3, 0.15], target: p.handR },
    ];
    arms.forEach((A) => {
      const sp = rot(A.side * (sw - 6), shoulderY + 10);
      if (A.target) {
        A.chain = ik(sp[0], sp[1], A.target[0], A.target[1], K.ua, K.fa, A.side > 0 ? -1 : 1);
      } else {
        const a1 = A.a[0], a2 = A.a[1] || 0;
        const ang1 = lean + A.side * a1;
        const ang2 = ang1 + A.side * a2;
        const e = [sp[0] + Math.sin(ang1) * K.ua, sp[1] + Math.cos(ang1) * K.ua];
        const h = [e[0] + Math.sin(ang2) * K.fa, e[1] + Math.cos(ang2) * K.fa];
        A.chain = [sp, e, h];
      }
    });
    const hTh = headTilt + lean, hD = K.neck * 0.7 + r * 0.92;
    const hc = [neckP[0] + Math.sin(hTh) * hD, neckP[1] - Math.cos(hTh) * hD];
    const hrx = r * (K.hair === 'curly' ? 1.28 : K.hair === 'afro' ? 1.5 : 1.16), hry = r * 1.2;
    const overHead = (A) => {
      const [sP, eP, hP] = A.chain;
      const m = K.limbW * 0.4;
      for (let i = 2; i <= 10; i++) {
        const u = i / 10;
        const q = u < 0.5 ? [lerp(sP[0], eP[0], u * 2), lerp(sP[1], eP[1], u * 2)] : [lerp(eP[0], hP[0], u * 2 - 1), lerp(eP[1], hP[1], u * 2 - 1)];
        if (q[1] > sP[1] - 8) continue; // only the part of the arm raised above the shoulder
        const dx = (q[0] - hc[0]) / (hrx + m), dy = (q[1] - hc[1]) / (hry + m);
        if (dx * dx + dy * dy < 1) return true;
      }
      return false;
    };
    arms.forEach((A) => {
      A.front = p.armsFront != null ? p.armsFront.includes(A.side < 0 ? 'L' : 'R') : overHead(A);
    });
    function drawArm(A) {
      const [sP, eP, hP] = A.chain;
      if (K.sleeves === 'short') {
        limb(ctx, [sP, eP, hP], K.limbW * 0.72, SKIN, lw);
        const mx = lerp(sP[0], eP[0], 0.55), my = lerp(sP[1], eP[1], 0.55);
        limb(ctx, [sP, [mx, my]], K.limbW * 1.05, K.shirt, lw);
      } else {
        const col = K.sleeves === 'varsity' ? K.sleeveC : K.sleeves === 'shirt' ? K.shirt : K.coat;
        limb(ctx, [sP, eP, hP], K.limbW, col, lw);
        if (K.sleeves === 'shirt') {
          // flared cuffs
          ctx.save(); ctx.translate(hP[0], hP[1]); ctx.rotate(Math.atan2(hP[1] - eP[1], hP[0] - eP[0]) - Math.PI / 2);
          ctx.beginPath(); ctx.moveTo(-K.limbW * 0.5, -22); ctx.lineTo(K.limbW * 0.5, -22); ctx.lineTo(K.limbW * 0.85, -6); ctx.lineTo(-K.limbW * 0.85, -6); ctx.closePath();
          fs(ctx, K.shirt, lw); ctx.restore();
        } else if (K.sleeves === 'coat') {
          // fluffy dots on sleeves
          ctx.fillStyle = K.coatHi;
          for (let i = 1; i < 6; i++) {
            const tt = i / 6;
            const q = tt < 0.5 ? [lerp(sP[0], eP[0], tt * 2), lerp(sP[1], eP[1], tt * 2)] : [lerp(eP[0], hP[0], tt * 2 - 1), lerp(eP[1], hP[1], tt * 2 - 1)];
            circle(ctx, q[0] + (RV.hash(i) - 0.5) * 8, q[1], 3); ctx.fill();
          }
        }
        // cuff
        const cx = lerp(eP[0], hP[0], 0.82), cy = lerp(eP[1], hP[1], 0.82);
        if (K.sleeves !== 'shirt')
        limb(ctx, [[cx, cy], [lerp(eP[0], hP[0], 0.9), lerp(eP[1], hP[1], 0.9)]], K.limbW * 1.02,
          K.sleeves === 'varsity' ? K.coat : K.coatSh, 3);
        if (K.sleeves === 'varsity') {
          limb(ctx, [[cx, cy], [lerp(eP[0], hP[0], 0.9), lerp(eP[1], hP[1], 0.9)]], 3, K.trim, 0);
        }
      }
      const hs = A.side < 0 ? p.handL_shape : p.handR_shape;
      if (hs) hand(ctx, eP, hP, K.limbW, hs, SKIN, lw);
      circle(ctx, hP[0], hP[1], K.limbW * 0.52);
      fs(ctx, SKIN, lw);
      if (hs === 'open') handFingers(ctx, eP, hP, K.limbW, SKIN, lw);
    }
    arms.forEach((A) => { if (!A.front) drawArm(A); });

    // ---- head
    headSpace2(() => {
      kidFace(ctx, r, K, p);
      frontHair(ctx, r, K, t, p);
      if (p.hat) p.hat(ctx, r);
    });
    arms.forEach((A) => { if (A.front) drawArm(A); });
    // held props go on top of everything (a cone held up by the face must not slip behind the hair)
    arms.forEach((A) => { const hold = A.side < 0 ? p.holdL : p.holdR; if (hold) hold(ctx, A.chain[2]); });
    ctx.restore();
    return { arms, legs };
  };

  function frontHair(ctx, r, K, t, p) {
    if (K.hair === 'curly') curlyHairFront(ctx, r, K, t);
    else if (K.hair === 'bob') bobHairFront(ctx, r, K, t);
    else if (K.hair === 'tousled') tousledHair(ctx, r, K, t);
    else if (K.hair === 'afro') afroFront(ctx, r, K);
    else if (K.hair === 'long') longHairFront(ctx, r, K);
    else if (K.hair === 'ben') benHair(ctx, r, K, t, p);
  }

  // hand shapes beyond the plain round fist: 'point' (index finger along the forearm)
  function hand(ctx, e, h, w, shape, SKIN, lw) {
    if (shape !== 'point') return;
    const a = Math.atan2(h[1] - e[1], h[0] - e[0]);
    ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(a);
    RV.rrect(ctx, 0, -w * 0.17, w * 1.05, w * 0.34, w * 0.17);
    fs(ctx, SKIN, lw);
    ctx.restore();
  }
  // spread fingers for jazz hands / a shrug
  function handFingers(ctx, e, h, w, SKIN, lw) {
    const a = Math.atan2(h[1] - e[1], h[0] - e[0]);
    ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(a);
    [-0.7, -0.25, 0.2, 0.62].forEach((k, i) => {
      ctx.save(); ctx.rotate(k * 0.9);
      RV.rrect(ctx, w * 0.25, -w * 0.12, w * (i === 0 ? 0.5 : 0.62), w * 0.24, w * 0.12);
      fs(ctx, SKIN, lw * 0.7);
      ctx.restore();
    });
    circle(ctx, 0, 0, w * 0.45); fs(ctx, SKIN);
    ctx.restore();
  }

  /* Just a kid's head (for close-ups, panels and inserts), centred on the head, radius = headR * s.
   * Takes the same face fields as drawKid (eyes, mouth, open, brow, lid, gloom, sweat, look, turn...). */
  RV.drawKidHead = function (ctx, id, p) {
    const K = typeof id === 'string' ? KIDS[id] : id;
    const t = p.t || 0, r = K.headR;
    ctx.save();
    ctx.translate(p.x || 0, p.y || 0);
    ctx.rotate(p.headTilt || 0);
    ctx.scale((p.s || 1) * (p.face || 1), p.s || 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sway = p.sway || 0;
    if (K.hair === 'curly') curlyHairBack(ctx, r, K, t, sway);
    if (K.hair === 'bob') bobHairBack(ctx, r, K, t, sway);
    if (K.hair === 'afro') afroHair(ctx, r, K, t);
    if (K.hair === 'long') longHairBack(ctx, r, K, t, sway);
    if (p.neck !== false) {
      // a bit of neck + collar so the head doesn't float
      RV.rrect(ctx, -r * 0.3, r * 0.7, r * 0.6, r * 0.6, r * 0.12); fs(ctx, K.skinSh || SKIN_SH0, 4);
      ctx.beginPath(); ctx.moveTo(-r * 0.95, r * 1.45); ctx.quadraticCurveTo(-r * 0.8, r * 1.05, -r * 0.3, r * 1.08);
      ctx.lineTo(r * 0.3, r * 1.08); ctx.quadraticCurveTo(r * 0.8, r * 1.05, r * 0.95, r * 1.45); ctx.closePath();
      fs(ctx, K.outfit === 'cardigan' || K.outfit === 'varsity' ? K.coat : K.shirt, 4);
    }
    kidFace(ctx, r, K, p);
    frontHair(ctx, r, K, t, p);
    if (p.hat) p.hat(ctx, r);
    ctx.restore();
  };

  // ================================================================ Rusty
  const FUR = '#d98f4b', FUR_SH = '#b96f36', FUR_HI = '#f0bb7c', MUZ = '#72564c', MUZ_D = '#4a3833';
  const EAR = '#b0652f', EAR_IN = '#e8a282';
  RV.RUSTY = { FUR, FUR_SH, FUR_HI, MUZ, EAR };

  function rustyEar(ctx, side, flop, flip, lw) {
    ctx.save();
    ctx.translate(side * 50, -44);
    ctx.rotate(side * (flop || 0));
    ctx.beginPath();
    if (flip) {
      // flipped-up ear showing the pale inside (like the photo!)
      ctx.moveTo(-side * 8, 4);
      ctx.bezierCurveTo(side * 10, -26, side * 46, -34, side * 62, -12);
      ctx.bezierCurveTo(side * 60, 6, side * 40, 14, side * 26, 16);
      ctx.closePath();
      fs(ctx, EAR_IN, lw);
      ctx.beginPath();
      ctx.moveTo(side * 58, -12); ctx.bezierCurveTo(side * 64, -2, side * 56, 12, side * 26, 16);
      ctx.lineWidth = 7; ctx.strokeStyle = EAR; ctx.stroke();
    } else {
      ctx.moveTo(-side * 10, 0);
      ctx.bezierCurveTo(side * 16, -16, side * 44, -10, side * 50, 12);
      ctx.bezierCurveTo(side * 58, 42, side * 46, 70, side * 30, 76);
      ctx.bezierCurveTo(side * 16, 70, side * 6, 40, -side * 4, 22);
      ctx.closePath();
      fs(ctx, EAR, lw);
      ctx.beginPath();
      ctx.moveTo(side * 12, 6); ctx.quadraticCurveTo(side * 30, 30, side * 30, 64);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(80,40,20,0.35)'; ctx.stroke();
    }
    ctx.restore();
  }

  /* Rusty head, centred at 0,0 (radius ~70). o: headTurn, eyes, mouth, open, brow, blink, look,
   * earL/earR flop, earFlip ('L'/'R'/null), goggles (0 none, 1 on forehead, 2 over eyes), shades, t */
  function rustyHead(ctx, o) {
    const lw = 5;
    const tu = clamp(o.headTurn || 0, -1, 1);
    const fx = tu * 14;
    const t = o.t || 0;
    // ears behind
    const earBase = 0.12 + Math.sin(t * 2.3) * 0.03;
    rustyEar(ctx, -1, (o.earL != null ? o.earL : earBase), o.earFlip === 'L', lw);
    rustyEar(ctx, 1, (o.earR != null ? o.earR : earBase), o.earFlip === 'R', lw);
    // skull
    curve(ctx, [[0, -66], [42, -60], [66, -30], [70, 6], [56, 38], [30, 58], [0, 64], [-30, 58], [-56, 38], [-70, 6], [-66, -30], [-42, -60]], true, 0.9);
    fs(ctx, FUR, lw);
    ctx.save();
    ctx.clip();
    // subtle forehead highlight + cheek shade
    ellipse(ctx, fx * 0.4, -40, 30, 22); ctx.fillStyle = 'rgba(255,220,170,0.28)'; ctx.fill();
    ellipse(ctx, 62, 22, 26, 44); ctx.fillStyle = 'rgba(150,80,30,0.2)'; ctx.fill();
    // dark mask around muzzle, fading up between the eyes
    const mg = ctx.createRadialGradient(fx, 32, 6, fx, 28, 58);
    mg.addColorStop(0, MUZ_D); mg.addColorStop(0.55, MUZ); mg.addColorStop(1, 'rgba(114,86,76,0)');
    ctx.fillStyle = mg;
    ellipse(ctx, fx, 30, 58, 44); ctx.fill();
    ctx.restore();
    // forehead wrinkles (soulful brow)
    const brow = o.brow || 0;
    ctx.beginPath();
    ctx.moveTo(fx - 10, -40 - brow * 4); ctx.quadraticCurveTo(fx, -46 - brow * 6, fx + 10, -40 - brow * 4);
    ctx.moveTo(fx - 6, -32 - brow * 3); ctx.quadraticCurveTo(fx, -36 - brow * 4, fx + 6, -32 - brow * 3);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(110,60,25,0.45)'; ctx.stroke();

    // eyes
    const ek = o.eyes || 'open';
    const puppy = ek === 'puppy';
    [-1, 1].forEach((s) => {
      const ex = s * 27 + fx, ey = -10;
      if (o.goggles === 2) return;
      if (ek === 'happy' || ek === 'closed' || ek === 'sleep') {
        eye(ctx, ex, ey, 12, 12, { eyes: ek, lw: 4.5 });
        return;
      }
      const rx = puppy ? 16 : 12, ry = puppy ? 18 : 14;
      const blink = clamp(o.blink || 0);
      const lx = (o.look ? o.look[0] : 0) * 3, ly = (o.look ? o.look[1] : 0) * 3;
      ctx.save();
      ctx.translate(ex, ey);
      probeEye(ctx, rx + 3, ry + 3, blink, lx * 1.6, ly * 1.6, rx * 0.62);
      ctx.scale(1, Math.max(0.08, 1 - blink));
      ellipse(ctx, 0, 0, rx + 3, ry + 3); ctx.fillStyle = '#7d4a26'; ctx.fill();
      ellipse(ctx, 0, 0, rx, ry); fs(ctx, '#2a160e');
      circle(ctx, lx - rx * 0.32, ly - ry * 0.35, rx * (puppy ? 0.42 : 0.36)); fs(ctx, '#ffffff');
      circle(ctx, lx + rx * 0.35, ly + ry * 0.35, rx * 0.16); fs(ctx, '#ffffff');
      if (puppy) {
        ellipse(ctx, 0, ry * 0.55, rx * 0.8, ry * 0.3); ctx.fillStyle = 'rgba(160,200,255,0.35)'; ctx.fill();
      }
      ctx.restore();
      // brow spot
      ctx.save();
      ctx.translate(ex, ey - 22 - brow * 5);
      ctx.rotate(-s * brow * 0.35);
      ellipse(ctx, 0, 0, 9, 4.5); ctx.fillStyle = FUR_HI; ctx.fill();
      ctx.restore();
    });

    // muzzle bump + nose + mouth
    const nx = fx * 1.25, ny = 16;
    ellipse(ctx, nx, 32, 34, 24); ctx.fillStyle = 'rgba(90,66,60,0.55)'; ctx.fill();
    const mk = o.mouth || 'closed';
    const open = clamp(o.open || 0);
    if (mk === 'open' || mk === 'howl' || mk === 'talk' || mk === 'sing' || mk === 'grin') {
      const h = mk === 'howl' ? 26 : mk === 'grin' ? 18 : 6 + open * 24;
      const w = mk === 'howl' ? 13 : mk === 'grin' ? 26 : 18;
      ctx.beginPath();
      ctx.moveTo(nx - w, 34);
      ctx.quadraticCurveTo(nx, 30, nx + w, 34);
      ctx.quadraticCurveTo(nx + w * 0.9, 34 + h, nx, 36 + h);
      ctx.quadraticCurveTo(nx - w * 0.9, 34 + h, nx - w, 34);
      ctx.closePath();
      fs(ctx, '#5c1d22', 4);
      ctx.save(); ctx.clip();
      ellipse(ctx, nx, 38 + h, w * 0.75, h * 0.55); fs(ctx, '#f07e8e');
      ctx.restore();
    }
    if (mk === 'tongue') {
      ctx.beginPath();
      ctx.moveTo(nx - 8, 38);
      ctx.quadraticCurveTo(nx - 12, 64, nx + 2, 66);
      ctx.quadraticCurveTo(nx + 14, 64, nx + 10, 38);
      ctx.closePath();
      fs(ctx, '#f07e8e', 4);
      ctx.beginPath(); ctx.moveTo(nx + 1, 44); ctx.lineTo(nx + 1, 58);
      ctx.lineWidth = 2; ctx.strokeStyle = '#d2556a'; ctx.stroke();
    }
    // mouth line (w shape)
    ctx.beginPath();
    ctx.moveTo(nx, 26); ctx.lineTo(nx, 33);
    const smile = mk === 'frown' ? -1 : 1;
    ctx.moveTo(nx - 20, 30 - smile * 2); ctx.quadraticCurveTo(nx - 10, 38 + smile * 4, nx, 33);
    ctx.quadraticCurveTo(nx + 10, 38 + smile * 4, nx + 20, 30 - smile * 2);
    ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke();
    // nose
    ctx.beginPath();
    ctx.moveTo(nx - 17, ny - 8);
    ctx.quadraticCurveTo(nx, ny - 14, nx + 17, ny - 8);
    ctx.quadraticCurveTo(nx + 20, ny + 4, nx + 4, ny + 11);
    ctx.quadraticCurveTo(nx, ny + 13, nx - 4, ny + 11);
    ctx.quadraticCurveTo(nx - 20, ny + 4, nx - 17, ny - 8);
    ctx.closePath();
    fs(ctx, '#1e1616', 3);
    ellipse(ctx, nx - 5, ny - 6, 6, 3); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    // whisker dots
    ctx.fillStyle = 'rgba(30,20,18,0.5)';
    [[-22, 22], [-26, 28], [-18, 27], [22, 22], [26, 28], [18, 27]].forEach(([x, y]) => { circle(ctx, nx + x, y, 1.6); ctx.fill(); });

    // accessories
    if (o.goggles) {
      const gy = o.goggles === 1 ? -44 : -10;
      ctx.beginPath(); ctx.moveTo(-68, gy); ctx.lineTo(68, gy); ctx.lineWidth = 9; ctx.strokeStyle = '#6b3f22'; ctx.stroke();
      [-1, 1].forEach((s) => {
        circle(ctx, s * 26 + fx * 0.6, gy, 20); fs(ctx, '#caa04a', 4.5);
        circle(ctx, s * 26 + fx * 0.6, gy, 14);
        const g = ctx.createLinearGradient(0, gy - 14, 0, gy + 14);
        g.addColorStop(0, '#bfeaff'); g.addColorStop(1, '#4aa3d8');
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(s * 26 + fx * 0.6 - 4, gy - 4, 7, Math.PI, Math.PI * 1.6);
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
      });
    }
    if (o.shades) {
      ctx.save();
      ctx.translate(fx, -10);
      [-1, 1].forEach((s) => {
        RV.star(ctx, s * 28, 0, 24, 13, 5, -Math.PI / 2);
        fs(ctx, o.shades === 'gold' ? '#ffcf3d' : '#ff4fa3', 4);
        RV.star(ctx, s * 28, 0, 15, 8, 5, -Math.PI / 2);
        ctx.fillStyle = '#1b1030'; ctx.fill();
      });
      ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(8, -2); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.restore();
    }
    if (o.hat) o.hat(ctx);
  }
  RV.rustyHead = rustyHead;

  function collar(ctx, y, w, t, swing, tagText) {
    ctx.beginPath();
    ctx.ellipse(0, y, w, 12, 0, 0.05, Math.PI - 0.05);
    ctx.lineWidth = 13; ctx.strokeStyle = '#1d1d22'; ctx.lineCap = 'round'; ctx.stroke();
    // tag
    ctx.save();
    ctx.translate(0, y + 12);
    ctx.rotate(Math.sin(t * 5) * 0.12 + (swing || 0));
    ctx.beginPath(); ctx.arc(0, 4, 6, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = '#c7c2ba'; ctx.stroke();
    RV.rrect(ctx, -17, 10, 34, 24, 5);
    fs(ctx, '#a19b93', 3);
    ctx.fillStyle = '#5c5751';
    ctx.font = `bold 9px ${RV.FONT.body}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tagText || 'RUSTY', 0, 22.5);
    ctx.restore();
  }

  function rustyTail(ctx, x, y, side, wagAng, lw, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wagAng);
    ctx.scale(side * scale, scale);
    // curled tail: sweep out and curl back over
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(40, 6, 78, -18, 74, -58);
    ctx.bezierCurveTo(70, -92, 30, -96, 24, -70);
    ctx.lineCap = 'round';
    ctx.lineWidth = 22 + lw * 2; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.lineWidth = 22; ctx.strokeStyle = FUR; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.bezierCurveTo(44, 0, 70, -20, 68, -56);
    ctx.lineWidth = 6; ctx.strokeStyle = FUR_HI; ctx.stroke();
    ctx.restore();
  }

  /* Front view Rusty. Origin at the ground, between the paws.
   * pose: 'sit' | 'stand' (upright, dancing on hind legs)
   * p: x, y, s, face, headTilt, bob, wag (0..1 amount), t, armL/armR (upright pose: [shoulder, elbow]),
   *    footL/footR ([dx, lift] upright), belt (doggy seatbelt), plus head options */
  RV.drawRusty = function (ctx, p) {
    const t = p.t || 0;
    const lw = 5;
    ctx.save();
    ctx.translate(p.x || 0, (p.y || 0) - (p.jump || 0));
    const s = p.s || 1;
    ctx.scale(s * (p.face || 1), s * (p.squash || 1));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const wag = p.wag == null ? 0.6 : p.wag;
    const wagAng = Math.sin(t * (p.wagSpeed || 14)) * 0.35 * wag;
    const bob = p.bob || 0;
    const upright = p.pose === 'stand';

    if (!upright) {
      // ---------------- sitting (like the photo)
      rustyTail(ctx, 70, -34, 1, wagAng - 0.1, lw);
      // haunches
      [-1, 1].forEach((sd) => {
        ellipse(ctx, sd * 64, -42 + bob * 0.3, 50, 42, sd * 0.2);
        fs(ctx, FUR_SH, lw);
        ellipse(ctx, sd * 92, -9, 26, 12);
        fs(ctx, FUR, lw);
      });
      // body / chest
      ctx.beginPath();
      ctx.moveTo(-48, -178 + bob);
      ctx.bezierCurveTo(-82, -120 + bob, -78, -40, -58, -4);
      ctx.lineTo(58, -4);
      ctx.bezierCurveTo(78, -40, 82, -120 + bob, 48, -178 + bob);
      ctx.closePath();
      fs(ctx, FUR, lw);
      ellipse(ctx, 0, -112 + bob * 0.6, 32, 56);
      ctx.fillStyle = FUR_HI; ctx.fill();
      // front legs
      [-1, 1].forEach((sd) => {
        const lift = sd < 0 ? (p.pawL || 0) : (p.pawR || 0);
        if (lift > 0) {
          // raised paw (waving / pressing)
          const sx = sd * 28, sy = -110 + bob;
          const ex = sd * (40 + lift * 20), ey = sy - lift * 70;
          limb(ctx, [[sx, sy], [sx + sd * 26, sy + 8 - lift * 30], [ex, ey]], 30, FUR, lw);
          ellipse(ctx, ex, ey, 18, 16); fs(ctx, FUR_HI, lw);
        } else {
          limb(ctx, [[sd * 27, -110 + bob], [sd * 29, -12]], 30, FUR, lw);
          ellipse(ctx, sd * 30, -10, 22, 12); fs(ctx, FUR_HI, lw);
          ctx.beginPath();
          ctx.moveTo(sd * 30 - 7, -14); ctx.lineTo(sd * 30 - 7, -4);
          ctx.moveTo(sd * 30 + 7, -14); ctx.lineTo(sd * 30 + 7, -4);
          ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke();
        }
      });
      if (p.belt) {
        ctx.beginPath(); ctx.moveTo(-70, -150 + bob); ctx.lineTo(70, -60);
        ctx.lineWidth = 16; ctx.strokeStyle = '#2f5fb3'; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = '#8fb5ff'; ctx.setLineDash([8, 8]); ctx.stroke(); ctx.setLineDash([]);
        RV.rrect(ctx, -2, -114 + bob * 0.5, 30, 22, 5); fs(ctx, '#d9dde5', 3.5);
      }
      collar(ctx, -170 + bob, 44, t, 0, p.tag);
      ctx.save();
      ctx.translate(0, -232 + bob);
      ctx.rotate(p.headTilt || 0);
      ctx.scale(1.05, 1.05);
      rustyHead(ctx, p);
      ctx.restore();
    } else {
      // ---------------- upright on hind legs (dancing / cheering)
      const hipY = -118 + bob;
      rustyTail(ctx, 38, hipY + 10, 1, wagAng - 0.5, lw, 0.9);
      const fl = p.footL || [0, 0], fr = p.footR || [0, 0];
      [[-1, fl], [1, fr]].forEach(([sd, f]) => {
        const ch = ik(sd * 30, hipY + 10, sd * 42 + f[0], -f[1] - 10, 62, 60, sd > 0 ? 1 : -1);
        limb(ctx, ch, 34, FUR, lw);
        ellipse(ctx, ch[2][0] + sd * 6, ch[2][1] + 4, 25, 12); fs(ctx, FUR_HI, lw);
      });
      // torso
      ctx.beginPath();
      ctx.moveTo(-44, -236 + bob);
      ctx.bezierCurveTo(-72, -200 + bob, -70, hipY + 30, -40, hipY + 34);
      ctx.lineTo(40, hipY + 34);
      ctx.bezierCurveTo(70, hipY + 30, 72, -200 + bob, 44, -236 + bob);
      ctx.closePath();
      fs(ctx, FUR, lw);
      ellipse(ctx, 0, -170 + bob, 30, 52); ctx.fillStyle = FUR_HI; ctx.fill();
      if (p.outfit) p.outfit(ctx, bob);
      // front legs as arms
      [[-1, p.armL || [0.4, 0.2], p.handL], [1, p.armR || [0.4, 0.2], p.handR]].forEach(([sd, a, target]) => {
        const sx = sd * 40, sy = -214 + bob;
        let ch;
        if (target) ch = ik(sx, sy, target[0], target[1], 50, 48, sd > 0 ? -1 : 1);
        else {
          const a1 = sd * a[0], a2 = a1 + sd * (a[1] || 0);
          const e = [sx + Math.sin(a1) * 50, sy + Math.cos(a1) * 50];
          ch = [[sx, sy], e, [e[0] + Math.sin(a2) * 48, e[1] + Math.cos(a2) * 48]];
        }
        limb(ctx, ch, 28, FUR, lw);
        circle(ctx, ch[2][0], ch[2][1], 17); fs(ctx, FUR_HI, lw);
        if (sd < 0 && p.holdL) p.holdL(ctx, ch[2]);
        if (sd > 0 && p.holdR) p.holdR(ctx, ch[2]);
      });
      collar(ctx, -232 + bob, 42, t, 0, p.tag);
      ctx.save();
      ctx.translate(0, -292 + bob);
      ctx.rotate(p.headTilt || 0);
      ctx.scale(1.02, 1.02);
      rustyHead(ctx, p);
      ctx.restore();
    }
    ctx.restore();
  };

  /* Side view Rusty (walking / running / digging / flying). Origin on the ground under the body.
   * p: gait (phase, cycles), run (0 walk .. 1 gallop), headUp, dig (0..1 digging pose), plus head opts */
  RV.drawRustySide = function (ctx, p) {
    const t = p.t || 0;
    const lw = 5;
    ctx.save();
    ctx.translate(p.x || 0, (p.y || 0) - (p.jump || 0));
    const s = p.s || 1;
    ctx.scale(s * (p.face || 1), s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const g = p.gait || 0;
    const run = p.run || 0;
    const stride = 0.45 + run * 0.35;
    const bodyBob = -Math.abs(Math.sin(g * TAU)) * (6 + run * 10);
    const tilt = (p.dig || 0) * 0.35 + Math.sin(g * TAU) * run * 0.05;
    ctx.translate(0, bodyBob);
    ctx.rotate(tilt);
    const wagAng = Math.sin(t * 14) * 0.3 * (p.wag == null ? 0.7 : p.wag);
    const bodyY = -118;
    // legs: back pair (far) first, darker
    const leg = (x, phase, far) => {
      const a = Math.sin((g + phase) * TAU) * stride;
      const lift = Math.max(0, Math.cos((g + phase) * TAU)) * 14 * (0.5 + run);
      const hip = [x, bodyY + 22];
      const foot = [x + Math.sin(a) * 70, -lift - bodyBob];
      const ch = ik(hip[0], hip[1], foot[0], foot[1] - 4, 50, 52, x > 0 ? -1 : 1);
      limb(ctx, ch, 24, far ? FUR_SH : FUR, lw);
      ellipse(ctx, ch[2][0] + 8, ch[2][1] + 2, 16, 9); fs(ctx, far ? FUR : FUR_HI, lw);
    };
    const digA = p.dig ? Math.sin(t * 20) : 0;
    leg(-62, 0.5, true);
    if (p.dig) {
      // front paws scrabbling
      [0, 0.5].forEach((ph, i) => {
        const a = Math.sin(t * 22 + ph * TAU) * 0.9;
        const hip = [62, bodyY + 20];
        const ch = RV.joint(hip[0], hip[1], 50, 0.6 + a * 0.5, 50, 0.4 + a * 0.4);
        limb(ctx, ch, 24, i ? FUR : FUR_SH, lw);
        ellipse(ctx, ch[2][0], ch[2][1], 15, 9); fs(ctx, FUR_HI, lw);
      });
    } else leg(62, 0.0, true);
    // tail
    rustyTail(ctx, -96, bodyY - 14, -1, -wagAng + 0.15, lw, 0.85);
    // body
    curve(ctx, [[-100, bodyY - 20], [-40, bodyY - 36], [40, bodyY - 38], [96, bodyY - 30], [110, bodyY + 4], [80, bodyY + 36], [0, bodyY + 30], [-70, bodyY + 34], [-108, bodyY + 12]], true, 0.8);
    fs(ctx, FUR, lw);
    ellipse(ctx, 60, bodyY + 18, 36, 16); ctx.fillStyle = FUR_HI; ctx.fill();
    ellipse(ctx, -60, bodyY - 20, 40, 10); ctx.fillStyle = 'rgba(160,90,40,0.25)'; ctx.fill();
    if (p.cape) p.cape(ctx, bodyY);
    leg(-50, 0.0, false);
    if (!p.dig) leg(74, 0.5, false);
    // collar + head
    const hu = p.headUp || 0;
    ctx.save();
    ctx.translate(106, bodyY - 40);
    ctx.rotate(-0.15 - hu * 0.6 + digA * 0.05 * (p.dig || 0));
    ctx.beginPath(); ctx.moveTo(-18, 20); ctx.lineTo(8, 34); ctx.lineWidth = 13; ctx.strokeStyle = '#1d1d22'; ctx.stroke();
    // side head: skull + snout
    ctx.translate(20, -26);
    curve(ctx, [[-44, -30], [0, -50], [36, -40], [80, -16], [96, 8], [84, 26], [40, 30], [0, 36], [-40, 26], [-54, -2]], true, 0.8);
    fs(ctx, FUR, lw);
    ctx.save(); ctx.clip();
    const mg = ctx.createRadialGradient(92, 8, 4, 80, 10, 60);
    mg.addColorStop(0, MUZ_D); mg.addColorStop(0.5, MUZ); mg.addColorStop(1, 'rgba(114,86,76,0)');
    ctx.fillStyle = mg; ctx.fillRect(20, -40, 100, 90);
    ctx.restore();
    // nose
    ellipse(ctx, 94, 0, 12, 10); fs(ctx, '#1e1616', 3);
    // mouth
    const mk = p.mouth || 'closed';
    ctx.beginPath();
    if (mk === 'talk' && (p.open || 0) > 0.08) {
      // talking: the jaw drops open with each syllable
      const o = clamp(p.open);
      const jaw = () => { ctx.beginPath(); ctx.moveTo(88, 15); ctx.quadraticCurveTo(64, 21, 40, 17); ctx.quadraticCurveTo(58, 22 + o * 18, 84, 20); ctx.closePath(); };
      jaw(); ctx.fillStyle = '#4a1512'; ctx.fill();
      ctx.save(); ctx.clip();
      ellipse(ctx, 62, 22 + o * 12, 14, 5 + o * 3); ctx.fillStyle = '#f07e8e'; ctx.fill();
      ctx.restore();
      jaw(); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.stroke();
    } else if (mk === 'open' || mk === 'tongue' || mk === 'talk' || mk === 'howl') {
      const o = mk === 'talk' ? clamp(p.open || 0) : 1;
      ctx.moveTo(90, 16); ctx.quadraticCurveTo(60, 20 + o * 18, 36, 18);
      ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
      if (mk === 'tongue') {
        ctx.beginPath(); ctx.moveTo(58, 22); ctx.quadraticCurveTo(62, 48, 72, 44); ctx.quadraticCurveTo(78, 34, 70, 22);
        fs(ctx, '#f07e8e', 3.5);
      }
    } else {
      ctx.moveTo(90, 16); ctx.quadraticCurveTo(64, 26, 40, 16);
      ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    }
    // eye
    const ek = p.eyes || 'open';
    if (ek === 'happy' || ek === 'closed') eye(ctx, 26, -14, 10, 10, { eyes: ek, lw: 4 });
    else {
      ellipse(ctx, 28, -14, 11, 12); ctx.fillStyle = '#7d4a26'; ctx.fill();
      ellipse(ctx, 29, -14, 8.5, 10); fs(ctx, '#2a160e');
      circle(ctx, 26, -18, 3.4); fs(ctx, '#fff');
      ellipse(ctx, 22, -32, 8, 4); ctx.fillStyle = FUR_HI; ctx.fill();
    }
    if (p.goggles) {
      ctx.beginPath(); ctx.moveTo(-40, -30); ctx.lineTo(40, -20); ctx.lineWidth = 8; ctx.strokeStyle = '#6b3f22'; ctx.stroke();
      circle(ctx, 30, p.goggles === 2 ? -14 : -38, 15); fs(ctx, '#caa04a', 4);
      circle(ctx, 30, p.goggles === 2 ? -14 : -38, 10); fs(ctx, '#7cc6ee');
    }
    // ear (flops with motion)
    ctx.save();
    ctx.translate(-10, -34);
    ctx.rotate(0.25 + Math.sin(g * TAU * 2) * 0.2 * (0.3 + run) + (p.earLift || 0));
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.bezierCurveTo(10, -12, 30, 0, 30, 24);
    ctx.bezierCurveTo(28, 52, 12, 64, 0, 62); ctx.bezierCurveTo(-12, 44, -16, 20, -10, 0);
    ctx.closePath();
    fs(ctx, EAR, lw);
    ctx.restore();
    ctx.restore();
    ctx.restore();
  };

  /* Sleeping Rusty curled up (for the fireside ending). Origin at the bottom centre. */
  RV.drawRustySleep = function (ctx, p) {
    const t = p.t || 0;
    const lw = 5;
    const breathe = Math.sin(t * 1.6) * 0.03;
    ctx.save();
    ctx.translate(p.x || 0, p.y || 0);
    ctx.scale((p.s || 1) * (p.face || 1), (p.s || 1));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // body curl
    ctx.save();
    ctx.scale(1 + breathe, 1 + breathe * 1.5);
    ellipse(ctx, 0, -70, 150, 70); fs(ctx, FUR, lw);
    ellipse(ctx, 30, -100, 110, 34); ctx.fillStyle = 'rgba(160,90,40,0.25)'; ctx.fill();
    ellipse(ctx, -60, -40, 70, 26); ctx.fillStyle = FUR_HI; ctx.fill();
    ctx.restore();
    // back leg
    ellipse(ctx, 80, -46, 50, 34, -0.3); fs(ctx, FUR_SH, lw);
    // tail wrapping round the front
    ctx.beginPath();
    ctx.moveTo(130, -40); ctx.bezierCurveTo(150, 0, 20, 10, -80, -6);
    ctx.lineWidth = 30; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.lineWidth = 20; ctx.strokeStyle = FUR; ctx.stroke();
    // front paws
    [-150, -110].forEach((x) => { ellipse(ctx, x, -14, 32, 13); fs(ctx, FUR_HI, lw); });
    // head resting on paws
    ctx.save();
    ctx.translate(-110, -66 + Math.sin(t * 1.6) * 2);
    ctx.rotate(-0.25 + (p.headTilt || 0));
    ctx.scale(0.95, 0.95);
    rustyHead(ctx, Object.assign({ eyes: 'sleep', mouth: 'closed', earL: 0.3, earR: -0.1 }, p, { t }));
    ctx.restore();
    ctx.restore();
  };
})(globalThis.RV);
