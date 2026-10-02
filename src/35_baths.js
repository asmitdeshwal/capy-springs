// Capy Springs - baths: seats, plops, the global Splash Chain, soak, yuzu hats, payout, water drawing (ARCHITECTURE.md 9.5, GDD 5.2 / 5.4 / 8.1).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, PAL = G.PAL;
  const Baths = G.Baths = {};
  const LIST = [], HP = { x: 0, y: 0, z: 0 }, SP = { x: 0, y: 0 };
  const evSplash = { bath: null, g: null, count: 0, mult: 1 }, evSeated = { g: null, bath: null }, evHeart = { g: null }, evCold = { bath: null }, evYuzu = { bath: null }, evPlunge = { g: null, bath: null, hot: false };
  const evGong = { bath: null, n: 0, full: false }, evGeyser = { bath: null, first: false }, evGTick = { bath: null, n: 0 };
  const CONES = {};                              // drawables: the Source's geyser cone with its countdown ring
  const GONGS = {}, TSURUS = {};              // drawables for pavilion baths: the gong stand with its countdown, Madame Tsuru behind the chairs
  const WSTATE = { cold: false, yuzu: false, lowFx: false, burst: 0, awake: false, crack: 0 };

  Baths.init = function (S) { LIST.length = 0; };
  Baths.list = function (S) { LIST.length = 0; for (let i = 0; i < DATA.BATHS.length; i++) { const id = DATA.BATHS[i].id; if (S.built[id]) LIST.push(S.baths[id]); } return LIST; };
  Baths.get = (S, id) => S.baths[id];
  Baths.isWarm = (S, bath) => !bath.def.heated || !S.heat.cold;
  Baths.rushHere = (S, bath) => S.heat.rush && bath.def.heated;
  Baths.slotCount = (S, bath) => G.Upgrades.slots(S, bath.id);
  Baths.freeSlots = function (S, bath) { const n = Baths.slotCount(S, bath); let f = 0; for (let i = 0; i < n; i++) if (!bath.slots[i]) f++; return f; };
  Baths.freeSlot = function (S, bath) { const n = Baths.slotCount(S, bath); for (let i = 0; i < n; i++) if (!bath.slots[i]) return i; return -1; };
  Baths.nextFreeIn = function (S, bath) {
    if (Baths.freeSlot(S, bath) >= 0) return 0;
    let best = Infinity; const n = Baths.slotCount(S, bath), m = Baths.rushHere(S, bath) ? C.RUSH_SOAK : 1;
    for (let i = 0; i < n; i++) { const g = bath.slots[i]; if (g) best = Math.min(best, g.hop ? g.soakMax : g.soakT / m); }
    if (bath.def.gong && !bath.session) best += bath.gongT;          // chairs taken before the gong stay taken until the gong and the massage after it
    return best;
  };
  Baths.slotPos = function (bath, i, n, out) {
    const w = bath.def.water, inset = C.SLOT_INSET;
    if (n <= 4) { out.y = w.y + 8; out.x = n === 1 ? w.x : w.x - w.w / 2 + inset + (w.w - 2 * inset) * i / (n - 1); return out; }
    const back = (i & 1) === 1, row = back ? Math.floor(i / 2) : i / 2, rowN = back ? Math.floor(n / 2) : Math.ceil(n / 2), rinset = inset + (back ? 18 : 0);
    out.y = back ? w.y - 6 : w.y + 16;
    out.x = rowN === 1 ? w.x : w.x - w.w / 2 + rinset + (w.w - 2 * rinset) * row / (rowN - 1);
    return out;
  };
  Baths.inZone = (bath, x, y) => U.defHas(bath.def.deck, x, y);
  // the Cold Plunge takes only guests fresh out of the sauna; every other station takes everyone else
  Baths.accepts = (S, bath, g) => bath.def.plungeOnly ? g.want === 'plunge' : g.want !== 'plunge';
  const wantsPlunge = g => g.want === 'plunge', wantsBath = g => g.want !== 'plunge';
  Baths.trailFor = (S, bath) => G.Trail.countGuests(S, bath.def.plungeOnly ? wantsPlunge : wantsBath);
  Baths.soakTime = function (S, bath, g) { const base = g.tutorial ? C.TUTORIAL_SOAK : G.Upgrades.soak(S, bath.id); return base * DATA.GUESTS[g.kind].soakMult; };
  Baths.plop = function (S, bath, g, slot) {
    const n = Baths.slotCount(S, bath); Baths.slotPos(bath, slot, n, SP);
    const h = g.hopObj; h.x0 = g.x; h.y0 = g.y; h.x1 = SP.x; h.y1 = SP.y; h.t = 0; h.dur = C.PLOP_T; h.h = 24;
    bath.slots[slot] = g;
    G.Guests.seat(S, g, bath.id, slot, h);
    g.face = SP.x < g.x ? -1 : 1;
  };
  Baths.land = function (S, bath, g) {
    let sp = S.splash;
    if (S.t - sp.t <= C.SPLASH_WINDOW) sp.count++;
    else { sp = S.splash = { count: 1, t: S.t, mult: 1, bathId: null, c3: false, c4: false, c5: false }; }
    sp.t = S.t; sp.bathId = bath.id; sp.mult = C.SPLASH_MULT[Math.min(sp.count, 5)]; g.batch = sp;
    g.soakMax = g.soakT = Baths.soakTime(S, bath, g);
    g.yuzuHat = g.yuzuHat || bath.yuzuT > 0;
    g.squashT = C.SQUASH_T; g.heartT = 0; g.sleepy = 0; g.inSession = false; g.fullHouse = false;
    g.burst = !!bath.def.geyser && bath.burstT > 0; if (g.burst) S.stats.bursts++;     // landed while the geyser blows: x2
    if (sp.count > S.stats.bestSplash) S.stats.bestSplash = sp.count;
    if (bath.def.plungeOnly) {                                   // the hot-cold moment: in the window since the sauna = x2
      g.hotCold = g.plungeT <= C.PLUNGE_WINDOW; S.stats.plunges++; if (g.hotCold) S.stats.hotCold++;
      evPlunge.g = g; evPlunge.bath = bath; evPlunge.hot = g.hotCold; G.Bus.emit('plunge', evPlunge);
    }
    if (sp.count === 3 && !sp.c3) { sp.c3 = true; S.stats.combos[3]++; }
    if (sp.count === 4 && !sp.c4) { sp.c4 = true; S.stats.combos[4]++; }
    if (sp.count === 5 && !sp.c5) { sp.c5 = true; S.stats.combos[5]++; }
    evSplash.bath = bath; evSplash.g = g; evSplash.count = sp.count; evSplash.mult = sp.mult; G.Bus.emit('splash', evSplash);
    evSeated.g = g; evSeated.bath = bath; G.Bus.emit('guest:seated', evSeated);
  };
  Baths.payout = function (S, g) {
    const bath = S.baths[g.bathId], base = DATA.GUESTS[g.kind].pay * (bath.def.payMult || 1);     // a season may price its stations differently
    const ev = (g.batch ? g.batch.mult : 1) * Math.max(g.yuzuHat ? C.YUZU_PAY : 1, g.golden ? C.GOLDEN_PAY : 1) * G.Heat.payMult(S, bath) * G.Events.nightPay(S) * (g.hotCold ? C.HOTCOLD_PAY : 1) * (g.fullHouse ? (bath.def.fullHouse || 1) : 1) * (g.burst ? C.BURST_PAY : 1);
    return Math.round(base * G.Upgrades.payMult(S, bath.id) * G.Upgrades.famousMult(S) * G.Upgrades.starMult(S) * Math.min(C.MULT_CAP, ev));
  };
  Baths.applyYuzu = function (S, bath) {
    if (bath.yuzuT > 0 && bath.yuzuT >= C.YUZU_REFRESH_BELOW) return false;
    if (!G.Trail.takeFirst(S, 'yuzu')) return false;
    bath.yuzuT = G.Upgrades.yuzuDur(S); S.stats.yuzu++;
    const n = Baths.slotCount(S, bath); for (let i = 0; i < n; i++) if (bath.slots[i]) bath.slots[i].yuzuHat = true;
    evYuzu.bath = bath; G.Bus.emit('yuzu:apply', evYuzu);
    return true;
  };
  Baths.notGoldenCount = function (S) { let n = 0; for (let i = 0; i < DATA.BATHS.length; i++) { const b = S.baths[DATA.BATHS[i].id]; if (S.built[b.id] && !b.def.plungeOnly && b.yuzuT <= 0) n++; } return n; };
  Baths.occupiedHeated = function (S) { for (let i = 0; i < DATA.BATHS.length; i++) { const b = S.baths[DATA.BATHS[i].id]; if (S.built[b.id] && b.def.heated && b.occupied) return true; } return false; };

  Baths.update = function (S, dt) {
    const kit = S.kit, Trail = G.Trail;
    for (let bi = 0; bi < DATA.BATHS.length; bi++) {
      const bath = S.baths[DATA.BATHS[bi].id]; if (!S.built[bath.id]) continue;
      const warm = Baths.isWarm(S, bath);
      if (bath.yuzuT > 0) bath.yuzuT -= dt;
      // drop-off
      if (Baths.inZone(bath, kit.x, kit.y)) {
        if (Trail.hasKind(S, 'guest')) {
          if (warm) {
            bath.coldOnce = false;
            const slot = Baths.freeSlot(S, bath);
            if (slot >= 0 && S.t - bath.lastPlop >= C.PLOP_GAP) {
              const node = Trail.takeFirstGuest(S, bath.def.plungeOnly ? wantsPlunge : wantsBath);   // no closure per frame
              if (node) { Baths.plop(S, bath, node.ref, slot); bath.lastPlop = S.t; }
              else if (!bath.refusedOnce) { bath.refusedOnce = true; evCold.bath = bath; G.Bus.emit('ui:cold-refusal', evCold); }   // nobody in the line belongs here
            }
          } else if (!bath.coldOnce) { bath.coldOnce = true; evCold.bath = bath; G.Bus.emit('ui:cold-refusal', evCold); }
        }
        if (Trail.hasKind(S, 'yuzu') && !bath.def.plungeOnly && (bath.yuzuT <= 0 || bath.yuzuT < C.YUZU_REFRESH_BELOW)) Baths.applyYuzu(S, bath);
      } else { bath.coldOnce = false; bath.refusedOnce = false; }
      // the pavilion's gong: seated guests wait for it, then everyone is massaged together (FULL HOUSE when every chair is taken)
      if (bath.def.gong) {
        bath.gongT -= dt;
        if (bath.gongT <= 0) {
          bath.gongT += bath.def.gong;
          if (!bath.session) {
            let seated = 0; const cap = Baths.slotCount(S, bath);
            for (let i = 0; i < cap; i++) if (bath.slots[i] && !bath.slots[i].hop) seated++;
            if (seated > 0) {
              const full = seated >= cap; bath.session = true; bath.sparkT = 0;
              for (let i = 0; i < cap; i++) { const g = bath.slots[i]; if (g && !g.hop) { g.fullHouse = full; g.inSession = true; g.soakMax = g.soakT = Baths.soakTime(S, bath, g); } }
              S.stats.massages += seated; if (full) S.stats.fullHouses++;
              evGong.bath = bath; evGong.n = seated; evGong.full = full; G.Bus.emit('gong', evGong);
            }
          }
        }
        if (bath.session) { bath.sparkT += dt; if (bath.sparkT >= 0.5) { bath.sparkT = 0; const cap = Baths.slotCount(S, bath); for (let i = 0; i < cap; i++) { const g = bath.slots[i]; if (g && g.inSession) G.FX.sparkle(S, g.x, g.y - 24, 1); } } }
      }
      // the Source's geyser: a countdown, three ticks, then a burst; guests who LAND during the burst pay x2
      if (bath.def.geyser) {
        const gy = bath.def.geyser;
        if (bath.burstT > 0) bath.burstT = Math.max(0, bath.burstT - dt);
        bath.geyserT -= dt * (S.night.festival ? 2 : 1);
        const tick = Math.ceil(bath.geyserT); if (tick !== bath.tick) { bath.tick = tick; if (tick >= 1 && tick <= 3) { evGTick.bath = bath; evGTick.n = tick; G.Bus.emit('geyser:tick', evGTick); } }
        if (bath.geyserT <= 0) { bath.geyserT += gy.every; bath.burstT = gy.dur; S.stats.geysers++; evGeyser.bath = bath; evGeyser.first = S.stats.geysers === 1; G.Bus.emit('geyser', evGeyser); }
      }
      // seated guests
      const n = bath.slots.length, rushM = Baths.rushHere(S, bath) ? C.RUSH_SOAK : 1;
      let occ = false, massaging = false;
      for (let i = 0; i < n; i++) {
        const g = bath.slots[i]; if (!g) continue;
        occ = true;
        if (g.hop) {
          const h = g.hop; h.t += dt; U.hopPos(h, HP); g.x = HP.x; g.y = HP.y; g.z = HP.z;
          if (h.t >= h.dur) { g.hop = null; g.z = 0; g.x = h.x1; g.y = h.y1; Baths.land(S, bath, g); }
          continue;
        }
        // in the pavilion a guest waits (relaxed, no timer) until a gong puts them in a session; latecomers wait for the next one
        if (bath.def.gong && !g.inSession) { g.shiver = false; g.heartT += dt; if (g.heartT >= C.HEART_EVERY) { g.heartT = 0; evHeart.g = g; G.Bus.emit('guest:heart', evHeart); } continue; }
        if (bath.def.gong) massaging = true;
        if (warm) {
          g.shiver = false;
          g.soakT -= dt * rushM;
          g.heartT += dt; if (g.heartT >= C.HEART_EVERY) { g.heartT = 0; evHeart.g = g; G.Bus.emit('guest:heart', evHeart); }
          g.sleepy = U.clamp(1 - g.soakT / g.soakMax, 0, 1);
          bath.rippleT += dt;
          if (g.soakT <= 0) { bath.slots[i] = null; G.Guests.finishSoak(S, g, bath); }
        } else g.shiver = true;
      }
      bath.occupied = occ;
      if (bath.session && !massaging) bath.session = false;                               // the last massage finished: the chairs are free until the next gong
      if (occ && warm && bath.rippleT >= C.RIPPLE_EVERY && !bath.def.gong) { bath.rippleT = 0; for (let i = 0; i < n; i++) { const g = bath.slots[i]; if (g && !g.hop) G.FX.ripple(S, g.x, g.y + 6, bath.yuzuT > 0); } }
      // steam (not from the pavilion)
      if (warm && !bath.def.gong) {
        const rate = (rushM > 1 || bath.burstT > 0) ? C.STEAM_RATE_RUSH : occ ? C.STEAM_RATE : 1;
        bath.steamT += dt * rate;
        if (bath.steamT >= 1) { bath.steamT -= 1; const w = bath.def.water; G.FX.steam(S, w.x + (U.hash(S.t, bi) - 0.5) * w.w * 0.8, w.y + (U.hash(bi, S.t) - 0.5) * w.h * 0.6, 8 + U.hash(S.t * 3, bi) * 8, 0.4); }
      }
    }
  };
  // decks are static and water is ground; a pavilion adds its gong stand and Madame Tsuru to the sorted pass
  Baths.collect = function (S, list) {
    for (let bi = 0; bi < DATA.BATHS.length; bi++) {
      const d = DATA.BATHS[bi]; if (!d.geyser || !S.built[d.id] || !G.Camera.visibleY(d.coneAt.y, 200)) continue;
      if (!CONES[d.id]) CONES[d.id] = { id: d.id, def: d, sortY: d.coneAt.y, draw: drawCone };
      list.push(CONES[d.id]);
    }
    for (let bi = 0; bi < DATA.BATHS.length; bi++) {
      const d = DATA.BATHS[bi]; if (!d.gong || !S.built[d.id] || !G.Camera.visibleY(d.deck.y, 160)) continue;
      if (!GONGS[d.id]) { GONGS[d.id] = { id: d.id, def: d, sortY: d.gongAt.y, draw: drawGong }; TSURUS[d.id] = { id: d.id, def: d, sortY: d.tsuruAt.y, draw: drawTsuru }; }
      list.push(GONGS[d.id]); list.push(TSURUS[d.id]);
    }
  };
  function drawCone(ctx, o, S) {
    const b = S.baths[o.id], gy = o.def.geyser, W = G.Art.W, c = o.def.coneAt;
    if (!W.geyserCone) return;
    W.geyserCone(ctx, c.x, c.y, b.burstT > 0 ? 1 : U.clamp(1 - b.geyserT / gy.every, 0, 1), b.burstT > 0 ? Math.min(1, b.burstT / 0.6, (gy.dur - b.burstT) / 0.25 + 0.2) : 0, S.t, !!S.settings.lowFx);
    if (b.burstT <= 0 && b.geyserT <= 3 && b.geyserT > 0) G.Art.S.pill(ctx, c.x, c.y - 96, 40, 30, String(Math.ceil(b.geyserT)), 20, PAL.cream, PAL.cta, null);   // 3, 2, 1
  }
  function drawGong(ctx, o, S) { const b = S.baths[o.id], d = o.def; G.Art.W.gong(ctx, d.gongAt.x, d.gongAt.y, 1 - b.gongT / d.gong, b.session, S.t); }
  function drawTsuru(ctx, o, S) {
    const b = S.baths[o.id], d = o.def, Ch = G.Art.Ch, p = Ch.resetPose(Ch.POSE);
    p.x = d.tsuruAt.x; p.y = d.tsuruAt.y; p.face = 1; p.t = S.t; p.pose = b.session ? 'massage' : null; p.poseT = S.t;
    Ch.tsuru(ctx, p);
  }
  Baths.drawGround = function (ctx, S) {
    const cam = G.Camera, H = G.Canvas.H, W = G.Art.W, Ch = G.Art.Ch;
    for (let bi = 0; bi < DATA.BATHS.length; bi++) {
      const bath = S.baths[DATA.BATHS[bi].id]; if (!S.built[bath.id]) continue;
      const d = bath.def; if (d.water.y + d.water.h < cam.y - 40 || d.water.y - d.water.h > cam.y + H + 40) continue;
      WSTATE.cold = !Baths.isWarm(S, bath); WSTATE.yuzu = bath.yuzuT > 0; WSTATE.lowFx = !!S.settings.lowFx;
      WSTATE.burst = d.geyser ? U.clamp(bath.burstT / 0.8, 0, 1) : 0; WSTATE.awake = !!S.built.awake; WSTATE.crack = (d.geyser && G.Finale && G.Finale.crack) ? G.Finale.crack : 0;
      W.water(ctx, d, WSTATE, S.t);
      if (G.Finale && G.Finale.active) continue;                                   // the ending's cast sits in the water instead
      const n = bath.slots.length;
      for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {           // back row first
        const g = bath.slots[i]; if (!g || g.hop) continue;
        const back = n > 4 ? (i & 1) === 1 : false; if ((pass === 0) !== back) continue;
        const p = G.Guests.fillPose(S, g, Ch.resetPose(Ch.POSE));
        p.inWater = d.water; p.sink = d.gong ? 0 : g.sleepy * 4; p.lid = g.sleepy >= 1 ? 3 : g.sleepy >= 0.66 ? 2 : g.sleepy >= 0.33 ? 1 : 0; p.moving = false;
        if (d.gong && g.inSession) p.lid = 2;                                              // eyes half closed under Tsuru's hands
        Ch.guest(ctx, p, g.kind);
      }
      if (bath.yuzuT > 0) W.floatingYuzu(ctx, d, S.t);
      for (let i = 0; i < n; i++) { const g = bath.slots[i]; if (!g || g.hop || (d.gong && !g.inSession)) continue; W.soakRing(ctx, g.x, g.y - 34, 1 - g.soakT / g.soakMax); }   // waiting for the gong shows no ring
      // hopping guests are drawn over the water (they are airborne)
      for (let i = 0; i < n; i++) { const g = bath.slots[i]; if (g && g.hop) { const p = G.Guests.fillPose(S, g, Ch.resetPose(Ch.POSE)); Ch.guest(ctx, p, g.kind); } }
    }
  };
})(window.G);
