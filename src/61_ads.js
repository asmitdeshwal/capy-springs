// Capy Springs - ads (GDD 21, docs/MONETIZATION.md): AdMob in the store apps through @capacitor-community/admob. Rewarded videos the player
// chooses (62_offers.js) and a few capped interstitials at calm moments. Google's consent message (UMP) runs before any ad request; Apple's
// tracking prompt follows on iOS. On the web nothing loads (the PWA stays ad-free); developer mode fakes a 3-second ad to test every flow.
(function (G) {
  'use strict';
  const U = G.U, PAL = G.PAL, D = G.DATA.ADS;

  // ---- native plumbing: is this the store app, and a plugin through Capacitor's core script (vendor/capacitor.js, loaded first there) ----
  const Native = G.Native = {};
  Native.is = function () { try { const c = window.Capacitor; return !!(c && c.isNativePlatform && c.isNativePlatform()); } catch (e) { return false; } };
  Native.platform = function () { try { return window.Capacitor.getPlatform(); } catch (e) { return 'web'; } };
  Native.plugin = function (name) {
    if (!Native.is()) return null;
    const c = window.Capacitor;
    try { if (c.Plugins && c.Plugins[name]) return c.Plugins[name]; if (c.registerPlugin) return c.registerPlugin(name); } catch (e) { /* not available */ }
    return null;
  };

  const Ads = G.Ads = { ready: { rewarded: false, interstitial: false }, ok: false, privacyRequired: false, showing: null, fake: false, fakeT: 0,
                        lastRewarded: -1e9, lastInterstitial: -1e9, startedAt: 0, shown: 0 };
  let AM = null, job = null, started = false;
  const backoff = { rewarded: 20, interstitial: 20 }, EV = { kind: null, placement: null };
  const now = () => Date.now() / 1000;
  const unit = kind => D[kind][Native.platform() === 'ios' ? 'ios' : 'android'];
  const testing = () => !!D.test || window.CAPY_TEST_ADS === true;                    // test builds: the plugin swaps in Google's test ad units

  Ads.init = function () {
    if (G.HEADLESS || (G.Game && G.Game.headless)) return;
    if (!Native.is()) { let f = false; try { f = localStorage.getItem('capysprings.fakeads') === '1'; } catch (e) { f = false; } Ads.fake = !!(G.Dev && G.Dev.on && f); return; }   // the web build never loads an ad network; dev mode can fake one
    if (started || G.Age.needed()) return;                                         // the age question comes first (64_age.js), then calls init again
    AM = Native.plugin('AdMob'); if (!AM) return;
    started = true;
    start().catch(e => { U.warnOnce('ads', 'ads: ' + (e && e.message)); started = false; setTimeout(Ads.init, 60000); });   // offline at launch: try again in a minute
  };
  async function start() {
    const child = G.Age.child(), young = G.Age.underConsent();                     // under 13: child-directed; under 16: under the age of consent
    await AM.initialize({ tagForChildDirectedTreatment: child, tagForUnderAgeOfConsent: young, maxAdContentRating: child ? 'General' : D.maxRating });
    let info = await AM.requestConsentInfo({ tagForUnderAgeOfConsent: young });     // GDPR / UK / Swiss consent through Google's message
    if (!info.canRequestAds && info.isConsentFormAvailable) info = await AM.showConsentForm();
    Ads.privacyRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';      // Settings then shows "Privacy choices"
    if (Native.platform() === 'ios' && !young) { try { const t = await AM.trackingAuthorizationStatus(); if (t.status === 'notDetermined') await AM.requestTrackingAuthorization(); } catch (e) { /* no ATT */ } }
    Ads.ok = !!info.canRequestAds;
    if (!Ads.ok) return;
    listen(); load('rewarded'); load('interstitial');
  }
  function listen() {
    AM.addListener('onRewardedVideoAdLoaded', () => { Ads.ready.rewarded = true; backoff.rewarded = 20; });
    AM.addListener('onRewardedVideoAdFailedToLoad', () => later('rewarded'));
    AM.addListener('onRewardedVideoAdReward', () => { if (job) job.earned = true; });
    AM.addListener('onRewardedVideoAdDismissed', () => setTimeout(() => finish('rewarded', false), 300));   // a reward that reports a beat late still counts
    AM.addListener('onRewardedVideoAdFailedToShow', () => finish('rewarded', true));
    AM.addListener('interstitialAdLoaded', () => { Ads.ready.interstitial = true; backoff.interstitial = 20; });
    AM.addListener('interstitialAdFailedToLoad', () => later('interstitial'));
    AM.addListener('interstitialAdDismissed', () => finish('interstitial', false));
    AM.addListener('interstitialAdFailedToShow', () => finish('interstitial', true));
  }
  function load(kind) {
    Ads.ready[kind] = false;
    const o = { adId: unit(kind), isTesting: testing(), npa: G.Age.underConsent() };   // young players: never personalised
    (kind === 'rewarded' ? AM.prepareRewardVideoAd(o) : AM.prepareInterstitial(o)).then(() => { Ads.ready[kind] = true; }, () => later(kind));
  }
  function later(kind) { Ads.ready[kind] = false; const s = backoff[kind]; backoff[kind] = Math.min(300, s * 2); setTimeout(() => { if (Ads.ok && !Ads.ready[kind]) load(kind); }, s * 1000); }

  // ---- showing: the game and its sound wait while an ad plays ----
  Ads.can = kind => !Ads.showing && (Ads.fake || (Ads.ok && Ads.ready[kind]));
  Ads.sinceRewarded = () => now() - Ads.lastRewarded;
  Ads.sinceAny = () => now() - Math.max(Ads.lastRewarded, Ads.lastInterstitial);
  Ads.rewarded = function (S, placement, onReward) {
    if (!Ads.can('rewarded')) { G.HUD.banner(S, 'NO VIDEO RIGHT NOW', 'try again in a moment'); return false; }
    begin(S, 'rewarded', placement, onReward);
    if (!Ads.fake) AM.showRewardVideoAd().catch(() => finish('rewarded', true));
    return true;
  };
  Ads.interstitial = function (S, placement) {
    if (!Ads.can('interstitial')) return false;
    begin(S, 'interstitial', placement, null);
    if (!Ads.fake) AM.showInterstitial().catch(() => finish('interstitial', true));
    return true;
  };
  function begin(S, kind, placement, onReward) {
    job = { kind, placement, onReward, earned: false, S, t: 0 };
    Ads.showing = kind; Ads.fakeT = kind === 'rewarded' ? 3 : 2; Ads.startedAt = now();
    S.adPrev = S.mode; S.mode = 'ad';
    G.Audio.setEnabled(S, false);
    EV.kind = kind; EV.placement = placement; G.Bus.emit('ad:start', EV);
  }
  function finish(kind, failed) {
    if (!job) return;                                                                   // already finished (an event and a promise both reported)
    const j = job; job = null; Ads.showing = null; Ads.fakeT = 0;
    const S = (j && j.S) || G.Game.S; if (!S) return;
    if (S.mode === 'ad') { S.mode = (S.adPrev && S.adPrev !== 'ad' && S.adPrev !== 'paused') ? S.adPrev : 'play'; G.Game.syncMode(S); }
    G.Audio.setEnabled(S, S.settings.sound);
    if (kind === 'rewarded') Ads.lastRewarded = now(); else Ads.lastInterstitial = now();
    if (!failed) Ads.shown++;
    if (j && kind === 'rewarded') { if (j.earned && j.onReward) j.onReward(S); else if (failed) G.HUD.banner(S, 'NO VIDEO RIGHT NOW', 'try again in a moment'); }
    EV.kind = kind; EV.placement = j ? j.placement : null; G.Bus.emit('ad:end', EV);
    if (!Ads.fake && Ads.ok) load(kind);
  }
  // the fake ad counts down. A real ad covers the game, so time here only runs while the game is visible: a real ad that never reports
  // back is let go after 150 s of that, and a tap on the game (which a real ad would have caught) means it is gone already
  Ads.update = function (S, dt) {
    if (!Ads.showing || !job) { if (S.mode === 'ad') { S.mode = 'play'; G.Game.syncMode(S); } return; }
    job.t += dt;
    if (Ads.fake) { Ads.fakeT -= dt; if (Ads.fakeT <= 0) { if (job.kind === 'rewarded') job.earned = true; finish(job.kind, false); } }
    else if (job.t > 150) finish(Ads.showing, true);
  };
  Ads.tap = function (S) { if (!Ads.fake && job && job.t > 1.5) finish(job.kind, !job.earned && job.kind === 'rewarded'); };
  Ads.privacyOptions = function () { if (AM) AM.showPrivacyOptionsForm().catch(() => {}); };
  // developer mode on the web: a stand-in card where the store app plays a real ad
  Ads.draw = function (ctx, S) {
    if (S.mode !== 'ad' || !Ads.showing) return;
    const A = G.Art.S, H = G.Canvas.H;
    if (!Ads.fake) { if (job && job.t > 3) { ctx.fillStyle = PAL.rgba(PAL.ink, 0.5); ctx.fillRect(0, 0, 540, H); A.text(ctx, 'Tap to continue', 270, H / 2, 24, PAL.cream); } return; }
    ctx.fillStyle = PAL.rgba(PAL.ink, 0.86); ctx.fillRect(0, 0, 540, H);
    A.fillRRect(ctx, 70, H / 2 - 110, 400, 220, 24, PAL.cream);
    A.text(ctx, Ads.showing === 'rewarded' ? 'TEST VIDEO AD' : 'TEST AD', 270, H / 2 - 62, 26, PAL.cta);
    A.text(ctx, 'In the store app a real ad plays here.', 270, H / 2 - 24, 15, PAL.stoneDark);
    A.text(ctx, String(Math.max(1, Math.ceil(Ads.fakeT))), 270, H / 2 + 44, 52, PAL.ink);
  };
  // a small "play video" glyph for buttons that offer a rewarded ad
  Ads.glyph = function (ctx, x, y, s, color, tri) {
    const A = G.Art.S; A.fillRRect(ctx, x - s * 0.6, y - s * 0.42, s * 1.2, s * 0.84, s * 0.18, color);
    ctx.fillStyle = tri || PAL.cream; ctx.beginPath(); ctx.moveTo(x - s * 0.16, y - s * 0.24); ctx.lineTo(x + s * 0.26, y); ctx.lineTo(x - s * 0.16, y + s * 0.24); ctx.closePath(); ctx.fill();
  };
})(window.G);
