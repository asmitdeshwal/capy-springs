// Capy Springs - map data (ARCHITECTURE.md 7.1, GDD 2.2). World 540 x 2400; MVP uses y 1100..2400.
(function (G) {
  'use strict';
  G.DATA = G.DATA || {};
  G.DATA.MAP = {
    W: 540, H: 2400, CAM_MIN_Y: 1100, STATIC_Y0: -1340,     // the static cache covers the Ridge and the Summit too; the camera clamp moves up as each stage opens
    // THE RIDGE (GDD 19): a full stage above the bridge (1220 px, a whole phone screen). Opens with Ridge Bridge level 1; Kit's bounds, the camera
    // clamp, the lane and the mist move up, and while Kit is up there the camera never shows the Deck.
    RIDGE: { y0: -120, y1: 1100, camMinY: -120, boundsY0: -60, laneY0: -60, mist: { y0: -200, y1: -40 },
             chasm: [[0, 1000, 238, 1150], [302, 1000, 540, 1150]],                  // solid drops either side of the bridge
             mill: { x0: 320, x1: 430, y0: 895, y1: 960 }, exit: { x: 270, y: -40 },  // where sauna guests wait for their plunge; where Ridge guests leave
             pines: [[40, 620], [30, 760], [510, 760], [150, 600], [40, 960], [500, 960], [200, 690], [60, 120], [480, 100], [150, -20], [400, -10], [500, 320], [30, 340], [340, 190], [180, 400], [470, 470]],
             rocks: [[90, 700], [220, 620], [160, 990], [500, 990], [120, 260], [430, 230], [200, 40], [60, 520]],
             pond: { x: 300, y: 330, w: 190, h: 100 } },                                // a frozen pond, decor only
    // THE SUMMIT (GDD 20): the third stage, above the clouds (1220 px, a whole screen). Opens with the Pilgrim Stairs at the top of the Ridge; the cliff
    // either side of the stairs is solid, the stairs are the only way up. The Source pool and its geyser on the right, Grandma Yuzu's hut on the left,
    // the snow monkeys' ledge under the cliff at the top, the Snow Roll below.
    SUMMIT: { y0: -1340, y1: -120, camMinY: -1340, boundsY0: -1230, mist: { y0: -1420, y1: -1262 }, exit: { x: 270, y: -1250 },
              chasm: [[0, -262, 238, -112], [302, -262, 540, -112]], stairs: { x: 270, y0: -262, y1: -112, w: 60 }, torii: { x: 270, y: -268 },
              mill: { x0: 330, x1: 430, y0: -796, y1: -762 },                                   // Source guests wait here for the Snow Roll
              hut: { x: 120, y: -900, w: 124, h: 92, solid: { x0: 62, y0: -930, x1: 178, y1: -862 }, door: { x: 150, y: -858 }, perch: { x: 104, y: -992 }, seat: { x: 296, y: -930 } },
              waterfall: { x: 470, y: -600, w: 70, h: 150 }, vents: [[95, -1100], [215, -1118]],
              pines: [[40, -380], [500, -380], [160, -330], [420, -330], [30, -720], [515, -742], [55, -1060], [500, -1262], [40, -1270]],
              rocks: [[470, -470], [400, -420], [140, -425], [175, -1010], [527, -1100], [60, -1135], [392, -1252]],
              stoneLanterns: [[215, -700], [325, -700]] },
    // the snow-monkey troupe (GDD 20.2): no cabin, they hop down the cliff onto their ledge every `period` s once the Source is built
    TROUPE: { platform: { x: 270, y: -1176, w: 300, h: 56, cap: 10, mill: { x0: 140, x1: 400, y0: -1196, y1: -1160 } }, from: { x: 270, y: -1300 },
              whistle: { x: 468, y: -1160 }, period: 20, periodNight: 12, guests: 6, goldenEvery: 5, warn: 3, hopGap: 0.3 },
    // the Ridge Lift (GDD 19.4): a gondola across the gorge that brings guests to a platform on the Ridge once it is open
    LIFT: { y: 1020, pylons: [40, 500], pylonTop: 985, dockX: 130, enterX: -80, exitX: 620, doorDY: 44, sortY: 1080,
            platform: { x: 130, y: 962, w: 180, h: 46, cap: 8, mill: { x0: 55, x1: 205, y0: 945, y1: 980 }, exit: { x: 130, y: 940 } },
            bell: { x: 228, y: 950 }, period: 28, periodNight: 14, guests: 4, goldenEvery: 5 },
    // snowfall (GDD 19.3): squalls once the Ridge is open; drifts settle on these Ridge path spots and slow anyone until Kit clears them
    SNOW: { first: 200, every: 150, dur: 30, perSquall: 3, stagger: 5, spots: [[270, 985], [270, 870], [270, 700], [200, 900], [400, 935]],
            driftR: 38, growT: 2, clearT: 0.6, slowKit: 0.4, slowGuest: 0.5, bonus: 3, maxDrifts: 4 },
    VALLEY: { y0: 2200, y1: 2400 },
    BOUNDS: { x0: 14, x1: 526, y0: 1150, y1: 2100 },
    LANE: { x0: 240, x1: 300, cx: 270, y0: 1150, y1: 2020, snap: 30 },
    PLATFORM: { x: 270, y: 2060, w: 320, h: 80, cap: 12, mill: { x0: 130, x1: 410, y0: 2030, y1: 2090 }, exit: { x: 270, y: 2030 } },
    BELL: { x: 135, y: 2005, ringR: 26 },
    CABLE: { y: 2120, pylons: [60, 480], pylonTop: 2060, dockX: 270, enterX: -60, exitX: 600, doorDY: 52, sortY: 2176 },
    KIT_START: { x: 270, y: 1990 },
    BRIDGE: { x: 270, y0: 1000, y1: 1150, w: 60, sign: { x: 330, y: 1130 } },
    MIST: { y0: 1000, y1: 1150 },
    PINES: [[28,1220],[70,1180],[512,1220],[470,1180],[24,1330],[516,1330],[24,1560],[516,1560],[24,1990],[516,1990],[24,2110],[516,2110],[200,1240],[340,1240]],
    ROCKS: [[60,1300],[480,1300],[200,2196],[340,2196]],
    STONE_LANTERNS: [[210,1300],[330,1300],[210,1580],[330,1580],[210,1980],[330,1980]]
  };
})(window.G);
