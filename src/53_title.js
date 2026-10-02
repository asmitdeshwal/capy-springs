// Capy Springs - title screen (mode 'title'): logo, Kit and a capy, PLAY / CONTINUE, SEASONS, SETTINGS; the offline card waits behind PLAY (ARCHITECTURE.md 21).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL;
  const Title = G.Title = { t: 0, pending: null };
  const BTN = [];                                        // laid out each draw: { id, x, y, w, h }
  const R = { logoY: 0, heroY: 0 };

  function layout() {
    const H = G.Canvas.H, st = G.Canvas.st || 0;
    R.logoY = st + 0.20 * H; R.heroY = 0.46 * H;
    BTN.length = 0;
    const many = G.Seasons.list.length > 1;
    BTN.push({ id: 'play', x: 120, y: 0.58 * H, w: 300, h: 70 });
    let y = 0.58 * H + 90;
    if (many) { BTN.push({ id: 'seasons', x: 120, y, w: 300, h: 56 }); y += 72; }
    BTN.push({ id: 'goals', x: 120, y, w: 300, h: 56 }); y += 72;
    BTN.push({ id: 'help', x: 120, y, w: 300, h: 56 }); y += 72;
    BTN.push({ id: 'settings', x: 120, y, w: 300, h: 56 });
    if (G.Dev.on) BTN.push({ id: 'dev', x: 390, y: H - (G.Canvas.sb || 0) - 56, w: 130, h: 40 });
  }
  Title.hasProgress = S => S.earned > 0 || S.t > 5;
  Title.show = function (S) {
    if (S.ui.sheet) G.Sheet.close(S);
    S.ui.settings = false; S.ui.card = null;
    S.mode = 'title'; Title.t = 0;
    G.Save.write(S);
  };
  // PLAY: the Welcome-back card that boot held back shows now; otherwise the usual intro fade
  Title.play = function (S) {
    G.Bus.emit('ui:pip', EV);
    G.Input.lastStickT = -1;                             // fiddling on the title is not the first drag
    // a brand-new inn reads the How-to-play pages first (three taps), then the intro
    if (!Title.hasProgress(S) && !S.tutorial.HELP) { S.tutorial.HELP = 1; S.mode = 'play'; G.Cards.showHelp(S, Title.begin); return; }
    Title.begin(S);
  };
  Title.begin = function (S) {
    if (G.Finale && G.Finale.pending(S)) { Title.pending = null; S.mode = 'play'; G.Finale.start(S, { resume: true }); return; }   // the ending was interrupted: pick it up at the gathering
    const info = Title.pending; Title.pending = null;
    if (info && info.show) { S.mode = 'play'; G.Cards.showOffline(S, info); return; }
    S.mode = 'intro'; S.introT = 0;
  };
  Title.update = function (S, dt) { Title.t += dt; };
  Title.tap = function (S, x, y) {
    layout();
    for (let i = 0; i < BTN.length; i++) {
      const b = BTN[i]; if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) continue;
      if (b.id === 'play') Title.play(S);
      else if (b.id === 'seasons') G.Cards.showSeasons(S);
      else if (b.id === 'goals') G.Cards.showGoals(S);
      else if (b.id === 'help') G.Cards.showHelp(S, null);
      else if (b.id === 'settings') G.Cards.toggleSettings(S);
      else if (b.id === 'dev') G.Cards.showDev(S);
      return true;
    }
    // the version line at the bottom: seven taps toggle developer mode (same secret as the settings popover)
    if (y >= G.Canvas.H - (G.Canvas.sb || 0) - 44 && x < 380) G.Cards.versionTap(S);
    return true;                                         // the title owns every tap
  };
  Title.draw = function (ctx, S) {
    const A = G.Art.S, Ch = G.Art.Ch, H = G.Canvas.H, t = Title.t, season = G.SEASON;
    layout();
    ctx.fillStyle = PAL.rgba(PAL.ink, 0.30); ctx.fillRect(0, 0, 540, H);
    if (!SKY.g || SKY.h !== H) { SKY.h = H; SKY.g = ctx.createLinearGradient(0, 0, 0, H * 0.45); SKY.g.addColorStop(0, PAL.rgba(PAL.skyDay, 0.9)); SKY.g.addColorStop(1, PAL.rgba(PAL.skyDay, 0)); }
    ctx.fillStyle = SKY.g; ctx.fillRect(0, 0, 540, H * 0.45);          // a morning sky over the inn
    // logo with steam
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.globalAlpha = 0.5 * (1 - k); A.circle(ctx, 200 + i * 70 + Math.sin(t + i) * 8, R.logoY - 70 - k * 50, 12 + k * 14, PAL.cream); }
    ctx.globalAlpha = 1;
    // the logo hangs on a wooden sign from two ropes, swaying a little
    const sw = 420, sh = 176, sy = R.logoY + 14, sway = Math.sin(t * 1.3) * 0.012;
    A.line(ctx, 270 - 150, 0, 270 - 150, sy - sh / 2 + 14, PAL.cedarDark, 4); A.line(ctx, 270 + 150, 0, 270 + 150, sy - sh / 2 + 14, PAL.cedarDark, 4);
    ctx.save(); ctx.translate(270, sy - sh / 2); ctx.rotate(sway); ctx.translate(-270, -(sy - sh / 2));
    A.plate(ctx, 270 - sw / 2, sy - sh / 2, sw, sh, 26, PAL.cedar, PAL.cedarDark, 12);
    for (let i = 1; i < 4; i++) A.line(ctx, 270 - sw / 2 + 22, sy - sh / 2 + i * sh / 4, 270 + sw / 2 - 22, sy - sh / 2 + i * sh / 4 + (i & 1 ? 3 : -2), PAL.rgba(PAL.cedarDark, 0.22), 2);
    for (const nx of [-1, 1]) A.circle(ctx, 270 + nx * 150, sy - sh / 2 + 14, 5, PAL.cedarDark);
    A.text(ctx, 'CAPY', 270, R.logoY - 20, 78, PAL.cta, LOGO); A.text(ctx, 'SPRINGS', 270, R.logoY + 50, 64, PAL.amber, LOGO);
    ctx.restore();
    if (G.Seasons.list.length > 1 || season.id !== 1) A.pill(ctx, 270, R.logoY + 136, 300, 30, 'Season ' + season.id + '  ·  ' + season.name, 16, PAL.rgba(PAL.cream, 0.92), PAL.ink, null);
    else if (S.built.awake) A.pill(ctx, 270, R.logoY + 136, 400, 30, 'The Golden Age  ·  ' + G.Golden.seasonName(S) + (S.festival.best > 0 ? '  ·  best festival ' + A.fmtCoins(S.festival.best) : ''), 15, PAL.rgba(PAL.cream, 0.92), PAL.ink, null);
    else A.pill(ctx, 270, R.logoY + 136, 360, 30, season.teaser || 'Lead capybaras into steaming baths.', 15, PAL.rgba(PAL.cream, 0.92), PAL.ink, null);   // what the game is, in one line
    // Kit waving and a capy in a yuzu hat, bobbing
    const p = Ch.resetPose(Ch.POSE);
    p.x = 215; p.y = R.heroY + Math.sin(t * 2) * 3; p.face = 1; p.t = t; p.pose = 'wave'; p.poseT = t % 1; Ch.kit(ctx, p, S);
    Ch.resetPose(p); p.x = 310; p.y = R.heroY + 2 + Math.sin(t * 2 + 1) * 3; p.face = -1; p.t = t; p.hat = 'yuzu'; p.scarf = season.id === 2 ? PAL.red : null; Ch.capy(ctx, p);
    // buttons
    for (let i = 0; i < BTN.length; i++) {
      const b = BTN[i], main = b.id === 'play', dev = b.id === 'dev';
      const pulse = main ? 1 + 0.02 * Math.sin(t * 4) : 1;
      ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
      A.fillRRect(ctx, -b.w / 2, -b.h / 2 + 4, b.w, b.h, b.h / 2, PAL.rgba(PAL.ink, 0.3));
      A.fillRRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.h / 2, main ? PAL.cta : dev ? PAL.ink : PAL.cream);
      const label = main ? (Title.hasProgress(S) ? 'CONTINUE' : 'PLAY') : dev ? 'DEV MENU' : b.id === 'seasons' ? 'SEASONS' : b.id === 'goals' ? 'GUESTBOOK  ' + G.Goals.doneCount(S) + '/3' : b.id === 'help' ? 'HOW TO PLAY' : 'SETTINGS';
      A.text(ctx, label, 0, 1, main ? 30 : dev ? 16 : 22, main || dev ? PAL.cream : PAL.ink);
      ctx.restore();
    }
    A.text(ctx, 'v' + G.VERSION + (G.Dev.on ? '  ·  developer mode' : ''), G.Dev.on ? 200 : 270, H - (G.Canvas.sb || 0) - 18, 12, PAL.rgba(PAL.cream, 0.75));
    if (S.ui.banner) { const b = S.ui.banner; A.pill(ctx, 270, R.logoY + 180, 260, 40, b.text, 20, PAL.cream, PAL.cta, null); }   // "3 MORE TAPS", "DEV MODE ON"
  };
  const LOGO = { stroke: PAL.cream, lw: 8 }, EV = {}, SKY = { g: null, h: 0 };
})(window.G);
