// Capy Springs - map data (ARCHITECTURE.md 7.1, GDD 2.2). World 540 x 2400; MVP uses y 1100..2400.
(function (G) {
  'use strict';
  G.DATA = G.DATA || {};
  G.DATA.MAP = {
    W: 540, H: 2400, CAM_MIN_Y: 1100, STATIC_Y0: 1100,
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
