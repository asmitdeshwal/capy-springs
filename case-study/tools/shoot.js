#!/usr/bin/env node
// Screenshot driver for the Capy Springs capture rig.
//
//   1. node tools/serve.js 5199          (from the project root, in another terminal)
//   2. node case-study/tools/shoot.js [--profile=apple|play] [out-dir] [port]
//        node case-study/tools/shoot.js                      -> case-study/assets/screens/       (App Store, 1290 x 2796)
//        node case-study/tools/shoot.js --profile=play       -> case-study/assets/screens-play/  (Google Play, 1080 x 1920)
//
// Drives headless Chrome over the DevTools Protocol so every shot is an exact phone
// viewport. Profiles are CSS size x deviceScaleFactor:
//   apple  430 x 932 @3x = 1290 x 2796 px, the 6.9" iPhone size App Store Connect asks for
//   play   360 x 640 @3x = 1080 x 1920 px, a 9:16 phone shot for the Play Console
// Needs Node >= 22 for the built-in WebSocket and fetch. No npm packages.
'use strict';
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');

const PROFILES = {
  apple: { width: 430, height: 932, dpr: 3, dir: 'case-study/assets/screens' },
  play:  { width: 360, height: 640, dpr: 3, dir: 'case-study/assets/screens-play' },
};
const args = process.argv.slice(2), flag = args.find(a => a.startsWith('--profile=')), pos = args.filter(a => !a.startsWith('--'));
const profile = PROFILES[flag ? flag.slice('--profile='.length) : 'apple'];
if (!profile) { console.error('unknown profile; use --profile=' + Object.keys(PROFILES).join(' | ')); process.exit(1); }

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.resolve(pos[0] || profile.dir);
const srvPort = pos[1] || '5199';
const DP = 9333;
fs.mkdirSync(outDir, { recursive: true });

// name -> capture.html query. Keep these deterministic so a re-run reproduces the set.
const SHOTS = [
  { name: '01-first-run',     q: 't=5&day=1' },
  { name: '02-core-loop',     q: 't=70&day=1&stop=trail&trailn=4&max=200&stick=1' },
  { name: '03-splash-chain',  q: 't=120&day=1&stop=splash3&max=200' },
  { name: '04-soak-and-pay',  q: 't=330&day=1&stop=soak&soakn=5&max=200' },
  { name: '05-steam-rush',    q: 't=300&day=1&stop=rush&max=400' },
  { name: '06-upgrade-sheet', q: 't=480&day=1&sheet=cedar' },
  { name: '07-lantern-night', q: 't=760&night=1&stop=soak&soakn=3&max=60' },
  { name: '08-late-game',     q: 't=1500&day=1&stop=splash5&max=300' },
  { name: '09-offline-card',  q: 't=300&day=1&card=offline' },
  { name: '10-splash-x5',     q: 't=900&day=1&stop=splash5&max=300' },
  { name: '11-full-inn',      q: 't=1740&day=1&stop=soak&soakn=8&max=120' },
  { name: '12-cable-car',     q: 't=600&day=1&stop=car&max=120' },
];

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--remote-debugging-port=' + DP, '--user-data-dir=' + path.join(outDir, '_profile'),
  '--no-first-run', '--no-default-browser-check', 'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let list = null;
  for (let i = 0; i < 60 && !(list && list.length); i++) {
    try { list = await (await fetch(`http://127.0.0.1:${DP}/json/list`)).json(); } catch (e) { /* not up yet */ }
    if (!(list && list.length)) await sleep(250);
  }
  if (!list || !list.length) throw new Error('Chrome did not open a debugging target');

  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params) => new Promise(res => {
    const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params: params || {} }));
  });

  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: profile.width, height: profile.height, deviceScaleFactor: profile.dpr, mobile: true,
    screenWidth: profile.width, screenHeight: profile.height
  });
  console.log(`profile ${flag ? flag.slice('--profile='.length) : 'apple'}: ${profile.width * profile.dpr} x ${profile.height * profile.dpr} px -> ${outDir}`);

  for (const s of SHOTS) {
    await send('Page.navigate', { url: `http://127.0.0.1:${srvPort}/case-study/tools/capture.html?${s.q}` });
    let info = '';
    for (let i = 0; i < 200; i++) {                       // the rig sets document.title when the frame is drawn
      await sleep(200);
      const r = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
      const t = (r.result && r.result.result && r.result.result.value) || '';
      if (t.startsWith('READY')) { info = t.replace('READY ', ''); break; }
    }
    await sleep(150);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const b64 = shot.result && shot.result.data;
    if (!b64) { console.log('FAIL ' + s.name); continue; }
    const file = path.join(outDir, s.name + '.png');
    fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    console.log(`${s.name}  ${(fs.statSync(file).size / 1024).toFixed(0)}KB  ${info}`);
  }
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
