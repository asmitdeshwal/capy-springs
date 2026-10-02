// Capy Springs - camera: follow, look-ahead, clamp (never inverts), shake, zoom punch (ARCHITECTURE.md 4.3).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, MAP = G.DATA.MAP;
  const Camera = G.Camera = { x: 0, y: 1440, look: 0, shakeX: 0, shakeY: 0, shakeMag: 0, shakeT: 0, shakeDur: 0, shakeOn: true, z: 1, punchMag: 0, punchT: 0, punchDur: 0 };

  Camera.minY = S => (G.Summit ? G.Summit.minY(S) : G.Ridge ? G.Ridge.minY(S) : MAP.CAM_MIN_Y);   // the clamp moves up as each stage opens
  // the Ridge is a stage of its own: while Kit is up there the view never shows the Deck (the clamp's upper limit blends across the bridge)
  Camera.maxY = function (S) {
    const H = G.Canvas.H, R = MAP.RIDGE, full = MAP.H - H;
    if (!R || !S.built.ridge) return full;
    const t = U.clamp((S.kit.y - (R.y1 - 100)) / 150, 0, 1);                        // 0 on the Ridge, 1 once Kit is down past the bridge foot
    let m = U.lerp(R.y1 - H, full, t);
    const SU = MAP.SUMMIT; if (SU && S.built.summit) { const t2 = U.clamp((S.kit.y - (SU.y1 - 100)) / 150, 0, 1); m = U.lerp(SU.y1 - H, m, t2); }   // the same across the stairs
    return Math.max(Camera.minY(S), m);
  };
  function clampY(S, y) { const lo = Camera.minY(S); return U.clamp(y, lo, Math.max(lo, Camera.maxY(S))); }
  function target(S) { return S.kit.y - C.CAM_KIT_FRAC * G.Canvas.H + Camera.look; }

  Camera.init = function (S) { Camera.look = 0; Camera.y = clampY(S, target(S)); Camera.shakeX = Camera.shakeY = 0; Camera.shakeMag = 0; Camera.shakeT = 0; Camera.z = 1; Camera.punchT = 0; Camera.punchMag = 0; };
  // a stage reveal (the Ridge or the Summit opening): sweep up to the new stage, hold, come back to Kit; the sim waits (90_main.js), a tap skips
  Camera.script = null;
  Camera.reveal = function (S, yTop) { Camera.script = { t: 0, y0: Camera.y, y1: Math.max(Camera.minY(S), yTop), up: 1.7, hold: 1.5, down: 1.3 }; };
  Camera.update = function (S, dt) {
    const sc = Camera.script;
    if (sc) {
      sc.t += dt; const e = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
      if (sc.t < sc.up) Camera.y = U.lerp(sc.y0, sc.y1, e(sc.t / sc.up));
      else if (sc.t < sc.up + sc.hold) Camera.y = sc.y1;
      else if (sc.t < sc.up + sc.hold + sc.down) Camera.y = U.lerp(sc.y1, clampY(S, target(S)), e((sc.t - sc.up - sc.hold) / sc.down));
      else Camera.script = null;
      Camera.tickShake(dt); return;
    }
    const lookTarget = S.kit.moving ? U.sign(S.kit.vy) * C.CAM_LOOK : 0;
    Camera.look += (lookTarget - Camera.look) * (1 - Math.exp(-4 * dt));
    Camera.y += (target(S) - Camera.y) * (1 - Math.exp(-C.CAM_FOLLOW * dt));
    Camera.y = clampY(S, Camera.y);
    Camera.shakeOn = !S.settings || S.settings.shakeFlash !== false;
    Camera.tickShake(dt);
  };
  // shake and zoom-punch decay on their own (the ending drives Camera.y itself and still needs these)
  Camera.tickShake = function (dt) {
    if (Camera.shakeT > 0) {
      Camera.shakeT -= dt;
      const k = Camera.shakeMag * Math.max(0, Camera.shakeT / Camera.shakeDur);
      Camera.shakeX = Math.round(k * (Math.random() * 2 - 1));      // presentation: never the seeded RNG
      Camera.shakeY = Math.round(k * (Math.random() * 2 - 1));
      if (Camera.shakeT <= 0) { Camera.shakeX = Camera.shakeY = 0; Camera.shakeMag = 0; }
    }
    // zoom punch: snaps in, eases out over punchDur
    if (Camera.punchT > 0) { Camera.punchT -= dt; const u = Math.max(0, Camera.punchT / Camera.punchDur); Camera.z = 1 + Camera.punchMag * u * u; if (Camera.punchT <= 0) { Camera.z = 1; Camera.punchMag = 0; } }
  };
  Camera.shake = function (px, seconds) {
    if (!Camera.shakeOn) return;
    if (px >= Camera.shakeMag) { Camera.shakeMag = px; Camera.shakeT = seconds; Camera.shakeDur = seconds; }
  };
  Camera.bump = function (px) { Camera.shake(px, 0.15); };
  Camera.punch = function (mag, seconds) { if (!Camera.shakeOn || mag <= 0) return; if (mag >= Camera.punchMag) { Camera.punchMag = mag; Camera.punchT = seconds; Camera.punchDur = seconds; } };
  // world -> screen: scaled about the screen centre by z, then shaken; apply/unapply bracket the world pass with save/restore
  Camera.apply = function (ctx) {
    ctx.save();
    if (Camera.z !== 1) { const cx = 270, cy = G.Canvas.H / 2; ctx.translate(cx + Camera.shakeX, cy + Camera.shakeY); ctx.scale(Camera.z, Camera.z); ctx.translate(-cx, -cy - Camera.y); }
    else ctx.translate(Camera.shakeX, -Camera.y + Camera.shakeY);
  };
  Camera.unapply = function (ctx) { ctx.restore(); };
  Camera.toScreen = function (wx, wy, out) { const cx = 270, cy = G.Canvas.H / 2, z = Camera.z; out.x = (wx - cx) * z + cx + Camera.shakeX; out.y = (wy - Camera.y - cy) * z + cy + Camera.shakeY; return out; };
  Camera.toWorld = function (sx, sy, out) { const cx = 270, cy = G.Canvas.H / 2, z = Camera.z; out.x = (sx - Camera.shakeX - cx) / z + cx; out.y = (sy - Camera.shakeY - cy) / z + cy + Camera.y; return out; };
  Camera.visibleY = function (wy, margin) { const m = (margin || 0) + 60; return wy >= Camera.y - m && wy <= Camera.y + G.Canvas.H + m; };
})(window.G);
