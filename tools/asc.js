#!/usr/bin/env node
// Capy Springs - App Store Connect helper for the iOS cloud build (.github/workflows/ios.yml, docs/NATIVE_BUILD.md). No Mac needed.
//   node tools/asc.js signing <dir>   registers the bundle id when it is missing, finds (or creates) the Apple Distribution certificate that
//                                     belongs to the IOS_CERT_KEY secret, makes a fresh App Store provisioning profile, and writes into <dir>:
//                                     key.pem, cert.cer, profile.mobileprovision, upload.plist + export.plist (export options) and signing.env
//   node tools/asc.js p8 <file>      writes the ASC_KEY_P8 secret as a clean AuthKey .p8 file (for the upload)
//   node tools/asc.js patch <project.pbxproj> <team> <profile name> <identity>
//                                     switches the App target to manual signing with that profile (on the cloud machine only, never committed)
// Environment: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 (the text of the AuthKey_XXXX.p8 file), IOS_CERT_KEY (a PEM private key that
// tools/store_keys.js makes once), BUNDLE_ID (default com.asmitdeshwal.capysprings). Node 18+ (fetch, crypto), openssl for the one-time request.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const API = 'https://api.appstoreconnect.apple.com/v1/';
const PROFILE = 'Capy Springs App Store CI';

function fail(msg) { console.error('::error::' + msg); process.exit(1); }
const env = k => { const v = process.env[k]; if (!v || !v.trim()) fail('missing ' + k + ' (a GitHub secret, see docs/NATIVE_BUILD.md)'); return v.trim(); };
// a key pasted with or without its BEGIN/END lines, or with literal \n
function pem(s, label) {
  s = s.replace(/\\n/g, '\n').replace(/\r/g, '');
  if (s.includes('-----BEGIN')) return s.endsWith('\n') ? s : s + '\n';
  const body = s.replace(/\s+/g, '');
  return '-----BEGIN ' + label + '-----\n' + body.match(/.{1,64}/g).join('\n') + '\n-----END ' + label + '-----\n';
}
const b64u = b => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

// ---- the API: a short-lived ES256 token signed with the .p8 key ----
let jwt = null, jwtExp = 0;
function token() {
  const now = Math.floor(Date.now() / 1000);
  if (jwt && now < jwtExp - 60) return jwt;
  const head = b64u(JSON.stringify({ alg: 'ES256', kid: env('ASC_KEY_ID'), typ: 'JWT' }));
  const body = b64u(JSON.stringify({ iss: env('ASC_ISSUER_ID'), iat: now, exp: now + 900, aud: 'appstoreconnect-v1' }));
  let key; try { key = crypto.createPrivateKey(pem(env('ASC_KEY_P8'), 'PRIVATE KEY')); } catch (e) { fail('ASC_KEY_P8 is not a readable .p8 key: paste the whole AuthKey_XXXX.p8 file'); }
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  jwt = head + '.' + body + '.' + b64u(sig); jwtExp = now + 900;
  return jwt;
}
const HINT = {
  401: 'Apple refused the API key: check the ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_P8 secrets',
  403: 'the API key needs the Admin role (App Store Connect > Users and Access > Integrations > Team Keys)',
  409: 'if this is about certificates: an account holds at most a few Apple Distribution certificates; revoke an unused one at developer.apple.com > Certificates and run again'
};
async function call(method, url, body) {
  const res = await fetch(API + url, { method, headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = (json.errors || [])[0] || {};
    fail(method + ' ' + url.split('?')[0] + ' failed (' + res.status + '): ' + (e.title || '') + ' ' + (e.detail || '') + (HINT[res.status] ? ' -> ' + HINT[res.status] : ''));
  }
  return json;
}

// ---- the pieces of signing ----
async function bundleId(id) {
  const r = await call('GET', 'bundleIds?filter[identifier]=' + encodeURIComponent(id) + '&limit=200');
  const hit = (r.data || []).find(b => b.attributes.identifier === id);
  if (hit) return hit.id;
  console.log('registering the bundle id ' + id);
  return (await call('POST', 'bundleIds', { data: { type: 'bundleIds', attributes: { identifier: id, name: 'Capy Springs', platform: 'IOS' } } })).data.id;
}
const spki = k => k.export({ type: 'spki', format: 'der' });
async function certificate(keyPem, dir) {
  const ours = spki(crypto.createPublicKey(keyPem)), soon = Date.now() + 7 * 86400e3;
  const list = await call('GET', 'certificates?limit=200');
  for (const c of list.data || []) {
    const a = c.attributes;
    if ((a.certificateType !== 'DISTRIBUTION' && a.certificateType !== 'IOS_DISTRIBUTION') || !a.certificateContent || new Date(a.expirationDate).getTime() < soon) continue;
    const x = new crypto.X509Certificate(Buffer.from(a.certificateContent, 'base64'));
    if (spki(x.publicKey).equals(ours)) { console.log('using the certificate "' + a.name + '" (until ' + a.expirationDate.slice(0, 10) + ')'); return { id: c.id, x, type: a.certificateType }; }
  }
  // the first build (or after a year, when it expires): a certificate request from the key, made with openssl
  const csr = execFileSync('openssl', ['req', '-new', '-key', path.join(dir, 'key.pem'), '-subj', '/CN=Capy Springs/C=US'], { encoding: 'utf8' });
  console.log('creating an Apple Distribution certificate for this key');
  const r = await call('POST', 'certificates', { data: { type: 'certificates', attributes: { certificateType: 'DISTRIBUTION', csrContent: csr } } });
  return { id: r.data.id, x: new crypto.X509Certificate(Buffer.from(r.data.attributes.certificateContent, 'base64')), type: 'DISTRIBUTION' };
}
// a fresh App Store profile every build (the old one with the same name is removed): always valid, never stale
async function profile(bid, cid) {
  const old = await call('GET', 'profiles?filter[name]=' + encodeURIComponent(PROFILE) + '&limit=200');
  for (const p of old.data || []) if (p.attributes.name === PROFILE) await call('DELETE', 'profiles/' + p.id);
  const r = await call('POST', 'profiles', { data: { type: 'profiles', attributes: { name: PROFILE, profileType: 'IOS_APP_STORE' },
    relationships: { bundleId: { data: { type: 'bundleIds', id: bid } }, certificates: { data: [{ type: 'certificates', id: cid }] } } } });
  return { uuid: r.data.attributes.uuid, content: Buffer.from(r.data.attributes.profileContent, 'base64') };
}
const options = (dest, team, identity, bundle) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>${dest}</string>
  <key>teamID</key><string>${team}</string>
  <key>signingStyle</key><string>manual</string>
  <key>signingCertificate</key><string>${identity}</string>
  <key>provisioningProfiles</key><dict><key>${bundle}</key><string>${PROFILE}</string></dict>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
`;

async function signing(dir) {
  if (!dir) fail('usage: node tools/asc.js signing <dir>');
  fs.mkdirSync(dir, { recursive: true });
  const bundle = (process.env.BUNDLE_ID || 'com.asmitdeshwal.capysprings').trim();
  const keyPem = pem(env('IOS_CERT_KEY'), 'PRIVATE KEY');
  try { crypto.createPrivateKey(keyPem); } catch (e) { fail('IOS_CERT_KEY is not a readable private key (make it with: npm run store-keys -- ios ...)'); }
  fs.writeFileSync(path.join(dir, 'key.pem'), keyPem, { mode: 0o600 });
  const bid = await bundleId(bundle);
  const cert = await certificate(keyPem, dir);
  const team = (/OU=([A-Z0-9]{10})/.exec(cert.x.subject) || [])[1] || (process.env.APPLE_TEAM_ID || '').trim();
  if (!team) fail('could not read the team id from the certificate; add an APPLE_TEAM_ID secret (developer.apple.com > Membership)');
  const identity = cert.type === 'IOS_DISTRIBUTION' ? 'iPhone Distribution' : 'Apple Distribution';
  const prof = await profile(bid, cert.id);
  fs.writeFileSync(path.join(dir, 'cert.cer'), cert.x.raw);
  fs.writeFileSync(path.join(dir, 'profile.mobileprovision'), prof.content);
  fs.writeFileSync(path.join(dir, 'upload.plist'), options('upload', team, identity, bundle));
  fs.writeFileSync(path.join(dir, 'export.plist'), options('export', team, identity, bundle));
  fs.writeFileSync(path.join(dir, 'signing.env'), 'TEAM_ID=' + team + '\nPROFILE_NAME="' + PROFILE + '"\nPROFILE_UUID=' + prof.uuid + '\nIDENTITY="' + identity + '"\n');
  console.log('signing ready: team ' + team + ', profile ' + prof.uuid + ', ' + identity);
}

function patch(file, team, profileName, identity) {
  if (!file || !team || !profileName || !identity) fail('usage: node tools/asc.js patch <project.pbxproj> <team> <profile name> <identity>');
  let s = fs.readFileSync(file, 'utf8'), n = 0;
  s = s.replace(/^(\s+)CODE_SIGN_STYLE = Automatic;$/gm, (m, t) => { n++; return t + 'CODE_SIGN_STYLE = Manual;\n' + t + 'DEVELOPMENT_TEAM = ' + team + ';\n' + t + 'PROVISIONING_PROFILE_SPECIFIER = "' + profileName + '";\n' + t + '"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "' + identity + '";'; });
  if (!n) fail('no "CODE_SIGN_STYLE = Automatic;" found in ' + file);
  fs.writeFileSync(file, s);
  console.log('manual signing on ' + n + ' build configurations of the App target');
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'signing') signing(rest[0]).catch(e => fail(e && e.stack || String(e)));
else if (cmd === 'patch') patch(...rest);
else if (cmd === 'p8') { if (!rest[0]) fail('usage: node tools/asc.js p8 <file>'); fs.writeFileSync(rest[0], pem(env('ASC_KEY_P8'), 'PRIVATE KEY'), { mode: 0o600 }); }
else fail('usage: node tools/asc.js signing <dir> | p8 <file> | patch <project.pbxproj> <team> <profile name> <identity>');
