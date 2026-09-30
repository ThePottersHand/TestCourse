/* The kitchen and dining room (from the photo: red wood floor, teal rug with gold swirls, mint wall,
 * light-oak cupboards, the dark slat-back chair) and the props: pots, food, the old tin, the calendar...
 * World: floor at y = 1000 (where feet stand), x from about -700 to 2600 so the camera can pan.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ellipse, circle, fs, rrect, hash, glow } = RV;
  const OUT = RV.OUT;
  const FLOOR = 1000;
  RV.FLOOR = FLOOR;
  const OAK = '#e2b57a', OAK_SH = '#c9955a', OAK_HI = '#f0cf9e';
  const DARKWOOD = '#5a3a28', DARKWOOD_HI = '#7a5238';

  // ---------------------------------------------------------------- room
  RV.kitchen = function (ctx, t, o = {}) {
    const dusk = clamp(o.dusk || 0);
    // wall
    ctx.fillStyle = RV.mix('#a9dcc9', '#5d7f88', dusk * 0.6); ctx.fillRect(-2400, -900, 6000, FLOOR + 900);
    ctx.fillStyle = RV.rgba('#ffffff', 0.12 * (1 - dusk));
    for (let x = -2400; x < 3600; x += 90) ctx.fillRect(x, -900, 36, FLOOR + 900);
    // window with curtains
    const wx = 900, wy = 170, ww = 330, wh = 290;
    rrect(ctx, wx - 16, wy - 16, ww + 32, wh + 32, 10); fs(ctx, '#fbf6ea', 5);
    ctx.save(); rrect(ctx, wx, wy, ww, wh, 6); ctx.clip();
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, RV.mix('#6ec6ff', '#2b2d6e', dusk)); sky.addColorStop(1, RV.mix('#c9eeff', '#f08a5d', dusk));
    ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
    if (dusk < 0.6) RV.cloud(ctx, wx + 90 + ((t * 12) % 200), wy + 80, 0.6, '#ffffff', 0.9 * (1 - dusk));
    else { circle(ctx, wx + 250, wy + 70, 26); ctx.fillStyle = RV.rgba('#fff4cf', (dusk - 0.6) * 2.5); ctx.fill(); }
    ctx.fillStyle = '#7cc46a'; ctx.fillRect(wx, wy + wh - 60, ww, 60);
    RV.tree(ctx, wx + 60, wy + wh - 20, 0.55, { t });
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.lineWidth = 10; ctx.strokeStyle = '#fbf6ea'; ctx.stroke();
    rrect(ctx, wx, wy, ww, wh, 6); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    // curtains, tied back at the sides
    [-1, 1].forEach((sd) => {
      const cx = sd < 0 ? wx - 20 : wx + ww + 20, top = wy - 40, bot = wy + wh + 50, tie = wy + wh * 0.62;
      ctx.beginPath();
      ctx.moveTo(cx + sd * 60, top); ctx.lineTo(cx - sd * 70, top);
      ctx.quadraticCurveTo(cx - sd * 40, tie - 60, cx + sd * 10, tie);
      ctx.quadraticCurveTo(cx - sd * 30, bot - 50, cx - sd * 40, bot);
      ctx.lineTo(cx + sd * 64, bot);
      ctx.closePath();
      fs(ctx, '#f28482', 5);
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(160,40,60,0.35)'; ctx.lineWidth = 8;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx + sd * (40 - k * 30), top); ctx.quadraticCurveTo(cx + sd * (20 - k * 12), tie, cx + sd * (30 - k * 28), bot); ctx.stroke(); }
      ctx.restore();
      rrect(ctx, cx - 16, tie - 8, 40, 16, 8); fs(ctx, '#ffd23f', 3.5);
    });
    rrect(ctx, wx - 110, wy - 52, ww + 220, 20, 8); fs(ctx, DARKWOOD, 4);
    // wall calendar
    RV.calendar(ctx, 700, 250, o.calS || 1, o.calPage || 'TUE', o.calFlip || 0);
    // upper cupboards (the second from the right is the one with the old tin in it)
    for (let i = 0; i < 3; i++) {
      const cx = -520 + i * 200;
      rrect(ctx, cx, 170, 190, 300, 8); fs(ctx, OAK, 5);
      rrect(ctx, cx + 18, 190, 154, 260, 6); fs(ctx, OAK_HI, 3);
      circle(ctx, cx + 150, 410, 8); fs(ctx, '#caa04a', 3);
    }
    RV.cupboard(ctx, 90, 170, 1, o.cupOpen || 0, t, o.tinInside !== false);
    // shelf with glasses
    rrect(ctx, 1340, 390, 300, 18, 5); fs(ctx, DARKWOOD, 4);
    [1390, 1490, 1590].forEach((gx, i) => RV.glass(ctx, gx, 390, 1, i === 1 ? clamp(o.crack || 0) : clamp((o.crack || 0) - 0.3 * i), t));
    // skirting
    ctx.fillStyle = OAK_SH; ctx.fillRect(-2400, FLOOR - 40, 6000, 40);
    ctx.beginPath(); ctx.moveTo(-2400, FLOOR - 40); ctx.lineTo(3600, FLOOR - 40); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    RV.woodFloor(ctx, t);
    RV.rug(ctx, 960, FLOOR + 40, 1);
    // counter + lower cabinets
    rrect(ctx, -700, FLOOR - 300, 1080, 306, 6); fs(ctx, OAK, 5);
    for (let i = 0; i < 5; i++) {
      const cx = -680 + i * 210;
      rrect(ctx, cx, FLOOR - 270, 190, 240, 6); fs(ctx, OAK_HI, 3.5);
      rrect(ctx, cx + 75, FLOOR - 240, 40, 10, 5); fs(ctx, '#caa04a', 3);
    }
    rrect(ctx, -720, FLOOR - 330, 1120, 40, 8); fs(ctx, '#f4ecdc', 5);
    RV.fridge(ctx, 1860, FLOOR + 8, 1, o);
    if (dusk > 0) {
      ctx.fillStyle = `rgba(40,20,70,${0.28 * dusk})`; ctx.fillRect(-2400, -900, 6000, 3000);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 960, 200, 900, '#ffb870', 0.25 * dusk);
      ctx.restore();
    }
  };

  RV.woodFloor = function (ctx) {
    ctx.fillStyle = '#c4693b'; ctx.fillRect(-2400, FLOOR, 6000, 1000);
    // planks: rows get taller toward the viewer, joints staggered
    let y = FLOOR, h = 22, row = 0;
    while (y < FLOOR + 900) {
      const off = (hash(row * 3.7) * 300) | 0;
      for (let x = -2400 - off; x < 3600; x += 260 + ((hash(row * 5.1) * 120) | 0)) {
        const shade = hash(row * 7.3 + x * 0.01);
        ctx.fillStyle = shade > 0.66 ? '#cf7646' : shade > 0.33 ? '#b95f33' : '#c4693b';
        ctx.fillRect(x, y, 256, h);
        ctx.fillStyle = 'rgba(80,30,10,0.35)'; ctx.fillRect(x + 254, y, 3, h);
      }
      ctx.fillStyle = 'rgba(80,30,10,0.35)'; ctx.fillRect(-2400, y + h - 2, 6000, 2);
      y += h; h *= 1.18; row++;
    }
    ctx.fillStyle = 'rgba(255,230,200,0.12)'; ctx.fillRect(-2400, FLOOR, 6000, 18);
    ctx.beginPath(); ctx.moveTo(-2400, FLOOR); ctx.lineTo(3600, FLOOR); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  };

  // the teal rug with the gold swirl lines, seen at a low angle
  RV.rug = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const path = () => { ctx.beginPath(); ctx.moveTo(-420, -20); ctx.lineTo(420, -20); ctx.lineTo(520, 90); ctx.lineTo(-520, 90); ctx.closePath(); };
    path(); fs(ctx, '#1f8c8e', 5);
    ctx.save(); path(); ctx.clip();
    ctx.strokeStyle = '#d8c27e'; ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(80 + i * 22, 30, 160 + i * 25, 26 + i * 6, 0.12, Math.PI * 0.9, Math.PI * 2.25);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  RV.calendar = function (ctx, x, y, s, page, flip) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rrect(ctx, -70, -90, 140, 180, 8); fs(ctx, '#ffffff', 5);
    rrect(ctx, -70, -90, 140, 44, 8); fs(ctx, '#e63946', 5);
    circle(ctx, 0, -100, 7); fs(ctx, '#caa04a', 3);
    ctx.font = `30px ${RV.FONT.title}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('YUM', 0, -66);
    ctx.font = `54px ${RV.FONT.title}`; ctx.fillStyle = OUT; ctx.fillText(page, 0, 12);
    RV.fish(ctx, 0, 62, 0.42, 0, '#ff9f1c', 1);
    if (flip > 0) {
      // the page tearing off and flying away
      ctx.save(); ctx.translate(-70 + flip * 40, -46); ctx.rotate(-flip * 1.8);
      ctx.globalAlpha *= 1 - flip;
      rrect(ctx, 0, 0, 140, 136, 6); fs(ctx, '#ffffff', 4);
      ctx.restore();
    }
    ctx.restore();
  };

  RV.cupboard = function (ctx, x, y, s, open, t, tin) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // inside
    rrect(ctx, 0, 0, 260, 300, 8); fs(ctx, '#3b2a22', 5);
    rrect(ctx, 10, 146, 240, 12, 4); fs(ctx, OAK_SH, 3);
    // jars and boxes on the shelves
    rrect(ctx, 24, 60, 52, 86, 6); fs(ctx, '#f4a261', 3.5);
    rrect(ctx, 86, 80, 40, 66, 10); fs(ctx, '#bde0fe', 3.5);
    rrect(ctx, 190, 70, 44, 76, 6); fs(ctx, '#90be6d', 3.5);
    if (tin) {
      const g = clamp(open);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 150, 250, 130, '#b7ff6b', 0.6 * g); ctx.restore();
      RV.oldTin(ctx, 150, 292, 0.8, t, g);
    }
    ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // the door swings open (hinged on the right, handle on the left)
    const k = Math.cos(clamp(open) * Math.PI * 0.46);
    if (k > 0.02) {
      ctx.save(); ctx.translate(260, 0); ctx.scale(k, 1);
      rrect(ctx, -260, 0, 260, 300, 8); fs(ctx, OAK, 5);
      rrect(ctx, -240, 20, 220, 260, 6); fs(ctx, OAK_HI, 3);
      circle(ctx, -225, 240, 9); fs(ctx, '#caa04a', 3);
      ctx.restore();
    } else {
      rrect(ctx, 260, 0, 26, 300, 6); fs(ctx, OAK_SH, 4);
    }
    ctx.restore();
  };

  // the dusty old tin from the back of the cupboard ("best before 1972")
  RV.oldTin = function (ctx, x, y, s, t, glowAmt = 0, lidOff = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (glowAmt > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -70, 160, '#b7ff6b', 0.5 * glowAmt); ctx.restore(); }
    rrect(ctx, -62, -130, 124, 130, 10); fs(ctx, '#9aa4ad', 5);
    rrect(ctx, -62, -104, 124, 78, 4); fs(ctx, '#c8553d', 4);
    ctx.font = `24px ${RV.FONT.title}`; ctx.fillStyle = '#fff3d6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('???', 0, -82);
    ctx.font = `13px ${RV.FONT.body}`; ctx.fillText('BEST BEFORE', 0, -58); ctx.font = `18px ${RV.FONT.title}`; ctx.fillText('1972', 0, -40);
    // dust + cobweb
    ctx.fillStyle = 'rgba(210,200,180,0.45)'; for (let i = 0; i < 9; i++) { circle(ctx, -50 + hash(i) * 100, -120 + hash(i * 3) * 110, 4 + hash(i * 5) * 4); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(40, -130); ctx.lineTo(40 + Math.cos(i * 0.4 - 0.2) * 60, -130 + Math.sin(i * 0.4 + 0.3) * 60); ctx.stroke(); }
    for (let r = 18; r < 60; r += 14) { ctx.beginPath(); ctx.arc(40, -130, r, -0.2, 1.4); ctx.stroke(); }
    // lid (can pop off)
    ctx.save(); ctx.translate(0, -130 - lidOff * 160); ctx.rotate(lidOff * 2.5);
    ellipse(ctx, 0, 0, 64, 14); fs(ctx, '#b7c0c8', 4.5);
    ctx.beginPath(); ctx.arc(30, -2, 12, Math.PI, TAU); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.restore();
    // stink lines + a fly
    ctx.strokeStyle = 'rgba(140,200,80,0.8)'; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const ph = RV.fract(t * 0.8 + i / 3);
      ctx.save(); ctx.globalAlpha *= Math.sin(ph * Math.PI);
      ctx.beginPath(); ctx.moveTo(-30 + i * 30, -150 - ph * 80);
      for (let k = 1; k < 6; k++) ctx.lineTo(-30 + i * 30 + Math.sin(k * 1.6 + t * 4) * 8, -150 - ph * 80 - k * 12);
      ctx.stroke(); ctx.restore();
    }
    const fx = Math.cos(t * 5) * 70, fy = -170 + Math.sin(t * 7) * 30;
    circle(ctx, fx, fy, 6); fs(ctx, OUT);
    ellipse(ctx, fx - 5, fy - 7, 6, 4, -0.5); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
  };

  RV.glass = function (ctx, x, y, s, crack, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (crack >= 0.999) {
      // shattered: shards falling
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.translate((hash(i) - 0.5) * 60, -40 + ((t * 300) % 200)); ctx.rotate(t * 5 + i);
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 6); ctx.lineTo(-7, 5); ctx.closePath();
        ctx.fillStyle = 'rgba(200,240,255,0.8)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    ctx.beginPath(); ctx.moveTo(-26, -110); ctx.quadraticCurveTo(-30, -60, 0, -52); ctx.quadraticCurveTo(30, -60, 26, -110); ctx.closePath();
    ctx.fillStyle = 'rgba(200,240,255,0.55)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(0, -8); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.lineWidth = 5; ctx.stroke();
    if (crack > 0) {
      ctx.beginPath(); ctx.moveTo(-10, -106); ctx.lineTo(-2, -88); ctx.lineTo(-12, -76); ctx.lineTo(4, -64);
      ctx.moveTo(-2, -88); ctx.lineTo(14, -94);
      ctx.lineWidth = 2.5; ctx.strokeStyle = RV.rgba('#1b2a3a', clamp(crack * 2)); ctx.stroke();
    }
    ctx.restore();
  };

  RV.fridge = function (ctx, x, y, s, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rrect(ctx, -170, -560, 340, 560, 26); fs(ctx, '#f1f4f2', 6);
    ctx.beginPath(); ctx.moveTo(-170, -380); ctx.lineTo(170, -380); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    rrect(ctx, 120, -520, 18, 110, 9); fs(ctx, '#c9ccd6', 4);
    rrect(ctx, 120, -350, 18, 150, 9); fs(ctx, '#c9ccd6', 4);
    // magnets and a child's drawing
    [[-110, -330, '#ff4fa3'], [-40, -300, '#ffd23f'], [40, -330, '#4cc9f0']].forEach(([mx, my, c]) => { circle(ctx, mx, my, 12); fs(ctx, c, 3); });
    rrect(ctx, -120, -250, 120, 90, 4); fs(ctx, '#ffffff', 3);
    ctx.strokeStyle = '#ff9f1c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-60, -205, 22, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-100, -170); ctx.lineTo(-20, -170); ctx.strokeStyle = '#06d6a0'; ctx.stroke();
    if (o.polaroid) o.polaroid(ctx);
    ctx.restore();
  };

  // ---------------------------------------------------------------- furniture
  // the dining chair from the photo: dark slat back, dark seat. part: 'back' | 'seat' | 'all'
  RV.chair = function (ctx, x, y, s, part = 'all') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (part !== 'seat') {
      rrect(ctx, -110, -420, 26, 300, 8); fs(ctx, DARKWOOD, 4.5);
      rrect(ctx, 84, -420, 26, 300, 8); fs(ctx, DARKWOOD, 4.5);
      for (let i = 0; i < 5; i++) { rrect(ctx, -72 + i * 34, -400, 14, 260, 6); fs(ctx, DARKWOOD_HI, 3.5); }
      rrect(ctx, -110, -430, 220, 26, 10); fs(ctx, DARKWOOD, 4.5);
    }
    if (part !== 'back') {
      [-100, 100].forEach((lx) => { rrect(ctx, lx - 11, -130, 22, 130, 5); fs(ctx, DARKWOOD, 4); });
      ctx.beginPath(); ctx.moveTo(-130, -160); ctx.lineTo(130, -160); ctx.lineTo(150, -118); ctx.lineTo(-150, -118); ctx.closePath();
      fs(ctx, '#3a2a26', 4.5);
      rrect(ctx, -152, -122, 304, 22, 6); fs(ctx, DARKWOOD, 4.5);
    }
    ctx.restore();
  };
  RV.CHAIR_SEAT = -140; // top of the seat above the chair's feet (unscaled)

  // dining table: top at y (world), from x0 to x1; drawn over whatever stands behind it
  RV.table = function (ctx, x0, x1, y, o = {}) {
    ctx.beginPath(); ctx.moveTo(x0 + 30, y - 40); ctx.lineTo(x1 - 30, y - 40); ctx.lineTo(x1, y); ctx.lineTo(x0, y); ctx.closePath();
    fs(ctx, OAK_HI, 5);
    if (o.cloth) {
      ctx.beginPath(); ctx.moveTo(x0 + 30, y - 40); ctx.lineTo(x1 - 30, y - 40); ctx.lineTo(x1 + 10, y + 70);
      for (let x = x1 + 10; x > x0 - 10; x -= 60) ctx.quadraticCurveTo(x - 30, y + 90, x - 60, y + 70);
      ctx.closePath(); fs(ctx, '#fff4f0', 5);
      ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(230,57,70,0.28)';
      for (let x = x0 - 60; x < x1 + 60; x += 50) ctx.fillRect(x, y - 60, 22, 200);
      for (let yy = y - 40; yy < y + 100; yy += 50) ctx.fillRect(x0 - 60, yy, x1 - x0 + 120, 22);
      ctx.restore();
    } else {
      rrect(ctx, x0 - 6, y, x1 - x0 + 12, 30, 8); fs(ctx, OAK, 5);
    }
    [x0 + 40, x1 - 60].forEach((lx) => { rrect(ctx, lx, y + (o.cloth ? 80 : 26), 24, FLOOR - y - (o.cloth ? 80 : 26), 6); fs(ctx, OAK_SH, 4.5); });
  };

  // ---------------------------------------------------------------- props
  RV.pot = function (ctx, x, y, s, hit = 0, color = '#c0c7d0') {
    ctx.save(); ctx.translate(x, y - hit * 14); ctx.scale(s * (1 + hit * 0.08), s * (1 - hit * 0.1));
    // an upturned saucepan: a drum
    ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-62, -70); ctx.quadraticCurveTo(0, -84, 62, -70); ctx.lineTo(70, 0); ctx.closePath();
    fs(ctx, color, 5);
    ellipse(ctx, 0, -72, 62, 12); fs(ctx, RV.mix(color, '#ffffff', 0.35), 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-50, -60, 12, 52);
    rrect(ctx, 64, -40, 80, 16, 8); fs(ctx, '#333845', 4);
    ctx.restore();
    if (hit > 0.3) {
      ctx.save(); ctx.globalAlpha *= hit;
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6;
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.35; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 90 * s, y - 70 * s + Math.sin(a) * 60 * s); ctx.lineTo(x + Math.cos(a) * 140 * s, y - 70 * s + Math.sin(a) * 100 * s); ctx.stroke(); }
      ctx.restore();
    }
  };
  // a wooden spoon from the hand h along angle ang (0 = up); len stretches the handle
  RV.spoon = function (ctx, h, ang, s = 1, len = 1) {
    ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(ang); ctx.scale(s, s);
    const L = 110 * len;
    rrect(ctx, -5, -(L - 10), 10, L - 6, 5); fs(ctx, OAK, 3);
    ellipse(ctx, 0, -L, 16, 22); fs(ctx, OAK, 3.5);
    ctx.restore();
  };
  RV.forkMic = function (ctx, h, ang, s = 1) {
    ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(ang); ctx.scale(s, s);
    rrect(ctx, -6, -60, 12, 76, 6); fs(ctx, '#c9ccd6', 3);
    ctx.beginPath(); ctx.moveTo(-18, -60); ctx.lineTo(18, -60); ctx.lineTo(16, -76); ctx.lineTo(-16, -76); ctx.closePath(); fs(ctx, '#c9ccd6', 3);
    for (let i = 0; i < 4; i++) { rrect(ctx, -16 + i * 10, -112, 6, 40, 3); fs(ctx, '#c9ccd6', 2.5); }
    ctx.restore();
  };
  RV.drumstick = function (ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
    rrect(ctx, 30, -8, 46, 16, 8); fs(ctx, '#fff4e0', 3.5);
    circle(ctx, 80, -10, 10); fs(ctx, '#fff4e0', 3); circle(ctx, 80, 10, 10); fs(ctx, '#fff4e0', 3);
    ellipse(ctx, 0, 0, 44, 32, 0.2); fs(ctx, '#c8773a', 4);
    ellipse(ctx, -10, -10, 16, 8, 0.2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    ctx.restore();
  };
  RV.pizza = function (ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-50, -40); ctx.quadraticCurveTo(0, -56, 50, -40); ctx.lineTo(0, 60); ctx.closePath(); fs(ctx, '#ffd166', 4);
    rrect(ctx, -54, -52, 108, 18, 9); fs(ctx, '#e09f3e', 4);
    [[-18, -20], [14, -12], [-2, 14]].forEach(([a, b]) => { circle(ctx, a, b, 9); fs(ctx, '#d62828', 3); });
    ctx.restore();
  };
  RV.sausage = function (ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
    rrect(ctx, -52, -14, 104, 28, 14); fs(ctx, '#b5523b', 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-36, -5); ctx.lineTo(30, -5); ctx.stroke();
    ctx.restore();
  };
  RV.cheese = function (ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-50, 30); ctx.lineTo(50, 30); ctx.lineTo(50, -10); ctx.lineTo(-50, -30); ctx.closePath(); fs(ctx, '#ffd23f', 4);
    [[-20, 8, 7], [16, 14, 5], [26, -2, 6]].forEach(([a, b, r]) => { circle(ctx, a, b, r); fs(ctx, '#e0a800'); });
    ctx.restore();
  };
  const FOODS = [
    (c, x, y, s, r) => RV.fish(c, x, y, s * 0.9, 0, ['#ff9f1c', '#4cc9f0', '#f15bb5'][Math.floor(hash(x) * 3)], 1),
    (c, x, y, s, r) => RV.drumstick(c, x, y, s * 0.8, r),
    (c, x, y, s, r) => RV.pizza(c, x, y, s * 0.8, r),
    (c, x, y, s, r) => RV.sausage(c, x, y, s * 0.8, r),
    (c, x, y, s, r) => RV.cheese(c, x, y, s * 0.7, r),
  ];
  RV.food = (ctx, k, x, y, s, rot) => FOODS[((k % FOODS.length) + FOODS.length) % FOODS.length](ctx, x, y, s, rot);
  // food falling from the sky
  RV.foodRain = function (ctx, t, t0, o = {}) {
    const n = o.n || 26;
    for (let i = 0; i < n; i++) {
      const lt = t - t0 - hash(i * 2.1) * 1.2;
      if (lt < 0) continue;
      const x = (o.x0 || -200) + hash(i * 3.7) * ((o.x1 || 2100) - (o.x0 || -200));
      const y = (o.y0 || -150) + lt * (500 + hash(i) * 400) + 200 * lt * lt;
      if (y > (o.yMax || 1200)) continue;
      RV.food(ctx, i, x, y, o.s || 1, t * (2 + hash(i * 5) * 3) + i);
    }
  };
  RV.polaroid = function (ctx, x, y, w, rot, drawPhoto, label) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const h = w * 1.18;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-w / 2 + 10, -h / 2 + 12, w, h);
    rrect(ctx, -w / 2, -h / 2, w, h, 6); fs(ctx, '#ffffff', 5);
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + w * 0.06, -h / 2 + w * 0.06, w * 0.88, w * 0.88); ctx.clip();
    drawPhoto(ctx, -w / 2 + w * 0.06, -h / 2 + w * 0.06, w * 0.88);
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.strokeRect(-w / 2 + w * 0.06, -h / 2 + w * 0.06, w * 0.88, w * 0.88);
    if (label) { ctx.font = `${w * 0.09}px ${RV.FONT.title}`; ctx.fillStyle = '#3a3a55'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, h / 2 - w * 0.1); }
    ctx.restore();
  };
  RV.chefHat = (ctx, r) => {
    rrect(ctx, -r * 0.7, -r * 1.25, r * 1.4, r * 0.4, r * 0.1); fs(ctx, '#ffffff', 4);
    [[-0.45, -1.5, 0.38], [0.0, -1.62, 0.44], [0.45, -1.5, 0.38]].forEach(([a, b, c]) => { circle(ctx, a * r, b * r, c * r); fs(ctx, '#ffffff', 4); });
    rrect(ctx, -r * 0.7, -r * 1.25, r * 1.4, r * 0.4, r * 0.1); fs(ctx, '#ffffff');
  };
})(globalThis.RV);
