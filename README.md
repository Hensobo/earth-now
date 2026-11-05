<p align="center">
  <img src="design/icon/png/earth-now-256.png" width="128" height="128" alt="Earth Now icon">
</p>

<h1 align="center">Earth Now</h1>

<p align="center">
  <b>The real Earth – and every planet and the ISS – right now, as your Mac's desktop.</b><br>
  Real sunlight and night, glowing cities, live clouds, auroras and the space station passing by.
</p>

<p align="center">
  <a href="https://github.com/Hensobo/earth-now/releases/latest"><img src="https://img.shields.io/github/v/release/Hensobo/earth-now?label=download&color=2f6fde" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/macOS-13%2B-lightgrey" alt="macOS 13 or later">
  <img src="https://img.shields.io/badge/Apple%20Silicon%20%26%20Intel-universal-lightgrey" alt="Universal app">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Hensobo/earth-now" alt="MIT License"></a>
  <a href="https://github.com/Hensobo/earth-now/actions/workflows/ci.yml"><img src="https://github.com/Hensobo/earth-now/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<p align="center">
  <a href="https://github.com/Hensobo/earth-now/releases/latest/download/EarthNow.dmg"><b>⬇ Download for Mac</b></a>
  &nbsp;·&nbsp; <a href="https://hensobo.github.io/earth-now/">Website</a>
  &nbsp;·&nbsp; <a href="#first-launch">First launch</a>
  &nbsp;·&nbsp; <a href="#faq">FAQ</a>
</p>

![Earth Now on a Mac desktop, with the menu bar menu open](docs/screenshots/desktop-menu.jpg)

Earth Now turns your desktop into a window onto our planet, exactly as it looks at this moment. The
sun rises and sets in the right places, cities light up as night falls, and the clouds are only a few
hours old. Glance at it between two emails and you'll know where it's morning, where it's night, and
where the big storms are. It's calm, it's real, and it barely touches your battery.

<p align="center"><img src="docs/screenshots/planets-lineup.jpg" alt="Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Uranus and Neptune" width="100%"></p>

## New in 2.0 – beyond Earth

- 🪐 **Every planet and the Moon** – Mercury to Neptune, each lit by the real Sun right now
  (JPL orbital elements, IAU rotation models). Saturn's rings cast real shadows.
- 🌒 **As Seen from Earth** – the Moon's real phase tonight with a faint earthshine, Venus as a
  crescent when it passes between us and the Sun.
- ☀️ **The Sun** – with today's image from NASA's Solar Dynamics Observatory, sunspots included.
- 🌑 **Eclipses, live** – the Moon's shadow crosses the Earth during solar eclipses (within ~100 km of
  NASA's path), the Moon turns red during lunar eclipses.
- 🌍🌕 **Earth & Moon** – both side by side from far away, at real sizes and distance.
- 🛰️ **The ISS, live** – the space station's real position and orbit, shown with NASA's official 3D
  model (solar arrays track the Sun), plus two views: *ISS Chase* and *Above the ISS*.
- 👀 **When to look up** – the info line tells you when the ISS is next visible from your place.
- 🌌 **Auroras** – northern and southern lights on the night side, sized by NOAA's live geomagnetic
  activity; polar auroras on Jupiter and Saturn.
- 🌀 **Moving storms** on Jupiter and Saturn, the Great Red Spot keeps turning.
- 📍 **Places on other worlds** – Olympus Mons, Jezero crater, Apollo 11, the Great Red Spot …

| | |
|---|---|
| ![ISS Chase](docs/screenshots/planets/iss-chase.jpg) **ISS Chase** – along its real orbit | ![Above the ISS](docs/screenshots/planets/iss-above.jpg) **Above the ISS** – the route ahead |
| ![Saturn](docs/screenshots/planets/saturn.jpg) **Saturn** – rings and shadows | ![Aurora](docs/screenshots/planets/aurora.jpg) **Aurora** – during a geomagnetic storm |
| ![Moon](docs/screenshots/planets/moon-crescent.jpg) **Moon** – tonight's real phase | ![Jupiter](docs/screenshots/planets/jupiter-aurora.jpg) **Jupiter** – drifting bands, polar aurora |
| ![Solar eclipse](docs/screenshots/planets/solar-eclipse.jpg) **Solar eclipse** – 2 August 2027 over Egypt | ![Lunar eclipse](docs/screenshots/planets/lunar-eclipse.jpg) **Lunar eclipse** – 3 March 2026 |
| ![Earth & Moon](docs/screenshots/planets/earth-moon.jpg) **Earth & Moon** – real sizes and distance | ![Sun](docs/screenshots/planets/sun.jpg) **Sun** – live image in the app |

## Features

- 🌗 **Real sunlight** – the sun's position is calculated from the date and time (accurate to about
  0.01°), with twilight, sun glint on the oceans and a soft atmosphere.
- ☁️ **Live clouds** from weather satellites, refreshed every three hours. Offline, built-in clouds
  take over.
- 🌃 **City lights** glow on the night side, from NASA's Black Marble images.
- 🔭 **Five views** – Whole Earth, Close-up, Horizon, Side View (Earth left or right) and Far Out – or
  fine-tune zoom, tilt and framing and save your own.
- 📍 **Your place** – search any city or address and the camera glides there.
- 🛰️ **Motion** – orbit the Earth, stay above your place, or follow the sun.
- 🔋 **Easy on the battery** – the frame rate follows the actual motion (often less than one frame per
  second); covered or sleeping screens pause completely.
- 🖥️ **Every display, every Space** – below your desktop icons, clicks go straight through.
- ⚙️ **Menu bar app** with a settings window and live preview, and **Open at Login**.
- 🇬🇧 🇩🇪 English and German.

## Screenshots

| | |
|---|---|
| ![Whole Earth](docs/screenshots/views/whole-earth.jpg) **Whole Earth** – day, night and twilight | ![Close-up](docs/screenshots/views/close-up.jpg) **Close-up** – your region under real clouds |
| ![Horizon at sunrise](docs/screenshots/views/horizon-sunrise.jpg) **Horizon** – sunrise over the Atlantic | ![City lights](docs/screenshots/views/city-lights.jpg) **City lights** – the night side before dawn |
| ![Side View](docs/screenshots/views/side-view.jpg) **Side View** – room for your icons | ![Far Out](docs/screenshots/views/far-out.jpg) **Far Out** – a quiet, minimal desktop |

| | |
|---|---|
| ![Settings](docs/screenshots/desktop-settings.jpg) **Settings** with a live preview | ![Fine-tuning](docs/screenshots/desktop-settings-display.jpg) **Fine-tuning** – framing, clouds and quality |

All Earth images are real renders from Earth Now. The app screenshots are taken automatically by CI
from the actual app.

## Install

1. [Download `EarthNow.dmg`](https://github.com/Hensobo/earth-now/releases/latest/download/EarthNow.dmg).
2. Open it and drag **Earth Now** onto **Applications**.
3. Start Earth Now from Applications. A globe appears in your menu bar.

**Requirements:** macOS 13 Ventura or later · Apple Silicon or Intel · about 15 MB.

### First launch

Earth Now is free and isn't registered with Apple's paid developer program (yet), so the first time
you open it macOS says it *could not verify* the app. You only need to confirm once:

1. Open Earth Now. When the warning appears, click **Done**.
2. Open **System Settings › Privacy & Security** and scroll down to **Security**.
3. Next to "Earth Now was blocked…", click **Open Anyway** and confirm.

On macOS 13 and 14 you can instead right-click the app, choose **Open** and confirm. Or, in Terminal:

```bash
xattr -dr com.apple.quarantine /Applications/EarthNow.app
```

Every release is built by [GitHub Actions](.github/workflows/release.yml) straight from this source
code. The checksum (`EarthNow.dmg.sha256`) is attached to each release.

## Using Earth Now

Click the **globe in the menu bar** to switch views and motion, turn on **Open at Login**, or open
**Settings…** (⌘,). Opening the app again from Applications also opens the settings.

In the settings you can:

- pick a **view**, or adjust **zoom, pitch, heading, rotation, field of view and framing** and save
  it as your own view (right-click to delete it again),
- **search a place** or pick one of the quick places,
- choose the **motion** and the orbit **speed**,
- switch **clouds** between live, static and off, show the **time & sun position**, and turn on
  **maximum quality** (60 fps, full resolution).

## FAQ

**Does it replace my wallpaper?** No. Earth Now places its own layer between your wallpaper and your
desktop icons. Quit it and your wallpaper is back.

**Does it drain my battery?** Barely – see "Easy on the battery" above. *Maximum quality* uses more power.

**What happens without internet?** Everything keeps working with built-in clouds. Earth Now quietly
tries again later.

**How do I uninstall it?** Quit it from the globe menu (turn off "Open at Login" first if you enabled
it) and move it to the Trash. Settings live in `~/Library/Preferences/io.github.hensobo.earthnow.plist`.

**Why isn't it in the Mac App Store?** That, and getting rid of the first-launch warning, needs a paid
Apple developer membership. For now it's distributed for free here.

**Privacy?** The app collects nothing: no analytics, no accounts, no background update checks. It only
downloads public data (cloud map, ISS orbit, aurora activity) and, when you search for a place, sends
the search text to Apple Maps. See [SECURITY.md](SECURITY.md) for details.

**How exact is the ISS?** Within a few kilometres: the orbit comes from CelesTrak twice a day and is
propagated with SGP4. In both ISS views the camera is hundreds of kilometres away – high enough for a
sharp Earth – so the station is drawn enlarged; at true size it would be a few pixels.

## Build from source

You need a Mac with the Xcode Command Line Tools (`xcode-select --install`) – no Xcode project.

```bash
./build.sh            # universal EarthNow.app (Apple Silicon + Intel)
open EarthNow.app
./release.sh          # also packages dist/EarthNow-<version>.dmg
```

The Earth itself is a web page you can try in any browser:

```bash
python3 -m http.server --directory web
```

Then open e.g. <http://localhost:8000/?motion=fixed&lat=52.5&lon=13.4&zoom=2.2&pitch=20&hud=1>.
All parameters are listed at the top of [`web/index.html`](web/index.html).

```
app/main.swift        macOS app: desktop windows, menu bar, settings (SwiftUI)
app/Localization/     UI translations
web/index.html        renderer (three.js / WebGL shaders, sun position, auroras)
web/planets.js        planet & Moon positions and rotation (tests: web/tests/run.sh)
web/iss.js            ISS: orbit (SGP4), marker, NASA 3D model, camera views
web/models/iss.glb    NASA's ISS model, reduced (design/iss)
web/textures/         NASA Earth textures (8K day, 4K night) and helper maps
site/                 website (GitHub Pages)
design/               app icon and marketing images
```

## Contributing

Bug reports, ideas and pull requests are very welcome – see [CONTRIBUTING.md](CONTRIBUTING.md) and
the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues: [SECURITY.md](SECURITY.md).

## Credits & license

Earth imagery: **NASA Earth Observatory** (Blue Marble, Black Marble). Live clouds:
[matteason/live-cloud-maps](https://github.com/matteason/live-cloud-maps) – *contains modified
EUMETSAT data*. Planets & Moon: [Solar System Scope](https://www.solarsystemscope.com/textures/)
(CC BY 4.0). ISS orbit: [CelesTrak](https://celestrak.org). Aurora activity: NOAA SWPC. 3D:
[three.js](https://threejs.org), SGP4: [satellite.js](https://github.com/shashwatak/satellite-js)
(both MIT). Full details in [CREDITS.md](CREDITS.md).

Earth Now is open source under the [MIT License](LICENSE). It is an independent project and not
affiliated with, endorsed or sponsored by NASA, EUMETSAT or Apple.
