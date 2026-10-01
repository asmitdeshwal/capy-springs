// Capy Springs - yuzu grove: regrowing trees, capped pick (ARCHITECTURE.md 9.7, GDD 5.4).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, ST = DATA.STATIONS;
  const Grove = G.Grove = {};
  const TREES = [], DRAW = [];
  const evPick = { tree: null, by: null };

  Grove.init = function (S) {
    DRAW.length = 0;
    for (let i = 0; i < S.grove.trees.length; i++) DRAW.push({ i, sortY: S.grove.trees[i].y, draw: drawTree });
  };
  Grove.trees = function (S) { TREES.length = 0; const n = Math.min(G.Upgrades.treeCount(S), S.grove.trees.length); for (let i = 0; i < n; i++) TREES.push(S.grove.trees[i]); return TREES; };
  Grove.ripeCount = function (S) { if (!S.built.grove) return 0; const t = Grove.trees(S); let n = 0; for (let i = 0; i < t.length; i++) if (t[i].ripe) n++; return n; };
  Grove.nearestRipe = function (S, x, y) {
    if (!S.built.grove) return null;
    const t = Grove.trees(S); let best = null, bd = Infinity;
    for (let i = 0; i < t.length; i++) { if (!t[i].ripe) continue; const d = U.dist2(t[i].x, t[i].y, x, y); if (d < bd) { bd = d; best = t[i]; } }
    return best;
  };
  Grove.canPick = function (S) { return G.Trail.count(S, 'yuzu') < G.Baths.notGoldenCount(S) + (S.built.stall && G.Stall.room(S) ? 1 : 0); };
  Grove.pick = function (S, tree, by) {
    if (!tree || !tree.ripe) return false;
    if (by === 'kit') { if (!G.Trail.join(S, 'yuzu', null, tree.x, tree.y - 40)) return false; }
    tree.ripe = false; tree.progress = 0; tree.pulse = 0;
    evPick.tree = tree; evPick.by = by; G.Bus.emit('yuzu:pick', evPick);
    return true;
  };
  Grove.update = function (S, dt) {
    if (!S.built.grove) return;
    const trees = Grove.trees(S), kit = S.kit, regrow = G.Upgrades.regrow(S), zone = ST.grove.zone;
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      if (!t.ripe) { t.progress += dt / regrow; if (t.progress >= 1) { t.progress = 1; t.ripe = true; } }
      else {
        t.pulse += dt;
        if (!G.Trail.full(S) && Grove.canPick(S) && U.dist2(kit.x, kit.y, t.x, t.y) <= zone * zone) Grove.pick(S, t, 'kit');
      }
    }
  };
  Grove.collect = function (S, list) {
    if (!S.built.grove) return;
    const n = Math.min(G.Upgrades.treeCount(S), DRAW.length);
    for (let i = 0; i < n; i++) if (G.Camera.visibleY(S.grove.trees[i].y, 120)) list.push(DRAW[i]);
  };
  function drawTree(ctx, o, S) { const t = S.grove.trees[o.i]; G.Art.W.treeFruit(ctx, t.x, t.y, t.progress, t.ripe, S.t); }
})(window.G);
