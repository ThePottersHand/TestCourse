/* The storyboard. Each shot: [startTime, name, draw(ctx, S), transition]. S = { t, lt, d, p }.
 * Shot times follow the aligned lyrics (src/timing.js) and the song's drum hits/stops.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow, win, smooth } = RV;
  const W = RV.W, H = RV.H;
  const OUT = RV.OUT;
  const SH = [];
  const shot = (t0, name, draw, trans, extra) => SH.push(Object.assign({ t0, name, draw, trans }, extra || {}));

  // ------------------------------------------------------------ helpers
  const cam = (ctx, c) => RV.camera(ctx, c);
  // Lip-sync, only while that character is delivering one of their own lines of dialogue
  // (RV.DIALOGUE in captions.js). Otherwise these return {} and the shot's own expression stays.
  const talkMouth = (t, g = 1, id = 'big') => { const o = RV.talkOpen(t, id, g); return o == null ? {} : { mouth: o > 0.05 ? 'talk' : 'smile', open: o }; };
  const rustyTalk = (t, g = 1) => { const o = RV.talkOpen(t, 'rusty', g); return o == null ? {} : { mouth: o > 0.05 ? 'talk' : 'closed', open: o }; };
  const kidsTalk = (t, id = 'kids') => talkMouth(t, 0.9, id);
  const lineWord = (t) => RV.wordAt(t);
  const wordTime = (lineIdx, wi) => RV.LYRICS[lineIdx].w[wi][0];
  const kick = (t, k) => RV.kick(t, k);
  // pop-in scale for something appearing at time a
  const popAt = (t, a, dur = 0.35) => RV.pop(t - a, dur);

  function rustyInPorthole(t) {
    return (ctx, px, py) => {
      ctx.save();
      ctx.translate(px, py + 22 + Math.sin(t * 3) * 2);
      ctx.scale(0.5, 0.5);
      RV.rustyHead(ctx, { t, eyes: 'open', mouth: 'tongue', headTilt: 0.1, earFlip: 'R', blink: RV.blink(t, 2) });
      ctx.restore();
    };
  }

  function stageKidsRow(ctx, t, x, y, s, move, extra) {
    const offs = [[-250, 0, 1], [0, 0, 1], [230, 0, 1]];
    RV.drawKids(ctx, t, offs.map(([dx, dy, k]) => [x + dx * s, y + dy, s * k]), (id, i) =>
      Object.assign(RV.move(typeof move === 'function' ? move(i) : move, t, i * 0.7), extra ? extra(id, i) : {}));
  }

  function dogBed(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ellipse(ctx, 0, -30, 230, 70); fs(ctx, '#c0392b', 6);
    ellipse(ctx, 0, -44, 170, 42); fs(ctx, '#e8d8c0', 5);
    ctx.save(); ellipse(ctx, 0, -30, 230, 70); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 8;
    for (let i = -6; i < 7; i++) { ctx.beginPath(); ctx.moveTo(i * 40, -120); ctx.lineTo(i * 40 + 60, 60); ctx.stroke(); }
    ctx.restore();
    // bone toy
    ctx.save(); ctx.translate(60, -52); ctx.rotate(-0.3);
    rrect(ctx, -40, -8, 80, 16, 8); fs(ctx, '#fff8e7', 4);
    [[-40, -8], [-40, 8], [40, -8], [40, 8]].forEach(([a, b]) => { circle(ctx, a, b, 11); fs(ctx, '#fff8e7', 4); });
    ctx.restore();
    ctx.restore();
  }

  function missingPoster(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.06);
    rrect(ctx, -130, -170, 260, 340, 6); fs(ctx, '#fffdf2', 5);
    ctx.font = `46px ${RV.FONT.title}`; ctx.fillStyle = '#e63946'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('MISSING!', 0, -128);
    rrect(ctx, -90, -96, 180, 170, 6); fs(ctx, '#bde0fe', 4);
    ctx.save(); ctx.translate(0, -10); ctx.scale(0.95, 0.95); RV.rustyHead(ctx, { t, eyes: 'puppy', mouth: 'closed', earFlip: 'R' }); ctx.restore();
    ctx.font = `30px ${RV.FONT.body}`; ctx.fillStyle = OUT;
    ctx.fillText('RUSTY', 0, 110);
    ctx.font = `20px ${RV.FONT.body}`; ctx.fillText('very good boy', 0, 142);
    circle(ctx, 0, -160, 8); fs(ctx, '#e63946', 3);
    ctx.restore();
  }

  function catInBin(ctx, x, y, lt) {
    ctx.save(); ctx.translate(x, y);
    const up = clamp(lt / 0.2) * (lt < 1.2 ? 1 : clamp(1 - (lt - 1.2) / 0.2));
    // cat head peeking out
    ctx.save(); ctx.translate(0, -150 - up * 70);
    ctx.beginPath(); ctx.moveTo(-40, -20); ctx.lineTo(-30, -70); ctx.lineTo(-5, -38); ctx.lineTo(5, -38); ctx.lineTo(30, -70); ctx.lineTo(40, -20); ctx.closePath();
    fs(ctx, '#6c757d', 4);
    circle(ctx, 0, -8, 44); fs(ctx, '#6c757d', 4);
    ellipse(ctx, -16, -12, 9, 13); fs(ctx, '#d9ed92', 3);
    ellipse(ctx, 16, -12, 9, 13); fs(ctx, '#d9ed92', 3);
    ellipse(ctx, -16, -12, 3, 10); fs(ctx, OUT);
    ellipse(ctx, 16, -12, 3, 10); fs(ctx, OUT);
    ctx.restore();
    // bin
    rrect(ctx, -70, -160, 140, 160, 10); fs(ctx, '#495057', 5);
    ctx.save(); ctx.translate(0, -160); ctx.rotate(-up * 0.7);
    rrect(ctx, -80, -22, 160, 22, 8); fs(ctx, '#6c757d', 5);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4;
    [-35, 0, 35].forEach((dx) => { ctx.beginPath(); ctx.moveTo(dx, -140); ctx.lineTo(dx, -20); ctx.stroke(); });
    if (up > 0.5) RV.bigText(ctx, 'MEOW!', 120, -300, 64, { fill: '#ffffff', rot: 0.1 });
    ctx.restore();
  }

  // chorus text slam driven by the "Rusty" hits
  function chorusSlam(ctx, t, section, style = {}) {
    const h = RV.lastHit(t, section);
    if (!h) return;
    const lt = t - h.t;
    if (lt > 1.6) return;
    const k = RV.hitIndex(t, section);
    const text = style.text || 'RUSTY THE DOG!';
    const rot = (k % 2 ? 0.06 : -0.06);
    const grads = style.gradients || [['#fff3b0', '#ffd23f', '#ff9f1c'], ['#caffbf', '#06d6a0', '#118ab2'], ['#ffc2e2', '#ff4fa3', '#9b5de5'], ['#bdf0ff', '#4cc9f0', '#3a0ca3']];
    RV.slam(ctx, text, style.x || W / 2, style.y || 170, style.size || 128, lt, {
      rot, gradient: grads[k % grads.length], burstC: style.burstC || '#ffffff', dur: 1.5, font: style.font,
      burst: style.burst, stroke: style.stroke,
    });
  }

  // ============================================================ INTRO
  // Rusty constellation (drawn star by star in the opening sky)
  const CONST = [[-150, -30], [-110, -130], [-40, -165], [40, -165], [110, -130], [150, -30], [95, 25], [45, 95], [0, 115], [-45, 95], [-95, 25]];
  const CONST_LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 1]];
  function constellation(ctx, t, lt, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.globalCompositeOperation = 'lighter';
    CONST_LINES.forEach(([a, b], i) => {
      const p = clamp((lt - 1.2 - i * 0.38) / 0.4);
      if (p <= 0) return;
      const [x0, y0] = CONST[a], [x1, y1] = CONST[b];
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, p), lerp(y0, y1, p));
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(180,220,255,0.55)'; ctx.stroke();
    });
    const pulse = 0.7 + 0.3 * Math.sin(t * 4);
    CONST.concat([[-45, -40], [45, -40], [0, 40]]).forEach(([x, y], i) => {
      const p = clamp((lt - 1.0 - i * 0.3) / 0.3);
      if (p <= 0) return;
      glow(ctx, x, y, 34 * p, '#bde0ff', 0.9 * pulse);
      RV.sparkle(ctx, x, y, 16 * p * pulse, '#ffffff');
    });
    ctx.restore();
  }

  shot(0, 'sky', (ctx, S) => {
    const { t, lt } = S;
    const tilt = ease.inOutCubic(clamp((lt - 6.0) / 5.4));
    ctx.save();
    cam(ctx, { y: lerp(-760, 0, tilt), zoom: 1.08 - tilt * 0.08 });
    RV.neighbourhood(ctx, t, 0, { moonFace: true });
    // extra sky above for the tilt-down
    ctx.fillStyle = '#0b1030'; ctx.fillRect(-200, -1400, W + 400, 1310);
    const g = ctx.createLinearGradient(0, -1400, 0, 0);
    g.addColorStop(0, '#05071c'); g.addColorStop(1, '#0b1030');
    ctx.fillStyle = g; ctx.fillRect(-200, -1400, W + 400, 1400);
    RV.stars(ctx, t, { n: 200, y0: -1400, y1: 0, seed: 12, size: 1.2 });
    constellation(ctx, t, lt, 960, -330, 1.5);
    // shooting star = the spacetime machine arriving
    const a = clamp((lt - 8.4) / 3.7);
    if (a > 0 && a < 1) {
      const e = ease.inQuad(a);
      const x = lerp(-200, 1500, e), y = lerp(-500, 780, e) - Math.sin(e * Math.PI) * 200;
      const ang = Math.atan2(780 + 500, 1700) + 0.1;
      RV.comet(ctx, x, y, 18 + e * 10, ang, 500);
      RV.sparkleField(ctx, t, { n: 8, x0: x - 300, x1: x, y0: y - 140, y1: y + 60, size: 20, seed: 3 });
    }
    ctx.restore();
    // landing flash just before the band kicks in
    RV.flash(ctx, clamp(1 - Math.abs(lt - 12.05) / 0.25) * 0.9);
  });

  shot(12.18, 'title', (ctx, S) => {
    const { t, lt } = S;
    const k = kick(t, 5);
    RV.radialBg(ctx, '#3a0ca3', '#10002b');
    ctx.save();
    ctx.globalAlpha = 0.5;
    RV.sunburst(ctx, W / 2, 620, t, { colors: ['#4361ee', '#3a0ca3'], n: 22, speed: 0.15 });
    ctx.restore();
    RV.stars(ctx, t, { n: 120, y1: H, seed: 5 });
    ctx.save();
    cam(ctx, { zoom: 1 + k * 0.015 });
    // orbiting spacetime machine
    const oa = t * 1.2;
    const bx = W / 2 + Math.cos(oa) * 700, by = 560 + Math.sin(oa) * 160;
    const behind = Math.sin(oa) < 0;
    const drawOrbit = () => RV.drawBox(ctx, bx, by + 100, { s: 0.36 + Math.sin(oa) * 0.08, t, glow: 1, tilt: Math.cos(oa) * 0.3 });
    if (behind) drawOrbit();
    // Rusty rises into frame
    const rise = ease.outBack(clamp((lt - 0.1) / 0.7), 1.6);
    const bop = RV.bounce(t, 0.5);
    ctx.save();
    ctx.translate(W / 2, lerp(1500, 760, rise) - bop * 14);
    ctx.rotate(Math.sin(RV.half(t) * Math.PI) * 0.08);
    ctx.scale(1.9, 1.9);
    RV.rustyHead(ctx, { t, eyes: 'open', mouth: 'tongue', earFlip: Math.floor(RV.bar(t)) % 2 ? 'R' : null, blink: RV.blink(t, 1) });
    ctx.restore();
    if (!behind) drawOrbit();
    // title letters
    const l1 = "RUSTY THE DOG'S", l2 = 'SPACETIME ADVENTURE';
    RV.letters(ctx, l1, W / 2, 190, 150, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], shine: true }, (i) => {
      const a = lt - 0.25 - i * 0.05;
      return { s: RV.pop(a, 0.4), dy: Math.sin(t * 5 + i * 0.6) * 8, r: Math.sin(t * 3 + i) * 0.04 };
    });
    RV.letters(ctx, l2, W / 2, 345, 104, { gradient: ['#e0fbfc', '#4cc9f0', '#4361ee'], shine: true }, (i) => {
      const a = lt - 1.2 - i * 0.04;
      return { s: RV.pop(a, 0.4), dy: Math.sin(t * 5 + i * 0.6 + 2) * 7 };
    });
    // kids pop up at the corners
    const kp = ease.outBack(clamp((lt - 5.0) / 0.6), 1.5);
    if (kp > 0) {
      RV.drawKid(ctx, 'big', Object.assign({ x: 250, y: lerp(1500, 1120, kp), s: 1.25, t, turn: 0.5, look: [0.6, 0], mouth: 'grin', eyes: 'open' }, RV.move('wave', t, 0)));
      RV.drawKid(ctx, 'boy', Object.assign({ x: 1500, y: lerp(1500, 1110, kp), s: 1.25, t, turn: -0.5, look: [-0.6, 0], mouth: 'grin' }, RV.move('wave', t, 1)));
      RV.drawKid(ctx, 'little', Object.assign({ x: 1740, y: lerp(1500, 1120, kp), s: 1.2, t, turn: -0.6, mouth: 'open', open: 0.6 }, RV.move('cheer', t, 2)));
    }
    ctx.restore();
    RV.sparkleField(ctx, t, { n: 24, y1: 520, size: 26 });
    RV.flash(ctx, clamp(1 - lt / 0.5) * 0.8);
  });

  // ============================================================ VERSE 1
  shot(22.74, 'missing', (ctx, S) => {
    const { t, lt } = S;
    const gasp = wordTime(0, 6); // "missing"
    const shocked = t > gasp - 0.1;
    ctx.save();
    cam(ctx, { zoom: 1.05 + lt * 0.015, y: -10 });
    RV.livingRoom(ctx, t, { fire: true, warm: 0.4, shelf: true });
    dogBed(ctx, 900, 900, 1.15);
    RV.sign(ctx, 'RUSTY', 760, 905, { size: 30, bg: '#ffd23f', rot: -0.12 });
    const poster = popAt(t, gasp + 0.3, 0.45);
    if (poster > 0) missingPoster(ctx, 1080, 420, poster * 0.85, t);
    const jump = shocked ? Math.max(0, Math.sin(clamp((t - gasp) / 0.4) * Math.PI)) * 40 : 0;
    const face = shocked ? { eyes: 'wide', mouth: 'o', open: 0.8, brow: 1 } : kidsTalk(t);
    RV.drawKids(ctx, t, [[480, 1000, 1.1], [1320, 1010, 1.05], [1560, 1000, 1.05]], (id, i) => Object.assign(
      RV.move('idle', t, i),
      { turn: i === 0 ? 0.5 : -0.5, look: [i === 0 ? 0.7 : -0.7, 0.4], jump },
      face,
      shocked ? { armL: [2.2, 0.9], armR: [2.2, 0.9] } : {}));
    if (shocked) RV.questionMarks(ctx, t, 900, 600, t - gasp);
    ctx.restore();
  }, { type: 'iris', dur: 0.7, x: 960, y: 700 });

  shot(26.35, 'search', (ctx, S) => {
    const { t, lt } = S;
    const scroll = 300 + lt * 380;
    ctx.save();
    cam(ctx, { zoom: 1.0 });
    RV.neighbourhood(ctx, t, scroll, {});
    catInBin(ctx, 1500 - lt * 380 + 300, 900, lt - 0.9);
    RV.KID_IDS.forEach((id, i) => {
      const x = 380 + i * 300, y = 985 + i * 6;
      const mv = RV.move('walk', t * 1.5, i * 0.5);
      const sweep = Math.sin(t * 2.2 + i * 1.3) * 0.35 - 0.25;
      RV.shadow(ctx, x, y + 4, 70);
      RV.drawKid(ctx, id, Object.assign(mv, { x, y, s: 0.95, t, turn: 0.6, look: [0.8, -0.2], mouth: 'o', open: 0.4, eyes: 'open',
        armR: undefined, handR: [70, -210 + Math.sin(t * 3 + i) * 10],
        holdR: (c, hp) => RV.torch(c, hp, sweep, 1, 700) }));
    });
    ctx.restore();
  }, { type: 'whip', dur: 0.45 });

  shot(28.2, 'foundBox', (ctx, S) => {
    const { t, lt } = S;
    const rustyT = wordTime(2, 3);
    ctx.save();
    cam(ctx, { zoom: 1 + lt * 0.03, x: lt * 12 });
    RV.field(ctx, t, { moonX: 300 });
    RV.shadow(ctx, 1260, 900, 200, 0.3);
    RV.drawBox(ctx, 1260, 900, { s: 1.05, t, glow: 0.8 + 0.2 * Math.sin(t * 4), porthole: 1, rusty: t > rustyT - 0.15 ? rustyInPorthole(t) : null });
    if (t > rustyT) RV.sparkleField(ctx, t, { n: 10, x0: 1150, x1: 1370, y0: 330, y1: 520, size: 24 });
    // kids arrive from the left and freeze in surprise
    RV.KID_IDS.forEach((id, i) => {
      const arrive = clamp((lt - i * 0.18) / 1.3);
      const x = lerp(-250, 260 + i * 230, ease.outCubic(arrive));
      const walking = arrive < 1;
      const surprised = t > rustyT;
      const mv = walking ? RV.move('walk', t * 1.4, i) : RV.move('idle', t, i);
      RV.shadow(ctx, x, 985, 66);
      RV.drawKid(ctx, id, Object.assign(mv, { x, y: 985, s: 0.92, t, turn: 0.7, look: [1, -0.2] },
        surprised ? { eyes: 'wide', mouth: 'o', open: 0.7, brow: 1, jump: Math.max(0, Math.sin(clamp((t - rustyT) / 0.35) * Math.PI)) * 30 } : kidsTalk(t),
        { armR: undefined, handR: [70, -200], holdR: (c, hp) => RV.torch(c, hp, -0.25, 0.8, 600) }));
    });
    ctx.restore();
  }, { type: 'cut' });

  shot(31.75, 'outOfTheBlue', (ctx, S) => {
    const { t, lt, d } = S;
    const e = ease.inOutCubic(clamp(lt / d));
    ctx.save();
    cam(ctx, { y: lerp(-420, 0, e), zoom: lerp(1.25, 1.0, e) });
    RV.field(ctx, t, { moonX: 1600, sky: ['#040a2a', '#0d2b7a', '#1f5fbf', '#58a4ff'] });
    ctx.fillStyle = '#040a2a'; ctx.fillRect(-300, -900, W + 600, 800);
    RV.stars(ctx, t, { n: 90, y0: -900, y1: 0, seed: 21 });
    // beam of blue light
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const bg = ctx.createLinearGradient(0, -900, 0, 900);
    bg.addColorStop(0, 'rgba(76,201,240,0)'); bg.addColorStop(0.6, 'rgba(76,201,240,0.35)'); bg.addColorStop(1, 'rgba(180,240,255,0.6)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(900, -900); ctx.lineTo(1020, -900); ctx.lineTo(1160, 900); ctx.lineTo(760, 900); ctx.closePath(); ctx.fill();
    ctx.restore();
    RV.drawBox(ctx, 960, 900, { s: 0.8, t, glow: 1.3, porthole: 1 });
    RV.sparkleField(ctx, t, { n: 26, x0: 700, x1: 1220, y0: 300, y1: 900, size: 22, color: '#bdf0ff' });
    ctx.restore();
    RV.bigText(ctx, 'OUT OF THE BLUE!', W / 2, 150 + (1 - RV.pop(lt - 0.9)) * -300, 90, { gradient: ['#e0fbfc', '#4cc9f0', '#4361ee'] });
  }, { type: 'flash', dur: 0.3 });

  shot(33.8, 'whatsThis', (ctx, S) => {
    const { t, lt } = S;
    const wagT = wordTime(5, 2); // "wagged"
    const wagging = t > wagT - 0.2;
    ctx.save();
    cam(ctx, { zoom: 1.12 + lt * 0.02, y: 40 });
    RV.field(ctx, t, { moonX: 260 });
    RV.drawBox(ctx, 960, 930, {
      s: 1.25, t, door: 1, glow: 0.6, inDoor: (c, x, y) => {
        RV.drawRusty(c, Object.assign({ x, y: y - 6, s: 0.62, t, headTilt: -0.22 + Math.sin(t * 1.5) * 0.05, earFlip: 'R', eyes: 'open', blink: RV.blink(t, 4),
          wag: wagging ? 2.4 : 0.5, wagSpeed: wagging ? 26 : 12, mouth: 'tongue' }, rustyTalk(t)));
      },
    });
    if (wagging && t < wagT + 1.4) RV.bigText(ctx, 'WAG WAG!', 1260, 380 + Math.sin(t * 20) * 6, 60, { fill: '#ffd23f', rot: 0.1 });
    // kids in the foreground, looking at Rusty
    RV.drawKid(ctx, 'big', Object.assign(RV.move('idle', t, 0), { x: 300, y: 1180, s: 1.35, t, turn: 0.8, look: [1, -0.3], armR: [1.4, -0.3] }, t < wagT ? kidsTalk(t) : { mouth: 'grin' }));
    RV.drawKid(ctx, 'little', Object.assign(RV.move('idle', t, 2), { x: 1640, y: 1160, s: 1.3, t, turn: -0.8, look: [-1, -0.3] }, t < wagT ? kidsTalk(t) : { mouth: 'grin', eyes: 'happy' }));
    RV.drawKid(ctx, 'boy', Object.assign(RV.move('idle', t, 1), { x: 1870, y: 1200, s: 1.3, t, turn: -0.9, look: [-1, -0.3] }, t < wagT ? kidsTalk(t) : { mouth: 'grin' }));
    ctx.restore();
  }, { type: 'cut' });

  shot(37.75, 'spacetimeMachine', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.0 + lt * 0.04 });
    RV.field(ctx, t, { moonX: 1650 });
    RV.drawBox(ctx, 1180, 900, { s: 1.0, t, glow: 1, door: 0 });
    // neon sign flickers on
    const on = lt > 0.25 && (lt > 0.7 || Math.sin(lt * 60) > 0);
    ctx.save();
    ctx.translate(1180, 250);
    ctx.rotate(-0.04);
    rrect(ctx, -330, -70, 660, 140, 30); fs(ctx, '#1b1030', 6);
    ctx.font = `76px ${RV.FONT.title}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (on) { ctx.shadowColor = '#4cc9f0'; ctx.shadowBlur = 30; }
    ctx.fillStyle = on ? '#bdf0ff' : '#3a4a6a';
    ctx.fillText('SPACETIME', 0, -12);
    ctx.font = `44px ${RV.FONT.title}`;
    if (on) ctx.shadowColor = '#ff4fa3';
    ctx.fillStyle = on ? '#ffc2e2' : '#3a4a6a';
    ctx.fillText('MACHINE', 0, 42);
    ctx.restore();
    if (on) RV.sparkleField(ctx, t, { n: 12, x0: 820, x1: 1540, y0: 160, y1: 340, size: 26 });
    RV.shadow(ctx, 560, 980, 110);
    RV.drawRusty(ctx, Object.assign({ x: 560, y: 980, s: 1.1, t, pose: 'stand', headTilt: 0.1, bob: 6 * RV.bounce(t, 0.5),
      armR: [1.9 + Math.sin(t * 4) * 0.1, 0.5], armL: [0.4, 0.2], eyes: 'open', blink: RV.blink(t, 5), headTurn: 0.4 }, rustyTalk(t)));
    ctx.restore();
  }, { type: 'whip', dur: 0.4 });

  shot(39.2, 'adventure', (ctx, S) => {
    const { t, lt } = S;
    const gogT = 39.7, meT = wordTime(8, 5) - 0.2;
    RV.radialBg(ctx, '#ffbe0b', '#fb5607', W / 2, 600, 1300);
    ctx.save(); ctx.globalAlpha = 0.35;
    RV.sunburst(ctx, W / 2, 620, t, { colors: ['#ffffff', 'rgba(255,255,255,0)'], n: 16, speed: 0.3 });
    ctx.restore();
    // swirl of adventure icons
    for (let i = 0; i < 7; i++) {
      const a = t * 0.6 + (i / 7) * TAU;
      const x = W / 2 + Math.cos(a) * 700, y = 560 + Math.sin(a) * 330;
      if (i % 3 === 0) RV.planet(ctx, x, y, 50, { color: ['#4cc9f0', '#b388eb', '#06d6a0'][i % 3], ring: i === 3 });
      else if (i % 3 === 1) RV.clockFace(ctx, x, y, 46, t * 2 + i);
      else RV.compass(ctx, x, y, 52, t * 2, t);
    }
    ctx.save();
    cam(ctx, { zoom: 1.0 + lt * 0.03 + kick(t, 6) * 0.01 });
    const beckon = t > wordTime(8, 3) - 0.3;
    RV.shadow(ctx, 960, 1040, 160);
    RV.drawRusty(ctx, Object.assign({
      x: 960, y: 1050, s: 1.55, t, pose: 'stand', headTilt: -0.08 + Math.sin(t * 2) * 0.05, blink: RV.blink(t, 6),
      goggles: t < gogT ? 1 : 2, bob: 8 * RV.bounce(t, 0.5),
      armL: beckon ? [1.5, -1.2 + Math.sin(t * 9) * 0.5] : [0.5, 0.3],
      armR: t < gogT + 0.3 ? [2.9, 0.9] : [0.9, -1.8],
      eyes: t > meT ? 'puppy' : 'open',
    }, t > meT + 0.5 ? { mouth: 'closed' } : rustyTalk(t)));
    ctx.restore();
    if (t > gogT && t < gogT + 0.6) RV.bigText(ctx, 'SNAP!', 1320, 300, 70, { fill: '#ffffff', rot: -0.1 });
  }, { type: 'circle', dur: 0.5 });

  shot(45.1, 'sayNo', (ctx, S) => {
    const { t, lt } = S;
    const runT = 47.3;
    ctx.save();
    const pan = ease.inOutCubic(clamp((t - runT) / 3.0));
    cam(ctx, { x: pan * 700, zoom: 1.0 });
    RV.field(ctx, t, { moonX: 360 });
    RV.drawBox(ctx, 1900, 900, { s: 1.0, t, glow: 0.9, door: 1 });
    if (t < runT + 0.2) {
      RV.confetti(ctx, t, { t0: 45.35, x: 700, y: 700, n: 90 });
      stageKidsRow(ctx, t, 700, 990, 1.1, 'cheer');
      RV.slam(ctx, 'YES!!', 700, 300, 150, t - 46.2, { gradient: ['#caffbf', '#06d6a0', '#118ab2'], dur: 1.6 });
    } else {
      RV.KID_IDS.forEach((id, i) => {
        const r = clamp((t - runT) / 2.6);
        const x = lerp(380 + i * 280, 1300 + i * 280, ease.inOutQuad(r));
        RV.shadow(ctx, x, 990, 66);
        RV.drawKid(ctx, id, Object.assign(RV.move('march', t * 1.8, i), { x, y: 990, s: 1.05, t, turn: 0.8, look: [1, 0], mouth: 'grin', lean: 0.1,
          armL: [0.9 + Math.sin(t * 12 + i) * 0.6, 0.6], armR: [0.9 - Math.sin(t * 12 + i) * 0.6, 0.6] }));
      });
    }
    ctx.restore();
  }, { type: 'star', dur: 0.6 });

  shot(50.4, 'climbAboard', (ctx, S) => {
    const { t, lt } = S;
    const closeT = 53.7;
    ctx.save();
    cam(ctx, { zoom: 1.08, y: 30 });
    RV.field(ctx, t, { moonX: 1650 });
    const door = t < closeT ? 1 : 1 - ease.outBounce(clamp((t - closeT) / 0.5));
    const shake = t > closeT + 0.4 ? 5 * Math.exp(-(t - closeT - 0.4) * 3) : 0;
    const kids = RV.KID_IDS.map((id, i) => {
      const t0 = 50.5 + i * 0.95;
      const walk = clamp((t - t0) / 0.8);
      const enter = clamp((t - t0 - 0.8) / 0.3);
      return { id, i, walk, enter, x: lerp(300 + i * 200, 960, ease.inOutQuad(walk)) };
    });
    RV.drawBox(ctx, 960, 900, {
      s: 1.2, t, door, glow: 0.7, shake,
      inDoor: (c, x, y) => {
        kids.filter((k) => k.enter > 0 && k.enter < 1).forEach((k) => {
          RV.drawKid(c, k.id, Object.assign(RV.move('walk', t * 1.4, k.i), { x, y: y - 10, s: 0.62 * (1 - k.enter * 0.35), t, turn: 0 }));
        });
        RV.drawRusty(c, { x: x + 40, y: y - 4, s: 0.45, t, pawL: 0.6 + Math.sin(t * 10) * 0.3, mouth: 'tongue', eyes: 'happy' });
      },
    });
    kids.filter((k) => k.enter <= 0).forEach((k) => {
      RV.shadow(ctx, k.x, 990, 64);
      RV.drawKid(ctx, k.id, Object.assign(RV.move(k.walk > 0 && k.walk < 1 ? 'walk' : 'bounce', t * 1.3, k.i),
        { x: k.x, y: 990, s: 0.95, t, turn: 0.6, look: [0.8, -0.3] }, kidsTalk(t)));
    });
    kids.filter((k) => k.enter > 0 && k.enter < 1).forEach((k) => RV.sparkleField(ctx, t, { n: 5, x0: 880, x1: 1040, y0: 550, y1: 800, seed: k.i }));
    if (t > closeT + 0.2) RV.bigText(ctx, 'CLUNK!', 1300, 420, 72, { fill: '#ffffff', rot: 0.12 });
    ctx.restore();
  }, { type: 'wipe', dur: 0.6 });

  // interior staging shared by several shots
  function interiorCast(ctx, t, o = {}) {
    RV.shadow(ctx, 960, 900, 130);
    const rusty = Object.assign({ x: o.rustyX || 960, y: 900, s: o.rustyS || 0.95, t, pose: 'stand', blink: RV.blink(t, 7), goggles: 1, headTilt: 0.05 * Math.sin(t * 2) }, RV.rustyMove('idle', t, 1), o.rusty || {});
    const kidY = 960;
    const spots = o.spots || [[420, kidY, 1.0], [1460, kidY, 0.98], [1680, kidY, 0.98]];
    RV.drawKids(ctx, t, spots, (id, i) => Object.assign(RV.move(o.move || 'idle', t, i), o.kids ? o.kids(id, i) : {}));
    RV.drawRusty(ctx, rusty);
  }

  shot(54.4, 'lightsOn', (ctx, S) => {
    const { t } = S;
    const onT = wordTime(11, 5) - 0.05; // "lights"
    const L = clamp((t - onT) / 0.6);
    ctx.save();
    cam(ctx, { zoom: 1.05 });
    RV.shipInterior(ctx, t, { lights: L, leftWin: (c, x, y, r) => RV.timeVortex(c, t, x, y, r), rightWin: (c, x, y, r) => RV.spaceWindow(c, t, x, y, r) });
    // wall switch lever pulled by Rusty
    rrect(ctx, 1080, 520, 90, 140, 12); fs(ctx, '#8ea2bd', 5);
    ctx.save(); ctx.translate(1125, 590); ctx.rotate(L > 0 ? 0.6 : -0.6);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -80); ctx.lineWidth = 14; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#ddd'; ctx.stroke();
    circle(ctx, 0, -86, 18); fs(ctx, '#ff4d6d', 4);
    ctx.restore();
    const eyes = RV.collectEyes(() => interiorCast(ctx, t, {
      rusty: Object.assign({ x: 960, handR: L > 0 ? [175, -330] : [175, -440], armR: undefined }, rustyTalk(t)),
      kids: () => (L > 0.5 ? { eyes: 'wide', mouth: 'grin' } : { eyes: 'open', look: [0, -0.5] }),
    }));
    RV.console(ctx, 960, 1160, t, { lights: L });
    // darkness overlay; everyone's eyes shine through it, right on top of their real eyes
    if (L < 1) {
      ctx.save();
      ctx.fillStyle = `rgba(4,6,20,${0.93 * (1 - L)})`;
      ctx.fillRect(-100, -100, W + 200, H + 200);
      ctx.restore();
      RV.drawDarkEyes(ctx, eyes, 1 - clamp(L * 2));
    }
    ctx.restore();
    if (L > 0) RV.flash(ctx, (1 - clamp((t - onT) / 0.4)) * 0.8, '#fff6d6');
    if (t > onT) RV.slam(ctx, 'CLICK!', 1300, 220, 90, t - onT, { gradient: ['#ffffff', '#ffd23f'], dur: 1.2 });
  }, { type: 'black', dur: 0.5 });

  shot(57.2, 'lookLeft', (ctx, S) => {
    const { t, lt, d } = S;
    const e = ease.inOutCubic(clamp(lt / 1.6));
    const z = ease.inOutCubic(clamp((lt - 2.2) / (d - 2.2)));
    ctx.save();
    cam(ctx, { x: lerp(0, -760, e), zoom: 1 + z * 0.7, y: -z * 120 });
    RV.shipInterior(ctx, t, { lights: 1, leftWin: (c, x, y, r) => RV.timeVortex(c, t, x, y, r), rightWin: (c, x, y, r) => RV.spaceWindow(c, t, x, y, r) });
    interiorCast(ctx, t, {
      rusty: Object.assign({ armL: [2.0, 0.2], armR: [0.4, 0.3], headTurn: -0.8, look: [-1, 0] }, rustyTalk(t)),
      kids: () => ({ turn: -0.9, look: [-1, -0.2], mouth: 'o', open: 0.5 }),
    });
    ctx.restore();
    if (lt > 2.4) RV.bigText(ctx, 'TIME!', 380, 170, 96 * RV.pop(lt - 2.4), { gradient: ['#ffe5ff', '#c77dff', '#7b2cbf'] });
  }, { type: 'cut' });

  shot(60.9, 'lookRight', (ctx, S) => {
    const { t, lt, d } = S;
    const e = ease.inOutCubic(clamp(lt / 0.9));
    const z = ease.inOutCubic(clamp((lt - 2.0) / 2.8));
    ctx.save();
    cam(ctx, { x: lerp(-760, 760, e), zoom: 1 + z * 0.75, y: -z * 120 });
    RV.shipInterior(ctx, t, { lights: 1, leftWin: (c, x, y, r) => RV.timeVortex(c, t, x, y, r), rightWin: (c, x, y, r) => RV.spaceWindow(c, t, x, y, r, { drift: 30 }) });
    interiorCast(ctx, t, {
      rusty: Object.assign({ armR: [2.0, 0.2], armL: [0.4, 0.3], headTurn: 0.8, look: [1, 0] }, rustyTalk(t)),
      kids: () => ({ turn: 0.9, look: [1, -0.2], mouth: 'grin', eyes: lt > 3 ? 'wide' : 'open' }),
    });
    ctx.restore();
    if (lt > 2.6 && lt < d) RV.bigText(ctx, 'SPACE!', 1540, 170, 96 * RV.pop(lt - 2.6), { gradient: ['#e0fbfc', '#4cc9f0', '#3a0ca3'] });
    if (e < 1) { ctx.save(); ctx.globalAlpha = Math.sin(e * Math.PI) * 0.8; RV.hSpeedLines(ctx, t, { n: 30, speed: 3 }); ctx.restore(); }
  }, { type: 'cut' });

  shot(66.6, 'howPossible', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.0 + lt * 0.02 });
    RV.shipInterior(ctx, t, { lights: 1, leftWin: (c, x, y, r) => RV.timeVortex(c, t, x, y, r) });
    RV.drawKid(ctx, 'boy', Object.assign(RV.move('idle', t, 1), { x: 1300, y: 1000, s: 1.1, t, turn: -0.5, look: [-0.8, 0], armL: [1.3, -0.9], armR: [1.3, -0.9], mouth: 'flat', browAng: 0.6, brow: 0.5 }));
    RV.drawKid(ctx, 'little', Object.assign(RV.move('idle', t, 2), { x: 1560, y: 1000, s: 1.05, t, turn: -0.5, look: [-0.8, 0], armL: [1.3, -0.9], armR: [1.3, -0.9], mouth: 'o', open: 0.3 }));
    RV.drawKid(ctx, 'big', Object.assign(RV.move('idle', t, 0), { x: 640, y: 1240, s: 1.75, t, turn: 0.3, look: [0.3, -0.5], brow: 1, browAng: 0.5,
      headTilt: 0.12, armR: [1.0, -2.3], armL: [0.3, 0.2] }, talkMouth(t)));
    RV.questionMarks(ctx, t, 640, 280, lt - 0.5);
    ctx.restore();
  }, { type: 'cut' });

  shot(69.75, 'ace', (ctx, S) => {
    const { t, lt, d } = S;
    const aceT = wordTime(17, 8) - 0.05;
    const zoom = 1 + ease.inCubic(clamp(lt / d)) * 0.35;
    ctx.save();
    cam(ctx, { zoom, y: -40 * zoom });
    RV.shipInterior(ctx, t, { lights: 1, rightWin: (c, x, y, r) => RV.spaceWindow(c, t, x, y, r) });
    const shrug = t < aceT;
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1000, s: 1.3, t, pose: 'stand', goggles: 1, blink: RV.blink(t, 3),
      armL: shrug ? [1.4, -0.7] : [0.5, 0.2], armR: shrug ? [1.4, -0.7] : [2.2, 0.6], headTilt: shrug ? 0.2 : -0.1, brow: shrug ? 1 : 0 },
    shrug ? rustyTalk(t) : { mouth: 'grin', eyes: 'happy' }));
    ctx.restore();
    if (!shrug) RV.slam(ctx, 'ACE!', W / 2, 250, 220, t - aceT, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], dur: 2 });
  }, { type: 'cut' });

  // ============================================================ CHORUS 1 — space dance party
  function spaceParty(ctx, t, o = {}) {
    RV.space(ctx, t, { drift: 20, planets: true });
    ctx.save(); ctx.globalAlpha = 0.18;
    RV.sunburst(ctx, W / 2, 1400, t, { colors: ['#ffffff', 'rgba(255,255,255,0)'], n: 20, speed: 0.2 });
    ctx.restore();
    // asteroid stage
    ctx.save(); ctx.translate(W / 2, 1040 + Math.sin(t * 1.3) * 6);
    ellipse(ctx, 0, 40, 900, 150); fs(ctx, '#6d597a', 6);
    ellipse(ctx, 0, 0, 880, 110); fs(ctx, '#b56576', 6);
    ctx.fillStyle = '#e56b6f';
    [[-500, -10, 60], [300, 20, 44], [620, -20, 30], [-200, 30, 36]].forEach(([x, y, r]) => { ellipse(ctx, x, y, r, r * 0.35); ctx.fill(); });
    ctx.restore();
    void o;
  }

  shot(72.52, 'c1_party', (ctx, S) => {
    const { t } = S;
    const k = kick(t, 6);
    spaceParty(ctx, t);
    ctx.save();
    cam(ctx, { zoom: 1 + k * 0.025 });
    RV.drawKids(ctx, t, [[330, 1090, 1.3], [1330, 1090, 1.3], [1650, 1090, 1.3]], (id, i) =>
      Object.assign(RV.move(['bounce', 'twist', 'wave'][i], t, i), { mouth: 'grin', eyes: 'happy' }));
    RV.shadow(ctx, 860, 1080, 170);
    RV.drawRusty(ctx, Object.assign({ x: 860, y: 1090, s: 1.35, t, goggles: 1 }, RV.rustyMove('disco', t)));
    ctx.restore();
    RV.confetti(ctx, t, { rain: true, n: 60 });
    chorusSlam(ctx, t, 'chorus1');
    RV.flash(ctx, clamp(1 - (t - 72.52) / 0.35));
  }, { type: 'cut' });

  shot(77.4, 'c1_popart', (ctx, S) => {
    const { t } = S;
    const k = RV.hitIndex(t, 'chorus1');
    const cols = [['#ff4fa3', '#ffd23f'], ['#4cc9f0', '#ff4fa3'], ['#ffd23f', '#06d6a0'], ['#b388eb', '#ff9f1c']];
    const acc = [{ shades: 'pink' }, { goggles: 2 }, { mouth: 'tongue' }, { shades: 'gold' }];
    for (let i = 0; i < 4; i++) {
      const gx = (i % 2) * 960, gy = Math.floor(i / 2) * 540;
      const c = cols[(i + Math.max(0, k)) % 4];
      RV.halftone(ctx, gx, gy, 960, 540, c[1], c[0], 30);
      ctx.save();
      ctx.beginPath(); ctx.rect(gx, gy, 960, 540); ctx.clip();
      const b = RV.bounce(t, 1, i * 0.25);
      ctx.translate(gx + 480, gy + 300 - b * 18);
      ctx.rotate(Math.sin(RV.beat(t) * Math.PI / 2 + i) * 0.12);
      ctx.scale(2.1, 2.1);
      RV.rustyHead(ctx, Object.assign({ t, eyes: 'open', mouth: 'tongue', earFlip: i % 2 ? 'R' : 'L', blink: RV.blink(t, i) }, acc[i]));
      ctx.restore();
    }
    ctx.lineWidth = 16; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.moveTo(960, 0); ctx.lineTo(960, H); ctx.moveTo(0, 540); ctx.lineTo(W, 540); ctx.stroke();
    chorusSlam(ctx, t, 'chorus1', { y: 540, size: 150 });
  }, { type: 'flash', dur: 0.25 });

  shot(83.0, 'c1_float', (ctx, S) => {
    const { t, lt } = S;
    RV.space(ctx, t, { drift: 220, planets: false });
    // parallax planets whizzing past
    for (let i = 0; i < 5; i++) {
      const x = W + 300 - RV.fract(lt * 0.12 + i * 0.23) * (W + 700);
      RV.planet(ctx, x, 150 + i * 190, 40 + (i % 3) * 30, { color: ['#f4a261', '#4cc9f0', '#b388eb', '#06d6a0', '#ef476f'][i], ring: i === 2, face: i === 4 });
    }
    RV.hSpeedLines(ctx, t, { n: 24, speed: 1.4, color: 'rgba(255,255,255,0.35)' });
    // everyone floating in bubble helmets
    const pos = [[420, 560], [800, 400], [1150, 620], [1530, 430]];
    pos.forEach(([x, y], i) => {
      const fy = y + Math.sin(t * 1.8 + i * 1.3) * 40, fx = x + Math.cos(t * 1.1 + i) * 30;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(Math.sin(t * 0.9 + i) * 0.35);
      if (i === 1) {
        const rm = RV.rustyMove('twist', t);
        RV.drawRusty(ctx, Object.assign({ x: 0, y: 150, s: 0.8, t, goggles: 2 }, rm));
        ellipse(ctx, 0, 150 - (292 - rm.bob) * 0.8, 105, 105); ctx.fillStyle = 'rgba(190,240,255,0.18)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
      } else {
        const id = ['big', null, 'boy', 'little'][i];
        RV.drawKid(ctx, id, Object.assign(RV.move('swim', t, i), { x: 0, y: 180, s: 0.8, t, mouth: 'grin', eyes: 'happy' }));
        const hy = 180 + RV.kidHead(id, 0.8) + RV.move('swim', t, i).bob * 0.8;
        ctx.translate(0, hy + 118);
        circle(ctx, 0, -118, id === 'big' ? 118 : 96); ctx.fillStyle = 'rgba(190,240,255,0.16)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
        ctx.beginPath(); ctx.arc(-30, -150, 50, Math.PI * 1.1, Math.PI * 1.45); ctx.lineWidth = 6; ctx.stroke();
      }
      ctx.restore();
    });
    chorusSlam(ctx, t, 'chorus1', { y: 150 });
  }, { type: 'whip', dur: 0.45 });

  shot(89.1, 'c1_orbit', (ctx, S) => {
    const { t, lt } = S;
    RV.space(ctx, t, { planets: false });
    const cx = W / 2, cy = 1250, R = 620;
    // little planet
    const k = kick(t, 6);
    ctx.save();
    cam(ctx, { zoom: 1 + k * 0.02 });
    circle(ctx, cx, cy, R); fs(ctx, '#80ed99', 7);
    ctx.save(); circle(ctx, cx, cy, R); ctx.clip();
    ctx.fillStyle = '#57cc99';
    for (let i = 0; i < 8; i++) { const a = i * 0.8 + t * 0.2; ellipse(ctx, cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.5, 120, 60, a); ctx.fill(); }
    ctx.restore();
    // conga line walking over the top
    const cast = ['rusty', 'big', 'boy', 'little'];
    cast.forEach((who, i) => {
      const a = -Math.PI / 2 + (i - 1.5) * 0.3 + Math.sin(t * 0.5) * 0.08;
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
      if (who === 'rusty') RV.drawRusty(ctx, Object.assign({ x: 0, y: 0, s: 0.75, t }, RV.rustyMove('cheer', t)));
      else RV.drawKid(ctx, who, Object.assign(RV.move(lt > 4.8 ? 'cheer' : 'twist', t, i), { x: 0, y: 0, s: 0.72, t, mouth: 'grin' }));
      ctx.restore();
    });
    ctx.restore();
    RV.fireworks(ctx, t, [[90.2, 400, 260, '#ff4fa3'], [91.0, 1500, 220, '#4cc9f0'], [92.4, 800, 180, '#ffd23f'], [93.2, 1250, 300, '#06d6a0'], [94.0, 500, 200, '#b388eb'], [94.3, 1600, 160, '#ff9f1c']]);
    chorusSlam(ctx, t, 'chorus1', { y: 190 });
  }, { type: 'zoom', dur: 0.5 });

  // ------------------------------------------------------------ (more sections appended in shots2.js)
  RV._shotList = SH;
  RV._shotHelpers = { cam, talkMouth, rustyTalk, kidsTalk, lineWord, wordTime, kick, popAt, rustyInPorthole, stageKidsRow, dogBed, chorusSlam, interiorCast, spaceParty, shot };
})(globalThis.RV);
