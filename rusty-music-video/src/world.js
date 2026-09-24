/* World: backgrounds, sets and props. All in 1920x1080 design space. */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ellipse, circle, fs, rrect, curve, hash, glow } = RV;
  const OUT = RV.OUT;
  const W = RV.W, H = RV.H;

  // ---------------------------------------------------------------- skies
  RV.skyGradient = function (ctx, stops, x0 = 0, y0 = 0, x1 = 0, y1 = H) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(-W, -H, W * 3, H * 3);
  };

  RV.stars = function (ctx, t, o = {}) {
    const n = o.n || 160, seed = o.seed || 1;
    const x0 = o.x0 != null ? o.x0 : -200, x1 = o.x1 != null ? o.x1 : W + 200;
    const y0 = o.y0 != null ? o.y0 : -100, y1 = o.y1 != null ? o.y1 : H * 0.75;
    const drift = o.drift || 0;
    for (let i = 0; i < n; i++) {
      const hx = hash(i * 1.37 + seed * 11.1), hy = hash(i * 7.91 + seed * 3.3), hs = hash(i * 3.17 + seed);
      let x = x0 + hx * (x1 - x0) - drift * t * (0.3 + hs);
      const span = x1 - x0;
      x = x0 + ((((x - x0) % span) + span) % span);
      const y = y0 + hy * (y1 - y0);
      const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + hs * 3) + i);
      const r = (0.8 + hs * 2.2) * (o.size || 1);
      ctx.globalAlpha = tw * (o.alpha == null ? 1 : o.alpha);
      if (hs > 0.9) RV.sparkle(ctx, x, y, r * 3.2 * tw, o.color || '#fffbe6');
      else { circle(ctx, x, y, r); ctx.fillStyle = o.color || '#fffbe6'; ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  };

  RV.moon = function (ctx, x, y, r, o = {}) {
    glow(ctx, x, y, r * 3, o.glowC || '#fff4c2', 0.35);
    circle(ctx, x, y, r);
    fs(ctx, o.color || '#fff4cf', o.lw || 0);
    ctx.fillStyle = 'rgba(220,200,150,0.5)';
    [[-0.3, -0.2, 0.18], [0.25, 0.15, 0.13], [-0.05, 0.4, 0.1], [0.35, -0.35, 0.08]].forEach(([dx, dy, rr]) => {
      circle(ctx, x + dx * r, y + dy * r, rr * r); ctx.fill();
    });
    if (o.face) {
      ctx.fillStyle = '#b89d63';
      circle(ctx, x - r * 0.3, y - r * 0.05, r * 0.07); ctx.fill();
      circle(ctx, x + r * 0.3, y - r * 0.05, r * 0.07); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.3, 0.3, Math.PI - 0.3);
      ctx.lineWidth = r * 0.05; ctx.strokeStyle = '#b89d63'; ctx.stroke();
    }
  };

  RV.cloud = function (ctx, x, y, s, color = '#ffffff', alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    [[0, 0, 60], [55, 10, 48], [-55, 12, 44], [25, -30, 46], [-25, -22, 40]].forEach(([dx, dy, r]) => {
      circle(ctx, x + dx * s, y + dy * s, r * s); ctx.fill();
    });
    ctx.restore();
  };

  // ---------------------------------------------------------------- neighbourhood at night
  const HOUSE_COLS = ['#e76f51', '#2a9d8f', '#e9c46a', '#8ecae6', '#b388eb', '#f4a261', '#90be6d', '#f28482'];
  RV.house = function (ctx, x, y, w, h, o = {}) {
    const col = o.color || '#e76f51';
    const dark = o.night ? RV.mix(col, '#1a1b3a', 0.55) : col;
    // body
    rrect(ctx, x - w / 2, y - h, w, h, 6);
    fs(ctx, dark, 4);
    // roof
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 22, y - h + 6);
    ctx.lineTo(x, y - h - w * 0.45);
    ctx.lineTo(x + w / 2 + 22, y - h + 6);
    ctx.closePath();
    fs(ctx, o.night ? '#3b2f4a' : '#6d4c41', 4);
    // chimney
    rrect(ctx, x + w * 0.22, y - h - w * 0.36, 24, 46, 3);
    fs(ctx, o.night ? '#4a3d57' : '#8d6e63', 4);
    // windows
    const lit = o.lit || [1, 1, 0];
    const wins = [[-w * 0.28, -h * 0.62], [w * 0.28, -h * 0.62], [-w * 0.28, -h * 0.3]];
    wins.forEach(([dx, dy], i) => {
      const on = lit[i % lit.length];
      rrect(ctx, x + dx - 20, y + dy - 18, 40, 36, 4);
      fs(ctx, on ? '#ffe28a' : '#2d3350', 3.5);
      if (on && o.night) glow(ctx, x + dx, y + dy, 70, '#ffd36b', 0.28);
      ctx.beginPath(); ctx.moveTo(x + dx, y + dy - 18); ctx.lineTo(x + dx, y + dy + 18);
      ctx.moveTo(x + dx - 20, y + dy); ctx.lineTo(x + dx + 20, y + dy);
      ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
    });
    // door
    rrect(ctx, x + w * 0.12, y - h * 0.42, w * 0.26, h * 0.42, 5);
    fs(ctx, o.night ? '#5b3b2e' : '#8d5a3b', 4);
    circle(ctx, x + w * 0.33, y - h * 0.2, 3.5); fs(ctx, '#ffd23f');
  };

  RV.tree = function (ctx, x, y, s, o = {}) {
    const night = o.night;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    rrect(ctx, -12, -90, 24, 92, 8); fs(ctx, night ? '#4a3527' : '#7b5436', 4);
    const c1 = night ? '#1f5a4a' : '#4caf50', c2 = night ? '#2b7560' : '#6cc56b';
    const sway = Math.sin((o.t || 0) * 1.3 + x) * 3;
    [[0, -150, 62], [-44, -118, 46], [44, -116, 48], [0, -200, 44]].forEach(([dx, dy, r], i) => {
      circle(ctx, dx + sway * (i === 3 ? 1.5 : 1), dy, r); fs(ctx, i % 2 ? c2 : c1, 4);
    });
    ctx.restore();
  };

  RV.streetLamp = function (ctx, x, y, s = 1, on = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    rrect(ctx, -6, -300, 12, 300, 5); fs(ctx, '#39405e', 4);
    ctx.beginPath(); ctx.moveTo(0, -300); ctx.quadraticCurveTo(0, -330, 40, -330); ctx.lineWidth = 10; ctx.strokeStyle = '#39405e'; ctx.stroke();
    rrect(ctx, 22, -334, 42, 20, 6); fs(ctx, '#39405e', 4);
    if (on) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, -315, 0, 0);
      g.addColorStop(0, 'rgba(255,220,130,0.35)'); g.addColorStop(1, 'rgba(255,220,130,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(30, -316); ctx.lineTo(56, -316); ctx.lineTo(140, 0); ctx.lineTo(-54, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
      glow(ctx, 43, -316, 50, '#ffe29a', 0.8);
    }
    ctx.restore();
  };

  RV.fence = function (ctx, x0, x1, y, h, color = '#f1e3c8', lw = 3.5) {
    ctx.fillStyle = color;
    for (let x = x0; x < x1; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.lineTo(x + 11, y - h - 12); ctx.lineTo(x + 22, y - h); ctx.lineTo(x + 22, y);
      ctx.closePath();
      fs(ctx, color, lw);
    }
    rrect(ctx, x0 - 6, y - h * 0.75, x1 - x0 + 12, 12, 3); fs(ctx, color, lw);
    rrect(ctx, x0 - 6, y - h * 0.3, x1 - x0 + 12, 12, 3); fs(ctx, color, lw);
  };

  // street scene; scroll moves the world left
  RV.neighbourhood = function (ctx, t, scroll = 0, o = {}) {
    RV.skyGradient(ctx, ['#0b1030', '#1d2560', '#3b3f8f', '#6a5aa8']);
    RV.stars(ctx, t, { n: 140, y1: 520 });
    RV.moon(ctx, 1500 - scroll * 0.05, 190, 70, { face: o.moonFace });
    // far hills
    ctx.fillStyle = '#23285a';
    RV.curve(ctx, [[-100, 700], [300, 560], [700, 640], [1100, 560], [1500, 630], [2000, 560], [2100, 1100], [-100, 1100]], true, 0.6);
    ctx.fill();
    // far houses (parallax 0.3)
    for (let i = -2; i < 12; i++) {
      const x = i * 260 - ((scroll * 0.3) % 260);
      const k = ((i + Math.floor(scroll * 0.3 / 260)) % 8 + 8) % 8;
      ctx.save(); ctx.globalAlpha = 0.9;
      RV.house(ctx, x, 700, 150, 110, { color: HOUSE_COLS[k], night: true, lit: [hash(k) > 0.4 ? 1 : 0, 1, 0] });
      ctx.restore();
    }
    // near houses (parallax 1)
    const gap = 520;
    for (let i = -1; i < 6; i++) {
      const base = Math.floor(scroll / gap);
      const idx = i + base;
      const x = idx * gap - scroll + 200;
      const k = ((idx * 3) % 8 + 8) % 8;
      RV.tree(ctx, x - 190, 860, 1.05, { night: true, t });
      RV.house(ctx, x + 60, 860, 280, 230, { color: HOUSE_COLS[k], night: true, lit: [1, hash(idx) > 0.5 ? 1 : 0, 1] });
      RV.streetLamp(ctx, x + 300, 880, 1, 1);
    }
    // footpath + road
    ctx.fillStyle = '#4a4e7a'; ctx.fillRect(-100, 860, W + 200, 80);
    ctx.fillStyle = '#2b2e52'; ctx.fillRect(-100, 940, W + 200, 200);
    ctx.fillStyle = '#e9e3a8';
    for (let x = -((scroll * 1.2) % 200) - 100; x < W + 100; x += 200) { rrect(ctx, x, 1000, 110, 14, 7); ctx.fill(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-100, 860); ctx.lineTo(W + 100, 860); ctx.moveTo(-100, 940); ctx.lineTo(W + 100, 940); ctx.stroke();
  };

  // ---------------------------------------------------------------- field at night
  RV.field = function (ctx, t, o = {}) {
    RV.skyGradient(ctx, o.sky || ['#0a0f2e', '#1b2a6b', '#355c9c', '#6f8fc4']);
    RV.stars(ctx, t, { n: 170, y1: 560, seed: 4 });
    if (o.moon !== false) RV.moon(ctx, o.moonX || 360, o.moonY || 200, 80);
    // distant town lights
    ctx.fillStyle = '#1b2350';
    RV.curve(ctx, [[-100, 640], [500, 590], [1000, 620], [1500, 580], [2100, 620], [2100, 1100], [-100, 1100]], true, 0.6);
    ctx.fill();
    for (let i = 0; i < 40; i++) {
      const x = hash(i * 2.3) * W, y = 600 + hash(i * 5.1) * 30;
      circle(ctx, x, y, 2.5); ctx.fillStyle = hash(i) > 0.5 ? '#ffd36b' : '#ffeebd'; ctx.fill();
    }
    // rolling hills
    ctx.fillStyle = '#1f4d3f';
    RV.curve(ctx, [[-100, 740], [300, 660], [800, 720], [1300, 650], [1800, 700], [2100, 680], [2100, 1100], [-100, 1100]], true, 0.6);
    fs(ctx, '#1f4d3f', 4);
    ctx.fillStyle = '#2d6a4f';
    RV.curve(ctx, [[-100, 860], [400, 800], [900, 830], [1400, 790], [2100, 840], [2100, 1100], [-100, 1100]], true, 0.6);
    fs(ctx, '#2d6a4f', 4);
    // grass tufts
    ctx.strokeStyle = '#3f8a66'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = hash(i * 9.1) * W * 1.1 - 50, y = 870 + hash(i * 4.4) * 200;
      const sw = Math.sin(t * 2 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4, y - 14, x - 8 + sw, y - 24);
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - 16, x + 4 + sw, y - 28);
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 12, x + 14 + sw, y - 20);
      ctx.stroke();
    }
    // fireflies
    for (let i = 0; i < 18; i++) {
      const x = hash(i * 3.3) * W + Math.sin(t * 0.7 + i) * 40, y = 700 + hash(i * 1.9) * 260 + Math.cos(t * 0.9 + i * 2) * 20;
      const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.3);
      glow(ctx, x, y, 16, '#d9ff7a', a * 0.8);
    }
  };

  // ---------------------------------------------------------------- the spacetime machine (exterior)
  /* origin: bottom centre. o: s, door (0..1 open), glow (0..1), porthole (0..1 light), rusty (face in porthole fn),
     t, shake, label (bool), tilt */
  RV.drawBox = function (ctx, x, y, o = {}) {
    const t = o.t || 0;
    const s = o.s || 1;
    ctx.save();
    ctx.translate(x + (o.shake ? RV.noise(t * 30, 5) * o.shake : 0), y + (o.shake ? RV.noise(t * 30, 6) * o.shake * 0.5 : 0));
    ctx.rotate(o.tilt || 0);
    ctx.scale(s, s);
    const bw = 300, bh = 440;
    const gl = o.glow == null ? 0.6 : o.glow;
    if (gl > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 0, -bh * 0.5, 460, '#4cc9f0', 0.45 * gl);
      glow(ctx, 0, -bh * 0.5, 260, '#b5f0ff', 0.25 * gl);
      ctx.restore();
    }
    // legs
    [-1, 1].forEach((sd) => {
      ctx.beginPath(); ctx.moveTo(sd * 100, -20); ctx.lineTo(sd * 130, 0); ctx.lineWidth = 16; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = 9; ctx.strokeStyle = '#8795a8'; ctx.stroke();
      ellipse(ctx, sd * 132, 0, 24, 8); fs(ctx, '#5f6c80', 4);
    });
    // fins
    [-1, 1].forEach((sd) => {
      ctx.beginPath();
      ctx.moveTo(sd * bw * 0.5, -150); ctx.lineTo(sd * (bw * 0.5 + 60), -40); ctx.lineTo(sd * (bw * 0.5 + 56), -10); ctx.lineTo(sd * bw * 0.5, -40);
      ctx.closePath();
      fs(ctx, '#e63946', 5);
    });
    // antenna + bulb
    ctx.beginPath(); ctx.moveTo(0, -bh - 40); ctx.lineTo(0, -bh - 110); ctx.lineWidth = 12; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = '#b8c4d4'; ctx.stroke();
    const blink = (Math.sin(t * 6) > 0 ? 1 : 0.35);
    circle(ctx, 0, -bh - 118, 16); fs(ctx, blink > 0.5 ? '#ff4d4d' : '#9b2c2c', 4.5);
    if (blink > 0.5) glow(ctx, 0, -bh - 118, 60, '#ff6b6b', 0.7);
    // dome cap
    ctx.beginPath();
    ctx.moveTo(-bw * 0.42, -bh + 4);
    ctx.bezierCurveTo(-bw * 0.4, -bh - 70, bw * 0.4, -bh - 70, bw * 0.42, -bh + 4);
    ctx.closePath();
    fs(ctx, '#9fb0c6', 5);
    // body
    const g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    g.addColorStop(0, '#7d8ea6'); g.addColorStop(0.35, '#c9d6e6'); g.addColorStop(0.6, '#aebdd1'); g.addColorStop(1, '#6c7c93');
    rrect(ctx, -bw / 2, -bh, bw, bh - 18, 26);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    // seams + rivets
    ctx.strokeStyle = 'rgba(40,50,70,0.45)'; ctx.lineWidth = 3;
    [-bh * 0.72, -bh * 0.18].forEach((yy) => { ctx.beginPath(); ctx.moveTo(-bw / 2 + 6, yy); ctx.lineTo(bw / 2 - 6, yy); ctx.stroke(); });
    ctx.fillStyle = '#e9eef6';
    for (let i = 0; i < 9; i++) {
      [-bh * 0.72, -bh * 0.18].forEach((yy) => { circle(ctx, -bw / 2 + 20 + i * ((bw - 40) / 8), yy + 10, 3.2); ctx.fill(); });
    }
    // side gauges
    [-1, 1].forEach((sd) => {
      circle(ctx, sd * 118, -bh * 0.45, 17); fs(ctx, '#f7f3e8', 4);
      ctx.save(); ctx.translate(sd * 118, -bh * 0.45); ctx.rotate(Math.sin(t * 2 + sd) * 1.2);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -12); ctx.lineWidth = 3; ctx.strokeStyle = '#e63946'; ctx.stroke();
      ctx.restore();
      for (let k = 0; k < 3; k++) {
        const on = Math.sin(t * 5 + k * 2 + sd) > 0;
        circle(ctx, sd * 118, -bh * 0.32 + k * 22, 6);
        fs(ctx, on ? ['#ffd23f', '#06d6a0', '#ff6b6b'][k] : '#40485a', 3);
      }
    });
    // door (opens by swinging toward the viewer's right)
    const dw = 170, dh = 300, dx = -dw / 2, dy = -dh - 30;
    const open = clamp(o.door || 0);
    // doorway light
    rrect(ctx, dx, dy, dw, dh, 16);
    const inner = ctx.createLinearGradient(0, dy, 0, dy + dh);
    inner.addColorStop(0, '#fff7d6'); inner.addColorStop(1, '#ffd166');
    ctx.fillStyle = open > 0.02 ? inner : '#4a566b'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    if (open > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createRadialGradient(0, dy + dh * 0.6, 10, 0, dy + dh * 0.6, 420);
      lg.addColorStop(0, `rgba(255,230,160,${0.5 * open})`); lg.addColorStop(1, 'rgba(255,230,160,0)');
      ctx.fillStyle = lg; ctx.fillRect(-500, dy - 200, 1000, 800);
      ctx.restore();
    }
    if (o.inDoor) o.inDoor(ctx, 0, dy + dh);
    // door leaf
    const leafW = dw * (1 - open * 0.85);
    const leafX = open > 0 ? dx + dw - leafW + open * 30 : dx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leafX, dy + (open * 10));
    ctx.lineTo(leafX + leafW, dy - open * 16);
    ctx.lineTo(leafX + leafW, dy + dh + open * 16);
    ctx.lineTo(leafX, dy + dh - open * 10);
    ctx.closePath();
    const dg = ctx.createLinearGradient(leafX, 0, leafX + leafW, 0);
    dg.addColorStop(0, '#8fa1b9'); dg.addColorStop(1, '#b7c6d8');
    ctx.fillStyle = dg; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.clip();
    // porthole on the door
    const px = leafX + leafW / 2, py = dy + 78;
    const pr = 50 * (1 - open * 0.85);
    ellipse(ctx, px, py, pr, 50); fs(ctx, '#caa04a', 5);
    ellipse(ctx, px, py, pr * 0.78, 39);
    const pl = clamp(o.porthole == null ? 0.7 : o.porthole);
    const pg = ctx.createRadialGradient(px, py, 4, px, py, 40);
    pg.addColorStop(0, RV.mix('#223047', '#fff5c9', pl)); pg.addColorStop(1, RV.mix('#16202f', '#ffb347', pl));
    ctx.fillStyle = pg; ctx.fill();
    if (o.rusty && open < 0.1) {
      ctx.save();
      ellipse(ctx, px, py, pr * 0.78, 39); ctx.clip();
      o.rusty(ctx, px, py);
      ctx.restore();
    }
    ellipse(ctx, px, py, pr * 0.78, 39); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.arc(px - 10, py - 12, 18, Math.PI * 1.1, Math.PI * 1.5); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
    // paw emblem
    if (open < 0.5) {
      const ex = px, ey = dy + 200;
      ctx.fillStyle = '#e63946';
      ellipse(ctx, ex, ey + 6, 18 * (1 - open), 15); ctx.fill();
      [[-16, -14], [-6, -22], [6, -22], [16, -14]].forEach(([ax, ay]) => { ellipse(ctx, ex + ax * (1 - open), ey + ay, 6 * (1 - open), 7); ctx.fill(); });
      circle(ctx, leafX + leafW - 18, dy + dh * 0.55, 7); fs(ctx, '#ffd23f', 3);
    }
    ctx.restore();
    if (o.label) {
      rrect(ctx, -110, -bh + 16, 220, 34, 10); fs(ctx, '#23324a', 4);
      ctx.font = `22px ${RV.FONT.title}`; ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('SPACETIME', 0, -bh + 34);
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- dials, clocks, planets
  RV.clockFace = function (ctx, x, y, r, time, o = {}) {
    circle(ctx, x, y, r); fs(ctx, o.face || '#fff8e7', Math.max(2, r * 0.08));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      circle(ctx, x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, r * 0.06); fs(ctx, OUT);
    }
    const h = (time / 12) * TAU - Math.PI / 2, m = time * TAU - Math.PI / 2;
    ctx.lineCap = 'round'; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(h) * r * 0.45, y + Math.sin(h) * r * 0.45); ctx.lineWidth = r * 0.1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(m) * r * 0.68, y + Math.sin(m) * r * 0.68); ctx.lineWidth = r * 0.06; ctx.stroke();
    circle(ctx, x, y, r * 0.07); fs(ctx, '#e63946');
  };

  RV.hourglass = function (ctx, x, y, s, rot, fill) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    rrect(ctx, -34, -52, 68, 10, 4); fs(ctx, '#8d5a3b', 3);
    rrect(ctx, -34, 42, 68, 10, 4); fs(ctx, '#8d5a3b', 3);
    ctx.beginPath(); ctx.moveTo(-26, -42); ctx.lineTo(26, -42); ctx.lineTo(4, 0); ctx.lineTo(26, 42); ctx.lineTo(-26, 42); ctx.lineTo(-4, 0); ctx.closePath();
    fs(ctx, 'rgba(210,240,255,0.6)', 3);
    ctx.fillStyle = '#f4c95d';
    const f = fill == null ? 0.5 : fill;
    ctx.beginPath(); ctx.moveTo(-22 * (1 - f), -42 + 38 * f); ctx.lineTo(22 * (1 - f), -42 + 38 * f); ctx.lineTo(3, -2); ctx.lineTo(-3, -2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-24 * f, 40); ctx.lineTo(24 * f, 40); ctx.lineTo(2, 40 - 30 * f); ctx.lineTo(-2, 40 - 30 * f); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  RV.planet = function (ctx, x, y, r, o = {}) {
    const c = o.color || '#f4a261';
    if (o.ring) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.ringRot || -0.35);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.9, r * 0.45, 0, Math.PI, TAU);
      ctx.lineWidth = r * 0.16 + 6; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = r * 0.16; ctx.strokeStyle = o.ringC || '#ffe8a3'; ctx.stroke();
      ctx.restore();
    }
    circle(ctx, x, y, r);
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, RV.mix(c, '#ffffff', 0.35)); g.addColorStop(1, RV.mix(c, '#1a1030', 0.35));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(3, r * 0.05); ctx.strokeStyle = OUT; ctx.stroke();
    ctx.save(); circle(ctx, x, y, r); ctx.clip();
    ctx.fillStyle = RV.rgba(RV.mix(c, '#000000', 0.25), 0.45);
    for (let i = 0; i < 3; i++) { ctx.fillRect(x - r, y - r * 0.5 + i * r * 0.45, r * 2, r * 0.14); }
    ctx.restore();
    if (o.ring) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.ringRot || -0.35);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.9, r * 0.45, 0, 0, Math.PI);
      ctx.lineWidth = r * 0.16 + 6; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = r * 0.16; ctx.strokeStyle = o.ringC || '#ffe8a3'; ctx.stroke();
      ctx.restore();
    }
    if (o.face) {
      ctx.fillStyle = OUT;
      circle(ctx, x - r * 0.28, y - r * 0.05, r * 0.08); ctx.fill();
      circle(ctx, x + r * 0.28, y - r * 0.05, r * 0.08); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y + r * 0.12, r * 0.22, 0.2, Math.PI - 0.2); ctx.lineWidth = r * 0.05; ctx.strokeStyle = OUT; ctx.stroke();
    }
  };

  RV.comet = function (ctx, x, y, r, ang, len = 300) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, -len, 0);
    g.addColorStop(0, 'rgba(160,230,255,0.9)'); g.addColorStop(1, 'rgba(160,230,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-len, 0); ctx.lineTo(0, r); ctx.closePath(); ctx.fill();
    ctx.restore();
    glow(ctx, x, y, r * 4, '#bdf0ff', 0.8);
    circle(ctx, x, y, r); fs(ctx, '#ffffff');
  };

  // full-screen space backdrop with nebula + planets
  RV.space = function (ctx, t, o = {}) {
    RV.skyGradient(ctx, o.sky || ['#07051a', '#1a0f45', '#2a1b6e', '#12092e']);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const neb = o.nebula || ['#ff4fa3', '#4cc9f0', '#9b5de5'];
    neb.forEach((c, i) => {
      const x = 400 + i * 600 + Math.sin(t * 0.2 + i) * 60, y = 350 + Math.cos(t * 0.15 + i * 2) * 80 + (i % 2) * 250;
      glow(ctx, x, y, 520, c, 0.22);
    });
    ctx.restore();
    RV.stars(ctx, t, { n: 220, y1: H + 50, drift: o.drift || 0, seed: 7 });
    if (o.planets !== false) {
      RV.planet(ctx, 1600 + Math.sin(t * 0.3) * 20, 250, 110, { color: '#f4a261', ring: true });
      RV.planet(ctx, 260, 820 + Math.cos(t * 0.25) * 15, 70, { color: '#4cc9f0' });
      RV.planet(ctx, 1420, 860, 44, { color: '#b388eb' });
    }
  };

  // space as seen through a porthole centred on (cx, cy)
  RV.spaceWindow = function (ctx, t, cx, cy, r, o = {}) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.2);
    g.addColorStop(0, '#2a1b6e'); g.addColorStop(1, '#07051a');
    ctx.fillStyle = g; ctx.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx - r * 0.4, cy + r * 0.3, r * 0.9, '#ff4fa3', 0.25);
    glow(ctx, cx + r * 0.3, cy - r * 0.4, r * 0.8, '#4cc9f0', 0.22);
    ctx.restore();
    RV.stars(ctx, t, { n: 60, x0: cx - r, x1: cx + r, y0: cy - r, y1: cy + r, seed: 17, drift: o.drift || 12 });
    RV.planet(ctx, cx + r * 0.3, cy - r * 0.18, r * 0.3, { color: '#f4a261', ring: true });
    RV.planet(ctx, cx - r * 0.5, cy + r * 0.42, r * 0.14, { color: '#4cc9f0' });
    RV.planet(ctx, cx - r * 0.25, cy - r * 0.55, r * 0.07, { color: '#b388eb' });
    const cp = RV.fract(t * 0.35);
    RV.comet(ctx, cx - r * 1.1 + cp * r * 2.4, cy + r * 0.1 - cp * r * 0.5, r * 0.035, -0.2, r * 0.8);
  };

  // swirling clock vortex (time!)
  RV.timeVortex = function (ctx, t, cx, cy, R, o = {}) {
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, '#fff3b0'); g.addColorStop(0.25, '#c77dff'); g.addColorStop(0.7, '#5a189a'); g.addColorStop(1, '#240046');
    ctx.fillStyle = g; ctx.fillRect(cx - R * 1.5, cy - R * 1.5, R * 3, R * 3);
    // spiral arms
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const rr = (i / 40) * R * 1.3;
        const a = k * (TAU / 6) + i * 0.16 + t * 1.6;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.lineWidth = R * 0.06; ctx.strokeStyle = k % 2 ? 'rgba(255,214,255,0.35)' : 'rgba(120,220,255,0.3)'; ctx.stroke();
    }
    // orbiting clocks & hourglasses spiralling inward
    const n = o.n || 9;
    for (let i = 0; i < n; i++) {
      const ph = RV.fract(t * 0.18 + i / n);
      const rr = R * (1.15 - ph);
      const a = i * 2.4 + ph * 5 + t * 0.4;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      const s = 0.25 + (1 - ph) * 0.75;
      ctx.globalAlpha = clamp(ph * 5) * clamp((1 - ph) * 4);
      if (i % 3 === 2) RV.hourglass(ctx, x, y, s * R * 0.0045, a + t, RV.fract(t * 0.3 + i * 0.3));
      else RV.clockFace(ctx, x, y, s * R * 0.16, t * (2 + i) + i);
      ctx.globalAlpha = 1;
    }
    RV.clockFace(ctx, cx, cy, R * 0.16, t * 3);
    ctx.restore();
  };

  // ---------------------------------------------------------------- ship interior
  /* A wide set; call inside a camera transform. x range about [-560, 2480].
     o: lights (0..1), leftWin(ctx,cx,cy,r), rightWin(...), t, spin (for room spin, applied by caller),
     underground (dirt in windows), seatX */
  RV.SHIP = { leftWin: [120, 430, 250], rightWin: [1800, 430, 250] };
  RV.shipInterior = function (ctx, t, o = {}) {
    const L = o.lights == null ? 1 : o.lights;
    // back wall
    const wg = ctx.createLinearGradient(0, -200, 0, 1100);
    wg.addColorStop(0, '#1d3a57'); wg.addColorStop(0.6, '#2f5d7c'); wg.addColorStop(1, '#23465f');
    ctx.fillStyle = wg; ctx.fillRect(-800, -400, 3600, 1600);
    // panels + rivets
    ctx.strokeStyle = 'rgba(10,25,40,0.55)'; ctx.lineWidth = 4;
    for (let x = -700; x < 2700; x += 240) { ctx.beginPath(); ctx.moveTo(x, -300); ctx.lineTo(x, 1100); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-800, 150); ctx.lineTo(2800, 150); ctx.moveTo(-800, 700); ctx.lineTo(2800, 700); ctx.stroke();
    ctx.fillStyle = 'rgba(200,230,255,0.35)';
    for (let x = -700; x < 2700; x += 240) for (let y = 170; y < 700; y += 60) { circle(ctx, x + 12, y, 3); ctx.fill(); }
    // ceiling pipes
    ctx.lineCap = 'round';
    [[40, '#caa04a'], [80, '#9aa9bd']].forEach(([y, c]) => {
      ctx.beginPath(); ctx.moveTo(-800, y); ctx.lineTo(2800, y); ctx.lineWidth = 34; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = 24; ctx.strokeStyle = c; ctx.stroke();
    });
    // ceiling light strip (turns on)
    for (let i = 0; i < 16; i++) {
      const x = -600 + i * 220;
      const on = clamp(L * 16 - i * 0.6);
      circle(ctx, x, 120, 14); fs(ctx, on > 0.5 ? '#fff6c9' : '#394a5e', 4);
      if (on > 0.5) glow(ctx, x, 140, 120, '#ffe8a3', 0.35 * on);
    }
    // windows
    const win = (cx, cy, r, fn) => {
      circle(ctx, cx, cy, r + 34); fs(ctx, '#caa04a', 6);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; circle(ctx, cx + Math.cos(a) * (r + 17), cy + Math.sin(a) * (r + 17), 6); fs(ctx, '#8a6a2a', 2); }
      ctx.save();
      circle(ctx, cx, cy, r); ctx.clip();
      if (fn) fn(ctx, cx, cy, r); else { ctx.fillStyle = '#0b1030'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
      // glass shine
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.55, r * 0.25, -0.7, 0, TAU); ctx.fill();
      ctx.restore();
      circle(ctx, cx, cy, r); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    };
    const [lx, ly, lr] = RV.SHIP.leftWin, [rx, ry, rr] = RV.SHIP.rightWin;
    win(lx, ly, lr, o.leftWin);
    win(rx, ry, rr, o.rightWin);
    // wall screens (centre)
    rrect(ctx, 660, 180, 600, 300, 24); fs(ctx, '#15202e', 6);
    ctx.save();
    rrect(ctx, 676, 196, 568, 268, 16); ctx.clip();
    ctx.fillStyle = L > 0.3 ? '#07343b' : '#0a1418'; ctx.fillRect(660, 180, 600, 300);
    if (L > 0.3) {
      if (o.screen) o.screen(ctx, 960, 330);
      else {
        ctx.strokeStyle = '#39ff9f'; ctx.lineWidth = 4;
        ctx.beginPath();
        for (let x = 0; x <= 540; x += 6) {
          const y = 330 + Math.sin(x * 0.04 + t * 6) * 40 * Math.sin(x * 0.011 + t) + Math.sin(x * 0.13 + t * 9) * 8;
          if (x) ctx.lineTo(690 + x, y); else ctx.moveTo(690 + x, y);
        }
        ctx.stroke();
        ctx.font = `44px ${RV.FONT.pixel}`; ctx.fillStyle = '#39ff9f'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(o.screenText || 'SPACETIME DRIVE: READY', 700, 208);
      }
      // scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = 196; y < 470; y += 6) ctx.fillRect(660, y, 600, 2);
    }
    ctx.restore();
    // floor
    const fg = ctx.createLinearGradient(0, 760, 0, 1100);
    fg.addColorStop(0, '#3d4f66'); fg.addColorStop(1, '#232f3f');
    ctx.fillStyle = fg; ctx.fillRect(-800, 760, 3600, 500);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 3;
    for (let x = -800; x < 2800; x += 80) { ctx.beginPath(); ctx.moveTo(x, 760); ctx.lineTo(960 + (x - 960) * 1.8, 1100); ctx.stroke(); }
    for (let y = 800; y < 1100; y += 60) { ctx.beginPath(); ctx.moveTo(-800, y); ctx.lineTo(2800, y); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-800, 760); ctx.lineTo(2800, 760); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    // wall grab handles
    [-260, 560, 1360, 2180].forEach((x) => {
      ctx.beginPath(); ctx.moveTo(x - 50, 620); ctx.quadraticCurveTo(x, 560, x + 50, 620);
      ctx.lineWidth = 18; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
    });
    // dog bowl
    ellipse(ctx, 1480, 800, 60, 20); fs(ctx, '#e63946', 5);
    ellipse(ctx, 1480, 790, 46, 10); fs(ctx, '#8d5a3b', 3);
    ctx.font = `20px ${RV.FONT.title}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('RUSTY', 1480, 815);
  };

  // the control console (drawn in front of characters when needed)
  RV.console = function (ctx, x, y, t, o = {}) {
    const L = o.lights == null ? 1 : o.lights;
    ctx.save(); ctx.translate(x, y); ctx.scale(o.s || 1, o.s || 1);
    ctx.beginPath();
    ctx.moveTo(-330, 0); ctx.lineTo(-270, -150); ctx.lineTo(270, -150); ctx.lineTo(330, 0); ctx.closePath();
    fs(ctx, '#5c6f8a', 6);
    ctx.beginPath(); ctx.moveTo(-270, -150); ctx.lineTo(270, -150); ctx.lineTo(250, -175); ctx.lineTo(-250, -175); ctx.closePath();
    fs(ctx, '#8ea2bd', 5);
    // buttons
    const cols = ['#ff4d6d', '#ffd23f', '#06d6a0', '#4cc9f0', '#b388eb', '#ff9f1c'];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) {
      const bx = -220 + i * 52 + r * 20, by = -112 + r * 48;
      const on = L > 0.5 && Math.sin(t * (3 + i * 0.7) + r * 2 + i) > -0.2;
      rrect(ctx, bx - 16, by - 12, 32, 24, 7);
      fs(ctx, on ? cols[(i + r * 3) % 6] : '#3a4658', 3.5);
      if (on) glow(ctx, bx, by, 26, cols[(i + r * 3) % 6], 0.35);
    }
    // levers
    [-290, 290].forEach((lx, k) => {
      const a = (o.lever != null ? o.lever : Math.sin(t * 1.5 + k) * 0.3) * (k ? -1 : 1);
      ctx.save(); ctx.translate(lx, -60); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -110); ctx.lineWidth = 14; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = 7; ctx.strokeStyle = '#c9d2de'; ctx.stroke();
      circle(ctx, 0, -116, 18); fs(ctx, k ? '#06d6a0' : '#ff4d6d', 4.5);
      ctx.restore();
    });
    if (o.bigButton !== false) RV.bigRedButton(ctx, 0, -175, o.press || 0, 0.7, t);
    ctx.restore();
  };

  RV.bigRedButton = function (ctx, x, y, press = 0, s = 1, t = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ellipse(ctx, 0, 0, 110, 40); fs(ctx, '#2d3748', 6);
    ellipse(ctx, 0, -8, 96, 32); fs(ctx, '#ffd23f', 5);
    ctx.fillStyle = OUT;
    for (let i = 0; i < 8; i++) { ctx.save(); ctx.translate(-80 + i * 23, -8); ctx.rotate(0.5); ctx.fillRect(-4, -14, 8, 28); ctx.restore(); }
    const h = 50 * (1 - press * 0.75);
    ctx.beginPath();
    ctx.moveTo(-70, -8); ctx.lineTo(-70, -8 - h); ctx.ellipse(0, -8 - h, 70, 24, 0, Math.PI, 0); ctx.lineTo(70, -8);
    ctx.ellipse(0, -8, 70, 24, 0, 0, Math.PI);
    ctx.closePath();
    fs(ctx, '#d62839', 6);
    ellipse(ctx, 0, -8 - h, 70, 24); fs(ctx, '#ff4d5e', 5);
    ellipse(ctx, -22, -14 - h, 24, 8); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
    ctx.font = `34px ${RV.FONT.title}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText('GO!', 0, -4 - h);
    void t;
    ctx.restore();
  };

  RV.captainSeat = function (ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rrect(ctx, -12, -60, 24, 60, 6); fs(ctx, '#8795a8', 4);
    ellipse(ctx, 0, -2, 70, 14); fs(ctx, '#5f6c80', 4);
    rrect(ctx, -110, -330, 220, 250, 60); fs(ctx, '#d62839', 6);
    rrect(ctx, -86, -300, 172, 190, 40); fs(ctx, '#ef476f', 0);
    rrect(ctx, -130, -110, 260, 60, 26); fs(ctx, '#d62839', 6);
    // paw print on the headrest
    ctx.fillStyle = '#ffd23f';
    ellipse(ctx, 0, -250, 22, 18); ctx.fill();
    [[-20, -272], [-8, -282], [8, -282], [20, -272]].forEach(([a, b]) => { ellipse(ctx, a, b, 7, 8); ctx.fill(); });
    ctx.restore();
  };

  // ---------------------------------------------------------------- underground cross-section
  RV.underground = function (ctx, t, o = {}) {
    const top = o.surfaceY == null ? 260 : o.surfaceY;
    // 1972 surface sky
    RV.skyGradient(ctx, ['#ffb347', '#ffcc80', '#ffe8b0'], 0, top - 600, 0, top);
    // sun with 70s stripes
    ctx.save();
    circle(ctx, 1500, top - 120, 110); ctx.clip();
    ctx.fillStyle = '#ff7b00'; ctx.fillRect(1380, top - 240, 240, 240);
    ['#ff9e00', '#ffb700', '#ffd000'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(1380, top - 230 + i * 36, 240, 18); });
    ctx.restore();
    // 70s street on top
    if (o.surface !== false) RV.surface1972(ctx, t, top, o);
    // soil layers
    const layers = [['#8d5a3b', 0], ['#7a4a2f', 150], ['#6b3f27', 330], ['#5a331f', 520], ['#4a2918', 720]];
    layers.forEach(([c, dy], i) => {
      ctx.beginPath();
      ctx.moveTo(-800, top + dy);
      for (let x = -800; x <= 2800; x += 120) ctx.lineTo(x, top + dy + Math.sin(x * 0.01 + i * 2) * 12);
      ctx.lineTo(2800, 2400); ctx.lineTo(-800, 2400); ctx.closePath();
      ctx.fillStyle = c; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,20,10,0.5)'; ctx.stroke();
    });
    // grass edge
    ctx.fillStyle = '#6a994e'; ctx.fillRect(-800, top - 14, 3600, 22);
    ctx.beginPath(); ctx.moveTo(-800, top + 8); ctx.lineTo(2800, top + 8); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    // pebbles
    for (let i = 0; i < 90; i++) {
      const x = -700 + hash(i * 3.1) * 3400, y = top + 40 + hash(i * 7.3) * 1000;
      ellipse(ctx, x, y, 8 + hash(i) * 16, 6 + hash(i * 2) * 10, hash(i * 5) * 3);
      fs(ctx, ['#a0785a', '#8b6b52', '#b08968'][i % 3], 3);
    }
    // fossils: dino bones + a shell
    if (o.fossils !== false) {
      RV.dinoBones(ctx, o.fossilX || 1480, top + 620, 1);
      ctx.save(); ctx.translate(260, top + 460);
      ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.35, r = 3 + i * 1.1; const px = Math.cos(a) * r, py = Math.sin(a) * r; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.lineWidth = 6; ctx.strokeStyle = '#e8d8b8'; ctx.stroke();
      ctx.restore();
    }
    // roots
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    [[200, top], [700, top], [1250, top], [1750, top]].forEach(([x, y], i) => {
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 30, y + 60, x - 40, y + 100, x + 10 + i * 5, y + 170);
      ctx.moveTo(x + 5, y + 70); ctx.quadraticCurveTo(x + 50, y + 90, x + 70, y + 130);
      ctx.stroke();
    });
  };

  RV.dinoBones = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#efe3c8'; ctx.lineCap = 'round';
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(-160, 0); ctx.quadraticCurveTo(0, -60, 160, -10); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const px = -110 + i * 30, py = -32 - Math.sin((i / 7) * Math.PI) * 18;
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 10, py + 40, px - 4, py + 70); ctx.stroke();
    }
    ellipse(ctx, 190, -26, 44, 26, -0.2); fs(ctx, '#efe3c8', 4, '#7a5a3a');
    circle(ctx, 200, -34, 7); fs(ctx, '#5a331f');
    ctx.restore();
  };

  RV.surface1972 = function (ctx, t, top, o = {}) {
    // groovy house
    ctx.save();
    ctx.translate(o.houseX || 300, top);
    rrect(ctx, -170, -190, 340, 190, 8); fs(ctx, '#e9c46a', 5);
    ctx.beginPath(); ctx.moveTo(-200, -186); ctx.lineTo(0, -280); ctx.lineTo(200, -186); ctx.closePath(); fs(ctx, '#bc6c25', 5);
    [-90, 90].forEach((dx) => { rrect(ctx, dx - 40, -150, 80, 60, 6); fs(ctx, '#ffe8a3', 4); });
    rrect(ctx, -30, -100, 60, 100, 6); fs(ctx, '#6f1d1b', 4);
    // TV aerial
    ctx.beginPath(); ctx.moveTo(60, -250); ctx.lineTo(60, -330); ctx.moveTo(30, -310); ctx.lineTo(90, -310); ctx.moveTo(38, -290); ctx.lineTo(82, -290);
    ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.restore();
    // flower-power van
    const vx = (o.vanX != null ? o.vanX : 1000) + Math.sin(t * 0.8) * 10;
    ctx.save(); ctx.translate(vx, top - 18);
    rrect(ctx, -170, -150, 340, 130, 40); fs(ctx, '#90e0ef', 5);
    rrect(ctx, -170, -95, 340, 75, 20); fs(ctx, '#ffffff', 0);
    ctx.beginPath(); ctx.moveTo(-170, -95); ctx.lineTo(170, -95); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    rrect(ctx, -170, -150, 340, 130, 40); ctx.lineWidth = 5; ctx.stroke();
    [-110, -40, 30].forEach((wx) => { rrect(ctx, wx, -135, 56, 36, 8); fs(ctx, '#caf0f8', 4); });
    rrect(ctx, 100, -135, 55, 40, 10); fs(ctx, '#caf0f8', 4);
    // daisies
    [[-120, -60], [-40, -45], [60, -65], [120, -48]].forEach(([dx, dy], i) => RV.daisy(ctx, dx, dy, 14, ['#ff4d6d', '#ffd23f', '#ff9f1c', '#b388eb'][i]));
    [-100, 100].forEach((wx) => { circle(ctx, wx, -18, 30); fs(ctx, '#2b2b2b', 5); circle(ctx, wx, -18, 12); fs(ctx, '#d9d9d9', 3); });
    ctx.restore();
    // lamp post & a flower bed
    for (let i = 0; i < 9; i++) RV.daisy(ctx, 1300 + i * 70, top - 16 - (i % 2) * 10, 16, ['#ff4d6d', '#ffd23f', '#ff9f1c'][i % 3]);
  };

  RV.daisy = function (ctx, x, y, r, center = '#ffd23f', petal = '#ffffff') {
    ctx.fillStyle = petal;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ellipse(ctx, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.45, r * 0.25, a);
      fs(ctx, petal, 2);
    }
    circle(ctx, x, y, r * 0.38); fs(ctx, center, 2);
  };

  // cute worm; o: t, shades, dance (0..1), face (+1/-1), color
  RV.worm = function (ctx, x, y, s, o = {}) {
    const t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face || 1), s);
    const col = o.color || '#ff8fa3';
    const d = o.dance == null ? 1 : o.dance;
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const k = i / 6;
      pts.push([Math.sin(t * 6 + k * 3) * 16 * d * (1 - k * 0.3) + k * 10, -k * 110]);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); RV.curve(ctx, pts, false, 0.5, false);
    ctx.lineWidth = 40; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); RV.curve(ctx, pts, false, 0.5, false);
    ctx.lineWidth = 31; ctx.strokeStyle = col; ctx.stroke();
    // segments
    ctx.strokeStyle = RV.mix(col, '#000000', 0.2); ctx.lineWidth = 3;
    for (let i = 1; i < 6; i++) {
      const [px, py] = pts[i];
      ctx.beginPath(); ctx.moveTo(px - 13, py); ctx.lineTo(px + 13, py); ctx.stroke();
    }
    const [hx, hy] = pts[6];
    circle(ctx, hx, hy - 10, 24); fs(ctx, col, 4.5);
    if (o.shades) {
      rrect(ctx, hx - 22, hy - 20, 44, 14, 5); fs(ctx, '#1b1030', 3);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(hx - 16, hy - 17, 8, 3);
    } else {
      circle(ctx, hx - 8, hy - 14, 5); fs(ctx, OUT);
      circle(ctx, hx + 8, hy - 14, 5); fs(ctx, OUT);
      circle(ctx, hx - 9.5, hy - 15.5, 1.8); fs(ctx, '#fff');
      circle(ctx, hx + 6.5, hy - 15.5, 1.8); fs(ctx, '#fff');
    }
    ctx.beginPath(); ctx.arc(hx, hy - 4, 8, 0.2, Math.PI - 0.2); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
    if (o.hat) o.hat(ctx, hx, hy - 30);
    ctx.restore();
  };

  // ---------------------------------------------------------------- disco
  RV.mirrorBall = function (ctx, x, y, r, t) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y - r - 400); ctx.lineWidth = 5; ctx.strokeStyle = '#999'; ctx.stroke();
    circle(ctx, x, y, r); fs(ctx, '#b8c0cc', 5);
    ctx.save(); circle(ctx, x, y, r); ctx.clip();
    const rot = t * 0.8;
    for (let row = -6; row <= 6; row++) {
      const lat = (row / 7) * (Math.PI / 2);
      const yy = y + Math.sin(lat) * r;
      const rr = Math.cos(lat) * r;
      const n = Math.max(4, Math.round(16 * Math.cos(lat)));
      for (let i = 0; i < n; i++) {
        const lon = (i / n) * TAU + rot;
        const cz = Math.cos(lon);
        if (cz < 0) continue;
        const xx = x + Math.sin(lon) * rr;
        const b = 0.4 + 0.6 * hash(row * 31 + i + Math.floor(t * 8));
        ctx.fillStyle = `rgba(${Math.round(160 + 95 * b)},${Math.round(170 + 85 * b)},${Math.round(190 + 65 * b)},1)`;
        const sz = (r / 7) * (0.35 + 0.65 * cz);
        ctx.fillRect(xx - sz * 0.45, yy - r / 16, sz * 0.9, r / 8.5);
      }
    }
    ctx.restore();
    circle(ctx, x, y, r); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const a = t * 1.3 + i * 1.7;
      RV.sparkle(ctx, x + Math.cos(a) * r * 0.6, y + Math.sin(a * 1.3) * r * 0.6, 14 + 8 * Math.sin(t * 7 + i), '#ffffff', 0.9);
    }
    ctx.restore();
  };

  // light spots sprayed by a mirror ball
  RV.discoSpots = function (ctx, t, n = 40, alpha = 0.5) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cols = ['#ff4fa3', '#4cc9f0', '#ffd23f', '#06d6a0', '#b388eb'];
    for (let i = 0; i < n; i++) {
      const a = hash(i * 3.7) * TAU + t * (0.5 + hash(i) * 0.3);
      const d = 200 + hash(i * 9.1) * 1100;
      const x = 960 + Math.cos(a) * d, y = 420 + Math.sin(a) * d * 0.6;
      glow(ctx, x, y, 34 + hash(i * 2) * 20, cols[i % 5], alpha);
    }
    ctx.restore();
  };

  // perspective light-up dance floor
  RV.danceFloor = function (ctx, t, o = {}) {
    const y0 = o.y0 || 640, y1 = H + 20;
    const cols = o.colors || ['#ff4fa3', '#4cc9f0', '#ffd23f', '#06d6a0', '#b388eb', '#ff9f1c'];
    const rows = 7, cols_n = 12;
    const beat = Math.floor(RV.beat(t));
    for (let r = 0; r < rows; r++) {
      const a0 = r / rows, a1 = (r + 1) / rows;
      const ya = lerp(y0, y1, Math.pow(a0, 1.5)), yb = lerp(y0, y1, Math.pow(a1, 1.5));
      const wa = lerp(900, 2600, Math.pow(a0, 1.5)), wb = lerp(900, 2600, Math.pow(a1, 1.5));
      for (let c = 0; c < cols_n; c++) {
        const xa0 = 960 - wa / 2 + (wa * c) / cols_n, xa1 = 960 - wa / 2 + (wa * (c + 1)) / cols_n;
        const xb0 = 960 - wb / 2 + (wb * c) / cols_n, xb1 = 960 - wb / 2 + (wb * (c + 1)) / cols_n;
        const on = hash(r * 13 + c * 7 + beat * 3.1) > 0.45;
        const col = cols[Math.floor(hash(r * 5 + c * 11 + beat) * cols.length)];
        ctx.beginPath(); ctx.moveTo(xa0, ya); ctx.lineTo(xa1, ya); ctx.lineTo(xb1, yb); ctx.lineTo(xb0, yb); ctx.closePath();
        ctx.fillStyle = on ? col : '#1c1433';
        ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#0b0718'; ctx.stroke();
        if (on) {
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.beginPath(); ctx.moveTo(xa0 + 6, ya + 4); ctx.lineTo(xa1 - 6, ya + 4); ctx.lineTo(xb1 - 10, (ya + yb) / 2); ctx.lineTo(xb0 + 10, (ya + yb) / 2); ctx.closePath(); ctx.fill();
        }
      }
    }
  };

  RV.discoHall = function (ctx, t, o = {}) {
    RV.skyGradient(ctx, ['#12052e', '#2b0b52', '#3c096c']);
    // velvet backdrop with painted moon + stars
    if (o.backdrop !== false) RV.velvetBackdrop(ctx, t, o);
    // stage & band silhouettes
    if (o.band !== false) {
      ctx.fillStyle = '#240a45';
      rrect(ctx, 520, 520, 880, 140, 10); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
      RV.bandSilhouettes(ctx, t);
    }
    RV.danceFloor(ctx, t, o);
    // truss lights
    for (let i = 0; i < 6; i++) {
      const x = 180 + i * 312;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const a = Math.sin(t * 1.5 + i) * 0.5;
      ctx.translate(x, 30); ctx.rotate(a);
      const g = ctx.createLinearGradient(0, 0, 0, 900);
      const col = ['#ff4fa3', '#4cc9f0', '#ffd23f', '#06d6a0', '#b388eb', '#ff9f1c'][i];
      g.addColorStop(0, RV.rgba(col, 0.45)); g.addColorStop(1, RV.rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.lineTo(200, 900); ctx.lineTo(-200, 900); ctx.closePath(); ctx.fill();
      ctx.restore();
      rrect(ctx, x - 24, 10, 48, 40, 8); fs(ctx, '#333', 4);
    }
    if (o.ball !== false) RV.mirrorBall(ctx, o.ballX || 960, o.ballY || 150, o.ballR || 90, t);
    RV.discoSpots(ctx, t, 36, 0.28);
  };

  RV.velvetBackdrop = function (ctx, t, o = {}) {
    const flap = o.flap || 0;
    ctx.save();
    // curtain folds
    const g = ctx.createLinearGradient(0, 0, W, 0);
    for (let i = 0; i <= 12; i++) g.addColorStop(i / 12, i % 2 ? '#1a0b3b' : '#26104f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(40, 40); ctx.lineTo(W - 40, 40);
    ctx.lineTo(W - 40, 560 - flap * 120); ctx.quadraticCurveTo(W - 40 - flap * 80, 560, W - 40 - flap * 160, 560);
    ctx.lineTo(40, 560); ctx.closePath();
    ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    if (flap > 0) {
      // the peeled corner shows the bunker's concrete wall
      ctx.beginPath(); ctx.moveTo(W - 40, 560 - flap * 120); ctx.quadraticCurveTo(W - 40 - flap * 80, 560, W - 40 - flap * 160, 560);
      ctx.lineTo(W - 40, 560); ctx.closePath(); fs(ctx, '#7d7d8a', 4);
    }
    // painted stars (flat, 5-point)
    for (let i = 0; i < 22; i++) {
      const x = 100 + hash(i * 4.1) * (W - 200), y = 80 + hash(i * 2.9) * 420;
      RV.star(ctx, x, y, 12 + hash(i) * 8, 5 + hash(i) * 3, 5, Math.sin(t + i) * 0.2);
      fs(ctx, '#ffe066', 2.5);
    }
    // painted moon: flat disc with brush strokes
    const mx = o.moonX || 1450, my = o.moonY || 230;
    circle(ctx, mx, my, 110); fs(ctx, '#f7e7b4', 5);
    ctx.strokeStyle = 'rgba(200,170,100,0.6)'; ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(mx - 20 + i * 8, my - 10 + i * 6, 40 + i * 9, 2.2, 3.4); ctx.stroke(); }
    ctx.fillStyle = '#b89d63';
    circle(ctx, mx - 35, my - 15, 9); ctx.fill(); circle(ctx, mx + 35, my - 15, 9); ctx.fill();
    ctx.beginPath(); ctx.arc(mx, my + 10, 38, 0.3, Math.PI - 0.3); ctx.lineWidth = 7; ctx.strokeStyle = '#b89d63'; ctx.stroke();
    // hanging ropes
    ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 4;
    [120, W - 120].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 60); ctx.stroke(); });
    ctx.restore();
  };

  RV.bandSilhouettes = function (ctx, t) {
    const b = RV.bounce(t, 1);
    ctx.fillStyle = '#0d0420';
    // drummer
    ctx.save(); ctx.translate(960, 560);
    circle(ctx, 0, -120 - b * 6, 30); ctx.fill();
    rrect(ctx, -34, -95 - b * 5, 68, 80, 20); ctx.fill();
    ellipse(ctx, 0, -10, 60, 40); ctx.fill();
    [-90, 90].forEach((dx) => { ellipse(ctx, dx, -50, 40, 10); ctx.fill(); });
    ctx.restore();
    // guitarist + bassist with afros
    [[700, 0], [1220, 1]].forEach(([x, k]) => {
      const bb = RV.bounce(t, 0.5, k * 0.5);
      ctx.save(); ctx.translate(x, 560 - bb * 10); ctx.rotate(Math.sin(t * 3 + k) * 0.06);
      circle(ctx, 0, -200, 46); ctx.fill();
      circle(ctx, 0, -170, 26); ctx.fill();
      rrect(ctx, -30, -150, 60, 110, 18); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(-40, 40); ctx.lineTo(-10, 40); ctx.lineTo(0, -30); ctx.lineTo(10, 40); ctx.lineTo(40, 40); ctx.lineTo(20, -40); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.rotate(-0.5); rrect(ctx, -90, -110, 170, 18, 8); ctx.fill(); ellipse(ctx, 40, -100, 36, 28); ctx.fill(); ctx.restore();
      ctx.restore();
    });
  };

  // ---------------------------------------------------------------- tunnel of light
  RV.lightTunnel = function (ctx, t, o = {}) {
    ctx.fillStyle = '#05010f'; ctx.fillRect(-W, -H, W * 3, H * 3);
    const cx = o.cx || 960, cy = o.cy || 540;
    const cols = ['#ff4fa3', '#ff9f1c', '#ffd23f', '#06d6a0', '#4cc9f0', '#9b5de5'];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const speed = o.speed || 1.2;
    for (let i = 0; i < 26; i++) {
      const z = RV.fract(i / 26 - t * speed * 0.25);
      const r = 20 + Math.pow(z, 2.2) * 1600;
      const a = (1 - z) * 0.2 + z * 0.9;
      const wob = Math.sin(t * 2 + i) * 20 * z;
      ctx.beginPath();
      ctx.ellipse(cx + wob, cy + wob * 0.5, r, r * 0.8, t * 0.5 + i, 0, TAU);
      ctx.lineWidth = 6 + z * 40;
      ctx.strokeStyle = RV.rgba(cols[i % cols.length], a * 0.6);
      ctx.stroke();
    }
    // streaks
    for (let i = 0; i < 70; i++) {
      const ang = hash(i * 1.7) * TAU;
      const z = RV.fract(hash(i * 3.3) - t * speed * 0.6);
      const r0 = 50 + Math.pow(z, 2) * 1400, r1 = r0 + 40 + z * 260;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
      ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.lineWidth = 2 + z * 6;
      ctx.strokeStyle = `rgba(255,255,255,${z * 0.8})`;
      ctx.stroke();
    }
    glow(ctx, cx, cy, 260, '#ffffff', 0.9);
    ctx.restore();
  };

  // ---------------------------------------------------------------- backyard + living room
  RV.backyard = function (ctx, t, o = {}) {
    const day = o.day || 0;
    const wx = o.weather || 'clear';
    if (day > 0.5) {
      RV.skyGradient(ctx, wx === 'rain' ? ['#7d8ca3', '#9fb0c4', '#c3cfdc'] : ['#5ec8ff', '#8fd8ff', '#cdefff']);
      if (wx !== 'rain') {
        glow(ctx, 1600, 170, 260, '#fff3b0', 0.8);
        circle(ctx, 1600, 170, 80); fs(ctx, '#ffd23f', 5);
      }
      RV.cloud(ctx, 400 + (t * 20) % 2400 - 300, 180, 1.2, '#ffffff', wx === 'rain' ? 0.6 : 0.95);
      RV.cloud(ctx, 1200 + (t * 14) % 2400 - 600, 120, 0.9, '#ffffff', wx === 'rain' ? 0.6 : 0.95);
    } else {
      RV.skyGradient(ctx, ['#0b1030', '#1d2560', '#34407e']);
      RV.stars(ctx, t, { n: 120, y1: 500, seed: 9 });
      RV.moon(ctx, 1560, 170, 70);
    }
    // house back wall with window + back door
    const houseC = day > 0.5 ? '#f4a261' : '#6b4a5e';
    rrect(ctx, -60, 170, 700, 700, 10); fs(ctx, houseC, 5);
    ctx.beginPath(); ctx.moveTo(-100, 180); ctx.lineTo(290, 20); ctx.lineTo(680, 180); ctx.closePath(); fs(ctx, day > 0.5 ? '#9c4a2f' : '#3b2f4a', 5);
    rrect(ctx, 80, 300, 200, 170, 8); fs(ctx, day > 0.5 ? '#bde0fe' : '#ffe28a', 5);
    if (day <= 0.5) glow(ctx, 180, 385, 200, '#ffd36b', 0.3);
    ctx.beginPath(); ctx.moveTo(180, 300); ctx.lineTo(180, 470); ctx.moveTo(80, 385); ctx.lineTo(280, 385); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    rrect(ctx, 380, 560, 150, 310, 8); fs(ctx, day > 0.5 ? '#8d5a3b' : '#4a2f25', 5);
    // fence
    RV.fence(ctx, 640, 2000, 820, 180, day > 0.5 ? '#f1e3c8' : '#9d93a8', 4);
    // lawn
    ctx.fillStyle = day > 0.5 ? '#80b918' : '#2d5a3d';
    ctx.fillRect(-200, 840, W + 400, 400);
    ctx.beginPath(); ctx.moveTo(-200, 840); ctx.lineTo(W + 200, 840); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    // clothesline + shed
    rrect(ctx, 1500, 560, 300, 280, 8); fs(ctx, day > 0.5 ? '#90be6d' : '#35543f', 5);
    ctx.beginPath(); ctx.moveTo(1470, 570); ctx.lineTo(1650, 450); ctx.lineTo(1830, 570); ctx.closePath(); fs(ctx, day > 0.5 ? '#6a994e' : '#27402f', 5);
    // bushes
    [[700, 870], [1350, 880], [1880, 870]].forEach(([x, y]) => {
      [[0, 0, 60], [-50, 10, 44], [50, 12, 46]].forEach(([dx, dy, r]) => { circle(ctx, x + dx, y + dy - 30, r); fs(ctx, day > 0.5 ? '#55a630' : '#23452f', 4.5); });
    });
    if (wx === 'rain' && day > 0.5) {
      ctx.strokeStyle = 'rgba(220,235,255,0.7)'; ctx.lineWidth = 3;
      for (let i = 0; i < 140; i++) {
        const x = (hash(i * 3.1) * 2200 + t * 300) % 2200 - 100, y = (hash(i * 7.7) * 1200 + t * 1400) % 1200 - 60;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 36); ctx.stroke();
      }
    }
    if (wx === 'leaves' && day > 0.5) {
      for (let i = 0; i < 26; i++) {
        const x = (hash(i * 5.3) * 2400 + t * 380) % 2400 - 200, y = 100 + hash(i * 1.3) * 800 + Math.sin(t * 3 + i) * 50;
        ellipse(ctx, x, y, 16, 8, t * 3 + i); fs(ctx, ['#f77f00', '#fcbf49', '#d62828'][i % 3], 2.5);
      }
    }
  };

  RV.livingRoom = function (ctx, t, o = {}) {
    const warm = o.warm == null ? 1 : o.warm;
    // wallpaper
    ctx.fillStyle = '#5b3f5f'; ctx.fillRect(-200, -200, W + 400, H + 400);
    ctx.fillStyle = 'rgba(255,220,180,0.06)';
    for (let x = -200; x < W + 200; x += 80) ctx.fillRect(x, -200, 36, H + 400);
    // window (night) with curtains
    rrect(ctx, 150, 170, 360, 330, 10); fs(ctx, '#15204a', 6);
    ctx.save(); rrect(ctx, 150, 170, 360, 330, 10); ctx.clip();
    RV.stars(ctx, t, { n: 30, x0: 150, x1: 510, y0: 170, y1: 500, seed: 3 });
    RV.moon(ctx, 420, 250, 36);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(330, 170); ctx.lineTo(330, 500); ctx.moveTo(150, 335); ctx.lineTo(510, 335); ctx.lineWidth = 8; ctx.strokeStyle = '#3b2a1e'; ctx.stroke();
    [[120, 1], [540, -1]].forEach(([x, sd]) => {
      ctx.beginPath(); ctx.moveTo(x - 40 * sd, 140); ctx.quadraticCurveTo(x + 20 * sd, 320, x - 30 * sd, 540); ctx.lineTo(x + 60 * sd, 540); ctx.quadraticCurveTo(x + 50 * sd, 320, x + 60 * sd, 140); ctx.closePath();
      fs(ctx, '#c1121f', 5);
    });
    // bookshelf (like home!)
    if (o.shelf !== false) RV.bookshelf(ctx, o.shelfX || 1450, 130, t);
    // fireplace
    if (o.fire !== false) RV.fireplace(ctx, o.fireX || 820, 860, t, warm);
    // floor + rug
    ctx.fillStyle = '#7a4e2d'; ctx.fillRect(-200, 860, W + 400, 300);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 3;
    for (let y = 890; y < 1100; y += 40) { ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(W + 200, y); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-200, 860); ctx.lineTo(W + 200, 860); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    ellipse(ctx, 900, 990, 620, 80); fs(ctx, '#2a9d8f', 5);
    ellipse(ctx, 900, 990, 520, 58); ctx.lineWidth = 6; ctx.strokeStyle = '#e9c46a'; ctx.stroke();
  };

  RV.bookshelf = function (ctx, x, y, t) {
    rrect(ctx, x, y, 380, 740, 8); fs(ctx, '#6b3e26', 6);
    const cols = ['#e63946', '#f1c40f', '#2a9d8f', '#8e44ad', '#f4a261', '#3a86ff', '#ff006e', '#06d6a0', '#ffbe0b'];
    for (let s = 0; s < 4; s++) {
      const sy = y + 30 + s * 180;
      rrect(ctx, x + 14, sy, 352, 150, 4); fs(ctx, '#3d2215', 0);
      let bx = x + 20;
      let k = s * 5;
      while (bx < x + 350) {
        const bw = 18 + hash(k * 2.3) * 16, bh = 100 + hash(k * 4.1) * 44;
        if (bx + bw > x + 360) break;
        if (s === 1 && k % 7 === 3) {
          // the big green letter from the photo's shelf
          ctx.font = `110px ${RV.FONT.title}`; ctx.fillStyle = '#2eb872'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.strokeText('Q', bx, sy + 146); ctx.fillText('Q', bx, sy + 146);
          bx += 80; k++; continue;
        }
        rrect(ctx, bx, sy + 150 - bh, bw, bh, 3);
        fs(ctx, cols[k % cols.length], 3);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx + 3, sy + 150 - bh + 12, bw - 6, 5);
        bx += bw + 3; k++;
      }
      rrect(ctx, x + 6, sy + 150, 368, 18, 3); fs(ctx, '#8b5a3c', 4);
    }
    void t;
  };

  RV.fireplace = function (ctx, x, y, t, warm = 1) {
    // warm glow on the room
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - 120, 700, '#ff9e40', 0.25 * warm * (0.9 + 0.1 * Math.sin(t * 9)));
    ctx.restore();
    rrect(ctx, x - 300, y - 420, 600, 420, 10); fs(ctx, '#b5838d', 6);
    rrect(ctx, x - 340, y - 450, 680, 50, 8); fs(ctx, '#6d4c41', 6);
    ctx.beginPath(); ctx.moveTo(x - 190, y); ctx.lineTo(x - 190, y - 220); ctx.quadraticCurveTo(x, y - 330, x + 190, y - 220); ctx.lineTo(x + 190, y); ctx.closePath();
    fs(ctx, '#1b0f0a', 6);
    // bricks
    ctx.strokeStyle = 'rgba(80,40,40,0.35)'; ctx.lineWidth = 3;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 8; c++) {
      const bx = x - 300 + c * 75 + (r % 2) * 37, by = y - 400 + r * 58;
      if (bx > x - 200 && bx < x + 190 && by > y - 300) continue;
      ctx.strokeRect(bx, by, 75, 58);
    }
    // logs + flames
    [[-60, 0.2], [60, -0.2]].forEach(([dx, a]) => {
      ctx.save(); ctx.translate(x + dx, y - 30); ctx.rotate(a); rrect(ctx, -90, -18, 180, 36, 18); fs(ctx, '#6b3e26', 4); ctx.restore();
    });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const fx = x - 90 + i * 30, fh = 120 + 60 * Math.abs(Math.sin(t * 5 + i * 1.7)) + RV.noise(t * 6 + i, i) * 30;
      const g = ctx.createLinearGradient(0, y - 40, 0, y - 40 - fh);
      g.addColorStop(0, 'rgba(255,190,60,0.95)'); g.addColorStop(0.5, 'rgba(255,110,30,0.7)'); g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(fx - 34, y - 40);
      ctx.quadraticCurveTo(fx - 30 + Math.sin(t * 7 + i) * 10, y - 40 - fh * 0.6, fx + Math.sin(t * 6 + i) * 14, y - 40 - fh);
      ctx.quadraticCurveTo(fx + 30 + Math.sin(t * 8 + i) * 10, y - 40 - fh * 0.5, fx + 34, y - 40);
      ctx.closePath(); ctx.fill();
    }
    glow(ctx, x, y - 90, 220, '#ffb347', 0.5);
    ctx.restore();
  };

  RV.armchair = function (ctx, x, y, s = 1, front) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const c = '#8fb8a8', cs = '#6f9a8a';
    if (!front) {
      rrect(ctx, -300, -420, 600, 300, 90); fs(ctx, c, 6);
      // waffle texture
      ctx.save(); rrect(ctx, -300, -420, 600, 300, 90); ctx.clip();
      ctx.strokeStyle = 'rgba(40,80,70,0.2)'; ctx.lineWidth = 2;
      for (let i = -300; i < 300; i += 14) { ctx.beginPath(); ctx.moveTo(i, -420); ctx.lineTo(i, -120); ctx.stroke(); }
      for (let j = -420; j < -120; j += 14) { ctx.beginPath(); ctx.moveTo(-300, j); ctx.lineTo(300, j); ctx.stroke(); }
      ctx.restore();
      rrect(ctx, -330, -170, 660, 160, 60); fs(ctx, cs, 6);
    } else {
      [-1, 1].forEach((sd) => { rrect(ctx, sd * 330 - 70, -300, 140, 300, 60); fs(ctx, c, 6); });
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- misc props
  RV.torch = function (ctx, hand, ang, beam = 1, len = 700) {
    ctx.save();
    ctx.translate(hand[0], hand[1]);
    ctx.rotate(ang);
    if (beam > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, `rgba(255,245,190,${0.55 * beam})`); g.addColorStop(1, 'rgba(255,245,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo(len, -len * 0.22); ctx.lineTo(len, len * 0.22); ctx.lineTo(20, 10); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    rrect(ctx, -26, -11, 52, 22, 6); fs(ctx, '#e63946', 4);
    rrect(ctx, 18, -15, 16, 30, 4); fs(ctx, '#c9d2de', 4);
    ctx.restore();
  };

  RV.shovel = function (ctx, hand, ang, s = 1) {
    ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(ang); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 110); ctx.lineWidth = 16; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = '#b07d4f'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-24, -64); ctx.lineTo(24, -64); ctx.lineWidth = 14; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#b07d4f'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-34, 104); ctx.lineTo(34, 104); ctx.lineTo(30, 150); ctx.quadraticCurveTo(0, 190, -30, 150); ctx.closePath();
    fs(ctx, '#aab4c3', 4.5);
    ctx.restore();
  };

  RV.sign = function (ctx, text, x, y, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
    const size = o.size || 60;
    ctx.font = `${size}px ${o.font || RV.FONT.title}`;
    const w = ctx.measureText(text).width + size;
    const h = size * 1.5;
    if (o.post) { rrect(ctx, -8, 0, 16, o.post, 4); fs(ctx, '#8d5a3b', 4); }
    rrect(ctx, -w / 2, -h, w, h, size * 0.25);
    fs(ctx, o.bg || '#ffd23f', 5);
    ctx.fillStyle = o.color || OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -h / 2 + size * 0.06);
    ctx.restore();
  };

  RV.speechBubble = function (ctx, x, y, w, h, tailX, tailY, o = {}) {
    ctx.save();
    const think = o.think;
    if (think) {
      ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, TAU);
      fs(ctx, o.bg || '#ffffff', 5);
      const n = 3;
      for (let i = 1; i <= n; i++) {
        const k = i / (n + 1);
        circle(ctx, lerp(x, tailX, 0.55 + k * 0.45), lerp(y + h * 0.3, tailY, 0.55 + k * 0.45), 16 - i * 4);
        fs(ctx, o.bg || '#ffffff', 4);
      }
    } else {
      rrect(ctx, x - w / 2, y - h / 2, w, h, Math.min(40, h / 2));
      fs(ctx, o.bg || '#ffffff', 5);
      ctx.beginPath(); ctx.moveTo(x - 30, y + h / 2 - 4); ctx.lineTo(tailX, tailY); ctx.lineTo(x + 20, y + h / 2 - 4);
      fs(ctx, o.bg || '#ffffff', 0);
      ctx.beginPath(); ctx.moveTo(x - 30, y + h / 2); ctx.lineTo(tailX, tailY); ctx.lineTo(x + 20, y + h / 2);
      ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    }
    if (o.text) {
      ctx.font = `${o.size || 48}px ${o.font || RV.FONT.title}`;
      ctx.fillStyle = o.color || OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(o.text, x, y + 4);
    }
    ctx.restore();
  };

  RV.lightbulb = function (ctx, x, y, s, on, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (on) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -10, 180, '#fff3a0', 0.8 * on); ctx.restore();
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + (t || 0);
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 80, -10 + Math.sin(a) * 80); ctx.lineTo(Math.cos(a) * (100 + 10 * on), -10 + Math.sin(a) * (100 + 10 * on)); ctx.stroke();
      }
    }
    circle(ctx, 0, -10, 50); fs(ctx, on ? '#fff59d' : '#e8eef6', 5);
    rrect(ctx, -22, 34, 44, 34, 6); fs(ctx, '#9aa9bd', 4.5);
    ctx.beginPath(); ctx.moveTo(-10, 20); ctx.lineTo(-10, -10); ctx.lineTo(10, -10); ctx.lineTo(10, 20); ctx.lineWidth = 3; ctx.strokeStyle = '#e0a800'; ctx.stroke();
    ctx.restore();
  };

  RV.compass = function (ctx, x, y, r, ang, t) {
    circle(ctx, x, y, r); fs(ctx, '#caa04a', 8);
    circle(ctx, x, y, r * 0.86); fs(ctx, '#fff8e7', 4);
    ctx.font = `${r * 0.28}px ${RV.FONT.title}`; ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [['N', 0], ['E', 1], ['S', 2], ['W', 3]].forEach(([l, i]) => {
      const a = (i / 4) * TAU - Math.PI / 2;
      ctx.fillStyle = l === 'W' ? '#e63946' : OUT;
      ctx.fillText(l, x + Math.cos(a) * r * 0.64, y + Math.sin(a) * r * 0.64);
    });
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(r * 0.12, 0); ctx.lineTo(-r * 0.12, 0); ctx.closePath(); fs(ctx, '#e63946', 3);
    ctx.beginPath(); ctx.moveTo(0, r * 0.5); ctx.lineTo(r * 0.12, 0); ctx.lineTo(-r * 0.12, 0); ctx.closePath(); fs(ctx, '#dfe6ee', 3);
    ctx.restore();
    circle(ctx, x, y, r * 0.06); fs(ctx, OUT);
    void t;
  };

  RV.cowboyHat = function (ctx, x, y, s, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.beginPath(); ctx.ellipse(0, 0, 110, 26, 0, 0, TAU); fs(ctx, '#a0522d', 5);
    ctx.beginPath(); ctx.moveTo(-58, -6); ctx.bezierCurveTo(-64, -90, -20, -80, 0, -64); ctx.bezierCurveTo(20, -80, 64, -90, 58, -6); ctx.closePath();
    fs(ctx, '#b5651d', 5);
    ctx.fillStyle = '#5a2d0c'; ctx.fillRect(-56, -26, 112, 14);
    ctx.restore();
  };

  RV.treasureChest = function (ctx, x, y, s, open, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (open > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -60, 260, '#ffd23f', 0.8 * open); ctx.restore();
    }
    rrect(ctx, -110, -90, 220, 90, 10); fs(ctx, '#8d5a3b', 5);
    ctx.fillStyle = '#caa04a'; ctx.fillRect(-110, -60, 220, 14); ctx.fillRect(-12, -90, 24, 90);
    ctx.save(); ctx.translate(0, -90); ctx.rotate(-open * 0.9);
    ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(-110, -40); ctx.quadraticCurveTo(0, -90, 110, -40); ctx.lineTo(110, 0); ctx.closePath();
    fs(ctx, '#a0673f', 5);
    ctx.restore();
    if (open > 0.3) for (let i = 0; i < 6; i++) RV.sparkle(ctx, -80 + i * 32, -110 - Math.abs(Math.sin(t * 4 + i)) * 60, 16, '#fff6b0');
    ctx.restore();
  };

  RV.lavaLamp = function (ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-30, -40); ctx.lineTo(-18, -200); ctx.lineTo(18, -200); ctx.lineTo(30, -40); ctx.closePath();
    fs(ctx, '#ff9e00', 4);
    ctx.save(); ctx.clip();
    for (let i = 0; i < 4; i++) { circle(ctx, Math.sin(t + i) * 8, -60 - RV.fract(t * 0.2 + i * 0.25) * 150, 12 + i * 2); fs(ctx, '#ff006e'); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-30, -40); ctx.lineTo(30, -40); ctx.lineTo(40, 0); ctx.closePath(); fs(ctx, '#caa04a', 4);
    ctx.beginPath(); ctx.moveTo(-18, -200); ctx.lineTo(-12, -230); ctx.lineTo(12, -230); ctx.lineTo(18, -200); ctx.closePath(); fs(ctx, '#caa04a', 4);
    ctx.restore();
  };

  RV.vinyl = function (ctx, x, y, r, t) {
    circle(ctx, x, y, r); fs(ctx, '#161616', 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) { circle(ctx, x, y, r * (0.4 + i * 0.1)); ctx.stroke(); }
    circle(ctx, x, y, r * 0.3); fs(ctx, '#e63946');
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(-r * 0.2, -3, r * 0.4, 6);
    ctx.restore();
    circle(ctx, x, y, r * 0.05); fs(ctx, '#fff');
  };

  RV.alarmClock = function (ctx, x, y, s, text, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const shake = Math.sin(t * 40) * 3;
    ctx.rotate(shake * 0.01);
    [-1, 1].forEach((sd) => { circle(ctx, sd * 90, -150, 40); fs(ctx, '#ffd23f', 6); });
    rrect(ctx, -170, -140, 340, 230, 40); fs(ctx, '#e63946', 6);
    rrect(ctx, -140, -110, 280, 150, 20); fs(ctx, '#0f1d18', 5);
    ctx.font = `92px ${RV.FONT.pixel}`; ctx.fillStyle = '#39ff9f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -30);
    [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(sd * 110, 90); ctx.lineTo(sd * 140, 130); ctx.lineWidth = 16; ctx.strokeStyle = OUT; ctx.stroke(); });
    ctx.restore();
  };

  RV.retroTV = function (ctx, x, y, w, h, drawScreen) {
    ctx.save(); ctx.translate(x, y);
    rrect(ctx, -w / 2 - 50, -h / 2 - 50, w + 240, h + 100, 50); fs(ctx, '#8d5a3b', 7);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < 10; i++) ctx.fillRect(-w / 2 - 40, -h / 2 - 40 + i * (h + 80) / 10, w + 220, 4);
    rrect(ctx, -w / 2, -h / 2, w, h, 40); fs(ctx, '#111', 6);
    ctx.save(); rrect(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 34); ctx.clip();
    ctx.translate(-w / 2 + 14, -h / 2 + 14);
    drawScreen(ctx, w - 28, h - 28);
    ctx.restore();
    ctx.save(); rrect(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 34); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = -h / 2; yy < h / 2; yy += 6) ctx.fillRect(-w / 2, yy, w, 2);
    const g = ctx.createRadialGradient(0, 0, h * 0.3, 0, 0, h * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
    // knobs
    [[w / 2 + 95, -h / 2 + 90], [w / 2 + 95, -h / 2 + 220]].forEach(([kx, ky]) => { circle(ctx, kx, ky, 38); fs(ctx, '#e9c46a', 5); ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx, ky - 30); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(); });
    rrect(ctx, w / 2 + 55, h / 2 - 150, 80, 110, 10); fs(ctx, '#5a3825', 4);
    // antenna
    ctx.beginPath(); ctx.moveTo(40, -h / 2 - 50); ctx.lineTo(-120, -h / 2 - 260); ctx.moveTo(40, -h / 2 - 50); ctx.lineTo(220, -h / 2 - 250);
    ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.restore();
  };
})(globalThis.RV);
