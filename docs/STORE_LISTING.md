# Capy Springs – store listing kit

Everything the Google Play Console and App Store Connect ask for, in the order they ask for it, ready to paste. The character limits are the stores' own. How to build and sign the apps is in `docs/NATIVE_BUILD.md`. Current version: **1.10.0**, build **11000** (both set by `npm run deploy`).

## 1. Names and short copy

| field | limit | text |
|---|---|---|
| App name (both stores) | 30 chars | `Capy Springs` |
| Apple subtitle | 30 chars | `A cosy capybara hot spring` |
| Play short description | 80 chars | `Lead capybaras into hot baths and grow a mountain inn, one thumb, no ads.` |
| Apple promotional text | 170 chars | `Guide capybaras into steaming baths, keep the boiler hot and light lanterns to grow your inn up the mountain. Offline, no ads, no purchases, no account.` |
| Apple keywords | 100 bytes, comma-separated | `capybara,hot spring,onsen,cozy,cosy,idle,inn,spa,relaxing,casual,offline,mountain,lantern,sauna` |
| Category | | **Games › Casual**, secondary **Simulation** (same on both stores) |

Promotional text is the one Apple field you can change without a new build; keywords are not shown to anyone and should not repeat the app name.

## 2. Full description (both stores, up to 4000 characters)

```
Capy Springs is a small, warm game about running a hot-spring inn on a mountain, with a line of capybaras who would very much like a bath.

You play Kit, the fox innkeeper. Put your thumb anywhere on the lower half of the screen and drag: Kit walks, and the capybaras waiting at the gate fall into a wobbly line behind you. Lead them to a steaming bath, let go, and in they go. Soaked guests pay in koban as they leave; land a few in a row for a Splash Chain.

The water only stays hot if the boiler does. Feed it now and then and you get a Steam Rush, when every bath fills faster and pays more. Drop a yuzu from the grove into the water for double pay. Nothing can go wrong here: there is no failure state, no timer that punishes you, no lives.

Spend your koban on lanterns. Each one you light opens something new, and the inn climbs the mountain:

• The Deck: more baths, a bigger boiler, the yuzu grove, the mochi stall, a cable car that brings guests up the slope, the helpers Pon and Kero, and Lantern Nights when the whole inn glows.
• The Ridge: cross the Ridge Bridge to the Sauna Hut, the Cold Plunge, the Massage Pavilion with Madame Tsuru, and the Ridge Lift that brings Momo the VIP. Up here the snow squalls roll in and the baths steam even harder.

Every day the Guestbook sets three small goals and stamps a card when you finish them. Close the game whenever you like: the inn keeps earning while you are away, and the koban are waiting when you come back.

What it is not:
• No ads.
• No in-app purchases, ever. Everything in the game is earned by playing.
• No account, no sign-in, no personal data.
• No internet needed. The whole game lives on your phone.

All of the art and sound is drawn and played by the game itself. A few minutes is a session; a few weeks is an inn.
```

(about 1,700 characters; never compares the game to any other, never names another product)

## 3. URLs and contact

| field | value |
|---|---|
| Support URL (both) | https://github.com/asmitdeshwal/capy-springs/issues |
| Marketing URL (Apple, optional) / Website (Play) | https://asmitdeshwal.github.io/capy-springs/ |
| Privacy policy URL (required by both) | https://asmitdeshwal.github.io/capy-springs/privacy.html |
| Terms (not asked for, linked from the privacy page) | https://asmitdeshwal.github.io/capy-springs/terms.html |
| Support email (Play shows it publicly; Apple keeps it for review contact) | the developer account's address |
| Copyright (Apple) | `© 2026 Asmit Deshwal` |

## 4. Notes for review

Apple: *App Review Information › Notes*. Play: *App access* (and the optional "instructions" box if a reviewer asks).

> No account needed. Offline. 'Season Pass'/'koban' are in-game currency only, there are no purchases. The version line on the title screen is just a label.

Sign-in required: **No** (Apple). Play › App access: **All functionality is available without special access**.

## 5. Privacy

The game stores its save on the device only (localStorage mirrored into Capacitor Preferences). It makes no network requests at runtime, has no analytics, no crash reporter, no ads SDK and no account. Data that never leaves the device is not "collected" in either store's definition.

### Google Play › Data safety (Policy › App content › Data safety)

| question | radio button |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | not shown once the first answer is No (n/a) |
| Do you provide a way for users to request that their data is deleted? | not shown once the first answer is No (n/a); nothing to delete, there is no server copy |

Result shown on the listing: "No data shared with third parties", "No data collected".

### Apple › App Privacy (App Store Connect › App › App Privacy)

"Do you or your third-party partners collect data from this app?" → **No**. The listing then shows the **"Data Not Collected"** label. Enter the privacy policy URL above on the same page.

### Apple › privacy manifest and export compliance (in the build, nothing to click)

`ios/App/App/PrivacyInfo.xcprivacy` is in the app target: `NSPrivacyTracking` false, no collected data types, no tracking domains, and `UserDefaults` declared with reason `CA92.1` (the Preferences plugin writes the save there). `Info.plist` carries `ITSAppUsesNonExemptEncryption = false`, so the "Does your app use encryption?" question is answered at upload and never blocks a build.

## 6. Content rating

### Apple age rating questionnaire → **4+**

Answer **None / No** to every item, as the questionnaire is worded in App Store Connect today:

- Violent themes: cartoon or fantasy violence **None**; realistic violence **None**; prolonged graphic or sadistic violence **None**.
- Mature themes: profanity or crude humour **None**; horror or fear themes **None**; sexual content or nudity **None**; alcohol, tobacco or drug use or references **None**; contests **None**; gambling **No**; simulated gambling **None**; loot boxes or random digital items for money **No**.
- Medical / wellness: medical or treatment information **None**; health or wellness topics **None**.
- Capabilities: unrestricted web access **No**; user-generated content **No**; messaging or chat **No**; advertising **No**.
- In-app controls: parental controls **No**; age assurance **No**.

Do **not** opt into Apple's *Kids* category: it adds parental-gate rules for every outbound link and gains nothing; a 4+ rating is enough.

### Google Play IARC questionnaire → **Everyone (ESRB) / PEGI 3** (also USK 0, ACB G, ClassInd L, GRAC All)

1. Category: **Game**.
2. Violence: **No**. Sexuality / nudity: **No**. Profanity or crude humour: **No**. Controlled substances: **No**. Gambling / simulated gambling: **No**. Frightening or disturbing content: **No**. Discrimination or hate: **No**.
3. Interactive elements: users interact or exchange content with other users **No**; shares user's location **No**; users can purchase digital goods **No**; contains ads **No**; unrestricted internet access **No**.

Re-answer the questionnaire whenever a release adds anything on that list (it is per-app, not per-release, but must stay true).

## 7. Play target audience and content: a decision for the owner

Play › *Policy › App content › Target audience and content* asks which age groups the app is for.

- **Option A (recommended): all age groups, including under 13.** Picking any group under 13 puts the app under Google's **Families policy**. Capy Springs already meets it: no ads, no ad SDK, no data collection, no advertising ID, no sign-in, no outbound links inside the game, a privacy policy URL, content rated Everyone, current target API. Nothing to change in the code. Google may take a little longer to review a Families app and will re-check on every release that still nothing is collected. (Joining the optional *Designed for Families* program is a separate opt-in and is not needed.)
- **Option B: 13+ only.** Less policy surface, but the console then asks "Could your app unintentionally appeal to children?" and a cute capybara game is plainly yes; Google can bounce the declaration and ask for Option A anyway.

Choose A unless you specifically want to keep the app out of the Families program. Whatever you choose, the "Store presence" question (is the app appealing to children) should be answered honestly: **yes**.

## 8. Other Play declarations (Policy › App content)

| item | answer |
|---|---|
| Ads | **No, my app does not contain ads** |
| Advertising ID | **No**, the app does not use advertising ID |
| App access | All functionality is available without special access |
| News app | No |
| COVID-19 contact tracing / status | No |
| Government app | No |
| Financial features | My app doesn't provide any financial features |
| Health | My app does not have any health features |
| App category | Game › Casual; tags (optional): Idle, Simulation, Cute |
| Pricing | **Free** (permanent: a free app can never be made paid) |
| Countries | all |

## 9. EU Digital Services Act: trader status

Both consoles must know whether you sell as a trader in the EU before an app can be shown there. Answer **non-trader** (an individual; the app is free with no purchases).

- Play: *Developer account › Account details › Trader status* (or the DSA banner on the dashboard) → **I'm not a trader**.
- Apple: *App Store Connect › Business › Trader Status* (shown at account level, the Account Holder answers) → **not a trader**.

Non-trader apps carry a short "the developer is not a trader" note on EU listings; that is expected. Selling anything later means re-declaring as a trader and publishing a verified address and phone number.

## 10. Artwork

### Apple (App Store Connect › version › App Previews and Screenshots)

| asset | size | count | notes |
|---|---|---|---|
| iPhone 6.9" screenshots | **1290 × 2796** px portrait (PNG or JPEG) | **1 to 10** | the only required set; Apple scales it for smaller phones. No iPad set, the app is iPhone-only. |
| App icon | from the build (`Assets.xcassets/AppIcon`, 1024 px) | – | nothing to upload |

### Google Play (Grow › Store presence › Main store listing)

| asset | size | count | notes |
|---|---|---|---|
| Phone screenshots | **9:16, 1080 × 1920** px (PNG or JPEG, each side 320–3840 px) | **2 to 8** | tablet shots are optional and skipped |
| Feature graphic | **1024 × 500** px, PNG (opaque) or JPEG | 1 | `assets/feature-graphic.png`, made by `node tools/feature_graphic.js`: cream sky, pine ground, the capybara, no text (Play draws the title and icon over it) |
| App icon | **512 × 512** px, 32-bit PNG | 1 | `icons/maskable-512.png` (full-bleed amber; Play applies its own rounded mask) |

If the Play Console rejects a PNG for carrying an alpha channel (the rasterizer and Chrome both write RGBA, fully opaque), save it as JPEG at quality 90 in any image editor and upload that.

### Suggested shots and captions (six)

Both stores want any caption text baked into the image; the capture rig writes raw frames, so add the words in an image editor (or upload the raw frames, which is allowed). Names refer to `SHOTS` in `case-study/tools/shoot.js`.

| # | frame | caption |
|---|---|---|
| 1 | `02-core-loop` | **Lead the capybaras to the bath.** One thumb, no buttons. |
| 2 | `03-splash-chain` | **Three in a row: Splash Chain.** |
| 3 | `05-steam-rush` | **Keep the boiler hot for a Steam Rush.** |
| 4 | `06-upgrade-sheet` | **Light lanterns, grow the inn.** |
| 5 | `07-lantern-night` | **Lantern Night on the mountain.** |
| 6 | `09-offline-card` | **The inn keeps earning while you're away.** |

A Ridge shot (sauna, cold plunge, snow) would make a good seventh once `capture.html` has a query for it; add an entry to `SHOTS`.

### How to produce them

```bash
node tools/serve.js 5199                              # terminal 1, from the project root
node case-study/tools/shoot.js                        # terminal 2: App Store set, 1290 x 2796  -> case-study/assets/screens/
node case-study/tools/shoot.js --profile=play         #             Play set, 1080 x 1920       -> case-study/assets/screens-play/
node tools/feature_graphic.js                         # assets/feature-graphic.png, 1024 x 500
node tools/pack.js                                    # icons/maskable-512.png (and the rest of the web build)
```

The rig needs Chrome on this PC (`CHROME=` overrides the path) and Node 22+. Twelve frames come out per profile; pick six.

## 11. Play closed-testing requirement

Personal developer accounts created after 13 November 2023 cannot publish to production straight away. Play requires a **closed test with at least 12 testers opted in continuously for 14 days** first; after that you *apply for production access* from the dashboard (a short form about what the testers found) and Google approves it, usually within a few days. Plan the 14 days into the launch: gather 12 e-mail addresses (friends, a Google Group) before uploading, and keep the testers installed the whole fortnight. Internal testing (up to 100 testers, instant) is separate and does not count.

## 12. Console checklist, in order

### Google Play

1. Play Console › *Create app*: name **Capy Springs**, default language English (United Kingdom or United States, pick one and keep it), **Game**, **Free**; accept the declarations.
2. *Dashboard › Set up your app*, top to bottom: privacy policy URL → app access → ads (No) → content rating (section 6) → target audience (section 7) → news app (No) → COVID-19 (No) → data safety (section 5) → government app (No) → financial features (none) → health (none) → advertising ID (No) → app category + contact details (email, website) → store listing (sections 1–3, artwork section 10).
3. Trader status (section 9) and the identity verification Google asks for on new accounts.
4. Build: `npm run deploy` (bumps 1.10.x and the native numbers) → `npm run native` → Android Studio › *Build › Generate Signed App Bundle* (create the upload keystore once; keep it safe) → the `.aab`.
5. *Testing › Internal testing*: upload the `.aab`, install it on your own phone from the opt-in link, play for ten minutes.
6. *Testing › Closed testing*: create a track, add the 12+ testers, roll out, send them the opt-in link; wait 14 days (section 11).
7. *Dashboard › Apply for production access* → wait for approval.
8. *Production*: create a release with the same (or a newer) `.aab`, countries: all, roll out 100 %. First review takes a few days; later updates are usually hours.

### App Store

1. developer.apple.com › enrol in the Apple Developer Program (paid, needs identity verification; a day or two). Certificates and profiles are automatic from Xcode with *Signing & Capabilities › Automatically manage signing*.
2. App Store Connect › *Business › Trader Status* (section 9), and check *Agreements* shows the free-apps agreement as active.
3. App Store Connect › *Apps › + › New App*: iOS, name **Capy Springs** (must be unique on the store; if taken, append nothing silly, ask here first), primary language, bundle ID `com.asmitdeshwal.capysprings`, SKU `capysprings`, full access.
4. *App Information*: subtitle, category Games / Casual + Simulation, content rights ("does not contain, show or access third-party content"), age rating (section 6).
5. *Pricing and Availability*: Free, all territories.
6. *App Privacy*: Data Not Collected + privacy policy URL (section 5).
7. Version page (1.10.0): screenshots (section 10), promotional text, description, keywords, support URL, marketing URL, copyright (sections 1–3); *App Review Information*: contact details, sign-in **No**, notes (section 4); *Version Release*: manual or automatic.
8. Build: `npm run deploy` → `npm run native` → on the Mac or CI runner, Xcode › *Product › Archive › Distribute App › App Store Connect › Upload* (export compliance is pre-answered by `Info.plist`). Wait for "processing" to finish (10–30 minutes), then select the build on the version page.
9. Optional but wise: *TestFlight* › internal testers (yourself) for a day.
10. *Add for Review › Submit*. First review usually takes one to three days; replies from App Review arrive in *Resolution Center*.

### After launch

Every update: `npm run deploy` → `npm run native` → upload a new build (the build number grows automatically: 1.10.1 → 11001) → re-check that the Data safety / App Privacy answers are still true → submit.
