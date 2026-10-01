#!/usr/bin/env node
// Capy Springs - source images for the native app icons and splash screens (pure JS, no image files in the repo).
// Writes assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png; then `npx capacitor-assets generate`
// turns them into every Android mipmap / iOS AppIcon / splash size. Usage: node tools/native_assets.js && npx capacitor-assets generate
'use strict';
const fs = require('fs'), path = require('path');
const { png, canvas, icon } = require('./pack.js');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'assets');
fs.mkdirSync(out, { recursive: true });

const ICON = 1024, SPLASH = 2732, CREAM = [0xF6, 0xF1, 0xE7], AMBER = '#FFC857';
function solid(size, rgb) { const b = Buffer.alloc(size * size * 4); for (let i = 0; i < size * size; i++) { b[i * 4] = rgb[0]; b[i * 4 + 1] = rgb[1]; b[i * 4 + 2] = rgb[2]; b[i * 4 + 3] = 255; } return b; }
// alpha-blend a square RGBA buffer onto a bigger one, centred
function blit(dst, dsize, src, ssize) {
  const ox = (dsize - ssize) >> 1, oy = (dsize - ssize) >> 1;
  for (let y = 0; y < ssize; y++) for (let x = 0; x < ssize; x++) {
    const si = (y * ssize + x) * 4, a = src[si + 3] / 255; if (!a) continue;
    const di = ((y + oy) * dsize + x + ox) * 4;
    for (let c = 0; c < 3; c++) dst[di + c] = Math.round(src[si + c] * a + dst[di + c] * (1 - a));
    dst[di + 3] = 255;
  }
}
const t0 = Date.now();
// iOS / Play Store icon: full-bleed amber (no alpha), the capybara inside the safe zone
fs.writeFileSync(path.join(out, 'icon-only.png'), icon(ICON, true));
// Android adaptive icon: the capybara on transparent (inner 66 %), and a plain amber background layer
fs.writeFileSync(path.join(out, 'icon-foreground.png'), icon(ICON, true, { noBg: true, k: 0.62 }));
const bg = canvas(ICON); bg.rrect(0, 0, 512, 512, 0, AMBER); fs.writeFileSync(path.join(out, 'icon-background.png'), png(ICON, ICON, bg.buf));
// splash: the boot overlay's cream with the rounded icon in the middle (the web boot screen then takes over seamlessly)
const splash = solid(SPLASH, CREAM), tile = icon(560, false, { raw: true });
blit(splash, SPLASH, tile, 560);
const data = png(SPLASH, SPLASH, splash);
fs.writeFileSync(path.join(out, 'splash.png'), data); fs.writeFileSync(path.join(out, 'splash-dark.png'), data);
console.log('assets/: 5 source images in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
