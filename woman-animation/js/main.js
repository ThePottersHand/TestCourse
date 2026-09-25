'use strict';
// Woman: the edit (scene list, camera, cuts) and the player.

const SCENES = [
  { a: 0,     b: 1.82,  fn: 'sceneTitle',    name: 'Title' },
  { a: 1.82,  b: 5.95,  fn: 'sceneHighway',  name: 'Ohhhh' },
  { a: 5.95,  b: 9.75,  fn: 'sceneHill',     name: 'Seen a woman' },
  { a: 9.75,  b: 12.3,  fn: 'sceneStage',    name: 'I know I have' },
  { a: 12.3,  b: 15.24, fn: 'scenePrison',   name: 'Prison wall' },
  { a: 15.24, b: 16.2,  fn: 'sceneCell',     name: 'Prison' },
  { a: 16.2,  b: 17.95, fn: 'sceneTrain',    name: 'Freight train' },
  { a: 17.95, b: 20.62, fn: 'sceneEye',      name: 'Bionic eyeballs' },
  { a: 20.62, b: 23.3,  fn: 'sceneTriptych', name: 'Pasta & springs' },
  { a: 23.3,  b: 25.0,  fn: 'sceneCurio',    name: 'Interesting things' },
  { a: 25.0,  b: 28.05, fn: 'scenePond',     name: 'Ducks' },
  { a: 28.05, b: 31.4,  fn: 'scenePoster',   name: 'Hotdog water' },
  { a: 31.4,  b: 99,    fn: 'sceneOutro',    name: 'The end' }
];
const CUTS = SCENES.map(s => s.a).filter(a => a > 0);
const SHAKES = [[10.72, 6], [15.31, 26], [20.70, 10], [21.82, 10], [27.32, 8], [28.36, 7], [30.70, 24]];
const sceneAt = t => SCENES.find(s => t >= s.a && t < s.b) || SCENES[SCENES.length - 1];

function render(t) {
  FX.reset(); resetCtx();
  const sc = sceneAt(t), lt = t - sc.a, d = Math.min(sc.b, DUR) - sc.a;
  ctx.save();
  if (!REDUCE) {
    let x = 0, y = 0;
    for (const [st, amp] of SHAKES) { const k = t - st; if (k > 0 && k < 0.6) { const e = Math.exp(-k * 8) * amp; x += Math.sin(k * 83) * e; y += Math.cos(k * 71) * e; } }
    x += (vnoise(t * 0.7, 3.3) - 0.5) * 7; y += (vnoise(t * 0.6, 9.1) - 0.5) * 5;
    ctx.translate(x, y);
  }
  const z = 1.02 + 0.035 * clamp(lt / d) + (REDUCE ? 0 : pulse(t, 10) * 0.005);
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  const f = window[sc.fn];
  if (typeof f === 'function') f(t, lt, d); else { fillAll('#111'); cap(sc.name, W / 2, H / 2, F.disp(80), '#555'); }
  ctx.restore();
  resetCtx();
  filmDirt(t);
  lightLeak(t, CUTS);
  for (const c of CUTS) { const k = t - c; if (k >= 0 && k < 0.06) FX.exposure *= 1.25; }
  POST.frame(t);
}

// ---------- player ----------
(() => {
  const screen = document.getElementById('screen');
  let canvas = POST.init(document.getElementById('c'));
  const au = document.getElementById('au'), big = document.getElementById('big'), pp = document.getElementById('pp');
  const scrub = document.getElementById('scrub'), timeEl = document.getElementById('time'), chipsEl = document.getElementById('chips');
  const POSTER = 1.3;
  let ready = false, started = false, base = 0, perf = 0, scrubbing = false, quality = 1, slow = 0, lastScene = null;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  SCENES.forEach(s => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = s.name;
    b.addEventListener('click', () => seek(s.a + 0.02)); chipsEl.appendChild(b); s.chip = b;
  });
  function size() {
    const r = screen.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(480, Math.min(1920, Math.round(r.width * dpr * quality)));
    setSceneRes(w); POST.resize(w, Math.round(w * 9 / 16));
  }
  function clock() {
    if (!started) return POSTER;
    if (au.paused || scrubbing) return au.currentTime;
    const now = performance.now(), est = base + (now - perf) / 1000;
    if (Math.abs(est - au.currentTime) > 0.08) { base = au.currentTime; perf = now; return base; }
    return est;
  }
  function seek(t) { if (!ready) return; started = true; big.hidden = true; au.currentTime = clamp(t, 0, DUR); base = au.currentTime; perf = performance.now(); draw(); }
  function play() { if (!ready) return; started = true; big.hidden = true; if (au.ended || au.currentTime >= DUR - 0.05) au.currentTime = 0; au.play().catch(() => {}); }
  function toggle() { if (au.paused) play(); else au.pause(); }
  big.addEventListener('click', play); pp.addEventListener('click', toggle);
  au.addEventListener('play', () => { pp.textContent = 'Pause'; base = au.currentTime; perf = performance.now(); });
  au.addEventListener('pause', () => { pp.textContent = au.ended ? 'Replay' : 'Play'; });
  au.addEventListener('ended', () => { pp.textContent = 'Replay'; });
  scrub.addEventListener('input', () => { scrubbing = true; seek(parseFloat(scrub.value)); });
  scrub.addEventListener('change', () => { scrubbing = false; });
  document.getElementById('fs').addEventListener('click', () => { try { const p = screen.requestFullscreen && screen.requestFullscreen(); p && p.catch(() => {}); } catch (e) {} });
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' && e.code !== 'Space') return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowRight') seek(au.currentTime + 2);
    else if (e.code === 'ArrowLeft') seek(au.currentTime - 2);
  });
  function draw() {
    if (!ready) return;
    const t0 = performance.now(), t = clock();
    render(t);
    if (started && !au.paused) {
      const dt = performance.now() - t0; slow = slow * 0.95 + (dt > 34 ? 1 : 0) * 0.05;
      if (slow > 0.6 && quality > 0.5) { quality *= 0.8; slow = 0; size(); }
    }
    if (started) { if (!scrubbing) scrub.value = t.toFixed(2); timeEl.textContent = `${fmt(t)} / ${fmt(DUR)}`; }
    const sc = sceneAt(t);
    if (sc !== lastScene) { SCENES.forEach(s => s.chip.setAttribute('aria-current', s === sc && started ? 'true' : 'false')); lastScene = sc; }
  }
  function loop() { draw(); requestAnimationFrame(loop); }
  new ResizeObserver(() => { size(); draw(); }).observe(screen);
  size();
  window.__renderAt = t => { if (!ready) return; render(t); };
  const fonts = ['900 100px "Big Shoulders Display"', '800 100px "Big Shoulders Stencil Display"', '40px "IM Fell English"', 'italic 40px "IM Fell English"', '24px "Special Elite"'];
  big.disabled = true; big.textContent = 'Developing film\u2026';
  Promise.all(fonts.map(f => document.fonts.load(f).catch(() => {})))
    .then(() => TEX.init(k => { big.textContent = `Developing film\u2026 ${Math.round(k * 100)}%`; }))
    .then(() => { ready = true; big.disabled = false; big.innerHTML = '&#9654;&ensp;Play with sound'; window.__ready = true; draw(); requestAnimationFrame(loop); });
})();
