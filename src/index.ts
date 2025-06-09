// @ts-nocheck
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

async function fetchChatMessage(): Promise<string> {
  const apiKey = process.env.OPEN_ROUTER_KEY;
    return 'Missing OPEN_ROUTER_KEY';

    model: 'deepseek-ai/deepseek-r1-0528',
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
        console.log('OpenRouter raw response:', body);
          resolve('Failed to parse OpenRouter response');
    req.on('error', () => resolve('Failed to reach OpenRouter'));
      const message = await fetchChatMessage();
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say hello to the world' }]
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
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
        console.log('OpenAI raw response:', body);
        try {
          const json = JSON.parse(body);
          const msg = json.choices?.[0]?.message?.content ?? 'No message';
          resolve(msg.trim());
        } catch (err) {
          resolve('Failed to parse OpenAI response');
        }
      });
    });
    req.on('error', () => resolve('Failed to reach OpenAI'));
    req.write(data);
    req.end();
  });
}

export function startServer(port: number) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
      const message = await fetchChatGPTMessage();
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
