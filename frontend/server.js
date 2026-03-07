import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const indexFile = path.join(distDir, 'index.html');
const port = Number(process.env.PORT) || 8080;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

const sendFile = async (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext] || 'application/octet-stream';
  const fileStat = await stat(filePath);

  res.writeHead(200, {
    'Content-Length': fileStat.size,
    'Content-Type': contentType,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
  });

  createReadStream(filePath).pipe(res);
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const normalizedPath = path.normalize(decodeURIComponent(requestUrl.pathname)).replace(/^(\.\.[/\\])+/, '');
    const assetPath = normalizedPath === '/' ? indexFile : path.join(distDir, normalizedPath);

    if (assetPath.startsWith(distDir) && existsSync(assetPath)) {
      const fileStat = await stat(assetPath);
      if (fileStat.isFile()) {
        await sendFile(res, assetPath);
        return;
      }
    }

    await sendFile(res, indexFile);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Velo frontend listening on port ${port}`);
});
