// Where is the sun – and where is the Earth – as seen from each planet right now?
//
// Positions: JPL "Keplerian Elements for Approximate Positions of the Major Planets"
// (E. M. Standish, valid 1800–2050, error well below 1° for the inner planets).
// Moon: low-precision formulas of the Astronomical Almanac (~0.3°).
// Orientation: IAU WGCCRE 2015 rotation elements (pole and prime meridian),
// without the small periodic terms.
//
// All results are planetocentric latitude/longitude (east-positive) in the
// body-fixed frame, which is how the equirectangular textures are laid out.

const DEG = Math.PI / 180;
const OBLIQUITY = 23.43928 * DEG;
const AU_KM = 149597870.7;

// a [AU], e, I [deg], L [deg], long. perihelion ϖ [deg], long. asc. node Ω [deg] – value and rate per century
const ELEMENTS = {
  mercury: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
  venus:   [0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
  earth:   [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
  mars:    [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
  jupiter: [5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
  saturn:  [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
  uranus:  [19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589],
  neptune: [30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
};

// IAU rotation: pole right ascension α0 = a + da·T, declination δ0 = b + db·T,
// prime meridian W = w + dw·d  (T in Julian centuries, d in days since J2000)
const ROTATION = {
  mercury: [281.0103, -0.0328, 61.4155, -0.0049, 329.5988, 6.1385108],
  venus:   [272.76, 0, 67.16, 0, 160.20, -1.4813688],
  earth:   [0, -0.641, 90, -0.557, 190.147, 360.9856235],
  moon:    [269.9949, 0.0031, 66.5392, 0.0130, 38.3213, 13.17635815],
  mars:    [317.269202, -0.10927547, 54.432516, -0.05827105, 176.049863, 350.891982443297],
  jupiter: [268.056595, -0.006499, 64.495303, 0.002413, 284.95, 870.5360000],
  saturn:  [40.589, -0.036, 83.537, -0.004, 38.90, 810.7939024],
  uranus:  [257.311, 0, -15.175, 0, 203.81, -501.1600928],
  neptune: [299.36, 0, 43.46, 0, 249.978, 541.1397757],
};

const sinD = (x) => Math.sin(x * DEG), cosD = (x) => Math.cos(x * DEG);

/** Heliocentric ecliptic (J2000) position in AU. */
function heliocentric(name, T) {
  const el = ELEMENTS[name];
  const v = (i) => el[i] + el[i + 1] * T;
  const a = v(0), e = v(2), I = v(4), L = v(6), peri = v(8), node = v(10);
  const w = peri - node;
  let M = ((L - peri) % 360 + 540) % 360 - 180;
  // Kepler's equation, Newton iteration (degrees)
  const eDeg = e / DEG;
  let E = M + eDeg * sinD(M);
  for (let i = 0; i < 8; i++) {
    const dE = (M - (E - eDeg * sinD(E))) / (1 - e * cosD(E));
    E += dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  const xp = a * (cosD(E) - e), yp = a * Math.sqrt(1 - e * e) * sinD(E);
  const cw = cosD(w), sw = sinD(w), cO = cosD(node), sO = sinD(node), cI = cosD(I), sI = sinD(I);
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    (sw * sI) * xp + (cw * sI) * yp,
  ];
}

/** Geocentric ecliptic position of the Moon in AU. */
function moonGeocentric(T) {
  const lam = 218.32 + 481267.881 * T
    + 6.29 * sinD(135.0 + 477198.87 * T) - 1.27 * sinD(259.3 - 413335.36 * T)
    + 0.66 * sinD(235.7 + 890534.22 * T) + 0.21 * sinD(269.9 + 954397.74 * T)
    - 0.19 * sinD(357.5 + 35999.05 * T) - 0.11 * sinD(186.5 + 966404.03 * T);
  const bet = 5.13 * sinD(93.3 + 483202.02 * T) + 0.28 * sinD(228.2 + 960400.89 * T)
    - 0.28 * sinD(318.3 + 6003.15 * T) - 0.17 * sinD(217.6 - 407332.21 * T);
  const par = 0.9508 + 0.0518 * cosD(135.0 + 477198.87 * T) + 0.0095 * cosD(259.3 - 413335.36 * T)
    + 0.0078 * cosD(235.7 + 890534.22 * T) + 0.0028 * cosD(269.9 + 954397.74 * T);
  const r = 6378.14 / sinD(par) / AU_KM;
  return [r * cosD(bet) * cosD(lam), r * cosD(bet) * sinD(lam), r * sinD(bet)];
}

/** Heliocentric ecliptic position of any body (planets, Moon). */
function position(name, T) {
  if (name !== 'moon') return heliocentric(name, T);
  const e = heliocentric('earth', T), m = moonGeocentric(T);
  return [e[0] + m[0], e[1] + m[1], e[2] + m[2]];
}

const eclipticToEquatorial = ([x, y, z]) => [
  x,
  y * Math.cos(OBLIQUITY) - z * Math.sin(OBLIQUITY),
  y * Math.sin(OBLIQUITY) + z * Math.cos(OBLIQUITY),
];

/** Equatorial (ICRF) direction → planetocentric lat/lon in the body-fixed frame. */
function bodyLatLon(name, v, d, T) {
  const [a, da, b, db, w, dw] = ROTATION[name];
  const ra = (a + da * T) * DEG, dec = (b + db * T) * DEG, W = ((w + dw * d) % 360) * DEG;
  // body-fixed = Rz(W) · Rx(90° − δ0) · Rz(90° + α0) · v
  let [x, y, z] = v;
  let c = Math.cos(Math.PI / 2 + ra), s = Math.sin(Math.PI / 2 + ra);
  [x, y] = [c * x + s * y, -s * x + c * y];
  c = Math.cos(Math.PI / 2 - dec); s = Math.sin(Math.PI / 2 - dec);
  [y, z] = [c * y + s * z, -s * y + c * z];
  c = Math.cos(W); s = Math.sin(W);
  [x, y] = [c * x + s * y, -s * x + c * y];
  const r = Math.hypot(x, y, z);
  return { lat: Math.asin(z / r) / DEG, lon: Math.atan2(y, x) / DEG };
}

/**
 * Sun and Earth as seen from a body at a moment.
 * @returns {{sun: {lat, lon}, earth: {lat, lon} | null, sunDistance: number, earthDistance: number | null}}
 *   sun/earth: sub-solar and sub-Earth point (planetocentric, degrees);
 *   distances in AU.
 */
export function bodyState(name, date) {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const T = d / 36525;
  const p = position(name, T);
  const toSun = eclipticToEquatorial([-p[0], -p[1], -p[2]]);
  const sun = bodyLatLon(name, toSun, d, T);
  const sunDistance = Math.hypot(...p);
  if (name === 'earth') return { sun, earth: null, sunDistance, earthDistance: null };
  const e = position('earth', T);
  const toEarth = eclipticToEquatorial([e[0] - p[0], e[1] - p[1], e[2] - p[2]]);
  return { sun, earth: bodyLatLon(name, toEarth, d, T), sunDistance, earthDistance: Math.hypot(...toEarth) };
}

/** How fast the body turns (degrees per day, sign = direction). */
export const rotationDegPerDay = (name) => ROTATION[name][5];

/** Heliocentric ecliptic longitude, for tests. */
export function heliocentricLongitude(name, date) {
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  const p = position(name, T);
  return ((Math.atan2(p[1], p[0]) / DEG) + 360) % 360;
}

// Display data per body. radius = scale relative to the view (Saturn shrinks so its rings fit).
export const BODIES = {
  earth:   { name: { en: 'Earth', de: 'Erde' } },
  moon:    { name: { en: 'Moon', de: 'Mond' }, map: 'moon.jpg', fit: 1, ambient: [0.0045, 0.006, 0.009], rough: 0.55 },
  mercury: { name: { en: 'Mercury', de: 'Merkur' }, map: 'mercury.jpg', fit: 1, ambient: [0.0006, 0.0006, 0.0007], rough: 0.55 },
  venus:   { name: { en: 'Venus', de: 'Venus' }, map: 'venus.jpg', fit: 1, ambient: [0.0006, 0.0006, 0.0007], rough: 0.85,
             halo: [1.0, 0.86, 0.6], haloAmt: 0.9 },
  mars:    { name: { en: 'Mars', de: 'Mars' }, map: 'mars.jpg', fit: 1, ambient: [0.0006, 0.0006, 0.0007], rough: 0.7,
             halo: [1.0, 0.62, 0.45], haloAmt: 0.35 },
  jupiter: { name: { en: 'Jupiter', de: 'Jupiter' }, map: 'jupiter.jpg', fit: 1, ambient: [0.0006, 0.0006, 0.0007], rough: 0.85,
             halo: [1.0, 0.92, 0.8], haloAmt: 0.35 },
  saturn:  { name: { en: 'Saturn', de: 'Saturn' }, map: 'saturn.jpg', fit: 0.5, ambient: [0.0006, 0.0006, 0.0007], rough: 0.85,
             halo: [1.0, 0.9, 0.7], haloAmt: 0.3, ring: { map: 'saturn-ring.png', inner: 1.22, outer: 2.32 } },
  uranus:  { name: { en: 'Uranus', de: 'Uranus' }, map: 'uranus.jpg', fit: 1, ambient: [0.0006, 0.0006, 0.0007], rough: 0.9,
             halo: [0.6, 0.92, 1.0], haloAmt: 0.6 },
  neptune: { name: { en: 'Neptune', de: 'Neptun' }, map: 'neptune.jpg', fit: 1, ambient: [0.0006, 0.0006, 0.0007], rough: 0.9,
             halo: [0.45, 0.62, 1.0], haloAmt: 0.6 },
};
