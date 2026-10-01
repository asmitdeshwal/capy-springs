// Capy Springs - the Ridge: the area above the bridge that opens with Ridge Bridge level 1 (GDD 19, ARCHITECTURE.md 22).
// Nothing resets: the camera clamp, Kit's bounds, the lane and the mist simply move up, and two new stations reveal their offering steps.
(function (G) {
  'use strict';
  const DATA = G.DATA, MAP = DATA.MAP;
  const Ridge = G.Ridge = {};
  const evNone = {};

  Ridge.has = () => !!MAP.RIDGE;
  Ridge.isOpen = S => !!(MAP.RIDGE && S.built.ridge);
  Ridge.open = function (S, opts) {
    if (!MAP.RIDGE || S.built.ridge) return;
    S.built.ridge = true;
    if (G.Render.markStaticDirty) G.Render.markStaticDirty();
    G.Player.markSolidsDirty();
    if (!(opts && opts.silent)) G.Bus.emit('ridge:open', evNone);
  };
  Ridge.minY = S => Ridge.isOpen(S) ? MAP.RIDGE.camMinY : MAP.CAM_MIN_Y;          // camera clamp
  Ridge.boundsY0 = S => Ridge.isOpen(S) ? MAP.RIDGE.boundsY0 : MAP.BOUNDS.y0;     // Kit's walkable top
  Ridge.exitFor = (S, g) => (Ridge.isOpen(S) && g.y < MAP.RIDGE.y1) ? MAP.RIDGE.exit : MAP.PLATFORM.exit;   // where a leaving guest walks off
})(window.G);
