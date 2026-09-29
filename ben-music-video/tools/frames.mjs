// Render frames for review.
//   node tools/frames.mjs out.png 12.5 30 45.2 ...   -> contact sheet (3 columns) of those times
//   node tools/frames.mjs --single out.png 12.5      -> one full-size frame
import { loadRV, createCanvas } from './node-env.mjs';
import fs from 'node:fs';

const args = process.argv.slice(2);
const single = args[0] === '--single';
if (single) args.shift();
const out = args.shift();
const times = args.map(Number);
const RV = loadRV();
RV.debug = true;

if (single) {
  const c = createCanvas(1920, 1080);
  RV.renderFrame(c.getContext('2d'), times[0]);
  fs.writeFileSync(out, c.toBuffer('image/png'));
} else {
  const cols = Math.min(3, times.length), rows = Math.ceil(times.length / cols);
  const tw = 640, th = 360;
  const sheet = createCanvas(cols * tw, rows * (th + 28));
  const sc = sheet.getContext('2d');
  sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
  const c = createCanvas(1280, 720);
  const ctx = c.getContext('2d');
  times.forEach((t, i) => {
    RV.renderFrame(ctx, t);
    const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + 28);
    sc.drawImage(c, x, y + 28, tw, th);
    const idx = RV.findShot(t);
    sc.fillStyle = '#fff'; sc.font = '20px sans-serif';
    sc.fillText(`${t.toFixed(2)}s  ${RV.SHOTS[idx].name}`, x + 8, y + 21);
  });
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
}
