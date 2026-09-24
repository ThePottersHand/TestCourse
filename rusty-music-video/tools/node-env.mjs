// Loads the browser-side animation scripts into Node with a Skia canvas backend.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Same order as index.html
export const SCRIPTS = [
  'src/core.js',
  'src/timing.js',
  'src/characters.js',
  'src/moves.js',
  'src/world.js',
  'src/fx.js',
  'src/captions.js',
  'src/shots.js',
  'src/shots2.js',
  'src/shots3.js',
  'src/video.js',
];

const FONTS = [
  ['LuckiestGuy-Regular.ttf', 'Luckiest Guy'],
  ['Fredoka-SemiBold.ttf', 'Fredoka'],
  ['Shrikhand-Regular.ttf', 'Shrikhand'],
  ['VT323-Regular.ttf', 'VT323'],
  ['Monoton-Regular.ttf', 'Monoton'],
];

export function loadRV(only) {
  for (const [file, family] of FONTS) GlobalFonts.registerFromPath(path.join(ROOT, 'fonts', file), family);
  globalThis.RV = { makeCanvas: (w, h) => createCanvas(w, h) };
  for (const rel of only || SCRIPTS) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  }
  return globalThis.RV;
}

export { createCanvas };
