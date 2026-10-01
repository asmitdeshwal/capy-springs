#!/usr/bin/env node
// Capy Springs - deploy: bump the patch version, rebuild icons / service worker / dist, commit everything and push to GitHub.
// GitHub Pages rebuilds the site in about a minute; installed copies pick the new version up the next time they open online.
// Usage: npm run deploy   (or node tools/deploy.js)
'use strict';
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const run = (cmd, quiet) => execSync(cmd, { cwd: root, stdio: quiet ? 'pipe' : 'inherit' });

// 1. version bump (the script URLs carry ?v=<version> and the service worker's cache is named after it, so every deploy is a clean update)
const cfg = path.join(root, 'src/00_config.js');
let s = fs.readFileSync(cfg, 'utf8');
const m = /G\.VERSION = '(\d+)\.(\d+)\.(\d+)'/.exec(s);
if (!m) { console.error('could not find G.VERSION in src/00_config.js'); process.exit(1); }
const next = m[1] + '.' + m[2] + '.' + (Number(m[3]) + 1);
fs.writeFileSync(cfg, s.replace(m[0], "G.VERSION = '" + next + "'"));
const pj = path.join(root, 'package.json'), p = JSON.parse(fs.readFileSync(pj, 'utf8')); p.version = next; fs.writeFileSync(pj, JSON.stringify(p, null, 2) + '\n');
console.log('version ' + m[1] + '.' + m[2] + '.' + m[3] + ' -> ' + next);

// 2. rebuild, 3. commit, 4. push
run('node tools/pack.js');
run('git add -A');
const trailer = process.env.DEPLOY_TRAILER ? '\n\n' + process.env.DEPLOY_TRAILER : '';     // optional extra commit lines (e.g. a co-author)
try { run('git commit -q -m "Deploy v' + next + trailer.replace(/"/g, '\\"') + '"'); } catch (e) { console.log('nothing new to commit'); }
run('git push -q');

let remote = ''; try { remote = run('git remote get-url origin', true).toString().trim(); } catch (e) { /* no remote */ }
const gh = /github\.com[:/]([^/]+)\/([^/.]+)/.exec(remote);
if (gh) {
  console.log('\nPushed v' + next + '. GitHub Pages rebuilds in about a minute:');
  console.log('  https://' + gh[1].toLowerCase() + '.github.io/' + gh[2] + '/');
  console.log('Phones that have the app installed get the new version the next time they open it online (allow up to ~10 minutes).');
}
