// Capy Springs - snowfall: squalls once the Ridge is open, drifts that slow everyone on the Ridge's paths, and Kit clearing them (GDD 19.3, ARCHITECTURE.md 22).
// Idle unless the map defines SNOW. Presentation (flakes, tint) is hash-driven; the simulation part (which spots drift) uses the seeded RNG.
(function (G) {
  'use strict';
  const U = G.U, DATA = G.DATA, MAP = DATA.MAP, SNOW = MAP.SNOW || null, PAL = G.PAL;
  const Snow = G.Snow = {};
  const evNone = {}, evClear = { x: 0, y: 0, bonus: 0 };
  const DRAW = [];                                   // drift drawables (one per spot index)
  let fade = 0;

  Snow.init = function (S) { fade = 0; };
  Snow.active = S => !!SNOW && S.snow.active;
  // speed multiplier for a walker at (x, y): inside a settled drift everyone crawls
  Snow.speedMult = function (S, x, y, kit) {
    if (!SNOW || !S.snow.drifts.length) return 1;
    const r2 = SNOW.driftR * SNOW.driftR, ds = S.snow.drifts;
    for (let i = 0; i < ds.length; i++) { const d = ds[i]; if (d.amount >= 0.5 && U.dist2(x, y, d.x, d.y) <= r2) return kit ? SNOW.slowKit : SNOW.slowGuest; }
    return 1;
  };
  Snow.nearestDrift = function (S, x, y, maxDist) {
    if (!SNOW) return null;
    let best = null, bd = maxDist * maxDist; const ds = S.snow.drifts;
    for (let i = 0; i < ds.length; i++) { const d = ds[i]; if (d.amount < 0.5) continue; const q = U.dist2(x, y, d.x, d.y); if (q <= bd) { bd = q; best = d; } }
    return best;
  };
  function addDrift(S) {
    const ds = S.snow.drifts; if (ds.length >= SNOW.maxDrifts) return;
    // a spot that has no drift yet, picked with the seeded RNG
    const free = []; for (let i = 0; i < SNOW.spots.length; i++) { let taken = false; for (let j = 0; j < ds.length; j++) if (ds[j].i === i) taken = true; if (!taken) free.push(i); }
    if (!free.length) return;
    const i = U.pick(free), sp = SNOW.spots[i];
    ds.push({ i, x: sp[0], y: sp[1], amount: 0, clear: 0 });
  }
  Snow.update = function (S, dt) {
    if (!SNOW) return;
    const sn = S.snow;
    if (sn.next === 0 || !S.built.ridge) sn.next = S.t + SNOW.first;     // the clock starts when the Ridge opens, never during its opening
    if (!sn.active && S.built.ridge && S.t >= sn.next) { sn.active = true; sn.t = 0; sn.count++; sn.dropT = 0; S.stats.squalls++; G.Bus.emit('snow:start', evNone); }
    if (sn.active) {
      sn.t += dt; sn.dropT += dt;
      if (sn.dropped < SNOW.perSquall * sn.count && sn.dropT >= SNOW.stagger) { sn.dropT = 0; sn.dropped++; addDrift(S); }
      if (sn.t >= SNOW.dur) { sn.active = false; sn.next = S.t + SNOW.every; sn.dropped = SNOW.perSquall * sn.count; G.Bus.emit('snow:end', evNone); }
    }
    // drifts grow, and Kit clears the one he stands in
    const kit = S.kit, ds = sn.drifts, r2 = SNOW.driftR * SNOW.driftR;
    for (let i = ds.length - 1; i >= 0; i--) {
      const d = ds[i];
      if (d.amount < 1) d.amount = Math.min(1, d.amount + dt / SNOW.growT);
      if (d.amount >= 0.5 && U.dist2(kit.x, kit.y, d.x, d.y) <= r2) {
        d.clear += dt;
        if (d.clear >= SNOW.clearT) { ds.splice(i, 1); S.stats.cleared++; evClear.x = d.x; evClear.y = d.y; evClear.bonus = SNOW.bonus; G.Bus.emit('snow:clear', evClear); G.Coins.rain(S, SNOW.bonus, d.x, d.y, 'snow'); }
      } else if (d.clear > 0) d.clear = Math.max(0, d.clear - dt);
    }
    fade += ((sn.active ? 1 : 0) - fade) * Math.min(1, dt / 2);
  };
  // ---- drawing: drifts on the ground, flakes and a cool tint over the world ----
  Snow.drawGround = function (ctx, S) {
    if (!SNOW) return;
    const ds = S.snow.drifts, cam = G.Camera, H = G.Canvas.H;
    for (let i = 0; i < ds.length; i++) { const d = ds[i]; if (d.y < cam.y - 60 || d.y > cam.y + H + 60) continue; G.Art.W.drift(ctx, d.x, d.y, d.amount * (1 - d.clear / SNOW.clearT), S.t); }
  };
  Snow.drawWeather = function (ctx, camY, H, t, low) {
    if (!SNOW || fade <= 0.01) return;
    if (low) { ctx.fillStyle = PAL.rgba('#A9BCCB', 0.10 * fade); ctx.fillRect(0, camY, MAP.W, H); }
    else { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = PAL.rgba('#A9BCCB', 0.16 * fade); ctx.fillRect(0, camY, MAP.W, H); ctx.globalCompositeOperation = 'source-over'; }
    const n = low ? 24 : 48; ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < n; i++) {
      const sp = 40 + U.hash(i, 71) * 40, x = ((U.hash(i, 72) * 600) - t * (20 + U.hash(i, 73) * 25) + Math.sin(t * 1.5 + i) * 10 + 6000) % 600 - 30, y = camY + (((U.hash(i, 74) * H) + t * sp) % (H + 30)) - 15;
      ctx.globalAlpha = (0.55 + 0.4 * U.hash(i, 75)) * fade; ctx.beginPath(); ctx.arc(x, y, 1.6 + U.hash(i, 76) * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
})(window.G);
