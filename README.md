# Capy Springs

A one-thumb, offline, arcade-idle resort builder. You are Kit, a fox innkeeper on a mountain hot spring: lead capybaras in a wobbly line into steaming baths, land Splash Chains, feed the boiler for Steam Rushes, drop yuzu in the water for double pay, and light lanterns with coins to grow the inn. No failure state, no internet needed.

The game comes in **seasons**. Season 1 is the Deck (the hot spring). Light the Ridge Bridge, then the **Season Pass** (5,000 koban) beside it, and Season 2 opens: **The Mochi Terrace**, an autumn teahouse where you pound rice into mochi, seat guests at tables, run laps around the mortar and tap a thieving crow. Each season has its own save and keeps earning while you are away; the gear menu's **Seasons** card shows what is left to buy and lets you travel back and forth. To peek at Season 2 without earning it, open `index.html?season=2`.

## Play it right now

**On this PC:** double-click `index.html`. It opens in your browser and runs from the file, no install.
Controls: **WASD / arrow keys** move, **Enter / Space** starts from the title, **E** opens the nearest station's upgrade sheet, **Esc** closes, **M** mutes, **`** shows the debug overlay (or add `?debug=1` to the address), **F2** opens the developer panel (in developer mode).

**On your phone (same Wi-Fi):**

```bash
node tools/serve.js
```

It prints a `http://192.168.x.x:5173` address. Open that on the phone, then "Add to Home Screen" for a full-screen icon. Touch anywhere in the lower part of the screen and drag: that is the joystick. Tap a bath, the boiler, the grove or the stall to upgrade it.

## Install it on your iPhone (no server needed afterwards)

The game is a packaged web app: a manifest, an icon set and a service worker that keeps a copy of every file on the phone. iPhones install these from **Safari** via **Add to Home Screen**, and they only allow the offline part from an **https** address, so the Wi-Fi address above is not enough. Two ways to get one:

**Today, in two minutes (temporary link):**

```bash
npm run share
```

It starts the server and a free Cloudflare "quick tunnel" and prints an address like `https://something.trycloudflare.com`. On the iPhone: open that address **in Safari**, wait for the title screen, tap **Share** (the square with the arrow) → **Add to Home Screen** → **Add**. Open the new icon once while the link is still running. From then on it works offline, full screen, without this PC. The link stops when you close the window; the installed app keeps working. (The first time, `npm run share` tells you to install the tunnel tool with one `winget` command.)

**For good (permanent link, updates itself):** the game is published on GitHub Pages from this folder's `main` branch. Add that address to the home screen the same way as above (Safari → Share → Add to Home Screen). Whenever you change the game, run:

```bash
npm run deploy
```

It bumps the version, rebuilds the icons and service worker, commits and pushes; GitHub Pages rebuilds in about a minute, and the phone picks up the new version the next time the app is opened online (if it was already open during the rebuild, the time after that). Saves and developer mode on the phone survive updates. The address is `https://asmitdeshwal.github.io/capy-springs/`; the code lives at `github.com/asmitdeshwal/capy-springs`.

Good to know: the home-screen app has its own save, separate from Safari's; a tap on the icon opens it full screen with no browser bars; sound starts on the first touch.

**Windows / Mac PC (Chrome or Edge):** run `node tools/serve.js`, open `http://localhost:5173`, and click the **install icon** at the right end of the address bar (or menu → "Install Capy Springs"). You get a Start-menu / desktop app with its own window that runs with the server off.

**Android (if ever needed):** same as the iPhone, from Chrome ("Install app"). A real APK would need a Capacitor project plus Android Studio (`npm i -D @capacitor/core @capacitor/cli @capacitor/android`, `npx cap init`, `npx cap add android`).

Rebuild the icons, the service worker and `dist/` after any change with:

```bash
node tools/pack.js
```

## Developer mode (for testing)

Open `index.html?dev=1` once, or — on the phone — tap the **version line** seven times quickly (the bottom edge of the Settings box, or the bottom of the title screen; after four taps it counts down for you). A **DEV** chip appears under the gear and a **DEV MENU** button on the title; **F2** also opens the panel on a PC. It gives you koban (+1,000, +100,000, infinite), game speed ×2 / ×4, every lantern lit, every upgrade maxed, "finish this season", unlock all seasons, jump to any season, start a night / Harvest Moon now, make the next car golden, call Kaa, fill or empty the gauge, the debug overlay, and resets. `?dev=0` turns it off.

## What is in the box

| Folder | What |
|---|---|
| `index.html` | the page: boot screen, the ordered file list (`CAPY_FILES`), service-worker registration |
| `src/` | the whole game: 46 small files, plain JavaScript, Canvas 2D, no libraries, no images, no audio files (all art and sound are drawn/synthesised in code). `03_pack_s2.js` + `25_art_s2.js` are Season 2; `04_seasons.js` switches seasons; `53_title.js` is the title screen; `54_dev.js` the developer panel; `55_goals.js` the Guestbook (three daily goals, stamps, a stamp card) |
| `manifest.webmanifest`, `sw.js`, `icons/` | what makes it installable and offline (generated by `tools/pack.js`) |
| `dist/` | a clean copy to upload to a host (`node tools/pack.js`) |
| `tools/share.js` | `npm run share`: a temporary https link so a phone can install the game |
| `docs/GAME_DESIGN.md` | the game design: rules, numbers, characters, UI, art and audio direction |
| `docs/SEASONS.md` | the seasons framework and the full Season 2 spec (map, ladder, cast, mechanics, measured balance, how to add Season 3) |
| `docs/ARCHITECTURE.md` | how the code is shaped: modules, contracts, save format, test harness |
| `test/headless.js` | a simulator that plays the game with a bot for 30 minutes in a few seconds and checks the economy, save/load and invariants |
| `test/art_smoke.html` | every character, pose and structure on one page |
| `test/balance/` | the measured economy curve |
| `tools/serve.js` | tiny local server for phone testing |

Numbers live in `src/00_config.js` (tuning) and `src/02_data_*.js` (map, baths, lanterns, guests). Change a number there, refresh, done.

## Check that everything still works

```bash
node test/headless.js --seconds 1800
```

Prints `PASS` when the bot reaches every milestone (Cedar Bath by 30 s, Pon by 10 min, Bamboo Tub by 20 min, and so on) and no invariant breaks. `node test/headless.js --fuzz 300` hammers it with random input. Run both after any change, and the same two with `--season 2` (use `--seconds 2400` for the Terrace's Summit milestone).

## Where to go next

- Play it on a real phone for 20 minutes with `?debug=1` and watch the overlay stay green (60 fps target).
- Tune feel in `00_config.js`: Kit's speed, soak times, car period, drain rates.
- When you want an app-store build: wrap this folder with Capacitor (Android/iOS) — nothing in the game needs a server.
- Season 3: follow `docs/SEASONS.md` §17.6 (copy the Season 2 pack and art file, add a `travel:3` step to the Terrace's ladder).
- Remaining stretch ideas from `docs/GAME_DESIGN.md` §14.3: the Scamper dash, cosmetic headbands, photo mode (the Guestbook daily goals shipped in 1.10.0).
