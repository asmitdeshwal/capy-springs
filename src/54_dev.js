// Capy Springs - developer mode: a cheat panel for testing (coins, lanterns, upgrades, seasons, events, speed, resets) (ARCHITECTURE.md 21).
// On via index.html?dev=1 (persisted in localStorage 'capysprings.dev'; ?dev=0 turns it off) or by tapping the version label in settings 7 times.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL, DATA = G.DATA;
  const Dev = G.Dev = { KEY: 'capysprings.dev', on: false, infinite: false, speed: 1 };
  const INF = 999999999, RECT = { x0: 30, y0: 0, x1: 510, y1: 0 }, BTN = [], CHIP = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const evNone = {};
  let note = '', noteT = 0;

  // store builds (dist/, stamped by tools/pack.js) carry no cheat menu at all: no flag, no secret taps
  Dev.allowed = typeof window !== 'undefined' && window.CAPY_DEV_BUILD !== false;
  function readFlag() {
    let on = false;
    if (!Dev.allowed) return false;
    try { on = localStorage.getItem(Dev.KEY) === '1'; } catch (e) { on = false; }
    try { const m = /[?&]dev=(\d)/.exec(location.search); if (m) { on = m[1] === '1'; localStorage.setItem(Dev.KEY, on ? '1' : '0'); } } catch (e) { /* headless */ }
    return on;
  }
  Dev.on = readFlag();
  Dev.refresh = function () { Dev.on = readFlag(); };          // after Save.store.restore() at boot
  Dev.toggle = function (S) { Dev.on = !Dev.on; G.Save.store.set(Dev.KEY, Dev.on ? '1' : '0'); if (!Dev.on) { Dev.infinite = false; Dev.setSpeed(1); } G.HUD.banner(S, Dev.on ? 'DEV MODE ON' : 'DEV MODE OFF'); };
  Dev.setSpeed = function (v) { Dev.speed = v; G.Loop.timescale = v; };
  function say(S, text) { note = text; noteT = 2.5; G.Bus.emit('ui:pip', evNone); }

  // ---- the actions ----
  const ACTIONS = [
    { label: '+1,000 koban', run: S => { G.Coins.add(S, 1000, 'dev'); } },
    { label: '+100,000 koban', run: S => { G.Coins.add(S, 100000, 'dev'); } },
    { label: () => 'Infinite koban: ' + (Dev.infinite ? 'ON' : 'OFF'), run: S => { Dev.infinite = !Dev.infinite; if (Dev.infinite) G.Coins.add(S, INF - S.coins, 'dev'); } },
    { label: () => 'Speed x' + Dev.speed, run: () => { Dev.setSpeed(Dev.speed >= 4 ? 1 : Dev.speed * 2); } },
    { label: 'Light all lanterns', run: S => { const L = DATA.LANTERNS; for (let i = 0; i < L.length; i++) { const d = L[i]; let n = 0; while (S.lanterns[d.id].level < d.costs.length && n++ < 10) G.Lanterns.light(S, d.id); } say(S, 'every lantern lit'); } },
    { label: 'Max all upgrades', run: S => { for (let i = 0; i < DATA.SHEET_STATIONS.length; i++) { const id = DATA.SHEET_STATIONS[i], t = DATA.UPGRADES[id]; if (!t) continue; for (const k in t) S.levels[id][k] = t[k].max; } S.heat.max = G.Upgrades.heatMax(S); G.Render.markStaticDirty(); G.Player.markSolidsDirty(); say(S, 'every upgrade maxed'); } },
    { label: 'Finish this season', run: S => { const id = G.SEASON.finale; if (S.lanterns[id].level < 1) G.Lanterns.light(S, id); say(S, 'finale lit: season done'); } },
    { label: 'Unlock all seasons', run: S => { const L = G.Seasons.list; for (let i = 0; i < L.length; i++) G.Seasons.unlock(L[i].id, { silent: true }); say(S, 'all seasons unlocked'); } },
    { label: 'Night / Moon now', run: S => { if (!S.night.active) G.Events.startNight(S); else say(S, 'already night'); } },
    { label: 'Golden car next', run: S => { const e = C.GOLDEN_EVERY; S.car.index = Math.ceil((S.car.index + 1) / e) * e - 1; say(S, 'next car is golden'); } },
    { label: 'Test ads on/off', run: S => { const on = !G.Ads.fake; G.Ads.fake = on; G.Save.store.set('capysprings.fakeads', on ? '1' : '0'); say(S, on ? 'test ads ON (web)' : 'test ads off'); } },
    { label: 'Gift lantern now', run: S => { if (!G.Ads.can('rewarded')) { say(S, 'turn test ads on first'); return; } S.offers.giftNext = 0; G.Cards.close(S); } },
    { label: 'Reset gifts & purchase', run: S => { G.Gifts.reset(); G.Shop.reset(); say(S, 'gifts day and Remove ads reset'); } },
    { label: 'Age question', run: S => { G.Cards.close(S); setTimeout(() => G.Cards.showAge(G.Game.S), 350); } },
    { label: 'Kaa now', run: S => { if (!DATA.KAA) { say(S, 'no crow in this season'); return; } if (!G.Kaa.active(S)) { say(S, 'build the ' + DATA.KAA.requires + ' first'); return; } S.kaa.state = 'away'; S.kaa.t = 0; } },
    { label: 'Fill the gauge', run: S => { S.heat.v = S.heat.max; S.heat.graceT = 0; } },
    { label: 'Empty the gauge', run: S => { S.heat.v = 0; S.heat.graceT = 0; } },
    { label: () => 'Debug overlay: ' + (G.S && G.S.ui.debug ? 'ON' : 'OFF'), run: S => { S.ui.debug = !S.ui.debug; } },
    { label: 'Reset this season', run: S => { G.Save.clear(); G.Seasons.resetCurrent(); G.Cards.close(S); G.Game.newGame(); G.Game.S.mode = 'title'; } },
    { label: 'Wipe everything', run: S => { for (const id in G.Seasons.byId) G.Save.store.remove(G.Seasons.byId[id].saveKey); G.Seasons.clearMeta(); if (G.SEASON.id !== 1) { G.Seasons.meta.season = 1; G.Seasons.writeMeta(); try { location.reload(); } catch (e) { /* ignore */ } } else { G.Cards.close(S); G.Game.newGame(); G.Game.S.mode = 'title'; } } }
  ];
  // "Go to season n" buttons come from the registry
  const SEASON_BTNS = [];
  if (G.Seasons.list.length > 1) for (let i = 0; i < G.Seasons.list.length; i++) { const d = G.Seasons.list[i]; SEASON_BTNS.push({ label: 'Go to season ' + d.id, run: S => { if (d.id === G.SEASON.id) { say(S, 'already here'); return; } G.Seasons.unlock(d.id, { silent: true }); G.Seasons.travel(S, d.id); } }); }
  const ALL = ACTIONS.slice(0, 7).concat(G.Seasons.list.length > 1 ? [ACTIONS[7]] : [], SEASON_BTNS, ACTIONS.slice(8));

  Dev.update = function (S, dt) {
    if (noteT > 0) noteT -= dt;
    if (!Dev.on) return;
    if (Dev.infinite && S.coins < INF / 2) { S.earned += INF - S.coins; S.coins = INF; }
  };
  // ---- the panel (a card of kind 'dev'; Cards delegates taps and drawing here) ----
  function layout() {
    const H = G.Canvas.H, st = G.Canvas.st || 0, rows = Math.ceil(ALL.length / 2);
    RECT.y0 = st + Math.max(40, (H - (70 + rows * 50 + 36)) / 2); RECT.y1 = RECT.y0 + 70 + rows * 50 + 36;
    BTN.length = 0;
    for (let i = 0; i < ALL.length; i++) BTN.push({ i, x: 42 + (i & 1) * 232, y: RECT.y0 + 62 + Math.floor(i / 2) * 50, w: 224, h: 44 });
  }
  Dev.tap = function (S, x, y) {
    layout();
    if (x < RECT.x0 || x > RECT.x1 || y < RECT.y0 || y > RECT.y1) { G.Cards.close(S); return true; }
    for (let i = 0; i < BTN.length; i++) { const b = BTN[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { G.Bus.emit('ui:pip', evNone); ALL[b.i].run(S); return true; } }
    return true;
  };
  Dev.draw = function (ctx, S, k) {
    const A = G.Art.S; layout();
    A.fillRRect(ctx, RECT.x0, RECT.y0 + 6, RECT.x1 - RECT.x0, RECT.y1 - RECT.y0, 22, PAL.rgba(PAL.ink, 0.3)); A.fillRRect(ctx, RECT.x0, RECT.y0, RECT.x1 - RECT.x0, RECT.y1 - RECT.y0, 22, PAL.cream);
    A.text(ctx, 'Developer', 270, RECT.y0 + 30, 26, PAL.ink);
    A.text(ctx, 'season ' + G.SEASON.id + ' · t ' + Math.round(S.t) + ' s · ' + S.coins + ' koban · ' + Math.round(G.Seasons.progress(S) * 100) + '% · F2 toggles this panel', 270, RECT.y0 + 52, 11, PAL.stoneDark);
    for (let i = 0; i < BTN.length; i++) {
      const b = BTN[i], a = ALL[b.i], label = typeof a.label === 'function' ? a.label() : a.label, hot = /ON$|x[24]$/.test(label);
      A.fillRRect(ctx, b.x, b.y, b.w, b.h, 12, hot ? PAL.rgba(PAL.cta, 0.18) : PAL.rgba(PAL.ink, 0.07));
      A.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 1, 15, hot ? PAL.cta : PAL.ink);
    }
    A.text(ctx, noteT > 0 ? note : 'tap outside to close', 270, RECT.y1 - 16, 12, noteT > 0 ? PAL.cta : PAL.stoneDark);
  };
  // the DEV chip under the gear while developer mode is on (tap it to open the panel)
  Dev.chipRect = function () { const st = G.Canvas.st || 0; CHIP.x0 = 466; CHIP.y0 = st + 202; CHIP.x1 = 530; CHIP.y1 = st + 230; return CHIP; };   // under the Guestbook chip
  Dev.tapChip = function (S, x, y) { if (!Dev.on) return false; const r = Dev.chipRect(); if (x < r.x0 - 16 || x > 540 || y < r.y0 - 4 || y > r.y1 + 10) return false; G.Cards.showDev(S); return true; };
  Dev.drawChip = function (ctx, S) { if (!Dev.on) return; const r = Dev.chipRect(); G.Art.S.pill(ctx, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, r.x1 - r.x0, r.y1 - r.y0, 'DEV' + (Dev.speed > 1 ? ' x' + Dev.speed : ''), 13, PAL.ink, PAL.amber, null); };
})(window.G);
