// Capy Springs - versioned localStorage save (causes only), migrations, autosave, offline earnings (ARCHITECTURE.md 15, GDD 5.10 / 8.9).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA;
  const Save = G.Save = { KEY: G.Seasons.current.saveKey, VERSION: 2 };     // one save per season; Season 1 keeps the original key
  const OFF = { away: 0, cars: 0, coins: 0, floorCoins: 0, show: false };
  let storageWarned = false;

  // ---- storage: localStorage, mirrored into Capacitor Preferences in the native apps (the OS may clear WebView storage under pressure;
  // Preferences lives in the app's own container and survives). restore() runs once at boot, before the save is read.
  function prefs() { try { const c = window.Capacitor; return (c && c.isNativePlatform && c.isNativePlatform() && c.Plugins && c.Plugins.Preferences) ? c.Plugins.Preferences : null; } catch (e) { return null; } }
  Save.store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { let ok = false; try { localStorage.setItem(k, v); ok = true; } catch (e) { ok = false; } const P = prefs(); if (P) { try { P.set({ key: k, value: v }).catch(() => {}); } catch (e) { /* ignore */ } } return ok; },
    remove: k => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } const P = prefs(); if (P) { try { P.remove({ key: k }).catch(() => {}); } catch (e) { /* ignore */ } } },
    restore: function () {
      const P = prefs(); if (!P) return Promise.resolve(false);
      return P.keys().then(r => Promise.all(((r && r.keys) || []).filter(k => k.indexOf('capysprings') === 0).map(k => {
        let have = null; try { have = localStorage.getItem(k); } catch (e) { have = null; }
        if (have) return null;
        return P.get({ key: k }).then(v => { if (v && v.value) { try { localStorage.setItem(k, v.value); } catch (e) { /* ignore */ } } });
      }))).then(() => true).catch(() => false);
    }
  };

  Save.serialize = function (S) {
    const lanterns = {}; for (const id in S.lanterns) lanterns[id] = { sunk: S.lanterns[id].sunk, level: S.lanterns[id].level };
    const levels = {}; for (const id in S.levels) levels[id] = { speed: S.levels[id].speed, slots: S.levels[id].slots, pay: S.levels[id].pay };
    const baths = {}; for (const id in S.baths) baths[id] = { yuzuT: Math.max(0, S.baths[id].yuzuT) };
    const trees = []; for (let i = 0; i < S.grove.trees.length; i++) trees.push({ progress: S.grove.trees[i].progress, ripe: S.grove.trees[i].ripe });
    return {
      v: Save.VERSION, savedAt: S.savedAt, t: S.t, coins: S.coins, earned: S.earned,
      income: { buckets: S.income.buckets.slice(), head: S.income.head, bucketT: S.income.bucketT },
      car: { index: S.car.index }, lift: { index: S.lift.index },
      lanterns, levels,
      heat: { v: S.heat.v, rushSeen: S.heat.rushSeen },
      kit: { x: S.kit.x, y: S.kit.y },
      baths, grove: { trees }, stall: { stock: S.stall.stock, pending: S.stall.pending },
      night: { next: S.night.next, count: S.night.count },
      tutorial: Object.assign({}, S.tutorial), stats: Object.assign({}, S.stats, { combos: S.stats.combos.slice() }),
      goals: { day: S.goals.day, ids: S.goals.ids.slice(), done: S.goals.done.slice(), base: Object.assign({}, S.goals.base), stamps: S.goals.stamps, allDone: S.goals.allDone },
      settings: Object.assign({}, S.settings),
      floorCoins: G.Coins.totalInTrays(S)
    };
  };
  // mutates a fresh S with the persisted subset and RE-DERIVES built / trailCap / car.level / hires / fame / heat.max
  Save.apply = function (S, obj) {
    if (typeof obj.t === 'number') S.t = obj.t;
    if (typeof obj.coins === 'number') S.coins = Math.max(0, Math.floor(obj.coins));
    if (typeof obj.earned === 'number') S.earned = Math.max(S.coins, Math.floor(obj.earned));
    if (typeof obj.savedAt === 'number') S.savedAt = obj.savedAt;
    if (obj.income && Array.isArray(obj.income.buckets)) { for (let i = 0; i < C.INCOME_BUCKETS; i++) S.income.buckets[i] = Number(obj.income.buckets[i]) || 0; S.income.head = (obj.income.head | 0) % C.INCOME_BUCKETS; S.income.bucketT = Number(obj.income.bucketT) || 0; }
    if (obj.car && typeof obj.car.index === 'number') S.car.index = Math.max(1, obj.car.index | 0);
    if (obj.lift && typeof obj.lift.index === 'number') S.lift.index = Math.max(0, obj.lift.index | 0);
    if (obj.lanterns) for (const id in S.lanterns) if (obj.lanterns[id]) { S.lanterns[id].level = Math.max(0, obj.lanterns[id].level | 0); S.lanterns[id].sunk = Math.max(0, obj.lanterns[id].sunk | 0); }
    if (obj.levels) for (const id in S.levels) if (obj.levels[id]) { S.levels[id].speed = obj.levels[id].speed | 0; S.levels[id].slots = obj.levels[id].slots | 0; S.levels[id].pay = obj.levels[id].pay | 0; }
    if (obj.heat) { if (typeof obj.heat.v === 'number') S.heat.v = obj.heat.v; S.heat.rushSeen = !!obj.heat.rushSeen; }
    if (obj.kit && typeof obj.kit.x === 'number') { S.kit.x = U.clamp(obj.kit.x, DATA.MAP.BOUNDS.x0, DATA.MAP.BOUNDS.x1); S.kit.y = U.clamp(obj.kit.y, (DATA.MAP.RIDGE ? DATA.MAP.RIDGE.boundsY0 : DATA.MAP.BOUNDS.y0), DATA.MAP.BOUNDS.y1); }
    if (obj.baths) for (const id in S.baths) if (obj.baths[id]) S.baths[id].yuzuT = Math.max(0, Number(obj.baths[id].yuzuT) || 0);
    if (obj.grove && Array.isArray(obj.grove.trees)) for (let i = 0; i < S.grove.trees.length && i < obj.grove.trees.length; i++) { const t = obj.grove.trees[i]; S.grove.trees[i].progress = U.clamp(Number(t.progress) || 0, 0, 1); S.grove.trees[i].ripe = !!t.ripe; }
    if (obj.stall) { S.stall.stock = Math.max(0, obj.stall.stock | 0); S.stall.pending = Math.max(0, obj.stall.pending | 0); }
    if (obj.night) { if (typeof obj.night.next === 'number') S.night.next = obj.night.next; S.night.count = obj.night.count | 0; }
    if (obj.tutorial) for (const k in S.tutorial) if (typeof obj.tutorial[k] === 'number') S.tutorial[k] = obj.tutorial[k];
    if (obj.stats) { for (const k in S.stats) { if (k === 'combos') { if (Array.isArray(obj.stats.combos)) for (let i = 0; i < 6; i++) S.stats.combos[i] = obj.stats.combos[i] | 0; } else if (typeof obj.stats[k] === 'number') S.stats[k] = obj.stats[k]; } }
    if (obj.settings) for (const k in S.settings) if (obj.settings[k] !== undefined) S.settings[k] = obj.settings[k];
    if (obj.goals && typeof obj.goals === 'object') { const g = obj.goals; S.goals.day = g.day | 0; S.goals.ids = Array.isArray(g.ids) ? g.ids.slice(0, 3).map(String) : []; S.goals.done = [!!(g.done && g.done[0]), !!(g.done && g.done[1]), !!(g.done && g.done[2])]; S.goals.base = (g.base && typeof g.base === 'object') ? Object.assign({}, g.base) : {}; S.goals.stamps = Math.max(0, g.stamps | 0); S.goals.allDone = !!g.allDone; }
    // re-derive
    const L = DATA.LANTERNS, SILENT = { silent: true };
    for (let i = 0; i < L.length; i++) { const d = L[i], lv = S.lanterns[d.id]; for (let l = 1; l <= lv.level && l <= d.costs.length; l++) G.Lanterns.applyEffect(S, d, l, SILENT); }
    for (const id in S.levels) for (const key in S.levels[id]) S.levels[id][key] = U.clamp(S.levels[id][key], 0, G.Upgrades.max(id, key));
    for (let i = 0; i < L.length; i++) { const d = L[i], lv = S.lanterns[d.id]; if (lv.level >= d.costs.length) { lv.level = d.costs.length; lv.sunk = 0; } else lv.sunk = U.clamp(lv.sunk, 0, d.costs[lv.level] - 1); }
    S.heat.max = G.Upgrades.heatMax(S); S.heat.v = U.clamp(S.heat.v, 0, S.heat.max);
    if (S.stall.stock > G.Upgrades.counter(S)) S.stall.stock = G.Upgrades.counter(S);
    if (G.Seasons.finaleLit(S)) G.Seasons.markDone(S);
    if (G.Ridge) S.kit.y = Math.max(S.kit.y, G.Ridge.boundsY0(S) + C.KIT_RADIUS);     // a Kit saved on a Ridge that is not open (should not happen) comes down
    // runtime after a load: empty platform and trail, the car slides in after CAR_RESUME_T
    const c = S.car; c.phase = 'away'; c.timer = C.CAR_RESUME_T; c.phaseT = 0; c.warned = false; c.toSpawn = 0; c.x = DATA.MAP.CABLE.enterX; c.golden = false; c.empty = false; c.vip = false;
    S.mode = 'play'; S.introT = C.INTRO_T;
    return S;
  };
  const MIGRATIONS = {
    1: obj => { delete obj.built; delete obj.trailCap; delete obj.famous; delete obj.helpers; if (obj.heat) delete obj.heat.max; obj.tutorial = obj.tutorial || {}; if (obj.tutorial.DRAG === undefined) obj.tutorial.DRAG = 0; obj.settings = obj.settings || {}; if (obj.settings.shakeFlash === undefined) obj.settings.shakeFlash = true; obj.stats = obj.stats || {}; if (obj.stats.chains === undefined) obj.stats.chains = 0; obj.v = 2; return obj; }
  };
  Save.read = function () {
    try {
      const raw = localStorage.getItem(Save.KEY); if (!raw) return null;
      let obj = JSON.parse(raw);
      if (!obj || typeof obj.v !== 'number' || typeof obj.lanterns !== 'object' || typeof obj.levels !== 'object') return null;
      while (obj.v < Save.VERSION) { const m = MIGRATIONS[obj.v]; if (!m) return null; obj = m(obj); }
      if (obj.v > Save.VERSION) obj.v = Save.VERSION;     // a save from a newer build (a downgrade, a stale cache): apply() only reads known fields, so keep it rather than wipe it
      return obj;
    } catch (e) { try { Save.clear(); } catch (e2) { /* ignore */ } return null; }
  };
  Save.write = function (S) {
    // do not advance the stamp while an uncollected offline card is up: a lock / kill before COLLECT must not lose the earnings
    const pending = (S.ui && S.ui.card && S.ui.card.kind === 'offline' && !(S.ui.card.closing > 0)) || !!(G.Title && G.Title.pending && G.Title.pending.show);   // ...or still waiting behind the title's PLAY
    if (!pending) S.savedAt = Date.now();
    G.Seasons.recordProgress(S);
    let raw = null; try { raw = JSON.stringify(Save.serialize(S)); } catch (e) { raw = null; }
    if (raw && Save.store.set(Save.KEY, raw)) return true;
    if (!storageWarned) { storageWarned = true; U.warnOnce('save', 'save write failed'); if (G.HUD && G.HUD.banner && !G.Game.headless) G.HUD.banner(S, 'SAVE FAILED'); }   // once: private mode, storage full
    return false;
  };
  Save.clear = function () { Save.store.remove(Save.KEY); };
  Save.tick = function (S, dt) { S.saveT += dt; if (S.saveT >= C.SAVE_EVERY) { S.saveT = 0; Save.write(S); } };
  Save.rate = function (income) { return Math.min(C.RATE_CAP_PER_S, U.median(income.buckets) / C.INCOME_BUCKET); };
  function offlineCalc(income, lanterns, savedAt, nowMs, floorCoins) {
    const away = U.clamp((nowMs - savedAt) / 1000, 0, C.OFFLINE_CAP);
    const rate = Save.rate(income);
    const mult = C.OFFLINE_BASE + (lanterns.pon && lanterns.pon.level >= 1 ? C.OFFLINE_PON : 0) + (lanterns.kero && lanterns.kero.level >= 1 ? C.OFFLINE_KERO : 0);
    OFF.away = away; OFF.coins = Math.floor(rate * mult * away); OFF.cars = Math.floor(away / C.CAR_PERIOD_BY_LEVEL[C.CAR_PERIOD_BY_LEVEL.length - 1]);
    OFF.floorCoins = floorCoins || 0; OFF.show = away >= C.OFFLINE_MIN && (OFF.coins + OFF.floorCoins) > 0;
    return OFF;
  }
  Save.offline = function (obj, nowMs) { return offlineCalc(obj.income || { buckets: [0, 0, 0, 0, 0, 0] }, obj.lanterns || {}, obj.savedAt || nowMs, nowMs, obj.floorCoins || 0); };
  Save.offlineLive = function (S, nowMs) { return offlineCalc(S.income, S.lanterns, S.savedAt || nowMs, nowMs, 0); };
})(window.G);
