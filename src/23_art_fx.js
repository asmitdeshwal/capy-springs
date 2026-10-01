// Capy Springs - FX art: steam, ripples, particles, pops, koban, halo sprite blit, wash, arrow, drag hint (ARCHITECTURE.md 11.4).
(function (G) {
  'use strict';
  const PAL = G.PAL, U = G.U, C = G.C;
  const Art = G.Art = G.Art || {};
  const S = () => Art.S;
  const FX = Art.FX = {};
  const TAU = Math.PI * 2;

  FX.steam = function (ctx, p) {
    const k = p.t / p.life, a = p.alpha * (1 - k);
    if (a <= 0.01) return;
    ctx.globalAlpha = a; ctx.fillStyle = PAL.cream;
    ctx.beginPath(); ctx.arc(p.x + Math.sin(p.t * 2 + p.drift) * 6, p.y - p.t * C.STEAM_RISE, p.r * (0.7 + k * 0.6), 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  };
  FX.ripple = function (ctx, r) {
    const k = r.t / r.life, rad = r.r0 + (r.r1 - r.r0) * k, a = 0.5 * (1 - k);
    if (a <= 0.01) return;
    ctx.globalAlpha = a; ctx.strokeStyle = r.gold ? PAL.yuzu : PAL.ripple; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * 0.55, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  };
  // particle kinds: dust | puff | confetti | drop | heart | sparkle | koban (offering toss) | strip (unwrap)
  FX.part = function (ctx, p) {
    const k = p.t / p.life, A = S();
    switch (p.kind) {
      case 'dust': ctx.globalAlpha = 0.35 * (1 - k); A.circle(ctx, p.x, p.y, p.size * (1 + k * 1.5), PAL.cream); ctx.globalAlpha = 1; break;
      case 'puff': ctx.globalAlpha = 0.6 * (1 - k); A.circle(ctx, p.x, p.y - p.z, p.size * (0.6 + k), PAL.cream); ctx.globalAlpha = 1; break;
      case 'confetti':
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.fillStyle = p.color || PAL.amber;
        ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(p.rot + p.t * 6); ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size); ctx.restore();
        ctx.globalAlpha = 1; break;
      case 'drop': ctx.globalAlpha = 1 - k; A.circle(ctx, p.x, p.y - p.z, p.size, PAL.ripple); ctx.globalAlpha = 1; break;
      case 'heart': ctx.globalAlpha = k < 0.8 ? 1 : (1 - k) / 0.2; A.icon(ctx, 'heart', p.x + Math.sin(p.t * 4) * 3, p.y - p.t * 26, p.size); ctx.globalAlpha = 1; break;
      case 'sparkle': {
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = PAL.coinHi; ctx.lineWidth = 2; const r = p.size * (1 - k * 0.5), x = p.x, y = p.y - p.z;
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke(); ctx.globalAlpha = 1; break;
      }
      case 'koban': {   // offering toss: arc from (x, y) to (x1, y1)
        const x = p.x + (p.x1 - p.x) * k, y = p.y + (p.y1 - p.y) * k - 4 * 26 * k * (1 - k);
        FX.kobanAt(ctx, x, y, 0.8); break;
      }
      case 'strip': {   // unwrap paper strip: translate +12 y, rotate +-8 deg alternately, fade
        ctx.globalAlpha = 1 - k; ctx.fillStyle = PAL.cream;
        ctx.save(); ctx.translate(p.x + p.size / 2, p.y + 12 * k); ctx.rotate(p.rot * k); ctx.fillRect(-p.size / 2, 0, p.size, p.z); ctx.restore();
        ctx.globalAlpha = 1; break;
      }
    }
  };
  // pop kinds: plus ("+N"), chain ("SPLASH x3!"), yuzu ("YUZU BATH!"), label
  FX.pop = function (ctx, p) {
    const k = p.t / p.dur, A = S();
    if (k >= 1) return;
    let sc = 1;
    if (p.kind !== 'plus') { const u = Math.min(1, p.t / 0.25); sc = U.easeOutBack(u); }
    const a = k < 0.6 ? 1 : (1 - k) / 0.4;
    const y = p.y - (p.kind === 'plus' ? p.rise * U.easeOutQuad(k) : 6 * k);
    ctx.save(); ctx.translate(p.x, y); ctx.scale(sc, sc); ctx.globalAlpha = a;
    A.text(ctx, p.text, 0, 0, p.size, p.color || PAL.coin, POP_OPTS);
    ctx.restore(); ctx.globalAlpha = 1;
  };
  const POP_OPTS = { stroke: PAL.ink, lw: 3 };
  FX.kobanAt = function (ctx, x, y, s) {
    const A = S();
    A.ellipse(ctx, x, y, 8 * s, 5.5 * s, PAL.coinRim); A.ellipse(ctx, x, y, 6.5 * s, 4 * s, PAL.coin);
    A.fillRRect(ctx, x - 4 * s, y - 2 * s, 6 * s, 2 * s, s, PAL.coinHi);
  };
  FX.koban = function (ctx, c, z) { FX.kobanAt(ctx, c.x, c.y - (z || 0), c.sx || 1); };
  FX.kobanShadow = function (ctx, c) { const k = Math.max(0.3, 1 - c.z / 80); S().shadow(ctx, c.x, c.y, 8 * k, 4 * k, 0.18 * k); };
  // halo: one drawImage of the pre-rendered sprite scaled to 2r x 2r under globalAlpha; never a gradient at draw time
  FX.halo = function (ctx, sprite, x, y, r, alpha) {
    if (!sprite || alpha <= 0.01) return;
    ctx.globalAlpha = alpha; ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1;
  };
  // rush wash: a thick band of steam rolling across the decks; p = { t, life, y }
  FX.wash = function (ctx, p, camY, H) {
    const k = p.t / p.life, a = 0.35 * Math.sin(Math.PI * Math.min(1, k));
    if (a <= 0.01) return;
    ctx.globalAlpha = a; ctx.fillStyle = PAL.cream;
    for (let i = 0; i < 6; i++) { const x = ((i * 137 + k * 400) % 640) - 50, y = camY + H * 0.3 + Math.sin(i * 1.7 + k * 3) * 90 + H * 0.3; ctx.beginPath(); ctx.ellipse(x, y, 120, 46, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  // the next arrow: 26 px CTA triangle with a 3 px cream stroke, rotated toward the target
  FX.arrow = function (ctx, x, y, angle, alpha, scale) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-11, -11); ctx.lineTo(-6, 0); ctx.lineTo(-11, 11); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.strokeStyle = PAL.cream; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = PAL.cta; ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  };
  // ghost thumb: cream 40% circle r 36 sliding along (dx, dy)
  FX.dragHint = function (ctx, x, y, dx, dy, alpha) {
    ctx.globalAlpha = alpha; S().circle(ctx, x + dx, y + dy, 36, PAL.rgba('#F6F1E7', 0.4));
    ctx.strokeStyle = PAL.rgba('#F6F1E7', 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 40, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  };
})(window.G);
