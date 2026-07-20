import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..', 'app');
const port = 4173;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url ?? '/', `http://${req.headers.host}`).pathname);
    const relative = urlPath === '/' ? 'index.html' : urlPath.slice(1);
    const filePath = path.resolve(appDir, relative);
    if (!filePath.startsWith(appDir + path.sep) && filePath !== appDir) {
      res.writeHead(403).end('Forbidden'); return;
    }
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('Not a file');
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Static server: http://127.0.0.1:${port}`));
