// Capy Springs - helpers: Pon the stoker (straight-line walker) and Kero the picker (hopper) (ARCHITECTURE.md 9.10, GDD 5.3 / 5.6).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, ST = DATA.STATIONS, HD = DATA.HELPERS;
  const Helpers = G.Helpers = {};
  const evHire = { id: null }, evHop = { id: 'kero' }, HP = { x: 0, y: 0, z: 0 };
  const ponD = { sortY: 0, draw: null }, keroD = { sortY: 0, draw: null };

  Helpers.init = function (S) { ponD.draw = drawPon; keroD.draw = drawKero; };
  Helpers.hire = function (S, id, opts) {
    const h = S.helpers[id]; if (!h) return;
    h.hired = true; h.x = HD[id].home.x; h.y = HD[id].home.y; h.t = 0;
    if (!(opts && opts.silent)) { evHire.id = id; G.Bus.emit('helper:hire', evHire); }
  };
  function squash(h, dt) { if (h.squashT > 0) { h.squashT -= dt; const u = Math.max(0, h.squashT / C.SQUASH_T); h.sx = 1 + (C.SQUASH_X - 1) * u; h.sy = 1 - (1 - C.SQUASH_Y) * u; } else { h.sx = 1; h.sy = 1; } }
  function walkTo(h, tx, ty, speed, dt) { const dx = tx - h.x; if (Math.abs(dx) > 0.5) h.face = dx < 0 ? -1 : 1; h.moving = true; h.walk += dt * 6; return U.moveToward(h, tx, ty, speed, dt); }

  function updatePon(S, dt) {
    const p = S.helpers.pon; if (!p.hired) return;
    squash(p, dt); p.moving = false;
    const sp = G.Upgrades.ponSpeed(S);
    switch (p.state) {
      case 'rest':
        p.t += dt; if (p.yawn > 0) p.yawn -= dt;
        if (p.t >= G.Upgrades.ponRest(S) && S.heat.v < C.PON_CAP && S.built.woodpile) { p.state = 'toWood'; }
        break;
      case 'toWood': if (walkTo(p, ST.woodpile.home.x, ST.woodpile.home.y, sp, dt)) { p.state = 'take'; p.t = 0; } break;
      case 'take': p.t += dt; if (p.t >= HD.pon.take) { p.hasLog = true; p.state = 'toBoiler'; } break;
      case 'toBoiler': if (walkTo(p, ST.boiler.home.x, ST.boiler.home.y, sp, dt)) { p.state = 'stoke'; p.t = 0; } break;
      case 'stoke':
        p.t += dt;
        if (p.t >= HD.pon.stoke) { G.Heat.add(S, Math.min(G.Upgrades.stoke(S), Math.max(0, C.PON_CAP - S.heat.v)), 'pon'); p.hasLog = false; p.state = 'rest'; p.t = 0; p.yawn = HD.pon.yawn; }
        break;
      default: p.state = 'rest';
    }
  }
  function startHop(S, k, tx, ty) {
    const dx = tx - k.x, dy = ty - k.y, d = Math.sqrt(dx * dx + dy * dy), len = Math.min(d, C.KERO_HOP_LEN);
    const h = k.hopObj; h.x0 = k.x; h.y0 = k.y; h.x1 = d > 0.001 ? k.x + dx / d * len : k.x; h.y1 = d > 0.001 ? k.y + dy / d * len : k.y; h.t = 0; h.dur = C.KERO_HOP_T * Math.max(0.4, len / C.KERO_HOP_LEN); h.h = C.KERO_HOP_H; k.hop = h;
    if (Math.abs(dx) > 0.5) k.face = dx < 0 ? -1 : 1;
    G.Bus.emit('helper:hop', evHop);
  }
  function hopToward(S, k, tx, ty, dt) {      // returns true when standing at (tx, ty)
    if (k.hop) {
      const h = k.hop; h.t += dt; U.hopPos(h, HP); k.x = HP.x; k.y = HP.y; k.z = HP.z;
      if (h.t >= h.dur) { k.hop = null; k.z = 0; k.x = h.x1; k.y = h.y1; k.squashT = C.SQUASH_T * 0.75; }
      return false;
    }
    if (U.dist2(k.x, k.y, tx, ty) < 4) return true;
    startHop(S, k, tx, ty);
    return false;
  }
  function updateKero(S, dt) {
    const k = S.helpers.kero; if (!k.hired) return;
    squash(k, dt);
    const home = HD.kero.home;
    switch (k.state) {
      case 'wait':
        if (hopToward(S, k, home.x, home.y, dt) && S.built.stall && G.Stall.room(S) && G.Grove.ripeCount(S) > 0) { k.tree = G.Grove.nearestRipe(S, k.x, k.y); if (k.tree) { k.tx = k.tree.x; k.ty = k.tree.y + 30; k.state = 'toTree'; } }
        break;
      case 'toTree':
        if (!k.tree || !k.tree.ripe) { k.tree = G.Grove.nearestRipe(S, k.x, k.y); if (!k.tree) { k.state = 'wait'; break; } k.tx = k.tree.x; k.ty = k.tree.y + 30; }
        if (hopToward(S, k, k.tx, k.ty, dt)) { k.state = 'pick'; k.t = 0; }
        break;
      case 'pick':
        k.t += dt;
        if (k.t >= HD.kero.pick) { if (G.Grove.pick(S, k.tree, 'kero')) { k.hasYuzu = true; k.state = 'toStall'; } else k.state = 'wait'; k.tree = null; }
        break;
      case 'toStall': if (hopToward(S, k, ST.stall.home.x, ST.stall.home.y, dt)) { k.state = 'deliver'; k.t = 0; } break;
      case 'deliver':
        if (G.Stall.room(S)) { k.t += dt; if (k.t >= HD.kero.deliver) { G.Stall.deliver(S, 'kero'); k.hasYuzu = false; k.state = 'wait'; } }
        break;
      default: k.state = 'wait';
    }
  }
  Helpers.update = function (S, dt) { updatePon(S, dt); updateKero(S, dt); };
  Helpers.collect = function (S, list) {
    const p = S.helpers.pon, k = S.helpers.kero;
    if (p.hired && G.Camera.visibleY(p.y, 100)) { ponD.sortY = p.y; list.push(ponD); }
    if (k.hired && G.Camera.visibleY(k.y, 100)) { keroD.sortY = k.y; list.push(keroD); }
  };
  function drawPon(ctx, o, S) {
    const p = S.helpers.pon, Ch = G.Art.Ch, pose = Ch.resetPose(Ch.POSE);
    pose.x = p.x; pose.y = p.y; pose.face = p.face; pose.moving = p.moving; pose.walk = p.walk; pose.sx = p.sx; pose.sy = p.sy; pose.t = S.t;
    pose.carry = p.hasLog ? 'log' : null; if (p.state === 'rest' && p.yawn > 0) { pose.pose = 'yawn'; pose.poseT = 1 - p.yawn / DATA.HELPERS.pon.yawn; }
    Ch.pon(ctx, pose);
  }
  function drawKero(ctx, o, S) {
    const k = S.helpers.kero, Ch = G.Art.Ch, pose = Ch.resetPose(Ch.POSE);
    pose.x = k.x; pose.y = k.y; pose.z = k.z || 0; pose.face = k.face; pose.sx = k.sx; pose.sy = k.sy; pose.t = S.t; pose.carry = k.hasYuzu ? 'yuzu' : null;
    Ch.kero(ctx, pose);
  }
})(window.G);
