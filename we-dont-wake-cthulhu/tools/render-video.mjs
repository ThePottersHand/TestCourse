#!/usr/bin/env node
// Renders the animation frame by frame in headless Chromium and muxes it with the song into an MP4.
//
//   npm install playwright && npx playwright install chromium
//   node tools/render-video.mjs --out we-dont-wake-cthulhu.mp4
//
// Options: --fps 30  --workers 4  --crf 20  --out FILE  --ffmpeg PATH
//          --fonts-dir DIR   serve Google Fonts from DIR (latin.css + .woff2 files) for offline renders
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir, cpus } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const FPS = Number(args.fps || 30);
const WORKERS = Number(args.workers || Math.max(1, Math.min(4, cpus().length)));
const CRF = String(args.crf || 20);
const OUT = resolve(args.out || join(ROOT, 'we-dont-wake-cthulhu.mp4'));
const FFMPEG = args.ffmpeg || 'ffmpeg';
const FONTS = args['fonts-dir'] ? resolve(args['fonts-dir']) : null;
const PAGE = pathToFileURL(join(ROOT, 'index.html')).href + '?render';
const AUDIO = join(ROOT, 'we-dont-wake-cthulhu.mp3');

async function routeFonts(page) {
  if (!FONTS) return;
  await page.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: readFileSync(join(FONTS, 'latin.css'), 'utf8') }));
  await page.route('https://fonts.gstatic.com/**', (r) => {
    const f = join(FONTS, r.request().url().split('/').pop());
    return existsSync(f) ? r.fulfill({ contentType: 'font/woff2', body: readFileSync(f), headers: { 'access-control-allow-origin': '*' } }) : r.abort();
  });
}

const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const probe = await browser.newPage();
await probe.goto(PAGE);
const LENGTH = await probe.evaluate(() => SONG_LENGTH);
await probe.close();
const total = Math.ceil(LENGTH * FPS);
const dir = mkdtempSync(join(tmpdir(), 'wdwc-frames-'));
console.log(`Rendering ${total} frames at ${FPS} fps with ${WORKERS} workers…`);

let done = 0;
const started = Date.now();
async function worker(from, to) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await routeFonts(page);
  await page.goto(PAGE);
  await page.evaluate(() => window.__ready);
  for (let i = from; i < to; i++) {
    const url = await page.evaluate((t) => window.__frame(t, 'image/jpeg', 0.95), i / FPS);
    writeFileSync(join(dir, `${String(i).padStart(6, '0')}.jpg`), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
    if (++done % 250 === 0) console.log(`  ${done}/${total} frames (${((Date.now() - started) / 1000).toFixed(0)} s)`);
  }
  await page.close();
}
const per = Math.ceil(total / WORKERS);
await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w * per, Math.min(total, (w + 1) * per))));
await browser.close();

console.log('Encoding…');
await new Promise((ok, fail) => {
  const ff = spawn(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', join(dir, '%06d.jpg'),
    '-i', AUDIO,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', CRF, '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
    OUT,
  ], { stdio: 'inherit' });
  ff.on('exit', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited with ${code}`))));
});
rmSync(dir, { recursive: true, force: true });
console.log(`Done: ${OUT} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
