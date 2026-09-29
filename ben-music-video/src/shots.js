/* The storyboard, part 1 (0-4.8 s). Each shot: shot(startTime, name, draw(ctx, S), transition).
 * S = { t, lt, d, p }. Times come from the word timings in src/timing.js (RV.BENS = every sung "Ben").
 * The camera is RV.snapCam: each framing is snapped to with an overshoot, so every hit is a crash
 * zoom or a whip pan, with a kick-drum pulse on top.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ease, circle, ellipse, fs, rrect, hash, glow } = RV;
  const W = RV.W, H = RV.H, OUT = RV.OUT;
  const SH = [];
  const shot = (t0, name, draw, trans, extra) => SH.push(Object.assign({ t0, name, draw, trans }, extra || {}));
  const CUT = { type: 'cut' };
  const since = (t, a) => t - a;
  const decay = (t, a, k = 8) => (t < a ? 0 : Math.exp(-(t - a) * k));

  // ------------------------------------------------------------ cast helpers
  // Ben sings every word (lip-sync from the vocal level); p overrides anything
  function ben(ctx, t, p = {}) {
    const pose = Object.assign({ t, eyes: 'open', blink: RV.blink(t, 5) }, RV.benMouth(t, p.rest || 'grin', p.gain || 1), p);
    if (!p.noShadow) RV.shadow(ctx, pose.x || 0, (pose.y || 0) + 4, 82 * (pose.s || 1), 0.22);
    return RV.drawKid(ctx, 'ben', pose);
  }
  function cousin(ctx, id, t, p = {}) {
    const pose = Object.assign({ t, eyes: 'open', mouth: 'flat', blink: RV.blink(t, id.length * 1.7) }, p);
    if (!p.noShadow) RV.shadow(ctx, pose.x || 0, (pose.y || 0) + 4, 70 * (pose.s || 1), 0.22);
    return RV.drawKid(ctx, id, pose);
  }
  function rusty(ctx, t, p = {}) {
    const pose = Object.assign({ t, blink: RV.blink(t, 9), mouth: 'closed', eyes: 'open', wag: 0.4 }, p);
    if (!p.noShadow) RV.shadow(ctx, pose.x || 0, (pose.y || 0) + 4, 86 * (pose.s || 1), 0.22);
    RV.drawRusty(ctx, pose);
  }
  // head turn + eye direction toward a point (from a character standing at x)
  const lookAt = (x, tx, dy = 0, k = 520) => { const u = clamp((tx - x) / k, -1, 1); return { turn: u * 0.55, look: [u, dy] }; };
  // the little one's ice cream (held up in her right hand)
  const cone = (scoop = 1) => (ctx, h) => RV.iceCream(ctx, h[0] + 4, h[1] - 6, 0.9, scoop, 0.15);

  function bush(ctx, x, y, s = 1) {
    [[0, 0, 60], [-50, 10, 44], [50, 12, 46]].forEach(([dx, dy, r]) => { circle(ctx, x + dx * s, y + (dy - 30) * s, r * s); fs(ctx, '#55a630', 4.5); });
  }
  // the backyard from the Rusty video, with the lawn carried on past the old set edges
  function yard(ctx, t) {
    RV.backyard(ctx, t, { day: 1 });
    ctx.fillStyle = '#80b918';
    ctx.fillRect(-2400, 840, 2204, 1600); ctx.fillRect(W + 196, 840, 2400, 1600); ctx.fillRect(-2400, 1236, W + 4800, 1600);
    ctx.beginPath(); ctx.moveTo(-2400, 840); ctx.lineTo(-200, 840); ctx.moveTo(W + 200, 840); ctx.lineTo(W + 2400, 840);
    ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
  }
  // "BEN!" slam near a pop; k picks the colour
  const GRADS = [['#fff3b0', '#ffd23f', '#ff9f1c'], ['#caffbf', '#06d6a0', '#118ab2'], ['#ffc2e2', '#ff4fa3', '#9b5de5'], ['#bdf0ff', '#4cc9f0', '#3a0ca3']];
  function benSlam(ctx, t, at, x, y, k, o = {}) {
    RV.slam(ctx, o.text || 'BEN!', x, y, o.size || 150, t - at, Object.assign({ rot: k % 2 ? 0.08 : -0.08, gradient: GRADS[k % 4], dur: o.dur || 0.6, burstC: o.burstC || '#ffffff' }, o));
  }
  // horizontal whoosh lines while the camera whips
  function whipLines(ctx, t, a) {
    if (a <= 0.02) return;
    ctx.save(); ctx.globalAlpha = a;
    RV.hSpeedLines(ctx, t, { n: 34, speed: 5, color: 'rgba(255,255,255,0.75)' });
    ctx.restore();
  }

  // ============================================================ 0.00  I'M BEN! BEN! BEN! BEN!
  // The cousins are having a nice quiet ice cream in the backyard. Ben pops up behind the bush,
  // in the window, out of the lawn, then upside-down from a branch, and the camera whips to each.
  const YP = { big: 560, boy: 760, little: 940, rusty: 1110, y: 985 };
  const POPS = [0.17, 0.45, 0.74, 1.02];
  shot(0, 'yardPops', (ctx, S) => {
    const { t } = S;
    const k = POPS.reduce((n, a, i) => (t >= a ? i : n), -1);
    const lt = k >= 0 ? t - POPS[k] : 0;
    ctx.save();
    const cam = RV.snapCam(ctx, t, [
      { t: 0, z: 1.02, x: 960, y: 560, push: 0.35 },
      { t: 0.17, z: 1.55, x: 1260, y: 620, r: 0.05, shake: 14 },
      { t: 0.45, z: 2.05, x: 290, y: 430, r: -0.06, shake: 14, d: 0.1 },
      { t: 0.74, z: 1.3, x: 830, y: 700, r: 0.04, shake: 18 },
      { t: 1.02, z: 1.95, x: 650, y: 520, r: -0.07, shake: 16 },
    ]);
    yard(ctx, t);
    // branch poking in from the top for the upside-down hang
    ctx.beginPath(); ctx.moveTo(-100, 40); ctx.bezierCurveTo(300, 60, 500, 150, 860, 150);
    ctx.lineWidth = 46; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 36; ctx.strokeStyle = '#7b5436'; ctx.stroke();
    [[120, 20, 70], [300, 60, 60], [520, 110, 56], [800, 120, 50], [700, 170, 40]].forEach(([x, y, r], i) => { circle(ctx, x, y, r); fs(ctx, i % 2 ? '#6cc56b' : '#4caf50', 4.5); });

    // pop 1: behind the right-hand bush
    if (k === 0) {
      const up = ease.outBack(clamp(lt / 0.1), 2);
      ben(ctx, t, { x: 1350, y: 900 + (1 - up) * 330, s: 0.95, armL: [2.7, 0.1], armR: [2.7, 0.1], eyes: 'happy', noShadow: true });
      bush(ctx, 1350, 880, 1.25);
    } else bush(ctx, 1350, 880, 1.25);
    // pop 2: out of the kitchen window (clipped to the window)
    if (k === 1) {
      const up = ease.outBack(clamp(lt / 0.1), 2);
      ctx.save(); rrect(ctx, 82, 302, 196, 166, 8); ctx.clip();
      ctx.fillStyle = '#bde0fe'; ctx.fillRect(80, 300, 200, 170);
      ben(ctx, t, { x: 180, y: 700 + (1 - up) * 300, s: 0.9, armL: [2.3, 0.6], armR: [2.3, 0.6], handL_shape: 'open', handR_shape: 'open', noShadow: true });
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(180, 300); ctx.lineTo(180, 470); ctx.moveTo(80, 385); ctx.lineTo(280, 385);
      ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
      rrect(ctx, 80, 300, 200, 170, 8); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    }
    // cousins (+ Rusty) watching
    const benX = [1350, 180, 830, 650][Math.max(0, k)];
    const benY = [-0.5, -0.8, 0.5, -0.8][Math.max(0, k)];
    const jolt = k >= 0 ? 34 * decay(t, POPS[k], 9) : 0;
    const calm = k < 0;
    const face = (id, lvl) => {
      if (calm) return { eyes: id === 'little' ? 'happy' : 'open', mouth: 'smile' };
      const L = lookAt(YP[id], benX, benY, 420);
      if (lvl === 3) return Object.assign(L, id === 'big' ? { eyes: 'dots', mouth: 'flat', look: [0, -1] } : id === 'boy' ? { eyes: 'wide', mouth: 'grimace', sweat: 1, brow: 1 } : { eyes: 'wide', mouth: 'o', open: 0.5, gloom: 0.8 });
      return Object.assign(L, { eyes: 'wide', mouth: lvl === 0 ? 'o' : lvl === 1 ? 'wavy' : 'grimace', open: 0.7, brow: 0.9, browAng: 0.4 });
    };
    cousin(ctx, 'big', t, Object.assign({ x: YP.big, y: YP.y, jump: jolt, armL: [0.25, 0.2], armR: [0.25, 0.2], lean: k === 3 ? -0.1 : 0 }, face('big', k)));
    cousin(ctx, 'boy', t, Object.assign({ x: YP.boy, y: YP.y, jump: jolt * 0.8, armL: [0.3, 0.3], armR: [0.3, 0.3] }, face('boy', k)));
    cousin(ctx, 'little', t, Object.assign({ x: YP.little, y: YP.y, jump: jolt * 1.1, armL: [0.3, 0.2], armR: [0.9, 1.9], holdR: cone(1) }, face('little', k)));
    rusty(ctx, t, { x: YP.rusty, y: YP.y, s: 0.72, headTilt: calm ? 0.1 : [-0.4, 0.4, 0.2, -0.3][k], earFlip: calm ? null : 'R', jump: jolt, wag: calm ? 0.6 : 0 });
    // pop 3: out of the lawn in front of everyone
    if (k === 2) {
      const up = ease.outBack(clamp(lt / 0.1), 2);
      ellipse(ctx, 830, 1075, 150, 34); fs(ctx, '#5a3b22', 5);
      ctx.save(); ctx.beginPath(); ctx.rect(-500, -500, 3000, 1575); ctx.clip();
      ben(ctx, t, { x: 830, y: 1075 + (1 - up) * 400, s: 1.0, armL: [2.2, 0.8], armR: [2.2, 0.8], handL_shape: 'open', handR_shape: 'open', eyes: 'happy', noShadow: true });
      ctx.restore();
      ellipse(ctx, 830, 1082, 150, 22); ctx.fillStyle = '#80b918'; ctx.fill();
      ctx.save(); ctx.translate(830, 1060); ctx.scale(0.65, 0.55); RV.dust(ctx, 0, 0, lt, { color: '#8a5a33', n: 12 }); ctx.restore();
    }
    // pop 4: upside-down from the branch, nose to nose with the big sister
    if (k === 3) {
      const drop = ease.outBack(clamp(lt / 0.12), 1.8);
      ctx.save(); ctx.translate(650, 150 + drop * 20); ctx.rotate(Math.PI + Math.sin(t * 14) * 0.04);
      ben(ctx, t, { x: 0, y: -40 + (1 - drop) * 380, s: 0.95, armL: [2.9, 0.05], armR: [2.9, 0.05], footL: [10, 0], footR: [-10, 0], eyes: 'open', noShadow: true });
      ctx.restore();
    }
    // slams in world space so the crash zoom carries them
    if (k === 0) benSlam(ctx, t, POPS[0], 1090, 420, 0, { size: 100, burstR: 1.25 });
    if (k === 1) benSlam(ctx, t, POPS[1], 430, 290, 1, { size: 80, burstR: 1.25 });
    if (k === 2) benSlam(ctx, t, POPS[2], 1130, 420, 2, { size: 100, burstR: 1.25 });
    if (k === 3) benSlam(ctx, t, POPS[3], 930, 300, 3, { size: 84, burstR: 1.25 });
    ctx.restore();
    whipLines(ctx, t, cam.snap ? 0.9 : 0);
    // "I'M" before the first Ben
    if (t < 0.2) RV.wordPop(ctx, "I'M", W / 2, 200, 130, t - 0.02, { fill: '#ffffff', life: 0.18 });
  }, CUT);

  // ============================================================ 1.20  I'm Ben I'm Ben I'm Ben I'm Ben
  // Pop-art grid that doubles on every "Ben": 1 -> 2 -> 4 -> 8 -> 16 Bens. One panel is the cousins.
  const GRID_T = [1.2, 1.44, 1.72, 2.0, 2.28];
  const GRID_L = [[1, 1], [2, 1], [2, 2], [4, 2], [4, 4]];
  const POPC = [['#ff4fa3', '#ffd23f'], ['#4cc9f0', '#ff4fa3'], ['#ffd23f', '#06d6a0'], ['#b388eb', '#ff9f1c'], ['#06d6a0', '#4cc9f0'], ['#ff9f1c', '#b388eb']];
  const FACES = [{ eyes: 'happy' }, { eyes: 'open' }, { eyes: 'wide' }, { eyes: 'squeeze' }];
  shot(1.2, 'popGrid', (ctx, S) => {
    const { t } = S;
    const k = GRID_T.reduce((n, a, i) => (t >= a ? i : n), 0);
    const [cols, rows] = GRID_L[k];
    const pw = W / cols, ph = H / rows;
    const punch = 1 + 0.14 * decay(t, GRID_T[k], 12);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate((k % 2 ? 1 : -1) * 0.03 * (1 - decay(t, GRID_T[k], 6))); ctx.scale(punch * 1.04, punch * 1.04); ctx.translate(-W / 2, -H / 2);
    const cousinsCell = k === 3 ? 6 : k === 4 ? 9 : -1;
    for (let i = 0; i < cols * rows; i++) {
      const gx = (i % cols) * pw, gy = Math.floor(i / cols) * ph;
      const c = POPC[(i * 5 + k * 3) % POPC.length];
      ctx.save();
      ctx.beginPath(); ctx.rect(gx, gy, pw, ph); ctx.clip();
      RV.halftone(ctx, gx, gy, pw, ph, c[1], c[0], Math.max(18, 34 - k * 4));
      const s = (ph * 0.78) / 215;
      const b = RV.bounce(t, 1, i * 0.25);
      const newPanel = i >= (k > 0 ? GRID_L[k - 1][0] * GRID_L[k - 1][1] : 0);
      const pp = newPanel ? ease.outBack(clamp((t - GRID_T[k]) / 0.12), 2.2) : 1;
      if (i === cousinsCell) {
        const hs = s * 0.62;
        [['big', -0.32, { eyes: 'dots', mouth: 'flat' }], ['boy', 0, { eyes: 'open', lid: 0.5, mouth: 'wavy', sweat: 1 }], ['little', 0.32, { eyes: 'wide', mouth: 'o', open: 0.5, gloom: 0.9 }]].forEach(([id, dx, f]) => {
          RV.drawKidHead(ctx, id, Object.assign({ x: gx + pw / 2 + dx * pw, y: gy + ph * 0.56, s: hs * pp, t, blink: 0 }, f));
        });
        RV.bigText(ctx, '?!', gx + pw * 0.85, gy + ph * 0.2, ph * 0.22, { fill: '#ffffff' });
      } else {
        const f = FACES[(i + k) % FACES.length];
        const sing = RV.benMouth(t);
        RV.drawKidHead(ctx, 'ben', Object.assign({ x: gx + pw / 2, y: gy + ph * 0.52 - b * ph * 0.05, s: s * pp, t, face: (i + k) % 3 === 2 ? -1 : 1,
          headTilt: Math.sin(RV.beat(t) * Math.PI / 2 + i) * 0.16, blush: 0.85 }, sing, f));
      }
      ctx.restore();
    }
    ctx.lineWidth = 12; ctx.strokeStyle = OUT;
    ctx.beginPath();
    for (let c = 1; c < cols; c++) { ctx.moveTo(c * pw, -20); ctx.lineTo(c * pw, H + 20); }
    for (let r = 1; r < rows; r++) { ctx.moveTo(-20, r * ph); ctx.lineTo(W + 20, r * ph); }
    ctx.stroke();
    ctx.restore();
    const hit = RV.lastBen(t, 1.3, 2.4);
    if (hit != null) benSlam(ctx, t, hit, W / 2, H / 2, RV.benIndex(t, 1.3, 2.4), { text: "I'M BEN!", size: 150, dur: 0.26 });
  }, { type: 'flash', dur: 0.12, pre: 0 });

  // ============================================================ 2.42  And when I'm done I'll go again
  // The street. Ben sprints in, stops dead in front of the cousins ("done"), then laps the block so fast
  // he comes straight back in from the left. The cousins' heads swing like a tennis match.
  const ST = { big: 760, boy: 940, little: 1110, rusty: 1280, y: 912 };
  function streetBenX(t) {
    if (t < 2.82) return lerp(-260, 930, ease.outQuad(clamp((t - 2.42) / 0.4)));
    if (t < 2.94) return 930;
    if (t < 3.2) return lerp(930, 2500, ease.inCubic(clamp((t - 2.94) / 0.26)));
    return lerp(-500, 2500, clamp((t - 3.2) / 0.3));
  }
  shot(2.42, 'street', (ctx, S) => {
    const { t } = S;
    const bx = streetBenX(t), bxPrev = streetBenX(t - 1 / 30);
    const speed = Math.abs(bx - bxPrev) * 30;
    ctx.save();
    const cam = RV.snapCam(ctx, t, [
      { t: 2.42, z: 1.25, x: 700, y: 640, r: 0.03 },
      { t: 2.6, z: 1.15, x: 900, y: 640, r: -0.02, d: 0.25, back: 1 },
      { t: 2.82, z: 1.6, x: 930, y: 600, r: 0.05, shake: 12 },
      { t: 2.94, z: 1.2, x: 1260, y: 620, r: -0.04, d: 0.16 },
      { t: 3.2, z: 1.0, x: 900, y: 560, r: 0.02, d: 0.1 },
      { t: 3.36, z: 1.08, x: 1180, y: 580, r: -0.03, d: 0.12 },
    ]);
    RV.dayStreet(ctx, t, 0);
    const near = (x) => clamp(1 - Math.abs(bx - x) / 420);
    const gust = (x) => near(x) * clamp(speed / 3000);
    const lvl = t < 2.82 ? 0 : t < 3.2 ? 1 : 2;
    const cousinFace = (id) => {
      const L = lookAt(ST[id], bx, 0.1, 360);
      if (lvl === 0) return Object.assign(L, { eyes: 'wide', mouth: 'o', open: 0.5 });
      if (lvl === 1) return Object.assign(L, id === 'big' ? { eyes: 'open', lid: 0.5, mouth: 'flat', browR: 1.2 } : { eyes: 'wide', mouth: 'wavy', brow: 0.8 });
      return Object.assign(L, id === 'little' ? { eyes: 'spiral', mouth: 'wavy' } : { eyes: 'dots', mouth: 'flat' });
    };
    ['big', 'boy', 'little'].forEach((id) => {
      const g = gust(ST[id]);
      cousin(ctx, id, t, Object.assign({ x: ST[id], y: ST.y, s: 0.9, lean: -g * 0.22 * Math.sign(bx - bxPrev || 1), sway: g * 3,
        armL: [0.25 + g, 0.2], armR: id === 'little' ? [0.9, 1.9] : [0.25 + g, 0.2], holdR: id === 'little' ? cone(1) : null }, cousinFace(id)));
    });
    rusty(ctx, t, Object.assign({ x: ST.rusty, y: ST.y, s: 0.66, earFlip: gust(ST.rusty) > 0.2 ? 'L' : 'R', wag: 0 }, { headTilt: clamp((bx - ST.rusty) / 900, -0.5, 0.5) }));
    // Ben on the road in front of them
    const running = !(t >= 2.82 && t < 2.94);
    const by = 1050;
    const blur = clamp(speed / 5000);
    if (running) {
      for (let g = 3; g >= 1; g--) {
        const gx = streetBenX(t - g * 0.018);
        ctx.save(); ctx.globalAlpha = 0.18 * blur * (4 - g);
        ben(ctx, t, runPose(t, gx, by, 1.0));
        ctx.restore();
      }
      ben(ctx, t, runPose(t, bx, by, 1.0));
      RV.dust(ctx, bx - 120, by, (t * 7) % 0.6, { n: 6, color: '#e9e3d0' });
    } else {
      const sk = t - 2.82;
      ben(ctx, t, { x: bx, y: by, s: 1.0, lean: -0.18 * decay(t, 2.82, 10), armL: [1.4, 0.3], armR: [2.5, 0.2], handR_shape: 'open', eyes: 'happy' });
      RV.dust(ctx, bx - 60, by, sk, { n: 10, color: '#e9e3d0' });
    }
    // lyric words dropped along his path
    [['AND', 2.44], ['WHEN', 2.52], ["I'M", 2.68]].forEach(([w, at], i) => {
      RV.wordPop(ctx, w, streetBenX(at) + 40, 400 - i * 20, 84, t - at, { fill: '#ffffff', rot: -0.1 + i * 0.08, life: 0.3 });
    });
    if (t >= 2.82 && t < 2.98) RV.wordPop(ctx, 'DONE!', 1190, 470, 120, t - 2.82, { gradient: GRADS[0], rot: 0.08 });
    ctx.restore();
    whipLines(ctx, t, clamp(speed / 6000) * 0.8 + (cam.snap ? 0.4 : 0));
    if (t >= 2.94) {
      const lt = t - 2.94;
      RV.letters(ctx, "I'LL GO AGAIN!", W / 2, 150, 124, { gradient: GRADS[t < 3.24 ? 1 : 2] }, (i, n) => {
        const a = lt - i * 0.022;
        return { s: ease.outBack(clamp(a / 0.12), 2.4), dy: Math.sin(t * 18 + i) * 6, r: Math.sin(t * 9 + i) * 0.08 };
      });
    }
  }, { type: 'whip', dur: 0.2, dir: 1 });

  // a cartoon sprint (3/4 view, leaning in, legs a blur)
  function runPose(t, x, y, s) {
    const ph = t * 26;
    return {
      x, y, s, turn: 0.75, lean: 0.28, bob: Math.abs(Math.sin(ph)) * 10,
      footL: [Math.sin(ph) * 50, Math.max(0, Math.sin(ph)) * 60], footR: [-Math.sin(ph) * 50, Math.max(0, -Math.sin(ph)) * 60],
      armL: [0.9 + Math.sin(ph) * 0.8, -1.2], armR: [0.9 - Math.sin(ph) * 0.8, -1.2], eyes: 'happy', hairWind: -0.12,
    };
  }
  RV._runPose = runPose;

  // ============================================================ 3.58  'Cause I'm Ben, yes I'm Ben
  // Hero shot: skid to a stop in front of a spinning sunburst, fists on hips, then thumbs at himself,
  // then both arms up. Three crash zooms. The cousins pop up in the corners to side-eye it.
  shot(3.58, 'hero', (ctx, S) => {
    const { t } = S;
    ctx.save();
    const cam = RV.snapCam(ctx, t, [
      { t: 3.58, z: 1.0, x: 960, y: 560, r: -0.04, shake: 20 },
      { t: 4.0, z: 1.4, x: 960, y: 640, r: 0.05, shake: 12 },
      { t: 4.26, z: 2.0, x: 960, y: 600, r: -0.06, shake: 10 },
      { t: 4.58, z: 1.08, x: 960, y: 580, r: 0.03, shake: 22, d: 0.14 },
    ], { pulse: 0.03 });
    const burst = t < 4.26 ? ['#ff5d5d', '#ffd23f', '#ff9f1c'] : t < 4.58 ? ['#4cc9f0', '#ffffff', '#9be7ff'] : ['#ff4fa3', '#ffd23f', '#ff8fc7'];
    ctx.fillStyle = burst[2]; ctx.fillRect(-W, -H, W * 3, H * 3);
    RV.sunburst(ctx, 960, 560, t, { n: 22, colors: burst.slice(0, 2), speed: 1.2 });
    glow(ctx, 960, 560, 650, '#ffffff', 0.4);
    // a little round stage
    ellipse(ctx, 960, 1110, 640, 120); fs(ctx, '#3a0ca3', 6);
    ellipse(ctx, 960, 1092, 600, 100); fs(ctx, '#7b2ff7', 5);
    ellipse(ctx, 960, 1086, 470, 74); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
    const land = t < 3.7 ? ease.outBack(clamp((t - 3.58) / 0.12), 2) : 1;
    let pose;
    if (t < 3.7) pose = { lean: -0.2, armL: [1.5, 0.4], armR: [1.5, 0.4], eyes: 'wide', squash: 1 - 0.15 * (1 - land) };
    else if (t < 4.26) pose = { armL: [0.8, -1.9], armR: [0.8, -1.9], eyes: 'happy', bob: 6 * RV.pulse(t, 6) };
    else if (t < 4.58) {
      const hy = -RV.kidHeight('ben') * 0.5;
      pose = { handL: [-26, hy], handR: [26, hy], handL_shape: 'point', handR_shape: 'point', eyes: 'open', brow: 0.6 };
    } else pose = { armL: [2.7, 0.1], armR: [2.7, 0.1], eyes: 'happy', jump: 40 * Math.sin(clamp((t - 4.58) / 0.2) * Math.PI) };
    ben(ctx, t, Object.assign({ x: 960, y: 1085 - (1 - land) * 60, s: 1.5 }, pose));
    if (t >= 3.58 && t < 3.8) RV.dust(ctx, 960, 1085, t - 3.58, { n: 14, color: '#fff3d6' });
    ctx.restore();
    if (t >= 4.0 && t < 4.26) benSlam(ctx, t, 4.0, 960, 150, 0, { text: "I'M BEN!", size: 124 });
    if (t >= 4.26 && t < 4.58) RV.wordPop(ctx, 'YES!', 1480, 300, 130, t - 4.26, { gradient: GRADS[3], rot: 0.12 });
    if (t >= 4.58) {
      RV.confetti(ctx, t, { t0: 4.58, x: W / 2, y: 700, n: 90, spread: 2.8 });
      benSlam(ctx, t, 4.58, W / 2, 160, 2, { text: 'YES I\'M BEN!', size: 118, dur: 0.5 });
    }
    // cousins peeking up from the bottom corners, screen space (unaffected by the zooms)
    const peekL = ease.outBack(clamp((t - 4.1) / 0.14), 1.8), peekR = ease.outBack(clamp((t - 4.3) / 0.14), 1.8);
    if (peekL > 0) RV.drawKidHead(ctx, 'big', { x: 190, y: H + 160 - peekL * 330, s: 1.7, t, eyes: 'open', lid: 0.55, mouth: 'flat', browR: 1.3, look: [0.9, -0.4], turn: 0.3 });
    if (peekR > 0) RV.drawKidHead(ctx, 'boy', { x: W - 190, y: H + 150 - peekR * 320, s: 1.7, t, eyes: 'dots', mouth: 'wavy', sweat: 1, look: [-0.9, -0.4], turn: -0.3 });
    const peekC = ease.outBack(clamp((t - 4.6) / 0.14), 1.8);
    if (peekC > 0) RV.drawKidHead(ctx, 'little', { x: 470, y: H + 150 - peekC * 250, s: 1.3, t, eyes: 'wide', mouth: 'o', open: 0.5, gloom: 0.7, look: [0.6, -0.6] });
    RV.zoomLines(ctx, t, cam.snap ? 0.8 : 0);
  }, { type: 'flash', dur: 0.14, pre: 0 });

  RV._shotList = SH;
  RV._shotHelpers = { shot, CUT, ben, cousin, rusty, lookAt, cone, bush, yard, benSlam, whipLines, GRADS, decay, since, runPose };
})(globalThis.RV);
