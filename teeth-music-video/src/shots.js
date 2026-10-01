/* The storyboard, part 1 (0-14.5 s). Each shot: shot(startTime, name, draw(ctx, S), transition).
 * S = { t, lt, d, p }. Word times are in src/timing.js; RV.SINGERS says who sings each line.
 * This one is weirder and slower than the Ben video: long shots, slow pushes and drifts (snapCam keys with
 * long durations and no overshoot), and only a few snap zooms where the song shouts.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT, FLOOR = RV.FLOOR;
  const SH = [];
  const shot = (t0, name, draw, trans, extra) => SH.push(Object.assign({ t0, name, draw, trans }, extra || {}));
  const CUT = { type: 'cut' };
  const decay = (t, a, k = 8) => (t < a ? 0 : Math.exp(-(t - a) * k));
  const lastIdx = (t, list) => { let k = -1; for (let i = 0; i < list.length; i++) if (t >= list[i]) k = i; return k; };
  // a slow camera move: no overshoot
  const glide = (t, z, x, y, d = 1, o = {}) => Object.assign({ t, z, x, y, d, back: 0 }, o);

  // ------------------------------------------------------------ cast
  function shadow(ctx, x, y, w) { RV.shadow(ctx, x, y + 4, w, 0.22); }
  // Ben in his tee and shorts; lip-syncs his own lines (or any line with p.say)
  function ben(ctx, t, p = {}) {
    const say = p.say ? RV.singOpen(t, 1.2) : 0;
    const m = p.say ? (say > 0.06 ? { mouth: 'sing', open: say } : { mouth: p.rest || 'smile', open: 0 }) : RV.kidSing(t, 'ben', p.rest || 'smile');
    const pose = Object.assign({ t, eyes: 'open', blink: RV.blink(t, 5) }, m, p);
    if (p.shadow !== false) shadow(ctx, pose.x || 0, pose.y || 0, 82 * (pose.s || 1));
    return RV.drawKid(ctx, 'ben', pose);
  }
  function suitBen(ctx, t, p = {}) {
    const say = p.say ? RV.singOpen(t, 1.2) : 0;
    const m = p.say ? (say > 0.06 ? { mouth: 'sing', open: say } : { mouth: p.rest || 'smile', open: 0 }) : RV.kidSing(t, 'ben', p.rest || 'smile');
    const pose = Object.assign({ t, eyes: 'open', blink: RV.blink(t, 5) }, m, p);
    if (p.shadow !== false) shadow(ctx, pose.x || 0, pose.y || 0, 150 * (pose.s || 1));
    return RV.toothSuit(ctx, pose);
  }
  // tooth-fairy Ben: wings, tutu, a star on his head, the wand and (optionally) the sack
  const starHat = (ctx, r) => { RV.star(ctx, 0, -r * 1.22, r * 0.3, r * 0.14, 5); fs(ctx, '#ffd23f', 4); };
  function fairyBen(ctx, t, p = {}) {
    const extra = {
      back: (c, f) => RV.fairyWings(c, f), waist: (c, f) => RV.tutu(c, f), hat: starHat,
      holdR: p.wand === false ? null : (c, h) => RV.wand(c, h, p.wandAng == null ? 0.25 : p.wandAng, t),
      holdL: p.sack ? (c, h) => RV.toothSack(c, h, p.sack, t) : p.holdL,
    };
    return ben(ctx, t, Object.assign(extra, p, { back: extra.back, waist: extra.waist }));
  }
  // a cousin; tells the story (lip-syncs the 'kids' lines)
  function cousin(ctx, id, t, p = {}) {
    const pose = Object.assign({ t, eyes: 'open', blink: RV.blink(t, id.length * 1.7) }, RV.kidSing(t, 'kids', p.rest || 'flat'), p);
    if (p.shadow !== false) shadow(ctx, pose.x || 0, pose.y || 0, 70 * (pose.s || 1));
    return RV.drawKid(ctx, id, pose);
  }
  const lookAt = (x, tx, dy = 0, k = 520) => { const u = clamp((tx - x) / k, -1, 1); return { turn: u * 0.55, look: [u, dy] }; };
  // sunglasses (drawn in head space through the rig's hat hook); drop: 0 (up out of frame) .. 1 (on)
  const shades = (drop = 1, extraHat) => (ctx, r) => {
    if (extraHat) extraHat(ctx, r);
    const y = lerp(-r * 2.6, r * 0.06, ease.outBounce(clamp(drop)));
    ctx.save(); ctx.translate(0, y);
    [-1, 1].forEach((sd) => { rrect(ctx, sd * r * 0.37 - r * 0.3, -r * 0.16, r * 0.6, r * 0.34, r * 0.1); fs(ctx, '#1b1b2f', 4); });
    ctx.beginPath(); ctx.moveTo(-r * 0.08, -r * 0.06); ctx.lineTo(r * 0.08, -r * 0.06); ctx.lineWidth = 5; ctx.strokeStyle = '#1b1b2f'; ctx.stroke();
    [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(sd * r * 0.2 - r * 0.12, -r * 0.1); ctx.lineTo(sd * r * 0.2 - r * 0.02, -r * 0.1); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke(); });
    ctx.restore();
  };
  // the singing teeth: n teeth in a row, bow ties, swaying slowly; o.lift raises them; returns positions
  const BOWS = ['#e63946', '#4cc9f0', '#9b5de5', '#ffd23f', '#06d6a0', '#ff9f1c', '#ff4fa3'];
  function choir(ctx, t, x0, x1, y, s, o = {}) {
    const n = o.n || 5;
    const m = RV.toothSing(t, o.rest || 'smile');
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? (x0 + x1) / 2 : lerp(x0, x1, i / (n - 1));
      const sway = Math.sin(t * 1.6 + i * 0.7);
      const lift = (o.lift || 0) * (0.6 + 0.4 * Math.sin(t * 2 + i));
      const yy = y - lift - Math.abs(Math.sin(t * 1.6 + i * 0.7)) * 6;
      const face = Object.assign({ eyes: o.eyes ? o.eyes(i) : (m.open > 0.5 ? 'closed' : 'open'), look: [sway * 0.4, 0], blink: RV.blink(t, i * 3.3) }, m, o.face ? o.face(i) : {});
      if (o.shadows !== false) { ellipse(ctx, x, y + 82 * s, 40 * s, 8 * s); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill(); }
      RV.tooth(ctx, x, yy, s, { rot: sway * 0.08, bow: BOWS[i % BOWS.length], face });
      out.push([x, yy]);
    }
    return out;
  }
  // a pastel spiral, slowly turning (the weird backdrop)
  function spiral(ctx, cx, cy, t, o = {}) {
    const cols = o.colors || ['#cdb4ff', '#ffc8dd'];
    const n = 16, R = o.r || 2600, rot = t * (o.speed == null ? 0.25 : o.speed);
    ctx.fillStyle = cols[1]; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    for (let i = 0; i < n; i++) {
      ctx.beginPath(); ctx.moveTo(cx, cy);
      for (let k = 0; k <= 30; k++) {
        const r = (k / 30) * R, a = rot + (i / n) * TAU + (k / 30) * 2.6;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      for (let k = 30; k >= 0; k--) {
        const r = (k / 30) * R, a = rot + ((i + 0.5) / n) * TAU + (k / 30) * 2.6;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fillStyle = cols[0]; ctx.fill();
    }
  }
  // documentary caption, bottom left (screen space)
  function lowerThird(ctx, name, sub, lt, out = 99) {
    const a = Math.min(clamp(lt / 0.35), clamp((out - lt) / 0.3));
    if (a <= 0) return;
    RV.screen(ctx, (c) => {
      c.save(); c.globalAlpha = a; c.translate(lerp(-60, 0, ease.outCubic(clamp(lt / 0.5))), 0);
      rrect(c, 90, 840, 640, 150, 20); c.fillStyle = 'rgba(29,15,46,0.82)'; c.fill();
      rrect(c, 90, 840, 18, 150, 8); c.fillStyle = '#ff4fa3'; c.fill();
      c.font = `72px ${RV.FONT.title}`; c.fillStyle = '#fff3b0'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(name, 136, 892);
      c.font = `600 34px ${RV.FONT.body}`; c.fillStyle = '#e9ddff'; c.fillText(sub, 138, 955);
      c.restore();
    });
  }
  // the dark stage with soft spotlights (floor at FLOOR)
  function darkStage(ctx, t, spots = [960], o = {}) {
    const g = ctx.createLinearGradient(0, -600, 0, FLOOR);
    g.addColorStop(0, o.top || '#140a26'); g.addColorStop(1, o.bottom || '#2c1650');
    ctx.fillStyle = g; ctx.fillRect(-2400, -1200, 7000, FLOOR + 1200);
    ctx.fillStyle = o.floor || '#3a2160'; ctx.fillRect(-2400, FLOOR, 7000, 1200);
    ctx.beginPath(); ctx.moveTo(-2400, FLOOR); ctx.lineTo(4600, FLOOR); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    spots.forEach((sx, i) => {
      const a = (o.spot == null ? 1 : o.spot) * (Array.isArray(o.alpha) ? o.alpha[i] : 1);
      if (a <= 0) return;
      const gg = ctx.createLinearGradient(0, -500, 0, FLOOR);
      gg.addColorStop(0, `rgba(255,236,200,${0.03 * a})`); gg.addColorStop(1, `rgba(255,236,200,${0.24 * a})`);
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.moveTo(sx - 50, -500); ctx.lineTo(sx + 50, -500); ctx.lineTo(sx + (o.w || 300), FLOOR + 10); ctx.lineTo(sx - (o.w || 300), FLOOR + 10); ctx.closePath(); ctx.fill();
      ellipse(ctx, sx, FLOOR + 10, (o.w || 300) * 1.05, 50); ctx.fillStyle = `rgba(255,236,200,${0.3 * a})`; ctx.fill();
    });
    ctx.restore();
  }
  // floating teeth drifting slowly through the frame (weirdness)
  function driftTeeth(ctx, t, n, x0, x1, y0, y1, s = 0.5, seed = 0) {
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 3.1 + seed), h2 = hash(i * 7.7 + seed), h3 = hash(i * 1.3 + seed);
      const x = x0 + RV.fract(h1 + t * (0.01 + h3 * 0.015)) * (x1 - x0);
      const y = y0 + h2 * (y1 - y0) + Math.sin(t * 0.8 + i) * 20;
      ctx.save(); ctx.globalAlpha *= 0.85;
      RV.tooth(ctx, x, y, s * (0.6 + h3 * 0.6), { rot: t * (h1 - 0.5) * 0.6 + i, lw: 4 });
      ctx.restore();
    }
  }

  // ============================================================ 0.00  BEN BE LIKE,
  // A documentary interview: Ben alone in a spotlight, staring into the camera. "I'm not obsessed." A long,
  // long pause. A tooth floats past. "I just really like teeth!" A big toothy grin, and the camera pulls
  // back to show the wall behind him is covered in teeth.
  const POSTERS = [
    [-120, 260, 'I ♥ TEETH', '#ff4fa3'], [260, 200, 'MOLARS', '#4cc9f0'], [1660, 220, 'TOOTH OF THE MONTH', '#ffd23f'],
    [2040, 300, 'SMILE!', '#06d6a0'], [-80, 600, 'CANINES', '#9b5de5'], [2020, 640, 'FLOSS', '#ff9f1c'],
  ];
  function teethWall(ctx, t, o = {}) {
    // wallpaper of rows and rows of teeth
    ctx.fillStyle = '#ffe3f1'; ctx.fillRect(-2400, -1200, 7000, FLOOR + 1200);
    ctx.save(); ctx.globalAlpha *= 0.55;
    for (let yy = -450; yy < FLOOR; yy += 110) for (let xx = -1400; xx < 3400; xx += 120) {
      const off = ((Math.round(yy / 110) % 2) + 2) % 2 * 60;
      RV.tooth(ctx, xx + off, yy, 0.34, { lw: 3, color: '#ffffff', shade: '#f6d7e6', rot: Math.sin(xx * 0.01 + yy) * 0.2 });
    }
    ctx.restore();
    POSTERS.forEach(([x, y, txt, col], i) => {
      ctx.save(); ctx.translate(x + 120, y + 150); ctx.rotate((hash(i) - 0.5) * 0.12);
      rrect(ctx, -130, -160, 260, 320, 10); fs(ctx, '#fffaf2', 5);
      RV.tooth(ctx, 0, -30, 1.25, { face: i % 2 ? { eyes: 'happy', mouth: 'smile' } : null, lw: 5 });
      rrect(ctx, -110, 92, 220, 50, 8); fs(ctx, col, 4);
      ctx.font = `${txt.length > 10 ? 20 : 30}px ${RV.FONT.title}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, 0, 118);
      ctx.restore();
    });
    ctx.fillStyle = '#c99bd9'; ctx.fillRect(-2400, FLOOR, 7000, 1200);
    ctx.beginPath(); ctx.moveTo(-2400, FLOOR); ctx.lineTo(4600, FLOOR); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  }
  const BEN0 = { x: 960, y: FLOOR };
  const BEN_FACE = BEN0.y + RV.kidHead('ben');
  shot(0, 'interview', (ctx, S) => {
    const { t } = S;
    const grin = t >= 5.46;
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(0, 1.0, 960, 620),
      glide(0.05, 1.35, 960, 600, 2.4),
      glide(2.4, 2.25, 960, BEN_FACE + 20, 2.2),
      glide(4.6, 2.55, 960, BEN_FACE + 10, 0.8),
      glide(5.46, 1.0, 960, 560, 0.7, { shake: 6 }),
    ], { pulse: 0 });
    // before the reveal it is dark around him; the wall of teeth is there all along
    teethWall(ctx, t);
    const dark = grin ? clamp(1 - (t - 5.46) / 0.25) : 1;
    // Ben: hands behind his back, very still, staring; one eye twitches in the long pause
    const twitch = t > 3.7 && t < 4.4 ? (Math.sin(t * 60) > 0.6 ? 0.45 : 0) : 0;
    ben(ctx, t, Object.assign({
      x: BEN0.x, y: BEN0.y, rest: 'flat', eyes: grin ? 'happy' : 'open',
      lid: grin ? 0 : 0.18 + twitch, blink: t > 3.4 && t < 3.6 ? Math.sin((t - 3.4) / 0.2 * Math.PI) : RV.blink(t, 5) * 0.4,
      handL: [-34, -150], handR: [34, -150], headTilt: grin ? 0.06 * Math.sin(t * 3) : 0.02 * Math.sin(t * 0.8),
      browL: t > 2.4 && t < 3.6 ? 0.8 : 0, browR: t > 2.4 && t < 3.6 ? 0.8 : 0,
    }, grin ? { mouth: 'grin', open: 0 } : {}));
    if (grin) {
      // ting! on his teeth
      const gp = t - 5.46;
      RV.sparkle(ctx, 985, BEN_FACE + 38, 38 * Math.sin(clamp(gp / 0.4) * Math.PI), '#ffffff');
    }
    // the darkness around him: a spotlight in an otherwise black room, until the reveal
    if (dark > 0) {
      const g = ctx.createRadialGradient(960, 740, 120, 960, 740, 420);
      g.addColorStop(0, 'rgba(10,6,20,0)'); g.addColorStop(1, `rgba(10,6,20,${0.96 * dark})`);
      ctx.fillStyle = g; ctx.fillRect(-2000, -1200, 6000, 4000);
    }
    // a tooth drifts slowly through the frame in the long pause
    if (t > 3.3 && t < 5.4) {
      const u = (t - 3.3) / 2.1;
      RV.tooth(ctx, lerp(1260, 660, u), BEN_FACE - 175 + Math.sin(u * 6) * 14, 0.42, { rot: u * 2.5, lw: 4 });
    }
    ctx.restore();
    lowerThird(ctx, 'BEN', 'likes teeth (a normal amount)', t - 0.3, 2.3);
  }, CUT, { chapter: 'Ben be like' });

  // ============================================================ 6.10  (HE LIKES TEETH, OOOOOOH, HE LIKES TEETH)
  // The backing singers: five teeth in bow ties under a spotlight, swaying very slowly. Ben conducts
  // them with a toothbrush. On the high "OOOH" they float up off the floor.
  const HIGH = 9.88;
  shot(6.1, 'choir', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(6.0, 1.0, 960, 560),
      glide(6.1, 1.35, 900, 600, 2.0),
      glide(8.5, 1.5, 1040, 580, 1.4),
      glide(HIGH, 1.25, 960, 470, 0.9),
      glide(11.1, 1.05, 960, 560, 1.2),
    ], { pulse: 0 });
    darkStage(ctx, t, [520, 960, 1400], { alpha: [0.7, 1, 0.7] });
    RV.stars(ctx, t, { n: 50, x0: -300, x1: 2200, y0: -300, y1: 500, seed: 2, alpha: 0.6 });
    const lift = t < HIGH ? 0 : t < 11.0 ? ease.inOutSine(clamp((t - HIGH) / 0.7)) * 90 : 90 * (1 - ease.inOutSine(clamp((t - 11.0) / 0.6)));
    // the teeth bow at the very end
    const bow = clamp((t - 12.1) / 0.4) * (1 - clamp((t - 12.9) / 0.4));
    ctx.save();
    choir(ctx, t, 500, 1260, 830 - bow * 10, 1.25, { lift, eyes: (i) => (t > HIGH && t < 11 && i === 2 ? 'wide' : null), face: () => (bow > 0 ? { eyes: 'happy', mouth: 'smile', open: 0 } : {}) });
    ctx.restore();
    // Ben conducting from the right with a toothbrush baton, very seriously
    const conduct = Math.sin(RV.beat(t) * Math.PI * 0.5);
    ben(ctx, t, {
      x: 1520, y: FLOOR, s: 0.95, rest: 'flat', eyes: 'closed', turn: -0.45, headTilt: -0.08 + conduct * 0.05,
      // the baton hand stays out to the side of his face
      handR: [128 + conduct * 22, -290 + Math.abs(conduct) * 30], handL: [-104, -196 - conduct * 18],
      holdR: (c, h) => { c.save(); c.translate(h[0], h[1]); c.rotate(0.45 + conduct * 0.3); rrect(c, -5, -100, 10, 104, 5); fs(c, '#4cc9f0', 3); rrect(c, -9, -122, 18, 28, 4); fs(c, '#ffffff', 3); c.restore(); },
    });
    RV.musicNotes(ctx, t, 960, 560, { n: 5, rise: 300 });
    ctx.restore();
  }, { type: 'fade', dur: 0.4, pre: 0.2 }, { chapter: 'He likes teeth' });

  // ============================================================ 13.19  RAP TIME!
  // The beat drops: the cousins, in a row in front of a pastel brick wall, sunglasses dropping onto their
  // faces one at a time, nodding on the beat. "RAP TIME!"
  const SHADES = [13.19, 13.38, 13.58];
  function brickWall(ctx, t) {
    ctx.fillStyle = '#ffb3c6'; ctx.fillRect(-2400, -1200, 7000, FLOOR + 1200);
    ctx.fillStyle = '#ff9fb8';
    for (let row = 0; row < 30; row++) for (let i = -10; i < 30; i++) {
      const x = i * 140 + (row % 2) * 70, y = -300 + row * 50;
      if (y > FLOOR) continue;
      ctx.fillRect(x + 4, y + 4, 132, 42);
    }
    // graffiti teeth
    [[340, 260, -0.2], [1580, 230, 0.25]].forEach(([x, y, r]) => RV.tooth(ctx, x, y, 1.6, { rot: r, color: '#c8f7ff', shade: '#8fdcf0', face: { eyes: 'happy', mouth: 'smile' } }));
    ctx.fillStyle = '#7a5ea8'; ctx.fillRect(-2400, FLOOR, 7000, 1200);
    ctx.beginPath(); ctx.moveTo(-2400, FLOOR); ctx.lineTo(4600, FLOOR); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  }
  shot(13.19, 'rapTime', (ctx, S) => {
    const { t } = S;
    ctx.save();
    RV.snapCam(ctx, t, [
      glide(13.19, 1.4, 960, 640, 0.1, { shake: 14, back: 1.4 }),
      glide(13.6, 1.18, 960, 600, 0.25, { shake: 10, back: 1.4 }),
    ], { pulse: 0.02 });
    brickWall(ctx, t);
    const nod = (seed) => Math.max(0, Math.sin(Math.PI * RV.half(t) + seed)) * 0.12;
    [['big', 700, 0], ['boy', 960, 1], ['little', 1200, 2]].forEach(([id, x, i]) => {
      cousin(ctx, id, t, {
        x, y: FLOOR, rest: 'smirk', headTilt: nod(i * 0.4) - 0.04, bob: 6 * RV.kick(t, 5),
        armL: [0.9, -1.9], armR: [0.9, -1.9], hat: shades(clamp((t - SHADES[i]) / 0.25)),
      });
    });
    ctx.restore();
    RV.screen(ctx, (c) => RV.slam(c, 'RAP TIME!', W / 2, 190, 150, t - 13.6, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], rot: -0.06, dur: 0.9, burstC: '#4cc9f0' }));
  }, CUT, { chapter: 'Rap time' });

  RV._shotList = SH;
  RV._shotHelpers = { shot, CUT, decay, lastIdx, glide, ben, suitBen, fairyBen, cousin, lookAt, shades, choir, spiral, lowerThird, darkStage, driftTeeth, shadow, starHat, BOWS };
})(globalThis.RV);
