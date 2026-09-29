/* The storyboard, part 3 (14.2-20 s): "Because, I'm, BEEEEENNNNN" and the landing.
 * On the held note the camera pulls back from Ben to the Earth, the solar system and the galaxy
 * (a powers-of-ten zoom-out), then he crash-lands in front of the cousins on the song's last hit.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT;
  const { shot, CUT, ben, cousin, rusty, yard, benSlam, GRADS, decay } = RV._shotHelpers;
  const { headY } = RV._shotHelpers2;

  const NOTE = 15.58, LIFT = 16.62, N_START = 17.95, NOTE_END = 18.75, LAND = 19.0;

  // "BEEEEE...NNNNN": one more E every 0.15 s of the held note, then the Ns; rainbow letters with vibrato
  function beenText(ctx, t) {
    if (t < NOTE || t > NOTE_END + 0.05) return;
    const nE = 1 + Math.floor((Math.min(t, N_START) - NOTE) / 0.15);
    const nN = t > N_START ? Math.min(8, 1 + Math.floor((t - N_START) / 0.1)) : 0;
    const txt = 'B' + 'E'.repeat(nE) + 'N'.repeat(nN);
    const newest = nN ? N_START + (nN - 1) * 0.1 : NOTE + (nE - 1) * 0.15;
    const size = Math.min(210, 1820 / (txt.length * 0.6));
    const vib = t > 17.5 ? 1 : 0.45;
    RV.letters(ctx, txt, W / 2, 150, size, {}, (i, n) => ({
      s: i === n - 1 ? ease.outBack(clamp((t - newest) / 0.1), 2.6) : 1,
      dy: Math.sin(t * 26 + i * 0.6) * 12 * vib,
      r: Math.sin(t * 13 + i) * 0.05,
      fill: RV.hsl(i * 22 + t * 240, 95, 62),
    }));
  }
  RV.beenText = beenText;
  RV.OVERLAYS = (RV.OVERLAYS || []).concat([beenText]);

  // ============================================================ 14.20  Because, I'm,  (the stage)
  const STG = { x: 960, y: 900, s: 1.2 };
  shot(14.2, 'stage', (ctx, S) => {
    const { t } = S;
    const belt = t >= NOTE;
    const blow = belt ? clamp((t - NOTE) / 0.2) * (0.8 + 0.5 * clamp((t - 16.2) / 0.4)) : 0;
    const inhale = t >= 14.98 ? ease.inOutQuad(clamp((t - 14.98) / 0.55)) : 0;
    const bhy = headY('ben', STG.y, STG.s);
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 14.2, z: 1.08, x: 960, y: 600, r: 0.04, shake: 10 },
      { t: 14.6, z: 1.5, x: 960, y: 610, r: -0.05, shake: 10 },
      { t: 14.98, z: 2.25, x: 960, y: bhy + 20, r: 0.06, shake: 8, push: 0.16 },
      { t: NOTE, z: 1.2, x: 960, y: 600, r: -0.03, shake: 40, d: 0.1 },
      { t: 16.2, z: 1.1, x: 960, y: 600, r: 0.04, shake: 55, d: 0.2, back: 1 },
    ], { pulse: 0.03, shake: belt ? 12 : 0 });
    RV.stage(ctx, t, { curtains: false, spot: belt ? 0.75 + 0.25 * Math.sin(t * 40) : 1 });
    // the cousins (and Rusty) peek round the left curtain; the blast blows them about
    const tilt = -0.35 * blow;
    [['big', 455, 400], ['boy', 470, 545], ['little', 462, 680]].forEach(([id, x, y], i) => {
      const f = belt ? { eyes: 'squeeze', mouth: 'grimace', sweat: 1 } : t >= 14.98 ? { eyes: 'wide', mouth: 'o', open: 0.5, gloom: 0.6 } : { eyes: 'open', lid: 0.4, mouth: 'flat', look: [1, 0] };
      RV.drawKidHead(ctx, id, Object.assign({ x: x - blow * 40, y, s: 0.95, t, headTilt: tilt + Math.sin(t * 30 + i) * 0.06 * blow, sway: -blow * 4, neck: false, turn: 0.3 }, f));
    });
    ctx.save(); ctx.translate(452 - blow * 40, 820); ctx.rotate(tilt); ctx.scale(0.8, 0.8);
    RV.rustyHead(ctx, { t, eyes: belt ? 'closed' : 'open', mouth: 'closed', headTurn: 0.4, earL: belt ? -1.2 : null, earR: belt ? -0.9 : null, earFlip: belt ? null : 'R' });
    ctx.restore();
    RV.curtains(ctx, t, { blow });
    // Ben
    let pose;
    if (t < 14.6) pose = { armL: [0.3, 0.2], armR: [0.3, 0.2], bob: Math.abs(Math.sin(t * 12)) * 8, eyes: 'open', rest: 'grin' };
    else if (t < 14.98) pose = { armL: [0.3, 0.2], armR: [2.1, 0.7], handR_shape: 'open', eyes: 'open', brow: 0.5 };
    else if (!belt) pose = { armL: [0.35 + inhale * 0.3, 0.3], armR: [0.35 + inhale * 0.3, 0.3], eyes: 'squeeze', blush: 1, x: STG.x + RV.noise(t * 40, 5) * 6 * inhale };
    else pose = { armL: [2.0, 0.4], armR: [2.0, 0.4], handL_shape: 'open', handR_shape: 'open', eyes: 'happy', blush: 1, hairWind: -0.25, lean: -0.05 };
    ben(ctx, t, Object.assign({ x: STG.x, y: STG.y, s: STG.s * (1 + 0.08 * inhale * (belt ? 0.5 : 1)) }, pose));
    if (t >= 14.98 && !belt) {
      // cheeks glowing hotter and hotter
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      [-1, 1].forEach((sd) => glow(ctx, STG.x + sd * 0.56 * 70 * STG.s, bhy + 0.38 * 70 * STG.s, 60 * inhale, '#ff3b3b', 0.5 * inhale));
      ctx.restore();
    }
    if (belt) {
      // a shockwave on every kick, out of his mouth
      const my = bhy + 0.55 * 70 * STG.s;
      for (let k = 0; k < 4; k++) {
        const b0 = RV.beatTime(Math.floor(RV.beat(t)) - k);
        if (b0 >= NOTE - 0.01) RV.shockwave(ctx, STG.x, my, t - b0, { r: 1500, r0: 150, w: 26, life: 0.9 });
      }
      // flying debris in the gale
      for (let i = 0; i < 18; i++) {
        const ph = RV.fract(hash(i * 3.1) + (t - NOTE) * (1.2 + hash(i) * 1.5));
        const dir = i % 2 ? 1 : -1;
        const x = STG.x + dir * ph * 1400, y = 300 + hash(i * 7.3) * 600 + Math.sin(t * 8 + i) * 30;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 9 + i);
        ctx.fillStyle = RV.PALETTE[i % RV.PALETTE.length]; ctx.fillRect(-12, -6, 24, 12);
        ctx.restore();
      }
    }
    ctx.restore();
    // words
    if (t >= 14.6 && t < 14.98) {
      const txt = 'BECAUSE...'.slice(0, Math.max(1, Math.ceil((t - 14.6) / 0.035)));
      RV.bigText(ctx, txt, W / 2, 150, 120, { fill: '#ffffff', align: 'center' });
    } else if (t >= 14.98 && !belt) {
      ctx.save(); ctx.translate(RV.noise(t * 40, 2) * 8, RV.noise(t * 40, 3) * 8);
      RV.wordPop(ctx, "I'M...", W / 2, 150, 150 + inhale * 40, t - 14.98, { gradient: GRADS[2] });
      ctx.restore();
    }
  }, { type: 'iris', dur: 0.2, pre: 0.12, x: 1100, y: 480 });

  // ============================================================ 16.62  ...EEEEEENNNN  (lift-off)
  shot(LIFT, 'launch', (ctx, S) => {
    const { t, lt } = S;
    const up = clamp(lt / 0.52);
    RV.skyGradient(ctx, [RV.mix('#1b2a6b', '#07051a', up), RV.mix('#44b0ff', '#2a1b6e', up), RV.mix('#b8e6ff', '#6a5aa8', up)]);
    for (let i = 0; i < 8; i++) {
      const x = hash(i * 3.3) * W, y = ((hash(i * 7.7) * 1700 + lt * 3400) % 1700) - 320;
      RV.cloud(ctx, x, y, 1.3 + hash(i) * 0.9, '#ffffff', 0.92 * (1 - up * 0.6));
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = hash(i * 5.1) * W, y = ((hash(i * 2.9) * 1400 + lt * 5200) % 1400) - 200;
      ctx.lineWidth = 3 + hash(i) * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 140 + hash(i * 3) * 200); ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    RV.snapCam(ctx, t, [{ t: LIFT, z: 1.55, x: 960, y: 560, shake: 45, push: -1.0 }], { pulse: 0.03, shake: 10 });
    for (let i = 0; i < 7; i++) {
      ctx.beginPath(); ctx.moveTo(900 + i * 20, 760); ctx.lineTo(900 + i * 20 + Math.sin(t * 20 + i) * 20, 1900);
      ctx.lineWidth = 22; ctx.strokeStyle = RV.hsl(i * 50 + t * 300, 95, 60); ctx.stroke();
    }
    ben(ctx, t, { x: 960, y: 880, s: 1.1, armL: [2.95, 0.02], armR: [2.95, 0.02], footL: [16, 30], footR: [-16, 30], eyes: 'happy', blush: 1, noShadow: true, hairWind: 0.12 });
    ctx.restore();
    RV.impact(ctx, 960, 1180, lt, { r: 460, life: 0.35 });
  }, { type: 'flash', dur: 0.12, pre: 0.02 });

  // tiny "that's Ben" pointer for when he's too small to see
  function pointer(ctx, x, y, text, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    circle(ctx, x, y, 16); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 24, y - 24); ctx.lineTo(x + 110, y - 110); ctx.lineWidth = 6; ctx.stroke();
    RV.bigText(ctx, text, x + 120, y - 138, 56, { fill: '#ffd23f', align: 'left' });
    ctx.restore();
  }

  // ============================================================ 17.14  (the Earth)
  shot(17.14, 'earth', (ctx, S) => {
    const { t, lt } = S;
    RV.space(ctx, t, { planets: false });
    const z = 1.1 * Math.pow(0.13, clamp(lt / 0.52));
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-960, -620);
    RV.earth(ctx, 960, 2100, 1300, t);
    const by = 560 - lt * 420;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath(); ctx.moveTo(900 + i * 20, by + 330); ctx.lineTo(900 + i * 20, 820);
      ctx.lineWidth = 22; ctx.strokeStyle = RV.hsl(i * 50 + t * 300, 95, 60); ctx.stroke();
    }
    ben(ctx, t, { x: 960, y: by + 320, s: 1.0, armL: [2.95, 0.02], armR: [2.95, 0.02], footL: [16, 30], footR: [-16, 30], eyes: 'happy', blush: 1, noShadow: true });
    ctx.restore();
    const sx = W / 2 + (960 - 960) * z, sy = H / 2 + (by + 150 - 620) * z;
    pointer(ctx, sx + 10, sy, 'BEN', clamp((0.45 - z) / 0.2));
  }, { type: 'zoomout', dur: 0.2, pre: 0.1, to: 0.25 });

  // ============================================================ 17.66  (the solar system)
  shot(17.66, 'solar', (ctx, S) => {
    const { t, lt } = S;
    RV.space(ctx, t, { planets: false, nebula: ['#ff9f1c', '#4cc9f0', '#9b5de5'] });
    const p = clamp(lt / 0.52);
    const z = 3.2 * Math.pow(0.8 / 3.2, ease.outQuad(p));
    const ex = 1240, ey = 600;
    const fx = lerp(ex, 900, ease.inOutQuad(p)), fy = lerp(ey, 560, ease.inOutQuad(p));
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(0.12 * (1 - p)); ctx.scale(z, z); ctx.translate(-fx, -fy);
    const sunX = 700, sunY = 560;
    [220, 340, 540, 760, 980].forEach((r) => { ctx.beginPath(); ctx.ellipse(sunX, sunY, r, r * 0.42, 0, 0, TAU); ctx.lineWidth = 3 / z + 1; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke(); });
    RV.sun(ctx, sunX, sunY, 120, t);
    [[220, 2.2, '#c9a27e', 10], [340, 4.1, '#f4a261', 16], [760, 3.3, '#ef476f', 13], [980, 0.6, '#b388eb', 30]].forEach(([r, a, c, pr]) => {
      RV.planet(ctx, sunX + Math.cos(a + t * 0.2) * r, sunY + Math.sin(a + t * 0.2) * r * 0.42, pr, { color: c, ring: pr > 25 });
    });
    RV.earth(ctx, ex, ey, 16, t, { glow: false });
    // Ben's rainbow streak heading out of the solar system
    const bx = ex + 30 + lt * 900, by = ey - 30 - lt * 500;
    ctx.beginPath(); ctx.moveTo(ex + 10, ey - 10); ctx.lineTo(bx, by);
    ctx.lineWidth = 7; ctx.strokeStyle = RV.hsl(t * 400, 95, 65); ctx.stroke();
    circle(ctx, bx, by, 6); fs(ctx, '#ffffff');
    ctx.restore();
    pointer(ctx, W / 2 + (bx - fx) * z, H / 2 + (by - fy) * z, 'BEN', 1);
  }, { type: 'zoomout', dur: 0.2, pre: 0.1, to: 0.25 });

  // ============================================================ 18.18  (the galaxy)
  shot(18.18, 'galaxy', (ctx, S) => {
    const { t, lt } = S;
    RV.skyGradient(ctx, ['#02010a', '#0d0726', '#02010a']);
    RV.stars(ctx, t, { n: 260, y1: H, seed: 21 });
    const p = clamp(lt / 0.57);
    const z = 1.7 * Math.pow(0.85 / 1.7, ease.outQuad(p));
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(-0.2 + p * 0.25); ctx.scale(z, z); ctx.translate(-960, -560);
    RV.galaxy(ctx, 960, 560, 720, t, { n: 1100, spin: 0.35 });
    ctx.restore();
    // "Ben is here" on one of the arms
    const a = 2.1 + t * 0.35, d = 430;
    const gx = 960 + Math.cos(a) * d, gy = 560 + Math.sin(a) * d * 0.62;
    const c = Math.cos(-0.2 + p * 0.25), s = Math.sin(-0.2 + p * 0.25);
    const sx = W / 2 + ((gx - 960) * c - (gy - 560) * s) * z, sy = H / 2 + ((gx - 960) * s + (gy - 560) * c) * z;
    pointer(ctx, sx, sy, 'BEN IS HERE', 1);
  }, { type: 'zoomout', dur: 0.2, pre: 0.1, to: 0.2 });

  // ============================================================ 18.75  (silence)  ...and back in the backyard
  const FIN = { big: 600, boy: 790, little: 1140, rusty: 1320, y: 985, bx: 965 };
  function finaleCousins(ctx, t, landed) {
    const lt = t - LAND;
    const f = landed ? { soot: 1, eyes: 'dots', mouth: 'flat' } : { eyes: 'open', mouth: 'o', open: 0.25, look: [0, -1] };
    const blast = landed ? decay(t, LAND, 7) : 0;
    cousin(ctx, 'big', t, Object.assign({ x: FIN.big - blast * 40, y: FIN.y, lean: -blast * 0.25, sway: -blast * 3, armL: [0.2, 0.2], armR: [0.2, 0.2] }, f, landed ? { browR: 1 } : {}));
    cousin(ctx, 'boy', t, Object.assign({ x: FIN.boy - blast * 30, y: FIN.y, lean: -blast * 0.2, armL: [0.2, 0.2], armR: [0.2, 0.2] }, f, landed ? { mouth: 'wavy', sweat: 1 } : {}));
    cousin(ctx, 'little', t, Object.assign({ x: FIN.little + blast * 30, y: FIN.y, lean: blast * 0.2, sway: blast * 3, armL: [0.25, 0.2], armR: [0.9, 1.9], holdR: (c, h) => RV.iceCream(c, h[0] + 4, h[1] - 6, 0.9, 0, 0.15) }, f, landed ? { eyes: 'wide', mouth: 'o', open: 0.3 } : {}));
    rusty(ctx, t, { x: FIN.rusty + blast * 40, y: FIN.y, s: 0.72, headTilt: landed ? 0.45 : -0.2, earFlip: 'R', wag: landed && lt > 0.5 ? 0.8 : 0, eyes: 'open' });
  }
  shot(NOTE_END, 'hush', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    RV.snapCam(ctx, t, [{ t: NOTE_END, z: 1.3, x: 960, y: 640, push: 0.2 }], { pulse: 0 });
    yard(ctx, t);
    finaleCousins(ctx, t, false);
    // something is coming back down...
    const fall = clamp(lt / 0.25);
    const y = lerp(-200, 700, ease.inQuad(fall));
    ctx.beginPath(); ctx.moveTo(FIN.bx, y - 700); ctx.lineTo(FIN.bx, y);
    ctx.lineWidth = 26; ctx.strokeStyle = RV.hsl(t * 500, 95, 65, 0.9); ctx.stroke();
    circle(ctx, FIN.bx, y, 22); fs(ctx, '#ffffff');
    ctx.restore();
  }, CUT);

  // ============================================================ 19.00  BOOM. I'M BEN (AGAIN)
  shot(LAND, 'landing', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: LAND, z: 1.28, x: 960, y: 640, shake: 70 },
      { t: 19.2, z: 1.08, x: 960, y: 600, r: 0.025, d: 0.22, back: 1.2 },
    ], { pulse: 0.012 });
    yard(ctx, t);
    ellipse(ctx, FIN.bx, 1000, 250, 42); fs(ctx, '#5a3b22', 5);
    ellipse(ctx, FIN.bx, 994, 200, 26); fs(ctx, '#3d2716');
    finaleCousins(ctx, t, true);
    const rise = ease.outBack(clamp((lt - 0.08) / 0.2), 1.8);
    ben(ctx, t, { x: FIN.bx, y: 1000 + (1 - rise) * 60, s: 1.1, armL: [2.7, 0.1], armR: [2.7, 0.1], eyes: 'happy', rest: 'grin', blush: 0.9, noShadow: true, squash: 0.9 + 0.1 * rise });
    ctx.save(); ctx.globalAlpha = 0.8; ctx.translate(FIN.bx, 990); ctx.scale(0.6, 0.6);
    RV.dust(ctx, 0, 0, lt * 0.8, { n: 14, life: 0.9, color: '#d9cbb3' });
    ctx.restore();
    RV.impact(ctx, FIN.bx, 900, lt, { r: 560, life: 0.35 });
    RV.shockwave(ctx, FIN.bx, 960, lt, { r: 1600, w: 60, life: 0.6 });
    if (lt > 0.45) RV.wordPop(ctx, '?', FIN.rusty + 70, FIN.y - 330, 120, lt - 0.45, { fill: '#4cc9f0' });
    ctx.restore();
    if (t >= 19.1) benSlam(ctx, t, 19.1, W / 2, 190, 0, { text: "I'M BEN", size: 190, hold: true });
    if (t >= 19.4) {
      const l2 = t - 19.4, s = lerp(1.9, 1, ease.outCubic(clamp(l2 / 0.1)));
      ctx.save(); ctx.translate(W / 2 + 330, 360); ctx.rotate(-0.14); ctx.scale(s, s); ctx.globalAlpha = clamp(l2 / 0.05);
      rrect(ctx, -210, -64, 420, 128, 18); ctx.lineWidth = 12; ctx.strokeStyle = '#e63946'; ctx.stroke();
      ctx.font = `96px ${RV.FONT.title}`; ctx.fillStyle = '#e63946'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('AGAIN', 0, 8);
      ctx.restore();
    }
    if (t >= 19.3) {
      ctx.save(); ctx.globalAlpha = clamp((t - 19.3) / 0.15);
      RV.bigText(ctx, "a song by Ben's cousins", W / 2, H - 70, 46, { font: RV.FONT.body, fill: '#ffffff', lw: 8 });
      ctx.restore();
    }
  }, { type: 'flash', dur: 0.1, pre: 0 });
})(globalThis.RV);
