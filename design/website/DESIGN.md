# Website design (2026 redesign)

Planning notes for `site/`. Keep later passes consistent with these decisions.

## Brief

- **Subject:** Earth Now, a free, open-source macOS app that turns the desktop into a live Earth:
  real sun position (computed locally), city lights at night, live satellite clouds every 3 hours.
- **Audience:** Mac users who like their desktop to look good; designers, developers, space nerds.
- **Job:** make people want the app and download the DMG. Second job: get them past the
  "Apple could not verify" warning on first launch.
- **Language:** English (the site was switched to English on purpose). Owner talks German.
- **Constraints:** static files on GitHub Pages, no build step, no cookies, no trackers,
  **no third-party requests** except the live cloud map the renderer loads. Fonts and libraries
  are self-hosted in `site/assets/`.

## Concepts considered

| | Idea | Anchor | Signature | O / F / Fe / P |
|---|---|---|---|---|
| A. Material: the terminator | Scrolling the page is one turn of the Earth: the page starts at the visitor's real "now" and ends 24 hours later; the globe relights and the page's sky follows the real sun at the visitor's place | the app's core is a real-time day/night line computed from the date | the hero globe (the app's own renderer) relights as you scroll, and the page ground passes through dusk, night, sunrise and day | 4 / 5 / 4 / 2 |
| B. Name: "right now" | Everything is timestamped to the visitor's present: live subsolar point, where the sun is rising now | the product name | a giant live readout of the sun's position as type | 3 / 5 / 4 / 2 |
| C. Material: satellite pass | The page is assembled like a satellite scan: content appears in scan lines every "3 hours" | clouds refresh from geostationary satellites | scan-line reveals | 3 / 3 / 3 / 3 |

**Pick A**, with B's live facts as the narration (clock, subsolar point, sunrise city). Every
number on the page is computed with the same formula the app uses. Nothing is faked.

## Concept card

```
Idea:        Scroll the page and the Earth turns: you start at your own "now" and end 24 hours later.
Metaphor:    one rotation of the planet, as seen from your time zone
Signature:   the hero globe is the real renderer; scroll pushes its clock forward, the terminator
             sweeps over the globe, and the whole page's sky (ground + ink) follows the sun's
             altitude at the visitor's place: night, violet dawn, orange sunrise, blue day
Emotion:     "oh, that's MY time, and that's the real sky right now"
Motion verb: rise over the horizon (things come up from below a line, on a slight arc)
Screenshot:  the giant headline over the night globe with city lights, header clock "+5 h 20 min"
```

## Palette (sky states, interpolated by sun altitude at the visitor's place)

| Role | Hex | Note |
|---|---|---|
| space (hero ground, night) | `#05060D` | not pure black, a hint of blue |
| star (ink on dark) | `#F4F2EE` | |
| deep (ink on light) | `#08101F` | |
| indigo (astronomical twilight) | `#1A1540` | |
| plum (civil twilight) | `#4A2563` | |
| sunrise | `#FF6B3D` | the moment the sun crosses the horizon |
| gold (low sun) | `#FFB860` | |
| sky (day) | `#A9D8FF` | |
| noon | `#D2EBFF` | high sun |
| sodium (accent, CTA on dark) | `#FF8A3D` | the colour of city lights |

Ink is chosen per frame as whichever of star / deep has more contrast on the current ground
(computed in JS), `muted` is ink mixed 28 % toward ground, `line` is ink at 16 %. No-JS and
reduced motion get the real current sky without scrubbing.

## Type

- **Bricolage Grotesque** (variable: opsz 12..96, wdth 75..100, wght 200..800), self-hosted.
  Display: condensed (wdth 78), heavy, tracking -0.045em, leading 0.86. The hero headline's
  **weight follows the light** at the visitor's place (thin at night, heavy in daylight).
  Text: opsz auto, 17 px / 1.55.
- **Geist Mono 500** only for live data (clock, coordinates, city names, specs).

## Grid, rhythm, shape

- 12 columns, gutter `clamp(16px, 2.2vw, 32px)`, outer margin = gutter, max 1600 px.
- Vertical lines: col 1, col 5, col 9. Section padding varies: hero full, statement airy,
  index normal, gallery tight, facts airy, download full, FAQ normal.
- Shape: pills for actions, 12 px for media, 0 everywhere else.

## Motion language

- Ease family: `expo.out` for reveals, `power3.out` for feedback, `expo.inOut` for big moves.
- Reveals: lines rise from a mask with a 3° arc; media rise with `clip-path` from the bottom.
- Buttons: "sunrise" fill: a disc rises from below the button and floods it.
- Nav: letter roll upward. Index rows: title steps right, preview image rises next to the pointer.
- Idle: the globe keeps orbiting slowly (renderer), the clock ticks.

## Sections (layout families, each once)

```
1 Scene      [globe full-bleed, right]  H1 mega left, lead, CTA, live readout bottom
2 Statement  big sentence across 10 cols with live "sun is rising over <city>"
3 Index      rows: title | sentence | spec (mono)  + floating preview
4 Gallery    six views hung at different sizes, deliberate empty cells
5 Pair       desktop screenshot 8 cols | text 4 cols, settings shots below
6 Facts      four true numbers, tabular figures
7 Poster     "Take the Earth home." CTA, 3 real steps, first-launch help
8 Sticky     FAQ: heading sticky left, answers right
9 Footer     giant wordmark, links, EUMETSAT notice
```

Inner page: `info/` (privacy and credits). 404: "Lost in orbit", a far-out Earth.

## Genericness test

- "Dark space site with a globe and blue accent" is where a generic model lands. Changed:
  the page is not dark; its colour is the real sky at your place and changes as you scroll.
- Feature cards grid → an index list with real specs and image previews.
- Eyebrow labels above every heading → removed; mono labels only carry live data.

## Changes after review (Nov 2026)

- **Globe behind the whole page:** the renderer runs with `transparent=1` in one fixed iframe
  behind all content. Big in the hero, then it flies to the right edge (phone: bottom right) at
  ~50 % opacity, so the clock's effect stays visible.
- **Camera locked to the sun** (`motion=sun`, `sunoff=-82`): as the page clock runs, the Earth
  turns underneath, one full rotation over the page, half of it always in daylight.
- **Performance:** only one fixed `.sky` layer and the header backdrop change colour per frame;
  text colours flip with `html.sky-light`, only at the dark/light threshold.
- **Idle:** at rest the globe stands still apart from real time (the planet turns 0.004°/s);
  life at rest comes from the hovers and the ticking clock. Deliberate.
- **Live city names:** chips take their natural width; the paragraph reserves the height it
  needs for the longest names, so nothing below ever moves.
