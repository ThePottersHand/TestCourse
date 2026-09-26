/* Track: audio analysis lookups (features, beats, bars, lyrics) + the playback clock. */
(function () {
  'use strict';
  const V = window.V, M = V.M;
  const D = window.TRACK;

  const T = (V.T = {});
  T.duration = D.duration;
  T.sections = D.sections;
  T.lines = D.lines;
  T.beats = D.beats;
  T.downbeats = D.downbeats;
  T.kicks = D.kicks;
  T.snares = D.snares;

  // ---- decode packed features (uint8, frames x stride)
  const raw = atob(D.feat);
  const F = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) F[i] = raw.charCodeAt(i);
  const S = D.featStride, NF = D.featFrames, FPS = D.fps;
  const cur = { kick: 0, snare: 0, hat: 0, bass: 0, vox: 0, rms: 0, bands: new Float32Array(16) };
  T.feat = function (t) {
    const x = M.clamp(t * FPS, 0, NF - 1.001);
    const i = Math.floor(x), f = x - i, a = i * S, b = (i + 1) * S;
    const g = (k) => (F[a + k] * (1 - f) + F[b + k] * f) / 255;
    cur.kick = g(0); cur.snare = g(1); cur.hat = g(2); cur.bass = g(3); cur.vox = g(4); cur.rms = g(5);
    for (let k = 0; k < 16; k++) cur.bands[k] = g(6 + k);
    return cur;
  };
  // smoothed single feature (box average over +-w seconds)
  T.featAvg = function (t, k, w) {
    let s = 0, n = 0;
    for (let x = t - w; x <= t + w; x += 1 / FPS) {
      const i = M.clamp(Math.round(x * FPS), 0, NF - 1);
      s += F[i * S + k]; n++;
    }
    return s / n / 255;
  };

  // ---- sorted-array helpers
  const lastIdx = (arr, t, key) => {
    let lo = 0, hi = arr.length - 1, r = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1, v = key !== undefined ? arr[m][key] : arr[m];
      if (v <= t) { r = m; lo = m + 1; } else hi = m - 1;
    }
    return r;
  };
  T.lastIdx = lastIdx;

  function gridInfo(arr, t, fallbackLen) {
    const i = lastIdx(arr, t);
    let t0, t1;
    if (i < 0) { t1 = arr[0]; t0 = t1 - fallbackLen; }
    else if (i >= arr.length - 1) { t0 = arr[arr.length - 1]; t1 = t0 + fallbackLen; }
    else { t0 = arr[i]; t1 = arr[i + 1]; }
    return { i, t0, t1, len: t1 - t0, phase: M.clamp((t - t0) / (t1 - t0), 0, 0.99999) };
  }
  T.beat = (t) => gridInfo(D.beats, t, 0.41);
  T.bar = (t) => gridInfo(D.downbeats, t, 1.64);
  // continuous beat count (fractional), handy for phase-locked motion
  T.beatPos = (t) => { const b = T.beat(t); return b.i + b.phase; };
  T.barPos = (t) => { const b = T.bar(t); return b.i + b.phase; };
  // exponential pulse after each beat
  T.beatPulse = (t, tau = 0.12) => { const b = T.beat(t); return t >= b.t0 ? Math.exp(-(t - b.t0) / tau) : 0; };
  T.barPulse = (t, tau = 0.25) => { const b = T.bar(t); return t >= b.t0 ? Math.exp(-(t - b.t0) / tau) : 0; };

  function eventPulse(list, t, tau, minV) {
    let i = lastIdx(list, t, 0);
    // list items are [time, value]; lastIdx with key 0
    let v = 0;
    for (let k = i; k >= 0 && k > i - 6; k--) {
      const dt = t - list[k][0];
      if (dt > tau * 6) break;
      if (list[k][1] < minV) continue;
      v = Math.max(v, list[k][1] * Math.exp(-dt / tau));
    }
    return v;
  }
  T.kickPulse = (t, tau = 0.1, minV = 0.4) => eventPulse(D.kicks, t, tau, minV);
  T.snarePulse = (t, tau = 0.1, minV = 0.45) => eventPulse(D.snares, t, tau, minV);
  T.lastKick = (t) => { const i = lastIdx(D.kicks, t, 0); return i < 0 ? -1e9 : D.kicks[i][0]; };

  // ---- sections & lyrics
  T.section = (t) => {
    for (const s of D.sections) if (t >= s.s && t < s.e) return s;
    return D.sections[D.sections.length - 1];
  };
  T.sec = (name) => D.sections.find((s) => s.name === name);
  // find a line by (partial) text and occurrence index
  T.findLine = (text, occ = 0) => {
    let n = 0;
    for (const L of D.lines) if (L.text.toLowerCase().includes(text.toLowerCase())) { if (n === occ) return L; n++; }
    return null;
  };
  // time of a word inside a line found by text
  T.wordTime = (lineText, word, occLine = 0, occWord = 0) => {
    const L = T.findLine(lineText, occLine);
    if (!L) return 0;
    let n = 0;
    for (const w of L.w) {
      if (w[0].toLowerCase().replace(/[^a-z']/g, '').startsWith(word.toLowerCase())) { if (n === occWord) return w[1]; n++; }
    }
    return L.s;
  };
  T.lineAt = (t, lead = 0.15, hold = 0.35) => {
    for (let i = D.lines.length - 1; i >= 0; i--) {
      const L = D.lines[i];
      if (t >= L.s - lead) return t <= L.e + hold ? L : null;
    }
    return null;
  };

  // ------------------------------------------------------------ playback clock
  // Prefers WebAudio (sample-accurate clock); falls back to an <audio> element (file://).
  const P = (V.Player = {
    mode: 'none', ctx: null, buffer: null, src: null, el: null, gain: null,
    playing: false, offset: 0, startAt: 0, ready: false, onEnd: null,
  });

  P.load = async function (url) {
    try {
      if (location.protocol === 'file:') throw new Error('file:// cannot fetch; use a media element');
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = await res.arrayBuffer();
      const AC = window.AudioContext || window.webkitAudioContext;
      P.ctx = new AC();
      P.buffer = await P.ctx.decodeAudioData(buf);
      P.gain = P.ctx.createGain();
      P.gain.connect(P.ctx.destination);
      P.mode = 'webaudio';
    } catch (e) {
      // file:// or fetch blocked: stream through a media element instead
      P.el = new Audio();
      P.el.src = url;
      P.el.preload = 'auto';
      await new Promise((ok, fail) => {
        P.el.addEventListener('canplaythrough', ok, { once: true });
        P.el.addEventListener('error', () => fail(new Error('Could not load the song file.')), { once: true });
        P.el.load();
      });
      P.el.addEventListener('ended', () => { P.playing = false; P.onEnd && P.onEnd(); });
      P.mode = 'element';
      P.elClock = { base: 0, perf: 0 };
    }
    P.ready = true;
  };

  P.time = function () {
    if (P.mode === 'webaudio') return P.playing ? P.ctx.currentTime - P.startAt : P.offset;
    if (P.mode === 'element') {
      // smooth the coarse currentTime with performance.now()
      const ct = P.el.currentTime;
      if (!P.playing) return ct;
      const now = performance.now() / 1000;
      const est = P.elClock.base + (now - P.elClock.perf);
      if (Math.abs(est - ct) > 0.08) { P.elClock.base = ct; P.elClock.perf = now; return ct; }
      // gentle drift correction
      P.elClock.base += (ct - est) * 0.05;
      return est;
    }
    return P.offset;
  };

  P.play = async function () {
    if (P.playing) return;
    if (P.mode === 'webaudio') {
      if (P.ctx.state !== 'running') await P.ctx.resume();
      if (P.offset >= P.buffer.duration - 0.05) P.offset = 0;
      const s = P.ctx.createBufferSource();
      s.buffer = P.buffer;
      s.connect(P.gain);
      s.onended = () => {
        if (P.src === s && P.playing) { P.playing = false; P.offset = P.buffer.duration; P.onEnd && P.onEnd(); }
      };
      P.startAt = P.ctx.currentTime - P.offset + 0.03;
      s.start(P.ctx.currentTime + 0.03, P.offset);
      P.src = s;
      P.playing = true;
    } else if (P.mode === 'element') {
      await P.el.play();
      P.elClock.base = P.el.currentTime;
      P.elClock.perf = performance.now() / 1000;
      P.playing = true;
    }
  };

  P.pause = function () {
    if (!P.playing) return;
    if (P.mode === 'webaudio') {
      P.offset = P.time();
      const s = P.src; P.src = null;
      try { s.stop(); } catch (e) { /* already stopped */ }
    } else if (P.mode === 'element') {
      P.el.pause();
    }
    P.playing = false;
  };

  P.seek = function (t) {
    t = M.clamp(t, 0, T.duration);
    const was = P.playing;
    if (P.mode === 'webaudio') {
      if (was) P.pause();
      P.offset = t;
      if (was) P.play();
    } else if (P.mode === 'element') {
      P.el.currentTime = t;
      P.elClock.base = t;
      P.elClock.perf = performance.now() / 1000;
    } else P.offset = t;
  };

  P.setVolume = function (v) {
    if (P.gain) P.gain.gain.value = v;
    if (P.el) P.el.volume = v;
  };
})();
