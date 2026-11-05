// Where is the sun – and where is the Earth – as seen from each planet right now?
//
// Positions: JPL "Keplerian Elements for Approximate Positions of the Major Planets"
// (E. M. Standish, valid 1800–2050, error well below 1° for the inner planets).
// Moon: main terms of Meeus' lunar theory (~0.01°).
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

/**
 * Geocentric ecliptic position of the Moon (J2000) in AU.
 * Main periodic terms of Meeus, "Astronomical Algorithms", ch. 47 (~0.01°), then
 * precessed from the equinox of date back to J2000 so it matches the rest of this file.
 */
const MOON_LR = [ // D, M, M', F, Σl (1e-6 °), Σr (m)
  [0, 0, 1, 0, 6288774, -20905355], [2, 0, -1, 0, 1274027, -3699111], [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925], [0, 1, 0, 0, -185116, 48888], [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158], [2, -1, -1, 0, 57066, -152138], [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586], [0, 1, -1, 0, -40923, -129620], [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755], [2, 0, 0, -2, 15327, 10321], [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661], [4, 0, -1, 0, 10675, -34782], [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636], [2, 1, -1, 0, -7888, 24208], [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379], [1, 1, 0, 0, 4987, -16675], [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445], [4, 0, 0, 0, 3861, -11650], [2, 0, -3, 0, 3665, 14403],
  [0, 1, -2, 0, -2689, -7003], [2, 0, -1, 2, -2602, 0], [2, -1, -2, 0, 2390, 10056],
  [1, 0, 1, 0, -2348, 6322], [2, -2, 0, 0, 2236, -9884],
];
const MOON_B = [ // D, M, M', F, Σb (1e-6 °)
  [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693], [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271], [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266], [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463], [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065], [0, 1, -1, -1, -1870], [4, 0, -1, -1, 1828], [0, 1, 0, 1, -1794],
];
function moonGeocentric(T, ofDate = false) {
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = 297.8501921 + 445267.1114034 * T, M = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T, F = 93.2720950 + 483202.0175233 * T;
  const E = 1 - 0.002516 * T;
  let sl = 0, sr = 0, sb = 0;
  for (const [d, m, mp, f, l, r] of MOON_LR) {
    const arg = d * D + m * M + mp * Mp + f * F, e = Math.abs(m) === 1 ? E : m ? E * E : 1;
    sl += l * e * sinD(arg); sr += r * e * cosD(arg);
  }
  for (const [d, m, mp, f, b] of MOON_B) {
    const e = Math.abs(m) === 1 ? E : m ? E * E : 1;
    sb += b * e * sinD(d * D + m * M + mp * Mp + f * F);
  }
  // additive terms (Venus, Jupiter, flattening)
  const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T, A3 = 313.45 + 481266.484 * T;
  sl += 3958 * sinD(A1) + 1962 * sinD(Lp - F) + 318 * sinD(A2);
  sb += -2235 * sinD(Lp) + 382 * sinD(A3) + 175 * sinD(A1 - F) + 175 * sinD(A1 + F) + 127 * sinD(Lp - Mp) - 115 * sinD(Lp + Mp);
  const lam = Lp + sl / 1e6 - (ofDate ? 0 : 1.3969713 * T);   // equinox of date → J2000 (general precession)
  const bet = sb / 1e6;
  const r = (385000.56 + sr / 1000) / AU_KM;
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

/**
 * Sub-solar point on Earth (equinox of date, Astronomical Almanac low-precision formulas, ~0.01°).
 * The Earth view uses this; moonFromEarth() is in the same frame, so eclipses line up.
 */
export function subsolarOfDate(date) {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const g = 357.529 + 0.98560028 * d, q = 280.459 + 0.98564736 * d;
  const L = q + 1.915 * sinD(g) + 0.020 * sinD(2 * g), e = 23.439 - 0.00000036 * d;
  const ra = Math.atan2(cosD(e) * sinD(L), cosD(L)) / DEG, dec = Math.asin(sinD(e) * sinD(L)) / DEG;
  return { lat: dec, lon: wrap180(ra - gmstDeg(d)) };
}
const gmstDeg = (d) => ((18.697374558 + 24.06570982441908 * d) % 24) * 15;
const wrap180 = (a) => ((a % 360) + 540) % 360 - 180;

/**
 * The Moon as seen from the Earth's centre, Earth-fixed (equinox of date, like subsolarOfDate):
 * lat/lon of the sub-lunar point and the distance in Earth radii.
 */
export function moonFromEarth(date) {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const T = d / 36525;
  const [x, y, z] = moonGeocentric(T, true);
  const e = (23.439 - 0.00000036 * d) * DEG;
  const X = x, Y = y * Math.cos(e) - z * Math.sin(e), Z = y * Math.sin(e) + z * Math.cos(e);
  const r = Math.hypot(X, Y, Z);
  return { lat: Math.asin(Z / r) / DEG, lon: wrap180(Math.atan2(Y, X) / DEG - gmstDeg(d)), distance: r * AU_KM / 6378.137 };
}

/** How fast the body turns (degrees per day, sign = direction). */
export const rotationDegPerDay = (name) => ROTATION[name]?.[5] ?? 0;

/** Heliocentric ecliptic longitude, for tests. */
export function heliocentricLongitude(name, date) {
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  const p = position(name, T);
  return ((Math.atan2(p[1], p[0]) / DEG) + 360) % 360;
}

// Display data per body. radius = scale relative to the view (Saturn shrinks so its rings fit).
export const BODIES = {
  sun:     { name: { en: 'Sun', de: 'Sonne' }, fit: 1 },
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
