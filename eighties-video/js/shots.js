/* Shots: the choreography. Each shot draws the world for its time range, synced to beats and sung words. */
(function () {
  'use strict';
  const V = window.V, M = V.M, E = V.E, R = V.R, Rn = V.Rn, St = V.St, Tx = V.Tx, Bg = V.Bg, Sh = V.Sh, Mat = V.Mat, T = V.T;
  const C = Sh.C, hex = M.hex;
  const Shots = (V.Shots = { list: [], rewinds: [] });
  let D, H, SH;

  // ================================================================ shared pieces
  const PAPER = [0.95, 0.925, 0.86];
  function paperBg(S, alpha = 1, o = {}) {
    S.bg('paper', { u_paper: o.paper || PAPER, u_boil: 0, u_vig2: o.vig == null ? 0.28 : o.vig, u_halftone: o.halftone || 0, u_lines: o.lines || 0, u_tint2: o.tint2 || [0.85, 0.8, 0.75], u_alpha: alpha });
  }
  function outrun(S, t, o = {}) {
    const u = Bg.outrunDefaults();
    Object.assign(u, o);
    S.bg('outrun', u);
    return u;
  }
  // neon ring shockwave (raw strokes) centred at (x,y)
  function ring(b, x, y, r, col, w = 0.012, a = 1, n = 72) {
    const p = [];
    for (let i = 0; i < n; i++) { const q = (i / n) * M.TAU; p.push([x + Math.cos(q) * r, y + Math.sin(q) * r, 0]); }
    St.emitRaw(b, [{ p, c: col, w, closed: true, a }]);
  }
  // write-on for a text layout: reveal glyphs left-to-right by progress k
  function writeOn(k, L, soft = 0.08) {
    return (g) => {
      const x = (g.cx + L.width / 2) / Math.max(L.width, 1e-3);
      const a = M.clamp((k - x) / soft + 1);
      return a <= 0 ? null : { a };
    };
  }
  function flicker(t, t0, seed = 1, dur = 0.35) {
    // neon ignition flicker: off-on stutter, then steady
    const a = t - t0;
    if (a < 0) return 0;
    if (a > dur) return 1;
    const n = R.hash(Math.floor(a * 30) + seed * 17.1);
    return n > 0.45 + 0.4 * (1 - a / dur) ? 1 : 0.08;
  }
  // VHS on-screen display text
  function osd(S, str, x, y, size = 0.1, a = 1, col = [1, 1, 1]) {
    const L = D.txt('vhs', str, size, { align: 'left' });
    S.osd(() => Tx.draw(L, { style: 'fill', col, col2: [0, 0, 0], outline: 3, glow: 0, model: Mat.translate(x, y, 0), alpha: a }));
    return L;
  }
  function playTri(S, x, y, s, a = 1, dir = 1) {
    const b = S.batch();
    St.emitRaw(b, [{ p: [[x - s * 0.5 * dir, y - s * 0.55, 0], [x + s * 0.6 * dir, y, 0], [x - s * 0.5 * dir, y + s * 0.55, 0]], c: [1, 1, 1], w: s * 0.18, closed: true, a }]);
    S.osd(() => St.draw(b, St.flatCam(), { style: 'solid', blend: 'premul' }));
  }

  // morph chain: list of {shape, t (arrival), dur}; returns [A, B, k]
  function chainAt(list, t) {
    let i = 0;
    while (i < list.length - 1 && t >= list[i + 1].t - (list[i + 1].lead || 0.45)) i++;
    if (i === 0 && t < list[0].t) return [list[0].shape, null, 0, 0];
    const cur = list[i], nxt = list[i + 1];
    if (!nxt) return [cur.shape, null, 0, i];
    const a = nxt.t - (nxt.lead || 0.45), k = M.clamp((t - a) / (nxt.dur || 1.0));
    return k > 0 ? [cur.shape, nxt.shape, k, i] : [cur.shape, null, 0, i];
  }

  // ================================================================ INTRO 0 – 18.64
  function intro(S, t) {
    const P = S.post;
    P.grain = 0.07;
    if (t < 7.04) {
      // --- VHS play + CRT on + neon cassette assembling itself
      P.open = H.ramp(t, 0.35, 0.95, E.outCubic);
      P.vhs = M.mix(1.0, 0.15, H.seg(t, 0.9, 2.6));
      P.vhsRoll = t * 0.35;
      P.scan = 0.12;
      S.bg('void', { u_c1: hex('#2a0845'), u_c2: hex('#040010'), u_stars: 1, u_warp: 0.6 + H.seg(t, 4.5, 7.04) * 3.0, u_grid: 0 });
      const push = H.ramp(t, 5.35, 7.04, E.inQuart);
      const orbitA = (1 - push);
      const cam = St.camera({
        eye: [Math.sin(t * 0.55) * 0.55 * orbitA, 0.08 + Math.sin(t * 0.4) * 0.2 * orbitA, M.mix(3.3, 0.16, push)],
        at: [0, 0.08 * push, -2 * push], roll: Math.sin(t * 0.3) * 0.06 * orbitA,
      });
      const k = H.kick(t, 0.12);
      const sc = 0.78 + 0.03 * k;
      const model = Mat.mul(Mat.rotY(Math.sin(t * 0.7) * 0.25 * orbitA), Mat.scale(sc, sc, sc));
      // portal: the outrun world glowing through the tape window
      const portal = H.ramp(t, 3.6, 5.2);
      if (portal > 0) {
        const cap = S.capture((S2) => outrun(S2, t, { u_speed: t * 1.4, u_sunY: 0.18 + 0.1 * push, u_pulse: k }), t, 'capB');
        S.card(cam, { tex: cap, model: Mat.mul(model, Mat.translate(0, 0.08, -0.01)), size: [0.93, 0.28], crop: [0, 0.24, 1, 0.76], alpha: portal }, 'scene');
      }
      const reveal = H.ramp(t, 0.75, 3.4, E.inOutQuad);
      const b = S.batch();
      St.emit(b, SH.cassette, null, 0, { model, from: 0, to: reveal, revealGlobal: true, time: t });
      const spin = -t * 3.2 - H.seg(t, 4, 7) * 6;
      St.emitRaw(b, Sh.reels(spin, { col: C.white, tape: [0.9, 0.4, 0.2] }), { model, alpha: H.ramp(t, 2.6, 3.4) });
      S.neon(b, cam, { intensity: 1.2 + k * 0.6 });
      // handwritten label (writes on)
      const lab = D.txt('marker', 'Turn the Eighties Up!', 0.1);
      const wk = H.ramp(t, 2.2, 4.3, E.linear || ((x) => x));
      S.text(lab, { cam, model: Mat.mul(model, Mat.translate(0.0, 0.38, 0.005)), style: 'fill', col: [1, 0.95, 0.98], col2: [0.1, 0, 0.1], glowCol: [1, 0.15, 0.55], glow: 4, anim: writeOn(wk, lab) });
      // OSD
      if (t < 3.4) {
        const blink = t > 2.2 ? (Math.floor(t * 3) % 2 ? 1 : 0) : 1;
        osd(S, 'PLAY', -1.62, 0.84, 0.12, blink);
        playTri(S, -1.15, 0.83, 0.07, blink);
        osd(S, 'SP  0:00:0' + Math.floor(t), 1.02, 0.84, 0.1, 0.9);
      }
      // white hot fade near the dive
      P.flash = [1, 0.9, 1, H.ramp(t, 6.6, 7.04, E.inCubic) * 0.85];
      P.fb = { amt: 0.55 * push, zoom: 1.02 + 0.05 * push, rot: 0, decay: 0.8, hue: 0.02, dx: 0, dy: 0, mode: 0 };
      return;
    }
    // --- OUTRUN title (7.04 – 18.64)
    const lt = t - 7.04;
    const k = H.kick(t, 0.14);
    const drain = H.ramp(t, 16.9, 18.64, E.inOutQuad);   // colour drains into pencil
    const u = outrun(S, t, {
      u_speed: lt * 1.8 + Math.max(0, t - 12.4) * 0.9, u_pulse: k, u_roll: Math.sin(t * 0.45) * 0.05 + Math.sin(t * 0.21) * 0.03,
      u_camX: Math.sin(t * 0.3) * 0.6, u_sunY: M.mix(0.05, 0.3, H.ramp(t, 7.04, 10.5, E.outCubic)), u_mount: 1,
    });
    void u;
    paperBg(S, drain);
    P.flash = [1, 0.95, 1, H.pulse(t, 7.04, 0.16) * 0.75];
    P.bw = drain * 0.92;
    P.zoom = 1 + k * 0.012;
    // lasers from the horizon on downbeats after the groove drops
    const cam = H.orbit(t, { amp: 0.5, z: 3.0 });
    const flat = H.flat();
    if (t > 11.9 && drain < 1) {
      const lb = S.batch();
      const bar = T.bar(t);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1;
        const ang = side * (0.35 + 0.18 * Math.floor(i / 2)) + Math.sin(t * 1.3 + i) * 0.25;
        const len = 4.0;
        const hx = 0, hy = -0.05;
        const col = [C.pink, C.cyan, C.mag][i % 3];
        St.emitRaw(lb, [{ p: [[hx, hy, 0], [hx + Math.sin(ang) * len, hy + Math.cos(ang) * len * 0.6, 0]], c: col, w: 0.004 }], { alpha: (0.5 + 0.5 * H.pulse(t, bar.t0, 0.4)) * (1 - drain) });
      }
      S.neon(lb, flat, { intensity: 1.4 });
    }
    // title
    const titleA = 1 - H.ramp(t, 16.2, 16.95);
    const sway = Mat.chain(Mat.rotY(Math.sin(t * 0.8) * 0.22), Mat.rotX(Math.sin(t * 0.55) * 0.08), Mat.scale(1 + k * 0.025, 1 + k * 0.025, 1));
    const tcam = St.camera({ eye: [0, 0, 3] });
    if (titleA > 0) {
      const t1 = D.txt('chrome', 'TURN THE', 0.3, { tracking: 0.04 });
      const d1 = E.outBack(H.seg(t, 7.04, 7.5), 1.6);
      S.text(t1, { cam: tcam, style: 'chrome', col2: [0.03, 0, 0.1], outline: 3.5, glow: 4, glowCol: [1, 0.25, 0.7], model: Mat.mul(sway, Mat.translate(0, M.mix(1.4, 0.5, d1), 0)), alpha: titleA });
      if (t > 8.6) {
        const t2 = D.txt('neon', 'EIGHTIES', 0.36);
        const fl = flicker(t, 8.68, 3, 0.45);
        S.text(t2, { cam: tcam, style: 'fill', col: [1, 0.3, 0.72], col2: [0.12, 0, 0.1], outline: 2.5, glowCol: [1, 0.1, 0.55], glow: 5, intensity: 1.25, model: Mat.mul(sway, Mat.translate(0, 0.08, 0.05)), alpha: fl * titleA,
          anim: (g, i) => ({ y: Math.sin(t * 5 - i * 0.7) * 0.025 }) });
      }
      if (t > 10.3) {
        const t3 = D.txt('chrome', 'UP!', 0.62);
        const d3 = E.outExpo(H.seg(t, 10.36, 10.6));
        const s3 = M.mix(3.0, 1, d3) * (1 + k * 0.04);
        S.text(t3, { cam: tcam, style: 'hot', col: [1, 0.92, 0.3], col2: [1, 0.12, 0.45], outline: 4, glow: 4, glowCol: [1, 0.3, 0.15], intensity: 1.0, model: Mat.chain(sway, Mat.translate(0, -0.46, 0.1), Mat.scale(s3, s3, 1)), alpha: d3 * titleA });
        const rb = S.batch();
        const rr = H.seg(t, 10.36, 11.2);
        if (rr > 0 && rr < 1) ring(rb, 0, -0.4, 0.2 + rr * 2.2, C.yellow, 0.01, 1 - rr);
        S.neon(rb, flat);
        if (t < 12.5) S.parts(cam, { mode: 'confetti', t0: 10.36, count: 700, origin: [0, -0.4, 0], spread: 2.2, grav: 0.9, life: 2.4, size: 0.045, seed: 3 });
      }
    }
    // title outline -> BMX pile (pencil) morph begins
    titleToVerse(S, t);
    P.fb = { amt: 0.35 * (1 - drain), zoom: 1.006, rot: 0, decay: 0.82, hue: 0, dx: 0, dy: 0, mode: 0 };
  }

  // shared between intro and verse1 so the handover is seamless
  function titleToVerse(S, t) {
    if (t < 16.2 || t > 19.8) return;
    const m = H.ramp(t, 16.98, 19.3, E.inOutCubic);
    const cam = verse1Cam(t);
    const vis = H.ramp(t, 16.75, 17.1);
    const nb = S.batch();
    St.emit(nb, SH.titleOutline, SH.bmx, m, { time: t, swirl: 0.5, stagger: 0.5 });
    S.neon(nb, cam, { intensity: vis * (1 - H.ramp(t, 17.4, 18.9)) * 1.3 });
    const ib = S.batch();
    St.emit(ib, SH.titleOutline, SH.bmx, m, { time: t, swirl: 0.5, stagger: 0.5, jitter: 0.0055, passes: 2 });
    S.ink(ib, cam, { intensity: H.ramp(t, 17.4, 18.9) });
  }

  // ================================================================ VERSE 1 18.64 – 45.12 (pencil world)
  let V1;
  const ARCADE_M = Mat.mul(Mat.translate(0, -0.05, 0), Mat.scale(0.82, 0.82, 0.82));
  function verse1Cam(t) {
    // slow drift + a push-in per line; the phone-hall line dollies down the corridor
    const li = D.lineIndexAt(t, 0.3);
    const L = T.lines[M.clamp(li, 0, 7)];
    const push = H.ramp(t, L.s - 0.3, L.e + 0.8, E.inOutQuad) * 0.35;
    const hall = H.ramp(t, 41.6, 45.12, E.inQuad);
    const k = H.kick(t, 0.1) * 0.03;
    const x = Math.sin(t * 0.21) * 0.35 * (1 - hall), y = Math.sin(t * 0.17 + 1) * 0.12 * (1 - hall) + 0.02;
    const z = 3.1 - push - k - hall * 13.5;
    return St.camera({ eye: [x - hall * 0.15, y - hall * 0.25, z], at: [x * 0.3 - hall * 0.1, y * 0.2 - hall * 0.3, z - 3], roll: Math.sin(t * 0.11) * 0.025 });
  }
  function verse1(S, t) {
    const P = S.post;
    P.bw = 0.92 * (1 - H.ramp(t, 18.64, 19.6)); P.tint = [1.02, 1.0, 0.96]; P.grain = 0.08; P.vig = 0.55; P.bloom = 0.7; P.contrast = 1.08; P.sat = 1.15;
    paperBg(S, 1);
    const cam = verse1Cam(t);
    if (t < 19.3) titleToVerse(S, t);
    else {
      const [A, B, k] = chainAt(V1, t);
      const ib = S.batch();
      St.emit(ib, A, B, k, { time: t, jitter: 0.0055, passes: 2, swirl: 0.45, stagger: 0.5 });
      S.ink(ib, cam, { intensity: 1 });
    }
    // Colour accents. On paper, colour is laid down as marker (solid) with a faint neon halo;
    // the bw grade is lifted locally by keeping these saturated.
    const nb = S.batch(), mk = S.batch(), hb = S.batch();
    // --- BMX wheels still spinning in the pile
    const bw = H.env(t, 19.3, 21.9, 0.3, 0.3);
    if (bw > 0) {
      const wheels = [
        ...Sh.tf([[-0.62, -0.25], [0.62, -0.25]], { x: -0.25, y: 0.05, s: 1.05, r: -0.08 }).map((c) => [c, 0.36 * 1.05, 1.4]),
        ...Sh.tf([[-0.62, -0.25], [0.62, -0.25]], { x: 0.55, y: -0.18, s: 0.85, r: 0.35, sx: -1 }).map((c) => [c, 0.36 * 0.85, -2.1]),
      ];
      const spokes = [];
      wheels.forEach(([c, r, sp], wi) => {
        for (let q = 0; q < 3; q++) {
          const a = t * sp + q * (Math.PI / 3) + wi;
          spokes.push({ p: [[c[0] - Math.cos(a) * r * 0.84, c[1] - Math.sin(a) * r * 0.84, 0], [c[0] + Math.cos(a) * r * 0.84, c[1] + Math.sin(a) * r * 0.84, 0]], w: 0.004 });
        }
      });
      St.emitRaw(hb, spokes, { alpha: bw, jitter: 0.003, time: t });
    }
    // --- Pac-Man glowing on the arcade screen (a dark CRT so the neon can glow)
    const ar = H.env(t, 25.25, 28.45, 0.3, 0.35);
    if (ar > 0) {
      const am = ARCADE_M;
      S.card(cam, { mode: 'flat', tint: [0.02, 0.02, 0.06], model: Mat.mul(am, Mat.translate(0, 0.36, 0)), size: [0.8, 0.44], alpha: ar * 0.95 }, 'scene');
      const on = flicker(t, 25.85, 5, 0.5) * ar;
      const ph = (t - 25.3) * 0.45;
      const px = -0.3 + M.fract(ph) * 0.6, py = 0.36;
      const mouth = Math.abs(Math.sin(t * 14));
      St.emitRaw(nb, [{ p: Sh.chomper(px, py, 0.06, mouth, 0), c: C.yellow, w: 0.009, closed: true }], { alpha: on, model: am });
      for (let i = 0; i < 7; i++) { const dx = -0.33 + i * 0.1; if (dx > px + 0.02) St.emitRaw(nb, [{ p: Sh.circ(dx, py, 0.01, 8), c: [1, 0.85, 0.6], w: 0.007, closed: true }], { alpha: on, model: am }); }
      const gx = px - 0.2;
      const gp = [...Sh.arc(gx, py + 0.01, 0.05, 0, Math.PI, 12), [gx - 0.05, py - 0.05, 0], [gx - 0.025, py - 0.03, 0], [gx, py - 0.05, 0], [gx + 0.025, py - 0.03, 0], [gx + 0.05, py - 0.05, 0]];
      St.emitRaw(nb, [{ p: gp, c: C.pink, w: 0.008, closed: true }], { alpha: on, model: am });
      St.emitRaw(nb, [{ p: Sh.rrect(0, 0.36, 0.76, 0.4, 0.05), c: C.blue, w: 0.006, closed: true }], { alpha: on * 0.8, model: am });
      if (t > 25.9) S.text(D.txt('pixel', 'HI 99990', 0.035), { cam, style: 'fill', col: [1, 0.3, 0.3], glowCol: [1, 0.2, 0.2], glow: 3, model: Mat.mul(am, Mat.translate(0, 0.52, 0.01)), alpha: on });
    }
    // --- twenty cents: gold coins drop into the slots, credit counter on a dark LED panel
    const cn = H.env(t, 28.2, 31.95, 0.2, 0.4);
    if (cn > 0) {
      S.card(cam, { mode: 'flat', tint: [0.03, 0.02, 0.05], model: Mat.translate(0, -0.35, 0), size: [0.76, 0.26], alpha: cn }, 'scene');
      const drops = [[H.w('Twenty cents', 'twenty'), -0.28], [H.w('Twenty cents', 'cents'), 0.28]];
      for (const [td, x] of drops) {
        const a = t - (td - 0.35);
        if (a < 0) continue;
        const fall = E.inQuad(M.clamp(a / 0.35));
        const y = M.mix(1.25, 0.3, fall);
        if (a < 0.42) {
          St.emitRaw(mk, [{ p: Sh.coin(x, y, 0.1, t * 9), c: [0.95, 0.68, 0.08], w: 0.012, closed: true }], { alpha: cn });
          St.emitRaw(nb, [{ p: Sh.coin(x, y, 0.1, t * 9), c: C.yellow, w: 0.006, closed: true }], { alpha: cn * 0.6 });
        }
        const fl = H.pulse(t, td, 0.3);
        if (fl > 0.02) St.emitRaw(mk, [{ p: Sh.rrect(x, 0.3, 0.2, 0.46, 0.03), c: [1, 0.55, 0.05], w: 0.014, closed: true }], { alpha: fl * cn });
      }
      const credit = t > H.w('Twenty cents', 'back') ? 'CREDIT 2' : t > H.w('Twenty cents', 'down') ? 'CREDIT 1' : 'INSERT COIN';
      const bl = credit === 'INSERT COIN' ? (Math.floor(t * 4) % 2 ? 1 : 0.25) : 1;
      S.text(D.txt('pixel', credit, 0.055), { cam, style: 'fill', col: [0.4, 1, 1], glowCol: [0, 0.8, 1], glow: 3, intensity: 1.4, model: Mat.translate(0, -0.35, 0.01), alpha: cn * bl });
    }
    // --- cassette: spinning reels + handwritten name in red marker
    const cs = H.env(t, 32.1, 35.2, 0.3, 0.35);
    if (cs > 0) {
      St.emitRaw(hb, Sh.reels(-t * 4, { col: [1, 1, 1] }), { alpha: cs, jitter: 0.004, passes: 1, time: t });
      const lab = D.txt('marker', 'MIXTAPE ’85', 0.12);
      const wk = H.ramp(t, H.w('Black cassette', 'handwritten') - 0.1, H.w('Black cassette', 'name') + 0.35, (x) => x);
      S.text(lab, { cam, style: 'fill', col: [0.85, 0.05, 0.25], col2: [0.85, 0.05, 0.25], model: Mat.mul(Mat.translate(0, 0.37, 0.01), Mat.rotZ(-0.03)), anim: writeOn(wk, lab), alpha: cs });
    }
    // --- tape deck: a finger lands on RECORD, the VU needles dance to the song
    const dk = H.env(t, 35.4, 38.55, 0.3, 0.2);
    if (dk > 0) {
      const tr = H.w('Finger on', 'record');
      const press = E.outCubic(H.seg(t, tr - 0.35, tr)) * (1 - H.seg(t, tr + 1.4, tr + 1.8));
      const f = T.feat(t);
      const needles = [Sh.vuNeedle(0.62, M.clamp(f.bands[3] * 1.1)), Sh.vuNeedle(1.12, M.clamp(f.bands[9] * 1.2))];
      St.emitRaw(hb, needles.map((p) => ({ p, w: 0.006 })), { alpha: dk });
      St.emitRaw(hb, Sh.finger(-1.25, -0.4 + 0.45 * (1 - press) - 0.02 * press), { alpha: dk * H.ramp(t, tr - 0.9, tr - 0.4), jitter: 0.004, time: t });
      if (t > tr) {
        const bl = Math.floor((t - tr) * 2.5) % 2 ? 0.35 : 1;
        St.emitRaw(mk, [{ p: Sh.circ(-1.25, -0.42, 0.045, 16), c: [0.95, 0.08, 0.08], w: 0.03, closed: true }], { alpha: dk });
        St.emitRaw(nb, [{ p: Sh.circ(-1.25, -0.42, 0.045, 16), c: C.red, w: 0.012, closed: true }], { alpha: dk * 0.7 });
        S.text(D.txt('vhs', 'REC', 0.12), { cam, style: 'fill', col: [0.95, 0.1, 0.1], model: Mat.translate(-1.0, 0.52, 0.01), alpha: dk * bl });
        St.emitRaw(mk, [{ p: Sh.circ(-1.19, 0.527, 0.02, 12), c: [0.95, 0.08, 0.08], w: 0.02, closed: true }], { alpha: dk * bl });
      }
    }
    // --- posters: the right-hand poster's corner peels
    const ps = H.env(t, 38.9, 41.3, 0.2, 0.2);
    if (ps > 0) {
      const cu = E.inOutQuad(H.seg(t, H.w('Posters peeling', 'peeling'), H.w('Posters peeling', 'wall')));
      const cx = 1.08 + 0.375, cy = 0.08 - 0.5;
      const L = 0.1 + cu * 0.45;
      St.emitRaw(hb, [{ p: [[cx - L, cy, 0], [cx - L * 0.4, cy + L * 0.25, 0.05], [cx, cy + L, 0]], w: 0.008 }, { p: [[cx - L, cy, 0], [cx, cy, 0], [cx, cy + L, 0]], w: 0.006 }], { alpha: ps, jitter: 0.004, time: t });
    }
    // --- phone cord in hot-pink marker, running down the hall to a lit doorway
    const ph = H.env(t, 41.9, 45.3, 0.4, 0.2);
    if (ph > 0) {
      const cord = SH.phoneHall.strokes[SH.phoneHall.strokes.length - 1];
      const to = H.ramp(t, 42.2, 43.8);
      St.emitRaw(mk, [{ p: cord.p, c: [0.95, 0.1, 0.45], w: 0.007 }], { alpha: ph, to });
      St.emitRaw(nb, [{ p: cord.p, c: C.pink, w: 0.004 }], { alpha: ph * 0.5, to });
      St.emitRaw(nb, [{ p: [[-0.4, -1.0, -14], [0.4, -1.0, -14], [0.4, 0.6, -14], [-0.4, 0.6, -14]], c: C.yellow, w: 0.03, closed: true }], { alpha: ph * H.ramp(t, 43.3, 44.3) });
    }
    S.neon(nb, cam, { intensity: 1.3 });
    S.solid(mk, cam, { minPx: 1.2 });
    S.ink(hb, cam);
    // --- lyrics as comic captions (pencil box + hand lettering)
    const li = D.lineIndexAt(t, 0.25);
    if (li >= 0 && li <= 7) {
      const r = D.lyricLayout(li, 'hand', 0.125, 2.9);
      const bw = r.L.width * r.fit + 0.2, bh = r.L.height * r.fit + 0.12;
      const L = T.lines[li];
      const a = H.env(t, L.s - 0.25, L.e + 0.55, 0.15, 0.25);
      const bx = S.batch();
      const cy = -0.79;
      S.card(H.flat(), { mode: 'flat', tint: [0.99, 0.97, 0.9], model: Mat.translate(0, cy - 0.005, 0), size: [bw, bh], alpha: a * 0.92 }, 'scene');
      St.emitRaw(bx, [{ p: Sh.rrect(0, cy - 0.005, bw, bh, 0.0), w: 0.004, closed: true }], { alpha: a, jitter: 0.004, passes: 2, time: t });
      S.ink(bx, H.flat());
      D.lyric(S, li, t, { font: 'hand', size: 0.125, maxW: 2.9, y: cy, style: 'fill', col: [0.07, 0.06, 0.09], anim: 'pop', hold: 0.55, jitter: 0.004 });
    }
    P.fb = { amt: 0, zoom: 1, rot: 0, decay: 0.9, hue: 0, dx: 0, dy: 0, mode: 0 };
  }

  // ================================================================ PRE-CHORUS 1 45.12 – 51.74 (night street)
  function pre1Cam(t) {
    const fly = H.ramp(t, 45.12, 51.74, E.inQuad);
    const tilt = H.ramp(t, 48.0, 50.6, E.inOutCubic);
    const z = 3.2 - fly * 9;
    return St.camera({ eye: [Math.sin(t * 0.4) * 0.2, -0.35 + tilt * 0.25, z], at: [0, -0.2 + tilt * 1.4, z - 4], roll: Math.sin(t * 0.3) * 0.03 });
  }
  function pre1(S, t) {
    const P = S.post;
    const sk = 1 - H.ramp(t, 45.3, 47.2);
    P.bw = 0.5 * sk;
    P.grain = 0.07; P.vig = 0.5;
    const moonUp = H.ramp(t, 47.6, 50.8, E.inOutCubic);
    S.bg('street', {
      u_moon: [M.mix(0.95, 0.15, moonUp), M.mix(0.55, 0.28, moonUp), M.mix(0.1, 0.5, moonUp)], u_neon: M.mix(0.0, 0.8, 1 - sk),
      u_scroll: t * 0.15, u_hor: -0.42 + H.ramp(t, 48, 50.6) * -0.3, u_sketch: sk, u_fogAmt: 0.8, u_winSeed: 3,
      u_skyTop: hex('#070320'), u_skyBot: hex('#2b1055'),
    });
    const cam = pre1Cam(t);
    // streetlights: pencil posts, lamps ignite with a flicker
    const ib = S.batch(), nb = S.batch();
    St.emit(ib, SH.street, null, 0, { time: t, jitter: 0.01, passes: 2 });
    S.ink(ib, cam, { intensity: sk });
    const lamps = SH.street.strokes;
    for (let i = 0; i < lamps.length; i++) {
      const s = lamps[i];
      const isLamp = s.c === C.orange;
      const pair = Math.floor(i / 2);
      const on = flicker(t, 45.34 + pair * 0.1, i, 0.5);
      if (isLamp) St.emitRaw(nb, [{ p: s.p, c: [1, 0.6, 0.25], w: 0.035, closed: true }], { alpha: on });
      else St.emitRaw(nb, [s], { alpha: (1 - sk) * 0.35, color: [0.6, 0.5, 1.0] });
    }
    // riders passing
    const riders = [[46.3, -2.5, 0.8, C.cyan], [46.6, -4.6, 1.0, C.pink], [46.9, -7.0, 1.2, C.yellow]];
    for (const [t0, z, sc, col] of riders) {
      const a = t - t0;
      if (a < 0 || a > 2.2) continue;
      const x = M.mix(-4.5, 4.5, a / 2.2);
      const model = Mat.mul(Mat.translate(x, -0.95 + 0.6 * sc, z), Mat.scale(sc * 0.6, sc * 0.6, 1));
      St.emit(nb, SH.rider, null, 0, { model, color: col, time: t });
    }
    S.neon(nb, cam, { intensity: 1.3 });
    // E.T. moon crossing: silhouette of a rider across the moon
    const mx = H.seg(t, 49.2, 51.2);
    if (mx > 0 && mx < 1) {
      const sb = S.batch();
      const cx = M.mix(-1.4, 1.2, mx), cy = M.mix(0.05, 0.55, mx) + Math.sin(mx * Math.PI) * 0.12;
      St.emit(sb, SH.rider, null, 0, { model: Mat.mul(Mat.translate(cx, cy, 0), Mat.scale(0.3, 0.3, 1)), color: [0, 0, 0], wscale: 1.6 });
      S.solid(sb, H.flat(), { minPx: 1.2, glow: 1.2 });
    }
    S.parts(cam, { mode: 'dust', count: 250, size: 0.02, speed: 1, seed: 7 });
    // lyrics: neon marker
    const li = D.lineIndexAt(t, 0.25);
    if (li === 8 || li === 9) {
      D.lyric(S, li, t, { font: 'marker', size: 0.135, maxW: 3.0, y: -0.72, style: 'fill', col: [1, 0.96, 1], col2: [0.1, 0, 0.12], outline: 2, glow: 3, glowCol: M.mix3(C.orange, C.pink, 1 - sk), anim: 'rise', hold: 0.4, layer: 'top' });
    }
    // build-up to the chorus
    const up = H.ramp(t, 50.1, 51.74, E.inQuad);
    P.fb = { amt: 0.6 * up, zoom: 1.0 + 0.03 * up, rot: 0.004 * up, decay: 0.85, hue: 0.01, dx: 0, dy: 0, mode: 0 };
    P.flash = [1, 0.85, 0.95, H.ramp(t, 51.3, 51.74, E.inCubic) * 0.9 + H.pulse(t, 45.12, 0.3) * 0.6];
    P.exposure = 1 + up * 0.4;
  }

  // ================================================================ CHORUS (three variants)
  // word slam helper: draws one styled word that lands at t0 and leaves at `until`
  function word(S, t, str, t0, o = {}) {
    const a = t - t0;
    const until = o.until == null ? 1e9 : o.until;
    if (a < -0.02 || t > until + (o.exitDur || 0.4) + 0.05) return 0;
    const L = D.txt(o.font || 'chrome', str, o.size || 0.3, { tracking: o.tracking });
    let s = 1, y = o.y || 0, x = o.x || 0, al = 1, rot = o.rot || 0;
    const an = o.anim || 'slam';
    if (an === 'slam') { const k = E.outExpo(M.clamp(a / 0.16)); s = M.mix(2.4, 1, k); al = M.clamp(a / 0.05); }
    else if (an === 'drop') { const k = E.outBack(M.clamp(a / 0.32), 1.8); y += (1 - k) * 1.3; al = M.clamp(a / 0.05); }
    else if (an === 'pop') { const k = E.outBack(M.clamp(a / 0.25), 2.5); s = M.mix(0.2, 1, k); al = M.clamp(a / 0.06); }
    else if (an === 'left') { const k = E.outExpo(M.clamp(a / 0.3)); x -= (1 - k) * 4; al = 1; }
    else if (an === 'right') { const k = E.outExpo(M.clamp(a / 0.3)); x += (1 - k) * 4; al = 1; }
    else if (an === 'fade') { al = M.clamp(a / 0.2); }
    const exd = o.exitDur || 0.4;
    if (t > until) { const k = M.clamp((t - until) / exd); al *= 1 - k; s *= 1 + k * (o.exitGrow == null ? 0.3 : o.exitGrow); }
    if (o.breathe) s *= 1 + H.kick(t, 0.1) * o.breathe;
    const model = Mat.chain(Mat.translate(x, y, o.z || 0), Mat.rotZ(rot), Mat.scale(s * (o.sx || 1), s, 1));
    const opts = Object.assign({ cam: o.cam || H.flat(), model, alpha: al * (o.alpha == null ? 1 : o.alpha) }, o.st || { style: 'chrome', col2: [0.03, 0, 0.1], outline: 3.5, glow: 4, glowCol: [1, 0.25, 0.7] });
    if (o.anim2) opts.anim = o.anim2;
    if (o.shadow) S.text(L, Object.assign({}, opts, { style: 'fill', col: [0, 0, 0], col2: [0, 0, 0], glow: 0, outline: 5, model: Mat.mul(Mat.translate(0.02, -0.025, 0), model), alpha: opts.alpha * 0.6 }));
    (o.top ? S.textTop : S.text)(L, opts);
    return al;
  }
  const ST = {
    chrome: { style: 'chrome', col2: [0.03, 0, 0.1], outline: 3.5, glow: 4, glowCol: [1, 0.25, 0.7] },
    hot: { style: 'hot', col: [1, 0.92, 0.3], col2: [1, 0.12, 0.45], outline: 4, glow: 4, glowCol: [1, 0.3, 0.15] },
    hotCyan: { style: 'hot', col: [0.7, 1, 1], col2: [0.1, 0.4, 1], outline: 4, glow: 4, glowCol: [0.1, 0.6, 1] },
    neonPink: { style: 'fill', col: [1, 0.3, 0.72], col2: [0.12, 0, 0.1], outline: 2.5, glow: 5, glowCol: [1, 0.1, 0.55], intensity: 1.25 },
    neonCyan: { style: 'fill', col: [0.35, 1, 1], col2: [0, 0.05, 0.12], outline: 2.5, glow: 5, glowCol: [0, 0.8, 1], intensity: 1.2 },
    tube: { style: 'neon', col: [1, 0.25, 0.7], col2: [1, 0.25, 0.7], outline: 1.5, thick: 1.6, glow: 3 },
    comic: { style: 'fill', col: [1, 0.95, 0.2], col2: [0.05, 0, 0.08], outline: 5, glow: 0 },
    comicW: { style: 'fill', col: [1, 1, 1], col2: [0.05, 0, 0.08], outline: 5, glow: 0 },
    rainbow: { style: 'hot', rainbow: true, outline: 4, col2: [0.02, 0, 0.05], glow: 3, glowCol: [1, 1, 1] },
  };
  const tokT = (li, k) => D.TOK[li].toks[Math.min(k, D.TOK[li].toks.length - 1)].t0;

  const VARIANT = [
    { sun1: '#ffd319', sun2: '#ff2a6d', sky0: '#0b0221', sky1: '#3b0a5e', grid: '#ff2adf', hor: '#ff4fa0', acc: C.cyan, acc2: C.pink },
    { sun1: '#9ff9ff', sun2: '#2b6bff', sky0: '#01010c', sky1: '#07205a', grid: '#05d9e8', hor: '#3fa9ff', acc: C.pink, acc2: C.cyan },
    { sun1: '#fff45c', sun2: '#ff00e6', sky0: '#050016', sky1: '#27005a', grid: '#b026ff', hor: '#ff3cac', acc: C.yellow, acc2: C.mag },
  ];

  function chorusBg(S, t, v, c0, o = {}) {
    const vc = VARIANT[v];
    const k = H.kick(t, 0.14);
    const speed = (t - [51.74, 115.84, 182.64][v]) * (2.2 + v * 0.4) + (o.boost || 0);
    if (v === 1 && !o.forceOutrun) {
      S.bg('tunnel', { u_speed: speed * 0.8, u_twist: 0.15 * Math.sin(t * 0.3), u_rad: 0.45, u_hue: 0.52 + Math.sin(t * 0.2) * 0.08, u_pulse: 1 + k * 2, u_sides: 16, u_center: [Math.sin(t * 0.7) * 0.15, Math.cos(t * 0.5) * 0.08] });
      return;
    }
    outrun(S, t, {
      u_speed: speed, u_pulse: k, u_roll: (o.roll || 0) + Math.sin(t * 0.5) * 0.04, u_camX: Math.sin(t * 0.35) * 0.8, u_sunY: 0.3 + H.beat(t, 0.2) * 0.01,
      u_sun1: hex(vc.sun1), u_sun2: hex(vc.sun2), u_skyTop: hex(vc.sky0), u_skyBot: hex(vc.sky1), u_gridCol: hex(vc.grid), u_horGlow: hex(vc.hor),
      u_stars: 1, u_mount: 1, u_camH: 0.35 + (o.low || 0),
    });
  }

  function lasers(S, t, cam, n, alpha, cols, hy = -0.05) {
    const lb = S.batch();
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const ang = side * (0.3 + 0.16 * Math.floor(i / 2)) + Math.sin(t * 1.7 + i * 1.3) * 0.35;
      St.emitRaw(lb, [{ p: [[0, hy, 0], [Math.sin(ang) * 5, hy + Math.cos(ang) * 3, 0]], c: cols[i % cols.length], w: 0.0035 }], { alpha });
    }
    S.neon(lb, cam, { intensity: 1.5 });
  }

  function knob(S, t, cam, val, x, y, s, a = 1, col) {
    const b = S.batch();
    const model = Mat.mul(Mat.translate(x, y, -0.2), Mat.scale(s, s, s));
    St.emit(b, SH.knob, null, 0, { model, alpha: a, color: col });
    const ang = Sh.knobAngle(val);
    St.emitRaw(b, [{ p: [[0, 0, 0], [Math.cos(ang) * 0.5, Math.sin(ang) * 0.5, 0]], c: val > 10.5 ? C.red : C.white, w: 0.03 }], { model, alpha: a });
    S.neon(b, cam, { intensity: 1.2 });
  }

  function hair(S, t, t0, cam, cx, cy, scale, a = 1) {
    const g = E.outCubic(M.clamp((t - t0) / 0.6));
    if (g <= 0) return;
    const b = S.batch();
    const n = 70, strokes = [];
    for (let j = 0; j < n; j++) {
      const f = j / (n - 1);
      const ang = M.mix(Math.PI * 0.97, Math.PI * 0.03, f);
      const bx = cx + Math.cos(ang) * 0.5 * scale, by = cy + Math.sin(ang) * 0.22 * scale;
      const pts = [[bx, by, 0]];
      let x = bx, y = by, dir = ang + (R.hash(j) - 0.5) * 0.4;
      const len = (0.9 + R.hash(j + 5) * 0.8) * scale * g;
      for (let q = 1; q <= 12; q++) {
        dir += R.perlin3(j * 0.3, q * 0.35, t * 0.8) * 0.45 + (f - 0.5) * 0.08;
        x += Math.cos(dir) * len / 12; y += Math.sin(dir) * len / 12 * 1.1;
        pts.push([x, y, 0]);
      }
      strokes.push({ p: pts, c: M.hsv(0.83 + f * 0.25 + Math.sin(t) * 0.03, 0.75, 1), w: 0.006 });
    }
    St.emitRaw(b, strokes, { alpha: a });
    S.neon(b, cam, { intensity: 1.2 });
  }

  // final chorus: every object from the video orbits the title as neon line art
  function carousel(S, t, cam, a) {
    if (a <= 0) return;
    const nb = S.batch();
    const n = SH.carousel.length;
    SH.carousel.forEach((sh, i) => {
      const ang = t * 0.45 + (i / n) * M.TAU;
      const x = Math.cos(ang) * 1.9, z = Math.sin(ang) * 1.2 - 1.3, y = 0.1 + Math.sin(ang * 2 + t) * 0.14;
      const m = Mat.chain(Mat.translate(x, y, z), Mat.rotY(-ang * 0.5), Mat.rotZ(Math.sin(t + i) * 0.15), Mat.scale(0.28, 0.28, 0.28));
      St.emit(nb, sh, null, 0, { model: m, time: t, alpha: a * (0.35 + 0.4 * Math.max(0, -Math.sin(ang))) });
    });
    S.neon(nb, cam, { intensity: 1.2 });
  }
  function fireworksAt(S, t, cam, seed) {
    const db = T.downbeats.filter((d) => d <= t && d > t - 2.2).slice(-8);
    if (!db.length) return;
    const arr = new Float32Array(32);
    for (let i = 0; i < 8; i++) {
      const d = db[i % db.length] + (i >= db.length ? 0.2 * i : 0);
      arr.set([(R.hash(d * 7.1 + i) - 0.5) * 3.0, 0.35 + R.hash(d * 3.3 + i) * 0.5, -0.5, d + (i % 2) * 0.1], i * 4);
    }
    S.parts(cam, { mode: 'fireworks', count: 1600, bursts: arr, spread: 0.55, grav: 0.3, life: 1.7, size: 0.03, seed });
  }

  function chorus(S, t, v) {
    const P = S.post;
    const c0 = [10, 28, 46][v];
    const vc = VARIANT[v];
    const L = (k) => T.lines[c0 + k];
    const k = H.kick(t, 0.12);
    const flat = H.flat();
    const cam = H.orbit(t, { amp: 0.35, z: 3 });
    P.bloom = 1.0; P.sat = 1.2; P.grain = 0.05; P.vig = 0.45;
    P.zoom = 1 + k * 0.015;
    const li = M.clamp(D.lineIndexAt(t, 0.3) - c0, 0, 5);
    const lend = (i) => L(i).e;

    // ---------------- line 0: TURN THE EIGHTIES UP! Oh-oh-oh!
    if (li === 0) {
      chorusBg(S, t, v, c0);
      const tt = [tokT(c0, 0), tokT(c0, 1), tokT(c0, 2), tokT(c0, 3)];
      const oh = [tokT(c0, 4)];
      const knobVal = 2 + 8 * E.outCubic(H.seg(t, tt[0], tt[3] + 0.2));
      knob(S, t, cam, knobVal, 0, 0.05, 1.05, 0.55 * H.env(t, tt[0] - 0.2, oh[0], 0.2, 0.3), vc.acc);
      lasers(S, t, flat, 6, 0.7, [vc.acc, vc.acc2, C.white]);
      const until = oh[0] - 0.15;
      word(S, t, 'TURN', tt[0], { x: -0.75, y: 0.45, size: 0.34, until, st: ST.chrome, anim: 'drop', shadow: true });
      word(S, t, 'THE', tt[1], { x: 0.55, y: 0.47, size: 0.22, until, st: ST.chrome, anim: 'drop', shadow: true });
      word(S, t, 'EIGHTIES', tt[2], { y: 0.0, size: 0.42, until, st: v === 1 ? ST.neonCyan : ST.neonPink, anim: 'pop', breathe: 0.05 });
      word(S, t, 'UP!', tt[3], { y: -0.55, size: 0.5, until, st: v === 1 ? ST.hotCyan : ST.hot, anim: 'slam', breathe: 0.08 });
      P.flash = [1, 1, 1, H.pulse(t, [51.74, 115.84, 182.64][v], 0.2) * 0.7 + H.pulse(t, tt[3], 0.12) * 0.25];
      P.shake = H.shake(H.pulse(t, tt[3], 0.2) * 1.2, t);
      // oh-oh-oh rings
      if (t > oh[0] - 0.1) {
        const toks = D.TOK[c0].toks, ohT = toks[4].t0;
        const ohs = [ohT, ohT + 0.18, ohT + 0.55];
        const rb = S.batch();
        ohs.forEach((o0, i) => { const r = H.seg(t, o0, o0 + 0.8); if (r > 0 && r < 1) ring(rb, 0, 0, 0.3 + r * 1.8, [vc.acc2, vc.acc, C.yellow][i], 0.012, 1 - r); });
        S.neon(rb, flat, { intensity: 1.4 });
        word(S, t, 'Oh-oh-oh!', ohT - 0.05, { font: 'script', size: 0.5, y: 0.02, until: lend(0) + 0.1, st: ST.neonPink, anim: 'pop', rot: -0.08 });
      }
    }
    // ---------------- line 1: BIG HAIR, BRIGHT LIGHTS, let the good times roll!
    else if (li === 1) {
      const rollK = E.inOutCubic(H.seg(t, tokT(c0 + 1, 4), lend(1) + 0.1));
      chorusBg(S, t, v, c0, { roll: rollK * M.TAU, boost: rollK * 6 });
      const t0 = tokT(c0 + 1, 0), t2 = tokT(c0 + 1, 2), t4 = tokT(c0 + 1, 4);
      if (t < t4 + 0.2) {
        hair(S, t, t0, flat, 0, -0.05, 1.3, H.env(t, t0 - 0.1, t2 + 0.1, 0.1, 0.3) * (v === 2 ? 0.55 : 1));
        word(S, t, 'BIG', t0, { font: 'comic', x: -0.55, y: 0.1, size: 0.55, until: t2 - 0.12, exitDur: 0.12, st: ST.comic, anim: 'slam', rot: -0.06 });
        word(S, t, 'HAIR,', tokT(c0 + 1, 1), { font: 'comic', x: 0.55, y: 0.05, size: 0.55, until: t2 - 0.12, exitDur: 0.12, st: ST.comicW, anim: 'slam', rot: 0.05 });
        // bright lights: stage beams + flashes on each word
        const bl = H.env(t, t2 - 0.1, t4 + 0.25, 0.1, 0.3);
        if (bl > 0) S.scene(() => Bg.draw('beams', { add: 1, u_n: 7, u_spread: 0.22, u_sweep: 1.6, u_int: (v === 1 ? 0.45 : 0.9) * bl, u_srcY: 1.15, u_c1: vc.acc, u_c2: [1, 1, 1] }));
        word(S, t, 'BRIGHT', t2, { font: 'chrome', y: 0.36, size: 0.36, until: t4 - 0.25, st: ST.chrome, anim: 'pop', exitGrow: 0.6 });
        word(S, t, 'LIGHTS!', tokT(c0 + 1, 3), { font: 'chrome', y: -0.08, size: 0.42, until: t4 - 0.25, st: v === 1 ? ST.hotCyan : ST.hot, anim: 'slam', exitGrow: 0.6 });
        P.flash = [1, 1, 1, (H.pulse(t, t2, 0.1) + H.pulse(t, tokT(c0 + 1, 3), 0.1)) * 0.3];
        P.exposure = 1 + bl * (v === 1 ? 0.0 : 0.1);
      }
      // let the good times roll (text rides a barrel roll while the world rolls)
      D.lyric(S, c0 + 1, t, { range: [4, 8], font: 'chrome', size: 0.24, maxW: 3.1, y: -0.5, style: 'chrome', col2: [0.03, 0, 0.1], outline: 3, glow: 3, anim: 'roll', hold: 0.25, upper: true });
      P.fb = { amt: 0.4 * rollK * (1 - rollK) * 4, zoom: 1.0, rot: 0.01, decay: 0.8, hue: 0.03, dx: 0, dy: 0, mode: 0 };
    }
    // ---------------- line 2: We were NEON in a black-and-white town
    else if (li === 2) {
      const t0 = L(2).s;
      // dark paper, chalk town, neon on top
      paperBg(S, 1, { paper: [0.1, 0.1, 0.115], vig: 0.4 });
      P.inkCol = [0.9, 0.9, 0.88]; P.inkAmt = 1;
      const tc = St.camera({ eye: [Math.sin(t * 0.3) * 0.3, -0.1, 3.4 - H.ramp(t, t0, lend(2) + 0.3) * 1.6], at: [0, -0.05, 0] });
      const ib = S.batch();
      St.emitRaw(ib, SH.town, { jitter: 0.006, passes: 2, time: t });
      S.ink(ib, tc, { intensity: 0.9 });
      // some windows switch on in neon colours as "neon" is sung
      const nb = S.batch();
      const tn = tokT(c0 + 2, 2);
      SH.town.forEach((s, i) => { if (s.lit && t > tn + R.hash(i) * 1.2) St.emitRaw(nb, [s], { color: [C.pink, C.cyan, C.yellow, C.purple][i % 4], alpha: flicker(t, tn + R.hash(i) * 1.2, i, 0.3) }); });
      S.neon(nb, tc, { intensity: 1.3 });
      word(S, t, 'NEON', tn - 0.02, { font: 'neon', y: 0.28, size: 0.62, until: lend(2) + 0.2, st: Object.assign({}, ST.neonPink, { intensity: 1.5 * flicker(t, tn - 0.02, 2, 0.4) }), anim: 'fade' });
      D.lyric(S, c0 + 2, t, { font: 'hand', size: 0.16, maxW: 3.1, y: -0.74, style: 'fill', col: [0.95, 0.95, 0.92], col2: [0, 0, 0], outline: 3, anim: 'pop', hold: 0.2, jitter: 0.004 });
      P.sat = 1.3; P.bloom = 1.1;
    }
    // ---------------- line 3: TOO MUCH COLOUR to ever tone it down
    else if (li === 3) {
      const t0 = L(3).s, tDown = tokT(c0 + 3, 7);
      const flood = H.ramp(t, t0 - 0.1, t0 + 0.5, E.outCubic);
      paperBg(S, 1, { paper: [0.1, 0.1, 0.115], vig: 0.4 });
      S.bg('memphis', { u_scroll: t * 0.25, u_density: 0.75, u_dark: v === 1 ? 1 : 0, u_bgc: v === 1 ? [0.03, 0.01, 0.08] : [0.2, 0.9, 0.85], u_alpha: flood });
      const burst = tokT(c0 + 3, 2);
      if (t > burst - 0.05) S.parts(flat, { mode: 'confetti', t0: burst, count: 900, origin: [0, 0, 0], spread: 2.6, grav: 0.7, life: 3.5, size: 0.05, seed: 11 + v });
      const tone = t > tDown ? 1 - 0.55 * E.outCubic(H.seg(t, tDown, tDown + 0.25)) + 0.55 * E.outElastic(H.seg(t, tDown + 0.35, tDown + 1.2)) : 1;
      word(S, t, 'TOO MUCH', t0, { font: 'comic', y: 0.42, size: 0.36, until: lend(3) + 0.15, st: ST.comicW, anim: 'drop', shadow: true });
      word(S, t, 'COLOUR', burst, { font: 'comic', y: 0.0, size: 0.62 * tone, until: lend(3) + 0.15, st: ST.rainbow, anim: 'slam', breathe: 0.06 });
      D.lyric(S, c0 + 3, t, { range: [3, 7], font: 'comic', size: 0.2, maxW: 3.0, y: -0.6, style: 'fill', col: [1, 1, 1], col2: [0.05, 0, 0.08], outline: 4, anim: 'pop', hold: 0.15, upper: true });
      P.sat = 1.35; P.bloom = 0.9;
    }
    // ---------------- line 4: HEY! HEY! We couldn't get enough—
    else if (li === 4) {
      const h1 = tokT(c0 + 4, 0), h2 = tokT(c0 + 4, 1), w0 = tokT(c0 + 4, 2);
      chorusBg(S, t, v, c0, { boost: H.ramp(t, w0, lend(4), E.inQuad) * 10, low: -0.1 * H.ramp(t, w0, lend(4)) });
      const bursting = (t > h1 - 0.05 && t < h1 + 0.2) || (t > h2 - 0.05 && t < h2 + 0.2);
      if (bursting) S.bg('burst', { u_rays: 24, u_spin: t * 2, u_c1: vc.acc2, u_c2: [0.05, 0, 0.1], u_center: [t < h2 - 0.05 ? -0.6 : 0.6, 0.05], u_halftone: 1, u_alpha: 0.85 });
      word(S, t, 'HEY!', h1, { font: 'comic', x: -0.72, y: 0.12, size: 0.72, until: w0 + 0.3, st: ST.comic, anim: 'slam', rot: -0.12, shadow: true });
      word(S, t, 'HEY!', h2, { font: 'comic', x: 0.72, y: -0.02, size: 0.72, until: w0 + 0.3, st: ST.comicW, anim: 'slam', rot: 0.1, shadow: true });
      P.flash = [1, 1, 1, (H.pulse(t, h1, 0.09) + H.pulse(t, h2, 0.09)) * 0.45];
      P.zoom = 1 + (H.pulse(t, h1, 0.15) + H.pulse(t, h2, 0.15)) * 0.06 + k * 0.01;
      P.shake = H.shake((H.pulse(t, h1, 0.2) + H.pulse(t, h2, 0.2)) * 1.6, t);
      D.lyric(S, c0 + 4, t, { range: [2, 5], font: 'chrome', size: 0.2, maxW: 3.2, y: -0.62, style: 'chrome', col2: [0.03, 0, 0.1], outline: 3, glow: 3, anim: 'pop', hold: 0.2, upper: true });
      lasers(S, t, flat, 8, H.ramp(t, w0, lend(4)), [vc.acc, vc.acc2, C.white, C.yellow]);
      P.fb = { amt: 0.5 * H.ramp(t, w0, lend(4)), zoom: 1.02, rot: 0, decay: 0.8, hue: 0.02, dx: 0, dy: 0, mode: 0 };
    }
    // ---------------- line 5: (rewind handled globally) ... and TURN THE EIGHTIES UP!
    else {
      const tTurn = tokT(c0 + 5, 4), tUp = tokT(c0 + 5, 7);
      chorusBg(S, t, v, c0);
      const back = H.pulse(t, tTurn, 0.25);
      P.flash = [1, 1, 1, back * 0.8];
      knob(S, t, cam, 10, 0, 0.05, 1.3, 0.35, vc.acc);
      const hold = lend(5) + 0.3;
      word(S, t, 'TURN THE', tTurn, { y: 0.42, size: 0.3, until: hold, st: ST.chrome, anim: 'drop', shadow: true });
      word(S, t, 'EIGHTIES', tokT(c0 + 5, 6), { y: 0.02, size: 0.44, until: hold, st: v === 1 ? ST.neonCyan : ST.neonPink, anim: 'pop', breathe: 0.05 });
      word(S, t, 'UP!', tUp, { y: -0.52, size: 0.56, until: hold, st: v === 1 ? ST.hotCyan : ST.hot, anim: 'slam', breathe: 0.08 });
      const rb = S.batch();
      const rr = H.seg(t, tUp, tUp + 0.9);
      if (rr > 0 && rr < 1) { ring(rb, 0, -0.45, 0.2 + rr * 2.5, vc.acc, 0.012, 1 - rr); ring(rb, 0, -0.45, 0.1 + rr * 1.6, vc.acc2, 0.008, 1 - rr); }
      S.neon(rb, flat);
      if (t > tUp - 0.05) S.parts(cam, { mode: 'confetti', t0: tUp, count: 800, origin: [0, -0.4, 0], spread: 2.4, grav: 0.8, life: 2.6, size: 0.045, seed: 21 + v });
      lasers(S, t, flat, 6, 0.8, [vc.acc, vc.acc2, C.white]);
      P.shake = H.shake(H.pulse(t, tUp, 0.25) * 1.5, t);
    }
    if (v === 2) {
      const ca = li === 0 || li === 1 || li === 4 || li === 5 ? 1 : 0;
      carousel(S, t, cam, ca * 0.9);
      if (li === 0 || li === 1 || li === 5) fireworksAt(S, t, flat, 7);
      P.sat = 1.3;
    }
  }

  function postChorus(S, t) {
    if (t < 73.72) { chorus(S, t, 0); return; } // let the title slam land before the oh-oh-ohs
    const P = S.post;
    const k = H.kick(t, 0.12);
    const flat = H.flat();
    P.bloom = 1.0; P.sat = 1.2;
    const warp = H.ramp(t, 79.8, 81.38, E.inQuad);
    outrun(S, t, {
      u_speed: (t - 73.16) * 2.6 + warp * 18, u_pulse: k, u_roll: Math.sin(t * 0.6) * 0.07, u_camX: Math.sin(t * 0.4) * 0.8,
      u_sunY: 0.3 + 0.03 * Math.sin(t * 3), u_sunR: 0.42 + 0.02 * H.kick(t, 0.2), u_camH: 0.35 - warp * 0.15,
    });
    // six "oh"s = six rings + neon script
    const ohs = D.TOK[16].toks.map((x) => x.t0);
    const oh6 = [ohs[0], ohs[0] + 0.23, ohs[1], ohs[1] + 0.55, ohs[2], ohs[2] + 0.4];
    const rb = S.batch();
    oh6.forEach((o0, i) => { const r = H.seg(t, o0, o0 + 0.9); if (r > 0 && r < 1) ring(rb, 0, 0.26, 0.4 + r * 1.9, [C.pink, C.cyan, C.yellow][i % 3], 0.012, 1 - r); });
    S.neon(rb, flat, { intensity: 1.4 });
    word(S, t, 'Oh-oh-oh,', ohs[0] - 0.05, { font: 'script', y: 0.3, x: -0.35, size: 0.46, until: 77.3, st: ST.neonPink, anim: 'pop', rot: -0.06 });
    word(S, t, 'oh-oh-oh!', ohs[3 < ohs.length ? 3 : 1] || 75.66, { font: 'script', y: -0.15, x: 0.35, size: 0.46, until: 77.3, st: ST.neonCyan, anim: 'pop', rot: -0.06 });
    // neon title writes itself
    if (t > 77.3) {
      const nb = S.batch();
      const wr = H.ramp(t, 77.55, 79.7, E.inOutQuad);
      St.emit(nb, SH.titleOutline, null, 0, { from: 0, to: wr, revealGlobal: true, time: t, model: Mat.translate(0, 0.05, 0) });
      S.neon(nb, flat, { intensity: 1.5 * (1 - warp) });
      if (t > 79.3) word(S, t, 'UP!', 79.56, { y: -0.6, size: 0.3, until: 80.6, st: ST.hot, anim: 'slam' });
    }
    // time-travel sparks into verse 2
    if (warp > 0) {
      const cam = H.orbit(t, { amp: 0.3 });
      S.parts(cam, { mode: 'stars', count: 900, size: 0.03, speed: 6 + warp * 30, seed: 4 });
      const lb = S.batch();
      for (let i = 0; i < 5; i++) {
        const pts = []; let x = -1.7 + i * 0.85, y = 1.0;
        for (let q = 0; q < 9; q++) { pts.push([x, y, 0]); x += (R.hash(i * 31 + q + Math.floor(t * 20)) - 0.5) * 0.3; y -= 0.25; }
        St.emitRaw(lb, [{ p: pts, c: [0.6, 0.8, 1], w: 0.005 }], { alpha: warp * (R.hash(i + Math.floor(t * 15)) > 0.5 ? 1 : 0.2) });
      }
      S.neon(lb, flat, { intensity: 2 });
    }
    P.fb = { amt: 0.3 + warp * 0.5, zoom: 1.0 + warp * 0.04, rot: 0, decay: 0.82, hue: 0.02, dx: 0, dy: 0, mode: 0 };
    P.flash = [0.8, 0.9, 1, H.ramp(t, 80.9, 81.38, E.inCubic) * 0.9];
  }

  // rewind overlay (VHS REW)
  function rewindOverlay(S, t, u) {
    const P = S.post;
    P.vhs = 1; P.rewind = 0.8; P.scan = 0.18; P.sat = 0.85; P.vhsRoll = t * 3.0; P.exposure = 0.9;
    P.fb = { amt: 0.55, zoom: 1, rot: 0, decay: 1, hue: 0, dx: 0, dy: 0, mode: 2 };
    P.flash = [1, 1, 1, 0];
    P.shake = [0, 0]; P.zoom = 1;
    const bl = Math.floor(t * 4) % 2 ? 1 : 0.4;
    osd(S, 'REW', -1.45, 0.82, 0.13, 1);
    playTri(S, -1.62, 0.825, 0.07, bl, -1);
    playTri(S, -1.54, 0.825, 0.07, bl, -1);
    const tr = Math.max(0, Rn.time);
    const mm = Math.floor(tr / 60), ss = Math.floor(tr % 60);
    osd(S, 'SP  0:0' + mm + ':' + String(ss).padStart(2, '0'), 1.0, 0.82, 0.11, 0.9);
    D.lyric(S, [15, 33, 51][u], t, { font: 'vhs', size: 0.15, maxW: 3.0, y: 0.6, style: 'fill', col: [1, 1, 1], col2: [0, 0, 0], outline: 4, anim: 'type', hold: 0.1, layer: 'osd', until: [70.9, 135.0, 201.4][u], range: [0, 2] });
  }

  // ================================================================ VERSE 2 81.38 – 108.9 (full-colour object parade)
  // camera that matches the outrun shader's ground perspective (focal 1, horizon at u_hor)
  function roadCam(camX, camH, hor = -0.05) {
    return St.camera({ fov: Math.PI / 2, eye: [camX, camH, 0], at: [camX, camH - hor, -1], near: 0.02 });
  }
  function verse2Lyric(S, t, li, o = {}) {
    D.lyric(S, li, t, Object.assign({ font: 'comic', size: 0.15, maxW: 3.1, y: -0.76, style: 'fill', col: [1, 1, 1], col2: [0.03, 0, 0.06], outline: 5, anim: 'pop', hold: 0.35, layer: 'top' }, o));
  }

  function verse2(S, t) {
    const P = S.post;
    const flat = H.flat();
    P.sat = 1.2; P.bloom = 0.95; P.grain = 0.05;
    const k = H.kick(t, 0.12);

    // ---------- A: DeLorean tyres leaving fire in the street (81.38 – 85.9)
    if (t < 85.9) {
      const v = t - 81.38;
      const speed = v * 3 + v * v * 0.6;
      outrun(S, t, {
        u_speed: speed, u_road: 1, u_pulse: k * 0.5, u_camX: 0, u_camH: 0.3, u_sunY: 0.16, u_sunR: 0.3, u_mount: 1,
        u_skyTop: hex('#020312'), u_skyBot: hex('#1b0b3a'), u_sun1: hex('#ff9d00'), u_sun2: hex('#ff1f6b'), u_gridCol: hex('#1f51ff'), u_horGlow: hex('#ff2a6d'),
      });
      const cam = roadCam(0, 0.3);
      const tGone = H.w('DeLorean', 'street');
      const away = E.inQuad(H.seg(t, 82.6, tGone));
      const carZ = -1.6 - away * 6.5;
      const carVis = t < tGone ? 1 : 0;
      const nb = S.batch();
      const sc = 0.62;
      const carM = Mat.mul(Mat.translate(0, 0.55 * sc - 0.3 + 0.3, carZ), Mat.scale(sc, sc, sc));
      // car sits on the ground plane (y = 0 relative to camera height 0.3)
      const carModel = Mat.mul(Mat.translate(0, -0.3 + 0.55 * sc, carZ), Mat.scale(sc, sc, sc));
      void carM;
      if (carVis) St.emit(nb, SH.car, null, 0, { model: carModel, time: t });
      // fire trails: flickering strands along two tyre tracks
      const trailEnd = carVis ? carZ : -1.6 - 6.5;
      const burn = H.ramp(t, 82.9, 83.6);
      if (burn > 0) {
        for (const side of [-0.45, 0.45]) {
          for (let s2 = 0; s2 < 3; s2++) {
            const pts = [];
            const n = 28;
            for (let q = 0; q <= n; q++) {
              const z = M.mix(-0.4, trailEnd, q / n);
              const fl = R.perlin3(q * 0.7, s2 * 3.1 + side * 5, t * 6) * 0.05 + R.perlin3(q * 2.1, s2, t * 11) * 0.02;
              pts.push([side * sc + fl, -0.3 + Math.abs(R.perlin3(q * 0.9, s2 + 7, t * 8)) * (0.12 + s2 * 0.05), z]);
            }
            St.emitRaw(nb, [{ p: pts, c: [C.orange, C.yellow, C.red][s2], w: 0.012 - s2 * 0.003 }], { alpha: burn * (0.7 + 0.3 * R.hash(Math.floor(t * 20) + s2)) });
          }
        }
        S.parts(cam, { mode: 'sparks', count: 500, origin: [-0.45 * sc, -0.29, -0.6], origin2: [-0.45 * sc, -0.29, trailEnd], spread: 0.4, grav: 0.8, life: 0.8, size: 0.018, seed: 2 });
        S.parts(cam, { mode: 'sparks', count: 500, origin: [0.45 * sc, -0.29, -0.6], origin2: [0.45 * sc, -0.29, trailEnd], spread: 0.4, grav: 0.8, life: 0.8, size: 0.018, seed: 5 });
      }
      // time-travel electricity around the car, then it vanishes in a flash
      if (t > tGone - 0.9 && t < tGone + 0.1) {
        for (let i = 0; i < 6; i++) {
          const pts = []; let x = (R.hash(i + Math.floor(t * 18)) - 0.5) * 1.4 * sc, y = 0.5 * sc - 0.3 + 0.2, z = carZ;
          for (let q = 0; q < 7; q++) { pts.push([x, y, z]); x += (R.hash(i * 7 + q + Math.floor(t * 24)) - 0.5) * 0.2; y -= 0.09; }
          St.emitRaw(nb, [{ p: pts, c: [0.55, 0.8, 1], w: 0.006 }]);
        }
      }
      S.neon(nb, cam, { intensity: 1.4 });
      P.flash = [0.85, 0.92, 1, H.pulse(t, tGone, 0.22) * 0.9];
      // 88 MPH readout
      const mph = Math.min(88, Math.floor(E.inQuad(H.seg(t, 82.2, tGone)) * 88));
      if (t > 82.2 && t < tGone + 0.6) S.text(D.txt('pixel', String(mph).padStart(2, '0') + ' MPH', 0.07), { style: 'fill', col: [1, 0.2, 0.15], glowCol: [1, 0.1, 0.05], glow: 3, intensity: 1.5, model: Mat.translate(1.25, 0.8, 0), alpha: mph >= 88 ? (Math.floor(t * 8) % 2 ? 1 : 0.3) : 0.9 });
      P.fb = { amt: 0.35, zoom: 1.004, rot: 0, decay: 0.8, hue: 0, dx: 0, dy: 0, mode: 0 };
      verse2Lyric(S, t, 18, { col: [1, 0.9, 0.6] });
      P.shake = H.shake(k * 0.4, t);
      return;
    }

    // ---------- B: Kids trying moonwalks, staring at their feet (85.9 – 89.7)
    if (t < 89.7) {
      const stare = H.ramp(t, H.w('Kids trying', 'staring') - 0.2, 88.6, E.inOutCubic);
      const pitch = M.mix(0.34, 0.8, stare), camY = M.mix(0.95, 1.7, stare);
      const eye = [Math.sin(t * 0.4) * 0.25 + (1.3 - (t - 85.9) * 1.1) * 0.6, camY, M.mix(2.3, 1.6, stare)];
      const bp = T.beatPos(t);
      const travel = -(t - 85.9) * 1.1;             // dancer glides backwards (to the left)
      const stepPh = M.fract(bp * 0.5);             // one step per beat
      const footA = stepPh < 0.5, sl = E.inOutQuad((stepPh % 0.5) * 2);
      const baseX = 1.3 + travel;
      const ax = baseX + (footA ? 0.5 - sl * 1.0 : -0.5), bx = baseX + (footA ? -0.5 : 0.5 - sl * 1.0);
      const feet = new Float32Array(16);
      feet.set([ax + 0.2, -0.2, 1.0, 0, bx + 0.25, 0.25, 1.0, 0]);
      S.bg('tiles', { u_cam: eye, u_pitch: pitch, u_yaw: 0, u_feet: feet, u_pattern: 0.7, u_gridScroll: 0 });
      const fw = [0, -Math.sin(pitch), -Math.cos(pitch)];
      const cam = St.camera({ fov: 2 * Math.atan(1 / 1.8), eye, at: [eye[0] + fw[0], eye[1] + fw[1], eye[2] + fw[2]] });
      const nb = S.batch();
      // sneaker on the floor (y=0) in the x/y plane at z; the lifted foot rolls onto its toe
      const shoe = (x, z, toe, col) => {
        const m = Mat.chain(Mat.translate(x + 0.42, 0, z), Mat.rotZ(toe), Mat.translate(-0.42, 0.22, 0), Mat.scale(1.0, 1.0, 1.0));
        St.emit(nb, SH.sneaker, null, 0, { model: m, color: col, time: t });
      };
      shoe(ax, -0.2, footA ? 0 : 0.35, C.cyan);
      shoe(bx, 0.25, footA ? 0.35 : 0, C.pink);
      S.neon(nb, cam, { intensity: 1.5 });
      P.fb = { amt: 0.25, zoom: 1, rot: 0, decay: 0.75, hue: 0, dx: 0, dy: 0, mode: 0 };
      P.flash = [1, 1, 1, H.pulse(t, 85.9, 0.15) * 0.5];
      verse2Lyric(S, t, 19, { col: [0.7, 1, 1] });
      return;
    }

    // ---------- C: Madonna lace and a purple guitar (89.7 – 92.5)
    if (t < 92.5) {
      const tg = H.w('Madonna lace', 'purple');
      const grow = H.ramp(t, 89.7, 91.2, E.outCubic) * 1.25;
      S.bg('lace', { u_grow: grow, u_rot: t * 0.15, u_sym: 12, u_zoom: 1 + H.ramp(t, 89.7, 92.5) * 0.4, u_col: [1, 0.85, 0.95], u_bgc: [0.06, 0.0, 0.07] });
      const rain = H.ramp(t, tg - 0.3, tg + 0.5);
      S.bg('rain', { u_amt: 1.6, u_speed: 3.0, u_col: [0.75, 0.3, 1.0], u_bgTop: [0.12, 0.0, 0.22], u_bgBot: [0.3, 0.05, 0.4], u_alpha: rain * 0.75 });
      if (t > tg - 0.2) {
        const a = E.outBack(H.seg(t, tg - 0.2, tg + 0.45), 1.4);
        const nb = S.batch();
        const m = Mat.chain(Mat.translate(M.mix(2.8, 0.55, a), -0.15, 0), Mat.rotZ(M.mix(-1.2, -0.45, a) + Math.sin(t * 2) * 0.04), Mat.scale(0.62, 0.62, 0.62), Mat.translate(0, -0.6, 0));
        St.emit(nb, SH.guitar, null, 0, { model: m, color: [0.7, 0.3, 1], time: t });
        S.neon(nb, flat, { intensity: 1.6 });
      }
      P.sat = 1.3;
      verse2Lyric(S, t, 20, { col: [1, 0.85, 1], col2: [0.2, 0, 0.3] });
      return;
    }

    // ---------- D: A mirror and a hairbrush made a superstar (92.5 – 95.9)
    if (t < 95.9) {
      const tSup = H.w('A mirror', 'superstar');
      const star = t > tSup - 0.05;
      if (star) S.bg('burst', { u_rays: 20, u_spin: t * 0.8, u_c1: hex('#c2185b'), u_c2: hex('#f5a300'), u_center: [0, 0.05], u_halftone: 1 });
      else S.bg('void', { u_c1: hex('#3a0b4a'), u_c2: hex('#07010f'), u_stars: 0.4, u_warp: 0.3, u_grid: 0 });
      const cam = H.orbit(t, { amp: 0.4, z: 3.1 });
      const nb = S.batch();
      const mz = star ? 1 - E.inBack(H.seg(t, tSup - 0.05, tSup + 0.35)) : 1;
      const mm = Mat.chain(Mat.translate(-0.3, 0.08, 0), Mat.scale(0.95 * mz, 0.95 * mz, 1));
      if (mz > 0.01) {
        St.emit(nb, SH.mirror, null, 0, { model: mm, time: t });
        const bulbs = Sh.bulbs();
        const chase = Math.floor(T.beatPos(t) * 2);
        bulbs.forEach(([x, y], i) => { const on = (i + chase) % 3 === 0 ? 1 : 0.35; St.emitRaw(nb, [{ p: Sh.circ(x, y, 0.035, 10), c: C.yellow, w: 0.012, closed: true }], { model: mm, alpha: on }); });
        const hb = E.outBack(H.seg(t, H.w('A mirror', 'hairbrush') - 0.3, H.w('A mirror', 'hairbrush') + 0.2));
        if (hb > 0) St.emit(nb, SH.hairbrush, null, 0, { model: Mat.chain(Mat.translate(M.mix(2.5, 0.95, hb), -0.1, 0.2), Mat.rotZ(0.35 + Math.sin(t * 3) * 0.05), Mat.scale(0.7, 0.7, 0.7)), time: t });
      }
      if (star) {
        const sa = E.outBack(H.seg(t, tSup, tSup + 0.35), 2);
        St.emit(nb, SH.star, null, 0, { model: Mat.chain(Mat.translate(0, 0.12, 0), Mat.rotZ(t * 0.6), Mat.scale(0.62 * sa, 0.62 * sa, 1)), time: t, alpha: 0.85 });
        S.parts(cam, { mode: 'sparkle', t0: tSup, count: 160, origin: [0, 0.1, 0], spread: 1.1, size: 0.06, seed: 9 });
        word(S, t, 'SUPERSTAR', tSup, { y: -0.35, size: 0.3, st: ST.chrome, anim: 'slam', shadow: true });
        P.flash = [1, 1, 1, H.pulse(t, tSup, 0.1) * 0.5 + H.pulse(t, tSup + 0.62, 0.06) * 0.25];
      }
      S.neon(nb, cam, { intensity: 1.4 });
      verse2Lyric(S, t, 21, { col: [1, 0.95, 0.5], range: [0, 5] });
      return;
    }

    // ---------- E: Fluoro leg warmers, a stonewashed vest (95.9 – 98.95)
    if (t < 98.95) {
      const tSw = H.w('Fluoro leg', 'stonewashed');
      S.bg('stripes', { u_scroll: t * 1.6, u_bend: 1, u_scrunch: 0.8 + k, u_denim: t > tSw - 0.4 ? 1 : 0, u_mixp: M.mix(-0.25, 1.25, H.ramp(t, tSw - 0.35, tSw + 0.4)) });
      word(S, t, 'FLUORO!', 96.0, { font: 'comic', y: 0.2, size: 0.55, until: tSw - 0.1, st: ST.comicW, anim: 'slam', rot: -0.08, shadow: true, breathe: 0.08 });
      word(S, t, 'STONEWASHED', tSw, { font: 'chrome', y: 0.1, size: 0.3, st: ST.chrome, anim: 'left', shadow: true });
      P.sat = 1.25;
      verse2Lyric(S, t, 22);
      return;
    }

    // ---------- F: Whoever had the biggest fringe was looking their best (98.95 – 102.45)
    if (t < 102.45) {
      S.bg('void', { u_c1: hex('#ff4fa0'), u_c2: hex('#3b0a5e'), u_stars: 0, u_warp: 0, u_grid: 0.4 });
      const tb = H.w('Whoever had', 'biggest');
      const blow = E.outCubic(H.seg(t, tb, tb + 0.6)) * (1 - H.seg(t, tb + 1.4, tb + 2.2));
      const drop = E.outBounce(H.seg(t, 99.0, 99.8));
      const nb = S.batch(), strokes = [];
      const n = 110;
      for (let j = 0; j < n; j++) {
        const f = j / (n - 1);
        const x0 = M.mix(-1.9, 1.9, f);
        const len = (0.9 + 0.6 * Math.sin(f * Math.PI) + R.hash(j) * 0.25) * drop;
        const pts = [];
        for (let q = 0; q <= 14; q++) {
          const s = q / 14;
          const sway = R.perlin3(j * 0.21, s * 1.3, t * 0.9) * 0.25 * s + blow * s * s * 0.9 * (0.6 + 0.4 * R.hash(j + 3));
          const curl = Math.sin(s * 3 + j) * 0.02;
          pts.push([x0 + sway + curl + (f - 0.5) * s * 0.5, 1.15 - s * len, 0]);
        }
        strokes.push({ p: pts, c: M.hsv(0.12 + f * 0.1 + Math.sin(t + f * 3) * 0.02, 0.35 + 0.4 * R.hash(j + 9), 1), w: 0.006 });
      }
      St.emitRaw(nb, strokes);
      S.neon(nb, flat, { intensity: 1.25 });
      word(S, t, 'BIGGEST', tb, { font: 'comic', y: -0.12, size: 0.45, until: 101.5, st: ST.comic, anim: 'slam', rot: -0.05, shadow: true });
      word(S, t, 'FRINGE', H.w('Whoever had', 'fringe'), { font: 'comic', y: -0.46, size: 0.34, until: 101.5, st: ST.comicW, anim: 'pop', rot: 0.04, shadow: true });
      verse2Lyric(S, t, 23, { col: [1, 0.9, 1] });
      return;
    }

    // ---------- G/H: Polaroid faces slowly coming clear / we looked ridiculous (102.45 – 108.9)
    {
      S.bg('void', { u_c1: hex('#2a1238'), u_c2: hex('#0a0510'), u_stars: 0.2, u_warp: 0.1, u_grid: 0 });
      const portrait = S.capture((S2, tt) => {
        S2.bg('burst', { u_rays: 16, u_spin: tt * 0.3, u_c1: hex('#05d9e8'), u_c2: hex('#ff2a6d'), u_center: [0, 0], u_halftone: 1 });
        const b = S2.batch();
        St.emit(b, SH.face, null, 0, { model: Mat.scale(1.1, 1.1, 1), time: tt, color: [1, 1, 1] });
        S2.solid(b, St.flatCam(), { minPx: 1.5, glow: 1.3 });
      }, t, 'capA');
      const tp = H.w('Polaroid faces', 'polaroid'), tc = H.w('Polaroid faces', 'clear');
      const dev = H.ramp(t, tp + 0.2, tc + 0.4, (x) => x);
      const tr = H.w('We looked', 'ridiculous');
      const scatter = E.outCubic(H.seg(t, 105.3, 106.3));
      const cam = H.orbit(t, { amp: 0.3, z: 3.2 });
      const cards = [
        [0, 0.05, 0, -0.08, 1.0, [0, 0, 1, 1]],
        [-1.15, 0.2, -0.3, 0.25, 0.8, [0.1, 0.1, 0.8, 0.8]],
        [1.15, 0.15, -0.3, -0.3, 0.8, [0.2, 0.0, 1.0, 0.9]],
        [-0.7, -0.45, -0.2, -0.2, 0.7, [0.0, 0.2, 0.7, 1.0]],
        [0.75, -0.5, -0.2, 0.18, 0.7, [0.3, 0.3, 1.0, 1.0]],
      ];
      cards.forEach(([x, y, z, r, s], i) => {
        if (i > 0 && scatter <= 0) return;
        const k2 = i === 0 ? 1 : scatter;
        const wob = t > tr ? Math.sin((t - tr) * 9 + i) * 0.12 * Math.exp(-(t - tr) * 1.5) : 0;
        const fly = E.inCubic(H.seg(t, 107.9, 108.9));
        const m = Mat.chain(Mat.translate(x * k2 * (1 + fly * 2), y * k2 + fly * (i % 2 ? 2 : -2), z + fly * 2), Mat.rotZ(r * k2 + wob + (i === 0 ? Math.sin(t * 0.7) * 0.05 : 0)), Mat.rotY(i === 0 ? Math.sin(t * 0.5) * 0.25 : 0), Mat.scale(s, s, s));
        S.card(cam, { tex: portrait, mode: 'polaroid', develop: i === 0 ? dev : 1, model: m, size: [1.0, 1.2], crop: cards[i][5], alpha: 1 }, 'over');
      });
      if (t > tr - 0.05) word(S, t, 'RIDICULOUS!', tr, { font: 'comic', y: -0.72, size: 0.32, until: 107.0, st: ST.comic, anim: 'pop', rot: -0.05, shadow: true, anim2: (g, i) => ({ y: Math.sin(t * 10 + i * 0.8) * 0.03, rot: Math.sin(t * 7 + i) * 0.1 }) });
      if (t > 107.0) {
        const nb = S.batch();
        const g = E.outBack(H.seg(t, 107.1, 107.6));
        St.emit(nb, SH.shades, null, 0, { model: Mat.chain(Mat.translate(0, 0.62, 0.3), Mat.scale(0.55 * g, 0.55 * g, 1)), time: t });
        S.neon(nb, flat, { intensity: 1.4 });
      }
      verse2Lyric(S, t, 24, { col: [1, 0.95, 0.85] });
      if (t > 105.2) verse2Lyric(S, t, 25, { range: [3, 6], col: [0.6, 1, 1] });
      P.fb = { amt: 0, zoom: 1, rot: 0, decay: 0.8, hue: 0, dx: 0, dy: 0, mode: 0 };
      P.flash = [1, 1, 1, H.pulse(t, tp, 0.12) * 0.6];
    }
  }

  // ================================================================ PRE-CHORUS 2 108.9 – 115.84 (Rubik's cube)
  let RUBIK;
  function buildRubik() {
    // moves: [axis 0|1|2, layer -1|0|1, dir ±1, start time]; quarter turns on beats
    const beats = T.beats.filter((b) => b > 109.0 && b < 114.7);
    const rng = R.rng(1980);
    const moves = beats.map((b, i) => [Math.floor(rng() * 3), [-1, 1, 0][Math.floor(rng() * 2.2) % 3], rng() < 0.5 ? 1 : -1, b - 0.05, i]);
    // cubie state: pos (int vec3) + orientation mat (3x3 row-major)
    const cub = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) cub.push({ p0: [x, y, z], p: [x, y, z], R: [1, 0, 0, 0, 1, 0, 0, 0, 1] });
    const rotM = (axis, ang) => {
      const c = Math.round(Math.cos(ang)), s = Math.round(Math.sin(ang));
      if (axis === 0) return [1, 0, 0, 0, c, -s, 0, s, c];
      if (axis === 1) return [c, 0, s, 0, 1, 0, -s, 0, c];
      return [c, -s, 0, s, c, 0, 0, 0, 1];
    };
    const mul3 = (A, B) => { const o = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]); return o; };
    const mv3 = (A, v) => [A[0] * v[0] + A[1] * v[1] + A[2] * v[2], A[3] * v[0] + A[4] * v[1] + A[5] * v[2], A[6] * v[0] + A[7] * v[1] + A[8] * v[2]];
    const states = [cub.map((c) => ({ p: c.p.slice(), R: c.R.slice() }))];
    for (const [axis, layer, dir] of moves) {
      const prev = states[states.length - 1];
      const Rm = rotM(axis, (dir * Math.PI) / 2);
      states.push(prev.map((c) => (c.p[axis] === layer ? { p: mv3(Rm, c.p).map(Math.round), R: mul3(Rm, c.R) } : { p: c.p.slice(), R: c.R.slice() })));
    }
    RUBIK = { moves, states, cub, mul3 };
  }
  const RCOL = [hex('#d4102b'), hex('#ff7a00'), hex('#ffffff'), hex('#ffd500'), hex('#009e4f'), hex('#0046ad')]; // +x -x +y -y +z -z
  function rubikModels(t, explode) {
    const { moves, states, cub } = RUBIK;
    let mi = 0;
    while (mi < moves.length && t >= moves[mi][3] + 0.22) mi++;
    const st = states[mi];
    const cur = moves[mi];
    const out = [];
    for (let i = 0; i < cub.length; i++) {
      const c = st[i];
      // base transform from state
      const Rm = c.R;
      let m = new Float32Array([Rm[0], Rm[3], Rm[6], 0, Rm[1], Rm[4], Rm[7], 0, Rm[2], Rm[5], Rm[8], 0, 0, 0, 0, 1]);
      const pos = c.p.map((v) => v * (1.04 + explode * (1.5 + R.hash(i) * 2)));
      m = Mat.mul(Mat.translate(pos[0], pos[1], pos[2]), m);
      if (explode > 0) m = Mat.chain(m, Mat.rotX(explode * (R.hash(i + 1) - 0.5) * 6), Mat.rotY(explode * (R.hash(i + 2) - 0.5) * 6));
      if (cur && t > cur[3] && c.p[cur[0]] === cur[1]) {
        const k = E.outBack(M.clamp((t - cur[3]) / 0.22), 1.3);
        const ang = cur[2] * (Math.PI / 2) * k;
        const rm = cur[0] === 0 ? Mat.rotX(ang) : cur[0] === 1 ? Mat.rotY(ang) : Mat.rotZ(ang);
        m = Mat.mul(rm, m);
      }
      // outer faces get colours based on the solved position
      const p0 = cub[i].p0;
      const cols = [p0[0] === 1 ? RCOL[0] : null, p0[0] === -1 ? RCOL[1] : null, p0[1] === 1 ? RCOL[2] : null, p0[1] === -1 ? RCOL[3] : null, p0[2] === 1 ? RCOL[4] : null, p0[2] === -1 ? RCOL[5] : null].map((c) => c || [0, 0, 0]);
      out.push({ m, cols, i });
    }
    return out;
  }
  function pre2(S, t) {
    const P = S.post;
    const k = H.kick(t, 0.12);
    S.bg('memphis', { u_scroll: t * 0.15, u_density: 0.35, u_dark: 1, u_bgc: [0.03, 0.01, 0.07] });
    const explode = E.inCubic(H.seg(t, 114.7, 115.84));
    const spin = t * 0.7 + H.ramp(t, 112.4, 115.8, E.inQuad) * 6;
    const cam = St.camera({ eye: [Math.sin(spin) * 5.2, 2.6 + Math.sin(t * 0.5) * 0.6, Math.cos(spin) * 5.2], at: [0, 0, 0], fov: 0.72 + explode * 0.4 });
    const sc = 0.62 * (1 + k * 0.03) * (0.8 + 0.2 * E.outBack(H.seg(t, 108.9, 109.5)));
    const tSt = H.w('Rubik', 'sticker');
    for (const c of rubikModels(t, explode)) {
      const cols = c.cols.slice();
      // the "cheat": one sticker lifted off the front face while it is re-stuck elsewhere
      if (c.i === 26 && t > tSt - 0.1 && t < tSt + 1.3) cols[4] = [0, 0, 0];
      S.box(cam, { model: Mat.mul(Mat.scale(sc, sc, sc), c.m), cols, sticker: 1, edge: 0.4, edgeCol: [1, 0.2, 0.8], amb: [0.35, 0.32, 0.4] });
    }
    if (t > tSt - 0.1 && t < tSt + 1.3) {
      const u = H.seg(t, tSt - 0.1, tSt + 1.3);
      const pz = Mat.chain(Mat.scale(sc, sc, sc), Mat.translate(1.04, 1.04, 1.52 + Math.sin(u * Math.PI) * 2.2), Mat.rotZ(u * 9), Mat.rotX(u * 5));
      S.card(cam, { mode: 'flat', tint: RCOL[4], model: pz, size: [0.8, 0.8], alpha: 1 }, 'scene');
    }
    // question marks for "nobody cool had a single clue"
    const tq = H.w('Nobody cool', 'nobody');
    if (t > tq) {
      for (let i = 0; i < 6; i++) {
        const t0 = tq + i * 0.32;
        const a = E.outBack(H.seg(t, t0, t0 + 0.3), 2.5);
        if (a <= 0) continue;
        const x = [-1.3, 1.25, -0.9, 1.4, -1.45, 0.95][i], y = [0.55, 0.5, -0.4, -0.2, 0.05, 0.75][i];
        S.text(D.txt('comic', '?', 0.5), { style: 'fill', col: [C.yellow, C.pink, C.cyan][i % 3], col2: [0.02, 0, 0.05], outline: 5, model: Mat.chain(Mat.translate(x, y, 0), Mat.rotZ(Math.sin(t * 3 + i) * 0.3), Mat.scale(a, a, 1)) });
      }
    }
    D.lyric(S, 26, t, { font: 'comic', size: 0.15, maxW: 3.1, y: -0.78, style: 'fill', col: [1, 1, 1], col2: [0.03, 0, 0.06], outline: 5, anim: 'pop', hold: 0.3, layer: 'top' });
    D.lyric(S, 27, t, { font: 'comic', size: 0.17, maxW: 3.1, y: -0.78, style: 'fill', col: [1, 0.95, 0.3], col2: [0.03, 0, 0.06], outline: 5, anim: 'pop', hold: 0.3, layer: 'top' });
    const up = H.ramp(t, 114.2, 115.84, E.inQuad);
    P.fb = { amt: 0.55 * up, zoom: 1.0 + 0.04 * up, rot: 0.01 * up, decay: 0.84, hue: 0.02, dx: 0, dy: 0, mode: 0 };
    P.flash = [1, 1, 1, H.ramp(t, 115.45, 115.84, E.inCubic) * 0.85 + H.pulse(t, 108.9, 0.2) * 0.5];
    P.sat = 1.2; P.bloom = 0.8;
  }

  // ================================================================ BRIDGE 137.9 – 166.44 (VHS nights)
  let COVERS = [];
  function makeCovers() {
    const defs = [
      { title: 'STAR\nBLASTERS', c1: '#1b0b52', c2: '#ff2a6d', ink: '#ffd319', art: 'planet' },
      { title: 'MIDNIGHT\nMALL', c1: '#062a3a', c2: '#05d9e8', ink: '#ff3cac', art: 'grid' },
      { title: 'ROBO\nSURF', c1: '#3a0b24', c2: '#ffd319', ink: '#05d9e8', art: 'sun' },
    ];
    COVERS = defs.map((d) => {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 448;
      const g = cv.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 448);
      gr.addColorStop(0, d.c1); gr.addColorStop(1, '#000');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 448);
      g.strokeStyle = d.c2; g.lineWidth = 3;
      if (d.art === 'planet') { g.beginPath(); g.arc(128, 250, 70, 0, 7); g.fillStyle = d.c2; g.fill(); g.beginPath(); g.ellipse(128, 250, 120, 26, -0.3, 0, 7); g.stroke(); }
      if (d.art === 'grid') { for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(128, 200); g.lineTo(-100 + i * 57, 448); g.stroke(); } for (let j = 0; j < 6; j++) { const y = 210 + j * j * 7; g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } }
      if (d.art === 'sun') { g.fillStyle = d.c2; g.beginPath(); g.arc(128, 260, 80, Math.PI, 0); g.fill(); g.fillStyle = d.c1; for (let i = 0; i < 5; i++) g.fillRect(40, 205 + i * 12, 176, 4 + i); }
      g.fillStyle = d.ink; g.font = '64px "Bangers", sans-serif'; g.textAlign = 'center';
      d.title.split('\n').forEach((line, i) => g.fillText(line, 128, 80 + i * 62));
      g.fillStyle = '#fff'; g.font = '22px "VT323", monospace'; g.fillText('RATED RAD  ·  VHS', 128, 425);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(6, 6, 244, 436);
      return V.G.canvasTex(cv);
    });
  }
  function tvScreen(S, t, fn) { return S.capture(fn, t, 'capA'); }
  function tvroom(S, t, scr, o = {}) {
    S.bg('tvroom', {
      u_screen: scr, u_tv: [o.x == null ? 0 : o.x, o.y == null ? 0.05 : o.y, o.scale || 0.78], u_on: o.on == null ? 1 : o.on, u_static: o.stat || 0,
      u_glowAmt: o.glow == null ? 1 : o.glow, u_blue: o.blue || 0, u_roll: o.roll || 0, u_wall: o.wall || [0.08, 0.06, 0.12],
    });
  }
  function blueScreen(S2, tt, lines) {
    S2.bg('void', { u_c1: [0.05, 0.12, 0.8], u_c2: [0.02, 0.06, 0.6], u_stars: 0, u_warp: 0, u_grid: 0 });
    lines.forEach(([str, x, y, sz]) => S2.text(D.txt('vhs', str, sz, { align: 'left' }), { style: 'fill', col: [1, 1, 1], col2: [0, 0, 0.2], outline: 2, model: Mat.translate(x, y, 0) }));
  }
  function bridgeLyric(S, t, li, o = {}) {
    // closed-caption style: white VHS text on a black box
    const r = D.lyricLayout(li, 'vhs', 0.145, 3.1);
    const L = T.lines[li];
    const a = H.env(t, L.s - 0.15, L.e + 0.5, 0.1, 0.25);
    if (a <= 0) return;
    const y = o.y == null ? -0.8 : o.y;
    S.card(H.flat(), { mode: 'flat', tint: [0, 0, 0], model: Mat.translate(0, y - 0.01, 0), size: [r.L.width * r.fit + 0.12, r.L.height * r.fit + 0.06], alpha: a * 0.8 }, 'top');
    D.lyric(S, li, t, { font: 'vhs', size: 0.145, maxW: 3.1, y, style: 'fill', col: [1, 1, 1], col2: [0, 0, 0], anim: 'type', hold: 0.5, layer: 'top', charStagger: 0.01 });
  }
  function bridge(S, t) {
    const P = S.post;
    const flat = H.flat();
    P.grain = 0.07; P.scan = 0.1; P.bloom = 0.85;
    const k = H.kick(t, 0.12);

    // 137.9 – 140.27: pull back out of the chorus into a TV in a dark room; static; blue screen
    if (t < 140.2) {
      const pb = E.inOutCubic(H.seg(t, 137.9, 139.6));
      const scr = tvScreen(S, t, (S2, tt) => chorus(S2, Math.min(tt, 137.85), 1));
      tvroom(S, t, scr, { scale: M.mix(3.3, 0.78, pb), stat: H.ramp(t, 139.3, 139.7) * (1 - H.ramp(t, 139.9, 140.1)), blue: H.ramp(t, 139.9, 140.05) });
      P.fb = { amt: 0.3 * (1 - pb), zoom: 0.99, rot: 0, decay: 0.8, hue: 0, dx: 0, dy: 0, mode: 0 };
      return;
    }
    // 140.2 – 143.4: Be kind, rewind — the weekend's here
    if (t < 143.4) {
      const tr = Math.max(0, 5025 - (t - 140.2) * 900);
      const cnt = Math.floor(tr / 3600) + ':' + String(Math.floor((tr % 3600) / 60)).padStart(2, '0') + ':' + String(Math.floor(tr % 60)).padStart(2, '0');
      const scr = tvScreen(S, t, (S2, tt) => blueScreen(S2, tt, [['<< REWIND', -1.5, 0.72, 0.2], ['0' + cnt, 0.55, 0.72, 0.2], ['BE KIND,', -0.55, 0.05, 0.34], ['REWIND', -0.5, -0.35, 0.34]]));
      tvroom(S, t, scr, { scale: 0.78, blue: 0, glow: 1.3 });
      // neon WEEKEND sign on the wall
      const tw = H.w('Be kind', 'weekend');
      const sign = flicker(t, tw - 0.1, 4, 0.5);
      if (t > tw - 0.1) S.text(D.txt('neon', 'WEEKEND', 0.12), { style: 'fill', col: [1, 0.3, 0.7], col2: [0.1, 0, 0.1], outline: 2, glow: 5, glowCol: [1, 0.1, 0.5], intensity: 1.4, model: Mat.chain(Mat.translate(-1.36, 0.42, 0), Mat.rotZ(0.06)), alpha: sign });
      bridgeLyric(S, t, 34);
      return;
    }
    // 143.4 – 146.6: three rented movies and a beanbag chair
    if (t < 146.6) {
      const scr = tvScreen(S, t, (S2, tt) => blueScreen(S2, tt, [['PLAY >', -1.5, 0.72, 0.2], ['SP', 1.2, 0.72, 0.2]]));
      tvroom(S, t, scr, { scale: 0.78, blue: 0, glow: 1.2, wall: [0.1, 0.07, 0.14] });
      const cam = H.orbit(t, { amp: 0.25, z: 3.2 });
      const tm = H.w('Three rented', 'movies');
      for (let i = 0; i < 3; i++) {
        const a = E.outBack(H.seg(t, H.w('Three rented', 'three') + i * 0.25, H.w('Three rented', 'three') + i * 0.25 + 0.5), 1.4);
        if (a <= 0) continue;
        const fan = (i - 1) * 0.72;
        const m = Mat.chain(Mat.translate(fan * a, -0.28 + (1 - a) * -1.5, 0.9), Mat.rotY(-fan * 0.5 + Math.sin(t * 1.2 + i) * 0.1), Mat.rotZ(-fan * 0.12), Mat.scale(0.46, 0.8, 0.12));
        S.box(cam, { model: m, cols: [[0.05, 0.05, 0.08], [0.05, 0.05, 0.08], [0.05, 0.05, 0.08], [0.05, 0.05, 0.08], [1, 1, 1], [0.05, 0.05, 0.08]], tex: COVERS[i], texMask: [0, 0, 0, 0, 1, 0], edge: 0.35, edgeCol: [C.pink, C.cyan, C.yellow][i], amb: [0.55, 0.5, 0.6] });
      }
      void tm;
      // beanbag: squishy neon blob
      const tb = H.w('Three rented', 'beanbag');
      if (t > tb - 0.2) {
        const g = E.outElastic(H.seg(t, tb - 0.2, tb + 0.8));
        const sq = 1 + k * 0.15;
        const pts = [];
        for (let i = 0; i < 12; i++) { const a = (i / 12) * M.TAU; const r = 0.42 + 0.06 * Math.sin(a * 3 + t * 2); pts.push([Math.cos(a) * r * sq, Math.sin(a) * r * 0.6 / sq - (Math.sin(a) < 0 ? 0.08 : 0), 0]); }
        const nb = S.batch();
        St.emitRaw(nb, [{ p: Sh.spline(pts, 6, true), c: C.orange, w: 0.012, closed: true }], { model: Mat.chain(Mat.translate(-1.25, -0.72, 0), Mat.scale(g, g, 1)) });
        S.neon(nb, flat, { intensity: 1.3 });
      }
      bridgeLyric(S, t, 35);
      return;
    }
    // 146.6 – 149.6: tracking lines rolling through the opening scene
    if (t < 149.6) {
      const tt0 = 7.2 + (t - 146.6);
      const scr = tvScreen(S, t, (S2) => intro(S2, tt0));
      const roll = M.fract((t - 146.6) * 0.45) * (t < 148.8 ? 1 : 0);
      tvroom(S, t, scr, { scale: 0.78 + H.ramp(t, 146.6, 149.6) * 0.1, stat: 0.08 + 0.1 * R.hash(Math.floor(t * 12)), roll, glow: 1.3 });
      P.vhs = 0.75; P.vhsRoll = t * 0.4;
      bridgeLyric(S, t, 36);
      return;
    }
    // 149.6 – 153.05: whole worlds on a fourteen-inch screen (dolly into the set and back)
    if (t < 153.05) {
      const tIn = E.inOutCubic(H.seg(t, 149.6, 150.7)), tOut = E.inOutCubic(H.seg(t, 151.7, 152.9));
      const sc = M.mix(0.88, 3.6, tIn * (1 - tOut));
      const world = (S2, tt) => {
        const w2 = H.seg(tt, 150.3, 151.6);
        S2.bg('planet', { u_pl: [M.mix(0.3, -0.2, w2), 0.05, M.mix(0.42, 0.55, w2)], u_ringTilt: 0.28, u_spin: tt * 0.25, u_c1: M.hsv(0.93 + w2 * 0.6, 0.85, 1), u_c2: M.hsv(0.13 + w2 * 0.6, 0.8, 1) });
      };
      const scr = tvScreen(S, t, world);
      tvroom(S, t, scr, { scale: sc, glow: 1.2 });
      if (t > 151.4) {
        const lab = D.txt('vhs', '14"', 0.2);
        S.text(lab, { style: 'fill', col: [1, 0.9, 0.5], col2: [0, 0, 0], outline: 3, model: Mat.translate(1.05, -0.6, 0), alpha: H.ramp(t, 152.0, 152.4) });
      }
      bridgeLyric(S, t, 37);
      return;
    }
    // 153.05 – 156.35: the jackets don't fit and the photographs fade
    if (t < 156.35) {
      S.bg('void', { u_c1: hex('#2b2233'), u_c2: hex('#07050a'), u_stars: 0, u_warp: 0, u_grid: 0 });
      const portrait = S.capture((S2, tt) => {
        S2.bg('burst', { u_rays: 16, u_spin: 0.3, u_c1: hex('#05d9e8'), u_c2: hex('#ff2a6d'), u_center: [0, 0], u_halftone: 1 });
        const b = S2.batch();
        St.emit(b, SH.face, null, 0, { model: Mat.scale(1.1, 1.1, 1), time: tt, color: [1, 1, 1] });
        S2.solid(b, St.flatCam(), { minPx: 1.5, glow: 1.3 });
      }, t, 'capA');
      const cam = H.orbit(t, { amp: 0.2, z: 3.4 });
      const fade = H.ramp(t, H.w('Now the jackets', 'photographs'), 156.3);
      for (let i = 0; i < 5; i++) {
        const fall = ((t - 153.0) * 0.35 + i * 0.37) % 1.6;
        const m = Mat.chain(Mat.translate(-1.3 + i * 0.65, 1.0 - fall * 1.5, -0.2 * i), Mat.rotZ(Math.sin(t * 0.8 + i * 2) * 0.35), Mat.rotY(Math.sin(t * 0.6 + i) * 0.5), Mat.scale(0.55, 0.55, 0.55));
        S.card(cam, { tex: portrait, mode: 'polaroid', develop: 1, fadeW: fade, model: m, size: [1, 1.2], crop: [0.1 * i, 0, 1 - 0.05 * i, 1], alpha: 0.95 }, 'over');
      }
      S.parts(cam, { mode: 'dust', count: 220, size: 0.02, speed: 0.4, seed: 17 });
      P.sat = 0.45; P.tint = [1.06, 1.0, 0.92]; P.vig = 0.7;
      bridgeLyric(S, t, 38);
      return;
    }
    // 156.35 – 159.05: I still know every song on that mixtape
    if (t < 159.05) {
      S.bg('void', { u_c1: hex('#3a0b4a'), u_c2: hex('#07010f'), u_stars: 0.8, u_warp: 0.2, u_grid: 0 });
      const cam = H.orbit(t, { amp: 0.4, z: 3.2 });
      const nb = S.batch();
      const model = Mat.chain(Mat.translate(-0.55, 0.12, 0), Mat.rotY(Math.sin(t * 0.6) * 0.2), Mat.scale(0.6, 0.6, 0.6));
      St.emit(nb, SH.cassette, null, 0, { model, time: t });
      St.emitRaw(nb, Sh.reels(-t * 3, { col: C.white, tape: [0.9, 0.4, 0.2] }), { model });
      // the song as a ribbon of tape: waveform from the audio bands
      const f = T.feat(t);
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const x = 0.33 * 0.6 - 0.55 + i * 0.03;
        let y = 0;
        for (let b = 0; b < 6; b++) y += Math.sin(x * (4 + b * 3) - t * (3 + b)) * f.bands[b * 2 + 1] * 0.05;
        pts.push([x, 0.12 + 0.08 * 0.6 + y * Math.min(1, i / 8), 0]);
      }
      St.emitRaw(nb, [{ p: pts, c: C.orange, w: 0.01 }], { alpha: H.ramp(t, 156.4, 157.0) });
      S.neon(nb, cam, { intensity: 1.35 });
      const lab = D.txt('marker', 'MIXTAPE ’85', 0.1);
      S.text(lab, { cam, style: 'fill', col: [1, 0.95, 0.98], col2: [0.1, 0, 0.1], glowCol: [1, 0.15, 0.55], glow: 4, model: Mat.mul(model, Mat.translate(0, 0.38, 0.01)) });
      P.sat = M.mix(0.45, 1.15, H.ramp(t, 156.35, 157.4));
      bridgeLyric(S, t, 39);
      return;
    }
    // 159.05 – 162.85: four drumbeats and a cheap guitar
    if (t < 162.85) {
      S.bg('void', { u_c1: hex('#1a0536'), u_c2: hex('#000000'), u_stars: 0.3, u_warp: 0.5, u_grid: 0.5 });
      const hits = [159.1, 159.5, 159.92, 160.33];
      let last = -1;
      hits.forEach((h, i) => { if (t >= h - 0.02) last = i; });
      if (last >= 0 && t < 161.2) {
        const h = hits[last];
        const a = E.outBack(H.seg(t, h - 0.02, h + 0.12), 2.5);
        S.text(D.txt('pixel', String(last + 1), 0.55), { style: 'fill', col: [C.pink, C.cyan, C.yellow, C.lime][last], col2: [0, 0, 0], glowCol: [C.pink, C.cyan, C.yellow, C.lime][last], glow: 6, intensity: 1.3, model: Mat.chain(Mat.translate(-1.05 + last * 0.7, -0.05, 0), Mat.scale(a, a, 1)) });
        hits.forEach((hh, i) => { if (i < last) S.text(D.txt('pixel', String(i + 1), 0.55), { style: 'fill', col: [0.35, 0.3, 0.45], col2: [0, 0, 0], model: Mat.translate(-1.05 + i * 0.7, -0.05, 0), alpha: 0.6 }); });
        P.flash = [1, 1, 1, H.pulse(t, h, 0.07) * 0.35];
        P.zoom = 1 + H.pulse(t, h, 0.12) * 0.04;
      }
      const tg = H.w('Give me four', 'cheap');
      if (t > tg - 0.3) {
        const a = E.outBack(H.seg(t, tg - 0.3, tg + 0.3), 1.6);
        const nb = S.batch();
        St.emit(nb, SH.guitar, null, 0, { model: Mat.chain(Mat.translate(M.mix(-2.6, 0, a), -0.2, 0), Mat.rotZ(M.mix(1.2, -0.9, a) + Math.sin(t * 5) * 0.05), Mat.scale(0.7, 0.7, 0.7), Mat.translate(0, -0.5, 0)), color: C.orange, time: t });
        S.neon(nb, flat, { intensity: 1.5 });
        S.parts(flat, { mode: 'sparkle', t0: tg, count: 90, origin: [0, 0, 0], spread: 1.0, size: 0.05, seed: 13 });
      }
      bridgeLyric(S, t, 40);
      return;
    }
    // 162.85 – 166.44: I'm back on that street, wherever you are
    {
      const up = H.ramp(t, 164.8, 166.44, E.inQuad);
      S.bg('street', { u_moon: [0.35, 0.5, 0.36], u_neon: 1, u_scroll: t * 0.4, u_hor: -0.45, u_sketch: 0, u_fogAmt: 1, u_winSeed: 5, u_skyTop: hex('#070320'), u_skyBot: hex('#3b1070') });
      const fly = H.ramp(t, 162.85, 166.44, E.inQuad);
      const cam = St.camera({ eye: [Math.sin(t * 0.4) * 0.2, -0.35, 3.2 - fly * 12], at: [0, -0.25, -1 - fly * 12], roll: Math.sin(t * 0.3) * 0.04 });
      const nb = S.batch();
      SH.street.strokes.forEach((s) => St.emitRaw(nb, [s], { color: s.c === C.orange ? [1, 0.6, 0.25] : [0.7, 0.55, 1], alpha: s.c === C.orange ? 1 : 0.6 }));
      [[163.0, -2.5, 0.8, C.cyan], [163.4, -5.0, 1.0, C.pink], [163.9, -8.0, 1.2, C.yellow]].forEach(([t0, z, sc, col]) => {
        const a = t - t0;
        if (a < 0 || a > 2.2) return;
        St.emit(nb, SH.rider, null, 0, { model: Mat.mul(Mat.translate(M.mix(4.5, -4.5, a / 2.2), -0.95 + 0.6 * sc, z - fly * 12), Mat.scale(-sc * 0.6, sc * 0.6, 1)), color: col, time: t });
      });
      S.neon(nb, cam, { intensity: 1.35 });
      bridgeLyric(S, t, 41);
      P.fb = { amt: 0.5 * up, zoom: 1.02, rot: 0, decay: 0.85, hue: 0.01, dx: 0, dy: 0, mode: 0 };
      P.flash = [1, 1, 1, H.ramp(t, 166.1, 166.44, E.inCubic) * 0.7];
    }
  }

  // ================================================================ BREAKDOWN 166.44 – 182.64 (claps + gang vocals)
  function maxWire(S, t, cam, a) {
    // Max Headroom: nested wireframe boxes rotating with a stutter
    const st = Math.floor(t * 8) / 8 + (R.hash(Math.floor(t * 4)) > 0.7 ? -0.25 : 0);
    const nb = S.batch();
    for (let i = 0; i < 3; i++) {
      const m = Mat.chain(Mat.translate(0, 0.55, -2), Mat.rotY(st * (0.6 + i * 0.25)), Mat.rotX(st * 0.4 + i), Mat.scale(0.9 + i * 0.55, 0.5 + i * 0.3, 0.9 + i * 0.55));
      St.emitRaw(nb, SH.boxWire, { model: m, color: [C.cyan, C.pink, C.yellow][i], alpha: a });
    }
    S.neon(nb, cam, { intensity: 1.3 });
  }
  function qa(S, t, li, qR, aR, anim) {
    const toks = D.TOK[li].toks;
    const tq = toks[qR[0]].t0, ta = toks[aR[0]].t0, tEnd = T.lines[li].e;
    if (t < tq - 0.3 || t > tEnd + 0.6) return;
    // question: stuttering Max Headroom text
    const stut = R.hash(Math.floor(t * 12)) > 0.72;
    D.lyric(S, li, t, {
      range: qR, font: 'comic', size: 0.24, maxW: 3.2, y: 0.62, style: 'fill', col: [1, 1, 1], col2: [0.02, 0, 0.05], outline: 5, anim: 'pop', upper: true, until: ta + 0.25, layer: 'top',
      glyph: () => (stut ? { x: (R.hash(Math.floor(t * 12) + 3) - 0.5) * 0.06, s: 1.08 } : null),
    });
    // answer: the gang shouts back
    D.lyric(S, li, t, {
      range: aR, font: 'comic', size: 0.34, maxW: 3.3, y: 0.05, style: 'hot', col: [1, 0.95, 0.35], col2: [1, 0.15, 0.5], outline: 5, glow: 3, glowCol: [1, 0.3, 0.1], anim: anim === 'trip' ? 'drop' : 'slam', upper: true, hold: 0.35, layer: 'top',
      glyph: anim === 'trip' ? (g, idx, a) => (a > 0.5 ? { y: -E.outBounce(M.clamp((a - 0.5) / 0.5)) * 0.09 * (idx % 3), rot: (idx % 2 ? 1 : -1) * M.clamp((a - 0.5) * 0.4, 0, 0.25) } : null) : null,
    });
  }
  function breakdown(S, t) {
    const P = S.post;
    const flat = H.flat();
    P.bloom = 0.9; P.sat = 1.15; P.grain = 0.06;
    if (t < 177.0) {
      const clap = Math.max(H.snare(t, 0.09), 0);
      const lights = H.ramp(t, 166.44, 167.6);
      S.bg('crowd', { u_clap: M.clamp(clap * 1.4), u_sway: 1, u_light: lights, u_c1: [0.95, 0.9, 1.0], u_c2: [0.85, 0.15, 0.7] });
      maxWire(S, t, St.camera({ eye: [0, 0.3, 3] }), 0.8 * lights);
      qa(S, t, 42, [0, 3], [4, 7]);
      qa(S, t, 43, [0, 3], [4, 7], 'trip');
      qa(S, t, 44, [0, 2], [3, 5]);
      const tAll = D.TOK[44].toks[3].t0;
      if (t > tAll) S.parts(flat, { mode: 'fireworks', count: 1200, bursts: new Float32Array([-1.1, 0.6, 0, tAll, 1.0, 0.7, 0, tAll + 0.25, 0, 0.8, 0, tAll + 0.5, -0.5, 0.5, 0, tAll + 0.75, 0.6, 0.55, 0, tAll + 0.9, -1.3, 0.8, 0, tAll + 1.1, 1.3, 0.4, 0, tAll + 1.2, 0.2, 0.65, 0, tAll + 1.3]), spread: 0.55, grav: 0.3, life: 1.6, size: 0.035, seed: 3 });
      P.zoom = 1 + H.snare(t, 0.08) * 0.012;
      P.contrast = 1.15;
      return;
    }
    // 177.0 – 182.64: somebody pass me a pencil — this tape's come loose!
    S.bg('void', { u_c1: hex('#2a0845'), u_c2: hex('#040010'), u_stars: 1, u_warp: 0.4 + H.ramp(t, 180.5, 182.64) * 4, u_grid: 0.3 });
    const tp = H.w('Somebody pass', 'pencil'), tl = H.w('Somebody pass', 'loose');
    const zoomIn = E.inQuart(H.seg(t, 181.3, 182.64));
    const cam = St.camera({ eye: [Math.sin(t * 0.5) * 0.3, 0.1, 3.2 - zoomIn * 2.9], at: [0, 0.05, 0] });
    const cm = Mat.chain(Mat.translate(-0.55, 0.15, 0), Mat.rotZ(Math.sin(t * 0.7) * 0.05), Mat.scale(0.62, 0.62, 0.62));
    const nb = S.batch();
    St.emit(nb, SH.cassette, null, 0, { model: cm, time: t });
    const wind = E.inOutCubic(H.seg(t, tl - 0.8, 181.3));
    const spill = E.outCubic(H.seg(t, 177.1, 178.9)) * (1 - wind);
    St.emitRaw(nb, Sh.reels(-t * 2 - wind * 40, { col: C.white, tape: [0.9, 0.4, 0.2], pack1: 0.12 + 0.08 * (1 - spill), pack2: 0.13 }), { model: cm });
    // loose tape ribbon: a turtle path that curls with noise
    if (spill > 0.001) {
      const L = spill * 7.5;
      const n = 160;
      const edge1 = [], edge2 = [];
      let x = -0.55 + 0.33 * 0.62, y = 0.15 + 0.08 * 0.62 - 0.07, h = -0.3;
      for (let i = 0; i <= n; i++) {
        const s = (i / n) * L;
        h += R.perlin3(s * 0.55, 3.3, t * 0.35) * 0.35 + 0.02;
        x += Math.cos(h) * (L / n); y += Math.sin(h) * (L / n) * 0.8;
        const tw = Math.sin(s * 3 + t * 2) * 0.012;
        edge1.push([x - Math.sin(h) * tw, y + Math.cos(h) * tw, 0]);
        edge2.push([x + Math.sin(h) * 0.018, y - Math.cos(h) * 0.018, 0]);
      }
      St.emitRaw(nb, [{ p: edge1, c: [0.95, 0.45, 0.15], w: 0.006 }, { p: edge2, c: [0.6, 0.25, 0.1], w: 0.004 }]);
    }
    // the pencil to the rescue: flies in, slots into the hub and cranks
    if (t > tp - 0.5) {
      const fly = E.outCubic(H.seg(t, tp - 0.5, tp + 0.2));
      const hubX = -0.55 - 0.33 * 0.62, hubY = 0.15 + 0.08 * 0.62;
      const crank = t > tp + 0.3 ? (t - tp - 0.3) * (4 + wind * 22) : 0;
      const m = Mat.chain(Mat.translate(M.mix(2.4, hubX, fly), M.mix(1.2, hubY, fly), 0.05), Mat.rotZ(-2.2 + crank), Mat.translate(-0.85 * 0.5, 0, 0), Mat.scale(0.5, 0.5, 0.5));
      St.emit(nb, SH.pencil, null, 0, { model: m, time: t });
    }
    S.neon(nb, cam, { intensity: 1.4 });
    D.lyric(S, 45, t, { font: 'marker', size: 0.14, maxW: 3.1, y: -0.75, style: 'fill', col: [1, 0.96, 1], col2: [0.1, 0, 0.12], outline: 2, glow: 3, glowCol: C.orange, anim: 'rise', hold: 0.3, layer: 'top' });
    P.fb = { amt: 0.35 + zoomIn * 0.4, zoom: 1.0 + zoomIn * 0.05, rot: 0.01 * zoomIn, decay: 0.8, hue: 0.02, dx: 0, dy: 0, mode: 0 };
    P.flash = [1, 1, 1, H.ramp(t, 182.3, 182.64, E.inCubic) * 0.9];
  }

  // ================================================================ OUTRO 204.42 – 226
  function outro(S, t) {
    const P = S.post;
    const flat = H.flat();
    const k = H.kick(t, 0.12);
    P.bloom = 1.0; P.sat = 1.2;
    const toks = D.TOK[52].toks;
    // 204.42 – 208.45: oh-oh-oh, oh-oh-oh
    if (t < 208.45) {
      outrun(S, t, { u_speed: (t - 204.42) * 2.4 + 400, u_pulse: k, u_roll: Math.sin(t * 0.5) * 0.06, u_camX: Math.sin(t * 0.35) * 0.8, u_sunY: 0.3 });
      const oh = [toks[0].t0, toks[0].t0 + 0.25, toks[0].t0 + 0.5, toks[1].t0, toks[1].t0 + 0.4, toks[1].t0 + 0.9];
      const rb = S.batch();
      oh.forEach((o0, i) => { const r = H.seg(t, o0, o0 + 0.9); if (r > 0 && r < 1) ring(rb, 0, 0.26, 0.4 + r * 1.9, [C.pink, C.cyan, C.yellow][i % 3], 0.012, 1 - r); });
      S.neon(rb, flat, { intensity: 1.4 });
      word(S, t, 'Oh-oh-oh,', toks[0].t0 - 0.05, { font: 'script', y: 0.3, x: -0.35, size: 0.46, until: 208.3, st: ST.neonPink, anim: 'pop', rot: -0.06 });
      word(S, t, 'oh-oh-oh!', toks[1].t0 - 0.05, { font: 'script', y: -0.15, x: 0.35, size: 0.46, until: 208.3, st: ST.neonCyan, anim: 'pop', rot: -0.06 });
      lasers(S, t, flat, 6, 0.6, [C.pink, C.cyan, C.white]);
      return;
    }
    // 208.45 – 213.1: never loud enough — the knob goes to eleven
    if (t < 213.1) {
      S.bg('void', { u_c1: hex('#3b0a5e'), u_c2: hex('#050010'), u_stars: 0.5, u_warp: 1.0, u_grid: 0.6 });
      const tE = toks[4].t0;
      const val = t < tE ? M.mix(8.5, 10, E.outCubic(H.seg(t, 208.45, tE - 0.1))) : 10 + E.outElastic(H.seg(t, tE, tE + 0.8));
      const shake = t > tE ? 1 : 0;
      const cam = H.orbit(t, { amp: 0.2, z: 3.0 });
      knob(S, t, cam, val, 0, 0.12, 1.25, 1, C.cyan);
      for (let i = 0; i <= 11; i++) {
        const a = Sh.knobAngle(i);
        const r = 1.25 * 0.98;
        S.text(D.txt('pixel', String(i), i === 11 ? 0.09 : 0.06), { cam, style: 'fill', col: i === 11 ? [1, 0.2, 0.2] : [0.9, 0.9, 1], glowCol: [1, 0.1, 0.1], glow: i === 11 ? 4 : 0, intensity: i === 11 && t > tE ? 1.8 : 1, model: Mat.translate(Math.cos(a) * r, 0.12 + Math.sin(a) * r, 0) });
      }
      // VU meters peg on both sides
      const vb = S.batch();
      const f = T.feat(t);
      for (const side of [-1, 1]) {
        const lvl = M.clamp(f.rms * 1.1 + shake * 0.4);
        for (let j = 0; j < 12; j++) {
          const on = j / 12 < lvl;
          const col = j > 9 ? C.red : j > 7 ? C.yellow : C.lime;
          St.emitRaw(vb, [{ p: Sh.rrect(side * 1.55, -0.75 + j * 0.13, 0.22, 0.08, 0.01), c: col, w: 0.008, closed: true }], { alpha: on ? 1 : 0.12 });
        }
      }
      S.neon(vb, flat, { intensity: 1.3 });
      if (t > tE) S.parts(cam, { mode: 'sparks', count: 400, origin: [-0.4, 0.5, 0], origin2: [0.4, 0.6, 0], spread: 1.2, grav: 1.4, life: 0.9, size: 0.02, seed: 23 });
      D.lyric(S, 52, t, { range: [2, 4], font: 'chrome', size: 0.24, maxW: 2.8, y: -0.66, style: 'hot', col: [1, 0.92, 0.3], col2: [1, 0.12, 0.45], outline: 4, glow: 4, glowCol: [1, 0.3, 0.15], anim: 'slam', upper: true, until: 212.8, layer: 'top' });
      P.shake = H.shake(shake * (0.5 + k * 1.5), t);
      P.flash = [1, 0.3, 0.3, H.pulse(t, tE, 0.15) * 0.4];
      return;
    }
    // 213.1 – 217.7: one more time — TURN THE EIGHTIES UP!
    const L1 = D.TOK[53].toks;
    const tTurn = L1[3].t0, tUp = L1[6].t0;
    if (t < 217.7) {
      outrun(S, t, { u_speed: (t - 213.1) * 3 + 500, u_pulse: k, u_roll: Math.sin(t * 0.5) * 0.05, u_camX: Math.sin(t * 0.35) * 0.6, u_sunY: 0.3,
        u_sun1: hex('#fff45c'), u_sun2: hex('#ff00e6'), u_skyTop: hex('#050016'), u_skyBot: hex('#27005a'), u_gridCol: hex('#b026ff') });
      word(S, t, 'One more time', L1[0].t0 - 0.05, { font: 'script', y: 0.62, size: 0.3, until: tTurn + 0.2, st: ST.neonCyan, anim: 'pop', rot: -0.05 });
      word(S, t, 'TURN THE', tTurn, { y: 0.42, size: 0.3, st: ST.chrome, anim: 'drop', shadow: true });
      word(S, t, 'EIGHTIES', L1[5].t0, { y: 0.02, size: 0.44, st: ST.neonPink, anim: 'pop', breathe: 0.05 });
      word(S, t, 'UP!', tUp, { y: -0.52, size: 0.56, st: ST.hot, anim: 'slam', breathe: 0.08 });
      if (t > tUp) S.parts(flat, { mode: 'fireworks', count: 1500, bursts: new Float32Array([-1.2, 0.6, 0, tUp, 1.1, 0.65, 0, tUp + 0.2, 0, 0.8, 0, tUp + 0.45, -0.6, 0.45, 0, tUp + 0.8, 0.7, 0.5, 0, tUp + 1.0, -1.4, 0.8, 0, tUp + 1.3, 1.4, 0.3, 0, tUp + 1.5, 0.1, 0.7, 0, tUp + 1.8]), spread: 0.6, grav: 0.3, life: 1.8, size: 0.035, seed: 5 });
      lasers(S, t, flat, 8, 0.8, [C.pink, C.cyan, C.yellow, C.white]);
      P.flash = [1, 1, 1, H.pulse(t, tUp, 0.15) * 0.5];
      P.shake = H.shake(H.pulse(t, tUp, 0.25) * 1.5, t);
      return;
    }
    // 217.7 – 226: pull back into the TV, then switch it off
    const pb = E.inOutCubic(H.seg(t, 217.7, 220.2));
    const scr = tvScreen(S, t, (S2, tt) => outro(S2, 217.65));
    tvroom(S, t, scr, { scale: M.mix(3.3, 0.8, pb), glow: 1.3 });
    const off = H.seg(t, 222.85, 223.75);
    P.open = off > 0 ? 1 - E.inQuad(off) : 1;
    P.scan = 0.1;
    if (t > 223.9) {
      P.open = 0.0001;
      const a = H.ramp(t, 224.1, 224.6) * (1 - H.ramp(t, 225.6, 226));
      osd(S, 'STOP', -1.62, 0.84, 0.12, H.ramp(t, 223.9, 224.1) * (1 - H.ramp(t, 225.6, 226)));
      const L = D.txt('vhs', 'BE KIND, REWIND', 0.16);
      S.osd(() => Tx.draw(L, { style: 'fill', col: [1, 1, 1], col2: [0, 0, 0], outline: 2, model: Mat.translate(0, -0.05, 0), alpha: a }));
    }
  }

  // ================================================================ init
  Shots.init = function (Dir) {
    D = Dir; H = D.H;
    SH = Sh.all();
    SH.titleOutline = D.outline('chrome', 'TURN THE\nEIGHTIES UP', 0.3, { col: C.pink, w: 0.007 });
    SH.phoneHall = Sh.phoneHall();
    SH.street = Sh.streetlights(7);
    SH.rider = Sh.rider();
    SH.town = Sh.town(85);
    SH.sneaker = Sh.sneaker(0, 0, 1, 1);
    SH.hairbrush = Sh.hairbrush();
    SH.boxWire = [];
    for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
      const v = (i) => [(i & 1 ? 0.5 : -0.5), (i & 2 ? 0.5 : -0.5), (i & 4 ? 0.5 : -0.5)];
      SH.boxWire.push({ p: [v(a), v(b)], w: 0.01 });
    }
    makeCovers();
    SH.carousel = ['bmx', 'arcade', 'cassette', 'guitar', 'tv', 'knob', 'star', 'shades', 'heart', 'vhs'].map((k) => SH[k]);
    buildRubik();
    SH.arcadeS = Sh.xform(SH.arcade, { s: 0.82, y: -0.05 });
    V1 = [
      { shape: SH.bmx, t: 18.64 }, { shape: SH.face, t: 21.75 }, { shape: SH.arcadeS, t: 25.04 }, { shape: SH.coins, t: 28.29 },
      { shape: SH.cassette, t: 31.97 }, { shape: SH.deck, t: 34.99 }, { shape: SH.posters, t: 38.69 },
      { shape: SH.phoneHall, t: 41.48, dur: 1.3 },
    ];
    // precompute morph pairings so the first morph of each pair doesn't hitch during playback
    St.pair(SH.titleOutline, SH.bmx);
    for (let i = 0; i < V1.length - 1; i++) St.pair(V1[i].shape, V1[i + 1].shape);
    Shots.list = [
      { id: 'intro', t0: 0, t1: 18.64, draw: intro },
      { id: 'verse1', t0: 18.64, t1: 45.12, draw: verse1 },
      { id: 'pre1', t0: 45.12, t1: 51.74, draw: pre1 },
      { id: 'chorus1', t0: 51.74, t1: 73.16, draw: (S, t) => chorus(S, t, 0) },
      { id: 'post1', t0: 73.16, t1: 81.38, draw: postChorus },
      { id: 'verse2', t0: 81.38, t1: 108.9, draw: verse2 },
      { id: 'pre2', t0: 108.9, t1: 115.84, draw: pre2 },
      { id: 'chorus2', t0: 115.84, t1: 137.9, draw: (S, t) => chorus(S, t, 1) },
      { id: 'bridge', t0: 137.9, t1: 166.44, draw: bridge },
      { id: 'breakdown', t0: 166.44, t1: 182.64, draw: breakdown },
      { id: 'final', t0: 182.64, t1: 204.42, draw: (S, t) => chorus(S, t, 2) },
      { id: 'outro', t0: 204.42, t1: 226.1, draw: outro },
    ];
    const rw = (a, b, f, u) => ({ a, b, map: (x) => Math.max(0.3, a - f(x)), overlay: (S, t) => rewindOverlay(S, t, u) });
    Shots.rewinds = [
      rw(tokT(15, 0), tokT(15, 4), (u) => u * 6 + u * u * 14, 0),
      rw(tokT(33, 0), tokT(33, 4), (u) => u * 7 + u * u * 16, 1),
      rw(tokT(51, 0), tokT(51, 4), (u) => u * 20 + u * u * 80, 2),
    ];
  };
})();
