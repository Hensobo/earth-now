# Contributing to Earth Now

Thanks for wanting to help! Bug reports, ideas and pull requests are all welcome.

## Reporting bugs and ideas

- **Bugs:** [open an issue](https://github.com/Hensobo/earth-now/issues/new/choose) using the bug
  template. Your macOS version, Mac model (Apple Silicon or Intel) and the Earth Now version
  (menu bar › About Earth Now) help a lot.
- **Ideas:** use the feature request template, or start a discussion in an issue first if it's a
  bigger change.
- **Security issues:** please don't open a public issue – see [SECURITY.md](SECURITY.md).

## Development setup

You only need a Mac with the Xcode Command Line Tools (`xcode-select --install`). No Xcode project,
no package manager.

```bash
ARCHS=arm64 ./build.sh   # fast build for your own Mac (use x86_64 on Intel)
open EarthNow.app
```

`./build.sh` without `ARCHS` builds the universal app, `./release.sh` additionally packages a DMG.

### Where things live

| Path | What |
|---|---|
| `app/main.swift` | The macOS app: desktop windows, menu bar, settings (SwiftUI) |
| `app/Localization/` | UI translations (`de.lproj/Localizable.strings`) |
| `web/index.html` | The Earth renderer (three.js / WebGL shaders, sun position) |
| `site/` | The website (GitHub Pages) |
| `design/icon/` | App icon sources and exports |

### Working on the renderer

The renderer is a plain web page, so you can work on it in any browser:

```bash
python3 -m http.server --directory web
```

Then open e.g. `http://localhost:8000/?motion=fixed&lat=52.5&lon=13.4&zoom=2.2&pitch=20&hud=1`.
All URL parameters are documented at the top of `web/index.html`.

### Adding a language

1. Copy `app/Localization/de.lproj` to `<code>.lproj` (e.g. `fr.lproj`) and translate the right-hand
   side of every line.
2. Add the language code to `CFBundleLocalizations` in `build.sh`.
3. Check: `plutil -lint app/Localization/fr.lproj/Localizable.strings`.

## Pull requests

- Keep changes focused – one fix or feature per pull request.
- Describe what you changed and how you tested it; screenshots help for anything visual.
- CI builds the app on macOS for every pull request. It needs to be green.
- Code comments and UI strings are in English (some older comments are still German – feel free to
  translate them when you touch the code).

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE) and
that you follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Releasing (maintainers)

1. Bump the version in `VERSION` and add a section to `CHANGELOG.md`.
2. Merge to `main`. The *Release* workflow builds the DMG and publishes the GitHub Release.
