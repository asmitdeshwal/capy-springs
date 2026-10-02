// Capy Springs - HUD: coin pill + flights, trail pips, heat kettle, ribbon, gear, banner, level pill, chevron, joystick, drag hint, debug (ARCHITECTURE.md 13, GDD 10.2).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL, DATA = G.DATA;
  const HUD = G.HUD = { R: {}, fly: null, S: null };
  const BANNER = { text: '', t: 0, sub: null };
  let kettleCapT = 0, lineCapT = 0;
  // an event's one-line explanation, shown under its banner the FIRST time only (persisted in S.tutorial)
  function explain(S, key, sub) { if (S.tutorial[key] > 0) return null; S.tutorial[key] = 1; return sub; }
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const PILL = { id: null, x: 0, y: 0, text: '', bounce: 0 };
  const evLand = { value: 0 }, evNone = {};
  const P = { x: 0, y: 0 };
  const worldPill = { draw: null }, worldChev = { draw: null };
  let inFlight = 0, pipPulse = 0, clinkT = 0, rushBannerShown = false;

  function flyItem() { return { x0: 0, y0: 0, t: 0, value: 0, delay: 0 }; }
  HUD.layout = function () {
    const st = G.Canvas.st || 0, H = G.Canvas.H, R = HUD.R;
    R.coinPill = { x: 16, y: st + 14, w: 170, h: 48 }; R.coinIcon = { x: 40, y: st + 38 }; R.coinText = { x: 64, y: st + 39 };
    R.pips = { x: 22, y: st + 74 };
    R.kettle = { x: 506, y: st + 29 }; R.kettleBar = { x: 424, y: st + 52, w: 100, h: 18 }; R.ribbon = { x: 414, y: st + 78, w: 110, h: 22 };
    R.gear = { x: 476, y: st + 108, w: 48, h: 48 }; R.gearHit = { x0: 470, y0: st + 102, x1: 530, y1: st + 162 };
    R.banner = { x: 270, y: 0.22 * H, w: 320, h: 56 };
    R.dragHint = { x: 270, y: 0.78 * H };
  };
  HUD.init = function (S) {
    HUD.S = S; inFlight = 0; pipPulse = 0; rushBannerShown = false; BANNER.t = 0;
    if (!HUD.fly) HUD.fly = U.pool(C.HUD_FLY_POOL, flyItem);
    HUD.fly.clear();
    HUD.layout();
    worldPill.draw = drawPill; worldChev.draw = drawChevron;
    if (HUD.subscribed) return;
    HUD.subscribed = true;
    const Bus = G.Bus;
    Bus.on('coins:collect', e => { G.Camera.toScreen(e.wx, e.wy, P); HUD.flight(P.x, P.y, e.value, 0); });
    Bus.on('trail:join', () => { pipPulse = 0.3; });
    const T = G.Seasons.text;
    Bus.on('car:arrive', e => { if (e.golden && !e.empty) HUD.banner(HUD.S, e.troupe ? "MOMO'S TROUPE!" : e.lift ? 'GOLDEN LIFT!' : T('golden', 'GOLDEN CAR!'), explain(HUD.S, 'X_GOLDEN', 'twice the guests, x1.5 pay: seat them all')); else if (e.troupe && !e.empty && !HUD.S.tutorial.X_TROUPE) { HUD.S.tutorial.X_TROUPE = 1; HUD.banner(HUD.S, 'SNOW MONKEYS!', 'they hop down every 20 s: lead them to the Source'); } });
    Bus.on('vip:arrive', e => { if (!e.troupe) HUD.banner(HUD.S, 'MOMO THE VIP!', explain(HUD.S, 'X_VIP', 'he pays x10 wherever he soaks')); });
    Bus.on('goal:new', () => HUD.banner(HUD.S, 'NEW GUESTBOOK GOALS')); Bus.on('goal:done', e => HUD.banner(HUD.S, 'GOAL DONE  +' + e.reward)); Bus.on('goal:all', () => HUD.banner(HUD.S, 'ALL GOALS DONE!')); Bus.on('goal:card', () => HUD.banner(HUD.S, 'STAMP CARD FULL!', 'the next car is golden'));
    Bus.on('fullcar', e => HUD.banner(HUD.S, e.carId >= 200000 ? 'FULL TROUPE!' : T('fullcar', 'FULL CAR!'), explain(HUD.S, 'X_FULLCAR', 'a whole car seated: +2 koban per guest')));
    Bus.on('famous', () => HUD.banner(HUD.S, T('famous', 'FAMOUS INN!'), '+25% pay on everything'));
    Bus.on('fame', e => HUD.banner(HUD.S, T('fame', 'INN FAME ' + (ROMAN[e.level] || '')), '+5% pay on everything'));
    Bus.on('night:start', () => HUD.banner(HUD.S, T('night', 'LANTERN NIGHT'), explain(HUD.S, 'X_NIGHT', 'cars every 12 s and everyone pays x1.2')));
    Bus.on('heat:rush:start', e => { if (e.chain === 0 && !rushBannerShown) { rushBannerShown = true; HUD.banner(HUD.S, T('rush', 'STEAM RUSH'), explain(HUD.S, 'X_RUSH', 'hot baths soak twice as fast at x1.5 pay. Keep stoking!')); } });
    Bus.on('season:unlock', e => HUD.banner(HUD.S, 'SEASON ' + e.id + ' OPEN!'));
    Bus.on('ridge:open', () => HUD.banner(HUD.S, 'THE RIDGE OPENS!', 'walk up the bridge: the lift brings guests there'));
    Bus.on('summit:open', () => HUD.banner(HUD.S, 'THE SUMMIT OPENS!', 'climb the stairs above the clouds'));
    Bus.on('festival:start', () => HUD.banner(HUD.S, 'FESTIVAL NIGHT', 'x1.5 pay for 90 s: beat your best!'));
    Bus.on('geyser', e => { if (e.first) HUD.banner(HUD.S, 'THE GEYSER!', 'guests who land while it blows pay x2'); });
    Bus.on('snow:start', () => HUD.banner(HUD.S, 'SNOW SQUALL', explain(HUD.S, 'X_SNOW', 'drifts slow everyone: walk through them to clear')));
    Bus.on('heat:cold', () => { if (!HUD.S.tutorial.X_COLD) { HUD.S.tutorial.X_COLD = 1; HUD.banner(HUD.S, 'THE BOILER IS COLD', 'carry logs from the woodpile to the boiler'); } });
  };
  HUD.flight = function (x0, y0, value, delay) { const f = HUD.fly.alloc(); if (!f) { HUD.S.ui.coinBounce = 1; return; } f.x0 = x0; f.y0 = y0; f.t = 0; f.value = value; f.delay = delay || 0; inFlight += value; };
  HUD.offlineRain = function (S, value) { const n = Math.min(20, Math.max(1, value)); for (let i = 0; i < n; i++) HUD.flight(270 + (U.hash(i, 1) - 0.5) * 300, G.Canvas.H * 0.5 + (U.hash(i, 2) - 0.5) * 200, i === n - 1 ? value - Math.floor(value / n) * (n - 1) : Math.floor(value / n), i * 0.04); };
  HUD.banner = function (S, text, sub) { BANNER.text = text; BANNER.sub = sub || null; BANNER.t = 0; S.ui.banner = BANNER; };
  HUD.tapGear = function (S, x, y) { const r = HUD.R.gearHit; if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) return false; G.Cards.toggleSettings(S); return true; };
  HUD.farTap = function (S, id) { PILL.bounce = 1; if (!S.ui.arrowFlash) S.ui.arrowFlash = { id, t: C.ARROW_FLASH_T }; else { S.ui.arrowFlash.id = id; S.ui.arrowFlash.t = C.ARROW_FLASH_T; } G.Bus.emit('ui:pip', evNone); };
  HUD.levelPillFor = function (S) {
    const kit = S.kit; let best = null, bd = C.PILL_DIST * C.PILL_DIST;
    for (let i = 0; i < DATA.SHEET_STATIONS.length; i++) { const id = DATA.SHEET_STATIONS[i]; if (!S.built[id]) continue; G.Hints.stationPoint(S, id, P); const d = U.dist2(kit.x, kit.y, P.x, P.y); if (d < bd) { bd = d; best = id; } }
    if (!best) return null;
    G.Hints.stationPoint(S, best, P);
    const lv = S.levels[best]; PILL.id = best; PILL.x = P.x; PILL.y = (S.baths[best] ? S.baths[best].def.deck.y - S.baths[best].def.deck.h / 2 : P.y - 90) - 20;
    const cheap = G.Upgrades.cheapestAffordable(S);
    const tapGate = !(S.ui.arrow && S.ui.arrow.showWord) && G.Seasons.firstLit(S) && cheap && cheap.id === best && S.tutorial.TAP < 2;
    const sum = lv.speed + lv.slots + lv.pay;
    if (!tapGate && sum === 0) return null;                 // nothing bought yet: no "Lv 0" badge
    PILL.text = tapGate ? 'TAP' : 'Lv ' + sum;
    return PILL;
  };

  HUD.update = function (S, dt) {
    const ui = S.ui;
    // flights
    const fp = HUD.fly;
    for (let i = fp.n - 1; i >= 0; i--) {
      const f = fp.items[i];
      if (f.delay > 0) { f.delay -= dt; continue; }
      f.t += dt / C.COIN_TO_HUD_T;
      if (f.t >= 1) { inFlight -= f.value; ui.coinBounce = 1; evLand.value = f.value; G.Bus.emit('hud:coin-land', evLand); fp.free(i); }
    }
    if (inFlight < 0) inFlight = 0;
    const target = Math.max(0, S.coins - inFlight);
    ui.coinShown += (target - ui.coinShown) * Math.min(1, dt / C.COIN_ROLL_T * 3);
    if (Math.abs(target - ui.coinShown) < 0.6) ui.coinShown = target;
    if (ui.coinBounce > 0) ui.coinBounce = Math.max(0, ui.coinBounce - dt / C.COIN_BOUNCE_T);
    if (pipPulse > 0) pipPulse -= dt;
    if (ui.kettleSlide > 0) ui.kettleSlide = Math.max(0, ui.kettleSlide - dt / 0.4);
    ui.ribbon += ((S.heat.rush ? 1 : 0) - ui.ribbon) * Math.min(1, dt * 8);
    if (ui.banner) { BANNER.t += dt; if (BANNER.t >= C.BANNER_T + (BANNER.sub ? 1.2 : 0)) ui.banner = null; }
    // one-time captions: the boiler gauge when it slides in, "in line" by the pips on the first pickup
    if (ui.kettleSlide > 0 && !S.tutorial.X_GAUGE) { S.tutorial.X_GAUGE = 1; kettleCapT = 6; }
    if (kettleCapT > 0) kettleCapT -= dt;
    if (pipPulse > 0 && !S.tutorial.X_LINE) { S.tutorial.X_LINE = 1; lineCapT = 4; }
    if (lineCapT > 0) lineCapT -= dt;
    for (const id in ui.squash) if (ui.squash[id] > 0) ui.squash[id] = Math.max(0, ui.squash[id] - dt * 4);
    if (PILL.bounce > 0) PILL.bounce = Math.max(0, PILL.bounce - dt * 3);
    // level pill + TAP gate
    const pill = HUD.levelPillFor(S);
    ui.pill = pill;
    if (pill && pill.text === 'TAP' && !ui.banner) { ui.pillT += dt; if (ui.pillT >= C.PILL_MIN_SHOW) { ui.pillT = -1e9; S.tutorial.TAP++; } } else if (ui.pillT < 0 && !(pill && pill.text === 'TAP')) ui.pillT = 0;
    const cheap = G.Upgrades.cheapestAffordable(S); ui.chevron = cheap ? cheap.id : null;
    // drag hint
    const In = G.Input;
    if (S.mode === 'play' && S.tutorial.DRAG === 0 && In.lastStickT >= 0) S.tutorial.DRAG = 1;   // only a real drag in play counts (not fiddling on the title)
    ui.dragHint = S.tutorial.DRAG === 0 && S.t >= C.CAR_FIRST_HOP_AT + C.DRAG_HINT_AFTER && In.lastStickT < 0 && S.mode === 'play';   // until the first drag, however long that takes
  };

  HUD.collectWorld = function (S, list) {
    if (S.ui.banner) return;
    if (S.ui.pill) list.push(worldPill);
    if (S.ui.chevron && S.ui.chevron !== (S.ui.sheet && S.ui.sheet.id)) list.push(worldChev);
  };
  function drawPill(ctx, o, S) { const p = S.ui.pill; if (!p) return; const b = 1 + 0.25 * Math.sin(PILL.bounce * Math.PI) * PILL.bounce; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(b, b); G.Art.S.pill(ctx, 0, 0, 68, 28, p.text === 'TAP' ? G.Seasons.word('TAP') : p.text, 18, PAL.cream, p.text === 'TAP' ? PAL.cta : PAL.ink, null); ctx.restore(); }
  function drawChevron(ctx, o, S) { const id = S.ui.chevron; if (!id) return; G.Hints.stationPoint(S, id, P); const y = (S.baths[id] ? S.baths[id].def.deck.y - S.baths[id].def.deck.h / 2 : P.y - 90) - 50 + Math.abs(Math.sin(S.t * Math.PI * 2)) * -6; G.Art.S.icon(ctx, 'chevron', P.x, y, 28); }

  HUD.draw = function (ctx, S) {
    const A = G.Art.S, R = HUD.R, ui = S.ui, H = G.Canvas.H;
    // coin pill
    const cp = R.coinPill, sc = 1 + 0.25 * ui.coinBounce;
    ctx.save(); ctx.translate(cp.x + 24, cp.y + 24); ctx.scale(sc, sc); ctx.translate(-(cp.x + 24), -(cp.y + 24));
    A.fillRRect(ctx, cp.x, cp.y, cp.w, cp.h, 24, PAL.rgba(PAL.cream, 0.85));
    A.icon(ctx, 'koban', R.coinIcon.x, R.coinIcon.y, 30);
    A.text(ctx, A.fmtCoins(ui.coinShown), R.coinText.x, R.coinText.y, 30, PAL.ink, LEFT);
    ctx.restore();
    // trail pips
    const pulse = S.trail.length >= S.trailCap ? 1 + 0.08 * Math.sin(S.t * 8) : 1;
    for (let i = 0; i < S.trailCap; i++) A.circle(ctx, R.pips.x + i * 15, R.pips.y, 6 * (i < S.trail.length ? pulse : 1), i < S.trail.length ? PAL.amber : PAL.rgba(PAL.ink, 0.3));
    if (lineCapT > 0) A.text(ctx, 'guests in line', R.pips.x + S.trailCap * 15 + 6, R.pips.y + 1, 13, PAL.cream, CAPTION);
    if (S.night.active && S.night.festival) A.pill(ctx, R.coinPill.x + 85, R.pips.y + 30, 170, 28, 'FESTIVAL +' + A.fmtCoins(S.earned - S.festival.start), 14, PAL.rgba(PAL.cta, 0.92), PAL.cream, null);
    // flights
    const fp = HUD.fly;
    for (let i = 0; i < fp.n; i++) { const f = fp.items[i]; if (f.delay > 0) continue; const u = U.easeInOutQuad(Math.min(1, f.t)); G.Art.FX.kobanAt(ctx, f.x0 + (R.coinIcon.x - f.x0) * u, f.y0 + (R.coinIcon.y - f.y0) * u - Math.sin(u * Math.PI) * 30, 1); }
    // kettle
    if (S.built.boiler) {
      const off = -120 * U.easeInQuad(ui.kettleSlide), h = S.heat, frac = U.clamp(h.v / h.max, 0, 1), kb = R.kettleBar;
      ctx.save(); ctx.translate(off, 0);
      A.icon(ctx, G.Seasons.text('gaugeIcon', 'kettle'), R.kettle.x, R.kettle.y, 34);
      A.fillRRect(ctx, kb.x, kb.y, kb.w, kb.h, 5, PAL.rgba(PAL.cream, 0.85));
      if (h.cold) { ctx.fillStyle = PAL.rgba(PAL.waterCold, 0.5 + 0.5 * Math.abs(Math.sin(S.t * Math.PI * 2))); ctx.fillRect(kb.x + kb.w * frac, kb.y, kb.w * (1 - frac), kb.h); for (let x = kb.x + kb.w * frac + 4; x < kb.x + kb.w; x += 8) A.line(ctx, x, kb.y + 2, x - 4, kb.y + kb.h - 2, PAL.cream, 1.5); }
      A.fillRRect(ctx, kb.x + 2, kb.y + 2, Math.max(0, (kb.w - 4) * frac), kb.h - 4, 4, frac >= C.HEAT_RUSH / h.max ? PAL.mix(PAL.amber, PAL.coinHi, 0.5 + 0.5 * Math.sin(S.t * 10)) : PAL.amber);
      A.strokeRRect(ctx, kb.x, kb.y, kb.w, kb.h, 5, PAL.ink, 3);
      A.icon(ctx, G.Seasons.text('coldIcon', 'snow'), kb.x + kb.w * C.HEAT_COLD / h.max, kb.y - 8, 10); A.icon(ctx, 'wisp', kb.x + kb.w * C.HEAT_RUSH / h.max, kb.y - 9, 12);
      if (frac >= C.HEAT_RUSH / h.max) for (let i = 0; i < 3; i++) A.icon(ctx, 'wisp', kb.x + kb.w * (0.75 + i * 0.1), kb.y - 14 - Math.abs(Math.sin(S.t * 3 + i)) * 6, 12);
      if (ui.ribbon > 0.02) { const rb = R.ribbon, rt = G.Seasons.text('rush', 'STEAM RUSH'); ctx.globalAlpha = ui.ribbon; A.fillRRect(ctx, rb.x + (1 - ui.ribbon) * 140, rb.y, rb.w, rb.h, 6, PAL.cta); A.text(ctx, h.chain > 0 ? rt + ' x' + (h.chain + 1) : rt, rb.x + rb.w / 2 + (1 - ui.ribbon) * 140, rb.y + rb.h / 2 + 1, 13, PAL.cream); ctx.globalAlpha = 1; }
      else if (kettleCapT > 0 && ui.kettleSlide <= 0) { const rb = R.ribbon; A.fillRRect(ctx, rb.x - 150, rb.y, rb.w + 150, rb.h + 4, 6, PAL.rgba(PAL.cream, 0.92)); A.text(ctx, 'Boiler heat: logs keep the baths hot', rb.x + rb.w / 2 - 75, rb.y + rb.h / 2 + 3, 13, PAL.ink); }
      ctx.restore();
    }
    // gear
    A.fillRRect(ctx, R.gear.x, R.gear.y, R.gear.w, R.gear.h, 14, PAL.rgba(PAL.ink, 0.35)); A.icon(ctx, 'gear', R.gear.x + 24, R.gear.y + 24, 30);
    // banner
    if (ui.banner) {
      const b = R.banner, t = BANNER.t, total = C.BANNER_T + (BANNER.sub ? 1.2 : 0), k = t < 0.3 ? 1 - U.easeOutQuad(t / 0.3) : t > total - 0.3 ? U.easeInQuad((t - (total - 0.3)) / 0.3) : 0;
      const x = b.x + k * 600, sub = BANNER.sub, w = sub ? 420 : b.w, h = sub ? 78 : b.h;
      A.fillRRect(ctx, x - w / 2, b.y - b.h / 2 + 3, w, h, 28, PAL.rgba(PAL.ink, 0.25));
      A.fillRRect(ctx, x - w / 2, b.y - b.h / 2, w, h, 28, PAL.cream);
      A.text(ctx, BANNER.text, x, b.y + 1, 28, PAL.cta);
      if (sub) A.text(ctx, sub, x, b.y + 30, 13, PAL.stoneDark);
    }
    // a browser tab turned sideways: the game is a tiny column; say so
    if (G.Canvas.cssW > G.Canvas.cssH && G.Canvas.cssW < 900) A.pill(ctx, 270, 0.5 * H, 300, 44, 'Turn your phone upright', 18, PAL.cream, PAL.ink, null);
  };
  const LEFT = { align: 'left' }, CAPTION = { align: 'left', stroke: PAL.rgba(PAL.ink, 0.6), lw: 3 };
  HUD.drawJoystick = function (ctx, S) {
    const A = G.Art.S, st = G.Input.stick, R = HUD.R;
    if (st.alpha > 0.01) {
      ctx.globalAlpha = st.alpha;
      A.circle(ctx, st.ox, st.oy, C.JOY_R, PAL.rgba(PAL.cream, 0.12)); ctx.strokeStyle = PAL.rgba(PAL.cream, 0.7); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(st.ox, st.oy, C.JOY_R, 0, Math.PI * 2); ctx.stroke();
      A.circle(ctx, st.kx, st.ky, C.JOY_KNOB, PAL.rgba(PAL.cream, 0.55));
      ctx.globalAlpha = 1;
    }
    if (S.ui.dragHint && S.ui.arrow) {
      const a = S.ui.arrow, k = (S.t % C.DRAG_HINT_LOOP) / C.DRAG_HINT_LOOP, dx = a.x - S.kit.x, dy = a.y - S.kit.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      G.Art.FX.dragHint(ctx, R.dragHint.x, R.dragHint.y, dx / d * 60 * U.easeOutQuad(k), dy / d * 60 * U.easeOutQuad(k), k < 0.7 ? 1 : (1 - k) / 0.3);
      if (!S.ui.banner) A.text(ctx, G.Seasons.word('DRAG'), R.dragHint.x, R.dragHint.y + 70, 34, PAL.cta, WORD);
    }
  };
  HUD.drawDebug = function (ctx, S) {
    const A = G.Art.S, L = G.Loop, lines = [
      'fps ' + L.fps.toFixed(0) + '  frame ' + L.frameMs.toFixed(1) + 'ms  step ' + L.stepMs.toFixed(2) + 'ms',
      'guests ' + S.guests.length + '  koban ' + S.coinPool.n + '  draw ' + G.Render.list.length + '  steam ' + S.fx.steam.n + '  parts ' + S.fx.parts.n,
      'heat ' + S.heat.v.toFixed(0) + '/' + S.heat.max + (S.heat.rush ? ' RUSH' : '') + '  mode ' + S.mode + '  car ' + S.car.phase + ' ' + S.car.timer.toFixed(1),
      't ' + S.t.toFixed(0) + '  coins ' + S.coins + '  earned ' + S.earned + '  rate/min ' + (G.Save.rate(S.income) * 60).toFixed(0) + '  rule ' + (S.ui.arrow ? S.ui.arrow.rule : '-')
    ];
    const bad = L.frameMs > C.FRAME_MS_BUDGET || L.stepMs > C.STEP_MS_BUDGET || G.Render.list.length > C.MAX_DRAWABLES;
    const y0 = G.Canvas.H - (G.Canvas.sb || 0) - 74;
    ctx.fillStyle = PAL.rgba(PAL.ink, 0.6); ctx.fillRect(0, y0, 400, 70);
    for (let i = 0; i < lines.length; i++) A.text(ctx, lines[i], 8, y0 + 12 + i * 15, 11, bad ? PAL.cta : PAL.cream, DBG);
  };
  const DBG = { align: 'left', weight: 400 }, WORD = { stroke: PAL.cream, lw: 4 };
})(window.G);
