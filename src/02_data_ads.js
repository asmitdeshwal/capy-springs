// Capy Springs - ads (GDD 21, docs/MONETIZATION.md): which AdMob units the store apps use and how often ads may appear.
// The ids below are Google's public TEST units: they always show test ads and never earn. Once the real AdMob account exists, run
//   npm run ad-ids -- android-app=... ios-app=... android-rewarded=... android-interstitial=... ios-rewarded=... ios-interstitial=...
// which writes them here, into android/app/src/main/res/values/strings.xml and ios/App/App/Info.plist, and sets `test: false`.
(function (G) {
  'use strict';
  G.DATA = G.DATA || {};
  G.DATA.ADS = {
    test: true,
    rewarded:     { android: 'ca-app-pub-3940256099942544/5224354917', ios: 'ca-app-pub-3940256099942544/1712485313' },
    interstitial: { android: 'ca-app-pub-3940256099942544/1033173712', ios: 'ca-app-pub-3940256099942544/4411468910' },
    maxRating: 'ParentalGuidance',          // a cosy game: no ads rated above PG
    rules: {
      firstMinutes: 15,                     // no interstitial in a player's first 15 minutes of play, ever
      interstitialEvery: 300,               // at most one interstitial per 5 minutes of play...
      breakWindow: 8,                       // ...and only within 8 s of a natural break (sheet or card closed, a lantern lit), at a calm moment
      afterRewarded: 120,                   // never within 2 minutes of a video the player chose to watch
      boostT: 180, boostCooldown: 150,      // "2x koban" lasts 3 minutes; offered again 2.5 minutes after it ends
      giftEvery: [200, 320], giftStay: 16,  // a sky lantern with a gift drifts by every ~3-5 minutes and stays 16 s
      giftMinutes: 2.5, giftMin: 60,        // the gift is worth ~2.5 minutes of income (at least 60 koban)
      lightShare: 0.4, lightMin: 150, lightCooldown: 240,   // "light it now": only for the last 40% of a step that costs 150+, once per 4 minutes
      offlineMult: 2,                       // the Welcome-back card doubles with a video
      freeShare: 0.5, freeMin: 100, freeCooldown: 180   // "FREE" upgrade with a video: half the price in hand, 100+ koban, once per 3 minutes
    }
  };
})(window.G);
