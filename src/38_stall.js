// Capy Springs - Snack Stall (MVP Plus): yuzu -> mochi, queue, serving (ARCHITECTURE.md 9.7, GDD 5.6). Every function is a safe no-op when the stall is not built.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, ST = DATA.STATIONS.stall, MAP = DATA.MAP;
  const Stall = G.Stall = {};
  const evMochi = { g: null, value: 0 };
  const top = { sortY: ST.y + 18, draw: null };

  Stall.init = function (S) { top.draw = drawTop; };
  Stall.room = S => S.built.stall && (S.stall.stock + S.stall.pending) < G.Upgrades.counter(S);
  Stall.deliver = function (S, by) {
    if (!Stall.room(S)) return false;
    if (by === 'kit' && !G.Trail.takeFirst(S, 'yuzu')) return false;
    S.stall.pending++;
    return true;
  };
  Stall.queueFree = function (S) { if (!S.built.stall) return -1; for (let i = 0; i < S.stall.queue.length; i++) if (!S.stall.queue[i]) return i; return -1; };
  Stall.reserve = function (S, g) { const i = Stall.queueFree(S); if (i < 0) return -1; S.stall.queue[i] = g; g.queueSpot = i; return i; };
  Stall.release = function (S, g) { if (g.queueSpot >= 0 && S.stall.queue[g.queueSpot] === g) S.stall.queue[g.queueSpot] = null; g.queueSpot = -1; };
  Stall.queued = function (S) { let n = 0; for (let i = 0; i < S.stall.queue.length; i++) if (S.stall.queue[i]) n++; return n; };
  Stall.serve = function (S, g) {
    S.stall.stock--;
    const pay = Math.round(G.Upgrades.mochiPay(S) * (S.night.active ? C.NIGHT_PAY : 1) * G.Upgrades.famousMult(S) * G.Upgrades.starMult(S));
    G.Coins.burst(S, pay, g.x, g.y, 'stall');
    S.stats.mochi++;
    evMochi.g = g; evMochi.value = pay; G.Bus.emit('guest:mochi', evMochi);
    Stall.release(S, g); g.want = null;
    const ex = G.Ridge.exitFor(S, g); G.Guests.startWalk(S, g, ex.x, ex.y, 'leave');
  };
  Stall.update = function (S, dt) {
    if (!S.built.stall) return;
    const st = S.stall, kit = S.kit;
    if (st.pending > 0 && st.stock < G.Upgrades.counter(S)) { st.prepT += dt; if (st.prepT >= G.Upgrades.prep(S)) { st.stock++; st.pending--; st.prepT = 0; } }
    else st.prepT = 0;
    st.serveT += dt;
    if (st.stock > 0 && st.serveT >= 0.3) {
      for (let i = 0; i < st.queue.length; i++) { const g = st.queue[i]; if (g && g.state === 'stall' && !g.walking) { st.serveT = 0; Stall.serve(S, g); break; } }
    }
    if (G.Trail.hasKind(S, 'yuzu') && U.dist2(kit.x, kit.y, ST.zone.x, ST.zone.y) <= ST.zone.r * ST.zone.r && Stall.room(S)) Stall.deliver(S, 'kit');
  };
  Stall.collect = function (S, list) { if (S.built.stall && G.Camera.visibleY(ST.y, 120)) list.push(top); };
  function drawTop(ctx, o, S) { const st = S.stall; G.Art.W.stallTop(ctx, ST.x, ST.y, st.stock, st.pending > 0 ? st.prepT / G.Upgrades.prep(S) : 0); }
})(window.G);
