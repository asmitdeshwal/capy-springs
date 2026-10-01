// Capy Springs - koban coins: bursts into trays, magnet to Kit, balance, income buckets (ARCHITECTURE.md 9.8, GDD 8.8).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, PAL = G.PAL;
  const Coins = G.Coins = {};
  const D = { x: 0, y: 0 };
  const evAdd = { value: 0, source: null }, evCollect = { value: 0, wx: 0, wy: 0 }, evLand = { trayId: null }, evSpend = { value: 0, what: null };
  const RICH = { id: null, x: 0, y: 0, value: 0 };

  Coins.init = function (S) { };
  Coins.trayValue = (S, id) => S.trays[id] ? S.trays[id].value : 0;
  Coins.totalInTrays = function (S) { let v = 0; for (const id in S.trays) v += S.trays[id].value; return v; };
  Coins.richestTray = function (S, x, y, maxDist, out) {
    let best = null, bv = 0; const md = maxDist * maxDist;
    for (const id in S.trays) { const t = S.trays[id]; if (t.value <= 0) continue; if (U.dist2(t.x, t.y, x, y) > md) continue; if (t.value > bv) { bv = t.value; best = t; } }
    if (!best) return null;
    const o = out || RICH; o.id = best.id; o.x = best.x; o.y = best.y; o.value = best.value; return o;
  };
  Coins.add = function (S, value, source) {
    if (!(value > 0)) return;
    S.coins += value; S.earned += value;
    if (source !== 'offline') S.income.buckets[S.income.head] += value;
    evAdd.value = value; evAdd.source = source; G.Bus.emit('coins:add', evAdd);
  };
  Coins.spend = function (S, value, what) {
    if (value <= 0) return true;
    if (S.coins < value) return false;
    S.coins -= value; evSpend.value = value; evSpend.what = what; G.Bus.emit('coins:spend', evSpend);
    return true;
  };
  // burst: min(value, 6) koban arc from (fromX, fromY) into the tray; values sum to value; anything the pool cannot hold lands at once
  Coins.burst = function (S, value, fromX, fromY, trayId) {
    if (!(value > 0)) return;
    const tray = S.trays[trayId]; if (!tray) { Coins.add(S, value, 'soak'); return; }
    const n = Math.min(value, C.COINS_PER_PAY_MAX);
    let left = value;
    for (let i = 0; i < n; i++) {
      const v = Math.floor(value / n) + (i < value % n ? 1 : 0);
      const c = G.State.newCoin(S);
      if (!c) break;
      U.randDisc(C.TRAY_SCATTER, D);
      const px = tray.x + D.x, py = tray.y + D.y;
      c.x = fromX; c.y = fromY; c.z = 20; c.vz = U.rand(C.COIN_VZ);
      const T = (c.vz + Math.sqrt(c.vz * c.vz + 2 * C.COIN_G * c.z)) / C.COIN_G;
      let vx = (px - fromX) / T, vy = (py - fromY) / T; const sp = Math.sqrt(vx * vx + vy * vy);
      if (sp > C.COIN_V_MAX) { vx *= C.COIN_V_MAX / sp; vy *= C.COIN_V_MAX / sp; }
      c.vx = vx; c.vy = vy; c.value = v; c.state = 'air'; c.trayId = trayId; c.sortY = tray.y; c.source = 'soak';
      left -= v;
    }
    if (left > 0) { tray.value += left; tray.bounce = 1; }
  };
  // rain: bonus coins already magnetised to Kit, on a 40 px ring around (x, y)
  Coins.rain = function (S, value, x, y, source) {
    if (!(value > 0)) return;
    const n = Math.min(value, C.COINS_PER_PAY_MAX); let left = value;
    for (let i = 0; i < n; i++) {
      const v = Math.floor(value / n) + (i < value % n ? 1 : 0);
      const c = G.State.newCoin(S); if (!c) break;
      const a = i / n * Math.PI * 2;
      c.x = c.x0 = x + Math.cos(a) * 40; c.y = c.y0 = y + Math.sin(a) * 40; c.z = 0; c.t = -0.2 * (i / n); c.value = v; c.state = 'magnet'; c.trayId = null; c.source = source; c.sortY = c.y;
      left -= v;
    }
    if (left > 0) Coins.add(S, left, source);
  };
  function magnetTray(S, tray) {
    const pool = S.coinPool, free = pool.cap - pool.n;
    const n = Math.min(tray.value, C.COINS_PER_PAY_MAX, free); if (n <= 0) return;
    const value = tray.value;
    for (let i = 0; i < n; i++) {
      const v = Math.floor(value / n) + (i < value % n ? 1 : 0);
      const c = pool.alloc(); if (!c) break;
      c.t = -0.05 * i; c.z = 0; c.sx = c.sy = 1; c.draw = Coins.draw;
      c.x = c.x0 = tray.x + (i - n / 2) * 4; c.y = c.y0 = tray.y - i * 3; c.value = v; c.state = 'magnet'; c.trayId = tray.id; c.source = 'soak'; c.sortY = c.y;
      tray.value -= v;
    }
  }
  Coins.update = function (S, dt) {
    const inc = S.income, kit = S.kit;
    inc.bucketT += dt;
    if (inc.bucketT >= C.INCOME_BUCKET) { inc.bucketT -= C.INCOME_BUCKET; inc.head = (inc.head + 1) % C.INCOME_BUCKETS; inc.buckets[inc.head] = 0; }
    for (const id in S.trays) {
      const t = S.trays[id];
      if (t.bounce > 0) t.bounce = Math.max(0, t.bounce - dt * 5);
      if (t.value > 0 && U.dist2(kit.x, kit.y, t.x, t.y) <= C.TRAY_MAGNET_R * C.TRAY_MAGNET_R) magnetTray(S, t);
    }
    const pool = S.coinPool;
    for (let i = pool.n - 1; i >= 0; i--) {
      const c = pool.items[i];
      if (c.state === 'air') {
        c.vz -= C.COIN_G * dt; c.z += c.vz * dt; c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.z <= 0) {
          const t = S.trays[c.trayId]; if (t) { t.value += c.value; t.bounce = 1; evLand.trayId = c.trayId; G.Bus.emit('coins:land', evLand); } else Coins.add(S, c.value, 'soak');
          pool.free(i);
        }
      } else {
        c.t += dt / C.COIN_TO_KIT_T;
        if (c.t >= 0) { const u = U.easeInQuad(Math.min(1, c.t)); c.x = c.x0 + (kit.x - c.x0) * u; c.y = c.y0 + (kit.y - 10 - c.y0) * u; c.sortY = c.y + 20; }
        if (c.t >= 1) {
          Coins.add(S, c.value, c.source || 'soak');
          evCollect.value = c.value; evCollect.wx = kit.x; evCollect.wy = kit.y - 30; G.Bus.emit('coins:collect', evCollect);
          pool.free(i);
        }
      }
    }
  };
  Coins.drawGround = function (ctx, S) {
    const cam = G.Camera, H = G.Canvas.H, W = G.Art.W;
    for (let i = 0; i < DATA.BATHS.length; i++) { const id = DATA.BATHS[i].id; if (!S.built[id]) continue; const t = S.trays[id]; if (t.y < cam.y - 60 || t.y > cam.y + H + 60) continue; W.tray(ctx, t.x, t.y, t.value, t.bounce); }
    if (S.built.stall) { const t = S.trays.stall; if (t.y > cam.y - 60 && t.y < cam.y + H + 60) W.tray(ctx, t.x, t.y, t.value, t.bounce); }
    const pool = S.coinPool;
    for (let i = 0; i < pool.n; i++) { const c = pool.items[i]; if (c.state === 'air' && c.y > cam.y - 60 && c.y < cam.y + H + 60) G.Art.FX.kobanShadow(ctx, c); }
  };
  Coins.collect = function (S, list) {
    const pool = S.coinPool, cam = G.Camera, H = G.Canvas.H;
    for (let i = 0; i < pool.n; i++) { const c = pool.items[i]; if (c.state === 'magnet' && c.t < 0) continue; if (c.y < cam.y - 60 || c.y > cam.y + H + 60) continue; list.push(c); }
  };
  Coins.draw = function (ctx, c, S) { G.Art.FX.koban(ctx, c, c.z); };
})(window.G);
