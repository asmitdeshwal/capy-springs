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
    ctx.fillStyle = PAL.pine; ctx.fillRect(0, y0, MAP.W, y1 - y0);
    for (let i = 0; i < 26; i++) {                                  // darker patches
      const x = U.hash(i, 1) * 540, y = y0 + U.hash(i, 2) * (y1 - y0), rx = 40 + U.hash(i, 3) * 70, ry = 14 + U.hash(i, 4) * 22;
      S_.ellipse(ctx, x, y, rx, ry, PAL.pineDark);
    }
    for (let i = 0; i < 30; i++) {                                  // moss
      const x = U.hash(i, 5) * 540, y = y0 + U.hash(i, 6) * (y1 - y0), rx = 18 + U.hash(i, 7) * 40, ry = 6 + U.hash(i, 8) * 12;
      S_.ellipse(ctx, x, y, rx, ry, PAL.moss);
    }
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
    const S_ = A(), L = MAP.LANE;
    ctx.globalAlpha = 0.6; ctx.fillStyle = PAL.stone; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0); ctx.globalAlpha = 1;
    for (let y = L.y0 + 20; y < L.y1; y += 40) S_.circle(ctx, L.cx + (U.hash(y, 9) - 0.5) * 16, y, 9, PAL.mix(PAL.stone, PAL.cream, 0.35));
  };
  W.rocks = function (ctx) { const S_ = A(); for (let i = 0; i < MAP.ROCKS.length; i++) { const r = MAP.ROCKS[i]; S_.ellipse(ctx, r[0] + 6, r[1] + 2, 16, 9, PAL.stoneDark); S_.ellipse(ctx, r[0], r[1] - 4, 18, 11, PAL.stone); S_.ellipse(ctx, r[0] - 6, r[1] - 9, 8, 4, PAL.mix(PAL.stone, PAL.cream, 0.4)); } };
  W.pine = function (ctx, x, y) {
    const S_ = A();
    S_.shadow(ctx, x, y, 18, 6);
    S_.fillRRect(ctx, x - 3, y - 10, 6, 10, 2, PAL.cedarDark);
    S_.tri(ctx, x - 20, y - 8, x + 20, y - 8, x, y - 46, PAL.pineDark); S_.tri(ctx, x - 20, y - 8, x, y - 8, x, y - 46, PAL.pine);
    S_.tri(ctx, x - 15, y - 30, x + 15, y - 30, x, y - 62, PAL.pineDark); S_.tri(ctx, x - 15, y - 30, x, y - 30, x, y - 62, PAL.pine);
  };
  W.pines = function (ctx) { for (let i = 0; i < MAP.PINES.length; i++) W.pine(ctx, MAP.PINES[i][0], MAP.PINES[i][1]); };
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
  let mistG = null, mistCtx = null;
  W.mist = function (ctx, camY, H) {
    const m = MAP.MIST; if (camY > m.y1 + 10) return;
    if (!mistG || mistCtx !== ctx) { mistCtx = ctx; mistG = ctx.createLinearGradient(0, m.y1, 0, m.y0); mistG.addColorStop(0, PAL.rgba(PAL.mist, 0)); mistG.addColorStop(1, PAL.rgba(PAL.mist, 0.95)); }
    ctx.fillStyle = mistG; ctx.fillRect(0, m.y0 - 200, MAP.W, m.y1 - m.y0 + 200);
  };
  W.sign = function (ctx, x, y) { const S_ = A(); S_.fillRRect(ctx, x - 3, y - 30, 6, 30, 2, PAL.cedarDark); S_.plate(ctx, x - 40, y - 52, 80, 26, 5, PAL.cedar, PAL.cedarDark, 4); S_.text(ctx, 'RIDGE', x, y - 39, 14, PAL.cream); };

  // ---------- decks and water ----------
  W.deckPlate = function (ctx, def) {
    const S_ = A(), d = def.deck, x0 = d.x - d.w / 2, y0 = d.y - d.h / 2;
    S_.plate(ctx, x0, y0, d.w, d.h, 14, PAL.cedar, PAL.cedarDark, 10);
    ctx.strokeStyle = PAL.plank; ctx.lineWidth = 1; ctx.beginPath();
    for (let y = y0 + 18; y < y0 + d.h - 4; y += 18) { ctx.moveTo(x0 + 8, y); ctx.lineTo(x0 + d.w - 8, y); }
    ctx.stroke();
    if (def.stripes) { for (let i = 0; i < 6; i++) S_.fillRRect(ctx, x0 + 6 + i * 6, y0 - 6, 4, d.h + 4, 2, PAL.moss); }
  };
  // state: { cold, yuzu, lowFx }
  W.water = function (ctx, def, state, t) {
    const S_ = A(), w = def.water, x0 = w.x - w.w / 2, y0 = w.y - w.h / 2;
    const fill = state.cold ? PAL.waterCold : state.yuzu ? PAL.waterYuzu : PAL.waterHot;
    S_.strokeRRect(ctx, x0, y0, w.w, w.h, 18, PAL.stone, 6);
    S_.fillRRect(ctx, x0, y0, w.w, w.h, 18, fill);
    S_.strokeRRect(ctx, x0 + 2, y0 + 2, w.w - 4, w.h - 4, 16, state.cold ? PAL.stone : state.yuzu ? PAL.amberDeep : PAL.waterHotDeep, 3);
    if (state.cold) S_.strokeRRect(ctx, x0 + 1, y0 + 1, w.w - 2, w.h - 2, 17, PAL.cream, 2, true);
    else if (!state.lowFx) {
      ctx.globalAlpha = 0.18; ctx.fillStyle = PAL.ripple;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(w.x + Math.sin(t * 0.7 + i * 2.1) * (w.w * 0.22), w.y - 10 + i * 12 + Math.cos(t * 0.5 + i) * 4, 26, 6, 0, 0, TAU); ctx.fill(); }
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
    S_.ring(ctx, 0, 0, 30, fill, 6, PAL.cta, affordable ? PAL.rgba(PAL.cta, 0.55) : PAL.rgba(PAL.stoneDark, 0.7), !affordable);
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
    S_.circle(ctx, x - 14, y - 36, 18, PAL.pine); S_.circle(ctx, x + 14, y - 36, 18, PAL.pine); S_.circle(ctx, x, y - 44, 22, PAL.pine);
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
