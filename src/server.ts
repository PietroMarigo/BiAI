// @ts-nocheck
import express from 'express';
import path from 'path';
import { loadCredentials } from './credentials';
import { fetchChatMessage } from './openrouter';
import { checkDbConnection } from './db';

export function startServer(port: number) {
  loadCredentials();
  checkDbConnection();

  const app = express();
  app.use(express.json());
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));

  // serve the login and registration pages
  app.get('/login', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
  });

  app.get('/register', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
  });

  const users: Record<string, string> = {};

  app.post('/register', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).send('Missing username or password');
      return;
    }
    if (users[username]) {
      res.status(409).send('User exists');
      return;
    }
    users[username] = password;
    res.status(201).send('Registered');
  });

  app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (users[username] === password) {
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  });

  app.get('/', async (_req, res) => {
    const message = await fetchChatMessage();
    res.type('text/plain').send(message);
  });

  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
  return server;
}
