// Character sheet for visual review: node tools/sheet.mjs out.png
import { loadRV, createCanvas } from './node-env.mjs';
import fs from 'node:fs';

const RV = loadRV(['src/core.js', 'src/characters.js']);
const W = 1920, H = 1080;
const c = createCanvas(W, H);
const ctx = c.getContext('2d');
const g = ctx.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#f6f2d8');
ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = '#7cc46a'; ctx.fillRect(0, 900, W, 180);
const t = Number(process.argv[3] || 1.3);

RV.drawKid(ctx, 'big', { x: 260, y: 900, t, eyes: 'open', mouth: 'smile', armL: [0.35, 0.2], armR: [2.6, 0.4], look: [0.3, 0] });
RV.drawKid(ctx, 'boy', { x: 520, y: 900, t, mouth: 'grin', armL: [0.2, 0.3], armR: [0.2, 0.3], turn: 0.4, eyes: 'happy' });
RV.drawKid(ctx, 'little', { x: 760, y: 900, t, mouth: 'open', open: 0.7, armL: [2.4, 0.5], armR: [2.4, 0.5], eyes: 'wide', footL: [0, 30], bob: 10 });
RV.drawRusty(ctx, { x: 1060, y: 900, t, headTilt: -0.2, earFlip: 'R', mouth: 'closed', eyes: 'open', s: 1.1 });
RV.drawRusty(ctx, { x: 1390, y: 900, t, pose: 'stand', mouth: 'open', open: 0.7, armL: [2.5, 0.3], armR: [1.2, -0.8], headTilt: 0.15, s: 0.95, goggles: 1 });
RV.drawRustySide(ctx, { x: 1700, y: 900, t, gait: t * 1.5, run: 0.3, mouth: 'tongue', s: 0.9 });
RV.drawRustySleep(ctx, { x: 1650, y: 520, t, s: 0.8 });
ctx.save(); ctx.translate(1100, 300); ctx.scale(1.6, 1.6); RV.rustyHead(ctx, { t, eyes: 'puppy', mouth: 'closed', headTurn: -0.2, earFlip: 'R' }); ctx.restore();
ctx.save(); ctx.translate(560, 260); ctx.scale(1.4, 1.4); RV.rustyHead(ctx, { t, eyes: 'open', mouth: 'howl', shades: 'pink' }); ctx.restore();
fs.writeFileSync(process.argv[2] || 'sheet.png', c.toBuffer('image/png'));
