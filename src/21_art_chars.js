// Capy Springs - characters: Kit, capy, duck, Pon, Kero, bubbles, silhouettes (ARCHITECTURE.md 11.2, GDD 3 / 11.5).
// Local space: feet at (0,0), +y down; `face` mirrors; every drawer applies translate/scale itself.
(function (G) {
  'use strict';
  const PAL = G.PAL, U = G.U;
  const Art = G.Art = G.Art || {};
  const Ch = Art.Ch = {};
  const A = () => Art.S;
  const TAU = Math.PI * 2;
  let P = PAL;                       // colour source; swapped to the ink map for silhouettes
  const INK = {}; for (const k in PAL) INK[k] = PAL.ink; INK.shadow = 'rgba(0,0,0,0)';

  // shared pose object - callers fill it, never allocate
  Ch.POSE = { x: 0, y: 0, face: 1, dir: 'side', walk: 0, moving: false, sx: 1, sy: 1, alpha: 1, inWater: null, sink: 0, hat: null, carry: null,
    bubble: null, bubbleScale: 1, shiver: false, lid: 0, tint: null, pose: null, poseT: 0, ring: null, t: 0, lag: 0, gold: false, z: 0, scarf: null, vip: false };
  Ch.resetPose = function (p) { p.dir = 'side'; p.walk = 0; p.moving = false; p.sx = 1; p.sy = 1; p.alpha = 1; p.inWater = null; p.sink = 0; p.hat = null; p.carry = null; p.bubble = null; p.bubbleScale = 1; p.shiver = false; p.lid = 0; p.tint = null; p.pose = null; p.poseT = 0; p.ring = null; p.lag = 0; p.gold = false; p.z = 0; p.scarf = null; p.vip = false; return p; };

  function begin(ctx, p, shadowRx, shadowRy) {
    ctx.save();
    if (p.alpha !== 1) ctx.globalAlpha = p.alpha;
    if (p.inWater) {
      const w = p.inWater;
      ctx.beginPath(); ctx.rect(w.x - w.w / 2, w.y - w.h / 2, w.w, Math.max(0, (p.y - 6) - (w.y - w.h / 2))); ctx.clip();
      ctx.translate(p.x, p.y + 8 + (p.sink || 0));
    } else {
      if (P.shadow !== INK.shadow) A().shadow(ctx, p.x, p.y - (p.z || 0) * 0 , shadowRx * (p.z ? Math.max(0.5, 1 - p.z / 60) : 1), shadowRy * (p.z ? Math.max(0.5, 1 - p.z / 60) : 1));
      ctx.translate(p.x, p.y - (p.z || 0));
    }
    const jit = p.shiver ? (U.hash(p.t * 20 | 0, p.x) - 0.5) * 4 : 0;
    ctx.translate(jit, 0);
    ctx.scale(p.face * p.sx, p.sy);
  }
  function end(ctx) { ctx.restore(); }
  function strokePath(ctx, color) { ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke(); }
  // exposed for season art files that add characters (same local space, same shadow / water clip / squash rules)
  Ch.begin = begin; Ch.end = end; Ch.strokePath = strokePath; Ch.colors = () => P;
  function lids(ctx, ex, ey, lid, color) {          // sleepy: a 2 px lid line drops over the dot in three steps
    if (lid <= 0) return;
    const d = lid >= 3 ? 0 : lid === 2 ? -1 : -2.2;
    A().line(ctx, ex - 4, ey + d, ex + 4, ey + d, color, 2);
  }
  function tintOver(ctx, p, x, y, w, h) { if (p.tint) { ctx.globalAlpha = p.tint.alpha; ctx.fillStyle = p.tint.color; ctx.fillRect(x, y, w, h); ctx.globalAlpha = p.alpha; } }
  // an eye with a catch-light, and a cheek blush (both vanish in silhouette mode where every colour is ink)
  function eye(ctx, x, y, r) { A().circle(ctx, x, y, r, P.ink); if (P.cream !== P.ink) A().circle(ctx, x + r * 0.35, y - r * 0.35, r * 0.38, P.cream); }
  function blush(ctx, x, y, r) { if (P.cream === P.ink) return; ctx.globalAlpha *= 0.38; A().circle(ctx, x, y, r, P.red); ctx.globalAlpha /= 0.38; }
  Ch.eye = eye; Ch.blush = blush;

  // ---------------- Kit (52 tall) ----------------
  Ch.kit = function (ctx, p, S) {
    const S_ = A(), t = p.t, moving = p.moving;
    const gold = p.gold || (S && S.lanterns && G.Seasons.finaleLit(S)) || G.Seasons.stars() >= 1;     // the headband stays gold in every later season
    begin(ctx, p, 16, 6);
    // tail: three strokes lagging opposite to velocity, cream tip
    const lag = p.lag || 0, wag = moving ? Math.sin(t * 14) * 3 : Math.sin(t * 2) * 1.5;
    ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = P.fox;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-8, -14); ctx.quadraticCurveTo(-18 - lag, -12 + i * 5, -24 - lag, -18 + i * 4 + wag); ctx.stroke(); }
    S_.circle(ctx, -25 - lag, -18 + wag, 3.5, P.cream);
    ctx.lineCap = 'butt';
    // legs: alternate +-3 px at 8 Hz when moving
    const lp = moving ? Math.sin(p.walk * TAU) * 3 : 0;
    S_.fillRRect(ctx, -7, -10 - Math.max(0, lp), 8, 10 + Math.max(0, lp), 3, P.foxDark);
    S_.fillRRect(ctx, 3, -10 - Math.max(0, -lp), 8, 10 + Math.max(0, -lp), 3, P.foxDark);
    // arms / poses
    if (p.pose === 'pump') { ctx.save(); ctx.translate(-10, -30); ctx.rotate(-0.6 - Math.sin(p.poseT * Math.PI) * 0.4); S_.fillRRect(ctx, -3, -12, 6, 14, 3, P.fox); ctx.restore(); }
    else if (p.pose === 'stretch') { const u = Math.sin(p.poseT * Math.PI); S_.fillRRect(ctx, -14, -30 - 10 * u, 6, 12, 3, P.fox); S_.fillRRect(ctx, 8, -30 - 10 * u, 6, 12, 3, P.fox); }
    else if (p.pose === 'wave') { ctx.save(); ctx.translate(10, -30); ctx.rotate(-0.8 + Math.sin(p.poseT * 12) * 0.3); S_.fillRRect(ctx, -3, -12, 6, 14, 3, P.fox); ctx.restore(); }
    // body + belly
    S_.rrect(ctx, -11, -30, 22, 22, 8); ctx.fillStyle = P.fox; ctx.fill(); strokePath(ctx, P.foxDark);
    S_.ellipse(ctx, 0, -18, 7, 6, P.cream);
    // head, ears
    const up = p.dir === 'up', down = p.dir === 'down';
    ctx.beginPath(); ctx.arc(0, -40, 12, 0, TAU); ctx.fillStyle = P.fox; ctx.fill(); strokePath(ctx, P.foxDark);
    S_.tri(ctx, -13.5, -49, -4.5, -49, -9, -61, P.fox); S_.tri(ctx, 4.5, -49, 13.5, -49, 9, -61, P.fox);
    S_.tri(ctx, -10.5, -57, -7.5, -57, -9, -61, P.foxDark); S_.tri(ctx, 7.5, -57, 10.5, -57, 9, -61, P.foxDark);
    // headband + dot (gold after the bridge)
    S_.fillRRect(ctx, -12, -45, 24, 6, 2, gold ? P.coin : P.cream); S_.circle(ctx, down ? 0 : 4, -42, 4, gold ? P.coinRim : P.red);
    // muzzle + eyes (hidden facing up)
    if (!up) {
      const mx = down ? 0 : 5;
      S_.ellipse(ctx, mx, -36, 5, 4, P.cream); S_.circle(ctx, mx + (down ? 0 : 2), -37, 2, P.foxDark);
      if (down) { eye(ctx, -5, -41, 3); eye(ctx, 5, -41, 3); blush(ctx, -9, -36, 2.5); blush(ctx, 9, -36, 2.5); }
      else { eye(ctx, 1, -41, 3); eye(ctx, 7, -41, 3); blush(ctx, 9, -35, 2.5); }
    }
    end(ctx);
  };

  // ---------------- Capybara (44 x 32) ----------------
  Ch.capy = function (ctx, p) {
    const S_ = A();
    begin(ctx, p, 20, 6);
    const lp = p.moving ? Math.sin(p.walk * TAU) * 2 : 0;
    // legs
    S_.fillRRect(ctx, -17, -6 - lp, 6, 6 + lp, 2, P.capyDark); S_.fillRRect(ctx, -9, -6 + lp, 6, 6 - lp, 2, P.capyDark);
    S_.fillRRect(ctx, 3, -6 - lp, 6, 6 + lp, 2, P.capyDark); S_.fillRRect(ctx, 11, -6 + lp, 6, 6 - lp, 2, P.capyDark);
    // thickness band + body
    S_.fillRRect(ctx, -22, -27, 44, 26, 11, P.capyDark);
    S_.rrect(ctx, -22, -30, 44, 26, 11); ctx.fillStyle = P.capy; ctx.fill(); strokePath(ctx, P.capyDark);
    // snout, ears, eyes
    const down = p.dir === 'down', up = p.dir === 'up';
    if (!up) {
      S_.fillRRect(ctx, down ? -7 : 10, down ? -20 : -24, 14, 12, 5, P.capySnout);
      S_.circle(ctx, -8, -31, 4, P.capyDark); S_.circle(ctx, 2, -31, 4, P.capyDark);
      const e1x = down ? -8 : 4, e2x = down ? 8 : 10, e1y = -22, e2y = down ? -22 : -20;
      eye(ctx, e1x, e1y, 3.2); eye(ctx, e2x, e2y, 3.2);
      if (down) { blush(ctx, -14, -16, 3); blush(ctx, 14, -16, 3); } else blush(ctx, 2, -15, 3);
      lids(ctx, e1x, e1y, p.lid, P.capyDark); lids(ctx, e2x, e2y, p.lid, P.capyDark);
    } else { S_.circle(ctx, -8, -31, 4, P.capyDark); S_.circle(ctx, 2, -31, 4, P.capyDark); }
    if (p.scarf) { S_.fillRRect(ctx, 1, -29, 7, 22, 3, p.scarf); S_.fillRRect(ctx, 2, -22, 5, 2, 1, P.cream); S_.fillRRect(ctx, 2, -15, 5, 2, 1, P.cream); S_.fillRRect(ctx, 4, -8, 5, 9, 2, p.scarf); }
    tintOver(ctx, p, -24, -34, 48, 34);
    if (p.hat) (Ch.hats[p.hat] || hatYuzu)(ctx, -2, -38);
    end(ctx);
  };
  Ch.hats = {};      // hat drawers by name; a season may replace 'yuzu'
  function hatYuzu(ctx, x, y) {
    const S_ = A();
    S_.ellipse(ctx, x + 4, y - 8, 6, 3, P.yuzuLeaf); S_.ellipse(ctx, x - 4, y - 8, 6, 3, P.yuzuLeaf);
    ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fillStyle = P.yuzu; ctx.fill(); strokePath(ctx, P.coinRim);
    ctx.strokeStyle = P.coinRim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 6, 0.4, 1.3); ctx.stroke();
  }
  Ch.hats.yuzu = hatYuzu;

  // ---------------- Duck (28 x 30) ----------------
  Ch.duck = function (ctx, p) {
    const S_ = A();
    begin(ctx, p, 12, 4);
    const lp = p.moving ? Math.sin(p.walk * TAU * 2) * 2 : 0;
    A().line(ctx, -5, 0, -8, -3 - lp, P.duckBeak, 2); A().line(ctx, 5, 0, 8, -3 + lp, P.duckBeak, 2);
    ctx.beginPath(); ctx.arc(0, -14, 13, 0, TAU); ctx.fillStyle = P.duck; ctx.fill(); strokePath(ctx, P.duckLine);
    S_.ellipse(ctx, -3, -13, 7, 3.5, P.stone);
    const up = p.dir === 'up', down = p.dir === 'down', hx = down ? 0 : 7;
    ctx.beginPath(); ctx.arc(hx, -29, 8, 0, TAU); ctx.fillStyle = P.duck; ctx.fill(); strokePath(ctx, P.duckLine);
    if (!up) {
      if (down) { S_.tri(ctx, -4, -27, 4, -27, 0, -21, P.duckBeak); eye(ctx, -3.5, -31, 2.6); eye(ctx, 3.5, -31, 2.6); blush(ctx, -6, -26, 2); blush(ctx, 6, -26, 2); }
      else { S_.tri(ctx, 13, -31.5, 13, -26.5, 22, -29, P.duckBeak); eye(ctx, 8, -31, 2.6); blush(ctx, 10, -26, 2); }
    }
    tintOver(ctx, p, -14, -38, 30, 38);
    if (p.hat) (Ch.hats[p.hat] || hatYuzu)(ctx, hx - 1, -40);
    end(ctx);
  };

  // ---------------- Pon the tanuki (44) ----------------
  Ch.pon = function (ctx, p) {
    const S_ = A();
    begin(ctx, p, 16, 6);
    const lp = p.moving ? Math.sin(p.walk * TAU) * 2 : 0;
    S_.fillRRect(ctx, -10, -6 - lp, 7, 6 + lp, 2, P.tanukiMask); S_.fillRRect(ctx, 3, -6 + lp, 7, 6 - lp, 2, P.tanukiMask);
    ctx.beginPath(); ctx.arc(0, -18, 16, 0, TAU); ctx.fillStyle = P.tanuki; ctx.fill(); strokePath(ctx, P.tanukiMask);
    S_.fillRRect(ctx, -15, -24, 30, 16, 6, P.happi);
    S_.circle(ctx, 0, -14, 9, P.cream);
    S_.fillRRect(ctx, -12, -26, 24, 7, 3, P.tanukiMask);
    S_.circle(ctx, -6, -23, 3.2, P.cream); S_.circle(ctx, 6, -23, 3.2, P.cream); eye(ctx, -6, -23, 2); eye(ctx, 6, -23, 2);
    S_.circle(ctx, 4, -19, 2, P.tanukiMask); blush(ctx, -9, -16, 2.2); blush(ctx, 9, -16, 2.2);
    if (p.pose === 'yawn') { const ry = 1 + 3 * Math.sin(Math.min(1, p.poseT) * Math.PI); S_.ellipse(ctx, 2, -13, 3, ry, P.tanukiMask); }
    S_.ellipse(ctx, 0, -33, 22, 6, P.straw); S_.fillRRect(ctx, -10, -41, 20, 9, 4, P.straw); S_.fillRRect(ctx, -10, -35, 20, 3, 1, P.red);
    if (p.carry === 'log') { ctx.save(); ctx.translate(12, -30); ctx.rotate(0.35); S_.fillRRect(ctx, -13, -5, 26, 10, 4, P.cedarDark); S_.circle(ctx, 13, 0, 4, P.cedar); ctx.restore(); }
    end(ctx);
  };

  // ---------------- Kero the frog (36) ----------------
  Ch.kero = function (ctx, p) {
    const S_ = A();
    begin(ctx, p, 12, 5);
    ctx.beginPath(); ctx.arc(0, -14, 13, 0, TAU); ctx.fillStyle = P.frog; ctx.fill(); strokePath(ctx, P.frogDark);
    S_.ellipse(ctx, 0, -11, 8, 6, P.cream);
    S_.circle(ctx, -6, -25, 5, P.cream); S_.circle(ctx, 6, -25, 5, P.cream); eye(ctx, -6, -25, 2.5); eye(ctx, 6, -25, 2.5); blush(ctx, -9, -14, 2.2); blush(ctx, 9, -14, 2.2);
    ctx.strokeStyle = P.frogDark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, -12); ctx.quadraticCurveTo(0, -7, 7, -12); ctx.stroke();
    S_.fillRRect(ctx, -12, -8, 24, 6, 3, P.red);
    if (p.carry === 'yuzu') { S_.circle(ctx, 0, -36, 8, P.yuzu); S_.ellipse(ctx, 4, -43, 6, 3, P.yuzuLeaf); }
    end(ctx);
  };

  // guest kinds are roles; the pack's `art` names the drawer (a season art file may add Ch.<art>)
  // ---------------- Kaa the crow (micro-event) ----------------
  // (x, y) = feet; fly 0..1 while leaving (wings beat, fades); ring = remaining tap-window fraction while landed
  Ch.kaa = function (ctx, x, y, fly, t, ring) {
    const S_ = A();
    ctx.save(); if (fly > 0) ctx.globalAlpha = 1 - fly * fly;
    if (fly === 0) S_.shadow(ctx, x, y, 11, 4);
    ctx.translate(x, y);
    const flap = fly > 0 ? Math.sin(t * 40) * 0.8 : Math.sin(t * 3) * 0.05;
    ctx.fillStyle = P.ink;
    ctx.beginPath(); ctx.ellipse(0, -14, 13, 9, 0, 0, TAU); ctx.fill();                       // body
    S_.tri(ctx, -12, -12, -22, -4, -6, -8, P.ink);                                          // tail
    ctx.save(); ctx.translate(-2, -17); ctx.rotate(-flap); S_.ellipse(ctx, -6, 0, 11, 4, P.ink); ctx.restore();   // wing
    S_.circle(ctx, 11, -22, 7, P.ink);                                                       // head
    S_.tri(ctx, 16, -24, 16, -19, 25, -21, P.duckBeak);                                      // beak
    S_.circle(ctx, 12, -24, 2, P.cream); S_.circle(ctx, 12.5, -24, 1, P.ink);
    A().line(ctx, -5, 0, -5, -6, P.duckBeak, 2); A().line(ctx, 4, 0, 4, -6, P.duckBeak, 2);
    ctx.restore();
    if (ring > 0) A().ring(ctx, x, y - 22, 30, ring, 4, P.cta, P.rgba(P.cream, 0.5));
  };

  Ch.guest = function (ctx, p, kind) { const d = G.DATA.GUESTS[kind], fn = (d && d.art && Ch[d.art]) || (kind === 'duck' ? Ch.duck : Ch.capy); fn(ctx, p); };

  // bubble above a guest: p.bubble = bath | mochi | snow | sweat | heart; p.bubbleScale grows the sweat drop
  Ch.bubble = function (ctx, p) {
    const S_ = A(), b = p.bubble; if (!b) return;
    const top = p.y - (p.inWater ? 30 : 46);
    if (b === 'sweat') { const sc = p.bubbleScale || 1; S_.icon(ctx, 'sweat', p.x + 16 * p.face, top - 2, 16 * sc); return; }
    if (b === 'heart') { S_.icon(ctx, 'heart', p.x, top - 6, 16); return; }
    const w = 36, h = 32, bx = p.x + 6, by = top - 20;
    S_.bubble(ctx, bx, by, w, h, true);
    S_.icon(ctx, b, bx, by - 1, 24);
  };

  // flat-ink render for the smoke page's silhouette row
  Ch.silhouette = function (ctx, kind, x, y, scale, S) {
    const p = Ch.resetPose(Ch.POSE); p.x = x; p.y = y; p.sx = p.sy = scale; p.face = 1;
    P = INK;
    try {
      if (kind === 'kit') Ch.kit(ctx, p, S); else if (kind === 'capy') Ch.capy(ctx, p); else if (kind === 'duck') Ch.duck(ctx, p); else if (kind === 'pon') Ch.pon(ctx, p); else if (kind === 'kero') Ch.kero(ctx, p);
    } finally { P = PAL; }
  };
  Ch.spriteCache = { enabled: false, build: function () {} };
})(window.G);
