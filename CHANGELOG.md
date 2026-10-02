# Capy Springs — changelog

## 1.12.0 — the Summit, Grandma Yuzu, the ending and the Golden Age (2026-10-02)

The mountain gets its top, its story and its ending, and the game goes on after it. Design: `docs/plans/summit_and_ending.md` (a three-designer panel and a judge).

- **The Summit**, a third full-screen stage above the clouds, opened by the **Pilgrim Stairs** (6,000) at the top of the Ridge: a red torii, a cliff with the stairs as the only way up, a sea of clouds, Grandma Yuzu's hut, a frozen waterfall.
- **The Source** (10,000): the mountain's own spring, x3 pay, 8-12 seats. Its **geyser** bursts every 24 s for 6 s (a 3-2-1 count on the cone); guests who land during a burst pay **x2** and chains read SOURCE xN!!.
- **Snow monkeys**: once the Source exists, a whistle and a troupe of six hops down the cliff onto their ledge every 20 s (12 s at night); every fifth is **Momo's Troupe** (twelve, golden, Momo last). FULL TROUPE pays like FULL CAR.
- **Snow Roll** (15,000): monkeys come out of the Source wanting snow; roll them in the bank within 8 s for **HOT-COLD x2** (the arrow says ROLL).
- **Grandma's Shrine** (9,000): **Kaa the crow** keeps watch, landing on a full tray near Kit; tap him for koban.
- **Grandma Yuzu's notes**: Kaa brings seven short notes at milestones (the first lantern, the Ridge, the Pavilion, Momo, the Summit, the Source, the Shrine); an older save gets one catch-up note.
- **Wake the Source** (40,000, needs every lantern lit, Inn Fame V, Longer Line III and Bigger Car III): **the ending**. The ice cracks, the Source bursts, a wave of steam runs down the whole mountain past every bath and lantern, Pon, Kero, Madame Tsuru, Momo, the monkeys, the capybaras and the ducks gather and jump in together, Kit sits with Grandma, her letter, the credits with your own numbers, then THE GOLDEN AGE. Tap to skip ahead; Settings › Watch the ending replays it.
- **The Golden Age** (endless): Wake the Source keeps going as **Source Stars** (60,000, x1.35 each): every Star turns the season and repaints the mountain (spring, summer, autumn, winter: the ground, the trees, petals, leaves or snow) and adds +10% pay (ten at most). **Festival Nights** (after the ending, after each Star, then every third night): 90 s at x1.5 pay with fireworks and a score; beat your best.
- **Kinder to explorers**: guests only lose patience while Kit is on their stage; arrivals stop when a platform is full. Lost guests in a full climb: 8% (was 35%).
- Guestbook: six new goals (snow monkeys, geyser bursts, Momo's Troupe, Kaa, a Festival Night, a best festival). The title shows "The Golden Age · season · best festival" once the story is done; the bridge sign reads RIDGE, SUMMIT, then SOURCE.
- **Graphics**: light from the top-left on every shadow, a paper rim on every plate and pill, soft baked steam and puffs, two-tone water without the swimming-pool light sweep, a painted ground (more grass, a value gradient, a faint paper grain), stepping stones on the lane, a capybara with a belly, a rim of light and nostrils, and the title logo on a swaying wooden sign under a morning sky.
- **Stage reveals**: when the Ridge or the Summit opens, the camera sweeps up to show the new stage, holds, and comes back (the game waits; a tap skips).
- **Banners queue** instead of replacing each other, so THE GOLDEN AGE, FESTIVAL NIGHT and STEAM RUSH all get their moment.
- **Weak phones**: with Low effects on, walking and waiting guests are drawn from small baked sprites (about a third less drawing work in a crowded frame); a phone that reports 2 GB of memory or less starts on Low effects; toggling Low effects resizes the canvas for its lower pixel ratio; Low effects draws plain rings around unaffordable steps.
- Harness: the full run is now 6,000 s (`npm test`) and must open the Summit, serve monkeys and catch bursts, read the notes, tap Kaa, wake the Source, play a festival and earn a Source Star; seeds 7 / 3 / 11 pass (seed 7: Summit 48 min, ending 70 min, 557 monkeys, 2 Stars and 3 festivals by 100 min). `test/trace.js` prints Kit's line and the arrow second by second for debugging.

## 1.11.0 — release readiness: help for new players, bug sweep, low-end speed, app-store projects (2026-10-02)

An eight-lens audit (state and saves, simulation, UI and input, low-end rendering, platform, store rules and legal, the brand-new player, "unfinished" tells), every bug finding checked by a second reviewer, then fixed.

- **How to play**: three illustrated pages (walk and lead, grow the inn, hot water and splashes) open before the very first PLAY, and from HOW TO PLAY on the title and in Settings. Tap the right half for next; X skips.
- **About**: version, credits, privacy policy and terms (both stores require an in-app privacy link), the Capacitor licence line.
- **Explained the first time**: GOLDEN CAR, FULL CAR, LANTERN NIGHT, STEAM RUSH, SNOW SQUALL, MOMO and a cold boiler each carry a one-line explanation under their banner the first time; the boiler gauge and the line of guests get a caption when they first appear; the title says what the game is in one line; every Guestbook goal says how to do it.
- **Kinder controls**: a slow press on a button now counts; the drag hint (now with the word DRAG) stays until the first real drag; walking across an offering step no longer pays into it (stand still); taps during a card's slide-in are ignored, so a double tap on Reset can no longer wipe the save; bigger hit areas on the Guestbook and DEV chips; the version strip no longer overlaps the last Settings button.
- **Clearer words**: Trail Rope → **Longer Line**, Cable Car → **Bigger Car**, Haptics → **Vibration**, the bridge's later levels announce **INN FAME II…V** (not "SEASON FAME"), no "Lv 0" badge, guests who give up show "waited too long" and do not wave.
- **Bug fixes**: FULL CAR counted sauna→plunge guests twice; a golden Ridge Lift could overfill its platform; the first snow squall fired the moment the Ridge opened, hiding THE RIDGE OPENS; a paid sauna guest who skipped the plunge counted as lost; Kit could pick a yuzu with nowhere to go; a Lantern Night restarted on every reload; a reload refilled a cold boiler; Welcome-back earnings could be lost if the phone locked on the title; a reset left the season marked finished; a new inn's Guestbook could offer goals it could not do yet (or the same goal twice); goals now re-roll with a banner at midnight and never on a clock set back; a save from a newer build is kept instead of wiped.
- **Low-end phones**: rounded rectangles use the fast native path; the static world is cached in 640-px tiles built only near the camera (no canvas ever passes the 4096-px GPU limit, and the Summit can now grow upwards); automatic Low effects now watches the real frame rate, caps the pixel ratio at 1.25 and swaps the multiply tints for plain ones; the game canvas is opaque; the sort and the drop-off no longer allocate every frame; 1,000,000 shows as 1M.
- **Saves**: in the app-store builds every save is mirrored into Capacitor Preferences and restored at boot (the phone can clear WebView storage); a failed save shows SAVE FAILED once.
- **Store builds**: Capacitor 8 Android and iOS projects (`android/`, `ios/`), portrait only, generated icons and splash screens, `android:appCategory="game"`, an iOS privacy manifest, no-encryption declaration, iPhone-only device family, home-indicator deferral, native version numbers kept in step by `npm run deploy`, developer mode and `?season=` / `?debug=` stripped from the store build; `npm run native` does the whole sync. Docs: `docs/NATIVE_BUILD.md`. Privacy policy and terms pages on the site.
- Boot errors now say "Something did not load" with a Retry button instead of developer instructions; a sideways browser tab says "Turn your phone upright"; any portrait browser window fits by width.

## 1.10.0 — the Guestbook: daily goals, stamps, a stamp card (2026-10-02)

The last item of the "one mountain" plan: a reason to open the inn every day.

- **Three goals a day** (`55_goals.js`, `DATA`-free pool inside the module): one easy goal (Serve 30 guests / Land 6 Splash x3, alternating by day) plus two drawn from a pool of fourteen in a day-seeded order, only ever offering what the inn has built (Start 3 Steam Rushes, Seat 3 whole cars, 4 golden yuzu baths, Sell 6 mochi, Play a Lantern Night, Welcome a Golden Car, 3 hot-cold plunges, 4 massages, A full house for Tsuru, Clear 3 snowdrifts, Serve Momo). Progress counts from the moment the day's goals are set (a baseline snapshot of the stats), so an old inn starts every day at 0.
- **Rewards**: each goal rains its koban onto Kit (60–250), a stamp, "GOAL DONE +90" banner, small confetti and a stamp thunk. All three in one day: +150 koban, a bonus stamp, "ALL GOALS DONE!" with a fanfare and a flash.
- **The stamp card**: five circles; every fifth stamp fills the card and calls a **Golden Car** next ("STAMP CARD FULL!").
- **Where it lives**: the **Guestbook** button on the title screen and in Settings (both show "1/3"), a small "1/3" chip under the gear in play that opens the card, and the Guestbook card itself (goals with progress bars, reward pills, the stamp card). Goals roll on the real calendar day (local time) and survive the save; a new day rolls new goals the next time the game ticks.
- Harness: by 10 min the Guestbook holds three goals and at least one stamp (all seeds: 4 stamps by 50 min on served / whole cars / x5). The Dev chip moved down one row to make room.

## 1.9.0 — the Ridge Lift, Momo the VIP, a full-screen Ridge, readable steps, the old shake (2026-10-02)

Phone feedback on 1.8: the bigger splash shake was too much (the 1.4 one was perfect); it was unclear how guests ever reach the Ridge; the Ridge only filled the top of the screen; and the bridge's price did not say what it bought.

- **Splash feel reverted** to 1.4 exactly (bump 4 / 6 / 8, hit-stop, x5 confetti + flash); the camera zoom punch is off everywhere (`SPLASH_PUNCH` zeros, `PLUNGE_PUNCH` 0, the gong only bumps). The new sounds stay.
- **Ridge Lift** (`49_lift.js`, `MAP.LIFT`): once the Ridge opens, a gondola crosses the gorge on a cable at y 1020 and docks above a straw-plank platform at the Ridge's bottom left (28 s dock-to-dock, 14 s at night, 4 capys, every 5th car golden with streamers, its own bell ring, FULL CAR counts). Guests who step off wait there (`area: 'ridge'`) and leave by the top of the Ridge. Nobody has to walk guests up any more; the bridge is for Kit.
- **Momo the VIP**: during Lantern Night, once the Sauna Hut exists, the first lift car carries Momo the snow monkey (gold paper crown, pink face, sparkles while seated): "MOMO THE VIP!", fanfare, confetti. He pays **10×** wherever he is served (sauna, pavilion, a bath — 300 koban for a massage) and plunges after a sauna like anyone. Once per night.
- **A full-screen Ridge**: the Ridge now spans y −120 to 1100 (a whole phone screen) with a frozen pond, more snow pines and rocks up top; while Kit is up there the camera stays inside the Ridge (its lower limit blends across the bridge), so the stage fills the screen instead of sharing it with the Deck.
- **Offering steps say what they are**: every step now shows its name above the price and one line of what the koban buy below it ("Ridge Bridge — Opens the Ridge above, and +25% pay"; the bridge's later levels are "Inn Fame II…V — +5% pay on everything"; "Trail Rope — Lead 8 guests at once"; "Yuzu Grove — drop one in a bath for x2 pay"; …).
- Harness: ≥ 10 lift cars and Momo served ≥ once by 50 min (seed 7: 65 lift cars, Momo 11×, 92,177 coins at 50 min); the "out of world" invariant now knows the world's top is y −120.

## 1.8.0 — snowfall (2026-10-02)

- **Snow squalls** once the Ridge is open: the first 200 s after it opens, then every 150 s, lasting 30 s — flakes over the whole mountain, a cool tint, wind and a "SNOW SQUALL" banner. During a squall **snowdrifts** settle on three of the Ridge's path spots (bridge top, the lane, by the plunge and sauna steps), five seconds apart, up to four lying at once.
- A drift is a crawl: Kit moves at 40 % through it, guests at 50 %. Kit **clears** one by pushing through it for 0.6 s: a burst of white puffs, a scrape, and 3 koban found under the snow. Drifts stay until cleared, so the Ridge needs tending — the first time the map itself pushes back, and never a fail.
- New arrow word **CLEAR** (a drift within 300 px, between COLLECT and TAP: a small job between cars, never urgent). The harness checks ≥ 1 squall and ≥ 1 cleared drift by 50 min (seed 7: 9 squalls, 15 cleared).

## 1.7.0 — the Massage Pavilion and the gong (2026-10-02)

- **Massage Pavilion** (2,500, after the Cold Plunge): Madame Tsuru's roofed pavilion at the top right of the Ridge, 2 chairs → 4, pay ×5. It works to a **gong** every 20 s (a countdown ring on the gong stand): guests you seat **wait, relaxed**, until the gong; then every seated guest is massaged together for 10 s (→ 7 s with Quicker hands), eyes half closed, sparkles, Tsuru's neck and wing working. **Every chair full at the gong = FULL HOUSE ×1.5** with a pop, confetti and a zoom punch. Latecomers wait for the next gong. A second clock to plan around, and a "bring enough guests" decision.
- The arrow's SOAK choice now discounts a station by distance (a far one must be clearly better), knows a pavilion chair stays taken until the gong and the massage after it, and sends a yuzu only to a bath on Kit's own side of the bridge.
- New: Madame Tsuru (crane) drawn in the game for the first time; gong sound; `heart` icon on the pavilion's sheet.
- Harness: the Deck run is now 50 minutes (`npm test`): pavilion by 50 min with ≥ 2 massages and a full house (seed 7: pavilion 43:51, 37 massages, 8 full houses, 154 hot-cold). The bot takes the lane when it carries guests across the bridge (walking straight across a deck drops them there), and a latent bot bug is documented: it walks straight and only plans when stuck, on purpose — a planning bot lost three times the guests.

## 1.6.0 — the Ridge opens: Sauna Hut and Cold Plunge (2026-10-02)

The first expansion of the one mountain. Lighting the **Ridge Bridge** (the old finale) now also **opens the Ridge** above it: the mist lifts, the camera and Kit's bounds extend 600 px upward, the lane continues across the bridge (solid drops either side), and two offering steps appear.

- **Sauna Hut** (1,500, after the bridge): a heated log cabin, 4 seats → 6, 6 s, pay ×1.25. Guests who finish the sauna **climb out wanting a plunge**: a new want bubble with a ring that empties over 8 s.
- **Cold Plunge** (1,200, after the sauna): an icy pool that takes **only** sauna leavers, 3 seats → 6, 4 s, pay ×1.5. Land them inside the window for **HOT-COLD x2** — steam burst, shockwave ring, zoom punch, chime — on top of the normal Splash Chain. Guests who wait too long wander off into the mist at the top.
- The arrow learns **PLUNGE** (sauna guests in the line → the plunge), prefers waiting sauna guests whose window is still open for LEAD, weighs baths by what a seat is worth (the sauna → plunge chain counts for 3.5×), and never sends a yuzu to the plunge. The cable car's platform cap counts platform guests only. Ridge guests leave at the top, not the bottom.
- Art: snow-dusted stone, drifts, bare rock, snow-capped pines, the chasm with mist, the log cabin with a snowy roof, chimney, bench and glowing stove, the stone-rim pool with bobbing ice; a `plunge` icon.
- Harness: the Deck run is now 45 minutes (`npm test`): the Ridge opens by 40 min, both stations and at least one hot-cold by 45 min (seed 7: bridge 24:57, sauna 27:36, plunge 30:17, 11 hot-cold of 14 plunges; seeds 3 and 11 pass).

## 1.5.0 — one mountain: Terrace shelved, upgrades explained, bigger splashes, graphics pass (2026-10-02)

Playtest verdict on the phone: chapter 1 was fun because it kept teaching something new; chapter 2 reused every verb under new names and reset progress, so it felt like a skip. Direction from here: **one mountain that keeps growing** (new areas open above the Deck with new mechanics, nothing resets), not separate chapters.

- **The Mochi Terrace is shelved, not deleted**: `G.PACKS[2].hidden = true`, the Deck's Season Pass lantern is commented out, and the Seasons menu / title button / dev buttons hide when only one place exists. Everything still runs with `?season=2` and `--season 2`, and the harness keeps testing it. A save pointing at the hidden place comes home to the Deck.
- **Upgrade sheet redesigned** (the confusing part): one full-width row per track with a plain title ("Quicker soaks", "More seats", "Better tips"), the number before → after in the player's words ("6 koban each → 7 koban each", "4 seats → 5 seats", "8.0 s → 7.5 s"), a one-line reason, level pips and the price; affordable rows get a coloured outline and the whole row is the button. Sheet is taller (40 % / 380 px).
- **Splash Chain escalation** (the moment that works): x3 bump + sparkle + a bass thump, x4 bigger bump + camera zoom punch + shockwave ring, x5 shake, stronger punch, two rings, double confetti, flash, hit-stop and a boom. New `Camera.punch` (zoom about the screen centre; shake/flash toggle respected) and FX particle kind `ring`.
- **Graphics pass**: grass tufts and flower patches in the terrain, deck plates with ground shadows, plank highlights and nail heads, water with a sweeping light band and a foam line, drifting petals across the scene, lit lanterns glow faintly by day, every character has catch-lights in the eyes and cheek blush.

## 1.4.1 – 1.4.3 — published on GitHub Pages, self-updating (2026-10-01)

- The game lives at `github.com/asmitdeshwal/capy-springs` and is served from `https://asmitdeshwal.github.io/capy-springs/` (the permanent https address an iPhone needs for Add to Home Screen). `npm run deploy` (`tools/deploy.js`) bumps the patch version, repacks, commits and pushes; Pages rebuilds in about a minute.
- The service worker revalidates the page itself on every launch (hosts keep `index.html` for 10 minutes otherwise), so an installed copy gets a new version on its next open. Each deploy's version is stamped on the script URLs and names the cache, so old files are dropped cleanly.
- Developer mode on a phone: seven taps on the version line along the bottom of the Settings box or of the title screen (a thumb-sized target now, with a countdown after four taps).
- `npm run share` / `tools/serve.js`: if the port is busy the next free one is used; the share link follows it.

## 1.4.0 — app shell, developer mode, installable package (2026-10-01)

- **Boot screen** in `index.html` (cream, a bobbing capy, a progress bar that fills as the 45 script files load; the file list `window.CAPY_FILES` is now the single load order used by the page, the harness and the packager).
- **Title screen** (`src/53_title.js`, mode `title`): logo with steam, Kit waving beside a capy in a yuzu hat, the season's name, **PLAY / CONTINUE**, **SEASONS**, **SETTINGS**, version. The Welcome-back card waits behind PLAY. Enter / Space starts. The settings popover gains **Main menu** (saves and returns to the title) and now **pauses the game** while open, like cards do (the upgrade sheet still does not).
- **Developer mode** (`src/54_dev.js`): on with `index.html?dev=1` (persisted; `?dev=0` off) or by tapping the version label in settings seven times. A **DEV** chip under the gear, a DEV MENU button on the title, a **Developer** row in settings and **F2** open the panel: +1,000 / +100,000 koban, infinite koban, speed ×1/×2/×4, light all lanterns, max all upgrades, finish this season, unlock all seasons, go to any season, night/moon now, golden car next, Kaa now, fill / empty the gauge, debug overlay, reset this season, wipe everything.
- **Installable package**: `manifest.webmanifest`, generated `sw.js` (network first, cache fallback — an installed copy keeps working with the server off or a share link gone), app icons drawn by `tools/pack.js` (a pure-JS PNG encoder, no dependencies), `dist/` as a clean hostable copy, and `tools/share.js` (`npm run share`): the local server plus a Cloudflare quick tunnel, giving the https address an iPhone needs for Safari's Add to Home Screen. `package.json` scripts: `npm start`, `npm run share`, `npm run pack`, `npm test`. No runtime or build dependencies.

## 1.3.0 — seasons and The Mochi Terrace (2026-10-01)

The game continues past the Deck. Spec: `docs/SEASONS.md` (GDD §17, ARCH §20).

- **Season framework**: season packs (`src/03_pack_s2.js`, applied by `src/04_seasons.js`), one save per season plus a meta record, the **Season Pass** step at the Deck's bridge (5,000, after the Ridge Bridge) that unlocks Season 2 with a banner and a GO / LATER card, a **Seasons** card in the gear menu (completion %, what is left to buy, GO back and forth), **stars** (+10 % pay per other finished season, gold headband everywhere), `?season=2` dev shortcut, `--season 2` in the harness.
- **Season 2 — The Mochi Terrace**: an autumn teahouse on the ridge. Tea Bench / Mochi Table / Zenzai Hearth, the Rice Mortar and sack pile (Mochi Stock replaces heat, FRESH BATCH replaces Steam Rush), the Persimmon Tree (toppings), Tsuru's Tea Counter, the Ridge Rail with the Chestnut Run (squirrels) and the Maple Express, Harvest Moon with a moon and drifting leaves, Momo the snow monkey VIP, and two new mechanics: the **Pounding Lap** (touch three stones in order while carrying sacks for a +25 pound) and **Kaa's Visit** (tap the crow on a tray for a coin fountain). New art for every drawer and three new characters; new sounds (chirp, thump, lap beat, caw).
- **Engine generalisations** so packs can recast everything without touching logic: per-station `payMult`, guest `art` / `voice` / `scarf`, text and word tables, the gauge icon and unit, `STOKE_STOP`, `W.nightExtra`, derived `built` and grove footprint.
- **Balance** (harness, seed 7): the Terrace earns 243 / 1,259 / 4,635 / 16,803 / 32,397 / 49,909 coins at 2 / 5 / 10 / 20 / 30 / 40 min; the Summit lights at ~38 min; seeds 3 / 7 / 11 all pass `TERRACE_CHECKS`. The Deck's curve is unchanged (32,201 at 30 min).
- Two arrow fixes found by the harness: the "get fuel" prompt no longer fires while fuel is already in the trail (the bot stood at the pile until the bowl went cold), and with a lap on the map the urgent-stoke rule only fires when the bowl is cold.

## 1.2.0 — first playable build (2026-09-11)

Everything in `docs/GAME_DESIGN.md` §14.1 (MVP Core) and §14.2 (MVP Plus) is implemented: cable-car waves, the Trail, Splash Chains, Heat and Steam Rush chains, yuzu hats, coin trays and magnet, offering steps with the accelerating drain and the paper unwrap, the upgrade sheet, Pon and Kero, FULL CAR, Golden Car, Lantern Night with lantern light, the Snack Stall, the Ridge Bridge finale and Season Fame, procedural art and WebAudio SFX, the save with offline earnings, and the headless harness.

Deviations from the v1.2 documents, all found by the harness and applied to both docs:

- **Arrow rule order** (GDD 10.6, ARCH 9.12): LIGHT now outranks LEAD and COLLECT. With the documented order a steady stream of guests kept the arrow on the platform forever and no lantern after the Cable Car was ever pointed at.
- **Logs in the trail** (rule 3) are urgent only while heat is under 40 or cold; otherwise the rule is re-checked after COLLECT. With the documented order, passing the woodpile auto-picked logs and the arrow bounced between woodpile and boiler indefinitely (158 chained rushes, 78 % of guests lost).
- **Balance table** (GDD 8.11, ARCH 17.5): replaced the hand-derived income curve with the harness measurement (287 / 1,678 / 4,963 / 15,206 / 32,078 coins at 2 / 5 / 10 / 20 / 30 min, seed 7). Pay knobs were left untouched because the unlock pacing (Bridge at ~25 min) matches the design; the difference was upgrade spending that the hand table did not account for.
- **Cable car phases** carry their overshoot across transitions so the dock-to-dock period is exact at any frame rate.
- **Harness bot** routes via the guests' lane rule when a straight line to its target crosses a solid (it used to pin itself against the Cedar Bath water).
- Settings popover is 300 px tall (the Reset row was drawn outside it); the debug overlay moved to the bottom-left.

Fixes from the fresh-eyes code review (all re-verified with the harness and a browser pass):

- Offline earnings are no longer lost if the phone locks or the tab is killed while the "Welcome back" card is still open: the save timestamp is held until COLLECT, and a resumed tab keeps the card instead of recomputing over it.
- Audio unlock is idempotent and runs on every gesture and on visibility return, so an iOS context that was suspended in the background is resumed instead of staying silent forever.
- Lantern requirement strings are parsed once at load; the palette memo no longer builds a key string per call; a no-op transparent fill in the boiler glow was removed.

Known gaps / next steps: no real-phone session yet (only the in-app browser at 375×812 and the harness), the sprite cache for low-effects mode is a stub, the Ridge zone, Kaa the crow and the Scamper dash remain stretch items.
