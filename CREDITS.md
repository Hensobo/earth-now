# Credits & licenses

Earth Now is built on the work of others. Thank you!

## Images & data

| Content | Source | License / notice |
|---|---|---|
| Daytime Earth (`web/textures/day.jpg`) | NASA Earth Observatory, *Blue Marble: Next Generation* (October 2004, with topography & bathymetry), Reto Stöckli | Public domain (US government work). Credit: "NASA Earth Observatory" |
| Night lights (`web/textures/night.jpg`) | NASA Earth Observatory, *Black Marble 2016* | Public domain (US government work). Credit: "NASA Earth Observatory / Suomi NPP VIIRS" |
| Static clouds, normal & specular maps (`clouds.png`, `normal.jpg`, `specular.jpg`) | three.js example textures (`examples/textures/planets`) | MIT License, see below |
| Planets & Moon (`web/textures/planets/*`) | [Solar System Scope](https://www.solarsystemscope.com/textures/), based on NASA mission data; downloaded and resized by `design/planets/fetch-textures.sh` | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit: "Solar System Scope". Resized, otherwise unchanged |
| Planet positions & rotation | JPL *Keplerian Elements for Approximate Positions of the Major Planets* (E. M. Standish), IAU WGCCRE rotation elements, J. Meeus *Astronomical Algorithms* (Moon) | Published formulas and constants |
| ISS 3D model (`web/models/iss.glb`) | NASA, *International Space Station (ISS) (D) (IGOAL)* from [NASA-3D-Resources](https://github.com/nasa/NASA-3D-Resources), reduced (see `design/iss`) | NASA media, no copyright; NASA's media usage guidelines apply |
| Image of the Sun (loaded at runtime by the app) | NASA Solar Dynamics Observatory, HMI | Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams |
| ISS orbit (loaded at runtime, fallback in `web/data/iss.tle`) | [CelesTrak](https://celestrak.org) (T. S. Kelso) | Public orbital data (NORAD 25544) |
| Aurora activity (loaded at runtime) | NOAA Space Weather Prediction Center, planetary K-index | Public domain (US government work) |
| Live clouds (loaded at runtime) | [matteason/live-cloud-maps](https://github.com/matteason/live-cloud-maps), images CC0 1.0 | **Required notice:** *Contains modified EUMETSAT data* ([EUMETSAT data licensing](https://www.eumetsat.int/eumetsat-data-licensing)) |

The EUMETSAT notice is shown in the app (settings window, "Display" section, and the About window)
and on the website.

## Software

| Library | Version | License |
|---|---|---|
| [three.js](https://threejs.org) (`web/lib/three.module.min.js`) | 0.160.0 | MIT, full text: [`licenses/three.js-LICENSE.txt`](licenses/three.js-LICENSE.txt) |
| [satellite.js](https://github.com/shashwatak/satellite-js) (`web/lib/satellite.min.js`, SGP4 subset) | 7.1.0 | MIT, full text: [`licenses/satellite.js-LICENSE.txt`](licenses/satellite.js-LICENSE.txt) |
| three.js GLTFLoader + MeshoptDecoder (`web/lib/gltf.min.js`) | 0.160.0 | MIT (same as three.js) |

## Not affiliated

Earth Now is an independent open-source project. It is not affiliated with, endorsed or sponsored by
NASA, EUMETSAT, NOAA, CelesTrak, Solar System Scope or Apple. NASA imagery is used under NASA's media usage guidelines; its use does not
imply endorsement.

## Notes for redistribution

- **EUMETSAT data:** EUMETSAT's licensing distinguishes between non-commercial and commercial use for
  some data sets. Earth Now is free and non-commercial. If you build a paid product on this code,
  check the conditions first.
- **Cloud server:** `clouds.matteason.co.uk` is run privately by the author of live-cloud-maps, who
  states the maps may be used for almost any purpose. If your fork gets a lot of users, consider
  hosting the cloud maps yourself – the project's code makes that easy.
