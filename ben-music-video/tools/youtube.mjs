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
ctx.fillStyle = '#ff8fc7'; ctx.fillRect(0, 0, W, H);
RV.sunburst(ctx, 560, 560, 0.4, { n: 24, colors: ['#ff4fa3', '#ffd23f'], speed: 0 });
RV.glow(ctx, 560, 560, 700, '#ffffff', 0.45);
// Ben, huge, mid-"BEN!"
RV.drawKidHead(ctx, 'ben', { x: 560, y: 560, s: 3.3, t: 1.2, eyes: 'happy', mouth: 'sing', open: 0.95, blush: 0.95, headTilt: -0.1 });
// the cousins, not impressed
const cy = 905;
RV.drawKidHead(ctx, 'big', { x: 1100, y: cy, s: 1.45, t: 1.2, eyes: 'open', lid: 0.5, mouth: 'flat', browR: 1.3, look: [-0.8, -0.2], turn: -0.2 });
RV.drawKidHead(ctx, 'boy', { x: 1335, y: cy + 10, s: 1.45, t: 1.2, eyes: 'dots', mouth: 'wavy', sweat: 1, look: [-1, 0] });
RV.drawKidHead(ctx, 'little', { x: 1560, y: cy + 20, s: 1.45, t: 1.2, eyes: 'wide', mouth: 'o', open: 0.5, gloom: 0.9, look: [-0.8, -0.3] });
ctx.save(); ctx.translate(1775, cy + 60); ctx.scale(1.05, 1.05);
RV.rustyHead(ctx, { t: 1.2, eyes: 'open', mouth: 'closed', headTurn: -0.3, earFlip: 'R' });
ctx.restore();
RV.bigText(ctx, '?', 1790, cy - 175, 130, { fill: '#4cc9f0' });
// title
RV.bigText(ctx, "I'M BEN", 1440, 250, 230, { gradient: ['#fff3b0', '#ffd23f', '#ff9f1c'], lw: 34, shine: true });
ctx.save(); ctx.translate(1530, 470); ctx.rotate(-0.12);
RV.rrect(ctx, -250, -78, 500, 156, 22); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
ctx.lineWidth = 16; ctx.strokeStyle = '#e63946'; ctx.stroke();
ctx.font = `120px ${RV.FONT.title}`; ctx.fillStyle = '#e63946'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.fillText('AGAIN', 0, 10);
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
