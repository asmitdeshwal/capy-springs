FINAL SPEC:
# Wake the Source — the Summit, the ending, and the Golden Age (final spec)

**Winner: Proposal 1**, because the brief asks first for "an ending that is satisfying and feels like the story is completed", and only P1 writes a story (Grandma Yuzu's notes by crow, the reunion, every character in the last scene) on top of mechanics that are pure role reuse. **Grafted from P3:** Source Stars that *turn the season* (the mountain repaints after the ending: the "big changes after the bridge part"), the endless star lantern (`endless: true`), the scored Festival Night with a best-ever card, the lantern drain cap, the `--from ending` harness flag, the stage-local LIGHT rule. **Grafted from P2:** the Records line, the strict "no card / no mode change in headless" rule, the bot stop condition, the monkey snow-cap. **Cut:** P2's gauge/surge and resident troop (a 4th system and a dead walk), P3's ropeway and lift factory (a second gondola is the Ridge again; the Troupe arrives cabin-less), P1's "Kaa has two jobs" (the note ribbon just draws `Ch.kaa`), P1's 8 finite Stars (now endless).

Three genuinely new systems: **(1) the Summit stage + Troupe arrivals**, **(2) the Geyser Burst**, **(3) the Finale + Golden Age** (Stars that turn the season, Festival Nights, the story ribbon). Everything else is data on existing roles. Target ≈ 2,100 new lines. `G.SEASON.finale` stays `'bridge'` (famousMult, markDone, the gold headband are untouched); the story's ending is a second id, `G.SEASON.ending = 'wake'`.

---

## 0. The story in five lines

Every bath on **Yuzu Mountain** is a trickle from one spring at the top: **the Source**, asleep under the ice for a hundred years. **Grandma Yuzu** (an old pale fox in a shawl, Kit's grandmother, the previous innkeeper) went up to tend it and left Kit the one-pool inn; she writes short notes that **Kaa the crow** carries down. The old saying: *every lantern you light is a breath on the Source.* Kit's arc: keep her inn alive → grow it up the mountain → reach her → wake the Source together. The finale is the reunion and the first soak, with everyone who ever helped; the game continues because an awake mountain is a busier mountain, not a finished one.

---

## 1. The story thread (exact strings; retrofit on existing milestones)

**Delivery: a note ribbon**, not a card. A cream paper strip 360×110 (r 12, ink text 14 px, up to three word-wrapped lines) slides down from under the HUD to y = 0.26·H, with `Ch.kaa` drawn perched on its top-right corner; holds **6 s**, a tap anywhere on it closes it early. **The sim keeps running** (never a mode change, never in the harness as UI; `Story.update` still marks `seen` and counts `stats.notes` headless). A note waits until `!S.ui.banner && S.t - S.splash.t > C.SPLASH_WINDOW && S.mode === 'play'`, then shows `C.NOTE_DELAY` **3.0 s** after its trigger. Queue of one; a second trigger waits. `S.story.seen[id] = true` persists (Save v3). Module `G.Story` in new `src/57_story.js` (~110 lines, incl. a 10-line word-wrap helper), data `G.DATA.STORY` in new `src/02_data_story.js`.

| id | trigger (existing bus event) | text (verbatim) |
|---|---|---|
| `cedar` | `lantern:lit` id `cedar` | `Kit — the inn is yours while I tend the Source up top. Keep the water hot. Kaa carries my notes. — Grandma Yuzu` |
| `ridge` | `ridge:open` | `The Ridge already? The snow up here bites. Build the sauna — the cold plunge after is the secret. — G.` |
| `pavilion` | `lantern:lit` id `pavilion` | `Tsuru came back! She once massaged the whole mountain. Fill every chair at the gong; she remembers. — G.` |
| `momo` | first `vip:arrive` | `The monkey with the crown is Momo. His troupe lives above the clouds. Be kind — he knows the way to me. — G.` |
| `summit` | `summit:open` | `Nearly here. The Source sleeps under the ice, and every lantern you lit is a breath on it. — G.` |
| `shrine` | `lantern:lit` id `shrine` | `That's my hut, the one with the smoke. Don't knock yet. The Source first — then come sit. — G.` |
| `letter` | the finale (a real card, §5 t=48) | `You did it, Kit. The whole mountain is steaming — I can see it from here. Come sit. The water's perfect. — Grandma` |

Notes 1–4 sit on milestones the game already has, so the ending is earned by the existing climb.

---

## 2. The Summit stage (y −1340 … −120, 1220 px = one phone screen, like the Ridge)

### 2.1 Data (`02_data_map.js`)

```
MAP.STATIC_Y0 = -1340
MAP.SUMMIT = {
  y0: -1340, y1: -120, camMinY: -1340, boundsY0: -1230, laneY0: -1230,
  mist: { y0: -1420, y1: -1260 }, exit: { x: 270, y: -1250 },            // Summit guests leave into the sea of clouds
  chasm: [[0, -260, 238, -110], [302, -260, 540, -110]],                   // solid cloud-edge drops either side of the stairs
  stairs: { x: 270, y0: -260, y1: -110, w: 60 }, torii: { x: 270, y: -275 },
  mill: { x0: 320, x1: 440, y0: -800, y1: -750 },                          // Source leavers wait here for the Snow Roll
  hut: { x: 120, y: -900, w: 120, h: 90, door: { x: 180, y: -880 }, perch: { x: 120, y: -978 }, bell: { x: 172, y: -932 } },
  waterfall: { x: 462, y: -600 },                                          // frozen cascade 90x160 (decor); runs and steams once awake
  vents: [[330, -700], [200, -1100], [470, -1130], [90, -1160]],           // ground vents: one steam puff every 8 s each (decor)
  pines: [[40, -400], [500, -400], [30, -700], [510, -720], [60, -1040], [40, -1290], [500, -1290]],
  rocks: [[90, -660], [450, -680], [170, -1010], [520, -1040], [60, -1110], [380, -1250]],
  stoneLanterns: [[210, -760], [330, -760]]
};
MAP.TROUPE = {
  platform: { x: 270, y: -1180, w: 300, h: 56, cap: 10, mill: { x0: 130, x1: 410, y0: -1205, y1: -1160 }, exit: { x: 270, y: -1250 } },
  from: { x: 270, y: -1300 }, whistle: { x: 110, y: -1150 },
  period: 20, periodNight: 12, periodFestival: 10, guests: 6, goldenEvery: 5, goldenGuests: 12, warn: 3, hopGap: 0.3
};
MAP.SNOW.spotsDeck = [[270, 1300], [270, 1600], [120, 1990], [420, 1700]]   // winter only (§6.1)
```

Top to bottom on screen: the sea of clouds (mist band), the **Troupe Ledge** under a cliff face, **Grandma's hut** (left) and the **Source Pool** with its **geyser cone** (right), the **Wake the Source** stone lantern between them, the **Snow Roll** (left) and the frozen waterfall (right), then the cliff with the **Pilgrim Stairs** and the red torii as the only crossing. Lane x 240–300 continues from y −120 up to −1230, same stepping-stone rule.

### 2.2 `G.Summit` (new `src/56_summit.js`, mirrors `47_ridge.js`; nothing in Ridge moves)

- `Summit.open(S, opts)`: `S.built.summit = true`, `markStaticDirty`, `markSolidsDirty`, emits `summit:open` unless silent. Effect kind `open:summit` in `Lanterns.applyEffect` (`else if (kind === 'open') G.Summit.open(S, opts)`), so a load re-derives it silently.
- `Summit.isOpen`, `Summit.minY(S)` (−1340 when open, else `Ridge.minY`), `Summit.boundsY0(S)` (−1230 when open, else `Ridge.boundsY0`), `Summit.exitFor(S, g)` (open and `g.y < SUMMIT.y1` → `SUMMIT.exit`, else `Ridge.exitFor`). Readers switch from `G.Ridge` to `G.Summit` at the call sites: `Camera.minY`, `Player.update` bounds, `Player.solids` (adds `SUMMIT.chasm` when open), `W.mist` (band = `SUMMIT.mist` when open), `Guests.leaveImpatient / pay / stall`, `Save.apply`'s Kit clamp. Ridge guests keep leaving at (270, −40) (they stop and fade at the stair foot; zero code).
- `Camera.maxY`: a second blend across the stairs so the Summit never shares the screen with the Ridge: `t2 = clamp((kit.y - (SU.y1 - 110)) / 150, 0, 1)`; `maxY = max(minY, lerp(SU.y1 - H, ridgeMaxY, t2))` when `built.summit`.
- Opening beat (`summit:open`): banner `THE SUMMIT OPENS!`, `fanfare` + `chime`, confetti BIG at (270, −110) and (270, −275), flash 0.3, `Camera.shake(6, 0.4)`, the mist lifts, the camera clamp moves up. Note `summit` follows.
- **Static cache per stage** (mandatory with this build, `45_render.js`, ~50 lines): three canvases `[{y0:-1340,y1:-120},{y0:-120,y1:1100},{y0:1100,y1:2400}]`, each built with the same draw list under its own `setTransform(s,0,0,s,0,-y0*s)`; `Render.frame` blits the one or two that intersect `[cam.y, cam.y+H]`. Harness asserts each canvas area ≤ 1080 × 2600 at sdpr 2 (iOS canvas limits).
- `C.MAX_GUESTS` 48 → **64**, `C.MAX_DRAWABLES` 150 → **200** (BUBBLES sizes from MAX_GUESTS).

### 2.3 The Troupe (snow monkeys; the Summit's arrival rhythm, cabin-less)

- `DATA.GUESTS.monkey = { pay: 12, walk: 140, patienceWait: 30, patienceTrail: 20, soakMult: 0.75, gap: 26, w: 36, h: 36, bobHz: 1.5, art: 'monkey', voice: 'chatter' }`.
- `G.Troupe` (in `56_summit.js`, ~70 lines): runs once `S.built.source`. Phases `away` (timer = period − warn) → `warn` (3 s: `troupe:warn` event, `whistle` sfx, the whistle post's ring pulses like a bell post) → `drop` (spawns `toSpawn` monkeys one per 0.3 s with `Guests.spawn(S, 'monkey', carId, golden, TROUPE.from.x, TROUPE.from.y, 'summit')` — the existing hop arc from the cliff onto the ledge; `Guests.spawn` learns area `'summit'` → `millRect = TROUPE.platform.mill`) → `away`. Period 20 s (12 at night, 10 in a festival). Spawn only what fits (`cap − countWaiting(S, 'summit')`). Car ids from **200000** (`S.troupe.index` persisted like `lift.index`), `carLog` entry when n ≥ FULLCAR_MIN so **FULL TROUPE** reuses the FULL CAR code (HUD: `evFull.carId >= 200000` → banner `FULL TROUPE!`). `stats.troupes++` per drop.
- **Momo's Troupe**: every 5th troupe is golden: 12 monkeys, pay ×1.5 (`golden` flag, GOLDEN_PATIENCE ×2), and **Momo steps down last** (`vip:arrive` emitted with `e.troupe = true`; HUD shows `MOMO'S TROUPE!` instead of `MOMO THE VIP!`; FX/Audio/Goals react as today). `stats.momoTroupes++`. Momo's night ride on the Ridge Lift is unchanged.
- Monkeys only arrive at the Summit until the ending; after it (§6.4) they also ride below.

### 2.4 The Source Pool and the Geyser Burst (new system 2, in `G.Baths`)

Bath def (`02_data_stations.js`):
```
{ id: 'source', name: 'The Source', heated: false, slots: 9, maxSlots: 12, soak: 8, lantern: 'source', payMult: 3, look: 'source',
  sendsToPlunge: true, hintValue: 4.5, guestKind: 'monkey', geyser: { every: 24, dur: 6 },
  water: { x: 420, y: -905, w: 190, h: 110 }, deck: { x: 420, y: -900, w: 230, h: 170 },
  exit: { x: 300, y: -860 }, tray: { x: 316, y: -840 }, lane: 290, coneAt: { x: 420, y: -1010 } }
```
Never cold, never rushed (it *is* the heat). Takes everyone wanting a bath (monkeys, Momo, and later anyone), takes yuzu.
- Runtime `bath.geyserT` (starts at `every`, counts down; a countdown ring on the cone drawn with the gong's ring recipe) and `bath.burstT`. At `geyserT ≤ 0`: `geyserT += every`, `burstT = dur`, `stats.geysers++`, emit `geyser` {bath}. **Burst presentation**: a steam column (`FX.steam` 20/s at the cone, r 14–22, rising; 5/s otherwise from the pool), 12 droplets, `FX.ring` 120, flash 0.15, `Camera.shake(6, 0.3)`, haptic 25, sfx `geyser`; the water uses the `ripple` colour and shimmers while bursting; banner `THE GEYSER!` the first time only. **The last 3 s before a burst show a pill above the cone: `3`, `2`, `1`** (numbers only) with three rising `tick`s (pitch 1.0 / 1.2 / 1.4).
- `Baths.land`: `g.burst = bath.burstT > 0` (burst baths only); `if (g.burst) stats.bursts++`. `Baths.payout`: `… * (g.hotCold ? C.HOTCOLD_PAY : 1) * (g.burst ? C.BURST_PAY : 1)` **inside the 6.0 cap**. `C.BURST_PAY = 2`.
- Chain pop in a burst (FX `splash` handler): when `e.g.burst && e.count >= 3` the chain pop reads **`SOURCE x9!!`** (`'SOURCE x' + count + '!!'`) in `PAL.amber` at 48 px, with the x5 tier's shake (8 px, 0.3 s), hit-stop 0.10 and small confetti regardless of count. The Summit's feel is "the biggest splashes in the game".
- Story tie: at every burst `Heat.add(S, 10, 'source')` on the Deck boiler (a puff at the boiler, `+10` label pop in amber: "the Source's breath reaches the boiler").
- The skill: the troupe lands every 20 s, the burst every 24 s with a 6 s window; the arrow says SOAK (rule 2 picks the Source by worth 4.5 once the Snow Roll exists), the cone's ring and the 3-2-1 pill tell the player whether to run or hold the line at the deck edge for two seconds. No new arrow word.
- Upgrades (`DATA.UPGRADES.source`, shared `BATH_TRACKS` copy): Soak base **300** max 6 · Seats base **400** max 3 (9 → 12) · Tips base **350** max 6. `Upgrades.valueAt` reads `def.guestKind` for the "N koban each" line (36 at level 0).
- Art: `look: 'source'` = a stone apron (no planks) with a dark rock ring (`PAL.stoneDark` ellipses) and cracks drawn once; water = `waterHot` with a lighter centre disc; the cone = a 50 px rock mound at `coneAt` with an amber glow window and the countdown ring. Basin `crack` (0 → 1) is a finale-only overlay (§5).

### 2.5 The Snow Roll (reuse: `plungeOnly` + the hot-cold window)

```
{ id: 'snowroll', name: 'Snow Roll', heated: false, slots: 3, maxSlots: 6, soak: 4, lantern: 'snowroll', payMult: 1.5, look: 'snow',
  plungeOnly: true, word: 'ROLL', guestKind: 'monkey',
  water: { x: 120, y: -580, w: 150, h: 90 }, deck: { x: 120, y: -580, w: 210, h: 150 }, exit: { x: 236, y: -540 }, tray: { x: 212, y: -518 }, lane: 250 }
```
- `Guests.update` pay branch generalises line 136: `if (bath.def.sendsToPlunge && G.Baths.plungeTargetBuilt(S, bath)) Guests.wantPlunge(S, g, bath)`; `wantPlunge` takes the sending bath's mill (`sauna` → `MAP.RIDGE.mill`, `source` → `MAP.SUMMIT.mill`) and area (`'ridge'` / `'summit'`). Set `sendsToPlunge: true` on `sauna` too (replacing the `def.sauna` test). Landing in the 8 s window = **`HOT-COLD x2!`** (unchanged pop and `C.HOTCOLD_PAY`), now with up to a ten-monkey line: x10 chains into a snowbank. `stats.plunges / hotCold` count rolls too.
- Hints rule 14 generalises from `S.baths.plunge` to **the nearest built `plungeOnly` bath**; its word = `bath.def.word || 'PLUNGE'`; tutorial key `ROLL` added to `S.tutorial` (shown twice). Rule 2 worth: `def.sendsToPlunge && plungeTargetBuilt ? (def.hintValue || 3.5) : payMult`.
- Art `look: 'snow'`: a cream snowbank rrect r 18 with a blue (#A9BCCB) thickness band and a glint; guests clip to the top 60 % like water; `FX.ripple` becomes 3 white puffs when `bath.def.look === 'snow'`; a monkey half-buried in snow with a yuzu hat is the Summit's shareable image.
- Upgrades (`DATA.UPGRADES.snowroll`): speed `{ label: 'Snow', base: 200, max: 4, title: 'Fluffier snow', blurb: 'Rolling is over quicker' }` · slots `{ label: 'Bank', base: 250, max: 3, title: 'Wider bank', blurb: 'More monkeys roll at once' }` · pay `{ label: 'Tips', base: 200, max: 6, title: 'Better tips', blurb: 'Every roll pays more' }`.
- `SHEET_STATIONS` += `'source', 'snowroll'`.

### 2.6 Grandma's Shrine and Kaa

- The hut is decor from the moment the Summit opens (a cedar hut 120×90, upturned roof with snow on the ridge line, a chimney with smoke every 2 s, a door that glows at night). Lighting `shrine` adds the bell under the eave, a paper lantern by the door, Kaa's perch on the roof peak, and turns on `DATA.KAA` on the main data: `KAA: { every: 60, nightEvery: 40, stay: 6, take: 5, share: 0.06, min: 15, max: 400, requires: 'shrine', r: 44 }` (`46_kaa.js` runs unchanged: he lands on the fullest tray anywhere, tap inside 6 s for 6 % of coins clamped 15–400, else he takes 5). The bot already taps him after 1.5 s. Dev "Kaa now" starts working.
- The hut is solid (`Player.solids` adds it when `built.summit`).

### 2.7 Grandma Yuzu (`Ch.grandma`, art only, ~30 lines)

A `Ch.kit` variant: fur `#D9A77A`, dark `#8F6B4A`, grey ear tips (`PAL.stone`), a cream shawl (rrect over the body with a `PAL.red` edge line), a hair bun (circle r 5 at (−6, −52)) with a pink dot (`#F2A7B6`), no headband, no tail lag, half-speed walk bob. Poses: `wave`, `sit`, `ring` (arm up). Before the finale she is **inside** the hut (only smoke and the door glow). After it she **sits at the Source's lane-side edge** at (322, −925), pose `sit`, and waves when Kit is within 120 px; during a Festival Night she stands at the shrine bell (150, −840) ringing it (`bellBig` every 15 s). One drawable in `56_summit.js`, zero simulation.

---

## 3. The ladder (offering steps; every purchase says what it does)

Added to `G.DATA.LANTERNS` (exact strings):

| id | label | step (x, y) | cost | requires | effect | blurb |
|---|---|---|---|---|---|---|
| `stairs` | `Pilgrim Stairs` | (330, −20) | 5,000 | `pavilion` | `open:summit` | `Opens the Summit above the clouds` |
| `source` | `The Source` | (480, −790) | 8,000 | `stairs` | `build:source` | `The spring itself: x3 pay, and the snow monkeys come` |
| `shrine` | `Grandma's Shrine` | (120, −790) | 6,000 | `source` | `build:shrine` | `Kaa keeps watch: tap him on a tray for koban` |
| `snowroll` | `Snow Roll` | (50, −470) | 10,000 | `source` | `build:snowroll` | `Hot monkeys want the snow: HOT-COLD x2 again` |
| `wake` | `Wake the Source` / `Source Star II…` | (205, −1030) | see below | `snowroll`, `shrine`, `bridge:5`, `trail:3`, `car:3` | `wake:0.10` | see below |

**`wake` is a levelled lantern** (the bridge's role), **endless** (`endless: true`): level 1 is the finale; every level ≥ 2 is a **Source Star** that turns the season (§6.1).
- `costs[0] = 25000`; `costs[i] = Math.round(40000 * 1.35 ** (i - 1) / 1000) * 1000` for i = 1..19 (20 levels): 25,000 · 40,000 · 54,000 · 73,000 · 98,000 · 133,000 · 179,000 · 242,000 · 327,000 · 441,000 · 596,000 · 804,000 · 1,086,000 · 1,466,000 · 1,979,000 · 2,671,000 · 3,606,000 · 4,869,000 · 6,573,000 · 8,873,000 (built in `02_data_lanterns.js` from the formula; the formula is the source of truth).
- `labels[0] = 'Wake the Source'`, `labels[i] = 'Source Star ' + ROMAN[i + 1]` (II … XX).
- `blurbs[0] = 'Every lantern is lit. Light this one.'`; `blurbs[i] = 'Turns the season to ' + ['spring','summer','autumn','winter'][i % 4] + '; +10% pay on everything'` for 1 ≤ i ≤ 10, and `'Turns the season to …'` alone for i ≥ 11 (the pay bonus caps at Star XI).
- Requiring `bridge:5` (Inn Fame V), `trail:3`, `car:3` makes "every lantern is lit" literally true and the arrow's LIGHT rule walks the player through the leftovers first.
- `Seasons.progress / missing` count an `endless` lantern as max 1 level (2 lines), so completion can reach 100 %.
- **Drain cap (from P3):** in `Lanterns.update`, `rate = min(max(C.DRAIN_MAX, cost / C.DRAIN_T_BIG), C.DRAIN_START * 2 ** (standT / C.DRAIN_DOUBLE_EVERY))` with `C.DRAIN_T_BIG = 8`, so a 25k step drains in ~11 s of standing instead of 62 s; the toss FX keeps its 0.06 s tick with bigger koban per toss.
- **LIGHT (rule 6) prefers Kit's stage**: among affordable lanterns, pick the cheapest on Kit's stage (same side of both crossings) if any, else the cheapest anywhere (3 lines; keeps the dead walks down now that steps span 3,700 px).

**Effect `wake`** (`applyEffect`): level 1 → `S.built.awake = true`; `S.built.sourceLit = true`; if not silent → `G.Finale.start(S)`. Level ≥ 2 → `S.year.season = (level - 1) % 4` (derived, never saved); if not silent → `G.Festival.starTurn(S, level)` (§6.1). `Upgrades.starMult = 1 + 0.10 * min(10, max(0, wake.level - 1)) + C.STAR_PAY * Seasons.stars()`.

**Spend to the finale** (from the Pavilion at ~44 min): Fame II–V 11,500 + trail:3 / car:3 1,300 + Summit ladder 29,000 + Wake 25,000 + Ridge/Summit tracks the bot buys ≈ 60,000 ≈ **125k**. Today's inn makes ~3k/min at 50 min; the Source (36 base per monkey, 6 per 20 s, x5+ chains, bursts) roughly doubles it, so the bot lights Wake at ≈ 78–85 min. A human runs 2–3× slower: several evenings with offline earnings between them.

---

## 4. Arrow, HUD and copy (exact)

- Banners: `THE SUMMIT OPENS!`, `THE GEYSER!` (first burst), `MOMO'S TROUPE!`, `FULL TROUPE!`, `THE SOURCE WAKES` (finale t=2.5), `THE GOLDEN AGE`, `FESTIVAL NIGHT`, `NEW BEST!`, `SUMMER COMES` / `AUTUMN COMES` / `WINTER COMES` / `SPRING COMES`, `THE TROUPE!` (the first troupe car below, once).
- Pops: `SOURCE x9!!` (burst chain, amber 48 px), `HOT-COLD x2!` (snow roll, unchanged), `NEW RECORD x13!` (replaces the chain pop when a best ≥ 6 is beaten), `+10` at the boiler on a burst.
- Cone pill: `3` `2` `1`. Arrow word: `ROLL` (twice); everything else unchanged.
- Ribbon (the HUD slot): `FESTIVAL 1,240` during a festival (a rush shows `STEAM RUSH x2` for 1 s first).
- Sign at the bridge (`W.sign`): `RIDGE` → `SUMMIT` once `built.summit` → `SOURCE` once `built.awake`.
- Sheet rows: §2.4 / §2.5; the Source's Tips line reads `36 koban each` at level 0.
- Title screen once awake: pill under the logo `The Golden Age · Summer · best festival 4,210` (season name capitalised; the festival part only when `festival.best > 0`); the hero gains a snow monkey in a yuzu hat at x 370.
- Settings gains a row `Watch the ending` (shown once `ending.seen`; `Finale.start(S, { replay: true })`, which changes no state).
- Guestbook header line once awake: `Best splash x13 · Best festival 4,210`.
- Offline card once awake: the cars line becomes `The Source kept the baths warm`.
- Kit's headband after the ending: gold with a cream centre stripe; the stripe's dot colour steps per Star: coin → cream → `#8EE3DC` → `#F2A7B6` → moss → amberDeep → red → cream (then repeats).
- Dev panel actions: `Open the Summit`, `Finale now`, `Festival now`, `Turn the season`.

---

## 5. The finale (new system 3a, `G.Finale`, new `src/58_finale.js`, mode `'finale'`, ~70 s, skippable)

Trigger: the last koban drops into Wake the Source (`Lanterns.light` → `applyEffect 'wake'` level 1 → `Finale.start(S)`). **The sim pauses like a card** (`S.t` does not advance; guests freeze mid-soak, nothing is lost); `Game.step` runs only `Finale.update`, `FX.update`, `HUD.update`; `Game.syncMode` leaves `'finale'` alone (added to its early-return list). The HUD, joystick, pills and arrow hide; `Camera.y` belongs to the script (`Camera.update` is not called). Input is ignored except: **a tap after 6 s skips to the credits (t=54); a tap during the credits skips to the end card (t=74)**. Reload mid-finale: `wake.level ≥ 1 && !S.ending.seen` → on PLAY `Finale.start(S, { resume: true })` begins at t=30 (the gathering). **Headless:** `Finale.start` applies the Golden Age instantly (`built.awake`, `ending.seen = true`, `stats.finales++`, emits `finale:done`, starts the first Festival Night) with no mode change.

Cast actors are a data table in `58_finale.js` (`{ who, x0, y0, x1, y1, t0, t1, pose }`), drawn with the existing `Ch.*` drawers through `Finale.collect(S, list)` so they depth-sort with the world; they are not `S.guests`. New poses: Kit `sit` (legs folded forward over the deck edge, body 6 px lower, tail curled; ~8 lines), Tsuru `fly` (wings as two cream 24×7 ellipses rotated ±0.5 flapping at 10 Hz, legs trailing; ~8 lines), Grandma §2.7, `Ch.monkey` = `Ch.momo` with `p.plain` (no crown, no gold outline, fluff `#C9C2B6`, scale 0.85, a cream snow-cap arc while waiting on the ledge; ~10 lines).

| t (s) | what happens | FX / audio |
|---|---|---|
| 0.0 | The flame flares white-gold; the world holds; Kit fist-pumps | hit-stop 0.15, flash 0.35, `gong` + `chime`; the pad layer ducks to 0.02 |
| 0.5 | A low rumble; the ice on the Source basin cracks (`crack` 0 → 1 over 2 s, drawn over the water); the cone glows | `Camera.shake(6, 2.5)`, sfx `rumble` |
| 2.5 | **THE BURST**: `bath.burstT = 999` (bursting until the finale ends), 60 steam circles over 2 s, 30 droplets, rings 120 and 200, the water turns gold (`yuzuT = 999`), banner `THE SOURCE WAKES` | flash 0.35, shake 8/0.5, `geyser` + `whoosh` + `fanfare` |
| 4.0–24.0 | **The wave**: the camera pans down the whole mountain, y −1340 → `MAP.H − H`, ease in-out over 20 s. A sorted list of wake points (every built bath, the boiler, every lit lantern, every stone lantern) fires as the camera's centre passes its y: baths burst 10 steam + a halo flare; lanterns `lanternFx.flash = 1` + a `tick` at rising pitch (1.0 → 2.0 across the list); the boiler `heat.v = heat.max` + its halo; the frozen pond on the Ridge thaws (static rebuild with `built.awake`); the night fade is driven to 1 with an **amber tint** (`PAL.amberDeep` at 0.25 instead of `skyNight` at 0.40) so every lantern glows gold. Confetti BIG at three sky points (t 8, 14, 20) | `night` layer on + the `credits` arpeggio |
| 24.0–30.0 | The camera eases back up to −1340 | |
| 30.0–40.0 | **The gathering**: the hut door slides open and **Grandma Yuzu** walks to (322, −925); **Pon** walks up the lane from y −120 carrying a log with a conga line of 6 capys and 3 ducks behind him; **Kero** hops in from the left holding a yuzu overhead; **Momo** and 4 monkeys hop down from the ledge; **Madame Tsuru** flies in across the clouds (pose `fly`) and lands at (420, −990) with her `massage` neck dip as a bow; **Kaa** swoops onto the hut's perch with the letter. Kit runs to Grandma; both `wave` | `hop` blips, `chatter`, a soft `bell` for Tsuru's landing |
| 40.0 | Pon drops his log into the Source "for luck" (a puff; `+15` pops at the Deck kettle); Kero drops the yuzu: everyone gets a yuzu hat | `stoke`, `yuzu`, gold rings |
| 42.0 | Momo cannonballs first (20 droplets); then the whole cast plops in 0.12 s apart (capys, ducks, monkeys, Pon with his hat floating, Kero; Tsuru stands in the shallows): pop **`SOURCE SPLASH x16!!!`** 56 px amber at (420, −1000); shake 8/0.5, hit-stop 0.12, confetti BIG ×2, flash 0.3; Kit fist-pumps | `splash` ×16, `plink` ladder to the top note, `fanfare` |
| 46.0 | Kit (322, −895) and Grandma (322, −925) sit at the lane-side edge, feet in the water (pose `sit`); steam rises; hearts from everyone | `sigh` ×3 |
| 48.0 | The **letter** (note `letter`) as a real card (cream 440×200, Kaa on the corner); tap or 6 s | paper `puff` |
| 54.0–74.0 | **Credits** scroll up over the live scene, 70 px/s, cream 20 px with the ink stroke, two columns (labels left-aligned at x 110, values right-aligned at x 430); numbers are the real `S.stats` | the `credits` arpeggio |
| 74.0 | **End card**: title `THE GOLDEN AGE`, line `The mountain's awake, Kit. Now the fun part. — Grandma`, button `BACK TO THE BATHS`. Tap → `Finale.end`: mode `play`, `ending.seen = true`, banner `THE GOLDEN AGE`, the first **Festival Night starts at once**, `Save.write` | `fanfare` + `chime` |

Credits text (lines in order; `~` = a 24 px gap):
```
CAPY SPRINGS
~
Innkeeper            Kit
Stoker               Pon
Yuzu picker          Kero
Masseuse             Madame Tsuru
VIP                  Momo
Messenger            Kaa
Keeper of the Source Grandma Yuzu
The troupe           snow monkeys of the Source
The capybaras        soaked, sighed, and paid
The ducks            never once sat still
~
Capybaras served     {served - ducks - monkeys - vip}
Ducks                {ducks}
Snow monkeys         {monkeys}
Biggest splash       x{bestSplash}
Steam Rushes         {rushes}
Lantern Nights       {nights}
Hot-cold plunges     {hotCold}
Massages             {massages}
Snowdrifts cleared   {cleared}
Time on the mountain {floor(S.t/3600)}:{mm}
~
Made by {C.CREDITS_BY}
Every line drawn and every sound sung in code
~
The water's still hot.
```
`C.CREDITS_BY = 'Asmit'` (one constant; an empty string hides that line).

---

## 6. After the ending: the Golden Age (new system 3b, `G.Festival`, new `src/59_festival.js`; endless, nothing resets, ever)

`S.built.awake` is re-derived from `wake.level ≥ 1` on load (silently).

### 6.1 Source Stars turn the seasons (prestige without a reset; from P3)
Each Star (wake level ≥ 2): `S.year.season = (level − 1) % 4` (0 spring, 1 summer, 2 autumn, 3 winter; the finale lands on spring), a 3 s **season turn**: cream flash 0.3, `markStaticDirty`, the palette tokens crossfade, banner `SUMMER COMES` / `AUTUMN COMES` / `WINTER COMES` / `SPRING COMES`, `fanfare` + three descending `chime`s (pitch 1.3 / 1.1 / 0.9), confetti BIG at Kit, a 12 s replay of the mountain-wide steam wave without the cast, `stats.stars++`, the next headband dot colour, **and the next night is a Festival** (`S.festival.pending = true`). The title shows the season name.
What a season changes (new palette tokens `PAL.ground / groundDark / groundMoss / foliage / foliageDark`, read by `W.terrain`, `W.pine`, `W.treeBody` instead of `pine / pineDark / moss`, so UI greens never change; `PAL.SEASONS` table applied by `Festival.applySeason(S)` at init and on every turn):

| season | ground / groundDark / groundMoss | foliage / foliageDark | night tint | ambient (`W.ambient` variant) | extra |
|---|---|---|---|---|---|
| spring | current `#3F7D5A / #2C5A40 / #4E9A6C` | `#3F7D5A / #2C5A40` | `#2B2F5B` | petals (exists) | — |
| summer | `#2E7D4F / #1F5A38 / #58B36A` | `#2E7D4F / #1F5A38` | `#243C5B` | fireflies at night: 16 amber dots drifting (additive) | `sizzle` at gain 0.05 every 9 s (cicadas) |
| autumn | `#C9622F / #8F3A1F / #D9A441` | `#C9622F / #8F3A1F` | `#4A2B5B` | drifting maple leaves (port the leaf drawer from `25_art_s2.js` `nightExtra`) | — |
| winter | `#DCE4E8 / #B8C6CE / #EEF3F5` | `#3F7D5A / #2C5A40` with every Deck pine drawn by `W.snowPine` | `#2B2F5B` | flakes: `Snow.drawWeather` fade floors at 0.3 | **squalls reach the Deck**: `SNOW.spotsDeck` join the drift pool while winter |

The Ridge and Summit keep their own snow constants in every season.

### 6.2 Festival Nights (the score chase; P1 + P3)
A Lantern Night turned up. **When:** the first one the moment BACK TO THE BATHS is tapped; then every 3rd Lantern Night (`night.count % 3 === 0`), the night after every Star, and the next night after ALL GOALS DONE (post-ending only). `Events.startNight(S, festival)` sets `night.festival`; if a night is already active it becomes a festival with `t` reset.
- Constants: `C.FESTIVAL_T = 90`, `C.FESTIVAL_PAY = 1.5` (replaces NIGHT_PAY 1.2, never stacks; `Baths.payout` uses `G.Events.nightPay(S)`), `C.CAR_PERIOD_FESTIVAL = 10` (cable car, lift and troupe all run at 10 s dock-to-dock), ducks allowed, `C.FESTIVAL_BURST_EVERY = 12` (the geyser's `every` while a festival runs), `C.FIREWORK_EVERY = 1.5`.
- Presentation: banner `FESTIVAL NIGHT`, `chime` + `fanfare`, layers `night` + `festival`; **fireworks** every 1.5 s at a hash-picked sky point of the visible screen (`FX.burst(S, x, y, 14, color)` = confetti in one colour from amber / cta / ripple, + flash 0.06 + sfx `firework`; ≤ 3 live, 1 on low effects); Grandma rings the shrine bell; Momo rides the first lift car as on any night and leads the first troupe (the troupe index is set to the next golden one, the Guestbook's Golden Car trick); the ribbon shows `FESTIVAL 1,240` live (`S.earned − S.festival.start`).
- End: `score = earned − start`; `S.festival.count++`, `stats.festivals++`; if `score > S.festival.best`: `best = score`, `stats.bests++`, banner `NEW BEST!`, confetti BIG, `fanfare`, a Guestbook stamp. Then a card (reuse the offline layout; **never in headless**): title `Festival over!`, big `4,210 koban`, line `Best: 4,210  NEW BEST!` or `Best: 5,100`, one button `NICE`.
- Persisted `S.festival = { count, best }`; runtime `start, pending`.

### 6.3 Housekeeping that keeps the loop alive
- **The mountain is awake**: `Heat.update` floors `heat.v` at `C.HEAT_FLOOR_AWAKE = 40` while `built.awake` (no cold bath ever again; rushes still need stoking above 80, Pon's job becomes rushes). The frozen pond is a steaming pool with two ducks paddling (decor, `W.ridgeDecor` reads `built.awake`); the waterfall by the Snow Roll runs and steams; the hut's door glows always.
- **The arrow never hides** post-ending: the endless `wake` lantern is always revealed for rule 12 (dim) and rule 6 fires when a Star is affordable.
- **Records**: `stats.bestSplash` (max chain count; set in `Baths.land`), `stats.bestBurst` (max burst chain), `stats.bests`. Beating a `bestSplash ≥ 6` replaces the chain pop with `NEW RECORD x13!`.

### 6.4 Monkeys everywhere
Once awake, `CableCar.planCar`: before the duck rule, `if (S.built.awake && S.car.level >= 1 && index % C.TROUPE_CAR_EVERY === 0) { kind = 'monkey'; n = lv.ducks - 2; }` (`C.TROUPE_CAR_EVERY = 4`; golden 5ths still win); the Lift likewise makes every 4th car a monkey car of `LIFT.guests + 2 = 6` (`S.lift.kind`). Monkeys take any bath, never queue for mochi, want the plunge after the sauna like anyone; `stats.monkeys` counts them wherever they pay. Banner `THE TROUPE!` on the first troupe car below, once.

### 6.5 Guestbook additions (`55_goals.js` POOL; `needs` = `S.built` keys)
| id | label | stat | target | koban | needs |
|---|---|---|---|---|---|
| `monkeys` | `Serve 30 snow monkeys` | `monkeys` | 30 | 120 | `source` |
| `bursts` | `Catch 5 geyser bursts` | `bursts` | 5 | 150 | `source` |
| `troupe` | `Welcome Momo's Troupe` | `momoTroupes` | 1 | 250 | `source` |
| `kaa` | `Catch Kaa on a tray` | `kaa` | 3 | 100 | `shrine` |
| `festival` | `Play a Festival Night` | `festivals` | 1 | 300 | `awake` |
| `star` | `Turn the season at the Source` | `stars` | 1 | 500 | `awake` |
| `best` | `Beat your best festival` | `bests` | 1 | 400 | `awake` |

New stats (persist automatically through `Save`'s stats loop): `monkeys, bursts, geysers, troupes, momoTroupes, finales, festivals, bests, stars, notes, bestSplash, bestBurst`.

---

## 7. Art notes (chunky paper cutout; nothing new in the pipeline)

- Summit terrain (`W.summitTerrain`, called from `W.terrain` for y < −120): cream snow (`#E9EEF2`) with blue (`#A9BCCB`) shadow bands and bare `stoneDark` rock; a pink-gold dawn band at the very top (`#F3C4B4` → `skyDay`, one gradient built at rebuild); the sea of clouds = the existing mist gradient at the band plus cream cloud-top ellipses in the static layer; the cliff face above the ledge with four foot ledges; the stone stairs = the bridge recipe in `stone / stoneDark`; the torii in `PAL.red` (never CTA). Ground vents = dark holes with a steam puff every 8 s.
- Troupe Ledge: a snow-covered rock shelf (the lift platform recipe in stone with a snow strip); the whistle post = `W.bellPost` with a bamboo whistle head.
- Source Pool §2.4; Snow Roll §2.5; hut §2.6; big stone lantern for Wake the Source = `W.lantern` at 1.5× with a stone roof and the largest halo on the mountain (`r 110`).
- Note ribbon: cream rrect 360×110 r 12, ink text, `Ch.kaa` at its corner (screen space, drawn by `HUD.draw` after the banner).
- Fireworks: `FX.burst` (one-colour confetti), no `shadowBlur`.
- Low effects: burst droplets 6, finale cast steam halved, fireworks ≤ 1, no fireflies/leaves.

## 8. Audio notes (WebAudio recipes in `16_audio.js`, nothing before a gesture)

- `rumble`: lowpass noise 120 Hz 2.2 s gain 0.3 + sine 45 → 30 Hz 2.2 s gain 0.3.
- `geyser`: bandpass noise 200 → 2000 Hz 1.2 s gain 0.3 + sine 60 → 30 Hz 1.0 s gain 0.3 + `sizzle` at +0.6 s.
- `chatter` (monkey voice): two square blips 700 Hz and 900 Hz, 0.05 s each, 0.07 s apart, gain 0.12, through a 2 kHz lowpass.
- `whistle`: sine 1800 → 2400 Hz 0.25 s gain 0.12, repeated at +0.3 s.
- `bellBig`: sines 98 + 147 + 196 Hz, 3 s decay, gains 0.25 / 0.12 / 0.08 + bandpass noise 1800 Hz 0.08 s.
- `firework`: `boom` at gain 0.5, then `chime` 0.3 s later at a random pitch 0.9–1.3; throttled to one per 0.4 s.
- Layer `credits`: triangle arpeggio A2 E3 A3 C#4 (110 / 164.8 / 220 / 277.2 Hz), one note per 1.5 s, gain 0.05, scheduled like the shaker; on during the credits only.
- Layer `festival`: the night layer plus a taiko (lowpass noise 300 Hz thumps on beats 1 and 3 at 90 BPM, gain 0.05).
- Bus: `troupe:warn` → `whistle`; `geyser` → `geyser` + haptic 25; `summit:open` → `fanfare` + `chime`; `star` → `fanfare` + 3 chimes; `festival:start` → `chime` + `fanfare` + layers; `finale:*` as in §5. The finale ducks the pad to 0.02 during the rumble and restores it at the end.

## 9. Save, seasons, dev

- `Save.VERSION = 3`; migration 2 → 3 adds `story: { seen: {} }`, `ending: { seen: false }`, `festival: { count: 0, best: 0 }`, `troupe: { index: 0 }`. Serialize/apply read them defensively. Everything else re-derives from lantern levels (`open:summit`, builds, `awake`, the season, the palette via `Festival.applySeason` in `initSystems`).
- `G.SEASON.ending = 'wake'`; `Seasons.endingLit(S)`; `Seasons.finale` stays `'bridge'`.
- `State.create`: `S.year = { season: 0 }`, `S.troupe = { index, timer, phase, phaseT, toSpawn, spawnT, carId, golden, vip, n }`, `S.ending`, `S.festival`, `S.story`; `resetRuntime` resets troupe phases, `burstT`, `geyserT`.
- `index.html` `CAPY_FILES` += `src/02_data_story.js`, `src/56_summit.js`, `src/57_story.js`, `src/58_finale.js`, `src/59_festival.js`. Docs: GDD §20, ARCHITECTURE §24.

## 10. Engineering map (≈ 2,100 lines)

| piece | where | ≈ lines |
|---|---|---|
| Data: `MAP.SUMMIT`, `MAP.TROUPE`, `SNOW.spotsDeck`, baths `source` / `snowroll`, 5 lanterns (+ the wake cost/label/blurb builder), `GUESTS.monkey`, `DATA.KAA`, upgrades, `DATA.STORY`, `PAL.SEASONS` + ground/foliage tokens, config (`BURST_PAY 2`, `HEAT_FLOOR_AWAKE 40`, `DRAIN_T_BIG 8`, `NOTE_DELAY 3`, `FESTIVAL_*`, `TROUPE_CAR_EVERY 4`, `FIREWORK_EVERY 1.5`, `CREDITS_BY`, `MAX_GUESTS 64`, `MAX_DRAWABLES 200`) | `00_config.js`, `01_palette.js`, `02_data_*.js` | 120 |
| `G.Summit` + `G.Troupe` + Grandma drawable + hut/vents decor hooks | new `56_summit.js` | 190 |
| Geyser burst, `sendsToPlunge` generalisation, `plungeTargetBuilt`, `guestKind` in `valueAt`, burst payout, records | `35_baths.js`, `33_guests.js`, `41_upgrades.js` | 90 |
| Hints: rule 14 nearest plungeOnly + `def.word`, rule 2 worth, rule 6 stage preference; `ROLL` tutorial key | `44_hints.js`, `30_state.js` | 30 |
| Art: Summit terrain, cliff, ledge, torii, stairs, hut, cone, basin crack, waterfall, pond thaw, `source` / `snow` looks, big lantern, `Ch.monkey`, `Ch.grandma`, poses `sit` / `fly`, note ribbon, season ambient variants, `W.sign` text | `22_art_world.js`, `21_art_chars.js` | 330 |
| `G.Story` (queue, triggers, wrap, ribbon draw, `seen`) | new `57_story.js` | 110 |
| `G.Finale` (timeline table, cast actors, camera script, wave points, letter card, credits scroller, end card, skip, resume, replay, headless shortcut) | new `58_finale.js` | 400 |
| `G.Festival` (schedule, score, ribbon, end card, `starTurn`, `applySeason`, winter Deck drifts) + `wake` effect + `starMult` + heat floor + troupe cars in car/lift + goals + title/HUD/offline strings + settings row + dev actions | new `59_festival.js`, `40_lanterns.js`, `41_upgrades.js`, `36_heat.js`, `34_cablecar.js`, `49_lift.js`, `43_events.js`, `55_goals.js`, `53_title.js`, `52_cards.js`, `54_dev.js`, `50_hud.js` | 330 |
| Camera second blend; per-stage static cache; render tint colour; `Finale.collect` hook; mode `finale` in main | `14_camera.js`, `45_render.js`, `90_main.js` | 110 |
| Audio recipes + two layers | `16_audio.js` | 60 |
| FX: `burst`, geyser/finale reactions, burst chain pop, snow puffs | `24_fx.js`, `23_art_fx.js` | 60 |
| Save v3, seasons `ending` id + `endless`, state fields | `17_save.js`, `04_seasons.js`, `30_state.js` | 60 |
| Harness: checks, invariants, `--from ending`, bot crossings list | `test/headless.js`, `test/bot.js` | 120 |
| Docs | `docs/` | 100 |

## 11. Harness checks and pacing (seed 7; also seeds 3 and 11)

Target beats: Pilgrim Stairs ≈ 50 min · The Source ≈ 56 · Shrine ≈ 60 · Snow Roll ≈ 66 · Fame V + tracks ≈ 70–76 · **Wake the Source ≈ 80 min** · first Festival at once · Star II ≈ 92.

`npm test` → `node test/headless.js --seconds 6000 && node test/headless.js --from ending --seconds 1800 && node test/headless.js --fuzz 300 && node test/headless.js --fuzz 300 --from ending` (plus the existing season-2 runs). `DECK_CHECKS` gain:
```
[3600, built.summit]
[4200, built.source; stats.monkeys >= 20; stats.geysers >= 10; stats.bursts >= 1; stats.notes >= 5]
[4800, built.shrine && built.snowroll; stats.kaa >= 1; stats.hotCold grew since 4200]
[5400, lanterns.wake.level >= 1 && built.awake && ending.seen; stats.finales === 1; S.mode !== 'finale'; stats.festivals >= 1   (the 90-minute requirement)]
[6000, earned(6000) >= 1.15 x earned(5400); lost ratio <= 0.15; stats.troupes >= 100]
```
`--from ending`: lights every lantern in order (wake to level 1 through the headless shortcut), maxes upgrades, coins 0, `ending.seen = true`, runs 1800 s and asserts: `wake.level >= 2` (a Star), `S.year.season >= 1`, `stats.festivals >= 2`, `festival.best > 0`, `stats.kaa >= 3`, `stats.monkeys >= 30`, a render smoke per season palette (force each), the save round trip includes `festival / story / ending / troupe`, each static canvas area ≤ 1080 × 2600 at sdpr 2.
Invariants (every simulated second): `!S.heat.cold` whenever `built.awake`; Kit never inside a chasm rect; `0 <= burstT <= geyser.dur` outside the finale; the harness never enters mode `'finale'` and never opens a card; `Camera.minY(S) === -1340` iff `built.summit`; `guests.length <= MAX_GUESTS`; troupe timers finite. Beats dump gains `summit, source, shrine, snowroll, wake, geyser, festival, star`. Bot: `cross` and `blocked` take a list of crossings `[RIDGE.y1, SUMMIT.y1]`.

**Knobs if the bot lights `wake` after 5,400 s, in order:** (1) `wake.costs[0]` 25,000 → 18,000; (2) Summit upgrade bases × 0.7; (3) `TROUPE.guests` 6 → 8. If the 1200 / 1800 s balance warnings fire (they should not; the Summit exists only after 50 min) or `earned(6000) > 1.6 × earned(5400)`: `BURST_PAY` 2 → 1.75 first, then `monkey.pay` 12 → 10. Never the festival multiplier (inside `MULT_CAP`).

## 12. Defaults chosen for the open questions (change one constant each)
1. Credits line: `Made by Asmit` (`C.CREDITS_BY`). 2. Grandma Yuzu is the story's heart; if the player prefers no new character, the notes are signed `— Kaa` and the finale loses the reunion beat, nothing mechanical changes. 3. The ending is replayable from Settings (`Watch the ending`). 4. Snow squalls stay on the Ridge in every season (they are its climate) and reach the Deck only in winter. 5. The Mochi Terrace (Season 2) stays hidden as a dev-only backup.
