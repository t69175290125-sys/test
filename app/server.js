// Demo Shop — zero-dependency static server (works fully offline).
// Usage: node app/server.js   (PORT env var overrides the default 3100)

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3100;
const PUBLIC_DIR = path.join(__dirname, 'public');
const FEATURES_FILE = path.join(__dirname, 'features.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') return send(res, 200, JSON.stringify({ status: 'ok' }), MIME['.json']);

  // Read on every request so flipping a bug switch needs no restart
  if (url.pathname === '/features.json') {
    return fs.readFile(FEATURES_FILE, (err, data) =>
      err ? send(res, 500, 'features.json missing') : send(res, 200, data, MIME['.json']));
  }

  const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden');

  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    send(res, 200, data, MIME[path.extname(file)] ?? 'application/octet-stream');
  });
});

server.listen(PORT, () => console.log(`Demo Shop running on http://localhost:${PORT}`));
