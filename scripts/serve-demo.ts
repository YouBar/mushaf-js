/** Serves the repository root so examples/basic.html can load dist/, data/ and fonts/. */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT ?? 8090);
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
  const file = join(ROOT, path.endsWith('/') ? join(path, 'index.html') : path);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
  } catch {
    return res.writeHead(404).end('Not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Demo: http://localhost:${PORT}/examples/basic.html`));
