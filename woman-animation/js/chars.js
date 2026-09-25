'use strict';
// Woman: the cast. Silhouettes are drawn by shape functions (c, col) so they can be rim-lit.

const RB = [mkCanvas(4, 4), mkCanvas(4, 4), mkCanvas(4, 4)];
function rbCtx(i) {
  const c = RB[i]; if (c.width !== S.width || c.height !== S.height) { c.width = S.width; c.height = S.height; }
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  x.clearRect(0, 0, c.width, c.height); return x;
}
// Fill a silhouette, then add a rim of light: toward o.dir, or all the way round when o.dir is absent.
function lit(shape, o = {}) {
  const m = ctx.getTransform();
  ctx.save(); shape(ctx, o.base || INK); ctx.restore();
  if (!o.rim) return;
  const r = rbCtx(0), d = (o.w || 3) * KS;
  r.setTransform(m); r.save(); shape(r, o.rim); r.restore();
  r.globalCompositeOperation = 'destination-out';
  if (o.dir) { r.setTransform(new DOMMatrix([1, 0, 0, 1, -o.dir[0] * d, -o.dir[1] * d]).multiply(m)); r.save(); shape(r, '#000'); r.restore(); }
  else {
    // erosion = intersection of shifted copies; each copy is rendered whole first, because a
    // shape made of several fills would otherwise erase itself under destination-in.
    const e = rbCtx(1);
    [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].forEach(([dx, dy], i) => {
      const tmp = rbCtx(2);
      tmp.setTransform(new DOMMatrix([1, 0, 0, 1, dx * d, dy * d]).multiply(m)); tmp.save(); shape(tmp, '#000'); tmp.restore();
      e.globalCompositeOperation = i ? 'destination-in' : 'source-over'; e.drawImage(RB[2], 0, 0);
    });
    r.setTransform(1, 0, 0, 1, 0, 0); r.drawImage(RB[1], 0, 0);
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.a ?? 1; ctx.globalCompositeOperation = o.op || 'source-over';
  if (o.soft && HAS_FILTER) ctx.filter = `blur(${o.soft * KS}px)`;
  ctx.drawImage(RB[0], 0, 0); ctx.restore();
}

// ---------- the woman: feet at (0,0), 100 units tall, profile facing left into the wind ----------
function womanShape(p) {
  const t = p.t, w = p.wind ?? 1;
  return (c, col) => {
    c.fillStyle = col; c.strokeStyle = col;
    c.beginPath(); c.ellipse(4.4, -93.2, 3.9, 6.6, 0.3, 0, TAU); c.fill();
    for (let i = 0; i < 12; i++) {
      const sy = -97.6 + i * 0.9, sx = 3.1 + (i % 3) * 0.6, len = (19 + hash(i * 3.3) * 17) * (0.55 + 0.45 * w), pts = [];
      for (let k = 0; k <= 12; k++) {
        const s = k / 12, wave = Math.sin(t * 7.5 - s * 5.5 + i * 0.7) * s * (1.1 + 1.7 * w);
        pts.push([sx + s * len, sy + s * s * (5 + i * 0.8) * (1.25 - w * 0.55) + wave + s * i * 0.25]);
      }
      ribbon(c, pts, 2.4 - (i % 4) * 0.28, 0.1);
    }
    c.beginPath();
    c.moveTo(2.0, -100.0);
    c.bezierCurveTo(-1.8, -100.8, -4.2, -99.6, -4.6, -98.4);
    c.quadraticCurveTo(-5.4, -97.4, -5.6, -95.9);
    c.lineTo(-5.5, -95.2);
    c.quadraticCurveTo(-6.4, -94.1, -7.4, -92.9);
    c.quadraticCurveTo(-7.2, -92.3, -5.9, -92.3);
    c.quadraticCurveTo(-6.2, -92.0, -6.35, -91.5);
    c.lineTo(-5.95, -91.1);
    c.quadraticCurveTo(-6.4, -90.9, -6.2, -90.5);
    c.quadraticCurveTo(-5.6, -89.9, -5.8, -89.3);
    c.quadraticCurveTo(-5.6, -88.5, -4.4, -88.2);
    c.quadraticCurveTo(-3.0, -88.1, -2.5, -87.4);
    c.quadraticCurveTo(-2.2, -85.8, -3.4, -84.0);
    c.quadraticCurveTo(-7.0, -83.4, -9.6, -82.2);
    c.quadraticCurveTo(-10.9, -81.4, -10.8, -79.6);
    c.quadraticCurveTo(-11.9, -77.3, -11.2, -74.6);
    c.quadraticCurveTo(-9.8, -70.4, -6.4, -65.2);
    c.lineTo(-5.8, -63.4);
    c.quadraticCurveTo(-7.4, -60, -7.6, -55);
    c.quadraticCurveTo(-7.8, -46, -6.3, -36);
    c.quadraticCurveTo(-5.6, -29, -5.4, -22);
    c.quadraticCurveTo(-5.8, -14, -5.6, -7);
    const bill = 9 + 13 * w, f1 = Math.sin(t * 5.3) * 2.2 * w, f2 = Math.sin(t * 5.3 + 1.4) * 2.4 * w, f3 = Math.sin(t * 6.1 + 2.2) * 1.6 * w;
    const hx = bill + f1 + 4, hy = -9 - f3;
    for (let k = 1; k <= 7; k++) { const s = k / 7, x = lerp(-5.6, hx, s), y = lerp(-7, hy, s) + Math.sin(s * Math.PI * 3 + t * 6) * 0.9 * (0.5 + w); c.quadraticCurveTo(x - 1.1, y + 1.5, x, y); }
    c.bezierCurveTo(hx - 3 + f2, -22, 11 + f2 * 0.7 + 3 * w, -40, 8.8, -54);
    c.quadraticCurveTo(7.4, -60, 5.4, -63.4);
    c.quadraticCurveTo(5.9, -68, 7.2, -75);
    c.quadraticCurveTo(8.6, -80, 8.2, -81.6);
    c.quadraticCurveTo(6.8, -83.6, 3.6, -83.8);
    c.lineTo(3.4, -86.6);
    c.quadraticCurveTo(4.0, -88.6, 5.3, -90.4);
    c.quadraticCurveTo(6.7, -93, 5.6, -95.6);
    c.quadraticCurveTo(5.0, -99.2, 2.0, -100.0);
    c.closePath(); c.fill();
    // boots below the hem
    c.beginPath(); c.moveTo(-6.2, -7.5); c.lineTo(-6.3, -2.6); c.quadraticCurveTo(-8.8, -1.8, -9.9, -0.2); c.lineTo(-3.5, 0); c.lineTo(-3.3, -2.2); c.lineTo(-3.7, -7.5); c.fill();
    c.beginPath(); c.moveTo(-0.4, -8); c.lineTo(-0.7, -2.4); c.quadraticCurveTo(-2.6, -1.5, -3.4, 0.2); c.lineTo(2.4, 0.1); c.lineTo(2.5, -2.2); c.lineTo(2.0, -8); c.fill();
    // one hand holds the hat against the wind, the other hangs loose
    limb(c, [[-9, -81], [-14.4, -87.8], [-9.8, -97.6]], [3.0, 2.3]);
    c.beginPath(); c.ellipse(-9.3, -98.5, 1.5, 2.0, 0.4, 0, TAU); c.fill();
    limb(c, [[7.6, -80.4], [9.9 + Math.sin(t * 3) * 0.3, -68.4], [10.8 + Math.sin(t * 3.4) * 0.5, -57.6]], [2.8, 2.2]);
    c.beginPath(); c.ellipse(11, -55.8, 1.25, 2.1, 0, 0, TAU); c.fill();
    c.save(); c.translate(0, -100.2); c.rotate(-0.07);
    c.beginPath(); c.moveTo(-13.6, 1.2); c.bezierCurveTo(-11, -0.9, 9, -2.3, 14.2, -2.9); c.bezierCurveTo(10, -0.5, -9, 2.0, -13.6, 1.2); c.fill();
    c.beginPath(); c.moveTo(-6.4, 0.4); c.bezierCurveTo(-6.8, -3.8, -5.4, -6.3, -3.3, -6.5); c.quadraticCurveTo(-1.1, -5.5, 0.9, -6.8); c.bezierCurveTo(3.5, -7.2, 6.0, -5.0, 6.6, -0.9); c.closePath(); c.fill();
    c.restore();
  };
}
// Back view, walking away. walk = stride phase.
function womanBackShape(p) {
  const t = p.t, wk = p.walk, sw = Math.sin(wk), w = p.wind ?? 0.4;
  return (c, col) => {
    c.fillStyle = col; c.strokeStyle = col;
    c.beginPath(); c.ellipse(0, -93.4, 5.3, 6.8, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-5.4, -97); c.bezierCurveTo(-7.4, -88, -6.6, -80, -4.6, -71.5);
    c.quadraticCurveTo(0, -69.5 + Math.sin(t * 4) * 0.5, 4.8 + w * 2.5, -71); c.bezierCurveTo(7.2 + w, -80, 7.4, -89, 5.4, -97); c.fill();
    c.beginPath(); c.moveTo(-3.2, -84); c.quadraticCurveTo(-8.4, -83.6, -10.2, -81.2); c.quadraticCurveTo(-10.8, -78, -9.6, -74);
    c.quadraticCurveTo(-7.2, -68, -5.8, -63.4); c.quadraticCurveTo(-8.6, -52, -10.6 - sw * 1.2, -8);
    for (let k = 1; k <= 6; k++) { const s = k / 6, x = lerp(-10.6 - sw * 1.2, 10.6 - sw * 1.2, s), y = -8 + Math.sin(s * TAU * 1.5 + t * 5) * 0.8; c.quadraticCurveTo(x - 1.4, y + 1.2, x, y); }
    c.quadraticCurveTo(8.6, -52, 5.8, -63.4); c.quadraticCurveTo(7.2, -68, 9.6, -74); c.quadraticCurveTo(10.8, -78, 10.2, -81.2);
    c.quadraticCurveTo(8.4, -83.6, 3.2, -84); c.closePath(); c.fill();
    const lift = s => Math.max(0, s) * 2.6;
    [[-3.2, sw], [3.2, -sw]].forEach(([x, s]) => { c.beginPath(); c.moveTo(x - 1.4, -8.5); c.lineTo(x - 1.2, -lift(s) - 1); c.lineTo(x + 1.5, -lift(s) - 1); c.lineTo(x + 1.3, -8.5); c.fill(); c.beginPath(); c.ellipse(x + 0.1, -lift(s) - 0.4, 1.6, 1.0, 0, 0, TAU); c.fill(); });
    limb(c, [[-9.4, -80], [-11.4 - sw * 1.2, -68], [-11.2 - sw * 2.4, -56]], [2.7, 2.1]);
    limb(c, [[9.4, -80], [11.4 + sw * 1.2, -68], [11.2 + sw * 2.4, -56]], [2.7, 2.1]);
    c.beginPath(); c.ellipse(0, -99.6, 12.6, 1.9, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-5.9, -100); c.bezierCurveTo(-6.2, -104.5, -3.5, -106.8, 0, -106.4); c.bezierCurveTo(3.5, -106.8, 6.2, -104.5, 5.9, -100); c.closePath(); c.fill();
  };
}
// The red scarf: two tails that twist as they fly, darker on the underside of each twist.
function scarf(c, p, root, dirx = 1) {
  const t = p.t, w = p.wind ?? 1;
  c.save();
  c.fillStyle = RED; c.beginPath(); c.ellipse(root[0] - 0.4 * dirx, root[1] - 1.2, 4.2, 1.6, 0.1 * dirx, 0, TAU); c.fill();
  for (let r = 0; r < 2; r++) {
    const n = 16, len = (r ? 17 : 23) * (0.6 + 0.4 * w), pts = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      pts.push([root[0] + dirx * s * len, root[1] + s * (r ? 4 : 2.2) * (1.4 - w) + Math.sin(t * 8.5 - s * 6 + r * 1.7) * s * (1.2 + 0.8 * w) + s * s * (1.5 - w) * 6]);
    }
    for (let i = 0; i < n; i++) {
      const s = i / n, tw = Math.cos(s * 5 + t * 6 + r * 2), wd = 2.4 * (0.25 + 0.75 * Math.abs(tw)) * (1 - s * 0.35);
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl * wd / 2, ny = dx / dl * wd / 2;
      c.fillStyle = tw > 0 ? RED : RED_DEEP;
      c.beginPath(); c.moveTo(x0 + nx, y0 + ny); c.lineTo(x1 + nx, y1 + ny); c.lineTo(x1 - nx, y1 - ny); c.lineTo(x0 - nx, y0 - ny); c.closePath(); c.fill();
    }
  }
  c.restore();
}

// ---------- the man ----------
// Back view walking away with a guitar case. Feet at (0,0), 100 units tall.
function manBackShape(p) {
  const wk = p.walk, sw = Math.sin(wk);
  return (c, col) => {
    c.fillStyle = col; c.strokeStyle = col;
    c.beginPath(); c.ellipse(0, -92.4, 5.8, 7, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(0.3, -98.2, 6.3, 3.7, -0.06, 0, TAU); c.fill();
    [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * 5.8, -92.2, 1.2, 2.1, 0, 0, TAU); c.fill(); });
    c.fillRect(-2.8, -87.4, 5.6, 4.4);
    c.beginPath(); c.moveTo(-3, -84.8); c.quadraticCurveTo(-9.6, -84.2, -11.7, -81.2); c.quadraticCurveTo(-12.6, -78.4, -12.2, -74);
    c.lineTo(-9.8, -60); c.quadraticCurveTo(-11, -46, -11.8 - sw * 0.8, -31);
    c.lineTo(-0.6, -31.5); c.lineTo(0, -37); c.lineTo(0.6, -31.5); c.lineTo(11.8 - sw * 0.8, -31);
    c.quadraticCurveTo(11, -46, 9.8, -60); c.lineTo(12.2, -74); c.quadraticCurveTo(12.6, -78.4, 11.7, -81.2); c.quadraticCurveTo(9.6, -84.2, 3, -84.8); c.closePath(); c.fill();
    [[-4.3, sw], [4.3, -sw]].forEach(([x, s]) => {
      const lift = Math.max(0, s) * 3.2;
      c.beginPath(); c.moveTo(x - 2.6, -33); c.lineTo(x - 2.1, -lift - 1.5); c.lineTo(x + 2.2, -lift - 1.5); c.lineTo(x + 2.5, -33); c.fill();
      c.beginPath(); c.moveTo(x - 2.4, -lift - 3); c.lineTo(x - 2.3, -lift); c.lineTo(x + 2.4, -lift); c.lineTo(x + 2.2, -lift - 3); c.fill();
    });
    limb(c, [[-11.2, -79], [-12.6 - sw * 1.5, -66], [-12.4 - sw * 3, -53]], [3.4, 2.8]);
    c.beginPath(); c.ellipse(-12.4 - sw * 3, -51.6, 1.5, 2.2, 0, 0, TAU); c.fill();
    limb(c, [[11.2, -79], [12.8, -66], [13.2, -53]], [3.4, 2.8]);
    c.save(); c.translate(13.4, -51.5); c.rotate(Math.sin(wk * 2) * 0.05);
    c.fillRect(-0.9, -1.5, 1.8, 3.5);
    c.beginPath(); c.ellipse(1.6, 12, 5.4, 7.6, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(1.6, 27, 7.2, 9.6, 0, 0, TAU); c.fill();
    c.fillRect(-3, 11, 9.2, 16);
    c.restore();
  };
}
// Stage profile facing left, singing into the microphone. Local pixels, head centre at (0,0).
function manStageShape(p) {
  return (c, col) => {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-40, 150); c.bezierCurveTo(-90, 175, -150, 205, -178, 262); c.bezierCurveTo(-204, 320, -218, 420, -224, 720);
    c.lineTo(340, 720); c.bezierCurveTo(330, 470, 300, 300, 224, 230); c.bezierCurveTo(172, 186, 124, 170, 88, 150); c.closePath(); c.fill();
    c.save(); c.translate(20, 140); c.rotate(p.nod); c.translate(-20, -140);
    c.beginPath();
    c.moveTo(-58, -112);
    c.bezierCurveTo(-64, -96, -66, -78, -66, -62);
    c.bezierCurveTo(-67, -52, -72, -46, -73, -40);
    c.quadraticCurveTo(-71, -34, -70, -30);
    c.bezierCurveTo(-80, -14, -94, 2, -99, 10);
    c.bezierCurveTo(-99, 16, -92, 20, -80, 21);
    c.quadraticCurveTo(-76, 24, -79, 32);
    c.quadraticCurveTo(-82, 36, -79, 39);
    c.lineTo(-70, 43 + p.mouth * 2); c.lineTo(-76, 49 + p.mouth * 5);
    c.quadraticCurveTo(-80, 55 + p.mouth * 5, -76, 60 + p.mouth * 4);
    c.bezierCurveTo(-72, 64, -73, 70, -78, 80);
    c.bezierCurveTo(-76, 92, -62, 98, -40, 100);
    c.bezierCurveTo(-20, 102, -10, 106, -8, 116);
    c.bezierCurveTo(-18, 126, -26, 136, -24, 146);
    c.lineTo(-42, 162); c.lineTo(96, 162);
    c.bezierCurveTo(84, 130, 80, 100, 86, 80);
    c.bezierCurveTo(104, 50, 110, 10, 104, -30);
    c.bezierCurveTo(100, -70, 88, -110, 60, -140);
    c.bezierCurveTo(30, -168, -20, -182, -56, -172);
    c.bezierCurveTo(-84, -162, -97, -141, -86, -126);
    c.bezierCurveTo(-78, -117, -67, -116, -58, -112);
    c.closePath(); c.fill();
    c.restore();
  };
}
// Dreadnought guitar, body centre at (0,0), neck toward +x. Local pixels.
function guitarShape(c, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(210, -30); c.bezierCurveTo(205, -122, 170, -152, 110, -152); c.bezierCurveTo(40, -152, 10, -128, -40, -132);
  c.bezierCurveTo(-110, -138, -150, -198, -222, -196); c.bezierCurveTo(-282, -192, -302, -100, -302, 0);
  c.bezierCurveTo(-302, 100, -282, 192, -222, 196); c.bezierCurveTo(-150, 198, -110, 138, -40, 132);
  c.bezierCurveTo(10, 128, 40, 152, 110, 152); c.bezierCurveTo(170, 152, 205, 122, 210, 30); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(200, -28); c.lineTo(648, -23); c.lineTo(648, 23); c.lineTo(200, 28); c.fill();
  c.beginPath(); c.moveTo(640, -26); c.lineTo(810, -38); c.quadraticCurveTo(822, 0, 810, 38); c.lineTo(640, 26); c.fill();
  for (let i = 0; i < 3; i++) { const x = 680 + i * 44; c.fillRect(x - 6, -50, 12, 14); c.fillRect(x - 6, 36, 12, 14); }
}

// ---------- the duck: a mallard drake in profile facing right, waterline at y = 0, 100 units long ----------
function duckShape(p) {
  const flip = p.flip ?? 1, land = !!p.land, wk = p.walk || 0;
  return (c, col) => {
    c.fillStyle = col; c.strokeStyle = col;
    c.beginPath();
    c.moveTo(-49, -4); c.quadraticCurveTo(-44, -8, -38, -11);
    c.bezierCurveTo(-26, -17, -2, -19, 14, -17);
    c.bezierCurveTo(20, -16.5, 22, -19, 22.5, -24);
    c.lineTo(23, -32); c.lineTo(34, -32);
    c.bezierCurveTo(33.4, -26, 34, -22, 35, -20);
    c.bezierCurveTo(39, -15, 41, -8, 39, -2);
    if (land) { c.bezierCurveTo(36, 8, 20, 11, 0, 10); c.bezierCurveTo(-24, 9, -40, 4, -49, -4); }
    else { c.quadraticCurveTo(37, 1, 33, 1.5); c.lineTo(-40, 1.5); c.quadraticCurveTo(-46, 0.5, -49, -4); }
    c.closePath(); c.fill();
    c.lineWidth = 1.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-41, -10); c.bezierCurveTo(-43, -16, -36.5, -18, -36, -13.6); c.stroke();
    if (land) {
      [[-4, Math.sin(wk)], [8, -Math.sin(wk)]].forEach(([x, s]) => {
        const fx = x + s * 5, fy = 22 - Math.max(0, s) * 3;
        c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, 8); c.lineTo(fx, fy); c.stroke();
        c.beginPath(); c.moveTo(fx - 2, fy); c.lineTo(fx + 9, fy + 1.5); c.lineTo(fx + 8, fy - 1.8); c.closePath(); c.fill();
      });
    }
    c.save(); c.translate(28.5, -36); c.scale(flip, 1); c.translate(-28.5, 36);
    c.beginPath();
    c.moveTo(23, -30); c.bezierCurveTo(23, -34, 21, -37, 22, -41);
    c.bezierCurveTo(23, -47, 28, -51, 33, -50.5); c.bezierCurveTo(37, -50, 40, -48, 40.5, -45);
    c.bezierCurveTo(44, -44.2, 50, -43.2, 55, -41.2); c.quadraticCurveTo(57.5, -40.2, 56, -38.8);
    c.bezierCurveTo(52, -38.4, 46, -38.6, 41.5, -39.6); c.bezierCurveTo(39, -38.6, 37.5, -37, 36, -34.5);
    c.bezierCurveTo(34.8, -32, 34.2, -30.5, 34, -28); c.closePath(); c.fill();
    if (p.hat) {
      c.save(); c.translate(32, -49.6 + p.hat.y); c.rotate(-0.14 + (p.hat.r || 0));
      c.beginPath(); c.moveTo(-17, -1.2); c.quadraticCurveTo(-16, 1.4, -10, 1.6); c.bezierCurveTo(-4, 2.4, 6, 1.4, 12, 0.2); c.quadraticCurveTo(17, -0.6, 18, -3.6); c.quadraticCurveTo(14, -1.6, 10, -1.4); c.bezierCurveTo(4, -0.6, -6, -0.4, -12, -0.8); c.quadraticCurveTo(-15, -1, -17, -1.2); c.fill();
      c.beginPath(); c.moveTo(-7.6, -0.6); c.bezierCurveTo(-8.2, -6.4, -6, -9.6, -3.6, -9.8); c.quadraticCurveTo(-0.8, -8.4, 1.2, -10.2); c.bezierCurveTo(4.4, -10.4, 7.4, -7, 7.8, -1.2); c.closePath(); c.fill();
      c.restore();
    }
    c.restore();
  };
}
// Plumage detail over the silhouette: neck ring, bill, eye, speculum. a = how much front light reaches it.
function duckDetail(c, p, a) {
  const flip = p.flip ?? 1;
  c.save(); c.globalAlpha = a;
  c.fillStyle = grey(120); c.beginPath(); c.moveTo(-12, -13); c.bezierCurveTo(-2, -16, 10, -14, 16, -12); c.bezierCurveTo(8, -10, -4, -10, -12, -13); c.fill();
  c.fillStyle = grey(220); c.fillRect(-10, -12.6, 22, 0.7); c.fillRect(-9, -10.6, 20, 0.7);
  c.strokeStyle = grey(70); c.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-30 + i * 6, -9); c.quadraticCurveTo(-26 + i * 6, -3, -32 + i * 6, 0); c.stroke(); }
  c.save(); c.translate(28.5, -36); c.scale(flip, 1); c.translate(-28.5, 36);
  c.fillStyle = grey(235); c.beginPath(); c.moveTo(22.4, -31.5); c.quadraticCurveTo(28.5, -30.4, 34.4, -31.6); c.lineTo(34.6, -30.2); c.quadraticCurveTo(28.5, -29.1, 22.3, -30.1); c.fill();
  c.fillStyle = grey(175); c.beginPath(); c.moveTo(40.8, -44.6); c.bezierCurveTo(44, -43.9, 50, -42.9, 54.6, -41); c.quadraticCurveTo(56.2, -40.2, 55.2, -39.3); c.bezierCurveTo(51, -39, 46, -39.2, 41.6, -40.1); c.fill();
  c.fillStyle = '#000'; c.beginPath(); c.arc(35.2, -45.6, 1.3, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(35.6, -46, 0.45, 0, TAU); c.fill();
  c.restore(); c.restore();
}
// A tin star, pinned on at progress k (0..1) with a glint.
function tinStar(c, x, y, r, k, t) {
  if (k <= 0) return;
  const s = lerp(2.4, 1, eBack(clamp(k)));
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(0.18);
  c.beginPath(); for (let i = 0; i < 12; i++) { const rr = i % 2 ? r * 0.48 : r, a = -Math.PI / 2 + i * Math.PI / 6; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath();
  const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#fafafa'); g.addColorStop(0.45, '#8c8c8c'); g.addColorStop(0.55, '#e6e6e6'); g.addColorStop(1, '#5a5a5a');
  c.fillStyle = g; c.fill(); c.strokeStyle = '#2a2a2a'; c.lineWidth = r * 0.06; c.stroke();
  c.fillStyle = '#dcdcdc'; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.13, 0, TAU); c.fill(); }
  c.restore();
}
