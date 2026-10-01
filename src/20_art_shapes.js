// Capy Springs - shape primitives, plates, shadows, text, pills, bubbles, icons (ARCHITECTURE.md 11.1, GDD 11.2).
// All functions are pure: (ctx, ...data) in, pixels out. No allocation beyond locals, no U.rand.
(function (G) {
  'use strict';
  const PAL = G.PAL, U = G.U;
  const Art = G.Art = G.Art || {};
  Art.FONT_FAMILY = '"Arial Rounded MT Bold","Trebuchet MS","Segoe UI",Roboto,sans-serif';
  const FONT_CACHE = Object.create(null), EMPTY_DASH = [], DASH_6 = [6, 6];
  Art.font = function (size, weight) { const k = (weight || 700) + '_' + size; return FONT_CACHE[k] || (FONT_CACHE[k] = (weight || 700) + ' ' + size + 'px ' + Art.FONT_FAMILY); };
  const S = Art.S = {};
  const TAU = Math.PI * 2;

  S.rrect = function (ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2; if (r > h / 2) r = h / 2; if (r < 0) r = 0;
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  S.fillRRect = function (ctx, x, y, w, h, r, color) { S.rrect(ctx, x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); };
  S.strokeRRect = function (ctx, x, y, w, h, r, color, lw, dash) {
    S.rrect(ctx, x, y, w, h, r); ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
    if (dash) ctx.setLineDash(dash === true ? DASH_6 : dash);
    ctx.stroke();
    if (dash) ctx.setLineDash(EMPTY_DASH);
  };
  // paper-cutout plate (x, y = top-left): side band `thick` px below, top on top
  S.plate = function (ctx, x, y, w, h, r, top, side, thick) { S.fillRRect(ctx, x, y + thick, w, h, r, side); S.fillRRect(ctx, x, y, w, h, r, top); };
  S.shadow = function (ctx, x, y, rx, ry, alpha) {
    ctx.fillStyle = alpha === undefined ? PAL.shadow : PAL.rgba('#000000', alpha);
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  };
  S.ellipse = function (ctx, x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
  S.circle = function (ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  S.tri = function (ctx, x1, y1, x2, y2, x3, y3, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); };
  S.line = function (ctx, x1, y1, x2, y2, color, lw) { ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  // progress ring / arc, clockwise from 12 o'clock; bg = optional full ring colour drawn first
  S.ring = function (ctx, x, y, r, frac, lw, color, bg, dash) {
    ctx.lineWidth = lw; ctx.lineCap = 'round';
    if (bg) { ctx.strokeStyle = bg; if (dash) ctx.setLineDash(DASH_6); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); if (dash) ctx.setLineDash(EMPTY_DASH); }
    if (frac > 0) { ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, frac)); ctx.stroke(); }
    ctx.lineCap = 'butt';
  };
  // opts: { align, base, stroke, lw, weight, alpha } - stroke is OFF by default (reserved for pops, the arrow word and banners)
  S.text = function (ctx, str, x, y, size, color, opts) {
    ctx.font = Art.font(size, opts && opts.weight);
    ctx.textAlign = (opts && opts.align) || 'center';
    ctx.textBaseline = (opts && opts.base) || 'middle';
    const a = opts && opts.alpha !== undefined ? opts.alpha : 1;
    const prev = ctx.globalAlpha; if (a !== 1) ctx.globalAlpha = prev * a;
    if (opts && opts.stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.lw || 3; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color; ctx.fillText(str, x, y);
    if (a !== 1) ctx.globalAlpha = prev;
  };
  // cream pill centred at (x, y) with unstroked text and an optional icon on the left: the only way labels, costs and level pills are drawn
  S.pill = function (ctx, x, y, w, h, str, size, fill, color, icon) {
    S.fillRRect(ctx, x - w / 2, y - h / 2 + 2, w, h, h / 2, PAL.rgba('#000000', 0.15));
    S.fillRRect(ctx, x - w / 2, y - h / 2, w, h, h / 2, fill || PAL.cream);
    if (icon) {
      const isz = h * 0.62;
      if (!str) { S.icon(ctx, icon, x, y, isz); return; }
      S.icon(ctx, icon, x - w / 2 + h * 0.55, y, isz);
      S.text(ctx, str, x + h * 0.25, y + 1, size, color || PAL.ink);
    } else S.text(ctx, str, x, y + 1, size, color || PAL.ink);
  };
  // rounded speech bubble centred at (x, y) with a tail at the bottom-left
  S.bubble = function (ctx, x, y, w, h, tail) {
    const x0 = x - w / 2, y0 = y - h / 2, r = 9;
    S.fillRRect(ctx, x0, y0 + 2, w, h, r, PAL.rgba('#000000', 0.15));
    S.rrect(ctx, x0, y0, w, h, r); ctx.fillStyle = PAL.cream; ctx.fill();
    if (tail !== false) S.tri(ctx, x0 + 10, y0 + h - 1, x0 + 22, y0 + h - 1, x0 + 12, y0 + h + 8, PAL.cream);
  };
  S.fmtCoins = function (n) { n = Math.round(n); if (n >= 10000) { const k = n / 1000; return (k >= 100 ? Math.round(k) : (Math.round(k * 10) / 10)) + 'k'; } return String(n); };

  // ---- icons: drawn centred at (x, y), `size` = bounding box ----
  S.icon = function (ctx, name, x, y, size) {
    const s = size / 24;                      // recipes are authored in a 24-px box
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    switch (name) {
      case 'bath':
        S.fillRRect(ctx, -11, -3, 22, 11, 4, PAL.stone); S.fillRRect(ctx, -9, -3, 18, 4, 2, PAL.waterHot);
        ctx.strokeStyle = PAL.ripple; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -9); ctx.quadraticCurveTo(-3, -12, -6, -14); ctx.moveTo(1, -9); ctx.quadraticCurveTo(4, -12, 1, -14); ctx.stroke();
        S.fillRRect(ctx, -9, 8, 3, 3, 1, PAL.stoneDark); S.fillRRect(ctx, 6, 8, 3, 3, 1, PAL.stoneDark); break;
      case 'mochi': S.circle(ctx, 0, 1, 10, PAL.cream); ctx.strokeStyle = PAL.stoneDark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 1, 10, 0, TAU); ctx.stroke(); S.circle(ctx, 0, 0, 3.5, PAL.red); break;
      case 'snow':
        ctx.strokeStyle = PAL.ripple; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(-Math.cos(a) * 10, -Math.sin(a) * 10); ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.stroke(); }
        ctx.lineCap = 'butt'; break;
      case 'sweat': ctx.fillStyle = PAL.ripple; ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(9, 3, 0, 9); ctx.quadraticCurveTo(-9, 3, 0, -11); ctx.fill(); S.circle(ctx, -2.5, 2, 2, PAL.cream); break;
      case 'heart': ctx.fillStyle = PAL.red; ctx.beginPath(); ctx.moveTo(0, 9); ctx.bezierCurveTo(-12, -1, -7, -11, 0, -5); ctx.bezierCurveTo(7, -11, 12, -1, 0, 9); ctx.fill(); break;
      case 'koban': S.ellipse(ctx, 0, 0, 10, 7, PAL.coinRim); S.ellipse(ctx, 0, 0, 8, 5.2, PAL.coin); S.fillRRect(ctx, -4, -2.4, 6, 2.2, 1, PAL.coinHi); break;
      case 'bell': S.fillRRect(ctx, -8, -8, 16, 14, 7, PAL.coin); S.fillRRect(ctx, -10, 4, 20, 4, 2, PAL.coinRim); S.circle(ctx, 0, 10, 2.5, PAL.coinRim); S.fillRRect(ctx, -2, -12, 4, 5, 2, PAL.coinRim); break;
      case 'kettle': S.fillRRect(ctx, -9, -4, 18, 13, 5, PAL.boilerLight); S.fillRRect(ctx, -3, -9, 6, 6, 2, PAL.boilerLight); ctx.strokeStyle = PAL.boilerLight; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(11, 1, 4, -Math.PI / 2, Math.PI / 2); ctx.stroke(); S.fillRRect(ctx, -6, 0, 12, 6, 2, PAL.amber); break;
      case 'gear':
        ctx.fillStyle = PAL.cream; ctx.beginPath();
        for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = (i & 1) ? 8 : 11; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); S.circle(ctx, 0, 0, 4, PAL.ink); break;
      case 'log': ctx.save(); ctx.rotate(-0.35); S.fillRRect(ctx, -11, -4, 22, 8, 3, PAL.cedarDark); S.circle(ctx, 11, 0, 4, PAL.cedar); ctx.restore(); break;
      case 'yuzu': S.circle(ctx, 0, 1, 9, PAL.yuzu); ctx.strokeStyle = PAL.coinRim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 1, 9, 0.2, 1.2); ctx.stroke(); S.ellipse(ctx, 4, -9, 6, 2.6, PAL.yuzuLeaf); break;
      case 'check': ctx.strokeStyle = PAL.pine; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(-2, 7); ctx.lineTo(9, -7); ctx.stroke(); ctx.lineCap = 'butt'; break;
      case 'x': ctx.strokeStyle = PAL.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, 7); ctx.moveTo(7, -7); ctx.lineTo(-7, 7); ctx.stroke(); ctx.lineCap = 'butt'; break;
      case 'lock': S.fillRRect(ctx, -8, -2, 16, 12, 3, PAL.stoneDark); ctx.strokeStyle = PAL.stoneDark; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -3, 5, Math.PI, 0); ctx.stroke(); S.circle(ctx, 0, 4, 2, PAL.cream); break;
      case 'flame': ctx.fillStyle = PAL.amberDeep; ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(10, 0, 0, 10); ctx.quadraticCurveTo(-10, 0, 0, -11); ctx.fill(); ctx.fillStyle = PAL.amber; ctx.beginPath(); ctx.moveTo(0, -3); ctx.quadraticCurveTo(5, 3, 0, 8); ctx.quadraticCurveTo(-5, 3, 0, -3); ctx.fill(); break;
      case 'wisp': ctx.strokeStyle = PAL.cream; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-5, 9); ctx.quadraticCurveTo(-9, 2, -4, -3); ctx.quadraticCurveTo(1, -8, -3, -11); ctx.moveTo(4, 9); ctx.quadraticCurveTo(0, 2, 5, -3); ctx.quadraticCurveTo(9, -8, 6, -11); ctx.stroke(); ctx.lineCap = 'butt'; break;
      case 'chevron': ctx.strokeStyle = PAL.cta; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(0, -5); ctx.lineTo(9, 4); ctx.stroke(); ctx.lineCap = 'butt'; break;
      case 'lantern': S.fillRRect(ctx, -6, -8, 12, 16, 4, PAL.amber); S.fillRRect(ctx, -8, -11, 16, 4, 1, PAL.post); S.fillRRect(ctx, -2, 8, 4, 4, 1, PAL.post); break;
      case 'pon': S.circle(ctx, 0, 2, 8, PAL.tanuki); S.ellipse(ctx, 0, -5, 11, 3, PAL.straw); S.fillRRect(ctx, -6, -2, 12, 3, 1, PAL.tanukiMask); break;
      case 'kero': S.circle(ctx, 0, 3, 8, PAL.frog); S.circle(ctx, -4, -5, 3.5, PAL.cream); S.circle(ctx, 4, -5, 3.5, PAL.cream); S.circle(ctx, -4, -5, 1.6, PAL.ink); S.circle(ctx, 4, -5, 1.6, PAL.ink); break;
      case 'kit': S.circle(ctx, 0, 2, 8, PAL.fox); S.tri(ctx, -8, -3, -3, -3, -7, -11, PAL.fox); S.tri(ctx, 8, -3, 3, -3, 7, -11, PAL.fox); S.fillRRect(ctx, -8, -3, 16, 3, 1, PAL.cream); break;
      case 'bowl': S.ellipse(ctx, 0, -2, 8, 5, PAL.cream); S.fillRRect(ctx, -11, 0, 22, 9, 4, PAL.cedarDark); S.fillRRect(ctx, -8, 7, 16, 3, 1, PAL.cedarDark); S.ellipse(ctx, 0, 0, 10, 2.5, PAL.cedar); break;      // a bowl with a mound of mochi
      case 'question': ctx.strokeStyle = PAL.stoneDark; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -4, 6, Math.PI, Math.PI * 2.4); ctx.lineTo(0, 4); ctx.stroke(); S.circle(ctx, 0, 10, 2.2, PAL.stoneDark); ctx.lineCap = 'butt'; break;
      case 'leaf': ctx.save(); ctx.rotate(-0.6); S.ellipse(ctx, 0, 0, 10, 5, PAL.red); ctx.restore(); ctx.strokeStyle = PAL.coinRim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-7, 5); ctx.lineTo(7, -5); ctx.stroke(); break;
      default: S.circle(ctx, 0, 0, 8, PAL.stoneDark);
    }
    ctx.restore();
  };
})(window.G);
