// Renders the marketing images into docs/screenshots/.
//   node design/marketing/render.mjs
// Needs Playwright with Chromium. Run from the repository root.
//
// 1. Views: real renders of web/index.html at fixed dates/times (so day, night and
//    twilight are where we want them), static clouds.
// 2. Mockups: design/marketing/mockup.html frames those renders and the CI app screenshots.

import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const data = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const views = [
  ['whole-earth', '2026-03-20T16:00:00Z', 'motion=fixed&lat=20&lon=10&zoom=0.62&tilt=18'],
  ['close-up', '2026-06-10T11:00:00Z', 'motion=fixed&lat=44&lon=12&zoom=2.2&pitch=20&y=-0.35&tilt=0'],
  ['horizon-sunrise', '2026-03-20T06:20:00Z', 'motion=fixed&lat=40&lon=-15&zoom=4.2&pitch=66&heading=95&fov=50&tilt=0'],
  ['city-lights', '2026-03-20T05:50:00Z', 'motion=fixed&lat=35&lon=-25&zoom=4.2&pitch=66&heading=90&fov=50&tilt=0'],
  ['side-view', '2026-06-21T23:00:00Z', 'motion=fixed&lat=25&lon=-80&zoom=1.25&tilt=20&x=0.55'],
  ['far-out', '2026-09-22T12:00:00Z', 'motion=fixed&lat=15&lon=40&zoom=0.3&tilt=18'],
];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir('docs/screenshots/views', { recursive: true });

if (!process.argv.includes('--mockups-only')) {
  for (const [name, time, query] of views) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await page.clock.setFixedTime(new Date(time));
    await page.goto(`${base}/web/index.html?clouds=static&${query}`);
    await page.waitForTimeout(14000);  // camera settles, textures load
    const png = `docs/screenshots/views/${name}.png`;
    await page.screenshot({ path: png });
    execFileSync('convert', [png, '-strip', '-quality', '88', png.replace('.png', '.jpg')]);
    execFileSync('rm', [png]);
    await page.close();
    console.log('view', name);
  }
}

const mockups = [
  ['desktop-menu', 'scene=menu', 1440, 900],
  ['desktop-settings', 'scene=settings&shot=settings-en-dark.png&second=settings-en-bottom.png&wall=close-up.jpg', 1440, 900],
  ['social-preview', 'scene=social', 1280, 640],
];
for (const [name, query, w, h] of mockups) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: name === 'social-preview' ? 1 : 2 });
  await page.goto(`${base}/design/marketing/mockup.html?${query}`);
  await page.waitForLoadState('networkidle');
  const png = `docs/screenshots/${name}.png`;
  await page.screenshot({ path: png });
  if (name !== 'social-preview') {
    execFileSync('convert', [png, '-strip', '-quality', '88', png.replace('.png', '.jpg')]);
    execFileSync('rm', [png]);
  }
  await page.close();
  console.log('mockup', name);
}

await browser.close();
server.close();
