#!/usr/bin/env node
// Capy Springs - put your real AdMob ids into the store apps (docs/MONETIZATION.md). Three files hold them:
//   src/02_data_ads.js (the four ad units + the test switch), android/.../res/values/strings.xml (Android app id), ios/App/App/Info.plist (iOS app id)
// Usage:
//   npm run ad-ids                       show what the apps use now
//   npm run ad-ids -- android-app=ca-app-pub-1234567890123456~1234567890 android-rewarded=ca-app-pub-1234567890123456/1234567890 ...
//                                        keys: android-app, ios-app, android-rewarded, android-interstitial, ios-rewarded, ios-interstitial
//   npm run ad-ids -- test               back to Google's test ids
// Real ads switch on (test: false) only once all four ad units are real. Afterwards: npm run deploy, then run the store builds.
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const F = { data: 'src/02_data_ads.js', strings: 'android/app/src/main/res/values/strings.xml', plist: 'ios/App/App/Info.plist' };
const read = f => fs.readFileSync(path.join(root, f), 'utf8'), write = (f, s) => fs.writeFileSync(path.join(root, f), s);
const TEST_PUB = '3940256099942544';
const TEST = { 'android-app': 'ca-app-pub-3940256099942544~3347511713', 'ios-app': 'ca-app-pub-3940256099942544~1458002511',
  'android-rewarded': 'ca-app-pub-3940256099942544/5224354917', 'android-interstitial': 'ca-app-pub-3940256099942544/1033173712',
  'ios-rewarded': 'ca-app-pub-3940256099942544/1712485313', 'ios-interstitial': 'ca-app-pub-3940256099942544/4411468910' };
const APP = /^ca-app-pub-(\d{16})~\d{10}$/, UNIT = /^ca-app-pub-(\d{16})\/\d{10}$/;
const RX = {
  rewarded: /(rewarded:\s*\{ android: ')([^']+)(', ios: ')([^']+)(' \})/,
  interstitial: /(interstitial:\s*\{ android: ')([^']+)(', ios: ')([^']+)(' \})/,
  test: /(\btest: )(true|false)(,)/,
  strings: /(<string name="admob_app_id">)([^<]+)(<\/string>)/,
  plist: /(<key>GADApplicationIdentifier<\/key>\s*<string>)([^<]+)(<\/string>)/
};
function grab(rx, s, i, file) { const m = rx.exec(s); if (!m) { console.error('Could not find the ad ids in ' + file + ' (was it edited by hand?)'); process.exit(1); } return m[i]; }

function current() {
  const d = read(F.data), s = read(F.strings), p = read(F.plist);
  return { 'android-app': grab(RX.strings, s, 2, F.strings), 'ios-app': grab(RX.plist, p, 2, F.plist),
    'android-rewarded': grab(RX.rewarded, d, 2, F.data), 'ios-rewarded': grab(RX.rewarded, d, 4, F.data),
    'android-interstitial': grab(RX.interstitial, d, 2, F.data), 'ios-interstitial': grab(RX.interstitial, d, 4, F.data),
    test: grab(RX.test, d, 2, F.data) === 'true' };
}
function show(v) {
  for (const k of Object.keys(TEST)) console.log('  ' + (k + ':').padEnd(22) + v[k] + (v[k].includes(TEST_PUB) ? '   (Google test id)' : ''));
  console.log('  ' + 'ads:'.padEnd(22) + (v.test ? 'TEST ads (earn nothing)' : 'REAL ads'));
}
function apply(v) {
  const units = ['android-rewarded', 'android-interstitial', 'ios-rewarded', 'ios-interstitial'];
  v.test = units.some(k => v[k].includes(TEST_PUB));
  let d = read(F.data);
  d = d.replace(RX.rewarded, (m, a, b, c, e, f) => a + v['android-rewarded'] + c + v['ios-rewarded'] + f);
  d = d.replace(RX.interstitial, (m, a, b, c, e, f) => a + v['android-interstitial'] + c + v['ios-interstitial'] + f);
  d = d.replace(RX.test, (m, a, b, c) => a + v.test + c);
  write(F.data, d);
  write(F.strings, read(F.strings).replace(RX.strings, (m, a, b, c) => a + v['android-app'] + c));
  write(F.plist, read(F.plist).replace(RX.plist, (m, a, b, c) => a + v['ios-app'] + c));
}

const args = process.argv.slice(2), v = current();
if (!args.length) { console.log('AdMob ids in the store apps now:'); show(v); process.exit(0); }
if (args[0] === 'test') { Object.assign(v, TEST); apply(v); console.log('Back to Google\'s test ids:'); show(current()); process.exit(0); }
const pubs = new Set();
for (const a of args) {
  const i = a.indexOf('='), k = a.slice(0, i).trim().toLowerCase(), val = a.slice(i + 1).trim();
  if (i < 0 || !(k in TEST)) { console.error('Unknown "' + a + '". Use key=value with these keys: ' + Object.keys(TEST).join(', ')); process.exit(1); }
  const m = (k.endsWith('-app') ? APP : UNIT).exec(val);
  if (!m) { console.error(k + ' should look like ' + (k.endsWith('-app') ? 'ca-app-pub-1234567890123456~1234567890 (an APP id, with ~)' : 'ca-app-pub-1234567890123456/1234567890 (an AD UNIT id, with /)') + ', not ' + val); process.exit(1); }
  if (m[1] !== TEST_PUB) pubs.add(m[1]);
  v[k] = val;
}
for (const k of Object.keys(TEST)) { const m = /ca-app-pub-(\d{16})/.exec(v[k]); if (m && m[1] !== TEST_PUB) pubs.add(m[1]); }
if (pubs.size > 1) { console.error('These ids come from different AdMob accounts (' + [...pubs].join(', ') + '). Use the ids of one account.'); process.exit(1); }
apply(v);
const now = current();
console.log('Updated. The store apps now use:'); show(now);
if (now.test) console.log('\nStill on test ads: real ads switch on once all four ad units are real ids.');
if (pubs.size) console.log('\nYour app-ads.txt line (docs/MONETIZATION.md):\n  google.com, pub-' + [...pubs][0] + ', DIRECT, f08c47fec0942fa0');
console.log('\nNext: npm run deploy (or ask Claude), then run the Android and iOS builds on GitHub.');
