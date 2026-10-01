// Capy Springs - Kit: movement, collision, facing, breadcrumb path, poses, dust (ARCHITECTURE.md 9.1).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, MAP = DATA.MAP;
  const Player = G.Player = {};
  const SOLIDS = [];                      // reused rect list {x0,y0,x1,y1}
  const RECT_POOL = []; for (let i = 0; i < 24; i++) RECT_POOL.push({ x0: 0, y0: 0, x1: 0, y1: 0 });
  let solidsDirty = true;
  const drawable = { sortY: 0, draw: null };
  const evNone = {};

  function addRect(x0, y0, x1, y1) { if (SOLIDS.length >= RECT_POOL.length) return; const r = RECT_POOL[SOLIDS.length]; r.x0 = x0; r.y0 = y0; r.x1 = x1; r.y1 = y1; SOLIDS.push(r); }
  Player.solids = function (S) {
    if (!solidsDirty) return SOLIDS;
    solidsDirty = false; SOLIDS.length = 0;
    for (let i = 0; i < DATA.BATHS.length; i++) { const d = DATA.BATHS[i]; if (!S.built[d.id]) continue; const w = d.water; addRect(w.x - w.w / 2, w.y - w.h / 2, w.x + w.w / 2, w.y + w.h / 2); }
    if (S.built.boiler) { const b = DATA.STATIONS.boiler; addRect(b.x - b.solid.w / 2, b.y - b.solid.h, b.x + b.solid.w / 2, b.y); }
    if (S.built.stall) { const s = DATA.STATIONS.stall; addRect(s.x - s.solid.w / 2, s.y - s.solid.h / 2, s.x + s.solid.w / 2, s.y + s.solid.h / 2); }
    if (S.built.grove) { const n = G.Upgrades.treeCount(S), tr = DATA.STATIONS.grove.trunk; for (let i = 0; i < n && i < S.grove.trees.length; i++) { const t = S.grove.trees[i]; addRect(t.x - tr.w / 2, t.y - tr.h, t.x + tr.w / 2, t.y); } }
    const cb = MAP.CABLE; for (let i = 0; i < cb.pylons.length; i++) addRect(cb.pylons[i] - 5, cb.pylonTop, cb.pylons[i] + 5, cb.y);
    return SOLIDS;
  };
  Player.markSolidsDirty = function () { solidsDirty = true; };

  Player.init = function (S) {
    solidsDirty = true;
    drawable.draw = Player.draw;
    if (!Player.subscribed) {
      Player.subscribed = true;
      G.Bus.on('build', () => { solidsDirty = true; });
      G.Bus.on('upgrade', e => { if (e.id === 'grove' && e.key === 'slots') solidsDirty = true; });
      G.Bus.on('splash', e => { if (e.count >= 3 && G.Game.S) Player.pose(G.Game.S, 'pump', C.KIT_PUMP_T); });
    }
  };
  Player.speed = S => C.KIT_SPEED * (S.trail.length === 0 ? C.KIT_SPRINT : 1);
  Player.pose = function (S, name, seconds) { const k = S.kit; k.pose = name; k.poseT = 0; k.poseDur = seconds; };
  Player.squash = function (S) { S.kit.squashT = C.SQUASH_T; };

  Player.update = function (S, dt) {
    const k = S.kit, In = G.Input;
    let ix = In.vec.x, iy = In.vec.y;
    if (k.nudgeT > 0) {
      k.nudgeT -= dt;
      const a = S.ui.arrow;
      if (a && !a.hide) { const dx = a.x - k.x, dy = a.y - k.y, d = Math.sqrt(dx * dx + dy * dy); if (d > 6) { ix = dx / d; iy = dy / d; } }
    }
    const sp = Player.speed(S), kk = 1 - Math.exp(-dt / C.KIT_ACCEL_T * 3);
    k.vx += (ix * sp - k.vx) * kk; k.vy += (iy * sp - k.vy) * kk;
    if (Math.abs(k.vx) < 0.5 && !ix) k.vx = 0; if (Math.abs(k.vy) < 0.5 && !iy) k.vy = 0;
    const solids = Player.solids(S), r = C.KIT_RADIUS, B = MAP.BOUNDS;
    // x then y, resolving against expanded rects
    k.x += k.vx * dt;
    for (let i = 0; i < solids.length; i++) { const s = solids[i]; if (k.x > s.x0 - r && k.x < s.x1 + r && k.y > s.y0 - r && k.y < s.y1 + r) { k.x = k.vx > 0 ? s.x0 - r : s.x1 + r; k.vx = 0; } }
    k.x = U.clamp(k.x, B.x0 + r, B.x1 - r);
    k.y += k.vy * dt;
    for (let i = 0; i < solids.length; i++) { const s = solids[i]; if (k.x > s.x0 - r && k.x < s.x1 + r && k.y > s.y0 - r && k.y < s.y1 + r) { k.y = k.vy > 0 ? s.y0 - r : s.y1 + r; k.vy = 0; } }
    k.y = U.clamp(k.y, B.y0 + r, B.y1 - r);
    const v = Math.sqrt(k.vx * k.vx + k.vy * k.vy);
    k.moving = v > 8;
    if (k.moving) {
      k.stoppedT = 0; k.idleT = 0; k.walk += dt * 8; if (k.walk > 1000) k.walk -= 1000;
      k.fdx = k.vx / v; k.fdy = k.vy / v;
      k.dustT += dt; if (k.dustT >= C.KIT_DUST_EVERY) { k.dustT = 0; G.FX.puff(S, k.x - k.fdx * 6, k.y - 2, 'dust'); }
    } else { k.stoppedT += dt; k.idleT += dt; k.dustT = 0; }
    if (Math.abs(k.vx) > Math.abs(k.vy) * 0.5 && Math.abs(k.vx) > 4) k.face = k.vx < 0 ? -1 : 1;
    k.dir = (k.vy < -8 && Math.abs(k.vy) > Math.abs(k.vx)) ? 'up' : (k.vy > 8 && Math.abs(k.vy) > Math.abs(k.vx)) ? 'down' : 'side';
    // breadcrumb path
    const p = k.path;
    if (p.n === 0 || U.dist(k.x, k.y, p.xs[p.head], p.ys[p.head]) >= C.TRAIL_SAMPLE) U.pathPush(p, k.x, k.y);
    // idle stretch, pose timer, squash
    if (k.idleT >= C.KIT_IDLE_STRETCH) { Player.pose(S, 'stretch', 1.0); k.idleT = 0; }
    if (k.pose) { k.poseT += dt; if (k.poseT >= k.poseDur) k.pose = null; }
    if (k.squashT > 0) { k.squashT -= dt; const u = Math.max(0, k.squashT / C.SQUASH_T); k.sx = 1 + (C.SQUASH_X - 1) * u; k.sy = 1 - (1 - C.SQUASH_Y) * u; } else { k.sx = 1; k.sy = 1; }
  };
  Player.collect = function (S, list) { drawable.sortY = S.kit.y + 0.5; list.push(drawable); };
  Player.draw = function (ctx, o, S) {
    const k = S.kit, Ch = G.Art.Ch, p = Ch.resetPose(Ch.POSE);
    p.x = k.x; p.y = k.y; p.face = k.face; p.dir = k.dir; p.walk = k.walk; p.moving = k.moving; p.sx = k.sx; p.sy = k.sy; p.t = S.t;
    p.lag = U.clamp(Math.sqrt(k.vx * k.vx + k.vy * k.vy) * 0.03, 0, 8);
    p.pose = k.pose; p.poseT = k.poseDur > 0 ? k.poseT / k.poseDur : 0;
    Ch.kit(ctx, p, S);
  };
})(window.G);
