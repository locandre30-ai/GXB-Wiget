const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({app:'gxb-local',version:1})); return; }
  if (!['/', '/practice.html', '/index.html'].includes(url)) { res.writeHead(404).end('Not found'); return; }
  const file = path.resolve(root, '.' + (url === '/' ? '/practice.html' : url));
  if (!file.startsWith(root + path.sep) || path.relative(root, file).split(path.sep).some(p => p.startsWith('.'))) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(8766, '127.0.0.1', () => console.log('GXB preview: http://127.0.0.1:8766/practice.html'));

