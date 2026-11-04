# App-Icon

| Datei | Zweck |
|---|---|
| `earth-now.svg` | Master, 1024 × 1024, macOS-Raster (824 px Kachel, 100 px Rand) |
| `earth-now-small.svg` | Vereinfachte Variante für 16–32 px und als Favicon |
| `png/earth-now-<n>.png` | Exporte 16, 32, 48, 64, 128, 180, 256, 512, 1024 px |
| `favicon.ico` | 16/32/48 px |
| `export.mjs` | Erzeugt alle PNGs und das Favicon neu und kopiert sie nach `site/` |

```bash
node design/icon/export.mjs
```

Benötigt Playwright mit Chromium (rendert die SVGs) und ImageMagick (`convert`, für die `.ico`).

Für die App wird daraus später ein `.icns` gebaut (auf dem Mac z. B. mit `iconutil` aus einem
`EarthNow.iconset` mit den Größen 16–1024 inkl. @2x). `build.sh` ist dafür noch nicht angepasst.
