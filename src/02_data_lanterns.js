// Capy Springs - lanterns / offering steps (ARCHITECTURE.md 7.3, GDD 8.5). x, y = the STEP (stand point); the post stands at (x, y - C.POST_BACK).
// requires: 'id' = that lantern at level >= 1; 'id:2' = level >= 2. effect strings are parsed by G.Lanterns.applyEffect.
(function (G) {
  'use strict';
  G.DATA = G.DATA || {};
  G.DATA.LANTERNS = [
    { id: 'cedar',  label: 'Cedar Bath',   x: 420, y: 1965, costs: [20],                              requires: [],                             effect: 'build:cedar,boiler,woodpile' },
    { id: 'trail',  label: 'Trail Rope',   x: 50,  y: 1990, costs: [35, 200, 700],                    requires: ['cedar'],                      effect: 'trailCap:5,8,12' },
    { id: 'grove',  label: 'Yuzu Grove',   x: 120, y: 1745, costs: [60],                              requires: ['cedar'],                      effect: 'build:grove' },
    { id: 'car',    label: 'Cable Car',    x: 490, y: 2000, costs: [70, 250, 600],                    requires: ['trail'],                      effect: 'carLevel:1,2,3' },
    { id: 'pon',    label: 'Hire Pon',     x: 405, y: 1735, costs: [80],                              requires: ['cedar'],                      effect: 'hire:pon' },
    { id: 'stall',  label: 'Snack Stall',  x: 430, y: 1585, costs: [120],                             requires: ['grove'],                      effect: 'build:stall' },
    { id: 'kero',   label: 'Hire Kero',    x: 350, y: 1450, costs: [150],                             requires: ['stall'],                      effect: 'hire:kero' },
    { id: 'bamboo', label: 'Bamboo Tub',   x: 235, y: 1530, costs: [180],                             requires: ['car'],                        effect: 'build:bamboo' },
    { id: 'bridge', label: 'Ridge Bridge', x: 270, y: 1180, costs: [1500, 2000, 2500, 3000, 4000],    requires: ['bamboo', 'trail:2', 'car:2'], effect: 'famous:1.25,1.30,1.35,1.40,1.45' }
    // the Season Pass to the (hidden) Mochi Terrace, kept for reference: { id: 'travel', label: 'Season Pass', x: 420, y: 1200, costs: [5000], requires: ['bridge'], effect: 'travel:2' }
  ];
})(window.G);
