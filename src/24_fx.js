// Capy Springs - FX manager: emitters, pool updates, presentation reactions on the bus, unwrap, pops (ARCHITECTURE.md 10.3 / 12 / 16).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL, DATA = G.DATA;
  const FX = G.FX = { S: null };
  const R = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const unwrapDrawables = Object.create(null);
  let chainPop = null, chainBatch = null;
  const CONFETTI_COLORS = [PAL.amber, PAL.cta, PAL.ripple, PAL.cream, PAL.coin, PAL.frog];

  function shakeOn(S) { return S.settings.shakeFlash !== false; }
  function lowFx(S) { return !!S.settings.lowFx; }

  // ---------- spawn helpers (pool inserts; safe to call from game systems) ----------
  FX.puff = function (S, x, y, kind, size) {
    const p = S.fx.parts.alloc(); if (!p) return;
    p.kind = kind || 'puff'; p.x = x; p.y = y; p.z = 0; p.t = 0; p.size = size || (kind === 'dust' ? 3 : 6);
    p.life = kind === 'dust' ? 0.35 : 0.5; p.vx = (U.hash(x, y) - 0.5) * 30; p.vy = 0; p.vz = kind === 'dust' ? 0 : 30; p.color = null;
  };
  FX.puffs = function (S, x, y, n, spread) { for (let i = 0; i < n; i++) FX.puff(S, x + (U.hash(i, x + n) - 0.5) * spread, y + (U.hash(i + 7, y) - 0.5) * spread * 0.5, 'puff', 6 + U.hash(i, 3) * 6); };
  FX.steam = function (S, x, y, r, alpha) {
    const pool = S.fx.steam;
    if (lowFx(S) && pool.n >= C.STEAM_CAP_LOW) return;
    const s = pool.alloc(); if (!s) return;
    s.x = x; s.y = y; s.r = r || 10; s.t = 0; s.life = C.STEAM_LIFE; s.drift = U.hash(x, y) * 6; s.alpha = alpha || 0.45;
  };
  FX.ripple = function (S, x, y, gold) {
    const pool = S.fx.ripples;
    if (lowFx(S) && pool.n >= C.RIPPLE_CAP_LOW) return;
    const r = pool.alloc(); if (!r) return;
    r.x = x; r.y = y; r.t = 0; r.life = 1.4; r.r0 = 10; r.r1 = 36; r.gold = !!gold;
  };
  FX.confetti = function (S, x, y, n) {
    if (lowFx(S)) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const p = S.fx.parts.alloc(); if (!p) return;
      p.kind = 'confetti'; p.x = x; p.y = y; p.z = 10; p.t = 0; p.life = 1.1 + U.hash(i, x) * 0.5; p.size = 3;
      const a = U.hash(i, y) * Math.PI * 2, sp = 60 + U.hash(i + 3, x) * 90;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp * 0.5; p.vz = 160 + U.hash(i + 9, y) * 140; p.rot = U.hash(i, 5) * 6; p.color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    }
  };
  FX.droplets = function (S, x, y, n) {
    for (let i = 0; i < n; i++) {
      const p = S.fx.parts.alloc(); if (!p) return;
      p.kind = 'drop'; p.x = x; p.y = y; p.z = 4; p.t = 0; p.life = 0.5; p.size = 2 + U.hash(i, x) * 1.5;
      const a = U.hash(i, y) * Math.PI * 2, sp = 40 + U.hash(i + 1, x) * 60;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp * 0.4; p.vz = 120 + U.hash(i + 2, y) * 80;
    }
  };
  FX.heart = function (S, x, y) { const p = S.fx.parts.alloc(); if (!p) return; p.kind = 'heart'; p.x = x; p.y = y; p.z = 0; p.t = 0; p.life = 1.1; p.size = 14; p.vx = p.vy = p.vz = 0; };
  FX.sparkle = function (S, x, y, n) {
    for (let i = 0; i < n; i++) { const p = S.fx.parts.alloc(); if (!p) return; p.kind = 'sparkle'; p.x = x + (U.hash(i, x) - 0.5) * 30; p.y = y - U.hash(i, y) * 30; p.z = 0; p.t = 0; p.life = 0.6; p.size = 6 + U.hash(i, 2) * 4; p.vx = p.vy = 0; p.vz = 30; }
  };
  // shockwave: an expanding ellipse ring (presentation only)
  FX.ring = function (S, x, y, r1) { const p = S.fx.parts.alloc(); if (!p) return; p.kind = 'ring'; p.x = x; p.y = y; p.z = 0; p.t = 0; p.life = 0.45; p.size = r1; p.vx = p.vy = p.vz = 0; p.color = null; };
  FX.toss = function (S, x0, y0, x1, y1) { const p = S.fx.parts.alloc(); if (!p) return; p.kind = 'koban'; p.x = x0; p.y = y0; p.x1 = x1; p.y1 = y1; p.z = 0; p.t = 0; p.life = 0.28; p.vx = p.vy = p.vz = 0; };
  // pops: kind 'plus' rises and fades; 'chain' / 'yuzu' / 'label' scale in with overshoot; the chain pop is one live object per chain
  FX.pop = function (S, text, x, y, size, color, kind, batch) {
    let p = null;
    if (kind === 'chain' && batch && batch === chainBatch && chainPop && chainPop.t < chainPop.dur) p = chainPop;
    if (!p) { p = S.fx.pops.alloc(); if (!p) return null; }
    p.text = text; p.x = x; p.y = y; p.t = 0; p.size = size; p.color = color; p.kind = kind || 'plus'; p.rise = C.POP_RISE;
    p.dur = kind === 'plus' ? C.POP_T : 1.1;
    if (kind === 'chain') { chainPop = p; chainBatch = batch; }
    return p;
  };
  FX.wash = function (S) {
    S.fx.wash = 1.6;
    const n = lowFx(S) ? C.WASH_COUNT / 2 : C.WASH_COUNT;
    for (let i = 0; i < n; i++) FX.steam(S, 40 + U.hash(i, 11) * 460, 1400 + U.hash(i, 12) * 600, 14 + U.hash(i, 13) * 10, 0.5);
  };
  FX.flash = function (S, a) { if (!shakeOn(S)) return; S.fx.flash = Math.min(C.FLASH_MAX, Math.max(S.fx.flash, a)); };
  FX.hitStop = function (S, s) { if (shakeOn(S)) G.Loop.hitStop(s); };

  // ---------- update (wall-clock dt: keeps running during hit-stop and cards) ----------
  FX.update = function (S, dt) {
    const st = S.fx.steam;
    for (let i = st.n - 1; i >= 0; i--) { const s = st.items[i]; s.t += dt; if (s.t >= s.life) st.free(i); }
    const rp = S.fx.ripples;
    for (let i = rp.n - 1; i >= 0; i--) { const r = rp.items[i]; r.t += dt; if (r.t >= r.life) rp.free(i); }
    const pa = S.fx.parts;
    for (let i = pa.n - 1; i >= 0; i--) {
      const p = pa.items[i]; p.t += dt;
      if (p.t >= p.life) { pa.free(i); continue; }
      if (p.kind === 'confetti' || p.kind === 'drop' || p.kind === 'puff' || p.kind === 'sparkle') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.kind === 'confetti' || p.kind === 'drop') { p.vz -= C.COIN_G * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.3; p.vx *= 0.7; } }
        else p.vz *= 0.9;
      }
    }
    const po = S.fx.pops;
    for (let i = po.n - 1; i >= 0; i--) { const p = po.items[i]; p.t += dt; if (p.t >= p.dur) { if (p === chainPop) { chainPop = null; chainBatch = null; } po.free(i); } }
    if (S.fx.flash > 0) S.fx.flash = Math.max(0, S.fx.flash - dt * (C.FLASH_MAX / 0.25));
    if (S.fx.wash > 0) S.fx.wash -= dt;
    for (const id in S.unwrapping) { S.unwrapping[id] += dt / C.UNWRAP_T; if (S.unwrapping[id] >= 1) delete S.unwrapping[id]; }
  };

  // ---------- drawing ----------
  FX.drawGround = function (ctx, S) {
    const pa = S.fx.parts, cam = G.Camera, H = G.Canvas.H;
    for (let i = 0; i < pa.n; i++) { const p = pa.items[i]; if (p.kind === 'dust' && p.y > cam.y - 20 && p.y < cam.y + H + 20) G.Art.FX.part(ctx, p); }
    const rp = S.fx.ripples;
    for (let i = 0; i < rp.n; i++) { const r = rp.items[i]; if (r.y > cam.y - 40 && r.y < cam.y + H + 40) G.Art.FX.ripple(ctx, r); }
  };
  FX.drawWorld = function (ctx, S) {
    const cam = G.Camera, H = G.Canvas.H, AF = G.Art.FX;
    const pa = S.fx.parts;
    for (let i = 0; i < pa.n; i++) { const p = pa.items[i]; if (p.kind === 'dust' || p.kind === 'heart') continue; if (p.y < cam.y - 60 || p.y > cam.y + H + 60) continue; AF.part(ctx, p); }
    const st = S.fx.steam;
    for (let i = 0; i < st.n; i++) { const s = st.items[i]; if (s.y < cam.y - 60 || s.y > cam.y + H + 60) continue; AF.steam(ctx, s); }
    if (S.fx.wash > 0) AF.wash(ctx, WASH, cam.y, H);
    G.Art.W.mist(ctx, cam.y, H);
  };
  const WASH = { t: 0, life: 1.6 };
  FX.drawPops = function (ctx, S) {
    const cam = G.Camera, H = G.Canvas.H, AF = G.Art.FX;
    const pa = S.fx.parts;
    for (let i = 0; i < pa.n; i++) { const p = pa.items[i]; if (p.kind === 'heart' && p.y > cam.y - 40 && p.y < cam.y + H + 40) AF.part(ctx, p); }
    const po = S.fx.pops;
    for (let i = 0; i < po.n; i++) { const p = po.items[i]; if (p.y < cam.y - 60 || p.y > cam.y + H + 60) continue; AF.pop(ctx, p); }
  };
  function drawUnwrap(ctx, o, S) { const f = S.unwrapping[o.id]; if (f === undefined) return; G.Art.W.unwrap(ctx, o.id, S, Math.min(1, f)); }
  FX.collect = function (S, list) {
    for (const id in S.unwrapping) {
      let d = unwrapDrawables[id];
      if (!d) { G.Art.W.footprint(id, S, R); d = unwrapDrawables[id] = { id, sortY: R.y1 + 1, draw: drawUnwrap }; }
      list.push(d);
    }
  };

  // ---------- bus reactions (presentation only) ----------
  FX.init = function (S) {
    FX.S = S; chainPop = null; chainBatch = null;
    if (FX.subscribed) return;
    FX.subscribed = true;
    const Bus = G.Bus, Cam = G.Camera;
    const cur = () => FX.S;
    // the Splash Chain is the game's big joy: every step up escalates (bump -> shake + zoom punch -> shake, punch, shockwave, confetti, flash)
    Bus.on('splash', e => {
      const S = cur(), b = e.bath, g = e.g, n = Math.min(e.count, 5), w = b.def.water;
      FX.ripple(S, g.x, g.y, b.yuzuT > 0);
      FX.droplets(S, g.x, g.y - 4, 6 + n);
      if (e.count >= 3) {
        const text = e.count === 3 ? G.Seasons.text('splash3', 'SPLASH x3!') : e.count === 4 ? 'x4!' : 'x' + e.count + '!!';
        FX.pop(S, text, w.x, w.y - w.h / 2 - 34, C.SPLASH_TEXT[n], PAL.coin, 'chain', g.batch);
        Cam.punch(C.SPLASH_PUNCH[n], C.PUNCH_T);
        if (e.count === 3) { FX.hitStop(S, C.HITSTOP_X3); FX.sparkle(S, w.x, w.y - 10, 4); }
        if (e.count === 4) { FX.sparkle(S, w.x, w.y - 10, 6); FX.ring(S, w.x, w.y, 60); }
        if (e.count >= 5) { FX.hitStop(S, C.HITSTOP_X5); FX.confetti(S, w.x, w.y - 20, C.CONFETTI_SMALL * 2); FX.flash(S, 0.25); FX.ring(S, w.x, w.y, 120); FX.ring(S, w.x, w.y, 70); }
        if (e.count >= 5) Cam.shake(C.SPLASH_BUMP[5], 0.35); else Cam.bump(C.SPLASH_BUMP[n]);
      } else Cam.bump(2);
    });
    Bus.on('guest:paid', e => { const S = cur(); FX.pop(S, '+' + e.value, e.g.x, e.g.y - 40, 20, PAL.coin, 'plus'); });
    // the Ridge: a hot body hits cold water (steam burst); inside the window it is the HOT-COLD moment
    Bus.on('plunge', e => {
      const S = cur(), w = e.bath.def.water;
      FX.droplets(S, e.g.x, e.g.y - 4, 10); for (let i = 0; i < 4; i++) FX.steam(S, e.g.x + (i - 1.5) * 10, e.g.y - 8, 12, 0.6);
      if (e.hot) { FX.pop(S, 'HOT-COLD x2!', w.x, w.y - w.h / 2 - 62, 34, PAL.ripple, 'label'); FX.ring(S, w.x, w.y, 90); for (let i = 0; i < 6; i++) FX.steam(S, w.x + (i - 2.5) * 22, w.y - 6, 16, 0.55); Cam.punch(C.PLUNGE_PUNCH, C.PUNCH_T); Cam.bump(6); FX.flash(S, 0.12); }
    });
    // the pavilion's gong: a session starts (FULL HOUSE when every chair was taken)
    Bus.on('gong', e => {
      const S = cur(), w = e.bath.def.water, g = e.bath.def.gongAt;
      FX.ring(S, g.x, g.y - 36, 70); FX.sparkle(S, w.x, w.y - 20, 6);
      if (e.full) { FX.pop(S, 'FULL HOUSE x' + e.bath.def.fullHouse + '!', w.x, w.y - w.h / 2 - 70, 32, PAL.amber, 'label'); FX.confetti(S, w.x, w.y - 10, C.CONFETTI_SMALL); Cam.punch(0.04, C.PUNCH_T); Cam.bump(5); }
      else Cam.bump(3);
    });
    // snowfall: a cleared drift bursts into white puffs (its koban rain to Kit on their own)
    Bus.on('snow:clear', e => { const S = cur(); for (let i = 0; i < 8; i++) FX.puff(S, e.x + (U.hash(i, e.x) - 0.5) * 50, e.y + (U.hash(i, e.y) - 0.5) * 20, 'puff', 8 + U.hash(i, 5) * 8); FX.sparkle(S, e.x, e.y - 10, 4); FX.pop(S, '+' + e.bonus, e.x, e.y - 30, 20, PAL.coin, 'plus'); });
    Bus.on('ridge:open', () => { const S = cur(), b = DATA.MAP.BRIDGE; FX.confetti(S, b.x, b.y0 + 40, C.CONFETTI_BIG); FX.confetti(S, b.x, b.y1, C.CONFETTI_BIG); FX.flash(S, 0.3); Cam.shake(6, 0.4); });
    Bus.on('guest:mochi', e => { const S = cur(); FX.pop(S, '+' + e.value, e.g.x, e.g.y - 40, 20, PAL.coin, 'plus'); });
    Bus.on('guest:lost', e => { const S = cur(); FX.droplets(S, e.g.x, e.g.y - 30, 3); });
    Bus.on('guest:heart', e => { const S = cur(); FX.heart(S, e.g.x + 8, e.g.y - 34); FX.steam(S, e.g.x - 6, e.g.y - 10, 8, 0.4); });
    Bus.on('yuzu:apply', e => { const S = cur(), w = e.bath.def.water; for (let i = 0; i < 3; i++) FX.ripple(S, w.x + (i - 1) * 30, w.y + 10, true); FX.pop(S, G.Seasons.text('yuzuPop', 'YUZU BATH!'), w.x, w.y - w.h / 2 - 34, 30, PAL.yuzu, 'yuzu'); FX.sparkle(S, w.x, w.y, 6); });
    Bus.on('yuzu:pick', e => { const S = cur(); FX.sparkle(S, e.tree.x, e.tree.y - 40, 3); });
    Bus.on('lantern:tick', e => { const S = cur(), d = G.Lanterns.def(e.id); FX.toss(S, e.fromX, e.fromY, d.x, d.y - 42); });
    Bus.on('lantern:lit', e => { const S = cur(), d = G.Lanterns.def(e.id); FX.puffs(S, d.x, d.y - C.POST_BACK - 50, 5, 30); FX.confetti(S, d.x, d.y - C.POST_BACK - 40, C.CONFETTI_SMALL); Cam.bump(4); });
    Bus.on('build', e => { const S = cur(); G.Art.W.footprint(e.id, S, R); FX.puffs(S, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 12, R.x1 - R.x0); });
    Bus.on('upgrade', e => { const S = cur(); S.ui.squash[e.id] = 1; });
    Bus.on('heat:rush:start', e => {
      const S = cur(); FX.wash(S); FX.flash(S, 0.25); FX.hitStop(S, C.HITSTOP_RUSH); Cam.shake(8, 0.3);
      if (e.chain > 0) FX.pop(S, 'CHAIN x' + (e.chain + 1) + '!', DATA.STATIONS.boiler.x, DATA.STATIONS.boiler.y - 110, 34, PAL.amber, 'label');
    });
    Bus.on('heat:stoke', e => { const S = cur(), b = DATA.STATIONS.boiler; FX.puffs(S, b.x, b.y - 20, 3, 20); FX.sparkle(S, b.x, b.y - 40, 2); if (e.bonus > 0) FX.pop(S, '+' + Math.round(e.amount), b.x, b.y - 90, 24, PAL.amber, 'label'); });
    Bus.on('lap:done', () => { const S = cur(), b = DATA.STATIONS.boiler; FX.sparkle(S, b.x, b.y - 30, 6); Cam.bump(3); });
    Bus.on('kaa:tap', e => { const S = cur(); FX.confetti(S, e.x, e.y - 20, C.CONFETTI_SMALL); FX.flash(S, 0.15); });
    Bus.on('kaa:steal', e => { const S = cur(); FX.puffs(S, e.x, e.y - 10, 3, 20); });
    Bus.on('guest:heart', e => { if (DATA.GUESTS[e.g.kind].vip) FX.sparkle(cur(), e.g.x, e.g.y - 10, 3); });     // the VIP shimmers so everyone sees the money
    Bus.on('fullcar', e => { const S = cur(); FX.confetti(S, S.kit.x, S.kit.y - 30, C.CONFETTI_SMALL); });
    Bus.on('famous', () => { const S = cur(); FX.confetti(S, S.kit.x, S.kit.y - 30, C.CONFETTI_BIG); FX.confetti(S, DATA.MAP.BRIDGE.x, DATA.MAP.BRIDGE.y1, C.CONFETTI_BIG); FX.flash(S, 0.3); });
    Bus.on('fame', () => { const S = cur(); FX.confetti(S, S.kit.x, S.kit.y - 30, C.CONFETTI_SMALL); });
    Bus.on('season:unlock', () => { const S = cur(); FX.confetti(S, S.kit.x, S.kit.y - 30, C.CONFETTI_BIG); FX.flash(S, 0.3); });
    Bus.on('night:light', () => { const S = cur(); FX.sparkle(S, S.kit.x, S.kit.y - 20, 3); });
    Bus.on('helper:hire', e => { const S = cur(), h = S.helpers[e.id]; if (h) FX.puffs(S, h.x, h.y - 20, 6, 30); });
    Bus.on('car:arrive', e => { const S = cur(); if (e.golden) FX.confetti(S, DATA.MAP.PLATFORM.x, DATA.MAP.PLATFORM.y - 20, C.CONFETTI_SMALL); });
    Bus.on('ui:cold-refusal', e => { const S = cur(), w = e.bath.def.water; FX.puffs(S, w.x, w.y - w.h / 2, 2, 20); });
  };
})(window.G);
