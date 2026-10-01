// Capy Springs - guests: state machine, lane routing, bubbles, drawing (ARCHITECTURE.md 9.4, GDD 5.1 / 5.11).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, MAP = DATA.MAP, PAL = G.PAL;
  const Guests = G.Guests = {};
  const WAITING = [], HP = { x: 0, y: 0, z: 0 };
  const evG = { g: null }, evPaid = { g: null, value: 0 }, evSeated = { g: null, bath: null };
  const BUBBLES = []; for (let i = 0; i < C.MAX_GUESTS; i++) BUBBLES.push({ g: null, draw: null });
  let bubbleN = 0;

  Guests.init = function (S) { for (let i = 0; i < BUBBLES.length; i++) BUBBLES[i].draw = drawBubble; };

  // ---- pure lane rule (GDD 5.11) ----
  Guests.route = function (from, to, out) {
    const L = MAP.LANE; let n = 0;
    function push(x, y) { if (n > 0 && Math.abs(out[n - 1].x - x) < 1 && Math.abs(out[n - 1].y - y) < 1) return; if (!out[n]) out[n] = { x: 0, y: 0 }; out[n].x = x; out[n].y = y; n++; }
    if (Math.abs(from.x - L.cx) > L.snap) push(L.cx, from.y);
    push(L.cx, to.y);
    push(to.x, to.y);
    out.length = n;
    return out;
  };
  Guests.startWalk = function (S, g, tx, ty, nextState) {
    TO.x = tx; TO.y = ty;
    Guests.route(g, TO, g.routeArr); g.routeN = g.routeArr.length; g.routeI = 0; g.walking = g.routeN > 0; g.nextState = nextState; g.state = nextState; g.hop = null;
    if (g.routeN > 0) faceTo(g, g.routeArr[0].x);
  };
  const TO = { x: 0, y: 0 };
  function faceTo(g, tx) { const dx = tx - g.x; if (Math.abs(dx) > 0.5) g.face = dx < 0 ? -1 : 1; }
  function advanceWalk(g, dt) {                 // returns true on arrival at the last waypoint
    if (!g.walking) return true;
    const p = g.routeArr[g.routeI];
    g.moving = true; g.bobPhase += dt * g.walk / 30;
    if (U.moveToward(g, p.x, p.y, g.walk, dt)) { g.routeI++; if (g.routeI >= g.routeN) { g.walking = false; g.moving = false; return true; } faceTo(g, g.routeArr[g.routeI].x); }
    return false;
  }

  Guests.spawn = function (S, kind, carId, golden, x0, y0) {
    const g = G.State.newGuest(S, kind, carId); if (!g) return null;
    g.golden = !!golden; g.tutorial = carId === 1; g.x = x0; g.y = y0; g.state = 'arrive'; g.walking = false;
    const m = MAP.PLATFORM.mill, h = g.hopObj;
    h.x0 = x0; h.y0 = y0; h.x1 = U.rand(m.x0, m.x1); h.y1 = U.rand(m.y0, m.y1); h.t = 0; h.dur = C.HOP_OUT_T; h.h = 18; g.hop = h;
    faceTo(g, h.x1);
    return g;
  };
  Guests.waiting = function (S) { WAITING.length = 0; for (let i = 0; i < S.guests.length; i++) { const g = S.guests[i]; if (g.state === 'wait' && g.want === 'bath') WAITING.push(g); } return WAITING; };
  Guests.nearestWaiting = function (S, x, y, maxDist) {
    let best = null, bd = maxDist * maxDist;
    for (let i = 0; i < S.guests.length; i++) { const g = S.guests[i]; if (g.state !== 'wait') continue; const d = U.dist2(g.x, g.y, x, y); if (d <= bd) { bd = d; best = g; } }
    return best;
  };
  Guests.countWaiting = function (S) { let n = 0; for (let i = 0; i < S.guests.length; i++) { const s = S.guests[i].state; if (s === 'wait' || s === 'arrive') n++; } return n; };
  Guests.seat = function (S, g, bathId, slot, hop) { g.state = 'soak'; g.bathId = bathId; g.slot = slot; g.hop = hop; g.walking = false; g.moving = false; g.heartT = 0; g.sleepy = 0; g.shiver = false; };
  Guests.finishSoak = function (S, g, bath) {
    g.state = 'pay'; g.bathId = bath.id; g.slot = -1; g.walking = false; g.shiver = false;
    const h = g.hopObj, e = bath.def.exit; h.x0 = g.x; h.y0 = g.y; h.x1 = e.x; h.y1 = e.y; h.t = 0; h.dur = C.CLIMB_OUT_T; h.h = 22; g.hop = h;
    faceTo(g, e.x);
  };
  Guests.leaveImpatient = function (S, g) {
    if (g.node) G.Trail.removeNode(S, g.node);
    g.want = null; S.stats.lost++;
    evG.g = g; G.Bus.emit('guest:lost', evG);
    Guests.startWalk(S, g, MAP.PLATFORM.exit.x, MAP.PLATFORM.exit.y, 'leave');
  };
  Guests.remove = function (S, g) { evG.g = g; G.Bus.emit('guest:gone', evG); G.State.freeGuest(S, g); };

  Guests.update = function (S, dt) {
    const kit = S.kit, Trail = G.Trail;
    // joining: one guest per TRAIL_JOIN_GAP
    if (S.t - S.trailMeta.joinT >= C.TRAIL_JOIN_GAP && !Trail.full(S)) {
      const g = Guests.nearestWaiting(S, kit.x, kit.y, C.TRAIL_JOIN_R);
      if (g && Trail.join(S, 'guest', g, g.x, g.y)) {
        g.state = 'trail'; g.walking = false; g.moving = false;
        const d = DATA.GUESTS[g.kind];
        g.patienceMax = g.tutorial ? Infinity : d.patienceTrail * (g.golden ? C.GOLDEN_PATIENCE : 1); g.patience = g.patienceMax;
      }
    }
    const arrow = S.ui.arrow, stokeRule = arrow && (arrow.rule === 3 || arrow.rule === 5);
    for (let i = S.guests.length - 1; i >= 0; i--) {
      const g = S.guests[i];
      if (g.squashT > 0) { g.squashT -= dt; const u = Math.max(0, g.squashT / C.SQUASH_T); g.sx = 1 + (C.SQUASH_X - 1) * u; g.sy = 1 - (1 - C.SQUASH_Y) * u; } else { g.sx = 1; g.sy = 1; }
      switch (g.state) {
        case 'arrive': {
          const h = g.hop; h.t += dt; U.hopPos(h, HP); g.x = HP.x; g.y = HP.y; g.z = HP.z;
          if (h.t >= h.dur) {
            g.hop = null; g.z = 0; g.state = 'wait'; g.squashT = C.SQUASH_T;
            const d = DATA.GUESTS[g.kind];
            g.patienceMax = g.tutorial ? Infinity : d.patienceWait * (g.golden ? C.GOLDEN_PATIENCE : 1); g.patience = g.patienceMax; g.want = 'bath';
            g.millT = U.rand(C.MILL_MIN, C.MILL_MAX); g.mx = g.x; g.my = g.y;
            evG.g = g; G.Bus.emit('guest:spawn', evG);
          }
          break;
        }
        case 'wait': {
          g.millT -= dt;
          if (g.millT <= 0) { const m = MAP.PLATFORM.mill; g.millT = U.rand(C.MILL_MIN, C.MILL_MAX); g.mx = U.rand(m.x0, m.x1); g.my = U.rand(m.y0, m.y1); faceTo(g, g.mx); }
          if (Math.abs(g.mx - g.x) > 1 || Math.abs(g.my - g.y) > 1) { g.moving = true; g.bobPhase += dt * g.walk / 30; U.moveToward(g, g.mx, g.my, g.walk * 0.6, dt); } else g.moving = false;
          if (g.patienceMax !== Infinity) { g.patience -= dt; if (g.patience <= 0) { Guests.leaveImpatient(S, g); } }
          break;
        }
        case 'trail': {
          if (g.patienceMax !== Infinity) { g.patience -= dt * (S.heat.cold && stokeRule ? C.COLD_PATIENCE_MULT : 1); if (g.patience <= 0) Guests.leaveImpatient(S, g); }
          break;
        }
        case 'soak': break;                                     // owned by Baths
        case 'pay': {
          if (g.hop) {
            const h = g.hop; h.t += dt; U.hopPos(h, HP); g.x = HP.x; g.y = HP.y; g.z = HP.z;
            if (h.t >= h.dur) {
              g.hop = null; g.z = 0; g.squashT = C.SQUASH_T;
              const bath = S.baths[g.bathId], value = G.Baths.payout(S, g);
              g.paid = value; G.Coins.burst(S, value, g.x, g.y, bath.id);
              evPaid.g = g; evPaid.value = value; G.Bus.emit('guest:paid', evPaid);
              S.stats.served++; if (g.kind === 'duck') S.stats.ducks++; if (DATA.GUESTS[g.kind].vip) S.stats.vip++;
              let spot = -1;
              if (S.built.stall && g.kind === 'capy' && U.rand() < C.STALL_WANT) spot = G.Stall.reserve(S, g);
              if (spot >= 0) { g.want = 'mochi'; g.queueT = 0; const q = DATA.STATIONS.stall.queue[spot]; Guests.startWalk(S, g, q[0], q[1], 'stall'); }
              else { g.want = null; Guests.startWalk(S, g, MAP.PLATFORM.exit.x, MAP.PLATFORM.exit.y, 'leave'); }
            }
          }
          break;
        }
        case 'stall': {
          if (advanceWalk(g, dt) && g.queueSpot >= 0) {
            g.queueT += dt;
            if (g.queueT >= C.STALL_PATIENCE) { G.Stall.release(S, g); g.want = null; evG.g = g; G.Bus.emit('guest:bored', evG); Guests.startWalk(S, g, MAP.PLATFORM.exit.x, MAP.PLATFORM.exit.y, 'leave'); }
          }
          break;
        }
        case 'leave': {
          if (advanceWalk(g, dt)) {
            g.waveT += dt; g.moving = false;
            if (g.waveT > C.LEAVE_WAVE_T - 0.2) g.alpha = Math.max(0, (C.LEAVE_WAVE_T - g.waveT) / 0.2);
            if (g.waveT >= C.LEAVE_WAVE_T) Guests.remove(S, g);
          }
          break;
        }
      }
    }
  };

  Guests.collect = function (S, list) {
    const cam = G.Camera, H = G.Canvas.H;
    for (let i = 0; i < S.guests.length; i++) { const g = S.guests[i]; if (g.state === 'soak' || g.state === 'gone') continue; if (g.y < cam.y - 120 || g.y > cam.y + H + 60) continue; g.sortY = g.y; list.push(g); }
  };
  Guests.collectText = function (S, list) {
    const kit = S.kit, arrow = S.ui.arrow, cam = G.Camera, H = G.Canvas.H;
    bubbleN = 0;
    for (let i = 0; i < S.guests.length && bubbleN < BUBBLES.length; i++) {
      const g = S.guests[i]; if (g.state === 'gone' || g.state === 'arrive' || g.state === 'leave') continue;
      if (g.y < cam.y - 60 || g.y > cam.y + H + 60) continue;
      const b = bubbleKind(S, g); if (!b) continue;
      if (b === 'bath') { const targeted = arrow && arrow.kind === 'guest' && arrow.ref === g; if (!targeted && U.dist2(kit.x, kit.y, g.x, g.y) > C.BUBBLE_DIST * C.BUBBLE_DIST) continue; }
      const o = BUBBLES[bubbleN++]; o.g = g; list.push(o);
    }
  };
  function bubbleKind(S, g) {
    if (g.state === 'wait' || g.state === 'trail') { if (g.patienceMax !== Infinity && g.patience / g.patienceMax < C.SWEAT_AT) return 'sweat'; return g.state === 'wait' ? 'bath' : null; }
    if (g.state === 'soak') { const b = S.baths[g.bathId]; return (b && !G.Baths.isWarm(S, b)) ? 'snow' : null; }
    if (g.state === 'stall' && !g.walking) return g.queueT > (1 - C.SWEAT_AT) * C.STALL_PATIENCE ? 'sweat' : 'mochi';
    return null;
  }
  function drawBubble(ctx, o, S) {
    const g = o.g, Ch = G.Art.Ch, p = Ch.resetPose(Ch.POSE);
    p.x = g.x; p.y = g.y - (g.z || 0); p.face = g.face; p.bubble = bubbleKind(S, g); p.inWater = g.state === 'soak' ? S.baths[g.bathId].def.water : null;
    if (p.bubble === 'snow') p.bubble = G.Seasons.text('coldBubble', 'snow');       // "the station cannot serve you right now" in the season's own icon
    if (p.bubble === 'sweat') { const u = g.state === 'stall' ? g.queueT / C.STALL_PATIENCE : 1 - g.patience / g.patienceMax; p.bubbleScale = 0.8 + 0.6 * U.clamp((u - (1 - C.SWEAT_AT)) / C.SWEAT_AT, 0, 1); }
    Ch.bubble(ctx, p);
  }
  Guests.fillPose = function (S, g, p) {
    p.x = g.x; p.y = g.y; p.z = g.z || 0; p.face = g.face; p.moving = !!g.moving; p.walk = g.bobPhase; p.sx = g.sx; p.sy = g.sy; p.alpha = g.alpha; p.t = S.t;
    p.hat = g.yuzuHat ? 'yuzu' : null; p.shiver = g.shiver; p.dir = 'side'; p.scarf = DATA.GUESTS[g.kind].scarf || null; p.vip = !!DATA.GUESTS[g.kind].vip;
    if (g.shiver) { TINT.color = PAL.waterCold; TINT.alpha = 0.3; p.tint = TINT; }
    if (g.state === 'trail' && g.node) { p.y = g.y + g.node.bob; p.z = g.node.z; p.moving = S.kit.moving; p.walk = S.t * 8 * (g.kind === 'duck' ? 2 : 1); }
    if (g.state === 'wait' && g.walking === false && g.moving) p.dir = Math.abs(g.my - g.y) > Math.abs(g.mx - g.x) ? (g.my > g.y ? 'down' : 'up') : 'side';
    if (g.walking && g.routeI < g.routeN) { const r = g.routeArr[g.routeI]; if (Math.abs(r.x - g.x) < 1) p.dir = r.y > g.y ? 'down' : 'up'; }
    if (g.state === 'leave' && !g.walking) { p.pose = 'wave'; p.dir = 'down'; }
    return p;
  };
  const TINT = { color: null, alpha: 0 };
  Guests.draw = function (ctx, g, S) { const Ch = G.Art.Ch; const p = Guests.fillPose(S, g, Ch.resetPose(Ch.POSE)); Ch.guest(ctx, p, g.kind); };
})(window.G);
