// Capy Springs - the Guestbook: three daily goals drawn from what the game already counts, koban and a stamp per goal, a bonus for all three,
// and a stamp card that summons a Golden Car every five stamps (GDD 20, ARCHITECTURE.md 23). Goals roll with the real calendar day.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL;
  const Goals = G.Goals = { STAMP_CARD: 5, ALL_BONUS: 150 };
  const evDone = { goal: null, reward: 0 }, evNone = {};
  const RECT = { x0: 30, y0: 0, x1: 510, y1: 0 }, CHIP = { x0: 0, y0: 0, x1: 0, y1: 0 };
  let checkT = 0;

  // the pool: label, how to read the stat, the day's target, the koban, what must be built for it to be offered
  const POOL = [
    { id: 'served',    label: 'Serve guests', how: 'Seat guests in any bath',               get: s => s.served,       target: 30, reward: 60,  icon: 'kit' },
    { id: 'x3',        label: 'Land Splash x3 chains', how: '3 guests into baths within 2 seconds',      get: s => s.combos[3],    target: 6,  reward: 80,  icon: 'bath' },
    { id: 'x5',        label: 'Land Splash x5 chains', how: '5 guests into baths within 2 seconds',      get: s => s.combos[5],    target: 3,  reward: 120, icon: 'bath',    needs: S => S.trailCap >= 5 },
    { id: 'rush',      label: 'Start Steam Rushes', how: 'Stoke the boiler right to the top',         get: s => s.rushes,       target: 3,  reward: 90,  icon: 'flame',   needs: 'boiler' },
    { id: 'fullcar',   label: 'Seat whole cars', how: 'Seat every guest from one car',            get: s => s.fullCars,     target: 3,  reward: 90,  icon: 'bell',    needs: S => S.car.level >= 1 },
    { id: 'yuzu',      label: 'Make golden yuzu baths', how: 'Drop a yuzu into a bath',     get: s => s.yuzu,         target: 4,  reward: 90,  icon: 'yuzu',    needs: 'grove' },
    { id: 'mochi',     label: 'Sell mochi at the stall', how: 'Bring yuzu to the snack stall',    get: s => s.mochi,        target: 6,  reward: 90,  icon: 'mochi',   needs: 'stall' },
    { id: 'night',     label: 'Play a Lantern Night', how: 'Every few minutes the sky goes dark',       get: s => s.nights,       target: 1,  reward: 100, icon: 'lantern', needs: 'cedar' },
    { id: 'golden',    label: 'Welcome a Golden Car', how: 'Every 5th car is golden',       get: s => s.golden,       target: 1,  reward: 80,  icon: 'koban' },
    { id: 'hotcold',   label: 'Land hot-cold plunges', how: 'Sauna first, then the plunge within 8 s',      get: s => s.hotCold,      target: 3,  reward: 150, icon: 'snow',  needs: 'plunge' },
    { id: 'massage',   label: 'Massages by the gong', how: 'Guests on the mats when the gong rings',       get: s => s.massages,     target: 4,  reward: 150, icon: 'heart',   needs: 'pavilion' },
    { id: 'fullhouse', label: 'A full house for Tsuru', how: 'Every chair full when the gong rings',     get: s => s.fullHouses,   target: 1,  reward: 200, icon: 'heart',   needs: 'pavilion' },
    { id: 'clear',     label: 'Clear snowdrifts', how: 'Walk through drifts after a squall',           get: s => s.cleared,      target: 3,  reward: 100, icon: 'snow',    needs: 'ridge' },
    { id: 'momo',      label: 'Serve Momo the VIP', how: 'He rides the lift on Lantern Nights',         get: s => s.vip,          target: 1,  reward: 250, icon: 'momo',        needs: 'sauna' }
  ];
  const PAD = ['x3', 'served', 'golden', 'rush', 'fullcar', 'x5'];
  const BY_ID = {}; for (let i = 0; i < POOL.length; i++) BY_ID[POOL[i].id] = POOL[i];

  // the calendar day as a number (local time), and the key stored in the save
  function dayNumber() { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
  function snapshot(S, out) { for (let i = 0; i < POOL.length; i++) out[POOL[i].id] = POOL[i].get(S.stats); return out; }
  // pick today's three: one easy (serve / x3 by day parity) and two more from what is buildable today, in a day-seeded order
  function pick(S, day) {
    const ids = [day & 1 ? 'x3' : 'served'];
    const rest = [];
    for (let i = 0; i < POOL.length; i++) { const g = POOL[i]; if (ids.indexOf(g.id) >= 0 || g.id === 'served' || g.id === 'x3') continue; if (g.needs && !(typeof g.needs === 'function' ? g.needs(S) : S.built[g.needs])) continue; rest.push({ g, k: U.hash(day, i + 1) }); }
    rest.sort((a, b) => a.k - b.k);
    for (let i = 0; i < rest.length && ids.length < 3; i++) ids.push(rest[i].g.id);
    for (let i = 0; i < PAD.length && ids.length < 3; i++) if (ids.indexOf(PAD[i]) < 0) ids.push(PAD[i]);   // a brand-new inn: always three, never twice the same
    return ids;
  }
  Goals.rollIfNewDay = function (S) {
    const day = dayNumber(), gl = S.goals;
    const dup = gl.ids[0] === gl.ids[1] || gl.ids[1] === gl.ids[2] || gl.ids[0] === gl.ids[2];
    if (day <= gl.day && gl.ids.length === 3 && !dup) return false;       // a clock set back (a timezone hop) keeps today's goals
    const had = gl.ids.length === 3;
    gl.day = day; gl.ids = pick(S, day); gl.done = [false, false, false]; gl.allDone = false; snapshot(S, gl.base);
    if (had && S.t > 0) G.Bus.emit('goal:new', evNone);           // a new day during play: say so, rather than silently swapping the list
    return true;
  };
  Goals.init = function (S) { checkT = 0; Goals.rollIfNewDay(S); };
  Goals.progress = function (S, i) { const g = BY_ID[S.goals.ids[i]]; if (!g) return 0; return Math.max(0, Math.min(g.target, g.get(S.stats) - (S.goals.base[g.id] || 0))); };
  Goals.def = id => BY_ID[id];
  Goals.doneCount = function (S) { let n = 0; for (let i = 0; i < 3; i++) if (S.goals.done[i]) n++; return n; };

  Goals.update = function (S, dt) {
    checkT += dt; if (checkT < 0.5) return; checkT = 0;
    if (Goals.rollIfNewDay(S)) return;
    const gl = S.goals;
    for (let i = 0; i < 3; i++) {
      if (gl.done[i]) continue;
      const g = BY_ID[gl.ids[i]]; if (!g) continue;
      if (Goals.progress(S, i) >= g.target) {
        gl.done[i] = true; gl.stamps++;
        G.Coins.rain(S, g.reward, S.kit.x, S.kit.y, 'goal');
        evDone.goal = g; evDone.reward = g.reward; G.Bus.emit('goal:done', evDone);
        if (gl.stamps % Goals.STAMP_CARD === 0) { const e = C.GOLDEN_EVERY; S.car.index = Math.ceil((S.car.index + 1) / e) * e - 1; G.Bus.emit('goal:card', evNone); }
      }
    }
    if (!gl.allDone && gl.done[0] && gl.done[1] && gl.done[2]) { gl.allDone = true; gl.stamps++; G.Coins.rain(S, Goals.ALL_BONUS, S.kit.x, S.kit.y, 'goal'); G.Bus.emit('goal:all', evNone); }
  };

  // ---- the Guestbook card (Cards delegates kind 'goals' here) ----
  function layout() { const H = G.Canvas.H, st = G.Canvas.st || 0, h = 430; RECT.y0 = st + Math.max(40, (H - h) / 2); RECT.y1 = RECT.y0 + h; }
  Goals.tap = function (S, x, y) { layout(); G.Cards.close(S); return true; };
  Goals.draw = function (ctx, S, k) {
    const A = G.Art.S, gl = S.goals; layout();
    A.fillRRect(ctx, RECT.x0, RECT.y0 + 6, RECT.x1 - RECT.x0, RECT.y1 - RECT.y0, 22, PAL.rgba(PAL.ink, 0.3)); A.fillRRect(ctx, RECT.x0, RECT.y0, RECT.x1 - RECT.x0, RECT.y1 - RECT.y0, 22, PAL.cream);
    A.text(ctx, 'Guestbook', 270, RECT.y0 + 34, 28, PAL.ink);
    A.text(ctx, "Today's goals  ·  new ones every day", 270, RECT.y0 + 60, 13, PAL.stoneDark);
    for (let i = 0; i < 3; i++) {
      const g = BY_ID[gl.ids[i]], y = RECT.y0 + 84 + i * 84, done = gl.done[i]; if (!g) continue;
      A.fillRRect(ctx, 46, y, 448, 72, 16, done ? PAL.rgba(PAL.pine, 0.12) : '#FFFFFF');
      A.icon(ctx, g.icon, 76, y + 36, 32);
      A.text(ctx, g.label, 104, y + 18, 16, PAL.ink, LEFT);
      if (g.how) A.text(ctx, g.how, 104, y + 37, 13, PAL.stoneDark, HOW);
      const p = Goals.progress(S, i), frac = p / g.target;
      A.fillRRect(ctx, 104, y + 50, 220, 10, 5, PAL.rgba(PAL.ink, 0.12)); if (frac > 0) A.fillRRect(ctx, 104, y + 50, 220 * frac, 10, 5, done ? PAL.pine : PAL.amber);
      A.text(ctx, p + ' / ' + g.target, 334, y + 56, 13, PAL.stoneDark, LEFT);
      if (done) A.pill(ctx, 440, y + 36, 84, 34, 'STAMP', 14, PAL.rgba(PAL.pine, 0.2), PAL.pine, 'check');
      else A.pill(ctx, 440, y + 36, 84, 34, '+' + g.reward, 16, PAL.rgba(PAL.amber, 0.35), PAL.ink, 'koban');
    }
    const y = RECT.y0 + 348;
    A.text(ctx, gl.allDone ? 'All three done: +' + Goals.ALL_BONUS + ' and a stamp. Come back tomorrow!' : 'All three today: +' + Goals.ALL_BONUS + ' koban and a bonus stamp', 270, y, 13, PAL.stoneDark);
    // the stamp card: five circles toward the next Golden Car
    const filled = gl.stamps % Goals.STAMP_CARD;
    A.text(ctx, 'Stamp card', 150, y + 34, 15, PAL.ink, LEFT);
    for (let i = 0; i < Goals.STAMP_CARD; i++) { const cx = 250 + i * 34; A.circle(ctx, cx, y + 34, 12, i < filled ? PAL.cta : PAL.rgba(PAL.ink, 0.12)); if (i < filled) A.icon(ctx, 'check', cx, y + 34, 16); }
    A.text(ctx, gl.stamps + ' stamp' + (gl.stamps === 1 ? '' : 's') + ' so far  ·  a full card calls a Golden Car', 270, y + 62, 12, PAL.stoneDark);
  };
  // the chip under the gear: today's count; tap to open
  Goals.chipRect = function () { const st = G.Canvas.st || 0; CHIP.x0 = 456; CHIP.y0 = st + 168; CHIP.x1 = 530; CHIP.y1 = st + 196; return CHIP; };
  Goals.tapChip = function (S, x, y) { const r = Goals.chipRect(); if (x < r.x0 - 16 || x > 540 || y < r.y0 - 8 || y > r.y1 + 6) return false; G.Cards.showGoals(S); return true; };   // a thumb-sized hit box around the small pill
  Goals.drawChip = function (ctx, S) { const r = Goals.chipRect(), n = Goals.doneCount(S); G.Art.S.pill(ctx, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, r.x1 - r.x0, r.y1 - r.y0, n + '/3', 13, n === 3 ? PAL.rgba(PAL.pine, 0.85) : PAL.rgba(PAL.cream, 0.85), n === 3 ? PAL.cream : PAL.ink, 'check'); };
  const LEFT = { align: 'left' }, HOW = { align: 'left', maxW: 290 };
})(window.G);
