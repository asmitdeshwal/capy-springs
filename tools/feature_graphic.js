#!/usr/bin/env node
// Capy Springs - Google Play feature graphic: assets/feature-graphic.png, 1024 x 500, fully opaque (24-bit look), no text.
// Pure JS like the icons (the store draws the title over it, and the rasterizer in tools/pack.js has no fonts anyway):
// a cream sky, a soft pine mountain and an amber sun on the right, a pine ground band across the lower third with three
// lantern glows, and the capybara icon tile (360 px, no background) sitting on the ground, centred-left.
// Usage: node tools/feature_graphic.js
'use strict';
const fs = require('fs'), path = require('path');
const { png, canvas, icon } = require('./pack.js');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'assets');
fs.mkdirSync(out, { recursive: true });

const W = 1024, H = 500, CREAM = [0xF6, 0xF1, 0xE7], PINE = [0x3F, 0x7D, 0x5A];
const buf = Buffer.alloc(W * H * 4);                       // canvas() is square, so the 1024 x 500 image is assembled by hand
function fill(x0, y0, x1, y1, rgb) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const o = (y * W + x) * 4; buf[o] = rgb[0]; buf[o + 1] = rgb[1]; buf[o + 2] = rgb[2]; buf[o + 3] = 255; }
}
// alpha-blend a square RGBA tile onto the graphic with its top-left at (ox, oy), clipped to the edges (like tools/native_assets.js)
function blit(src, size, ox, oy) {
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = x + ox, dy = y + oy; if (dx < 0 || dy < 0 || dx >= W || dy >= H) continue;
    const si = (y * size + x) * 4, a = src[si + 3] / 255; if (!a) continue;
    const di = (dy * W + dx) * 4;
    for (let c = 0; c < 3; c++) buf[di + c] = Math.round(src[si + c] * a + buf[di + c] * (1 - a));
    buf[di + 3] = 255;
  }
}

const t0 = Date.now();
fill(0, 0, W, H, CREAM);                                                   // sky
const sky = canvas(500);                                                   // right-hand scenery, 512-space in a 500 px square
sky.tri(300, 70, 0, 512, 512, 512, '#6FAE88');                             // a distant pine mountain (its base hides under the band)
sky.circle(430, 112, 40, '#FFC857');                                       // amber sun
blit(sky.buf, 500, W - 500, 0);
const GROUND = Math.round(H * 2 / 3);
fill(0, GROUND, W, H, PINE);                                               // ground band, lower third
const lantern = canvas(120); lantern.circle(256, 256, 120, '#FFC857'); lantern.circle(224, 224, 44, '#FFF1B0');
for (const x of [640, 760, 880]) blit(lantern.buf, 120, x - 60, GROUND + 50);   // three lantern glows along the ground
const SZ = 360, tile = icon(SZ, false, { noBg: true, raw: true });        // the capybara in its tub, no cream backing
blit(tile, SZ, 150, (H - SZ) >> 1);                                        // centred-left, the tub resting on the band

const file = path.join(out, 'feature-graphic.png');
fs.writeFileSync(file, png(W, H, buf));
const hdr = fs.readFileSync(file);                                         // IHDR: width at byte 16, height at byte 20
console.log('assets/feature-graphic.png ' + hdr.readUInt32BE(16) + 'x' + hdr.readUInt32BE(20) + ', ' + (hdr.length / 1024).toFixed(0) + ' KB in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
