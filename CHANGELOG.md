# Changelog

All notable changes to Earth Now are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-11-05

The whole Solar System – and the space station – on your desktop.

### New
- **Every planet – and the Moon.** Pick Mercury, Venus, Earth, the Moon, Mars, Jupiter, Saturn,
  Uranus or Neptune in the settings or from the menu bar.
- **Real sunlight everywhere.** Each world is lit exactly as it is right now, calculated from its
  orbit and rotation (JPL orbital elements, IAU rotation models). Day on Mars is where it really is.
- **As Seen from Earth:** a new motion that shows a planet or the Moon exactly as it looks from Earth
  at this moment – the real phase of the Moon with a faint earthshine, Venus as a crescent when it
  passes between us and the Sun.
- **Saturn's rings** with real shadows: the planet shadows its rings, the rings shadow the planet.
- Soft atmospheres for Venus, Mars and the giant planets, and the Moon's and Mercury's bright limbs.
- **Places on other worlds:** Olympus Mons, Valles Marineris, Jezero and Gale crater on Mars; Apollo 11,
  Tycho and the far side of the Moon; Jupiter's Great Red Spot and more. The app remembers your
  place on each world.
- **The Sun** as its own world – in the app with today's image from NASA's Solar Dynamics
  Observatory, sunspots included.
- **Eclipses, live.** During a solar eclipse the Moon's shadow crosses the Earth (within about 100 km
  of NASA's predicted path); during a lunar eclipse the Moon turns red in Earth's shadow.
- **Earth & Moon:** a new view with both, from far away – real sizes, real distance, same phase.
- **The ISS, live.** The International Space Station's real position with its orbit for the next
  90 minutes, updated from CelesTrak twice a day and calculated every frame (SGP4). Shown with
  NASA's official 3D model, solar arrays turning to the Sun like the real ones.
- **Two ISS views:** *ISS Chase* follows the station with Earth's horizon ahead; *Above the ISS*
  floats high above it as it crosses continents and oceans.
- **When to look up:** the info line shows when the ISS will next be visible from your place with the
  naked eye, and how high it will climb.
- **Auroras.** Northern and southern lights on Earth's night side, sized and brightened by NOAA's
  live geomagnetic activity (Kp index). Jupiter and Saturn show their polar auroras too.
- **Moving storms:** Jupiter's and Saturn's cloud bands drift, the Great Red Spot turns.
- New switches: *Show the ISS*, *Show its orbit*, *Aurora & storm animations*. Animations only run
  while they're on screen.
- The time & sun position overlay now also shows the distance from Earth and the aurora activity.

### Notes
- Planet and Moon textures: Solar System Scope, CC BY 4.0 (based on NASA mission data).
- New network requests, each only while the feature is on: `celestrak.org` (ISS orbit),
  `services.swpc.noaa.gov` (aurora activity) and `sdo.gsfc.nasa.gov` (image of the Sun). See SECURITY.md.
- Your settings from version 1 are kept.

[2.0.0]: https://github.com/Hensobo/earth-now/releases/tag/v2.0.0

## [1.0.0] - 2026-11-04

First public release.

### Features
- A 3D Earth as your desktop background, lit by the **real position of the sun** – with twilight,
  city lights on the night side, sun glint on the oceans and a soft atmosphere.
- **Live clouds** from weather satellites, refreshed every three hours. Without internet the app
  falls back to built-in clouds and quietly tries again later.
- **Five views** – Whole Earth, Close-up, Horizon, Side View (Earth left or right) and Far Out – plus
  your own saved views.
- **Your place:** search any city or address (Apple Maps); the camera glides there.
- **Motion:** orbit the Earth, stay above your place, or follow the sun.
- **Easy on the battery:** the frame rate adapts to the actual motion; covered or sleeping screens
  pause completely.
- One window per display, on all Spaces, below your desktop icons – clicks go straight through.
- Menu bar controls, settings window with live preview, **Open at Login**.
- English and German.
- Universal app for Apple Silicon and Intel Macs, macOS 13 Ventura or later.

[1.0.0]: https://github.com/Hensobo/earth-now/releases/tag/v1.0.0
