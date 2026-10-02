// Capy Springs - input: floating trailing joystick, taps, keyboard (ARCHITECTURE.md 5, GDD 10.3).
(function (G) {
  'use strict';
  const C = G.C, U = G.U;
  const Input = G.Input = {
    vec: { x: 0, y: 0 }, mag: 0, headless: false,
    stick: { active: false, id: null, ox: 0, oy: 0, kx: 0, ky: 0, alpha: 0, t0: 0, moved: false, fromSheet: false },
    taps: [], keys: {}, lastStickT: -1, el: null
  };
  const TAP_POOL = []; for (let i = 0; i < 8; i++) TAP_POOL.push({ x: 0, y: 0, zone: null });
  const CANDS = []; for (let i = 0; i < 6; i++) CANDS.push({ used: false, id: null, x: 0, y: 0, t0: 0, ui: false });
  const L = { x: 0, y: 0 };
  const nowS = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;
  // Audio.unlock is idempotent; run it on every gesture (pointerup / keydown count as activation on iOS and Chrome)
  function unlockAudio() { if (G.Audio && G.Audio.unlock) G.Audio.unlock(); }
  function cand(id) { for (let i = 0; i < CANDS.length; i++) if (CANDS[i].used && CANDS[i].id === id) return CANDS[i]; return null; }
  function newCand(id, x, y, ui) { for (let i = 0; i < CANDS.length; i++) { const c = CANDS[i]; if (!c.used) { c.used = true; c.id = id; c.x = x; c.y = y; c.t0 = nowS(); c.ui = ui; return c; } } return null; }
  function pushTap(x, y, zone) { if (Input.taps.length >= TAP_POOL.length) return; const t = TAP_POOL[Input.taps.length]; t.x = x; t.y = y; t.zone = zone; Input.taps.push(t); }

  Input.init = function (el) {
    if (Input.headless) return;
    Input.el = el;
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp);
    el.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => { for (const k in Input.keys) Input.keys[k] = false; });
  };

  function onDown(e) {
    unlockAudio();
    if (e.preventDefault) e.preventDefault();
    try { Input.el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    G.Canvas.toLogical(e.clientX, e.clientY, L);
    const x = L.x, y = L.y, S = G.Game.S, st = Input.stick;
    const ui = S ? G.Game.uiOwns(S, x, y) : false;
    if (ui) { newCand(e.pointerId, x, y, true); return; }
    if (y > C.JOY_ZONE * G.Canvas.H && !st.active) { startStick(e.pointerId, x, y, false); return; }
    newCand(e.pointerId, x, y, false);
  }
  function startStick(id, x, y, fromSheet) {
    const st = Input.stick;
    st.active = true; st.id = id; st.ox = x; st.oy = y; st.kx = x; st.ky = y; st.alpha = 0.35; st.t0 = nowS(); st.moved = false; st.fromSheet = fromSheet;
  }
  function onMove(e) {
    if (e.preventDefault) e.preventDefault();
    G.Canvas.toLogical(e.clientX, e.clientY, L);
    const x = L.x, y = L.y, st = Input.stick;
    if (st.active && st.id === e.pointerId) { moveStick(x, y); return; }
    const c = cand(e.pointerId);
    if (c && c.ui && !st.active) {
      const S = G.Game.S;
      if (S && S.ui.sheet && U.dist(c.x, c.y, x, y) > C.TAP_PX) { c.used = false; startStick(e.pointerId, x, y, true); moveStick(x, y); }
    }
  }
  function moveStick(x, y) {
    const st = Input.stick;
    let dx = x - st.ox, dy = y - st.oy, len = Math.sqrt(dx * dx + dy * dy);
    if (C.JOY_TRAIL && len > C.JOY_R) { st.ox += dx / len * (len - C.JOY_R); st.oy += dy / len * (len - C.JOY_R); dx = x - st.ox; dy = y - st.oy; len = C.JOY_R; }
    if (len > C.TAP_PX) { st.moved = true; Input.lastStickT = nowS(); }
    st.kx = st.ox + dx; st.ky = st.oy + dy;
    if (len < C.JOY_DEAD) { Input.mag = 0; Input.vec.x = 0; Input.vec.y = 0; return; }
    const mag = U.clamp((len - C.JOY_DEAD) / (C.JOY_R * C.JOY_FULL - C.JOY_DEAD), 0, 1);
    Input.mag = mag; Input.vec.x = dx / len * mag; Input.vec.y = dy / len * mag;
  }
  function onUp(e) {
    unlockAudio();
    if (e.preventDefault) e.preventDefault();
    const st = Input.stick;
    if (st.active && st.id === e.pointerId) {
      if (!st.moved && nowS() - st.t0 < C.TAP_MS / 1000) pushTap(st.ox, st.oy, 'joy');
      st.active = false; st.id = null; Input.vec.x = 0; Input.vec.y = 0; Input.mag = 0;
      return;
    }
    const c = cand(e.pointerId);
    if (c) {
      G.Canvas.toLogical(e.clientX, e.clientY, L);
      if (U.dist(c.x, c.y, L.x, L.y) < C.TAP_PX && (c.ui || nowS() - c.t0 < C.TAP_MS / 1000)) pushTap(c.x, c.y, c.ui ? 'ui' : null);   // a slow press on a button still counts
      c.used = false;
    }
  }
  const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
  function onKeyDown(e) {
    unlockAudio();
    const k = KEYMAP[e.code];
    if (k) { Input.keys[k] = true; if (e.preventDefault) e.preventDefault(); return; }
    if (e.repeat) return;
    if (e.code === 'KeyE') G.Game.key('E'); else if (e.code === 'Escape') G.Game.key('ESC'); else if (e.code === 'KeyM') G.Game.key('M'); else if (e.code === 'Backquote') G.Game.key('DEBUG');
    else if (e.code === 'Enter' || e.code === 'Space') G.Game.key('ENTER'); else if (e.code === 'F2') { G.Game.key('DEV'); if (e.preventDefault) e.preventDefault(); }
  }
  function onKeyUp(e) { const k = KEYMAP[e.code]; if (k) Input.keys[k] = false; }

  Input.update = function (dt) {
    const st = Input.stick;
    if (st.active) st.alpha = Math.min(1, st.alpha + dt / C.JOY_ALPHA_T);
    else if (st.alpha > 0) st.alpha = Math.max(0, st.alpha - dt / C.JOY_FADE);
    if (Input.headless || st.active) return;
    const k = Input.keys;
    let x = (k.right ? 1 : 0) - (k.left ? 1 : 0), y = (k.down ? 1 : 0) - (k.up ? 1 : 0);
    if (x || y) { const l = Math.sqrt(x * x + y * y); Input.vec.x = x / l; Input.vec.y = y / l; Input.mag = 1; Input.lastStickT = nowS(); }
    else { Input.vec.x = 0; Input.vec.y = 0; Input.mag = 0; }
  };
  // returns the pending taps (consumed once per step: the caller must finish with them before the next takeTaps)
  Input.takeTaps = function () { const t = Input.taps; if (!t.length) return t; PENDING.length = 0; for (let i = 0; i < t.length; i++) PENDING.push(t[i]); t.length = 0; return PENDING; };
  const PENDING = [];
})(window.G);
