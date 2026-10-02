// Capy Springs - How to play (three illustrated pages: before the first PLAY, from the title and from Settings) and the About card
// (version, credits, privacy policy, terms). Both are card kinds owned by Cards (52_cards.js), which pauses the sim while they are up.
(function (G) {
  'use strict';
  const U = G.U, PAL = G.PAL;
  const Help = G.Help = { page: 0, t: 0 };
  const URLS = { privacy: 'https://asmitdeshwal.github.io/capy-springs/privacy.html', terms: 'https://asmitdeshwal.github.io/capy-springs/terms.html' };
  const R = { x0: 30, x1: 510, y0: 0, y1: 0, h: 560 };
  const AB = { x0: 50, x1: 490, y0: 0, y1: 0, h: 420 };

  // each item: icon, a short line, a quieter second line
  const PAGES = [
    { title: 'Welcome, innkeeper!', art: 'lead', items: [
      ['kit', 'Drag anywhere to walk.', 'Kit goes where your thumb goes.'],
      ['bath', 'Guests follow you in a line.', 'Walk onto a bath and they hop in.'],
      ['koban', 'Soaked guests pay koban.', 'Walk over the gold coins to collect them.'],
      ['sweat', 'A sweat drop means: hurry!', 'Guests who wait too long go home.'] ] },
    { title: 'Grow the inn', art: 'light', items: [
      ['lantern', 'Stand still on a glowing step.', 'Your koban pour in until the lantern lights.'],
      ['check', 'Each lantern builds something new.', 'Its name and price float above it.'],
      ['chevron', 'Standing by a building? Tap it.', 'Upgrades: quicker soaks, more seats, bigger tips.'],
      ['arrow', 'Not sure what to do next?', 'The arrow over Kit points the way.'] ] },
    { title: 'Hot water, big splashes', art: 'heat', items: [
      ['log', 'Carry logs to the boiler.', 'Hot baths go cold without heat.'],
      ['bath', 'Drop 3 guests in within 2 seconds:', 'a SPLASH chain pays extra koban.'],
      ['flame', 'Stoke the boiler to the top', 'for a STEAM RUSH: faster, richer baths.'],
      ['check', 'The Guestbook has 3 goals a day.', 'And the inn earns while you are away.'] ] }
  ];

  function layout() { const H = G.Canvas.H, st = G.Canvas.st || 0; R.h = Math.min(580, H - st - 60); R.y0 = st + Math.max(24, (H - st - R.h) / 2); R.y1 = R.y0 + R.h; }
  function layoutAbout() { const H = G.Canvas.H, st = G.Canvas.st || 0; AB.y0 = st + Math.max(40, (H - st - AB.h) / 2); AB.y1 = AB.y0 + AB.h; }
  function openUrl(u) {
    try { const w = window.open(u, '_blank'); if (!w) location.href = u; }        // Capacitor sends both to the system browser; the game keeps running
    catch (e) { try { location.href = u; } catch (e2) { /* headless */ } }
  }
  const navY = () => R.y1 - 48;
  const hit = (x, y, cx, cy, w, h) => x >= cx - w / 2 && x <= cx + w / 2 && y >= cy - h / 2 && y <= cy + h / 2;

  Help.open = function (S) { Help.page = 0; Help.t = 0; };
  Help.tap = function (S, x, y) {
    layout();
    const last = Help.page === PAGES.length - 1, ny = navY();
    if (U.dist(x, y, R.x1 - 34, R.y0 + 34) <= 30) { G.Cards.close(S); return true; }                 // X: skip
    if (hit(x, y, 410, ny, 180, 60)) { if (last) G.Cards.close(S); else Help.page++; pip(); return true; }
    if (Help.page > 0 && hit(x, y, 130, ny, 160, 60)) { Help.page--; pip(); return true; }
    if (x < R.x0 || x > R.x1 || y < R.y0 || y > R.y1) return true;                                  // outside: nothing (no accidental skip)
    if (x >= 270) { if (last) G.Cards.close(S); else Help.page++; } else if (Help.page > 0) Help.page--;   // tap the right half for next
    pip(); return true;
  };
  const EV = {}; function pip() { G.Bus.emit('ui:pip', EV); }

  Help.draw = function (ctx, S, k) {
    const A = G.Art.S, pg = PAGES[Help.page], t = (Help.t += 1 / 60);
    layout();
    A.fillRRect(ctx, R.x0, R.y0 + 6, R.x1 - R.x0, R.h, 24, PAL.rgba(PAL.ink, 0.3)); A.fillRRect(ctx, R.x0, R.y0, R.x1 - R.x0, R.h, 24, PAL.cream);
    A.text(ctx, pg.title, 270, R.y0 + 38, 26, PAL.ink);
    A.circle(ctx, R.x1 - 34, R.y0 + 34, 18, PAL.rgba(PAL.ink, 0.08)); A.icon(ctx, 'x', R.x1 - 34, R.y0 + 34, 18);
    // the picture
    const ix = 54, iy = R.y0 + 62, iw = 432, ih = 168;
    ctx.save(); A.rrect(ctx, ix, iy, iw, ih, 18); ctx.clip();
    ctx.fillStyle = PAL.pine; ctx.fillRect(ix, iy, iw, ih);
    ctx.fillStyle = PAL.rgba(PAL.cream, 0.08); for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(ix + 30 + i * 52, iy + 30 + (i % 3) * 50, 26, 9, 0, 0, Math.PI * 2); ctx.fill(); }
    if (pg.art === 'lead') drawLead(ctx, S, ix, iy, t); else if (pg.art === 'light') drawLight(ctx, S, ix, iy, t); else drawHeat(ctx, S, ix, iy, t);
    ctx.restore();
    // the lines
    for (let i = 0; i < pg.items.length; i++) {
      const it = pg.items[i], y = iy + ih + 26 + i * 58;
      A.circle(ctx, 80, y + 8, 21, PAL.rgba(PAL.amber, 0.28));
      if (it[0] === 'arrow') G.Art.FX.arrow(ctx, 80, y + 8, 0, 1, 0.55); else A.icon(ctx, it[0], 80, y + 8, 26);
      A.text(ctx, it[1], 112, y, 17, PAL.ink, LEFT);
      A.text(ctx, it[2], 112, y + 21, 14, PAL.stoneDark, LEFT);
    }
    // page dots and buttons
    const ny = navY(), last = Help.page === PAGES.length - 1;
    for (let i = 0; i < PAGES.length; i++) A.circle(ctx, 258 + (i - 1) * 18 + 12, ny, i === Help.page ? 6 : 4, i === Help.page ? PAL.cta : PAL.rgba(PAL.ink, 0.25));
    if (Help.page > 0) { A.fillRRect(ctx, 60, ny - 26, 140, 52, 26, PAL.rgba(PAL.ink, 0.1)); A.text(ctx, 'BACK', 130, ny + 1, 20, PAL.ink); }
    A.fillRRect(ctx, 320, ny - 28, 180, 56, 28, PAL.cta); A.text(ctx, last ? "LET'S GO" : 'NEXT', 410, ny + 1, 22, PAL.cream);
  };

  // ---- the three pictures (card space, clipped to the picture box) ----
  function ground(ctx, ix, iy) { const A = G.Art.S; A.fillRRect(ctx, ix - 10, iy + 128, 460, 60, 0, PAL.pineDark); }
  function walker(p, x, y, face, t, i) { const Ch = G.Art.Ch; Ch.resetPose(p); p.x = x; p.y = y + Math.abs(Math.sin(t * 6 + i)) * -2; p.face = face; p.t = t; p.moving = true; p.walk = t * 8 + i; return p; }
  function drawLead(ctx, S, ix, iy, t) {
    const A = G.Art.S, Ch = G.Art.Ch, p = Ch.POSE, base = iy + 132;
    ground(ctx, ix, iy);
    // the bath on the right, a happy capy soaking in it
    A.plate(ctx, ix + 300, iy + 70, 120, 74, 16, PAL.cedar, PAL.cedarDark, 8);
    A.fillRRect(ctx, ix + 312, iy + 80, 96, 50, 14, PAL.waterHot);
    ctx.save(); ctx.beginPath(); ctx.rect(ix + 300, iy, 140, iy + 112 - iy); ctx.clip();
    Ch.resetPose(p); p.x = ix + 360; p.y = iy + 124; p.face = -1; p.t = t; p.lid = 2; Ch.capy(ctx, p);
    ctx.restore();
    A.fillRRect(ctx, ix + 312, iy + 108, 96, 22, 10, PAL.rgba(PAL.waterHot, 0.9));
    const c = (t * 0.8) % 1; G.Art.FX.kobanAt(ctx, ix + 360, iy + 70 - c * 40, 1);
    // Kit leading three capys
    const lead = ix + 210 + Math.sin(t * 1.2) * 10;
    Ch.kit(ctx, walker(p, lead, base, 1, t, 0), S);
    for (let i = 0; i < 3; i++) { Ch.capy(ctx, walker(p, lead - 46 - i * 44, base, 1, t, i + 1)); }
  }
  function drawLight(ctx, S, ix, iy, t) {
    const A = G.Art.S, Ch = G.Art.Ch, p = Ch.POSE, sx = ix + 236, sy = iy + 136;
    ground(ctx, ix, iy);
    // the stone step, its fill ring, the lantern post and the price
    const frac = (t * 0.35) % 1;
    A.ellipse(ctx, sx, sy, 46, 16, PAL.stone); A.ellipse(ctx, sx, sy - 3, 42, 13, PAL.stoneLight || PAL.cream);
    A.ring(ctx, sx, sy - 3, 30, frac, 5, PAL.cta, PAL.rgba(PAL.ink, 0.15));
    A.fillRRect(ctx, sx + 58, iy + 46, 8, 90, 3, PAL.cedarDark);
    A.icon(ctx, 'lantern', sx + 62, iy + 44, 40);
    if (frac > 0.9) A.circle(ctx, sx + 62, iy + 44, 30, PAL.rgba(PAL.amber, 0.35));
    A.pill(ctx, sx + 62, iy + 12, 96, 26, String(Math.max(0, Math.round(120 * (1 - frac)))), 16, PAL.cream, PAL.ink, 'koban');
    Ch.resetPose(p); p.x = sx; p.y = sy; p.face = 1; p.t = t; Ch.kit(ctx, p, S);
    for (let i = 0; i < 3; i++) { const u = ((t * 1.4) + i / 3) % 1; G.Art.FX.kobanAt(ctx, sx + 10 + u * 50, sy - 50 - Math.sin(u * Math.PI) * 40 - u * 30, 0.8); }
    // a finished building on the left, for "something new"
    A.plate(ctx, ix + 40, iy + 64, 110, 66, 14, PAL.cedar, PAL.cedarDark, 8); A.fillRRect(ctx, ix + 52, iy + 74, 86, 40, 12, PAL.waterHot);
    A.icon(ctx, 'check', ix + 136, iy + 60, 26);
  }
  function drawHeat(ctx, S, ix, iy, t) {
    const A = G.Art.S, Ch = G.Art.Ch, p = Ch.POSE, base = iy + 132;
    ground(ctx, ix, iy);
    // the woodpile, Kit with two logs trailing, the boiler and its heat bar filling to a rush
    for (let i = 0; i < 3; i++) A.icon(ctx, 'log', ix + 52 + (i % 2) * 18, iy + 116 - i * 12, 34);
    const kx = ix + 200 + Math.sin(t * 1.4) * 14;
    Ch.kit(ctx, walker(p, kx, base, 1, t, 0), S);
    for (let i = 0; i < 2; i++) A.icon(ctx, 'log', kx - 40 - i * 28, base - 10 + Math.sin(t * 6 + i) * 2, 26);
    A.icon(ctx, 'kettle', ix + 350, iy + 98, 74);
    A.icon(ctx, 'flame', ix + 350, iy + 140, 30);
    const frac = 0.35 + 0.65 * ((t * 0.25) % 1), bx = ix + 296, by = iy + 22;
    A.fillRRect(ctx, bx, by, 110, 18, 5, PAL.rgba(PAL.cream, 0.9));
    A.fillRRect(ctx, bx + 2, by + 2, 106 * frac, 14, 4, frac > 0.85 ? PAL.coinHi || PAL.amber : PAL.amber);
    A.strokeRRect(ctx, bx, by, 110, 18, 5, PAL.ink, 3);
    if (frac > 0.85) for (let i = 0; i < 3; i++) A.icon(ctx, 'wisp', ix + 330 + i * 20, iy + 54 - Math.abs(Math.sin(t * 3 + i)) * 8, 16);
  }

  // ---- About ----
  Help.tapAbout = function (S, x, y) {
    layoutAbout();
    const y0 = AB.y0;
    if (hit(x, y, 270, y0 + 214, 300, 50)) { openUrl(URLS.privacy); pip(); return true; }
    if (hit(x, y, 270, y0 + 272, 300, 50)) { openUrl(URLS.terms); pip(); return true; }
    if (hit(x, y, 270, y0 + AB.h - 44, 200, 56) || x < AB.x0 || x > AB.x1 || y < AB.y0 || y > AB.y1) { G.Cards.close(S); return true; }
    return true;
  };
  Help.drawAbout = function (ctx, S, k) {
    const A = G.Art.S, Ch = G.Art.Ch, y0 = (layoutAbout(), AB.y0), p = Ch.resetPose(Ch.POSE);
    A.fillRRect(ctx, AB.x0, y0 + 6, AB.x1 - AB.x0, AB.h, 24, PAL.rgba(PAL.ink, 0.3)); A.fillRRect(ctx, AB.x0, y0, AB.x1 - AB.x0, AB.h, 24, PAL.cream);
    p.x = AB.x0 + 56; p.y = y0 + 92; p.face = 1; p.t = S.t; p.pose = 'wave'; p.poseT = (Help.t += 1 / 60) % 1; Ch.kit(ctx, p, S);
    A.text(ctx, 'Capy Springs', 290, y0 + 44, 30, PAL.cta);
    A.text(ctx, 'Version ' + G.VERSION, 290, y0 + 76, 15, PAL.stoneDark);
    A.text(ctx, 'Made by ' + (G.C.CREDITS_BY || 'Asmit Deshwal'), 290, y0 + 110, 17, PAL.ink);
    A.text(ctx, 'Every picture is drawn and every sound is made in code.', 270, y0 + 152, 13, PAL.stoneDark, BODY);
    A.text(ctx, G.Native.is() ? 'No purchases, no account. Optional videos give bonuses.' : 'No ads, no purchases, no account. Your inn stays on your phone.', 270, y0 + 172, 13, PAL.stoneDark, BODY);
    A.fillRRect(ctx, 120, y0 + 189, 300, 50, 16, PAL.rgba(PAL.cta, 0.12)); A.text(ctx, 'Privacy policy', 270, y0 + 215, 18, PAL.cta);
    A.fillRRect(ctx, 120, y0 + 247, 300, 50, 16, PAL.rgba(PAL.cta, 0.12)); A.text(ctx, 'Terms of use', 270, y0 + 273, 18, PAL.cta);
    A.text(ctx, 'Native apps built with Capacitor (MIT licence)', 270, y0 + 318, 12, PAL.stoneDark);
    A.fillRRect(ctx, 170, y0 + AB.h - 72, 200, 56, 28, PAL.cta); A.text(ctx, 'CLOSE', 270, y0 + AB.h - 43, 22, PAL.cream);
  };
  const LEFT = { align: 'left', maxW: 380 }, BODY = { maxW: 410 };
})(window.G);
