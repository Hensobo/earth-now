// Frame-exact capture of the real renderer (web/index.html?capture=1) for the launch videos.
//
//   import { openRenderer } from './capture.mjs';
//   const r = await openRenderer({ width: 1080, height: 1920, scale: 1 });
//   await r.frame('2026-03-20T03:00:00Z', 0, { lat: 45, lon: 5, zoom: 0.9 }, 'out/0001.png');
//
// Each frame sets the simulation time and the camera exactly, so lighting always comes from
// the real Sun position at that time; only the camera moves. Software WebGL (SwiftShader),
// so it is slow but deterministic. Static clouds: the live cloud host is not used here.

import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.json': 'application/json' };

let server, base, browser;
async function start() {
  if (browser) return;
  server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const data = await readFile(join(root, path));
      res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
      res.end(data);
    } catch { res.writeHead(404); res.end(); }
  }).listen(0);
  base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}

export const baseUrl = () => base;
export async function getBrowser() { await start(); return browser; }

export async function openRenderer({ width, height, scale = 1, query = '' }) {
  await start();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  // fps=60 lifts the renderer's pixel-ratio cap (1.5) so scale 2 supersamples fully
  await page.goto(`${base}/web/index.html?capture=1&motion=fixed&clouds=static&iss=0&issPath=0&fx=0&hud=0&fps=60&${query}`);
  await page.waitForFunction(() => typeof window.__captureFrame === 'function');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);  // texture upload
  return {
    page,
    async frame(time, sec, view, path) {
      await page.evaluate(([t, s, v]) => window.__captureFrame(Date.parse(t), s, v), [time, sec, view]);
      await page.screenshot({ path, timeout: 600000 });
    },
    close: () => page.close(),
  };
}

export async function done() {
  await browser?.close();
  server?.close();
}

// Easing and keyframe interpolation
export const ease = {
  linear: (t) => t,
  inOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,       // cubic
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
// keys: [{ t, view: {...}, ease }] sorted by t. Returns the camera at time t (seconds).
export function sample(keys, t) {
  if (t <= keys[0].t) return { ...keys[0].view };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) {
      const u = (ease[b.ease || 'inOut'])((t - a.t) / (b.t - a.t));
      const out = {};
      for (const k of new Set([...Object.keys(a.view), ...Object.keys(b.view)])) {
        const va = a.view[k] ?? b.view[k], vb = b.view[k] ?? a.view[k];
        // zoom in log space: a pull-back or push-in then feels equally fast all the way
        out[k] = typeof va !== 'number' ? vb
          : k === 'zoom' ? Math.exp(Math.log(va) + (Math.log(vb) - Math.log(va)) * u)
          : va + (vb - va) * u;
      }
      return out;
    }
  }
  return { ...keys.at(-1).view };
}

// Keyframes plus a Gaussian blur over time (sigma in seconds): removes every kink where one
// camera move hands over to the next, so speeds always change gradually.
export function smoothSample(keys, t, sigma = 0.18) {
  const end = keys.at(-1).t, acc = {}, n = 12;
  let wsum = 0;
  for (let i = -n; i <= n; i++) {
    const dt = (i / n) * 2.5 * sigma, w = Math.exp(-0.5 * (dt / sigma) ** 2);
    const v = sample(keys, Math.max(0, Math.min(end, t + dt)));
    for (const [k, x] of Object.entries(v)) if (typeof x === 'number') acc[k] = (acc[k] || 0) + (k === 'zoom' ? Math.log(x) : x) * w;
    wsum += w;
  }
  for (const k in acc) acc[k] = k === 'zoom' ? Math.exp(acc[k] / wsum) : acc[k] / wsum;
  return acc;
}
