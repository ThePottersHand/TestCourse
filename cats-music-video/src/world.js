/* World: backgrounds, sets and props from the Rusty the Dog and I'm Ben Again videos, all in 1920x1080
 * design space. This video uses the clouds, the tree and the fish; the kitchen is in src/kitchen.js. */
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

  // ---------------------------------------------------------------- houses, trees, fences
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
      fs(ctx, on ? '#ffe28a' : o.day ? '#bde0fe' : '#2d3350', 3.5);
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


  // ---------------------------------------------------------------- planets & space
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

  // ---------------------------------------------------------------- the backyard (from the Rusty video)
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


  // ---------------------------------------------------------------- signs & bubbles
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


  // ================================================================ from the Ben video
  const snowSky = ['#bfe3ff', '#e2f3ff', '#f7fcff'];
  RV.HOUSE_COLS = HOUSE_COLS;

  // ice cream cone; scoop 1 = full, 0 = licked clean
  RV.iceCream = function (ctx, x, y, s = 1, scoop = 1, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    if (scoop > 0) {
      circle(ctx, 0, -46, 26 * (0.6 + 0.4 * scoop)); fs(ctx, '#ff8fb1', 4);
      circle(ctx, -8, -52, 5); ctx.fillStyle = '#ffd1df'; ctx.fill();
      [[-10, -40, '#ffd23f'], [6, -58, '#4cc9f0'], [12, -40, '#06d6a0']].forEach(([a, b, c]) => { rrect(ctx, a, b, 7, 3, 1.5); ctx.fillStyle = c; ctx.fill(); });
    }
    ctx.beginPath(); ctx.moveTo(-24, -34); ctx.lineTo(24, -34); ctx.lineTo(0, 20); ctx.closePath(); fs(ctx, '#e9b872', 4);
    ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(6, 4); ctx.moveTo(4, -32); ctx.lineTo(14, -14); ctx.moveTo(-6, -32); ctx.lineTo(-14, -18);
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#b8864b'; ctx.stroke();
    ctx.restore();
  };

  // sunny suburban street; scroll moves the world left
  RV.dayStreet = function (ctx, t, scroll = 0) {
    RV.skyGradient(ctx, ['#44b0ff', '#86d0ff', '#d8f3ff']);
    glow(ctx, 1640, 140, 280, '#fff3b0', 0.8);
    circle(ctx, 1640, 140, 70); fs(ctx, '#ffd23f', 5);
    const cl = (x0, sp) => ((x0 - t * sp - scroll * 0.08) % 2600 + 2600) % 2600 - 300;
    RV.cloud(ctx, cl(300, 40), 170, 1.1);
    RV.cloud(ctx, cl(1400, 25), 110, 0.8);
    RV.cloud(ctx, cl(2200, 32), 230, 0.7);
    ctx.fillStyle = '#9bd38a';
    curve(ctx, [[-300, 720], [300, 600], [800, 670], [1300, 590], [1800, 660], [2300, 610], [2300, 1100], [-300, 1100]], true, 0.6);
    fs(ctx, '#9bd38a', 4);
    for (let i = -2; i < 12; i++) {
      const base = Math.floor(scroll * 0.35 / 260);
      const idx = i + base;
      const x = idx * 260 - scroll * 0.35 + 100;
      const k = ((idx % 8) + 8) % 8;
      RV.house(ctx, x, 720, 150, 110, { color: RV.mix(HOUSE_COLS[k], '#cfe8ff', 0.35), lit: [0, 0, 0], day: true });
    }
    const gap = 560;
    for (let i = -1; i < 6; i++) {
      const base = Math.floor(scroll / gap);
      const idx = i + base;
      const x = idx * gap - scroll + 200;
      const k = ((idx * 3) % 8 + 8) % 8;
      RV.tree(ctx, x - 200, 860, 1.1, { t });
      RV.house(ctx, x + 60, 860, 290, 230, { color: HOUSE_COLS[k], lit: [0, 0, 0], day: true });
      RV.fence(ctx, x + 230, x + 380, 862, 70, '#ffffff', 3.5);
    }
    ctx.fillStyle = '#d9d4c7'; ctx.fillRect(-300, 860, W + 600, 80);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 3;
    for (let x = -((scroll) % 120) - 120; x < W + 120; x += 120) { ctx.beginPath(); ctx.moveTo(x, 862); ctx.lineTo(x - 30, 938); ctx.stroke(); }
    ctx.fillStyle = '#4a4f63'; ctx.fillRect(-300, 940, W + 600, 300);
    ctx.fillStyle = '#f7f3e3';
    for (let x = -((scroll * 1.0) % 220) - 220; x < W + 220; x += 220) { rrect(ctx, x, 1010, 120, 14, 7); ctx.fill(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-300, 860); ctx.lineTo(W + 300, 860); ctx.moveTo(-300, 940); ctx.lineTo(W + 300, 940); ctx.stroke();
  };

  RV.earth = function (ctx, x, y, r, t = 0, o = {}) {
    if (o.glow !== false) glow(ctx, x, y, r * 1.5, '#8fd3ff', 0.45);
    circle(ctx, x, y, r); fs(ctx, '#2d7dd2', Math.max(3, r * 0.03));
    ctx.save(); circle(ctx, x, y, r); ctx.clip();
    const spin = t * 0.15;
    ctx.fillStyle = '#57cc99';
    [[-0.35, -0.25, 0.42, 0.3, 0.4], [0.35, 0.2, 0.35, 0.45, -0.3], [-0.1, 0.55, 0.3, 0.18, 0.2], [0.55, -0.5, 0.22, 0.16, 0.6]].forEach(([dx, dy, a, b, rot], i) => {
      const xx = x + (((dx + spin + 1.2) % 2.4) - 1.2) * r;
      ellipse(ctx, xx, y + dy * r, a * r, b * r, rot); ctx.fill();
      ellipse(ctx, xx + a * r * 0.4, y + dy * r + b * r * 0.5, a * r * 0.5, b * r * 0.6, rot + i); ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    [[-0.5, -0.6, 0.35, 0.07], [0.2, -0.05, 0.4, 0.06], [-0.2, 0.35, 0.3, 0.06]].forEach(([dx, dy, a, b]) => {
      const xx = x + (((dx + spin * 1.6 + 1.2) % 2.4) - 1.2) * r;
      ellipse(ctx, xx, y + dy * r, a * r, b * r, -0.15); ctx.fill();
    });
    const sh = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r * 1.05);
    sh.addColorStop(0, 'rgba(255,255,255,0.12)'); sh.addColorStop(0.7, 'rgba(0,0,40,0)'); sh.addColorStop(1, 'rgba(0,0,40,0.4)');
    ctx.fillStyle = sh; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    circle(ctx, x, y, r); ctx.lineWidth = Math.max(3, r * 0.03); ctx.strokeStyle = OUT; ctx.stroke();
  };

  RV.sun = function (ctx, x, y, r, t = 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, r * 3.2, '#ffb703', 0.55);
    ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.4);
    ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 14; i++) {
      ctx.rotate(TAU / 14);
      ctx.beginPath(); ctx.moveTo(-r * 0.16, -r * 1.05); ctx.lineTo(0, -r * (1.45 + 0.08 * Math.sin(t * 6 + i))); ctx.lineTo(r * 0.16, -r * 1.05); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    circle(ctx, x, y, r); fs(ctx, '#ffcc33', Math.max(3, r * 0.04));
  };

  // spiral galaxy made of dots; o.arms, o.spin
  RV.galaxy = function (ctx, x, y, r, t = 0, o = {}) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, r * 0.55, '#ffe8b0', 0.9);
    glow(ctx, x, y, r * 1.15, '#9b5de5', 0.35);
    const arms = o.arms || 3, n = o.n || 900, spin = t * (o.spin || 0.25);
    const cols = ['#ffffff', '#bde0fe', '#ffc8dd', '#cdb4db', '#fff3b0'];
    for (let i = 0; i < n; i++) {
      const u = hash(i * 1.37), arm = i % arms;
      const d = Math.pow(u, 0.7) * r;
      const a = arm * TAU / arms + d / r * 5.2 + spin + (hash(i * 7.3) - 0.5) * 0.55;
      const px = x + Math.cos(a) * d + (hash(i * 3.1) - 0.5) * r * 0.06;
      const py = y + Math.sin(a) * d * 0.62 + (hash(i * 5.7) - 0.5) * r * 0.05;
      const sz = (0.6 + hash(i * 9.1) * 1.8) * Math.max(0.5, r / 500);
      ctx.fillStyle = cols[i % cols.length];
      ctx.globalAlpha = 0.5 + 0.5 * hash(i * 2.2);
      circle(ctx, px, py, sz); ctx.fill();
    }
    ctx.restore();
  };

  // grey moon ground with craters and the Earth hanging in a black sky
  RV.moonSurface = function (ctx, t, o = {}) {
    RV.skyGradient(ctx, ['#05030f', '#140b33', '#241452']);
    RV.stars(ctx, t, { n: 200, y1: 760, seed: 12 });
    RV.earth(ctx, o.earthX || 1560, o.earthY || 230, o.earthR || 120, t);
    ctx.fillStyle = '#b9b8c9';
    curve(ctx, [[-300, 760], [300, 720], [900, 770], [1500, 715], [2200, 760], [2200, 1300], [-300, 1300]], true, 0.6);
    fs(ctx, '#b9b8c9', 5);
    [[260, 860, 150, 34], [1180, 800, 110, 24], [1620, 930, 190, 40], [700, 1000, 130, 30], [1900, 820, 90, 20]].forEach(([cx, cy, a, b]) => {
      ellipse(ctx, cx, cy, a, b); fs(ctx, '#9695aa', 4);
      ellipse(ctx, cx, cy + b * 0.25, a * 0.8, b * 0.6); ctx.fillStyle = '#85849a'; ctx.fill();
    });
  };

  RV.fish = function (ctx, x, y, s, t, color = '#ff9f1c', dir = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const wag = Math.sin(t * 12) * 0.35;
    ctx.save(); ctx.translate(-38, 0); ctx.rotate(wag);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-34, -24); ctx.lineTo(-34, 24); ctx.closePath(); fs(ctx, color, 4);
    ctx.restore();
    ellipse(ctx, 0, 0, 46, 28); fs(ctx, color, 4);
    ctx.beginPath(); ctx.moveTo(-6, -26); ctx.quadraticCurveTo(-4, 0, -8, 26); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
    circle(ctx, 22, -6, 7); fs(ctx, '#ffffff', 2.5);
    circle(ctx, 24, -6, 3.5); fs(ctx, OUT);
    ctx.restore();
  };

  RV.seaBed = function (ctx, t, o = {}) {
    RV.skyGradient(ctx, ['#1aa3d9', '#0a6fa8', '#063f6b']);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x = 150 + i * 330 + Math.sin(t * 0.8 + i) * 50;
      const g = ctx.createLinearGradient(0, 0, 0, 900);
      g.addColorStop(0, 'rgba(200,245,255,0.22)'); g.addColorStop(1, 'rgba(200,245,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - 40, -50); ctx.lineTo(x + 60, -50); ctx.lineTo(x + 260, 950); ctx.lineTo(x + 60, 950); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#e9d8a6';
    curve(ctx, [[-300, 850], [400, 800], [1000, 840], [1600, 790], [2200, 830], [2200, 1300], [-300, 1300]], true, 0.6);
    fs(ctx, '#e9d8a6', 5);
    ctx.strokeStyle = '#d4bf85'; ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) { const x = hash(i * 3.3) * W, y = 880 + hash(i * 1.1) * 150; ctx.beginPath(); ctx.arc(x, y, 40, 3.5, 5.9); ctx.stroke(); }
    [[120, 860], [330, 830], [1500, 820], [1760, 850], [1880, 870]].forEach(([x, y], i) => {
      const hgt = 220 + hash(i) * 180;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 1; k <= 12; k++) { const yy = y - (k / 12) * hgt; ctx.lineTo(x + Math.sin(t * 2.2 + k * 0.7 + i) * 18 * (k / 12), yy); }
      ctx.lineWidth = 22; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke();
      ctx.lineWidth = 14; ctx.strokeStyle = i % 2 ? '#2a9d8f' : '#52b788'; ctx.stroke();
    });
    [[560, 850, '#ff70a6'], [1300, 830, '#ff9770'], [1680, 860, '#ffd670']].forEach(([x, y, c]) => {
      [[0, -40, 34], [-34, -20, 26], [30, -18, 28], [0, -80, 22]].forEach(([dx, dy, r]) => { circle(ctx, x + dx, y + dy, r); fs(ctx, c, 4); });
    });
    for (let i = 0; i < 3; i++) {
      const dir = i % 2 ? -1 : 1;
      const x = dir > 0 ? ((t * 260 + i * 800) % 2600) - 300 : W + 300 - ((t * 220 + i * 700) % 2600);
      RV.fish(ctx, x, 260 + i * 170 + Math.sin(t * 3 + i) * 20, 0.9 - i * 0.12, t + i, ['#ff9f1c', '#ffd23f', '#f15bb5'][i], dir);
    }
  };

  RV.jungle = function (ctx, t, o = {}) {
    RV.skyGradient(ctx, ['#b7e4c7', '#74c69d', '#2d6a4f']);
    ctx.fillStyle = '#40916c';
    for (let i = 0; i < 9; i++) {
      const x = i * 250 - 80, sw = Math.sin(t * 1.5 + i) * 10;
      rrect(ctx, x + sw * 0.2, 150, 44, 900, 20); fs(ctx, '#6f4e37', 4);
      [[0, 140, 150], [-100, 210, 110], [110, 200, 120]].forEach(([dx, dy, r]) => { circle(ctx, x + 22 + dx + sw, dy, r); fs(ctx, i % 2 ? '#2d6a4f' : '#40916c', 4); });
    }
    ctx.strokeStyle = '#1b4332'; ctx.lineWidth = 9;
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 290; ctx.beginPath(); ctx.moveTo(x, -20);
      ctx.quadraticCurveTo(x + Math.sin(t * 2 + i) * 40, 250, x + 20, 420 + hash(i) * 200); ctx.stroke();
    }
    ctx.fillStyle = '#6b4f2f'; ctx.fillRect(-300, 880, W + 600, 400);
    ctx.beginPath(); ctx.moveTo(-300, 880); ctx.lineTo(W + 300, 880); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    // ferns along the ground
    for (let i = 0; i < 14; i++) {
      const x = i * 150 - 40, y = 900;
      for (let k = -2; k <= 2; k++) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(k * 0.35 + Math.sin(t * 2 + i) * 0.05);
        ellipse(ctx, 0, -70, 22, 72); fs(ctx, k % 2 ? '#52b788' : '#40916c', 4);
        ctx.restore();
      }
    }
  };

  // big foreground leaf (for framing / hiding); ang points the tip
  RV.leaf = function (ctx, x, y, s, ang, color = '#2d6a4f') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(120, -140, 360, -120, 460, 0); ctx.bezierCurveTo(360, 120, 120, 140, 0, 0); ctx.closePath();
    fs(ctx, color, 6);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(450, 0);
    for (let i = 1; i < 7; i++) { ctx.moveTo(i * 60, 0); ctx.lineTo(i * 60 + 50, -60 + i * 4); ctx.moveTo(i * 60, 0); ctx.lineTo(i * 60 + 50, 60 - i * 4); }
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,40,20,0.45)'; ctx.stroke();
    ctx.restore();
  };

  RV.penguin = function (ctx, x, y, s, t, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face || 1), s);
    const wob = Math.sin(t * 8 + (o.seed || 0)) * 0.12;
    ctx.rotate(wob);
    ellipse(ctx, -18, -4, 20, 9); fs(ctx, '#ffb703', 4);
    ellipse(ctx, 18, -4, 20, 9); fs(ctx, '#ffb703', 4);
    ellipse(ctx, 0, -90, 62, 92); fs(ctx, '#22223b', 5);
    ellipse(ctx, 0, -80, 44, 74); fs(ctx, '#ffffff');
    ctx.save(); ctx.translate(-56, -90); ctx.rotate(0.3 + Math.sin(t * 10 + (o.seed || 0)) * 0.25);
    ellipse(ctx, 0, 30, 14, 44); fs(ctx, '#22223b', 4); ctx.restore();
    ctx.save(); ctx.translate(56, -90); ctx.rotate(-0.3 - Math.sin(t * 10 + (o.seed || 0)) * 0.25);
    ellipse(ctx, 0, 30, 14, 44); fs(ctx, '#22223b', 4); ctx.restore();
    circle(ctx, -16, -140, 9); fs(ctx, '#ffffff', 3); circle(ctx, -15, -139, 4.5); fs(ctx, OUT);
    circle(ctx, 16, -140, 9); fs(ctx, '#ffffff', 3); circle(ctx, 17, -139, 4.5); fs(ctx, OUT);
    ctx.beginPath(); ctx.moveTo(-12, -124); ctx.lineTo(0, -106); ctx.lineTo(12, -124); ctx.closePath(); fs(ctx, '#ffb703', 3.5);
    ctx.restore();
  };

  RV.iceFloe = function (ctx, t, o = {}) {
    RV.skyGradient(ctx, snowSky);
    [[300, 600, 260, 200], [1500, 610, 340, 260], [1000, 640, 180, 120]].forEach(([x, y, w, h]) => {
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w * 0.4, y - h); ctx.lineTo(x - w * 0.1, y - h * 0.7); ctx.lineTo(x + w * 0.3, y - h * 1.1); ctx.lineTo(x + w, y); ctx.closePath();
      fs(ctx, '#ffffff', 5);
      ctx.beginPath(); ctx.moveTo(x + w * 0.3, y - h * 1.1); ctx.lineTo(x + w, y); ctx.lineTo(x + w * 0.1, y); ctx.closePath(); ctx.fillStyle = '#cde7f7'; ctx.fill();
    });
    ctx.fillStyle = '#2b7bb9'; ctx.fillRect(-300, 600, W + 600, 700);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 5;
    for (let i = 0; i < 10; i++) {
      const x = ((hash(i) * 2400 + t * 40) % 2400) - 200, y = 640 + hash(i * 2.1) * 400;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 12, x + 60, y); ctx.quadraticCurveTo(x + 90, y + 12, x + 120, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-300, 600); ctx.lineTo(W + 300, 600); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    // the floe everyone stands on
    const bob = Math.sin(t * 2.4) * 6;
    ctx.beginPath();
    ctx.moveTo(-120, 850 + bob); ctx.lineTo(2040, 830 + bob); ctx.lineTo(2000, 960 + bob); ctx.lineTo(-80, 980 + bob); ctx.closePath();
    fs(ctx, '#e8f4fb', 6);
    ctx.fillStyle = '#b9dcef'; ctx.beginPath(); ctx.moveTo(-80, 930 + bob); ctx.lineTo(2010, 915 + bob); ctx.lineTo(2000, 960 + bob); ctx.lineTo(-80, 980 + bob); ctx.closePath(); ctx.fill();
    RV.snow(ctx, t, o.snow || 70);
  };
  RV.snow = function (ctx, t, n = 70) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < n; i++) {
      const x = ((hash(i * 1.7) * 2200 + Math.sin(t * 1.5 + i) * 40 - t * 60) % 2200 + 2200) % 2200 - 140;
      const y = ((hash(i * 4.1) * 1300 + t * (120 + hash(i) * 120)) % 1300) - 110;
      circle(ctx, x, y, 3 + hash(i * 2.9) * 5); ctx.fill();
    }
  };

  // theatre stage: dark backdrop, red curtains (o.open 0..1 pulls them back, o.blow flaps them, o.curtains
  // false leaves them off so a shot can draw them after the cast), spotlight
  RV.stage = function (ctx, t, o = {}) {
    RV.skyGradient(ctx, ['#12061f', '#261040', '#12061f']);
    ctx.fillStyle = '#5b3a29'; ctx.fillRect(-300, 860, W + 600, 400);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4;
    for (let i = 0; i < 26; i++) { const x = (i - 13) * 140; ctx.beginPath(); ctx.moveTo(W / 2 + x * 0.55, 860); ctx.lineTo(W / 2 + x * 1.6, H + 200); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-300, 860); ctx.lineTo(W + 300, 860); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    const sx = o.spotX || W / 2, on = o.spot == null ? 1 : o.spot;
    if (on > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, -100, 0, 900);
      g.addColorStop(0, `rgba(255,244,200,${0.05 * on})`); g.addColorStop(1, `rgba(255,244,200,${0.3 * on})`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(sx - 60, -100); ctx.lineTo(sx + 60, -100); ctx.lineTo(sx + 330, 900); ctx.lineTo(sx - 330, 900); ctx.closePath(); ctx.fill();
      ellipse(ctx, sx, 900, 340, 70); ctx.fillStyle = `rgba(255,244,200,${0.35 * on})`; ctx.fill();
      ctx.restore();
    }
    if (o.curtains !== false) RV.curtains(ctx, t, o);
  };
  RV.curtains = function (ctx, t, o = {}) {
    const open = o.open == null ? 0 : o.open, blow = o.blow || 0;
    [-1, 1].forEach((side) => {
      const edge = side < 0 ? lerp(430, -200, open) : lerp(W - 430, W + 200, open);
      const outer = side < 0 ? -300 : W + 300;
      ctx.beginPath();
      ctx.moveTo(outer, -60);
      ctx.lineTo(edge, -60);
      for (let k = 1; k <= 10; k++) {
        const yy = -60 + k * 120;
        const flap = Math.sin(t * 14 + k * 0.9) * blow * 60 * (k / 10) + side * blow * 140 * (k / 10);
        ctx.lineTo(edge + flap + Math.sin(k * 1.3) * 10, yy);
      }
      ctx.lineTo(outer, H + 100);
      ctx.closePath();
      fs(ctx, '#b3122e', 6);
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(80,0,20,0.45)'; ctx.lineWidth = 16;
      for (let k = 0; k < 6; k++) {
        const x = lerp(outer, edge, (k + 0.5) / 6);
        ctx.beginPath(); ctx.moveTo(x, -60); ctx.lineTo(x + Math.sin(t * 14 + k) * blow * 50 + side * blow * 90, H + 100); ctx.stroke();
      }
      ctx.restore();
    });
    // valance
    ctx.beginPath(); ctx.moveTo(-300, -60); ctx.lineTo(W + 300, -60); ctx.lineTo(W + 300, 90);
    for (let x = W + 300; x > -300; x -= 120) ctx.quadraticCurveTo(x - 60, 150, x - 120, 90);
    ctx.closePath();
    fs(ctx, '#8e0e25', 6);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6;
    ctx.beginPath();
    for (let x = W + 300; x > -300; x -= 120) { ctx.moveTo(x, 80); ctx.quadraticCurveTo(x - 60, 136, x - 120, 80); }
    ctx.stroke();
  };
})(globalThis.RV);
