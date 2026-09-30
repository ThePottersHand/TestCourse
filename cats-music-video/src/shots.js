/* The storyboard, part 1 (0-8.6 s): the verse. Each shot: shot(startTime, name, draw(ctx, S), transition).
 * S = { t, lt, d, p }. Word times come from src/timing.js, and the cats trade lines (RV.SINGERS).
 * The camera is RV.snapCam: each framing is snapped to with an overshoot, so every hit is a crash zoom.
 * The kitchen is one world (src/kitchen.js): floor at y = 1000, counter on the left, table in the middle,
 * fridge on the right.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT, FLOOR = RV.FLOOR;
  const SH = [];
  const shot = (t0, name, draw, trans, extra) => SH.push(Object.assign({ t0, name, draw, trans }, extra || {}));
  const CUT = { type: 'cut' };
  const decay = (t, a, k = 8) => (t < a ? 0 : Math.exp(-(t - a) * k));
  // index of the last time in `list` at or before t (-1 before the first)
  const lastIdx = (t, list) => { let k = -1; for (let i = 0; i < list.length; i++) if (t >= list[i]) k = i; return k; };

  // ------------------------------------------------------------ cast
  // a cat: blinks, and sings whenever it's their line (RV.SINGERS); p overrides anything
  function cat(ctx, id, t, p = {}) {
    const pose = Object.assign({ t, blink: RV.blink(t, id === 'tux' ? 3 : 8) }, RV.catSing(t, id, p.rest || 'w', p.gain || 1), p);
    if (p.shadow !== false) RV.shadow(ctx, pose.x || 0, (pose.y || 0) + 3, (id === 'tux' ? 90 : 104) * (pose.s || 1), 0.2);
    return RV.drawCat(ctx, id, pose);
  }
  // a kid: blinks, and joins in on the hoorays
  function kid(ctx, id, t, p = {}) {
    const pose = Object.assign({ t, eyes: 'open', blink: RV.blink(t, id.length * 1.7) }, RV.kidSing(t, p.rest || 'smile'), p);
    if (p.shadow !== false) RV.shadow(ctx, pose.x || 0, (pose.y || 0) + 4, 70 * (pose.s || 1), 0.22);
    return RV.drawKid(ctx, id, pose);
  }
  // head turn + eyes toward a point, for someone standing at x
  const lookAt = (x, tx, dy = 0, k = 520) => { const u = clamp((tx - x) / k, -1, 1); return { turn: u * 0.55, look: [u, dy] }; };
  // cat dance moves on the kick (stand pose). Arms stay out wide of the face.
  function catDance(name, t, seed = 0) {
    const h = RV.half(t) + seed * 0.5, ph = RV.fract(h), down = 0.5 + 0.5 * Math.cos(ph * TAU);
    const sw = Math.sin(Math.PI * h);
    const P = { pose: 'stand', blink: RV.blink(t, seed + 11) };
    switch (name) {
      case 'paws': // paws in the air, swaying
        P.bob = 8 * down; P.armL = [2.0 + 0.14 * sw, 0.32]; P.armR = [2.0 - 0.14 * sw, 0.32];
        P.headTilt = 0.1 * sw; P.footL = [0, 10 * Math.max(0, sw)]; P.footR = [0, 10 * Math.max(0, -sw)];
        break;
      case 'shimmy': // paws out to the sides, shoulders shaking
        P.bob = 6 * down; P.armL = [1.35 + 0.2 * Math.sin(t * 18), -0.5]; P.armR = [1.35 - 0.2 * Math.sin(t * 18), -0.5];
        P.headTilt = 0.08 * sw; P.footL = [0, 12 * Math.max(0, sw)]; P.footR = [0, 12 * Math.max(0, -sw)];
        break;
      case 'disco': { // point up on one kick, down on the next
        const up = Math.floor(h) % 2 === 0, e = ease.outBack(clamp(ph * 3), 2);
        P.bob = 8 * down;
        P.armR = up ? [lerp(0.6, 2.35, e), 0.1] : [0.9, -0.3];
        P.armL = up ? [0.7, -0.9] : [lerp(0.6, 1.3, e), 0.3];
        P.headTilt = up ? -0.12 : 0.1; P.footR = [0, up ? 0 : 14];
        break;
      }
      default: // bounce
        P.bob = 10 * down; P.armL = [0.9 + 0.35 * sw, 0.6]; P.armR = [0.9 - 0.35 * sw, 0.6];
        P.headTilt = 0.12 * sw; P.footL = [0, 12 * Math.max(0, sw)]; P.footR = [0, 12 * Math.max(0, -sw)];
    }
    return P;
  }

  // ------------------------------------------------------------ props in paws
  // a spoon/fork held at hand h, pointing along angle `ang` (0 = straight up)
  const spoonIn = (ang) => (ctx, h) => RV.spoon(ctx, h, ang, 1);
  const forkIn = (ang, s = 0.9) => (ctx, h) => RV.forkMic(ctx, h, ang, s);
  function knife(ctx, h, ang, s = 0.9) {
    ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(ang); ctx.scale(s, s);
    rrect(ctx, -7, -40, 14, 56, 6); fs(ctx, '#3a2a26', 3);
    ctx.beginPath(); ctx.moveTo(-8, -40); ctx.lineTo(-8, -118); ctx.quadraticCurveTo(10, -110, 8, -40); ctx.closePath(); fs(ctx, '#d9dde6', 3);
    ctx.restore();
  }

  // ------------------------------------------------------------ the dinner table
  const TABLE = { x0: 500, x1: 1420, y: 800 };
  const SEAT = { ginger: 860, tux: 1160 };
  const CAT_S = 0.8, SIT_Y = 822; // on cushions, just high enough to see over the table
  function plate(ctx, x, y, food, t, k = 0) {
    ellipse(ctx, x, y, 78, 16); fs(ctx, '#ffffff', 4);
    ellipse(ctx, x, y - 1, 56, 10); ctx.strokeStyle = 'rgba(80,120,200,0.35)'; ctx.lineWidth = 3; ctx.stroke();
    if (food != null) RV.food(ctx, food, x, y - 20, 0.8, k);
  }
  /* chairs, the two cats sitting at the table, the table, their plates and paws.
   * o.ginger / o.tux: pose overrides (null = not at the table); o.paws: {ginger: [lift, lift]} */
  function dinner(ctx, t, o = {}) {
    RV.chair(ctx, SEAT.ginger, FLOOR, 1.05, 'back');
    RV.chair(ctx, SEAT.tux, FLOOR, 1.05, 'back');
    const cats = {};
    if (o.ginger !== null) cats.ginger = cat(ctx, 'ginger', t, Object.assign({ x: SEAT.ginger, y: SIT_Y, s: CAT_S, bib: 'rgba(230,57,70,0.45)', shadow: false }, o.ginger || {}));
    if (o.tux !== null) cats.tux = cat(ctx, 'tux', t, Object.assign({ x: SEAT.tux, y: SIT_Y, s: CAT_S, bib: 'rgba(76,201,240,0.5)', shadow: false }, o.tux || {}));
    RV.table(ctx, TABLE.x0, TABLE.x1, TABLE.y, { cloth: true });
    if (o.plates !== false) {
      plate(ctx, SEAT.ginger, 786, o.foodG == null ? null : o.foodG, t, -0.2);
      plate(ctx, SEAT.tux, 786, o.foodT == null ? null : o.foodT, t, 0.2);
    }
    // front paws resting on the table; ginger holds her knife and fork up, ready
    const paws = (id, x, cut) => {
      const up = (o.pawsUp && o.pawsUp[id]) || [0, 0];
      [-1, 1].forEach((sd, i) => {
        const lift = up[i];
        const px = x + sd * 50, py = 780 - lift * 40;
        RV.catPaw(ctx, id, x + sd * 34, 752, px, py, CAT_S);
        if (cut) (sd < 0 ? knife : (c, h, a) => RV.forkMic(c, h, a, 0.75))(ctx, [px, py - 6], sd * 0.12);
      });
    };
    if (cats.ginger) paws('ginger', (o.ginger && o.ginger.x) || SEAT.ginger, o.cutlery !== false);
    if (cats.tux) paws('tux', SEAT.tux, false);
    return cats;
  }

  // "BUM!" style word pops (colour picked by k)
  const GRADS = [['#fff3b0', '#ffd23f', '#ff9f1c'], ['#caffbf', '#06d6a0', '#118ab2'], ['#ffc2e2', '#ff4fa3', '#9b5de5'], ['#bdf0ff', '#4cc9f0', '#3a0ca3']];
  function slamWord(ctx, t, at, text, x, y, size, k, o = {}) {
    RV.slam(ctx, text, x, y, size, t - at, Object.assign({ rot: k % 2 ? 0.08 : -0.08, gradient: GRADS[k % 4], dur: 0.6, burstC: '#ffffff' }, o));
  }
  // darkness with a soft pool of light at (x, y) (world space)
  function spotlight(ctx, x, y, r, a, color = '10,8,40') {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r);
    g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},${a})`);
    ctx.fillStyle = g; ctx.fillRect(x - 5000, y - 5000, 10000, 10000);
  }

  // ============================================================ 0.00  BUM!
  // The cats pop up on the dining chair from the photo and shout the first "Bum!" at the camera.
  const CH = { x: 1250, s: 1.3 };
  const CH_SEAT = FLOOR + RV.CHAIR_SEAT * CH.s;
  shot(0, 'bum', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 0, z: 2.3, x: CH.x, y: 650 },
      { t: 0.05, z: 1.12, x: CH.x, y: 640, d: 0.26, shake: 22 },
      { t: 0.41, z: 1.45, x: CH.x, y: 655, r: 0.035, d: 0.1, shake: 10, push: 0.12 },
    ]);
    RV.kitchen(ctx, t);
    RV.chair(ctx, CH.x, FLOOR, CH.s, 'back');
    RV.chair(ctx, CH.x, FLOOR, CH.s, 'seat');
    const pop = Math.max(0.02, RV.pop(t, 0.26));
    const turnIn = t > 0.44 ? ease.outBack(clamp((t - 0.44) / 0.12)) : 0;
    const back = t > 0.6 ? ease.outCubic(clamp((t - 0.6) / 0.1)) : 0;
    const face = (sd) => lerp(turnIn * sd * 0.7, 0, back);
    const shout = t < 0.36;
    cat(ctx, 'tux', t, {
      x: CH.x - 95, y: CH_SEAT + 4, s: 0.82 * pop, squash: 1 + RV.wobble(t, 3, 5) * 0.08, shadow: false,
      eyes: shout ? 'squeeze' : 'open', earL: shout ? 0.3 : 0, earR: shout ? 0.3 : 0, rest: 'smile',
      turn: face(1), look: [face(1) * 1.4, 0], pawR: shout ? 1 : 0,
    });
    cat(ctx, 'ginger', t, {
      x: CH.x + 92, y: CH_SEAT + 4, s: 0.82 * pop, squash: 1 + RV.wobble(t - 0.03, 3, 5) * 0.08, shadow: false,
      eyes: shout ? 'squeeze' : 'open', earL: shout ? 0.3 : 0, earR: shout ? 0.3 : 0, rest: 'smile',
      turn: face(-1), look: [face(-1) * 1.4, 0], pawL: shout ? 1 : 0,
    });
    RV.shockwave(ctx, CH.x, 600, t - 0.05, { r: 900, life: 0.5, w: 40 });
    ctx.restore();
    RV.screen(ctx, (c) => slamWord(c, t, 0.03, 'BUM!', W / 2, 170, 150, 0, { dur: 0.62 }));
  }, CUT, { chapter: 'Bum!' });

  // ============================================================ 0.72  FOOD IS YUMMY
  // Dinner time: the cats at the table in their bibs; the kids bring the food. Three crash zooms in on
  // the ginger as she sings.
  shot(0.72, 'foodIsYummy', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 0.72, z: 1.02, x: 960, y: 610 },
      { t: 0.75, z: 1.22, x: 900, y: 640, shake: 8 },
      { t: 0.99, z: 1.5, x: 880, y: 655, r: 0.03, shake: 8 },
      { t: 1.18, z: 2.05, x: 868, y: 668, r: -0.04, shake: 12, push: 0.1 },
    ], { pulse: 0 });
    RV.kitchen(ctx, t);
    // the kids bring dinner: a fish on a plate, a jug, and the little one in her chef's hat
    const walk = RV.move('walk', t, 1);
    kid(ctx, 'big', t, Object.assign({}, walk, { x: lerp(260, 330, clamp((t - 0.72) / 0.5)), y: FLOOR, turn: 0.4, look: [0.8, 0.2],
      handL: [-6, -204], handR: [52, -200], holdR: (c, h) => { plate(c, h[0] - 30, h[1] - 6, 0, t); } }));
    kid(ctx, 'boy', t, { x: 1570, y: FLOOR, turn: -0.4, look: [-0.8, 0.2], rest: 'grin', armL: [0.35, 0.3], armR: [0.3, 0.2],
      holdL: (c, h) => {
        // a jug of milk hanging from his hand
        c.beginPath(); c.arc(h[0] + 26, h[1] + 22, 14, -Math.PI / 2, Math.PI / 2); c.lineWidth = 9; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#ffffff'; c.stroke();
        rrect(c, h[0] - 24, h[1] - 6, 48, 58, 12); fs(c, '#ffffff', 4);
        rrect(c, h[0] - 24, h[1] - 6, 48, 16, 8); fs(c, '#4cc9f0', 3);
      } });
    kid(ctx, 'little', t, Object.assign({}, RV.move('bounce', t, 2), { x: 1745, y: FLOOR, turn: -0.3, look: [-0.7, 0.1], hat: RV.chefHat,
      armR: [1.9, 0.5], holdR: spoonIn(0.3) }));
    dinner(ctx, t, {
      ginger: { eyes: t > 1.18 ? 'happy' : 'open', headTilt: 0.12 * Math.sin(t * 7), rest: 'smile' },
      tux: Object.assign({ rest: 'tongue' }, lookAt(SEAT.tux, SEAT.ginger, 0, 300)),
      pawsUp: { ginger: [0.6 + 0.4 * Math.abs(Math.sin(t * 7)), 0.6 + 0.4 * Math.abs(Math.cos(t * 7))] },
    });
    ctx.restore();
  }, { type: 'flash', dur: 0.1, pre: 0.02 }, { chapter: 'Food is yummy' });

  // ============================================================ 2.00  BUM BA BA BUM
  // The tuxedo leaps onto the table and plays the saucepans with two wooden spoons: a crash zoom and a
  // pot for every syllable.
  const HITS3 = [2.02, 2.18, 2.33, 2.5];
  const POTS = [{ x: 1010, s: 0.85, c: '#c0c7d0' }, { x: 1160, s: 1.0, c: '#e76f51' }, { x: 1310, s: 0.85, c: '#90be6d' }];
  const TUX3 = { x: 1160, y: 784, s: 0.8 };
  // which pot each spoon hits: left spoon on 2.02, 2.33 and 2.5, right spoon on 2.18 and 2.5
  const LEFT_HITS = [[2.02, 0], [2.33, 0], [2.5, 1]], RIGHT_HITS = [[2.18, 2], [2.5, 1]];
  const toTux = (x, y) => [(x - TUX3.x) / TUX3.s, (y - TUX3.y) / TUX3.s];
  const SPOON = 116; // wooden spoon length, hand to the middle of the bowl
  // the hand and spoon on the pot at a hit (tux-local): the bowl of the spoon lands on the pot's top
  function hitPose(k, sd) {
    const P = POTS[k];
    const [tx, ty] = toTux(P.x + (k === 1 ? sd * 26 : 0), 800 - 76 * P.s);
    const hand = k === 1 ? [sd * 30, -165] : [sd * 100, -152];
    const dx = tx - hand[0], dy = ty - hand[1];
    return { hand, ang: Math.atan2(dx, -dy), len: Math.hypot(dx, dy) / SPOON };
  }
  function spoonArm(t, hits, sd) {
    // raised between hits, down on the pot at each hit
    let prev = null, next = null;
    for (const h of hits) { if (h[0] <= t) prev = h; else if (!next) next = h; }
    const upAfter = prev ? clamp((t - prev[0]) / 0.08) : 1;
    const upBefore = next ? clamp((next[0] - t) / 0.07) : 1;
    const u = ease.inOutQuad(Math.min(upAfter, upBefore));
    const target = (prev && upAfter < 1) || !next ? (prev || next) : next;
    const hit = hitPose(target[1], sd);
    const up = { hand: [sd * 88, -198], ang: sd * 0.35, len: 1 };
    return {
      hand: [lerp(hit.hand[0], up.hand[0], u), lerp(hit.hand[1], up.hand[1], u)],
      ang: lerp(hit.ang, up.ang, u), len: lerp(hit.len, 1, u),
    };
  }
  shot(2.0, 'potDrums', (ctx, S) => {
    const { t } = S;
    const k = lastIdx(t, HITS3);
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 2.0, z: 1.45, x: 1160, y: 630 },
      { t: 2.02, z: 1.62, x: 1110, y: 640, r: -0.06, shake: 14 },
      { t: 2.18, z: 1.85, x: 1215, y: 640, r: 0.06, shake: 14 },
      { t: 2.33, z: 2.05, x: 1100, y: 655, r: -0.08, shake: 16 },
      { t: 2.5, z: 1.32, x: 1160, y: 600, r: 0.02, shake: 28, d: 0.16, push: 0.1 },
    ], { pulse: 0 });
    RV.kitchen(ctx, t);
    // the ginger nods along from her chair; the tuxedo's own chair is empty
    dinner(ctx, t, {
      tux: null, plates: false, cutlery: false,
      ginger: { eyes: 'happy', headTilt: k >= 0 ? 0.16 * (k % 2 ? 1 : -1) * (0.4 + decay(t, HITS3[k], 10)) : 0, rest: 'smile' },
    });
    const L = spoonArm(t, LEFT_HITS, -1), R = spoonArm(t, RIGHT_HITS, 1);
    cat(ctx, 'tux', t, {
      x: TUX3.x, y: TUX3.y, s: TUX3.s, pose: 'stand', shadow: false, eyes: k === 3 ? 'squeeze' : 'happy', rest: 'smile',
      bob: -6 * (k >= 0 ? decay(t, HITS3[k], 12) : 0), headTilt: k >= 0 ? 0.1 * (k % 2 ? 1 : -1) : 0,
      handL: L.hand, handR: R.hand, holdL: (c, h) => RV.spoon(c, h, L.ang, 1, L.len), holdR: (c, h) => RV.spoon(c, h, R.ang, 1, R.len),
    });
    POTS.forEach((P, i) => {
      let hit = 0;
      LEFT_HITS.concat(RIGHT_HITS).forEach(([ht, pk]) => { if (pk === i) hit = Math.max(hit, decay(t, ht, 9)); });
      RV.pot(ctx, P.x, 800, P.s, hit, P.c);
    });
    ['BUM!', 'BA', 'BA', 'BUM!'].forEach((w, i) => {
      const x = [985, 1370, 975, 1160][i], y = [455, 470, 450, 350][i];
      RV.wordPop(ctx, w, x, y, i === 3 ? 120 : 86, t - HITS3[i], { life: i === 3 ? 0.9 : 0.34, gradient: GRADS[i], rot: (i % 2 ? 0.12 : -0.12) });
    });
    ctx.restore();
  }, { type: 'flash', dur: 0.1, pre: 0.03 }, { chapter: 'Bum ba ba bum' });

  // ============================================================ 2.85  IT TASTES GOOD LIKE...
  // Back in her chair, the ginger dreams of dinner in a thought bubble... then of something else.
  const BUB = { x: 1020, y: 400 };
  shot(2.85, 'dream', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 2.85, z: 1.95, x: 880, y: 668 },
      { t: 2.92, z: 2.15, x: 868, y: 672, r: 0.035, shake: 6 },
      { t: 3.18, z: 1.42, x: 950, y: 560, r: -0.02, d: 0.18 },
      { t: 3.58, z: 1.6, x: 980, y: 510, r: 0.03, shake: 6 },
      { t: 3.82, z: 1.95, x: 1010, y: 440, r: -0.02 },
      { t: 4.05, z: 2.3, x: BUB.x, y: BUB.y + 10, push: 0.4 },
    ], { pulse: 0 });
    RV.kitchen(ctx, t);
    dinner(ctx, t, {
      ginger: { eyes: t > 3.1 ? 'happy' : 'open', headTilt: -0.1 + 0.05 * Math.sin(t * 3), rest: 'tongue', look: [0.6, -0.8], turn: 0.2 },
      tux: Object.assign({ rest: 'tongue', eyes: t > 3.6 ? 'heart' : 'open' }, lookAt(SEAT.tux, BUB.x, -0.9, 300)),
      pawsUp: { ginger: [0.3, 0.3] },
    });
    // the thought bubble: a feast, then a question mark, then... the old tin
    const pop = RV.pop(t - 3.18, 0.3);
    if (pop > 0) {
      ctx.save(); ctx.translate(BUB.x, BUB.y); ctx.scale(pop, pop); ctx.translate(-BUB.x, -BUB.y);
      RV.speechBubble(ctx, BUB.x, BUB.y, 460, 280, SEAT.ginger + 20, 600, { think: true });
      ctx.save(); ellipse(ctx, BUB.x, BUB.y, 222, 132); ctx.clip();
      const feast = 1 - clamp((t - 3.82) / 0.14);
      for (let i = 0; i < 5; i++) {
        const a = t * 1.6 + (i / 5) * TAU;
        const fly = (1 - feast) * 400;
        RV.food(ctx, i, BUB.x + Math.cos(a) * (120 + fly), BUB.y + Math.sin(a) * (60 + fly * 0.4), 0.9, a);
      }
      const q = RV.pop(t - 3.86, 0.2) * (1 - clamp((t - 4.06) / 0.08));
      if (q > 0) { ctx.save(); ctx.translate(BUB.x, BUB.y); ctx.scale(q, q); RV.bigText(ctx, '?', 0, 0, 170, { fill: '#b388eb' }); ctx.restore(); }
      if (t > 4.06) {
        RV.oldTin(ctx, BUB.x, BUB.y + 90, 0.9 * RV.pop(t - 4.06, 0.2), t, 1);
        RV.sparkleField(ctx, t, { n: 10, x0: BUB.x - 180, x1: BUB.x + 180, y0: BUB.y - 110, y1: BUB.y + 110, size: 20, color: '#eaffb0' });
      }
      ctx.restore();
      ctx.restore();
    }
    ctx.restore();
  }, { type: 'zoom', dur: 0.16, pre: 0.08, x: 868, y: 560 }, { chapter: 'It tastes good' });

  // ============================================================ 4.22  THAT OLD THING IN THE CUPBOARD
  // A whip pan to the kitchen counter. The cupboard rattles and glows; the ginger climbs up and opens
  // it on "cupboard": the dusty old tin from 1972, glowing and buzzing with flies. The kids are appalled.
  // The tin topples out and lands on the counter on the drum hit (6.5 s).
  const COUNTER = FLOOR - 330;                 // worktop surface
  const TIN = { x: 240, shelfY: 462, s: 0.8 }; // in the cupboard (world)
  const tinFall = (t) => {
    // wobbles on the shelf, topples at 6.25 and hits the counter at 6.5
    if (t < 6.25) return { x: TIN.x, y: TIN.shelfY, r: t > 6.0 ? Math.sin((t - 6.0) * 60) * 0.06 : 0, inside: t < 6.25 };
    const p = clamp((t - 6.25) / 0.25);
    const land = t >= 6.5;
    const bounce = land ? Math.abs(Math.sin((t - 6.5) * 14)) * 30 * Math.exp(-(t - 6.5) * 8) : 0;
    return { x: TIN.x + p * 60, y: lerp(TIN.shelfY, COUNTER, ease.inQuad(p)) - bounce, r: land ? 0.05 * Math.sin((t - 6.5) * 20) * Math.exp(-(t - 6.5) * 6) : p * 1.2, inside: false };
  };
  RV.tinFall = tinFall;
  const OPEN = 5.84;
  shot(4.22, 'cupboard', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      { t: 4.22, z: 1.15, x: 330, y: 560 },
      { t: 4.56, z: 1.55, x: 200, y: 420, r: 0.04, shake: 10 },
      { t: 4.9, z: 1.95, x: 220, y: 330, r: -0.04, shake: 8 },
      { t: 5.22, z: 1.4, x: 150, y: 470, r: 0.02 },
      { t: 5.56, z: 1.7, x: 130, y: 420, r: -0.05, shake: 8 },
      { t: OPEN, z: 2.7, x: TIN.x, y: 400, shake: 20, d: 0.14 },
      { t: 6.08, z: 1.45, x: 720, y: 650, r: 0.03, shake: 8 },
      { t: 6.28, z: 1.12, x: 330, y: 560, r: -0.02, d: 0.14 },
    ], { pulse: 0 });
    const open = t < OPEN ? 0.02 * Math.abs(Math.sin(t * 38)) * (t > 4.56 ? 1 : 0) : ease.outBack(clamp((t - OPEN) / 0.22), 1.4);
    const fall = tinFall(t);
    const selfDraw = fall.inside && open > 0.9;
    RV.kitchen(ctx, t, { cupOpen: open, tinInside: fall.inside && !selfDraw });
    if (selfDraw) {
      // wobbling on the shelf (clipped to the cupboard)
      ctx.save(); ctx.beginPath(); ctx.rect(92, 172, 256, 296); ctx.clip();
      ctx.save(); ctx.translate(fall.x, fall.y); ctx.rotate(fall.r); RV.oldTin(ctx, 0, 0, TIN.s, t, 1); ctx.restore();
      ctx.restore();
    }
    // light leaking out around the door before it opens
    if (t > 4.9 && t < OPEN + 0.3) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const a = t < OPEN ? 0.35 + 0.15 * Math.sin(t * 30) : 1 - (t - OPEN) / 0.3;
      glow(ctx, 220, 320, 260, '#b7ff6b', a * 0.7);
      ctx.restore();
    }
    if (t >= OPEN && t < OPEN + 0.7) {
      // heavenly rays
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(1 - (t - OPEN) / 0.7) * 0.5;
      RV.sunburst(ctx, TIN.x, 400, t, { n: 14, colors: ['#e8ffb0', 'rgba(0,0,0,0)'], r: 900, speed: 0.6 });
      ctx.restore();
    }
    // the cats on the counter: the tux sitting, the ginger standing on tiptoe to reach the handle
    const reach = clamp((t - 5.22) / 0.3);
    const opened = t >= OPEN;
    cat(ctx, 'tux', t, {
      x: -150, y: COUNTER + 2, s: 0.75, eyes: t > OPEN ? 'heart' : 'open', rest: t > OPEN ? 'tongue' : 'w',
      ...lookAt(-150, TIN.x, -0.8, 200), headTilt: -0.15,
    });
    cat(ctx, 'ginger', t, {
      x: 50, y: COUNTER + 2, s: 0.75, pose: 'stand', shadow: false, rest: t > OPEN ? 'tongue' : 'w',
      eyes: t > OPEN ? 'heart' : 'open', look: [0.3, -0.9],
      jump: opened ? 30 * Math.max(0, 1 - (t - OPEN) / 0.2) : 30 * reach, footL: [0, opened ? 0 : 12 * reach], footR: [0, opened ? 0 : 12 * reach],
      // reaching up for the handle, then paws in the air when the door flies open
      armR: opened ? [2.05, 0.3] : t < 5.22 ? [0.4, 0.3] : null, armL: opened ? [2.05, 0.3] : [0.5 + 0.8 * reach, 0.4],
      handR: !opened && t >= 5.22 ? [lerp(60, 100, reach), lerp(-150, -330, reach)] : null,
    });
    if (!fall.inside) {
      ctx.save(); ctx.translate(fall.x, fall.y); ctx.rotate(fall.r); RV.oldTin(ctx, 0, 0, TIN.s, t, 0.8); ctx.restore();
      RV.dust(ctx, fall.x, COUNTER, t - 6.5, { n: 8, life: 0.5 });
    }
    // the kids below: curious, then appalled
    const ew = t > OPEN + 0.12;
    kid(ctx, 'big', t, {
      x: 560, y: FLOOR, ...lookAt(560, TIN.x, -0.9, 300), rest: ew ? 'grimace' : 'o',
      armL: [0.3, 0.2], armR: ew ? null : [0.3, 0.2], handR: ew ? [10, RV.kidHead('big') + 20] : null, armsFront: ew ? 'R' : '',
    });
    kid(ctx, 'boy', t, { x: 760, y: FLOOR, ...lookAt(760, TIN.x, -0.9, 300), rest: ew ? 'flat' : 'smile', gloom: ew ? clamp((t - OPEN - 0.12) / 0.3) : 0, armL: [0.25, 0.2], armR: [0.25, 0.2] });
    kid(ctx, 'little', t, {
      x: 930, y: FLOOR, ...lookAt(930, TIN.x, -0.9, 300), eyes: ew ? 'wide' : 'open', rest: ew ? 'o' : 'smile',
      handL: ew ? [-52, RV.kidHead('little') + 26] : null, handR: ew ? [52, RV.kidHead('little') + 26] : null, armsFront: ew ? 'LR' : '',
    });
    if (ew) RV.wordPop(ctx, 'EWW!', 720, 520, 92, t - OPEN - 0.2, { gradient: GRADS[1], rot: -0.1, life: 0.6 });
    ctx.restore();
  }, { type: 'whip', dur: 0.26, pre: 0.12 }, { chapter: 'That old thing in the cupboard' });

  // ============================================================ 6.52  DUN DA-DA DUN, DA-DA DUN!
  // Lights out: the heist. The cats tiptoe along the counter toward the tin in the dark, freezing on every
  // "dun" and creeping on every "da". On the last "dun!" the tuxedo pops the lid off.
  const SNEAK = [6.52, 7.05, 7.23, 7.4, 7.57, 7.73, 7.98];
  const LID = 8.06;
  const TIN_AT = { x: TIN.x + 60, y: COUNTER };
  shot(6.52, 'heist', (ctx, S) => {
    const { t } = S;
    const k = Math.max(0, lastIdx(t, SNEAK));
    const dun = k === 0 || k === 3 || k === 6;
    const lt = t - SNEAK[k];
    const step = ease.outBack(clamp(lt / 0.07), 2);
    const px = (i) => -520 + Math.min(i, 5) * 100;
    const xT = lerp(px(k - 1 < 0 ? 0 : k - 1), px(k), k === 0 ? 1 : step);
    const xG = xT - 150;
    const leap = t >= 7.98 ? clamp((t - 7.98) / 0.08) : 0;
    const tuxX = lerp(xT, TIN_AT.x - 130, ease.outCubic(leap));
    ctx.save();
    const cx = lerp(xT - 75, TIN_AT.x - 40, leap);
    RV.snapCam(ctx, t, [
      { t: 6.52, z: 1.6, x: -590, y: 540, r: -0.05, shake: 10 },
      { t: 7.05, z: 1.35, x: -490, y: 560, r: 0.02 },
      { t: 7.23, z: 1.4, x: -390, y: 565, r: -0.02 },
      { t: 7.4, z: 1.85, x: -300, y: 530, r: 0.06, shake: 10 },
      { t: 7.57, z: 1.35, x: -190, y: 565, r: -0.02 },
      { t: 7.73, z: 1.4, x: -90, y: 565, r: 0.02 },
      { t: 7.98, z: 1.7, x: 150, y: 550, r: -0.05, shake: 12 },
      { t: LID, z: 1.25, x: 180, y: 520, shake: 26, d: 0.14 },
    ], { pulse: 0 });
    RV.kitchen(ctx, t, { cupOpen: 1, tinInside: false });
    // the tin on the counter, lid popping off at LID
    const lid = t < LID ? 0 : clamp((t - LID) / 0.35);
    if (t > LID) {
      RV.impact(ctx, TIN_AT.x, TIN_AT.y - 110, t - LID, { r: 130, life: 0.4, color: '#eaffb0', inner: '#b7ff6b' });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, TIN_AT.x, TIN_AT.y - 120, 360, '#b7ff6b', 0.7); ctx.restore();
    }
    RV.oldTin(ctx, TIN_AT.x, TIN_AT.y, TIN.s, t, 0.6 + (t > LID ? 0.4 : 0), lid);
    // freeze poses: on a "dun" they freeze mid-tiptoe and stare at the camera; on a "da" they creep,
    // leaning toward the tin with sly half-closed eyes
    const sneakPose = (i) => {
      if (i === 0 || i === 3) return { lean: 0, pose: { footL: [10, 58], footR: [0, 0], handL: [-96, -206], handR: [96, -206], look: [0, 0], eyes: 'wide', blink: 0 } };
      if (i === 6) return { lean: 0.05, pose: { footL: [0, 0], footR: [0, 40], handL: [-90, -200], handR: [80, -190], look: [0.6, 0], eyes: 'wide', blink: 0 } };
      const odd = i % 2 === 1;
      return { lean: 0.15, pose: { footL: [0, odd ? 28 : 0], footR: [0, odd ? 0 : 28], handL: [-12, -168], handR: [56, -178], look: [1, 0.2], eyes: 'open', lid: 0.4 } };
    };
    const bob = -10 * decay(t, SNEAK[k], 14);
    const leanCat = (id, x, lean, pose) => {
      ctx.save(); ctx.translate(x, COUNTER + 2); ctx.rotate(lean); ctx.translate(-x, -(COUNTER + 2));
      cat(ctx, id, t, pose);
      ctx.restore();
    };
    const sp = sneakPose(k);
    leanCat('ginger', xG, t > LID ? 0 : sp.lean, Object.assign({ x: xG, y: COUNTER + 2, s: 0.72, pose: 'stand', shadow: false, bob, rest: 'w' }, sp.pose,
      t > LID ? { eyes: 'wide', blink: 0, dilate: 1, earL: 0.2, earR: 0.2, mouth: 'o', open: 0.5, handL: null, handR: null, armL: [2.05, 0.3], armR: [2.05, 0.3], look: [0.8, -0.3], footL: [0, 0] } : {}));
    leanCat('tux', tuxX, t > 7.98 ? 0 : sp.lean, Object.assign({ x: tuxX, y: COUNTER + 2, s: 0.72, pose: 'stand', shadow: false, bob, jump: leap > 0 && leap < 1 ? 40 * Math.sin(leap * Math.PI) : 0 },
      sp.pose,
      t > 7.98 ? { handR: t < LID ? [90, -230] : [60, -290], handL: [-60, -170], look: [0.8, -0.4] } : {}));
    // the heist is lit by one torch-like spot that follows the cats
    const dark = t < LID ? 0.82 : 0.82 * (1 - clamp((t - LID) / 0.15));
    spotlight(ctx, cx, 490, 430, dark);
    ctx.restore();
    if (k < 6) RV.screen(ctx, (c) => {
      const words = ['DUN', 'DA', 'DA', 'DUN', 'DA', 'DA'];
      RV.wordPop(c, words[k], k % 3 === 0 ? 300 : 1620, k % 3 === 0 ? 180 : 200 + (k % 3) * 70, k % 3 === 0 ? 120 : 84, lt, { gradient: GRADS[(k + 2) % 4], rot: k % 2 ? 0.1 : -0.1, life: 0.3 });
    });
    if (t > 7.98) RV.screen(ctx, (c) => slamWord(c, t, 7.98, 'DUN!', 1450, 200, 130, 2, { dur: 0.35 }));
  }, CUT, { chapter: 'Dun da-da dun' });

  // ============================================================ 8.30  (the eyes)
  // A hush: the lid is off, a green glow on two faces, and two pairs of pupils going very, very round.
  shot(8.3, 'eyes', (ctx, S) => {
    const { t, lt } = S;
    ctx.fillStyle = '#0d1a14'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    const z = 1 + lt * 0.35;
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W / 2, H + 100, 1100, '#b7ff6b', 0.55); ctx.restore();
    const dil = ease.outCubic(clamp(lt / 0.22));
    [['tux', 520, -0.06], ['ginger', 1400, 0.06]].forEach(([id, x, tilt]) => {
      ctx.save(); ctx.translate(x, 600); ctx.rotate(tilt); ctx.scale(3.1, 3.1);
      RV.catHeadDraw(ctx, id, { t, eyes: 'wide', dilate: lerp(0.3, 1, dil), look: [id === 'tux' ? 0.3 : -0.3, 0.6], mouth: 'o', open: 0.2 + 0.2 * dil, earL: 0, earR: 0, blush: 0.2 });
      ctx.restore();
    });
    RV.sparkleField(ctx, t, { n: 16, size: 26, color: '#eaffb0', y0: 700, y1: 1080 });
    ctx.restore();
  }, CUT);

  RV._shotList = SH;
  RV._shotHelpers = { shot, CUT, decay, lastIdx, cat, kid, lookAt, catDance, spoonIn, forkIn, knife, plate, dinner, TABLE, SEAT, CAT_S, SIT_Y, GRADS, slamWord, spotlight, COUNTER, TIN_AT };
})(globalThis.RV);
