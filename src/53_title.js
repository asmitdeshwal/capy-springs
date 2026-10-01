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
    if (many) BTN.push({ id: 'seasons', x: 120, y: 0.58 * H + 90, w: 300, h: 56 });
    BTN.push({ id: 'settings', x: 120, y: 0.58 * H + (many ? 162 : 90), w: 300, h: 56 });
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
    const info = Title.pending; Title.pending = null;
    G.Bus.emit('ui:pip', EV);
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
    ctx.fillStyle = PAL.rgba(PAL.ink, 0.42); ctx.fillRect(0, 0, 540, H);
    // logo with steam
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.globalAlpha = 0.5 * (1 - k); A.circle(ctx, 200 + i * 70 + Math.sin(t + i) * 8, R.logoY - 70 - k * 50, 12 + k * 14, PAL.cream); }
    ctx.globalAlpha = 1;
    A.text(ctx, 'CAPY', 270, R.logoY - 20, 78, PAL.cta, LOGO); A.text(ctx, 'SPRINGS', 270, R.logoY + 50, 64, PAL.amber, LOGO);
    if (G.Seasons.list.length > 1 || season.id !== 1) A.pill(ctx, 270, R.logoY + 104, 300, 30, 'Season ' + season.id + '  ·  ' + season.name, 16, PAL.rgba(PAL.cream, 0.92), PAL.ink, null);
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
      const label = main ? (Title.hasProgress(S) ? 'CONTINUE' : 'PLAY') : dev ? 'DEV MENU' : b.id === 'seasons' ? 'SEASONS' : 'SETTINGS';
      A.text(ctx, label, 0, 1, main ? 30 : dev ? 16 : 22, main || dev ? PAL.cream : PAL.ink);
      ctx.restore();
    }
    A.text(ctx, 'v' + G.VERSION + (G.Dev.on ? '  ·  developer mode' : ''), G.Dev.on ? 200 : 270, H - (G.Canvas.sb || 0) - 18, 12, PAL.rgba(PAL.cream, 0.75));
    if (S.ui.banner) { const b = S.ui.banner; A.pill(ctx, 270, R.logoY + 150, 260, 40, b.text, 20, PAL.cream, PAL.cta, null); }   // "3 MORE TAPS", "DEV MODE ON"
  };
  const LOGO = { stroke: PAL.cream, lw: 8 }, EV = {};
})(window.G);
