/* Storyboard part 3: chorus 3 (disco), bridge, verse 4 (home), chorus 4 (finale), outro. */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H;
  const OUT = RV.OUT;
  const { cam, talkMouth, rustyTalk, kidsTalk, kick, chorusSlam, shot } = RV._shotHelpers;
  const LN = (prefix) => RV.LYRICS.findIndex((L) => L.text.startsWith(prefix));
  const wt = (prefix, wi) => RV.LYRICS[LN(prefix)].w[wi][0];
  const DANCERS = ['disco1', 'disco2', 'disco3', 'disco4'];

  function neon(ctx, text, x, y, size, color, o = {}) {
    ctx.save();
    ctx.font = `${size}px ${o.font || RV.FONT.disco}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color; ctx.shadowBlur = size * 0.4;
    ctx.fillStyle = o.core || '#ffffff';
    ctx.lineWidth = size * 0.06; ctx.strokeStyle = color;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.shadowBlur = size * 0.15;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
  function neonSlam(ctx, t, section, y = 170) {
    const h = RV.lastHit(t, section);
    if (!h) return;
    const lt = t - h.t;
    if (lt > 1.8) return;
    const k = RV.hitIndex(t, section);
    const cols = ['#ff4fa3', '#4cc9f0', '#ffd23f', '#06d6a0', '#b388eb'];
    const flick = lt < 0.25 ? (Math.sin(lt * 90) > -0.2 ? 1 : 0.25) : 1;
    const s = ease.outBack(clamp(lt / 0.25), 2) * clamp((1.8 - lt) / 0.3);
    ctx.save();
    ctx.globalAlpha = flick;
    ctx.translate(W / 2, y); ctx.scale(s, s); ctx.rotate(k % 2 ? 0.04 : -0.04);
    neon(ctx, 'RUSTY THE DOG!', 0, 0, 110, cols[k % cols.length]);
    ctx.restore();
  }

  function dancerLine(ctx, t, y, s, xs, move = 'disco') {
    xs.forEach((x, i) => {
      RV.shadow(ctx, x, y + 4, 70 * s, 0.3);
      RV.drawKid(ctx, DANCERS[i % 4], Object.assign(RV.move(i % 2 ? 'twist' : move, t, i * 0.5), { x, y, s, t, mouth: 'grin', eyes: i % 2 ? 'happy' : 'open' }));
    });
  }

  // ============================================================ CHORUS 3 — disco
  shot(248.42, 'c3_floor', (ctx, S) => {
    const { t } = S;
    ctx.save();
    cam(ctx, { zoom: 1.05 + kick(t, 6) * 0.03 });
    RV.discoHall(ctx, t, { band: true });
    dancerLine(ctx, t, 760, 0.62, [260, 520, 1400, 1660]);
    RV.drawKids(ctx, t, [[420, 1050, 1.15], [1500, 1050, 1.1], [1740, 1050, 1.1]], (id, i) => Object.assign(RV.move(['disco', 'robot', 'twist'][i], t, i), { mouth: 'grin' }));
    RV.shadow(ctx, 960, 1050, 150, 0.3);
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1050, s: 1.25, t, shades: 'pink' }, RV.rustyMove('disco', t)));
    ctx.restore();
    neonSlam(ctx, t, 'chorus3');
    RV.flash(ctx, clamp(1 - (t - 248.42) / 0.3) * 0.7, '#ffc2e2');
  }, { type: 'cut' });

  shot(253.5, 'c3_close', (ctx, S) => {
    const { t, lt } = S;
    const idx = Math.floor(lt / (RV.BEAT * 2)) % 4;
    const cols = [['#ff4fa3', '#3c096c'], ['#4cc9f0', '#10002b'], ['#ffd23f', '#5a189a'], ['#06d6a0', '#240046']];
    RV.radialBg(ctx, cols[idx][0], cols[idx][1], W / 2, H / 2, 1000);
    ctx.save(); ctx.globalAlpha = 0.3; RV.sunburst(ctx, W / 2, H / 2, t, { colors: ['#ffffff', 'rgba(255,255,255,0)'], n: 16, speed: 1 }); ctx.restore();
    RV.discoSpots(ctx, t, 30, 0.4);
    ctx.save();
    cam(ctx, { zoom: 1 + kick(t, 6) * 0.04 });
    if (idx === 0) RV.drawRusty(ctx, Object.assign({ x: W / 2, y: 1250, s: 2.1, t, shades: 'gold' }, RV.rustyMove('disco', t)));
    else {
      const id = RV.KID_IDS[idx - 1];
      RV.drawKid(ctx, id, Object.assign(RV.move(['spin', 'robot', 'wave'][idx - 1], t, idx), { x: W / 2, y: 1300, s: 2.0, t, mouth: 'grin', eyes: 'happy', sway: 4 }));
    }
    ctx.restore();
    RV.mirrorBall(ctx, 1650, 170, 80, t);
    neonSlam(ctx, t, 'chorus3', 150);
  }, { type: 'cut' });

  // ============================================================ BRIDGE
  shot(258.64, 'flares', (ctx, S) => {
    const { t, lt } = S;
    const pan = lt * 40;
    ctx.save();
    cam(ctx, { zoom: 1.12, x: -120 + pan, y: 20 });
    RV.discoHall(ctx, t, { band: true });
    dancerLine(ctx, t, 1000, 1.0, [260, 620, 1300, 1660], 'disco');
    // kids + Rusty peeking from the side, amazed
    RV.drawKid(ctx, 'little', { x: 960, y: 1030, s: 0.8, t, eyes: 'wide', mouth: 'o', open: 0.6, look: [-0.8, 0], turn: -0.5, blink: RV.blink(t, 3) });
    ctx.restore();
    const fT = wt('There were people', 4);
    if (t > fT) RV.slam(ctx, 'FLARES!', 1540, 170, 100, t - fT, { gradient: ['#ffffff', '#ff9f1c', '#ff4fa3'], dur: 2.2, font: RV.FONT.groovy });
    const tT = wt('To the beat', 5);
    if (t > tT) RV.slam(ctx, 'FUNKY!', 420, 200, 100, t - tT, { gradient: ['#ffffff', '#06d6a0', '#118ab2'], dur: 1.8, font: RV.FONT.groovy });
    RV.musicNotes(ctx, t, 960, 560, { n: 8, rise: 380 });
  }, { type: 'flash', dur: 0.3 });

  shot(264.2, 'rustyHowl', (ctx, S) => {
    const { t, lt } = S;
    const jT = wt('Rusty jumped', 1), hT = wt('Rusty jumped', 6);
    ctx.save();
    cam(ctx, { zoom: 1.08 });
    RV.discoHall(ctx, t, { band: false });
    // spotlight on the floor centre
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, 'rgba(255,250,220,0.5)'); g.addColorStop(1, 'rgba(255,250,220,0.05)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(900, 0); ctx.lineTo(1020, 0); ctx.lineTo(1260, 1080); ctx.lineTo(660, 1080); ctx.closePath(); ctx.fill();
    ctx.restore();
    dancerLine(ctx, t, 900, 0.8, [200, 480, 1440, 1720], 'wave');
    const jp = clamp((t - jT + 0.3) / 0.7);
    const x = lerp(-150, 960, ease.outQuad(jp)), y = 1040 - Math.sin(jp * Math.PI) * 360;
    const howling = t > hT - 0.15;
    RV.shadow(ctx, 960, 1044, 160 * jp, 0.35);
    RV.drawRusty(ctx, Object.assign({ x, y, s: 1.35, t, shades: 'pink' }, howling ? RV.rustyMove('howl', t) : { pose: 'stand', armL: [2.6, 0.2], armR: [2.6, 0.2], mouth: 'open', open: 0.8, eyes: 'happy', footL: [0, 30], footR: [0, 30] },
      howling ? { headTilt: -0.35 } : {}));
    ctx.restore();
    if (howling) {
      RV.letters(ctx, 'AWOOOOO!', W / 2 + 60, 180, 120, { gradient: ['#ffffff', '#4cc9f0', '#7209b7'] }, (i) => ({ s: RV.pop(t - hT - i * 0.06), dy: Math.sin(t * 7 + i * 0.8) * 16, r: Math.sin(t * 5 + i) * 0.08 }));
      RV.musicNotes(ctx, t, 1100, 520, { n: 7, rise: 360 });
    }
    void lt;
  }, { type: 'cut' });

  shot(267.5, 'joinIn', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.0 + kick(t, 6) * 0.02, y: -30 });
    RV.discoHall(ctx, t, { band: false, ballX: 520 });
    dancerLine(ctx, t, 860, 0.7, [150, 380, 1540, 1770]);
    RV.drawKids(ctx, t, [[520, 1040, 1.15], [1420, 1040, 1.1], [1660, 1040, 1.1]], (id, i) => Object.assign(RV.move(['wave', 'cheer', 'twist'][i], t, i), { mouth: 'grin', eyes: 'happy' }));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1040, s: 1.25, t, shades: 'pink' }, RV.rustyMove('howl', t), { headTilt: -0.3 }));
    ctx.restore();
    RV.hearts(ctx, t, W / 2, 800, { n: 6 });
    void lt;
  }, { type: 'cut' });

  shot(269.7, 'paintedMoon', (ctx, S) => {
    const { t, lt } = S;
    const pT = wt('But the moon was', 5), vT = wt('But the moon was', 7);
    const flap = ease.outElastic(clamp((t - pT) / 0.9));
    ctx.save();
    const z = lerp(1.9, 1.15, ease.inOutCubic(clamp((t - pT + 0.6) / 1.4)));
    cam(ctx, { zoom: z, x: lerp(490, 200, ease.inOutCubic(clamp((t - pT + 0.6) / 1.4))), y: lerp(-310, -150, ease.inOutCubic(clamp((t - pT + 0.6) / 1.4))) });
    RV.skyGradient(ctx, ['#12052e', '#2b0b52', '#3c096c']);
    RV.velvetBackdrop(ctx, t, { flap: flap * 0.9 });
    // the "stars" wobble on strings
    if (t > vT) {
      ctx.strokeStyle = 'rgba(220,200,160,0.7)'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const x = 300 + i * 260; ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x + Math.sin(t * 3 + i) * 10, 200 + (i % 3) * 60); ctx.stroke(); RV.star(ctx, x + Math.sin(t * 3 + i) * 10, 220 + (i % 3) * 60, 26, 11); fs(ctx, '#ffe066', 3); }
    }
    ctx.restore();
    if (t > pT) RV.slam(ctx, 'PAINTED?!', 480, 850, 110, t - pT, { gradient: ['#ffffff', '#ffd23f', '#ff9f1c'], dur: 2.5 });
    if (t > vT) RV.bigText(ctx, 'VELVET!', 1480, 880, 90 * RV.pop(t - vT), { fill: '#e0aaff' });
    void lt;
  }, { type: 'cut' });

  shot(275.1, 'bunkerSign', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.05 + kick(t, 6) * 0.02 });
    RV.discoHall(ctx, t, { band: true, backdrop: true });
    ctx.fillStyle = 'rgba(10,0,25,0.35)'; ctx.fillRect(0, 0, W, H);
    // neon sign
    const on = lt > 0.3 && (lt > 0.8 || Math.sin(lt * 70) > 0);
    rrect(ctx, 460, 150, 1000, 300, 40); fs(ctx, '#1b1030', 8);
    if (on) {
      neon(ctx, 'SECRET', 960, 230, 90, '#ff4fa3');
      neon(ctx, 'DISCO BUNKER', 960, 350, 90, '#4cc9f0');
      neon(ctx, 'EST. 1972', 960, 425, 34, '#ffd23f', { font: RV.FONT.title });
    }
    dancerLine(ctx, t, 1020, 0.85, [160, 480, 1440, 1760]);
    RV.drawKids(ctx, t, [[720, 1050, 0.9], [1140, 1050, 0.88], [1300, 1050, 0.88]], (id, i) => Object.assign(RV.move(['disco', 'robot', 'wave'][i], t, i), { mouth: 'grin' }));
    RV.drawRusty(ctx, Object.assign({ x: 930, y: 1050, s: 0.95, t, shades: 'pink' }, RV.rustyMove('twist', t)));
    ctx.restore();
  }, { type: 'wipe', dur: 0.5, colors: ['#ff4fa3', '#4cc9f0', '#ffd23f'] });

  shot(278.5, 'timeYell', (ctx, S) => {
    const { t, lt } = S;
    const yT = wt('We boogied till', 7);
    if (t < yT - 0.1) {
      // clock racing through the night
      RV.radialBg(ctx, '#5a189a', '#10002b');
      RV.discoSpots(ctx, t, 26, 0.35);
      const hours = 11 + ease.inOutCubic(clamp(lt / (yT - S.shot.t0 - 0.2))) * 7;
      RV.clockFace(ctx, 700, 540, 300, hours);
      // sunrise badge
      const sun = clamp((hours - 16) / 2);
      ctx.save(); ctx.globalAlpha = sun;
      circle(ctx, 1380, 560, 170); fs(ctx, '#ffd23f', 8);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.moveTo(1380 + Math.cos(a) * 200, 560 + Math.sin(a) * 200); ctx.lineTo(1380 + Math.cos(a) * 260, 560 + Math.sin(a) * 260); ctx.lineWidth = 14; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); }
      ctx.restore();
      RV.bigText(ctx, 'TILL DAWN!', 1380, 880, 90, { font: RV.FONT.groovy, fill: '#ffd23f' });
    } else {
      RV.radialBg(ctx, '#ffbe0b', '#fb5607');
      ctx.save(); ctx.globalAlpha = 0.4; RV.sunburst(ctx, W / 2, 600, t, { colors: ['#ffffff', 'rgba(255,255,255,0)'], n: 20, speed: 1.5 }); ctx.restore();
      ctx.save(); cam(ctx, { shake: 16, t, zoom: 1.05 });
      ctx.translate(W / 2, 640); ctx.scale(3.2, 3.2);
      RV.rustyHead(ctx, { t, mouth: 'howl', eyes: 'closed', shades: 'pink', headTilt: 0 });
      ctx.restore();
      RV.slam(ctx, 'TIME!', W / 2, 180, 200, t - yT, { gradient: ['#ffffff', '#ffd23f', '#e63946'], dur: 3 });
    }
  }, { type: 'cut' });

  shot(281.2, 'hopBack', (ctx, S) => {
    const { t, lt } = S;
    const closeT = 284.4;
    ctx.save();
    cam(ctx, { zoom: 1.05, x: 60 });
    RV.discoHall(ctx, t, { band: false });
    const door = t < closeT ? 1 : 1 - ease.outBounce(clamp((t - closeT) / 0.5));
    RV.drawBox(ctx, 1480, 1000, { s: 1.0, t, door, glow: 0.9, shake: t > closeT + 0.3 ? 4 : 0 });
    // kids hop in one by one
    RV.KID_IDS.concat(['rusty']).forEach((who, i) => {
      const t0 = 281.5 + i * 0.6;
      const p = clamp((t - t0) / 0.6);
      if (p >= 1) return;
      const x = lerp(700 - i * 120, 1480, p), y = 1030 - Math.sin(p * Math.PI) * 220;
      const s = 0.8 * (1 - p * 0.3);
      if (who === 'rusty') RV.drawRusty(ctx, { x, y, s, t, pose: 'stand', armL: [2.5, 0.2], armR: [2.5, 0.2], mouth: 'tongue', footL: [0, 30], footR: [0, 30], shades: 'pink' });
      else RV.drawKid(ctx, who, { x, y, s, t, armL: [2.6, 0.2], armR: [2.6, 0.2], mouth: 'grin', eyes: 'happy', footL: [0, 30], footR: [0, 10] });
    });
    // disco folk waving goodbye
    dancerLine(ctx, t, 1060, 0.9, [160, 420, 680], 'wave');
    ctx.restore();
    if (lt > 1.4) RV.bigText(ctx, 'BYE!', 420, 330, 110 * RV.pop(lt - 1.4), { fill: '#ffd23f', rot: -0.1 });
    if (t > closeT + 0.1) RV.bigText(ctx, 'SLAM!', 1480, 330, 90, { fill: '#ffffff', rot: 0.1 });
  }, { type: 'cut' });

  shot(285.92, 'blastOff', (ctx, S) => {
    const { t, lt, d } = S;
    const p = clamp(lt / d);
    const rise = ease.inQuad(p);
    // the box rockets up through the soil layers and bursts out into 1972
    const boxY = lerp(1900, -300, rise);
    const camY = Math.min(boxY - 700, 1150);
    ctx.save();
    cam(ctx, { y: camY, shake: 10, t });
    RV.underground(ctx, t, { surfaceY: 300, vanX: 400, houseX: 1550 });
    ctx.fillStyle = '#3a2012'; ctx.fillRect(-800, 2350, 3600, 1400);
    // drilled shaft behind the box
    ctx.fillStyle = 'rgba(30,15,5,0.6)';
    ctx.fillRect(840, Math.max(boxY, 300), 240, 3000);
    // debris streaming past (sells the speed)
    for (let i = 0; i < 26; i++) {
      const x = 960 + (hash(i * 3.7) - 0.5) * 700;
      const y = boxY - 300 + RV.fract(hash(i * 1.3) + lt * (1.2 + hash(i) * 1.5)) * 1500;
      if (y < 300) continue;
      ellipse(ctx, x, y, 10 + hash(i * 2) * 14, 8 + hash(i * 5) * 8, i + t * 4); fs(ctx, '#a0785a', 3);
    }
    // dirt spray when breaking the surface
    const burst = clamp((300 - boxY + 200) / 400);
    if (burst > 0 && burst < 1) {
      for (let i = 0; i < 26; i++) {
        const a = -Math.PI / 2 + (hash(i) - 0.5) * 2.4, v = 300 + hash(i * 3) * 800;
        ellipse(ctx, 960 + Math.cos(a) * v * burst, 300 + Math.sin(a) * v * burst + 500 * burst * burst, 22, 16, i); fs(ctx, '#8d5a3b', 3);
      }
    }
    // rocket flame under the box
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) glow(ctx, 960 + Math.sin(t * 30 + i) * 20, boxY + 470 + i * 70, 110 - i * 12, i % 2 ? '#ff9f1c' : '#ffd23f', 0.85);
    ctx.restore();
    RV.drawBox(ctx, 960, boxY + 440, { s: 1.0, t, glow: 1.2, door: 0, porthole: 1, rusty: RV._shotHelpers.rustyInPorthole(t) });
    ctx.restore();
    // vertical speed lines
    ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,0.35)'; ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const x = hash(i * 9.1) * W, y = RV.fract(hash(i * 2.3) + lt * 1.8) * (H + 400) - 200;
      ctx.lineWidth = 3 + hash(i) * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 120 + hash(i * 4) * 200); ctx.stroke();
    }
    ctx.restore();
    RV.letters(ctx, 'OH-OH-OH!', W / 2, 150, 110, { gradient: ['#ffffff', '#ffd23f', '#ff4fa3'] }, (i) => ({ dy: Math.sin(t * 8 + i * 0.7) * 16, s: RV.pop(lt - 0.2 - i * 0.05) }));
  }, { type: 'flash', dur: 0.3 });

  shot(291.4, 'skyRide', (ctx, S) => {
    const { t, lt, d } = S;
    const p = clamp(lt / d);
    // sky fading into space
    RV.skyGradient(ctx, [RV.mix('#ffb347', '#07051a', p), RV.mix('#ffcc80', '#1a0f45', p), RV.mix('#ffe8b0', '#2a1b6e', p)]);
    ctx.save(); ctx.globalAlpha = p; RV.stars(ctx, t, { n: 160, y1: H, drift: 80 }); ctx.restore();
    RV.cloud(ctx, 1500 - lt * 300, 700 + lt * 120, 1.4, '#ffffff', 1 - p);
    RV.cloud(ctx, 400 - lt * 200, 900 + lt * 160, 1.1, '#ffffff', 1 - p);
    RV.hSpeedLines(ctx, t, { n: 20, speed: 1.2, color: 'rgba(255,255,255,0.4)' });
    // flying box with Rusty surfing on top and kids waving from the porthole
    const x = 960 + Math.sin(t * 1.2) * 120, y = 620 + Math.cos(t * 1.6) * 50;
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.35 + Math.sin(t * 2) * 0.06);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) glow(ctx, -40 - i * 60, 260 + i * 30, 80 - i * 8, i % 2 ? '#ff9f1c' : '#ffd23f', 0.7);
    ctx.restore();
    RV.drawBox(ctx, 0, 220, { s: 0.75, t, glow: 1, porthole: 1, rusty: null });
    RV.drawRusty(ctx, Object.assign({ x: 0, y: -125, s: 0.7, t, goggles: 2 }, RV.rustyMove('cheer', t), { jump: 0 }));
    ctx.restore();
    // kids riding along in a trailing bubble
    RV.KID_IDS.forEach((id, i) => {
      const kx = x - 420 - i * 260 + Math.sin(t * 2 + i) * 30, ky = y + 150 + i * 60 + Math.cos(t * 2.4 + i) * 30;
      RV.drawKid(ctx, id, Object.assign(RV.move('swim', t, i), { x: kx, y: ky + 150, s: 0.6, t, mouth: 'grin', eyes: 'happy' }));
      circle(ctx, kx, ky + 150 + RV.kidHead(id, 0.6), id === 'big' ? 88 : 74);
      ctx.fillStyle = 'rgba(190,240,255,0.15)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
    });
    RV.letters(ctx, 'OH-OH-OH!', W / 2, 150, 110, { gradient: ['#ffffff', '#4cc9f0', '#7209b7'] }, (i) => ({ dy: Math.sin(t * 8 + i * 0.7) * 16 }));
  }, { type: 'cut' });

  // ============================================================ VERSE 4 — home
  shot(297.17, 'whirr', (ctx, S) => {
    const { t, lt } = S;
    const spin = ease.inCubic(clamp(lt / 1.6));
    ctx.save();
    cam(ctx, { zoom: 1.3, y: 120, shake: spin * 4, t });
    RV.shipInterior(ctx, t, { lights: 1, leftWin: (c, x, y, r) => RV.timeVortex(c, t * (1 + spin * 3), x, y, r), rightWin: (c, x, y, r) => RV.spaceWindow(c, t, x, y, r) });
    RV.drawKids(ctx, t, [[520, 1010, 1.0], [1400, 1010, 1.0], [1600, 1010, 1.0]], (id, i) => Object.assign(RV.move('idle', t, i), { eyes: 'wide', mouth: 'grin', turn: i ? -0.5 : 0.5 }));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 980, s: 0.95, t, pose: 'stand', goggles: 2, handL: [-100, -150], handR: [100, -160] }, rustyTalk(t)));
    RV.console(ctx, 960, 1180, t * (1 + spin * 5), { lever: -0.6 + spin * 1.2 });
    ctx.restore();
    RV.bigText(ctx, 'WHIRRRR...', W / 2 + Math.sin(t * 40) * 3 * spin, 170, 100, { fill: '#bdf0ff' });
  }, { type: 'star', dur: 0.6 });

  shot(298.9, 'homeSweetHome', (ctx, S) => {
    const { t } = S;
    const hT = wt('We punched in', 3);
    RV.radialBg(ctx, '#2f5d7c', '#0b1e2d');
    // big retro display
    rrect(ctx, 260, 170, 1400, 460, 40); fs(ctx, '#15202e', 10);
    rrect(ctx, 300, 210, 1320, 380, 24); fs(ctx, '#07343b', 0);
    const msg = 'HOME SWEET HOME';
    const n = Math.floor(clamp((t - hT + 0.15) / 1.1) * msg.length);
    ctx.font = `150px ${RV.FONT.pixel}`; ctx.fillStyle = '#39ff9f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#39ff9f'; ctx.shadowBlur = 24;
    ctx.fillText(msg.slice(0, n) + (Math.sin(t * 12) > 0 ? '_' : ' '), W / 2, 400);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = 210; y < 590; y += 6) ctx.fillRect(300, y, 1320, 2);
    // keypad + a finger typing
    for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) {
      const x = 380 + c * 120, y = 760 + r * 120;
      const pressed = n > 0 && ((n + r * 3 + c) % 7 === 0) && Math.sin(t * 20) > 0;
      rrect(ctx, x - 48, y - 44 + (pressed ? 6 : 0), 96, 88, 16); fs(ctx, pressed ? '#ffd23f' : '#dfe6ee', 5);
    }
    const fx = 380 + (Math.floor(t * 9) % 10) * 120, fy = 700 + Math.abs(Math.sin(t * 20)) * 40;
    RV.limb(ctx, [[fx + 120, 1200], [fx, fy]], 60, '#f9d6c1', 6);
    circle(ctx, fx, fy, 30); fs(ctx, '#f9d6c1', 6);
  }, { type: 'cut' });

  shot(300.3, 'tunnelLight', (ctx, S) => {
    const { t, lt } = S;
    RV.lightTunnel(ctx, t, { speed: 2 });
    ctx.save(); ctx.translate(W / 2, H / 2 + 40); ctx.rotate(t * 3); ctx.scale(0.8 + Math.sin(t * 4) * 0.05, 0.8 + Math.sin(t * 4) * 0.05);
    RV.drawBox(ctx, 0, 220, { s: 0.8, t, glow: 1.4 });
    ctx.restore();
    RV.letters(ctx, 'WHOOSH!', W / 2, 170, 120, { gradient: ['#ffffff', '#ffd23f', '#ff4fa3'] }, (i) => ({ dx: Math.sin(t * 10 + i) * 6, s: RV.pop(lt - i * 0.04) }));
  }, { type: 'zoom', dur: 0.5 });

  shot(302.4, 'landYard', (ctx, S) => {
    const { t, lt } = S;
    const landT = wt('We landed back', 1);
    const fall = clamp((t - (landT - 0.6)) / 0.6);
    const bounce = t > landT ? Math.abs(Math.sin((t - landT) * 9)) * 60 * Math.exp(-(t - landT) * 4) : 0;
    const openT = landT + 1.2;
    ctx.save();
    cam(ctx, { shake: t > landT && t < landT + 0.5 ? 14 : 0, t, zoom: 1.02 });
    RV.backyard(ctx, t, { day: 0 });
    RV.shadow(ctx, 1080, 880, 180 * fall, 0.35);
    RV.drawBox(ctx, 1080, lerp(-500, 880, ease.inQuad(fall)) - bounce, { s: 0.95, t, glow: 0.8, door: t > openT ? clamp((t - openT) / 0.4) : 0 });
    if (t > landT) RV.dust(ctx, 1080, 880, t - landT, { n: 14, life: 1.4, color: '#c9d6c2' });
    // kids tumble out dizzy
    if (t > openT + 0.2) {
      RV.KID_IDS.forEach((id, i) => {
        const p = ease.outCubic(clamp((t - openT - 0.2 - i * 0.2) / 0.6));
        if (p <= 0) return;
        const x = lerp(1080, 560 + i * 220 - (i === 2 ? 0 : 0), p);
        RV.drawKid(ctx, id, { x, y: 960, s: 0.95, t, eyes: 'open', blink: 0.4, mouth: 'o', open: 0.4, headTilt: Math.sin(t * 5 + i) * 0.2, lean: Math.sin(t * 4 + i) * 0.1 });
        RV.dizzy(ctx, x, 960 + RV.kidHead(id, 0.95) - 90, 70, t + i);
      });
    }
    ctx.restore();
    if (t > landT) RV.slam(ctx, 'THUD!', 1500, 260, 120, t - landT, { gradient: ['#ffffff', '#90be6d'], dur: 1.5 });
    RV.bigText(ctx, 'HOME!', 480, 200, 110 * RV.pop(t - landT - 1.0), { fill: '#ffd23f' });
  }, { type: 'flash', dur: 0.35 });

  shot(305.8, 'tuesday', (ctx, S) => {
    const { t } = S;
    RV.skyGradient(ctx, ['#0b1030', '#1d2560', '#34407e']);
    RV.stars(ctx, t, { n: 120, y1: H });
    RV.moon(ctx, 1560, 250, 130, { face: true });
    RV.alarmClock(ctx, 800, 640, 1.5, '12:01', t);
    const dT = wt('On a Tuesday', 2);
    RV.bigText(ctx, 'TUESDAY', 800, 250, 120 * RV.pop(t - dT + 0.1), { gradient: ['#ffffff', '#4cc9f0'] });
  }, { type: 'cut' });

  shot(307.85, 'puppyEyes', (ctx, S) => {
    const { t, lt } = S;
    // like the photo: sitting, head tilted, one ear flipped, looking right at us
    ctx.save();
    cam(ctx, { zoom: 1.3 + lt * 0.08, y: 150 });
    RV.backyard(ctx, t, { day: 0 });
    RV.drawRusty(ctx, { x: 960, y: 1120, s: 1.8, t, headTilt: -0.24, earFlip: 'R', eyes: 'puppy', mouth: 'closed', brow: 0.8, look: [0, 0.2], blink: RV.blink(t, 6), wag: 0.4 });
    ctx.restore();
    RV.sparkleField(ctx, t, { n: 16, x0: 500, x1: 1420, y0: 150, y1: 600, size: 30 });
    RV.hearts(ctx, t, W / 2, 600, { n: 4, spread: 320, rise: 500 });
  }, { type: 'cut' });

  shot(311.3, 'theBest', (ctx, S) => {
    const { t } = S;
    ctx.save();
    cam(ctx, { zoom: 1.2 });
    RV.backyard(ctx, t, { day: 0 });
    RV.drawKids(ctx, t, [[420, 1040, 1.05], [1500, 1040, 1.0], [1720, 1040, 1.0]], (id, i) => Object.assign(RV.move('idle', t, i), { turn: i ? -0.6 : 0.6, look: [i ? -1 : 1, -0.2], eyes: 'happy', mouth: 'grin' }));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1030, s: 1.3, t, headTilt: 0.12, wag: 2, wagSpeed: 22, eyes: 'happy', pawR: 0.5 + Math.sin(t * 8) * 0.2 }, rustyTalk(t)));
    ctx.restore();
    RV.hearts(ctx, t, W / 2, 700, { n: 8, spread: 380 });
    const bT = wt("And he said 'Wasn't", 7);
    if (t > bT) RV.slam(ctx, 'THE BEST!', W / 2, 190, 130, t - bT, { gradient: ['#fff3b0', '#ffd23f', '#ff4fa3'], dur: 2 });
  }, { type: 'cut' });

  shot(313.7, 'hugs', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: 1.15 + lt * 0.03 });
    RV.backyard(ctx, t, { day: 0 });
    // Rusty in the middle, kids piling in for a group hug
    const scratch = t > wt('We nodded and', 6);
    // brother behind Rusty, scratching his head
    RV.drawKid(ctx, 'boy', { x: 1010, y: 930, s: 1.0, t, turn: -0.2, eyes: 'happy', mouth: 'grin', handL: [-60 + Math.sin(t * 25) * 18, -250], armR: [0.8, -1.8] });
    RV.drawKid(ctx, 'big', { x: 660, y: 1060, s: 1.15, t, turn: 0.7, eyes: 'happy', mouth: 'grin', lean: 0.2, handR: [230, -250], armL: [0.6, 0.4] });
    RV.drawKid(ctx, 'little', { x: 1270, y: 1070, s: 1.1, t, turn: -0.7, eyes: 'happy', mouth: 'grin', lean: -0.2, handL: [-230, -220], armR: [0.6, 0.4] });
    RV.drawRusty(ctx, { x: 960, y: 1080, s: 1.2, t, eyes: 'happy', mouth: 'tongue', headTilt: scratch ? Math.sin(t * 20) * 0.08 : 0.1, wag: 2, wagSpeed: 24, earFlip: scratch ? 'R' : null,
      pawL: scratch ? Math.abs(Math.sin(t * 26)) * 0.5 : 0 });
    ctx.restore();
    if (scratch) RV.bigText(ctx, 'SCRATCH SCRATCH!', 1480, 260, 64, { fill: '#ffffff', rot: 0.1 });
    RV.hearts(ctx, t, W / 2, 620, { n: 10, spread: 420, speed: 0.6 });
  }, { type: 'circle', dur: 0.5 });

  shot(316.7, 'yeahRusty', (ctx, S) => {
    const { t, lt } = S;
    RV.radialBg(ctx, '#ffe066', '#f3722c');
    ctx.save(); ctx.globalAlpha = 0.3; RV.sunburst(ctx, W / 2, 700, t, { colors: ['#ffffff', 'rgba(255,255,255,0)'], n: 20, speed: 0.5 }); ctx.restore();
    RV.drawKids(ctx, t, [[420, 1060, 1.2], [1500, 1060, 1.15], [1740, 1060, 1.15]], (id, i) => Object.assign(RV.move('cheer', t, i * 0.3), kidsTalk(t, id)));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1060, s: 1.3, t }, RV.rustyMove('cheer', t)));
    RV.confetti(ctx, t, { t0: 316.8, x: W / 2, y: 700, n: 120, spread: 3.2 });
    RV.slam(ctx, 'YEAH!', W / 2, 200, 170, lt - 0.1, { gradient: ['#ffffff', '#06d6a0', '#118ab2'], dur: 3 });
  }, { type: 'flash', dur: 0.3 });

  // days go by: checking the box in all weathers
  function dayPanel(ctx, t, day, weather, label, lt) {
    ctx.save();
    cam(ctx, { zoom: 1.12 });
    RV.backyard(ctx, t, { day: 1, weather });
    RV.drawBox(ctx, 1240, 880, { s: 0.85, t, glow: 0, door: 0.4 + Math.sin(t * 2) * 0.05, porthole: 0.2 });
    RV.KID_IDS.forEach((id, i) => {
      const x = 860 + i * 140, y = 960;
      const hold = weather === 'rain' ? { handL: [-10, -330], holdL: (c, hp) => { c.save(); c.translate(hp[0], hp[1]); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -120); c.lineWidth = 6; c.strokeStyle = OUT; c.stroke(); c.beginPath(); c.arc(0, -120, 110, Math.PI, 0); c.closePath(); fs(c, ['#e63946', '#ffd23f', '#4cc9f0'][i], 5); c.restore(); } } : {};
      RV.drawKid(ctx, id, Object.assign(RV.move('idle', t, i), { x, y, s: 0.85, t, turn: 0.8, look: [1, 0], mouth: 'o', open: 0.3, lean: 0.15 }, hold));
    });
    RV.drawRusty(ctx, { x: 520, y: 960, s: 0.8, t, eyes: 'closed', mouth: 'closed', wag: 0.2 });
    RV.bigText(ctx, 'Z', 560 + Math.sin(t * 2) * 10, 640 - RV.fract(t * 0.5) * 60, 50, { fill: '#ffffff', shadow: false });
    ctx.restore();
    RV.sign(ctx, label, 330, 200, { size: 64, bg: '#ffffff', rot: -0.06 });
    void day; void lt;
  }
  shot(318.8, 'checkBox1', (ctx, S) => dayPanel(ctx, S.t, 1, 'clear', 'MONDAY', S.lt), { type: 'fade', dur: 0.5 });
  shot(320.6, 'checkBox2', (ctx, S) => dayPanel(ctx, S.t, 2, 'rain', 'WEDNESDAY', S.lt), { type: 'whip', dur: 0.4 });
  shot(322.45, 'checkBox3', (ctx, S) => dayPanel(ctx, S.t, 3, 'leaves', 'SATURDAY', S.lt), { type: 'whip', dur: 0.4 });

  shot(324.4, 'wildRide', (ctx, S) => {
    const { t, lt } = S;
    const blinkT = wt('For a sign', 6);
    ctx.save();
    cam(ctx, { zoom: 1.35 + lt * 0.04, x: 180, y: 40 });
    RV.backyard(ctx, t, { day: 0 });
    const blink = t > blinkT && t < blinkT + 1.4 && Math.sin((t - blinkT) * 14) > 0;
    RV.drawBox(ctx, 1240, 880, { s: 0.85, t: blink ? 0.2 : 2.0, glow: blink ? 0.9 : 0, porthole: blink ? 1 : 0.1 });
    RV.KID_IDS.forEach((id, i) => {
      const x = 860 + i * 110;
      const excited = t > blinkT + 0.1;
      RV.drawKid(ctx, id, Object.assign({ x, y: 960, s: 0.85, t, turn: 0.8, look: [1, -0.2], eyes: excited ? 'wide' : 'open', mouth: excited ? 'o' : 'flat', open: 0.7, blink: RV.blink(t, i) },
        i === 1 ? { handR: [80, -230], holdR: (c, hp) => RV.torch(c, hp, -0.2, 1, 500) } : {}, excited ? { jump: Math.max(0, Math.sin((t - blinkT) * 8)) * 18 } : {}));
    });
    ctx.restore();
    if (t > blinkT + 0.1) RV.slam(ctx, '!!!', 1500, 260, 150, t - blinkT - 0.1, { gradient: ['#ffffff', '#ff4d6d'], dur: 2 });
  }, { type: 'black', dur: 0.5 });

  // ---- the fireside (a nod to the reference photo: green armchair, brown blanket, bookshelf)
  function fireside(ctx, t, o = {}) {
    RV.livingRoom(ctx, t, { fireX: 520, shelfX: 1480, warm: 1 });
    RV.armchair(ctx, 1080, 900, 0.9);
    RV.drawRustySleep(ctx, { x: 1080, y: 790, s: 0.95, t, mouth: 'smile' });
    // brown blanket
    ctx.beginPath();
    ctx.moveTo(900, 800); ctx.bezierCurveTo(960, 740, 1060, 820, 1140, 770); ctx.bezierCurveTo(1200, 740, 1290, 800, 1310, 850);
    ctx.lineTo(1250, 880); ctx.bezierCurveTo(1150, 850, 1020, 900, 900, 870); ctx.closePath();
    fs(ctx, '#6f4a3a', 5);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(980, 800); ctx.quadraticCurveTo(1010, 830, 990, 860); ctx.moveTo(1150, 790); ctx.quadraticCurveTo(1180, 820, 1160, 850); ctx.stroke();
    RV.armchair(ctx, 1080, 900, 0.9, true);
    if (o.zzz !== false) ['Z', 'z', 'Z'].forEach((z, i) => {
      const ph = RV.fract(t * 0.35 + i / 3);
      ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
      RV.bigText(ctx, z, 900 + Math.sin(ph * 6 + i) * 30 - ph * 60, 640 - ph * 240, 50 + i * 12, { fill: '#ffffff', shadow: false });
      ctx.restore();
    });
  }

  shot(330.0, 'sleepFire', (ctx, S) => {
    const { t, lt } = S;
    ctx.save();
    cam(ctx, { zoom: lerp(1.0, 1.35, ease.inOutSine(clamp(lt / S.d))), x: lerp(0, 130, ease.inOutSine(clamp(lt / S.d))), y: lerp(0, 60, clamp(lt / S.d)) });
    fireside(ctx, t);
    ctx.restore();
  }, { type: 'fade', dur: 1.0 });

  shot(335.1, 'dreaming', (ctx, S) => {
    const { t, lt, d } = S;
    const grow = ease.inOutCubic(clamp((lt - 0.2) / 2.2));
    const zoomIn = ease.inCubic(clamp((lt - 2.5) / (d - 2.5)));
    ctx.save();
    const bx = 760, by = 380;
    cam(ctx, { zoom: 1.35 + zoomIn * 6, x: lerp(130, bx - W / 2, zoomIn), y: lerp(60, by - H / 2, zoomIn) });
    fireside(ctx, t, { zzz: false });
    // dream bubble
    const r = 260 * grow;
    if (r > 1) {
      [[900, 640, 16], [860, 580, 24], [820, 500, 34]].forEach(([x, y, rr], i) => { if (grow > i * 0.2) { circle(ctx, x, y, rr * grow); fs(ctx, '#ffffff', 4); } });
      ctx.save();
      circle(ctx, bx, by, r); ctx.clip();
      RV.space(ctx, t, { planets: false });
      ctx.save(); ctx.translate(bx, by);
      RV.mirrorBall(ctx, -120, -80, 60, t);
      RV.clockFace(ctx, 130, -60, 50, t * 2);
      RV.planet(ctx, 120, 110, 44, { color: '#f4a261', ring: true });
      RV.drawBox(ctx, -80, 180, { s: 0.35, t, glow: 1, tilt: Math.sin(t * 2) * 0.3 });
      ctx.restore();
      ctx.restore();
      circle(ctx, bx, by, r); ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
    }
    ctx.restore();
  }, { type: 'cut' });

  // ============================================================ CHORUS 4 — the grand finale (a dream)
  const RAINBOW = { gradients: [['#fff3b0', '#ffd23f', '#ff4fa3'], ['#caffbf', '#06d6a0', '#4cc9f0'], ['#ffc2e2', '#ff4fa3', '#9b5de5'], ['#bdf0ff', '#4cc9f0', '#3a0ca3']], size: 140 };

  shot(338.76, 'c4_dream', (ctx, S) => {
    const { t } = S;
    RV.space(ctx, t, { drift: 30 });
    ctx.save(); ctx.globalAlpha = 0.25; RV.sunburst(ctx, W / 2, 1300, t, { colors: ['#ff4fa3', '#4cc9f0', '#ffd23f', '#06d6a0'], n: 24, speed: 0.3 }); ctx.restore();
    ctx.save();
    cam(ctx, { zoom: 1 + kick(t, 6) * 0.03 });
    // floating disco floor in space
    ctx.save(); ctx.translate(0, 60 + Math.sin(t * 1.2) * 8);
    RV.danceFloor(ctx, t, { y0: 800 });
    ctx.restore();
    RV.mirrorBall(ctx, 1600, 160, 90, t);
    dancerLine(ctx, t, 870, 0.62, [180, 1740], 'disco');
    [[80, 960], [1840, 960]].forEach(([x, y], i) => RV.worm(ctx, x, y, 0.9, { t: t + i, shades: true, color: i ? '#f9844a' : '#ff8fa3' }));
    RV.drawKids(ctx, t, [[420, 1060, 1.15], [1480, 1060, 1.1], [1720, 1060, 1.1]], (id, i) => Object.assign(RV.move(['wave', 'disco', 'cheer'][i], t, i), { mouth: 'grin', eyes: 'happy' }));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1060, s: 1.3, t, goggles: 1 }, RV.rustyMove('disco', t)));
    ctx.restore();
    RV.confetti(ctx, t, { rain: true, n: 70 });
    chorusSlam(ctx, t, 'chorus4', RAINBOW);
    RV.flash(ctx, clamp(1 - (t - 338.76) / 0.4));
  }, { type: 'zoom', dur: 0.5 });

  shot(344.6, 'c4_surf', (ctx, S) => {
    const { t } = S;
    RV.lightTunnel(ctx, t, { speed: 1.3 });
    // clocks & planets flying past
    for (let i = 0; i < 6; i++) {
      const z = RV.fract(i / 6 + t * 0.35);
      const a = i * 1.1, rr = 100 + z * z * 1300;
      const x = W / 2 + Math.cos(a) * rr, y = H / 2 + Math.sin(a) * rr * 0.7;
      if (i % 2) RV.clockFace(ctx, x, y, 20 + z * 90, t * 3 + i); else RV.planet(ctx, x, y, 20 + z * 80, { color: RV.PALETTE[i], ring: i === 2 });
    }
    const bob = Math.sin(t * 2.2) * 30;
    ctx.save(); ctx.translate(W / 2, H / 2 + 80 + bob); ctx.rotate(Math.sin(t * 1.5) * 0.12);
    // the spacetime box as a surfboard
    ctx.save(); ctx.rotate(Math.PI / 2 - 0.08); RV.drawBox(ctx, 0, 180, { s: 0.55, t, glow: 1.3 }); ctx.restore();
    RV.drawRusty(ctx, Object.assign({ x: 60, y: -20, s: 0.95, t, goggles: 2 }, RV.rustyMove('wave', t)));
    RV.drawKid(ctx, 'big', Object.assign(RV.move('cheer', t, 0), { x: -330, y: -10, s: 0.8, t, jump: 0 }));
    RV.drawKid(ctx, 'boy', Object.assign(RV.move('cheer', t, 1), { x: -180, y: -15, s: 0.8, t, jump: 0 }));
    RV.drawKid(ctx, 'little', Object.assign(RV.move('cheer', t, 2), { x: 300, y: -15, s: 0.8, t, jump: 0 }));
    ctx.restore();
    chorusSlam(ctx, t, 'chorus4', RAINBOW);
  }, { type: 'whip', dur: 0.45 });

  shot(348.0, 'c4_finale', (ctx, S) => {
    const { t, lt } = S;
    RV.radialBg(ctx, '#3a0ca3', '#10002b');
    ctx.save(); ctx.globalAlpha = 0.45; RV.sunburst(ctx, W / 2, 620, t, { colors: ['#ff4fa3', '#4cc9f0', '#ffd23f', '#06d6a0', '#b388eb'], n: 30, speed: 0.4 }); ctx.restore();
    RV.stars(ctx, t, { n: 90, y1: H });
    RV.fireworks(ctx, t, [[348.3, 300, 250, '#ff4fa3'], [348.9, 1600, 230, '#4cc9f0'], [349.6, 700, 170, '#ffd23f'], [350.3, 1250, 280, '#06d6a0'], [350.9, 420, 200, '#b388eb'], [351.2, 1500, 160, '#ff9f1c']]);
    ctx.save();
    cam(ctx, { zoom: 1 + kick(t, 6) * 0.03 });
    [[140, 1060], [1780, 1060]].forEach(([x, y], i) => RV.drawKid(ctx, DANCERS[i + 1], Object.assign(RV.move('wave', t, i), { x, y, s: 0.85, t, mouth: 'grin' })));
    RV.drawKids(ctx, t, [[430, 1080, 1.15], [1490, 1080, 1.1], [1730, 1080, 1.1]], (id, i) => Object.assign(RV.move('cheer', t, i * 0.2), {}));
    RV.drawRusty(ctx, Object.assign({ x: 960, y: 1080, s: 1.35, t }, RV.rustyMove('cheer', t)));
    ctx.restore();
    RV.letters(ctx, 'RUSTY THE DOG!', W / 2, 250, 170, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], shine: true }, (i) => ({ s: RV.pop(lt - 0.1 - i * 0.04), dy: Math.sin(t * 6 + i * 0.6) * 14, r: Math.sin(t * 4 + i) * 0.05 }));
    RV.confetti(ctx, t, { rain: true, n: 90 });
  }, { type: 'star', dur: 0.6 });

  // ============================================================ OUTRO
  shot(351.62, 'outroFire', (ctx, S) => {
    const { t, lt, d } = S;
    const pull = ease.inOutSine(clamp(lt / d));
    ctx.save();
    cam(ctx, { zoom: lerp(1.35, 1.0, pull), x: lerp(130, 0, pull), y: lerp(60, 0, pull) });
    fireside(ctx, t);
    // the kids tiptoe in and snuggle up beside him
    RV.KID_IDS.forEach((id, i) => {
      const arrive = ease.inOutQuad(clamp((lt - 1.0 - i * 0.6) / 2.2));
      const x = lerp(-200 - i * 150, 1500 + i * 130 - 0 * i, arrive);
      const settled = arrive >= 1;
      const pose = settled
        ? { x: 1500 + i * 130, y: 1000, s: 0.85, t, bob: (RV.KIDS[id].thigh + RV.KIDS[id].shin) * 0.55, eyes: lt > 6 + i ? 'closed' : 'happy', mouth: 'smile', headTilt: -0.25, armL: [0.6, -1.4], armR: [0.6, -1.4], blink: 0 }
        : Object.assign(RV.move('walk', t * 0.7, i, 0.5), { x, y: 1000, s: 0.85, t, turn: 0.7, eyes: 'happy', mouth: 'smile', lean: 0.1, armL: [1.2, -1.6], armR: [1.2, -1.6] });
      RV.drawKid(ctx, id, pose);
    });
    ctx.restore();
    // the lights dim
    ctx.fillStyle = `rgba(10,5,20,${0.35 * pull})`; ctx.fillRect(0, 0, W, H);
  }, { type: 'fade', dur: 1.2 });

  shot(363.8, 'outroYard', (ctx, S) => {
    const { t, lt } = S;
    const goT = 368.4;
    ctx.save();
    cam(ctx, { zoom: 1.0, y: -ease.inOutSine(clamp((t - goT) / 3)) * 280 });
    RV.backyard(ctx, t, { day: 0 });
    // extra sky for the tilt up
    ctx.fillStyle = '#0b1030'; ctx.fillRect(-200, -700, W + 400, 700);
    RV.stars(ctx, t, { n: 90, y0: -700, y1: 0, seed: 31 });
    const glowUp = clamp((t - 365.2) / 2.5);
    if (t < goT) RV.drawBox(ctx, 1240, 880, { s: 0.85, t, glow: glowUp * 1.3, porthole: glowUp, shake: glowUp * 4 });
    else {
      const p = clamp((t - goT) / 1.2);
      const y = lerp(880, -900, ease.inCubic(p));
      RV.drawBox(ctx, 1240, y, { s: 0.85 * (1 - p * 0.6), t, glow: 1.4 });
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) glow(ctx, 1240 + Math.sin(t * 20 + i) * 10, y + 40 + i * 60, 60, '#bdf0ff', 0.6 * (1 - p));
      ctx.restore();
      RV.sparkleField(ctx, t, { n: 20, x0: 1100, x1: 1380, y0: y, y1: 900, size: 26, seed: 8 });
    }
    ctx.restore();
    if (t > goT) RV.slam(ctx, 'WHOOSH!', 700, 300, 110, t - goT, { gradient: ['#ffffff', '#bdf0ff', '#4cc9f0'], dur: 2.5, burst: false });
    void lt;
  }, { type: 'fade', dur: 1.5 });

  // closing card: the Rusty constellation returns
  const CONST = [[-150, -30], [-110, -130], [-40, -165], [40, -165], [110, -130], [150, -30], [95, 25], [45, 95], [0, 115], [-45, 95], [-95, 25]];
  const CONST_LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 1]];
  shot(371.5, 'theEnd', (ctx, S) => {
    const { t, lt } = S;
    RV.skyGradient(ctx, ['#05071c', '#0b1030', '#1d2560']);
    RV.stars(ctx, t, { n: 200, y1: H, seed: 12 });
    ctx.save();
    ctx.translate(W / 2, 380); ctx.scale(1.6, 1.6);
    ctx.globalCompositeOperation = 'lighter';
    CONST_LINES.forEach(([a, b], i) => {
      const p = clamp((lt - 0.2 - i * 0.12) / 0.3);
      if (p <= 0) return;
      ctx.beginPath(); ctx.moveTo(CONST[a][0], CONST[a][1]); ctx.lineTo(lerp(CONST[a][0], CONST[b][0], p), lerp(CONST[a][1], CONST[b][1], p));
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(180,220,255,0.6)'; ctx.stroke();
    });
    CONST.concat([[-45, -40], [45, -40], [0, 40]]).forEach(([x, y], i) => {
      glow(ctx, x, y, 34, '#bde0ff', 0.9 * (0.7 + 0.3 * Math.sin(t * 4 + i)));
      RV.sparkle(ctx, x, y, 16, '#ffffff');
    });
    ctx.restore();
    RV.letters(ctx, 'THE END?', W / 2, 760, 150, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], shine: true }, (i) => ({ s: RV.pop(lt - 1.2 - i * 0.07), dy: Math.sin(t * 3 + i * 0.6) * 10 }));
    // Rusty pops up for a wink + woof on the last "Rusty the dog"
    const up = ease.outBack(clamp((t - 374.6) / 0.6), 1.6);
    if (up > 0) {
      ctx.save(); ctx.translate(1580, lerp(1400, 980, up)); ctx.rotate(-0.15); ctx.scale(1.5, 1.5);
      const wink = t > 375.6 && t < 376.4;
      RV.rustyHead(ctx, { t, eyes: 'open', blink: 0, mouth: t > 375.6 ? 'open' : 'tongue', open: 0.8, earFlip: 'R', headTilt: -0.1, goggles: 1 });
      if (wink) { ctx.fillStyle = RV.RUSTY.FUR; ellipse(ctx, 27, -10, 17, 17); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, -8); ctx.quadraticCurveTo(27, 0, 39, -8); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(); }
      ctx.restore();
      if (t > 375.6) RV.slam(ctx, 'WOOF!', 1290, 960, 90, t - 375.6, { gradient: ['#ffffff', '#ffd23f'], dur: 3, burst: false });
    }
  }, { type: 'fade', dur: 1.2 });

  void talkMouth; void circle;
})(globalThis.RV);
