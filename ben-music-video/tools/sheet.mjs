// Character sheet for visual review: node tools/sheet.mjs out.png [t]
// Ben next to the three cousins (and Rusty), then head close-ups of the expressions the video uses.
import { loadRV, createCanvas } from './node-env.mjs';
import fs from 'node:fs';

const RV = loadRV(['src/core.js', 'src/characters.js']);
const W = 1920, H = 1080;
const c = createCanvas(W, H);
const ctx = c.getContext('2d');
const g = ctx.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#f6f2d8');
ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = '#7cc46a'; ctx.fillRect(0, 560, W, 60);
const t = Number(process.argv[3] || 1.3);
const s = 0.82;

// row 1: full bodies
RV.drawKid(ctx, 'big', { x: 150, y: 590, s, t, eyes: 'open', lid: 0.45, mouth: 'flat', browR: 1.2, look: [0.6, 0], armL: [0.2, 0.3], armR: [0.25, 0.2] });
RV.drawKid(ctx, 'boy', { x: 360, y: 590, s, t, mouth: 'grimace', sweat: 1, eyes: 'wide', brow: 0.6, browAng: 0.5, armL: [0.3, 0.3], armR: [0.3, 0.3], lean: -0.08 });
RV.drawKid(ctx, 'little', { x: 540, y: 590, s, t, mouth: 'o', open: 0.6, eyes: 'wide', gloom: 0.9, armL: [0.5, 1.6], armR: [0.5, 1.6] });
RV.drawKid(ctx, 'ben', { x: 800, y: 590, s, t, eyes: 'open', mouth: 'grin', armL: [0.35, 0.2], armR: [0.35, 0.2] });
RV.drawKid(ctx, 'ben', { x: 1080, y: 590, s, t, eyes: 'happy', mouth: 'sing', open: 0.9, armL: [2.65, 0.15], armR: [2.65, 0.15], jump: 20 });
RV.drawKid(ctx, 'ben', { x: 1360, y: 590, s, t, eyes: 'open', mouth: 'smirk', brow: 0.8, armL: [0.9, 1.6], armR: [0.9, 1.6], handL_shape: 'open', handR_shape: 'open', headTilt: -0.12 });
RV.drawKid(ctx, 'ben', { x: 1600, y: 590, s, t, eyes: 'wide', mouth: 'o', open: 1, armL: [0.3, 0.2], armR: [2.9, 0.1], handR_shape: 'point', brow: 1 });
RV.drawRusty(ctx, { x: 1810, y: 590, t, s: 0.62, headTilt: -0.35, earFlip: 'R', mouth: 'closed', eyes: 'open' });

// row 2: heads
const heads = [
  ['ben', { eyes: 'open', mouth: 'grin' }],
  ['ben', { eyes: 'happy', mouth: 'sing', open: 1 }],
  ['ben', { eyes: 'squeeze', mouth: 'grin', blush: 1 }],
  ['ben', { eyes: 'wide', mouth: 'o', open: 0.8, brow: 1 }],
  ['big', { eyes: 'open', lid: 0.5, mouth: 'flat', browR: 1.3, look: [-0.7, 0] }],
  ['boy', { eyes: 'dots', mouth: 'flat' }],
  ['little', { eyes: 'wide', mouth: 'wavy', gloom: 1, sweat: 1 }],
  ['boy', { eyes: 'spiral', mouth: 'wavy' }],
];
heads.forEach(([id, p], i) => {
  RV.drawKidHead(ctx, id, Object.assign({ x: 130 + i * 237, y: 830, s: 1.2, t }, p));
});
fs.writeFileSync(process.argv[2] || 'sheet.png', c.toBuffer('image/png'));
