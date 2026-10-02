// Capy Springs - Summit art (GDD 20): the stage above the clouds (terrain, decor, the Source, the Snow Roll, the geyser cone), the snow-monkey guest,
// Grandma Yuzu, Kit sitting, Tsuru flying, the Summit icons. Same rules as 22_art_world.js: world objects have no outline, only a thickness band and a
// soft shadow; light from the top-left; everything placed with U.hash (never the seeded RNG); gradients only at a static rebuild, never per frame.
(function (G) {
  'use strict';
  const PAL = G.PAL, U = G.U, DATA = G.DATA, MAP = DATA.MAP;
  const Art = G.Art, W = Art.W, Ch = Art.Ch;
  const A = () => Art.S;
  const TAU = Math.PI * 2;
  const SU = MAP.SUMMIT || null, TR = MAP.TROUPE || null, NONE = {};
  // Summit-only colours: cold stone, snow and ice, warmed by the dawn
  const SNOW = '#E9EEF2', SNOW_HI = '#F9FBFC', SNOW_D = '#C6D1D8', SHADE = '#A9BCCB', FIELD = '#D9E2E9',
        ROCK = '#8B959E', ROCK_L = '#A9B2BA', ROCK_D = '#5E6872', CHASM = '#2F3D47', WET = '#4F5964', WET_D = '#3A424B', HOLE = '#2A2F36', MORTAR = '#D3DCE3',
        DAWN = '#F3C4B4', DAWN_GOLD = '#F8DDB8', CLOUD = '#FBF7F1', CLOUD_SH = '#E3CDD2', SUN = '#FCE7BC',
        ICE = '#CFE7EF', ICE_L = '#E2F1F6', ICE_D = '#9FCADA', ROOF = '#4A3A30', ROOF_D = '#30261F', STRAW_D = '#A8853F', SHIDE = '#FFFFFF',
        MONKEY = '#C9C2B6', MONKEY_D = '#9A948B', FACE = '#E36B6B', FACE_D = '#B9474A',
        GRAN = '#D9A77A', GRAN_D = '#8F6B4A', HAIR = '#EEE6DA', FLOWER = '#F2A7B6';
  let srcDef = null;
  const sourceDef = () => srcDef || (srcDef = DATA.BATHS.find(d => d.id === 'source') || null);

  // ---------- static layer: the snowfield, the dawn over a sea of clouds, the cliff above the troupe ledge, the chasm, the stairs, the torii ----------
  // the cliff's crest, left to right (x, y pairs); it dips to a snowy saddle at the lane where leaving guests walk off into the clouds
  const CLIFF = [62, -1204, 70, -1236, 88, -1256, 106, -1264, 124, -1256, 140, -1282, 160, -1294, 178, -1286, 196, -1298, 214, -1306, 230, -1286, 244, -1262,
                 256, -1246, 284, -1246, 296, -1262, 310, -1286, 326, -1298, 344, -1306, 362, -1290, 378, -1298, 398, -1282, 414, -1292, 432, -1274,
                 450, -1260, 466, -1242, 478, -1222, 484, -1204];
  const FOOTHOLDS = [[150, -1258, 36], [208, -1232, 30], [336, -1262, 34], [394, -1244, 46]];      // x, top, width: the shelves the monkeys hop down
  function crest(ctx, dy) { ctx.beginPath(); ctx.moveTo(CLIFF[0], CLIFF[1] + dy); for (let i = 2; i < CLIFF.length; i += 2) ctx.lineTo(CLIFF[i], CLIFF[i + 1] + dy); }
  W.summitTerrain = function (ctx, y0, y1) {
    if (!SU) return;
    const S_ = A(), top = SU.y0, lip = SU.mist.y1, low = SU.stairs.y0;
    ctx.fillStyle = FIELD; ctx.fillRect(0, y0, MAP.W, y1 - y0);
    for (let i = 0; i < 30; i++) {                                  // drifts: a blue shadow down-right, the snow, a lit crest
      const x = U.hash(i, 101) * 580 - 20, y = lip + 40 + U.hash(i, 102) * (low - lip - 70), rx = 34 + U.hash(i, 103) * 66, ry = 9 + U.hash(i, 104) * 13;
      S_.ellipse(ctx, x + 7, y + 5, rx, ry, PAL.rgba(SHADE, 0.6)); S_.ellipse(ctx, x, y, rx, ry, SNOW); S_.ellipse(ctx, x - rx * 0.3, y - ry * 0.32, rx * 0.46, ry * 0.42, SNOW_HI);
    }
    for (let i = 0, n = 0; i < 30 && n < 11; i++) {                 // bare rock breaking through the snow, never on the lane
      const x = 16 + U.hash(i, 111) * 508, y = -1150 + U.hash(i, 112) * 840; if (Math.abs(x - SU.stairs.x) < 56) continue; n++;
      const w = 16 + U.hash(i, 113) * 26, h = 8 + U.hash(i, 114) * 7;
      S_.fillRRect(ctx, x - w / 2 + 3, y - h / 2 + 3, w, h, h / 2, PAL.rgba(SHADE, 0.75)); S_.fillRRect(ctx, x - w / 2, y - h / 2, w, h, h / 2, ROCK_D);
      S_.fillRRect(ctx, x - w / 2 + 2, y - h / 2 + 1, w * 0.55, h * 0.45, h / 3, ROCK); S_.ellipse(ctx, x - w * 0.08, y - h / 2, w * 0.4, 2.6, SNOW);
    }
    lane(ctx);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.4; ctx.beginPath();   // glints in the snow
    for (let i = 0; i < 28; i++) { const x = U.hash(i, 121) * 540, y = lip + 50 + U.hash(i, 122) * (low - lip - 90), s = 1.8 + U.hash(i, 123) * 2.4; ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s * 1.5); ctx.lineTo(x, y + s * 1.5); }
    ctx.stroke();
    let g = ctx.createLinearGradient(0, lip, 0, lip + 520); g.addColorStop(0, PAL.rgba(DAWN, 0.4)); g.addColorStop(1, PAL.rgba(DAWN, 0));   // alpenglow on the high snow
    ctx.fillStyle = g; ctx.fillRect(0, lip, MAP.W, 520);
    // the dawn sky over a sea of clouds (the game's mist gradient lies over this band)
    g = ctx.createLinearGradient(0, top, 0, lip); g.addColorStop(0, PAL.mix(PAL.skyDay, DAWN, 0.4)); g.addColorStop(0.6, DAWN); g.addColorStop(1, DAWN_GOLD);
    ctx.fillStyle = g; ctx.fillRect(0, top, MAP.W, lip - top + 4);
    S_.circle(ctx, 446, top + 34, 30, PAL.rgba(SUN, 0.5)); S_.circle(ctx, 446, top + 34, 21, SUN);                                    // the sun, just up
    for (let r = 0; r < 3; r++) {                                   // three rows of cloud tops, pinker and smaller toward the horizon
      const cy = top + 32 + r * 16, rx = 24 + r * 8, ry = 8 + r * 2.5, col = r === 0 ? PAL.mix(CLOUD, DAWN, 0.45) : r === 1 ? PAL.mix(CLOUD, DAWN, 0.2) : CLOUD;
      for (let i = 0, x = -20 + r * 23; x < MAP.W + 30; i++, x += rx * 1.5 + U.hash(i, 131 + r) * 14) {
        const yy = cy + (U.hash(i, 134 + r) - 0.5) * 6;
        S_.ellipse(ctx, x + 4, yy + ry * 0.5, rx, ry * 0.75, CLOUD_SH); S_.ellipse(ctx, x, yy, rx, ry, col);
      }
    }
    for (let i = 0, x = -10; x < MAP.W + 20; i++, x += 30 + U.hash(i, 141) * 12) { S_.ellipse(ctx, x + 4, lip + 6, 24, 8, PAL.rgba(SHADE, 0.75)); S_.ellipse(ctx, x, lip + 2, 24, 9, SNOW); }   // the plateau's snowy north edge
    cliff(ctx);
    chasm(ctx); stairs(ctx); torii(ctx);
  };
  // the lane: a faint trodden path up the middle with flat stepping stones (guests walk it from the stairs to the ledge)
  function lane(ctx) {
    const S_ = A(), x = SU.stairs.x, y0 = SU.boundsY0, y1 = SU.stairs.y0 - 4;
    ctx.fillStyle = PAL.rgba(SHADE, 0.32); ctx.beginPath();          // one fill for the whole path: no darker overlaps
    for (let y = y0; y < y1; y += 22) { const cx = x + (U.hash(y, 131) - 0.5) * 8; ctx.moveTo(cx + 28, y); ctx.ellipse(cx, y, 28, 13, 0, 0, TAU); }
    ctx.fill();
    for (let y = y0 + 18; y < y1 - 8; y += 40) {
      const cx = x + (U.hash(y, 9) - 0.5) * 16;
      S_.ellipse(ctx, cx + 2, y + 3, 13, 7, PAL.rgba(ROCK_D, 0.5)); S_.ellipse(ctx, cx, y, 13, 7, PAL.mix(PAL.stone, PAL.cream, 0.3)); S_.ellipse(ctx, cx - 3, y - 2.5, 7, 3, SNOW_HI);
    }
  }
  // the cliff behind the troupe ledge: lit buttresses, dark cracks, snow on every crest, four footholds, a snowy saddle at the lane
  function cliff(ctx) {
    const S_ = A();
    crest(ctx, 0); ctx.lineTo(484, -1196); ctx.lineTo(62, -1196); ctx.closePath(); ctx.fillStyle = ROCK; ctx.fill();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 19; i++) {
      const x = 64 + i * 23 + U.hash(i, 151) * 8, w = 8 + U.hash(i, 152) * 6;
      ctx.fillStyle = ROCK_L; ctx.fillRect(x, -1312, w, 120);
      ctx.fillStyle = PAL.rgba(ROCK_D, 0.75); ctx.fillRect(x + w + 4 + U.hash(i, 153) * 4, -1312, 2.5, 120);
    }
    ctx.strokeStyle = PAL.rgba(ROCK_D, 0.35); ctx.lineWidth = 2; ctx.beginPath();                              // strata
    for (let k = 0; k < 3; k++) { const y = -1276 + k * 22; ctx.moveTo(60, y); for (let x = 60; x <= 490; x += 30) ctx.lineTo(x, y + Math.sin(x * 0.05 + k) * 3); }
    ctx.stroke();
    ctx.fillStyle = PAL.rgba(ROCK_D, 0.45); ctx.fillRect(60, -1226, 430, 30);                                   // the foot in its own shade
    ctx.restore();
    S_.ellipse(ctx, 270, -1222, 31, 25, SNOW); S_.ellipse(ctx, 262, -1232, 16, 8, SNOW_HI);                      // the saddle
    crest(ctx, 3); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = SNOW_D; ctx.lineWidth = 7; ctx.stroke();
    crest(ctx, 0); ctx.strokeStyle = SNOW; ctx.lineWidth = 7; ctx.stroke(); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    for (let i = 0; i < FOOTHOLDS.length; i++) { const f = FOOTHOLDS[i]; S_.plate(ctx, f[0] - f[2] / 2, f[1], f[2], 6, 3, ROCK_L, ROCK_D, 5); S_.fillRRect(ctx, f[0] - f[2] / 2 + 1, f[1] - 3, f[2] - 2, 5, 2.5, SNOW); }
    S_.ellipse(ctx, 271, -1219, 10, 5.5, PAL.mix(PAL.stone, PAL.cream, 0.3)); S_.ellipse(ctx, 268, -1238, 9, 5, PAL.mix(PAL.stone, PAL.cream, 0.3));   // the last stones, into the clouds
    for (let s = 0; s < 2; s++) { const x = s ? 470 : 70; S_.ellipse(ctx, x + 4, -1196, 30, 9, PAL.rgba(SHADE, 0.8)); S_.ellipse(ctx, x, -1200, 28, 9, SNOW); }   // snow banked at its feet
  }
  // the chasm either side of the stairs: a dark drop with the far wall, icicles under the lip, a mist floor (like the Ridge's, deeper)
  function chasm(ctx) {
    const S_ = A(), ch = SU.chasm;
    let g = null;
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i], x0 = c[0], x1 = c[2], y0 = c[1], y1 = c[3], w = x1 - x0;
      ctx.fillStyle = CHASM; ctx.fillRect(x0, y0, w, y1 - y0);
      ctx.fillStyle = PAL.mix(ROCK_D, CHASM, 0.35); ctx.beginPath(); ctx.moveTo(x0, y0);                       // the far wall falling away into the dark
      for (let x = x0; x <= x1 + 11; x += 12) ctx.lineTo(Math.min(x, x1), y0 + 22 + U.hash(x, 161) * 24);
      ctx.lineTo(x1, y0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = PAL.rgba(ROCK, 0.45); ctx.lineWidth = 2; ctx.beginPath();
      for (let x = x0 + 10; x < x1 - 4; x += 26) { ctx.moveTo(x, y0 + 6); ctx.lineTo(x + 2, y0 + 18 + U.hash(x, 162) * 18); }
      ctx.stroke();
      if (!g) { g = ctx.createLinearGradient(0, y0 + 30, 0, y1); g.addColorStop(0, PAL.rgba(PAL.mist, 0)); g.addColorStop(1, PAL.rgba(PAL.mist, 0.85)); }   // both drops share their y span
      ctx.fillStyle = g; ctx.fillRect(x0, y0 + 30, w, y1 - y0 - 30);
      ctx.globalAlpha = 0.45; for (let k = 0; k < 3; k++) S_.ellipse(ctx, x0 + w * (0.18 + 0.32 * k) + U.hash(i, 163 + k) * 16, y1 - 30 + k * 5, 34, 8, PAL.cream); ctx.globalAlpha = 1;
      for (let k = 0, x = x0 + 8; x < x1 - 6; k++, x += 15 + U.hash(k, 164 + i) * 10) { const len = 6 + U.hash(k, 166 + i) * 13; S_.tri(ctx, x - 3, y0 + 1, x + 3, y0 + 1, x, y0 + 1 + len, (k & 1) ? ICE : SNOW_HI); }
      S_.fillRRect(ctx, x0 - 6, y0 - 8, w + 12, 12, 6, SNOW_D); S_.fillRRect(ctx, x0 - 6, y0 - 12, w + 12, 9, 5, SNOW);      // the snow lip
    }
  }
  // the Pilgrim Stairs: lit treads over shaded risers, snow banked at both ends, stone kerbs, a landing under the torii
  function stairs(ctx) {
    const S_ = A(), st = SU.stairs, x0 = st.x - st.w / 2, x1 = st.x + st.w / 2, len = st.y1 - st.y0;
    for (let y = st.y0; y < st.y1; y += 14) {
      S_.fillRRect(ctx, x0, y, st.w, 15, 3, PAL.stoneDark); S_.fillRRect(ctx, x0, y, st.w, 9, 3, PAL.stone);
      S_.fillRRect(ctx, x0 + 5, y + 1, st.w - 10, 2, 1, PAL.mix(PAL.stone, PAL.cream, 0.45));
      S_.ellipse(ctx, x0 + 6, y + 3, 8, 3.5, SNOW); S_.ellipse(ctx, x1 - 6, y + 3, 8, 3.5, SNOW);
    }
    for (let s = 0; s < 2; s++) { const kx = s ? x1 - 1 : x0 - 7; S_.fillRRect(ctx, kx, st.y0 - 4, 8, len + 4, 3, ROCK_D); S_.fillRRect(ctx, kx + 1, st.y0 - 4, 5, len + 2, 2.5, ROCK_L); S_.fillRRect(ctx, kx + 1, st.y0 - 6, 6, 5, 2.5, SNOW); }
    S_.plate(ctx, x0 - 10, st.y0 - 22, st.w + 20, 16, 5, PAL.stone, PAL.stoneDark, 5);                          // the landing
    S_.fillRRect(ctx, x0 - 8, st.y0 - 24, 18, 5, 2.5, SNOW); S_.fillRRect(ctx, x1 - 10, st.y0 - 24, 18, 5, 2.5, SNOW);
  }
  // the red torii over the top of the stairs: posts outside the path, black feet, two beams, a black kasagi with upturned ends and snow on it
  function torii(ctx) {
    const S_ = A(), tx = SU.torii.x, ty = SU.torii.y, RED = PAL.red, RED_D = PAL.mix(PAL.red, PAL.ink, 0.3), BLACK = '#2B2B31';
    for (let s = -1; s <= 1; s += 2) {
      const px = tx + s * 40;
      S_.shadow(ctx, px + 4, ty + 1, 10, 3.5, 0.24);
      S_.fillRRect(ctx, px - 4.5, ty - 66, 9, 66, 2, RED); S_.fillRRect(ctx, px + 1.5, ty - 66, 3, 66, 1.5, RED_D);
      S_.fillRRect(ctx, px - 5.5, ty - 8, 11, 8, 2, BLACK);
    }
    S_.fillRRect(ctx, tx - 50, ty - 54, 100, 7, 2, RED); S_.fillRRect(ctx, tx - 50, ty - 49, 100, 2, 1, RED_D);           // nuki, the lower beam
    S_.fillRRect(ctx, tx - 4, ty - 66, 8, 14, 1, RED);                                                                   // the centre strut
    S_.fillRRect(ctx, tx - 50, ty - 71, 100, 7, 2, RED); S_.fillRRect(ctx, tx - 50, ty - 66, 100, 2, 1, RED_D);           // shimaki
    ctx.fillStyle = BLACK; ctx.beginPath(); ctx.moveTo(tx - 57, ty - 83); ctx.quadraticCurveTo(tx, ty - 72, tx + 57, ty - 83); ctx.lineTo(tx + 53, ty - 74);
    ctx.quadraticCurveTo(tx, ty - 66, tx - 53, ty - 74); ctx.closePath(); ctx.fill();                                     // kasagi, upturned
    ctx.strokeStyle = SNOW; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx - 53, ty - 82); ctx.quadraticCurveTo(tx, ty - 71.5, tx + 53, ty - 82); ctx.stroke(); ctx.lineCap = 'butt';
  }

  // ---------- static decor: pines, rocks, lanterns, vents, the troupe ledge, Grandma's hut, the waterfall, the sleeping Source ----------
  let DECOR = null;                                                   // built once, sorted by base y so nearer things overlap farther ones
  function decorList() {
    if (DECOR) return DECOR;
    DECOR = [];
    for (let i = 0; i < SU.pines.length; i++) DECOR.push({ k: 'pine', x: SU.pines[i][0], y: SU.pines[i][1], i });
    for (let i = 0; i < SU.rocks.length; i++) DECOR.push({ k: 'rock', x: SU.rocks[i][0], y: SU.rocks[i][1], i });
    for (let i = 0; i < SU.stoneLanterns.length; i++) DECOR.push({ k: 'lantern', x: SU.stoneLanterns[i][0], y: SU.stoneLanterns[i][1], i });
    if (SU.hut) DECOR.push({ k: 'hut', x: SU.hut.x, y: SU.hut.y + SU.hut.h / 2, i: 0 });
    if (SU.waterfall) DECOR.push({ k: 'falls', x: SU.waterfall.x, y: SU.waterfall.y + SU.waterfall.h / 2 + 10, i: 0 });
    if (TR) DECOR.push({ k: 'ledge', x: TR.platform.x, y: TR.platform.y, i: 0 });
    const sd = sourceDef(); if (sd && sd.coneAt) DECOR.push({ k: 'cone', x: sd.coneAt.x, y: sd.coneAt.y, i: 0 });
    DECOR.sort((a, b) => a.y - b.y);
    return DECOR;
  }
  W.summitDecor = function (ctx, S) {
    if (!SU) return;
    const built = (S && S.built) || NONE, L = decorList();
    for (let i = 0; i < SU.vents.length; i++) vent(ctx, SU.vents[i][0], SU.vents[i][1], !!built.source);
    if (!built.source) sleepingSpring(ctx);
    for (let i = 0; i < L.length; i++) {
      const d = L[i];
      if (d.k === 'pine') W.snowPine(ctx, d.x, d.y);
      else if (d.k === 'rock') rock(ctx, d.x, d.y, 0.85 + U.hash(d.i, 171) * 0.35);
      else if (d.k === 'lantern') { A().shadow(ctx, d.x + 4, d.y + 1, 13, 4); W.stoneLantern(ctx, d.x, d.y, false); A().tri(ctx, d.x - 7, d.y - 39, d.x + 7, d.y - 39, d.x, d.y - 45, SNOW); A().ellipse(ctx, d.x - 2, d.y - 8, 7, 2.2, SNOW); }
      else if (d.k === 'hut') hut(ctx, built);
      else if (d.k === 'falls') waterfall(ctx, !!built.awake);
      else if (d.k === 'ledge') ledge(ctx);
      else if (d.k === 'cone' && !built.source) sleepingCone(ctx, d.x, d.y);
    }
  };
  function rock(ctx, x, y, s) {                                       // the Ridge's rock recipe with a contact shadow
    const S_ = A();
    S_.shadow(ctx, x + 5, y + 3, 19 * s, 6 * s);
    S_.ellipse(ctx, x + 6 * s, y + 2, 16 * s, 9 * s, PAL.stoneDark); S_.ellipse(ctx, x, y - 4 * s, 18 * s, 11 * s, PAL.stone); S_.ellipse(ctx, x - 4 * s, y - 10 * s, 12 * s, 5 * s, SNOW);
  }
  // a steam vent: a dark hole in a ring of warm stone, melted snow around it; it glows deeper once the Source is awake (the puffs are FX)
  function vent(ctx, x, y, warm) {
    const S_ = A();
    S_.ellipse(ctx, x + 3, y + 3, 21, 9, PAL.rgba(SHADE, warm ? 0.95 : 0.6));
    S_.ellipse(ctx, x, y, 16, 7.5, PAL.mix(PAL.stone, PAL.amberDeep, warm ? 0.32 : 0.14));
    S_.ellipse(ctx, x - 4, y - 3, 8, 2.5, PAL.rgba('#FFFFFF', 0.35));
    S_.ellipse(ctx, x + 1, y + 1, 10, 4.4, HOLE);
    S_.ellipse(ctx, x + 1, y + 3.3, 7, 1.5, PAL.rgba(PAL.amberDeep, warm ? 0.6 : 0.22));
    S_.circle(ctx, x - 17, y + 5, 2.4, PAL.stone); S_.circle(ctx, x + 18, y + 2, 2, PAL.stoneDark); S_.circle(ctx, x + 12, y + 8, 1.8, PAL.stone);
  }
  // the troupe ledge: a snow-covered rock shelf (the lift platform's recipe in stone), rough rock under its lip, steps down to the lane
  function ledge(ctx) {
    const S_ = A(), p = TR.platform, x0 = p.x - p.w / 2, y0 = p.y - p.h / 2, yb = y0 + p.h;
    S_.shadow(ctx, p.x + 6, yb + 12, p.w / 2 + 8, 11, 0.18);
    for (let i = 0; i < 7; i++) { const x = x0 + 18 + i * (p.w - 36) / 6 + (U.hash(i, 172) - 0.5) * 14, r = 8 + U.hash(i, 173) * 6; S_.ellipse(ctx, x, yb + 8, r * 1.5, r, ROCK_D); }
    S_.plate(ctx, x0, y0, p.w, p.h, 14, PAL.mix(PAL.stone, ROCK, 0.5), ROCK_D, 10);
    S_.fillRRect(ctx, x0 + 8, y0 + 6, p.w - 16, 3, 1.5, PAL.rgba('#FFFFFF', 0.22));                                     // the lit edge
    ctx.strokeStyle = PAL.rgba(ROCK_D, 0.4); ctx.lineWidth = 1.5; ctx.beginPath();                                           // cracks in the shelf
    for (let i = 0; i < 6; i++) { const x = x0 + 30 + i * 46 + U.hash(i, 174) * 16, y = y0 + 16 + U.hash(i, 175) * 24; ctx.moveTo(x, y); ctx.lineTo(x + 9, y + 4); ctx.lineTo(x + 14, y + 2); }
    ctx.stroke();
    S_.fillRRect(ctx, x0 + 4, y0 - 6, p.w - 8, 10, 5, SNOW);                                                               // snow banked against the cliff
    for (let i = 0; i < 9; i++) S_.ellipse(ctx, x0 + 14 + i * (p.w - 28) / 8, y0 + U.hash(i, 176) * 3, 13 + U.hash(i, 177) * 8, 5, SNOW);
    S_.ellipse(ctx, x0 + 16, yb - 4, 20, 9, SNOW); S_.ellipse(ctx, x0 + p.w - 18, yb - 6, 24, 10, SNOW); S_.ellipse(ctx, x0 + 12, yb - 8, 9, 4, SNOW_HI);   // drifts on the corners
    for (let k = 0, x = x0 + 22; x < x0 + p.w - 20; k++, x += 22 + U.hash(k, 178) * 18) { if (Math.abs(x - p.x) < 34) continue; S_.tri(ctx, x - 3, yb + 9, x + 3, yb + 9, x, yb + 15 + U.hash(k, 179) * 8, ICE); }   // icicles
    for (let k = 0; k < 2; k++) S_.plate(ctx, p.x - 22 + k * 3, yb + 6 + k * 9, 44 - k * 6, 7, 3, PAL.stone, PAL.stoneDark, 4);   // two steps down to the lane
  }
  // Grandma's hut: cedar log walls on a stone footing, an upturned dark roof with snow on the ridge, a chimney, a round paper window, a shoji door
  // (warm amber once the Source is awake). The shrine adds a brass bell and its rope under the eave on the door side, a red paper lantern, Kaa's perch.
  function hut(ctx, built) {
    const S_ = A(), h = SU.hut, x0 = h.x - h.w / 2, x1 = h.x + h.w / 2, yb = h.y + h.h / 2, wy0 = h.solid.y0, wy1 = h.solid.y1 + 2, dx = h.door.x;
    const ex = wy0 + 6, rt = ex - 60, awake = !!built.awake;
    S_.shadow(ctx, h.x + 8, yb + 2, h.w / 2 + 12, 11, 0.2);
    if (awake) S_.ellipse(ctx, dx, yb + 6, 26, 8, PAL.rgba(PAL.amber, 0.35));                                              // door light on the snow
    S_.plate(ctx, x0 - 2, wy1 - 6, h.w + 4, 12, 4, PAL.stone, PAL.stoneDark, 5);                                           // stone footing
    S_.fillRRect(ctx, x0 + 4, wy0, h.w - 8, wy1 - wy0, 6, PAL.cedarDark);                                                   // log walls
    ctx.strokeStyle = PAL.rgba(PAL.ink, 0.25); ctx.lineWidth = 1; ctx.beginPath(); for (let y = wy0 + 10; y < wy1 - 2; y += 9) { ctx.moveTo(x0 + 8, y); ctx.lineTo(x1 - 8, y); } ctx.stroke();
    for (let y = wy0 + 8; y < wy1 - 4; y += 9) { S_.circle(ctx, x0 + 6, y, 4, PAL.cedar); S_.circle(ctx, x1 - 6, y, 4, PAL.cedar); S_.circle(ctx, x0 + 6, y, 1.4, PAL.cedarDark); S_.circle(ctx, x1 - 6, y, 1.4, PAL.cedarDark); }   // log ends
    const wx = x0 + 36, wyc = wy0 + 32;                                                                                    // the round paper window, lit from inside
    S_.circle(ctx, wx, wyc, 15, PAL.cedar); S_.circle(ctx, wx, wyc, 12, PAL.mix(PAL.cream, PAL.amber, awake ? 0.55 : 0.28));
    ctx.strokeStyle = PAL.cedarDark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx, wyc - 12); ctx.lineTo(wx, wyc + 12); ctx.moveTo(wx - 12, wyc); ctx.lineTo(wx + 12, wyc); ctx.stroke();
    S_.fillRRect(ctx, dx - 14, wy1 - 40, 28, 38, 3, PAL.cedarDark);                                                        // the door: frame, paper panes, lattice
    S_.fillRRect(ctx, dx - 11, wy1 - 37, 22, 33, 2, awake ? PAL.mix(PAL.amber, PAL.cream, 0.25) : PAL.mix(PAL.cream, PAL.stoneDark, 0.18));
    ctx.strokeStyle = PAL.cedar; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(dx, wy1 - 37); ctx.lineTo(dx, wy1 - 4);
    for (let k = 1; k < 4; k++) { ctx.moveTo(dx - 11, wy1 - 37 + k * 8.25); ctx.lineTo(dx + 11, wy1 - 37 + k * 8.25); } ctx.stroke();
    if (awake) S_.fillRRect(ctx, dx - 9, wy1 - 35, 7, 12, 2, PAL.rgba('#FFFFFF', 0.4));
    S_.plate(ctx, dx - 13, wy1 - 1, 26, 6, 2, PAL.mix(PAL.stone, PAL.cream, 0.25), PAL.stoneDark, 3);                       // the step
    // the roof: a dark thickness band, then the roof, ribs, snow on the ridge line and the tips
    const roof = (dy) => { ctx.beginPath(); ctx.moveTo(x0 + 26, rt + dy); ctx.lineTo(x1 - 26, rt + dy); ctx.quadraticCurveTo(x1 - 14, ex - 36 + dy, x1 + 18, ex - 10 + dy); ctx.lineTo(x1 + 10, ex + dy);
      ctx.lineTo(x0 - 10, ex + dy); ctx.lineTo(x0 - 18, ex - 10 + dy); ctx.quadraticCurveTo(x0 + 14, ex - 36 + dy, x0 + 26, rt + dy); ctx.closePath(); };
    roof(6); ctx.fillStyle = ROOF_D; ctx.fill(); roof(0); ctx.fillStyle = ROOF; ctx.fill();
    ctx.strokeStyle = PAL.rgba(PAL.cream, 0.12); ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 1; k < 8; k++) { const u = k / 8; ctx.moveTo(x0 + 26 + u * (h.w - 52), rt + 6); ctx.lineTo(x0 - 6 + u * (h.w + 12), ex - 3); } ctx.stroke();
    S_.fillRRect(ctx, x0 - 8, ex - 3, h.w + 16, 4, 2, PAL.rgba(PAL.cedar, 0.6));                                            // the eave's board
    const cx = x1 - 34;                                                                                                       // chimney (its smoke is FX)
    S_.fillRRect(ctx, cx, rt - 16, 14, 34, 2, PAL.stone); S_.fillRRect(ctx, cx + 9, rt - 16, 5, 34, 2, PAL.stoneDark); S_.fillRRect(ctx, cx - 2, rt - 20, 18, 6, 2, PAL.stoneDark); S_.fillRRect(ctx, cx - 2, rt - 24, 18, 5, 2.5, SNOW);
    S_.fillRRect(ctx, x0 + 22, rt - 6, h.w - 44, 11, 5, SNOW);                                                              // snow along the ridge line
    for (let k = 0; k < 5; k++) S_.ellipse(ctx, x0 + 32 + k * 15, rt + 5, 5, 3.5, SNOW);
    S_.ellipse(ctx, x0 - 14, ex - 10, 6, 3, SNOW); S_.ellipse(ctx, x1 + 14, ex - 10, 6, 3, SNOW);
    if (built.shrine) {
      const bx = x1 - 6, lx = dx - 25;
      A().line(ctx, bx, ex, bx, ex + 6, PAL.ink, 2);                                                                       // the brass bell, its red and cream rope
      S_.fillRRect(ctx, bx - 6, ex + 5, 12, 11, 5, PAL.coin); S_.fillRRect(ctx, bx - 7.5, ex + 14, 15, 3, 1.5, PAL.coinRim); S_.circle(ctx, bx, ex + 18, 2, PAL.coinRim);
      A().line(ctx, bx, ex + 19, bx, ex + 46, PAL.red, 3); for (let k = 0; k < 3; k++) S_.fillRRect(ctx, bx - 1.5, ex + 23 + k * 8, 3, 3, 1, PAL.cream);
      S_.fillRRect(ctx, bx - 2.5, ex + 45, 5, 6, 2, PAL.red);
      A().line(ctx, lx, ex, lx, ex + 5, PAL.ink, 1.5);                                                                     // the red paper lantern by the door
      S_.fillRRect(ctx, lx - 4, ex + 4, 8, 3, 1, PAL.ink); S_.fillRRect(ctx, lx - 7, ex + 6, 14, 18, 6, PAL.red); S_.fillRRect(ctx, lx - 4, ex + 23, 8, 3, 1, PAL.ink);
      ctx.strokeStyle = PAL.rgba(PAL.ink, 0.25); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(lx - 6, ex + 6 + k * 4.5); ctx.lineTo(lx + 6, ex + 6 + k * 4.5); } ctx.stroke();
      S_.fillRRect(ctx, lx - 4.5, ex + 9, 2.5, 11, 1, PAL.rgba(PAL.cream, 0.5));
      const pp = h.perch;                                                                                                   // Kaa's perch on the ridge: a bar on two little legs
      S_.fillRRect(ctx, pp.x - 7, pp.y + 2, 3, 9, 1, PAL.cedarDark); S_.fillRRect(ctx, pp.x + 4, pp.y + 2, 3, 9, 1, PAL.cedarDark); S_.fillRRect(ctx, pp.x - 12, pp.y, 24, 4, 2, PAL.cedar);
    }
  }
  // the waterfall: a rock face with a frozen cascade (ice columns, icicle tips, a frozen pool); awake: running teal water, foam, a steaming pool
  function waterfall(ctx, awake) {
    const S_ = A(), f = SU.waterfall, cx0 = f.x - f.w / 2, top = f.y - f.h / 2, bot = f.y + f.h / 2, py = bot + 9;
    S_.shadow(ctx, f.x + 10, py + 10, 70, 12, 0.16);
    ctx.beginPath(); ctx.moveTo(cx0 - 24, py + 4); ctx.lineTo(cx0 - 22, top + 34); ctx.lineTo(cx0 - 10, top - 4); ctx.lineTo(cx0 + 12, top - 22); ctx.lineTo(f.x + 4, top - 26);
    ctx.lineTo(f.x + 26, top - 20); ctx.lineTo(f.x + 46, top - 30); ctx.lineTo(f.x + 64, top - 18); ctx.lineTo(MAP.W + 10, top - 12); ctx.lineTo(MAP.W + 10, py + 4); ctx.closePath();
    ctx.fillStyle = ROCK; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = ROCK_L; ctx.fillRect(cx0 - 26, top - 40, 16, 200); ctx.fillRect(f.x + f.w / 2 + 6, top - 40, 12, 200);
    ctx.fillStyle = PAL.rgba(ROCK_D, 0.7); ctx.fillRect(cx0 - 6, top - 40, 4, 200); ctx.fillRect(f.x + f.w / 2 + 22, top - 40, 3, 200);
    ctx.restore();
    ctx.strokeStyle = SNOW; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx0 - 22, top + 30); ctx.lineTo(cx0 - 10, top - 4); ctx.lineTo(cx0 + 12, top - 22); ctx.lineTo(f.x + 4, top - 26);
    ctx.lineTo(f.x + 26, top - 20); ctx.lineTo(f.x + 46, top - 30); ctx.lineTo(f.x + 64, top - 18); ctx.lineTo(MAP.W + 4, top - 12); ctx.stroke(); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    const n = 5, cw = f.w / n;
    if (!awake) {
      S_.ellipse(ctx, f.x + 2, py + 3, f.w / 2 + 14, 13, ICE_D); S_.ellipse(ctx, f.x, py, f.w / 2 + 12, 12, ICE);           // the frozen pool
      for (let i = 0; i < n; i++) {
        const x = cx0 + i * cw, b = bot - 4 - U.hash(i, 181) * 18, col = (i & 1) ? ICE : ICE_L;
        S_.fillRRect(ctx, x, top, cw + 1, b - top, 5, col); S_.tri(ctx, x + 2, b - 3, x + cw - 1, b - 3, x + cw / 2 + 0.5, b + 9 + U.hash(i, 182) * 6, col);
        S_.fillRRect(ctx, x + 2, top + 8, 3, b - top - 16, 1.5, '#FFFFFF'); S_.fillRRect(ctx, x + cw - 3, top + 6, 2.5, b - top - 10, 1, ICE_D);
      }
      S_.fillRRect(ctx, cx0 - 4, top - 6, f.w + 8, 10, 5, SNOW);
      S_.ellipse(ctx, f.x - 14, py - 3, 14, 3, PAL.rgba('#FFFFFF', 0.7)); S_.ellipse(ctx, f.x + 22, py + 4, 8, 2, PAL.rgba('#FFFFFF', 0.6));
      for (let i = 0; i < 4; i++) S_.ellipse(ctx, f.x - f.w / 2 - 10 + i * 30, py + 11 - (i & 1) * 3, 14, 5, SNOW);      // snow on the pool's rim
    } else {
      S_.ellipse(ctx, f.x + 2, py + 3, f.w / 2 + 14, 13, PAL.stoneDark); S_.ellipse(ctx, f.x, py, f.w / 2 + 12, 12, PAL.waterHot);   // the pool, now steaming
      S_.ellipse(ctx, f.x, py + 1, f.w / 2 + 2, 7, PAL.mix(PAL.waterHot, PAL.ripple, 0.3));
      for (let i = 0; i < n; i++) S_.fillRRect(ctx, cx0 + i * cw, top, cw + 1, py - top - 2, 4, (i & 1) ? PAL.waterHot : PAL.mix(PAL.waterHot, PAL.ripple, 0.35));
      ctx.strokeStyle = PAL.rgba(PAL.cream, 0.75); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < 9; i++) { const x = cx0 + 4 + U.hash(i, 183) * (f.w - 8), y = top + 6 + U.hash(i, 184) * (f.h - 40); ctx.moveTo(x, y); ctx.lineTo(x, y + 14 + U.hash(i, 185) * 22); }
      ctx.stroke(); ctx.lineCap = 'butt';
      S_.fillRRect(ctx, cx0 - 4, top - 5, f.w + 8, 8, 4, PAL.mix(PAL.waterHot, PAL.cream, 0.5));
      for (let i = 0; i < 5; i++) S_.ellipse(ctx, cx0 + 4 + i * (f.w - 8) / 4, py - 4 + (i & 1) * 3, 11, 5, PAL.cream);      // foam where it lands
      ctx.globalAlpha = 0.45; S_.circle(ctx, f.x - 22, py - 20, 12, PAL.cream); S_.circle(ctx, f.x + 18, py - 26, 15, PAL.cream); S_.circle(ctx, f.x - 4, py - 44, 11, PAL.cream); ctx.globalAlpha = 1;
      S_.ellipse(ctx, f.x - 36, py + 12, 10, 4, PAL.moss); S_.ellipse(ctx, f.x + 40, py + 10, 12, 4, PAL.moss);              // the thaw: moss and a flower
      S_.circle(ctx, f.x - 40, py + 9, 2.5, FLOWER); S_.circle(ctx, f.x + 44, py + 7, 2.5, PAL.cream);
    }
  }
  // before the Source is built it sleeps: a hollow of old ice dusted with snow, ringed by snowy stones, and a dormant cone with its vent iced shut
  function sleepingSpring(ctx) {
    const d = sourceDef(); if (!d) return;
    const S_ = A(), w = d.water, x0 = w.x - w.w / 2, y0 = w.y - w.h / 2;
    S_.fillRRect(ctx, x0 - 12, y0 - 8, w.w + 24, w.h + 22, 28, PAL.rgba(SHADE, 0.9));
    S_.fillRRect(ctx, x0, y0, w.w, w.h, 22, ICE_D); S_.fillRRect(ctx, x0 + 3, y0 + 2, w.w - 6, w.h - 9, 20, ICE);
    S_.ellipse(ctx, w.x - w.w * 0.22, w.y - w.h * 0.18, w.w * 0.2, 9, PAL.rgba('#FFFFFF', 0.55));
    ctx.strokeStyle = PAL.rgba('#FFFFFF', 0.8); ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(w.x - 50, w.y - 10); ctx.lineTo(w.x - 22, w.y + 4); ctx.lineTo(w.x + 6, w.y - 2); ctx.lineTo(w.x + 30, w.y + 16); ctx.moveTo(w.x - 22, w.y + 4); ctx.lineTo(w.x - 30, w.y + 26); ctx.moveTo(w.x + 6, w.y - 2); ctx.lineTo(w.x + 16, w.y - 26);
    ctx.stroke();
    S_.ellipse(ctx, w.x + w.w * 0.26, w.y + w.h * 0.22, 34, 11, SNOW); S_.ellipse(ctx, w.x - w.w * 0.3, w.y + w.h * 0.3, 22, 8, SNOW);   // snow drifted onto the ice
    for (let i = 0; i < 16; i++) {                                    // the ring of snow-capped stones
      const a = i / 16 * TAU, c = Math.cos(a), s = Math.sin(a), px = w.x + Math.sign(c) * Math.pow(Math.abs(c), 0.6) * (w.w / 2 + 4), py = w.y + Math.sign(s) * Math.pow(Math.abs(s), 0.6) * (w.h / 2 + 4), r = 8 + U.hash(i, 186) * 4;
      S_.ellipse(ctx, px + 3, py + 3, r * 1.3, r * 0.8, ROCK_D); S_.ellipse(ctx, px, py, r * 1.3, r * 0.8, PAL.stone); S_.ellipse(ctx, px - 2, py - r * 0.4, r * 0.9, r * 0.35, SNOW);
    }
  }
  function sleepingCone(ctx, x, y) {
    const S_ = A();
    S_.shadow(ctx, x + 5, y + 1, 34, 8, 0.18);
    moundPath(ctx, x, y); ctx.fillStyle = ROCK_D; ctx.fill(); litPath(ctx, x, y); ctx.fillStyle = ROCK; ctx.fill();
    S_.ellipse(ctx, x, y - 40, 15, 7, SNOW); S_.ellipse(ctx, x - 6, y - 28, 14, 6, SNOW); S_.ellipse(ctx, x + 12, y - 18, 10, 5, SNOW);   // a cap of old snow, the vent iced shut
    S_.ellipse(ctx, x, y - 41, 8, 3, ICE); S_.ellipse(ctx, x - 22, y - 3, 12, 5, SNOW); S_.ellipse(ctx, x + 24, y - 2, 11, 4.5, SNOW);
  }
  // the cone's mound: a rock dome with a vent on top (shared by the sleeping cone and the live one); the lit part is its top-left
  function moundPath(ctx, x, y) { ctx.beginPath(); ctx.moveTo(x - 31, y); ctx.quadraticCurveTo(x - 27, y - 30, x - 12, y - 42); ctx.lineTo(x + 12, y - 42); ctx.quadraticCurveTo(x + 27, y - 30, x + 31, y); ctx.closePath(); }
  function litPath(ctx, x, y) { ctx.beginPath(); ctx.moveTo(x - 31, y); ctx.quadraticCurveTo(x - 27, y - 30, x - 12, y - 42); ctx.lineTo(x + 3, y - 42); ctx.quadraticCurveTo(x - 3, y - 20, x + 2, y); ctx.closePath(); }

  // ---------- the Source: an ancient stone apron (static) and its water (per frame) ----------
  // flat stones laid in rows with snow tucked between, a ring of dark wet rock round the water, standing stones with a shimenawa at the back
  W.sourceBody = function (ctx, def) {
    const S_ = A(), d = def.deck, w = def.water, x0 = d.x - d.w / 2, y0 = d.y - d.h / 2, wx0 = w.x - w.w / 2, wy0 = w.y - w.h / 2;
    S_.shadow(ctx, d.x + 6, y0 + d.h + 8, d.w / 2 + 8, 13, 0.18);
    S_.plate(ctx, x0, y0, d.w, d.h, 30, MORTAR, ROCK_D, 10);
    ctx.save(); S_.rrect(ctx, x0, y0, d.w, d.h, 30); ctx.clip();
    for (let r = 0, y = y0 + 2; y < y0 + d.h; r++, y += 19) {
      for (let i = 0, x = x0 - 8 - (r & 1) * 13; x < x0 + d.w; i++) {
        const sw = 24 + U.hash(i + r * 13, 187) * 22, sh = 17 + U.hash(i + r * 7, 188) * 3;
        if (x + sw < wx0 + 6 || x > wx0 + w.w - 6 || y + sh < wy0 + 6 || y > wy0 + w.h - 10) {   // stones the water would hide are skipped
          S_.fillRRect(ctx, x + 1, y + 2, sw - 3, sh - 2, 6, ROCK);
          S_.fillRRect(ctx, x + 1, y, sw - 3, sh - 4, 6, (i + r) % 3 === 0 ? PAL.mix(PAL.stone, PAL.cream, 0.2) : (i + r) % 3 === 1 ? PAL.stone : PAL.mix(PAL.stone, ROCK, 0.3));
          S_.fillRRect(ctx, x + 4, y + 2, (sw - 3) * 0.45, 2, 1, PAL.rgba('#FFFFFF', 0.35));
        }
        x += sw;
      }
    }
    ctx.restore();
    S_.fillRRect(ctx, wx0 - 10, wy0 - 6, w.w + 20, w.h + 16, 30, WET_D); S_.fillRRect(ctx, wx0 - 10, wy0 - 9, w.w + 20, w.h + 16, 30, WET);   // the wet rock ring
    ctx.strokeStyle = PAL.rgba('#FFFFFF', 0.3); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(wx0 + 14, wy0 - 6); ctx.lineTo(wx0 + 44, wy0 - 7); ctx.moveTo(wx0 + 60, wy0 - 7); ctx.lineTo(wx0 + 72, wy0 - 7); ctx.moveTo(wx0 - 6, wy0 + 18); ctx.lineTo(wx0 - 7, wy0 + 40); ctx.stroke(); ctx.lineCap = 'butt';
    const bs = [[wx0 - 4, wy0 + w.h + 2, 12], [wx0 + w.w + 4, wy0 + 6, 11], [wx0 + w.w - 6, wy0 + w.h + 4, 9], [wx0 + 10, wy0 - 6, 8]];   // boulders on the ring
    for (let i = 0; i < bs.length; i++) { const b = bs[i]; S_.ellipse(ctx, b[0] + 2, b[1] + 3, b[2] * 1.2, b[2] * 0.8, WET_D); S_.ellipse(ctx, b[0], b[1], b[2] * 1.2, b[2] * 0.8, WET); S_.ellipse(ctx, b[0] - b[2] * 0.4, b[1] - b[2] * 0.35, b[2] * 0.4, b[2] * 0.2, PAL.rgba('#FFFFFF', 0.4)); }
    // two standing stones at the back corners with the sacred rope between them: this spring is older than the inn
    const sx0 = x0 + 16, sx1 = x0 + d.w - 16, sy = y0 + 8;
    for (let s = 0; s < 2; s++) { const sx = s ? sx1 : sx0; S_.shadow(ctx, sx + 4, sy + 2, 11, 4, 0.2); S_.fillRRect(ctx, sx - 7, sy - 26, 14, 28, 6, ROCK_D); S_.fillRRect(ctx, sx - 7, sy - 28, 11, 28, 5.5, PAL.stone); S_.fillRRect(ctx, sx - 7, sy - 31, 14, 7, 3.5, SNOW); }
    rope(ctx, sx0 + 4, sy - 20, sx1 - 4, sy - 20, 9, 4);
  };
  // a shimenawa: a thick straw rope sagging between two points, twists, and white zigzag shide hanging from it
  function rope(ctx, ax, ay, bx, by, sag, nShide) {
    const S_ = A(), mx = (ax + bx) / 2, my = (ay + by) / 2 + sag * 2;
    ctx.lineCap = 'round'; ctx.strokeStyle = STRAW_D; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ax, ay + 1); ctx.quadraticCurveTo(mx, my + 1, bx, by + 1); ctx.stroke();
    ctx.strokeStyle = PAL.straw; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.strokeStyle = STRAW_D; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 1; k < 12; k++) { const u = k / 12, x = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * mx + u * u * bx, y = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by; ctx.moveTo(x - 1.5, y - 2); ctx.lineTo(x + 1.5, y + 2); }
    ctx.stroke();
    ctx.fillStyle = SHIDE; ctx.beginPath();
    for (let k = 1; k <= nShide; k++) {
      const u = k / (nShide + 1), x = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * mx + u * u * bx, y = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by + 1;
      ctx.moveTo(x - 2.5, y); ctx.lineTo(x + 2.5, y); ctx.lineTo(x + 1, y + 4); ctx.lineTo(x + 3.5, y + 4); ctx.lineTo(x - 1, y + 11); ctx.lineTo(x, y + 6); ctx.lineTo(x - 2.5, y + 6); ctx.closePath();
    }
    ctx.fill();
  }
  // state: { yuzu, lowFx, burst 0..1, crack 0..1 (finale ice: 0 = none), awake }. Teal with a lighter heart and a deep rim; a burst brightens and rings it;
  // awake warms the heart gold; crack lays a fading ice sheet with growing white cracks. <= 14 fills / strokes, no gradients.
  W.sourceWater = function (ctx, def, st, t) {
    const S_ = A(), w = def.water, x0 = w.x - w.w / 2, y0 = w.y - w.h / 2, b = st.burst || 0, base = st.yuzu ? PAL.waterYuzu : PAL.waterHot;
    S_.fillRRect(ctx, x0, y0, w.w, w.h, 22, base);
    S_.strokeRRect(ctx, x0 + 2, y0 + 2, w.w - 4, w.h - 4, 20, st.yuzu ? PAL.amberDeep : PAL.waterHotDeep, 4);
    S_.ellipse(ctx, w.x - 4, w.y - 2, w.w * 0.36, w.h * 0.3, PAL.mix(base, b > 0 ? PAL.cream : PAL.ripple, 0.22 + 0.3 * b));   // the lighter heart, where the spring rises
    if (!st.lowFx) {
      ctx.globalAlpha = 0.2 + 0.15 * b; ctx.fillStyle = PAL.ripple; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const ex = w.x + Math.sin(t * 0.6 + i * 2.1) * (w.w * 0.24), ey = w.y - 16 + i * 15 + Math.cos(t * 0.45 + i) * 4; ctx.moveTo(ex + 26, ey); ctx.ellipse(ex, ey, 26, 6, 0, 0, TAU); }
      ctx.fill();
      ctx.globalAlpha = 0.35; ctx.strokeStyle = PAL.cream; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 18, y0 + w.h - 8); ctx.quadraticCurveTo(w.x, y0 + w.h - 12 + Math.sin(t * 2) * 2, x0 + w.w - 18, y0 + w.h - 8); ctx.stroke();
    }
    if (st.awake) { ctx.globalAlpha = 0.26 + 0.08 * Math.sin(t * 1.5); S_.ellipse(ctx, w.x - 4, w.y - 2, w.w * 0.2, w.h * 0.17, PAL.amber); }
    if (b > 0) {                                                       // the burst: two rings racing out from the heart, a white-hot glow
      for (let k = 0; k < 2; k++) { const u = (t * 1.4 + k * 0.5) % 1, r = 12 + u * w.w * 0.4; ctx.globalAlpha = 0.6 * b * (1 - u); ctx.strokeStyle = PAL.cream; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(w.x - 4, w.y - 2, r, r * 0.5, 0, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 0.5 * b; S_.ellipse(ctx, w.x - 4, w.y - 2, w.w * 0.16 + Math.sin(t * 9) * 2, w.h * 0.13, PAL.cream);
    }
    const c = st.crack || 0;
    if (c > 0 && c < 1) {
      ctx.globalAlpha = 0.85 * (1 - c); S_.fillRRect(ctx, x0 + 3, y0 + 3, w.w - 6, w.h - 6, 19, ICE_L);
      ctx.globalAlpha = Math.min(1, (1 - c) * 4); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      const rx = w.w * 0.46, ry = w.h * 0.42;
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU + 0.35 + U.hash(i, 189) * 0.5, len = Math.min(1, c * 1.6) * (0.6 + U.hash(i, 190) * 0.4), kx = (U.hash(i, 191) - 0.5) * 0.5;
        ctx.moveTo(w.x - 4, w.y - 2); ctx.lineTo(w.x - 4 + Math.cos(a + kx) * rx * len * 0.5, w.y - 2 + Math.sin(a + kx) * ry * len * 0.5); ctx.lineTo(w.x - 4 + Math.cos(a) * rx * len, w.y - 2 + Math.sin(a) * ry * len);
      }
      ctx.stroke(); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    }
    ctx.globalAlpha = 1;
  };

  // ---------- the Snow Roll: a snowbank (static) and the soft snow bed the monkeys sink into (per frame) ----------
  W.snowBody = function (ctx, def) {
    const S_ = A(), d = def.deck, x0 = d.x - d.w / 2, y0 = d.y - d.h / 2, x1 = x0 + d.w, y1 = y0 + d.h;
    S_.shadow(ctx, d.x + 5, y1 + 8, d.w / 2 + 6, 12, 0.16);
    S_.plate(ctx, x0, y0, d.w, d.h, 24, SNOW, SHADE, 10);
    for (let i = 0; i < 8; i++) S_.ellipse(ctx, x0 + 18 + i * (d.w - 36) / 7, y0 + 3 + U.hash(i, 192) * 3, 16 + U.hash(i, 193) * 6, 6, SNOW_HI);   // the soft lumpy crest
    for (let i = 0; i < 6; i++) S_.ellipse(ctx, x0 + 22 + i * (d.w - 44) / 5, y1 + 4 + U.hash(i, 194) * 3, 13, 5, PAL.mix(SHADE, SNOW, 0.35));   // lumps over the band
    S_.fillRRect(ctx, x0 + 10, y0 + 10, 5, d.h - 30, 2.5, PAL.rgba('#FFFFFF', 0.6));                                       // the lit left edge
    const balls = [[x1 - 30, y0 + 22, 9], [x1 - 15, y0 + 26, 7], [x1 - 23, y0 + 12, 6.5], [x0 + 22, y1 - 18, 8], [x0 + 38, y1 - 12, 5.5]];   // snowballs
    for (let i = 0; i < balls.length; i++) { const b = balls[i]; S_.circle(ctx, b[0] + 2, b[1] + 2, b[2], SHADE); S_.circle(ctx, b[0], b[1], b[2], SNOW_HI); S_.circle(ctx, b[0] - b[2] * 0.35, b[1] - b[2] * 0.35, b[2] * 0.35, '#FFFFFF'); }
    const px = x0 + 20, py = y0 + 18;                                                                                       // the wooden marker post with a snowflake sign
    S_.shadow(ctx, px + 4, py + 1, 8, 3, 0.2);
    S_.fillRRect(ctx, px - 2.5, py - 34, 5, 34, 2, PAL.cedarDark);
    S_.plate(ctx, px - 15, py - 48, 30, 17, 4, PAL.cedar, PAL.cedarDark, 3); A().icon(ctx, 'snow', px, py - 40, 13);
    S_.fillRRect(ctx, px - 15, py - 50, 30, 5, 2.5, SNOW);
  };
  // state: { yuzu, lowFx }. A hollow in the bank: its shadowed top-left wall, a cream-white bed, soft lumps, glints; yuzu sit half-buried. <= 12 fills.
  W.snowWater = function (ctx, def, st, t) {
    const S_ = A(), w = def.water, x0 = w.x - w.w / 2, y0 = w.y - w.h / 2;
    S_.fillRRect(ctx, x0, y0, w.w, w.h, 20, '#BCCBD7');
    S_.fillRRect(ctx, x0 + 4, y0 + 6, w.w - 6, w.h - 8, 18, '#F3F5F2');
    ctx.fillStyle = PAL.rgba(SHADE, 0.45); ctx.beginPath();          // the lumps' soft shadows, then the lumps
    for (let i = 0; i < 5; i++) { const lx = x0 + 22 + i * (w.w - 44) / 4 + 3, ly = y0 + w.h * (0.35 + 0.4 * (i & 1)) + 4; ctx.moveTo(lx + 16, ly); ctx.ellipse(lx, ly, 16, 6, 0, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const lx = x0 + 22 + i * (w.w - 44) / 4, ly = y0 + w.h * (0.35 + 0.4 * (i & 1)); ctx.moveTo(lx + 15, ly); ctx.ellipse(lx, ly, 15, 6, 0, 0, TAU); }
    ctx.fill();
    S_.strokeRRect(ctx, x0 + 1, y0 + 1, w.w - 2, w.h - 2, 19, PAL.rgba('#FFFFFF', 0.85), 2);
    if (st.yuzu) {
      const P = PAL; ctx.fillStyle = P.yuzu; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const yx = x0 + w.w * (0.25 + 0.25 * i), yy = y0 + w.h * (0.62 - 0.2 * (i & 1)); ctx.moveTo(yx + 7, yy); ctx.arc(yx, yy, 7, 0, TAU); }
      ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const yx = x0 + w.w * (0.25 + 0.25 * i), yy = y0 + w.h * (0.62 - 0.2 * (i & 1)) + 5; ctx.moveTo(yx + 11, yy); ctx.ellipse(yx, yy, 11, 4.5, 0, 0, TAU); }
      ctx.fill();
      ctx.fillStyle = P.yuzuLeaf; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const yx = x0 + w.w * (0.25 + 0.25 * i) + 3, yy = y0 + w.h * (0.62 - 0.2 * (i & 1)) - 7; ctx.moveTo(yx + 5, yy); ctx.ellipse(yx, yy, 5, 2.2, -0.4, 0, TAU); }
      ctx.fill();
    }
    if (!st.lowFx) {                                                   // glints: four tiny stars twinkling out of step
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.9); if (a < 0.15) continue;
        const gx = x0 + 18 + U.hash(i, 195) * (w.w - 36), gy = y0 + 14 + U.hash(i, 196) * (w.h - 28), s = 2 + 2 * a;
        ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(gx - s, gy); ctx.lineTo(gx + s, gy); ctx.moveTo(gx, gy - s); ctx.lineTo(gx, gy + s); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  };
  // the Snow Roll half-buries its yuzu (W.snowWater above), so the floating ones are not drawn there
  const floatingYuzu0 = W.floatingYuzu;
  W.floatingYuzu = function (ctx, def, t) { if (def && def.look === 'snow') return; floatingYuzu0(ctx, def, t); };

  // ---------- the geyser cone (sorted pass): a sacred rock mound, the countdown ring, a steam column while it bursts ----------
  W.geyserCone = function (ctx, x, y, frac, burst, t, low) {
    const S_ = A(), b = burst > 0 ? Math.min(1, burst) : 0, f = U.clamp(frac || 0, 0, 1), soon = b <= 0 && f > 0.85 ? (f - 0.85) / 0.15 : 0;
    const jx = soon > 0 ? (U.hash((t * 30) | 0, 7) - 0.5) * 2.4 * soon : 0;     // it trembles just before it goes
    S_.shadow(ctx, x + 5, y + 1, 36, 9, 0.2);
    S_.ellipse(ctx, x + 2, y + 2, 40, 11, PAL.rgba(SHADE, 0.8));             // the snow melted around it
    moundPath(ctx, x + jx, y); ctx.fillStyle = ROCK_D; ctx.fill(); litPath(ctx, x + jx, y); ctx.fillStyle = ROCK; ctx.fill();
    ctx.strokeStyle = PAL.rgba(PAL.cream, 0.45); ctx.lineWidth = 2; ctx.beginPath();                      // sinter terraces
    ctx.moveTo(x + jx - 20, y - 31); ctx.quadraticCurveTo(x + jx, y - 26, x + jx + 20, y - 31); ctx.moveTo(x + jx - 27, y - 9); ctx.quadraticCurveTo(x + jx, y - 3, x + jx + 27, y - 9); ctx.stroke();
    rope(ctx, x + jx - 25, y - 20, x + jx + 25, y - 20, 4, 3);
    const heat = Math.max(b, f * f * 0.6);
    S_.ellipse(ctx, x + jx, y - 42, 12, 4.8, PAL.mix(ROCK_L, PAL.amberDeep, heat));                         // the vent: a warming lip, the dark mouth, a glow inside
    S_.ellipse(ctx, x + jx, y - 42, 8.5, 3, HOLE);
    if (heat > 0.05) { ctx.globalAlpha = Math.min(1, heat * 1.2); S_.ellipse(ctx, x + jx, y - 41.5, 6, 2, b > 0 ? PAL.mix(PAL.amber, PAL.cream, 0.5 + 0.5 * Math.sin(t * 20)) : PAL.amberDeep); ctx.globalAlpha = 1; }
    S_.ring(ctx, x, y - 50, 22, f, 4, PAL.cta, PAL.rgba(PAL.cream, 0.55));
    ctx.fillStyle = PAL.cream;
    if (b > 0) {                                                        // the column: puffs rise and swell, wobbling; the top one fades as a new one leaves the vent
      const n = low ? 6 : 12;
      for (let i = 0; i < n; i++) {
        const u = (i + (t * 2.2) % 1) / n, r = 7 + u * 21, cy = y - 46 - u * 140, cx = x + Math.sin(t * 4 + u * 9) * (2 + u * 10);
        ctx.globalAlpha = b * (0.9 - 0.65 * u); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      }
    } else {                                                            // between bursts a thin wisp, thickening as the ring fills
      for (let i = 0; i < 3; i++) { const u = (t * 0.45 + i / 3) % 1; ctx.globalAlpha = (0.22 + 0.4 * f) * (1 - u); ctx.beginPath(); ctx.arc(x + Math.sin(t * 2 + i * 2) * 3, y - 46 - u * 34, 3 + u * 5 + f * 2, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  };

  // ---------- the snow-monkey guest (about 32 tall): Momo's build without the crown, a little smaller and greyer, ears and a tuft ----------
  function smallLids(ctx, x, y, lid, col) {                          // the capy's sleepy lids sized for a small eye; lid 3 = asleep (a soft arc, no eye)
    if (lid >= 3) { ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y - 1, 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); return; }
    Ch.eye(ctx, x, y, 1.7);
    if (lid > 0) A().line(ctx, x - 2.4, y + (lid === 2 ? -0.3 : -1.2), x + 2.4, y + (lid === 2 ? -0.3 : -1.2), col, 1.6);
  }
  Ch.monkey = function (ctx, p) {
    const S_ = A(), P = Ch.colors(), ink = P.cream === P.ink, FUR = ink ? P.ink : MONKEY, DARK = ink ? P.ink : MONKEY_D, FC = ink ? P.ink : FACE;
    Ch.begin(ctx, p, 15, 5);
    const lp = p.moving ? Math.sin(p.walk * TAU) * 2 : 0, down = p.dir === 'down', up = p.dir === 'up', fx = down ? 0 : 3.5;
    S_.fillRRect(ctx, -9, -7 - lp, 7, 7 + lp, 3, DARK); S_.fillRRect(ctx, 2, -7 + lp, 7, 7 - lp, 3, DARK);                                   // legs
    if (p.pose === 'wave') { ctx.save(); ctx.translate(down ? 8 : 5, -19); ctx.rotate(0.35 + Math.sin((p.t || 0) * 9) * 0.4); S_.fillRRect(ctx, -2.5, -14, 5, 15, 2.5, FUR); S_.circle(ctx, 0, -14, 2.8, FC); ctx.restore(); }   // a waving arm
    S_.circle(ctx, down ? -12 : -11, -23, 3.6, DARK); if (down) S_.circle(ctx, 12, -23, 3.6, DARK);                                         // ears peeping out
    ctx.beginPath(); ctx.moveTo(-6, -27); ctx.quadraticCurveTo(-2, -39, 5, -35); ctx.quadraticCurveTo(1, -34, 4, -28); ctx.closePath(); ctx.fillStyle = FUR; ctx.fill(); Ch.strokePath(ctx, DARK);   // the tuft
    S_.circle(ctx, -10, -13, 7.5, FUR); S_.circle(ctx, 10, -13, 7.5, FUR); S_.circle(ctx, 0, -9, 9, FUR);                                    // fluff
    ctx.beginPath(); ctx.arc(0, -19, 12.5, 0, TAU); ctx.fillStyle = FUR; ctx.fill(); Ch.strokePath(ctx, DARK);                                // the round body-head
    if (!up) {
      S_.ellipse(ctx, fx, -21, 7, 6, FC);
      smallLids(ctx, fx - 2.6, -23, p.lid || 0, ink ? P.ink : FACE_D); smallLids(ctx, fx + 2.6, -23, p.lid || 0, ink ? P.ink : FACE_D);
      S_.ellipse(ctx, fx + (down ? 0 : 1), -18.5, 2.1, 1, P.ink);
    }
    if (p.tint) { ctx.globalAlpha = p.alpha * p.tint.alpha; S_.circle(ctx, 0, -19, 13.5, p.tint.color); ctx.globalAlpha = p.alpha; }        // the shiver tint, on the body only
    if (p.hat) (Ch.hats[p.hat] || Ch.hats.yuzu)(ctx, fx * 0.5, -38);
    Ch.end(ctx);
  };

  // ---------- Grandma Yuzu (52 tall): Kit's build, paler fur, grey ear tips, a cream shawl with a red edge, a bun with a flower, a gentle stoop ----------
  // poses: null (stand, a slow sway), 'wave', 'ring' (pulling a bell rope; poseT 0..1 cycles), 'sit' (on a pool edge, feet dangling), 'sitwave' (seated, waving)
  const GC = { fur: '', dark: '', hair: '', cream: '', red: '', tip: '', flower: '', ink: '' }, STOOP = 0.13;
  function granCols(P) { const ink = P.cream === P.ink; GC.fur = ink ? P.ink : GRAN; GC.dark = ink ? P.ink : GRAN_D; GC.hair = ink ? P.ink : HAIR; GC.cream = P.cream; GC.red = P.red; GC.tip = P.stone; GC.flower = ink ? P.ink : FLOWER; GC.ink = P.ink; return GC; }
  function tail3(ctx, col, tip, x0, y0, cx, cy, x1, y1) {            // a fox tail: three fluffy strokes and a cream tip (Kit's recipe)
    ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = col;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy + i * 4, x1, y1 + i * 3); ctx.stroke(); }
    A().circle(ctx, x1 - 1, y1, 3.5, tip); ctx.lineCap = 'butt';
  }
  function arm(ctx, col, x, y, rot, len) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); A().fillRRect(ctx, -3, -len, 6, len + 2, 3, col); ctx.restore(); }   // pointing up at rot 0
  function sitLegs(ctx, col, t) {                                     // legs over a pool edge: thighs along it, shins dangling and swinging slowly
    const S_ = A();
    for (let i = 0; i < 2; i++) {
      const ox = i ? 0 : -4, oy = i ? 0 : -1, sw = Math.sin(t * 2.4 + i * 2.2) * 0.22;
      S_.fillRRect(ctx, ox, oy - 8, 14, 7, 3.5, col);
      ctx.save(); ctx.translate(ox + 11, oy - 4.5); ctx.rotate(sw); S_.fillRRect(ctx, -3.5, -2, 7, 13, 3.5, col); ctx.restore();
    }
  }
  function granUpper(ctx, p, c, dy) {                                 // body, shawl, head, ears, bun, face
    const S_ = A(), down = p.dir === 'down', up = p.dir === 'up';
    S_.rrect(ctx, -11, -30 + dy, 22, 22, 8); ctx.fillStyle = c.fur; ctx.fill(); Ch.strokePath(ctx, c.dark);
    S_.ellipse(ctx, 1, -14 + dy, 6.5, 5, c.cream);
    ctx.beginPath(); ctx.moveTo(-13, -31 + dy); ctx.lineTo(13, -31 + dy); ctx.lineTo(13, -24 + dy); ctx.quadraticCurveTo(2, -18 + dy, -5, -21 + dy); ctx.lineTo(-11, -14 + dy); ctx.lineTo(-14, -25 + dy); ctx.closePath();
    ctx.fillStyle = c.cream; ctx.fill();
    ctx.beginPath(); ctx.moveTo(13, -24 + dy); ctx.quadraticCurveTo(2, -18 + dy, -5, -21 + dy); ctx.lineTo(-11, -14 + dy); ctx.strokeStyle = c.red; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke(); ctx.lineJoin = 'miter';
    if (!up) S_.circle(ctx, down ? 0 : 9, -25 + dy, 2.2, c.red);
    ctx.beginPath(); ctx.arc(0, -40 + dy, 12, 0, TAU); ctx.fillStyle = c.fur; ctx.fill(); Ch.strokePath(ctx, c.dark);
    S_.tri(ctx, -13, -48 + dy, -4.5, -49.5 + dy, -9.5, -59 + dy, c.fur); S_.tri(ctx, 4.5, -49.5 + dy, 13, -48 + dy, 9.5, -59 + dy, c.fur);
    S_.tri(ctx, -11.4, -55 + dy, -7.9, -55.6 + dy, -9.5, -59 + dy, c.tip); S_.tri(ctx, 7.9, -55.6 + dy, 11.4, -55 + dy, 9.5, -59 + dy, c.tip);
    const bx = down ? 0 : -4;
    ctx.beginPath(); ctx.arc(bx, -53 + dy, 5, 0, TAU); ctx.fillStyle = c.hair; ctx.fill(); Ch.strokePath(ctx, c.dark);
    S_.circle(ctx, bx + 3, -56 + dy, 2.4, c.flower); if (c.flower !== c.ink) S_.circle(ctx, bx + 3, -56 + dy, 0.9, c.cream);
    if (up) return;
    const mx = down ? 0 : 5;
    S_.ellipse(ctx, mx, -36 + dy, 5, 4, c.cream); S_.circle(ctx, mx + (down ? 0 : 2), -37 + dy, 1.8, c.dark);
    ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();          // smiling eyes, gently shut
    const e1 = down ? -5 : 1, e2 = down ? 5 : 7;
    ctx.moveTo(e1 - 2.4, -40 + dy); ctx.quadraticCurveTo(e1, -43 + dy, e1 + 2.4, -40 + dy); ctx.moveTo(e2 - 2.4, -40 + dy); ctx.quadraticCurveTo(e2, -43 + dy, e2 + 2.4, -40 + dy);
    ctx.stroke();
    ctx.strokeStyle = c.dark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx - 1.5, -33.2 + dy); ctx.quadraticCurveTo(mx + 0.5, -31.5 + dy, mx + 2.5, -33.2 + dy); ctx.stroke(); ctx.lineCap = 'butt';
    if (down) { Ch.blush(ctx, -9, -36 + dy, 2.5); Ch.blush(ctx, 9, -36 + dy, 2.5); } else Ch.blush(ctx, 9, -35 + dy, 2.5);
  }
  Ch.grandma = function (ctx, p) {
    if (p.pose === 'sit' || p.pose === 'sitwave') return grandmaSit(ctx, p);
    const S_ = A(), c = granCols(Ch.colors()), t = p.t || 0, moving = p.moving, pt = p.poseT || 0;
    Ch.begin(ctx, p, 16, 6);
    if (!moving) ctx.rotate(Math.sin(t * 1.6) * 0.03);
    tail3(ctx, c.fur, c.cream, -8, -12, -17, -6, -22, -8 + (moving ? Math.sin(t * 8) * 1.5 : Math.sin(t * 1.4) * 1.2));     // low and slow
    const lp = moving ? Math.sin(p.walk * TAU) * 2 : 0;                                                                   // a shorter stride than Kit's
    S_.fillRRect(ctx, -7, -10 - Math.max(0, lp), 8, 10 + Math.max(0, lp), 3, c.dark); S_.fillRRect(ctx, 3, -10 - Math.max(0, -lp), 8, 10 + Math.max(0, -lp), 3, c.dark);
    const pull = p.pose === 'ring' ? Math.max(0, Math.sin(pt * TAU)) * 4 : 0;
    ctx.save(); ctx.translate(0, -10); ctx.rotate(STOOP); ctx.translate(0, 10);
    if (p.pose === 'wave') arm(ctx, c.fur, 9, -28, 0.55 + Math.sin(pt * TAU * 2) * 0.35, 14);
    else if (p.pose === 'ring') arm(ctx, c.fur, 6, -28, -STOOP, 14 - pull);
    granUpper(ctx, p, c, 0);
    ctx.restore();
    if (p.pose === 'ring') {                                                                                              // the bell rope, hanging straight from above into her hand
      const hx = 6 * Math.cos(STOOP) + 32 * Math.sin(STOOP) + 0.5, hy = -10 - 32 * Math.cos(STOOP) + 6 * Math.sin(STOOP) + pull;
      A().line(ctx, hx, hy + 2, hx, hy - 52, c.red, 3); for (let k = 0; k < 4; k++) S_.fillRRect(ctx, hx - 1.5, hy - 8 - k * 11, 3, 3, 1, c.cream);
      S_.circle(ctx, hx, hy, 3.4, c.fur);
    }
    Ch.end(ctx);
  };
  function grandmaSit(ctx, p) {
    const S_ = A(), c = granCols(Ch.colors()), t = p.t || 0;
    Ch.begin(ctx, p, 15, 5);
    tail3(ctx, c.fur, c.cream, -6, -5, -20, -1, -19, -13 + Math.sin(t * 1.4));                                             // curled up behind her on the edge
    sitLegs(ctx, c.dark, t);
    ctx.save(); ctx.translate(0, -4); ctx.rotate(STOOP * 0.6); ctx.translate(0, 4);
    if (p.pose === 'sitwave') arm(ctx, c.fur, 9, -22, 0.55 + Math.sin((p.poseT || 0) * TAU * 2) * 0.35, 14);
    granUpper(ctx, p, c, 6);
    if (p.pose !== 'sitwave') S_.ellipse(ctx, 9, -10, 4, 3, c.fur);                                                         // paws in her lap
    ctx.restore();
    Ch.end(ctx);
  }

  // ---------- Kit sitting on a pool edge (pose 'sit'): legs over the edge, tail curled beside him; everything else is Ch.kit ----------
  function kitSit(ctx, p, S) {
    const S_ = A(), P = Ch.colors(), t = p.t || 0, dy = 6;
    const gold = p.gold || (S && S.lanterns && G.Seasons.finaleLit(S)) || G.Seasons.stars() >= 1;
    Ch.begin(ctx, p, 15, 5);
    tail3(ctx, P.fox, P.cream, -7, -5, -22, -2, -20, -15 + Math.sin(t * 2) * 1.2);
    sitLegs(ctx, P.foxDark, t);
    S_.rrect(ctx, -11, -30 + dy, 22, 22, 8); ctx.fillStyle = P.fox; ctx.fill(); Ch.strokePath(ctx, P.foxDark);
    S_.ellipse(ctx, 0, -18 + dy, 7, 6, P.cream); S_.ellipse(ctx, 9, -9, 4, 3, P.fox);
    const up = p.dir === 'up', down = p.dir === 'down';
    ctx.beginPath(); ctx.arc(0, -40 + dy, 12, 0, TAU); ctx.fillStyle = P.fox; ctx.fill(); Ch.strokePath(ctx, P.foxDark);
    S_.tri(ctx, -13.5, -49 + dy, -4.5, -49 + dy, -9, -61 + dy, P.fox); S_.tri(ctx, 4.5, -49 + dy, 13.5, -49 + dy, 9, -61 + dy, P.fox);
    S_.tri(ctx, -10.5, -57 + dy, -7.5, -57 + dy, -9, -61 + dy, P.foxDark); S_.tri(ctx, 7.5, -57 + dy, 10.5, -57 + dy, 9, -61 + dy, P.foxDark);
    S_.fillRRect(ctx, -12, -45 + dy, 24, 6, 2, gold ? P.coin : P.cream); S_.circle(ctx, down ? 0 : 4, -42 + dy, 4, gold ? P.coinRim : P.red);
    if (!up) {
      const mx = down ? 0 : 5;
      S_.ellipse(ctx, mx, -36 + dy, 5, 4, P.cream); S_.circle(ctx, mx + (down ? 0 : 2), -37 + dy, 2, P.foxDark);
      if (down) { Ch.eye(ctx, -5, -41 + dy, 3); Ch.eye(ctx, 5, -41 + dy, 3); Ch.blush(ctx, -9, -36 + dy, 2.5); Ch.blush(ctx, 9, -36 + dy, 2.5); }
      else { Ch.eye(ctx, 1, -41 + dy, 3); Ch.eye(ctx, 7, -41 + dy, 3); Ch.blush(ctx, 9, -35 + dy, 2.5); }
    }
    Ch.end(ctx);
  }
  const kit0 = Ch.kit;
  Ch.kit = function (ctx, p, S) { if (p.pose === 'sit') return kitSit(ctx, p, S); return kit0(ctx, p, S); };

  // ---------- Madame Tsuru flying (pose 'fly'): wings beating at 10 Hz, neck forward, legs trailing; on the ground she is Ch.tsuru ----------
  function tsuruWing(ctx, P, x, y, rot, far) {                        // a wing pointing up from the shoulder at rot 0, black flight feathers at the tip
    const S_ = A(); ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    S_.ellipse(ctx, 0, -14, 7, 16, far && P.cream !== P.ink ? PAL.mix(P.cream, P.stone, 0.4) : P.cream); S_.ellipse(ctx, 0, -26, 5, 6, P.ink);
    ctx.restore();
  }
  function tsuruFly(ctx, p) {
    const S_ = A(), P = Ch.colors(), t = p.t || 0, flap = Math.sin(t * 10);
    Ch.begin(ctx, p, 14, 5);
    ctx.translate(0, -44 - flap * 2);
    tsuruWing(ctx, P, -2, -5, -1.6 + flap * 0.95, true);
    A().line(ctx, -10, 2, -34, 5, P.ink, 2.5); A().line(ctx, -10, 4, -33, 9, P.ink, 2.5);
    S_.ellipse(ctx, -17, 1, 8, 4.5, P.ink);
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 9, -0.06, 0, TAU); ctx.fillStyle = P.cream; ctx.fill(); Ch.strokePath(ctx, P.stoneDark);
    ctx.lineCap = 'round'; A().line(ctx, 13, -3, 31, -8, P.cream, 5); ctx.lineCap = 'butt';
    S_.circle(ctx, 34, -9, 6, P.cream); S_.circle(ctx, 33.5, -13.6, 2.3, P.red);
    S_.tri(ctx, 39, -10.5, 39, -7.5, 49, -8.5, P.ink); Ch.eye(ctx, 35.5, -10, 1.5);
    tsuruWing(ctx, P, 2, -5, -1.35 + flap * 1.05, false);
    Ch.end(ctx);
  }
  const tsuru0 = Ch.tsuru;
  Ch.tsuru = function (ctx, p) { if (p.pose === 'fly') return tsuruFly(ctx, p); return tsuru0(ctx, p); };

  // ---------- icons: the Summit's names, in S.icon's 24-px box; every other name goes to the original ('plunge' already lives there) ----------
  const icon0 = Art.S.icon;
  Art.S.icon = function (ctx, name, x, y, size) {
    if (name !== 'monkey' && name !== 'capy' && name !== 'source') return icon0(ctx, name, x, y, size);
    const S_ = Art.S, s = size / 24;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (name === 'monkey') {                                           // a round grey-cream head, ears, a pink face
      S_.circle(ctx, -10, 0, 3.6, MONKEY_D); S_.circle(ctx, 10, 0, 3.6, MONKEY_D);
      ctx.beginPath(); ctx.arc(0, 1, 9.5, 0, TAU); ctx.fillStyle = MONKEY; ctx.fill(); ctx.strokeStyle = MONKEY_D; ctx.lineWidth = 1.6; ctx.stroke();
      S_.tri(ctx, -3, -7.5, 3, -7.5, 1, -11.5, MONKEY);
      S_.ellipse(ctx, 0, 3, 6.5, 5.5, FACE); S_.circle(ctx, -2.5, 1.5, 1.5, PAL.ink); S_.circle(ctx, 2.5, 1.5, 1.5, PAL.ink); S_.ellipse(ctx, 0, 5.5, 1.8, 0.9, PAL.ink);
    } else if (name === 'capy') {                                      // a capybara head in profile: brown loaf, ear, eye, snout
      S_.fillRRect(ctx, -11, -5, 22, 15, 7, PAL.capyDark); S_.fillRRect(ctx, -11, -7, 22, 15, 7, PAL.capy);
      S_.fillRRect(ctx, 3, -3, 9, 10, 4, PAL.capySnout); S_.circle(ctx, -5, -7.5, 3.2, PAL.capyDark); S_.circle(ctx, 1, -2, 1.8, PAL.ink); S_.circle(ctx, 10, -1, 1, PAL.ink);
    } else {                                                           // the Source: a teal pool in a stone ring, its geyser jet and plume
      S_.ellipse(ctx, 0, 6.5, 11.5, 5.5, PAL.stoneDark); S_.ellipse(ctx, 0, 5.5, 11.5, 5, PAL.stone); S_.ellipse(ctx, 0, 5.5, 8.5, 3.4, PAL.waterHot);
      S_.fillRRect(ctx, -2, -4, 4, 10, 2, PAL.ripple);
      S_.circle(ctx, -4, -6, 3.6, PAL.ripple); S_.circle(ctx, 3.5, -8, 4.2, PAL.ripple); S_.circle(ctx, -0.5, -11, 4, PAL.ripple);
      S_.circle(ctx, -1.5, -11.5, 1.5, '#FFFFFF'); S_.circle(ctx, 2.5, -8.5, 1.2, '#FFFFFF');
    }
    ctx.restore();
  };
})(window.G);
