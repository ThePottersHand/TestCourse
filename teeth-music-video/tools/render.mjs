#!/usr/bin/env node
// Offline renderer: draws every frame with the same code the browser player uses,
// encodes in parallel worker processes, then stitches the segments and muxes the song.
//
//   node tools/render.mjs [--out output/he-likes-teeth.mp4] [--fps 30] [--width 1920] [--height 1080]
//                         [--workers 4] [--crf 20] [--start 0] [--end <duration>] [--audio audio/song.mp3] [--youtube]
//
// --youtube encodes to YouTube's recommended upload settings instead of a CRF target (as in the 80s
// video's renderer): the frames go to a near-lossless intermediate, then a two-pass H.264 High encode at
// 8 Mb/s (12 Mb/s above 30 fps), closed GOP of half the frame rate, 2 B-frames, AAC-LC stereo 384 kb/s
// at 48 kHz, moov atom first. Default output: output/he-likes-teeth-youtube.mp4.
import { fork, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRV, createCanvas, ROOT } from './node-env.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, []),
);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const fps = Number(args.fps || 30);
const width = Number(args.width || 1920);
const height = Number(args.height || 1080);
const YOUTUBE = !!args.youtube;
const crf = String(args.crf || (YOUTUBE ? 12 : 20));
const preset = args.preset || 'medium';

function run(cmd, argv, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ['pipe', 'inherit', 'inherit'], ...opts });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))));
    return p;
  });
}

// ------------------------------------------------------------------ worker: render a frame range to a segment
if (args.worker) {
  const RV = loadRV();
  const [f0, f1] = [Number(args.f0), Number(args.f1)];
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const enc = spawn(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', String(fps), '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', preset, '-tune', 'animation', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-g', String(fps * 2), '-threads', '2', '-an', args.seg,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const write = (buf) => new Promise((res) => (enc.stdin.write(buf) ? res() : enc.stdin.once('drain', res)));
  let last = Date.now();
  for (let f = f0; f < f1; f++) {
    RV.renderFrame(ctx, f / fps);
    const img = ctx.getImageData(0, 0, width, height);
    await write(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength));
    if (Date.now() - last > 2000 || f === f1 - 1) {
      process.send({ done: f - f0 + 1 });
      last = Date.now();
    }
  }
  enc.stdin.end();
  await new Promise((res, rej) => enc.on('exit', (c) => (c === 0 ? res() : rej(new Error('encoder failed')))));
  process.exit(0);
}

// ------------------------------------------------------------------ main
const RV = loadRV(['src/core.js', 'src/timing.js']);
const duration = RV.DURATION;
const start = Number(args.start || 0), end = Math.min(Number(args.end || duration), duration);
const out = path.resolve(ROOT, args.out || (YOUTUBE ? 'output/he-likes-teeth-youtube.mp4' : 'output/he-likes-teeth.mp4'));
const audio = path.resolve(ROOT, args.audio || 'audio/he-likes-teeth.mp3');
const workers = Number(args.workers || Math.max(1, os.cpus().length));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teeth-render-'));
fs.mkdirSync(path.dirname(out), { recursive: true });

const F0 = Math.round(start * fps), F1 = Math.round(end * fps);
const total = F1 - F0;
const per = Math.ceil(total / workers);
console.log(`Rendering ${total} frames (${start.toFixed(1)}s-${end.toFixed(1)}s) at ${width}x${height}@${fps} with ${workers} workers...`);
const t0 = Date.now();
const progress = new Array(workers).fill(0);
const segs = [];
const self = fileURLToPath(import.meta.url);
await Promise.all(Array.from({ length: workers }, (_, i) => {
  const f0 = F0 + i * per, f1 = Math.min(F1, f0 + per);
  if (f0 >= f1) return Promise.resolve();
  const seg = path.join(tmp, `seg${String(i).padStart(2, '0')}.mp4`);
  segs.push(seg);
  return new Promise((resolve, reject) => {
    const w = fork(self, ['--worker', '1', '--f0', String(f0), '--f1', String(f1), '--seg', seg,
      '--fps', String(fps), '--width', String(width), '--height', String(height), '--crf', crf, '--preset', preset]);
    w.on('message', (m) => {
      progress[i] = m.done;
      const done = progress.reduce((a, b) => a + b, 0);
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  ${done}/${total} frames  ${(done / el).toFixed(1)} fps  ETA ${Math.max(0, (total - done) / (done / el)).toFixed(0)}s   `);
    });
    w.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`worker ${i} failed (${code})`))));
  });
}));
console.log(`\nFrames done in ${((Date.now() - t0) / 1000).toFixed(0)}s. Stitching...`);
segs.sort();
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
const video = path.join(tmp, 'video.mp4');
await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
// the song, re-zeroed (MP3 encoder delay) so it lines up with the analysis timings
// (no -shortest: it trimmed the last frames of the fade-out when the audio came up a hair short)
const song = ['-ss', String(start), '-t', String(end - start), '-i', audio, '-map', '0:v', '-map', '1:a', '-af', 'asetpts=N/SR/TB'];
if (YOUTUBE) {
  const mbps = fps > 30 ? 12 : 8, gop = String(Math.round(fps / 2)), log = path.join(tmp, 'x264');
  const v = ['-c:v', 'libx264', '-preset', args.preset || 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-b:v', mbps + 'M',
    '-maxrate', mbps * 1.5 + 'M', '-bufsize', mbps * 2 + 'M', '-g', gop, '-keyint_min', gop, '-bf', '2', '-flags', '+cgop', '-passlogfile', log];
  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, ...v, '-pass', '1', '-an', '-f', 'mp4', os.devNull]);
  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, ...song, ...v, '-pass', '2',
    '-c:a', 'aac', '-b:a', '384k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', '-metadata', 'title=He Likes Teeth', out]);
} else {
  await run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, ...song,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-metadata', 'title=He Likes Teeth', out]);
}
fs.rmSync(tmp, { recursive: true, force: true });
const mb = fs.statSync(out).size / 1e6;
console.log(`Wrote ${path.relative(process.cwd(), out)} (${mb.toFixed(1)} MB) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
