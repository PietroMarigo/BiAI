// @ts-nocheck
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import net from 'net';
function checkDbConnection() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 5432;

  return new Promise(resolve => {
    const socket = net.connect(port, host);
    socket.setTimeout(1000);
    socket.on('connect', () => {
      console.log('Database connection successful');
      socket.end();
      resolve(true);
    });
    socket.on('error', err => {
      console.log('Database connection failed:', err.message);
      resolve(false);
    });
    socket.on('timeout', () => {
      console.log('Database connection timed out');
      socket.destroy();
      resolve(false);
    });
  });
}

  checkDbConnection();
import dotenv form 'dotenv';

dotenv.config({path: 'credentials'});

async function fetchChatMessage(): Promise<string> {
  const apiKey = process.env.OPEN_ROUTER_KEY;
  if (!apiKey) {
    return 'Missing OPEN_ROUTER_KEY';
  }

  const data = JSON.stringify({
    model: 'deepseek/deepseek-r1-0528:free',
    messages: [{ role: 'user', content: 'Say hello to the world' }]
  });

  const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise(resolve => {
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        console.log('OpenRouter raw response:', body);
        try {
          const json = JSON.parse(body);
          const msg = json.choices?.[0]?.message?.content ?? 'No message';
          resolve(msg.trim());
        } catch (err) {
          resolve('Failed to parse OpenRouter response');
        }
      });
    });
    req.on('error', () => resolve('Failed to reach OpenRouter'));
    req.write(data);
    req.end();
  });
}

export function startServer(port: number) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
      const message = await fetchChatMessage();
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(message);
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
