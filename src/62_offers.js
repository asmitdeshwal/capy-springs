// Capy Springs - offers (GDD 21): where the store apps offer an optional video, and when a short interstitial may play. Every reward is the
// player's choice: double the Welcome-back koban, "2x koban" for 3 minutes, a gift lantern that floats by, "light it now" for the last part of
// an offering step. Interstitials come at most every few minutes, never early in a player's life, never right after a chosen video, and only
// at a calm moment (no guests in Kit's line, no banner, no card, not on a step). Nothing here runs in the harness or touches the seeded RNG.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL, R = G.DATA.ADS.rules;
  const Offers = G.Offers = {};
  const CHIP = { x0: 16, y0: 0, x1: 176, y1: 0 }, LIGHT = { id: null, x: 0, y: 0, w: 196, h: 38 }, GP = { x: 0, y: 0 };

  Offers.init = function (S) { S.offers = { boostT: 0, boostCd: 0, giftNext: 120 + Math.random() * 60, gift: null, lightCd: 0, interT: 0, breakIn: 0, breakWin: 0, freeCd: 0 }; wire(); };
  // natural breaks, the only moments an interstitial may use: the upgrade sheet closed, a card closed, a lantern's party winding down
  let wired = false;
  function wire() {
    if (wired) return; wired = true;
    const brk = delay => () => { const S = G.Game.S, o = S && S.offers; if (o) { o.breakIn = delay; o.breakWin = 0; } };
    G.Bus.on('ui:sheet:close', brk(0.5)); G.Bus.on('ui:card:close', brk(0.4)); G.Bus.on('lantern:lit', brk(3));
  }
  Offers.mult = S => (S.offers && S.offers.boostT > 0 ? 2 : 1);                     // read by Baths.payout and the stall
  Offers.canDouble = S => G.Ads.can('rewarded');
  const unlocked = S => G.Seasons.firstLit(S) && !G.Game.headless;                    // nothing is offered before the first lantern

  // ---- the clock ----
  Offers.update = function (S, dt) {
    const o = S.offers; if (!o || G.Game.headless) return;
    if (o.boostT > 0) { o.boostT -= dt; if (o.boostT <= 0) { o.boostT = 0; o.boostCd = R.boostCooldown; G.HUD.banner(S, '2x KOBAN IS OVER', 'another one in a little while'); } }
    else if (o.boostCd > 0) o.boostCd -= dt;
    if (o.lightCd > 0) o.lightCd -= dt;
    if (o.freeCd > 0) o.freeCd -= dt;
    // the gift lantern drifts up through the view for a few seconds, every few minutes
    if (o.gift) { o.gift.t += dt; if (o.gift.t >= R.giftStay) o.gift = null; }
    else if (unlocked(S) && G.Ads.can('rewarded')) {
      o.giftNext -= dt;
      if (o.giftNext <= 0 && S.mode === 'play' && !G.Camera.script) { o.gift = { t: 0, x: 110 + Math.random() * 320, amount: giftAmount(S) }; o.giftNext = R.giftEvery[0] + Math.random() * (R.giftEvery[1] - R.giftEvery[0]); }
    }
    // a short interstitial, only inside a natural break, only at a calm moment, and never for a player under 13 (they only see the optional videos)
    o.interT += dt;
    if (o.breakIn > 0) { o.breakIn -= dt; if (o.breakIn <= 0) o.breakWin = R.breakWindow; }
    else if (o.breakWin > 0) o.breakWin -= dt;
    if (o.breakWin > 0 && !G.Age.child() && !G.Shop.noAds() && o.interT >= R.interstitialEvery && S.t >= R.firstMinutes * 60 && G.Ads.sinceRewarded() >= R.afterRewarded && calm(S) && G.Ads.can('interstitial')) { o.interT = 0; o.breakWin = 0; G.Ads.interstitial(S, 'break'); }
  };
  function giftAmount(S) { return Math.max(R.giftMin, Math.round(G.Save.rate(S.income) * 60 * R.giftMinutes / 10) * 10); }
  function calm(S) {
    if (S.mode !== 'play' || S.ui.sheet || S.ui.card || S.ui.settings || S.ui.banner || G.Camera.script || S.night.festival || S.story.cur) return false;
    if (S.t - S.splash.t < 4 || G.Input.stick.active) return false;                  // never while a finger is steering Kit
    const L = G.DATA.LANTERNS; for (let i = 0; i < L.length; i++) { const f = S.lanternFx[L[i].id]; if (f && f.on) return false; }
    return true;
  }

  // ---- screen space: the "2x koban" chip under the coin pill, and the gift lantern ----
  function chip() { const st = G.Canvas.st || 0; CHIP.y0 = st + 90; CHIP.y1 = st + 120; return CHIP; }
  const boostShown = S => S.offers && (S.offers.boostT > 0 || (S.offers.boostCd <= 0 && unlocked(S) && G.Ads.can('rewarded')));
  function giftPos(S, out) { const g = S.offers.gift, H = G.Canvas.H, u = g.t / R.giftStay; out.x = g.x + Math.sin(g.t * 1.2) * 22; out.y = H * 0.82 - u * H * 0.5; return out; }
  Offers.drawScreen = function (ctx, S) {
    const o = S.offers; if (!o || S.mode === 'finale') return;
    const A = G.Art.S;
    if (boostShown(S)) {
      const r = chip(), cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
      if (o.boostT > 0) A.pill(ctx, cx, cy, r.x1 - r.x0, 30, '2x KOBAN  ' + mmss(o.boostT), 15, PAL.amber, PAL.ink, null);
      else { const pulse = 1 + 0.04 * Math.sin(S.t * 4); ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse); A.pill(ctx, 10, 0, r.x1 - r.x0 - 4, 30, '2x KOBAN', 15, PAL.cta, PAL.cream, null); G.Ads.glyph(ctx, -58, 0, 18, PAL.cream, PAL.cta); ctx.restore(); }
    }
    if (o.gift) {
      const p = giftPos(S, GP), t = o.gift.t, a = Math.min(1, t / 0.6, (R.giftStay - t) / 0.8);
      ctx.globalAlpha = Math.max(0, a); Offers.drawLantern(ctx, p.x, p.y, 1, S.t); G.Ads.glyph(ctx, p.x + 26, p.y + 30, 18, PAL.cta, PAL.cream); ctx.globalAlpha = 1;
    }
  };
  // a paper sky lantern with a warm glow and a gold koban charm
  Offers.drawLantern = function (ctx, x, y, s, t) {
    const A = G.Art.S;
    A.circle(ctx, x, y, 44 * s, PAL.rgba(PAL.amber, 0.18 + 0.06 * Math.sin(t * 3)));
    A.fillRRect(ctx, x - 20 * s, y - 30 * s, 40 * s, 52 * s, 16 * s, PAL.cta);
    A.fillRRect(ctx, x - 14 * s, y - 24 * s, 28 * s, 40 * s, 12 * s, PAL.rgba(PAL.amber, 0.55));
    for (let i = -1; i <= 1; i++) A.line(ctx, x + i * 9 * s, y - 28 * s, x + i * 9 * s, y + 20 * s, PAL.rgba(PAL.cream, 0.5), 1.5);
    A.fillRRect(ctx, x - 12 * s, y - 34 * s, 24 * s, 6 * s, 3 * s, PAL.red); A.fillRRect(ctx, x - 10 * s, y + 20 * s, 20 * s, 6 * s, 3 * s, PAL.red);
    A.line(ctx, x, y + 26 * s, x, y + 38 * s, PAL.cedarDark, 2); A.icon(ctx, 'koban', x, y + 44 * s, 18 * s);
  };
  const mmss = s => { const t = Math.max(0, Math.ceil(s)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  Offers.tapScreen = function (S, x, y) {
    const o = S.offers; if (!o) return false;
    if (boostShown(S) && o.boostT <= 0) {
      const r = chip();
      if (x >= r.x0 - 6 && x <= r.x1 + 6 && y >= r.y0 - 8 && y <= r.y1 + 8) { G.Ads.rewarded(S, 'boost', S2 => { S2.offers.boostT = R.boostT; G.HUD.banner(S2, '2x KOBAN!', 'every guest pays double for 3 minutes'); }); return true; }
    }
    if (o.gift) { const p = giftPos(S, GP); if (U.dist(x, y, p.x, p.y) <= 52) { const amt = o.gift.amount; o.gift = null; G.Cards.showGift(S, amt); return true; } }
    return false;
  };

  // ---- the upgrade sheet: "FREE" with a video for an upgrade that is half paid for already ----
  Offers.freeOk = function (S, id, key) {
    const o = S.offers; if (!o || o.freeCd > 0 || !unlocked(S) || !G.Ads.can('rewarded') || !G.Upgrades.visible(S, id, key)) return false;
    const c = G.Upgrades.cost(S, id, key);
    return c !== null && c >= R.freeMin && S.coins < c && S.coins >= c * R.freeShare;
  };
  Offers.free = function (S, id, key) {
    G.Ads.rewarded(S, 'upgrade', S2 => {
      if (!G.Upgrades.grant(S2, id, key)) return;
      S2.offers.freeCd = R.freeCooldown; S2.ui.squash[id] = 1;
      const sh = S2.ui.sheet; if (sh && sh.id === id) { sh.flash = 1; sh.flashKey = key; }
      G.HUD.banner(S2, 'UPGRADED!', 'thanks for watching');
    });
  };

  // ---- world space: "light it now" under a step the player is standing on, just short of koban ----
  function lightTarget(S) {
    if (!S.offers || S.offers.lightCd > 0 || !G.Ads.can('rewarded')) return null;
    const L = G.DATA.LANTERNS;
    for (let i = 0; i < L.length; i++) {
      const d = L[i], f = S.lanternFx[d.id]; if (!f || !f.shortOn) continue;
      const lv = S.lanterns[d.id], cost = d.costs[lv.level]; if (cost === undefined) continue;
      if (cost >= R.lightMin && cost - lv.sunk <= cost * R.lightShare) return d;
    }
    return null;
  }
  Offers.drawWorld = function (ctx, S) {
    const d = lightTarget(S); LIGHT.id = d ? d.id : null; if (!d) return;
    LIGHT.x = d.x; LIGHT.y = d.y + 48;
    G.Art.S.pill(ctx, LIGHT.x + 12, LIGHT.y, LIGHT.w, LIGHT.h, 'LIGHT IT NOW', 16, PAL.cta, PAL.cream, null); G.Ads.glyph(ctx, LIGHT.x - LIGHT.w / 2 + 30, LIGHT.y, 18, PAL.cream, PAL.cta);
  };
  Offers.tapWorld = function (S, wx, wy) {
    if (!LIGHT.id || Math.abs(wx - LIGHT.x - 12) > LIGHT.w / 2 + 6 || Math.abs(wy - LIGHT.y) > LIGHT.h / 2 + 8) return false;
    const id = LIGHT.id;
    G.Ads.rewarded(S, 'light', S2 => { if (G.Lanterns.active(S2, id)) { G.Lanterns.light(S2, id); S2.offers.lightCd = R.lightCooldown; } });
    return true;
  };
})(window.G);
