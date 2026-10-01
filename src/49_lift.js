// Capy Springs - the Ridge Lift: a gondola across the gorge that brings guests to the Ridge's own platform once the Ridge is open; Momo the
// snow-monkey VIP rides it during Lantern Night (GDD 19.4, ARCHITECTURE.md 22). Same dock-to-dock phases as the cable car, its own rhythm.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, MAP = DATA.MAP, LIFT = MAP.LIFT || null;
  const Lift = G.Lift = {};
  const evArrive = { index: 0, golden: false, kind: 'capy', n: 0, empty: false, x: 0, y: 0, lift: true }, evVip = { x: 0, y: 0 }, evNone = {};
  const cabin = { sortY: LIFT ? LIFT.sortY : 0, draw: null }, bell = { sortY: LIFT ? LIFT.bell.y : 0, draw: null };
  const ID_BASE = 100000;                                      // lift car ids never collide with the cable car's

  Lift.period = S => S.night.active ? LIFT.periodNight : LIFT.period;
  Lift.awayLen = S => Math.max(0, Lift.period(S) - (C.CAR_IN_T + C.CAR_DOCK_T + C.CAR_OUT_T));
  Lift.timeToDock = function (S) {
    const c = S.lift, p = Lift.period(S);
    if (c.phase === 'away') return c.timer + C.CAR_IN_T;
    if (c.phase === 'in') return Math.max(0, C.CAR_IN_T - c.phaseT);
    if (c.phase === 'dock') return Math.max(0, p - c.phaseT);
    return Math.max(0, p - C.CAR_DOCK_T - c.phaseT);
  };
  Lift.running = S => !!LIFT && !!S.built.ridge;
  Lift.init = function (S) { cabin.draw = drawCabin; bell.draw = drawBell; };

  function arrive(S) {
    const c = S.lift, plat = LIFT.platform;
    c.index++; c.carId = ID_BASE + c.index;
    let n = Math.max(0, Math.min(LIFT.guests, plat.cap - G.Guests.countWaiting(S, 'ridge')));
    c.golden = LIFT.goldenEvery > 0 && c.index % LIFT.goldenEvery === 0;
    if (c.golden) n = Math.min(n * C.GOLDEN_GUESTS, plat.cap);
    // Momo: once per Lantern Night, once the sauna exists, he steps off last
    c.vip = !!(S.night.active && !S.night.momo && S.built.sauna && DATA.GUESTS.momo);
    if (c.vip) { n += 1; S.night.momo = true; }
    c.n = n; c.toSpawn = n; c.spawnT = C.CAR_HOP_GAP; c.empty = n === 0;
    if (!c.empty && n >= C.FULLCAR_MIN) S.carLog[c.carId] = { n, seated: 0, lost: false, gone: 0, done: false, t: S.t };
    S.stats.liftCars++;
    evArrive.index = c.index; evArrive.golden = c.golden; evArrive.n = n; evArrive.empty = c.empty; evArrive.x = plat.x; evArrive.y = plat.y;
    G.Bus.emit('car:arrive', evArrive);
  }
  Lift.update = function (S, dt) {
    if (!Lift.running(S)) return;
    const c = S.lift; c.phaseT += dt;
    if (c.pulse > 0) c.pulse -= dt;
    switch (c.phase) {
      case 'away':
        c.timer -= dt;
        if (!c.warned && c.timer + C.CAR_IN_T <= C.CAR_WARN_T) { c.warned = true; c.pulse = C.CAR_WARN_T; G.Bus.emit('lift:warn', evNone); }
        if (c.timer <= 0) { c.phase = 'in'; c.phaseT = -c.timer; c.timer = 0; c.x = LIFT.enterX; }
        break;
      case 'in': {
        const u = U.clamp(c.phaseT / C.CAR_IN_T, 0, 1);
        c.x = U.lerp(LIFT.enterX, LIFT.dockX, U.easeOutQuad(u)); c.swing = 0.05 * Math.sin(c.phaseT * 2) * (1 - u);
        if (c.phaseT >= C.CAR_IN_T) { c.phase = 'dock'; c.phaseT -= C.CAR_IN_T; c.x = LIFT.dockX; c.swing = 0; arrive(S); }
        break;
      }
      case 'dock':
        if (c.toSpawn > 0) {
          c.spawnT -= dt;
          if (c.spawnT <= 0) {
            c.spawnT = C.CAR_HOP_GAP;
            const kind = (c.vip && c.toSpawn === 1) ? 'momo' : 'capy';
            const g = G.Guests.spawn(S, kind, c.carId, c.golden, c.x, LIFT.y + LIFT.doorDY, 'ridge');
            if (g) { c.toSpawn--; if (kind === 'momo') { evVip.x = g.x; evVip.y = g.y; G.Bus.emit('vip:arrive', evVip); } } else c.toSpawn = 0;
          }
        }
        c.swing = 0.02 * Math.sin(c.phaseT * 3) * Math.exp(-c.phaseT);
        if (c.phaseT >= C.CAR_DOCK_T && c.toSpawn <= 0) { const over = c.phaseT - C.CAR_DOCK_T; c.phase = 'out'; c.phaseT = Math.min(over, C.CAR_OUT_T); }
        break;
      case 'out': {
        const u = U.clamp(c.phaseT / C.CAR_OUT_T, 0, 1);
        c.x = U.lerp(LIFT.dockX, LIFT.exitX, U.easeInQuad(u)); c.swing = -0.04 * Math.sin(c.phaseT * 3);
        if (c.phaseT >= C.CAR_OUT_T) { const over = c.phaseT - C.CAR_OUT_T; c.phase = 'away'; c.phaseT = 0; c.warned = false; c.timer = Lift.awayLen(S) - over; }
        break;
      }
    }
  };
  Lift.collect = function (S, list) {
    if (!Lift.running(S)) return;
    if (G.Camera.visibleY(LIFT.y, 80) && S.lift.phase !== 'away') list.push(cabin);
    if (G.Camera.visibleY(LIFT.bell.y, 120)) list.push(bell);
  };
  function drawCabin(ctx, o, S) {
    const c = S.lift, heads = c.phase === 'in' || (c.phase === 'dock' && c.toSpawn > 0) ? Math.min(3, Math.max(1, c.toSpawn || c.n)) : 0;
    G.Art.W.liftCar(ctx, c.x, c.swing, c.golden, heads);
  }
  function drawBell(ctx, o, S) { const ttd = Lift.timeToDock(S); G.Art.W.bellPost(ctx, LIFT.bell.x, LIFT.bell.y, U.clamp(1 - ttd / Lift.period(S), 0, 1), ttd < C.CAR_WARN_T ? S.t : 0); }
})(window.G);
