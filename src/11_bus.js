// Capy Springs - synchronous pub/sub (ARCHITECTURE.md 16). Handlers run in subscription order; exceptions are caught and warnOnce'd.
(function (G) {
  'use strict';
  const U = G.U;
  const map = Object.create(null);
  const Bus = G.Bus = {};
  Bus.on = function (name, fn) { (map[name] || (map[name] = [])).push(fn); return fn; };
  Bus.off = function (name, fn) { const a = map[name]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
  Bus.emit = function (name, payload) {
    const a = map[name]; if (!a) return;
    for (let i = 0; i < a.length; i++) {
      try { a[i](payload); } catch (e) { U.warnOnce('bus:' + name, 'handler threw: ' + (e && e.message)); }
    }
  };
  Bus.clear = function () { for (const k in map) delete map[k]; };
})(window.G);
