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
// the spiral from the "what what" scene
const cx = 560, cy = 560;
ctx.fillStyle = '#ffc8dd'; ctx.fillRect(0, 0, W, H);
for (let i = 0; i < 16; i++) {
  ctx.beginPath(); ctx.moveTo(cx, cy);
  for (let k = 0; k <= 30; k++) { const r = (k / 30) * 2600, a = (i / 16) * Math.PI * 2 + (k / 30) * 2.6; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  for (let k = 30; k >= 0; k--) { const r = (k / 30) * 2600, a = ((i + 0.5) / 16) * Math.PI * 2 + (k / 30) * 2.6; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  ctx.closePath(); ctx.fillStyle = '#cdb4ff'; ctx.fill();
}
RV.glow(ctx, cx, cy, 700, '#ffffff', 0.45);
// Ben in his tooth suit, grinning, with a big tooth in his hand
RV.toothSuit(ctx, { x: 560, y: 1230, s: 1.55, t: 1.2, eyes: 'happy', mouth: 'grin', blush: 0.9, armL: [2.2, 0.4],
  handR: [150, -250], holdR: (cx2, h) => RV.tooth(cx2, h[0] + 10, h[1] - 60, 0.6, { face: { eyes: 'happy', mouth: 'smile' } }) });
// singing teeth
['#e63946', '#4cc9f0', '#9b5de5'].forEach((bow, i) => RV.tooth(ctx, 1180 + i * 190, 880 + (i % 2) * 30, 1.3, { bow, rot: (i - 1) * 0.12, face: { eyes: 'closed', mouth: 'o', open: 0.8 } }));
// title
RV.bigText(ctx, 'HE LIKES', 1460, 190, 190, { gradient: ['#ffffff', '#fff3d6', '#ffd23f'], lw: 30, shine: true });
ctx.save(); ctx.translate(1480, 420); ctx.rotate(-0.07);
RV.bigText(ctx, 'TEETH!', 0, 0, 250, { gradient: ['#ffc2e2', '#ff4fa3', '#c9184a'], lw: 36, shine: true });
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
