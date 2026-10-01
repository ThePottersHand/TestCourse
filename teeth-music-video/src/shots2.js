/* The storyboard, part 2 (14.5-31 s): the rap. Lazy Sunday in the tooth suit, the collection, everyone's
 * "what what?!", the confession, and a night of tooth-fairy work.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT, FLOOR = RV.FLOOR;
  const { shot, CUT, decay, lastIdx, glide, ben, suitBen, fairyBen, cousin, lookAt, shades, choir, spiral, darkStage, driftTeeth, shadow, starHat } = RV._shotHelpers;

  // a magnifying glass held up (hold callback)
  const magnifier = (ang = -0.5) => (ctx, h) => {
    ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(ang);
    rrect(ctx, -7, -10, 14, 80, 6); fs(ctx, '#6d4530', 3.5);
    circle(ctx, 0, -60, 48); ctx.fillStyle = 'rgba(200,240,255,0.35)'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#c9a227'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = OUT; circle(ctx, 0, -60, 54); ctx.stroke(); circle(ctx, 0, -60, 43); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -60, 32, Math.PI * 1.1, Math.PI * 1.45); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
    ctx.restore();
  };
  // a mug of cocoa with steam
  const mug = (t) => (ctx, h) => {
    ctx.save(); ctx.translate(h[0] + 4, h[1] - 10);
    ctx.beginPath(); ctx.arc(30, -26, 16, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = 9; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#ff8fab'; ctx.stroke();
    rrect(ctx, -28, -56, 58, 64, 10); fs(ctx, '#ff8fab', 4);
    RV.tooth(ctx, 1, -24, 0.2, { lw: 2.5 });
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      const ph = RV.fract(t * 0.6 + i / 3);
      ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
      ctx.beginPath(); ctx.moveTo(-14 + i * 14, -64 - ph * 60);
      for (let k = 1; k < 5; k++) ctx.lineTo(-14 + i * 14 + Math.sin(k * 1.7 + t * 3 + i) * 7, -64 - ph * 60 - k * 12);
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  };

  // ============================================================ 14.50  HE'S SITTING IN HIS TOOTH SUIT ON A LAZY SUNDAY MORNING
  // The living room in morning sun. A slow pan from the window to the sofa, where Ben sits in a full
  // tooth costume with a mug of cocoa. The cousins rap the story on the old TV in the corner.
  const SOFA = { x: 1260, w: 640 };
  const SEAT = FLOOR + RV.SOFA_SEAT;
  function tv(ctx, t, x, y) {
    // an old TV on a stand, the cousins rapping on it (they tell the story)
    rrect(ctx, x - 110, y - 40, 220, 40, 6); fs(ctx, '#6d4530', 4);
    [-1, 1].forEach((sd) => { rrect(ctx, x + sd * 80 - 8, y, 16, FLOOR - y, 4); fs(ctx, '#5b3a29', 3.5); });
    rrect(ctx, x - 150, y - 250, 300, 210, 24); fs(ctx, '#9b8bb5', 5);
    rrect(ctx, x - 128, y - 230, 220, 170, 20); fs(ctx, '#1d2b3a', 4);
    ctx.save(); rrect(ctx, x - 128, y - 230, 220, 170, 20); ctx.clip();
    ctx.fillStyle = '#ffb3c6'; ctx.fillRect(x - 128, y - 230, 220, 170);
    [['big', -60], ['boy', 0], ['little', 60]].forEach(([id, dx], i) => {
      const m = RV.kidSing(t, 'kids', 'smirk');
      const nod = Math.max(0, Math.sin(Math.PI * RV.half(t) + i * 0.4)) * 0.12;
      RV.drawKidHead(ctx, id, Object.assign({ x: x - 18 + dx, y: y - 120, s: 0.42, t, eyes: 'open', headTilt: nod - 0.04, hat: shades(1) }, m));
    });
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = y - 230; yy < y - 60; yy += 6) ctx.fillRect(x - 128, yy, 220, 2);
    ctx.restore();
    [[x + 118, y - 190], [x + 118, y - 140]].forEach(([kx, ky]) => { circle(ctx, kx, ky, 10); fs(ctx, '#ffd23f', 3); });
    ctx.beginPath(); ctx.moveTo(x - 40, y - 250); ctx.lineTo(x - 90, y - 330); ctx.moveTo(x + 40, y - 250); ctx.lineTo(x + 90, y - 330);
    ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
  }
  shot(14.5, 'lazySunday', (ctx, S) => {
    const { t } = S;
    const yawn = clamp(1 - Math.abs(t - 16.5) / 0.45);
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(14.4, 1.25, 520, 470),
      glide(14.55, 1.2, 760, 560, 1.6),
      glide(15.5, 1.3, 1140, 620, 1.1),
      glide(16.7, 1.45, 1250, 620, 1.2),
    ], { pulse: 0.012 });
    RV.livingRoom(ctx, t);
    tv(ctx, t, 640, 860);
    RV.sofa(ctx, SOFA.x, FLOOR, SOFA.w);
    suitBen(ctx, t, {
      x: SOFA.x, y: FLOOR, s: 0.9, legs: 150 / 0.9, shadow: false, rest: 'smile',
      eyes: yawn > 0.3 ? 'closed' : 'open', lid: 0.45, mouth: yawn > 0.2 ? 'o' : 'smile', open: yawn * 0.9,
      armR: yawn > 0.3 ? [2.5, 0.4] : null, handR: yawn > 0.3 ? null : [136, -164], holdR: yawn > 0.3 ? null : mug(t),
      armL: yawn > 0.3 ? [2.5, 0.4] : [0.55, 0.9], headTilt: -0.05 + 0.04 * Math.sin(t * 0.9), look: [-0.3, 0.1],
    });
    // the label
    const lb = RV.pop(t - 15.5, 0.3);
    if (lb > 0) {
      ctx.save(); ctx.translate(SOFA.x + 300, 420); ctx.scale(lb, lb); ctx.rotate(0.08);
      RV.bigText(ctx, 'TOOTH SUIT', 0, 0, 52, { fill: '#ffffff', stroke: '#e63946' });
      ctx.beginPath(); ctx.moveTo(-90, 34); ctx.quadraticCurveTo(-150, 70, -170, 120); ctx.lineWidth = 8; ctx.strokeStyle = '#e63946'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-190, 96); ctx.lineTo(-170, 124); ctx.lineTo(-146, 104); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }, { type: 'fade', dur: 0.3, pre: 0.1 }, { chapter: 'Lazy Sunday' });

  // ============================================================ 17.42  ADMIRING HIS COLLECTION OF HUMAN TEETH!
  // Ben at his glass cabinet of teeth with a magnifying glass. A slow push in; on "teeth!" one of the
  // teeth in the cabinet winks back.
  const CAB = { x: 1900, s: 1 };
  const WINKER = [CAB.x + 44 * CAB.s, FLOOR - 260 * CAB.s]; // the "BEST" tooth
  shot(17.42, 'collection', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(17.3, 1.25, 1700, 640),
      glide(17.42, 1.3, 1760, 620, 0.6),
      glide(17.92, 1.55, 1830, 640, 0.9),
      glide(18.84, 2.4, WINKER[0] - 20, WINKER[1] - 10, 0.5),
    ], { pulse: 0.012 });
    RV.livingRoom(ctx, t);
    RV.toothCabinet(ctx, CAB.x, FLOOR, CAB.s, t);
    // the winking tooth
    if (t > 18.84) {
      const wk = clamp((t - 18.95) / 0.12) * (1 - clamp((t - 19.3) / 0.12));
      const hop = Math.sin(clamp((t - 18.84) / 0.35) * Math.PI) * 26;
      RV.tooth(ctx, WINKER[0], WINKER[1] - hop, 0.3 * CAB.s * (1 + 0.25 * RV.pop(t - 18.84, 0.3)), { lw: 3, face: { eyes: wk > 0.5 ? 'happy' : 'open', mouth: 'smile', look: [-0.8, 0] } });
      RV.sparkle(ctx, WINKER[0] + 20, WINKER[1] - 26, 22 * Math.sin(clamp((t - 18.84) / 0.5) * Math.PI), '#ffffff');
    }
    suitBen(ctx, t, {
      x: 1520, y: FLOOR, s: 0.9, rest: 'smile', eyes: 'open', look: [1, -0.1], turn: 0.5, headTilt: 0.06 + 0.03 * Math.sin(t * 2),
      handR: [150, -330], holdR: magnifier(0.55), armL: [0.4, 0.9], blush: 0.9,
    });
    // little hearts floating up from him
    RV.hearts(ctx, t, 1520, 560, { n: 5, spread: 60, rise: 260, speed: 0.6 });
    ctx.restore();
  }, CUT, { chapter: 'The collection' });

  // ============================================================ 19.60  EVERYONE BE LIKE WHAT WHAT!?
  // Everyone (the cousins, Rusty, and the two cats from the Food Is Yummy video) in a row against a slowly
  // turning spiral. Deadpan on "Everyone be like", then a double take on every "what". The second time the
  // whole world rolls over.
  const WHATS = [20.55, 20.9, 22.08, 22.4];
  const ROW = { big: 360, boy: 590, little: 800, rusty: 1050, tux: 1330, ginger: 1590 };
  shot(19.6, 'whatWhat', (ctx, S) => {
    const { t } = S;
    const k = lastIdx(t, WHATS);
    const w = RV.wordAt(t);
    const whatNow = w && /^what/i.test(w.text);
    const shock = k >= 0 && (k < 2 ? t < 21.28 : true);
    const open = whatNow ? Math.max(0.35, RV.singOpen(t, 1.3)) : shock ? 0.25 : 0;
    const jerk = k >= 0 ? decay(t, WHATS[k], 7) : 0;
    const roll = t < 21.28 ? 0 : ease.inOutSine(clamp((t - 21.28) / 0.8)) * Math.PI;
    ctx.save();
    // the camera: a slow pan along the deadpan faces, snap zooms on the "what"s
    RV.snapCam(ctx, t, [
      glide(19.5, 1.25, 520, 700),
      glide(19.6, 1.25, 1200, 700, 1.0),
      { t: WHATS[0], z: 1.05, x: 975, y: 640, d: 0.12, shake: 18 },
      { t: WHATS[1], z: 1.45, x: 700, y: 660, d: 0.12, shake: 20, r: -0.05 },
      glide(21.28, 1.0, 975, 620, 0.8, { r: roll }),
      { t: WHATS[2], z: 2.0, x: (ROW.tux + ROW.ginger) / 2, y: 820, d: 0.12, shake: 20, r: Math.PI + 0.06 },
      { t: WHATS[3], z: 1.9, x: (ROW.big + ROW.boy) / 2, y: 660, d: 0.12, shake: 24, r: Math.PI - 0.06 },
    ], { pulse: 0.012 });
    spiral(ctx, 975, 600, t, { speed: t < 21.28 ? 0.15 : 0.6, colors: k >= 2 ? ['#ffd6a5', '#bdb2ff'] : ['#cdb4ff', '#ffc8dd'] });
    ctx.fillStyle = '#7a5ea8'; ctx.fillRect(-2400, FLOOR, 7000, 1400);
    ctx.beginPath(); ctx.moveTo(-2400, FLOOR); ctx.lineTo(4600, FLOOR); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    const kidFace = (id, i) => shock
      ? { eyes: k >= 3 && i < 2 ? 'spiral' : 'wide', mouth: 'o', open, headTilt: (k % 2 ? 0.12 : -0.12) * (0.4 + jerk), gloom: k >= 2 ? 0.5 : 0, sweat: k >= 1 ? 1 : 0 }
      : { eyes: 'open', lid: 0.45, mouth: 'flat', ...lookAt(ROW[id], i === 0 ? ROW.boy : ROW.big, 0, 300) };
    ['big', 'boy', 'little'].forEach((id, i) => cousin(ctx, id, t, Object.assign({ x: ROW[id], y: FLOOR, armL: [0.25, 0.2], armR: [0.25, 0.2], jump: 14 * jerk }, kidFace(id, i))));
    RV.shadow(ctx, ROW.rusty, FLOOR + 4, 90, 0.22);
    RV.drawRusty(ctx, Object.assign({ x: ROW.rusty, y: FLOOR, s: 0.95, t, blink: RV.blink(t, 9), wag: shock ? 0 : 0.3, jump: 18 * jerk },
      shock ? { eyes: 'open', mouth: 'open', open: Math.max(0.5, open), earFlip: k % 2 ? 'L' : 'R', headTilt: (k % 2 ? -0.15 : 0.15) * (0.4 + jerk) } : { eyes: 'open', mouth: 'closed', headTurn: -0.3 }));
    [['tux', ROW.tux], ['ginger', ROW.ginger]].forEach(([id, x], i) => {
      RV.shadow(ctx, x, FLOOR + 4, 95, 0.22);
      RV.drawCat(ctx, id, Object.assign({ x, y: FLOOR, s: 0.95, t, blink: RV.blink(t, 3 + i * 5), jump: 16 * jerk },
        shock ? { eyes: 'wide', dilate: 1, mouth: whatNow ? 'yowl' : 'o', open: Math.max(0.4, open), earL: 0, earR: 0, squash: 1 + 0.06 * jerk, tail: 1.2 }
          : { eyes: 'open', lid: 0.5, mouth: 'w', look: [i ? -0.6 : 0.6, 0] }));
    });
    ctx.restore();
    // WHAT / WHAT!? in screen space
    RV.screen(ctx, (c) => {
      const texts = ['WHAT', 'WHAT!?', 'WHAT', 'WHAT?!'];
      if (k >= 0 && t - WHATS[k] < 0.5) RV.wordPop(c, texts[k], [520, 1400, 1380, 560][k], [200, 220, 200, 230][k], 130, t - WHATS[k], { gradient: [['#fff3b0', '#ffd23f', '#ff9f1c'], ['#ffc2e2', '#ff4fa3', '#9b5de5']][k % 2], rot: k % 2 ? 0.1 : -0.1, life: 0.5 });
    });
  }, { type: 'flash', dur: 0.12, pre: 0.04 }, { chapter: 'What what?!' });

  // ============================================================ 22.66  AND THEN BEN ADMITTED THAT HE WAS A TOOTH FAIRY!
  // A spotlight. Ben shuffles, looks down, then up: "...a tooth fairy!" Poof: wings, tutu, a star and a wand.
  const POOF = 24.4;
  shot(22.66, 'confession', (ctx, S) => {
    const { t } = S;
    const fairy = t >= POOF;
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(22.6, 1.3, 960, 640),
      glide(22.7, 1.5, 960, 660, 1.6),
      glide(24.06, 1.75, 960, 650, 0.4),
      glide(POOF, 1.25, 960, 600, 0.35, { shake: 10 }),
    ], { pulse: 0.012 });
    darkStage(ctx, t, [960], { w: 360 });
    const shy = t < 23.52;
    const pose = {
      x: 960, y: FLOOR, say: t >= 23.52, rest: shy ? 'flat' : 'smile',
      eyes: shy ? 'open' : fairy ? 'happy' : 'open', look: shy ? [0.2, 0.9] : [0, 0], headTilt: shy ? 0.16 : 0, blush: shy ? 1 : 0.6,
      handL: shy ? [-20, -150] : null, handR: shy ? [20, -150] : null,
      footL: [shy ? 6 * Math.max(0, Math.sin(t * 6)) : 0, 0],
    };
    if (!fairy) ben(ctx, t, pose);
    else {
      const lt = t - POOF;
      fairyBen(ctx, t, Object.assign(pose, { armR: [2.25, 0.3], armL: [0.8, 0.6], jump: 26 + Math.sin(lt * 3) * 10, footL: [0, 30], shadow: true }));
    }
    // sparkles swirling in on "tooth", then the poof
    if (t > 24.06) {
      const sw = clamp((t - 24.06) / (POOF - 24.06));
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * TAU + t * 5, r = lerp(420, 120, sw) + (fairy ? (t - POOF) * 500 : 0);
        RV.sparkle(ctx, 960 + Math.cos(a) * r, 760 + Math.sin(a) * r * 0.6, 18, ['#fff6c8', '#ffc2e2', '#bdf0ff'][i % 3], fairy ? clamp(1 - (t - POOF) / 0.6) : 1);
      }
    }
    if (fairy) {
      RV.shockwave(ctx, 960, 720, t - POOF, { r: 900, life: 0.6, w: 30, color: '#ffe6f7', r0: 120 });
      RV.sparkleField(ctx, t, { n: 26, x0: 600, x1: 1320, y0: 380, y1: 980, size: 20, color: '#fff6c8' });
    }
    ctx.restore();
    if (fairy) RV.flash(ctx, 0.8 * (1 - clamp((t - POOF) / 0.25)), '#fff0fa');
    // the cousins in the front row, jaws on the floor
    RV.screen(ctx, (c) => {
      if (t < 23.0) return;
      const up = ease.outBack(clamp((t - 23.0) / 0.4), 1.4);
      [['big', 200], ['little', 1720]].forEach(([id, x], i) => {
        RV.drawKidHead(c, id, { x, y: lerp(1300, 1010, up), s: 1.15, t, eyes: fairy ? 'wide' : 'open', mouth: fairy ? 'o' : 'flat', open: fairy ? 0.7 : 0, gloom: fairy ? 0.6 : 0, look: [i ? -0.7 : 0.7, -0.6], turn: i ? -0.3 : 0.3 });
      });
    });
  }, { type: 'iris', dur: 0.5, pre: 0.25 }, { chapter: 'Tooth fairy' });

  // ============================================================ 25.10  HE SNUCK INTO THE CHILDREN'S HOUSES AT NIGHT THAT RIGHT!
  // Night. The tooth moon. Ben flies slowly across the sky with his sack, lands, and tiptoes up to a house.
  // On "that right!" he turns to us: shh.
  const FLY = [[-200, 560], [600, 470], [1400, 530], [2050, 860], [2240, 960]];
  const flyAt = (u) => {
    // smooth path through FLY (u 0..1)
    const n = FLY.length - 1, x = clamp(u) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
    const a = FLY[i], b = FLY[i + 1];
    const e = ease.inOutSine(f);
    return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
  };
  const LAND = 27.0, SHH = 27.95;
  shot(25.1, 'sneak', (ctx, S) => {
    const { t } = S;
    const u = clamp((t - 25.1) / (LAND - 25.1));
    const [px, py] = t < LAND ? flyAt(u) : [lerp(2240, 2330, clamp((t - LAND) / 0.9)), 960];
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(25.0, 1.15, 200, 420),
      glide(25.1, 1.15, 900, 380, 1.2),
      glide(26.2, 1.1, 1600, 450, 0.6),
      glide(26.6, 1.25, 2060, 650, 0.5),
      glide(27.0, 1.35, 2250, 720, 0.5),
      glide(SHH, 2.0, 2330, FLY[4][1] - 300, 0.35),
    ], { pulse: 0.012 });
    RV.nightStreet(ctx, t, { moonX: 1400, moonY: 170 });
    // sparkle trail behind him
    for (let i = 1; i < 12; i++) {
      const lag = i * 0.06;
      if (t - lag < 25.1) break;
      const uu = clamp((t - lag - 25.1) / (LAND - 25.1));
      const [qx, qy] = t - lag < LAND ? flyAt(uu) : [lerp(2240, 2330, clamp((t - lag - LAND) / 0.9)), 960];
      RV.sparkle(ctx, qx - 20 + Math.sin(i * 2 + t * 6) * 10, qy - 160 + Math.cos(i * 3) * 20, 16 * (1 - i / 12), '#fff6c8', 1 - i / 12);
    }
    const flying = t < LAND;
    const tip = !flying && t < SHH;
    fairyBen(ctx, t, Object.assign({
      x: px, y: py, s: 0.9, sack: 0.6, shadow: !flying, rest: 'smile', eyes: 'open', lid: 0.35, look: flying ? [1, 0] : [0.7, -0.3],
    }, flying ? {
      lean: 0.32, footL: [-30, 50], footR: [-10, 30], armR: [1.9, 0.2], armL: [0.6, 0.5], wandAng: 1.2, headTilt: -0.15,
    } : tip ? {
      lean: 0.12, footL: [0, 20 * Math.max(0, Math.sin(t * 7))], footR: [0, 20 * Math.max(0, -Math.sin(t * 7))], armR: [1.3, -0.8], armL: [0.5, 0.6], wandAng: 0.9,
    } : {
      // shh!
      lean: 0, look: [0, 0], turn: 0, eyes: 'open', lid: 0.5, mouth: 'smirk', handR: [12, RV.kidHead('ben') + 40], armsFront: 'R', wand: false, armL: [0.5, 0.6],
    }));
    ctx.restore();
    if (t >= SHH) RV.screen(ctx, (c) => RV.wordPop(c, 'shh!', 1350, 360, 90, t - SHH, { fill: '#ffffff', rot: -0.1, life: 0.6 }));
  }, { type: 'fade', dur: 0.4, pre: 0.2 }, { chapter: 'At night' });

  // ============================================================ 28.60  HE TOOK AWAY ALL THEIR TEETH AND GAVE THEM MONEY!?
  // A bedroom: a cousin asleep. Ben tiptoes in, slips the tooth out from under the pillow, puts a coin in
  // its place. The coin glints; the sleeper smiles.
  const TAKE = 29.7, GIVE = 30.18, MONEY = 30.6;
  const PILLOW = [450, 698]; // where the tooth (then the coin) peeks out from under the pillow
  shot(28.6, 'swap', (ctx, S) => {
    const { t } = S;
    // he floats in from the window side and hovers behind the bed, leaning over the pillow
    const come = ease.inOutSine(clamp((t - 28.6) / 0.85));
    const bx = lerp(1060, 590, come), by = 830 + Math.sin(t * 3) * 8;
    const took = t >= TAKE + 0.15, gave = t >= GIVE + 0.2;
    const lift = t >= TAKE + 0.05 && t < GIVE - 0.05; // holding the tooth up
    const down = t >= TAKE - 0.3 && !lift && t < GIVE + 0.35; // hand under the pillow
    const coinPop = gave ? ease.outBack(clamp((t - GIVE - 0.2) / 0.25)) : 0;
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(28.5, 1.3, 760, 650),
      glide(28.6, 1.35, 680, 640, 1.0),
      glide(TAKE, 1.65, 560, 660, 0.5),
      glide(MONEY, 1.9, 470, 680, 0.4, { shake: 6 }),
    ], { pulse: 0.012 });
    RV.bedroom(ctx, t, {
      sleeper: 'boy', tooth: took ? 0 : 1, coin: coinPop * (t > MONEY ? 1.6 : 1), mouth: t > MONEY ? 'grin' : 'smile', zzz: false,
      between: (c) => fairyBen(c, t, {
        x: bx, y: by, shadow: false, sack: took ? 1 : 0.7, wand: false, rest: 'smile', eyes: 'open', lid: 0.4,
        look: [-0.8, 0.5], turn: -0.45, lean: down || lift ? -0.25 : 0.05, footL: [0, 30], footR: [0, 22],
        handL: down ? [PILLOW[0] - bx + 6, PILLOW[1] - by + 6] : lift ? [476 - bx, 676 - by] : null, armL: down || lift ? null : [0.5, 0.5],
        holdL: (cc, h) => {
          if (lift) RV.tooth(cc, h[0], h[1] - 28, 0.24, { lw: 3 });
          if (t >= GIVE - 0.2 && t < GIVE + 0.2) RV.coin(cc, h[0], h[1] - 16, 18, t);
        },
        armR: [0.6, 0.5], holdR: (cc, h) => RV.toothSack(cc, h, took ? 1 : 0.7, t),
      }),
    });
    if (lift) RV.sparkle(ctx, 452, 626, 30 * Math.sin(clamp((t - TAKE) / 0.4) * Math.PI), '#ffffff');
    if (t > MONEY) {
      RV.sparkle(ctx, PILLOW[0] + 26, PILLOW[1] - 30, 34 * Math.sin(clamp((t - MONEY) / 0.5) * Math.PI), '#ffffff');
      // the sleeper dreams of money
      const p = RV.pop(t - MONEY - 0.05, 0.3);
      ctx.save(); ctx.translate(250, 545); ctx.scale(p, p);
      RV.speechBubble(ctx, 0, 0, 200, 130, 90, 120, { think: true });
      [[-40, -8], [10, 12], [50, -14]].forEach(([dx, dy], i) => RV.coin(ctx, dx, dy, 22, t + i));
      ctx.restore();
    }
    ctx.restore();
    if (t > MONEY) RV.screen(ctx, (c) => RV.wordPop(c, '$$$', 1420, 300, 110, t - MONEY, { gradient: ['#fff3b0', '#ffd23f', '#e0a800'], rot: 0.1 }));
  }, { type: 'wipe', dur: 0.4, pre: 0.2, colors: ['#ffd23f', '#ffc2e2', '#bdf0ff'] }, { chapter: 'Money' });

  Object.assign(RV._shotHelpers, { magnifier, mug, tv });
})(globalThis.RV);
