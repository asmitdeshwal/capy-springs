// Capy Springs - utilities (ARCHITECTURE.md 19.5): math, easing, seeded RNG, hash, geometry, pools, path ring buffer, warnOnce.
(function (G) {
  'use strict';
  const U = G.U = {};
  U.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, v) => a === b ? 0 : (v - a) / (b - a);
  U.smooth = t => t * t * (3 - 2 * t);
  U.easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1, u = t - 1; return 1 + c3 * u * u * u + c1 * u * u; };
  U.easeInQuad = t => t * t;
  U.easeOutQuad = t => 1 - (1 - t) * (1 - t);
  U.easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) * (-2 * t + 2)) / 2;
  U.sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
  U.hypot = (x, y) => Math.sqrt(x * x + y * y);
  U.dist = (ax, ay, bx, by) => Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
  U.dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
  U.angle = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  U.wrap = (v, lo, hi) => { const r = hi - lo; v = (v - lo) % r; return (v < 0 ? v + r : v) + lo; };
  U.median = function (arr) { const s = arr.slice().sort((a, b) => a - b); const n = s.length; if (!n) return 0; return n & 1 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  U.fmt1 = n => (Math.round(n * 10) / 10).toFixed(1);

  // ---- seeded RNG (xorshift32) - simulation only. Presentation jitter uses U.hash or Math.random. ----
  let rng = 0x9E3779B9 | 0;
  U.seed = function (n) { rng = (n | 0) || 1; };
  U.rngState = () => rng;
  function next() { rng ^= rng << 13; rng ^= rng >>> 17; rng ^= rng << 5; rng |= 0; return (rng >>> 0) / 4294967296; }
  U.rand = function (a, b) {
    const r = next();
    if (a === undefined) return r;
    if (b === undefined) { if (Array.isArray(a)) return a[0] + r * (a[1] - a[0]); return r * a; }
    return a + r * (b - a);
  };
  U.randInt = function (a, b) { if (Array.isArray(a)) { b = a[1]; a = a[0]; } return a + Math.floor(next() * (b - a + 1)); };
  U.pick = arr => arr[Math.floor(next() * arr.length)];
  U.randDisc = function (r, out) { const a = next() * Math.PI * 2, d = Math.sqrt(next()) * r; out.x = Math.cos(a) * d; out.y = Math.sin(a) * d; return out; };
  // cheap deterministic float hash in [0,1) - safe in draw paths
  U.hash = function (a, b) { const s = Math.sin(a * 12.9898 + (b || 0) * 78.233) * 43758.5453; return s - Math.floor(s); };

  // ---- pools: fixed capacity, swap-remove; iterate for (i = 0; i < pool.n; i++) ----
  U.pool = function (cap, factory) {
    const items = new Array(cap);
    for (let i = 0; i < cap; i++) items[i] = factory(i);
    return {
      items, n: 0, cap,
      alloc() { if (this.n >= this.cap) return null; return this.items[this.n++]; },
      free(i) { if (i < 0 || i >= this.n) return; this.n--; const t = this.items[i]; this.items[i] = this.items[this.n]; this.items[this.n] = t; },
      clear() { this.n = 0; }
    };
  };

  // ---- geometry; rects are {x0,y0,x1,y1}; defs are centre+size {x,y,w,h} ----
  U.rectHas = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  U.circleHit = (cx, cy, r, x, y) => (cx - x) * (cx - x) + (cy - y) * (cy - y) <= r * r;
  U.rectExpand = function (r, pad, out) { out.x0 = r.x0 - pad; out.y0 = r.y0 - pad; out.x1 = r.x1 + pad; out.y1 = r.y1 + pad; return out; };
  U.rectCenter = function (def, out) { out.x0 = def.x - def.w / 2; out.y0 = def.y - def.h / 2; out.x1 = def.x + def.w / 2; out.y1 = def.y + def.h / 2; return out; };
  U.defHas = (def, x, y) => x >= def.x - def.w / 2 && x <= def.x + def.w / 2 && y >= def.y - def.h / 2 && y <= def.y + def.h / 2;
  // hop = { x0, y0, x1, y1, t, dur, h } -> out {x, y, z}; z = 4 h t (1 - t)
  U.hopPos = function (hop, out) {
    const t = hop.dur > 0 ? U.clamp(hop.t / hop.dur, 0, 1) : 1;
    out.x = hop.x0 + (hop.x1 - hop.x0) * t; out.y = hop.y0 + (hop.y1 - hop.y0) * t; out.z = 4 * hop.h * t * (1 - t);
    return out;
  };
  // moves obj toward (tx, ty) by speed * dt; returns true when arrived (snaps)
  U.moveToward = function (obj, tx, ty, speed, dt) {
    const dx = tx - obj.x, dy = ty - obj.y, d = Math.sqrt(dx * dx + dy * dy), step = speed * dt;
    if (d <= step || d < 0.0001) { obj.x = tx; obj.y = ty; return true; }
    obj.x += dx / d * step; obj.y += dy / d * step; return false;
  };

  // ---- breadcrumb path ring buffer: {xs, ys, seg, head, n, cap}; seg[i] = distance from sample i-1 to sample i ----
  U.pathPush = function (path, x, y) {
    const prev = path.head, cap = path.cap;
    const head = path.n === 0 ? 0 : (prev + 1) % cap;
    path.xs[head] = x; path.ys[head] = y;
    path.seg[head] = path.n === 0 ? 0 : U.dist(path.xs[prev], path.ys[prev], x, y);
    path.head = head; path.n = Math.min(path.n + 1, cap);
  };
  // point D px behind (kx, ky) along the path; returns true when the path is long enough, else out is the oldest point and out.rem the shortfall
  U.pathPointAt = function (path, kx, ky, D, out) {
    let px = kx, py = ky, acc = 0, idx = path.head, cap = path.cap;
    for (let k = 0; k < path.n; k++) {
      const sx = path.xs[idx], sy = path.ys[idx];
      const len = k === 0 ? U.dist(px, py, sx, sy) : path.seg[(idx + 1) % cap];
      if (acc + len >= D) { const t = len > 0 ? (D - acc) / len : 0; out.x = px + (sx - px) * t; out.y = py + (sy - py) * t; out.rem = 0; return true; }
      acc += len; px = sx; py = sy; idx = (idx - 1 + cap) % cap;
    }
    out.x = px; out.y = py; out.rem = D - acc; return false;
  };

  // ---- warnOnce: never throw inside the loop; log once per key and let the harness count it ----
  U.warned = Object.create(null); U.warnCount = 0;
  U.warnOnce = function (key, msg) {
    if (U.warned[key]) return;
    U.warned[key] = true; U.warnCount++;
    if (typeof console !== 'undefined' && console.warn) console.warn('[capy] ' + key + ': ' + msg);
  };
})(window.G);
