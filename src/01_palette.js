// Capy Springs - palette (GDD 11.3). The yellow family means money / yuzu / glow only; CTA vermilion is used for nothing but calls to action.
(function (G) {
  'use strict';
  const PAL = G.PAL = {
    cedar: '#C98A5B', cedarDark: '#8F5B36', plank: '#B57A4E', stone: '#B9B3A6', stoneDark: '#7F796D',
    waterHot: '#2FA6A0', waterHotDeep: '#238C87', ripple: '#8EE3DC', waterCold: '#B7C2CC', waterYuzu: '#E9C46A',
    cream: '#F6F1E7', pine: '#3F7D5A', pineDark: '#2C5A40', moss: '#4E9A6C', amber: '#FFC857', amberDeep: '#FF9A2E', cta: '#E4572E',
    skyDay: '#CFEAF2', skyDusk: '#E7A5A0', skyNight: '#2B2F5B', coin: '#FFD24A', coinHi: '#FFF1B0', coinRim: '#C99400',
    yuzu: '#F5C400', yuzuLeaf: '#2C5A40', ink: '#1F2430', red: '#D93A3A', fox: '#F08A3E', foxDark: '#8F4A1F',
    capy: '#9C6B43', capySnout: '#6E4A2E', capyDark: '#7A5233', duck: '#FFFFFF', duckBeak: '#F28C28', duckLine: '#7F796D',
    tanuki: '#7D6B5A', tanukiMask: '#3B2F28', happi: '#5C6F8A', straw: '#D9B36A', frog: '#A8E063', frogDark: '#2C5A40',
    boiler: '#2A2A2E', boilerLight: '#3E3E44', mist: '#F6F1E7', shadow: 'rgba(0,0,0,0.18)', lamp: '#6B5A4A', post: '#4A2E1F', cable: '#4A4A4A'
  };
  const rgbaCache = Object.create(null), mixCache = Object.create(null), rgbCache = Object.create(null);
  function rgb(hex) {
    let c = rgbCache[hex];
    if (!c) { c = rgbCache[hex] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
    return c;
  }
  PAL.rgb = rgb;
  // memoised rgba string builder; alpha is quantised to 1/64. Two-level lookup (hex -> quantum) so a cache hit allocates nothing (ARCH 18.1)
  PAL.rgba = function (hex, a) {
    const q = Math.round((a < 0 ? 0 : a > 1 ? 1 : a) * 64);
    let row = rgbaCache[hex]; if (!row) row = rgbaCache[hex] = new Array(65);
    let s = row[q];
    if (!s) { const c = rgb(hex); s = row[q] = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (q / 64) + ')'; }
    return s;
  };
  // memoised linear mix of two hex colours; t is quantised to 1/32. Three-level lookup (hexA -> hexB -> quantum), allocation-free on a hit
  PAL.mix = function (hexA, hexB, t) {
    const q = Math.round((t < 0 ? 0 : t > 1 ? 1 : t) * 32);
    let ra = mixCache[hexA]; if (!ra) ra = mixCache[hexA] = Object.create(null);
    let row = ra[hexB]; if (!row) row = ra[hexB] = new Array(33);
    let s = row[q];
    if (!s) {
      const a = rgb(hexA), b = rgb(hexB), f = q / 32;
      const r = Math.round(a[0] + (b[0] - a[0]) * f), g = Math.round(a[1] + (b[1] - a[1]) * f), bl = Math.round(a[2] + (b[2] - a[2]) * f);
      s = row[q] = 'rgb(' + r + ',' + g + ',' + bl + ')';
    }
    return s;
  };
})(window.G);
