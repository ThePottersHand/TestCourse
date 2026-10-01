/* He Likes Teeth: the teeth (and the singing teeth choir), Ben's tooth suit, the tooth-fairy kit, the tooth
 * collection, and the sets: the lazy-Sunday living room, the night street, a bedroom at night, the shrine.
 * World convention as in the other videos: floor at y = 1000.
 */
(function (RV) {
  'use strict';
  const { TAU, clamp, lerp, ellipse, circle, fs, rrect, hash, glow, limb } = RV;
  const OUT = RV.OUT, W = RV.W, H = RV.H;
  const FLOOR = 1000;
  RV.FLOOR = FLOOR;
  const IVORY = '#fffdf6', IVORY_SH = '#e7e1d2';

  // ---------------------------------------------------------------- a tooth
  // A cartoon molar, about 100 wide and 130 tall, centred on its crown. o.face draws a little face:
  // { eyes: 'open' | 'closed' | 'happy' | 'wide', mouth: 'o' | 'smile' | 'flat', open, look: [x, y], blink }
  function toothPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.bezierCurveTo(15, -60, 50, -62, 50, -25);
    ctx.bezierCurveTo(50, 5, 41, 25, 36, 45);
    ctx.quadraticCurveTo(32, 76, 21, 76);
    ctx.quadraticCurveTo(11, 76, 8, 46);
    ctx.quadraticCurveTo(0, 32, -8, 46);
    ctx.quadraticCurveTo(-11, 76, -21, 76);
    ctx.quadraticCurveTo(-32, 76, -36, 45);
    ctx.bezierCurveTo(-41, 25, -50, 5, -50, -25);
    ctx.bezierCurveTo(-50, -62, -15, -60, 0, -42);
    ctx.closePath();
  }
  RV.toothPath = toothPath;
  RV.tooth = function (ctx, x, y, s, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s * (o.flip ? -1 : 1), s * (o.squash || 1));
    toothPath(ctx);
    const g = ctx.createLinearGradient(-50, -60, 40, 76);
    g.addColorStop(0, o.color || IVORY); g.addColorStop(1, o.shade || IVORY_SH);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = o.lw || 5; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.stroke();
    // shine
    ctx.beginPath(); ctx.moveTo(-34, -22); ctx.quadraticCurveTo(-36, -44, -16, -48);
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineCap = 'round'; ctx.stroke();
    if (o.bow) {
      // a bow tie where the crown meets the roots
      ctx.save(); ctx.translate(0, 34);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, -11); ctx.lineTo(-20, 11); ctx.closePath();
      ctx.moveTo(0, 0); ctx.lineTo(20, -11); ctx.lineTo(20, 11); ctx.closePath();
      fs(ctx, o.bow, 3.5);
      circle(ctx, 0, 0, 6); fs(ctx, o.bow, 3);
      ctx.restore();
    }
    if (o.face) {
      const F = o.face, lk = F.look || [0, 0], blink = clamp(F.blink || 0);
      [-1, 1].forEach((sd) => {
        const ex = sd * 17, ey = -14;
        if (F.eyes === 'closed' || F.eyes === 'happy' || blink > 0.6) {
          ctx.beginPath();
          if (F.eyes === 'happy') { ctx.moveTo(ex - 8, ey + 3); ctx.quadraticCurveTo(ex, ey - 8, ex + 8, ey + 3); }
          else { ctx.moveTo(ex - 8, ey); ctx.quadraticCurveTo(ex, ey + 6, ex + 8, ey); }
          ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
        } else {
          const big = F.eyes === 'wide' ? 1.3 : 1;
          ellipse(ctx, ex, ey, 8 * big, 10 * big); fs(ctx, '#ffffff', 3);
          circle(ctx, ex + lk[0] * 3, ey + lk[1] * 3 + 1, 4.6 * big); ctx.fillStyle = OUT; ctx.fill();
          circle(ctx, ex + lk[0] * 3 - 1.5, ey + lk[1] * 3 - 1.5, 1.6); ctx.fillStyle = '#ffffff'; ctx.fill();
        }
        ellipse(ctx, sd * 30, 4, 7, 4); ctx.fillStyle = 'rgba(255,130,150,0.45)'; ctx.fill();
      });
      const open = clamp(F.open || 0);
      if (F.mouth === 'o' || (F.mouth === 'sing' && open > 0.05)) {
        ellipse(ctx, 0, 10, 6 + 5 * open, 3 + 11 * open); fs(ctx, '#7a2c3a', 3.5);
      } else if (F.mouth === 'flat') {
        ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(8, 10); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(-9, 7); ctx.quadraticCurveTo(0, 16, 9, 7); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
      }
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- Ben in his tooth suit
  /* A big padded molar costume: Ben's face shows through an oval hole, his arms come out of the sides
   * (white sleeves) and his legs (white tights) out of the two roots.
   * pose: x, y (feet), s, t, legs (root tips to the floor, default 64; more when sitting), lean, bob,
   *   armL/armR [shoulder, elbow] or handL/handR (IK targets, local), holdL/holdR(ctx, hand),
   *   plus Ben's face fields (eyes, mouth, open, look, turn, blink, lid, brow, headTilt...).
   * Arms are drawn after the suit and the face, so poses keep the hands away from the face hole. */
  const BEN = () => RV.KIDS.ben;
  RV.toothSuit = function (ctx, p) {
    const K = BEN();
    const t = p.t || 0, s = p.s || 1, lw = 5;
    const legs = p.legs == null ? 64 : p.legs;
    ctx.save();
    ctx.translate(p.x || 0, (p.y || 0) - (p.jump || 0));
    ctx.scale(s * (p.face || 1), s * (p.squash || 1));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bob = p.bob || 0;
    // the suit's own frame: (0, 0) where the roots end; the face hole centre is 275 above that
    const rootY = -legs + bob;
    // legs: white tights and his shoes
    const fl = p.footL || [0, 0], fr = p.footR || [0, 0];
    [[-1, fl], [1, fr]].forEach(([sd, f]) => {
      const top = [sd * 30, rootY - 6], foot = [sd * 34 + f[0], -f[1] - 4];
      limb(ctx, [top, [lerp(top[0], foot[0], 0.5) + sd * 4, lerp(top[1], foot[1], 0.5)], foot], 30, '#f7f4ee', lw);
      ctx.save(); ctx.translate(foot[0], foot[1] + 4);
      ctx.beginPath(); ctx.moveTo(-sd * 16, -2); ctx.quadraticCurveTo(-sd * 18, -22, sd * 2, -21);
      ctx.quadraticCurveTo(sd * 30, -17, sd * 31, -4); ctx.lineTo(sd * 29, 2); ctx.lineTo(-sd * 16, 2); ctx.closePath();
      fs(ctx, K.shoe, lw);
      ctx.beginPath(); ctx.moveTo(-sd * 16, -2); ctx.lineTo(sd * 30, -2); ctx.lineWidth = 5; ctx.strokeStyle = K.shoeTrim; ctx.stroke();
      ctx.restore();
    });
    ctx.save();
    ctx.translate(0, rootY);
    ctx.rotate(p.lean || 0);
    // body: a molar 300 wide, 430 tall from the root tips to the top of the crown
    const SX = 3.0, SY = 3.3;
    const suit = () => { ctx.save(); ctx.translate(0, -76 * SY); ctx.scale(SX, SY); toothPath(ctx); ctx.restore(); };
    const hole = [0, -76 * SY - 2 * SY];      // face hole centre (crown centre)
    const HR = K.headR;
    // Ben's head, drawn first so the suit's hood frames his face
    const tilt = p.headTilt || 0;
    RV.drawKidHead(ctx, 'ben', Object.assign({}, p, { x: hole[0], y: hole[1] - 6, s: 1, face: 1, headTilt: tilt, neck: false, hat: null }));
    // the suit with the face hole cut out
    ctx.save();
    suit();
    ctx.ellipse(hole[0], hole[1] + 6, HR * 0.9, HR * 0.95, 0, 0, TAU, true);
    const g = ctx.createLinearGradient(-150, -400, 130, 0);
    g.addColorStop(0, IVORY); g.addColorStop(1, IVORY_SH);
    ctx.fillStyle = g; ctx.fill('evenodd');
    ctx.restore();
    suit(); ctx.lineWidth = lw * 1.3; ctx.strokeStyle = OUT; ctx.stroke();
    ellipse(ctx, hole[0], hole[1] + 6, HR * 0.9, HR * 0.95); ctx.lineWidth = lw * 1.2; ctx.stroke();
    // padded seams and a big shine
    ctx.beginPath(); ctx.moveTo(-108, -150); ctx.quadraticCurveTo(-118, -220, -100, -300);
    ctx.moveTo(108, -150); ctx.quadraticCurveTo(118, -220, 100, -300);
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(160,150,130,0.35)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-118, -330); ctx.quadraticCurveTo(-122, -400, -66, -418);
    ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
    if (p.badge) {
      // a name badge
      rrect(ctx, 30, -150, 74, 40, 8); fs(ctx, '#4cc9f0', 3.5);
      ctx.font = `22px ${RV.FONT.title}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('BEN', 67, -128);
    }
    // arms out of the sides: sleeves and hands
    const shoulders = [[-128, -236], [128, -236]];
    const arms = [[-1, p.armL || [0.4, 0.3], p.handL], [1, p.armR || [0.4, 0.3], p.handR]].map(([sd, a, target]) => {
      const sP = shoulders[sd < 0 ? 0 : 1];
      let ch;
      if (target) ch = RV.ik(sP[0], sP[1], target[0], target[1], K.ua, K.fa, sd > 0 ? -1 : 1);
      else {
        const a1 = sd * a[0], a2 = a1 + sd * (a[1] || 0);
        const e = [sP[0] + Math.sin(a1) * K.ua, sP[1] + Math.cos(a1) * K.ua];
        ch = [sP, e, [e[0] + Math.sin(a2) * K.fa, e[1] + Math.cos(a2) * K.fa]];
      }
      return { side: sd, chain: ch };
    });
    arms.forEach(({ chain }) => {
      limb(ctx, chain, 34, '#f7f4ee', lw);
      circle(ctx, chain[2][0], chain[2][1], 17); fs(ctx, '#f9d6c1', lw);
    });
    arms.forEach(({ side, chain }) => { const h = side < 0 ? p.holdL : p.holdR; if (h) h(ctx, chain[2]); });
    ctx.restore();
    ctx.restore();
    return { arms, hole: [hole[0], hole[1] + rootY] };
  };
  // height of the face (hole centre) above the feet, for framing
  RV.suitFace = (s = 1, legs = 64) => -(legs + 76 * 3.3 + 2 * 3.3) * s;

  // ---------------------------------------------------------------- tooth-fairy kit
  // wings for drawKid's p.back hook (hip frame: y = 0 at the hips)
  RV.fairyWings = function (ctx, f, o = {}) {
    const t = f.t || 0, flap = 0.82 + 0.18 * Math.sin(t * (o.speed || 9));
    const by = f.top + 34;
    [-1, 1].forEach((sd) => {
      ctx.save(); ctx.translate(0, by); ctx.scale(sd * flap, 1);
      const wing = (w, h, ang, y0) => {
        ctx.save(); ctx.rotate(ang); ctx.translate(0, y0);
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(w * 0.3, -h, w * 1.1, -h * 0.9, w, -h * 0.25);
        ctx.bezierCurveTo(w * 0.95, h * 0.1, w * 0.4, h * 0.15, 0, 0);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, 0, w, -h);
        g.addColorStop(0, 'rgba(255,170,225,0.92)'); g.addColorStop(1, 'rgba(160,225,255,0.85)');
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 4.5; ctx.strokeStyle = '#7a5ea8'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, -2); ctx.quadraticCurveTo(w * 0.5, -h * 0.55, w * 0.88, -h * 0.4);
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(122,94,168,0.6)'; ctx.stroke();
        ctx.restore();
      };
      wing(250, 230, -0.2, 0);
      wing(170, 120, 0.6, 12);
      ctx.restore();
    });
    // sparkle dust
    for (let i = 0; i < 6; i++) {
      const ph = RV.fract(t * 0.8 + i / 6);
      RV.sparkle(ctx, (hash(i) - 0.5) * 300, by - 60 + ph * 140, 10 * Math.sin(ph * Math.PI), '#fff6c8', Math.sin(ph * Math.PI));
    }
  };
  // the wand: a stick with a little tooth star on top (for holdR); ang 0 = straight up
  RV.wand = function (ctx, h, ang = 0.2, t = 0) {
    ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(ang);
    rrect(ctx, -5, -96, 10, 106, 5); fs(ctx, '#ffd23f', 3.5);
    RV.star(ctx, 0, -116, 34, 16, 5, t * 1.5); fs(ctx, '#fff3b0', 4);
    RV.tooth(ctx, 0, -116, 0.2, { lw: 3 });
    ctx.restore();
    RV.sparkle(ctx, h[0] + Math.sin(ang) * 120 + Math.sin(t * 7) * 30, h[1] - Math.cos(ang) * 120 - 20, 12 + 6 * Math.sin(t * 9), '#ffffff');
  };
  // a sack of teeth hanging from a hand (for holdL); full: 0..1
  RV.toothSack = function (ctx, h, full = 1, t = 0) {
    const s = 0.7 + 0.3 * full;
    ctx.save(); ctx.translate(h[0], h[1] + 6); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-70, 40, -58, 110); ctx.quadraticCurveTo(0, 140, 58, 110); ctx.quadraticCurveTo(70, 40, 14, 0); ctx.closePath();
    fs(ctx, '#d9b98c', 4.5);
    ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(16, 8); ctx.lineWidth = 7; ctx.strokeStyle = '#8b5e34'; ctx.stroke();
    // teeth peeking out of the top
    if (full > 0.2) [[-20, 4, -0.4], [6, -2, 0.2], [26, 8, 0.6]].forEach(([dx, dy, r], i) => RV.tooth(ctx, dx, dy - 10, 0.22, { rot: r + Math.sin(t * 3 + i) * 0.05, lw: 3 }));
    ctx.restore();
  };
  RV.coin = function (ctx, x, y, r, t = 0) {
    const sq = Math.abs(Math.cos(t * 4));
    ellipse(ctx, x, y, r * Math.max(0.15, sq), r); fs(ctx, '#ffd23f', 3.5);
    if (sq > 0.5) { ellipse(ctx, x, y, r * 0.62 * sq, r * 0.62); ctx.lineWidth = 2.5; ctx.strokeStyle = '#c99700'; ctx.stroke(); }
    RV.sparkle(ctx, x + r * 0.5, y - r * 0.6, r * 0.5 * (0.5 + 0.5 * Math.sin(t * 6)), '#ffffff');
  };

  // ---------------------------------------------------------------- the tooth collection
  const LABELS = ['MOLAR', 'WOBBLY', 'SHINY', 'No. 47', 'FANG', 'BABY', 'BEST', 'GOLD', 'MINI', 'GIANT', 'CHIPPED', '???'];
  RV.toothCabinet = function (ctx, x, y, s, t, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // cabinet body: 420 wide, 560 tall, standing on the floor at y
    rrect(ctx, -210, -560, 420, 560, 14); fs(ctx, '#8a5a3c', 5);
    rrect(ctx, -186, -530, 372, 470, 8); fs(ctx, '#5c2f3a', 4);
    // three velvet shelves of teeth on cushions
    for (let row = 0; row < 3; row++) {
      const sy = -400 + row * 150;
      rrect(ctx, -186, sy + 30, 372, 14, 4); fs(ctx, '#b07a52', 3);
      for (let i = 0; i < 4; i++) {
        const k = row * 4 + i;
        const cx = -132 + i * 88;
        ellipse(ctx, cx, sy + 26, 34, 9); fs(ctx, '#c1121f', 3);
        const glint = Math.max(0, Math.sin(t * 2.2 - k * 0.7));
        RV.tooth(ctx, cx, sy - 10, k === 9 ? 0.42 : k === 8 ? 0.2 : 0.3, { color: k === 7 ? '#ffe08a' : IVORY, shade: k === 7 ? '#e0a800' : IVORY_SH, lw: 3, rot: (hash(k) - 0.5) * 0.3 });
        if (glint > 0.92) RV.sparkle(ctx, cx + 10, sy - 30, 16 * (glint - 0.92) / 0.08, '#ffffff');
        rrect(ctx, cx - 30, sy + 48, 60, 18, 3); fs(ctx, '#fff8e7', 2);
        ctx.font = `13px ${RV.FONT.body}`; ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(LABELS[k], cx, sy + 58);
      }
    }
    // glass doors with a reflection
    ctx.fillStyle = 'rgba(200,235,255,0.12)'; ctx.fillRect(-186, -530, 372, 470);
    ctx.save(); ctx.beginPath(); ctx.rect(-186, -530, 372, 470); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.moveTo(-120, -530); ctx.lineTo(-60, -530); ctx.lineTo(-180, -60); ctx.lineTo(-240, -60); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(0, -530); ctx.lineTo(0, -60); ctx.lineWidth = 6; ctx.strokeStyle = '#8a5a3c'; ctx.stroke();
    rrect(ctx, -186, -530, 372, 470, 8); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    // the sign on top
    rrect(ctx, -150, -630, 300, 62, 12); fs(ctx, '#ffd23f', 4.5);
    ctx.font = `34px ${RV.FONT.title}`; ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.sign || "BEN'S TEETH", 0, -596);
    ctx.restore();
  };

  // ---------------------------------------------------------------- sets
  // the living room on a lazy Sunday morning (x from -600 to 2500)
  RV.livingRoom = function (ctx, t, o = {}) {
    // wallpaper: pale yellow with a pattern of tiny teeth
    ctx.fillStyle = '#fbefc4'; ctx.fillRect(-2000, -900, 6000, FLOOR + 900);
    for (let yy = -40; yy < FLOOR; yy += 120) for (let xx = -1200; xx < 3200; xx += 140) {
      const off = ((yy / 120) % 2) * 70;
      ctx.save(); ctx.globalAlpha = 0.18; RV.tooth(ctx, xx + off, yy, 0.22, { lw: 0, color: '#d9a441', shade: '#d9a441' }); ctx.restore();
    }
    // window with morning sun
    const wx = 260, wy = 160;
    rrect(ctx, wx - 14, wy - 14, 388, 368, 10); fs(ctx, '#ffffff', 5);
    const sky = ctx.createLinearGradient(0, wy, 0, wy + 340);
    sky.addColorStop(0, '#9fdcff'); sky.addColorStop(1, '#fff1c9');
    ctx.fillStyle = sky; ctx.fillRect(wx, wy, 360, 340);
    RV.sun(ctx, wx + 270, wy + 90, 46, t);
    RV.cloud(ctx, wx + 90 + Math.sin(t * 0.3) * 20, wy + 120, 0.5, '#ffffff', 0.95);
    ctx.beginPath(); ctx.moveTo(wx + 180, wy); ctx.lineTo(wx + 180, wy + 340); ctx.moveTo(wx, wy + 170); ctx.lineTo(wx + 360, wy + 170);
    ctx.lineWidth = 12; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    rrect(ctx, wx, wy, 360, 340, 4); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke();
    // sunbeams across the room
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16 + 0.04 * Math.sin(t * 0.7);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 360, wy); ctx.lineTo(wx + 1200, FLOOR + 200); ctx.lineTo(wx + 420, FLOOR + 200); ctx.closePath(); ctx.fill();
    ctx.restore();
    // wall calendar: SUNDAY
    rrect(ctx, 760, 210, 170, 200, 8); fs(ctx, '#ffffff', 5);
    rrect(ctx, 760, 210, 170, 50, 8); fs(ctx, '#4cc9f0', 5);
    ctx.font = `32px ${RV.FONT.title}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SUNDAY', 845, 238);
    ctx.font = `86px ${RV.FONT.title}`; ctx.fillStyle = OUT; ctx.fillText('7', 845, 340);
    // a clock: 9:00 (it is a lazy morning)
    circle(ctx, 1080, 260, 62); fs(ctx, '#ffffff', 5);
    ctx.beginPath(); ctx.moveTo(1080, 260); ctx.lineTo(1080, 214); ctx.moveTo(1080, 260); ctx.lineTo(1044, 260);
    ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
    // skirting + floorboards + rug
    ctx.fillStyle = '#d8c3a5'; ctx.fillRect(-2000, FLOOR - 30, 6000, 30);
    ctx.fillStyle = '#b07a52'; ctx.fillRect(-2000, FLOOR, 6000, 900);
    ctx.strokeStyle = 'rgba(80,40,20,0.3)'; ctx.lineWidth = 3;
    for (let i = 0; i < 40; i++) { const x = -2000 + i * 160; ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x - (x - 960) * 0.6, FLOOR + 600); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-2000, FLOOR); ctx.lineTo(4000, FLOOR); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ellipse(ctx, 640, FLOOR + 70, 520, 60); fs(ctx, '#9b5de5', 5);
    ellipse(ctx, 640, FLOOR + 70, 430, 44); ctx.lineWidth = 6; ctx.strokeStyle = '#c8a2ff'; ctx.stroke();
    // floor lamp and a plant
    rrect(ctx, -110, 520, 12, 480, 6); fs(ctx, '#3a2a26', 4);
    ctx.beginPath(); ctx.moveTo(-170, 520); ctx.lineTo(-40, 520); ctx.lineTo(-70, 430); ctx.lineTo(-140, 430); ctx.closePath(); fs(ctx, '#ff9f1c', 5);
    rrect(ctx, 1460, 860, 120, 140, 14); fs(ctx, '#e76f51', 5);
    [[-40, -60, -0.5], [0, -90, 0], [40, -60, 0.5], [-20, -120, -0.2], [25, -125, 0.3]].forEach(([dx, dy, a]) => {
      ctx.save(); ctx.translate(1520 + dx, 860 + dy); ctx.rotate(a); ellipse(ctx, 0, 0, 22, 56); fs(ctx, '#55a630', 4); ctx.restore();
    });
  };
  // the sofa (back part and front part, so someone can sit between them)
  RV.sofa = function (ctx, x, y, w, part = 'all') {
    if (part !== 'front') {
      rrect(ctx, x - w / 2, y - 330, w, 230, 40); fs(ctx, '#f4a261', 5);
      for (let i = 0; i < 3; i++) { rrect(ctx, x - w / 2 + 30 + i * (w - 60) / 3, y - 310, (w - 60) / 3 - 16, 180, 30); fs(ctx, '#f6b57d', 4); }
    }
    if (part !== 'back') {
      rrect(ctx, x - w / 2 + 20, y - 150, w - 40, 90, 24); fs(ctx, '#f6b57d', 5);
      [-1, 1].forEach((sd) => { rrect(ctx, x + sd * (w / 2) - (sd > 0 ? 70 : 0), y - 230, 70, 200, 30); fs(ctx, '#e76f51', 5); });
      rrect(ctx, x - w / 2 + 10, y - 70, w - 20, 60, 16); fs(ctx, '#e76f51', 5);
      [-1, 1].forEach((sd) => { rrect(ctx, x + sd * (w / 2 - 50) - 12, y - 12, 24, 14, 4); fs(ctx, '#3a2a26', 3); });
    }
  };
  RV.SOFA_SEAT = -150; // seat surface above the floor

  // a tooth-shaped moon
  RV.toothMoon = function (ctx, x, y, r, t) {
    glow(ctx, x, y, r * 3.2, '#fff4c2', 0.35);
    RV.tooth(ctx, x, y, r / 62, { color: '#fff8d9', shade: '#f0d98c', face: { eyes: 'closed', mouth: 'smile' }, rot: Math.sin(t * 0.4) * 0.05 });
  };
  // the street at night: x from -400 to 4400 (Ben flies along it)
  RV.nightStreet = function (ctx, t, o = {}) {
    const g = ctx.createLinearGradient(0, -400, 0, FLOOR);
    g.addColorStop(0, '#120a3a'); g.addColorStop(1, '#3b2a6b');
    ctx.fillStyle = g; ctx.fillRect(-2000, -900, 8000, FLOOR + 900);
    RV.stars(ctx, t, { n: 260, x0: -1500, x1: 5500, y0: -600, y1: 650, seed: 4 });
    if (o.moon !== false) RV.toothMoon(ctx, o.moonX || 1400, o.moonY || 190, 110, t);
    const cols = ['#e76f51', '#2a9d8f', '#e9c46a', '#8ecae6', '#b388eb', '#f4a261', '#90be6d', '#f28482'];
    for (let i = 0; i < 16; i++) {
      const hx = -400 + i * 330, hh = 230 + hash(i * 3.3) * 120;
      RV.house(ctx, hx, FLOOR - 40, 240, hh, { color: cols[i % cols.length], night: true, lit: [hash(i) > 0.4 ? 1 : 0, hash(i * 2) > 0.6 ? 1 : 0, hash(i * 5) > 0.7 ? 1 : 0] });
    }
    ctx.fillStyle = '#2c2445'; ctx.fillRect(-2000, FLOOR - 40, 8000, 900);
    ctx.fillStyle = '#4a3f6b'; ctx.fillRect(-2000, FLOOR - 40, 8000, 26);
    ctx.beginPath(); ctx.moveTo(-2000, FLOOR - 40); ctx.lineTo(6000, FLOOR - 40); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  };

  // a child's bedroom at night, with someone asleep in bed (o.sleeper = kid id, o.tooth = tooth under
  // the pillow 0..1, o.coin = coin there 0..1, o.between(ctx) = whoever stands behind the bed)
  RV.bedroom = function (ctx, t, o = {}) {
    ctx.fillStyle = '#2b2f6b'; ctx.fillRect(-2000, -900, 6000, FLOOR + 900);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = -2000; x < 4000; x += 120) ctx.fillRect(x, -900, 50, FLOOR + 900);
    // window with the tooth moon
    const wx = 1180, wy = 180;
    rrect(ctx, wx - 14, wy - 14, 368, 348, 10); fs(ctx, '#dcd6f7', 5);
    ctx.save(); rrect(ctx, wx, wy, 340, 320, 4); ctx.clip();
    ctx.fillStyle = '#120a3a'; ctx.fillRect(wx, wy, 340, 320);
    RV.stars(ctx, t, { n: 40, x0: wx, x1: wx + 340, y0: wy, y1: wy + 320, seed: 9 });
    RV.toothMoon(ctx, wx + 230, wy + 110, 60, t);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(wx + 170, wy); ctx.lineTo(wx + 170, wy + 320); ctx.moveTo(wx, wy + 160); ctx.lineTo(wx + 340, wy + 160);
    ctx.lineWidth = 10; ctx.strokeStyle = '#dcd6f7'; ctx.stroke();
    // moonlight on the floor
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.14; ctx.fillStyle = '#c9d6ff';
    ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 340, wy); ctx.lineTo(wx + 120, FLOOR + 160); ctx.lineTo(wx - 420, FLOOR + 160); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#3a2f5a'; ctx.fillRect(-2000, FLOOR, 6000, 900);
    ctx.beginPath(); ctx.moveTo(-2000, FLOOR); ctx.lineTo(4000, FLOOR); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    // anyone standing behind the bed (o.between draws them)
    if (o.between) o.between(ctx);
    // the bed (x 260..1060), headboard on the left
    const bx = 260, bw = 800, top = 720;
    rrect(ctx, bx - 40, top - 230, 60, 330, 14); fs(ctx, '#8a5a3c', 5);
    rrect(ctx, bx, top, bw, 120, 18); fs(ctx, '#8a5a3c', 5);
    [bx + 10, bx + bw - 40].forEach((lx) => { rrect(ctx, lx, top + 110, 30, FLOOR - top - 110, 6); fs(ctx, '#6d4530', 4); });
    // pillow, sleeper's head, blanket
    ellipse(ctx, bx + 120, top - 26, 110, 52); fs(ctx, '#ffffff', 5);
    if (o.sleeper) {
      RV.drawKidHead(ctx, o.sleeper, { x: bx + 118, y: top - 66, s: 0.82, t, eyes: 'closed', mouth: o.mouth || 'smile', open: 0, headTilt: -0.35, neck: false });
    }
    ctx.beginPath(); ctx.moveTo(bx + 150, top - 30); ctx.quadraticCurveTo(bx + 500, top - 90 + Math.sin(t * 1.4) * 6, bx + bw + 20, top - 10);
    ctx.lineTo(bx + bw + 20, top + 90); ctx.lineTo(bx + 150, top + 90); ctx.closePath();
    fs(ctx, o.quilt || '#4cc9f0', 5);
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let x = bx + 150; x < bx + bw + 40; x += 80) ctx.fillRect(x, top - 120, 40, 260);
    ctx.restore();
    // the tooth (or the coin left for it) peeking out from under the pillow's edge
    if (o.tooth > 0) RV.tooth(ctx, bx + 190, top - 22, 0.2 * clamp(o.tooth), { lw: 3, rot: 0.3 });
    if (o.coin > 0) RV.coin(ctx, bx + 192, top - 18, 20 * clamp(o.coin), t);
    // "Z"s when asleep
    if (o.sleeper && o.zzz !== false) for (let i = 0; i < 3; i++) {
      const ph = RV.fract(t * 0.4 + i / 3);
      ctx.save(); ctx.globalAlpha = Math.sin(ph * Math.PI);
      RV.bigText(ctx, 'z', bx + 160 + ph * 90, top - 150 - ph * 130, 34 + ph * 24, { fill: '#ffffff', shadow: false });
      ctx.restore();
    }
  };

  // the shrine: a dark purple room, a mosaic of teeth on the back wall
  RV.shrine = function (ctx, t, o = {}) {
    ctx.fillStyle = '#1d0f2e'; ctx.fillRect(-2000, -900, 6000, FLOOR + 900);
    // the mosaic: a giant grin made of rows of teeth
    const cx = 960, cy = 380;
    ctx.save(); ctx.translate(cx, cy);
    ellipse(ctx, 0, 0, 720, 300); fs(ctx, '#7b1e3a', 6);
    ellipse(ctx, 0, 30, 640, 220); fs(ctx, '#3a0b1d', 0);
    // the giant mouth breathes slowly (o.gap opens or shuts it)
    const gap = (o.gap || 0) + Math.sin(t * 1.1) * 8;
    for (let row = 0; row < 2; row++) {
      const n = 13;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n - 0.5;
        const x = u * 1180, y = (row ? 110 + gap : -110 - gap) + (row ? -1 : 1) * Math.abs(u) * 120;
        const glint = Math.max(0, Math.sin(t * 1.3 - i * 0.5 + row));
        RV.tooth(ctx, x, y, 0.62, { rot: row ? Math.PI : 0, lw: 4, color: glint > 0.95 ? '#ffffff' : IVORY });
      }
    }
    ctx.restore();
    // candles
    [[300, 900], [560, 940], [1360, 940], [1620, 900]].forEach(([x, y], i) => {
      rrect(ctx, x - 18, y - 90, 36, 90, 6); fs(ctx, '#fff3d6', 4);
      const f = 1 + 0.15 * Math.sin(t * 12 + i * 2);
      ctx.save(); ctx.translate(x, y - 96); ctx.scale(1, f);
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(14, -6, 0, 6); ctx.quadraticCurveTo(-14, -6, 0, -30); fs(ctx, '#ffd23f', 3);
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y - 110, 160, '#ffb347', 0.35); ctx.restore();
    });
    ctx.fillStyle = '#2a1640'; ctx.fillRect(-2000, FLOOR, 6000, 900);
    ctx.beginPath(); ctx.moveTo(-2000, FLOOR); ctx.lineTo(4000, FLOOR); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  };
  // a throne made of teeth (drawn behind whoever sits on it)
  RV.toothThrone = function (ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rrect(ctx, -190, -520, 380, 520, 40); fs(ctx, '#c1121f', 6);
    rrect(ctx, -150, -480, 300, 330, 30); fs(ctx, '#9d0b28', 4);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      RV.tooth(ctx, Math.cos(a) * 200, -500 + Math.sin(a) * 90 + 60, 0.55, { rot: a + Math.PI / 2, lw: 4 });
    }
    rrect(ctx, -220, -170, 440, 80, 20); fs(ctx, '#e63946', 5);
    [-1, 1].forEach((sd) => RV.tooth(ctx, sd * 200, -60, 0.8, { lw: 4.5 }));
    ctx.restore();
  };
})(globalThis.RV);
