/* The storyboard, part 3 (31 s to the end): "maybe he is obsessed after all", THE END, and the encore
 * the song tacks on after it.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT, FLOOR = RV.FLOOR;
  const { shot, CUT, decay, lastIdx, glide, ben, suitBen, fairyBen, cousin, lookAt, shades, choir, darkStage, driftTeeth, BOWS } = RV._shotHelpers;

  // ============================================================ 31.10  (MAYBE HE IS OBSESSED AFTER ALL)
  // The slowest shot: Ben's secret room. A mosaic grin made of teeth, candles, and Ben in his tooth suit
  // on a throne of teeth, stroking a big tooth in his lap like a cat. The singing teeth whisper from the
  // shadows. On "all" he slowly turns to us and grins.
  const TURN = 36.1;
  shot(31.1, 'obsessed', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(31.0, 1.0, 960, 560),
      glide(31.1, 1.75, 960, 610, 6.2),
      glide(TURN, 2.05, 960, 600, 1.2),
    ], { pulse: 0 });
    // the mosaic mouth slowly opens wider... and chomps once on "obsessed"
    const chomp = t < 34.14 ? 0 : Math.sin(clamp((t - 34.14) / 0.35) * Math.PI);
    RV.shrine(ctx, t, { gap: clamp(lt / 3) * 24 - chomp * 70 });
    // the whisper choir, half in shadow
    ctx.save(); ctx.globalAlpha *= 0.8;
    choir(ctx, t, 330, 560, 905, 0.7, { n: 2, shadows: false, eyes: () => 'closed' });
    choir(ctx, t, 1360, 1590, 905, 0.7, { n: 2, shadows: false, eyes: () => 'closed' });
    ctx.restore();
    RV.toothThrone(ctx, 960, FLOOR, 1, t);
    const turned = ease.inOutSine(clamp((t - TURN) / 0.8));
    const grin = t > TURN + 0.5;
    const stroke = Math.sin(t * 2.2);
    suitBen(ctx, t, {
      x: 960, y: FLOOR, s: 0.9, legs: 172 / 0.9, shadow: false, rest: grin ? 'grin' : 'smile',
      eyes: grin ? 'open' : 'open', lid: lerp(0.55, 0.1, turned), look: [0, lerp(0.85, 0, turned)], headTilt: lerp(0.1, 0, turned),
      handL: [-58, -118], handR: [30 + stroke * 30, -160 + Math.abs(stroke) * 12], blush: 0.8,
      holdL: (c, h) => RV.tooth(c, 0, -140, 0.62, { lw: 4, face: { eyes: 'happy', mouth: 'smile' } }),
    });
    if (grin) RV.sparkle(ctx, 985, FLOOR - 172 - 257 * 0.9 + 40, 40 * Math.sin(clamp((t - TURN - 0.6) / 0.5) * Math.PI), '#ffffff');
    // the sack of teeth and some coins at his feet
    RV.toothSack(ctx, [1180, 880], 1, t);
    // dust motes in the candlelight
    RV.sparkleField(ctx, t, { n: 18, size: 10, color: '#ffd9a0', speed: 0.3, y0: 150, y1: 980 });
    ctx.restore();
    // slow vignette closing in
    RV.screen(ctx, (c) => RV.vignette(c, 0.35 + 0.25 * clamp(lt / 6)));
  }, { type: 'black', dur: 0.5, pre: 0.25 }, { chapter: 'Maybe he is obsessed' });

  // ============================================================ 37.55  THEEEEEEEE, END!!!
  // A stage. Ben (in the suit) and the singing teeth take a bow while the red curtains slide shut, letter by
  // letter: T, H, E... and on "END!!!" they slam, and Ben pokes his head through the gap.
  const LETTERS = [37.7, 38.2, 38.7];
  const SLAM = 39.2;
  function stageCurtains(ctx, t, close, o = {}) {
    // close: 0 open (off screen) .. 1 shut (meeting in the middle)
    const blow = o.blow || 0;
    [-1, 1].forEach((side) => {
      const edge = side < 0 ? lerp(-240, W / 2 + 6, close) : lerp(W + 240, W / 2 - 6, close);
      const outer = side < 0 ? -400 : W + 400;
      ctx.beginPath(); ctx.moveTo(outer, -60); ctx.lineTo(edge, -60);
      for (let k = 1; k <= 10; k++) {
        const yy = -60 + k * 120;
        ctx.lineTo(edge + Math.sin(t * 9 + k * 0.9) * blow * 26 * (k / 10) + Math.sin(k * 1.3) * 8 * side, yy);
      }
      ctx.lineTo(outer, H + 100); ctx.closePath();
      fs(ctx, '#b3122e', 6);
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(80,0,20,0.45)'; ctx.lineWidth = 18;
      for (let k = 0; k < 7; k++) { const x = lerp(outer, edge, (k + 0.5) / 7); ctx.beginPath(); ctx.moveTo(x, -60); ctx.lineTo(x + Math.sin(t * 9 + k) * blow * 20, H + 100); ctx.stroke(); }
      ctx.restore();
    });
    ctx.beginPath(); ctx.moveTo(-300, -60); ctx.lineTo(W + 300, -60); ctx.lineTo(W + 300, 96);
    for (let x = W + 300; x > -300; x -= 120) ctx.quadraticCurveTo(x - 60, 156, x - 120, 96);
    ctx.closePath(); fs(ctx, '#8e0e25', 6);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6; ctx.beginPath();
    for (let x = W + 300; x > -300; x -= 120) { ctx.moveTo(x, 86); ctx.quadraticCurveTo(x - 60, 142, x - 120, 86); }
    ctx.stroke();
  }
  RV._stageCurtains = stageCurtains;
  shot(37.55, 'theEnd', (ctx, S) => {
    const { t } = S;
    const close = t < SLAM ? ease.inOutSine(clamp((t - 37.6) / (SLAM - 37.6))) * 0.94 : 1;
    const slam = t >= SLAM;
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(37.5, 1.0, 960, 540),
      glide(37.55, 1.08, 960, 560, 1.6),
      { t: SLAM, z: 1.0, x: 960, y: 540, d: 0.12, shake: 22 },
    ], { pulse: 0 });
    if (close < 1) {
      // the show behind the curtains: everyone bowing
      darkStage(ctx, t, [960, 560, 1360], { alpha: [1, 0.6, 0.6] });
      const bow = Math.max(0, Math.sin((t - 37.6) * 2.4));
      choir(ctx, t, 520, 1400, 860 + bow * 14, 0.95, { n: 5, eyes: () => 'happy' });
      suitBen(ctx, t, { x: 960, y: FLOOR, s: 0.85, rest: 'grin', eyes: 'happy', lean: 0.25 * bow, armL: [1.6, 0.5], armR: [1.6, 0.5] });
    }
    ctx.restore();
    RV.screen(ctx, (c) => {
      stageCurtains(c, t, close, { blow: slam ? decay(t, SLAM, 3) * 2 : 0.15 });
      // THE ... END!!!
      ['T', 'H', 'E'].forEach((ch, i) => {
        const p = RV.pop(t - LETTERS[i], 0.35);
        if (p <= 0) return;
        c.save(); c.translate(W / 2 - 110 + i * 110, 190); c.scale(p, p); c.rotate((i - 1) * 0.08);
        RV.bigText(c, ch, 0, 0, 140, { gradient: ['#fff3b0', '#ffd23f', '#e0a800'], font: RV.FONT.title });
        c.restore();
      });
      if (slam) {
        RV.slam(c, 'END!!!', W / 2, 460, 170, t - SLAM, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], hold: true, rot: -0.05, burstC: '#ffffff' });
        // Ben pokes his head through the gap in the curtains
        const pk = ease.outBack(clamp((t - SLAM - 0.15) / 0.3), 1.8);
        if (pk > 0) {
          c.save(); c.beginPath(); c.rect(0, 720, W, 400); c.clip();
          RV.drawKidHead(c, 'ben', { x: W / 2, y: lerp(1200, 880, pk), s: 1.4, t, eyes: 'happy', mouth: 'grin', headTilt: 0.12 * Math.sin(t * 4), neck: false });
          c.restore();
        }
      }
    });
  }, CUT, { chapter: 'The end' });

  // ============================================================ 40.10  (HE LIKES TEETH, OOOOOOH...)
  // ...it isn't over. The curtains swing open again for an encore: the singing teeth, Ben in his suit, the
  // cousins, Rusty and the cats, all swaying under the tooth moon while the credits roll.
  const CREDITS = [
    ['HE LIKES TEETH', 'a song by Ben’s cousins'],
    ['BEN', 'as himself'],
    ['THE COUSINS', 'as the cousins'],
    ['RUSTY & THE CATS', 'as everyone'],
    ['THE TEETH', 'as themselves'],
    ['NO TEETH WERE HARMED', 'they all got money'],
  ];
  shot(40.1, 'encore', (ctx, S) => {
    const { t } = S;
    const open = 1 - ease.inOutCubic(clamp((t - 40.1) / 0.55));
    const sway = (seed) => Math.sin(Math.PI * RV.half(t) * 0.5 + seed);
    const bob = 7 * RV.kick(t, 5) * RV.groove(t);
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(40.0, 1.0, 960, 560),
      glide(40.1, 1.25, 960, 640, 0.8),
      glide(41.1, 1.05, 960, 560, 8.5),
    ], { pulse: 0.015 });
    darkStage(ctx, t, [960, 420, 1500], { alpha: [1, 0.7, 0.7], top: '#0e0828', bottom: '#2a1650' });
    RV.stars(ctx, t, { n: 120, x0: -400, x1: 2300, y0: -400, y1: 520, seed: 7 });
    RV.toothMoon(ctx, 960, 150 + Math.sin(t * 0.5) * 8, 80, t);
    // back row
    const row = [['big', 330], ['boy', 520], ['little', 700]];
    row.forEach(([id, x], i) => cousin(ctx, id, t, {
      x, y: FLOOR, rest: 'smile', eyes: 'happy', lean: 0.07 * sway(i * 0.6), headTilt: 0.08 * sway(i * 0.6), bob,
      armL: [2.25 + 0.1 * sway(i), 0.25], armR: [0.3, 0.2], holdL: (c, h) => RV.tooth(c, h[0], h[1] - 34, 0.32, { lw: 3, rot: 0.3 * sway(i) }),
      mouth: RV.sings(t, 'teeth') ? 'sing' : 'smile', open: RV.singOpen(t, 1) * 0.8,
    }));
    RV.shadow(ctx, 1240, FLOOR + 4, 90, 0.22);
    RV.drawRusty(ctx, { x: 1240, y: FLOOR, s: 0.95, t, eyes: 'happy', mouth: RV.sings(t, 'teeth') ? 'howl' : 'tongue', wag: 1, headTilt: 0.12 * sway(2), blink: RV.blink(t, 9) });
    [['tux', 1450], ['ginger', 1640]].forEach(([id, x], i) => {
      RV.shadow(ctx, x, FLOOR + 4, 92, 0.22);
      RV.drawCat(ctx, id, { x, y: FLOOR, s: 0.9, t, eyes: 'happy', mouth: RV.sings(t, 'teeth') ? 'sing' : 'w', open: RV.singOpen(t, 1) * 0.8, headTilt: 0.1 * sway(3 + i), tail: 0.8, blink: RV.blink(t, 3 + i * 5) });
    });
    suitBen(ctx, t, { x: 960, y: FLOOR, s: 0.95, rest: 'grin', say: true, eyes: 'happy', lean: 0.06 * sway(1), bob, armL: [2.3 + 0.1 * sway(1), 0.3], armR: [2.3 - 0.1 * sway(1), 0.3] });
    // the singing teeth in the front row
    choir(ctx, t, 470, 1450, 1010, 0.85, { n: 5 });
    // tiny teeth falling slowly like snow
    for (let i = 0; i < 26; i++) {
      const x = -100 + hash(i * 2.7) * 2100 + Math.sin(t + i) * 30, y = RV.fract(hash(i * 5.1) + (t - 40) * 0.06) * 1300 - 150;
      RV.tooth(ctx, x, y, 0.16, { lw: 2.5, rot: t * (hash(i) - 0.5) * 2 });
    }
    ctx.restore();
    RV.screen(ctx, (c) => {
      if (open > 0) stageCurtains(c, t, open, { blow: 1 });
      // the credits, one card at a time
      const k = Math.floor((t - 41.0) / 1.55);
      if (k >= 0 && k < CREDITS.length) {
        const lt = t - 41.0 - k * 1.55;
        const a = Math.min(clamp(lt / 0.3), clamp((1.55 - lt) / 0.3));
        c.save(); c.globalAlpha = a;
        // top left, clear of everyone on stage and the moon
        rrect(c, 60, 56, 700, 150, 24); c.fillStyle = 'rgba(14,8,40,0.78)'; c.fill();
        c.font = `${CREDITS[k][0].length > 16 ? 50 : 64}px ${RV.FONT.title}`; c.fillStyle = '#fff3b0'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(CREDITS[k][0], 410, 112);
        c.font = `600 34px ${RV.FONT.body}`; c.fillStyle = '#e9ddff'; c.fillText(CREDITS[k][1], 410, 168);
        c.restore();
      }
    });
  }, CUT, { chapter: 'Encore' });

  // ============================================================ 50.40  (the end, for real)
  // The tooth moon over the sleeping town, yawning, and nodding off.
  shot(50.4, 'goodnight', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    RV.snapCam(ctx, t, [glide(50.3, 1.0, 1400, 460), glide(50.4, 1.45, 1400, 300, 3.5)], { pulse: 0 });
    RV.nightStreet(ctx, t, { moon: false });
    const yawn = lt > 0.5 && lt < 1.3;
    const sleepy = clamp((lt - 1.2) / 1.2);
    glow(ctx, 1400, 230, 420, '#fff4c2', 0.35);
    RV.tooth(ctx, 1400, 230, 110 / 62, { color: '#fff8d9', shade: '#f0d98c', rot: Math.sin(t * 0.4) * 0.05, squash: yawn ? 1.06 : 1,
      face: { eyes: yawn || sleepy > 0.5 ? 'closed' : 'open', mouth: yawn ? 'o' : 'smile', open: yawn ? Math.sin(clamp((lt - 0.5) / 0.8) * Math.PI) : 0, look: [0, 0.6], blink: lt < 0.5 ? 0 : 0 } });
    if (sleepy > 0.5) for (let i = 0; i < 3; i++) {
      const ph = RV.fract((lt - 1.8) * 0.5 + i / 3);
      ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
      RV.bigText(ctx, 'z', 1540 + ph * 90, 140 - ph * 120, 40 + ph * 30, { fill: '#ffffff', shadow: false });
      ctx.restore();
    }
    ctx.restore();
    RV.screen(ctx, (c) => {
      const a = clamp((lt - 1.5) / 0.6);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      RV.bigText(c, 'THE END', W / 2, 860, 110, { gradient: ['#fff3b0', '#ffd23f', '#e0a800'] });
      c.font = `600 40px ${RV.FONT.body}`; c.fillStyle = '#e9ddff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('(for real this time)', W / 2, 950);
      c.restore();
    });
  }, { type: 'fade', dur: 0.6, pre: 0.3 }, { chapter: 'Goodnight' });
})(globalThis.RV);
