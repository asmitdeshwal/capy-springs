// Capy Springs - lanterns as offering steps: reveal, stand-to-drain, light, unwrap trigger, effects (ARCHITECTURE.md 9.9, GDD 5.7).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA;
  const Lanterns = G.Lanterns = {};
  const DEFS = DATA.LANTERNS, byId = {};
  for (let i = 0; i < DEFS.length; i++) byId[DEFS[i].id] = DEFS[i];
  const posts = {}, labels = {};
  const evProgress = { id: null, fill: 0 }, evTick = { id: null, fill: 0, fromX: 0, fromY: 0 }, evShort = { id: null, missing: 0 }, evLit = { id: null, level: 0 }, evBuild = { id: null };
  const scratch = { x: 0, y: 0 };

  Lanterns.def = id => byId[id];
  Lanterns.pos = function (id, out) { const d = byId[id]; out.x = d.x; out.y = d.y; return out; };
  Lanterns.postPos = function (id, out) { const d = byId[id]; out.x = d.x; out.y = d.y - C.POST_BACK; return out; };
  // requirement strings ('trail:2') parsed once at load; revealed runs ~70x per frame and must not allocate (ARCH 18.2)
  const REQS = {};
  for (let i = 0; i < DEFS.length; i++) {
    const req = DEFS[i].requires, out = [];
    for (let j = 0; j < req.length; j++) { const r = req[j], c = r.indexOf(':'); out.push({ id: c < 0 ? r : r.slice(0, c), need: c < 0 ? 1 : parseInt(r.slice(c + 1), 10) }); }
    REQS[DEFS[i].id] = out;
  }
  Lanterns.revealed = function (S, id) {
    const req = REQS[id];
    for (let i = 0; i < req.length; i++) { const r = req[i], L = S.lanterns[r.id]; if (!L || L.level < r.need) return false; }
    return true;
  };
  Lanterns.maxed = (S, id) => S.lanterns[id].level >= byId[id].costs.length;
  Lanterns.visible = (S, id) => Lanterns.revealed(S, id) || S.lanterns[id].level >= 1;
  Lanterns.active = (S, id) => Lanterns.revealed(S, id) && !Lanterns.maxed(S, id);
  Lanterns.remaining = function (S, id) { if (Lanterns.maxed(S, id)) return null; const L = S.lanterns[id]; return byId[id].costs[L.level] - L.sunk; };
  Lanterns.affordable = function (S, id) { if (!Lanterns.active(S, id)) return false; return S.coins >= Lanterns.remaining(S, id); };
  Lanterns.cheapestAffordable = function (S) {
    let bestId = null, bestV = Infinity;
    for (let i = 0; i < DEFS.length; i++) { const id = DEFS[i].id; if (!Lanterns.affordable(S, id)) continue; const r = Lanterns.remaining(S, id); if (r < bestV) { bestV = r; bestId = id; } }
    return bestId;
  };
  Lanterns.cheapestRevealed = function (S) {
    let bestId = null, bestV = Infinity;
    for (let i = 0; i < DEFS.length; i++) { const id = DEFS[i].id; if (!Lanterns.active(S, id)) continue; const r = Lanterns.remaining(S, id); if (r < bestV) { bestV = r; bestId = id; } }
    return bestId;
  };

  Lanterns.init = function (S) {
    for (let i = 0; i < DEFS.length; i++) {
      const d = DEFS[i];
      if (!S.lanternFx[d.id]) S.lanternFx[d.id] = { standT: 0, acc: 0, tickT: 0, check: 0, flash: 0, short: 0, wiggle: 0, rearm: 0, shortOn: false, on: false };
      posts[d.id] = { id: d.id, def: d, sortY: d.y - C.POST_BACK, draw: drawPost };
      labels[d.id] = { id: d.id, def: d, draw: drawLabel };
    }
  };

  Lanterns.update = function (S, dt) {
    const kit = S.kit;
    for (let i = 0; i < DEFS.length; i++) {
      const d = DEFS[i], id = d.id, fx = S.lanternFx[id];
      if (fx.check > 0) fx.check -= dt;
      if (fx.flash > 0) fx.flash = Math.max(0, fx.flash - dt * 2);
      if (fx.wiggle > 0) fx.wiggle = Math.max(0, fx.wiggle - dt * 3);
      if (fx.rearm > 0) fx.rearm -= dt;
      if (!Lanterns.active(S, id)) { fx.standT = 0; fx.acc = 0; fx.shortOn = false; fx.short = 0; fx.on = false; continue; }
      const on = fx.rearm <= 0 && U.dist2(kit.x, kit.y, d.x, d.y) <= C.PAD_STAND_R * C.PAD_STAND_R;
      if (!on) { fx.standT = 0; fx.acc = 0; fx.shortOn = false; fx.short = 0; fx.on = false; continue; }
      const L = S.lanterns[id], cost = d.costs[L.level], remaining = cost - L.sunk;
      if (!fx.on) { fx.on = true; fx.tickT = C.DRAIN_TICK; }
      if (S.coins <= 0 && remaining > 0) {
        if (!fx.shortOn) { fx.shortOn = true; fx.wiggle = 1; evShort.id = id; evShort.missing = remaining; G.Bus.emit('lantern:short', evShort); }
        fx.short = remaining; fx.standT = 0; fx.acc = 0; continue;
      }
      fx.shortOn = false; fx.short = 0;
      fx.standT += dt;
      const rate = Math.min(C.DRAIN_MAX, C.DRAIN_START * Math.pow(2, fx.standT / C.DRAIN_DOUBLE_EVERY));
      fx.acc += rate * dt;
      const take = Math.min(Math.floor(fx.acc), S.coins, remaining);
      if (take > 0) {
        G.Coins.spend(S, take, id);
        L.sunk += take; fx.acc -= take;
        evProgress.id = id; evProgress.fill = L.sunk / cost; G.Bus.emit('lantern:progress', evProgress);
        fx.tickT += dt;
        if (fx.tickT >= C.DRAIN_TICK) {
          fx.tickT = 0; evTick.id = id; evTick.fill = L.sunk / cost; evTick.fromX = kit.x; evTick.fromY = kit.y - 30; G.Bus.emit('lantern:tick', evTick);
        }
        if (L.sunk >= cost) Lanterns.light(S, id);
      }
    }
  };

  Lanterns.light = function (S, id) {
    const d = byId[id], L = S.lanterns[id], fx = S.lanternFx[id];
    L.level++; L.sunk = 0;
    fx.check = C.CHECK_T; fx.flash = 1; fx.rearm = C.REARM_T; fx.standT = 0; fx.acc = 0;
    Lanterns.applyEffect(S, d, L.level, null);
    if (id === G.SEASON.finale) G.Seasons.markDone(S);
    evLit.id = id; evLit.level = L.level; G.Bus.emit('lantern:lit', evLit);
  };

  // 'build:a,b,c' | 'trailCap:5,8,12' | 'carLevel:1,2,3' | 'hire:pon' | 'famous:...' | 'travel:2'; opts.silent = no fx, no bus (Save.apply)
  Lanterns.applyEffect = function (S, def, level, opts) {
    const silent = !!(opts && opts.silent);
    const c = def.effect.indexOf(':'), kind = def.effect.slice(0, c), rest = def.effect.slice(c + 1), vals = rest.split(',');
    if (kind === 'build') {
      for (let i = 0; i < vals.length; i++) {
        const id = vals[i]; S.built[id] = true;
        if (id === 'boiler' && !silent) { S.heat.v = C.HEAT_START; S.heat.graceT = C.HEAT_GRACE; S.ui.kettleSlide = 1; }
        if (!silent) { S.unwrapping[id] = 0; if (G.Render.markStaticDirty) G.Render.markStaticDirty(); evBuild.id = id; G.Bus.emit('build', evBuild); }
      }
    } else if (kind === 'trailCap') { S.trailCap = parseInt(vals[Math.min(level, vals.length) - 1], 10); }
    else if (kind === 'carLevel') { S.car.level = parseInt(vals[Math.min(level, vals.length) - 1], 10); }
    else if (kind === 'hire') { G.Helpers.hire(S, rest, opts); }
    else if (kind === 'famous') { if (!silent) G.Events.famous(S, level); if (level === 1 && G.Ridge) G.Ridge.open(S, opts); }   // the finale also opens the Ridge
    else if (kind === 'travel') { G.Seasons.unlock(parseInt(rest, 10), opts); }
  };

  // ---- drawing ----
  Lanterns.drawGround = function (ctx, S) {
    const cam = G.Camera, H = G.Canvas.H;
    for (let i = 0; i < DEFS.length; i++) {
      const d = DEFS[i]; if (!Lanterns.active(S, d.id)) continue;
      if (d.y < cam.y - 120 || d.y > cam.y + H + 60) continue;
      const L = S.lanterns[d.id], fx = S.lanternFx[d.id];
      const fill = L.sunk / d.costs[L.level];
      const wob = fx.wiggle > 0 ? Math.sin(fx.wiggle * 40) * 3 * fx.wiggle : 0;
      G.Art.W.step(ctx, d.x + wob, d.y, fill, S.coins >= Lanterns.remaining(S, d.id), S.t);   // active already passed above
    }
  };
  Lanterns.collect = function (S, list) {
    const cam = G.Camera, H = G.Canvas.H;
    for (let i = 0; i < DEFS.length; i++) {
      const d = DEFS[i]; if (!Lanterns.visible(S, d.id)) continue;
      if (d.y < cam.y - 120 || d.y > cam.y + H + 60) continue;
      list.push(posts[d.id]);
    }
  };
  Lanterns.collectText = function (S, list) {
    const kit = S.kit, arrow = S.ui.arrow;
    for (let i = 0; i < DEFS.length; i++) {
      const d = DEFS[i]; if (!Lanterns.active(S, d.id)) continue;
      const fx = S.lanternFx[d.id];
      const targeted = arrow && arrow.kind === 'lantern' && arrow.id === d.id;
      if (!targeted && fx.check <= 0 && U.dist2(kit.x, kit.y, d.x, d.y) > C.LABEL_DIST * C.LABEL_DIST) continue;
      list.push(labels[d.id]);
    }
  };
  function drawPost(ctx, o, S) {
    const d = o.def, L = S.lanterns[d.id], fx = S.lanternFx[d.id];
    const lit = L.level >= 1;
    const fill = lit ? 1 : L.sunk / d.costs[L.level];
    G.Art.W.lantern(ctx, d.x, d.y - C.POST_BACK, fill, lit, S.t, fx.flash, Lanterns.active(S, d.id));
  }
  function drawLabel(ctx, o, S) {
    if (S.ui.banner) return;                                   // text priority: banner hides lantern pills
    const d = o.def, L = S.lanterns[d.id], fx = S.lanternFx[d.id];
    const y = d.y - 78, PAL = G.PAL, A = G.Art.S;
    if (fx.check > 0) { A.pill(ctx, d.x, y, 44, 26, '', 22, PAL.cream, PAL.ink, 'check'); return; }
    if (fx.short > 0) { A.pill(ctx, d.x, y, 66, 26, '-' + fx.short, 22, PAL.cream, PAL.red, 'koban'); return; }
    const rem = d.costs[L.level] - L.sunk;
    A.pill(ctx, d.x, y, rem >= 1000 ? 84 : 66, 26, String(rem), 22, PAL.cream, PAL.ink, 'koban');
  }
})(window.G);
