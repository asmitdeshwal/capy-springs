// Capy Springs - baths: seats, plops, the global Splash Chain, soak, yuzu hats, payout, water drawing (ARCHITECTURE.md 9.5, GDD 5.2 / 5.4 / 8.1).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, PAL = G.PAL;
  const Baths = G.Baths = {};
  const LIST = [], HP = { x: 0, y: 0, z: 0 }, SP = { x: 0, y: 0 };
  const evSplash = { bath: null, g: null, count: 0, mult: 1 }, evSeated = { g: null, bath: null }, evHeart = { g: null }, evCold = { bath: null }, evYuzu = { bath: null };
  const WSTATE = { cold: false, yuzu: false, lowFx: false };

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
    g.squashT = C.SQUASH_T; g.heartT = 0; g.sleepy = 0;
    if (sp.count === 3 && !sp.c3) { sp.c3 = true; S.stats.combos[3]++; }
    if (sp.count === 4 && !sp.c4) { sp.c4 = true; S.stats.combos[4]++; }
    if (sp.count === 5 && !sp.c5) { sp.c5 = true; S.stats.combos[5]++; }
    evSplash.bath = bath; evSplash.g = g; evSplash.count = sp.count; evSplash.mult = sp.mult; G.Bus.emit('splash', evSplash);
    evSeated.g = g; evSeated.bath = bath; G.Bus.emit('guest:seated', evSeated);
  };
  Baths.payout = function (S, g) {
    const bath = S.baths[g.bathId], base = DATA.GUESTS[g.kind].pay * (bath.def.payMult || 1);     // a season may price its stations differently
    const ev = (g.batch ? g.batch.mult : 1) * Math.max(g.yuzuHat ? C.YUZU_PAY : 1, g.golden ? C.GOLDEN_PAY : 1) * G.Heat.payMult(S, bath) * (S.night.active ? C.NIGHT_PAY : 1);
    return Math.round(base * G.Upgrades.payMult(S, bath.id) * G.Upgrades.famousMult(S) * G.Upgrades.starMult(S) * Math.min(C.MULT_CAP, ev));
  };
  Baths.applyYuzu = function (S, bath) {
    if (bath.yuzuT > 0 && bath.yuzuT >= C.YUZU_REFRESH_BELOW) return false;
    if (!G.Trail.takeFirst(S, 'yuzu')) return false;
    bath.yuzuT = G.Upgrades.yuzuDur(S);
    const n = Baths.slotCount(S, bath); for (let i = 0; i < n; i++) if (bath.slots[i]) bath.slots[i].yuzuHat = true;
    evYuzu.bath = bath; G.Bus.emit('yuzu:apply', evYuzu);
    return true;
  };
  Baths.notGoldenCount = function (S) { let n = 0; for (let i = 0; i < DATA.BATHS.length; i++) { const b = S.baths[DATA.BATHS[i].id]; if (S.built[b.id] && b.yuzuT <= 0) n++; } return n; };
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
            if (slot >= 0 && S.t - bath.lastPlop >= C.PLOP_GAP) { const node = Trail.takeFirst(S, 'guest'); if (node) { Baths.plop(S, bath, node.ref, slot); bath.lastPlop = S.t; } }
          } else if (!bath.coldOnce) { bath.coldOnce = true; evCold.bath = bath; G.Bus.emit('ui:cold-refusal', evCold); }
        }
        if (Trail.hasKind(S, 'yuzu') && (bath.yuzuT <= 0 || bath.yuzuT < C.YUZU_REFRESH_BELOW)) Baths.applyYuzu(S, bath);
      } else bath.coldOnce = false;
      // seated guests
      const n = bath.slots.length, rushM = Baths.rushHere(S, bath) ? C.RUSH_SOAK : 1;
      let occ = false;
      for (let i = 0; i < n; i++) {
        const g = bath.slots[i]; if (!g) continue;
        occ = true;
        if (g.hop) {
          const h = g.hop; h.t += dt; U.hopPos(h, HP); g.x = HP.x; g.y = HP.y; g.z = HP.z;
          if (h.t >= h.dur) { g.hop = null; g.z = 0; g.x = h.x1; g.y = h.y1; Baths.land(S, bath, g); }
          continue;
        }
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
      if (occ && warm && bath.rippleT >= C.RIPPLE_EVERY) { bath.rippleT = 0; for (let i = 0; i < n; i++) { const g = bath.slots[i]; if (g && !g.hop) G.FX.ripple(S, g.x, g.y + 6, bath.yuzuT > 0); } }
      // steam
      if (warm) {
        const rate = rushM > 1 ? C.STEAM_RATE_RUSH : occ ? C.STEAM_RATE : 1;
        bath.steamT += dt * rate;
        if (bath.steamT >= 1) { bath.steamT -= 1; const w = bath.def.water; G.FX.steam(S, w.x + (U.hash(S.t, bi) - 0.5) * w.w * 0.8, w.y + (U.hash(bi, S.t) - 0.5) * w.h * 0.6, 8 + U.hash(S.t * 3, bi) * 8, 0.4); }
      }
    }
  };
  Baths.collect = function (S, list) { /* baths push nothing: decks are static, water is ground */ };
  Baths.drawGround = function (ctx, S) {
    const cam = G.Camera, H = G.Canvas.H, W = G.Art.W, Ch = G.Art.Ch;
    for (let bi = 0; bi < DATA.BATHS.length; bi++) {
      const bath = S.baths[DATA.BATHS[bi].id]; if (!S.built[bath.id]) continue;
      const d = bath.def; if (d.water.y + d.water.h < cam.y - 40 || d.water.y - d.water.h > cam.y + H + 40) continue;
      WSTATE.cold = !Baths.isWarm(S, bath); WSTATE.yuzu = bath.yuzuT > 0; WSTATE.lowFx = !!S.settings.lowFx;
      W.water(ctx, d, WSTATE, S.t);
      const n = bath.slots.length;
      for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {           // back row first
        const g = bath.slots[i]; if (!g || g.hop) continue;
        const back = n > 4 ? (i & 1) === 1 : false; if ((pass === 0) !== back) continue;
        const p = G.Guests.fillPose(S, g, Ch.resetPose(Ch.POSE));
        p.inWater = d.water; p.sink = g.sleepy * 4; p.lid = g.sleepy >= 1 ? 3 : g.sleepy >= 0.66 ? 2 : g.sleepy >= 0.33 ? 1 : 0; p.moving = false;
        Ch.guest(ctx, p, g.kind);
      }
      if (bath.yuzuT > 0) W.floatingYuzu(ctx, d, S.t);
      for (let i = 0; i < n; i++) { const g = bath.slots[i]; if (!g || g.hop) continue; W.soakRing(ctx, g.x, g.y - 34, 1 - g.soakT / g.soakMax); }
      // hopping guests are drawn over the water (they are airborne)
      for (let i = 0; i < n; i++) { const g = bath.slots[i]; if (g && g.hop) { const p = G.Guests.fillPose(S, g, Ch.resetPose(Ch.POSE)); Ch.guest(ctx, p, g.kind); } }
    }
  };
})(window.G);
