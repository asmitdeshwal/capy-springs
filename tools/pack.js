#!/usr/bin/env node
// Capy Springs - packager: draws the app icons (pure-JS PNG encoder, no dependencies), writes sw.js with the precache list,
// stamps the version into index.html's script URLs, and copies a clean, hostable copy of the game into dist/.
// Usage: node tools/pack.js            (then: install from http://localhost:5173 in Chrome/Edge, upload dist/ to any static host, or npx cap sync android)
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const version = /G\.VERSION = '([^']+)'/.exec(read('src/00_config.js'))[1];
const files = Array.from(read('index.html').matchAll(/'(src\/[^']+\.js)'/g)).map(m => m[1]);

// ---------- PNG encoder ----------
const CRC = new Int32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); CRC[n] = c; }
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
// ---------- a tiny rasterizer: shapes with 4x4 supersampled coverage, drawn in 512-space and scaled ----------
function canvas(size) {
  const buf = Buffer.alloc(size * size * 4), s = size / 512, SS = 4;
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function paint(inside, color, alpha) {
    const col = hex(color), a0 = alpha === undefined ? 1 : alpha;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let hit = 0;
      for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) if (inside((x + (i + 0.5) / SS) / s, (y + (j + 0.5) / SS) / s)) hit++;
      if (!hit) continue;
      const a = a0 * hit / (SS * SS), o = (y * size + x) * 4, da = buf[o + 3] / 255, na = a + da * (1 - a);
      for (let c = 0; c < 3; c++) buf[o + c] = Math.round((col[c] * a + buf[o + c] * da * (1 - a)) / (na || 1));
      buf[o + 3] = Math.round(na * 255);
    }
  }
  return {
    buf,
    rrect: (x, y, w, h, r, color, alpha) => paint((px, py) => { if (px < x || px > x + w || py < y || py > y + h) return false; const cx = px < x + r ? x + r : px > x + w - r ? x + w - r : px, cy = py < y + r ? y + r : py > y + h - r ? y + h - r : py; return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r; }, color, alpha),
    ellipse: (cx, cy, rx, ry, color, alpha) => paint((px, py) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1, color, alpha),
    circle: (cx, cy, r, color, alpha) => paint((px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r, color, alpha),
    tri: (x1, y1, x2, y2, x3, y3, color) => paint((px, py) => { const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2), d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3), d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); }, color)
  };
}
// the icon: a capybara in a steaming bath with a yuzu on its head, on cream (maskable: full-bleed amber, everything inside the safe zone)
function icon(size, maskable, opts) {
  const c = canvas(size), o = opts || {};
  if (!o.noBg) { if (maskable) c.rrect(0, 0, 512, 512, 0, '#FFC857'); else c.rrect(0, 0, 512, 512, 110, '#F6F1E7'); }
  const k = o.k || (maskable ? 0.8 : 1), ox = 256 * (1 - k), oy = 256 * (1 - k);
  const X = v => ox + v * k, Y = v => oy + v * k, Sz = v => v * k;
  c.rrect(X(56), Y(300), Sz(400), Sz(150), Sz(40), '#B9B3A6');                            // tub
  c.rrect(X(80), Y(318), Sz(352), Sz(110), Sz(30), '#2FA6A0');                            // water
  c.ellipse(X(256), Y(336), Sz(110), Sz(22), '#8EE3DC', 0.55);                             // ripple highlight
  c.rrect(X(126), Y(176), Sz(260), Sz(170), Sz(70), '#7A5233');                            // body thickness
  c.rrect(X(126), Y(160), Sz(260), Sz(170), Sz(70), '#9C6B43');                            // body
  c.rrect(X(300), Y(220), Sz(96), Sz(74), Sz(30), '#6E4A2E');                              // snout
  c.circle(X(190), Y(158), Sz(26), '#7A5233'); c.circle(X(250), Y(150), Sz(26), '#7A5233');  // ears
  c.circle(X(232), Y(230), Sz(16), '#2A1E17'); c.circle(X(300), Y(222), Sz(16), '#2A1E17'); // eyes
  c.ellipse(X(232), Y(100), Sz(40), Sz(16), '#2C5A40'); c.ellipse(X(196), Y(104), Sz(34), Sz(14), '#2C5A40');   // yuzu leaves
  c.circle(X(214), Y(120), Sz(46), '#F5C400'); c.circle(X(200), Y(108), Sz(14), '#FFF1B0');                       // yuzu
  for (let i = 0; i < 3; i++) c.circle(X(110 + i * 150), Y(84 - (i & 1) * 20), Sz(22 + (i & 1) * 8), '#FFFFFF', 0.75);   // steam
  return o.raw ? c.buf : png(size, size, c.buf);
}
// used as a module by tools/native_assets.js (native icons and splash screens); the packaging below runs only from the command line
if (require.main !== module) { module.exports = { png, canvas, icon, version }; return; }
fs.mkdirSync(path.join(root, 'icons'), { recursive: true });
fs.writeFileSync(path.join(root, 'icons/icon-192.png'), icon(192, false));
fs.writeFileSync(path.join(root, 'icons/icon-512.png'), icon(512, false));
fs.writeFileSync(path.join(root, 'icons/maskable-512.png'), icon(512, true));
fs.writeFileSync(path.join(root, 'icons/apple-180.png'), icon(180, true));
console.log('icons: 4 written');

// ---------- version stamp in index.html, service worker ----------
let html = read('index.html');
html = html.replace(/\?v=[\w.\-]+'/g, "?v=" + version + "'");
fs.writeFileSync(path.join(root, 'index.html'), html);
const precache = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-180.png'].concat(files);
const sw = `// Capy Springs - service worker (generated by tools/pack.js, version ${version}): network first, cache fallback, so an installed copy keeps working with no server.
const CACHE = 'capy-springs-${version}';
const PRECACHE = ${JSON.stringify(precache)};
// install never fails on one slow file (a tunnel or a phone network can drop a request): each file is cached on its own, and the
// fetch handler fills in anything missing during normal play
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.all(PRECACHE.map(u => fetch(u, { cache: 'no-cache' }).then(r => { if (r && r.ok) return c.put(u, r); }).catch(() => {}))))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// network first; a failed or non-OK answer (server off, an expired share link, a host's error page) falls back to the cached copy
const fromCache = req => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  // the page itself is always revalidated with the host (hosts like GitHub Pages otherwise keep it for 10 minutes); its script URLs carry
  // the version, so a new page pulls new scripts and the rest can use the normal HTTP cache
  const init = e.request.mode === 'navigate' ? { cache: 'no-cache' } : undefined;
  e.respondWith(fetch(e.request, init).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }
    return fromCache(e.request).then(r => r || res);
  }).catch(() => fromCache(e.request).then(r => r || Response.error())));
});
`;
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log('sw.js: ' + precache.length + ' files precached, cache capy-springs-' + version);

// ---------- dist/ : a clean copy to host or to hand to Capacitor ----------
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(path.join(dist, 'src'), { recursive: true }); fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js'].concat(files, fs.readdirSync(path.join(root, 'icons')).map(f => 'icons/' + f))) fs.copyFileSync(path.join(root, f), path.join(dist, f));
// the store apps load Capacitor's core script (plugins from plain JS); only dist/ needs it
fs.mkdirSync(path.join(dist, 'vendor'), { recursive: true });
fs.copyFileSync(path.join(root, 'node_modules/@capacitor/core/dist/capacitor.js'), path.join(dist, 'vendor/capacitor.js'));
// the store build carries no developer mode (no cheat menu, no secret taps)
// node tools/pack.js --test-ads: a try-it-yourself build (the cloud's debug APK) that always shows Google's test ads, whatever ids src/02_data_ads.js holds
const testAds = process.argv.includes('--test-ads');
fs.writeFileSync(path.join(dist, 'index.html'), fs.readFileSync(path.join(dist, 'index.html'), 'utf8').replace('window.CAPY_DEV_BUILD = true;', 'window.CAPY_DEV_BUILD = false;' + (testAds ? ' window.CAPY_TEST_ADS = true;' : '')));
if (testAds) console.log('dist/: test ads forced on');
console.log('dist/: ' + (3 + files.length + 4) + ' files, version ' + version);
