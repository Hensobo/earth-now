# Credits & licenses

Earth Now is built on the work of others. Thank you!

## Images & data

| Content | Source | License / notice |
|---|---|---|
| Daytime Earth (`web/textures/day.jpg`) | NASA Earth Observatory, *Blue Marble: Next Generation* (October 2004, with topography & bathymetry), Reto Stöckli | Public domain (US government work). Credit: "NASA Earth Observatory" |
| Night lights (`web/textures/night.jpg`) | NASA Earth Observatory, *Black Marble 2016* | Public domain (US government work). Credit: "NASA Earth Observatory / Suomi NPP VIIRS" |
| Static clouds, normal & specular maps (`clouds.png`, `normal.jpg`, `specular.jpg`) | three.js example textures (`examples/textures/planets`) | MIT License, see below |
| Live clouds (loaded at runtime) | [matteason/live-cloud-maps](https://github.com/matteason/live-cloud-maps), images CC0 1.0 | **Required notice:** *Contains modified EUMETSAT data* ([EUMETSAT data licensing](https://www.eumetsat.int/eumetsat-data-licensing)) |

The EUMETSAT notice is shown in the app (settings window, "Display" section, and the About window)
and on the website.

## Software

| Library | Version | License |
|---|---|---|
| [three.js](https://threejs.org) (`web/lib/three.module.min.js`) | 0.160.0 | MIT, full text: [`licenses/three.js-LICENSE.txt`](licenses/three.js-LICENSE.txt) |
| [GSAP](https://gsap.com) with ScrollTrigger and SplitText (`site/assets/vendor/`, website only) | 3.15.1 | GSAP Standard "no charge" license ([gsap.com/standard-license](https://gsap.com/standard-license)) |
| [Lenis](https://github.com/darkroomengineering/lenis) (`site/assets/vendor/lenis.min.js`, website only) | 1.3.27 | MIT |

## Fonts (website only)

| Font | Files | License |
|---|---|---|
| [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) | `site/assets/fonts/bricolage-200_800-normal.woff2` | SIL Open Font License 1.1 |
| [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) | `site/assets/fonts/geist-mono-500-normal.woff2` | SIL Open Font License 1.1 |

## Not affiliated

Earth Now is an independent open-source project. It is not affiliated with, endorsed or sponsored by
NASA, EUMETSAT or Apple. NASA imagery is used under NASA's media usage guidelines; its use does not
imply endorsement.

## Notes for redistribution

- **EUMETSAT data:** EUMETSAT's licensing distinguishes between non-commercial and commercial use for
  some data sets. Earth Now is free and non-commercial. If you build a paid product on this code,
  check the conditions first.
- **Cloud server:** `clouds.matteason.co.uk` is run privately by the author of live-cloud-maps, who
  states the maps may be used for almost any purpose. If your fork gets a lot of users, consider
  hosting the cloud maps yourself – the project's code makes that easy.
