// Capy Springs - Season 2 data pack: THE MOCHI TERRACE (GDD 17.2). Applied by 04_seasons.js when it is the current season.
// Every table mirrors a Season 1 table (02_data_*.js) and keeps the engine's role ids: baths = service stations, boiler = the mortar,
// woodpile = the sack pile, grove = the persimmon tree, stall = the tea counter, pon / kero = the helpers, 'duck' = the fast flock (squirrels).
(function (G) {
  'use strict';
  G.PACKS = G.PACKS || {};
  const MAP = {
    W: 540, H: 2400, CAM_MIN_Y: 1100, STATIC_Y0: 1100,
    VALLEY: { y0: 2200, y1: 2400 },
    BOUNDS: { x0: 14, x1: 526, y0: 1150, y1: 2100 },
    LANE: { x0: 240, x1: 300, cx: 270, y0: 1150, y1: 2020, snap: 30 },
    PLATFORM: { x: 270, y: 2060, w: 320, h: 80, cap: 12, mill: { x0: 130, x1: 410, y0: 2030, y1: 2090 }, exit: { x: 270, y: 2030 } },
    BELL: { x: 135, y: 2005, ringR: 26 },
    CABLE: { y: 2120, pylons: [60, 480], pylonTop: 2060, dockX: 270, enterX: -80, exitX: 620, doorDY: 52, sortY: 2176 },   // the rack rail runs along the terrace's bottom edge
    KIT_START: { x: 270, y: 1990 },
    BRIDGE: { x: 270, y0: 1000, y1: 1150, w: 60, sign: { x: 330, y: 1130 } },                                               // the stone path into cloud (Summit)
    MIST: { y0: 1000, y1: 1150 },
    PINES: [[28,1230],[72,1180],[512,1220],[470,1178],[24,1560],[24,1750],[24,1990],[516,1500],[516,1760],[516,1990],[516,2110],[24,2110],[200,1240],[340,1240]],   // maples
    ROCKS: [[200,2196],[340,2196],[480,1555],[60,1540]],
    STONE_LANTERNS: [[210,1300],[330,1300],[210,1580],[330,1580],[210,1980],[330,1980]]                                     // paper lanterns on poles
  };
  const BATHS = [
    { id: 'bench',  name: 'Tea Bench',     heated: false, slots: 3, maxSlots: 6, soak: 8, lantern: null,     prebuilt: true, payMult: 1,    look: 'bench',
      water: { x: 120, y: 1860, w: 150, h: 80 }, deck: { x: 120, y: 1860, w: 220, h: 150 }, exit: { x: 236, y: 1900 }, tray: { x: 212, y: 1922 }, lane: 250 },
    { id: 'table',  name: 'Mochi Table',   heated: true,  slots: 5, maxSlots: 8, soak: 8, lantern: 'table',  payMult: 1.75, look: 'table',
      water: { x: 420, y: 1640, w: 150, h: 90 }, deck: { x: 420, y: 1640, w: 210, h: 150 }, exit: { x: 309, y: 1680 }, tray: { x: 328, y: 1700 }, lane: 290 },
    { id: 'hearth', name: 'Zenzai Hearth', heated: true,  slots: 6, maxSlots: 8, soak: 8, lantern: 'hearth', payMult: 2.5,  look: 'hearth',
      water: { x: 420, y: 1360, w: 150, h: 90 }, deck: { x: 420, y: 1360, w: 210, h: 150 }, exit: { x: 309, y: 1400 }, tray: { x: 328, y: 1420 }, lane: 290 }
  ];
  const STATIONS = {
    boiler:   { x: 180, y: 1650, w: 50, h: 50, solid: { w: 44, h: 20 }, zone: 30,  home: { x: 180, y: 1672 } },     // the mortar: a small zone so a lap around it never pounds early
    woodpile: { x: 85,  y: 1650, w: 70, h: 40, solid: null,             zone: 40,  home: { x: 85,  y: 1682 } },     // the sack pile (home inside the pickup zone)
    grove:    { slots: [[90,1430],[170,1430],[130,1360],[90,1300],[170,1300]], zone: 44, trunk: { w: 10, h: 8 }, home: { x: 130, y: 1470 } },
    stall:    { x: 430, y: 1850, w: 120, h: 36, solid: { w: 120, h: 36 }, zone: { x: 430, y: 1880, r: 60 }, home: { x: 430, y: 1885 },
                queue: [[370,1905],[410,1905],[450,1905],[490,1905]], tray: { x: 430, y: 1892 } },
    platform: { x: 270, y: 2060, w: 320, h: 80 }
  };
  const UPGRADES = {
    bench:  { speed: { label: 'Service', base: 30,  max: 6 }, slots: { label: 'Cushions', base: 45,  max: 3 }, pay: { label: 'Tips',  base: 40,  max: 6 } },
    table:  { speed: { label: 'Service', base: 60,  max: 6 }, slots: { label: 'Cushions', base: 90,  max: 3 }, pay: { label: 'Tips',  base: 75,  max: 6 } },
    hearth: { speed: { label: 'Service', base: 120, max: 6 }, slots: { label: 'Cushions', base: 160, max: 2 }, pay: { label: 'Tips',  base: 140, max: 6 } },
    boiler: { speed: { label: 'Mallet',  base: 70,  max: 6 }, slots: { label: 'Bowl',     base: 140, max: 5 }, pay: { label: 'Pon',   base: 110, max: 5, requires: 'pon' } },
    grove:  { speed: { label: 'Ripen',   base: 60,  max: 6 }, slots: { label: 'Branches', base: 100, max: 2 }, pay: { label: 'Juicy', base: 90,  max: 6 } },
    stall:  { speed: { label: 'Brew',    base: 100, max: 6 }, slots: { label: 'Teapot',   base: 130, max: 3 }, pay: { label: 'Price', base: 110, max: 6 } }
  };
  // offering steps (stand points); costs end ~4x the Deck's ladder because the Terrace pays about twice as much per guest
  const LANTERNS = [
    { id: 'mortar', label: 'Rice Mortar',    x: 175, y: 1745, costs: [40],                               requires: [],                                      effect: 'build:boiler,woodpile' },
    { id: 'table',  label: 'Mochi Table',    x: 420, y: 1745, costs: [150],                              requires: ['mortar'],                              effect: 'build:table' },
    { id: 'trail',  label: 'Longer Line',    x: 50,  y: 1990, costs: [300, 1000, 2600],                  requires: ['table'],                               effect: 'trailCap:5,8,12' },
    { id: 'car',    label: 'Timetable',      x: 490, y: 2000, costs: [240, 700, 2000],                   requires: ['table'],                               effect: 'carLevel:1,2,3' },
    { id: 'pon',    label: "Pon's Apron",    x: 60,  y: 1740, costs: [450],                              requires: ['mortar'],                              effect: 'hire:pon' },
    { id: 'grove',  label: 'Persimmon Tree', x: 130, y: 1500, costs: [700],                              requires: ['table'],                               effect: 'build:grove' },
    { id: 'hearth', label: 'Zenzai Hearth',  x: 420, y: 1465, costs: [1100],                             requires: ['grove'],                               effect: 'build:hearth' },
    { id: 'stall',  label: 'Tea Counter',    x: 430, y: 1960, costs: [1400],                             requires: ['grove', 'pon'],                        effect: 'build:stall' },
    { id: 'kero',   label: 'Hire Kero',      x: 350, y: 1960, costs: [600],                              requires: ['stall'],                               effect: 'hire:kero' },
    { id: 'summit', label: 'Summit Lantern', x: 270, y: 1180, costs: [4000, 5000, 6000, 7000, 8000],     requires: ['hearth', 'stall', 'trail:2', 'car:2'], effect: 'famous:1.25,1.30,1.35,1.40,1.45' }
  ];
  const GUESTS = {
    capy: { pay: 8,  walk: 110, patienceWait: 40, patienceTrail: 25, soakMult: 1,   gap: 28, w: 44, h: 32, bobHz: 1, art: 'capy',     voice: null,    scarf: '#D93A3A' },
    duck: { pay: 5,  walk: 170, patienceWait: 20, patienceTrail: 15, soakMult: 0.5, gap: 24, w: 30, h: 30, bobHz: 2, art: 'squirrel', voice: 'chirp' },               // the Chestnut Run
    momo: { pay: 48, walk: 100, patienceWait: 60, patienceTrail: 40, soakMult: 1,   gap: 30, w: 40, h: 40, bobHz: 1, art: 'momo',     voice: null,    vip: true }      // the VIP (6x a hearth guest)
  };
  const CAR = { levels: [ { capys: 3, spread: 0, ducks: 0,  period: 22 },
                          { capys: 5, spread: 1, ducks: 8,  period: 21 },
                          { capys: 7, spread: 1, ducks: 10, period: 20 },
                          { capys: 9, spread: 1, ducks: 12, period: 18 } ] };
  const HELPERS = {
    pon:  { speed: 70, rest: 3, cap: 70, home: { x: 135, y: 1700 }, take: 0.4, stoke: 0.3, yawn: 3 },
    kero: { hopT: 0.5, hopLen: 60, hopH: 26, home: { x: 200, y: 1490 }, pick: 0.3, deliver: 0.3 }
  };
  G.PACKS[2] = {
    key: 's2', name: 'The Mochi Terrace', subtitle: 'An autumn teahouse on the ridge', teaser: 'Pound rice into mochi, seat the guests, catch the Maple Express.',
    finale: 'summit',
    data: {
      MAP, BATHS, STATIONS, UPGRADES, LANTERNS, GUESTS, CAR, HELPERS,
      SHEET_STATIONS: ['bench', 'table', 'hearth', 'boiler', 'grove', 'stall'],
      VIP: { kind: 'momo', requires: 'hearth' },                                                                   // rides the Maple Express that docks during Harvest Moon
      LAP: { stones: [[180, 1582], [240, 1688], [120, 1688]], r: 38, window: 4, bonus: 10 },                       // Pounding Lap: 12 -> 4 -> 8 o'clock around the mortar
      KAA: { every: 90, nightEvery: 45, stay: 6, take: 5, share: 0.06, min: 15, max: 250, requires: 'table', r: 44 }
    },
    pal: { cedar: '#C8A15A', cedarDark: '#8B6B2E', plank: '#B88D45', happi: '#D9B36A', skyNight: '#4A2B5B', waterYuzu: '#F28C28', ripple: '#F6E7C8' },
    config: { TREES_BASE: 3, HEAT_START: 70, STOKE_HINT_BELOW: 60, STOKE_STOP: 0.1 },     // the arrow asks for sacks early so laps and Fresh Batches are the rhythm; pounding means standing at the mortar
    text: {
      rush: 'FRESH BATCH', night: 'HARVEST MOON', golden: 'MAPLE EXPRESS!', fullcar: 'FULL CARRIAGE!', famous: 'FAMOUS TEAHOUSE!', fame: 'SUMMIT FAME',
      splash3: 'FEAST x3!', yuzuPop: 'PERSIMMON TOP!', vehicle: 'train', ponTidied: 'Pon wiped the tables: ', resetTitle: 'Start a new teahouse?',
      gaugeIcon: 'bowl', gaugeUnit: 'stock', coldIcon: 'question', coldBubble: 'question', sfxStoke: 'thump', sfxYuzu: 'yuzu', sign: 'SUMMIT'
    },
    words: { SOAK: 'SEAT', STOKE: 'POUND', YUZU: 'TOP' }
  };
})(window.G);
