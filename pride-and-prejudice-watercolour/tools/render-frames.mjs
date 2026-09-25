// Render the film frame by frame to JPEGs in headless Chromium (WebGL via SwiftShader), for
// encoding into the final video.
// usage: node tools/render-frames.mjs <frame.html url> <out-dir> [fps=24] [first=0] [end=all] [width=1920] [height=1080]
// e.g.   node tools/render-frames.mjs http://localhost:8765/frame.html frames 24
//        (add ?lyrics=0 to the url for a version without the lyrics)
// Frames already on disk are skipped, so an interrupted render picks up where it stopped, and
// several processes can share the work by taking different frame ranges.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [,, src, outDir, fpsArg = '24', firstArg = '0', endArg = '', w = '1920', h = '1080'] = process.argv;
const fps = +fpsArg;
fs.mkdirSync(outDir, { recursive: true });
const name = (i) => path.join(outDir, String(i).padStart(5, '0') + '.jpg');

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
const url = `${src}${src.includes('?') ? '&' : '?'}t=0&scale=${+w / 1920}`;
await page.goto(url);
await page.waitForFunction(() => window.__done, null, { timeout: 900000, polling: 250 });

const total = Math.ceil((await page.evaluate(() => WC.Film.duration)) * fps);
const first = +firstArg, end = endArg ? Math.min(+endArg, total) : total;
const todo = [];
for (let i = first; i < end; i++) if (!fs.existsSync(name(i))) todo.push(i);
console.log(`frames ${first}-${end - 1} of ${total} at ${fps} fps: ${todo.length} to render`);

const t0 = Date.now();
for (let k = 0; k < todo.length; k++) {
  const i = todo[k];
  await page.evaluate((t) => window.renderAt(t), i / fps);
  const tmp = name(i).replace(/\.jpg$/, '.part.jpg');
  await page.screenshot({ path: tmp, type: 'jpeg', quality: 95 });
  fs.renameSync(tmp, name(i));
  if ((k + 1) % 24 === 0 || k === todo.length - 1) {
    const per = (Date.now() - t0) / 1000 / (k + 1);
    console.log(`${k + 1}/${todo.length} frames, ${per.toFixed(2)} s/frame, about ${Math.round((todo.length - k - 1) * per / 60)} min left`);
  }
}
await browser.close();
