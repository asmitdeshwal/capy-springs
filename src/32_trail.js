// Capy Springs - the Trail: breadcrumb-path follower chain of guests, logs and yuzu (ARCHITECTURE.md 9.2, GDD 5.1).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, PAL = G.PAL;
  const Trail = G.Trail = {};
  const FREE = [];
  const TP = { x: 0, y: 0, rem: 0 }, HP = { x: 0, y: 0, z: 0 };
  const evJoin = { node: null, index: 0 }, evRemove = { node: null };

  function newNode() {
    return FREE.length ? FREE.pop() : { kind: 'guest', ref: null, x: 0, y: 0, z: 0, sx: 1, sy: 1, squashT: 0, bobPhase: 0, bob: 0, hop: null, dist: 0, roll: 0, sortY: 0, draw: null,
      hopObj: { x0: 0, y0: 0, x1: 0, y1: 0, t: 0, dur: C.TRAIL_HOP_T, h: C.TRAIL_HOP_H }, px: 0, py: 0, face: 1 };
  }
  function gapOf(node) { return node.kind === 'guest' ? DATA.GUESTS[node.ref.kind].gap : C.TRAIL_GAP[node.kind]; }
  function relink(S) {
    let D = C.TRAIL_FIRST_GAP;
    for (let i = 0; i < S.trail.length; i++) { const n = S.trail[i]; D += gapOf(n); n.dist = D; n.bobPhase = C.TRAIL_BOB_PHASE * i; }
  }
  function targetPoint(S, D, out) {
    const k = S.kit;
    if (!U.pathPointAt(k.path, k.x, k.y, D, out)) { out.x -= k.fdx * out.rem; out.y -= k.fdy * out.rem; }
    return out;
  }

  Trail.init = function (S) { while (S.trail.length) FREE.push(S.trail.pop()); S.trailMeta.compress = 1; S.trailMeta.joinT = -99; };
  Trail.full = S => S.trail.length >= S.trailCap;
  Trail.count = function (S, kind) { if (!kind) return S.trail.length; let n = 0; for (let i = 0; i < S.trail.length; i++) if (S.trail[i].kind === kind) n++; return n; };
  Trail.hasKind = function (S, kind) { for (let i = 0; i < S.trail.length; i++) if (S.trail[i].kind === kind) return true; return false; };
  Trail.tailPoint = function (S, out) {
    let D = C.TRAIL_FIRST_GAP;
    for (let i = 0; i < S.trail.length; i++) D += gapOf(S.trail[i]);
    D += DATA.GUESTS.capy.gap;
    return targetPoint(S, D * S.trailMeta.compress, out);
  };
  Trail.join = function (S, kind, ref, fromX, fromY) {
    if (Trail.full(S)) return null;
    const n = newNode();
    n.kind = kind; n.ref = ref || null; n.x = fromX; n.y = fromY; n.px = fromX; n.py = fromY; n.z = 0; n.sx = n.sy = 1; n.squashT = 0; n.roll = 0; n.bob = 0; n.face = 1;
    n.draw = Trail.drawItem;
    S.trail.push(n); relink(S);
    targetPoint(S, n.dist * S.trailMeta.compress, TP);
    const h = n.hopObj; h.x0 = fromX; h.y0 = fromY; h.x1 = TP.x; h.y1 = TP.y; h.t = 0; h.dur = C.TRAIL_HOP_T; h.h = C.TRAIL_HOP_H; n.hop = h;
    if (ref) { ref.node = n; ref.x = fromX; ref.y = fromY; }
    S.trailMeta.joinT = S.t;
    evJoin.node = n; evJoin.index = S.trail.length - 1; G.Bus.emit('trail:join', evJoin);
    return n;
  };
  function unlink(S, i) {
    const n = S.trail[i];
    S.trail.splice(i, 1);
    if (n.ref) n.ref.node = null;
    relink(S);
    evRemove.node = n; G.Bus.emit('trail:remove', evRemove);
    n.hop = null; FREE.push(n);
    return n;
  }
  // the only removers: takeFirst (drop-off path) and removeNode (impatient guest)
  Trail.takeFirst = function (S, kind) { for (let i = 0; i < S.trail.length; i++) if (S.trail[i].kind === kind) return unlink(S, i); return null; };
  // first guest the predicate accepts (a station may refuse some wants, e.g. the Cold Plunge takes only sauna leavers)
  Trail.takeFirstGuest = function (S, pred) { for (let i = 0; i < S.trail.length; i++) { const n = S.trail[i]; if (n.kind === 'guest' && (!pred || pred(n.ref))) return unlink(S, i); } return null; };
  Trail.countGuests = function (S, pred) { let n = 0; for (let i = 0; i < S.trail.length; i++) { const t = S.trail[i]; if (t.kind === 'guest' && (!pred || pred(t.ref))) n++; } return n; };
  Trail.removeNode = function (S, node) { const i = S.trail.indexOf(node); if (i >= 0) unlink(S, i); };

  Trail.update = function (S, dt) {
    const k = S.kit, meta = S.trailMeta;
    const ct = k.stoppedT > 0 ? C.TRAIL_STOP_COMPRESS : 1;
    const rate = (1 - C.TRAIL_STOP_COMPRESS) / C.TRAIL_STOP_EASE * dt;
    meta.compress = meta.compress < ct ? Math.min(ct, meta.compress + rate) : Math.max(ct, meta.compress - rate);
    const lerp = 1 - Math.pow(C.TRAIL_LERP_BASE, dt * 60);
    for (let i = 0; i < S.trail.length; i++) {
      const n = S.trail[i];
      targetPoint(S, n.dist * meta.compress, TP);
      n.px = n.x; n.py = n.y;
      if (n.hop) {
        const h = n.hop; h.t += dt; h.x1 = TP.x; h.y1 = TP.y;
        U.hopPos(h, HP); n.x = HP.x; n.y = HP.y; n.z = HP.z;
        if (h.t >= h.dur) { n.hop = null; n.z = 0; n.squashT = C.SQUASH_T; if (n.ref) n.ref.squashT = C.SQUASH_T; }
      } else { n.x += (TP.x - n.x) * lerp; n.y += (TP.y - n.y) * lerp; n.z = 0; }
      const dx = n.x - n.px;
      if (Math.abs(dx) > 0.4) n.face = dx < 0 ? -1 : 1;
      const hz = n.kind === 'guest' && n.ref.kind === 'duck' ? 2 : 1;
      n.bob = k.moving ? -C.TRAIL_BOB_AMP * Math.abs(Math.sin(C.TRAIL_BOB_W * hz * S.t + n.bobPhase)) : 0;
      if (n.kind === 'yuzu') n.roll += U.dist(n.px, n.py, n.x, n.y) / 8;
      if (n.squashT > 0) { n.squashT -= dt; const u = Math.max(0, n.squashT / C.SQUASH_T); n.sx = 1 + (C.SQUASH_X - 1) * u; n.sy = 1 - (1 - C.SQUASH_Y) * u; } else { n.sx = 1; n.sy = 1; }
      if (n.kind === 'guest') { const g = n.ref; g.x = n.x; g.y = n.y; g.face = n.face; g.moving = k.moving; }
    }
  };
  Trail.collect = function (S, list) {
    const cam = G.Camera, H = G.Canvas.H;
    for (let i = 0; i < S.trail.length; i++) { const n = S.trail[i]; if (n.kind === 'guest') continue; if (n.y < cam.y - 60 || n.y > cam.y + H + 60) continue; n.sortY = n.y; list.push(n); }
  };
  Trail.drawItem = function (ctx, n, S) {
    const A = G.Art.S, lift = n.z + (n.kind === 'log' ? -n.bob : 0);
    A.shadow(ctx, n.x, n.y, 12, 4, 0.18 * Math.max(0.4, 1 - n.z / 40));
    ctx.save(); ctx.translate(n.x, n.y - lift); ctx.scale(n.sx, n.sy);
    if (n.kind === 'log') { ctx.rotate(-0.15 * n.face); A.fillRRect(ctx, -13, -12, 26, 10, 4, PAL.cedarDark); A.circle(ctx, 11, -7, 4, PAL.cedar); A.circle(ctx, 11, -7, 1.5, PAL.cedarDark); }
    else { ctx.translate(0, -9); ctx.rotate(n.roll); A.circle(ctx, 0, 0, 8, PAL.yuzu); ctx.strokeStyle = PAL.coinRim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0.3, 1.3); ctx.stroke(); A.ellipse(ctx, 3, -7, 6, 3, PAL.yuzuLeaf); }
    ctx.restore();
  };
})(window.G);
