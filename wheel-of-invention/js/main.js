/* The Wheel of Invention — timeline, camera, renderer, captions and controls.
   The film is a pure function of time T: render(T) draws any moment, so the scrubber can seek anywhere. */
'use strict';
(() => {
  const SC = window.SCENES;
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RING = 3200, NS = 16, DS = TAU / NS, PR = 280, PR_FINAL = 520;
  const slotA = k => -Math.PI / 2 + k * DS;
  const slotP = k => [Math.cos(slotA(k)) * RING, Math.sin(slotA(k)) * RING];
  const slotRot = k => slotA(k) + Math.PI / 2;
  const BP = [12, 43, 98], BP_LIFT = [22, 64, 136], GRID = [150, 195, 255];
  const KNOCK = rgba(BP, 1);
  const NOW = new Date().getFullYear();

  /* ---------- drawings ---------- */
  SC.forEach((sc, k) => {
    sc.k = k;
    const S = new Sheet();
    sc.build(S);
    S.schedule(sc.draft);
    S.sparkPoints(PR);
    sc.sheet = S;
    sc.ig = sc.ignite || [0, 0];
    sc.igD = Math.hypot(sc.ig[0], sc.ig[1]);
  });
  HUB.init(SC);

  /* ---------- timeline ---------- */
  const TL = { build: 3.6, dive0: 3.9, dive1: 6.5 };
  const CH = [];
  let tt = TL.dive1;
  SC.forEach((sc, i) => {
    const c = { i, sc };
    c.rot0 = i === 0 ? TL.dive0 : tt;
    c.rot1 = i === 0 ? TL.dive1 : tt + sc.rot;
    c.d0 = c.rot1;
    c.burst = c.d0 + sc.draft;
    c.end = c.burst + sc.alive;
    tt = c.end;
    CH.push(c);
  });
  const F = { pull0: tt, pull1: tt + 4.4, hub0: tt + 4.0 };
  F.burst = F.hub0 + 3.8 + 1.6;
  F.spin = F.burst + 2.4;
  F.card = F.burst + 6.4;
  F.end = F.card + 5;
  const END = F.end;
  const chapterAt = T => {
    if (T < TL.dive0) return -1;
    for (let i = 0; i < CH.length; i++) if (T < CH[i].end) return i;
    return CH.length;
  };

  /* ---------- layout ---------- */
  let W = 0, H = 0, DPR = 1, dprCap = 2, portrait = false, sTour = 1, sOv = 0.1, aT = [0, 0], cIn = [0, 0], cFin = [0, 0];
  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    DPR = Math.min(dprCap, window.devicePixelRatio || 1);
    if (W * H * DPR * DPR > 6.5e6) DPR = Math.sqrt(6.5e6 / (W * H));
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    portrait = H > W * 1.05;
    const EXT = RING + 1100;
    if (portrait) {
      sTour = W / 700; aT = [W / 2, H * 0.36];
      sOv = (W * 0.94) / (2 * EXT); cIn = cFin = [W / 2, H * 0.36];
    } else {
      // the finale sits right of centre so the captions at lower left never cover a porthole
      sTour = Math.min(W / 1560, H / 1010); aT = [W / 2, H * 0.43];
      sOv = Math.min((H * 0.92) / (2 * EXT), (W * 0.58) / (2 * EXT));
      cIn = [W / 2, H * 0.47]; cFin = [W * (W / H > 1.45 ? 0.63 : 0.6), H * 0.46];
    }
    document.documentElement.style.setProperty('--hubx', cIn[0] + 'px');
    document.documentElement.style.setProperty('--huby', cIn[1] + 'px');
  }

  /* ---------- camera ---------- */
  const w2s = (C, x, y) => {
    const dx = x - C.fx, dy = y - C.fy, c = Math.cos(C.rot), s = Math.sin(C.rot);
    return [C.ax + C.s * (dx * c - dy * s), C.ay + C.s * (dx * s + dy * c)];
  };
  const s2w = (C, x, y) => {
    const dx = (x - C.ax) / C.s, dy = (y - C.ay) / C.s, c = Math.cos(-C.rot), s = Math.sin(-C.rot);
    return [C.fx + dx * c - dy * s, C.fy + dx * s + dy * c];
  };
  function solve(P, S, rot, s, A) {
    const dx = (S[0] - A[0]) / s, dy = (S[1] - A[1]) / s, c = Math.cos(-rot), sn = Math.sin(-rot);
    return { fx: P[0] - (dx * c - dy * sn), fy: P[1] - (dx * sn + dy * c), rot, s, ax: A[0], ay: A[1] };
  }
  const step = p => (p < 0.5 ? 0 : 1);
  const spinAt = T => { const u = Math.max(0, T - F.spin); return 0.085 * (u - 1.6 * (1 - Math.exp(-u / 1.6))); };
  let cut = 0;
  function camera(T) {
    cut = 0;
    if (T < TL.dive0) return { fx: 0, fy: 0, rot: 0, s: sOv * (1 + 0.03 * E.inOutSine(clamp(T / TL.dive0))), ax: cIn[0], ay: cIn[1] };
    if (T < TL.dive1) {
      const p = prog(TL.dive0, TL.dive1, T), e = RM ? step(p) : E.inOutCubic(p);
      if (RM) cut = bump(p);
      const s0 = sOv * 1.03, s = Math.exp(lerp(Math.log(s0), Math.log(sTour), e)), P = slotP(0);
      const S0 = [cIn[0] + s0 * P[0], cIn[1] + s0 * P[1]];
      return solve(P, [lerp(S0[0], aT[0], e), lerp(S0[1], aT[1], e)], 0, s, [lerp(cIn[0], aT[0], e), lerp(cIn[1], aT[1], e)]);
    }
    if (T < F.pull0) {
      const i = chapterAt(T), c = CH[i];
      let th = slotA(i), mul = 1;
      if (i > 0 && T < c.rot1) {
        const p = prog(c.rot0, c.rot1, T);
        th = lerp(slotA(i - 1), slotA(i), RM ? step(p) : E.inOutBack(p, 0.9));
        mul = 1 - 0.075 * bump(p);
        if (RM) cut = bump(p);
      }
      const push = 0.04 * E.inOutSine(prog(c.d0, c.burst, T)) * (1 - E.inOutSine(prog(c.burst, c.burst + 1.8, T)));
      const kick = T > c.burst && !RM ? 0.05 * Math.exp(-(T - c.burst) * 5) * clamp((T - c.burst) / 0.06) : 0;
      return { fx: Math.cos(th) * RING, fy: Math.sin(th) * RING, rot: -(th + Math.PI / 2), s: sTour * (1 + push - kick) * mul, ax: aT[0], ay: aT[1] };
    }
    if (T < F.pull1) {
      const p = prog(F.pull0, F.pull1, T), e = RM ? step(p) : E.inOutCubic(p);
      if (RM) cut = bump(p);
      const rot = lerp(-(slotA(14) + Math.PI / 2), -TAU, e), s = Math.exp(lerp(Math.log(sTour), Math.log(sOv), e)), P = slotP(14);
      const Sf = [cFin[0] + sOv * P[0], cFin[1] + sOv * P[1]];
      return solve(P, [lerp(aT[0], Sf[0], e), lerp(aT[1], Sf[1], e)], rot, s, [lerp(aT[0], cFin[0], e), lerp(aT[1], cFin[1], e)]);
    }
    const push = 0.035 * E.inOutSine(prog(F.hub0, F.burst, T)) * (1 - E.inOutSine(prog(F.burst, F.burst + 2.6, T)));
    const kick = T > F.burst && !RM ? 0.05 * Math.exp(-(T - F.burst) * 3) * clamp((T - F.burst) / 0.08) : 0;
    return { fx: 0, fy: 0, rot: -TAU - (RM ? 0 : spinAt(T)), s: sOv * (1 + push - kick), ax: cFin[0], ay: cFin[1] };
  }
  function shakeAt(T) {
    if (RM) return 0;
    let a = 0;
    for (const c of CH) {
      const u = T - c.burst;
      if (u < 0 || u > 4.5) continue;
      a += 7 * Math.exp(-u * 7);
      if (c.sc.shake) a += c.sc.shake(u);
    }
    const u = T - F.burst;
    if (u > 0 && u < 3) a += 16 * Math.exp(-u * 3.2);
    return a;
  }
  function flashAt(T) {
    let a = 0;
    for (const c of CH) { const u = T - c.burst; if (u >= 0 && u < 0.4) a = Math.max(a, 0.2 * (1 - u / 0.4)); }
    const u = T - F.burst;
    if (u >= 0 && u < 0.9) a = Math.max(a, 0.5 * Math.pow(1 - u / 0.9, 1.5));
    return RM ? a * 0.35 : a;
  }

  /* ---------- the wheel itself: rim, rails, spokes, detail circles ---------- */
  const GS = new Sheet();
  GS.circle(0, 0, RING, { k: 'ctr', dash: [240, 50, 40, 50], w: 1.6, at: 0.02, dur: 0.34 });
  GS.circle(0, 0, RING + 520, { at: 0.1, dur: 0.36 });
  GS.circle(0, 0, RING - 520, { at: 0.14, dur: 0.36, ccw: true });
  {
    const ticks = [], spokes = [];
    for (let i = 0; i < 256; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 256, l = i % 16 === 0 ? 170 : i % 4 === 0 ? 90 : 45, r = RING + 520;
      ticks.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * (r + l), Math.sin(a) * (r + l)]);
    }
    for (let k = 0; k < NS; k++) { const a = slotA(k) + DS / 2; spokes.push([Math.cos(a) * 760, Math.sin(a) * 760, Math.cos(a) * (RING - 520), Math.sin(a) * (RING - 520)]); }
    GS.multi(ticks, { k: 'thin', at: 0.3, dur: 0.36 });
    GS.multi(spokes, { k: 'con', a: 0.5, at: 0.36, dur: 0.3 });
  }
  GS.circle(0, 0, 700, { at: 0.4, dur: 0.3 });
  GS.circle(0, 0, 240, { k: 'thin', at: 0.46, dur: 0.24 });
  for (let k = 0; k < NS; k++) { const [x, y] = slotP(k); GS.circle(x, y, PR, { k: 'hid', dash: [44, 30], w: 1.4, at: 0.5 + k * 0.022, dur: 0.16, a0: slotA(k) + Math.PI }); }
  GS.schedule(TL.build);
  const yearStr = sc => (sc.year < 0 ? `${sc.circa ? 'c. ' : ''}${-sc.year} BCE` : `${sc.circa ? 'c. ' : ''}${sc.year}`);

  /* ---------- polar drafting grid ---------- */
  function segDist(px, py, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1], w = ((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy || 1), t = clamp(w);
    return Math.hypot(a[0] + vx * t - px, a[1] + vy * t - py);
  }
  function drawGrid(C) {
    const pts = [s2w(C, 0, 0), s2w(C, W, 0), s2w(C, W, H), s2w(C, 0, H)], o = w2s(C, 0, 0);
    let dmax = 0;
    for (const p of pts) dmax = Math.max(dmax, Math.hypot(p[0], p[1]));
    let dmin = 0, a0 = 0, a1 = TAU;
    if (!(o[0] >= 0 && o[0] <= W && o[1] >= 0 && o[1] <= H)) {
      dmin = Infinity;
      for (let i = 0; i < 4; i++) dmin = Math.min(dmin, segDist(0, 0, pts[i], pts[(i + 1) % 4]));
      const cv = s2w(C, W / 2, H / 2), ac = Math.atan2(cv[1], cv[0]);
      let lo = 0, hi = 0;
      for (const p of pts) { const d = Math.atan2(Math.sin(Math.atan2(p[1], p[0]) - ac), Math.cos(Math.atan2(p[1], p[0]) - ac)); lo = Math.min(lo, d); hi = Math.max(hi, d); }
      a0 = ac + lo; a1 = ac + hi;
    }
    ctx.lineWidth = 1 / C.s;
    for (const [stp, al, skip] of [[40, 0.06, 200], [200, 0.1, 1000], [1000, 0.15, 0]]) {
      const a = al * smooth(clamp((stp * C.s - 5) / 12));
      if (a < 0.004) continue;
      ctx.strokeStyle = rgba(GRID, a);
      ctx.beginPath();
      for (let r = Math.max(stp, Math.ceil(dmin / stp) * stp); r <= dmax; r += stp) {
        if (skip && r % skip === 0) continue;
        ctx.moveTo(Math.cos(a0) * r, Math.sin(a0) * r);
        ctx.arc(0, 0, r, a0, a1);
      }
      ctx.stroke();
    }
    for (const [rb0, rb1, n] of [[150, 300, 32], [300, 600, 64], [600, 1200, 128], [1200, 2400, 256], [2400, 7000, 512]]) {
      const r0 = Math.max(rb0, dmin), r1 = Math.min(rb1, dmax);
      if (r0 >= r1) continue;
      const da = TAU / n, px = da * r1 * C.s;
      const amin = 0.06 * smooth(clamp((px - 5) / 12)), amaj = 0.1 * smooth(clamp((px * 8 - 5) / 12));
      const i0 = Math.floor(a0 / da), i1 = Math.ceil(a1 / da);
      for (const [maj, al] of [[false, amin], [true, amaj]]) {
        if (al < 0.004) continue;
        ctx.strokeStyle = rgba(GRID, al);
        ctx.beginPath();
        for (let i = i0; i <= i1; i++) {
          if ((i % 8 === 0) !== maj) continue;
          const a = i * da, c = Math.cos(a), s = Math.sin(a);
          ctx.moveTo(c * r0, s * r0); ctx.lineTo(c * r1, s * r1);
        }
        ctx.stroke();
      }
    }
  }

  function drawSlotLabels(C, T) {
    const a = 1 - smooth(prog(0.2, 0.36, C.s));
    if (a < 0.01) return;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = 0; k < NS; k++) {
      const t0 = TL.build * (0.55 + k * 0.022), p = prog(t0, t0 + 0.45, T);
      if (p <= 0) continue;
      const ang = slotA(k), r = RING + 520 + 400;
      ctx.save();
      ctx.translate(Math.cos(ang) * r, Math.sin(ang) * r);
      ctx.rotate(-C.rot);
      const num = k < 15 ? SC[k].n : '?', yr = k < 15 ? yearStr(SC[k]).toUpperCase() : 'NEXT';
      ctx.font = `700 118px ${FT}`;
      if (HAS_LS) ctx.letterSpacing = '8px';
      ctx.fillStyle = rgba(INK, 0.92 * a);
      ctx.fillText(num.slice(0, Math.ceil(p * num.length)), 0, -50);
      ctx.font = `600 70px ${FT}`;
      ctx.fillStyle = rgba(INK, 0.6 * a);
      ctx.fillText(yr.slice(0, Math.ceil(p * yr.length)), 0, 55);
      if (HAS_LS) ctx.letterSpacing = '0px';
      ctx.restore();
    }
  }

  /* ---------- cells ---------- */
  function focusAlpha(k, T) {
    const i = chapterAt(T);
    if (i < 0 || i >= CH.length) return 1;
    if (k === i) return 1;
    if (k === i - 1 && T < CH[i].rot1) return lerp(1, 0.42, prog(CH[i].rot0, CH[i].rot1, T));
    return 0.42;
  }
  const portScale = T => 1 + (PR_FINAL / PR - 1) * E.inOutCubic(prog(F.pull0 + 0.5, F.pull1 + 0.4, T));
  const normAng = a => Math.atan2(Math.sin(a), Math.cos(a));
  function drawBezel(tb, s) {
    const a = smooth(clamp(tb / 0.5));
    ctx.fillStyle = radG(ctx, 0, 0, PR * 0.66, PR, [[0, [2, 10, 28], 0], [1, [2, 10, 28], 0.5 * a]]);
    ctx.beginPath(); ctx.arc(0, 0, PR, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba([238, 246, 255], 0.95 * a); ctx.lineWidth = Math.max(3.2 * s, 1.6) / s;
    ctx.beginPath(); ctx.arc(0, 0, PR, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba([238, 246, 255], 0.3 * a); ctx.lineWidth = Math.max(1 * s, 0.7) / s;
    ctx.beginPath(); ctx.arc(0, 0, PR + 9, 0, TAU); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba([255, 255, 255], 0.16 * a); ctx.lineWidth = Math.max(5 * s, 2) / s;
    ctx.beginPath(); ctx.arc(0, 0, PR - 12, Math.PI * 1.1, Math.PI * 1.42); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  function burstFX(sc, tb, s, k) {
    const [ix, iy] = sc.ig;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (tb < 0.5) glow(ctx, ix, iy, PR * (0.5 + 1.7 * E.outCubic(tb / 0.5)), [255, 236, 200], 0.95 * Math.pow(1 - tb / 0.5, 2));
    if (tb < 0.8) {
      const rr = (PR + sc.igD + 12) * E.outExpo(clamp(tb / 0.8));
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, PR, 0, TAU); ctx.clip();
      ctx.strokeStyle = rgba([255, 226, 170], 0.9 * (1 - tb / 0.8)); ctx.lineWidth = Math.max(7 * s, 3) / s;
      ctx.beginPath(); ctx.arc(ix, iy, rr, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    for (const [d, c, w] of [[0, [255, 240, 214], 11], [0.1, [255, 176, 86], 6]]) {
      const u = clamp((tb - d) / 1.05);
      if (u <= 0 || u >= 1) continue;
      ctx.strokeStyle = rgba(c, 0.8 * Math.pow(1 - u, 1.6)); ctx.lineWidth = Math.max(w * s * (1 - u), 1) / s;
      ctx.beginPath(); ctx.arc(ix, iy, 60 + 600 * E.outCubic(u), 0, TAU); ctx.stroke();
    }
    ctx.restore();
    drawSparks(ctx, sc.sheet.sparks, tb, { cx: ix, cy: iy, seed: k * 17 + 3, s, alpha: RM ? 0.4 : 1 });
  }
  function drawCell(k, T, C) {
    const sc = SC[k], c = CH[k], tD = T - c.d0;
    if (tD < 0) return;
    const [x, y] = slotP(k), sp = w2s(C, x, y), f = portScale(T), m = 760 * C.s * f;
    if (sp[0] < -m || sp[0] > W + m || sp[1] < -m || sp[1] > H + m) return;
    const tb = T - c.burst, s = C.s;
    const aAnn = focusAlpha(k, T) * (1 - smooth(prog(F.pull0, F.pull0 + 2.2, T)));
    ctx.save();
    ctx.translate(x, y); ctx.rotate(slotRot(k));
    const heads = [], R = { s, alpha: aAnn, heads, knock: KNOCK, tb };
    if (aAnn > 0.01) renderSheet(ctx, sc.sheet, tD, 0, R);
    const pre = T < c.burst ? prog(c.burst - 0.5, c.burst, T) : 0;
    if (pre > 0) { heatSheet(ctx, sc.sheet, E.inCubic(pre), s); if (!RM) drawImplode(ctx, sc.ig[0], sc.ig[1], pre, s, k + 3); }
    if (tb > 0) {
      const up = E.inOutCubic(prog(F.pull0 + k * 0.05, F.pull1 - 0.6 + k * 0.05, T));
      const extra = up * normAng(-slotRot(k)) + (RM ? 0 : spinAt(T));
      const env = { lod: clamp((PR * s * f - 60) / 170), s: s * f, r: PR };
      ctx.save();
      ctx.scale(f, f); ctx.rotate(extra);
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, PR, 0, TAU); ctx.clip();
      if (tb < 0.8) { ctx.beginPath(); ctx.arc(sc.ig[0], sc.ig[1], (PR + sc.igD + 12) * E.outExpo(clamp(tb / 0.8)), 0, TAU); ctx.clip(); }
      sc.scene(ctx, tb, env);
      ctx.restore();
      drawBezel(tb, s * f);
      if (sc.over) { ctx.save(); sc.over(ctx, tb, env); ctx.restore(); }
      ctx.restore();
    }
    if (aAnn > 0.01) renderSheet(ctx, sc.sheet, tD, 1, R);
    drawHeads(ctx, heads, s);
    if (tb > -0.01 && tb < 1.8) burstFX(sc, tb, s, k);
    ctx.restore();
  }
  function drawBlank(T, C) {
    const fin = E.inOutCubic(prog(F.pull0 + 0.5, F.pull1 + 0.4, T));
    if (fin <= 0) return;
    const [x, y] = slotP(15), f = portScale(T), s = C.s * f;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-C.rot); ctx.scale(f, f);
    ctx.fillStyle = rgba(BP, 0.85 * fin);
    ctx.beginPath(); ctx.arc(0, 0, PR, 0, TAU); ctx.fill();
    ctx.setLineDash([34, 24]); ctx.lineDashOffset = -T * 12;
    ctx.strokeStyle = rgba(INK, 0.75 * fin); ctx.lineWidth = Math.max(1.6 * s, 1) / s;
    ctx.beginPath(); ctx.arc(0, 0, PR, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    const q = prog(F.card - 0.4, F.card + 0.8, T);
    if (q > 0) {
      ctx.font = `italic 300 330px ${FS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba([255, 240, 214], 0.9 * q);
      ctx.fillText('?', 0, 18);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 0, 0, PR * 1.4, [255, 214, 150], 0.3 * q * (0.75 + 0.25 * Math.sin(T * 2.4)));
      const a = T * 1.3;
      glow(ctx, Math.cos(a) * PR, Math.sin(a) * PR, 70, [255, 244, 220], 0.9 * q);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  /* ---------- screen-space texture ---------- */
  const grain = (() => {
    const g = document.createElement('canvas');
    g.width = g.height = 192;
    const gx = g.getContext('2d'), img = gx.createImageData(192, 192), r = rng(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r() < 0.5 ? 0 : 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = (r() * 30) | 0;
    }
    gx.putImageData(img, 0, 0);
    return g;
  })();
  let grainPat = null;

  /* ---------- frame ---------- */
  function render(T) {
    const C = camera(T), sh = shakeAt(T);
    const shx = sh * noise1(T * 31, 1), shy = sh * noise1(T * 29, 2), shr = sh * 0.0009 * noise1(T * 23, 3);
    const lift = smooth(prog(F.burst - 0.2, F.burst + 2.4, T));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const base = mix(BP, BP_LIFT, lift * 0.55);
    ctx.fillStyle = radG(ctx, C.ax, C.ay, 0, Math.max(W, H) * 0.75, [[0, mix(base, [44, 112, 214], 0.3 + 0.12 * lift)], [1, base]]);
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(C.ax + shx, C.ay + shy); ctx.rotate(C.rot + shr); ctx.scale(C.s, C.s); ctx.translate(-C.fx, -C.fy);
    drawGrid(C);
    const gh = [], GR = { s: C.s, alpha: 1, heads: gh, knock: KNOCK };
    renderSheet(ctx, GS, T, 0, GR);
    renderSheet(ctx, GS, T, 1, GR);
    drawHeads(ctx, gh, C.s);
    drawSlotLabels(C, T);
    const tAI = T - F.burst;
    if (T > F.hub0 - 0.05) {
      const hh = [], HR = { s: C.s, alpha: 1 - 0.45 * smooth(prog(0, 1.5, tAI)), heads: hh, knock: KNOCK };
      renderSheet(ctx, HUB.sheet, T - F.hub0, 0, HR);
      renderSheet(ctx, HUB.sheet, T - F.hub0, 1, HR);
      drawHeads(ctx, hh, C.s);
      HUB.drawAlive(ctx, tAI, C.s, 1);
    }
    for (let k = 0; k < CH.length; k++) drawCell(k, T, C);
    drawBlank(T, C);
    if (T > F.burst) { HUB.drawBurst(ctx, tAI, C.s); HUB.drawNext(ctx, tAI, C.s); }
    ctx.restore();

    // atmosphere: motes in the lamp light, vignette, grain, flash
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 38; i++) {
      const x = wrap(hash(i, 401) * W + T * (6 + 10 * hash(i, 402)), W), y = wrap(hash(i, 403) * H - T * (4 + 6 * hash(i, 404)), H);
      circ(ctx, x, y, 0.6 + 1.3 * hash(i, 405), rgba([190, 220, 255], 0.14 + 0.1 * Math.sin(T * 1.3 + i)));
    }
    const fl = flashAt(T);
    if (fl > 0.003) { ctx.fillStyle = rgba([255, 226, 180], fl); ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = radG(ctx, W / 2, H / 2, Math.min(W, H) * 0.35, Math.hypot(W, H) * 0.62, [[0, [2, 10, 30], 0], [1, [2, 10, 30], 0.62]]);
    ctx.fillRect(0, 0, W, H);
    if (!grainPat) grainPat = ctx.createPattern(grain, 'repeat');
    ctx.globalAlpha = 0.55;
    ctx.save(); ctx.translate((hash(Math.floor(T * 24), 9) * 192) | 0, (hash(Math.floor(T * 24), 10) * 192) | 0);
    ctx.fillStyle = grainPat; ctx.fillRect(-192, -192, W + 192, H + 192);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (cut > 0.003) { ctx.fillStyle = rgba(BP, cut * 0.97); ctx.fillRect(0, 0, W, H); }
  }

  /* ---------- captions ---------- */
  const $ = id => document.getElementById(id);
  const ui = {
    intro: $('intro'), introTitle: $('introTitle'), introKick: $('introKick'), introSub: $('introSub'),
    lower: $('lower'), year: $('year'), circa: $('circa'), era: $('era'), digits: $('digits'),
    kicker: $('kicker'), title: $('title'), line: $('line'),
    play: $('play'), track: $('track'), fill: $('fill'), clock: $('clock'), tip: $('tip'), bar: $('bar'),
  };
  const CAPS = CH.map((c, i) => ({
    kicker: `${c.sc.n} / 16 · ${c.sc.who}`, title: c.sc.title, line: c.sc.line,
    k0: i === 0 ? TL.dive1 - 1.0 : c.rot0 + 0.3, t0: c.burst + 0.12, out: i < CH.length - 1 ? CH[i + 1].rot0 : F.pull0 + 0.4,
  }));
  CAPS.push({ kicker: '16 / 16 · Built on everything before it', title: 'Artificial Intelligence', line: 'Trained on everything we have written, drawn and built.', k0: F.pull0 + 1.8, t0: F.burst + 0.25, out: F.card - 0.1 });
  CAPS.push({ kicker: '5,500 years · One drawing', title: 'What will we draw next?', line: 'Every machine on this wheel began as lines on paper.', k0: F.card + 0.1, t0: F.card + 0.3, out: Infinity });

  const digitCols = [];
  for (let d = 0; d < 4; d++) {
    const cell = document.createElement('span'); cell.className = 'dg';
    const col = document.createElement('span'); col.className = 'col';
    col.innerHTML = [...'0123456789012'].map(n => `<span>${n}</span>`).join('');
    cell.appendChild(col); ui.digits.appendChild(cell);
    digitCols.push({ cell, col, last: '' });
  }
  const yearAt = T => {
    const Y = CH.map(c => c.sc.year);
    if (T < CH[1].rot0) return Y[0];
    for (let i = 1; i < CH.length; i++) if (T < CH[i].rot1) return T < CH[i].rot0 ? Y[i - 1] : lerp(Y[i - 1], Y[i], E.inOutCubic(prog(CH[i].rot0, CH[i].rot1, T)));
    if (T < F.pull0) return Y[14];
    return lerp(Y[14], NOW, E.inOutCubic(prog(F.pull0 + 0.3, F.pull0 + 3.2, T)));
  };
  let lastYearT = 0, lastYear = CH[0].sc.year, lastEra = '';
  function setYear(T) {
    const v = yearAt(T), a = Math.abs(v), spd = Math.abs(v - lastYear) / Math.max(1e-3, Math.abs(T - lastYearT));
    lastYear = v; lastYearT = T;
    for (let k = 0; k < 4; k++) {
      const p = Math.pow(10, k), base = Math.floor(a / p) % 10;
      let pos = k === 0 ? a % 10 : base + Math.max(0, (a % p) - (p - 1));
      const d = digitCols[3 - k], lead = k > 0 && a < p - 0.5;
      const blur = RM ? 0 : Math.min(3, (spd / p) / 14);
      const tf = `translate3d(0,${(-pos).toFixed(3)}em,0)`;
      if (d.last !== tf) { d.col.style.transform = tf; d.last = tf; }
      d.col.style.filter = blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : '';
      d.cell.style.opacity = lead ? 0.22 : 1;
    }
    ui.circa.style.opacity = T < (CH[2].rot0 + CH[2].rot1) / 2 ? 1 : 0;
    const era = T > F.pull0 + 2.2 ? 'TODAY' : v < -0.5 ? 'BCE' : v < 1500 ? 'CE' : '';
    if (era !== lastEra) { ui.era.textContent = era; lastEra = era; }
    ui.year.style.opacity = smooth(prog(TL.dive0 + 0.4, TL.dive1, T));
  }
  let capIdx = -2, letters = [], words = [];
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function buildCap(i) {
    capIdx = i;
    if (i < 0) { ui.title.innerHTML = ''; ui.line.innerHTML = ''; ui.kicker.textContent = ''; letters = []; words = []; return; }
    const c = CAPS[i];
    ui.title.innerHTML = c.title.split(' ').map(w => `<span class="wd">${[...w].map(ch => `<span class="ch">${esc(ch)}</span>`).join('')}</span>`).join(' ');
    ui.line.innerHTML = c.line.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ');
    letters = [...ui.title.querySelectorAll('.ch')];
    words = [...ui.line.querySelectorAll('.w')];
    ui.title.setAttribute('aria-label', c.title);
  }
  const GLY = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  function setCaption(T) {
    let i = -1;
    for (let j = CAPS.length - 1; j >= 0; j--) if (T >= CAPS[j].k0 && T < CAPS[j].out + 0.6) { i = j; break; }
    if (i !== capIdx) buildCap(i);
    if (i < 0) return;
    const c = CAPS[i], q = clamp((T - c.out) / 0.5);
    let k = '';
    for (let j = 0; j < c.kicker.length; j++) {
      const tj = c.k0 + j * 0.018;
      if (T < tj) break;
      const ch = c.kicker[j];
      k += T > tj + 0.16 || ch === ' ' ? ch : GLY[Math.floor(hash(Math.floor(T * 30) + j, 17) * GLY.length)];
    }
    ui.kicker.textContent = k;
    ui.kicker.style.opacity = 1 - q;
    letters.forEach((el, j) => {
      const u = T - c.t0 - j * 0.028, p = clamp(u / 0.55), w = E.inOutCubic(clamp((u - 0.05) / 0.5));
      const o = clamp((T - c.out - j * 0.014) / 0.35);
      el.style.opacity = (E.outCubic(p) * (1 - o)).toFixed(3);
      el.style.transform = `translate3d(0,${((1 - E.outCubic(p)) * 0.55 - E.inCubic(o) * 0.35).toFixed(3)}em,0)`;
      el.style.fontWeight = Math.round(lerp(100, 800, w));
      el.style.color = w < 1 ? rgba(mix([168, 206, 255], [255, 244, 226], w), 1) : '';
    });
    words.forEach((el, j) => {
      const p = clamp((T - c.t0 - 0.45 - j * 0.055) / 0.5);
      el.style.opacity = (E.outCubic(p) * (1 - q)).toFixed(3);
      el.style.transform = `translate3d(0,${((1 - E.outCubic(p)) * 0.5).toFixed(3)}em,0)`;
    });
  }
  let introLetters = [];
  function buildIntro() {
    const t = ui.introTitle.textContent;
    ui.introTitle.setAttribute('aria-label', t);
    ui.introTitle.innerHTML = t.split(' ').map(w => `<span class="wd">${[...w].map(ch => `<span class="ch">${esc(ch)}</span>`).join('')}</span>`).join(' ');
    introLetters = [...ui.introTitle.querySelectorAll('.ch')];
  }
  function setIntro(T) {
    const out = clamp((T - 3.5) / 0.6);
    ui.intro.style.visibility = out >= 1 ? 'hidden' : 'visible';
    if (out >= 1) return;
    introLetters.forEach((el, j) => {
      const w = E.inOutCubic(clamp((T - 0.25 - j * 0.045) / 0.9));
      const o = clamp((T - 3.5 - j * 0.012) / 0.4);
      el.style.fontWeight = Math.round(lerp(120, 800, w));
      el.style.opacity = (1 - o).toFixed(3);
      el.style.transform = `translate3d(0,${(-E.inCubic(o) * 0.3).toFixed(3)}em,0)`;
      el.style.color = w < 1 ? rgba(mix([168, 206, 255], [255, 244, 226], w), 1) : '';
    });
    ui.introKick.style.opacity = ui.introSub.style.opacity = (1 - out).toFixed(3);
  }

  /* ---------- controls ---------- */
  let T = 0, playing = !RM, last = performance.now(), idleAt = performance.now();
  const MARKS = CH.map((c, i) => ({ t: i === 0 ? 0 : c.rot0, label: `${yearStr(c.sc)} · ${c.sc.title}` }));
  MARKS.push({ t: F.pull0, label: 'Today · Artificial Intelligence' });
  const tickEls = MARKS.map((m, i) => {
    const b = document.createElement('button');
    b.className = 'tick'; b.type = 'button';
    b.style.left = `${(m.t / END) * 100}%`;
    b.setAttribute('aria-label', `Chapter ${i + 1}: ${m.label}`);
    b.addEventListener('click', e => { e.stopPropagation(); seek(m.t); });
    const show = () => { ui.tip.textContent = m.label; ui.tip.style.left = b.style.left; ui.tip.hidden = false; };
    b.addEventListener('mouseenter', show); b.addEventListener('focus', show);
    b.addEventListener('mouseleave', () => (ui.tip.hidden = true)); b.addEventListener('blur', () => (ui.tip.hidden = true));
    ui.track.appendChild(b);
    return b;
  });
  function seek(t) { T = clamp(t, 0, END); lastYearT = T; lastYear = yearAt(T); }
  function setPlaying(p) { playing = p; }
  const icon = { pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>', play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>', replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M4 4.5v5h5z"/></svg>' };
  let iconState = '';
  function syncControls() {
    const done = T >= END - 0.01, st = done ? 'replay' : playing ? 'pause' : 'play';
    if (st !== iconState) {
      iconState = st;
      ui.play.innerHTML = icon[st];
      ui.play.setAttribute('aria-label', st === 'replay' ? 'Replay from the start' : st === 'pause' ? 'Pause' : 'Play');
    }
    ui.fill.style.transform = `scaleX(${(Math.min(T, END) / END).toFixed(4)})`;
    const cur = Math.min(T, END), fmt = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
    ui.clock.textContent = `${fmt(cur)} / ${fmt(END)}`;
    let act = -1;
    MARKS.forEach((m, i) => { if (T >= m.t) act = i; });
    tickEls.forEach((b, i) => b.classList.toggle('on', i <= act));
    ui.bar.classList.toggle('idle', playing && performance.now() - idleAt > 2600 && !ui.bar.matches(':hover, :focus-within'));
  }
  ui.play.addEventListener('click', () => {
    if (T >= END - 0.01) { seek(0); setPlaying(true); } else setPlaying(!playing);
  });
  ui.track.addEventListener('click', e => {
    const r = ui.track.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * END);
  });
  const chapterIndexAt = t => { let a = 0; MARKS.forEach((m, i) => { if (t >= m.t - 0.01) a = i; }); return a; };
  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space' || e.key === 'k') { e.preventDefault(); ui.play.click(); }
    else if (e.key === 'ArrowRight') { const i = chapterIndexAt(T); seek(i + 1 < MARKS.length ? MARKS[i + 1].t : F.card); }
    else if (e.key === 'ArrowLeft') { const i = chapterIndexAt(T); seek(T - MARKS[i].t > 1.5 ? MARKS[i].t : MARKS[Math.max(0, i - 1)].t); }
    else if (e.key === 'Home') seek(0);
    else if (e.key === 'End') seek(F.card);
    idleAt = performance.now();
  });
  window.addEventListener('pointermove', () => (idleAt = performance.now()), { passive: true });
  window.addEventListener('resize', layout);
  document.addEventListener('visibilitychange', () => { last = performance.now(); ema = 16; slow = 0; });

  /* ---------- deep links: #wheel, #press … #ai, #end ---------- */
  const hashSeek = () => {
    const h = (location.hash || '').slice(1).toLowerCase();
    if (!h) return;
    const i = SC.findIndex(s => s.id === h);
    if (i >= 0) seek(i === 0 ? TL.dive0 : CH[i].rot0);
    else if (h === 'ai') seek(F.pull0);
    else if (h === 'end') seek(F.card);
  };
  window.addEventListener('hashchange', hashSeek);

  /* ---------- run ---------- */
  // on slow machines, trade pixel density for a steady frame rate (never the other way, to avoid flip-flopping)
  let ema = 16, slow = 0;
  function frame(now) {
    const raw = now - last, dt = Math.min(0.1, raw / 1000);
    last = now;
    ema = ema * 0.94 + Math.min(100, raw) * 0.06;
    if (playing && ema > 30 && DPR > 1.01) {
      if (++slow > 45) { dprCap = Math.max(1, DPR - 0.4); layout(); slow = 0; ema = 16; }
    } else slow = 0;
    if (playing) T += dt;
    render(T);
    setIntro(T); setYear(T); setCaption(T); syncControls();
    requestAnimationFrame(frame);
  }
  layout();
  buildIntro();
  hashSeek();
  window.__wheel = { seek, pause: () => setPlaying(false), play: () => setPlaying(true), get T() { return T; }, END, F, CH };
  const fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  const resetText = () => { for (const sc of SC) for (const st of sc.sheet.strokes) st.W = null; for (const st of HUB.sheet.strokes) st.W = null; };
  render(T);
  fontsReady.then(() => { resetText(); last = performance.now(); requestAnimationFrame(frame); });
  if (document.fonts) document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', resetText);
})();
