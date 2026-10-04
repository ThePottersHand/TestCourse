/* The Starfall Expedition: game engine.
   Story and puzzles live in story.js. Everything is stored on this phone only. */
(function () {
  'use strict';

  const ST = window.STARFALL;
  const NODES = ST.nodes;
  const PINS = ST.pins;
  const PIN_NUM = { base: 'B', n1: '1', a2: '2', a3: '3', b2: '2', b3: '3', n4: '4', c5: '5', d5: '5', finale: 'F' };
  const PATH_OF = {};
  PINS.forEach(p => { PATH_OF[p.id] = p.path || 'main'; });
  const PATH_NAME = { glow: 'Glowing Trail', slime: 'Slime Trail', comet: 'Comet Path', moon: 'Moon Path' };
  const LEVELS = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];
  const LEVEL_NAME = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  const WALK_FACTOR = 1.3; // real streets are longer than a straight line
  const KID_SPEED = 1.0;   // metres per second, with dawdling
  const KIND_AWARD = {
    'Space quiz': 'Star Scholar', 'Word scramble': 'Word Wizard', 'Code breaker': 'Code Cracker', 'Riddle': 'Riddle Master',
    'Pattern': 'Pattern Spotter', 'Logic lock': 'Logic Legend', 'Detective': 'Super Sleuth', 'Pirate riddle': 'Pirate Puzzler',
    'Riddle lock': 'Lock Picker', 'Star count': 'Star Counter', 'Space maths': 'Maths Astronaut', 'Kindness': 'Kind Heart',
    'Joke time': 'Joke Captain', 'Pirate puzzle': 'Pirate Puzzler'
  };

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rad = d => d * Math.PI / 180;
  const deg = r => r * 180 / Math.PI;
  const hasLL = p => !!p && typeof p.lat === 'number' && typeof p.lng === 'number' && isFinite(p.lat) && isFinite(p.lng);
  const angDiff = (a, b) => ((a - b + 540) % 360) - 180; // signed a - b, -180..180
  const reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  function hav(a, b) {
    const R = 6371000, dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function bearing(a, b) {
    const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
    return (deg(Math.atan2(y, x)) + 360) % 360;
  }
  function fmtDist(m) {
    if (m == null || !isFinite(m)) return '--';
    if (m < 1000) return (m < 50 ? Math.round(m) : Math.round(m / 5) * 5) + ' m';
    return (m / 1000).toFixed(2) + ' km';
  }
  function fmtMins(m) { const min = Math.max(1, Math.round(m / KID_SPEED / 60)); return 'about ' + min + ' min walk'; }
  const compass8 = b => ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(b / 45) % 8];
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ').trim().replace(/^(the|a|an)\s+/, '').replace(/\s+/g, '');
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (Math.abs(m - n) > 1) return 2;
    const d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function matches(input, accept) {
    const n = norm(input); if (!n) return false;
    return accept.some(a => { const t = norm(a); return n === t || (t.length >= 5 && lev(n, t) <= 1); });
  }
  function joinNames(list) {
    if (list.length <= 1) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }

  /* ---------- storage ---------- */
  const K = { state: 'starfall.v1.state', setup: 'starfall.v1.setup', prefs: 'starfall.v1.prefs', team: 'starfall.v1.team', photo: 'starfall.v1.photo.' };
  function load(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  let prefs = Object.assign({ sound: true, voice: false, wake: true }, load(K.prefs, {}));
  const savePrefs = () => store(K.prefs, prefs);

  function blankSetup() {
    const pins = {};
    PINS.forEach(p => { pins[p.id] = { lat: null, lng: null, hint: '', cq: '', ca: '' }; });
    return { v: 1, mode: 'gps', radius: 20, finaleAtBase: true, pins };
  }
  function normaliseSetup(x) {
    const b = blankSetup();
    if (!x || typeof x !== 'object') return b;
    b.mode = x.mode === 'practice' ? 'practice' : 'gps';
    b.radius = [15, 20, 25, 35].includes(+x.radius) ? +x.radius : 20;
    b.finaleAtBase = x.finaleAtBase !== false;
    PINS.forEach(p => {
      const s = (x.pins && x.pins[p.id]) || {};
      b.pins[p.id] = {
        lat: typeof s.lat === 'number' ? s.lat : null, lng: typeof s.lng === 'number' ? s.lng : null,
        hint: String(s.hint || '').slice(0, 140), cq: String(s.cq || '').slice(0, 200), ca: String(s.ca || '').slice(0, 60)
      };
    });
    return b;
  }
  let setup = normaliseSetup(load(K.setup, null));
  let setupTimer = null;
  function saveSetup(now) {
    clearTimeout(setupTimer);
    if (now) store(K.setup, setup); else setupTimer = setTimeout(() => store(K.setup, setup), 300);
  }

  let S = load(K.state, null);
  if (!S || S.v !== 1 || !NODES[S.node]) S = null;
  function saveState() { if (S) store(K.state, S); }

  const PHOTO_MEM = {};
  function storePhoto(dataUrl, caption) {
    const key = K.photo + Date.now();
    PHOTO_MEM[key] = dataUrl;
    try { localStorage.setItem(key, dataUrl); } catch (e) { /* kept in memory only */ }
    S.photos.push({ key, caption });
    saveState();
  }
  function getPhoto(key) { if (PHOTO_MEM[key]) return PHOTO_MEM[key]; try { return localStorage.getItem(key); } catch (e) { return null; } }
  function clearPhotos() {
    try { Object.keys(localStorage).filter(k => k.indexOf(K.photo) === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
  }

  function defaultTeam() {
    return [{ name: '', age: 7, level: 'easy' }, { name: '', age: 10, level: 'medium' }, { name: '', age: 12, level: 'hard' }];
  }
  const levelForAge = a => (a <= 8 ? 'easy' : a <= 10 ? 'medium' : 'hard');

  /* ---------- pins and route ---------- */
  function pinOf(id) {
    if (id === 'finale' && setup.finaleAtBase) {
      const b = setup.pins.base, f = setup.pins.finale;
      return { lat: b.lat, lng: b.lng, hint: f.hint || 'Back to Base Camp', cq: f.cq, ca: f.ca };
    }
    return setup.pins[id];
  }
  const gpsMode = () => setup.mode === 'gps';
  const neededPins = () => PINS.filter(p => !(p.id === 'finale' && setup.finaleAtBase));
  function routeLength(stops) {
    let total = 0; const missing = [];
    stops.forEach(id => { if (!hasLL(pinOf(id))) missing.push(id); });
    if (missing.length) return { missing };
    for (let i = 1; i < stops.length; i++) total += hav(pinOf(stops[i - 1]), pinOf(stops[i]));
    return { metres: total * WALK_FACTOR, missing };
  }
  function routeSummary() {
    const lens = ST.routes.map(r => routeLength(r.stops).metres).filter(Boolean);
    if (lens.length < ST.routes.length) return null;
    return { min: Math.min.apply(null, lens), max: Math.max.apply(null, lens) };
  }

  /* ---------- sound, speech, vibration ---------- */
  let actx = null;
  function unlockAudio() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
  }
  function tone(f, d, type, when, vol) {
    if (!prefs.sound || !actx) return;
    try {
      const t = actx.currentTime + (when || 0), o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + 0.05);
    } catch (e) { /* ignore */ }
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignore */ } }
  const sfx = {
    good() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.09, 0.14)); buzz(60); },
    bad() { tone(220, 0.22, 'sawtooth', 0, 0.06); tone(160, 0.3, 'sawtooth', 0.12, 0.06); buzz([80, 60, 80]); },
    arrive() { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'sine', i * 0.12, 0.2)); buzz([150, 80, 150, 80, 400]); },
    caught() { [880, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.25, 'triangle', i * 0.06, 0.16)); buzz([40, 30, 120]); },
    ping(strength) { tone(700 + strength * 900, 0.05, 'sine', 0, 0.05 + strength * 0.06); },
    tick() { tone(1000, 0.04, 'square', 0, 0.03); }
  };

  let voices = [];
  function loadVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function speakLines(lines) {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const v = voices.find(x => /en[-_]GB/i.test(x.lang)) || voices.find(x => /^en/i.test(x.lang));
      lines.forEach(l => {
        const u = new SpeechSynthesisUtterance(fill(l[1]));
        if (v) u.voice = v;
        u.lang = v ? v.lang : 'en-GB';
        if (l[0] === 'z') { u.pitch = 1.6; u.rate = 1.05; } else if (l[0] === 'g') { u.pitch = 0.4; u.rate = 0.9; } else { u.pitch = 1; u.rate = 1; }
        speechSynthesis.speak(u);
      });
    } catch (e) { /* ignore */ }
  }
  function stopSpeech() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ } }

  /* ---------- sensors: GPS ---------- */
  const GEO = { fix: null, good: null, watching: false, id: null, error: null, waitPin: null };
  function startGeo() {
    if (GEO.watching || !('geolocation' in navigator)) return;
    GEO.watching = true; GEO.error = null;
    try {
      GEO.id = navigator.geolocation.watchPosition(onPos, onGeoErr, { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 });
    } catch (e) { GEO.watching = false; GEO.error = 2; }
  }
  let walkSaveAt = 0;
  function onPos(p) {
    const c = p.coords;
    const fix = { lat: c.latitude, lng: c.longitude, acc: typeof c.accuracy === 'number' && isFinite(c.accuracy) ? Math.max(1, c.accuracy) : 999, speed: c.speed, heading: c.heading, t: Date.now() };
    GEO.fix = fix; GEO.error = null;
    if (fix.acc <= 30) {
      if (S && S.phase === 'travel' && GEO.good) {
        const d = hav(GEO.good, fix);
        if (d >= 6 && d < 250) { S.walked += d; GEO.good = fix; }
      } else GEO.good = fix;
      if (Date.now() - walkSaveAt > 15000) { walkSaveAt = Date.now(); saveState(); }
    }
    if (UI.screen === 'mission' && S && S.phase === 'travel') onTravelFix();
    if (UI.screen === 'setup') onSetupFix();
    if (UI.onGeo) UI.onGeo();
  }
  function onGeoErr(e) {
    GEO.error = e && e.code;
    if (e && e.code === 1) { GEO.watching = false; try { navigator.geolocation.clearWatch(GEO.id); } catch (x) { /* ignore */ } }
    if (UI.onGeo) UI.onGeo();
    if (UI.screen === 'mission' && S && S.phase === 'travel') updateTravel();
  }
  function geoStatus() {
    if (!('geolocation' in navigator)) return 'none';
    if (GEO.fix && Date.now() - GEO.fix.t < 60000) return 'on';
    if (GEO.error === 1) return 'blocked';
    return GEO.watching ? 'waiting' : 'off';
  }

  /* ---------- sensors: compass and motion ---------- */
  const ORI = { rel: null, abs: null, beta: null, at: 0, absAt: 0, lastAbsEvt: 0 };
  const MOT = { on: false, asked: false, denied: false, askedAt: 0 };
  function smooth(prev, h, k) { if (prev == null) return h; return (prev + angDiff(h, prev) * k + 360) % 360; }
  // Horizontal direction the phone faces: a blend of the top edge (phone held flat)
  // and the back camera (phone held upright). Works across the tilt range.
  function forwardHeading(a, b, g) {
    const cA = Math.cos(rad(a)), sA = Math.sin(rad(a)), cB = Math.cos(rad(b)), sB = Math.sin(rad(b)), cG = Math.cos(rad(g)), sG = Math.sin(rad(g));
    const bx = -cA * sG - sA * sB * cG, by = -sA * sG + cA * sB * cG; // back camera
    const tx = -cB * sA, ty = cB * cA;                               // top edge
    return (deg(Math.atan2(bx + tx, by + ty)) + 360) % 360;
  }
  function handleOri(e, absEvent) {
    const now = performance.now();
    const ios = typeof e.webkitCompassHeading === 'number';
    if (!absEvent && !ios && now - ORI.lastAbsEvt < 1500) return; // prefer the absolute stream on Android
    if (absEvent) ORI.lastAbsEvt = now;
    if (e.alpha == null && !ios) return;
    if (e.alpha != null && e.beta != null) {
      ORI.rel = smooth(ORI.rel, forwardHeading(e.alpha, e.beta, e.gamma || 0), 0.35);
      ORI.beta = e.beta;
    }
    let abs = null;
    if (ios && e.webkitCompassHeading >= 0) abs = e.webkitCompassHeading;
    else if ((absEvent || e.absolute === true) && e.alpha != null) abs = forwardHeading(e.alpha, e.beta || 0, e.gamma || 0);
    if (abs != null) { ORI.abs = smooth(ORI.abs, abs, 0.3); ORI.absAt = now; }
    ORI.at = now;
  }
  function enableMotion() {
    if (MOT.on) return Promise.resolve(true);
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) return Promise.resolve(false);
    const attach = () => {
      if (MOT.on) return; MOT.on = true; MOT.askedAt = performance.now();
      window.addEventListener('deviceorientationabsolute', e => handleOri(e, true));
      window.addEventListener('deviceorientation', e => handleOri(e, false));
    };
    MOT.asked = true;
    if (typeof DOE.requestPermission === 'function') {
      let p;
      try { p = DOE.requestPermission(); } catch (e) { return Promise.resolve(false); }
      return p.then(r => { if (r === 'granted') { attach(); return true; } MOT.denied = true; return false; }).catch(() => false);
    }
    attach();
    return Promise.resolve(true);
  }
  function motionStatus() {
    if (!window.DeviceOrientationEvent) return 'none';
    if (ORI.at && performance.now() - ORI.at < 3000) return 'on';
    if (MOT.denied) return 'blocked';
    if (MOT.on && performance.now() - MOT.askedAt > 2500) return 'none';
    return MOT.on ? 'waiting' : 'off';
  }
  const absHeading = () => (ORI.abs != null && performance.now() - ORI.absAt < 2500 ? ORI.abs : null);

  /* ---------- camera ---------- */
  const CAM = { state: 'off' };
  function testCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { CAM.state = 'none'; return Promise.resolve(); }
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(st => { st.getTracks().forEach(t => t.stop()); CAM.state = 'on'; })
      .catch(e => { CAM.state = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'blocked' : 'none'; });
  }

  /* ---------- screen wake lock ---------- */
  let wakeLock = null;
  async function wake(on) {
    try {
      if (on && prefs.wake && 'wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if ((!on || !prefs.wake) && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) { wakeLock = null; }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && UI.screen === 'mission' && S && S.phase !== 'done') wake(true);
  });

  /* ---------- UI plumbing ---------- */
  const UI = { screen: 'title', team: null, onGeo: null, spokenKey: '', pendingImport: null };
  const main = $('#main'), bar = $('#bar'), hud = $('#hud');
  let cleanup = [];
  function runCleanup() { cleanup.forEach(f => { try { f(); } catch (e) { /* ignore */ } }); cleanup = []; UI.onGeo = null; }
  function paint(html, barHtml, keepScroll) {
    const y = main.scrollTop;
    runCleanup();
    main.innerHTML = html;
    bar.innerHTML = barHtml || '';
    main.scrollTop = keepScroll ? y : 0;
  }
  const ACT = {};
  const CHG = {};
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (!fn) return;
    unlockAudio();
    if (el.dataset.confirm) {
      if (!el.dataset.armed) {
        el.dataset.armed = '1'; el.dataset.label = el.innerHTML; el.classList.add('confirming'); el.textContent = el.dataset.confirm;
        setTimeout(() => { if (el.isConnected && el.dataset.armed) { delete el.dataset.armed; el.classList.remove('confirming'); el.innerHTML = el.dataset.label; } }, 3500);
        return;
      }
      delete el.dataset.armed;
    }
    fn(el, e);
  });
  document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && CHG[el.dataset.chg]) CHG[el.dataset.chg](el, e); });
  document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (el && CHG[el.dataset.inp]) CHG[el.dataset.inp](el, e); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const el = e.target.closest('[data-enter]');
    if (el) { e.preventDefault(); const b = document.getElementById(el.dataset.enter); if (b) b.click(); }
  });

  function fill(t) {
    return String(t)
      .replace(/\{lead\}/g, S ? leadName() : 'Ranger')
      .replace(/\{names\}/g, S ? joinNames(S.kids.map(kidName)) : 'Rangers')
      .replace(/\{letters\}/g, S ? S.letters.join(' ') : '');
  }
  const resolveLines = arr => (typeof arr === 'function' ? arr(S) : arr || []).map(l => (typeof l === 'function' ? l(S) : l));

  const AVATAR = {
    z: '<svg class="who" viewBox="0 0 44 44" aria-hidden="true"><line x1="22" y1="10" x2="22" y2="4" style="stroke:var(--zib)" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="4" r="3" style="fill:var(--signal)"/><ellipse cx="22" cy="27" rx="17" ry="15" style="fill:var(--zib)"/><circle cx="22" cy="25" r="8" fill="#fff"/><circle cx="23.5" cy="25.5" r="4" fill="#14163a"/><path d="M16 35 q6 3.5 12 0" stroke="#14163a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    g: '<svg class="who" viewBox="0 0 44 44" aria-hidden="true"><path d="M4 40 q-2-22 18-25 q20 3 18 25 q-4 3-8 0 q-5 3-10 0 q-5 3-10 0 q-4 3-8 0z" style="fill:var(--gloop)"/><path d="M9 17 l13-11 13 11z" fill="#14163a"/><circle cx="22" cy="12" r="2" fill="#fff"/><circle cx="16" cy="26" r="4.5" fill="#fff"/><circle cx="28" cy="26" r="4.5" fill="#fff"/><circle cx="17" cy="27" r="2" fill="#14163a"/><circle cx="27" cy="27" r="2" fill="#14163a"/></svg>'
  };
  function lineHTML(l, i) {
    const who = l[0], text = esc(fill(l[1])), st = `style="animation-delay:${(i || 0) * 0.1}s"`;
    if (who === 'z' || who === 'g') {
      return `<div class="line ${who}" ${st}>${AVATAR[who]}<div class="bubble"><span class="name">${who === 'z' ? 'Zib' : 'Captain Gloop'}</span>${text}</div></div>`;
    }
    return `<div class="line ${who}" ${st}>${text}</div>`;
  }
  const linesHTML = lines => `<div class="log">${lines.map(lineHTML).join('')}</div>`;
  function speakOnce(key, lines) {
    if (UI.spokenKey === key) return;
    UI.spokenKey = key;
    if (prefs.voice) speakLines(lines); else stopSpeech();
  }
  const readBtn = () => '<button class="btn ghost small" type="button" data-act="readAloud">Read this aloud</button>';

  /* ---------- mission state ---------- */
  const kidName = (k, i) => (k.name && k.name.trim()) || 'Ranger ' + ((i == null ? S.kids.indexOf(k) : i) + 1);
  const leadIdx = () => S.turn % S.kids.length;
  const leadName = () => kidName(S.kids[leadIdx()], leadIdx());

  function newMission(kids) {
    clearPhotos();
    return {
      v: 1, phase: 'mission', node: 'base', step: 0, travelTo: null, kids, turn: 0,
      score: 0, max: 0, log: [], letters: [], choices: {}, safety: { ok: 0, total: 0 },
      startedAt: Date.now(), endedAt: null, walked: 0, photos: [],
      kidStats: kids.map(() => ({ kinds: {} })), ss: {}
    };
  }
  function stepsFor(id) {
    if (id === 'base') return ['intro', 'rules', 'power', 'training', 'sendoff'];
    if (id === 'finale') return ['safety', 'arrive', 'caught', 'code', 'ending'];
    return ['safety', 'arrive', 'caught', 'challenge', 'field', 'outro'];
  }
  const curStep = () => stepsFor(S.node)[S.step];
  function award(label, pts, max) {
    pts = Math.max(0, Math.round(pts)); max = Math.round(max);
    S.score += pts; S.max += max;
    S.log.push({ label, pts, max });
    saveState(); updateHud(pts);
  }
  function next() {
    if (curStep() === 'challenge') S.turn++;
    S.step = Math.min(S.step + 1, stepsFor(S.node).length - 1);
    S.ss = {};
    saveState(); render();
  }
  function startTravel(to) {
    S.phase = 'travel'; S.travelTo = to; S.ss = {};
    TR.ref = null; TR.streak = 0; TR.near = false;
    saveState();
    if (gpsMode()) startGeo();
    wake(true);
    render();
  }
  function arrive() {
    if (!S || S.phase !== 'travel') return;
    S.node = S.travelTo; S.travelTo = null; S.phase = 'mission'; S.step = 0; S.ss = {};
    saveState(); sfx.arrive(); render();
  }
  function finishMission() {
    S.phase = 'done'; S.endedAt = Date.now(); S.ss = {};
    saveState(); wake(false); render();
  }

  /* ---------- HUD ---------- */
  function updateHud(popPts) {
    if (!S) return;
    $('#hudScore').textContent = S.score.toLocaleString('en-GB');
    const tray = $('#hudTray');
    let h = '';
    for (let i = 0; i < 5; i++) { const l = S.letters[i]; h += `<span class="${l ? 'got' : ''}">${l ? esc(l) : ''}</span>`; }
    tray.innerHTML = h;
    if (popPts > 0) {
      const p = document.createElement('span'); p.className = 'pop'; p.textContent = '+' + popPts;
      $('.hud-score').appendChild(p); setTimeout(() => p.remove(), 1500);
    }
  }

  /* ---------- router ---------- */
  function render() {
    if (AR.on) closeScanner();
    if (UI.screen === 'mission' && S) {
      hud.hidden = S.phase === 'done';
      updateHud();
      if (S.phase === 'done') return renderResults();
      if (S.phase === 'travel') return renderTravel();
      return renderStep();
    }
    hud.hidden = true;
    stopSpeech(); UI.spokenKey = '';
    if (UI.screen === 'setup') return renderSetup();
    if (UI.screen === 'team') return renderTeam();
    if (UI.screen === 'how') return renderHow();
    return renderTitle();
  }

  /* ---------- title ---------- */
  function setupStatusHTML() {
    if (!gpsMode()) {
      return `<div class="card flat"><div class="row" style="align-items:center"><span class="chip warn">Practice mode</span></div>
        <p>No GPS needed. Walk between rooms or round the garden, and the Commander taps <b>We're here</b> at each checkpoint. Switch to a real walk in Grown-up setup.</p></div>`;
    }
    const need = neededPins(), placed = need.filter(p => hasLL(setup.pins[p.id])).length;
    const sum = routeSummary();
    if (placed === need.length && sum) {
      const a = (sum.min / 1000).toFixed(1), b = (sum.max / 1000).toFixed(1);
      return `<div class="card flat"><div class="row" style="align-items:center"><span class="chip good">Route ready</span><span class="chip muted">${a === b ? a : a + ' to ' + b} km walk</span></div>
        <p class="lede">All ${need.length} checkpoints are on the map. The Rangers will visit 6 of them, depending on the paths they choose.</p></div>`;
    }
    return `<div class="card flat"><div class="row" style="align-items:center"><span class="chip warn">${placed} of ${need.length} checkpoints placed</span></div>
      <p>Grown-up: place the checkpoints on safe spots in your neighbourhood before you set off. It takes about 10 minutes with the map.</p>
      <div class="row"><button class="btn secondary small" data-act="openSetup" type="button">Open Grown-up setup</button></div></div>`;
  }
  function renderTitle() {
    const inProgress = S && S.phase !== 'done';
    const imp = UI.pendingImport ? `<div class="card"><b>A route setup was shared with you.</b><p class="lede">Loading it replaces the checkpoints on this phone.</p>
      <div class="row"><button class="btn primary small" data-act="importYes" type="button">Load shared route</button><button class="btn secondary small" data-act="importNo" type="button">Ignore</button></div></div>` : '';
    const html = `<section class="hero"><canvas id="heroSky" aria-hidden="true"></canvas><div class="inner">
        <div class="eyebrow" style="color:#39d3e6">A walking adventure for Star Rangers</div>
        <h1 class="logo">The Starfall<span>Expedition</span></h1>
        <p>Zib the alien has crash-landed near your home. Find the five star shards hidden around your neighbourhood before Captain Gloop does.</p>
      </div></section>
      <div class="wrap">
        ${imp}
        ${setupStatusHTML()}
        ${inProgress ? `<div class="card flat"><b>Mission in progress</b><p class="lede">${esc(joinNames(S.kids.map(kidName)))}: ${S.score} points, ${S.letters.length} of 5 shards.</p></div>` : ''}
        <div class="row">
          <button class="btn secondary small" data-act="openHow" type="button">How it works</button>
          <button class="btn secondary small" data-act="openSetup" type="button">Grown-up setup</button>
        </div>
        <p class="lede" style="font-size:var(--step--1)">Bring a grown-up, a charged phone and comfy shoes. About 2 km and 60 to 90 minutes.</p>
      </div>`;
    const barHtml = inProgress
      ? '<button class="btn secondary" data-act="newMission" data-confirm="Start over? Tap again" type="button">New mission</button><button class="btn primary" data-act="continue" type="button">Continue mission</button>'
      : '<button class="btn primary" data-act="newMission" type="button">Start a new mission</button>';
    paint(html, barHtml);
    heroSky($('#heroSky'));
  }
  function heroSky(cv) {
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0;
    const stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 }));
    const falls = [];
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function frame(ts) {
      const t = ts / 1000;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d0f2b'); g.addColorStop(1, '#23286b');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      stars.forEach(s => { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + s.p)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      if (Math.random() < 0.025 && falls.length < 4) falls.push({ x: Math.random() * W * 1.2, y: -20, v: 3 + Math.random() * 3 });
      for (let i = falls.length - 1; i >= 0; i--) {
        const f = falls[i]; f.x -= f.v * 0.8; f.y += f.v;
        const tr = ctx.createLinearGradient(f.x, f.y, f.x + 60, f.y - 75); tr.addColorStop(0, 'rgba(57,211,230,.9)'); tr.addColorStop(1, 'rgba(57,211,230,0)');
        ctx.strokeStyle = tr; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + 60, f.y - 75); ctx.stroke();
        ctx.fillStyle = '#e9fdff'; ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, 7); ctx.fill();
        if (f.y > H + 40) falls.splice(i, 1);
      }
      // the Pebble's skid mark: a little smoking crater on the horizon
      ctx.fillStyle = '#0d0f2b'; ctx.beginPath(); ctx.ellipse(W * 0.78, H + 6, W * 0.5, 34, 0, 0, 7); ctx.fill();
      if (!reducedMotion()) raf = requestAnimationFrame(frame);
    }
    size(); frame(performance.now());
    const onR = () => size();
    window.addEventListener('resize', onR);
    cleanup.push(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', onR); });
  }

  ACT.openSetup = () => { UI.screen = 'setup'; render(); };
  ACT.openHow = () => { UI.screen = 'how'; render(); };
  ACT.back = () => { UI.screen = 'title'; render(); };
  ACT.newMission = () => { UI.team = load(K.team, null) || defaultTeam(); UI.screen = 'team'; render(); };
  ACT.continue = () => {
    UI.screen = 'mission';
    enableMotion();
    if (gpsMode() && S.phase === 'travel') startGeo();
    wake(true);
    render();
  };
  ACT.importYes = () => { setup = normaliseSetup(UI.pendingImport); saveSetup(true); UI.pendingImport = null; render(); };
  ACT.importNo = () => { UI.pendingImport = null; render(); };

  /* ---------- how it works ---------- */
  function renderHow() {
    const html = `<div class="wrap">
      <div><div class="eyebrow">For grown-ups</div><h1 class="title sm">How the expedition works</h1></div>
      <div class="card flat"><b>The story</b><p>Zib, a tiny alien pilot, crash-landed near your home. Five star shards from Zib's engine are scattered around the neighbourhood, and Captain Gloop the space pirate wants them. The Rangers walk from checkpoint to checkpoint, scan for each shard, solve puzzles and choose which way the story goes. The five shard letters make the launch code that sends Zib home.</p></div>
      <div class="card flat"><b>Before you go</b><ol class="bullets">
        <li>Open <b>Grown-up setup</b> and place 9 checkpoints: Base Camp, the first stop, two stops on each of the two trails, a meeting point, and one stop on each of the two final paths. The finish can be back home.</li>
        <li>Only choose spots on pavements, paths or in parks, with safe places to cross. Both trails should be routes you are happy to walk. If you only have one good route, put both trails' pins in the same places. The story and puzzles still change.</li>
        <li>Add a short clue for each spot, like "the red postbox by the bakery". The kids see it while they walk.</li>
        <li>Optional: add your own question for any spot, like "What animal is on the church weathervane?". It replaces that stop's bonus mission.</li>
        <li>Try <b>Practice at home</b> mode first if you want to preview everything.</li>
      </ol></div>
      <div class="card flat"><b>On the walk</b><ul class="bullets">
        <li>The phone shows the distance, a compass arrow and a warmer or colder signal. It notices when you arrive (within about 20 m). You can always tap <b>We're here</b> instead.</li>
        <li>At each checkpoint: a safety check, the AR scanner (turn around to find the shard through the camera), a puzzle for the Ranger whose turn it is, and a bonus mission for the whole team.</li>
        <li>Puzzles come in Easy, Medium and Hard. Each Ranger gets their own level, so a 7-year-old and a 12-year-old both get a fair go.</li>
        <li>Two forks let the Rangers choose the path. Every choice leads to a happy ending.</li>
      </ul></div>
      <div class="card flat"><b>Scoring</b><ul class="bullets">
        <li>Shard found: 50. Puzzle: 100 on the first try, 60 on the second, 30 on the third. A hint costs 20.</li>
        <li>Bonus missions: 75. Safe walking on each leg, judged by the Commander: 25.</li>
        <li>Launch code: up to 150. There are no points for speed. Walking is never a race.</li>
      </ul></div>
      <div class="card flat"><b>Privacy</b><p>Everything stays on this phone: the route, the score and the photos. Your location is never sent anywhere. The setup map loads its pictures from OpenStreetMap.</p></div>
    </div>`;
    paint(html, '<button class="btn primary" data-act="back" type="button">Back</button>');
  }

  /* ---------- team ---------- */
  function renderTeam() {
    const team = UI.team;
    const kids = team.map((k, i) => `<div class="card flat kid">
        <div><label class="lbl" for="kn${i}">Ranger ${i + 1} name</label><input class="field" id="kn${i}" data-inp="kidName" data-i="${i}" value="${esc(k.name)}" placeholder="Ranger ${i + 1}" maxlength="20" autocomplete="off"></div>
        <div><label class="lbl" for="ka${i}">Age</label><select class="field" id="ka${i}" data-chg="kidAge" data-i="${i}">${Array.from({ length: 13 }, (_, j) => j + 4).map(a => `<option ${a === +k.age ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
        <div class="levels" role="group" aria-label="Puzzle level">${LEVELS.map(([v, n]) => `<button type="button" data-act="kidLevel" data-i="${i}" data-l="${v}" aria-pressed="${k.level === v}">${n}</button>`).join('')}</div>
        ${team.length > 1 ? `<button class="btn ghost small" type="button" data-act="kidRemove" data-i="${i}">Remove</button>` : ''}
      </div>`).join('');
    const html = `<div class="wrap">
      <div><div class="eyebrow">Mission crew</div><h1 class="title sm">Who are the Star Rangers?</h1>
      <p class="lede">Rangers take turns leading the puzzles, in this order. Each Ranger's puzzles match their level. The level is set from their age, and you can change it.</p></div>
      <div class="stack">${kids}</div>
      ${team.length < 5 ? '<div class="row"><button class="btn secondary small" type="button" data-act="kidAdd">Add a Ranger</button></div>' : ''}
    </div>`;
    paint(html, '<button class="btn secondary" data-act="back" type="button">Back</button><button class="btn primary" data-act="teamStart" type="button">Begin the mission</button>', true);
  }
  CHG.kidName = el => { UI.team[+el.dataset.i].name = el.value; };
  CHG.kidAge = el => { const k = UI.team[+el.dataset.i]; k.age = +el.value; k.level = levelForAge(k.age); renderTeam(); };
  ACT.kidLevel = el => { UI.team[+el.dataset.i].level = el.dataset.l; renderTeam(); };
  ACT.kidRemove = el => { UI.team.splice(+el.dataset.i, 1); renderTeam(); };
  ACT.kidAdd = () => { UI.team.push({ name: '', age: 9, level: 'medium' }); renderTeam(); };
  ACT.teamStart = () => {
    const kids = UI.team.map(k => ({ name: String(k.name || '').trim().slice(0, 20), age: +k.age || 9, level: k.level || 'medium' }));
    store(K.team, kids);
    S = newMission(kids);
    UI.screen = 'mission'; UI.spokenKey = '';
    saveState(); wake(true); render();
  };

  /* ---------- mission steps ---------- */
  function placeHead(eyebrow, place, path) {
    const chip = path && PATH_NAME[path] ? `<span class="chip ${path}">${PATH_NAME[path]}</span>` : '';
    return `<div class="stack" style="gap:6px"><div class="row" style="align-items:center;gap:8px"><span class="eyebrow">${esc(eyebrow)}</span>${chip}</div><h1 class="title">${esc(place)}</h1></div>`;
  }
  function storyStep(eyebrow, lines, barHtml, extra) {
    const node = NODES[S.node];
    const html = `<div class="wrap">${placeHead(eyebrow, node.place, PATH_OF[S.node])}${linesHTML(lines)}${extra || ''}<div>${readBtn()}</div></div>`;
    paint(html, barHtml);
    UI.readLines = lines;
    speakOnce(S.node + ':' + S.step + ':' + (S.ss.k || ''), lines);
  }
  ACT.readAloud = () => { if (UI.readLines) speakLines(UI.readLines); };

  function renderStep() {
    const step = curStep(), node = NODES[S.node];
    const primary = (label, act, extra) => `<button class="btn primary" type="button" data-act="${act}" ${extra || ''}>${label}</button>`;
    switch (step) {
      case 'intro':
        return storyStep('Incoming transmission', resolveLines(node.intro), primary("Yes! We'll help", 'next'));
      case 'rules': {
        const html = `<div class="wrap">${placeHead('Before we go', 'Ranger rules')}
          <ol class="rules">${ST.rules.map(r => `<li><div><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div></li>`).join('')}</ol>
          <label class="check" for="rulesOk"><input type="checkbox" id="rulesOk" data-chg="rulesOk" ${S.ss.rulesOk ? 'checked' : ''}><span><b>Commander:</b> we have read the Ranger rules together.</span></label>
        </div>`;
        paint(html, primary('Power up the scanner', 'next', S.ss.rulesOk ? 'id="rulesNext"' : 'id="rulesNext" disabled'));
        UI.readLines = null;
        return;
      }
      case 'power': return renderPower();
      case 'training': {
        if (!S.ss.caught) {
          return storyStep('Scanner training', resolveLines(node.training), primary('Open the scanner', 'scanTraining'));
        }
        S.ss.k = 'done';
        return storyStep('Scanner training', resolveLines(node.trainingDone), primary('Continue', 'next'));
      }
      case 'sendoff':
        return storyStep('First signal found', resolveLines(node.sendoff), primary('Start walking', 'go', `data-to="${node.next}"`));
      case 'safety': return renderSafety();
      case 'arrive':
        return storyStep('Checkpoint reached', resolveLines(node.arrive), primary('Open the scanner', 'scan'));
      case 'caught':
        return storyStep('Shard collected', resolveLines(node.caught), primary(S.node === 'finale' ? 'Start the Star Engine' : 'Continue', 'next'));
      case 'challenge': return renderChallenge();
      case 'field': return renderField();
      case 'outro': return renderOutro();
      case 'code': return renderCode();
      case 'ending':
        return storyStep('Mission complete', resolveLines(node.ending), primary('See your score', 'finish'));
    }
  }
  ACT.next = () => next();
  ACT.go = el => startTravel(el.dataset.to);
  ACT.finish = () => finishMission();
  CHG.rulesOk = el => { S.ss.rulesOk = el.checked; saveState(); const b = $('#rulesNext'); if (b) b.disabled = !el.checked; };

  /* power-up: permissions */
  function renderPower() {
    const rows = [];
    if (gpsMode()) rows.push(['loc', 'Location', 'Tracks the shard signals on your walk.', geoStatus()]);
    rows.push(['motion', 'Compass and motion', 'Turns the arrow and the scanner as you turn.', motionStatus()]);
    rows.push(['cam', 'Camera', 'Lets the scanner see the world around you.', CAM.state]);
    const chip = s => ({ on: '<span class="chip good">On</span>', waiting: '<span class="chip warn">Waiting</span>', blocked: '<span class="chip bad">Blocked</span>', none: '<span class="chip muted">Not available</span>', off: '' }[s] || '');
    const html = `<div class="wrap">${placeHead('Base Camp', 'Power up the scanner')}
      <p class="lede">Commander, tap each button and choose Allow. If something stays blocked, the game still works: you can tap to arrive, and drag the scanner to look around.</p>
      <div class="card stack" id="permCard">${rows.map(([id, name, why, st]) => `<div class="perm"><div class="label"><b>${name}</b><span>${why}</span></div>
        <div id="perm-${id}">${st === 'on' || st === 'none' ? chip(st) : `${chip(st)} <button class="btn secondary small" type="button" data-act="perm" data-p="${id}">Turn on</button>`}</div></div>`).join('')}</div>
      ${geoStatus() === 'blocked' ? '<p class="lede">Location is blocked. On iPhone: Settings, Privacy and Security, Location Services, Safari Websites, While Using. On Android: tap the lock icon by the web address and allow Location.</p>' : ''}
      ${gpsMode() && GEO.fix ? `<p class="lede">GPS accuracy is about ${Math.round(GEO.fix.acc)} m.</p>` : ''}
    </div>`;
    paint(html, primary2('Scanner ready', 'next'), true);
    UI.readLines = null;
    const sig = rows.map(r => r[3]).join() + (GEO.fix ? 1 : 0);
    const iv = setInterval(() => {
      const now = (gpsMode() ? [geoStatus()] : []).concat([motionStatus(), CAM.state]).join() + (GEO.fix ? 1 : 0);
      if (now !== sig && curStep() === 'power' && !AR.on) renderPower();
    }, 1000);
    cleanup.push(() => clearInterval(iv));
  }
  const primary2 = (label, act) => `<button class="btn primary" type="button" data-act="${act}">${label}</button>`;
  ACT.perm = el => {
    const p = el.dataset.p;
    if (p === 'loc') startGeo();
    if (p === 'motion') enableMotion().then(() => setTimeout(renderPower, 400));
    if (p === 'cam') testCamera().then(renderPower);
    el.disabled = true;
  };

  /* safety check on arrival */
  function renderSafety() {
    const html = `<div class="wrap">${placeHead('Signal reached', NODES[S.node].place, PATH_OF[S.node])}
      <div class="card"><div class="eyebrow">Commander check</div>
        <p class="question">Did every Ranger walk safely? Stopping at kerbs, staying together and keeping eyes up.</p>
        <p class="lede">Safe walking earns 25 points on every leg.</p></div></div>`;
    paint(html, '<button class="btn secondary" type="button" data-act="safety" data-ok="0">Not this time</button><button class="btn primary" type="button" data-act="safety" data-ok="1">Yes! +25</button>');
    UI.readLines = null;
  }
  ACT.safety = el => {
    const ok = el.dataset.ok === '1';
    S.safety.total++; if (ok) S.safety.ok++;
    award('Safe walking to ' + NODES[S.node].place, ok ? 25 : 0, 25);
    if (ok) sfx.good();
    next();
  };

  /* scanner hooks */
  ACT.scanTraining = () => openScanner({ kind: 'shard', letter: '', training: true });
  ACT.scan = () => {
    const node = NODES[S.node];
    openScanner({ kind: node.target, letter: node.letter || '' });
  };
  function onScanDone(opts, skipped) {
    if (opts.training) {
      award('Scanner training', skipped ? 10 : 25, 25);
      S.ss.caught = true; saveState(); render(); return;
    }
    const node = NODES[S.node];
    const what = node.target === 'ship' ? 'Found the Pebble' : 'Shard: ' + node.place;
    award(what, skipped ? 20 : 50, 50);
    if (node.letter && S.letters.length < 5) S.letters.push(node.letter);
    next();
  }

  /* challenges */
  function renderChallenge() {
    const node = NODES[S.node], ki = leadIdx(), kid = S.kids[ki], c = node.challenge[kid.level] || node.challenge.medium;
    const ss = S.ss; ss.tries = ss.tries || 0; ss.wrong = ss.wrong || [];
    const mult = node.challengeMult || 1, name = kidName(kid, ki);
    let body = '';
    if (c.type === 'quiz') {
      body = `<div class="options">${c.options.map((o, i) => {
        const cls = ss.done && i === c.answer ? 'right' : ss.wrong.includes(i) ? 'wrong' : '';
        return `<button class="opt ${cls}" type="button" data-act="opt" data-i="${i}" ${ss.done || ss.wrong.includes(i) ? 'disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>`;
    } else if (!ss.done) {
      body = `<div class="answer-row"><input class="field" id="ans" data-enter="ansGo" ${c.type === 'number' ? 'inputmode="numeric" pattern="[0-9]*"' : 'autocapitalize="off" autocomplete="off" spellcheck="false"'} placeholder="${c.type === 'number' ? 'Type a number' : 'Type your answer'}" aria-label="Your answer">
        <button class="btn primary small" id="ansGo" type="button" data-act="check">Check</button></div>`;
    }
    const triesLeft = 3 - ss.tries;
    const tries = ss.done ? '' : `<div class="tries">${[0, 1, 2].map(i => `<i class="${i < ss.tries ? 'used' : ''}"></i>`).join('')}<span>${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left</span></div>`;
    let fb = '';
    if (ss.done) {
      fb = `<div class="feedback ${ss.solved ? 'good' : 'bad'}">${ss.solved ? 'Correct! +' + ss.pts + ' points' : 'Out of tries. +' + ss.pts + ' points for bravery.'}
        <span class="more">${esc(c.explain || '')}</span>${!ss.solved && c.type !== 'quiz' ? `<span class="more">The answer was: <b>${esc(c.type === 'number' ? c.answer : c.accept[0])}</b></span>` : ''}</div>`;
    } else if (ss.tries > 0) {
      fb = `<div class="feedback bad" id="fb">Not quite! ${ss.tries === 1 ? 'Now the whole team can help.' : 'Last try. Put your heads together!'}</div>`;
    }
    const hint = ss.hint ? `<div class="card flat"><span class="eyebrow">Hint</span><p>${esc(c.hint)}</p></div>`
      : ss.done ? '' : '<div><button class="btn ghost small" type="button" data-act="hint">Get a hint (costs 20 points)</button></div>';
    const html = `<div class="wrap">
      <div class="stack" style="gap:6px"><div class="qhead"><span class="eyebrow">${esc(node.place)}</span></div>
        <h1 class="title sm">${esc(name)}'s challenge</h1>
        <div class="qhead"><span class="chip muted">${LEVEL_NAME[kid.level]}</span><span class="chip muted">${esc(c.kind)}</span>${mult > 1 ? `<span class="chip ${PATH_OF[S.node]}">Points x${mult}</span>` : ''}</div></div>
      ${!ss.done && ss.tries === 0 ? `<p class="lede">First try is ${esc(name)}'s alone. If it's wrong, the whole team can help.</p>` : ''}
      <div class="card" id="qcard"><p class="question">${esc(fill(c.q))}</p>${c.visual ? `<div class="visual">${esc(c.visual)}</div>` : ''}${body}${tries}</div>
      ${fb}${hint}
    </div>`;
    const barHtml = ss.done ? primary2('Continue', 'next')
      : (ss.tries === 0 && S.kids.length > 1 ? '<button class="btn ghost" type="button" data-act="swapLead">Swap to the next Ranger</button>' : '');
    paint(html, barHtml, ss.tries > 0 || ss.done);
    UI.readLines = [['n', c.q]].concat(c.type === 'quiz' ? c.options.map(o => ['n', o]) : []);
    speakOnce(S.node + ':challenge:' + S.turn, UI.readLines);
    const inp = $('#ans'); if (inp && ss.tries > 0) inp.focus({ preventScroll: true });
  }
  function resolveChallenge(correct) {
    const node = NODES[S.node], ki = leadIdx(), kid = S.kids[ki], c = node.challenge[kid.level] || node.challenge.medium;
    const ss = S.ss, mult = node.challengeMult || 1;
    if (correct) {
      const base = [100, 60, 30][ss.tries] - (ss.hint ? 20 : 0);
      ss.pts = Math.round(Math.max(10, base) * mult); ss.solved = true; ss.done = true;
      S.kidStats[ki].kinds[c.kind] = (S.kidStats[ki].kinds[c.kind] || 0) + 1;
      award(kidName(kid, ki) + ': ' + c.kind, ss.pts, 100 * mult);
      sfx.good(); celebrate();
    } else {
      ss.tries++;
      sfx.bad();
      if (ss.tries >= 3) { ss.done = true; ss.solved = false; ss.pts = Math.round(10 * mult); award(kidName(kid, ki) + ': ' + c.kind, ss.pts, 100 * mult); }
    }
    saveState(); renderChallenge();
    if (!correct) { const q = $('#qcard'); if (q) { q.classList.add('shake'); } }
  }
  ACT.opt = el => {
    const node = NODES[S.node], kid = S.kids[leadIdx()], c = node.challenge[kid.level] || node.challenge.medium;
    const i = +el.dataset.i;
    if (i !== c.answer) S.ss.wrong = (S.ss.wrong || []).concat(i);
    resolveChallenge(i === c.answer);
  };
  ACT.check = () => {
    const node = NODES[S.node], kid = S.kids[leadIdx()], c = node.challenge[kid.level] || node.challenge.medium;
    const v = ($('#ans') || {}).value || '';
    if (!v.trim()) { const q = $('#qcard'); if (q) { q.classList.remove('shake'); void q.offsetWidth; q.classList.add('shake'); } return; }
    const ok = c.type === 'number' ? parseFloat(v.replace(/[^0-9.\-]/g, '')) === +c.answer : matches(v, c.accept);
    resolveChallenge(ok);
  };
  ACT.hint = () => { S.ss.hint = true; saveState(); renderChallenge(); };
  ACT.swapLead = () => { S.turn++; S.ss = {}; saveState(); UI.spokenKey = ''; renderChallenge(); };

  /* bonus field missions */
  function fieldFor(id) {
    const p = pinOf(id);
    if (p && p.cq && p.ca) return { type: 'custom', title: "Commander's question", text: p.cq, accept: [p.ca] };
    return NODES[id].field;
  }
  function renderField() {
    const node = NODES[S.node], f = fieldFor(S.node), ss = S.ss, mult = node.fieldMult || 1;
    const max = Math.round((f.type === 'custom' ? 100 : 75) * mult);
    let ui = '';
    if (ss.done) {
      ui = `<div class="feedback good">${esc(ss.msg || 'Mission complete!')} +${ss.pts} points</div>`;
      if (ss.photo) { const src = getPhoto(ss.photo); if (src) ui += `<div class="photo-prev"><img src="${src}" alt="Your photo for ${esc(f.title)}"></div>`; }
    } else {
      switch (f.type) {
        case 'photo':
          ui = `<div class="row"><button class="btn primary" type="button" data-act="photo">Take a photo</button></div>
            <button class="btn ghost small" type="button" data-act="fieldDone" data-msg="Found it!">We found it, no photo</button>`; break;
        case 'number':
          ui = `<div class="answer-row"><input class="field" id="fans" inputmode="numeric" pattern="[0-9]*" data-enter="fGo" placeholder="Type the number" aria-label="Number"><button class="btn primary small" id="fGo" type="button" data-act="fieldNumber">Check</button></div>
            ${ss.err ? `<div class="feedback bad">${esc(ss.err)}</div>` : ''}`; break;
        case 'text':
          ui = `<div class="answer-row"><input class="field" id="fans" data-enter="fGo" autocomplete="off" placeholder="Street name" aria-label="Street name"><button class="btn primary small" id="fGo" type="button" data-act="fieldText">Send to Zib</button></div>`; break;
        case 'checklist': {
          const t = ss.ticks || [];
          ui = `<div class="ticks">${f.items.map((it, i) => `<button class="tick ${t.includes(i) ? 'on' : ''}" type="button" data-act="tick" data-i="${i}" aria-pressed="${t.includes(i)}">${esc(it)}</button>`).join('')}</div>`; break;
        }
        case 'timer': {
          const left = ss.left == null ? f.seconds : ss.left;
          if (ss.timer === 'ask') {
            ui = `<p class="question">${esc(f.ask)}</p><div class="answer-row"><input class="field" id="fans" inputmode="numeric" pattern="[0-9]*" data-enter="fGo" placeholder="Number of sounds" aria-label="Number of sounds"><button class="btn primary small" id="fGo" type="button" data-act="fieldSounds">Tell Gloop</button></div>`;
          } else {
            const frac = left / f.seconds, C = 2 * Math.PI * 80;
            ui = `<div class="timer"><svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="80" fill="none" style="stroke:var(--line)" stroke-width="12"/><circle id="tRing" cx="90" cy="90" r="80" fill="none" style="stroke:var(--shard)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg><b id="tNum">${left}</b></div>
              ${ss.timer === 'running' ? '' : '<div class="row"><button class="btn primary" type="button" data-act="timerStart">Start the freeze</button></div>'}`;
          }
          break;
        }
        case 'honor':
          ui = '<div class="row"><button class="btn primary" type="button" data-act="fieldDone" data-msg="So kind!">Commander: done!</button></div>'; break;
        case 'custom': {
          const tl = 3 - (ss.tries || 0);
          ui = `<div class="answer-row"><input class="field" id="fans" data-enter="fGo" autocomplete="off" placeholder="Your answer" aria-label="Your answer"><button class="btn primary small" id="fGo" type="button" data-act="fieldCustom">Check</button></div>
            ${ss.tries ? `<div class="feedback bad">Not quite! ${tl} ${tl === 1 ? 'try' : 'tries'} left. Look around carefully.</div>` : ''}`; break;
        }
      }
    }
    const intro = f.intro ? linesHTML([f.intro]) : '';
    const html = `<div class="wrap">
      <div class="stack" style="gap:6px"><div class="qhead"><span class="eyebrow">Bonus mission, whole team</span>${mult > 1 ? `<span class="chip ${PATH_OF[S.node]}">Points x${mult}</span>` : ''}</div>
      <h1 class="title sm">${esc(f.title)}</h1></div>
      ${intro}
      <div class="card" id="fcard"><p>${esc(f.text)}</p>${ui}</div>
      <p class="lede" style="font-size:var(--step--1)">Only look from the pavement or path. Never go into roads or gardens. Worth up to ${max} points.</p>
    </div>`;
    let barHtml;
    if (ss.done) barHtml = primary2('Continue', 'next');
    else if (f.type === 'checklist') barHtml = `<button class="btn ghost" type="button" data-act="skipField">Skip</button><button class="btn primary" type="button" data-act="ticksDone" ${(ss.ticks || []).length ? '' : 'disabled'}>Done</button>`;
    else barHtml = '<button class="btn ghost" type="button" data-act="skipField">Skip this bonus mission</button>';
    paint(html, barHtml, true);
    UI.readLines = (f.intro ? [f.intro] : []).concat([['n', f.text]]);
    speakOnce(S.node + ':field', UI.readLines);
    if (f.type === 'timer' && ss.timer === 'running') runTimer(f);
  }
  function fieldAward(msg, frac) {
    const node = NODES[S.node], f = fieldFor(S.node), mult = node.fieldMult || 1;
    const max = (f.type === 'custom' ? 100 : 75) * mult;
    S.ss.pts = Math.round(max * (frac == null ? 1 : frac)); S.ss.done = true; S.ss.msg = msg;
    award('Bonus: ' + f.title, S.ss.pts, max);
    sfx.good(); celebrate(); renderField();
  }
  ACT.fieldDone = el => fieldAward(el.dataset.msg || 'Mission complete!');
  ACT.skipField = () => next();
  ACT.photo = () => { const inp = $('#photoInput'); inp.value = ''; inp.click(); };
  $('#photoInput').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file || !S) return;
    shrinkImage(file, 720).then(url => {
      const f = fieldFor(S.node);
      storePhoto(url, f.title + ', ' + NODES[S.node].place);
      S.ss.photo = S.photos[S.photos.length - 1].key;
      fieldAward('Great photo! Added to the mission log.');
    }).catch(() => fieldAward('Found it!'));
  });
  function shrinkImage(file, maxSide) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        try { resolve(c.toDataURL('image/jpeg', 0.68)); } catch (err) { reject(err); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }
  ACT.fieldNumber = () => {
    const f = fieldFor(S.node), v = parseInt(($('#fans') || {}).value, 10);
    if (!isFinite(v) || v <= 0) { S.ss.err = 'Type the number you found.'; return renderField(); }
    if (f.validate === 'even' && v % 2 !== 0) { S.ss.err = f.fail; sfx.bad(); return renderField(); }
    fieldAward(v + ' is perfect. Signal boosted!');
  };
  ACT.fieldText = () => {
    const v = (($('#fans') || {}).value || '').trim();
    const letters = (v.match(/[a-z]/gi) || []).length;
    if (!letters) { const c = $('#fcard'); if (c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); } return; }
    fieldAward(`${v}: that's ${letters} letters of rocket fuel!`);
  };
  ACT.tick = el => {
    const i = +el.dataset.i, t = S.ss.ticks || [];
    S.ss.ticks = t.includes(i) ? t.filter(x => x !== i) : t.concat(i);
    if (!t.includes(i)) sfx.tick();
    saveState(); renderField();
  };
  ACT.ticksDone = () => {
    const f = fieldFor(S.node), n = (S.ss.ticks || []).length;
    fieldAward(n === f.items.length ? 'Every colour found!' : `${n} of ${f.items.length} colours found.`, n / f.items.length);
  };
  ACT.timerStart = () => { S.ss.timer = 'running'; S.ss.left = fieldFor(S.node).seconds; renderField(); };
  function runTimer(f) {
    const C = 2 * Math.PI * 80;
    const iv = setInterval(() => {
      S.ss.left--;
      const n = $('#tNum'), r = $('#tRing');
      if (n) n.textContent = Math.max(0, S.ss.left);
      if (r) r.setAttribute('stroke-dashoffset', C * (1 - Math.max(0, S.ss.left) / f.seconds));
      if (S.ss.left > 0) sfx.tick();
      if (S.ss.left <= 0) { clearInterval(iv); S.ss.timer = 'ask'; sfx.good(); renderField(); }
    }, 1000);
    cleanup.push(() => clearInterval(iv));
  }
  ACT.fieldSounds = () => {
    const v = parseInt(($('#fans') || {}).value, 10);
    if (!isFinite(v) || v < 0) return;
    fieldAward(v === 0 ? 'Total silence. Gloop is amazed!' : `${v} sounds! Gloop cannot believe you stood so still.`);
  };
  ACT.fieldCustom = () => {
    const f = fieldFor(S.node), v = ($('#fans') || {}).value || '';
    if (!v.trim()) return;
    if (matches(v, f.accept)) {
      const frac = [1, 0.6, 0.3][S.ss.tries || 0];
      return fieldAward('Correct! Sharp eyes, Rangers.', frac);
    }
    S.ss.tries = (S.ss.tries || 0) + 1;
    sfx.bad();
    if (S.ss.tries >= 3) return fieldAward(`The answer was "${f.accept[0]}". Good try!`, 0.1);
    saveState(); renderField();
  };

  /* outro and forks */
  function renderOutro() {
    const node = NODES[S.node];
    if (!node.choice) {
      return storyStep('Signal found', resolveLines(node.outro), `<button class="btn primary" type="button" data-act="go" data-to="${node.next}">Start walking</button>`);
    }
    const ch = node.choice;
    if (S.ss.picked) {
      const opt = ch.options.find(o => o.key === S.ss.picked);
      S.ss.k = opt.key;
      return storyStep(opt.title, resolveLines(opt.sendoff), `<button class="btn primary" type="button" data-act="go" data-to="${opt.to}">Start walking</button>`);
    }
    const lines = resolveLines(node.outro);
    const cards = `<div class="stack"><p class="question">${esc(ch.prompt)}</p><div class="paths">${ch.options.map(o => `
      <button class="path" type="button" data-act="pick" data-key="${o.key}" style="--pc:var(--${o.key})">
        <span class="glyph">${PATH_GLYPH[o.key]}</span><span><b>${esc(o.title)}</b><span>${esc(o.desc)}</span></span></button>`).join('')}</div></div>`;
    storyStep('Two signals', lines, '', cards);
  }
  const PATH_GLYPH = {
    glow: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.9L22 9.3l-5.8 4.6L18.2 21 12 17l-6.2 4 2-7.1L2 9.3l7.4-.4z"/></svg>',
    slime: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c3 4 6 7 6 10.5A6 6 0 0 1 6 13.5C6 10 9 7 12 3z"/></svg>',
    comet: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="15.5" cy="8.5" r="5"/><path d="M11.5 12.5 4 20 M10 9.5 3 13 M14.5 14 11 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 2.5A9.5 9.5 0 1 0 21.5 17 7.6 7.6 0 0 1 15.5 2.5z"/></svg>'
  };
  ACT.pick = el => {
    const node = NODES[S.node];
    S.ss.picked = el.dataset.key;
    S.choices[node.choice.fork] = el.dataset.key;
    saveState(); sfx.good(); renderOutro();
  };

  /* launch code */
  function renderCode() {
    const node = NODES[S.node], code = ST.launchCode, ss = S.ss;
    ss.pick = ss.pick || []; ss.tries = ss.tries || 0;
    const letters = S.letters.length === code.length ? S.letters : code.split('').reverse();
    const showHint = ss.hint || ss.tries >= 3;
    const html = `<div class="wrap">${placeHead('The Star Engine', 'Launch code')}
      <div class="card" id="ccard"><p class="question">${esc(fill(node.code.q).replace(/\{letters\}/g, letters.join(' ')))}</p>
        <div class="slots" aria-live="polite">${code.split('').map((_, i) => `<span>${esc(ss.done ? code[i] : (ss.pick[i] != null ? letters[ss.pick[i]] : ''))}</span>`).join('')}</div>
        ${ss.done ? '' : `<div class="tiles">${letters.map((l, i) => `<button class="tile ${ss.pick.includes(i) ? 'used' : ''}" type="button" data-act="tile" data-i="${i}" ${ss.pick.includes(i) ? 'disabled' : ''} aria-label="Letter ${esc(l)}">${esc(l)}</button>`).join('')}</div>
        <div class="row" style="justify-content:center"><button class="btn secondary small" type="button" data-act="codeClear">Clear</button></div>`}
      </div>
      ${ss.done ? `<div class="feedback good">Launch code accepted! +${ss.pts} points</div>` : ss.tries ? '<div class="feedback bad">The Star Engine coughed. Try a different order!</div>' : ''}
      ${!ss.done && showHint ? `<div class="card flat"><span class="eyebrow">Hint</span><p>${esc(node.code.hint)}</p></div>` : ''}
      ${!ss.done && !showHint ? '<div><button class="btn ghost small" type="button" data-act="codeHint">Get a hint (costs 20 points)</button></div>' : ''}
      <p class="lede">The whole team can work on this one together.</p>
    </div>`;
    paint(html, ss.done ? primary2('Launch the Pebble!', 'next') : '', true);
    UI.readLines = [['n', fill(node.code.q)]];
    speakOnce(S.node + ':code', UI.readLines);
  }
  ACT.tile = el => {
    const ss = S.ss, code = ST.launchCode, letters = S.letters.length === code.length ? S.letters : code.split('').reverse();
    ss.pick.push(+el.dataset.i); sfx.tick();
    if (ss.pick.length === code.length) {
      const word = ss.pick.map(i => letters[i]).join('');
      if (word === code) {
        ss.pts = Math.max(30, [150, 100, 70][Math.min(ss.tries, 2)] - (ss.hint ? 20 : 0));
        ss.done = true; award('Launch code', ss.pts, 150); sfx.caught(); celebrate();
      } else { ss.tries++; ss.pick = []; sfx.bad(); }
    }
    saveState(); renderCode();
    if (!ss.done && ss.pick.length === 0 && ss.tries) { const c = $('#ccard'); if (c) c.classList.add('shake'); }
  };
  ACT.codeClear = () => { S.ss.pick = []; saveState(); renderCode(); };
  ACT.codeHint = () => { S.ss.hint = true; saveState(); renderCode(); };

  /* ---------- travel ---------- */
  const TR = { ref: null, streak: 0, near: false, map: null, me: null, line: null, raf: 0 };
  function renderTravel() {
    const to = S.travelTo, node = NODES[to], pin = pinOf(to) || {};
    const gps = gpsMode() && hasLL(pin);
    const path = PATH_OF[to];
    const clue = pin.hint ? `<div class="card hint-card"><span class="eyebrow">Commander's clue</span><p class="q">${esc(pin.hint)}</p></div>` : '';
    const eyes = `<div class="eyesup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><span>Eyes up while walking. Stop at every kerb and cross with the Commander.</span></div>`;
    let body;
    if (gps) {
      body = `<div class="card"><div class="dial-wrap">
          <div class="dial"><svg viewBox="0 0 140 140" aria-hidden="true">
            <circle cx="70" cy="70" r="64" style="fill:var(--surface-2);stroke:var(--line)" stroke-width="3"/>
            <g id="tRose"><text x="70" y="22" text-anchor="middle" style="fill:var(--muted);font:700 13px var(--font-hud)">N</text></g>
            <g class="arrow" id="tArrow"><path d="M70 18 L92 88 L70 76 L48 88 Z" style="fill:var(--signal)"/><circle cx="70" cy="70" r="6" style="fill:var(--ink)"/></g>
          </svg></div>
          <div class="readout"><b id="tDist">--</b><div class="sub" id="tSub">Waiting for GPS...</div>
            <div class="bars" id="tBars" aria-hidden="true">${[10, 14, 18, 22, 26].map(h => `<i style="height:${h}px"></i>`).join('')}</div></div>
        </div>
        <div class="trend" id="tTrend" aria-live="polite"></div>
        <div class="row" style="align-items:center;gap:8px"><span class="chip muted" id="tAcc">GPS: searching</span><span class="chip muted" id="tDir" hidden></span></div>
      </div>
      <div class="minimap" id="tMap" hidden></div>`;
    } else {
      body = `<div class="card"><span class="eyebrow">${gpsMode() ? 'No map pin for this stop' : 'Practice mode'}</span>
        <p class="question">${gpsMode() ? 'The Commander knows the way. Follow them!' : 'Walk to another room, the garden or the end of the hall. Then the Commander taps "We\'re here".'}</p></div>`;
    }
    const html = `<div class="wrap">${placeHead('Next signal', node.place, path)}${clue}${body}${eyes}</div>`;
    const barHtml = gps
      ? '<button class="btn secondary" type="button" data-act="toggleMap">Show map</button><button class="btn secondary" type="button" data-act="here" data-confirm="Tap again to confirm">We\'re here</button>'
      : '<button class="btn primary" type="button" data-act="here">We\'re here!</button>';
    paint(html, barHtml);
    UI.readLines = null; stopSpeech();
    if (gps) {
      updateTravel();
      const loop = () => { rotateArrow(); TR.raf = requestAnimationFrame(loop); };
      TR.raf = requestAnimationFrame(loop);
      cleanup.push(() => { cancelAnimationFrame(TR.raf); if (TR.map) { TR.map.remove(); TR.map = null; } });
    }
  }
  ACT.here = () => arrive();
  ACT.toggleMap = el => {
    const m = $('#tMap'); if (!m) return;
    m.hidden = !m.hidden; el.textContent = m.hidden ? 'Show map' : 'Hide map';
    if (!m.hidden) initMiniMap(); else if (TR.map) { TR.map.remove(); TR.map = null; }
  };
  function travelTarget() { return S && S.travelTo ? pinOf(S.travelTo) : null; }
  function onTravelFix() {
    const pin = travelTarget(), fix = GEO.fix;
    if (!gpsMode() || !hasLL(pin) || !fix) return;
    if (fix.acc <= 60) {
      const d = hav(fix, pin), thr = setup.radius + Math.min(fix.acc, 30) * 0.5;
      TR.streak = d <= thr ? TR.streak + 1 : 0;
      if (TR.streak >= 2 || d <= setup.radius * 0.5) { arrive(); return; }
    }
    updateTravel();
  }
  let travelHeading = null;
  function updateTravel() {
    const pin = travelTarget(), fix = GEO.fix;
    const dEl = $('#tDist'); if (!dEl) return;
    const sub = $('#tSub'), acc = $('#tAcc'), trend = $('#tTrend'), dir = $('#tDir');
    if (!fix) {
      sub.textContent = GEO.error === 1 ? 'Location is blocked. The Commander can tap "We\'re here".' : 'Waiting for GPS...';
      acc.textContent = GEO.error === 1 ? 'GPS: blocked' : 'GPS: searching';
      return;
    }
    const d = hav(fix, pin), b = bearing(fix, pin);
    dEl.textContent = fmtDist(d);
    sub.textContent = d < 40 ? 'Very close! Look around.' : fmtMins(d);
    acc.textContent = 'GPS: ' + (fix.acc <= 15 ? 'strong' : fix.acc <= 35 ? 'good' : 'weak') + ', ±' + Math.round(fix.acc) + ' m';
    acc.className = 'chip ' + (fix.acc <= 35 ? 'good' : 'warn');
    const lvl = d < 40 ? 5 : d < 100 ? 4 : d < 200 ? 3 : d < 350 ? 2 : 1;
    $$('#tBars i').forEach((el, i) => el.classList.toggle('on', i < lvl));
    if (TR.ref == null) TR.ref = d;
    if (d < 40) { trend.textContent = 'The signal is huge!'; trend.className = 'trend warm'; if (!TR.near) { TR.near = true; buzz([60, 60, 60]); } }
    else if (d < TR.ref - 15) { trend.textContent = 'Getting warmer!'; trend.className = 'trend warm'; TR.ref = d; }
    else if (d > TR.ref + 20) { trend.textContent = 'Getting colder...'; trend.className = 'trend cold'; TR.ref = d; }
    TR.bearing = b;
    dir.hidden = false; dir.textContent = 'Head ' + compass8(b);
    if (TR.map && TR.me) {
      TR.me.setLatLng([fix.lat, fix.lng]);
      TR.line.setLatLngs([[fix.lat, fix.lng], [pin.lat, pin.lng]]);
    }
  }
  function rotateArrow() {
    const a = $('#tArrow'), rose = $('#tRose');
    if (!a || TR.bearing == null) return;
    let h = absHeading();
    const fix = GEO.fix;
    if (h == null && fix && fix.speed > 0.6 && fix.heading != null && isFinite(fix.heading)) h = fix.heading;
    if (h == null) { // no compass: north-up dial
      a.style.transform = `rotate(${TR.bearing}deg)`; rose.style.transform = ''; return;
    }
    travelHeading = smooth(travelHeading, h, 0.2);
    a.style.transform = `rotate(${(TR.bearing - travelHeading + 360) % 360}deg)`;
    rose.style.transform = `rotate(${-travelHeading}deg)`; rose.style.transformOrigin = '70px 70px';
  }
  function initMiniMap() {
    const pin = travelTarget();
    if (!window.L || !hasLL(pin)) { $('#tMap').innerHTML = '<p class="lede" style="padding:12px">The map could not load. Check your internet connection.</p>'; return; }
    const map = L.map('tMap', { zoomControl: false, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    const col = cssVar('--signal') || '#ff6a2b';
    L.marker([pin.lat, pin.lng], { icon: L.divIcon({ className: '', html: `<div class="marker-pin" style="background:${col}">${PIN_NUM[S.travelTo]}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(map);
    const fix = GEO.fix || pin;
    TR.me = L.marker([fix.lat, fix.lng], { icon: L.divIcon({ className: '', html: '<div class="marker-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(map);
    TR.line = L.polyline([[fix.lat, fix.lng], [pin.lat, pin.lng]], { color: col, weight: 4, dashArray: '6 8' }).addTo(map);
    map.fitBounds(L.latLngBounds([[fix.lat, fix.lng], [pin.lat, pin.lng]]).pad(0.4), { maxZoom: 18 });
    TR.map = map;
    setTimeout(() => map.invalidateSize(), 50);
  }

  /* ---------- AR scanner ---------- */
  const AR = { on: false };
  const scanEl = $('#scanner'), scanCv = $('#scanCanvas'), scanVid = $('#scanVideo');
  const sky = Array.from({ length: 160 }, () => ({ az: Math.random() * 360, el: Math.random() * 120 - 50, r: Math.random() * 1.6 + 0.4 }));
  function openScanner(opts) {
    enableMotion(); // must be first: iOS needs this inside the tap
    stopSpeech();
    Object.assign(AR, { on: true, opts, caught: false, caughtAt: 0, t0: performance.now(), target: null, virtual: false, vHead: 0,
      parts: [], lastPing: 0, hit: null, down: null, stream: null, cam: false, skipShown: false, visibleOnce: false });
    scanEl.hidden = false; scanVid.hidden = true;
    $('#scanBottom').innerHTML = '';
    setScanMsg('Scanner on', 'Turn slowly all the way round.');
    sizeScanner();
    startScanCamera();
    AR.raf = requestAnimationFrame(scanFrame);
  }
  function closeScanner() {
    AR.on = false;
    cancelAnimationFrame(AR.raf);
    if (AR.stream) AR.stream.getTracks().forEach(t => t.stop());
    AR.stream = null; scanVid.srcObject = null;
    scanEl.hidden = true;
  }
  function startScanCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(st => {
        if (!AR.on) { st.getTracks().forEach(t => t.stop()); return; }
        AR.stream = st; scanVid.srcObject = st; scanVid.hidden = false;
        const p = scanVid.play(); if (p && p.catch) p.catch(() => {});
        AR.cam = true; CAM.state = 'on';
      })
      .catch(e => { CAM.state = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'blocked' : 'none'; });
  }
  function sizeScanner() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    AR.W = window.innerWidth; AR.H = window.innerHeight; AR.dpr = dpr;
    scanCv.width = AR.W * dpr; scanCv.height = AR.H * dpr;
    scanCv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', () => { if (AR.on) sizeScanner(); });
  function setScanMsg(small, big) {
    const key = small + '|' + big; if (AR.msgKey === key) return; AR.msgKey = key;
    $('#scanMsg').innerHTML = `<small>${esc(small)}</small>${esc(big)}`;
  }
  const NOUN = { shard: 'the shard', gloop: 'Captain Gloop', ship: 'the Pebble' };
  function scanFrame(ts) {
    if (!AR.on) return;
    const ctx = scanCv.getContext('2d'), W = AR.W, H = AR.H, now = ts || performance.now(), t = (now - AR.t0) / 1000;
    const sensorLive = ORI.rel != null && now - ORI.at < 1000;
    if (AR.target == null) {
      if (sensorLive) { AR.target = (ORI.rel + 110 + Math.random() * 140) % 360; }
      else if (t > 1.2) { AR.virtual = true; AR.vHead = 0; AR.target = 120 + Math.random() * 120; }
    }
    if (AR.virtual && sensorLive) { // sensor woke up late: switch over, keep the target where it was relative to us
      AR.target = (ORI.rel + angDiff(AR.target, AR.vHead) + 360) % 360; AR.virtual = false;
    }
    const head = AR.virtual ? AR.vHead : (ORI.rel || 0);
    ctx.clearRect(0, 0, W, H);
    const FOV = 56, half = FOV / 2;
    if (!AR.cam) drawSky(ctx, W, H, head, half, t);
    else { ctx.fillStyle = 'rgba(10,40,80,.12)'; ctx.fillRect(0, 0, W, H); }
    drawScanlines(ctx, W, H, t);
    const noun = NOUN[AR.opts.kind] || 'the shard';
    if (AR.target != null) {
      const delta = angDiff(AR.target, head);
      const pitch = !AR.virtual && ORI.beta != null ? clamp(ORI.beta - 90, -50, 50) : 0;
      const vhalf = half * H / W;
      const x = W / 2 + (delta / half) * (W / 2);
      const y = H * 0.46 + clamp(pitch / vhalf, -1, 1) * H * 0.28 + Math.sin(t * 2.2) * 10;
      const size = Math.min(W, H) * (AR.opts.kind === 'ship' ? 0.26 : 0.19);
      const visible = Math.abs(delta) < half + 10;
      const strength = 1 - Math.abs(delta) / 180;
      if (AR.caught) {
        const k = clamp((now - AR.caughtAt) / 900, 0, 1);
        drawTarget(ctx, AR.opts.kind, AR.hit ? AR.hit.x : W / 2, AR.hit ? AR.hit.y - k * H * 0.3 : H / 2, size * (1 + k * 0.6), t, 1 - k);
        if (now - AR.caughtAt > 1150) { const o = AR.opts; closeScanner(); onScanDone(o, false); return; }
      } else if (visible) {
        AR.visibleOnce = true;
        drawTarget(ctx, AR.opts.kind, x, y, size, t, 1);
        AR.hit = { x, y, r: size * 1.05 };
        setScanMsg('Signal locked', 'There it is! Tap ' + noun + '!');
      } else {
        AR.hit = null;
        drawEdgeArrow(ctx, W, H, delta > 0 ? 1 : -1, t);
        setScanMsg('Signal ' + Math.round(strength * 100) + '%', AR.virtual ? 'Drag the screen to look around.' : 'Turn ' + (delta > 0 ? 'right' : 'left') + ' slowly...');
      }
      drawRadar(ctx, W, H, delta, half, t);
      const gap = 160 + Math.abs(delta) * 7;
      if (!AR.caught && now - AR.lastPing > gap) { AR.lastPing = now; sfx.ping(strength); }
    } else {
      setScanMsg('Calibrating', 'Hold the phone up like a window...');
    }
    AR.parts = AR.parts.filter(p => p.life > 0);
    AR.parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.016;
      ctx.globalAlpha = clamp(p.life, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // walking check: the scanner is for standing still
    const stop = $('#scanStop');
    const moving = gpsMode() && GEO.fix && Date.now() - GEO.fix.t < 5000 && GEO.fix.speed > 1.4;
    stop.hidden = !moving;
    if (!AR.skipShown && t > 40 && !AR.caught) {
      AR.skipShown = true;
      $('#scanBottom').innerHTML = '<button class="btn small" type="button" id="scanSkip">Commander: we can\'t find it</button>';
      $('#scanSkip').addEventListener('click', () => { const o = AR.opts; closeScanner(); onScanDone(o, true); });
    }
    AR.raf = requestAnimationFrame(scanFrame);
  }
  scanCv.addEventListener('pointerdown', e => { AR.down = { x: e.clientX, y: e.clientY, h: AR.vHead, moved: false }; unlockAudio(); });
  scanCv.addEventListener('pointermove', e => {
    if (!AR.down) return;
    const dx = e.clientX - AR.down.x;
    if (Math.abs(dx) > 10) AR.down.moved = true;
    if (AR.virtual) AR.vHead = (AR.down.h - dx * 0.35 + 360) % 360;
  });
  scanCv.addEventListener('pointerup', e => {
    const d = AR.down; AR.down = null;
    if (!d || d.moved || AR.caught || !AR.hit || !$('#scanStop').hidden) return;
    if (Math.hypot(e.clientX - AR.hit.x, e.clientY - AR.hit.y) <= AR.hit.r) {
      AR.caught = true; AR.caughtAt = performance.now(); sfx.caught();
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 6;
        AR.parts.push({ x: AR.hit.x, y: AR.hit.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, r: 2 + Math.random() * 3, life: 1 + Math.random() * 0.6, c: ['#39d3e6', '#e9fdff', '#ffc93a', '#ff7a3d'][i % 4] });
      }
      setScanMsg('Got it!', AR.opts.kind === 'gloop' ? 'You caught Gloop!' : AR.opts.kind === 'ship' ? 'You found the Pebble!' : 'Shard collected!');
    } else {
      setScanMsg('Missed', 'So close! Tap right on it.');
    }
  });
  $('#scanClose').addEventListener('click', () => closeScanner());

  function drawSky(ctx, W, H, head, half, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0d2a'); g.addColorStop(0.6, '#1c2160'); g.addColorStop(1, '#2b2f78');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    sky.forEach(s => {
      const d = angDiff(s.az, head); if (Math.abs(d) > half + 5) return;
      const x = W / 2 + d / half * W / 2, y = H * 0.5 - s.el / (half * H / W) * H / 2;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + s.az); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, s.r, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#10123a'; ctx.fillRect(0, H * 0.78, W, H * 0.22);
  }
  function drawScanlines(ctx, W, H, t) {
    ctx.strokeStyle = 'rgba(57,211,230,.14)'; ctx.lineWidth = 1;
    const off = (t * 40) % 24;
    for (let y = off; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // corner brackets
    ctx.strokeStyle = 'rgba(57,211,230,.8)'; ctx.lineWidth = 3;
    const m = 18, L = 34, top = 90, bot = H - 200;
    [[m, top, 1, 1], [W - m, top, -1, 1], [m, bot, 1, -1], [W - m, bot, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
    });
  }
  function drawEdgeArrow(ctx, W, H, dir, t) {
    const x = dir > 0 ? W - 34 : 34, y = H * 0.46, p = 6 * Math.sin(t * 6);
    ctx.save(); ctx.translate(x + dir * p, y); ctx.scale(dir, 1);
    ctx.fillStyle = 'rgba(255,122,61,.95)'; ctx.shadowColor = '#ff7a3d'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, -22); ctx.lineTo(-10, 22); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawRadar(ctx, W, H, delta, half, t) {
    const r = 52, cx = W / 2, cy = H - 120 - r / 2;
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(5,6,22,.55)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(57,211,230,.6)'; ctx.lineWidth = 1.5;
    [r, r * 0.62, r * 0.28].forEach(rr => { ctx.beginPath(); ctx.arc(0, 0, rr, 0, 7); ctx.stroke(); });
    ctx.fillStyle = 'rgba(57,211,230,.18)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, rad(-90 - half), rad(-90 + half)); ctx.closePath(); ctx.fill();
    const sw = (t * 2) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(57,211,230,.9)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sw) * r, Math.sin(sw) * r); ctx.stroke();
    const a = rad(delta - 90), br = r * 0.7;
    ctx.fillStyle = '#ffc93a'; ctx.shadowColor = '#ffc93a'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(Math.cos(a) * br, Math.sin(a) * br, 5 + Math.sin(t * 8), 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawTarget(ctx, kind, x, y, s, t, alpha) {
    ctx.save(); ctx.globalAlpha = clamp(alpha, 0, 1);
    if (kind === 'gloop') drawGloop(ctx, x, y, s, t);
    else if (kind === 'ship') drawShip(ctx, x, y, s, t);
    else drawShard(ctx, x, y, s, t, AR.opts.letter);
    ctx.restore();
  }
  function drawShard(ctx, x, y, s, t, letter) {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(0, 0, s * 0.1, 0, 0, s * 1.7);
    g.addColorStop(0, 'rgba(57,211,230,.6)'); g.addColorStop(1, 'rgba(57,211,230,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 1.7, 0, 7); ctx.fill();
    const w = s * 0.62 * (0.72 + 0.28 * Math.cos(t * 1.6));
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(w, -s * 0.35); ctx.lineTo(w, s * 0.35); ctx.lineTo(0, s); ctx.lineTo(-w, s * 0.35); ctx.lineTo(-w, -s * 0.35); ctx.closePath();
    const lg = ctx.createLinearGradient(-w, -s, w, s); lg.addColorStop(0, '#e9fdff'); lg.addColorStop(0.45, '#39d3e6'); lg.addColorStop(1, '#1a5fd1');
    ctx.fillStyle = lg; ctx.shadowColor = '#39d3e6'; ctx.shadowBlur = 34; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.moveTo(-w, -s * 0.35); ctx.lineTo(0, -s * 0.05); ctx.lineTo(w, -s * 0.35); ctx.stroke();
    if (letter) {
      ctx.fillStyle = '#0d0f2b'; ctx.font = `${Math.round(s * 0.62)}px Bungee, 'Arial Black', sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, 0, s * 0.14);
    } else {
      ctx.fillStyle = 'rgba(13,15,43,.85)'; star(ctx, 0, s * 0.1, s * 0.28, s * 0.12);
    }
    for (let i = 0; i < 6; i++) {
      const a = t * 1.3 + i * 1.05, rr = s * (1.15 + 0.12 * Math.sin(t * 3 + i));
      ctx.fillStyle = 'rgba(233,253,255,.9)'; star(ctx, Math.cos(a) * rr, Math.sin(a) * rr, 5, 2);
    }
    ctx.restore();
  }
  function star(ctx, x, y, R, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function drawGloop(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * Math.PI * 2, wob = 1 + 0.07 * Math.sin(a * 5 + t * 4);
      const rx = s * wob * 1.05, ry = s * wob * (a > 0 && a < Math.PI ? 0.85 : 1.0);
      ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry + s * 0.1);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s * 1.2); g.addColorStop(0, '#d7b2ff'); g.addColorStop(0.5, '#a05ef0'); g.addColorStop(1, '#6a2bb8');
    ctx.fillStyle = g; ctx.shadowColor = '#b57cff'; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;
    // pirate hat
    ctx.fillStyle = '#14163a';
    ctx.beginPath(); ctx.moveTo(-s * 0.75, -s * 0.62); ctx.quadraticCurveTo(0, -s * 1.55, s * 0.75, -s * 0.62); ctx.quadraticCurveTo(0, -s * 0.8, -s * 0.75, -s * 0.62); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -s * 0.98, s * 0.09, 0, 7); ctx.fill();
    // eyes
    const blink = Math.sin(t * 1.7) > 0.97 ? 0.15 : 1;
    [-0.32, 0.32].forEach(ex => {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex * s, -s * 0.12, s * 0.2, s * 0.22 * blink, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#14163a'; ctx.beginPath(); ctx.arc(ex * s + s * 0.05, -s * 0.08, s * 0.09 * blink, 0, 7); ctx.fill();
    });
    ctx.strokeStyle = '#14163a'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, s * 0.22, s * 0.25, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
    if (AR.opts.letter) drawShard(ctx, x + s * 1.05, y + s * 0.35, s * 0.36, t, AR.opts.letter);
  }
  function drawShip(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y);
    const beam = ctx.createLinearGradient(0, 0, 0, s * 1.8); beam.addColorStop(0, 'rgba(255,201,58,.45)'); beam.addColorStop(1, 'rgba(255,201,58,0)');
    ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(-s * 0.35, s * 0.2); ctx.lineTo(s * 0.35, s * 0.2); ctx.lineTo(s * 0.9, s * 1.8); ctx.lineTo(-s * 0.9, s * 1.8); ctx.closePath(); ctx.fill();
    const dome = ctx.createRadialGradient(-s * 0.15, -s * 0.5, s * 0.05, 0, -s * 0.3, s * 0.6); dome.addColorStop(0, '#e9fdff'); dome.addColorStop(1, 'rgba(57,211,230,.55)');
    ctx.fillStyle = dome; ctx.beginPath(); ctx.ellipse(0, -s * 0.18, s * 0.5, s * 0.48, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#3fe0c9'; ctx.beginPath(); ctx.arc(0, -s * 0.3, s * 0.16, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -s * 0.32, s * 0.08, 0, 7); ctx.fill();
    ctx.fillStyle = '#14163a'; ctx.beginPath(); ctx.arc(s * 0.02, -s * 0.31, s * 0.04, 0, 7); ctx.fill();
    const body = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.3); body.addColorStop(0, '#f1f2ff'); body.addColorStop(1, '#7f86c8');
    ctx.fillStyle = body; ctx.shadowColor = '#39d3e6'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 1.1, s * 0.3, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    for (let i = 0; i < 7; i++) {
      const lx = (i - 3) * s * 0.28, on = Math.floor(t * 6 + i) % 3 === 0;
      ctx.fillStyle = on ? '#ffc93a' : '#ff7a3d'; ctx.beginPath(); ctx.arc(lx, s * 0.06, s * 0.06, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- celebration ---------- */
  function celebrate() {
    if (reducedMotion()) return;
    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1500';
    document.body.appendChild(c);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = [cssVar('--signal'), cssVar('--shard'), cssVar('--glow'), cssVar('--moon'), cssVar('--slime')];
    const ps = Array.from({ length: 90 }, (_, i) => ({ x: W / 2, y: H * 0.4, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 3, r: Math.random() * 6 + 3, a: Math.random() * 6, c: cols[i % cols.length] }));
    const t0 = performance.now();
    (function f(now) {
      const k = (now - t0) / 1500;
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.a += 0.2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.max(0, 1 - k); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
      if (k < 1) requestAnimationFrame(f); else c.remove();
    })(t0);
  }

  /* ---------- results ---------- */
  function rankFor(pct) { return ST.ranks.find(r => pct >= r.min) || ST.ranks[ST.ranks.length - 1]; }
  function badgesFor() {
    const b = [];
    b.push({ t: 'Shard Collectors', d: `${S.letters.length} of 5 star shards found`, c: '--shard' });
    if (S.choices.trail === 'glow') b.push({ t: 'Code Crackers', d: 'Followed the Glowing Trail', c: '--glow' });
    if (S.choices.trail === 'slime') b.push({ t: 'Pirate Trackers', d: 'Followed the Slime Trail', c: '--slime' });
    if (S.choices.path === 'comet') b.push({ t: 'Comet Chasers', d: 'Took the Comet Path', c: '--comet' });
    if (S.choices.path === 'moon') b.push({ t: "Gloop's Best Friends", d: 'Helped a lonely pirate', c: '--moon' });
    if (S.safety.total && S.safety.ok === S.safety.total) b.push({ t: 'Safe Walkers', d: 'Walked safely on every leg', c: '--good' });
    else if (S.safety.ok) b.push({ t: 'Careful Crew', d: `Walked safely on ${S.safety.ok} of ${S.safety.total} legs`, c: '--good' });
    if (S.photos.length >= 2) b.push({ t: 'Mission Photographers', d: `${S.photos.length} photos in the log`, c: '--signal' });
    return b;
  }
  function kidAwards() {
    return S.kids.map((k, i) => {
      const kinds = S.kidStats[i] ? S.kidStats[i].kinds : {};
      const top = Object.keys(kinds).sort((a, b) => kinds[b] - kinds[a])[0];
      return { name: kidName(k, i), award: top ? (KIND_AWARD[top] || 'Puzzle Pro') : 'Team Spirit' };
    });
  }
  function durText(ms) {
    const m = Math.round(ms / 60000);
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  }
  function renderResults() {
    const pct = S.max ? S.score / S.max : 0, rank = rankFor(pct), badges = badgesFor(), awards = kidAwards();
    const photos = S.photos.map(p => ({ src: getPhoto(p.key), cap: p.caption })).filter(p => p.src);
    const html = `<div class="wrap">
      <div class="rank"><span class="eyebrow">Mission complete</span><h1 class="title">${esc(rank.title)}</h1>
        <div class="big">${S.score.toLocaleString('en-GB')}</div><span class="lede">points out of ${S.max.toLocaleString('en-GB')}</span>
        <p class="lede">${esc(rank.line)}</p></div>
      <div class="stats">
        <div class="stat"><small>Star shards</small><b>${S.letters.length} / 5</b></div>
        <div class="stat"><small>Time</small><b>${durText((S.endedAt || Date.now()) - S.startedAt)}</b></div>
        ${S.walked > 50 ? `<div class="stat"><small>Walked</small><b>${(S.walked / 1000).toFixed(2)} km</b></div>` : ''}
        <div class="stat"><small>Safe legs</small><b>${S.safety.ok} / ${S.safety.total}</b></div>
      </div>
      <section class="stack"><h2 class="title sm">Rangers</h2><div class="badges">${awards.map(a => `<div class="badge" style="--bc:var(--shard)"><span class="medal">${esc(a.name[0] || 'R')}</span><div><b>${esc(a.name)}</b><span>${esc(a.award)}</span></div></div>`).join('')}</div></section>
      <section class="stack"><h2 class="title sm">Badges</h2><div class="badges">${badges.map(b => `<div class="badge" style="--bc:var(${b.c})"><span class="medal">${esc(b.t[0])}</span><div><b>${esc(b.t)}</b><span>${esc(b.d)}</span></div></div>`).join('')}</div></section>
      ${photos.length ? `<section class="stack"><h2 class="title sm">Mission log</h2><div class="album">${photos.map(p => `<figure><img src="${p.src}" alt="${esc(p.cap)}"><figcaption>${esc(p.cap)}</figcaption></figure>`).join('')}</div></section>` : ''}
      <section class="stack cert"><h2 class="title sm">Certificate</h2><img id="certImg" alt="Star Ranger certificate" hidden><p class="lede" id="certNote">Drawing your certificate...</p>
        <div class="row"><a class="btn secondary small" id="certSave" download="star-ranger-certificate.png" hidden>Save certificate</a></div></section>
      <details><summary>Score breakdown</summary><table class="breakdown">${S.log.map(l => `<tr><td>${esc(l.label)}</td><td>${l.pts} / ${l.max}</td></tr>`).join('')}</table></details>
    </div>`;
    paint(html, '<button class="btn secondary" type="button" data-act="toTitle">Home</button><button class="btn primary" type="button" data-act="newMission">Play again</button>');
    UI.readLines = null;
    makeCertificate(rank, badges).then(url => {
      const img = $('#certImg'), a = $('#certSave'), n = $('#certNote');
      if (!img) return;
      img.src = url; img.hidden = false; a.href = url; a.hidden = false;
      n.textContent = 'Press and hold the picture to save it to your photos.';
    }).catch(() => { const n = $('#certNote'); if (n) n.textContent = ''; });
  }
  ACT.toTitle = () => { UI.screen = 'title'; render(); };
  async function makeCertificate(rank, badges) {
    try { await document.fonts.ready; } catch (e) { /* ignore */ }
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d0f2b'); g.addColorStop(1, '#262b74');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 220; i++) { x.globalAlpha = Math.random() * 0.8 + 0.2; x.fillStyle = '#fff'; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.3, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    x.strokeStyle = '#39d3e6'; x.lineWidth = 6; x.strokeRect(40, 40, W - 80, H - 80);
    x.strokeStyle = 'rgba(57,211,230,.4)'; x.lineWidth = 2; x.strokeRect(58, 58, W - 116, H - 116);
    x.textAlign = 'center';
    x.fillStyle = '#39d3e6'; x.font = "700 34px 'Chakra Petch', monospace"; x.fillText('STAR RANGER CERTIFICATE', W / 2, 150);
    x.fillStyle = '#fff'; x.font = "92px Bungee, 'Arial Black', sans-serif"; x.fillText('THE STARFALL', W / 2, 270);
    x.fillStyle = '#ffc93a'; x.fillText('EXPEDITION', W / 2, 370);
    x.fillStyle = '#c6c9f0'; x.font = "italic 38px 'Atkinson Hyperlegible', sans-serif"; x.fillText('awarded to', W / 2, 460);
    x.fillStyle = '#fff'; x.font = "700 60px 'Atkinson Hyperlegible', sans-serif";
    const names = S.kids.map(kidName);
    wrapText(x, joinNames(names), W / 2, 540, W - 200, 72);
    x.fillStyle = '#c6c9f0'; x.font = "38px 'Atkinson Hyperlegible', sans-serif";
    x.fillText('for helping Zib get home to Glimmerwick', W / 2, 700);
    x.fillStyle = '#39d3e6'; x.font = "64px Bungee, 'Arial Black', sans-serif"; x.fillText(rank.title.toUpperCase(), W / 2, 820);
    x.fillStyle = '#fff'; x.font = "700 56px 'Chakra Petch', monospace"; x.fillText(S.score.toLocaleString('en-GB') + ' POINTS', W / 2, 910);
    x.fillStyle = '#c6c9f0'; x.font = "34px 'Atkinson Hyperlegible', sans-serif";
    wrapText(x, badges.map(b => b.t).join('  ·  '), W / 2, 1000, W - 200, 46);
    x.fillStyle = '#c6c9f0'; x.font = "32px 'Atkinson Hyperlegible', sans-serif";
    x.fillText(new Date(S.endedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, 1150);
    x.fillStyle = '#3fe0c9'; x.font = "italic 36px 'Atkinson Hyperlegible', sans-serif"; x.fillText('Signed, Zib. Pilot of the Pebble', W / 2, 1220);
    return c.toDataURL('image/png');
  }
  function wrapText(x, text, cx, y, maxW, lh) {
    const words = String(text).split(' '); let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (x.measureText(test).width > maxW && line) { x.fillText(line, cx, y); y += lh; line = w; } else line = test;
    });
    if (line) x.fillText(line, cx, y);
  }

  /* ---------- Commander menu ---------- */
  function openSheet() {
    const inMission = UI.screen === 'mission' && S && S.phase !== 'done';
    const panel = $('#sheetPanel');
    panel.innerHTML = `<h2 class="title sm" id="sheetTitle">Commander</h2>
      <label class="toggle" for="pSound"><span>Sound effects</span><input type="checkbox" id="pSound" data-chg="pref" data-k="sound" ${prefs.sound ? 'checked' : ''}></label>
      <label class="toggle" for="pVoice"><span>Read the story aloud</span><input type="checkbox" id="pVoice" data-chg="pref" data-k="voice" ${prefs.voice ? 'checked' : ''}></label>
      <label class="toggle" for="pWake"><span>Keep the screen on</span><input type="checkbox" id="pWake" data-chg="pref" data-k="wake" ${prefs.wake ? 'checked' : ''}></label>
      ${inMission ? `<div class="card flat"><span class="eyebrow">Next puzzle</span><p><b>${esc(leadName())}</b> (${LEVEL_NAME[S.kids[leadIdx()].level]})</p>
        <div class="row"><button class="btn secondary small" type="button" data-act="sheetLead">Give it to the next Ranger</button></div></div>
        ${S.phase === 'travel' ? '<button class="btn secondary" type="button" data-act="sheetArrive" data-confirm="Tap again to skip ahead">Skip ahead to this checkpoint</button>' : ''}
        <button class="btn warn" type="button" data-act="sheetEnd" data-confirm="Tap again to end now">End the mission and see the score</button>
        <button class="btn secondary" type="button" data-act="sheetExit">Save and go to the start screen</button>` : ''}
      <button class="btn primary" type="button" data-act="sheetClose">Back to the mission</button>`;
    $('#sheet').hidden = false;
  }
  function closeSheet() { $('#sheet').hidden = true; }
  $('#hudMenu').addEventListener('click', openSheet);
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
  ACT.sheetClose = closeSheet;
  CHG.pref = el => {
    prefs[el.dataset.k] = el.checked; savePrefs();
    if (el.dataset.k === 'voice' && !el.checked) stopSpeech();
    if (el.dataset.k === 'voice' && el.checked && UI.readLines) speakLines(UI.readLines);
    if (el.dataset.k === 'wake') wake(el.checked);
  };
  ACT.sheetLead = () => { S.turn++; saveState(); closeSheet(); if (curStep() === 'challenge') { S.ss = {}; UI.spokenKey = ''; } render(); };
  ACT.sheetArrive = () => { closeSheet(); arrive(); };
  ACT.sheetEnd = () => { closeSheet(); finishMission(); };
  ACT.sheetExit = () => { closeSheet(); stopSpeech(); wake(false); UI.screen = 'title'; render(); };

  /* ---------- grown-up setup ---------- */
  const SM = { map: null, markers: {}, lines: [], me: null, placing: null, waitHere: null };
  function pinColor(id) {
    const p = PATH_OF[id];
    return cssVar(p === 'main' ? '--signal' : '--' + p) || '#ff6a2b';
  }
  function renderSetup() {
    const html = `<div class="wrap">
      <div><div class="eyebrow">For grown-ups</div><h1 class="title sm">Mission setup</h1>
        <p class="lede">Place each checkpoint on a safe spot: a pavement, a path or a park, never in a road or someone's garden. Plan routes with safe places to cross. If you can, walk the route on your own first.</p></div>
      <div class="card flat"><span class="lbl">How will you play?</span>
        <div class="seg" role="group" aria-label="Mode"><button type="button" data-act="mode" data-mode="gps" aria-pressed="${setup.mode === 'gps'}">Real walk with GPS</button><button type="button" data-act="mode" data-mode="practice" aria-pressed="${setup.mode === 'practice'}">Practice at home</button></div>
        <p class="lede" style="font-size:var(--step--1)">${setup.mode === 'gps' ? 'The phone guides the Rangers to each pin and notices when they arrive.' : 'No GPS. The Commander taps "We\'re here" at each stop. Good for previewing the story indoors.'}</p></div>
      <section class="stack">
        <div class="setup-map" id="setupMap"></div>
        <div id="placeBar"></div>
        <div class="row"><button class="btn secondary small" type="button" data-act="centreMe">Centre on me</button>
          <button class="btn secondary small" type="button" data-act="draft" ${PINS.some(p => p.id !== 'base' && hasLL(setup.pins[p.id])) ? 'data-confirm="This moves every pin. Tap again"' : ''}>Draft a 2 km loop from Base Camp</button></div>
        <p class="lede" id="mapMsg" style="font-size:var(--step--1)">Tap "Place on map" on a checkpoint below, then tap the map. Drag pins to fine-tune. A draft loop is only a starting point: drag every pin onto a safe spot you know.</p>
      </section>
      <section class="stack"><h2 class="title sm">Route check</h2><div class="card flat" id="routeCheck"></div></section>
      <section class="stack"><h2 class="title sm">Checkpoints</h2>
        <label class="check" for="finaleBase"><input type="checkbox" id="finaleBase" data-chg="finaleBase" ${setup.finaleAtBase ? 'checked' : ''}><span>Finish back at Base Camp</span></label>
        <div class="stack" id="pinList"></div></section>
      <section class="card flat"><label class="lbl" for="radius">Arrival distance</label>
        <select class="field" id="radius" data-chg="radius">${[15, 20, 25, 35].map(r => `<option value="${r}" ${setup.radius === r ? 'selected' : ''}>${r} m${r === 20 ? ' (recommended)' : r === 35 ? ' (tall buildings or trees)' : ''}</option>`).join('')}</select>
        <p class="lede" style="font-size:var(--step--1)">How close the Rangers need to be before the phone says they've arrived. Use a bigger distance if GPS is jumpy where you live.</p></section>
      <section class="card flat"><b>Commander's safety checklist</b><ul class="bullets">
        <li>Every pin is on a pavement, path or in a park, and both trails are routes you're happy to walk.</li>
        <li>Each leg avoids busy roads, or uses a proper crossing.</li>
        <li>No pin is on private property, near water edges, or by building sites.</li>
        <li>The phone is charged. Bring water, and a coat if it might rain.</li>
        <li>The Rangers know the rules: stay with you, stop at kerbs, scan only when standing still.</li>
      </ul></section>
      <section class="card flat"><b>Copy this route to another phone</b>
        <div class="row"><button class="btn secondary small" type="button" data-act="copyLink">Copy a link to this route</button><button class="btn secondary small" type="button" data-act="copyCode">Copy setup code</button></div>
        <textarea class="field" id="codeBox" readonly hidden aria-label="Setup code"></textarea>
        <label class="lbl" for="importBox">Paste a setup code from another phone</label>
        <textarea class="field" id="importBox" placeholder="SF1:..."></textarea>
        <div class="row"><button class="btn secondary small" type="button" data-act="importCode">Load pasted setup</button></div>
        <p class="lede" id="codeMsg" style="font-size:var(--step--1)"></p></section>
    </div>`;
    paint(html, '<button class="btn primary" type="button" data-act="setupDone">Save and finish</button>', true);
    renderPinList(); renderRouteCheck(); renderPlaceBar();
    initSetupMap();
  }
  function renderPinList() {
    const list = $('#pinList'); if (!list) return;
    list.innerHTML = neededPins().map(p => {
      const pin = setup.pins[p.id], placed = hasLL(pin);
      const path = PATH_OF[p.id];
      let dist = '';
      if (placed) {
        const prev = ST.legs.find(l => l[1] === p.id);
        if (prev && hasLL(pinOf(prev[0]))) dist = `${fmtDist(hav(pinOf(prev[0]), pin) * WALK_FACTOR)} walk from ${ST.pins.find(x => x.id === prev[0]).label}`;
      }
      return `<div class="card pin" id="pin-${p.id}" style="--pc:${pinColor(p.id)}">
        <div class="pin-head"><span class="pin-num">${PIN_NUM[p.id]}</span><div><b>${esc(p.label)}</b><small>${esc(p.where)}</small></div>
          <span class="chip ${placed ? 'good' : 'muted'}">${placed ? 'Placed' : 'Not placed'}</span></div>
        ${dist ? `<small class="lede" style="font-size:var(--step--1)">About ${dist}</small>` : ''}
        <div class="row"><button class="btn secondary small" type="button" data-act="placeMap" data-id="${p.id}">Place on map</button>
          <button class="btn secondary small" type="button" data-act="placeHere" data-id="${p.id}">Use my location</button>
          <button class="btn ghost small" type="button" data-act="pasteLL" data-id="${p.id}">Type coordinates</button></div>
        <div class="answer-row" id="llrow-${p.id}" hidden><input class="field" id="ll-${p.id}" inputmode="decimal" placeholder="51.50135, -0.14189" aria-label="Coordinates" data-enter="llgo-${p.id}">
          <button class="btn secondary small" id="llgo-${p.id}" type="button" data-act="applyLL" data-id="${p.id}">Set</button></div>
        <div><label for="hint-${p.id}">Clue for the Rangers (where to head)</label>
          <input class="field" id="hint-${p.id}" data-inp="pinField" data-id="${p.id}" data-k="hint" maxlength="140" value="${esc(pin.hint)}" placeholder="${p.id === 'finale' ? 'e.g. the big oak tree in the park' : 'e.g. the red postbox by the bakery'}"></div>
        <details ${pin.cq ? 'open' : ''}><summary>Add your own question for this spot</summary>
          <div class="stack" style="margin-top:8px"><div><label for="cq-${p.id}">Question</label><input class="field" id="cq-${p.id}" data-inp="pinField" data-id="${p.id}" data-k="cq" maxlength="200" value="${esc(pin.cq)}" placeholder="e.g. What animal is on the church weathervane?"></div>
          <div><label for="ca-${p.id}">Answer</label><input class="field" id="ca-${p.id}" data-inp="pinField" data-id="${p.id}" data-k="ca" maxlength="60" value="${esc(pin.ca)}" placeholder="e.g. rooster"></div>
          <small class="lede" style="font-size:var(--step--1)">It replaces this stop's bonus mission. Small spelling slips are accepted.</small></div></details>
      </div>`;
    }).join('');
  }
  function renderRouteCheck() {
    const box = $('#routeCheck'); if (!box) return;
    if (!gpsMode()) { box.innerHTML = '<p class="lede">Practice mode does not need pins. You can still place them now, ready for the real walk.</p>'; return; }
    const rows = ST.routes.map(r => {
      const res = routeLength(r.stops);
      if (res.missing.length) return `<tr><td>${esc(r.name)}</td><td>--</td><td><span class="chip muted">${res.missing.length} pin${res.missing.length > 1 ? 's' : ''} missing</span></td></tr>`;
      const km = res.metres / 1000;
      const st = km < 1.4 ? '<span class="chip warn">Short</span>' : km > 2.8 ? '<span class="chip warn">Long</span>' : '<span class="chip good">About right</span>';
      return `<tr><td>${esc(r.name)}</td><td>${km.toFixed(1)} km</td><td>${st}</td></tr>`;
    }).join('');
    let longest = null;
    ST.legs.forEach(([a, b]) => {
      const pa = pinOf(a), pb = pinOf(b);
      if (hasLL(pa) && hasLL(pb)) { const d = hav(pa, pb) * WALK_FACTOR; if (!longest || d > longest.d) longest = { a, b, d }; }
    });
    const name = id => ST.pins.find(p => p.id === id).label;
    const warn = longest && longest.d > 650 ? `<p class="lede" style="font-size:var(--step--1)">The longest leg, ${esc(name(longest.a))} to ${esc(name(longest.b))}, is about ${fmtDist(longest.d)}. Younger Rangers may flag on legs over 600 m. Try moving a pin closer.</p>` : '';
    box.innerHTML = `<div style="overflow-x:auto"><table class="routes">${rows}</table></div>
      <p class="lede" style="font-size:var(--step--1)">Estimates add 30% to the straight-line distance for real streets. Aim for about 2 km.</p>${warn}`;
  }
  function renderPlaceBar() {
    const el = $('#placeBar'); if (!el) return;
    if (SM.placing) {
      el.innerHTML = `<div class="placing"><span>Tap the map to place: ${esc(ST.pins.find(p => p.id === SM.placing).label)}</span><button class="btn small secondary" type="button" data-act="cancelPlace">Cancel</button></div>`;
    } else if (SM.waitHere) {
      const acc = GEO.fix ? Math.round(GEO.fix.acc) + ' m' : 'searching';
      el.innerHTML = `<div class="placing"><span>Getting a good GPS fix for ${esc(ST.pins.find(p => p.id === SM.waitHere).label)} (accuracy: ${acc})</span><button class="btn small secondary" type="button" data-act="cancelPlace">Cancel</button></div>`;
    } else el.innerHTML = '';
  }
  function initSetupMap(tries) {
    const box = $('#setupMap'); if (!box) return;
    if (!window.L) {
      if ((tries || 0) < 10) { const tm = setTimeout(() => initSetupMap((tries || 0) + 1), 500); cleanup.push(() => clearTimeout(tm)); }
      else box.innerHTML = '<p class="lede" style="padding:16px">The map could not load. You can still use "Use my location" or type coordinates.</p>';
      return;
    }
    const map = L.map(box, { zoomControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    SM.map = map; SM.markers = {}; SM.lines = []; SM.me = null;
    map.on('click', e => { if (SM.placing) { const id = SM.placing; SM.placing = null; setPin(id, e.latlng.lat, e.latlng.lng); renderPlaceBar(); } });
    const placed = PINS.map(p => setup.pins[p.id]).filter(hasLL);
    if (placed.length > 1) map.fitBounds(L.latLngBounds(placed.map(p => [p.lat, p.lng])).pad(0.15));
    else if (placed.length === 1) map.setView([placed[0].lat, placed[0].lng], 16);
    else if (GEO.fix) map.setView([GEO.fix.lat, GEO.fix.lng], 16);
    else { map.setView([54.2, -2.5], 5); startGeo(); SM.centreOnFix = true; }
    drawSetupMap();
    cleanup.push(() => { if (SM.map) SM.map.remove(); SM.map = null; SM.placing = null; SM.waitHere = null; });
  }
  function drawSetupMap() {
    if (!SM.map) return;
    const ids = neededPins().map(p => p.id);
    Object.keys(SM.markers).forEach(id => { if (!ids.includes(id) || !hasLL(setup.pins[id])) { SM.map.removeLayer(SM.markers[id]); delete SM.markers[id]; } });
    ids.forEach(id => {
      const pin = setup.pins[id]; if (!hasLL(pin)) return;
      if (SM.markers[id]) { SM.markers[id].setLatLng([pin.lat, pin.lng]); return; }
      const m = L.marker([pin.lat, pin.lng], {
        draggable: true, title: ST.pins.find(p => p.id === id).label,
        icon: L.divIcon({ className: '', html: `<div class="marker-pin" style="background:${pinColor(id)}">${PIN_NUM[id]}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] })
      }).addTo(SM.map);
      m.on('dragend', () => { const ll = m.getLatLng(); setPin(id, ll.lat, ll.lng, true); });
      m.bindTooltip(ST.pins.find(p => p.id === id).label);
      SM.markers[id] = m;
    });
    SM.lines.forEach(l => SM.map.removeLayer(l)); SM.lines = [];
    ST.legs.forEach(([a, b, path]) => {
      const pa = pinOf(a), pb = pinOf(b);
      if (!hasLL(pa) || !hasLL(pb)) return;
      SM.lines.push(L.polyline([[pa.lat, pa.lng], [pb.lat, pb.lng]], { color: path === 'main' ? cssVar('--signal') : cssVar('--' + path), weight: 4, opacity: 0.85, dashArray: path === 'main' ? '6 8' : null }).addTo(SM.map));
    });
  }
  function setPin(id, lat, lng, fromDrag) {
    setup.pins[id].lat = +lat.toFixed(6); setup.pins[id].lng = +lng.toFixed(6);
    saveSetup(true);
    drawSetupMap();
    renderPinList(); renderRouteCheck();
    const card = $('#pin-' + id); if (card && !fromDrag) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function onSetupFix() {
    const fix = GEO.fix;
    if (SM.map) {
      if (!SM.me) SM.me = L.marker([fix.lat, fix.lng], { interactive: false, icon: L.divIcon({ className: '', html: '<div class="marker-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(SM.map);
      else SM.me.setLatLng([fix.lat, fix.lng]);
      if (SM.centreOnFix) { SM.centreOnFix = false; SM.map.setView([fix.lat, fix.lng], 16); }
    }
    if (SM.waitHere) {
      if (fix.acc <= 25 || (SM.waitStart && Date.now() - SM.waitStart > 20000 && fix.acc <= 50)) {
        const id = SM.waitHere; SM.waitHere = null; setPin(id, fix.lat, fix.lng);
        const m = $('#mapMsg'); if (m) m.textContent = `${ST.pins.find(p => p.id === id).label} saved here (accuracy about ${Math.round(fix.acc)} m).`;
      }
      renderPlaceBar();
    }
  }
  ACT.mode = el => { setup.mode = el.dataset.mode; saveSetup(true); renderSetup(); };
  ACT.placeMap = el => {
    SM.placing = el.dataset.id; SM.waitHere = null; renderPlaceBar();
    const m = $('#setupMap'); if (m) m.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  ACT.cancelPlace = () => { SM.placing = null; SM.waitHere = null; renderPlaceBar(); };
  ACT.placeHere = el => {
    SM.placing = null; SM.waitHere = el.dataset.id; SM.waitStart = Date.now();
    startGeo(); renderPlaceBar();
    if (GEO.fix && Date.now() - GEO.fix.t < 5000) onSetupFix();
    const pb = $('#placeBar'); if (pb) pb.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  ACT.pasteLL = el => { const r = $('#llrow-' + el.dataset.id); r.hidden = !r.hidden; if (!r.hidden) $('#ll-' + el.dataset.id).focus(); };
  ACT.applyLL = el => {
    const id = el.dataset.id, v = $('#ll-' + id).value;
    const m = v.match(/(-?\d{1,3}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)/);
    if (!m || Math.abs(+m[1]) > 90 || Math.abs(+m[2]) > 180) { $('#ll-' + id).classList.add('shake'); return; }
    setPin(id, +m[1], +m[2]);
    if (SM.map) SM.map.setView([+m[1], +m[2]], 17);
  };
  ACT.centreMe = () => {
    startGeo();
    if (GEO.fix && SM.map) SM.map.setView([GEO.fix.lat, GEO.fix.lng], 17);
    else { SM.centreOnFix = true; const m = $('#mapMsg'); if (m) m.textContent = 'Finding you... allow location if your phone asks.'; }
  };
  ACT.draft = () => {
    let b = setup.pins.base;
    if (!hasLL(b)) {
      if (GEO.fix) { setup.pins.base.lat = +GEO.fix.lat.toFixed(6); setup.pins.base.lng = +GEO.fix.lng.toFixed(6); b = setup.pins.base; }
      else { const m = $('#mapMsg'); if (m) m.textContent = 'Place Base Camp first (or tap "Centre on me" and wait for GPS), then draft the loop.'; startGeo(); return; }
    }
    const r = 255, mLat = 111320, mLng = 111320 * Math.cos(rad(b.lat));
    const spots = { n1: [55, 1], a2: [105, 0.78], a3: [150, 0.78], b2: [105, 1.22], b3: [150, 1.22], n4: [200, 1], c5: [265, 0.8], d5: [265, 1.2] };
    Object.keys(spots).forEach(id => {
      const [th, rf] = spots[id];
      const e = -r * rf * Math.sin(rad(th)), n = r - r * rf * Math.cos(rad(th));
      setup.pins[id].lat = +(b.lat + n / mLat).toFixed(6); setup.pins[id].lng = +(b.lng + e / mLng).toFixed(6);
    });
    setup.finaleAtBase = true;
    saveSetup(true); renderSetup();
    const m = $('#mapMsg'); if (m) m.textContent = 'Draft loop placed. Now drag every pin onto a safe spot you know: a corner, a park gate, a bench.';
    if (SM.map) SM.map.fitBounds(L.latLngBounds(neededPins().map(p => [setup.pins[p.id].lat, setup.pins[p.id].lng])).pad(0.15));
  };
  CHG.pinField = el => { setup.pins[el.dataset.id][el.dataset.k] = el.value; saveSetup(); };
  CHG.finaleBase = el => { setup.finaleAtBase = el.checked; saveSetup(true); renderPinList(); renderRouteCheck(); drawSetupMap(); };
  CHG.radius = el => { setup.radius = +el.value; saveSetup(true); };
  function setupCode() { return 'SF1:' + btoa(unescape(encodeURIComponent(JSON.stringify(setup)))); }
  function parseCode(s) {
    const m = String(s || '').trim().match(/SF1:([A-Za-z0-9+/=_-]+)/);
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; }
  }
  function copyText(text, okMsg) {
    const box = $('#codeBox'), msg = $('#codeMsg');
    const show = () => { box.hidden = false; box.value = text; box.select(); msg.textContent = 'Copy the text in the box above.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { msg.textContent = okMsg; }).catch(show);
    else show();
  }
  ACT.copyCode = () => copyText(setupCode(), 'Setup code copied. Paste it into Grown-up setup on the other phone.');
  ACT.copyLink = () => {
    const code = setupCode().slice(4).replace(/\+/g, '-').replace(/\//g, '_');
    copyText(location.href.split('#')[0] + '#setup=' + code, 'Link copied. Open it on the other phone and tap "Load shared route".');
  };
  ACT.importCode = () => {
    const data = parseCode($('#importBox').value);
    const msg = $('#codeMsg');
    if (!data) { msg.textContent = 'That code did not work. Copy the whole thing, starting with SF1:'; return; }
    setup = normaliseSetup(data); saveSetup(true); renderSetup();
    const m2 = $('#codeMsg'); if (m2) m2.textContent = 'Setup loaded.';
  };
  ACT.setupDone = () => { saveSetup(true); UI.screen = 'title'; render(); };

  /* ---------- boot ---------- */
  (function boot() {
    const h = location.hash;
    if (h.indexOf('#setup=') === 0) {
      const data = parseCode('SF1:' + h.slice(7));
      if (data) UI.pendingImport = data;
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    }
    try { document.fonts && document.fonts.load('40px Bungee'); } catch (e) { /* ignore */ }
    render();
  })();

  // test hook for automated checks; harmless in normal play
  window.__starfall = { get S() { return S; }, get setup() { return setup; }, AR, ORI, GEO };
})();
