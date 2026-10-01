// Capy Springs - camera: follow, look-ahead, clamp (never inverts), shake (ARCHITECTURE.md 4.3).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, MAP = G.DATA.MAP;
  const Camera = G.Camera = { x: 0, y: 1440, look: 0, shakeX: 0, shakeY: 0, shakeMag: 0, shakeT: 0, shakeDur: 0, shakeOn: true };

  function clampY(y) { const H = G.Canvas.H; return U.clamp(y, MAP.CAM_MIN_Y, Math.max(MAP.CAM_MIN_Y, MAP.H - H)); }
  function target(S) { return S.kit.y - C.CAM_KIT_FRAC * G.Canvas.H + Camera.look; }

  Camera.init = function (S) { Camera.look = 0; Camera.y = clampY(target(S)); Camera.shakeX = Camera.shakeY = 0; Camera.shakeMag = 0; Camera.shakeT = 0; };
  Camera.update = function (S, dt) {
    const lookTarget = S.kit.moving ? U.sign(S.kit.vy) * C.CAM_LOOK : 0;
    Camera.look += (lookTarget - Camera.look) * (1 - Math.exp(-4 * dt));
    Camera.y += (target(S) - Camera.y) * (1 - Math.exp(-C.CAM_FOLLOW * dt));
    Camera.y = clampY(Camera.y);
    Camera.shakeOn = !S.settings || S.settings.shakeFlash !== false;
    if (Camera.shakeT > 0) {
      Camera.shakeT -= dt;
      const k = Camera.shakeMag * Math.max(0, Camera.shakeT / Camera.shakeDur);
      Camera.shakeX = Math.round(k * (Math.random() * 2 - 1));      // presentation: never the seeded RNG
      Camera.shakeY = Math.round(k * (Math.random() * 2 - 1));
      if (Camera.shakeT <= 0) { Camera.shakeX = Camera.shakeY = 0; Camera.shakeMag = 0; }
    }
  };
  Camera.shake = function (px, seconds) {
    if (!Camera.shakeOn) return;
    if (px >= Camera.shakeMag) { Camera.shakeMag = px; Camera.shakeT = seconds; Camera.shakeDur = seconds; }
  };
  Camera.bump = function (px) { Camera.shake(px, 0.15); };
  Camera.apply = function (ctx) { ctx.translate(Camera.shakeX, -Camera.y + Camera.shakeY); };
  Camera.unapply = function (ctx) { ctx.translate(-Camera.shakeX, Camera.y - Camera.shakeY); };
  Camera.toScreen = function (wx, wy, out) { out.x = wx + Camera.shakeX; out.y = wy - Camera.y + Camera.shakeY; return out; };
  Camera.toWorld = function (sx, sy, out) { out.x = sx - Camera.shakeX; out.y = sy + Camera.y - Camera.shakeY; return out; };
  Camera.visibleY = function (wy, margin) { const m = margin || 0; return wy >= Camera.y - m && wy <= Camera.y + G.Canvas.H + m; };
})(window.G);
