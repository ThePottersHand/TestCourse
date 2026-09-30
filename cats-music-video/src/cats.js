/* The cats (from the photo): a fluffy black-and-white tuxedo and a big ginger mackerel tabby.
 * RV.drawCat(ctx, id, pose)  id: 'tux' | 'ginger'
 * pose: x, y (ground), s, face (1/-1), t, pose ('sit' | 'stand' | 'loaf'), bob, jump, squash, lean,
 *   headTilt, turn (-1..1), eyes ('open' | 'happy' | 'closed' | 'wide' | 'heart' | 'squeeze'), lid (0..1),
 *   look [x, y], blink, dilate (0 slit..1 round), mouth ('w' | 'smile' | 'sing' | 'yowl' | 'tongue' | 'o'),
 *   open (0..1), earL/earR (0 up .. 1 flat), blush, tail (sway amount), armL/armR [shoulder, elbow] or
 *   handL/handR [x, y] targets (stand pose), footL/footR [dx, lift] (stand), pawL/pawR lift (sit),
 *   drape (loaf: 0..1, a front leg stretched out to the side), holdL/holdR(ctx, hand), belly (0..1 bulge),
 *   bib (check colour: a napkin tied round the neck).
 * Like the kids' rig: a raised front leg that crosses the face is drawn in front of the head.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ellipse, circle, fs, limb, curve } = RV;
  const OUT = RV.OUT;

  const CATS = {
    tux: {
      R: 72, bodyH: 132, bodyW: 82, fur: '#25222c', furHi: '#3a3544', furSh: '#141218', limb: '#2e2a37', rim: '#5d5770', white: '#f8f6f1', whiteSh: '#dcd7cf',
      earIn: '#c07a88', iris: '#c3c24a', irisHi: '#e6e28a', nose: '#e79aa7', fluffy: true, whiskerC: '#ffffff',
    },
    ginger: {
      R: 80, bodyH: 150, bodyW: 98, fur: '#e8953f', furHi: '#f6bb73', furSh: '#c77427', stripe: '#b95e1c', cream: '#fadcae',
      earIn: '#f3b3a2', iris: '#cfd489', irisHi: '#eef0bd', nose: '#e8978d', stripes: true, whiskerC: '#fffaf0', lidRest: 0.28,
    },
  };
  RV.CATS = CATS;
  // head centre above the ground for each pose (unscaled)
  RV.catHead = (id, pose = 'sit', s = 1) => {
    const C = CATS[id];
    if (pose === 'stand') return -(95 + 128 + C.R * 0.6) * s;
    if (pose === 'loaf') return -(C.R * 0.95) * s;
    return -(C.bodyH + C.R * 0.55) * s;
  };

  const dark = (C) => C.fur;
  const limbC = (C) => C.limb || C.fur;
  // a lighter rim along a dark cat's leg so it reads against the body and head
  function rim(ctx, C, pts, w) {
    if (!C.rim) return;
    ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) { const cx = 2 * pts[1][0] - (pts[0][0] + pts[2][0]) / 2, cy = 2 * pts[1][1] - (pts[0][1] + pts[2][1]) / 2; ctx.quadraticCurveTo(cx, cy, pts[2][0], pts[2][1]); }
    else ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.translate(0, 0); ctx.lineWidth = w * 0.22; ctx.strokeStyle = C.rim; ctx.globalAlpha = 0.9;
    ctx.setTransform(ctx.getTransform().translate(-w * 0.2, -w * 0.12)); ctx.stroke(); ctx.restore();
  }
  const light = (C) => C.white || C.cream;

  // ---------------------------------------------------------------- head
  function ear(ctx, C, side, flat, t) {
    const R = C.R;
    ctx.save();
    ctx.translate(side * R * 0.58, -R * 0.6);
    ctx.rotate(side * (0.32 + flat * 0.9) + Math.sin(t * 3.1 + side) * 0.02);
    ctx.scale(1, 1 - flat * 0.35);
    ctx.beginPath();
    ctx.moveTo(-R * 0.36, R * 0.12);
    ctx.quadraticCurveTo(-R * 0.2, -R * 0.52, -R * 0.02, -R * 0.78);
    ctx.quadraticCurveTo(R * 0.06, -R * 0.82, R * 0.12, -R * 0.72);
    ctx.quadraticCurveTo(R * 0.34, -R * 0.36, R * 0.38, R * 0.14);
    ctx.closePath();
    fs(ctx, dark(C), 5);
    ctx.beginPath();
    ctx.moveTo(-R * 0.22, R * 0.06);
    ctx.quadraticCurveTo(-R * 0.1, -R * 0.4, R * 0.02, -R * 0.56);
    ctx.quadraticCurveTo(R * 0.2, -R * 0.26, R * 0.24, R * 0.08);
    ctx.closePath();
    ctx.fillStyle = C.earIn; ctx.fill();
    if (C.fluffy) {
      // white ear tufts
      ctx.strokeStyle = C.white; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(R * (0.02 + i * 0.06), R * 0.02); ctx.quadraticCurveTo(R * (-0.02 + i * 0.05), -R * 0.2, R * (0.06 + i * 0.07), -R * (0.3 + i * 0.05));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function headPath(ctx, R, fluffy) {
    const pts = [[0, -0.86], [0.52, -0.8], [0.9, -0.5], [1.08, -0.05], [1.14, 0.18], [1.0, 0.46], [0.68, 0.74], [0.3, 0.86], [0, 0.88]];
    const all = pts.concat(pts.slice(1, -1).reverse().map(([x, y]) => [-x, y]));
    if (fluffy) {
      // cheek ruff: add zig-zag tufts on the lower sides
      const out = [];
      all.forEach(([x, y], i) => {
        out.push([x * R, y * R]);
        if (y > 0 && y < 0.8 && Math.abs(x) > 0.5 && i < all.length - 1) {
          const [nx, ny] = all[i + 1];
          out.push([(x + nx) / 2 * R * 1.12, (y + ny) / 2 * R * 1.05]);
        }
      });
      curve(ctx, out, true, 0.4);
    } else curve(ctx, all.map(([x, y]) => [x * R, y * R]), true, 0.5);
  }

  function catEye(ctx, C, x, y, rx, ry, p, side) {
    const kind = p.eyes || 'open';
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'happy' || kind === 'closed' || kind === 'squeeze') {
      ctx.beginPath();
      if (kind === 'happy') { ctx.moveTo(-rx, ry * 0.2); ctx.quadraticCurveTo(0, -ry * 1.0, rx, ry * 0.2); }
      else if (kind === 'squeeze') { ctx.moveTo(-rx * side, -ry * 0.6); ctx.lineTo(rx * 0.5 * side, 0); ctx.lineTo(-rx * side, ry * 0.6); }
      else { ctx.moveTo(-rx, 0); ctx.quadraticCurveTo(0, ry * 0.7, rx, 0); }
      ctx.lineWidth = 5.5; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
      return;
    }
    if (kind === 'heart') {
      const s = rx * 1.15 * (1 + 0.1 * Math.sin((p.t || 0) * 14));
      RV.heart(ctx, 0, s * 0.3, s);
      fs(ctx, '#ff4d6d', 4);
      ctx.restore();
      return;
    }
    const wide = kind === 'wide' ? 1.15 : 1;
    const blink = clamp(p.blink || 0);
    ctx.scale(1, Math.max(0.08, 1 - blink));
    // almond eye
    const eyePath = () => {
      ctx.beginPath();
      ctx.moveTo(-rx * wide, 0);
      ctx.bezierCurveTo(-rx * wide, -ry * 1.25 * wide, rx * wide, -ry * 1.25 * wide, rx * wide, 0);
      ctx.bezierCurveTo(rx * wide, ry * 1.2 * wide, -rx * wide, ry * 1.2 * wide, -rx * wide, 0);
      ctx.closePath();
    };
    eyePath();
    const g = ctx.createRadialGradient(0, ry * 0.2, 0, 0, 0, rx * 1.2);
    g.addColorStop(0, C.irisHi); g.addColorStop(1, C.iris);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); eyePath(); ctx.clip();
    const lx = (p.look ? p.look[0] : 0) * rx * 0.35, ly = (p.look ? p.look[1] : 0) * ry * 0.3;
    const dil = kind === 'wide' ? 1 : clamp(p.dilate == null ? 0.55 : p.dilate);
    ellipse(ctx, lx, ly, rx * (0.16 + 0.5 * dil), ry * (0.95 - 0.1 * dil)); ctx.fillStyle = '#120d0a'; ctx.fill();
    circle(ctx, lx - rx * 0.28, ly - ry * 0.42, rx * 0.2); ctx.fillStyle = '#ffffff'; ctx.fill();
    circle(ctx, lx + rx * 0.3, ly + ry * 0.4, rx * 0.09); ctx.fill();
    // lids: resting (the ginger always looks a bit chilled) + extra
    const lid = clamp(Math.max(C.lidRest || 0, 0) * (kind === 'wide' ? 0 : 1) + (p.lid || 0));
    if (lid > 0) {
      const top = -ry * 1.3, y0 = top + ry * 2.3 * lid;
      ctx.beginPath(); ctx.moveTo(-rx * 1.3, top - 4); ctx.lineTo(rx * 1.3, top - 4); ctx.lineTo(rx * 1.3, y0); ctx.quadraticCurveTo(0, y0 + ry * 0.25, -rx * 1.3, y0); ctx.closePath();
      ctx.fillStyle = C.fur; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-rx * 1.3, y0); ctx.quadraticCurveTo(0, y0 + ry * 0.25, rx * 1.3, y0);
      ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    }
    ctx.restore();
    eyePath(); ctx.lineWidth = 4.5; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.restore();
  }

  function catMouth(ctx, C, R, p) {
    const kind = p.mouth || 'w';
    const open = clamp(p.open || 0);
    const y = R * 0.42;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // philtrum
    ctx.beginPath(); ctx.moveTo(0, R * 0.31); ctx.lineTo(0, y);
    ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    if ((kind === 'sing' || kind === 'yowl' || kind === 'o') && open > 0.05) {
      const ww = R * (kind === 'yowl' ? 0.36 : kind === 'o' ? 0.16 : 0.26) * (0.7 + 0.3 * open);
      const hh = R * (kind === 'yowl' ? 0.62 : 0.42) * open + R * 0.06;
      ctx.beginPath();
      ctx.moveTo(-ww, y);
      ctx.quadraticCurveTo(0, y - R * 0.05, ww, y);
      ctx.quadraticCurveTo(ww * 1.05, y + hh, 0, y + hh * 1.1);
      ctx.quadraticCurveTo(-ww * 1.05, y + hh, -ww, y);
      ctx.closePath();
      fs(ctx, '#5b1d2a', 4);
      ctx.save(); ctx.clip();
      ellipse(ctx, 0, y + hh * 1.05, ww * 0.7, hh * 0.45); ctx.fillStyle = '#f17a8c'; ctx.fill();
      // little fangs
      ctx.fillStyle = '#ffffff';
      [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(sd * ww * 0.75, y); ctx.lineTo(sd * ww * 0.5, y); ctx.lineTo(sd * ww * 0.62, y + R * 0.1); ctx.closePath(); ctx.fill(); });
      ctx.restore();
    } else {
      // the ω mouth (a smile curls the corners up)
      const up = kind === 'smile' ? 0.08 : 0;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.quadraticCurveTo(-R * 0.08, y + R * 0.14, -R * 0.2, y + R * (0.02 - up));
      ctx.moveTo(0, y); ctx.quadraticCurveTo(R * 0.08, y + R * 0.14, R * 0.2, y + R * (0.02 - up));
      ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
      if (kind === 'tongue') {
        const lick = Math.sin((p.t || 0) * 8) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.ellipse(R * (0.06 + 0.08 * lick), y + R * 0.14, R * 0.1, R * 0.12, 0.3, 0, TAU);
        fs(ctx, '#f17a8c', 3.5);
      }
    }
    ctx.restore();
  }

  function whiskers(ctx, C, R, t) {
    const tw = Math.sin(t * 5.3) * 0.03;
    [-1, 1].forEach((sd) => {
      for (let i = 0; i < 3; i++) {
        const a0 = (-0.18 + i * 0.16) + tw;
        const x0 = sd * R * 0.32, y0 = R * (0.38 + i * 0.05);
        const x1 = sd * R * 1.42, y1 = y0 + Math.tan(a0) * R * 1.1;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - R * 0.05, x1, y1);
        ctx.lineWidth = 4.2; ctx.strokeStyle = 'rgba(43,26,20,0.45)'; ctx.stroke();
        ctx.lineWidth = 2.4; ctx.strokeStyle = C.whiskerC; ctx.stroke();
      }
    });
  }

  /* just the head, centred on (0, 0) in the current transform */
  function catHead(ctx, C, p) {
    const R = C.R, t = p.t || 0;
    const tu = clamp(p.turn || 0, -1, 1);
    const fx = tu * R * 0.2;
    ear(ctx, C, -1, clamp(p.earL || 0), t);
    ear(ctx, C, 1, clamp(p.earR || 0), t);
    headPath(ctx, R, C.fluffy);
    fs(ctx, C.fur, 5);
    ctx.save();
    headPath(ctx, R, C.fluffy);
    ctx.clip();
    // soft shading
    ellipse(ctx, R * 0.9, R * 0.3, R * 0.55, R * 1.0); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fill();
    ellipse(ctx, -R * 0.35 + fx, -R * 0.45, R * 0.4, R * 0.25); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    if (C.white) {
      // tuxedo: white blaze up the nose, white muzzle and chin
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.moveTo(fx - R * 0.05, -R * 0.42);
      ctx.quadraticCurveTo(fx - R * 0.02, -R * 0.5, fx + R * 0.05, -R * 0.42);
      ctx.quadraticCurveTo(fx + R * 0.1, R * 0.05, fx + R * 0.34, R * 0.3);
      ctx.quadraticCurveTo(fx + R * 0.5, R * 0.62, fx + R * 0.2, R * 0.95);
      ctx.lineTo(fx - R * 0.2, R * 0.95);
      ctx.quadraticCurveTo(fx - R * 0.5, R * 0.62, fx - R * 0.34, R * 0.3);
      ctx.quadraticCurveTo(fx - R * 0.1, R * 0.05, fx - R * 0.05, -R * 0.42);
      ctx.fill();
    } else {
      // ginger: cream muzzle + chin, forehead M and cheek stripes
      ellipse(ctx, fx, R * 0.52, R * 0.46, R * 0.34); ctx.fillStyle = C.cream; ctx.fill();
      ctx.strokeStyle = C.stripe; ctx.lineCap = 'round'; ctx.lineWidth = R * 0.075;
      [[-0.2, -0.84, -0.12, -0.46], [0, -0.9, 0, -0.5], [0.2, -0.84, 0.12, -0.46], [-0.38, -0.74, -0.3, -0.52], [0.38, -0.74, 0.3, -0.52]].forEach(([a, b, c, d]) => {
        ctx.beginPath(); ctx.moveTo(a * R + fx, b * R); ctx.lineTo(c * R + fx, d * R); ctx.stroke();
      });
      [-1, 1].forEach((sd) => {
        [0.06, 0.22].forEach((yy) => {
          ctx.beginPath(); ctx.moveTo(sd * R * 1.15, R * yy); ctx.quadraticCurveTo(sd * R * 0.95, R * (yy - 0.04), sd * R * 0.8, R * (yy + 0.02)); ctx.stroke();
        });
      });
    }
    ctx.restore();
    // blush
    const blush = p.blush == null ? 0.3 : p.blush;
    if (blush > 0) [-1, 1].forEach((sd) => { ellipse(ctx, sd * R * 0.62 + fx, R * 0.3, R * 0.16, R * 0.09); ctx.fillStyle = `rgba(255,120,140,${blush})`; ctx.fill(); });
    // eyes
    [-1, 1].forEach((sd) => catEye(ctx, C, sd * R * 0.4 + fx, -R * 0.08, R * 0.2, R * 0.2, p, sd));
    // nose
    ctx.beginPath();
    ctx.moveTo(fx * 1.1 - R * 0.1, R * 0.2); ctx.quadraticCurveTo(fx * 1.1, R * 0.16, fx * 1.1 + R * 0.1, R * 0.2);
    ctx.quadraticCurveTo(fx * 1.1 + R * 0.06, R * 0.3, fx * 1.1, R * 0.32);
    ctx.quadraticCurveTo(fx * 1.1 - R * 0.06, R * 0.3, fx * 1.1 - R * 0.1, R * 0.2);
    fs(ctx, C.nose, 3.5);
    ctx.save(); ctx.translate(fx * 1.1, 0);
    catMouth(ctx, C, R, p);
    whiskers(ctx, C, R, t);
    ctx.restore();
  }
  RV.catHeadDraw = (ctx, id, p) => catHead(ctx, CATS[id], p);

  // ---------------------------------------------------------------- tail
  function tail(ctx, C, base, len, sway, t, wid) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const a = -Math.PI / 2 + 0.9 + sway * Math.sin(t * 2.4 - u * 2.2) * 0.9 * u - u * 1.5;
      const prev = pts[i - 1] || base;
      pts.push(i === 0 ? base : [prev[0] + Math.cos(a) * len / 8, prev[1] + Math.sin(a) * len / 8]);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const draw = (w, c) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); };
    draw(wid + 10, OUT);
    draw(wid, C.fur);
    if (C.stripes) {
      ctx.save(); ctx.lineWidth = wid * 0.9; ctx.strokeStyle = C.stripe; ctx.lineCap = 'butt';
      for (let i = 2; i < 8; i += 2) { ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(lerp(pts[i][0], pts[i + 1][0], 0.45), lerp(pts[i][1], pts[i + 1][1], 0.45)); ctx.stroke(); }
      ctx.restore();
    }
    if (C.fluffy) { circle(ctx, pts[8][0], pts[8][1], wid * 0.62); fs(ctx, C.fur); }
    return pts;
  }

  // body stripes for the ginger, clipped to whatever path is current
  function bodyStripes(ctx, C, x0, y0, x1, y1, n, curveAmt) {
    if (!C.stripes) return;
    ctx.save(); ctx.clip();
    ctx.strokeStyle = C.stripe; ctx.lineWidth = 11; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, y = lerp(y0, y1, u);
      [-1, 1].forEach((sd) => {
        ctx.beginPath(); ctx.moveTo(sd * x1, y - 6); ctx.quadraticCurveTo(sd * (x0 + (x1 - x0) * 0.5), y + curveAmt, sd * x0, y + 4);
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  function paw(ctx, C, x, y, w, pale) {
    ellipse(ctx, x, y, w * 0.62, w * 0.36); fs(ctx, pale ? light(C) : C.fur, 4.5);
    ctx.beginPath(); ctx.moveTo(x - w * 0.18, y - w * 0.22); ctx.lineTo(x - w * 0.18, y + w * 0.08); ctx.moveTo(x + w * 0.18, y - w * 0.22); ctx.lineTo(x + w * 0.18, y + w * 0.08);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(43,26,20,0.6)'; ctx.stroke();
  }

  // one front leg + paw on its own, from (x0, y0) to the paw at (x1, y1): paws resting on a table in front
  // of a cat who is sitting behind it
  RV.catPaw = function (ctx, id, x0, y0, x1, y1, s = 1) {
    const C = CATS[id];
    ctx.save(); ctx.translate(x0, y0); ctx.scale(s, s);
    const hx = (x1 - x0) / s, hy = (y1 - y0) / s;
    const pts = [[0, 0], [hx * 0.5, hy * 0.5 - 6], [hx, hy]];
    limb(ctx, pts, 30, limbC(C), 5);
    rim(ctx, C, pts, 30);
    paw(ctx, C, hx, hy + 2, 38, !!C.white);
    ctx.restore();
  };

  // ---------------------------------------------------------------- the whole cat
  RV.drawCat = function (ctx, id, p) {
    const C = CATS[id];
    const t = p.t || 0;
    const pose = p.pose || 'sit';
    ctx.save();
    ctx.translate(p.x || 0, (p.y || 0) - (p.jump || 0));
    const s = p.s || 1;
    ctx.scale(s * (p.face || 1), s * (p.squash || 1));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bob = p.bob || 0;
    const lw = 5;
    const R = C.R;
    let headAt;
    let arms = [];

    if (pose === 'loaf') {
      // lying down with the paws tucked (the photo): a big round loaf, the head low at the front
      const L = C.bodyW * 1.25, Hh = R * 1.55;
      tail(ctx, C, [L * 0.7, -Hh * 0.25], R * 1.3, (p.tail == null ? 0.15 : p.tail), t, C.fluffy ? 30 : 24);
      const dome = () => { ctx.beginPath(); ctx.moveTo(-L, -4); ctx.bezierCurveTo(-L * 1.12, -Hh * 1.3, L * 1.12, -Hh * 1.3, L, -4); ctx.closePath(); };
      dome(); fs(ctx, C.fur, lw);
      dome(); bodyStripes(ctx, C, L * 0.1, -Hh * 0.92, L * 1.1, -Hh * 0.1, 4, 26);
      dome(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
      if (p.drape > 0) {
        // a front leg stretched out sideways, over whoever is next to them
        const d = clamp(p.drape);
        const sx = -R * 0.45, sy = -R * 0.35;
        const hx = sx - R * 1.5 * d, hy = sy + R * 0.35 * d;
        limb(ctx, [[sx, sy], [lerp(sx, hx, 0.5), lerp(sy, hy, 0.5) - 10 * d], [hx, hy]], 34, limbC(C), lw);
        paw(ctx, C, hx - 6, hy + 4, 42, true);
      }
      paw(ctx, C, R * 0.34, -8, 40, true);
      if (!(p.drape > 0)) paw(ctx, C, -R * 0.34, -8, 40, true);
      headAt = [0, -R * 0.95];
    } else if (pose === 'stand') {
      // up on the hind legs: dancing, singing into a fork
      const hipY = -95 + bob;
      tail(ctx, C, [20, hipY + 10], R * 1.5, (p.tail == null ? 0.6 : p.tail), t, C.fluffy ? 30 : 24);
      const fl = p.footL || [0, 0], fr = p.footR || [0, 0];
      [[-1, fl], [1, fr]].forEach(([sd, f]) => {
        const ch = RV.ik(sd * 30, hipY + 12, sd * 42 + f[0], -f[1] - 10, 56, 52, sd > 0 ? 1 : -1);
        limb(ctx, ch, 34, limbC(C), lw);
        rim(ctx, C, ch, 34);
        paw(ctx, C, ch[2][0] + sd * 6, ch[2][1] + 6, 44, !!C.white);
      });
      const top = hipY - 128, belly = (C.stripes ? 12 : 4) + (p.belly || 0) * 26;
      const torso = () => {
        ctx.beginPath();
        ctx.moveTo(-40, top + 6);
        ctx.bezierCurveTo(-72 - belly, top + 60, -70 - belly, hipY + 30, -36, hipY + 32);
        ctx.lineTo(36, hipY + 32);
        ctx.bezierCurveTo(70 + belly, hipY + 30, 72 + belly, top + 60, 40, top + 6);
        ctx.closePath();
      };
      torso(); fs(ctx, C.fur, lw);
      torso(); bodyStripes(ctx, C, 0, top + 20, 80 + belly, hipY + 20, 4, 18);
      // chest / belly patch
      ctx.save(); torso(); ctx.clip();
      ellipse(ctx, 0, top + 72 + (p.belly || 0) * 8, 38 + belly * 0.8, 70 + belly * 0.5); ctx.fillStyle = light(C); ctx.fill();
      ctx.restore();
      torso(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
      headAt = [0, top - R * 0.6];
      arms = [[-1, p.armL || [0.35, 0.3], p.handL], [1, p.armR || [0.35, 0.3], p.handR]].map(([sd, a, target]) => {
        const sx = sd * 40, sy = top + 22;
        let ch;
        if (target) ch = RV.ik(sx, sy, target[0], target[1], 50, 48, sd > 0 ? -1 : 1);
        else {
          const a1 = sd * a[0], a2 = a1 + sd * (a[1] || 0);
          const e = [sx + Math.sin(a1) * 50, sy + Math.cos(a1) * 50];
          ch = [[sx, sy], e, [e[0] + Math.sin(a2) * 48, e[1] + Math.cos(a2) * 48]];
        }
        return { side: sd, chain: ch };
      });
    } else {
      // sitting (the default)
      const bH = C.bodyH, bW = C.bodyW;
      tail(ctx, C, [bW * 0.6, -18], R * 1.6, (p.tail == null ? 0.35 : p.tail), t, C.fluffy ? 32 : 24);
      [-1, 1].forEach((sd) => { ellipse(ctx, sd * bW * 0.62, -bH * 0.25 + bob * 0.3, bW * 0.5, bH * 0.3, sd * 0.2); fs(ctx, C.fur, lw); });
      const body = () => {
        ctx.beginPath();
        ctx.moveTo(-bW * 0.5, -bH + bob);
        ctx.bezierCurveTo(-bW * 1.0, -bH * 0.72 + bob, -bW * 0.95, -bH * 0.1, -bW * 0.62, -4);
        ctx.lineTo(bW * 0.62, -4);
        ctx.bezierCurveTo(bW * 0.95, -bH * 0.1, bW * 1.0, -bH * 0.72 + bob, bW * 0.5, -bH + bob);
        ctx.closePath();
      };
      body(); fs(ctx, C.fur, lw);
      body(); bodyStripes(ctx, C, bW * 0.2, -bH * 0.85, bW * 1.05, -bH * 0.15, 4, 16);
      ctx.save(); body(); ctx.clip();
      ctx.beginPath();
      ctx.moveTo(-bW * 0.36, -bH + bob); ctx.quadraticCurveTo(0, -bH * 0.84 + bob, bW * 0.36, -bH + bob);
      ctx.quadraticCurveTo(bW * 0.5, -bH * 0.45, bW * 0.22, -bH * 0.12);
      ctx.quadraticCurveTo(0, -bH * 0.02, -bW * 0.22, -bH * 0.12);
      ctx.quadraticCurveTo(-bW * 0.5, -bH * 0.45, -bW * 0.36, -bH + bob);
      ctx.fillStyle = light(C); ctx.fill();
      ctx.restore();
      body(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
      // front legs (a paw can lift)
      [-1, 1].forEach((sd) => {
        const lift = sd < 0 ? (p.pawL || 0) : (p.pawR || 0);
        const sx = sd * bW * 0.26, sy = -bH * 0.62 + bob;
        const hx = sd * (bW * 0.3 + lift * 30), hy = -14 - lift * bH * 0.55;
        const legPts = [[sx, sy], [lerp(sx, hx, 0.5) + sd * lift * 12, lerp(sy, hy, 0.5)], [hx, hy]];
        limb(ctx, legPts, 30, limbC(C), lw);
        rim(ctx, C, legPts, 30);
        if (C.stripes) {
          ctx.save(); ctx.strokeStyle = C.stripe; ctx.lineWidth = 6;
          for (let k = 1; k < 3; k++) { const q = [lerp(sx, hx, k / 3), lerp(sy, hy, k / 3)]; ctx.beginPath(); ctx.moveTo(q[0] - 12, q[1]); ctx.lineTo(q[0] + 12, q[1] + 3); ctx.stroke(); }
          ctx.restore();
        }
        paw(ctx, C, hx, hy + 4, 38, !!C.white);
        if (sd < 0 && p.holdL) p.holdL(ctx, [hx, hy]);
        if (sd > 0 && p.holdR) p.holdR(ctx, [hx, hy]);
      });
      headAt = [0, -bH - R * 0.55 + bob];
    }

    // front legs as arms (stand pose): behind or in front of the head
    const armFront = (A) => {
      if (p.armsFront != null) return p.armsFront.includes(A.side < 0 ? 'L' : 'R');
      const [sP, eP, hP] = A.chain;
      for (let i = 3; i <= 10; i++) {
        const u = i / 10;
        const q = u < 0.5 ? [lerp(sP[0], eP[0], u * 2), lerp(sP[1], eP[1], u * 2)] : [lerp(eP[0], hP[0], u * 2 - 1), lerp(eP[1], hP[1], u * 2 - 1)];
        if (q[1] > sP[1] - 6) continue;
        const dx = (q[0] - headAt[0]) / (R * 1.2 + 14), dy = (q[1] - headAt[1]) / (R * 1.0 + 14);
        if (dx * dx + dy * dy < 1) return true;
      }
      return false;
    };
    const drawArm = (A) => {
      const [sP, eP, hP] = A.chain;
      limb(ctx, [sP, eP, hP], 28, limbC(C), lw);
      rim(ctx, C, [sP, eP, hP], 28);
      if (C.stripes) {
        ctx.save(); ctx.strokeStyle = C.stripe; ctx.lineWidth = 6;
        [0.3, 0.7].forEach((k) => { const q = k < 0.5 ? [lerp(sP[0], eP[0], k * 2), lerp(sP[1], eP[1], k * 2)] : [lerp(eP[0], hP[0], k * 2 - 1), lerp(eP[1], hP[1], k * 2 - 1)]; circle(ctx, q[0], q[1], 7); ctx.fillStyle = C.stripe; ctx.fill(); });
        ctx.restore();
      }
      circle(ctx, hP[0], hP[1], 19); fs(ctx, C.white ? C.white : C.cream, lw);
    };
    // a napkin bib tied round the neck (under the head, so a wide-open mouth is never covered)
    if (p.bib) {
      const [bx, by] = headAt;
      const bib = () => {
        ctx.beginPath();
        ctx.moveTo(bx - R * 0.72, by + R * 0.55); ctx.lineTo(bx + R * 0.72, by + R * 0.55);
        ctx.lineTo(bx + R * 0.55, by + R * 1.65); ctx.quadraticCurveTo(bx, by + R * 1.85, bx - R * 0.55, by + R * 1.65);
        ctx.closePath();
      };
      bib(); fs(ctx, '#ffffff', lw);
      ctx.save(); bib(); ctx.clip(); ctx.fillStyle = p.bib;
      for (let k = -4; k <= 4; k++) ctx.fillRect(bx + k * R * 0.28 - R * 0.06, by + R * 0.5, R * 0.13, R * 1.5);
      for (let k = 0; k < 5; k++) ctx.fillRect(bx - R, by + R * (0.62 + k * 0.28), R * 2, R * 0.13);
      ctx.restore();
      bib(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    }
    arms.forEach((A) => { A.front = armFront(A); if (!A.front) drawArm(A); });

    ctx.save();
    ctx.translate(headAt[0], headAt[1]);
    ctx.rotate((p.headTilt || 0) + (p.lean || 0));
    catHead(ctx, C, p);
    ctx.restore();

    arms.forEach((A) => { if (A.front) drawArm(A); });
    arms.forEach((A) => { const hold = A.side < 0 ? p.holdL : p.holdR; if (hold) hold(ctx, A.chain[2]); });
    ctx.restore();
    return { head: headAt, arms };
  };
})(globalThis.RV);
