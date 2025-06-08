// @ts-nocheck
import http from 'http';
import fs from 'fs';
import path from 'path';

export function startServer(port: number) {
  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello World');
    } else if (req.url && req.url.startsWith('/public/')) {
      const filePath = path.join(__dirname, '..', req.url);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        const ext = path.extname(filePath);
        const contentType = ext === '.js' ? 'application/javascript' : ext === '.json' ? 'application/json' : 'text/html';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  return server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  startServer(PORT);
}
