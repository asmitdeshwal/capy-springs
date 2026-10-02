# Earning from Capy Springs: ads

The Android and iOS apps earn money two ways: ads from Google AdMob, and one optional purchase, **Remove ads**. The web version on GitHub Pages has neither. Everything is wired up with Google's **test** ids today, so nothing is earned yet. Real money starts once you have an AdMob account and paste your ids with one command (step 1 below).

## How the ads work in the game

Players choose almost every ad: a video gives them something they want. Those "rewarded" videos pay the most per view in idle games, and because they are optional they don't cost reviews. On top of that there is a short full-screen ad (an "interstitial") now and then, only at a natural pause. There are no banners: they earn little and would clutter a one-thumb screen.

| placement | what the player gets | when it shows |
|---|---|---|
| Welcome back x2 | doubles the koban earned while away | on the Welcome-back card, whenever a video is ready |
| 2x KOBAN chip | every guest pays double for 3 minutes | chip under the koban counter; back 2.5 minutes after a boost ends |
| Gift lantern | about 2.5 minutes of income | a sky lantern drifts up the screen every 3 to 5 minutes, for 16 seconds |
| Light it now | finishes the last 40% of a lantern step (steps of 150+ koban) | under the step Kit stands on; once per 4 minutes |
| FREE upgrade | an upgrade the player already has half the koban for (100+) | in the upgrade sheet, in place of the price; once per 3 minutes |
| Free gifts card | pick one: a bag of koban (~4 minutes of income), a Steam Rush, or a golden cable car | the GIFTS chip under 2x KOBAN opens it any time; each gift has its own cooldown (3 or 5 minutes) |
| Mountain chest | ~12 minutes of income, no video needed | on the Free gifts card, once five videos (from anywhere) are watched in a day; a red dot on the GIFTS chip says it is ready |
| Short ad | nothing (it pays for the game) | never for players under 13; at most once per 5 minutes of play; never in a player's first 15 minutes; never within 2 minutes of a chosen video; only within 8 seconds of a natural break (the upgrade sheet or a card closing, a lantern's celebration) and only when nothing else is happening |

Every number is in `src/02_data_ads.js` (`rules`, `GIFTS`, `SHOP`), so the balance can be tuned without touching the code.

## Step 1: the AdMob account and your ids (about 15 minutes)

1. Go to [admob.google.com](https://admob.google.com) and sign in with the Google account you want to be paid on. Pick your country and time zone carefully: they can't be changed later.
2. **Apps > Add app > Android**. "Is the app listed on a supported app store?" **No** (for now). Name: *Capy Springs*. Copy the **App ID** (it looks like `ca-app-pub-1234567890123456~1234567890`, with a `~`).
3. In that app, **Ad units > Add ad unit > Rewarded**, name it *Rewarded*, keep the default reward settings (the game decides the reward), create it and copy its id (`ca-app-pub-.../...`, with a `/`). Then **Add ad unit > Interstitial**, name it *Break*, and copy that id too.
4. Do steps 2 and 3 again for **iOS**.
5. Send the six ids to Claude, or run this yourself (one line, your own ids):

```bash
npm run ad-ids -- android-app=ca-app-pub-...~... ios-app=ca-app-pub-...~... android-rewarded=ca-app-pub-.../... android-interstitial=ca-app-pub-.../... ios-rewarded=ca-app-pub-.../... ios-interstitial=ca-app-pub-.../...
```

It writes them into `src/02_data_ads.js`, `android/app/src/main/res/values/strings.xml` and `ios/App/App/Info.plist`, switches `test` off once all four ad units are real, and prints your `app-ads.txt` line. Then `npm run deploy` and run the store builds (`docs/NATIVE_BUILD.md`). `npm run ad-ids` alone shows what the apps use now; `npm run ad-ids -- test` goes back to test ads.

A brand-new AdMob app shows few ads until Google has reviewed it and it is linked to its store listing. After the game is published: **App settings > App store details > Add** in AdMob, for each app.

## Step 2: privacy messages (Europe and US states)

In AdMob, **Privacy & messaging**:

- **European regulations**: create a message, select both apps, publish it. The game shows Google's consent form automatically at first launch to players in Europe, the UK and Switzerland, and *Settings > Privacy choices* lets them change their answer. Without this message Google shows very few ads in Europe.
- **US state regulations**: create and publish it too (it adds the "don't sell or share" choice that some US states require).
- **IDFA explainer (iOS)**: optional. The game already asks the iPhone tracking question itself, for players 16 and over.

## Step 3: app-ads.txt (protects your income)

Advertisers check a small text file on your website that says who may sell ads in your app; apps without it earn noticeably less. The file must sit at the root of the "developer website" in your store listings. The free way is a GitHub Pages user site:

1. Create a public GitHub repository named exactly `asmitdeshwal.github.io`.
2. Add a file `app-ads.txt` with the one line `npm run ad-ids` printed: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
3. In Play Console and App Store Connect, set the developer website / marketing URL to `https://asmitdeshwal.github.io`.

Claude can do steps 1 and 2 once you share your publisher id (the 16 digits after `pub-`; it is not a secret).

## The Remove ads purchase

One-time and non-consumable: it turns the short ads off for good on that store account, while the optional videos (and their gifts) stay. Players find it in **Settings > Remove ads**, through the link on the Free gifts card, and once every two days at most right after a short ad. Restore is on the same card. The product id is `capysprings.remove_ads` in both stores; the price shown in the game comes from the store, in the player's currency. A typical price for this in idle games is **US$2.99**.

**Google Play** (after the first `.aab` is uploaded, because Play only allows products once a build with billing exists):
1. Play Console > Settings > **Payments profile**: create the merchant profile (needed to sell anything).
2. Your app > Monetize with Play > Products > **One-time products** > Create: product id `capysprings.remove_ads`, name *Remove ads*, description *Turns off the short ads between moments of play. The optional reward videos stay.*, price US$2.99 (Play converts it for every country) > Activate.
3. Settings > **License testing**: add your Gmail, so your own test purchases are free.

**App Store**:
1. App Store Connect > Business (Agreements, Tax and Banking): accept the **Paid Apps** agreement and add your bank and tax details. Purchases don't work until it is active.
2. Your app > Monetization > **In-App Purchases** > **+** > *Non-Consumable*: reference name *Remove ads*, product id `capysprings.remove_ads`, price US$2.99, a display name and description, and a review screenshot (the Remove ads card).
3. On the app version page, add the purchase under *In-App Purchases* so it is reviewed together with the build. TestFlight purchases are free (sandbox).

## Step 4: test without breaking the rules

- The debug APK the cloud build makes (`capy-springs-debug-apk`) **always** shows Google's test ads, whatever ids the game holds, so tap away.
- **Never tap real ads in your own app**, and don't ask friends to: Google closes accounts for invalid clicks. With real ids, add your phone as a test device first: AdMob > Settings > Test devices > Add (on Android the advertising ID is in the phone's Settings > Google > Ads).
- Simplest path: keep the test ids through the closed test and TestFlight, then run `npm run ad-ids` just before the public release.

## Step 5: getting paid

In AdMob, **Payments**: add your tax information (outside the US, Google's W-8BEN form, a few questions) and a bank account. Google posts a PIN letter to your address once earnings reach about US$10; enter it in AdMob to verify the address. After that, Google pays monthly, around the 21st, once the balance passes the payment threshold (US$100 in most countries, or the local equivalent).

Remove ads money comes separately, from the stores: Google Play pays monthly to the payments profile, keeping 15% of the first US$1 million a year; Apple pays monthly to the bank account in the Paid Apps agreement and keeps 30%, or 15% once you join its free **App Store Small Business Program** (apply as soon as your developer account exists).

## Earning more later (optional)

- **More ad buyers (mediation)**: AdMob > Mediation can add other networks (AppLovin, Unity, Meta, Liftoff and others) that bid for every ad, which usually raises earnings. Each needs a small adapter in the app: ask Claude when the game has steady players.
- **Read the AdMob dashboard**: if the "show rate" is low, ask Claude to look; if players complain about the short ads, raise `interstitialEvery` in `src/02_data_ads.js`.

## Rules the game already follows (for the store reviews)

- Videos are always optional, marked with a play icon, and say what they give before they play. Remove ads never touches them, so a player who paid still gets every gift. If a video fails, the player keeps everything they had.
- Short ads come only at natural breaks: never at launch, never while the player is steering Kit, never during the ending, and never more than once per 5 minutes.
- **The neutral age question** (`src/64_age.js`): before any ad loads, the app asks the player's birth year (a decade, then a year; no default and no hint about why). Under 13: every request is child-directed (only general-audience ads, nothing personalised, no consent or tracking prompts) and there are no short ads at all, only the optional videos, as COPPA and Google Play's Families policy require for a game that children may play. Under 16: also tagged as under the age of consent and no tracking prompt. Everyone else: ads rated up to PG.
- Consent: Google's consent message (Europe, the UK, Switzerland and US states) before ads load; *Settings > Privacy choices* when required; Apple's tracking question on iPhone for players 16 and over.
- AdMob is a Families self-certified ads SDK. The privacy policy (`privacy.html`) describes what Google collects and what the age question changes.
- The web version never loads an ad network.

## Where it lives

| file | what |
|---|---|
| `src/02_data_ads.js` | ad unit ids, the test switch, every timing rule |
| `src/61_ads.js` | AdMob through `@capacitor-community/admob`: consent, tracking question, loading, showing, the developer-mode stand-in ad |
| `src/62_offers.js` | the five video offers and when a short ad may play |
| `src/64_age.js` | the neutral age question |
| `src/65_gifts.js` | the GIFTS chip, the Free gifts card, the Mountain chest (the day's count and cooldowns are stored on the phone as `capysprings.gifts`) |
| `src/66_shop.js` | Remove ads through `@capgo/native-purchases` (Google Play Billing, StoreKit 2): price, buy, restore, the check at every launch, the card |
| `tools/ad_ids.js` | `npm run ad-ids`: writes your ids into the three files |
| `android/.../res/values/strings.xml`, `ios/App/App/Info.plist` | the AdMob app ids (plus SKAdNetwork ids and the tracking text on iOS) |

To try every flow on the web: developer mode (`?dev=1`) > *Test ads on/off*, then *Gift lantern now*, the x2 on the Welcome-back card, a FREE pill in an upgrade sheet, the GIFTS chip, or *Age question*. A 3-second stand-in plays where the store app would show a real ad. In developer mode the Remove ads card buys from a pretend store; *Reset gifts & purchase* puts both back.
