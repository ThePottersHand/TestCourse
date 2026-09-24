// Render a page to PNG in headless Chromium (WebGL via SwiftShader).
// usage: node tools/render-still.mjs <url-or-file> <out.png> [width] [height] [globalToWaitFor]
// e.g.   node tools/render-still.mjs "http://localhost:8765/concept.html?scale=2" still.png 3840 2160 __done
import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const [,, src, out, w='1920', h='1080', waitFor=''] = process.argv;
const url = src.startsWith('http') ? src : 'file://' + path.resolve(src);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));
const t0 = Date.now();
await page.goto(url);
if (waitFor) await page.waitForFunction(g => window[g], waitFor, { timeout: 600000, polling: 200 });
else await page.waitForTimeout(800);
await page.screenshot({ path: out });
console.log('rendered in', (Date.now()-t0)/1000, 's');
await browser.close();
