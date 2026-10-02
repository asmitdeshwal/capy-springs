// Capy Springs - world art: terrain, valley, decks, water, offering steps, lanterns, boiler, trees, stall, platform, cable car (ARCHITECTURE.md 11.3, GDD 11.5).
(function (G) {
  'use strict';
  const PAL = G.PAL, U = G.U, C = G.C, DATA = G.DATA, MAP = DATA.MAP;
  const Art = G.Art = G.Art || {};
  const W = Art.W = {};
  const A = () => Art.S;
  const TAU = Math.PI * 2;
  const R = { x0: 0, y0: 0, x1: 0, y1: 0 };

  // ---------- static layer ----------
  W.terrain = function (ctx, y0, y1) {
    const S_ = A();
    if (MAP.SUMMIT && y0 < MAP.SUMMIT.y1) { if (W.summitTerrain) W.summitTerrain(ctx, y0, MAP.SUMMIT.y1); y0 = MAP.SUMMIT.y1; }   // the Summit above the clouds (26_art_summit.js)
    if (MAP.RIDGE && y0 < MAP.RIDGE.y1) { W.ridgeTerrain(ctx, y0, MAP.RIDGE.y1); y0 = MAP.RIDGE.y1; }   // the snowy ridge above, the green deck below
    const g0 = PAL.ground || PAL.pine, g1 = PAL.groundDark || PAL.pineDark, gm = PAL.groundMoss || PAL.moss;   // the season's ground (60_golden.js)
    ctx.fillStyle = g0; ctx.fillRect(0, y0, MAP.W, y1 - y0);
    for (let i = 0; i < 14; i++) {                                  // darker patches
      const x = U.hash(i, 1) * 540, y = y0 + U.hash(i, 2) * (y1 - y0), rx = 40 + U.hash(i, 3) * 70, ry = 14 + U.hash(i, 4) * 22;
      S_.ellipse(ctx, x, y, rx, ry, g1);
    }
    for (let i = 0; i < 30; i++) {                                  // moss
      const x = U.hash(i, 5) * 540, y = y0 + U.hash(i, 6) * (y1 - y0), rx = 18 + U.hash(i, 7) * 40, ry = 6 + U.hash(i, 8) * 12;
      S_.ellipse(ctx, x, y, rx, ry, gm);
    }
    for (let i = 0; i < 150; i++) {                                 // grass tufts
      const x = U.hash(i, 41) * 540, y = y0 + U.hash(i, 42) * (y1 - y0), c = (i & 1) ? g1 : PAL.mix(gm, PAL.cream, 0.25);
      for (let k = -1; k <= 1; k++) A().line(ctx, x + k * 4, y, x + k * 7, y - 7 - (k === 0 ? 3 : 0), c, 2);
    }
    const vg = ctx.createLinearGradient(0, y0, 0, y1); vg.addColorStop(0, PAL.rgba(PAL.ink, 0.12)); vg.addColorStop(0.55, PAL.rgba(PAL.ink, 0.03)); vg.addColorStop(1, PAL.rgba(PAL.cream, 0.05));
    ctx.fillStyle = vg; ctx.fillRect(0, y0, MAP.W, y1 - y0);         // light falls toward the platform, the slope darkens toward the mountain
    W.grain(ctx, 0, y0, MAP.W, y1 - y0);
    for (let i = 0; i < (G.Golden && G.Golden.cur === 3 ? 0 : 14); i++) {   // flower patches: three blooms and a leaf (none under winter snow)
      const x = U.hash(i, 43) * 540, y = y0 + U.hash(i, 44) * (y1 - y0), col = (i % 3 === 0) ? '#F2A7B6' : (i % 3 === 1) ? PAL.cream : '#F6D27A';
      S_.ellipse(ctx, x + 6, y + 3, 7, 3, g1);
      for (let k = 0; k < 3; k++) { const fx = x + (k - 1) * 9, fy = y - (k & 1) * 5; S_.circle(ctx, fx, fy, 4, col); S_.circle(ctx, fx, fy, 1.5, PAL.amberDeep); }
    }
  };
  // ---------- the Ridge: snow-dusted stone, drifts, the chasm the bridge crosses, snow-capped pines ----------
  const SNOW = '#E9EEF2', SNOW_D = '#C6D1D8', RIDGE_STONE = '#A9B6BF', CHASM = '#2F3D47';
  W.ridgeTerrain = function (ctx, y0, y1) {
    const S_ = A(), r = MAP.RIDGE;
    ctx.fillStyle = RIDGE_STONE; ctx.fillRect(0, y0, MAP.W, y1 - y0);
    for (let i = 0; i < 22; i++) { const x = U.hash(i, 61) * 540, y = y0 + U.hash(i, 62) * (y1 - y0), rx = 40 + U.hash(i, 63) * 70, ry = 12 + U.hash(i, 64) * 18; S_.ellipse(ctx, x, y, rx, ry, (i & 1) ? SNOW_D : SNOW); }   // drifts
    for (let i = 0; i < 16; i++) { const x = U.hash(i, 65) * 540, y = y0 + U.hash(i, 66) * (y1 - y0); S_.ellipse(ctx, x, y, 10 + U.hash(i, 67) * 14, 5, PAL.rgba(PAL.stoneDark, 0.35)); }   // bare stone
    // the chasm either side of the bridge: dark drop with a mist floor and a stone lip
    const ch = r.chasm;
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i]; ctx.fillStyle = CHASM; ctx.fillRect(c[0], c[1], c[2] - c[0], c[3] - c[1]);
      const g = ctx.createLinearGradient(0, c[1], 0, c[3]); g.addColorStop(0, PAL.rgba(PAL.mist, 0)); g.addColorStop(1, PAL.rgba(PAL.mist, 0.8)); ctx.fillStyle = g; ctx.fillRect(c[0], c[1], c[2] - c[0], c[3] - c[1]);
      S_.fillRRect(ctx, c[0], c[1] - 6, c[2] - c[0], 10, 4, SNOW_D);
    }
  };
  W.snowPine = function (ctx, x, y) {
    const S_ = A();
    W.pine(ctx, x, y);
    S_.tri(ctx, x - 15, y - 30, x + 15, y - 30, x, y - 62, SNOW); S_.tri(ctx, x - 8, y - 42, x + 8, y - 42, x, y - 62, PAL.rgba(SNOW_D, 0.6));
    S_.tri(ctx, x - 20, y - 8, x - 4, y - 8, x - 10, y - 30, SNOW);
  };
  W.ridgeDecor = function (ctx) {
    const S_ = A(), r = MAP.RIDGE, L = MAP.LIFT;
    if (r.pond) { const p = r.pond; S_.ellipse(ctx, p.x, p.y + 4, p.w / 2 + 6, p.h / 2 + 4, SNOW_D); S_.ellipse(ctx, p.x, p.y, p.w / 2, p.h / 2, '#BFD9E6'); S_.ellipse(ctx, p.x - 30, p.y - 14, 36, 10, PAL.rgba('#FFFFFF', 0.5)); A().line(ctx, p.x - 20, p.y + 10, p.x + 40, p.y - 18, PAL.rgba('#FFFFFF', 0.6), 2); }   // a frozen pond
    for (let i = 0; i < r.rocks.length; i++) { const k = r.rocks[i]; S_.ellipse(ctx, k[0] + 6, k[1] + 2, 16, 9, PAL.stoneDark); S_.ellipse(ctx, k[0], k[1] - 4, 18, 11, PAL.stone); S_.ellipse(ctx, k[0] - 4, k[1] - 10, 12, 5, SNOW); }
    for (let i = 0; i < r.pines.length; i++) W.snowPine(ctx, r.pines[i][0], r.pines[i][1]);
    if (L) {                                                                                       // the Ridge Lift: a cable across the gorge, pylons, a straw-plank platform
      for (let i = 0; i < L.pylons.length; i++) { const x = L.pylons[i]; S_.fillRRect(ctx, x - 5, L.pylonTop, 10, L.y - L.pylonTop + 4, 3, PAL.stoneDark); S_.fillRRect(ctx, x - 16, L.pylonTop + 6, 32, 6, 2, PAL.stoneDark); }
      A().line(ctx, 0, L.y, MAP.W, L.y, PAL.cable, 3);
      const p = L.platform, x0 = p.x - p.w / 2, y0 = p.y - p.h / 2;
      S_.plate(ctx, x0, y0, p.w, p.h, 10, PAL.stone, PAL.stoneDark, 8);
      for (let i = 0; i < 4; i++) { const x = x0 + 16 + i * (p.w - 32) / 3; S_.fillRRect(ctx, x - 3, y0 - 12, 6, 14, 2, PAL.cedarDark); }
      A().line(ctx, x0 + 14, y0 - 8, x0 + p.w - 14, y0 - 8, PAL.cedar, 4);
      S_.fillRRect(ctx, x0 + 4, y0 - 4, p.w - 8, 5, 2, SNOW);
    }
  };
  // the Ridge Lift's gondola: a small cabin hanging from the gorge cable (golden variant with streamers)
  W.liftCar = function (ctx, x, swing, golden, heads) {
    const S_ = A(), cy = MAP.LIFT.y;
    ctx.save(); ctx.translate(x, cy); ctx.rotate(swing);
    S_.circle(ctx, 0, 0, 5, PAL.stoneDark); S_.fillRRect(ctx, -2, 0, 4, 14, 1, PAL.stoneDark);
    S_.fillRRect(ctx, -28, 14, 56, 36, 12, golden ? PAL.straw : '#5C6F8A');
    S_.fillRRect(ctx, -28, 40, 56, 10, 6, golden ? PAL.coinRim : '#3E4B5E');
    S_.fillRRect(ctx, -22, 19, 44, 13, 3, PAL.cream);
    for (let i = 0; i < heads; i++) { const hx = -12 + i * 12; S_.circle(ctx, hx, 26, 4.5, PAL.capy); S_.circle(ctx, hx + 3, 27, 2.2, PAL.capySnout); }
    S_.fillRRect(ctx, -24, 8, 48, 4, 2, SNOW);
    if (golden) for (let i = 0; i < 3; i++) A().line(ctx, -20 + i * 20, 50, -24 + i * 20 + Math.sin(i * 2) * 4, 62, PAL.red, 2);
    ctx.restore();
  };
  // the sauna hut: a log cabin on a cedar porch; the interior (the 'water' rect) is where guests sit, so the roof stays above it
  W.saunaBody = function (ctx, def) {
    const S_ = A(), d = def.deck, w = def.water, x0 = d.x - d.w / 2, y0 = d.y - d.h / 2;
    S_.shadow(ctx, d.x, y0 + d.h + 8, d.w / 2 + 4, 12, 0.16);
    S_.plate(ctx, x0, y0, d.w, d.h, 14, PAL.cedar, PAL.cedarDark, 10);                                    // porch
    const wx0 = w.x - w.w / 2 - 14, wy0 = w.y - w.h / 2 - 8, ww = w.w + 28, wh = w.h + 16;
    S_.fillRRect(ctx, wx0, wy0, ww, wh, 10, PAL.cedarDark);                                                 // log walls
    ctx.strokeStyle = PAL.rgba(PAL.ink, 0.25); ctx.lineWidth = 1; ctx.beginPath(); for (let y = wy0 + 10; y < wy0 + wh; y += 10) { ctx.moveTo(wx0 + 4, y); ctx.lineTo(wx0 + ww - 4, y); } ctx.stroke();
    S_.fillRRect(ctx, wx0 - 10, wy0 - 26, ww + 20, 30, 8, '#4A3A30'); S_.fillRRect(ctx, wx0 - 10, wy0 - 26, ww + 20, 8, 4, SNOW);   // roof with snow
    S_.fillRRect(ctx, wx0 + ww - 34, wy0 - 46, 14, 24, 3, PAL.boiler);                                     // chimney
    S_.fillRRect(ctx, wx0 + ww / 2 - 12, wy0 + wh - 4, 24, 12, 4, PAL.cedarDark);                            // step down to the porch
  };
  // a snowdrift on a path: a mound that grows with `amount` (0..1), a blue shadow, a glint
  W.drift = function (ctx, x, y, amount, t) {
    const S_ = A(), k = Math.max(0, Math.min(1, amount)); if (k <= 0.02) return;
    S_.ellipse(ctx, x + 4, y + 4, 38 * k, 16 * k, PAL.rgba('#7E96AC', 0.35));
    S_.ellipse(ctx, x, y, 38 * k, 16 * k, '#E9EEF2'); S_.ellipse(ctx, x - 8 * k, y - 6 * k, 20 * k, 8 * k, '#FFFFFF');
    S_.ellipse(ctx, x + 14 * k, y + 2, 10 * k, 4 * k, PAL.rgba('#C6D1D8', 0.8));
    if (k >= 0.5) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5 + x); S_.circle(ctx, x - 4, y - 9 * k, 1.8, '#FFFFFF'); ctx.globalAlpha = 1; }
  };
  // the massage pavilion: a roofed platform with upturned eaves; the chairs (the 'water' rect) sit below the roof band so guests are never under it
  W.pavilionBody = function (ctx, def) {
    const S_ = A(), d = def.deck, x0 = d.x - d.w / 2, y0 = d.y - d.h / 2;
    S_.shadow(ctx, d.x, y0 + d.h + 8, d.w / 2 + 4, 12, 0.16);
    S_.plate(ctx, x0, y0, d.w, d.h, 14, PAL.cedar, PAL.cedarDark, 10);                                    // platform
    ctx.strokeStyle = PAL.rgba(PAL.cream, 0.22); ctx.beginPath(); for (let y = y0 + 6; y < y0 + d.h - 4; y += 18) { ctx.moveTo(x0 + 10, y); ctx.lineTo(x0 + d.w - 10, y); } ctx.stroke();
    for (let i = 0; i < 4; i++) { const px = i & 1 ? x0 + d.w - 16 : x0 + 16, py = i < 2 ? y0 + 36 : y0 + d.h - 14; S_.fillRRect(ctx, px - 4, py - 60, 8, 60, 3, PAL.cedarDark); }   // posts
    S_.fillRRect(ctx, x0 - 8, y0 - 26, d.w + 16, 40, 10, '#6B2F2A');                                       // roof
    S_.fillRRect(ctx, x0 - 8, y0 - 26, d.w + 16, 8, 4, SNOW);                                               // snow on the ridge line
    S_.tri(ctx, x0 - 8, y0 + 14, x0 - 22, y0 + 2, x0 - 8, y0 - 4, '#6B2F2A'); S_.tri(ctx, x0 + d.w + 8, y0 + 14, x0 + d.w + 22, y0 + 2, x0 + d.w + 8, y0 - 4, '#6B2F2A');   // upturned eaves
    S_.fillRRect(ctx, x0 + 4, y0 + 10, d.w - 8, 6, 2, PAL.rgba(PAL.ink, 0.25));                              // eave shadow
    S_.fillRRect(ctx, def.gongAt.x - 3, def.gongAt.y - 50, 6, 50, 2, PAL.cedarDark);                         // the gong stand's pole
  };
  // the gong: a brass disc on its stand with the countdown ring; it flashes while a massage session runs
  W.gong = function (ctx, x, y, frac, session, t) {
    const S_ = A();
    S_.shadow(ctx, x, y, 10, 4);
    S_.fillRRect(ctx, x - 14, y - 58, 28, 4, 2, PAL.cedarDark);
    S_.circle(ctx, x, y - 36, 15, PAL.coinRim); S_.circle(ctx, x, y - 36, 12, session ? PAL.mix(PAL.coin, PAL.cream, 0.5 + 0.5 * Math.sin(t * 12)) : PAL.coin); S_.circle(ctx, x, y - 36, 4, PAL.coinRim);
    S_.ring(ctx, x, y - 36, 22, frac, 4, PAL.cta, PAL.rgba(PAL.cream, 0.55));
  };
  // drifting petals over the whole scene (presentation; hash-driven so it never touches the seeded RNG)
  W.ambient = function (ctx, camY, H, t, low) {
    if (low) return;
    const S_ = A(), n = 9;
    for (let i = 0; i < n; i++) {
      const sp = 10 + U.hash(i, 51) * 10, x = ((U.hash(i, 52) * 540) + Math.sin(t * 0.6 + i * 1.3) * 26 + 540) % 540, y = camY + (((U.hash(i, 53) * H) + t * sp) % (H + 40)) - 20;
      const sea = G.Golden ? G.Golden.cur : 0;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.5 + i); ctx.globalAlpha = 0.75;
      if (sea === 2) S_.ellipse(ctx, 0, 0, 7, 3.2, (i & 1) ? '#C9622F' : '#E0A040');                    // autumn leaves
      else if (sea === 3) S_.circle(ctx, 0, 0, 2.6, '#FFFFFF');                                          // winter flakes
      else if (sea === 1) S_.circle(ctx, 0, 0, 2, PAL.cream);                                            // summer fluff
      else S_.ellipse(ctx, 0, 0, 5, 2.6, (i & 1) ? '#F2A7B6' : PAL.cream);                             // spring petals
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };
  // a faint paper grain, baked into the static layer only (one 64-px pattern of hash dots)
  let GRAIN = null;
  W.grain = function (ctx, x, y, w, h) {
    if (!ctx.createPattern) return;
    if (!GRAIN) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); for (let i = 0; i < 90; i++) { g.fillStyle = (i & 1) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; g.fillRect(Math.floor(U.hash(i, 81) * 64), Math.floor(U.hash(i, 82) * 64), 1 + (i % 3 === 0 ? 1 : 0), 1); } GRAIN = c; }
    const pat = ctx.createPattern(GRAIN, 'repeat'); if (!pat) return; ctx.fillStyle = pat; ctx.fillRect(x, y, w, h);
  };
  W.valley = function (ctx) {
    const S_ = A(), v = MAP.VALLEY;
    ctx.fillStyle = PAL.pineDark; ctx.fillRect(0, v.y0, MAP.W, v.y1 - v.y0);
    ctx.fillStyle = PAL.stoneDark; ctx.fillRect(0, v.y0, MAP.W, 12);
    for (let row = 0; row < 3; row++) {
      const y = 2230 + row * 50 + 20, off = (row & 1) ? 22 : 0;
      for (let x = -20 + off; x < 580; x += 45) S_.tri(ctx, x - 20, y + 25, x + 20, y + 25, x, y - 25, row === 0 ? PAL.pineDark : PAL.mix(PAL.pineDark, PAL.cream, 0.12 * row));
    }
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1); g.addColorStop(0, PAL.rgba(PAL.mist, 0)); g.addColorStop(1, PAL.rgba(PAL.mist, 0.9));
    ctx.fillStyle = g; ctx.fillRect(0, v.y0, MAP.W, v.y1 - v.y0);
  };
  W.lane = function (ctx) {
    const S_ = A(), L = MAP.LANE, y0 = MAP.RIDGE ? MAP.RIDGE.laneY0 : L.y0;      // the stepping-stone path runs on up the Ridge
    ctx.globalAlpha = 0.18; ctx.fillStyle = PAL.stone; ctx.fillRect(L.x0 + 6, y0, L.x1 - L.x0 - 12, L.y1 - y0); ctx.globalAlpha = 1;   // a worn path
    for (let y = y0 + 18, i = 0; y < L.y1; y += 36 + U.hash(i, 91) * 6, i++) {                                                     // stepping stones
      const x = L.cx + (U.hash(i, 92) - 0.5) * 18, w = 26 + U.hash(i, 93) * 8, h = 14 + U.hash(i, 94) * 4;
      S_.fillRRect(ctx, x - w / 2 + 2, y - h / 2 + 3, w, h, 7, PAL.rgba(PAL.ink, 0.18));
      S_.fillRRect(ctx, x - w / 2, y - h / 2, w, h, 7, PAL.mix(PAL.stone, PAL.cream, 0.25));
      S_.fillRRect(ctx, x - w / 2 + 3, y - h / 2 + 2, w - 10, 3, 2, PAL.rgba('#FFFFFF', 0.35));
    }
  };
  W.rocks = function (ctx) { const S_ = A(); for (let i = 0; i < MAP.ROCKS.length; i++) { const r = MAP.ROCKS[i]; S_.ellipse(ctx, r[0] + 6, r[1] + 2, 16, 9, PAL.stoneDark); S_.ellipse(ctx, r[0], r[1] - 4, 18, 11, PAL.stone); S_.ellipse(ctx, r[0] - 6, r[1] - 9, 8, 4, PAL.mix(PAL.stone, PAL.cream, 0.4)); } };
  W.pine = function (ctx, x, y) {
    const S_ = A();
    S_.shadow(ctx, x, y, 18, 6);
    S_.fillRRect(ctx, x - 3, y - 10, 6, 10, 2, PAL.cedarDark);
    const f0 = PAL.foliage || PAL.pine, f1 = PAL.foliageDark || PAL.pineDark;
    S_.tri(ctx, x - 20, y - 8, x + 20, y - 8, x, y - 46, f1); S_.tri(ctx, x - 20, y - 8, x, y - 8, x, y - 46, f0);
    S_.tri(ctx, x - 15, y - 30, x + 15, y - 30, x, y - 62, f1); S_.tri(ctx, x - 15, y - 30, x, y - 30, x, y - 62, f0);
  };
  W.pines = function (ctx) { const snow = G.Golden && G.Golden.cur === 3; for (let i = 0; i < MAP.PINES.length; i++) (snow ? W.snowPine : W.pine)(ctx, MAP.PINES[i][0], MAP.PINES[i][1]); };   // winter: snow on every pine
  W.stoneLantern = function (ctx, x, y, lit) {
    const S_ = A();
    S_.fillRRect(ctx, x - 9, y - 8, 18, 8, 3, PAL.stoneDark); S_.fillRRect(ctx, x - 4, y - 26, 8, 18, 2, PAL.stone);
    S_.fillRRect(ctx, x - 8, y - 36, 16, 11, 3, lit ? PAL.amber : PAL.mix(PAL.stone, PAL.cream, 0.3));
    S_.tri(ctx, x - 12, y - 35, x + 12, y - 35, x, y - 44, PAL.stoneDark);
  };
  W.stoneLanterns = function (ctx, lit) { for (let i = 0; i < MAP.STONE_LANTERNS.length; i++) W.stoneLantern(ctx, MAP.STONE_LANTERNS[i][0], MAP.STONE_LANTERNS[i][1], lit); };
  W.platform = function (ctx) {
    const S_ = A(), p = MAP.PLATFORM, x0 = p.x - p.w / 2, y0 = p.y - p.h / 2;
    S_.plate(ctx, x0, y0, p.w, p.h, 12, PAL.stone, PAL.stoneDark, 10);
    for (let i = 0; i < 5; i++) { const x = x0 + 20 + i * (p.w - 40) / 4; S_.fillRRect(ctx, x - 3, y0 - 14, 6, 16, 2, PAL.cedarDark); }
    A().line(ctx, x0 + 18, y0 - 9, x0 + p.w - 18, y0 - 9, PAL.cedar, 4);
  };
  W.cable = function (ctx) {
    const S_ = A(), c = MAP.CABLE;
    for (let i = 0; i < c.pylons.length; i++) { const x = c.pylons[i]; S_.fillRRect(ctx, x - 5, c.pylonTop, 10, c.y - c.pylonTop + 4, 3, PAL.stoneDark); S_.fillRRect(ctx, x - 16, c.pylonTop + 6, 32, 6, 2, PAL.stoneDark); }
    A().line(ctx, 0, c.y, MAP.W, c.y, PAL.cable, 3);
  };
  W.bridge = function (ctx) {
    const S_ = A(), b = MAP.BRIDGE;
    for (let y = b.y1 - 6; y > b.y0; y -= 14) S_.fillRRect(ctx, b.x - b.w / 2, y - 10, b.w, 10, 3, PAL.cedar);
    A().line(ctx, b.x - b.w / 2 - 4, b.y0, b.x - b.w / 2 - 4, b.y1, PAL.cedarDark, 3); A().line(ctx, b.x + b.w / 2 + 4, b.y0, b.x + b.w / 2 + 4, b.y1, PAL.cedarDark, 3);
  };
  // mist over the Ridge (dynamic: only when the camera sees it); gradient built once
  let mistG = null, mistCtx = null, mistKey = 0;
  W.mist = function (ctx, camY, H) {
    const m = (MAP.SUMMIT && G.S && G.S.built.summit) ? MAP.SUMMIT.mist : (MAP.RIDGE && G.S && G.S.built.ridge) ? MAP.RIDGE.mist : MAP.MIST;      // the mist lifts to the top of each stage as it opens
    if (camY > m.y1 + 10) return;
    if (!mistG || mistCtx !== ctx || mistKey !== m.y0) { mistCtx = ctx; mistKey = m.y0; mistG = ctx.createLinearGradient(0, m.y1, 0, m.y0); mistG.addColorStop(0, PAL.rgba(PAL.mist, 0)); mistG.addColorStop(1, PAL.rgba(PAL.mist, 0.95)); }
    ctx.fillStyle = mistG; ctx.fillRect(0, m.y0 - 200, MAP.W, m.y1 - m.y0 + 200);
  };
  W.sign = function (ctx, x, y, text) { const S_ = A(); S_.fillRRect(ctx, x - 3, y - 30, 6, 30, 2, PAL.cedarDark); S_.plate(ctx, x - 44, y - 52, 88, 26, 5, PAL.cedar, PAL.cedarDark, 4); S_.text(ctx, text || 'RIDGE', x, y - 39, 14, PAL.cream); };

  // ---------- decks and water ----------
  W.deckPlate = function (ctx, def) {
    const S_ = A(), d = def.deck, x0 = d.x - d.w / 2, y0 = d.y - d.h / 2;
    if (def.look === 'sauna') return W.saunaBody(ctx, def);
    if (def.look === 'pavilion') return W.pavilionBody(ctx, def);
    if (def.look === 'source' && W.sourceBody) return W.sourceBody(ctx, def);
    if (def.look === 'snow' && W.snowBody) return W.snowBody(ctx, def);
    S_.shadow(ctx, d.x, y0 + d.h + 8, d.w / 2 + 4, 12, 0.16);                                   // the deck sits on the ground
    if (def.look === 'plunge') {                                                                 // a stone rim pool in the snow
      S_.plate(ctx, x0, y0, d.w, d.h, 14, PAL.stone, PAL.stoneDark, 10);
      for (let i = 0; i < 9; i++) S_.ellipse(ctx, x0 + 16 + i * (d.w - 32) / 8, y0 + 10, 9, 5, (i & 1) ? SNOW : PAL.mix(PAL.stone, PAL.cream, 0.3));
      for (let i = 0; i < 9; i++) S_.ellipse(ctx, x0 + 16 + i * (d.w - 32) / 8, y0 + d.h - 10, 9, 5, (i & 1) ? SNOW : PAL.mix(PAL.stone, PAL.cream, 0.3));
      return;
    }
    S_.plate(ctx, x0, y0, d.w, d.h, 14, PAL.cedar, PAL.cedarDark, 10);
    ctx.strokeStyle = PAL.plank; ctx.lineWidth = 1; ctx.beginPath();
    for (let y = y0 + 18; y < y0 + d.h - 4; y += 18) { ctx.moveTo(x0 + 8, y); ctx.lineTo(x0 + d.w - 8, y); }
    ctx.stroke();
    ctx.strokeStyle = PAL.rgba(PAL.cream, 0.22); ctx.beginPath();                                 // plank highlights
    for (let y = y0 + 6; y < y0 + d.h - 4; y += 18) { ctx.moveTo(x0 + 10, y); ctx.lineTo(x0 + d.w - 10, y); }
    ctx.stroke();
    for (let i = 0; i < 6; i++) { const nx = x0 + 14 + i * (d.w - 28) / 5; S_.circle(ctx, nx, y0 + 12, 1.6, PAL.cedarDark); S_.circle(ctx, nx, y0 + d.h - 12, 1.6, PAL.cedarDark); }   // nail heads
    if (def.stripes) { for (let i = 0; i < 6; i++) S_.fillRRect(ctx, x0 + 6 + i * 6, y0 - 6, 4, d.h + 4, 2, PAL.moss); }
  };
  const DEPTH = PAL.rgba(PAL.cream, 0.13), DEPTH_COLD = PAL.rgba(PAL.cream, 0.08);
  // state: { cold, yuzu, lowFx }
  W.water = function (ctx, def, state, t) {
    const S_ = A(), w = def.water, x0 = w.x - w.w / 2, y0 = w.y - w.h / 2;
    if (def.look === 'sauna') {                                                                   // the hut's interior: bench, stove glow, steam
      S_.fillRRect(ctx, x0, y0, w.w, w.h, 8, state.cold ? '#4A4A50' : '#3A2A20');
      S_.fillRRect(ctx, x0 + 10, y0 + w.h * 0.55, w.w - 20, 8, 3, PAL.cedar);                       // the bench
      const glow = state.cold ? 0 : 0.6 + 0.3 * Math.sin(t * 6);
      S_.fillRRect(ctx, x0 + w.w - 34, y0 + 10, 24, 30, 5, PAL.boiler); if (glow > 0) S_.fillRRect(ctx, x0 + w.w - 30, y0 + 18, 16, 16, 3, PAL.rgba(PAL.amberDeep, glow));   // the stove
      if (state.cold) S_.strokeRRect(ctx, x0 + 1, y0 + 1, w.w - 2, w.h - 2, 7, PAL.cream, 2, true);
      return;
    }
    if (def.look === 'pavilion') {                                                                // a tatami mat with cushions
      S_.fillRRect(ctx, x0, y0, w.w, w.h, 8, '#C9B977'); S_.strokeRRect(ctx, x0 + 2, y0 + 2, w.w - 4, w.h - 4, 7, '#8E7F3F', 2);
      ctx.strokeStyle = PAL.rgba('#8E7F3F', 0.35); ctx.lineWidth = 1; ctx.beginPath(); for (let x = x0 + 12; x < x0 + w.w; x += 12) { ctx.moveTo(x, y0 + 4); ctx.lineTo(x, y0 + w.h - 4); } ctx.stroke();
      for (let i = 0; i < 4; i++) S_.fillRRect(ctx, x0 + 10 + i * (w.w - 20) / 4 + 4, y0 + w.h - 26, (w.w - 20) / 4 - 8, 18, 7, i & 1 ? PAL.red : PAL.cream);
      return;
    }
    if (def.look === 'source' && W.sourceWater) return W.sourceWater(ctx, def, state, t);
    if (def.look === 'snow' && W.snowWater) return W.snowWater(ctx, def, state, t);
    if (def.look === 'plunge') {                                                                  // ice-blue water, white rim, bobbing ice
      S_.strokeRRect(ctx, x0, y0, w.w, w.h, 18, PAL.stone, 6);
      S_.fillRRect(ctx, x0, y0, w.w, w.h, 18, state.yuzu ? PAL.waterYuzu : '#BFE3EC');
      S_.strokeRRect(ctx, x0 + 2, y0 + 2, w.w - 4, w.h - 4, 16, '#FFFFFF', 3);
      if (!state.lowFx) for (let i = 0; i < 3; i++) { const ix = w.x + (i - 1) * w.w * 0.28 + Math.sin(t * 0.9 + i * 2) * 4, iy = w.y + 14 + Math.cos(t * 1.2 + i) * 3; S_.fillRRect(ctx, ix - 7, iy - 6, 14, 12, 3, PAL.rgba('#FFFFFF', 0.85)); }
      return;
    }
    const fill = state.cold ? PAL.waterCold : state.yuzu ? PAL.waterYuzu : PAL.waterHot;
    S_.strokeRRect(ctx, x0, y0, w.w, w.h, 18, PAL.stone, 6);
    S_.fillRRect(ctx, x0, y0, w.w, w.h, 18, fill);
    S_.strokeRRect(ctx, x0 + 2, y0 + 2, w.w - 4, w.h - 4, 16, state.cold ? PAL.stone : state.yuzu ? PAL.amberDeep : PAL.waterHotDeep, 3);
    if (state.cold) S_.strokeRRect(ctx, x0 + 1, y0 + 1, w.w - 2, w.h - 2, 17, PAL.cream, 2, true);
    S_.fillRRect(ctx, x0 + 6, y0 + 5, w.w - 14, w.h - 18, 14, state.cold ? DEPTH_COLD : DEPTH);          // depth: the shallow, sunlit side
    if (!state.cold && !state.lowFx) {
      ctx.globalAlpha = 0.18; ctx.fillStyle = PAL.ripple;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(w.x + Math.sin(t * 0.7 + i * 2.1) * (w.w * 0.22), w.y - 10 + i * 12 + Math.cos(t * 0.5 + i) * 4, 26, 6, 0, 0, TAU); ctx.fill(); }
      // a foam line along the near edge
      ctx.globalAlpha = 0.35; ctx.strokeStyle = PAL.cream; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 16, y0 + w.h - 8); ctx.quadraticCurveTo(w.x, y0 + w.h - 12 + Math.sin(t * 2) * 2, x0 + w.w - 16, y0 + w.h - 8); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
  W.ripple = function (ctx, x, y, r, alpha) { ctx.globalAlpha = alpha; ctx.strokeStyle = PAL.ripple; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; };
  W.soakRing = function (ctx, x, y, frac) { A().ring(ctx, x, y, 14, frac, 3, PAL.cream, PAL.rgba(PAL.cream, 0.25)); };
  W.floatingYuzu = function (ctx, def, t) {
    const S_ = A(), w = def.water;
    for (let i = 0; i < 3; i++) { const x = w.x + (i - 1) * w.w * 0.3 + Math.sin(t * 1.3 + i) * 5, y = w.y + w.h * 0.28 + Math.cos(t * 1.1 + i * 2) * 3; S_.circle(ctx, x, y, 7, PAL.yuzu); S_.ellipse(ctx, x + 3, y - 6, 5, 2.2, PAL.yuzuLeaf); }
  };

  // ---------- offering step + lantern ----------
  W.step = function (ctx, x, y, fill, affordable, t) {
    const S_ = A();
    const pulse = affordable ? 1 + 0.05 * Math.sin(t * TAU * 1.5) : 1;
    S_.plate(ctx, x - 24, y - 10, 48, 20, 6, PAL.stone, PAL.stoneDark, 5);
    S_.fillRRect(ctx, x - 10, y - 46, 20, 12, 3, PAL.post);                                   // saisen box at the post's foot
    ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
    S_.ring(ctx, 0, 0, 30, fill, 6, PAL.cta, affordable ? PAL.rgba(PAL.cta, 0.55) : PAL.rgba(PAL.stoneDark, 0.7), !affordable && !(G.S && G.S.settings.lowFx));   // the dash is the costliest stroke on screen: none on Low effects
    ctx.restore();
  };
  // post + lamp + flame at the post's feet (x, y); flash = 0..1 after lighting; active = the step still accepts coins
  W.lantern = function (ctx, x, y, fill, lit, t, flash, active) {
    const S_ = A();
    S_.shadow(ctx, x, y, 10, 4);
    S_.fillRRect(ctx, x - 3, y - 44, 6, 44, 2, PAL.post);
    // shimenawa rope with three shide, 20 px above the step (i.e. 18 px below the post's feet), in front of the post
    A().line(ctx, x - 17, y + 18, x + 17, y + 18, PAL.cedarDark, 2);
    const shide = active && fill < 1 ? PAL.cream : lit ? PAL.amber : PAL.cream;
    for (let i = -1; i <= 1; i++) S_.tri(ctx, x + i * 10 - 3, y + 18, x + i * 10 + 3, y + 18, x + i * 10 + (i === 0 ? 0 : i), y + 28, shide);
    const lampCol = PAL.mix(PAL.lamp, PAL.amber, lit ? 1 : fill);
    S_.fillRRect(ctx, x - 11, y - 70, 22, 28, 6, lampCol);
    if (flash > 0) { ctx.globalAlpha = flash * 0.8; S_.fillRRect(ctx, x - 11, y - 70, 22, 28, 6, PAL.cream); ctx.globalAlpha = 1; }
    const fh = (lit ? 14 : 14 * fill) + (U.hash(Math.floor(t * 12), x) - 0.5) * 2;
    if (fh > 1) { ctx.fillStyle = PAL.amberDeep; ctx.beginPath(); ctx.moveTo(x, y - 52 - fh); ctx.quadraticCurveTo(x + 6, y - 50, x, y - 45); ctx.quadraticCurveTo(x - 6, y - 50, x, y - 52 - fh); ctx.fill();
      ctx.fillStyle = PAL.coinHi; ctx.beginPath(); ctx.moveTo(x, y - 48 - fh * 0.4); ctx.quadraticCurveTo(x + 2.5, y - 48, x, y - 46); ctx.quadraticCurveTo(x - 2.5, y - 48, x, y - 48 - fh * 0.4); ctx.fill(); }
    S_.fillRRect(ctx, x - 13, y - 72, 26, 5, 2, PAL.post);
    if (active && fill < 1 && !lit) S_.icon(ctx, 'koban', x + 13, y - 66, 12);
  };
  // Pounding Lap stepping stone: flat stone, amber while just touched, a pulsing ring on the one to touch next, all three warm while a lap is banked
  W.lapStone = function (ctx, x, y, glow, next, armed, t) {
    const S_ = A();
    S_.ellipse(ctx, x, y + 3, 20, 11, PAL.stoneDark);
    S_.ellipse(ctx, x, y, 20, 11, PAL.mix(PAL.stone, PAL.amber, Math.max(glow, armed ? 0.6 : 0)));
    if (next) { ctx.globalAlpha = 0.45 + 0.3 * Math.sin(t * 6); ctx.strokeStyle = PAL.cta; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 25, 15, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  };
  W.tray = function (ctx, x, y, value, bounce) {
    const S_ = A();
    const sc = 1 + 0.25 * bounce;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, 2 - sc);
    S_.plate(ctx, -20, -11, 40, 22, 6, PAL.cedar, PAL.cedarDark, 6);
    const n = Math.min(C.TRAY_STACK_MAX, Math.ceil(value / 5));
    for (let i = 0; i < n; i++) Art.FX.kobanAt(ctx, 0, -4 - i * 3, 1);
    ctx.restore();
    if (value >= C.COIN_BADGE_MIN) S_.pill(ctx, x, y - 24, 30 + (value >= 100 ? 10 : 0), 16, String(value), 12, PAL.cream, PAL.ink, null);
  };

  // ---------- stations ----------
  W.boilerBody = function (ctx, x, y) {
    const S_ = A();
    S_.shadow(ctx, x, y, 34, 9);
    S_.fillRRect(ctx, x + 14, y - 92, 12, 24, 3, PAL.boilerLight);
    S_.fillRRect(ctx, x - 30, y - 70, 60, 70, 12, PAL.boiler);
    S_.fillRRect(ctx, x - 30, y - 30, 60, 8, 2, PAL.boilerLight);
    S_.fillRRect(ctx, x - 18, y - 58, 36, 44, 6, PAL.ink);
    S_.fillRRect(ctx, x - 26, y - 6, 52, 6, 2, PAL.boilerLight);
  };
  W.boilerGlow = function (ctx, x, y, frac, rush, t) {
    const S_ = A(), h = 44 * U.clamp(frac, 0, 1);
    if (h > 0.5) { const flick = rush ? 0.5 + 0.5 * Math.sin(t * 20) : 0.8 + 0.2 * Math.sin(t * 6); S_.fillRRect(ctx, x - 16, y - 16 - h, 32, h + 2, 4, PAL.mix(PAL.amberDeep, PAL.amber, flick)); }
    A().line(ctx, x - 12, y - 30, x + 12, y - 30, PAL.boilerLight, 2);
  };
  W.woodpile = function (ctx, x, y) {
    const S_ = A();
    S_.shadow(ctx, x, y, 36, 8);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) {
      const lx = x - 26 + r * 13 + i * 26 - 13 + 13, ly = y - 5 - r * 9;
      S_.fillRRect(ctx, lx - 13, ly - 5, 26, 10, 4, PAL.cedarDark); S_.circle(ctx, lx + 11, ly, 4, PAL.cedar); S_.circle(ctx, lx + 11, ly, 1.5, PAL.cedarDark);
    }
  };
  W.treeBody = function (ctx, x, y) {
    const S_ = A();
    S_.shadow(ctx, x, y, 22, 7);
    S_.fillRRect(ctx, x - 5, y - 26, 10, 26, 3, PAL.cedarDark);
    const f0 = PAL.foliage || PAL.pine; S_.circle(ctx, x - 14, y - 36, 18, f0); S_.circle(ctx, x + 14, y - 36, 18, f0); S_.circle(ctx, x, y - 44, 22, f0);
    S_.circle(ctx, x - 8, y - 50, 10, PAL.moss);
  };
  W.treeFruit = function (ctx, x, y, progress, ripe, t) {
    const S_ = A();
    if (ripe) { const sc = 1 + 0.06 * Math.sin(t * 5); S_.circle(ctx, x - 6, y - 40, 7 * sc, PAL.yuzu); S_.ellipse(ctx, x - 3, y - 46, 5, 2.4, PAL.yuzuLeaf); ctx.strokeStyle = PAL.coinRim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x - 6, y - 40, 4.5, 0.3, 1.2); ctx.stroke(); }
    else { const r = 2 + 2 * U.clamp(progress, 0, 1); S_.circle(ctx, x - 6, y - 40, r, PAL.mix(PAL.frog, PAL.yuzu, progress * progress)); }
  };
  W.stallBody = function (ctx, x, y) {
    const S_ = A(), w = 120, h = 36;
    S_.shadow(ctx, x, y + 14, 64, 10);
    S_.fillRRect(ctx, x - 52, y - 60, 6, 48, 2, PAL.cedarDark); S_.fillRRect(ctx, x + 46, y - 60, 6, 48, 2, PAL.cedarDark);
    S_.plate(ctx, x - w / 2, y - h / 2, w, h, 6, PAL.cedar, PAL.cedarDark, 8);
    S_.fillRRect(ctx, x - 66, y - 76, 132, 18, 4, PAL.red);
    for (let i = 0; i < 6; i++) { if (i & 1) ctx.fillStyle = PAL.cream; else ctx.fillStyle = PAL.red; ctx.fillRect(x - 66 + i * 22, y - 76, 22, 18); }
    for (let i = 0; i < 5; i++) S_.circle(ctx, x - 52 + i * 26 + 13, y - 58, 13, (i & 1) ? PAL.red : PAL.cream);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = (i & 1) ? PAL.red : PAL.cream; ctx.fillRect(x - 52 + i * 26, y - 71, 26, 13); }
  };
  W.stallTop = function (ctx, x, y, stock, prepFrac) {
    const S_ = A();
    for (let i = 0; i < stock; i++) { const mx = x - 30 + i * 18; S_.circle(ctx, mx, y - 22, 8, PAL.cream); S_.circle(ctx, mx, y - 23, 2.6, PAL.red); }
    if (prepFrac > 0) S_.ring(ctx, x + 40, y - 24, 9, prepFrac, 3, PAL.cta, PAL.rgba(PAL.ink, 0.2));
  };
  W.bellPost = function (ctx, x, y, frac, pulse) {
    const S_ = A();
    S_.shadow(ctx, x, y, 10, 4);
    S_.fillRRect(ctx, x - 3, y - 40, 6, 40, 2, PAL.cedarDark);
    S_.fillRRect(ctx, x - 9, y - 52, 18, 16, 8, PAL.coin); S_.fillRRect(ctx, x - 11, y - 38, 22, 4, 2, PAL.coinRim); S_.circle(ctx, x, y - 33, 3, PAL.coinRim);
    const lw = pulse > 0 ? 5 + 2 * Math.abs(Math.sin(pulse * 10)) : 5;
    S_.ring(ctx, x, y - 44, MAP.BELL.ringR, frac, lw, PAL.cta, PAL.rgba(PAL.cream, 0.55));
  };
  // cabin hanging from the cable; swing in radians about the wheel; heads = capy heads in the window
  W.cableCar = function (ctx, x, swing, golden, heads) {
    const S_ = A(), cy = MAP.CABLE.y;
    ctx.save(); ctx.translate(x, cy); ctx.rotate(swing);
    S_.circle(ctx, 0, 0, 5, PAL.stoneDark); S_.fillRRect(ctx, -2, 0, 4, 17, 1, PAL.stoneDark);
    S_.fillRRect(ctx, -35, 17, 70, 40, 10, golden ? PAL.straw : PAL.red);
    S_.fillRRect(ctx, -35, 47, 70, 10, 6, golden ? PAL.coinRim : PAL.mix(PAL.red, PAL.ink, 0.35));
    S_.fillRRect(ctx, -28, 23, 56, 14, 3, PAL.cream);
    A().line(ctx, -9, 23, -9, 37, golden ? PAL.coinRim : PAL.red, 2); A().line(ctx, 9, 23, 9, 37, golden ? PAL.coinRim : PAL.red, 2);
    for (let i = 0; i < heads; i++) { const hx = -18 + i * 18; S_.circle(ctx, hx, 31, 5, PAL.capy); S_.circle(ctx, hx + 3, 32, 2.5, PAL.capySnout); }
    if (golden) { for (let i = 0; i < 4; i++) { A().line(ctx, -30 + i * 20, 56, -34 + i * 20 + Math.sin(i * 2) * 4, 70, PAL.red, 2); } }
    ctx.restore();
  };
  // footprint of a structure for the unwrap strips
  W.footprint = function (id, S, out) {
    const st = DATA.STATIONS;
    if (S.baths[id]) { const d = S.baths[id].def.deck; out.x0 = d.x - d.w / 2; out.y0 = d.y - d.h / 2; out.x1 = d.x + d.w / 2; out.y1 = d.y + d.h / 2; return out; }
    if (id === 'boiler') { out.x0 = st.boiler.x - 30; out.y0 = st.boiler.y - 92; out.x1 = st.boiler.x + 30; out.y1 = st.boiler.y; return out; }
    if (id === 'woodpile') { out.x0 = st.woodpile.x - 36; out.y0 = st.woodpile.y - 40; out.x1 = st.woodpile.x + 36; out.y1 = st.woodpile.y; return out; }
    if (id === 'grove') {   // the base trees' box (the ones that unwrap at build time)
      const sl = st.grove.slots, n = Math.min(C.TREES_BASE, sl.length); out.x0 = out.y0 = Infinity; out.x1 = out.y1 = -Infinity;
      for (let i = 0; i < n; i++) { out.x0 = Math.min(out.x0, sl[i][0] - 30); out.x1 = Math.max(out.x1, sl[i][0] + 30); out.y0 = Math.min(out.y0, sl[i][1] - 70); out.y1 = Math.max(out.y1, sl[i][1] + 10); }
      return out;
    }
    if (id === 'stall') { out.x0 = st.stall.x - 66; out.y0 = st.stall.y - 78; out.x1 = st.stall.x + 66; out.y1 = st.stall.y + 20; return out; }
    out.x0 = out.y0 = out.x1 = out.y1 = 0; return out;
  };
  W.unwrap = function (ctx, id, S, frac) {
    const r = W.footprint(id, S, R), w = (r.x1 - r.x0) / 4, h = r.y1 - r.y0;
    ctx.globalAlpha = 1 - frac; ctx.fillStyle = PAL.cream;
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(r.x0 + w * i + w / 2, r.y0 + 12 * frac); ctx.rotate((i & 1 ? 1 : -1) * 0.14 * frac); ctx.fillRect(-w / 2 + 1, 0, w - 2, h); ctx.restore(); }
    ctx.globalAlpha = 1;
  };
})(window.G);
