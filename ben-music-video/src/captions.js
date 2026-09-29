/* Lyric lookups, Ben's lip-sync, and optional karaoke captions (the player's CC button). */
(function (RV) {
  'use strict';
  const { clamp, rrect } = RV;
  const W = RV.W, H = RV.H;

  const WORDS = [];
  RV.LYRICS.forEach((L, li) => L.w.forEach((w) => WORDS.push({ t0: w[0], t1: w[1], text: w[2], line: li })));
  WORDS.sort((a, b) => a.t0 - b.t0);
  RV.WORDS = WORDS;
  // every sung "Ben" (the video's big hits)
  RV.BENS = WORDS.filter((w) => /^ben/i.test(w.text)).map((w) => w.t0);

  RV.wordAt = function (t) {
    let lo = 0, hi = WORDS.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (WORDS[mid].t0 <= t) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (best < 0) return null;
    const w = WORDS[best];
    return t <= w.t1 + 0.05 ? w : null;
  };
  // index of the last "Ben" at or before t within [a, b) (-1 if none yet)
  RV.benIndex = function (t, a = 0, b = 99) {
    let k = -1;
    RV.BENS.forEach((x, i) => { if (x >= a && x < b && x <= t) k = i; });
    return k;
  };
  RV.lastBen = function (t, a = 0, b = 99) {
    let best = null;
    for (const x of RV.BENS) if (x >= a && x < b && x <= t) best = x;
    return best;
  };

  const syllables = (s) => Math.max(1, (s.toLowerCase().replace(/[^a-z]/g, '').match(/[aeiouy]+/g) || []).length);
  // Ben sings every word: how open his mouth is (0..1)
  RV.singOpen = function (t, gain = 1) {
    const w = RV.wordAt(t);
    if (!w) return 0;
    const n = /^be+n+/i.test(w.text) || /^bu-/.test(w.text) ? 1 : syllables(w.text);
    const p = clamp((t - w.t0) / Math.max(0.08, w.t1 - w.t0));
    const v = clamp(RV.vocal(t) * 1.3);
    const shape = w.t1 - w.t0 > 0.6 ? 0.85 + 0.15 * Math.sin(t * 20) : 0.3 + 0.7 * Math.abs(Math.sin(Math.PI * p * n));
    return clamp(gain * v * shape);
  };
  // pose fields for Ben's mouth: singing when a word is on, otherwise the given resting mouth
  RV.benMouth = function (t, rest = 'grin', gain = 1) {
    const o = RV.singOpen(t, gain);
    const w = RV.wordAt(t);
    if (w && /^bu-/.test(w.text)) return { mouth: 'o', open: clamp(0.4 + o) };
    if (o > 0.06) return { mouth: 'sing', open: o };
    return { mouth: rest, open: 0 };
  };

  // ------------------------------------------------------------ karaoke captions (off by default)
  const LEAD = 0.2, TAIL = 0.35;
  function activeLine(t) {
    const L = RV.LYRICS;
    let best = null;
    for (let i = 0; i < L.length; i++) {
      const next = L[i + 1];
      const end = Math.min(L[i].t1 + TAIL, next ? next.t0 - 0.06 : Infinity);
      if (t >= L[i].t0 - LEAD && t <= end) best = { line: L[i], start: L[i].t0 - LEAD, end };
    }
    return best;
  }
  RV.drawCaptions = function (ctx, t) {
    const a = activeLine(t);
    if (!a) return;
    const L = a.line;
    const vis = Math.min(clamp((t - a.start) / 0.12), clamp((a.end - t) / 0.12));
    if (vis <= 0) return;
    ctx.save();
    let size = 54;
    ctx.font = `${size}px ${RV.FONT.body}`;
    const words = L.w.map((w) => w[2]);
    let widths = words.map((w) => ctx.measureText(w).width);
    const sp = ctx.measureText(' ').width * 1.35;
    const total = widths.reduce((s, x) => s + x, 0) + sp * (words.length - 1);
    const y = H - 84;
    ctx.globalAlpha = vis;
    const padX = 36, ph = size * 1.55;
    rrect(ctx, W / 2 - total / 2 - padX, y - ph / 2, total + padX * 2, ph, ph / 2);
    ctx.fillStyle = 'rgba(20,12,40,0.66)'; ctx.fill();
    let x = W / 2 - total / 2;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    L.w.forEach((w, i) => {
      const sung = t >= w[0] - 0.03;
      ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(20,10,30,0.9)';
      ctx.strokeText(w[2], x, y + 2);
      ctx.fillStyle = sung ? '#ffd23f' : '#ffffff';
      ctx.fillText(w[2], x, y + 2);
      x += widths[i] + sp;
    });
    ctx.restore();
  };
})(globalThis.RV);
