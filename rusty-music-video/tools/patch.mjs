#!/usr/bin/env node
// Patch an existing render without regenerating the whole video: re-render only the frames where
// a character appears and splice them into the old video at keyframes. Everything else keeps its
// original encoded bytes (stream copy). Frames missing from the end of the old video are added.
//
//   node tools/patch.mjs --master old.mp4 --out new.mp4 [--who big] [--workers 4]
//
// New pieces use the same x264 settings as tools/render.mjs (so the stream headers match and the
// pieces can be joined without re-encoding), and they start exactly at the old keyframes.
import { spawn, fork } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRV, createCanvas } from './node-env.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
  return acc;
}, []));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const fps = 30, width = 1920, height = 1080;
const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', String(args.crf || 20), '-pix_fmt', 'yuv420p', '-g', String(fps * 2), '-threads', '2'];

// ------------------------------------------------------------------ worker: render frame ranges to MP4 pieces
if (args.worker) {
  const RV = loadRV();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  for (const [f0, f1, file] of JSON.parse(args.runs)) {
    const enc = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', String(fps), '-i', 'pipe:0', ...X264, '-an', file],
      { stdio: ['pipe', 'inherit', 'inherit'] });
    const write = (b) => new Promise((res) => (enc.stdin.write(b) ? res() : enc.stdin.once('drain', res)));
    for (let f = f0; f < f1; f++) {
      RV.renderFrame(ctx, f / fps);
      const img = ctx.getImageData(0, 0, width, height);
      await write(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength));
      process.send({ n: 1 });
    }
    enc.stdin.end();
    await new Promise((res, rej) => enc.on('exit', (c) => (c === 0 ? res() : rej(new Error('encoder failed')))));
  }
  process.exit(0);
}

// ------------------------------------------------------------------ helpers
const ff = (argv, capture = false) => new Promise((resolve, reject) => {
  const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', ...argv], { stdio: ['ignore', capture ? 'pipe' : 'inherit', 'inherit'] });
  let out = '';
  if (capture) p.stdout.on('data', (d) => { out += d; });
  p.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(`ffmpeg exited with ${code}`))));
});
// packet timestamps of a file's video stream (timebase units), without decoding
async function videoPackets(file) {
  const txt = await ff(['-i', file, '-map', '0:v', '-c', 'copy', '-f', 'framecrc', '-'], true);
  return txt.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => Number(l.split(',')[2]));
}
// frame indices of IDR frames: one slice per frame (x264), IDR = NAL type 5
function keyframes(annexb) {
  const sc = Buffer.from([0, 0, 1]);
  let pos = 0, frames = 0;
  const idr = [];
  for (;;) {
    const j = annexb.indexOf(sc, pos);
    if (j < 0) break;
    const type = annexb[j + 3] & 0x1f;
    if (type === 1 || type === 5) { if (type === 5) idr.push(frames); frames++; }
    pos = j + 3;
  }
  return { frames, idr };
}

// ------------------------------------------------------------------ main
const master = path.resolve(args.master);
const out = path.resolve(args.out);
const who = args.who || 'big';
const workers = Number(args.workers || Math.max(1, os.cpus().length));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rusty-patch-'));
const t0 = Date.now();
const secs = () => `${((Date.now() - t0) / 1000).toFixed(0)}s`;

// 1. which frames draw the character?
const RV = loadRV();
const total = Math.round(RV.DURATION * fps);
const flags = new Uint8Array(total);
{
  let hit = false;
  const orig = RV.drawKid;
  RV.drawKid = function (ctx, id, p) { if (id === who || id === RV.KIDS[who]) hit = true; return orig.call(this, ctx, id, p); };
  const c = createCanvas(64, 36), ctx = c.getContext('2d');
  for (let f = 0; f < total; f++) { hit = false; RV.renderFrame(ctx, f / fps); flags[f] = hit ? 1 : 0; }
  RV.drawKid = orig;
}
console.log(`[${secs()}] "${who}" appears in ${flags.reduce((a, b) => a + b, 0)} of ${total} frames`);

// 2. keyframes of the old video
const annexbFile = path.join(tmp, 'old.h264');
await ff(['-y', '-i', master, '-map', '0:v', '-c:v', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'h264', annexbFile]);
const { frames: oldFrames, idr } = keyframes(fs.readFileSync(annexbFile));
fs.rmSync(annexbFile);
console.log(`[${secs()}] old video: ${oldFrames} frames, ${idr.length} keyframes`);

// 3. keyframe-to-keyframe chunks; redo any chunk showing the character; merge neighbours into pieces
const pieces = [];
idr.forEach((f, i) => {
  const f1 = i + 1 < idr.length ? idr[i + 1] : oldFrames;
  let redo = false;
  for (let k = f; k < f1 && !redo; k++) redo = flags[k] === 1;
  const last = pieces[pieces.length - 1];
  if (last && last.redo === redo) last.f1 = f1; else pieces.push({ f0: f, f1, redo });
});
const dry = !!args.dry; // dry run: re-join the old pieces without rendering, to test the splice
if (oldFrames < total && !dry) pieces.push({ f0: oldFrames, f1: total, redo: true, tail: true });
const redo = pieces.filter((p) => p.redo);
const redoFrames = redo.reduce((s, p) => s + p.f1 - p.f0, 0);
console.log(`[${secs()}] re-rendering ${redoFrames} frames in ${redo.length} pieces; keeping ${total - redoFrames} frames untouched`);

// 4. cut the old video at every piece boundary (stream copy)
const cuts = pieces.slice(1).filter((p) => p.f0 < oldFrames).map((p) => (p.f0 / fps - 0.001).toFixed(3));
await ff(['-y', '-i', master, '-map', '0:v', '-c', 'copy', '-f', 'segment', '-segment_format', 'mp4', '-reset_timestamps', '1',
  ...(cuts.length ? ['-segment_times', cuts.join(',')] : []), path.join(tmp, 'old%04d.mp4')]);
let seg = 0;
for (const p of pieces) {
  if (p.tail) continue;
  p.oldFile = path.join(tmp, `old${String(seg++).padStart(4, '0')}.mp4`);
  if (!p.redo) {
    const n = (await videoPackets(p.oldFile)).length;
    if (n !== p.f1 - p.f0) throw new Error(`cut piece ${p.f0}-${p.f1} has ${n} frames`);
  }
}

// 5. render the pieces that change (longest first, to the least-loaded worker)
redo.forEach((p, i) => { p.file = dry ? p.oldFile : path.join(tmp, `new${String(i).padStart(4, '0')}.mp4`); });
const loads = Array.from({ length: workers }, () => ({ n: 0, runs: [] }));
[...redo].sort((a, b) => (b.f1 - b.f0) - (a.f1 - a.f0)).forEach((p) => {
  const w = loads.reduce((m, l) => (l.n < m.n ? l : m), loads[0]);
  w.runs.push([p.f0, p.f1, p.file]); w.n += p.f1 - p.f0;
});
let done = 0, lastLog = 0;
const self = fileURLToPath(import.meta.url);
await Promise.all(loads.filter((l) => l.runs.length && !dry).map((l) => new Promise((resolve, reject) => {
  const w = fork(self, ['--worker', '1', '--runs', JSON.stringify(l.runs), ...(args.crf ? ['--crf', args.crf] : [])]);
  w.on('message', (m) => {
    done += m.n;
    if (Date.now() - lastLog > 3000 || done === redoFrames) {
      lastLog = Date.now();
      process.stdout.write(`\r  ${done}/${redoFrames} frames re-rendered   `);
    }
  });
  w.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`worker failed (${code})`))));
})));
console.log(`\n[${secs()}] joining ${pieces.length} pieces...`);

// 6. join (stream copy) and check every frame is present and evenly timed
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, pieces.map((p) => `file '${p.redo ? p.file : p.oldFile}'`).join('\n'));
const video = path.join(tmp, 'video.mp4');
await ff(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
const pts = (await videoPackets(video)).sort((a, b) => a - b);
const steps = new Set(pts.slice(1).map((v, i) => v - pts[i]));
const want = dry ? oldFrames : total;
if (pts.length !== want || steps.size !== 1) throw new Error(`joined video has ${pts.length} frames, timing steps ${[...steps]}`);
console.log(`[${secs()}] joined: ${pts.length} frames, evenly timed`);

// 7. add the original soundtrack
fs.mkdirSync(path.dirname(out), { recursive: true });
await ff(['-y', '-i', video, '-i', master, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart',
  '-metadata', "title=Rusty the Dog's Spacetime Adventure", out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`[${secs()}] wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB): ${total} frames, ${redoFrames} re-rendered`);
