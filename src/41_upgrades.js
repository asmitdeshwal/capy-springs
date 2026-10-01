// Capy Springs - upgrade levels, costs and every derived upgradable number (ARCHITECTURE.md 9.9, GDD 8.3 / 8.4).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA;
  const Upgrades = G.Upgrades = {};
  const KEYS = ['speed', 'slots', 'pay'];
  const best = { id: null, key: null, cost: 0 };     // reused result object (never allocate per call)
  const evUpgrade = { id: null, key: null, level: 0 };

  function round5(v) { return Math.round(v / C.UPG_ROUND) * C.UPG_ROUND; }
  function lvl(S, id) { return S.levels[id]; }

  Upgrades.level = (S, id, key) => S.levels[id] ? S.levels[id][key] : 0;
  Upgrades.max = (id, key) => DATA.UPGRADES[id] ? DATA.UPGRADES[id][key].max : 0;
  Upgrades.visible = function (S, id, key) {
    const t = DATA.UPGRADES[id] && DATA.UPGRADES[id][key];
    if (!t) return false;
    if (t.requires === 'pon') return !!S.helpers.pon.hired;
    return true;
  };
  Upgrades.cost = function (S, id, key) {
    const t = DATA.UPGRADES[id] && DATA.UPGRADES[id][key]; if (!t) return null;
    const l = Upgrades.level(S, id, key);
    if (l >= t.max) return null;
    return round5(t.base * Math.pow(C.UPG_GROWTH, l));
  };
  Upgrades.canBuy = function (S, id, key) {
    if (!S.built[id] || !Upgrades.visible(S, id, key)) return false;
    const c = Upgrades.cost(S, id, key);
    return c !== null && S.coins >= c;
  };
  Upgrades.buy = function (S, id, key) {
    if (!Upgrades.canBuy(S, id, key)) return false;
    const c = Upgrades.cost(S, id, key);
    if (!G.Coins.spend(S, c, 'upgrade')) return false;
    S.levels[id][key]++;
    if (id === 'boiler' && key === 'slots') S.heat.max = Upgrades.heatMax(S);
    evUpgrade.id = id; evUpgrade.key = key; evUpgrade.level = S.levels[id][key];
    G.Bus.emit('upgrade', evUpgrade);
    return true;
  };
  function cheapest(S, affordableOnly) {
    let bestCost = Infinity; best.id = null; best.key = null; best.cost = 0;
    for (let i = 0; i < DATA.SHEET_STATIONS.length; i++) {
      const id = DATA.SHEET_STATIONS[i];
      if (!S.built[id]) continue;
      for (let k = 0; k < 3; k++) {
        const key = KEYS[k];
        if (!Upgrades.visible(S, id, key)) continue;
        const c = Upgrades.cost(S, id, key);
        if (c === null) continue;
        if (affordableOnly && S.coins < c) continue;
        if (c < bestCost) { bestCost = c; best.id = id; best.key = key; best.cost = c; }
      }
    }
    return best.id ? best : null;
  }
  Upgrades.cheapestAffordable = S => cheapest(S, true);
  Upgrades.cheapestAny = S => cheapest(S, false);

  // derived values - the single source of truth for every upgradable number
  Upgrades.soak = function (S, bathId) { const b = S.baths[bathId]; return b.def.soak - C.SOAK_STEP * lvl(S, bathId).speed; };
  Upgrades.slots = function (S, bathId) { const b = S.baths[bathId]; return b.def.slots + lvl(S, bathId).slots; };
  Upgrades.payMult = (S, bathId) => 1 + C.PAY_STEP * lvl(S, bathId).pay;
  Upgrades.stoke = S => C.LOG_HEAT + C.STOKE_STEP * lvl(S, 'boiler').speed;
  Upgrades.heatMax = S => C.HEAT_MAX + C.TANK_STEP * lvl(S, 'boiler').slots;
  Upgrades.ponSpeed = S => C.PON_SPEED * (1 + C.PON_SPEED_STEP * lvl(S, 'boiler').pay);
  Upgrades.ponRest = S => C.PON_REST - C.PON_REST_STEP * lvl(S, 'boiler').pay;
  Upgrades.regrow = S => C.REGROW - C.REGROW_STEP * lvl(S, 'grove').speed;
  Upgrades.treeCount = S => C.TREES_BASE + lvl(S, 'grove').slots;
  Upgrades.yuzuDur = S => C.YUZU_DUR + C.YUZU_DUR_STEP * lvl(S, 'grove').pay;
  Upgrades.prep = S => C.PREP - C.PREP_STEP * lvl(S, 'stall').speed;
  Upgrades.counter = S => C.COUNTER_BASE + lvl(S, 'stall').slots;
  Upgrades.mochiPay = S => C.MOCHI_PAY * (1 + C.PAY_STEP * lvl(S, 'stall').pay);
  Upgrades.famousMult = S => { const L = S.lanterns[G.SEASON.finale]; return C.FAMOUS_PAY[Math.min(L ? L.level : 0, C.FAMOUS_PAY.length - 1)]; };
  Upgrades.starMult = S => 1 + C.STAR_PAY * G.Seasons.stars();        // fame from OTHER finished seasons (GDD 17.4)

  // 'Soak 8.0 s -> 7.5 s' style text (allocates a string; UI only)
  Upgrades.effectText = function (S, id, key) {
    const t = DATA.UPGRADES[id][key], l = Upgrades.level(S, id, key), n = Math.min(l + 1, t.max);
    const cur = Upgrades.valueAt(S, id, key, l), nxt = Upgrades.valueAt(S, id, key, n);
    return t.label + ' ' + cur + (l >= t.max ? '' : ' → ' + nxt);
  };
  // the concrete number a track gives at level l, in the words a player uses ("7 koban", "5 seats", "7.5 s")
  Upgrades.valueAt = function (S, id, key, l) {
    const b = S.baths[id];
    if (b) {
      if (key === 'speed') return U.fmt1(b.def.soak - C.SOAK_STEP * l) + ' s';
      if (key === 'slots') return (b.def.slots + l) + ' seats';
      return Math.round(DATA.GUESTS.capy.pay * (b.def.payMult || 1) * (1 + C.PAY_STEP * l)) + ' koban each';
    }
    if (id === 'boiler') { if (key === 'speed') return '+' + (C.LOG_HEAT + C.STOKE_STEP * l) + ' ' + G.Seasons.text('gaugeUnit', 'heat'); if (key === 'slots') return (C.HEAT_MAX + C.TANK_STEP * l) + ' max'; return '+' + Math.round(C.PON_SPEED_STEP * l * 100) + '% speed'; }
    if (id === 'grove') { if (key === 'speed') return U.fmt1(C.REGROW - C.REGROW_STEP * l) + ' s'; if (key === 'slots') return (C.TREES_BASE + l) + ' trees'; return U.fmt1(C.YUZU_DUR + C.YUZU_DUR_STEP * l) + ' s'; }
    if (id === 'stall') { if (key === 'speed') return U.fmt1(C.PREP - C.PREP_STEP * l) + ' s'; if (key === 'slots') return (C.COUNTER_BASE + l) + ' ready'; return Math.round(C.MOCHI_PAY * (1 + C.PAY_STEP * l)) + ' koban'; }
    return '';
  };
})(window.G);
