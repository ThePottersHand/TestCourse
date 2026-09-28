/* The Wheel of Invention — scenes 01–05: wheel, screw, compass, press, telescope.
   Every scene draws in its cell's local frame: porthole centre (0,0), radius 280, y down.
   build(S) drafts the blueprint; scene(ctx, t, env) paints the living porthole, t = seconds since the burst. */
'use strict';
(() => {
  const SC_ = window.SCENES || (window.SCENES = []);
  const lit = (ctx, fn) => { ctx.globalCompositeOperation = 'lighter'; fn(); ctx.globalCompositeOperation = 'source-over'; };

  /* ================= 01 · THE WHEEL ================= */
  const WH = { cy: -10, R: 190, H: 112 };

  function palm(ctx, x, y, h, k) {
    const col = 'rgba(38,11,20,0.92)';
    ctx.strokeStyle = col; ctx.lineCap = 'round';
    const lean = (k % 2 ? 1 : -1) * 14, tx = x + lean, ty = y - h;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.2, y - h * 0.5, tx, ty); ctx.stroke();
    ctx.lineWidth = 2.6;
    for (let j = 0; j < 8; j++) {
      const a = -Math.PI / 2 + (j - 3.5) * 0.44, L = 40 + 8 * Math.sin(j * 2.1 + k);
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.9 - 8, tx + Math.cos(a) * L, ty + Math.sin(a) * L * 0.55 + 16);
      ctx.stroke();
    }
  }

  function plankWheel(ctx, R, ang, lod) {
    ctx.save();
    ctx.rotate(ang);
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
    const tones = [['#8e5530', '#ad6e3f'], ['#9c5f35', '#bd7e4c'], ['#8a522e', '#a8693c']], ed = [-R, -75, 75, R];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = linG(ctx, ed[i], 0, ed[i + 1], 0, [[0, tones[i][0]], [0.5, tones[i][1]], [1, tones[i][0]]]);
      ctx.fillRect(ed[i], -R, ed[i + 1] - ed[i], 2 * R);
    }
    if (lod > 0.35) {
      ctx.strokeStyle = 'rgba(58,26,10,0.28)'; ctx.lineWidth = 1.1;
      for (let i = 0; i < 16; i++) {
        const gx = -R + 12 + i * 24.5;
        ctx.beginPath();
        for (let yy = -R; yy <= R; yy += 12) {
          const xx = gx + Math.sin(yy * 0.03 + i * 1.7) * 4 + Math.sin(yy * 0.011 + i) * 3;
          if (yy === -R) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
      for (const [kx, ky] of [[-120, 40], [30, -140], [112, 128]]) {
        ctx.beginPath(); ctx.ellipse(kx, ky, 9, 5, 0.3, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(kx, ky, 4, 2.4, 0.3, 0, TAU); ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(34,14,4,0.85)'; ctx.lineWidth = 3.2;
    ctx.beginPath(); seg(ctx, -75, -R, -75, R); seg(ctx, 75, -R, 75, R); ctx.stroke();
    ctx.restore();
    for (const by of [-100, 100]) {
      ctx.fillStyle = linG(ctx, 0, by - 12, 0, by + 12, [[0, '#71401e'], [0.45, '#5a311a'], [1, '#3c1f0f']]);
      ctx.fillRect(-150, by - 12, 300, 24);
      ctx.fillStyle = 'rgba(255,210,160,0.2)'; ctx.fillRect(-150, by - 12, 300, 2.5);
      for (const bx of [-128, -40, 40, 128]) { circ(ctx, bx, by, 5, '#c98a4b'); circ(ctx, bx - 1.2, by - 1.2, 1.8, 'rgba(255,232,196,0.75)'); }
    }
    circ(ctx, 0, 0, R - 2.5, null, 'rgba(40,16,6,0.9)', 5);
    circ(ctx, 0, 0, R - 13, null, 'rgba(255,214,170,0.1)', 2);
    circ(ctx, 0, 0, 55, '#3f210f');
    circ(ctx, 0, 0, 50, null, '#b8723a', 6);
    circ(ctx, 0, 0, 36, linG(ctx, -36, -36, 36, 36, [[0, '#7c4624'], [1, '#462410']]));
    circ(ctx, 0, 0, 15, '#140804');
    for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8; circ(ctx, Math.cos(a) * 50, Math.sin(a) * 50, 2.6, '#e8ad70'); }
    ctx.restore();
    // light is fixed while the wheel turns: low sun behind-left
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
    ctx.fillStyle = radG(ctx, -R * 0.45, -R * 0.35, R * 0.1, R * 1.9, [[0, [255, 215, 160], 0.2], [0.45, [18, 6, 10], 0], [1, [18, 6, 10], 0.62]]);
    ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.restore();
    lit(ctx, () => {
      ctx.strokeStyle = rgba([255, 170, 90], 0.5); ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(0, 0, R - 2, Math.PI * 0.62, Math.PI * 1.34); ctx.stroke();
    });
  }

  SC_.push({
    id: 'wheel', n: '01', year: -3500, circa: true, title: 'The Wheel', who: 'Mesopotamia',
    line: 'First it spun clay. Then it carried the world.', color: '#e39a55',
    fig: 'FRONT ELEVATION · SIDE VIEW', origin: 'MESOPOTAMIA', date: 'c. 3500 BCE', scale: '1:5',
    tbTitle: 'THE WHEEL', draft: 3.0, alive: 3.3, rot: 0, ignite: [0, -10],
    build(S) {
      const { cy, R } = WH, sx = -430, h = Math.sqrt(R * R - 75 * 75);
      S.frame(this);
      S.line(-255, cy, 255, cy, { k: 'ctr' });
      S.line(0, cy - 255, 0, cy + 232, { k: 'ctr' });
      for (const y of [cy - R, cy - 55, cy + 55, cy + R]) S.line(-290, y, sx - 60, y, { k: 'con' });
      S.circle(0, cy, R, { a0: Math.PI });
      S.circle(0, cy, R - 13, { k: 'thin' });
      S.line(-75, cy - h, -75, cy + h);
      S.line(75, cy - h, 75, cy + h);
      for (const by of [cy - 100, cy + 100]) S.rect(-150, by - 12, 300, 24);
      for (const by of [cy - 100, cy + 100]) for (const bx of [-128, -40, 40, 128]) S.circle(bx, by, 4.5, { k: 'thin' });
      S.circle(0, cy, 55);
      S.circle(0, cy, 36, { k: 'thin' });
      S.circle(0, cy, 15);
      // side view
      S.rect(sx - 14, cy - R, 28, 2 * R);
      S.rect(sx - 34, cy - 55, 68, 110);
      S.hatch([rectPts(sx - 34, cy - 55, 68, 110), rectPts(sx - 15, cy - 15, 30, 30)], 9);
      S.line(sx - 110, cy, sx + 110, cy, { k: 'ctr' });
      S.line(sx - 100, cy - 15, sx - 34, cy - 15, { k: 'thin' });
      S.line(sx - 100, cy + 15, sx - 34, cy + 15, { k: 'thin' });
      S.line(sx - 34, cy - 15, sx + 34, cy - 15, { k: 'hid' });
      S.line(sx - 34, cy + 15, sx + 34, cy + 15, { k: 'hid' });
      S.text('SIDE VIEW', sx, cy - R - 26, { align: 'c', size: 13, a: 0.7 });
      // dimensions
      S.dim(-R, cy, R, cy, 290, 'Ø 900');
      S.dim(sx - 14, cy + R, sx + 14, cy + R, -34, '75');
      S.dim(sx + 34, cy - 55, sx + 34, cy + 55, 26, '260');
      // callouts
      S.balloon(112, cy - 100, 340, -205, 'A', 'BATTEN');
      S.balloon(40, cy - 32, 340, -145, 'B', 'HUB · COPPER BAND');
      S.balloon(150, cy + 40, 340, -85, 'C', 'PLANK ×3');
      S.balloon(128, cy + 100, 340, -25, 'D', 'OAK DOWEL');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const { cy, R, H } = WH;
      const ramp = 1 - Math.exp(-t / 0.9), ang = 1.45 * (t - 0.9 * ramp), dist = ang * R;
      ctx.fillStyle = linG(ctx, 0, -300, 0, H, [[0, '#191331'], [0.42, '#5a2745'], [0.78, '#c4573a'], [1, '#f3a55c']]);
      ctx.fillRect(-310, -310, 620, H + 311);
      lit(ctx, () => glow(ctx, -118, H - 16, 240, [255, 170, 90], 0.5));
      circ(ctx, -118, H - 16, 30, linG(ctx, 0, H - 46, 0, H + 14, [[0, '#fff1c9'], [1, '#ffb56b']]));
      ctx.fillStyle = linG(ctx, 0, H - 44, 0, H + 6, [[0, '#f3a55c', 0], [1, '#ffd29a', 0.5]]);
      ctx.fillRect(-310, H - 44, 620, 50);
      // ziggurat on the horizon
      const zx = wrap(150 - dist * 0.045, 1100) - 550;
      ctx.fillStyle = 'rgba(66,22,36,0.9)';
      let base = H + 2;
      for (const [w, hh] of [[250, 24], [182, 22], [120, 20], [66, 18], [30, 14]]) { ctx.fillRect(zx - w / 2, base - hh, w, hh); base -= hh; }
      ctx.fillStyle = 'rgba(130,52,50,0.55)';
      fillPts(ctx, [zx - 9, H + 2, zx + 9, H + 2, zx + 3, H - 84, zx - 3, H - 84]);
      for (let i = 0; i < 3; i++) palm(ctx, wrap(-160 + i * 260 - dist * 0.22, 780) - 390, H + 24, 88 + i * 18, i);
      ctx.fillStyle = linG(ctx, 0, H, 0, 300, [[0, '#8b3f23'], [0.3, '#5c2716'], [1, '#26100a']]);
      ctx.fillRect(-310, H, 620, 310 - H);
      for (let i = 0; i < 44; i++) {
        const d = Math.pow(hash(i, 4), 1.4), gy = H + 6 + d * 170, f = (gy - H) / (cy + R - H);
        const gx = wrap(hash(i, 3) * 800 - dist * f, 800) - 400;
        ctx.fillStyle = rgba([255, 196, 150], 0.07 + 0.1 * d);
        ctx.fillRect(gx, gy, 4 + 22 * d, 1 + 2 * d);
      }
      ctx.beginPath(); ctx.ellipse(40, cy + R + 3, 175, 13, 0, 0, TAU); ctx.fillStyle = 'rgba(18,6,4,0.55)'; ctx.fill();
      const bob = Math.abs(Math.sin(t * 7.3)) * 1.6 * ramp;
      ctx.save(); ctx.translate(0, cy - bob);
      plankWheel(ctx, R, ang, env.lod);
      ctx.restore();
      if (env.lod > 0.3) {
        emit(t, 34, 1.2, (age, u, i) => {
          const vx = -(70 + 150 * hash(i, 7)), vy = -(26 + 80 * hash(i, 8));
          const x = 18 + (hash(i, 9) - 0.5) * 30 + vx * age - 110 * age * ramp;
          const y = cy + R - 4 + vy * age + 55 * age * age;
          puff(ctx, x, y, 5 + 22 * u, [226, 160, 110], 0.3 * (1 - u) * ramp);
        });
      }
    },
  });

  /* ================= 02 · ARCHIMEDES' SCREW ================= */
  const SCR = (() => {
    const a = 58, L = 440, pitch = 110, al = -Math.PI / 6;
    const u = [Math.cos(al), Math.sin(al)], v = [-u[1], u[0]];
    const P0 = [-u[0] * L / 2, 34 - u[1] * L / 2];
    const at = (s, k) => [P0[0] + u[0] * s + v[0] * k, P0[1] + u[1] * s + v[1] * k];
    return { a, L, pitch, al, u, v, P0, P1: at(L, 0), at };
  })();
  function helix(ph, step = 4) {
    const front = [], back = [];
    let cur = null, curF = null;
    for (let s = 0; s <= SCR.L + 0.01; s += step) {
      const phi = (TAU * s) / SCR.pitch + ph, f = Math.sin(phi) >= 0, p = SCR.at(s, SCR.a * Math.cos(phi));
      if (cur === null || f !== curF) {
        if (cur) cur.push(p[0], p[1]);
        cur = [p[0], p[1]];
        (f ? front : back).push(cur);
        curF = f;
      } else cur.push(p[0], p[1]);
    }
    return [front.filter(q => q.length > 2), back.filter(q => q.length > 2)];
  }
  const tubeBand = (s0, s1, k0, k1) => { const A = SCR.at(s0, k0), B = SCR.at(s1, k0), C = SCR.at(s1, k1), D = SCR.at(s0, k1); return [A[0], A[1], B[0], B[1], C[0], C[1], D[0], D[1]]; };

  SC_.push({
    id: 'screw', n: '02', year: -250, circa: true, title: "Archimedes' Screw", who: 'Archimedes · Syracuse',
    line: 'Turn the handle, and water climbs uphill.', color: '#58b9da',
    fig: 'ELEVATION · SECTION A–A', origin: 'SYRACUSE', date: 'c. 250 BCE', scale: '1:40',
    tbTitle: "ARCHIMEDES' SCREW", draft: 2.9, alive: 3.1, rot: 1.6, ignite: [0, 34],
    build(S) {
      const { a, L, P0, P1, at, u, v } = SCR;
      S.frame(this);
      S.line(...at(-40, 0), ...at(L + 56, 0), { k: 'ctr' });
      S.line(P0[0], P0[1], P0[0] + 175, P0[1], { k: 'con' });
      S.poly([...at(0, -a), ...at(L, -a)]);
      S.poly([...at(0, a), ...at(L, a)]);
      S.poly(ellPts(P0[0], P0[1], 12, a, SCR.al, 0, TAU, 40));
      S.poly(ellPts(P1[0], P1[1], 12, a, SCR.al, 0, TAU, 40));
      const [fr, bk] = helix(0);
      S.multi(fr, { k: 'obj' });
      S.multi(bk, { k: 'hid' });
      S.poly([...at(-18, -12), ...at(L + 30, -12)], { k: 'thin' });
      S.poly([...at(-18, 12), ...at(L + 30, 12)], { k: 'thin' });
      for (const s of [70, 220, 370]) S.poly([...at(s, -a), ...at(s, a)], { k: 'thin' });
      const Pc = at(L + 30, 0), Ph = at(L + 30, -46);
      S.line(Pc[0], Pc[1], Ph[0], Ph[1]);
      S.circle(Ph[0], Ph[1], 8);
      S.poly(ellPts(Pc[0], Pc[1], 8, 46, SCR.al, 0, TAU, 40), { k: 'ph' });
      // water, terrace and support
      S.line(-300, 150, 30, 150, { k: 'thin' });
      S.poly([-250, 150, -258, 139, -242, 139, -250, 150], { k: 'thin' });
      S.line(-257, 156, -243, 156, { k: 'thin' }); S.line(-253, 161, -247, 161, { k: 'thin' });
      S.poly([40, 160, 215, -20, 300, -20], { k: 'thin' });
      const earth = [];
      for (let x = 222; x < 296; x += 12) earth.push([x, -20, x - 8, -10]);
      S.multi(earth, { k: 'hatch' });
      S.rect(48, 69, 14, 76, { k: 'thin' });
      S.rect(205, -32, 90, 12, { k: 'thin' });
      // section cut A–A
      const c1 = at(150, -a - 34), c2 = at(150, a + 34);
      S.line(c1[0], c1[1], c2[0], c2[1], { k: 'ctr', w: 1.6 });
      S.line(c1[0], c1[1], c1[0] - u[0] * 22, c1[1] - u[1] * 22, { k: 'dim', heads: [[c1[0] - u[0] * 22, c1[1] - u[1] * 22, Math.atan2(-u[1], -u[0]), 1]] });
      S.line(c2[0], c2[1], c2[0] - u[0] * 22, c2[1] - u[1] * 22, { k: 'dim', heads: [[c2[0] - u[0] * 22, c2[1] - u[1] * 22, Math.atan2(-u[1], -u[0]), 1]] });
      S.text('A', c1[0] + v[0] * -12, c1[1] - 12, { align: 'c', size: 15, weight: 700 });
      S.text('A', c2[0] + 12, c2[1] + 10, { align: 'c', size: 15, weight: 700 });
      // section view
      const qx = -462, qy = -172;
      S.circle(qx, qy, 58);
      S.circle(qx, qy, 49, { k: 'thin' });
      S.hatch([polyReg(qx, qy, 58, 48), polyReg(qx, qy, 49, 48)], 7);
      S.circle(qx, qy, 12);
      S.hatch([polyReg(qx, qy, 12, 24)], 5);
      const phs = (TAU * 150) / SCR.pitch;
      S.line(qx + Math.cos(phs) * 12, qy + Math.sin(phs) * 12, qx + Math.cos(phs) * 49, qy + Math.sin(phs) * 49);
      S.centre(qx, qy, 74);
      S.text('SECTION A–A', qx, qy + 90, { align: 'c', size: 13, a: 0.7 });
      // dimensions
      S.adim(P0[0], P0[1], 140, 0, SCR.al, '30°');
      S.dim(...at(90, -a), ...at(90 + SCR.pitch, -a), 36, 'P 475');
      S.dim(...at(0, -a), ...at(0, a), -48, 'Ø 500');
      S.notes(['NOTES', '1. ONE TURN LIFTS ONE PITCH', '2. BLADE WOUND ON A WOOD SHAFT', '3. TUBE OF STAVES, IRON HOOPS'], -590, -60);
      const blade = at(257.5, -31);
      S.balloon(blade[0], blade[1], 340, -205, 'A', 'HELICAL BLADE');
      S.balloon(Ph[0], Ph[1], 340, -145, 'B', 'CRANK');
      S.balloon(...at(380, 12), 340, -85, 'C', 'SHAFT');
      S.balloon(252, -26, 340, -25, 'D', 'FIELD CHANNEL');
      S.balloon(-205, 150, -340, 72, 'E', 'INTAKE', { left: true });
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const { a, L, pitch, at, u, v, P0 } = SCR;
      const ramp = 1 - Math.exp(-t / 0.8), ph = -2.6 * (t - 0.8 * ramp);
      ctx.fillStyle = linG(ctx, 0, -300, 0, 66, [[0, '#4a9bd2'], [0.7, '#a9d5ea'], [1, '#e6f3f3']]);
      ctx.fillRect(-310, -310, 620, 378);
      lit(ctx, () => glow(ctx, 200, -236, 230, [255, 244, 210], 0.5));
      // distant hills with a temple
      ctx.fillStyle = '#9db9b0';
      fillPts(ctx, new P(-310, 70).Q(-230, 26, -140, 46).Q(-60, 60, 0, 54).Q(90, 36, 170, 58).L(310, 58).L(310, 80).L(-310, 80).pts);
      ctx.fillStyle = '#b7cbc5';
      const tx = -214, ty = 40;
      ctx.fillRect(tx - 26, ty, 52, 3.5);
      for (let i = 0; i < 6; i++) ctx.fillRect(tx - 22 + i * 8.4, ty - 17, 2.6, 17);
      ctx.fillRect(tx - 25, ty - 21, 50, 4);
      fillPts(ctx, [tx - 26, ty - 21, tx + 26, ty - 21, tx, ty - 31]);
      ctx.fillStyle = linG(ctx, 0, 60, 0, 160, [[0, '#b9a870'], [1, '#8f8a55']]);
      ctx.fillRect(-310, 66, 620, 100);
      // river
      ctx.fillStyle = linG(ctx, 0, 146, 0, 300, [[0, '#4aa3c2'], [1, '#18506a']]);
      ctx.fillRect(-310, 146, 620, 170);
      ctx.strokeStyle = 'rgba(220,245,255,0.35)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 26; i++) {
        const x = wrap(hash(i, 21) * 620 + t * 14, 620) - 310, y = 158 + Math.pow(hash(i, 22), 1.3) * 130, w = 8 + 24 * hash(i, 23);
        seg(ctx, x, y, x + w, y);
      }
      ctx.stroke();
      emit(t, 1.3, 2.4, (age, uu) => {
        ctx.strokeStyle = rgba([225, 248, 255], 0.4 * (1 - uu));
        ctx.beginPath(); ctx.ellipse(P0[0] + 6, 152, 22 + 90 * uu, (22 + 90 * uu) * 0.2, 0, 0, TAU); ctx.stroke();
      });
      // bank and terrace
      ctx.fillStyle = linG(ctx, 0, -20, 0, 300, [[0, '#caa66b'], [1, '#7c5a32']]);
      fillPts(ctx, [40, 310, 40, 160, 215, -20, 310, -20, 310, 310]);
      ctx.strokeStyle = '#6f8f3a'; ctx.lineWidth = 3;
      ctx.beginPath(); seg(ctx, 215, -20, 310, -20); ctx.stroke();
      // crops, greener as the water arrives
      const grow = 0.5 + 0.5 * E.outCubic(prog(0.8, 4, t));
      for (let x = 226, i = 0; x < 300; x += 11, i++) {
        const hh = (12 + 12 * hash(i, 31)) * grow, sw = 0.08 * Math.sin(t * 1.7 + i);
        ctx.strokeStyle = rgba(mix('#8a8a3a', '#4f8f2e', grow), 1); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, -22); ctx.lineTo(x + Math.sin(sw) * hh, -22 - hh); ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        for (let j = 1; j <= 2; j++) { ctx.beginPath(); ctx.ellipse(x + Math.sin(sw) * hh * j * 0.4 + (j % 2 ? 4 : -4), -22 - hh * j * 0.42, 4.5, 1.8, j % 2 ? -0.5 : 0.5, 0, TAU); ctx.fill(); }
      }
      // channel on the terrace
      ctx.fillStyle = linG(ctx, 0, -32, 0, -20, [[0, '#7fd0ea'], [1, '#2f86a8']]);
      ctx.fillRect(205, -32, 110, 11);
      ctx.strokeStyle = 'rgba(240,252,255,0.8)'; ctx.lineWidth = 1.6; ctx.setLineDash([8, 14]); ctx.lineDashOffset = -t * 70 * ramp;
      ctx.beginPath(); seg(ctx, 205, -28, 315, -28); ctx.stroke(); ctx.setLineDash([]);
      // support post
      ctx.fillStyle = '#6b4424'; ctx.fillRect(48, 69, 14, 80);
      ctx.fillStyle = 'rgba(255,220,170,0.2)'; ctx.fillRect(48, 69, 3, 80);
      // tube interior (cutaway)
      ctx.fillStyle = linG(ctx, ...at(0, -a), ...at(0, a), [[0, '#2f1a0b'], [0.5, '#6d4526'], [1, '#2c180a']]);
      fillPts(ctx, tubeBand(0, L, -a, a));
      if (env.lod > 0.4) {
        ctx.strokeStyle = 'rgba(30,14,4,0.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); for (const k of [-36, -12, 12, 36]) { const p0 = at(0, k), p1 = at(L, k); seg(ctx, p0[0], p0[1], p1[0], p1[1]); } ctx.stroke();
      }
      // water pockets: level surfaces inside each turn of the blade
      for (let k = -1; k < 8; k++) {
        const sk = ((TAU * k - ph) * pitch) / TAU, s0 = Math.max(2, sk), s1 = Math.min(L - 3, sk + pitch * 0.52);
        if (s1 - s0 < 6) continue;
        const B0 = at(s0, a * 0.95), B1 = at(s1, a * 0.95), d = 0.577 * (s1 - s0), W = [B0[0] - v[0] * d, B0[1] - v[1] * d];
        const wob = Math.sin(t * 5 + k) * 1.2;
        ctx.fillStyle = linG(ctx, 0, B1[1], 0, B0[1], [[0, '#8fdcf2', 0.92], [1, '#1f6f93', 0.95]]);
        fillPts(ctx, [B0[0], B0[1], B1[0], B1[1] + wob, W[0], W[1] + wob]);
        ctx.strokeStyle = 'rgba(235,252,255,0.8)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); seg(ctx, B1[0], B1[1] + wob, W[0], W[1] + wob); ctx.stroke();
      }
      const [fr, bk] = helix(ph, 5);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#4b2d15'; ctx.lineWidth = 4;
      for (const q of bk) strokePts(ctx, q);
      ctx.fillStyle = linG(ctx, ...at(0, -12), ...at(0, 12), [[0, '#8a5a2f'], [0.5, '#c28a52'], [1, '#6b4122']]);
      fillPts(ctx, tubeBand(-18, L + 30, -12, 12));
      ctx.strokeStyle = '#d9a466'; ctx.lineWidth = 6;
      for (const q of fr) strokePts(ctx, q);
      ctx.strokeStyle = 'rgba(255,238,200,0.55)'; ctx.lineWidth = 1.6;
      for (const q of fr) strokePts(ctx, q);
      // rims, hoops, end caps
      ctx.strokeStyle = '#8b5a30'; ctx.lineWidth = 6;
      strokePts(ctx, [...at(0, -a), ...at(L, -a)]);
      strokePts(ctx, [...at(0, a), ...at(L, a)]);
      ctx.strokeStyle = 'rgba(255,225,180,0.45)'; ctx.lineWidth = 1.5;
      strokePts(ctx, [...at(0, -a - 2), ...at(L, -a - 2)]);
      for (const s of [70, 220, 370]) {
        const A1 = at(s, -a), A2 = at(s, a), Cc = at(s + 9, 0);
        ctx.strokeStyle = '#34302c'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(A1[0], A1[1]); ctx.quadraticCurveTo(Cc[0], Cc[1], A2[0], A2[1]); ctx.stroke();
      }
      ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 5;
      strokePts(ctx, ellPts(P0[0], P0[1], 12, a, SCR.al, 0, TAU, 40));
      strokePts(ctx, ellPts(SCR.P1[0], SCR.P1[1], 12, a, SCR.al, 0, TAU, 40));
      // crank turns with the shaft
      const Pc = at(L + 30, 0), ca = -ph, Pt = at(L + 30, -46 * Math.cos(ca)), Pg = at(L + 48, -46 * Math.cos(ca));
      ctx.strokeStyle = '#3b3632'; ctx.lineWidth = 7;
      ctx.beginPath(); seg(ctx, Pc[0], Pc[1], Pt[0], Pt[1]); seg(ctx, Pt[0], Pt[1], Pg[0], Pg[1]); ctx.stroke();
      circ(ctx, Pg[0], Pg[1], 7 + 1.5 * Math.sin(ca), '#8a5a30');
      // spill at the top into the channel
      const Po = at(L - 6, a * 0.6);
      ctx.strokeStyle = rgba([150, 222, 245], 0.75 * ramp); ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(Po[0], Po[1]); ctx.quadraticCurveTo(Po[0] + 22, Po[1] - 4, 214, -28); ctx.stroke();
      emit(t, 30, 0.6, (age, uu, i) => {
        const x = Po[0] + (35 + 50 * hash(i, 41)) * age, y = Po[1] + (-24 + 18 * hash(i, 42)) * age + 260 * age * age;
        if (y < -22) circ(ctx, x, y, 1.6 + 1.6 * hash(i, 43), rgba([220, 246, 255], 0.9 * (1 - uu) * ramp));
      });
    },
  });

  /* ================= 03 · THE COMPASS ================= */
  const TRI = [[1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1], [1, 1, 0], [0, 1, 0], [1, 0, 0], [0, 0, 0]];
  const needlePts = th => {
    const q = [[0, -64], [6.5, 0], [0, 64], [-6.5, 0], [0, -64]], out = [];
    for (const [x, y] of q) { const r = rot2(x, y, th); out.push(r[0], r[1]); }
    return out;
  };
  function trigramBars(k, r0 = 149) {
    const a = -Math.PI / 2 + (k * TAU) / 8, out = [];
    const tx = -Math.sin(a), ty = Math.cos(a);
    TRI[k].forEach((solid, b) => {
      const rr = r0 + b * 7.5, cx = Math.cos(a) * rr, cy = Math.sin(a) * rr;
      if (solid) out.push([cx - tx * 12, cy - ty * 12, cx + tx * 12, cy + ty * 12]);
      else out.push([cx - tx * 12, cy - ty * 12, cx - tx * 3, cy - ty * 3], [cx + tx * 3, cy + ty * 3, cx + tx * 12, cy + ty * 12]);
    });
    return out;
  }
  const TH0 = 0.62;
  const needleAngle = t => TH0 * Math.exp(-0.85 * t) * Math.cos(4.8 * t) + 0.006 * Math.sin(17 * t);
  const plateAngle = t => 0.26 * Math.sin(0.55 * Math.max(0, t - 2.6)) * smooth(prog(2.6, 4.2, t));

  SC_.push({
    id: 'compass', n: '03', year: 1088, title: 'The Compass', who: 'Song dynasty China',
    line: 'In China it was called the south-pointing needle.', color: '#d9483a',
    fig: 'PLAN VIEW · SECTION A–A', origin: 'SONG CHINA', date: '1088', scale: '1:2',
    tbTitle: 'MAGNETIC COMPASS', draft: 2.7, alive: 3.0, rot: 1.6, ignite: [0, 0],
    build(S) {
      S.frame(this);
      S.rect(-198, -198, 396, 396);
      S.rect(-186, -186, 372, 372, { k: 'thin' });
      S.line(0, -198, 0, 198, { k: 'ctr' });
      S.line(-198, 0, 198, 0, { k: 'ctr' });
      S.circle(0, 0, 190);
      for (const r of [170, 142, 112]) S.circle(0, 0, r, { k: 'thin' });
      S.circle(0, 0, 84);
      S.circle(0, 0, 70, { k: 'thin' });
      const div = [], fine = [];
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU - Math.PI / 2 + TAU / 48; div.push([Math.cos(a) * 170, Math.sin(a) * 170, Math.cos(a) * 190, Math.sin(a) * 190]); }
      for (let i = 0; i < 72; i++) { const a = (i / 72) * TAU; fine.push([Math.cos(a) * 112, Math.sin(a) * 112, Math.cos(a) * (i % 3 ? 119 : 126), Math.sin(a) * (i % 3 ? 119 : 126)]); }
      S.multi(div, { k: 'thin' });
      S.multi(fine, { k: 'thin', a: 0.6 });
      for (let k = 0; k < 8; k++) S.multi(trigramBars(k), { k: 'obj', w: 2.6 });
      S.poly(needlePts(TH0), { close: true });
      S.circle(0, 0, 5);
      S.arc(0, 0, 64, Math.PI / 2 - TH0, Math.PI / 2 + TH0, { k: 'ph' });
      S.adim(0, 0, 100, Math.PI / 2, Math.PI / 2 + TH0, '35°', { out: 18 });
      // section of the floating needle
      const bx = -462, by = -196;
      S.poly(new P(bx - 72, by).C(bx - 72, by + 64, bx + 72, by + 64, bx + 72, by).pts);
      S.line(bx - 64, by + 14, bx + 64, by + 14, { k: 'thin' });
      S.poly([bx + 40, by + 14, bx + 34, by + 5, bx + 46, by + 5, bx + 40, by + 14], { k: 'thin' });
      S.line(bx - 34, by + 11, bx + 26, by + 11, { w: 2.6 });
      S.poly(ellPts(bx - 4, by + 11, 11, 3.5, 0, 0, TAU, 24), { k: 'thin' });
      S.text('SECTION A–A · FLOATING NEEDLE', bx, by + 70, { align: 'c', size: 13, a: 0.7 });
      S.notes(['NOTES', '1. RUB NEEDLE ON LODESTONE', '2. FLOAT IT ON STILL WATER', '3. IT SETTLES NORTH–SOUTH'], -590, -60);
      S.dim(-198, 198, 198, 198, -40, 'W 300');
      S.balloon(...rot2(0, -52, TH0), 340, -205, 'A', 'MAGNETISED NEEDLE');
      S.balloon(40, -44, 340, -145, 'B', 'WATER POOL');
      S.balloon(Math.cos(-Math.PI / 4) * 157, Math.sin(-Math.PI / 4) * 157, 340, -85, 'C', 'EIGHT TRIGRAMS');
      S.balloon(186, -40, 340, -25, 'D', '24 DIRECTIONS');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const lod = env.lod, psi = plateAngle(t), th = needleAngle(t);
      ctx.fillStyle = radG(ctx, -60, -80, 20, 420, [[0, '#4a1510'], [1, '#150403']]);
      ctx.fillRect(-310, -310, 620, 620);
      ctx.save();
      ctx.rotate(psi);
      // lacquered earth plate
      ctx.fillStyle = linG(ctx, -198, -198, 198, 198, [[0, '#8a2a1c'], [0.5, '#6a1a12'], [1, '#4c100b']]);
      ctx.fillRect(-198, -198, 396, 396);
      ctx.strokeStyle = '#d4a24c'; ctx.lineWidth = 2.5; ctx.strokeRect(-186, -186, 372, 372);
      ctx.lineWidth = 1; ctx.strokeRect(-192, -192, 384, 384);
      // heaven dial rings
      circ(ctx, 0, 0, 190, '#1b1210');
      circ(ctx, 0, 0, 170, linG(ctx, -170, -170, 170, 170, [[0, '#e6bd5e'], [0.5, '#c69a3e'], [1, '#9c7426']]));
      circ(ctx, 0, 0, 142, '#8e2a1c');
      circ(ctx, 0, 0, 112, '#1b1210');
      circ(ctx, 0, 0, 84, linG(ctx, -84, -84, 84, 84, [[0, '#e0b85a'], [1, '#a47a2c']]));
      ctx.strokeStyle = '#d9ac52'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU - Math.PI / 2 + TAU / 48; seg(ctx, Math.cos(a) * 170, Math.sin(a) * 170, Math.cos(a) * 190, Math.sin(a) * 190); }
      for (let i = 0; i < 72; i++) { const a = (i / 72) * TAU, l = i % 3 ? 119 : 128; seg(ctx, Math.cos(a) * 112, Math.sin(a) * 112, Math.cos(a) * l, Math.sin(a) * l); }
      ctx.stroke();
      if (lod > 0.4) {
        ctx.strokeStyle = '#e2b659'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * TAU - Math.PI / 2, cx = Math.cos(a) * 180, cy = Math.sin(a) * 180;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(a + Math.PI / 2);
          ctx.beginPath();
          for (let j = 0; j < 4; j++) {
            const h1 = hash(i * 7 + j, 51), h2 = hash(i * 7 + j, 52), h3 = hash(i * 7 + j, 53);
            if (h1 < 0.5) seg(ctx, -5 + h2 * 4, -5 + j * 3.2, 1 + h3 * 4, -5 + j * 3.2);
            else seg(ctx, -4 + h2 * 8, -6 + h3 * 3, -4 + h2 * 8, 1 + h3 * 5);
          }
          ctx.stroke(); ctx.restore();
        }
        ctx.fillStyle = '#e0b85a';
        for (let k = 0; k < 8; k++) {
          const n = 1 + ((k * 5) % 9), a0 = -Math.PI / 2 + (k * TAU) / 8;
          for (let j = 0; j < n; j++) circ(ctx, Math.cos(a0 + (j - (n - 1) / 2) * 0.05) * 98, Math.sin(a0 + (j - (n - 1) / 2) * 0.05) * 98, 2.2, '#e0b85a');
        }
      }
      ctx.strokeStyle = '#1a0f0a'; ctx.lineWidth = 3.4; ctx.lineCap = 'butt';
      ctx.beginPath();
      for (let k = 0; k < 8; k++) for (const b of trigramBars(k)) seg(ctx, b[0], b[1], b[2], b[3]);
      ctx.stroke();
      for (const r of [190, 170, 142, 112, 84]) circ(ctx, 0, 0, r, null, 'rgba(20,10,6,0.7)', 1.4);
      // heaven pool
      circ(ctx, 0, 0, 70, radG(ctx, -20, -24, 4, 80, [[0, '#2c5f5a'], [1, '#0c2222']]));
      emit(t, 3, 1.6, (age, uu, i) => {
        const tt = i / 3, sp = Math.abs(TH0 * Math.exp(-0.85 * tt) * 4.8);
        const r = 8 + 62 * uu;
        circ(ctx, 0, 0, r, null, rgba([190, 240, 230], clamp(sp * 0.18) * (1 - uu)), 1.2);
      });
      lit(ctx, () => {
        ctx.strokeStyle = rgba([255, 255, 255], 0.12); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 60, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
        const g = t * 0.35;
        ctx.strokeStyle = rgba([255, 240, 200], 0.14); ctx.lineWidth = 26;
        ctx.beginPath(); ctx.arc(0, 0, 156, g, g + 0.5); ctx.stroke();
      });
      ctx.restore();
      // needle floats free of the turning plate and keeps pointing south
      ctx.save();
      ctx.rotate(th);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      fillPts(ctx, [3, -61, 9.5, 3, 3, 67, -3.5, 3]);
      ctx.fillStyle = linG(ctx, -6, 0, 6, 0, [[0, '#7f93a6'], [1, '#d5e0ea']]);
      fillPts(ctx, [0, -64, 6.5, 0, -6.5, 0]);
      ctx.fillStyle = linG(ctx, -6, 0, 6, 0, [[0, '#8e1f16'], [1, '#e0503e']]);
      fillPts(ctx, [0, 64, 6.5, 0, -6.5, 0]);
      circ(ctx, 0, 0, 5, '#d4a24c'); circ(ctx, -1, -1, 1.8, '#fff2c8');
      ctx.restore();
      ctx.save();
      ctx.rotate(psi);
      ctx.strokeStyle = 'rgba(200,30,24,0.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); seg(ctx, 0, -198, 0, 198); seg(ctx, -198, 0, 198, 0); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = radG(ctx, -90, -120, 30, 380, [[0, [255, 214, 160], 0.14], [1, [0, 0, 0], 0]]);
      ctx.fillRect(-310, -310, 620, 620);
    },
  });

  /* ================= 04 · THE PRINTING PRESS ================= */
  const PR_P = 2.6;
  const pressPose = t => {
    const c = t < 0.3 ? -1 : (t - 0.3) % PR_P;
    if (c < 0) return { dy: 0, psi: 0, c };
    let dy = 0, psi = 0;
    if (c < 0.55) { const k = E.inOutCubic(c / 0.55); dy = 50 * k; psi = 1.25 * k; }
    else if (c < 0.78) { dy = 50 + 2 * bump((c - 0.55) / 0.23); psi = 1.25; }
    else if (c < 1.25) { const k = E.inOutCubic((c - 0.78) / 0.47); dy = 50 * (1 - k); psi = 1.25 * (1 - k); }
    return { dy, psi, c };
  };
  const pageAt = c => {
    if (c < 1.22 || c > 2.55) return null;
    const k = E.outCubic(prog(1.22, 1.75, c));
    return {
      x: lerp(0, 152, k), y: lerp(16, -128, k) - Math.sin(k * Math.PI) * 26, sc: lerp(0.15, 1, k),
      rot: lerp(0, -0.12, k) + Math.sin(c * 3) * 0.02, a: 1 - prog(2.05, 2.55, c),
    };
  };
  const GLYPHS = 'ABCDEFGHIKLMNOPQRSTVXYZabdefghilmnopqrstu&';
  function drawPage(ctx, pg) {
    ctx.save();
    ctx.translate(pg.x, pg.y); ctx.rotate(pg.rot); ctx.scale(pg.sc, pg.sc);
    ctx.globalAlpha = pg.a;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-42, -58, 90, 124);
    ctx.fillStyle = linG(ctx, -45, -62, 45, 62, [[0, '#fbf1d6'], [1, '#e6d4ab']]);
    ctx.fillRect(-45, -62, 90, 124);
    ctx.fillStyle = 'rgba(40,26,18,0.8)';
    for (let col = 0; col < 2; col++) for (let i = 0; i < 21; i++) {
      const x = -37 + col * 40, y = -52 + i * 5.1, w = 32 - (i === 20 ? 14 : hash(i + col * 30, 61) * 3);
      if (col === 0 && i < 3) ctx.fillRect(x + 9, y, w - 9, 1.9); else ctx.fillRect(x, y, w, 1.9);
    }
    ctx.fillStyle = '#b3261e'; ctx.fillRect(-37, -53, 7, 12);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  SC_.push({
    id: 'press', n: '04', year: 1440, title: 'The Printing Press', who: 'Johannes Gutenberg · Mainz',
    line: 'One press printed 3,600 pages a day. A scribe copied a few.', color: '#eedcae',
    fig: 'FRONT ELEVATION · DETAIL B', origin: 'MAINZ', date: '1440', scale: '1:20',
    tbTitle: 'PRINTING PRESS', draft: 2.8, alive: 3.2, rot: 1.5, ignite: [0, 20],
    build(S) {
      S.frame(this);
      S.line(0, -262, 0, 250, { k: 'ctr' });
      S.rect(-150, -206, 32, 412);
      S.rect(118, -206, 32, 412);
      S.rect(-172, -246, 344, 40);
      S.hatch([rectPts(-172, -246, 344, 40)], 12, Math.PI / 4);
      S.rect(-118, -178, 236, 28);
      S.rect(-13, -206, 26, 96);
      const th = [];
      for (let y = -146; y < -114; y += 9) th.push([-13, y, 13, y + 6]);
      S.multi(th, { k: 'thin' });
      S.rect(-26, -110, 52, 50);
      S.line(13, -96, 220, -96); S.line(13, -88, 220, -88);
      S.circle(228, -92, 9);
      S.arc(0, -92, 228, -0.08, 0.3, { k: 'ph' });
      S.rect(-96, -52, 192, 18);
      S.multi([[-26, -60, -90, -52], [26, -60, 90, -52]], { k: 'thin' });
      S.rect(-124, 26, 248, 26);
      const sorts = [];
      for (let i = 0; i < 20; i++) sorts.push(rectPts(-110 + i * 11, 18, 9, 8));
      S.multi(sorts, { k: 'thin' });
      S.rect(-150, 52, 300, 32);
      S.hatch([rectPts(-150, 52, 300, 32)], 12, -Math.PI / 4);
      S.rect(-192, 206, 384, 30);
      S.multi([[-150, 160, -185, 206], [150, 160, 185, 206]]);
      // detail B: a type sort, face mirrored
      const dx = -490, dy = -236;
      S.poly([dx, dy + 18, dx + 20, dy, dx + 70, dy, dx + 50, dy + 18, dx, dy + 18]);
      S.rect(dx, dy + 18, 50, 96);
      S.poly([dx + 50, dy + 18, dx + 70, dy, dx + 70, dy + 96, dx + 50, dy + 114]);
      S.line(dx + 50, dy + 70, dx + 70, dy + 52, { k: 'thin' });
      S.text('R', dx + 25, dy + 52, { size: 46, font: FS, weight: 700, align: 'c', mirror: true, ls: 0, ph: 3 });
      S.text('DETAIL B · TYPE SORT', dx + 35, dy + 136, { align: 'c', size: 13, a: 0.7 });
      S.dim(dx + 70, dy, dx + 70, dy + 96, 18, '23.5', { size: 13 });
      S.notes(['NOTES', '1. METAL TYPE CAST BY HAND', '2. LEAD · TIN · ANTIMONY ALLOY', '3. 42 LINES PER PAGE'], -590, -60);
      S.dim(-172, -246, -172, 236, -42, 'H 2000');
      S.dim(-172, -246, 172, -246, 40, 'W 1430');
      S.balloon(0, -130, 340, -205, 'A', 'SCREW');
      S.balloon(196, -92, 340, -145, 'B', 'BAR');
      S.balloon(84, -43, 340, -85, 'C', 'PLATEN');
      S.balloon(62, 22, 340, -25, 'D', 'MOVABLE TYPE');
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const { dy, psi, c } = pressPose(t);
      ctx.fillStyle = linG(ctx, 0, -300, 0, 300, [[0, '#2e1d12'], [1, '#120a05']]);
      ctx.fillRect(-310, -310, 620, 620);
      // window and light shafts
      ctx.fillStyle = 'rgba(255,214,150,0.16)'; ctx.fillRect(-262, -236, 84, 108);
      ctx.strokeStyle = 'rgba(40,24,12,0.9)'; ctx.lineWidth = 4;
      ctx.strokeRect(-262, -236, 84, 108);
      ctx.beginPath(); seg(ctx, -220, -236, -220, -128); seg(ctx, -262, -182, -178, -182); ctx.stroke();
      lit(ctx, () => {
        ctx.fillStyle = linG(ctx, -220, -180, 60, 200, [[0, [255, 214, 150], 0.16], [1, [255, 214, 150], 0]]);
        fillPts(ctx, [-262, -236, -178, -236, 160, 240, -40, 240]);
      });
      ctx.fillStyle = linG(ctx, 0, 236, 0, 300, [[0, '#3b2414'], [1, '#1d1008']]);
      ctx.fillRect(-310, 236, 620, 80);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let x = -300; x < 300; x += 46) seg(ctx, x, 236, x - 30, 300); ctx.stroke();
      const wood = (x, y, w, h, dark) => {
        ctx.fillStyle = linG(ctx, x, 0, x + w, 0, dark ? [[0, '#3e2412'], [0.5, '#5c3719'], [1, '#34200f']] : [[0, '#6a4222'], [0.45, '#91603a'], [1, '#553418']]);
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255,220,170,0.13)'; ctx.fillRect(x, y, w, 2);
      };
      // ink balls hung on the cheek
      for (const [bx, by] of [[-176, 4], [-186, 44]]) {
        ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 4; ctx.beginPath(); seg(ctx, bx, by, bx - 26, by - 44); ctx.stroke();
        circ(ctx, bx, by + 8, 15, radG(ctx, bx - 5, by + 2, 2, 18, [[0, '#7a5638'], [1, '#2a1a0e']]));
      }
      wood(-192, 206, 384, 30, true);
      ctx.strokeStyle = '#4e2f16'; ctx.lineWidth = 10;
      ctx.beginPath(); seg(ctx, -150, 160, -185, 206); seg(ctx, 150, 160, 185, 206); ctx.stroke();
      wood(-150, -206, 32, 412); wood(118, -206, 32, 412);
      wood(-150, 52, 300, 32, true);
      // bed, forme and the sheet on it
      wood(-124, 26, 248, 26, true);
      ctx.fillStyle = '#2b2b30'; ctx.fillRect(-112, 18, 224, 8);
      ctx.fillStyle = 'rgba(200,200,210,0.35)';
      for (let i = 0; i < 20; i++) ctx.fillRect(-110 + i * 11, 18, 9, 2);
      if (c > 0 && c < 1.3) { ctx.fillStyle = '#efe2c0'; ctx.fillRect(-94, 14, 188, 4); }
      // screw, hose, platen
      ctx.fillStyle = linG(ctx, -13, 0, 13, 0, [[0, '#6f5a3a'], [0.5, '#caa76a'], [1, '#5b4a30']]);
      ctx.fillRect(-13, -206, 26, 100 + dy);
      ctx.strokeStyle = 'rgba(40,28,14,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let y = -150; y < -110 + dy; y += 9) { const yy = y + ((dy * 1.7) % 9); seg(ctx, -13, yy, 13, yy + 6); }
      ctx.stroke();
      wood(-118, -178, 236, 28, true);
      wood(-172, -246, 344, 40);
      wood(-26, -110 + dy, 52, 50, true);
      ctx.strokeStyle = 'rgba(210,190,150,0.6)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); seg(ctx, -24, -60 + dy, -90, -52 + dy); seg(ctx, 24, -60 + dy, 90, -52 + dy); ctx.stroke();
      ctx.fillStyle = linG(ctx, 0, -52 + dy, 0, -34 + dy, [[0, '#b58a4c'], [1, '#6e4f26']]);
      ctx.fillRect(-96, -52 + dy, 192, 18);
      if (c > 0.5 && c < 0.8) lit(ctx, () => glow(ctx, 0, 16, 150, [255, 220, 160], 0.3 * bump((c - 0.5) / 0.3)));
      // the bar swings toward the viewer while pulling
      const cs = Math.cos(psi), near = Math.sin(psi), bx2 = 13 + 207 * cs;
      ctx.strokeStyle = '#3c3a38'; ctx.lineWidth = 8 + near * 3;
      ctx.beginPath(); seg(ctx, 13, -92 + dy, bx2, -92 + dy + near * 16); ctx.stroke();
      circ(ctx, bx2 + 8 * cs, -92 + dy + near * 16, 9 * (1 + near * 0.3), '#6b4526');
      // the stack of printed sheets grows
      const done = Math.min(14, Math.max(0, Math.floor((t - 0.3 - 1.6) / PR_P) + 1));
      for (let i = 0; i < done; i++) {
        ctx.fillStyle = i % 2 ? '#e9dab4' : '#f4e8c8';
        ctx.fillRect(196 + hash(i, 71) * 4, 230 - i * 3, 64, 3);
      }
      const pg = pageAt(c);
      if (pg) drawPage(ctx, pg);
      ctx.fillStyle = radG(ctx, -200, -200, 40, 520, [[0, [255, 200, 140], 0.1], [0.6, [0, 0, 0], 0], [1, [0, 0, 0], 0.4]]);
      ctx.fillRect(-310, -310, 620, 620);
    },
    over(ctx, t, env) {
      if (env.lod < 0.4 || t < 0) return;
      ctx.font = `600 20px ${FS}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const m1 = Math.floor((t - 0.3 - 1.78) / PR_P);
      for (let m = Math.max(0, m1 - 1); m <= m1; m++) {
        const age = t - (0.3 + m * PR_P + 1.78);
        if (age < 0 || age > 1.9) continue;
        for (let i = 0; i < 30; i++) {
          const h1 = hash(i + m * 40, 81), h2 = hash(i + m * 40, 82), h3 = hash(i + m * 40, 83);
          const x0 = 152 + (h1 - 0.5) * 80, y0 = -128 + (h2 - 0.5) * 110;
          const ang = -Math.PI * (0.05 + 0.9 * h3), sp = 70 + 190 * hash(i + m * 40, 84), k = 1.3;
          const f = (1 - Math.exp(-k * age)) / k;
          const x = x0 + Math.cos(ang) * sp * f + 30 * age, y = y0 + Math.sin(ang) * sp * f - 20 * age;
          const u = age / 1.9;
          ctx.save(); ctx.translate(x, y); ctx.rotate((h1 - 0.5) * 6 * age);
          const sz = 0.7 + 0.8 * h2;
          ctx.scale(sz, sz);
          ctx.fillStyle = rgba(mix('#fff4d6', '#e9b95c', u), (1 - u) * clamp(age * 6));
          ctx.fillText(GLYPHS[(i * 7 + m * 3) % GLYPHS.length], 0, 0);
          ctx.restore();
        }
      }
    },
  });

  /* ================= 05 · THE TELESCOPE ================= */
  const TS = (() => {
    const al = (-38 * Math.PI) / 180, u = [Math.cos(al), Math.sin(al)], v = [-u[1], u[0]];
    const E0 = [-200, 140], L = 360;
    const at = (s, k) => [E0[0] + u[0] * s + v[0] * k, E0[1] + u[1] * s + v[1] * k];
    const O = at(L, 0), M = at(L + 125, 0);
    return { al, u, v, E0, L, at, O, M };
  })();
  const tubePoly = (s0, s1, r0, r1) => [...TS.at(s0, -r0), ...TS.at(s1, -r1), ...TS.at(s1, r1), ...TS.at(s0, r0)];

  SC_.push({
    id: 'telescope', n: '05', year: 1608, title: 'The Telescope', who: 'Hans Lipperhey · Middelburg',
    line: 'A year later, Galileo turned one on the Moon.', color: '#a9bdff',
    fig: 'ELEVATION · OPTICAL PATH', origin: 'MIDDELBURG', date: '1608', scale: '1:8',
    tbTitle: 'REFRACTING TELESCOPE', draft: 2.7, alive: 3.0, rot: 1.5, ignite: [TS.O[0], TS.O[1]],
    build(S) {
      const { at, u, v, E0, L, O, M } = TS;
      S.frame(this);
      S.line(...at(-50, 0), ...at(L + 150, 0), { k: 'ctr' });
      S.line(E0[0], E0[1], E0[0] + 165, E0[1], { k: 'con' });
      S.poly(tubePoly(90, L, 22, 27), { close: true });
      S.poly(tubePoly(0, 100, 16, 16), { close: true });
      for (const s of [96, 352]) S.poly([...at(s, -30), ...at(s, 30)], { k: 'thin' });
      S.poly(new P(...at(L, -30)).Q(...at(L + 13, 0), ...at(L, 30)).Q(...at(L - 13, 0), ...at(L, -30)).pts);
      S.poly(new P(...at(-2, -17)).L(...at(-2, 17)).L(...at(6, 17)).Q(...at(1, 0), ...at(6, -17)).L(...at(-2, -17)).pts, { k: 'thin' });
      // optical path: parallel light, converging, made parallel again
      const F = at(-36, 0);
      for (const k of [-18, 0, 18]) {
        S.line(...at(L + 110, k), ...at(L, k), { k: 'dim', heads: [[...at(L + 40, k), Math.atan2(-u[1], -u[0]), 1]] });
        S.line(...at(L, k), ...at(0, k * 0.09), { k: 'hid' });
        S.line(...at(0, k * 0.09), ...at(-70, k * 0.09), { k: 'dim' });
      }
      S.multi([[F[0] - 6, F[1] - 6, F[0] + 6, F[1] + 6], [F[0] - 6, F[1] + 6, F[0] + 6, F[1] - 6]], { k: 'thin' });
      S.text('F', F[0] - 14, F[1] - 12, { size: 15, weight: 700 });
      // stand
      S.poly([...at(186, 26), ...at(214, 26)], { k: 'thin' });
      S.line(-28, 40, -28, 186);
      S.multi([[-28, 180, -110, 245], [-28, 180, 54, 245]]);
      S.line(-28, 180, -28, 250, { k: 'hid' });
      S.circle(-28, 32, 7, { k: 'thin' });
      // inset: Galileo's Moon
      const mx = -462, my = -178;
      S.circle(mx, my, 60);
      S.poly(ellPts(mx - 6, my, 20, 60, 0, -Math.PI / 2, Math.PI / 2, 30), { k: 'thin' });
      S.hatch([new P(mx - 6, my - 60).A(mx, my, 60, -Math.PI / 2 - 0.1, -Math.PI * 1.5 + 0.1).L(mx - 6, my + 60).pts.concat(ellPts(mx - 6, my, 20, 60, 0, Math.PI / 2, -Math.PI / 2, 30))], 8);
      for (const [cx, cy, r] of [[mx + 20, my - 22, 7], [mx + 32, my + 12, 5], [mx + 6, my + 30, 6], [mx + 14, my - 44, 4]]) S.circle(cx, cy, r, { k: 'thin' });
      S.text('OBSERVED · THE MOON, 1609', mx, my + 80, { align: 'c', size: 13, a: 0.7 });
      S.notes(['NOTES', '1. CONVEX OBJECTIVE LENS', '2. CONCAVE EYEPIECE', '3. FIRST MODELS: ×3 · GALILEO: ×20'], -590, -60);
      S.adim(E0[0], E0[1], 112, 0, TS.al, '38°');
      S.dim(...at(0, 16), ...at(L, 27), -46, 'L 980');
      S.balloon(...at(L, 27), 340, -145, 'A', 'OBJECTIVE LENS');
      S.balloon(...at(250, 24), 340, -85, 'B', 'TUBE · LEATHER ON PASTEBOARD');
      S.balloon(-28, 128, 340, -25, 'C', 'STAND');
      S.balloon(E0[0], E0[1], -340, 76, 'D', 'EYEPIECE', { left: true });
      S.tblock(this);
    },
    scene(ctx, t, env) {
      const { at, u, v, E0, L, O } = TS, lod = env.lod;
      const rise = 30 * (1 - E.outCubic(clamp(t / 2.6))), M = [TS.M[0], TS.M[1] + rise], mr = 38;
      ctx.fillStyle = linG(ctx, 0, -300, 0, 240, [[0, '#040819'], [0.55, '#0f1a44'], [1, '#27366b']]);
      ctx.fillRect(-310, -310, 620, 620);
      lit(ctx, () => {
        for (let i = 0; i < 7; i++) {
          const k = i / 6;
          glow(ctx, lerp(-270, 220, k), lerp(-20, -270, k), 120, [150, 160, 230], 0.07);
        }
        for (let i = 0; i < (lod > 0.4 ? 110 : 50); i++) {
          const x = (hash(i, 91) * 2 - 1) * 290, y = -290 + hash(i, 92) * 440, r = 0.6 + 1.7 * Math.pow(hash(i, 93), 3);
          const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + 3 * hash(i, 94)) + 10 * hash(i, 95));
          circ(ctx, x, y, r, rgba([230, 236, 255], 0.9 * tw));
          if (r > 1.9) glow(ctx, x, y, r * 7, [200, 210, 255], 0.25 * tw);
        }
        glow(ctx, M[0], M[1], 130, [220, 225, 255], 0.35);
      });
      // Jupiter and its four moons, found in January 1610
      const ja = clamp((t - 1.1) / 1.2);
      if (ja > 0) {
        const jx = -150, jy = -212;
        lit(ctx, () => glow(ctx, jx, jy, 16, [255, 236, 200], 0.6 * ja));
        circ(ctx, jx, jy, 3.2, rgba([255, 240, 214], ja));
        [[9, 0.9, 0.3], [15, 0.6, 1.9], [24, 0.35, 4.0], [33, 0.22, 2.6]].forEach(([d, w, p0]) => {
          circ(ctx, jx + d * Math.cos(t * w + p0), jy + d * 0.08 * Math.sin(t * w + p0), 1.3, rgba([230, 236, 255], 0.9 * ja));
        });
      }
      // the Moon, gibbous
      ctx.save();
      ctx.beginPath(); ctx.arc(M[0], M[1], mr, 0, TAU); ctx.clip();
      ctx.fillStyle = radG(ctx, M[0] + 10, M[1] - 10, 4, mr * 1.2, [[0, '#fbf6e4'], [1, '#c9c0a2']]);
      ctx.fillRect(M[0] - mr, M[1] - mr, mr * 2, mr * 2);
      ctx.fillStyle = 'rgba(120,112,95,0.28)';
      for (const [dx, dy2, rx, ry] of [[-6, -10, 14, 9], [10, 6, 10, 7], [-14, 14, 9, 6], [16, -16, 7, 5]]) { ctx.beginPath(); ctx.ellipse(M[0] + dx, M[1] + dy2, rx, ry, 0.4, 0, TAU); ctx.fill(); }
      for (const [dx, dy2, r] of [[18, 20, 4], [4, -26, 3], [-2, 22, 2.6], [24, -4, 3]]) { circ(ctx, M[0] + dx, M[1] + dy2, r, 'rgba(110,100,86,0.35)'); }
      ctx.fillStyle = 'rgba(6,10,30,0.86)';
      ctx.beginPath(); ctx.arc(M[0] - mr * 1.32, M[1], mr * 1.08, 0, TAU); ctx.fill();
      ctx.restore();
      // light travelling down the tube's axis
      lit(ctx, () => {
        for (const k of [-16, 0, 16]) {
          const A = [M[0] - u[0] * mr * 0.8 + v[0] * k, M[1] - u[1] * mr * 0.8 + v[1] * k], B = at(L, k);
          ctx.strokeStyle = rgba([200, 215, 255], 0.14); ctx.lineWidth = 7;
          ctx.beginPath(); seg(ctx, A[0], A[1], B[0], B[1]); ctx.stroke();
          ctx.strokeStyle = rgba([240, 244, 255], 0.75); ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 16]); ctx.lineDashOffset = -t * 70;
          ctx.beginPath(); seg(ctx, A[0], A[1], B[0], B[1]); ctx.stroke();
          ctx.setLineDash([]);
        }
      });
      // Middelburg rooftops and the abbey tower
      ctx.fillStyle = '#060a1a';
      let x = -310;
      for (let i = 0; x < 310; i++) {
        const w = 34 + 26 * hash(i, 101), h = 36 + 44 * hash(i, 102), b = 262;
        fillPts(ctx, [x, b, x, b - h, x + w * 0.2, b - h, x + w * 0.2, b - h - 8, x + w * 0.35, b - h - 8, x + w * 0.35, b - h - 16, x + w * 0.65, b - h - 16, x + w * 0.65, b - h - 8, x + w * 0.8, b - h - 8, x + w * 0.8, b - h, x + w, b - h, x + w, b]);
        if (lod > 0.4) for (let j = 0; j < 3; j++) if (hash(i * 3 + j, 103) > 0.55) {
          ctx.fillStyle = rgba([255, 205, 120], 0.55 + 0.25 * Math.sin(t * 2 + i + j));
          ctx.fillRect(x + w * (0.2 + 0.25 * j), b - h + 12 + 10 * hash(i + j, 104), 4, 6);
          ctx.fillStyle = '#060a1a';
        }
        x += w + 4;
      }
      fillPts(ctx, [196, 262, 196, 120, 206, 104, 206, 70, 212, 40, 218, 70, 218, 104, 228, 120, 228, 262]);
      // roof the telescope stands on
      ctx.fillStyle = '#0b1020'; ctx.fillRect(-190, 244, 290, 70);
      ctx.fillStyle = 'rgba(120,140,200,0.15)'; ctx.fillRect(-190, 244, 290, 2);
      // stand
      ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); seg(ctx, -28, 40, -28, 186); seg(ctx, -28, 180, -110, 245); seg(ctx, -28, 180, 54, 245); ctx.stroke();
      ctx.strokeStyle = '#2e1c0e'; ctx.lineWidth = 5;
      ctx.beginPath(); seg(ctx, -28, 180, -26, 252); ctx.stroke();
      circ(ctx, -28, 32, 8, '#b08a45');
      // tubes
      const leather = (poly, a0, a1) => {
        ctx.fillStyle = linG(ctx, ...a0, ...a1, [[0, '#3f140c'], [0.45, '#8c3b25'], [0.6, '#a14a2e'], [1, '#34100a']]);
        fillPts(ctx, poly);
      };
      leather(tubePoly(0, 100, 16, 16), at(0, -16), at(0, 16));
      leather(tubePoly(90, L, 22, 27), at(200, -26), at(200, 26));
      ctx.strokeStyle = rgba('#e0b45a', 0.75); ctx.lineWidth = 1.2;
      strokePts(ctx, [...at(100, -15), ...at(L - 8, -19)]);
      strokePts(ctx, [...at(100, 15), ...at(L - 8, 19)]);
      if (lod > 0.4) for (let s = 130; s < L - 20; s += 46) {
        ctx.strokeStyle = rgba('#e0b45a', 0.6);
        strokePts(ctx, [...at(s, -22.5 - (s - 90) * 0.018), ...at(s, 22.5 + (s - 90) * 0.018)]);
      }
      const brass = (s0, s1, r) => {
        ctx.fillStyle = linG(ctx, ...at(s0, -r), ...at(s0, r), [[0, '#6e5020'], [0.45, '#f0cd7a'], [1, '#6a4a1c']]);
        fillPts(ctx, tubePoly(s0, s1, r, r));
      };
      brass(88, 100, 24); brass(L - 8, L + 2, 30); brass(-4, 6, 18);
      ctx.fillStyle = 'rgba(190,220,255,0.55)';
      fillPts(ctx, ellPts(O[0], O[1], 5, 27, TS.al, 0, TAU, 30));
      lit(ctx, () => {
        glow(ctx, O[0] - v[0] * 8, O[1] - v[1] * 8, 30, [220, 235, 255], 0.5);
        const e = at(-8, 0), p = 0.6 + 0.4 * Math.sin(t * 5);
        glow(ctx, e[0], e[1], 26 * p, [200, 220, 255], 0.55);
        ctx.strokeStyle = rgba([255, 255, 255], 0.8 * p); ctx.lineWidth = 1.2;
        ctx.beginPath(); seg(ctx, e[0] - 12 * p, e[1], e[0] + 12 * p, e[1]); seg(ctx, e[0], e[1] - 12 * p, e[0], e[1] + 12 * p); ctx.stroke();
      });
    },
  });
})();
