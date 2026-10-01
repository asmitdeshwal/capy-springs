// Capy Springs - cards: offline earnings, reset confirm, season travel, the Seasons list, settings popover, intro fade (ARCHITECTURE.md 13 / 20, GDD 10.7 / 10.8 / 13 / 17).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL;
  const Cards = G.Cards = {};
  const CARD = { kind: null, info: null, t: 0, closing: 0 };
  const evNone = {};
  const SET = { x: 270, y: 0, w: 260, h: 348, rows: ['Sound', 'Haptics', 'Shake & flash', 'Low effects'], buttons: [] };
  const ROW_H = 74, ROWS_MAX = 3, MISSING = [];
  let pendingTravel = 0, pendingT = 0, versionTaps = 0, versionTapT = 0;
  // the popover's buttons under the toggles (Developer only in dev mode); height follows
  function settingsButtons() { const b = SET.buttons; b.length = 0; b.push('Guestbook'); if (G.Seasons.list.length > 1) b.push('Seasons'); b.push('Main menu'); if (G.Dev.on) b.push('Developer'); b.push('Reset save'); SET.h = 8 + 4 * 56 + 12 + b.length * 48 + 16; return b; }

  Cards.init = function (S) {
    pendingTravel = 0; pendingT = 0;
    if (Cards.subscribed) return;
    Cards.subscribed = true;
    // the travel card waits for the "SEASON n OPEN!" banner and the confetti; never in the harness (it would park the bot in card mode)
    G.Bus.on('season:unlock', e => { if (!G.Game.headless) { pendingTravel = e.id; pendingT = C.TRAVEL_CARD_DELAY; } });
  };
  // copy info: offlineCalc reuses one shared object, a later call must never mutate a displayed card
  Cards.showOffline = function (S, info) { CARD.kind = 'offline'; CARD.info = { away: info.away, cars: info.cars, coins: info.coins, floorCoins: info.floorCoins, show: info.show }; CARD.t = 0; CARD.closing = 0; S.ui.card = CARD; G.Game.syncMode(S); };
  Cards.showReset = function (S) { CARD.kind = 'reset'; CARD.info = null; CARD.t = 0; CARD.closing = 0; S.ui.card = CARD; G.Game.syncMode(S); };
  Cards.showTravel = function (S, id) { const d = G.Seasons.byId[id]; if (!d) return; CARD.kind = 'travel'; CARD.info = d; CARD.t = 0; CARD.closing = 0; S.ui.card = CARD; G.Game.syncMode(S); };
  Cards.showSeasons = function (S) { CARD.kind = 'seasons'; CARD.info = null; CARD.t = 0; CARD.closing = 0; S.ui.card = CARD; G.Game.syncMode(S); };
  Cards.showDev = function (S) { if (!G.Dev.on) return; S.ui.settings = false; CARD.kind = 'dev'; CARD.info = null; CARD.t = 0; CARD.closing = 0; S.ui.card = CARD; G.Game.syncMode(S); };
  Cards.showGoals = function (S) { S.ui.settings = false; CARD.kind = 'goals'; CARD.info = null; CARD.t = 0; CARD.closing = 0; S.ui.card = CARD; G.Game.syncMode(S); };
  Cards.close = function (S) { if (S.ui.card && !(CARD.closing > 0)) CARD.closing = 0.001; };
  // shared by the settings popover and the title screen: 7 taps on a version label within 3 s toggle developer mode; the pips count up
  Cards.versionTap = function (S) {
    versionTaps++; versionTapT = 3; G.Bus.emit('ui:pip', evNone);
    if (versionTaps >= 7) { versionTaps = 0; G.Dev.toggle(S); }
    else if (versionTaps >= 4) G.HUD.banner(S, (7 - versionTaps) + ' MORE TAP' + (7 - versionTaps === 1 ? '' : 'S'));
  };
  Cards.toggleSettings = function (S) { S.ui.settings = !S.ui.settings; G.Game.syncMode(S); };
  Cards.update = function (S, dt) {
    if (versionTapT > 0) { versionTapT -= dt; if (versionTapT <= 0) versionTaps = 0; }
    if (S.ui.card) { CARD.t += dt; if (CARD.closing > 0) { CARD.closing += dt; if (CARD.closing > 0.3) { S.ui.card = null; G.Game.syncMode(S); } } }
    else if (pendingTravel) { pendingT -= dt; if (pendingT <= 0 && S.mode === 'play') { const id = pendingTravel; pendingTravel = 0; Cards.showTravel(S, id); } }
  };
  function settingsRect() { const st = G.Canvas.st || 0; settingsButtons(); SET.x = 270 - SET.w / 2 + 130; SET.y = st + 166; return SET; }
  Cards.settingsHas = function (x, y) { const r = settingsRect(); return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; };
  function cardRect(out) { const H = G.Canvas.H; out.x0 = 50; out.y0 = H / 2 - 160; out.x1 = 490; out.y1 = H / 2 + 160; return out; }
  const CR = { x0: 0, y0: 0, x1: 0, y1: 0 };
  // the seasons list shows at most ROWS_MAX rows, with the current season always among them
  function seasonRows() { const L = G.Seasons.list, cur = G.SEASON.id; let i0 = 0; for (let i = 0; i < L.length; i++) if (L[i].id === cur) i0 = Math.max(0, Math.min(i - 1, L.length - ROWS_MAX)); return i0; }

  Cards.tap = function (S, x, y) {
    if (S.ui.card) {
      if (CARD.closing > 0) return true;
      cardRect(CR); const cy = (CR.y0 + CR.y1) / 2;
      if (CARD.kind === 'offline') { if (x >= 160 && x <= 380 && y >= cy + 76 && y <= cy + 140) { const v = CARD.info.coins + CARD.info.floorCoins; G.Coins.add(S, v, 'offline'); G.HUD.offlineRain(S, v); CARD.closing = 0.001; } return true; }
      if (CARD.kind === 'reset') {
        if (y >= cy + 60 && y <= cy + 124) {
          if (x >= 70 && x <= 260) { CARD.closing = 0.001; }
          else if (x >= 280 && x <= 470) { G.Save.clear(); S.ui.card = null; G.Game.newGame(); }
        }
        return true;
      }
      if (CARD.kind === 'travel') {
        if (y >= cy + 60 && y <= cy + 124) {
          if (x >= 70 && x <= 260) CARD.closing = 0.001;
          else if (x >= 280 && x <= 470) { G.Bus.emit('ui:pip', evNone); G.Seasons.travel(S, CARD.info.id); CARD.closing = 0.001; }
        }
        return true;
      }
      if (CARD.kind === 'dev') return G.Dev.tap(S, x, y);
      if (CARD.kind === 'goals') return G.Goals.tap(S, x, y);
      if (CARD.kind === 'seasons') {
        if (x < CR.x0 || x > CR.x1 || y < CR.y0 || y > CR.y1) { CARD.closing = 0.001; return true; }
        const L = G.Seasons.list, i0 = seasonRows();
        for (let i = i0; i < L.length && i < i0 + ROWS_MAX; i++) {
          const ry = CR.y0 + 70 + (i - i0) * ROW_H, d = L[i];
          if (y >= ry && y <= ry + 64 && x >= 376 && x <= 474 && G.Seasons.canTravel(d.id)) { G.Bus.emit('ui:pip', evNone); G.Seasons.travel(S, d.id); CARD.closing = 0.001; return true; }
        }
        return true;
      }
      return true;
    }
    if (S.ui.settings) {
      const r = settingsRect();
      if (!Cards.settingsHas(x, y)) { S.ui.settings = false; G.Game.syncMode(S); return true; }
      const row = Math.floor((y - r.y - 8) / 56);
      // the version strip along the popover's bottom edge: seven taps within three seconds toggle developer mode (a thumb-sized target)
      if (y >= r.y + r.h - 34) { Cards.versionTap(S); return true; }
      if (row === 0) { S.settings.sound = !S.settings.sound; G.Audio.setEnabled(S, S.settings.sound); }
      else if (row === 1) { S.settings.haptics = S.settings.haptics === false ? true : false; }
      else if (row === 2) { S.settings.shakeFlash = !S.settings.shakeFlash; }
      else if (row === 3) { S.settings.lowFx = !S.settings.lowFx; G.Render.markStaticDirty(); }
      else if (y >= r.y + 244) {
        const b = SET.buttons[Math.floor((y - (r.y + 244)) / 48)];
        if (b === 'Guestbook') { Cards.showGoals(S); }
        else if (b === 'Seasons') { S.ui.settings = false; Cards.showSeasons(S); }
        else if (b === 'Main menu') { S.ui.settings = false; G.Game.syncMode(S); G.Title.show(S); }
        else if (b === 'Developer') { Cards.showDev(S); }
        else if (b === 'Reset save') { S.ui.settings = false; Cards.showReset(S); }
        return true;
      }
      G.Save.write(S);
      return true;
    }
    return false;
  };

  Cards.draw = function (ctx, S) {
    const A = G.Art.S, H = G.Canvas.H, T = G.Seasons.text;
    if (S.mode === 'intro') Cards.drawIntro(ctx, S);
    if (S.ui.settings) {
      const r = settingsRect();
      A.fillRRect(ctx, r.x, r.y + 4, r.w, r.h, 18, PAL.rgba(PAL.ink, 0.25)); A.fillRRect(ctx, r.x, r.y, r.w, r.h, 18, PAL.cream);
      const vals = [S.settings.sound, S.settings.haptics !== false, S.settings.shakeFlash, S.settings.lowFx];
      for (let i = 0; i < 4; i++) {
        const y = r.y + 8 + i * 56 + 28;
        A.text(ctx, SET.rows[i], r.x + 18, y, 18, PAL.ink, LEFT);
        A.fillRRect(ctx, r.x + r.w - 74, y - 14, 56, 28, 14, vals[i] ? PAL.pine : PAL.rgba(PAL.ink, 0.2)); A.circle(ctx, r.x + r.w - 74 + (vals[i] ? 42 : 14), y, 11, PAL.cream);
      }
      for (let i = 0; i < SET.buttons.length; i++) {
        const b = SET.buttons[i], by = r.y + 244 + i * 48, red = b === 'Reset save', dev = b === 'Developer';
        A.fillRRect(ctx, r.x + 18, by, r.w - 36, 40, 12, red ? PAL.rgba(PAL.red, 0.12) : dev ? PAL.rgba(PAL.amber, 0.35) : PAL.rgba(PAL.cta, 0.12));
        A.text(ctx, b === 'Seasons' ? 'Seasons  ' + Math.round(G.Seasons.progress(S) * 100) + '%' : b === 'Guestbook' ? 'Guestbook  ' + G.Goals.doneCount(S) + '/3' : b, r.x + r.w / 2, by + 21, 18, red ? PAL.red : dev ? PAL.ink : PAL.cta);
      }
      A.text(ctx, 'v' + G.VERSION + (G.Dev.on ? ' · developer mode' : ''), r.x + r.w - 14, r.y + r.h - 12, 11, PAL.stoneDark, RIGHT);
    }
    if (S.ui.card) {
      cardRect(CR); const cx = 270, cy = (CR.y0 + CR.y1) / 2, k = CARD.closing > 0 ? U.easeInQuad(Math.min(1, CARD.closing / 0.3)) : 1 - U.easeOutBack(Math.min(1, CARD.t / 0.35));
      ctx.fillStyle = PAL.rgba(PAL.ink, 0.45 * (1 - k)); ctx.fillRect(0, 0, 540, H);
      ctx.save(); ctx.translate(0, k * H);
      if (CARD.kind === 'dev') { G.Dev.draw(ctx, S, k); ctx.restore(); return; }
      if (CARD.kind === 'goals') { G.Goals.draw(ctx, S, k); ctx.restore(); return; }
      A.fillRRect(ctx, CR.x0, CR.y0 + 6, 440, 320, 24, PAL.rgba(PAL.ink, 0.3)); A.fillRRect(ctx, CR.x0, CR.y0, 440, 320, 24, PAL.cream);
      if (CARD.kind === 'offline') {
        const info = CARD.info, Ch = G.Art.Ch, p = Ch.resetPose(Ch.POSE), veh = T('vehicle', 'cable car');
        A.text(ctx, 'Welcome back!', cx, CR.y0 + 40, 28, PAL.ink);
        p.x = CR.x0 + 70; p.y = cy + 40; p.face = 1; p.t = S.t; p.pose = 'wave'; p.poseT = (S.t % 1);
        if (S.helpers.pon.hired) Ch.pon(ctx, p); else Ch.kit(ctx, p, S);
        A.text(ctx, info.cars + ' ' + veh + (info.cars === 1 ? ' came by' : 's came by'), cx + 40, CR.y0 + 90, 20, PAL.ink);
        A.text(ctx, '+' + (info.coins + info.floorCoins), cx + 40, CR.y0 + 140, 40, PAL.coinRim);
        if (info.floorCoins > 0) A.text(ctx, (S.helpers.pon.hired ? T('ponTidied', 'Pon tidied up ') : 'left in the trays: ') + info.floorCoins, cx + 40, CR.y0 + 176, 14, PAL.stoneDark);
        A.fillRRect(ctx, 160, cy + 76, 220, 64, 32, PAL.cta); A.text(ctx, 'COLLECT', 270, cy + 109, 26, PAL.cream);
      } else if (CARD.kind === 'reset') {
        A.text(ctx, T('resetTitle', 'Start a new inn?'), cx, CR.y0 + 60, 28, PAL.ink);
        A.text(ctx, 'This season\'s lanterns and upgrades', cx, CR.y0 + 110, 18, PAL.stoneDark); A.text(ctx, 'will be gone for good.', cx, CR.y0 + 134, 18, PAL.stoneDark);
        A.fillRRect(ctx, 70, cy + 60, 190, 64, 32, PAL.rgba(PAL.ink, 0.12)); A.text(ctx, 'KEEP', 165, cy + 93, 24, PAL.ink);
        A.fillRRect(ctx, 280, cy + 60, 190, 64, 32, PAL.red); A.text(ctx, 'RESET', 375, cy + 93, 24, PAL.cream);
      } else if (CARD.kind === 'travel') {
        const d = CARD.info;
        A.text(ctx, 'Season ' + d.id + ' is open!', cx, CR.y0 + 42, 26, PAL.ink);
        A.text(ctx, d.name, cx, CR.y0 + 98, 36, PAL.cta);
        A.text(ctx, d.subtitle || '', cx, CR.y0 + 138, 18, PAL.stoneDark);
        A.text(ctx, d.teaser || '', cx, CR.y0 + 166, 15, PAL.ink);
        A.text(ctx, 'The Deck keeps earning while you are away.', cx, CR.y0 + 192, 13, PAL.stoneDark);
        A.fillRRect(ctx, 70, cy + 60, 190, 64, 32, PAL.rgba(PAL.ink, 0.12)); A.text(ctx, 'LATER', 165, cy + 93, 24, PAL.ink);
        A.fillRRect(ctx, 280, cy + 60, 190, 64, 32, PAL.cta); A.text(ctx, 'GO', 375, cy + 93, 26, PAL.cream);
      } else if (CARD.kind === 'seasons') {
        const L = G.Seasons.list, i0 = seasonRows(), cur = G.SEASON.id, meta = G.Seasons.meta;
        A.text(ctx, 'Seasons', cx, CR.y0 + 36, 28, PAL.ink);
        for (let i = i0; i < L.length && i < i0 + ROWS_MAX; i++) {
          const d = L[i], ry = CR.y0 + 70 + (i - i0) * ROW_H, here = d.id === cur, open = G.Seasons.isUnlocked(d.id);
          A.fillRRect(ctx, CR.x0 + 16, ry, 408, 64, 14, here ? PAL.rgba(PAL.cta, 0.10) : PAL.rgba(PAL.ink, 0.06));
          A.text(ctx, d.id + '. ' + d.name, CR.x0 + 34, ry + 22, 19, open ? PAL.ink : PAL.stoneDark, LEFT);
          let sub;
          if (here) { Seasons_missing(S); let n = 0; for (let j = 0; j < MISSING.length; j++) n += MISSING[j].n; sub = n === 0 ? 'Complete!' : n + ' thing' + (n === 1 ? '' : 's') + ' left to buy'; }
          else if (open) { const p = meta.progress[d.id]; sub = p === undefined ? 'New - start fresh' : (meta.done[d.id] ? 'Finished, ' : '') + p + '% complete'; }
          else sub = 'Light ' + lanternLabel(G.Seasons.byId[d.id - 1], d.id) + ' to open';
          A.text(ctx, sub, CR.x0 + 34, ry + 46, 13, PAL.stoneDark, LEFT);
          const pct = here ? Math.round(G.Seasons.progress(S) * 100) : (meta.progress[d.id] || 0);
          if (open) A.ring(ctx, CR.x0 + 352, ry + 32, 14, pct / 100, 4, PAL.cta, PAL.rgba(PAL.ink, 0.12));
          if (here) A.pill(ctx, 425, ry + 32, 70, 28, 'HERE', 15, PAL.rgba(PAL.ink, 0.1), PAL.ink, null);
          else if (open) { A.fillRRect(ctx, 376, ry + 12, 98, 40, 20, PAL.cta); A.text(ctx, 'GO', 425, ry + 33, 20, PAL.cream); }
          else A.icon(ctx, 'lock', 425, ry + 32, 22);
        }
        A.text(ctx, 'tap outside to close', cx, CR.y1 - 18, 12, PAL.stoneDark);
      }
      ctx.restore();
    }
  };
  function Seasons_missing(S) { G.Seasons.missing(S, MISSING); }
  // the lantern in the PREVIOUS season whose effect opens season `id` (its label is what the locked row says to light)
  function lanternLabel(prev, id) {
    if (!prev) return 'the way';
    const L = prev.data ? prev.data.LANTERNS : G.DATA.LANTERNS;
    for (let i = 0; i < L.length; i++) if (L[i].effect === 'travel:' + id) return 'the ' + L[i].label + ' in ' + prev.name;
    return prev.name + '\'s finale';
  }
  Cards.drawIntro = function (ctx, S) {
    const a = 1 - U.clamp(S.introT / C.INTRO_T, 0, 1);
    if (a <= 0) return;
    ctx.globalAlpha = a; ctx.fillStyle = PAL.cream; ctx.fillRect(0, 0, 540, G.Canvas.H); ctx.globalAlpha = 1;
  };
  const LEFT = { align: 'left' }, RIGHT = { align: 'right' };
})(window.G);
