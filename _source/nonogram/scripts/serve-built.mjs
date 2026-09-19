// Production-like local inspection: GitHub Pages compresses text and caches files.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
const root = path.resolve(process.argv[2] || '../publishing/h1soft.github.io');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.xml': 'application/xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.vtt': 'text/vtt',
  '.txt': 'text/plain',
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let filename = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      if (!filename.startsWith(root + path.sep) && filename !== root) {
        res.writeHead(403);
        return res.end();
      }
      if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
      let buffer = await fs.readFile(filename);
      let status = 200;
      const type = types[path.extname(filename)] || 'application/octet-stream';
      const headers = {
        'Content-Type': type,
        'Cache-Control': 'public,max-age=600',
        'Accept-Ranges': 'bytes',
      };
      if (req.headers.range) {
        const [, a, b] = req.headers.range.match(/bytes=(\d+)-(\d*)/) || [];
        if (a !== undefined) {
          const start = Number(a),
            end = b ? Math.min(Number(b), buffer.length - 1) : buffer.length - 1;
          headers['Content-Range'] = `bytes ${start}-${end}/${buffer.length}`;
          buffer = buffer.subarray(start, end + 1);
          status = 206;
        }
      } else if (
        /text|javascript|json|xml/.test(type) &&
        req.headers['accept-encoding']?.includes('gzip')
      ) {
        buffer = gzipSync(buffer);
        headers['Content-Encoding'] = 'gzip';
        headers.Vary = 'Accept-Encoding';
      }
      headers['Content-Length'] = buffer.length;
      res.writeHead(status, headers);
      res.end(req.method === 'HEAD' ? undefined : buffer);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  })
  .listen(8767, '127.0.0.1', () => console.log(`Serving ${root} at http://127.0.0.1:8767`));
