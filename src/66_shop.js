// Capy Springs - the one purchase (GDD 21, docs/MONETIZATION.md): "Remove ads", a one-time, non-consumable product through
// @capgo/native-purchases (Google Play Billing 9 / StoreKit 2). It turns the short ads off for good; the optional videos stay, and so do their
// gifts. Ownership is kept on the phone (capysprings.noads) and checked with the store at every launch, so a purchase that was still pending,
// or one made on another phone with the same store account, shows up then. Restore sits on the card (Apple requires one).
(function (G) {
  'use strict';
  const PAL = G.PAL, ID = G.DATA.SHOP.removeAds, KEY = 'capysprings.noads', LAST = 'capysprings.shopoffer', EV = {};
  const Shop = G.Shop = { product: null, owned: false, busy: false, fake: false, ready: false };
  const P = { x0: 50, x1: 490, y0: 0, y1: 0 };
  let NP = null, offerPending = false, started = false;

  Shop.init = function () {
    Shop.owned = G.Save.store.get(KEY) === '1';
    if (started || G.Game.headless) return; started = true;
    // a short ad just played: a good moment to mention the purchase (at most every two days)
    G.Bus.on('ad:end', e => { if (e.kind === 'interstitial' && !Shop.owned && Shop.available() && Date.now() - (+(G.Save.store.get(LAST) || 0)) > G.DATA.SHOP.offerEvery * 1000) offerPending = true; });
    if (!G.Native.is()) { Shop.fake = !!(G.Dev && G.Dev.on); return; }          // the web: developer mode fakes the store
    NP = G.Native.plugin('NativePurchases'); if (!NP) return;
    NP.isBillingSupported()
      .then(r => (r && r.isBillingSupported) ? NP.getProducts({ productIdentifiers: [ID], productType: 'inapp' }) : null)
      .then(r => { Shop.product = ((r && r.products) || []).find(p => p.identifier === ID) || null; Shop.ready = !!Shop.product; })
      .catch(e => G.U.warnOnce('shop', 'shop: ' + (e && e.message)))
      .then(() => check(null));
    try { NP.addListener('transactionUpdated', t => { if (owns(t)) grant(G.Game.S, false); }); } catch (e) { /* not on this platform */ }
  };
  // a store record that means "this store account owns Remove ads" (Android: purchaseState "1" is PURCHASED, "2" is PENDING)
  function owns(t) { return !!t && t.productIdentifier === ID && !t.revocationDate && (t.purchaseState === undefined || t.purchaseState === null || String(t.purchaseState) === '1'); }
  function check(S) {
    if (!NP) return Promise.resolve(false);
    return NP.getPurchases({ productType: 'inapp', onlyCurrentEntitlements: true }).then(r => {
      const t = ((r && r.purchases) || []).find(owns);
      if (!t) return false;
      if (t.isAcknowledged === false && t.purchaseToken) NP.acknowledgePurchase({ purchaseToken: t.purchaseToken }).catch(() => {});   // Play refunds it if not acknowledged in 3 days
      grant(S || G.Game.S, !!S);
      return true;
    }).catch(() => false);
  }
  function grant(S, announce) {
    const was = Shop.owned; Shop.owned = true; G.Save.store.set(KEY, '1');
    if (S && (announce || !was)) G.HUD.banner(S, 'THANK YOU!', 'the short ads are gone for good');
    G.Bus.emit('shop:owned', EV);
  }
  Shop.noAds = () => Shop.owned;
  Shop.available = () => Shop.fake || (Shop.owned ? !!NP : Shop.ready);
  Shop.price = () => (Shop.product && Shop.product.priceString) || (Shop.fake ? '$2.99 (test)' : '');
  Shop.reset = function () { Shop.owned = false; G.Save.store.remove(KEY); G.Save.store.remove(LAST); };   // developer mode
  Shop.offerDue = function (S) { if (!offerPending || S.mode !== 'play' || Shop.owned) return false; offerPending = false; G.Save.store.set(LAST, String(Date.now())); return true; };

  Shop.buy = function (S) {
    if (Shop.busy || Shop.owned) return; Shop.busy = true;
    if (Shop.fake) { setTimeout(() => { Shop.busy = false; grant(S, true); }, 900); return; }
    NP.purchaseProduct({ productIdentifier: ID, productType: 'inapp', quantity: 1 }).then(t => { Shop.busy = false; if (owns(t)) grant(S, true); else check(S); }, e => {
      Shop.busy = false;
      const m = String((e && (e.message || e.code)) || '').toLowerCase();
      if (m.indexOf('cancel') >= 0) return;                                        // the player closed the store sheet
      if (m.indexOf('pending') >= 0) { G.HUD.banner(S, 'PAYMENT PENDING', 'the ads go as soon as the store confirms it'); return; }
      if (m.indexOf('own') >= 0) { check(S); return; }                               // bought before: restore it
      G.HUD.banner(S, 'THE STORE HAD A PROBLEM', 'please try again later');
    });
  };
  Shop.restore = function (S) {
    if (Shop.fake) { G.HUD.banner(S, Shop.owned ? 'ALREADY RESTORED' : 'NOTHING TO RESTORE', null); return; }
    if (!NP || Shop.busy) return; Shop.busy = true;
    NP.restorePurchases().catch(() => {}).then(() => check(S)).then(found => { Shop.busy = false; if (!found) G.HUD.banner(S, 'NOTHING TO RESTORE', 'this store account has not bought it'); });
  };

  // ---- the card (kind 'shop', owned by Cards): from Settings, the Free gifts card, or after a short ad ----
  function layout() { P.y0 = Math.round(G.Canvas.H / 2 - 180); P.y1 = P.y0 + 360; }
  function badge(ctx, x, y, owned) {
    const A = G.Art.S;
    A.fillRRect(ctx, x - 34, y - 22, 68, 44, 12, '#FFFFFF'); A.strokeRRect(ctx, x - 34, y - 22, 68, 44, 12, owned ? PAL.pine : PAL.ink, 3);
    A.text(ctx, 'AD', x, y + 1, 22, owned ? PAL.pine : PAL.ink);
    if (owned) { A.circle(ctx, x + 32, y - 20, 14, PAL.pine); A.circle(ctx, x + 32, y - 20, 11, '#FFFFFF'); A.icon(ctx, 'check', x + 32, y - 20, 15); }   // the check is drawn in pine
    else A.line(ctx, x - 40, y + 26, x + 40, y - 26, PAL.red, 5);
  }
  Shop.draw = function (ctx, S, k) {
    const A = G.Art.S; layout();
    A.fillRRect(ctx, P.x0, P.y0 + 6, P.x1 - P.x0, P.y1 - P.y0, 24, PAL.rgba(PAL.ink, 0.3));
    A.fillRRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 24, PAL.cream);
    badge(ctx, 270, P.y0 + 52, Shop.owned);
    if (!Shop.owned) {
      A.text(ctx, 'No more short ads', 270, P.y0 + 106, 26, PAL.ink);
      A.text(ctx, 'One purchase turns off the short ads', 270, P.y0 + 144, 16, PAL.ink);
      A.text(ctx, 'that play between moments, for good.', 270, P.y0 + 168, 16, PAL.ink);
      A.text(ctx, 'The optional videos stay, so you can', 270, P.y0 + 202, 14, PAL.stoneDark);
      A.text(ctx, 'still watch one whenever you want a gift.', 270, P.y0 + 224, 14, PAL.stoneDark);
      if (Shop.busy) A.text(ctx, 'Talking to the store...', 270, P.y0 + 284, 18, PAL.stoneDark);
      else {
        A.fillRRect(ctx, 70, P.y0 + 252, 180, 64, 32, PAL.rgba(PAL.ink, 0.12)); A.text(ctx, 'NOT NOW', 160, P.y0 + 285, 20, PAL.ink);
        A.fillRRect(ctx, 266, P.y0 + 252, 204, 64, 32, PAL.cta); A.text(ctx, 'REMOVE ADS', 368, P.y0 + 276, 20, PAL.cream); A.text(ctx, Shop.price(), 368, P.y0 + 299, 14, PAL.cream);
      }
    } else {
      A.text(ctx, 'Ads removed', 270, P.y0 + 106, 26, PAL.ink);
      A.text(ctx, 'Thank you for supporting Capy Springs!', 270, P.y0 + 144, 16, PAL.ink);
      A.text(ctx, 'No short ads will play. The optional videos', 270, P.y0 + 182, 14, PAL.stoneDark);
      A.text(ctx, 'are still there whenever you want a gift.', 270, P.y0 + 204, 14, PAL.stoneDark);
      A.fillRRect(ctx, 170, P.y0 + 252, 200, 64, 32, PAL.cta); A.text(ctx, 'LOVELY', 270, P.y0 + 285, 22, PAL.cream);
    }
    A.text(ctx, 'Bought it before? Restore purchase', 270, P.y0 + 340, 13, Shop.busy ? PAL.rgba(PAL.ink, 0.3) : PAL.stoneDark);
  };
  Shop.tap = function (S, x, y) {
    layout();
    if (x < P.x0 || x > P.x1 || y < P.y0 || y > P.y1) { if (!Shop.busy) G.Cards.close(S); return true; }
    if (Shop.busy) return true;
    if (y >= P.y0 + 322) { Shop.restore(S); return true; }
    if (y < P.y0 + 252 || y > P.y0 + 316) return true;
    if (Shop.owned) { if (x >= 170 && x <= 370) G.Cards.close(S); }
    else if (x >= 70 && x <= 250) G.Cards.close(S);
    else if (x >= 266 && x <= 470) Shop.buy(S);
    return true;
  };
})(window.G);
