// Exportiert das App-Icon als PNG (16–1024 px) und baut das Favicon.
// Aufruf aus dem Repo-Wurzelverzeichnis:  node design/icon/export.mjs
// Benötigt: Playwright mit Chromium, ImageMagick (`convert`) für favicon.ico.
//
// Für 16 und 32 px wird die vereinfachte Variante earth-now-small.svg
// verwendet, weil Details (Wolken, Stadtlichter) dort nur matschig wirken.

import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'png');
const site = join(here, '..', '..', 'site', 'assets', 'icon');
mkdirSync(out, { recursive: true });
mkdirSync(site, { recursive: true });

const full = readFileSync(join(here, 'earth-now.svg'), 'utf8');
const small = readFileSync(join(here, 'earth-now-small.svg'), 'utf8');
const sizes = [16, 32, 48, 64, 128, 180, 256, 512, 1024];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function render(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">
     <img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"
          width="${size}" height="${size}" style="display:block"></body></html>`);
  await page.waitForFunction(() => document.images[0].complete);
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

for (const s of sizes) {
  const file = join(out, `earth-now-${s}.png`);
  await render(s <= 32 ? small : full, s, file);
  console.log('png', s);
}
await browser.close();

// Favicon (16/32/48) und Kopien für die Landingpage
execFileSync('convert', [16, 32, 48].map(s => join(out, `earth-now-${s}.png`)).concat(join(here, 'favicon.ico')));
copyFileSync(join(here, 'favicon.ico'), join(site, '..', '..', 'favicon.ico'));
copyFileSync(join(here, 'earth-now-small.svg'), join(site, 'favicon.svg'));
copyFileSync(join(out, 'earth-now-180.png'), join(site, 'apple-touch-icon.png'));
copyFileSync(join(out, 'earth-now-512.png'), join(site, 'earth-now-512.png'));
console.log('favicon.ico + Kopien in site/ erstellt');
