/* Timeline: which scene plays when, transitions, karaoke captions, and the post-processing pass. */
'use strict';

function snapBeat(t) {
  const b = beatInfo(t);
  const a = beatTime(b.i), n = beatTime(b.i + 1);
  return t - a < n - t ? a : n;
}

/* colour/lighting looks, blended across transitions */
const LOOKS = {
  night: { bloom: 0.5, bb: 0.8, bc: 2.3, g1: '#7c6cff', g2: '#ff9ec8', ga: 0.3, vig: 0.44 },
  under: { bloom: 0.46, bb: 0.82, bc: 2.2, g1: '#90ecff', g2: '#3c38b8', ga: 0.3, vig: 0.5 },
  room: { bloom: 0.4, bb: 0.76, bc: 2.4, g1: '#ffb46e', g2: '#6a5ad0', ga: 0.26, vig: 0.44 },
  kitchen: { bloom: 0.24, bb: 0.7, bc: 2.7, g1: '#ffcf8e', g2: '#b08aff', ga: 0.22, vig: 0.34 },
  day: { bloom: 0.2, bb: 0.7, bc: 2.7, g1: '#fff0c0', g2: '#ff9ecf', ga: 0.22, vig: 0.24 },
  pop: { bloom: 0.26, bb: 0.72, bc: 2.6, g1: '#fff0c0', g2: '#b08aff', ga: 0.18, vig: 0.3 },
  space: { bloom: 0.52, bb: 0.8, bc: 2.2, g1: '#8a7aff', g2: '#ff8fc0', ga: 0.26, vig: 0.46 },
};

/* [start, scene, transition-in, look] — starts are snapped to the nearest beat */
const SCENES = [
  [0, sIntro, 'cut', 'under'],
  [9.91, sPolish, 'iris', 'room'],
  [14.46, sCandles, 'wipe', 'room'],
  [17.8, sScroll, 'wipe', 'room'],
  [21.2, sTentacle, 'iris', 'room'],
  [24.85, sMoonBook, 'flash', 'pop'],
  [27.55, sClock, 'wipe', 'room'],
  [31.55, sHands, 'wipe', 'room'],
  [35.25, sUnsure, 'flash', 'pop'],
  [38.9, sStir, 'bubbles', 'under'],
  [39.9, sIdea, 'flash', 'pop'],
  [40.55, sC1a, 'star', 'night'],
  [44.4, sC1b, 'cut', 'night'],
  [48.0, sC1c, 'wipe', 'night'],
  [51.75, sC1d, 'flash', 'night'],
  [54.9, sC1e, 'iris', 'under'],
  [58.95, sDelivery, 'heart', 'day'],
  [61.6, sRobe, 'wipe', 'room'],
  [64.7, sTailor, 'wipe', 'day'],
  [68.5, sPlan, 'iris', 'room'],
  [72.0, sMabel, 'wipe', 'day'],
  [75.65, sStarsTide, 'flash', 'space'],
  [78.3, sSleep, 'iris', 'room'],
  [82.05, sKeyRhyme, 'star', 'space'],
  [85.85, sPaperweight, 'wipe', 'room'],
  [91.25, sC2a, 'star', 'night'],
  [94.8, sC2b, 'bubbles', 'under'],
  [98.5, sC2c, 'wipe', 'night'],
  [102.1, sC2d, 'flash', 'night'],
  [105.45, sC2e, 'iris', 'under'],
  [109.35, sBrunch, 'heart', 'day'],
  [113.1, sStories, 'wipe', 'day'],
  [116.9, sWorld, 'iris', 'space'],
  [120.1, sMat, 'cut', 'space'],
  [124.2, sRollCall, 'flash', 'pop'],
  [127.1, sF1, 'star', 'kitchen'],
  [130.7, sF2, 'bubbles', 'under'],
  [134.4, sF3, 'wipe', 'kitchen'],
  [138.55, sF4, 'flash', 'kitchen'],
  [141.45, sF5, 'wipe', 'kitchen'],
  [145.2, sF6, 'iris', 'night'],
  [150.7, sNoteWrite, 'heart', 'kitchen'],
  [153.4, sNoteSend, 'wipe', 'night'],
  [155.5, sNoteArrive, 'bubbles', 'under'],
  [159.6, sOutro1, 'heart', 'under'],
  [165.0, sOutro2, 'cut', 'night'],
  [174.4, sEnd, 'iris', 'under'],
].map(([t0, draw, tr, look], k) => ({ t0: k === 0 ? 0 : snapBeat(t0), draw, tr, look: LOOKS[look] }));

const TRANS = { cut: 0, iris: 0.42, star: 0.45, heart: 0.5, wipe: 0.38, flash: 0.3, bubbles: 0.6 };

function bubbleCircles(k) {
  const out = [];
  for (let i = 0; i < 24; i++) {
    const u = clamp(k * (0.75 + rnd(i, 302) * 0.5));
    out.push([rnd(i, 301) * W, lerp(H + 260, H * 0.15, u) - rnd(i, 303) * 200, lerp(10, 380 + rnd(i, 304) * 420, easeInCubic(u))]);
  }
  return out;
}
function transitionClip(c, kind, k) {
  const e = easeInCubic(k);
  c.beginPath();
  if (kind === 'iris') c.arc(W / 2, H / 2, 20 + e * 1150, 0, TAU);
  else if (kind === 'star') softStar(c, W / 2, H / 2, 20 + e * 2300, 5, -Math.PI / 2 + k, 0.5);
  else if (kind === 'heart') heartPath(c, W / 2, H / 2 + 100, 20 + e * 1900);
  else if (kind === 'bubbles') {
    bubbleCircles(k).forEach(([x, y, r]) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); });
    if (k > 0.86) c.rect(0, 0, W, H);
  } else if (kind === 'wipe') {
    const x = lerp(-500, W + 500, easeInOut(k));
    c.moveTo(-600, -20); c.lineTo(x + 220, -20); c.lineTo(x - 220, H + 20); c.lineTo(-600, H + 20); c.closePath();
  } else c.rect(0, 0, W, H);
  c.clip();
}
function transitionOverlay(c, kind, k) {
  if (kind === 'wipe') {
    const x = lerp(-500, W + 500, easeInOut(k));
    c.save();
    const g = c.createLinearGradient(x - 220, 0, x + 300, 0);
    g.addColorStop(0, '#ff8fc7'); g.addColorStop(0.5, '#ffd166'); g.addColorStop(1, '#8fe3b0');
    c.beginPath(); c.moveTo(x + 220, -20); c.lineTo(x + 300, -20); c.lineTo(x - 140, H + 20); c.lineTo(x - 220, H + 20); c.closePath();
    c.fillStyle = g; c.fill();
    c.beginPath(); c.moveTo(x + 218, -20); c.lineTo(x - 222, H + 20); c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke();
    for (let i = 0; i < 6; i++) { const u = rnd(i, 311); sparkle(c, lerp(x + 260, x - 180, u), lerp(-20, H + 20, u), 14 + 10 * rnd(i, 312), '#fff', k * 3); }
    c.restore();
  } else if (kind === 'iris' || kind === 'star' || kind === 'heart' || kind === 'bubbles') {
    c.save();
    const e = easeInCubic(k);
    c.beginPath();
    if (kind === 'iris') c.arc(W / 2, H / 2, 20 + e * 1150, 0, TAU);
    else if (kind === 'star') softStar(c, W / 2, H / 2, 20 + e * 2300, 5, -Math.PI / 2 + k, 0.5);
    else if (kind === 'heart') heartPath(c, W / 2, H / 2 + 100, 20 + e * 1900);
    else {
      c.globalAlpha = 1 - k * 0.6;
      bubbleCircles(k).forEach(([x, y, r]) => {
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = 3; c.strokeStyle = 'rgba(230,250,255,0.55)'; c.stroke();
        c.beginPath(); c.arc(x, y, r * 0.8, Math.PI * 1.1, Math.PI * 1.45); c.lineWidth = Math.max(3, r * 0.05); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
      });
      c.restore();
      return;
    }
    c.lineWidth = 26; c.strokeStyle = 'rgba(255,255,255,0.22)'; c.stroke();
    c.lineWidth = 8; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke();
    c.restore();
  } else if (kind === 'flash' && !REDUCED_MOTION) {
    c.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; c.fillRect(0, 0, W, H);
  }
}
function drawScene(sc, c, t) {
  c.save();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  sc.draw(c, t);
  c.restore();
}
function sceneIndexAt(t) {
  let i = SCENES.length - 1;
  while (i > 0 && SCENES[i].t0 > t) i--;
  return i;
}

/* ---------------- captions ---------------- */
const EXTRA_CAPTIONS = [[163.95, 165.3, '(ancient one)']];
const capCache = new Map();
const CAP = 58;
function captionRows(c, li) {
  if (capCache.has(li)) return capCache.get(li);
  const words = LINES[li][3];
  c.font = `600 ${CAP}px ${ROUND}`;
  const space = c.measureText(' ').width;
  const ws = words.map(([w]) => c.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  let rows = [words.map((_, k) => k)];
  if (total > 1560) {
    let best = null;
    for (let k = 1; k < words.length; k++) {
      const a = ws.slice(0, k).reduce((p, q) => p + q, 0) + space * (k - 1);
      const b = total - a - space;
      const score = Math.abs(a - b) - (/[,:]$/.test(words[k - 1][0]) ? 260 : 0);
      if (!best || score < best[0]) best = [score, k];
    }
    rows = [words.slice(0, best[1]).map((_, k) => k), words.slice(best[1]).map((_, k) => k + best[1])];
  }
  const rw = rows.map((row) => row.reduce((p, k) => p + ws[k], 0) + space * (row.length - 1));
  const out = { rows, ws, space, rw };
  capCache.set(li, out);
  return out;
}
function drawCaptions(c, t) {
  let li = -1;
  for (let k = 0; k < LINES.length; k++) if (LINES[k][1] - 0.4 <= t) li = k;
  if (li < 0) return;
  const [, start, end, words] = LINES[li];
  const next = li + 1 < LINES.length ? LINES[li + 1][1] - 0.4 : Infinity;
  const hide = Math.min(end + 1.1, next);
  if (t > hide) return;
  const a = seg(t, start - 0.4, start - 0.12) * (1 - seg(t, hide - 0.25, hide));
  if (a <= 0) return;
  const { rows, ws, space, rw } = captionRows(c, li);
  const lh = CAP * 1.24;
  const slide = (1 - easeOutCubic(seg(t, start - 0.4, start - 0.05))) * 18;
  const baseY = 1004 - (rows.length - 1) * lh + slide;
  const pw = Math.max(...rw) + 76, ph = rows.length * lh + 26;
  c.save();
  c.globalAlpha = a;
  // soft pill behind the line
  const pill = pRRect(W / 2 - pw / 2, baseY - lh / 2 - 13, pw, ph, 34);
  c.fillStyle = 'rgba(16,9,40,0.5)'; c.fill(pill);
  c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke(pill);
  c.font = `600 ${CAP}px ${ROUND}`;
  c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round';
  const gold = c.createLinearGradient(0, baseY - CAP * 0.6, 0, baseY + (rows.length - 1) * lh + CAP * 0.5);
  gold.addColorStop(0, '#fff6c8'); gold.addColorStop(1, '#ffc24d');
  rows.forEach((row, r) => {
    let x = W / 2 - rw[r] / 2;
    const y = baseY + r * lh;
    for (const k of row) {
      const [w, wt] = words[k];
      const we = k + 1 < words.length ? words[k + 1][1] : end;
      const dur = clamp(we - wt, 0.14, 0.95);
      const f = clamp((t - wt) / dur);
      const lift = f > 0 && f < 1 ? Math.sin(f * Math.PI) * 5 : 0;
      c.fillStyle = 'rgba(8,4,26,0.55)'; c.fillText(w, x + 2, y + 4 - lift);
      c.lineWidth = 7; c.strokeStyle = 'rgba(20,10,46,0.9)'; c.strokeText(w, x, y - lift);
      c.fillStyle = 'rgba(255,255,255,0.94)'; c.fillText(w, x, y - lift);
      if (f > 0) {
        c.save();
        c.beginPath(); c.rect(x - 4, y - CAP, (ws[k] + 8) * f, CAP * 2); c.clip();
        c.fillStyle = gold; c.fillText(w, x, y - lift);
        c.restore();
      }
      x += ws[k] + space;
    }
  });
  c.restore();
  for (const [e0, e1, s] of EXTRA_CAPTIONS) {
    if (t < e0 || t > e1) continue;
    c.save(); c.globalAlpha = seg(t, e0, e0 + 0.2) * (1 - seg(t, e1 - 0.3, e1));
    txt(c, s, W / 2, baseY - 86, { size: 42, fill: '#d8c8ff', lw: 8, weight: 500, stroke: '#1c1040' });
    c.restore();
  }
}

/* ---------------- post-processing ---------------- */
const LAYERS = {};
function layer(name, w, h) {
  let cv = LAYERS[name];
  if (!cv) cv = LAYERS[name] = document.createElement('canvas');
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  return cv;
}
const FILTER_OK = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;
function lookAt(t) {
  const i = sceneIndexAt(t), sc = SCENES[i];
  const d = TRANS[sc.tr] || 0;
  if (i === 0 || d === 0 || t >= sc.t0 + d) return sc.look;
  const A = SCENES[i - 1].look, B = sc.look, k = smooth(clamp((t - sc.t0) / d));
  const m = {};
  for (const key of Object.keys(B)) m[key] = typeof B[key] === 'number' ? lerp(A[key], B[key], k) : mix(A[key], B[key], Math.round(k * 20) / 20);
  return m;
}
function postFx(out, src, fx, cw, ch) {
  if (fx.bloom > 0.01 && FILTER_OK) {
    const bw = Math.max(64, Math.round(cw / 4)), bh = Math.max(36, Math.round(ch / 4));
    const bl = layer('bloom', bw, bh), b = bl.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'copy'; b.globalAlpha = 1;
    b.filter = `brightness(${fx.bb.toFixed(3)}) contrast(${fx.bc.toFixed(3)}) blur(${(bw / 200).toFixed(2)}px)`;
    b.drawImage(src, 0, 0, bw, bh);
    b.filter = 'none';
    const w2 = Math.round(bw / 2), h2 = Math.round(bh / 2);
    const bl2 = layer('bloom2', w2, h2), b2 = bl2.getContext('2d');
    b2.setTransform(1, 0, 0, 1, 0, 0); b2.globalCompositeOperation = 'copy';
    b2.filter = `blur(${(w2 / 90).toFixed(2)}px)`;
    b2.drawImage(bl, 0, 0, w2, h2);
    b2.filter = 'none';
    out.globalCompositeOperation = 'screen';
    out.globalAlpha = fx.bloom; out.drawImage(bl, 0, 0, cw, ch);
    out.globalAlpha = fx.bloom * 0.8; out.drawImage(bl2, 0, 0, cw, ch);
  }
  if (fx.ga > 0) {
    out.globalCompositeOperation = 'soft-light'; out.globalAlpha = fx.ga;
    const g = out.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, fx.g1); g.addColorStop(1, fx.g2);
    out.fillStyle = g; out.fillRect(0, 0, cw, ch);
  }
  out.globalCompositeOperation = 'source-over'; out.globalAlpha = 1;
  if (fx.vig > 0) {
    const v = out.createRadialGradient(cw / 2, ch / 2, ch * 0.36, cw / 2, ch / 2, ch * 1.02);
    v.addColorStop(0, 'rgba(10,5,30,0)'); v.addColorStop(1, `rgba(10,5,30,${fx.vig})`);
    out.fillStyle = v; out.fillRect(0, 0, cw, ch);
  }
}

/* ---------------- one frame ---------------- */
function renderFrame(out, t, o = {}) {
  t = clamp(t, 0, SONG_LENGTH);
  const cw = out.canvas.width, ch = out.canvas.height, sc = cw / W;
  const sceneCv = layer('scene', cw, ch), c = sceneCv.getContext('2d');
  c.setTransform(sc, 0, 0, sc, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#120a2e'; c.fillRect(0, 0, W, H);
  const i = sceneIndexAt(t);
  const scn = SCENES[i];
  const d = TRANS[scn.tr] || 0;
  if (i > 0 && d > 0 && t < scn.t0 + d) {
    const k = (t - scn.t0) / d;
    if (scn.tr === 'flash') drawScene(scn, c, t);
    else {
      drawScene(SCENES[i - 1], c, t);
      c.save(); transitionClip(c, scn.tr, k); drawScene(scn, c, t); c.restore();
    }
    transitionOverlay(c, scn.tr, k);
  } else drawScene(scn, c, t);
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.globalCompositeOperation = 'copy'; out.globalAlpha = 1;
  out.drawImage(sceneCv, 0, 0);
  out.globalCompositeOperation = 'source-over';
  if (o.post !== false) postFx(out, sceneCv, lookAt(t), cw, ch);
  out.setTransform(sc, 0, 0, sc, 0, 0);
  if (o.captions !== false) drawCaptions(out, t);
}
