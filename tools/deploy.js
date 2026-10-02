#!/usr/bin/env node
// Capy Springs - deploy: bump the patch version (web + native projects), rebuild icons / service worker / dist, commit everything and push to GitHub.
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
const minor = process.argv.includes('--minor');                                  // npm run deploy -- --minor  for a bigger release (1.4.9 -> 1.5.0)
const next = minor ? m[1] + '.' + (Number(m[2]) + 1) + '.0' : m[1] + '.' + m[2] + '.' + (Number(m[3]) + 1);
fs.writeFileSync(cfg, s.replace(m[0], "G.VERSION = '" + next + "'"));
const pj = path.join(root, 'package.json'), p = JSON.parse(fs.readFileSync(pj, 'utf8')); p.version = next; fs.writeFileSync(pj, JSON.stringify(p, null, 2) + '\n');
console.log('version ' + m[1] + '.' + m[2] + '.' + m[3] + ' -> ' + next);

// 1b. keep the native projects in step, so a store build after a deploy already carries the right numbers:
//   android/app/build.gradle            versionName "X.Y.Z"  +  versionCode N
//   ios/App/App.xcodeproj/project.pbxproj  MARKETING_VERSION = X.Y.Z  +  CURRENT_PROJECT_VERSION = N   (every occurrence: Debug + Release)
// Both stores need the integer to grow on every upload, so N is derived from the version: major*10000 + minor*100 + patch (1.10.0 -> 11000).
// The regexes tolerate `versionCode 1` / `versionCode = 1`, quoted or unquoted pbxproj values, and leave the rest of the formatting alone.
syncNativeVersions(next);
function syncNativeVersions(ver) {
  const [maj, min, pat] = ver.split('.').map(Number), code = maj * 10000 + min * 100 + pat;
  const gradle = path.join(root, 'android/app/build.gradle'), pbx = path.join(root, 'ios/App/App.xcodeproj/project.pbxproj');
  if (fs.existsSync(gradle)) fs.writeFileSync(gradle, fs.readFileSync(gradle, 'utf8')
    .replace(/(\bversionCode\s*=?\s*)\d+/g, '$1' + code)
    .replace(/(\bversionName\s*=?\s*)"[^"]*"/g, '$1"' + ver + '"'));
  if (fs.existsSync(pbx)) fs.writeFileSync(pbx, fs.readFileSync(pbx, 'utf8')
    .replace(/(\bMARKETING_VERSION\s*=\s*)"?[^;"]*"?;/g, '$1' + ver + ';')
    .replace(/(\bCURRENT_PROJECT_VERSION\s*=\s*)"?[^;"]*"?;/g, '$1' + code + ';'));
  console.log('native: versionName / MARKETING_VERSION ' + ver + ', versionCode / CURRENT_PROJECT_VERSION ' + code);
}

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
  console.log('Phones that have the app installed get the new version the next time they open it online.');
}
