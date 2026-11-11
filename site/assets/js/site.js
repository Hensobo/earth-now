/* Earth Now website.
 *
 * One driver: the page's clock. It starts at the visitor's real "now" and runs up to 24 hours
 * ahead as they scroll. From that one value come the hero globe's lighting (the app's own
 * renderer in an iframe), the colour of the page (the sky at the visitor's place), the weight
 * of the big type, the header clock, the sun's position and the sunrise / sunset cities.
 * Everything runs on GSAP's ticker. Nothing leaves the browser: the place is guessed from the
 * time zone setting, not from location services.
 */
(() => {
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DEG = Math.PI / 180;
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------------------------------------------------------------- sun (same formula as the app)
  function subsolar(date) {
    const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
    const g = (357.529 + 0.98560028 * d) * DEG;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;
    const e = (23.439 - 0.00000036 * d) * DEG;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / DEG;
    const dec = Math.asin(Math.sin(e) * Math.sin(L)) / DEG;
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const lon = ((ra - gmst * 15 + 540) % 360 + 360) % 360 - 180;
    return { lat: dec, lon };
  }
  const wrap180 = (x) => ((x + 540) % 360 + 360) % 360 - 180;
  function altitude(lat, lon, sun) {
    const H = wrap180(lon - sun.lon) * DEG;
    const s = Math.sin(lat * DEG) * Math.sin(sun.lat * DEG) + Math.cos(lat * DEG) * Math.cos(sun.lat * DEG) * Math.cos(H);
    return Math.asin(Math.max(-1, Math.min(1, s))) / DEG;
  }

  // ---------------------------------------------------------------- places
  // [name, lat, lon, time zone]. Used for the visitor's place (by time zone) and for the
  // "sun is coming up over ..." line.
  const CITIES = [
    ['Berlin', 52.52, 13.40, 'Europe/Berlin'], ['London', 51.51, -0.13, 'Europe/London'], ['Paris', 48.86, 2.35, 'Europe/Paris'],
    ['Madrid', 40.42, -3.70, 'Europe/Madrid'], ['Lisbon', 38.72, -9.14, 'Europe/Lisbon'], ['Rome', 41.90, 12.50, 'Europe/Rome'],
    ['Vienna', 48.21, 16.37, 'Europe/Vienna'], ['Zurich', 47.37, 8.54, 'Europe/Zurich'], ['Amsterdam', 52.37, 4.90, 'Europe/Amsterdam'],
    ['Stockholm', 59.33, 18.07, 'Europe/Stockholm'], ['Helsinki', 60.17, 24.94, 'Europe/Helsinki'], ['Athens', 37.98, 23.73, 'Europe/Athens'],
    ['Istanbul', 41.01, 28.98, 'Europe/Istanbul'], ['Moscow', 55.76, 37.62, 'Europe/Moscow'], ['Warsaw', 52.23, 21.01, 'Europe/Warsaw'],
    ['Prague', 50.08, 14.44, 'Europe/Prague'], ['Copenhagen', 55.68, 12.57, 'Europe/Copenhagen'], ['Oslo', 59.91, 10.75, 'Europe/Oslo'],
    ['Dublin', 53.35, -6.26, 'Europe/Dublin'], ['Brussels', 50.85, 4.35, 'Europe/Brussels'], ['Reykjavík', 64.15, -21.94, 'Atlantic/Reykjavik'],
    ['Cairo', 30.04, 31.24, 'Africa/Cairo'], ['Lagos', 6.52, 3.38, 'Africa/Lagos'], ['Nairobi', -1.29, 36.82, 'Africa/Nairobi'],
    ['Johannesburg', -26.20, 28.05, 'Africa/Johannesburg'], ['Casablanca', 33.57, -7.59, 'Africa/Casablanca'], ['Kinshasa', -4.44, 15.27, 'Africa/Kinshasa'],
    ['Dubai', 25.20, 55.27, 'Asia/Dubai'], ['Tehran', 35.69, 51.39, 'Asia/Tehran'], ['Karachi', 24.86, 67.00, 'Asia/Karachi'],
    ['Mumbai', 19.08, 72.88, 'Asia/Kolkata'], ['Dhaka', 23.81, 90.41, 'Asia/Dhaka'], ['Almaty', 43.24, 76.89, 'Asia/Almaty'],
    ['Bangkok', 13.76, 100.50, 'Asia/Bangkok'], ['Jakarta', -6.20, 106.85, 'Asia/Jakarta'], ['Singapore', 1.35, 103.82, 'Asia/Singapore'],
    ['Hong Kong', 22.32, 114.17, 'Asia/Hong_Kong'], ['Shanghai', 31.23, 121.47, 'Asia/Shanghai'], ['Manila', 14.60, 120.98, 'Asia/Manila'],
    ['Seoul', 37.57, 126.98, 'Asia/Seoul'], ['Tokyo', 35.68, 139.69, 'Asia/Tokyo'], ['Ulaanbaatar', 47.89, 106.91, 'Asia/Ulaanbaatar'],
    ['Vladivostok', 43.12, 131.89, 'Asia/Vladivostok'], ['Perth', -31.95, 115.86, 'Australia/Perth'], ['Sydney', -33.87, 151.21, 'Australia/Sydney'],
    ['Melbourne', -37.81, 144.96, 'Australia/Melbourne'], ['Auckland', -36.85, 174.76, 'Pacific/Auckland'], ['Suva', -18.14, 178.44, 'Pacific/Fiji'],
    ['Honolulu', 21.31, -157.86, 'Pacific/Honolulu'], ['Anchorage', 61.22, -149.90, 'America/Anchorage'], ['Vancouver', 49.28, -123.12, 'America/Vancouver'],
    ['Los Angeles', 34.05, -118.24, 'America/Los_Angeles'], ['Denver', 39.74, -104.99, 'America/Denver'], ['Mexico City', 19.43, -99.13, 'America/Mexico_City'],
    ['Chicago', 41.88, -87.63, 'America/Chicago'], ['Toronto', 43.65, -79.38, 'America/Toronto'], ['New York', 40.71, -74.01, 'America/New_York'],
    ['Halifax', 44.65, -63.57, 'America/Halifax'], ['Bogotá', 4.71, -74.07, 'America/Bogota'], ['Lima', -12.05, -77.04, 'America/Lima'],
    ['Santiago', -33.45, -70.67, 'America/Santiago'], ['Buenos Aires', -34.60, -58.38, 'America/Argentina/Buenos_Aires'],
    ['São Paulo', -23.55, -46.63, 'America/Sao_Paulo'], ['Nuuk', 64.18, -51.72, 'America/Nuuk'], ['Praia', 14.93, -23.51, 'Atlantic/Cape_Verde'],
  ];
  const place = (() => {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
    const hit = CITIES.find((c) => c[3] === tz);
    if (hit) return { name: hit[0], lat: hit[1], lon: hit[2], known: true };
    // Unknown zone: the longitude that matches the clock offset, mid-latitudes.
    return { name: '', lat: 40, lon: wrap180(-new Date().getTimezoneOffset() / 60 * 15), known: false };
    // Restored scroll position (reload, Back, bfcache): set the header state right away.
  const syncHeader = () => html.classList.toggle('is-scrolled', scrollY > 40);
  syncHeader();
  addEventListener('pageshow', (e) => { syncHeader(); if (e.persisted) ScrollTrigger.refresh(); });
})();

  // Test hook: ?t=2026-06-21T18:00:00Z starts the page clock at another moment (screenshots).
  const tParam = Date.parse(new URLSearchParams(location.search).get('t') || '');
  const start = Date.now();
  const base = () => (Number.isFinite(tParam) ? tParam + (Date.now() - start) : Date.now());

  // ---------------------------------------------------------------- sky colours
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const lum = (c) => {
    const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const STAR = hex('#f4f2ee'), DEEP = hex('#08101f'), SODIUM = '#ff8a3d';
  const STOPS = [
    [-90, '#05060d'], [-14, '#05060d'], [-9, '#1a1540'], [-4, '#4a2563'],
    [0, '#ff6b3d'], [5, '#ffb860'], [8, '#ffc9a8'], [11, '#e3cdf2'], [15, '#a9d8ff'], [45, '#d2ebff'], [90, '#d2ebff'],
  ].map(([a, h]) => [a, hex(h)]);
  function skyAt(alt) {
    for (let i = 1; i < STOPS.length; i++) {
      if (alt <= STOPS[i][0]) {
        const [a0, c0] = STOPS[i - 1], [a1, c1] = STOPS[i];
        return mix(c0, c1, (alt - a0) / (a1 - a0));
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  // Only two things change per frame: the colour of one fixed layer (.sky) and the header's
  // backdrop. Text colours flip with a class, only when the sky crosses from dark to light.
  // Nothing else on the page is restyled or repainted while scrolling.
  const SPACE = hex('#05060d');
  const skyEl = qs('.sky'), topEl = qs('.top'), metaEl = qs('meta[name="theme-color"]');
  let lastSky = '', lastLight = null, lastMeta = 0;
  function paintSky(alt, k) {             // k: 0 = deep space (hero), 1 = the sky over the place
    const ground = mix(SPACE, skyAt(alt), k);
    const key = toHex(ground);
    if (key !== lastSky) {
      lastSky = key;
      if (skyEl) skyEl.style.backgroundColor = key;
      if (topEl) topEl.style.setProperty('--hdr', key);
    }
    const light = contrast(DEEP, ground) > contrast(STAR, ground);
    if (light !== lastLight) { lastLight = light; html.classList.toggle('sky-light', light); }
    const t = performance.now();
    if (metaEl && t - lastMeta > 500) { lastMeta = t; metaEl.content = key; }
  }

  // ---------------------------------------------------------------- readouts
  const el = {
    clock: qsa('[data-clock]'), ahead: qsa('[data-ahead]'), place: qsa('[data-place]'), placeName: qsa('[data-place-name]'),
    subsolar: qsa('[data-subsolar]'), sunrise: qsa('[data-sunrise]'), sunset: qsa('[data-sunset]'),
  };
  const setText = (list, t) => list.forEach((n) => { if (n.textContent !== t) n.textContent = t; });
  const fmtTime = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const coord = (v, p, n) => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? p : n}`;
  setText(el.place, place.known ? `in ${place.name}` : '');
  setText(el.placeName, place.known ? place.name : 'your time zone');

  function edgeCities(sun) {
    let rise = null, set = null;
    for (const c of CITIES) {
      const a = Math.abs(altitude(c[1], c[2], sun));
      if (a > 7) continue;
      const morning = wrap180(c[2] - sun.lon) < 0;
      if (morning && (!rise || a < rise.a)) rise = { n: c[0], a };
      if (!morning && (!set || a < set.a)) set = { n: c[0], a };
    }
    return { rise: rise && rise.n, set: set && set.n };
  }

  // ---------------------------------------------------------------- the driver
  let hours = 0;              // how far the page clock runs ahead of now
  let earthWin = null;        // the renderer's window once the iframe has loaded
  let heroK = qs('[data-hero]') ? 0 : 1;   // how far the hero has handed over to the sky
  let lastEarthHours = -1, lastWght = 0, citiesLive = true;
  const wghtEls = qsa('[data-wght]');
  function apply() {
    const date = new Date(base() + hours * 3600000);
    const sun = subsolar(date);
    const alt = altitude(place.lat, place.lon, sun);
    paintSky(alt, heroK);
    const w = Math.round(gsap.utils.clamp(560, 800, gsap.utils.mapRange(-10, 12, 560, 800, alt)) / 10) * 10;
    if (w !== lastWght) { lastWght = w; wghtEls.forEach((n) => n.style.setProperty('--wght', String(w))); }
    setText(el.clock, fmtTime.format(date));
    const mins = Math.round(hours * 60);
    setText(el.ahead, mins < 1 ? 'Live' : `+${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min`);
    setText(el.subsolar, `${coord(sun.lat, 'N', 'S')}, ${coord(sun.lon, 'E', 'W')}`);
    if (citiesLive) {
      const edge = edgeCities(sun);
      if (edge.rise) setText(el.sunrise, edge.rise);
      if (edge.set) setText(el.sunset, edge.set);
    }
    if (earthWin && Math.abs(hours - lastEarthHours) > 0.002) {
      lastEarthHours = hours;
      try { earthWin.setTimeOffset && earthWin.setTimeOffset(hours); } catch {}
    }
  }

  // ---------------------------------------------------------------- the globe
  // One transparent renderer behind the whole page. In the hero it is big; below it, it flies
  // to the edge of the screen and stays there, faint, so the clock's effect stays in view.
  const wide = () => matchMedia('(min-width: 761px)').matches;
  const heroCam = () => (wide() ? { zoom: 0.8, x: 0.36, y: 0 } : { zoom: 0.42, x: 0, y: 0.46 });
  const sideCam = () => (wide() ? { zoom: 0.72, x: 1.0, y: 0 } : { zoom: 0.46, x: 0.92, y: -0.78 });
  let camMode = 'hero';
  function setCam(mode) {
    if (mode === camMode) return;
    camMode = mode;
    html.classList.toggle('earth-side', mode === 'side');
    try { earthWin && earthWin.applyConfig && earthWin.applyConfig(mode === 'side' ? sideCam() : heroCam()); } catch {}
  }
  function loadEarth() {
    const frame = qs('[data-earth]');
    if (!frame || reduced) return;
    const sun = subsolar(new Date(base()));
    // Camera on the day/night line closest to the visitor: half day, half night with city lights.
    const a = wrap180(sun.lon - 90), b = wrap180(sun.lon + 90);
    const lon = Math.abs(wrap180(place.lon - a)) < Math.abs(wrap180(place.lon - b)) ? a : b;
    const p = new URLSearchParams({
      // The camera stays put relative to the sun, so as the page clock runs the Earth turns
      // underneath: one full rotation over the whole page, continents crossing into the night.
      motion: 'sun', sunoff: '-82', lat: '22', lon: String(Math.round(lon)),
      tilt: '18', fps: '60', dpr: wide() ? '1.5' : '1.25', hud: '0', transparent: '1',
    });
    const c = camMode === 'side' ? sideCam() : heroCam();
    for (const k in c) p.set(k, String(c[k]));
    const ready = () => html.classList.add('earth-ready');
    if (Number.isFinite(tParam)) p.set('time', new Date(tParam).toISOString());
    frame.addEventListener('load', () => {
      try { earthWin = frame.contentWindow; } catch {}
      // The visitor may have scrolled past the hero while the globe was loading.
      try { earthWin.applyConfig(camMode === 'side' ? sideCam() : heroCam()); } catch {}
      lastEarthHours = -1; apply();
      setTimeout(ready, 250);
    }, { once: true });
    setTimeout(ready, 6000);
    frame.src = 'earth/index.html?' + p.toString();
  }
  if (document.readyState === 'complete') setTimeout(loadEarth, 200);
  else addEventListener('load', () => setTimeout(loadEarth, 200), { once: true });

  // ---------------------------------------------------------------- motion
  if (!window.gsap) { apply(); return; }
  gsap.registerPlugin(ScrollTrigger, SplitText);
  // Refresh ourselves once the reveals exist, never in the middle of building them.
  ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,resize' });
  const ease = { out: 'expo.out', soft: 'power3.out', inOut: 'expo.inOut' };

  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ autoRaf: false, anchors: { offset: -70 }, lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Header states: over the dark hero, and scrolled (gets its own backdrop).
  const hero = qs('[data-hero]');
  if (hero) {
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: reduced ? 'bottom 70px' : 'bottom bottom',
      onToggle: (s) => html.classList.toggle('over-hero', s.isActive),
    });
    // While the hero's stage scrolls away, space turns into the sky and the globe moves aside.
    ScrollTrigger.create({
      trigger: hero, start: 'bottom bottom', end: 'bottom 35%',
      onUpdate: (s) => { heroK = s.progress; apply(); },
      onToggle: () => {}, onLeave: () => { heroK = 1; setCam('side'); apply(); },
      onEnterBack: () => setCam('hero'), onLeaveBack: () => { heroK = 0; apply(); },
    });
    if (reduced) heroK = 1;
  } else html.classList.remove('over-hero');
  const statement = qs('.statement');
  // Reserve the paragraph's height for the longest names, so the sections below never move.
  const bigLine = statement && statement.querySelector('p.big');
  const LONGEST = CITIES.map((c) => c[0]).sort((x, y) => y.length - x.length)[0];
  function reserve() {
    if (!bigLine) return;
    const spans = [...el.sunrise, ...el.sunset], keep = spans.map((n) => n.textContent);
    bigLine.style.minHeight = '';
    spans.forEach((n) => { n.textContent = LONGEST; });
    bigLine.style.minHeight = bigLine.offsetHeight + 'px';
    spans.forEach((n, i) => { n.textContent = keep[i]; });
  }
  reserve();
  addEventListener('resize', reserve);
  if (document.fonts) document.fonts.ready.then(() => { reserve(); ScrollTrigger.refresh(); });
  if (statement) ScrollTrigger.create({ trigger: statement, start: 'top bottom', end: 'bottom top', onToggle: (s) => { citiesLive = s.isActive; } });
  // The clock: scroll progress over the whole page = 0 to 24 hours ahead.
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      html.classList.toggle('is-scrolled', s.scroll() > 40);
      if (!reduced && hero) { hours = s.progress * 24; apply(); }
    },
  });
  // Real time keeps going: refresh the readouts once a second.
  let lastTick = 0;
  gsap.ticker.add((t) => { if (t - lastTick > 1) { lastTick = t; apply(); } });
  apply();

  if (reduced) { html.classList.add('motion-ready'); return; }

  const fontsReady = (document.fonts && document.fonts.ready) ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  fontsReady.then(build);
  function build() {
  // Reveals: text lines rise from a mask; blocks rise; images open from the bottom.
  qsa('[data-rise]').forEach((node) => {
    const textual = /^(H2|H3)$/.test(node.tagName) || (node.tagName === 'P' && !node.querySelector('[data-sunrise],[data-place-name]'));
    if (textual) {
      SplitText.create(node, {
        type: 'lines', mask: 'lines',
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, rotate: 2.5, transformOrigin: '0% 100%', duration: 1.2, stagger: 0.07, ease: ease.out,
          scrollTrigger: { trigger: node, start: 'top 88%', toggleActions: 'play none none none' },
        }),
      });
    } else {
      gsap.from(node, { y: 48, autoAlpha: 0, rotate: 1.2, transformOrigin: '0% 100%', duration: 1.2, ease: ease.out, scrollTrigger: { trigger: node, start: 'top 90%', toggleActions: 'play none none none' } });
    }
  });
  qsa('[data-rise-img]').forEach((fig) => {
    const img = fig.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 90%', toggleActions: 'play none none none' } });
    tl.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.5, ease: ease.out, clearProps: 'clipPath' });
    if (img) tl.from(img, { scale: 1.18, duration: 1.8, ease: ease.out, clearProps: 'scale' }, 0);
  });
  qsa('.rows .row').forEach((row) => {
    gsap.from(row.querySelector('.row__in'), { yPercent: 40, autoAlpha: 0, duration: 1, ease: ease.out, scrollTrigger: { trigger: row, start: 'top 94%', toggleActions: 'play none none none' } });
  });
  html.classList.add('motion-ready');
  ScrollTrigger.refresh();
  if (document.readyState !== 'complete') addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  // Index preview: the view's picture rises next to the pointer.
  const preview = qs('.preview');
  const rows = qsa('[data-preview]');
  if (fine && preview && rows.length) {
    const img = preview.querySelector('img');
    const px = gsap.quickTo(preview, 'x', { duration: 0.6, ease: ease.soft });
    const py = gsap.quickTo(preview, 'y', { duration: 0.6, ease: ease.soft });
    let current = null, mx = 0, my = 0;
    const show = (row) => {
      if (current === row) return;
      current = row;
      if (!row) {
        gsap.to(preview, { clipPath: 'inset(0% 0% 100% 0% round 12px)', autoAlpha: 0, duration: 0.45, ease: ease.soft, overwrite: true });
        return;
      }
      img.src = row.dataset.preview;
      gsap.fromTo(preview, { clipPath: 'inset(100% 0% 0% 0% round 12px)', autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 0.7, ease: ease.out, overwrite: true });
    };
    const w = () => preview.offsetWidth, h = () => preview.offsetHeight;
    // x: the spec column (its text steps aside on hover); y: follows the pointer.
    const colX = () => { const r = qs('.rows').getBoundingClientRect(); return r.right - w(); };
    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      px(colX()); py(gsap.utils.clamp(80, innerHeight - h() - 16, my - h() / 2));
    };
    qs('.rows').addEventListener('pointermove', move, { passive: true });
    rows.forEach((r) => { r.addEventListener('pointerenter', (e) => { move(e); gsap.set(preview, { x: colX(), y: gsap.utils.clamp(80, innerHeight - h() - 16, my - h() / 2) }); show(r); }); });
    qs('.rows').addEventListener('pointerleave', () => show(null));
    // The page can scroll under a still pointer: check what is under it.
    ScrollTrigger.create({
      trigger: '.rows', start: 'top bottom', end: 'bottom top',
      onUpdate: () => { if (!current) return; const hit = document.elementFromPoint(mx, my); const r = hit && hit.closest('[data-preview]'); if (r !== current) show(r || null); },
      onLeave: () => show(null), onLeaveBack: () => show(null),
    });
  }

  // Restored scroll position (reload, Back, bfcache): set the header state right away.
  const syncHeader = () => html.classList.toggle('is-scrolled', scrollY > 40);
  syncHeader();
  addEventListener('pageshow', (e) => { syncHeader(); if (e.persisted) ScrollTrigger.refresh(); });
})();
