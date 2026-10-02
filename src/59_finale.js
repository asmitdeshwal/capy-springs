// Capy Springs - the ending (GDD 20.5): Wake the Source. A ~75 s scene: the ice cracks, the Source bursts, a wave of steam runs down the whole
// mountain, everyone the inn ever knew gathers at the pool and jumps in, Grandma's letter, the credits (real numbers), then the Golden Age.
// The sim is paused (mode 'finale'); the cast are actors with keyframes drawn through the sorted pass, never guests. Tap to skip ahead;
// Settings can replay it (a replay changes nothing). The harness takes the instant path: the Golden Age starts with no scene.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL, DATA = G.DATA, MAP = DATA.MAP, SU = MAP.SUMMIT;
  const Finale = G.Finale = { active: false, t: 0, crack: 0, replay: false };
  const T = { crack: 0.5, burst: 2.5, wave0: 4, wave1: 22, back: 28, gather: 28, gifts: 40, plop: 42, sit: 46, letter: 48, credits: 54, end: 74 };
  const EV = {}, WAVE = [], CAST = [];
  let credits = null, chimeT = 0, popDone = false, splashN = 0;
  const ease = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

  Finale.pending = S => !!(S.lanterns.wake && S.lanterns.wake.level >= 1 && !S.ending.seen);
  // lantern effect 'wake' (40_lanterns.js): level 1 is the ending, every level after it a Source Star
  Finale.wake = function (S, level, opts) {
    if (level >= 1) S.built.awake = true;
    if (opts && opts.silent) return;
    if (level === 1) Finale.start(S, null); else if (G.Golden) G.Golden.star(S, level);
  };
  function finish(S) { S.ending.seen = true; S.stats.finales++; G.Bus.emit('finale:done', EV); if (G.Golden) G.Golden.afterEnding(S); }
  Finale.start = function (S, opts) {
    const replay = !!(opts && opts.replay), resume = !!(opts && opts.resume);
    if (G.Game.headless) { if (!replay) finish(S); return; }
    Finale.active = true; Finale.replay = replay; Finale.t = resume ? T.gather - 1 : 0; Finale.crack = resume ? 1 : 0;
    S.ui.sheet = null; S.ui.settings = false; S.ui.card = null; S.ui.banner = null;
    S.mode = 'finale'; popDone = resume; splashN = 0; credits = null; chimeT = 0;
    const src = S.baths.source; if (src && resume) { src.burstT = 999; src.yuzuT = 999; }
    buildWave(S); buildCast(S);
    if (G.Render.markStaticDirty) G.Render.markStaticDirty();                 // the waterfall thaws, the hut door glows
    G.Bus.emit('finale:start', EV);
  };
  Finale.end = function (S) {
    Finale.active = false; Finale.crack = 0;
    const src = S.baths.source; if (src) { src.burstT = 0; src.yuzuT = 0; src.geyserT = src.def.geyser.every; }
    S.kit.x = 268; S.kit.y = SU.hut.seat.y + 24; S.kit.vx = S.kit.vy = 0; S.kit.moving = false;
    if (!S.night.active) S.night.fade = Math.min(S.night.fade, 1);
    S.mode = 'play'; G.Game.syncMode(S); G.Camera.init(S);
    if (!Finale.replay) { finish(S); G.HUD.banner(S, 'THE GOLDEN AGE', 'a festival tonight, and every season after it'); }
    G.Save.write(S);
  };

  // ---- the wave: every bath, lantern and the boiler wakes as the camera passes it on the way down ----
  function buildWave(S) {
    WAVE.length = 0;
    for (let i = 0; i < DATA.BATHS.length; i++) { const d = DATA.BATHS[i]; if (S.built[d.id]) WAVE.push({ y: d.deck.y, x: d.deck.x, kind: 'bath', id: d.id, done: false }); }
    for (let i = 0; i < DATA.LANTERNS.length; i++) { const d = DATA.LANTERNS[i]; if (S.lanterns[d.id].level >= 1) WAVE.push({ y: d.y - C.POST_BACK, x: d.x, kind: 'lantern', id: d.id, done: false }); }
    if (S.built.boiler) { const b = DATA.STATIONS.boiler; WAVE.push({ y: b.y, x: b.x, kind: 'boiler', id: 'boiler', done: false }); }
    WAVE.sort((a, b) => a.y - b.y);
  }
  function fire(S, w, i) {
    const FX = G.FX, pitch = 1 + i / Math.max(1, WAVE.length);
    if (w.kind === 'bath') {
      const d = DATA.BATHS.find(b => b.id === w.id), wa = d.water;
      for (let k = 0; k < 8; k++) FX.steam(S, wa.x + (Math.random() - 0.5) * wa.w * 0.8, wa.y + (Math.random() - 0.5) * wa.h * 0.5, 12 + Math.random() * 10, 0.55);
      FX.ring(S, wa.x, wa.y, 110); FX.sparkle(S, wa.x, wa.y - 24, 5); G.Audio.play('chime', pitch, 0.5);
    } else if (w.kind === 'lantern') { const f = S.lanternFx[w.id]; if (f) f.flash = 1; G.Audio.play('tick', pitch * 1.2, 0.6); FX.sparkle(S, w.x, w.y - 40, 2); }
    else { S.heat.v = S.heat.max; FX.puff(S, w.x, w.y - 40, 'puff'); G.Audio.play('stoke', 1, 0.6); }
  }

  // ---- the cast: keyframes [t, x, y, pose], 'hop' arcs into the next key; plop = jumps into the Source at that time ----
  function actor(who, keys, o) { const a = Object.assign({ who, keys, plopAt: 0, slot: null, carry: null, hat: false, face: 1, sortY: 0, draw: drawActor, landed: false, x: 0, y: 0, z: 0, pose: null, moving: false, vis: false, inWater: false, fly: 0 }, o || {}); return a; }
  function buildCast(S) {
    CAST.length = 0;
    const seat = SU.hut.seat, door = SU.hut.door, w = S.baths.source.def.water, kx = S.kit.x, ky = S.kit.y;
    const slots = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) slots.push({ x: w.x - w.w / 2 + 22 + c * (w.w - 44) / 5 + (r & 1) * 10, y: w.y - 22 + r * 22 });
    let si = 0; const slot = () => slots[(si++) % slots.length];
    CAST.push(actor('kit', [[0, kx, ky, 'pump'], [3, kx, ky], [T.gather + 4, kx, ky], [T.gather + 7, seat.x + 2, seat.y - 70, 'wave'], [T.sit, seat.x + 2, seat.y - 70], [T.sit + 0.01, seat.x, seat.y + 44, 'sit']], { face: 1 }));
    CAST.push(actor('grandma', [[T.gather + 2, door.x, door.y], [T.gather + 7, seat.x - 8, seat.y - 20, 'wave'], [T.sit, seat.x - 8, seat.y - 20], [T.sit + 0.01, seat.x, seat.y, 'sit']], { face: 1 }));
    CAST.push(actor('pon', [[T.gather, 270, -112], [T.gather + 6, 330, -790], [T.gifts, 330, -790]], { plopAt: T.plop + 0.35, slot: slot(), carry: 'log' }));
    for (let i = 0; i < 6; i++) CAST.push(actor('capy', [[T.gather + 0.6 + i * 0.5, 270, -112], [T.gather + 6.6 + i * 0.5, 372 + (i % 3) * 52, -790 - Math.floor(i / 3) * 22]], { plopAt: T.plop + 0.6 + i * 0.12, slot: slot() }));
    for (let i = 0; i < 3; i++) CAST.push(actor('duck', [[T.gather + 3.6 + i * 0.4, 270, -112], [T.gather + 8.6 + i * 0.4, 500 - i * 28, -760]], { plopAt: T.plop + 1.4 + i * 0.12, slot: slot() }));
    CAST.push(actor('kero', [[T.gather + 3, -40, -1000, null, 'hop'], [T.gather + 4.2, 90, -1000, null, 'hop'], [T.gather + 5.4, 200, -1000, null, 'hop'], [T.gather + 6.4, 262, -1000]], { plopAt: T.plop + 1.1, slot: slot(), carry: 'yuzu' }));
    CAST.push(actor('momo', [[T.gather + 2.4, 300, -1300, null, 'hop'], [T.gather + 3.2, 300, -1180, null, 'hop'], [T.gather + 4.8, 360, -1020]], { plopAt: T.plop, slot: { x: w.x, y: w.y - 8 } }));
    for (let i = 0; i < 4; i++) CAST.push(actor('monkey', [[T.gather + 2.8 + i * 0.35, 220 + i * 40, -1300, null, 'hop'], [T.gather + 3.6 + i * 0.35, 220 + i * 40, -1180, null, 'hop'], [T.gather + 5.2 + i * 0.35, 410 + i * 26, -1010]], { plopAt: T.plop + 0.2 + i * 0.12, slot: slot() }));
    CAST.push(actor('tsuru', [[T.gather + 4, 620, -1220, 'fly'], [T.gather + 8, 508, -1000, 'fly'], [T.gather + 8.01, 508, -1000]], { face: -1 }));
    CAST.push(actor('kaa', [[T.gather + 6, 620, -1150], [T.gather + 8.5, SU.hut.perch.x, SU.hut.perch.y]], {}));
  }
  function place(a, t) {
    const k = a.keys;
    if (t < k[0][0]) { a.vis = false; return; }
    a.vis = true; a.moving = false; a.z = 0; a.inWater = false; a.fly = 0;
    let i = 0; while (i < k.length - 1 && t >= k[i + 1][0]) i++;
    const cur = k[i];
    if (i < k.length - 1) {
      const nx = k[i + 1], u = (t - cur[0]) / Math.max(1e-6, nx[0] - cur[0]), hop = cur[4] === 'hop';
      a.x = U.lerp(cur[1], nx[1], hop ? u : ease(u)); a.y = U.lerp(cur[2], nx[2], hop ? u : ease(u));
      if (hop) a.z = Math.sin(u * Math.PI) * 40;
      a.moving = Math.abs(nx[1] - cur[1]) + Math.abs(nx[2] - cur[2]) > 1; if (Math.abs(nx[1] - cur[1]) > 1) a.face = nx[1] < cur[1] ? -1 : 1;
      if (a.who === 'kaa') a.fly = 1 - u;
    } else { a.x = cur[1]; a.y = cur[2]; }
    a.pose = cur[3] || null;
    if (a.plopAt && t >= a.plopAt) {                                              // into the Source: a hop from where they stood to a seat
      const u = U.clamp((t - a.plopAt) / 0.4, 0, 1), from = k[k.length - 1];
      a.x = U.lerp(from[1], a.slot.x, u); a.y = U.lerp(from[2], a.slot.y, u); a.z = Math.sin(u * Math.PI) * (a.who === 'momo' ? 80 : 44); a.moving = false; a.pose = null;
      if (u >= 1) a.inWater = true;
    }
    a.hat = t >= T.gifts + 0.5 && a.who !== 'kaa' && a.who !== 'tsuru';
    a.sortY = a.inWater ? a.slot.y + 30 : a.y + 0.2;
  }
  Finale.collect = function (S, list) { if (!Finale.active) return; for (let i = 0; i < CAST.length; i++) { const a = CAST[i]; if (a.vis) list.push(a); } };
  function drawActor(ctx, a, S) {
    const Ch = G.Art.Ch;
    if (a.who === 'kaa') { Ch.kaa(ctx, a.x, a.y, a.fly, S.t + Finale.t, 0); return; }
    const p = Ch.resetPose(Ch.POSE);
    p.x = a.x; p.y = a.y; p.z = a.z; p.face = a.face; p.t = Finale.t; p.moving = a.moving; p.walk = Finale.t * 8; p.pose = a.pose; p.poseT = (Finale.t * 0.9) % 1;
    p.hat = a.hat ? 'yuzu' : null; p.carry = Finale.t < T.gifts ? a.carry : null;
    if (a.inWater) { p.inWater = S.baths.source.def.water; p.sink = 4; p.lid = Finale.t > T.sit ? 2 : 0; }
    if (a.who === 'kit') Ch.kit(ctx, p, S);
    else if (a.who === 'grandma') { if (Ch.grandma) Ch.grandma(ctx, p); else Ch.kit(ctx, p, S); }
    else if (a.who === 'pon') Ch.pon(ctx, p); else if (a.who === 'kero') Ch.kero(ctx, p); else if (a.who === 'tsuru') Ch.tsuru(ctx, p);
    else if (a.who === 'momo') Ch.momo(ctx, p); else Ch.guest(ctx, p, a.who);
  }

  // ---- the clock ----
  function camAt(t) {
    const H = G.Canvas.H, home = U.clamp(SU.hut.seat.y - 0.5 * H, SU.camMinY, SU.y1 - H), bottom = MAP.H - H;
    if (t < T.wave0) return home;
    if (t < T.wave1) return U.lerp(home, bottom, ease((t - T.wave0) / (T.wave1 - T.wave0)));
    if (t < T.back) return U.lerp(bottom, home, ease((t - T.wave1) / (T.back - T.wave1)));
    return home;
  }
  Finale.update = function (S, dt) {
    if (!Finale.active) return;
    const t0 = Finale.t, t = (Finale.t += dt), at = x => t0 < x && t >= x, FX = G.FX, Au = G.Audio, Cam = G.Camera, src = S.baths.source;
    Cam.y = camAt(t); Cam.tickShake(dt);
    if (t0 === 0) { FX.flash(S, 0.35); Au.play('gong'); Au.play('chime'); }
    if (at(T.crack)) { Au.play('rumble'); Cam.shake(6, 2.0); }
    if (t >= T.crack && t < T.burst) Finale.crack = (t - T.crack) / (T.burst - T.crack);
    if (at(T.burst)) {
      Finale.crack = 1; if (src) { src.burstT = 999; src.yuzuT = 999; }
      const w = src.def.water; FX.confetti(S, w.x - 60, w.y - 40, C.CONFETTI_BIG); FX.confetti(S, w.x + 60, w.y - 40, C.CONFETTI_BIG); FX.flash(S, 0.35); Cam.shake(8, 0.5);
      FX.ring(S, w.x, w.y, 200); FX.droplets(S, w.x, w.y - 20, 30); Au.play('geyser'); Au.play('fanfare');
    }
    if (src && t > T.burst && Math.random() < dt * 14) { const w = src.def.water; FX.steam(S, w.x + (Math.random() - 0.5) * w.w, w.y - 10, 14 + Math.random() * 10, 0.5); }
    S.night.fade = Math.max(S.night.active ? S.night.fade : 0, U.clamp((t - T.wave0) / 2, 0, 1));       // the whole mountain glows (amber, see 45_render.js)
    if (t >= T.wave0 && t < T.back) { const cy = Cam.y + G.Canvas.H / 2; for (let i = 0; i < WAVE.length; i++) { const w = WAVE[i]; if (!w.done && cy >= w.y) { w.done = true; fire(S, w, i); } } }
    for (const k of [8, 14, 20]) if (at(k)) { FX.confetti(S, 140, Cam.y + 260, C.CONFETTI_BIG); FX.confetti(S, 400, Cam.y + 200, C.CONFETTI_BIG); Au.play('boom', 1, 0.5); }
    for (let i = 0; i < CAST.length; i++) { const a = CAST[i], was = a.inWater; place(a, t); if (a.inWater && !was) { splashN++; FX.droplets(S, a.slot.x, a.slot.y - 4, a.who === 'momo' ? 20 : 6); FX.ripple(S, a.slot.x, a.slot.y, true); Au.play('splash', 0.9 + Math.random() * 0.3, 0.6); } }
    if (at(T.gifts)) { const pon = CAST.find(a => a.who === 'pon'), kero = CAST.find(a => a.who === 'kero'); FX.puff(S, pon.x, pon.y - 30, 'puff'); Au.play('stoke'); FX.sparkle(S, kero.x, kero.y - 40, 6); Au.play('yuzu'); }
    if (!popDone && t >= T.plop + 2.2) { popDone = true; const w = src.def.water; FX.pop(S, 'SOURCE SPLASH x' + Math.max(splashN, 16) + '!!!', w.x, w.y - w.h / 2 - 40, 46, PAL.amber, 'label'); FX.confetti(S, w.x, w.y - 30, C.CONFETTI_BIG); FX.flash(S, 0.3); Cam.shake(8, 0.5); Au.play('fanfare'); }
    if (at(T.sit + 0.2)) Au.play('sigh');
    if (at(T.letter)) Au.play('puff');
    if (t >= T.credits && t < T.end) { chimeT -= dt; if (chimeT <= 0) { chimeT = 1.5; const n = [1, 1.26, 1.5, 2, 1.5, 1.26]; Au.play('chime', n[Math.floor(t / 1.5) % n.length], 0.35); } }
    if (t >= T.end && !Finale.endShown) { Finale.endShown = true; Au.play('fanfare'); Au.play('chime'); }
    if (t < T.end) Finale.endShown = false;
  };
  // taps skip ahead: the scene (after 6 s) -> the letter -> the credits -> the end card, whose button closes it
  Finale.tap = function (S, x, y) {
    const t = Finale.t, H = G.Canvas.H;
    if (t < 6) return;
    if (t < T.letter) { skipTo(S, T.letter); return; }
    if (t < T.credits) { Finale.t = T.credits; return; }
    if (t < T.end) { Finale.t = T.end; return; }
    if (t > T.end + 0.6 && Math.abs(x - 270) <= 170 && Math.abs(y - (H * 0.5 + 96)) <= 40) Finale.end(S);
  };
  function skipTo(S, tt) {
    const src = S.baths.source; Finale.crack = 1; if (src) { src.burstT = 999; src.yuzuT = 999; }
    for (let i = 0; i < WAVE.length; i++) WAVE[i].done = true;
    Finale.t = tt; popDone = true; for (let i = 0; i < CAST.length; i++) place(CAST[i], tt);
  }

  // ---- screen space: the waking banner, the letter, the credits, the end card ----
  Finale.drawScreen = function (ctx, S) {
    if (!Finale.active) return;
    const A = G.Art.S, H = G.Canvas.H, t = Finale.t, st = G.Canvas.st || 0;
    if (t >= T.burst && t < T.burst + 4) { const k = Math.min(1, (t - T.burst) / 0.3) * Math.min(1, (T.burst + 4 - t) / 0.4); ctx.globalAlpha = k; A.pill(ctx, 270, st + 0.2 * H, 380, 62, 'THE SOURCE WAKES', 30, PAL.cream, PAL.cta, null); ctx.globalAlpha = 1; }
    if (t >= T.letter && t < T.credits) {
      const k = Math.min(1, (t - T.letter) / 0.4) * Math.min(1, (T.credits - t) / 0.4), cy = H * 0.42;
      ctx.globalAlpha = k;
      A.fillRRect(ctx, 50, cy - 116, 440, 238, 20, PAL.rgba(PAL.ink, 0.3)); A.fillRRect(ctx, 50, cy - 120, 440, 238, 20, PAL.cream); A.fillRRect(ctx, 50, cy - 120, 10, 238, 5, PAL.red);
      const L = ['You did it, Kit.', 'The whole mountain is steaming,', 'I can see it from here.', "Come and sit. The water's perfect.", '— Grandma'];
      for (let i = 0; i < L.length; i++) A.text(ctx, L[i], i === 4 ? 440 : 84, cy - 78 + i * 40, i === 0 ? 24 : 19, i === 0 ? PAL.cta : PAL.ink, i === 4 ? RIGHT : LEFT);
      G.Art.Ch.kaa(ctx, 470, cy - 118, 0, t, 0);
      ctx.globalAlpha = 1;
    }
    if (t >= T.credits && t < T.end + 0.5) drawCredits(ctx, S, t - T.credits);
    if (t >= T.end) {
      const k = Math.min(1, (t - T.end) / 0.5), cy = H * 0.5;
      ctx.globalAlpha = k * 0.5; ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, 540, H); ctx.globalAlpha = k;
      A.fillRRect(ctx, 40, cy - 150, 460, 300, 26, PAL.cream);
      A.text(ctx, 'THE GOLDEN AGE', 270, cy - 92, 36, PAL.cta);
      A.text(ctx, 'The mountain is awake, Kit.', 270, cy - 36, 19, PAL.ink); A.text(ctx, 'Now the fun part.  — Grandma', 270, cy - 8, 19, PAL.ink);
      A.text(ctx, 'Light Source Stars to turn the seasons.', 270, cy + 30, 14, PAL.stoneDark);
      A.fillRRect(ctx, 100, cy + 64, 340, 64, 32, PAL.cta); A.text(ctx, 'BACK TO THE BATHS', 270, cy + 97, 22, PAL.cream);
      ctx.globalAlpha = 1;
    } else if (t > 6) A.text(ctx, 'tap to skip ahead', 270, H - (G.Canvas.sb || 0) - 22, 13, PAL.rgba(PAL.cream, 0.7));
  };
  function drawCredits(ctx, S, u) {
    const A = G.Art.S, H = G.Canvas.H;
    if (!credits) credits = buildCredits(S);
    ctx.globalAlpha = Math.min(1, u / 1) * 0.45; ctx.fillStyle = PAL.ink; ctx.fillRect(0, 0, 540, H); ctx.globalAlpha = 1;
    let y = H + 30 - u * 72;
    for (let i = 0; i < credits.length; i++) {
      const l = credits[i];
      if (l === '~') { y += 26; continue; }
      if (y > -40 && y < H + 40) {
        if (typeof l === 'string') A.text(ctx, l, 270, y, i === 0 ? 34 : 19, i === 0 ? PAL.amber : PAL.cream, OUT);
        else { A.text(ctx, l[0], 96, y, 17, PAL.rgba(PAL.cream, 0.8), LEFT_OUT); A.text(ctx, String(l[1]), 444, y, 18, PAL.cream, RIGHT_OUT); }
      }
      y += 34;
    }
  }
  function buildCredits(S) {
    const s = S.stats, f = n => Math.round(n).toLocaleString('en-US'), mins = Math.floor(S.t / 60), hm = Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
    return ['CAPY SPRINGS', '~', ['Innkeeper', 'Kit'], ['Stoker', 'Pon'], ['Yuzu picker', 'Kero'], ['Masseuse', 'Madame Tsuru'], ['VIP', 'Momo'], ['Messenger', 'Kaa'], ['Keeper of the Source', 'Grandma Yuzu'],
      ['The troupe', 'the snow monkeys'], ['The capybaras', 'soaked, sighed, paid'], ['The ducks', 'never once sat still'], '~',
      ['Capybaras served', f(Math.max(0, s.served - s.ducks - s.monkeys - s.vip))], ['Ducks', f(s.ducks)], ['Snow monkeys', f(s.monkeys)], ['Biggest splash', 'x' + s.bestSplash],
      ['Steam Rushes', f(s.rushes)], ['Lantern Nights', f(s.nights)], ['Hot-cold plunges', f(s.hotCold)], ['Massages', f(s.massages)], ['Snowdrifts cleared', f(s.cleared)],
      ['Koban earned', f(S.earned)], ['Time on the mountain', hm], '~',
      'Made by ' + (C.CREDITS_BY || 'Asmit Deshwal'), 'Every picture drawn and every', 'sound made in code', '~', "The water's still hot."];
  }
  const LEFT = { align: 'left', maxW: 380 }, RIGHT = { align: 'right' }, OUT = { stroke: PAL.rgba(PAL.ink, 0.6), lw: 4 },
        LEFT_OUT = { align: 'left', stroke: PAL.rgba(PAL.ink, 0.6), lw: 4 }, RIGHT_OUT = { align: 'right', stroke: PAL.rgba(PAL.ink, 0.6), lw: 4 };
})(window.G);
