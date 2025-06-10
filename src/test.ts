// @ts-nocheck
import http from 'http';
import assert from 'assert';
import net from 'net';
import { startServer } from './server';

const PORT = 4000;
const DB_PORT = 15432;
let dbConnected = false;

const dbServer = net.createServer(socket => {
  dbConnected = true;
  socket.end();
});

dbServer.listen(DB_PORT, 'localhost', () => {
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = String(DB_PORT);

  const server = startServer(PORT);

  const registerData = JSON.stringify({
    username: 'user',
    password: 'pass',
    name: 'Test',
    surname: 'User',
    email: 'test@example.com'
  });
  const regOptions = {
    hostname: 'localhost',
    port: PORT,
    path: '/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(registerData)
    }
  };

  const regReq = http.request(regOptions, regRes => {
    regRes.resume();
    assert.strictEqual(regRes.statusCode, 201);

    const loginData = JSON.stringify({ username: 'user', password: 'pass' });
    const loginOptions = {
      hostname: 'localhost',
      port: PORT,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const loginReq = http.request(loginOptions, loginRes => {
      let cookie = '';
      if (loginRes.headers['set-cookie']) {
        cookie = (loginRes.headers['set-cookie'] as string[])[0];
      }
      loginRes.resume();
      assert.strictEqual(loginRes.statusCode, 200);

      const rootOptions = {
        hostname: 'localhost',
        port: PORT,
        path: '/',
        method: 'GET',
        headers: { cookie }
      };

      const rootReq = http.request(rootOptions, rootRes => {
        assert.strictEqual(rootRes.statusCode, 302);
        assert.strictEqual(rootRes.headers.location, '/homepage');
        const homeOptions = {
          hostname: 'localhost',
          port: PORT,
          path: '/homepage',
          method: 'GET',
          headers: { cookie }
        };
        const homeReq = http.request(homeOptions, homeRes => {
          let body = '';
          homeRes.on('data', chunk => { body += chunk; });
          homeRes.on('end', () => {
            server.close();
            dbServer.close();
            try {
              assert.ok(body.includes('Hello user'));
              assert.ok(dbConnected);
              console.log('Test passed');
              process.exit(0);
            } catch (err) {
              console.error('Test failed');
              process.exit(1);
            }
          });
        });
        homeReq.end();
      });
      rootReq.end();
    });
    loginReq.write(loginData);
    loginReq.end();
  });
  regReq.write(registerData);
  regReq.end();
});
