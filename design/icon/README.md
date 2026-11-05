# App icon

| File | Purpose |
|---|---|
| `earth-now.svg` | Master, 1024 × 1024, macOS grid (824 px tile, 100 px margin) |
| `earth-now-small.svg` | Simplified version for 16–32 px and the favicon |
| `png/earth-now-<n>.png` | Exports at 16, 32, 48, 64, 128, 180, 256, 512 and 1024 px |
| `favicon.ico` | 16/32/48 px |
| `export.mjs` | Regenerates all PNGs and the favicon and copies them to `site/` |

```bash
node design/icon/export.mjs
```

Needs Playwright with Chromium (renders the SVGs) and ImageMagick (`convert`, for the `.ico`).
`build.sh` turns the PNGs into `AppIcon.icns` with `iconutil`.
