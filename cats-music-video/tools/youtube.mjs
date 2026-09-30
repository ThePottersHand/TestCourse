// YouTube upload extras: node tools/youtube.mjs
//   youtube/thumbnail.jpg   custom thumbnail, 1280x720 (YouTube's size; well under its 2 MB limit)
//   youtube/captions.en.srt the lyrics as captions, one line per sung phrase
import { loadRV, createCanvas, ROOT } from './node-env.mjs';
import fs from 'node:fs';
import path from 'node:path';

const RV = loadRV();
const W = RV.W, H = RV.H;
const dir = path.join(ROOT, 'youtube');
fs.mkdirSync(dir, { recursive: true });

// ---------------------------------------------------------------- thumbnail
const c = createCanvas(W, H);
const ctx = c.getContext('2d');
ctx.lineJoin = 'round'; ctx.lineCap = 'round';
ctx.fillStyle = '#a9dcc9'; ctx.fillRect(0, 0, W, H);
RV.sunburst(ctx, 700, 640, 0.4, { n: 24, colors: ['#ffd23f', '#ffb347'], speed: 0 });
RV.glow(ctx, 700, 640, 760, '#ffffff', 0.5);
// food flying everywhere
[[140, 170, 0], [1180, 560, 1], [260, 930, 2], [1030, 170, 3], [120, 560, 4], [1250, 940, 0], [560, 110, 2]].forEach(([x, y, k], i) => RV.food(ctx, k, x, y, 1.5, i * 0.9));
// the cats, huge, mid-song
ctx.save(); ctx.translate(430, 650); ctx.rotate(-0.08); ctx.scale(2.9, 2.9);
RV.catHeadDraw(ctx, 'tux', { t: 1.2, eyes: 'happy', mouth: 'sing', open: 0.9, blush: 0.45 });
ctx.restore();
ctx.save(); ctx.translate(900, 610); ctx.rotate(0.07); ctx.scale(3.1, 3.1);
RV.catHeadDraw(ctx, 'ginger', { t: 1.2, eyes: 'squeeze', mouth: 'yowl', open: 1, blush: 0.45, earL: 0.25, earR: 0.25 });
ctx.restore();
// the kids at the side, delighted
const ky = 905;
RV.drawKidHead(ctx, 'big', { x: 1330, y: ky, s: 1.35, t: 1.2, eyes: 'happy', mouth: 'grin', look: [-0.6, 0], turn: -0.2 });
RV.drawKidHead(ctx, 'boy', { x: 1560, y: ky + 12, s: 1.35, t: 1.2, eyes: 'happy', mouth: 'sing', open: 0.8 });
RV.drawKidHead(ctx, 'little', { x: 1775, y: ky + 22, s: 1.35, t: 1.2, eyes: 'wide', mouth: 'o', open: 0.6, look: [-0.8, -0.3] });
// title
RV.bigText(ctx, 'FOOD IS', 1500, 190, 200, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], lw: 32, shine: true });
ctx.save(); ctx.translate(1500, 420); ctx.rotate(-0.08);
RV.bigText(ctx, 'YUMMY!', 0, 0, 230, { gradient: ['#ffc2e2', '#ff4fa3', '#c9184a'], lw: 34, shine: true });
ctx.restore();
const thumb = createCanvas(1280, 720);
thumb.getContext('2d').drawImage(c, 0, 0, 1280, 720);
fs.writeFileSync(path.join(dir, 'thumbnail.jpg'), thumb.toBuffer('image/jpeg', 90));

// ---------------------------------------------------------------- captions
const ts = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
const L = RV.LYRICS;
const srt = L.map((line, i) => {
  const start = Math.max(0, line.t0 - 0.1);
  const end = Math.min(i + 1 < L.length ? L[i + 1].t0 - 0.12 : RV.DURATION, line.t1 + 0.4);
  return `${i + 1}\n${ts(start)} --> ${ts(end)}\n${line.text}\n`;
}).join('\n');
fs.writeFileSync(path.join(dir, 'captions.en.srt'), srt);
console.log('wrote youtube/thumbnail.jpg and youtube/captions.en.srt');
