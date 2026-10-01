// Capy Springs - Kaa the crow (season micro-event, DATA.KAA): lands on the fullest coin tray every so often; tap him inside the ring for a coin
// fountain, ignore him and he flies off with a few koban (GDD 17.3). One entity, two timers, one hit-test; idle unless the pack defines KAA.
(function (G) {
  'use strict';
  const U = G.U, DATA = G.DATA, K = DATA.KAA || null;
  const Kaa = G.Kaa = {};
  const drawable = { sortY: 0, draw: null }, ev = { x: 0, y: 0, value: 0 };
  const LEAVE_T = 0.7;

  Kaa.init = function (S) { drawable.draw = draw; };
  Kaa.active = S => !!K && !!S.built[K.requires];
  Kaa.update = function (S, dt) {
    if (!K) return;
    const k = S.kaa;
    if (k.state === 'away') {
      if (!Kaa.active(S)) return;
      k.t -= dt;
      if (k.t <= 0) {
        const tray = G.Coins.richestTray(S, 270, 1600, 1e9, null);
        if (!tray || G.Loop.hitstop > 0) { k.t = 2; return; }                 // nothing to land on yet: look again in 2 s
        k.state = 'land'; k.x = tray.x; k.y = tray.y - 4; k.trayId = tray.id; k.timer = K.stay;
        ev.x = k.x; ev.y = k.y; ev.value = 0; G.Bus.emit('kaa:land', ev);
      }
    } else if (k.state === 'land') {
      k.timer -= dt;
      if (k.timer <= 0) {
        const t = S.trays[k.trayId], take = t ? Math.min(K.take, t.value) : 0;
        if (t) t.value -= take;
        ev.x = k.x; ev.y = k.y; ev.value = take; G.Bus.emit('kaa:steal', ev);
        leave(S);
      }
    } else if (k.state === 'leave') {
      k.leaveT += dt;
      if (k.leaveT >= LEAVE_T) { k.state = 'away'; k.t = S.night.active ? K.nightEvery : K.every; }
    }
  };
  function leave(S) { const k = S.kaa; k.state = 'leave'; k.leaveT = 0; }
  // world-space tap; the reward is a share of the banked coins, clamped, rained toward Kit from the tray
  Kaa.tap = function (S, wx, wy) {
    if (!K) return false;
    const k = S.kaa; if (k.state !== 'land') return false;
    if (U.dist2(wx, wy, k.x, k.y - 22) > K.r * K.r) return false;
    const value = Math.round(U.clamp(S.coins * K.share, K.min, K.max));
    G.Coins.rain(S, value, k.x, k.y, 'kaa'); k.won += value; S.stats.kaa++;
    ev.x = k.x; ev.y = k.y; ev.value = value; G.Bus.emit('kaa:tap', ev);
    leave(S);
    return true;
  };
  Kaa.collect = function (S, list) { if (!K || S.kaa.state === 'away') return; drawable.sortY = S.kaa.y + 1; if (G.Camera.visibleY(S.kaa.y, 200)) list.push(drawable); };
  function draw(ctx, o, S) {
    const k = S.kaa, fly = k.state === 'leave' ? Math.min(1, k.leaveT / LEAVE_T) : 0;
    G.Art.Ch.kaa(ctx, k.x, k.y - fly * fly * 180, fly, S.t, k.state === 'land' ? k.timer / K.stay : 0);
  }
})(window.G);
