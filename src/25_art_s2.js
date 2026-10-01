// Capy Springs - Season 2 art: THE MOCHI TERRACE (GDD 17.2). Active only when the Terrace is the current season; replaces the Deck's world
// drawers in G.Art.W with the same signatures and adds the Terrace cast (squirrel, Momo, persimmon hat, Tsuru behind the counter).
// Palette direction: slate ground, maple red, persimmon orange, straw gold, mochi cream, dusk plum. No pine green, no teal, no cedar.
(function (G) {
  'use strict';
  if (!G.SEASON || G.SEASON.id !== 2) return;
  const PAL = G.PAL, U = G.U, C = G.C, DATA = G.DATA, MAP = DATA.MAP;
  const Art = G.Art, W = Art.W, Ch = Art.Ch;
  const A = () => Art.S;
  const TAU = Math.PI * 2;
  const SLATE = '#7C8089', SLATE_D = '#656973', SLATE_L = '#9A9EA6', MAPLE = '#C2382F', MAPLE_D = '#8E2620', PERSIMMON = '#F28C28', PERSIMMON_D = '#C2671A',
        STRAW = '#D9B36A', STRAW_D = '#A8853F', BEAN = '#8C3B3B', BEAN_D = '#6A2C2C', MOON = '#FFF3D6', MONKEY = '#D8D3CB', MONKEY_D = '#9A948B', FACE = '#E36B6B';

  // ---------- static layer ----------
  W.terrain = function (ctx, y0, y1) {
    const S_ = A();
    ctx.fillStyle = SLATE; ctx.fillRect(0, y0, MAP.W, y1 - y0);
    for (let i = 0; i < 30; i++) {                                  // flagstones
      const x = U.hash(i, 21) * 540, y = y0 + U.hash(i, 22) * (y1 - y0), rx = 30 + U.hash(i, 23) * 50, ry = 10 + U.hash(i, 24) * 16;
      S_.ellipse(ctx, x, y, rx, ry, (i & 1) ? SLATE_D : SLATE_L);
    }
    for (let i = 0; i < 18; i++) {                                  // lichen and fallen leaves
      const x = U.hash(i, 25) * 540, y = y0 + U.hash(i, 26) * (y1 - y0);
      if (i & 1) S_.ellipse(ctx, x, y, 8 + U.hash(i, 27) * 10, 4, PAL.rgba(PAL.moss, 0.55));
      else { ctx.save(); ctx.translate(x, y); ctx.rotate(U.hash(i, 28) * TAU); S_.ellipse(ctx, 0, 0, 7, 3.5, (i & 2) ? MAPLE : PERSIMMON); ctx.restore(); }
    }
  };
  W.valley = function (ctx) {                                       // the Deck's roofs and pine tips under a cream mist, far below the rail
    const S_ = A(), v = MAP.VALLEY;
    ctx.fillStyle = SLATE_D; ctx.fillRect(0, v.y0, MAP.W, v.y1 - v.y0);
    ctx.fillStyle = '#4F535C'; ctx.fillRect(0, v.y0, MAP.W, 12);
    for (let row = 0; row < 3; row++) {
      const y = 2236 + row * 48, off = (row & 1) ? 24 : 0;
      for (let x = -20 + off; x < 580; x += 48) { S_.circle(ctx, x, y, 16, row === 0 ? MAPLE_D : PAL.mix(MAPLE_D, PAL.cream, 0.15 * row)); S_.fillRRect(ctx, x - 3, y + 10, 6, 14, 2, '#4F535C'); }
    }
    const g = ctx.createLinearGradient(0, v.y0, 0, v.y1); g.addColorStop(0, PAL.rgba(PAL.mist, 0)); g.addColorStop(1, PAL.rgba(PAL.mist, 0.92));
    ctx.fillStyle = g; ctx.fillRect(0, v.y0, MAP.W, v.y1 - v.y0);
  };
  W.lane = function (ctx) {
    const S_ = A(), L = MAP.LANE;
    ctx.globalAlpha = 0.7; ctx.fillStyle = SLATE_L; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0); ctx.globalAlpha = 1;
    for (let y = L.y0 + 20; y < L.y1; y += 40) S_.fillRRect(ctx, L.cx - 16 + (U.hash(y, 9) - 0.5) * 10, y - 6, 32, 12, 5, PAL.mix(SLATE_L, PAL.cream, 0.4));
  };
  W.rocks = function (ctx) { const S_ = A(); for (let i = 0; i < MAP.ROCKS.length; i++) { const r = MAP.ROCKS[i]; S_.ellipse(ctx, r[0] + 6, r[1] + 2, 16, 9, SLATE_D); S_.ellipse(ctx, r[0], r[1] - 4, 18, 11, SLATE_L); S_.ellipse(ctx, r[0] - 6, r[1] - 9, 8, 4, PAL.mix(SLATE_L, PAL.cream, 0.4)); } };
  W.pine = function (ctx, x, y) {                                   // a red maple: trunk + three round canopies
    const S_ = A();
    S_.shadow(ctx, x, y, 20, 6);
    S_.fillRRect(ctx, x - 4, y - 24, 8, 24, 3, STRAW_D);
    S_.circle(ctx, x - 15, y - 34, 16, MAPLE_D); S_.circle(ctx, x + 15, y - 34, 16, MAPLE_D); S_.circle(ctx, x, y - 48, 19, MAPLE_D);
    S_.circle(ctx, x - 13, y - 36, 12, MAPLE); S_.circle(ctx, x + 13, y - 36, 12, MAPLE); S_.circle(ctx, x, y - 50, 15, MAPLE);
    S_.circle(ctx, x - 5, y - 56, 6, PERSIMMON);
  };
  W.pines = function (ctx) { for (let i = 0; i < MAP.PINES.length; i++) W.pine(ctx, MAP.PINES[i][0], MAP.PINES[i][1]); };
  W.stoneLantern = function (ctx, x, y, lit) {                      // a paper lantern on a pole
    const S_ = A();
    S_.fillRRect(ctx, x - 2, y - 30, 4, 30, 1, STRAW_D);
    S_.fillRRect(ctx, x - 9, y - 46, 18, 20, 7, lit ? PAL.amber : PERSIMMON);
    S_.fillRRect(ctx, x - 9, y - 38, 18, 2, 1, PERSIMMON_D); S_.fillRRect(ctx, x - 9, y - 32, 18, 2, 1, PERSIMMON_D);
    S_.fillRRect(ctx, x - 5, y - 49, 10, 4, 1, PAL.ink); S_.fillRRect(ctx, x - 5, y - 27, 10, 3, 1, PAL.ink);
  };
  W.stoneLanterns = function (ctx, lit) { for (let i = 0; i < MAP.STONE_LANTERNS.length; i++) W.stoneLantern(ctx, MAP.STONE_LANTERNS[i][0], MAP.STONE_LANTERNS[i][1], lit); };
  W.platform = function (ctx) {                                     // straw-plank platform with a roof-less station post
    const S_ = A(), p = MAP.PLATFORM, x0 = p.x - p.w / 2, y0 = p.y - p.h / 2;
    S_.plate(ctx, x0, y0, p.w, p.h, 10, STRAW, STRAW_D, 10);
    ctx.strokeStyle = STRAW_D; ctx.lineWidth = 1; ctx.beginPath(); for (let x = x0 + 24; x < x0 + p.w - 8; x += 24) { ctx.moveTo(x, y0 + 6); ctx.lineTo(x, y0 + p.h - 6); } ctx.stroke();
    for (let i = 0; i < 5; i++) { const x = x0 + 20 + i * (p.w - 40) / 4; S_.fillRRect(ctx, x - 3, y0 - 14, 6, 16, 2, STRAW_D); }
    A().line(ctx, x0 + 18, y0 - 9, x0 + p.w - 18, y0 - 9, MAPLE, 4);
  };
  W.cable = function (ctx) {                                        // the rack rail: two rails, ties, a toothed centre rack
    const S_ = A(), c = MAP.CABLE;
    for (let x = -10; x < MAP.W + 10; x += 18) S_.fillRRect(ctx, x, c.y - 2, 10, 14, 2, STRAW_D);
    A().line(ctx, 0, c.y, MAP.W, c.y, PAL.cable, 3); A().line(ctx, 0, c.y + 10, MAP.W, c.y + 10, PAL.cable, 3);
    for (let x = 0; x < MAP.W; x += 6) ctx.fillStyle = PAL.stoneDark, ctx.fillRect(x, c.y + 3, 3, 4);
    for (let i = 0; i < c.pylons.length; i++) { const x = c.pylons[i]; S_.fillRRect(ctx, x - 4, c.pylonTop + 20, 8, c.y - c.pylonTop - 18, 2, STRAW_D); S_.fillRRect(ctx, x - 12, c.pylonTop + 14, 24, 8, 3, MAPLE); }
  };
  W.bridge = function (ctx) {                                       // the stone stair into cloud toward the Summit
    const S_ = A(), b = MAP.BRIDGE;
    for (let i = 0, y = b.y1 - 4; y > b.y0; y -= 14, i++) { const w = b.w + 16 - i * 1.5; S_.fillRRect(ctx, b.x - w / 2, y - 11, w, 11, 3, (i & 1) ? SLATE_L : PAL.mix(SLATE_L, PAL.cream, 0.25)); }
  };
  W.sign = function (ctx, x, y) { const S_ = A(); S_.fillRRect(ctx, x - 3, y - 30, 6, 30, 2, STRAW_D); S_.plate(ctx, x - 44, y - 52, 88, 26, 5, STRAW, STRAW_D, 4); S_.text(ctx, G.Seasons.text('sign', 'SUMMIT'), x, y - 39, 13, MAPLE_D); };
  // Harvest Moon: a big cream moon over the Summit stair and maple leaves drifting down (presentation only, hash-driven)
  W.nightExtra = function (ctx, camY, H, fade, t, low) {
    const S_ = A();
    const my = 1240; if (my > camY - 80 && my < camY + H + 80) { ctx.globalAlpha = 0.9 * fade; S_.circle(ctx, 440, my, 46, MOON); S_.circle(ctx, 426, my - 10, 8, PAL.rgba(STRAW, 0.5)); S_.circle(ctx, 452, my + 12, 5, PAL.rgba(STRAW, 0.5)); ctx.globalAlpha = 1; }
    const n = low ? 8 : 16; ctx.globalAlpha = 0.85 * fade;
    for (let i = 0; i < n; i++) {
      const sp = 18 + U.hash(i, 31) * 14, x = ((U.hash(i, 32) * 540) + Math.sin(t * 0.8 + i) * 30 + 540) % 540, y = camY + (((U.hash(i, 33) * H) + t * sp) % (H + 40)) - 20;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); S_.ellipse(ctx, 0, 0, 7, 3.5, (i & 1) ? MAPLE : PERSIMMON); ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  // ---------- stations (service) ----------
  W.deckPlate = function (ctx, def) {
    const S_ = A(), d = def.deck, x0 = d.x - d.w / 2, y0 = d.y - d.h / 2;
    if (def.look === 'bench') {                                     // straw-plank mat with a low back rail
      S_.plate(ctx, x0, y0, d.w, d.h, 14, STRAW, STRAW_D, 10);
      ctx.strokeStyle = STRAW_D; ctx.lineWidth = 1; ctx.beginPath(); for (let y = y0 + 18; y < y0 + d.h - 4; y += 18) { ctx.moveTo(x0 + 8, y); ctx.lineTo(x0 + d.w - 8, y); } ctx.stroke();
      S_.fillRRect(ctx, x0 + 14, y0 + 6, d.w - 28, 8, 4, STRAW_D);
    } else if (def.look === 'table') {                              // slate plate with a lighter table top
      S_.plate(ctx, x0, y0, d.w, d.h, 14, SLATE_L, SLATE_D, 10);
      S_.fillRRect(ctx, x0 + 10, y0 + 10, d.w - 20, d.h - 30, 10, PAL.mix(SLATE_L, PAL.cream, 0.2));
    } else {                                                        // sunken hearth: dark plate ringed with stones
      S_.plate(ctx, x0, y0, d.w, d.h, 18, SLATE_D, '#4F535C', 10);
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rx = d.w / 2 - 14, ry = d.h / 2 - 14; S_.ellipse(ctx, d.x + Math.cos(a) * rx, d.y + Math.sin(a) * ry, 11, 7, (i & 1) ? SLATE_L : PAL.mix(SLATE_L, PAL.cream, 0.3)); }
    }
  };
  // state: { cold (stock empty), yuzu (persimmon topping), lowFx }
  W.water = function (ctx, def, state, t) {
    const S_ = A(), w = def.water, x0 = w.x - w.w / 2, y0 = w.y - w.h / 2;
    if (def.look === 'bench') {
      S_.fillRRect(ctx, x0, y0, w.w, w.h, 16, STRAW_D);
      for (let i = 0; i < 3; i++) S_.fillRRect(ctx, x0 + 10 + i * (w.w - 20) / 3, y0 + w.h - 30, (w.w - 20) / 3 - 8, 22, 8, state.yuzu ? PERSIMMON : (i & 1) ? MAPLE : PAL.cream);   // cushions
      if (state.yuzu) S_.strokeRRect(ctx, x0 + 2, y0 + 2, w.w - 4, w.h - 4, 14, PAL.amberDeep, 3);
      return;
    }
    const fill = def.look === 'hearth' ? (state.cold ? SLATE_D : state.yuzu ? PERSIMMON_D : BEAN) : (state.cold ? SLATE_D : PAL.mix(SLATE_L, PAL.cream, 0.1));
    S_.strokeRRect(ctx, x0, y0, w.w, w.h, 18, def.look === 'hearth' ? '#4F535C' : SLATE_D, 6);
    S_.fillRRect(ctx, x0, y0, w.w, w.h, 18, fill);
    if (state.cold) { S_.strokeRRect(ctx, x0 + 1, y0 + 1, w.w - 2, w.h - 2, 17, PAL.cream, 2, true); return; }   // empty plates: dashed rim, the '?' bubbles say the rest
    if (def.look === 'hearth') {
      S_.strokeRRect(ctx, x0 + 2, y0 + 2, w.w - 4, w.h - 4, 16, state.yuzu ? PAL.amberDeep : BEAN_D, 3);
      if (!state.lowFx) { ctx.globalAlpha = 0.35; for (let i = 0; i < 4; i++) S_.circle(ctx, w.x + Math.sin(t * 0.9 + i * 1.7) * (w.w * 0.3), w.y + 4 + Math.cos(t * 0.6 + i) * 8, 7, PAL.cream); ctx.globalAlpha = 1; }   // mochi bobbing in the soup
    } else {
      for (let i = 0; i < 4; i++) { const px = x0 + 20 + i * (w.w - 40) / 3, py = y0 + w.h - 16; S_.circle(ctx, px, py, 9, PAL.cream); S_.circle(ctx, px, py - 1, 3, state.yuzu ? PERSIMMON : BEAN); }   // plates of mochi
      if (state.yuzu) S_.strokeRRect(ctx, x0 + 2, y0 + 2, w.w - 4, w.h - 4, 16, PAL.amberDeep, 3);
    }
  };
  W.floatingYuzu = function (ctx, def, t) {                         // persimmon slices on the topping
    const S_ = A(), w = def.water;
    for (let i = 0; i < 3; i++) { const x = w.x + (i - 1) * w.w * 0.3 + Math.sin(t * 1.3 + i) * 4, y = w.y + w.h * 0.25 + Math.cos(t * 1.1 + i * 2) * 2; S_.circle(ctx, x, y, 7, PERSIMMON); S_.circle(ctx, x, y, 4, PAL.mix(PERSIMMON, PAL.cream, 0.5)); }
  };

  // ---------- the mortar, the sacks, the tree, the counter ----------
  W.boilerBody = function (ctx, x, y) {                             // wooden mortar on a stone base, mallet leaning on it
    const S_ = A();
    S_.shadow(ctx, x, y, 30, 8);
    S_.ellipse(ctx, x, y - 2, 30, 9, SLATE_D);
    S_.fillRRect(ctx, x - 22, y - 46, 44, 44, 10, STRAW_D); S_.fillRRect(ctx, x - 24, y - 50, 48, 10, 5, PAL.mix(STRAW_D, PAL.cream, 0.2));
    S_.fillRRect(ctx, x - 18, y - 30, 36, 4, 2, PAL.mix(STRAW_D, PAL.ink, 0.3));
    ctx.save(); ctx.translate(x + 24, y - 40); ctx.rotate(0.5); S_.fillRRect(ctx, -3, -4, 6, 40, 3, STRAW_D); S_.fillRRect(ctx, -10, -14, 20, 14, 5, PAL.mix(STRAW_D, PAL.ink, 0.25)); ctx.restore();
  };
  W.boilerGlow = function (ctx, x, y, frac, rush, t) {              // the mound of mochi rising in the mortar; steam while a batch is fresh
    const S_ = A(), f = U.clamp(frac, 0, 1);
    if (f > 0.03) { const r = 6 + 14 * f, wob = rush ? 1 + 0.06 * Math.sin(t * 20) : 1; S_.ellipse(ctx, x, y - 48 - 6 * f, r * wob, (4 + 6 * f) * wob, PAL.cream); S_.ellipse(ctx, x - r * 0.3, y - 50 - 6 * f, r * 0.3, 2 + 2 * f, MOON); }
  };
  W.woodpile = function (ctx, x, y) {                               // a pile of rice sacks, 3-2-1
    const S_ = A();
    S_.shadow(ctx, x, y, 36, 8);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) {
      const sx = x - 26 + r * 13 + i * 26, sy = y - 6 - r * 13;
      S_.fillRRect(ctx, sx - 12, sy - 12, 24, 16, 5, STRAW); S_.fillRRect(ctx, sx - 12, sy - 4, 24, 3, 1, STRAW_D); S_.fillRRect(ctx, sx - 3, sy - 16, 6, 6, 2, STRAW_D);
    }
  };
  W.treeBody = function (ctx, x, y) {                               // persimmon tree: olive canopy
    const S_ = A();
    S_.shadow(ctx, x, y, 22, 7);
    S_.fillRRect(ctx, x - 5, y - 26, 10, 26, 3, STRAW_D);
    S_.circle(ctx, x - 14, y - 36, 17, '#6B7A3A'); S_.circle(ctx, x + 14, y - 36, 17, '#6B7A3A'); S_.circle(ctx, x, y - 44, 21, '#6B7A3A');
    S_.circle(ctx, x - 7, y - 50, 10, '#8A9A4A');
  };
  W.treeFruit = function (ctx, x, y, progress, ripe, t) {
    const S_ = A();
    if (ripe) { const sc = 1 + 0.06 * Math.sin(t * 5); S_.circle(ctx, x - 6, y - 40, 7.5 * sc, PERSIMMON); S_.ellipse(ctx, x - 6, y - 47, 5, 2.4, '#4F6A2A'); S_.circle(ctx, x - 8, y - 42, 2.2, PAL.mix(PERSIMMON, PAL.cream, 0.5)); }
    else { const r = 2 + 2.5 * U.clamp(progress, 0, 1); S_.circle(ctx, x - 6, y - 40, r, PAL.mix('#8A9A4A', PERSIMMON, progress * progress)); }
  };
  W.stallBody = function (ctx, x, y) {                              // Tsuru's tea counter: straw counter, red noren, Madame Tsuru behind it
    const S_ = A(), w = 120, h = 36;
    S_.shadow(ctx, x, y + 14, 64, 10);
    S_.fillRRect(ctx, x - 52, y - 62, 6, 50, 2, STRAW_D); S_.fillRRect(ctx, x + 46, y - 62, 6, 50, 2, STRAW_D);
    // Madame Tsuru (tall white crane) standing behind the counter
    S_.fillRRect(ctx, x - 1, y - 40, 2, 18, 1, PAL.ink); S_.fillRRect(ctx, x + 5, y - 40, 2, 18, 1, PAL.ink);
    S_.ellipse(ctx, x + 2, y - 48, 14, 9, PAL.cream); S_.ellipse(ctx, x - 9, y - 50, 7, 5, PAL.ink);
    A().line(ctx, x + 10, y - 54, x + 16, y - 86, PAL.cream, 4);
    S_.circle(ctx, x + 17, y - 88, 5.5, PAL.cream); S_.circle(ctx, x + 17, y - 92, 2.2, PAL.red); S_.tri(ctx, x + 21, y - 89, x + 21, y - 86, x + 30, y - 87, PAL.ink); S_.circle(ctx, x + 19, y - 89, 1.2, PAL.ink);
    S_.plate(ctx, x - w / 2, y - h / 2, w, h, 6, STRAW, STRAW_D, 8);
    S_.fillRRect(ctx, x - 66, y - 78, 132, 18, 4, MAPLE);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = (i & 1) ? PAL.cream : MAPLE; ctx.fillRect(x - 52 + i * 26, y - 72, 26, 11); }
    S_.fillRRect(ctx, x - 48, y - 30, 12, 12, 4, PAL.ink); S_.fillRRect(ctx, x - 45, y - 36, 6, 6, 2, PAL.ink);     // the kettle
  };
  W.stallTop = function (ctx, x, y, stock, prepFrac) {              // tea cups ready on the counter; the brew ring
    const S_ = A();
    for (let i = 0; i < stock; i++) { const cx = x - 20 + i * 18; S_.fillRRect(ctx, cx - 7, y - 26, 14, 10, 4, PAL.cream); S_.ellipse(ctx, cx, y - 26, 6, 2, PERSIMMON_D); }
    if (prepFrac > 0) S_.ring(ctx, x + 40, y - 24, 9, prepFrac, 3, PAL.cta, PAL.rgba(PAL.ink, 0.2));
  };
  W.bellPost = function (ctx, x, y, frac, pulse) {                  // station post with five leaf-lamps (one per docked car in the cycle of five) and the countdown ring
    const S_ = A(), idx = G.S ? G.S.car.index : 0;
    S_.shadow(ctx, x, y, 10, 4);
    S_.fillRRect(ctx, x - 3, y - 44, 6, 44, 2, STRAW_D);
    for (let i = 0; i < 5; i++) { const ly = y - 12 - i * 7, lit = (idx % 5) > i || (idx % 5) === 0 && idx > 0; S_.fillRRect(ctx, x + 6, ly - 3, 8, 5, 2, lit ? PAL.amber : SLATE_D); }
    S_.fillRRect(ctx, x - 9, y - 56, 18, 16, 8, PAL.coin); S_.fillRRect(ctx, x - 11, y - 42, 22, 4, 2, PAL.coinRim); S_.circle(ctx, x, y - 37, 3, PAL.coinRim);
    const lw = pulse > 0 ? 5 + 2 * Math.abs(Math.sin(pulse * 10)) : 5;
    S_.ring(ctx, x, y - 48, MAP.BELL.ringR, frac, lw, PAL.cta, PAL.rgba(PAL.cream, 0.55));
  };
  W.cableCar = function (ctx, x, swing, golden, heads) {            // the Ridge Rail: a stubby red rack-railway car
    const S_ = A(), cy = MAP.CABLE.y, body = golden ? PAL.straw : MAPLE, dark = golden ? PAL.coinRim : MAPLE_D;
    ctx.save(); ctx.translate(x, cy - 2); ctx.rotate(swing * 0.5);
    S_.circle(ctx, -22, 4, 7, PAL.ink); S_.circle(ctx, 0, 4, 7, PAL.ink); S_.circle(ctx, 22, 4, 7, PAL.ink);
    S_.fillRRect(ctx, -38, -40, 76, 40, 8, body); S_.fillRRect(ctx, -38, -12, 76, 10, 4, dark);
    S_.fillRRect(ctx, -40, -46, 80, 8, 4, dark);
    S_.fillRRect(ctx, 26, -58, 10, 14, 3, PAL.ink); S_.circle(ctx, 31, -64, 7, PAL.rgba(PAL.cream, 0.7));                 // chimney + puff
    for (let i = 0; i < 3; i++) { const wx = -27 + i * 20; S_.fillRRect(ctx, wx - 7, -34, 14, 14, 3, PAL.cream); if (i < heads) { S_.circle(ctx, wx, -26, 5, PAL.capy); S_.circle(ctx, wx + 3, -25, 2.5, PAL.capySnout); } }
    if (golden) { S_.fillRRect(ctx, -38, -24, 76, 4, 2, PAL.coinRim); S_.icon(ctx, 'leaf', 0, -50, 16); }
    ctx.restore();
  };

  // ---------- cast ----------
  Ch.hats.yuzu = function (ctx, x, y) {                             // a persimmon slice hat
    const S_ = A(), P = Ch.colors();
    S_.circle(ctx, x, y - 2, 10, PERSIMMON); Ch.strokePath(ctx, PERSIMMON_D);
    ctx.beginPath(); ctx.arc(x, y - 2, 10, 0, TAU); Ch.strokePath(ctx, PERSIMMON_D);
    S_.circle(ctx, x, y - 2, 6, PAL.mix(PERSIMMON, P.cream, 0.5)); S_.ellipse(ctx, x + 3, y - 10, 5, 2.4, '#4F6A2A');
  };
  Ch.squirrel = function (ctx, p) {                                 // the Chestnut Run: orange body, a big tail, white belly
    const S_ = A(), P = Ch.colors();
    Ch.begin(ctx, p, 13, 4);
    const lp = p.moving ? Math.sin(p.walk * TAU * 2) * 2 : 0;
    ctx.save(); ctx.translate(-12, -16); ctx.rotate(-0.5 + (p.moving ? Math.sin(p.walk * TAU) * 0.15 : 0)); S_.ellipse(ctx, 0, -8, 8, 16, PERSIMMON_D); S_.ellipse(ctx, 1, -9, 5, 11, PERSIMMON); ctx.restore();
    S_.fillRRect(ctx, -7, -6 - lp, 5, 6 + lp, 2, PERSIMMON_D); S_.fillRRect(ctx, 2, -6 + lp, 5, 6 - lp, 2, PERSIMMON_D);
    ctx.beginPath(); ctx.arc(0, -14, 11, 0, TAU); ctx.fillStyle = PERSIMMON; ctx.fill(); Ch.strokePath(ctx, PERSIMMON_D);
    S_.ellipse(ctx, 1, -11, 5, 6, P.cream);
    const up = p.dir === 'up', down = p.dir === 'down', hx = down ? 0 : 7;
    ctx.beginPath(); ctx.arc(hx, -27, 7, 0, TAU); ctx.fillStyle = PERSIMMON; ctx.fill(); Ch.strokePath(ctx, PERSIMMON_D);
    S_.tri(ctx, hx - 7, -31, hx - 2, -31, hx - 5, -38, PERSIMMON_D); S_.tri(ctx, hx + 2, -31, hx + 7, -31, hx + 5, -38, PERSIMMON_D);
    if (!up) { if (down) { S_.circle(ctx, hx - 3, -28, 2.2, P.ink); S_.circle(ctx, hx + 3, -28, 2.2, P.ink); } else { S_.circle(ctx, hx + 3, -28, 2.2, P.ink); S_.circle(ctx, hx + 7, -25, 1.5, P.capySnout); } }
    if (p.hat) Ch.hats.yuzu(ctx, hx, -38);
    Ch.end(ctx);
  };
  // Momo (Ch.momo) now lives in 21_art_chars.js: he visits the Deck's Ridge too
})(window.G);
