// Capy Springs - guests, cable car levels, helpers (ARCHITECTURE.md 7.4, GDD 8.1 / 8.2 / 8.7).
(function (G) {
  'use strict';
  G.DATA = G.DATA || {};
  G.DATA.GUESTS = {
    // kinds are ROLES ('capy' = the main guest, 'duck' = the fast low-paying flock); art / voice pick the drawing and the sfx so a season can recast them
    capy: { pay: 6, walk: 110, patienceWait: 40, patienceTrail: 25, soakMult: 1,   gap: 28, w: 44, h: 32, bobHz: 1, art: 'capy', voice: null },
    duck: { pay: 3, walk: 150, patienceWait: 20, patienceTrail: 15, soakMult: 0.5, gap: 24, w: 28, h: 30, bobHz: 2, art: 'duck', voice: 'quack' },
    // Momo the snow-monkey VIP (GDD 19.4): rides the Ridge Lift during Lantern Night, pays 10x wherever he is served
    momo: { pay: 60, walk: 100, patienceWait: 60, patienceTrail: 40, soakMult: 1, gap: 30, w: 40, h: 40, bobHz: 1, art: 'momo', voice: null, vip: true },
    // the Summit's snow monkeys (GDD 20.2): twice a capy, quick, in troupes of six
    monkey: { pay: 12, walk: 140, patienceWait: 30, patienceTrail: 20, soakMult: 0.75, gap: 26, w: 36, h: 36, bobHz: 1.5, art: 'monkey', voice: 'chatter' }
  };
  // Kaa the crow keeps watch once Grandma's Shrine is lit: lands on a full tray near Kit; tap him for koban, ignore him and he takes a few
  G.DATA.KAA = { every: 60, nightEvery: 40, stay: 6, take: 5, share: 0.06, min: 15, max: 400, requires: 'shrine', r: 44, near: 650 };
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
