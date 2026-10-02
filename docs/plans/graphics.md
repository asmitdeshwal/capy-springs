FINAL SPEC:
# Capy Springs - graphics upgrade plan (judged final, top 12)

Scope: presentation only. Nothing in `30_state.js`, `33_guests.js` logic, `35_baths.js` logic, `40_lanterns.js` logic, prices, effects, or step lists changes; `node test/headless.js` seeds 7/3/11 must stay byte-identical. Vanilla ES2020 + Canvas 2D, no image/font/audio files, no `shadowBlur`/`filter`, no gradient creation at draw time, no new tutorial words. Target: looks finished on the user's iPhone at Full; holds 30+ fps on a 2019 Snapdragon-4xx Android at Lite; Minimal is the parachute.

Legend: **BAKE** = once at init / resize / build / season apply (static cache or a sprite); **FRAME** = bounded per-frame cost. LOC = new + changed.

## 0. Facts the plan is built on (verified in source)

- Phones already render under `DPR_CAP_WIDE 1.5` (`cssW*dpr > 900` is true for every modern phone), so sdpr = 1.5 × (cssW/540) = **1.08-1.19 device px per logical px**. The capture rig at sdpr 2 looks sharper than the phone does. Only old 720p Androids (360 css × dpr 2 = 720) get the 2.0 cap, at sdpr 1.33.
- Static canvas = 540 × 2520 logical. At sdpr 1.19 it is ~3000 px tall; at a Full cap 2.0 on a 430-wide phone (sdpr 1.59) it is 4010 px; on an iPad today (sdpr 2.28) it is 5740 px, already past the 4096 px limit where cheap GPUs fall back to software raster. **Tiles must land before any DPR change.**
- Worst realistic frame (Lantern Night + Steam Rush + ~40 guests): ~2,400 path ops, ~25 stroked texts, 17 clips (14 per-guest in `Ch.begin` + 3 per-bath in `W.water`), 1-3 dashed strokes (`W.step`), ~70 save/restore pairs, 3 composite switches during squalls. Guests are ~60 % of path ops; text + clips + dashes are ~20 % of the time for ~2 % of the ops.
- Capy `#9C6B43` on pine `#3F7D5A` = ~1.06:1 luminance contrast. The star guest reads only through its 2 px stroke.
- `Ch.spriteCache` is a stub. `S.shadow` is a centred ellipse (no light direction). `S.plate` is two flat fills. 16 hex literals live outside `G.PAL`.

## 1. The ranked list

| # | Item | Mode | LOC | Visual gain | Frame cost (worst frame) |
|---|---|---|---|---|---|
| 1 | Foundation: light direction, paper edge, walker contrast, no invisible strokes | BAKE (+2 strokes on live plates) | 30 | very high | -0.3 ms |
| 2 | Effects tiers scaffold + debug counters (`settings.fx`) | engine | 60 | enables all | 0 |
| 3 | Baked text: lantern label cards, sheet rows, 13 px floor | BAKE per key, FRAME 1 blit | 90 | medium (readability) | -1 to -2.5 ms (-2 to -4 with sheet open) |
| 4 | Batching cleanup: step ring sprites, squall tint, HUD icon atlas | BAKE sprites, FRAME blits | 70 | low (but crisper icons) | -1 to -2 ms |
| 5 | Character appeal pass (vector, then baked by #6) | FRAME ~0 | 110 | very high | 0 (±2 fills per guest) |
| 6 | Guest sprite cache (`G.Art.Sprites`) | BAKE sheet, FRAME 1-3 blits/guest | 160 | high (crisp strokes) + the perf win | -5 to -9 ms |
| 7 | Static tiles + tiered DPR cap | engine | 45 | high on iPhone (sharper), safety on Android | 0 at Lite, +fill at Full |
| 8 | Painted mountain: meadow, lane, aprons, Ridge, bridge blend, grain, contact shadows | BAKE | 140 | very high | 0 (rebuild +~10 ms once) |
| 9 | Water: two-tone + baked rim + caustic tile + waterline band (no per-guest clips) + soft ripples + lantern smudge | BAKE rim/tiles, FRAME ≤ 8 ops/bath | 110 | high | -1.5 to -3 ms |
| 10 | Soft FX sprites: steam puff, crown splash, impact flash, plunge frost, soft ring | BAKE 6 sprites, FRAME blits | 90 | high | -0.5 to -1.5 ms |
| 11 | Lighting ramp: warm halo rebake, ground light pools, dusk pass, night ignite, Ridge mist blobs + stars | BAKE sprites, FRAME ≤ HALO_MAX blits | 70 | medium-high | +0.3 ms at night (counted inside HALO_MAX) |
| 12 | Title sign + transitions (iris, stage-reveal camera script, build flash, card push-back, sheet dim) + draw bench/audit | BAKE logo, FRAME one-shot | 150 | medium-high (feel) | -1 ms on title |

Total ≈ 1,100 LOC across 9 PR-sized stages (section 4). Items 1-4 are "free wins" (-3 to -6 ms, visible polish, no risk); 5-7 are the low-end core; 8-10 are the look; 11-12 are the finish.

---

### 1. Foundation (30 LOC) - BAKE for static, +2 strokes on ≤ 6 live plates
**Files:** `20_art_shapes.js` (`S.shadow`, `S.plate`, `S.pill`, `S.bubble`), `01_palette.js`, `50_hud.js` (`BANNER_OPTS`), `21_art_chars.js` (`Ch.momo`).
- **Light from the top-left.** `S.shadow(ctx, x, y, rx, ry, a)` draws at `(x + 4, y + 2)` with `rx * 1.1, ry * 0.9`. Every character, tree, boiler, tray, gong and deck shadow moves at once because all go through this one function. Characters in `Ch.begin` inherit it.
- **Paper edge on every plate.** `S.plate` draws, after the top fill: a 1.5 px `PAL.rgba(PAL.cream, 0.35)` line along the top edge and left edge (inset 2 px, cap round) and a 1.5 px `PAL.rgba(PAL.ink, 0.18)` line along the inner bottom-right edge. Decks, platform, stall counter, lift platform and sauna/pavilion porches get it inside the static cache; trays and steps draw it live (≤ 6 small plates). Thickness bands: decks 10 (unchanged), trays 6 → 8, steps 5 → 6.
- **Pill / bubble highlight.** `S.pill` and `S.bubble`: one 1 px `cream` 0.6 line across the top inside the radius, shadow offset (0, 3) at 0.12 instead of (0, 2) at 0.15. Every label, cost, level pill, chip, bubble and banner sharpens at once.
- **Walker-on-ground contrast (palette only, ship first and ask).** `PAL.pine '#3F7D5A' → '#37704F'` (lum 0.165 → ~0.13), `PAL.capy '#9C6B43' → '#A8744A'` (lum 0.177 → ~0.23); `capyDark`, `capySnout` unchanged so the band and snout contrast grow. Target ≥ 1.5:1 for every `GUESTS` body colour on {pine, moss, lane stone, cedar, stone, ridgeStone, snow}, Kit ≥ 1.8:1 (test in section 6). Momo on snow drifts gets a `stoneDark` stroke instead of `MONKEY_D`.
- **No invisible strokes.** Delete `BANNER_OPTS` (cream stroke on a cream pill); banner text is a plain `S.text`.
- **Palette consolidation (same commit, one grep for `'#` outside `01_palette.js`).** New tokens: `snow #E9EEF2`, `snowShade #C6D1D8`, `ridgeStone #A9B6BF`, `chasm #2F3D47`, `ice #BFE3EC`, `iceShade #7E96AC`, `pondIce #BFD9E6`, `tatami #C9B977`, `tatamiEdge #8E7F3F`, `hutWall = mix(cedarDark, ink, 0.35)`, `roof = cedarDark` (the maroon `#6B2F2A` pavilion roof becomes cedarDark with `red` eave tips: everything Kit builds is cedar + cream + red), `monkey #D8D3CB`, `monkeyShade #9A948B`, `monkeyFace #E36B6B`, `liftCab #5C6F8A`, `liftCabDark #3E4B5E`, `petalPink #F2A7B6`, `bloomYellow #F6D27A`. Replace every literal in `22_art_world.js`, `21_art_chars.js`, `48_snow.js`, `20_art_shapes.js` (`plunge` icon); patch GDD §11.3 (data wins).
**Low-end fallback:** none needed (bake); the two live strokes are on ≤ 6 plates.

### 2. Effects tiers scaffold + debug counters (60 LOC) - engine
**Files:** `00_config.js`, `30_state.js` / `17_save.js` (migration), `52_cards.js` settings row, `90_main.js` `updatePerf`, `13_canvas.js`, `50_hud.js` `drawDebug`, `24_fx.js`/`45_render.js` (replace `lowFx` reads).
- `S.settings.fx`: 2 = Full, 1 = Lite, 0 = Minimal. Migration in `17_save.js` v2 → v3: `lowFx true → fx 1`, `lowFx false/undefined → fx 2`; delete `lowFx`. Helper `G.Perf.tier(S)`; every existing `lowFx` branch becomes `tier < 2`; new Minimal branches use `tier < 1`.
- **Boot guess:** `navigator.deviceMemory <= 3 || navigator.hardwareConcurrency <= 4` → Lite (both undefined on iOS → Full). Only applied on a fresh save or when `settings.fxAuto` is true.
- **Detector:** unchanged rule (frameMs > 22 for 2 s) lowers one tier at a time (Full → Lite → Minimal), never raises; sets `settings.fxAuto = true`. A manual tap on the row clears `fxAuto`.
- **Settings row copy:** label **"Effects"**, value pill **"Full" / "Lite" / "Minimal"**, tap cycles Full → Lite → Minimal → Full. Sub-line (13 px, `stoneDark`): when `fxAuto`: **"picked for a smoother game"**; otherwise **"Lite switches on by itself on slower phones"**. Replaces the "Low effects" row.
- **Debug counters (only when `?debug=1`):** monkey-patch the 2D context once in `Render.init` to count per frame `clip`, `setLineDash` (non-empty), `createLinearGradient + createRadialGradient`, `strokeText`, `fillText`, `drawImage`, `save`, composite-op assignments, path ops (`fill + stroke`). Overlay line: `tier 2  clip 0  dash 0  grad 0  sText 3  fText 18  img 120  ops 980`. Bench marks per pass (item 12) use the same hook.
**Tier table:**

| | Full (2) | Lite (1) | Minimal (0) |
|---|---|---|---|
| DPR cap (`Canvas.dprCap`) | 2.0 (after item 7) | 1.5 (today's phone look) | 1.25 |
| guests | sprites + live eyes/blush/catch-light | sprites, live eyes, blush | sprites, no blush, no catch-light |
| steam / ripples / particles caps | 60 / 30 / 120 | 30 / 15 / 60 | 20 / 10 / 40, no droplets |
| water | two-tone + baked rim + caustic tile + waterline band + lantern smudge | two-tone + rim + band | two-tone + band |
| halos + ground light pools | 8 total | 4 total | 2 halos, no pools |
| night tint | multiply 0.40 | multiply 0.30 | source-over 0.28 (no composite switch) |
| petals / flakes | 9 / 48 | 0 / 24 | 0 / 0 (tint only) |
| Ridge mist blobs / stars | 3 drifting / 20 | 2 static / 0 | 0 / 0 |
| splash | crown + droplets + impact flash + x5 water flash | crown + flash | crown only |
| text | baked labels + sheet rows, pops ≤ 16 | same | same, pops ≤ 8 |
| idle life (blink, breathe, happy eyes) | all | all | blink only |
| transitions | iris + stage sweep + build flash | same | cream fade instead of iris; sweep kept (one-shot) |

### 3. Baked text + the text floor (90 LOC) - BAKE per key, FRAME 1 blit
**Files:** `40_lanterns.js` `drawLabel`, `51_sheet.js` `draw`, `20_art_shapes.js` (`S.text` debug assert), new `G.Art.TextCache` (in `23_art_fx.js` or a new `26_art_cache.js`).
- **Lantern label card:** render name (15 px) and blurb (**11 → 14 px**) once to a small canvas at sdpr keyed `id|level`, each on a cream pill (`S.pill`, width from one `measureText` at bake time) instead of two `strokeText` per frame. The live price pill stays (its number drains with `sunk`). Bake lazily on first draw **after the first frame** (font resolved; Android resolves to Roboto 700, Windows to Segoe UI), rebake on `Render.onResize`. Cache ≤ 40 entries.
- **Sheet rows:** each row's static text (title, before → after, blurb, level pips) rendered to a 508 × 92 canvas keyed `id|key|lvl|can|maxed|vis`; blit per frame; the price pill, wiggle and flash stay live. Removes 3 `measureText` + ~14 `fillText` per frame while the player steers with the sheet open. Sheet blurb **12 → 14 px**, "Tap an upgrade to buy it" **13 → 14 px**.
- **Text floor:** debug assertion in `S.text`: `size >= 13` outside the debug overlay and the title version line. Tray badge **12 → 13 px**.
- Level pill vs chain pop: hide the level pill while a chain pop is live over the same bath (text priority).
**Low-end fallback:** identical on all tiers (it is cheaper everywhere); Minimal caps pops at 8.

### 4. Batching cleanup (70 LOC) - BAKE sprites, FRAME blits
**Files:** `22_art_world.js` `W.step`, `48_snow.js` `drawWeather`, `20_art_shapes.js` `S.icon`, `23_art_fx.js` `FX.part` (dust/puff/confetti alpha).
- **Step ring:** bake two ring sprites (r 30, 6 px: "dashed `stoneDark` 0.7" and "solid `cta` 0.55") once at sdpr; `W.step` blits one and draws the live fill arc; the affordable pulse becomes the blit size (no save/scale/restore, no `setLineDash` per frame).
- **Squall tint:** `multiply #A9BCCB 0.16` → `source-over` `ice` at 0.10 (reads the same, removes the third composite switch); flakes drawn in 3 alpha buckets (`i % 3`) with one `globalAlpha` each.
- **HUD icon atlas:** `S.icon` looks up `name@size` in an atlas baked at the sizes the HUD/sheet/goals/pills use (10, 12, 16, 22, 24, 28, 30, 32, 34, 36); a miss falls back to the vector path. Removes ~10 save/scale/restore and ~40 path ops per frame.
- **Alpha quantisation:** particle `globalAlpha` rounded to 1/8 so same-paint runs batch (Skia).
**Low-end fallback:** none needed.

### 5. Character appeal pass (110 LOC) - FRAME, ±2 fills per character
**File:** `21_art_chars.js`. Silhouette rule unchanged (Kit = ears + tail, capy = loaf + snout, duck = ball + beak, Pon = hat, Kero = eye stalks, Tsuru = neck, Momo = crown); the smoke page's 50 % ink row is the acceptance test, now including Tsuru and Momo.
- **Capybara (the star):** body stays 44 × 26. Muzzle plate `mix(capy, cream, 0.35)` rrect 16 × 11 r 5 at the front with two nostril dots `capySnout` r 1.4; the snout brick becomes a nose pad 10 × 7. **Eyes r 3.2 → 4.0** with the existing catch-light and a 1 px `capyDark` upper-lid line; both eyes on the front half of the head. Ears r 4 → 5 with inner ear `capySnout` r 2.5, far ear 1 px lower. Belly stripe `mix(capy, cream, 0.2)` ellipse 24 × 8 along the bottom; 1.5 px `mix(capy, cream, 0.45)` rim light along the top edge (matches item 1's light). Thickness band 3 → 4 px.
- **Kit:** stroke ears and legs (3 strokes), inner-ear cream triangles, tail root 6 px with a r 4.5 cream tip, muzzle anchored at y −37 overlapping the head by 2 px, headband dot moved to the band's side, **6° lean into the run direction** (`rotate` in `begin` when `moving`, pivot at the feet), ears flatten (height × 0.8) above 300 px/s, direction-reversal squash `sx 0.9` for 0.12 s.
- **Duck:** thickness band (`duckLine` at +3 y), orange cheek, feet as 3 px wedges, wing stroke. **Pon:** belly shade. **Kero:** 3 px scarf tail lagging like Kit's tail. **Tsuru:** legs 2.5 → 4 px, neck 5 → 6 px, beak +1 px, slow blink. **Momo:** `monkeyFace` cheeks at 0.5, `coinRim` edge on the crown, 4 px band.
- **Motion (hash-seeded, zero allocation):** landing squash with overshoot at the four call sites (Player, Guests line 100, Trail, Helpers): `sx = 1 + 0.15·sin(π·u)·(1−u)`, `sy = 2 − sx`, plus a 0.05 stretch at the tail; hop anticipation in `fillPose`: `hop.t/dur < 0.5 → sy 1.08, sx 0.94`, after → `sy 0.96, sx 1.04`; breathe `sy = 1 + 0.02·sin(t·2π/1.4 + id)` for idle/waiting guests; blink `lid = 3` while `(t + hash(id)·4) % 4 < 0.1`; ear twitch every ~6 s (ear rotates 15° for 0.2 s); **happy eyes** for 0.4 s after a heart (`g.happyT`; `eye()` draws two 2 px arcs when `POSE.happy`). In water: hat and ears stay above the band, the nose dips 2 px on the sink.
**Low-end fallback:** Minimal keeps blink only; everything else is a transform, not paint.

### 6. Guest sprite cache (160 LOC) - BAKE sheet at init/resize/season/tier, FRAME 1-3 blits per guest
**Files:** `21_art_chars.js` (`Ch.spriteCache` replaces the stub), `33_guests.js` / `32_trail.js` / `35_baths.js` draw paths (through `Ch.guest`), `45_render.js` `onResize` (rebuild hook), `04_seasons.js` palette apply (rebuild hook).
- **One art path:** the baker sets `setTransform(sdpr, 0, 0, sdpr, ox·sdpr, oy·sdpr)` on an offscreen canvas and calls the existing `Ch.capy` / `Ch.duck` / `Ch.momo` with a pose, so the smoke page and the game cannot drift.
- **Cells:** per kind (capy, duck, momo) × dir {side, down, up} × 5 frames (idle + 4 walk frames with leg offsets quantised to −2, −1, +1, +2; stop-motion suits paper cutout) = 15 cells, each ≤ 64 × 64 logical; hats (`yuzu`, Season 2 variant via `Ch.hats`) 2 cells; the 1.5 px rim light from item 5 is baked in. Live on top: eyes + catch-lights + lids/happy arcs (≤ 6 tiny fills), blush (2), shiver tint rect, scarf. Mirror with `scale(−1, 1)`; squash/stretch = blit scale about the feet; bob = translate; **snap blit x/y to multiples of 1/sdpr**. `imageSmoothingEnabled` stays on.
- Kit, Pon, Kero, Tsuru stay vector (one or two on screen, posed). Silhouettes keep the vector path.
- **Memory:** at sdpr 1.6 a capy cell is ~102 × 90 px × 4 B = 37 KB; 3 kinds × 15 + 2 hats ≈ 1.7 MB; ≤ 3 MB at sdpr 2. Rebuilt only on sdpr change, season apply, or tier change (blush/catch-light presence); rebuild count after 300 s of play must be 0.
- **Result:** 40 guests ~1,400 path ops + 40 save/restore → ~400 ops + 40 `drawImage`. Enabled on every tier (baked strokes land on device pixels = crisper).
**Low-end fallback:** this is the fallback. If mirrored `drawImage` misbehaves on an old WebView, bake both faces (2× memory, still < 4 MB).

### 7. Static tiles + tiered DPR cap (45 LOC) - engine
**Files:** `45_render.js` (`staticCanvas` → `tiles[]`, `rebuildStatic`, `frame` blit), `13_canvas.js` `resize`, `00_config.js`.
- **Tiles:** 4 tiles of 630 logical px covering −120 … 2400; each tile canvas is `ceil(540·sdpr) × ceil(630·sdpr)` (1008 px tall at sdpr 1.6, 1437 at the iPad's 2.28). `rebuildStatic` loops tiles with the same `setTransform` trick and the same draw list; `frame` blits the 1-2 tiles the camera sees, still 1:1. Debug assertion at rebuild: every tile height ≤ 4096 device px.
- **DPR cap recommendation:** `Canvas.dprCap` per tier: **Full 2.0 (no `DPR_WIDE_PX` rule), Lite 1.5, Minimal 1.25.** On the user's iPhone this moves sdpr from ~1.1 to ~1.5 (visibly crisper text and strokes) at +78 % fill, which the iPhone absorbs; the detector drops it to Lite if frameMs > 22 for 2 s. On a 720p 2019 Android (360 css × dpr 2) Full stays sdpr 1.33, Lite 1.0, Minimal 0.83. `Game.updatePerf` and the settings row call `Canvas.resize()` on a tier change (it already triggers `Render.onResize` → static + sprite rebuild). Static cache at Full on a phone ≈ 10 MB (4 tiles), at Lite ≈ 6 MB, at Minimal ≈ 4 MB.
**Low-end fallback:** the tier IS the fallback; tiles are mandatory on all tiers and ship before the Full cap changes.

### 8. The painted mountain (140 LOC) - BAKE only, inside `Render.rebuildStatic`
**Files:** `22_art_world.js` (`W.terrain` → `W.ground(ctx, y0, y1, S)`, `W.lane`, `W.ridgeTerrain`, `W.stoneLantern`, `W.rocks`, `W.cable`), `45_render.js` (passes `S`; it already does for decks). All hash-driven (`U.hash`), never the seeded RNG.
- **Value gradient (one `createLinearGradient` per rebuild):** `pine` at the platform (y 2100) → `mix(pine, pineDark, 0.35)` at y 1150: lighter near the camera, darker toward the mountain. The Ridge gets the inverse (brighter snow toward its top under the mist).
- **Grass instead of blobs:** delete the 26 dark ellipses; draw ~600 tufts (2 px lines, 5-9 px long, slight lean) in two greens `mix(pine, pineDark, 0.5)` and `mix(moss, cream, 0.15)`, density falling to zero inside aprons and never on the lane; 10 large low-contrast patches (rx 90-140, `mix(pine, pineDark, 0.35)`) for the big shapes; moss only along the lane edges and deck feet; flowers 40 % fewer.
- **Aprons (the inn is lived in):** for every built deck/station footprint (`DATA.BATHS[].deck`, `DATA.STATIONS`, lantern steps) an ellipse `w + 70 × h + 50` of `mix(pine, cedar, 0.18)` at 0.55 with 8-14 pebbles (`stone`/`stoneDark` 3-5 px) on its edge; left column (nature) gets clover and 3-bloom clusters, right column (built) gets `stoneDark` 2 px gravel speckle. Rebuilt on `build` (already marks static dirty).
- **Lane:** replace the translucent strip + dots with irregular stepping stones every 34-42 px: `rrect` 26-34 × 14-18 r 7, `stone` top over a 3 px `stoneDark` thickness, a 1 px cream rim top-left, grass between. On the Ridge the same stones carry a `snow` cap on the top third and an `iceShade` shadow; **footprints** (pairs of 4 × 6 `snowShade` ellipses every 22 px) between stones.
- **Needle litter** under each `MAP.PINES` entry: a 40 × 14 ellipse of `mix(pineDark, cedarDark, 0.4)` at 0.5 with 6 needle strokes.
- **Ridge:** drifts = `snowShade` ellipse offset (+3, +3) under a `snow` ellipse with a 2 px white glint top-left; exposed rock as `rrect` chunks with a dark underside; a cold vignette baked over the whole Ridge (one `multiply` fill of `ridgeStone` at 0.10, bake time only).
- **Bridge blend (y 980-1220):** 120 px band of alternating snow patches creeping into the green and moss patches into the stone (10 each side), ragged snow line.
- **Contact shadows** (item 1's offset) under rocks, stone lanterns, pylons, the platform and the lift platform (pines, trees, decks already have them). **Cable sag:** both cables become quadratic curves sagging 10 px between pylons (cabins keep their y).
- **Stone lanterns** redrawn at 1.4×: wider roof (tri base 30), dark window (`ink` 0.6 rrect 8 × 7), stone base; remove the two at y 1980 (they fight the platform); at night the window keeps the amber circle.
- **Paper grain:** one 64 × 64 tile of hash dots in two shades at alpha 0.035 applied once with `createPattern` over each tile at bake time.
- Static rebuild time logged; target ≤ 15 ms total (today ~5 ms).
**Low-end fallback:** none per frame. Minimal halves tuft count and skips the grain so an orientation-change rebuild stays ≤ 10 ms.

### 9. Water (110 LOC) - BAKE rim + 1 caustic tile + cold-rim sprites, FRAME ≤ 8 ops per bath, zero per-guest clips
**Files:** `22_art_world.js` `W.water`, `W.ripple`, `W.soakRing`; `35_baths.js` `drawGround`; `21_art_chars.js` `begin` (clip only when `p.inWater.clip`); `45_render.js` night block (smudge).
- **Rim** (6 px `stone` with the wet-stone ring: three concentric `rgba(ink, 0.18 → 0.06)` strokes) baked into the static cache per built bath (it is a deck feature). Live: the state fill (1 fillRRect) and the 3 px inner edge (1 stroke).
- **Two-tone fill:** base `waterHot` + an inset rrect (x0+6, y0+5, w−12, h−16, r 14) in `mix(waterHot, cream, 0.12)`: depth and sun from the top-left, 2 fills, no gradient. Variants: cold `waterCold` + a baked "frost rim" sprite per bath size (no `setLineDash` per frame); yuzu `waterYuzu` + `amberDeep` edge; plunge `ice` + white edge.
- **Caustics (Full only):** one baked 96 × 48 tile of a soft two-tone net (`ripple` at 0.14) drawn twice with opposite slow scroll (t·6 and t·−4 px/s) inside the ONE rrect clip per bath that already exists (line 248); the sweeping light triangle and the three ellipses are dropped (they are what reads as a swimming pool); the foam line stays.
- **Waterline bands instead of per-guest clips:** `Baths.drawGround` draws the back row, then a "water over body" band (fillRect of the state colour at alpha 0.82 from the back row's waterline (`w.y − 6 + 2`) to the front row's (`w.y + 16 + 2`)), then the front row, then the front band to the pool's bottom edge. Bodies show faintly under the water (a wet look for free); 14 rect clips + 14 save/restore → 2 fills per bath. Hats sit above the line (y −38). Sauna: the band is the dark wood at 0.6 (reads as the bench); pavilion: no band, guests fully visible on the mat; plunge: `ice` band. Soak rings, floating yuzu and bubbles draw after the bands. `Ch.begin` keeps the clip path only for a future three-row bath (`inWater.clip = true`).
- **Soft ripples:** a baked soft ring sprite (alpha, scale) replaces the 2 px stroked ellipse in `W.ripple` and `FX.ripple`. Soak rings r 14 → 11, 2 px, hidden while a chain pop is live over that bath.
- **Lantern smudge (night, Full/Lite):** for each lit lantern within 120 px of a pool, one `cream` ellipse rx 30 ry 10 at alpha 0.15·fade on the water, wobbling ±2 px. Counted inside `HALO_MAX`.
**Low-end fallback:** Lite = two-tone + rim + band (no caustics, no smudge); Minimal = two-tone + band, ripples only on plops.

### 10. Soft FX sprites, splash crown, impact flash, plunge frost (90 LOC) - BAKE 6 sprites, FRAME blits
**Files:** `23_art_fx.js` (`FX.steam`, `FX.part` kinds `crown`, `flash`, `frost`), `24_fx.js` (`Bus.on('splash'|'plunge')`), `G.Art.Sprites` registry (built in `Render.init` and on sdpr change).
- **Sprites:** steam puff 64 (radial `cream` 0.9 → 0), cold puff 64 (`ripple` → 0), dust/puff 64 (denser cream), wash puff 256, splash crown 96 × 64 (7 cream droplets on an arc with a `ripple` tint and a 1 px cream highlight), frost burst 96 (6 ice shards + a white ring), soft ring 64.
- `FX.steam` = one `drawImage` with `globalAlpha = p.alpha·(1−k)` quantised to 1/8 and size `r·(1.2 + k·1.4)`; the steam pool is drawn in 8 alpha buckets (8 passes over ≤ 60 items, no sort). The rush wash = 6 blits of the 256 px puff. Steam goes from hard discs to soft plumes: the single biggest "finished" cue in the bath scene.
- **Crown on every plop:** scale 0 → 1.3 → 1 over 0.22 s (easeOutBack), alpha 1 → 0 in the last 40 %, anchored 6 px above the plop point; peaks at t = 0.08 s to sit on the `splash` noise burst. **Impact flash:** a `cream` ellipse rx 26 ry 12 at alpha 0.5 → 0 over 0.15 s in the ground pass. x4 = two crowns; x5+ = crowns on every seat + the existing shockwave ring in `cream` → `ripple` + the bath fill flashes cream at 0.5 for 80 ms (one extra fillRRect for 5 frames).
- **The 1.4 feel budget is untouched:** bump 4/6/8, hit-stop on x3 and x5, x5 confetti + flash, `SPLASH_PUNCH` stays all-zero (phone verdict). The crown and flash are pictures, not shake.
- **Plunge:** frost burst scales in; HOT-COLD adds the existing 90 px ring (now the soft ring sprite) plus a 0.2 s `ice` wash at 0.25 over the plunge deck only (one rect); 4 cold-puff blits; ice cubes jump 8 px.
**Low-end fallback:** Lite keeps the crown (it is the game's joy) and the flash, halves droplets, drops the x5 water flash; Minimal = crown only, no droplets.

### 11. Lighting ramp (70 LOC) - BAKE sprites, FRAME blits counted inside `HALO_MAX`
**Files:** `45_render.js` night block and `buildHalo`, `43_events.js` (`night:start`), `22_art_world.js` `W.mist`, `W.saunaBody`.
- **Warm halo rebake:** three stops `coinHi 0.9 → amberDeep 0.35 → 0`; lit lamps look like flames, not yellow discs. Same blit cost. A second flattened variant (ry = 0.37·rx) is the **ground light pool**: one blit under each lit lantern and the boiler (rx 60, alpha 0.18·fade) in the ground pass before the posts, so light lands on the deck and the lane between lamps stays dark. Pools + halos + smudges share the one `HALO_MAX` budget (8 Full / 4 Lite / 2 Minimal): nearest to Kit first.
- **Dusk pass:** while `night.fade` is between 0 and 1 (the existing 2 s), a `skyDusk` multiply at `0.18·sin(π·fade)` before the indigo tint: a warm sunset passes over the inn on the way in and out. One fill, only during fades.
- **Night ignite:** on `night:start`, lit lanterns flare bottom → top 0.1 s apart (`lanternFx.flash = 1` through a stagger timer); stone lantern windows bloom with the fade. Audio: `tick` at low gain per lantern, spaced inside the 6-voice cap.
- **Ridge mist and sky:** bake one 320 × 90 soft `mist` ellipse; draw 3 at the Ridge top and 2 in the chasm, drifting `sin(t·0.15 + i)·40` px at alpha 0.3, only when the camera sees the band; at night 20 hash-placed 1.5 px stars in the mist band at alpha 0.6·fade.
- **Sauna hut:** a 10 × 8 `amberDeep` window that flickers (one fill) and a chimney steam emitter (reuses `FX.steam`, 1/s).
- Fireflies: deferred (adds `lighter` blits at the tightest moment for little gain).
**Low-end fallback:** Lite = 4 total night blits, mist static (2 bands); Minimal = 2 halos, no pools, no mist, source-over tint 0.28.

### 12. Title sign, transitions, draw bench + audit (150 LOC)
**Files:** `53_title.js`, `14_camera.js` (`Camera.script`, `Camera.zoomFrom`), `90_main.js` (a `cine` mode that pauses the sim like a card), `52_cards.js`, `24_fx.js` (`ridge:open`, `build`), `51_sheet.js`, `54_dev.js`, new `test/draw_audit.js`.
- **Title backdrop (BAKE once at sdpr):** sky gradient `skyDay → cream`, three mountain silhouettes (`pineDark` / `pine` / `moss`) with a mist gradient between layers, a sun disc, the lit inn when the finale lantern is lit. Replaces the murky `ink` 0.42 dim over the live map (the live map keeps drawing underneath only for the hero's ground).
- **Logo = a hanging wooden sign:** `S.plate` 360 × 120 `cedar`/`cedarDark` with two rope strokes and a koban glyph; "CAPY" in `cta` (64 px) and "SPRINGS" in `amber` (52 px) on it, **unstroked** and baked into the backdrop with the sign (the chunkiness comes from the sign, so it does not depend on Arial Rounded MT Bold, which is absent on Android and Windows). Six drifting steam puffs via the item-10 sprite; the camera drifts ±18 px on a 9 s sine; Kit waves, the hat-capy blinks. Boot screen (CSS) gets the same sign in two lines. PLAY stays vermilion.
- **PLAY → play:** iris wipe centred on Kit (one arc `clip`, 0.7 s easeInOut) + `Camera.zoomFrom(1.06, 0.6 s)` (5-line sibling of `Camera.punch`); Minimal uses the existing cream fade. Audio: `whoosh` at gain 0.3.
- **Stage reveal (the template for every future area), `Camera.script = { y0, y1, up, hold, down, t }` overriding `target()`, input ignored, any tap cuts to the end:** 0.0 s the Ridge Bridge flame flares, "THE RIDGE OPENS!" slides in, `fanfare` · 0.3 s the sim pauses (`cine`), the camera starts up the bridge · 1.9 s it lands on the Ridge top (easeInOut); the mist blobs part (alpha 0.3 → 0.1 → 0.3); the Sauna and Plunge offering steps light their lamps 0.2 s apart with the item-11 flare; confetti at both bridge ends (exists) · 2.7 s the hold ends, the camera sweeps back over 1.2 s, `bell` once · 3.9 s the sim resumes; the arrow points at the bridge with LEAD/LIGHT as the rules decide. A 0.9 s short sweep plays when a deck-sized structure unwraps off-screen (sauna, pavilion). The same script is the visual half of any future ending (banner "THE MOUNTAIN IS LIT", climb to y −40 with lanterns flaring bottom → top 0.08 s apart, night tint forced to 0.40, fireworks = `CONFETTI_BIG` + soft ring at the bridge foot / sauna / plunge / pavilion 0.4 s apart, hold 1.5 s on the lit Ridge with stars, return to Kit, a cream card "Famous on the whole mountain" with one CONTINUE; after it the stone lanterns stay lit by day via `W.stoneLanterns(c, true)` and the title shows the lit mountain) - the ending's rules are another brief; only the hooks are built here.
- **Small transitions:** build/unwrap = a 60 ms `cream` flash of the footprint (1 fillRect); cards = `Camera.z` 0.985 push-back while open; sheet = `ink` 0.18 dim above the sheet (1 fillRect) and a 0.15 s cream 0.15 echo across the sheet on a purchase.
- **Draw bench (dev panel button "Draw bench"):** forces a dense state (light all, night, rush: the cheats exist), runs `Render.frame` 120× with `performance.now()` marks per pass (`Render.marks`, filled only while `Render.bench`), prints ms per pass to the overlay (`bench: static 0.4 ground 1.2 sorted 3.4 fx 0.8 night 0.9 text 1.1 ui 0.7`) and `console.table`. Built right after stage A2 so every number below is measured on the user's iPhone and one cheap Android before Tier B.
- **Headless draw audit (`test/draw_audit.js`):** a recording 2D-context stub counting calls per method; drives seed 7 to 600 / 1800 / 3000 s with night + rush forced and asserts the ceilings in section 6.

## 2. Style bible additions (GDD §11.2 / §11.5)
- Light from the top-left: shadows (+4, +2), rim light on top-left edges of plates and bodies, thickness band at the bottom. Three value layers per frame: darker far ground → mid-value inn plates → light characters and steam.
- Outlines: characters get one 2 px stroke in their dark on head, body and ears (not legs/tails) and a 4 px thickness band; ducks keep `duckLine`; world objects have no stroke, only the band and the paper edge; UI has no outline, a 1 px highlight and a 3 px drop. Nothing else is outlined.
- Colour rules: the yellow family = money / yuzu / glow only; CTA vermilion = calls to action only; everything Kit builds is cedar + cream + red; the Ridge's own colour is cold stone + snow + ice; the bridge band blends the ground, never the buildings. Walker/ground contrast ≥ 1.5:1 everywhere a walker walks.
- Readability floor: 4 px features, 13 px text, 56 px taps; stroked text only for pops and the arrow word; everything else pill-backed or baked.
- Water is the brightest saturated area by day; at night the lamps are. Nothing but the CTA may be more saturated than Kit.

## 3. Player-facing strings (complete)
- Settings row: **"Effects"** · values **"Full" / "Lite" / "Minimal"** · sub-line **"Lite switches on by itself on slower phones"** / when auto-set **"picked for a smoother game"**.
- Dev panel button: **"Draw bench"**. Debug overlay (not player-facing): the counter and bench lines above.
- Lantern names, blurbs, costs, step order, effects: unchanged (the blurb only grows from 11 to 14 px on its baked card). Banners, tutorial words, pops: unchanged. Optional ending hooks use **"THE MOUNTAIN IS LIT"** and **"Famous on the whole mountain"** / **CONTINUE** only if the ending brief adopts them.

## 4. Audio notes (all synth, no files)
Dusk pass: the existing `chime` at gain 0.5 a fifth lower, once at fade-in. Crown splash: no new sound (the `splash` + `plink` ladder is the sound; the crown peaks at 0.08 s on it). Frost burst: existing `sizzle` + `shiver` blips. Iris wipe: `whoosh` gain 0.3, 0.4 s. Stage reveal: `fanfare` on the hold, `bell` once on the way back. Night ignite: `tick` at low gain per lantern, ≤ 8 across 1 s inside the 6-voice cap by spacing. Blink / breathe / twitch: silent.

## 5. Risks and their guards
- All ms figures are working estimates until the bench runs (stage A2 → bench before B1).
- Touching `S.shadow` / `S.plate` / `S.pill` changes every drawer at once: the smoke rows and the 12 re-captured case-study screens are the acceptance test, not the harness.
- The palette shift (pine, capy) changes a look the user has seen for weeks: stage A1 ships alone and asks.
- Bigger eyes and the muzzle plate can soften the loaf: the 50 % ink row and a phone playtest gate item 5 before it is baked by item 6.
- Sprite swim/blur: snap to 1/sdpr, verify with the baked-vs-vector pixel-diff row. Mirrored `drawImage` on old WebViews: bake both faces if needed.
- Season 2 recolours the palette and hats: bake sprites after the pack applies and rebuild on season apply.
- Waterline bands change layering for hats, rings and bubbles in every bath look: check sauna, pavilion, plunge on the smoke page before B2.
- Baked text depends on the resolved font: bake after the first frame, rebake on resize, never on the boot screen.
- Night blits: pools, smudges and halos share `HALO_MAX` so low-end frames never drop during the prettiest event.
- Memory on 2 GB phones: static tiles ≈ 10 MB at Full on a phone, sprites + atlases ≤ 4 MB; Minimal's 1.25 cap cuts the static cache to ~4 MB.
- The DPR raise to 2.0 happens only in stage B3 after tiles, and only on Full.

## 6. Harness checks
1. `npm test` (both seasons + fuzz) and `node test/headless.js` seeds 7/3/11: balance CSV, beats, `S.stats` and `earned` at 30 min byte-identical to 1.10.0 (nothing here touches the simulation).
2. `test/draw_audit.js` (headless recording ctx, seed 7 at 600 / 1800 / 3000 s with night + rush forced), per frame on Full: `clip <= 4` (one per bath for caustics, ≤ 1 iris), `setLineDash == 0`, `createLinearGradient + createRadialGradient == 0`, `strokeText <= 20` (pops ≤ 16 + arrow word + spare), `save <= 60`, composite assignments ≤ 4, path ops (fill + stroke + fillText) ≤ 1,100 Full / ≤ 700 Minimal, `drawImage >= guests on screen`.
3. Palette contrast (pure math): every `GUESTS` body colour × {pine, moss, lane stone, cedar, stone, ridgeStone, snow} ≥ 1.5:1; Kit ≥ 1.8:1. Grep: no `'#` literal outside `01_palette.js` except the three white/black constants.
4. Sprite cache: after `Render.init` every `GUESTS` kind with `art` has 15 cells ≤ 64 × 64 logical; total cache bytes ≤ 4 MB at sdpr 2; rebuild count after 300 s of simulated play == 0; every static tile height ≤ 4096 device px at rebuild; static rebuild ≤ 15 ms logged.
5. Text floor: debug assertion `size >= 13` for every `S.text` outside the overlay and the title version line.
6. `test/art_smoke.html` new rows: ground swatches (Deck, bridge blend, Ridge) at 1× and 0.5×; the 7 characters idle / blink / happy / walk / in-water (band method) at 1× and 2×; the 50 % silhouette row incl. Tsuru and Momo; baked vs vector (same pose both ways, pixel diff ≤ 2 % of the box); every baked sprite at 1×; the UI kit (pill, cost pill, level pill, sheet row, kettle, banner, title sign); the contrast table printed. The page's error banner stays the fail signal.
7. Phone bench before and after each stage (`?debug=1` overlay, 5-minute session): worst-frame scene ≤ 12 ms on the user's iPhone at Full and ≤ 9 ms at Lite; ≤ 16 ms on a 2019 budget Android at Lite; the auto-tier never fires on the iPhone (tier shown in the overlay).
8. Re-capture the 12 case-study screens with `case-study/tools/capture.html` after stages A1, B3 and D and put them side by side in the smoke page footer.

## 7. Budget after stages A + B (same worst frame)
About 1,000 path ops, ~18 texts (pops + live pills), ≤ 4 clips, 0 dashes, ~25 save/restore pairs, 2 composite switches, ~120 `drawImage`: 9-14 ms on the weak phone by the working numbers, 4-6 ms on the iPhone. The static blit, the multiply tint and the halos are then the floor; Minimal's 1.25 cap lowers that floor by ~45 %.
