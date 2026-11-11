# Launch media

Renders the launch videos and images from the real renderer (`web/index.html`).

```bash
NODE_PATH=$(npm root -g) node design/launch/produce.mjs            # everything
NODE_PATH=$(npm root -g) node design/launch/produce.mjs story --preview   # quick low-res check
```

Needs Playwright with Chromium, ffmpeg and ImageMagick. Output goes to `design/launch/out/`,
frames to `build/launch/` (safe to delete). Takes about 45 minutes with software WebGL.

| File | What |
|---|---|
| `earth-now-story-demo-1080x1920.mp4` | Instagram story, 41 s, 30 fps, H.264, no audio |
| `earth-now-story-static-1080x1920.png` | Story still with copy |
| `earth-now-story-cover-1080x1920.png` | Story cover |
| `earth-now-demo-landscape-1920x1080.mp4` | 44 s, 16:9, includes the desktop segment |
| `earth-now-github-preview.gif` | 7 s seamless loop (one full day), 640×400 |
| `earth-now-social-static-1200x630.png` | Link preview / social card |

How it works

- `capture.mjs` opens `web/index.html?capture=1`. Only in that mode the renderer exposes
  `window.__captureFrame(time, sec, view)` and stops drawing on its own; the app never sets it.
  Every frame gets an exact simulation time and an exact camera (keyframes with easing).
- The time is a real date (20 March 2026, 03:00 UTC, running in real time), so sunlight, the
  sunrise line and the city lights are physically correct in every frame; only the camera is flown.
  The GIF is a time-lapse of one full day (camera locked to the Sun).
- Clouds come from the bundled static cloud map, not from the live cloud service.
- `overlay.html` and `stills.html` add the typography. The app window shows real CI screenshots
  of the 1.0 app (`assets/`). The desktop frame and menu bar in the landscape video are drawn.
- Instagram safe zones: no copy in the top 250 px or bottom 300 px of the story formats.
- The settings window in both videos scrolls once from top to bottom. `assets/settings-list.png`
  is the whole list, stitched from real app captures at known scroll offsets
  (`assets/settings-scroll/`, taken by CI with `EARTHNOW_SETTINGS_SCROLL=<points>`; the overlaps
  are pixel-identical). The preview above it (`assets/settings-preview.png`) is from the earlier
  CI screenshot of the same window, because the live preview had not loaded in those captures.
