#!/usr/bin/env node
// Capy Springs - the signing keys for the store builds, made once on this computer and handed to GitHub as Actions secrets
// (the cloud builds in .github/workflows read them; docs/NATIVE_BUILD.md walks through it). You run this yourself:
//   npm run store-keys -- android                                  make the Android upload key (once) and set its 4 secrets
//   npm run store-keys -- ios <path to AuthKey_XXXXXXXXXX.p8> <issuer id>   set the App Store Connect key + a signing key (4 secrets)
//   npm run store-keys -- status                                   which secrets GitHub has
// Options: --no-github (only write the files), --dir <folder> (default: <home>/CapySprings-keys).
// The keys live OUTSIDE the project folder so they can never be committed. Back that folder up (USB stick or a private cloud drive):
// losing the Android upload key means asking Google to reset it; the Apple .p8 file can only be downloaded once.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2), flag = f => { const i = args.indexOf(f); if (i < 0) return null; args.splice(i, 1); return true; };
const opt = f => { const i = args.indexOf(f); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const noGithub = flag('--no-github'), dir = path.resolve(opt('--dir') || path.join(os.homedir(), 'CapySprings-keys'));
const [cmd, ...rest] = args;
const say = s => console.log(s), die = s => { console.error('\n' + s + '\n'); process.exit(1); };

function repo() {
  try { const u = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' }).trim(); const m = /github\.com[:/]([^/]+\/[^/.]+)/.exec(u); if (m) return m[1]; } catch (e) { /* none */ }
  die('Could not find the GitHub repository (git remote "origin").');
}
function ghReady() {
  if (noGithub) return false;
  try { execFileSync('gh', ['auth', 'status'], { stdio: 'pipe' }); return true; } catch (e) { say('(GitHub CLI not ready: run "gh auth login" first, or add the secrets by hand from the file below)'); return false; }
}
// values go to gh through stdin, never on a command line
function setSecrets(list) {
  const file = path.join(dir, 'github-secrets-' + cmd + '.txt');
  fs.writeFileSync(file, '# GitHub > ' + repo() + ' > Settings > Secrets and variables > Actions > New repository secret\n\n' + list.map(([k, v]) => '== ' + k + ' ==\n' + v + '\n').join('\n'), { mode: 0o600 });
  if (!ghReady()) { say('Secrets written to ' + file + ' (add each one on GitHub by hand).'); return; }
  for (const [k, v] of list) { execFileSync('gh', ['secret', 'set', k, '--repo', repo()], { input: v, stdio: ['pipe', 'pipe', 'inherit'] }); say('  set ' + k); }
  say('GitHub secrets set on ' + repo() + '. (A copy is in ' + file + '.)');
}
function find(names, extra, probe) {
  const exe = process.platform === 'win32' ? '.exe' : '';
  for (const n of names) { try { execFileSync(n, probe, { stdio: 'pipe' }); return n; } catch (e) { if (e.code !== 'ENOENT' && e.status !== undefined) return n; } }
  for (const base of extra) {
    if (base.includes('*')) {
      const [head, tail] = base.split('*');
      try { for (const d of fs.readdirSync(head)) { const p = path.join(head, d, tail) + exe; if (fs.existsSync(p)) return p; } } catch (e) { /* missing */ }
    } else if (fs.existsSync(base + exe)) return base + exe;
  }
  return null;
}

// ---- Android: an upload key (PKCS#12) made with keytool (any Java) or openssl (Git for Windows has one) ----
function android() {
  const p12 = path.join(dir, 'android-upload.p12'), info = path.join(dir, 'android-upload.txt');
  let pw;
  if (fs.existsSync(p12) && fs.existsSync(info)) {
    pw = (/password: (\S+)/.exec(fs.readFileSync(info, 'utf8')) || [])[1];
    if (!pw) die('Found ' + p12 + ' but no password in ' + info + '.');
    say('Using the existing upload key in ' + dir + ' (the same key must sign every update).');
  } else {
    pw = crypto.randomBytes(18).toString('base64url');
    const pf = process.env.ProgramFiles || 'C:/Program Files', home = process.env.JAVA_HOME;
    const J = (...a) => path.join(pf, ...a);
    const keytool = find(['keytool'], [home && path.join(home, 'bin', 'keytool'), J('Java', '*', 'bin', 'keytool'), J('Eclipse Adoptium', '*', 'bin', 'keytool'), J('Microsoft', '*', 'bin', 'keytool'), J('Android', 'Android Studio', 'jbr', 'bin', 'keytool')].filter(Boolean), ['-help']);
    if (keytool) {
      say('Making the upload key with ' + keytool);
      execFileSync(keytool, ['-genkeypair', '-storetype', 'PKCS12', '-keystore', p12, '-alias', 'upload', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
        '-storepass', pw, '-keypass', pw, '-dname', 'CN=Capy Springs upload key'], { stdio: 'pipe' });
    } else {
      const openssl = find(['openssl'], [J('Git', 'usr', 'bin', 'openssl'), J('Git', 'mingw64', 'bin', 'openssl')], ['version']);
      if (!openssl) die('Neither keytool (Java) nor openssl was found. Install Git for Windows or a Java JDK, then run this again.');
      say('Making the upload key with ' + openssl);
      const k = path.join(dir, 'tmp-key.pem'), c = path.join(dir, 'tmp-cert.pem');
      try {
        execFileSync(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', k, '-out', c, '-days', '10000', '-subj', '/CN=Capy Springs upload key'], { stdio: 'pipe' });
        execFileSync(openssl, ['pkcs12', '-export', '-inkey', k, '-in', c, '-name', 'upload', '-out', p12, '-passout', 'pass:' + pw], { stdio: 'pipe' });
      } finally { for (const f of [k, c]) try { fs.unlinkSync(f); } catch (e) { /* gone */ } }
    }
    fs.writeFileSync(info, 'Capy Springs - Android upload key. Keep this folder private and backed up.\nkeystore: android-upload.p12\nalias: upload\npassword: ' + pw + '\n', { mode: 0o600 });
    say('Upload key saved in ' + dir);
  }
  setSecrets([['CAPY_KEYSTORE_BASE64', fs.readFileSync(p12).toString('base64')], ['CAPY_KEYSTORE_PASSWORD', pw], ['CAPY_KEY_ALIAS', 'upload'], ['CAPY_KEY_PASSWORD', pw]]);
  say('\nNext: GitHub > Actions > Android build > Run workflow. The run\'s "capy-springs-play-bundle" is the .aab for Google Play.');
}

// ---- iOS: the App Store Connect API key (from the website) + a private key the cloud build uses for its distribution certificate ----
function ios() {
  const [p8, issuer, idArg] = rest;
  if (!p8 || !issuer) die('Usage: npm run store-keys -- ios <path to AuthKey_XXXXXXXXXX.p8> <issuer id>');
  if (!fs.existsSync(p8)) die('No file at ' + p8);
  const keyId = idArg || (/AuthKey_([A-Z0-9]{8,12})\.p8$/i.exec(path.basename(p8)) || [])[1];
  if (!keyId) die('Could not read the key id from the file name; add it as a third value: ... ios <file> <issuer id> <key id>');
  if (!/^[0-9a-f-]{36}$/i.test(issuer)) die('The issuer id looks like 57246542-96fe-1a63-e053-0824d011072a (App Store Connect > Users and Access > Integrations).');
  const p8text = fs.readFileSync(p8, 'utf8');
  try { crypto.createPrivateKey(p8text); } catch (e) { die('That .p8 file could not be read as a key.'); }
  fs.copyFileSync(p8, path.join(dir, path.basename(p8)));                  // Apple lets you download it only once: keep a copy with the rest
  const kf = path.join(dir, 'ios-signing-key.pem');
  if (!fs.existsSync(kf)) {
    fs.writeFileSync(kf, crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    say('Made the signing key ' + kf);
  } else say('Using the existing signing key ' + kf);
  setSecrets([['ASC_KEY_ID', keyId], ['ASC_ISSUER_ID', issuer], ['ASC_KEY_P8', p8text], ['IOS_CERT_KEY', fs.readFileSync(kf, 'utf8')]]);
  say('\nNext: GitHub > Actions > iOS build > Run workflow (upload ticked). The build appears in TestFlight about 20 minutes later.');
}

function status() {
  const want = ['CAPY_KEYSTORE_BASE64', 'CAPY_KEYSTORE_PASSWORD', 'CAPY_KEY_ALIAS', 'CAPY_KEY_PASSWORD', 'ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8', 'IOS_CERT_KEY'];
  let have = [];
  try { have = JSON.parse(execFileSync('gh', ['secret', 'list', '--repo', repo(), '--json', 'name'], { encoding: 'utf8' })).map(s => s.name); } catch (e) { die('Could not list the secrets (is the GitHub CLI logged in? "gh auth login").'); }
  for (const w of want) say((have.includes(w) ? '  set      ' : '  missing  ') + w);
}

if (cmd === 'status') status();
else if (cmd === 'android' || cmd === 'ios') { fs.mkdirSync(dir, { recursive: true }); (cmd === 'android' ? android : ios)(); }
else die('Usage:\n  npm run store-keys -- android\n  npm run store-keys -- ios <path to AuthKey_XXXXXXXXXX.p8> <issuer id>\n  npm run store-keys -- status');
