'use strict';
// Woman: scenes 8-10. The bionic eye (after Saul Bass), pasta and hot springs, interesting things.

// Iris with optional machinery: counter-rotating rings, aperture blades and a red core.
function irisMech(cx, cy, R, t, bio, pupil) {
  if (bio <= 0) {
    ctx.drawImage(TEX.iris, cx - R, cy - R, R * 2, R * 2);
  } else {
    const bands = [[0, 0.56, 0.35], [0.56, 0.79, -0.55], [0.79, 1.02, 0.25]];
    bands.forEach(([r0, r1, sp]) => {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * r1, 0, TAU); ctx.arc(cx, cy, R * r0, 0, TAU, true); ctx.clip();
      ctx.translate(cx, cy); ctx.rotate(sp * bio * (t - 19.2) * 1.4); ctx.drawImage(TEX.iris, -R, -R, R * 2, R * 2); ctx.restore();
    });
    ctx.save(); ctx.globalAlpha = bio;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = Math.max(1, R * 0.018);
    [0.56, 0.79].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, R * r, 0, TAU); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(0.6, R * 0.006); ctx.beginPath();
    for (let i = 0; i < 90; i++) { const a = i / 90 * TAU - t * 0.6, r1 = R * 0.8, r2 = R * (i % 5 ? 0.84 : 0.88); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); }
    ctx.stroke(); ctx.restore();
  }
  // pupil or aperture
  const pr = R * pupil;
  ctx.fillStyle = '#020202'; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.fill();
  if (bio > 0) {
    const n = 8, ap = pr * (0.55 + 0.25 * pulse(t, 7)), rot = t * 0.9, v = [];
    for (let i = 0; i < n; i++) { const a = rot + i * TAU / n; v.push([cx + Math.cos(a) * ap, cy + Math.sin(a) * ap]); }
    ctx.save(); ctx.globalAlpha = bio; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.clip();
    ctx.fillStyle = '#1a1a1a'; ctx.fill();
    ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = Math.max(0.8, R * 0.008); ctx.beginPath();
    for (let i = 0; i < n; i++) { const p = v[(i + n - 1) % n], q = v[i], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] + dx / d * pr * 2, q[1] + dy / d * pr * 2); }
    ctx.stroke();
    ctx.beginPath(); v.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ap); g.addColorStop(0, '#fff1e4'); g.addColorStop(0.3, RED_HOT); g.addColorStop(1, '#8a0b0b');
    ctx.fillStyle = g; ctx.fill(); ctx.restore();
    glow(cx, cy, R * 1.1, RED_HOT, 0.45 * bio, 'lighter');
  }
}

function sceneEye(t, lt) {
  const cx = 800, cy = 455;
  const open = eOut(inv(17.95, 18.35, t)) * (1 - Math.sin(Math.PI * inv(18.72, 18.86, t)) * 0.92);
  const bio = smooth(19.15, 19.5, t);
  // saccades: quick jumps between fixations, then locked on the viewer
  const fix = [[17.9, 90, 10], [18.28, -120, -18], [18.62, 60, 24], [19.02, 0, 0]];
  let gx = 0, gy = 0;
  for (let i = 0; i < fix.length; i++) if (t >= fix[i][0]) { const k = eOut(inv(fix[i][0], fix[i][0] + 0.06, t)), p = fix[Math.max(0, i - 1)]; gx = lerp(p[1], fix[i][1], k); gy = lerp(p[2], fix[i][2], k); }
  ctx.drawImage(TEX.skin, -40, -40, W + 80, H + 80);
  const sock = ctx.createRadialGradient(cx, cy, 200, cx, cy, 900); sock.addColorStop(0, 'rgba(0,0,0,0.55)'); sock.addColorStop(0.5, 'rgba(0,0,0,0.1)'); sock.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = sock; ctx.fillRect(-40, -40, W + 80, H + 80);
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.ellipse(cx + 40, cy - 250, 620, 90, -0.04, 0, TAU); ctx.fill();
  // eyebrow hairs
  ctx.strokeStyle = 'rgba(12,12,12,0.85)'; ctx.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const s = hash(i * 1.3), x = 250 + s * 1150, y = 120 - Math.sin(s * Math.PI) * 60 + hash(i * 2.9) * 44, a = -0.35 + s * 0.55 + (hash(i * 5.1) - 0.5) * 0.3, L = 34 + hash(i * 7.3) * 40;
    ctx.lineWidth = 1.5 + hash(i) * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.6, y - 10 + Math.sin(a) * L * 0.6, x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
  }
  const hw = 580, up = 250 * open, lo = 175 * open;
  const almond = () => { ctx.beginPath(); ctx.moveTo(cx - hw, cy + 10); ctx.bezierCurveTo(cx - 300, cy - up * 1.25, cx + 260, cy - up * 1.3, cx + hw, cy - 20); ctx.bezierCurveTo(cx + 250, cy + lo * 1.2, cx - 290, cy + lo * 1.15, cx - hw, cy + 10); ctx.closePath(); };
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(cx - hw + 60, cy - 60); ctx.bezierCurveTo(cx - 280, cy - up * 1.25 - 110, cx + 250, cy - up * 1.3 - 120, cx + hw - 20, cy - 110); ctx.stroke();
  ctx.save(); almond(); ctx.clip();
  const sc = ctx.createRadialGradient(cx, cy, 120, cx, cy, hw); sc.addColorStop(0, '#e6e6e6'); sc.addColorStop(0.7, '#b0b0b0'); sc.addColorStop(1, '#5c5c5c');
  ctx.fillStyle = sc; ctx.fillRect(cx - hw, cy - 400, hw * 2, 800);
  ctx.strokeStyle = withA(RED, 0.35 + bio * 0.35); ctx.lineWidth = 1.2;
  for (let i = 0; i < 16; i++) { const side = i % 2 ? 1 : -1, y0 = cy + (hash(i) - 0.5) * 160; let x = cx + side * hw, y = y0; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 8; k++) { x -= side * (22 + hash(i * 9 + k) * 20); y += (hash(i * 3 + k) - 0.5) * 26; ctx.lineTo(x, y); } ctx.stroke(); }
  const ix = cx + gx, iy = cy + gy, R = 205, pupil = lerp(0.33, 0.2, smooth(18.9, 19.2, t)) + bio * 0.12;
  irisMech(ix, iy, R, t, bio, pupil);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(ix - 110, iy - 120, 64, 50, 10) : ctx.rect(ix - 110, iy - 120, 64, 50); ctx.fill();
  ctx.fillStyle = 'rgba(60,60,60,0.9)'; ctx.fillRect(ix - 80, iy - 120, 4, 50); ctx.fillRect(ix - 110, iy - 97, 64, 4);
  glow(ix + 90, iy + 80, 60, '#ffffff', 0.25);
  ctx.fillStyle = vgrad(cy - up * 0.9, cy - up * 0.2, [[0, 'rgba(0,0,0,0.85)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(cx - hw, cy - 400, hw * 2, 400);
  ctx.restore();
  almond(); ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 16; ctx.lineJoin = 'round'; ctx.stroke();
  // lashes along the upper lid, shorter ones along the lower
  const bez = (s, p0, p1, p2, p3) => { const u = 1 - s; return u * u * u * p0 + 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s * p3; };
  ctx.strokeStyle = '#050505'; ctx.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const s = 0.04 + i / 90 * 0.92, x = bez(s, cx - hw, cx - 300, cx + 260, cx + hw), y = bez(s, cy + 10, cy - up * 1.25, cy - up * 1.3, cy - 20);
    const L = (40 + hash(i * 3.7) * 55) * Math.sin(Math.PI * s) ** 0.5 * (0.3 + 0.7 * open), dir = (s - 0.5) * 1.3;
    ctx.lineWidth = 2.5 + hash(i) * 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dir * L * 0.2, y - L * 0.8, x + dir * L + 14, y - L * 0.9 - 8); ctx.stroke();
  }
  for (let i = 0; i < 46; i++) {
    const s = 0.12 + i / 46 * 0.8, x = bez(s, cx + hw, cx + 250, cx - 290, cx - hw), y = bez(s, cy - 20, cy + lo * 1.2, cy + lo * 1.15, cy + 10), L = (14 + hash(i * 5.3) * 22) * open;
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.quadraticCurveTo(x, y + L * 0.7, x - (s - 0.5) * 20, y + L); ctx.stroke();
  }
  // Vertigo spiral and targeting reticle once the eye goes bionic
  if (bio > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = withA(RED, 0.5 * bio); ctx.lineWidth = 3;
    for (let arm = 0; arm < 2; arm++) { ctx.beginPath(); for (let a = 0; a < 26; a += 0.05) { const r = 60 + a * 36 * (1 + inv(19.2, 20.6, t) * 0.5), th = a + t * 2.4 + arm * Math.PI; ctx.lineTo(ix + Math.cos(th) * r, iy + Math.sin(th) * r * 0.82); } ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = bio; ctx.strokeStyle = RED; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ix, iy, R + 40, 0, TAU); ctx.stroke(); ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.arc(ix, iy, R + 70, t, t + TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ix - R - 120, iy); ctx.lineTo(ix - R - 50, iy); ctx.moveTo(ix + R + 50, iy); ctx.lineTo(ix + R + 120, iy); ctx.moveTo(ix, iy - R - 120); ctx.lineTo(ix, iy - R - 50); ctx.moveTo(ix, iy + R + 50); ctx.lineTo(ix, iy + R + 120); ctx.stroke();
    ctx.restore();
    const ta = smooth(19.4, 19.7, t);
    cap('OPTIC MK-II  \u00b7  ZOOM 40\u00d7', 1540, 60, F.type(22), withA('#ffffff', 0.85 * ta), 'right');
    cap(`RANGE ${(12.4 + Math.sin(t * 3) * 0.5).toFixed(2)} M`, 1540, 90, F.type(22), withA('#ffffff', 0.85 * ta), 'right');
    cap('TARGET: INTERESTING THINGS', 1540, 120, F.type(22), withA(RED, ta), 'right');
  }
  lyric(LY.wl, t, { x: 80, y: 150, size: 110, align: 'left' });
  lyric([['BIONIC', 19.20, 'r'], ['EYEBALLS,', 19.84]], t, { x: W / 2, y: 850, size: 190, blur: 36 });
  FX.hal = 0.3; FX.bloom = 0.45;
}

// ---------- triptych ----------
function panelIris(w, h, t) {
  fillAll('#050505');
  irisMech(w / 2, h * 0.42, w * 0.62, t, 1, 0.32);
  const g = ctx.createRadialGradient(w / 2, h * 0.42, w * 0.3, w / 2, h * 0.42, w * 0.95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.9)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
function panelPasta(w, h, t, lt) {
  fillAll('#060606');
  glow(w / 2, h * 0.32, w * 1.1, '#ffffff', 0.14);
  const px = w / 2, py = h * 0.7, pr = w * 0.47;
  ctx.fillStyle = '#3c3c3c'; ctx.beginPath(); ctx.ellipse(px, py + 14, pr, pr * 0.32, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e2e2e2'; ctx.beginPath(); ctx.ellipse(px, py, pr, pr * 0.3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b4b4b4'; ctx.beginPath(); ctx.ellipse(px, py + 5, pr * 0.68, pr * 0.19, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, py, pr - 3, pr * 0.3 - 3, 0, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
  const noodle = (x0, y0, x1, y1, cx, cy) => {
    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
    ctx.strokeStyle = '#ece6d8'; ctx.lineWidth = 3.4; ctx.stroke();
  };
  ctx.save(); ctx.beginPath(); ctx.ellipse(px, py - 12, pr * 0.58, pr * 0.3, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = '#6a6a6a'; ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2); ctx.lineCap = 'round';
  for (let i = 0; i < 150; i++) {
    const a = hash(i * 1.7) * TAU, r = Math.sqrt(hash(i * 2.3)), x = px + Math.cos(a) * r * pr * 0.56, y = py - 12 + Math.sin(a) * r * pr * 0.28 - (1 - r) * 34;
    const L = 30 + hash(i * 5.1) * 40, b = hash(i * 7.7) * TAU;
    noodle(x, y, x + Math.cos(b) * L, y + Math.sin(b) * L * 0.4, x + Math.cos(b + 1) * L * 0.6, y + Math.sin(b + 1) * L * 0.3 - 8);
  }
  ctx.restore();
  ctx.fillStyle = '#ffffff'; for (let i = 0; i < 70; i++) { const a = hash(i * 9.1) * TAU, r = Math.sqrt(hash(i * 4.4)); ctx.fillRect(px + Math.cos(a) * r * pr * 0.5, py - 30 + Math.sin(a) * r * pr * 0.22 - (1 - r) * 20, 3, 2); }
  // the fork lifts a twirl, trailing strands and stretching cheese
  const lift = eOut(inv(20.7, 22.4, t)), bx = px + 6, by = py - 110 - lift * 170, spin = t * 5;
  for (let i = 0; i < 10; i++) {
    const x0 = bx + (hash(i * 3.1) - 0.5) * 56, x1 = px + (hash(i * 6.7) - 0.5) * pr * 0.6, sag = Math.sin(t * 2.4 + i) * 10;
    noodle(x0, by + 26, x1, py - 44, (x0 + x1) / 2 + sag, (by + py) / 2 + 30);
  }
  ctx.strokeStyle = 'rgba(255,252,244,0.85)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) { const x0 = bx - 20 + i * 7, x1 = px - 40 + i * 13; ctx.beginPath(); ctx.moveTo(x0, by + 30); ctx.bezierCurveTo(x0 + 4, by + 90, x1 - 4, py - 110, x1, py - 44); ctx.stroke(); }
  for (let k = 0; k < 14; k++) { const r = 30 + (k % 5) * 3; ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(bx, by, r, r * 0.55, Math.sin(spin + k) * 0.4 + k * 0.2, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#efe9dc'; ctx.lineWidth = 3.2; ctx.stroke(); }
  const fg = ctx.createLinearGradient(bx, by, bx + 40, by - 20); fg.addColorStop(0, '#5a5a5a'); fg.addColorStop(0.5, '#ffffff'); fg.addColorStop(1, '#6a6a6a');
  ctx.strokeStyle = fg; ctx.lineCap = 'round'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(bx + 22, by - 30); ctx.lineTo(bx + 200, by - 360); ctx.stroke();
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(bx + 22, by - 30); ctx.lineTo(bx + 6, by + 4); ctx.stroke();
  ctx.lineWidth = 3.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx - 6 + i * 6, by - 2); ctx.lineTo(bx - 14 + i * 7, by + 22); ctx.stroke(); }
  smoke(t, { x: px, y: py - 60, rate: 6, life: 3, vx: 0, vy: -70, spread: 70, turb: 90, s0: 100, s1: 300, alpha: 0.3, seed: 21 });
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 40; i++) { const ph = (lt * 0.5 + hash(i * 3.3)) % 1; ctx.globalAlpha = 0.9 * (1 - ph); ctx.fillRect(px - 130 + hash(i) * 260 + Math.sin(ph * 8 + i) * 8, ph * h * 0.62, 3, 2); }
  ctx.globalAlpha = 1;
}
function panelSprings(w, h, t, lt) {
  fillAll(vgrad(0, h, [[0, '#060606'], [0.5, '#2c2c2c'], [1, '#101010']]));
  stars(t, 50, h * 0.3, 0.5);
  [[0.05, 0.4, 0.55, '#3a3a3a'], [0.55, 0.26, 0.7, '#4a4a4a'], [0.95, 0.36, 0.5, '#353535']].forEach(([pxx, pyy, sp, col]) => {
    const tx = pxx * w, ty = pyy * h, bl = (pxx - sp * 0.7) * w, br = (pxx + sp * 0.7) * w, by = h * 0.64;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bl, by); ctx.lineTo(tx, ty); ctx.lineTo(br, by); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(br, by); ctx.lineTo(tx + (br - tx) * 0.15, by); ctx.fill();
    ctx.fillStyle = '#e4e4e4'; ctx.beginPath(); ctx.moveTo(tx, ty);
    const sl = (x, k) => [lerp(tx, x, k), lerp(ty, by, k)];
    const L = sl(bl, 0.32), R = sl(br, 0.3); ctx.lineTo(R[0], R[1]);
    for (let k = 1; k <= 5; k++) { const s = k / 6, x = lerp(R[0], L[0], s), y = lerp(R[1], L[1], s) + (k % 2 ? 18 : -4); ctx.lineTo(x, y); }
    ctx.lineTo(L[0], L[1]); ctx.closePath(); ctx.fill();
  });
  ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, h * 0.62, w, h);
  const cx = w / 2, cy = h * 0.8, rx = w * 0.47, ry = h * 0.1;
  const pool = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx); pool.addColorStop(0, '#7a7a7a'); pool.addColorStop(1, '#202020');
  ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fill();
  const bob = Math.sin(lt * 2.2) * 3, bx = cx + 10, byy = cy - 6 + bob;
  ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.ellipse(bx, byy, 78, 20, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx, byy - 16, 60, 22, 0, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx, byy - 70, 36, 44, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ececec'; ctx.beginPath(); ctx.ellipse(bx, byy - 108, 40, 17, -0.08, Math.PI, TAU); ctx.fill(); ctx.fillRect(bx - 40, byy - 110, 80, 9);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, byy - 70, 35, -2.6, -1.2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const k = (lt * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(bx, byy + 4, 80 + k * 140, 20 + k * 30, 0, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1;
  for (let i = 0; i < 12; i++) { const a = Math.PI * (0.02 + i * 0.087), x = cx + Math.cos(a) * (rx + 10), y = cy + Math.sin(a) * (ry + 8); ctx.fillStyle = '#060606'; ctx.beginPath(); ctx.ellipse(x, y, 30 + hash(i) * 20, 16, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#d4d4d4'; ctx.beginPath(); ctx.ellipse(x, y - 9, 24 + hash(i) * 14, 7, 0, Math.PI, TAU); ctx.fill(); }
  smoke(t, { x: cx, y: cy - 10, rate: 14, life: 3.4, vx: 8, vy: -90, spread: rx * 1.6, turb: 90, s0: 120, s1: 380, alpha: 0.42, seed: 13 });
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 70; i++) { const ph = (lt * 0.18 + hash(i * 7.1)) % 1, x = (hash(i) * w + Math.sin(ph * 6 + i) * 20); ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(x, ph * h, 1 + hash(i * 2) * 2, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
}
function sceneTriptych(t, lt) {
  fillAll('#000');
  const pw = 522, gap = 17, panels = [[panelIris, 20.62, 'BIONIC EYEBALLS', 1], [panelPasta, 20.70, 'CHEESY PASTA', 0], [panelSprings, 21.82, 'HOT SPRINGS', 0]];
  panels.forEach(([fn, at, capTxt, red], i) => {
    const k = inv(at - 0.02, at + 0.2, t); if (k <= 0) return;
    const x = i * (pw + gap), off = (1 - eExpo(k)) * H;
    ctx.save(); ctx.beginPath(); ctx.rect(x, 0, pw, H); ctx.clip(); ctx.translate(x, off);
    fn(pw, H, t, t - at);
    ctx.fillStyle = vgrad(H * 0.72, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.9)']]); ctx.fillRect(0, H * 0.72, pw, H * 0.28);
    ctx.restore();
    lyric([[capTxt, at, red ? 'r' : '']], t, { x: x + pw / 2 + (i - 1) * -30, y: 845, size: 92, maxW: pw - 110, dur: 0.2 });
  });
  const ak = (t - 21.38) / 0.16;
  if (ak > 0) slamWord('&', pw * 2 + gap * 1.5, 520, F.fell(330, true), RED, clamp(ak), { rot: -0.08 });
  FX.hal = 0.3;
}

// ---------- interesting things ----------
function profileShape(c, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-40, -265); c.bezierCurveTo(60, -275, 130, -220, 140, -150); c.bezierCurveTo(142, -125, 150, -105, 178, -72);
  c.lineTo(186, -58); c.bezierCurveTo(178, -46, 166, -42, 158, -38); c.bezierCurveTo(170, -30, 172, -22, 160, -14);
  c.bezierCurveTo(170, -6, 168, 2, 156, 6); c.bezierCurveTo(160, 22, 162, 40, 140, 58); c.bezierCurveTo(120, 74, 92, 80, 70, 90);
  c.lineTo(78, 240); c.bezierCurveTo(200, 262, 360, 310, 430, 470); c.lineTo(-470, 470); c.bezierCurveTo(-400, 300, -200, 262, -120, 240);
  c.bezierCurveTo(-110, 160, -100, 110, -110, 70); c.bezierCurveTo(-180, 40, -200, -60, -180, -150); c.bezierCurveTo(-160, -230, -110, -262, -40, -265);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(-176, -170, 62, 0, TAU); c.fill();
  c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(128 + i * 4, -104); c.quadraticCurveTo(142 + i * 5, -112 - i, 150 + i * 6, -106 - i * 2); c.stroke(); }
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-60 + i * 12, -250 + i * 3); c.bezierCurveTo(-120, -300 + i * 8, -200, -250, -150 - i * 6, -120 + i * 10); c.stroke(); }
}
function curioObj(i, s, t) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const metal = (a, b) => { const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, a); g.addColorStop(0.45, '#ffffff'); g.addColorStop(0.55, b); g.addColorStop(1, a); return g; };
  switch (i) {
    case 0: { ctx.fillStyle = '#d0d0d0'; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.55, 0, 0, TAU); ctx.fill(); irisMech(0, 0, s * 0.45, t, 1, 0.34); ctx.strokeStyle = '#111'; ctx.lineWidth = s * 0.08; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.55, 0, 0, TAU); ctx.stroke(); break; }
    case 1: { ctx.rotate(-0.5); ctx.fillStyle = metal('#3a3a3a', '#8a8a8a'); ctx.fillRect(-s * 1.1, -s * 0.16, s * 1.4, s * 0.32); ctx.fillRect(s * 0.25, -s * 0.24, s * 0.9, s * 0.48); ctx.fillStyle = '#111'; ctx.fillRect(s * 0.1, -s * 0.26, s * 0.1, s * 0.52); break; }
    case 2: { ctx.fillStyle = metal('#4a4a4a', '#9a9a9a'); ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#efefef'; ctx.beginPath(); ctx.arc(0, 0, s * 0.66, 0, TAU); ctx.fill(); ctx.fillRect(-s * 0.12, -s * 1.05, s * 0.24, s * 0.25);
      ctx.strokeStyle = '#111'; ctx.lineWidth = s * 0.04; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5); ctx.lineTo(Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6); ctx.stroke(); }
      ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 0.5) * s * 0.3, Math.sin(t * 0.5) * s * 0.3); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 6) * s * 0.5, Math.sin(t * 6) * s * 0.5); ctx.stroke(); ctx.strokeStyle = RED; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 12) * s * 0.55, Math.sin(t * 12) * s * 0.55); ctx.stroke(); break; }
    case 3: { const g = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 0, 0, 0, s * 0.8); g.addColorStop(0, '#f0f0f0'); g.addColorStop(1, '#3a3a3a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = s * 0.03; for (let k = 0; k < 6; k++) { const ph = (k / 6 + t * 0.15) % 1, x = Math.cos(ph * Math.PI) * s * 0.8; ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(x), s * 0.8, 0, 0, TAU); ctx.stroke(); } for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(0, k * s * 0.28, s * 0.8 * Math.cos(k * 0.35), s * 0.08, 0, 0, TAU); ctx.stroke(); } ctx.restore(); break; }
    case 4: { glow(0, -s * 0.15, s * 1.6, '#ffffff', 0.5, 'lighter'); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.55, 0, TAU); ctx.fill(); ctx.fillStyle = metal('#3a3a3a', '#7a7a7a'); ctx.fillRect(-s * 0.25, s * 0.3, s * 0.5, s * 0.4); ctx.strokeStyle = '#ff9a70'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.3); ctx.lineTo(-s * 0.1, -s * 0.2); ctx.lineTo(0, -s * 0.3); ctx.lineTo(s * 0.1, -s * 0.2); ctx.lineTo(s * 0.12, s * 0.3); ctx.stroke(); break; }
    case 5: { gearPath(0, 0, s * 0.8, 10, t * 1.2); ctx.fillStyle = metal('#3a3a3a', '#8a8a8a'); ctx.fill(); ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(0, 0, s * 0.25, 0, TAU); ctx.fill(); break; }
    case 6: { ctx.strokeStyle = metal('#4a4a4a', '#aaaaaa'); ctx.lineWidth = s * 0.14; ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.15, s * 0.5, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill(); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = s * 0.2; ctx.beginPath(); ctx.moveTo(s * 0.25, s * 0.25); ctx.lineTo(s * 0.8, s * 0.8); ctx.stroke(); break; }
    case 7: { ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = s * 0.1; ctx.beginPath(); for (let a = 0; a < 16; a += 0.1) { const r = s * 0.06 * Math.exp(a * 0.17); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = s * 0.02; for (let a = 1; a < 16; a += 0.5) { const r = s * 0.06 * Math.exp(a * 0.17); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1); ctx.stroke(); } break; }
    case 8: { ctx.scale(s / 60, s / 60); ctx.translate(-5, 15); lit(duckShape({ hat: { y: 0 } }), { rim: '#ffffff', dir: [1, -0.6], w: 1.5 }); break; }
  }
  ctx.restore();
}
function gearPath(cx, cy, r, teeth, rot) {
  ctx.beginPath();
  for (let i = 0; i < teeth * 4; i++) { const a = rot + i * TAU / (teeth * 4), rr = i % 4 < 2 ? r : r * 0.8; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  ctx.closePath();
}
function sceneCurio(t, lt) {
  fillAll('#040404');
  glow(820, 380, 900, '#ffffff', 0.12);
  motes(t, 90, 0, 0, W, H, 0.4, 17);
  const hx = 560, hy = 410, s = 1.12;
  const objs = Array.from({ length: 9 }, (_, i) => { const a = lt * 1.35 + i * TAU / 9; return { i, a, x: 620 + Math.cos(a) * 600, y: 330 + Math.sin(a) * 170, z: Math.sin(a) }; });
  const draw = o => { const k = (o.z + 1) / 2, sz = lerp(52, 104, k); ctx.save(); ctx.translate(o.x, o.y); ctx.globalAlpha = lerp(0.45, 1, k); curioObj(o.i, sz, t); ctx.restore(); };
  objs.filter(o => o.z < 0).forEach(draw);
  ctx.save(); ctx.translate(hx, hy); ctx.scale(s, s);
  lit(profileShape, { base: '#060606', rim: '#fff4ec', dir: [1, -0.2], w: 4, a: 1 });
  ctx.strokeStyle = '#cfcfcf'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(40, 70, 24, 0, TAU); ctx.stroke();
  glow(58, 58, 10, '#ffffff', 0.9, 'lighter');
  ctx.restore();
  objs.filter(o => o.z >= 0).forEach(draw);
  lyric(LY.they, t, { x: 1540, y: 170, size: 120, align: 'right' });
  lyric([['INTERESTING', 23.76, 'r']], t, { x: W / 2, y: 820, size: 250, maxW: 1480, blur: 40 });
  lyric([['THINGS!', 24.20]], t, { x: 1540, y: 560, size: 190, align: 'right' });
  FX.hal = 0.3;
}
