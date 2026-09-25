// Scene toolkit: queued mask building (so loading can report progress), camera, painting
// shorthands, splatters and the petal system shared by the scenes.
(function (WC) {
  'use strict';
  const M = WC.mat, A = WC.A;
  const K = WC.K = {};

  // ---- queued building ------------------------------------------------------------
  class Builder {
    constructor(eng) { this.eng = eng; this.jobs = []; this.M = {}; }
    mask(name, draw, opts = {}) { this.jobs.push(() => { this.M[name] = this.eng.maskAuto(draw, opts); }); }
    box(name, draw, bbox, opts = {}) { this.jobs.push(() => { this.M[name] = this.eng.mask(draw, bbox, opts); }); }
    puppet(name, P, s, opts = {}) {
      const obj = { s }; this.M[name] = obj;
      const area = { x: -3 * s, y: -1.2 * s, w: 6 * s, h: 10.2 * s };
      const ms = opts.maskScale || 1;
      for (const k in P.parts) this.jobs.push(() => { obj[k] = this.eng.maskAuto((g) => P.parts[k].draw(g, s), { area, margin: 20, maskScale: ms }); });
      if (P.fanStates) this.jobs.push(() => { obj.fan = P.fanStates.map((a) => this.eng.maskAuto(P.fanDraw(a), { area, margin: 16, maskScale: ms })); });
    }
  }
  K.Builder = Builder;

  // ---- camera -------------------------------------------------------------------------
  // world -> screen: centre (cx,cy) of the world appears at the frame centre, scaled by zoom.
  K.cam = (zoom = 1, cx = 960, cy = 540, rot = 0) => M.mul(M.tr(960, 540), M.mul(M.trs(0, 0, rot, zoom, zoom), M.tr(-cx, -cy)));

  // painter bound to a camera: W(mask, params, [objectXf])
  K.painter = (eng, cam) => (mask, p, xf) => eng.wash(mask, Object.assign({}, p, { xf: xf ? M.mul(cam, xf) : cam }));

  // ink layer with the camera applied
  K.ink = (eng, cam) => { const g = eng.layer(); g.transform(cam[0], cam[1], cam[2], cam[3], cam[4], cam[5]); return g; };
  K.withXf = (g, m, fn) => { g.save(); g.transform(m[0], m[1], m[2], m[3], m[4], m[5]); fn(); g.restore(); };

  // ---- shapes ----------------------------------------------------------------------
  K.rect = (x, y, w, h) => (g) => { g.fillRect(x, y, w, h); };
  K.frame = (m = 0) => K.rect(-m, -m, 1920 + 2 * m, 1080 + 2 * m);
  K.splat = (seed, cx, cy, rx, ry, n, rmax, rmin = 1.2) => (g) => {
    const r = WC.rng(seed);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.pow(r(), 1.6);
      WC.fillCircle(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, Math.max(rmin, rmax * Math.pow(r(), 2.4)));
    }
  };
  // an ink blot: central blob + satellite droplets + a few streaks
  K.blot = (seed, r) => (g) => {
    const q = WC.rng(seed);
    const pts = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const rr = r * (0.75 + q() * 0.45); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    WC.fillSpline(g, pts, true, 1);
    for (let i = 0; i < 16; i++) { const a = q() * Math.PI * 2, d = r * (1.1 + q() * 1.2); WC.fillCircle(g, Math.cos(a) * d, Math.sin(a) * d, r * (0.04 + q() * 0.12)); }
    for (let i = 0; i < 5; i++) { const a = q() * Math.PI * 2; WC.fillLock(g, Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, Math.cos(a) * r * (1.5 + q()), Math.sin(a) * r * (1.5 + q()), r * 0.18, 0.1, 0.2); }
  };

  // ---- petals ------------------------------------------------------------------------
  // A flight of petals launched at `t0` from `from` toward `to`, colour by `like`.
  // Returns per-petal transforms at time t (world coords) to be painted with the petal mask.
  K.petalFlight = (t, t0, from, to, n, like, seed, opts = {}) => {
    const out = [];
    const dur = opts.dur || 2.6, life = opts.life || 6.5;
    for (let i = 0; i < n; i++) {
      const h = (k) => A.hash(seed * 31 + i * 7 + k);
      const tl = t0 + i * (opts.stagger || 0.09);
      const age = t - tl;
      if (age < 0 || age > life) continue;
      const u = A.out(Math.min(1, age / dur));
      const bend = (opts.arc || -180) * (0.6 + 0.8 * h(1));
      const mx = (from[0] + to[0]) / 2 + (h(2) - 0.5) * 160, my = (from[1] + to[1]) / 2 + bend;
      // quadratic Bezier flight + drift afterwards
      const x = (1 - u) * (1 - u) * from[0] + 2 * (1 - u) * u * mx + u * u * (to[0] + (h(3) - 0.5) * 220);
      let y = (1 - u) * (1 - u) * from[1] + 2 * (1 - u) * u * my + u * u * (to[1] + (h(4) - 0.5) * 160);
      const drift = Math.max(0, age - dur);
      y += drift * 38; const sway = Math.sin(age * (2.2 + h(5)) + h(6) * 6) * (14 + 20 * u);
      const rot = h(7) * 6.28 + age * (1.5 + h(8) * 2) * (h(9) > 0.5 ? 1 : -1);
      const squash = 0.35 + 0.65 * Math.abs(Math.sin(age * (2.5 + h(10) * 2) + h(11) * 3));
      const size = (opts.size || 64) * (0.8 + h(12) * 0.45) / 100;
      const fade = A.smooth(age / 0.25) * A.smooth((life - age) / 1.2);
      const c = Math.cos(rot), s = Math.sin(rot);
      out.push({ xf: [c * size, s * size, -s * size * squash, c * size * squash, x + sway, y], like: typeof like === 'function' ? like(i) : like, alpha: fade, seed: seed * 10 + i });
    }
    return out;
  };
  K.paintPetals = (eng, cam, mask, list, cols = {}) => {
    list.forEach((p) => eng.wash(mask, {
      xf: M.mul(cam, p.xf), pig: p.like ? (cols.rose || '#ec9aab') : (cols.indigo || '#8e9cc4'), density: 0.9, hollow: 0.45, hollowW: 12,
      edge: 1.6, edgeW: 3, soft: 1, warp: 2.5, warpScale: 30, rough: 1.0, roughScale: 5, flow: 0.4, flowScale: 30, gran: 0.4, seed: p.seed, alpha: p.alpha,
    }));
  };
  K.petalMask = (B) => B.box('petal', (g) => { g.fill(WC.figures.petal(new Path2D(), 100, 42)); }, { x: 0, y: -24, w: 100, h: 48 }, { margin: 24, maskScale: 1.5 });


  // ---- v2: painting on the page -------------------------------------------------------
  // progress of a paint-on beat between t0 and t0+dur
  K.pp = (t, t0, dur, fn) => (fn || A.out)(A.ramp(t, t0, t0 + dur));
  // wetness of a wash laid between t0 and t1: wet while painting, then dries
  K.wet = (t, t0, t1, dry = 1.6) => (t < t0 ? 0 : 1 - A.smooth((t - t1) / dry));
  // shared small masks: a soft dot (motes, bokeh), a four-point star (glints)
  K.commonMasks = (B) => {
    B.box('dot', (g) => WC.fillCircle(g, 0, 0, 50), { x: -50, y: -50, w: 100, h: 100 }, { margin: 40, maskScale: 1 });
    B.box('star', (g) => {
      g.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 7 : 50; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.fill();
    }, { x: -50, y: -50, w: 100, h: 100 }, { margin: 30, maskScale: 1.5 });
    K.petalMask(B);
  };
  // drifting motes of light (candle bokeh, dust in a sunbeam, sparks)
  K.motes = (eng, cam, dot, t, o) => {
    const n = o.n || 20;
    for (let i = 0; i < n; i++) {
      const h = (k) => A.hash(i * 17 + k + (o.seed || 0) * 101);
      const life = o.life || 6, ph = h(1) * life;
      const age = ((t + ph) % life), u = age / life;
      const x = o.x + (h(2) - 0.5) * o.w + Math.sin(t * (0.5 + h(3)) + h(4) * 6) * (o.sway || 18) + (o.vx || 0) * age;
      const y = o.y + (h(5) - 0.5) * o.h + (o.vy != null ? o.vy : -24) * age;
      const r = (o.r || 8) * (0.5 + h(6));
      const tw = 0.6 + 0.4 * Math.sin(t * (2 + h(7) * 4) + h(8) * 6);
      const a = Math.sin(Math.PI * u) * tw * (o.alpha != null ? o.alpha : 1);
      if (a <= 0.02) continue;
      eng.light(dot, { xf: WC.mat.mul(cam, [r / 50, 0, 0, r / 50, x, y]), colour: o.colour || '#ffd59a', density: (o.intensity || 0.5) * a, soft: 26, warp: 0, seed: i });
    }
  };
  // a four-point glint that flares and fades
  K.glint = (eng, cam, star, x, y, t, t0, dur, size, colour) => {
    const u = A.ramp(t, t0, t0 + dur); if (u <= 0 || u >= 1) return;
    const k = Math.sin(Math.PI * u), r = size * (0.6 + 0.4 * k) / 50, rot = 0.4 * u;
    const c = Math.cos(rot) * r, s = Math.sin(rot) * r;
    eng.light(star, { xf: WC.mat.mul(cam, [c, s, -s, c, x, y]), colour: colour || '#fff2d0', density: 0.9 * k, soft: 3, warp: 0, seed: 3 });
  };

  // mix two hex colours (as a painter would: multiplicatively, in log space)
  K.mixHex = (a, b, t) => {
    const c = WC.mixPig(a, b, A.clamp(t));
    return '#' + c.map((v) => Math.round(Math.min(1, v) * 255).toString(16).padStart(2, '0')).join('');
  };
  K.mixStyle = (a, b, t) => { const o = {}; for (const k in a) o[k] = b[k] ? K.mixHex(a[k], b[k], t) : a[k]; return o; };

  // ---- text ---------------------------------------------------------------------------
  K.FONT_SCRIPT = "'Pinyon Script', 'PinyonLocal', cursive";
  K.FONT_TITLE = "'IM Fell English', 'FellLocal', Georgia, serif";
  // Draw text revealed left-to-right up to `progress` (0..1) with a soft edge.
  K.writeText = (g, text, x, y, font, progress, align = 'left', colour = '#f00') => {
    if (progress <= 0) return;
    g.save();
    g.font = font; g.textBaseline = 'alphabetic';
    const w = g.measureText(text).width;
    const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const edge = x0 + (w + 40) * progress;
    const grad = g.createLinearGradient(edge - 40, 0, edge, 0);
    const opaque = colour.length === 4 ? colour : colour;
    grad.addColorStop(0, opaque); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = progress >= 1 ? colour : grad;
    g.fillText(text, x0, y);
    g.restore();
    return w;
  };
})(window.WC = window.WC || {});
