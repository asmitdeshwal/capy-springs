// Capy Springs - the Golden Age (GDD 20.6): what the mountain does after the story ends, forever. Source Stars (Wake the Source, levels 2+)
// turn the season and repaint the mountain (spring -> summer -> autumn -> winter -> spring); Festival Nights are Lantern Nights turned up
// (x1.5 pay, 90 s, fireworks) with a score to beat. Nothing ever resets.
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL;
  const Golden = G.Golden = { cur: 0, applied: false };
  const NAMES = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
  // the ground and foliage tokens each season paints with (W.terrain / W.pine / W.treeBody read them; UI greens never change)
  const PALS = [
    { ground: '#3F7D5A', groundDark: '#2C5A40', groundMoss: '#4E9A6C', foliage: '#3F7D5A', foliageDark: '#2C5A40' },
    { ground: '#2E7D4F', groundDark: '#1F5A38', groundMoss: '#58B36A', foliage: '#2E7D4F', foliageDark: '#1F5A38' },
    { ground: '#7E8A3E', groundDark: '#5E6A2C', groundMoss: '#A39A48', foliage: '#C9622F', foliageDark: '#8F3A1F' },
    { ground: '#DCE4E8', groundDark: '#B8C6CE', groundMoss: '#EEF3F5', foliage: '#3F7D5A', foliageDark: '#2C5A40' }
  ];
  const evEnd = { score: 0, best: 0, newBest: false }, evNone = {};
  let fireT = 0, boomT = 0;

  Golden.season = S => { const L = S.lanterns.wake; return (L && L.level >= 2) ? (L.level - 1) % 4 : 0; };
  Golden.seasonName = S => NAMES[Golden.season(S)].charAt(0) + NAMES[Golden.season(S)].slice(1).toLowerCase();
  Golden.applySeason = function (S) {
    if (G.SEASON.id !== 1) return;
    const s = Golden.season(S); if (Golden.applied && s === Golden.cur) return;
    Golden.applied = true; Golden.cur = s; Object.assign(PAL, PALS[s]);
    if (G.Render && G.Render.markStaticDirty) G.Render.markStaticDirty();
  };
  Golden.init = function (S) {
    Golden.applied = false; Golden.applySeason(S); fireT = 0;
    if (Golden.subscribed) return;
    Golden.subscribed = true;
    G.Bus.on('night:end', () => { const S2 = G.Game.S; if (S2) Golden.nightEnded(S2); });
  };
  // a Source Star: the season turns, +10% pay (ten at most), and the next night is a festival
  Golden.star = function (S, level) {
    Golden.applySeason(S); S.stats.stars++; S.festival.pending = true;
    G.HUD.banner(S, NAMES[Golden.season(S)] + ' COMES', level <= 11 ? '+10% pay on everything, and a festival tonight' : 'a festival tonight');
    G.FX.flash(S, 0.3); G.FX.confetti(S, S.kit.x, S.kit.y - 40, C.CONFETTI_BIG); G.Audio.play('fanfare'); G.Audio.play('chime', 1.3);
    G.Bus.emit('star', evNone);
  };
  // the story just ended: a Festival Night starts at once
  Golden.afterEnding = function (S) { S.festival.pending = true; if (!S.night.active) G.Events.startNight(S, true); else G.Events.makeFestival(S); };
  // Events asks whether the night it is starting should be a festival: after a Star or the ending, then every third night
  Golden.festivalTonight = S => !!S.built.awake && (S.festival.pending || S.night.count % 3 === 2);
  Golden.nightEnded = function (S) {
    if (!S.night.wasFestival) return;
    S.night.wasFestival = false;
    const score = Math.max(0, S.earned - S.festival.start), newBest = score > S.festival.best;
    S.festival.count++; S.stats.festivals++;
    if (newBest) { S.festival.best = score; S.stats.bests++; }
    evEnd.score = score; evEnd.best = S.festival.best; evEnd.newBest = newBest; G.Bus.emit('festival:end', evEnd);
    G.HUD.banner(S, newBest ? 'NEW BEST FESTIVAL!' : 'FESTIVAL OVER', G.Art.S.fmtCoins(score) + ' koban' + (newBest ? '' : '  ·  best ' + G.Art.S.fmtCoins(S.festival.best)));
    if (newBest) { G.FX.confetti(S, S.kit.x, S.kit.y - 40, C.CONFETTI_BIG); G.Audio.play('fanfare'); }
  };
  // fireworks over whatever the camera sees, every 1.5 s of a festival (presentation only: Math.random, never the seeded RNG)
  Golden.update = function (S, dt) {
    if (!(S.night.active && S.night.festival)) { fireT = 0; return; }
    fireT -= dt; boomT -= dt;
    if (fireT > 0 || G.Game.headless) return;
    fireT = S.settings.lowFx ? 3 : 1.5;
    const cam = G.Camera, x = 60 + Math.random() * 420, y = cam.y + 120 + Math.random() * G.Canvas.H * 0.35;
    G.FX.confetti(S, x, y, S.settings.lowFx ? 10 : 18); G.FX.ring(S, x, y, 60);
    if (boomT <= 0) { boomT = 0.4; G.Audio.play('boom', 0.9 + Math.random() * 0.4, 0.45); G.Audio.play('chime', 0.9 + Math.random() * 0.4, 0.25); }
  };
})(window.G);
