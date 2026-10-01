#!/usr/bin/env node
// Capy Springs - share link for installing on a phone: starts the local server and a Cloudflare "quick tunnel", which gives the game a
// temporary https address (phones only install offline-capable web apps from https). Usage: node tools/share.js [port]   (Ctrl+C to stop)
// Needs cloudflared once:  winget install --id Cloudflare.cloudflared
'use strict';
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const wanted = Number(process.argv[2]) || 5173;

function findCloudflared() {
  const names = ['cloudflared', 'cloudflared.exe'];
  const dirs = (process.env.PATH || '').split(path.delimiter).concat([
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'cloudflared'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'cloudflared'),
    '/usr/local/bin', '/opt/homebrew/bin'
  ]);
  for (const d of dirs) for (const n of names) { const p = path.join(d, n); try { if (d && fs.statSync(p).isFile()) return p; } catch (e) { /* keep looking */ } }
  return null;
}
const exe = findCloudflared();
if (!exe) {
  console.log('\ncloudflared is not installed. Install it once (one command), then run this again:\n');
  console.log('  winget install --id Cloudflare.cloudflared\n');
  process.exit(1);
}
require('./serve.js').start(wanted).then(port => {
  console.log('\nOpening a temporary https link for your phone (this can take ~10 s)...');
  const cf = spawn(exe, ['tunnel', '--url', 'http://localhost:' + port, '--no-autoupdate'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let shown = false;
  function scan(chunk) {
    const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(String(chunk));
    if (m && !shown) {
      shown = true;
      console.log('\n==================================================================');
      console.log('  OPEN THIS ON THE PHONE:  ' + m[0]);
      console.log('==================================================================');
      console.log('  iPhone: open it in SAFARI, wait for the title screen, tap Share (the box with the arrow),');
      console.log('          then "Add to Home Screen", then "Add". Open it from the home screen once while');
      console.log('          this link is still running. After that it works offline, without this PC.');
      console.log('  Android: open it in Chrome, menu (three dots) -> "Install app" / "Add to Home screen".');
      console.log('  The link dies when you close this window (Ctrl+C). The installed app keeps working.\n');
    }
  }
  cf.stdout.on('data', scan); cf.stderr.on('data', scan);
  cf.on('exit', code => { console.log('tunnel closed (' + code + ')'); process.exit(0); });
  process.on('SIGINT', () => { cf.kill(); process.exit(0); });
}).catch(err => { console.error('could not start the server: ' + err.message); process.exit(1); });
