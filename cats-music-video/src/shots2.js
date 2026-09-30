/* The storyboard, part 2 (8.6-18.7 s): the chorus. The drums crash in at 8.71 and the camera pulses on
 * every kick from here until the held chord at 20.1 s.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT, FLOOR = RV.FLOOR;
  const { shot, CUT, decay, lastIdx, cat, kid, lookAt, catDance, spoonIn, forkIn, dinner, TABLE, SEAT, GRADS, slamWord, spotlight, COUNTER, TIN_AT } = RV._shotHelpers;

  // ------------------------------------------------------------ party kit
  // food shooting out of the magic tin: item i leaves at t0 + i / rate and falls back down
  function fountain(ctx, t, t0, x, y, o = {}) {
    const rate = o.rate || 16, life = o.life || 1.9, g = o.g || 1500;
    const i1 = Math.floor((t - t0) * rate);
    for (let i = Math.max(0, Math.floor((t - t0 - life) * rate)); i <= i1; i++) {
      const lt = t - (t0 + i / rate);
      if (lt < 0 || lt > life) continue;
      const vx = (hash(i * 1.7) - 0.5) * (o.spread || 1500), vy = -(1100 + hash(i * 2.9) * 700);
      const px = x + vx * lt, py = y + vy * lt + 0.5 * g * lt * lt;
      if (py > (o.floor || 1300)) continue;
      RV.food(ctx, i, px, py, o.s || 0.9, lt * (hash(i) - 0.5) * 12);
    }
  }
  // coloured beams sweeping down from above (x0..x1 = where they hang)
  function partyLights(ctx, t, x0, x1, top = -300, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cols = ['255,79,163', '76,201,240', '255,210,63', '6,214,160'];
    for (let i = 0; i < 4; i++) {
      const sx = lerp(x0, x1, (i + 0.5) / 4), ang = Math.sin(t * 1.9 + i * 1.7) * 0.55;
      const len = 1600, w = 170;
      const ex = sx - Math.sin(ang) * len, ey = top + Math.cos(ang) * len;
      const g = ctx.createLinearGradient(sx, top, ex, ey);
      g.addColorStop(0, `rgba(${cols[i]},${0.42 * a})`); g.addColorStop(1, `rgba(${cols[i]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(sx - 18, top); ctx.lineTo(sx + 18, top);
      ctx.lineTo(ex + Math.cos(ang) * w, ey + Math.sin(ang) * w); ctx.lineTo(ex - Math.cos(ang) * w, ey - Math.sin(ang) * w);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function discoBall(ctx, x, y, r, t) {
    ctx.beginPath(); ctx.moveTo(x, y - 1500); ctx.lineTo(x, y - r); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    circle(ctx, x, y, r); fs(ctx, '#c9ccd6', 5);
    ctx.save(); circle(ctx, x, y, r); ctx.clip();
    const cell = r * 0.2, off = (t * 60) % cell;
    for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
      const k = hash(i * 7.1 + j * 13.3 + Math.floor(t * 10) * 0.37);
      ctx.fillStyle = k > 0.82 ? '#ffffff' : k > 0.5 ? '#e3e7ef' : k > 0.25 ? '#b4bac7' : '#8a91a0';
      ctx.fillRect(x + i * cell + off - cell / 2 + 1, y + j * cell - cell / 2 + 1, cell - 2, cell - 2);
    }
    ctx.restore();
    circle(ctx, x, y, r); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    RV.sparkle(ctx, x - r * 0.4, y - r * 0.45, r * 0.55 * (0.6 + 0.4 * Math.sin(t * 9)), '#ffffff');
  }
  // a lighter held up at a concert
  const lighter = (ctx, h) => {
    rrect(ctx, h[0] - 9, h[1] - 34, 18, 34, 4); fs(ctx, '#4cc9f0', 3);
    const f = 1 + 0.12 * Math.sin(RV._t * 30 + h[0]);
    ctx.save(); ctx.translate(h[0], h[1] - 38); ctx.scale(1, f);
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(12, -8, 0, 4); ctx.quadraticCurveTo(-12, -8, 0, -30); fs(ctx, '#ffd23f', 3);
    ctx.restore();
  };

  // ============================================================ 8.62  I EAT...
  // The drop: the old tin turns out to be magic. Food erupts out of it, the disco ball comes down, and
  // everyone dances while the cats hold "eeeeeeat" with their mouths wide open.
  const DROP = 8.71;
  shot(8.62, 'feast', (ctx, S) => {
    const { t } = S;
    const on = t >= DROP;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 8.62, z: 2.3, x: TIN_AT.x, y: 590, shake: 8 },
      { t: DROP, z: 0.98, x: 400, y: 560, shake: 36, d: 0.18 },
      { t: 9.37, z: 1.4, x: 0, y: 470, r: 0.04, shake: 10 },
      { t: 9.7, z: 1.3, x: 780, y: 640, r: -0.035, shake: 10 },
    ], { pulse: 0.035 });
    RV.kitchen(ctx, t, { cupOpen: 1, tinInside: false });
    partyLights(ctx, t, -500, 1400, -300, on ? 1 : 0);
    if (on) discoBall(ctx, 560, lerp(-300, 150, ease.outBack(clamp((t - DROP) / 0.4), 1.4)), 70, t);
    // the tin shakes, then blows
    const rumble = on ? 0 : Math.sin(t * 90) * 6;
    RV.oldTin(ctx, TIN_AT.x + rumble, TIN_AT.y, 0.8, t, 1, 1);
    if (on) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, TIN_AT.x, TIN_AT.y - 100, 420, '#fff3b0', 0.5 * (1 - clamp((t - DROP) / 0.5)) + 0.2); ctx.restore();
    }
    // the cats on the counter, paws up, catching dinner
    const cm = (id, seed) => on ? Object.assign(catDance('paws', t, seed), { eyes: 'happy', rest: 'smile' })
      : { pose: 'stand', eyes: 'wide', dilate: 1, rest: 'o', armL: [0.5, 0.4], armR: [0.5, 0.4], look: [id === 'tux' ? 0.9 : 1, 0.3], bob: 6 };
    cat(ctx, 'ginger', t, Object.assign(cm('ginger', 0), { x: -170, y: COUNTER + 2, s: 0.75, shadow: false, belly: 0.3 }));
    cat(ctx, 'tux', t, Object.assign(cm('tux', 1), { x: 60, y: COUNTER + 2, s: 0.75, shadow: false }));
    // the kids on the floor, dancing in the food
    const dance = (name, seed) => on ? Object.assign(RV.move(name, t, seed), { eyes: 'happy', mouth: 'grin' })
      : Object.assign(RV.move('idle', t, seed), { eyes: 'wide', mouth: 'o', open: 0.3, ...lookAt(600 + seed * 200, TIN_AT.x, -0.4) });
    kid(ctx, 'big', t, Object.assign(dance('cheer', 0), { x: 600, y: FLOOR }));
    kid(ctx, 'boy', t, Object.assign(dance('twist', 1), { x: 800, y: FLOOR }));
    kid(ctx, 'little', t, Object.assign(dance('cheer', 2), { x: 990, y: FLOOR }));
    if (on) {
      fountain(ctx, t, DROP, TIN_AT.x, TIN_AT.y - 110, { floor: 1250, s: 1.15, rate: 20 });
      RV.foodRain(ctx, t, DROP + 0.15, { n: 34, x0: -700, x1: 1500, y0: -400, yMax: 1300, s: 1.1 });
    }
    // until the drop it is still the dark of the heist
    spotlight(ctx, TIN_AT.x, 560, 380, on ? 0 : 0.8);
    ctx.restore();
    if (on) RV.flash(ctx, 0.9 * (1 - clamp((t - DROP) / 0.2)));
  }, CUT, { chapter: 'I eat every day' });

  // ============================================================ 10.03  ...EVERY DAY
  // Back at the table: the calendar flips through the whole week in one second, and every day there's
  // something new on the plates.
  const FLIPS = [10.03, 10.18, 10.32, 10.47, 10.61, 10.76, 10.9];
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const CAL = { x: 700, y: 250, s: 1.5 };
  shot(10.03, 'everyDay', (ctx, S) => {
    const { t } = S;
    const k = Math.max(0, lastIdx(t, FLIPS));
    ctx.save();
    RV.snapCam(ctx, t, [{ t: 10.0, z: 1.3, x: 820, y: 470 }].concat(FLIPS.map((a, i) => ({
      t: a, z: 1.3 + i * 0.05 + (i === 3 ? 0.15 : 0), x: 820 - (i % 2 ? 30 : 0), y: 470, r: i % 2 ? 0.025 : -0.025, d: 0.08, shake: 6,
    }))).concat([{ t: 11.05, z: 1.75, x: 780, y: 420, r: 0, d: 0.16, shake: 12 }]), { pulse: 0.03 });
    RV.kitchen(ctx, t, { calPage: DAYS[k], calS: CAL.s });
    // the page that was just torn off
    if (k > 0) {
      const f = clamp((t - FLIPS[k]) / 0.3);
      if (f < 1) {
        ctx.save(); ctx.translate(CAL.x - 70 * CAL.s + f * 220, CAL.y - 46 * CAL.s + f * f * 380); ctx.rotate(-f * 2.4); ctx.scale(CAL.s, CAL.s);
        ctx.globalAlpha *= 1 - f * 0.6;
        rrect(ctx, 0, 0, 140, 136, 6); fs(ctx, '#ffffff', 4);
        ctx.font = `54px ${RV.FONT.title}`; ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(DAYS[k - 1], 70, 58);
        ctx.restore();
      }
    }
    const chomp = decay(t, FLIPS[k], 10);
    dinner(ctx, t, {
      foodG: k, foodT: k + 2,
      ginger: { eyes: 'happy', headTilt: 0.2 * chomp * (k % 2 ? 1 : -1), rest: 'tongue', bob: 6 * chomp },
      tux: { eyes: 'happy', headTilt: -0.2 * chomp * (k % 2 ? 1 : -1), rest: 'tongue', bob: 6 * chomp },
      pawsUp: { ginger: [0.2 + 0.5 * chomp, 0.2 + 0.5 * chomp], tux: [0.5 * chomp, 0] },
    });
    ctx.restore();
    RV.screen(ctx, (c) => slamWord(c, t, FLIPS[6], 'EVERY DAY!', W / 2 + 330, 170, 96, 1, { dur: 0.45 }));
  }, { type: 'flash', dur: 0.1, pre: 0.02 }, { chapter: 'Every day' });

  // ============================================================ 11.25  A-A-A A-A-A AAAAY!
  // The tuxedo takes the stage (the dinner table) with a fork for a microphone. Nine staccato notes, nine
  // steps closer; then the long "aaaay!" with his arms out, the room waving lighters.
  const A_NOTES = [11.27, 11.44, 11.6, 11.75, 11.9, 12.06, 12.23, 12.41, 12.57];
  const AAAY = 12.79;
  const STAGE = { x: 960, y: 784, s: 0.82 };
  shot(11.25, 'tuxSolo', (ctx, S) => {
    const { t } = S;
    RV._t = t;
    const k = lastIdx(t, A_NOTES);
    const held = t >= AAAY;
    const hy = STAGE.y - 250 * STAGE.s; // his face
    ctx.save();
    RV.snapCam(ctx, t, [{ t: 11.2, z: 1.1, x: 960, y: 560 }]
      .concat(A_NOTES.map((a, i) => ({ t: a, z: 1.2 * Math.pow(1.075, i), x: 960 + (i % 2 ? 14 : -14), y: lerp(560, hy + 30, i / 8), r: i % 2 ? 0.035 : -0.035, d: 0.07, shake: 5 })))
      .concat([{ t: AAAY, z: 1.3, x: 960, y: 500, r: 0, d: 0.28, shake: 14, push: 0.3 }]), { pulse: 0.02 });
    RV.kitchen(ctx, t);
    // the big note: a sunburst behind him
    if (held) {
      ctx.save(); ctx.globalAlpha = 0.55 * clamp((t - AAAY) / 0.2);
      RV.sunburst(ctx, STAGE.x, hy, t, { n: 16, colors: ['#ffd23f', '#ff9f1c'], r: 1600, speed: 0.8 });
      ctx.restore();
    }
    dinner(ctx, t, { ginger: null, tux: null, plates: false, cutlery: false });
    const note = k >= 0 && !held ? decay(t, A_NOTES[k], 12) : 0;
    const hold = held ? ease.outBack(clamp((t - AAAY) / 0.25), 1.6) : 0;
    cat(ctx, 'tux', t, {
      x: STAGE.x, y: STAGE.y, s: STAGE.s, pose: 'stand', shadow: false, rest: 'smile',
      eyes: held ? 'squeeze' : k >= 0 ? (k % 3 === 2 ? 'squeeze' : 'happy') : 'open',
      bob: -10 * note, headTilt: held ? -0.16 + 0.04 * Math.sin(t * 20) : (k % 2 ? 0.12 : -0.12) * (k >= 0 ? 1 : 0),
      footL: [0, held ? 0 : 12 * note * (k % 2 ? 1 : 0)], footR: [0, held ? 0 : 12 * note * (k % 2 ? 0 : 1)],
      // fork mic held up to his chin, the other paw flung out; both out wide on the big note
      handR: held ? null : [66, -196], armR: held ? [lerp(0.8, 2.05, hold), 0.3] : null, holdR: forkIn(held ? 0.5 : 0.42, 0.85),
      armL: held ? [lerp(0.8, 2.1, hold), 0.25] : [1.2 + 0.5 * note, 0.4],
      tail: 1,
    });
    // stage lighting: the room goes dark around a spotlight on the table
    spotlight(ctx, STAGE.x, hy + 60, 520, 0.62, '20,8,40');
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, -300, 0, STAGE.y);
    g.addColorStop(0, 'rgba(255,244,200,0)'); g.addColorStop(1, 'rgba(255,244,200,0.28)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(STAGE.x - 60, -300); ctx.lineTo(STAGE.x + 60, -300); ctx.lineTo(STAGE.x + 300, STAGE.y + 10); ctx.lineTo(STAGE.x - 300, STAGE.y + 10); ctx.closePath(); ctx.fill();
    ctx.restore();
    // the fans: the ginger and the kids at the front, lighters up
    const sway = (seed) => Math.sin(t * 3.2 + seed);
    kid(ctx, 'big', t, { x: 420, y: FLOOR + 40, s: 1.05, turn: 0.5, look: [0.8, -0.8], eyes: 'happy', rest: 'grin', armR: [2.3 + 0.15 * sway(0), 0.2], armL: [0.3, 0.2], holdR: lighter, lean: 0.05 * sway(0) });
    kid(ctx, 'little', t, { x: 1500, y: FLOOR + 40, s: 1.05, turn: -0.5, look: [-0.8, -0.8], eyes: 'happy', rest: 'grin', armL: [2.3 + 0.15 * sway(2), 0.2], armR: [0.3, 0.2], holdL: lighter, lean: 0.05 * sway(2) });
    cat(ctx, 'ginger', t, { x: 1250, y: FLOOR + 30, s: 0.8, pose: 'stand', eyes: 'heart', rest: 'smile', armL: [2.2 + 0.2 * sway(1), 0.2], armR: [2.2 - 0.2 * sway(1), 0.2], headTilt: 0.1 * sway(1), look: [-0.6, -0.8] });
    kid(ctx, 'boy', t, { x: 680, y: FLOOR + 50, s: 1.08, turn: 0.3, look: [0.5, -0.9], eyes: 'happy', rest: 'grin', armL: [2.4, 0.2], armR: [2.4, 0.2], lean: 0.06 * sway(3) });
    if (held) RV.musicNotes(ctx, t, STAGE.x + 120, hy - 40, { n: 6, rise: 360 });
    ctx.restore();
  }, { type: 'zoom', dur: 0.18, pre: 0.06, x: 960, y: 500 }, { chapter: 'A-a-a aaay!' });

  // ============================================================ 13.69  A-A-AY, AY!
  // The ginger yodels from the top of the fridge. The glasses on the shelf start to crack on the high
  // "AY" and shatter on the top note (15.75); the kids and the tuxedo cover their ears.
  const Y_NOTES = [13.72, 14.05, 14.26, 14.41, 14.56];
  const CRACK = 15.04, SHATTER = 15.75;
  const FR = { x: 1860, top: FLOOR + 8 - 560 };
  shot(13.69, 'yodel', (ctx, S) => {
    const { t } = S;
    const k = lastIdx(t, Y_NOTES);
    const crack = t < CRACK ? 0 : t < SHATTER ? lerp(0.35, 0.9, (t - CRACK) / (SHATTER - CRACK)) : 1;
    const ears = clamp((t - 14.56) / 0.12);
    const gy = FR.top - 250 * 0.8; // her face
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 13.6, z: 1.55, x: FR.x - 40, y: gy + 40 },
      { t: 14.05, z: 1.75, x: FR.x - 20, y: gy + 30, r: 0.045, shake: 8 },
      { t: 14.26, z: 1.95, x: FR.x - 20, y: gy + 20, r: -0.045, shake: 8 },
      { t: 14.56, z: 1.12, x: 1480, y: 560, r: 0.02, shake: 12, d: 0.16 },
      { t: CRACK, z: 2.5, x: 1490, y: 330, r: -0.04, shake: 14 },
      { t: 15.3, z: 1.45, x: 1330, y: 640, r: 0.03, shake: 10 },
      { t: 15.52, z: 1.9, x: FR.x - 30, y: gy + 20, r: -0.06, shake: 16 },
      { t: SHATTER, z: 1.2, x: 1520, y: 520, shake: 34, d: 0.14 },
    ], { pulse: 0.03 });
    RV.kitchen(ctx, t, { crack });
    // shards and a burst where the glasses were
    if (t > SHATTER) {
      RV.impact(ctx, 1490, 320, t - SHATTER, { r: 220, life: 0.35, color: '#e0f7ff', inner: '#9be7ff' });
      for (let i = 0; i < 14; i++) {
        const lt = t - SHATTER, a = hash(i * 3.1) * TAU, v = 300 + hash(i * 5.3) * 500;
        const px = 1490 + (hash(i) - 0.5) * 240 + Math.cos(a) * v * lt, py = 320 + Math.sin(a) * v * lt * 0.6 + 900 * lt * lt;
        ctx.save(); ctx.translate(px, py); ctx.rotate(lt * 9 + i);
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, 7); ctx.lineTo(-8, 6); ctx.closePath();
        ctx.fillStyle = 'rgba(210,245,255,0.9)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.restore();
      }
    }
    // the ginger on the fridge: arms out, eyes squeezed shut, ears back
    const note = k >= 0 ? decay(t, Y_NOTES[k], 10) : 0;
    cat(ctx, 'ginger', t, {
      x: FR.x, y: FR.top + 2, s: 0.8, pose: 'stand', shadow: false, eyes: 'squeeze', rest: 'smile',
      armL: [2.1 + 0.1 * note, 0.25], armR: [2.1 - 0.1 * note, 0.25], earL: 0.35, earR: 0.35,
      headTilt: (k % 2 ? 0.1 : -0.1) * (k >= 0 ? 1 : 0) + (t > CRACK ? 0.04 * Math.sin(t * 40) : 0), bob: -8 * note, belly: 0.3,
    });
    // sound waves
    if (t > 14.56) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6;
      for (let i = 0; i < 3; i++) {
        const r = 80 + RV.fract(t * 2.5 + i / 3) * 260;
        ctx.globalAlpha = 1 - RV.fract(t * 2.5 + i / 3);
        ctx.beginPath(); ctx.arc(FR.x, gy + 40, r, Math.PI * 0.75, Math.PI * 1.25); ctx.stroke();
      }
      ctx.restore();
    }
    // the audience below: hands (and paws) over their ears
    const cover = (id) => {
      const r = RV.KIDS[id].headR, hy = RV.kidHead(id);
      return ears > 0 ? { handL: [lerp(-40, -r - 4, ears), lerp(-150, hy + 6, ears)], handR: [lerp(40, r + 4, ears), lerp(-150, hy + 6, ears)], armsFront: 'LR', eyes: 'squeeze', mouth: 'wavy' } : { armL: [0.3, 0.2], armR: [0.3, 0.2] };
    };
    kid(ctx, 'big', t, Object.assign({ x: 1130, y: FLOOR, ...lookAt(1130, FR.x, -0.9), rest: 'o' }, cover('big')));
    kid(ctx, 'boy', t, Object.assign({ x: 1320, y: FLOOR, ...lookAt(1320, FR.x, -0.9), rest: 'o' }, cover('boy')));
    kid(ctx, 'little', t, Object.assign({ x: 1500, y: FLOOR, ...lookAt(1500, FR.x, -0.9), rest: 'o' }, cover('little')));
    cat(ctx, 'tux', t, Object.assign({ x: 1640, y: FLOOR, s: 0.75, pose: 'stand', rest: 'w', look: [0.5, -0.9] },
      ears > 0 ? { handL: [-48, -304], handR: [48, -304], earL: 1, earR: 1, eyes: 'squeeze', mouth: 'w' } : { armL: [0.4, 0.3], armR: [0.4, 0.3] }));
    ctx.restore();
  }, { type: 'whip', dur: 0.24, pre: 0.1 }, { chapter: 'A-a-AY, ay!' });

  // ============================================================ 16.02  YUM IN MY TUM
  // After all that food the ginger has a very round tummy, and the tuxedo plays it like a drum.
  const BELLY = [16.03, 16.36, 16.53, 16.7];
  const GIN = { x: 1210, s: 0.95 };
  const TUX12 = { x: 1000, s: 0.8 };
  shot(16.02, 'bellyDrum', (ctx, S) => {
    const { t } = S;
    const k = lastIdx(t, BELLY);
    const hit = k >= 0 ? decay(t, BELLY[k], 11) : 0;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 16.0, z: 1.45, x: 1110, y: 720 },
      { t: BELLY[0], z: 1.6, x: 1130, y: 740, r: -0.05, shake: 12 },
      { t: BELLY[1], z: 1.8, x: 1160, y: 760, r: 0.05, shake: 12 },
      { t: BELLY[2], z: 2.0, x: 1150, y: 780, r: -0.05, shake: 12 },
      { t: BELLY[3], z: 1.35, x: 1110, y: 700, r: 0.02, shake: 24, d: 0.14 },
    ], { pulse: 0.03 });
    RV.kitchen(ctx, t);
    // the kids watching from the table end, giggling
    kid(ctx, 'boy', t, { x: 1480, y: FLOOR, turn: -0.5, look: [-0.8, 0.3], eyes: 'happy', mouth: 'grin', armL: [0.3, 0.3], armR: [1.0, -1.7], bob: 4 * hit });
    kid(ctx, 'little', t, { x: 1640, y: FLOOR, turn: -0.5, look: [-0.8, 0.3], eyes: 'happy', mouth: 'grin', armL: [0.9, -1.8], armR: [0.3, 0.3], bob: 4 * hit });
    // the ginger, big round tummy wobbling on every hit
    cat(ctx, 'ginger', t, {
      x: GIN.x, y: FLOOR, s: GIN.s, pose: 'stand', belly: 1 + 0.25 * hit, eyes: 'happy', rest: 'smile',
      squash: 1 - 0.05 * hit, headTilt: 0.12 * Math.sin(t * 6), armL: [0.9, 0.9], armR: [0.95, 1.0],
    });
    // the tuxedo drums it with two spoons (he stands just in front of her, to the left)
    const side = k >= 0 ? (k % 2 ? 1 : -1) : 0;
    const bx = (GIN.x - 80 * GIN.s - TUX12.x) / TUX12.s, by = (FLOOR - 150 * GIN.s - FLOOR) / TUX12.s;
    const handAt = (which) => {
      const down = which === side ? hit : 0;
      // chest height, well clear of his chin
      return [lerp(70, 95, down) + (which > 0 ? 18 : 0), lerp(-192, -158, down) + (which > 0 ? 12 : 0)];
    };
    const spoonTo = (h) => Math.atan2(bx - h[0], -(by - h[1]));
    const hL = handAt(-1), hR = handAt(1);
    cat(ctx, 'tux', t, {
      x: TUX12.x, y: FLOOR, s: TUX12.s, pose: 'stand', eyes: 'happy', rest: 'smile', turn: 0.5, look: [1, 0.3],
      handL: hL, handR: hR, holdL: spoonIn(spoonTo(hL)), holdR: spoonIn(spoonTo(hR)), bob: -6 * hit,
    });
    if (k >= 0) {
      const bxw = GIN.x - 60 * GIN.s, byw = FLOOR - 150 * GIN.s;
      ctx.save(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 7; ctx.globalAlpha = hit;
      for (let i = 0; i < 5; i++) { const a = Math.PI + (i - 2) * 0.35; ctx.beginPath(); ctx.moveTo(bxw + Math.cos(a) * 70, byw + Math.sin(a) * 70); ctx.lineTo(bxw + Math.cos(a) * 120, byw + Math.sin(a) * 120); ctx.stroke(); }
      ctx.restore();
      RV.wordPop(ctx, ['YUM', 'IN', 'MY', 'TUM!'][k], [1000, 1320, 1010, 1180][k], [520, 520, 470, 440][k], k === 3 ? 120 : 90, t - BELLY[k], { gradient: GRADS[k], rot: k % 2 ? 0.1 : -0.1, life: k === 3 ? 0.6 : 0.3 });
    }
    ctx.restore();
  }, { type: 'flash', dur: 0.1, pre: 0.02 }, { chapter: 'Yum in my tum' });

  // ============================================================ 17.02  HIP HIP HOORAY!
  // Everyone in a row: the kids jump on the first "hip", the cats on the second, and on "hooray!" the
  // whole lot of them, with confetti.
  const HIP1 = 17.06, HIP2 = 17.26, HOORAY = 17.62;
  const ROW = [['kid', 'big', 470], ['cat', 'tux', 690], ['kid', 'boy', 900], ['cat', 'ginger', 1120], ['kid', 'little', 1340]];
  const jumpAt = (t, a, h = 90) => (t < a ? 0 : h * Math.abs(Math.sin(Math.PI * clamp((t - a) / 0.42))) * (t - a < 0.42 ? 1 : 0));
  function hoorayRow(ctx, t) {
    ROW.forEach(([kind, id, x]) => {
      const first = kind === 'kid' ? HIP1 : HIP2;
      let j = Math.max(jumpAt(t, first), jumpAt(t, HOORAY, 150), jumpAt(t, HOORAY + 0.42, 110), jumpAt(t, HOORAY + 0.84, 80));
      const up = t >= HOORAY || (t >= first && t < first + 0.42);
      if (kind === 'kid') {
        kid(ctx, id, t, {
          x, y: FLOOR, jump: j, eyes: up ? 'happy' : 'open', rest: up ? 'grin' : 'smile',
          armL: up ? [2.35, 0.2] : [0.3, 0.2], armR: up ? [2.35, 0.2] : [0.3, 0.2],
          footL: [0, j > 5 ? 16 : 0], footR: [0, j > 5 ? 16 : 0],
        });
      } else {
        cat(ctx, id, t, {
          x, y: FLOOR, s: 0.85, pose: 'stand', jump: j, eyes: up ? 'happy' : 'open', rest: 'smile',
          armL: up ? [2.1, 0.3] : [0.4, 0.3], armR: up ? [2.1, 0.3] : [0.4, 0.3], tail: 1,
          footL: [0, j > 5 ? 14 : 0], footR: [0, j > 5 ? 14 : 0], belly: id === 'ginger' ? 0.6 : 0,
        });
      }
    });
  }
  RV._hoorayRow = hoorayRow;
  shot(17.02, 'hooray', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 17.0, z: 1.3, x: 700, y: 640 },
      { t: HIP1, z: 1.45, x: 690, y: 640, r: -0.04, shake: 12 },
      { t: HIP2, z: 1.55, x: 910, y: 700, r: 0.04, shake: 12 },
      { t: HOORAY, z: 1.12, x: 905, y: 600, shake: 34, d: 0.18 },
      { t: 18.02, z: 1.24, x: 905, y: 620, r: 0.025, shake: 10 },
      { t: 18.35, z: 1.16, x: 905, y: 610, r: -0.02, shake: 8 },
    ], { pulse: 0.035 });
    RV.kitchen(ctx, t, { cupOpen: 1, tinInside: false });
    partyLights(ctx, t, 100, 1700, -300, t >= HOORAY ? 1 : 0.4);
    RV.table(ctx, TABLE.x0, TABLE.x1, TABLE.y, { cloth: true });
    hoorayRow(ctx, t);
    if (t >= HOORAY) {
      RV.confetti(ctx, t, { t0: HOORAY, x: 905, y: 330, n: 130, spread: 3.2, life: 2.4 });
      fountain(ctx, t, HOORAY, 905, 200, { rate: 10, spread: 2200, floor: 1300 });
    }
    ctx.restore();
    RV.screen(ctx, (c) => {
      slamWord(c, t, HIP1, 'HIP!', 420, 180, 110, 0, { dur: 0.3 });
      slamWord(c, t, HIP2, 'HIP!', 1500, 180, 110, 3, { dur: 0.3 });
      slamWord(c, t, HOORAY, 'HOORAY!', W / 2, 180, 160, 2, { dur: 1.1 });
    });
  }, { type: 'zoom', dur: 0.14, pre: 0.06 }, { chapter: 'Hip hip hooray!' });

  Object.assign(RV._shotHelpers, { fountain, partyLights, discoBall, lighter, DROP });
})(globalThis.RV);
