// Capy Springs - heat: gauge, grace, woodpile pickup, boiler, Steam Rush chains (ARCHITECTURE.md 9.6, GDD 5.3 / 8.6).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, ST = DATA.STATIONS, LAP = DATA.LAP || null;
  const Heat = G.Heat = {};
  const evStoke = { by: null, amount: 0, bonus: 0 }, evRush = { chain: 0 }, evNone = {}, evLap = { i: 0 };
  const glow = { sortY: ST.boiler.y, draw: null };
  let smokeT = 0;

  Heat.init = function (S) { glow.draw = drawGlow; smokeT = 0; };
  Heat.unlocked = S => !!S.built.boiler;
  Heat.isCold = S => S.heat.cold;
  Heat.inRush = S => S.heat.rush;
  Heat.soakMult = (S, bath) => (bath.def.heated && S.heat.rush) ? C.RUSH_SOAK : 1;
  Heat.payMult = (S, bath) => (bath.def.heated && S.heat.rush) ? C.RUSH_PAY[Math.min(S.heat.chain, C.RUSH_PAY.length - 1)] : 1;
  Heat.canPick = function (S) { const st = G.Upgrades.stoke(S); return G.Trail.count(S, 'log') * st < (S.heat.max - S.heat.v) + st; };
  Heat.drain = S => S.heat.rush ? C.DRAIN_RUSH : S.heat.occupied ? C.DRAIN_OCCUPIED : C.DRAIN_IDLE;
  Heat.add = function (S, amount, by, bonus) {
    const h = S.heat, before = h.v;
    h.v = Math.min(h.max, Math.max(0, h.v + amount));
    const actual = h.v - before;
    evStoke.by = by; evStoke.amount = actual; evStoke.bonus = bonus || 0; G.Bus.emit('heat:stoke', evStoke);
    return actual;
  };
  // Pounding Lap (season mechanic, DATA.LAP): touch the stepping stones in order within the window while carrying fuel; the next stoke gets +bonus
  function updateLap(S, dt) {
    const lap = S.lap, kit = S.kit;
    for (let i = 0; i < 3; i++) if (lap.glow[i] > 0) lap.glow[i] = Math.max(0, lap.glow[i] - dt * 1.5);
    if (lap.armed) return;
    if (lap.i > 0) { lap.t -= dt; if (lap.t <= 0) lap.i = 0; }
    const st = LAP.stones[lap.i];
    if (G.Trail.hasKind(S, 'log') && U.dist2(kit.x, kit.y, st[0], st[1]) <= LAP.r * LAP.r) {
      lap.glow[lap.i] = 1; lap.i++; lap.t = LAP.window; evLap.i = lap.i; G.Bus.emit('lap:step', evLap);
      if (lap.i >= LAP.stones.length) { lap.i = 0; lap.t = 0; lap.armed = true; lap.laps++; S.stats.laps++; G.Bus.emit('lap:done', evNone); }
    }
  }
  Heat.startRush = function (S) {
    const h = S.heat; h.rush = true; h.rushT = 0; h.chain = 0; S.stats.rushes++;
    evRush.chain = 0; G.Bus.emit('heat:rush:start', evRush);
    h.rushSeen = true;
  };
  Heat.endRush = function (S) { const h = S.heat; h.rush = false; h.chain = 0; h.rushT = 0; G.Bus.emit('heat:rush:end', evNone); };

  Heat.update = function (S, dt) {
    if (!S.built.boiler) return;
    const h = S.heat, kit = S.kit, Trail = G.Trail;
    h.max = G.Upgrades.heatMax(S);
    if (h.graceT > 0) h.graceT = Math.max(0, h.graceT - dt);
    h.occupied = G.Baths.occupiedHeated(S);
    if (h.graceT === 0) h.v = U.clamp(h.v - Heat.drain(S) * dt, 0, h.max);
    const cold = h.v < C.HEAT_COLD;
    if (cold !== h.cold) { h.cold = cold; G.Bus.emit(cold ? 'heat:cold' : 'heat:warm', evNone); }
    // woodpile pickup: one log per TRAIL_LOG_EVERY, never more than fills the tank
    const wp = ST.woodpile;
    if (S.built.woodpile && U.dist2(kit.x, kit.y, wp.x, wp.y) <= wp.zone * wp.zone && !Trail.full(S) && Heat.canPick(S) && S.t - h.pickT >= C.TRAIL_LOG_EVERY) {
      if (Trail.join(S, 'log', null, wp.x, wp.y - 20)) h.pickT = S.t;
    }
    if (LAP) updateLap(S, dt);
    // boiler: always consumes the logs it is offered (a banked lap makes the first of them count for more)
    const bo = ST.boiler;
    // STOKE_STOP > 0 (a season knob): Kit must stand still that long at the burner, so a lap around it never burns the fuel early
    if (U.dist2(kit.x, kit.y, bo.x, bo.y) <= bo.zone * bo.zone && Trail.hasKind(S, 'log') && S.t - h.stokeT >= C.STOKE_GAP && (C.STOKE_STOP <= 0 || kit.stoppedT >= C.STOKE_STOP)) {
      Trail.takeFirst(S, 'log'); h.stokeT = S.t;
      const bonus = LAP && S.lap.armed ? LAP.bonus : 0; S.lap.armed = false;
      if (h.v < h.max) Heat.add(S, G.Upgrades.stoke(S) + bonus, 'kit', bonus);
      else if (h.rush) h.rushT = Math.max(0, h.rushT - C.RUSH_SURPLUS_T);
      else G.FX.puff(S, bo.x, bo.y - 20, 'puff', 8);
    }
    // rush
    if (!h.rush && h.v >= C.HEAT_RUSH) Heat.startRush(S);
    else if (h.rush) {
      h.rushT += dt;
      if (h.rushT >= C.RUSH_T) {
        if (h.v >= C.HEAT_RUSH) { h.chain++; S.stats.chains++; h.rushT = 0; evRush.chain = h.chain; G.Bus.emit('heat:rush:start', evRush); }
        else Heat.endRush(S);
      }
    }
    // chimney smoke, rate proportional to heat
    smokeT += dt * (h.v / h.max) * (h.rush ? 4 : 1);
    if (smokeT >= 1) { smokeT -= 1; G.FX.steam(S, bo.x + 20, bo.y - 92, 7 + U.hash(S.t, 3) * 4, 0.35); }
  };
  Heat.collect = function (S, list) { if (S.built.boiler && G.Camera.visibleY(ST.boiler.y, 140)) list.push(glow); };
  Heat.drawGround = function (ctx, S) {
    if (!LAP || !S.built.boiler || !G.Camera.visibleY(ST.boiler.y, 160)) return;
    const lap = S.lap, hint = !lap.armed && G.Trail.hasKind(S, 'log');
    for (let i = 0; i < LAP.stones.length; i++) G.Art.W.lapStone(ctx, LAP.stones[i][0], LAP.stones[i][1], lap.glow[i], hint && i === lap.i, lap.armed, S.t);
  };
  function drawGlow(ctx, o, S) { G.Art.W.boilerGlow(ctx, ST.boiler.x, ST.boiler.y, S.heat.v / S.heat.max, S.heat.rush, S.t); }
})(window.G);
