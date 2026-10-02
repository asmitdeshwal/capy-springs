# CAPY SPRINGS — Technical Architecture (FINAL, build-ready)

Version 1.2 · 2026-09-11 · Companion to `docs/GAME_DESIGN.md` (the GDD). The GDD owns *rules and numbers*; this document owns *code shape*: files, load order, module contracts, data tables as code, the loop, rendering, input, save, audio, the headless harness and the build plan. Sections the GDD points at by number: **§9.4** (guest routing) and **§17** (headless harness assertions).

Revision 1.2 (pre-build review pass) — every change, so the packages do not have to diff:
- New `src/24_fx.js` (`G.FX`) owns particle emitters, pops, the koban-toss and unwrap animations and every presentation reaction on the bus that is not sound, HUD or camera; `Render.updateFx` is gone.
- World 540 × 2400 (painted valley under the cable); static cache 1300 px tall, blitted 1:1 (`sdpr = dpr × scale`); camera clamp uses `Math.max` and never inverts; cable at y 2120 with the cabin hanging below it and hop-outs upward onto the platform; Kit's box ends at y 2100.
- dt-based, sub-stepped simulation in the browser (`STEP_MAX = 1/50`); fixed 1/60 only in the harness; `Input.update` runs during hit-stop; hit-stop is requested by presentation subscribers and capped at 150 ms per second.
- Coins: trays instead of ground coins; `Coins` ends at the magnet and emits `coins:collect`; the HUD owns the screen flight. No `coinsFly`, `Coins.drawScreen`, `HUD.coinAnchor`, ground cap or merge.
- Offline: `Coins.add(…, 'offline')` never feeds the income buckets; the rate is the median bucket ÷ 30, capped at 20/s; `Save.offlineLive(S, nowMs)` serves a still-open tab; a visibility return never re-applies the save.
- Save v2 persists only causes (lantern levels, upgrade levels, …); `Save.apply(S, obj) → S` re-derives `built`, `trailCap`, `car.level`, hires, fame and `heat.max`; a migration loop with a downgrade guard.
- One global `S.splash` chain (2 s window); `Trail.takeFirst` is the only remover on the drop-off path; `Guests.seat` only sets state; guests carry a `node` back-pointer; `TRAIL_JOIN_GAP`.
- Cable car: `CAR_PERIOD_BY_LEVEL` with dock-to-dock semantics, car #1 pre-docked, `CAR_SECOND_AT`, `CAR_WARN_T` measured to the dock, `FULLCAR_MIN`, `car:empty`, a carLog sweep.
- Heat: grace, capped woodpile pickup, boiler always consumes, `RUSH_PAY` by chain, heated-only rush; grove pick cap; `STALL_PATIENCE`.
- Hints: 12 rules (chain, stall yuzu, TAP, dim fallback) implemented in WP0 together with the bot; `Upgrades.famousMult`; `MULT_CAP`.
- Input: trailing joystick base, ramped magnitude, 0.1 s bloom; a drag that starts on the sheet becomes the stick; far-tap feedback; tap-nudge during car #1; drag hint.
- Lanterns: `pos` (the step) and `postPos`; `visible` / `active` predicates; partial drains; continuous shortfall label; unwrap replaces the rise.
- Render: `Canvas.begin/end` with save/restore and bar-only ink fill; one halo sprite (`HALO_MAX` 8); DPR cap 1.5 on wide dense screens; no `U.rand` in any draw path; measured budgets replace the fill count; optional character sprite cache.
- Mode is derived (`Game.syncMode`); `countWaiting` counts arrivals; solids rebuild on grove upgrades; per-segment path lengths; the bot aims at `home` points.
- Build plan: Hints and the bot move to WP0; merge order WP1 → WP2 → WP4 → WP3 → WP5; exactly one owner per file.

---

## 0. Ground rules (read before writing a line)

1. **Stack**: vanilla ES2020 JavaScript, Canvas 2D, classic `<script>` tags loaded in a fixed order from `index.html`. No modules, no bundler, no npm dependencies, no image or audio files. Runs from `file://` and offline. Node is used only for `tools/serve.js` (LAN playtesting) and `test/headless.js`.
2. **One global**: `window.G`. Each file is an IIFE that attaches exactly one namespace object to `G`. Nothing else is written to `window`.
3. **One state object** `S` (§6). Systems are stateless modules with `init(S)`, `update(S, dt)`, `collect(S, list)` and, when they persist something, `save(S, out)` / `load(S, obj)`. Plain objects and functions only: no classes, no prototypes, no `this`, no getters.
4. **Numbers live in data**: `G.C` (tuning, §8), `G.PAL` (palette, GDD 11.3) and `G.DATA` (content, §7). A system file must not contain a literal that appears in a GDD table.
5. **dt-based, sub-stepped simulation.** The browser loop splits each frame into sub-steps of at most 1/50 s (so Kit never moves more than 7 px per sub-step, below his 12 px collision radius); the harness steps at a fixed 1/60. Every rule is written in seconds; nothing counts frames. Hit-stop freezes the simulation and never the renderer or the joystick.
6. **The harness is the screen.** `node test/headless.js` must pass before integration and after every balance change. Agents cannot look at the canvas; the bot plays through the same `G.Hints.compute()` that drives the on-screen arrow.
7. **No allocation in hot paths.** Pools for coins, steam, ripples, particles and pops; reusable `out` objects for geometry helpers; gradients, font strings and colour strings built once.
8. **Every module file loads even when empty of behaviour.** WP0 ships stubs for every public function so `index.html` opens with zero console errors from the first hour.
9. **Presentation never touches the seeded RNG.** Nothing reachable from `Render.frame`, a `collect` or a `draw` calls `U.rand`; draw-time jitter uses `U.hash(t, i)` or `Math.random`. A bot run therefore produces the same numbers with or without rendering, and the harness checks it.

---

## 1. Folder layout, load order, budgets

```
index.html
tools/serve.js                     (exists) node tools/serve.js 5173  → http://localhost:5173 plus a LAN URL for phones
.claude/launch.json                (exists) preview configuration "game"
docs/GAME_DESIGN.md  docs/ARCHITECTURE.md
src/
  00_config.js         G.C           tuning constants (§8)                                        ~200 lines
  01_palette.js        G.PAL         colours, GDD 11.3                                            ~60
  02_data_map.js       G.DATA.MAP    world, lane, platform, cable, valley, decor                  ~120
  02_data_stations.js  G.DATA.BATHS / STATIONS / UPGRADES                                        ~160
  02_data_lanterns.js  G.DATA.LANTERNS                                                            ~80
  02_data_guests.js    G.DATA.GUESTS / CAR / HELPERS                                              ~60
  10_util.js           G.U           math, easing, rng, hash, geometry, pools, text helpers      ~190
  11_bus.js            G.Bus         pub/sub                                                      ~40
  12_loop.js           G.Loop        sub-stepped loop, timescale, hit-stop budget, pause          ~100
  13_canvas.js         G.Canvas      sizing, DPR, safe area, begin/end, client→logical           ~130
  14_camera.js         G.Camera      follow, look-ahead, clamp, shake, transforms                 ~80
  15_input.js          G.Input       floating joystick, taps, keyboard                            ~220
  16_audio.js          G.Audio       WebAudio SFX, music layers, haptics                          ~280
  17_save.js           G.Save        versioned localStorage, offline earnings                     ~190
  20_art_shapes.js     G.Art.S       primitives, plates, shadows, text, pills, icons              ~170
  21_art_chars.js      G.Art.Ch      kit, capy, duck, pon, kero, bubbles, sprite cache            ~430
  22_art_world.js      G.Art.W       terrain, valley, decks, water, lanterns, boiler, trees, stall, platform, cable car, bridge ~460
  23_art_fx.js         G.Art.FX      steam, ripples, particles, pops, koban, trays, halo sprite   ~210
  24_fx.js             G.FX          emitters, pools' update, bus reactions, unwrap, pops         ~220
  30_state.js          G.State       state factory, entity factories, pools                       ~140
  31_player.js         G.Player      Kit movement, collision, poses, breadcrumb path              ~170
  32_trail.js          G.Trail       follower chain                                               ~210
  33_guests.js         G.Guests      guest state machine, routing (§9.4), drawing                 ~340
  34_cablecar.js       G.CableCar    cycle, cabin animation, spawning, golden/duck/empty cars     ~180
  35_baths.js          G.Baths       seats, soak, plops, Splash Chain, yuzu hats, payout          ~330
  36_heat.js           G.Heat        gauge, grace, woodpile, boiler, Steam Rush chains            ~180
  37_grove.js          G.Grove       trees, regrow, capped pick                                   ~130
  38_stall.js          G.Stall       Snack Stall (MVP Plus)                                       ~150
  39_coins.js          G.Coins       koban arcs, trays, magnet, balance, income                   ~180
  40_lanterns.js       G.Lanterns    offering steps, drain, reveal, effects, unwrap trigger       ~200
  41_upgrades.js       G.Upgrades    levels, costs, derived stat values                           ~130
  42_helpers.js        G.Helpers     Pon and Kero state machines                                  ~200
  43_events.js         G.Events      Lantern Night, FULL CAR, Golden Car, Famous Inn / Season Fame ~190
  44_hints.js          G.Hints       next-arrow rules, tutorial words                             ~190
  45_render.js         G.Render      frame pipeline, static cache, sort, tint/halo passes         ~180
  50_hud.js            G.HUD         coin pill + flights, pips, kettle, ribbon, banner, arrow, joystick, pills, chevron, drag hint ~280
  51_sheet.js          G.Sheet       station upgrade bottom sheet                                 ~200
  52_cards.js          G.Cards       intro, offline card, reset confirm, settings popover        ~180
  90_main.js           G.Game        boot, mode sync, update/draw orchestration, tap dispatch     ~150
test/
  stubs.js                           DOM / canvas / localStorage / AudioContext stubs             ~140
  bot.js                             the §17.3 bot (a module the harness requires)               ~150
  headless.js                        loader, invariants, assertions, CSV/beats dump               ~320
  art_smoke.html                     every character / pose / structure on a grid + silhouettes  (WP1)
```

Budget: MVP Core ≈ 6,600 lines of `src/`, MVP Plus (stall, night, golden, fame) ≈ +600, tests ≈ 600. Budgets are ceilings, not targets; readable beats short. A file that grows past 1.5× its budget is a signal to split responsibilities, not to compress.

`index.html` (complete; the script order is the numeric prefix order and is the only place load order is expressed):

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#1F2430">
<title>Capy Springs</title>
<style>
  html, body { margin:0; padding:0; height:100%; background:#1F2430; overflow:hidden; overscroll-behavior:none; }
  canvas { display:block; touch-action:none; -webkit-user-select:none; user-select:none; -webkit-tap-highlight-color:transparent; }
  #safe { position:fixed; left:0; top:0; width:0; height:0; visibility:hidden;
          padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); }
</style>
</head>
<body>
<div id="safe"></div>
<canvas id="game"></canvas>
<script src="src/00_config.js"></script>
<script src="src/01_palette.js"></script>
<script src="src/02_data_map.js"></script>
<script src="src/02_data_stations.js"></script>
<script src="src/02_data_lanterns.js"></script>
<script src="src/02_data_guests.js"></script>
<script src="src/10_util.js"></script>
<script src="src/11_bus.js"></script>
<script src="src/12_loop.js"></script>
<script src="src/13_canvas.js"></script>
<script src="src/14_camera.js"></script>
<script src="src/15_input.js"></script>
<script src="src/16_audio.js"></script>
<script src="src/17_save.js"></script>
<script src="src/20_art_shapes.js"></script>
<script src="src/21_art_chars.js"></script>
<script src="src/22_art_world.js"></script>
<script src="src/23_art_fx.js"></script>
<script src="src/24_fx.js"></script>
<script src="src/30_state.js"></script>
<script src="src/31_player.js"></script>
<script src="src/32_trail.js"></script>
<script src="src/33_guests.js"></script>
<script src="src/34_cablecar.js"></script>
<script src="src/35_baths.js"></script>
<script src="src/36_heat.js"></script>
<script src="src/37_grove.js"></script>
<script src="src/38_stall.js"></script>
<script src="src/39_coins.js"></script>
<script src="src/40_lanterns.js"></script>
<script src="src/41_upgrades.js"></script>
<script src="src/42_helpers.js"></script>
<script src="src/43_events.js"></script>
<script src="src/44_hints.js"></script>
<script src="src/45_render.js"></script>
<script src="src/50_hud.js"></script>
<script src="src/51_sheet.js"></script>
<script src="src/52_cards.js"></script>
<script src="src/90_main.js"></script>
</body>
</html>
```

A file may reference, **at load time**, only namespaces defined by lower-numbered files; **at call time** (after `G.Game.boot()`) any namespace. `90_main.js` ends with `if (!G.HEADLESS) window.addEventListener('load', G.Game.boot);`.

---

## 2. Namespace, module pattern, conventions

```js
// src/32_trail.js
(function (G) {
  'use strict';
  const C = G.C, U = G.U, DATA = G.DATA, PAL = G.PAL;
  const Trail = G.Trail = {};

  Trail.init = function (S) { /* ... */ };
  Trail.update = function (S, dt) { /* ... */ };
  Trail.collect = function (S, list) { /* push drawables */ };

  function targetPoint(S, dist, out) { /* private helper: a plain function inside the IIFE */ }
})(window.G);
```

- `00_config.js` begins with `window.G = window.G || {}; G.VERSION = '1.2.0'; G.HEADLESS = false;`. The harness sets `globalThis.window = globalThis` and `G.HEADLESS = true` before loading anything.
- `S` is always a parameter. `G.S` is assigned by `G.Game` for the debug overlay and the browser console only; no module reads it.
- **Direct calls vs. events**: a game system may call another game system directly (`G.Coins.add(S, 8, 'soak')`) and may call the cheap `G.FX` spawn helpers directly (`FX.puff`, `FX.steam`, …: they are pool inserts). *Reactions* that belong to presentation — sounds, HUD bounces, banners, haptics, camera bumps, hit-stop, confetti, pops, stat counters — are emitted on `G.Bus` (§16) and handled by `HUD`, `Audio`, `FX` and `Camera`. Game-system files never mention `G.Audio`, `G.HUD`, `G.Cards` or `G.Loop.hitStop`.
- **Drawable contract**: every object pushed into `list` by a `collect` has `sortY:number` and `draw:function(ctx, obj, S)`. `draw` is assigned once at creation from a module-level function (`g.draw = G.Guests.draw`). `collect` never allocates.
- **Time**: `S.t` is play time in seconds. It advances in modes `intro`, `play`, `sheet` and `settings`; it is frozen in `card` and `paused`. Animation that must keep running while the simulation is frozen (HUD, camera shake, particles) uses the wall-clock `dt` that `G.Game.step` passes to those modules.
- **Random**: `U.rand()` (seedable xorshift32) in simulation code only. `U.hash(a, b)` (a cheap deterministic float hash) or `Math.random` for presentation jitter; `Math.random` appears only inside `10_util.js` and `14_camera.js` (shake).
- **Language**: `const`/`let`, arrow functions for callbacks, template strings, destructuring, `?.` and `??` are fine (Chrome ≥ 80). No `class`, no `async`/`await` (nothing is asynchronous except the AudioContext unlock), no generators, no `Proxy` in `src/`.
- **Naming**: modules `PascalCase` on `G`; functions and fields `camelCase`; data ids lowercase strings exactly as GDD §16; constants `UPPER_SNAKE` in `G.C`.
- **Errors**: never `throw` inside the loop. A system that detects an impossible state logs once (`U.warnOnce(key, msg)`) and repairs it (removes the entity, resets the timer). The harness fails on any uncaught exception and on any `warnOnce` in fuzz mode.
- **Mode**: `S.mode` is derived by `G.Game.syncMode(S)` from what is open (§19.4); UI modules never assign `S.mode` themselves.

---

## 3. Game loop (`G.Loop`, `G.Game.step`, `G.Game.frame`)

```js
G.Loop = {
  STEP_MAX: 1 / 50, MAX_FRAME: 0.1, HITSTOP_CAP: 0.15,
  running: false, last: 0, timescale: 1,
  hitstop: 0, hitstopSpent: 0, hitstopWindowT: 0,
  fps: 60, stepMs: 0, frameMs: 16,                 // rolling averages for the debug overlay and low-fx detection
  start(stepFn, frameFn), stop(),
  hitStop(seconds)
};
```

Frame callback (`requestAnimationFrame`):

```
dt = min((now - last) / 1000, MAX_FRAME) * timescale; last = now
n = ceil(dt / STEP_MAX); h = dt / n                   // 1 sub-step at 60-120 Hz, 2 at 30 Hz, at most 5 after a stall
for (i = 0; i < n; i++) stepFn(h)
frameFn(dt)                                           // render once per RAF at the last simulated positions; sub-steps make interpolation unnecessary
```

`start()` sets `last = performance.now()` before requesting the first frame, so a visibility return never produces a jump. `hitStop(s)`: `hitstopWindowT` accumulates wall time and resets `hitstopSpent = 0` every second; `s = max(0, min(s, HITSTOP_CAP − hitstopSpent))`; `hitstop = max(hitstop, s)`; `hitstopSpent += s`. Hit-stop is requested only by presentation subscribers in `FX.init` (`'splash'` with count 3 → `C.HITSTOP_X3`, count 5 → `C.HITSTOP_X5`, `'heat:rush:start'` → `C.HITSTOP_RUSH`), and only while `S.settings.shakeFlash` is on. The harness never calls the frame callback; it calls `stepFn(1 / 60)` directly.

`G.Game.step(dt)` — the only place the update order lives (system order in §9.0):

```
Input.update(dt)                                                  // always first, so the stick is fresh even during hit-stop
for each tap in Input.takeTaps(): onTap(S, tap)
if (Loop.hitstop > 0) { Loop.hitstop -= dt; FX.update(S, dt); HUD.update(S, dt); Camera.update(S, dt); return; }
if (S.mode === 'card' || S.mode === 'paused') { Cards.update(S, dt); HUD.update(S, dt); FX.update(S, dt); return; }
if (S.mode === 'intro') { S.introT += dt; if (S.introT >= C.INTRO_T) { S.mode = 'play'; syncMode(S); } }   // the world runs during the intro (car #1 unloads)
S.t += dt
Player → Trail → CableCar → Guests → Baths → Heat → Grove → Stall → Coins → Lanterns → Helpers → Events → Hints → FX → Camera → HUD → Sheet → Cards → Save.tick
```

`G.Game.frame(dt)` calls `G.Render.frame(S, ctx)` (§10) and then `G.Game.updatePerf(dt)` (§18).

`timescale` is a debug knob (`G.Loop.timescale = 4` in the console to fast-forward). There is no slow motion in MVP; x3, x5 and rush start use hit-stop (GDD 11.6).

Visibility (`document.visibilitychange`):
- **hidden**: `S.prevMode = S.mode; S.mode = 'paused'; Save.write(S); Loop.stop()`.
- **visible**: `Loop.start(step, frame)`; if `Date.now() − S.savedAt ≥ C.OFFLINE_MIN × 1000`: `info = Save.offlineLive(S, Date.now())`; `S.heat.v = max(S.heat.v, S.helpers.pon.hired ? C.RETURN_HEAT_PON : C.RETURN_HEAT)`; `if (info.show) Cards.showOffline(S, info) else Coins.add(S, info.coins, 'offline')`. Then `S.mode = S.prevMode; syncMode(S)` (a card that was just opened wins). **The live state is kept across hide/show; the save is never re-applied on a visibility return** (that path exists only in `loadGame`, §15.4).

---

## 4. Canvas, coordinates, camera, depth

### 4.1 Canvas sizing (`G.Canvas`)

```js
G.Canvas = { el, ctx, W: 540, H: 960, scale: 1, offX: 0, offY: 0, dpr: 1, st: 0, sb: 0,
  init(canvasEl), resize(), begin(), end(), toLogical(clientX, clientY, out) };
```

`resize()` (on init, and on `resize` / `orientationchange` debounced 100 ms):

```
cssW = innerWidth; cssH = innerHeight
dpr = min(devicePixelRatio || 1, C.DPR_CAP); if (cssW * dpr > C.DPR_WIDE_PX) dpr = min(dpr, C.DPR_CAP_WIDE)   // 2, or 1.5 on wide dense screens
if (cssH / cssW >= 16 / 9) { scale = cssW / 540; H = clamp(round(cssH / scale), 960, 1200); offX = 0; offY = round((cssH - H * scale) / 2) }
else                       { scale = cssH / 960; H = 960; offX = round((cssW - 540 * scale) / 2); offY = 0 }
el.width = round(cssW * dpr); el.height = round(cssH * dpr); el.style.width = cssW + 'px'; el.style.height = cssH + 'px'
st = (parseFloat(getComputedStyle(#safe).paddingTop) || 0) / scale
sb = (parseFloat(getComputedStyle(#safe).paddingBottom) || 0) / scale
Render.onResize()           // the static cache scale (sdpr) and slice height depend on scale and H
```

`begin()` each frame: `ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save()`; if `offX || offY` fill **only the two letterbox bars** with `PAL.ink` (never the whole canvas); `ctx.setTransform(dpr*scale, 0, 0, dpr*scale, offX*dpr, offY*dpr)`; `ctx.beginPath(); ctx.rect(0, 0, 540, H); ctx.clip()`. From here on everything is in **logical px**. `end()` = `ctx.restore()`, called last in `Render.frame`, so the clip never leaks into the next frame and the bars repaint after a resize. `toLogical(cx, cy) = ((cx − offX) / scale, (cy − offY) / scale)`.

### 4.2 Coordinate systems

- **World**: x 0..540, y 0..2400, +y down, 1 world unit = 1 logical px. MVP uses y 1100..2400: 1100..2200 is the inn, 2200..2400 the painted valley (static art, no solids, never walkable). There is no projection matrix and no Y squash (GDD 11.1); the oblique look is purely an art rule.
- **Screen (logical)**: x 0..540, y 0..H. `sx = wx + shakeX`, `sy = wy − cam.y + shakeY`. `cam.x` is always 0 because the world is exactly as wide as the screen.
- **Feet point**: every entity's `(x, y)` is where it touches the ground. Art draws bodies upward from the feet. `sortY = y` unless §4.4 says otherwise.
- **Where things are drawn**: HUD (including the coin flights), sheet and cards in screen space; the next arrow, tutorial word, "+N" pops, bubbles and labels in world space after the night tint (§10).

### 4.3 Camera (`G.Camera`)

```js
G.Camera = { x: 0, y: 1440, look: 0, shakeX: 0, shakeY: 0, shakeMag: 0, shakeT: 0, shakeDur: 0,
  init(S), update(S, dt), bump(px), shake(px, seconds), apply(ctx), unapply(ctx),
  toScreen(wx, wy, out), toWorld(sx, sy, out), visibleY(wy, margin) };
```

`update`: `lookTarget = S.kit.moving ? sign(S.kit.vy) * C.CAM_LOOK : 0` (`CAM_LOOK` is 20 in MVP; the Ridge will raise it); `look += (lookTarget − look) * (1 − e^(−4 dt))`; `target = S.kit.y − C.CAM_KIT_FRAC * Canvas.H + look`; `y += (target − y) * (1 − e^(−C.CAM_FOLLOW dt))`; **`y = clamp(y, MAP.CAM_MIN_Y, Math.max(MAP.CAM_MIN_Y, MAP.H − Canvas.H))`** — 1100..1440 at H = 960, 1100..1200 at H = 1200, never inverted (the harness asserts `cam.y + Canvas.H ≤ MAP.H` for both heights). `init` places `y` at the clamped target. Shake: `shakeT −= dt`; `k = shakeMag * max(0, shakeT / shakeDur)`; `shakeX = round(k * (Math.random() * 2 − 1))`, same for Y (presentation: never the seeded RNG); `bump(px) = shake(px, 0.15)`; `shake(px, s)` keeps the larger of the current and requested magnitude and is a no-op while `S.settings.shakeFlash` is off. `apply` = `ctx.translate(shakeX, −y + shakeY)`; `unapply` = the inverse translate. There is no `save`/`restore` around the whole world pass (the outer one is in `Canvas.begin/end`), so modules may use save/restore freely inside their own draws.

### 4.4 Depth sorting

`G.Render` runs an unsorted **ground pass**, then a **sorted pass** of drawables gathered from every system's `collect`, sorted by `sortY` ascending with insertion order as the tiebreak (`Array.prototype.sort` is stable; `list` is reused between frames).

| Thing | Pass | sortY |
|---|---|---|
| terrain, valley, path, pines, rocks, platform plate, cable, pylons, bridge planks, built deck plates and static bodies | static cache (§10.2) | — |
| offering steps, water bodies + soaking guests (clipped inside the water), ripples, soak rings, coin trays and their stacks, Kit's dust | ground pass | — |
| Kit | sorted | `y + 0.5` (beats followers at the same y) |
| trail followers (guests, logs, yuzu), waiting/walking guests | sorted | `y` |
| lantern posts (post + lamp + flame) | sorted | `step.y − 38` (the post's feet) |
| trees, boiler glow, woodpile, stall top, bell post, stone lanterns | sorted | footprint bottom y (= data `y`) |
| helpers | sorted | `y` |
| airborne koban | sorted | the target tray's `y` (the shadow stays on the deck) |
| cable car | sorted | `2176` |
| structures mid-unwrap (0..0.35 s after build) | sorted (drawn by `FX`) | footprint bottom |
| steam, puffs, confetti, koban tosses, mist gradient | FX pass (unsorted, after the sorted pass) | — |
| want bubbles, sweat drops, hearts, world pops, arrow + word, cost pills, level pill, chevron | world-text pass (after the night tint) | — |

Bubbles, sweat drops and hearts are **not** drawn with their owner: `Guests.collectText(S, list)` pushes them for the world-text pass so they are never under the tint.

---

## 5. Input (`G.Input`)

```js
G.Input = {
  vec: { x: 0, y: 0 }, mag: 0, headless: false,
  stick: { active: false, id: null, ox: 0, oy: 0, kx: 0, ky: 0, alpha: 0, t0: 0, moved: false, fromSheet: false },
  taps: [],              // [{x, y, zone}] logical screen coords, consumed once per step; zone = 'joy' when the tap began in the joystick zone
  keys: {},              // code → true
  lastStickT: -1,        // wall time of the last stick movement (the drag hint reads it)
  init(canvasEl), update(dt), takeTaps() };
```

Pointer handling (`pointerdown` / `pointermove` / `pointerup` / `pointercancel` on the canvas with `setPointerCapture`; mouse and touch behave identically; `contextmenu` is prevented; the first `pointerdown` or `keydown` calls `G.Audio.unlock()`, which also plays the first `bell`):

- **down** at logical `(x, y)`: if `G.Game.uiOwns(S, x, y)` (a card is open, the settings popover contains the point, the sheet is open and `y ≥ sheet.top`, or the gear rect contains the point) → record a **UI tap candidate** `{id, x, y, t0}`; a candidate on the sheet that later moves more than `C.TAP_PX` **converts into the stick** (`fromSheet = true`, base at the current point) so the thumb can keep steering with the sheet open. Else if `y > C.JOY_ZONE * Canvas.H` and no stick is active → this pointer **becomes the stick**: `stick = {active:true, id, ox:x, oy:y, kx:x, ky:y, alpha:0.35, t0:now, moved:false}`. Else → tap candidate.
- **move** (stick pointer): `dx = x − ox; dy = y − oy; len = hypot(dx, dy)`. **Trailing base** (`C.JOY_TRAIL`): `if (len > C.JOY_R) { ox += dx / len * (len − C.JOY_R); oy += dy / len * (len − C.JOY_R); dx = x − ox; dy = y − oy; len = C.JOY_R }` — the base visibly follows the thumb, so reversing never needs a swipe back through it. `if (len > C.TAP_PX) { moved = true; lastStickT = now }`. Knob = `(ox + dx, oy + dy)`. Magnitude ramps from the dead zone: `mag = clamp((len − C.JOY_DEAD) / (C.JOY_R * C.JOY_FULL − C.JOY_DEAD), 0, 1)`; `vec = (dx, dy) / len * mag` (zero when `len < C.JOY_DEAD`).
- **update**: while the stick is active `alpha` eases toward 1 over `C.JOY_ALPHA_T` from the pointerdown, moved or not; after release it fades to 0 over `C.JOY_FADE`.
- **up / cancel**: stick pointer: if `!moved && now − t0 < C.TAP_MS` → push tap `{x: ox, y: oy, zone: 'joy'}`; then `active = false; vec = 0; mag = 0`. Tap candidates: pushed as a tap if they moved < `C.TAP_PX` and lasted < `C.TAP_MS`.
- Only one pointer is ever the stick; a second finger while the stick is held is always a tap candidate.
- **Keyboard**: `KeyW/ArrowUp`, `KeyS/ArrowDown`, `KeyA/ArrowLeft`, `KeyD/ArrowRight` set `keys`; in `update`, if the stick is inactive, `vec` = normalized key vector, `mag = 1`, `lastStickT = now`. `KeyE` → `G.Game.key('E')` (open the nearest station sheet within `C.STATION_TAP_DIST`, or close it), `Escape` → `'ESC'`, `KeyM` → `'M'` (mute), `Backquote` → `'DEBUG'`. Space is unused in MVP (reserved for the Scamper dash stretch).
- **Headless**: `Input.headless = true` makes `init` a no-op; the bot writes `Input.vec` / `Input.mag` directly and pushes into `Input.taps` if it needs UI.

**Tap dispatch** — `G.Game.onTap(S, tap)`, first consumer wins: `Cards.tap(S, x, y)` (card buttons, settings rows, reset confirm; a tap outside the popover closes it and is consumed) → `Sheet.tap(S, x, y)` (X, buttons; outside the sheet → close, consumed) → `HUD.tapGear(S, x, y)` → world hit-test: `Camera.toWorld(x, y)`, `id = Sheet.stationAt(S, wx, wy)` (built sheet station whose tap footprint expanded by 20 px contains the point): if its centre is within `C.STATION_TAP_DIST` of Kit → `Sheet.open(S, id)`, else `HUD.farTap(S, id)` (the level pill bounces, the arrow flashes toward that station for 1 s at alpha 1 × 1.2, `Bus 'ui:pip'`; no auto-walk, no sheet) → `tap.zone === 'joy' && S.car.index === 1 && !S.tutorial.DRAG` → `G.Game.nudge(S)` (Kit moves toward the current arrow target for `C.TAP_NUDGE_T`) → (stretch: crow) → not consumed.

---

## 6. State and entity model (`G.State`)

```js
G.State = {
  create() → S,                       // fresh new-game state built from G.C and G.DATA (car #1 already docked)
  newGuest(S, kind, carId) → guest,   // from the guest pool (cap C.MAX_GUESTS)
  freeGuest(S, g),
  newCoin(S) → coin | null,           // from the koban pool (cap 40 across air + magnet)
  freeCoin(S, c),
  bathRuntime(def) → bath,            // builds the runtime record for a bath def
  resetRuntime(S)                     // clears guests, trail, koban, trays and helpers' transient fields (used on load)
};
```

Full shape. **P** = persisted by `G.Save`, **R** = runtime only, **D** = derived by `Save.apply` from persisted causes (never written to disk). Fields marked P inside an R object are the persisted subset.

```js
S = {
  v: 2,                                                    // P save schema version
  mode: 'intro', prevMode: 'play', introT: 0,              // R  intro | play | sheet | card | settings | paused (derived, §19.4)
  t: 0,                                                    // P  play seconds
  coins: 0, earned: 0,                                     // P
  income: { buckets: [0,0,0,0,0,0], head: 0, bucketT: 0 }, // P  six 30-s buckets of IN-PLAY income only (GDD 8.9)
  car: { level: 0,                                         // D  from lanterns.car.level
         index: 1,                                         // P  number of cars that have docked (ids are 1-based; car #1 is docked at t = 0)
         timer: 0, phase: 'dock', phaseT: 0, x: 270, swing: 0, kind: 'capy', golden: false, empty: false,
         toSpawn: 3, spawnT: C.CAR_FIRST_HOP_AT, carId: 1, warned: true }, // R  phase: away | in | dock | out
  carLog: {},                                              // R  carId → { n, seated, lost, gone, done, t }
  splash: { count: 0, t: -99, mult: 1, bathId: null },     // R  the one global Splash Chain (§9.5)
  lanterns: { cedar: {sunk:0, level:0}, trail: {…}, grove: {…}, car: {…}, pon: {…}, stall: {…}, kero: {…}, bamboo: {…}, bridge: {…} }, // P  the CAUSE of every D field
  lanternFx: {},                                           // R  id → { standT, acc, tickT, check, flash, short, wiggle, rearm }
  built: { rock: true, cedar: false, boiler: false, woodpile: false, grove: false, bamboo: false, stall: false, bridge: false }, // D
  unwrapping: {},                                          // R  structureId → 0..1 unwrap progress (present only while unwrapping)
  levels: { rock: {speed:0, slots:0, pay:0}, cedar: {…}, bamboo: {…}, boiler: {…}, grove: {…}, stall: {…} }, // P
  trailCap: 3,                                             // D  from lanterns.trail.level
  heat: { v: 75, max: 100, graceT: 0, rush: false, rushT: 0, chain: 0, cold: false, occupied: false, stokeT: 0, pickT: 0, rushSeen: false }, // P: v, rushSeen; D: max
  kit: { x: 270, y: 1990, vx: 0, vy: 0, face: 1, dir: 'down', moving: false, sx: 1, sy: 1, squashT: 0,
         pose: null, poseT: 0, dustT: 0, idleT: 0, stoppedT: 0, nudgeT: 0,
         path: { xs: Float32Array(400), ys: Float32Array(400), seg: Float32Array(400), head: 0, n: 0 } }, // R (x, y are P); seg[i] = distance from sample i−1 to i
  trail: [],                                               // R  nodes, §9.2
  trailMeta: { joinT: -99, compress: 1 },                  // R  last join time (TRAIL_JOIN_GAP) and the eased stop-compress factor
  guests: [],                                              // R  guests, below
  nextId: 1,                                               // R
  baths: { rock: bath, cedar: bath, bamboo: bath },        // R  runtime records, below (yuzuT is P)
  trays: { rock: { value: 0, bounce: 0 }, cedar: {…}, bamboo: {…}, stall: {…} }, // R  coin trays (their sum is saved as floorCoins)
  grove: { trees: [ {x, y, progress: 0, ripe: false, pulse: 0} × 5 ] }, // P: progress, ripe
  stall: { stock: 0, prepT: 0, pending: 0, queue: [null, null, null, null] }, // P: stock, pending
  coinsAir: [], coinsMagnet: [],                           // R  koban flying into a tray / out of a tray toward Kit
  helpers: { pon:  { hired: false, x: 405, y: 1700, face: 1, state: 'rest', t: 0, hasLog: false, sx: 1, sy: 1, yawn: 0 },
             kero: { hired: false, x: 200, y: 1650, face: 1, state: 'wait', t: 0, hasYuzu: false, hop: null, tx: 0, ty: 0, sx: 1, sy: 1 } }, // D: hired (from lanterns.pon / kero)
  night: { active: false, t: 0, next: 240, fade: 0, count: 0, lit: {} }, // P: next, count; lit = lanterns that already dropped light tonight
  tutorial: { LEAD: 0, SOAK: 0, COLLECT: 0, LIGHT: 0, STOKE: 0, YUZU: 0, TAP: 0, DRAG: 0 }, // P  times shown
  stats: { served: 0, ducks: 0, combos: [0,0,0,0,0,0], rushes: 0, chains: 0, fullCars: 0, nights: 0, golden: 0, mochi: 0, lost: 0 }, // P
  settings: { sound: true, haptics: null, shakeFlash: true, lowFx: false },  // P  haptics null = auto (on for touch devices)
  fx: { steam: pool, ripples: pool, parts: pool, pops: pool, flash: 0, wash: 0 }, // R
  ui: { sheet: null, card: null, settings: false, banner: null, pill: null, pillT: 0, arrow: null, lastRule: 0, arrowFlash: null,
        coinBounce: 0, coinShown: 0, kettleSlide: 0, ribbon: 0, squash: {}, chevron: null, dragHint: false, debug: false }, // R
  perf: { frameMs: 16, stepMs: 0, slowT: 0 },              // R
  savedAt: 0, saveT: 0                                     // P: savedAt (ms epoch)
};
```

**Guest** (`G.State.newGuest`):

```js
guest = { id, kind: 'capy'|'duck', x, y, face: 1, state: 'arrive', carId, golden: false,
  patience, patienceMax, want: 'bath'|'mochi'|null, bathId: null, slot: -1, soakT: 0, soakMax: 0, batch: null, yuzuHat: false,
  node: null,                                   // back-pointer to the trail node while state === 'trail'
  sx: 1, sy: 1, squashT: 0, bobPhase, hop: null, route: null, routeI: 0, walk, millT: 0, waveT: 0, heartT: 0,
  sleepy: 0, shiver: false, queueSpot: -1, queueT: 0, paid: 0, sortY: 0, draw: G.Guests.draw };
// hop   = { x0, y0, x1, y1, t, dur, h }   arc from (x0,y0) to (x1,y1) over dur seconds with apex h; U.hopPos(hop, out)
// route = [{x, y}, …] (§9.4); routeI = index of the current waypoint
```

States (GDD §16): `arrive` (hopping out of the car) → `wait` (milling on the platform) → `trail` (a trail node owns its position) → `soak` (in a seat) → `pay` (climbing out, throwing koban) → `stall` (queued or being served, MVP Plus) → `leave` (routing to the platform, waving) → `gone` (freed). Impatience moves `wait` / `trail` / `stall` → `leave`.

**Bath runtime** (`G.State.bathRuntime(def)`):

```js
bath = { id, def, slots: new Array(def.maxSlots).fill(null), yuzuT: 0, warm: true, occupied: false,
         rippleT: 0, steamT: 0, lastPlop: -99, sortY: def.deck.y + def.deck.h / 2, draw: null };   // baths push nothing to the sorted list (§9.5)
```

**Koban** (coin): `{ x, y, z, vx, vy, vz, value, state: 'air'|'magnet', trayId, t, sx, sy, sortY, draw }`. There is no ground state: an airborne koban lands in its tray (its value joins `trays[id].value`) and is freed; a magnet koban leaves a tray toward Kit.

**Trail node**: `{ kind: 'guest'|'log'|'yuzu', ref: guest|null, x, y, sx, sy, squashT, bobPhase, hop: null|hop, dist: 0, roll: 0, sortY, draw }`; for guests `ref.node === node`.

**Pools** (`U.pool(cap, factory)` → `{ items, n, alloc() → item|null, free(i), clear() }`, swap-remove; iterate `for (let i = 0; i < pool.n; i++)`): guests 48, koban 40, steam 60 (30 in low-fx), ripples 30 (15), particles 120, pops 16; the HUD owns a separate screen-space pool of 40 coin flights.

---

## 7. Data tables (`G.DATA`) — canonical code, copy verbatim into `src/02_data_*.js`

Positions are footprint **centers** in world px; `deck` / `water` rects are center + size; a station's `y` is its feet (footprint bottom) unless a rect is given. These are the GDD 2.2 / 8.x numbers.

### 7.1 `02_data_map.js`

```js
G.DATA = G.DATA || {};
G.DATA.MAP = {
  W: 540, H: 2400, CAM_MIN_Y: 1100, STATIC_Y0: 1100,
  VALLEY: { y0: 2200, y1: 2400 },                                   // painted mist + pine tips; no solids, never walkable
  BOUNDS: { x0: 14, x1: 526, y0: 1150, y1: 2100 },                 // Kit's walkable box (ends at the platform's bottom edge)
  LANE: { x0: 240, x1: 300, cx: 270, y0: 1150, y1: 2020, snap: 30 },
  PLATFORM: { x: 270, y: 2060, w: 320, h: 80, cap: 12, mill: { x0: 130, x1: 410, y0: 2030, y1: 2090 }, exit: { x: 270, y: 2030 } },
  BELL: { x: 135, y: 2005, ringR: 26 },
  CABLE: { y: 2120, pylons: [60, 480], pylonTop: 2060, dockX: 270, enterX: -60, exitX: 600, doorDY: 52, sortY: 2176 }, // cabin hangs 2120..2176; the door is (x, 2172)
  KIT_START: { x: 270, y: 1990 },
  BRIDGE: { x: 270, y0: 1000, y1: 1150, w: 60, sign: { x: 330, y: 1130 } },
  MIST: { y0: 1000, y1: 1150 },
  PINES: [[28,1220],[70,1180],[512,1220],[470,1180],[24,1330],[516,1330],[24,1560],[516,1560],[24,1990],[516,1990],[24,2110],[516,2110],[200,1240],[340,1240]],
  ROCKS: [[60,1300],[480,1300],[200,2196],[340,2196]],
  STONE_LANTERNS: [[210,1300],[330,1300],[210,1580],[330,1580],[210,1980],[330,1980]]   // decor; glow at night
};
```

### 7.2 `02_data_stations.js`

```js
G.DATA.BATHS = [
  { id: 'rock',   name: 'Rock Pool',  heated: false, slots: 3, maxSlots: 6, soak: 8, lantern: null,
    water: { x: 120, y: 1860, w: 160, h: 95 }, deck: { x: 120, y: 1860, w: 220, h: 155 },
    exit: { x: 236, y: 1900 }, tray: { x: 212, y: 1922 }, lane: 250 },
  { id: 'cedar',  name: 'Cedar Bath', heated: true,  slots: 4, maxSlots: 7, soak: 8, lantern: 'cedar',
    water: { x: 420, y: 1860, w: 150, h: 90 }, deck: { x: 420, y: 1860, w: 210, h: 150 },
    exit: { x: 309, y: 1900 }, tray: { x: 328, y: 1920 }, lane: 290 },
  { id: 'bamboo', name: 'Bamboo Tub', heated: true,  slots: 5, maxSlots: 8, soak: 7, lantern: 'bamboo',
    water: { x: 120, y: 1430, w: 150, h: 90 }, deck: { x: 120, y: 1430, w: 210, h: 150 },
    exit: { x: 236, y: 1470 }, tray: { x: 212, y: 1492 }, lane: 250 }
];
// drop zone = deck rect; Kit collides with the water rect; koban land in the tray (on the lane-side deck strip, never on water); guests reappear at `exit` when climbing out.

G.DATA.STATIONS = {
  boiler:   { x: 450, y: 1660, w: 60, h: 70, solid: { w: 60, h: 24 }, zone: 44,  home: { x: 450, y: 1700 } },
  woodpile: { x: 360, y: 1670, w: 70, h: 40, solid: null,             zone: 40,  home: { x: 360, y: 1700 } },   // centres 90 px apart > 44 + 40: the two zones never overlap
  grove:    { slots: [[80,1690],[160,1690],[120,1630],[80,1570],[160,1570]], zone: 44, trunk: { w: 10, h: 8 }, home: { x: 120, y: 1720 } },  // the bot aims at (tree.x, tree.y + 30)
  stall:    { x: 430, y: 1470, w: 120, h: 36, solid: { w: 120, h: 36 }, zone: { x: 430, y: 1500, r: 60 }, home: { x: 430, y: 1505 },
              queue: [[370,1525],[410,1525],[450,1525],[490,1525]], tray: { x: 430, y: 1512 } },
  platform: { x: 270, y: 2060, w: 320, h: 80 }
};
// Sheet-capable stations (a tap opens the upgrade sheet): rock, cedar, bamboo, boiler, grove, stall. Tap footprints:
// baths = deck rect; boiler = (x-30..x+30, y-70..y); grove = union of the active trees' canopies (r 26 around (x, y-44)); stall = counter rect grown to h 60 for the awning.

G.DATA.UPGRADES = {   // GDD 8.3 / 8.4. cost(level) = round5(base * 1.6 ** level), level = current level (0-based)
  rock:   { speed: { label: 'Soak',   base: 30,  max: 6 }, slots: { label: 'Seats',   base: 45,  max: 3 }, pay: { label: 'Tips',  base: 40,  max: 6 } },
  cedar:  { speed: { label: 'Soak',   base: 40,  max: 6 }, slots: { label: 'Seats',   base: 60,  max: 3 }, pay: { label: 'Tips',  base: 50,  max: 6 } },
  bamboo: { speed: { label: 'Soak',   base: 90,  max: 6 }, slots: { label: 'Seats',   base: 120, max: 3 }, pay: { label: 'Tips',  base: 100, max: 6 } },
  boiler: { speed: { label: 'Stoke',  base: 60,  max: 6 }, slots: { label: 'Tank',    base: 120, max: 5 }, pay: { label: 'Pon',   base: 90,  max: 5, requires: 'pon' } },
  grove:  { speed: { label: 'Regrow', base: 50,  max: 6 }, slots: { label: 'Trees',   base: 80,  max: 3 }, pay: { label: 'Ripe',  base: 70,  max: 6 } },
  stall:  { speed: { label: 'Prep',   base: 80,  max: 6 }, slots: { label: 'Counter', base: 100, max: 3 }, pay: { label: 'Price', base: 90,  max: 6 } }
};
```

### 7.3 `02_data_lanterns.js`

```js
G.DATA.LANTERNS = [   // GDD 8.5. x, y = the offering STEP (stand point); the post stands at (x, y - C.POST_BACK). requires: 'id' = that lantern at level ≥ 1; 'id:2' = level ≥ 2. effect strings are parsed by G.Lanterns.applyEffect.
  { id: 'cedar',  label: 'Cedar Bath',   x: 420, y: 1965, costs: [20],                              requires: [],                             effect: 'build:cedar,boiler,woodpile' },
  { id: 'trail',  label: 'Trail Rope',   x: 50,  y: 1990, costs: [35, 200, 700],                    requires: ['cedar'],                      effect: 'trailCap:5,8,12' },
  { id: 'grove',  label: 'Yuzu Grove',   x: 120, y: 1745, costs: [60],                              requires: ['cedar'],                      effect: 'build:grove' },
  { id: 'car',    label: 'Cable Car',    x: 490, y: 2000, costs: [70, 250, 600],                    requires: ['trail'],                      effect: 'carLevel:1,2,3' },
  { id: 'pon',    label: 'Hire Pon',     x: 405, y: 1735, costs: [80],                              requires: ['cedar'],                      effect: 'hire:pon' },
  { id: 'stall',  label: 'Snack Stall',  x: 430, y: 1585, costs: [120],                             requires: ['grove'],                      effect: 'build:stall' },
  { id: 'kero',   label: 'Hire Kero',    x: 350, y: 1450, costs: [150],                             requires: ['stall'],                      effect: 'hire:kero' },
  { id: 'bamboo', label: 'Bamboo Tub',   x: 235, y: 1530, costs: [180],                             requires: ['car'],                        effect: 'build:bamboo' },
  { id: 'bridge', label: 'Ridge Bridge', x: 270, y: 1180, costs: [1500, 2000, 2500, 3000, 4000],    requires: ['bamboo', 'trail:2', 'car:2'], effect: 'famous:1.25,1.30,1.35,1.40,1.45' }
];
```

### 7.4 `02_data_guests.js`

```js
G.DATA.GUESTS = {   // GDD 8.1
  capy: { pay: 6, walk: 110, patienceWait: 40, patienceTrail: 25, soakMult: 1,   gap: 28, w: 44, h: 32, bobHz: 1 },
  duck: { pay: 3, walk: 150, patienceWait: 20, patienceTrail: 15, soakMult: 0.5, gap: 24, w: 28, h: 30, bobHz: 2 }
};
G.DATA.CAR = {      // GDD 8.2; level index = S.car.level; period is DOCK-TO-DOCK seconds; ducks = capys + C.DUCK_EXTRA
  levels: [ { capys: 3, spread: 0, ducks: 0,  period: 18 },
            { capys: 5, spread: 1, ducks: 8,  period: 21 },
            { capys: 7, spread: 1, ducks: 10, period: 24 },
            { capys: 9, spread: 1, ducks: 12, period: 25 } ]
};
G.DATA.HELPERS = {  // GDD 5.3, 8.7
  pon:  { speed: 70, rest: 3, cap: 70, home: { x: 405, y: 1700 }, take: 0.4, stoke: 0.3, yawn: 3 },
  kero: { hopT: 0.5, hopLen: 60, hopH: 26, home: { x: 200, y: 1650 }, pick: 0.3, deliver: 0.3 }
};
```

---

## 8. Config (`G.C`, `src/00_config.js`) — every tuning constant

```js
window.G = window.G || {}; G.VERSION = '1.2.0'; G.HEADLESS = false;
G.C = {
  // Kit (GDD 5.1, 6)
  KIT_SPEED: 280, KIT_SPRINT: 1.25, KIT_ACCEL_T: 0.12, KIT_RADIUS: 12, KIT_DUST_EVERY: 0.12, KIT_IDLE_STRETCH: 6, KIT_PUMP_T: 0.4,
  // Trail (GDD 5.1)
  TRAIL_CAPS: [3, 5, 8, 12], TRAIL_JOIN_R: 44, TRAIL_JOIN_GAP: 0.12, TRAIL_LOG_EVERY: 0.35,
  TRAIL_SAMPLE: 4, TRAIL_FIRST_GAP: 6, TRAIL_GAP: { log: 22, yuzu: 18 },          // guest gaps come from G.DATA.GUESTS[kind].gap
  TRAIL_LERP_BASE: 0.65, TRAIL_HOP_T: 0.25, TRAIL_HOP_H: 18, TRAIL_BOB_AMP: 3, TRAIL_BOB_W: 6, TRAIL_BOB_PHASE: 0.9, TRAIL_PATH_CAP: 400,
  TRAIL_STOP_COMPRESS: 0.6, TRAIL_STOP_EASE: 0.3,                                  // target distances × 0.6 while Kit is stopped, eased over 0.3 s
  // Guests (GDD 5.1, 5.6, 8.1, 5.11)
  SWEAT_AT: 0.4, COLD_PATIENCE_MULT: 0.5, MILL_MIN: 1.5, MILL_MAX: 3, LEAVE_WAVE_T: 0.4, CLIMB_OUT_T: 0.4, PLOP_T: 0.25, HOP_OUT_T: 0.25,
  HEART_EVERY: 3, STALL_WANT: 0.35, STALL_PATIENCE: 30, LANE_SNAP: 30,
  // Baths and Splash Chain (GDD 5.2, 8.3)
  PLOP_GAP: 0.12, SPLASH_WINDOW: 2.0, SPLASH_MULT: [1, 1, 1, 1.25, 1.5, 2.0], SPLASH_BUMP: [0, 0, 0, 4, 6, 8], SPLASH_TEXT: [0, 0, 0, 34, 40, 48],
  HITSTOP_X3: 0.04, HITSTOP_X5: 0.10, HITSTOP_RUSH: 0.12, SOAK_STEP: 0.5, PAY_STEP: 0.15, YUZU_REFRESH_BELOW: 3, RIPPLE_EVERY: 0.9, SLOT_INSET: 24,
  TUTORIAL_SOAK: 5, MULT_CAP: 6.0,
  // Heat (GDD 5.3, 8.6)
  HEAT_START: 75, HEAT_MAX: 100, TANK_STEP: 15, HEAT_COLD: 30, HEAT_RUSH: 80, HEAT_GRACE: 30, DRAIN_IDLE: 0.5, DRAIN_OCCUPIED: 1.0, DRAIN_RUSH: 4.0,
  LOG_HEAT: 15, STOKE_STEP: 2, STOKE_GAP: 0.15, RUSH_T: 10, RUSH_PAY: [1.5, 1.75, 2.0], RUSH_SOAK: 2, RUSH_SURPLUS_T: 1, STOKE_HINT_BELOW: 40, WASH_COUNT: 20,
  // Yuzu, grove, stall (GDD 5.4, 5.6, 8.7)
  YUZU_PAY: 2, REGROW: 15, REGROW_STEP: 1.25, TREES_BASE: 2, YUZU_DUR: 10, YUZU_DUR_STEP: 1.5,
  MOCHI_PAY: 18, PREP: 3, PREP_STEP: 0.25, COUNTER_BASE: 2, STALL_QUEUE: 4,
  // Koban and trays (GDD 8.8)
  COIN_VZ: [260, 340], COIN_G: 900, COIN_V_MAX: 120, TRAY_SCATTER: 10, TRAY_MAGNET_R: 60, COIN_TO_KIT_T: 0.2, COIN_TO_HUD_T: 0.35,
  COINS_PER_PAY_MAX: 6, COIN_BADGE_MIN: 5, TRAY_STACK_MAX: 5, CLINK_RESET: 0.5, CLINK_MAX: 12, COIN_POOL: 40, HUD_FLY_POOL: 40,
  // Lanterns / offering steps (GDD 5.7, 8.8)
  PAD_R: 34, PAD_STAND_R: 30, POST_BACK: 38, DRAIN_START: 20, DRAIN_DOUBLE_EVERY: 0.5, DRAIN_MAX: 400, DRAIN_TICK: 0.06,
  UNWRAP_T: 0.35, REARM_T: 1.0, CHECK_T: 1.0, LABEL_DIST: 200,
  // Upgrades (GDD 8.4)
  UPG_GROWTH: 1.6, UPG_ROUND: 5,
  // Cable car (GDD 8.2, 5.5, 5.12) — periods are dock-to-dock; the 'away' timer is period − (IN + DOCK + OUT)
  CAR_PERIOD_BY_LEVEL: [18, 21, 24, 25], CAR_PERIOD_NIGHT: 12, CAR_IN_T: 2.5, CAR_DOCK_T: 4, CAR_OUT_T: 2, CAR_WARN_T: 3,
  CAR_SECOND_AT: 13, CAR_RESUME_T: 0.5, CAR_FIRST_HOP_AT: 0.6, CAR_HOP_GAP: 0.3,
  DUCK_EVERY: 3, DUCK_EXTRA: 3, GOLDEN_EVERY: 5, GOLDEN_GUESTS: 2, GOLDEN_PATIENCE: 2, GOLDEN_PAY: 1.5, FULLCAR_BONUS: 2, FULLCAR_MIN: 4, CARLOG_SWEEP: 600,
  // Lantern Night (GDD 5.9) and fame (8.5, 5.13)
  NIGHT_FIRST: 240, NIGHT_EVERY: 180, NIGHT_T: 60, NIGHT_PAY: 1.2, NIGHT_TINT: 0.40, NIGHT_TINT_LOW: 0.30, NIGHT_FADE: 2,
  LANTERN_LIGHT: [1, 3], FAMOUS_PAY: [1, 1.25, 1.30, 1.35, 1.40, 1.45],            // FAMOUS_PAY[bridge level]
  // Helpers (GDD 5.3, 8.7)
  PON_SPEED: 70, PON_REST: 3, PON_CAP: 70, PON_SPEED_STEP: 0.15, PON_REST_STEP: 0.3, KERO_HOP_T: 0.5, KERO_HOP_LEN: 60, KERO_HOP_H: 26,
  // Camera and feel (GDD 11.6)
  CAM_FOLLOW: 6, CAM_LOOK: 20, CAM_KIT_FRAC: 0.55, SHAKE_DECAY_T: 0.3, SQUASH_X: 1.15, SQUASH_Y: 0.85, SQUASH_T: 0.2, FLASH_MAX: 0.35,
  // UI (GDD 10)
  JOY_R: 90, JOY_KNOB: 36, JOY_DEAD: 8, JOY_FULL: 0.7, JOY_ZONE: 0.30, JOY_FADE: 0.15, JOY_TRAIL: true, JOY_ALPHA_T: 0.1, TAP_MS: 250, TAP_PX: 12,
  SHEET_FRAC: 0.34, SHEET_MIN: 300, SHEET_SLIDE: 0.2, SHEET_CLOSE_DIST: 220, STATION_TAP_DIST: 160, PILL_DIST: 160, PILL_MIN_SHOW: 1.0, BUBBLE_DIST: 120,
  BANNER_T: 2.0, ARROW_IDLE: 2, ARROW_FLASH_T: 1.0, POP_T: 0.7, POP_RISE: 40, INTRO_T: 1.2, COIN_BOUNCE_T: 0.25, COIN_ROLL_T: 0.3,
  DRAG_HINT_AFTER: 2.5, DRAG_HINT_LOOP: 1.6, TAP_NUDGE_T: 0.3, MIN_FEATURE_PX: 4, MIN_TAP_PX: 56,
  // Save and offline (GDD 5.10, 8.9)
  SAVE_EVERY: 5, OFFLINE_MIN: 60, OFFLINE_CAP: 7200, OFFLINE_BASE: 0.10, OFFLINE_PON: 0.10, OFFLINE_KERO: 0.05,
  INCOME_BUCKET: 30, INCOME_BUCKETS: 6, RATE_CAP_PER_S: 20, RETURN_HEAT_PON: 70, RETURN_HEAT: 45,
  // FX caps and rates (GDD 11.5, 15)
  STEAM_CAP: 60, STEAM_CAP_LOW: 30, RIPPLE_CAP: 30, RIPPLE_CAP_LOW: 15, PARTICLE_CAP: 120, POP_CAP: 16, HALO_MAX: 8, HALO_MAX_LOW: 4,
  STEAM_RATE: 3, STEAM_RATE_RUSH: 8, STEAM_LIFE: 1.6, STEAM_RISE: 22, CONFETTI_SMALL: 12, CONFETTI_BIG: 40,
  // Audio (GDD 12)
  MASTER_GAIN: 0.5, MAX_VOICES: 6, SFX_MIN_GAP: 0.03, PAD_GAIN: 0.06, SHAKER_GAIN: 0.05, NIGHT_GAIN: 0.04, LAYER_FADE: 0.5,
  // Canvas and performance (§4.1, §18)
  DPR_CAP: 2, DPR_CAP_WIDE: 1.5, DPR_WIDE_PX: 900, LOWFX_MS: 22, LOWFX_WINDOW: 2, FRAME_MS_BUDGET: 12, STEP_MS_BUDGET: 2, MAX_DRAWABLES: 150, MAX_GUESTS: 48
};
```

`G.PAL` (`01_palette.js`) is the GDD 11.3 table as an object: `{ cedar:'#C98A5B', cedarDark:'#8F5B36', plank:'#B57A4E', stone:'#B9B3A6', stoneDark:'#7F796D', waterHot:'#2FA6A0', waterHotDeep:'#238C87', ripple:'#8EE3DC', waterCold:'#B7C2CC', waterYuzu:'#E9C46A', cream:'#F6F1E7', pine:'#3F7D5A', pineDark:'#2C5A40', moss:'#4E9A6C', amber:'#FFC857', amberDeep:'#FF9A2E', cta:'#E4572E', skyDay:'#CFEAF2', skyDusk:'#E7A5A0', skyNight:'#2B2F5B', coin:'#FFD24A', coinHi:'#FFF1B0', coinRim:'#C99400', yuzu:'#F5C400', yuzuLeaf:'#2C5A40', ink:'#1F2430', red:'#D93A3A', fox:'#F08A3E', foxDark:'#8F4A1F', capy:'#9C6B43', capySnout:'#6E4A2E', capyDark:'#7A5233', duck:'#FFFFFF', duckBeak:'#F28C28', duckLine:'#7F796D', tanuki:'#7D6B5A', tanukiMask:'#3B2F28', happi:'#5C6F8A', straw:'#D9B36A', frog:'#A8E063', frogDark:'#2C5A40', boiler:'#2A2A2E', boilerLight:'#3E3E44', mist:'#F6F1E7', shadow:'rgba(0,0,0,0.18)', lamp:'#6B5A4A', post:'#4A2E1F', cable:'#4A4A4A' }` plus two cached helpers: `G.PAL.rgba(hex, a)` (string builder memoised per (hex, a rounded to 1/64)) and `G.PAL.mix(hexA, hexB, t)` (memoised per 1/32 step).

---

## 9. Game systems — contracts

Every system: `init(S)` (called once by `G.Game.newGame` / after `G.Save.apply`), `update(S, dt)`, `collect(S, list)`. Signatures below are the **public interface**; anything not listed is private to the file. `→` marks return values.

### 9.0 Update order and who owns what

| Order | Module | Owns (writes) | Reads |
|---|---|---|---|
| 1 | `Input` | `Input.vec/mag/taps` | pointer/keys |
| 2 | `Player` | `S.kit` | solids from `built` and grove level, `Trail` count (sprint), `S.ui.arrow` (nudge) |
| 3 | `Trail` | `S.trail`, `S.trailMeta`, positions of `trail` guests | `S.kit.path`, `S.kit.stoppedT`, `S.trailCap` |
| 4 | `CableCar` | `S.car`, spawns guests | `Events.isGolden`, `night`, `Guests.countWaiting` |
| 5 | `Guests` | `S.guests` (all states except `trail` positions, `soak` timers) | lane data, platform, stall queue, `S.ui.arrow.rule` (cold patience) |
| 6 | `Baths` | `S.baths`, `S.splash`, `soak` guests, payouts | Kit position, trail, heat, night, fame |
| 7 | `Heat` | `S.heat` | built, baths occupied, trail logs, Kit position |
| 8 | `Grove` | `S.grove` | Kit position, trail room, baths' golden state, `Stall.room` |
| 9 | `Stall` | `S.stall`, `stall` guests | trail yuzu, Kit position |
| 10 | `Coins` | `S.coins`, `S.earned`, `S.income`, `S.trays`, koban arrays | Kit position |
| 11 | `Lanterns` | `S.lanterns`, `S.built`, `S.unwrapping`, `S.trailCap`, `S.car.level`, hires | Kit position, `S.coins` (spends via `Coins.spend`) |
| 12 | `Helpers` | `S.helpers` | heat, grove, stall |
| 13 | `Events` | `S.night`, `S.carLog` | bus events, lit lanterns, Kit position |
| 14 | `Hints` | `S.ui.arrow`, `S.tutorial` | everything (read-only) |
| 15 | `FX` | `S.fx`, `S.unwrapping` progress, `Loop.hitstop` (via subscribers) | bus events, `S.settings.shakeFlash` |
| 16 | `Camera` | camera | `S.kit`, `S.settings.shakeFlash` |
| 17 | `HUD`, `Sheet`, `Cards` | `S.ui` (then `Game.syncMode`) | everything (read-only) except `Upgrades.buy` and settings |
| 18 | `Save.tick` | `S.saveT`, `S.savedAt` | everything |

### 9.1 Player (`G.Player`)

```js
G.Player = { init(S), update(S, dt), collect(S, list), solids(S) → rect[], pose(S, name, seconds), speed(S) → px/s, squash(S) };
```
- Speed target = `C.KIT_SPEED × (S.trail.length === 0 ? C.KIT_SPRINT : 1)` (bridge/stretch upgrades multiply here). Input vector = `Input.vec`, except while `S.kit.nudgeT > 0` (set by `G.Game.nudge`), when it is the unit vector toward `S.ui.arrow` at `mag 1`. Velocity approaches `vec × speed` with `k = 1 − e^(−dt / C.KIT_ACCEL_T × 3)` (reaches ~95% in 0.12 s). `moving = |v| > 8`; `stoppedT` accumulates while not moving and resets to 0 when moving (Trail reads it for the stop-compress).
- Movement is axis-separated with collision: move x, resolve against solids, move y, resolve. Solids = `BOUNDS` + water rects of built baths + `STATIONS.boiler.solid` + `STATIONS.stall.solid` (if built) + tree trunks of active trees + pylon rects `(x−5..x+5, CABLE.pylonTop..CABLE.y)`; Kit is a circle of `C.KIT_RADIUS` at the feet. `solids(S)` is rebuilt on `Bus 'build'` and on `Bus 'upgrade'` where `id === 'grove' && key === 'slots'` (new trunks).
- Facing: `face = sign(vx)` when `|vx| > |vy|·0.5`; `dir = 'up'` when `vy < −8 && |vy| > |vx|`, `'down'` when `vy > 8 && |vy| > |vx|`, else `'side'`.
- Breadcrumb path: after moving, if `dist(kit, lastSample) ≥ C.TRAIL_SAMPLE` push a sample into the ring buffer (`head = (head+1) % cap`, `seg[head] = dist` — the length of the segment from the previous sample, never a cumulative sum, so float32 never drifts; `n = min(n+1, cap)`). `TRAIL_PATH_CAP` 400 × 4 px = 1,600 px of path, comfortably more than the longest trail (12 × 28 + 6 = 342 px).
- Dust: every `C.KIT_DUST_EVERY` while moving → `FX.puff(S, x, y, 'dust')`. Idle: `idleT` accumulates while not moving; at `C.KIT_IDLE_STRETCH` → `pose('stretch', 1.0)` and reset. `pose('pump', C.KIT_PUMP_T)` on `Bus 'splash'` with count ≥ 3.
- Squash: `sx, sy` return to 1 over `C.SQUASH_T`; `Player.squash(S)` sets `(C.SQUASH_X, C.SQUASH_Y)`.
- `collect` pushes Kit `{sortY: y + 0.5, draw: G.Player.draw}` (which calls `Art.Ch.kit`).

### 9.2 Trail (`G.Trail`)

```js
G.Trail = { init(S), update(S, dt), collect(S, list),
  full(S) → bool, count(S, kind?) → int, hasKind(S, kind) → bool,
  join(S, kind, ref, fromX, fromY) → node | null,      // appends; starts a hop from (fromX, fromY) to the tail target; sets ref.node; emits 'trail:join'
  takeFirst(S, kind) → node | null,                     // removes and returns the first node of that kind (any position); clears ref.node; relinks; emits 'trail:remove'
  removeNode(S, node),                                  // removes a specific node (impatient guest hopping out); clears ref.node
  tailPoint(S, out) };                                  // where the next node would sit (for hop targets)
```
- **Removal contract**: `takeFirst` and `removeNode` are the only functions that unlink a node. Baths (guests, yuzu), Heat (logs) and Stall (yuzu) use `takeFirst`; only `Guests.leaveImpatient` uses `removeNode`. Nobody removes a node twice; `Guests.seat` never touches the trail.
- Node gap by kind: guest → `DATA.GUESTS[kind].gap`, log → `C.TRAIL_GAP.log`, yuzu → `C.TRAIL_GAP.yuzu`. Node `i` targets path distance `D_i = (C.TRAIL_FIRST_GAP + gap_0 + … + gap_i) × trailMeta.compress` behind Kit (`node.dist`, recomputed on join/remove). `compress` eases toward `C.TRAIL_STOP_COMPRESS` while `S.kit.stoppedT > 0` and back to 1 while Kit moves, over `C.TRAIL_STOP_EASE` (the bunch-up).
- `targetPoint(S, D, out)`: walk the ring buffer back from `head` accumulating `seg` until the segment containing `D` is found, linear-interpolate; if the path is shorter than `D`, extend straight behind Kit: `out = kit − facingVector × (D − pathLen)` where the facing vector is Kit's last non-zero velocity direction (default (0, −1) at game start so the trail hangs below Kit toward the platform).
- Follow: `k = 1 − C.TRAIL_LERP_BASE ** (dt × 60)`; `node.x += (tx − node.x) k; node.y += (ty − node.y) k`. While `node.hop` is active the hop position overrides (hop target = the node's current target point, re-evaluated each frame so it lands on the moving tail).
- Bob: `node.bobPhase = C.TRAIL_BOB_PHASE × index`; draw offset `−C.TRAIL_BOB_AMP × |sin(C.TRAIL_BOB_W × S.t + bobPhase)|` while Kit is moving (ducks: frequency ×2). Logs bob, yuzu roll (`node.roll += moved / 8`).
- Guest nodes: `Trail.update` writes `guest.x/y/face` from the node every frame; `guest.state === 'trail'` and `guest.node === node`. Guests' patience is ticked by `Guests.update` — Trail only carries.
- `collect` pushes log/yuzu nodes (`draw: G.Trail.drawItem`); guest nodes are collected by `Guests` (they are in `S.guests`).

### 9.3 Cable car (`G.CableCar`)

```js
G.CableCar = { init(S), update(S, dt), collect(S, list),
  period(S) → seconds,                   // DOCK-TO-DOCK: night.active ? C.CAR_PERIOD_NIGHT : DATA.CAR.levels[S.car.level].period
  awayLen(S) → period(S) − (C.CAR_IN_T + C.CAR_DOCK_T + C.CAR_OUT_T),   // 9.5 s at level 0, 3.5 s at night, never below 0
  timeToDock(S) → seconds, ringFraction(S) → 0..1,
  planCar(S, index) → { kind: 'capy'|'duck', n, golden },   // pure: applies duck/golden/night/platform rules
  arrive(S), depart(S), onNight(S) };
```
- Phases: `away` (timer counts down; `Bus 'car:warn'` once when `timer + C.CAR_IN_T ≤ C.CAR_WARN_T`, i.e. 3 s before the dock; at 0 → `in`) → `in` (x lerps `enterX → dockX` over `C.CAR_IN_T` with pendulum `swing = 3° × sin(2 rad/s · t)` decaying) → `dock` (`arrive` on entry; `C.CAR_DOCK_T`; guests hop out one per `C.CAR_HOP_GAP` from the door `(x, CABLE.y + CABLE.doorDY)` **up** to a random mill point, `Guests.spawn`) → `out` (`dockX → exitX` over `C.CAR_OUT_T`) → `away` with `timer = max(0, awayLen(S))`; after car #1 the timer is `C.CAR_SECOND_AT − (C.CAR_DOCK_T + C.CAR_OUT_T + C.CAR_IN_T)` (= 4.5 s) so car #2 docks at t = 13.
- **New game**: `State.create()` puts car #1 in `dock` at `dockX` with `toSpawn 3`, `spawnT = C.CAR_FIRST_HOP_AT`, `index 1`, `carId 1`, no carLog (3 < `C.FULLCAR_MIN`). **After load**: `phase 'away', timer = C.CAR_RESUME_T` (the car starts sliding in 0.5 s after the game resumes and docks at 3 s).
- `timeToDock`: away → `timer + CAR_IN_T`; in → `CAR_IN_T − phaseT`; dock → `period − phaseT`; out → `period − CAR_DOCK_T − phaseT`. `ringFraction = clamp(1 − timeToDock / period, 0, 1)`.
- `planCar`: `n0 = levels[level].capys ± spread` (uniform int); golden = `C.GOLDEN_EVERY > 0 && index % C.GOLDEN_EVERY === 0` → `n = n0 × C.GOLDEN_GUESTS`, kind capy; else duck if `level ≥ 1 && !night.active && index % C.DUCK_EVERY === 0` → `n = levels[level].ducks`; `n = min(n, PLATFORM.cap − Guests.countWaiting(S))` (arrivals count). Car #1 is always 3 capys with infinite patience (`patienceMax = Infinity`) and the `C.TUTORIAL_SOAK` soak.
- `arrive`: increments `S.car.index` (car #1 is created already arrived), sets `carId = index`, plans; `n === 0` → `S.car.empty = true`, `Bus 'car:empty'`, **no carLog**; else `n ≥ C.FULLCAR_MIN` → `S.carLog[carId] = {n, seated:0, lost:false, gone:0, done:false, t: S.t}`; `Bus 'car:arrive' {index, golden, kind, n, empty}`. The cabin draws with 2-3 capy heads in the window while `toSpawn > 0`.
- `onNight` (called by `Events.startNight`): `if (phase === 'away') timer = min(timer, awayLen(S))` — the first night car docks within 6 s.
- `collect`: the cabin (`sortY = CABLE.sortY`) and the bell post with the countdown ring (`ringFraction`, r `BELL.ringR`); there is no HUD copy of the ring.

### 9.4 Guests (`G.Guests`) — state machine and lane routing

```js
G.Guests = { init(S), update(S, dt), collect(S, list), collectText(S, list), draw(ctx, g, S),
  spawn(S, kind, carId, golden, x0, y0) → guest,        // state 'arrive', hop up to a mill point
  route(from, to, out) → out,                            // pure: the lane rule below; `out` is a reusable array of {x, y}
  startWalk(S, g, tx, ty, nextState),                    // computes the route, sets state 'walk-ish' fields, faces the first segment
  waiting(S) → guest[]  (state 'wait' && want 'bath'),   // reused array
  nearestWaiting(S, x, y, maxDist) → guest | null,
  countWaiting(S) → int,                                 // states 'arrive' + 'wait' (so a car never overfills the platform)
  seat(S, g, bathId, slot, hop),                         // called by Baths.plop AFTER Trail.takeFirst: sets state 'soak', bathId, slot, hop; never touches the trail
  finishSoak(S, g, bath),                                // state 'pay': hop to bath.def.exit, payout via Baths.payout → Coins.burst into the bath's tray, then mochi roll or leave
  leaveImpatient(S, g),                                  // from 'wait' or 'trail' → 'leave'; emits 'guest:lost'
  remove(S, g) };                                        // → 'gone', frees the pool slot, emits 'guest:gone'
```

**Lane rule** (`route(from, to)`, the implementation of GDD 5.11):
```
pts = []
if (|from.x − LANE.cx| > LANE.snap) pts.push({ x: LANE.cx, y: from.y })   // 1. horizontal to the lane
pts.push({ x: LANE.cx, y: to.y })                                          // 2. vertical along the lane
pts.push({ x: to.x, y: to.y })                                             // 3. horizontal to the target
drop consecutive duplicates (distance < 1)
```
Walking: advance along `route[routeI]` at `g.walk` px/s; on reaching a waypoint (`dist < 2`) snap and `routeI++`; when past the last waypoint → `nextState`. Face = sign of the segment's dx (face is kept when dx = 0). Bob while walking: `bobPhase` advances at `walk / 30` rad/s.

Per-state behaviour:
- `arrive`: hop (`C.HOP_OUT_T`, apex 18) from the cabin door up to a random mill point; on landing → `wait` with `patience = patienceMax = patienceWait × (golden ? C.GOLDEN_PATIENCE : 1)`, `want = 'bath'`, squash, `Bus 'guest:spawn'`.
- `wait`: mill: every `U.rand(C.MILL_MIN, C.MILL_MAX)` s pick a random point in `PLATFORM.mill` and walk straight to it (no route). `patience −= dt` (always full speed on the platform); at 0 → `leaveImpatient`. Joining: once per step, if `S.t − S.trailMeta.joinT ≥ C.TRAIL_JOIN_GAP`, `Guests.update` checks `nearestWaiting(S, kit.x, kit.y, C.TRAIL_JOIN_R)` and calls `Trail.join(S, 'guest', g, g.x, g.y)` if not full → state `trail`, `patience = patienceMax = patienceTrail × golden`, `joinT = S.t`.
- `trail`: position from the node; `patience −= dt × mult` where `mult = C.COLD_PATIENCE_MULT` only while `S.heat.cold` and the active arrow rule is STOKE (`S.ui.arrow && (S.ui.arrow.rule === 3 || S.ui.arrow.rule === 5)`), else 1; sweat bubble when `patience / patienceMax < C.SWEAT_AT`; at 0 → `Trail.removeNode(S, g.node)` + `leaveImpatient`.
- `soak`: owned by `Baths` (timer, hearts, sleepy, shiver, hat). `Guests.update` only animates bob.
- `pay`: hop to `bath.def.exit` (`C.CLIMB_OUT_T`); on landing: `value = Baths.payout(S, g)`; `Coins.burst(S, value, g.x, g.y, bath.id)`; `Bus 'guest:paid' {g, value}`; `stats.served++` (`ducks++` for ducks). Then: if `built.stall && kind === 'capy' && U.rand() < C.STALL_WANT && Stall.queueFree(S) >= 0` → `want = 'mochi'`, `startWalk` to the reserved queue spot with `nextState 'stall'`; else `want = null`, `startWalk` to `PLATFORM.exit` with `nextState 'leave'`.
- `stall` (MVP Plus): stands at the spot with a mochi bubble; `queueT += dt`; sweat when `queueT > (1 − C.SWEAT_AT) × C.STALL_PATIENCE`; at `C.STALL_PATIENCE` → `Stall.release`, `Bus 'guest:bored'` (not counted as lost), `startWalk` to the exit, `leave`. `Stall.update` serves it otherwise (stock → pay → exit).
- `leave`: on reaching `PLATFORM.exit`: `waveT` counts `C.LEAVE_WAVE_T` (wave pose, alpha fades in the last 0.2 s) → `remove`.

`leaveImpatient`: sweat pop, `Bus 'guest:lost'`, `stats.lost++`, `startWalk` to the exit with `nextState 'leave'`; the guest never rejoins the platform pool. Guests in a bath never leave early.

`draw(ctx, g, S)` builds a pose object (§11.2) from the guest fields and calls `Art.Ch.guest`. Soaking guests are drawn by `Baths.drawGround` inside the water clip and are **not** collected here (`collect` skips `state === 'soak'`). `collectText` pushes the guest's bubble / sweat drop / heart for the world-text pass when the want is non-default, the guest is the arrow target, or it is within `C.BUBBLE_DIST` of Kit.

### 9.5 Baths (`G.Baths`) — seats, plops, Splash Chain, yuzu hats, payout

```js
G.Baths = { init(S), update(S, dt), collect(S, list), drawGround(ctx, S),
  list(S) → bath[] (built only), get(S, id) → bath,
  isWarm(S, bath) → bool,                                 // !def.heated || !S.heat.cold
  rushHere(S, bath) → bool,                               // S.heat.rush && bath.def.heated (the Rock Pool is never rushed)
  slotCount(S, bath) → int, freeSlots(S, bath) → int, freeSlot(S, bath) → index | -1, nextFreeIn(S, bath) → seconds | Infinity,
  slotPos(bath, i, n, out) → out,                         // world position of seat i of n (front/back rows)
  inZone(bath, x, y) → bool,                              // deck rect contains (x, y)
  soakTime(S, bath, guest) → seconds,                     // Upgrades.soak × guest soakMult (C.TUTORIAL_SOAK × soakMult for car #1)
  plop(S, bath, g, slot),                                 // starts the hop into the water; on landing → land()
  land(S, bath, g),                                       // chain logic, splash fx, seats the guest
  payout(S, g) → int,                                     // GDD 8.1 formula (below)
  applyYuzu(S, bath) → bool,                              // consumes one trail yuzu when allowed
  notGoldenCount(S) → int,                                // built baths with yuzuT ≤ 0 (the grove's pick cap)
  occupiedHeated(S) → bool };                             // any heated built bath has a soaking guest (for Heat)
```
- **Drop-off** (in `update`, once per step for the bath Kit stands on): if `inZone(bath, kit)`: (1) guests: if `isWarm` and `S.t − bath.lastPlop ≥ C.PLOP_GAP` and `freeSlot ≥ 0` and `Trail.hasKind(S, 'guest')` → `node = Trail.takeFirst(S, 'guest')` (the one and only removal), `plop(S, bath, node.ref, slot)`, `bath.lastPlop = S.t`; (2) yuzu: if `Trail.hasKind(S, 'yuzu')` and (`bath.yuzuT <= 0` or `bath.yuzuT < C.YUZU_REFRESH_BELOW`) → `applyYuzu`. Cold: guests stay in the trail; the bath shows the snowflake; `Bus 'ui:cold-refusal'` once per entry (shiver sfx).
- **plop**: `Guests.seat(S, g, bath.id, slot, hop)` with a hop of `C.PLOP_T` from the guest's current position to `slotPos`; the seat is reserved immediately (`slots[slot] = g`).
- **land** (on hop end): `sp = S.splash; if (S.t − sp.t ≤ C.SPLASH_WINDOW) sp.count++ else S.splash = sp = { count: 1, t: S.t, mult: 1, bathId: null }` (a **new object**, so earlier guests keep their own chain); `sp.t = S.t; sp.bathId = bath.id; sp.mult = C.SPLASH_MULT[min(sp.count, 5)]; g.batch = sp`; `g.soakMax = g.soakT = soakTime`; `g.yuzuHat = g.yuzuHat || bath.yuzuT > 0`; `Bus 'splash' {bath, g, count, mult}` (FX: ripple, 6 droplets, the combo pop anchored above this bath replacing the chain's previous pop, hit-stop at count 3 and 5; Camera: bump by count; Audio: splash + plink; Player: pump); `Bus 'guest:seated' {g, bath}`; stats: `combos[min(count,5)]++` when the count first reaches 3, 4 and 5 for this chain object.
- **Soak** (`update`, per soaking guest): if `isWarm`: `soakT −= dt × (rushHere ? C.RUSH_SOAK : 1)`; `Bus 'guest:heart'` every `C.HEART_EVERY` s (FX: heart + steam puff; Audio: sigh); `sleepy = 1 − soakT / soakMax`; ripple every `C.RIPPLE_EVERY`; else (cold): timer paused, `shiver = true`. At `soakT ≤ 0` → `slots[slot] = null`, `Guests.finishSoak(S, g, bath)`.
- **payout**: `ev = (g.batch ? g.batch.mult : 1) × max(g.yuzuHat ? C.YUZU_PAY : 1, g.golden ? C.GOLDEN_PAY : 1) × Heat.payMult(S, bath) × (S.night.active ? C.NIGHT_PAY : 1)`; `pay = round(base × Upgrades.payMult(S, bath.id) × Upgrades.famousMult(S) × min(C.MULT_CAP, ev))`, `base = DATA.GUESTS[g.kind].pay`. Evaluated at climb-out, so a rush that starts mid-soak counts; the hat is fixed when it is earned (landing in, or sitting in, golden water).
- **Yuzu**: `applyYuzu` → `Trail.takeFirst(S, 'yuzu')`, `bath.yuzuT = Upgrades.yuzuDur(S)`, every soaking guest `yuzuHat = true`, pop "YUZU BATH!", `Bus 'yuzu:apply'`. `yuzuT −= dt` in update; when it reaches 0 the water returns to normal but hats already given stay on.
- **slotPos**: `n ≤ 4` → one row at `water.y + 8`, x spread from `water.x − w/2 + C.SLOT_INSET` to `+ w/2 − C.SLOT_INSET` (single guest centred); `n > 4` → even seats on the front row (`y + 16`), odd seats on the back row (`y − 6`), each row spread across its own count with the back row inset 18 px more (up to 4 + 4 for 8 seats). Back row draws first.
- **drawGround**: for each built bath: water body (state colour: cold → `waterCold` with the frost dash, golden → `waterYuzu`, else `waterHot`), rim, shimmer, ripples, soak rings, then the soaking guests clipped to the water (`Art.Ch.guest` with `inWater`, sinking by `sleepy × 4`), then floating yuzu. `collect` pushes nothing for baths in MVP (deck plates are static, water is ground); the unwrap animation is drawn by `FX` over the finished structure.

---

### 9.6 Heat (`G.Heat`) — gauge, grace, woodpile, boiler, Steam Rush chains

```js
G.Heat = { init(S), update(S, dt), collect(S, list),
  unlocked(S) → bool (S.built.boiler), add(S, amount, by) → actual,   // clamps to max; emits 'heat:stoke' {by, amount}
  isCold(S) → bool, inRush(S) → bool,
  soakMult(S, bath) → 2 | 1, payMult(S, bath) → C.RUSH_PAY[min(chain, 2)] | 1,   // heated baths only; 1 for the Rock Pool
  canPick(S) → bool,                                                    // the woodpile hands out a log only while this is true
  drain(S) → units/s, startRush(S), endRush(S) };
```
- `update` (only when `unlocked`): `graceT = max(0, graceT − dt)`; `occupied = Baths.occupiedHeated(S)`; **if `graceT === 0`**: `v −= drain(S) × dt` where drain = `rush ? C.DRAIN_RUSH : occupied ? C.DRAIN_OCCUPIED : C.DRAIN_IDLE`; `v = clamp(v, 0, max)`; cold edge: `cold = v < C.HEAT_COLD` → on change emit `'heat:cold'` / `'heat:warm'`.
- `canPick`: `Trail.count(S, 'log') × Upgrades.stoke(S) < (S.heat.max − S.heat.v) + Upgrades.stoke(S)` — never more logs than fill the tank.
- **Woodpile pickup**: Kit within `STATIONS.woodpile.zone` of `(x, y)` and `!Trail.full` and `canPick` and `S.t − pickT ≥ C.TRAIL_LOG_EVERY` → `Trail.join(S, 'log', null, x, y − 20)`, `pickT = S.t`.
- **Stoke**: Kit within `STATIONS.boiler.zone` and `Trail.hasKind('log')` and `S.t − stokeT ≥ C.STOKE_GAP` → `Trail.takeFirst('log')` **always**; then `if (v < max) add(S, Upgrades.stoke(S), 'kit') else if (rush) rushT = max(0, rushT − C.RUSH_SURPLUS_T) /* +1 s of rush */ else /* wasted */ FX.puff(boiler door)`; `stokeT = S.t`.
- **Rush**: `if (!rush && v ≥ C.HEAT_RUSH) startRush`. `startRush`: `rush = true; rushT = 0; chain = 0; stats.rushes++; Bus 'heat:rush:start' {chain: 0}` (FX: wash, flash, hit-stop; Audio: whoosh + shaker; Camera: shake 8; HUD: ribbon; first time also the banner "STEAM RUSH" via `rushSeen`). `update`: `rushT += dt`; at `≥ C.RUSH_T` → if `v ≥ C.HEAT_RUSH` → `chain++`, `stats.chains++`, `rushT = 0`, pop "CHAIN x{chain+1}!", `Bus 'heat:rush:start' {chain}` again; else `endRush`: `rush = false; chain = 0; Bus 'heat:rush:end'`.
- Boiler build (`Lanterns.applyEffect`): `v = C.HEAT_START; graceT = C.HEAT_GRACE; ui.kettleSlide = 1`.
- `collect`: boiler glow window (`heat/max`) + chimney smoke rate ∝ heat as a sorted drawable at the boiler's footprint y; the boiler body and the woodpile are static-cache bodies (§10.2).

### 9.7 Grove and Stall (`G.Grove`, `G.Stall`)

```js
G.Grove = { init(S), update(S, dt), collect(S, list),
  trees(S) → tree[] (the first Upgrades.treeCount(S) slots), ripeCount(S) → int,
  nearestRipe(S, x, y) → tree | null,
  canPick(S) → bool,                                                   // Trail.count('yuzu') < Baths.notGoldenCount(S) + (built.stall && Stall.room(S) ? 1 : 0)
  pick(S, tree, by) → bool };                                          // by: 'kit' | 'kero'; emits 'yuzu:pick'
```
- `update` (when `built.grove`): each active tree `progress += dt / Upgrades.regrow(S)`; at 1 → `ripe = true`, `pulse` animates. Kit within `zone` of a ripe tree and `!Trail.full` and `canPick` → `pick(S, tree, 'kit')` → `Trail.join(S, 'yuzu', null, tree.x, tree.y − 40)`, `progress = 0; ripe = false`. Kero's picks ignore the trail cap (he carries his own) but obey `Stall.room`.
- Only one yuzu per tree at a time (GDD 5.4: a tree regrows *one* yuzu).

```js
G.Stall = { init(S), update(S, dt), collect(S, list),         // MVP Plus; all functions are safe no-ops when !S.built.stall
  room(S) → bool (stock + pending < Upgrades.counter(S)),
  deliver(S, by) → bool,                                       // consumes one yuzu from the trail (by 'kit') or from Kero (by 'kero'); pending++
  queueFree(S) → index | -1, reserve(S, g) → index, release(S, g), queued(S) → int,
  serve(S, g) };                                               // stock--, pay = round(Upgrades.mochiPay(S) × night × famous), Coins.burst into the stall tray, stats.mochi++
```
- `update`: prep: `if (pending > 0 && stock < counter) { prepT += dt; if (prepT ≥ Upgrades.prep(S)) { stock++; pending--; prepT = 0; } }`. Serving: the lowest-index queued guest whose `state === 'stall'` and has arrived at its spot is served when `stock > 0` (one per 0.3 s). Kit delivery: Kit within `STATIONS.stall.zone` and `Trail.hasKind('yuzu')` and `room` → `deliver(S, 'kit')`. Queue patience is ticked by `Guests` (`C.STALL_PATIENCE`, §9.4); a bored guest is released here.

### 9.8 Coins (`G.Coins`) — koban, trays, magnet, balance, income

```js
G.Coins = { init(S), update(S, dt), collect(S, list), drawGround(ctx, S),
  burst(S, value, fromX, fromY, trayId),         // GDD 8.8: min(value, 6) koban arc into the tray; values sum to value
  rain(S, value, x, y, source),                  // FULL CAR / lantern light: koban spawn already in 'magnet' state around (x, y)
  trayValue(S, id) → int, richestTray(S, x, y, maxDist, out) → out | null,   // out = {id, x, y, value}
  totalInTrays(S) → int,                         // saved as floorCoins
  add(S, value, source),                         // coins += value; earned += value; income bucket UNLESS source === 'offline'; Bus 'coins:add' {value, source}
  spend(S, value, what) → bool };                // false if insufficient; Bus 'coins:spend'
```
- **Burst** (target-first): `n = min(value, C.COINS_PER_PAY_MAX)`; `values[i] = floor(value / n) + (i < value % n ? 1 : 0)`; for each koban: `p = tray + randDisc(C.TRAY_SCATTER)`, `z = 20`, `vz = U.rand(C.COIN_VZ)`, `T = 2 vz / C.COIN_G`, `vx = (p.x − from.x) / T`, `vy = (p.y − from.y) / T`, clamp `|(vx, vy)| ≤ C.COIN_V_MAX`, `state 'air'`, `trayId`, `sortY = tray.y`.
- **Air**: `vz −= C.COIN_G dt; z += vz dt; x += vx dt; y += vy dt`; at `z ≤ 0`: `trays[trayId].value += value; trays[trayId].bounce = 1; Bus 'coins:land' {trayId}` (clinkSoft); free. A koban always ends in its tray; there is no ground state, no cap and no merge.
- **Magnet**: Kit within `C.TRAY_MAGNET_R` of a tray with `value > 0` → the tray empties into up to `C.COINS_PER_PAY_MAX` magnet koban (values summing to the tray value) that start at the tray; `t += dt / C.COIN_TO_KIT_T`; position = ease-in lerp from the start to Kit's current position; at `t ≥ 1` → `add(S, value, 'soak')`, `Bus 'coins:collect' {value, wx, wy}` (the HUD starts a screen flight from there), free. **The balance changes when the koban reaches Kit**; the HUD counter rolls up 0.35 s later (GDD 8.8).
- **Rain**: `value` split into ≤ 6 magnet koban placed on a 40 px ring around `(x, y)`; on arrival `add(S, v, source)`.
- **Income buckets**: `bucketT += dt; if (bucketT ≥ C.INCOME_BUCKET) { bucketT −= INCOME_BUCKET; head = (head + 1) % INCOME_BUCKETS; buckets[head] = 0 }`; `add` does `if (source !== 'offline') buckets[head] += value` — only in-play sources ('soak', 'mochi', 'fullcar', 'night') feed the rate window.
- `drawGround` draws the trays (plate, koban stack of `min(C.TRAY_STACK_MAX, ceil(value / 5))`, value badge when `≥ C.COIN_BADGE_MIN`, the landing bounce) and the shadows of airborne koban; `collect` pushes airborne and magnet koban (`sortY = tray y` / current y).

### 9.9 Lanterns and Upgrades (`G.Lanterns`, `G.Upgrades`)

```js
G.Lanterns = { init(S), update(S, dt), collect(S, list), collectText(S, list), drawGround(ctx, S),
  def(id) → lantern def, pos(id, out) → the STEP centre (stand point), postPos(id, out) → (x, y − C.POST_BACK),
  revealed(S, id) → bool,           // all requires satisfied
  maxed(S, id) → bool,              // level ≥ costs.length
  visible(S, id) → bool,            // revealed || level ≥ 1  → draw the post and lamp (lamp brightness = level ≥ 1 ? 1 : fill)
  active(S, id) → bool,             // revealed && !maxed    → draw the step, accept coins, count for the arrow
  remaining(S, id) → int | null,    // costs[level] − sunk, null when maxed
  affordable(S, id) → bool,         // active && S.coins ≥ remaining
  cheapestAffordable(S) → id | null, cheapestRevealed(S) → id | null,   // both over active lanterns
  light(S, id),                     // completes the current level: applyEffect, fx, Bus 'lantern:lit' {id, level}
  applyEffect(S, def, level, opts) };   // 'build:a,b,c' | 'trailCap:5,8,12' | 'carLevel:1,2,3' | 'hire:pon' | 'famous:1.25,…'; opts.silent = no fx, no bus (Save.apply)
```
- **Drain** (`update`, for the active lantern whose step contains Kit within `C.PAD_STAND_R` and whose `rearm ≤ 0`): `fx.standT += dt`; `rate = min(C.DRAIN_MAX, C.DRAIN_START × 2 ** (standT / C.DRAIN_DOUBLE_EVERY))`; `fx.acc += rate × dt`; `take = min(floor(acc), S.coins, remaining)`; if `take > 0`: `Coins.spend(S, take, id)`, `sunk += take`, `acc −= take`, `Bus 'lantern:progress' {id, fill: sunk / cost}`; while taking, every `C.DRAIN_TICK` → `Bus 'lantern:tick' {id, fill, fromX: kit.x, fromY: kit.y − 30}` (FX: a koban-toss particle from Kit into the saisen box; Audio: tick). **Partial drains are allowed** (progress persists). When Kit leaves the step `standT = 0`. Shortfall: while Kit stands on the step with `S.coins === 0 && remaining > 0`, `fx.short = remaining` (drawn continuously as the red label); on the transition into that condition `fx.wiggle = 1` and `Bus 'lantern:short'` (nope sfx), once per entry.
- **Light** (`sunk ≥ cost`): `level++`, `sunk = 0`, `fx.check = C.CHECK_T`, `fx.flash = 1`, `fx.rearm = C.REARM_T` (repeatable lanterns cannot drain while re-arming), `applyEffect(S, def, level)`, `Bus 'lantern:lit' {id, level}` (pop + puff + 12 confetti + bump 4 via FX/Camera subscribers; `tutorial` LIGHT completion is counted by Hints).
- **applyEffect**: `build:` → for each id: `S.built[id] = true`; unless silent: `S.unwrapping[id] = 0` (FX advances it to 1 over `C.UNWRAP_T` then deletes it), `Render.markStaticDirty()` (the structure is in the cache at once, under the wrap), `Bus 'build' {id}`; `boiler` build also sets `S.heat.v = C.HEAT_START`, `S.heat.graceT = C.HEAT_GRACE`, `S.ui.kettleSlide = 1` (silent: only `heat.max`). `trailCap:` → `S.trailCap = values[level − 1]`. `carLevel:` → `S.car.level = values[level − 1]`. `hire:` → `Helpers.hire(S, id, opts)`. `famous:` → nothing stored (`Upgrades.famousMult` reads the level); unless silent `Events.famous(S, level)`.
- `drawGround`: the offering steps of active lanterns (slab, rope, shide, saisen box, the 6 px fill arc, solid CTA outline pulsing when affordable / dashed grey when not); `collect`: the post + lamp + flame (`sortY = y − C.POST_BACK`) for `visible` lanterns; `collectText`: the cost / shortfall / ✓ pill 78 px above the step for the arrow's target and for lanterns within `C.LABEL_DIST` of Kit (others get a small coin glyph on the lamp).

```js
G.Upgrades = {
  level(S, id, key) → int, max(id, key) → int, visible(S, id, key) → bool,     // boiler 'pay' hidden until Pon is hired
  cost(S, id, key) → int | null,            // null when maxed; round5(base × C.UPG_GROWTH ** level)
  canBuy(S, id, key) → bool, buy(S, id, key) → bool,          // Coins.spend, level++, Bus 'upgrade' {id, key, level}
  cheapestAffordable(S) → { id, key, cost } | null,           // across built sheet stations
  cheapestAny(S) → { id, key, cost } | null,                  // across built sheet stations, affordable or not (the dim arrow's fallback)
  // derived values — the single source of truth for every upgradable number:
  soak(S, bathId) → def.soak − C.SOAK_STEP × lvl.speed,        slots(S, bathId) → def.slots + lvl.slots,
  payMult(S, bathId) → 1 + C.PAY_STEP × lvl.pay,
  stoke(S) → C.LOG_HEAT + C.STOKE_STEP × boiler.speed,         heatMax(S) → C.HEAT_MAX + C.TANK_STEP × boiler.slots,
  ponSpeed(S) → C.PON_SPEED × (1 + C.PON_SPEED_STEP × boiler.pay), ponRest(S) → C.PON_REST − C.PON_REST_STEP × boiler.pay,
  regrow(S) → C.REGROW − C.REGROW_STEP × grove.speed,           treeCount(S) → C.TREES_BASE + grove.slots,
  yuzuDur(S) → C.YUZU_DUR + C.YUZU_DUR_STEP × grove.pay,
  prep(S) → C.PREP − C.PREP_STEP × stall.speed,                  counter(S) → C.COUNTER_BASE + stall.slots,
  mochiPay(S) → C.MOCHI_PAY × (1 + C.PAY_STEP × stall.pay),
  famousMult(S) → C.FAMOUS_PAY[min(S.lanterns.bridge.level, C.FAMOUS_PAY.length − 1)],
  effectText(S, id, key) → 'Soak 8.0 s → 7.5 s'                  // for the sheet's title row
};
```
`round5(v) = Math.round(v / C.UPG_ROUND) × C.UPG_ROUND`. Buying `slots` on the boiler (`Tank`) also sets `S.heat.max = heatMax(S)`; buying `slots` on the grove (`Trees`) makes `Player` rebuild solids and `Render` rebuild the static cache (both subscribe to `'upgrade'`).

### 9.10 Helpers (`G.Helpers`)

```js
G.Helpers = { init(S), update(S, dt), collect(S, list), hire(S, id, opts) };   // hire: hired = true, position = home, Bus 'helper:hire' (not when opts.silent)
```
- **Pon** (`S.helpers.pon`, straight-line walker at `Upgrades.ponSpeed`): `rest` (at `home`; `t += dt`; `yawn` pose for the first `DATA.HELPERS.pon.yawn` s after a stoke; when `t ≥ Upgrades.ponRest(S) && S.heat.v < C.PON_CAP && S.built.woodpile` → `toWood`) → `toWood` (walk to `STATIONS.woodpile.home`) → `take` (`DATA.HELPERS.pon.take` s; `hasLog = true`) → `toBoiler` (walk to `STATIONS.boiler.home`) → `stoke` (`DATA.HELPERS.pon.stoke` s; `Heat.add(S, min(Upgrades.stoke(S), max(0, C.PON_CAP − v)), 'pon')` so he never pushes past 70 and never starts a rush; `hasLog = false`) → `rest` with `t = 0, yawn = yawn`.
- **Kero** (`S.helpers.kero`, hopper): `wait` (at `home`, faces the grove; when `S.built.stall && Stall.room(S) && Grove.ripeCount(S) > 0` → `toTree` with `tx,ty` = the nearest ripe tree) → hop chain: each hop is `{dur: C.KERO_HOP_T, len: C.KERO_HOP_LEN, h: C.KERO_HOP_H}` toward the target, squash on landing, `hop` sfx; the last hop is shortened to land exactly → `pick` (`DATA.HELPERS.kero.pick` s; `Grove.pick(S, tree, 'kero')`; `hasYuzu = true`) → `toStall` (hops to `STATIONS.stall.home`) → `deliver` (`Stall.deliver(S, 'kero')`; if the stall has no room he waits there holding the yuzu overhead, re-checking each step) → `wait`. If Kero holds a yuzu when the target tree is picked by Kit first, he simply re-targets.
- Helpers never collide and never use the lane rule (GDD 5.11 last sentence). `collect` pushes each hired helper (`sortY = y`).

### 9.11 Events (`G.Events`) — Lantern Night, lantern light, FULL CAR, Golden Car, Famous Inn / Season Fame

```js
G.Events = { init(S), update(S, dt), collect(S, list),
  isGolden(index) → bool,                      // C.GOLDEN_EVERY > 0 && index % C.GOLDEN_EVERY === 0
  startNight(S), endNight(S), nightPay(S) → 1.2 | 1,
  onSeated(S, g), onLost(S, g), onGone(S, g),  // FULL CAR bookkeeping on S.carLog (subscribed to 'guest:seated' / 'guest:lost' / 'guest:gone')
  famous(S, level) };
```
- **Night**: `if (!night.active && S.built.cedar && S.t ≥ night.next) startNight`: `active = true; t = 0; count++; lit = {}; stats.nights++; CableCar.onNight(S); Bus 'night:start'` (banner, chime, night music layer). `fade` moves toward 1 over `C.NIGHT_FADE` (used by the tint). `t ≥ C.NIGHT_T` → `endNight`: `active = false; next = S.t + C.NIGHT_EVERY; Bus 'night:end'`; `fade` moves toward 0.
- **Lantern light** (while `night.active`): for each lantern with `level ≥ 1` whose step is within `C.PAD_R` of Kit and not yet in `night.lit` → `Coins.rain(S, U.randInt(C.LANTERN_LIGHT), kit.x, kit.y, 'night')`, `night.lit[id] = true`, `Bus 'night:light' {id}` (sparkle).
- **FULL CAR**: `onSeated`: `log = carLog[g.carId]; if (!log) return` (cars smaller than `C.FULLCAR_MIN` and empty cars have no log); `log.seated++; if (log.seated === log.n && !log.lost && !log.done) { log.done = true; bonus = C.FULLCAR_BONUS × log.n; Coins.rain(S, bonus, kit.x, kit.y, 'fullcar'); stats.fullCars++; Bus 'fullcar' {carId, n: log.n, bonus} }` (banner "FULL CAR!", fanfare, 12 confetti). `onLost`: `log.lost = true`. `onGone`: `log.gone++`; delete the log when `gone === n`. `update` also sweeps any log with `S.t − log.t > C.CARLOG_SWEEP`, so no log can outlive 10 minutes.
- **Famous / Season Fame**: `famous(S, 1)` → `Bus 'famous'` (banner "FAMOUS INN!", fanfare, 40 confetti, the bridge sign appears, Kit's headband turns gold via `Art.Ch.kit` reading `S.lanterns.bridge.level ≥ 1`); `famous(S, level ≥ 2)` → `Bus 'fame' {level}` (banner "SEASON FAME", fanfare, 12 confetti). The multiplier itself is `Upgrades.famousMult`.
- Golden Car presentation (banner "GOLDEN CAR!", fanfare, `stats.golden++`) is triggered from `'car:arrive'` with `golden === true`.

### 9.12 Hints (`G.Hints`) — the next arrow and tutorial words

```js
G.Hints = { compute(S, out) → out | null,   // pure; out = { rule, kind, id, x, y, word, dim }
            update(S, dt), drawWorld(ctx, S) };
```
`compute` implements GDD 10.6 verbatim, first match wins:

| rule | condition | target | word |
|---|---|---|---|
| 1 | `Trail.hasKind('guest') && S.t − S.splash.t < C.SPLASH_WINDOW` and a built bath with `isWarm && freeSlot ≥ 0` exists | the nearest such bath (deck centre; hidden if it is the one Kit stands on) | SOAK |
| 2 | `Trail.hasKind('guest')` | the built warm bath maximising `min(freeSlots, Trail.count('guest'))`, ties by distance; if none has ≥ 3 free and the trail has ≥ 3 guests, or nothing is free → the bath with the smallest `nextFreeIn` | SOAK |
| 3 | `Trail.hasKind('log') && heat.v < heat.max && (heat.v < C.STOKE_HINT_BELOW || heat.cold)` | boiler (`STATIONS.boiler.home`) | STOKE |
| 4 | `Trail.hasKind('yuzu')` | nearest built bath with `yuzuT ≤ 0`; if none and `built.stall && Stall.room` → stall | YUZU |
| 5 | `built.boiler && heat.graceT === 0 && heat.v < C.STOKE_HINT_BELOW && !heat.rush` | woodpile | STOKE |
| 6 | `Lanterns.cheapestAffordable(S)` | that step | LIGHT |
| 7 | `Guests.countWaiting(S) > 0 && !Trail.full` | nearest waiting guest (the platform centre while they are still hopping out) | LEAD |
| 8 | `Coins.richestTray(S, kit, 400)` with value ≥ 5 | that tray | COLLECT |
| 3 again | `Trail.hasKind('log') && heat.v < heat.max` (logs carried while the boiler is warm) | boiler | STOKE |
| 9 | `built.stall && Stall.queued(S) > 0 && stall.stock + stall.pending === 0 && Grove.ripeCount > 0 && Grove.canPick(S)` | nearest ripe tree | YUZU |
| 10 | `S.lanterns.cedar.level ≥ 1 && Upgrades.cheapestAffordable(S)` | that station's footprint centre | TAP |
| 11 | `built.grove && Grove.ripeCount > 0 && Grove.canPick(S)` | nearest ripe tree | YUZU |
| 12 | `Lanterns.cheapestRevealed(S)`, else `Upgrades.cheapestAny(S)` | that step / station, `dim = true` | — |

`update`: `h = compute(S)`; if `h && h.rule !== S.ui.lastRule` (edge): `S.ui.lastRule = h.rule`; if `h.word && S.tutorial[h.word] < 2` → `S.tutorial[h.word]++` and `S.ui.arrow.showWord = true`, else `showWord = false`. `S.ui.arrow = h` (or null: only when everything is maxed). Idle emphasis: `S.ui.arrow.idle = S.kit.idleT ≥ C.ARROW_IDLE`. A far-tap (`HUD.farTap`) sets `S.ui.arrowFlash = {id, t}` and `drawWorld` points at that station at alpha 1 × 1.2 for `C.ARROW_FLASH_T` instead. TAP is also counted by `HUD` when the gated level pill shows "TAP" for ≥ `C.PILL_MIN_SHOW` s. `drawWorld` draws the arrow 46 px above Kit's head rotated toward `(x, y)`, bobbing 4 px at 3 Hz, alpha 0.7 (1.0 and ×1.2 when idle, 0.45 when dim), and the word 22 px above it (`Art.S.text`, 34 px, CTA with a 4 px cream stroke).

The headless bot (§17.3) uses `compute` as its brain and buys the upgrade rule 10 points at; rule 12 must always produce a target after the first lantern is revealed so the bot never idles forever. `Hints.compute` returning rule 12 against WP0's stubs is WP0's acceptance test.

---

## 10. Render pipeline (`G.Render`)

```js
G.Render = { init(S), onResize(), frame(S, ctx), rebuildStatic(S), markStaticDirty(),
  list: [], textList: [], staticCanvas, staticDirty: true, sdpr: 1, haloSprite: null };
```

### 10.1 Frame order (GDD 11.4 made concrete)

```
Canvas.begin()                                   // save, bar-only ink fill, logical transform, clip
Camera.apply(ctx)
  1. static cache slice:   ctx.drawImage(staticCanvas, 0, (cam.y − STATIC_Y0) * sdpr, 540 * sdpr, H * sdpr,  0, cam.y, 540, H)   // 1:1 blit
  2. ground pass:          Lanterns.drawGround → Baths.drawGround → Coins.drawGround (trays) → FX.drawGround (dust)
  3. sorted pass:          list.length = 0; every system's collect(S, list) (FX.collect adds structures mid-unwrap); list.sort(byY); for each: d.draw(ctx, d, S)
  4. FX pass:              FX.drawWorld: steam, splash droplets, puffs, confetti, koban tosses (world space); mist gradient over MIST y0..y1
  5. night tint:           if (night.fade > 0) { ctx.globalCompositeOperation = 'multiply'; fillStyle = PAL.rgba(skyNight, (lowFx ? C.NIGHT_TINT_LOW : C.NIGHT_TINT) * fade); fillRect(0, cam.y, 540, H) }
     halos:                if (night.fade > 0 || heat.rush) { 'lighter': haloSprite blits for lit lanterns (≤ HALO_MAX, or HALO_MAX_LOW in low-fx, brightest first, culled to the slice), boiler glow, golden baths; stone lanterns at night as plain tinted circles }
                           ctx.globalCompositeOperation = 'source-over'
  6. world text:           textList.length = 0; Guests.collectText → Lanterns.collectText → HUD.collectWorld (level pill, chevron); draw them; FX pops ("+N", "SPLASH x3!", "YUZU BATH!", "CHAIN x2!"); Hints.drawWorld (arrow + word)
Camera.unapply(ctx)
  7. screen:               HUD.draw (pill, coin flights, pips, kettle, banner), Sheet.draw, Cards.draw, HUD.drawJoystick (+ drag hint), flash (white rect, alpha ≤ C.FLASH_MAX), debug overlay
Canvas.end()                                     // restore
```

`byY(a, b) = a.sortY − b.sortY`. `list` is reused; systems push existing objects. Off-screen culling: every `collect` skips objects with `y < cam.y − 120 || y > cam.y + H + 60`; the ground pass culls per structure. Nothing in this pipeline calls `U.rand` (§0 rule 9).

### 10.2 Static cache

An offscreen canvas of `540 × (MAP.H − MAP.STATIC_Y0)` = 540 × 1300 logical px at `sdpr = round(dpr × scale × 8) / 8` device scale (so a slice blits 1:1 without resampling; ≈ 3.5 MB at sdpr 1.33, 11 MB at 2). Contents, in order: `Art.W.terrain` (moss base, darker patches) including `Art.W.valley` (cliff edge, pine tips, mist gradient below y 2200), `Art.W.lane`, `Art.W.rocks`, `Art.W.pines`, `Art.W.stoneLanterns` (unlit body only), `Art.W.platform` (plate + railing), `Art.W.cable` (line + pylons), `Art.W.bridge` (planks), then for each **built** structure its static body: bath deck plates (`Art.W.deckPlate`), woodpile (`Art.W.woodpile`), stall counter + awning (`Art.W.stallBody`), tree trunks + canopies (`Art.W.treeBody`), and the boiler body (`Art.W.boilerBody`; the glow window is drawn dynamically on top). A structure enters the cache the moment it is built; the unwrap strips are drawn over it by `FX`. Rebuilt on `init`, on `onResize` (sdpr change) and when `staticDirty` is set (`'build'`, the Trees upgrade, low-fx toggle). Rebuild cost is one-off (~5 ms); never rebuild per frame.

Dynamic parts that draw every frame over the cache: water bodies, offering steps, lantern posts/lamps/flames, trays, boiler glow + smoke, ripe yuzu on trees, stall mochi and progress ring, bell post ring, cable car, unwrap strips.

### 10.3 Halo sprite and low-effects mode

`Render.init` renders **one** halo sprite: a 192 × 192 offscreen canvas at sdpr with a radial gradient amber → transparent. Every halo is `Art.FX.halo(ctx, sprite, x, y, r, alpha)` = one `drawImage` scaled to `2r × 2r` under `globalAlpha`; no gradient is ever created at draw time. In low-effects mode (`S.settings.lowFx`): tint `C.NIGHT_TINT_LOW`, halos ≤ `C.HALO_MAX_LOW`, water shimmer off, steam cap 30, ripple cap 15, confetti halved, and `Art.Ch` switches to its sprite cache (§11.2).

---

## 11. Procedural art API (`G.Art`)

All art functions are **pure**: `(ctx, …data)` in, pixels out, no state mutation, no allocation beyond locals, no `U.rand`. Local space per GDD 11.5: feet at `(0, 0)`, +y down, `face` = ±1 mirrors. Every drawer that takes a pose applies `ctx.translate(x, y); ctx.scale(face * sx, sy)` itself and restores. Recipes (shapes, sizes, colours) are the GDD 11.5 text; this section fixes the **signatures**.

### 11.1 Shapes (`G.Art.S`)

```js
G.Art.S = {
  rrect(ctx, x, y, w, h, r),                                // path only (arcTo-based; do not use ctx.roundRect)
  fillRRect(ctx, x, y, w, h, r, color), strokeRRect(ctx, x, y, w, h, r, color, lw, dash),
  plate(ctx, x, y, w, h, r, top, side, thick),              // paper-cutout plate: side band `thick` px below, top on top
  shadow(ctx, x, y, rx, ry, alpha = 0.18),                  // ground ellipse
  ellipse(ctx, x, y, rx, ry, color), circle(ctx, x, y, r, color), tri(ctx, x1, y1, x2, y2, x3, y3, color),
  ring(ctx, x, y, r, frac, lw, color, bg),                  // progress ring / arc, clockwise from 12 o'clock
  text(ctx, str, x, y, size, color, opts),                  // opts: { align: 'center', base: 'middle', stroke: null, lw: 3, weight: 700, alpha }  — stroke is OFF by default
  pill(ctx, x, y, w, h, str, size, fill, color, icon),      // cream pill with unstroked text (+ optional icon): the only way labels, costs and level pills are drawn
  bubble(ctx, x, y, w, h, tail),                            // rounded speech bubble with a tail at the bottom-left
  icon(ctx, name, x, y, size),                              // 'bath' | 'mochi' | 'snow' | 'sweat' | 'heart' | 'koban' | 'bell' | 'kettle' | 'gear' | 'log' | 'yuzu' | 'check' | 'x' | 'lock' | 'flame' | 'wisp' | 'chevron' | 'lantern' | 'pon' | 'kero'
  fmtCoins(n) → '12.3k'                                     // abbreviates ≥ 10 000
};
```
Font: `G.Art.FONT = '700 {size}px "Arial Rounded MT Bold","Trebuchet MS","Segoe UI",Roboto,sans-serif'`; `text` builds the string from a cache keyed by size (`FONT_CACHE[size]`). Stroked text is reserved for pops, the arrow word and banners (§18 rule 7).

### 11.2 Characters (`G.Art.Ch`)

```js
pose = { x, y, face: 1 | -1, dir: 'down' | 'up' | 'side', walk: 0..1 (cycle), moving: bool, sx, sy, alpha: 1,
         inWater: null | { x, y, w, h },      // clip rect; the drawer translates +8 y and shows the top 60 %
         sink: 0..4,                          // extra px down while soaking (sleepy × 4)
         hat: null | 'yuzu', carry: null | 'log' | 'yuzu',
         bubble: null | 'bath' | 'mochi' | 'snow' | 'sweat' | 'heart', bubbleScale: 1,
         shiver: bool, lid: 0..3 (sleepy steps), tint: null | { color, alpha },
         pose: null | 'pump' | 'stretch' | 'wave' | 'yawn', poseT: 0..1, ring: null | 0..1 (soak ring), t };
G.Art.Ch = { kit(ctx, p, S), capy(ctx, p), duck(ctx, p), pon(ctx, p), kero(ctx, p), guest(ctx, p, kind), bubble(ctx, p),
             silhouette(ctx, kind, x, y, scale),          // flat-ink render for the smoke page's silhouette row
             spriteCache: { build(sdpr), enabled: false } }; // optional: guest kinds × 2 walk frames × (normal, sleepy, hat) on one offscreen sheet; guest() blits it with the pose transform when enabled (low-fx)
```
`kit` reads `S.lanterns.bridge.level` for the gold headband. `guest` dispatches on `kind`. Callers fill a shared module-level pose object (no allocation): `G.Art.Ch.POSE`.

### 11.3 World (`G.Art.W`)

```js
G.Art.W = {
  terrain(ctx, y0, y1), valley(ctx), lane(ctx), rocks(ctx), pines(ctx), stoneLanterns(ctx, lit), platform(ctx), cable(ctx), bridge(ctx), mist(ctx, camY, H),
  deckPlate(ctx, bathDef), water(ctx, bathDef, state, t),        // state: { cold, yuzu, shimmerT }
  ripple(ctx, x, y, r, alpha), soakRing(ctx, x, y, frac), floatingYuzu(ctx, bathDef, t),
  step(ctx, x, y, fill, affordable, t),                            // the offering step: slab, rope, shide, saisen box, fill arc, solid/dashed outline
  lantern(ctx, x, y, fill, lit, t),                                // post + lamp + flame, drawn at postPos
  tray(ctx, x, y, value, bounce),
  boilerBody(ctx, x, y), boilerGlow(ctx, x, y, frac, rush, t), woodpile(ctx, x, y),
  treeBody(ctx, x, y), treeFruit(ctx, x, y, progress, ripe, t),
  stallBody(ctx, x, y), stallTop(ctx, x, y, stock, prepFrac),
  bellPost(ctx, x, y, frac, pulse), cableCar(ctx, x, swing, golden, heads),   // r 26 ring; cabin per GDD 11.5 (cable y 2120)
  unwrap(ctx, id, S, frac)                                         // the four paper strips over a built structure, frac 0..1
};
```

### 11.4 FX (`G.Art.FX`)

```js
G.Art.FX = { steam(ctx, p), ripple(ctx, r), part(ctx, p), pop(ctx, p), koban(ctx, c, z), kobanShadow(ctx, c),
             halo(ctx, sprite, x, y, r, alpha), wash(ctx, p), arrow(ctx, x, y, angle, alpha, scale), dragHint(ctx, x, y, dx, dy, alpha) };
```
`part` draws by `kind`: `'dust' | 'puff' | 'confetti' | 'drop' | 'heart' | 'sparkle' | 'koban' (offering toss) | 'strip' (unwrap)`. `halo` is a sprite blit (§10.3); nothing here creates gradients.

---

## 12. Pools and particle budget

| Pool | Cap (low-fx) | Spawned by |
|---|---|---|
| steam | 60 (30) | baths (3/s per hot occupied bath, 8/s in rush), soaking hearts (1 puff each), boiler chimney (1/s × heat frac), rush wash (20 once) |
| ripples | 30 (15) | plops (1 per plop), soaking guests (every 0.9 s), yuzu apply (3 gold rings) |
| parts | 120 | dust (Kit 8/s moving), puffs (12 per build), confetti (12 per unlock / FULL CAR / fame, 40 Famous), droplets (6 per plop), hearts (1 per 3 s per soaker), sparkles (3 per yuzu, 3 per lantern light), koban tosses (1 per drain tick), strips (4 per unwrap) |
| pops | 16 | "+N" per burst (one per payout, not per koban), chain texts (one live per chain), YUZU BATH!, CHAIN xN!, lantern ✓, FULL CAR! |
| koban | 40 | bursts (≤ 6 per payout), tray magnets (≤ 6 per tray), rain (≤ 6) |
| HUD flights | 40 (HUD-owned) | one per `coins:collect`, 20 for the offline COLLECT |
| guests | 48 | cable car (platform cap 12 + soaking + walking) |

If a pool is full the spawn is dropped silently. Confetti and droplets are 2 px rects / circles with gravity; nothing uses `shadowBlur` or `filter`.

---

## 13. UI layer (`G.HUD`, `G.Sheet`, `G.Cards`)

Everything is canvas-drawn in logical screen space. Safe-area: HUD top elements use `Canvas.st`; the sheet and joystick hint respect `Canvas.sb`. Layout rects are computed once per resize by `HUD.layout()` and stored in `HUD.R` (`coinPill`, `pips`, `kettle`, `kettleBar`, `ribbon`, `gear`, `gearHit`, `banner`, `dragHint`) with the exact GDD 10.2 numbers; every tap rect is at least `C.MIN_TAP_PX` square.

```js
G.HUD = { R: {}, fly: pool(C.HUD_FLY_POOL), layout(), update(S, dt), draw(ctx, S), drawJoystick(ctx, S), collectWorld(S, list),
  farTap(S, id), tapGear(S, x, y) → bool, banner(S, text), levelPillFor(S) → { id, x, y, text } | null };
```
- Coin pill: shows `S.ui.coinShown` rolling toward `S.coins − (value still in flight)` over `C.COIN_ROLL_T`, so the number rolls up when a flight lands; scale `1 + 0.25 × coinBounce` where `coinBounce` decays over `C.COIN_BOUNCE_T` and is set to 1 by a landing flight. **Flights**: `'coins:collect' {value, wx, wy}` → a flight from `Camera.toScreen(wx, wy)` to the pill's koban icon over `C.COIN_TO_HUD_T` (ease-in-out); on arrival `Bus 'hud:coin-land' {value}` (Audio clink ladder). Flights keep animating during hit-stop and cards (wall-clock `dt`).
- Trail pips: `S.trailCap` dots r 6 spaced 15; filled amber, empty 30% ink; pulse when full.
- Kettle: visible when `S.built.boiler` (slides in over 0.4 s via `ui.kettleSlide`); bar 100 × 18 with a 3 px ink outline = `heat.v / heat.max`; threshold ticks with the snow / wisp glyphs at 30% and 80%; frost hatch + 2 Hz flash when `heat.cold`; three animated wisps + gold pulse when `v ≥ 80`; ribbon "STEAM RUSH" with the chain count while `heat.rush` (`ui.ribbon` eases 0..1).
- Banner: `ui.banner = { text, t }`; slide in 0.3 s, hold 1.4 s, out 0.3 s; a new banner replaces the current one; the level pill and lantern pills are suppressed while it is up.
- Level pill (world-anchored via `collectWorld`): `levelPillFor` = nearest built sheet station within `C.PILL_DIST`; 68 × 28, text `Lv {sum of levels}`. It shows `TAP` only when `!(S.ui.arrow && S.ui.arrow.showWord) && S.lanterns.cedar.level ≥ 1 && Upgrades.cheapestAffordable(S)?.id === id && S.tutorial.TAP < 2`; `ui.pillT` accumulates while it is visible and `S.tutorial.TAP++` fires once it has been visible for `C.PILL_MIN_SHOW` s. `farTap(S, id)` sets the pill's bounce, `S.ui.arrowFlash = { id, t: C.ARROW_FLASH_T }` and emits `'ui:pip'`.
- Upgrade chevron (world-anchored): `ui.chevron = Upgrades.cheapestAffordable(S)?.id`; a 28 px CTA chevron bouncing 6 px at 2 Hz above that station; one at a time.
- Drag hint: `ui.dragHint = S.tutorial.DRAG === 0 && S.car.index === 1 && S.t ≥ C.CAR_FIRST_HOP_AT + C.DRAG_HINT_AFTER && Input.lastStickT < 0`; drawn by `drawJoystick` as the ghost thumb sliding toward the arrow's direction, looping every `C.DRAG_HINT_LOOP`; the first stick move sets `S.tutorial.DRAG = 1` (persisted).
- Joystick: drawn from `Input.stick` (trailing base r 90 ring 4 px cream 12 %, knob r 36 cream 55 %, alpha from `stick.alpha`).
- Debug overlay (`ui.debug`): fps, frame ms, step ms, guests, koban, list length, heat, mode, car phase/timer, income rate; turns red when a §18 budget is exceeded.

```js
G.Sheet = { open(S, id), close(S), isOpen(S) → bool, top(S) → y, update(S, dt), draw(ctx, S), tap(S, x, y) → bool, stationAt(S, wx, wy) → id | null };
```
- `open`: `S.ui.sheet = { id, y: Canvas.H, openX: kit.x, openY: kit.y, last: null }`; `G.Game.syncMode(S)`; `Bus 'ui:sheet:open'`. `top = H − max(C.SHEET_MIN, C.SHEET_FRAC × H)` (plus `Canvas.sb` inside the panel padding). `update`: `y` eases toward `top` over `C.SHEET_SLIDE`; auto-close when `dist(kit, open) > C.SHEET_CLOSE_DIST` or the station is no longer built.
- Layout (GDD 10.4): title at `(24, top + 22)` with `Upgrades.effectText` for `sheet.last` at 18 px to its right, X drawn `48 × 48` at `(540 − 64, top + 8)` with a `60 × 60` hit rect, three buttons `150 × 112` at `y = top + 70`, `x = 20 / 195 / 370` for keys `speed / slots / pay` in that order. Button content from `DATA.UPGRADES[id][key].label` (22 px), level pips (`max` small rects), cost pill (`Upgrades.cost`, 24 px); states: affordable (CTA pill), unaffordable (grey pill, red number, lock glyph; tap → wiggle + `'ui:nope'`), maxed (green MAX + check glyph), hidden (`visible` false → grey lock pill with the label).
- `tap`: X or outside → `close` (consumed); button → `sheet.last = key`, `Upgrades.buy` → `'upgrade'` (pop, pip fill, station squash via `S.ui.squash[id] = 1`) or `'ui:nope'`. `close`: `S.ui.sheet = null; syncMode`.
- The joystick keeps working while open: pointers starting above `top` become the stick, and a pointer that starts on the sheet and moves more than `C.TAP_PX` becomes the stick too (§5).

```js
G.Cards = { showOffline(S, info), showReset(S), toggleSettings(S), update(S, dt), draw(ctx, S), tap(S, x, y) → bool, drawIntro(ctx, S) };
```
- Offline card (GDD 10.7): `S.ui.card = { kind: 'offline', info, t }`, `syncMode`; COLLECT → `Coins.add(S, info.coins + info.floorCoins, 'offline')` (never feeds the income buckets) shown as 20 HUD flights into the counter, card slides down, `ui.card = null`, `syncMode`.
- Reset confirm: KEEP / RESET; RESET → `Save.clear()`, `G.Game.newGame()`.
- Settings popover (`S.ui.settings = true`, `syncMode`; 260 × 220 under the gear, 56 px rows): Sound / Haptics / Shake & flash / Low effects, a 12 px gap, Reset save; plus `G.VERSION`. Toggling sound calls `Audio.setEnabled`; "Shake & flash" writes `S.settings.shakeFlash` (read by FX hit-stop, Camera and the flash).
- Intro: `drawIntro` draws the cream-to-scene fade (`1 − introT / C.INTRO_T` alpha cream over the world); the bell post swings silently; a tap ends the intro early.

---

## 14. Audio (`G.Audio`)

```js
G.Audio = { ctx: null, enabled: true, unlocked: false,
  init(S), unlock(),                       // creates/resumes the AudioContext on the first gesture; starts the pad layer; plays the first `bell`
  setEnabled(S, on), play(name, opts),     // opts: { pitch: 1, gain: 1, semis: 0 }; ignored (dropped, not queued) when !enabled or !unlocked
  layer(name, on),                         // 'shaker' | 'night' — fades over C.LAYER_FADE
  haptic(S, ms) };                         // navigator.vibrate when settings.haptics (auto → touch device) and supported
```
- SFX recipes are the GDD §12 table, implemented as `RECIPES[name] = function (ac, dest, t0, o)` using two helpers: `tone(ac, dest, type, f0, f1, dur, gain, t0)` (oscillator with exponential frequency ramp and an ADSR gain envelope) and `noise(ac, dest, dur, filterType, freq, gain, t0)` (a 1-second white-noise buffer built once, played through a BiquadFilter). Names: `boing blip quack splash plink clink clinkSoft tick pop pip nope bell dingding whoosh stoke sigh shiver yuzu hop puff fanfare chime`.
- Voice management: at most `C.MAX_VOICES` recipes in flight (a counter decremented by each recipe's `onended`); the same name at most once per `C.SFX_MIN_GAP` (`lastPlayed[name]`); master gain `C.MASTER_GAIN`; `plink` steps are chosen by the caller (`semis` from the chain count, capped at 5); `clink` uses `semis` from the burst counter (`n` rises per landed flight, resets after `C.CLINK_RESET` s without one, max `C.CLINK_MAX`); `clinkSoft` is throttled to one per 60 ms; `tick` pitch from `opts.pitch = 1 + fill`.
- Music layers: `pad` (two detuned triangles A2/E3 → lowpass 600 Hz with a 0.1 Hz LFO, gain `C.PAD_GAIN`), `shaker` (highpassed noise bursts, 8ths at 100 BPM, gain `C.SHAKER_GAIN`, on during rush), `night` (sine 220 Hz + fifth, gain `C.NIGHT_GAIN`, on during Lantern Night). Layers are GainNodes ramped with `setTargetAtTime`.
- Event wiring (`Audio.init` subscribes on the bus, §16): `trail:join → blip (semis = index) (+ quack for ducks)`, `splash → splash + plink (semis by count) (+ quack for ducks)`, `hud:coin-land → clink (ladder)`, `coins:land → clinkSoft`, `lantern:tick → tick`, `lantern:lit / build / upgrade → pop`, `upgrade / ui:pip → pip`, `ui:nope / lantern:short → nope`, `car:warn → dingding`, `car:arrive → bell (+ fanfare if golden)`, `guest:spawn → boing`, `heat:rush:start → whoosh + layer shaker`, `heat:rush:end → layer off`, `heat:stoke → stoke`, `heat:cold → shiver`, `yuzu:apply / yuzu:pick / night:light → yuzu`, `helper:hop → hop`, `fullcar / famous / fame → fanfare`, `night:start → chime + layer night`, `night:end → layer off`, `guest:heart → sigh`, `helper:hire → pop`.
- Headless: `Audio.init` returns immediately when `typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined'`; every public function is a safe no-op afterwards.

---

## 15. Save format and offline earnings (`G.Save`)

```js
G.Save = { KEY: 'capysprings.save', VERSION: 2,
  serialize(S) → obj, apply(S, obj) → S,      // apply mutates a fresh S = State.create() with the persisted subset, RE-DERIVES every D field of §6, and returns S
  write(S) → bool, read() → obj | null,       // read validates shape and version; returns null on any problem (→ new game)
  clear(), tick(S, dt),                       // autosave every C.SAVE_EVERY s of play; also called on visibilitychange/pagehide
  rate(income) → coins/s,                     // median of the six buckets ÷ C.INCOME_BUCKET, capped at C.RATE_CAP_PER_S
  offline(obj, nowMs) → { away, cars, coins, floorCoins, show },        // cold load (§15.4)
  offlineLive(S, nowMs) → { away, cars, coins, floorCoins: 0, show } };  // a still-open tab returning (§3); same formula from S.income, no tray coins
```

### 15.1 JSON on disk (`localStorage['capysprings.save']`)

Only **causes** are persisted. `built`, `trailCap`, `car.level`, `helpers.*.hired`, fame and `heat.max` are never written; `apply` re-derives them from `lanterns` and `levels`, so a partial write or a hand edit can never desync them.

```json
{ "v": 2, "savedAt": 1757600000000, "t": 812.3, "coins": 120, "earned": 940,
  "income": { "buckets": [30, 44, 52, 38, 61, 55], "head": 2, "bucketT": 12.4 },
  "car": { "index": 33 },
  "lanterns": { "cedar": { "sunk": 0, "level": 1 }, "trail": { "sunk": 40, "level": 1 }, "grove": { "sunk": 0, "level": 1 },
                "car": { "sunk": 0, "level": 1 }, "pon": { "sunk": 0, "level": 1 }, "stall": { "sunk": 0, "level": 0 },
                "kero": { "sunk": 0, "level": 0 }, "bamboo": { "sunk": 0, "level": 0 }, "bridge": { "sunk": 0, "level": 0 } },
  "levels": { "rock": { "speed": 1, "slots": 0, "pay": 0 }, "cedar": { "speed": 0, "slots": 0, "pay": 0 }, "bamboo": { "speed": 0, "slots": 0, "pay": 0 },
              "boiler": { "speed": 0, "slots": 0, "pay": 0 }, "grove": { "speed": 0, "slots": 0, "pay": 0 }, "stall": { "speed": 0, "slots": 0, "pay": 0 } },
  "heat": { "v": 54, "rushSeen": true },
  "kit": { "x": 260, "y": 1900 },
  "baths": { "rock": { "yuzuT": 0 }, "cedar": { "yuzuT": 4.5 }, "bamboo": { "yuzuT": 0 } },
  "grove": { "trees": [ { "progress": 0.4, "ripe": false }, { "progress": 1, "ripe": true } ] },
  "stall": { "stock": 0, "pending": 0 },
  "night": { "next": 420, "count": 1 },
  "tutorial": { "LEAD": 2, "SOAK": 2, "COLLECT": 2, "LIGHT": 2, "STOKE": 1, "YUZU": 1, "TAP": 2, "DRAG": 1 },
  "stats": { "served": 61, "ducks": 0, "combos": [0, 0, 0, 9, 2, 0], "rushes": 3, "chains": 1, "fullCars": 4, "nights": 1, "golden": 1, "mochi": 0, "lost": 2 },
  "settings": { "sound": true, "haptics": null, "shakeFlash": true, "lowFx": false },
  "floorCoins": 12 }
```

`floorCoins` = `Coins.totalInTrays(S)` at save time (koban in the air count as landed); trays are empty on load and the value is added to the balance on the offline card ("Pon tidied up N coins" / "you left N coins in the trays") or silently when no card is shown.

### 15.2 Versioning

`read()`: `JSON.parse` in try/catch; require `obj.v` to be a number and `obj.lanterns` / `obj.levels` to be objects; unknown keys are ignored and missing keys take defaults from `State.create()` (so adding fields never breaks old saves). Migration loop, inside the try/catch:

```
while (obj.v < VERSION) { const m = MIGRATIONS[obj.v]; if (!m) return null; obj = m(obj); }
if (obj.v !== VERSION) return null            // a save from a newer build is refused, never half-applied
```
`MIGRATIONS[1] = obj → { delete built, trailCap, famous, helpers, heat.max; add tutorial.DRAG = 0, settings.shakeFlash = true, stats.chains = 0; v = 2 }`. If validation fails: `clear()` and start a new game (never crash on a bad save).

### 15.3 `apply` and what is not saved

`apply(S, obj)`: copy the persisted subset; then for each lantern def and for `lvl = 1..level` call `Lanterns.applyEffect(S, def, lvl, { silent: true })` (builds, trail cap, car level, hires — no fx, no bus); then `S.heat.max = Upgrades.heatMax(S)`, clamp `heat.v` to `[0, max]`, clamp each `levels[id][key]` to `[0, Upgrades.max]`, clamp each `sunk` to `[0, cost − 1]`; return `S`.

Not saved: guests, the trail, koban and trays (their sum is `floorCoins`), the current car phase, hit-stop, unwrap animations, FX. On load: the trail is empty, the platform is empty, `car.phase = 'away'`, `car.timer = C.CAR_RESUME_T` (the car starts sliding in half a second after the game resumes and docks at 3 s), `S.mode = 'play'` (no intro). The live state is never re-applied on a visibility return (§3).

### 15.4 Offline earnings (GDD 8.9)

```
away       = clamp((nowMs − savedAt) / 1000, 0, C.OFFLINE_CAP)
rate       = min(C.RATE_CAP_PER_S, median(income.buckets) / C.INCOME_BUCKET)      // coins per second; the median ignores an event spike at quit time
mult       = C.OFFLINE_BASE + (lanterns.pon.level ≥ 1 ? C.OFFLINE_PON : 0) + (lanterns.kero.level ≥ 1 ? C.OFFLINE_KERO : 0)   // max 0.25
coins      = floor(rate × mult × away)
cars       = floor(away / C.CAR_PERIOD_BY_LEVEL[3])                                // narration only
floorCoins = obj.floorCoins || 0                                                   // 0 in offlineLive
show       = away ≥ C.OFFLINE_MIN && (coins + floorCoins) > 0
```
Applied by `G.Game.loadGame()`: `apply(S, obj)`; `info = offline(obj, Date.now())`; heat on return is never cold: `heat.v = max(heat.v, helpers.pon.hired ? C.RETURN_HEAT_PON : C.RETURN_HEAT)`; if `info.show` → `Cards.showOffline(S, info)` (COLLECT adds the coins), else `Coins.add(S, info.coins + info.floorCoins, 'offline')` immediately. **Offline coins never enter the income buckets** (`Coins.add` skips them for source `'offline'`), so a return can never inflate the next return. `stats` are untouched by offline income (offline coins count toward `earned`).

### 15.5 Autosave

`tick`: `S.saveT += dt; if (S.saveT ≥ C.SAVE_EVERY) { S.saveT = 0; write(S) }`. `write` sets `S.savedAt = Date.now()` and swallows quota errors (logs once). Also called from `visibilitychange` (hidden), `pagehide` and `beforeunload`.

---

## 16. Event bus (`G.Bus`)

```js
G.Bus = { on(name, fn), off(name, fn), emit(name, payload), clear() };   // synchronous; handlers run in subscription order; exceptions are caught and warnOnce'd
```

| Event | Payload | Emitted by | Typical subscribers |
|---|---|---|---|
| `guest:spawn` | `{g}` | Guests | Audio (boing) |
| `guest:seated` | `{g, bath}` | Baths | Events (FULL CAR), Hints |
| `guest:paid` | `{g, value}` | Guests | FX (+N pop) |
| `guest:lost` | `{g}` | Guests | Events, FX (sweat pop) |
| `guest:bored` | `{g}` | Guests (stall queue patience) | FX (small pop) |
| `guest:gone` | `{g}` | Guests | Events |
| `guest:heart` | `{g}` | Baths | Audio (sigh), FX (heart + steam puff) |
| `guest:mochi` | `{g, value}` | Stall | FX (+N) |
| `trail:join` | `{node, index}` | Trail | Audio (blip), HUD (pips pulse) |
| `trail:remove` | `{node}` | Trail | HUD |
| `splash` | `{bath, g, count, mult}` | Baths | FX (ripple, droplets, chain pop, hit-stop at 3 and 5), Camera (bump by count), Player (pump), Audio (+ haptic) |
| `yuzu:apply` | `{bath}` | Baths | Audio, FX (gold rings, pop) |
| `yuzu:pick` | `{tree, by}` | Grove | Audio, FX (sparkle) |
| `coins:add` | `{value, source}` | Coins | HUD (roll target) |
| `coins:collect` | `{value, wx, wy}` | Coins | HUD (starts a screen flight) |
| `coins:land` | `{trayId}` | Coins | Audio (clinkSoft, throttled), Coins (tray bounce) |
| `coins:spend` | `{value, what}` | Coins | — |
| `hud:coin-land` | `{value}` | HUD | Audio (clink ladder) |
| `lantern:progress` | `{id, fill}` | Lanterns | HUD |
| `lantern:tick` | `{id, fill, fromX, fromY}` | Lanterns | Audio (tick), FX (koban toss into the box) |
| `lantern:short` | `{id, missing}` | Lanterns | Audio (nope) |
| `lantern:lit` | `{id, level}` | Lanterns | Audio (pop), FX (puff, confetti 12), Camera (bump 4), Hints |
| `build` | `{id}` | Lanterns | Player (solids), Render (static dirty at once), FX (unwrap strips + puff) |
| `upgrade` | `{id, key, level}` | Upgrades | Audio (pop + pip), Sheet (pips), FX (squash); Player + Render when grove slots |
| `heat:rush:start` | `{chain}` | Heat | Audio (whoosh, shaker), FX (wash, flash, hit-stop 120 ms), Camera (shake 8), HUD (ribbon, banner first time), Audio haptic 30 |
| `heat:rush:end` | — | Heat | Audio, HUD |
| `heat:cold` / `heat:warm` | — | Heat | Audio (shiver), HUD (flash) |
| `heat:stoke` | `{by, amount}` | Heat | Audio (stoke), FX (puff) |
| `ui:cold-refusal` | `{bath}` | Baths | Audio (shiver), FX (snow bubble) |
| `car:warn` | — | CableCar | Audio (dingding), CableCar ring pulse |
| `car:arrive` | `{index, golden, kind, n, empty}` | CableCar | Audio (bell, fanfare), HUD (GOLDEN CAR banner), Events (stats) |
| `car:empty` | `{index}` | CableCar | — (debug counter) |
| `car:depart` | — | CableCar | — |
| `night:start` / `night:end` | — | Events | Audio (chime, layer), HUD (banner), Render (tint) |
| `night:light` | `{id}` | Events | Audio (yuzu), FX (sparkle) |
| `fullcar` | `{carId, n, bonus}` | Events | Audio (fanfare), HUD (banner), FX (confetti 12) |
| `famous` | — | Events | Audio (fanfare), HUD (banner), FX (confetti 40) |
| `fame` | `{level}` | Events | Audio (fanfare), HUD (banner "SEASON FAME"), FX (confetti 12) |
| `helper:hire` | `{id}` | Helpers | Audio (pop), FX (puff) |
| `helper:hop` | `{id}` | Helpers | Audio (hop) |
| `ui:sheet:open` / `ui:sheet:close` | `{id}` | Sheet | Audio (tap) |
| `ui:nope` | — | Sheet, Cards | Audio (nope) |
| `ui:pip` | — | HUD (far-tap) | Audio (pip) |
| `ui:banner` | `{text}` | HUD | — |

Payload objects are reused where possible (`Bus.emit` never requires a fresh object; subscribers must not keep references past the call).

---

## 17. Headless simulation harness (`test/headless.js`, `test/bot.js`, `test/stubs.js`)

Run: `node test/headless.js [--seconds 1800] [--seed 7] [--fuzz 300] [--csv out.csv] [--beats] [--quiet]`. Exit code 0 = pass, 1 = fail (the first failing assertion is printed with the sim time). Requires Node ≥ 18; no dependencies.

### 17.1 Stubs (`test/stubs.js`)

- `globalThis.window = globalThis`; `window.innerWidth = 540; window.innerHeight = 960; window.devicePixelRatio = 1`; `window.addEventListener = () => {}`; `window.requestAnimationFrame` is never called (the harness steps manually). The harness may set `innerHeight = 1200` and call `Canvas.resize()` for the tall-phone checks.
- `document = { getElementById: id → stubCanvas or stubDiv, createElement: tag → tag === 'canvas' ? stubCanvas() : stubDiv(), addEventListener() {}, visibilityState: 'visible', hidden: false }`; `getComputedStyle = () => ({ paddingTop: '0px', paddingBottom: '0px' })`.
- `stubCanvas()` = `{ width: 540, height: 960, style: {}, getContext: () => stubCtx(), addEventListener() {}, setPointerCapture() {}, releasePointerCapture() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 540, height: 960 }) }`.
- `stubCtx()` = an object with explicit no-op methods for every Canvas 2D call the art uses (`save restore translate scale rotate transform setTransform beginPath closePath moveTo lineTo arc arcTo ellipse rect quadraticCurveTo bezierCurveTo fill stroke clip fillRect strokeRect clearRect fillText strokeText drawImage setLineDash`), `measureText: s => ({ width: s.length * 8 })`, `createLinearGradient / createRadialGradient: () => ({ addColorStop() {} })`, `getImageData: () => ({ data: new Uint8ClampedArray(4) })`, and the writable style properties (`fillStyle strokeStyle lineWidth font textAlign textBaseline globalAlpha globalCompositeOperation lineCap lineJoin`). It is a plain object so that a typo like `ctx.filLRect` throws a TypeError the harness catches — that is the point of the render smoke test.
- `localStorage` = an in-memory `Map` behind `getItem / setItem / removeItem / clear / key / length`.
- `navigator = { vibrate: () => true, userAgent: 'headless' }`; `performance.now` = `Date.now`; `AudioContext` undefined (Audio becomes a no-op).

### 17.2 Loader

Reads `index.html`, extracts `<script src="…">` paths in order, and runs each with `vm.runInThisContext(source, { filename })` after setting `G.HEADLESS = true` on a pre-created `globalThis.G = {}` (matching `window.G = window.G || {}`). Then `G.Input.headless = true; G.Game.boot({ headless: true })` → `newGame()` with `U.seed(seed)`; the bot is `require('./bot.js')`. The loader fails the run if any script throws at load. Stepping: `G.Game.step(1 / 60)` per step (fixed; the browser's sub-stepping is not used here).

### 17.3 Bot (`test/bot.js`, a competent player made of the hint system; owned by WP0)

Every step: `h = G.Hints.compute(S, out)`; if `h`: move Kit toward the **aim point** by setting `Input.vec` to the unit vector and `mag = 1` (stop within 6 px). Aim points: bath → the deck's front centre `(deck.x, deck.y + deck.h/2 − 10)`; boiler / woodpile / stall → `STATIONS[id].home`; tree → `(tree.x, tree.y + 30)`; offering step → the step centre; tray → the tray; guest → the guest; station (rules 10 and 12) → its deck front centre or `home`. If Kit has been within 6 px of the aim point for more than 0.3 s with nothing happening (rule unchanged, no coins/trail change), nudge 20 px toward the lane to avoid corner deadlocks. Rule 10 → `Upgrades.buy(S, h.id, key)` for the upgrade it points at, at 1.0× cost (the bot does not use the sheet); when `h.rule === 12` or `h == null` and `Upgrades.cheapestAffordable(S)` exists and `S.coins ≥ 1.5 × cost` → buy that too. Intro is skipped (`S.mode = 'play'`). The bot never touches `S` otherwise.

### 17.4 Invariants (checked once per simulated second, fail fast)

- every guest and Kit have finite coordinates inside the world; `S.coins ≥ 0`, `S.earned ≥ S.coins`; `0 ≤ heat.v ≤ heat.max`
- camera: `MAP.CAM_MIN_Y ≤ cam.y` and `cam.y + Canvas.H ≤ MAP.H` — checked at H = 960 and, after `innerHeight = 1200; Canvas.resize()`, at H = 1200
- `S.trail.length ≤ S.trailCap`; every `trail` node with `kind 'guest'` has `ref.state === 'trail'` and `ref.node === node`; every guest with `state 'trail'` is referenced by exactly one node; **no guest with state ≠ 'trail' has a node**
- **trail clog**: no `log` node has been in the trail for more than 20 s while `heat.v ≥ heat.max`; no `yuzu` node for more than 30 s
- for every bath: `slots.filter(Boolean).length ≤ Upgrades.slots(S, id)`; each seated guest has `state 'soak'` and `bathId === id` and `slot` = its index; no guest is in two seats
- `S.guests.length ≤ C.MAX_GUESTS`; koban in flight ≤ `C.COIN_POOL`; no pool exceeds its cap
- `lanterns[id].sunk < costs[level]` for unmaxed lanterns; `built`, `trailCap`, `car.level` and the hires equal what `Save.apply(State.create(), Save.serialize(S))` derives (recomputed and compared)
- the car timer is finite and ≤ `CableCar.awayLen(S) + 0.01`; no `carLog` entry is older than `C.CARLOG_SWEEP`
- **zone overlap**: in fuzz mode, whenever Kit has stood still for 10 s with no log in the trail at the start, `heat.v` rose by at most one `Upgrades.stoke(S)` in that window
- **RNG purity**: the seeded RNG state is identical before and after every smoke render
- no `U.warnOnce` has fired (in fuzz mode this is an error; in bot mode it is a warning printed at the end)

### 17.5 Assertions (bot mode, default 1800 s; GDD 8.11 targets × 0.7)

| Sim time | Assertion |
|---|---|
| always | no exception from any `G.Game.step`; a render smoke test (`G.Render.frame(S, stubCtx)`) every 10 s throws nothing, alternating H = 960 and H = 1200 |
| 30 s | `S.built.cedar === true` and `S.stats.combos[3] ≥ 2` (the first-30-seconds script works) |
| 120 s | `S.earned ≥ 200` |
| 300 s | `S.earned ≥ 1170`; `S.lanterns.trail.level ≥ 1`; `S.built.grove === true` |
| 600 s | `S.earned ≥ 3470`; `S.helpers.pon.hired === true`; `S.stats.rushes ≥ 1`; `combos[3] + combos[4] + combos[5] ≥ 5`; `combos[5] ≥ 1` |
| 1200 s | `S.earned ≥ 10600`; `S.built.bamboo === true`; `S.stats.nights ≥ 2` (Plus) |
| 1800 s | `S.earned ≥ 22400`; `S.stats.lost / (S.stats.served + S.stats.lost) ≤ 0.15` |

(Floors are 70 % of the measured GDD 8.11 curve, seed 7, build 1.2.0; the balance warning fires above 1.4 × 15,206 at 1200 s.)
| end | save round trip: `JSON.stringify(Save.serialize(S)) === JSON.stringify(Save.serialize(Save.apply(State.create(), Save.serialize(S))))` (after `resetRuntime`); `Save.offline(obj, savedAt + 3600e3).coins` is an integer in `[0, C.RATE_CAP_PER_S × 0.25 × 3600]`; `Save.offline(obj, savedAt + 10 × 3600e3).away === C.OFFLINE_CAP`; `Save.offlineLive(S, now).floorCoins === 0`; after applying an offline card `sum(S.income.buckets)` is unchanged |
| end | upgrade cost table: `Upgrades.cost` for base 30 at levels 0..5 equals `[30, 50, 75, 125, 195, 315]` |
| end | `Guests.route` unit cases: from (120, 1900) to (270, 2030) → `[(270,1900), (270,2030)]`; from (265, 2050) to (410, 1525) → `[(270,1525), (410,1525)]` |
| end | `CableCar.awayLen` cases: level 0 → 9.5, night → 3.5; car #2 docks at t = 13 ± 0.05 in a fresh game |

If the economy overshoots (`S.earned` at 1200 s > 1.4 × 4,800) the run prints a **BALANCE WARNING** (not a failure) naming the GDD 8.11 knobs in order: `YUZU_PAY`, `YUZU_DUR`, `SPLASH_MULT[5]`, `RUSH_PAY`, `NIGHT_PAY`.

### 17.6 Fuzz mode (`--fuzz N`)

N seconds with random input: every 0.5–2 s pick a random direction and magnitude (20 % chance of idle, sometimes parking for 10 s to exercise the zone-overlap check); every 3 s with 50 % probability push a random tap (screen coordinates) into `Input.taps`; every 7 s call `Upgrades.buy` on a random station/key; every 30 s toggle `visibilitychange` hidden/visible with `savedAt` shifted by a random 0–6 h (exercising save on hide and the **live** return path — `Save.offlineLive`, buckets unchanged, state kept); at random times call `Sheet.open` on a random built station and `Sheet.close`. Invariants run every second; any exception or `warnOnce` fails the run.

### 17.7 CSV and beats (`--csv`, `--beats`)

`--csv`: one row per simulated minute: `minute, coins, earned, ratePerMin, lanternsLit, upgradesBought, guestsServed, guestsLost, combos3, combos4, combos5, rushes, chains, fullCars, nights, trailCap, carLevel, heat`. `--beats`: a second block with first-time beats — each lantern's first lit time, first x3 / x4 / x5, first rush, first chain, first night, first FULL CAR, first Golden Car — formatted as the GDD 4.1 / 9.1 table rows so WP6 can paste them. Agents paste both into the PR description of any balance change.

### 17.8 Speed

Node runs ~30–60 k steps/s with the stub context, so 1800 s at 60 Hz (108 k steps) takes 2–5 s. Keep it that way: no `JSON.stringify` per step, no console output inside the loop.

---

## 18. Performance rules (60 fps on a mid-range Android phone)

1. **Measured budgets are the red lines**: `Loop.frameMs ≤ C.FRAME_MS_BUDGET` (12) and `Loop.stepMs ≤ C.STEP_MS_BUDGET` (2), plus ≤ 150 sorted drawables (`C.MAX_DRAWABLES`, asserted in debug). Fill *count* is not a budget (fill area, state changes and text are the mobile costs): one `drawImage` for the static world at 1:1, halos as sprite blits (≤ 8), zero gradient/pattern creation, zero `shadowBlur`/`filter`, zero string building for colours in hot loops (use `ctx.globalAlpha` + a constant colour, or `PAL.rgba` which is memoised).
2. **Simulation budget**: `G.Game.step` ≤ 2 ms on the phone (measured by `Loop.stepMs`); no allocation inside `update` except pool allocs; geometry helpers take an `out` object; `collect` pushes existing objects.
3. **Static cache** (§10.2) holds everything that does not move; rebuilt only on build/upgrade/resize.
4. **Culling**: every `collect` and ground drawer skips objects outside `cam.y − 120 .. cam.y + H + 60`; halos are culled to the visible slice.
5. **Low-effects mode**: `G.Game.updatePerf(dt)` keeps `S.perf.frameMs` as an exponential average (α 0.05). If `frameMs > C.LOWFX_MS` for `C.LOWFX_WINDOW` continuous seconds → `S.settings.lowFx = true` (persisted): tint 0.30, halos ≤ 4, water shimmer off, steam cap 30, ripple cap 15, confetti halved, character sprite cache on. Never auto-disables lowFx; the settings popover shows "Low effects" as a row so a user can turn it back off.
6. **DPR cap** 2, lowered to 1.5 when `innerWidth × dpr > 900`; the canvas is never larger than the CSS viewport × dpr.
7. **Text**: stroked `fillText`+`strokeText` costs two rasterisations; it is reserved for pops (≤ 6), the arrow word (1) and the banner (1). Lantern cost pills, level pills, sheet labels and the HUD are pill-backed unstroked text (`Art.S.pill`).
8. **Sorting**: one `Array.prototype.sort` of ≤ 150 items per frame; never sort inside `update`.
9. **Timers over frames**: everything is `dt`-based; nothing counts frames (the browser sub-steps, the harness runs 1/60).
10. **Debug check**: with `?debug=1` the overlay turns red when any budget above is exceeded; the integrator runs a 5-minute phone session with it on before calling MVP done.

---

## 19. Build plan — work packages, file ownership, integration

Seven packages. **Exactly one owner per file**; ownership means "the only agent that edits the file during the parallel phase". **WP0 is written first by one agent and committed before the others start**: it is the contract (every file exists, loads, and exposes its public functions as no-ops or trivial implementations; the harness already runs 60 s without errors; Hints and the bot work against the stubs). WP1–WP5 then run **in parallel**, each depending only on WP0. If a package needs something from another package's file, it codes against the signature in this document and leaves a `// NEEDS(WPn): …` comment; the integrator resolves it. WP0's files are frozen during the parallel phase (requests go through `NEEDS(WP0)` comments); after the last merge the integrator (WP6) has edit rights on every file — a phase rule, not a second owner. Nobody edits `docs/` except WP6.

| Package | Agent | Owns (exclusively) | Depends on | Delivers |
|---|---|---|---|---|
| **WP0 Contract & skeleton** (first, ~1.5 h) | A | `index.html`, `src/00_config.js`, `01_palette.js`, `02_data_map.js`, `02_data_stations.js`, `02_data_lanterns.js`, `02_data_guests.js`, `10_util.js`, `11_bus.js`, `12_loop.js`, `13_canvas.js`, `14_camera.js`, `24_fx.js`, `30_state.js`, `44_hints.js`, `45_render.js`, `90_main.js`, `test/stubs.js`, `test/bot.js`, `test/headless.js`; plus the **initial stub bodies** of every WP1–WP5 file (handed over at the WP0 commit) | — | The game boots to a cream screen with the HUD skeleton; `node test/headless.js --seconds 60` passes; all data tables and constants are exactly §7/§8; `FX`, `Hints` (12 rules) and the bot are fully implemented; `Hints.compute` returns rule 12 against the stubs (the acceptance test); `Upgrades` and `Lanterns` pure math is implemented in the skeleton commit of those files before handover |
| **WP1 Art** | B | `20_art_shapes.js`, `21_art_chars.js`, `22_art_world.js`, `23_art_fx.js`, `test/art_smoke.html` (every character in every pose and every structure at 1× and 2× on a grid, plus the flat-ink silhouette row at 50 %) | WP0 | All §11 signatures drawing the GDD 11.5 recipes; the smoke page reads well at phone size; every silhouette identifiable; no per-call allocation; no `U.rand` |
| **WP2 Movement, trail, input** | C | `15_input.js`, `31_player.js`, `32_trail.js` | WP0 | Trailing joystick / keys, Kit movement with collision, nudge and breadcrumb path, trail chain with hops / bobs / stop-compress / relinking; the WP0 bot walks Kit to arbitrary points reliably |
| **WP3 Guests, cable car, baths** | D | `33_guests.js`, `34_cablecar.js`, `35_baths.js` | WP0 | Dock-to-dock car cycle, pre-docked car #1, spawning, milling, lane routing, patience, plops, the global Splash Chain, soak, yuzu hats, payout via `Coins.burst` into trays, cold refusal/pause, heated-only rush |
| **WP4 Economy & world systems** | E | `36_heat.js`, `37_grove.js`, `38_stall.js`, `39_coins.js`, `40_lanterns.js`, `41_upgrades.js`, `42_helpers.js`, `43_events.js` | WP0 | Heat with grace / capped pickup / chains, grove with the pick cap, stall (Plus) with queue patience, koban + trays + magnet, offering steps with partial drains and the unwrap trigger, upgrade math incl. `famousMult`, Pon/Kero, night + lantern light / FULL CAR / golden / fame |
| **WP5 UI, audio, save** | F | `16_audio.js`, `17_save.js`, `50_hud.js`, `51_sheet.js`, `52_cards.js` | WP0 | HUD per GDD 10.2 (flights, gated pill, chevron, drag hint, far-tap), sheet, cards / settings / intro, SFX + layers + haptics wired to the bus, save v2 with re-derivation, `offline` + `offlineLive` |
| **WP6 Integration, balance, QA** | A (again) | `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md`, `test/balance/` (CSV + beats dumps), `CHANGELOG.md`; after the last merge: edit rights on every file | WP1, WP2, WP3, WP4, WP5 | Everything wired in §9.0 order; harness bot mode passes §17.5; fuzz 300 s passes; 20-minute phone session at 60 fps; CSV + beats attached and pasted into GDD 4.1 / 8.11 / 9.1; tuning changes only in `00_config.js` / `02_data_*.js` |

Dependency order: **WP0 → { WP1, WP2, WP3, WP4, WP5 } (parallel) → WP6**. Merge order inside WP6: **WP1 → WP2 → WP4 → WP3 → WP5** (art first so everything draws; movement so the bot walks; economy before guests so the first-30-seconds check has coins and lanterns when the baths land; UI last).

### 19.1 WP0 stub rule

Each public function in §9–§15 exists with the exact name and parameter list. `update`/`collect`/`draw` stubs are empty; query functions return neutral values (`false`, `0`, `-1`, `null`, `[]`, `Infinity` for `nextFreeIn`); `Upgrades` and `Lanterns` math (costs, levels, derived values, `revealed`/`active`/`remaining`, `applyEffect`) is **fully implemented in WP0's skeleton commit** (it is pure table code the other packages need) and then owned by WP4; `State.create()`, `Bus`, `Loop`, `Canvas`, `Camera`, `Render.frame`, `FX`, `Hints` and the bot are fully implemented. Commit message: `WP0: contract skeleton`.

### 19.2 Working agreements

- Branch per package (`wp1-art`, …); rebase on `main` daily; the integrator merges in the order WP1 → WP2 → WP4 → WP3 → WP5.
- Every commit must keep `node test/headless.js --seconds 60` green (WP0 wires it so that stubs pass).
- A package may add **private** helpers to its own files only. Shared helpers go into `10_util.js` via a request to the integrator (`// NEEDS(WP0): U.something`), never by editing it directly during the parallel phase.
- Constants: if a package needs a new number, it adds it to `00_config.js` **through the integrator** and references `C.NAME`; no literals.
- Art contract changes (new pose field, new icon) are requested in WP1's file by comment; WP1 owns the signature.
- Nothing in `src/` reads `document`/`window` except `13_canvas.js`, `15_input.js`, `16_audio.js`, `17_save.js`, `90_main.js`; everything else must work in Node.

### 19.3 Integration checklist (WP6)

1. Merge WP1 → run `test/art_smoke.html` in a browser; check the silhouette row; fix signature drift against §11.
2. Merge WP2 → the bot walks Kit around the map (harness 60 s); joystick trailing base and sheet-drag on a phone.
3. Merge WP4 → economy stubs flow: lantern drain, trays, heat, upgrades against WP0's guest stubs; harness 300 s.
4. Merge WP3 → the first-30-seconds script (GDD §13) plays end to end with the bot: **cedar lit and two x3 chains by 30 s**; harness bot mode to 600 s; fix `NEEDS` comments.
5. Merge WP5 → HUD/sheet/cards/audio; phone test through `tools/serve.js`; save/reload (car docks at 3 s), tab hide/show ≥ 60 s (live return, no reload), offline card.
6. Balance pass: run `--csv --beats`, compare to GDD 8.11, adjust only `C`/`DATA` knobs in the 8.11 order, re-run to 1800 s; paste the beats into GDD 4.1 / 9.1.
7. Fuzz 300 s clean; `?debug=1` budget check on a phone for 5 minutes at H = 960 and on a 20:9 phone; low-fx path exercised by forcing `settings.lowFx = true`.
8. Tag `mvp-core`. Then MVP Plus (stall, night, golden, fame) in the same ownership pattern, tag `mvp-plus`.

### 19.4 The `G.Game` contract (`90_main.js`)

```js
G.Game = { S: null, boot(opts), newGame(), loadGame(obj), step(dt), frame(dt), onTap(S, tap), uiOwns(S, x, y) → bool, key(name), updatePerf(dt), syncMode(S), nudge(S) };
```
`boot`: `Canvas.init` (unless headless) → `Audio.init` → `Input.init` → `obj = Save.read()` → `obj ? loadGame(obj) : newGame()` → `Loop.start(step, frame)` (unless headless) → visibility/pagehide listeners. `newGame`: `S = State.create()` (car #1 docked); every system's `init(S)` in §9.0 order; `Render.rebuildStatic`; `S.mode = 'intro'`. `loadGame`: as `newGame` but `Save.apply` before the inits and the §15.4 offline flow after; `mode = 'play'`. `syncMode(S)`: `if (S.mode === 'intro' || S.mode === 'paused') return; S.mode = S.ui.card ? 'card' : S.ui.settings ? 'settings' : S.ui.sheet ? 'sheet' : 'play'` — called at the end of every UI transition; the only stored modes are `intro` and `paused`. `nudge(S)`: `S.kit.nudgeT = C.TAP_NUDGE_T` (Player steers toward the arrow while it runs).

### 19.5 `G.U` (util) — the helpers every package may assume

`clamp lerp invLerp smooth easeOutBack easeInQuad easeOutQuad easeInOutQuad sign hypot dist dist2 angle wrap median`, `rand(a, b) rand() randInt(a, b) pick(arr) seed(n) rngState() hash(a, b) randDisc(r, out)`, `pool(cap, factory)`, `rectHas(r, x, y) circleHit(cx, cy, r, x, y) rectExpand(r, pad, out) rectCenter(def, out)` (center+size → `{x0,y0,x1,y1}`), `hopPos(hop, out)` (`t/dur` → position with `z = 4 h t (1−t)`), `moveToward(obj, tx, ty, speed, dt) → arrived`, ring buffer helpers `pathPush / pathPointAt` (per-segment lengths), `warnOnce(key, msg)`, `fmt1(n)`.

---

## 20. Definition of done and QA checklist

**A package is done when**: its files implement every signature in §9–§15 for its scope with no `NEEDS` left unanswered on its side; `node test/headless.js --seconds 300` passes with its branch merged onto WP0; no literal from a GDD table appears in its files; no per-frame allocation in `update`/`collect`/`draw` (checked by reading, not tooling); no `U.rand` in any draw path; the file budgets of §1 are respected within 1.5×.

**MVP Core is done when** all of the following hold on a real mid-range Android phone (served from `tools/serve.js` over LAN) and in the harness:
- [ ] The GDD §13 script plays exactly: car #1 already docked, first blip by ~2 s, LEAD → SPLASH x3 → COLLECT 24 → LEAD → SPLASH x3 → LIGHT → Cedar Bath by 30 s, heat kettle appears at 75 and does not drain for 30 s.
- [ ] Bot mode reaches the §17.5 thresholds at 30 / 120 / 300 / 600 / 1200 / 1800 s; fuzz 300 s is clean.
- [ ] 60 fps with 12 waiting guests, 3 full baths, 3 loaded trays and a Steam Rush running (debug overlay green); no judder on a 90/120 Hz phone.
- [ ] On a 20:9 phone (H = 1200) the camera never inverts and nothing below the cable is unpainted; on any phone the platform is never drawn below 0.65 H.
- [ ] Save every 5 s; kill the tab, reopen: the world is as left (minus guests), the car docks at 3 s; after ≥ 60 s away the offline card shows N cars and the coins, COLLECT flies them in; hiding and re-showing the tab after ≥ 60 s runs the live return without reloading and without doubling tray coins.
- [ ] One-thumb: every play action is reachable with the joystick alone; sheet buttons are within the bottom 34 %; nothing modal during play except cards; every tap target ≥ 56 logical px.
- [ ] Text on screen at any moment ≤ 3 words; every tutorial word appears at most twice; TAP never appears before the first lantern is lit; the arrow never points at nothing until every lantern and upgrade is maxed.
- [ ] Audio starts on the first touch (the bell), mute persists, no sound plays before a gesture (no console warnings).
- [ ] Works from `file://` (double-click `index.html`) and offline (airplane mode) with no network requests at all.
- [ ] No console errors or warnings in a 20-minute session; `U.warnOnce` never fires.

**MVP Plus is done when** the stall chain, Lantern Night, Golden Car and the Famous Inn finale each pass their harness assertions (`stats.mochi ≥ 3` by 900 s once the stall is built, `stats.nights ≥ 2` by 1200 s, `stats.golden ≥ 2` by 600 s, `S.lanterns.bridge.level ≥ 1` by 1800 s in a `--seconds 2400` run) and the phone session shows the night tint, halos, lantern light and the fireworks at 60 fps.

---

## 20. Seasons (build 1.3.0)

- **Load order**: `02_data_*.js` (Season 1 tables) → `03_pack_s2.js` (registers `G.PACKS[2]`) → `04_seasons.js` (reads `capysprings.meta`, picks the season — `G.SEASON_ID` in the harness, `?season=n` as a dev shortcut — and copies the pack's `data` / `pal` / `config` over `G.DATA` / `G.PAL` / `G.C`) → everything else captures the current season's data as before. `25_art_s2.js` (after the FX art) replaces `G.Art.W` drawers and adds `Ch.squirrel` / `Ch.momo` / `Ch.hats.yuzu` when `G.SEASON.id === 2`.
- **`G.Seasons`** (`04_seasons.js`): `current`, `list`, `byId`, `meta`, `text(key, fallback)`, `word(w)`, `firstLit(S)`, `finaleLit(S)`, `isUnlocked`, `isDone`, `stars()` (finished seasons other than the current one), `progress(S)`, `missing(S, out)`, `recordProgress(S)` (called from `Save.write`), `unlock(id, opts)` (lantern effect `travel:n`, emits `season:unlock`), `markDone(S)`, `canTravel(id)`, `travel(S, id)` (save → meta.season → `location.reload()`; a no-op reload in the harness).
- **Save**: `Save.KEY = G.Seasons.current.saveKey`; `State.create` derives `built` from the pack (`prebuilt` baths) and adds `S.season`, `S.lap`, `S.kaa`, `car.vip`, stats `vip / laps / kaa`, tutorial word `LAP`. Nothing new is persisted: laps, Kaa and the VIP are runtime.
- **Generalisations made for packs**: `Baths.payout` × `def.payMult` × `Upgrades.starMult`; `Upgrades.famousMult` reads `S.lanterns[G.SEASON.finale]`; `Events` / `Hints` / `HUD` use `Seasons.firstLit` instead of `lanterns.cedar`; `Ch.guest` dispatches on `GUESTS[kind].art`, Audio plays `GUESTS[kind].voice`, `fillPose` passes `scarf` / `vip`; banners, pops, the gauge icon and unit, the cold icon, the stoke sfx and card copy go through `Seasons.text`; the arrow's words through `Seasons.word` (tutorial keys stay canonical); `W.footprint('grove')` is derived from the slots; `deckPlate` uses `def.stripes`.
- **Season mechanics behind data blocks**: `DATA.VIP` (`CableCar.planCar` adds one guest of `VIP.kind` to a golden car docking during the night once `VIP.requires` is built; spawned last), `DATA.LAP` (`Heat.updateLap`, `Heat.drawGround` stones via `W.lapStone`, arrow rule 13 `LAP`, `C.STOKE_STOP` so a lap never burns the fuel early), `DATA.KAA` (`G.Kaa` in `46_kaa.js`: `update`, `tap(S, wx, wy)` consulted first in `Game.onTap`, `collect`; bus events `kaa:land` / `kaa:steal` / `kaa:tap`). `W.nightExtra(ctx, camY, H, fade, t, low)` is an optional hook drawn after the night tint.
- **Cards** (`52_cards.js`): the settings popover is 348 px with a **Seasons** button (shows this season's %) above Reset; cards `travel` (LATER / GO, opened `C.TRAVEL_CARD_DELAY` after `season:unlock`, never in the harness) and `seasons` (one row per season: HERE / GO / lock, progress ring, what is left to buy).
- **Harness**: `--season n`; `SEASON_CHECKS[n]` milestone tables (`DECK_CHECKS`, `TERRACE_CHECKS`); the bot taps Kaa after 1.5 s; the end-of-run checks derive the upgrade-cost table and the away length from the pack, skip the Deck's route cases elsewhere, and exercise the meta record (unlock sticks, stars never count the current season, progress ∈ [0, 1]).

---

## 21. App shell, developer mode, package (build 1.4.0)

- **Boot**: `index.html` shows a CSS boot screen and loads `window.CAPY_FILES` one script after another (progress bar per file); `Game.boot` fades it out on start. `test/headless.js` and `tools/pack.js` read the same list, so there is one load order.
- **Title** (`53_title.js`, mode `'title'`): `Game.boot` sets the mode after `newGame` / `loadGame` in the browser only. `Game.step` runs only `Title.update`, `Cards.update`, `FX.update`, `HUD.update` in that mode; `Render.frame` draws the world, then `Title.draw` and `Cards.draw` (no HUD, text, arrow or joystick). `Game.syncMode` leaves `'title'` alone, so the settings popover and the Seasons card open over it. `Title.pending` holds the offline-earnings info that `loadGame` / `resume` would otherwise show, and `Title.play` shows it (or starts the intro fade). `Title.show` saves and returns to the title (settings → Main menu). The settings popover now pauses the simulation (`Game.step` treats `'settings'` like `'card'`).
- **Developer mode** (`54_dev.js`, `G.Dev`): `Dev.on` from `localStorage['capysprings.dev']` or `?dev=1|0`; `Dev.toggle` (seven taps on the version label). `Dev.update` keeps coins at 999,999,999 while `infinite` is on (and `earned` with it, for the invariant). Speed sets `Loop.timescale`. The panel is a card of kind `'dev'` whose taps and drawing `Cards` delegate to `Dev.tap` / `Dev.draw`; `Cards.showDev`, `Cards.close`; the chip under the gear (`Dev.tapChip` in `Game.onTap`, `Dev.drawChip` after the HUD); F2 → `Game.key('DEV')`. Actions call the real systems (`Lanterns.light`, `Events.startNight`, `Seasons.unlock` / `travel`, `Save.clear` + `Game.newGame`), so they stay consistent with saves.
- **Package** (`tools/pack.js`): draws the icons with a dependency-free PNG encoder (CRC32 + `zlib.deflateSync`, 4×4 supersampled shapes), stamps `?v=<version>` on the script URLs, writes `sw.js` (precache of every file, network-first with cache fallback also on non-OK responses, old caches deleted on activate, `skipWaiting` + `clients.claim`) and copies a hostable `dist/`. `index.html` registers `sw.js` only over http(s) (never `file://`). `manifest.webmanifest` declares standalone portrait with `any` + `maskable` icons. `tools/share.js` (`npm run share`) runs the server plus a Cloudflare quick tunnel so a phone can install from an https address; a non-OK network answer falls back to the cache, so an installed copy survives the link expiring.

---

## 22. The Ridge (build 1.6.0)

- **Data**: `MAP.RIDGE` { y0, y1, camMinY, boundsY0, laneY0, mist, chasm, mill, exit, pines, rocks }; `MAP.STATIC_Y0` is 500 so the static cache always covers the Ridge (hidden above the clamp until it opens). Baths `sauna` (`sauna: true`, `look: 'sauna'`) and `plunge` (`plungeOnly: true`, `look: 'plunge'`), both in `SHEET_STATIONS` / `UPGRADES`; lanterns `sauna` and `plunge`; `C.PLUNGE_WINDOW`, `C.PLUNGE_PATIENCE`, `C.HOTCOLD_PAY`, `C.PLUNGE_PUNCH`.
- **`G.Ridge`** (`47_ridge.js`): `open(S, opts)` (sets `S.built.ridge`, dirties the static cache and solids, emits `ridge:open` unless silent), `isOpen`, `minY(S)`, `boundsY0(S)`, `exitFor(S, g)`. `Lanterns.applyEffect` calls `open` for `famous` level 1, so a load re-derives it silently. Readers ask at call time: `Camera.minY(S)` / `clampY(S, y)`, `Player.update` (bounds) and `Player.solids` (chasm rects), `W.mist` (band), `Save.apply` (Kit clamp after re-derive).
- **Guests**: `area` ('platform' | 'ridge'), `millRect`, `plungeT`, `hotCold`. `Guests.wantPlunge(S, g)` after a sauna payout when the plunge is built; `countWaiting(S, area)` (the car cap counts 'platform' only); `nearestWaiting(S, x, y, maxDist, preferPlunge)`; `bubbleKind` returns 'plunge'; the window ring is drawn in `drawBubble`; `Ridge.exitFor` replaces the fixed platform exit everywhere a guest leaves (also `Stall.serve`).
- **Baths**: `accepts(S, bath, g)`, `trailFor`; the drop-off uses `Trail.takeFirstGuest(S, pred)` and emits `ui:cold-refusal` once per visit when nobody in the line belongs; `land` sets `hotCold` and emits `plunge` { g, bath, hot }; `payout` × `HOTCOLD_PAY`; yuzu is never applied to a plunge-only bath. `Trail.takeFirstGuest` / `countGuests` are the new trail helpers.
- **Hints**: rule 14 PLUNGE; rules 1 / 2 / 4 respect acceptance; rule 2 scores `fit × worth` (`def.payMult`, or `def.hintValue || 3.5` for the sauna with the plunge built).
- **Art**: `W.ridgeTerrain`, `W.snowPine`, `W.ridgeDecor` (called from `rebuildStatic`), `W.saunaBody` (via `deckPlate` look 'sauna'), plunge plate and water looks, icon `plunge`. FX / Audio / HUD subscribe to `plunge` and `ridge:open`.
- **Harness**: invariant uses `Camera.minY(S)`; `DECK_CHECKS` gain 2400 s (Ridge open) and 2700 s (sauna, plunge, ≥ 1 hot-cold); `npm test` runs the Deck for 2700 s.

- **Pavilion (1.7.0)**: bath def fields `gong` (seconds), `fullHouse` (multiplier), `gongAt`, `tsuruAt`, `look: 'pavilion'`; runtime `bath.gongT`, `bath.session`, `bath.sparkT`; guest `inSession`, `fullHouse`. `Baths.update` ticks the gong, starts a session for seated, non-hopping guests (emits `gong` { bath, n, full }), lets only in-session guests' timers run, and clears `session` when the last one finishes; `nextFreeIn` adds `gongT` while waiting. `Baths.collect` pushes the gong stand (`W.gong`) and Madame Tsuru (`Ch.tsuru`, pose 'massage' during a session). `W.pavilionBody` (via `deckPlate` look) and the tatami `water` look. Hints rule 2 discounts by distance (`800 / (800 + d)`). The bot (`test/bot.js`) plans a lane route once when carrying guests across the bridge (`crossPlanned`), and keeps its straight-walk-then-plan-when-stuck behaviour otherwise (the NaN aim is deliberate; see the comment).

- **Snowfall (1.8.0)**: `MAP.SNOW` { first, every, dur, perSquall, stagger, spots, driftR, growT, clearT, slowKit, slowGuest, bonus, maxDrifts }; `S.snow` { next, active, t, count, dropT, dropped, drifts: [{ i, x, y, amount, clear }] } (runtime only; `resetRuntime` clears it and `next` re-arms from `S.t`). `G.Snow` (`48_snow.js`): `update` (squall timer, staggered drops, drift growth, Kit clearing with `Coins.rain` and `snow:clear`), `speedMult(S, x, y, kit)` used by `Player.speed` and the guests' `advanceWalk`, `nearestDrift` (hints rule 15), `drawGround` (`W.drift`), `drawWeather` (tint + flakes, called from `Render.frame` after the petals). Bus: `snow:start` (HUD banner, Audio wind), `snow:end`, `snow:clear` (FX puffs + pop, Audio scrape).

- **Lift and Momo (1.9.0)**: `MAP.LIFT` { y, pylons, pylonTop, dockX, enterX, exitX, doorDY, sortY, platform { x, y, w, h, cap, mill, exit }, bell, period, periodNight, guests, goldenEvery }; `S.lift` mirrors `S.car` (phases away / in / dock / out, car ids from 100000 so `carLog` never collides); `Save` persists `lift.index`. `G.Lift` (`49_lift.js`): `update`, `collect` (gondola via `W.liftCar`, bell via `W.bellPost`), emits `car:arrive` with `lift: true` and `x, y` (HUD "GOLDEN LIFT!", FX confetti at the event's point), `lift:warn`, and `vip:arrive` when Momo steps off (`DATA.GUESTS.momo`, once per night via `S.night.momo`, needs `S.built.sauna`). `Guests.spawn(S, kind, carId, golden, x, y, area)` takes `'ridge'` to use the lift platform's mill. `Camera.maxY(S)` blends the clamp's upper limit across the bridge so the Ridge fills the screen; `MAP.STATIC_Y0` is −120 and the harness's out-of-world invariant uses it. `Lanterns.labelAt / blurbAt` read `labels[] / blurbs[]` (or `label / blurb`) and `drawLabel` shows name, price and line. `Ch.momo` moved to `21_art_chars.js`; `W.ridgeDecor` draws the pond, the cable, pylons and the lift platform.

## 23. The Guestbook (build 1.10.0)

- **`G.Goals`** (`55_goals.js`, loaded after `54_dev.js`): a module-level `POOL` of fourteen goal defs { id, label, get(stats), target, reward, icon, needs? } (`needs` is a `S.built` key). `dayNumber()` = local calendar day as a UTC day count; `pick(S, day)` = the easy goal by day parity + two from the buildable rest sorted by `U.hash(day, i + 1)`, padded for a brand-new inn; `rollIfNewDay(S)` resets `S.goals` { day, ids[3], done[3], base (a stats snapshot), stamps, allDone } (stamps survive); `progress(S, i)` = clamp(stat − base, 0, target); `update` checks twice a second, rains the reward (`Coins.rain` source 'goal'), emits `goal:done` { goal, reward }, `goal:all`, and `goal:card` (every `STAMP_CARD` = 5 stamps: sets `S.car.index` so the next car is golden, the same trick as the Dev menu).
- **UI**: `Cards.showGoals` opens card kind 'goals' (tap and draw delegate to `Goals.tap/draw` like the Dev card); Settings gains a "Guestbook n/3" button (first in the list); the title gains a GUESTBOOK button between SEASONS and SETTINGS; `Goals.chipRect/tapChip/drawChip` draw the "n/3" pill under the gear (`st + 168..196`), the Dev chip moved to `st + 202..230`; main's tap order is Cards → Title → Sheet → gear → Goals chip → Dev chip → Kaa → stations.
- **Feedback**: HUD banners GOAL DONE +n / ALL GOALS DONE! / STAMP CARD FULL!; FX small confetti + sparkle, big confetti + flash for all three; Audio recipe `stamp` (a lowpass thump, a low sine drop, a high ping) + pip, `fanfare` for all/card.
- **Save**: `goals` is written and read back defensively (ids as strings, done as three booleans, stamps ≥ 0); `S.stats.yuzu` counts golden baths (incremented where the yuzu lands in `Baths`).
- **Harness**: the 600 s Deck check requires three goal ids and ≥ 1 stamp; the summary line prints `goals a/b/c stamps n`.

## 24. The Summit (build 1.12.0)

- **Data**: `MAP.SUMMIT` { y0 −1340, y1 −120, camMinY, boundsY0, mist, exit, chasm, stairs, torii, mill, hut { solid, door, perch, seat }, waterfall, vents, pines, rocks, stoneLanterns }, `MAP.TROUPE` { platform { cap 10, mill }, from, whistle, period 20, periodNight 12, guests 6, goldenEvery 5, warn 3, hopGap 0.3 }; `MAP.STATIC_Y0` −1340. Baths `source` (geyser { every, dur }, sends 'snowroll', mill 'SUMMIT', area 'summit', guestKind 'monkey', coneAt) and `snowroll` (plungeOnly, word 'ROLL'); `sauna` gains `sends: 'plunge'`. `GUESTS.monkey`; `DATA.KAA` for Season 1 (requires 'shrine', `near` 650: lands near Kit).
- **`G.Summit`** (`57_summit.js`): `open` (effect `open:summit`), `isOpen`, `minY`, `boundsY0`, `exitFor` (each falls back to `G.Ridge`), `stage(y)` 0/1/2, `addSolids` (cliff + hut), `collect` (the whistle post, Grandma after the ending). **`G.Troupe`**: phases away → drop; `arrive` caps by `countWaiting(S, 'summit', mill)`; ids from 200000; FULL TROUPE through `carLog`; golden = Momo's Troupe.
- **Engine generalisations**: `Guests.wantPlunge(S, g, bath)` (mill/area from the sending bath); the pay branch follows `def.sends`; `Guests.countWaiting(S, area, mill)`; patience only on Kit's stage; hints `worth` uses `sends`, rule 14 picks the nearest plunge-only bath on Kit's stage with its `word`, rule 4 stays on Kit's stage; `Baths`: `geyserT / burstT / tick`, events `geyser` and `geyser:tick`, `g.burst` x `C.BURST_PAY`, the cone drawable, `stats.bestSplash`; camera `maxY` blends across the stairs; `Player.solids` pool 40.
- **Static tiles** (`45_render.js`): the static world is cached in 640-px tiles built lazily near the camera and released two tiles away; each overlaps the next by 2 px.

## 25. Notes, the ending, the Golden Age (build 1.12.0)

- **`G.Story`** (`58_story.js`): NOTES (pre-wrapped lines), triggers on `lantern:lit` / `ridge:open` / `summit:open` / `vip:arrive`, a queue shown only in play with no banner and no live chain, 7.5 s on screen, tap to close; `S.story.seen` persists; headless only counts `stats.notes`.
- **`G.Finale`** (`59_finale.js`): `wake(S, level, opts)` is the lantern effect; `start(S, { replay, resume })` (headless: `finish` at once), mode `'finale'` (`Game.step` runs only `Finale.update` + `FX.update`; `syncMode` leaves it alone; `onTap` routes to `Finale.tap`; `resume` restores it), `Camera.y` scripted (`Camera.tickShake` keeps shakes decaying), the WAVE list fires as the camera centre passes, the CAST are keyframed actors (`[t, x, y, pose, 'hop']`, `plopAt` into a Source seat) collected into the sorted pass while the real guests, Kit, the trail, the helpers and Kaa are hidden; `drawScreen` draws the banner, the letter, the credits (`buildCredits` from `S.stats`) and the end card. `Title.begin` resumes an interrupted ending at the gathering. Render: amber multiply tint while the ending runs.
- **`G.Golden`** (`60_golden.js`): `season(S)` from `wake.level`, `applySeason` writes `PAL.ground / groundDark / groundMoss / foliage / foliageDark` (read by `W.terrain`, `W.pine`, `W.treeBody`, `W.ambient`, `W.pines`), `star`, `afterEnding`, `festivalTonight`, `nightEnded` (score, best, banner), `update` (fireworks). `Events.startNight(S, festival)`, `makeFestival`, `nightLen`, `nightPay` (x1.5 in a festival; used by baths and the stall).
- **Save**: `troupe.index`, `story.seen`, `ending.seen`, `festival { count, best }`; `built.summit / shrine / awake` re-derive from the lanterns. Endless lanterns count as one level in `Seasons.progress`.

## 26. Graphics foundation (build 1.12.0)

`S.shadow` offsets (+4, +2) for light from the top-left; `S.plate` strokes a cream rim; `S.pill` has a 3-px drop and a top highlight; `FX.soft()` is one baked radial puff blitted for steam, dust and puffs; `W.water` draws a lighter inset for depth and no longer clips a light band; `W.terrain` draws 14 dark patches and 150 tufts, a value gradient and `W.grain` (a 64-px pattern, static only); `W.lane` draws stepping stones; the capybara has a belly, a rim light and nostrils; the title logo sits on a swaying wooden sign under a sky gradient. The rest of the plan (sprite caches, effect tiers, baked labels, lighting ramp) is ranked in `docs/plans/graphics.md`.
