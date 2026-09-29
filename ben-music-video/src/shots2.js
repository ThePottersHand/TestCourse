/* The storyboard, part 2 (4.8-20 s): the where-will-I-go montage, the bu-u-u-ut glitch, the clones,
 * the tiny planet, the big note and the landing. Helpers come from shots.js.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT;
  const { shot, CUT, ben, cousin, rusty, lookAt, cone, yard, benSlam, whipLines, GRADS, decay, runPose } = RV._shotHelpers;

  // head centre (world y) of a kid standing at feet y with scale s (plus a jump)
  const headY = (id, y, s, jump = 0, bob = 0) => y + RV.kidHead(id, s) + bob * s - jump;
  const shrug = { armL: [0.9, 1.6], armR: [0.9, 1.6], handL_shape: 'open', handR_shape: 'open', brow: 0.9, headTilt: -0.1 };
  function bubbleHelmet(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = 'rgba(190,240,255,0.18)'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.28, r * 0.5, Math.PI * 1.1, Math.PI * 1.45); ctx.lineWidth = 7; ctx.stroke();
  }
  // diving mask + snorkel, drawn in head space (hat callback)
  const mask = (ctx, r) => {
    rrect(ctx, -r * 0.72, -r * 0.2, r * 1.44, r * 0.52, r * 0.2); ctx.fillStyle = 'rgba(170,230,255,0.45)'; ctx.fill();
    ctx.lineWidth = r * 0.1; ctx.strokeStyle = '#ff5d8f'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.72, 0); ctx.lineTo(-r * 1.02, -r * 0.1); ctx.moveTo(r * 0.72, 0); ctx.lineTo(r * 1.02, -r * 0.1);
    ctx.lineWidth = r * 0.12; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.95, r * 0.4); ctx.lineTo(r * 1.1, -r * 0.9); ctx.lineWidth = r * 0.16; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.lineWidth = r * 0.1; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
  };
  const snowCap = (ctx, r) => {
    [[-0.4, -1.02, 0.34], [0.05, -1.12, 0.42], [0.5, -0.98, 0.3]].forEach(([x, y, rr]) => { circle(ctx, x * r, y * r, rr * r); fs(ctx, '#ffffff', 3.5); });
  };
  const bobble = (c1, c2) => (ctx, r) => {
    ctx.beginPath(); ctx.moveTo(-r * 1.02, -r * 0.35); ctx.quadraticCurveTo(0, -r * 1.6, r * 1.02, -r * 0.35); ctx.closePath(); fs(ctx, c1, 4);
    rrect(ctx, -r * 1.06, -r * 0.5, r * 2.12, r * 0.26, r * 0.1); fs(ctx, c2, 4);
    circle(ctx, 0, -r * 1.12, r * 0.2); fs(ctx, '#ffffff', 4);
  };
  // lyric text that floats around (zero-g / bubbles / ice)
  function floatWords(ctx, t, text, x, y, size, t0, o = {}) {
    RV.letters(ctx, text, x, y, size, { fill: o.fill || '#ffffff', gradient: o.gradient }, (i) => {
      const a = t - t0 - i * 0.025;
      return { s: ease.outBack(clamp(a / 0.14), 2.2), dy: Math.sin(t * (o.speed || 3) + i * 0.8) * (o.amp || 12), r: Math.sin(t * 2 + i) * (o.rot || 0.12) };
    });
  }

  // ============================================================ 4.78  Where I'll go...  (the moon)
  shot(4.78, 'moon', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 4.78, z: 1.25, x: 960, y: 600, r: 0.08, push: 0.2 },
      { t: 5.1, z: 1.55, x: 960, y: 560, r: -0.05, shake: 10 },
    ]);
    RV.moonSurface(ctx, t, { earthX: 1540, earthY: 230, earthR: 125 });
    // cousins drifting in bubble helmets (like in the Rusty video)
    [['big', 520, 720, 0.72], ['little', 730, 470, 0.62], ['boy', 1420, 660, 0.66]].forEach(([id, x, y, s], i) => {
      const fx = x + Math.cos(t * 1.1 + i) * 30, fy = y + Math.sin(t * 1.6 + i * 1.3) * 26;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.sin(t * 0.8 + i) * 0.4 + (i - 1) * 0.3);
      const mv = RV.move('swim', t, i);
      cousin(ctx, id, t, Object.assign(mv, { x: 0, y: 0, s, noShadow: true, eyes: i === 1 ? 'wide' : 'dots', mouth: i === 1 ? 'o' : 'flat', open: 0.4, look: [0, 0] }));
      bubbleHelmet(ctx, 0, RV.kidHead(id, s) + (mv.bob || 0) * s, RV.KIDS[id].headR * s * (id === 'big' ? 1.75 : 1.5));
      ctx.restore();
    });
    const fl = 50 + Math.sin(t * 5) * 22;
    ben(ctx, t, Object.assign({ x: 960, y: 900, s: 1.05, jump: fl, noShadow: true }, shrug));
    RV.shadow(ctx, 960, 904, 80 * (1 - fl / 300), 0.25);
    ctx.restore();
    floatWords(ctx, t, "WHERE I'LL GO?", 960, 150, 110, 4.8, { gradient: GRADS[3], amp: 18, speed: 3 });
  }, { type: 'punchin', dur: 0.2, pre: 0.1, x: 960, y: 560, to: 3.5 });

  // ============================================================ 5.22  ...I do not know  (the sea bed)
  shot(5.22, 'sea', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 5.22, z: 1.2, x: 1000, y: 600, r: -0.06 },
      { t: 5.5, z: 1.7, x: 930, y: 560, r: 0.05, shake: 10 },
      { t: 5.64, z: 1.15, x: 1010, y: 600, r: -0.03 },
    ]);
    RV.seaBed(ctx, t);
    [['big', 1330], ['boy', 1510], ['little', 1680]].forEach(([id, x], i) => {
      cousin(ctx, id, t, { x, y: 905, s: 0.82, eyes: 'open', lid: 0.45, mouth: 'flat', hat: mask, armL: [0.4 + Math.sin(t * 3 + i) * 0.1, 0.4], armR: [0.4, 0.4],
        sway: Math.sin(t * 2 + i), look: [-0.8, 0], turn: -0.25 });
      // a stream of bubbles from each snorkel
      for (let b = 0; b < 4; b++) {
        const ph = RV.fract(t * 0.9 + b / 4 + i * 0.3);
        circle(ctx, x + 60 * 0.82 + Math.sin(ph * 9 + b) * 10, headY(id, 905, 0.82) - 120 - ph * 300, 7 + b * 2);
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
      }
    });
    ben(ctx, t, Object.assign({ x: 860, y: 915, s: 1.05, sway: Math.sin(t * 2) }, shrug));
    const hy = headY('ben', 915, 1.05);
    for (let b = 0; b < 6; b++) {
      const ph = RV.fract(t * 1.4 + b / 6);
      circle(ctx, 870 + Math.sin(ph * 10 + b) * 14, hy + 30 - ph * 420, 6 + (b % 3) * 4);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    }
    RV.fish(ctx, lerp(2100, -200, clamp((t - 5.3) / 0.55)), hy - 10, 1.2, t, '#ffd23f', -1);
    // the words ride up in bubbles
    ["I", "DO", "NOT", "KNOW"].forEach((w, i) => {
      const at = [5.22, 5.36, 5.5, 5.64][i];
      const lt = t - at;
      if (lt < 0) return;
      const x = 380 + i * 140 + Math.sin(t * 3 + i) * 12, y = 420 - lt * 120 - (i % 2) * 60;
      const r = 70 + w.length * 8;
      const pp = ease.outBack(clamp(lt / 0.14), 2.2);
      ctx.save(); ctx.translate(x, y); ctx.scale(pp, pp);
      circle(ctx, 0, 0, r); ctx.fillStyle = 'rgba(200,245,255,0.3)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      RV.bigText(ctx, w, 0, 4, 58, { fill: '#ffffff', shadow: false });
      ctx.restore();
    });
    ctx.restore();
  }, { type: 'whip', dur: 0.2, dir: 1 });

  // ============================================================ 5.88  I don't see where...  (the jungle)
  // Ben scans the wrong way with binoculars while the cousins peer out of the leaves behind him.
  function binoculars(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    [-34, 34].forEach((dx) => { rrect(ctx, dx - 28, -30, 56, 70, 14); fs(ctx, '#39405e', 5); circle(ctx, dx, 40, 26); fs(ctx, '#8fd3ff', 5); });
    rrect(ctx, -12, -10, 24, 30, 6); fs(ctx, '#39405e', 4);
    ctx.restore();
  }
  shot(5.88, 'jungle', (ctx, S) => {
    const { t } = S;
    ctx.save();
    const cam = RV.snapCam(ctx, t, [
      { t: 5.88, z: 1.2, x: 940, y: 580, r: 0.06 },
      { t: 6.12, z: 1.35, x: 1120, y: 520, r: -0.04, shake: 8 },
      { t: 6.22, z: 2.5, x: 1150, y: 505, r: 0.06, shake: 14, d: 0.1 },
    ]);
    RV.jungle(ctx, t);
    const bx = 1140, by = 930, s = 1.05;
    const hy = headY('ben', by, s);
    const turned = t >= 6.22; // swings round to look straight down the lens
    ben(ctx, t, { x: bx, y: by, s, face: 1, turn: turned ? 0 : 0.8, lean: turned ? 0 : 0.07, handL: [turned ? -34 : -10, RV.kidHead('ben') + 34], handR: [turned ? 34 : 60, RV.kidHead('ben') + 38], armsFront: 'LR', eyes: 'open' });
    binoculars(ctx, bx + (turned ? 0 : 26 * s), hy + 10 * s, s, turned ? 0 : 0.12);
    if (turned) {
      // huge eyes in the lenses
      [-34, 34].forEach((dx, i) => {
        circle(ctx, bx + dx * s, hy + 50 * s, 22 * s); fs(ctx, '#ffffff');
        circle(ctx, bx + dx * s + (i ? -4 : 4), hy + 52 * s, 12 * s); fs(ctx, '#62839b');
        circle(ctx, bx + dx * s + (i ? -4 : 4), hy + 52 * s, 6 * s); fs(ctx, OUT);
      });
    }
    // the cousins peeking out of the undergrowth behind him (heads only)
    const peek = ease.outBack(clamp((t - 5.95) / 0.16), 1.8);
    [['big', 300, 700], ['boy', 480, 760], ['little', 640, 800]].forEach(([id, x, y], i) => {
      RV.drawKidHead(ctx, id, { x, y: y + (1 - peek) * 200, s: 1.0, t, eyes: 'open', lid: i === 1 ? 0 : 0.35, mouth: i === 2 ? 'o' : 'flat', open: 0.4, look: [1, 0], turn: 0.35, sweat: i === 1 ? 1 : 0, neck: false });
    });
    RV.leaf(ctx, -60, 980, 1.2, -0.5, '#1b4332');
    RV.leaf(ctx, 180, 1120, 1.0, -0.9, '#2d6a4f');
    RV.leaf(ctx, 760, 1140, 0.8, -1.3, '#1b4332');
    RV.leaf(ctx, 1990, 900, 1.1, -2.6, '#2d6a4f');
    ctx.restore();
    RV.zoomLines(ctx, t, cam.snap && t > 6.2 ? 0.8 : 0);
    floatWords(ctx, t, "I DON'T SEE WHERE", 960, 150, 104, 5.92, { gradient: GRADS[1], amp: 8 });
  }, { type: 'wipe', dur: 0.22 });

  // ============================================================ 6.46  ...I could be  (an ice floe)
  function iceScene(ctx, t, benT) {
    RV.iceFloe(ctx, t);
    RV.penguin(ctx, 560 + Math.sin(t * 2) * 30, 905, 0.8, t, { seed: 1 });
    RV.penguin(ctx, 1380, 900, 0.9, t, { seed: 2, face: -1 });
    RV.penguin(ctx, 1640 + Math.sin(t * 1.5) * 20, 912, 0.7, t, { seed: 3 });
    // the cousins shivering in bobble hats
    [['big', 180, bobble('#ef476f', '#ffd23f')], ['boy', 330, bobble('#118ab2', '#ffffff')], ['little', 460, bobble('#06d6a0', '#ffd23f')]].forEach(([id, x, hat], i) => {
      const jit = Math.sin(t * 60 + i * 2) * 3;
      const hy = RV.kidHead(id);
      cousin(ctx, id, t, { x: x + jit, y: 912, s: 0.8, eyes: 'open', lid: 0.3, mouth: 'grimace', brow: 0.6, browAng: 0.4, hat,
        handL: [34, hy + RV.KIDS[id].headR + 60], handR: [-34, hy + RV.KIDS[id].headR + 60], look: [1, 0], turn: 0.3 });
    });
    return benT;
  }
  shot(6.46, 'ice', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 6.46, z: 1.15, x: 900, y: 600, r: -0.05 },
      { t: 6.62, z: 1.45, x: 960, y: 560, r: 0.05, shake: 8 },
      { t: 6.79, z: 1.1, x: 900, y: 590, r: -0.03 },
    ]);
    iceScene(ctx, t);
    ben(ctx, t, Object.assign({ x: 960, y: 915, s: 1.05 }, shrug, { headTilt: 0.08, eyes: 'open' }));
    // the words frozen in a block of ice
    const pp = ease.outBack(clamp((t - 6.5) / 0.16), 2);
    ctx.save(); ctx.translate(1160, 230); ctx.rotate(-0.04); ctx.scale(pp, pp);
    rrect(ctx, -430, -90, 860, 180, 26); ctx.fillStyle = 'rgba(190,230,255,0.6)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    RV.bigText(ctx, 'WHERE I COULD BE', 0, 6, 84, { fill: '#e8f7ff', stroke: '#3d6f96', shadow: false });
    ctx.beginPath(); ctx.moveTo(-400, -60); ctx.lineTo(-300, -80); ctx.moveTo(300, 70); ctx.lineTo(400, 50); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    ctx.restore();
    ctx.restore();
  }, { type: 'whip', dur: 0.2, dir: -1 });

  // ============================================================ 7.10  bu-u-u-ut
  // Everything freezes, then Ben's "but!" finger stutters toward the lens in glitchy jump-zooms.
  const BUT = [7.12, 7.24, 7.36, 7.48, 7.6, 7.72, 7.84, 7.96];
  shot(7.1, 'but', (ctx, S) => {
    const { t } = S;
    const k = BUT.reduce((n, a, i) => (t >= a ? i : n), 0);
    const amt = 0.15 + 0.85 * decay(t, BUT[k], 16);
    const hy = headY('ben', 915, 1.05);
    const keys = BUT.map((a, i) => ({ t: a, z: 1.15 * Math.pow(1.22, i), x: lerp(960, 1000, i / 7), y: lerp(620, hy - 20, Math.min(1, i / 4)), r: (i % 2 ? 0.05 : -0.05), d: 0.045, back: 1.2 }));
    RV.glitch(ctx, t, amt, (c) => {
      c.save();
      RV.snapCam(c, t, keys, { pulse: 0 });
      iceScene(c, 7.06);
      ben(c, t, { x: 960, y: 915, s: 1.05, armL: [0.3, 0.2], handR: [118, RV.kidHead('ben') - 60], handR_shape: 'point', eyes: 'wide', brow: 1.1,
        headTilt: Math.sin(t * 48) * 0.05, blush: 0.9 });
      c.restore();
    }, k);
    // B-U-U-U-U-U-T! builds up, one piece per stutter
    const pieces = ['BU', '-U', '-U', '-U', '-U', '-U', '-U', 'T!'];
    const txt = pieces.slice(0, k + 1).join('');
    const size = Math.min(170, 1750 / (txt.length * 0.62));
    ctx.save();
    ctx.translate((hash(Math.floor(t * 30)) - 0.5) * 16 * amt, (hash(Math.floor(t * 30) + 7) - 0.5) * 12 * amt);
    RV.letters(ctx, txt, W / 2, 150, size, { gradient: ['#ffffff', '#ffe066', '#ff4fa3'] }, (i, n) => {
      const last = i >= n - 2;
      const p = last ? ease.outBack(clamp((t - BUT[k]) / 0.08), 3) : 1;
      return { s: p, dy: Math.sin(t * 60 + i * 1.3) * 6, r: Math.sin(t * 40 + i) * 0.05 };
    });
    ctx.restore();
  }, CUT);

  // ============================================================ 8.08  I'm Ben,  (big reveal)
  const YD = { big: 1190, boy: 1360, little: 1520, rusty: 1690, y: 985 };
  function deadpanCousins(ctx, t, facepalm) {
    const fp = facepalm ? ease.outCubic(clamp((t - facepalm) / 0.18)) : 0;
    const hb = RV.kidHead('big');
    cousin(ctx, 'big', t, { x: YD.big, y: YD.y, eyes: fp > 0.6 ? 'closed' : 'dots', mouth: 'flat', armL: [0.2, 0.2],
      handR: fp > 0 ? [lerp(60, 4, fp), lerp(-150, hb + 2, fp)] : null, armR: [0.2, 0.2], armsFront: fp > 0 ? 'R' : null, handR_shape: fp > 0.55 ? 'open' : null, look: [-0.4, 0] });
    cousin(ctx, 'boy', t, { x: YD.boy, y: YD.y, eyes: 'dots', mouth: 'flat', armL: [0.25, 0.2], armR: [0.25, 0.2], blink: RV.blink(t * 3, 4) });
    const drop = facepalm ? t - facepalm : -1;
    cousin(ctx, 'little', t, { x: YD.little, y: YD.y, eyes: drop > 0.15 ? 'wide' : 'dots', mouth: drop > 0.15 ? 'o' : 'flat', open: 0.4, gloom: drop > 0.15 ? 0.8 : 0,
      armL: [0.25, 0.2], armR: [0.9, 1.9], holdR: cone(drop > 0 ? 0 : 1) });
    if (drop > 0) {
      // the scoop falls off the cone: plop
      const hx = YD.little + 60, g = Math.min(drop, 0.3);
      const y = lerp(YD.y - 250, YD.y - 10, clamp((g * g * 11)));
      if (drop < 0.3) { circle(ctx, hx, y, 24); fs(ctx, '#ff8fb1', 4); }
      else { ellipse(ctx, hx, YD.y - 6, 40, 12); fs(ctx, '#ff8fb1', 4); }
    }
    rusty(ctx, t, { x: YD.rusty, y: YD.y, s: 0.72, headTilt: 0.42, earFlip: 'R', wag: 0 });
    if (facepalm && t > facepalm + 0.05) RV.wordPop(ctx, '?', YD.rusty + 60, YD.y - 330, 110, t - facepalm - 0.05, { fill: '#4cc9f0' });
  }
  shot(8.08, 'reveal', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 8.08, z: 2.6, x: 830, y: 620, r: 0.05 },
      { t: 8.12, z: 1.02, x: 1000, y: 580, r: -0.02, d: 0.16, back: 1.3, shake: 16 },
    ]);
    yard(ctx, t);
    RV.confetti(ctx, t, { t0: 8.23, x: 830, y: 620, n: 70, spread: 3 });
    ben(ctx, t, { x: 830, y: 985, s: 1.08, armL: [1.75, 0.2], armR: [1.75, 0.2], handL_shape: 'open', handR_shape: 'open', eyes: 'happy', jump: 16 * RV.bounce(t, 1) });
    deadpanCousins(ctx, t, 0);
    ctx.restore();
    if (t >= 8.23) benSlam(ctx, t, 8.23, W / 2, 150, 1, { text: "I'M BEN!", size: 130, dur: 0.5 });
  }, { type: 'flash', dur: 0.1, pre: 0 });

  // ============================================================ 8.56  yes I'm Ben  (the cousins are not impressed)
  shot(8.56, 'deadpan', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [{ t: 8.56, z: 1.85, x: 1430, y: 690, push: 0.3 }], { pulse: 0.006 });
    yard(ctx, t);
    deadpanCousins(ctx, t, 8.81);
    RV.speechBubble(ctx, 1290, 470, 170, 90, 1230, 540, { text: '...', size: 64 });
    ctx.restore();
  }, { type: 'whip', dur: 0.16, dir: 1 });

  // ============================================================ 9.05  I'm Ben x4  (clones!)
  // A wave of Bens pops out of the lawn on every "Ben", surrounding the huddled cousins.
  const WAVES = [
    { t: 9.34, at: [[540, 1010, 1.0], [1400, 1010, 1.0]] },
    { t: 9.9, at: [[300, 930, 0.9], [690, 895, 0.85], [1260, 895, 0.85], [1640, 930, 0.9]] },
    { t: 10.48, at: [[110, 1070, 1.05], [460, 870, 0.8], [980, 858, 0.78], [1480, 870, 0.8], [1830, 1070, 1.05]] },
    { t: 11.02, at: [[40, 850, 0.72], [250, 848, 0.72], [640, 846, 0.7], [820, 846, 0.7], [1150, 846, 0.7], [1330, 848, 0.72], [1690, 850, 0.72], [1900, 852, 0.72], [330, 1150, 1.2], [1580, 1150, 1.2]] },
  ];
  const HUD = { big: 830, boy: 960, little: 1070, rusty: 1180, y: 1000 };
  const MOVES = ['bounce', 'twist', 'cheer', 'wave', 'disco', 'hips'];
  shot(9.05, 'clones', (ctx, S) => {
    const { t } = S;
    const wk = WAVES.reduce((n, w, i) => (t >= w.t ? i : n), -1);
    ctx.save();
    const cam = RV.snapCam(ctx, t, [
      { t: 9.05, z: 1.4, x: 970, y: 720, r: 0 },
      { t: 9.34, z: 1.22, x: 970, y: 700, r: 0.06, shake: 12 },
      { t: 9.9, z: 1.06, x: 960, y: 660, r: -0.06, shake: 12 },
      { t: 10.48, z: 0.94, x: 960, y: 640, r: 0.05, shake: 14 },
      { t: 11.02, z: 0.8, x: 960, y: 600, r: -0.03, shake: 16, d: 0.16 },
    ], { pulse: 0.03 });
    yard(ctx, t);
    // everyone sorted back-to-front
    const items = [];
    WAVES.forEach((w, wi) => {
      if (t < w.t - 0.02) return;
      w.at.forEach(([x, y, s], j) => items.push({ y, draw: () => {
        const lt = t - w.t;
        const up = ease.outBack(clamp(lt / 0.13), 2.2);
        if (lt < 0.5) { ellipse(ctx, x, y + 2, 110 * s, 22 * s); fs(ctx, '#5a3b22', 4); }
        ctx.save(); ctx.beginPath(); ctx.rect(-4000, -4000, 8000, 4000 + y + 4); ctx.clip();
        ben(ctx, t, Object.assign(RV.move(MOVES[(wi * 3 + j) % MOVES.length], t, wi + j * 0.37), { x, y: y + (1 - up) * 420 * s, s, eyes: (j + wi) % 3 ? 'happy' : 'open', noShadow: lt < 0.12 }));
        ctx.restore();
        if (lt < 0.6) { ctx.save(); ctx.translate(x, y); ctx.scale(0.5 * s, 0.45 * s); ctx.globalAlpha = 0.85; RV.dust(ctx, 0, 0, lt, { color: '#8a5a33', n: 8 }); ctx.restore(); }
      } }));
    });
    const lvl = Math.max(0, wk);
    const fear = [
      { eyes: 'wide', mouth: 'o', open: 0.5 },
      { eyes: 'wide', mouth: 'grimace', sweat: 1, brow: 1, browAng: 0.5 },
      { eyes: 'wide', mouth: 'wavy', gloom: 0.8, sweat: 1 },
      { eyes: 'spiral', mouth: 'wavy', gloom: 1 },
    ];
    const scan = Math.sin(t * 7);
    items.push({ y: HUD.y, draw: () => {
      ['big', 'boy', 'little'].forEach((id, i) => {
        const f = wk < 0 ? { eyes: 'open', mouth: 'flat', look: [scan, 0] } : Object.assign({ look: [Math.sin(t * 9 + i * 2), 0], turn: Math.sin(t * 5 + i) * 0.4 }, fear[Math.min(3, lvl + (i === 2 ? 1 : 0))]);
        cousin(ctx, id, t, Object.assign({ x: HUD[id], y: HUD.y, s: 0.95, armL: [0.5, 1.2], armR: [0.5, 1.2], lean: Math.sin(t * 6 + i) * 0.05, jump: 18 * decay(t, WAVES[Math.max(0, wk)].t, 10) }, f));
      });
      rusty(ctx, t, { x: HUD.rusty, y: HUD.y, s: 0.66, headTilt: Math.sin(t * 6) * 0.4, earFlip: 'R', wag: 0 });
    } });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    // "I'M BEN!" bubbles over the newest wave
    if (wk >= 0) {
      const w = WAVES[wk], lt = t - w.t;
      if (lt < 0.45) w.at.slice(0, 5).forEach(([x, y, s], j) => {
        const pp = ease.outBack(clamp((lt - j * 0.02) / 0.12), 2);
        if (pp <= 0) return;
        ctx.save(); ctx.translate(x + 60 * s, y - 440 * s); ctx.scale(pp * s, pp * s);
        RV.speechBubble(ctx, 0, 0, 250, 90, -40, 80, { text: "I'M BEN!", size: 46 });
        ctx.restore();
      });
    }
    ctx.restore();
    RV.zoomLines(ctx, t, cam.snap ? 0.7 : 0);
    if (t >= 11.02) benSlam(ctx, t, 11.02, W / 2, 150, 3, { text: 'BEN! BEN! BEN!', size: 110, dur: 0.3 });
  }, { type: 'whip', dur: 0.16, dir: -1 });

  // ============================================================ 11.30  And when I'm done I'll go again  (tiny planet)
  // Ben laps a tiny planet faster and faster, hurdling the cousins on top each time, until he's a
  // rainbow ring. The lyric chases him round the orbit; the cousins get dizzy.
  const PL = { cx: 960, cy: 700, R: 300, s: 0.52 };
  const T_STOP = 14.05;
  const lapA = 0.675, lapB = 0.9;
  const laps = (t) => lapA * (Math.exp(lapB * (Math.min(t, T_STOP) - 11.3)) - 1);
  const benAng = (t) => Math.PI + TAU * laps(t);
  const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const CREW = [['big', -0.36], ['boy', -0.12], ['little', 0.12], ['rusty', 0.36]];
  shot(11.3, 'planet', (ctx, S) => {
    const { t } = S;
    const th = benAng(t), speed = t < T_STOP ? lapA * lapB * Math.exp(lapB * (t - 11.3)) : 0; // laps per second
    ctx.save();
    const rock = Math.sin(RV.beat(t) * Math.PI / 2) * 0.035;
    RV.snapCam(ctx, t, [
      { t: 11.3, z: 1.25, x: 960, y: 560, r: -0.08, push: -0.12 },
      { t: 12.06, z: 1.1, x: 960, y: 600, r: 0.05, shake: 8, push: -0.05 },
      { t: 12.9, z: 1.0, x: 960, y: 640, r: -0.04, shake: 8, push: -0.03 },
      { t: 14.05, z: 1.7, x: 1100, y: 480, r: 0.08, shake: 24, d: 0.08 },
    ], { pulse: 0.035 });
    ctx.translate(960, 640); ctx.rotate(rock); ctx.translate(-960, -640);
    RV.space(ctx, t, { planets: false });
    RV.planet(ctx, 260, 250, 70, { color: '#b388eb', ring: true });
    RV.planet(ctx, 1700, 880, 90, { color: '#f4a261' });
    RV.planet(ctx, 1640, 180, 40, { color: '#4cc9f0' });
    const { cx, cy, R, s } = PL;
    // rainbow trail ring once he's going fast
    const trail = clamp((speed - 1.2) / 3) * 5.5;
    if (trail > 0.05) {
      for (let i = 0; i < 40; i++) {
        const a0 = th - (i / 40) * trail, a1 = th - ((i + 1) / 40) * trail;
        ctx.beginPath(); ctx.arc(cx, cy, R + 95 * s * 1.6, a1, a0);
        ctx.lineWidth = 70 * s * 1.6 * (1 - i / 44); ctx.strokeStyle = RV.hsl(i * 9 + t * 400, 95, 60, 0.9 * (1 - i / 40)); ctx.stroke();
      }
    }
    circle(ctx, cx, cy, R); fs(ctx, '#80ed99', 7);
    ctx.save(); circle(ctx, cx, cy, R); ctx.clip();
    ctx.fillStyle = '#57cc99';
    for (let i = 0; i < 8; i++) { const a = i * 0.8; ellipse(ctx, cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.5, 90, 45, a); ctx.fill(); }
    ctx.restore();
    // the lyric chasing him round the orbit
    const sung = RV.LYRICS[9].w.filter((x) => t >= x[0]).map((x) => x[2].toUpperCase());
    let text = sung.join(' ');
    if (t > 12.9) text += ' ' + new Array(Math.min(8, 1 + Math.floor((t - 12.9) / 0.16))).fill('AGAIN!').join(' ');
    if (text) {
      ctx.save();
      ctx.font = `64px ${RV.FONT.title}`;
      const arcLen = (ctx.measureText(text).width + text.length * 4) / (R + 250);
      ctx.restore();
      RV.textArc(ctx, text, cx, cy, R + 250, th - 0.25 - arcLen, 64, { gradient: GRADS[(Math.floor(t * 4)) % 4], stroke: OUT, lw: 9 });
    }
    // the crew on top: heads follow him round; they duck when he hurdles them
    CREW.forEach(([id, da], i) => {
      const a = -Math.PI / 2 + da;
      const d = angDiff(th, a);
      const over = t < T_STOP ? clamp(1 - Math.abs(d) / 0.45) : 0;
      const dizzy = t > 13.2;
      ctx.save(); ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.rotate(a + Math.PI / 2);
      if (id === 'rusty') rusty(ctx, t, { x: 0, y: 0, s: 0.5, headTilt: Math.sin(th) * 0.5, noShadow: true, earFlip: 'R', eyes: dizzy ? 'closed' : 'open', bob: over * 30 });
      else {
        cousin(ctx, id, t, { x: 0, y: 0, s, noShadow: true, bob: over * 60, eyes: dizzy ? 'spiral' : 'wide', mouth: dizzy ? 'wavy' : 'o', open: 0.4,
          look: [Math.cos(th), Math.sin(th)], turn: clamp(Math.cos(th), -1, 1) * 0.5,
          armL: over > 0.2 ? [1.35, 1.25] : [0.3, 0.2], armR: over > 0.2 ? [1.35, 1.25] : [0.3, 0.2], handL_shape: over > 0.2 ? 'open' : null, handR_shape: over > 0.2 ? 'open' : null });
        if (dizzy) RV.dizzy(ctx, 0, (RV.kidHead(id) - 80) * s, 60, t + i);
      }
      ctx.restore();
    });
    // Ben: ghosts first, then Ben himself, standing out from the surface
    const drawBenAt = (ang, alpha, stopped) => {
      const d = angDiff(ang, -Math.PI / 2);
      const hop = stopped ? 0 : Math.max(0, 1 - (d / 0.62) * (d / 0.62)) * 250 * s * 1.6;
      ctx.save(); ctx.globalAlpha *= alpha;
      ctx.translate(cx + Math.cos(ang) * (R + hop), cy + Math.sin(ang) * (R + hop)); ctx.rotate(ang + Math.PI / 2);
      if (stopped) ben(ctx, t, { x: 0, y: 0, s: s * 1.08, lean: -0.25 * decay(t, T_STOP, 6), armL: [1.3, 0.3], armR: [2.3, 0.3], handR_shape: 'open', eyes: 'happy', noShadow: true });
      else ben(ctx, t, Object.assign(runPose(t, 0, 0, s * 1.08), { noShadow: true, lean: 0.35 }));
      ctx.restore();
    };
    if (t < T_STOP) {
      const ghosts = Math.min(5, Math.floor(speed * 1.2));
      for (let g = ghosts; g >= 1; g--) drawBenAt(benAng(t - g * 0.02), 0.15 * (ghosts - g + 1) / ghosts, false);
      drawBenAt(th, 1, false);
    } else {
      drawBenAt(th, 1, true);
      RV.dust(ctx, cx + Math.cos(th) * R, cy + Math.sin(th) * R, t - T_STOP, { n: 10, color: '#e9dcc9' });
    }
    ctx.restore();
  }, { type: 'zoom', dur: 0.24, pre: 0.1 });

  RV._shotHelpers2 = { headY, shrug, bubbleHelmet, binoculars, deadpanCousins, YD, floatWords };
})(globalThis.RV);
