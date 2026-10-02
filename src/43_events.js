// Capy Springs - events: Lantern Night, lantern light, FULL CAR, Golden Car, Famous Inn / Season Fame (ARCHITECTURE.md 9.11, GDD 5.5 / 5.9 / 5.12 / 5.13).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, MAP = DATA.MAP;
  const Events = G.Events = { S: null };
  const evFull = { carId: 0, n: 0, bonus: 0 }, evFame = { level: 0 }, evLight = { id: null }, evNone = {};
  const sign = { sortY: MAP.BRIDGE.sign.y, draw: null };

  Events.isGolden = index => C.GOLDEN_EVERY > 0 && index % C.GOLDEN_EVERY === 0;
  Events.nightPay = S => S.night.active ? (S.night.festival ? C.FESTIVAL_PAY : C.NIGHT_PAY) : 1;      // a Festival Night (GDD 20.6) pays more
  Events.init = function (S) {
    Events.S = S; sign.draw = drawSign;
    if (Events.subscribed) return;
    Events.subscribed = true;
    G.Bus.on('guest:seated', e => Events.onSeated(Events.S, e.g));
    G.Bus.on('guest:lost', e => Events.onLost(Events.S, e.g));
    G.Bus.on('guest:gone', e => Events.onGone(Events.S, e.g));
    G.Bus.on('car:arrive', e => { if (e.golden && !e.empty) Events.S.stats.golden++; });
  };
  Events.startNight = function (S, festival) {
    const n = S.night; n.active = true; n.t = 0; n.count++; n.lit = {}; n.momo = false; S.stats.nights++;
    n.festival = !!festival || (G.Golden ? G.Golden.festivalTonight(S) : false); if (n.festival) Events.makeFestival(S);
    n.next = S.t + C.NIGHT_T + C.NIGHT_EVERY;      // set now (not only at the end): a reload mid-night waits a normal interval instead of starting the night over
    G.CableCar.onNight(S);
    G.Bus.emit('night:start', evNone);
  };
  Events.makeFestival = function (S) { const n = S.night; n.festival = true; n.wasFestival = true; n.t = 0; S.festival.pending = false; S.festival.start = S.earned; G.Bus.emit('festival:start', evNone); };
  Events.endNight = function (S) { const n = S.night; n.active = false; n.festival = false; n.next = S.t + C.NIGHT_EVERY; G.Bus.emit('night:end', evNone); };
  Events.nightLen = S => (S.night.festival ? C.FESTIVAL_T : C.NIGHT_T);
  Events.onSeated = function (S, g) {
    const log = S.carLog[g.carId]; if (!log || g.paid > 0) return;    // a sauna guest re-seated at the plunge or the pavilion counts once
    log.seated++;
    if (log.seated >= log.n && !log.lost && !log.done) {
      log.done = true;
      const bonus = C.FULLCAR_BONUS * log.n;
      G.Coins.rain(S, bonus, S.kit.x, S.kit.y, 'fullcar');
      S.stats.fullCars++;
      evFull.carId = g.carId; evFull.n = log.n; evFull.bonus = bonus; G.Bus.emit('fullcar', evFull);
    }
  };
  Events.onLost = function (S, g) { const log = S.carLog[g.carId]; if (log) log.lost = true; };
  Events.onGone = function (S, g) { const log = S.carLog[g.carId]; if (!log) return; log.gone++; if (log.gone >= log.n) delete S.carLog[g.carId]; };
  Events.famous = function (S, level) { if (level <= 1) G.Bus.emit('famous', evNone); else { evFame.level = level; G.Bus.emit('fame', evFame); } };

  Events.update = function (S, dt) {
    const n = S.night;
    if (!n.active && G.Seasons.firstLit(S) && S.t >= n.next) Events.startNight(S);
    if (n.active) {
      n.t += dt;
      n.fade = Math.min(1, n.fade + dt / C.NIGHT_FADE);
      // lantern light: each lit lantern Kit passes drops 1-3 koban, once per lantern per night
      const kit = S.kit, L = DATA.LANTERNS;
      for (let i = 0; i < L.length; i++) {
        const d = L[i]; if (S.lanterns[d.id].level < 1 || n.lit[d.id]) continue;
        if (U.dist2(kit.x, kit.y, d.x, d.y) <= C.PAD_R * C.PAD_R) { n.lit[d.id] = true; G.Coins.rain(S, U.randInt(C.LANTERN_LIGHT), kit.x, kit.y, 'night'); evLight.id = d.id; G.Bus.emit('night:light', evLight); }
      }
      if (n.t >= Events.nightLen(S)) Events.endNight(S);
    } else if (n.fade > 0) n.fade = Math.max(0, n.fade - dt / C.NIGHT_FADE);
    // carLog sweep: no log outlives CARLOG_SWEEP
    for (const id in S.carLog) if (S.t - S.carLog[id].t > C.CARLOG_SWEEP) delete S.carLog[id];
  };
  Events.collect = function (S, list) { if (G.Seasons.finaleLit(S) && G.Camera.visibleY(MAP.BRIDGE.sign.y, 100)) list.push(sign); };
  function drawSign(ctx, o, S) { G.Art.W.sign(ctx, MAP.BRIDGE.sign.x, MAP.BRIDGE.sign.y, S.built.awake ? 'SOURCE' : S.built.summit ? 'SUMMIT' : 'RIDGE'); }
})(window.G);
