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
• No ads, no in-app purchases, no account, no data collected
• Every picture is drawn and every sound is made in code

## Categories and rating

- Category: Games › Casual (Apple secondary: Simulation). Play: Game › Casual. Tags: Cozy, Idle, Animals.
- Apple age rating questionnaire (2026 form): no violence, no frightening content, no mature themes, no gambling or simulated gambling, no contests, no web access, no user-generated content, no messaging, no AI chat, no purchases → **4+**.
- Google Play IARC questionnaire: category Game; violence none (a crow that takes coins is cartoon mischief, not violence); no fear, sex, language, drugs, gambling, user interaction, shared location or digital purchases → **Everyone / PEGI 3 / USK 0**.
- Play target audience: **decide before submitting.** Recommended: include under-13 age groups. The game has no ads and collects nothing, so it meets the Families policy; cute animals in a 13+-only listing risk the "appeals to children" rejection.

## Privacy answers

- Google Play **Data safety**: "Does your app collect or share any of the required user data types?" → **No**. "Is all of the user data collected by your app encrypted in transit?" → not applicable (nothing is collected). "Do you provide a way for users to request that their data is deleted?" → not applicable. Privacy policy URL as above.
- Apple **App Privacy**: **Data Not Collected**. No tracking. The app ships a privacy manifest (`ios/App/App/PrivacyInfo.xcprivacy`).
- Ads: **No** (both stores). In-app purchases: **none**.
- Apple export compliance: no non-exempt encryption (`ITSAppUsesNonExemptEncryption = false` is already in Info.plist).
- EU Digital Services Act: declare **non-trader** (an individual offering a free app) in both consoles, or the app is held back in the EU.

## Notes for the reviewer (Apple "App Review Information")

No account is needed and the game works offline. "Koban" is the in-game coin and is only earned by playing: there are no purchases of any kind. The game is a complete, self-contained Canvas game bundled in the app; it loads nothing from the internet. The version line on the title screen is just a label.

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

1. Push the latest build so the privacy and terms pages are live (open both URLs in a browser).
2. Google Play: create the developer account (personal accounts made after November 2023 must run a **closed test with at least 12 testers for 14 days** before production access, so start this early). Create the app, fill Store listing, Data safety, Content rating (IARC), Target audience, Ads = no, App access = no login. Upload the signed `.aab` (see `docs/NATIVE_BUILD.md`) to the closed-testing track first.
3. Apple: enrol in the Developer Program ($99/year), create the App ID `com.asmitdeshwal.capysprings` and the app record in App Store Connect, fill App Information, Pricing (free), App Privacy, Age Rating, the DSA trader status, the screenshots and texts above, upload a build from Xcode 26, test with TestFlight, then submit for review.
