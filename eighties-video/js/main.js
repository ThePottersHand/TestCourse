/* Main: boot (fonts, GL, atlases), playback UI, adaptive resolution, and the deterministic frame API used for encoding. */
(function () {
  'use strict';
  const V = window.V, G = V.G, M = V.M, Rn = V.Rn, T = V.T, P = V.Player;
  const OPTS = Object.assign({ render: false, w: 1920, h: 1080 }, window.__MV_OPTS || {});
  const $ = (id) => document.getElementById(id);
  const canvas = $('gl');

  const FONTS = {
    chrome: 'Russo One', neon: 'Monoton', script: 'Mr Dafoe', pixel: 'Press Start 2P',
    vhs: 'VT323', marker: 'Permanent Marker', comic: 'Bangers', hand: 'Architects Daughter',
  };

  function status(msg) { const s = $('status'); if (s) s.textContent = msg; }
  function fail(e) {
    console.error(e);
    const el = $('err');
    el.hidden = false;
    el.textContent = 'Could not start the video: ' + (e && e.message ? e.message : e);
    status('');
  }

  async function loadFonts() {
    const list = [];
    for (const fam in window.FONT_DATA) {
      const b = atob(window.FONT_DATA[fam]);
      const u = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
      const ff = new FontFace(fam, u.buffer);
      document.fonts.add(ff);
      list.push(ff.load());
    }
    await Promise.all(list);
  }

  // ------------------------------------------------------------ sizing
  let scale = 1;
  function targetSize() {
    if (OPTS.render) return [OPTS.w, OPTS.h];
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = Math.round(r.width * dpr * scale), h = Math.round(w * 9 / 16);
    if (w > 1920) { w = 1920; h = 1080; }
    w = Math.max(320, w & ~1); h = Math.max(180, h & ~1);
    return [w, h];
  }
  function applySize(force) {
    const [w, h] = targetSize();
    if (!force && canvas.width === w && canvas.height === h) return;
    canvas.width = w; canvas.height = h;
    Rn.resize(w, h);
  }

  // ------------------------------------------------------------ frame
  let lastT = -1;
  function renderAt(t) {
    Rn.beginFrame(t);
    V.Dir.frame(t);
    Rn.post_(t, null);
    V.Dir.flushScreen();
    lastT = t;
  }

  // ------------------------------------------------------------ boot
  async function boot() {
    try {
      status('Loading fonts…');
      await loadFonts();
      G.init(canvas, { preserve: OPTS.render });
      const [w, h] = targetSize();
      canvas.width = w; canvas.height = h;
      Rn.init(w, h);
      V.St.init(); V.Tx.init(); V.Bg.init(); V.Pt.init(); V.Ms.init(); V.Fx.init();
      status('Cutting neon…');
      await new Promise((r) => setTimeout(r, 0));
      for (const k in FONTS) V.Tx.buildFont(k, FONTS[k]);
      V.Dir.init();
      V.Dir.captions = OPTS.captions === true || /(?:^#|[-_.])cc(?:$|[-_.])/.test(location.hash || '');
      window.__MV = {
        ready: true,
        renderAt(t) { renderAt(t); return true; },
        // pre-roll a few frames so feedback trails settle before capturing t
        seek(t, fps = 30, pre = 0.6) { for (let x = Math.max(0, t - pre); x < t; x += 1 / fps) renderAt(x); renderAt(t); return true; },
        duration: T.duration,
      };
      if (OPTS.render) { $('start').remove(); $('bar').remove(); return; }
      status('Loading song…');
      renderAt(12.1);
      await P.load('audio/turn-the-eighties-up.mp3');
      status('');
      $('play').disabled = false;
      $('play').focus();
      setupUI();
      requestAnimationFrame(loop);
    } catch (e) { fail(e); }
  }

  // ------------------------------------------------------------ UI + loop
  let started = false, uiTimer = 0, dragging = false, frameTimes = [], lastFrame = 0, lowFor = 0, highFor = 0;
  function fmt(t) { t = Math.max(0, t); const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }
  function showUI() {
    $('bar').classList.remove('hidden');
    document.body.style.cursor = '';
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => { if (P.playing && !dragging) { $('bar').classList.add('hidden'); document.body.style.cursor = 'none'; } }, 2200);
  }
  function setupUI() {
    const track = $('track');
    for (const s of T.sections) {
      if (s.s <= 0) continue;
      const d = document.createElement('div');
      d.className = 'tick';
      d.style.left = (s.s / T.duration) * 100 + '%';
      const lab = { verse1: 'verse', pre1: 'pre', chorus1: 'chorus', post1: '', verse2: 'verse', pre2: 'pre', chorus2: 'chorus', bridge: 'bridge', breakdown: 'claps', final: 'chorus', outro: 'outro' }[s.name];
      if (lab) { const sp = document.createElement('span'); sp.textContent = lab; d.appendChild(sp); }
      track.appendChild(d);
    }
    const start = async () => {
      if (!started) { started = true; $('start').classList.add('hidden'); setTimeout(() => $('start').remove(), 600); P.seek(startAt()); }
      await P.play();
      $('pp').textContent = '❚❚';
      showUI();
    };
    const toggle = async () => {
      if (!started || !P.playing) await start();
      else { P.pause(); $('pp').textContent = '▶'; showUI(); }
    };
    $('play').addEventListener('click', start);
    $('pp').addEventListener('click', toggle);
    const setCC = (on) => { V.Dir.captions = on; $('cc').setAttribute('aria-pressed', on ? 'true' : 'false'); lastT = -1; };
    setCC(V.Dir.captions);
    $('cc').addEventListener('click', () => { setCC(!V.Dir.captions); showUI(); });
    $('fs').addEventListener('click', () => {
      const el = document.documentElement;
      if (!document.fullscreenElement) (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => {});
      else document.exitFullscreen().catch(() => {});
    });
    const seekFromX = (x) => {
      const r = track.getBoundingClientRect();
      const t = M.clamp((x - r.left) / r.width) * T.duration;
      P.seek(t);
      if (!started) { started = true; $('start').remove(); }
    };
    track.addEventListener('pointerdown', (e) => { dragging = true; track.setPointerCapture(e.pointerId); seekFromX(e.clientX); });
    track.addEventListener('pointermove', (e) => { if (dragging) seekFromX(e.clientX); });
    track.addEventListener('pointerup', () => { dragging = false; });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { P.seek(P.time() - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { P.seek(P.time() + 5); e.preventDefault(); }
    });
    window.addEventListener('mousemove', showUI);
    window.addEventListener('touchstart', showUI, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.id === 'track' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowLeft') { P.seek(P.time() - 5); showUI(); }
      else if (e.key === 'ArrowRight') { P.seek(P.time() + 5); showUI(); }
      else if (e.key === 'f' || e.key === 'F') $('fs').click();
      else if (e.key === 'h' || e.key === 'H') { $('bar').classList.toggle('hidden'); }
      else if (e.key === 'd' || e.key === 'D') { $('debug').hidden = !$('debug').hidden; }
      else if (e.key === 'c' || e.key === 'C') { $('cc').click(); }
    });
    P.onEnd = () => { $('pp').textContent = '▶'; showUI(); };
    window.addEventListener('resize', () => applySize());
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) V.Dir.gentle = true; } catch (e) { /* ignore */ }
  }
  function startAt() {
    const m = /(?:^#|[?&])t=?(\d+(?:\.\d+)?)/.exec(location.hash || '') || /[?&]t=(\d+(?:\.\d+)?)/.exec(location.search || '');
    return m ? parseFloat(m[1]) : 0;
  }

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = lastFrame ? now - lastFrame : 16;
    lastFrame = now;
    let t;
    if (!started) t = 8.7 + ((now / 1000) % 7); // attract loop behind the start screen
    else t = P.time();
    if (started && !P.playing && Math.abs(t - lastT) < 1e-4) return;
    renderAt(t);
    // UI
    if (started) {
      $('time').textContent = fmt(t) + ' / ' + fmt(T.duration);
      $('track').querySelector('.fill').style.width = (t / T.duration) * 100 + '%';
      $('track').setAttribute('aria-valuenow', Math.round(t));
      $('sec').textContent = T.section(t).name.replace(/\d/, '');
    }
    const dbg = $('debug');
    if (!dbg.hidden) dbg.textContent = `t ${t.toFixed(2)}  ${T.section(t).name}  ${canvas.width}x${canvas.height}  ${(1000 / Math.max(1, dt)).toFixed(0)} fps  shot ${V.Dir.current || ''}`;
    // adaptive resolution
    if (P.playing) {
      frameTimes.push(dt);
      if (frameTimes.length > 30) frameTimes.shift();
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      if (avg > 24) lowFor += dt; else lowFor = 0;
      if (avg < 17.5) highFor += dt; else highFor = 0;
      if (lowFor > 1500 && scale > 0.5) { scale = Math.max(0.5, scale * 0.85); lowFor = 0; frameTimes = []; applySize(); }
      if (highFor > 6000 && scale < 1) { scale = Math.min(1, scale * 1.1); highFor = 0; frameTimes = []; applySize(); }
    }
  }

  boot();
})();
