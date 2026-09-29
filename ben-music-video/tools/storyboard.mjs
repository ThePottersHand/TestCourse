// README images: node tools/storyboard.mjs  ->  docs/storyboard.jpg (20 moments) + docs/poster.jpg (the title card)
import { loadRV, createCanvas } from './node-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './node-env.mjs';

const RV = loadRV();
const times = [0.3, 0.6, 1.1, 2.35, 2.6, 4.4, 4.95, 5.6, 6.3, 6.9, 7.9, 8.98, 10.75, 11.25, 13.6, 14.1, 15.2, 16.4, 18.5, 19.54];
const cols = 4, tw = 480, th = 270, gap = 6;
const rows = Math.ceil(times.length / cols);
const sheet = createCanvas(cols * tw + (cols + 1) * gap, rows * th + (rows + 1) * gap);
const sc = sheet.getContext('2d');
sc.fillStyle = '#0d1632'; sc.fillRect(0, 0, sheet.width, sheet.height);
const c = createCanvas(960, 540);
const ctx = c.getContext('2d');
times.forEach((t, i) => {
  RV.renderFrame(ctx, t);
  sc.drawImage(c, gap + (i % cols) * (tw + gap), gap + Math.floor(i / cols) * (th + gap), tw, th);
});
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/storyboard.jpg'), sheet.toBuffer('image/jpeg', 86));
const p = createCanvas(1280, 720);
RV.renderFrame(p.getContext('2d'), 19.54);
fs.writeFileSync(path.join(ROOT, 'docs/poster.jpg'), p.toBuffer('image/jpeg', 88));
console.log('wrote docs/storyboard.jpg and docs/poster.jpg');
