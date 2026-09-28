/* The Wheel of Invention — scenes 06–10: pendulum clock, steam engine, telegraph, light bulb, automobile. */
'use strict';
(() => {
  const SC_ = window.SCENES || (window.SCENES = []);
  const lit = (ctx, fn) => { ctx.globalCompositeOperation = 'lighter'; fn(); ctx.globalCompositeOperation = 'source-over'; };
  const BR = { base: '#c9962f', hi: '#f6d67e', lo: '#6e4c16' };
  const brassG = (ctx, x, y, r) => radG(ctx, x - r * 0.35, y - r * 0.4, r * 0.05, r * 1.25, [[0, BR.hi], [0.55, BR.base], [1, BR.lo]]);

  /* ================= 06 · THE PENDULUM CLOCK ================= */
  const CK = { sp: [0, -275], Lp: 450, ew: [0, -200], dc: [0, -60], th0: (10 * Math.PI) / 180 };
  const anchorPts = [-38, -232, -31, -246, 0, -258, 31, -246, 38, -232];
  const cheek = s => new P(0, -275).Q(s * 3, -252, s * 22, -240).pts;
  const clockTick = t => { const k = Math.floor(t), e = E.outBack(clamp((t - k) / 0.1), 2.2); return k + e; };

  SC_.push({
    id: 'clock', n: '06', year: 1656, title: 'The Pendulum Clock', who: 'Christiaan Huygens · The Hague',
    line: 'Clock error fell from about 15 minutes a day to under one.', color: '#e0b24a',
    fig: 'MOVEMENT · FRONT ELEVATION', origin: 'THE HAGUE', date: '1656', scale: '1:4',
    tbTitle: 'PENDULUM CLOCK', draft: 2.7, alive: 2.9, rot: 1.5, ignite: [0, -200],
    build(S) {
      const { sp, Lp, ew, dc, th0 } = CK, bob = [0, sp[1] + Lp];
      S.frame(this);
      S.line(0, -292, 0, 236, { k: 'ctr' });
      S.rect(-16, -290, 32, 15);
      S.poly(cheek(-1)); S.poly(cheek(1));
      S.line(0, -275, 0, bob[1] - 28);
      S.poly(ellPts(bob[0], bob[1], 42, 28));
      for (const sg of [-1, 1]) {
        const a = sg * th0, bx = sp[0] + Math.sin(a) * Lp, by = sp[1] + Math.cos(a) * Lp;
        S.line(0, -275, bx - Math.sin(a) * 28, by - Math.cos(a) * 28, { k: 'ph' });
        S.poly(ellPts(bx, by, 42, 28, -a), { k: 'ph' });
      }
      S.adim(sp[0], sp[1], Lp + 44, Math.PI / 2, Math.PI / 2 - th0, '10°', { out: 20 });
      S.poly(gearPts(dc[0], dc[1], 62, 56, 48, 0), { k: 'hid' });
      S.poly(gearPts(ew[0], ew[1], 50, 41, 24, 0, 0.09, 0.12, 0.6));
      S.circle(ew[0], ew[1], 9, { k: 'thin' });
      S.multi([[ew[0] - 38, ew[1], ew[0] + 38, ew[1]], [ew[0], ew[1] - 38, ew[0], ew[1] + 38]], { k: 'thin' });
      S.poly(anchorPts, { w: 3 });
      S.circle(0, -258, 5);
      S.circle(dc[0], dc[1], 98);
      S.circle(dc[0], dc[1], 74, { k: 'thin' });
      const tk = [];
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * TAU, r1 = i % 5 === 0 ? 80 : 90;
        tk.push([dc[0] + Math.cos(a) * r1, dc[1] + Math.sin(a) * r1, dc[0] + Math.cos(a) * 96, dc[1] + Math.sin(a) * 96]);
      }
      S.multi(tk, { k: 'thin' });
      const hand = (ang, len, w) => { const c = Math.cos(ang), s = Math.sin(ang), n = [-s * w, c * w]; return [dc[0] - c * 14 + n[0], dc[1] - s * 14 + n[1], dc[0] + c * len, dc[1] + s * len, dc[0] - c * 14 - n[0], dc[1] - s * 14 - n[1]]; };
      S.poly(hand((215 * Math.PI) / 180, 52, 5), { close: true });
      S.poly(hand((-30 * Math.PI) / 180, 78, 3.5), { close: true });
      S.circle(dc[0], dc[1], 6);
      // weight drive
      S.line(150, -250, 150, 40, { k: 'thin' });
      S.circle(150, -254, 8, { k: 'thin' });
      S.rect(136, 40, 28, 76);
      S.hatch([rectPts(136, 40, 28, 76)], 8);
      S.dim(0, -275, 0, bob[1], -170, 'L 994');
      S.notes(['NOTES', 'T = 2π √(L / g)', 'L = 0.994 m  →  T = 2.0 s', 'ONE SWING = ONE SECOND'], -590, -60);
      S.balloon(16, -262, 340, -205, 'A', 'CYCLOIDAL CHEEKS');
      S.balloon(49, -196, 340, -145, 'B', 'ESCAPE WHEEL · 24 T');
      S.balloon(94, -84, 340, -85, 'C', 'DIAL');
      S.balloon(164, 60, 340, -25, 'D', 'DRIVING WEIGHT');
      S.balloon(-42, bob[1], -340, 76, 'E', 'BOB', { left: true });
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const { sp, Lp, ew, dc, th0 } = CK, lod = env.lod;
      const amp = th0 * E.outCubic(clamp(t / 0.7)), th = amp * Math.sin(Math.PI * t);
      const tick = clockTick(t), ea = -(TAU / 24) * tick;
      ctx.fillStyle = linG(ctx, -300, 0, 300, 0, [[0, '#1d0f07'], [0.5, '#34200f'], [1, '#1a0d06']]);
      ctx.fillRect(-310, -310, 620, 620);
      if (lod > 0.4) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); for (let x = -290; x < 300; x += 18) seg(ctx, x + Math.sin(x) * 3, -300, x, 300); ctx.stroke();
      }
      ctx.fillStyle = radG(ctx, -120, -200, 10, 460, [[0, [255, 205, 140], 0.2], [1, [255, 205, 140], 0]]);
      ctx.fillRect(-310, -310, 620, 620);
      // pendulum hangs behind the movement
      ctx.save();
      ctx.translate(sp[0], sp[1]); ctx.rotate(-th);
      ctx.fillStyle = linG(ctx, -3, 0, 3, 0, [[0, '#5e6068'], [0.5, '#c9ccd4'], [1, '#4a4c54']]);
      ctx.fillRect(-2.5, 0, 5, Lp - 26);
      ctx.fillStyle = brassG(ctx, 0, Lp, 42);
      ctx.beginPath(); ctx.ellipse(0, Lp, 42, 28, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,10,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      // weight descends as it drives the train
      const wy = 40 + t * 0.8;
      ctx.strokeStyle = 'rgba(210,200,180,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); seg(ctx, 150, -250, 150, wy); ctx.stroke();
      circ(ctx, 150, -254, 8, brassG(ctx, 150, -254, 8));
      ctx.fillStyle = linG(ctx, 136, 0, 164, 0, [[0, BR.lo], [0.45, BR.hi], [1, BR.lo]]);
      ctx.fillRect(136, wy, 28, 76);
      // centre wheel seen through the skeleton dial
      ctx.fillStyle = linG(ctx, dc[0] - 62, dc[1] - 62, dc[0] + 62, dc[1] + 62, [[0, BR.hi], [0.5, BR.base], [1, BR.lo]]);
      fillPts(ctx, gearPts(dc[0], dc[1], 62, 56, 48, ea / 30));
      ctx.fillStyle = '#24140a';
      for (let i = 0; i < 4; i++) {
        const a0 = ea / 30 + (i * TAU) / 4 + 0.25, a1 = a0 + TAU / 4 - 0.5;
        ctx.beginPath(); ctx.moveTo(dc[0] + Math.cos(a0) * 16, dc[1] + Math.sin(a0) * 16);
        ctx.arc(dc[0], dc[1], 48, a0, a1); ctx.lineTo(dc[0] + Math.cos(a1) * 16, dc[1] + Math.sin(a1) * 16); ctx.closePath(); ctx.fill();
      }
      // escape wheel steps with each beat
      ctx.fillStyle = linG(ctx, -50, -250, 50, -150, [[0, BR.hi], [0.5, BR.base], [1, BR.lo]]);
      fillPts(ctx, gearPts(ew[0], ew[1], 50, 41, 24, ea, 0.09, 0.12, 0.6));
      ctx.fillStyle = '#24140a';
      for (let i = 0; i < 4; i++) {
        const a0 = ea + (i * TAU) / 4 + 0.22, a1 = a0 + TAU / 4 - 0.44;
        ctx.beginPath(); ctx.moveTo(ew[0] + Math.cos(a0) * 11, ew[1] + Math.sin(a0) * 11);
        ctx.arc(ew[0], ew[1], 33, a0, a1); ctx.lineTo(ew[0] + Math.cos(a1) * 11, ew[1] + Math.sin(a1) * 11); ctx.closePath(); ctx.fill();
      }
      circ(ctx, ew[0], ew[1], 9, brassG(ctx, ew[0], ew[1], 9));
      // anchor rocks with the pendulum
      ctx.save();
      ctx.translate(0, -258); ctx.rotate(-th * 0.9); ctx.translate(0, 258);
      ctx.strokeStyle = '#3d4450'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      strokePts(ctx, anchorPts);
      ctx.strokeStyle = 'rgba(210,220,235,0.6)'; ctx.lineWidth = 1.6; strokePts(ctx, anchorPts);
      circ(ctx, 0, -258, 5, '#aab2bf');
      ctx.restore();
      const beat = t - Math.floor(t);
      if (beat < 0.12 && t > 0.5) lit(ctx, () => glow(ctx, Math.sin(Math.PI * t) > 0 ? 38 : -38, -232, 22, [255, 230, 180], 0.6 * (1 - beat / 0.12)));
      // suspension and cycloidal cheeks
      ctx.fillStyle = '#3a3f48'; ctx.fillRect(-16, -290, 32, 15);
      ctx.strokeStyle = '#9aa3b0'; ctx.lineWidth = 4;
      strokePts(ctx, cheek(-1)); strokePts(ctx, cheek(1));
      // skeleton dial
      ctx.beginPath(); ctx.arc(dc[0], dc[1], 98, 0, TAU); ctx.arc(dc[0], dc[1], 74, 0, TAU, true);
      ctx.fillStyle = linG(ctx, -98, -158, 98, 38, [[0, '#f1ede2'], [1, '#b9b4a6']]); ctx.fill();
      ctx.strokeStyle = '#1b1712'; ctx.lineCap = 'butt';
      for (const big of [false, true]) {
        ctx.lineWidth = big ? 3.2 : 1.1;
        ctx.beginPath();
        for (let i = 0; i < 60; i++) {
          if ((i % 5 === 0) !== big) continue;
          const a = (i / 60) * TAU, r0 = big ? 78 : 88;
          seg(ctx, dc[0] + Math.cos(a) * r0, dc[1] + Math.sin(a) * r0, dc[0] + Math.cos(a) * 95, dc[1] + Math.sin(a) * 95);
        }
        ctx.stroke();
      }
      circ(ctx, dc[0], dc[1], 98, null, 'rgba(60,40,10,0.9)', 2.5);
      circ(ctx, dc[0], dc[1], 74, null, 'rgba(60,40,10,0.9)', 1.5);
      const handPts = (ang, len, w) => { const c = Math.cos(ang), s = Math.sin(ang), n = [-s * w, c * w]; return [dc[0] - c * 14 + n[0], dc[1] - s * 14 + n[1], dc[0] + c * len, dc[1] + s * len, dc[0] - c * 14 - n[0], dc[1] - s * 14 - n[1]]; };
      ctx.fillStyle = '#1f2f5c';
      fillPts(ctx, handPts((215 * Math.PI) / 180, 52, 5));
      fillPts(ctx, handPts((-30 * Math.PI) / 180 + (tick / 3600) * TAU, 78, 3.5));
      const sa = -Math.PI / 2 + (TAU / 60) * tick;
      ctx.strokeStyle = '#a3261d'; ctx.lineWidth = 1.6;
      ctx.beginPath(); seg(ctx, dc[0] - Math.cos(sa) * 18, dc[1] - Math.sin(sa) * 18, dc[0] + Math.cos(sa) * 88, dc[1] + Math.sin(sa) * 88); ctx.stroke();
      circ(ctx, dc[0], dc[1], 6, brassG(ctx, dc[0], dc[1], 6));
      lit(ctx, () => {
        ctx.strokeStyle = rgba([255, 240, 200], 0.18); ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(ew[0], ew[1], 44, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(dc[0], dc[1], 86, Math.PI * 1.05, Math.PI * 1.4); ctx.stroke();
      });
    },
  });

  /* ================= 07 · THE STEAM ENGINE ================= */
  const ST = { bp: [-20, -170], arm: 180, fw: [160, 90], rc: 40, rod: 260, fr: 102 };
  const steamSpeed = t => 2.8 * (1 - Math.exp(-t / 1.1));
  const steamPhase = t => 2.8 * (t - 1.1 * (1 - Math.exp(-t / 1.1)));
  function steamPose(phi) {
    const C = [ST.fw[0] + ST.rc * Math.cos(phi), ST.fw[1] + ST.rc * Math.sin(phi)];
    const psi = Math.asin(clamp((C[1] - ST.fw[1]) / ST.arm, -1, 1));
    const BRt = [ST.bp[0] + ST.arm * Math.cos(psi), ST.bp[1] + ST.arm * Math.sin(psi)];
    const BL = [ST.bp[0] - ST.arm * Math.cos(psi), ST.bp[1] - ST.arm * Math.sin(psi)];
    return { C, psi, BRt, BL, py: BL[1] + 160 };
  }
  const beamPts = psi => {
    const c = Math.cos(psi), s = Math.sin(psi), tf = (x, y) => [ST.bp[0] + x * c - y * s, ST.bp[1] + x * s + y * c];
    const q = [[-190, -12], [0, -16], [190, -12], [190, 12], [0, 22], [-190, 12]], out = [];
    for (const [x, y] of q) out.push(...tf(x, y));
    return out;
  };

  SC_.push({
    id: 'steam', n: '07', year: 1769, title: 'The Steam Engine', who: 'James Watt · Glasgow',
    line: 'Watt coined “horsepower” to explain what it could do.', color: '#ff8a3d',
    fig: 'ROTATIVE BEAM ENGINE · ELEVATION', origin: 'GLASGOW', date: 'PAT. 1769', scale: '1:48',
    tbTitle: 'STEAM ENGINE', draft: 2.7, alive: 2.9, rot: 1.4, ignite: [-200, 172],
    build(S) {
      const { C, BRt, BL, py } = steamPose(0), { bp, fw, fr } = ST;
      S.frame(this);
      S.line(-290, 210, 290, 210, { k: 'thin' });
      const earth = [];
      for (let x = -270; x < 280; x += 16) earth.push([x, 210, x - 10, 222]);
      S.multi(earth, { k: 'hatch' });
      S.poly(beamPts(0), { close: true });
      S.circle(bp[0], bp[1], 8);
      S.rect(-46, -170, 52, 14);
      S.rect(-34, -156, 28, 366);
      S.rect(-240, -60, 80, 198);
      S.rect(-248, -68, 96, 10); S.rect(-248, 128, 96, 10);
      S.rect(-262, -40, 22, 60, { k: 'thin' });
      S.line(-200, BL[1] + 22, -200, py, { w: 3 });
      S.rect(-236, py - 6, 72, 12, { k: 'hid' });
      S.poly([BL[0], BL[1], BL[0] + 40, BL[1], BL[0] + 40, BL[1] + 22, BL[0], BL[1] + 22, BL[0], BL[1]], { k: 'thin' });
      S.line(BL[0] + 40, BL[1] + 22, BL[0] + 110, BL[1] + 22, { k: 'thin' });
      // plinth and fire door
      S.rect(-250, 138, 100, 72);
      const bricks = [];
      for (let y = 146; y < 210; y += 12) bricks.push([-250, y, -150, y]);
      S.multi(bricks, { k: 'hatch' });
      S.poly(new P(-222, 210).L(-222, 184).A(-200, 184, 22, Math.PI, TAU).L(-178, 210).pts);
      // separate condenser in its cistern
      S.rect(-146, 150, 80, 56);
      S.rect(-122, 158, 30, 44, { k: 'thin' });
      S.poly([-160, 120, -140, 120, -140, 170, -122, 170], { k: 'thin' });
      // flywheel, crank and connecting rod
      S.circle(fw[0], fw[1], fr);
      S.circle(fw[0], fw[1], fr - 12, { k: 'thin' });
      S.circle(fw[0], fw[1], 16);
      const sp = [];
      for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6; sp.push([fw[0] + Math.cos(a) * 16, fw[1] + Math.sin(a) * 16, fw[0] + Math.cos(a) * (fr - 12), fw[1] + Math.sin(a) * (fr - 12)]); }
      S.multi(sp, { k: 'thin' });
      S.circle(fw[0], fw[1], ST.rc, { k: 'ph' });
      S.line(BRt[0], BRt[1], C[0], C[1], { w: 3 });
      S.circle(C[0], C[1], 6);
      S.poly([120, 210, 150, 96, 170, 96, 200, 210], { k: 'thin' });
      // governor
      S.line(60, -8, 60, -104);
      for (const sg of [-1, 1]) {
        const g = 25 * (Math.PI / 180), bx = 60 + sg * 44 * Math.sin(g), by = -100 + 44 * Math.cos(g);
        S.line(60, -100, bx, by);
        S.circle(bx, by, 11);
      }
      S.dim(-200, -170, 160, -170, 52, 'L 24 FT');
      S.dim(-240, -68, -160, -68, 16, 'BORE 24 IN', { size: 13 });
      S.dim(fw[0] - fr, fw[1], fw[0] + fr, fw[1], -140, 'Ø 16 FT');
      S.notes(['NOTES', '1. STEAM CONDENSED APART FROM', '   THE CYLINDER: CYLINDER STAYS HOT', '2. RATED 10 HP'], -590, -60);
      S.balloon(80, -176, 340, -205, 'A', 'BEAM');
      S.balloon(78, -62, 340, -145, 'B', 'CENTRIFUGAL GOVERNOR');
      S.balloon(244, 40, 340, -85, 'C', 'FLYWHEEL');
      S.balloon(-200, 104, -340, 76, 'D', 'CYLINDER', { left: true });
      S.balloon(-106, 162, -52, 250, 'E', 'SEPARATE CONDENSER');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const { bp, fw, fr } = ST, lod = env.lod, spd = steamSpeed(t), phi = steamPhase(t);
      const { C, psi, BRt, BL, py } = steamPose(phi), sk = spd / 2.8;
      ctx.fillStyle = linG(ctx, 0, -300, 0, 300, [[0, '#1c120d'], [1, '#2e1b10']]);
      ctx.fillRect(-310, -310, 620, 620);
      if (lod > 0.35) {
        ctx.fillStyle = 'rgba(120,60,30,0.1)';
        for (let r = 0, y = -300; y < 200; y += 16, r++) for (let x = -310 + (r % 2) * 24; x < 310; x += 48) ctx.fillRect(x, y, 44, 13);
      }
      const fire = 0.75 + 0.25 * noise1(t * 6, 3);
      lit(ctx, () => { glow(ctx, -200, 190, 260, [255, 120, 40], 0.45 * fire); glow(ctx, 120, -220, 260, [255, 180, 110], 0.08); });
      ctx.fillStyle = linG(ctx, 0, 210, 0, 300, [[0, '#2a1a12'], [1, '#110905']]);
      ctx.fillRect(-310, 210, 620, 100);
      const iron = (x0, y0, x1, y1) => linG(ctx, x0, y0, x1, y1, [[0, '#1f2024'], [0.45, '#5b5f68'], [1, '#18191c']]);
      // plinth, fire door, condenser
      ctx.fillStyle = '#5a2c1c'; ctx.fillRect(-250, 138, 100, 72);
      ctx.strokeStyle = 'rgba(20,8,4,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); for (let y = 146; y < 210; y += 12) seg(ctx, -250, y, -150, y); ctx.stroke();
      ctx.fillStyle = radG(ctx, -200, 200, 4, 40, [[0, '#fff0b0'], [0.4, '#ff9a2e'], [1, '#8a2a0a']]);
      fillPts(ctx, new P(-222, 210).L(-222, 184).A(-200, 184, 22, Math.PI, TAU).L(-178, 210).pts);
      ctx.fillStyle = linG(ctx, -146, 0, -66, 0, [[0, '#3a4a55'], [0.5, '#5c7384'], [1, '#2c3a44']]); ctx.fillRect(-146, 150, 80, 56);
      ctx.fillStyle = 'rgba(160,210,235,0.35)'; ctx.fillRect(-146, 160, 80, 4);
      ctx.fillStyle = iron(-122, 0, -92, 0); ctx.fillRect(-122, 158, 30, 44);
      // pillar
      ctx.fillStyle = iron(-34, 0, -6, 0); ctx.fillRect(-34, -156, 28, 366);
      ctx.fillStyle = iron(-46, 0, 6, 0); ctx.fillRect(-46, -170, 52, 14);
      // cylinder with lagging and brass bands
      ctx.fillStyle = linG(ctx, -240, 0, -160, 0, [[0, '#4a2a16'], [0.45, '#8a5a32'], [1, '#3c2211']]); ctx.fillRect(-240, -60, 80, 198);
      ctx.strokeStyle = 'rgba(30,14,6,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let x = -232; x < -160; x += 9) seg(ctx, x, -58, x, 136); ctx.stroke();
      ctx.fillStyle = linG(ctx, -248, 0, -152, 0, [[0, BR.lo], [0.45, BR.hi], [1, BR.lo]]);
      ctx.fillRect(-248, -68, 96, 10); ctx.fillRect(-248, 128, 96, 10); ctx.fillRect(-240, 30, 80, 6);
      ctx.fillStyle = iron(-262, 0, -240, 0); ctx.fillRect(-262, -40, 22, 60);
      ctx.strokeStyle = '#8f949c'; ctx.lineWidth = 5; ctx.beginPath(); seg(ctx, -200, BL[1] + 22, -200, -60); ctx.stroke();
      // parallel motion
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3;
      strokePts(ctx, [BL[0], BL[1], BL[0] + 40 * Math.cos(psi), BL[1] + 40 * Math.sin(psi), BL[0] + 40 * Math.cos(psi), BL[1] + 22 + 40 * Math.sin(psi), -200, BL[1] + 22, BL[0], BL[1]]);
      ctx.beginPath(); seg(ctx, BL[0] + 40 * Math.cos(psi), BL[1] + 22 + 40 * Math.sin(psi), BL[0] + 110, -148); ctx.stroke();
      // beam rocks
      ctx.fillStyle = iron(0, -190, 0, -150); fillPts(ctx, beamPts(psi));
      ctx.strokeStyle = 'rgba(200,205,215,0.35)'; ctx.lineWidth = 1.5; strokePts(ctx, beamPts(psi), null, null, true);
      circ(ctx, bp[0], bp[1], 9, brassG(ctx, bp[0], bp[1], 9));
      // flywheel
      circ(ctx, fw[0], fw[1], fr, null, '#26272b', 14);
      circ(ctx, fw[0], fw[1], fr + 5, null, 'rgba(190,196,205,0.3)', 1.5);
      ctx.strokeStyle = '#2d2e33'; ctx.lineWidth = 7;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = phi + (i * TAU) / 6; seg(ctx, fw[0] + Math.cos(a) * 16, fw[1] + Math.sin(a) * 16, fw[0] + Math.cos(a) * (fr - 8), fw[1] + Math.sin(a) * (fr - 8)); }
      ctx.stroke();
      if (sk > 0.4) { ctx.fillStyle = rgba([60, 62, 70], 0.25 * sk); ctx.beginPath(); ctx.arc(fw[0], fw[1], fr - 8, 0, TAU); ctx.arc(fw[0], fw[1], 16, 0, TAU, true); ctx.fill(); }
      circ(ctx, fw[0], fw[1], 16, brassG(ctx, fw[0], fw[1], 16));
      ctx.fillStyle = iron(150, 0, 170, 0); fillPts(ctx, [120, 210, 150, 96, 170, 96, 200, 210]);
      ctx.strokeStyle = '#7f858e'; ctx.lineWidth = 6; ctx.beginPath(); seg(ctx, BRt[0], BRt[1], C[0], C[1]); ctx.stroke();
      circ(ctx, C[0], C[1], 7, brassG(ctx, C[0], C[1], 7));
      // governor spins, balls lift with speed
      const g = (25 + 20 * sk) * (Math.PI / 180), gw = phi * 1.6;
      ctx.strokeStyle = '#8b9098'; ctx.lineWidth = 4; ctx.beginPath(); seg(ctx, 60, -8, 60, -104); ctx.stroke();
      const balls = [0, Math.PI].map(o => {
        const c = Math.cos(gw + o), z = Math.sin(gw + o);
        return { x: 60 + 44 * Math.sin(g) * c, y: -100 + 44 * Math.cos(g), z };
      }).sort((a, b) => a.z - b.z);
      for (const b of balls) {
        ctx.strokeStyle = '#a7acb4'; ctx.lineWidth = 2.5; ctx.beginPath(); seg(ctx, 60, -100, b.x, b.y); ctx.stroke();
        circ(ctx, b.x, b.y, 11 * (1 + b.z * 0.08), brassG(ctx, b.x, b.y, 11));
      }
      circ(ctx, 60, -102, 5, brassG(ctx, 60, -102, 5));
      // steam: a puff per stroke from the valve chest, and sparks from the fire
      emit(t, 2.8 / Math.PI, 2.4, (age, u, i) => {
        const x = -252 + 10 * age + 24 * (hash(i, 111) - 0.5) * age, y = -46 - 60 * age - 10 * age * age;
        puff(ctx, x, y, 12 + 60 * u, [235, 232, 226], 0.4 * (1 - u) * sk);
      }, 0.3);
      if (lod > 0.35) {
        emit(t, 1.8, 3.5, (age, u, i) => puff(ctx, -150 + 8 * age, 100 - 30 * age, 6 + 30 * u, [220, 220, 215], 0.16 * (1 - u)), 0.1);
        lit(ctx, () => emit(t, 16, 1.4, (age, u, i) => {
          const x = -200 + (hash(i, 121) - 0.5) * 30 + 30 * Math.sin(age * 4 + i), y = 188 - 90 * age * (0.6 + hash(i, 122));
          circ(ctx, x, y, 1.6, rgba([255, 180, 80], (1 - u) * fire));
        }));
      }
    },
  });

  /* ================= 08 · THE TELEGRAPH ================= */
  const MORSE = { W: '.--', H: '....', A: '.-', T: '-', G: '--.', O: '---', D: '-..', R: '.-.', U: '..-' };
  const MSG = 'WHAT HATH GOD WROUGHT';
  const TGM = (() => {
    const marks = [], ends = [];
    let u = 0;
    for (const ch of MSG) {
      if (ch === ' ') { u += 4; ends.push(u); continue; }
      const code = MORSE[ch];
      for (let j = 0; j < code.length; j++) {
        const d = code[j] === '.' ? 1 : 3;
        marks.push([u, u + d]); u += d;
        if (j < code.length - 1) u += 1;
      }
      ends.push(u); u += 3;
    }
    return { marks, ends, total: u + 16 };
  })();
  const TU = 0.03, TSPD = 900, TAPE = 80;
  const POLES = [-130, -20, 90, 200];
  const WIRE = (() => {
    const p = new P(-78, 178).L(-116, -36);
    for (let i = 0; i < 3; i++) p.Q((POLES[i] + POLES[i + 1]) / 2 + 14, -18, POLES[i + 1] + 14, -36, 14);
    p.L(246, 180);
    return { segs: [polySeg(p.pts)], pts: p.pts };
  })();
  WIRE.len = WIRE.segs[0].len;
  const keyPts = k => {
    const q = [[-236, 144], [-96, 150]];
    return q.map(([x, y]) => { const r = rot2(x + 160, y - 146, k); return [r[0] - 160, r[1] + 146]; });
  };

  SC_.push({
    id: 'telegraph', n: '08', year: 1844, title: 'The Telegraph', who: 'Samuel Morse · Washington to Baltimore',
    line: '“What hath God wrought” crossed 40 miles in an instant.', color: '#ffd166',
    fig: 'KEY · LINE · REGISTER', origin: 'WASHINGTON', date: '24 MAY 1844', scale: 'NTS',
    tbTitle: 'ELECTRIC TELEGRAPH', draft: 2.5, alive: 2.9, rot: 1.4, ignite: [-228, 160],
    build(S) {
      S.frame(this);
      S.line(-290, 118, 290, 118, { k: 'con' });
      S.rect(-250, 170, 170, 22);
      S.rect(-166, 146, 12, 24, { k: 'thin' });
      const kp = keyPts(0);
      S.line(kp[0][0], kp[0][1], kp[1][0], kp[1][1], { w: 3.2 });
      S.poly(ellPts(-236, 135, 15, 9));
      S.rect(-228, 160, 8, 10, { k: 'thin' });
      S.poly([-104, 151, -98, 155, -110, 159, -98, 163, -110, 167, -104, 170], { k: 'thin' });
      S.circle(-92, 178, 4, { k: 'thin' }); S.circle(-78, 178, 4, { k: 'thin' });
      for (const x of POLES) {
        S.line(x, -48, x, 118);
        S.line(x - 20, -40, x + 20, -40);
        S.circle(x - 14, -44, 3.5, { k: 'thin' }); S.circle(x + 14, -44, 3.5, { k: 'thin' });
      }
      S.poly(WIRE.pts, { k: 'thin' });
      // register
      S.rect(130, 180, 110, 30);
      S.rect(150, 140, 16, 40, { k: 'thin' }); S.rect(170, 140, 16, 40, { k: 'thin' });
      S.hatch([rectPts(150, 140, 16, 40), rectPts(170, 140, 16, 40)], 5, 0);
      S.line(144, 134, 214, 134, { w: 3 });
      S.rect(208, 134, 8, 46, { k: 'thin' });
      S.circle(228, 168, 12, { k: 'thin' });
      S.rect(-60, 193, 190, 6, { k: 'thin' });
      S.text('WASHINGTON', -165, 206, { align: 'c', size: 12, a: 0.7 });
      S.text('BALTIMORE', 185, 222, { align: 'c', size: 12, a: 0.7 });
      S.dim(-116, -36, 214, -36, 40, 'LINE · 40 MI');
      // circuit inset: battery, key, line, magnet, earth return
      const L0 = -560, R0 = -380, T0 = -250, B0 = -150;
      S.multi([[L0, T0, -500, T0], [-500, T0, -470, T0 - 14], [-470, T0, R0, T0], [R0, T0, R0, -225], [R0, -175, R0, B0], [L0, T0, L0, -214], [L0, -178, L0, B0]], { k: 'thin', ph: 3 });
      const coil = new P(R0, -225);
      for (let i = 0; i < 5; i++) coil.A(R0, -220 + i * 10, 5, -Math.PI / 2, Math.PI / 2, 8);
      S.poly(coil.pts, { k: 'thin', ph: 3 });
      S.multi([[L0 - 12, -214, L0 + 12, -214], [L0 - 6, -206, L0 + 6, -206], [L0 - 12, -198, L0 + 12, -198], [L0 - 6, -190, L0 + 6, -190], [L0 - 12, -182, L0 + 12, -182], [L0 - 6, -178, L0 + 6, -178]], { k: 'obj', ph: 3, w: 1.6 });
      for (const x of [L0, R0]) S.multi([[x - 12, B0, x + 12, B0], [x - 8, B0 + 5, x + 8, B0 + 5], [x - 4, B0 + 10, x + 4, B0 + 10]], { k: 'thin', ph: 3 });
      S.text('KEY', -485, T0 - 26, { align: 'c', size: 12, a: 0.8 });
      S.text('LINE', -425, T0 - 12, { align: 'c', size: 12, a: 0.8 });
      S.text('MAGNET', R0 + 14, -200, { size: 12, a: 0.8 });
      S.text('BATTERY', L0 + 18, -196, { size: 12, a: 0.8 });
      S.text('EARTH', -470, B0 + 8, { align: 'c', size: 12, a: 0.8 });
      S.text('FIG. 2 — CIRCUIT, EARTH RETURN', -470, B0 + 36, { align: 'c', size: 13, a: 0.7 });
      S.notes(['CODE', 'W ·——   H ····   A ·—   T —', 'G ——·   O ———   D —··', 'R ·—·   U ··—'], -590, -60);
      S.balloon(-236, 128, -340, 60, 'A', 'KEY', { left: true });
      S.balloon(40, -30, 340, -205, 'B', 'COPPER LINE');
      S.balloon(104, -44, 340, -145, 'C', 'GLASS INSULATOR');
      S.balloon(186, 150, 340, -85, 'D', 'ELECTROMAGNET');
      S.balloon(80, 196, 340, -25, 'E', 'PAPER TAPE');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const lod = env.lod, per = TGM.total * TU, tl = t < 0.25 ? -1 : (t - 0.25) % per, travel = WIRE.len / TSPD;
      ctx.fillStyle = linG(ctx, 0, -300, 0, 118, [[0, '#141c38'], [0.45, '#3e3558'], [0.8, '#c0705a'], [1, '#f2b27a']]);
      ctx.fillRect(-310, -310, 620, 430);
      lit(ctx, () => {
        glow(ctx, 170, 116, 260, [255, 170, 110], 0.35);
        for (let i = 0; i < 40; i++) circ(ctx, (hash(i, 131) * 2 - 1) * 290, -290 + hash(i, 132) * 200, 0.6 + hash(i, 133), rgba([255, 255, 255], 0.5 * (0.6 + 0.4 * Math.sin(t * 2 + i))));
      });
      ctx.fillStyle = '#2b2440';
      fillPts(ctx, new P(-310, 118).Q(-200, 70, -80, 96).Q(40, 118, 150, 84).Q(240, 60, 310, 94).L(310, 130).L(-310, 130).pts);
      ctx.fillStyle = '#1b1627';
      fillPts(ctx, new P(-310, 126).Q(-120, 100, 30, 122).Q(170, 136, 310, 112).L(310, 170).L(-310, 170).pts);
      // poles and wire
      for (const x of POLES) {
        ctx.fillStyle = '#20150f'; ctx.fillRect(x - 3, -48, 6, 170);
        ctx.fillRect(x - 20, -42, 40, 5);
        for (const s of [-14, 14]) { circ(ctx, x + s, -46, 3.8, '#3f6e5e'); circ(ctx, x + s - 1, -47, 1.3, 'rgba(200,255,230,0.7)'); }
      }
      ctx.strokeStyle = '#140d09'; ctx.lineWidth = 1.6; strokePts(ctx, WIRE.pts);
      // pulses of current race down the line
      if (tl >= 0) {
        lit(ctx, () => {
          ctx.lineCap = 'round';
          for (const [a, b] of TGM.marks) {
            const ta = a * TU, tb = b * TU, front = (tl - ta) * TSPD, back = (tl - tb) * TSPD;
            if (front <= 0 || back >= WIRE.len) continue;
            const l0 = Math.max(0, back), l1 = Math.min(WIRE.len, front);
            ctx.strokeStyle = rgba([255, 200, 90], 0.35); ctx.lineWidth = 9;
            ctx.beginPath(); pathRange(ctx, WIRE, l0, l1); ctx.stroke();
            ctx.strokeStyle = rgba([255, 246, 210], 0.95); ctx.lineWidth = 2.6;
            ctx.beginPath(); pathRange(ctx, WIRE, l0, l1); ctx.stroke();
            const hp = tipAt(WIRE, l1);
            glow(ctx, hp[0], hp[1], 18, [255, 210, 120], 0.8);
          }
        });
      }
      // desk
      ctx.fillStyle = linG(ctx, 0, 164, 0, 300, [[0, '#4a2c18'], [1, '#1e1109']]);
      ctx.fillRect(-310, 164, 620, 150);
      ctx.fillStyle = 'rgba(255,200,150,0.14)'; ctx.fillRect(-310, 164, 620, 2);
      // key: pressed while a mark is being sent
      let down = false;
      if (tl >= 0) for (const [a, b] of TGM.marks) if (tl >= a * TU && tl < b * TU) { down = true; break; }
      ctx.fillStyle = linG(ctx, 0, 170, 0, 192, [[0, '#6b2f1b'], [1, '#3e190d']]); ctx.fillRect(-250, 170, 170, 22);
      ctx.fillStyle = '#b08a45'; ctx.fillRect(-166, 146, 12, 24); ctx.fillRect(-228, 160, 8, 10);
      const kp = keyPts(down ? -0.07 : 0);
      ctx.strokeStyle = linG(ctx, kp[0][0], 0, kp[1][0], 0, [[0, '#8a6a2a'], [0.5, '#e8c46e'], [1, '#8a6a2a']]); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); seg(ctx, kp[0][0], kp[0][1], kp[1][0], kp[1][1]); ctx.stroke();
      ctx.fillStyle = '#15110e'; ctx.beginPath(); ctx.ellipse(kp[0][0], kp[0][1] - 9, 15, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(kp[0][0] - 4, kp[0][1] - 12, 6, 3, 0, 0, TAU); ctx.fill();
      for (const x of [-92, -78]) circ(ctx, x, 178, 4.5, brassG(ctx, x, 178, 4.5));
      if (down) lit(ctx, () => glow(ctx, -224, 160, 20, [190, 220, 255], 0.9));
      // register: armature pulls while current arrives
      let pull = false;
      if (tl >= 0) for (const [a, b] of TGM.marks) if (tl >= a * TU + travel && tl < b * TU + travel) { pull = true; break; }
      ctx.fillStyle = linG(ctx, 0, 180, 0, 210, [[0, '#6b2f1b'], [1, '#3e190d']]); ctx.fillRect(130, 180, 110, 30);
      for (const x of [150, 170]) {
        ctx.fillStyle = linG(ctx, x, 0, x + 16, 0, [[0, '#6a3413'], [0.5, '#d27a3a'], [1, '#6a3413']]); ctx.fillRect(x, 140, 16, 40);
        ctx.strokeStyle = 'rgba(40,16,4,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = 143; y < 180; y += 4) seg(ctx, x, y, x + 16, y); ctx.stroke();
      }
      ctx.fillStyle = '#b08a45'; ctx.fillRect(208, 134, 8, 46);
      ctx.save(); ctx.translate(212, 134); ctx.rotate(pull ? -0.06 : 0);
      ctx.fillStyle = '#4b4f57'; ctx.fillRect(-70, -4, 72, 8); ctx.restore();
      if (pull) lit(ctx, () => glow(ctx, 168, 140, 40, [255, 210, 130], 0.5));
      circ(ctx, 228, 168, 12, '#efe3c6'); circ(ctx, 228, 168, 3, '#6b4a2a');
      // paper tape with embossed marks
      ctx.fillStyle = '#efe3c6'; ctx.fillRect(-60, 193, 190, 6);
      if (tl >= 0) {
        ctx.fillStyle = '#3a2a1c';
        for (const [a, b] of TGM.marks) {
          const s0 = a * TU + travel, s1 = b * TU + travel;
          if (tl < s0) continue;
          const xa = 128 - (tl - s0) * TAPE, xb = 128 - (tl - Math.min(tl, s1)) * TAPE;
          if (xb < -60) continue;
          ctx.fillRect(Math.max(-60, xa), 195, Math.max(1.5, xb - Math.max(-60, xa)), 2);
        }
      }
      // decoded message
      if (tl >= 0) {
        let n = 0;
        for (let i = 0; i < TGM.ends.length; i++) if (tl >= TGM.ends[i] * TU + travel + 0.05) n = i + 1;
        const shown = MSG.slice(0, n), l1 = 'WHAT HATH', a1 = shown.slice(0, Math.min(shown.length, 9)), a2 = shown.length > 10 ? shown.slice(10) : '';
        const fade = 1 - prog(per - 0.6, per, tl);
        ctx.font = `600 30px ${FS}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        if (HAS_LS) ctx.letterSpacing = '5px';
        const w1 = ctx.measureText(l1).width, w2 = ctx.measureText('GOD WROUGHT').width;
        ctx.fillStyle = rgba([255, 236, 200], 0.95 * fade);
        ctx.fillText(a1, -w1 / 2, -206);
        ctx.fillText(a2, -w2 / 2, -166);
        if (fade > 0.5 && n < MSG.length && Math.floor(t * 3) % 2 === 0) {
          const onL2 = shown.length > 9, base = onL2 ? -w2 / 2 + ctx.measureText(a2).width : -w1 / 2 + ctx.measureText(a1).width;
          ctx.fillRect(base + 4, (onL2 ? -166 : -206) - 13, 3, 26);
        }
        if (HAS_LS) ctx.letterSpacing = '0px';
      }
    },
  });

  /* ================= 09 · THE LIGHT BULB ================= */
  const BULB = new P(-36, 128).C(-40, 90, -128, 40, -144, -14).A(0, -55, 150, 2.864, TAU + 0.277).C(128, 40, 40, 90, 36, 128).pts;
  const FIL = new P(-38, -50).C(-42, -120, -20, -152, 0, -152).C(20, -152, 42, -120, 38, -50).pts;
  const STEM = [-28, 128, -10, 100, -10, 46, 10, 46, 10, 100, 28, 128];
  function planck(l, T) { return 1 / (Math.pow(l, 5) * (Math.exp(14388 / (l * T)) - 1)); }
  const bulbLight = t => {
    const base = Math.pow(clamp(t / 1.15), 1.4);
    return clamp(base * (1 - 0.4 * Math.abs(noise1(t * 22, 7)) * (1 - clamp(t / 0.95))) + 0.02 * noise1(t * 3, 9));
  };

  SC_.push({
    id: 'bulb', n: '09', year: 1879, title: 'The Light Bulb', who: 'Thomas Edison · Menlo Park',
    line: 'Night became optional.', color: '#ffd27a',
    fig: 'ELEVATION · SPECTRUM', origin: 'MENLO PARK, NJ', date: '1879', scale: '2:1',
    tbTitle: 'INCANDESCENT LAMP', draft: 2.4, alive: 2.9, rot: 1.4, ignite: [0, -130],
    build(S) {
      S.frame(this);
      S.line(0, -238, 0, 240, { k: 'ctr' });
      S.poly(BULB);
      S.poly(new P(-5, -204).L(0, -218).L(5, -204).pts, { k: 'thin' });
      S.poly(STEM, { k: 'thin' });
      S.multi([[-6, 46, -38, -50], [6, 46, 38, -50]], { k: 'thin' });
      S.poly(FIL, { w: 2.6 });
      const wave = [];
      for (let y = 132; y <= 196; y += 2) wave.push(-40 - 4 * Math.sin(((y - 132) / 16) * TAU));
      S.poly(wave.flatMap((x, i) => [x, 132 + i * 2]));
      S.poly(wave.flatMap((x, i) => [-x, 132 + i * 2]));
      const th = [];
      for (let y = 136; y < 192; y += 14) th.push([-40, y, 40, y + 7]);
      S.multi(th, { k: 'thin' });
      S.rect(-28, 198, 56, 12);
      S.hatch([rectPts(-28, 198, 56, 12)], 5);
      S.poly(new P(-14, 210).Q(0, 228, 14, 210).pts);
      S.dim(-150, -55, 150, -55, 175, 'Ø 62');
      S.dim(0, -218, 0, 224, -190, 'H 110');
      // spectrum inset
      const ox = -570, oy = -120, w = 220, h = 120, lmax = 3;
      S.multi([[ox, oy, ox + w, oy], [ox, oy, ox, oy - h]], { k: 'thin' });
      let mx = 0;
      for (let i = 1; i <= 60; i++) mx = Math.max(mx, planck((i / 60) * lmax, 2100));
      const curve = [];
      for (let i = 2; i <= 60; i++) { const l = (i / 60) * lmax; curve.push(ox + (l / lmax) * w, oy - (planck(l, 2100) / mx) * (h - 10)); }
      S.poly(curve, { w: 1.8 });
      S.hatch([rectPts(ox + (0.38 / lmax) * w, oy - h + 6, ((0.75 - 0.38) / lmax) * w, h - 6)], 5, Math.PI / 4);
      S.text('VISIBLE', ox + (0.56 / lmax) * w, oy - h - 6, { align: 'c', size: 11 });
      for (const l of [1, 2, 3]) { S.line(ox + (l / lmax) * w, oy, ox + (l / lmax) * w, oy + 5, { k: 'thin' }); S.text(String(l), ox + (l / lmax) * w, oy + 14, { align: 'c', size: 11 }); }
      S.text('λ µm', ox + w + 4, oy, { size: 11 });
      S.text('SPECTRUM · CARBON AT 2100 K', ox + w / 2, oy + 34, { align: 'c', size: 13, a: 0.7 });
      S.notes(['NOTES', '1. BAMBOO FIBRE, CARBONISED', '2. AIR PUMPED OUT: NOTHING TO BURN', '3. MOST OUTPUT IS INFRARED'], -590, -60);
      S.balloon(30, -118, 340, -205, 'A', 'CARBON FILAMENT');
      S.balloon(110, -40, 340, -145, 'B', 'VACUUM · 1/1,000,000 ATM');
      S.balloon(21.3, 0, 340, -85, 'C', 'PLATINUM LEAD-IN WIRES');
      S.balloon(40, 165, 340, -25, 'D', 'SCREW BASE');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const L = bulbLight(t), lod = env.lod;
      ctx.fillStyle = radG(ctx, 0, -100, 10, 420, [[0, mix('#0b0806', '#5a3b1d', L)], [0.6, mix('#070504', '#2a1a0e', L)], [1, '#050403']]);
      ctx.fillRect(-310, -310, 620, 620);
      ctx.fillStyle = linG(ctx, 0, 262, 0, 300, [[0, mix('#0d0907', '#4a3018', L)], [1, '#080504']]);
      ctx.fillRect(-310, 262, 620, 60);
      ctx.fillStyle = rgba(mix('#161210', '#e9dfcc', 0.3 + 0.5 * L), 1);
      ctx.fillRect(-60, 222, 120, 40);
      ctx.fillStyle = linG(ctx, -40, 0, 40, 0, [[0, '#6a5020'], [0.45, mix('#8a6a30', '#f2d38a', L)], [1, '#5a4018']]);
      ctx.fillRect(-40, 130, 80, 68);
      ctx.strokeStyle = 'rgba(40,26,8,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); for (let y = 136; y < 192; y += 14) seg(ctx, -40, y, 40, y + 7); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.fillRect(-28, 198, 56, 12);
      ctx.fillStyle = '#b99452'; ctx.beginPath(); ctx.moveTo(-14, 210); ctx.quadraticCurveTo(0, 228, 14, 210); ctx.fill();
      // glass
      ctx.fillStyle = radG(ctx, -40, -110, 10, 170, [[0, [255, 250, 240], 0.08 + 0.06 * L], [1, [255, 240, 220], 0.03]]);
      fillPts(ctx, BULB);
      ctx.fillStyle = rgba([220, 230, 240], 0.12); fillPts(ctx, STEM);
      ctx.strokeStyle = rgba([200, 205, 215], 0.8); ctx.lineWidth = 1.6;
      ctx.beginPath(); seg(ctx, -6, 46, -38, -50); seg(ctx, 6, 46, 38, -50); ctx.stroke();
      // filament: dull red to white-hot
      const fc = L < 0.5 ? mix([110, 18, 0], [255, 120, 30], L / 0.5) : mix([255, 120, 30], [255, 244, 214], (L - 0.5) / 0.5);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = rgba(fc, 0.35 + 0.65 * clamp(L * 3)); ctx.lineWidth = 3.2; strokePts(ctx, FIL);
      lit(ctx, () => {
        ctx.strokeStyle = rgba(fc, 0.5 * L); ctx.lineWidth = 10; strokePts(ctx, FIL);
        glow(ctx, 0, -110, 90, [255, 214, 150], 0.9 * L);
        glow(ctx, 0, -100, 260, [255, 190, 110], 0.55 * L);
        ctx.strokeStyle = rgba([255, 255, 255], 0.28 + 0.3 * L); ctx.lineWidth = 2.2; strokePts(ctx, BULB);
        ctx.strokeStyle = rgba([255, 255, 255], 0.3 + 0.35 * L); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, -55, 130, Math.PI * 1.08, Math.PI * 1.38); ctx.stroke();
        if (lod > 0.35 && L > 0.2) for (let i = 0; i < 34; i++) {
          const x = (hash(i, 141) * 2 - 1) * 260 + 14 * Math.sin(t * 0.4 + i), y = -250 + hash(i, 142) * 480 - ((t * 9 + i * 13) % 60);
          circ(ctx, x, y, 0.8 + hash(i, 143) * 1.4, rgba([255, 228, 180], 0.55 * L * (0.5 + 0.5 * Math.sin(t * 2 + i))));
        }
      });
    },
    over(ctx, t, env) {
      const L = bulbLight(t);
      if (L < 0.02) return;
      lit(ctx, () => {
        glow(ctx, 0, -100, 900, [255, 200, 130], 0.2 * L);
        if (env.lod > 0.3) {
          ctx.fillStyle = radG(ctx, 0, -100, 60, 760, [[0, [255, 214, 150], 0.09 * L], [1, [255, 214, 150], 0]]);
          ctx.beginPath();
          for (let i = 0; i < 14; i++) {
            const a = (i / 14) * TAU + t * 0.05, w = 0.05 + 0.03 * hash(i, 151);
            ctx.moveTo(0, -100); ctx.arc(0, -100, 760, a - w, a + w); ctx.closePath();
          }
          ctx.fill();
        }
      });
    },
  });

  /* ================= 10 · THE AUTOMOBILE ================= */
  const CAR = { rw: [-110, 120], rr: 95, fw: [170, 145], fr: 70 };
  const carSpeed = t => 170 * (1 - Math.exp(-t / 1.2));
  const carDist = t => 170 * (t - 1.2 * (1 - Math.exp(-t / 1.2)));
  function spokedWheel(ctx, x, y, r, ang, n, lod) {
    circ(ctx, x, y, r - 3.5, null, '#18181a', 7);
    circ(ctx, x, y, r - 8, null, '#b9b3a2', 2.2);
    ctx.strokeStyle = 'rgba(214,210,196,0.85)'; ctx.lineWidth = lod > 0.4 ? 1.3 : 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = ang + (i * TAU) / n; seg(ctx, x + Math.cos(a) * 9, y + Math.sin(a) * 9, x + Math.cos(a) * (r - 9), y + Math.sin(a) * (r - 9)); }
    ctx.stroke();
    circ(ctx, x, y, 11, brassG(ctx, x, y, 11));
  }
  function signPost(ctx, x, y) {
    ctx.fillStyle = '#4a3420'; ctx.fillRect(x - 2, y - 58, 4, 58);
    ctx.fillStyle = '#e8dcc0'; fillPts(ctx, [x - 30, y - 62, x + 30, y - 62, x + 38, y - 54, x + 30, y - 46, x - 30, y - 46]);
    ctx.fillStyle = '#2a1e14'; ctx.font = `600 10px ${FT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (HAS_LS) ctx.letterSpacing = '1px';
    ctx.fillText('PFORZHEIM', x + 2, y - 54);
    if (HAS_LS) ctx.letterSpacing = '0px';
  }

  SC_.push({
    id: 'car', n: '10', year: 1886, title: 'The Automobile', who: 'Karl Benz · Mannheim',
    line: 'In 1888, Bertha Benz drove it 106 km to prove it worked.', color: '#8cc36e',
    fig: 'PATENT-MOTORWAGEN · SIDE ELEVATION', origin: 'MANNHEIM', date: '29 JAN 1886', scale: '1:12',
    tbTitle: 'MOTORWAGEN', draft: 2.4, alive: 2.7, rot: 1.3, ignite: [-166, 72],
    build(S) {
      const { rw, rr, fw, fr } = CAR;
      S.frame(this);
      S.line(-290, 215, 290, 215, { k: 'thin' });
      for (const [w, r, n] of [[rw, rr, 16], [fw, fr, 12]]) {
        S.circle(w[0], w[1], r);
        S.circle(w[0], w[1], r - 8, { k: 'thin' });
        S.circle(w[0], w[1], 11);
        const sp = [];
        for (let i = 0; i < n; i++) { const a = (i * TAU) / n; sp.push([w[0] + Math.cos(a) * 11, w[1] + Math.sin(a) * 11, w[0] + Math.cos(a) * (r - 8), w[1] + Math.sin(a) * (r - 8)]); }
        S.multi(sp, { k: 'thin' });
        S.centre(w[0], w[1], r + 16);
      }
      S.poly([-204, 98, 100, 98, 150, 62], { w: 3 });
      S.multi([[146, 62, 166, 145], [154, 62, 174, 145]]);
      S.line(150, 62, 132, -24, { w: 2.6 });
      S.line(108, -27, 150, -31, { w: 2.6 });
      S.circle(106, -27, 6);
      S.poly(rrectPts(-72, 40, 144, 18, 6));
      S.poly([-72, 44, -86, -8, -74, -12, -62, 40]);
      S.multi([[-50, 58, -50, 98], [50, 58, 50, 98]], { k: 'thin' });
      S.rect(-206, 58, 72, 28);
      S.hatch([rectPts(-206, 58, 72, 28)], 7);
      S.rect(-196, 18, 60, 36, { k: 'thin' });
      S.poly(ellPts(-152, 112, 52, 8, 0, 0, TAU, 40), { k: 'hid' });
      S.circle(-40, 100, 10, { k: 'thin' });
      S.multi([[-40, 90, -110, 104], [-40, 110, -110, 136]], { k: 'thin' });
      S.rect(-12, 64, 40, 26, { k: 'thin' });
      S.dim(rw[0], 215, fw[0], 215, -40, 'WHEELBASE 1450');
      S.notes(['NOTES', '1. PATENT DRP 37435, 1886', '2. 0.75 HP AT 400 RPM', '3. TOP SPEED 16 KM/H'], -590, -60);
      S.balloon(116, -26, 340, -205, 'A', 'TILLER STEERING');
      S.balloon(40, 44, 340, -145, 'B', 'BENCH SEAT');
      S.balloon(196, 108, 340, -85, 'C', 'WIRE-SPOKED WHEELS');
      S.balloon(-200, 72, -340, 44, 'D', '954 CC ENGINE', { left: true });
      S.balloon(-196, 112, -340, 104, 'E', 'FLYWHEEL', { left: true });
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const { rw, rr, fw, fr } = CAR, lod = env.lod, v = carSpeed(t), d = carDist(t), vk = v / 170;
      ctx.fillStyle = linG(ctx, 0, -300, 0, 96, [[0, '#8cc0e2'], [1, '#eef1e4']]);
      ctx.fillRect(-310, -310, 620, 410);
      for (let i = 0; i < 5; i++) {
        const cx = wrap(hash(i, 161) * 800 - d * 0.03 - t * 6, 800) - 400, cy = -240 + hash(i, 162) * 140;
        for (let j = 0; j < 4; j++) puff(ctx, cx + j * 22 - 33, cy + Math.sin(j * 2) * 6, 26 + 8 * Math.sin(j + i), [255, 255, 255], 0.55);
      }
      // Mannheim on the horizon, trees, fence
      ctx.fillStyle = '#a9b8c4';
      const tx = wrap(40 - d * 0.06, 900) - 450;
      for (let i = 0; i < 9; i++) ctx.fillRect(tx - 150 + i * 34, 96 - 14 - 12 * hash(i, 163), 30, 30);
      fillPts(ctx, [tx - 10, 96, tx - 10, 50, tx, 26, tx + 10, 50, tx + 10, 96]);
      fillPts(ctx, [tx + 110, 96, tx + 110, 62, tx + 118, 44, tx + 126, 62, tx + 126, 96]);
      ctx.fillStyle = linG(ctx, 0, 92, 0, 170, [[0, '#9fb86a'], [1, '#6f8f45']]);
      ctx.fillRect(-310, 94, 620, 90);
      for (let i = 0; i < 6; i++) {
        const x = wrap(hash(i, 164) * 900 - d * 0.3, 900) - 450, y = 104;
        ctx.fillStyle = '#4c6b34'; ctx.fillRect(x - 3, y - 10, 6, 22);
        for (let j = 0; j < 3; j++) puff(ctx, x + (j - 1) * 14, y - 26 - (j % 2) * 10, 22, [70, 104, 50], 0.95);
      }
      ctx.fillStyle = linG(ctx, 0, 170, 0, 300, [[0, '#c8a56e'], [1, '#8a6a40']]);
      ctx.fillRect(-310, 170, 620, 140);
      ctx.strokeStyle = 'rgba(90,64,34,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 18; i++) { const x = wrap(hash(i, 165) * 700 - d, 700) - 350, y = 186 + hash(i, 166) * 90; seg(ctx, x, y, x + 20 + 30 * hash(i, 167), y); }
      ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const x = wrap(i * 80 - d * 0.72, 720) - 360;
        ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x, 136, 5, 38);
        ctx.fillRect(x - 40, 146, 80, 3);
      }
      signPost(ctx, wrap(260 - d * 0.72, 1600) - 800, 174);
      // the car
      const jitter = Math.sin(t * 42) * 0.8 * vk + Math.abs(Math.sin(t * 5.3)) * 1.4 * vk;
      ctx.save(); ctx.translate(0, -jitter);
      ctx.fillStyle = 'rgba(40,28,16,0.35)'; ctx.beginPath(); ctx.ellipse(30, 216 + jitter, 190, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(60,64,70,0.6)'; ctx.beginPath(); ctx.ellipse(-152, 112, 52, 8, 0, 0, TAU); ctx.fill();
      spokedWheel(ctx, rw[0], rw[1] + jitter * 0.6, rr, d / rr, 16, lod);
      ctx.strokeStyle = '#1a1a1c'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokePts(ctx, [-204, 98, 100, 98, 150, 62]);
      ctx.lineWidth = 4; ctx.beginPath(); seg(ctx, 146, 62, 166, 145); seg(ctx, 154, 62, 174, 145); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); seg(ctx, 150, 62, 132, -24); seg(ctx, 108, -27, 150, -31); ctx.stroke();
      circ(ctx, 106, -27, 7, '#2a1a10');
      ctx.fillStyle = '#2e2f33'; ctx.fillRect(-206, 58, 72, 28);
      ctx.fillStyle = 'rgba(200,205,215,0.3)'; ctx.fillRect(-206, 58, 72, 3);
      ctx.fillStyle = linG(ctx, -196, 0, -136, 0, [[0, '#7a4020'], [0.5, '#d08850'], [1, '#6a3618']]); ctx.fillRect(-196, 18, 60, 36);
      ctx.strokeStyle = '#1a1a1c'; ctx.lineWidth = 2; ctx.beginPath(); seg(ctx, -50, 58, -50, 98); seg(ctx, 50, 58, 50, 98); ctx.stroke();
      ctx.fillStyle = linG(ctx, 0, 40, 0, 58, [[0, '#7a2a22'], [1, '#3e120e']]); fillPts(ctx, rrectPts(-72, 40, 144, 18, 6));
      ctx.fillStyle = linG(ctx, -86, 0, -62, 0, [[0, '#3e120e'], [1, '#7a2a22']]); fillPts(ctx, [-72, 44, -86, -8, -74, -12, -62, 40]);
      ctx.strokeStyle = '#1a1a1c'; ctx.lineWidth = 3; ctx.beginPath(); seg(ctx, -40, 100, -110, 104); ctx.stroke();
      circ(ctx, -40, 100, 10, brassG(ctx, -40, 100, 10));
      ctx.fillStyle = '#3a3b40'; ctx.fillRect(-12, 64, 40, 26);
      spokedWheel(ctx, fw[0], fw[1] + jitter * 0.6, fr, d / fr, 12, lod);
      ctx.restore();
      emit(t, 7, 1.6, (age, u, i) => puff(ctx, -214 - 60 * age - 90 * age * vk, 76 - 18 * age + 6 * Math.sin(i), 6 + 22 * u, [150, 156, 170], 0.35 * (1 - u) * vk));
      if (lod > 0.35) emit(t, 20, 0.9, (age, u, i) => {
        const x0 = hash(i, 168) > 0.5 ? rw[0] - 30 : fw[0] - 20;
        puff(ctx, x0 - 120 * age * vk - 30 * age, 212 - 30 * age * hash(i, 169), 4 + 14 * u, [200, 170, 120], 0.25 * (1 - u) * vk);
      });
    },
  });
})();
