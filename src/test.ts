// @ts-nocheck
import http from 'http';
import assert from 'assert';
import { startServer } from './index';

const PORT = 4000;

const server = startServer(PORT);

const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    server.close();
    try {
      assert.ok(data.length > 0);
      console.log('Test passed');
      process.exit(0);
    } catch (err) {
      console.error('Test failed');
      process.exit(1);
    }
  });
});

req.on('error', err => {
  server.close();
  console.error('Test error', err);
  process.exit(1);
});

req.end();
