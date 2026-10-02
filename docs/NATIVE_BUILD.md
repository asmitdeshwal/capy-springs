# Building Capy Springs for Google Play and the App Store

The game is a plain web app; Capacitor 8 wraps the packed copy in `dist/` into a native Android and iOS app. The native projects live in `android/` and `ios/` and are committed. This PC has no Android SDK, no JDK 21 and no Xcode, so the actual store builds happen on a machine that has them (any PC for Android, a Mac for iOS).

## One-time setup on the build machine

1. Clone the repo and run `npm install` (installs Capacitor and the asset generator; the game itself has no dependencies).
2. **Android**: install [Android Studio](https://developer.android.com/studio) and JDK 21 (Android Studio bundles it; Capacitor 8 targets API 36).
3. **iOS**: a Mac with Xcode 26 or newer (App Store Connect has required Xcode 26 / the iOS 26 SDK for uploads since 28 April 2026), and an Apple Developer account ($99/year). Open `ios/App/App.xcodeproj` once so Xcode resolves the Swift packages.

## Every release

```bash
npm run native       # pack the web build into dist/, regenerate icons + splash, copy into android/ and ios/
```

That script runs `node tools/pack.js` (version-stamped `index.html`, `sw.js`, `dist/` with **developer mode stripped**), `node tools/native_assets.js` (draws the icon and splash source images into `assets/`), `npx capacitor-assets generate` (every Android mipmap and iOS AppIcon size) and `npx cap sync` (copies `dist/` into both projects and registers the Preferences plugin).

Then:

- **Android**: `npx cap open android` → Android Studio → *Build › Generate Signed App Bundle* → create a keystore the first time (keep it safe; Play requires the same key forever, or enrol in Play App Signing) → upload the `.aab` in the Play Console.
- **iOS**: `npx cap open ios` → Xcode → set your Team under *Signing & Capabilities* → *Product › Archive* → *Distribute App* → App Store Connect / TestFlight.

Bump the version before a store build: `npm run deploy` (or `npm run deploy -- --minor`) bumps `G.VERSION` and `package.json` **and now also syncs the native version numbers**: `versionName` / `versionCode` in `android/app/build.gradle` and `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` (which feed `CFBundleShortVersionString` / `CFBundleVersion`). The integer build number is derived from the version, `major*10000 + minor*100 + patch`, so 1.10.0 is build 11000 and it always grows, as both stores require. Nothing to edit by hand in Android Studio or Xcode.

## iOS without a Mac

Apple signs and uploads only from macOS, so without a Mac there are two routes. **Borrow or rent one**: a friend's Mac for an afternoon, or a cloud Mac by the hour (MacStadium, MacinCloud): clone the repo, `npm ci && npm run native`, open `ios/App/App.xcodeproj`, set the Team, *Product › Archive*, upload. **Or a macOS CI runner**: GitHub Actions `macos-latest` (ships Xcode 26) running `npm ci && npm run native && xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' archive -archivePath build/App.xcarchive`, then `xcodebuild -exportArchive` with an export-options plist whose `destination` is `upload` and an App Store Connect API key. Signing on the runner comes from [fastlane match](https://docs.fastlane.tools/actions/match/) (certificates kept in a private repo) or a manually exported `.p12` + provisioning profile stored as repository secrets. The Developer account and App Store Connect themselves are web-only, so the listing, TestFlight and review all happen from this PC.

**Device family**: the iOS build is iPhone-only (`TARGETED_DEVICE_FAMILY = 1`). iPads still install it and run it in iPhone compatibility mode, and App Store Connect asks for no iPad screenshots. The game is designed for one thumb on a phone, so this is deliberate; switch back to `"1,2"` only if a real iPad layout is ever added.

## What is already configured

| item | where | value |
|---|---|---|
| app id | `capacitor.config.json` | `com.asmitdeshwal.capysprings` (change before the first upload if you want another; also in `android/app/build.gradle` and the Xcode bundle id) |
| name | `capacitor.config.json` | Capy Springs |
| web dir | `capacitor.config.json` | `dist` |
| orientation | `AndroidManifest.xml`, `Info.plist` | portrait only, full screen (iPhone only; the `~ipad` orientation list is gone with the device family) |
| device family | `project.pbxproj` | `TARGETED_DEVICE_FAMILY = 1` (iPhone; iPad runs it in compatibility mode) |
| app category | `AndroidManifest.xml` | `android:appCategory="game"` (Android 16 only honours the portrait lock on large screens for games) |
| versions | `build.gradle`, `project.pbxproj` | 1.10.0 / build 11000, kept in step by `npm run deploy` |
| privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` | no tracking, no collected data; UserDefaults declared with reason `CA92.1` (the Preferences plugin) |
| export compliance | `Info.plist` | `ITSAppUsesNonExemptEncryption = false` (no custom encryption, so no export question at upload) |
| home indicator | `ios/App/App/GameViewController.swift` | bottom edge deferred, so a swipe near the home indicator reaches the joystick first (wired in `SceneDelegate.swift` and `Main.storyboard`) |
| background / splash | `capacitor.config.json`, `assets/` | cream `#F6F1E7`, the capybara icon; the web boot screen takes over seamlessly |
| saves | `src/17_save.js` | localStorage mirrored into Capacitor Preferences (survives WebView storage eviction) |
| developer mode | `tools/pack.js` | stamped off in `dist/` (`window.CAPY_DEV_BUILD = false`) |
| permissions | `AndroidManifest.xml` | only INTERNET (Capacitor's default; the game makes no network calls at runtime) |
| plugins | `package.json` | `@capacitor/preferences` |

## Store listing material

See `docs/STORE_LISTING.md` for the descriptions, the privacy answers (Play "Data safety", Apple "App Privacy"), the content-rating answers and the screenshot list. The privacy policy and terms are hosted at
`https://asmitdeshwal.github.io/capy-springs/privacy.html` and `.../terms.html` (both stores ask for the privacy URL).

## Testing a native build without an account

- Android: Android Studio › *Run* on a connected phone with USB debugging, or build a debug APK (*Build › Build APK(s)*) and install it.
- iOS: Xcode runs on a connected iPhone with a free Apple ID (7-day signing); TestFlight needs the paid account.
