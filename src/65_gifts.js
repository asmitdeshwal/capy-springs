// Capy Springs - Free gifts (GDD 21, docs/MONETIZATION.md): a gift chip on the HUD opens a card where the player picks a reward and watches a
// short video for it: a bag of koban, a Steam Rush, a golden cable car. Every video finished in a day (from anywhere in the game) fills the
// Mountain Chest, which opens without a video at five. The day's count and the cooldowns live on the phone (capysprings.gifts), not in the
// save, so they hold across seasons and restarts. Store apps only (or developer mode's test ads); nothing here runs in the harness.
(function (G) {
  'use strict';
  const PAL = G.PAL, D = G.DATA.GIFTS, KEY = 'capysprings.gifts';
  const Gifts = G.Gifts = {};
  const CHIP = { x0: 16, y0: 0, x1: 136, y1: 0 }, P = { x0: 40, x1: 500, y0: 0, y1: 0 }, ROWS = [], L = { ry0: 0, chestY: 0, linkY: 0 };
  let st = null, wired = false;

  // ---- the day's count and the cooldowns ----
  const today = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  function state() {
    if (!st) { try { st = JSON.parse(G.Save.store.get(KEY) || 'null'); } catch (e) { st = null; } if (!st || typeof st !== 'object') st = {}; if (!st.cd || typeof st.cd !== 'object') st.cd = {}; }
    if (st.day !== today()) { st.day = today(); st.videos = 0; st.chest = false; }
    return st;
  }
  function save() { try { G.Save.store.set(KEY, JSON.stringify(st)); } catch (e) { /* ignore */ } }
  const left = id => Math.max(0, ((state().cd[id] || 0) - Date.now()) / 1000);
  const income = (S, minutes, min) => Math.max(min, Math.round(G.Save.rate(S.income) * 60 * minutes / 10) * 10);
  const fmt = v => G.Art.S.fmtCoins(v);
  const mmss = s => { const t = Math.ceil(s); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  Gifts.videos = () => state().videos | 0;
  Gifts.chestReady = () => { const s = state(); return !s.chest && (s.videos | 0) >= D.chestAt; };
  Gifts.reset = function () { st = { cd: {} }; state(); save(); };          // developer mode

  Gifts.init = function () {
    if (wired) return; wired = true;
    G.Bus.on('ad:end', e => { if (e.kind === 'rewarded' && e.earned) { const s = state(); s.videos = (s.videos | 0) + 1; save(); } });
  };
  Gifts.shown = S => !G.Game.headless && (G.Ads.ok || G.Ads.fake) && G.Seasons.firstLit(S) && S.mode !== 'finale' && S.mode !== 'title';

  const GIFTS = [
    { id: 'bag', icon: 'koban', title: 'A bag of koban', sub: S => '+' + fmt(income(S, D.bag.minutes, D.bag.min)) + ' koban, right now', ok: () => true,
      give: S => { const v = income(S, D.bag.minutes, D.bag.min); G.Coins.add(S, v, 'gift'); G.HUD.offlineRain(S, v); G.HUD.banner(S, 'A BAG OF KOBAN!', '+' + fmt(v) + ' koban'); } },
    { id: 'rush', icon: 'flame', title: 'A Steam Rush', sub: () => 'The boiler fills: hot baths pay more', ok: S => !!S.built.boiler,
      give: S => { S.heat.v = S.heat.max; S.heat.graceT = 0; } },
    { id: 'golden', icon: 'car', title: 'A golden cable car', sub: () => 'The next car brings a crowd', ok: () => true,
      give: S => { S.car.giftGolden = true; G.HUD.banner(S, 'A GOLDEN CAR IS COMING', 'the next cable car is golden'); } }
  ];
  function claim(S, g) {
    G.Cards.close(S);
    G.Ads.rewarded(S, 'gift:' + g.id, S2 => { const s = state(); s.cd[g.id] = Date.now() + D[g.id].cooldown * 1000; save(); g.give(S2); });
  }
  function openChest(S) {
    const s = state(); if (s.chest || (s.videos | 0) < D.chestAt) return;
    s.chest = true; save(); G.Cards.close(S);
    const v = income(S, D.chestMinutes, D.chestMin);
    G.Coins.add(S, v, 'gift'); G.HUD.offlineRain(S, v); G.FX.confetti(S, S.kit.x, S.kit.y - 40, 40);
    G.HUD.banner(S, 'THE MOUNTAIN CHEST!', '+' + fmt(v) + ' koban');
  }

  // ---- the card (a card kind owned by Cards, delegated here like the age question) ----
  const LEFT = { align: 'left' }, EV = {};
  function layout(S) {
    ROWS.length = 0; for (let i = 0; i < GIFTS.length; i++) if (GIFTS[i].ok(S)) ROWS.push(GIFTS[i]);
    const link = G.Shop.available() && !G.Shop.owned, h = 96 + ROWS.length * 84 + 92 + (link ? 44 : 8);
    P.y0 = Math.round(G.Canvas.H / 2 - h / 2); P.y1 = P.y0 + h;
    L.ry0 = P.y0 + 96; L.chestY = L.ry0 + ROWS.length * 84 + 4; L.linkY = link ? L.chestY + 80 + 30 : -1;
  }
  Gifts.draw = function (ctx, S, k) {
    const A = G.Art.S; layout(S);
    const s = state(), can = G.Ads.can('rewarded'), w = P.x1 - P.x0 - 32;
    A.fillRRect(ctx, P.x0, P.y0 + 6, P.x1 - P.x0, P.y1 - P.y0, 24, PAL.rgba(PAL.ink, 0.3));
    A.fillRRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 24, PAL.cream);
    Gifts.box(ctx, P.x0 + 46, P.y0 + 44, 1.4);
    A.text(ctx, 'Free gifts', 270, P.y0 + 42, 28, PAL.ink);
    A.text(ctx, 'Pick a gift, then watch a short video.', 270, P.y0 + 72, 15, PAL.stoneDark);
    A.fillRRect(ctx, P.x1 - 56, P.y0 + 14, 40, 40, 12, PAL.rgba(PAL.ink, 0.08)); A.icon(ctx, 'x', P.x1 - 36, P.y0 + 34, 20);
    for (let i = 0; i < ROWS.length; i++) {
      const g = ROWS[i], y = L.ry0 + i * 84, wait = left(g.id), bx = P.x1 - 84, by = y + 38;
      A.fillRRect(ctx, P.x0 + 16, y + 3, w, 76, 16, PAL.rgba(PAL.ink, 0.08));
      A.fillRRect(ctx, P.x0 + 16, y, w, 76, 16, '#FFFFFF');
      if (g.icon === 'car') carIcon(ctx, P.x0 + 52, y + 42, 1); else A.icon(ctx, g.icon, P.x0 + 52, y + 38, 34);
      A.text(ctx, g.title, P.x0 + 86, y + 28, 18, PAL.ink, LEFT);
      A.text(ctx, g.sub(S), P.x0 + 86, y + 52, 13, PAL.stoneDark, LEFT);
      if (wait > 0) A.pill(ctx, bx, by, 108, 40, mmss(wait), 18, PAL.rgba(PAL.ink, 0.1), PAL.stoneDark, null);
      else if (!can) A.pill(ctx, bx, by, 108, 40, 'LOADING', 14, PAL.rgba(PAL.ink, 0.1), PAL.stoneDark, null);
      else { A.pill(ctx, bx, by, 108, 40, '', 18, PAL.cta, PAL.cream, null); G.Ads.glyph(ctx, bx - 26, by, 20, PAL.cream, PAL.cta); A.text(ctx, 'GET', bx + 14, by + 1, 19, PAL.cream); }
    }
    // the Mountain Chest: five videos in a day
    const cy = L.chestY, n = Math.min(s.videos | 0, D.chestAt), ready = Gifts.chestReady();
    A.fillRRect(ctx, P.x0 + 16, cy, w, 80, 16, PAL.rgba(PAL.amber, ready ? 0.45 : 0.22));
    chestIcon(ctx, P.x0 + 52, cy + 46, 1.1, s.chest);
    A.text(ctx, 'Mountain chest', P.x0 + 86, cy + 30, 18, PAL.ink, LEFT);
    if (s.chest) A.text(ctx, 'Opened today. A new one tomorrow!', P.x0 + 86, cy + 56, 13, PAL.stoneDark, LEFT);
    else if (ready) { A.text(ctx, D.chestAt + ' videos today: open it!', P.x0 + 86, cy + 56, 13, PAL.stoneDark, LEFT); A.pill(ctx, P.x1 - 84, cy + 40, 108, 40, 'OPEN', 19, PAL.cta, PAL.cream, null); }
    else {
      A.text(ctx, 'Opens after ' + D.chestAt + ' videos in a day', P.x0 + 86, cy + 56, 13, PAL.stoneDark, LEFT);
      for (let i = 0; i < D.chestAt; i++) A.circle(ctx, P.x1 - 124 + i * 20, cy + 32, 7, i < n ? PAL.coin : PAL.rgba(PAL.ink, 0.15));
    }
    if (L.linkY > 0) A.text(ctx, 'Prefer no short ads? Remove them', 270, L.linkY, 15, PAL.cta);
  };
  Gifts.tap = function (S, x, y) {
    layout(S);
    if (x < P.x0 || x > P.x1 || y < P.y0 || y > P.y1 || (x > P.x1 - 64 && y < P.y0 + 60)) { G.Cards.close(S); return true; }
    for (let i = 0; i < ROWS.length; i++) {
      const g = ROWS[i], ry = L.ry0 + i * 84;
      if (y < ry || y > ry + 76) continue;
      if (left(g.id) <= 0 && G.Ads.can('rewarded')) claim(S, g); else G.Bus.emit('ui:nope', EV);
      return true;
    }
    if (y >= L.chestY && y <= L.chestY + 80) { if (Gifts.chestReady()) openChest(S); return true; }
    if (L.linkY > 0 && y >= L.linkY - 22 && y <= L.linkY + 22) { G.Cards.showShop(S); return true; }
    return true;
  };

  // ---- the HUD chip, under the 2x KOBAN chip ----
  function chip() { const s0 = G.Canvas.st || 0; CHIP.y0 = s0 + 132; CHIP.y1 = s0 + 162; return CHIP; }
  Gifts.drawChip = function (ctx, S) {
    if (!Gifts.shown(S)) return;
    const A = G.Art.S, r = chip(), cy = (r.y0 + r.y1) / 2;
    A.pill(ctx, (r.x0 + r.x1) / 2, cy, r.x1 - r.x0, 30, '', 15, PAL.cream, PAL.ink, null);
    Gifts.box(ctx, r.x0 + 22, cy + 2, 0.8);
    A.text(ctx, 'GIFTS', r.x0 + 72, cy + 1, 15, PAL.ink);
    if (Gifts.chestReady()) A.circle(ctx, r.x1 - 6, r.y0 + 3, 7, PAL.red);
  };
  Gifts.tapChip = function (S, x, y) {
    if (!Gifts.shown(S)) return false;
    const r = chip(); if (x < r.x0 - 6 || x > r.x1 + 8 || y < r.y0 - 2 || y > r.y1 + 8) return false;
    G.Cards.showGifts(S); return true;
  };

  // ---- little pictures: a gift box, a golden gondola, the chest ----
  Gifts.box = function (ctx, x, y, s) {
    const A = G.Art.S;
    A.fillRRect(ctx, x - 11 * s, y - 3 * s, 22 * s, 14 * s, 3 * s, PAL.red);
    A.fillRRect(ctx, x - 13 * s, y - 9 * s, 26 * s, 7 * s, 3 * s, PAL.cta);
    A.fillRRect(ctx, x - 2 * s, y - 9 * s, 4 * s, 20 * s, 1 * s, PAL.amber);
    A.circle(ctx, x - 4.5 * s, y - 11 * s, 3.5 * s, PAL.amber); A.circle(ctx, x + 4.5 * s, y - 11 * s, 3.5 * s, PAL.amber);
  };
  function carIcon(ctx, x, y, s) {
    const A = G.Art.S;
    A.line(ctx, x - 20 * s, y - 22 * s, x + 20 * s, y - 17 * s, PAL.cable, 2); A.line(ctx, x, y - 20 * s, x, y - 11 * s, PAL.cable, 2);
    A.fillRRect(ctx, x - 15 * s, y - 11 * s, 30 * s, 24 * s, 6 * s, PAL.coin);
    A.fillRRect(ctx, x - 11 * s, y - 7 * s, 22 * s, 8 * s, 3 * s, PAL.skyDay);
    A.fillRRect(ctx, x - 15 * s, y + 8 * s, 30 * s, 5 * s, 2 * s, PAL.coinRim);
  }
  function chestIcon(ctx, x, y, s, open) {
    const A = G.Art.S;
    A.fillRRect(ctx, x - 17 * s, y - 4 * s, 34 * s, 18 * s, 3 * s, PAL.cedarDark);
    A.fillRRect(ctx, x - 17 * s, open ? y - 22 * s : y - 15 * s, 34 * s, open ? 9 * s : 13 * s, 5 * s, PAL.cedar);
    A.fillRRect(ctx, x - 17 * s, y - 5 * s, 34 * s, 4 * s, 1 * s, PAL.coin);
    A.fillRRect(ctx, x - 3.5 * s, y - 8 * s, 7 * s, 9 * s, 2 * s, PAL.coinHi);
  }
})(window.G);
