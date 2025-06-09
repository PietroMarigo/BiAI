// @ts-nocheck
import https from 'https';

export async function fetchChatMessage(): Promise<string> {
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
        } catch {
          resolve('Failed to parse OpenRouter response');
        }
      });
    });
    req.on('error', () => resolve('Failed to reach OpenRouter'));
    req.write(data);
    req.end();
  });
}
