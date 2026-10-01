#!/usr/bin/env node
// Capy Springs - headless simulation harness: loader, bot, invariants, assertions, fuzz, CSV / beats (ARCHITECTURE.md 17).
// node test/headless.js [--seconds 1800] [--seed 7] [--season 1] [--fuzz 300] [--csv out.csv] [--beats] [--quiet] [--no-assert]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const argv = process.argv.slice(2), opt = { seconds: 1800, seed: 7, season: 1, fuzz: 0, csv: null, beats: false, quiet: false, assert: true };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--seconds') opt.seconds = Number(argv[++i]); else if (a === '--seed') opt.seed = Number(argv[++i]); else if (a === '--fuzz') opt.fuzz = Number(argv[++i]);
  else if (a === '--season') opt.season = Number(argv[++i]);
  else if (a === '--csv') opt.csv = argv[++i]; else if (a === '--beats') opt.beats = true; else if (a === '--quiet') opt.quiet = true; else if (a === '--no-assert') opt.assert = false;
}
const log = (...a) => { if (!opt.quiet) console.log(...a); };
const fails = [], warns = [];
function fail(msg) { fails.push(msg); console.error('FAIL ' + msg); }
function finish() {
  if (fails.length) { console.error('\n' + fails.length + ' failure(s). First: ' + fails[0]); process.exit(1); }
  log('\nPASS'); process.exit(0);
}
process.on('uncaughtException', e => { fail('uncaught: ' + (e && e.stack)); finish(); });

// ---- load ----
const stubs = require('./stubs.js'); stubs.install();
globalThis.G = { HEADLESS: true, SEASON_ID: opt.season };
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const srcs = Array.from(html.matchAll(/'(src\/[^']+\.js)'/g)).map(m => m[1]);     // the CAPY_FILES list in index.html, in order
for (const s of srcs) { const code = fs.readFileSync(path.join(root, s), 'utf8'); try { vm.runInThisContext(code, { filename: s }); } catch (e) { fail('load ' + s + ': ' + (e && e.stack)); finish(); } }
const G = globalThis.G, C = G.C, U = G.U, DATA = G.DATA, MAP = DATA.MAP;
U.seed(opt.seed);
G.Input.headless = true;
let S = G.Game.boot({ headless: true });
S.mode = 'play'; S.introT = C.INTRO_T;
const bot = require('./bot.js')(G);
const ctx = stubs.stubCtx();
const DT = 1 / 60, total = opt.fuzz > 0 ? opt.fuzz : opt.seconds, fuzz = opt.fuzz > 0;
const rnd = (a, b) => a + Math.random() * (b - a);
let simT = 0, nextInv = 1, nextRender = 10, nextMinute = 60, tallH = false;
const csvRows = ['minute,coins,earned,ratePerMin,lanternsLit,upgradesBought,guestsServed,guestsLost,combos3,combos4,combos5,rushes,chains,fullCars,nights,trailCap,carLevel,heat'];
const beats = { lantern: {}, x3: null, x4: null, x5: null, rush: null, chain: null, night: null, fullcar: null, golden: null };
const enterT = new Map();
let car2DockT = null;

// ---- fuzz state ----
const fz = { nextInput: 0, nextTap: 0, nextBuy: 7, nextVis: 30, nextSheet: rnd(5, 20), parkUntil: 0, parkHeat: 0, parkStart: -1, parkLogs: 0 };
function fuzzInput() {
  const In = G.Input;
  if (simT >= fz.nextInput) {
    fz.nextInput = simT + rnd(0.5, 2);
    if (Math.random() < 0.2) { In.vec.x = 0; In.vec.y = 0; In.mag = 0; if (Math.random() < 0.3) { fz.nextInput = simT + 10; fz.parkStart = simT; fz.parkHeat = S.heat.v; fz.parkLogs = G.Trail.count(S, 'log'); } }
    else { const a = Math.random() * Math.PI * 2, m = rnd(0.3, 1); In.vec.x = Math.cos(a) * m; In.vec.y = Math.sin(a) * m; In.mag = m; fz.parkStart = -1; }
  }
  if (simT >= fz.nextTap) { fz.nextTap = simT + 3; if (Math.random() < 0.5 && In.taps.length < 8) In.taps.push({ x: rnd(0, 540), y: rnd(0, G.Canvas.H), zone: Math.random() < 0.5 ? 'joy' : null }); }
  if (simT >= fz.nextBuy) { fz.nextBuy = simT + 7; const ids = DATA.SHEET_STATIONS, keys = ['speed', 'slots', 'pay']; G.Upgrades.buy(S, ids[Math.floor(Math.random() * ids.length)], keys[Math.floor(Math.random() * 3)]); }
  if (simT >= fz.nextSheet) { fz.nextSheet = simT + rnd(5, 20); if (S.ui.sheet) G.Sheet.close(S); else { const built = DATA.SHEET_STATIONS.filter(id => S.built[id]); if (built.length && S.mode === 'play') G.Sheet.open(S, built[Math.floor(Math.random() * built.length)]); } }
  if (simT >= fz.nextVis) {
    fz.nextVis = simT + 30;
    const before = S.income.buckets.reduce((a, b) => a + b, 0);
    S.prevMode = S.mode; S.mode = 'paused'; G.Save.write(S);
    S.savedAt -= Math.floor(Math.random() * 6 * 3600 * 1000);
    G.Game.resume(S, Date.now());
    const after = S.income.buckets.reduce((a, b) => a + b, 0);
    if (after !== before) fail('live return changed the income buckets (' + before + ' -> ' + after + ') at t=' + simT.toFixed(1));
    if (S.mode === 'paused') fail('still paused after resume at t=' + simT.toFixed(1));
    if (S.ui.card) { G.Cards.tap(S, 270, (G.Canvas.H / 2) + 108); }   // press COLLECT
  }
}

// ---- invariants (ARCH 17.4) ----
function invariants() {
  const t = simT.toFixed(1), k = S.kit;
  if (!isFinite(k.x) || !isFinite(k.y) || k.x < 0 || k.x > MAP.W || k.y < 0 || k.y > MAP.H) fail('Kit out of world at ' + t + ': ' + k.x + ',' + k.y);
  for (const g of S.guests) if (!isFinite(g.x) || !isFinite(g.y) || g.x < -80 || g.x > MAP.W + 80 || g.y < 0 || g.y > MAP.H) { fail('guest ' + g.id + ' (' + g.state + ') out of world at ' + t + ': ' + g.x + ',' + g.y); break; }
  if (S.coins < 0) fail('coins < 0 at ' + t); if (S.earned < S.coins) fail('earned < coins at ' + t);
  if (!(S.heat.v >= 0 && S.heat.v <= S.heat.max)) fail('heat out of range at ' + t + ': ' + S.heat.v + '/' + S.heat.max);
  const cam = G.Camera; if (cam.y < G.Camera.minY(S) - 0.01 || cam.y + G.Canvas.H > MAP.H + 0.01) fail('camera out of clamp at ' + t + ': y=' + cam.y + ' H=' + G.Canvas.H);
  if (S.trail.length > S.trailCap) fail('trail over cap at ' + t);
  let trailGuests = 0;
  for (const n of S.trail) { if (n.kind === 'guest') { trailGuests++; if (!n.ref || n.ref.state !== 'trail' || n.ref.node !== n) fail('trail node/guest mismatch at ' + t); } }
  let gTrail = 0; for (const g of S.guests) { if (g.state === 'trail') { gTrail++; if (!g.node) fail('trail guest without node at ' + t); } else if (g.node) fail('non-trail guest ' + g.state + ' has a node at ' + t); }
  if (gTrail !== trailGuests) fail('trail guest count mismatch at ' + t + ': ' + gTrail + ' vs ' + trailGuests);
  // trail clog
  const seen = new Set();
  for (const n of S.trail) { seen.add(n); if (!enterT.has(n)) enterT.set(n, { t: simT, fullT: 0 }); const e = enterT.get(n); if (n.kind === 'log') { if (S.heat.v >= S.heat.max) e.fullT += 1; else e.fullT = 0; if (e.fullT > 20) fail('log clogged the trail for 20 s with a full tank at ' + t); } if (n.kind === 'yuzu' && simT - e.t > 30) fail('yuzu clogged the trail for 30 s at ' + t); }
  for (const n of Array.from(enterT.keys())) if (!seen.has(n)) enterT.delete(n);
  for (const id in S.baths) {
    const b = S.baths[id]; if (!S.built[id]) continue;
    const n = b.slots.filter(Boolean).length; if (n > G.Upgrades.slots(S, id)) fail('bath ' + id + ' over seats at ' + t);
    for (let i = 0; i < b.slots.length; i++) { const g = b.slots[i]; if (!g) continue; if (g.state !== 'soak' || g.bathId !== id || g.slot !== i) fail('seat ' + id + '[' + i + '] holds a bad guest at ' + t + ' (' + g.state + ',' + g.bathId + ',' + g.slot + ')'); for (let j = i + 1; j < b.slots.length; j++) if (b.slots[j] === g) fail('guest in two seats at ' + t); }
  }
  if (S.guests.length > C.MAX_GUESTS) fail('too many guests at ' + t);
  if (S.coinPool.n > C.COIN_POOL) fail('coin pool over cap at ' + t);
  for (const p of ['steam', 'ripples', 'parts', 'pops']) if (S.fx[p].n > S.fx[p].cap) fail('pool ' + p + ' over cap at ' + t);
  for (const d of DATA.LANTERNS) { const l = S.lanterns[d.id]; if (l.level < d.costs.length && l.sunk >= d.costs[l.level]) fail('lantern ' + d.id + ' sunk >= cost at ' + t); }
  const D = G.Save.apply(G.State.create(), G.Save.serialize(S));
  for (const id in S.built) if (S.built[id] !== D.built[id]) fail('built.' + id + ' desynced from lanterns at ' + t);
  if (S.trailCap !== D.trailCap) fail('trailCap desynced at ' + t); if (S.car.level !== D.car.level) fail('car.level desynced at ' + t);
  if (S.helpers.pon.hired !== D.helpers.pon.hired || S.helpers.kero.hired !== D.helpers.kero.hired) fail('hires desynced at ' + t);
  if (!isFinite(S.car.timer) || (S.car.phase === 'away' && S.car.timer > G.CableCar.awayLen(S) + 0.01 && S.car.index > 1)) fail('car timer bad at ' + t + ': ' + S.car.timer);
  for (const id in S.carLog) if (simT - S.carLog[id].t > C.CARLOG_SWEEP + 1) fail('carLog older than the sweep at ' + t);
  if (fuzz && fz.parkStart >= 0 && simT - fz.parkStart >= 10 && fz.parkLogs === 0) { if (S.heat.v - fz.parkHeat > G.Upgrades.stoke(S) + 0.01 && !S.helpers.pon.hired) fail('zone overlap: heat rose by ' + (S.heat.v - fz.parkHeat).toFixed(1) + ' while parked at ' + t); fz.parkStart = -1; }
  if (U.warnCount > 0) { const msg = 'warnOnce fired: ' + Object.keys(U.warned).join(', '); if (fuzz) fail(msg); else if (!warns.length) warns.push(msg); }
}
function renderSmoke() {
  tallH = !tallH;
  globalThis.innerHeight = tallH ? 1200 : 960; G.Canvas.resize(); G.Camera.update(S, DT);
  const before = U.rngState();
  try { G.Render.frame(S, ctx); } catch (e) { fail('render smoke threw at ' + simT.toFixed(1) + ' (H=' + G.Canvas.H + '): ' + (e && e.stack)); }
  if (U.rngState() !== before) fail('render touched the seeded RNG at ' + simT.toFixed(1));
  if (G.Camera.y + G.Canvas.H > MAP.H + 0.01) fail('camera inverted at H=' + G.Canvas.H);
  if (G.Render.list.length > C.MAX_DRAWABLES) warns.push('drawables ' + G.Render.list.length + ' > ' + C.MAX_DRAWABLES + ' at ' + simT.toFixed(0));
}
function recordBeats() {
  for (const d of DATA.LANTERNS) if (S.lanterns[d.id].level >= 1 && beats.lantern[d.id] === undefined) beats.lantern[d.id] = simT;
  if (beats.x3 === null && S.stats.combos[3] > 0) beats.x3 = simT; if (beats.x4 === null && S.stats.combos[4] > 0) beats.x4 = simT; if (beats.x5 === null && S.stats.combos[5] > 0) beats.x5 = simT;
  if (beats.rush === null && S.stats.rushes > 0) beats.rush = simT; if (beats.chain === null && S.stats.chains > 0) beats.chain = simT; if (beats.night === null && S.stats.nights > 0) beats.night = simT;
  if (beats.fullcar === null && S.stats.fullCars > 0) beats.fullcar = simT; if (beats.golden === null && S.stats.golden > 0) beats.golden = simT;
}
// Season 1 (the Deck) milestones; other seasons register theirs in SEASON_CHECKS below
const DECK_CHECKS = [
  [30, () => { if (!S.built.cedar) fail('30 s: Cedar Bath not lit (coins=' + S.coins + ', earned=' + S.earned + ')'); if (S.stats.combos[3] < 2) fail('30 s: fewer than two x3 chains (' + S.stats.combos[3] + ')'); }],
  // floors = 70 % of the measured GDD 8.11 curve (seed 7, build 1.2.0): 287 / 1678 / 4963 / 15206 / 32078
  [120, () => { if (S.earned < 200) fail('120 s: earned ' + S.earned + ' < 200'); }],
  [300, () => { if (S.earned < 1170) fail('300 s: earned ' + S.earned + ' < 1170'); if (S.lanterns.trail.level < 1) fail('300 s: Trail Rope not lit'); if (!S.built.grove) fail('300 s: grove not built'); }],
  [600, () => { if (S.earned < 3470) fail('600 s: earned ' + S.earned + ' < 3470'); if (!S.helpers.pon.hired) fail('600 s: Pon not hired'); if (S.stats.rushes < 1) fail('600 s: no rush'); const c = S.stats.combos; if (c[3] + c[4] + c[5] < 5) fail('600 s: fewer than 5 chains'); if (c[5] < 1) fail('600 s: no x5'); }],
  [1200, () => { if (S.earned < 10600) fail('1200 s: earned ' + S.earned + ' < 10600'); if (!S.built.bamboo) fail('1200 s: bamboo not built'); if (S.stats.nights < 2) fail('1200 s: nights ' + S.stats.nights + ' < 2'); if (S.earned > 1.4 * 15206) console.warn('BALANCE WARNING: earned ' + S.earned + ' at 1200 s > 1.4 x 15206. Knobs in order: YUZU_PAY, YUZU_DUR, SPLASH_MULT[5], RUSH_PAY, NIGHT_PAY'); }],
  [1800, () => { if (S.earned < 22400) fail('1800 s: earned ' + S.earned + ' < 22400'); const r = S.stats.lost / Math.max(1, S.stats.served + S.stats.lost); if (r > 0.15) fail('1800 s: lost ratio ' + r.toFixed(2) + ' > 0.15'); }],
  // the Ridge (GDD 19): opens with the bridge, then the sauna -> plunge chain lands at least one hot-cold
  [2400, () => { if (!S.built.ridge) fail('2400 s: the Ridge did not open (bridge level ' + S.lanterns.bridge.level + ')'); }],
  [2700, () => { if (!S.built.sauna) fail('2700 s: Sauna Hut not built'); if (!S.built.plunge) fail('2700 s: Cold Plunge not built'); if (S.stats.hotCold < 1) fail('2700 s: no hot-cold plunge (plunges ' + S.stats.plunges + ')'); }],
  [3000, () => { if (!S.built.pavilion) fail('3000 s: Massage Pavilion not built'); if (S.stats.massages < 2) fail('3000 s: massages ' + S.stats.massages + ' < 2'); if (S.stats.fullHouses < 1) fail('3000 s: no full house');
                 if (S.stats.squalls < 1) fail('3000 s: no snow squall'); if (S.stats.cleared < 1) fail('3000 s: no drift cleared (' + S.snow.drifts.length + ' lying)'); }]
];
// Season 2 (the Mochi Terrace): floors = 70 % of the measured curve (seed 7, build 1.3.0): 243 / 1259 / 4635 / 16803 / 32397 / 49909 at 2 / 5 / 10 / 20 / 30 / 40 min
const TERRACE_CHECKS = [
  [30, () => { if (!S.built.boiler) fail('30 s: Rice Mortar not lit (coins=' + S.coins + ', earned=' + S.earned + ')'); if (S.stats.combos[3] < 1) fail('30 s: no x3 feast'); }],
  [120, () => { if (S.earned < 170) fail('120 s: earned ' + S.earned + ' < 170'); if (!S.built.table) fail('120 s: Mochi Table not built'); }],
  [300, () => { if (S.earned < 880) fail('300 s: earned ' + S.earned + ' < 880'); if (S.stats.laps < 2) fail('300 s: laps ' + S.stats.laps + ' < 2'); if (S.stats.rushes < 1) fail('300 s: no Fresh Batch'); }],
  [600, () => { if (S.earned < 3240) fail('600 s: earned ' + S.earned + ' < 3240'); if (!S.helpers.pon.hired) fail('600 s: Pon not hired'); if (S.stats.combos[5] < 1) fail('600 s: no x5'); if (S.stats.kaa < 2) fail('600 s: Kaa tapped ' + S.stats.kaa + ' < 2'); }],
  [1200, () => { if (S.earned < 11760) fail('1200 s: earned ' + S.earned + ' < 11760'); if (!S.built.grove) fail('1200 s: Persimmon Tree not built'); if (S.stats.nights < 2) fail('1200 s: moons ' + S.stats.nights + ' < 2'); if (S.earned > 1.4 * 16803) console.warn('BALANCE WARNING: earned ' + S.earned + ' at 1200 s > 1.4 x 16803. Knobs in order: YUZU_PAY, YUZU_DUR, SPLASH_MULT[5], RUSH_PAY, NIGHT_PAY, momo.pay'); }],
  [1800, () => { if (S.earned < 22680) fail('1800 s: earned ' + S.earned + ' < 22680'); if (!S.built.hearth) fail('1800 s: Zenzai Hearth not built'); if (!S.built.stall) fail('1800 s: Tea Counter not built'); if (S.stats.vip < 1) fail('1800 s: Momo never rode the Express'); const r = S.stats.lost / Math.max(1, S.stats.served + S.stats.lost); if (r > 0.15) fail('1800 s: lost ratio ' + r.toFixed(2) + ' > 0.15'); }],
  [2400, () => { if (S.earned < 34900) fail('2400 s: earned ' + S.earned + ' < 34900'); if (S.lanterns.summit.level < 1) fail('2400 s: Summit Lantern not lit'); }]
];
const SEASON_CHECKS = { 1: DECK_CHECKS, 2: TERRACE_CHECKS };
const CHECKS = SEASON_CHECKS[G.SEASON.id] || [];
if (!CHECKS.length && opt.assert && !opt.fuzz) warns.push('no milestone checks registered for season ' + G.SEASON.id);
let checkI = 0;

// ---- main loop ----
const t0 = Date.now();
while (simT < total - 1e-9) {
  if (fuzz) fuzzInput(); else bot.step(S, DT);
  try { G.Game.step(DT); } catch (e) { fail('exception at t=' + simT.toFixed(2) + ': ' + (e && e.stack)); break; }
  simT += DT;
  if (car2DockT === null && S.car.index === 2 && S.car.phase === 'dock') car2DockT = S.t;   // play time: hit-stop freezes the simulation
  if (simT >= nextInv - 1e-9) { nextInv += 1; invariants(); recordBeats(); if (fails.length > 20) break; }
  if (!fuzz && opt.assert) while (checkI < CHECKS.length && simT >= CHECKS[checkI][0] - 1e-9) { CHECKS[checkI][1](); checkI++; }
  if (simT >= nextRender - 1e-9) { nextRender += 10; renderSmoke(); }
  if (simT >= nextMinute - 1e-9) {
    const m = Math.round(nextMinute / 60); nextMinute += 60;
    const lit = DATA.LANTERNS.reduce((a, d) => a + S.lanterns[d.id].level, 0), ups = Object.values(S.levels).reduce((a, l) => a + l.speed + l.slots + l.pay, 0), c = S.stats.combos;
    csvRows.push([m, S.coins, S.earned, Math.round(G.Save.rate(S.income) * 60), lit, ups, S.stats.served, S.stats.lost, c[3], c[4], c[5], S.stats.rushes, S.stats.chains, S.stats.fullCars, S.stats.nights, S.trailCap, S.car.level, Math.round(S.heat.v)].join(','));
  }
  if (fails.length > 20) break;
}
const wall = (Date.now() - t0) / 1000;

// ---- end-of-run checks ----
if (!fails.length) {
  try {
    G.State.resetRuntime(S);
    const a = JSON.stringify(G.Save.serialize(S)), b = JSON.stringify(G.Save.serialize(G.Save.apply(G.State.create(), G.Save.serialize(S))));
    if (a !== b) fail('save round trip differs:\n' + a.slice(0, 400) + '\n' + b.slice(0, 400));
    const obj = G.Save.serialize(S); obj.savedAt = obj.savedAt || Date.now();
    const o1 = G.Save.offline(obj, obj.savedAt + 3600e3); if (!(Number.isInteger(o1.coins) && o1.coins >= 0 && o1.coins <= C.RATE_CAP_PER_S * 0.25 * 3600)) fail('offline 1 h coins out of range: ' + o1.coins);
    const o2 = G.Save.offline(obj, obj.savedAt + 10 * 3600e3); if (o2.away !== C.OFFLINE_CAP) fail('offline 10 h away not capped: ' + o2.away);
    if (G.Save.offlineLive(S, Date.now()).floorCoins !== 0) fail('offlineLive floorCoins != 0');
    const bucketsBefore = S.income.buckets.slice(); G.Coins.add(S, 123, 'offline'); if (S.income.buckets.join() !== bucketsBefore.join()) fail('offline coins fed the income buckets');
    const first = DATA.SHEET_STATIONS[0], base = DATA.UPGRADES[first].speed.base, costs = [], want = []; const S2 = G.State.create();
    for (let l = 0; l < 6; l++) { S2.levels[first].speed = l; costs.push(G.Upgrades.cost(S2, first, 'speed')); want.push(l < DATA.UPGRADES[first].speed.max ? Math.round(base * Math.pow(C.UPG_GROWTH, l) / C.UPG_ROUND) * C.UPG_ROUND : null); }
    if (costs.join() !== want.join()) fail('upgrade cost table: ' + costs.join() + ' (expected ' + want.join() + ')');
    if (G.SEASON.id === 1) {
      const r1 = G.Guests.route({ x: 120, y: 1900 }, { x: 270, y: 2030 }, []); if (!(r1.length === 2 && r1[0].x === 270 && r1[0].y === 1900 && r1[1].x === 270 && r1[1].y === 2030)) fail('route case 1: ' + JSON.stringify(r1));
      const r2 = G.Guests.route({ x: 265, y: 2050 }, { x: 410, y: 1525 }, []); if (!(r2.length === 2 && r2[0].x === 270 && r2[0].y === 1525 && r2[1].x === 410 && r2[1].y === 1525)) fail('route case 2: ' + JSON.stringify(r2));
    }
    const S3 = G.State.create(), away0 = DATA.CAR.levels[0].period - (C.CAR_IN_T + C.CAR_DOCK_T + C.CAR_OUT_T), awayN = Math.max(0, C.CAR_PERIOD_NIGHT - (C.CAR_IN_T + C.CAR_DOCK_T + C.CAR_OUT_T));
    if (Math.abs(G.CableCar.awayLen(S3) - away0) > 1e-9) fail('awayLen level 0: ' + G.CableCar.awayLen(S3)); S3.night.active = true; if (Math.abs(G.CableCar.awayLen(S3) - awayN) > 1e-9) fail('awayLen night: ' + G.CableCar.awayLen(S3));
    // seasons: unlock sticks, stars never count the current season, progress is a ratio
    const M = G.Seasons; M.unlock(99, { silent: true }); if (!M.isUnlocked(99)) fail('season unlock did not stick'); delete M.meta.unlocked[99]; M.writeMeta();
    const doneSelf = !!M.meta.done[G.SEASON.id]; M.meta.done[G.SEASON.id] = true; const stars0 = M.stars(); M.meta.done[G.SEASON.id + 100] = true; if (M.stars() !== stars0 + 1) fail('stars miscounted'); delete M.meta.done[G.SEASON.id + 100]; if (!doneSelf) delete M.meta.done[G.SEASON.id];
    if (!(M.progress(S) >= 0 && M.progress(S) <= 1)) fail('progress out of range: ' + M.progress(S));
    if (JSON.stringify(M.readMeta().unlocked) !== JSON.stringify(M.meta.unlocked)) fail('meta round trip differs');
    if (!fuzz && !opt.assert === false) { /* noop */ }
    if (!fuzz && total >= 14 && (car2DockT === null || Math.abs(car2DockT - C.CAR_SECOND_AT) > 0.05 + DT)) fail('car #2 docked at ' + car2DockT + ' (expected ' + C.CAR_SECOND_AT + ')');
    G.Render.frame(S, ctx);
  } catch (e) { fail('end-of-run check threw: ' + (e && e.stack)); }
}

// ---- report ----
if (opt.csv) { try { fs.mkdirSync(path.dirname(path.resolve(root, opt.csv)), { recursive: true }); fs.writeFileSync(path.resolve(root, opt.csv), csvRows.join('\n') + '\n'); log('csv written: ' + opt.csv); } catch (e) { warns.push('csv write failed: ' + e.message); } }
const st = S.stats;
log('season ' + G.SEASON.id + ' (' + G.SEASON.name + ') | ' + (fuzz ? 'fuzz ' : 'bot ') + total + ' s in ' + wall.toFixed(1) + ' s wall | earned ' + S.earned + ' coins ' + S.coins + ' | served ' + st.served + ' lost ' + st.lost + ' | combos x3/x4/x5 ' + st.combos[3] + '/' + st.combos[4] + '/' + st.combos[5] + ' | rushes ' + st.rushes + ' chains ' + st.chains + ' | fullCars ' + st.fullCars + ' nights ' + st.nights + ' golden ' + st.golden + ' mochi ' + st.mochi + ' | vip ' + st.vip + ' laps ' + st.laps + ' kaa ' + st.kaa + ' | plunges ' + st.plunges + ' hotCold ' + st.hotCold + ' massages ' + st.massages + ' fullHouses ' + st.fullHouses + ' | squalls ' + st.squalls + ' cleared ' + st.cleared + ' | trailCap ' + S.trailCap + ' car L' + S.car.level + ' | buys ' + bot.buys());
log('lanterns: ' + DATA.LANTERNS.map(d => d.id + ':' + S.lanterns[d.id].level).join(' '));
if (opt.beats) {
  log('\nBEATS (first time, seconds):');
  for (const d of DATA.LANTERNS) log('  lantern ' + d.id + ': ' + (beats.lantern[d.id] === undefined ? '-' : beats.lantern[d.id].toFixed(0)));
  for (const k of ['x3', 'x4', 'x5', 'rush', 'chain', 'night', 'fullcar', 'golden']) log('  ' + k + ': ' + (beats[k] === null ? '-' : beats[k].toFixed(0)));
}
if (!opt.quiet && opt.csv === null && !fuzz) { log('\nCSV:'); for (const r of csvRows) log(r); }
for (const w of warns) console.warn('WARN ' + w);
finish();
