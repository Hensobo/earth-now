// The International Space Station, live: position from its current orbit (TLE from
// CelesTrak, propagated with SGP4), a marker with its orbit in the normal Earth views,
// and a small 3D model for the two ISS camera views (chase and above).
//
// Units: the main scene uses Earth radii (Earth-fixed frame, see latLonToVec in
// index.html). The model lives in its own scene in metres with the ISS at the origin,
// so the 109 m station stays sharp next to a 6378 km planet.

import * as THREE from './lib/three.module.min.js';
import { twoline2satrec, propagate, gstime, eciToGeodetic, eciToEcf } from './lib/satellite.min.js';

const R_EARTH_KM = 6378.137;
const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';

// ECF (km, z = north) → scene (Earth radii, y = north, matches latLonToVec)
const toScene = (p, out = new THREE.Vector3()) => out.set(p.x, p.z, -p.y).divideScalar(R_EARTH_KM);

export class ISS {
  constructor(onChange) {
    this.onChange = onChange;
    this.satrec = null;
    this.live = false;            // orbit from CelesTrak (true) or the bundled fallback
    this.retryAt = 0; this.failures = 0; this.loading = false;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.lat = 0; this.lon = 0; this.alt = 0; this.speed = 0;

    // --- marker (visible in the Earth views) ---
    this.marker = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3)),
      new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, size: { value: 16 * Math.min(devicePixelRatio, 2) } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `uniform float size; void main() { gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float time;
          void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float core = smoothstep(0.32, 0.12, d);
            float ring = smoothstep(0.06, 0.0, abs(d - fract(time * 0.5) * 0.9 - 0.1)) * (1.0 - fract(time * 0.5));
            gl_FragColor = vec4(vec3(1.0, 0.86, 0.55) * (core + ring * 0.7), 1.0);
          }`,
      }));
    this.marker.frustumCulled = false;

    // --- orbit path: 45 min back (dim) to 95 min ahead (bright) ---
    this.pathSteps = 140;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.pathSteps * 3), 3));
    const col = new Float32Array(this.pathSteps * 3);
    for (let i = 0; i < this.pathSteps; i++) {
      const t = i / (this.pathSteps - 1);           // 0 = past end, 1 = future end
      const now = 45 / 140;
      const a = t < now ? 0.12 + 0.25 * (t / now) : 0.75 * (1 - 0.7 * (t - now) / (1 - now));
      col.set([a, a * 0.85, a * 0.55], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.path = new THREE.Line(g, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.path.frustumCulled = false;
    this.pathUpdated = 0;

    // --- 3D model in its own scene (metres) ---
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.5, 20000);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 3.2);
    this.earthLight = new THREE.HemisphereLight(0x6f8fbf, 0x000000, 0.35);  // light reflected by Earth
    this.scene.add(this.sunLight, this.sunLight.target, this.earthLight);
    this.model = buildModel();
    this.scene.add(this.model);
  }

  /** Orbit data: CelesTrak, else the copy bundled with the app (web/data/iss.tle). */
  async load() {
    if (this.loading || Date.now() < this.retryAt) return;
    this.loading = true;
    try {
      const text = await fetch(TLE_URL).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
      this.useTLE(text, true);
      this.failures = 0;
      this.retryAt = Date.now() + 12 * 3600 * 1000;
    } catch {
      this.failures++;
      this.retryAt = Date.now() + Math.min(120, 2 ** (this.failures - 1)) * 60 * 1000;
      if (!this.satrec) {
        try { this.useTLE(await fetch('data/iss.tle').then((r) => r.text()), false); } catch { /* no orbit, no ISS */ }
      }
    } finally {
      this.loading = false;
    }
  }

  useTLE(text, live) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^[12] /.test(l));
    if (lines.length < 2) throw new Error('no TLE');
    this.satrec = twoline2satrec(lines[0], lines[1]);
    this.live = live;
    this.pathUpdated = 0;
    this.onChange?.();
  }

  get ready() { return !!this.satrec; }

  /** Position in Earth-fixed scene coordinates at `date`. */
  at(date, out = new THREE.Vector3()) {
    const pv = propagate(this.satrec, date);
    if (!pv || !pv.position) return null;
    return toScene(eciToEcf(pv.position, gstime(date)), out);
  }

  update(date, sunDir, time) {
    if (!this.satrec) return false;
    const pv = propagate(this.satrec, date);
    if (!pv || !pv.position) return false;
    const gmst = gstime(date);
    toScene(eciToEcf(pv.position, gmst), this.pos);
    const ahead = this.at(new Date(date.getTime() + 1000));
    if (ahead) this.vel.subVectors(ahead, this.pos);           // Earth-fixed, per second
    const geo = eciToGeodetic(pv.position, gmst);
    this.lat = geo.latitude * 180 / Math.PI;
    this.lon = geo.longitude * 180 / Math.PI;
    this.alt = geo.height;
    this.speed = Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) * 3600;  // km/h, inertial

    this.marker.geometry.attributes.position.array.set([this.pos.x, this.pos.y, this.pos.z]);
    this.marker.geometry.attributes.position.needsUpdate = true;
    this.marker.material.uniforms.time.value = time;

    // Orbit path every 20 s is plenty
    if (Math.abs(date.getTime() - this.pathUpdated) > 20000) {
      this.pathUpdated = date.getTime();
      const arr = this.path.geometry.attributes.position.array, p = new THREE.Vector3();
      for (let i = 0; i < this.pathSteps; i++) {
        const t = new Date(date.getTime() + (i - 45) * 60000);
        if (this.at(t, p)) arr.set([p.x, p.y, p.z], i * 3);
      }
      this.path.geometry.attributes.position.needsUpdate = true;
    }

    // In Earth's shadow?  (cylinder approximation is fine at 400 km)
    const s = this.pos.dot(sunDir);
    this.inShadow = s < 0 && this.pos.lengthSq() - s * s < 1;
    return true;
  }

  /** Local frame: forward (along track), up (away from Earth), right. */
  frame(f, u, r) {
    u.copy(this.pos).normalize();
    f.copy(this.vel).addScaledVector(u, -this.vel.dot(u)).normalize();
    r.crossVectors(f, u);
  }

  /** Orients the model (LVLH attitude), turns the solar arrays to the sun, lights it. */
  pose(sunDir, f, u, r) {
    // model axes: x = forward, y = up, z = right (metres)
    const m = new THREE.Matrix4().makeBasis(f, u, r);
    this.model.quaternion.setFromRotationMatrix(m);
    const local = sunDir.clone().applyQuaternion(this.model.quaternion.clone().invert());
    // arrays rotate about the truss (z axis) to face the sun
    const angle = Math.atan2(local.x, local.y);
    for (const w of this.model.userData.wings) w.rotation.z = -angle;
    this.sunLight.position.copy(sunDir).multiplyScalar(1000);
    this.sunLight.intensity = this.inShadow ? 0 : 3.2;
    this.earthLight.position.copy(u).multiplyScalar(-1);     // sky colour comes from below
    this.earthLight.intensity = this.inShadow ? 0.08 : 0.45;
  }
}

// A simplified ISS: integrated truss, 8 solar array wings, radiators, pressurised modules.
function buildModel() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.7, roughness: 0.45 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e7e1, metalness: 0.1, roughness: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc8a04a, metalness: 0.8, roughness: 0.35 });

  // solar cell texture: dark blue cells with thin grid
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#c7a25a'; x.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 16; j++) {
    x.fillStyle = j % 2 ? '#1d2a52' : '#22305c'; x.fillRect(3 + i * 31, 3 + j * 16, 27, 13);
  }
  const cells = new THREE.CanvasTexture(c); cells.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.MeshStandardMaterial({ map: cells, metalness: 0.35, roughness: 0.35, side: THREE.DoubleSide });

  const box = (w, h, d, mat, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(px, py, pz); g.add(m); return m; };
  const cyl = (rad, len, mat, px, py, pz, axis = 'x') => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 24), mat);
    if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2;
    m.position.set(px, py, pz); g.add(m); return m;
  };

  // truss along z (starboard/port), 109 m
  box(4, 3, 96, metal, 0, 3.5, 0);
  // pressurised modules along x (flight direction)
  cyl(2.1, 8.5, white, 6, 0, 0);          // Destiny lab
  cyl(2.2, 6, white, 12.5, 0, 0);         // Harmony node
  cyl(2.1, 7, white, 18, 0, -5, 'z');     // Columbus / Kibo stubs
  cyl(2.1, 10, white, 18, 0, 5.5, 'z');
  cyl(2.2, 5, white, 0, 0, 0);            // Unity
  cyl(2.0, 12, white, -9, 0, 0);          // Zarya
  cyl(2.0, 13, white, -21.5, 0, 0);       // Zvezda
  box(1.2, 0.1, 10, gold, -21.5, 0, 0);   // Zvezda's small arrays (simplified)
  // radiators (white panels below the truss)
  for (const z of [-14, 14]) for (const k of [0, 1, 2]) box(3.4, 0.15, 7, white, -3 + k * 4, -4.5, z);

  // 8 solar array wings: pairs at both truss ends, each 35 m × 12 m, on rotating joints
  const wings = [];
  for (const zEnd of [-40, -32, 32, 40]) {
    const joint = new THREE.Group(); joint.position.set(0, 3.5, zEnd); g.add(joint);
    for (const dir of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(12, 35), panel);
      w.rotation.x = -Math.PI / 2;                 // lie flat (x–z plane), long side along x
      w.rotation.z = Math.PI / 2;
      w.position.set(dir * 19.5, 0, 0);
      joint.add(w);
      const mast = new THREE.Mesh(new THREE.BoxGeometry(37, 0.3, 0.3), metal);
      mast.position.set(dir * 19.5, 0, 0); joint.add(mast);
    }
    wings.push(joint);
  }
  g.userData.wings = wings;
  return g;
}
