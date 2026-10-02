// Capy Springs - canvas sizing, DPR, safe area, logical transform (ARCHITECTURE.md 4.1).
(function (G) {
  'use strict';
  const C = G.C, PAL = G.PAL, U = G.U;
  const Canvas = G.Canvas = { el: null, ctx: null, W: 540, H: 960, scale: 1, offX: 0, offY: 0, dpr: 1, st: 0, sb: 0, cssW: 540, cssH: 960 };
  let resizeTimer = 0;

  Canvas.init = function (el) {
    Canvas.el = el; Canvas.ctx = el.getContext('2d', { alpha: false });   // opaque: no compositor blend over the page
    Canvas.resize();
    const onR = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(Canvas.resize, 100); };
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
  };

  Canvas.resize = function () {
    const cssW = window.innerWidth || 540, cssH = window.innerHeight || 960;
    let dpr = Math.min(window.devicePixelRatio || 1, C.DPR_CAP);
    if (cssW * dpr > C.DPR_WIDE_PX) dpr = Math.min(dpr, C.DPR_CAP_WIDE);
    if (G.S && G.S.settings && G.S.settings.lowFx) dpr = Math.min(dpr, C.DPR_CAP_LOWFX);     // low effects: fewer pixels on every pass
    let scale, H, offX, offY;
    // any portrait viewport fits by width (a browser tab with toolbars is shorter than 16:9 but must not shrink the game to a column)
    if (cssW < cssH || cssH / cssW >= 16 / 9) {
      scale = cssW / 540; H = U.clamp(Math.round(cssH / scale), 800, 1200); offX = 0; offY = Math.round((cssH - H * scale) / 2);
    } else {
      scale = cssH / 960; H = 960; offX = Math.round((cssW - 540 * scale) / 2); offY = 0;
    }
    Canvas.cssW = cssW; Canvas.cssH = cssH; Canvas.dpr = dpr; Canvas.scale = scale; Canvas.H = H; Canvas.offX = offX; Canvas.offY = offY;
    if (Canvas.el) {
      Canvas.el.width = Math.round(cssW * dpr); Canvas.el.height = Math.round(cssH * dpr);
      Canvas.el.style.width = cssW + 'px'; Canvas.el.style.height = cssH + 'px';
    }
    let st = 0, sb = 0;
    try {
      const safe = document.getElementById('safe');
      if (safe && typeof getComputedStyle === 'function') {
        const cs = getComputedStyle(safe);
        st = (parseFloat(cs.paddingTop) || 0) / scale; sb = (parseFloat(cs.paddingBottom) || 0) / scale;
      }
    } catch (e) { st = 0; sb = 0; }
    Canvas.st = st; Canvas.sb = sb;
    if (G.Render && G.Render.onResize) G.Render.onResize();
    if (G.HUD && G.HUD.layout) G.HUD.layout();
  };

  // each frame: save, bar-only ink fill, logical transform, clip. Everything after this is in logical px.
  Canvas.begin = function (ctxIn) {
    const ctx = ctxIn || Canvas.ctx, dpr = Canvas.dpr, s = Canvas.scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    if (Canvas.offX || Canvas.offY) {
      ctx.fillStyle = PAL.ink;
      const W = Canvas.cssW * dpr, Hc = Canvas.cssH * dpr, ox = Canvas.offX * dpr, oy = Canvas.offY * dpr;
      if (Canvas.offX) { ctx.fillRect(0, 0, ox, Hc); ctx.fillRect(W - ox, 0, ox, Hc); }
      if (Canvas.offY) { ctx.fillRect(0, 0, W, oy); ctx.fillRect(0, Hc - oy, W, oy); }
    }
    ctx.setTransform(dpr * s, 0, 0, dpr * s, Canvas.offX * dpr, Canvas.offY * dpr);
    ctx.beginPath(); ctx.rect(0, 0, 540, Canvas.H); ctx.clip();
  };
  Canvas.end = function (ctxIn) { (ctxIn || Canvas.ctx).restore(); };
  Canvas.toLogical = function (cx, cy, out) { out.x = (cx - Canvas.offX) / Canvas.scale; out.y = (cy - Canvas.offY) / Canvas.scale; return out; };
})(window.G);
