// Capy Springs - the headless bot: a competent player made of the hint system (ARCHITECTURE.md 17.3).
// Movement: straight to the aim point when the way is clear; otherwise the guests' lane rule (to x = 270, along the lane, across),
// plus a short perpendicular escape when pinned against a solid.
'use strict';
module.exports = function makeBot(G) {
  const C = G.C, U = G.U, DATA = G.DATA, ST = DATA.STATIONS, MAP = DATA.MAP, LANE = MAP.LANE;
  const out = { rule: 0, kind: null, id: null, x: 0, y: 0, word: null, dim: false, ref: null, hide: false };
  const A = { x: 0, y: 0 };
  const WP = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  // aimX/aimY stay NaN on purpose: the bot walks straight at its target and only plans a lane route when it is stuck (measured to serve
  // more guests than planning every route; a planned bot lost 3x the guests)
  let mode = 'direct', wpN = 0, wpI = 0, aimX = NaN, aimY = NaN, stuckT = 0, escUntil = -1, escX = 0, escY = 0, buys = 0, escFlip = 1, crossPlanned = false;

  function aim(S, h) {
    if (h.kind === 'bath' || (h.kind === 'station' && S.baths[h.id])) { const d = S.baths[h.id].def.deck; A.x = d.x; A.y = d.y + d.h / 2 - 10; return A; }
    if (h.kind === 'boiler' || h.kind === 'woodpile' || h.kind === 'stall' || (h.kind === 'station' && ST[h.id] && ST[h.id].home)) { const s = ST[h.id]; A.x = s.home.x; A.y = s.home.y; return A; }
    if (h.kind === 'platform') { A.x = MAP.PLATFORM.x; A.y = MAP.PLATFORM.y; return A; }
    A.x = h.x; A.y = h.y; return A;      // tree (already tree.y + 30), lantern step, tray, guest
  }
  // a straight line is "blocked" by solids, and - while guests ride in the trail to the other side of the bridge - by any built deck other
  // than the destination's: walking across a deck drops the guests there (stations react to proximity), so a careful player takes the lane
  // two points on different stages (Deck / Ridge / Summit): the way between them is a bridge or the stairs
  const R0 = MAP.RIDGE, crosses = (ya, yb) => G.Summit ? G.Summit.stage(ya) !== G.Summit.stage(yb) : (!!R0 && (ya < R0.y1) !== (yb < R0.y1));
  function blocked(S, x0, y0, x1, y1) {
    const rects = G.Player.solids(S), r = C.KIT_RADIUS + 1, n = Math.max(1, Math.ceil(U.dist(x0, y0, x1, y1) / 8));
    const crossing = crosses(y0, y1);
    const carrying = crossing && G.Trail.hasKind(S, 'guest'), baths = carrying ? G.Baths.list(S) : null;
    for (let i = 1; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      for (let j = 0; j < rects.length; j++) { const s = rects[j]; if (x > s.x0 - r && x < s.x1 + r && y > s.y0 - r && y < s.y1 + r) return true; }
      if (carrying) for (let j = 0; j < baths.length; j++) { const d = baths[j].def.deck; if (U.defHas(d, x1, y1)) continue; if (U.defHas(d, x, y)) return true; }
    }
    return false;
  }
  function plan(S, ax, ay, force) {
    const k = S.kit;
    if (!force && !blocked(S, k.x, k.y, ax, ay)) { mode = 'direct'; return; }
    mode = 'lane'; wpI = 0; wpN = 0;
    if (Math.abs(k.x - LANE.cx) > 8) { WP[wpN].x = LANE.cx; WP[wpN].y = k.y; wpN++; }
    WP[wpN].x = LANE.cx; WP[wpN].y = ay; wpN++;
    WP[wpN].x = ax; WP[wpN].y = ay; wpN++;
  }
  return {
    buys: () => buys,
    debug: () => mode + ' wp' + wpI + '/' + wpN + ' aim ' + aimX.toFixed(0) + ',' + aimY.toFixed(0) + (escUntil > 0 ? ' esc' : '') + ' wps ' + WP.slice(0, wpN).map(p => p.x.toFixed(0) + ',' + p.y.toFixed(0)).join(' '),
    step(S, dt) {
      const In = G.Input, kit = S.kit;
      if (DATA.KAA && S.kaa.state === 'land' && S.kaa.timer <= DATA.KAA.stay - 1.5) G.Kaa.tap(S, S.kaa.x, S.kaa.y - 22);   // a competent player taps the crow after a beat
      const h = G.Hints.compute(S, out);
      if (h && h.rule === 10) { const u = G.Upgrades.cheapestAffordable(S); if (u && u.id === h.id && G.Upgrades.buy(S, u.id, u.key)) buys++; }
      else if (!h || h.rule === 12) { const u = G.Upgrades.cheapestAffordable(S); if (u && S.coins >= 1.5 * u.cost && G.Upgrades.buy(S, u.id, u.key)) buys++; }
      else { const u = G.Upgrades.cheapestAffordable(S); if (u && S.coins >= 2 * u.cost && G.Upgrades.buy(S, u.id, u.key)) buys++; }   // a competent player taps a station in passing
      if (!h) { In.vec.x = 0; In.vec.y = 0; In.mag = 0; return; }
      const a = aim(S, h);
      if (Math.abs(a.x - aimX) > 12 || Math.abs(a.y - aimY) > 12) { aimX = a.x; aimY = a.y; stuckT = 0; plan(S, a.x, a.y, false); }
      // carrying guests to the other side of the bridge: take the lane once, so no deck on the way steals the line
      const cross = S.built.ridge && crosses(kit.y, a.y);
      if (cross && !crossPlanned && G.Trail.hasKind(S, 'guest') && mode === 'direct') { plan(S, a.x, a.y, false); crossPlanned = true; }
      if (!cross) crossPlanned = false;
      if (S.t < escUntil) { In.vec.x = escX; In.vec.y = escY; In.mag = 1; return; }
      let tx = a.x, ty = a.y;
      if (mode === 'lane') { tx = WP[wpI].x; ty = WP[wpI].y; }
      const dx = tx - kit.x, dy = ty - kit.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 6) {
        if (mode === 'lane') { wpI++; if (wpI >= wpN) mode = 'direct'; }
        In.vec.x = 0; In.vec.y = 0; In.mag = 0; stuckT = 0;
        return;
      }
      In.vec.x = dx / d; In.vec.y = dy / d; In.mag = 1;
      if (!kit.moving && S.t > 1.5) {
        stuckT += dt;
        if (stuckT > 0.35) {
          stuckT = 0;
          if (mode === 'direct') plan(S, a.x, a.y, true);
          else { escFlip = -escFlip; escUntil = S.t + 0.35; escX = -dy / d * escFlip; escY = dx / d * escFlip; }
        }
      } else stuckT = 0;
    }
  };
};
