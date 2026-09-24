/* Effects: bursts, particles, overlays, text slams. Deterministic in time. */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, circle, ellipse, fs, rrect, hash, glow } = RV;
  const OUT = RV.OUT;
  const W = RV.W, H = RV.H;

  RV.PALETTE = ['#ff4fa3', '#ffd23f', '#4cc9f0', '#06d6a0', '#b388eb', '#ff9f1c', '#ef476f'];

  RV.sunburst = function (ctx, cx, cy, t, o = {}) {
    const n = o.n || 18;
    const cols = o.colors || ['#ffd23f', '#ff9f1c'];
    const R = o.r || 2600;
    const rot = (o.rot || 0) + t * (o.speed == null ? 0.25 : o.speed);
    for (let i = 0; i < n; i++) {
      const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 0.5) / n) * TAU;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
      ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
      ctx.closePath();
      ctx.fillStyle = cols[i % cols.length];
      ctx.fill();
    }
  };

  RV.radialBg = function (ctx, c0, c1, cx = W / 2, cy = H / 2, r = 1200) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.fillRect(-W, -H, W * 3, H * 3);
  };

  // confetti: burst from (x,y) at time t0, or rain (o.rain) across the screen
  RV.confetti = function (ctx, t, o = {}) {
    const n = o.n || 80;
    const cols = o.colors || RV.PALETTE;
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 1.31 + (o.seed || 0)), h2 = hash(i * 2.77 + (o.seed || 0)), h3 = hash(i * 5.13 + (o.seed || 0));
      let x, y, a;
      if (o.rain) {
        const sp = 140 + h2 * 160;
        x = h1 * (W + 200) - 100 + Math.sin(t * 2 + i) * 30;
        y = ((h3 * (H + 200) + t * sp) % (H + 200)) - 100;
        a = 1;
      } else {
        const lt = t - (o.t0 || 0);
        if (lt < 0) continue;
        const ang = (o.angle != null ? o.angle : -Math.PI / 2) + (h1 - 0.5) * (o.spread || 2.4);
        const v = 500 + h2 * 900;
        x = (o.x || W / 2) + Math.cos(ang) * v * lt;
        y = (o.y || H / 2) + Math.sin(ang) * v * lt + 700 * lt * lt;
        a = clamp(1 - lt / (o.life || 2.2));
        if (a <= 0) continue;
      }
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(x, y);
      ctx.rotate(t * (3 + h3 * 6) + i);
      ctx.scale(1, Math.cos(t * (4 + h1 * 5) + i));
      ctx.fillStyle = cols[i % cols.length];
      if (i % 3 === 0) { circle(ctx, 0, 0, 7 * (o.size || 1)); ctx.fill(); }
      else ctx.fillRect(-9 * (o.size || 1), -5 * (o.size || 1), 18 * (o.size || 1), 10 * (o.size || 1));
      ctx.restore();
    }
  };

  RV.sparkleField = function (ctx, t, o = {}) {
    const n = o.n || 30;
    for (let i = 0; i < n; i++) {
      const x = (o.x0 || 0) + hash(i * 1.9 + (o.seed || 0)) * ((o.x1 || W) - (o.x0 || 0));
      const y = (o.y0 || 0) + hash(i * 3.7 + (o.seed || 0)) * ((o.y1 || H) - (o.y0 || 0));
      const ph = RV.fract(t * (o.speed || 0.8) + hash(i * 5.5));
      const s = Math.sin(ph * Math.PI);
      RV.sparkle(ctx, x, y, (o.size || 22) * s, o.color || '#ffffff', s);
    }
  };

  RV.speedLines = function (ctx, t, cx, cy, o = {}) {
    const n = o.n || 60;
    ctx.save();
    ctx.strokeStyle = o.color || 'rgba(255,255,255,0.8)';
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = hash(i * 2.1) * TAU;
      const z = RV.fract(hash(i * 4.3) + t * (o.speed || 2));
      const r0 = (o.r0 || 250) + z * 1400, r1 = r0 + 80 + z * 220;
      ctx.globalAlpha = (o.alpha || 0.7) * Math.sin(z * Math.PI);
      ctx.lineWidth = 3 + z * 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
  };

  RV.hSpeedLines = function (ctx, t, o = {}) {
    ctx.save();
    ctx.strokeStyle = o.color || 'rgba(255,255,255,0.6)';
    ctx.lineCap = 'round';
    for (let i = 0; i < (o.n || 30); i++) {
      const y = hash(i * 3.3) * H;
      const len = 150 + hash(i * 1.7) * 400;
      const x = W + 300 - RV.fract(hash(i * 7.1) + t * (o.speed || 1.6)) * (W + 900);
      ctx.lineWidth = 3 + hash(i) * 6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    ctx.restore();
  };

  RV.flash = function (ctx, a, color = '#ffffff') {
    if (a <= 0.001) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = clamp(a);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  };

  RV.vignette = function (ctx, a = 0.5, color = '0,0,0') {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0);
    g.addColorStop(0, `rgba(${color},0)`);
    g.addColorStop(1, `rgba(${color},${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };

  // 70s film look: warm tint, grain speckles, light leak
  RV.retroFilm = function (ctx, t, a = 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(255,214,160,${0.35 * a})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const fr = Math.floor(t * 24);
    ctx.fillStyle = `rgba(60,30,10,${0.35 * a})`;
    for (let i = 0; i < 60; i++) {
      const x = hash(fr * 13.1 + i * 7.7) * W, y = hash(fr * 3.7 + i * 1.3) * H;
      ctx.fillRect(x, y, 2 + hash(i + fr) * 3, 2);
    }
    if (hash(fr * 0.37) > 0.7) {
      ctx.fillStyle = `rgba(40,20,10,${0.25 * a})`;
      ctx.fillRect(hash(fr) * W, 0, 2, H);
    }
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, W * 0.95, H * 0.1, 500, '#ff7b00', 0.18 * a);
    ctx.restore();
  };

  // big comic text slam with a starburst behind it; lt = time since the slam
  RV.slam = function (ctx, text, x, y, size, lt, o = {}) {
    if (lt < 0) return;
    const dur = o.dur || 1.2;
    const out = o.hold ? 1 : clamp((dur - lt) / 0.25);
    if (out <= 0) return;
    const s = RV.ease.outBack(clamp(lt / 0.22), 2.6) * (1 + RV.wobble(lt - 0.22, 2.5, 5) * 0.04);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((o.rot || 0) + Math.sin(lt * 3) * 0.02);
    ctx.scale(s * out, s * out);
    if (o.burst !== false) {
      const n = 14;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const r = (i % 2 ? 0.55 : 1) * size * (o.burstR || 1.6) * (1 + 0.05 * Math.sin(lt * 10 + i));
        const a = (i / (n * 2)) * TAU + lt * 0.4;
        const px = Math.cos(a) * r * (o.burstW || 1.9), py = Math.sin(a) * r;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath();
      fs(ctx, o.burstC || '#ffffff', 6);
    }
    RV.bigText(ctx, text, 0, 0, size, { fill: o.fill || '#ffd23f', gradient: o.gradient, stroke: o.stroke, font: o.font, shine: true });
    ctx.restore();
  };

  // fireworks: bursts = [[t0, x, y, color], ...]
  RV.fireworks = function (ctx, t, bursts) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    bursts.forEach(([t0, x, y, col], k) => {
      const lt = t - t0;
      if (lt < -0.6 || lt > 2.2) return;
      if (lt < 0) {
        // rising trail
        const p = 1 + lt / 0.6;
        const yy = lerp(H + 50, y, RV.ease.outQuad(p));
        glow(ctx, x, yy, 30, col, 0.9);
        return;
      }
      const n = 26;
      const a = clamp(1 - lt / 2.0);
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + k;
        const v = 320 * (0.8 + 0.2 * hash(i + k * 9));
        const px = x + Math.cos(ang) * v * RV.ease.outCubic(clamp(lt / 1.2)) ;
        const py = y + Math.sin(ang) * v * RV.ease.outCubic(clamp(lt / 1.2)) + 90 * lt * lt;
        glow(ctx, px, py, 22, col, a);
        circle(ctx, px, py, 4 * a); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      glow(ctx, x, y, 200 * (1 - clamp(lt * 2)), '#ffffff', 0.6 * (1 - clamp(lt * 3)));
    });
    ctx.restore();
  };

  RV.musicNotes = function (ctx, t, x, y, o = {}) {
    const n = o.n || 6;
    for (let i = 0; i < n; i++) {
      const ph = RV.fract(t * 0.6 + i / n);
      const px = x + Math.sin(ph * 6 + i) * 50 + (i - n / 2) * 30, py = y - ph * (o.rise || 300);
      const a = Math.sin(ph * Math.PI);
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(px, py); ctx.rotate(Math.sin(t * 3 + i) * 0.3);
      ctx.fillStyle = o.color || RV.PALETTE[i % RV.PALETTE.length];
      ellipse(ctx, 0, 0, 16, 12, -0.4); fs(ctx, ctx.fillStyle, 3);
      ctx.fillRect(12, -52, 7, 52); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.strokeRect(12, -52, 7, 52);
      if (i % 2) { ctx.fillRect(12, -52, 26, 9); ctx.strokeRect(12, -52, 26, 9); }
      ctx.restore();
    }
  };

  RV.hearts = function (ctx, t, x, y, o = {}) {
    const n = o.n || 8;
    for (let i = 0; i < n; i++) {
      const ph = RV.fract(t * (o.speed || 0.45) + i / n);
      const px = x + Math.sin(ph * 5 + i * 2) * (o.spread || 120) + (hash(i) - 0.5) * (o.spread || 120) * 2;
      const py = y - ph * (o.rise || 420);
      const a = Math.sin(ph * Math.PI);
      ctx.save(); ctx.globalAlpha *= a;
      RV.heart(ctx, px, py, 26 + 10 * hash(i * 3));
      fs(ctx, i % 2 ? '#ff4d6d' : '#ff8fab', 4);
      ctx.restore();
    }
  };

  RV.dizzy = function (ctx, x, y, r, t) {
    for (let i = 0; i < 4; i++) {
      const a = t * 4 + (i / 4) * TAU;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.35;
      RV.star(ctx, px, py, 16, 7, 5, t * 3 + i);
      fs(ctx, '#ffd23f', 3);
    }
  };

  RV.dust = function (ctx, x, y, lt, o = {}) {
    if (lt < 0 || lt > (o.life || 1.2)) return;
    const n = o.n || 12;
    const a = 1 - lt / (o.life || 1.2);
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      const v = 200 + hash(i * 3.3) * 360;
      const px = x + dir * v * RV.ease.outCubic(lt) * (0.5 + hash(i)), py = y - 40 * hash(i * 7) - lt * 60 * hash(i * 2);
      const r = (30 + hash(i * 1.7) * 40) * (0.6 + lt);
      ctx.save(); ctx.globalAlpha *= a * 0.9;
      circle(ctx, px, py, r); fs(ctx, o.color || '#e9dcc9', 4);
      ctx.restore();
    }
  };

  RV.bubbles = function (ctx, t, o = {}) {
    const n = o.n || 40;
    for (let i = 0; i < n; i++) {
      const r = 14 + hash(i * 2.2) * 40;
      const x = hash(i * 5.1) * W + Math.sin(t * 1.3 + i) * 40;
      const y = H + 100 - RV.fract(hash(i * 1.9) + t * (0.12 + hash(i) * 0.1)) * (H + 300);
      circle(ctx, x, y, r);
      ctx.fillStyle = 'rgba(190,240,255,0.18)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, Math.PI, Math.PI * 1.5); ctx.stroke();
    }
  };

  RV.halftone = function (ctx, x, y, w, h, dot, bg, step = 26) {
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = dot;
    for (let yy = y; yy < y + h + step; yy += step) {
      for (let xx = x + ((yy / step) % 2) * step / 2; xx < x + w + step; xx += step) {
        const d = Math.hypot(xx - (x + w / 2), yy - (y + h / 2)) / Math.hypot(w, h);
        circle(ctx, xx, yy, step * (0.45 - d * 0.5)); ctx.fill();
      }
    }
  };

  RV.stripes70s = function (ctx, t, o = {}) {
    const cols = o.colors || ['#6f1d1b', '#bb3e03', '#ca6702', '#ee9b00', '#e9d8a6'];
    const cx = o.cx || W / 2, cy = o.cy || H + 200;
    for (let i = cols.length * 3; i >= 0; i--) {
      const r = 180 + i * 130 + ((t * 120) % 130);
      circle(ctx, cx, cy, r);
      ctx.fillStyle = cols[i % cols.length]; ctx.fill();
    }
  };

  RV.questionMarks = function (ctx, t, x, y, lt) {
    for (let i = 0; i < 3; i++) {
      const p = RV.pop(lt - i * 0.18);
      if (p <= 0) continue;
      const px = x + (i - 1) * 90, py = y - i % 2 * 50 - Math.sin(t * 4 + i) * 10;
      ctx.save(); ctx.translate(px, py); ctx.scale(p, p); ctx.rotate((i - 1) * 0.25);
      RV.bigText(ctx, '?', 0, 0, 110, { fill: ['#4cc9f0', '#ffd23f', '#ff4fa3'][i] });
      ctx.restore();
    }
  };

  // stylised "ground shadow" under characters
  RV.shadow = function (ctx, x, y, w, a = 0.25) {
    ellipse(ctx, x, y, w, w * 0.18);
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.fill();
  };

  // screen-space overlays helper: draws fn without the camera transform
  RV.screen = function (ctx, fn) {
    ctx.save();
    const m = RV._baseTransform;
    if (m) ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    fn(ctx);
    ctx.restore();
  };
})(globalThis.RV);
