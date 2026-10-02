#!/usr/bin/env node
// Capy Springs - a debugging aid: run the headless bot to a time and print what Kit carries and where the arrow points, once a second.
// node test/trace.js --seed 11 --from 770 --to 815
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const argv = process.argv.slice(2), opt = { seed: 7, from: 0, to: 60, season: 1 };
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a === '--seed') opt.seed = Number(argv[++i]); else if (a === '--from') opt.from = Number(argv[++i]); else if (a === '--to') opt.to = Number(argv[++i]); else if (a === '--season') opt.season = Number(argv[++i]); }
const stubs = require('./stubs.js'); stubs.install();
globalThis.G = { HEADLESS: true, SEASON_ID: opt.season };
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const s of Array.from(html.matchAll(/'(src\/[^']+\.js)'/g)).map(m => m[1])) vm.runInThisContext(fs.readFileSync(path.join(root, s), 'utf8'), { filename: s });
const G = globalThis.G, C = G.C, U = G.U;
U.seed(opt.seed); G.Input.headless = true;
const S = G.Game.boot({ headless: true }); S.mode = 'play'; S.introT = C.INTRO_T;
const bot = require('./bot.js')(G), DT = 1 / 60;
let simT = 0, next = opt.from;
while (simT < opt.to) {
  bot.step(S, DT); G.Game.step(DT); simT += DT;
  if (simT >= next) {
    next += 1;
    const a = S.ui.arrow, trail = S.trail.map(n => n.kind === 'guest' ? 'g' : n.kind[0]).join('');
    const golden = G.Baths.list(S).map(b => b.id + (b.yuzuT > 0 ? '*' : '')).join(' ');
    console.log(simT.toFixed(0).padStart(5) + ' kit ' + S.kit.x.toFixed(0) + ',' + S.kit.y.toFixed(0) + ' trail [' + trail + '] rule ' + (a ? a.rule + ' ' + a.kind + ':' + (a.id || '') : '-') + ' | ' + golden + ' | stall ' + S.stall.stock + '+' + S.stall.pending + ' room ' + G.Stall.room(S) + ' | ' + bot.debug());
  }
}
