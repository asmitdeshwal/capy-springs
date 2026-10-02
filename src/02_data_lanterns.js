// Capy Springs - lanterns / offering steps (ARCHITECTURE.md 7.3, GDD 8.5). x, y = the STEP (stand point); the post stands at (x, y - C.POST_BACK).
// requires: 'id' = that lantern at level >= 1; 'id:2' = level >= 2. effect strings are parsed by G.Lanterns.applyEffect.
(function (G) {
  'use strict';
  G.DATA = G.DATA || {};
  // label / blurb are what the step shows when Kit is near (the name, and one line of what the koban buy); labels[] / blurbs[] vary per level
  // Wake the Source: level 1 is the finale; every level after it is a Source Star that turns the season (costs grow x1.35 a step)
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  const WAKE = { costs: [40000], labels: ['Wake the Source'], blurbs: ['Every lantern is lit. Light this one.'] };
  for (let i = 1; i < 20; i++) {
    WAKE.costs.push(Math.round(60000 * Math.pow(1.35, i - 1) / 1000) * 1000); WAKE.labels.push('Source Star ' + ROMAN[i + 1]);
    WAKE.blurbs.push('Turns the season to ' + SEASONS[i % 4] + (i <= 10 ? '; +10% pay on everything' : ''));
  }
  G.DATA.LANTERNS = [
    { id: 'cedar',  label: 'Cedar Bath',   x: 420, y: 1965, costs: [20],                              requires: [],                             effect: 'build:cedar,boiler,woodpile', blurb: 'A hot bath, with a boiler to keep it hot' },
    { id: 'trail',  label: 'Longer Line',  x: 50,  y: 1990, costs: [35, 200, 700],                    requires: ['cedar'],                      effect: 'trailCap:5,8,12', blurbs: ['Lead 5 guests at once', 'Lead 8 guests at once', 'Lead 12 guests at once'] },
    { id: 'grove',  label: 'Yuzu Grove',   x: 120, y: 1745, costs: [60],                              requires: ['cedar'],                      effect: 'build:grove', blurb: 'Yuzu: drop one in a bath for x2 pay' },
    { id: 'car',    label: 'Bigger Car',   x: 490, y: 2000, costs: [70, 250, 600],                    requires: ['trail'],                      effect: 'carLevel:1,2,3', blurbs: ['5 guests per car, ducks too', '7 guests per car', '9 guests per car'] },
    { id: 'pon',    label: 'Hire Pon',     x: 405, y: 1735, costs: [80],                              requires: ['cedar'],                      effect: 'hire:pon', blurb: 'Pon stokes the boiler for you' },
    { id: 'stall',  label: 'Snack Stall',  x: 430, y: 1585, costs: [120],                             requires: ['grove'],                      effect: 'build:stall', blurb: 'Mochi for hungry guests: more koban' },
    { id: 'kero',   label: 'Hire Kero',    x: 350, y: 1450, costs: [150],                             requires: ['stall'],                      effect: 'hire:kero', blurb: 'Kero picks yuzu for the stall' },
    { id: 'bamboo', label: 'Bamboo Tub',   x: 235, y: 1530, costs: [180],                             requires: ['car'],                        effect: 'build:bamboo', blurb: 'A third bath with 5 seats' },
    { id: 'bridge', label: 'Ridge Bridge', x: 270, y: 1180, costs: [1500, 2000, 2500, 3000, 4000],    requires: ['bamboo', 'trail:2', 'car:2'], effect: 'famous:1.25,1.30,1.35,1.40,1.45',
      labels: ['Ridge Bridge', 'Inn Fame II', 'Inn Fame III', 'Inn Fame IV', 'Inn Fame V'],
      blurbs: ['Opens the Ridge above, and +25% pay', '+5% pay on everything', '+5% pay on everything', '+5% pay on everything', '+5% pay on everything'] },
    // the Ridge (GDD 19)
    { id: 'sauna',  label: 'Sauna Hut',    x: 480, y: 905,  costs: [1500],                            requires: ['bridge'],                     effect: 'build:sauna', blurb: 'Guests come out hot, wanting a plunge' },
    { id: 'plunge', label: 'Cold Plunge',  x: 50,  y: 905,  costs: [1200],                            requires: ['sauna'],                      effect: 'build:plunge', blurb: 'Sauna guests in time = HOT-COLD x2' },
    { id: 'pavilion', label: 'Massage Pavilion', x: 300, y: 600, costs: [2500],                       requires: ['plunge'],                     effect: 'build:pavilion', blurb: 'Tsuru massages at x5, by the gong' },
    // the Summit (GDD 20): the stairs open the third stage; Wake the Source is the story's ending (level 1) and then endless Source Stars
    { id: 'stairs',  label: 'Pilgrim Stairs',   x: 340, y: 30,    costs: [6000],                         requires: ['pavilion'],                   effect: 'open:summit', blurb: 'Opens the Summit above the clouds' },
    { id: 'source',  label: 'The Source',       x: 480, y: -790,  costs: [10000],                        requires: ['stairs'],                     effect: 'build:source', blurb: 'The spring itself: x3 pay, and snow monkeys come' },
    { id: 'shrine',  label: "Grandma's Shrine", x: 205, y: -796,  costs: [9000],                         requires: ['source'],                     effect: 'build:shrine', blurb: 'Kaa keeps watch: tap him on a tray for koban' },
    { id: 'snowroll', label: 'Snow Roll',       x: 50,  y: -470,  costs: [15000],                        requires: ['source'],                     effect: 'build:snowroll', blurb: 'Hot monkeys want the snow: HOT-COLD x2 again' },
    { id: 'wake',    label: 'Wake the Source',  x: 330, y: -1080, costs: WAKE.costs,                     requires: ['snowroll', 'shrine', 'bridge:5', 'trail:3', 'car:3'], effect: 'wake', endless: true,
      labels: WAKE.labels, blurbs: WAKE.blurbs }
    // the Season Pass to the (hidden) Mochi Terrace, kept for reference: { id: 'travel', label: 'Season Pass', x: 420, y: 1200, costs: [5000], requires: ['bridge'], effect: 'travel:2' }
  ];
})(window.G);
