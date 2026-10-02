// Capy Springs - Grandma Yuzu's notes (GDD 20.1): Kaa the crow brings a short note down the mountain at milestones the climb already has.
// A paper strip slides in under the HUD for a few seconds (tap to close); the sim keeps running. Seen notes persist; the harness only counts them.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL;
  const Story = G.Story = {};
  // each note is pre-broken into lines that fit the strip at 15 px
  const NOTES = {
    cedar:    ["Kit, the inn is yours now. I've gone up to", 'tend the Source. Keep the water hot!', 'Kaa will bring my notes.  — Grandma Yuzu'],
    ridge:    ['The Ridge already! The snow up here bites.', 'Build a sauna: a cold plunge right after', 'is the old secret.  — G.'],
    pavilion: ['Tsuru came back! She once massaged the', 'whole mountain. Fill every chair before', 'the gong rings.  — G.'],
    momo:     ['The monkey in the crown is Momo. His', 'troupe lives above the clouds. Be kind:', 'he knows the way to me.  — G.'],
    summit:   ["You're nearly here. The Source sleeps", 'under the ice, and every lantern you lit', 'is a warm breath on it.  — G.'],
    source:   ['You found the Source! When the geyser', 'blows, splash them in: the water gives', 'twice as much.  — G.'],
    shrine:   ["That's my hut, the one with the smoke.", "Don't knock yet: wake the Source first,", 'then come and sit with me.  — G.'],
    catchup:  ['Kit! Kaa says the inn is growing fast.', "I'm up at the Source, above the clouds.", 'Keep climbing, dear.  — Grandma Yuzu']
  };
  const SHOW_T = 7.5, DELAY_T = 2.5, SLIDE = 0.35;
  const R = { x0: 64, x1: 476, y0: 0, h: 104 };

  Story.init = function (S) {
    if (!Story.subscribed) {
      Story.subscribed = true;
      const B = G.Bus;
      B.on('lantern:lit', e => { if (e.level === 1 && (e.id === 'cedar' || e.id === 'pavilion' || e.id === 'shrine' || e.id === 'source')) Story.trigger(G.Game.S, e.id); });
      B.on('ridge:open', () => Story.trigger(G.Game.S, 'ridge'));
      B.on('summit:open', () => Story.trigger(G.Game.S, 'summit'));
      B.on('vip:arrive', () => Story.trigger(G.Game.S, 'momo'));
    }
    // a save from before the notes existed: everything already passed counts as read, and one catch-up note introduces Grandma
    const st = S.story, L = S.lanterns;
    if (G.SEASON.id === 1 && !st.seen.cedar && !st.seen.catchup && L.cedar && L.cedar.level >= 1 && (S.built.bamboo || S.built.ridge)) {
      st.seen.cedar = true; if (S.built.ridge) st.seen.ridge = true; if (S.built.pavilion) st.seen.pavilion = true; if (S.stats.vip > 0) st.seen.momo = true;
      if (S.built.summit) st.seen.summit = true; if (S.built.source) st.seen.source = true; if (S.built.shrine) st.seen.shrine = true;
      if (!S.built.awake) Story.trigger(S, 'catchup'); else st.seen.catchup = true;
    }
  };
  Story.trigger = function (S, id) { if (!S || G.SEASON.id !== 1 || !NOTES[id]) return; const st = S.story; if (st.seen[id] || st.cur === id || st.queue.indexOf(id) >= 0) return; st.queue.push(id); };
  Story.update = function (S, dt) {
    const st = S.story;
    if (st.cur) { st.showT -= dt; if (st.showT <= 0) st.cur = null; return; }
    if (!st.queue.length) return;
    if (G.Game.headless) { st.seen[st.queue.shift()] = true; S.stats.notes++; return; }          // the harness has no strip; it only counts
    if (S.mode !== 'play' || S.ui.banner || S.t - S.splash.t < C.SPLASH_WINDOW) { st.delayT = Math.max(st.delayT, 1); return; }   // never over a banner or a chain
    st.delayT -= dt; if (st.delayT > 0) return;
    st.cur = st.queue.shift(); st.seen[st.cur] = true; st.showT = SHOW_T; st.delayT = DELAY_T; S.stats.notes++;
    G.Bus.emit('story:note', EV);
  };
  const EV = {};
  function layout() { R.y0 = (G.Canvas.st || 0) + 244; }         // below the gear and the Guestbook chip (Kaa stands on the top edge)
  Story.tap = function (S, x, y) {
    const st = S.story; if (!st.cur) return false;
    layout(); if (x < R.x0 || x > R.x1 || y < R.y0 - 20 || y > R.y0 + R.h) return false;
    st.showT = Math.min(st.showT, SLIDE); return true;
  };
  Story.draw = function (ctx, S) {
    const st = S.story; if (!st.cur) return;
    const A = G.Art.S, lines = NOTES[st.cur], up = SHOW_T - st.showT, k = up < SLIDE ? 1 - U.easeOutBack(up / SLIDE) : st.showT < SLIDE ? 1 - st.showT / SLIDE : 0;
    layout();
    const y0 = R.y0 - k * (R.y0 + R.h + 20), w = R.x1 - R.x0;
    A.fillRRect(ctx, R.x0, y0 + 5, w, R.h, 14, PAL.rgba(PAL.ink, 0.25));
    A.fillRRect(ctx, R.x0, y0, w, R.h, 14, PAL.cream);
    A.fillRRect(ctx, R.x0, y0, 8, R.h, 4, PAL.red);                                   // the paper's red binding
    for (let i = 0; i < lines.length; i++) A.text(ctx, lines[i], R.x0 + 24, y0 + 26 + i * 25, 15, PAL.ink, LEFT);
    G.Art.Ch.kaa(ctx, R.x1 - 22, y0 + 4, 0, S.t, 0);                                    // Kaa perched on the corner, the messenger
  };
  const LEFT = { align: 'left', maxW: 372 };
})(window.G);
