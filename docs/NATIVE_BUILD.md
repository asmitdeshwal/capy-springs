# Building Capy Springs for Google Play and the App Store

The game is a plain web app; Capacitor 8 wraps the packed copy in `dist/` into native Android and iOS apps (`android/` and `ios/`, both committed). **Both store builds run in the cloud on GitHub Actions**, free for this public repository, so no Android Studio and no Mac are needed. This PC only needs Node, Git and the GitHub CLI, which it already has.

| workflow | runs when | gives you |
|---|---|---|
| `.github/workflows/android.yml` (Ubuntu) | every push to `main` that touches the game (so every `npm run deploy`), or by hand | `capy-springs-debug-apk`: an APK to install on any Android phone (always Google's test ads). With the upload-key secrets: `capy-springs-play-bundle`, the signed `.aab` for Google Play. Run by hand with *test_signing* ticked, it proves the release signing with a throwaway key before the real one exists |
| `.github/workflows/ios.yml` (macOS) | pushes that touch `ios/`, or by hand | a compile check; run by hand with the App Store Connect secrets set, it signs the app in the cloud and uploads it to TestFlight |

Find runs at **GitHub > asmitdeshwal/capy-springs > Actions**. Each run's page has the downloads (*Artifacts*) and a short summary. To run one by hand: open the workflow on the left, **Run workflow**.

## Android, step by step

1. **Google Play Console account**: [play.google.com/console](https://play.google.com/console), one-time US$25, identity check. New personal accounts must run a **closed test with at least 12 testers for 14 days** before they can publish, so start early.
2. **The upload key** (once): in a terminal in this folder run
   ```bash
   npm run store-keys -- android
   ```
   It makes the key in `C:\Users\<you>\CapySprings-keys` (outside the project, so it can never be committed) and stores the four `CAPY_*` secrets on GitHub. **Back that folder up** (a USB stick or a private cloud drive). Play App Signing holds the real signing key; this upload key can be reset through Play support if it is ever lost, but that takes days.
3. **Build**: Actions > *Android build* > Run workflow. When it is green, download `capy-springs-play-bundle` and unzip it.
4. **Upload**: Play Console > Create app > fill the listing (`docs/STORE_LISTING.md`) > Testing > Closed testing > Create release > upload the `.aab`. Accept Play App Signing when asked.
5. **Every update**: `npm run deploy` (it raises the version code), wait for the Android build, upload the new `.aab`.

To just play it on an Android phone: download `capy-springs-debug-apk` from any run, unzip, open the `.apk` on the phone and allow "install unknown apps".

## iOS, step by step (no Mac)

1. **Apple Developer Program**: [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll), US$99 a year (the Apple Developer app on an iPhone can enrol too).
2. **Register the app id**: developer.apple.com > Certificates, IDs & Profiles > Identifiers > **+** > App IDs > App > description *Capy Springs*, explicit Bundle ID `com.asmitdeshwal.capysprings`, no extra capabilities > Register. (The cloud build would also register it on its first run.)
3. **Create the app record**: [App Store Connect](https://appstoreconnect.apple.com) > Apps > **+** > New App > iOS, name *Capy Springs*, the bundle id above, SKU `capysprings`.
4. **An API key for the cloud build**: App Store Connect > Users and Access > Integrations > App Store Connect API > Team Keys > **+**, name *GitHub builds*, access **Admin** (it has to create the distribution certificate) > Generate. Download the `AuthKey_XXXXXXXXXX.p8` file (Apple allows this **once**) and note the **Issuer ID** shown above the list.
5. **Store it on GitHub**:
   ```bash
   npm run store-keys -- ios C:\Users\<you>\Downloads\AuthKey_XXXXXXXXXX.p8 <issuer id>
   ```
   It sets `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` and `IOS_CERT_KEY` (a private key it makes once, kept with a copy of the `.p8` in `CapySprings-keys`).
6. **Build and upload**: Actions > *iOS build* > Run workflow (keep *upload* ticked). The first run creates the Apple Distribution certificate for that key and reuses it afterwards (it renews itself when the year runs out); every run makes a fresh App Store provisioning profile. About 15 minutes later the build appears under TestFlight in App Store Connect.
7. **Play it**: TestFlight > Internal Testing > add yourself, install the TestFlight app on your iPhone, open the invite. Submit for review from App Store Connect when ready (`docs/STORE_LISTING.md`).

## The GitHub secrets

`npm run store-keys -- status` lists which are set. They live under GitHub > Settings > Secrets and variables > Actions; nobody can read them back, not even you, and the workflows never print them.

| secret | what it is | made by |
|---|---|---|
| `CAPY_KEYSTORE_BASE64` | the Android upload key (PKCS#12, base64) | `npm run store-keys -- android` |
| `CAPY_KEYSTORE_PASSWORD`, `CAPY_KEY_PASSWORD` | its password (random, also in `CapySprings-keys/android-upload.txt`) | same |
| `CAPY_KEY_ALIAS` | `upload` | same |
| `ASC_KEY_ID`, `ASC_ISSUER_ID` | the App Store Connect API key's id and the issuer id | `npm run store-keys -- ios ...` |
| `ASC_KEY_P8` | the text of the `.p8` key file | same |
| `IOS_CERT_KEY` | the private key behind the Apple Distribution certificate | same (made once) |
| `APPLE_TEAM_ID` (optional) | only if the build says it cannot read the team id | developer.apple.com > Membership |

## Versions and build numbers

`npm run deploy` (or `-- --minor`) bumps `G.VERSION` and `package.json` and keeps the native projects in step: `versionName` / `versionCode` in `android/app/build.gradle`, `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in the Xcode project. The number is `major*10000 + minor*100 + patch` (1.13.0 is 11300), so it always grows. Google Play needs a higher version code for every upload, so deploy before each new `.aab`. Apple needs a new build number for every upload, so the cloud build adds the run number: `11300.7`, `11300.8`, and so on.

## If a cloud build fails

Open the run and the red step. The usual causes, with the words the log uses:

- *missing ASC_KEY_ID* (or another name): that secret isn't set; run the `store-keys` command again.
- *failed (401)*: Apple refused the key; the key id, issuer id or `.p8` text is wrong.
- *failed (403)*: the API key's role isn't Admin; make a new key with Admin access.
- *failed (409)* while creating a certificate: the account already has the maximum number of distribution certificates; revoke an unused one at developer.apple.com > Certificates, then run again.
- An upload error mentioning the app record or bundle id: steps 2 and 3 of the iOS list aren't done yet.
- Anything else: ask Claude to read it (`gh run view --log-failed` shows the failing step).

## What is already configured

| item | where | value |
|---|---|---|
| app id | `capacitor.config.json`, `build.gradle`, Xcode project | `com.asmitdeshwal.capysprings` |
| plugins | `package.json` | `@capacitor/preferences` (saves), `@capacitor-community/admob` (ads), `@capacitor/local-notifications` (reminders), `@capgo/native-purchases` (Remove ads: Google Play Billing 9, StoreKit 2) |
| AdMob app ids | `strings.xml`, `Info.plist` | Google's sample ids until `npm run ad-ids` writes yours (`docs/MONETIZATION.md`) |
| iOS ads | `Info.plist` | `GADApplicationIdentifier`, 50 `SKAdNetworkItems`, the tracking question text (`NSUserTrackingUsageDescription`) |
| Android permissions | `AndroidManifest.xml` + plugin manifests | INTERNET, the advertising id (from the ads SDK), BILLING (from Play Billing), POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED, WAKE_LOCK; the exact-alarm permission the reminders plugin asks for is removed (Play restricts it; reminders don't need exact times) |
| notification icon | `android/app/src/main/res/drawable/ic_stat_capy.xml`, `capacitor.config.json` | a white koban, tinted `#E4572E` |
| release signing | `android/app/build.gradle` | reads the upload key from the `CAPY_*` environment variables the workflow fills; without them the release build is left unsigned |
| orientation | `AndroidManifest.xml`, `Info.plist` | portrait only, full screen |
| device family | Xcode project | `TARGETED_DEVICE_FAMILY = 1` (iPhone; iPads run it in compatibility mode, so no iPad screenshots) |
| app category | `AndroidManifest.xml` | `android:appCategory="game"` (Android 16 only keeps the portrait lock on large screens for games) |
| privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` | the app's own code tracks and collects nothing; UserDefaults declared with reason `CA92.1`; the ads SDK brings its own manifest |
| export compliance | `Info.plist` | `ITSAppUsesNonExemptEncryption = false` |
| home indicator | `GameViewController.swift` | bottom edge deferred, so a swipe near it reaches the joystick first |
| saves | `src/17_save.js` | localStorage mirrored into Capacitor Preferences |
| developer mode | `tools/pack.js` | stamped off in `dist/` (`window.CAPY_DEV_BUILD = false`); `--test-ads` also forces test ads (the debug APK) |

## Building on your own machine instead (optional)

With Android Studio (JDK 21) or a Mac with Xcode 26: `npm ci`, then `npm run native` (packs `dist/`, redraws the icons and splash, syncs both projects), then `npx cap open android` or `npx cap open ios` and build as usual. The cloud builds do the same steps.
