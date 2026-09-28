/* The Wheel of Invention — the hub: artificial intelligence as a radial neural network
   whose input layer is wired to every invention on the rim. World coordinates, wheel centre at (0,0). */
'use strict';
const HUB = (() => {
  const RING = 3200, NS = 16, DS = TAU / NS, PORT_IN = 2680;
  const th = k => -Math.PI / 2 + k * DS;
  const LAYERS = [
    { r: 2250, n: 16, nr: 46 },
    { r: 1650, n: 12, nr: 40 },
    { r: 1100, n: 8, nr: 36 },
    { r: 600, n: 6, nr: 32 },
  ];
  const nodes = LAYERS.map((L, li) => {
    const out = [];
    for (let i = 0; i < L.n; i++) {
      const a = li === 0 ? th(i) : -Math.PI / 2 + ((i + 0.5) * TAU) / L.n;
      out.push({ x: Math.cos(a) * L.r, y: Math.sin(a) * L.r, a, r: L.nr });
    }
    return out;
  });
  const core = { x: 0, y: 0, r: 170, a: 0 };
  const edge = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    return [a.x + (dx / L) * a.r, a.y + (dy / L) * a.r, b.x - (dx / L) * b.r, b.y - (dy / L) * b.r];
  };
  const angDist = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const nearest = (list, a) => list.reduce((best, n, i) => (angDist(n.a, a) < angDist(list[best].a, a) ? i : best), 0);

  let colours = null, flows = null, sheet = null;
  function init(scenes) {
    const inCol = nodes[0].map((n, i) => (i < scenes.length ? hex(scenes[i].color) : [214, 222, 236]));
    const avg = (li, n, w) => {
      const near = nodes[0].map((m, i) => ({ i, d: angDist(m.a, n.a) })).sort((p, q) => p.d - q.d).slice(0, 3);
      const c = near.reduce((acc, { i }) => [acc[0] + inCol[i][0] / 3, acc[1] + inCol[i][1] / 3, acc[2] + inCol[i][2] / 3], [0, 0, 0]);
      return mix(c, [255, 255, 255], w);
    };
    colours = [inCol, nodes[1].map(n => avg(1, n, 0.3)), nodes[2].map(n => avg(2, n, 0.55)), nodes[3].map(n => avg(3, n, 0.8))];
    // each invention's signal takes the angularly nearest route to the core
    flows = scenes.map((sc, k) => {
      const a = th(k), pts = [Math.cos(a) * PORT_IN, Math.sin(a) * PORT_IN, nodes[0][k].x, nodes[0][k].y];
      for (let li = 1; li < 4; li++) { const n = nodes[li][nearest(nodes[li], a)]; pts.push(n.x, n.y); }
      pts.push(0, 0);
      return { seg: polySeg(pts), col: inCol[k], t0: -1.75 + 0.045 * k };
    });
    sheet = buildSheet();
    return sheet;
  }

  function buildSheet() {
    const S = new Sheet();
    for (const L of LAYERS) S.circle(0, 0, L.r, { k: 'ctr', dash: [200, 46, 34, 46], w: 1.4, ph: 1 });
    S.circle(0, 0, core.r, { ph: 1, w: 2.6 });
    S.circle(0, 0, 120, { k: 'thin', ph: 1 });
    S.multi([[-260, 0, 260, 0], [0, -260, 0, 260]], { k: 'ctr', dash: [60, 20, 12, 20], ph: 1 });
    const paths = [];
    for (let k = 0; k < NS; k++) { const a = th(k); paths.push([Math.cos(a) * 2296, Math.sin(a) * 2296, Math.cos(a) * PORT_IN, Math.sin(a) * PORT_IN]); }
    S.multi(paths.slice(0, NS - 1), { k: 'thin', ph: 1, w: 1.6 });
    S.multi([paths[NS - 1]], { k: 'hid', dash: [60, 40], ph: 1 });
    nodes.forEach(layer => S.multi(layer.map(n => polyReg(n.x, n.y, n.r, 28)), { k: 'obj', ph: 2, w: 2.6 }));
    for (let li = 0; li < 3; li++) {
      const segs = [];
      for (const a of nodes[li]) for (const b of nodes[li + 1]) segs.push(edge(a, b));
      S.multi(segs, { k: 'thin', ph: 3, a: 0.4 });
    }
    S.multi(nodes[3].map(n => edge(n, core)), { k: 'thin', ph: 3, a: 0.6, w: 1.6 });
    const lab = (t, x, y, o = {}) => S.text(t, x, y, Object.assign({ size: 84, box: true, ph: 4, align: 'c' }, o));
    const mid = th(0) + DS / 2;
    lab('INPUT', Math.cos(mid) * 2470, Math.sin(mid) * 2470);
    lab('HIDDEN LAYERS', 0, -1380, { size: 78 });
    lab('OUTPUT', 0, 300, { size: 78 });
    lab('y = σ(Wx + b)', -1375, 60, { font: FS, weight: 400, size: 96, ls: 0 });
    lab('softmax(QKᵀ / √d) · V', 0, 1380, { font: FS, weight: 400, size: 100, ls: 0 });
    lab('FIG. 16 — NEURAL NETWORK', 0, 440, { size: 64, a: 0.8 });
    return S.schedule(3.8);
  }

  /* inflow before the burst, then a lit, pulsing network */
  function drawAlive(ctx, t, s, lod) {
    if (!colours || t < -1.9) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const on = smooth(clamp(t / 0.4));
    const lw = px => Math.max(px * s, px * 0.35) / s;
    if (on > 0) {
      glow(ctx, 0, 0, 3100, [110, 160, 255], 0.14 * on);
      for (let li = 0; li < 3; li++) {
        nodes[li].forEach((a, i) => {
          ctx.strokeStyle = rgba(colours[li][i], (0.1 + 0.06 * li) * on);
          ctx.lineWidth = Math.max(1.1, 3 * s) / s;
          ctx.beginPath();
          for (const b of nodes[li + 1]) { const e = edge(a, b); seg(ctx, e[0], e[1], e[2], e[3]); }
          ctx.stroke();
        });
      }
      ctx.strokeStyle = rgba([255, 250, 235], 0.35 * on); ctx.lineWidth = Math.max(1.4, 4 * s) / s;
      ctx.beginPath(); for (const n of nodes[3]) { const e = edge(n, core); seg(ctx, e[0], e[1], e[2], e[3]); } ctx.stroke();
      for (let k = 0; k < NS - 1; k++) {
        const a = th(k);
        ctx.strokeStyle = rgba(colours[0][k], 0.45 * on); ctx.lineWidth = Math.max(1.6, 6 * s) / s;
        ctx.beginPath(); seg(ctx, Math.cos(a) * 2296, Math.sin(a) * 2296, Math.cos(a) * PORT_IN, Math.sin(a) * PORT_IN); ctx.stroke();
      }
      // signals flow through the layers, mostly inward
      const n = lod > 0.5 ? 170 : 90;
      for (let j = 0; j < n; j++) {
        const li = Math.min(3, Math.floor(hash(j, 301) * 4)), A = nodes[li], a = A[Math.floor(hash(j, 302) * A.length)];
        const B = li < 3 ? nodes[li + 1] : [core], b = B[Math.floor(hash(j, 303) * B.length)];
        const P = 1.1 + 1.8 * hash(j, 304), inward = hash(j, 305) < 0.82;
        let u = (t / P + hash(j, 306)) % 1;
        if (!inward) u = 1 - u;
        const x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u);
        const c = li < 3 ? mix(colours[li][A.indexOf(a)], [255, 255, 255], u * 0.5) : [255, 250, 235];
        glow(ctx, x, y, 64, c, 0.9 * on * Math.sin(Math.PI * u));
      }
      // nodes
      nodes.forEach((layer, li) => layer.forEach((nd, i) => {
        const fl = 0.7 + 0.3 * Math.sin(t * (2 + li) + i * 1.7);
        glow(ctx, nd.x, nd.y, nd.r * 4.2, colours[li][i], 0.55 * on * fl);
        circ(ctx, nd.x, nd.y, nd.r * 0.62, rgba(mix(colours[li][i], [255, 255, 255], 0.55), 0.95 * on));
      }));
    }
    // inflow: every invention sends its signal to the centre
    if (t > -1.9 && t < 0.35) {
      for (const f of flows) {
        if (t < f.t0) continue;
        const u = E.inQuad(clamp((t - f.t0) / (0 - f.t0))), L = f.seg.len, head = u * L;
        const st = { segs: [f.seg] };
        const c = mix(f.col, [255, 255, 255], u * 0.8);
        ctx.strokeStyle = rgba(c, 0.55 * (1 - clamp(t / 0.3))); ctx.lineWidth = lw(5);
        ctx.beginPath(); pathRange(ctx, st, Math.max(0, head - 900), head); ctx.stroke();
        const q = tipAt(st, head);
        glow(ctx, q[0], q[1], 190, c, 0.95 * (1 - clamp(t / 0.3)));
        if (t - f.t0 < 0.4) glow(ctx, f.seg.p[0], f.seg.p[1], 420, f.col, 0.7 * (1 - (t - f.t0) / 0.4));
      }
    }
    // the core charges as signals arrive, then burns steadily
    const charge = t < 0 ? E.inCubic(prog(-1.2, 0, t)) : 1;
    if (charge > 0) {
      const br = 0.92 + 0.08 * Math.sin(t * 3.1);
      glow(ctx, 0, 0, 1500 * charge, [150, 190, 255], 0.35 * charge);
      glow(ctx, 0, 0, 620 * charge, [255, 236, 200], 0.7 * charge * br);
      glow(ctx, 0, 0, 260, [255, 255, 255], 0.95 * charge);
      if (on > 0) {
        ctx.fillStyle = radG(ctx, 0, 0, 120, 1500, [[0, [255, 244, 220], 0.28 * on], [1, [255, 244, 220], 0]]);
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU + t * 0.12, w = 0.035 + 0.02 * Math.sin(t + i);
          ctx.moveTo(0, 0); ctx.arc(0, 0, 1500, a - w, a + w); ctx.closePath();
        }
        ctx.fill();
        ctx.lineWidth = lw(10);
        if (ctx.createConicGradient) {
          const g = ctx.createConicGradient(t * 0.6, 0, 0);
          colours[0].forEach((c, i) => g.addColorStop(i / colours[0].length, rgba(c, 0.85 * on)));
          g.addColorStop(1, rgba(colours[0][0], 0.85 * on));
          ctx.strokeStyle = g;
        } else ctx.strokeStyle = rgba([200, 220, 255], 0.8 * on);
        ctx.beginPath(); ctx.arc(0, 0, 172, 0, TAU); ctx.stroke();
      }
      circ(ctx, 0, 0, 96 * (0.4 + 0.6 * charge), rgba([255, 255, 255], charge));
    }
    ctx.restore();
  }

  /* burst over everything: rings through the whole wheel, sparks from the core */
  let SPARKS = null;
  function drawBurst(ctx, t, s) {
    if (t < 0 || t > 2.4) return;
    if (!SPARKS) { SPARKS = []; for (let i = 0; i < 320; i++) SPARKS.push(0, 0); }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (t < 0.7) glow(ctx, 0, 0, 4200 * E.outCubic(t / 0.7), [255, 240, 220], 0.8 * Math.pow(1 - t / 0.7, 2));
    for (const [d, c, w] of [[0, [255, 246, 226], 26], [0.12, [150, 200, 255], 16], [0.26, [255, 200, 120], 10]]) {
      const u = clamp((t - d) / 1.9);
      if (u <= 0 || u >= 1) continue;
      ctx.strokeStyle = rgba(c, 0.8 * Math.pow(1 - u, 1.5));
      ctx.lineWidth = Math.max(w * s * 8 * (1 - u), 1.2) / s;
      ctx.beginPath(); ctx.arc(0, 0, 200 + 4600 * E.outCubic(u), 0, TAU); ctx.stroke();
    }
    ctx.restore();
    drawSparks(ctx, SPARKS, t, { cx: 0, cy: 0, seed: 777, s, speed: 9, hot: '#ffffff', mid: '#bcd7ff', cool: '#ffb45a' });
  }

  /* the unused slot: a slow pulse travels out to it once the network is alive */
  function drawNext(ctx, t, s) {
    if (t < 3) return;
    const a = th(NS - 1), u = ((t - 3) / 2.6) % 1, r = lerp(260, PORT_IN, E.inOutSine(u));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, Math.cos(a) * r, Math.sin(a) * r, 160, [255, 236, 200], 0.8 * Math.sin(Math.PI * u));
    ctx.restore();
  }

  return { init, drawAlive, drawBurst, drawNext, get sheet() { return sheet; } };
})();
