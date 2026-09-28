/* The Wheel of Invention — scenes 11–15: airplane, penicillin, Saturn V, personal computer, World Wide Web. */
'use strict';
(() => {
  const SC_ = window.SCENES || (window.SCENES = []);
  const lit = (ctx, fn) => { ctx.globalCompositeOperation = 'lighter'; fn(); ctx.globalCompositeOperation = 'source-over'; };

  /* ================= 11 · THE AIRPLANE ================= */
  const wing = y => new P(-90, y).Q(-25, y - 12, 40, y).pts;
  const flyTakeoff = t => E.inOutCubic(prog(0.9, 4, t));
  function flyer(ctx, t, lod, blueprintOnly) {
    const fab = '#efe6d0', rib = 'rgba(120,96,60,0.45)', wood = '#a8784a';
    for (const y of [-50, 50]) {
      ctx.fillStyle = fab;
      fillPts(ctx, new P(-90, y).Q(-25, y - 12, 40, y).L(40, y + 2.5).Q(-25, y - 9, -90, y + 2.5).pts);
      if (lod > 0.35) { ctx.strokeStyle = rib; ctx.lineWidth = 1; ctx.beginPath(); for (let x = -84; x < 40; x += 10) seg(ctx, x, y - 1 - 7 * bump((x + 90) / 130), x, y + 2); ctx.stroke(); }
    }
    ctx.strokeStyle = wood; ctx.lineWidth = 2.4;
    ctx.beginPath(); for (const x of [-78, -25, 30]) seg(ctx, x, -48, x, 48); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,30,20,0.6)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); seg(ctx, -78, -48, -25, 48); seg(ctx, -25, -48, -78, 48); seg(ctx, -25, -48, 30, 48); seg(ctx, 30, -48, -25, 48); ctx.stroke();
    ctx.strokeStyle = wood; ctx.lineWidth = 2;
    ctx.beginPath(); seg(ctx, 40, -50, 150, -16); seg(ctx, 40, 50, 150, 16); seg(ctx, -90, -50, -188, -24); seg(ctx, -90, 50, -188, 24); ctx.stroke();
    ctx.fillStyle = fab;
    for (const y of [-16, 16]) fillPts(ctx, new P(150, y).Q(175, y - 6, 200, y).L(200, y + 2).Q(175, y - 4, 150, y + 2).pts);
    ctx.fillRect(-212, -34, 24, 68);
    ctx.strokeStyle = rib; ctx.lineWidth = 1; ctx.strokeRect(-212, -34, 24, 68);
    ctx.strokeStyle = wood; ctx.lineWidth = 1.6; ctx.beginPath(); seg(ctx, 175, -14, 175, 14); ctx.stroke();
    ctx.strokeStyle = '#5b4028'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-70, 50); ctx.lineTo(-60, 64); ctx.lineTo(150, 64); ctx.quadraticCurveTo(170, 64, 176, 44); ctx.stroke();
    ctx.fillStyle = '#2d2f33'; ctx.fillRect(-36, 30, 30, 18);
    ctx.fillStyle = '#1d1b1a'; ctx.beginPath(); ctx.ellipse(12, 42, 26, 6, 0, 0, TAU); ctx.fill();
    circ(ctx, 44, 38, 6, '#1d1b1a');
    // pusher propellers: blurred discs with a flickering blade
    for (const [x, ph] of [[-104, 0], [-110, 1.3]]) {
      const a = t * 38 + ph;
      ctx.fillStyle = 'rgba(120,90,60,0.18)'; ctx.beginPath(); ctx.ellipse(x, 0, 6, 58, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(110,78,48,0.9)'; ctx.lineWidth = 4;
      ctx.beginPath(); seg(ctx, x, -58 * Math.cos(a), x, 58 * Math.cos(a)); ctx.stroke();
    }
  }

  SC_.push({
    id: 'plane', n: '11', year: 1903, title: 'The Airplane', who: 'Orville & Wilbur Wright · Kitty Hawk',
    line: '12 seconds and 120 feet, and the sky was open.', color: '#7fc8f8',
    fig: 'WRIGHT FLYER · SIDE ELEVATION', origin: 'KITTY HAWK, NC', date: '17 DEC 1903', scale: '1:30',
    tbTitle: 'WRIGHT FLYER', draft: 2.4, alive: 2.8, rot: 1.3, ignite: [-20, 38],
    build(S) {
      S.frame(this);
      S.poly(wing(-50)); S.poly(wing(50));
      S.multi([[-78, -48, -78, 48], [-25, -48, -25, 48], [30, -48, 30, 48]]);
      S.multi([[-78, -48, -25, 48], [-25, -48, -78, 48], [-25, -48, 30, 48], [30, -48, -25, 48]], { k: 'thin' });
      S.multi([[40, -50, 150, -16], [40, 50, 150, 16], [-90, -50, -188, -24], [-90, 50, -188, 24]], { k: 'thin' });
      S.poly(new P(150, -16).Q(175, -22, 200, -16).pts); S.poly(new P(150, 16).Q(175, 10, 200, 16).pts);
      S.rect(-212, -34, 24, 68);
      S.poly(new P(-70, 50).L(-60, 64).L(150, 64).Q(170, 64, 176, 44).pts, { k: 'thin' });
      S.rect(-36, 30, 30, 18, { k: 'thin' });
      S.poly(ellPts(12, 42, 26, 6), { k: 'thin' });
      S.circle(44, 38, 6, { k: 'thin' });
      S.poly(ellPts(-104, 0, 6, 58), { k: 'ph' });
      S.line(-104, -58, -104, 58);
      S.line(-240, 0, 230, 0, { k: 'ctr' });
      // front view inset
      const fy = -182;
      S.multi([[-585, fy - 10, -345, fy - 10], [-585, fy + 10, -345, fy + 10]]);
      const st = [];
      for (let x = -585; x <= -345; x += 30) st.push([x, fy - 10, x, fy + 10]);
      S.multi(st, { k: 'thin' });
      S.circle(-505, fy, 18, { k: 'hid' }); S.circle(-425, fy, 18, { k: 'hid' });
      S.multi([[-485, fy - 4, -445, fy - 4], [-485, fy + 4, -445, fy + 4], [-465, fy - 24, -465, fy - 10]], { k: 'thin' });
      S.text('FRONT VIEW · SPAN 12.3 M', -465, fy + 42, { align: 'c', size: 13, a: 0.7 });
      S.notes(['NOTES', '1. FIRST FLIGHT 17 DEC 1903', '2. 12 SECONDS · 120 FEET', '3. SPRUCE, ASH AND MUSLIN'], -590, -60);
      S.dim(-212, 64, 200, 64, -40, 'LENGTH 6.4 M');
      S.balloon(190, -18, 340, -205, 'A', 'CANARD ELEVATOR');
      S.balloon(0, -57, 340, -145, 'B', 'WING WARPING');
      S.balloon(-8, 36, 340, -85, 'C', '12 HP ENGINE');
      S.balloon(-104, -44, -340, 60, 'D', 'TWIN PUSHER PROPELLERS', { left: true });
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const lod = env.lod, lift = flyTakeoff(t), gy = 70 + 150 * lift, v = 150 * (1 - Math.exp(-t / 0.8)), d = 150 * (t - 0.8 * (1 - Math.exp(-t / 0.8)));
      ctx.fillStyle = linG(ctx, 0, -300, 0, 160, [[0, '#2f86d0'], [0.6, '#8ecbef'], [1, '#e9f5f6']]);
      ctx.fillRect(-310, -310, 620, 620);
      lit(ctx, () => glow(ctx, 220, -240, 200, [255, 250, 225], 0.5));
      for (let i = 0; i < 7; i++) {
        const cx = wrap(hash(i, 171) * 900 - d * (0.08 + 0.1 * hash(i, 173)), 900) - 450, cy = -250 + hash(i, 172) * 200 + lift * 40;
        for (let j = 0; j < 5; j++) puff(ctx, cx + j * 20 - 40, cy + Math.sin(j * 1.7 + i) * 7, 20 + 10 * Math.sin(j + i), [255, 255, 255], 0.6);
      }
      const hz = 150 + 40 * lift;
      ctx.fillStyle = linG(ctx, 0, hz - 6, 0, hz + 10, [[0, '#6f9fbf'], [1, '#4f84a6']]);
      ctx.fillRect(-310, hz - 6, 620, 16);
      ctx.fillStyle = linG(ctx, 0, gy - 20, 0, gy + 160, [[0, '#ecd6a4'], [1, '#c7a468']]);
      const dune = new P(-310, gy + 10);
      for (let x = -310; x <= 310; x += 20) dune.L(x, gy - 8 + 10 * Math.sin((x + d * 0.9) * 0.012) + 6 * Math.sin((x + d * 0.9) * 0.031));
      dune.L(310, 320).L(-310, 320);
      fillPts(ctx, dune.pts);
      ctx.fillStyle = linG(ctx, 0, gy, 0, gy + 200, [[0, '#dcbf85'], [1, '#b08c52']]);
      const near = new P(-310, gy + 40);
      for (let x = -310; x <= 310; x += 20) near.L(x, gy + 22 + 8 * Math.sin((x + d * 1.4) * 0.02));
      near.L(310, 320).L(-310, 320);
      fillPts(ctx, near.pts);
      // the 60-foot launching rail is left behind
      const rx = -150 - d;
      if (rx + 420 > -310) {
        ctx.fillStyle = '#6b4a2a'; ctx.fillRect(rx, gy + 1, 420, 4);
        ctx.fillStyle = '#4a321c'; for (let x = rx; x < rx + 420; x += 30) ctx.fillRect(x, gy + 5, 8, 4);
      }
      if (lod > 0.4) {
        ctx.strokeStyle = 'rgba(40,40,50,0.6)'; ctx.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) {
          const bx = wrap(hash(i, 174) * 600 - t * 30, 600) - 300, by = -150 + 50 * hash(i, 175), w = 6 + Math.sin(t * 6 + i) * 2;
          ctx.beginPath(); ctx.moveTo(bx - 7, by - w * 0.4); ctx.quadraticCurveTo(bx - 3, by - w, bx, by); ctx.quadraticCurveTo(bx + 3, by - w, bx + 7, by - w * 0.4); ctx.stroke();
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) { const x = wrap(hash(i, 176) * 700 - t * 520, 700) - 350, y = -140 + hash(i, 177) * 250; seg(ctx, x, y, x + 30 + 30 * hash(i, 178), y); }
      ctx.globalAlpha = clamp(v / 150); ctx.stroke(); ctx.globalAlpha = 1;
      const bob = lift > 0.05 ? 3 * Math.sin(t * 2.3) : 0, pitch = -0.07 * bump(prog(0.9, 3.4, t)) + 0.01 * Math.sin(t * 1.7) * lift;
      ctx.fillStyle = 'rgba(80,60,30,0.25)'; ctx.beginPath(); ctx.ellipse(0, gy + 6, 150 * (1 - lift * 0.5), 6, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(0, bob); ctx.rotate(pitch);
      flyer(ctx, t, lod);
      ctx.restore();
    },
  });

  /* ================= 12 · PENICILLIN ================= */
  const PN = { m: [-70, -62], mr: 44, zone: 112 };
  const COLS = (() => {
    const out = [], r = rng(1928);
    while (out.length < 64) {
      const a = r() * TAU, d = Math.sqrt(r()) * 182, x = Math.cos(a) * d, y = Math.sin(a) * d;
      const dm = Math.hypot(x - PN.m[0], y - PN.m[1]);
      if (dm < PN.mr + 10) continue;
      out.push({ x, y, r: 3 + r() * 5, dm });
    }
    out.push({ x: 118, y: 64, r: 7, dm: Math.hypot(118 - PN.m[0], 64 - PN.m[1]) });
    return out;
  })();
  const MOL = (() => {
    const A = [-30, 30], B = [-30, 0], C = [0, 0], D = [0, 30], Sx = [28.5, -9.3], Ex = [46.1, 15], F = [28.5, 39.3];
    const O1 = [-51, 51], NH = [-51, -21], CA = [-81, -21], O2 = [-81, -51], CH = [-102, 0], O3 = [73.5, 65], CC = [43.5, 65], O4 = [28.5, 91];
    const ring = polyReg(-149, 36, 30, 6, -Math.PI / 6);
    const single = [[A, B], [B, C], [C, D], [D, A], [C, Sx], [Sx, Ex], [Ex, F], [F, D], [B, NH], [NH, CA], [CA, CH], [CH, [ring[0], ring[1]]], [Ex, [72, 0]], [Ex, [72, 30]], [F, CC], [CC, O4]];
    const dbl = [[A, O1], [CA, O2], [CC, O3]];
    const labels = [['S', Sx], ['N', D], ['O', O1], ['O', O2], ['O', O3], ['OH', O4], ['HN', NH]];
    return { single, dbl, labels, ring };
  })();

  SC_.push({
    id: 'penicillin', n: '12', year: 1928, title: 'Penicillin', who: 'Alexander Fleming · London',
    line: 'A stray mould on a forgotten dish became the first antibiotic.', color: '#9ad47b',
    fig: 'CULTURE PLATE · PLAN AND SECTION', origin: "ST MARY'S, LONDON", date: 'SEPT 1928', scale: '1:1',
    tbTitle: 'PENICILLIN', draft: 2.3, alive: 2.7, rot: 1.3, ignite: [-70, -62],
    build(S) {
      const { m, mr, zone } = PN;
      S.frame(this);
      S.circle(0, 0, 212, { k: 'thin' });
      S.circle(0, 0, 202);
      S.circle(0, 0, 194, { k: 'thin' });
      S.centre(0, 0, 226);
      S.circle(m[0], m[1], mr);
      const hair = [];
      for (let i = 0; i < 30; i++) { const a = (i / 30) * TAU; hair.push([m[0] + Math.cos(a) * mr, m[1] + Math.sin(a) * mr, m[0] + Math.cos(a) * (mr + 7 + 4 * hash(i, 181)), m[1] + Math.sin(a) * (mr + 7 + 4 * hash(i, 181))]); }
      S.multi(hair, { k: 'thin' });
      S.circle(m[0], m[1], zone, { k: 'ph' });
      const live = [], lysed = [];
      for (const c of COLS) (c.dm < zone ? lysed : live).push(polyReg(c.x, c.y, c.r, 14));
      S.multi(live, { k: 'thin' });
      S.multi(lysed, { k: 'hid' });
      // section of the plate
      const sx = -466, sy = -206;
      S.poly([sx - 96, sy - 18, sx - 96, sy + 14, sx + 96, sy + 14, sx + 96, sy - 18]);
      S.poly([sx - 102, sy - 8, sx - 102, sy - 24, sx + 102, sy - 24, sx + 102, sy - 8], { k: 'thin' });
      S.hatch([rectPts(sx - 92, sy + 2, 184, 10)], 6, Math.PI / 4);
      S.hatch([rectPts(sx - 92, sy + 2, 184, 10)], 6, -Math.PI / 4);
      S.text('SECTION A–A · AGAR 4 MM', sx, sy + 38, { align: 'c', size: 13, a: 0.7 });
      // the molecule, solved by Dorothy Hodgkin in 1945
      const ox = -420, oy = -64, T = (p) => [p[0] + ox, p[1] + oy];
      S.multi(MOL.single.map(([a, b]) => [...T(a), ...T(b)]), { k: 'obj', w: 1.6, ph: 3 });
      S.poly(xform(MOL.ring, (x, y) => T([x, y])), { k: 'obj', w: 1.6, ph: 3 });
      const dbl = [];
      for (const [a, b] of MOL.dbl) {
        const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = (-dy / L) * 4, ny = (dx / L) * 4;
        dbl.push([...T([a[0] + nx, a[1] + ny]), ...T([b[0] + nx, b[1] + ny])], [...T([a[0] - nx, a[1] - ny]), ...T([b[0] - nx, b[1] - ny])]);
      }
      S.multi(dbl, { k: 'obj', w: 1.4, ph: 3 });
      for (const [l, p] of MOL.labels) { const q = T(p); S.text(l, q[0], q[1], { align: 'c', size: 13, weight: 700, box: true, ph: 4 }); }
      S.text('β-LACTAM RING · PENICILLIN G', -470, 52, { align: 'c', size: 13, a: 0.7 });
      S.dim(-202, 0, 202, 0, 250, 'Ø 90 MM');
      S.balloon(m[0] + 30, m[1] - 32, 340, -205, 'A', 'PENICILLIUM MOULD');
      S.balloon(m[0] + zone * Math.cos(0.35), m[1] + zone * Math.sin(0.35), 340, -145, 'B', 'ZONE OF INHIBITION');
      S.balloon(118, 64, 340, -85, 'C', 'STAPHYLOCOCCUS COLONY');
      S.balloon(180, 92, 340, -25, 'D', 'PETRI DISH');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const { m, mr } = PN, lod = env.lod, z = 58 + 60 * E.outCubic(clamp(t / 2.4)), grow = mr + 8 * E.outCubic(clamp(t / 3));
      ctx.fillStyle = radG(ctx, -30, -40, 20, 380, [[0, '#fbf7ec'], [1, '#cfc7b1']]);
      ctx.fillRect(-310, -310, 620, 620);
      ctx.fillStyle = 'rgba(60,50,30,0.2)'; ctx.beginPath(); ctx.arc(10, 14, 214, 0, TAU); ctx.fill();
      ctx.fillStyle = radG(ctx, -40, -50, 10, 210, [[0, '#f6db8e'], [0.75, '#e6bd62'], [1, '#c99b43']]);
      ctx.beginPath(); ctx.arc(0, 0, 196, 0, TAU); ctx.fill();
      // the cleared halo
      ctx.fillStyle = radG(ctx, m[0], m[1], grow, z + 10, [[0, '#fbe9b6', 0.75], [0.85, '#f8e2a4', 0.5], [1, '#f8e2a4', 0]]);
      ctx.beginPath(); ctx.arc(m[0], m[1], z + 10, 0, TAU); ctx.fill();
      circ(ctx, m[0], m[1], z, null, 'rgba(170,120,40,0.28)', 1.4);
      // colonies: those the zone reaches dissolve
      for (const c of COLS) {
        const k = c.dm < PN.zone ? clamp((c.dm - (z - 6)) / 14) : 1;
        if (k <= 0.02) continue;
        const cr = c.r * (0.7 + 0.3 * k);
        circ(ctx, c.x + 0.8, c.y + 1, c.r, rgba([180, 140, 70], 0.35 * k));
        circ(ctx, c.x, c.y, cr, rgba([236, 217, 162], k));
        if (lod > 0.35) circ(ctx, c.x - cr * 0.25, c.y - cr * 0.25, cr * 0.55, rgba([255, 251, 232], 0.85 * k));
      }
      // the mould: velvet centre, white fringe
      ctx.fillStyle = radG(ctx, m[0], m[1], 2, grow, [[0, '#2f5a45'], [0.55, '#5b8a60'], [0.85, '#a9c48f'], [1, '#eef2dc']]);
      ctx.beginPath(); ctx.arc(m[0], m[1], grow, 0, TAU); ctx.fill();
      if (lod > 0.35) {
        ctx.strokeStyle = 'rgba(250,250,240,0.75)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 90; i++) { const a = (i / 90) * TAU + hash(i, 182) * 0.05, r0 = grow - 4, r1 = grow + 4 + 7 * hash(i, 183) + Math.sin(t * 2 + i) * 1.2; seg(ctx, m[0] + Math.cos(a) * r0, m[1] + Math.sin(a) * r0, m[0] + Math.cos(a) * r1, m[1] + Math.sin(a) * r1); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(40,80,60,0.55)';
        for (let i = 0; i < 40; i++) { const a = hash(i, 184) * TAU, r = Math.sqrt(hash(i, 185)) * grow * 0.7; circ(ctx, m[0] + Math.cos(a) * r, m[1] + Math.sin(a) * r, 1.4, 'rgba(30,60,44,0.5)'); }
      }
      // glass
      circ(ctx, 0, 0, 202, null, 'rgba(255,255,255,0.8)', 2.5);
      circ(ctx, 0, 0, 212, null, 'rgba(210,220,230,0.7)', 3);
      lit(ctx, () => {
        ctx.strokeStyle = rgba([255, 255, 255], 0.5); ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(0, 0, 196, Math.PI * 1.08, Math.PI * 1.42); ctx.stroke();
        const sw = (t * 0.25) % 1.6 - 0.3;
        ctx.fillStyle = linG(ctx, -220 + sw * 440, -220, -140 + sw * 440, 220, [[0, [255, 255, 255], 0], [0.5, [255, 255, 255], 0.12], [1, [255, 255, 255], 0]]);
        ctx.beginPath(); ctx.arc(0, 0, 196, 0, TAU); ctx.fill();
      });
    },
  });

  /* ================= 13 · SATURN V ================= */
  const liftY = t => (t < 0.9 ? 0 : -0.5 * 38 * Math.pow(t - 0.9, 2));
  function saturn(ctx, lod) {
    const body = (x0, y0, x1, y1, c) => { ctx.fillStyle = linG(ctx, x0, 0, x1, 0, c || [[0, '#8e939b'], [0.35, '#ffffff'], [0.7, '#e7e9ec'], [1, '#9ea3ab']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); };
    ctx.fillStyle = '#222';
    for (const x of [-14, 0, 14]) fillPts(ctx, [x - 5, 248, x + 5, 248, x + 8, 268, x - 8, 268]);
    ctx.fillStyle = '#1b1b1d';
    fillPts(ctx, [23, 212, 38, 234, 38, 250, 23, 248]);
    fillPts(ctx, [-23, 212, -38, 234, -38, 250, -23, 248]);
    body(-23, 78, 23, 248);
    ctx.fillStyle = '#16171a';
    ctx.fillRect(-23, 78, 23, 18); ctx.fillRect(0, 96, 23, 18); ctx.fillRect(-23, 206, 23, 22); ctx.fillRect(-23, 68, 46, 10);
    if (lod > 0.4) { ctx.fillStyle = 'rgba(30,30,40,0.7)'; ctx.font = `700 9px ${FT}`; ctx.textAlign = 'center'; ctx.save(); ctx.translate(8, 160); ctx.rotate(-Math.PI / 2); ctx.fillText('USA', 0, 0); ctx.restore(); }
    body(-23, -44, 23, 68);
    ctx.fillStyle = linG(ctx, -23, 0, 23, 0, [[0, '#8e939b'], [0.35, '#fff'], [1, '#9ea3ab']]);
    fillPts(ctx, [-15, -60, 15, -60, 23, -44, -23, -44]);
    body(-15, -140, 15, -60);
    ctx.fillStyle = '#16171a'; ctx.fillRect(-15, -84, 15, 24);
    ctx.fillStyle = linG(ctx, -15, 0, 15, 0, [[0, '#9aa0a8'], [0.4, '#f3f4f6'], [1, '#a4a9b1']]);
    fillPts(ctx, [-9, -178, 9, -178, 15, -140, -15, -140]);
    body(-9, -208, 9, -178, [[0, '#6f757e'], [0.4, '#dfe3e8'], [1, '#7a8089']]);
    ctx.fillStyle = linG(ctx, -9, 0, 9, 0, [[0, '#6f757e'], [0.45, '#f4f6f8'], [1, '#7a8089']]);
    fillPts(ctx, [-9, -208, 9, -208, 0, -224]);
    ctx.strokeStyle = '#cf3b2a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); seg(ctx, -4, -224, 0, -240); seg(ctx, 4, -224, 0, -240); ctx.stroke();
    ctx.fillStyle = '#e9ecef'; ctx.fillRect(-2.5, -262, 5, 24);
    fillPts(ctx, [-2.5, -262, 2.5, -262, 0, -270]);
  }
  function plume(ctx, x, y, L, w, t) {
    const f = 1 + 0.12 * noise1(t * 20, 5);
    for (const [ww, ll, c, a] of [[2.2, 1, [255, 120, 40], 0.5], [1.4, 0.72, [255, 200, 90], 0.75], [0.7, 0.4, [255, 250, 225], 0.95]]) {
      ctx.fillStyle = linG(ctx, 0, y, 0, y + L * ll * f, [[0, c, a], [1, c, 0]]);
      ctx.beginPath(); ctx.moveTo(x - w * ww * 0.5, y); ctx.quadraticCurveTo(x - w * ww, y + L * ll * f * 0.4, x, y + L * ll * f); ctx.quadraticCurveTo(x + w * ww, y + L * ll * f * 0.4, x + w * ww * 0.5, y); ctx.closePath(); ctx.fill();
    }
    glow(ctx, x, y + 6, w * 3.2, [255, 214, 150], 0.8);
  }
  const TOWER = (() => {
    const L = [];
    for (let y = 268; y > -200; y -= 36) L.push([-120, y, -84, y - 36], [-84, y, -120, y - 36], [-120, y, -84, y]);
    return L;
  })();

  SC_.push({
    id: 'saturn', n: '13', year: 1969, title: 'Saturn V', who: 'Apollo 11 · Kennedy Space Center',
    line: 'Four days after launch, Apollo 11 touched down on the Moon.', color: '#ff6b35',
    fig: 'LAUNCH VEHICLE · ELEVATION', origin: 'CAPE KENNEDY, FL', date: '16 JUL 1969', scale: '1:250',
    tbTitle: 'SATURN V', draft: 2.4, alive: 3.3, rot: 1.3, ignite: [0, 262],
    shake: t => (t > 0 && t < 4 ? 7 * (1 - t / 4) * smooth(clamp(t / 0.4)) : 0),
    build(S) {
      S.frame(this);
      S.line(0, -284, 0, 284, { k: 'ctr' });
      S.poly([-2.5, -238, -2.5, -262, 0, -270, 2.5, -262, 2.5, -238]);
      S.poly([-9, -208, 0, -224, 9, -208]);
      S.rect(-9, -208, 18, 30);
      S.poly([-9, -178, -15, -140, 15, -140, 9, -178]);
      S.rect(-15, -140, 30, 80);
      S.poly([-15, -60, -23, -44, 23, -44, 15, -60]);
      S.rect(-23, -44, 46, 112);
      S.rect(-23, 68, 46, 10, { k: 'thin' });
      S.rect(-23, 78, 46, 170);
      S.hatch([rectPts(-23, 78, 23, 18), rectPts(0, 96, 23, 18), rectPts(-23, 206, 23, 22), rectPts(-15, -84, 15, 24)], 5);
      S.multi([[23, 212, 38, 234, 38, 250, 23, 248], [-23, 212, -38, 234, -38, 250, -23, 248]]);
      S.multi([-14, 0, 14].map(x => [x - 5, 248, x - 8, 268, x + 8, 268, x + 5, 248]));
      S.line(-120, 268, -120, -200); S.line(-84, 268, -84, -200);
      S.multi(TOWER, { k: 'thin' });
      S.multi([[-134, -204, -54, -204], [-134, -198, -54, -198]]);
      S.multi([-214, -120, -20, 90, 190].map(y => [-84, y, -26, y]), { k: 'thin' });
      S.rect(-210, 268, 370, 26, { k: 'thin' });
      // trajectory inset
      const ex = -520, ey = -172;
      S.circle(ex, ey, 40); S.circle(-392, -228, 12);
      S.poly(new P(ex + 40, ey + 4).C(-440, -184, -420, -246, -392, -244).A(-392, -228, 16, -Math.PI / 2, Math.PI * 0.75).C(-410, -196, -452, -150, ex + 38, ey + 12).pts, { k: 'ph' });
      S.text('TRANSLUNAR PATH · 384,400 KM', -470, -110, { align: 'c', size: 13, a: 0.7 });
      S.notes(['NOTES', '1. 7.5 MILLION LBF AT LIFTOFF', '2. 2,800 TONNES FUELLED', '3. THREE STAGES, 11 ENGINES'], -590, -60);
      S.dim(0, -270, 0, 268, 72, 'H 110.6 M');
      S.dim(-23, 150, 23, 150, -130, 'Ø 10.1 M', { size: 13 });
      S.balloon(3, -252, 340, -225, 'A', 'LAUNCH ESCAPE TOWER');
      S.balloon(9, -195, 340, -170, 'B', 'APOLLO COMMAND MODULE');
      S.balloon(15, -100, 340, -115, 'C', 'S-IVB · 1 × J-2');
      S.balloon(23, 10, 340, -60, 'D', 'S-II · 5 × J-2');
      S.balloon(23, 160, 340, -5, 'E', 'S-IC · 5 × F-1');
      S.balloon(-84, 100, -340, 76, 'F', 'UMBILICAL TOWER', { left: true });
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const lod = env.lod, sp = prog(4.8, 5.8, t);
      if (sp < 1) {
        ctx.fillStyle = linG(ctx, 0, -300, 0, 240, [[0, '#3f7fc0'], [0.7, '#9cc4e4'], [1, '#e9d6bc']]);
        ctx.fillRect(-310, -310, 620, 620);
        lit(ctx, () => glow(ctx, 0, 260, 360, [255, 170, 80], 0.5 * smooth(clamp(t / 0.6))));
        ctx.fillStyle = '#586b5a'; ctx.fillRect(-310, 232, 620, 90);
        ctx.fillStyle = '#6d8faa'; ctx.fillRect(-310, 226, 620, 8);
        ctx.fillStyle = '#7d4034';
        ctx.fillRect(-120, -200, 4, 470); ctx.fillRect(-88, -200, 4, 470);
        ctx.strokeStyle = '#9a4c3a'; ctx.lineWidth = 1.6;
        ctx.beginPath(); for (const q of TOWER) seg(ctx, q[0], q[1], q[2], q[3]); ctx.stroke();
        ctx.fillStyle = '#7d4034'; ctx.fillRect(-134, -206, 80, 8);
        const sw = E.inOutCubic(clamp((t - 0.1) / 0.8));
        ctx.strokeStyle = '#8a4636'; ctx.lineWidth = 4;
        for (const y of [-214, -120, -20, 90, 190]) {
          const a = sw * -1.2, L = 58;
          ctx.beginPath(); seg(ctx, -84, y, -84 + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
        }
        ctx.fillStyle = '#3a3c40'; ctx.fillRect(-210, 268, 370, 30);
      }
      if (sp > 0) {
        ctx.globalAlpha = sp;
        ctx.fillStyle = linG(ctx, 0, -300, 0, 300, [[0, '#01030b'], [1, '#0a1640']]);
        ctx.fillRect(-310, -310, 620, 620);
        lit(ctx, () => {
          for (let i = 0; i < 70; i++) {
            const x = (hash(i, 191) * 2 - 1) * 290, y = wrap(hash(i, 192) * 600 + t * 26, 600) - 300;
            circ(ctx, x, y, 0.6 + 1.2 * hash(i, 193), rgba([230, 238, 255], 0.8));
          }
        });
        ctx.fillStyle = radG(ctx, 0, 820, 560, 660, [[0, '#2f7fd0'], [0.92, '#7fc8ff'], [1, '#7fc8ff', 0]]);
        ctx.beginPath(); ctx.arc(0, 820, 660, 0, TAU); ctx.fill();
        lit(ctx, () => { ctx.strokeStyle = rgba([140, 210, 255], 0.5); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 820, 662, 0, TAU); ctx.stroke(); });
        ctx.save(); ctx.translate(0, -30 + Math.sin(t * 0.8) * 4); ctx.scale(0.62, 0.62);
        lit(ctx, () => plume(ctx, 0, 270, 240, 28, t));
        saturn(ctx, lod);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    },
    over(ctx, t, env) {
      const la = 1 - prog(4.8, 5.8, t);
      if (la <= 0 || t < 0) return;
      const y = liftY(t), ig = smooth(clamp(t / 0.5));
      ctx.save();
      ctx.globalAlpha = la;
      ctx.translate(0, y);
      lit(ctx, () => plume(ctx, 0, 262, (70 + 130 * clamp((t - 0.2) / 1.6)) * ig, 26, t));
      saturn(ctx, env.lod);
      ctx.restore();
      // smoke stays in the porthole, in front of the base
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, env.r, 0, TAU); ctx.clip();
      ctx.globalAlpha = la;
      const n = env.lod > 0.4 ? 1 : 0.4;
      emit(t, 30 * n, 3.6, (age, u, i) => {
        const side = hash(i, 201) > 0.5 ? 1 : -1, spd = 0.6 + 0.8 * hash(i, 202);
        const x = side * (20 + 230 * spd * (1 - Math.exp(-age * 1.3))), yy = 262 - (30 + 70 * hash(i, 203)) * age;
        const warm = clamp(1 - age * 1.2) * 0.7;
        puff(ctx, x, yy, 16 + 64 * u, mix([236, 234, 230], [255, 170, 90], warm), 0.55 * (1 - u));
      }, 0.05, 6);
      ctx.restore();
    },
  });

  /* ================= 14 · THE PERSONAL COMPUTER ================= */
  const PC_LINES = [[']10 PRINT "HELLO, WORLD"', 0.5], [']20 GOTO 10', 1.5], [']RUN', 2.05]];
  const PC_CPS = 26, PC_OUT = 2.35, PC_LOOP = 12;
  const KEYROWS = (() => {
    const rows = [];
    for (let r = 0; r < 4; r++) {
      const n = r === 3 ? 0 : 13, w = 21 + r * 0.9, y = 24 + r * 14, keys = [];
      if (r === 3) { keys.push([-66, y, 132, 11]); keys.push([-150, y, 60, 11]); keys.push([90, y, 60, 11]); }
      else { const tot = n * w + (n - 1) * 3; for (let i = 0; i < n; i++) keys.push([-tot / 2 + i * (w + 3), y, w, 11]); }
      rows.push(keys);
    }
    return rows.flat();
  })();
  const BASE = [-200, 96, -200, 30, -186, 6, 186, 6, 200, 30, 200, 96, -200, 96];

  SC_.push({
    id: 'pc', n: '14', year: 1977, title: 'The Personal Computer', who: 'Home computing · California',
    line: 'In 1977 you could buy a computer ready to use at home.', color: '#ffb000',
    fig: 'FRONT ELEVATION · MEDIA', origin: 'CALIFORNIA', date: '1977', scale: '1:6',
    tbTitle: 'PERSONAL COMPUTER', draft: 2.2, alive: 2.7, rot: 1.2, ignite: [0, -127],
    build(S) {
      S.frame(this);
      S.poly(rrectPts(-150, -232, 300, 214, 18));
      S.poly(rrectPts(-128, -212, 256, 170, 22), { k: 'thin' });
      S.poly(rrectPts(-118, -202, 236, 150, 20));
      S.rect(-40, -18, 80, 14, { k: 'thin' });
      S.poly(BASE);
      S.poly([-170, 20, 170, 20, 184, 80, -184, 80, -170, 20], { k: 'thin' });
      S.multi(KEYROWS.map(([x, y, w, h]) => rectPts(x, y, w, h)), { k: 'thin' });
      S.circle(180, 88, 3, { k: 'thin' });
      S.centre(0, -127, 140);
      S.dim(-118, -52, 118, -202, 0, '12 IN');
      S.dim(-200, 96, 200, 96, -34, 'W 380 MM');
      // floppy disk
      const fx = -470, fy = -172;
      S.rect(fx - 75, fy - 75, 150, 150);
      S.circle(fx, fy, 20);
      S.circle(fx, fy, 30, { k: 'thin' });
      S.circle(fx + 22, fy + 22, 4, { k: 'thin' });
      S.poly(rrectPts(fx - 8, fy + 38, 16, 34, 7), { k: 'thin' });
      S.rect(fx + 68, fy - 58, 7, 14, { k: 'thin' });
      S.text('5¼ IN FLEXIBLE DISK · 140 KB', fx, fy + 96, { align: 'c', size: 13, a: 0.7 });
      S.notes(['NOTES', '1. ONE-CHIP MICROPROCESSOR', '2. BASIC BUILT IN', '3. SOLD READY TO USE'], -590, -60);
      S.balloon(112, -176, 340, -205, 'A', 'CATHODE-RAY TUBE');
      S.balloon(140, 44, 340, -145, 'B', 'KEYBOARD · 52 KEYS');
      S.balloon(190, 70, 340, -85, 'C', '8-BIT CPU · 1 MHZ · 4 KB');
      S.balloon(180, 88, 340, -25, 'D', 'POWER LAMP');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const lod = env.lod, tl = t < PC_LOOP ? t : ((t - PC_LOOP) % (PC_LOOP - 0.4)) + 0.4, on = smooth(clamp(t / 0.35));
      const beam = E.outCubic(clamp(t / 0.45));
      ctx.fillStyle = linG(ctx, 0, -300, 0, 110, [[0, '#101218'], [1, '#1d1f27']]);
      ctx.fillRect(-310, -310, 620, 620);
      lit(ctx, () => glow(ctx, 0, -127, 420, [255, 170, 60], 0.28 * on));
      ctx.fillStyle = linG(ctx, 0, 96, 0, 300, [[0, '#3a2a1e'], [1, '#150e08']]);
      ctx.fillRect(-310, 96, 620, 220);
      lit(ctx, () => glow(ctx, 0, 110, 300, [255, 170, 60], 0.16 * on));
      const beige = (x0, y0, x1, y1) => linG(ctx, x0, y0, x1, y1, [[0, '#efe6cc'], [0.6, '#d6caa8'], [1, '#a99c7c']]);
      ctx.fillStyle = beige(0, 6, 0, 96); fillPts(ctx, BASE);
      ctx.fillStyle = '#2b2622'; fillPts(ctx, [-170, 20, 170, 20, 184, 80, -184, 80]);
      const typed = [];
      let chars = 0;
      for (const [s, t0] of PC_LINES) { const n = clamp(Math.floor((tl - t0) * PC_CPS), 0, s.length); typed.push(s.slice(0, n)); chars += n; }
      const hot = Math.floor((tl - 0.5) * PC_CPS);
      KEYROWS.forEach(([x, y, w, h], i) => {
        const press = tl > 0.5 && tl < 2.2 && ((hash(hot, 211) * KEYROWS.length) | 0) === i ? 1 : 0;
        ctx.fillStyle = press ? '#e8dcc0' : '#4a433c'; ctx.fillRect(x, y + press, w, h - 1);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, y + press, w, 1.5);
      });
      circ(ctx, 180, 88, 3, on > 0.5 ? '#ff4a2a' : '#5a2a20');
      if (on > 0.5) lit(ctx, () => glow(ctx, 180, 88, 12, [255, 80, 40], 0.7));
      ctx.fillStyle = beige(0, -18, 0, -4); ctx.fillRect(-40, -18, 80, 14);
      ctx.fillStyle = beige(0, -232, 0, -18); fillPts(ctx, rrectPts(-150, -232, 300, 214, 18));
      ctx.fillStyle = '#2a2622'; fillPts(ctx, rrectPts(-128, -212, 256, 170, 22));
      // the screen
      ctx.save();
      ctx.beginPath(); tracePts(ctx, rrectPts(-118, -202, 236, 150, 20), true); ctx.clip();
      ctx.fillStyle = '#0d0a06'; ctx.fillRect(-118, -202, 236, 150);
      if (t < 0.5) {
        const hh = 150 * beam;
        lit(ctx, () => {
          ctx.fillStyle = rgba([255, 214, 150], 0.9 * (1 - beam * 0.6)); ctx.fillRect(-118, -127 - Math.max(1.5, hh / 2), 236, Math.max(3, hh));
          glow(ctx, 0, -127, 160, [255, 200, 120], 0.6 * (1 - beam));
        });
      }
      ctx.fillStyle = radG(ctx, 0, -127, 20, 150, [[0, '#2a1800', on], [1, '#0d0802', on]]);
      ctx.fillRect(-118, -202, 236, 150);
      if (t > 0.45) {
        const lines = typed.filter((s, i) => tl >= PC_LINES[i][1]);
        if (tl >= PC_OUT) { const n = Math.floor((tl - PC_OUT) * 16); for (let i = 0; i < n; i++) lines.push('HELLO, WORLD'); }
        const vis = lines.slice(-9);
        ctx.font = `17px ${FM}`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
        ctx.fillStyle = '#ffb000';
        if (lod > 0.5) { ctx.shadowColor = 'rgba(255,160,0,0.9)'; ctx.shadowBlur = 7; }
        vis.forEach((s, i) => ctx.fillText(s, -106, -195 + i * 15.5));
        ctx.shadowBlur = 0;
        if (Math.floor(t * 2.5) % 2 === 0) {
          const last = vis.length ? vis[vis.length - 1] : '', typing = tl < PC_OUT;
          const cy = -195 + (typing ? vis.length - 1 : vis.length) * 15.5, cx = typing ? -106 + ctx.measureText(last).width : -106;
          ctx.fillRect(cx + 1, cy, 8, 14);
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let y = -202; y < -52; y += 3) ctx.fillRect(-118, y, 236, 1);
      ctx.fillStyle = radG(ctx, 0, -127, 60, 160, [[0, [0, 0, 0], 0], [1, [0, 0, 0], 0.55]]);
      ctx.fillRect(-118, -202, 236, 150);
      lit(ctx, () => { ctx.fillStyle = linG(ctx, -118, -202, 0, -100, [[0, [255, 255, 255], 0.09], [1, [255, 255, 255], 0]]); ctx.fillRect(-118, -202, 236, 150); });
      ctx.restore();
    },
  });

  /* ================= 15 · THE WORLD WIDE WEB ================= */
  const LAND_B64 = 'AACgAFyAAVwAgBU4Acgh84Af/EAFH4iAAP/mxD///8//IQG///7BP8cACf//4gQf94AS///8YAD/3gA/////IAAf/kAD////8AAAP/+AA//f//0AAAf/4ABbxv//8gAAB//AADjvv//4AAAAf/wAAYV+///SAAAAf/gAAHgP///kAAAAAf8AAA/mf///wAAAAAPCAAAf/////8AAAAAB8AAAB//vH//4AAAAAAMEAAB//9+P38AAAAAAByCAAH//34ePAAAAAAAAcAAAH//7gODhAAAAAAABgAAB///QBg8IAAAAAAACdAAH//9gECggAAAAAAAB+AAP//+AEEAAAAAAAAAD/gAEP/8AAIMAAAAAAAAD/gAAH/4AAG4AAAAAAAAH/4AAH/wAACaIAAAAAAAH/+AAD/gAACAHAAAAAAAH//AAD/AAABgHAAAAAAAP/8AAP+AAAAAAAAAAAAAf/gAA/5AAAAMAA/////8AH//gDf///gv/gAAAAB/4AAP5gAAA/wAAAAAAD/gAA/EAAAf/AAAAAAA/gAAfgAAAf/gAAAAAB+AAA+AAAB/8AAAAAAfAAAOAAAA/8AAAAAA6AAAAAAAEDgAAAAAeAAAAAAAAHAAAAABwAAAAAAAAAAAAABgAAAAAAAAAAAAAwAAAAAAAAIAAACAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABn/AACAX//AXh//+H4//48f/nv+AA';
  const LAND = (() => {
    const bin = atob(LAND_B64), out = [];
    let k = 0;
    for (let i = 0; i < 60; i++) {
      const lat = 88.5 - 3 * i, n = Math.max(1, Math.round(120 * Math.cos((lat * Math.PI) / 180)));
      for (let j = 0; j < n; j++, k++) {
        if ((bin.charCodeAt(k >> 3) >> (7 - (k & 7))) & 1) out.push(lat, -180 + ((j + 0.5) * 360) / n);
      }
    }
    return out;
  })();
  const CITY = [[46.2, 6.1], [51.5, -0.1], [48.9, 2.35], [52.5, 13.4], [40.7, -74], [37.8, -122.4], [35.7, 139.7], [-33.9, 151.2], [-23.5, -46.6], [-33.9, 18.4], [19.1, 72.9], [39.9, 116.4], [55.8, 37.6], [30, 31.2], [6.5, 3.4], [19.4, -99.1], [1.35, 103.8], [-1.3, 36.8], [-34.6, -58.4], [37.6, 127], [28.6, 77.2], [41, 29], [41.9, -87.6], [43.7, -79.4], [4.7, -74.1], [25.2, 55.3], [-6.2, 106.8], [34, -118.2], [59.3, 18.1], [40.4, -3.7]];
  const LINKS = [[0, 1], [0, 2], [0, 3], [1, 4], [0, 21], [2, 29], [3, 28], [4, 22], [4, 5], [12, 3], [13, 21], [4, 8], [1, 14], [21, 20], [5, 6], [20, 10], [6, 19], [11, 19], [10, 25], [25, 13], [14, 9], [9, 17], [17, 13], [16, 26], [16, 7], [11, 16], [8, 18], [15, 27], [24, 8], [23, 22], [27, 5], [6, 7], [12, 11], [29, 14], [4, 23], [15, 24], [1, 28], [10, 16]];
  const linkStart = k => 0.08 + 1.05 * Math.log2(1 + k * 0.85);
  const R_G = 200, TILT = (20 * Math.PI) / 180;
  const unit = (lat, lon) => { const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180; return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]; };
  function proj(v, lon0, lift = 1) {
    const c = Math.cos(lon0), s = Math.sin(lon0);
    const x1 = v[0] * c + v[1] * s, y1 = -v[0] * s + v[1] * c, z1 = v[2];
    const X = y1, Y = z1 * Math.cos(TILT) - x1 * Math.sin(TILT), Z = z1 * Math.sin(TILT) + x1 * Math.cos(TILT);
    return [X * R_G * lift, -Y * R_G * lift, Z];
  }
  function arcPts(a, b, lon0, n = 28) {
    const A = unit(...CITY[a]), B = unit(...CITY[b]);
    const om = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1)), so = Math.sin(om) || 1, out = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n, k0 = Math.sin((1 - s) * om) / so, k1 = Math.sin(s * om) / so;
      const v = [A[0] * k0 + B[0] * k1, A[1] * k0 + B[1] * k1, A[2] * k0 + B[2] * k1];
      out.push(proj(v, lon0, 1 + (0.06 + 0.2 * (om / Math.PI)) * Math.sin(Math.PI * s)));
    }
    return out;
  }
  const lonAt = t => ((8 - 12 * t) * Math.PI) / 180;
  const LON0 = lonAt(0);

  SC_.push({
    id: 'web', n: '15', year: 1989, title: 'The World Wide Web', who: 'Tim Berners-Lee · CERN, Geneva',
    line: 'His boss wrote “vague but exciting” on the proposal.', color: '#5ee0ff',
    fig: 'NETWORK · ORTHOGRAPHIC PROJECTION', origin: 'CERN, GENEVA', date: 'MARCH 1989', scale: 'NTS',
    tbTitle: 'WORLD WIDE WEB', draft: 2.3, alive: 2.8, rot: 1.2, ignite: proj(unit(...CITY[0]), LON0).slice(0, 2),
    build(S) {
      S.frame(this);
      S.circle(0, 0, R_G);
      const vis = [], hid = [];
      const addLine = pts => {
        let cur = null, curV = null;
        for (const p of pts) {
          const v = p[2] > 0;
          if (cur === null || v !== curV) { if (cur) cur.push(p[0], p[1]); cur = [p[0], p[1]]; (v ? vis : hid).push(cur); curV = v; }
          else cur.push(p[0], p[1]);
        }
      };
      for (let lon = -180; lon < 180; lon += 30) { const pts = []; for (let lat = -90; lat <= 90; lat += 3) pts.push(proj(unit(lat, lon), LON0)); addLine(pts); }
      for (let lat = -60; lat <= 60; lat += 30) { const pts = []; for (let lon = -180; lon <= 180; lon += 3) pts.push(proj(unit(lat, lon), LON0)); addLine(pts); }
      S.multi(vis.filter(q => q.length > 2), { k: 'thin' });
      S.multi(hid.filter(q => q.length > 2), { k: 'hid', a: 0.35 });
      for (let k = 0; k < 6; k++) { const a = arcPts(...LINKS[k], LON0).filter(p => p[2] > -0.1); if (a.length > 2) S.poly(a.flatMap(p => [p[0], p[1]]), { k: 'thin', ph: 3 }); }
      for (const c of CITY) { const p = proj(unit(...c), LON0); if (p[2] > 0.05) S.circle(p[0], p[1], 3.5, { k: 'obj', ph: 3 }); }
      // Berners-Lee's proposal, with Mike Sendall's note
      const bub = [['HYPERTEXT', -530, -236], ['CERN', -412, -236], ['DOCUMENT', -536, -168], ['LINKS', -404, -168]];
      for (const [l, x, y] of bub) { S.poly(ellPts(x, y, 46, 17)); S.text(l, x, y, { align: 'c', size: 12 }); }
      S.multi([[-484, -236, -458, -236], [-530, -219, -536, -185], [-412, -219, -404, -185], [-490, -168, -450, -168], [-500, -222, -440, -182]], { k: 'dim' });
      S.text('“Vague but exciting…”', -470, -118, { font: FS, weight: 400, size: 19, rot: -0.05, ls: 0, a: 0.95 });
      S.poly(new P(-560, -104).Q(-470, -96, -380, -110).pts, { k: 'thin', ph: 4 });
      S.notes(['NOTES', '1. HTML · HTTP · URL', '2. FIRST SITE: INFO.CERN.CH', '3. RELEASED ROYALTY-FREE, 1993'], -590, -60);
      const cern = proj(unit(...CITY[0]), LON0), link = arcPts(0, 1, LON0)[10], eq = proj(unit(0, 40), LON0);
      S.balloon(cern[0], cern[1], 340, -205, 'A', 'FIRST SERVER · CERN');
      S.balloon(link[0], link[1], 340, -145, 'B', 'HYPERLINK');
      S.balloon(eq[0], eq[1], 340, -85, 'C', 'EQUATOR · 40,075 KM');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const lod = env.lod, lon0 = lonAt(t);
      ctx.fillStyle = radG(ctx, 0, 0, 100, 420, [[0, '#0c1c3e'], [1, '#02040c']]);
      ctx.fillRect(-310, -310, 620, 620);
      lit(ctx, () => {
        for (let i = 0; i < 70; i++) circ(ctx, (hash(i, 221) * 2 - 1) * 290, (hash(i, 222) * 2 - 1) * 290, 0.5 + 1.1 * hash(i, 223), rgba([220, 232, 255], 0.35 + 0.35 * Math.sin(t * 1.3 + i)));
        glow(ctx, 0, 0, 290, [80, 190, 255], 0.35);
      });
      ctx.fillStyle = radG(ctx, -70, -80, 10, 240, [[0, '#2a6a9a'], [0.55, '#0e3358'], [1, '#04111f']]);
      ctx.beginPath(); ctx.arc(0, 0, R_G, 0, TAU); ctx.fill();
      const step = lod > 0.45 ? 1 : 2;
      for (let i = 0; i < LAND.length; i += 2 * step) {
        const p = proj(unit(LAND[i], LAND[i + 1]), lon0);
        if (p[2] <= 0.02) continue;
        ctx.fillStyle = rgba([130, 220, 245], 0.35 + 0.65 * p[2]);
        ctx.fillRect(p[0] - 1.6, p[1] - 1.6, 3.2, 3.2);
      }
      lit(ctx, () => {
        ctx.lineCap = 'round';
        LINKS.forEach(([a, b], k) => {
          const t0 = linkStart(k);
          if (t < t0) return;
          const g = E.outCubic(clamp((t - t0) / 0.7)), pts = arcPts(a, b, lon0), n = pts.length - 1, m = Math.max(1, Math.round(n * g));
          ctx.strokeStyle = rgba([94, 224, 255], 0.55); ctx.lineWidth = 1.5;
          ctx.beginPath();
          let pen = false;
          for (let i = 0; i <= m; i++) {
            const p = pts[i];
            if (p[2] < -0.12) { pen = false; continue; }
            if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; } else ctx.lineTo(p[0], p[1]);
          }
          ctx.stroke();
          const head = pts[m];
          if (g < 1 && head[2] > -0.12) glow(ctx, head[0], head[1], 14, [180, 240, 255], 0.9);
          if (g >= 1) {
            const s = ((t - t0) * 0.7 + hash(k, 224)) % 1, q = pts[Math.floor(s * n)];
            if (q[2] > -0.05) glow(ctx, q[0], q[1], 9, [255, 255, 255], 0.9);
          }
        });
        CITY.forEach((c, i) => {
          const p = proj(unit(...c), lon0);
          if (p[2] <= 0) return;
          const first = LINKS.findIndex(l => l[0] === i || l[1] === i), on = first < 0 ? 0 : clamp((t - linkStart(first) - 0.3) / 0.4);
          circ(ctx, p[0], p[1], 2.2, rgba([255, 244, 220], (0.3 + 0.7 * on) * p[2]));
          if (on > 0) glow(ctx, p[0], p[1], i === 0 ? 26 : 12, [255, 220, 160], 0.6 * on * p[2]);
        });
        ctx.strokeStyle = rgba([120, 220, 255], 0.55); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, R_G + 1, 0, TAU); ctx.stroke();
      });
      ctx.fillStyle = radG(ctx, 90, 70, 60, 230, [[0, [0, 0, 0], 0], [1, [0, 4, 12], 0.55]]);
      ctx.beginPath(); ctx.arc(0, 0, R_G, 0, TAU); ctx.fill();
    },
  });
})();
