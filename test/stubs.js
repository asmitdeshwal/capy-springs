// Capy Springs - DOM / canvas / localStorage stubs for the headless harness (ARCHITECTURE.md 17.1).
'use strict';
const noop = () => {};
const CTX_METHODS = ['save', 'restore', 'translate', 'scale', 'rotate', 'transform', 'setTransform', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'arcTo', 'ellipse', 'rect',
  'quadraticCurveTo', 'bezierCurveTo', 'fill', 'stroke', 'clip', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'drawImage', 'setLineDash'];
function stubCtx() {
  const ctx = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, globalCompositeOperation: 'source-over', lineCap: 'butt', lineJoin: 'miter',
    measureText: s => ({ width: String(s).length * 8 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }) };
  for (const m of CTX_METHODS) ctx[m] = noop;
  return ctx;
}
function stubCanvas() {
  return { width: 540, height: 960, style: {}, getContext: () => stubCtx(), addEventListener: noop, removeEventListener: noop, setPointerCapture: noop, releasePointerCapture: noop,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 540, height: 960 }) };
}
function define(name, value) { try { Object.defineProperty(globalThis, name, { value, writable: true, configurable: true, enumerable: true }); } catch (e) { globalThis[name] = value; } }
function install() {
  define('window', globalThis);
  globalThis.innerWidth = 540; globalThis.innerHeight = 960; globalThis.devicePixelRatio = 1;
  define('addEventListener', noop); define('removeEventListener', noop);
  define('requestAnimationFrame', () => 0); define('cancelAnimationFrame', noop);
  define('location', { search: '' });
  const store = new Map();
  define('localStorage', { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => { store.set(k, String(v)); }, removeItem: k => { store.delete(k); }, clear: () => store.clear(),
    key: i => { const ks = Array.from(store.keys()); return i < ks.length ? ks[i] : null; }, get length() { return store.size; } });
  define('document', { getElementById: id => id === 'game' ? stubCanvas() : { style: {} }, createElement: tag => tag === 'canvas' ? stubCanvas() : { style: {} },
    addEventListener: noop, removeEventListener: noop, visibilityState: 'visible', hidden: false });
  define('getComputedStyle', () => ({ paddingTop: '0px', paddingBottom: '0px' }));
  define('navigator', { vibrate: () => true, userAgent: 'headless', maxTouchPoints: 0 });
  if (typeof globalThis.performance === 'undefined') define('performance', { now: () => Date.now() });
  define('AudioContext', undefined); define('webkitAudioContext', undefined);
}
module.exports = { install, stubCtx, stubCanvas };
