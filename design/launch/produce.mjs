// Produces the launch media from the real renderer.   Run from the repository root:
//   NODE_PATH=$(npm root -g) node design/launch/produce.mjs [story] [landscape] [gif] [stills] [--preview]
// Output: design/launch/out/ (final files), build/launch/ (frames, can be deleted).
//
// Lighting: the simulation time is fixed to a real date and only advances in real time, so the Sun
// position is physically correct in every frame; only the camera is flown. (The GIF is the one
// exception: a labelled time-lapse of one full day.) Clouds: the bundled static cloud map.

import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { openRenderer, getBrowser, baseUrl, done, sample } from './capture.mjs';

const args = process.argv.slice(2);
const want = (k) => args.includes(k) || !args.some((a) => !a.startsWith('--'));
const preview = args.includes('--preview');
const FPS = 30;
const OUT = 'design/launch/out';
const B = 'build/launch';
await mkdir(OUT, { recursive: true });

// 20 March 2026 (equinox), 03:00 UTC: night over Europe, sunrise line near 43° E, India in daylight.
const T0 = Date.parse('2026-03-20T03:00:00Z');
const iso = (ms) => new Date(ms).toISOString();
const V = (v) => ({ pitch: 0, heading: 0, tilt: 0, fov: 30, x: 0, y: 0, ...v });

// --- Camera paths --------------------------------------------------------------
const storyKeys = [
  { t: 0.0, view: V({ lat: 49, lon: -3, zoom: 1.05, heading: 90, tilt: -8, y: -0.62 }) },
  { t: 3.0, view: V({ lat: 46, lon: 9, zoom: 1.35, pitch: 12, heading: 92, tilt: -4, y: -0.44 }), ease: 'linear' },
  // THE REVEAL: tip toward the eastern horizon (dawn glow over the city lights), then fly across
  // the sunrise line into daylight
  { t: 4.6, view: V({ lat: 38, lon: 12, zoom: 4.0, pitch: 66, heading: 92, fov: 50, y: 0.1 }), ease: 'inOut' },
  { t: 5.2, view: V({ lat: 37.5, lon: 15, zoom: 4.0, pitch: 66, heading: 93, fov: 50, y: 0.1 }), ease: 'linear' },
  { t: 7.0, view: V({ lat: 33, lon: 63, zoom: 3.8, pitch: 64, heading: 100, fov: 48, y: 0.02 }), ease: 'inOut' },
  { t: 7.75, view: V({ lat: 32, lon: 67, zoom: 3.8, pitch: 64, heading: 100, fov: 48, y: 0.02 }), ease: 'linear' },
  { t: 8.55, view: V({ lat: 28, lon: 78, zoom: 2.3, pitch: 18, heading: 10, fov: 32, y: -0.12 }), ease: 'inOut' },
  { t: 9.1, view: V({ lat: 27, lon: 80, zoom: 2.25, pitch: 18, heading: 10, fov: 32, y: -0.12 }), ease: 'linear' },
  { t: 9.65, view: V({ lat: 18, lon: 72, zoom: 0.5, tilt: 14, y: 0.04 }), ease: 'inOut' },
  { t: 10.3, view: V({ lat: 18, lon: 69, zoom: 0.5, tilt: 14, y: 0.04 }), ease: 'linear' },
  { t: 11.0, view: V({ lat: 22, lon: 60, zoom: 0.95, tilt: 18, x: 0.55, y: 0.05 }), ease: 'inOut' },
  { t: 12.4, view: V({ lat: 22, lon: 56, zoom: 0.95, tilt: 18, x: 0.55, y: 0.05 }), ease: 'linear' },
  // CTA: half day, half night (sunrise line through the middle), drifting slowly
  { t: 13.4, view: V({ lat: 18, lon: 47, zoom: 0.42, tilt: 16, y: 0.12 }), ease: 'inOut' },
  { t: 15.0, view: V({ lat: 18, lon: 44, zoom: 0.42, tilt: 16, y: 0.12 }), ease: 'linear' },
];

const landKeys = [
  { t: 0.0, view: V({ lat: 49, lon: -4, zoom: 1.0, heading: 90, tilt: -6, y: 0.1 }) },
  { t: 3.0, view: V({ lat: 46, lon: 8, zoom: 1.25, pitch: 12, heading: 92, tilt: -3, y: 0.08 }), ease: 'linear' },
  { t: 4.6, view: V({ lat: 38, lon: 12, zoom: 4.0, pitch: 66, heading: 92, fov: 50, y: 0.15 }), ease: 'inOut' },
  { t: 5.2, view: V({ lat: 37.5, lon: 15, zoom: 4.0, pitch: 66, heading: 93, fov: 50, y: 0.15 }), ease: 'linear' },
  { t: 7.0, view: V({ lat: 33, lon: 63, zoom: 3.6, pitch: 66, heading: 100, fov: 46, y: 0.12 }), ease: 'inOut' },
  // desktop segment: the app's “Side View” preset (Earth on the right) as the wallpaper
  { t: 8.4, view: V({ lat: 25, lon: 70, zoom: 1.25, tilt: 20, x: 0.55 }), ease: 'inOut' },
  { t: 12.0, view: V({ lat: 25, lon: 61, zoom: 1.25, tilt: 20, x: 0.55 }), ease: 'linear' },
  { t: 12.9, view: V({ lat: 18, lon: 60, zoom: 0.62, tilt: 18 }), ease: 'inOut' },
  { t: 13.9, view: V({ lat: 18, lon: 57, zoom: 0.62, tilt: 18 }), ease: 'linear' },
  { t: 14.6, view: V({ lat: 24, lon: 52, zoom: 1.25, tilt: 20, x: 0.55 }), ease: 'inOut' },
  { t: 15.2, view: V({ lat: 24, lon: 50, zoom: 1.25, tilt: 20, x: 0.55 }), ease: 'linear' },
  { t: 16.2, view: V({ lat: 18, lon: 46, zoom: 0.78, tilt: 16, x: 0.4 }), ease: 'inOut' },
  { t: 18.0, view: V({ lat: 18, lon: 42, zoom: 0.78, tilt: 16, x: 0.4 }), ease: 'linear' },
];

// --- Helpers ---------------------------------------------------------------------
async function renderEarth(name, keys, seconds, w, h, scale) {
  const dir = `${B}/${name}/earth`;
  await mkdir(dir, { recursive: true });
  const n = Math.round(seconds * FPS);
  const r = await openRenderer({ width: w, height: h, scale });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const path = `${dir}/${String(i).padStart(4, '0')}.png`;
    if (existsSync(path)) continue;
    const t = i / FPS;
    await r.frame(iso(T0 + t * 1000), t, sample(keys, t), path);
    if (i % 60 === 0) console.log(name, 'earth', i, '/', n, `${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await r.close();
  return n;
}

async function composite(name, format, n, w, h) {
  const dir = `${B}/${name}/final`;
  await mkdir(dir, { recursive: true });
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl()}/design/launch/overlay.html`);
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < n; i++) {
    const path = `${dir}/${String(i).padStart(4, '0')}.png`;
    if (existsSync(path) && !args.includes('--recomposite')) continue;
    const src = `${baseUrl()}/${B}/${name}/earth/${String(i).padStart(4, '0')}.png`;
    await page.evaluate((a) => window.setFrame(a), { t: i / FPS, src, format });
    await page.screenshot({ path });
  }
  await page.close();
}

function encode(name, outFile) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${B}/${name}/final/%04d.png`,
    '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-movflags', '+faststart', '-an', outFile], { stdio: 'inherit' });
  console.log('wrote', outFile);
}

// --- 1. Instagram story video ---------------------------------------------------
if (want('story')) {
  const [w, h, s] = preview ? [540, 960, 1] : [1080, 1920, 2];
  const n = await renderEarth(preview ? 'story-prev' : 'story', storyKeys, 15, w, h, s);
  await composite(preview ? 'story-prev' : 'story', 'story', n, 1080, 1920);
  encode(preview ? 'story-prev' : 'story', preview ? `${B}/story-preview.mp4` : `${OUT}/earth-now-story-demo-1080x1920.mp4`);
}

// --- 4. Landscape demo -------------------------------------------------------------
if (want('landscape')) {
  const L = preview ? 'landscape-prev' : 'landscape';
  const n = await renderEarth(L, landKeys, 18, preview ? 960 : 1920, preview ? 540 : 1080, preview ? 1 : 1.5);
  await composite(L, 'landscape', n, 1920, 1080);
  encode(L, preview ? `${B}/landscape-preview.mp4` : `${OUT}/earth-now-demo-landscape-1920x1080.mp4`);
}

// --- 5. GitHub GIF: one full day in 7 s, camera locked to the Sun, so the Earth turns once
//        under a fixed day/night line. Frame N equals frame 0 -> seamless loop.
if (want('gif')) {
  const dir = `${B}/gif/earth`;
  await mkdir(dir, { recursive: true });
  const G = 2026 - 0, n = 7 * 20;  // 20 fps
  const start = Date.parse('2026-06-21T12:00:00Z');   // solstice: the Sun's declination barely changes in a day
  const r = await openRenderer({ width: 640, height: 400, scale: 2 });
  const { subsolarOfDate } = await import('../../web/planets.js');
  for (let i = 0; i < n; i++) {
    const path = `${dir}/${String(i).padStart(4, '0')}.png`;
    if (existsSync(path)) continue;
    const ms = start + (i / n) * 86400000;
    const sun = subsolarOfDate(new Date(ms));
    await r.frame(iso(ms), 0, V({ lat: 20, lon: sun.lon - 80, zoom: 0.8, tilt: 16 }), path);
  }
  await r.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '20', '-i', `${dir}/%04d.png`,
    '-vf', 'scale=640:400:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle',
    '-loop', '0', `${OUT}/earth-now-github-preview.gif`], { stdio: 'inherit' });
  console.log('wrote gif');
}

// --- 2, 3, 6. Stills ------------------------------------------------------------------
if (want('stills')) {
  await mkdir(`${B}/stills`, { recursive: true });
  const stills = [
    // story hero: half day / half night, large, low in the frame
    ['hero-portrait', 1080, 1920, '2026-03-20T03:00:00Z', V({ lat: 18, lon: 45, zoom: 0.37, tilt: 16, y: 0.02 })],
    // cover: the sunrise line across Arabia and India, Europe's lights on the night side
    ['cover-portrait', 1080, 1920, '2026-03-20T03:00:00Z', V({ lat: 22, lon: 44, zoom: 0.8, tilt: 24, y: -0.37 })],
    ['social', 1200, 630, '2026-03-20T03:00:00Z', V({ lat: 18, lon: 46, zoom: 0.86, tilt: 16, x: 0.42 })],
  ];
  for (const [name, w, h, time, view] of stills) {
    const r = await openRenderer({ width: w, height: h, scale: 2 });
    await r.frame(time, 0, view, `${B}/stills/${name}.png`);
    await r.close();
    console.log('still', name);
  }
  const browser = await getBrowser();
  for (const [scene, w, h, file] of [['story', 1080, 1920, 'earth-now-story-static-1080x1920.png'],
    ['cover', 1080, 1920, 'earth-now-story-cover-1080x1920.png'], ['social', 1200, 630, 'earth-now-social-static-1200x630.png']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl()}/design/launch/stills.html?scene=${scene}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${OUT}/${file}` });
    await page.close();
    console.log('wrote', file);
  }
}

await done();
