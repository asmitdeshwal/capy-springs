# Capy Springs — store listing kit

Everything Google Play Console and App Store Connect ask for, ready to paste. Links: the game https://asmitdeshwal.github.io/capy-springs/, privacy policy https://asmitdeshwal.github.io/capy-springs/privacy.html, terms https://asmitdeshwal.github.io/capy-springs/terms.html, support https://github.com/asmitdeshwal/capy-springs/issues.

## Names and short texts

| field | limit | text |
|---|---|---|
| App name (both stores) | 30 | Capy Springs |
| Apple subtitle | 30 | A cosy capybara hot spring |
| Play short description | 80 | Lead capybaras into hot springs and grow a cosy inn up a magical mountain. |
| Apple promotional text | 170 | Wake the sleeping Source at the top of the mountain! Lead capybaras, ducks and snow monkeys into steaming baths, light lanterns and grow your inn, one thumb at a time. |
| Apple keywords | 100 bytes | capybara,hot spring,onsen,cozy,idle,relaxing,cute,animals,inn,builder,offline,casual |

## Full description (both stores, under 4,000 characters)

You are Kit, a young fox who has just been handed the keys to a tiny hot-spring inn on the side of a mountain. Grandma Yuzu has gone up the mountain to tend the Source, the ancient spring that feeds every bath, and left you a single rock pool, a cable car and a lot of very sleepy capybaras.

Lead them in. Drag anywhere to walk, and guests follow you in a wobbly line. Walk onto a bath and they hop in with a splash. Drop three in at once for a Splash Chain. Soaked guests pay in gold koban, and koban light lanterns: stand on a glowing stone step and watch your coins pour in until something new appears.

Grow the inn up the mountain:
• The Deck: cedar and bamboo baths, a boiler to keep them hot (carry logs!), a yuzu grove for golden baths, a mochi stall, and the cable car that brings guests and ducks up the slope.
• Hire help: Pon stokes the boiler, Kero picks the yuzu.
• Lantern Nights, Steam Rushes and Golden Cars keep every few minutes exciting.
• The Ridge: cross the bridge into the snow for a sauna, an icy cold plunge (hot, then cold, pays double), Madame Tsuru's massage pavilion and its gong, the Ridge Lift, and snow squalls to clear.
• The Summit: climb the pilgrim stairs above the clouds, where snow monkeys hop down the cliff and the Source's geyser bursts every few seconds.

And then wake the Source. The whole mountain steams at once, everyone you ever met gathers at the pool, and the story is complete. After that the Golden Age begins: Source Stars turn the seasons from spring to winter, and Festival Nights come with fireworks and a score to beat.

Every day the Guestbook sets three small goals with stamps to collect. The inn keeps earning while you are away.

• One thumb, portrait, made for short breaks or long soaks
• Plays fully offline
• No in-app purchases and no account: optional videos give bonuses
• Every picture is drawn and every sound is made in code

## Categories and rating

- Category: Games › Casual (Apple secondary: Simulation). Play: Game › Casual. Tags: Cozy, Idle, Animals.
- Apple age rating questionnaire: no violence, no frightening content, no mature themes, no gambling or simulated gambling, no contests, no unrestricted web access, no user-generated content, no messaging, no AI chat, no purchases. If it asks about advertising, answer **Yes**. Expected result **4+**: the ads are limited to PG, and to general-audience content for players under 13.
- Google Play IARC questionnaire: category Game; violence none (a crow that takes coins is cartoon mischief, not violence); no fear, sex, language, drugs, gambling, user interaction, shared location or digital purchases → **Everyone / PEGI 3 / USK 0**. The "contains ads" question: **Yes**.
- Play **Target audience**: tick **6–8, 9–12, 13–15, 16–17 and 18+** (a mixed audience). Cute animals would get a 13+-only listing flagged as "appeals to children" anyway, so the game is built for the Families policy instead: a neutral age screen at first launch (`src/64_age.js`), child-directed and non-personalised G-rated ads for players under 13 and no short ads for them at all, and AdMob, which is a Families self-certified ads SDK. When Play asks: the app uses a **neutral age screen**, the ads SDK is **Google AdMob**, and ads to children are **not personalised**.

## Privacy answers

The game's own code collects nothing; everything below is what the Google Mobile Ads SDK collects in the store apps (Google's published guidance for AdMob). The web version collects nothing at all.

- Google Play **Data safety**: collects data → **Yes**; shares data → **Yes** (with Google, for ads). Data types:
  - Location › **Approximate location** (from the IP address): collected and shared; for Advertising or marketing, Analytics, Fraud prevention, security and compliance.
  - App activity › **App interactions** (ad views and taps): collected and shared; same purposes.
  - App info and performance › **Diagnostics**: collected and shared; Analytics, Fraud prevention.
  - Device or other IDs › **Device or other IDs** (the advertising id): collected and shared; Advertising or marketing, Analytics, Fraud prevention.
  - Collection is not optional (ads pay for the game), encrypted in transit → **Yes**, deletion requests → **No** (no account; the developer holds no data).
- Play **App content** also asks: Ads → **Yes**. Advertising ID → **Yes**, used for Advertising or marketing, Analytics and Fraud prevention. Government app, financial features, health → no.
- Apple **App Privacy**: Data collected → **Yes**, by the ads SDK, none of it linked to the player's identity:
  - Identifiers › **Device ID**: Third-Party Advertising, Analytics; **used for tracking** (only when the player allows it).
  - Usage Data › **Product Interaction** and **Advertising Data**: Third-Party Advertising, Analytics; Advertising Data **used for tracking**.
  - Location › **Coarse Location**: Third-Party Advertising, Analytics.
  - Diagnostics › **Crash Data**, **Performance Data**, **Other Diagnostic Data**: Analytics, App Functionality.
- In-app purchases: **none** (both stores).
- Apple export compliance: no non-exempt encryption (`ITSAppUsesNonExemptEncryption = false` is already in Info.plist).
- EU Digital Services Act: declare **non-trader** (an individual offering a free app) in both consoles, or the app is held back in the EU. (If the ads income ever makes this a business, switch to trader with a business address.)

## Notes for the reviewer (Apple "App Review Information")

No account is needed and the game works offline. "Koban" is the in-game coin and is only earned by playing; nothing can be bought. At first launch the game asks the player's birth year (a neutral age screen) so that players under 13 get only child-directed, non-personalised ads; players 16 and over then see Apple's tracking question, and players in Europe see Google's consent form. Ads are optional reward videos (marked with a play icon) plus an occasional short ad at a natural pause. The game is a complete, self-contained Canvas game bundled in the app; only the ads use the network. The version line on the title screen is just a label.

## Screenshots and graphics

| asset | size | count |
|---|---|---|
| Apple iPhone 6.9" | 1290 × 2796 (or 1320 × 2868) | 3–10 |
| Google Play phone | 1080 × 1920 (9:16; long side ≤ 2 × short side) | 2–8 |
| Google Play feature graphic | 1024 × 500, no alpha | 1 (`assets/feature-graphic.png`, made by `node tools/feature_graphic.js`) |
| Google Play icon | 512 × 512, 32-bit PNG | 1 (`icons/icon-512.png`) |
| Apple icon | 1024 × 1024, no alpha | generated into the Xcode project by `npm run native` |

iPad screenshots are not needed: the iOS build is iPhone-only (iPads run it in compatibility mode).

Capture: `case-study/tools/shoot.js` drives the in-game capture page; it now also has a Play profile (360 × 640 CSS at 3× = 1080 × 1920) that writes to `case-study/assets/screens-play/`.

Suggested six shots and captions:
1. A Splash Chain on the Deck, three capybaras mid-plop — "Lead capybaras into steaming baths"
2. A lantern step filling, the label showing what it builds — "Light lanterns to grow your inn"
3. Lantern Night on the Deck, every lamp glowing — "Lantern Nights, Steam Rushes, Golden Cars"
4. The Ridge: sauna, cold plunge and the pavilion with Madame Tsuru — "A sauna, a cold plunge, a massage by the gong"
5. The Summit: snow monkeys and the geyser bursting — "Snow monkeys and a geyser above the clouds"
6. The Guestbook card with stamps — "Three little goals every day"

## Console checklist (in order)

1. **AdMob** (`docs/MONETIZATION.md`): create the account, the two apps and four ad units; publish the European and US-states messages under Privacy & messaging. Keep the test ids in the game until the public release.
2. **Builds** (`docs/NATIVE_BUILD.md`): `npm run store-keys -- android` and `npm run store-keys -- ios ...`, then run the Android and iOS builds on GitHub.
3. **Google Play**: create the developer account early (personal accounts made after November 2023 must run a **closed test with at least 12 testers for 14 days** before production). Create the app; fill Store listing, Data safety, Ads = yes, Advertising ID, Content rating (IARC), Target audience (mixed, with the neutral age screen), App access = no login. Upload the `.aab` to the closed-testing track.
4. **Apple**: enrol in the Developer Program ($99/year), register the App ID and create the app record, fill App Information, Pricing (free), App Privacy, Age Rating, the DSA trader status, the screenshots and texts above; run the iOS build to send a build to TestFlight, test it, then submit for review.
5. **Before going public**: `npm run ad-ids -- ...` with your real ids, `npm run deploy`, new builds to both stores, then put `app-ads.txt` on `https://asmitdeshwal.github.io` and use that address as the developer website in both stores. Once live, link each AdMob app to its store listing.
