/* Director: scene API, timing helpers, lyric typography, shot timeline and the "rewind" time-warp. */
(function () {
  'use strict';
  const V = window.V, M = V.M, E = V.E, R = V.R, Rn = V.Rn, St = V.St, Tx = V.Tx, Bg = V.Bg, Mat = V.Mat, T = V.T;
  const D = (V.Dir = { gentle: false, current: '' });

  // ------------------------------------------------------------ scene API handed to shots
  const pool = [];
  let pi = 0;
  const S = (D.S = {
    batch() { if (!pool[pi]) pool[pi] = new St.Batch(); return pool[pi++].reset(); },
    bg(name, u) { S._L.scene.push(() => Bg.draw(name, u)); },
    scene(fn) { S._L.scene.push(fn); },
    ink(b, cam, o = {}) { S._L.ink.push(() => St.draw(b, cam, Object.assign({ style: 'ink', minPx: 1.0 }, o))); },
    neon(b, cam, o = {}) { S._L.neon.push(() => St.draw(b, cam, o)); },
    solid(b, cam, o = {}) { S._L.over.push(() => St.draw(b, cam, Object.assign({ style: 'solid', blend: 'premul' }, o))); },
    neonOver(b, cam, o = {}) { S._L.over.push(() => St.draw(b, cam, Object.assign({ blend: 'add' }, o))); },
    over(fn) { S._L.over.push(fn); },
    top(fn) { S._L.top.push(fn); },
    text(L, o) { S._L.over.push(() => Tx.draw(L, o)); },
    textTop(L, o) { S._L.top.push(() => Tx.draw(L, o)); },
    // drawn on the final image after post-processing (crisp on-screen display)
    osd(fn) { D.screen.push(fn); },
    parts(cam, o) { S._L.over.push(() => V.Pt.draw(cam, o)); },
    box(cam, o) { S._L.scene.push(() => V.Ms.box(cam, o)); },
    card(cam, o, layer = 'over') { S._L[layer].push(() => V.Fx.card(cam, o)); },
    get post() { return Rn.post; },
    // render another draw function into an offscreen target now; returns the target (texture)
    capture(fn, t, which = 'capA') {
      const saved = JSON.stringify(Rn.post), savedTime = Rn.time;
      Rn.time = t;
      Rn.pass(fn, t, Rn.T[which], S);
      Object.assign(Rn.post, JSON.parse(saved));
      Rn.time = savedTime;
      return Rn.T[which];
    },
  });

  // ------------------------------------------------------------ timing helpers
  const H = (D.H = {});
  H.seg = (t, a, b) => M.clamp((t - a) / (b - a));
  H.ramp = (t, a, b, f = E.inOutCubic) => f(M.clamp((t - a) / (b - a)));
  H.pulse = (t, t0, tau = 0.15) => (t >= t0 ? Math.exp(-(t - t0) / tau) : 0);
  H.env = (t, a, b, fi = 0.2, fo = 0.3) => M.clamp((t - a) / fi) * M.clamp((b - t) / fo);
  H.win = (t, a, b) => t >= a && t < b;
  H.w = (lineText, word, occLine = 0, occWord = 0) => T.wordTime(lineText, word, occLine, occWord);
  H.line = (i) => T.lines[i];
  // smoothed kick punch for camera/scale
  H.kick = (t, tau = 0.12) => T.kickPulse(t, tau);
  H.snare = (t, tau = 0.12) => T.snarePulse(t, tau);
  H.beat = (t, tau = 0.15) => T.beatPulse(t, tau);
  H.bar = (t, tau = 0.3) => T.barPulse(t, tau);
  H.cam = (o) => St.camera(o);
  H.flat = () => St.flatCam();
  H.orbit = (t, o = {}) => {
    // gently drifting camera around the design plane
    const a = o.amp == null ? 1 : o.amp, sp = o.speed || 1;
    const x = Math.sin(t * 0.23 * sp) * 0.45 * a + (o.x || 0), y = Math.sin(t * 0.17 * sp + 1.3) * 0.18 * a + (o.y || 0);
    const z = (o.z || 3) - (o.push || 0);
    return St.camera({ eye: [x, y, z], at: [x * 0.35 + (o.atx || 0), y * 0.3 + (o.aty || 0), 0], roll: (o.roll || 0) + Math.sin(t * 0.13 * sp) * 0.03 * a, fov: o.fov });
  };
  H.shake = (amt, t, freq = 40) => [R.noise1(t * freq) * amt * 0.01, R.noise1(t * freq + 71.3) * amt * 0.01];

  // ------------------------------------------------------------ lyric typography
  // Display text (original punctuation) for each timed line, in TRACK order.
  const DISPLAY = [
    'BMX bikes in a front-yard pile,', 'Sun-bleached hair and a gap-toothed smile.', 'Pac-Man glowing in the corner store,',
    'Twenty cents down—we’re back for more.', 'Black cassette with a handwritten name,', 'Finger on RECORD when the good song came.',
    'Posters peeling off the bedroom wall,', 'Stretching that phone cord down the hall.',
    'Streetlights flickered, but we rode on past—', 'Everybody wishing that the night would last.',
    'Turn the eighties up! Oh-oh-oh!', 'Big hair, bright lights, let the good times roll!', 'We were neon in a black-and-white town,',
    'Too much colour to ever tone it down.', 'Hey! Hey! We couldn’t get enough—', 'Rewind my life and turn the eighties up!',
    'Oh-oh-oh, oh-oh-oh!', 'Turn the eighties up!',
    'DeLorean tyres leaving fire in the street,', 'Kids trying moonwalks, staring at their feet.', 'Madonna lace and a purple guitar,',
    'A mirror and a hairbrush made a superstar.', 'Fluoro leg warmers, a stonewashed vest,', 'Whoever had the biggest fringe was looking their best.',
    'Polaroid faces slowly coming clear—', 'We looked ridiculous. We should’ve kept the gear.',
    'Rubik’s Cube cheated with a sticker or two,', 'Nobody cool had a single clue!',
    'Turn the eighties up! Oh-oh-oh!', 'Big hair, bright lights, let the good times roll!', 'We were neon in a black-and-white town,',
    'Too much colour to ever tone it down.', 'Hey! Hey! We couldn’t get enough—', 'Rewind my life and turn the eighties up!',
    'Be kind, rewind—the weekend’s here,', 'Three rented movies and a beanbag chair.', 'Tracking lines rolling through the opening scene,',
    'We saw whole worlds on a fourteen-inch screen.', 'Now the jackets don’t fit and the photographs fade,', 'But I still know every song on that mixtape.',
    'Give me four drumbeats and a cheap guitar—', 'I’m back on that street, wherever you are.',
    'Who had the hair? We had the hair!', 'Who had the moves? We weren’t quite there!', 'Who wants another? We all do!',
    'Somebody pass me a pencil—this tape’s come loose!',
    'Turn the eighties up! Oh-oh-oh!', 'Big hair, bright lights, let the good times roll!', 'We were neon in a black-and-white town,',
    'Too much colour to ever tone it down.', 'Hey! Hey! We couldn’t get enough—', 'Rewind my life and turn the eighties up!',
    'Oh-oh-oh, oh-oh-oh! Never loud enough!', 'One more time—turn the eighties up!',
  ];
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Per line: tokens of the display text with start/end times matched to the timed words.
  function buildTokens(i) {
    const L = T.lines[i], disp = DISPLAY[i] || L.text;
    const toks = [];
    const re = /[^\s—]+[—]?|—/g;
    let m;
    while ((m = re.exec(disp))) toks.push({ s: m.index, e: m.index + m[0].length, txt: m[0] });
    let wi = 0;
    for (const tk of toks) {
      const target = norm(tk.txt);
      let acc = '', t0 = null, t1 = null;
      while (wi < L.w.length && acc.length < target.length) {
        const w = L.w[wi];
        if (t0 == null) t0 = w[1];
        acc += norm(w[0]); t1 = w[2]; wi++;
        if (acc === target) break;
      }
      tk.t0 = t0 == null ? (toks.length ? L.e : L.s) : t0;
      tk.t1 = t1 == null ? tk.t0 + 0.2 : t1;
    }
    // fill any token without timing from its neighbour
    for (let k = 0; k < toks.length; k++) if (toks[k].t0 == null) toks[k].t0 = k ? toks[k - 1].t1 : L.s;
    return { disp, toks, L };
  }
  const TOK = T.lines.map((_, i) => buildTokens(i));
  D.TOK = TOK;
  D.display = (i) => TOK[i].disp;
  D.lineIndexAt = (t, lead = 0.2) => {
    for (let i = T.lines.length - 1; i >= 0; i--) if (t >= T.lines[i].s - lead) return i;
    return -1;
  };

  // layout cache: split into two rows if too wide
  const LC = new Map();
  D.lyricLayout = function (i, font, size, maxW, o = {}) {
    const rg = o.range || null;
    const key = i + '|' + font + '|' + size + '|' + maxW + '|' + (o.upper ? 1 : 0) + (o.tracking || 0) + '|' + (rg ? rg.join(',') : '') + '|' + (o.lineHeight || 1);
    if (LC.has(key)) return LC.get(key);
    const info = TOK[i];
    const k0 = rg ? rg[0] : 0, k1 = rg ? Math.min(rg[1], info.toks.length - 1) : info.toks.length - 1;
    const off = info.toks[k0].s;
    let str = info.disp.slice(off, info.toks[k1].e);
    if (o.upper) str = str.toUpperCase();
    let L = Tx.layout(font, str, { size, tracking: o.tracking, lineHeight: o.lineHeight || 1.0 });
    let split = -1;
    if (L.width > maxW) {
      const mid = str.length / 2;
      let best = -1;
      for (let k = 0; k < str.length; k++) if (str[k] === ' ' && (best < 0 || Math.abs(k - mid) < Math.abs(best - mid))) best = k;
      if (best > 0) { split = best; str = str.slice(0, best) + '\n' + str.slice(best + 1); L = Tx.layout(font, str, { size, tracking: o.tracking, lineHeight: o.lineHeight || 1.0 }); }
    }
    let fit = 1;
    if (L.width > maxW) fit = maxW / L.width;
    const flat = str.replace(/\n/g, '');
    const charTok = new Int16Array(flat.length).fill(-1);
    for (let k = 0; k < flat.length; k++) {
      const orig = (split >= 0 && k >= split ? k + 1 : k) + off;
      for (let q = k0; q <= k1; q++) if (orig >= info.toks[q].s && orig < info.toks[q].e + 1) { charTok[k] = q; break; }
      if (charTok[k] < 0) charTok[k] = k ? charTok[k - 1] : k0;
    }
    const first = new Int16Array(info.toks.length).fill(-1);
    for (let k = 0; k < charTok.length; k++) if (first[charTok[k]] < 0) first[charTok[k]] = k;
    const res = { L, fit, charTok, info, first };
    LC.set(key, res);
    return res;
  };

  // Draw lyric line i with word-synced reveal.
  // o: font,size,maxW,x,y,style,col,col2,glowCol,glow,outline,thick,anim('pop'|'drop'|'type'|'rise'|'slam'),hold,lead,cam,model,upper,layer,exitDur,wave
  D.lyric = function (S, i, t, o = {}) {
    if (i < 0 || i >= T.lines.length) return;
    const info = TOK[i], Lx = info.L;
    const lead = o.lead == null ? 0.06 : o.lead;
    const hold = o.hold == null ? 0.5 : o.hold;
    let tEnd = o.until != null ? o.until : Lx.e + hold;
    const exitDur0 = o.exitDur == null ? 0.35 : o.exitDur;
    if (o.until == null && !o.range && i + 1 < T.lines.length) tEnd = Math.min(tEnd, T.lines[i + 1].s - lead - exitDur0 - 0.15);
    const tBeg = o.range ? info.toks[o.range[0]].t0 : Lx.s;
    if (t < tBeg - lead - 0.3 || t > tEnd + 0.6) return;
    const r = D.lyricLayout(i, o.font || 'hand', o.size || 0.12, o.maxW || 3.0, o);
    const anim = o.anim || 'pop';
    const exitDur = o.exitDur == null ? 0.35 : o.exitDur;
    const model = Mat.mul(Mat.translate(o.x || 0, o.y || 0, o.z || 0), Mat.mul(o.model || Mat.ident(), Mat.scale(r.fit, r.fit, 1)));
    const fn = (g, idx) => {
      const ti = r.charTok[idx], tk = info.toks[ti];
      if (!tk) return null;
      const within = idx - r.first[ti];
      const ts = tk.t0 - lead + within * (o.charStagger == null ? 0.018 : o.charStagger);
      const a = t - ts;
      if (a < 0) return o.ghost ? { a: o.ghost } : null;
      const ex = t - (tEnd + Math.min(idx * 0.012, 0.15));
      let alpha = M.clamp(a / 0.08);
      let x = 0, y = 0, s = 1, rot = 0;
      if (anim === 'pop') { const k = E.outBack(M.clamp(a / 0.22), 2.2); s = 0.4 + 0.6 * k; y = (1 - k) * -0.04; }
      else if (anim === 'drop') { const k = E.outBounce(M.clamp(a / 0.45)); y = (1 - k) * 0.35; }
      else if (anim === 'rise') { const k = E.outCubic(M.clamp(a / 0.35)); y = (1 - k) * -0.12; alpha *= k; }
      else if (anim === 'type') { alpha = a > 0 ? 1 : 0; }
      else if (anim === 'slam') { const k = E.outExpo(M.clamp(a / 0.18)); s = 2.6 - 1.6 * k; alpha = M.clamp(a / 0.05); }
      else if (anim === 'roll') { const k = E.outBack(M.clamp(a / 0.4)); rot = (1 - k) * -1.2; y = (1 - k) * 0.2; }
      if (o.wave) y += Math.sin(t * 6 + idx * 0.5) * o.wave * M.clamp(a / 0.3);
      if (o.jitter) { x += (R.hash(idx + Math.floor(t * 12)) - 0.5) * o.jitter; y += (R.hash(idx * 3.3 + Math.floor(t * 12)) - 0.5) * o.jitter; }
      if (ex > 0) { const k = M.clamp(ex / exitDur); alpha *= 1 - k; y += k * (o.exitY == null ? 0.08 : o.exitY); s *= 1 - k * 0.2; }
      if (alpha <= 0.002) return null;
      const res = { x, y, s, rot, a: alpha };
      if (o.glyph) Object.assign(res, o.glyph(g, idx, a, res));
      return res;
    };
    const drawOpts = {
      cam: o.cam || St.flatCam(), model, style: o.style || 'fill', col: o.col || [1, 1, 1], col2: o.col2 || [0.02, 0, 0.06],
      glowCol: o.glowCol || [1, 0.2, 0.6], glow: o.glow == null ? 0 : o.glow, outline: o.outline == null ? 0 : o.outline,
      thick: o.thick, intensity: o.intensity, anim: fn, soft: o.soft, rainbow: o.rainbow,
    };
    const put = (opts) => {
      if (o.layer === 'osd') S.osd(() => Tx.draw(r.L, opts));
      else (o.layer === 'top' ? S.textTop : S.text)(r.L, opts);
    };
    if (o.shadow) put(Object.assign({}, drawOpts, { style: 'fill', col: o.shadow, col2: o.shadow, glow: 0, outline: o.outline || 0, model: Mat.mul(Mat.translate(o.shadowOff || 0.012, -(o.shadowOff || 0.012), 0), model) }));
    put(drawOpts);
  };

  // simple one-off text (cached layout)
  const TC = new Map();
  D.txt = function (font, str, size, o = {}) {
    const key = font + '|' + str + '|' + size + '|' + (o.tracking || 0) + '|' + (o.align || '');
    if (!TC.has(key)) TC.set(key, Tx.layout(font, str, { size, tracking: o.tracking, align: o.align, lineHeight: o.lineHeight }));
    return TC.get(key);
  };
  D.outline = function (font, str, size, o = {}) {
    const key = 'o|' + font + '|' + str + '|' + size + '|' + JSON.stringify(o.col || '');
    if (!TC.has(key)) TC.set(key, Tx.outlineShape(font, str, { size, col: o.col, w: o.w, tracking: o.tracking, lineHeight: o.lineHeight }));
    return TC.get(key);
  };

  // ------------------------------------------------------------ timeline
  D.shots = [];
  D.rewinds = []; // {a, b, map(u)->t'}

  D.init = function () {
    V.Shots.init(D);
    D.shots = V.Shots.list;
    D.rewinds = V.Shots.rewinds || [];
  };

  D.shotAt = function (t) {
    for (const s of D.shots) if (t >= s.t0 && t < s.t1) return s;
    return D.shots[D.shots.length - 1];
  };

  D.drawAt = function (S, t) {
    const s = D.shotAt(t);
    D.current = s.id;
    s.draw(S, t, t - s.t0);
  };

  D.screen = [];
  D.flushScreen = function () {
    for (const f of D.screen) f();
    D.screen = [];
    V.G.blend(null);
  };
  D.frame = function (t) {
    pi = 0;
    D.screen = [];
    let tr = t, rw = null;
    for (const r of D.rewinds) if (t >= r.a && t < r.b) { rw = r; tr = r.map(t - r.a); break; }
    Rn.time = tr;
    Rn.pass((S2) => {
      D.drawAt(S2, tr);
      if (rw) rw.overlay(S2, t, t - rw.a);
    }, tr, Rn.T.comp, S);
    Rn.time = t;
    if (D.gentle) {
      const P = Rn.post;
      P.flash[3] *= 0.35;
      P.shake = [P.shake[0] * 0.3, P.shake[1] * 0.3];
      P.zoom = 1 + (P.zoom - 1) * 0.4;
      P.glitch *= 0.3;
    }
  };
})();
