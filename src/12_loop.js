// Capy Springs - sub-stepped game loop with hit-stop budget (ARCHITECTURE.md 3).
(function (G) {
  'use strict';
  const Loop = G.Loop = {
    STEP_MAX: 1 / 50, MAX_FRAME: 0.1, HITSTOP_CAP: 0.15,
    running: false, last: 0, timescale: 1,
    hitstop: 0, hitstopSpent: 0, hitstopWindowT: 0,
    fps: 60, stepMs: 0, frameMs: 16,
    stepFn: null, frameFn: null, rafId: 0
  };
  const now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

  Loop.start = function (stepFn, frameFn) {
    Loop.stepFn = stepFn; Loop.frameFn = frameFn;
    if (Loop.running) return;
    Loop.running = true;
    Loop.last = now();                       // a visibility return never produces a jump
    Loop.rafId = requestAnimationFrame(tick);
  };
  Loop.stop = function () {
    Loop.running = false;
    if (Loop.rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(Loop.rafId);
    Loop.rafId = 0;
  };
  // requested only by presentation subscribers (FX.init); capped at HITSTOP_CAP per wall-clock second
  Loop.hitStop = function (seconds) {
    const s = Math.max(0, Math.min(seconds, Loop.HITSTOP_CAP - Loop.hitstopSpent));
    if (s <= 0) return;
    Loop.hitstop = Math.max(Loop.hitstop, s);
    Loop.hitstopSpent += s;
  };
  function tick(t) {
    if (!Loop.running) return;
    Loop.rafId = requestAnimationFrame(tick);
    let raw = (t - Loop.last) / 1000; Loop.last = t;
    if (!(raw >= 0)) raw = 0;
    const dt = Math.min(raw, Loop.MAX_FRAME) * Loop.timescale;
    Loop.hitstopWindowT += raw;
    if (Loop.hitstopWindowT >= 1) { Loop.hitstopWindowT -= 1; Loop.hitstopSpent = 0; }
    const t0 = now();
    const n = Math.max(1, Math.ceil(dt / Loop.STEP_MAX)), h = dt / n;   // 1 sub-step at 60-120 Hz, 2 at 30 Hz, at most 5 after a stall
    for (let i = 0; i < n; i++) Loop.stepFn(h);
    const t1 = now();
    Loop.frameFn(dt);
    const t2 = now();
    Loop.stepMs += ((t1 - t0) - Loop.stepMs) * 0.05;
    Loop.frameMs += ((t2 - t1) - Loop.frameMs) * 0.05;
    if (raw > 0.001) Loop.fps += ((1 / raw) - Loop.fps) * 0.05;
  }
})(window.G);
