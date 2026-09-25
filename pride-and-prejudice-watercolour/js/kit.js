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

  // ---- v3: landscape pieces ------------------------------------------------------------
  // A cumulus cloud: a row of billows on a flat base. (x, y) = middle of the base.
  K.cloud = (g, x, y, w, h, rnd) => {
    const n = 6 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), bump = Math.sin(Math.PI * (0.1 + 0.8 * u));
      const r = h * (0.28 + 0.42 * bump) * (0.8 + 0.4 * rnd());
      WC.fillCircle(g, x - w / 2 + w * u, y - r * 0.55 - h * 0.1 * bump, r);
    }
    WC.fillEllipse(g, x, y - h * 0.08, w * 0.56, h * 0.16, 0);
  };
  // A hedgerow along a line: a ragged band of bushes, with the odd tree standing out of it.
  K.hedge = (g, pts, r, rnd, trees = 0) => {
    const q = WC.sampleSpline(pts, false, 1, 24);
    g.save(); g.strokeStyle = g.fillStyle; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = r * 1.1;
    g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x, y - r * 0.4) : g.moveTo(x, y - r * 0.4))); g.stroke(); g.restore();
    let acc = 0, next = r * (0.3 + rnd());
    for (let i = 1; i < q.length; i++) {
      acc += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
      if (acc < next) continue;
      acc = 0; next = r * (0.3 + 1.4 * rnd());
      const rr = r * (0.45 + 0.75 * rnd() * rnd() + 0.3 * rnd());
      WC.fillCircle(g, q[i][0] + (rnd() - 0.5) * r, q[i][1] - rr * 0.7, rr);
      if (rnd() < trees) {
        const th = r * (2.2 + 2.5 * rnd()), x = q[i][0];
        WC.fillLock(g, x, q[i][1], x + (rnd() - 0.5) * r * 0.6, q[i][1] - th, r * 0.28, 0.1, 0.6);
        const n = 7 + Math.floor(rnd() * 5);
        for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * 1.4; WC.fillCircle(g, x + Math.cos(a) * d * 1.2, q[i][1] - th - r * 0.4 + Math.sin(a) * d * 0.8, r * (0.45 + 0.5 * rnd())); }
      }
    }
  };
  // Grass in tufts rooted along a band (one sway band): x0..x1 at root line y, heights h0..h1.
  K.grass = (g, x0, x1, y, n, h0, h1, rnd, lean = 0.3, skip = null) => {
    g.lineCap = 'round';
    const tufts = Math.max(1, Math.round(n / 7));
    for (let k = 0; k < tufts; k++) {
      const cx = x0 + rnd() * (x1 - x0), cy = y + (rnd() - 0.5) * 18, size = 0.4 + rnd() * rnd() * 1.4;
      if (skip && skip(cx, cy)) continue;
      const blades = 3 + Math.floor(rnd() * 8);
      for (let i = 0; i < blades; i++) {
        const x = cx + (rnd() - 0.5) * 22 * size, h = (h0 + rnd() * (h1 - h0)) * size;
        g.lineWidth = 1.2 + rnd() * 1.8;
        const tip = x + h * lean * (rnd() - 0.3) + (x - cx) * 0.6;
        g.beginPath(); g.moveTo(x, cy); g.quadraticCurveTo(x + (tip - x) * 0.2, cy - h * 0.6, tip, cy - h); g.stroke();
      }
    }
  };
  // Birds as ink ticks, wings beating: list of [x, y, size, phase]
  K.birds = (g, list, t) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    list.forEach(([x, y, sz, ph]) => {
      const f = Math.sin(t * 9 + ph) * sz * 0.45;
      g.lineWidth = Math.max(1, sz * 0.14);
      g.beginPath(); g.moveTo(x - sz, y - f); g.quadraticCurveTo(x - sz * 0.35, y - sz * 0.35, x, y); g.quadraticCurveTo(x + sz * 0.35, y - sz * 0.35, x + sz, y - f); g.stroke();
    });
  };

  // Draw `shape`, keeping only the part inside `clip` (both draw functions on the same context).
  K.clipTo = (g, shape, clip) => {
    shape(g);
    const cv = K._clipCanvas || (K._clipCanvas = document.createElement('canvas'));
    if (cv.width !== g.canvas.width || cv.height !== g.canvas.height) { cv.width = g.canvas.width; cv.height = g.canvas.height; }
    const c2 = cv.getContext('2d');
    c2.setTransform(1, 0, 0, 1, 0, 0); c2.globalCompositeOperation = 'source-over'; c2.clearRect(0, 0, cv.width, cv.height);
    c2.setTransform(g.getTransform()); c2.fillStyle = c2.strokeStyle = '#fff'; clip(c2);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(cv, 0, 0); g.restore();
  };

  // mix two hex colours (as a painter would: multiplicatively, in log space)
  K.mixHex = (a, b, t) => {
    const c = WC.mixPig(a, b, A.clamp(t));
    return '#' + c.map((v) => Math.round(Math.min(1, v) * 255).toString(16).padStart(2, '0')).join('');
  };

  // Handwriting written along a moving path and then carried off by the wind.
  // path(d) -> [x, y] at distance d along it. `written` = how much of the line the pen has
  // written (px, from the start); `drift` = how far the whole line has blown along the path.
  // Letters fade out once they are further than `fadeAt` along it.
  K.textStream = (g, text, path, font, written, drift, colour, fadeAt = 1e9, fadeLen = 300, alpha = 1) => {
    g.save(); g.font = font; g.fillStyle = colour; g.textBaseline = 'middle';
    let off = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], w = g.measureText(ch).width, mid = off + w / 2;
      off += w;
      if (mid > written) break;
      const d = mid + drift;
      g.globalAlpha = alpha * A.clamp((written - mid) / 24) * A.clamp(1 - (d - fadeAt) / fadeLen);
      if (g.globalAlpha <= 0.01 || ch === ' ') continue;
      const [x0, y0] = path(d - 2), [x1, y1] = path(d + 2);
      g.save(); g.translate((x0 + x1) / 2, (y0 + y1) / 2); g.rotate(Math.atan2(y1 - y0, x1 - x0)); g.fillText(ch, -w / 2, 0); g.restore();
    }
    g.restore();
    return off;
  };

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
