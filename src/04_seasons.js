// Capy Springs - seasons: the registry of season packs, the cross-season meta record, pack application at boot (ARCHITECTURE.md 20, GDD 17).
// Loads after the Season 1 data files and any G.PACKS[n] pack files, before every system, so each system captures the CURRENT season's data.
// A season pack = { id, key, name, subtitle, teaser, finale (lantern id), saveKey, data: { MAP, BATHS, ... }, pal: {}, config: {}, text: {}, words: {} }.
(function (G) {
  'use strict';
  const Seasons = G.Seasons = { META_KEY: 'capysprings.meta', META_VERSION: 1, list: [], byId: {}, meta: null, current: null };
  G.PACKS = G.PACKS || {};

  // Season 1 is whatever the 02_data_* files loaded; it registers itself here with no overrides
  const S1 = { id: 1, key: 's1', name: 'The Deck', subtitle: 'Hot springs on the mountainside', teaser: 'Lead capybaras into steaming baths.',
               finale: 'bridge', saveKey: 'capysprings.save', data: null, pal: null, config: null, text: {}, words: {} };
  Seasons.list.push(S1); Seasons.byId[1] = S1;
  const ids = Object.keys(G.PACKS).map(Number).sort((a, b) => a - b);
  // a hidden pack stays loadable (dev shortcut, harness) but is not in the list the menus and the travel card show
  for (let i = 0; i < ids.length; i++) { const p = G.PACKS[ids[i]]; p.id = ids[i]; p.saveKey = p.saveKey || ('capysprings.save.s' + p.id); Seasons.byId[p.id] = p; if (!p.hidden) Seasons.list.push(p); }

  // ---- meta record (localStorage, separate from the per-season saves): which season is current, which are unlocked / finished, completion % ----
  function defaultMeta() { return { v: Seasons.META_VERSION, season: 1, unlocked: { 1: true }, done: {}, progress: {}, visited: { 1: true } }; }
  Seasons.readMeta = function () {
    let m = null;
    try { const raw = localStorage.getItem(Seasons.META_KEY); if (raw) m = JSON.parse(raw); } catch (e) { m = null; }
    const d = defaultMeta();
    if (!m || typeof m !== 'object' || typeof m.season !== 'number') return d;
    d.season = m.season | 0; if (!Seasons.byId[d.season]) d.season = 1;
    for (const k of ['unlocked', 'done', 'progress', 'visited']) if (m[k] && typeof m[k] === 'object') d[k] = Object.assign({}, m[k]);
    d.unlocked[1] = true;
    return d;
  };
  Seasons.writeMeta = function () { try { localStorage.setItem(Seasons.META_KEY, JSON.stringify(Seasons.meta)); return true; } catch (e) { return false; } };
  Seasons.clearMeta = function () { Seasons.meta = defaultMeta(); try { localStorage.removeItem(Seasons.META_KEY); } catch (e) { /* ignore */ } };

  // ---- pick the season for this page load and apply its pack ----
  Seasons.meta = Seasons.readMeta();
  let want = typeof G.SEASON_ID === 'number' ? G.SEASON_ID : (G.HEADLESS ? 1 : Seasons.meta.season), forced = false;
  try { const m = /[?&]season=(\d+)/.exec(location.search); if (m) { want = parseInt(m[1], 10); forced = true; } } catch (e) { /* no location (headless) */ }   // dev shortcut: ?season=2
  if (!Seasons.byId[want] || (!G.HEADLESS && !forced && (!Seasons.meta.unlocked[want] || Seasons.byId[want].hidden))) want = 1;
  if (!G.HEADLESS && Seasons.meta.season !== want && !forced) { Seasons.meta.season = want; Seasons.writeMeta(); }   // a save pointing at a hidden place comes home
  const cur = Seasons.current = G.SEASON = Seasons.byId[want];
  if (cur.data) for (const k in cur.data) G.DATA[k] = cur.data[k];
  if (cur.pal) for (const k in cur.pal) G.PAL[k] = cur.pal[k];
  if (cur.config) for (const k in cur.config) G.C[k] = cur.config[k];
  cur.text = cur.text || {}; cur.words = cur.words || {};

  // ---- small lookups used by the systems ----
  Seasons.text = (key, fallback) => (cur.text[key] !== undefined ? cur.text[key] : fallback);     // banners, pops, card copy
  Seasons.word = w => (w && cur.words[w]) || w;                                                      // the arrow's one-word prompts
  Seasons.firstLit = S => S.lanterns[G.DATA.LANTERNS[0].id].level >= 1;                             // "the first lantern is lit" gate (tutorial TAP, night)
  Seasons.finaleLit = S => { const L = S.lanterns[cur.finale]; return !!L && L.level >= 1; };
  Seasons.isUnlocked = id => !!Seasons.meta.unlocked[id];
  Seasons.isDone = id => !!Seasons.meta.done[id];
  Seasons.stars = function () { let n = 0; for (const k in Seasons.meta.done) if (Seasons.meta.done[k] && Number(k) !== cur.id) n++; return n; };   // finished OTHER seasons
  Seasons.next = () => Seasons.byId[cur.id + 1] || null;
  Seasons.canTravel = id => !!Seasons.byId[id] && id !== cur.id && Seasons.isUnlocked(id);

  // completion: lantern levels + upgrade levels over their maxima (what the Seasons card shows, so nobody is stuck at 96 % wondering why)
  Seasons.progress = function (S) {
    const D = G.DATA; let have = 0, max = 0;
    for (let i = 0; i < D.LANTERNS.length; i++) { const d = D.LANTERNS[i]; max += d.costs.length; have += Math.min(d.costs.length, S.lanterns[d.id].level); }
    for (let i = 0; i < D.SHEET_STATIONS.length; i++) { const id = D.SHEET_STATIONS[i], t = D.UPGRADES[id], l = S.levels[id]; if (!t) continue; for (const k in t) { max += t[k].max; have += Math.min(t[k].max, l[k] || 0); } }
    return max > 0 ? have / max : 0;
  };
  // what is still missing, for the Seasons card: [{ label, n }] of unlit lantern levels and unbought upgrades
  Seasons.missing = function (S, out) {
    const D = G.DATA; out.length = 0;
    for (let i = 0; i < D.LANTERNS.length; i++) { const d = D.LANTERNS[i], n = d.costs.length - S.lanterns[d.id].level; if (n > 0) out.push({ label: d.label, n }); }
    for (let i = 0; i < D.SHEET_STATIONS.length; i++) { const id = D.SHEET_STATIONS[i], t = D.UPGRADES[id]; if (!t) continue; let n = 0; for (const k in t) n += Math.max(0, t[k].max - (S.levels[id][k] || 0)); if (n > 0) out.push({ label: (S.baths[id] ? S.baths[id].def.name : id) + ' upgrades', n }); }
    return out;
  };
  Seasons.recordProgress = function (S) {
    const m = Seasons.meta; m.progress[cur.id] = Math.round(Seasons.progress(S) * 100);
    if (Seasons.finaleLit(S)) m.done[cur.id] = true;
    m.visited[cur.id] = true;
    Seasons.writeMeta();
  };
  const evUnlock = { id: 0 };
  // lantern effect 'travel:n' (silent while a save re-derives)
  Seasons.unlock = function (id, opts) {
    const was = !!Seasons.meta.unlocked[id];
    Seasons.meta.unlocked[id] = true; Seasons.writeMeta();
    if (!was && !(opts && opts.silent) && G.Bus) { evUnlock.id = id; G.Bus.emit('season:unlock', evUnlock); }
  };
  Seasons.markDone = function (S) { if (!Seasons.meta.done[cur.id]) { Seasons.meta.done[cur.id] = true; Seasons.writeMeta(); } };
  Seasons.resetCurrent = function () { delete Seasons.meta.done[cur.id]; Seasons.meta.progress[cur.id] = 0; Seasons.writeMeta(); };   // a reset wipes the meta too, not only the save
  // leave for another season: save this one, point the meta at the other, reload (the pack is applied at load time, so a reload is the switch)
  Seasons.travel = function (S, id) {
    if (!Seasons.canTravel(id)) return false;
    if (S && G.Save) { G.Save.write(S); }
    Seasons.meta.season = id; Seasons.meta.visited[id] = true; Seasons.writeMeta();
    if (G.HEADLESS || (G.Game && G.Game.headless)) return true;
    try { location.reload(); } catch (e) { /* ignore */ }
    return true;
  };
})(window.G);
