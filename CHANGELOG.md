# Capy Springs — changelog

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
