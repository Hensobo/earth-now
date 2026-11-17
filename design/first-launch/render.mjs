// Renders clip.html into the website video and a GIF.
//   NODE_PATH=$(npm root -g) node design/first-launch/render.mjs [--preview]
// Needs Playwright with Chromium and ffmpeg. Frames go to build/first-launch/ (safe to delete).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const preview = process.argv.includes('--preview');
const FPS = preview ? 10 : 30;
const frames = path.join(root, 'build/first-launch');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
  try {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root)) throw new Error('outside');
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

await rm(frames, { recursive: true, force: true });
await mkdir(frames, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/design/first-launch/clip.html`);
await page.waitForFunction(() => window.ready === true);
await page.waitForTimeout(300);
const dur = await page.evaluate(() => window.DUR);
const n = Math.round(dur * FPS);
for (let i = 0; i < n; i++) {
  await page.evaluate(t => window.render(t), i / FPS);
  await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
}
await browser.close();
server.close();

const out = path.join(root, 'site/assets/video');
await mkdir(out, { recursive: true });
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });
const input = ['-framerate', String(FPS), '-i', path.join(frames, 'f%04d.png')];
ff(...input, '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'veryslow',
  '-movflags', '+faststart', '-an', path.join(out, 'first-launch.mp4'));
ff('-i', path.join(frames, 'f0000.png'), '-ss', '0', '-i', path.join(frames, `f${String(Math.round(1.6 * FPS)).padStart(4, '0')}.png`),
  '-map', '1', '-q:v', '4', path.join(out, 'first-launch-poster.jpg'));
// GIF for the README and posts: 720 px wide, 12 fps
ff(...input, '-vf', 'fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
  path.join(root, 'docs/screenshots/first-launch.gif'));
console.log(`done: ${n} frames`);
