// Capy Springs - baths, stations, upgrade tracks (ARCHITECTURE.md 7.2, GDD 8.3 / 8.4).
(function (G) {
  'use strict';
  G.DATA = G.DATA || {};
  G.DATA.BATHS = [
    { id: 'rock',   name: 'Rock Pool',  heated: false, slots: 3, maxSlots: 6, soak: 8, lantern: null, prebuilt: true,
      water: { x: 120, y: 1860, w: 160, h: 95 }, deck: { x: 120, y: 1860, w: 220, h: 155 },
      exit: { x: 236, y: 1900 }, tray: { x: 212, y: 1922 }, lane: 250 },
    { id: 'cedar',  name: 'Cedar Bath', heated: true,  slots: 4, maxSlots: 7, soak: 8, lantern: 'cedar',
      water: { x: 420, y: 1860, w: 150, h: 90 }, deck: { x: 420, y: 1860, w: 210, h: 150 },
      exit: { x: 309, y: 1900 }, tray: { x: 328, y: 1920 }, lane: 290 },
    { id: 'bamboo', name: 'Bamboo Tub', heated: true,  slots: 5, maxSlots: 8, soak: 7, lantern: 'bamboo', stripes: true,
      water: { x: 120, y: 1430, w: 150, h: 90 }, deck: { x: 120, y: 1430, w: 210, h: 150 },
      exit: { x: 236, y: 1470 }, tray: { x: 212, y: 1492 }, lane: 250 }
  ];
  // drop zone = deck rect; Kit collides with the water rect; koban land in the tray (lane-side deck strip); guests reappear at exit when climbing out.
  G.DATA.STATIONS = {
    boiler:   { x: 450, y: 1660, w: 60, h: 70, solid: { w: 60, h: 24 }, zone: 44,  home: { x: 450, y: 1700 } },
    woodpile: { x: 360, y: 1670, w: 70, h: 40, solid: null,             zone: 40,  home: { x: 360, y: 1700 } },
    grove:    { slots: [[80,1690],[160,1690],[120,1630],[80,1570],[160,1570]], zone: 44, trunk: { w: 10, h: 8 }, home: { x: 120, y: 1720 } },
    stall:    { x: 430, y: 1470, w: 120, h: 36, solid: { w: 120, h: 36 }, zone: { x: 430, y: 1500, r: 60 }, home: { x: 430, y: 1505 },
                queue: [[370,1525],[410,1525],[450,1525],[490,1525]], tray: { x: 430, y: 1512 } },
    platform: { x: 270, y: 2060, w: 320, h: 80 }
  };
  // Sheet-capable stations (a tap opens the upgrade sheet)
  G.DATA.SHEET_STATIONS = ['rock', 'cedar', 'bamboo', 'boiler', 'grove', 'stall'];
  // cost(level) = round5(base * 1.6 ** level), level = current level (0-based). title / blurb = what the upgrade sheet says in plain words (GDD 10.4)
  const BATH_TRACKS = {
    speed: { title: 'Quicker soaks', blurb: 'Guests finish sooner, so more fit in between cars' },
    slots: { title: 'More seats',    blurb: 'Seat bigger groups for bigger Splash chains' },
    pay:   { title: 'Better tips',   blurb: 'Every guest who soaks here pays more' }
  };
  G.DATA.UPGRADES = {
    rock:   { speed: { label: 'Soak',   base: 30,  max: 6, ...BATH_TRACKS.speed }, slots: { label: 'Seats',   base: 45,  max: 3, ...BATH_TRACKS.slots }, pay: { label: 'Tips',  base: 40,  max: 6, ...BATH_TRACKS.pay } },
    cedar:  { speed: { label: 'Soak',   base: 40,  max: 6, ...BATH_TRACKS.speed }, slots: { label: 'Seats',   base: 60,  max: 3, ...BATH_TRACKS.slots }, pay: { label: 'Tips',  base: 50,  max: 6, ...BATH_TRACKS.pay } },
    bamboo: { speed: { label: 'Soak',   base: 90,  max: 6, ...BATH_TRACKS.speed }, slots: { label: 'Seats',   base: 120, max: 3, ...BATH_TRACKS.slots }, pay: { label: 'Tips',  base: 100, max: 6, ...BATH_TRACKS.pay } },
    boiler: { speed: { label: 'Stoke',  base: 60,  max: 6, title: 'Hotter logs',   blurb: 'Each log you throw in adds more heat' },
              slots: { label: 'Tank',    base: 120, max: 5, title: 'Bigger tank',   blurb: 'Heat can climb higher: longer Steam Rushes' },
              pay:   { label: 'Pon',     base: 90,  max: 5, title: 'Quicker Pon',   blurb: 'Pon walks and stokes faster', requires: 'pon' } },
    grove:  { speed: { label: 'Regrow', base: 50,  max: 6, title: 'Faster regrow', blurb: 'Yuzu ripen sooner after you pick them' },
              slots: { label: 'Trees',   base: 80,  max: 3, title: 'Another tree',  blurb: 'One more yuzu tree in the grove' },
              pay:   { label: 'Ripe',    base: 70,  max: 6, title: 'Longer gold',   blurb: 'A yuzu bath stays golden (x2 pay) for longer' } },
    stall:  { speed: { label: 'Prep',   base: 80,  max: 6, title: 'Faster prep',   blurb: 'Mochi are ready for the queue sooner' },
              slots: { label: 'Counter', base: 100, max: 3, title: 'Bigger counter', blurb: 'More mochi kept ready at once' },
              pay:   { label: 'Price',   base: 90,  max: 6, title: 'Pricier mochi', blurb: 'Each mochi sells for more' } }
  };
})(window.G);
