/* Player: keeps the canvas in sync with the song and wires up the controls.
   Add ?render to the URL for frame-by-frame export (see tools/render-video.mjs). */
'use strict';
(function () {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const audio = document.getElementById('song');
  const RENDER = /[?&]render\b/.test(location.search);
  const $ = (id) => document.getElementById(id);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const POSTER_T = 3.4;

  try { REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
  let captions = true;
  try { captions = localStorage.getItem('wdwc-captions') !== '0'; } catch (e) { /* storage unavailable */ }

  let scale = 1, quality = 1;
  function resize() {
    if (RENDER) { canvas.width = W; canvas.height = H; scale = 1; return; }
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, Math.min(W, Math.round(r.width * dpr * quality)));
    if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round((w * H) / W); }
    scale = canvas.width / W;
  }
  function draw(t) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    renderFrame(ctx, t, { captions });
  }

  const fontsReady = Promise.race([
    Promise.all([
      document.fonts.load('400 64px "Mochiy Pop One"'),
      document.fonts.load('600 64px "Fredoka"'),
      document.fonts.load('500 64px "Fredoka"'),
    ]),
    new Promise((r) => setTimeout(r, 3000)),
  ]).catch(() => {});

  /* ---------- render mode: frames on demand ---------- */
  if (RENDER) {
    document.documentElement.classList.add('render');
    resize();
    window.__ready = fontsReady.then(() => true);
    window.__frame = (t, type = 'image/jpeg', q = 0.93) => { draw(t); return canvas.toDataURL(type, q); };
    window.__draw = (t) => draw(t);
    return;
  }

  /* ---------- playback clock ---------- */
  let started = false, shown = 0, lastAudio = -1, lastPerf = 0;
  let silent = false, silentBase = 0, silentStart = 0, silentPlaying = false;
  function isPlaying() { return silent ? silentPlaying : !audio.paused && !audio.ended; }
  function clock() {
    if (silent) return silentPlaying ? Math.min(SONG_LENGTH, silentBase + (performance.now() - silentStart) / 1000) : silentBase;
    const at = audio.currentTime, p = performance.now();
    if (audio.paused) { lastAudio = at; lastPerf = p; return at; }
    if (at !== lastAudio) { lastAudio = at; lastPerf = p; }
    return lastAudio + Math.min(0.2, (p - lastPerf) / 1000);
  }
  function seek(t) {
    t = clamp(t, 0, SONG_LENGTH - 0.05);
    if (silent) { silentBase = t; silentStart = performance.now(); } else audio.currentTime = t;
    shown = t; lastAudio = -1;
    started = true;
    hideBig();
    paint(t);
  }
  function play() {
    started = true;
    hideBig();
    if (silent) { silentStart = performance.now(); silentPlaying = true; syncUi(); return; }
    const p = audio.play();
    if (p && p.catch) p.catch(() => { showBig('Tap to play with sound'); });
  }
  function pause() {
    if (silent) { silentBase = clock(); silentPlaying = false; syncUi(); return; }
    audio.pause();
  }
  function toggle() { isPlaying() ? pause() : play(); }

  /* ---------- UI ---------- */
  const big = $('bigPlay'), playBtn = $('playBtn'), scrub = $('scrub'), time = $('time'), ccBtn = $('ccBtn'), fsBtn = $('fsBtn'), note = $('note');
  scrub.max = String(SONG_LENGTH);
  function showBig(label) { big.hidden = false; big.querySelector('span').textContent = label; }
  function hideBig() { big.hidden = true; }
  function syncUi() {
    const playing = isPlaying();
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playBtn.classList.toggle('is-playing', playing);
  }
  function setCaptions(on) {
    captions = on;
    ccBtn.setAttribute('aria-pressed', String(on));
    try { localStorage.setItem('wdwc-captions', on ? '1' : '0'); } catch (e) { /* ignore */ }
    paint(shown);
  }
  if (!document.fullscreenEnabled) fsBtn.hidden = true;
  const chips = $('sections');
  SECTIONS.forEach(([name, t0], k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.innerHTML = `<span class="chip-name"></span><span class="chip-time"></span>`;
    b.querySelector('.chip-name').textContent = name;
    b.querySelector('.chip-time').textContent = fmt(t0);
    b.addEventListener('click', () => { seek(t0 + (k ? 0.01 : 0)); play(); });
    chips.appendChild(b);
  });
  function markSection(t) {
    let k = 0;
    SECTIONS.forEach(([, t0], i) => { if (t >= t0) k = i; });
    [...chips.children].forEach((el, i) => el.classList.toggle('is-current', i === k));
  }

  big.addEventListener('click', () => { if (!started) seek(0); play(); });
  playBtn.addEventListener('click', toggle);
  scrub.addEventListener('input', () => seek(parseFloat(scrub.value)));
  ccBtn.addEventListener('click', () => setCaptions(!captions));
  fsBtn.addEventListener('click', () => {
    const el = $('stageWrap');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  });
  canvas.addEventListener('click', () => { if (started) toggle(); });
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (e.key === ' ' || e.key === 'k') { if (tag === 'BUTTON' || tag === 'INPUT') return; e.preventDefault(); if (!started) seek(0); toggle(); }
    else if (e.key === 'ArrowRight' && tag !== 'INPUT') { seek(clock() + 5); }
    else if (e.key === 'ArrowLeft' && tag !== 'INPUT') { seek(clock() - 5); }
    else if (e.key === 'c' || e.key === 'C') setCaptions(!captions);
    else if (e.key === 'f' || e.key === 'F') fsBtn.click();
  });
  ['play', 'pause', 'playing'].forEach((ev) => audio.addEventListener(ev, syncUi));
  audio.addEventListener('ended', () => { syncUi(); showBig('Play again'); started = false; });
  audio.addEventListener('error', () => {
    silent = true;
    note.hidden = false;
    note.textContent = 'The song file did not load, so the animation will play silently. Check that we-dont-wake-cthulhu.mp3 sits next to this page.';
  });

  /* ---------- paint loop ---------- */
  function paint(t) {
    draw(t);
    const shownT = started ? t : 0; // the idle poster frame is not a playback position
    time.textContent = `${fmt(shownT)} / ${fmt(SONG_LENGTH)}`;
    if (document.activeElement !== scrub) scrub.value = String(shownT);
    markSection(shownT);
  }
  /* drop the backing resolution a notch if this device can't keep up */
  let lastFrame = 0, slow = 0, frames = 0;
  function adapt(now) {
    const dt = now - lastFrame; lastFrame = now;
    if (dt > 200 || !isPlaying()) return;
    frames++;
    if (dt > 26) slow++;
    if (frames >= 45) {
      if (slow > 30 && quality > 0.5) { quality = Math.max(0.5, quality - 0.15); resize(); }
      frames = 0; slow = 0;
    }
  }
  function loop(now) {
    adapt(now || performance.now());
    if (isPlaying()) {
      let t = clock();
      if (Math.abs(t - shown) < 0.3) t = Math.max(t, shown); // never step backwards on clock jitter
      shown = t;
      paint(t);
      if (silent && t >= SONG_LENGTH) { silentPlaying = false; silentBase = 0; syncUi(); showBig('Play again'); started = false; }
    }
    requestAnimationFrame(loop);
  }
  const ro = new ResizeObserver(() => { resize(); paint(started ? shown : POSTER_T); });
  ro.observe(canvas);
  resize();
  paint(POSTER_T);
  fontsReady.then(() => { capCache.clear(); paint(started ? shown : POSTER_T); });
  syncUi();
  requestAnimationFrame(loop);
})();
