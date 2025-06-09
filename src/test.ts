// @ts-nocheck
import http from 'http';
import assert from 'assert';
import net from 'net';
import { startServer } from './index';

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
      dbServer.close();
      try {
        assert.ok(data.length > 0);
        assert.ok(dbConnected);
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
    dbServer.close();
    console.error('Test error', err);
    process.exit(1);
  });

  req.end();
});
