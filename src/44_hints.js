// Capy Springs - the next arrow: 12 priority rules and the seven one-word prompts (ARCHITECTURE.md 9.12, GDD 10.6).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, ST = DATA.STATIONS, MAP = DATA.MAP, PAL = G.PAL;
  const Hints = G.Hints = {};
  const P = { x: 0, y: 0 };
  // rule order (GDD 10.6, revised after the balance pass): an affordable lantern (LIGHT) outranks LEAD and COLLECT, otherwise
  // a steady stream of guests keeps the arrow on the platform forever and the unlocks never get pointed at.
  const WORDS = { 1: 'SOAK', 2: 'SOAK', 3: 'STOKE', 4: 'YUZU', 5: 'STOKE', 6: 'LIGHT', 7: 'LEAD', 8: 'COLLECT', 9: 'YUZU', 10: 'TAP', 11: 'YUZU', 12: null, 13: 'LAP', 14: 'PLUNGE', 15: 'CLEAR' };
  const wantsPlunge = g => g.want === 'plunge', wantsBath = g => g.want !== 'plunge';
  // what a bath is worth per seat when the arrow picks one: pay, or the whole sauna -> plunge chain once the plunge exists
  function worth(S, b) { return b.def.sauna && S.built.plunge ? (b.def.hintValue || 3.5) : (b.def.payMult || 1); }

  function set(out, rule, kind, id, x, y, ref) { out.rule = rule; out.kind = kind; out.id = id; out.x = x; out.y = y; out.word = WORDS[rule]; out.dim = rule === 12; out.ref = ref || null; out.hide = false; return out; }
  function bathCentre(bath, out) { out.x = bath.def.deck.x; out.y = bath.def.deck.y; return out; }
  // station target point (rules 10 and 12): deck centre for baths, home for the rest
  Hints.stationPoint = function (S, id, out) {
    if (S.baths[id]) return bathCentre(S.baths[id], out);
    const st = ST[id]; if (st && st.home) { out.x = st.home.x; out.y = st.home.y; return out; }
    out.x = S.kit.x; out.y = S.kit.y; return out;
  };

  Hints.compute = function (S, out) {
    const kit = S.kit, Trail = G.Trail, Baths = G.Baths, Lanterns = G.Lanterns, Upg = G.Upgrades, Grove = G.Grove;
    const nPlunge = Trail.countGuests(S, wantsPlunge), nBath = Trail.countGuests(S, wantsBath), hasGuest = nPlunge + nBath > 0, baths = Baths.list(S);
    // 1. SOAK (chain): a Splash Chain is live and a warm bath with a free seat exists (one that takes who we carry)
    if (hasGuest && S.t - S.splash.t < C.SPLASH_WINDOW) {
      let best = null, bd = Infinity;
      for (let i = 0; i < baths.length; i++) { const b = baths[i]; if (!Baths.isWarm(S, b) || Baths.freeSlot(S, b) < 0) continue; if (b.def.plungeOnly ? nPlunge === 0 : nBath === 0) continue; const d = U.dist2(kit.x, kit.y, b.def.deck.x, b.def.deck.y); if (d < bd) { bd = d; best = b; } }
      if (best) { bathCentre(best, P); set(out, best.def.plungeOnly ? 14 : 1, 'bath', best.id, P.x, P.y); out.hide = Baths.inZone(best, kit.x, kit.y); return out; }
    }
    // 14. PLUNGE: sauna guests in the line, their hot-cold window ticking -> the Cold Plunge
    if (nPlunge > 0 && S.built.plunge && S.baths.plunge) { const b = S.baths.plunge; bathCentre(b, P); set(out, 14, 'bath', 'plunge', P.x, P.y); out.hide = Baths.inZone(b, kit.x, kit.y) && Baths.freeSlot(S, b) >= 0; return out; }
    // 2. SOAK: the warm bath worth the most for the line (seats that fit x what a seat pays here, discounted by distance so a far station
    //    must be clearly better); else the one whose next seat frees soonest
    if (nBath > 0) {
      let best = null, bs = -1, bd = Infinity;
      for (let i = 0; i < baths.length; i++) { const b = baths[i]; if (b.def.plungeOnly || !Baths.isWarm(S, b)) continue; const d = U.dist2(kit.x, kit.y, b.def.deck.x, b.def.deck.y); const s = Math.min(Baths.freeSlots(S, b), nBath) * worth(S, b) * (800 / (800 + Math.sqrt(d))); if (s > bs || (s === bs && d < bd)) { bs = s; bd = d; best = b; } }
      if (best && bs <= 0) { let bt = Infinity; best = null; for (let i = 0; i < baths.length; i++) { const b = baths[i]; if (b.def.plungeOnly || !Baths.isWarm(S, b)) continue; const t = Baths.nextFreeIn(S, b); if (t < bt) { bt = t; best = b; } } }
      if (!best) for (let i = 0; i < baths.length; i++) if (!baths[i].def.plungeOnly) { best = baths[i]; break; }
      if (best) { bathCentre(best, P); set(out, 2, 'bath', best.id, P.x, P.y); out.hide = Baths.inZone(best, kit.x, kit.y) && Baths.freeSlot(S, best) >= 0; return out; }
    }
    // 3. STOKE: logs in the trail - urgent only while heat is low or cold; otherwise the logs ride along (deferred below, after COLLECT)
    const hasLog = Trail.hasKind(S, 'log') && S.heat.v < S.heat.max;
    const urgent = S.heat.cold || (!DATA.LAP && S.heat.v < C.STOKE_HINT_BELOW);        // with a lap on the map, only COLD skips the lap
    if (hasLog && urgent) return set(out, 3, 'boiler', 'boiler', ST.boiler.home.x, ST.boiler.home.y);
    // 13. LAP (season mechanic): fuel in the trail -> the next stepping stone until a lap is banked, then straight to the burner
    if (DATA.LAP && S.built.boiler && hasLog) {
      if (!S.lap.armed && S.heat.v < C.HEAT_RUSH) { const st = DATA.LAP.stones[S.lap.i]; return set(out, 13, 'stone', null, st[0], st[1]); }
      return set(out, 3, 'boiler', 'boiler', ST.boiler.home.x, ST.boiler.home.y);
    }
    // 4. YUZU: yuzu in the trail
    if (Trail.hasKind(S, 'yuzu')) {
      let best = null, bd = Infinity;
      const up = MAP.RIDGE && kit.y < MAP.RIDGE.y1;                   // a yuzu goes to a bath on Kit's side of the bridge; never to the plunge
      for (let i = 0; i < baths.length; i++) { const b = baths[i]; if (b.yuzuT > 0 || b.def.plungeOnly) continue; const d = U.dist2(kit.x, kit.y, b.def.deck.x, b.def.deck.y) + ((MAP.RIDGE && (b.def.deck.y < MAP.RIDGE.y1) !== up) ? 1e9 : 0); if (d < bd) { bd = d; best = b; } }
      if (best && bd >= 1e9) best = null;
      if (best) { bathCentre(best, P); set(out, 4, 'bath', best.id, P.x, P.y); out.hide = Baths.inZone(best, kit.x, kit.y); return out; }
      if (S.built.stall && G.Stall.room(S)) return set(out, 4, 'stall', 'stall', ST.stall.home.x, ST.stall.home.y);
    }
    // 5. STOKE: heat is low
    if (S.built.boiler && S.heat.graceT === 0 && S.heat.v < C.STOKE_HINT_BELOW && !S.heat.rush && !Trail.hasKind(S, 'log')) return set(out, 5, 'woodpile', 'woodpile', ST.woodpile.home.x, ST.woodpile.home.y);
    // 6. LIGHT: an affordable lantern (a 1-2 s detour; outranks leading the next guest)
    const lid = Lanterns.cheapestAffordable(S);
    if (lid) { Lanterns.pos(lid, P); return set(out, 6, 'lantern', lid, P.x, P.y); }
    // 7. LEAD: guests waiting on the platform
    if (G.Guests.countWaiting(S) > 0 && !Trail.full(S)) {
      const g = G.Guests.nearestWaiting(S, kit.x, kit.y, 1e9, true);
      if (g) return set(out, 7, 'guest', null, g.x, g.y, g);
      return set(out, 7, 'platform', 'platform', MAP.PLATFORM.x, MAP.PLATFORM.y);
    }
    // 8. COLLECT: a tray holding >= 5 within 400 px
    const tray = G.Coins.richestTray(S, kit.x, kit.y, 400, null);
    if (tray && tray.value >= C.COIN_BADGE_MIN) return set(out, 8, 'tray', tray.id, tray.x, tray.y);
    // 3 (deferred). STOKE: drop the logs we happen to carry
    if (hasLog) return set(out, 3, 'boiler', 'boiler', ST.boiler.home.x, ST.boiler.home.y);
    // 15. CLEAR: a snowdrift nearby on the Ridge's paths (a small job between cars, never urgent)
    if (G.Snow) { const d = G.Snow.nearestDrift(S, kit.x, kit.y, 300); if (d) return set(out, 15, 'drift', null, d.x, d.y, d); }
    // 9. YUZU (stall): a queued guest, nothing cooking, a ripe yuzu
    if (S.built.stall && G.Stall.queued(S) > 0 && S.stall.stock + S.stall.pending === 0 && Grove.ripeCount(S) > 0 && Grove.canPick(S)) {
      const t = Grove.nearestRipe(S, kit.x, kit.y); if (t) return set(out, 9, 'tree', null, t.x, t.y + 30, t);
    }
    // 10. TAP: an affordable sheet upgrade
    if (G.Seasons.firstLit(S)) { const u = Upg.cheapestAffordable(S); if (u) { Hints.stationPoint(S, u.id, P); return set(out, 10, 'station', u.id, P.x, P.y); } }
    // 11. YUZU: a ripe yuzu can be picked
    if (S.built.grove && Grove.ripeCount(S) > 0 && Grove.canPick(S)) { const t = Grove.nearestRipe(S, kit.x, kit.y); if (t) return set(out, 11, 'tree', null, t.x, t.y + 30, t); }
    // 12. dim: the cheapest revealed lantern, else the cheapest upgrade
    const rid = Lanterns.cheapestRevealed(S);
    if (rid) { Lanterns.pos(rid, P); return set(out, 12, 'lantern', rid, P.x, P.y); }
    const any = Upg.cheapestAny(S);
    if (any) { Hints.stationPoint(S, any.id, P); return set(out, 12, 'station', any.id, P.x, P.y); }
    return null;
  };

  Hints.update = function (S, dt) {
    const obj = S.ui.arrowObj, h = Hints.compute(S, obj);
    if (h) {
      if (h.rule !== S.ui.lastRule) {
        S.ui.lastRule = h.rule;
        if (h.word && S.tutorial[h.word] < 2) { S.tutorial[h.word]++; obj.showWord = true; } else obj.showWord = false;
      }
      obj.idle = S.kit.idleT >= C.ARROW_IDLE;
      S.ui.arrow = obj;
    } else { S.ui.arrow = null; S.ui.lastRule = 0; }
    if (S.ui.arrowFlash) { S.ui.arrowFlash.t -= dt; if (S.ui.arrowFlash.t <= 0) S.ui.arrowFlash = null; }
  };
  Hints.drawWorld = function (ctx, S) {
    const a = S.ui.arrow, kit = S.kit, FXA = G.Art.FX;
    let tx, ty, alpha, scale, dim = false, word = null;
    if (S.ui.arrowFlash) { Hints.stationPoint(S, S.ui.arrowFlash.id, P); tx = P.x; ty = P.y; alpha = 1; scale = 1.2; }
    else if (a && !a.hide) { tx = a.x; ty = a.y; dim = a.dim; alpha = dim ? 0.45 : a.idle ? 1 : 0.7; scale = a.idle && !dim ? 1.2 : 1; word = a.showWord ? a.word : null; }
    else return;
    const ax = kit.x, ay = kit.y - 52 - 46 + Math.sin(S.t * Math.PI * 6) * 4;
    const ang = Math.atan2(ty - ay, tx - ax);
    if (U.dist2(tx, ty, kit.x, kit.y) < 100) return;
    FXA.arrow(ctx, ax, ay, ang, alpha, scale);
    if (word && !S.ui.banner) G.Art.S.text(ctx, G.Seasons.word(word), ax, ay - 22 - 14, 34, PAL.cta, WORD_OPTS);   // tutorial keys stay canonical; the season picks the wording
  };
  const WORD_OPTS = { stroke: PAL.cream, lw: 4 };
})(window.G);
