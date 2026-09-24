/* Frame orchestrator: picks the shot for time t, handles transitions, captions and finishing touches. */
(function (RV) {
  'use strict';
  const { clamp, lerp, TAU } = RV;
  const W = RV.W, H = RV.H;

  function ensureShots() {
    if (RV.SHOTS) return;
    const S = RV._shotList.slice().sort((a, b) => a.t0 - b.t0);
    S.forEach((s, i) => { s.t1 = i + 1 < S.length ? S[i + 1].t0 : RV.DURATION + 1; });
    RV.SHOTS = S;
  }
  RV.ensureShots = ensureShots;

  function findShot(t) {
    ensureShots();
    const S = RV.SHOTS;
    let lo = 0, hi = S.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (S[mid].t0 <= t) lo = mid; else hi = mid - 1;
    }
    return lo;
  }
  RV.findShot = findShot;

  function drawShot(ctx, idx, t) {
    const sh = RV.SHOTS[idx];
    const d = sh.t1 - sh.t0;
    const S = { t, lt: t - sh.t0, d, p: clamp((t - sh.t0) / d), shot: sh };
    ctx.save();
    try { sh.draw(ctx, S); } catch (e) { if (RV.debug) throw e; else console.error('shot', sh.name, e); }
    ctx.restore();
  }

  function setBase(ctx) {
    const m = RV._baseTransform;
    ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  }

  function starPath(ctx, cx, cy, r, rot) {
    RV.star(ctx, cx, cy, r, r * 0.5, 5, rot);
  }

  // composite `fromIdx` -> `toIdx` at progress p (0..1)
  function transition(ctx, type, fromIdx, toIdx, t, p, tr) {
    const cx = tr.x || W / 2, cy = tr.y || H / 2;
    switch (type) {
      case 'circle':
      case 'star': {
        drawShot(ctx, fromIdx, t);
        const e = RV.ease.inOutCubic(p);
        const r = e * (type === 'star' ? 2600 : 1250);
        ctx.save();
        ctx.beginPath();
        if (type === 'star') starPath(ctx, cx, cy, r, e * 1.5); else ctx.arc(cx, cy, r, 0, TAU);
        ctx.save(); ctx.clip();
        drawShot(ctx, toIdx, t);
        ctx.restore();
        ctx.lineWidth = 18; ctx.strokeStyle = tr.ring || '#ffffff'; ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = RV.OUT; ctx.stroke();
        ctx.restore();
        break;
      }
      case 'iris': {
        // classic cartoon iris: close on the old shot, open on the new one
        const closing = p < 0.5;
        drawShot(ctx, closing ? fromIdx : toIdx, t);
        const q = closing ? 1 - p / 0.5 : (p - 0.5) / 0.5;
        const r = RV.ease.inOutCubic(q) * 1250;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-10, -10, W + 20, H + 20);
        ctx.arc(cx, cy, Math.max(0.5, r), 0, TAU, true);
        ctx.fillStyle = '#0b0718';
        ctx.fill('evenodd');
        ctx.restore();
        break;
      }
      case 'whip': {
        const e = RV.ease.inOutCubic(p);
        const dir = tr.dir || 1;
        ctx.save(); ctx.translate(-e * W * dir, 0); drawShot(ctx, fromIdx, t); ctx.restore();
        ctx.save(); ctx.translate((1 - e) * W * dir, 0); drawShot(ctx, toIdx, t); ctx.restore();
        ctx.save();
        ctx.globalAlpha = Math.sin(p * Math.PI) * 0.9;
        RV.hSpeedLines(ctx, t, { n: 40, speed: 4, color: 'rgba(255,255,255,0.8)' });
        ctx.restore();
        break;
      }
      case 'wipe': {
        drawShot(ctx, fromIdx, t);
        const e = RV.ease.inOutCubic(p);
        const x = lerp(-700, W + 700, e);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-800, -50); ctx.lineTo(x + 250, -50); ctx.lineTo(x - 250, H + 50); ctx.lineTo(-800, H + 50); ctx.closePath();
        ctx.clip();
        drawShot(ctx, toIdx, t);
        ctx.restore();
        const cols = tr.colors || ['#ffd23f', '#ff4fa3', '#4cc9f0'];
        cols.forEach((c, i) => {
          const o = i * 46;
          ctx.beginPath();
          ctx.moveTo(x + 250 + o, -50); ctx.lineTo(x + 290 + o, -50); ctx.lineTo(x - 210 + o, H + 50); ctx.lineTo(x - 250 + o, H + 50); ctx.closePath();
          ctx.fillStyle = c; ctx.fill();
        });
        break;
      }
      case 'fade':
      case 'black': {
        if (type === 'black') {
          drawShot(ctx, p < 0.5 ? fromIdx : toIdx, t);
          ctx.fillStyle = `rgba(5,3,15,${Math.sin(p * Math.PI)})`;
          ctx.fillRect(-10, -10, W + 20, H + 20);
        } else {
          drawShot(ctx, fromIdx, t);
          const buf = RV.buffer('fade', ctx.canvas.width, ctx.canvas.height);
          const b = buf.getContext('2d');
          const m = RV._baseTransform;
          b.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
          drawShot(b, toIdx, t);
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = RV.smooth(p);
          ctx.drawImage(buf, 0, 0);
          ctx.restore();
        }
        break;
      }
      case 'zoom': {
        // zoom punch through into the next shot
        const e = RV.ease.inCubic(clamp(p * 2));
        if (p < 0.5) {
          ctx.save(); ctx.translate(cx, cy); ctx.scale(1 + e * 2.5, 1 + e * 2.5); ctx.translate(-cx, -cy);
          drawShot(ctx, fromIdx, t); ctx.restore();
          ctx.fillStyle = `rgba(255,255,255,${e})`; ctx.fillRect(-10, -10, W + 20, H + 20);
        } else {
          const q = RV.ease.outCubic((p - 0.5) * 2);
          ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(0.6 + 0.4 * q, 0.6 + 0.4 * q); ctx.rotate((1 - q) * 0.15); ctx.translate(-W / 2, -H / 2);
          drawShot(ctx, toIdx, t); ctx.restore();
          ctx.fillStyle = `rgba(255,255,255,${1 - q})`; ctx.fillRect(-10, -10, W + 20, H + 20);
        }
        break;
      }
      case 'flash':
      default: {
        drawShot(ctx, p < 0.3 ? fromIdx : toIdx, t);
        const a = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
        ctx.fillStyle = `rgba(255,255,255,${clamp(a)})`;
        ctx.fillRect(-10, -10, W + 20, H + 20);
      }
    }
  }

  /* Render the frame for time t onto ctx (any size; content is fit to 16:9). */
  RV.renderFrame = function (ctx, t, opts = {}) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const k = Math.min(cw / W, ch / H);
    const ox = (cw - W * k) / 2, oy = (ch - H * k) / 2;
    RV._baseTransform = [k, 0, 0, k, ox, oy];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    setBase(ctx);
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    const idx = findShot(t);
    const sh = RV.SHOTS[idx];
    const tr = sh.trans;
    const lt = t - sh.t0;
    if (tr && tr.type !== 'cut' && idx > 0) {
      const dur = tr.dur || 0.5;
      // transitions straddle the cut point: they start `pre` seconds before it
      const pre = tr.pre != null ? tr.pre : dur / 2;
      if (lt < dur - pre) {
        transition(ctx, tr.type, idx - 1, idx, t, clamp((lt + pre) / dur), tr);
      } else drawShot(ctx, idx, t);
    } else {
      // does the NEXT shot's transition start before its cut?
      const nx = RV.SHOTS[idx + 1];
      const ntr = nx && nx.trans;
      if (ntr && ntr.type !== 'cut') {
        const dur = ntr.dur || 0.5, pre = ntr.pre != null ? ntr.pre : dur / 2;
        if (t >= nx.t0 - pre) transition(ctx, ntr.type, idx, idx + 1, t, clamp((t - (nx.t0 - pre)) / dur), ntr);
        else drawShot(ctx, idx, t);
      } else drawShot(ctx, idx, t);
    }
    // a transition that starts before its cut is drawn by the previous shot's branch above
    if (tr && tr.type !== 'cut' && idx > 0) { /* handled */ }

    setBase(ctx);
    if (opts.captions !== false) RV.drawCaptions(ctx, t);
    // finishing: gentle vignette, fade in/out
    RV.vignette(ctx, 0.22);
    const fadeIn = clamp(t / 1.0), fadeOut = clamp((RV.DURATION - t) / 3.0);
    const f = Math.min(fadeIn, fadeOut);
    if (f < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - f})`; ctx.fillRect(-10, -10, W + 20, H + 20); }
    ctx.restore();
  };

  // list of shots for debugging / the player's chapter list
  RV.chapters = function () {
    return RV.SHOTS.filter((s) => s.chapter).map((s) => ({ t: s.t0, name: s.chapter }));
  };
})(globalThis.RV);
