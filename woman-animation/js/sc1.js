'use strict';
// Woman: scenes 1-3. The title under a spotlight, the long "Ohhhh" on the highway, the woman on the hill.

function sceneTitle(t, lt) {
  fillAll('#030303');
  const on = t < 0.39 ? 0 : (t < 0.55 ? (hash(Math.floor(t * 40)) > 0.4 ? 1 : 0.25) : 1);
  ctx.fillStyle = vgrad(600, H, [[0, '#050505'], [1, '#141414']]); ctx.fillRect(-60, 600, W + 120, H);
  if (on > 0) {
    ctx.save(); ctx.globalAlpha = on;
    glow(800, 700, 620, '#ffffff', 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.ellipse(800, 700, 560, 90, 0, 0, TAU); ctx.fill();
    ctx.restore();
    beam(800, -140, Math.PI / 2, 0.36, 1050, 0.28 * on, t, { haze: 10 });
    motes(t, 70, 520, 60, 560, 620, 0.5 * on, 3);
  }
  // the title stands on the stage floor, lit from above
  ctx.save(); ctx.font = F.disp(430); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
  const k = smooth(0.39, 0.7, t);
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.beginPath(); ctx.ellipse(800, 668, 560, 26, 0, 0, TAU); ctx.fill();
  const g = vgrad(330, 660, [[0, grey(255)], [0.45, grey(196)], [1, grey(70)]]);
  ctx.globalAlpha = 0.08 + 0.92 * k * on; ctx.fillStyle = g; ctx.fillText('WOMAN', 800, 662);
  ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = 0.5 * k * on; ctx.fillStyle = vgrad(330, 400, [[0, '#ffffff'], [1, 'rgba(255,255,255,0)']]); ctx.fillText('WOMAN', 800, 662);
  ctx.restore();
  const c2 = smooth(0.8, 1.2, t) * on;
  cap('SIDE A  \u00b7  161 B.P.M.', 800, 205, F.type(22), grey(200), 'center', c2, 6);
  cap('Vocal, with rhythm accompaniment', 800, 752, F.fell(34, true), grey(210), 'center', c2);
  ctx.fillStyle = withA(RED, c2); ctx.fillRect(740, 776, 120, 3);
  FX.light = [800, 60]; FX.rays = 0.45 * on; FX.rayR = 0.35; FX.exposure = 0.95 + 0.25 * pulse(t, 6) * on;
}

function sceneHighway(t, lt) {
  Object.assign(P3, { hz: 560, vx: 800, F: 760, camH: 1.25 });
  const hz = P3.hz, camZ = lt * 28;
  fillAll(vgrad(0, hz + 20, [[0, '#040404'], [0.45, '#262626'], [0.82, '#6d6d6d'], [1, '#a4a4a4']]));
  stars(t, 140, 300, 0.55);
  ctx.save(); ctx.globalAlpha = 0.85; ctx.drawImage(TEX.streak, -200 - lt * 14, 330, 2100, 190); ctx.restore();
  redSun(800, hz - 26, 150, { bands: 0.7, rays: 0.6, rayR: 0.45 });
  ctx.save(); ctx.globalAlpha = 0.55; ctx.drawImage(TEX.streak, -60 - lt * 26, 420, 1900, 120); ctx.restore();
  ridge(hz + 2, 95, 0.0032, 4.1, '#3a3a3a', { rim: { x: 800, w: 520, a: 0.55 } });
  // "OHHHHHH": monumental letters rising from behind the mountains while the note is held
  if (t > 1.82) {
    const n = Math.min(12, 1 + Math.floor((t - 1.82) / 0.29)), txt = 'O' + 'H'.repeat(n - 1), size = 215;
    ctx.font = F.disp(size); const cw = [...txt].map(ch => ctx.measureText(ch).width + 14), tot = cw.reduce((a, b) => a + b, 0);
    const sc = Math.min(1, 1300 / tot);
    const letters = (c, col) => {
      c.fillStyle = col; c.font = F.disp(size); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      let x = 800 - tot * sc / 2;
      [...txt].forEach((ch, i) => {
        const k = eOut(inv(0, 0.35, t - 1.82 - i * 0.29)), vib = smooth(2.6, 3.2, t) * Math.sin(t * 15 - i * 0.9) * 3;
        c.save(); c.translate(x, hz - 8 + (1 - k) * 300 + vib); c.scale(sc, sc); c.fillText(ch, 0, 0); c.restore();
        x += cw[i] * sc;
      });
    };
    lit(letters, { base: '#0b0b0b', rim: '#ff8a6a', w: 3, a: 0.9 });
  }
  ridge(hz + 16, 58, 0.006, 9.3, '#1a1a1a', { rim: { x: 800, w: 380, a: 0.35 } });
  fog(hz + 10, 26, 0.35, 170);
  // desert floor and the road, row by row in perspective
  for (let y = hz + 12; y < H + 40; y += 2) {
    const z = P3.camH * P3.F / (y - hz), zw = z + camZ, half = 3.6 * P3.F / z, hazeK = clamp(1 - (y - hz) / 140);
    const d = 14 + vnoise(zw * 0.25, 2) * 10 + hazeK * 60;
    ctx.fillStyle = grey(d); ctx.fillRect(-60, y, W + 120, 2);
    ctx.fillStyle = grey(10 + vnoise(zw * 0.8, 5) * 8 + hazeK * 55); ctx.fillRect(800 - half, y, half * 2, 2);
    const lw = Math.max(0.6, 0.13 * P3.F / z);
    ctx.fillStyle = grey(150 + hazeK * 60); ctx.fillRect(800 - half * 0.94 - lw / 2, y, lw, 2); ctx.fillRect(800 + half * 0.94 - lw / 2, y, lw, 2);
    if (((zw % 12) + 12) % 12 < 4) { ctx.fillStyle = grey(215); ctx.fillRect(800 - lw / 2, y, lw, 2); }
  }
  for (let k = 0; k < 40; k++) {
    const Z = ((k * 23.7 + hash(k) * 20 - camZ) % 920 + 920) % 920 + 3, X = (hash(k * 3.3) > 0.5 ? 1 : -1) * (7 + hash(k * 5.1) * 60);
    const s = pS(Z); if (Z < 3) continue;
    ctx.fillStyle = '#060606'; ctx.beginPath(); ctx.ellipse(pX(X, Z), pY(Z) - 0.3 * s, 0.9 * s, 0.4 * s, 0, 0, TAU); ctx.fill();
  }
  for (let k = 0; k < 14; k++) {
    const Z = ((k * 61 + hash(k * 9) * 30 - camZ) % 850 + 850) % 850 + 4, X = -(9 + hash(k * 2.2) * 34);
    saguaro(pX(X, Z), pY(Z), (5 + hash(k * 4.4) * 5) * pS(Z), k * 13.1, '#050505');
  }
  poles(camZ, 6.5, 45, 900, '#050505');
  shimmer(hz - 40, hz + 14, 2.2, t);
  FX.hal = 0.3; FX.bloom = 0.4;
}

function sceneHill(t, lt) {
  const sx = 1040, sy = 548;
  fillAll(vgrad(0, 700, [[0, '#0b0b0b'], [0.4, '#3a3a3a'], [0.78, '#9a9a9a'], [1, '#d0d0d0']]));
  ctx.save(); ctx.globalAlpha = 0.95; ctx.drawImage(TEX.cloud, -180 - lt * 10, 30, 2000, 520); ctx.restore();
  redSun(sx, sy, 235, { bands: 0.35, rays: 0.7, rayR: 0.5 });
  ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(TEX.streak, -100 - lt * 22, 470, 1900, 140); ctx.restore();
  ridge(690, 70, 0.004, 21, '#4a4a4a', { soft: true });
  fog(690, 40, 0.3, 190);
  // the hill, cresting where she stands
  const crest = x => x < sx ? 604 + ((sx - x) / 1120) ** 1.6 * 190 : 604 + ((x - sx) / 700) ** 1.8 * 120;
  ctx.fillStyle = '#070707'; ctx.beginPath(); ctx.moveTo(-80, H + 80);
  for (let x = -80; x <= W + 80; x += 10) ctx.lineTo(x, crest(x) + (vnoise(x * 0.05, 1) - 0.5) * 6);
  ctx.lineTo(W + 80, H + 80); ctx.fill();
  // grass along the crest, bending in gusts, backlit
  const blades = (col, off, lw) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for (let i = 0; i < 520; i++) {
      const x = 380 + i * 2.1 + hash(i) * 6; if (x > W + 60) break;
      const base = crest(x) + 4, h = 14 + hash(i * 3.3) ** 2 * 46 * (1 - Math.abs(x - sx) / 1200), g = Math.sin(t * 2.3 - x * 0.012) + 0.45 * Math.sin(t * 5.3 - x * 0.03 + i);
      const bend = (8 + g * 12) * (h / 40);
      ctx.moveTo(x + off, base); ctx.quadraticCurveTo(x + bend * 0.4 + off, base - h * 0.6, x + bend + off, base - h + Math.abs(bend) * 0.25 + off);
    }
    ctx.stroke();
  };
  blades('#060606', 0, 1.6); blades('rgba(255,220,205,0.35)', -0.9, 0.7);
  const wx = -120 + lt * 360; tumbleweed(wx, crest(wx) - 26 - Math.abs(Math.sin(lt * 5.2)) * 34, 24, lt * 6, 0.6);
  // the woman
  const s = 3.35 * (1 + lt * 0.012), p = { t, wind: 0.85 + 0.15 * Math.sin(t * 1.3) };
  ctx.save(); ctx.translate(sx, 606); ctx.scale(s, s);
  lit(womanShape(p), { base: '#050505', rim: '#fff0e6', w: 2.6, a: 0.95 });
  scarf(ctx, p, [-1.2, -85.2], 1);
  ctx.restore();
  // birds far off
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const bx = 250 + lt * 55 + i * 60 + hash(i) * 40, by = 190 + i * 22 + Math.sin(lt * 2 + i) * 5, f = Math.sin(t * 11 + i * 2) * 6; ctx.beginPath(); ctx.moveTo(bx - 11, by - f); ctx.quadraticCurveTo(bx - 5, by - 3, bx, by); ctx.quadraticCurveTo(bx + 5, by - 3, bx + 11, by - f); ctx.stroke(); }
  motes(t, 60, 0, 250, W, 520, 0.55, 7);
  lyric(LY.seen.slice(0, 3), t, { x: 90, y: 250, size: 118, align: 'left' });
  lyric(LY.seen.slice(3), t, { x: 90, y: 372, size: 118, align: 'left' });
  lyric(LY.woman, t, { x: 84, y: 640, size: 260, maxW: 800, align: 'left', blur: 40, tilt: 0.04 });
  FX.hal = 0.25; FX.bloom = 0.35;
}
