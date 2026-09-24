// Poster + storyboard images for the README:  node tools/storyboard.mjs
import { loadRV, createCanvas, ROOT } from './node-env.mjs';
import fs from 'node:fs';
import path from 'node:path';

const RV = loadRV();
const out = path.join(ROOT, 'docs');
fs.mkdirSync(out, { recursive: true });

const poster = createCanvas(1280, 720);
RV.renderFrame(poster.getContext('2d'), 17.0, { captions: false });
fs.writeFileSync(path.join(out, 'poster.jpg'), poster.toBuffer('image/jpeg', 82));

const times = [5.5, 27.5, 36.3, 61.8, 74.6, 102.8, 140.2, 157.6, 173.0, 196.5, 206.5, 239.6, 250.9, 262.0, 280.3, 301.5, 309.6, 333.0, 343.6, 376.2];
const cols = 4, tw = 480, th = 270, gap = 6;
const rows = Math.ceil(times.length / cols);
const sheet = createCanvas(cols * tw + (cols + 1) * gap, rows * th + (rows + 1) * gap);
const sc = sheet.getContext('2d');
sc.fillStyle = '#0d0a1f'; sc.fillRect(0, 0, sheet.width, sheet.height);
const frame = createCanvas(960, 540);
const fc = frame.getContext('2d');
times.forEach((t, i) => {
  RV.renderFrame(fc, t, { captions: false });
  sc.drawImage(frame, gap + (i % cols) * (tw + gap), gap + Math.floor(i / cols) * (th + gap), tw, th);
});
fs.writeFileSync(path.join(out, 'storyboard.jpg'), sheet.toBuffer('image/jpeg', 80));
console.log('wrote docs/poster.jpg and docs/storyboard.jpg');
