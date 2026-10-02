// Capy Springs - the Summit (GDD 20): the third stage above the clouds, opened by the Pilgrim Stairs; the snow-monkey troupe that hops down the cliff
// onto its ledge once the Source exists; Grandma Yuzu at her hut once the story is complete. Mirrors 47_ridge.js and 49_lift.js; nothing below moves.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, MAP = DATA.MAP, SU = MAP.SUMMIT || null, TR = MAP.TROUPE || null;
  const Summit = G.Summit = {};
  const evNone = {};

  Summit.has = () => !!SU;
  Summit.isOpen = S => !!(SU && S.built.summit);
  Summit.open = function (S, opts) {
    if (!SU || S.built.summit) return;
    S.built.summit = true;
    if (G.Render.markStaticDirty) G.Render.markStaticDirty();
    G.Player.markSolidsDirty();
    if (!(opts && opts.silent)) G.Bus.emit('summit:open', evNone);
  };
  // each reader asks the Summit first; it falls back to the Ridge, which falls back to the Deck
  Summit.minY = S => Summit.isOpen(S) ? SU.camMinY : (G.Ridge ? G.Ridge.minY(S) : MAP.CAM_MIN_Y);
  Summit.boundsY0 = S => Summit.isOpen(S) ? SU.boundsY0 : (G.Ridge ? G.Ridge.boundsY0(S) : MAP.BOUNDS.y0);
  Summit.exitFor = (S, g) => (Summit.isOpen(S) && g.y < SU.y1) ? SU.exit : G.Ridge.exitFor(S, g);
  // 0 = the Deck, 1 = the Ridge, 2 = the Summit (the arrow keeps small jobs on Kit's own stage)
  Summit.stage = y => (SU && y < SU.y1) ? 2 : (MAP.RIDGE && y < MAP.RIDGE.y1) ? 1 : 0;
  Summit.addSolids = function (S, add) {
    if (!Summit.isOpen(S)) return;
    const ch = SU.chasm; for (let i = 0; i < ch.length; i++) add(ch[i][0], ch[i][1], ch[i][2], ch[i][3]);   // only the stairs climb the cliff
    const h = SU.hut.solid; add(h.x0, h.y0, h.x1, h.y1);
  };

  // ---- the troupe: no cabin; a whistle, then monkeys hop down the cliff one by one onto the ledge ----
  const Troupe = G.Troupe = {};
  const ID_BASE = 200000;                                     // troupe ids never collide with the cable car's or the lift's
  const evArrive = { index: 0, golden: false, kind: 'monkey', n: 0, empty: false, x: 0, y: 0, troupe: true }, evVip = { x: 0, y: 0, troupe: true };
  const whistle = { sortY: TR ? TR.whistle.y : 0, draw: null }, grandma = { sortY: SU ? SU.hut.seat.y : 0, draw: null };
  Troupe.running = S => !!TR && !!S.built.source;
  Troupe.period = S => (S.night.festival ? TR.periodNight * 0.85 : S.night.active ? TR.periodNight : TR.period);
  Troupe.init = function (S) { whistle.draw = drawWhistle; grandma.draw = drawGrandma; };
  function arrive(S) {
    const c = S.troupe, plat = TR.platform;
    c.index++; c.carId = ID_BASE + c.index;
    let n = TR.guests;
    c.golden = TR.goldenEvery > 0 && c.index % TR.goldenEvery === 0;
    if (c.golden) n *= C.GOLDEN_GUESTS;
    n = Math.max(0, Math.min(n, plat.cap - G.Guests.countWaiting(S, 'summit', plat.mill)));
    c.vip = !!(c.golden && DATA.GUESTS.momo);                 // Momo's Troupe: every golden troupe, Momo steps down last
    if (c.vip) n += 1;
    c.n = n; c.toSpawn = n; c.spawnT = 0; c.empty = n === 0; c.spawned = 0;
    if (!c.empty && n >= C.FULLCAR_MIN) S.carLog[c.carId] = { n, seated: 0, lost: false, gone: 0, done: false, t: S.t };
    S.stats.troupes++; if (c.vip) S.stats.momoTroupes++;
    evArrive.index = c.index; evArrive.golden = c.golden; evArrive.n = n; evArrive.empty = c.empty; evArrive.x = plat.x; evArrive.y = plat.y;
    G.Bus.emit('car:arrive', evArrive);
  }
  Troupe.update = function (S, dt) {
    if (!Troupe.running(S)) return;
    const c = S.troupe; c.phaseT += dt;
    if (c.pulse > 0) c.pulse -= dt;
    if (c.phase === 'away') {
      c.timer -= dt;
      if (!c.warned && c.timer <= TR.warn) { c.warned = true; c.pulse = TR.warn; G.Bus.emit('troupe:warn', evNone); }
      if (c.timer <= 0) { c.phase = 'drop'; c.phaseT = 0; arrive(S); }
    } else if (c.phase === 'drop') {
      if (c.toSpawn > 0) {
        c.spawnT -= dt;
        if (c.spawnT <= 0) {
          c.spawnT = TR.hopGap;
          const kind = (c.vip && c.toSpawn === 1) ? 'momo' : 'monkey';
          const x = TR.from.x + ((c.spawned % 7) - 3) * 30;                      // they come down all along the cliff face
          const g = G.Guests.spawn(S, kind, c.carId, c.golden, x, TR.from.y, 'summit');
          if (g) { c.toSpawn--; c.spawned++; if (kind === 'momo') { evVip.x = g.x; evVip.y = g.y; G.Bus.emit('vip:arrive', evVip); } } else c.toSpawn = 0;
        }
      } else { c.phase = 'away'; c.phaseT = 0; c.warned = false; c.timer = Troupe.period(S); }
    }
  };
  Troupe.timeToDrop = S => (S.troupe.phase === 'away' ? Math.max(0, S.troupe.timer) : 0);
  Summit.collect = function (S, list) {
    if (!SU) return;
    if (Troupe.running(S) && G.Camera.visibleY(TR.whistle.y, 120)) list.push(whistle);
    if (S.built.awake && G.Camera.visibleY(SU.hut.seat.y, 120) && !(G.Finale && G.Finale.active)) list.push(grandma);
  };
  function drawWhistle(ctx, o, S) {
    const c = S.troupe, p = Troupe.period(S), ttd = Troupe.timeToDrop(S);
    G.Art.W.bellPost(ctx, TR.whistle.x, TR.whistle.y, U.clamp(1 - ttd / p, 0, 1), ttd < TR.warn && c.phase === 'away' ? S.t : 0);
  }
  // after the story: Grandma sits at the Source's lane-side edge, feet in the water, and waves when Kit comes near
  function drawGrandma(ctx, o, S) {
    const Ch = G.Art.Ch; if (!Ch.grandma) return;
    const p = Ch.resetPose(Ch.POSE), s = SU.hut.seat, near = U.dist2(S.kit.x, S.kit.y, s.x, s.y) < 130 * 130;
    p.x = s.x; p.y = s.y; p.face = 1; p.t = S.t; p.pose = near ? 'wave' : 'sit'; p.poseT = (S.t * 0.8) % 1;
    Ch.grandma(ctx, p);
  }
})(window.G);
