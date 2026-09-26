#!/usr/bin/env node
/*
 * Offline renderer: plays the video frame-by-frame in headless Chromium and pipes the frames into ffmpeg
 * with the song, producing an MP4. Every frame is a pure function of song time (frames are rendered in
 * order so the video-feedback trails match live playback).
 *
 *   npm i -D playwright            # once (or use a global install)
 *   node tools/render.js --out turn-the-eighties-up.mp4 [--fps 30] [--width 1920 --height 1080]
 *                        [--start 0 --end 226] [--gpu] [--ffmpeg /path/to/ffmpeg] [--crf 16]
 *
 * --gpu  uses the machine's GPU (much faster). Without it Chromium falls back to SwiftShader (CPU),
 *        which works anywhere but takes a few seconds per 1080p frame.
 */
'use strict';
const http = require('http');
const fs = require('fs');
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
const CRF = String(opt('crf', 16));
const GPU = !!opt('gpu', false);

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

(async () => {
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const launchArgs = GPU
    ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=default']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const browser = await chromium.launch({ headless: true, args: launchArgs });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.addInitScript((o) => { window.__MV_OPTS = o; }, { render: true, w: W, h: H });
  await page.goto(url);
  await page.waitForFunction(() => window.__MV && window.__MV.ready, null, { timeout: 180000 });

  const ff = spawn(FFMPEG, [
    '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-ss', String(START), '-t', String(END - START), '-i', path.join(ROOT, 'audio', 'turn-the-eighties-up.mp3'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', OUT,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.on('error', (e) => { console.error('Could not start ffmpeg (' + FFMPEG + '): ' + e.message); process.exit(1); });

  // pre-roll so the feedback buffer holds the same history it would have during playback
  await page.evaluate(({ s, fps }) => { for (let t = Math.max(0, s - 1); t < s; t += 1 / fps) window.__MV.renderAt(t); }, { s: START, fps: FPS });

  const total = Math.round((END - START) * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = START + i / FPS;
    await page.evaluate((tt) => window.__MV.renderAt(tt), t);
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === 0) {
      const el = (Date.now() - t0) / 1000, eta = (el / (i + 1)) * (total - i - 1);
      process.stdout.write(`\rframe ${i}/${total}  t=${t.toFixed(1)}s  elapsed ${el.toFixed(0)}s  eta ${(eta / 60).toFixed(1)} min   `);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  srv.close();
  console.log('\nwrote ' + OUT);
})().catch((e) => { console.error(e); process.exit(1); });
