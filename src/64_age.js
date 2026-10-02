// Capy Springs - the neutral age question (GDD 21, docs/MONETIZATION.md). Store apps only, asked once at first launch, before any ad
// loads: a game with cute animals and ads is a mixed-audience app (Google Play Families policy, COPPA), so it has to know who is a child.
// Under 13: every ad request is child-directed (only general-audience ads, nothing personalised) and no consent or tracking prompt appears.
// Under 16: tagged as under the age of consent too (no personalised ads in Europe) and no tracking prompt. The question is neutral:
// a decade, then a year; no default, nothing hints at a cutoff; the answer stays on the phone and is not offered again.
(function (G) {
  'use strict';
  const PAL = G.PAL, KEY = 'capysprings.born', EV = {};
  const Age = G.Age = { step: 'decade', decade: 0 };
  const P = { x0: 50, x1: 490, y0: 0, y1: 0 }, BTN = [];
  const thisYear = () => new Date().getFullYear();

  Age.born = () => { const v = parseInt(G.Save.store.get(KEY), 10); return v > 1900 && v <= thisYear() ? v : 0; };
  // only the year is known, so the birthday may not have come yet this year: count the younger of the two possible ages
  const age = () => { const b = Age.born(); return b ? thisYear() - b - 1 : -1; };
  Age.child = () => { const a = age(); return a >= 0 && a < 13; };
  Age.underConsent = () => { const a = age(); return a >= 0 && a < 16; };
  Age.needed = () => !Age.born() && G.Native.is() && !G.Game.headless;

  function layout() {
    const H = G.Canvas.H; P.y0 = Math.round(H / 2 - 180); P.y1 = P.y0 + 360; BTN.length = 0;
    if (Age.step === 'decade') {
      const last = Math.floor(thisYear() / 10) * 10;                              // the nine most recent decades, three by three
      for (let i = 0; i < 9; i++) BTN.push({ v: last - (8 - i) * 10, label: (last - (8 - i) * 10) + 's', x: 270 + ((i % 3) - 1) * 136 - 62, y: P.y0 + 112 + Math.floor(i / 3) * 70, w: 124, h: 56 });
    } else {
      const end = Math.min(Age.decade + 9, thisYear());
      for (let yr = Age.decade, i = 0; yr <= end; yr++, i++) BTN.push({ v: yr, label: String(yr), x: 270 + ((i % 5) - 2) * 84 - 38, y: P.y0 + 122 + Math.floor(i / 5) * 70, w: 76, h: 56 });
      BTN.push({ v: 'back', label: '< other years', x: 270 - 80, y: P.y0 + 270, w: 160, h: 44 });
    }
  }
  Age.open = function () { Age.step = 'decade'; Age.decade = 0; };
  Age.tap = function (S, x, y) {
    layout();
    for (let i = 0; i < BTN.length; i++) {
      const b = BTN[i]; if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) continue;
      G.Bus.emit('ui:pip', EV);
      if (Age.step === 'decade') { Age.decade = b.v; Age.step = 'year'; }
      else if (b.v === 'back') Age.step = 'decade';
      else { G.Save.store.set(KEY, String(b.v)); Age.open(); G.Cards.close(S); G.Ads.init(); }   // ads start now, set up for this player
      return true;
    }
    return true;                                                                    // the question waits for an answer
  };
  Age.draw = function (ctx, S, k) {
    const A = G.Art.S; layout();
    A.fillRRect(ctx, P.x0, P.y0 + 6, P.x1 - P.x0, P.y1 - P.y0, 24, PAL.rgba(PAL.ink, 0.3));
    A.fillRRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 24, PAL.cream);
    A.text(ctx, 'Before you play', 270, P.y0 + 44, 26, PAL.ink);
    A.text(ctx, Age.step === 'decade' ? 'What year were you born?' : 'Born in the ' + Age.decade + 's. Which year?', 270, P.y0 + 82, 17, PAL.stoneDark);
    for (let i = 0; i < BTN.length; i++) {
      const b = BTN[i], back = b.v === 'back';
      if (!back) A.fillRRect(ctx, b.x, b.y, b.w, b.h, 14, PAL.rgba(PAL.cta, 0.12));
      A.text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, back ? 15 : 20, back ? PAL.stoneDark : PAL.ink);
    }
    A.text(ctx, 'Your answer stays on this phone.', 270, P.y1 - 20, 12, PAL.stoneDark);
  };
})(window.G);
