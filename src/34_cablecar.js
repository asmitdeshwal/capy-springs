// Capy Springs - cable car: dock-to-dock cycle, cabin animation, spawning, duck / golden / empty cars (ARCHITECTURE.md 9.3, GDD 8.2).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, MAP = DATA.MAP;
  const CableCar = G.CableCar = {};
  const PLAN = { kind: 'capy', n: 0, golden: false, vip: false };
  const evArrive = { index: 0, golden: false, kind: 'capy', n: 0, empty: false }, evEmpty = { index: 0 }, evNone = {};
  const cabin = { sortY: MAP.CABLE.sortY, draw: null }, bell = { sortY: MAP.BELL.y, draw: null };

  CableCar.period = S => S.night.active ? C.CAR_PERIOD_NIGHT : DATA.CAR.levels[S.car.level].period;
  CableCar.awayLen = S => Math.max(0, CableCar.period(S) - (C.CAR_IN_T + C.CAR_DOCK_T + C.CAR_OUT_T));
  CableCar.timeToDock = function (S) {
    const c = S.car, p = CableCar.period(S);
    if (c.phase === 'away') return c.timer + C.CAR_IN_T;
    if (c.phase === 'in') return Math.max(0, C.CAR_IN_T - c.phaseT);
    if (c.phase === 'dock') return Math.max(0, p - c.phaseT);
    return Math.max(0, p - C.CAR_DOCK_T - c.phaseT);
  };
  CableCar.ringFraction = S => U.clamp(1 - CableCar.timeToDock(S) / CableCar.period(S), 0, 1);
  CableCar.planCar = function (S, index) {
    const lv = DATA.CAR.levels[S.car.level];
    let n = lv.capys + (lv.spread ? U.randInt(-lv.spread, lv.spread) : 0), kind = 'capy', golden = false;
    if (G.Events.isGolden(index)) { golden = true; n = n * C.GOLDEN_GUESTS; }
    else if (S.car.level >= 1 && !S.night.active && index % C.DUCK_EVERY === 0) { kind = 'duck'; n = lv.ducks; }
    n = Math.max(0, Math.min(n, MAP.PLATFORM.cap - G.Guests.countWaiting(S, 'platform')));
    // the VIP (a season's DATA.VIP) rides the golden car that docks during the night event, once its station is built; one extra seat, one extra guest
    const vip = DATA.VIP; PLAN.vip = !!(vip && golden && n > 0 && S.night.active && S.built[vip.requires]);
    PLAN.kind = kind; PLAN.n = n + (PLAN.vip ? 1 : 0); PLAN.golden = golden;
    return PLAN;
  };
  CableCar.arrive = function (S) {
    const c = S.car;
    c.index++; c.carId = c.index;
    const plan = CableCar.planCar(S, c.index);
    c.kind = plan.kind; c.golden = plan.golden; c.n = plan.n; c.toSpawn = plan.n; c.spawnT = C.CAR_HOP_GAP; c.empty = plan.n === 0; c.vip = plan.vip;
    if (c.empty) { evEmpty.index = c.index; G.Bus.emit('car:empty', evEmpty); }
    else if (plan.n >= C.FULLCAR_MIN) S.carLog[c.carId] = { n: plan.n, seated: 0, lost: false, gone: 0, done: false, t: S.t };
    evArrive.index = c.index; evArrive.golden = c.golden; evArrive.kind = c.kind; evArrive.n = c.n; evArrive.empty = c.empty;
    G.Bus.emit('car:arrive', evArrive);
  };
  CableCar.depart = function (S) { const c = S.car; c.phase = 'out'; c.phaseT = 0; G.Bus.emit('car:depart', evNone); };
  CableCar.onNight = function (S) { const c = S.car; if (c.phase === 'away') c.timer = Math.min(c.timer, CableCar.awayLen(S)); };

  CableCar.init = function (S) { cabin.draw = drawCabin; bell.draw = drawBell; };
  CableCar.update = function (S, dt) {
    const c = S.car; c.phaseT += dt;
    if (c.pulse > 0) c.pulse -= dt;
    switch (c.phase) {
      case 'away':
        c.timer -= dt;
        if (!c.warned && c.timer + C.CAR_IN_T <= C.CAR_WARN_T) { c.warned = true; c.pulse = C.CAR_WARN_T; G.Bus.emit('car:warn', evNone); }
        if (c.timer <= 0) { c.phase = 'in'; c.phaseT = -c.timer; c.timer = 0; c.x = MAP.CABLE.enterX; }
        break;
      case 'in': {
        const u = U.clamp(c.phaseT / C.CAR_IN_T, 0, 1);
        c.x = U.lerp(MAP.CABLE.enterX, MAP.CABLE.dockX, U.easeOutQuad(u)); c.swing = 0.05 * Math.sin(c.phaseT * 2) * (1 - u);
        if (c.phaseT >= C.CAR_IN_T) { c.phase = 'dock'; c.phaseT -= C.CAR_IN_T; c.x = MAP.CABLE.dockX; c.swing = 0; CableCar.arrive(S); }
        break;
      }
      case 'dock':
        if (c.toSpawn > 0) {
          c.spawnT -= dt;
          if (c.spawnT <= 0) {
            c.spawnT = C.CAR_HOP_GAP;
            const kind = (c.vip && c.toSpawn === 1) ? DATA.VIP.kind : c.kind;       // the VIP steps out last
            if (G.Guests.spawn(S, kind, c.carId, c.golden, c.x, MAP.CABLE.y + MAP.CABLE.doorDY)) c.toSpawn--; else c.toSpawn = 0;
          }
        }
        c.swing = 0.02 * Math.sin(c.phaseT * 3) * Math.exp(-c.phaseT);
        if (c.phaseT >= C.CAR_DOCK_T && c.toSpawn <= 0) { const over = c.phaseT - C.CAR_DOCK_T; CableCar.depart(S); c.phaseT = Math.min(over, C.CAR_OUT_T); }
        break;
      case 'out': {
        const u = U.clamp(c.phaseT / C.CAR_OUT_T, 0, 1);
        c.x = U.lerp(MAP.CABLE.dockX, MAP.CABLE.exitX, U.easeInQuad(u)); c.swing = -0.04 * Math.sin(c.phaseT * 3);
        if (c.phaseT >= C.CAR_OUT_T) {
          const over = c.phaseT - C.CAR_OUT_T;
          c.phase = 'away'; c.phaseT = 0; c.warned = false;
          c.timer = (c.index === 1 ? Math.max(0, C.CAR_SECOND_AT - (C.CAR_DOCK_T + C.CAR_OUT_T + C.CAR_IN_T)) : CableCar.awayLen(S)) - over;
        }
        break;
      }
    }
  };
  CableCar.collect = function (S, list) {
    const cam = G.Camera, H = G.Canvas.H;
    if (MAP.CABLE.y < cam.y + H + 80 && S.car.phase !== 'away') list.push(cabin);
    if (MAP.BELL.y > cam.y - 120 && MAP.BELL.y < cam.y + H + 60) list.push(bell);
  };
  function drawCabin(ctx, o, S) {
    const c = S.car, heads = c.phase === 'in' || (c.phase === 'dock' && c.toSpawn > 0) ? Math.min(3, Math.max(1, c.toSpawn || c.n)) : 0;
    G.Art.W.cableCar(ctx, c.x, c.swing, c.golden, heads);
  }
  function drawBell(ctx, o, S) { const ttd = CableCar.timeToDock(S); G.Art.W.bellPost(ctx, MAP.BELL.x, MAP.BELL.y, CableCar.ringFraction(S), ttd < C.CAR_WARN_T ? S.t : 0); }
})(window.G);
