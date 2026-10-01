// Capy Springs - station upgrade bottom sheet (ARCHITECTURE.md 13, GDD 10.4).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL, DATA = G.DATA;
  const Sheet = G.Sheet = {};
  const KEYS = ['speed', 'slots', 'pay'], BX = [20, 195, 370], BW = 150, BH = 112;
  const SHEET = { id: null, y: 0, openX: 0, openY: 0, last: null, wiggle: 0, wiggleKey: null };
  const P = { x: 0, y: 0 }, R = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const evOpen = { id: null }, evNone = {};
  let lastText = '', lastTextKey = '';

  Sheet.init = function (S) { };
  Sheet.isOpen = S => !!S.ui.sheet;
  Sheet.top = S => G.Canvas.H - Math.max(C.SHEET_MIN, C.SHEET_FRAC * G.Canvas.H);
  Sheet.open = function (S, id) {
    if (!S.built[id] || !DATA.UPGRADES[id]) return;
    SHEET.id = id; SHEET.y = G.Canvas.H; SHEET.openX = S.kit.x; SHEET.openY = S.kit.y; SHEET.last = null; SHEET.wiggle = 0;
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
    if (!S.built[sh.id] || U.dist(S.kit.x, S.kit.y, sh.openX, sh.openY) > C.SHEET_CLOSE_DIST) Sheet.close(S);
  };
  Sheet.tap = function (S, x, y) {
    const sh = S.ui.sheet; if (!sh) return false;
    const top = Sheet.top(S);
    if (y < top) { Sheet.close(S); return true; }
    if (x >= 540 - 64 - 6 && x <= 540 - 4 && y >= top + 2 && y <= top + 62) { Sheet.close(S); return true; }
    for (let i = 0; i < 3; i++) {
      if (x >= BX[i] && x <= BX[i] + BW && y >= top + 70 && y <= top + 70 + BH) {
        const key = KEYS[i]; sh.last = key;
        if (G.Upgrades.buy(S, sh.id, key)) { S.ui.squash[sh.id] = 1; }
        else { sh.wiggle = 1; sh.wiggleKey = key; G.Bus.emit('ui:nope', evNone); }
        return true;
      }
    }
    return true;
  };
  Sheet.draw = function (ctx, S) {
    const sh = S.ui.sheet; if (!sh) return;
    const A = G.Art.S, top = sh.y, id = sh.id, H = G.Canvas.H;
    A.fillRRect(ctx, 0, top, 540, H - top + 40, 22, PAL.cream);
    A.fillRRect(ctx, 0, top, 540, 10, 5, PAL.cedar);
    const name = S.baths[id] ? S.baths[id].def.name : id === 'boiler' ? 'Boiler' : id === 'grove' ? 'Yuzu Grove' : 'Snack Stall';
    A.text(ctx, name, 24, top + 32, 26, PAL.ink, LEFT);
    if (sh.last) { const k = id + sh.last + G.Upgrades.level(S, id, sh.last); if (k !== lastTextKey) { lastTextKey = k; lastText = G.Upgrades.effectText(S, id, sh.last); } A.text(ctx, lastText, 24 + 24 * 0 + Math.min(300, name.length * 15) + 16, top + 34, 18, PAL.stoneDark, LEFT); }
    A.fillRRect(ctx, 540 - 64, top + 8, 48, 48, 14, PAL.rgba(PAL.ink, 0.08)); A.icon(ctx, 'x', 540 - 40, top + 32, 24);
    for (let i = 0; i < 3; i++) {
      const key = KEYS[i], t = DATA.UPGRADES[id][key], x = BX[i], y = top + 70;
      const lvl = G.Upgrades.level(S, id, key), cost = G.Upgrades.cost(S, id, key), vis = G.Upgrades.visible(S, id, key), can = vis && cost !== null && S.coins >= cost;
      const wob = sh.wiggle > 0 && sh.wiggleKey === key ? Math.sin(sh.wiggle * 30) * 4 * sh.wiggle : 0;
      A.fillRRect(ctx, x + wob, y + 3, BW, BH, 16, PAL.rgba(PAL.ink, 0.12)); A.fillRRect(ctx, x + wob, y, BW, BH, 16, '#FFFFFF');
      A.icon(ctx, ICONS[id] ? ICONS[id][i] : 'koban', x + wob + 28, y + 26, 28);
      A.text(ctx, t.label, x + wob + 48, y + 26, 22, PAL.ink, LEFT);
      for (let p = 0; p < t.max; p++) A.fillRRect(ctx, x + wob + 14 + p * (122 / t.max), y + 48, 122 / t.max - 4, 8, 3, p < lvl ? PAL.amber : PAL.rgba(PAL.ink, 0.15));
      if (!vis) A.pill(ctx, x + wob + BW / 2, y + 84, 110, 34, 'Hire Pon', 16, PAL.rgba(PAL.ink, 0.12), PAL.stoneDark, 'lock');
      else if (cost === null) A.pill(ctx, x + wob + BW / 2, y + 84, 110, 34, 'MAX', 20, PAL.rgba(PAL.pine, 0.2), PAL.pine, 'check');
      else if (can) A.pill(ctx, x + wob + BW / 2, y + 84, 118, 36, String(cost), 24, PAL.cta, PAL.cream, 'koban');
      else A.pill(ctx, x + wob + BW / 2, y + 84, 118, 36, String(cost), 24, PAL.rgba(PAL.ink, 0.12), PAL.red, 'lock');
    }
  };
  const LEFT = { align: 'left' };
  const ICONS = { rock: ['bath', 'capy', 'koban'], cedar: ['bath', 'capy', 'koban'], bamboo: ['bath', 'capy', 'koban'], boiler: ['flame', 'kettle', 'pon'], grove: ['yuzu', 'yuzu', 'yuzu'], stall: ['mochi', 'mochi', 'koban'] };
  ICONS.rock[1] = ICONS.cedar[1] = ICONS.bamboo[1] = 'bath';
})(window.G);
