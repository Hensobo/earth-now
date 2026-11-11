# Website

Static website for Earth Now, served by GitHub Pages at <https://hensobo.github.io/earth-now/>.

```
site/
  index.html              the page (no third-party requests, no cookies, no tracking)
  info/index.html         privacy and credits
  404.html                "Lost in orbit" (GitHub Pages serves it for any missing path)
  assets/css/site.css     all styles; design notes in design/website/DESIGN.md
  assets/js/site.js       the page clock: scroll runs it up to 24 h ahead and drives the
                          globe's lighting, the page colour, the header clock and the live facts
  assets/vendor/          GSAP (+ ScrollTrigger, SplitText) and Lenis, self-hosted
  assets/fonts/           Bricolage Grotesque and Geist Mono, self-hosted (OFL)
  robots.txt, sitemap.xml
  earth -> ../web         symlink: the live Earth in the hero is the app's own renderer
  assets/screenshots ->   symlink to docs/screenshots (marketing renders + app screenshots)
  assets/icon/            favicon (SVG), Apple touch icon, 512 px app icon
  favicon.ico             16/32/48 px
  .nojekyll               serve files as they are
```

## Preview locally

```bash
python3 -m http.server 8000 --directory site
```

Then open <http://localhost:8000>. Add `?t=2026-06-21T18:00:00Z` to start the page clock at another
moment (useful to check the day, sunrise and night colours).

## Deployment

`.github/workflows/pages.yml` deploys on every push to `main` that touches `site/` or `web/` – but only
while the repository is public. It resolves the symlinks when copying, so `web/` and the screenshots
are included (≈ 20 MB).

One-time setup after making the repository public: **Settings › Pages › Source: GitHub Actions**, then
run the *Website* workflow once (Actions › Website › Run workflow).

The download buttons point to `releases/latest/download/EarthNow.dmg`, which the release workflow
publishes. Keep the EUMETSAT notice visible as long as live clouds are shown (see `CREDITS.md`).
