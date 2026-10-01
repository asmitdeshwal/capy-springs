// Capy Springs - guests, cable car levels, helpers (ARCHITECTURE.md 7.4, GDD 8.1 / 8.2 / 8.7).
(function (G) {
  'use strict';
  G.DATA = G.DATA || {};
  G.DATA.GUESTS = {
    // kinds are ROLES ('capy' = the main guest, 'duck' = the fast low-paying flock); art / voice pick the drawing and the sfx so a season can recast them
    capy: { pay: 6, walk: 110, patienceWait: 40, patienceTrail: 25, soakMult: 1,   gap: 28, w: 44, h: 32, bobHz: 1, art: 'capy', voice: null },
    duck: { pay: 3, walk: 150, patienceWait: 20, patienceTrail: 15, soakMult: 0.5, gap: 24, w: 28, h: 30, bobHz: 2, art: 'duck', voice: 'quack' }
  };
  G.DATA.CAR = {      // level index = S.car.level; period is DOCK-TO-DOCK seconds
    levels: [ { capys: 3, spread: 0, ducks: 0,  period: 18 },
              { capys: 5, spread: 1, ducks: 8,  period: 21 },
              { capys: 7, spread: 1, ducks: 10, period: 24 },
              { capys: 9, spread: 1, ducks: 12, period: 25 } ]
  };
  G.DATA.HELPERS = {
    pon:  { speed: 70, rest: 3, cap: 70, home: { x: 405, y: 1700 }, take: 0.4, stoke: 0.3, yawn: 3 },
    kero: { hopT: 0.5, hopLen: 60, hopH: 26, home: { x: 200, y: 1650 }, pick: 0.3, deliver: 0.3 }
  };
})(window.G);
