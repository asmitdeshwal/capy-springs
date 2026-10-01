// Capy Springs - state factory, entity factories, pools (ARCHITECTURE.md 6).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, MAP = DATA.MAP;
  const State = G.State = {};

  function steamItem() { return { x: 0, y: 0, r: 10, t: 0, life: 1, drift: 0, alpha: 0.45 }; }
  function rippleItem() { return { x: 0, y: 0, t: 0, life: 1.4, r0: 10, r1: 36, gold: false }; }
  function partItem() { return { kind: 'dust', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, life: 1, size: 3, color: null, rot: 0, x1: 0, y1: 0, seed: 0 }; }
  function popItem() { return { text: '', x: 0, y: 0, t: 0, dur: 0.7, size: 20, color: null, kind: 'plus', rise: 40, chain: null }; }
  function coinItem() { return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, value: 1, state: 'air', trayId: null, t: 0, sx: 1, sy: 1, x0: 0, y0: 0, source: null, sortY: 0, draw: null }; }

  function guestFactory() {
    return { id: 0, kind: 'capy', x: 0, y: 0, face: 1, state: 'gone', carId: 0, golden: false,
      patience: 0, patienceMax: 0, want: null, bathId: null, slot: -1, soakT: 0, soakMax: 0, batch: null, yuzuHat: false,
      area: 'platform', millRect: null, plungeT: 0, hotCold: false,     // the Ridge: where this guest waits, the hot-cold window since the sauna
      node: null, sx: 1, sy: 1, squashT: 0, bobPhase: 0, hop: null, route: null, routeI: 0, nextState: null, walk: 110,
      millT: 0, waveT: 0, heartT: 0, sleepy: 0, shiver: false, queueSpot: -1, queueT: 0, paid: 0, sortY: 0, draw: null, alpha: 1, tutorial: false,
      hopObj: { x0: 0, y0: 0, x1: 0, y1: 0, t: 0, dur: 0.25, h: 18 }, routeArr: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], routeN: 0, mx: 0, my: 0, moving: false, coldOnce: false };
  }

  State.bathRuntime = function (def) {
    const slots = new Array(def.maxSlots); for (let i = 0; i < def.maxSlots; i++) slots[i] = null;
    return { id: def.id, def, slots, yuzuT: 0, warm: true, occupied: false, rippleT: 0, steamT: 0, lastPlop: -99, coldOnce: false, refusedOnce: false,
             sortY: def.deck.y + def.deck.h / 2, draw: null };
  };

  State.create = function () {
    const lanterns = {}; for (let i = 0; i < DATA.LANTERNS.length; i++) lanterns[DATA.LANTERNS[i].id] = { sunk: 0, level: 0 };
    const levels = {}; for (let i = 0; i < DATA.SHEET_STATIONS.length; i++) levels[DATA.SHEET_STATIONS[i]] = { speed: 0, slots: 0, pay: 0 };
    const baths = {}, trays = {};
    for (let i = 0; i < DATA.BATHS.length; i++) {
      const d = DATA.BATHS[i]; baths[d.id] = State.bathRuntime(d);
      trays[d.id] = { id: d.id, x: d.tray.x, y: d.tray.y, value: 0, bounce: 0 };
    }
    trays.stall = { id: 'stall', x: DATA.STATIONS.stall.tray.x, y: DATA.STATIONS.stall.tray.y, value: 0, bounce: 0 };
    const trees = [];
    for (let i = 0; i < DATA.STATIONS.grove.slots.length; i++) { const s = DATA.STATIONS.grove.slots[i]; trees.push({ x: s[0], y: s[1], progress: 0, ripe: false, pulse: 0 }); }
    const cap = C.TRAIL_PATH_CAP;
    const ph = DATA.HELPERS.pon.home, kh = DATA.HELPERS.kero.home;
    // built is DERIVED from lanterns (Save.apply re-runs the effects); the station ids are the engine's fixed roles, the baths come from the pack
    const built = { boiler: false, woodpile: false, grove: false, stall: false, bridge: false, ridge: false };
    for (let i = 0; i < DATA.BATHS.length; i++) built[DATA.BATHS[i].id] = !!DATA.BATHS[i].prebuilt;
    const S = {
      v: 2, season: G.SEASON.id, mode: 'intro', prevMode: 'play', introT: 0, t: 0, coins: 0, earned: 0,
      income: { buckets: [0, 0, 0, 0, 0, 0], head: 0, bucketT: 0 },
      car: { level: 0, index: 1, timer: 0, phase: 'dock', phaseT: 0, x: MAP.CABLE.dockX, swing: 0, kind: 'capy', golden: false, empty: false, vip: false,
             toSpawn: DATA.CAR.levels[0].capys, n: DATA.CAR.levels[0].capys, spawnT: C.CAR_FIRST_HOP_AT, carId: 1, warned: true, pulse: 0 },
      carLog: {},
      splash: { count: 0, t: -99, mult: 1, bathId: null, c3: false, c4: false, c5: false },
      lanterns, lanternFx: {},
      built,
      unwrapping: {}, levels, trailCap: C.TRAIL_CAPS[0],
      heat: { v: C.HEAT_START, max: C.HEAT_MAX, graceT: 0, rush: false, rushT: 0, chain: 0, cold: false, occupied: false, stokeT: -99, pickT: -99, rushSeen: false },
      kit: { x: MAP.KIT_START.x, y: MAP.KIT_START.y, vx: 0, vy: 0, face: 1, dir: 'down', moving: false, sx: 1, sy: 1, squashT: 0,
             pose: null, poseT: 0, poseDur: 0, dustT: 0, idleT: 0, stoppedT: 0, nudgeT: 0, fdx: 0, fdy: -1, walk: 0,
             path: { xs: new Float32Array(cap), ys: new Float32Array(cap), seg: new Float32Array(cap), head: 0, n: 0, cap } },
      trail: [], trailMeta: { joinT: -99, compress: 1 },
      guests: [], guestFree: [], nextId: 1,
      baths, trays,
      grove: { trees },
      stall: { stock: 0, prepT: 0, pending: 0, queue: [null, null, null, null], serveT: 0 },
      coinPool: U.pool(C.COIN_POOL, coinItem),
      helpers: { pon:  { hired: false, x: ph.x, y: ph.y, face: 1, state: 'rest', t: 0, hasLog: false, sx: 1, sy: 1, squashT: 0, yawn: 0, walk: 0, moving: false },
                 kero: { hired: false, x: kh.x, y: kh.y, face: 1, state: 'wait', t: 0, hasYuzu: false, hop: null, tx: 0, ty: 0, sx: 1, sy: 1, squashT: 0, tree: null,
                         hopObj: { x0: 0, y0: 0, x1: 0, y1: 0, t: 0, dur: C.KERO_HOP_T, h: C.KERO_HOP_H }, z: 0 } },
      night: { active: false, t: 0, next: C.NIGHT_FIRST, fade: 0, count: 0, lit: {} },
      // season mechanics (GDD 17.3): the Pounding Lap around the burner and Kaa the crow; both idle unless the pack defines DATA.LAP / DATA.KAA
      lap: { i: 0, t: 0, armed: false, glow: [0, 0, 0], laps: 0 },
      kaa: { state: 'away', t: DATA.KAA ? DATA.KAA.every : 0, x: 0, y: 0, trayId: null, timer: 0, leaveT: 0, won: 0 },
      tutorial: { LEAD: 0, SOAK: 0, COLLECT: 0, LIGHT: 0, STOKE: 0, YUZU: 0, TAP: 0, DRAG: 0, LAP: 0, PLUNGE: 0 },
      stats: { served: 0, ducks: 0, combos: [0, 0, 0, 0, 0, 0], rushes: 0, chains: 0, fullCars: 0, nights: 0, golden: 0, mochi: 0, lost: 0, vip: 0, laps: 0, kaa: 0, plunges: 0, hotCold: 0 },
      settings: { sound: true, haptics: null, shakeFlash: true, lowFx: false },
      fx: { steam: U.pool(C.STEAM_CAP, steamItem), ripples: U.pool(C.RIPPLE_CAP, rippleItem), parts: U.pool(C.PARTICLE_CAP, partItem), pops: U.pool(C.POP_CAP, popItem), flash: 0, wash: 0 },
      ui: { sheet: null, card: null, settings: false, banner: null, pill: null, pillT: 0, arrow: null, lastRule: 0, arrowFlash: null,
            coinBounce: 0, coinShown: 0, kettleSlide: 0, ribbon: 0, squash: {}, chevron: null, dragHint: false, debug: false, arrowObj: { rule: 0, kind: null, id: null, x: 0, y: 0, word: null, dim: false, showWord: false, idle: false, ref: null, hide: false } },
      perf: { frameMs: 16, stepMs: 0, slowT: 0 },
      savedAt: 0, saveT: 0
    };
    for (const id in S.levels) S.ui.squash[id] = 0;
    return S;
  };

  State.newGuest = function (S, kind, carId) {
    if (S.guests.length >= C.MAX_GUESTS) return null;
    const g = S.guestFree.length ? S.guestFree.pop() : guestFactory();
    const d = DATA.GUESTS[kind];
    g.id = S.nextId++; g.kind = kind; g.carId = carId; g.state = 'arrive'; g.golden = false; g.face = 1;
    g.patience = d.patienceWait; g.patienceMax = d.patienceWait; g.want = 'bath'; g.bathId = null; g.slot = -1; g.soakT = 0; g.soakMax = 0; g.batch = null; g.yuzuHat = false;
    g.node = null; g.sx = 1; g.sy = 1; g.squashT = 0; g.bobPhase = U.rand() * 6.28; g.hop = null; g.route = null; g.routeI = 0; g.routeN = 0; g.nextState = null; g.walk = d.walk;
    g.millT = 0; g.waveT = 0; g.heartT = 0; g.sleepy = 0; g.shiver = false; g.queueSpot = -1; g.queueT = 0; g.paid = 0; g.sortY = 0; g.alpha = 1; g.tutorial = false; g.moving = false; g.coldOnce = false;
    g.area = 'platform'; g.millRect = null; g.plungeT = 0; g.hotCold = false;
    g.draw = G.Guests.draw;
    S.guests.push(g);
    return g;
  };
  State.freeGuest = function (S, g) {
    const i = S.guests.indexOf(g);
    if (i >= 0) S.guests.splice(i, 1);
    g.state = 'gone'; g.node = null; g.batch = null; g.hop = null; g.route = null;
    S.guestFree.push(g);
  };
  State.newCoin = function (S) { const c = S.coinPool.alloc(); if (c) { c.t = 0; c.z = 0; c.sx = c.sy = 1; c.draw = G.Coins.draw; } return c; };
  State.freeCoin = function (S, c) { const i = S.coinPool.items.indexOf(c); if (i >= 0 && i < S.coinPool.n) S.coinPool.free(i); };

  // clears guests, trail, koban, trays and helpers' transient fields (used on load)
  State.resetRuntime = function (S) {
    while (S.guests.length) State.freeGuest(S, S.guests[S.guests.length - 1]);
    S.trail.length = 0; S.trailMeta.joinT = -99; S.trailMeta.compress = 1;
    S.coinPool.clear();
    for (const id in S.trays) { S.trays[id].value = 0; S.trays[id].bounce = 0; }
    for (const id in S.baths) { const b = S.baths[id]; for (let i = 0; i < b.slots.length; i++) b.slots[i] = null; b.occupied = false; b.lastPlop = -99; b.refusedOnce = false; }
    S.splash.count = 0; S.splash.t = -99; S.splash.mult = 1; S.splash.bathId = null;
    S.carLog = {};
    for (const k in S.unwrapping) delete S.unwrapping[k];
    for (const k in S.lanternFx) { const f = S.lanternFx[k]; f.standT = 0; f.acc = 0; f.check = 0; f.flash = 0; f.short = 0; f.wiggle = 0; f.rearm = 0; }
    S.stall.queue[0] = S.stall.queue[1] = S.stall.queue[2] = S.stall.queue[3] = null;
    const p = S.helpers.pon, k = S.helpers.kero;
    p.x = DATA.HELPERS.pon.home.x; p.y = DATA.HELPERS.pon.home.y; p.state = 'rest'; p.t = 0; p.hasLog = false; p.yawn = 0;
    k.x = DATA.HELPERS.kero.home.x; k.y = DATA.HELPERS.kero.home.y; k.state = 'wait'; k.t = 0; k.hasYuzu = false; k.hop = null; k.tree = null; k.z = 0;
    S.fx.steam.clear(); S.fx.ripples.clear(); S.fx.parts.clear(); S.fx.pops.clear(); S.fx.flash = 0; S.fx.wash = 0;
    S.kit.path.n = 0; S.kit.path.head = 0; S.kit.vx = S.kit.vy = 0; S.kit.moving = false; S.kit.nudgeT = 0;
    S.night.active = false; S.night.t = 0; S.night.fade = 0; S.night.lit = {};
    S.heat.rush = false; S.heat.rushT = 0; S.heat.chain = 0;
    S.lap.i = 0; S.lap.t = 0; S.lap.armed = false; S.lap.glow[0] = S.lap.glow[1] = S.lap.glow[2] = 0;
    S.kaa.state = 'away'; S.kaa.t = DATA.KAA ? DATA.KAA.every : 0; S.kaa.trayId = null; S.car.vip = false;
    S.ui.sheet = null; S.ui.card = null; S.ui.settings = false; S.ui.banner = null; S.ui.arrow = null; S.ui.lastRule = 0; S.ui.arrowFlash = null; S.ui.chevron = null;
  };
})(window.G);
