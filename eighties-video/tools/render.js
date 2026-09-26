#!/usr/bin/env node
/*
 * Offline renderer: plays the video frame by frame in headless Chromium and encodes the frames with ffmpeg,
 * muxed with the song, producing an MP4. Every frame is a pure function of song time plus the video-feedback
 * trail, so the timeline is split across several browser workers: each renders its stretch in order after a
 * one-second pre-roll that rebuilds the trail, into a near-lossless part. The parts are then joined and
 * encoded once to the final quality.
 *
 *   npm i -D playwright            # once (or use a global install)
 *   node tools/render.js --out turn-the-eighties-up.mp4 [--fps 30] [--width 1920 --height 1080]
 *                        [--start 0 --end 226] [--workers 3] [--gpu] [--captions] [--ffmpeg /path/to/ffmpeg]
 *                        [--crf 20] [--preset slow] [--maxrate 24M] [--intermediate master.mp4]
 *
 * --captions      burns in the lyric captions along the bottom of the frame (off by default).
 * --gpu           uses the machine's GPU. Without it Chromium falls back to SwiftShader (CPU), which works
 *                 anywhere but is slow: about 0.6 s per 1080p frame per worker.
 * --workers       browsers rendering in parallel (default: CPU cores - 1, at most 4).
 * --maxrate       caps the video bitrate (the film grain is expensive to encode); off by default.
 * --intermediate  also keeps the joined near-lossless render, for re-encoding without rendering again.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  if (i < 0) return def;
  const v = args[i + 1];
  return v == null || v.startsWith('--') ? true : v;
};
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(opt('out', 'turn-the-eighties-up.mp4'));
const FPS = +opt('fps', 30);
const W = +opt('width', 1920), H = +opt('height', 1080);
const START = +opt('start', 0), END = +opt('end', 226);
const FFMPEG = opt('ffmpeg', process.env.FFMPEG || 'ffmpeg');
const CRF = String(opt('crf', 20));
const PRESET = String(opt('preset', 'slow'));
const MAXRATE = opt('maxrate', null);
const INTERMEDIATE = opt('intermediate', null);
const GPU = !!opt('gpu', false);
const CAPTIONS = !!opt('captions', false);
const WORKERS = Math.max(1, +opt('workers', Math.min(4, Math.max(1, os.cpus().length - 1))));

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) {
    console.error('Playwright is required: npm i -D playwright  (then: npx playwright install chromium)');
    process.exit(1);
  }
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.css': 'text/css', '.json': 'application/json' };
function serve() {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

function run(argv) {
  return new Promise((ok, fail) => {
    const p = spawn(FFMPEG, argv, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('error', (e) => fail(new Error('Could not start ffmpeg (' + FFMPEG + '): ' + e.message)));
    p.on('close', (c) => (c === 0 ? ok() : fail(new Error('ffmpeg exited with code ' + c))));
  });
}

// Renders frames [f0, f1) (frame f is at START + f/FPS) into a near-lossless video file.
async function renderPart(part, url, onFrame) {
  const launchArgs = GPU
    ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=default']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const browser = await chromium.launch({ headless: true, args: launchArgs });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error(`\n[worker ${part.w}] page error: ${e.message}`));
    await page.addInitScript((o) => { window.__MV_OPTS = o; }, { render: true, w: W, h: H, captions: CAPTIONS });
    await page.goto(url);
    await page.waitForFunction(() => window.__MV && window.__MV.ready, null, { timeout: 180000 });
    const cdp = await page.context().newCDPSession(page);
    const ff = spawn(FFMPEG, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p', part.file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((ok, fail) => {
      ff.on('error', (e) => fail(new Error('Could not start ffmpeg (' + FFMPEG + '): ' + e.message)));
      ff.on('close', (c) => (c === 0 ? ok() : fail(new Error('ffmpeg exited with code ' + c))));
    });
    // pre-roll: the second before this stretch, so the feedback buffer holds the history it has in playback
    await page.evaluate(({ f0, start, fps }) => {
      for (let f = Math.max(Math.ceil(-start * fps), f0 - fps); f < f0; f++) window.__MV.renderAt(start + f / fps);
    }, { f0: part.f0, start: START, fps: FPS });
    for (let f = part.f0; f < part.f1; f++) {
      await page.evaluate((t) => window.__MV.renderAt(t), START + f / FPS);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
      if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      onFrame();
    }
    ff.stdin.end();
    await done;
  } finally {
    await browser.close();
  }
}

(async () => {
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-render-'));
  const total = Math.round((END - START) * FPS);
  const per = Math.ceil(total / WORKERS);
  const parts = [];
  for (let w = 0; w * per < total; w++) parts.push({ w, f0: w * per, f1: Math.min(total, (w + 1) * per), file: path.join(tmp, `part${w}.mp4`) });

  console.log(`rendering ${total} frames (${W}x${H} @ ${FPS} fps) with ${parts.length} worker(s)`);
  let done = 0;
  const t0 = Date.now();
  const tick = setInterval(() => {
    const el = (Date.now() - t0) / 1000, eta = done ? (el / done) * (total - done) : 0;
    process.stdout.write(`\rframe ${done}/${total}  elapsed ${(el / 60).toFixed(1)} min  eta ${(eta / 60).toFixed(1)} min   `);
  }, 2000);
  try {
    await Promise.all(parts.map((p) => renderPart(p, url, () => done++)));
  } finally {
    clearInterval(tick);
    srv.close();
  }
  console.log(`\nrendered in ${((Date.now() - t0) / 60000).toFixed(1)} min; encoding ${path.basename(OUT)}`);

  const list = path.join(tmp, 'parts.txt');
  fs.writeFileSync(list, parts.map((p) => `file '${p.file}'`).join('\n') + '\n');
  if (INTERMEDIATE) await run(['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.resolve(INTERMEDIATE)]);
  const rate = MAXRATE ? ['-maxrate', String(MAXRATE), '-bufsize', String(parseFloat(MAXRATE) * 2) + String(MAXRATE).replace(/[\d.]/g, '')] : [];
  await run(['-v', 'error', '-stats', '-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-ss', String(START), '-t', String(END - START), '-i', path.join(ROOT, 'audio', 'turn-the-eighties-up.mp3'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', PRESET, '-crf', CRF, ...rate, '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', OUT]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote ' + OUT);
})().catch((e) => { console.error(e); process.exit(1); });
