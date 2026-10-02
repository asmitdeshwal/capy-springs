// Capy Springs - boot, mode sync, update / draw orchestration, tap dispatch, visibility (ARCHITECTURE.md 3 / 19.4).
(function (G) {
  'use strict';
  const C = G.C, U = G.U;
  const Game = G.Game = { S: null, headless: false };
  const W = { x: 0, y: 0 }, P = { x: 0, y: 0 };

  function initSystems(S) {
    Game.S = S; G.S = S;
    G.Player.init(S); G.Trail.init(S); G.CableCar.init(S); G.Guests.init(S); G.Baths.init(S); G.Heat.init(S); G.Grove.init(S); G.Stall.init(S);
    G.Coins.init(S); G.Lanterns.init(S); G.Helpers.init(S); G.Events.init(S); G.Kaa.init(S); G.Snow.init(S); G.Lift.init(S); G.Troupe.init(S); G.FX.init(S); G.Camera.init(S);
    G.Camera.script = null;
    if (!Game.revealSubscribed && !Game.headless) { Game.revealSubscribed = true; G.Bus.on('ridge:open', () => G.Camera.reveal(Game.S, G.DATA.MAP.RIDGE.camMinY)); G.Bus.on('summit:open', () => G.Camera.reveal(Game.S, G.DATA.MAP.SUMMIT.camMinY)); }
    G.HUD.init(S); G.Sheet.init(S); G.Cards.init(S); G.Goals.init(S); G.Story.init(S); G.Golden.init(S); G.Render.init(S);
    G.Render.rebuildStatic(S);
    if (G.Audio.setEnabled) G.Audio.setEnabled(S, S.settings.sound);
  }
  Game.newGame = function () {
    const S = G.State.create();
    // a phone that reports 2 GB of memory or less (Android Chrome; iPhones never report it) starts on Low effects; Settings can turn it off
    if (!Game.headless) { try { const m = navigator.deviceMemory; if (m && m <= 2) S.settings.lowFx = true; } catch (e) { /* not reported */ } }
    initSystems(S);
    S.mode = 'intro'; S.introT = 0;
    if (Game.debugFlag) S.ui.debug = true;
    return S;
  };
  Game.loadGame = function (obj) {
    const S = G.State.create();
    G.Save.apply(S, obj);
    initSystems(S);
    const info = G.Save.offline(obj, Date.now());
    if (info.away >= C.OFFLINE_MIN) { S.heat.v = Math.max(S.heat.v, S.helpers.pon.hired ? C.RETURN_HEAT_PON : C.RETURN_HEAT); S.heat.v = Math.min(S.heat.v, S.heat.max); }   // a real absence warms the boiler back up; a reload does not
    // the Welcome-back card waits behind the title screen's PLAY in the browser (a COPY: offlineCalc reuses one object); the harness has no title
    if (info.show) { if (Game.headless) G.Cards.showOffline(S, info); else G.Title.pending = Object.assign({}, info); } else G.Coins.add(S, info.coins + info.floorCoins, 'offline');
    S.mode = 'play'; Game.syncMode(S);
    if (Game.debugFlag) S.ui.debug = true;
    return S;
  };
  Game.boot = function (opts) {
    Game.headless = !!(opts && opts.headless) || !!G.HEADLESS;
    if (!Game.headless) {
      try { Game.debugFlag = G.Dev.allowed && /[?&]debug=1/.test(location.search); } catch (e) { Game.debugFlag = false; }
      G.Canvas.init(document.getElementById('game'));
    }
    G.Audio.init(null);
    G.Input.init(Game.headless ? null : G.Canvas.el);
    const obj = Game.headless ? null : G.Save.read();
    if (obj) Game.loadGame(obj); else Game.newGame();
    if (Game.headless) return Game.S;
    Game.S.mode = 'title'; G.Title.t = 0;                // the browser always starts on the title screen
    if (Game.S.settings.lowFx) G.Canvas.resize();         // Low effects caps the pixel ratio: size the canvas for it now
    G.Loop.start(Game.step, Game.frame);
    try { const b = document.getElementById('boot'); if (b) { b.classList.add('gone'); setTimeout(() => { if (b.parentNode) b.parentNode.removeChild(b); }, 450); } } catch (e) { /* no boot screen */ }
    document.addEventListener('visibilitychange', () => {
      const S = Game.S; if (!S) return;
      if (document.hidden) { if (S.mode !== 'paused') S.prevMode = S.mode; S.mode = 'paused'; G.Save.write(S); G.Loop.stop(); }
      else Game.resume(S, Date.now());
    });
    window.addEventListener('pagehide', () => { if (Game.S) G.Save.write(Game.S); });
    window.addEventListener('beforeunload', () => { if (Game.S) G.Save.write(Game.S); });
    return Game.S;
  };
  // a still-open tab returning: live return, never a reload
  Game.resume = function (S, nowMs) {
    if (!Game.headless) G.Loop.start(Game.step, Game.frame);
    if (G.Audio.unlocked && G.Audio.unlock) G.Audio.unlock();   // re-resume a context iOS suspended in the background
    if (S.mode !== 'paused') return;
    // an uncollected offline card is still up: keep it, never recompute over it
    if (S.ui.card && S.ui.card.kind === 'offline' && !(S.ui.card.closing > 0)) { S.mode = S.prevMode === 'paused' ? 'play' : S.prevMode; Game.syncMode(S); return; }
    if (S.prevMode === 'finale') { S.mode = 'finale'; return; }                          // the ending picks up where it was
    // earnings already waiting behind the title's PLAY: keep them (the stamp was not advanced), never recompute over them
    if (S.prevMode === 'title' && G.Title.pending && G.Title.pending.show) { S.mode = 'title'; return; }
    if (nowMs - S.savedAt >= C.OFFLINE_MIN * 1000) {
      const info = G.Save.offlineLive(S, nowMs);
      S.heat.v = Math.min(S.heat.max, Math.max(S.heat.v, S.helpers.pon.hired ? C.RETURN_HEAT_PON : C.RETURN_HEAT));
      S.mode = S.prevMode === 'paused' ? 'play' : S.prevMode;
      if (S.mode === 'title') { if (info.show) G.Title.pending = Object.assign({}, info); else G.Coins.add(S, info.coins, 'offline'); return; }   // the title holds the card until PLAY
      if (info.show) G.Cards.showOffline(S, info); else G.Coins.add(S, info.coins, 'offline');
    } else S.mode = S.prevMode === 'paused' ? 'play' : S.prevMode;
    Game.syncMode(S);
  };
  Game.syncMode = function (S) {
    if (S.mode === 'intro' || S.mode === 'paused' || S.mode === 'title' || S.mode === 'finale') return;
    S.mode = S.ui.card ? 'card' : S.ui.settings ? 'settings' : S.ui.sheet ? 'sheet' : 'play';
  };
  Game.nudge = function (S) { S.kit.nudgeT = C.TAP_NUDGE_T; };
  Game.uiOwns = function (S, x, y) {
    if (S.ui.card) return true;
    if (S.ui.settings && G.Cards.settingsHas(x, y)) return true;
    if (S.ui.sheet && y >= G.Sheet.top(S)) return true;
    const r = G.HUD.R.gearHit; if (r && x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return true;
    return false;
  };
  Game.onTap = function (S, tap) {
    const x = tap.x, y = tap.y;
    if (S.mode === 'finale') { G.Finale.tap(S, x, y); return; }                     // the ending owns every tap
    if (G.Camera.script) { G.Camera.script = null; return; }                         // a tap skips a stage reveal
    if (S.mode === 'intro') { S.mode = 'play'; S.introT = C.INTRO_T; Game.syncMode(S); }
    if (G.Cards.tap(S, x, y)) return;
    if (S.mode === 'play' && G.Story.tap(S, x, y)) return;
    if (S.mode === 'title') { G.Title.tap(S, x, y); return; }
    if (G.Sheet.tap(S, x, y)) return;
    if (G.HUD.tapGear(S, x, y)) return;
    if (G.Goals.tapChip(S, x, y)) return;
    if (G.Dev.tapChip(S, x, y)) return;
    G.Camera.toWorld(x, y, W);
    if (G.Kaa.tap(S, W.x, W.y)) return;
    const id = G.Sheet.stationAt(S, W.x, W.y);
    if (id) { G.Hints.stationPoint(S, id, P); if (U.dist(S.kit.x, S.kit.y, P.x, P.y) <= C.STATION_TAP_DIST) G.Sheet.open(S, id); else G.HUD.farTap(S, id); return; }
    if (tap.zone === 'joy' && !S.tutorial.DRAG) Game.nudge(S);     // a tapper still gets a hop until the first real drag
  };
  Game.key = function (name) {
    const S = Game.S; if (!S) return;
    if (name === 'E') {
      if (S.ui.sheet) { G.Sheet.close(S); return; }
      let best = null, bd = C.STATION_TAP_DIST * C.STATION_TAP_DIST;
      for (let i = 0; i < G.DATA.SHEET_STATIONS.length; i++) { const id = G.DATA.SHEET_STATIONS[i]; if (!S.built[id]) continue; G.Hints.stationPoint(S, id, P); const d = U.dist2(S.kit.x, S.kit.y, P.x, P.y); if (d < bd) { bd = d; best = id; } }
      if (best) G.Sheet.open(S, best);
    } else if (name === 'ESC') { if (S.ui.sheet) G.Sheet.close(S); if (S.ui.settings) { S.ui.settings = false; Game.syncMode(S); } if (S.mode === 'intro') { S.mode = 'play'; Game.syncMode(S); } }
    else if (name === 'M') { S.settings.sound = !S.settings.sound; G.Audio.setEnabled(S, S.settings.sound); }
    else if (name === 'DEBUG') { if (G.Dev.on) S.ui.debug = !S.ui.debug; }
    else if (name === 'ENTER') { if (S.mode === 'title' && !S.ui.card && !S.ui.settings) G.Title.play(S); else if (S.mode === 'intro') { S.mode = 'play'; S.introT = C.INTRO_T; Game.syncMode(S); } }
    else if (name === 'DEV') { if (!G.Dev.on) return; if (S.ui.card && S.ui.card.kind === 'dev') G.Cards.close(S); else if (!S.ui.card) G.Cards.showDev(S); }
  };
  Game.step = function (dt) {
    const S = Game.S; if (!S) return;
    G.Input.update(dt);
    const taps = G.Input.takeTaps();
    for (let i = 0; i < taps.length; i++) Game.onTap(S, taps[i]);
    G.Dev.update(S, dt);
    const Loop = G.Loop;
    if (S.mode === 'title') { G.Title.update(S, dt); G.Cards.update(S, dt); G.FX.update(S, dt); G.HUD.update(S, dt); return; }
    if (S.mode === 'finale') { G.Finale.update(S, dt); G.FX.update(S, dt); return; }       // the ending: the sim waits, the scene plays
    if (G.Camera.script) { G.Camera.update(S, dt); G.FX.update(S, dt); G.HUD.update(S, dt); G.Cards.update(S, dt); return; }   // a stage reveal: the sim waits for the camera
    if (Loop.hitstop > 0) { Loop.hitstop -= dt; G.FX.update(S, dt); G.HUD.update(S, dt); G.Camera.update(S, dt); return; }
    // cards, the settings popover and a hidden tab pause the simulation (the upgrade sheet does not: you steer with it open)
    if (S.mode === 'card' || S.mode === 'paused' || S.mode === 'settings') { G.Cards.update(S, dt); G.HUD.update(S, dt); G.FX.update(S, dt); return; }
    if (S.mode === 'intro') { S.introT += dt; if (S.introT >= C.INTRO_T) { S.mode = 'play'; Game.syncMode(S); } }
    S.t += dt;
    G.Player.update(S, dt); G.Trail.update(S, dt); G.CableCar.update(S, dt); G.Lift.update(S, dt); G.Troupe.update(S, dt); G.Guests.update(S, dt); G.Baths.update(S, dt); G.Heat.update(S, dt);
    G.Grove.update(S, dt); G.Stall.update(S, dt); G.Coins.update(S, dt); G.Lanterns.update(S, dt); G.Helpers.update(S, dt); G.Events.update(S, dt); G.Kaa.update(S, dt); G.Snow.update(S, dt);
    G.Goals.update(S, dt); G.Story.update(S, dt); G.Golden.update(S, dt);
    G.Hints.update(S, dt); G.FX.update(S, dt); G.Camera.update(S, dt); G.HUD.update(S, dt); G.Sheet.update(S, dt); G.Cards.update(S, dt);
    G.Save.tick(S, dt);
  };
  Game.frame = function (dt) { const S = Game.S; if (!S || S.mode === 'paused') return; G.Render.frame(S, G.Canvas.ctx); Game.updatePerf(dt); };
  Game.updatePerf = function (dt) {
    const S = Game.S, L = G.Loop; if (!S) return;
    S.perf.frameMs = L.frameMs; S.perf.stepMs = L.stepMs;
    // slow = the real frame interval (a weak GPU rasterises after our callback returns, so JS time alone never sees it); settle a second after a start
    if (!S.settings.lowFx && L.hitstop <= 0) { if ((L.fps < C.LOWFX_FPS || L.frameMs > C.LOWFX_MS) && L.runT > 1) { S.perf.slowT += dt; if (S.perf.slowT >= C.LOWFX_WINDOW) { S.settings.lowFx = true; G.Canvas.resize(); } } else S.perf.slowT = 0; }
  };
  // the native apps first bring back any save that WebView storage lost (Capacitor Preferences keeps a copy), then boot
  // (the season meta was read before the restore: re-read it, and reload once if the restored meta points at another place)
  if (!G.HEADLESS) window.addEventListener('load', () => {
    G.Save.store.restore().then(r => {
      if (r) { const m = G.Seasons.readMeta(); if (m.season !== G.SEASON.id) { try { location.reload(); return; } catch (e) { /* boot anyway */ } } G.Seasons.meta = m; }
      G.Dev.refresh(); Game.boot();
    }, () => Game.boot());
  });
})(window.G);
