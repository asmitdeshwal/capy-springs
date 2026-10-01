// Capy Springs - WebAudio procedural SFX, music layers, haptics; wired to the bus (ARCHITECTURE.md 14, GDD 12). No sound before a gesture.
(function (G) {
  'use strict';
  const C = G.C, U = G.U;
  const Audio = G.Audio = { ctx: null, enabled: true, unlocked: false, master: null, noiseBuf: null, voices: 0, lastPlayed: {}, layers: {}, disabled: false };
  let clinkN = 0, clinkT = 0, softT = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

  function tone(ac, dest, type, f0, f1, dur, gain, t0, attack) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const a = attack || 0.005;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.02);
    voice(o);
  }
  function noise(ac, dest, dur, filterType, freq, gain, t0, f1) {
    const src = ac.createBufferSource(); src.buffer = Audio.noiseBuf;
    const f = ac.createBiquadFilter(); f.type = filterType; f.frequency.setValueAtTime(freq, t0); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t0); src.stop(t0 + dur + 0.02);
    voice(src);
  }
  function voice(node) { Audio.voices++; node.onended = () => { Audio.voices = Math.max(0, Audio.voices - 1); }; }
  const st = n => Math.pow(2, n / 12);
  const RECIPES = {
    boing: (ac, d, t, o) => tone(ac, d, 'triangle', 220 * o.pitch, 440 * o.pitch, 0.15, 0.25 * o.gain, t),
    blip: (ac, d, t, o) => tone(ac, d, 'sine', 520 * (1 + 0.12 * (o.semis || 0)), 0, 0.08, 0.2 * o.gain, t),
    quack: (ac, d, t, o) => { const q = ac.createBiquadFilter(); q.type = 'lowpass'; q.frequency.value = 900; q.connect(d); tone(ac, q, 'sawtooth', 400, 300, 0.1, 0.2 * o.gain, t); },
    splash: (ac, d, t, o) => { noise(ac, d, 0.25, 'lowpass', 1200, 0.3 * o.gain, t); tone(ac, d, 'sine', 180 * o.pitch, 90 * o.pitch, 0.15, 0.25 * o.gain, t); },
    plink: (ac, d, t, o) => { const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; tone(ac, d, 'sine', notes[U.clamp((o.semis || 1) - 1, 0, 4)], 0, 0.12, 0.22 * o.gain, t); },
    clink: (ac, d, t, o) => tone(ac, d, 'triangle', 1800 * st(o.semis || 0), 0, 0.06, 0.18 * o.gain, t),
    clinkSoft: (ac, d, t, o) => tone(ac, d, 'triangle', 1800, 0, 0.06, 0.07 * o.gain, t),
    tick: (ac, d, t, o) => tone(ac, d, 'square', 800 * o.pitch, 0, 0.03, 0.08 * o.gain, t),
    pop: (ac, d, t, o) => { tone(ac, d, 'triangle', 300, 150, 0.2, 0.25 * o.gain, t); noise(ac, d, 0.1, 'bandpass', 1500, 0.15 * o.gain, t); },
    pip: (ac, d, t, o) => { tone(ac, d, 'sine', 900, 0, 0.05, 0.15 * o.gain, t); tone(ac, d, 'sine', 1200, 0, 0.05, 0.15 * o.gain, t + 0.05); },
    nope: (ac, d, t, o) => { tone(ac, d, 'square', 200, 0, 0.08, 0.12 * o.gain, t); tone(ac, d, 'square', 200, 0, 0.08, 0.12 * o.gain, t + 0.1); },
    bell: (ac, d, t, o) => { tone(ac, d, 'sine', 880, 0, 1.2, 0.2 * o.gain, t); tone(ac, d, 'sine', 1320, 0, 1.0, 0.1 * o.gain, t); },
    dingding: (ac, d, t, o) => { RECIPES.bell(ac, d, t, o); RECIPES.bell(ac, d, t + 0.18, o); },
    whoosh: (ac, d, t, o) => noise(ac, d, 0.6, 'bandpass', 400, 0.3 * o.gain, t, 3000),
    stoke: (ac, d, t, o) => { noise(ac, d, 0.15, 'lowpass', 600, 0.25 * o.gain, t); tone(ac, d, 'sine', 120, 60, 0.15, 0.2 * o.gain, t); },
    sigh: (ac, d, t, o) => tone(ac, d, 'sine', 660, 440, 0.3, 0.08 * o.gain, t, 0.05),
    shiver: (ac, d, t, o) => { tone(ac, d, 'triangle', 300, 0, 0.04, 0.12 * o.gain, t); tone(ac, d, 'triangle', 300, 0, 0.04, 0.12 * o.gain, t + 0.07); },
    yuzu: (ac, d, t, o) => { tone(ac, d, 'sine', 1046, 0, 0.1, 0.15 * o.gain, t); tone(ac, d, 'sine', 1568, 0, 0.1, 0.15 * o.gain, t + 0.1); },
    hop: (ac, d, t, o) => tone(ac, d, 'sine', 500, 800, 0.08, 0.1 * o.gain, t),
    puff: (ac, d, t, o) => noise(ac, d, 0.12, 'lowpass', 900, 0.12 * o.gain, t),
    fanfare: (ac, d, t, o) => { const n = [523.25, 659.25, 783.99, 1046.5]; for (let i = 0; i < 4; i++) tone(ac, d, 'triangle', n[i], 0, 0.6 - i * 0.05, 0.12 * o.gain, t + i * 0.12); },
    chime: (ac, d, t, o) => { tone(ac, d, 'sine', 1760, 0, 1.5, 0.12 * o.gain, t); tone(ac, d, 'sine', 2640, 0, 1.2, 0.06 * o.gain, t); },
    tap: (ac, d, t, o) => tone(ac, d, 'sine', 700, 0, 0.04, 0.08 * o.gain, t),
    // season 2 voices: squirrel chirp, mortar thump, the lap's rising three-note beat, Kaa's caw
    chirp: (ac, d, t, o) => { tone(ac, d, 'sine', 1800, 2400, 0.05, 0.12 * o.gain, t); tone(ac, d, 'sine', 2000, 2600, 0.05, 0.1 * o.gain, t + 0.07); },
    thump: (ac, d, t, o) => { tone(ac, d, 'sine', 90, 45, 0.18, 0.3 * o.gain, t); noise(ac, d, 0.08, 'lowpass', 400, 0.2 * o.gain, t); },
    lap: (ac, d, t, o) => { const n = [110, 147, 196]; for (let i = 0; i < 3; i++) { tone(ac, d, 'sine', n[i], n[i] * 0.6, 0.16, 0.22 * o.gain, t + i * 0.1); } },
    sizzle: (ac, d, t, o) => noise(ac, d, 0.35, 'highpass', 2600, 0.22 * o.gain, t, 5000),
    wind: (ac, d, t, o) => noise(ac, d, 2.2, 'lowpass', 500, 0.18 * o.gain, t, 900),
    scrape: (ac, d, t, o) => { noise(ac, d, 0.18, 'bandpass', 2200, 0.2 * o.gain, t, 900); tone(ac, d, 'triangle', 1400, 1800, 0.08, 0.08 * o.gain, t + 0.1); },
    gong: (ac, d, t, o) => { tone(ac, d, 'sine', 196, 0, 1.8, 0.25 * o.gain, t); tone(ac, d, 'sine', 294, 0, 1.4, 0.12 * o.gain, t); tone(ac, d, 'triangle', 392, 0, 0.9, 0.08 * o.gain, t); noise(ac, d, 0.08, 'bandpass', 1800, 0.12 * o.gain, t); },
    boom: (ac, d, t, o) => { tone(ac, d, 'sine', 90, 36, 0.45, 0.4 * o.gain, t); noise(ac, d, 0.3, 'lowpass', 320, 0.3 * o.gain, t); tone(ac, d, 'triangle', 1046, 0, 0.3, 0.1 * o.gain, t + 0.05); },
    caw: (ac, d, t, o) => { const q = ac.createBiquadFilter(); q.type = 'bandpass'; q.frequency.value = 1200; q.connect(d); tone(ac, q, 'sawtooth', 520, 380, 0.18, 0.2 * o.gain, t); tone(ac, q, 'sawtooth', 560, 400, 0.14, 0.16 * o.gain, t + 0.2); }
  };
  const OPTS = { pitch: 1, gain: 1, semis: 0 };

  Audio.init = function (S) {
    if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') { Audio.disabled = true; }
    if (Audio.subscribed) return;
    Audio.subscribed = true;
    const Bus = G.Bus, cur = () => G.Game.S;
    const voice = kind => { const d = G.DATA.GUESTS[kind]; if (d && d.voice) Audio.play(d.voice); };
    Bus.on('trail:join', e => { Audio.play('blip', 1, 1, e.index); if (e.node.kind === 'guest') voice(e.node.ref.kind); });
    Bus.on('splash', e => { Audio.play('splash', e.g.kind === 'duck' ? 1.5 : 1); Audio.play('plink', 1, 1, Math.min(5, e.count)); voice(e.g.kind); if (e.count === 3) { Audio.haptic(cur(), 15); Audio.play('thump', 1.2, 0.5); } if (e.count === 4) Audio.play('thump', 1, 0.7); if (e.count >= 5) { Audio.haptic(cur(), 40); Audio.play('boom'); } });
    Bus.on('hud:coin-land', () => { const t = now(); if (t - clinkT > C.CLINK_RESET) clinkN = 0; clinkT = t; Audio.play('clink', 1, 1, Math.min(C.CLINK_MAX, clinkN++)); });
    Bus.on('coins:land', () => { const t = now(); if (t - softT >= 0.06) { softT = t; Audio.play('clinkSoft'); } });
    Bus.on('lantern:tick', e => Audio.play('tick', 1 + e.fill));
    Bus.on('lantern:lit', () => Audio.play('pop')); Bus.on('build', () => Audio.play('pop'));
    Bus.on('upgrade', () => { Audio.play('pop'); Audio.play('pip'); }); Bus.on('ui:pip', () => Audio.play('pip'));
    Bus.on('ui:nope', () => Audio.play('nope')); Bus.on('lantern:short', () => Audio.play('nope'));
    Bus.on('car:warn', () => Audio.play('dingding'));
    Bus.on('car:arrive', e => { Audio.play('bell'); if (e.golden) Audio.play('fanfare'); });
    Bus.on('guest:spawn', () => Audio.play('boing'));
    Bus.on('heat:rush:start', () => { Audio.play('whoosh'); Audio.layer('shaker', true); Audio.haptic(cur(), 30); });
    Bus.on('heat:rush:end', () => Audio.layer('shaker', false));
    Bus.on('heat:stoke', () => Audio.play(G.Seasons.text('sfxStoke', 'stoke')));
    Bus.on('lap:step', e => Audio.play('tick', 1 + e.i * 0.3)); Bus.on('lap:done', () => Audio.play('lap'));
    Bus.on('plunge', e => { Audio.play('splash', 0.8); Audio.play('sizzle'); if (e.hot) { Audio.play('chime'); Audio.haptic(cur(), 25); } });
    Bus.on('ridge:open', () => { Audio.play('fanfare'); Audio.play('chime'); });
    Bus.on('gong', e => { Audio.play('gong'); if (e.full) { Audio.play('fanfare', 1, 0.7); Audio.haptic(cur(), 25); } });
    Bus.on('snow:start', () => { Audio.play('wind'); Audio.play('chime', 0.7, 0.5); }); Bus.on('snow:clear', () => Audio.play('scrape'));
    Bus.on('kaa:land', () => Audio.play('caw')); Bus.on('kaa:steal', () => Audio.play('caw', 0.8)); Bus.on('kaa:tap', () => { Audio.play('chime'); Audio.play('fanfare', 1, 0.6); });
    Bus.on('heat:cold', () => Audio.play('shiver')); Bus.on('ui:cold-refusal', () => Audio.play('shiver'));
    Bus.on('yuzu:apply', () => Audio.play('yuzu')); Bus.on('yuzu:pick', () => Audio.play('yuzu')); Bus.on('night:light', () => Audio.play('yuzu'));
    Bus.on('helper:hop', () => Audio.play('hop')); Bus.on('helper:hire', () => Audio.play('pop'));
    Bus.on('fullcar', () => Audio.play('fanfare')); Bus.on('famous', () => Audio.play('fanfare')); Bus.on('fame', () => Audio.play('fanfare')); Bus.on('season:unlock', () => Audio.play('fanfare'));
    Bus.on('night:start', () => { Audio.play('chime'); Audio.layer('night', true); }); Bus.on('night:end', () => Audio.layer('night', false));
    Bus.on('guest:heart', () => Audio.play('sigh'));
    Bus.on('ui:sheet:open', () => Audio.play('tap')); Bus.on('ui:sheet:close', () => Audio.play('tap'));
  };
  // idempotent: called on every gesture and on visibility return, re-resumes an 'interrupted' / 'suspended' context (iOS)
  Audio.unlock = function () {
    if (Audio.disabled) return;
    if (Audio.unlocked) { const ac = Audio.ctx; if (ac && ac.state !== 'running' && ac.resume) { try { ac.resume().catch(() => {}); } catch (e) { /* ignore */ } } return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ac = Audio.ctx = new AC();
      if (ac.state === 'suspended' && ac.resume) ac.resume();
      Audio.master = ac.createGain(); Audio.master.gain.value = C.MASTER_GAIN; Audio.master.connect(ac.destination);
      const len = ac.sampleRate, buf = ac.createBuffer(1, len, ac.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      Audio.noiseBuf = buf;
      buildLayers(ac);
      Audio.unlocked = true;
      const S = G.Game.S; if (S) Audio.setEnabled(S, S.settings.sound);
      Audio.play('bell');
      Audio.haptic(S, 10);
    } catch (e) { Audio.disabled = true; U.warnOnce('audio', 'AudioContext failed: ' + (e && e.message)); }
  };
  function buildLayers(ac) {
    const t = ac.currentTime;
    // pad: two detuned triangles through a slow-LFO lowpass
    const pg = ac.createGain(); pg.gain.value = 0; pg.connect(Audio.master);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(pg);
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(); o1.type = o2.type = 'triangle'; o1.frequency.value = 110; o2.frequency.value = 165; o2.detune.value = 6;
    o1.connect(lp); o2.connect(lp); o1.start(t); o2.start(t);
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.1; lg.gain.value = 250; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t);
    Audio.layers.pad = { gain: pg, level: C.PAD_GAIN };
    // shaker: highpassed noise bursts on 8ths at 100 BPM
    const sg = ac.createGain(); sg.gain.value = 0; sg.connect(Audio.master);
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000; hp.connect(sg);
    const src = ac.createBufferSource(); src.buffer = Audio.noiseBuf; src.loop = true;
    const env = ac.createGain(); env.gain.value = 0; src.connect(env); env.connect(hp); src.start(t);
    const beat = 60 / 100 / 2; for (let i = 0; i < 4000; i++) { const tt = t + i * beat; env.gain.setValueAtTime(0.9, tt); env.gain.exponentialRampToValueAtTime(0.001, tt + 0.08); }
    Audio.layers.shaker = { gain: sg, level: C.SHAKER_GAIN };
    // night: sine + fifth
    const ng = ac.createGain(); ng.gain.value = 0; ng.connect(Audio.master);
    const n1 = ac.createOscillator(), n2 = ac.createOscillator(); n1.frequency.value = 220; n2.frequency.value = 330; n1.connect(ng); n2.connect(ng); n1.start(t); n2.start(t);
    Audio.layers.night = { gain: ng, level: C.NIGHT_GAIN };
    Audio.layer('pad', true);
  }
  Audio.setEnabled = function (S, on) {
    Audio.enabled = !!on;
    if (Audio.master && Audio.ctx) Audio.master.gain.setTargetAtTime(on ? C.MASTER_GAIN : 0, Audio.ctx.currentTime, 0.05);
  };
  Audio.play = function (name, pitch, gain, semis) {
    if (Audio.disabled || !Audio.unlocked || !Audio.enabled || !Audio.ctx) return;
    const r = RECIPES[name]; if (!r) return;
    const t = now();
    if (Audio.lastPlayed[name] !== undefined && t - Audio.lastPlayed[name] < C.SFX_MIN_GAP) return;
    if (Audio.voices >= C.MAX_VOICES) return;
    Audio.lastPlayed[name] = t;
    OPTS.pitch = pitch || 1; OPTS.gain = gain || 1; OPTS.semis = semis || 0;
    try { r(Audio.ctx, Audio.master, Audio.ctx.currentTime, OPTS); } catch (e) { U.warnOnce('audio:' + name, 'recipe failed: ' + (e && e.message)); }
  };
  Audio.layer = function (name, on) {
    const l = Audio.layers[name]; if (!l || !Audio.ctx) return;
    l.gain.gain.setTargetAtTime(on ? l.level : 0, Audio.ctx.currentTime, C.LAYER_FADE / 3);
  };
  Audio.haptic = function (S, ms) {
    if (!S) return;
    const h = S.settings.haptics, auto = typeof navigator !== 'undefined' && !!navigator.maxTouchPoints;
    if (h === false || (h === null && !auto)) return;
    try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ }
  };
})(window.G);
