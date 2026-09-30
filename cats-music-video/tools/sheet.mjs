// Character sheet for visual review: node tools/sheet.mjs out.png [t]
// The two cats in every pose and face the video uses, next to the three kids for scale.
import { loadRV, createCanvas } from './node-env.mjs';
import fs from 'node:fs';

const RV = loadRV(['src/core.js', 'src/characters.js', 'src/cats.js']);
const W = 1920, H = 1080;
const c = createCanvas(W, H);
const ctx = c.getContext('2d');
const g = ctx.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, '#bfe6d8'); g.addColorStop(1, '#f6f2d8');
ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = '#c96f3b'; ctx.fillRect(0, 520, W, 40); ctx.fillRect(0, 1030, W, 50);
const t = Number(process.argv[3] || 1.3);

// row 1: kids for scale + cats sitting
RV.drawKid(ctx, 'big', { x: 110, y: 530, s: 0.9, t, eyes: 'open', mouth: 'smile', armL: [0.2, 0.2], armR: [0.2, 0.2] });
RV.drawKid(ctx, 'boy', { x: 300, y: 530, s: 0.9, t, eyes: 'open', mouth: 'smile' });
RV.drawKid(ctx, 'little', { x: 470, y: 530, s: 0.9, t, eyes: 'open', mouth: 'smile' });
RV.drawCat(ctx, 'tux', { x: 690, y: 530, t, eyes: 'open' });
RV.drawCat(ctx, 'ginger', { x: 930, y: 530, t, eyes: 'open' });
RV.drawCat(ctx, 'tux', { x: 1180, y: 530, t, eyes: 'happy', mouth: 'sing', open: 0.9, pawR: 1 });
RV.drawCat(ctx, 'ginger', { x: 1430, y: 530, t, eyes: 'heart', mouth: 'tongue' });
RV.drawCat(ctx, 'ginger', { x: 1720, y: 530, t, pose: 'loaf', drape: 1, eyes: 'closed', mouth: 'w' });

// row 2: standing / singing poses
RV.drawCat(ctx, 'tux', { x: 150, y: 1040, t, pose: 'stand', eyes: 'happy', mouth: 'yowl', open: 1, armL: [2.05, 0.3], armR: [2.05, 0.3] });
RV.drawCat(ctx, 'ginger', { x: 420, y: 1040, t, pose: 'stand', eyes: 'open', mouth: 'sing', open: 0.7, handR: [34, RV.catHead('ginger', 'stand') + 70], holdR: (cx, h) => { cx.save(); cx.translate(h[0], h[1]); cx.rotate(-0.4); RV.rrect(cx, -5, -70, 10, 90, 5); RV.fs(cx, '#c9ccd6', 3); cx.restore(); } });
RV.drawCat(ctx, 'ginger', { x: 700, y: 1040, t, pose: 'stand', eyes: 'happy', mouth: 'smile', belly: 1, handL: [-30, -150], handR: [30, -140] });
RV.drawCat(ctx, 'tux', { x: 960, y: 1040, t, pose: 'stand', eyes: 'wide', mouth: 'o', open: 0.6, armL: [1.4, 1.2], armR: [1.4, 1.2] });
RV.drawCat(ctx, 'ginger', { x: 1230, y: 1040, t, pose: 'stand', eyes: 'squeeze', mouth: 'yowl', open: 1, armL: [2.1, 0.25], armR: [2.1, 0.25], earL: 0.3, earR: 0.3 });
RV.drawCat(ctx, 'tux', { x: 1480, y: 1040, t, eyes: 'open', lid: 0.5, mouth: 'w', earL: 0.8, earR: 0.8, look: [0.8, 0] });
RV.drawCat(ctx, 'tux', { x: 1700, y: 1040, t, pose: 'loaf', eyes: 'closed', mouth: 'w' });
fs.writeFileSync(process.argv[2] || 'sheet.png', c.toBuffer('image/png'));
