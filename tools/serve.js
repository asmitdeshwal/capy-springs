// Tiny zero-dependency static file server for local playtesting.
// Usage: node tools/serve.js [port]   (default 5173; if that port is busy the next free one is used and printed)
// Then open http://localhost:<port> on this PC, or http://<your-LAN-ip>:<port> on your phone.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '..');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

function handler(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.normalize(path.join(root, urlPath));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found: ' + urlPath); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}
// starts on `port`, or on the next free port up to port + 20; resolves with the port actually used
function start(port, quiet) {
  return new Promise((resolve, reject) => {
    const wanted = port;
    const tryPort = p => {
      const server = http.createServer(handler);
      server.once('error', err => {
        if (err.code === 'EADDRINUSE' && p < wanted + 20) { if (!quiet) console.log('port ' + p + ' is busy, trying ' + (p + 1)); tryPort(p + 1); }
        else reject(err);
      });
      server.listen(p, '0.0.0.0', () => {
        if (!quiet) {
          const nets = os.networkInterfaces();
          const lan = Object.values(nets).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address);
          console.log(`Serving ${root}`);
          console.log(`  PC:    http://localhost:${p}`);
          for (const ip of lan) console.log(`  Phone: http://${ip}:${p}  (same Wi-Fi)`);
        }
        resolve(p);
      });
    };
    tryPort(port);
  });
}
module.exports = { start };
if (require.main === module) start(Number(process.argv[2]) || 5173).catch(err => { console.error('could not start the server: ' + err.message); process.exit(1); });
