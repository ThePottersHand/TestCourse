/* Karaoke-style lyric captions + lip-sync helpers driven by the aligned word timings. */
(function (RV) {
  'use strict';
  const { clamp, rrect } = RV;
  const W = RV.W, H = RV.H;

  // flat word list for lookups
  const WORDS = [];
  RV.LYRICS.forEach((L, li) => L.w.forEach((w) => WORDS.push({ t0: w[0], t1: w[1], text: w[2], line: li })));
  WORDS.sort((a, b) => a.t0 - b.t0);
  RV.WORDS = WORDS;

  function wordAt(t) {
    let lo = 0, hi = WORDS.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (WORDS[mid].t0 <= t) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (best < 0) return null;
    const w = WORDS[best];
    return t <= w.t1 + 0.05 ? w : null;
  }
  RV.wordAt = wordAt;

  const syllables = (s) => Math.max(1, (s.toLowerCase().replace(/[^a-z]/g, '').match(/[aeiouy]+/g) || []).length);

  // mouth openness for whoever is "singing" right now (0..1)
  RV.singOpen = function (t, gain = 1) {
    const w = wordAt(t);
    if (!w) return 0;
    const n = syllables(w.text);
    const p = clamp((t - w.t0) / Math.max(0.08, w.t1 - w.t0));
    const v = clamp(RV.vocal(t) * 1.25);
    return clamp(gain * v * (0.3 + 0.7 * Math.abs(Math.sin(Math.PI * p * n))));
  };
  // true while a line from the given section list is being sung
  RV.lineAt = function (t, lead = 0.25) {
    for (let i = 0; i < RV.LYRICS.length; i++) {
      const L = RV.LYRICS[i];
      if (t >= L.t0 - lead && t <= L.t1 + 0.3) return L;
    }
    return null;
  };

  // chorus "Rusty" hits (for text slams), snapped to the eighth-note grid
  RV.CHORUS_HITS = [];
  RV.LYRICS.forEach((L) => {
    if (!/^chorus|^outro/.test(L.s)) return;
    const w = L.w.find((x) => /rusty/i.test(x[2])) || L.w[0];
    RV.CHORUS_HITS.push({ t: RV.snapBeat(w[0], 2), line: L, section: L.s });
  });
  RV.lastHit = function (t, section) {
    let best = null;
    for (const h of RV.CHORUS_HITS) {
      if (section && h.section !== section) continue;
      if (h.t <= t) best = h; else break;
    }
    return best;
  };
  RV.hitIndex = function (t, section) {
    let k = -1;
    RV.CHORUS_HITS.filter((h) => !section || h.section === section).forEach((h, i) => { if (h.t <= t) k = i; });
    return k;
  };

  // ------------------------------------------------------------ caption renderer
  const LEAD = 0.35, TAIL = 0.6;
  function activeLine(t) {
    const L = RV.LYRICS;
    let best = null;
    for (let i = 0; i < L.length; i++) {
      const next = L[i + 1];
      const end = Math.min(L[i].t1 + TAIL, next ? next.t0 - 0.12 : Infinity);
      if (t >= L[i].t0 - LEAD && t <= end) { best = { line: L[i], idx: i, start: L[i].t0 - LEAD, end }; }
    }
    return best;
  }

  RV.drawCaptions = function (ctx, t, o = {}) {
    const a = activeLine(t);
    if (!a) return;
    const L = a.line;
    if (/^chorus|^outro/.test(L.s) && !o.chorus) return;
    const inP = clamp((t - a.start) / 0.25), outP = clamp((a.end - t) / 0.25);
    const vis = Math.min(inP, outP);
    if (vis <= 0) return;
    ctx.save();
    let size = 56;
    ctx.font = `${size}px ${RV.FONT.body}`;
    const words = L.w.map((w) => w[2]);
    const space = ctx.measureText(' ').width;
    let widths = words.map((w) => ctx.measureText(w).width);
    let total = widths.reduce((s, x) => s + x, 0) + space * 1.35 * (words.length - 1);
    const maxW = 1560;
    if (total > maxW) {
      size = Math.floor(size * maxW / total);
      ctx.font = `${size}px ${RV.FONT.body}`;
      widths = words.map((w) => ctx.measureText(w).width);
      total = widths.reduce((s, x) => s + x, 0) + ctx.measureText(' ').width * 1.35 * (words.length - 1);
    }
    const sp = ctx.measureText(' ').width * 1.35;
    const y = (o.y || H - 92) + (1 - RV.ease.outBack(inP, 2)) * 40;
    ctx.globalAlpha = vis;
    // pill
    const padX = 38, ph = size * 1.55;
    rrect(ctx, W / 2 - total / 2 - padX, y - ph / 2, total + padX * 2, ph, ph / 2);
    ctx.fillStyle = 'rgba(20,12,40,0.62)';
    ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke();
    // words
    let x = W / 2 - total / 2;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    L.w.forEach((w, i) => {
      const [t0, t1, text] = w;
      const sung = t >= t0 - 0.04;
      const active = sung && t <= t1 + 0.08;
      const pk = active ? Math.sin(clamp((t - t0 + 0.04) / Math.max(0.12, t1 - t0 + 0.1)) * Math.PI) : 0;
      const dy = -pk * size * 0.14;
      const sc = 1 + pk * 0.05;
      ctx.save();
      ctx.translate(x + widths[i] / 2, y + dy);
      ctx.scale(sc, sc);
      ctx.lineWidth = size * 0.16;
      ctx.strokeStyle = 'rgba(20,10,30,0.9)';
      ctx.strokeText(text, -widths[i] / 2, 2);
      ctx.fillStyle = sung ? '#ffd23f' : '#ffffff';
      ctx.fillText(text, -widths[i] / 2, 2);
      ctx.restore();
      x += widths[i] + sp;
    });
    ctx.restore();
  };
})(globalThis.RV);
