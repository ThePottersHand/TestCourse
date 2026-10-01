// Character + props sheet for visual review: node tools/sheet.mjs out.png [t]
// Ben's tooth suit, tooth-fairy Ben, the singing teeth and the tooth collection, next to the cousins for scale.
import { loadRV, createCanvas } from './node-env.mjs';
import fs from 'node:fs';

const RV = loadRV(['src/core.js', 'src/timing.js', 'src/characters.js', 'src/cats.js', 'src/world.js', 'src/teeth.js', 'src/fx.js']);
const W = 1920, H = 1080;
const c = createCanvas(W, H);
const ctx = c.getContext('2d');
const g = ctx.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, '#d9ccff'); g.addColorStop(1, '#fff1d6');
ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = '#b07a52'; ctx.fillRect(0, 1030, W, 50);
const t = Number(process.argv[3] || 1.3);
const s = 0.82;
// row: cousin for scale, Ben, Ben in the suit (two poses), fairy Ben, the cabinet
RV.drawKid(ctx, 'big', { x: 90, y: 1040, s, t, eyes: 'open', mouth: 'smile' });
RV.drawKid(ctx, 'ben', { x: 270, y: 1040, s, t, eyes: 'open', mouth: 'grin' });
RV.toothSuit(ctx, { x: 520, y: 1040, s, t, eyes: 'happy', mouth: 'grin', armL: [0.5, 0.4], armR: [0.5, 0.4], badge: true });
RV.toothSuit(ctx, { x: 820, y: 1040, s, t, eyes: 'open', lid: 0.3, mouth: 'smile', look: [0.6, -0.2], turn: 0.3,
  handR: [150, -250], holdR: (cx, h) => RV.tooth(cx, h[0] + 6, h[1] - 40, 0.35), armL: [2.3, 0.4] });
RV.drawKid(ctx, 'ben', { x: 1110, y: 1040, s, t, eyes: 'happy', mouth: 'grin', armR: [2.2, 0.3], armL: [0.5, 0.4],
  back: (cx, f) => RV.fairyWings(cx, f), waist: (cx, f) => RV.tutu(cx, f),
  holdR: (cx, h) => RV.wand(cx, h, 0.25, t), holdL: (cx, h) => RV.toothSack(cx, h, 1, t),
  hat: (cx, r) => { RV.star(cx, 0, -r * 1.25, r * 0.32, r * 0.15, 5); RV.fs(cx, '#ffd23f', 4); } });
RV.toothCabinet(ctx, 1430, 1040, 0.62, t);
// the singing teeth
['open', 'happy', 'wide', 'closed', 'open'].forEach((e, i) => RV.tooth(ctx, 1600 + (i % 3) * 110, 120 + Math.floor(i / 3) * 170, 0.9,
  { bow: ['#e63946', '#4cc9f0', '#9b5de5', '#ffd23f', '#06d6a0'][i], face: { eyes: e, mouth: i % 2 ? 'o' : 'sing', open: 0.3 + i * 0.15, look: [0.4, 0] } }));
RV.toothMoon(ctx, 1500, 450, 70, t);
RV.coin(ctx, 1380, 120, 26, t);
fs.writeFileSync(process.argv[2] || 'sheet.png', c.toBuffer('image/png'));
