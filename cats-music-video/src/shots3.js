/* The storyboard, part 3 (18.7 s to the end): the "(hooray!)" echo, the held chord, the wind-down and
 * the final pose from the photo.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT, FLOOR = RV.FLOOR;
  const { shot, CUT, decay, lastIdx, cat, kid, lookAt, catDance, GRADS, slamWord, spotlight, fountain, partyLights } = RV._shotHelpers;

  // ------------------------------------------------------------ snapshots of earlier moments
  // A shot drawn at a fixed time into a square offscreen canvas (the middle of the frame), cached, so a
  // polaroid can show it.
  const SNAPS = {};
  function snapshot(name, t, px = 520) {
    const key = name + ':' + t + ':' + px;
    if (SNAPS[key]) return SNAPS[key];
    RV.ensureShots();
    const sh = RV.SHOTS.find((s) => s.name === name);
    const c = RV.makeCanvas(px, px);
    const x = c.getContext('2d');
    const k = px / H;
    const m = [k, 0, 0, k, -((W - H) / 2) * k, 0];
    const saved = RV._baseTransform;
    RV._baseTransform = m; // so RV.screen() overlays land inside the photo
    x.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    x.lineJoin = 'round'; x.lineCap = 'round';
    try { sh.draw(x, { t, lt: t - sh.t0, d: sh.t1 - sh.t0, p: clamp((t - sh.t0) / (sh.t1 - sh.t0)), shot: sh }); } finally { RV._baseTransform = saved; }
    SNAPS[key] = c;
    return c;
  }

  // ============================================================ 18.70  (HOORAY!)
  // Click! Four camera flashes, on the four hits of the echo: four polaroids of the best bits so far,
  // each one slapped onto the fridge door.
  const FLASHES = [18.7, 19.05, 19.39, 19.71];
  const PHOTOS = [
    { shot: 'hooray', t: 17.95, label: 'HOORAY!', slot: [1782, 700], rot: -0.08 },
    { shot: 'bum', t: 0.3, label: 'BUM!', slot: [1940, 712], rot: 0.07 },
    { shot: 'potDrums', t: 2.52, label: 'BA BA BUM', slot: [1790, 872], rot: 0.05 },
    { shot: 'yodel', t: 15.42, label: 'OUR EARS!!', slot: [1942, 862], rot: -0.06 },
  ];
  const FRIDGE_CAM = { x: 1862, y: 780 };
  shot(18.7, 'photos', (ctx, S) => {
    const { t } = S;
    const k = lastIdx(t, FLASHES);
    ctx.save();
    const cam = RV.snapCam(ctx, t, [
      { t: 18.6, z: 1.55, x: FRIDGE_CAM.x, y: FRIDGE_CAM.y },
    ].concat(FLASHES.map((a, i) => ({ t: a + 0.3, z: 1.55 + 0.06 * i, x: FRIDGE_CAM.x + (i % 2 ? 10 : -10), y: FRIDGE_CAM.y, r: i % 2 ? 0.02 : -0.02, d: 0.1, shake: 10 }))), { pulse: 0.02 });
    RV.kitchen(ctx, t, { cupOpen: 1, tinInside: false });
    // polaroids: pop up big in the middle of the screen, then fly to their spot on the fridge
    PHOTOS.forEach((P, i) => { if (t - FLASHES[i] >= 0.3) RV.impact(ctx, P.slot[0], P.slot[1], t - FLASHES[i] - 0.3, { r: 110, life: 0.25 }); });
    PHOTOS.forEach((P, i) => {
      const lt = t - FLASHES[i];
      if (lt < 0) return;
      const fly = ease.inOutCubic(clamp((lt - 0.12) / 0.18));
      const big = 470 / cam.z, small = 128;
      const x = lerp(cam.x, P.slot[0], fly), y = lerp(cam.y - 20 / cam.z, P.slot[1], fly);
      const w = lerp(big, small, fly) * (lt < 0.12 ? ease.outBack(clamp(lt / 0.1), 2) : 1);
      const rot = lerp(-P.rot * 2, P.rot, fly);
      RV.polaroid(ctx, x, y, w, rot, (c, px, py, pw) => c.drawImage(snapshot(P.shot, P.t), px, py, pw, pw), P.label);
      if (fly >= 1) {
        // a magnet holds it up
        circle(ctx, P.slot[0], P.slot[1] - small * 0.62, 11); fs(ctx, ['#ff4fa3', '#ffd23f', '#4cc9f0', '#06d6a0'][i], 3.5);
      }
    });
    ctx.restore();
    // the camera flash
    if (k >= 0) RV.flash(ctx, 0.95 * (1 - clamp((t - FLASHES[k]) / 0.14)));
    RV.screen(ctx, (c) => {
      if (k >= 0) RV.wordPop(c, 'CLICK!', [360, 1560, 380, 1540][k], [190, 200, 880, 870][k], 70, t - FLASHES[k], { gradient: GRADS[(k + 1) % 4], rot: k % 2 ? 0.12 : -0.12, life: 0.3 });
    });
  }, { type: 'flash', dur: 0.08, pre: 0.02 }, { chapter: '(Hooray!)' });

  // ============================================================ 20.05  (the held chord)
  // Time slows right down: everyone hangs in mid-air, mid-hooray, with the food and confetti drifting
  // around them, while the chord rings. When it stops (22.62), they all drop.
  const SLOW = 20.05, DROP_ALL = 22.62, LAND = 22.72;
  const FLOAT = [
    ['kid', 'big', 450, 760, 0], ['cat', 'tux', 690, 700, 1], ['kid', 'boy', 930, 790, 2], ['cat', 'ginger', 1180, 690, 3], ['kid', 'little', 1410, 770, 4],
  ];
  // where each face is (for the dolly along the line-up)
  const faceY = (kind, id, y) => (kind === 'kid' ? y + RV.kidHead(id) : y - 0.85 * 250);
  shot(SLOW, 'slowmo', (ctx, S) => {
    const { t, lt } = S;
    const fall = t < DROP_ALL ? 0 : clamp((t - DROP_ALL) / (LAND - DROP_ALL));
    ctx.save();
    // the camera glides from face to face, then pulls back just before they all drop
    RV.snapCam(ctx, t, [{ t: SLOW - 0.01, z: 1.1, x: 930, y: 560 }]
      .concat(FLOAT.map(([kind, id, x, y], i) => ({ t: SLOW + i * 0.48, z: 1.85, x, y: faceY(kind, id, y) + 40, r: (i % 2 ? 0.03 : -0.03), d: i ? 0.42 : 0.2, back: i ? 0 : 1.2, shake: i ? 0 : 16 })))
      .concat([
        { t: 22.4, z: 1.12, x: 930, y: 580, d: 0.2, back: 0 },
        { t: LAND, z: 1.16, x: 930, y: 660, shake: 26 },
      ]), { pulse: 0 });
    RV.kitchen(ctx, t, { cupOpen: 1, tinInside: false, dusk: 0.15 * clamp(lt / 2) });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 960, 300, 1100, '#ffe8b0', 0.35); ctx.restore();
    RV.table(ctx, RV._shotHelpers.TABLE.x0, RV._shotHelpers.TABLE.x1, RV._shotHelpers.TABLE.y, { cloth: true });
    // drifting food and confetti, very slowly
    const drift = (t - SLOW) * (1 - fall);
    for (let i = 0; i < 22; i++) {
      const x = 180 + hash(i * 3.3) * 1600 + Math.sin(drift * 0.6 + i) * 30;
      const y = 120 + hash(i * 5.7) * 560 - drift * (8 + hash(i) * 14) + fall * fall * 700;
      RV.food(ctx, i, x, y, 1.0, i + drift * (hash(i * 2) - 0.5) * 1.2);
    }
    RV.confetti(ctx, 20 + drift * 0.15, { rain: true, n: 70, seed: 3 });
    // the gang, frozen mid-jump, turning slowly
    FLOAT.forEach(([kind, id, x, y, i]) => {
      const hover = Math.sin(drift * 1.1 + i * 1.3) * 16 - drift * 6;
      const fy = lerp(y + hover, FLOOR, ease.inQuad(fall));
      const landed = t >= LAND;
      const squash = landed ? 1 - 0.18 * decay(t, LAND, 8) : 1;
      ctx.save();
      ctx.translate(x, fy); ctx.rotate(fall < 1 ? Math.sin(drift * 0.7 + i) * 0.1 * (1 - fall) : 0); ctx.translate(-x, -fy);
      if (kind === 'kid') {
        kid(ctx, id, t, {
          x, y: fy, shadow: false, squash, eyes: landed ? 'spiral' : 'happy', mouth: landed ? 'wavy' : 'o', open: 0.7,
          armL: landed ? [0.6, 0.3] : [2.3, 0.3], armR: landed ? [0.6, 0.3] : [2.3, 0.3],
          footL: [0, landed ? 0 : 26], footR: [landed ? 0 : 8, landed ? 0 : 12],
        });
      } else {
        cat(ctx, id, t, {
          x, y: fy, s: 0.85, pose: 'stand', shadow: false, squash, eyes: landed ? 'closed' : 'happy', rest: landed ? 'w' : 'o', open: 0.5,
          armL: landed ? [0.5, 0.3] : [2.1, 0.3], armR: landed ? [0.5, 0.3] : [2.1, 0.3], tail: 0.3,
          footL: [0, landed ? 0 : 20], footR: [0, landed ? 0 : 10], belly: id === 'ginger' ? 0.8 : 0.3,
        });
      }
      ctx.restore();
      if (landed) RV.dust(ctx, x, FLOOR, t - LAND, { n: 8, life: 0.6 });
    });
    RV.sparkleField(ctx, t, { n: 24, size: 24, color: '#fff6d8', x0: 100, x1: 1800, y0: 100, y1: 900 });
    ctx.restore();
    // a soft slow-motion blur of light at the edges
    RV.vignette(ctx, 0.35 * (1 - fall), '255,214,150');
  }, CUT, { chapter: 'Slow motion' });

  // ============================================================ 22.72  (the wind-down)
  // Dusk. Everyone is very, very full. The kids yawn, and the cats waddle over to their chair, hiccuping
  // on the little hits, then jump for it.
  const HICS = [[23.3, 'ginger'], [23.42, 'tux'], [23.64, 'ginger'], [23.74, 'tux'], [24.06, 'ginger']];
  const CHAIR = { x: 1250, s: 1.3 };
  const JUMP = 24.36, FLOP = 24.62;
  RV.CHAIR_AT = CHAIR;
  shot(LAND, 'windDown', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: LAND, z: 1.2, x: 700, y: 650, push: 0.04 },
      { t: 23.64, z: 1.28, x: 880, y: 660, d: 0.5, back: 0.4, push: 0.03 },
      { t: JUMP, z: 1.2, x: 1060, y: 640, d: 0.2 },
    ], { pulse: 0 });
    RV.kitchen(ctx, t, { cupOpen: 1, tinInside: false, dusk: 0.55 + 0.2 * clamp(lt / 1.9) });
    RV.chair(ctx, CHAIR.x, FLOOR, CHAIR.s, 'back');
    RV.chair(ctx, CHAIR.x, FLOOR, CHAIR.s, 'seat');
    // the kids, sleepy
    const yawn = (a) => clamp(1 - Math.abs(t - a) / 0.35);
    kid(ctx, 'big', t, { x: 240, y: FLOOR, eyes: 'open', lid: 0.55, mouth: yawn(23.2) > 0 ? 'o' : 'smile', open: yawn(23.2), headTilt: -0.12, lean: -0.04, armL: [0.25, 0.2], armR: yawn(23.2) > 0.3 ? [2.4, 0.4] : [0.25, 0.2] });
    kid(ctx, 'boy', t, { x: 410, y: FLOOR, eyes: 'open', lid: 0.6, mouth: yawn(23.9) > 0 ? 'o' : 'smile', open: yawn(23.9), headTilt: 0.14, lean: 0.05, armL: yawn(23.9) > 0.3 ? [2.4, 0.4] : [0.2, 0.2], armR: [0.2, 0.2] });
    kid(ctx, 'little', t, { x: 565, y: FLOOR, eyes: t > 23.5 ? 'closed' : 'open', lid: 0.5, mouth: 'smile', headTilt: 0.22, lean: 0.08, armL: [0.2, 0.2], armR: [0.2, 0.2] });
    // the cats waddle toward the chair
    const hic = (id) => { let h = 0; HICS.forEach(([a, who]) => { if (who === id) h = Math.max(h, decay(t, a, 9)); }); return h; };
    const hop = (id) => { let j = 0; HICS.forEach(([a, who]) => { if (who === id && t > a && t < a + 0.2) j = Math.sin(((t - a) / 0.2) * Math.PI) * 26; }); return j; };
    const walk = clamp((t - LAND) / (JUMP - LAND - 0.15));
    const leap = clamp((t - JUMP) / (FLOP - JUMP));
    [['ginger', 760, 1170, 0], ['tux', 900, 1290, 1]].forEach(([id, x0, x1, seed]) => {
      const bx = lerp(x0, x1 - 150, ease.inOutQuad(walk));
      const x = lerp(bx, x1, leap), y = FLOOR - Math.sin(leap * Math.PI) * 260 - leap * 180;
      const step = Math.sin((t - LAND) * 9 + seed * 2);
      if (leap > 0.98) return; // they land in the next shot
      cat(ctx, id, t, {
        x, y, s: 0.8, pose: 'stand', belly: id === 'ginger' ? 1.1 : 0.7, eyes: hic(id) > 0.5 ? 'wide' : 'open', lid: hic(id) > 0.5 ? 0 : 0.5,
        rest: 'w', bob: leap > 0 ? 0 : 6 * Math.abs(step), jump: hop(id), lean: leap > 0 ? 0.3 : 0.08 * step,
        armL: leap > 0 ? [1.8, 0.4] : [0.8, 1.1], armR: leap > 0 ? [1.8, 0.4] : [0.8, 1.1],
        footL: [0, leap > 0 ? 24 : 10 * Math.max(0, step)], footR: [0, leap > 0 ? 24 : 10 * Math.max(0, -step)],
        shadow: leap === 0,
      });
      if (hic(id) > 0.2) {
        const a = HICS.filter(([, w]) => w === id).map(([h]) => h).filter((h) => h <= t).pop();
        RV.wordPop(ctx, 'hic!', x + 70, y - 260, 56, t - a, { fill: '#ffffff', rot: 0.15, life: 0.3 });
      }
    });
    ctx.restore();
  }, CUT, { chapter: 'Full' });

  // ============================================================ 24.62  (the last hit)
  // They land on the chair in exactly the pose from the photo: the tuxedo sitting up, the ginger lying
  // down with one paw stretched out. A slow blink at the camera, eyes closing, asleep. Food is yummy.
  const SEAT_Y = FLOOR + RV.CHAIR_SEAT * CHAIR.s + 4;
  const TITLE = 25.55, SLEEP = 26.35;
  shot(FLOP, 'photoPose', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: FLOP - 0.05, z: 1.1, x: CHAIR.x, y: 640 },
      { t: FLOP, z: 1.55, x: CHAIR.x, y: 690, shake: 30, d: 0.12 },
      { t: 24.72, z: 1.62, x: CHAIR.x, y: 694, r: 0.015, shake: 12, d: 0.1, push: 0.07 },
    ], { pulse: 0 });
    RV.kitchen(ctx, t, { cupOpen: 1, tinInside: false, dusk: 0.85 });
    // a warm lamp glow on the chair
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, CHAIR.x, 640, 700, '#ffc070', 0.3); ctx.restore();
    const wob = RV.wobble(t - FLOP, 3, 6);
    ctx.save(); ctx.translate(CHAIR.x, FLOOR); ctx.rotate(wob * 0.03); ctx.translate(-CHAIR.x, -FLOOR);
    RV.chair(ctx, CHAIR.x, FLOOR, CHAIR.s, 'back');
    RV.chair(ctx, CHAIR.x, FLOOR, CHAIR.s, 'seat');
    const land = 1 + wob * 0.12;
    // eyes: look at the camera, one slow blink, then heavy lids and asleep
    const blinkT = (a) => clamp(1 - Math.abs(t - a) / 0.22);
    const lids = clamp((t - 25.9) / (SLEEP - 25.9));
    const asleep = t >= SLEEP;
    cat(ctx, 'tux', t, {
      x: CHAIR.x - 92, y: SEAT_Y, s: 0.84, shadow: false, squash: land, eyes: asleep ? 'closed' : 'open',
      blink: Math.max(blinkT(25.35), RV.blink(t, 3) * (lt > 0.4 ? 1 : 0)), lid: lids * 0.8, rest: 'w', look: [0.1, 0.25],
      headTilt: asleep ? -0.14 * clamp((t - SLEEP) / 0.4) : 0, tail: 0.1,
    });
    cat(ctx, 'ginger', t, {
      x: CHAIR.x + 92, y: SEAT_Y, s: 0.84, shadow: false, pose: 'loaf', drape: 1, squash: land, eyes: asleep ? 'closed' : 'open',
      blink: Math.max(blinkT(25.5), RV.blink(t, 8) * (lt > 0.4 ? 1 : 0)), lid: lids * 0.6, rest: 'w', look: [-0.15, 0.2],
      headTilt: asleep ? 0.1 * clamp((t - SLEEP) / 0.4) : 0, tail: 0.1,
    });
    ctx.restore();
    // impact lines either side of the cushion
    const pl = t - FLOP;
    if (pl < 0.35) {
      ctx.save(); ctx.globalAlpha *= 1 - pl / 0.35; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7;
      [-1, 1].forEach((sd) => {
        for (let i = 0; i < 3; i++) {
          const a = sd < 0 ? Math.PI + (i - 1) * 0.35 : (i - 1) * 0.35, r0 = 190 + pl * 160, r1 = r0 + 60;
          const cx = CHAIR.x, cy = SEAT_Y - 30;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.6); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.6); ctx.stroke();
        }
      });
      ctx.restore();
    }
    // Zzz
    if (asleep) {
      for (let i = 0; i < 3; i++) {
        const ph = RV.fract((t - SLEEP) * 0.45 + i / 3);
        if (t - SLEEP < i / 3 / 0.45) continue;
        ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
        RV.bigText(ctx, 'z', CHAIR.x + 150 + ph * 90 + Math.sin(ph * 6 + i) * 18, 660 - ph * 140, 40 + ph * 26, { fill: '#ffffff', shadow: false });
        ctx.restore();
      }
    }
    // the kids tiptoe in at the edge: "shh!"
    const peek = ease.outCubic(clamp((t - 26.5) / 0.5));
    if (peek > 0) {
      const hb = RV.kidHead('big');
      kid(ctx, 'big', t, { x: lerp(1860, 1650, peek), y: FLOOR, eyes: 'happy', mouth: 'o', open: 0.2, turn: -0.4, look: [-0.8, 0.3], armL: [0.3, 0.2], handR: [6, hb + 40], armsFront: 'R', headTilt: -0.1 });
      kid(ctx, 'little', t, { x: lerp(1940, 1750, peek), y: FLOOR, eyes: 'happy', mouth: 'smile', turn: -0.5, look: [-0.9, 0.3], armL: [0.2, 0.2], armR: [0.2, 0.2], headTilt: -0.15 });
    }
    ctx.restore();
    // the title
    RV.screen(ctx, (c) => {
      RV.wordPop(c, 'FLOP!', 1480, 830, 96, t - FLOP, { gradient: GRADS[0], rot: 0.12, life: 0.5 });
      const a = clamp((t - TITLE) / 0.3);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      RV.letters(c, 'FOOD IS YUMMY', W / 2, 150, 120, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], spacing: 4 }, (i) => {
        const p = RV.pop(t - TITLE - i * 0.05, 0.3);
        return { s: p, dy: Math.sin(t * 2 + i * 0.6) * 6 };
      });
      if (peek > 0.5) RV.wordPop(c, 'shh!', 1560, 330, 56, t - 26.8, { fill: '#ffffff', rot: -0.1 });
      c.restore();
    });
  }, CUT, { chapter: 'Asleep' });
})(globalThis.RV);
