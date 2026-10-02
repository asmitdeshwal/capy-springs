// Capy Springs - station upgrade bottom sheet: one row per track, each saying in plain words what the koban buys (ARCHITECTURE.md 13, GDD 10.4).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL, DATA = G.DATA;
  const Sheet = G.Sheet = {};
  const KEYS = ['speed', 'slots', 'pay'], RX = 16, RW = 508, RH = 92, RGAP = 6, ROWS_Y = 76;
  const SHEET = { id: null, y: 0, openX: 0, openY: 0, last: null, wiggle: 0, wiggleKey: null, flash: 0, flashKey: null };
  const R = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const evOpen = { id: null }, evNone = {};

  Sheet.init = function (S) { };
  Sheet.isOpen = S => !!S.ui.sheet;
  Sheet.top = S => G.Canvas.H - Math.max(C.SHEET_MIN, C.SHEET_FRAC * G.Canvas.H);
  Sheet.open = function (S, id) {
    if (!S.built[id] || !DATA.UPGRADES[id]) return;
    SHEET.id = id; SHEET.y = G.Canvas.H; SHEET.openX = S.kit.x; SHEET.openY = S.kit.y; SHEET.last = null; SHEET.wiggle = 0; SHEET.flash = 0;
    S.ui.sheet = SHEET; G.Game.syncMode(S);
    evOpen.id = id; G.Bus.emit('ui:sheet:open', evOpen);
  };
  Sheet.close = function (S) { if (!S.ui.sheet) return; evOpen.id = S.ui.sheet.id; S.ui.sheet = null; G.Game.syncMode(S); G.Bus.emit('ui:sheet:close', evOpen); };
  // tap footprint of a built sheet station (expanded by 20 px) containing the world point
  Sheet.stationAt = function (S, wx, wy) {
    for (let i = 0; i < DATA.SHEET_STATIONS.length; i++) {
      const id = DATA.SHEET_STATIONS[i]; if (!S.built[id]) continue;
      footprint(S, id, R); U.rectExpand(R, 20, R);
      if (U.rectHas(R, wx, wy)) return id;
    }
    return null;
  };
  function footprint(S, id, out) {
    const st = DATA.STATIONS;
    if (S.baths[id]) return U.rectCenter(S.baths[id].def.deck, out);
    if (id === 'boiler') { out.x0 = st.boiler.x - 30; out.y0 = st.boiler.y - 70; out.x1 = st.boiler.x + 30; out.y1 = st.boiler.y; return out; }
    if (id === 'grove') { const n = Math.min(G.Upgrades.treeCount(S), S.grove.trees.length); out.x0 = 1e9; out.y0 = 1e9; out.x1 = -1e9; out.y1 = -1e9; for (let i = 0; i < n; i++) { const t = S.grove.trees[i]; out.x0 = Math.min(out.x0, t.x - 26); out.x1 = Math.max(out.x1, t.x + 26); out.y0 = Math.min(out.y0, t.y - 70); out.y1 = Math.max(out.y1, t.y); } return out; }
    if (id === 'stall') { out.x0 = st.stall.x - 60; out.y0 = st.stall.y - 78; out.x1 = st.stall.x + 60; out.y1 = st.stall.y + 18; return out; }
    out.x0 = out.y0 = out.x1 = out.y1 = 0; return out;
  }
  Sheet.update = function (S, dt) {
    const sh = S.ui.sheet; if (!sh) return;
    const top = Sheet.top(S);
    sh.y += (top - sh.y) * Math.min(1, dt / C.SHEET_SLIDE * 3);
    if (sh.wiggle > 0) sh.wiggle = Math.max(0, sh.wiggle - dt * 4);
    if (sh.flash > 0) sh.flash = Math.max(0, sh.flash - dt * 2.5);
    if (!S.built[sh.id] || U.dist(S.kit.x, S.kit.y, sh.openX, sh.openY) > C.SHEET_CLOSE_DIST) Sheet.close(S);
  };
  Sheet.tap = function (S, x, y) {
    const sh = S.ui.sheet; if (!sh) return false;
    const top = Sheet.top(S);
    if (sh.y - top > 8) return true;                       // still rising: a double-tap on the station must not buy on the way up
    if (y < top) { Sheet.close(S); return true; }
    if (x >= 540 - 64 - 6 && x <= 540 - 4 && y >= top + 2 && y <= top + 62) { Sheet.close(S); return true; }
    for (let i = 0; i < 3; i++) {
      const ry = top + ROWS_Y + i * (RH + RGAP);
      if (x >= RX && x <= RX + RW && y >= ry && y <= ry + RH) {
        const key = KEYS[i]; sh.last = key;
        if (x >= RX + 440 - 68 && y >= ry + 32 && y <= ry + 84 && G.Offers.freeOk(S, sh.id, key)) { G.Offers.free(S, sh.id, key); return true; }   // the FREE pill
        if (G.Upgrades.buy(S, sh.id, key)) { S.ui.squash[sh.id] = 1; sh.flash = 1; sh.flashKey = key; }
        else { sh.wiggle = 1; sh.wiggleKey = key; G.Bus.emit('ui:nope', evNone); }
        return true;
      }
    }
    return true;
  };
  Sheet.draw = function (ctx, S) {
    const sh = S.ui.sheet; if (!sh) return;
    const A = G.Art.S, top = sh.y, id = sh.id, H = G.Canvas.H, Upg = G.Upgrades;
    A.fillRRect(ctx, 0, top, 540, H - top + 40, 22, PAL.cream);
    A.fillRRect(ctx, 240, top + 8, 60, 6, 3, PAL.rgba(PAL.ink, 0.18));
    const name = S.baths[id] ? S.baths[id].def.name : id === 'boiler' ? G.Seasons.text('boilerName', 'Boiler') : id === 'grove' ? G.Seasons.text('groveName', 'Yuzu Grove') : G.Seasons.text('stallName', 'Snack Stall');
    A.text(ctx, name, 24, top + 38, 26, PAL.ink, LEFT);
    A.text(ctx, 'Tap an upgrade to buy it', 24, top + 62, 13, PAL.stoneDark, LEFT);
    A.fillRRect(ctx, 540 - 64, top + 14, 48, 48, 14, PAL.rgba(PAL.ink, 0.08)); A.icon(ctx, 'x', 540 - 40, top + 38, 24);
    for (let i = 0; i < 3; i++) {
      const key = KEYS[i], t = DATA.UPGRADES[id][key], y = top + ROWS_Y + i * (RH + RGAP);
      const lvl = Upg.level(S, id, key), cost = Upg.cost(S, id, key), vis = Upg.visible(S, id, key), can = vis && cost !== null && S.coins >= cost, maxed = cost === null;
      const wob = sh.wiggle > 0 && sh.wiggleKey === key ? Math.sin(sh.wiggle * 30) * 4 * sh.wiggle : 0;
      const x = RX + wob, glow = sh.flash > 0 && sh.flashKey === key ? sh.flash : 0;
      A.fillRRect(ctx, x, y + 3, RW, RH, 16, PAL.rgba(PAL.ink, 0.10));
      A.fillRRect(ctx, x, y, RW, RH, 16, glow > 0 ? PAL.mix('#FFFFFF', PAL.amber, 0.35 * glow) : '#FFFFFF');
      if (can) A.strokeRRect(ctx, x, y, RW, RH, 16, PAL.rgba(PAL.cta, 0.5), 2);
      A.icon(ctx, ICONS[id] ? ICONS[id][i] : 'koban', x + 36, y + 46, 36);
      // title, before -> after, blurb
      A.text(ctx, t.title || t.label, x + 70, y + 22, 18, PAL.ink, LEFT);
      const cur = Upg.valueAt(S, id, key, lvl);
      if (maxed) A.text(ctx, cur + '  (fully upgraded)', x + 70, y + 47, 15, PAL.pine, LEFT);
      else {
        const nxt = Upg.valueAt(S, id, key, lvl + 1);
        ctx.font = G.Art.font(15); const w = ctx.measureText(cur + '  →  ').width;
        A.text(ctx, cur + '  →  ', x + 70, y + 47, 15, PAL.stoneDark, LEFT);
        A.text(ctx, nxt, x + 70 + w, y + 47, 16, vis ? PAL.cta : PAL.stoneDark, LEFT);
      }
      A.text(ctx, t.blurb || '', x + 70, y + 70, 12, PAL.stoneDark, LEFT);
      // level pips and the price
      for (let p = 0; p < t.max; p++) A.circle(ctx, x + 388 + p * 16, y + 20, 5, p < lvl ? PAL.amber : PAL.rgba(PAL.ink, 0.14));
      if (!vis) A.pill(ctx, x + 440, y + 58, 118, 36, G.Seasons.text('ponHire', 'Hire Pon'), 14, PAL.rgba(PAL.ink, 0.12), PAL.stoneDark, 'lock');
      else if (maxed) A.pill(ctx, x + 440, y + 58, 118, 36, 'MAX', 18, PAL.rgba(PAL.pine, 0.2), PAL.pine, 'check');
      else if (can) A.pill(ctx, x + 440, y + 58, 124, 40, String(cost), 22, PAL.cta, PAL.cream, 'koban');
      else if (G.Offers.freeOk(S, id, key)) { A.pill(ctx, x + 440, y + 58, 124, 40, '', 20, PAL.cta, PAL.cream, null); G.Ads.glyph(ctx, x + 408, y + 58, 22, PAL.cream, PAL.cta); A.text(ctx, 'FREE', x + 456, y + 59, 20, PAL.cream); }
      else A.pill(ctx, x + 440, y + 58, 124, 40, String(cost), 22, PAL.rgba(PAL.ink, 0.12), PAL.red, 'koban');
    }
  };
  const LEFT = { align: 'left' };
  const ICONS = { rock: ['bath', 'capy', 'koban'], cedar: ['bath', 'capy', 'koban'], bamboo: ['bath', 'capy', 'koban'], boiler: ['flame', 'kettle', 'pon'], grove: ['yuzu', 'yuzu', 'yuzu'], stall: ['mochi', 'mochi', 'koban'] };
  ICONS.bench = ICONS.table = ICONS.hearth = ICONS.rock;
  ICONS.sauna = ['flame', 'capy', 'koban']; ICONS.plunge = ['plunge', 'capy', 'koban']; ICONS.pavilion = ['heart', 'capy', 'koban'];
  ICONS.source = ['source', 'monkey', 'koban']; ICONS.snowroll = ['snow', 'monkey', 'koban'];
})(window.G);
