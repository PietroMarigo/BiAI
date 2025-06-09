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

  const registerData = JSON.stringify({ username: 'user', password: 'pass' });
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
      loginRes.resume();
      assert.strictEqual(loginRes.statusCode, 200);

      const getOptions = {
        hostname: 'localhost',
        port: PORT,
        path: '/',
        method: 'GET'
      };

      const getReq = http.request(getOptions, getRes => {
        let body = '';
        getRes.on('data', chunk => { body += chunk; });
        getRes.on('end', () => {
          server.close();
          dbServer.close();
          try {
            assert.ok(body.length > 0);
            assert.ok(dbConnected);
            console.log('Test passed');
            process.exit(0);
          } catch (err) {
            console.error('Test failed');
            process.exit(1);
          }
        });
      });
      getReq.end();
    });
    loginReq.write(loginData);
    loginReq.end();
  });
  regReq.write(registerData);
  regReq.end();
});
