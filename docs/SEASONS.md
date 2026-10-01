# CAPY SPRINGS — Seasons (GDD §17 / ARCH §20, build 1.3.0)

A **season** is a new place on the mountain with its own map, stations, cast, ladder of offering steps, look and one or two mechanics of its own, played with the same controls and the same engine. Seasons are the game's "next levels": finish one, pay for the pass, ride to the next. Each is fresh (new verbs, new palette, new jackpot) without copying any other game's structure; the lessons we took from the genre are only these: a new shop must feel new in the first minute, the player must always know what is left to buy, and going back must be a place on the map, never a lost save.

## 17.1 The framework

- **Season 1 — The Deck** is the hot spring from `GAME_DESIGN.md`. **Season 2 — The Mochi Terrace** is below. A season registers a *pack* (`src/03_pack_s2.js`): `{ name, subtitle, teaser, finale, data: { MAP, BATHS, STATIONS, UPGRADES, LANTERNS, GUESTS, CAR, HELPERS, SHEET_STATIONS, VIP?, LAP?, KAA? }, pal, config, text, words }`. `src/04_seasons.js` applies the current season's pack over `G.DATA` / `G.PAL` / `G.C` before any system loads, so every module simply captures "the data" as before. Art lives in a season art file (`src/25_art_s2.js`) that replaces `G.Art.W` drawers and adds characters when that season is current.
- **Engine roles are fixed ids, content is free**: baths (any number, each with `heated`, `payMult`, `look`), `boiler` (the burner), `woodpile` (the fuel), `grove` (regrowing pickups), `stall` (the second want), helpers `pon` / `kero`, guest kinds `capy` (main) and `duck` (the fast flock) with `art` / `voice` / `scarf` per pack, lanterns by id with the usual effects plus `travel:n`.
- **Travel gate**: the Deck's finale (Ridge Bridge) reveals a **Season Pass** step (5,000 koban, one-shot). Lighting it unlocks Season 2 (`SEASON 2 OPEN!` banner, fanfare, confetti) and after the banner a travel card offers **GO / LATER**. Any later time: gear → **Seasons** card → **GO**. Going back works the same way; the Deck row says "Ridge Rail: down to the Deck" in spirit — the card lives in the gear menu because it must work from any season.
- **Saves**: one save per season (`capysprings.save` for the Deck, `capysprings.save.s2` for the Terrace) plus a small meta record `capysprings.meta` `{ season, unlocked, done, progress, visited }`. Travelling saves the current season, points the meta at the other one and reloads the page; the pack switch happens at load. Each season keeps earning offline on its own (the usual 2 h cap) and shows its own Welcome-back card when you return to it.
- **Completion %**: lantern levels + upgrade levels over their maxima, shown in the gear popover and on every Seasons row ("12 things left to buy" for the current season, "Finished, 100 %" for others) so nobody is stuck at 96 % wondering why.
- **Stars**: every *other* finished season (its finale lantern lit) pays **+10 %** here (`C.STAR_PAY`, `Upgrades.starMult`), and Kit keeps the gold headband everywhere. A new season starts at 0 coins with its own ladder, so the first 30 seconds are a tutorial again with new words.
- **Dev shortcut**: `index.html?season=2` opens a season without the pass. The harness takes `--season 2`.

## 17.2 Season 2 — The Mochi Terrace

**Pitch.** Kit opens an autumn mochi teahouse on the ridge above the Deck. Rice sacks go into the trail, get pounded into a shared **Mochi Stock** at the mortar, and that stock is what the tables serve: pantry → kitchen → table instead of logs → boiler → bath. The trail is full of food the seated guests are waiting for, and the season's big moment is a crowned VIP paying six times a normal guest.

**Look.** Slate-grey flagstone terrace, red maples, straw-plank platform, a stubby red rack-railway car on a toothed rail along the bottom edge, paper lanterns on poles, a stone stair into cloud at the top labelled SUMMIT. Palette: slate, maple red, persimmon orange, straw gold, mochi cream, dusk plum; moss only as lichen. No pine green, no teal, no cedar.

**Map** (same 540 × 2400 world and camera rules; stand points are offering steps):

| Thing | Where | Notes |
|---|---|---|
| Tea Bench (bench, prebuilt, unheated) | deck (120,1860) 220×150, mat 150×80 | 3 seats → 6, 8 s → 5 s, pay 8; three cushions |
| Mochi Table (table, heated) | deck (420,1640) 210×150 | 5 seats → 8, pay ×1.75 (14); plates empty under 30 stock ('?' bubble) |
| Zenzai Hearth (hearth, heated) | deck (420,1360) 210×150 | 6 seats → 8, pay ×2.5 (20); red-bean soup, Momo's seat |
| Rice Mortar (boiler) | (180,1650), pound spot (180,1672), zone 30 | +15 stock per sack, mallet upgrade +2; **pounding needs Kit to stand still 0.1 s** (`STOKE_STOP`) |
| Sack Pile (woodpile) | (85,1650), zone 40 | unlimited sacks, capped to what fits the bowl |
| Stepping stones (LAP) | (180,1582) (240,1688) (120,1688), r 38 | the Pounding Lap, 12 → 4 → 8 o'clock |
| Persimmon Tree (grove) | slots x 90/170, y 1300–1430; home (130,1470) | 3 fruit → 5 (Branches), regrow 15 s |
| Tsuru's Tea Counter (stall) | (430,1850), queue y 1905 | persimmon → tea, 4 cushions, 30 s patience, pay 18 |
| Platform / Ridge Rail | platform (270,2060), rail y 2120 | 22 / 21 / 20 / 18 s dock-to-dock, 3 / 5 / 7 / 9 capys |
| Summit stair + sign | (270, 1000–1150), sign (330,1130) | finale |

**Cast.** Capybaras in striped red scarves (pay 8). **Chestnut Run**: every 3rd car is 8–12 red squirrels (walk 170, pay 5, half-time service, 15 s patience, never queue for tea, chirp). **Maple Express** = the golden car (red-lacquer, gold stripe, leaf on the roof; 2× guests, ×1.5 pay, fanfare). **Momo** the snow monkey VIP (pay 48 — 6× a hearth guest after ×2.5 — golden ×1.5, 60 s patience, gold paper crown, sparkles while seated) rides the Maple Express that docks during Harvest Moon once the Hearth is built; one per moon. **Pon** in a straw apron hauls sacks; **Kero** hops persimmons to the counter; **Madame Tsuru** stands behind the counter (art only); **Kaa** the crow visits.

**Words.** SEAT (soak), POUND (stoke), TOP (yuzu), LAP (new), plus LEAD / COLLECT / LIGHT / TAP. Banners: FRESH BATCH (rush), HARVEST MOON (night), MAPLE EXPRESS!, FULL CARRIAGE!, FAMOUS TEAHOUSE! / SUMMIT FAME. Pops: FEAST x3!, PERSIMMON TOP!.

**Ladder** (offering steps; total 15,320 before the Summit's repeats):

| # | Step | Cost | Effect | Requires |
|---|---|---|---|---|
| 1 | Rice Mortar | 40 | builds mortar + sack pile + stones, shows the bowl | — |
| 2 | Mochi Table | 150 | builds the table; stock drain begins; Kaa starts visiting | mortar |
| 3 | Longer Line I–III | 300 / 1,000 / 2,600 | trail 5 / 8 / 12 | table |
| 4 | Timetable I–III | 240 / 700 / 2,000 | rail level 1 / 2 / 3 | table |
| 5 | Pon's Apron | 450 | hires Pon | mortar |
| 6 | Persimmon Tree | 700 | builds the tree | table |
| 7 | Zenzai Hearth | 1,100 | builds the hearth; Momo may ride | grove |
| 8 | Tea Counter | 1,400 | builds the counter | grove, pon |
| 9 | Hire Kero | 600 | hires Kero | stall |
| 10 | Summit Lantern | 4,000 / 5,000 / 6,000 / 7,000 / 8,000 | fame ×1.25 … ×1.45 (finale) | hearth, stall, trail:2, car:2 |

Upgrade sheet per station (same 1.6× curve): Service / Cushions / Tips on the three service stations; Mallet / Bowl / Pon on the mortar; Ripen / Branches / Juicy on the tree; Brew / Teapot / Price on the counter.

## 17.3 The two new mechanics

- **Pounding Lap** (`DATA.LAP`, `G.Heat`): while carrying at least one sack, touch the three stones in order (12 → 4 → 8 o'clock, 38 px each) within 4 s of the previous touch; each touch glows and ticks, the third plays a rising three-note thump and **banks** a lap (`S.lap.armed`). The next pound at the mortar is +25 instead of +15 (one bonus per lap, no stacking; the stones glow warm while a lap is banked). The arrow says **LAP** at the next stone whenever sacks are in the trail, no lap is banked and stock is under 80; with a lap banked it says POUND at the mortar. Only a COLD bowl (under 30) skips the lap. The "get sacks" prompt fires under 60 (not 40) and never while sacks are already being carried.
- **Kaa's Visit** (`DATA.KAA`, `G.Kaa`, `src/46_kaa.js`): from the Mochi Table on, every 90 s (45 s during Harvest Moon) Kaa lands on the fullest tray with a caw and a 6 s ring shrinks around him. **Tap him** (44 px) inside the ring: a coin fountain worth 6 % of the coins in hand (min 15, max 250) rains to Kit with a chime and a small fanfare. Ignore him: he flies off with up to 5 koban from that tray. One Kaa at a time; he never lands during a hit-stop. The harness bot taps him after 1.5 s.

Both are off in the Deck (no `LAP` / `KAA` in its data).

## 17.4 Events and the jackpot

**Harvest Moon** replaces Lantern Night: dusk-plum tint, a cream moon over the Summit stair, maple leaves drifting down, rail every 12 s, pay +20 %, Kaa every 45 s. The **Maple Express** that docks inside it carries Momo once the Hearth exists. The engineered jackpot: lap three sacks to push stock past 80 (**FRESH BATCH**: heated stations 2× speed, ×1.5 pay, chainable), grab a persimmon, meet the Express, top the Hearth (×2 hats), walk its mat for a x5 FEAST (×2.0) with Momo in the middle. One hearth cycle during a moon pays several hundred koban before fame.

## 17.5 Balance (measured, seed 7, build 1.3.0; `node test/headless.js --season 2 --seconds 2700 --csv test/balance/s2_seed7.csv`)

| Play time | 2 min | 5 min | 10 min | 20 min | 30 min | 40 min | 45 min |
|---|---|---|---|---|---|---|---|
| Cumulative coins earned | 243 | 1,259 | 4,635 | 16,803 | 32,397 | 49,909 | 62,022 |
| Beats | mortar 0:26, table 1:55 | first batch 1:19, x5 4:41 | Pon ~6 min | grove 12:34, hearth 19:28 | counter 24:32 | Summit I 37:37 | every upgrade bought by 35 min |

Seeds 3 and 11 land within ±5 % of seed 7; the Hearth varies most (19–24 min). Harness floors are 70 % of this curve (`TERRACE_CHECKS` in `test/headless.js`: mortar by 30 s, table by 2 min, 2 laps and a batch by 5 min, Pon / x5 / 2 Kaa taps by 10 min, tree + 2 moons by 20 min, hearth + counter + Momo by 30 min, Summit by 40 min, lost ratio ≤ 15 %). Knob order if the sim overshoots by > 40 %: `YUZU_PAY`, `YUZU_DUR`, `SPLASH_MULT[5]`, `RUSH_PAY`, `NIGHT_PAY`, then `momo.pay`. Never touch lantern costs first.

## 17.6 Adding Season 3

1. Copy `src/03_pack_s2.js` to `03_pack_s3.js`, set `G.PACKS[3]`, keep every role id, change positions / numbers / names / words / text / pal / config.
2. Copy `src/25_art_s2.js` to `25_art_s3.js` with `G.SEASON.id !== 3` as the guard; override only what should look different.
3. Add both to `index.html` in order, add a `travel:3` step to Season 2's ladder (after `summit`), and `TERRACE_CHECKS`-style milestones to `test/headless.js` under `SEASON_CHECKS[3]` once the curve is measured.
4. New mechanics go behind a `DATA.<NAME>` block like `LAP` and `KAA`, so other seasons stay untouched.
