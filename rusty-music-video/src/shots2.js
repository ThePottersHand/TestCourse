/* Storyboard part 2: verse 2, chorus 2 (underground groove), verse 3. */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H;
  const OUT = RV.OUT;
  const { cam, talkMouth, rustyTalk, kidsSing, kick, popAt, chorusSlam, shot } = RV._shotHelpers;

  // word time by line prefix + word index (robust to line numbering)
  const LN = (prefix) => RV.LYRICS.findIndex((L) => L.text.startsWith(prefix));
  const wt = (prefix, wi) => RV.LYRICS[LN(prefix)].w[wi][0];

  function dirtWindow(ctx, t, x, y, r) {
    ctx.fillStyle = '#6b3f27'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    for (let i = 0; i < 14; i++) {
      ellipse(ctx, x - r + hash(i * 3.3) * r * 2, y - r + hash(i * 5.7) * r * 2, 10 + hash(i) * 16, 7 + hash(i * 2) * 9, hash(i * 9) * 3);
      fs(ctx, ['#8d5a3b', '#a0785a', '#5a331f'][i % 3], 3);
    }
    ctx.strokeStyle = '#3d2215'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.5); ctx.bezierCurveTo(x - r * 0.3, y - r * 0.2, x, y - r * 0.8, x + r, y - r * 0.4); ctx.stroke();
    RV.worm(ctx, x - r * 0.2 + Math.sin(t * 0.8) * r * 0.3, y + r * 0.7, 0.9, { t, color: '#ff8fa3' });
  }

  function seatedRusty(ctx, t, x, y, s, o = {}) {
    RV.captainSeat(ctx, x, y, s);
    RV.drawRusty(ctx, Object.assign({ x, y: y - 108 * s, s: s * 0.95, t, goggles: 2, blink: RV.blink(t, 9), wag: 0.8 }, o));
  }

  function interior(ctx, t, o = {}) {
    RV.shipInterior(ctx, t, Object.assign({
      lights: 1,
      leftWin: (c, x, y, r) => (o.dirt ? dirtWindow(c, t, x, y, r) : RV.timeVortex(c, t, x, y, r)),
      rightWin: (c, x, y, r) => (o.dirt ? dirtWindow(c, t + 3, x, y, r) : RV.spaceWindow(c, t, x, y, r)),
    }, o));
  }

  // ============================================================ VERSE 2
  shot(95.36, 'holdOnTight', (ctx, S) => {
    const { t, lt } = S;
    const holdT = wt('Rusty the dog then said', 5);
    const moveT = wt('This thing', 5);
    ctx.save();
    cam(ctx, { zoom: 1.02 + lt * 0.015, shake: t > moveT ? 4 : 0, t });
    interior(ctx, t);
    seatedRusty(ctx, t, 960, 900, 1.0, Object.assign({ pawR: t > holdT - 0.2 ? 0.9 : 0, headTilt: 0.08 }, rustyTalk(t)));
    RV.drawKids(ctx, t, [[330, 990, 1.05], [1530, 990, 1.0], [1740, 990, 1.0]], (id, i) =>
      Object.assign(RV.move('idle', t, i), { turn: i ? -0.6 : 0.6, look: [i ? -0.8 : 0.8, 0], brow: 0.6, browAng: 0.5, mouth: 'flat' }));
    ctx.restore();
    if (t > holdT) RV.slam(ctx, 'HOLD ON TIGHT!', W / 2, 150, 96, t - holdT, { gradient: ['#ffffff', '#ffd23f'], dur: 2.2, burstC: '#ff4d6d' });
  }, { type: 'cut' });

  shot(99.7, 'seatbelt', (ctx, S) => {
    const { t, lt } = S;
    const clickT = wt("I've got my little", 6);
    const panT = wt('But you', 0) - 0.3;
    const pan = ease.inOutCubic(clamp((t - panT) / 0.5));
    ctx.save();
    cam(ctx, { x: pan * 900, zoom: 1.25, y: 60 });
    interior(ctx, t);
    seatedRusty(ctx, t, 960, 980, 1.25, Object.assign({ belt: t > clickT - 0.1, headTilt: t > clickT ? -0.12 : 0.05,
      eyes: t > clickT && t < panT ? 'happy' : 'open' }, t > clickT ? { mouth: 'grin' } : rustyTalk(t)));
    // kids with no seats, shrugging
    RV.drawKids(ctx, t, [[1700, 1060, 1.1], [1960, 1060, 1.05], [2200, 1060, 1.05]], (id, i) =>
      Object.assign(RV.move('idle', t, i), { turn: -0.4, armL: [1.35, -0.75], armR: [1.35, -0.75], brow: 1, browAng: 0.6, mouth: i === 1 ? 'o' : 'flat', headTilt: (i - 1) * 0.12 }, t > panT ? kidsSing(t) : {}));
    ctx.restore();
    if (t > clickT) RV.slam(ctx, 'CLICK!', 1450 - pan * 900, 380, 84, t - clickT, { gradient: ['#ffffff', '#4cc9f0'], dur: 1.4 });
  }, { type: 'cut' });

  shot(104.65, 'sitFloor', (ctx, S) => {
    const { t, lt } = S;
    const gripT = wt('And held onto', 1);
    ctx.save();
    cam(ctx, { zoom: 1.0, shake: 3, t });
    interior(ctx, t);
    seatedRusty(ctx, t, 960, 880, 0.85, { mouth: 'closed', headTilt: Math.sin(t * 2) * 0.05 });
    const handles = [-260, 560, 1360, 2180];
    [[430, 0], [1180, 1], [1520, 2]].forEach(([x, i]) => {
      const id = RV.KID_IDS[i];
      const grip = clamp((t - gripT - i * 0.12) / 0.3);
      const hx = i === 0 ? 560 : 1360;
      const pose = Object.assign({ x, y: 1000, s: 1.0, t, bob: (RV.KIDS[id].thigh + RV.KIDS[id].shin) * 0.62, eyes: 'wide', mouth: 'o', open: 0.5, brow: 1, browAng: 0.6,
        footL: [-30, 0], footR: [30, 0], blink: RV.blink(t, i) }, kidsSing(t));
      if (grip > 0) {
        const s = 1.0;
        pose.handL = [lerp(-60, (hx - x) / s - 40, grip), lerp(-160, (600 - 1000) / s, grip)];
        pose.handR = [lerp(60, (hx - x) / s + 40, grip), lerp(-160, (600 - 1000) / s, grip)];
      }
      RV.shadow(ctx, x, 1004, 80);
      RV.drawKid(ctx, id, pose);
    });
    void handles;
    ctx.restore();
  }, { type: 'cut' });

  shot(108.1, 'redButton', (ctx, S) => {
    const { t, lt } = S;
    const pressT = wt('And he pressed', 6);
    const press = t < pressT ? 0 : clamp(1 - (t - pressT - 0.25) / 0.4) ;
    RV.radialBg(ctx, '#3d4f66', '#111827');
    ctx.save();
    cam(ctx, { zoom: 1.0 + lt * 0.06, shake: t > pressT ? 10 : 0, t });
    RV.bigRedButton(ctx, W / 2, 760, t > pressT - 0.08 ? Math.max(press, t < pressT + 0.25 ? 1 : 0) : 0, 3.2, t);
    // Rusty's paw descending from above
    const py = t < pressT - 0.5 ? lerp(-400, -120, ease.outCubic(clamp((t - S.shot.t0) / 0.6))) + Math.sin(t * 6) * 18
      : lerp(-120, 420, ease.inBack(clamp((t - pressT + 0.5) / 0.5), 1.5));
    RV.limb(ctx, [[W / 2, -300], [W / 2 + 10, py - 60]], 120, RV.RUSTY.FUR, 7);
    ellipse(ctx, W / 2 + 10, py, 90, 70); fs(ctx, RV.RUSTY.FUR_HI, 7);
    [[-50, 50], [-17, 64], [17, 64], [50, 50]].forEach(([dx, dy]) => { ellipse(ctx, W / 2 + 10 + dx, py + dy - 20, 20, 16); fs(ctx, '#ee9a9a', 4); });
    ctx.restore();
    if (t > pressT) { RV.slam(ctx, 'PRESS!', W / 2, 170, 130, t - pressT, { gradient: ['#fff3b0', '#ff4d6d', '#b5179e'], dur: 1.4 }); RV.flash(ctx, clamp(1 - (t - pressT) / 0.3) * 0.9); }
    else RV.bigText(ctx, '...', W / 2, 170, 120, { fill: '#ffffff' });
  }, { type: 'cut' });

  shot(110.2, 'spin', (ctx, S) => {
    const { t, lt } = S;
    const spin = 0.6 * lt * lt + lt * 1.2;
    ctx.save();
    cam(ctx, { rot: spin, zoom: 1.35 });
    interior(ctx, t);
    ctx.restore();
    // spiral overlay
    ctx.save();
    ctx.globalAlpha = 0.28;
    RV.sunburst(ctx, W / 2, H / 2, t, { colors: ['#ffffff', 'rgba(0,0,0,0)'], n: 14, speed: 3 });
    ctx.restore();
    const cast = ['big', 'rusty', 'boy', 'little'];
    cast.forEach((who, i) => {
      const a = spin * 1.3 + (i / 4) * TAU;
      const r = 330 + Math.sin(t * 3 + i) * 30;
      const x = W / 2 + Math.cos(a) * r * 1.3, y = H / 2 + Math.sin(a) * r * 0.8 + 150;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a * 1.5);
      if (who === 'rusty') RV.drawRusty(ctx, { x: 0, y: 150, s: 0.7, t, pose: 'stand', armL: [2.5, 0.2], armR: [2.5, 0.2], footL: [0, 30], mouth: 'open', open: 1, eyes: 'wide', goggles: 2 });
      else RV.drawKid(ctx, who, { x: 0, y: 170, s: 0.7, t, armL: [2.6, 0.3], armR: [2.4, 0.2], footL: [-20, 40], footR: [20, 10], eyes: 'wide', mouth: 'open', open: 0.9, sway: 3, brow: 1 });
      ctx.restore();
    });
    RV.letters(ctx, 'WHOOOAAA!', W / 2, 150, 110, { gradient: ['#ffffff', '#4cc9f0', '#7209b7'] }, (i) => ({ dy: Math.sin(t * 8 + i * 0.7) * 22, r: Math.sin(t * 6 + i) * 0.15, s: RV.pop(lt - 0.3 - i * 0.05) }));
  }, { type: 'cut' });

  shot(113.45, 'shudder', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { shake: 22, t, zoom: 1.05 });
    RV.field(ctx, t, { moonX: 1600 });
    RV.drawBox(ctx, 960, 920, { s: 1.1, t, glow: 1.2 + Math.sin(t * 30) * 0.4, shake: 18 });
    // bolts popping + sparks + steam
    for (let i = 0; i < 12; i++) {
      const ph = RV.fract(lt * 0.9 + i / 12);
      const a = hash(i * 3.1) * TAU;
      const x = 960 + Math.cos(a) * (120 + ph * 700), y = 520 + Math.sin(a) * (120 + ph * 420) + ph * ph * 300;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ph * 20);
      if (i % 3 === 0) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, 0, 40 * (1 - ph), '#ffd23f', 1); }
      else { rrect(ctx, -10, -5, 20, 10, 3); fs(ctx, '#c9d2de', 3); }
      ctx.restore();
      if (i < 5) { ctx.save(); ctx.globalAlpha = 0.6 * (1 - ph); circle(ctx, 960 + (i - 2) * 120 + ph * 60, 420 - ph * 300, 40 + ph * 60); fs(ctx, '#e9eef6', 4); ctx.restore(); }
    }
    ctx.restore();
    RV.bigText(ctx, 'RATTLE!', 420 + Math.sin(t * 40) * 6, 260, 100, { fill: '#ffd23f', rot: -0.15 });
    RV.bigText(ctx, 'SHAKE!', 1500 + Math.sin(t * 37) * 6, 340, 100, { fill: '#ff4fa3', rot: 0.12 });
  }, { type: 'flash', dur: 0.25 });

  shot(115.7, 'wonder', (ctx, S) => {
    const { t, lt, d } = S;
    const qT = wt("'I wonder", 0);
    ctx.save();
    RV.timeVortex(ctx, t * 1.5, W / 2, H / 2, 1000, { n: 14 });
    ctx.restore();
    const closeUp = clamp((t - qT + 0.4) / 0.6);
    const kidsA = 1 - closeUp;
    if (kidsA > 0) {
      ctx.save(); ctx.globalAlpha = kidsA;
      RV.KID_IDS.forEach((id, i) => {
        const a = t * 0.8 + i * 2.1;
        const x = W / 2 + Math.cos(a) * 560, y = H / 2 + Math.sin(a) * 260 + 200;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t + i) * 0.8);
        RV.drawKid(ctx, id, { x: 0, y: 150, s: 0.65, t, eyes: 'open', blink: 0.45 + 0.3 * Math.sin(t * 2 + i), mouth: 'o', open: 0.3, armL: [2.0, 0.4], armR: [1.6, 0.6], sway: 2 });
        RV.dizzy(ctx, 0, 150 + RV.kidHead(id, 0.65) - 60, 70, t + i);
        ctx.restore();
      });
      ctx.restore();
    }
    // Rusty drifts to the centre, curious
    const rs = lerp(0.8, 1.5, ease.inOutCubic(closeUp));
    ctx.save();
    ctx.translate(W / 2, H / 2 + 60);
    ctx.rotate(Math.sin(t * 0.9) * 0.2 * (1 - closeUp));
    RV.drawRusty(ctx, Object.assign({ x: 0, y: 330 * rs / 1.5 + 160, s: rs, t, pose: 'stand', headTilt: -0.25, brow: 1, goggles: 1,
      armL: [0.6, 0.3], armR: [1.9, -2.4], look: [0.4, -0.6] }, t > qT ? rustyTalk(t) : { mouth: 'closed' }));
    ctx.restore();
    if (t > qT) RV.speechBubble(ctx, 1500, 260, 300, 190, 1250, 420, { text: '?', size: 130, bg: '#ffffff' });
    void d;
  }, { type: 'iris', dur: 0.8 });

  shot(121.0, 'blackout', (ctx, S) => {
    const { t, lt } = S;
    const outT = wt('And then we all blacked', 4);
    RV.timeVortex(ctx, t * 0.8, W / 2, H / 2, 1000, { n: 10 });
    ctx.fillStyle = 'rgba(10,0,30,0.35)'; ctx.fillRect(0, 0, W, H);
    // the kids' faces getting sleepy
    RV.KID_IDS.forEach((id, i) => {
      const x = 480 + i * 480, y = 1180 + Math.sin(t * 2 + i) * 10;
      const heavy = clamp((t - 121.4) / 2.6);
      RV.drawKid(ctx, id, { x, y, s: 1.55, t, blink: 0.25 + heavy * 0.7, mouth: 'o', open: 0.2, headTilt: Math.sin(t * 1.5 + i) * 0.2, sway: 1 });
      RV.dizzy(ctx, x, y + RV.kidHead(id, 1.55) - 130, 110, t + i);
    });
    // eyelids closing
    const c = ease.inOutCubic(clamp((t - outT + 0.2) / 0.8));
    if (c > 0) {
      ctx.fillStyle = '#05030f';
      ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(W + 10, -10); ctx.lineTo(W + 10, c * H * 0.55);
      ctx.quadraticCurveTo(W / 2, c * H * 0.75, -10, c * H * 0.55); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10, H + 10); ctx.lineTo(W + 10, H + 10); ctx.lineTo(W + 10, H - c * H * 0.55);
      ctx.quadraticCurveTo(W / 2, H - c * H * 0.75, -10, H - c * H * 0.55); ctx.closePath(); ctx.fill();
    }
    if (t > outT + 0.3) {
      ['Z', 'z', 'Z'].forEach((z, i) => {
        const ph = RV.fract((t - outT) * 0.5 + i / 3);
        RV.bigText(ctx, z, W / 2 + 120 + i * 60 + Math.sin(ph * 6) * 30, H / 2 - ph * 260, 60 + i * 20, { fill: '#b8c0ff', shadow: false });
      });
    }
  }, { type: 'cut' });

  shot(125.7, 'wakeUp', (ctx, S) => {
    const { t, lt } = S;
    const w1 = wt('And when we woke', 3), w2 = wt('And when we woke', 4);
    ctx.save();
    cam(ctx, { zoom: 1.0 });
    interior(ctx, t, { lights: 0.6 + 0.4 * Math.abs(Math.sin(t * 7)), dirt: true });
    ctx.restore();
    // Rusty peering right into the lens
    ctx.save();
    ctx.translate(W / 2, 640);
    ctx.scale(3.4, 3.4);
    RV.rustyHead(ctx, { t, eyes: 'open', mouth: 'tongue', headTilt: 0.2, goggles: 1, blink: RV.blink(t, 4), look: [0, 0.3], earFlip: 'R' });
    ctx.restore();
    // blurry eyelids opening in two blinks
    const o1 = ease.outCubic(clamp((t - w1) / 0.35)) * (t < w2 ? 0.5 : 1);
    const o2 = t > w2 ? ease.outCubic(clamp((t - w2) / 0.5)) : 0;
    const open = Math.max(0, Math.min(1, t < w2 ? o1 : 0.5 + o2 * 0.5));
    const lid = (1 - open) * H * 0.55;
    ctx.fillStyle = '#05030f';
    ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(W + 10, -10); ctx.lineTo(W + 10, lid); ctx.quadraticCurveTo(W / 2, lid + 150 * (1 - open), -10, lid); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, H + 10); ctx.lineTo(W + 10, H + 10); ctx.lineTo(W + 10, H - lid); ctx.quadraticCurveTo(W / 2, H - lid - 150 * (1 - open), -10, H - lid); ctx.closePath(); ctx.fill();
    void lt;
  }, { type: 'cut' });

  shot(128.6, 'goodBad', (ctx, S) => {
    const { t, lt } = S;
    const gT = wt('Rusty said', 4), bT = wt('Rusty said', 7);
    ctx.save();
    cam(ctx, { zoom: 1.08 });
    interior(ctx, t, { dirt: true, lights: 0.85 + 0.15 * Math.sin(t * 9) });
    RV.drawKids(ctx, t, [[300, 1040, 1.0], [1640, 1040, 1.0], [1830, 1060, 0.95]], (id, i) =>
      Object.assign(RV.move('idle', t, i), { bob: (RV.KIDS[id].thigh + RV.KIDS[id].shin) * 0.6, turn: i ? -0.6 : 0.6, look: [i ? -1 : 1, -0.4], blink: RV.blink(t, i), eyes: 'open', mouth: 'o', open: 0.3 }));
    const holdSign = (text, col, at, side) => (c, hp) => {
      const p = RV.pop(t - at, 0.4);
      if (p <= 0) return;
      c.save(); c.translate(hp[0], hp[1]); c.scale(p, p); c.rotate(side * 0.08 + Math.sin(t * 3) * 0.04);
      RV.sign(c, text, side * 120, -10, { size: 44, bg: col, color: '#ffffff', post: 60 });
      c.restore();
    };
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1000, s: 1.2, t, pose: 'stand', goggles: 1, blink: RV.blink(t, 2),
      armL: [1.55, 0.5], armR: [1.55, 0.5],
      holdL: holdSign('GOOD NEWS', '#06a77d', gT, -1), holdR: holdSign('BAD NEWS', '#d62839', bT, 1) }, rustyTalk(t)));
    ctx.restore();
    void lt;
  }, { type: 'cut' });

  shot(132.3, 'goodFirst', (ctx, S) => {
    const { t, lt } = S;
    RV.radialBg(ctx, '#ffe066', '#f77f00');
    ctx.save(); ctx.globalAlpha = 0.25; RV.sunburst(ctx, W / 2, H / 2, t, { colors: ['#ffffff', 'rgba(255,255,255,0)'], n: 20 }); ctx.restore();
    const lean = ease.inOutCubic(clamp((t - 135.9) / 0.5));
    RV.KID_IDS.forEach((id, i) => {
      const x = 440 + i * 520, y = 1350 - lean * 60;
      RV.drawKid(ctx, id, Object.assign({ x, y, s: 1.9 + lean * 0.2, t, lean: (1 - i) * -0.05, eyes: 'wide', look: [0, -0.2], brow: 1,
        armL: [0.8, -1.7], armR: [0.8, -1.7], blink: RV.blink(t, i + 2) }, kidsSing(t)));
    });
    RV.sparkleField(ctx, t, { n: 16, y1: 500, size: 30 });
    if (lt > 3.6) RV.bigText(ctx, 'DRUMROLL...', W / 2, 150 + Math.sin(t * 30) * 4, 90, { fill: '#ffffff' });
  }, { type: 'zoom', dur: 0.4 });

  shot(137.3, 'groovy1972', (ctx, S) => {
    const { t, lt } = S;
    const yT = wt('He said \'The good news', 8);
    const stop0 = 138.95, stop1 = 140.95; // the band drops out around "1972"
    const frozen = t > stop0 && t < stop1;
    const tt = frozen ? stop0 : t > stop1 ? t - (stop1 - stop0) : t;
    RV.stripes70s(ctx, tt, { cx: W / 2, cy: H + 150 });
    for (let i = 0; i < 16; i++) {
      const x = hash(i * 3.3) * W, y = hash(i * 5.1) * H * 0.9;
      const s = 26 + hash(i) * 30;
      ctx.save(); ctx.translate(x, y); ctx.rotate(tt * (i % 2 ? 1 : -1)); RV.daisy(ctx, 0, 0, s * (1 + 0.2 * RV.kick(tt, 5)), ['#ffd23f', '#ff4d6d', '#ff9f1c'][i % 3]); ctx.restore();
    }
    // Rusty in flower power
    const dance = t > stop1;
    const pose = dance ? RV.rustyMove('disco', t) : { pose: 'stand', armL: [0.5, 0.2], armR: [2.2, 0.3], mouth: 'grin', eyes: 'happy' };
    ctx.save();
    cam(ctx, { zoom: 1 + (dance ? kick(t, 6) * 0.03 : 0) });
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1060, s: 1.25, t: tt, hat: (c) => { for (let k = 0; k < 7; k++) RV.daisy(c, -60 + k * 20, -62 - Math.abs(3 - k) * -4, 16, k % 2 ? '#ff4d6d' : '#ffd23f'); } }, pose));
    if (dance) {
      RV.drawKid(ctx, 'big', Object.assign(RV.move('disco', t, 0), { x: 360, y: 1080, s: 1.2, t, mouth: 'grin' }));
      RV.drawKid(ctx, 'boy', Object.assign(RV.move('twist', t, 1), { x: 1520, y: 1080, s: 1.2, t, mouth: 'grin' }));
      RV.drawKid(ctx, 'little', Object.assign(RV.move('hips', t, 2), { x: 1760, y: 1080, s: 1.15, t, mouth: 'grin', eyes: 'happy' }));
    }
    ctx.restore();
    if (t > yT) {
      const lt2 = t - yT;
      const s = ease.outElastic(clamp(lt2 / 0.9));
      ctx.save(); ctx.translate(W / 2, 290); ctx.scale(s, s); ctx.rotate(-0.05 + Math.sin(t * 2) * 0.03);
      for (let k = 5; k >= 0; k--) RV.bigText(ctx, '1972', k * 6, k * 6, 260, { font: RV.FONT.groovy, fill: ['#ffd23f', '#ff9e00', '#ff6d00', '#bb3e03', '#6f1d1b', '#3d0c02'][k], shadow: false, lw: k ? 0 : 16 });
      ctx.restore();
    } else RV.bigText(ctx, 'GOOD NEWS...', W / 2, 250, 110, { font: RV.FONT.groovy, fill: '#ffd23f' });
    RV.retroFilm(ctx, t, 0.7);
    if (frozen) { ctx.fillStyle = 'rgba(255,240,200,0.12)'; ctx.fillRect(0, 0, W, H); }
    void lt;
  }, { type: 'star', dur: 0.6 });

  shot(143.2, 'notSpace', (ctx, S) => {
    const { t, lt } = S;
    const xT = wt('The bad news', 6);
    RV.radialBg(ctx, '#8d99ae', '#2b2d42');
    // space postcard with a big red X
    ctx.save();
    ctx.translate(W / 2, 400); ctx.rotate(-0.04);
    rrect(ctx, -420, -260, 840, 520, 20); fs(ctx, '#ffffff', 7);
    ctx.save(); rrect(ctx, -390, -230, 780, 460, 12); ctx.clip();
    RV.spaceWindow(ctx, t, 0, 0, 420);
    ctx.restore();
    ctx.font = `54px ${RV.FONT.title}`; ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center'; ctx.lineWidth = 10; ctx.strokeStyle = OUT;
    ctx.strokeText('SPACE', 0, 200); ctx.fillText('SPACE', 0, 200);
    if (t > xT) {
      const p = ease.outBack(clamp((t - xT) / 0.25), 2);
      ctx.save(); ctx.scale(p, p);
      [[1, 1], [1, -1]].forEach(([a, b]) => {
        ctx.beginPath(); ctx.moveTo(-340 * a, -220 * b); ctx.lineTo(340 * a, 220 * b);
        ctx.lineWidth = 90; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 70; ctx.strokeStyle = '#e63946'; ctx.stroke();
      });
      ctx.restore();
    }
    ctx.restore();
    // sad faces
    const sad = t > wt('The bad news', 1);
    RV.drawKids(ctx, t, [[300, 1150, 1.3], [1580, 1150, 1.25], [1790, 1160, 1.2]], (id, i) =>
      Object.assign({ turn: i ? -0.3 : 0.3, blink: RV.blink(t, i) }, sad ? { mouth: 'frown', brow: -0.2, browAng: 0.8, look: [0, 0.6] } : kidsSing(t)));
    RV.drawRusty(ctx, Object.assign({ x: 1180, y: 1010, s: 1.0, t, earL: 0.5, earR: 0.5, headTilt: 0.2, brow: 1, wag: 0.1, goggles: 1 }, t > xT ? { mouth: 'frown', eyes: 'puppy' } : rustyTalk(t)));
    // tiny rain cloud over Rusty
    if (t > xT) {
      RV.cloud(ctx, 1180, 560 + Math.sin(t * 2) * 6, 0.9, '#6c757d');
      ctx.strokeStyle = '#90e0ef'; ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) { const ph = RV.fract(t * 2 + i / 8); ctx.beginPath(); ctx.moveTo(1120 + i * 16, 600 + ph * 140); ctx.lineTo(1116 + i * 16, 620 + ph * 140); ctx.stroke(); }
    }
    if (t > xT + 0.2) RV.bigText(ctx, 'WAH WAH...', 420, 170, 80, { fill: '#90e0ef', rot: -0.1 });
    void lt;
  }, { type: 'cut' });

  shot(148.3, 'lookOutside', (ctx, S) => {
    const { t, lt } = S;
    const lookT = wt("He said 'Look", 2);
    const push = ease.inOutCubic(clamp((t - lookT) / 1.0));
    ctx.save();
    cam(ctx, { x: lerp(0, -760, push), y: lerp(0, -110, push), zoom: 1 + push * 1.9 });
    interior(ctx, t, { leftWin: (c, x, y, r) => { c.fillStyle = '#020104'; c.fillRect(x - r, y - r, r * 2, r * 2); } });
    RV.drawKids(ctx, t, [[520, 990, 1.0], [1420, 990, 1.0], [1640, 990, 1.0]], (id, i) =>
      Object.assign(RV.move('idle', t, i), { turn: t > lookT ? -0.9 : 0.4, look: [t > lookT ? -1 : 0.6, -0.2] }, t < lookT ? kidsSing(t) : { mouth: 'o', open: 0.4 }));
    RV.drawRusty(ctx, Object.assign({ x: 980, y: 960, s: 1.0, t, pose: 'stand', goggles: 1, armL: t > lookT - 0.3 ? [1.75, 0.15] : [0.4, 0.2], armR: [0.4, 0.2], headTurn: -0.6 }, t > lookT - 0.4 ? rustyTalk(t) : { mouth: 'closed' }));
    ctx.restore();
  }, { type: 'cut' });

  shot(151.45, 'nothingThere', (ctx, S) => {
    const { t, lt } = S;
    // outside the ship looking in: faces squished against the porthole, darkness all around
    ctx.fillStyle = '#0c0706'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2 - 20, r = 330;
    circle(ctx, cx, cy, r + 50); fs(ctx, '#caa04a', 8);
    ctx.save(); circle(ctx, cx, cy, r); ctx.clip();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, '#fff3c4'); g.addColorStop(1, '#f4a261');
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    RV.drawKid(ctx, 'big', { x: cx - 180, y: cy + 520, s: 1.5, t, turn: 0.3, look: [0.2, 0], eyes: 'open', mouth: 'flat', squash: 0.95, blink: RV.blink(t, 1) });
    RV.drawKid(ctx, 'boy', { x: cx + 40, y: cy + 470, s: 1.5, t, look: [0, 0], eyes: 'open', mouth: 'o', open: 0.2, blink: RV.blink(t, 2) });
    RV.drawKid(ctx, 'little', { x: cx + 230, y: cy + 480, s: 1.45, t, turn: -0.3, look: [-0.2, 0], eyes: 'open', mouth: 'flat', blink: RV.blink(t, 3) });
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(cx - 120, cy - 150, 160, 60, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
    circle(ctx, cx, cy, r); ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.stroke();
    // a worm sneaks past in the dark
    const wx = lerp(-200, W + 200, clamp((lt - 0.4) / 1.6));
    ctx.save(); ctx.globalAlpha = 0.9; RV.worm(ctx, wx, 1020, 1.1, { t, color: '#b56576' }); ctx.restore();
    RV.bigText(ctx, '...', 1560, 250, 140, { fill: '#ffffff' });
  }, { type: 'cut' });

  shot(153.3, 'underground', (ctx, S) => {
    const { t, lt } = S;
    const uT = wt("He said 'It's", 5);
    const out = ease.inOutCubic(clamp(lt / 3.4));
    const bx = 960, by = 880;
    ctx.save();
    const z = lerp(4.2, 1.0, out);
    cam(ctx, { zoom: z, x: lerp(bx - W / 2, 0, out), y: lerp(by - 330 - H / 2, 0, out) });
    RV.underground(ctx, t, { surfaceY: 300, vanX: 1150 });
    // hole shaft the box drilled
    ctx.fillStyle = '#3d2215';
    ctx.beginPath(); ctx.moveTo(bx - 120, 300); ctx.lineTo(bx + 120, 300); ctx.lineTo(bx + 200, by); ctx.lineTo(bx - 200, by); ctx.closePath(); ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
    RV.drawBox(ctx, bx, by, { s: 0.9, t, glow: 0.5, porthole: 1, tilt: -0.08 });
    // worms waving
    [[560, 760, 0.8], [1380, 700, 0.9], [1700, 980, 0.8], [300, 1000, 0.7]].forEach(([x, y, s], i) => {
      const up = ease.outBack(clamp((lt - 2.4 - i * 0.3) / 0.4));
      if (up > 0) RV.worm(ctx, x, y + (1 - up) * 120, s * up, { t, shades: i === 1, color: ['#ff8fa3', '#ffafcc', '#f9844a', '#e5989b'][i] });
    });
    ctx.restore();
    if (t > uT) RV.slam(ctx, 'UNDERGROUND!', W / 2, 190, 118, t - uT, { gradient: ['#ffe8b0', '#ca6702', '#6f1d1b'], dur: 3.5, burstC: '#e9d8a6' });
  }, { type: 'cut' });

  // ============================================================ CHORUS 2 — underground groove
  const GROOVE = { font: RV.FONT.groovy, gradients: [['#ffe8b0', '#ee9b00', '#bb3e03'], ['#fff1e6', '#f4a261', '#9c6644'], ['#fefae0', '#ffd23f', '#e76f51'], ['#ffe5ec', '#ff8fab', '#c9184a']], burstC: '#e9d8a6', size: 118 };

  function cavern(ctx, t) {
    ctx.fillStyle = '#5a331f'; ctx.fillRect(0, 0, W, H);
    // cave hollow
    const g = ctx.createRadialGradient(W / 2, H * 0.6, 100, W / 2, H * 0.6, 1100);
    g.addColorStop(0, '#c2703d'); g.addColorStop(0.6, '#8d4a24'); g.addColorStop(1, '#4a2918');
    ctx.fillStyle = g;
    RV.curve(ctx, [[100, 980], [80, 520], [300, 200], [760, 90], [1200, 110], [1650, 240], [1840, 560], [1820, 990]], true, 0.7);
    ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.stroke();
    // groovy light blobs
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ['#ff9e00', '#ff006e', '#ffd23f'].forEach((c, i) => glow(ctx, W / 2 + Math.sin(t * 0.8 + i * 2) * 500, 450 + Math.cos(t * 0.6 + i) * 150, 500, c, 0.18 + 0.1 * RV.kick(t, 5)));
    ctx.restore();
    // stalactites
    for (let i = 0; i < 9; i++) {
      const x = 300 + i * 160, h = 60 + hash(i) * 90;
      ctx.beginPath(); ctx.moveTo(x - 30, 120 + hash(i * 3) * 60); ctx.lineTo(x, 120 + hash(i * 3) * 60 + h); ctx.lineTo(x + 30, 120 + hash(i * 3) * 60); ctx.closePath();
      fs(ctx, '#7a4a2f', 4);
    }
    ellipse(ctx, W / 2, 1010, 860, 90); fs(ctx, '#9c6644', 6);
  }

  shot(159.79, 'c2_cavern', (ctx, S) => {
    const { t } = S;
    cavern(ctx, t);
    ctx.save();
    cam(ctx, { zoom: 1 + kick(t, 6) * 0.03 });
    [[200, 560, 0.9], [1720, 520, 0.9], [420, 300, 0.7], [1500, 280, 0.7]].forEach(([x, y, s], i) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(i % 2 ? -0.4 : 0.4);
      RV.worm(ctx, 0, 0, s, { t: t + i, shades: i % 2 === 0, color: ['#ff8fa3', '#ffafcc', '#f9844a', '#e5989b'][i] });
      ctx.restore();
    });
    RV.drawKids(ctx, t, [[420, 1020, 1.15], [1480, 1020, 1.1], [1720, 1020, 1.1]], (id, i) => Object.assign(RV.move(['hips', 'twist', 'disco'][i], t, i), { mouth: 'grin', eyes: i === 2 ? 'happy' : 'open' }));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1020, s: 1.2, t, hat: (c) => { c.beginPath(); c.arc(0, -20, 70, Math.PI * 1.15, Math.PI * 1.85); c.lineWidth = 12; c.strokeStyle = '#ff006e'; c.stroke(); } }, RV.rustyMove('disco', t)));
    ctx.restore();
    chorusSlam(ctx, t, 'chorus2', GROOVE);
    RV.retroFilm(ctx, t, 0.5);
    RV.flash(ctx, clamp(1 - (t - 159.79) / 0.35) * 0.8, '#ffe8b0');
  }, { type: 'cut' });

  shot(165.0, 'c2_worms', (ctx, S) => {
    const { t, lt } = S;
    RV.stripes70s(ctx, t, { cx: W / 2, cy: -200, colors: ['#582f0e', '#7f4f24', '#936639', '#a68a64', '#b6ad90'] });
    ellipse(ctx, W / 2, 1040, 1150, 230); fs(ctx, '#6b3f27', 6);
    // worm chorus line
    for (let i = 0; i < 7; i++) {
      if (i === 3) continue;
      const x = 180 + i * 260, b = RV.bounce(t, 1, i * 0.25);
      const hat = (c, hx, hy) => { rrect(c, hx - 26, hy - 34, 52, 40, 6); fs(c, '#1b1030', 3); rrect(c, hx - 40, hy + 2, 80, 10, 4); fs(c, '#1b1030', 3); };
      RV.worm(ctx, x, 900 - b * 40, 1.6, { t: t * 1.2 + i, shades: i % 2 === 1, hat: i % 2 ? null : hat, color: ['#ff8fa3', '#f9844a', '#ffafcc', '#e5989b'][i % 4] });
    }
    // Rusty digging to the beat in front
    ctx.save();
    ctx.translate(0, 0);
    RV.drawRustySide(ctx, { x: 900, y: 960, s: 1.4, t, dig: 1, gait: 0, mouth: 'tongue', face: 1 });
    ctx.restore();
    for (let i = 0; i < 10; i++) {
      const ph = RV.fract(RV.beat(t) * 0.5 + i * 0.1);
      const x = 700 - ph * 520 + i * 10, y = 820 - Math.sin(ph * Math.PI) * 380;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ph * 10 + i);
      ellipse(ctx, 0, 0, 22, 16); fs(ctx, '#7a4a2f', 3);
      ctx.restore();
    }
    chorusSlam(ctx, t, 'chorus2', Object.assign({}, GROOVE, { y: 190 }));
    RV.retroFilm(ctx, t, 0.5);
    void lt;
  }, { type: 'whip', dur: 0.45 });

  shot(170.3, 'c2_tv', (ctx, S) => {
    const { t } = S;
    // 70s living room wall
    ctx.fillStyle = '#e76f51'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f4a261';
    for (let x = -100; x < W + 100; x += 120) { ctx.beginPath(); ctx.arc(x, 0, 60, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(x + 60, H, 60, Math.PI, TAU); ctx.fill(); }
    ctx.fillStyle = '#bc6c25'; ctx.fillRect(0, 930, W, 150);
    RV.lavaLamp(ctx, 190, 930, 1.3, t);
    RV.vinyl(ctx, 1790, 820, 90, t);
    RV.retroTV(ctx, 880, 520, 1040, 640, (c, w, h) => {
      // studio: checkerboard floor + stripes
      c.fillStyle = '#ffb703'; c.fillRect(0, 0, w, h);
      c.save(); c.globalAlpha = 0.9; RV.stripes70s(c, t, { cx: w / 2, cy: h * 1.3, colors: ['#fb8500', '#ffb703', '#e76f51', '#9c6644'] }); c.restore();
      for (let r = 0; r < 4; r++) for (let q = 0; q < 12; q++) { c.fillStyle = (r + q) % 2 ? '#1b1030' : '#fff1e6'; c.fillRect(q * w / 12, h * 0.72 + r * h * 0.07, w / 12, h * 0.07); }
      c.save(); c.scale(0.8, 0.8);
      const k = 1 / 0.8;
      RV.drawKid(c, 'big', Object.assign(RV.move('disco', t, 0), { x: w * 0.18 * k, y: h * 0.95 * k, s: 0.95, t, mouth: 'grin' }));
      RV.drawRusty(c, Object.assign({ x: w * 0.42 * k, y: h * 0.95 * k, s: 0.95, t }, RV.rustyMove('twist', t)));
      RV.drawKid(c, 'boy', Object.assign(RV.move('robot', t, 1), { x: w * 0.64 * k, y: h * 0.95 * k, s: 0.95, t, mouth: 'grin' }));
      RV.drawKid(c, 'little', Object.assign(RV.move('wave', t, 2), { x: w * 0.83 * k, y: h * 0.95 * k, s: 0.95, t, mouth: 'grin', eyes: 'happy' }));
      c.restore();
      RV.bigText(c, 'THE RUSTY SHOW', w / 2, 70, 64, { font: RV.FONT.groovy, fill: '#fff1e6', stroke: '#6f1d1b' });
    });
    chorusSlam(ctx, t, 'chorus2', Object.assign({}, GROOVE, { y: 110, size: 100 }));
    RV.retroFilm(ctx, t, 0.6);
  }, { type: 'wipe', dur: 0.6, colors: ['#ee9b00', '#bb3e03', '#6f1d1b'] });

  shot(176.5, 'c2_jump', (ctx, S) => {
    const { t, lt } = S;
    cavern(ctx, t);
    ctx.save();
    cam(ctx, { zoom: 1.05 + kick(t, 5) * 0.04, shake: RV.kick(t, 8) * 6, t });
    for (let i = 0; i < 6; i++) {
      const x = 150 + i * 330, jb = Math.abs(Math.sin(Math.PI * RV.half(t) + i));
      RV.worm(ctx, x, 1000 - jb * 60, 0.9, { t: t + i, shades: i % 2 === 0, color: ['#ff8fa3', '#f9844a', '#ffafcc'][i % 3] });
    }
    RV.drawKids(ctx, t, [[420, 1030, 1.15], [1480, 1030, 1.1], [1720, 1030, 1.1]], (id, i) => Object.assign(RV.move('cheer', t, i * 0.3), {}));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1030, s: 1.2, t }, RV.rustyMove('cheer', t)));
    ctx.restore();
    // dirt bouncing on the beat
    for (let i = 0; i < 14; i++) {
      const y = 980 - Math.abs(Math.sin(Math.PI * RV.half(t) + i * 0.4)) * (100 + hash(i) * 200);
      ellipse(ctx, 100 + i * 130, y, 16, 12, i); fs(ctx, '#8d5a3b', 3);
    }
    chorusSlam(ctx, t, 'chorus2', GROOVE);
    if (lt > 5.2) RV.bigText(ctx, 'GROOVY!', W / 2, 520, 150 * RV.pop(lt - 5.2), { font: RV.FONT.groovy, gradient: ['#ffe8b0', '#ee9b00', '#bb3e03'] });
    RV.retroFilm(ctx, t, 0.5);
  }, { type: 'zoom', dur: 0.4 });

  // ============================================================ VERSE 3
  shot(182.63, 'getUsOut', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.12, y: 30 });
    interior(ctx, t, { dirt: true });
    RV.drawRusty(ctx, Object.assign({ x: 1400, y: 960, s: 0.95, t, pose: 'stand', goggles: 1, headTurn: -0.5, look: [-0.8, 0], brow: 1 }, RV.rustyMove('idle', t)));
    RV.drawKids(ctx, t, [[420, 1030, 1.2], [700, 1030, 1.15], [960, 1030, 1.15]], (id, i) =>
      Object.assign(RV.move('idle', t, i), { turn: 0.7, look: [1, -0.2], armL: [0.9, -1.8], armR: [0.9, -1.8], brow: 1, browAng: 0.7, eyes: 'wide', blink: RV.blink(t, i) }, kidsSing(t)));
    ctx.restore();
    if (lt > 1.8) RV.bigText(ctx, 'PLEASE!', 700, 200, 90 * RV.pop(lt - 1.8), { fill: '#ffd23f', rot: -0.08 });
  }, { type: 'black', dur: 0.4 });

  shot(186.95, 'tryingBest', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.45, y: 170, shake: 3, t });
    interior(ctx, t, { dirt: true, lights: 0.8 + 0.2 * Math.sin(t * 13) });
    const f = Math.sin(t * 28);
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1000, s: 1.1, t, pose: 'stand', goggles: 2, brow: 1,
      handL: [-120 + f * 30, -150 + Math.abs(f) * 30], handR: [120 - f * 30, -150 + Math.abs(Math.cos(t * 28)) * 30] }, rustyTalk(t)));
    RV.console(ctx, 960, 1180, t * 4, { lights: 1, lever: Math.sin(t * 12) * 0.8 });
    ctx.restore();
    // sweat drops + beeps
    for (let i = 0; i < 4; i++) {
      const ph = RV.fract(t * 1.5 + i / 4);
      const x = 960 + (i % 2 ? 1 : -1) * (160 + ph * 220), y = 300 - Math.sin(ph * Math.PI) * 120 + ph * 200;
      ctx.save(); ctx.globalAlpha = 1 - ph;
      ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.quadraticCurveTo(x + 18, y, x, y + 12); ctx.quadraticCurveTo(x - 18, y, x, y - 30); fs(ctx, '#90e0ef', 4);
      ctx.restore();
    }
    ['BEEP!', 'BOOP!', 'BLEEP!'].forEach((w, i) => {
      const on = RV.fract(t * 2.2 + i * 0.33) < 0.4;
      if (on) RV.bigText(ctx, w, [360, 1560, 480][i], [300, 360, 760][i], 70, { fill: ['#06d6a0', '#ffd23f', '#ff4fa3'][i], rot: (i - 1) * 0.15 });
    });
    void lt;
  }, { type: 'cut' });

  function blueprint(ctx, t) {
    ctx.fillStyle = '#1d4e89'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    void t;
  }
  function chalkBox(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
    rrect(ctx, -60, -160, 120, 160, 16); ctx.stroke();
    circle(ctx, 0, -110, 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -160); ctx.lineTo(0, -200); ctx.stroke();
    ctx.restore();
  }

  shot(189.35, 'aimSpace', (ctx, S) => {
    const { t, lt } = S;
    blueprint(ctx, t);
    chalkBox(ctx, 960, 900, 1.2);
    // planned route: straight up to the stars
    const p = ease.inOutCubic(clamp((lt - 0.3) / 1.6));
    ctx.save();
    ctx.setLineDash([24, 18]); ctx.lineDashOffset = -t * 60;
    ctx.beginPath(); ctx.moveTo(960, 640); ctx.lineTo(960, lerp(640, 250, p));
    ctx.lineWidth = 10; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
    ctx.restore();
    if (p > 0.95) { ctx.beginPath(); ctx.moveTo(930, 280); ctx.lineTo(960, 230); ctx.lineTo(990, 280); ctx.lineWidth = 10; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); }
    RV.planet(ctx, 960, 150, 70, { color: '#b388eb', ring: true });
    [[700, 120], [1250, 180], [820, 300], [1150, 80]].forEach(([x, y], i) => RV.sparkle(ctx, x, y, 22 + 6 * Math.sin(t * 5 + i), '#ffffff'));
    RV.bigText(ctx, 'PLAN A:', 430, 470, 70, { fill: '#ffffff', stroke: '#0b2545' });
    RV.bigText(ctx, 'OUTER SPACE', 430, 560, 70, { fill: '#ffd23f', stroke: '#0b2545' });
    RV.drawRusty(ctx, Object.assign({ x: 1500, y: 1000, s: 0.9, t, pose: 'stand', goggles: 1, armL: [1.9, 0.2], headTurn: -0.5 }, rustyTalk(t)));
  }, { type: 'wipe', dur: 0.5, colors: ['#ffffff', '#4cc9f0', '#1d4e89'] });

  shot(192.45, 'aimWest', (ctx, S) => {
    const { t, lt } = S;
    const westT = wt('But it looks like', 8);
    const hatT = wt('But it looks like', 5) + 0.3;
    // desert sunset palette for the "west"
    const warm = ease.inOutCubic(clamp((t - hatT) / 0.6));
    RV.skyGradient(ctx, [RV.mix('#1d4e89', '#ff9e00', warm), RV.mix('#1d4e89', '#ff6d00', warm), RV.mix('#1d4e89', '#f4a261', warm)]);
    if (warm > 0) {
      ctx.save(); ctx.globalAlpha = warm;
      circle(ctx, 1500, 700, 180); fs(ctx, '#ffd23f');
      ctx.fillStyle = '#bc6c25'; RV.curve(ctx, [[-100, 850], [400, 760], [900, 820], [1400, 740], [2100, 830], [2100, 1100], [-100, 1100]], true, 0.6); ctx.fill();
      // cactus
      [[300, 860], [1700, 840]].forEach(([x, y]) => {
        rrect(ctx, x - 22, y - 220, 44, 220, 22); fs(ctx, '#2d6a4f', 5);
        rrect(ctx, x - 80, y - 170, 40, 90, 20); fs(ctx, '#2d6a4f', 5);
        rrect(ctx, x + 40, y - 200, 40, 90, 20); fs(ctx, '#2d6a4f', 5);
      });
      ctx.restore();
    } else chalkBox(ctx, 960, 900, 1.2);
    // the dotted route bends sideways
    const bend = ease.inOutCubic(clamp((lt - 0.2) / 1.4));
    ctx.save(); ctx.setLineDash([24, 18]); ctx.lineDashOffset = -t * 60;
    ctx.beginPath(); ctx.moveTo(960, 640); ctx.quadraticCurveTo(960, 420, lerp(960, 280, bend), lerp(250, 520, bend));
    ctx.lineWidth = 10; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); ctx.restore();
    RV.compass(ctx, 1560, 300, 150, lerp(0, -Math.PI / 2, ease.outElastic(clamp((lt - 0.8) / 1.2))) + Math.sin(t * 20) * 0.03 * (1 - clamp(lt - 2)), t);
    // Rusty in a cowboy hat
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1060, s: 1.15, t, pose: 'stand', headTilt: -0.15, armL: [1.3, -0.6], armR: [1.3, -0.6], brow: 1,
      hat: t > hatT ? (c) => RV.cowboyHat(c, 0, -60 - (1 - ease.outBounce(clamp((t - hatT) / 0.6))) * 400, 0.95, -0.1) : null }, rustyTalk(t)));
    // tumbleweed
    if (t > westT) {
      const tx = lerp(-200, W + 200, clamp((t - westT) / 2.0));
      ctx.save(); ctx.translate(tx, 980 - Math.abs(Math.sin(t * 6)) * 60); ctx.rotate(t * 8);
      ctx.strokeStyle = '#8d5a3b'; ctx.lineWidth = 5;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(0, 0, 40 + i * 6, i, i + 3.5); ctx.stroke(); }
      ctx.restore();
      RV.slam(ctx, 'WEST?!', 480, 260, 120, t - westT, { gradient: ['#fff3b0', '#ff9e00', '#9c4a2f'], dur: 2.0 });
    }
  }, { type: 'cut' });

  shot(198.8, 'iSaid', (ctx, S) => {
    const { t } = S;
    ctx.save();
    cam(ctx, { zoom: 1.1 });
    interior(ctx, t, { dirt: true });
    RV.drawKid(ctx, 'big', Object.assign({ x: 760, y: 1250, s: 1.7, t, turn: 0.4, brow: 0.8, browAng: -0.4, armR: [2.6, -0.3], blink: RV.blink(t, 1) }, talkMouth(t)));
    RV.drawRusty(ctx, { x: 1400, y: 1000, s: 0.9, t, pose: 'stand', goggles: 1, eyes: 'wide', mouth: 'o', armL: [0.5, 0.2], armR: [0.5, 0.2], hat: (c) => RV.cowboyHat(c, 0, -60, 0.95, -0.1) });
    ctx.restore();
  }, { type: 'cut' });

  // ---- instrumental: escape attempts montage
  function attempt(ctx, t, n, lt, body) {
    ctx.save(); body(); ctx.restore();
    RV.slam(ctx, 'ATTEMPT #' + n, W / 2, 150, 104, lt, { gradient: ['#ffffff', '#ffd23f', '#ff9f1c'], dur: 1.6, burstC: '#ff4d6d' });
  }
  shot(199.67, 'escape1', (ctx, S) => {
    const { t, lt } = S;
    attempt(ctx, t, 1, lt, () => {
      const lurch = Math.sin(clamp(lt / 1.2) * Math.PI) * 0.22;
      cam(ctx, { rot: lurch, zoom: 1.2, shake: 6, t });
      interior(ctx, t, { dirt: true });
      const slide = ease.outCubic(clamp(lt / 1.0)) * -260;
      RV.drawKids(ctx, t, [[700 + slide, 990, 1.0], [1000 + slide, 990, 1.0], [1260 + slide, 990, 1.0]], (id, i) => ({ lean: -0.3, armL: [2.2, 0.3], armR: [1.9, 0.5], eyes: 'wide', mouth: 'open', open: 0.9, footR: [20, 20] }));
      RV.drawRusty(ctx, { x: 1500 + slide * 0.5, y: 960, s: 0.9, t, pose: 'stand', goggles: 2, handL: [-80, -330], handR: [80, -150], mouth: 'grin', hat: (c) => RV.cowboyHat(c, 0, -60, 0.95, 0.2) });
    });
  }, { type: 'flash', dur: 0.3 });
  shot(202.4, 'escape2', (ctx, S) => {
    const { t, lt } = S;
    attempt(ctx, t, 2, lt, () => {
      cam(ctx, { zoom: 1.05 });
      interior(ctx, t, { dirt: true });
      RV.drawKids(ctx, t, [[420, 990, 1.05], [1500, 990, 1.0], [1740, 990, 1.0]], (id, i) => Object.assign(RV.move('cheer', t, i), { mouth: 'grin' }));
      RV.drawRusty(ctx, Object.assign({ x: 960, y: 960, s: 1.0, t, goggles: 1 }, RV.rustyMove('wave', t)));
      RV.bubbles(ctx, t, { n: 46 });
    });
    RV.bigText(ctx, 'BUBBLES?!', W / 2, 960, 90 * RV.pop(lt - 0.6), { gradient: ['#ffffff', '#bdf0ff', '#4cc9f0'] });
  }, { type: 'flash', dur: 0.3 });
  shot(205.1, 'escape3', (ctx, S) => {
    const { t, lt } = S;
    attempt(ctx, t, 3, lt, () => {
      cam(ctx, { zoom: 1.05 + kick(t, 6) * 0.03 });
      interior(ctx, t, { dirt: true, lights: 0.4 });
      RV.discoSpots(ctx, t, 40, 0.45);
      RV.drawKids(ctx, t, [[420, 990, 1.05], [1500, 990, 1.0], [1740, 990, 1.0]], (id, i) => Object.assign(RV.move(['disco', 'robot', 'twist'][i], t, i), { mouth: 'grin' }));
      RV.drawRusty(ctx, Object.assign({ x: 960, y: 960, s: 1.0, t, shades: 'pink' }, RV.rustyMove('disco', t)));
      RV.confetti(ctx, t, { t0: 205.3, x: 960, y: 500, n: 110, spread: 3.2 });
    });
    RV.bigText(ctx, 'PARTY MODE!', W / 2, 960, 90 * RV.pop(lt - 0.5), { gradient: ['#ffc2e2', '#ff4fa3', '#9b5de5'] });
  }, { type: 'flash', dur: 0.3 });
  const escape4 = (ctx, t, lt) => {
    attempt(ctx, t, 4, lt, () => {
      cam(ctx, { zoom: 1.15 + lt * 0.04, shake: 4 + lt * 5, t });
      interior(ctx, t, { dirt: true, lights: 0.8 + 0.2 * Math.sin(t * 20) });
      RV.drawKids(ctx, t, [[420, 990, 1.05], [1500, 990, 1.0], [1740, 990, 1.0]], (id, i) => ({ bob: 60, armL: [2.4, 0.4], armR: [2.4, 0.4], eyes: 'wide', mouth: 'o', open: 0.8, brow: 1 }));
      RV.drawRusty(ctx, { x: 960, y: 960, s: 1.0, t, pose: 'stand', goggles: 2, handL: [-40, -130], handR: [40, -130], mouth: 'grin', brow: 1 });
      RV.console(ctx, 960, 1170, t * 3, { lever: 1.2 });
    });
  };
  shot(207.9, 'escape4', (ctx, S) => escape4(ctx, S.t, S.lt), { type: 'flash', dur: 0.3 });

  shot(211.45, 'freeze', (ctx, S) => {
    const { t, lt } = S;
    const ft = 211.4;
    escape4(ctx, ft, ft - 207.9);
    ctx.fillStyle = 'rgba(30,30,40,0.45)'; ctx.fillRect(0, 0, W, H);
    // cricket
    if (lt > 0.4) RV.bigText(ctx, '*chirp*', 1500 + Math.sin(t * 20) * 3, 820, 70, { fill: '#caffbf', font: RV.FONT.body, rot: -0.1 });
    RV.bigText(ctx, '. . .', W / 2, 520, 180 * RV.pop(lt - 0.1), { fill: '#ffffff' });
  }, { type: 'cut' });

  shot(213.3, 'stepForward', (ctx, S) => {
    const { t, lt } = S;
    const march = ease.inOutCubic(clamp(lt / 2.4));
    ctx.save();
    cam(ctx, { zoom: 1.0 + march * 0.25, y: march * 40 });
    interior(ctx, t, { dirt: true });
    RV.drawRusty(ctx, { x: 1300, y: 950, s: 0.85, t, pose: 'stand', goggles: 1, eyes: 'wide', mouth: 'grin', headTilt: 0.2, armL: [0.4, 0.2], armR: [1.9, -2.3], hat: (c) => RV.cowboyHat(c, 0, -60, 0.95, -0.1) });
    RV.drawKids(ctx, t, [null, [1560, 990, 0.95], [1760, 990, 0.95]], (id, i) =>
      Object.assign(RV.move('idle', t, i), { turn: -0.5, look: [-0.7, 0], mouth: 'o', open: 0.3 }));
    // big sister marches to the front, arms folded
    const bx = lerp(520, 760, march), s = lerp(1.0, 1.5, march);
    RV.drawKid(ctx, 'big', Object.assign(RV.move('march', t, 0, 1 - march), { x: bx, y: lerp(1000, 1180, march), s, t, armL: [1.0, -2.2], armR: [1.0, -2.2], brow: -0.3, browAng: -0.8, mouth: 'flat', turn: 0.2 }));
    ctx.restore();
    RV.bigText(ctx, 'HMPH!', 1220, 300, 90 * RV.pop(lt - 1.6), { fill: '#ff4d6d', rot: 0.1 });
  }, { type: 'cut' });

  shot(216.2, 'signedUp', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.0 + lt * 0.02 });
    interior(ctx, t, { dirt: true });
    RV.drawRusty(ctx, { x: 1420, y: 1000, s: 1.0, t, pose: 'stand', goggles: 1, eyes: 'puppy', mouth: 'grin', earL: 0.4, earR: 0.4, headTilt: 0.2, armL: [0.9, -1.7], armR: [0.9, -1.7], hat: (c) => RV.cowboyHat(c, 0, -60, 0.95, -0.1) });
    const wag = Math.sin(t * 14) * 0.25;
    RV.drawKid(ctx, 'big', Object.assign({ x: 640, y: 1260, s: 1.8, t, turn: 0.35, brow: -0.3, browAng: -0.9, armL: [1.0, -2.2], armR: [2.3 + wag, 0.9], look: [0.6, 0], blink: RV.blink(t, 1) }, talkMouth(t)));
    ctx.restore();
  }, { type: 'cut' });

  shot(219.0, 'stuckHole', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.35 - lt * 0.05, y: 170 });
    RV.underground(ctx, t, { surfaceY: 240, fossilX: 1500 });
    RV.drawBox(ctx, 960, 900, { s: 0.85, t, glow: 0.4, tilt: -0.08 });
    RV.sign(ctx, '1972', 640, 860, { size: 60, font: RV.FONT.groovy, bg: '#ee9b00', color: '#6f1d1b', post: 120, rot: -0.1 });
    ctx.restore();
    RV.retroFilm(ctx, t, 0.6);
  }, { type: 'cut' });

  shot(221.1, 'noStars', (ctx, S) => {
    const { t, lt } = S;
    const sT = wt('With no stars', 2), pT = wt('With no stars', 5), dT = wt('With no stars', 7), wT = wt('With no stars', 10);
    RV.radialBg(ctx, '#9c6644', '#3d2215');
    const icon = (x, at, draw, crossed) => {
      const p = RV.pop(t - at);
      if (p <= 0) return;
      ctx.save(); ctx.translate(x, 500); ctx.scale(p, p);
      draw();
      if (crossed && t > at + 0.35) {
        const q = ease.outBack(clamp((t - at - 0.35) / 0.2), 2);
        ctx.scale(q, q);
        [[1, 1], [1, -1]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(-150 * a, -150 * b); ctx.lineTo(150 * a, 150 * b); ctx.lineWidth = 50; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 34; ctx.strokeStyle = '#e63946'; ctx.stroke(); });
      }
      ctx.restore();
    };
    const label = (x, at, text) => { const p = RV.pop(t - at - 0.15); if (p > 0) RV.bigText(ctx, text, x, 760, 58 * p, { fill: '#fff1e6' }); };
    icon(330, sT, () => { RV.star(ctx, 0, 0, 150, 70, 5); fs(ctx, '#ffd23f', 8); }, true);
    label(330, sT, 'NO STARS');
    icon(770, pT, () => RV.planet(ctx, 0, 0, 110, { color: '#b388eb', ring: true }), true);
    label(770, pT, 'NO PLANETS');
    icon(1190, dT, () => {
      RV.curve(ctx, [[-140, 60], [-110, -60], [-20, -110], [90, -80], [150, 20], [100, 90], [-40, 110]], true, 0.8); fs(ctx, '#4a2918', 8);
      [[-60, -20, 18], [30, 30, 14], [70, -40, 11], [-20, 60, 12]].forEach(([x, y, r]) => { circle(ctx, x, y, r); fs(ctx, '#a0785a', 4); });
    }, false);
    label(1190, dT, 'JUST DIRT');
    if (t > wT) {
      [0, 1, 2].forEach((i) => {
        const up = ease.outBack(clamp((t - wT - i * 0.12) / 0.35));
        RV.worm(ctx, 1500 + i * 130, 640 + (1 - up) * 300, 1.5, { t: t + i, shades: i === 1, color: ['#ff8fa3', '#f9844a', '#ffafcc'][i] });
      });
      label(1630, wT, '& WORMS!');
    }
    void lt;
  }, { type: 'whip', dur: 0.4 });

  shot(224.0, 'blast', (ctx, S) => {
    const { t, lt } = S;
    RV.radialBg(ctx, '#ffd6ff', '#7209b7');
    ctx.save(); ctx.globalAlpha = 0.3; RV.sunburst(ctx, W / 2, 600, t, { colors: ['#ffffff', 'rgba(255,255,255,0)'], n: 18 }); ctx.restore();
    RV.drawKids(ctx, t, [[480, 1090, 1.35], [960, 1090, 1.3], [1440, 1090, 1.3]], (id, i) =>
      Object.assign(RV.move('bounce', t, i), { eyes: 'happy', mouth: 'grin', headTilt: Math.sin(t * 9 + i) * 0.12, armL: [0.9, -1.8], armR: [0.9, -1.8] }));
    const bT = wt("This adventure's", 6);
    RV.confetti(ctx, t, { t0: bT, x: W / 2, y: 600, n: 120, spread: 3.4 });
    if (t > bT) RV.slam(ctx, 'BLAST!', W / 2, 220, 150, t - bT, { gradient: ['#fff3b0', '#ff4fa3', '#7209b7'], dur: 2 });
    else RV.bigText(ctx, 'HA HA HA!', W / 2, 220, 100, { fill: '#ffffff', rot: Math.sin(t * 10) * 0.05 });
    void lt;
  }, { type: 'flash', dur: 0.3 });

  shot(226.15, 'plan', (ctx, S) => {
    const { t, lt } = S;
    const pT = wt("He said 'Don't worry", 7);
    ctx.save();
    cam(ctx, { zoom: 1.2, y: 80 });
    interior(ctx, t, { dirt: true, lights: t > pT ? 1 : 0.7 });
    RV.drawKids(ctx, t, [[420, 1040, 1.1], [1560, 1040, 1.05], [1780, 1040, 1.05]], (id, i) => Object.assign(RV.move('idle', t, i), { turn: i ? -0.6 : 0.6, look: [i ? -1 : 1, -0.4], mouth: t > pT ? 'grin' : 'flat' }));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1000, s: 1.2, t, pose: 'stand', goggles: 1, armL: [0.5, 0.3], armR: t > pT ? [2.8, 0.2] : [1.2, -2.2], eyes: t > pT ? 'happy' : 'open' }, rustyTalk(t)));
    ctx.restore();
    RV.lightbulb(ctx, 1000, 180 - (1 - RV.pop(t - pT + 0.2)) * 200, 1.1, t > pT ? 1 : 0, t);
  }, { type: 'cut' });

  shot(229.2, 'digOut', (ctx, S) => {
    const { t, lt } = S;
    blueprint(ctx, t);
    // cross-section sketch of the ground with the dotted escape tunnel drawn in
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 250); ctx.lineTo(W, 250); ctx.stroke();
    ctx.font = `44px ${RV.FONT.title}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.fillText('SURFACE', 60, 220);
    chalkBox(ctx, 520, 960, 1.0);
    const p = ease.inOutCubic(clamp((lt - 0.3) / 1.6));
    const pts = [[520, 740], [700, 620], [800, 460], [1000, 380], [1200, 300], [1300, 240]];
    ctx.save(); ctx.setLineDash([26, 18]); ctx.lineDashOffset = -t * 50;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    const n = Math.floor(p * (pts.length - 1));
    for (let i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (n < pts.length - 1) { const f = p * (pts.length - 1) - n; ctx.lineTo(lerp(pts[n][0], pts[n + 1][0], f), lerp(pts[n][1], pts[n + 1][1], f)); }
    ctx.lineWidth = 12; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); ctx.restore();
    if (p > 0.98) { RV.star(ctx, 1300, 240, 50, 22, 5); fs(ctx, '#ffd23f', 5); }
    RV.drawRusty(ctx, Object.assign({ x: 1560, y: 1040, s: 1.0, t, pose: 'stand', goggles: 1, armL: [2.0, 0.3], headTurn: -0.4 }, rustyTalk(t)));
    RV.shovel(ctx, [1400, 700], -0.5, 1.2);
  }, { type: 'wipe', dur: 0.5, colors: ['#ffffff', '#4cc9f0', '#1d4e89'] });

  function tunnelBg(ctx, t, x0) {
    ctx.fillStyle = '#3d2215'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 250, 0, 900);
    g.addColorStop(0, '#6b3f27'); g.addColorStop(0.5, '#8d5a3b'); g.addColorStop(1, '#5a331f');
    ctx.fillStyle = g;
    RV.curve(ctx, [[-100, 330], [400, 260], [900, 300], [1400, 250], [2100, 310], [2100, 930], [1400, 960], [900, 920], [400, 960], [-100, 920]], true, 0.6);
    ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.stroke();
    for (let i = 0; i < 20; i++) {
      const x = ((hash(i * 3.3) * 2400 - x0) % 2400 + 2400) % 2400 - 200, y = 300 + hash(i * 7.1) * 620;
      ellipse(ctx, x, y, 12 + hash(i) * 14, 8 + hash(i * 2) * 8, i); fs(ctx, '#a0785a', 3);
    }
  }

  shot(231.55, 'seeWhat', (ctx, S) => {
    const { t, lt } = S;
    const scroll = lt * 160;
    tunnelBg(ctx, t, scroll);
    // buried 1972 treasures lit by torch beams
    const items = [[520, 850, (x, y) => RV.lavaLamp(ctx, x, y, 1.0, t)], [1050, 800, (x, y) => RV.vinyl(ctx, x, y, 70, t)], [1500, 860, (x, y) => {
      // roller skate
      ctx.save(); ctx.translate(x, y);
      rrect(ctx, -60, -110, 70, 90, 20); fs(ctx, '#ff4fa3', 5);
      rrect(ctx, -70, -30, 140, 34, 14); fs(ctx, '#ffffff', 5);
      [-45, 45].forEach((wx) => { circle(ctx, wx, 14, 20); fs(ctx, '#ffd23f', 5); });
      ctx.restore();
    }]];
    items.forEach(([x, y, draw]) => draw(x - scroll * 0.3, y));
    // darkness with torch pools
    ctx.save();
    ctx.fillStyle = 'rgba(5,3,10,0.55)'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    RV.KID_IDS.forEach((id, i) => {
      const x = 260 + i * 250, y = 940;
      RV.drawKid(ctx, id, Object.assign(RV.move('walk', t * 1.2, i), { x, y, s: 0.9, t, turn: 0.7, look: [1, 0], mouth: 'o', open: 0.3,
        handR: [70, -200], holdR: (c, hp) => RV.torch(c, hp, -0.1 + Math.sin(t * 1.6 + i) * 0.25, 1.2, 900) }));
    });
    RV.drawRustySide(ctx, Object.assign({ x: 1100, y: 940, s: 0.85, t, gait: t * 1.3, run: 0.1, goggles: 1 }, { mouth: 'closed' }));
    RV.bigText(ctx, "'72", 1700, 200, 110, { font: RV.FONT.groovy, fill: '#ee9b00' });
  }, { type: 'black', dur: 0.4 });

  shot(235.1, 'treasure', (ctx, S) => {
    const { t, lt } = S;
    const tT = wt('Maybe we', 5);
    // treasure map parchment
    ctx.fillStyle = '#3d2215'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.03);
    const mapPath = () => { ctx.beginPath(); ctx.moveTo(-760, -420); for (let i = 0; i <= 10; i++) ctx.lineTo(-760 + i * 152, -420 + (i % 2) * 14); ctx.lineTo(760, 420); for (let i = 10; i >= 0; i--) ctx.lineTo(-760 + i * 152, 420 - (i % 2) * 14); ctx.closePath(); };
    mapPath(); fs(ctx, '#f1dca7', 7);
    ctx.save(); ctx.setLineDash([20, 16]);
    const p = ease.inOutCubic(clamp(lt / 1.4));
    ctx.beginPath(); ctx.moveTo(-600, 250); ctx.bezierCurveTo(-300, -200, 0, 300, lerp(-600, 420, p), lerp(250, -120, p));
    ctx.lineWidth = 10; ctx.strokeStyle = '#9c4a2f'; ctx.stroke(); ctx.restore();
    ctx.font = `64px ${RV.FONT.groovy}`; ctx.fillStyle = '#6f1d1b'; ctx.textAlign = 'center'; ctx.fillText('Lost Treasure', -300, -300);
    RV.dinoBones(ctx, -420, 300, 0.6);
    const xp = RV.pop(t - tT + 0.1);
    if (xp > 0) {
      ctx.save(); ctx.translate(460, -120); ctx.scale(xp, xp);
      [[1, 1], [1, -1]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(-60 * a, -60 * b); ctx.lineTo(60 * a, 60 * b); ctx.lineWidth = 26; ctx.strokeStyle = '#d62828'; ctx.stroke(); });
      ctx.restore();
      RV.treasureChest(ctx, 460, 260, 1.1 * xp, clamp((t - tT - 0.4) / 0.5), t);
    }
    ctx.restore();
    RV.drawRusty(ctx, Object.assign({ x: 260, y: 1120, s: 1.05, t, pose: 'stand', goggles: 1, eyes: t > tT ? 'wide' : 'open', armL: [0.5, 0.3], armR: [1.7, 0.1], headTurn: 0.5 }, rustyTalk(t)));
  }, { type: 'cut' });

  shot(237.35, 'shovels', (ctx, S) => {
    const { t, lt } = S;
    tunnelBg(ctx, t, 0);
    RV.KID_IDS.forEach((id, i) => {
      const catchT = S.shot.t0 + 0.7 + i * 0.35;
      const c = clamp((t - catchT + 0.5) / 0.5);
      const x = 520 + i * 360, y = 1000;
      const caught = t > catchT;
      const pose = Object.assign(RV.move(caught ? 'bounce' : 'idle', t, i), { x, y, s: 1.1, t, look: [0, -0.8], mouth: caught ? 'grin' : 'o', open: 0.4, eyes: caught ? 'happy' : 'wide' });
      if (caught) { pose.armR = undefined; pose.handR = [60, -250]; pose.holdR = (cx, hp) => RV.shovel(cx, hp, 0.3, 0.9); }
      RV.drawKid(ctx, id, pose);
      if (!caught) {
        const sx = lerp(x + 500, x + 60, ease.outQuad(c)), sy = lerp(-200, 700, ease.inQuad(c)) - Math.sin(c * Math.PI) * 200;
        RV.shovel(ctx, [sx, sy], t * 12, 1.0);
      } else if (t < catchT + 0.4) RV.bigText(ctx, 'CATCH!', x, 330, 60, { fill: '#ffffff' });
    });
    RV.drawRustySide(ctx, { x: 1650, y: 1000, s: 0.9, t, gait: 0, face: -1, mouth: 'closed', wag: 1 });
    ctx.save(); ctx.translate(1650 - 150 * 0.9, 1000 - 170 * 0.9); ctx.rotate(-1.4); RV.shovel(ctx, [0, 0], 0, 0.5); ctx.restore();
    void lt;
  }, { type: 'cut' });

  shot(240.15, 'tunnel', (ctx, S) => {
    const { t, lt } = S;
    const dig = ease.inOutQuad(clamp(lt / S.d));
    const fx0 = lerp(420, 1500, dig) - 60, fy0 = lerp(860, 520, dig) + 80;
    ctx.save();
    cam(ctx, { zoom: 1.55, x: fx0 - 200 - W / 2, y: fy0 - 170 - H / 2 });
    RV.underground(ctx, t, { surfaceY: 160, surface: false, fossils: true, fossilX: 1600 });
    // tunnel carved so far
    ctx.fillStyle = '#2b170d';
    ctx.beginPath();
    const x0 = 200, y0 = 900, x1 = lerp(420, 1500, dig), y1 = lerp(860, 520, dig);
    ctx.moveTo(x0, y0 - 90); ctx.quadraticCurveTo((x0 + x1) / 2, y0 - 160, x1, y1 - 90); ctx.lineTo(x1, y1 + 90); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 20, x0, y0 + 90); ctx.closePath();
    fs(ctx, '#2b170d', 5);
    // diggers at the tunnel face
    const fx = x1 - 60, fy = y1 + 80;
    RV.drawRustySide(ctx, { x: fx, y: fy, s: 0.7, t, dig: 1, mouth: 'tongue' });
    RV.KID_IDS.forEach((id, i) => {
      const kx = fx - 180 - i * 120, ky = fy + 10 + i * 6;
      const sw = Math.sin(t * 10 + i * 2);
      RV.drawKid(ctx, id, { x: kx, y: ky, s: 0.6, t, turn: 0.7, eyes: 'happy', mouth: 'grin', handR: [60 + sw * 30, -150 - sw * 30], handL: [30 + sw * 30, -120 - sw * 20], holdR: (c, hp) => RV.shovel(c, hp, 0.9 + sw * 0.4, 0.7) });
    });
    for (let i = 0; i < 16; i++) {
      const ph = RV.fract(t * 1.6 + i / 16);
      ellipse(ctx, fx - ph * 400, fy - 60 - Math.sin(ph * Math.PI) * 220, 14, 10, i); fs(ctx, '#8d5a3b', 3);
    }
    ctx.restore();
    RV.bigText(ctx, 'DIG! DIG! DIG!', W / 2, 150, 100, { fill: '#ffd23f', rot: Math.sin(t * 8) * 0.03 });
  }, { type: 'cut' });

  shot(242.3, 'breakThrough', (ctx, S) => {
    const { t, lt } = S;
    const hitT = wt('But instead of the surface', 9);
    tunnelBg(ctx, t, 0);
    const crack = clamp((t - hitT + 1.8) / 1.8);
    const burst = clamp((t - hitT) / 0.4);
    // wall on the right with cracks and light leaking
    rrect(ctx, 1320, 220, 700, 760, 20); fs(ctx, '#7a4a2f', 6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ['#ff4fa3', '#4cc9f0', '#ffd23f'].forEach((c, i) => glow(ctx, 1500, 600, 200 + crack * 300 + burst * 900, c, 0.25 * crack + burst * 0.5));
    ctx.restore();
    ctx.strokeStyle = '#fff7d6'; ctx.lineWidth = 6;
    for (let i = 0; i < 7; i++) {
      if (crack < i / 7) continue;
      const a = i * 0.9;
      ctx.beginPath(); ctx.moveTo(1500, 600);
      ctx.lineTo(1500 + Math.cos(a) * 100, 600 + Math.sin(a) * 80); ctx.lineTo(1500 + Math.cos(a + 0.3) * 220, 600 + Math.sin(a + 0.3) * 190);
      ctx.stroke();
    }
    if (burst > 0) {
      for (let i = 0; i < 14; i++) {
        const a = hash(i) * TAU, v = 600 + hash(i * 3) * 700;
        ctx.save(); ctx.translate(1500 + Math.cos(a) * v * burst, 600 + Math.sin(a) * v * burst + 400 * burst * burst); ctx.rotate(i + t * 5);
        rrect(ctx, -40, -30, 80, 60, 10); fs(ctx, '#7a4a2f', 5); ctx.restore();
      }
      RV.flash(ctx, (1 - burst) * 0.9);
    }
    RV.KID_IDS.forEach((id, i) => {
      const x = 380 + i * 250;
      RV.drawKid(ctx, id, Object.assign({ x, y: 960, s: 1.0, t, turn: 0.8, look: [1, 0], handR: [60, -240], holdR: (c, hp) => RV.shovel(c, hp, 0.4, 0.85) },
        t > hitT ? { eyes: 'wide', mouth: 'o', open: 0.9, brow: 1, jump: 20 * Math.max(0, Math.sin((t - hitT) * 10)) } : Object.assign(RV.move('idle', t, i), kidsSing(t))));
    });
    RV.drawRustySide(ctx, { x: 1180, y: 960, s: 0.9, t, dig: t < hitT ? 1 : 0, mouth: t > hitT ? 'open' : 'tongue' });
    if (t > hitT) RV.slam(ctx, 'CRASH!', 1500, 260, 130, t - hitT, { gradient: ['#ffffff', '#ffd23f', '#ff4fa3'], dur: 1.5 });
    void lt;
  }, { type: 'cut' });

  shot(245.05, 'discoReveal', (ctx, S) => {
    const { t, lt } = S;
    const dT = wt('Full of disco', 2), lT = wt('Full of disco', 4), gT = wt('Full of disco', 7);
    ctx.save();
    cam(ctx, { zoom: 1.35 - ease.outCubic(clamp(lt / 3)) * 0.35, y: -40 });
    RV.discoHall(ctx, t, { band: t > gT - 0.3 });
    ctx.restore();
    // silhouettes of the kids + Rusty in the broken doorway (foreground)
    RV.drawKids(ctx, t, [[300, 1190, 1.35], [560, 1200, 1.3], [1640, 1200, 1.3]], (id, i) => ({ turn: i === 2 ? -0.6 : 0.6, look: [i === 2 ? -0.8 : 0.8, -0.4], eyes: 'wide', mouth: 'o', open: 1, brow: 1, armL: [0.3, 0.2], armR: [0.3, 0.2], blink: 0 }));
    RV.drawRusty(ctx, { x: 1340, y: 1180, s: 1.0, t, eyes: 'wide', mouth: 'open', open: 1, earFlip: 'R', headTilt: -0.2 });
    [[dT, 'DISCO BALLS!', 480, 220, '#ff4fa3'], [lT, 'LIGHTS!', 1450, 180, '#4cc9f0'], [gT, 'A GIG!', 960, 420, '#ffd23f']].forEach(([at, txt, x, y, c]) => {
      if (t > at) RV.slam(ctx, txt, x, y, 88, t - at, { gradient: ['#ffffff', c], dur: 3, burst: false });
    });
  }, { type: 'flash', dur: 0.35 });

  void popAt;
})(globalThis.RV);
