// Capy Springs - render pipeline: static cache, ground pass, sorted pass, FX, night tint + halos, world text, screen (ARCHITECTURE.md 10).
(function (G) {
  'use strict';
  const C = G.C, U = G.U, PAL = G.PAL, DATA = G.DATA, MAP = DATA.MAP;
  const Render = G.Render = { list: [], textList: [], tiles: [], staticDirty: true, sdpr: 1, haloSprite: null };
  const byY = (a, b) => (a.sortY < b.sortY ? -1 : a.sortY > b.sortY ? 1 : 0);     // small ints: no boxed doubles per comparison
  // the static world is cached in horizontal TILES (built lazily when the camera nears them, released when far away): no canvas is ever
  // taller than TILE_H * sdpr device px (cheap GPUs fall back to software above 4096), and memory stays ~4 tiles whatever the world height
  const TILE_H = 640, SEAM = 2;
  const P = { x: 0, y: 0 };

  Render.markStaticDirty = function () { Render.staticDirty = true; };
  Render.init = function (S) {
    if (!Render.tiles.length) for (let y = MAP.STATIC_Y0; y < MAP.H; y += TILE_H) Render.tiles.push({ cv: null, y0: y, h: Math.min(TILE_H, MAP.H - y), dirty: true });
    Render.onResize();
    if (!Render.haloSprite) buildHalo();
    Render.staticDirty = true;
    if (!Render.subscribed) {
      Render.subscribed = true;
      G.Bus.on('build', Render.markStaticDirty);
      G.Bus.on('upgrade', e => { if (e.id === 'grove' && e.key === 'slots') Render.markStaticDirty(); });
    }
  };
  Render.onResize = function () {
    const Cv = G.Canvas, s = Math.round((Cv.dpr || 1) * (Cv.scale || 1) * 8) / 8;
    if (s !== Render.sdpr) { Render.sdpr = s; Render.staticDirty = true; }
  };
  function buildHalo() {
    const size = 192, cv = document.createElement('canvas'); cv.width = size; cv.height = size;
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
    g.addColorStop(0, PAL.rgba(PAL.coinHi, 0.9)); g.addColorStop(0.35, PAL.rgba(PAL.amber, 0.5)); g.addColorStop(0.7, PAL.rgba(PAL.amberDeep, 0.18)); g.addColorStop(1, PAL.rgba(PAL.amberDeep, 0));   // a flame's warm falloff, not a flat disc
    c.fillStyle = g; c.fillRect(0, 0, size, size);
    Render.haloSprite = cv;
  }
  // the whole static draw list, in world coordinates (each tile runs it under its own transform; the canvas bounds clip the rest)
  function drawStatic(c, S) {
    const W = G.Art.W;
    W.terrain(c, MAP.STATIC_Y0, MAP.H); W.valley(c); W.lane(c); W.rocks(c); W.pines(c); W.stoneLanterns(c, false); W.platform(c); W.cable(c); W.bridge(c);
    if (MAP.RIDGE && W.ridgeDecor) W.ridgeDecor(c);
    if (MAP.SUMMIT && W.summitDecor) W.summitDecor(c, S);
    for (let i = 0; i < DATA.BATHS.length; i++) { const d = DATA.BATHS[i]; if (S.built[d.id]) W.deckPlate(c, d); }
    if (S.built.woodpile) W.woodpile(c, DATA.STATIONS.woodpile.x, DATA.STATIONS.woodpile.y);
    if (S.built.stall) W.stallBody(c, DATA.STATIONS.stall.x, DATA.STATIONS.stall.y);
    if (S.built.grove) { const n = Math.min(G.Upgrades.treeCount(S), S.grove.trees.length); for (let i = 0; i < n; i++) W.treeBody(c, S.grove.trees[i].x, S.grove.trees[i].y); }
    if (S.built.boiler) W.boilerBody(c, DATA.STATIONS.boiler.x, DATA.STATIONS.boiler.y);
  }
  function buildTile(S, t) {
    const s = Render.sdpr, w = Math.round(MAP.W * s), h = Math.round((t.h + SEAM) * s);
    if (!t.cv) t.cv = document.createElement('canvas');
    if (t.cv.width !== w || t.cv.height !== h) { t.cv.width = w; t.cv.height = h; }
    const c = t.cv.getContext('2d', { alpha: false });
    c.setTransform(s, 0, 0, s, 0, -t.y0 * s);
    drawStatic(c, S);
    t.dirty = false;
  }
  Render.rebuildStatic = function (S) { Render.staticDirty = true; };      // tiles rebuild lazily, only where the camera is

  Render.frame = function (S, ctx) {
    const Cv = G.Canvas, Cam = G.Camera, H = Cv.H, s = Render.sdpr, list = Render.list, tl = Render.textList;
    Cv.begin(ctx);
    Cam.apply(ctx);
    // 1. static tiles: the ones the camera sees (each overlaps the next by SEAM px, so no hairline between them)
    {
      const T = Render.tiles, top = Cam.y - 60, bot = Cam.y + H + 60;
      if (Render.staticDirty) { for (let i = 0; i < T.length; i++) T[i].dirty = true; Render.staticDirty = false; }
      for (let i = 0; i < T.length; i++) {
        const t = T[i];
        if (t.y0 + t.h < top || t.y0 > bot) { if (t.cv && t.cv.width && (t.y0 + t.h < top - TILE_H || t.y0 > bot + TILE_H)) { t.cv.width = 0; t.cv.height = 0; t.dirty = true; } continue; }
        if (t.dirty || !t.cv || !t.cv.width) buildTile(S, t);
        ctx.drawImage(t.cv, 0, t.y0, MAP.W, t.h + SEAM);
      }
    }
    // 2. ground pass
    G.Lanterns.drawGround(ctx, S); G.Heat.drawGround(ctx, S); G.Baths.drawGround(ctx, S); G.Snow.drawGround(ctx, S); G.Coins.drawGround(ctx, S); G.FX.drawGround(ctx, S);
    // 3. sorted pass
    list.length = 0;
    G.Player.collect(S, list); G.Trail.collect(S, list); G.Guests.collect(S, list); G.CableCar.collect(S, list); G.Baths.collect(S, list);
    G.Heat.collect(S, list); G.Grove.collect(S, list); G.Stall.collect(S, list); G.Coins.collect(S, list); G.Lanterns.collect(S, list);
    G.Helpers.collect(S, list); G.Events.collect(S, list); G.Kaa.collect(S, list); G.Lift.collect(S, list); G.Summit.collect(S, list); G.Finale.collect(S, list); G.FX.collect(S, list);
    list.sort(byY);
    for (let i = 0; i < list.length; i++) { const d = list[i]; d.draw(ctx, d, S); }
    // 4. FX pass
    G.FX.drawWorld(ctx, S);
    const low = !!S.settings.lowFx;
    if (G.Art.W.ambient) G.Art.W.ambient(ctx, Cam.y, H, S.t, low);                              // drifting petals
    G.Snow.drawWeather(ctx, Cam.y, H, S.t, low);                                                 // a squall's flakes and cool tint
    // 5. night tint + halos (lit lanterns keep a faint glow by day)
    const fade = S.night.fade;
    if (fade > 0) {
      if (low) { ctx.fillStyle = PAL.rgba(PAL.skyNight, 0.36 * fade); ctx.fillRect(0, Cam.y, MAP.W, H); }      // one ordinary blended quad on weak GPUs
      else if (G.Finale.active) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = PAL.rgba(PAL.amberDeep, 0.22 * fade); ctx.fillRect(0, Cam.y, MAP.W, H); ctx.globalCompositeOperation = 'source-over'; }   // the Source wakes: a golden dusk
      else { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = PAL.rgba(PAL.skyNight, C.NIGHT_TINT * fade); ctx.fillRect(0, Cam.y, MAP.W, H); ctx.globalCompositeOperation = 'source-over'; }
    }
    if (fade > 0 && G.Art.W.nightExtra) G.Art.W.nightExtra(ctx, Cam.y, H, fade, S.t, low);     // a season's moon / drifting leaves
    {
      ctx.globalCompositeOperation = 'lighter';
      let n = 0; const max = low ? C.HALO_MAX_LOW : C.HALO_MAX, sprite = Render.haloSprite, L = DATA.LANTERNS, lit = fade > 0 || S.heat.rush || anyGolden(S);
      for (let i = 0; i < L.length && n < max; i++) {
        const d = L[i]; if (S.lanterns[d.id].level < 1) continue;
        const py = d.y - C.POST_BACK - 58; if (py < Cam.y - 100 || py > Cam.y + H + 100) continue;
        G.Art.FX.halo(ctx, sprite, d.x, py, fade > 0 ? 70 + 30 * fade : lit ? 50 : 34, lit ? 0.25 + 0.3 * fade : 0.12); n++;
      }
      if (S.built.boiler && (S.heat.rush || fade > 0) && n < max) { const b = DATA.STATIONS.boiler; G.Art.FX.halo(ctx, sprite, b.x, b.y - 40, S.heat.rush ? 90 : 60, S.heat.rush ? 0.5 : 0.25); n++; }
      for (let i = 0; i < DATA.BATHS.length && n < max; i++) { const b = S.baths[DATA.BATHS[i].id]; if (S.built[b.id] && b.yuzuT > 0) { G.Art.FX.halo(ctx, sprite, b.def.water.x, b.def.water.y, 90, 0.3); n++; } }
      if (fade > 0) { const SL = MAP.STONE_LANTERNS; for (let i = 0; i < SL.length; i++) { const y = SL[i][1]; if (y < Cam.y - 60 || y > Cam.y + H + 60) continue; G.Art.S.circle(ctx, SL[i][0], y - 30, 14, PAL.rgba(PAL.amber, 0.35 * fade)); } }
      ctx.globalCompositeOperation = 'source-over';
    }
    const title = S.mode === 'title', finale = S.mode === 'finale';
    // 6. world text (after the tint so it stays readable); none on the title screen or during the ending (pops still fly)
    if (finale) G.FX.drawPops(ctx, S);
    else if (!title) {
      tl.length = 0;
      G.Guests.collectText(S, tl); G.Lanterns.collectText(S, tl); G.HUD.collectWorld(S, tl);
      for (let i = 0; i < tl.length; i++) { const d = tl[i]; d.draw(ctx, d, S); }
      G.FX.drawPops(ctx, S);
      G.Hints.drawWorld(ctx, S);
      G.Offers.drawWorld(ctx, S);                                                   // "light it now" under a step
    }
    Cam.unapply(ctx);
    // 7. screen space
    if (title) { G.Title.draw(ctx, S); G.Cards.draw(ctx, S); }
    else if (finale) G.Finale.drawScreen(ctx, S);
    else { G.HUD.draw(ctx, S); G.Offers.drawScreen(ctx, S); G.Goals.drawChip(ctx, S); G.Dev.drawChip(ctx, S); G.Sheet.draw(ctx, S); G.Story.draw(ctx, S); G.Cards.draw(ctx, S); G.HUD.drawJoystick(ctx, S); }
    if (S.fx.flash > 0) { ctx.globalAlpha = S.fx.flash; ctx.fillStyle = PAL.cream; ctx.fillRect(0, 0, MAP.W, H); ctx.globalAlpha = 1; }
    G.Ads.draw(ctx, S);                                                             // developer mode's stand-in ad
    if (S.ui.debug) G.HUD.drawDebug(ctx, S);
    Cv.end(ctx);
  };
  function anyGolden(S) { for (let i = 0; i < DATA.BATHS.length; i++) { const b = S.baths[DATA.BATHS[i].id]; if (S.built[b.id] && b.yuzuT > 0) return true; } return false; }
})(window.G);
