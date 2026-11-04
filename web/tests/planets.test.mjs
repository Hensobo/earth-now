import { bodyState, heliocentricLongitude } from './planets.mjs'  // copied from ../planets.js by run.sh;
const DEG = Math.PI / 180;
// V1 formula for comparison
function subsolarV1(date) {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const g = (357.529 + 0.98560028 * d) * DEG, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG, e = (23.439 - 0.00000036 * d) * DEG;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / DEG, dec = Math.asin(Math.sin(e) * Math.sin(L)) / DEG;
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  return { lat: dec, lon: ((ra - gmst * 15 + 540) % 360) - 180 };
}
const ang = (a, b) => { // angle between two lat/lon directions
  const v = (p) => [Math.cos(p.lat*DEG)*Math.cos(p.lon*DEG), Math.cos(p.lat*DEG)*Math.sin(p.lon*DEG), Math.sin(p.lat*DEG)];
  const x = v(a), y = v(b); return Math.acos(Math.min(1, x[0]*y[0]+x[1]*y[1]+x[2]*y[2])) / DEG;
};
const wrap = (x) => ((x % 360) + 540) % 360 - 180;
let fails = 0; const check = (label, val, max) => { const ok = Math.abs(val) <= max; if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${val.toFixed(2)} (max ${max})`); };

for (const t of ['2026-03-20T12:00:00Z', '2026-06-21T06:00:00Z', '2026-11-04T21:00:00Z', '2030-01-01T00:00:00Z']) {
  const d = new Date(t), a = bodyState('earth', d).sun, b = subsolarV1(d);
  check(`Earth subsolar vs V1 ${t}`, ang(a, b), 0.5);
}
for (const [p, t] of [['jupiter', '2026-01-10T08:00:00Z'], ['saturn', '2025-09-21T05:00:00Z'], ['mars', '2025-01-16T02:00:00Z'], ['venus', '2025-03-23T01:00:00Z']]) {
  const d = new Date(t); check(`${p} aligned with Earth (opposition/inf. conj.) ${t}`, wrap(heliocentricLongitude(p, d) - heliocentricLongitude('earth', d)), 1.5);
  check(`${p} phase angle at ${t}`, ang(bodyState(p, d).sun, bodyState(p, d).earth) - (p === 'venus' ? 180 : 0), p === 'venus' ? 14 : 4);
}
const full = new Date('2025-09-07T18:09:00Z'), nu = new Date('2025-09-21T19:54:00Z'), q1 = new Date('2025-09-29T23:54:00Z');
check('Moon phase angle at full moon', ang(bodyState('moon', full).sun, bodyState('moon', full).earth), 3);
check('Moon phase angle at new moon - 180', ang(bodyState('moon', nu).sun, bodyState('moon', nu).earth) - 180, 6);
check('Moon phase angle at first quarter - 90', ang(bodyState('moon', q1).sun, bodyState('moon', q1).earth) - 90, 3);
let maxLib = 0;
for (let i = 0; i < 400; i++) { const e = bodyState('moon', new Date(Date.UTC(2026, 0, 1) + i * 86400000 * 0.9)).earth; maxLib = Math.max(maxLib, Math.abs(e.lat), Math.abs(e.lon)); }
check('Moon libration (sub-Earth point stays near 0/0)', maxLib - 8, 2);
const st = bodyState('mars', new Date('2026-11-04T21:00:00Z'));
console.log('Mars now: sub-solar', st.sun, 'sub-Earth', st.earth, 'Earth distance AU', st.earthDistance.toFixed(3));
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
