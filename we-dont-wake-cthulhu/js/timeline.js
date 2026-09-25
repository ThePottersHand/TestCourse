/* Timeline: which scene plays when, transitions between them, and karaoke captions. */
'use strict';

function snapBeat(t) {
  const b = beatInfo(t);
  const a = beatTime(b.i), n = beatTime(b.i + 1);
  return t - a < n - t ? a : n;
}

/* [start, scene, transition-in] — starts are snapped to the nearest beat */
const SCENES = [
  [0, sIntro, 'cut'],
  [9.91, sPolish, 'iris'],
  [14.46, sCandles, 'wipe'],
  [17.8, sScroll, 'wipe'],
  [21.2, sTentacle, 'iris'],
  [24.85, sMoonBook, 'flash'],
  [27.55, sClock, 'wipe'],
  [31.55, sHands, 'wipe'],
  [35.25, sUnsure, 'flash'],
  [38.9, sStir, 'cut'],
  [40.55, sC1a, 'star'],
  [44.4, sC1b, 'cut'],
  [48.0, sC1c, 'wipe'],
  [51.75, sC1d, 'flash'],
  [54.9, sC1e, 'iris'],
  [58.95, sDelivery, 'heart'],
  [61.6, sRobe, 'wipe'],
  [64.7, sTailor, 'wipe'],
  [68.5, sPlan, 'iris'],
  [72.0, sMabel, 'wipe'],
  [75.65, sStarsTide, 'flash'],
  [78.3, sSleep, 'iris'],
  [82.05, sKeyRhyme, 'star'],
  [85.85, sPaperweight, 'wipe'],
  [91.25, sC2a, 'star'],
  [94.8, sC2b, 'iris'],
  [98.5, sC2c, 'wipe'],
  [102.1, sC2d, 'flash'],
  [105.45, sC2e, 'iris'],
  [109.35, sBrunch, 'heart'],
  [113.1, sStories, 'wipe'],
  [116.9, sWorld, 'iris'],
  [120.1, sMat, 'cut'],
  [124.2, sRollCall, 'flash'],
  [127.1, sF1, 'star'],
  [130.7, sF2, 'iris'],
  [134.4, sF3, 'wipe'],
  [138.55, sF4, 'flash'],
  [141.45, sF5, 'wipe'],
  [145.2, sF6, 'iris'],
  [150.7, sNoteWrite, 'heart'],
  [153.4, sNoteSend, 'wipe'],
  [155.5, sNoteArrive, 'iris'],
  [159.6, sOutro1, 'heart'],
  [165.0, sOutro2, 'cut'],
  [174.4, sEnd, 'iris'],
].map(([t0, draw, tr], k) => ({ t0: k === 0 ? 0 : snapBeat(t0), draw, tr }));

const TRANS = { cut: 0, iris: 0.42, star: 0.45, heart: 0.5, wipe: 0.38, flash: 0.3 };

function transitionClip(c, kind, k) {
  const e = easeInCubic(k);
  c.beginPath();
  if (kind === 'iris') c.arc(W / 2, H / 2, 20 + e * 1150, 0, TAU);
  else if (kind === 'star') softStar(c, W / 2, H / 2, 20 + e * 2300, 5, -Math.PI / 2 + k, 0.5);
  else if (kind === 'heart') heartPath(c, W / 2, H / 2 + 100, 20 + e * 1900);
  else if (kind === 'wipe') {
    const x = lerp(-500, W + 500, easeInOut(k));
    c.moveTo(-600, -20); c.lineTo(x + 220, -20); c.lineTo(x - 220, H + 20); c.lineTo(-600, H + 20); c.closePath();
  } else c.rect(0, 0, W, H);
  c.clip();
}
function transitionOverlay(c, kind, k) {
  if (kind === 'wipe') {
    const x = lerp(-500, W + 500, easeInOut(k));
    c.save();
    c.beginPath(); c.moveTo(x + 220, -20); c.lineTo(x + 290, -20); c.lineTo(x - 150, H + 20); c.lineTo(x - 220, H + 20); c.closePath();
    c.fillStyle = '#ff9ecf'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(x + 300, -20); c.lineTo(x + 330, -20); c.lineTo(x - 110, H + 20); c.lineTo(x - 140, H + 20); c.closePath();
    c.fillStyle = '#ffe27a'; c.fill();
    c.restore();
  } else if (kind === 'iris' || kind === 'star' || kind === 'heart') {
    c.save();
    const e = easeInCubic(k);
    c.beginPath();
    if (kind === 'iris') c.arc(W / 2, H / 2, 20 + e * 1150, 0, TAU);
    else if (kind === 'star') softStar(c, W / 2, H / 2, 20 + e * 2300, 5, -Math.PI / 2 + k, 0.5);
    else heartPath(c, W / 2, H / 2 + 100, 20 + e * 1900);
    c.lineWidth = 14; c.strokeStyle = '#fff'; c.stroke(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    c.restore();
  } else if (kind === 'flash' && !REDUCED_MOTION) {
    c.fillStyle = `rgba(255,255,255,${0.75 * (1 - k)})`; c.fillRect(0, 0, W, H);
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
function captionRows(c, li, size) {
  const key = li + ':' + size;
  if (capCache.has(key)) return capCache.get(key);
  const words = LINES[li][3];
  c.font = `600 ${size}px ${ROUND}`;
  const space = c.measureText(' ').width;
  const ws = words.map(([w]) => c.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  let rows = [words.map((_, k) => k)];
  if (total > 1640) {
    let best = null;
    for (let k = 1; k < words.length; k++) {
      const a = ws.slice(0, k).reduce((p, q) => p + q, 0) + space * (k - 1);
      const b = total - a - space;
      const score = Math.abs(a - b) - (/[,:]$/.test(words[k - 1][0]) ? 260 : 0);
      if (!best || score < best[0]) best = [score, k];
    }
    rows = [words.slice(0, best[1]).map((_, k) => k), words.slice(best[1]).map((_, k) => k + best[1])];
  }
  const out = { rows, ws, space };
  capCache.set(key, out);
  return out;
}
function drawCaptions(c, t) {
  // pick the line on screen
  let li = -1;
  for (let k = 0; k < LINES.length; k++) if (LINES[k][1] - 0.4 <= t) li = k;
  if (li < 0) return;
  const [, start, end, words] = LINES[li];
  const next = li + 1 < LINES.length ? LINES[li + 1][1] - 0.4 : Infinity;
  const hide = Math.min(end + 1.1, next);
  if (t > hide) return;
  const a = seg(t, start - 0.4, start - 0.15) * (1 - seg(t, hide - 0.25, hide));
  if (a <= 0) return;
  const size = 62;
  const { rows, ws, space } = captionRows(c, li, size);
  const lh = size * 1.22;
  const baseY = 1000 - (rows.length - 1) * lh;
  c.save();
  c.globalAlpha = a;
  const g = c.createLinearGradient(0, baseY - 110, 0, H);
  g.addColorStop(0, 'rgba(12,6,34,0)'); g.addColorStop(1, 'rgba(12,6,34,0.55)');
  c.fillStyle = g; c.fillRect(0, baseY - 110, W, H - baseY + 110);
  c.font = `600 ${size}px ${ROUND}`;
  c.textBaseline = 'middle'; c.textAlign = 'center'; c.lineJoin = 'round';
  rows.forEach((row, r) => {
    const rw = row.reduce((p, k) => p + ws[k], 0) + space * (row.length - 1);
    let x = W / 2 - rw / 2;
    const y = baseY + r * lh + (1 - easeOutCubic(seg(t, start - 0.4, start - 0.1))) * 30;
    for (const k of row) {
      const [w, wt] = words[k];
      const sung = t >= wt;
      const p = sung ? 1 - seg(t, wt, wt + 0.22) : 0;
      const sc = 1 + 0.05 * Math.sin(p * Math.PI);
      c.save();
      c.translate(x + ws[k] / 2, y - Math.sin(p * Math.PI) * 12);
      c.scale(sc, sc);
      c.lineWidth = 13; c.strokeStyle = INK; c.strokeText(w, 0, 0);
      c.fillStyle = sung ? '#ffe27a' : '#ffffff';
      c.fillText(w, 0, 0);
      c.restore();
      x += ws[k] + space;
    }
  });
  c.restore();
  for (const [e0, e1, s] of EXTRA_CAPTIONS) {
    if (t < e0 || t > e1) continue;
    c.save(); c.globalAlpha = seg(t, e0, e0 + 0.2) * (1 - seg(t, e1 - 0.3, e1));
    txt(c, s, W / 2, baseY - 84, { size: 44, fill: '#cdb8ff', lw: 10, weight: 500 });
    c.restore();
  }
}

/* ---------------- one frame ---------------- */
function renderFrame(c, t, o = {}) {
  t = clamp(t, 0, SONG_LENGTH);
  const i = sceneIndexAt(t);
  const sc = SCENES[i];
  const d = TRANS[sc.tr] || 0;
  c.save();
  c.fillStyle = '#120a2e'; c.fillRect(0, 0, W, H);
  if (i > 0 && d > 0 && t < sc.t0 + d) {
    const k = (t - sc.t0) / d;
    if (sc.tr === 'flash') drawScene(sc, c, t);
    else {
      drawScene(SCENES[i - 1], c, t);
      c.save(); transitionClip(c, sc.tr, k); drawScene(sc, c, t); c.restore();
    }
    transitionOverlay(c, sc.tr, k);
  } else drawScene(sc, c, t);
  if (o.captions !== false) drawCaptions(c, t);
  c.restore();
}
