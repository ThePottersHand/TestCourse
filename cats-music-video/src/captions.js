/* Lyric lookups, who sings which line, the cats' lip-sync, and optional karaoke captions (the player's CC button). */
(function (RV) {
  'use strict';
  const { clamp, rrect } = RV;
  const W = RV.W, H = RV.H;

  const WORDS = [];
  RV.LYRICS.forEach((L, li) => L.w.forEach((w) => WORDS.push({ t0: w[0], t1: w[1], text: w[2], line: li })));
  WORDS.sort((a, b) => a.t0 - b.t0);
  RV.WORDS = WORDS;
  // who sings each line of RV.LYRICS: the cats trade lines; everyone joins in on the hoorays
  RV.SINGERS = ['both', 'ginger', 'tux', 'ginger', 'tux', 'both', 'tux', 'ginger', 'ginger', 'all', 'all'];

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

  // "a-a-a" is three syllables, "yummy" two
  const syllables = (s) => s.split('-').filter(Boolean)
    .reduce((n, part) => n + Math.max(1, (part.toLowerCase().replace(/[^a-z]/g, '').match(/[aeiouy]+/g) || []).length), 0);
  // how open a singer's mouth is (0..1) for the word at t
  RV.singOpen = function (t, gain = 1) {
    const w = RV.wordAt(t);
    if (!w) return 0;
    const n = syllables(w.text);
    const p = clamp((t - w.t0) / Math.max(0.08, w.t1 - w.t0));
    const v = clamp(RV.vocal(t) * 1.3);
    const shape = w.t1 - w.t0 > 0.6 ? 0.85 + 0.15 * Math.sin(t * 20) : 0.3 + 0.7 * Math.abs(Math.sin(Math.PI * p * n));
    return clamp(gain * v * shape);
  };
  // is this singer ('tux', 'ginger' or 'kids') singing at t?
  RV.sings = function (t, who) {
    const w = RV.wordAt(t);
    if (!w) return false;
    const s = RV.SINGERS[w.line];
    return s === 'all' || (who !== 'kids' && (s === 'both' || s === who));
  };
  // pose fields for a cat's mouth: singing when it's their line, otherwise the given resting mouth.
  // Long notes and shouted words get the big yowl.
  RV.catSing = function (t, id, rest = 'w', gain = 1) {
    if (!RV.sings(t, id)) return { mouth: rest, open: 0 };
    const o = RV.singOpen(t, gain);
    if (o <= 0.06) return { mouth: rest, open: 0 };
    const w = RV.wordAt(t);
    return { mouth: w.t1 - w.t0 > 0.6 || /!/.test(w.text) ? 'yowl' : 'sing', open: o };
  };
  // the kids join in on the hoorays
  RV.kidSing = function (t, rest = 'smile') {
    if (!RV.sings(t, 'kids')) return { mouth: rest, open: 0 };
    const o = RV.singOpen(t, 1.2);
    return o > 0.06 ? { mouth: 'sing', open: o } : { mouth: rest, open: 0 };
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
